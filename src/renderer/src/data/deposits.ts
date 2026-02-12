/**
 * Deposits Data Definitions
 *
 * Defines all savings / fixed-deposit account types available in the game.
 * Each deposit type has different APY, term, minimum balance, and risk profile.
 *
 * Mechanics overview:
 *  - Players lock cash into a deposit account for a fixed or flexible term.
 *  - Interest accrues every tick based on the effective APY (modified by
 *    credit score, skill tree, prestige, and events).
 *  - Early withdrawal incurs a penalty (partial loss of accrued interest).
 *  - Compound frequency affects how often interest is reinvested into principal.
 *  - Higher-tier accounts require minimum net worth / level / credit score.
 */
import type Decimal from 'break_infinity.js'
import { D } from '@renderer/core/BigNum'

// ─── Types ────────────────────────────────────────────────────

export type DepositCategory =
  | 'savings'    // Flexible, low APY
  | 'fixed'      // Locked term, medium APY
  | 'premium'    // High minimum, high APY
  | 'special'    // Event / prestige unlocks

export type CompoundFrequency =
  | 'per_tick'   // Every tick (continuous)
  | 'per_second' // Every 10 ticks
  | 'per_minute' // Every 600 ticks

export type DepositRisk = 'insured' | 'standard' | 'volatile'

/**
 * Static deposit product definition
 */
export interface DepositDef {
  id: string
  name: string
  description: string
  category: DepositCategory
  icon: string

  /** Base annual percentage yield (e.g. 0.05 = 5%) */
  baseAPY: number
  /** Whether APY scales with credit score (higher score → better rate) */
  apyScalesWithCredit: boolean

  /** Minimum deposit amount */
  minDeposit: Decimal
  /** Maximum deposit amount (0 = unlimited) */
  maxDeposit: Decimal

  /** Lock-in period in ticks (0 = flexible / no lock) */
  termTicks: number
  /** Early withdrawal penalty as fraction of accrued interest (e.g. 0.5 = lose 50% interest) */
  earlyWithdrawalPenalty: number
  /** Whether partial withdrawals are allowed */
  allowPartialWithdrawal: boolean

  /** How often interest re-invests into principal */
  compoundFrequency: CompoundFrequency
  /** Bonus APY for keeping deposit past original term (0 = no bonus) */
  loyaltyBonusAPY: number
  /** Ticks past term required to activate loyalty bonus */
  loyaltyThresholdTicks: number

  /** Risk profile — insured deposits never lose value, volatile ones can */
  risk: DepositRisk
  /** For volatile deposits: chance per tick that a negative event zeroes interest */
  volatilityChance: number

  /** Player requirements */
  minNetWorth: Decimal
  minCreditScore: number
  minLevel: number

  /** Max simultaneous accounts of this type */
  maxActive: number

  /** XP granted when term is completed without early withdrawal */
  completionXp: number
  /** Credit score boost on maturity */
  creditImpactOnMaturity: number
}

/**
 * Runtime state of an active deposit account
 */
export interface ActiveDeposit {
  /** Unique instance id */
  id: string
  /** Reference to definition */
  depositDefId: string
  /** Original deposit amount */
  principal: Decimal
  /** Current balance = principal + accrued interest */
  currentBalance: Decimal
  /** Total interest earned so far */
  totalInterestEarned: Decimal
  /** Effective APY (after modifiers) at time of opening */
  effectiveAPY: number
  /** Tick when account was opened */
  startTick: number
  /** Ticks account has been active */
  ticksActive: number
  /** Lock-in term ticks (from def) */
  termTicks: number
  /** Whether account has matured (reached term end) */
  matured: boolean
  /** Whether loyalty bonus is active */
  loyaltyActive: boolean
  /** Ticks since last compound */
  ticksSinceLastCompound: number
  /** Total compounding events */
  totalCompounds: number
  /** Whether the deposit has been fully withdrawn */
  closed: boolean
  /** Running count of ticks with loyalty bonus */
  loyaltyTicks: number
}

/**
 * Deposit history entry — kept after withdrawal
 */
export interface DepositHistoryEntry {
  depositDefId: string
  principal: Decimal
  totalInterestEarned: Decimal
  effectiveAPY: number
  ticksHeld: number
  matured: boolean
  earlyWithdrawal: boolean
  penaltyPaid: Decimal
  /** 'completed' | 'withdrawn_early' | 'closed_at_maturity' */
  status: 'completed' | 'withdrawn_early' | 'closed_at_maturity'
}

// ─── Deposit Definitions ──────────────────────────────────────

export const DEPOSITS: DepositDef[] = [
  // ═══ SAVINGS ACCOUNTS ═════════════════════════════════════════

  {
    id: 'savings_basic',
    name: 'Basic Savings',
    description: 'A simple savings account with daily interest. Withdraw anytime with no penalty.',
    category: 'savings',
    icon: 'mdi:piggy-bank',
    baseAPY: 0.02,
    apyScalesWithCredit: false,
    minDeposit: D(50),
    maxDeposit: D(50_000),
    termTicks: 0,
    earlyWithdrawalPenalty: 0,
    allowPartialWithdrawal: true,
    compoundFrequency: 'per_minute',
    loyaltyBonusAPY: 0.005,
    loyaltyThresholdTicks: 36_000, // 1h
    risk: 'insured',
    volatilityChance: 0,
    minNetWorth: D(0),
    minCreditScore: 0,
    minLevel: 1,
    maxActive: 2,
    completionXp: 0,
    creditImpactOnMaturity: 0,
  },

  {
    id: 'savings_high_yield',
    name: 'High-Yield Savings',
    description: 'Competitive rates for larger balances. Flexible withdrawals, better compound.',
    category: 'savings',
    icon: 'mdi:cash-plus',
    baseAPY: 0.04,
    apyScalesWithCredit: true,
    minDeposit: D(1_000),
    maxDeposit: D(500_000),
    termTicks: 0,
    earlyWithdrawalPenalty: 0,
    allowPartialWithdrawal: true,
    compoundFrequency: 'per_second',
    loyaltyBonusAPY: 0.01,
    loyaltyThresholdTicks: 18_000, // 30min
    risk: 'insured',
    volatilityChance: 0,
    minNetWorth: D(5_000),
    minCreditScore: 20,
    minLevel: 3,
    maxActive: 2,
    completionXp: 0,
    creditImpactOnMaturity: 0,
  },

  // ═══ FIXED DEPOSITS (CDs) ════════════════════════════════════

  {
    id: 'cd_short',
    name: 'Short-Term CD',
    description: 'Lock your money for 30 minutes and earn more than a savings account.',
    category: 'fixed',
    icon: 'mdi:safe-square-outline',
    baseAPY: 0.06,
    apyScalesWithCredit: true,
    minDeposit: D(500),
    maxDeposit: D(100_000),
    termTicks: 18_000, // 30 min
    earlyWithdrawalPenalty: 0.5,
    allowPartialWithdrawal: false,
    compoundFrequency: 'per_second',
    loyaltyBonusAPY: 0.015,
    loyaltyThresholdTicks: 6_000, // +10min past maturity
    risk: 'insured',
    volatilityChance: 0,
    minNetWorth: D(2_000),
    minCreditScore: 15,
    minLevel: 2,
    maxActive: 3,
    completionXp: 25,
    creditImpactOnMaturity: 1,
  },

  {
    id: 'cd_medium',
    name: 'Standard CD',
    description: 'A balanced certificate of deposit. Good returns for patient investors.',
    category: 'fixed',
    icon: 'mdi:safe',
    baseAPY: 0.08,
    apyScalesWithCredit: true,
    minDeposit: D(2_000),
    maxDeposit: D(500_000),
    termTicks: 36_000, // 1h
    earlyWithdrawalPenalty: 0.6,
    allowPartialWithdrawal: false,
    compoundFrequency: 'per_second',
    loyaltyBonusAPY: 0.02,
    loyaltyThresholdTicks: 12_000, // +20min past maturity
    risk: 'insured',
    volatilityChance: 0,
    minNetWorth: D(10_000),
    minCreditScore: 30,
    minLevel: 4,
    maxActive: 3,
    completionXp: 75,
    creditImpactOnMaturity: 2,
  },

  {
    id: 'cd_long',
    name: 'Long-Term CD',
    description: 'Maximum FDIC-insured return. Requires patience but rewards handsomely.',
    category: 'fixed',
    icon: 'mdi:lock-clock',
    baseAPY: 0.12,
    apyScalesWithCredit: true,
    minDeposit: D(10_000),
    maxDeposit: D(2_000_000),
    termTicks: 72_000, // 2h
    earlyWithdrawalPenalty: 0.75,
    allowPartialWithdrawal: false,
    compoundFrequency: 'per_second',
    loyaltyBonusAPY: 0.03,
    loyaltyThresholdTicks: 18_000, // +30min past maturity
    risk: 'insured',
    volatilityChance: 0,
    minNetWorth: D(50_000),
    minCreditScore: 45,
    minLevel: 6,
    maxActive: 2,
    completionXp: 200,
    creditImpactOnMaturity: 3,
  },

  // ═══ PREMIUM ACCOUNTS ════════════════════════════════════════

  {
    id: 'premium_wealth',
    name: 'Wealth Management Account',
    description: 'Exclusive high-net-worth account with superior yields and continuous compounding.',
    category: 'premium',
    icon: 'mdi:crown-circle-outline',
    baseAPY: 0.15,
    apyScalesWithCredit: true,
    minDeposit: D(100_000),
    maxDeposit: D(10_000_000),
    termTicks: 54_000, // 1.5h
    earlyWithdrawalPenalty: 0.4,
    allowPartialWithdrawal: true,
    compoundFrequency: 'per_tick',
    loyaltyBonusAPY: 0.04,
    loyaltyThresholdTicks: 18_000,
    risk: 'standard',
    volatilityChance: 0,
    minNetWorth: D(500_000),
    minCreditScore: 60,
    minLevel: 8,
    maxActive: 2,
    completionXp: 500,
    creditImpactOnMaturity: 4,
  },

  {
    id: 'premium_trust',
    name: 'Trust Fund',
    description: 'Ultra-high-yield trust account. Long commitment, extraordinary returns.',
    category: 'premium',
    icon: 'mdi:shield-star',
    baseAPY: 0.20,
    apyScalesWithCredit: true,
    minDeposit: D(500_000),
    maxDeposit: D(50_000_000),
    termTicks: 108_000, // 3h
    earlyWithdrawalPenalty: 0.6,
    allowPartialWithdrawal: false,
    compoundFrequency: 'per_tick',
    loyaltyBonusAPY: 0.05,
    loyaltyThresholdTicks: 36_000,
    risk: 'standard',
    volatilityChance: 0,
    minNetWorth: D(2_000_000),
    minCreditScore: 70,
    minLevel: 10,
    maxActive: 1,
    completionXp: 1500,
    creditImpactOnMaturity: 5,
  },

  // ═══ SPECIAL / VOLATILE ══════════════════════════════════════

  {
    id: 'special_money_market',
    name: 'Money Market Fund',
    description: 'Higher returns by lending your deposit to others. Small risk of temporary freezes.',
    category: 'special',
    icon: 'mdi:chart-arc',
    baseAPY: 0.10,
    apyScalesWithCredit: false,
    minDeposit: D(5_000),
    maxDeposit: D(1_000_000),
    termTicks: 0,
    earlyWithdrawalPenalty: 0.1,
    allowPartialWithdrawal: true,
    compoundFrequency: 'per_second',
    loyaltyBonusAPY: 0.02,
    loyaltyThresholdTicks: 36_000,
    risk: 'volatile',
    volatilityChance: 0.00001,
    minNetWorth: D(20_000),
    minCreditScore: 35,
    minLevel: 5,
    maxActive: 2,
    completionXp: 0,
    creditImpactOnMaturity: 0,
  },

  {
    id: 'special_hedge_deposit',
    name: 'Hedge Deposit',
    description: 'Aggressive yield strategy. Very high returns but your interest can be wiped by market events.',
    category: 'special',
    icon: 'mdi:lightning-bolt',
    baseAPY: 0.30,
    apyScalesWithCredit: true,
    minDeposit: D(50_000),
    maxDeposit: D(5_000_000),
    termTicks: 36_000, // 1h
    earlyWithdrawalPenalty: 0.8,
    allowPartialWithdrawal: false,
    compoundFrequency: 'per_tick',
    loyaltyBonusAPY: 0.06,
    loyaltyThresholdTicks: 18_000,
    risk: 'volatile',
    volatilityChance: 0.00005,
    minNetWorth: D(200_000),
    minCreditScore: 50,
    minLevel: 7,
    maxActive: 1,
    completionXp: 750,
    creditImpactOnMaturity: 3,
  },

  {
    id: 'special_sovereign',
    name: 'Sovereign Bond Account',
    description: 'Government-backed ultra-safe deposit. Low returns but immune to all negative events.',
    category: 'special',
    icon: 'mdi:bank-outline',
    baseAPY: 0.035,
    apyScalesWithCredit: false,
    minDeposit: D(10_000),
    maxDeposit: D(10_000_000),
    termTicks: 54_000, // 1.5h
    earlyWithdrawalPenalty: 0.3,
    allowPartialWithdrawal: false,
    compoundFrequency: 'per_minute',
    loyaltyBonusAPY: 0.01,
    loyaltyThresholdTicks: 36_000,
    risk: 'insured',
    volatilityChance: 0,
    minNetWorth: D(25_000),
    minCreditScore: 25,
    minLevel: 4,
    maxActive: 3,
    completionXp: 100,
    creditImpactOnMaturity: 2,
  },
]

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Filter deposits by category
 */
export function getDepositsByCategory(category: DepositCategory): DepositDef[] {
  return DEPOSITS.filter(d => d.category === category)
}

/**
 * Get deposits available to the player given their stats
 */
export function getAvailableDeposits(
  level: number,
  creditScore: number,
  netWorth: Decimal
): DepositDef[] {
  return DEPOSITS.filter(d =>
    level >= d.minLevel &&
    creditScore >= d.minCreditScore &&
    netWorth.gte(d.minNetWorth)
  )
}

/**
 * Calculate effective APY based on credit score.
 * Better credit → better APY (inverse of loan rate scaling).
 * Score 0 → 0.75× base, Score 100 → 1.25× base
 */
export function calculateEffectiveAPY(
  baseDef: DepositDef,
  creditScore: number
): number {
  if (!baseDef.apyScalesWithCredit) return baseDef.baseAPY

  const apyMultiplier = 0.75 + (creditScore / 200)
  return baseDef.baseAPY * Math.max(0.5, Math.min(1.5, apyMultiplier))
}

/**
 * Get compound interval in ticks
 */
export function getCompoundIntervalTicks(freq: CompoundFrequency): number {
  switch (freq) {
    case 'per_tick': return 1
    case 'per_second': return 10
    case 'per_minute': return 600
  }
}

/**
 * Deposit category display metadata
 */
export const DEPOSIT_CATEGORY_META: Record<DepositCategory, { name: string; icon: string; accent: string }> = {
  savings: { name: 'Savings', icon: 'mdi:piggy-bank', accent: '#22c55e' },
  fixed: { name: 'Fixed Deposit', icon: 'mdi:lock-clock', accent: '#71717a' },
  premium: { name: 'Premium', icon: 'mdi:crown-circle-outline', accent: '#a855f7' },
  special: { name: 'Special', icon: 'mdi:star', accent: '#f59e0b' },
}

/**
 * Risk level display metadata
 */
export const DEPOSIT_RISK_META: Record<DepositRisk, { label: string; color: string; description: string }> = {
  insured: { label: 'FDIC Insured', color: '#22c55e', description: 'Principal is fully protected' },
  standard: { label: 'Standard', color: '#f59e0b', description: 'Principal safe, interest may vary' },
  volatile: { label: 'Volatile', color: '#ef4444', description: 'Interest can be wiped by events' },
}
