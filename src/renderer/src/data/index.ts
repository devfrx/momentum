// ─── Businesses ─────────────────────────────────────────────────
export {
  BUSINESS_DEFS,
  LEVEL_COST_GROWTH,
  LEVEL_OUTPUT_EXPONENT,
  BRANCH_COST_GROWTH,
  TRAINING_COST_GROWTH,
  BUSINESS_UPGRADES,
  POLICIES,
  ADVISOR_DEFS,
  computePolicyEffects,
  advisorCost,
  advisorEffect,
  getActiveMilestones,
  aggregateMilestoneBonuses,
  MILESTONE_TIERS,
  synergyCategoryMultiplier,
  getAllSynergies,
  GEO_TIERS,
  getGeoTier,
  getNextGeoTier,
  MEGA_CORP_REQUIREMENTS,
  marketDominanceMultiplier,
} from './businesses'
export type {
  BusinessDef,
  BusinessCategory,
  UpgradeEffectType,
  BusinessUpgradeDef,
  PolicyDef,
  AdvisorType,
  AdvisorDef,
  AdvisorState,
  MilestoneType,
  MilestoneBonusType,
  MilestoneTier,
  ActiveMilestone,
  SynergyBonus,
  GeographicTier,
  GeoTierDef,
} from './businesses'

export { JOBS } from './jobs'
export type { JobDef } from './jobs'

export { STOCKS } from './stocks'

export { CRYPTOS } from './cryptos'

export { PROPERTIES } from './properties'
export type { PropertyDef } from './properties'

export { UPGRADES } from './upgrades'
export type { UpgradeDef, UpgradeTarget } from './upgrades'

export { ACHIEVEMENTS } from './achievements'
export type { AchievementDef, AchievementCondition, AchievementReward } from './achievements'

export { EVENTS } from './events'

export { GAMBLING_GAMES } from './gambling'
export type { GamblingGameDef } from './gambling'

export { RARITY_COLORS, rarityColor, rarityCssVar } from './rarity'
export type { Rarity } from './rarity'

export { LOTTERY_TICKETS, drawNumbers, countMatches, determinePrize, executeDraw } from './lottery'
export type { LotteryTicketDef, LotteryPrizeTier, LotteryDrawResult } from './lottery'

export {
  LOANS,
  LOAN_CATEGORY_META,
  RISK_LEVEL_META,
  getLoansByCategory,
  getAvailableLoans,
  calculateEffectiveRate,
  calculateMaxLoanAmount,
} from './loans'
export type {
  LoanDef,
  LoanCategory,
  LoanRiskLevel,
  CollateralType,
  ActiveLoan,
  CreditScoreFactors,
} from './loans'

export {
  DEPOSITS,
  DEPOSIT_CATEGORY_META,
  DEPOSIT_RISK_META,
  getDepositsByCategory,
  getAvailableDeposits,
  calculateEffectiveAPY,
  getCompoundIntervalTicks,
} from './deposits'
export type {
  DepositDef,
  DepositCategory,
  CompoundFrequency,
  DepositRisk,
  ActiveDeposit,
  DepositHistoryEntry,
} from './deposits'

export {
  SECTORS,
  STAGES,
  TRAITS,
  OPPORTUNITY_REFRESH_TICKS,
  MIN_OPPORTUNITIES,
  MAX_OPPORTUNITIES,
  generateOpportunity,
  generateOpportunityBatch,
  calculateEffectiveSuccessChance,
  calculateEffectiveReturn
} from './startups'
export type {
  StartupSector,
  StartupStage,
  StartupTrait,
  StartupTraitData,
  StartupOpportunity,
  SectorData,
  StageData
} from './startups'

// ─── Real Estate ────────────────────────────────────────────────
export {
  DISTRICTS,
  getDistrict,
  getUnlockedDistricts,
  getActiveSynergies,
  getCombinedSynergyBonus,
  PROPERTY_TEMPLATES,
  PROPERTY_TRAITS,
  getTrait,
  MANAGEMENT_STYLES,
  getManagementStyle,
  IMPROVEMENTS,
  getImprovement,
  getAvailableImprovements,
  SCOUT_PHASES,
  SCOUT_PHASE_DATA,
  APPRAISAL_DISCOUNT,
  OPPORTUNITY_REFRESH_TICKS as RE_OPPORTUNITY_REFRESH_TICKS,
  MIN_OPPORTUNITIES as RE_MIN_OPPORTUNITIES,
  MAX_OPPORTUNITIES as RE_MAX_OPPORTUNITIES,
  generateOpportunity as generatePropertyOpportunity,
  generateScanOpportunity,
  generateOpportunityBatch as generatePropertyOpportunityBatch,
} from './realestate'
export type {
  District,
  DistrictTier,
  PropertyDistrictCategory,
  DistrictSynergyBonus,
  PropertyTemplate,
  PropertyTrait,
  ManagementStyle,
  ManagementStyleDef,
  ImprovementId,
  ImprovementDef,
  ScoutPhase,
  ScoutPhaseData,
  PropertyOpportunity,
} from './realestate'

// ─── Storage Wars ───────────────────────────────────────────────
export {
  findLocationInPool,
  getUnlockedLocations,
  ITEM_POOL,
  generateUnitContents,
  calculateTotalItemsValue,
  applySellTax,
  APPRAISER_DEFS,
  getAppraiser,
  AUCTION_CONFIG,
  generateAuction,
  generateAuctionBatch,
  calculateBidderBehavior,
  generateLocationPool,
  generateLocation,
  regenerateTierLocations,
  TIER_ORDER,
  getTierUnlockAt,
} from './storage'
export type {
  StorageLocation,
  LocationTier,
  StorageItem,
  ItemCategory,
  AppraiserDef,
  AppraiserTier,
  StorageAuction,
  AuctionStatus,
  BidderPersonality,
  AuctionBidder,
} from './storage'
