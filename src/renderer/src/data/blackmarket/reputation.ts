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
    riskReduction: 3,
    priceDiscount: 2,
    unlockedCategories: ['intel', 'goods', 'finance', 'boost'],
    icon: 'mdi:account-question',
    color: '#8bc34a',
  },
  {
    tier: 2,
    nameKey: 'blackmarket.rep_tier_2',
    dealsRequired: 25,
    riskReduction: 5,
    priceDiscount: 3,
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

/**
 * Calculate an effective "deal score" combining completed deals and reputation points.
 * Every 5 reputation points count as 1 extra deal for tier purposes.
 * This ensures repReward, reputation_boost, and reputation_loss have tangible impact.
 */
export function effectiveDealScore(completedDeals: number, reputationPoints: number): number {
  return completedDeals + Math.floor(Math.max(0, reputationPoints) / 5)
}

/** Calculate current tier from completed deals and reputation points */
export function calculateTier(completedDeals: number, reputationPoints: number = 0): ReputationTier {
  const score = effectiveDealScore(completedDeals, reputationPoints)
  for (let i = REPUTATION_TIERS.length - 1; i >= 0; i--) {
    if (score >= REPUTATION_TIERS[i].dealsRequired) {
      return REPUTATION_TIERS[i].tier
    }
  }
  return 0
}

/** Get progress to next tier (0–1) */
export function getTierProgress(completedDeals: number, reputationPoints: number = 0): number {
  const score = effectiveDealScore(completedDeals, reputationPoints)
  const current = calculateTier(completedDeals, reputationPoints)
  if (current >= 5) return 1
  const currentDef = REPUTATION_TIERS[current]
  const nextDef = REPUTATION_TIERS[current + 1]
  const range = nextDef.dealsRequired - currentDef.dealsRequired
  const progress = score - currentDef.dealsRequired
  return Math.min(1, progress / range)
}
