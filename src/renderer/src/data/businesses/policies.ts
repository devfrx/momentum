/**
 * Business policies — continuous sliders for corporate strategy
 *
 * Each slider ranges 0-100. Effect scales with reputation.
 */

export interface PolicyDef {
  id: string
  nameKey: string
  descKey: string
  icon: string
  /** Left label key (value = 0) */
  leftKey: string
  /** Right label key (value = 100) */
  rightKey: string
  /** Default slider position (0-100) */
  defaultValue: number
}

export const POLICIES: PolicyDef[] = [
  {
    id: 'pricing',
    nameKey: 'business.policy_pricing',
    descKey: 'business.policy_pricing_desc',
    icon: 'mdi:tag-outline',
    leftKey: 'business.policy_pricing_left',
    rightKey: 'business.policy_pricing_right',
    defaultValue: 50,
  },
  {
    id: 'labor',
    nameKey: 'business.policy_labor',
    descKey: 'business.policy_labor_desc',
    icon: 'mdi:account-hard-hat',
    leftKey: 'business.policy_labor_left',
    rightKey: 'business.policy_labor_right',
    defaultValue: 50,
  },
  {
    id: 'marketing_strategy',
    nameKey: 'business.policy_marketing',
    descKey: 'business.policy_marketing_desc',
    icon: 'mdi:bullhorn',
    leftKey: 'business.policy_marketing_left',
    rightKey: 'business.policy_marketing_right',
    defaultValue: 50,
  },
]

/**
 * Compute policy effects given slider value (0-100) and reputation (0-100)
 *
 * Design: center (50) = neutral (no bonus).
 * Moving in either direction gives a PURE bonus in that direction.
 * This ensures every slider movement visibly impacts the business,
 * and the optimal position depends on whether the business is
 * demand-constrained (go economy) or capacity-constrained (go premium).
 *
 * Pricing slider:
 *   0 (Economy) → up to +75% customers (fill capacity)
 *   50 (Balanced) → no bonus
 *   100 (Premium) → up to +75% revenue per unit (maximize margin)
 *
 * Labor slider:
 *   0 (Cost Saving) → up to -45% operating costs
 *   50 (Balanced) → no bonus
 *   100 (Employee First) → up to +60% output, +38% customers (quality service)
 *
 * Marketing slider:
 *   0 (Organic) → minimal marketing effect
 *   100 (Aggressive) → up to +120% marketing efficiency
 */
export function computePolicyEffects(
  policies: Record<string, number>,
  reputation: number
): {
  customerMult: number
  revenueMult: number
  costMult: number
  outputMult: number
  marketingEfficiency: number
} {
  const repFactor = 0.5 + (reputation / 100) * 1.0 // 0.5 at rep=0, 1.5 at rep=100

  // Pricing: center=neutral, left=volume, right=margin
  const pVal = policies.pricing ?? 50
  const pricingLeft = Math.max(0, 50 - pVal) / 50 // 0–1, economy direction
  const pricingRight = Math.max(0, pVal - 50) / 50 // 0–1, premium direction
  const pricingCustBonus = pricingLeft * 0.5 * repFactor // economy: up to +75% customers
  const pricingRevBonus = pricingRight * 0.5 * repFactor // premium: up to +75% revenue

  // Labor: center=neutral, left=lean, right=invest
  const lVal = policies.labor ?? 50
  const laborLeft = Math.max(0, 50 - lVal) / 50 // 0–1, cost saving direction
  const laborRight = Math.max(0, lVal - 50) / 50 // 0–1, employee first direction
  const laborCostSaving = laborLeft * 0.3 * repFactor // cost saving: up to -45% costs
  const laborOutputBonus = laborRight * 0.4 * repFactor // employee first: up to +60% output
  const laborCustBonus = laborRight * 0.25 * repFactor // better service: up to +38% customers

  // Marketing: 0=organic, 100=aggressive (this one stays linear from 0)
  const marketing = (policies.marketing_strategy ?? 50) / 100
  const marketingEfficiency = 1 + marketing * 0.8 * repFactor // aggressive: up to +120% efficiency

  return {
    customerMult: (1 + pricingCustBonus) * (1 + laborCustBonus),
    revenueMult: 1 + pricingRevBonus,
    costMult: 1 - laborCostSaving,
    outputMult: 1 + laborOutputBonus,
    marketingEfficiency,
  }
}
