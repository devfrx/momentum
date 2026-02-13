/**
 * Milestones — automatic bonus triggers
 *
 * Every 25 levels, every 10 branches, every 50 total upgrades
 * → permanent bonus (revenue mult, cost reduction, customer attraction)
 */

export type MilestoneType = 'level' | 'branch' | 'upgrade'
export type MilestoneBonusType = 'revenue_mult' | 'cost_reduction' | 'customer_attraction'

export interface MilestoneTier {
  /** Threshold (every N levels/branches/upgrades) */
  every: number
  type: MilestoneType
  bonusType: MilestoneBonusType
  /** Bonus value per milestone hit */
  bonusValue: number
  icon: string
  nameKey: string
}

export const MILESTONE_TIERS: MilestoneTier[] = [
  {
    every: 25,
    type: 'level',
    bonusType: 'revenue_mult',
    bonusValue: 0.10, // +10% revenue per 25 levels
    icon: 'mdi:star',
    nameKey: 'business.ms_tier_level',
  },
  {
    every: 10,
    type: 'branch',
    bonusType: 'customer_attraction',
    bonusValue: 0.08, // +8% customers per 10 branches
    icon: 'mdi:earth',
    nameKey: 'business.ms_tier_branch',
  },
  {
    every: 50,
    type: 'upgrade',
    bonusType: 'cost_reduction',
    bonusValue: 0.05, // +5% cost reduction per 50 upgrades
    icon: 'mdi:arrow-up-bold-circle',
    nameKey: 'business.ms_tier_upgrade',
  },
]

export interface ActiveMilestone {
  type: MilestoneType
  threshold: number
  bonusType: MilestoneBonusType
  bonusValue: number
}

/**
 * Calculate all active milestones for a business
 */
export function getActiveMilestones(
  level: number,
  branches: number,
  totalUpgradeLevels: number
): ActiveMilestone[] {
  const milestones: ActiveMilestone[] = []

  for (const tier of MILESTONE_TIERS) {
    let count = 0
    switch (tier.type) {
      case 'level':
        count = Math.floor(level / tier.every)
        break
      case 'branch':
        count = Math.floor(branches / tier.every)
        break
      case 'upgrade':
        count = Math.floor(totalUpgradeLevels / tier.every)
        break
    }

    for (let i = 1; i <= count; i++) {
      milestones.push({
        type: tier.type,
        threshold: i * tier.every,
        bonusType: tier.bonusType,
        bonusValue: tier.bonusValue,
      })
    }
  }

  return milestones
}

/**
 * Aggregate milestone bonuses by type
 */
export function aggregateMilestoneBonuses(milestones: ActiveMilestone[]): Record<MilestoneBonusType, number> {
  const result: Record<MilestoneBonusType, number> = {
    revenue_mult: 0,
    cost_reduction: 0,
    customer_attraction: 0,
  }

  for (const m of milestones) {
    result[m.bonusType] += m.bonusValue
  }

  return result
}
