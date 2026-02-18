/**
 * Synergies — bonuses between businesses of the same category
 *
 * Formula: synergyMult = 1 + 0.1 × (count - 1)^1.2
 * where count = number of businesses owned in the same category
 */
import type { BusinessCategory } from './definitions'

export interface SynergyBonus {
  category: BusinessCategory
  count: number
  multiplier: number
}

/**
 * Calculate synergy multiplier for a given category count
 * count=1 → 1.0 (no bonus), count=2 → 1.1, count=3 → 1.23, etc.
 */
export function synergyCategoryMultiplier(count: number): number {
  if (count <= 1) return 1.0
  return 1 + 0.1 * Math.pow(count - 1, 1.2)
}

/**
 * Get all synergy bonuses from owned business category counts
 */
export function getAllSynergies(categoryCounts: Record<string, number>): SynergyBonus[] {
  const synergies: SynergyBonus[] = []

  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > 1) {
      synergies.push({
        category: category as BusinessCategory,
        count,
        multiplier: synergyCategoryMultiplier(count),
      })
    }
  }

  return synergies
}

// ─── Geographic Tiers (Branches) ─────────────────────────────────

export type GeographicTier =
  | 'local'
  | 'regional'
  | 'national'
  | 'continental'
  | 'global'
  | 'interplanetary'

export interface GeoTierDef {
  tier: GeographicTier
  nameKey: string
  icon: string
  /** Min branches to achieve this tier */
  minBranches: number
  /** Revenue multiplier at this tier */
  revenueMultiplier: number
}

export const GEO_TIERS: GeoTierDef[] = [
  { tier: 'local', nameKey: 'business.geo_local', icon: 'mdi:map-marker', minBranches: 0, revenueMultiplier: 1.0 },
  { tier: 'regional', nameKey: 'business.geo_regional', icon: 'mdi:map', minBranches: 5, revenueMultiplier: 1.5 },
  { tier: 'national', nameKey: 'business.geo_national', icon: 'mdi:flag', minBranches: 12, revenueMultiplier: 2.5 },
  { tier: 'continental', nameKey: 'business.geo_continental', icon: 'mdi:earth', minBranches: 20, revenueMultiplier: 4.0 },
  { tier: 'global', nameKey: 'business.geo_global', icon: 'mdi:web', minBranches: 30, revenueMultiplier: 7.0 },
  { tier: 'interplanetary', nameKey: 'business.geo_interplanetary', icon: 'mdi:rocket-launch', minBranches: 45, revenueMultiplier: 12.0 },
]

/**
 * Get current geographic tier based on branch count
 */
export function getGeoTier(branches: number): GeoTierDef {
  let current = GEO_TIERS[0]
  for (const tier of GEO_TIERS) {
    if (branches >= tier.minBranches) current = tier
    else break
  }
  return current
}

/**
 * Get next geographic tier (or null if max)
 */
export function getNextGeoTier(branches: number): GeoTierDef | null {
  for (const tier of GEO_TIERS) {
    if (branches < tier.minBranches) return tier
  }
  return null
}

// ─── Mega-Corporation ────────────────────────────────────────────

export const MEGA_CORP_REQUIREMENTS = {
  minLevel: 25,
  minBranches: 15,
}

/**
 * Market dominance bonus: exponential bonus for having many businesses in same category
 * bonus = 1 + 0.05 × count^1.5
 */
export function marketDominanceMultiplier(countInCategory: number): number {
  if (countInCategory <= 0) return 1.0
  return 1 + 0.15 * Math.pow(countInCategory, 1.5)
}
