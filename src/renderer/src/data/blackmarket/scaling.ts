/**
 * Black Market — Dynamic wealth-based scaling (percentage model)
 *
 * Costs and rewards scale as a **percentage of player wealth**, grouped
 * into four impact tiers:
 *
 *   minor     →  0.01% – 0.05%   (intel, small goods)
 *   standard  →  0.10% – 0.50%   (finance, boosts)
 *   major     →  0.50% – 2.00%   (special deals)
 *   legendary →  2.00% – 8.00%   (end-game schemes)
 *
 * Each deal/contact ability carries a `costWeight` (0–1) that positions
 * it within its tier's range.  The weight is derived automatically from
 * the old `baseCost` relative to the tier max, but can be overridden.
 *
 * Cash rewards keep a fixed ROI ratio relative to cost (defined per deal),
 * so the risk/reward proportion is constant across all wealth levels.
 *
 * Multiplier-based effects (income_boost, xp_boost …) are **never**
 * scaled — they are ratios that naturally compound with higher income.
 *
 * A minimum absolute floor prevents $0 costs early game.
 */
import Decimal from 'break_infinity.js'

// ─── Impact tiers ───────────────────────────────────────────────

export type ImpactTier = 'minor' | 'standard' | 'major' | 'legendary'

/** Wealth-percentage band per impact tier  [min%, max%] */
const TIER_BANDS: Record<ImpactTier, { min: number; max: number }> = {
  minor:     { min: 0.0001, max: 0.0005 },   // 0.01% – 0.05%
  standard:  { min: 0.001,  max: 0.005  },    // 0.10% – 0.50%
  major:     { min: 0.005,  max: 0.02   },    // 0.50% – 2.00%
  legendary: { min: 0.02,   max: 0.08   },    // 2.00% – 8.00%
}

/** Absolute floor so early-game deals are never free */
const COST_FLOOR: Record<ImpactTier, number> = {
  minor:     50,
  standard:  200,
  major:     1_000,
  legendary: 5_000,
}

// ─── Core percentage-based scaling ──────────────────────────────

/**
 * Compute the scaled cost for a deal or contact ability.
 *
 * @param wealth     - Player's current cash (Decimal or number).
 * @param impactTier - The impact category of the deal/ability.
 * @param costWeight - 0–1 position within the tier's percentage band.
 *                     0 → tier min%, 1 → tier max%.
 * @returns Scaled cost as a number (always ≥ tier floor).
 */
export function scalePercentageCost(
  wealth: Decimal | number,
  impactTier: ImpactTier,
  costWeight: number,
): number {
  const w = typeof wealth === 'number' ? wealth : wealth.toNumber()
  const band = TIER_BANDS[impactTier]
  const pct = band.min + Math.max(0, Math.min(1, costWeight)) * (band.max - band.min)
  const raw = w * pct
  return Math.max(COST_FLOOR[impactTier], Math.round(raw))
}

/**
 * Scale a cash reward relative to a cost and a fixed ROI ratio.
 * The ROI ratio is stored per-deal so risk/reward stays constant.
 *
 * @param cost     - The already-scaled cost.
 * @param roiRatio - How many times the cost the reward should be (e.g. 2.5).
 * @returns Scaled reward as a number.
 */
export function scaleCashReward(cost: number, roiRatio: number): number {
  return Math.round(cost * roiRatio)
}

// ─── Deal-specific helpers (drop-in replacements) ───────────────

/**
 * Scale deal cost.
 * Signature kept compatible — just delegates to percentage model.
 */
export function scaleDealCost(
  _baseCost: number,
  wealth: Decimal | number,
  impactTier: ImpactTier = 'minor',
  costWeight: number = 0.5,
): number {
  return scalePercentageCost(wealth, impactTier, costWeight)
}

/**
 * Scale a deal effect value.
 * Cash grants use the ROI model; everything else is untouched.
 */
export function scaleDealEffect(
  effectType: string,
  baseValue: number,
  _wealth: Decimal | number,
  scaledCost?: number,
  roiRatio?: number,
): number {
  switch (effectType) {
    case 'cash_grant':
      // If the caller supplies a pre-computed cost and ROI, use them
      if (scaledCost !== undefined && roiRatio !== undefined) {
        return scaleCashReward(scaledCost, roiRatio)
      }
      return baseValue // fallback: raw value (shouldn't happen)
    case 'heat_reduction':
    case 'reputation_boost':
      return baseValue // flat, not scaled
    default:
      return baseValue // multipliers don't scale — they're ratios
  }
}

/**
 * Scale a deal fail consequence value.
 * Cash losses are expressed as a fraction of the deal's scaled cost.
 */
export function scaleDealConsequence(
  consequenceType: string,
  baseValue: number,
  _wealth: Decimal | number,
  scaledCost?: number,
): number {
  switch (consequenceType) {
    case 'cash_loss':
      // baseValue is now a fraction (0–1) of scaled cost, e.g. 0.5 = lose 50% of cost
      if (scaledCost !== undefined) {
        return Math.round(scaledCost * baseValue)
      }
      return baseValue // fallback
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
export function scaleContactCost(
  _baseCost: number,
  wealth: Decimal | number,
  impactTier: ImpactTier = 'minor',
  costWeight: number = 0.5,
): number {
  if (_baseCost <= 0) return 0
  return scalePercentageCost(wealth, impactTier, costWeight)
}

/**
 * Scale contact ability reward (e.g. smuggler contraband value).
 * Uses ROI model off the contact's scaled cost.
 */
export function scaleContactReward(scaledCost: number, roiRatio: number): number {
  return scaleCashReward(scaledCost, roiRatio)
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
