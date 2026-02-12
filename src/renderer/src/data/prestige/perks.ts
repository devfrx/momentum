/**
 * Prestige Perks — One-time permanent unlocks
 *
 * Perks are purchased once with prestige points and provide
 * permanent bonuses or unlock new features.
 * Unlike upgrades, perks cannot be leveled up.
 */
import { D } from '@renderer/core/BigNum'
import type { PerkDef } from './types'

export const PRESTIGE_PERKS: PerkDef[] = [
  // ─── Quality of Life Perks ──────────────────────────────────────
  {
    id: 'perk_quick_start',
    name: 'Quick Start',
    description: 'Start each run with a small cash bonus based on your total prestige points.',
    icon: 'mdi:lightning-bolt',
    cost: D(5),
    effect: { type: 'starting_cash', value: 100, permanent: true },
    prerequisites: [],
    category: 'quality_of_life',
    eraRequired: 'era_rising',
  },
  {
    id: 'perk_auto_collect',
    name: 'Auto Collector',
    description: 'Automatically collect all passive income without clicking.',
    icon: 'mdi:robot',
    cost: D(10),
    effect: { type: 'unlock', value: 1, target: 'auto_collect', permanent: true },
    prerequisites: ['perk_quick_start'],
    category: 'automation',
    eraRequired: 'era_rising',
  },
  {
    id: 'perk_instant_jobs',
    name: 'Instant Mastery',
    description: 'New jobs start at 10% efficiency instead of 0%.',
    icon: 'mdi:run-fast',
    cost: D(25),
    effect: { type: 'job_efficiency', value: 0.1, permanent: true },
    prerequisites: [],
    category: 'boost',
    eraRequired: 'era_established',
  },
  {
    id: 'perk_offline_boost',
    name: 'Dream Worker',
    description: 'Increase offline progress efficiency by 5%.',
    icon: 'mdi:sleep',
    cost: D(30),
    effect: { type: 'offline_bonus', value: 0.05, permanent: true },
    prerequisites: [],
    category: 'quality_of_life',
    eraRequired: 'era_established',
  },

  // ─── Boost Perks ────────────────────────────────────────────────
  {
    id: 'perk_market_insight',
    name: 'Market Insight',
    description: 'All stock and crypto investments gain 3% better returns.',
    icon: 'mdi:chart-line',
    cost: D(50),
    effect: { type: 'stock_returns', value: 0.03, permanent: true },
    prerequisites: [],
    category: 'boost',
    eraRequired: 'era_titan',
  },
  {
    id: 'perk_tax_haven',
    name: 'Tax Haven',
    description: 'Reduce all loan interest rates by 0.5%.',
    icon: 'mdi:bank-off',
    cost: D(75),
    effect: { type: 'loan_discount', value: 0.005, permanent: true },
    prerequisites: [],
    category: 'boost',
    eraRequired: 'era_titan',
  },
  {
    id: 'perk_business_sense',
    name: 'Business Acumen',
    description: 'All businesses generate 4% more revenue.',
    icon: 'mdi:store',
    cost: D(100),
    effect: { type: 'business_revenue', value: 0.04, permanent: true },
    prerequisites: ['perk_market_insight'],
    category: 'boost',
  },
  {
    id: 'perk_real_estate_mogul',
    name: 'Property Expert',
    description: 'All properties generate 4% more rental income.',
    icon: 'mdi:home-city',
    cost: D(100),
    effect: { type: 'real_estate_income', value: 0.04, permanent: true },
    prerequisites: ['perk_market_insight'],
    category: 'boost',
  },

  // ─── Unlock Perks ───────────────────────────────────────────────
  {
    id: 'perk_early_crypto',
    name: 'Crypto Pioneer',
    description: 'Unlock cryptocurrency trading from the very start of each run.',
    icon: 'mdi:bitcoin',
    cost: D(15),
    effect: { type: 'unlock', value: 1, target: 'early_crypto', permanent: true },
    prerequisites: [],
    category: 'unlock',
  },
  {
    id: 'perk_early_stocks',
    name: 'Wall Street Access',
    description: 'Unlock stock trading from the very start of each run.',
    icon: 'mdi:chart-line-variant',
    cost: D(15),
    effect: { type: 'unlock', value: 1, target: 'early_stocks', permanent: true },
    prerequisites: [],
    category: 'unlock',
  },
  {
    id: 'perk_early_gambling',
    name: 'Casino Pass',
    description: 'Unlock gambling features from the very start of each run.',
    icon: 'mdi:cards-playing',
    cost: D(20),
    effect: { type: 'unlock', value: 1, target: 'early_gambling', permanent: true },
    prerequisites: [],
    category: 'unlock',
  },
  {
    id: 'perk_early_real_estate',
    name: 'Property License',
    description: 'Unlock real estate from the very start of each run.',
    icon: 'mdi:key',
    cost: D(20),
    effect: { type: 'unlock', value: 1, target: 'early_real_estate', permanent: true },
    prerequisites: [],
    category: 'unlock',
  },

  // ─── Advanced Perks (Late Game) ──────────────────────────────
  {
    id: 'perk_golden_touch',
    name: 'Golden Touch',
    description: 'Everything you touch turns to gold. +8% to all income sources.',
    icon: 'mdi:hand-coin',
    cost: D(500),
    effect: { type: 'global_multiplier', value: 0.08, permanent: true },
    prerequisites: ['perk_business_sense', 'perk_real_estate_mogul'],
    category: 'boost',
    eraRequired: 'era_legend',
  },
  {
    id: 'perk_time_warp',
    name: 'Time Warp',
    description: 'Offline progress is calculated with boosted efficiency.',
    icon: 'mdi:clock-fast',
    cost: D(750),
    effect: { type: 'offline_bonus', value: 0.08, permanent: true },
    prerequisites: ['perk_offline_boost'],
    category: 'quality_of_life',
    eraRequired: 'era_legend',
  },
  {
    id: 'perk_prestige_master',
    name: 'Prestige Master',
    description: 'Earn 8% more prestige points on every rebirth.',
    icon: 'mdi:star-circle',
    cost: D(1000),
    effect: { type: 'prestige_gain', value: 0.08, permanent: true },
    prerequisites: ['perk_golden_touch'],
    category: 'boost',
    eraRequired: 'era_legend',
  },

  // ─── Eternal Perks ──────────────────────────────────────────────
  {
    id: 'perk_omniscience',
    name: 'Omniscience',
    description: 'See all market trends and optimal prices clearly.',
    icon: 'mdi:eye',
    cost: D(2500),
    effect: { type: 'unlock', value: 1, target: 'market_omniscience', permanent: true },
    prerequisites: ['perk_prestige_master'],
    category: 'unlock',
    eraRequired: 'era_eternal',
  },
  {
    id: 'perk_reality_warp',
    name: 'Reality Warp',
    description: 'Transcend normal game rules. +12% to all income.',
    icon: 'mdi:atom-variant',
    cost: D(5000),
    effect: { type: 'global_multiplier', value: 0.12, permanent: true },
    prerequisites: ['perk_omniscience'],
    category: 'boost',
    eraRequired: 'era_eternal',
  },
]

/**
 * Get perks available for purchase in a given era
 */
export function getPerksForEra(eraId: string): PerkDef[] {
  return PRESTIGE_PERKS.filter(p => !p.eraRequired || p.eraRequired === eraId)
}

/**
 * Get all perks unlocked up to and including a given era
 */
export function getPerksUpToEra(eraId: string, allEraIds: string[]): PerkDef[] {
  const eraIndex = allEraIds.indexOf(eraId)
  if (eraIndex === -1) return []

  const availableEras = allEraIds.slice(0, eraIndex + 1)
  return PRESTIGE_PERKS.filter(p => !p.eraRequired || availableEras.includes(p.eraRequired))
}
