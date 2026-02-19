/**
 * Black Market — Barrel export
 *
 * Re-exports all black market data, types, and utilities.
 */

// Types
export type {
  ReputationTier,
  ReputationTierDef,
  DealCategory,
  DealEffectType,
  DealEffect,
  DealConsequence,
  BlackMarketDealDef,
  BlackMarketDeal,
  ContactId,
  ContactAbility,
  ContactDef,
  ContactState,
  HeatLevel,
  HeatThresholdDef,
  HeatPenalty,
  ActiveBlackMarketEffect,
  Investigation,
  ActivityLogEntry,
  ActivityLogSeverity,
} from './types'

// Reputation
export { REPUTATION_TIERS, getReputationTier, calculateTier, getTierProgress, effectiveDealScore } from './reputation'

// Heat
export { HEAT_THRESHOLDS, getHeatLevel, getHeatPenalty } from './heat'

// Contacts
export { CONTACTS, getContactDef } from './contacts'

// Deals
export { DEAL_DEFS, getDealDef } from './deals'

// Balance constants
export {
  DEAL_ROTATION_MIN_TICKS,
  DEAL_ROTATION_MAX_TICKS,
  MIN_DEALS_AVAILABLE,
  MAX_DEALS_AVAILABLE,
  HEAT_DECAY_PER_TICK,
  NPC_DAILY_CYCLE_TICKS,
  INVESTIGATION_MIN_TICKS,
  INVESTIGATION_MAX_TICKS,
  MAX_HEAT,
  HEAT_PER_DEAL_BASE,
  HEAT_PER_FAILED_DEAL,
  INVESTIGATION_FINE_MULT,
  MAX_ACTIVE_EFFECTS,
  MAX_INVESTIGATIONS,
  FENCE_DAILY_LIMIT,
  FENCE_SELL_MULTIPLIER,
  FENCE_FORGE_MIN_BONUS,
  FENCE_FORGE_MAX_BONUS,
  FENCE_FORGE_HEAT,
  FENCE_FORGE_COST_FRACTION,
  FENCE_NETWORK_SELL_BOOST,
  FENCE_NETWORK_DURATION_TICKS,
  HACKER_MANIPULATION_RANGE,
  HACKER_MANIPULATION_TICKS,
  FIXER_COST_PER_SEVERITY,
  BROKER_BASE_ACCURACY,
  BROKER_LOYALTY_ACCURACY_BONUS,
  SMUGGLER_VALUE_MIN,
  SMUGGLER_VALUE_MAX,
} from './balance'

// Scaling utilities
export {
  type ImpactTier,
  scalePercentageCost,
  scaleCashReward,
  scaleDealCost,
  scaleDealEffect,
  scaleDealConsequence,
  scaleContactCost,
  scaleContactReward,
  rollContactRisk,
  getBetrayalChance,
  getScamChance,
  BETRAYAL_BASE_CHANCE,
  SCAM_BASE_CHANCE,
} from './scaling'
