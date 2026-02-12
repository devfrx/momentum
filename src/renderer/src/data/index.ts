export { BUSINESSES } from './businesses'
export type { BusinessDef, BusinessCategory } from './businesses'

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
