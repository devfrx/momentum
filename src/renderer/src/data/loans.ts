/**
 * Loans Data Definitions
 *
 * Defines all available loan types in the game with their characteristics.
 * Each loan type has different terms, rates, requirements, and risk profiles.
 */
import type Decimal from 'break_infinity.js'
import { D } from '@renderer/core/BigNum'

// ─── Types ────────────────────────────────────────────────────

export type LoanCategory =
  | 'personal'
  | 'business'
  | 'mortgage'
  | 'predatory'
  | 'investment'
  | 'special'

export type LoanRiskLevel = 'low' | 'medium' | 'high' | 'extreme'

export type CollateralType =
  | 'none'
  | 'business'
  | 'property'
  | 'portfolio'
  | 'mixed'

/**
 * Loan definition - describes a type of loan available in the game
 */
export interface LoanDef {
  id: string
  name: string
  description: string
  category: LoanCategory
  icon: string

  /** Minimum amount borrowable */
  minAmount: Decimal
  /** Maximum amount borrowable (can be affected by credit score) */
  maxAmount: Decimal
  /** Base annual interest rate (e.g. 0.08 = 8%) */
  baseAnnualRate: number
  /** Rate multiplier based on credit score: finalRate = baseRate * (2 - creditScore/100) */
  rateScalesWithCredit: boolean

  /** Term length in game ticks (0 = no fixed term, interest-only) */
  termTicks: number
  /** Minimum net worth required to apply */
  minNetWorth: Decimal
  /** Minimum credit score required (0-100) */
  minCreditScore: number
  /** Player level requirement */
  minLevel: number

  /** Collateral requirement */
  collateralType: CollateralType
  /** Collateral ratio (e.g. 1.5 = need 150% of loan value in collateral) */
  collateralRatio: number

  /** Early repayment penalty as fraction of remaining balance */
  earlyRepaymentPenalty: number
  /** Late payment penalty as fraction of missed payment */
  latePaymentPenalty: number
  /** Grace period in ticks before late fees apply */
  gracePeriodTicks: number

  /** Risk level for UI display */
  riskLevel: LoanRiskLevel
  /** Whether this loan can be refinanced */
  canRefinance: boolean
  /** Maximum number of this loan type that can be active at once */
  maxActive: number

  /** XP granted when loan is fully repaid */
  completionXp: number
  /** Credit score impact when fully repaid on time */
  creditImpactOnTime: number
  /** Credit score impact when defaulted */
  creditImpactDefault: number
}

/**
 * Active loan instance - runtime state of a taken loan
 */
export interface ActiveLoan {
  id: string
  /** Reference to the loan definition */
  loanDefId: string
  /** Original amount borrowed */
  principal: Decimal
  /** Current remaining balance (principal + accrued interest) */
  remaining: Decimal
  /** Effective annual rate (after modifiers) */
  effectiveRate: number
  /** Tick when loan was taken */
  startTick: number
  /** Ticks since loan was taken */
  ticksActive: number
  /** Term length in ticks (0 = no term) */
  termTicks: number
  /** Total amount paid so far (principal + interest) */
  totalPaid: Decimal
  /** Total interest paid so far */
  totalInterestPaid: Decimal
  /** Total principal paid so far */
  principalPaid: Decimal
  /** Minimum payment per tick (for amortized loans) */
  minPaymentPerTick: Decimal
  /** Ticks since last payment */
  ticksSinceLastPayment: number
  /** Ticks of late payments accumulated */
  ticksLate: number
  /** Whether loan is in default status */
  isDefaulted: boolean
  /** Collateral locked for this loan */
  collateralLocked: Decimal
  /** Collateral type */
  collateralType: CollateralType
  /** Collateral asset ID (if applicable) */
  collateralId?: string
  /** Number of on-time payments */
  onTimePayments: number
  /** Number of late payments */
  latePayments: number
  /** Number of missed payments */
  missedPayments: number
}

/**
 * Credit score factors
 */
export interface CreditScoreFactors {
  /** Base payment history score (0-35 points) */
  paymentHistory: number
  /** Credit utilization score (0-30 points) */
  creditUtilization: number
  /** Length of credit history in ticks (0-15 points) */
  creditAge: number
  /** Mix of credit types (0-10 points) */
  creditMix: number
  /** Recent credit inquiries impact (0-10 points) */
  newCredit: number
}

// ─── Loan Definitions ────────────────────────────────────────────

export const LOANS: LoanDef[] = [
  // ═══ PERSONAL LOANS ═══════════════════════════════════════════

  {
    id: 'personal_starter',
    name: 'Starter Personal Loan',
    description: 'A small unsecured loan for beginners. Low risk, low reward.',
    category: 'personal',
    icon: 'mdi:account-cash',
    minAmount: D(100),
    maxAmount: D(5_000),
    baseAnnualRate: 0.12,
    rateScalesWithCredit: true,
    termTicks: 36_000, // ~1 hour
    minNetWorth: D(0),
    minCreditScore: 0,
    minLevel: 1,
    collateralType: 'none',
    collateralRatio: 0,
    earlyRepaymentPenalty: 0,
    latePaymentPenalty: 0.05,
    gracePeriodTicks: 600,
    riskLevel: 'low',
    canRefinance: true,
    maxActive: 3,
    completionXp: 50,
    creditImpactOnTime: 2,
    creditImpactDefault: -15,
  },

  {
    id: 'personal_standard',
    name: 'Personal Loan',
    description: 'Standard unsecured personal loan with competitive rates.',
    category: 'personal',
    icon: 'mdi:cash-multiple',
    minAmount: D(1_000),
    maxAmount: D(50_000),
    baseAnnualRate: 0.09,
    rateScalesWithCredit: true,
    termTicks: 72_000, // ~2 hours
    minNetWorth: D(5_000),
    minCreditScore: 30,
    minLevel: 3,
    collateralType: 'none',
    collateralRatio: 0,
    earlyRepaymentPenalty: 0.01,
    latePaymentPenalty: 0.08,
    gracePeriodTicks: 300,
    riskLevel: 'low',
    canRefinance: true,
    maxActive: 2,
    completionXp: 150,
    creditImpactOnTime: 3,
    creditImpactDefault: -20,
  },

  {
    id: 'personal_premium',
    name: 'Premium Personal Loan',
    description: 'Large unsecured loan for established borrowers with excellent credit.',
    category: 'personal',
    icon: 'mdi:cash-lock',
    minAmount: D(10_000),
    maxAmount: D(500_000),
    baseAnnualRate: 0.065,
    rateScalesWithCredit: true,
    termTicks: 144_000, // ~4 hours
    minNetWorth: D(100_000),
    minCreditScore: 70,
    minLevel: 8,
    collateralType: 'none',
    collateralRatio: 0,
    earlyRepaymentPenalty: 0.02,
    latePaymentPenalty: 0.10,
    gracePeriodTicks: 200,
    riskLevel: 'medium',
    canRefinance: true,
    maxActive: 1,
    completionXp: 500,
    creditImpactOnTime: 5,
    creditImpactDefault: -25,
  },

  // ═══ BUSINESS LOANS ═══════════════════════════════════════════

  {
    id: 'business_micro',
    name: 'Micro Business Loan',
    description: 'Small loan to help start or expand a small business.',
    category: 'business',
    icon: 'mdi:store',
    minAmount: D(5_000),
    maxAmount: D(100_000),
    baseAnnualRate: 0.08,
    rateScalesWithCredit: true,
    termTicks: 108_000, // ~3 hours
    minNetWorth: D(10_000),
    minCreditScore: 25,
    minLevel: 4,
    collateralType: 'business',
    collateralRatio: 0.5,
    earlyRepaymentPenalty: 0,
    latePaymentPenalty: 0.06,
    gracePeriodTicks: 500,
    riskLevel: 'low',
    canRefinance: true,
    maxActive: 3,
    completionXp: 200,
    creditImpactOnTime: 4,
    creditImpactDefault: -18,
  },

  {
    id: 'business_expansion',
    name: 'Business Expansion Loan',
    description: 'Medium-sized loan for growing your business empire.',
    category: 'business',
    icon: 'mdi:domain',
    minAmount: D(50_000),
    maxAmount: D(1_000_000),
    baseAnnualRate: 0.07,
    rateScalesWithCredit: true,
    termTicks: 180_000, // ~5 hours
    minNetWorth: D(250_000),
    minCreditScore: 50,
    minLevel: 10,
    collateralType: 'business',
    collateralRatio: 0.75,
    earlyRepaymentPenalty: 0.015,
    latePaymentPenalty: 0.08,
    gracePeriodTicks: 400,
    riskLevel: 'medium',
    canRefinance: true,
    maxActive: 2,
    completionXp: 750,
    creditImpactOnTime: 6,
    creditImpactDefault: -22,
  },

  {
    id: 'business_corporate',
    name: 'Corporate Credit Line',
    description: 'Large revolving credit facility for major business operations.',
    category: 'business',
    icon: 'mdi:office-building',
    minAmount: D(500_000),
    maxAmount: D(10_000_000),
    baseAnnualRate: 0.055,
    rateScalesWithCredit: true,
    termTicks: 0, // Revolving credit - no fixed term
    minNetWorth: D(2_000_000),
    minCreditScore: 75,
    minLevel: 15,
    collateralType: 'mixed',
    collateralRatio: 1.0,
    earlyRepaymentPenalty: 0,
    latePaymentPenalty: 0.12,
    gracePeriodTicks: 300,
    riskLevel: 'medium',
    canRefinance: false,
    maxActive: 1,
    completionXp: 2000,
    creditImpactOnTime: 8,
    creditImpactDefault: -30,
  },

  // ═══ MORTGAGE LOANS ═══════════════════════════════════════════

  {
    id: 'mortgage_starter',
    name: 'Starter Mortgage',
    description: 'Entry-level mortgage for your first property investment.',
    category: 'mortgage',
    icon: 'mdi:home',
    minAmount: D(50_000),
    maxAmount: D(500_000),
    baseAnnualRate: 0.045,
    rateScalesWithCredit: true,
    termTicks: 360_000, // ~10 hours
    minNetWorth: D(25_000),
    minCreditScore: 40,
    minLevel: 5,
    collateralType: 'property',
    collateralRatio: 1.2,
    earlyRepaymentPenalty: 0.03,
    latePaymentPenalty: 0.05,
    gracePeriodTicks: 600,
    riskLevel: 'low',
    canRefinance: true,
    maxActive: 2,
    completionXp: 1000,
    creditImpactOnTime: 7,
    creditImpactDefault: -35,
  },

  {
    id: 'mortgage_jumbo',
    name: 'Jumbo Mortgage',
    description: 'Large mortgage for premium real estate acquisitions.',
    category: 'mortgage',
    icon: 'mdi:home-city',
    minAmount: D(500_000),
    maxAmount: D(10_000_000),
    baseAnnualRate: 0.04,
    rateScalesWithCredit: true,
    termTicks: 720_000, // ~20 hours
    minNetWorth: D(1_000_000),
    minCreditScore: 65,
    minLevel: 12,
    collateralType: 'property',
    collateralRatio: 1.3,
    earlyRepaymentPenalty: 0.04,
    latePaymentPenalty: 0.06,
    gracePeriodTicks: 500,
    riskLevel: 'medium',
    canRefinance: true,
    maxActive: 3,
    completionXp: 3000,
    creditImpactOnTime: 10,
    creditImpactDefault: -40,
  },

  {
    id: 'mortgage_commercial',
    name: 'Commercial Mortgage',
    description: 'Financing for commercial real estate and developments.',
    category: 'mortgage',
    icon: 'mdi:city-variant',
    minAmount: D(1_000_000),
    maxAmount: D(50_000_000),
    baseAnnualRate: 0.035,
    rateScalesWithCredit: true,
    termTicks: 1_080_000, // ~30 hours
    minNetWorth: D(5_000_000),
    minCreditScore: 80,
    minLevel: 18,
    collateralType: 'property',
    collateralRatio: 1.5,
    earlyRepaymentPenalty: 0.05,
    latePaymentPenalty: 0.08,
    gracePeriodTicks: 400,
    riskLevel: 'high',
    canRefinance: true,
    maxActive: 2,
    completionXp: 7500,
    creditImpactOnTime: 12,
    creditImpactDefault: -50,
  },

  // ═══ INVESTMENT LOANS ═══════════════════════════════════════════

  {
    id: 'margin_account',
    name: 'Margin Trading Account',
    description: 'Borrow against your portfolio to leverage investments. High risk!',
    category: 'investment',
    icon: 'mdi:chart-line',
    minAmount: D(10_000),
    maxAmount: D(2_000_000),
    baseAnnualRate: 0.075,
    rateScalesWithCredit: false, // Fixed rate for margin
    termTicks: 0, // No fixed term - margin call based
    minNetWorth: D(50_000),
    minCreditScore: 45,
    minLevel: 7,
    collateralType: 'portfolio',
    collateralRatio: 2.0, // 50% margin requirement
    earlyRepaymentPenalty: 0,
    latePaymentPenalty: 0, // Margin call instead
    gracePeriodTicks: 0,
    riskLevel: 'high',
    canRefinance: false,
    maxActive: 1,
    completionXp: 500,
    creditImpactOnTime: 3,
    creditImpactDefault: -25,
  },

  {
    id: 'securities_loan',
    name: 'Securities-Backed Loan',
    description: 'Low-rate loan secured by your investment portfolio.',
    category: 'investment',
    icon: 'mdi:briefcase-variant',
    minAmount: D(100_000),
    maxAmount: D(5_000_000),
    baseAnnualRate: 0.05,
    rateScalesWithCredit: true,
    termTicks: 216_000, // ~6 hours
    minNetWorth: D(500_000),
    minCreditScore: 60,
    minLevel: 10,
    collateralType: 'portfolio',
    collateralRatio: 1.5,
    earlyRepaymentPenalty: 0.01,
    latePaymentPenalty: 0.07,
    gracePeriodTicks: 400,
    riskLevel: 'medium',
    canRefinance: true,
    maxActive: 1,
    completionXp: 1500,
    creditImpactOnTime: 6,
    creditImpactDefault: -28,
  },

  // ═══ PREDATORY LOANS (HIGH RISK) ═══════════════════════════════

  {
    id: 'payday_loan',
    name: 'Payday Loan',
    description: 'Quick cash with sky-high interest. Desperate times call for desperate measures.',
    category: 'predatory',
    icon: 'mdi:cash-fast',
    minAmount: D(100),
    maxAmount: D(10_000),
    baseAnnualRate: 0.50, // 50% annual = crazy high
    rateScalesWithCredit: false,
    termTicks: 6_000, // ~10 minutes - very short term
    minNetWorth: D(0),
    minCreditScore: 0,
    minLevel: 1,
    collateralType: 'none',
    collateralRatio: 0,
    earlyRepaymentPenalty: 0,
    latePaymentPenalty: 0.25,
    gracePeriodTicks: 100,
    riskLevel: 'extreme',
    canRefinance: false,
    maxActive: 1,
    completionXp: 25,
    creditImpactOnTime: 1,
    creditImpactDefault: -10,
  },

  {
    id: 'loan_shark',
    name: 'Underground Loan',
    description: 'No questions asked. Just don\'t miss a payment... or else.',
    category: 'predatory',
    icon: 'mdi:skull',
    minAmount: D(1_000),
    maxAmount: D(100_000),
    baseAnnualRate: 0.80, // 80% annual - loan shark territory
    rateScalesWithCredit: false,
    termTicks: 18_000, // ~30 minutes
    minNetWorth: D(0),
    minCreditScore: 0,
    minLevel: 1,
    collateralType: 'none',
    collateralRatio: 0,
    earlyRepaymentPenalty: 0,
    latePaymentPenalty: 0.50, // Ouch
    gracePeriodTicks: 0, // No grace
    riskLevel: 'extreme',
    canRefinance: false,
    maxActive: 1,
    completionXp: 100,
    creditImpactOnTime: 0, // Off the books
    creditImpactDefault: 0, // But there are... other consequences
  },

  // ═══ SPECIAL LOANS ═══════════════════════════════════════════════

  {
    id: 'government_grant',
    name: 'Government Small Business Grant',
    description: 'Low-interest government-backed loan for qualifying businesses.',
    category: 'special',
    icon: 'mdi:bank',
    minAmount: D(25_000),
    maxAmount: D(250_000),
    baseAnnualRate: 0.025, // Very low - government subsidized
    rateScalesWithCredit: false,
    termTicks: 288_000, // ~8 hours
    minNetWorth: D(10_000),
    minCreditScore: 55,
    minLevel: 6,
    collateralType: 'business',
    collateralRatio: 0.25,
    earlyRepaymentPenalty: 0,
    latePaymentPenalty: 0.03,
    gracePeriodTicks: 1000,
    riskLevel: 'low',
    canRefinance: false,
    maxActive: 1,
    completionXp: 400,
    creditImpactOnTime: 5,
    creditImpactDefault: -15,
  },

  {
    id: 'angel_investment_loan',
    name: 'Angel Investor Bridge Loan',
    description: 'Convertible loan from an angel investor. Great terms, limited availability.',
    category: 'special',
    icon: 'mdi:account-star',
    minAmount: D(100_000),
    maxAmount: D(2_000_000),
    baseAnnualRate: 0.04,
    rateScalesWithCredit: false,
    termTicks: 432_000, // ~12 hours
    minNetWorth: D(500_000),
    minCreditScore: 70,
    minLevel: 12,
    collateralType: 'mixed',
    collateralRatio: 0.5,
    earlyRepaymentPenalty: 0,
    latePaymentPenalty: 0.05,
    gracePeriodTicks: 600,
    riskLevel: 'low',
    canRefinance: false,
    maxActive: 1,
    completionXp: 2500,
    creditImpactOnTime: 8,
    creditImpactDefault: -20,
  },

  {
    id: 'venture_debt',
    name: 'Venture Debt',
    description: 'High-growth financing for your startup portfolio. Expensive but flexible.',
    category: 'special',
    icon: 'mdi:rocket-launch',
    minAmount: D(500_000),
    maxAmount: D(20_000_000),
    baseAnnualRate: 0.10,
    rateScalesWithCredit: true,
    termTicks: 540_000, // ~15 hours
    minNetWorth: D(2_000_000),
    minCreditScore: 65,
    minLevel: 15,
    collateralType: 'mixed',
    collateralRatio: 0.75,
    earlyRepaymentPenalty: 0.02,
    latePaymentPenalty: 0.10,
    gracePeriodTicks: 300,
    riskLevel: 'high',
    canRefinance: true,
    maxActive: 1,
    completionXp: 5000,
    creditImpactOnTime: 10,
    creditImpactDefault: -35,
  },
]

// ─── Helper Functions ────────────────────────────────────────────

/**
 * Get loans by category
 */
export function getLoansByCategory(category: LoanCategory): LoanDef[] {
  return LOANS.filter(l => l.category === category)
}

/**
 * Get loans available at a given level and credit score
 */
export function getAvailableLoans(
  level: number,
  creditScore: number,
  netWorth: Decimal
): LoanDef[] {
  return LOANS.filter(l =>
    level >= l.minLevel &&
    creditScore >= l.minCreditScore &&
    netWorth.gte(l.minNetWorth)
  )
}

/**
 * Calculate effective interest rate based on credit score
 */
export function calculateEffectiveRate(
  baseDef: LoanDef,
  creditScore: number
): number {
  if (!baseDef.rateScalesWithCredit) {
    return baseDef.baseAnnualRate
  }
  // Rate multiplier: 2.0 at score 0, 1.0 at score 100
  const rateMultiplier = 2 - (creditScore / 100)
  return baseDef.baseAnnualRate * Math.max(0.5, Math.min(2.0, rateMultiplier))
}

/**
 * Calculate maximum loan amount based on credit score
 */
export function calculateMaxLoanAmount(
  baseDef: LoanDef,
  creditScore: number
): Decimal {
  // Better credit = higher max amount (50% at score 0, 100% at score 100)
  const amountMultiplier = 0.5 + (creditScore / 200)
  return baseDef.maxAmount.mul(Math.min(1.0, amountMultiplier))
}

/**
 * Loan category display metadata
 */
export const LOAN_CATEGORY_META: Record<LoanCategory, { name: string; icon: string; accent: string }> = {
  personal: { name: 'Personal', icon: 'mdi:account', accent: '#71717a' },
  business: { name: 'Business', icon: 'mdi:domain', accent: '#22c55e' },
  mortgage: { name: 'Mortgage', icon: 'mdi:home', accent: '#8b5cf6' },
  predatory: { name: 'High-Risk', icon: 'mdi:alert', accent: '#ef4444' },
  investment: { name: 'Investment', icon: 'mdi:chart-line', accent: '#f59e0b' },
  special: { name: 'Special', icon: 'mdi:star', accent: '#ec4899' },
}

/**
 * Risk level display metadata
 */
export const RISK_LEVEL_META: Record<LoanRiskLevel, { label: string; color: string }> = {
  low: { label: 'Low Risk', color: '#22c55e' },
  medium: { label: 'Medium Risk', color: '#f59e0b' },
  high: { label: 'High Risk', color: '#f97316' },
  extreme: { label: 'Extreme Risk', color: '#ef4444' },
}
