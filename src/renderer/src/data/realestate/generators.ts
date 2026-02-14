/**
 * Property Opportunity Generator — Procedural real estate deals
 *
 * Generates dynamic property opportunities discovered via district scanning.
 * Each opportunity has randomized attributes and location. Opportunities
 * persist until the next periodic refresh or scan replacement.
 * Once purchased, they become permanent properties.
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'
import { type District, type PropertyDistrictCategory } from './districts'
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

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface PropertyOpportunity {
  id: string
  templateId: string
  name: string
  icon: string
  category: PropertyDistrictCategory
  districtId: string
  location: [number, number]

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
  /** Whether this opportunity was found via district scan */
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

function scatterPoint(center: [number, number], radius: number): [number, number] {
  const angle = Math.random() * Math.PI * 2
  const r = Math.sqrt(Math.random()) * radius
  return [
    center[0] + r * Math.cos(angle),
    center[1] + r * Math.sin(angle),
  ]
}

function generateName(template: PropertyTemplate, district: District): string {
  const suffixes = [
    district.name,
    `#${Math.floor(Math.random() * 999) + 1}`,
    ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],
    `${Math.floor(Math.random() * 200) + 1} ${['St', 'Ave', 'Blvd', 'Rd'][Math.floor(Math.random() * 4)]}`,
  ]
  return `${template.name} — ${pick(suffixes)}`
}

export function generateOpportunity(
  netWorth: number,
  unlockedDistricts: District[],
  currentTime: number,
  isScanned = false,
): PropertyOpportunity {
  const district = pick(unlockedDistricts)

  const validTemplates = PROPERTY_TEMPLATES.filter(
    (t) =>
      t.categories.some((c) => district.preferredCategories.includes(c)) &&
      netWorth >= t.minNetWorth,
  )
  const template =
    validTemplates.length > 0 ? pick(validTemplates) : pick(PROPERTY_TEMPLATES)
  const category =
    pick(template.categories.filter((c) => district.preferredCategories.includes(c))) ||
    template.categories[0]

  const netWorthFactor = Math.max(1, Math.log10(Math.max(netWorth, 1000)))
  const priceBase =
    template.priceRange[0] +
    Math.random() * (template.priceRange[1] - template.priceRange[0])
  const scaledPrice = priceBase * (1 + (netWorthFactor - 3) * 0.15)
  const askingPrice = D(Math.round(scaledPrice))

  const valueVariance = rand(0.85, 1.15)
  const trueValue = D(Math.round(scaledPrice * valueVariance))

  const baseRentNum =
    template.baseRentRange[0] +
    Math.random() * (template.baseRentRange[1] - template.baseRentRange[0])
  const baseRent = D(
    Math.round(baseRentNum * district.rentMultiplier * 100) / 100,
  )

  const units =
    template.unitRange[0] +
    Math.floor(
      Math.random() * (template.unitRange[1] - template.unitRange[0] + 1),
    )

  const startingCondition = Math.round(
    rand(template.conditionRange[0], template.conditionRange[1]),
  )

  const traitCount = Math.floor(rand(1, 3.5))
  const traits = pickN(PROPERTY_TRAITS, traitCount)

  const isHotDeal = Math.random() < 0.15

  const priceNum = askingPrice.toNumber()
  const scoutCosts: Record<ScoutPhase, number> = {
    none: 0,
    drive_by: Math.round(priceNum * SCOUT_PHASE_DATA.drive_by.costMultiplier),
    inspection: Math.round(
      priceNum * SCOUT_PHASE_DATA.inspection.costMultiplier,
    ),
    appraisal: Math.round(
      priceNum * SCOUT_PHASE_DATA.appraisal.costMultiplier,
    ),
  }

  return {
    id: `prop_opp_${currentTime}_${Math.random().toString(36).slice(2, 8)}`,
    templateId: template.id,
    name: generateName(template, district),
    icon: template.icon,
    category,
    districtId: district.id,
    location: scatterPoint(district.center, district.radius),
    askingPrice: isHotDeal
      ? D(Math.round(askingPrice.toNumber() * 0.9))
      : askingPrice,
    trueValue,
    baseRent,
    units,
    startingCondition,
    wearRate: rand(template.wearRateRange[0], template.wearRateRange[1]),
    taxRate: rand(template.taxRateRange[0], template.taxRateRange[1]),
    baseAppreciationRate:
      template.baseAppreciationRate * district.appreciationMultiplier,
    baseMaintenance: D(
      Math.round(baseRentNum * template.maintenanceRatio * 100) / 100,
    ),
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
 * Generate a targeted opportunity for a specific district (via scan).
 * Better quality (higher value variance, more positive traits).
 */
export function generateScanOpportunity(
  netWorth: number,
  district: District,
  currentTime: number,
): PropertyOpportunity {
  const opp = generateOpportunity(netWorth, [district], currentTime, true)
  // Scanned opportunities are slightly better deals
  opp.trueValue = D(Math.round(opp.trueValue.toNumber() * rand(1.05, 1.2)))
  // Bias traits towards positive
  if (opp.traits.length > 0 && opp.traits.every((t) => !t.isPositive)) {
    const positiveTraits = PROPERTY_TRAITS.filter((t) => t.isPositive)
    opp.traits[0] = pick(positiveTraits)
  }
  return opp
}

export function generateOpportunityBatch(
  netWorth: number,
  unlockedDistricts: District[],
  currentTime: number,
  count: number,
): PropertyOpportunity[] {
  const opps: PropertyOpportunity[] = []
  for (let i = 0; i < count; i++) {
    opps.push(generateOpportunity(netWorth, unlockedDistricts, currentTime))
  }
  return opps
}


