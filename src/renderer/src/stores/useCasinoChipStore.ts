/**
 * useCasinoChipStore — Casino chip (fiches) management
 *
 * The casino uses chips instead of direct cash — players must first
 * convert cash or card funds into chips before gambling.
 * Chips can be converted back to cash at the cashier desk.
 *
 * Conversion rates are influenced by:
 *   - Card tier bonus (higher tier = better exchange rate)
 *   - Skill tree multipliers (gambling_luck, all_income)
 *   - Prestige perks
 *   - Event effects
 *
 * This creates an immersive casino economy layer:
 *   Cash/Card → Chips → Gambling → Chips → Cash
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, gte } from '@renderer/core/BigNum'
import { usePlayerStore } from './usePlayerStore'
import { useBankingStore } from './useBankingStore'
import { useUpgradeStore } from './useUpgradeStore'
import { useGamblingStore } from './useGamblingStore'

// ─── Types ────────────────────────────────────────────────────

export type ChipDenomination = 'white' | 'red' | 'blue' | 'green' | 'black' | 'purple' | 'gold'

export interface ChipInfo {
  id: ChipDenomination
  labelKey: string
  value: number
  color: string
  icon: string
}

// ─── Chip Denominations ───────────────────────────────────────

export const CHIP_DENOMINATIONS: ChipInfo[] = [
  {
    id: 'white',
    labelKey: 'casino_chips.chip_white',
    value: 1,
    color: '#e2e8f0',
    icon: 'mdi:poker-chip'
  },
  {
    id: 'red',
    labelKey: 'casino_chips.chip_red',
    value: 5,
    color: '#ef4444',
    icon: 'mdi:poker-chip'
  },
  {
    id: 'blue',
    labelKey: 'casino_chips.chip_blue',
    value: 25,
    color: '#3b82f6',
    icon: 'mdi:poker-chip'
  },
  {
    id: 'green',
    labelKey: 'casino_chips.chip_green',
    value: 100,
    color: '#22c55e',
    icon: 'mdi:poker-chip'
  },
  {
    id: 'black',
    labelKey: 'casino_chips.chip_black',
    value: 500,
    color: '#1e1e1e',
    icon: 'mdi:poker-chip'
  },
  {
    id: 'purple',
    labelKey: 'casino_chips.chip_purple',
    value: 1000,
    color: '#a855f7',
    icon: 'mdi:poker-chip'
  },
  {
    id: 'gold',
    labelKey: 'casino_chips.chip_gold',
    value: 5000,
    color: '#d4af37',
    icon: 'mdi:poker-chip'
  }
]

/** Cashout fee — lose a small percentage when converting chips back to cash */
const BASE_CASHOUT_FEE = 0.02

// ─── Store ────────────────────────────────────────────────────

export const useCasinoChipStore = defineStore('casinoChips', () => {
  // ─── State ────────────────────────────────────────────────────

  /** Total chip balance (in chip-value units, 1 chip = $1 base) */
  const chipBalance = ref<Decimal>(ZERO)

  /** Lifetime stats */
  const totalChipsBought = ref<Decimal>(ZERO)
  const totalChipsCashedOut = ref<Decimal>(ZERO)
  const totalCashoutFees = ref<Decimal>(ZERO)
  const totalConversions = ref(0)

  // ─── Computed ─────────────────────────────────────────────────

  /**
   * Buy rate bonus — how many extra chips per dollar.
   * Card tier gives bonus chips:
   *   Standard → 1:1  |  Gold → 1:1.02  |  Platinum → 1:1.05  |  Black → 1:1.10
   * Stacks with gambling luck multiplier.
   */
  const buyRate = computed(() => {
    const banking = useBankingStore()
    const gambling = useGamblingStore()
    let rate = banking.tierBonus // 1.0, 1.02, 1.05, 1.10
    // Divine ability: casino_vip gives extra chip rate
    const divineMul = gambling.getDivineMultiplier('casino_chips')
    if (divineMul > 1) rate *= divineMul
    return rate
  })

  /** Cashout fee rate (reduced by card tier and upgrades) */
  const cashoutFee = computed(() => {
    const banking = useBankingStore()
    const upgrades = useUpgradeStore()
    let fee = BASE_CASHOUT_FEE
    // Higher tier = lower fee
    const tierIdx = ['standard', 'gold', 'platinum', 'black'].indexOf(banking.cardTier)
    fee -= tierIdx * 0.005 // 2%, 1.5%, 1%, 0.5%
    // Skill tree cost reduction helps
    const costMul = upgrades.getMultiplier('cost_reduction').toNumber()
    fee *= costMul
    return Math.max(0, fee)
  })

  /** Cashout fee as percentage for display */
  const cashoutFeePct = computed(() => Math.round(cashoutFee.value * 1000) / 10)

  /** Cash value of current chip balance (before cashout fee) */
  const chipCashValue = computed(() => chipBalance.value)

  /** Net cashout value after fee */
  const netCashoutValue = computed(() => {
    const fee = mul(chipBalance.value, cashoutFee.value)
    return sub(chipBalance.value, fee)
  })

  // ─── Actions ──────────────────────────────────────────────────

  /**
   * Buy chips with cash.
   * Applies the buy rate bonus (tier-based).
   */
  function buyChipsWithCash(cashAmount: Decimal): boolean {
    const player = usePlayerStore()
    if (!gte(player.cash, cashAmount)) return false
    if (cashAmount.lte(0)) return false

    if (
      !player.spendCash(cashAmount, {
        key: 'banking.tx_chip_buy',
        cat: 'gambling'
      })
    )
      return false

    const chipsReceived = mul(cashAmount, buyRate.value)
    chipBalance.value = add(chipBalance.value, chipsReceived)
    totalChipsBought.value = add(totalChipsBought.value, chipsReceived)
    totalConversions.value++

    player.addXp(D(1))
    return true
  }

  /**
   * Buy chips with card (via card payment system).
   * The card payment fee is handled separately by useCardPaymentStore.
   * This just receives the chip credit after card payment succeeds.
   */
  function creditChipsFromCard(cashAmount: Decimal): void {
    const chipsReceived = mul(cashAmount, buyRate.value)
    chipBalance.value = add(chipBalance.value, chipsReceived)
    totalChipsBought.value = add(totalChipsBought.value, chipsReceived)
    totalConversions.value++
  }

  /**
   * Cash out chips → receive cash back (minus cashout fee).
   */
  function cashOutChips(chipAmount: Decimal): boolean {
    if (!gte(chipBalance.value, chipAmount)) return false
    if (chipAmount.lte(0)) return false

    const player = usePlayerStore()
    const fee = mul(chipAmount, cashoutFee.value)
    const cashReceived = sub(chipAmount, fee)

    chipBalance.value = sub(chipBalance.value, chipAmount)
    totalChipsCashedOut.value = add(totalChipsCashedOut.value, chipAmount)
    totalCashoutFees.value = add(totalCashoutFees.value, fee)
    totalConversions.value++

    player.earnCash(cashReceived, {
      key: 'banking.tx_chip_cashout',
      cat: 'gambling'
    })

    player.addXp(D(1))
    return true
  }

  /**
   * Spend chips on a bet. Returns false if insufficient.
   */
  function spendChips(amount: Decimal): boolean {
    if (!gte(chipBalance.value, amount)) return false
    chipBalance.value = sub(chipBalance.value, amount)
    return true
  }

  /**
   * Add chips from a gambling win.
   */
  function addChips(amount: Decimal): void {
    chipBalance.value = add(chipBalance.value, amount)
  }

  /**
   * Check if player can afford a chip amount.
   */
  function canAffordChips(amount: Decimal): boolean {
    return gte(chipBalance.value, amount)
  }

  // ─── Persistence ──────────────────────────────────────────────

  function prestigeReset(): void {
    chipBalance.value = ZERO
    // Lifetime stats persist
  }

  function loadFromSave(data: Record<string, unknown>): void {
    if (typeof data.chipBalance !== 'undefined')
      chipBalance.value = D(data.chipBalance as string | number)
    if (typeof data.totalChipsBought !== 'undefined')
      totalChipsBought.value = D(data.totalChipsBought as string | number)
    if (typeof data.totalChipsCashedOut !== 'undefined')
      totalChipsCashedOut.value = D(data.totalChipsCashedOut as string | number)
    if (typeof data.totalCashoutFees !== 'undefined')
      totalCashoutFees.value = D(data.totalCashoutFees as string | number)
    if (typeof data.totalConversions === 'number') totalConversions.value = data.totalConversions
  }

  function exportState() {
    return {
      chipBalance: chipBalance.value,
      totalChipsBought: totalChipsBought.value,
      totalChipsCashedOut: totalChipsCashedOut.value,
      totalCashoutFees: totalCashoutFees.value,
      totalConversions: totalConversions.value
    }
  }

  return {
    // State
    chipBalance,
    totalChipsBought,
    totalChipsCashedOut,
    totalCashoutFees,
    totalConversions,
    // Computed
    buyRate,
    cashoutFee,
    cashoutFeePct,
    chipCashValue,
    netCashoutValue,
    // Actions
    buyChipsWithCash,
    creditChipsFromCard,
    cashOutChips,
    spendChips,
    addChips,
    canAffordChips,
    prestigeReset,
    loadFromSave,
    exportState
  }
})
