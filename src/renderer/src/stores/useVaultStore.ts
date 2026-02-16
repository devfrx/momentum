/**
 * useVaultStore — Personal Vault (Protected Warehouse)
 *
 * A secure, separate storage where items and cash are completely
 * protected from all game events, modifiers, and alterations.
 *
 * Features:
 * - Store items from storage wars, online shop, or any source
 * - Store cash reserves (protected from everything)
 * - Upgradeable capacity
 * - Transfer items in/out of other inventories
 * - Sell items directly from vault (with reduced tax)
 * - Compatible with premium/wholesale sell (choose which warehouse)
 *
 * Follows the same Pinia composition API pattern as other stores.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, max } from '@renderer/core/BigNum'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'
import type { StorageItem } from '@renderer/data/storage/items'
import {
  VAULT_BASE_CAPACITY,
  VAULT_SLOT_COST_BASE,
  VAULT_SLOT_COST_GROWTH,
  VAULT_UPGRADE_SLOTS,
  VAULT_SELL_TAX,
  SHOP_SELL_FRACTION,
} from '@renderer/data/shop/balance'

// ─── Types ──────────────────────────────────────────────────────

export interface VaultItem extends StorageItem {
  /** Where this item came from. */
  source: 'storage_wars' | 'shop' | 'transfer' | 'other'
  /** Tick when item was added to vault. */
  vaultedAtTick: number
}

// ─── Store ──────────────────────────────────────────────────────

export const useVaultStore = defineStore('vault', () => {
  // ── Items ──────────────────────────────────────────────────
  const items = ref<VaultItem[]>([])

  // ── Cash Reserve ───────────────────────────────────────────
  /** Protected cash stored in the vault — immune to all events. */
  const storedCash = ref<Decimal>(ZERO)

  // ── Capacity ───────────────────────────────────────────────
  const capacityUpgrades = ref(0)

  // ── Lifetime Stats ─────────────────────────────────────────
  const totalItemsStored = ref(0)
  const totalItemsSold = ref(0)
  const totalSaleRevenue = ref<Decimal>(ZERO)
  const totalCashDeposited = ref<Decimal>(ZERO)
  const totalCashWithdrawn = ref<Decimal>(ZERO)

  // ── Computed ───────────────────────────────────────────────

  const capacity = computed(() =>
    VAULT_BASE_CAPACITY + capacityUpgrades.value * VAULT_UPGRADE_SLOTS,
  )

  const itemCount = computed(() => items.value.length)

  const slotsUsed = computed(() => items.value.length)
  const slotsFree = computed(() => Math.max(0, capacity.value - items.value.length))

  const isFull = computed(() => items.value.length >= capacity.value)

  const totalItemsValue = computed((): Decimal => {
    let total = ZERO
    for (const item of items.value) {
      total = add(total, item.appraisedValue ?? item.baseValue)
    }
    return total
  })

  /** Total vault value = items + cash. */
  const totalVaultValue = computed((): Decimal =>
    add(totalItemsValue.value, storedCash.value),
  )

  /** Cost for the next capacity upgrade. */
  const nextUpgradeCost = computed((): Decimal => {
    const cost = VAULT_SLOT_COST_BASE * Math.pow(VAULT_SLOT_COST_GROWTH, capacityUpgrades.value)
    return D(Math.round(cost))
  })

  const sellTaxPercent = computed(() => Math.round(VAULT_SELL_TAX * 100))

  // ── Actions ────────────────────────────────────────────────

  /**
   * Add an item to the vault.
   */
  function addItem(item: StorageItem, source: VaultItem['source'] = 'other'): boolean {
    if (isFull.value) return false
    items.value.push({
      ...item,
      source,
      vaultedAtTick: Date.now(),
    })
    totalItemsStored.value++
    return true
  }

  /**
   * Remove an item from the vault by ID.
   */
  function removeItem(itemId: string): VaultItem | null {
    const idx = items.value.findIndex(i => i.id === itemId)
    if (idx === -1) return null
    const [removed] = items.value.splice(idx, 1)
    return removed
  }

  /**
   * Deposit cash into the vault (protected).
   */
  function depositCash(amount: Decimal): boolean {
    const player = usePlayerStore()
    if (player.cash.lt(amount) || amount.lte(ZERO)) return false
    player.spendCash(amount)
    storedCash.value = add(storedCash.value, amount)
    totalCashDeposited.value = add(totalCashDeposited.value, amount)
    return true
  }

  /**
   * Withdraw cash from the vault back to wallet.
   */
  function withdrawCash(amount: Decimal): boolean {
    if (storedCash.value.lt(amount) || amount.lte(ZERO)) return false
    storedCash.value = sub(storedCash.value, amount)
    const player = usePlayerStore()
    player.earnCash(amount)
    totalCashWithdrawn.value = add(totalCashWithdrawn.value, amount)
    return true
  }

  /**
   * Sell an item from the vault (lower tax than storage wars).
   */
  function sellItem(itemId: string): Decimal | null {
    const idx = items.value.findIndex(i => i.id === itemId)
    if (idx === -1) return null

    const item = items.value[idx]
    const rawValue = item.appraisedValue ?? item.baseValue
    const player = usePlayerStore()
    const upgrades = useUpgradeStore()

    // Vault sell tax is lower than storage wars
    const afterTax = rawValue.mul(1 - VAULT_SELL_TAX)
    const sellMul = upgrades.getMultiplier('all_income')
    const finalValue = mul(afterTax, sellMul).max(D(1))

    player.earnCash(finalValue)
    totalItemsSold.value++
    totalSaleRevenue.value = add(totalSaleRevenue.value, finalValue)
    player.addXp(D(1))

    items.value.splice(idx, 1)
    return finalValue
  }

  /**
   * Sell all items from the vault.
   */
  function sellAll(): { count: number; total: Decimal } {
    let total = ZERO
    let count = 0
    while (items.value.length > 0) {
      const result = sellItem(items.value[0].id)
      if (result) {
        total = add(total, result)
        count++
      } else break
    }
    return { count, total }
  }

  /**
   * Upgrade vault capacity.
   */
  function upgradeCapacity(): boolean {
    const player = usePlayerStore()
    const cost = nextUpgradeCost.value
    if (player.cash.lt(cost)) return false
    player.spendCash(cost)
    capacityUpgrades.value++
    return true
  }

  /**
   * Get all items by a specific source filter.
   */
  function getItemsBySource(source: VaultItem['source']): VaultItem[] {
    return items.value.filter(i => i.source === source)
  }

  // ── Prestige / Reset ───────────────────────────────────────

  function prestigeReset(): void {
    items.value = []
    storedCash.value = ZERO
    capacityUpgrades.value = 0
    totalItemsStored.value = 0
    totalItemsSold.value = 0
    totalSaleRevenue.value = ZERO
    totalCashDeposited.value = ZERO
    totalCashWithdrawn.value = ZERO
  }

  function fullReset(): void {
    prestigeReset()
  }

  // ── Save / Load ────────────────────────────────────────────

  function exportState(): Record<string, unknown> {
    return {
      items: items.value.map(i => ({
        id: i.id,
        name: i.name,
        icon: i.icon,
        category: i.category,
        rarity: i.rarity,
        baseValue: i.baseValue,
        description: i.description,
        appraised: i.appraised,
        appraisedValue: i.appraisedValue,
        weight: i.weight,
        condition: i.condition,
        source: i.source,
        vaultedAtTick: i.vaultedAtTick,
      })),
      storedCash: storedCash.value,
      capacityUpgrades: capacityUpgrades.value,
      totalItemsStored: totalItemsStored.value,
      totalItemsSold: totalItemsSold.value,
      totalSaleRevenue: totalSaleRevenue.value,
      totalCashDeposited: totalCashDeposited.value,
      totalCashWithdrawn: totalCashWithdrawn.value,
    }
  }

  function loadFromSave(data: Record<string, any>): void {
    if (data.items) items.value = data.items
    if (data.storedCash !== undefined) storedCash.value = data.storedCash
    if (data.capacityUpgrades !== undefined) capacityUpgrades.value = data.capacityUpgrades
    if (data.totalItemsStored !== undefined) totalItemsStored.value = data.totalItemsStored
    if (data.totalItemsSold !== undefined) totalItemsSold.value = data.totalItemsSold
    if (data.totalSaleRevenue !== undefined) totalSaleRevenue.value = data.totalSaleRevenue
    if (data.totalCashDeposited !== undefined) totalCashDeposited.value = data.totalCashDeposited
    if (data.totalCashWithdrawn !== undefined) totalCashWithdrawn.value = data.totalCashWithdrawn
  }

  return {
    // State
    items,
    storedCash,
    capacityUpgrades,
    totalItemsStored,
    totalItemsSold,
    totalSaleRevenue,
    totalCashDeposited,
    totalCashWithdrawn,

    // Computed
    capacity,
    itemCount,
    slotsUsed,
    slotsFree,
    isFull,
    totalItemsValue,
    totalVaultValue,
    nextUpgradeCost,
    sellTaxPercent,

    // Actions
    addItem,
    removeItem,
    depositCash,
    withdrawCash,
    sellItem,
    sellAll,
    upgradeCapacity,
    getItemsBySource,
    prestigeReset,
    fullReset,
    exportState,
    loadFromSave,
  }
})
