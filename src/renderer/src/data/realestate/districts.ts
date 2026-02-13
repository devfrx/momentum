/**
 * Districts — City neighborhoods for the interactive real estate map
 *
 * Each district has economic modifiers, synergy bonuses for owning multiples,
 * and scan mechanics that make the map interactive and useful.
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type PropertyDistrictCategory =
  | 'Residential'
  | 'Commercial'
  | 'Mixed'
  | 'Hospitality'
  | 'Luxury'
  | 'Industrial'

export type DistrictTier = 'starter' | 'mid' | 'premium' | 'elite'

export interface DistrictSynergyBonus {
  /** Minimum properties owned in district to activate */
  minProperties: number
  /** Additive bonus to rent (e.g., 0.05 = +5%) */
  rentBonus: number
  /** Bonus to appreciation rate */
  appreciationBonus: number
  /** Bonus to occupancy */
  occupancyBonus: number
  /** i18n label key */
  labelKey: string
}

export interface District {
  id: string
  name: string
  nameKey: string
  descriptionKey: string
  icon: string
  tier: DistrictTier
  preferredCategories: PropertyDistrictCategory[]
  center: [number, number]
  radius: number
  rentMultiplier: number
  appreciationMultiplier: number
  volatility: number
  color: string
  unlockNetWorth: number
  /** Cost to scan this district for hidden bonus opportunities */
  scanCost: number
  /** Synergy bonuses for owning multiple properties in this district */
  synergies: DistrictSynergyBonus[]
}

// ═══════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════

export const DISTRICTS: District[] = [
  // ── Starter ──
  {
    id: 'uptown',
    name: 'Uptown',
    nameKey: 'realestate.districts.uptown',
    descriptionKey: 'realestate.districts.uptown_desc',
    icon: 'mdi:home-city-outline',
    tier: 'starter',
    preferredCategories: ['Residential'],
    center: [40.785, -73.968],
    radius: 0.012,
    rentMultiplier: 1.0,
    appreciationMultiplier: 1.1,
    volatility: 0.15,
    color: '#6ee7b7',
    unlockNetWorth: 0,
    scanCost: 500,
    synergies: [
      { minProperties: 2, rentBonus: 0.03, appreciationBonus: 0.0002, occupancyBonus: 0.02, labelKey: 'realestate.synergy.neighborhood_presence' },
      { minProperties: 5, rentBonus: 0.08, appreciationBonus: 0.0005, occupancyBonus: 0.05, labelKey: 'realestate.synergy.local_monopoly' },
    ],
  },
  {
    id: 'old_town',
    name: 'Old Town',
    nameKey: 'realestate.districts.old_town',
    descriptionKey: 'realestate.districts.old_town_desc',
    icon: 'mdi:castle',
    tier: 'starter',
    preferredCategories: ['Residential', 'Mixed'],
    center: [40.720, -73.998],
    radius: 0.010,
    rentMultiplier: 0.85,
    appreciationMultiplier: 0.9,
    volatility: 0.10,
    color: '#d4a276',
    unlockNetWorth: 0,
    scanCost: 400,
    synergies: [
      { minProperties: 2, rentBonus: 0.04, appreciationBonus: 0.0003, occupancyBonus: 0.03, labelKey: 'realestate.synergy.neighborhood_presence' },
      { minProperties: 4, rentBonus: 0.10, appreciationBonus: 0.0008, occupancyBonus: 0.06, labelKey: 'realestate.synergy.heritage_district' },
    ],
  },

  // ── Mid ──
  {
    id: 'industrial',
    name: 'Industrial Zone',
    nameKey: 'realestate.districts.industrial',
    descriptionKey: 'realestate.districts.industrial_desc',
    icon: 'mdi:factory',
    tier: 'mid',
    preferredCategories: ['Industrial'],
    center: [40.650, -74.010],
    radius: 0.015,
    rentMultiplier: 0.7,
    appreciationMultiplier: 0.6,
    volatility: 0.10,
    color: '#94a3b8',
    unlockNetWorth: 50_000,
    scanCost: 2_000,
    synergies: [
      { minProperties: 2, rentBonus: 0.05, appreciationBonus: 0.0002, occupancyBonus: 0.02, labelKey: 'realestate.synergy.industrial_cluster' },
      { minProperties: 4, rentBonus: 0.12, appreciationBonus: 0.0006, occupancyBonus: 0.04, labelKey: 'realestate.synergy.logistics_hub' },
    ],
  },
  {
    id: 'midtown',
    name: 'Midtown',
    nameKey: 'realestate.districts.midtown',
    descriptionKey: 'realestate.districts.midtown_desc',
    icon: 'mdi:office-building-marker',
    tier: 'mid',
    preferredCategories: ['Commercial', 'Mixed', 'Hospitality'],
    center: [40.755, -73.985],
    radius: 0.014,
    rentMultiplier: 1.3,
    appreciationMultiplier: 1.2,
    volatility: 0.25,
    color: '#fbbf24',
    unlockNetWorth: 200_000,
    scanCost: 8_000,
    synergies: [
      { minProperties: 2, rentBonus: 0.04, appreciationBonus: 0.0003, occupancyBonus: 0.03, labelKey: 'realestate.synergy.commercial_strip' },
      { minProperties: 5, rentBonus: 0.10, appreciationBonus: 0.0008, occupancyBonus: 0.06, labelKey: 'realestate.synergy.business_district' },
    ],
  },

  // ── Premium ──
  {
    id: 'downtown',
    name: 'Downtown',
    nameKey: 'realestate.districts.downtown',
    descriptionKey: 'realestate.districts.downtown_desc',
    icon: 'mdi:city',
    tier: 'premium',
    preferredCategories: ['Commercial', 'Luxury'],
    center: [40.710, -74.008],
    radius: 0.012,
    rentMultiplier: 1.8,
    appreciationMultiplier: 1.5,
    volatility: 0.35,
    color: '#60a5fa',
    unlockNetWorth: 1_000_000,
    scanCost: 25_000,
    synergies: [
      { minProperties: 2, rentBonus: 0.05, appreciationBonus: 0.0004, occupancyBonus: 0.03, labelKey: 'realestate.synergy.prime_portfolio' },
      { minProperties: 4, rentBonus: 0.12, appreciationBonus: 0.001, occupancyBonus: 0.07, labelKey: 'realestate.synergy.downtown_empire' },
    ],
  },
  {
    id: 'tech_quarter',
    name: 'Tech Quarter',
    nameKey: 'realestate.districts.tech_quarter',
    descriptionKey: 'realestate.districts.tech_quarter_desc',
    icon: 'mdi:chip',
    tier: 'premium',
    preferredCategories: ['Commercial', 'Mixed'],
    center: [40.742, -73.990],
    radius: 0.010,
    rentMultiplier: 1.5,
    appreciationMultiplier: 1.8,
    volatility: 0.40,
    color: '#a78bfa',
    unlockNetWorth: 2_000_000,
    scanCost: 50_000,
    synergies: [
      { minProperties: 2, rentBonus: 0.05, appreciationBonus: 0.0006, occupancyBonus: 0.03, labelKey: 'realestate.synergy.tech_campus' },
      { minProperties: 4, rentBonus: 0.12, appreciationBonus: 0.0015, occupancyBonus: 0.06, labelKey: 'realestate.synergy.innovation_hub' },
    ],
  },
  {
    id: 'waterfront',
    name: 'Waterfront',
    nameKey: 'realestate.districts.waterfront',
    descriptionKey: 'realestate.districts.waterfront_desc',
    icon: 'mdi:waves',
    tier: 'premium',
    preferredCategories: ['Residential', 'Luxury', 'Hospitality'],
    center: [40.700, -74.018],
    radius: 0.013,
    rentMultiplier: 1.6,
    appreciationMultiplier: 1.4,
    volatility: 0.45,
    color: '#38bdf8',
    unlockNetWorth: 5_000_000,
    scanCost: 100_000,
    synergies: [
      { minProperties: 2, rentBonus: 0.06, appreciationBonus: 0.0005, occupancyBonus: 0.04, labelKey: 'realestate.synergy.waterfront_collection' },
      { minProperties: 4, rentBonus: 0.14, appreciationBonus: 0.0012, occupancyBonus: 0.08, labelKey: 'realestate.synergy.marina_district' },
    ],
  },

  // ── Elite ──
  {
    id: 'harbor',
    name: 'Harbor District',
    nameKey: 'realestate.districts.harbor',
    descriptionKey: 'realestate.districts.harbor_desc',
    icon: 'mdi:anchor',
    tier: 'elite',
    preferredCategories: ['Luxury', 'Hospitality'],
    center: [40.690, -74.045],
    radius: 0.011,
    rentMultiplier: 2.5,
    appreciationMultiplier: 2.0,
    volatility: 0.50,
    color: '#f472b6',
    unlockNetWorth: 25_000_000,
    scanCost: 500_000,
    synergies: [
      { minProperties: 2, rentBonus: 0.08, appreciationBonus: 0.0008, occupancyBonus: 0.05, labelKey: 'realestate.synergy.elite_enclave' },
      { minProperties: 3, rentBonus: 0.18, appreciationBonus: 0.002, occupancyBonus: 0.10, labelKey: 'realestate.synergy.harbor_crown' },
    ],
  },
  {
    id: 'skyline_heights',
    name: 'Skyline Heights',
    nameKey: 'realestate.districts.skyline_heights',
    descriptionKey: 'realestate.districts.skyline_heights_desc',
    icon: 'mdi:city-variant-outline',
    tier: 'elite',
    preferredCategories: ['Luxury', 'Commercial'],
    center: [40.760, -73.970],
    radius: 0.009,
    rentMultiplier: 3.0,
    appreciationMultiplier: 2.5,
    volatility: 0.55,
    color: '#e879f9',
    unlockNetWorth: 100_000_000,
    scanCost: 2_000_000,
    synergies: [
      { minProperties: 2, rentBonus: 0.10, appreciationBonus: 0.001, occupancyBonus: 0.06, labelKey: 'realestate.synergy.skyline_collection' },
      { minProperties: 3, rentBonus: 0.22, appreciationBonus: 0.003, occupancyBonus: 0.12, labelKey: 'realestate.synergy.sky_empire' },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

export function getDistrict(id: string): District | undefined {
  return DISTRICTS.find((d) => d.id === id)
}

export function getUnlockedDistricts(netWorth?: number): District[] {
  if (netWorth === undefined) return [...DISTRICTS]
  return DISTRICTS.filter((d) => netWorth >= d.unlockNetWorth)
}

export function getActiveSynergies(district: District, ownedCount: number): DistrictSynergyBonus[] {
  return district.synergies.filter((s) => ownedCount >= s.minProperties)
}

export function getCombinedSynergyBonus(district: District, ownedCount: number): {
  rentBonus: number
  appreciationBonus: number
  occupancyBonus: number
} {
  const active = getActiveSynergies(district, ownedCount)
  let rentBonus = 0
  let appreciationBonus = 0
  let occupancyBonus = 0
  for (const s of active) {
    rentBonus += s.rentBonus
    appreciationBonus += s.appreciationBonus
    occupancyBonus += s.occupancyBonus
  }
  return { rentBonus, appreciationBonus, occupancyBonus }
}
