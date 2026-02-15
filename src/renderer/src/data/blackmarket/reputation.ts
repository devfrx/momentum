/**
 * Black Market — Reputation tier definitions
 */
import type { ReputationTierDef, ReputationTier } from './types'

export const REPUTATION_TIERS: ReputationTierDef[] = [
  {
    tier: 0,
    nameKey: 'blackmarket.rep_tier_0',
    dealsRequired: 0,
    riskReduction: 0,
    priceDiscount: 0,
    unlockedCategories: ['intel', 'goods', 'finance'],
    icon: 'mdi:eye-off',
    color: '#9e9e9e',
  },
  {
    tier: 1,
    nameKey: 'blackmarket.rep_tier_1',
    dealsRequired: 10,
    riskReduction: 0,
    priceDiscount: 0,
    unlockedCategories: ['intel', 'goods', 'finance', 'boost'],
    icon: 'mdi:account-question',
    color: '#8bc34a',
  },
  {
    tier: 2,
    nameKey: 'blackmarket.rep_tier_2',
    dealsRequired: 25,
    riskReduction: 5,
    priceDiscount: 0,
    unlockedCategories: ['intel', 'goods', 'finance', 'boost', 'special'],
    icon: 'mdi:account-check',
    color: '#2196f3',
  },
  {
    tier: 3,
    nameKey: 'blackmarket.rep_tier_3',
    dealsRequired: 50,
    riskReduction: 10,
    priceDiscount: 5,
    unlockedCategories: ['intel', 'goods', 'finance', 'boost', 'special', 'legendary'],
    icon: 'mdi:shield-account',
    color: '#9c27b0',
  },
  {
    tier: 4,
    nameKey: 'blackmarket.rep_tier_4',
    dealsRequired: 100,
    riskReduction: 20,
    priceDiscount: 20,
    unlockedCategories: ['intel', 'goods', 'finance', 'boost', 'special', 'legendary'],
    icon: 'mdi:star-face',
    color: '#ff9800',
  },
  {
    tier: 5,
    nameKey: 'blackmarket.rep_tier_5',
    dealsRequired: 200,
    riskReduction: 30,
    priceDiscount: 25,
    unlockedCategories: ['intel', 'goods', 'finance', 'boost', 'special', 'legendary'],
    icon: 'mdi:crown',
    color: '#f44336',
  },
]

/** Get tier definition for a reputation level */
export function getReputationTier(tier: ReputationTier): ReputationTierDef {
  return REPUTATION_TIERS[tier]
}

/** Calculate current tier from total completed deals */
export function calculateTier(completedDeals: number): ReputationTier {
  for (let i = REPUTATION_TIERS.length - 1; i >= 0; i--) {
    if (completedDeals >= REPUTATION_TIERS[i].dealsRequired) {
      return REPUTATION_TIERS[i].tier
    }
  }
  return 0
}

/** Get progress to next tier (0–1) */
export function getTierProgress(completedDeals: number): number {
  const current = calculateTier(completedDeals)
  if (current >= 5) return 1
  const currentDef = REPUTATION_TIERS[current]
  const nextDef = REPUTATION_TIERS[current + 1]
  const range = nextDef.dealsRequired - currentDef.dealsRequired
  const progress = completedDeals - currentDef.dealsRequired
  return Math.min(1, progress / range)
}
