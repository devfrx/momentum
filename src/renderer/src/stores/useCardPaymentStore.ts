/**
 * useCardPaymentStore — Card payment, ATM & card binding management
 *
 * Dual-pool architecture:
 *   cardBalance (bank) ← legal income; used for all legal purchases via card
 *   cash (wallet)      ← BM/gambling/ATM; used for black market and casino chips
 *
 * Card payment flow:
 *   quickPay()       — silent full deduction (amount + fee) from cardBalance.
 *                       Used for minor purchases on entities with a bound card.
 *   initiatePayment() → confirmPayment() — full dialog flow (PIN, animation).
 *                       Used for major purchases or unbound entities.
 *   Both methods fully deduct the purchase amount + fee from cardBalance.
 *   Callers do NOT need to call spendCash/spendFromCard separately.
 *
 * ATM withdrawals:
 *   Moves money from cardBalance → cash wallet with tier-based fee.
 *   Required to fund BM purchases and casino chip buys.
 *
 * Card binding:
 *   Players manually bind/unbind their card to specific entities (businesses,
 *   properties, etc.). Bound entities use quickPay (no dialog); unbound
 *   entities require the full card dialog. Fee still applies either way.
 *
 * Card tier affects transaction fees (lower tier = higher fee):
 *   Standard → 3.5%  |  Gold → 2%  |  Platinum → 1%  |  Black → 0%
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, mul, gte } from '@renderer/core/BigNum'
import { useBankingStore, type CardTier } from './useBankingStore'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'

// ─── Types ────────────────────────────────────────────────────

export type PaymentStatus = 'idle' | 'pending' | 'processing' | 'success' | 'failed' | 'declined'
export type DeclineReason = 'none' | 'wrong_pin' | 'balance' | 'cooldown'

export interface PaymentRequest {
  /** Unique payment ID */
  id: string
  /** Amount to charge */
  amount: Decimal
  /** Fee applied (computed from tier) */
  fee: Decimal
  /** Total = amount + fee */
  total: Decimal
  /** i18n key for the purchase description */
  descriptionKey: string
  /** Optional i18n params */
  descriptionParams?: Record<string, string | number>
  /** Transaction category for banking records */
  category: string
  /** Callback on success — called AFTER money is deducted */
  onSuccess: () => void
  /** Callback on failure */
  onFailure?: () => void
}

// ─── Fee & Limit Configuration ────────────────────────────────

/** Transaction fee rate per card tier (percentage as decimal) */
const TIER_FEES: Record<CardTier, number> = {
  standard: 0.035,
  gold: 0.02,
  platinum: 0.01,
  black: 0
}

/** ATM withdrawal fee per card tier (percentage as decimal) */
const ATM_FEES: Record<CardTier, number> = {
  standard: 0.03,
  gold: 0.02,
  platinum: 0.01,
  black: 0.005
}

/** Minimum time between transactions (ms) */
const PAYMENT_COOLDOWN_MS = 1500

/** Processing animation duration (ms) */
const PROCESSING_DURATION_MS = 2000

// ─── Store ────────────────────────────────────────────────────

export const useCardPaymentStore = defineStore('cardPayment', () => {
  // ─── Payment State ────────────────────────────────────────────

  const status = ref<PaymentStatus>('idle')
  const declineReason = ref<DeclineReason>('none')
  const currentRequest = ref<PaymentRequest | null>(null)
  const lastPaymentTime = ref(0)

  /** Lifetime payment stats */
  const totalFeesPaid = ref<Decimal>(ZERO)
  const totalCardPayments = ref(0)
  const totalCardVolume = ref<Decimal>(ZERO)
  const declinedCount = ref(0)

  // ─── ATM State ────────────────────────────────────────────────

  /** Lifetime ATM stats */
  const totalAtmFees = ref<Decimal>(ZERO)
  const totalAtmWithdrawals = ref(0)
  const totalAtmVolume = ref<Decimal>(ZERO)
  const totalAtmDeposits = ref(0)
  const totalAtmDepositVolume = ref<Decimal>(ZERO)

  // ─── Card Binding State ───────────────────────────────────────

  /**
   * Set of entity keys with a saved/bound card.
   * Format: "entityType:entityId" e.g. "business:pizzeria", "realestate:prop_123"
   * Bound entities use quickPay (no dialog); unbound require initiatePayment.
   */
  const bindings = ref<Set<string>>(new Set())

  // ─── Computed ─────────────────────────────────────────────────

  /** Current fee rate based on card tier (reduced by skill tree) */
  const feeRate = computed(() => {
    const banking = useBankingStore()
    const baseFee = TIER_FEES[banking.cardTier]
    const upgrades = useUpgradeStore()
    const costMul = upgrades.getMultiplier('cost_reduction')
    // cost_reduction multiplier ≥ 1 → divide to reduce fees
    return Math.max(0, baseFee / costMul.toNumber())
  })

  /** Current fee percentage for display */
  const feePercent = computed(() => Math.round(feeRate.value * 1000) / 10)

  /** Whether cooldown is active */
  const onCooldown = computed(() => {
    return Date.now() - lastPaymentTime.value < PAYMENT_COOLDOWN_MS
  })

  /** Whether a payment is currently in progress */
  const isProcessing = computed(() => status.value === 'pending' || status.value === 'processing')

  /** ATM fee rate based on card tier (reduced by skill tree) */
  const atmFeeRate = computed(() => {
    const banking = useBankingStore()
    const baseFee = ATM_FEES[banking.cardTier]
    const upgrades = useUpgradeStore()
    const costMul = upgrades.getMultiplier('cost_reduction')
    // cost_reduction multiplier ≥ 1 → divide to reduce fees
    return Math.max(0, baseFee / costMul.toNumber())
  })

  /** ATM fee percentage for display */
  const atmFeePercent = computed(() => Math.round(atmFeeRate.value * 1000) / 10)

  /** Total number of bound entities */
  const bindingCount = computed(() => bindings.value.size)

  // ─── Internal ─────────────────────────────────────────────────

  /** Calculate the card fee for a given purchase amount */
  function calculateFee(amount: Decimal): Decimal {
    return mul(amount, feeRate.value).ceil()
  }

  /** Calculate total card deduction (amount + fee) */
  function calculateTotal(amount: Decimal): Decimal {
    return add(amount, calculateFee(amount))
  }

  /** Calculate the ATM fee for a given withdrawal amount */
  function calculateAtmFee(amount: Decimal): Decimal {
    return mul(amount, atmFeeRate.value).ceil()
  }

  /** Calculate total ATM deduction from card (amount + fee) */
  function calculateAtmTotal(amount: Decimal): Decimal {
    return add(amount, calculateAtmFee(amount))
  }

  // ─── Card Payment Actions ─────────────────────────────────────

  /**
   * Validate a card payment against last 4 digits + CVV.
   */
  function validateCard(last4: string, cvv: string): boolean {
    const banking = useBankingStore()
    const cardLast4 = banking.card.number.slice(-4)
    return last4 === cardLast4 && cvv === banking.card.cvv
  }

  /**
   * Initiate a card payment — opens the payment dialog.
   * Used for major purchases or on entities without a bound card.
   *
   * The full amount + fee is deducted from cardBalance by confirmPayment.
   * The onSuccess callback should contain ONLY non-monetary side effects
   * (add item to inventory, update stats, etc.) — NOT spendCash/spendFromCard.
   */
  function initiatePayment(
    amount: Decimal,
    descriptionKey: string,
    category: string,
    onSuccess: () => void,
    onFailure?: () => void,
    descriptionParams?: Record<string, string | number>
  ): PaymentRequest | null {
    if (isProcessing.value) return null

    const fee = calculateFee(amount)
    const total = add(amount, fee)

    const request: PaymentRequest = {
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      amount,
      fee,
      total,
      descriptionKey,
      descriptionParams,
      category,
      onSuccess,
      onFailure
    }

    currentRequest.value = request
    status.value = 'pending'
    return request
  }

  /**
   * Confirm and process a card payment after PIN verification.
   * Deducts the FULL amount + fee from cardBalance.
   * Called by the CardPaymentDialog.
   */
  async function confirmPayment(last4: string, cvv: string): Promise<boolean> {
    const request = currentRequest.value
    if (!request || status.value !== 'pending') return false

    // Validate card credentials
    if (!validateCard(last4, cvv)) {
      status.value = 'declined'
      declineReason.value = 'wrong_pin'
      declinedCount.value++
      setTimeout(() => {
        if (status.value === 'declined') {
          status.value = 'idle'
          declineReason.value = 'none'
          currentRequest.value = null
        }
      }, 2500)
      return false
    }

    // Check cooldown
    if (onCooldown.value) {
      status.value = 'declined'
      declineReason.value = 'cooldown'
      setTimeout(() => {
        status.value = 'idle'
        declineReason.value = 'none'
        currentRequest.value = null
      }, 1500)
      return false
    }

    // Check sufficient card balance
    const player = usePlayerStore()
    if (!gte(player.cardBalance, request.total)) {
      status.value = 'declined'
      declineReason.value = 'balance'
      setTimeout(() => {
        status.value = 'idle'
        declineReason.value = 'none'
        currentRequest.value = null
      }, 2500)
      return false
    }

    // ─── Processing animation ────────────────────────────
    status.value = 'processing'
    await new Promise((resolve) => setTimeout(resolve, PROCESSING_DURATION_MS))

    // Re-check balance (could have changed during processing)
    if (!gte(player.cardBalance, request.total)) {
      status.value = 'failed'
      request.onFailure?.()
      setTimeout(() => {
        status.value = 'idle'
        currentRequest.value = null
      }, 2500)
      return false
    }

    // ─── Deduct full amount + fee from cardBalance ───────
    player.spendFromCard(request.amount, {
      key: request.descriptionKey,
      cat: request.category,
      params: request.descriptionParams
    })
    if (request.fee.gt(0)) {
      player.spendFromCard(request.fee, {
        key: 'banking.tx_card_fee',
        cat: 'banking'
      })
    }

    // ─── Update stats ────────────────────────────────────
    totalFeesPaid.value = add(totalFeesPaid.value, request.fee)
    totalCardPayments.value++
    totalCardVolume.value = add(totalCardVolume.value, request.amount)
    lastPaymentTime.value = Date.now()

    // ─── Success ─────────────────────────────────────────
    status.value = 'success'
    request.onSuccess()

    // XP for using card
    player.addXp(D(1))

    setTimeout(() => {
      status.value = 'idle'
      currentRequest.value = null
    }, 2000)

    return true
  }

  /**
   * Cancel the current pending payment.
   */
  function cancelPayment(): void {
    if (status.value === 'pending') {
      currentRequest.value?.onFailure?.()
      status.value = 'idle'
      currentRequest.value = null
    }
  }

  /**
   * Quick pay — silent card payment for bound entities / minor purchases.
   * Deducts the FULL amount + fee from cardBalance.
   * Callers do NOT need to call spendCash/spendFromCard separately.
   *
   * Returns true if payment succeeded, false if declined.
   */
  function quickPay(
    amount: Decimal,
    descriptionKey: string,
    category: string,
    descriptionParams?: Record<string, string | number>
  ): boolean {
    const player = usePlayerStore()
    const fee = calculateFee(amount)
    const total = add(amount, fee)

    // Check card balance
    if (!gte(player.cardBalance, total)) return false

    // ─── Deduct full amount + fee from cardBalance ───────
    player.spendFromCard(amount, {
      key: descriptionKey,
      cat: category,
      params: descriptionParams
    })
    if (fee.gt(0)) {
      player.spendFromCard(fee, {
        key: 'banking.tx_card_fee',
        cat: 'banking'
      })
    }

    // ─── Update stats ────────────────────────────────────
    totalFeesPaid.value = add(totalFeesPaid.value, fee)
    totalCardPayments.value++
    totalCardVolume.value = add(totalCardVolume.value, amount)
    lastPaymentTime.value = Date.now()

    return true
  }

  // ─── ATM Actions ──────────────────────────────────────────────

  /**
   * Withdraw cash from ATM: cardBalance → cash wallet.
   * Deducts (amount + ATM fee) from cardBalance, credits amount to cash.
   * Returns false if insufficient balance or daily limit exceeded.
   */
  function withdrawFromAtm(amount: Decimal): boolean {
    const player = usePlayerStore()
    const fee = calculateAtmFee(amount)
    const total = add(amount, fee)

    // Check card balance
    if (!gte(player.cardBalance, total)) return false

    // Deduct total (amount + fee) from card
    const ok = player.spendFromCard(total, {
      key: 'banking.tx_atm_withdraw',
      cat: 'banking'
    })
    if (!ok) return false

    // Credit only the amount to cash wallet
    player.earnCash(amount, {
      key: 'banking.tx_atm_cash',
      cat: 'banking'
    })

    // Update ATM stats
    totalAtmFees.value = add(totalAtmFees.value, fee)
    totalAtmWithdrawals.value++
    totalAtmVolume.value = add(totalAtmVolume.value, amount)

    // XP for ATM usage
    player.addXp(D(1))

    return true
  }

  /**
   * Deposit cash into the card via ATM: cash wallet → cardBalance.
   * Deducts (amount + ATM fee) from cash, credits amount to card.
   * Returns false if insufficient cash.
   */
  function depositToCard(amount: Decimal): boolean {
    const player = usePlayerStore()
    const fee = calculateAtmFee(amount)
    const total = add(amount, fee)

    // Check cash balance
    if (!gte(player.cash, total)) return false

    // Deduct total (amount + fee) from cash
    const ok = player.spendCash(total, {
      key: 'banking.tx_atm_deposit_cash',
      cat: 'banking'
    })
    if (!ok) return false

    // Credit only the amount to card
    player.earnToCard(amount, {
      key: 'banking.tx_atm_deposit_card',
      cat: 'banking'
    })

    // Update ATM stats
    totalAtmFees.value = add(totalAtmFees.value, fee)
    totalAtmDeposits.value++
    totalAtmDepositVolume.value = add(totalAtmDepositVolume.value, amount)

    // XP for ATM usage
    player.addXp(D(1))

    return true
  }

  // ─── Card Binding Actions ─────────────────────────────────────

  /**
   * Bind the card to an entity (e.g. "business:pizzeria").
   * Bound entities can use quickPay (no dialog).
   */
  function bindCard(entityKey: string): void {
    bindings.value.add(entityKey)
  }

  /**
   * Unbind the card from an entity.
   */
  function unbindCard(entityKey: string): void {
    bindings.value.delete(entityKey)
  }

  /**
   * Check if card is bound to an entity.
   */
  function isBound(entityKey: string): boolean {
    return bindings.value.has(entityKey)
  }

  /**
   * Get all bound entity keys.
   */
  function getBoundEntities(): string[] {
    return [...bindings.value]
  }

  /**
   * Clear all bindings (used on prestige to reset).
   */
  function clearBindings(): void {
    bindings.value.clear()
  }

  // ─── Persistence ──────────────────────────────────────────────

  function prestigeReset(): void {
    bindings.value.clear()
    // Lifetime stats persist across prestige
  }

  function loadFromSave(data: Record<string, unknown>): void {
    // Payment stats
    if (typeof data.totalFeesPaid !== 'undefined')
      totalFeesPaid.value = D(data.totalFeesPaid as string | number)
    if (typeof data.totalCardPayments === 'number') totalCardPayments.value = data.totalCardPayments
    if (typeof data.totalCardVolume !== 'undefined')
      totalCardVolume.value = D(data.totalCardVolume as string | number)
    if (typeof data.declinedCount === 'number') declinedCount.value = data.declinedCount

    // ATM stats
    if (typeof data.totalAtmFees !== 'undefined')
      totalAtmFees.value = D(data.totalAtmFees as string | number)
    if (typeof data.totalAtmWithdrawals === 'number')
      totalAtmWithdrawals.value = data.totalAtmWithdrawals
    if (typeof data.totalAtmVolume !== 'undefined')
      totalAtmVolume.value = D(data.totalAtmVolume as string | number)
    if (typeof data.totalAtmDeposits === 'number') totalAtmDeposits.value = data.totalAtmDeposits
    if (typeof data.totalAtmDepositVolume !== 'undefined')
      totalAtmDepositVolume.value = D(data.totalAtmDepositVolume as string | number)

    // Card bindings
    if (Array.isArray(data.bindings)) {
      bindings.value = new Set(data.bindings as string[])
    }
  }

  function exportState() {
    return {
      // Payment
      totalFeesPaid: totalFeesPaid.value,
      totalCardPayments: totalCardPayments.value,
      totalCardVolume: totalCardVolume.value,
      declinedCount: declinedCount.value,
      // ATM
      totalAtmFees: totalAtmFees.value,
      totalAtmWithdrawals: totalAtmWithdrawals.value,
      totalAtmVolume: totalAtmVolume.value,
      totalAtmDeposits: totalAtmDeposits.value,
      totalAtmDepositVolume: totalAtmDepositVolume.value,
      // Bindings
      bindings: [...bindings.value]
    }
  }

  return {
    // Payment State
    status,
    declineReason,
    currentRequest,
    totalFeesPaid,
    totalCardPayments,
    totalCardVolume,
    declinedCount,
    // ATM State
    totalAtmFees,
    totalAtmWithdrawals,
    totalAtmVolume,
    totalAtmDeposits,
    totalAtmDepositVolume,
    // Binding State
    bindings,
    bindingCount,
    // Computed
    feeRate,
    feePercent,
    onCooldown,
    isProcessing,
    atmFeeRate,
    atmFeePercent,
    // Payment Actions
    calculateFee,
    calculateTotal,
    calculateAtmFee,
    calculateAtmTotal,
    validateCard,
    initiatePayment,
    confirmPayment,
    cancelPayment,
    quickPay,
    // ATM Actions
    withdrawFromAtm,
    depositToCard,
    // Binding Actions
    bindCard,
    unbindCard,
    isBound,
    getBoundEntities,
    clearBindings,
    // Persistence
    prestigeReset,
    loadFromSave,
    exportState
  }
})
