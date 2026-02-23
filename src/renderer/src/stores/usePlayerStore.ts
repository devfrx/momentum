/**
 * usePlayerStore — Core player state
 *
 * Tracks cash, loans/debt, net worth, XP/level, and global stats.
 * This is the central store that all other stores interact with.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, gte } from '@renderer/core/BigNum'
import { useUpgradeStore } from './useUpgradeStore'

/**
 * Transaction metadata — attach to earnCash/spendCash/forcePay to
 * automatically record a banking transaction for that cash operation.
 */
export interface TxMeta {
  /** i18n key for the transaction description */
  key: string
  /** TransactionCategory string (cast in the recorder) */
  cat: string
  /** Optional i18n params */
  params?: Record<string, string | number>
}

/** Callback signature for the transaction recorder (registered by useInitGame) */
type TxRecordFn = (amount: Decimal, balance: Decimal, meta: TxMeta) => void

/** Module-level recorder — set once at init, survives HMR */
let _txRecordFn: TxRecordFn | null = null

export const usePlayerStore = defineStore('player', () => {
  // ─── State ────────────────────────────────────────────────────
  const cash = ref<Decimal>(D(50))
  const totalCashEarned = ref<Decimal>(D(50))
  const totalCashSpent = ref<Decimal>(ZERO)
  const prestigePoints = ref<Decimal>(ZERO)
  const rebirthCount = ref(0)
  const level = ref(1)
  const xp = ref<Decimal>(ZERO)
  const xpToNextLevel = ref<Decimal>(D(100))

  // ─── Computed ─────────────────────────────────────────────────

  /** Total outstanding debt — now tracked by useLoanStore */
  const totalDebt = computed<Decimal>(() => ZERO)

  const canAfford = (cost: Decimal): boolean => gte(cash.value, cost)

  /**
   * Net worth = cash + business valuations + portfolio + property + startups – debt.
   * External stores pass their totals via computeNetWorth().
   * This reactive shortcut only uses locally-available data;
   * full net worth is computed in useGameLoop each tick.
   */
  const netWorthLocal = computed<Decimal>(() => sub(cash.value, totalDebt.value))

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
   * Add cash (from income, job wages, etc.).
   * Pass optional `meta` to auto-record a banking transaction.
   */
  function earnCash(amount: Decimal, meta?: TxMeta): void {
    cash.value = add(cash.value, amount)
    totalCashEarned.value = add(totalCashEarned.value, amount)
    if (meta && _txRecordFn) _txRecordFn(amount, cash.value, meta)
  }

  /**
   * Spend cash (purchases). Returns false if not enough.
   * Pass optional `meta` to auto-record a banking transaction.
   */
  function spendCash(amount: Decimal, meta?: TxMeta): boolean {
    if (!gte(cash.value, amount)) return false
    cash.value = sub(cash.value, amount)
    totalCashSpent.value = add(totalCashSpent.value, amount)
    if (meta && _txRecordFn) _txRecordFn(mul(amount, -1), cash.value, meta)
    return true
  }

  /**
   * Force-deduct cash even if balance goes negative.
   * Used for mandatory payments the player cannot dodge
   * (fines, operating losses, penalties, etc.).
   * Pass optional `meta` to auto-record a banking transaction.
   */
  function forcePay(amount: Decimal, meta?: TxMeta): void {
    cash.value = sub(cash.value, amount)
    totalCashSpent.value = add(totalCashSpent.value, amount)
    if (meta && _txRecordFn) _txRecordFn(mul(amount, -1), cash.value, meta)
  }

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

  /** Reset on prestige / era expansion (soft — no forced loss) */
  function prestigeReset(): void {
    cash.value = D(50)
    totalCashEarned.value = D(50)
    totalCashSpent.value = ZERO
    level.value = 1
    xp.value = ZERO
    xpToNextLevel.value = D(100)
  }

  /** Hydrate state from save data */
  function loadFromSave(data: {
    cash: Decimal
    totalCashEarned: Decimal
    totalCashSpent: Decimal
    prestigePoints: Decimal
    rebirthCount: number
    level: number
    xp: Decimal
    xpToNextLevel: Decimal
    netWorth: Decimal
  }): void {
    cash.value = data.cash
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
    // Actions
    registerTxRecorder,
    earnCash,
    spendCash,
    forcePay,
    addXp,
    prestigeReset,
    loadFromSave
  }
})
