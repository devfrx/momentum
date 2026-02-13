/**
 * Business data barrel export
 */
export {
  BUSINESS_DEFS,
  LEVEL_COST_GROWTH,
  LEVEL_OUTPUT_EXPONENT,
  BRANCH_COST_GROWTH,
  TRAINING_COST_GROWTH,
} from './definitions'
export type { BusinessDef, BusinessCategory } from './definitions'

export { BUSINESS_UPGRADES } from './upgrades'
export type { BusinessUpgradeDef, UpgradeEffectType } from './upgrades'

export { POLICIES, computePolicyEffects } from './policies'
export type { PolicyDef } from './policies'

export { ADVISOR_DEFS, advisorCost, advisorEffect } from './advisors'
export type { AdvisorDef, AdvisorType, AdvisorState } from './advisors'

export { MILESTONE_TIERS, getActiveMilestones, aggregateMilestoneBonuses } from './milestones'
export type { MilestoneTier, MilestoneType, MilestoneBonusType, ActiveMilestone } from './milestones'

export {
  synergyCategoryMultiplier,
  getAllSynergies,
  GEO_TIERS,
  getGeoTier,
  getNextGeoTier,
  MEGA_CORP_REQUIREMENTS,
  marketDominanceMultiplier,
} from './synergies'
export type { SynergyBonus, GeographicTier, GeoTierDef } from './synergies'
