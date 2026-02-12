/**
 * useDepositStore — Manages savings & fixed-deposit accounts
 *
 * Handles opening, compounding, maturing, and withdrawing deposits.
 * Integrates with skill tree (depositRate), prestige (deposit_bonus),
 * events (deposit_rate_modifier), economy simulation (interest rate),
 * credit score (via loan store), and XP system.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type Decimal from 'break_infinity.js'
import { D, ZERO, mul, add } from '@renderer/core/BigNum'
import { depositInterestPerTick } from '@renderer/core/Formulas'
import {
  DEPOSITS,
  type DepositDef,
  type ActiveDeposit,
  type DepositHistoryEntry,
  calculateEffectiveAPY,
  getCompoundIntervalTicks,
} from '@renderer/data/deposits'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'
import { usePrestigeStore } from './usePrestigeStore'
import { useEventStore } from './useEventStore'
import { useLoanStore } from './useLoanStore'
import { economySim } from '@renderer/core/EconomySim'

export const useDepositStore = defineStore('deposits', () => {
  // ─── State ──────────────────────────────────────────────────

  const deposits = ref<ActiveDeposit[]>([])
  const depositHistory = ref<DepositHistoryEntry[]>([])

  // Lifetime stats
  const totalDeposited = ref<Decimal>(ZERO)
  const totalInterestEarnedEver = ref<Decimal>(ZERO)
  const totalDepositsOpened = ref(0)
  const totalDepositsMatured = ref(0)
  const totalEarlyWithdrawals = ref(0)

  // ─── Computed ───────────────────────────────────────────────

  /** Total cash locked across all active deposits */
  const totalLockedBalance = computed<Decimal>(() => {
    let sum = ZERO
    for (const dep of deposits.value) {
      sum = add(sum, dep.currentBalance)
    }
    return sum
  })

  /** Total accrued interest across all active deposits */
  const totalAccruedInterest = computed<Decimal>(() => {
    let sum = ZERO
    for (const dep of deposits.value) {
      sum = add(sum, dep.totalInterestEarned)
    }
    return sum
  })

  /** Average effective APY across active deposits (weighted by balance) */
  const averageAPY = computed(() => {
    if (deposits.value.length === 0) return 0
    let weightedSum = 0
    let totalBal = 0
    for (const dep of deposits.value) {
      const bal = dep.currentBalance.toNumber()
      weightedSum += dep.effectiveAPY * bal
      totalBal += bal
    }
    return totalBal > 0 ? weightedSum / totalBal : 0
  })

  /** Interest earned per second across all active deposits */
  const interestPerSecond = computed<Decimal>(() => {
    let sum = ZERO
    for (const dep of deposits.value) {
      const perTick = depositInterestPerTick(dep.currentBalance, dep.effectiveAPY, 10)
      sum = add(sum, mul(perTick, 10))
    }
    return sum
  })

  // ─── APY Modifier Pipeline ─────────────────────────────────

  /**
   * Calculate the fully modified effective APY for a deposit definition.
   * Pipeline: base → credit score → skill tree → prestige → events → economy
   */
  function getModifiedAPY(def: DepositDef): number {
    const loanStore = useLoanStore()
    const upgrades = useUpgradeStore()
    const prestige = usePrestigeStore()
    const events = useEventStore()

    // 1. Base APY (adjusted by credit score if applicable)
    let apy = calculateEffectiveAPY(def, loanStore.creditScore)

    // 2. Skill tree multiplier (depositRate target)
    const skillMul = upgrades.getMultiplier('deposit_rate').toNumber()
    apy *= skillMul

    // 3. Prestige bonus (deposit_bonus — additive per level)
    const prestigeBonus = prestige.getTotalEffect('deposit_bonus')
    apy += prestigeBonus

    // 4. Event modifiers (deposit_rate_modifier — additive)
    const eventBonus = events.getMultiplier('deposit_rate_modifier')
    apy *= (1 + eventBonus)

    // 5. Economy simulation: base central-bank rate affects deposits
    //    Higher central bank rate → slightly higher deposit rates
    const ecoRate = economySim.getState().interestRate // ~0.015 to 0.08
    const ecoBonus = ecoRate * 0.5 // deposits get 50% of the central bank rate as bonus
    apy += ecoBonus

    return Math.max(0, apy)
  }

  // ─── Eligibility Check ─────────────────────────────────────

  function canOpenDeposit(defId: string): {
    eligible: boolean
    reason?: string
    effectiveAPY: number
  } {
    const def = DEPOSITS.find(d => d.id === defId)
    if (!def) return { eligible: false, reason: 'Unknown deposit type', effectiveAPY: 0 }

    const player = usePlayerStore()
    const loanStore = useLoanStore()

    if (player.level < def.minLevel) {
      return { eligible: false, reason: `Requires level ${def.minLevel}`, effectiveAPY: 0 }
    }
    if (loanStore.creditScore < def.minCreditScore) {
      return { eligible: false, reason: `Requires credit score ${def.minCreditScore}`, effectiveAPY: 0 }
    }
    if (player.netWorth.lt(def.minNetWorth)) {
      return { eligible: false, reason: `Requires net worth ${def.minNetWorth}`, effectiveAPY: 0 }
    }

    // Max active check
    const activeCount = deposits.value.filter(d => d.depositDefId === defId && !d.closed).length
    if (activeCount >= def.maxActive) {
      return { eligible: false, reason: `Max ${def.maxActive} active account(s)`, effectiveAPY: 0 }
    }

    const effectiveAPY = getModifiedAPY(def)
    return { eligible: true, effectiveAPY }
  }

  // ─── Open Deposit ──────────────────────────────────────────

  function openDeposit(defId: string, amount: Decimal, currentTick: number): string | null {
    const def = DEPOSITS.find(d => d.id === defId)
    if (!def) return null

    const check = canOpenDeposit(defId)
    if (!check.eligible) return null

    const player = usePlayerStore()

    // Validate amount
    if (amount.lt(def.minDeposit)) return null
    if (def.maxDeposit.gt(0) && amount.gt(def.maxDeposit)) return null
    if (player.cash.lt(amount)) return null

    // Deduct cash
    if (!player.spendCash(amount)) return null

    const id = `dep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const deposit: ActiveDeposit = {
      id,
      depositDefId: defId,
      principal: amount,
      currentBalance: amount,
      totalInterestEarned: ZERO,
      effectiveAPY: check.effectiveAPY,
      startTick: currentTick,
      ticksActive: 0,
      termTicks: def.termTicks,
      matured: def.termTicks === 0, // Flexible accounts are always "mature"
      loyaltyActive: false,
      ticksSinceLastCompound: 0,
      totalCompounds: 0,
      closed: false,
      loyaltyTicks: 0,
    }

    deposits.value.push(deposit)

    // Update stats
    totalDeposited.value = add(totalDeposited.value, amount)
    totalDepositsOpened.value++

    return id
  }

  // ─── Withdraw ──────────────────────────────────────────────

  function withdraw(depositId: string, amount: Decimal | null, _currentTick: number): Decimal | null {
    const dep = deposits.value.find(d => d.id === depositId)
    if (!dep || dep.closed) return null

    const def = DEPOSITS.find(d => d.id === dep.depositDefId)
    if (!def) return null

    const player = usePlayerStore()

    // Determine if this is early withdrawal
    const isEarly = def.termTicks > 0 && dep.ticksActive < def.termTicks

    // Full or partial
    const isFullWithdrawal = amount === null || amount.gte(dep.currentBalance)
    const withdrawAmount = isFullWithdrawal ? dep.currentBalance : amount

    if (!isFullWithdrawal && !def.allowPartialWithdrawal) {
      return null // Partial withdrawal not allowed
    }

    let payout = withdrawAmount
    let penaltyPaid = ZERO

    // Apply early withdrawal penalty on interest portion
    if (isEarly && def.earlyWithdrawalPenalty > 0) {
      // Penalty only applies to interest earned, not principal
      const interestPortion = dep.totalInterestEarned.gt(0)
        ? withdrawAmount.sub(dep.principal.mul(withdrawAmount.div(dep.currentBalance)))
        : ZERO

      if (interestPortion.gt(0)) {
        penaltyPaid = mul(interestPortion, def.earlyWithdrawalPenalty)
        payout = withdrawAmount.sub(penaltyPaid)
      }
    }

    // Credit the player
    player.earnCash(payout)

    if (isFullWithdrawal) {
      // Close the deposit
      dep.closed = true

      // Record history
      const status: DepositHistoryEntry['status'] = isEarly
        ? 'withdrawn_early'
        : dep.matured
          ? 'closed_at_maturity'
          : 'completed'

      depositHistory.value.push({
        depositDefId: dep.depositDefId,
        principal: dep.principal,
        totalInterestEarned: dep.totalInterestEarned,
        effectiveAPY: dep.effectiveAPY,
        ticksHeld: dep.ticksActive,
        matured: dep.matured,
        earlyWithdrawal: isEarly,
        penaltyPaid,
        status,
      })

      // XP + credit score on maturity
      if (!isEarly && def.completionXp > 0) {
        player.addXp(D(def.completionXp))
      }
      if (!isEarly && def.creditImpactOnMaturity > 0) {
        const loanStore = useLoanStore()
        loanStore.creditScore = Math.min(100, loanStore.creditScore + def.creditImpactOnMaturity)
      }

      if (isEarly) {
        totalEarlyWithdrawals.value++
      } else {
        totalDepositsMatured.value++
      }

      // Remove closed deposits from active list
      deposits.value = deposits.value.filter(d => d.id !== depositId)
    } else {
      // Partial withdrawal — reduce balances proportionally
      const ratio = withdrawAmount.div(dep.currentBalance)
      dep.currentBalance = dep.currentBalance.sub(withdrawAmount)
      dep.principal = dep.principal.sub(mul(dep.principal, ratio))
      dep.totalInterestEarned = dep.totalInterestEarned.sub(mul(dep.totalInterestEarned, ratio))
    }

    return payout
  }

  // ─── Tick (called every game tick) ─────────────────────────

  function tick(ticksPerSecond: number): void {
    for (const dep of deposits.value) {
      if (dep.closed) continue

      const def = DEPOSITS.find(d => d.id === dep.depositDefId)
      if (!def) continue

      dep.ticksActive++
      dep.ticksSinceLastCompound++

      // Check maturity
      if (!dep.matured && def.termTicks > 0 && dep.ticksActive >= def.termTicks) {
        dep.matured = true
      }

      // Check loyalty bonus activation
      if (dep.matured && !dep.loyaltyActive && def.loyaltyBonusAPY > 0) {
        const ticksPastMaturity = def.termTicks > 0
          ? dep.ticksActive - def.termTicks
          : dep.ticksActive
        if (ticksPastMaturity >= def.loyaltyThresholdTicks) {
          dep.loyaltyActive = true
        }
      }

      // Track loyalty ticks
      if (dep.loyaltyActive) {
        dep.loyaltyTicks++
      }

      // ─── Interest accrual ───────────────────────────────
      // Recalculate effective APY each tick to reflect live modifier changes
      let currentAPY = getModifiedAPY(def)

      // Add loyalty bonus
      if (dep.loyaltyActive) {
        currentAPY += def.loyaltyBonusAPY
      }

      dep.effectiveAPY = currentAPY

      // Accrue interest
      const interest = depositInterestPerTick(dep.currentBalance, currentAPY, ticksPerSecond)

      if (interest.gt(0)) {
        dep.totalInterestEarned = add(dep.totalInterestEarned, interest)
        totalInterestEarnedEver.value = add(totalInterestEarnedEver.value, interest)

        // Compound check
        const compoundInterval = getCompoundIntervalTicks(def.compoundFrequency)
        if (dep.ticksSinceLastCompound >= compoundInterval) {
          // Compound: add accrued interest to balance
          dep.currentBalance = add(dep.currentBalance, interest.mul(compoundInterval))
          dep.ticksSinceLastCompound = 0
          dep.totalCompounds++
        }
      }

      // ─── Volatility check (for volatile deposits) ──────
      if (def.risk === 'volatile' && def.volatilityChance > 0) {
        if (Math.random() < def.volatilityChance) {
          // Wipe accrued interest (not principal)
          const interestLost = dep.currentBalance.sub(dep.principal)
          if (interestLost.gt(0)) {
            dep.currentBalance = dep.principal
            dep.totalInterestEarned = ZERO
          }
        }
      }
    }
  }

  // ─── Prestige Reset ────────────────────────────────────────

  function prestigeReset(): void {
    // Return all deposit balances to player before reset
    const player = usePlayerStore()
    for (const dep of deposits.value) {
      if (!dep.closed) {
        player.earnCash(dep.currentBalance)
      }
    }
    deposits.value = []
    depositHistory.value = []
    // Keep lifetime stats
  }

  // ─── Load From Save ────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function loadFromSave(data: any): void {
    if (!data) return

    if (Array.isArray(data.deposits)) {
      deposits.value = data.deposits.map((d: ActiveDeposit) => ({
        id: d.id ?? '',
        depositDefId: d.depositDefId ?? '',
        principal: d.principal ?? ZERO,
        currentBalance: d.currentBalance ?? ZERO,
        totalInterestEarned: d.totalInterestEarned ?? ZERO,
        effectiveAPY: d.effectiveAPY ?? 0,
        startTick: d.startTick ?? 0,
        ticksActive: d.ticksActive ?? 0,
        termTicks: d.termTicks ?? 0,
        matured: d.matured ?? false,
        loyaltyActive: d.loyaltyActive ?? false,
        ticksSinceLastCompound: d.ticksSinceLastCompound ?? 0,
        totalCompounds: d.totalCompounds ?? 0,
        closed: d.closed ?? false,
        loyaltyTicks: d.loyaltyTicks ?? 0,
      }))
    }

    if (Array.isArray(data.depositHistory)) {
      depositHistory.value = data.depositHistory.map((h: DepositHistoryEntry) => ({
        depositDefId: h.depositDefId ?? '',
        principal: h.principal ?? ZERO,
        totalInterestEarned: h.totalInterestEarned ?? ZERO,
        effectiveAPY: h.effectiveAPY ?? 0,
        ticksHeld: h.ticksHeld ?? 0,
        matured: h.matured ?? false,
        earlyWithdrawal: h.earlyWithdrawal ?? false,
        penaltyPaid: h.penaltyPaid ?? ZERO,
        status: h.status ?? 'completed',
      }))
    }

    if (data.totalDeposited !== undefined) totalDeposited.value = data.totalDeposited ?? ZERO
    if (data.totalInterestEarnedEver !== undefined) totalInterestEarnedEver.value = data.totalInterestEarnedEver ?? ZERO
    if (data.totalDepositsOpened !== undefined) totalDepositsOpened.value = data.totalDepositsOpened ?? 0
    if (data.totalDepositsMatured !== undefined) totalDepositsMatured.value = data.totalDepositsMatured ?? 0
    if (data.totalEarlyWithdrawals !== undefined) totalEarlyWithdrawals.value = data.totalEarlyWithdrawals ?? 0
  }

  // ─── Return ────────────────────────────────────────────────

  return {
    // State
    deposits,
    depositHistory,
    totalDeposited,
    totalInterestEarnedEver,
    totalDepositsOpened,
    totalDepositsMatured,
    totalEarlyWithdrawals,

    // Computed
    totalLockedBalance,
    totalAccruedInterest,
    averageAPY,
    interestPerSecond,

    // Actions
    getModifiedAPY,
    canOpenDeposit,
    openDeposit,
    withdraw,
    tick,
    prestigeReset,
    loadFromSave,
  }
})
