/**
 * Business upgrades — infinite-level per-category upgrades
 *
 * Each upgrade has: bonus = baseBonus × log2(level + 1)
 * New upgrade tiers unlock at certain business levels.
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'
import type { BusinessCategory } from './definitions'

export type UpgradeEffectType =
  | 'revenue_mult'
  | 'cost_reduction'
  | 'customer_mult'
  | 'output_mult'
  | 'quality_mult'
  | 'employee_capacity'

export interface BusinessUpgradeDef {
  id: string
  nameKey: string
  descKey: string
  icon: string
  /** Which categories can use this upgrade (null = all) */
  categories: BusinessCategory[] | null
  /** Effect type */
  effectType: UpgradeEffectType
  /** Base bonus value (multiplied by log2(level+1)) */
  baseBonus: number
  /** Base cost for level 1 */
  baseCost: Decimal
  /** Cost growth per level (exponential) */
  costGrowth: number
  /** Minimum business level to unlock */
  unlockAtBusinessLevel: number
}

export const BUSINESS_UPGRADES: BusinessUpgradeDef[] = [
  // ─── Universal upgrades ────────────────────────────────────
  {
    id: 'efficiency_boost',
    nameKey: 'business.upg_efficiency_boost',
    descKey: 'business.upg_efficiency_boost_desc',
    icon: 'mdi:lightning-bolt',
    categories: null,
    effectType: 'revenue_mult',
    baseBonus: 0.10,
    baseCost: D(1000),
    costGrowth: 1.25,
    unlockAtBusinessLevel: 1,
  },
  {
    id: 'bulk_discount',
    nameKey: 'business.upg_bulk_discount',
    descKey: 'business.upg_bulk_discount_desc',
    icon: 'mdi:tag-minus',
    categories: null,
    effectType: 'cost_reduction',
    baseBonus: 0.05,
    baseCost: D(2000),
    costGrowth: 1.3,
    unlockAtBusinessLevel: 5,
  },
  {
    id: 'brand_awareness',
    nameKey: 'business.upg_brand_awareness',
    descKey: 'business.upg_brand_awareness_desc',
    icon: 'mdi:star-circle',
    categories: null,
    effectType: 'customer_mult',
    baseBonus: 0.08,
    baseCost: D(5000),
    costGrowth: 1.28,
    unlockAtBusinessLevel: 10,
  },
  {
    id: 'automation',
    nameKey: 'business.upg_automation',
    descKey: 'business.upg_automation_desc',
    icon: 'mdi:robot',
    categories: null,
    effectType: 'output_mult',
    baseBonus: 0.06,
    baseCost: D(10000),
    costGrowth: 1.35,
    unlockAtBusinessLevel: 15,
  },
  {
    id: 'workforce_expansion',
    nameKey: 'business.upg_workforce_expansion',
    descKey: 'business.upg_workforce_expansion_desc',
    icon: 'mdi:account-multiple-plus',
    categories: null,
    effectType: 'employee_capacity',
    baseBonus: 2,
    baseCost: D(15000),
    costGrowth: 1.4,
    unlockAtBusinessLevel: 20,
  },

  // ─── Category-specific upgrades ────────────────────────────

  // Food
  {
    id: 'kitchen_upgrade',
    nameKey: 'business.upg_kitchen_upgrade',
    descKey: 'business.upg_kitchen_upgrade_desc',
    icon: 'mdi:chef-hat',
    categories: ['Food'],
    effectType: 'quality_mult',
    baseBonus: 0.12,
    baseCost: D(8000),
    costGrowth: 1.3,
    unlockAtBusinessLevel: 10,
  },
  {
    id: 'recipe_innovation',
    nameKey: 'business.upg_recipe_innovation',
    descKey: 'business.upg_recipe_innovation_desc',
    icon: 'mdi:food-variant',
    categories: ['Food'],
    effectType: 'customer_mult',
    baseBonus: 0.10,
    baseCost: D(20000),
    costGrowth: 1.32,
    unlockAtBusinessLevel: 25,
  },

  // Tech
  {
    id: 'rd_lab',
    nameKey: 'business.upg_rd_lab',
    descKey: 'business.upg_rd_lab_desc',
    icon: 'mdi:flask',
    categories: ['Tech'],
    effectType: 'revenue_mult',
    baseBonus: 0.15,
    baseCost: D(50000000),
    costGrowth: 1.35,
    unlockAtBusinessLevel: 10,
  },
  {
    id: 'cloud_infra',
    nameKey: 'business.upg_cloud_infra',
    descKey: 'business.upg_cloud_infra_desc',
    icon: 'mdi:cloud',
    categories: ['Tech'],
    effectType: 'output_mult',
    baseBonus: 0.12,
    baseCost: D(100000000),
    costGrowth: 1.3,
    unlockAtBusinessLevel: 20,
  },

  // Services
  {
    id: 'crm_system',
    nameKey: 'business.upg_crm_system',
    descKey: 'business.upg_crm_system_desc',
    icon: 'mdi:account-heart',
    categories: ['Services'],
    effectType: 'customer_mult',
    baseBonus: 0.10,
    baseCost: D(15000),
    costGrowth: 1.28,
    unlockAtBusinessLevel: 10,
  },

  // Retail
  {
    id: 'supply_chain',
    nameKey: 'business.upg_supply_chain',
    descKey: 'business.upg_supply_chain_desc',
    icon: 'mdi:truck-delivery',
    categories: ['Retail'],
    effectType: 'cost_reduction',
    baseBonus: 0.08,
    baseCost: D(30000),
    costGrowth: 1.3,
    unlockAtBusinessLevel: 10,
  },

  // Entertainment
  {
    id: 'vip_section',
    nameKey: 'business.upg_vip_section',
    descKey: 'business.upg_vip_section_desc',
    icon: 'mdi:crown',
    categories: ['Entertainment'],
    effectType: 'revenue_mult',
    baseBonus: 0.15,
    baseCost: D(2500000),
    costGrowth: 1.32,
    unlockAtBusinessLevel: 15,
  },

  // Industry
  {
    id: 'assembly_line',
    nameKey: 'business.upg_assembly_line',
    descKey: 'business.upg_assembly_line_desc',
    icon: 'mdi:cog',
    categories: ['Industry'],
    effectType: 'output_mult',
    baseBonus: 0.15,
    baseCost: D(250000000),
    costGrowth: 1.35,
    unlockAtBusinessLevel: 10,
  },

  // Finance
  {
    id: 'algo_trading',
    nameKey: 'business.upg_algo_trading',
    descKey: 'business.upg_algo_trading_desc',
    icon: 'mdi:chart-areaspline',
    categories: ['Finance'],
    effectType: 'revenue_mult',
    baseBonus: 0.20,
    baseCost: D(2500000000),
    costGrowth: 1.4,
    unlockAtBusinessLevel: 10,
  },
]
