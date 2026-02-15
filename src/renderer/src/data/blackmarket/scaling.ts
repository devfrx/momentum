/**
 * Black Market — Dynamic wealth-based scaling
 *
 * All deal costs, rewards, consequences, and contact ability values
 * scale logarithmically with player wealth to stay meaningful at every
 * progression stage.
 *
 * Formula: base × clamp(log10(wealth) − 1, 1, maxCap)
 * Example: wealth=50 → ×1, wealth=10k → ×3, wealth=1M → ×5, wealth=100M → ×7
 */
import Decimal from 'break_infinity.js'

// ─── Configuration ──────────────────────────────────────────────

/** Minimum multiplier (early game floor) */
const SCALE_FLOOR = 1

/** Maximum multiplier cap per category */
const SCALE_CAPS = {
  dealCost: 500,        // deal costs can scale up to 500x base
  dealReward: 500,      // deal rewards match cost scaling
  cashGrant: 500,       // instant cash payouts
  cashLoss: 200,        // fail consequences — gentler cap
  fineAmount: 50,       // investigation fines (already % based, gentler cap)
  contactCost: 500,     // contact ability costs
  contactReward: 500,   // contact ability rewards (contraband, fence, etc.)
} as const

type ScaleCategory = keyof typeof SCALE_CAPS

// ─── Core scaling ───────────────────────────────────────────────

/**
 * Compute wealth-based multiplier using log10 curve.
 * Returns a number ≥ 1 that represents how much to scale
 * base values for the given player wealth.
 *
 * @param wealth - Player's current cash (Decimal or number)
 * @param category - Which cap table to use
 */
export function wealthMultiplier(wealth: Decimal | number, category: ScaleCategory): number {
  const w = typeof wealth === 'number' ? wealth : wealth.toNumber()
  if (w <= 100) return SCALE_FLOOR
  const raw = Math.log10(w) - 1
  return Math.max(SCALE_FLOOR, Math.min(raw, SCALE_CAPS[category]))
}

/**
 * Scale a base value by player wealth.
 * @returns The scaled value as a number (always ≥ base)
 */
export function scaleByWealth(base: number, wealth: Decimal | number, category: ScaleCategory): number {
  return Math.round(base * wealthMultiplier(wealth, category))
}

// ─── Deal-specific helpers ──────────────────────────────────────

/**
 * Scale deal cost. Uses the raw base cost from the deal definition.
 */
export function scaleDealCost(baseCost: number, wealth: Decimal | number): number {
  return scaleByWealth(baseCost, wealth, 'dealCost')
}

/**
 * Scale a deal effect value. Only applies to cash-like effects.
 */
export function scaleDealEffect(effectType: string, baseValue: number, wealth: Decimal | number): number {
  switch (effectType) {
    case 'cash_grant':
      return scaleByWealth(baseValue, wealth, 'dealReward')
    case 'heat_reduction':
    case 'reputation_boost':
      return baseValue // flat, not scaled
    default:
      return baseValue // multipliers don't scale — they're ratios
  }
}

/**
 * Scale a deal fail consequence value.
 */
export function scaleDealConsequence(consequenceType: string, baseValue: number, wealth: Decimal | number): number {
  switch (consequenceType) {
    case 'cash_loss':
      return scaleByWealth(baseValue, wealth, 'cashLoss')
    case 'income_penalty':
    case 'heat_spike':
    case 'risk_increase':
    case 'investigation':
    case 'reputation_loss':
    case 'market_crash':
      return baseValue // flat
    default:
      return baseValue
  }
}

/**
 * Scale contact ability cost.
 */
export function scaleContactCost(baseCost: number, wealth: Decimal | number): number {
  if (baseCost <= 0) return 0
  return scaleByWealth(baseCost, wealth, 'contactCost')
}

/**
 * Scale contact ability reward (e.g. smuggler contraband value).
 */
export function scaleContactReward(baseValue: number, wealth: Decimal | number): number {
  return scaleByWealth(baseValue, wealth, 'contactReward')
}

// ─── Betrayal / scam probability ────────────────────────────────

/** Base chance (0-1) a contact betrays the player on any ability use */
export const BETRAYAL_BASE_CHANCE = 0.04

/** Additional betrayal chance per heat point above 40 */
export const BETRAYAL_HEAT_SCALING = 0.002

/** Chance the contact takes the money and gives nothing (scam) */
export const SCAM_BASE_CHANCE = 0.06

/** Low loyalty increases scam/betrayal chance */
export const LOYALTY_TRUST_THRESHOLD = 40

/** Extra scam chance when loyalty is below threshold */
export const LOW_LOYALTY_SCAM_BONUS = 0.10

/**
 * Calculate total betrayal chance for a contact interaction.
 * Betrayal = contact tips off authorities → investigation + heat spike.
 */
export function getBetrayalChance(heat: number, loyalty: number): number {
  let chance = BETRAYAL_BASE_CHANCE
  if (heat > 40) chance += (heat - 40) * BETRAYAL_HEAT_SCALING
  if (loyalty < LOYALTY_TRUST_THRESHOLD) chance += 0.05
  return Math.min(0.35, chance)
}

/**
 * Calculate scam chance for a contact interaction.
 * Scam = contact takes payment but delivers nothing/wrong result.
 */
export function getScamChance(loyalty: number): number {
  let chance = SCAM_BASE_CHANCE
  if (loyalty < LOYALTY_TRUST_THRESHOLD) chance += LOW_LOYALTY_SCAM_BONUS
  return Math.min(0.30, chance)
}

/**
 * Roll for negative outcome on a contact interaction.
 * Returns 'betrayal', 'scam', or null (safe).
 */
export function rollContactRisk(heat: number, loyalty: number): 'betrayal' | 'scam' | null {
  const roll = Math.random()
  const betrayalChance = getBetrayalChance(heat, loyalty)
  if (roll < betrayalChance) return 'betrayal'
  const scamChance = getScamChance(loyalty)
  if (roll < betrayalChance + scamChance) return 'scam'
  return null
}
