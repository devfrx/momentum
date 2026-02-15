/**
 * useShopStore — Online Shop store
 *
 * Manages the procedurally generated online marketplace where
 * players can browse, search, buy and sell thousands of items.
 *
 * Features:
 * - Procedural item generation with rarity tiers up to mythic
 * - Unique one-time items with enormous values
 * - Search by name, category, rarity
 * - Flash sales with discounts
 * - Periodic partial/full restocks
 * - Buy items → choose destination (vault or storage)
 * - Sell items from any warehouse
 *
 * Follows the same Pinia composition API pattern as other stores.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul } from '@renderer/core/BigNum'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'
import { useVaultStore } from './useVaultStore'
import { useStorageStore } from './useStorageStore'
import {
  generateShopBatch,
  refreshShopPartial,
  type ShopListing,
  type ShopCategory,
} from '@renderer/data/shop/items'
import {
  SHOP_LISTING_COUNT,
  SHOP_REFRESH_TICKS,
  SHOP_REFRESH_FRACTION,
  SHOP_FULL_RESTOCK_TICKS,
  SHOP_SELL_FRACTION,
} from '@renderer/data/shop/balance'

// ─── Types ──────────────────────────────────────────────────────

export type SortField = 'price_asc' | 'price_desc' | 'rarity_asc' | 'rarity_desc' | 'newest' | 'name'

export type SellSource = 'vault' | 'storage_wars' | 'shop'

const RARITY_ORDER: Record<string, number> = {
  common: 0, uncommon: 1, rare: 2, epic: 3,
  legendary: 4, jackpot: 5, mythic: 6,
}

// ─── Store ──────────────────────────────────────────────────────

export const useShopStore = defineStore('shop', () => {
  // ── Listings ───────────────────────────────────────────────
  const listings = ref<ShopListing[]>([])

  // ── Unique items already purchased (never re-appear) ──────
  const purchasedUniqueIds = ref<Set<string>>(new Set())

  // ── Timing ─────────────────────────────────────────────────
  const lastRefreshTick = ref(0)
  const lastFullRestockTick = ref(0)

  // ── Search/Filter State ────────────────────────────────────
  const searchQuery = ref('')
  const filterCategory = ref<ShopCategory | 'all'>('all')
  const filterRarity = ref<string>('all')
  const sortBy = ref<SortField>('newest')
  const currentPage = ref(0)

  // ── Lifetime Stats ─────────────────────────────────────────
  const totalItemsBought = ref(0)
  const totalCashSpentOnPurchases = ref<Decimal>(ZERO)
  const totalItemsSoldToShop = ref(0)
  const totalCashFromSales = ref<Decimal>(ZERO)
  const uniqueItemsBought = ref(0)
  const bestDeal = ref<Decimal>(ZERO) // biggest profit from resale

  // ── Computed ───────────────────────────────────────────────

  /** Filtered + sorted listings. */
  const filteredListings = computed((): ShopListing[] => {
    let result = [...listings.value]

    // Text search
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      result = result.filter(l =>
        l.item.name.toLowerCase().includes(q) ||
        l.item.description.toLowerCase().includes(q) ||
        l.item.category.toLowerCase().includes(q),
      )
    }

    // Category filter
    if (filterCategory.value !== 'all') {
      result = result.filter(l => l.item.category === filterCategory.value)
    }

    // Rarity filter
    if (filterRarity.value !== 'all') {
      result = result.filter(l => l.item.rarity === filterRarity.value)
    }

    // Sort
    switch (sortBy.value) {
      case 'price_asc':
        result.sort((a, b) => a.price.cmp(b.price))
        break
      case 'price_desc':
        result.sort((a, b) => b.price.cmp(a.price))
        break
      case 'rarity_asc':
        result.sort((a, b) => (RARITY_ORDER[a.item.rarity] ?? 0) - (RARITY_ORDER[b.item.rarity] ?? 0))
        break
      case 'rarity_desc':
        result.sort((a, b) => (RARITY_ORDER[b.item.rarity] ?? 0) - (RARITY_ORDER[a.item.rarity] ?? 0))
        break
      case 'newest':
        result.sort((a, b) => b.listedAtTick - a.listedAtTick)
        break
      case 'name':
        result.sort((a, b) => a.item.name.localeCompare(b.item.name))
        break
    }

    return result
  })

  const listingCount = computed(() => listings.value.length)
  const filteredCount = computed(() => filteredListings.value.length)

  const flashSaleCount = computed(() =>
    listings.value.filter(l => l.flashSale).length,
  )

  const uniqueListingCount = computed(() =>
    listings.value.filter(l => l.unique).length,
  )

  const shopNetProfit = computed((): Decimal =>
    sub(totalCashFromSales.value, totalCashSpentOnPurchases.value),
  )

  // ── Actions ────────────────────────────────────────────────

  /**
   * Initialize shop with listings. Called on game start.
   */
  function initShop(tick: number = 0): void {
    if (listings.value.length > 0) return
    const luckBonus = getLuckBonus()
    listings.value = generateShopBatch(SHOP_LISTING_COUNT, luckBonus, tick)
    // Remove unique items that were already bought
    listings.value = listings.value.filter(l =>
      !l.unique || !purchasedUniqueIds.value.has(l.item.name),
    )
    lastRefreshTick.value = tick
    lastFullRestockTick.value = tick
  }

  /**
   * Main tick handler — called from game loop.
   */
  function tick(currentTick: number): void {
    // Partial refresh
    if (currentTick - lastRefreshTick.value >= SHOP_REFRESH_TICKS) {
      const luckBonus = getLuckBonus()
      listings.value = refreshShopPartial(
        listings.value, SHOP_REFRESH_FRACTION, luckBonus, currentTick,
      )
      // Remove already-purchased unique items
      listings.value = listings.value.filter(l =>
        !l.unique || !purchasedUniqueIds.value.has(l.item.name),
      )
      lastRefreshTick.value = currentTick
    }

    // Full restock
    if (currentTick - lastFullRestockTick.value >= SHOP_FULL_RESTOCK_TICKS) {
      const luckBonus = getLuckBonus()
      listings.value = generateShopBatch(SHOP_LISTING_COUNT, luckBonus, currentTick)
      listings.value = listings.value.filter(l =>
        !l.unique || !purchasedUniqueIds.value.has(l.item.name),
      )
      lastFullRestockTick.value = currentTick
    }
  }

  /**
   * Purchase a listing and send item to the vault.
   */
  function buyItem(listingId: string, destination: 'vault' | 'storage'): boolean {
    const idx = listings.value.findIndex(l => l.id === listingId)
    if (idx === -1) return false

    const listing = listings.value[idx]
    const player = usePlayerStore()

    // Check cash
    if (player.cash.lt(listing.price)) return false

    // Check destination capacity
    if (destination === 'vault') {
      const vault = useVaultStore()
      if (vault.isFull) return false
    }

    // Pay
    player.spendCash(listing.price)
    totalItemsBought.value++
    totalCashSpentOnPurchases.value = add(totalCashSpentOnPurchases.value, listing.price)

    if (listing.unique) {
      purchasedUniqueIds.value.add(listing.item.name)
      uniqueItemsBought.value++
    }

    // Deliver item
    if (destination === 'vault') {
      const vault = useVaultStore()
      vault.addItem(listing.item, 'shop')
    } else {
      const storage = useStorageStore()
      storage.inventory.push({
        ...listing.item,
        auctionId: 'shop_purchase',
        acquiredAtTick: listing.listedAtTick || Date.now(),
      })
    }

    // XP for buying
    player.addXp(D(2))

    // Remove from listings
    listings.value.splice(idx, 1)
    return true
  }

  /**
   * Sell an item TO the shop (from any source).
   * Returns the cash received.
   */
  function sellToShop(
    itemId: string,
    source: SellSource,
  ): Decimal | null {
    const player = usePlayerStore()
    const upgrades = useUpgradeStore()
    let item: any = null
    let removeItem: () => void = () => {}

    if (source === 'vault') {
      const vault = useVaultStore()
      const idx = vault.items.findIndex(i => i.id === itemId)
      if (idx === -1) return null
      item = vault.items[idx]
      removeItem = () => vault.items.splice(idx, 1)
    } else if (source === 'storage_wars') {
      const storage = useStorageStore()
      const idx = storage.inventory.findIndex(i => i.id === itemId)
      if (idx === -1) return null
      item = storage.inventory[idx]
      removeItem = () => storage.inventory.splice(idx, 1)
    }

    if (!item) return null

    const rawValue = item.appraisedValue ?? item.baseValue
    const afterFraction = rawValue.mul(SHOP_SELL_FRACTION)
    const sellMul = upgrades.getMultiplier('all_income')
    const finalValue = mul(afterFraction, sellMul).max(D(1))

    player.earnCash(finalValue)
    totalItemsSoldToShop.value++
    totalCashFromSales.value = add(totalCashFromSales.value, finalValue)

    // Track best deal
    const profit = sub(finalValue, item.baseValue)
    if (profit.gt(bestDeal.value)) {
      bestDeal.value = profit
    }

    player.addXp(D(1))

    removeItem()
    return finalValue
  }

  /**
   * Bulk sell all items from a specific source to the shop.
   */
  function bulkSellToShop(source: SellSource): { count: number; total: Decimal } {
    let total = ZERO
    let count = 0

    if (source === 'vault') {
      const vault = useVaultStore()
      while (vault.items.length > 0) {
        const result = sellToShop(vault.items[0].id, 'vault')
        if (result) { total = add(total, result); count++ }
        else break
      }
    } else if (source === 'storage_wars') {
      const storage = useStorageStore()
      while (storage.inventory.length > 0) {
        const result = sellToShop(storage.inventory[0].id, 'storage_wars')
        if (result) { total = add(total, result); count++ }
        else break
      }
    }

    return { count, total }
  }

  // ── Helpers ────────────────────────────────────────────────

  function getLuckBonus(): number {
    const upgrades = useUpgradeStore()
    return upgrades.getMultiplier('gambling_luck').toNumber() - 1
  }

  function setSearch(query: string): void {
    searchQuery.value = query
    currentPage.value = 0
  }

  function setCategory(category: ShopCategory | 'all'): void {
    filterCategory.value = category
    currentPage.value = 0
  }

  function setRarity(rarity: string): void {
    filterRarity.value = rarity
    currentPage.value = 0
  }

  function setSort(sort: SortField): void {
    sortBy.value = sort
  }

  // ── Prestige / Reset ───────────────────────────────────────

  function prestigeReset(): void {
    listings.value = []
    // purchasedUniqueIds persists across prestige (they are truly unique)
    lastRefreshTick.value = 0
    lastFullRestockTick.value = 0
    searchQuery.value = ''
    filterCategory.value = 'all'
    filterRarity.value = 'all'
    sortBy.value = 'newest'
    currentPage.value = 0
    totalItemsBought.value = 0
    totalCashSpentOnPurchases.value = ZERO
    totalItemsSoldToShop.value = 0
    totalCashFromSales.value = ZERO
    uniqueItemsBought.value = 0
    bestDeal.value = ZERO
  }

  function fullReset(): void {
    prestigeReset()
    purchasedUniqueIds.value = new Set()
  }

  // ── Save / Load ────────────────────────────────────────────

  function exportState(): Record<string, unknown> {
    return {
      listings: listings.value.map(l => ({
        id: l.id,
        item: {
          id: l.item.id,
          name: l.item.name,
          icon: l.item.icon,
          category: l.item.category,
          rarity: l.item.rarity,
          baseValue: l.item.baseValue,
          description: l.item.description,
          appraised: l.item.appraised,
          appraisedValue: l.item.appraisedValue,
          weight: l.item.weight,
        },
        price: l.price,
        basePrice: l.basePrice,
        flashSale: l.flashSale,
        discount: l.discount,
        unique: l.unique,
        listedAtTick: l.listedAtTick,
        views: l.views,
      })),
      purchasedUniqueIds: [...purchasedUniqueIds.value],
      lastRefreshTick: lastRefreshTick.value,
      lastFullRestockTick: lastFullRestockTick.value,
      totalItemsBought: totalItemsBought.value,
      totalCashSpentOnPurchases: totalCashSpentOnPurchases.value,
      totalItemsSoldToShop: totalItemsSoldToShop.value,
      totalCashFromSales: totalCashFromSales.value,
      uniqueItemsBought: uniqueItemsBought.value,
      bestDeal: bestDeal.value,
    }
  }

  function loadFromSave(data: Record<string, any>): void {
    if (data.listings) listings.value = data.listings
    if (data.purchasedUniqueIds) purchasedUniqueIds.value = new Set(data.purchasedUniqueIds)
    if (data.lastRefreshTick !== undefined) lastRefreshTick.value = data.lastRefreshTick
    if (data.lastFullRestockTick !== undefined) lastFullRestockTick.value = data.lastFullRestockTick
    if (data.totalItemsBought !== undefined) totalItemsBought.value = data.totalItemsBought
    if (data.totalCashSpentOnPurchases !== undefined) totalCashSpentOnPurchases.value = data.totalCashSpentOnPurchases
    if (data.totalItemsSoldToShop !== undefined) totalItemsSoldToShop.value = data.totalItemsSoldToShop
    if (data.totalCashFromSales !== undefined) totalCashFromSales.value = data.totalCashFromSales
    if (data.uniqueItemsBought !== undefined) uniqueItemsBought.value = data.uniqueItemsBought
    if (data.bestDeal !== undefined) bestDeal.value = data.bestDeal
  }

  return {
    // State
    listings,
    purchasedUniqueIds,
    lastRefreshTick,
    lastFullRestockTick,
    searchQuery,
    filterCategory,
    filterRarity,
    sortBy,
    currentPage,
    totalItemsBought,
    totalCashSpentOnPurchases,
    totalItemsSoldToShop,
    totalCashFromSales,
    uniqueItemsBought,
    bestDeal,

    // Computed
    filteredListings,
    listingCount,
    filteredCount,
    flashSaleCount,
    uniqueListingCount,
    shopNetProfit,

    // Actions
    initShop,
    tick,
    buyItem,
    sellToShop,
    bulkSellToShop,
    getLuckBonus,
    setSearch,
    setCategory,
    setRarity,
    setSort,
    prestigeReset,
    fullReset,
    exportState,
    loadFromSave,
  }
})
