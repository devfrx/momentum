/**
 * Advisors — one per business, upgradable
 *
 * Each advisor type provides passive bonuses:
 *   Operations Manager — auto-collect + cost reduction
 *   Marketing Director — marketing efficiency boost
 *   HR Manager — morale boost + auto-training
 *   CFO — auto-optimize pricing
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'

export type AdvisorType = 'operations' | 'marketing' | 'hr' | 'cfo'

export interface AdvisorDef {
  type: AdvisorType
  nameKey: string
  descKey: string
  icon: string
  /** Base hire cost (scales with business purchase price) */
  baseCostMult: number
  /** Cost growth per advisor level */
  costGrowth: number
  /** Base effect value per level */
  baseEffect: number
}

export const ADVISOR_DEFS: AdvisorDef[] = [
  {
    type: 'operations',
    nameKey: 'business.adv_operations',
    descKey: 'business.adv_operations_desc',
    icon: 'mdi:account-tie',
    baseCostMult: 0.15,
    costGrowth: 1.6,
    baseEffect: 0.05, // 5% cost reduction per level
  },
  {
    type: 'marketing',
    nameKey: 'business.adv_marketing',
    descKey: 'business.adv_marketing_desc',
    icon: 'mdi:bullhorn-variant',
    baseCostMult: 0.12,
    costGrowth: 1.5,
    baseEffect: 0.10, // 10% marketing efficiency per level
  },
  {
    type: 'hr',
    nameKey: 'business.adv_hr',
    descKey: 'business.adv_hr_desc',
    icon: 'mdi:account-group',
    baseCostMult: 0.08,
    costGrowth: 1.5,
    baseEffect: 0.05, // 5% output boost + auto-training per level
  },
  {
    type: 'cfo',
    nameKey: 'business.adv_cfo',
    descKey: 'business.adv_cfo_desc',
    icon: 'mdi:chart-line',
    baseCostMult: 0.20,
    costGrowth: 1.6,
    baseEffect: 0.02, // auto-optimizes pricing toward optimal
  },
]

export interface AdvisorState {
  type: AdvisorType
  level: number
  hired: boolean
}

/** Get advisor hire cost */
export function advisorCost(basePurchasePrice: Decimal, def: AdvisorDef, currentLevel: number): Decimal {
  const base = basePurchasePrice.mul(def.baseCostMult)
  return base.mul(D(def.costGrowth).pow(currentLevel))
}

/** Get advisor effect at given level */
export function advisorEffect(def: AdvisorDef, level: number): number {
  if (level <= 0) return 0
  return def.baseEffect * level
}
