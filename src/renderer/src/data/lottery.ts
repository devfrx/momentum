/**
 * Lottery data definitions — ticket types, prize tiers, and draw mechanics.
 *
 * The lottery system offers multiple ticket types with increasing cost and reward potential.
 * Each ticket type has its own number range, picks count, and prize structure.
 * Bonus numbers provide extra chances at higher rewards.
 *
 * Integration points:
 * - gambling_luck multiplier affects prize payouts (via useUpgradeStore)
 * - sector_boost 'gambling' events modify win chances
 * - XP awarded on ticket purchase and wins
 */

import { RARITY_COLORS, type Rarity } from './rarity'
export { RARITY_COLORS }
export type { Rarity }

// ─── Types ──────────────────────────────────────────────────────

export type LotteryRarity = Rarity

export interface LotteryPrizeTier {
  /** How many main numbers must match */
  matchCount: number
  /** Whether the bonus number must also match */
  bonusRequired: boolean
  /** Payout multiplier relative to ticket cost */
  payoutMultiplier: number
  /** Display label */
  label: string
  /** Rarity label for UI feedback */
  rarity: LotteryRarity
  /** Unique ability ID granted on win (only for Divine Fate lottery) */
  grantsAbility?: string
}

export interface LotteryTicketDef {
  id: string
  name: string
  description: string
  icon: string
  /** Cost per ticket in cash */
  ticketCost: number
  /** Range of main numbers: 1..maxNumber */
  maxNumber: number
  /** How many main numbers the player picks */
  pickCount: number
  /** Whether this ticket type has a bonus number */
  hasBonus: boolean
  /** Range of bonus number: 1..bonusMax (if hasBonus) */
  bonusMax: number
  /** Prize tiers from lowest to highest */
  prizes: LotteryPrizeTier[]
  /** Accent color for UI */
  accent: string
  /** Draw animation duration (ms) */
  drawDuration: number
  /** Whether this ticket can grant unique abilities */
  grantsAbilities?: boolean
}

export interface LotteryDrawResult {
  /** The drawn main numbers */
  drawnNumbers: number[]
  /** The drawn bonus number (if applicable) */
  bonusNumber: number | null
  /** Player's picked numbers */
  playerNumbers: number[]
  /** Player's picked bonus number */
  playerBonus: number | null
  /** How many main numbers matched */
  matchedCount: number
  /** Whether bonus matched */
  bonusMatched: boolean
  /** The winning prize tier (null = no win) */
  prizeTier: LotteryPrizeTier | null
  /** Actual payout amount (after multipliers) */
  payout: number
}

// ─── Ticket definitions ─────────────────────────────────────────

export const LOTTERY_TICKETS: LotteryTicketDef[] = [
  {
    id: 'quick_pick',
    name: 'Quick Pick',
    description: 'Pick 3 numbers from 1–15. Simple and fast — ideal for beginners.',
    icon: 'mdi:lightning-bolt',
    ticketCost: 10,
    maxNumber: 15,
    pickCount: 3,
    hasBonus: false,
    bonusMax: 0,
    accent: '#22c55e',
    drawDuration: 2000,
    prizes: [
      { matchCount: 2, bonusRequired: false, payoutMultiplier: 3, label: '2 Match', rarity: 'common' },
      { matchCount: 3, bonusRequired: false, payoutMultiplier: 25, label: '3 Match', rarity: 'rare' },
    ],
  },
  {
    id: 'classic',
    name: 'Classic Lottery',
    description: 'Pick 5 numbers from 1–30 plus a bonus ball. The standard lottery experience.',
    icon: 'mdi:ticket',
    ticketCost: 50,
    maxNumber: 30,
    pickCount: 5,
    hasBonus: true,
    bonusMax: 10,
    accent: '#3b82f6',
    drawDuration: 4000,
    prizes: [
      { matchCount: 2, bonusRequired: false, payoutMultiplier: 1.5, label: '2 Match', rarity: 'common' },
      { matchCount: 3, bonusRequired: false, payoutMultiplier: 5, label: '3 Match', rarity: 'uncommon' },
      { matchCount: 3, bonusRequired: true, payoutMultiplier: 15, label: '3 + Bonus', rarity: 'rare' },
      { matchCount: 4, bonusRequired: false, payoutMultiplier: 50, label: '4 Match', rarity: 'rare' },
      { matchCount: 4, bonusRequired: true, payoutMultiplier: 200, label: '4 + Bonus', rarity: 'epic' },
      { matchCount: 5, bonusRequired: false, payoutMultiplier: 1000, label: '5 Match', rarity: 'legendary' },
      { matchCount: 5, bonusRequired: true, payoutMultiplier: 5000, label: 'JACKPOT', rarity: 'jackpot' },
    ],
  },
  {
    id: 'mega',
    name: 'Mega Millions',
    description: 'Pick 6 numbers from 1–45 plus a Power Ball. Massive jackpots await.',
    icon: 'mdi:star-circle',
    ticketCost: 250,
    maxNumber: 45,
    pickCount: 6,
    hasBonus: true,
    bonusMax: 15,
    accent: '#a855f7',
    drawDuration: 5000,
    prizes: [
      { matchCount: 2, bonusRequired: false, payoutMultiplier: 1, label: '2 Match', rarity: 'common' },
      { matchCount: 3, bonusRequired: false, payoutMultiplier: 4, label: '3 Match', rarity: 'common' },
      { matchCount: 3, bonusRequired: true, payoutMultiplier: 12, label: '3 + Power', rarity: 'uncommon' },
      { matchCount: 4, bonusRequired: false, payoutMultiplier: 40, label: '4 Match', rarity: 'rare' },
      { matchCount: 4, bonusRequired: true, payoutMultiplier: 150, label: '4 + Power', rarity: 'epic' },
      { matchCount: 5, bonusRequired: false, payoutMultiplier: 800, label: '5 Match', rarity: 'epic' },
      { matchCount: 5, bonusRequired: true, payoutMultiplier: 5000, label: '5 + Power', rarity: 'legendary' },
      { matchCount: 6, bonusRequired: false, payoutMultiplier: 25000, label: '6 Match', rarity: 'legendary' },
      { matchCount: 6, bonusRequired: true, payoutMultiplier: 100000, label: 'MEGA JACKPOT', rarity: 'jackpot' },
    ],
  },
  {
    id: 'instant',
    name: 'Lucky Numbers',
    description: 'Pick 4 numbers from 1–20. Fast draws and decent odds.',
    icon: 'mdi:numeric',
    ticketCost: 25,
    maxNumber: 20,
    pickCount: 4,
    hasBonus: false,
    bonusMax: 0,
    accent: '#f59e0b',
    drawDuration: 2500,
    prizes: [
      { matchCount: 2, bonusRequired: false, payoutMultiplier: 2, label: '2 Match', rarity: 'common' },
      { matchCount: 3, bonusRequired: false, payoutMultiplier: 15, label: '3 Match', rarity: 'uncommon' },
      { matchCount: 4, bonusRequired: false, payoutMultiplier: 150, label: '4 Match', rarity: 'epic' },
    ],
  },
  {
    id: 'ultra',
    name: 'ULTRA JACKPOT',
    description: 'Pick 8 numbers from 1–70 plus a Hyper Ball from 1–25. Insane odds, life-changing payouts. Are you feeling lucky?',
    icon: 'mdi:fire-circle',
    ticketCost: 5000,
    maxNumber: 70,
    pickCount: 8,
    hasBonus: true,
    bonusMax: 25,
    accent: '#ef4444',
    drawDuration: 7000,
    prizes: [
      { matchCount: 2, bonusRequired: false, payoutMultiplier: 0.5, label: '2 Match', rarity: 'common' },
      { matchCount: 3, bonusRequired: false, payoutMultiplier: 2, label: '3 Match', rarity: 'common' },
      { matchCount: 3, bonusRequired: true, payoutMultiplier: 6, label: '3 + Hyper', rarity: 'uncommon' },
      { matchCount: 4, bonusRequired: false, payoutMultiplier: 10, label: '4 Match', rarity: 'uncommon' },
      { matchCount: 4, bonusRequired: true, payoutMultiplier: 40, label: '4 + Hyper', rarity: 'rare' },
      { matchCount: 5, bonusRequired: false, payoutMultiplier: 100, label: '5 Match', rarity: 'rare' },
      { matchCount: 5, bonusRequired: true, payoutMultiplier: 500, label: '5 + Hyper', rarity: 'epic' },
      { matchCount: 6, bonusRequired: false, payoutMultiplier: 2500, label: '6 Match', rarity: 'epic' },
      { matchCount: 6, bonusRequired: true, payoutMultiplier: 15000, label: '6 + Hyper', rarity: 'legendary' },
      { matchCount: 7, bonusRequired: false, payoutMultiplier: 50000, label: '7 Match', rarity: 'legendary' },
      { matchCount: 7, bonusRequired: true, payoutMultiplier: 250000, label: '7 + Hyper', rarity: 'legendary' },
      { matchCount: 8, bonusRequired: false, payoutMultiplier: 1000000, label: '8 Match', rarity: 'jackpot' },
      { matchCount: 8, bonusRequired: true, payoutMultiplier: 10000000, label: 'ULTRA JACKPOT', rarity: 'jackpot' },
    ],
  },
  {
    id: 'cosmic',
    name: 'COSMIC INFINITY',
    description: 'Pick 10 numbers from 1–99 plus a Cosmic Orb from 1–50. The ultimate gamble — odds beyond comprehension, rewards beyond imagination.',
    icon: 'mdi:creation',
    ticketCost: 50000,
    maxNumber: 99,
    pickCount: 10,
    hasBonus: true,
    bonusMax: 50,
    accent: '#ec4899',
    drawDuration: 9000,
    prizes: [
      { matchCount: 3, bonusRequired: false, payoutMultiplier: 0.5, label: '3 Match', rarity: 'common' },
      { matchCount: 4, bonusRequired: false, payoutMultiplier: 2, label: '4 Match', rarity: 'common' },
      { matchCount: 4, bonusRequired: true, payoutMultiplier: 5, label: '4 + Orb', rarity: 'uncommon' },
      { matchCount: 5, bonusRequired: false, payoutMultiplier: 8, label: '5 Match', rarity: 'uncommon' },
      { matchCount: 5, bonusRequired: true, payoutMultiplier: 25, label: '5 + Orb', rarity: 'rare' },
      { matchCount: 6, bonusRequired: false, payoutMultiplier: 80, label: '6 Match', rarity: 'rare' },
      { matchCount: 6, bonusRequired: true, payoutMultiplier: 400, label: '6 + Orb', rarity: 'epic' },
      { matchCount: 7, bonusRequired: false, payoutMultiplier: 2000, label: '7 Match', rarity: 'epic' },
      { matchCount: 7, bonusRequired: true, payoutMultiplier: 15000, label: '7 + Orb', rarity: 'legendary' },
      { matchCount: 8, bonusRequired: false, payoutMultiplier: 100000, label: '8 Match', rarity: 'legendary' },
      { matchCount: 8, bonusRequired: true, payoutMultiplier: 500000, label: '8 + Orb', rarity: 'legendary' },
      { matchCount: 9, bonusRequired: false, payoutMultiplier: 5000000, label: '9 Match', rarity: 'jackpot' },
      { matchCount: 9, bonusRequired: true, payoutMultiplier: 50000000, label: '9 + Orb', rarity: 'jackpot' },
      { matchCount: 10, bonusRequired: false, payoutMultiplier: 200000000, label: '10 Match', rarity: 'jackpot' },
      { matchCount: 10, bonusRequired: true, payoutMultiplier: 1000000000, label: 'COSMIC INFINITY', rarity: 'jackpot' },
    ],
  },
  {
    id: 'divine',
    name: 'DIVINE FATE',
    description: 'Pick 12 numbers from 1–120 plus a Destiny Shard from 1–60. The rarest lottery in existence — winners receive a unique, permanent ability that cannot be obtained any other way.',
    icon: 'mdi:shimmer',
    ticketCost: 500000,
    maxNumber: 120,
    pickCount: 12,
    hasBonus: true,
    bonusMax: 60,
    accent: '#facc15',
    drawDuration: 12000,
    grantsAbilities: true,
    prizes: [
      { matchCount: 3, bonusRequired: false, payoutMultiplier: 0.3, label: '3 Match', rarity: 'common' },
      { matchCount: 4, bonusRequired: false, payoutMultiplier: 1, label: '4 Match', rarity: 'common' },
      { matchCount: 4, bonusRequired: true, payoutMultiplier: 3, label: '4 + Shard', rarity: 'uncommon' },
      { matchCount: 5, bonusRequired: false, payoutMultiplier: 5, label: '5 Match', rarity: 'uncommon' },
      { matchCount: 5, bonusRequired: true, payoutMultiplier: 15, label: '5 + Shard', rarity: 'rare' },
      { matchCount: 6, bonusRequired: false, payoutMultiplier: 40, label: '6 Match', rarity: 'rare' },
      { matchCount: 6, bonusRequired: true, payoutMultiplier: 200, label: '6 + Shard', rarity: 'epic' },
      { matchCount: 7, bonusRequired: false, payoutMultiplier: 1000, label: '7 Match', rarity: 'epic' },
      { matchCount: 7, bonusRequired: true, payoutMultiplier: 8000, label: '7 + Shard', rarity: 'legendary' },
      { matchCount: 8, bonusRequired: false, payoutMultiplier: 50000, label: '8 Match', rarity: 'legendary' },
      { matchCount: 8, bonusRequired: true, payoutMultiplier: 300000, label: '8 + Shard', rarity: 'legendary' },
      { matchCount: 9, bonusRequired: false, payoutMultiplier: 2000000, label: '9 Match', rarity: 'jackpot' },
      { matchCount: 9, bonusRequired: true, payoutMultiplier: 20000000, label: '9 + Shard', rarity: 'jackpot' },
      { matchCount: 10, bonusRequired: false, payoutMultiplier: 100000000, label: '10 Match', rarity: 'jackpot' },
      { matchCount: 10, bonusRequired: true, payoutMultiplier: 500000000, label: '10 + Shard', rarity: 'mythic' },
      { matchCount: 11, bonusRequired: false, payoutMultiplier: 2000000000, label: '11 Match', rarity: 'mythic' },
      { matchCount: 11, bonusRequired: true, payoutMultiplier: 10000000000, label: '11 + Shard', rarity: 'mythic' },
      { matchCount: 12, bonusRequired: false, payoutMultiplier: 50000000000, label: '12 Match', rarity: 'mythic' },
      { matchCount: 12, bonusRequired: true, payoutMultiplier: 500000000000, label: 'DIVINE JACKPOT', rarity: 'mythic', grantsAbility: 'omniscience' },
    ],
  },
]

// ─── Draw logic (pure functions) ────────────────────────────────

/**
 * Generate N unique random numbers in range [1, max].
 */
export function drawNumbers(count: number, max: number): number[] {
  const nums = new Set<number>()
  while (nums.size < count) {
    nums.add(Math.floor(Math.random() * max) + 1)
  }
  return Array.from(nums).sort((a, b) => a - b)
}

/**
 * Calculate how many of the player's numbers match the drawn numbers.
 */
export function countMatches(playerNumbers: number[], drawnNumbers: number[]): number {
  const drawnSet = new Set(drawnNumbers)
  return playerNumbers.filter((n) => drawnSet.has(n)).length
}

/**
 * Determine the best prize tier for a given match result.
 * Returns the highest-value matching tier, or null for no prize.
 */
export function determinePrize(
  matchCount: number,
  bonusMatched: boolean,
  prizes: LotteryPrizeTier[]
): LotteryPrizeTier | null {
  // Sort prizes descending by payout to find best match
  const sorted = [...prizes].sort((a, b) => b.payoutMultiplier - a.payoutMultiplier)

  for (const tier of sorted) {
    if (matchCount >= tier.matchCount) {
      if (tier.bonusRequired && !bonusMatched) continue
      // Exact or higher match count qualifies for this tier
      if (matchCount === tier.matchCount || (!tier.bonusRequired && matchCount > tier.matchCount)) {
        return tier
      }
    }
  }

  // Fallback: find exact matchCount
  for (const tier of sorted) {
    if (matchCount === tier.matchCount && (!tier.bonusRequired || bonusMatched)) {
      return tier
    }
  }

  return null
}

/**
 * Run a complete lottery draw and return the result.
 */
export function executeDraw(
  ticket: LotteryTicketDef,
  playerNumbers: number[],
  playerBonus: number | null
): Omit<LotteryDrawResult, 'payout'> {
  const drawnNumbers = drawNumbers(ticket.pickCount, ticket.maxNumber)
  const bonusNumber = ticket.hasBonus ? Math.floor(Math.random() * ticket.bonusMax) + 1 : null

  const matchedCount = countMatches(playerNumbers, drawnNumbers)
  const bonusMatched = ticket.hasBonus && playerBonus !== null && bonusNumber === playerBonus

  const prizeTier = determinePrize(matchedCount, bonusMatched, ticket.prizes)

  return {
    drawnNumbers,
    bonusNumber,
    playerNumbers,
    playerBonus,
    matchedCount,
    bonusMatched,
    prizeTier,
  }
}

// ─── Rarity colors re-exported from @renderer/data/rarity ──────

// ─── Divine Abilities (exclusive to Divine Fate lottery) ─────────

export interface DivineAbilityDef {
  id: string
  name: string
  description: string
  icon: string
  rarity: LotteryRarity
  /** Which prize tier in Divine Fate unlocks this ability (e.g. '6 + Shard') */
  source: string
  /** Multiplier effect: { target, value } — value is multiplicative (e.g. 1.1 = +10%) */
  effect: { target: string; value: number }
}

export const DIVINE_ABILITIES: DivineAbilityDef[] = [
  { id: 'omniscience', name: 'Omniscience', description: 'The ultimate blessing — permanent +50% to ALL income, luck, and prestige.', icon: 'mdi:white-balance-sunny', rarity: 'mythic', source: 'DIVINE JACKPOT', effect: { target: 'all_income', value: 1.50 } },
]

/** Get a divine ability definition by ID */
export function getDivineAbility(id: string): DivineAbilityDef | undefined {
  return DIVINE_ABILITIES.find(a => a.id === id)
}
