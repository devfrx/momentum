/**
 * Loans — Helper functions & display metadata
 *
 * Filtering, rate/amount calculations, and UI-facing metadata objects.
 */
import type Decimal from 'break_infinity.js'
import type { LoanCategory, LoanDef, LoanRiskLevel } from './types'
import { LOANS } from './definitions'
import {
  RATE_MULTIPLIER_MIN,
  RATE_MULTIPLIER_MAX,
  RATE_MULTIPLIER_SPAN,
  AMOUNT_MULTIPLIER_MIN,
  AMOUNT_MULTIPLIER_SCORE_DIVISOR,
} from './balance'

// ─── Filtering ──────────────────────────────────────────────────

/** Get loans by category */
export function getLoansByCategory(category: LoanCategory): LoanDef[] {
  return LOANS.filter(l => l.category === category)
}

/** Get loans available at a given level, credit score and net worth */
export function getAvailableLoans(
  level: number,
  creditScore: number,
  netWorth: Decimal,
): LoanDef[] {
  return LOANS.filter(
    l =>
      level >= l.minLevel &&
      creditScore >= l.minCreditScore &&
      netWorth.gte(l.minNetWorth),
  )
}

// ─── Calculations ───────────────────────────────────────────────

/** Calculate effective interest rate based on credit score */
export function calculateEffectiveRate(
  baseDef: LoanDef,
  creditScore: number,
): number {
  if (!baseDef.rateScalesWithCredit) {
    return baseDef.baseAnnualRate
  }
  const rateMultiplier = Math.max(
    RATE_MULTIPLIER_MIN,
    Math.min(RATE_MULTIPLIER_MAX, RATE_MULTIPLIER_MAX - (creditScore / 100) * RATE_MULTIPLIER_SPAN),
  )
  return baseDef.baseAnnualRate * rateMultiplier
}

/** Calculate maximum loan amount based on credit score */
export function calculateMaxLoanAmount(
  baseDef: LoanDef,
  creditScore: number,
): Decimal {
  const amountMultiplier = AMOUNT_MULTIPLIER_MIN + (creditScore / AMOUNT_MULTIPLIER_SCORE_DIVISOR)
  return baseDef.maxAmount.mul(Math.min(1.0, amountMultiplier))
}

// ─── Display Metadata ───────────────────────────────────────────

/** Loan category display metadata */
export const LOAN_CATEGORY_META: Record<LoanCategory, { name: string; icon: string; accent: string }> = {
  personal:   { name: 'Personal',   icon: 'mdi:account',    accent: '#71717a' },
  business:   { name: 'Business',   icon: 'mdi:domain',     accent: '#22c55e' },
  mortgage:   { name: 'Mortgage',   icon: 'mdi:home',       accent: '#8b5cf6' },
  predatory:  { name: 'High-Risk',  icon: 'mdi:alert',      accent: '#ef4444' },
  investment: { name: 'Investment', icon: 'mdi:chart-line', accent: '#f59e0b' },
  special:    { name: 'Special',    icon: 'mdi:star',       accent: '#ec4899' },
}

/** Risk level display metadata */
export const RISK_LEVEL_META: Record<LoanRiskLevel, { label: string; color: string }> = {
  low:     { label: 'Low Risk',     color: '#22c55e' },
  medium:  { label: 'Medium Risk',  color: '#f59e0b' },
  high:    { label: 'High Risk',    color: '#f97316' },
  extreme: { label: 'Extreme Risk', color: '#ef4444' },
}
