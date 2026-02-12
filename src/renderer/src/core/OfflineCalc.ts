/**
 * OfflineCalc — Offline progress calculation
 *
 * Computes and applies offline earnings when the player returns after being away.
 * Supports capping max offline time, configurable efficiency, and summary generation.
 * Covers ALL income/expense streams: jobs, businesses, real estate, deposits, loans.
 */
import Decimal from 'break_infinity.js'
import { ZERO, mul, add } from './BigNum'
import { offlineEarnings } from './Formulas'

// ─── Types ──────────────────────────────────────────────────────────

export interface OfflineSummary {
  /** Seconds the player was away */
  elapsedSeconds: number
  /** Capped seconds actually credited */
  creditedSeconds: number
  /** Efficiency applied (0.0–1.0) */
  efficiency: number
  /** Total net cash earned while offline */
  cashEarned: Decimal
  /** Job income earned */
  jobIncome: Decimal
  /** Business income earned */
  businessIncome: Decimal
  /** Real estate rent earned */
  realEstateIncome: Decimal
  /** Stock dividends earned (if any) */
  dividendIncome: Decimal
  /** Deposit interest accrued (added to deposit balances, not cash) */
  depositInterest: Decimal
  /** Loan interest accrued (added to debt) */
  loanInterestPaid: Decimal
  /** Formatted time away string */
  timeAwayFormatted: string
}

export interface OfflineConfig {
  /** Fraction of income earned offline (default 0.5 = 50%) */
  efficiency: number
  /** Maximum hours of offline progress (default 24) */
  maxHours: number
  /** Minimum seconds away to show offline dialog (default 60) */
  minSecondsToShow: number
}

const DEFAULT_CONFIG: OfflineConfig = {
  efficiency: 0.5,
  maxHours: 24,
  minSecondsToShow: 5
}

// ─── Calculator ─────────────────────────────────────────────────────

/**
 * Calculate offline earnings given the player's income streams.
 * Includes ALL sources: jobs, businesses, real estate, deposits, loans.
 */
export function calculateOfflineProgress(
  lastSaveTimestamp: number,
  currentTimestamp: number,
  incomePerSecond: {
    jobs: Decimal
    business: Decimal
    realEstate: Decimal
    dividends: Decimal
    depositInterest: Decimal
    loanInterest: Decimal
  },
  config: Partial<OfflineConfig> = {}
): OfflineSummary | null {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const elapsedSeconds = Math.max(0, (currentTimestamp - lastSaveTimestamp) / 1000)

  // Don't show offline dialog for short absences
  if (elapsedSeconds < cfg.minSecondsToShow) {
    return null
  }

  const creditedSeconds = Math.min(elapsedSeconds, cfg.maxHours * 3600)

  const jobIncome = offlineEarnings(
    incomePerSecond.jobs,
    creditedSeconds,
    cfg.efficiency,
    cfg.maxHours
  )

  const businessIncome = offlineEarnings(
    incomePerSecond.business,
    creditedSeconds,
    cfg.efficiency,
    cfg.maxHours
  )

  const realEstateIncome = offlineEarnings(
    incomePerSecond.realEstate,
    creditedSeconds,
    cfg.efficiency,
    cfg.maxHours
  )

  const dividendIncome = offlineEarnings(
    incomePerSecond.dividends,
    creditedSeconds,
    cfg.efficiency,
    cfg.maxHours
  )

  // Deposit interest: full rate (not reduced by efficiency — interest always accrues)
  const depositInterest = mul(incomePerSecond.depositInterest, creditedSeconds)

  // Loan interest: full rate (debt always accrues)
  const loanInterestPaid = mul(incomePerSecond.loanInterest, creditedSeconds)

  // Net cash earned = all income - loan interest (deposits don't go to cash)
  const totalIncome = add(add(add(jobIncome, businessIncome), realEstateIncome), dividendIncome)
  const cashEarned = totalIncome

  return {
    elapsedSeconds,
    creditedSeconds,
    efficiency: cfg.efficiency,
    cashEarned,
    jobIncome,
    businessIncome,
    realEstateIncome,
    dividendIncome,
    depositInterest,
    loanInterestPaid,
    timeAwayFormatted: formatDuration(elapsedSeconds)
  }
}

// ─── Duration formatting ────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}g`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}
