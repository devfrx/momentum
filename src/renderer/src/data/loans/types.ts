/**
 * Loans — Type definitions
 *
 * All interfaces and union types for the loan system.
 */
import type Decimal from 'break_infinity.js'

// ─── Enums / Unions ─────────────────────────────────────────────

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

// ─── Definitions ────────────────────────────────────────────────

/**
 * Loan definition — describes a type of loan available in the game.
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
  /** Rate multiplier based on credit score */
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

// ─── Runtime State ──────────────────────────────────────────────

/**
 * Active loan instance — runtime state of a taken loan.
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

// ─── Credit Score ───────────────────────────────────────────────

/**
 * Credit score factors — breakdown of the 0-100 score.
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
