/**
 * Online Shop — Cyclical Demand System
 *
 * Categories experience demand fluctuations over time. When demand
 * is high for a category, sell prices increase (up to 2×).
 * When demand is low, sell prices decrease (down to 0.6×).
 *
 * The player can exploit these cycles: buy items when category is
 * cold and sell when it's trending for significant profit.
 */
import type { ShopCategory } from './items'
import {
  DEMAND_CYCLE_MIN_TICKS,
  DEMAND_CYCLE_MAX_TICKS,
  DEMAND_MIN_MULT,
  DEMAND_MAX_MULT,
  DEMAND_SURGE_CHANCE,
  DEMAND_SURGE_MULT_MIN,
  DEMAND_SURGE_MULT_MAX,
  DEMAND_LERP_SPEED,
  DEMAND_TRENDING_THRESHOLD,
  DEMAND_COLD_THRESHOLD,
} from './balance'

// ─── Types ──────────────────────────────────────────────────────

export interface CategoryDemand {
  /** The category this demand applies to. */
  category: ShopCategory
  /** Current smoothed demand multiplier (0.6–2.0). */
  current: number
  /** Target multiplier the current is lerping toward. */
  target: number
  /** Trend direction based on target vs current. */
  trend: 'rising' | 'falling' | 'stable'
  /** Tick when the target will be re-rolled. */
  nextCycleTick: number
  /** Whether this category is in a demand surge event. */
  surging: boolean
}

// ─── Category Flavor ────────────────────────────────────────────

/** User-friendly demand level label based on multiplier value. */
export function demandLevelLabel(mult: number): string {
  if (mult >= 1.8) return 'booming'
  if (mult >= DEMAND_TRENDING_THRESHOLD) return 'trending'
  if (mult >= 1.1) return 'warm'
  if (mult >= 0.9) return 'normal'
  if (mult >= DEMAND_COLD_THRESHOLD) return 'cooling'
  return 'cold'
}

/** Icon for demand level. */
export function demandLevelIcon(mult: number): string {
  if (mult >= 1.8) return 'mdi:fire'
  if (mult >= DEMAND_TRENDING_THRESHOLD) return 'mdi:trending-up'
  if (mult >= 1.1) return 'mdi:arrow-up'
  if (mult >= 0.9) return 'mdi:minus'
  if (mult >= DEMAND_COLD_THRESHOLD) return 'mdi:arrow-down'
  return 'mdi:snowflake'
}

/** CSS color class for demand level. */
export function demandLevelColor(mult: number): string {
  if (mult >= 1.8) return '#ef4444'
  if (mult >= DEMAND_TRENDING_THRESHOLD) return '#f59e0b'
  if (mult >= 1.1) return '#22c55e'
  if (mult >= 0.9) return 'var(--t-text-muted)'
  if (mult >= DEMAND_COLD_THRESHOLD) return '#3b82f6'
  return '#60a5fa'
}

// ─── Demand Generation ──────────────────────────────────────────

/** Initialize demand state for all shop categories. */
export function initDemandState(
  categories: ShopCategory[],
  currentTick: number,
): CategoryDemand[] {
  return categories.map(cat => {
    const cycleDuration = randomCycleDuration()
    return {
      category: cat,
      current: 1.0,
      target: rollDemandTarget(),
      trend: 'stable' as const,
      nextCycleTick: currentTick + cycleDuration,
      surging: false,
    }
  })
}

/** Tick the demand system: lerp toward targets, re-roll expired cycles. */
export function tickDemand(
  demands: CategoryDemand[],
  currentTick: number,
): CategoryDemand[] {
  return demands.map(d => {
    let { current, target, nextCycleTick, surging } = d

    // Re-roll target if cycle expired
    if (currentTick >= nextCycleTick) {
      // Chance of a demand surge
      if (Math.random() < DEMAND_SURGE_CHANCE) {
        target = DEMAND_SURGE_MULT_MIN + Math.random() * (DEMAND_SURGE_MULT_MAX - DEMAND_SURGE_MULT_MIN)
        surging = true
      } else {
        target = rollDemandTarget()
        surging = false
      }
      nextCycleTick = currentTick + randomCycleDuration()
    }

    // Smooth lerp toward target
    const diff = target - current
    if (Math.abs(diff) < 0.005) {
      current = target
    } else {
      current += diff * DEMAND_LERP_SPEED
    }

    // Clamp
    current = Math.max(DEMAND_MIN_MULT, Math.min(DEMAND_MAX_MULT, current))

    // Determine trend (use post-clamp diff for accuracy at edges)
    const clampedDiff = target - current
    const trend: CategoryDemand['trend'] =
      Math.abs(clampedDiff) < 0.03 ? 'stable' : clampedDiff > 0 ? 'rising' : 'falling'

    return { ...d, current, target, trend, nextCycleTick, surging }
  })
}

// ─── Helpers ────────────────────────────────────────────────────

function rollDemandTarget(): number {
  // Weighted toward normal (1.0) with occasional extremes
  const roll = Math.random()
  if (roll < 0.15) return DEMAND_MIN_MULT + Math.random() * 0.2       // cold: 0.6-0.8
  if (roll < 0.30) return 0.8 + Math.random() * 0.15                   // cooling: 0.8-0.95
  if (roll < 0.65) return 0.95 + Math.random() * 0.15                  // normal: 0.95-1.10
  if (roll < 0.85) return 1.10 + Math.random() * 0.3                   // warm: 1.10-1.40
  return DEMAND_TRENDING_THRESHOLD + Math.random() * 0.5                // trending: 1.40-1.90
}

function randomCycleDuration(): number {
  return DEMAND_CYCLE_MIN_TICKS +
    Math.floor(Math.random() * (DEMAND_CYCLE_MAX_TICKS - DEMAND_CYCLE_MIN_TICKS))
}
