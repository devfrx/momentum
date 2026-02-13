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
 * Pricing slider:
 *   0 (Economy) → more customers, less revenue per unit
 *   100 (Premium) → fewer customers, more revenue per unit
 *
 * Labor slider:
 *   0 (Cost Saving) → lower wages, lower morale/output
 *   100 (Employee First) → higher wages, higher morale/output
 *
 * Marketing slider:
 *   0 (Organic) → low cost, slow growth
 *   100 (Aggressive) → high cost, fast growth
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

  // Pricing: 0=economy, 100=premium
  const pricing = (policies.pricing ?? 50) / 100
  const customerMult = 1 + (1 - pricing) * 0.3 * repFactor // economy = +30% customers at max rep
  const revenueMult = 1 + pricing * 0.4 * repFactor // premium = +40% revenue at max rep

  // Labor: 0=cost saving, 100=employee first
  const labor = (policies.labor ?? 50) / 100
  const costMult = 1 - (1 - labor) * 0.15 * repFactor // cost saving = -15% costs at max rep
  const outputMult = 1 + labor * 0.2 * repFactor // employee first = +20% output at max rep

  // Marketing: 0=organic, 100=aggressive
  const marketing = (policies.marketing_strategy ?? 50) / 100
  const marketingEfficiency = 1 + marketing * 0.5 * repFactor // aggressive = +50% marketing efficiency at max rep

  return { customerMult, revenueMult, costMult, outputMult, marketingEfficiency }
}
