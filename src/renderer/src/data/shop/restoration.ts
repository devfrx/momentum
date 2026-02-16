/**
 * Online Shop — Item Restoration System
 *
 * Players can restore items in poor condition to increase their value.
 * The restoration workshop has a limited number of slots (upgradeable).
 * Each restoration step costs cash and takes time (ticks).
 *
 * Profit loop: buy damaged item cheap → restore → sell at higher value.
 */
import Decimal from 'break_infinity.js'
import { D, mul } from '@renderer/core/BigNum'
import type { StorageItem, ItemCondition } from '../storage/items'
import { RARITY_ORDER } from '../rarity'
import {
  RESTORATION_SLOT_BASE,
  RESTORATION_SLOT_MAX,
  RESTORATION_SLOT_UPGRADE_COST_BASE,
  RESTORATION_SLOT_UPGRADE_COST_GROWTH,
  RESTORATION_BASE_COST_FRACTION,
  RESTORATION_BASE_TICKS,
  RESTORATION_RARITY_COST_MULT,
  RESTORATION_RARITY_TIME_MULT,
} from './balance'

// ─── Condition Ladder ───────────────────────────────────────────

export const CONDITION_ORDER: ItemCondition[] = [
  'damaged', 'poor', 'fair', 'good', 'excellent', 'mint', 'pristine',
]

export const CONDITION_MULTIPLIERS: Record<ItemCondition, number> = {
  damaged: 0.35,
  poor: 0.55,
  fair: 0.80,
  good: 1.0,
  excellent: 1.15,
  mint: 1.35,
  pristine: 1.70,
}

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  damaged: 'Damaged',
  poor: 'Poor',
  fair: 'Fair',
  good: 'Good',
  excellent: 'Excellent',
  mint: 'Mint',
  pristine: 'Pristine',
}

export const CONDITION_ICONS: Record<ItemCondition, string> = {
  damaged: 'mdi:hammer-wrench',
  poor: 'mdi:wrench',
  fair: 'mdi:circle-half-full',
  good: 'mdi:check-circle-outline',
  excellent: 'mdi:star-half-full',
  mint: 'mdi:star',
  pristine: 'mdi:star-shooting',
}

export const CONDITION_COLORS: Record<ItemCondition, string> = {
  damaged: '#ef4444',
  poor: '#f97316',
  fair: '#eab308',
  good: '#22c55e',
  excellent: '#3b82f6',
  mint: '#a855f7',
  pristine: '#facc15',
}

// ─── Types ──────────────────────────────────────────────────────

export interface RestorationSlot {
  /** Unique slot ID. */
  id: string
  /** The item being restored. */
  item: StorageItem
  /** Where the item came from ('vault' | 'storage'). */
  source: 'vault' | 'storage'
  /** Condition when restoration started. */
  startCondition: ItemCondition
  /** Target condition after restoration. */
  targetCondition: ItemCondition
  /** Number of steps to restore (start → target). */
  totalSteps: number
  /** Current step progress (0-based). */
  currentStep: number
  /** Ticks remaining for the current step. */
  ticksRemaining: number
  /** Total ticks per step for this restoration. */
  ticksPerStep: number
  /** Cash cost for the entire restoration. */
  totalCost: Decimal
  /** Cash already paid. */
  paidCost: Decimal
  /** Whether the restoration is complete. */
  completed: boolean
}

// ─── Cost / Time Calculation ────────────────────────────────────

/**
 * Calculate restoration cost for improving an item from one condition to another.
 * Cost scales with item base value (good-condition) and rarity.
 */
export function calculateRestorationCost(
  item: StorageItem,
  fromCondition: ItemCondition,
  toCondition: ItemCondition,
): Decimal {
  const steps = getStepsBetween(fromCondition, toCondition)
  if (steps <= 0) return D(0)

  const baseValue = item.baseValue
  const rarityIdx = RARITY_ORDER[item.rarity] ?? 0
  const rarityMult = Math.pow(RESTORATION_RARITY_COST_MULT, rarityIdx)
  const costPerStep = mul(baseValue, D(RESTORATION_BASE_COST_FRACTION * rarityMult))

  return mul(costPerStep, D(steps))
}

/**
 * Calculate total ticks needed to restore from one condition to another.
 * Time scales with rarity.
 */
export function calculateRestorationTicks(
  item: StorageItem,
  fromCondition: ItemCondition,
  toCondition: ItemCondition,
): number {
  const steps = getStepsBetween(fromCondition, toCondition)
  if (steps <= 0) return 0

  const rarityIdx = RARITY_ORDER[item.rarity] ?? 0
  const rarityMult = Math.pow(RESTORATION_RARITY_TIME_MULT, rarityIdx)
  const ticksPerStep = Math.round(RESTORATION_BASE_TICKS * rarityMult)

  return ticksPerStep * steps
}

/**
 * Get ticks per single step for an item.
 */
export function getTicksPerStep(item: StorageItem): number {
  const rarityIdx = RARITY_ORDER[item.rarity] ?? 0
  const rarityMult = Math.pow(RESTORATION_RARITY_TIME_MULT, rarityIdx)
  return Math.round(RESTORATION_BASE_TICKS * rarityMult)
}

/**
 * Calculate the slot upgrade cost for the Nth upgrade.
 */
export function getSlotUpgradeCost(currentSlots: number): Decimal {
  if (currentSlots >= RESTORATION_SLOT_MAX) return D(Infinity)
  const upgradesCompleted = currentSlots - RESTORATION_SLOT_BASE
  return D(Math.round(
    RESTORATION_SLOT_UPGRADE_COST_BASE *
    Math.pow(RESTORATION_SLOT_UPGRADE_COST_GROWTH, upgradesCompleted),
  ))
}

/**
 * Get the next condition in the ladder.
 */
export function getNextCondition(current: ItemCondition): ItemCondition | null {
  const idx = CONDITION_ORDER.indexOf(current)
  if (idx === -1 || idx >= CONDITION_ORDER.length - 1) return null
  return CONDITION_ORDER[idx + 1]
}

/**
 * Get number of steps between two conditions.
 */
export function getStepsBetween(from: ItemCondition, to: ItemCondition): number {
  const fromIdx = CONDITION_ORDER.indexOf(from)
  const toIdx = CONDITION_ORDER.indexOf(to)
  return Math.max(0, toIdx - fromIdx)
}

/**
 * Recalculate an item's appraised value based on its condition.
 * baseValue is always the "good condition" value.
 */
export function getConditionAdjustedValue(
  baseValue: Decimal,
  condition: ItemCondition,
): Decimal {
  return mul(baseValue, D(CONDITION_MULTIPLIERS[condition]))
}

/**
 * Calculate the value of an item after restoration, preserving the appraisal
 * variance factor. If the item was appraised, the restored value scales the
 * appraised value by the ratio of (newCondMult / oldCondMult) so that lucky
 * / unlucky appraisal rolls are not lost during restoration.
 *
 * Falls back to plain `baseValue * newCondMult` for un-appraised items.
 */
export function getRestoredValue(
  item: { baseValue: Decimal; appraisedValue: Decimal | null; condition?: ItemCondition },
  newCondition: ItemCondition,
): Decimal {
  const oldCond: ItemCondition = item.condition ?? 'good'
  const oldMult = CONDITION_MULTIPLIERS[oldCond] ?? 1.0
  const newMult = CONDITION_MULTIPLIERS[newCondition] ?? 1.0

  if (item.appraisedValue && oldMult > 0) {
    // Scale the appraised value proportionally
    return item.appraisedValue.mul(newMult / oldMult)
  }
  // Fallback for un-appraised items
  return mul(item.baseValue, D(newMult))
}
