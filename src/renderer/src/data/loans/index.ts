/**
 * Loans — Barrel export
 *
 * Re-exports all loan data, types, balance constants, and utilities.
 */

// Types
export type {
  LoanCategory,
  LoanRiskLevel,
  CollateralType,
  LoanDef,
  ActiveLoan,
  CreditScoreFactors,
} from './types'

// Balance constants
export {
  CREDIT_LIMIT_BASE_FLOOR,
  CREDIT_LIMIT_BASE_PER_POINT,
  CREDIT_LIMIT_NW_FRACTION_MIN,
  CREDIT_LIMIT_NW_FRACTION_MAX,
  RATE_MULTIPLIER_MIN,
  RATE_MULTIPLIER_MAX,
  RATE_MULTIPLIER_SPAN,
  AMOUNT_MULTIPLIER_MIN,
  AMOUNT_MULTIPLIER_SCORE_DIVISOR,
  MAX_PAYMENT_HISTORY,
  MAX_CREDIT_UTILIZATION,
  MAX_CREDIT_AGE,
  MAX_CREDIT_MIX,
  MAX_NEW_CREDIT,
  UTIL_PENALTY_RATE,
  CREDIT_AGE_MAX_TICKS,
  CREDIT_MIX_POINTS_PER_CATEGORY,
  NEW_CREDIT_WINDOW_TICKS,
  NEW_CREDIT_PENALTY_PER_APP,
  ON_TIME_PARTIAL_PAYMENT_BOOST,
  ON_TIME_FULL_REPAY_BOOST,
  LATE_PAYMENT_PENALTY,
  MISSED_PAYMENT_CREDIT_HIT,
  DEFAULT_GRACE_PERIOD_TICKS,
  REVOLVING_PAYMENT_PERIOD_TICKS,
  INITIAL_CREDIT_SCORE,
  INITIAL_PAYMENT_HISTORY,
  INITIAL_CREDIT_UTILIZATION,
  INITIAL_CREDIT_AGE,
  INITIAL_CREDIT_MIX,
  INITIAL_NEW_CREDIT,
} from './balance'

// Definitions
export { LOANS } from './definitions'

// Helpers & metadata
export {
  getLoansByCategory,
  getAvailableLoans,
  calculateEffectiveRate,
  calculateMaxLoanAmount,
  LOAN_CATEGORY_META,
  RISK_LEVEL_META,
} from './helpers'
