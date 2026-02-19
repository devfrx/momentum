/**
 * Loans — Balance constants
 *
 * Centralized tuning knobs for the entire loan & credit-score system.
 * Adjust these to rebalance without touching game logic.
 */

// ─── Credit Limit ───────────────────────────────────────────────

/** Base limit floor: baseFloor + score × basePerPoint → $10K – $110K */
export const CREDIT_LIMIT_BASE_FLOOR = 10_000
export const CREDIT_LIMIT_BASE_PER_POINT = 1_000

/** Net-worth fraction range: min at score 0, max at score 100 */
export const CREDIT_LIMIT_NW_FRACTION_MIN = 0.10
export const CREDIT_LIMIT_NW_FRACTION_MAX = 1.00

// ─── Rate Scaling ───────────────────────────────────────────────

/** Multiplier range applied to base rate: [min, max] */
export const RATE_MULTIPLIER_MIN = 0.5
export const RATE_MULTIPLIER_MAX = 2.0

/** How much of the range credit score covers (score 100 saves this × off max) */
export const RATE_MULTIPLIER_SPAN = 1.5

// ─── Amount Scaling ─────────────────────────────────────────────

/** Fraction of maxAmount available at score 0 */
export const AMOUNT_MULTIPLIER_MIN = 0.5

/** Score divisor: multiplier = min + (score / divisor) */
export const AMOUNT_MULTIPLIER_SCORE_DIVISOR = 200

// ─── Credit Score Factors (max points) ──────────────────────────

export const MAX_PAYMENT_HISTORY = 35
export const MAX_CREDIT_UTILIZATION = 30
export const MAX_CREDIT_AGE = 15
export const MAX_CREDIT_MIX = 10
export const MAX_NEW_CREDIT = 10

/** Utilization → score: score = max − (utilPct × penalty rate) */
export const UTIL_PENALTY_RATE = 0.3

/** Credit age: full points at this many ticks (~2 hours) */
export const CREDIT_AGE_MAX_TICKS = 72_000

/** Credit mix: points per distinct loan category */
export const CREDIT_MIX_POINTS_PER_CATEGORY = 2.5

/** New credit: applications older than this (ticks) are forgotten (~30 min) */
export const NEW_CREDIT_WINDOW_TICKS = 18_000

/** Points lost per recent application */
export const NEW_CREDIT_PENALTY_PER_APP = 2

// ─── Payment Tracking ──────────────────────────────────────────

/** Credit boost per on-time partial payment */
export const ON_TIME_PARTIAL_PAYMENT_BOOST = 0.1

/** Credit boost per on-time full repayment */
export const ON_TIME_FULL_REPAY_BOOST = 0.5

/** Credit penalty per late payment */
export const LATE_PAYMENT_PENALTY = 1

/** Credit score hit per missed payment (in tick loop) */
export const MISSED_PAYMENT_CREDIT_HIT = 2

/** Fallback grace period (ticks) when loan def has none */
export const DEFAULT_GRACE_PERIOD_TICKS = 300

// ─── Revolving Credit ────────────────────────────────────────────

/** Payment check period for termTicks=0 loans (ticks, ~1 min) */
export const REVOLVING_PAYMENT_PERIOD_TICKS = 600

// ─── Initial Score State ────────────────────────────────────────

export const INITIAL_CREDIT_SCORE = 50
export const INITIAL_PAYMENT_HISTORY = 10
export const INITIAL_CREDIT_UTILIZATION = 30
export const INITIAL_CREDIT_AGE = 0
export const INITIAL_CREDIT_MIX = 0
export const INITIAL_NEW_CREDIT = 10
