/**
 * useCreditScore — Composable for credit score display logic.
 *
 * Extracts all credit-score presentation concerns from components:
 *   - Score tier (label, color, icon)
 *   - Factor list with per-factor status
 *   - Portfolio health badge
 *   - Utilization status
 *
 * Keeps components thin and logic shareable / testable.
 */
import { computed } from 'vue'
import { useLoanStore } from '@renderer/stores/useLoanStore'

// ─── Types ──────────────────────────────────────────────────────

export type ScoreTier = 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor'
export type FactorStatus = 'excellent' | 'good' | 'fair' | 'poor'

export interface CreditFactor {
  key: string
  icon: string
  labelKey: string
  descKey: string
  tipKey: string
  value: number
  max: number
  /** 0 – 1 ratio */
  ratio: number
  status: FactorStatus
  color: string
}

export interface ScoreTierInfo {
  tier: ScoreTier
  labelKey: string
  color: string
  icon: string
}

// ─── Tier helpers ───────────────────────────────────────────────

function scoreTier(score: number): ScoreTier {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'fair'
  if (score >= 20) return 'poor'
  return 'very_poor'
}

const TIER_META: Record<ScoreTier, { color: string; icon: string }> = {
  excellent: { color: 'var(--t-success)', icon: 'mdi:shield-check' },
  good:      { color: 'var(--t-cyan)',    icon: 'mdi:check-circle' },
  fair:      { color: 'var(--t-warning)', icon: 'mdi:minus-circle' },
  poor:      { color: 'var(--t-orange)',  icon: 'mdi:alert-circle' },
  very_poor: { color: 'var(--t-danger)',  icon: 'mdi:close-circle' },
}

// ─── Factor status helpers ──────────────────────────────────────

function factorStatus(ratio: number): FactorStatus {
  if (ratio >= 0.75) return 'excellent'
  if (ratio >= 0.50) return 'good'
  if (ratio >= 0.25) return 'fair'
  return 'poor'
}

function factorColor(status: FactorStatus): string {
  switch (status) {
    case 'excellent': return 'var(--t-success)'
    case 'good':      return 'var(--t-cyan)'
    case 'fair':      return 'var(--t-warning)'
    case 'poor':      return 'var(--t-danger)'
  }
}

// ─── Health color ───────────────────────────────────────────────

const HEALTH_COLORS: Record<string, string> = {
  excellent: 'var(--t-success)',
  good:      'var(--t-cyan)',
  fair:      'var(--t-warning)',
  poor:      'var(--t-orange)',
  critical:  'var(--t-danger)',
}

// ─── Composable ─────────────────────────────────────────────────

export function useCreditScore() {
  const loanStore = useLoanStore()

  /** Current score tier info */
  const tierInfo = computed<ScoreTierInfo>(() => {
    const tier = scoreTier(loanStore.creditScore)
    const meta = TIER_META[tier]
    return {
      tier,
      labelKey: `loans.score_${tier}`,
      color: meta.color,
      icon: meta.icon,
    }
  })

  /** Score as 0-1 fraction for gauges */
  const scoreRatio = computed(() => Math.min(loanStore.creditScore / 100, 1))

  /** Detailed factor list */
  const factors = computed<CreditFactor[]>(() => {
    const f = loanStore.creditScoreFactors
    const raw: Omit<CreditFactor, 'ratio' | 'status' | 'color'>[] = [
      {
        key: 'paymentHistory',
        icon: 'mdi:calendar-check',
        labelKey: 'loans.csw.payment_history',
        descKey: 'loans.csw.payment_history_desc',
        tipKey: 'loans.csw.payment_history_tip',
        value: f.paymentHistory,
        max: 35,
      },
      {
        key: 'creditUtilization',
        icon: 'mdi:chart-donut',
        labelKey: 'loans.csw.credit_utilization',
        descKey: 'loans.csw.credit_utilization_desc',
        tipKey: 'loans.csw.credit_utilization_tip',
        value: f.creditUtilization,
        max: 30,
      },
      {
        key: 'creditAge',
        icon: 'mdi:timer-sand',
        labelKey: 'loans.csw.credit_age',
        descKey: 'loans.csw.credit_age_desc',
        tipKey: 'loans.csw.credit_age_tip',
        value: f.creditAge,
        max: 15,
      },
      {
        key: 'creditMix',
        icon: 'mdi:layers-outline',
        labelKey: 'loans.csw.credit_mix',
        descKey: 'loans.csw.credit_mix_desc',
        tipKey: 'loans.csw.credit_mix_tip',
        value: f.creditMix,
        max: 10,
      },
      {
        key: 'newCredit',
        icon: 'mdi:plus-circle-outline',
        labelKey: 'loans.csw.new_credit',
        descKey: 'loans.csw.new_credit_desc',
        tipKey: 'loans.csw.new_credit_tip',
        value: f.newCredit,
        max: 10,
      },
    ]
    return raw.map(item => {
      const ratio = item.max > 0 ? item.value / item.max : 0
      const st = factorStatus(ratio)
      return { ...item, ratio, status: st, color: factorColor(st) }
    })
  })

  /** How much each factor contributes as percentage of total score */
  const factorWeights = computed(() =>
    factors.value.map(f => ({
      key: f.key,
      label: f.labelKey,
      weight: f.max, // absolute max pts
      pct: Math.round((f.max / 100) * 100), // % of total possible
    }))
  )

  /** Utilization helpers */
  const utilization = computed(() => {
    const u = loanStore.creditUtilization
    return {
      value: Math.round(u),
      color: u > 80 ? 'var(--t-danger)' : u > 50 ? 'var(--t-warning)' : 'var(--t-success)',
      statusKey: u > 80 ? 'loans.csw.util_high' : u > 50 ? 'loans.csw.util_moderate' : 'loans.csw.util_healthy',
      debt: loanStore.totalDebt,
      limit: loanStore.totalCreditLimit,
    }
  })

  /** Portfolio health */
  const health = computed(() => ({
    value: loanStore.portfolioHealth,
    color: HEALTH_COLORS[loanStore.portfolioHealth] ?? 'var(--t-info)',
    labelKey: `loans.health_${loanStore.portfolioHealth}`,
  }))

  return {
    score: computed(() => loanStore.creditScore),
    scoreRatio,
    tierInfo,
    factors,
    factorWeights,
    utilization,
    health,
  }
}
