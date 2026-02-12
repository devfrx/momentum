/**
 * Prestige Upgrades — Repeatable level-based upgrades
 *
 * These are purchased with prestige points and can be leveled up
 * multiple times. Each level increases the effect and the cost.
 */
import { D } from '@renderer/core/BigNum'
import type { PrestigeUpgradeDef } from './types'

export const PRESTIGE_UPGRADES: PrestigeUpgradeDef[] = [
  // ─── Income Category ────────────────────────────────────────────
  {
    id: 'pup_global_1',
    name: 'Compound Growth',
    description: 'All income sources are permanently boosted.',
    icon: 'mdi:trophy',
    cost: D(3),
    costScaling: 2.5,
    maxLevel: 10,
    effectType: 'global_multiplier',
    effectValue: 0.03,
    category: 'income',
  },
  {
    id: 'pup_global_2',
    name: 'Solid Foundations',
    description: 'Build upon a stable economic base.',
    icon: 'mdi:castle',
    cost: D(15),
    costScaling: 3,
    maxLevel: 5,
    effectType: 'global_multiplier',
    effectValue: 0.05,
    category: 'income',
  },
  {
    id: 'pup_business_boost',
    name: 'Business Acumen',
    description: 'All business revenue is multiplied.',
    icon: 'mdi:store',
    cost: D(8),
    costScaling: 2.2,
    maxLevel: 8,
    effectType: 'business_revenue',
    effectValue: 0.02,
    category: 'income',
  },
  {
    id: 'pup_investment_boost',
    name: 'Investment Guru',
    description: 'Better returns on stocks and crypto.',
    icon: 'mdi:chart-line',
    cost: D(20),
    costScaling: 2.5,
    maxLevel: 6,
    effectType: 'stock_returns',
    effectValue: 0.02,
    category: 'income',
  },
  {
    id: 'pup_realestate_boost',
    name: 'Rental Efficiency',
    description: 'Increased rental income from all properties.',
    icon: 'mdi:home-city',
    cost: D(10),
    costScaling: 2.3,
    maxLevel: 7,
    effectType: 'real_estate_income',
    effectValue: 0.02,
    category: 'income',
  },

  // ─── Progression Category ───────────────────────────────────────
  {
    id: 'pup_prestige_gain',
    name: 'Prestige Amplifier',
    description: 'Earn more prestige points on each rebirth.',
    icon: 'mdi:star-plus',
    cost: D(10),
    costScaling: 2.8,
    maxLevel: 10,
    effectType: 'prestige_gain',
    effectValue: 0.03,
    category: 'progression',
  },
  {
    id: 'pup_xp_boost',
    name: 'Wisdom of Ages',
    description: 'Gain XP faster, leveling up more quickly.',
    icon: 'mdi:book-education',
    cost: D(8),
    costScaling: 2,
    maxLevel: 8,
    effectType: 'xp_gain',
    effectValue: 0.02,
    category: 'progression',
  },
  {
    id: 'pup_job_efficiency',
    name: 'Hustle Memory',
    description: 'Jobs start more efficient after each rebirth.',
    icon: 'mdi:briefcase-clock',
    cost: D(3),
    costScaling: 2,
    maxLevel: 5,
    effectType: 'job_efficiency',
    effectValue: 0.06,
    category: 'progression',
  },

  // ─── Quality of Life Category ───────────────────────────────────
  {
    id: 'pup_offline',
    name: 'Dream Worker',
    description: 'Earn more while you are away from the game.',
    icon: 'mdi:sleep',
    cost: D(10),
    costScaling: 3,
    maxLevel: 5,
    effectType: 'offline_bonus',
    effectValue: 0.03,
    category: 'quality_of_life',
  },
  {
    id: 'pup_cost_reduction',
    name: 'Efficiency Expert',
    description: 'Reduce all operating costs across your operations.',
    icon: 'mdi:sale',
    cost: D(12),
    costScaling: 2.5,
    maxLevel: 5,
    effectType: 'cost_reduction',
    effectValue: 0.01,
    category: 'quality_of_life',
  },
  {
    id: 'pup_loan_discount',
    name: 'Creditor Trust',
    description: 'Better loan rates across all financial institutions.',
    icon: 'mdi:bank-transfer',
    cost: D(12),
    costScaling: 2,
    maxLevel: 5,
    effectType: 'loan_discount',
    effectValue: 0.005,
    category: 'quality_of_life',
  },

  // ─── Starting Bonus Category ────────────────────────────────────
  {
    id: 'pup_starting_cash',
    name: 'Trust Fund',
    description: 'Start each rebirth with bonus cash.',
    icon: 'mdi:cash-plus',
    cost: D(8),
    costScaling: 2,
    maxLevel: 10,
    effectType: 'starting_cash',
    effectValue: 10000,
    category: 'starting_bonus',
  },
  {
    id: 'pup_starting_xp',
    name: 'Born Genius',
    description: 'Start each rebirth with bonus XP.',
    icon: 'mdi:lightbulb-on',
    cost: D(6),
    costScaling: 1.8,
    maxLevel: 8,
    effectType: 'starting_xp',
    effectValue: 100,
    category: 'starting_bonus',
  },

  // ─── Unlock Category ────────────────────────────────────────────
  {
    id: 'pup_unlock_crypto',
    name: 'Crypto Pioneer',
    description: 'Unlock crypto trading from the start of each run.',
    icon: 'mdi:bitcoin',
    cost: D(15),
    costScaling: 1,
    maxLevel: 1,
    effectType: 'unlock',
    effectValue: 1,
    category: 'starting_bonus',
  },
]

/**
 * Get upgrades by category
 */
export function getUpgradesByCategory(category: PrestigeUpgradeDef['category']): PrestigeUpgradeDef[] {
  return PRESTIGE_UPGRADES.filter(u => u.category === category)
}

/**
 * Get all unique categories
 */
export function getUpgradeCategories(): PrestigeUpgradeDef['category'][] {
  return [...new Set(PRESTIGE_UPGRADES.map(u => u.category))]
}

/**
 * Category display info
 */
export const UPGRADE_CATEGORY_INFO: Record<PrestigeUpgradeDef['category'], { label: string; icon: string; color: string }> = {
  income: { label: 'Income Boosts', icon: 'mdi:cash-multiple', color: '#22c55e' },
  progression: { label: 'Progression', icon: 'mdi:trending-up', color: '#71717a' },
  quality_of_life: { label: 'Quality of Life', icon: 'mdi:heart', color: '#ef4444' },
  starting_bonus: { label: 'Starting Bonuses', icon: 'mdi:flag-checkered', color: '#f59e0b' },
}
