/**
 * usePlayerStore — Core player state (Dual Pool Architecture)
 *
 * Manages two separate money pools:
 *   cardBalance — bank / debit card account (legal income goes here)
 *   cash        — physical wallet (illegal/BM/gambling earnings go here)
 *
 * Legal purchases go through the card payment system (deducts from cardBalance).
 * Black market and gambling use the cash wallet directly.
 * ATM withdrawals move money from cardBalance → cash (with fee + daily limit).
 *
 * Also tracks XP/level, net worth, prestige points, and global stats.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, gte } from '@renderer/core/BigNum'
import { useUpgradeStore } from './useUpgradeStore'

/**
 * Transaction metadata — attach to earnCash/earnToCard/spendCash/spendFromCard/forcePay
 * to automatically record a banking transaction for that cash operation.
 */
export interface TxMeta {
  /** i18n key for the transaction description */
  key: string
  /** TransactionCategory string (cast in the recorder) */
  cat: string
  /** Optional i18n params */
  params?: Record<string, string | number>
  /** Which pool was affected — set automatically by the store functions */
  pool?: 'card' | 'wallet'
}

/** Callback signature for the transaction recorder (registered by useInitGame) */
type TxRecordFn = (amount: Decimal, balance: Decimal, meta: TxMeta) => void

/** Module-level recorder — set once at init, survives HMR */
let _txRecordFn: TxRecordFn | null = null

export const usePlayerStore = defineStore('player', () => {
  // ─── State ────────────────────────────────────────────────────

  /** Physical cash wallet — fed by ATM withdrawals, BM income, gambling cashouts */
  const cash = ref<Decimal>(ZERO)

  /** Bank / debit card account — fed by legal income (salary, business, etc.) */
  const cardBalance = ref<Decimal>(D(50))

  /** Aggregate lifetime stats (across both pools) */
  const totalCashEarned = ref<Decimal>(D(50))
  const totalCashSpent = ref<Decimal>(ZERO)

  const prestigePoints = ref<Decimal>(ZERO)
  const rebirthCount = ref(0)
  const level = ref(1)
  const xp = ref<Decimal>(ZERO)
  const xpToNextLevel = ref<Decimal>(D(100))

  // ─── Computed ─────────────────────────────────────────────────

  /** Total liquid funds across both pools */
  const totalFunds = computed<Decimal>(() => add(cash.value, cardBalance.value))

  /** Total outstanding debt — now tracked by useLoanStore */
  const totalDebt = computed<Decimal>(() => ZERO)

  /** Check if player can afford from wallet cash (used for BM/gambling) */
  const canAfford = (cost: Decimal): boolean => gte(cash.value, cost)

  /** Check if card balance covers a given amount (does NOT include fee) */
  const canAffordCard = (cost: Decimal): boolean => gte(cardBalance.value, cost)

  /**
   * Net worth = totalFunds + business valuations + portfolio + property + startups – debt.
   * Local reactive shortcut; full net worth is computed in useGameLoop each tick.
   */
  const netWorthLocal = computed<Decimal>(() => sub(totalFunds.value, totalDebt.value))

  // Externally-written aggregate net worth (updated by game loop)
  const netWorth = ref<Decimal>(ZERO)

  // ─── Actions ──────────────────────────────────────────────────

  /**
   * Register the transaction recorder callback.
   * Called once from useInitGame after both player and banking stores exist.
   */
  function registerTxRecorder(fn: TxRecordFn): void {
    _txRecordFn = fn
  }

  /**
   * Validate that an amount is finite and positive.
   * Guards against NaN, Infinity, negative, and zero values corrupting balances.
   */
  function _validateAmount(amount: Decimal): boolean {
    return Number.isFinite(amount.mantissa) && Number.isFinite(amount.exponent) && amount.gt(0)
  }

  // ─── Wallet Cash (illegal / BM / gambling) ────────────────────

  /**
   * Add money to the physical cash wallet.
   * Used for: BM deal proceeds, gambling cashouts, vault withdrawals, ATM.
   */
  function earnCash(amount: Decimal, meta?: TxMeta): void {
    if (!_validateAmount(amount)) return
    cash.value = add(cash.value, amount)
    totalCashEarned.value = add(totalCashEarned.value, amount)
    if (meta && _txRecordFn) _txRecordFn(amount, cash.value, { ...meta, pool: 'wallet' })
  }

  /**
   * Spend from the physical cash wallet. Returns false if insufficient.
   * Used for: BM purchases, gambling chip buys, vault deposits.
   */
  function spendCash(amount: Decimal, meta?: TxMeta): boolean {
    if (!_validateAmount(amount)) return false
    if (!gte(cash.value, amount)) return false
    cash.value = sub(cash.value, amount)
    totalCashSpent.value = add(totalCashSpent.value, amount)
    if (meta && _txRecordFn) _txRecordFn(mul(amount, -1), cash.value, { ...meta, pool: 'wallet' })
    return true
  }

  // ─── Card / Bank Account (legal income & purchases) ───────────

  /**
   * Add money to the card / bank account.
   * Used for: salary, business revenue, RE rent, dividends, deposits,
   * stock/crypto sells, startup returns, shop sales, achievement rewards.
   */
  function earnToCard(amount: Decimal, meta?: TxMeta): void {
    if (!_validateAmount(amount)) return
    cardBalance.value = add(cardBalance.value, amount)
    totalCashEarned.value = add(totalCashEarned.value, amount)
    if (meta && _txRecordFn) _txRecordFn(amount, cardBalance.value, { ...meta, pool: 'card' })
  }

  /**
   * Spend from the card / bank account. Returns false if insufficient.
   * Used internally by the card payment system (quickPay / confirmPayment).
   */
  function spendFromCard(amount: Decimal, meta?: TxMeta): boolean {
    if (!_validateAmount(amount)) return false
    if (!gte(cardBalance.value, amount)) return false
    cardBalance.value = sub(cardBalance.value, amount)
    totalCashSpent.value = add(totalCashSpent.value, amount)
    if (meta && _txRecordFn) _txRecordFn(mul(amount, -1), cardBalance.value, { ...meta, pool: 'card' })
    return true
  }

  // ─── Force Pay (mandatory deductions from bank, can go negative) ─

  /**
   * Force-deduct from card/bank balance even if it goes negative (overdraft).
   * Used for mandatory payments the player cannot dodge:
   * fines, operating losses, penalties, seized assets, debt interest.
   */
  function forcePay(amount: Decimal, meta?: TxMeta): void {
    if (!_validateAmount(amount)) return
    cardBalance.value = sub(cardBalance.value, amount)
    totalCashSpent.value = add(totalCashSpent.value, amount)
    if (meta && _txRecordFn) _txRecordFn(mul(amount, -1), cardBalance.value, { ...meta, pool: 'card' })
  }

  // ─── XP & Level ───────────────────────────────────────────────

  /** Add XP and handle level-up (applies xp_gain multiplier from skill tree) */
  function addXp(amount: Decimal): void {
    const upgrades = useUpgradeStore()
    const xpMul = upgrades.getMultiplier('xp_gain')
    const boosted = mul(amount, xpMul)
    xp.value = add(xp.value, boosted)
    while (gte(xp.value, xpToNextLevel.value)) {
      xp.value = sub(xp.value, xpToNextLevel.value)
      level.value++
      // XP scaling: each level requires 50% more XP
      xpToNextLevel.value = mul(xpToNextLevel.value, 1.5).floor()
    }
  }

  // ─── Persistence ──────────────────────────────────────────────

  /** Reset on prestige / era expansion (soft — no forced loss) */
  function prestigeReset(): void {
    cash.value = ZERO
    cardBalance.value = D(50)
    totalCashEarned.value = D(50)
    totalCashSpent.value = ZERO
    level.value = 1
    xp.value = ZERO
    xpToNextLevel.value = D(100)
  }

  /** Hydrate state from save data (handles v3→v4 migration) */
  function loadFromSave(data: {
    cash: Decimal
    cardBalance?: Decimal
    totalCashEarned: Decimal
    totalCashSpent: Decimal
    prestigePoints: Decimal
    rebirthCount: number
    level: number
    xp: Decimal
    xpToNextLevel: Decimal
    netWorth: Decimal
  }): void {
    // v3→v4 migration: if no cardBalance, all money was in single pool → move to card
    if (data.cardBalance !== undefined && data.cardBalance !== null) {
      cash.value = data.cash
      cardBalance.value = data.cardBalance
    } else {
      // Old save: single pool. Move everything to cardBalance, wallet starts empty.
      cash.value = ZERO
      cardBalance.value = data.cash
    }
    totalCashEarned.value = data.totalCashEarned
    totalCashSpent.value = data.totalCashSpent
    prestigePoints.value = data.prestigePoints
    rebirthCount.value = data.rebirthCount
    level.value = data.level
    xp.value = data.xp
    xpToNextLevel.value = data.xpToNextLevel
    netWorth.value = data.netWorth ?? ZERO
  }

  return {
    // State
    cash,
    cardBalance,
    totalFunds,
    totalCashEarned,
    totalCashSpent,
    prestigePoints,
    rebirthCount,
    level,
    xp,
    xpToNextLevel,
    netWorth,
    // Computed
    totalDebt,
    netWorthLocal,
    canAfford,
    canAffordCard,
    // Actions
    registerTxRecorder,
    earnCash,
    earnToCard,
    spendCash,
    spendFromCard,
    forcePay,
    addXp,
    prestigeReset,
    loadFromSave
  }
})
