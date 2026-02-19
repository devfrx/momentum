/**
 * useLoanStore — Comprehensive loan management system
 *
 * Handles all loan operations including:
 * - Taking and repaying loans
 * - Credit score management
 * - Interest accrual
 * - Collateral management
 * - Default handling
 * - Loan history tracking
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, div, gte, max } from '@renderer/core/BigNum'
import { Formulas } from '@renderer/core'
import { gameEngine } from '@renderer/core/GameEngine'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'
import { usePrestigeStore } from './usePrestigeStore'
import { useBusinessStore } from './useBusinessStore'
import { useRealEstateStore } from './useRealEstateStore'
import { useStockStore } from './useStockStore'
import { useCryptoStore } from './useCryptoStore'
import {
  LOANS,
  type LoanDef,
  type ActiveLoan,
  type CollateralType,
  type CreditScoreFactors,
  calculateEffectiveRate,
  calculateMaxLoanAmount,
  // Balance constants
  CREDIT_LIMIT_BASE_FLOOR,
  CREDIT_LIMIT_BASE_PER_POINT,
  CREDIT_LIMIT_NW_FRACTION_MIN,
  CREDIT_LIMIT_NW_FRACTION_MAX,
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
} from '@renderer/data/loans'

// Re-export types for consumers
export type { ActiveLoan, LoanDef, CollateralType, CreditScoreFactors }

// ─── Types ────────────────────────────────────────────────────

export interface LoanHistoryEntry {
  loanDefId: string
  principal: Decimal
  totalInterestPaid: Decimal
  startTick: number
  endTick: number
  status: 'repaid' | 'defaulted' | 'refinanced'
  onTimePayments: number
  latePayments: number
}

export interface LoanApplication {
  loanDefId: string
  requestedAmount: Decimal
  approved: boolean
  reason?: string
  effectiveRate?: number
  maxApproved?: Decimal
}

// ─── Store ────────────────────────────────────────────────────

export const useLoanStore = defineStore('loans', () => {
  // ─── State ────────────────────────────────────────────────────

  /** Active loans */
  const loans = ref<ActiveLoan[]>([])

  /** Credit score (0-100) */
  const creditScore = ref(INITIAL_CREDIT_SCORE)

  /** Credit score factors for detailed breakdown */
  const creditScoreFactors = ref<CreditScoreFactors>({
    paymentHistory: 10, // No history yet – neutral
    creditUtilization: 30, // No debt = 0 % utilisation = max 30
    creditAge: 0, // Builds over time
    creditMix: 0, // No loan history yet
    newCredit: 10, // No recent inquiries = max 10
  })

  /** Loan history for tracking past loans */
  const loanHistory = ref<LoanHistoryEntry[]>([])

  /** Total ticks with any loan (for credit history age) */
  const totalTicksWithCredit = ref(0)

  /** Recent loan applications (affects new credit score) */
  const recentApplications = ref<number[]>([]) // Tick numbers of applications

  /** Total loans taken ever */
  const totalLoansTaken = ref(0)

  /** Total loans repaid on time */
  const totalLoansRepaidOnTime = ref(0)

  /** Total loans defaulted */
  const totalLoansDefaulted = ref(0)

  /** Total interest paid ever */
  const totalInterestPaidEver = ref<Decimal>(ZERO)

  // ─── Computed ─────────────────────────────────────────────────

  /** Total outstanding debt across all loans */
  const totalDebt = computed<Decimal>(() =>
    loans.value.reduce((sum, l) => add(sum, l.remaining), ZERO)
  )

  /** Total minimum payment due per tick */
  const totalMinPaymentPerTick = computed<Decimal>(() =>
    loans.value.reduce((sum, l) => add(sum, l.minPaymentPerTick), ZERO)
  )

  /** Total collateral locked */
  const totalCollateralLocked = computed<Decimal>(() =>
    loans.value.reduce((sum, l) => add(sum, l.collateralLocked), ZERO)
  )

  /** Number of loans in default */
  const loansInDefault = computed(() =>
    loans.value.filter(l => l.isDefaulted).length
  )

  /** Total credit limit available to the player */
  const totalCreditLimit = computed<Decimal>(() => {
    const player = usePlayerStore()
    return calculateTotalCreditLimit(creditScore.value, player.netWorth)
  })

  /** Credit utilization ratio (debt / available credit limit) */
  const creditUtilization = computed(() => {
    if (totalCreditLimit.value.lte(0)) return 0
    return Math.min(100, totalDebt.value.div(totalCreditLimit.value).mul(100).toNumber())
  })

  /** Average interest rate across all loans */
  const averageInterestRate = computed(() => {
    if (loans.value.length === 0) return 0
    const totalWeighted = loans.value.reduce(
      (sum, l) => sum + l.effectiveRate * l.remaining.toNumber(),
      0
    )
    const totalRemaining = totalDebt.value.toNumber()
    return totalRemaining > 0 ? totalWeighted / totalRemaining : 0
  })

  /** Total interest accrued per second across all loans */
  const totalInterestPerSecond = computed<Decimal>(() => {
    let sum = ZERO
    for (const loan of loans.value) {
      const perTick = Formulas.loanInterestPerTick(loan.remaining, loan.effectiveRate, 10)
      sum = add(sum, mul(perTick, 10))
    }
    return sum
  })

  /** Health status of loan portfolio */
  const portfolioHealth = computed<'excellent' | 'good' | 'fair' | 'poor' | 'critical'>(() => {
    if (loansInDefault.value > 0) return 'critical'
    if (creditUtilization.value > 80) return 'poor'
    if (creditUtilization.value > 60) return 'fair'
    if (creditUtilization.value > 30) return 'good'
    return 'excellent'
  })

  // ─── Credit Score Calculation ─────────────────────────────────

  /** Recalculate credit score from factors */
  function recalculateCreditScore(): void {
    const factors = creditScoreFactors.value
    creditScore.value = Math.round(
      factors.paymentHistory +
      factors.creditUtilization +
      factors.creditAge +
      factors.creditMix +
      factors.newCredit
    )
    // Clamp to 0-100
    creditScore.value = Math.max(0, Math.min(100, creditScore.value))
  }

  /** Update credit utilization factor based on current debt */
  function updateCreditUtilizationFactor(): void {
    const util = creditUtilization.value
    const max = MAX_CREDIT_UTILIZATION
    creditScoreFactors.value.creditUtilization = Math.round(Math.max(0, max - (util * UTIL_PENALTY_RATE)))
    recalculateCreditScore()
  }

  /** Update credit age factor based on history length */
  function updateCreditAgeFactor(): void {
    const max = MAX_CREDIT_AGE
    const ageFactor = Math.min(max, (totalTicksWithCredit.value / CREDIT_AGE_MAX_TICKS) * max)
    creditScoreFactors.value.creditAge = Math.round(ageFactor)
    recalculateCreditScore()
  }

  /** Update credit mix factor based on loan variety (active + history) */
  function updateCreditMixFactor(): void {
    // 10 points max for having diverse loan types across active AND past loans
    const categories = new Set<string | undefined>()

    // Active loans
    for (const l of loans.value) {
      const def = LOANS.find(d => d.id === l.loanDefId)
      if (def) categories.add(def.category)
    }

    // Loan history (successfully repaid / refinanced loans still count)
    for (const h of loanHistory.value) {
      const def = LOANS.find(d => d.id === h.loanDefId)
      if (def) categories.add(def.category)
    }

    const mixScore = Math.min(MAX_CREDIT_MIX, categories.size * CREDIT_MIX_POINTS_PER_CATEGORY)
    creditScoreFactors.value.creditMix = mixScore
    recalculateCreditScore()
  }

  /** Update new credit factor based on recent applications */
  function updateNewCreditFactor(currentTick: number): void {
    recentApplications.value = recentApplications.value.filter(
      tick => currentTick - tick < NEW_CREDIT_WINDOW_TICKS
    )
    const penalty = Math.min(MAX_NEW_CREDIT, recentApplications.value.length * NEW_CREDIT_PENALTY_PER_APP)
    creditScoreFactors.value.newCredit = MAX_NEW_CREDIT - penalty
    recalculateCreditScore()
  }

  // ─── Loan Application ─────────────────────────────────────────

  /** Check if player can apply for a specific loan type.
   *  Pass excludeLoanId when refinancing so the loan being replaced
   *  is not counted against `maxActive`. */
  function canApplyForLoan(loanDefId: string, excludeLoanId?: string): LoanApplication {
    const player = usePlayerStore()
    const def = LOANS.find(l => l.id === loanDefId)

    if (!def) {
      return { loanDefId, requestedAmount: ZERO, approved: false, reason: 'Unknown loan type' }
    }

    // Check level requirement
    if (player.level < def.minLevel) {
      return {
        loanDefId,
        requestedAmount: ZERO,
        approved: false,
        reason: `Requires level ${def.minLevel} (current: ${player.level})`
      }
    }

    // Check credit score requirement
    if (creditScore.value < def.minCreditScore) {
      return {
        loanDefId,
        requestedAmount: ZERO,
        approved: false,
        reason: `Requires credit score ${def.minCreditScore} (current: ${creditScore.value})`
      }
    }

    // Check net worth requirement
    if (player.netWorth.lt(def.minNetWorth)) {
      return {
        loanDefId,
        requestedAmount: ZERO,
        approved: false,
        reason: `Requires net worth of $${def.minNetWorth.toNumber().toLocaleString()}`
      }
    }

    // Check max active limit (exclude a loan being refinanced, if any)
    const activeOfType = loans.value.filter(
      l => l.loanDefId === loanDefId && l.id !== excludeLoanId
    ).length
    if (activeOfType >= def.maxActive) {
      return {
        loanDefId,
        requestedAmount: ZERO,
        approved: false,
        reason: `Maximum ${def.maxActive} active loan(s) of this type`
      }
    }

    // Check collateral if required
    if (def.collateralType !== 'none' && def.collateralRatio > 0) {
      const availableCollateral = getAvailableCollateral(def.collateralType)
      const maxLoanFromCollateral = availableCollateral.div(def.collateralRatio)
      if (maxLoanFromCollateral.lt(def.minAmount)) {
        return {
          loanDefId,
          requestedAmount: ZERO,
          approved: false,
          reason: `Insufficient collateral (need ${def.collateralRatio * 100}% of loan value)`
        }
      }
    }

    // Check credit limit — new loan must not push total debt beyond credit limit
    const projectedDebt = add(totalDebt.value, def.minAmount)
    if (projectedDebt.gt(totalCreditLimit.value)) {
      return {
        loanDefId,
        requestedAmount: ZERO,
        approved: false,
        reason: 'Exceeds credit limit'
      }
    }

    // Approved! Calculate terms
    const effectiveRate = calculateEffectiveRate(def, creditScore.value)
    let maxApproved = calculateMaxLoanAmount(def, creditScore.value)

    // Cap maxApproved so total debt never exceeds credit limit
    const headroom = max(ZERO, sub(totalCreditLimit.value, totalDebt.value))
    if (maxApproved.gt(headroom)) {
      maxApproved = headroom
    }

    return {
      loanDefId,
      requestedAmount: maxApproved,
      approved: true,
      effectiveRate,
      maxApproved,
    }
  }

  /** Get available collateral by type */
  function getAvailableCollateral(collateralType: CollateralType): Decimal {
    const business = useBusinessStore()
    const realEstate = useRealEstateStore()
    const stocks = useStockStore()
    const crypto = useCryptoStore()

    // Subtract already locked collateral
    const lockedByType = loans.value
      .filter(l => l.collateralType === collateralType)
      .reduce((sum, l) => add(sum, l.collateralLocked), ZERO)

    switch (collateralType) {
      case 'business':
        return max(ZERO, sub(business.totalBusinessValue, lockedByType))
      case 'property':
        return max(ZERO, sub(realEstate.totalPropertyValue, lockedByType))
      case 'portfolio':
        const portfolioValue = add(stocks.totalPortfolioValue ?? ZERO, crypto.totalWalletValue ?? ZERO)
        return max(ZERO, sub(portfolioValue, lockedByType))
      case 'mixed': {
        const totalAssets = add(
          add(business.totalBusinessValue, realEstate.totalPropertyValue),
          add(stocks.totalPortfolioValue ?? ZERO, crypto.totalWalletValue ?? ZERO)
        )
        // Subtract ALL locked collateral (business, property, portfolio, and mixed)
        const allLocked = loans.value
          .reduce((sum, l) => add(sum, l.collateralLocked), ZERO)
        return max(ZERO, sub(totalAssets, allLocked))
      }
      default:
        return D(Number.MAX_SAFE_INTEGER) // No collateral needed
    }
  }

  // ─── Take Loan ────────────────────────────────────────────────

  /** Take a new loan. Returns the loan ID or null if failed. */
  function takeLoan(
    loanDefId: string,
    amount: Decimal,
    currentTick: number,
    collateralAssetId?: string
  ): string | null {
    const def = LOANS.find(l => l.id === loanDefId)
    if (!def) return null

    const application = canApplyForLoan(loanDefId)
    if (!application.approved) return null

    // Validate amount
    if (amount.lt(def.minAmount) || amount.gt(application.maxApproved!)) {
      return null
    }

    const player = usePlayerStore()
    const upgrades = useUpgradeStore()
    const prestige = usePrestigeStore()

    // Calculate effective rate with modifiers
    let effectiveRate = application.effectiveRate!

    // Apply loan_rate upgrade multiplier
    const loanRateMul = upgrades.getMultiplier('loan_rate').toNumber()
    effectiveRate *= loanRateMul

    // Apply prestige loan_discount
    let prestigeDiscount = 0
    for (const upg of prestige.upgrades) {
      if (upg.level > 0 && upg.effectType === 'loan_discount') {
        prestigeDiscount += upg.effectValue * upg.level
      }
    }
    effectiveRate = Math.max(0.01, effectiveRate - prestigeDiscount)

    // Calculate collateral to lock
    let collateralLocked = ZERO
    if (def.collateralType !== 'none' && def.collateralRatio > 0) {
      collateralLocked = mul(amount, def.collateralRatio)
    }

    // Calculate minimum payment per tick
    // Amortized loans: standard amortization schedule
    // Revolving credit (termTicks=0): interest-only minimum payment
    const minPaymentPerTick = def.termTicks > 0
      ? Formulas.loanPaymentPerTick(amount, effectiveRate, def.termTicks)
      : Formulas.loanInterestPerTick(amount, effectiveRate, 10)

    // Create the loan
    const loanId = `loan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const loan: ActiveLoan = {
      id: loanId,
      loanDefId,
      principal: amount,
      remaining: amount,
      effectiveRate,
      startTick: currentTick,
      ticksActive: 0,
      termTicks: def.termTicks,
      totalPaid: ZERO,
      totalInterestPaid: ZERO,
      principalPaid: ZERO,
      minPaymentPerTick,
      ticksSinceLastPayment: 0,
      ticksLate: 0,
      isDefaulted: false,
      collateralLocked,
      collateralType: def.collateralType,
      collateralId: collateralAssetId,
      onTimePayments: 0,
      latePayments: 0,
      missedPayments: 0,
    }

    loans.value.push(loan)

    // Credit the cash to player
    player.earnCash(amount)

    // Record application for credit score
    recentApplications.value.push(currentTick)
    updateNewCreditFactor(currentTick)
    updateCreditMixFactor()
    updateCreditUtilizationFactor()

    // Update stats
    totalLoansTaken.value++

    return loanId
  }

  // ─── Repay Loan ───────────────────────────────────────────────

  /** Make a payment on a loan. Returns amount actually paid. */
  function repayLoan(loanId: string, amount: Decimal, currentTick: number): Decimal {
    const loan = loans.value.find(l => l.id === loanId)
    if (!loan) return ZERO

    const player = usePlayerStore()
    const def = LOANS.find(l => l.id === loan.loanDefId)

    // Cap at remaining balance and available cash
    let toPay = gte(amount, loan.remaining) ? loan.remaining : amount
    if (!gte(player.cash, toPay)) toPay = player.cash
    if (toPay.lte(ZERO)) return ZERO

    // Check for early repayment penalty (only when paying off the entire loan early)
    let penalty = ZERO
    if (def && def.earlyRepaymentPenalty > 0 && toPay.gte(loan.remaining)) {
      if (loan.ticksActive < loan.termTicks) {
        penalty = mul(loan.remaining, def.earlyRepaymentPenalty)
        const totalWithPenalty = add(toPay, penalty)
        if (!gte(player.cash, totalWithPenalty)) {
          // Can't afford with penalty, just pay what we can (no penalty applied)
          toPay = player.cash
          penalty = ZERO
        }
      }
    }

    // Deduct principal payment + penalty separately
    player.spendCash(add(toPay, penalty))
    
    // Update tracking fields — toPay goes toward the balance, penalty is extra cost
    loan.totalPaid = add(loan.totalPaid, add(toPay, penalty))
    // Calculate principal portion (payment minus any interest accrued)
    const interestPortion = sub(loan.remaining, sub(loan.principal, loan.principalPaid))
    const interestActuallyPaid = interestPortion.gt(ZERO) ? Decimal.min(interestPortion, toPay) : ZERO
    const principalPortion = sub(toPay, interestActuallyPaid)
    loan.principalPaid = add(loan.principalPaid, principalPortion)
    loan.totalInterestPaid = add(loan.totalInterestPaid, interestActuallyPaid)
    totalInterestPaidEver.value = add(totalInterestPaidEver.value, interestActuallyPaid)
    
    loan.remaining = max(ZERO, sub(loan.remaining, toPay))
    loan.ticksSinceLastPayment = 0
    loan.ticksLate = 0

    // Track payment timing
    const gracePeriod = def?.gracePeriodTicks ?? DEFAULT_GRACE_PERIOD_TICKS
    if (loan.ticksLate <= gracePeriod) {
      loan.onTimePayments++
      // Slight credit boost for on-time payment
      creditScoreFactors.value.paymentHistory = Math.min(
        MAX_PAYMENT_HISTORY,
        creditScoreFactors.value.paymentHistory + ON_TIME_PARTIAL_PAYMENT_BOOST
      )
    } else {
      loan.latePayments++
      // Credit score penalty for late payment
      creditScoreFactors.value.paymentHistory = Math.max(
        0,
        creditScoreFactors.value.paymentHistory - LATE_PAYMENT_PENALTY
      )
    }

    // Check if loan is fully repaid
    if (loan.remaining.lte(ZERO)) {
      completeLoan(loan, 'repaid', currentTick)
    }

    recalculateCreditScore()
    updateCreditUtilizationFactor()

    return toPay
  }

  /** Repay loan in full (with any applicable penalties) */
  function repayLoanInFull(loanId: string, currentTick: number): boolean {
    const loan = loans.value.find(l => l.id === loanId)
    if (!loan) return false

    const player = usePlayerStore()
    const def = LOANS.find(l => l.id === loan.loanDefId)

    let totalOwed = loan.remaining

    // Add early repayment penalty if applicable
    if (def && def.earlyRepaymentPenalty > 0 && loan.ticksActive < loan.termTicks) {
      const penalty = mul(loan.remaining, def.earlyRepaymentPenalty)
      totalOwed = add(totalOwed, penalty)
    }

    if (!gte(player.cash, totalOwed)) return false

    player.spendCash(totalOwed)

    // Update tracking fields before completing
    loan.totalPaid = add(loan.totalPaid, totalOwed)
    const remainingInterest = sub(loan.remaining, sub(loan.principal, loan.principalPaid))
    const interestActuallyPaid = remainingInterest.gt(ZERO) ? remainingInterest : ZERO
    const principalLeft = sub(loan.remaining, interestActuallyPaid)
    loan.principalPaid = add(loan.principalPaid, principalLeft)
    loan.totalInterestPaid = add(loan.totalInterestPaid, interestActuallyPaid)
    totalInterestPaidEver.value = add(totalInterestPaidEver.value, interestActuallyPaid)
    loan.remaining = ZERO

    // Track payment timing for credit score
    const gracePeriod = def?.gracePeriodTicks ?? DEFAULT_GRACE_PERIOD_TICKS
    if (loan.ticksLate <= gracePeriod) {
      loan.onTimePayments++
      creditScoreFactors.value.paymentHistory = Math.min(
        MAX_PAYMENT_HISTORY,
        creditScoreFactors.value.paymentHistory + ON_TIME_FULL_REPAY_BOOST
      )
    } else {
      loan.latePayments++
      creditScoreFactors.value.paymentHistory = Math.max(
        0,
        creditScoreFactors.value.paymentHistory - LATE_PAYMENT_PENALTY
      )
    }

    completeLoan(loan, 'repaid', currentTick)

    return true
  }

  /** Complete a loan (repaid, defaulted, or refinanced) */
  function completeLoan(
    loan: ActiveLoan,
    status: 'repaid' | 'defaulted' | 'refinanced',
    currentTick: number
  ): void {
    const def = LOANS.find(l => l.id === loan.loanDefId)
    const player = usePlayerStore()

    // Add to history
    loanHistory.value.push({
      loanDefId: loan.loanDefId,
      principal: loan.principal,
      totalInterestPaid: loan.totalInterestPaid,
      startTick: currentTick - loan.ticksActive,
      endTick: currentTick,
      status,
      onTimePayments: loan.onTimePayments,
      latePayments: loan.latePayments,
    })

    // Update stats based on outcome
    if (status === 'repaid') {
      totalLoansRepaidOnTime.value++
      if (def) {
        player.addXp(D(def.completionXp))
        creditScoreFactors.value.paymentHistory = Math.min(
          MAX_PAYMENT_HISTORY,
          creditScoreFactors.value.paymentHistory + def.creditImpactOnTime
        )
      }
    } else if (status === 'defaulted') {
      totalLoansDefaulted.value++
      if (def) {
        creditScoreFactors.value.paymentHistory = Math.max(
          0,
          creditScoreFactors.value.paymentHistory + def.creditImpactDefault
        )
      }
    }

    // Remove from active loans
    loans.value = loans.value.filter(l => l.id !== loan.id)

    recalculateCreditScore()
    updateCreditUtilizationFactor()
    updateCreditMixFactor()
  }

  // ─── Interest Accrual ─────────────────────────────────────────

  /** Tick function - accrue interest and handle payments */
  function tick(ticksPerSecond: number = 10): void {
    // Collect loans to default/margin-call AFTER the loop to avoid mutating during iteration
    const toDefault: ActiveLoan[] = []
    const toMarginCall: ActiveLoan[] = []

    for (const loan of loans.value) {
      if (loan.isDefaulted) continue

      // Accrue interest (added to remaining; tracked as paid only when player actually pays)
      const interest = Formulas.loanInterestPerTick(
        loan.remaining,
        loan.effectiveRate,
        ticksPerSecond
      )
      loan.remaining = add(loan.remaining, interest)

      loan.ticksActive++
      loan.ticksSinceLastPayment++

      // Check for missed payment (amortized AND revolving loans)
      const def = LOANS.find(l => l.id === loan.loanDefId)
      if (def) {
        // For revolving credit (termTicks=0): payment period every N ticks
        const paymentPeriod = def.termTicks > 0
          ? Math.max(100, def.termTicks / 100)
          : REVOLVING_PAYMENT_PERIOD_TICKS
        const gracePeriod = def.gracePeriodTicks

        // Track ticks late (used by repayLoan to judge on-time vs late)
        if (loan.ticksSinceLastPayment > paymentPeriod) {
          loan.ticksLate = loan.ticksSinceLastPayment - paymentPeriod
        }

        if (loan.ticksSinceLastPayment > paymentPeriod + gracePeriod) {
          // Missed payment
          loan.missedPayments++

          // Apply late payment penalty
          if (def.latePaymentPenalty > 0) {
            const penaltyBase = def.termTicks > 0
              ? loan.minPaymentPerTick.mul(paymentPeriod)
              : Formulas.loanInterestPerTick(loan.remaining, loan.effectiveRate, ticksPerSecond).mul(paymentPeriod)
            const penalty = mul(penaltyBase, def.latePaymentPenalty)
            loan.remaining = add(loan.remaining, penalty)
          }

          // Credit score hit
          creditScoreFactors.value.paymentHistory = Math.max(
            0,
            creditScoreFactors.value.paymentHistory - MISSED_PAYMENT_CREDIT_HIT
          )

          // Queue for default (3 missed payments)
          if (loan.missedPayments >= 3 && !loan.isDefaulted) {
            toDefault.push(loan)
          }

          // Reset payment timer & late counter
          loan.ticksSinceLastPayment = 0
          loan.ticksLate = 0
        }
      }

      // Check for margin call (investment loans with portfolio collateral)
      if (loan.collateralType === 'portfolio' && def?.category === 'investment') {
        const availableCollateral = getAvailableCollateral('portfolio')
        const requiredCollateral = mul(loan.remaining, def.collateralRatio)
        if (availableCollateral.lt(requiredCollateral)) {
          toMarginCall.push(loan)
        }
      }
    }

    // Process defaults and margin calls after iteration
    for (const loan of toMarginCall) {
      handleMarginCall(loan)
    }
    for (const loan of toDefault) {
      if (!loan.isDefaulted) {
        handleDefault(loan, gameEngine.currentTick)
      }
    }

    // Track credit history age (once per tick, not per loan)
    if (loans.value.length > 0) {
      totalTicksWithCredit.value++
    }

    // Update credit factors periodically
    updateCreditAgeFactor()
    updateCreditUtilizationFactor()
  }

  /** Handle loan default — seize collateral, penalise credit, and close the loan */
  function handleDefault(loan: ActiveLoan, currentTick: number): void {
    loan.isDefaulted = true
    const player = usePlayerStore()

    // NOTE: credit penalty is applied inside completeLoan('defaulted'),
    //       NOT here — avoids the double-penalty bug.

    // Seize collateral: take all available cash up to collateral value,
    // then force-deduct any shortfall so the player cannot exploit zero-cash.
    if (loan.collateralLocked.gt(0)) {
      const seizeFromCash = Decimal.min(player.cash, loan.collateralLocked)
      if (seizeFromCash.gt(ZERO)) {
        player.spendCash(seizeFromCash)
      }
      const shortfall = sub(loan.collateralLocked, seizeFromCash)
      if (shortfall.gt(ZERO)) {
        // Apply shortfall as a negative cash adjustment (player will carry the debt)
        player.earnCash(shortfall)       // temporarily add to make spendCash succeed
        player.spendCash(shortfall)      // then immediately take it away  → net 0
        // The real penalty: reduce relevant asset value
        reduceCollateralAssets(loan.collateralType, shortfall)
      }
      loan.collateralLocked = ZERO
    }

    // Complete and remove the defaulted loan
    completeLoan(loan, 'defaulted', currentTick)
  }

  /**
   * Force-reduce asset values when cash is insufficient to cover seized collateral.
   * This prevents the exploit of keeping zero cash to avoid collateral seizure.
   */
  function reduceCollateralAssets(collateralType: CollateralType, amount: Decimal): void {
    const business = useBusinessStore()
    const realEstate = useRealEstateStore()
    const stocks = useStockStore()
    const crypto = useCryptoStore()

    switch (collateralType) {
      case 'business':
        if (typeof business.reduceAssetValue === 'function') business.reduceAssetValue(amount)
        break
      case 'property':
        if (typeof realEstate.reduceAssetValue === 'function') realEstate.reduceAssetValue(amount)
        break
      case 'portfolio': {
        // Split evenly between stocks and crypto
        const half = div(amount, 2)
        if (typeof stocks.reduceAssetValue === 'function') stocks.reduceAssetValue(half)
        if (typeof crypto.reduceAssetValue === 'function') crypto.reduceAssetValue(half)
        break
      }
      case 'mixed': {
        const quarter = div(amount, 4)
        if (typeof business.reduceAssetValue === 'function') business.reduceAssetValue(quarter)
        if (typeof realEstate.reduceAssetValue === 'function') realEstate.reduceAssetValue(quarter)
        if (typeof stocks.reduceAssetValue === 'function') stocks.reduceAssetValue(quarter)
        if (typeof crypto.reduceAssetValue === 'function') crypto.reduceAssetValue(quarter)
        break
      }
    }
  }

  /** Handle margin call — direct balance reduction, no credit score side-effects */
  function handleMarginCall(loan: ActiveLoan): void {
    const player = usePlayerStore()

    // Try to auto-pay down to safe level
    const def = LOANS.find(l => l.id === loan.loanDefId)
    if (!def) return

    const availableCollateral = getAvailableCollateral('portfolio')
    const safeBalance = div(availableCollateral, def.collateralRatio)
    const needToRepay = sub(loan.remaining, safeBalance)

    if (needToRepay.gt(0) && player.cash.gte(needToRepay)) {
      // Pay down directly — bypasses repayLoan to avoid credit score farming
      player.spendCash(needToRepay)
      loan.remaining = sub(loan.remaining, needToRepay)
      loan.totalPaid = add(loan.totalPaid, needToRepay)
    } else {
      // Can't meet margin call - default
      handleDefault(loan, gameEngine.currentTick)
    }
  }

  // ─── Refinancing ──────────────────────────────────────────────

  /** Refinance a loan to a new loan type with better terms */
  function refinanceLoan(
    loanId: string,
    newLoanDefId: string,
    currentTick: number
  ): string | null {
    const oldLoan = loans.value.find(l => l.id === loanId)
    if (!oldLoan) return null

    const oldDef = LOANS.find(l => l.id === oldLoan.loanDefId)
    const newDef = LOANS.find(l => l.id === newLoanDefId)
    if (!oldDef || !newDef || !oldDef.canRefinance) return null

    // Check if new loan can cover old balance (exclude oldLoan from maxActive)
    const application = canApplyForLoan(newLoanDefId, loanId)
    if (!application.approved || application.maxApproved!.lt(oldLoan.remaining)) {
      return null
    }

    // Take new loan for remaining balance
    const newLoanId = takeLoan(newLoanDefId, oldLoan.remaining, currentTick)
    if (!newLoanId) return null

    // Complete old loan as refinanced
    completeLoan(oldLoan, 'refinanced', currentTick)

    return newLoanId
  }

  // ─── Utility Functions ────────────────────────────────────────

  /** Calculate total credit limit available to player */
  function calculateTotalCreditLimit(score: number, netWorth: Decimal): Decimal {
    // Floor: small base so early-game players still have a limit
    const baseLimit = D(CREDIT_LIMIT_BASE_FLOOR + score * CREDIT_LIMIT_BASE_PER_POINT)

    // Net-worth-based limit: score determines what fraction of net worth
    // the system trusts you with.
    const nwRange = CREDIT_LIMIT_NW_FRACTION_MAX - CREDIT_LIMIT_NW_FRACTION_MIN
    const nwFraction = CREDIT_LIMIT_NW_FRACTION_MIN + (score / 100) * nwRange
    const netWorthLimit = mul(netWorth, nwFraction)

    // Take the greater of the two so early-game floor still works,
    // but late-game scales properly with net worth.
    return netWorthLimit.gt(baseLimit) ? netWorthLimit : baseLimit
  }

  /** Get loan definition by ID */
  function getLoanDef(loanDefId: string): LoanDef | undefined {
    return LOANS.find(l => l.id === loanDefId)
  }

  /** Get active loan by ID */
  function getLoan(loanId: string): ActiveLoan | undefined {
    return loans.value.find(l => l.id === loanId)
  }

  // ─── Prestige Reset ───────────────────────────────────────────

  /** Reset loan state on prestige */
  function prestigeReset(): void {
    loans.value = []
    creditScore.value = INITIAL_CREDIT_SCORE
    creditScoreFactors.value = {
      paymentHistory: INITIAL_PAYMENT_HISTORY,
      creditUtilization: INITIAL_CREDIT_UTILIZATION,
      creditAge: INITIAL_CREDIT_AGE,
      creditMix: INITIAL_CREDIT_MIX,
      newCredit: INITIAL_NEW_CREDIT,
    }
    loanHistory.value = []
    totalTicksWithCredit.value = 0
    recentApplications.value = []
    // Keep lifetime stats across prestiges
  }

  // ─── Save/Load ────────────────────────────────────────────────

  /** Hydrate from save data */
  function loadFromSave(data: {
    loans: ActiveLoan[]
    creditScore: number
    creditScoreFactors: CreditScoreFactors
    loanHistory: LoanHistoryEntry[]
    totalTicksWithCredit: number
    recentApplications: number[]
    totalLoansTaken: number
    totalLoansRepaidOnTime: number
    totalLoansDefaulted: number
    totalInterestPaidEver: Decimal
  }): void {
    loans.value = data.loans ?? []
    creditScore.value = data.creditScore ?? INITIAL_CREDIT_SCORE
    creditScoreFactors.value = data.creditScoreFactors ?? {
      paymentHistory: INITIAL_PAYMENT_HISTORY,
      creditUtilization: INITIAL_CREDIT_UTILIZATION,
      creditAge: INITIAL_CREDIT_AGE,
      creditMix: INITIAL_CREDIT_MIX,
      newCredit: INITIAL_NEW_CREDIT,
    }
    loanHistory.value = data.loanHistory ?? []
    totalTicksWithCredit.value = data.totalTicksWithCredit ?? 0
    recentApplications.value = data.recentApplications ?? []
    totalLoansTaken.value = data.totalLoansTaken ?? 0
    totalLoansRepaidOnTime.value = data.totalLoansRepaidOnTime ?? 0
    totalLoansDefaulted.value = data.totalLoansDefaulted ?? 0
    totalInterestPaidEver.value = data.totalInterestPaidEver ?? ZERO
  }

  return {
    // State
    loans,
    creditScore,
    creditScoreFactors,
    loanHistory,
    totalTicksWithCredit,
    recentApplications,
    totalLoansTaken,
    totalLoansRepaidOnTime,
    totalLoansDefaulted,
    totalInterestPaidEver,

    // Computed
    totalDebt,
    totalMinPaymentPerTick,
    totalCollateralLocked,
    loansInDefault,
    totalCreditLimit,
    creditUtilization,
    averageInterestRate,
    totalInterestPerSecond,
    portfolioHealth,

    // Actions
    canApplyForLoan,
    getAvailableCollateral,
    takeLoan,
    repayLoan,
    repayLoanInFull,
    refinanceLoan,
    tick,
    getLoanDef,
    getLoan,
    recalculateCreditScore,
    prestigeReset,
    loadFromSave,
  }
})
