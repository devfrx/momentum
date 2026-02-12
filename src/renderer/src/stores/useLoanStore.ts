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
  const creditScore = ref(50) // Start at neutral

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

  /** Credit utilization ratio (debt / available credit limit) */
  const creditUtilization = computed(() => {
    const player = usePlayerStore()
    const totalAvailable = calculateTotalCreditLimit(creditScore.value, player.netWorth)
    if (totalAvailable.lte(0)) return 0
    return Math.min(100, totalDebt.value.div(totalAvailable).mul(100).toNumber())
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
    // 30 points max: 30 at 0%, 0 at 100%+
    creditScoreFactors.value.creditUtilization = Math.round(Math.max(0, 30 - (util * 0.3)))
    recalculateCreditScore()
  }

  /** Update credit age factor based on history length */
  function updateCreditAgeFactor(): void {
    // 15 points max, gained over time (full points at ~2 hours of credit history)
    const maxTicks = 72_000 // ~2 hours
    const ageFactor = Math.min(15, (totalTicksWithCredit.value / maxTicks) * 15)
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

    const mixScore = Math.min(10, categories.size * 2.5)
    creditScoreFactors.value.creditMix = mixScore
    recalculateCreditScore()
  }

  /** Update new credit factor based on recent applications */
  function updateNewCreditFactor(currentTick: number): void {
    // Remove old applications (older than 30 min = 18000 ticks)
    recentApplications.value = recentApplications.value.filter(
      tick => currentTick - tick < 18_000
    )
    // 10 points max, lose 2 points per recent application
    const penalty = Math.min(10, recentApplications.value.length * 2)
    creditScoreFactors.value.newCredit = 10 - penalty
    recalculateCreditScore()
  }

  // ─── Loan Application ─────────────────────────────────────────

  /** Check if player can apply for a specific loan type */
  function canApplyForLoan(loanDefId: string): LoanApplication {
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

    // Check max active limit
    const activeOfType = loans.value.filter(l => l.loanDefId === loanDefId).length
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

    // Approved! Calculate terms
    const effectiveRate = calculateEffectiveRate(def, creditScore.value)
    const maxApproved = calculateMaxLoanAmount(def, creditScore.value)

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
      case 'mixed':
        const totalAssets = add(
          add(business.totalBusinessValue, realEstate.totalPropertyValue),
          add(stocks.totalPortfolioValue ?? ZERO, crypto.totalWalletValue ?? ZERO)
        )
        const lockedMixed = loans.value
          .filter(l => l.collateralType === 'mixed')
          .reduce((sum, l) => add(sum, l.collateralLocked), ZERO)
        return max(ZERO, sub(totalAssets, lockedMixed))
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

    // Calculate minimum payment per tick (for amortized loans)
    const minPaymentPerTick = def.termTicks > 0
      ? Formulas.loanPaymentPerTick(amount, effectiveRate, def.termTicks)
      : ZERO // Interest-only for revolving credit

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

    // Check for early repayment penalty
    if (def && def.earlyRepaymentPenalty > 0 && toPay.gte(loan.remaining)) {
      // Only apply if paying off entire loan before term ends
      if (loan.ticksActive < loan.termTicks) {
        const penalty = mul(loan.remaining, def.earlyRepaymentPenalty)
        toPay = add(toPay, penalty)
        if (!gte(player.cash, toPay)) {
          // Can't afford with penalty, just pay what we can
          toPay = player.cash
        }
      }
    }

    // Deduct from player
    player.spendCash(toPay)
    
    // Update tracking fields
    loan.totalPaid = add(loan.totalPaid, toPay)
    // Calculate principal portion (payment minus any interest accrued)
    const interestPortion = sub(loan.remaining, sub(loan.principal, loan.principalPaid))
    const principalPortion = interestPortion.gt(ZERO) 
      ? sub(toPay, Decimal.min(interestPortion, toPay))
      : toPay
    loan.principalPaid = add(loan.principalPaid, principalPortion)
    
    loan.remaining = sub(loan.remaining, toPay)
    loan.ticksSinceLastPayment = 0

    // Track payment timing
    const gracePeriod = def?.gracePeriodTicks ?? 300
    if (loan.ticksLate <= gracePeriod) {
      loan.onTimePayments++
      // Slight credit boost for on-time payment
      creditScoreFactors.value.paymentHistory = Math.min(
        35,
        creditScoreFactors.value.paymentHistory + 0.1
      )
    } else {
      loan.latePayments++
      loan.ticksLate = 0 // Reset late counter
      // Credit score penalty for late payment
      creditScoreFactors.value.paymentHistory = Math.max(
        0,
        creditScoreFactors.value.paymentHistory - 1
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
    loan.remaining = ZERO

    // Track payment timing for credit score
    const gracePeriod = def?.gracePeriodTicks ?? 300
    if (loan.ticksLate <= gracePeriod) {
      loan.onTimePayments++
      creditScoreFactors.value.paymentHistory = Math.min(
        35,
        creditScoreFactors.value.paymentHistory + 0.5
      )
    } else {
      loan.latePayments++
      creditScoreFactors.value.paymentHistory = Math.max(
        0,
        creditScoreFactors.value.paymentHistory - 1
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
          35,
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
    for (const loan of loans.value) {
      // Accrue interest
      const interest = Formulas.loanInterestPerTick(
        loan.remaining,
        loan.effectiveRate,
        ticksPerSecond
      )
      loan.remaining = add(loan.remaining, interest)
      loan.totalInterestPaid = add(loan.totalInterestPaid, interest)
      totalInterestPaidEver.value = add(totalInterestPaidEver.value, interest)

      loan.ticksActive++
      loan.ticksSinceLastPayment++

      // Track credit history age
      if (loans.value.length > 0) {
        totalTicksWithCredit.value++
      }

      // Check for missed payment (if amortized loan)
      const def = LOANS.find(l => l.id === loan.loanDefId)
      if (def && def.termTicks > 0) {
        const paymentPeriod = Math.max(100, def.termTicks / 100) // ~100 payments over term
        const gracePeriod = def.gracePeriodTicks

        if (loan.ticksSinceLastPayment > paymentPeriod + gracePeriod) {
          // Missed payment
          loan.missedPayments++

          // Apply late payment penalty
          if (def.latePaymentPenalty > 0) {
            const penalty = mul(loan.minPaymentPerTick.mul(paymentPeriod), def.latePaymentPenalty)
            loan.remaining = add(loan.remaining, penalty)
          }

          // Credit score hit
          creditScoreFactors.value.paymentHistory = Math.max(
            0,
            creditScoreFactors.value.paymentHistory - 2
          )

          // Check for default (3 missed payments)
          if (loan.missedPayments >= 3 && !loan.isDefaulted) {
            handleDefault(loan)
          }

          // Reset payment timer
          loan.ticksSinceLastPayment = 0
        }
      }

      // Check for margin call (investment loans with portfolio collateral)
      if (loan.collateralType === 'portfolio' && def?.category === 'investment') {
        const availableCollateral = getAvailableCollateral('portfolio')
        const requiredCollateral = mul(loan.remaining, def.collateralRatio)
        if (availableCollateral.lt(requiredCollateral)) {
          // Margin call! Auto-liquidate if possible
          handleMarginCall(loan)
        }
      }
    }

    // Update credit factors periodically
    updateCreditAgeFactor()
    updateCreditUtilizationFactor()
  }

  /** Handle loan default */
  function handleDefault(loan: ActiveLoan): void {
    loan.isDefaulted = true
    const def = LOANS.find(l => l.id === loan.loanDefId)

    // Severe credit score penalty
    if (def) {
      creditScoreFactors.value.paymentHistory = Math.max(
        0,
        creditScoreFactors.value.paymentHistory + def.creditImpactDefault
      )
    }

    // If collateral, seize it
    if (loan.collateralLocked.gt(0)) {
      // In a real implementation, this would trigger asset liquidation
      // For now, just note the collateral is being seized
      loan.collateralLocked = ZERO
    }

    recalculateCreditScore()
  }

  /** Handle margin call */
  function handleMarginCall(loan: ActiveLoan): void {
    const player = usePlayerStore()

    // Try to auto-pay down to safe level
    const def = LOANS.find(l => l.id === loan.loanDefId)
    if (!def) return

    const availableCollateral = getAvailableCollateral('portfolio')
    const safeBalance = div(availableCollateral, def.collateralRatio)
    const needToRepay = sub(loan.remaining, safeBalance)

    if (needToRepay.gt(0) && player.cash.gte(needToRepay)) {
      repayLoan(loan.id, needToRepay, 0)
    } else {
      // Can't meet margin call - default
      handleDefault(loan)
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
    if (!oldDef || !newDef || !newDef.canRefinance) return null

    // Check if new loan can cover old balance
    const application = canApplyForLoan(newLoanDefId)
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
    // Base limit based on credit score
    const baseLimit = D(10_000 + score * 1000) // $10K-$110K based on score

    // Multiply by net worth factor
    const netWorthMultiplier = Math.max(1, 1 + Math.log10(Math.max(1, netWorth.toNumber())) / 2)

    return mul(baseLimit, netWorthMultiplier)
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
    creditScore.value = 50
    creditScoreFactors.value = {
      paymentHistory: 10,
      creditUtilization: 30,
      creditAge: 0,
      creditMix: 0,
      newCredit: 10,
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
    creditScore.value = data.creditScore ?? 50
    creditScoreFactors.value = data.creditScoreFactors ?? {
      paymentHistory: 10,
      creditUtilization: 30,
      creditAge: 0,
      creditMix: 0,
      newCredit: 10,
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
