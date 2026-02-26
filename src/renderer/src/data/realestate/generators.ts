/**
 * Property Opportunity Generator — Procedural real estate deals
 *
 * Generates dynamic property opportunities with randomized attributes
 * and a location grade.  Opportunities persist until the next periodic
 * refresh.  Once purchased, they become permanent properties.
 *
 * Districts have been replaced by a lightweight LocationGrade system.
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'
import { type PropertyCategory, type LocationGrade, rollLocationGrade, getLocationGrade } from './locations'
import { PROPERTY_TEMPLATES, type PropertyTemplate } from './templates'
import { PROPERTY_TRAITS, type PropertyTrait } from './customizations'

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

export const OPPORTUNITY_REFRESH_TICKS = 90_000
export const MIN_OPPORTUNITIES = 2
export const MAX_OPPORTUNITIES = 5

export type ScoutPhase = 'none' | 'drive_by' | 'inspection' | 'appraisal'
export const SCOUT_PHASES: ScoutPhase[] = ['none', 'drive_by', 'inspection', 'appraisal']

export interface ScoutPhaseData {
  id: ScoutPhase
  nameKey: string
  icon: string
  costMultiplier: number
  revealsKey: string
}

export const SCOUT_PHASE_DATA: Record<ScoutPhase, ScoutPhaseData> = {
  none: { id: 'none', nameKey: 'realestate.scout.none', icon: 'mdi:help-circle-outline', costMultiplier: 0, revealsKey: '' },
  drive_by: { id: 'drive_by', nameKey: 'realestate.scout.drive_by', icon: 'mdi:car', costMultiplier: 0.05, revealsKey: 'realestate.scout.drive_by_reveals' },
  inspection: { id: 'inspection', nameKey: 'realestate.scout.inspection', icon: 'mdi:magnify', costMultiplier: 0.12, revealsKey: 'realestate.scout.inspection_reveals' },
  appraisal: { id: 'appraisal', nameKey: 'realestate.scout.appraisal', icon: 'mdi:file-document-check', costMultiplier: 0.25, revealsKey: 'realestate.scout.appraisal_reveals' },
}

export const APPRAISAL_DISCOUNT = 0.03

/** Cost to Scout the Market (scales with net worth).  Replaces per-district scan. */
export function getScoutMarketCost(netWorth: number): number {
  // Starts at $500, scales gently:  500 + 0.1% of net worth, capped at $5M
  return Math.min(5_000_000, Math.round(500 + netWorth * 0.001))
}

/** Scout the Market cooldown: 5 min real-time */
export const SCOUT_COOLDOWN_MS = 5 * 60 * 1000

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface PropertyOpportunity {
  id: string
  templateId: string
  name: string
  icon: string
  category: PropertyCategory
  locationGrade: LocationGrade

  askingPrice: Decimal
  trueValue: Decimal
  baseRent: Decimal
  units: number

  startingCondition: number
  wearRate: number
  taxRate: number
  baseAppreciationRate: number
  baseMaintenance: Decimal
  maxRenovationLevel: number
  renovationCostMultiplier: number

  traits: PropertyTrait[]

  scoutPhase: ScoutPhase
  scoutCosts: Record<ScoutPhase, number>

  appearedAt: number
  isHotDeal: boolean
  /** Whether this opportunity was found via market scout */
  isScanned: boolean
}

// ═══════════════════════════════════════════════════════════════════
// GENERATORS
// ═══════════════════════════════════════════════════════════════════

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

/** Interpolate a value within [min, max] using a 0-1 factor */
function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t
}

/** Clamp value between 0 and 1 */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/**
 * Add gaussian-ish noise to a 0-1 factor.
 * Uses the average of two uniform randoms for a softer bell shape.
 */
function noisyFactor(base: number, spread: number): number {
  const noise = ((Math.random() + Math.random()) / 2 - 0.5) * spread
  return clamp01(base + noise)
}

/** Street-style procedural name */
function generateName(template: PropertyTemplate): string {
  const suffixes = [
    `#${Math.floor(Math.random() * 999) + 1}`,
    ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],
    `${Math.floor(Math.random() * 200) + 1} ${['St', 'Ave', 'Blvd', 'Rd'][Math.floor(Math.random() * 4)]}`,
    ['Park', 'Hill', 'Heights', 'Bay', 'View', 'Lake'][Math.floor(Math.random() * 6)],
  ]
  return `${template.name} — ${pick(suffixes)}`
}

/**
 * Generate a single property opportunity.
 *
 * Uses a correlated quality system: a single `qualityFactor` (0–1) drives
 * both price and stats in the same direction, so pricier properties
 * *tend* to have better stats.  Per-stat noise (±0.2) and a ~12 % chance
 * of full correlation inversion ("diamond in the rough" / "overpriced dud")
 * keep things unpredictable.
 *
 * @param netWorth – Player's current net worth
 * @param currentTime – Date.now() for unique IDs
 * @param isScanned – true if generated by "Scout Market"
 * @param forceGrade – override random grade (for scout bonuses)
 */
export function generateOpportunity(
  netWorth: number,
  currentTime: number,
  isScanned = false,
  forceGrade?: LocationGrade,
): PropertyOpportunity {
  // 1. Grade
  const grade = forceGrade ?? rollLocationGrade(netWorth)
  const gradeData = getLocationGrade(grade)

  // 2. Template (pick one the player can afford)
  const eligible = PROPERTY_TEMPLATES.filter((t) => netWorth >= t.minNetWorth)
  const template = eligible.length > 0 ? pick(eligible) : PROPERTY_TEMPLATES[0]
  const category = pick(template.categories)

  // ── Quality-correlated generation ──────────────────────────────
  // qualityFactor 0 = worst possible within template, 1 = best possible
  const qualityFactor = Math.random()

  // ~12 % chance of anomaly: cheap-but-good or expensive-but-mediocre
  const isAnomaly = Math.random() < 0.12
  // For stats: if anomaly, invert the quality relative to price
  const statQuality = isAnomaly ? 1 - qualityFactor : qualityFactor

  // 3. Price — driven by qualityFactor (higher quality = higher price)
  const netWorthFactor = Math.max(1, Math.log10(Math.max(netWorth, 1000)))
  const priceBase = lerp(template.priceRange[0], template.priceRange[1], qualityFactor)
  const scaledPrice = priceBase * (1 + (netWorthFactor - 3) * 0.15)
  const askingPrice = D(Math.round(scaledPrice))

  // True value: higher quality → slightly above asking; lower → slightly below
  const valueCenter = isAnomaly
    ? lerp(0.95, 1.25, statQuality)   // anomalies can be real bargains
    : lerp(0.88, 1.12, statQuality)
  const valueVariance = valueCenter + rand(-0.04, 0.04)
  const trueValue = D(Math.round(scaledPrice * valueVariance))

  // 4. Rent — correlated with statQuality + noise (spread ±0.20)
  const rentFactor = noisyFactor(statQuality, 0.40)
  const baseRentNum = lerp(template.baseRentRange[0], template.baseRentRange[1], rentFactor)
  const baseRent = D(Math.round(baseRentNum * gradeData.rentMultiplier * 100) / 100)

  // 5. Units — correlated gently with statQuality
  const unitFactor = noisyFactor(statQuality, 0.50)
  const units = template.unitRange[0]
    + Math.floor(unitFactor * (template.unitRange[1] - template.unitRange[0] + 1))

  // 6. Condition — correlated with statQuality + noise
  const condFactor = noisyFactor(statQuality, 0.35)
  const startingCondition = Math.round(
    lerp(template.conditionRange[0], template.conditionRange[1], condFactor),
  )

  // 7. Wear rate — INVERSELY correlated (better quality = less wear)
  const wearFactor = noisyFactor(1 - statQuality, 0.35)
  const wearRate = lerp(template.wearRateRange[0], template.wearRateRange[1], wearFactor)

  // 8. Tax rate — INVERSELY correlated (better quality = lower tax)
  const taxFactor = noisyFactor(1 - statQuality, 0.40)
  const taxRate = lerp(template.taxRateRange[0], template.taxRateRange[1], taxFactor)

  // 9. Traits — biased by statQuality
  const positiveTraits = PROPERTY_TRAITS.filter((t) => t.isPositive)
  const negativeTraits = PROPERTY_TRAITS.filter((t) => !t.isPositive)
  const traitCount = Math.floor(rand(1, 3.5))
  let traits: PropertyTrait[]

  if (statQuality > 0.7) {
    // High quality: mostly positive traits
    const positiveCount = Math.min(traitCount, Math.ceil(traitCount * rand(0.7, 1.0)))
    const negativeCount = traitCount - positiveCount
    traits = [
      ...pickN(positiveTraits, positiveCount),
      ...pickN(negativeTraits, negativeCount),
    ]
  } else if (statQuality < 0.3) {
    // Low quality: mostly negative traits
    const negativeCount = Math.min(traitCount, Math.ceil(traitCount * rand(0.6, 1.0)))
    const positiveCount = traitCount - negativeCount
    traits = [
      ...pickN(negativeTraits, negativeCount),
      ...pickN(positiveTraits, positiveCount),
    ]
  } else {
    // Mid quality: fully random (as before)
    traits = pickN(PROPERTY_TRAITS, traitCount)
  }

  // 10. Hot deal
  const isHotDeal = Math.random() < 0.15

  // 11. Scout costs
  const priceNum = askingPrice.toNumber()
  const scoutCosts: Record<ScoutPhase, number> = {
    none: 0,
    drive_by: Math.round(priceNum * SCOUT_PHASE_DATA.drive_by.costMultiplier),
    inspection: Math.round(priceNum * SCOUT_PHASE_DATA.inspection.costMultiplier),
    appraisal: Math.round(priceNum * SCOUT_PHASE_DATA.appraisal.costMultiplier),
  }

  // 12. Appreciation — correlated with statQuality
  const appreciationBoost = lerp(0.85, 1.15, noisyFactor(statQuality, 0.30))
  const baseAppreciationRate = template.baseAppreciationRate
    * gradeData.appreciationMultiplier
    * appreciationBoost

  return {
    id: `prop_opp_${currentTime}_${Math.random().toString(36).slice(2, 8)}`,
    templateId: template.id,
    name: generateName(template),
    icon: template.icon,
    category,
    locationGrade: grade,
    askingPrice: isHotDeal ? D(Math.round(askingPrice.toNumber() * 0.9)) : askingPrice,
    trueValue,
    baseRent,
    units,
    startingCondition,
    wearRate,
    taxRate,
    baseAppreciationRate,
    baseMaintenance: D(Math.round(baseRentNum * template.maintenanceRatio * 100) / 100),
    maxRenovationLevel: template.maxRenovationLevel,
    renovationCostMultiplier: template.renovationCostMultiplier,
    traits,
    scoutPhase: 'none',
    scoutCosts,
    appearedAt: currentTime,
    isHotDeal,
    isScanned,
  }
}

/**
 * Generate premium opportunities from "Scout Market" action.
 * Better quality: biased toward higher grades, positive traits, slight value bump.
 */
export function generateScoutOpportunity(
  netWorth: number,
  currentTime: number,
): PropertyOpportunity {
  // Bias grade upward by rolling twice and keeping the better one
  const g1 = rollLocationGrade(netWorth)
  const g2 = rollLocationGrade(netWorth)
  const gradeOrder: LocationGrade[] = ['D', 'C', 'B', 'A', 'S']
  const grade = gradeOrder.indexOf(g1) >= gradeOrder.indexOf(g2) ? g1 : g2

  const opp = generateOpportunity(netWorth, currentTime, true, grade)
  // Scanned opportunities have slightly higher true value (better deal)
  opp.trueValue = D(Math.round(opp.trueValue.toNumber() * rand(1.05, 1.2)))
  // Bias traits toward positive
  if (opp.traits.length > 0 && opp.traits.every((t) => !t.isPositive)) {
    const positiveTraits = PROPERTY_TRAITS.filter((t) => t.isPositive)
    opp.traits[0] = pick(positiveTraits)
  }
  return opp
}

/**
 * Generate a batch of opportunities.
 */
export function generateOpportunityBatch(
  netWorth: number,
  currentTime: number,
  count: number,
): PropertyOpportunity[] {
  const opps: PropertyOpportunity[] = []
  for (let i = 0; i < count; i++) {
    opps.push(generateOpportunity(netWorth, currentTime))
  }
  return opps
}
