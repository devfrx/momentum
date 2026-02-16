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
 * - Cyclical Demand — category sell multipliers fluctuate over time
 * - Restoration Workshop — repair items to increase value
 * - Resale Auctions — list items for NPC bidders to compete on
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
  SHOP_CATEGORIES,
  type ShopListing,
  type ShopCategory,
} from '@renderer/data/shop/items'
import type { StorageItem, ItemCondition } from '@renderer/data/storage/items'
import { resolveItemName } from '@renderer/data/storage/items'
import i18n from '@renderer/locales'
import {
  SHOP_LISTING_COUNT,
  SHOP_REFRESH_TICKS,
  SHOP_REFRESH_FRACTION,
  SHOP_FULL_RESTOCK_TICKS,
  SHOP_SELL_FRACTION,
  DEMAND_TICK_INTERVAL,
  AUCTION_NPC_BID_INTERVAL,
  AUCTION_MAX_ACTIVE,
  RESTORATION_SLOT_BASE,
  RESTORATION_SLOT_MAX,
} from '@renderer/data/shop/balance'
import {
  initDemandState,
  tickDemand,
  type CategoryDemand,
} from '@renderer/data/shop/demand'
import {
  CONDITION_ORDER,
  calculateRestorationCost,
  getTicksPerStep,
  getStepsBetween,
  getSlotUpgradeCost,
  getConditionAdjustedValue,
  getRestoredValue,
  type RestorationSlot,
} from '@renderer/data/shop/restoration'
import {
  createResaleAuction,
  processAuctionBids,
  calculateListingFee,
  calculateSuccessFee,
  type ResaleAuction,
} from '@renderer/data/shop/auction'

import { RARITY_ORDER } from '@renderer/data/rarity'

// ─── Types ──────────────────────────────────────────────────────

export type SortField = 'price_asc' | 'price_desc' | 'rarity_asc' | 'rarity_desc' | 'newest' | 'name'

export type SellSource = 'vault' | 'storage_wars' | 'shop'

// ─── Store ──────────────────────────────────────────────────────

export const useShopStore = defineStore('shop', () => {
  // ══════════════════════════════════════════════════════════════
  // ── LISTINGS STATE ─────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  const listings = ref<ShopListing[]>([])
  const purchasedUniqueIds = ref<Set<string>>(new Set())
  const lastRefreshTick = ref(0)
  const lastFullRestockTick = ref(0)

  // ── Search/Filter State ────────────────────────────────────
  const searchQuery = ref('')
  const filterCategory = ref<ShopCategory | 'all'>('all')
  const filterRarity = ref<string>('all')
  const filterCondition = ref<ItemCondition | 'all'>('all')
  const sortBy = ref<SortField>('newest')
  const currentPage = ref(0)

  // ── Lifetime Stats ─────────────────────────────────────────
  const totalItemsBought = ref(0)
  const totalCashSpentOnPurchases = ref<Decimal>(ZERO)
  const totalItemsSoldToShop = ref(0)
  const totalCashFromSales = ref<Decimal>(ZERO)
  const uniqueItemsBought = ref(0)
  const bestDeal = ref<Decimal>(ZERO)
  const totalItemsRestored = ref(0)
  const totalRestorationCashSpent = ref<Decimal>(ZERO)
  const totalAuctionRevenue = ref<Decimal>(ZERO)
  const totalAuctionsCompleted = ref(0)

  // ══════════════════════════════════════════════════════════════
  // ── DEMAND STATE ───────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  const demands = ref<CategoryDemand[]>([])
  const lastDemandTick = ref(0)

  // ══════════════════════════════════════════════════════════════
  // ── RESTORATION STATE ──────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  const restorationSlots = ref<(RestorationSlot | null)[]>([null])
  const restorationSlotCount = ref(RESTORATION_SLOT_BASE)

  // ══════════════════════════════════════════════════════════════
  // ── AUCTION STATE ──────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  const activeAuctions = ref<ResaleAuction[]>([])
  const auctionHistory = ref<ResaleAuction[]>([]) // last 20
  /** Latest game-engine tick — used by UI for auction timers. */
  const _lastGameTick = ref(0)

  // ══════════════════════════════════════════════════════════════
  // ── COMPUTED ───────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  /** Filtered + sorted listings. */
  const filteredListings = computed((): ShopListing[] => {
    let result = [...listings.value]

    // Text search
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      result = result.filter(l =>
        resolveItemName(l.item, i18n.global.t).toLowerCase().includes(q) ||
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

    // Condition filter
    if (filterCondition.value !== 'all') {
      result = result.filter(l => (l.item.condition ?? 'good') === filterCondition.value)
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
        result.sort((a, b) => resolveItemName(a.item, i18n.global.t).localeCompare(resolveItemName(b.item, i18n.global.t)))
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
    sub(
      add(totalCashFromSales.value, totalAuctionRevenue.value),
      add(totalCashSpentOnPurchases.value, totalRestorationCashSpent.value),
    ),
  )

  /** Trending categories (demand ≥ 1.4). */
  const trendingCategories = computed(() =>
    demands.value.filter(d => d.current >= 1.4),
  )

  /** Active restoration count. */
  const activeRestorations = computed(() =>
    restorationSlots.value.filter(s => s !== null).length,
  )

  /** Free restoration slots. */
  const freeRestorationSlots = computed(() =>
    restorationSlots.value.filter(s => s === null).length,
  )

  /** Can upgrade restoration slots. */
  const canUpgradeSlots = computed(() =>
    restorationSlotCount.value < RESTORATION_SLOT_MAX,
  )

  /** Next restoration slot upgrade cost. */
  const nextSlotUpgradeCost = computed(() =>
    getSlotUpgradeCost(restorationSlotCount.value),
  )

  /** Active auction count. */
  const activeAuctionCount = computed(() =>
    activeAuctions.value.filter(a => a.status === 'active').length,
  )

  /** Can list more auctions. */
  const canListAuction = computed(() =>
    activeAuctionCount.value < AUCTION_MAX_ACTIVE,
  )

  // ══════════════════════════════════════════════════════════════
  // ── DEMAND HELPERS ─────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  /** Get the current demand multiplier for a category. */
  function getDemandMultiplier(category: string): number {
    const d = demands.value.find(d => d.category === category)
    return d?.current ?? 1.0
  }

  // ══════════════════════════════════════════════════════════════
  // ── INIT ───────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  function initShop(tick: number = 0): void {
    // Init listings
    if (listings.value.length === 0) {
      const luckBonus = getLuckBonus()
      listings.value = generateShopBatch(SHOP_LISTING_COUNT, luckBonus, tick)
      listings.value = listings.value.filter(l =>
        !l.unique || !purchasedUniqueIds.value.has(l.item.name),
      )
      lastRefreshTick.value = tick
      lastFullRestockTick.value = tick
    }

    // Init demand
    if (demands.value.length === 0) {
      demands.value = initDemandState(SHOP_CATEGORIES, tick)
      lastDemandTick.value = tick
    }

    // Init restoration slots
    while (restorationSlots.value.length < restorationSlotCount.value) {
      restorationSlots.value.push(null)
    }
  }

  // ══════════════════════════════════════════════════════════════
  // ── TICK ───────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  function tick(currentTick: number): void {
    _lastGameTick.value = currentTick

    // ── Listing refresh ──────────────────────────────────────
    if (currentTick - lastRefreshTick.value >= SHOP_REFRESH_TICKS) {
      const luckBonus = getLuckBonus()
      listings.value = refreshShopPartial(
        listings.value, SHOP_REFRESH_FRACTION, luckBonus, currentTick,
      )
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

    // ── Demand tick ──────────────────────────────────────────
    if (currentTick - lastDemandTick.value >= DEMAND_TICK_INTERVAL) {
      demands.value = tickDemand(demands.value, currentTick)
      lastDemandTick.value = currentTick
    }

    // ── Restoration tick ─────────────────────────────────────
    tickRestorations()

    // ── Auction tick ─────────────────────────────────────────
    tickAuctions(currentTick)
  }

  // ══════════════════════════════════════════════════════════════
  // ── BUY ────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  function buyItem(listingId: string, destination: 'vault' | 'storage'): boolean {
    const idx = listings.value.findIndex(l => l.id === listingId)
    if (idx === -1) return false

    const listing = listings.value[idx]
    const player = usePlayerStore()

    if (player.cash.lt(listing.price)) return false

    if (destination === 'vault') {
      const vault = useVaultStore()
      if (vault.isFull) return false
    }

    player.spendCash(listing.price)
    totalItemsBought.value++
    totalCashSpentOnPurchases.value = add(totalCashSpentOnPurchases.value, listing.price)

    if (listing.unique) {
      purchasedUniqueIds.value.add(listing.item.name)
      uniqueItemsBought.value++
    }

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

    player.addXp(D(2))
    listings.value.splice(idx, 1)
    return true
  }

  // ══════════════════════════════════════════════════════════════
  // ── SELL (with demand multiplier) ──────────────────────────
  // ══════════════════════════════════════════════════════════════

  function sellToShop(
    itemId: string,
    source: SellSource,
  ): Decimal | null {
    const player = usePlayerStore()
    const upgrades = useUpgradeStore()
    let item: any = null
    let removeItem: () => void = () => { }

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
    const demandMult = getDemandMultiplier(item.category)
    const sellMul = upgrades.getMultiplier('all_income')
    const finalValue = mul(mul(afterFraction, D(demandMult)), sellMul).max(D(1))

    player.earnCash(finalValue)
    totalItemsSoldToShop.value++
    totalCashFromSales.value = add(totalCashFromSales.value, finalValue)

    const profit = sub(finalValue, item.baseValue)
    if (profit.gt(bestDeal.value)) {
      bestDeal.value = profit
    }

    player.addXp(D(1))
    removeItem()
    return finalValue
  }

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

  /**
   * Get the estimated sell value for an item, accounting for demand.
   */
  function getEstimatedSellValue(item: any): Decimal {
    const upgrades = useUpgradeStore()
    const rawValue = item.appraisedValue ?? item.baseValue
    const afterFraction = rawValue.mul(SHOP_SELL_FRACTION)
    const demandMult = getDemandMultiplier(item.category)
    const sellMul = upgrades.getMultiplier('all_income')
    return mul(mul(afterFraction, D(demandMult)), sellMul).max(D(1))
  }

  // ══════════════════════════════════════════════════════════════
  // ── RESTORATION ────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  /**
   * Start restoring an item. Takes it from vault/storage and places
   * it in a restoration slot.
   */
  function startRestoration(
    itemId: string,
    source: 'vault' | 'storage',
    targetCondition: ItemCondition,
  ): boolean {
    // Find a free slot
    const slotIdx = restorationSlots.value.findIndex(s => s === null)
    if (slotIdx === -1) return false

    const player = usePlayerStore()
    let item: any = null
    let removeItem: () => void = () => { }

    if (source === 'vault') {
      const vault = useVaultStore()
      const idx = vault.items.findIndex(i => i.id === itemId)
      if (idx === -1) return false
      item = vault.items[idx]
      removeItem = () => vault.items.splice(idx, 1)
    } else {
      const storage = useStorageStore()
      const idx = storage.inventory.findIndex(i => i.id === itemId)
      if (idx === -1) return false
      item = storage.inventory[idx]
      removeItem = () => storage.inventory.splice(idx, 1)
    }

    if (!item) return false

    const currentCondition: ItemCondition = item.condition ?? 'good'
    if (CONDITION_ORDER.indexOf(targetCondition) <= CONDITION_ORDER.indexOf(currentCondition)) {
      return false // Can't downgrade
    }

    const cost = calculateRestorationCost(item, currentCondition, targetCondition)
    if (player.cash.lt(cost)) return false

    const steps = getStepsBetween(currentCondition, targetCondition)
    const ticksPerStep = getTicksPerStep(item)

    // Pay upfront
    player.spendCash(cost)
    totalRestorationCashSpent.value = add(totalRestorationCashSpent.value, cost)

    // Remove item from source
    removeItem()

    // Create restoration slot
    restorationSlots.value[slotIdx] = {
      id: `resto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      item: { ...item },
      source,
      startCondition: currentCondition,
      targetCondition,
      totalSteps: steps,
      currentStep: 0,
      ticksRemaining: ticksPerStep,
      ticksPerStep,
      totalCost: cost,
      paidCost: cost,
      completed: false,
    }

    return true
  }

  /**
   * Tick all active restoration slots.
   */
  function tickRestorations(): void {
    for (let i = 0; i < restorationSlots.value.length; i++) {
      const slot = restorationSlots.value[i]
      if (!slot || slot.completed) continue

      slot.ticksRemaining--

      if (slot.ticksRemaining <= 0) {
        slot.currentStep++

        if (slot.currentStep >= slot.totalSteps) {
          // Restoration complete!
          slot.completed = true
          completeRestoration(i)
        } else {
          // Next step
          slot.ticksRemaining = slot.ticksPerStep
        }
      }
    }
  }

  /**
   * Complete a restoration and return the item to the vault.
   */
  function completeRestoration(slotIdx: number): void {
    const slot = restorationSlots.value[slotIdx]
    if (!slot) return

    const player = usePlayerStore()
    const vault = useVaultStore()

    // Update item condition and value
    const restoredItem: StorageItem = {
      ...slot.item,
      condition: slot.targetCondition as StorageItem['condition'],
      appraisedValue: getRestoredValue(slot.item, slot.targetCondition),
    }

    // Return to vault (always goes to vault after restoration)
    vault.addItem(restoredItem, 'shop')

    totalItemsRestored.value++
    player.addXp(D(5))

    // Clear the slot
    restorationSlots.value[slotIdx] = null
  }

  /**
   * Cancel an in-progress restoration.
   * Item is returned at its current progress condition (partial refund).
   */
  function cancelRestoration(slotIdx: number): void {
    const slot = restorationSlots.value[slotIdx]
    if (!slot || slot.completed) return

    const vault = useVaultStore()

    // Calculate intermediate condition based on completed steps
    const condIdx = CONDITION_ORDER.indexOf(slot.startCondition) + slot.currentStep
    const currentCond = CONDITION_ORDER[Math.min(condIdx, CONDITION_ORDER.length - 1)]

    const partialItem: StorageItem = {
      ...slot.item,
      condition: currentCond as StorageItem['condition'],
      appraisedValue: getRestoredValue(slot.item, currentCond),
    }

    vault.addItem(partialItem, 'shop')
    restorationSlots.value[slotIdx] = null
  }

  /**
   * Upgrade the number of restoration slots.
   */
  function upgradeRestorationSlots(): boolean {
    if (restorationSlotCount.value >= RESTORATION_SLOT_MAX) return false
    const player = usePlayerStore()
    const cost = nextSlotUpgradeCost.value
    if (player.cash.lt(cost)) return false

    player.spendCash(cost)
    restorationSlotCount.value++
    restorationSlots.value.push(null)
    return true
  }

  // ══════════════════════════════════════════════════════════════
  // ── RESALE AUCTIONS ────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  /**
   * List an item for resale auction.
   */
  function listForAuction(
    itemId: string,
    source: 'vault' | 'storage',
    startingPrice: Decimal,
    buyNowPrice: Decimal | null,
  ): boolean {
    const currentTick = _lastGameTick.value
    if (!canListAuction.value) return false

    const player = usePlayerStore()
    let item: any = null
    let removeItem: () => void = () => { }

    if (source === 'vault') {
      const vault = useVaultStore()
      const idx = vault.items.findIndex(i => i.id === itemId)
      if (idx === -1) return false
      item = vault.items[idx]
      removeItem = () => vault.items.splice(idx, 1)
    } else {
      const storage = useStorageStore()
      const idx = storage.inventory.findIndex(i => i.id === itemId)
      if (idx === -1) return false
      item = storage.inventory[idx]
      removeItem = () => storage.inventory.splice(idx, 1)
    }

    if (!item) return false

    // Pay listing fee
    const listingFee = calculateListingFee(startingPrice)
    if (player.cash.lt(listingFee)) return false
    player.spendCash(listingFee)

    const demandMult = getDemandMultiplier(item.category)
    const luckBonus = getLuckBonus()

    const auction = createResaleAuction(
      { ...item },
      source,
      startingPrice,
      buyNowPrice,
      currentTick,
      demandMult,
      luckBonus,
    )

    removeItem()
    activeAuctions.value.push(auction)
    return true
  }

  /**
   * Tick active auctions — process NPC bids and finalize expired ones.
   */
  function tickAuctions(currentTick: number): void {
    for (let i = activeAuctions.value.length - 1; i >= 0; i--) {
      const auction = activeAuctions.value[i]
      if (auction.status !== 'active') continue

      // Process bids periodically
      if (currentTick - auction.lastBidTick >= AUCTION_NPC_BID_INTERVAL) {
        activeAuctions.value[i] = processAuctionBids(auction)
        activeAuctions.value[i].lastBidTick = currentTick
      }

      // Check if auction ended
      if (currentTick >= auction.endsAtTick) {
        finalizeAuction(i)
      }
    }
  }

  /**
   * Finalize an auction — pay the player or return the item.
   */
  function finalizeAuction(auctionIdx: number): void {
    const auction = activeAuctions.value[auctionIdx]
    const player = usePlayerStore()

    if (auction.currentBid.gt(ZERO) && auction.currentBidder) {
      // Item sold!
      const successFee = calculateSuccessFee(auction.currentBid)
      const proceeds = sub(auction.currentBid, successFee)
      player.earnCash(proceeds)

      totalAuctionRevenue.value = add(totalAuctionRevenue.value, proceeds)
      totalAuctionsCompleted.value++
      player.addXp(D(3))

      auction.status = 'sold'
    } else {
      // No bids — return item to vault
      const vault = useVaultStore()
      vault.addItem(auction.item, 'shop')
      auction.status = 'expired'
    }

    // Move to history
    auctionHistory.value.unshift(auction)
    if (auctionHistory.value.length > 20) auctionHistory.value.pop()
    activeAuctions.value.splice(auctionIdx, 1)
  }

  /**
   * Cancel an active auction and return the item.
   * No refund on listing fee.
   */
  function cancelAuction(auctionId: string): boolean {
    const idx = activeAuctions.value.findIndex(a => a.id === auctionId)
    if (idx === -1) return false

    const auction = activeAuctions.value[idx]
    if (auction.status !== 'active') return false

    const vault = useVaultStore()
    vault.addItem(auction.item, 'shop')
    auction.status = 'cancelled'

    auctionHistory.value.unshift(auction)
    if (auctionHistory.value.length > 20) auctionHistory.value.pop()
    activeAuctions.value.splice(idx, 1)
    return true
  }

  // ══════════════════════════════════════════════════════════════
  // ── HELPERS ────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

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

  function setConditionFilter(condition: ItemCondition | 'all'): void {
    filterCondition.value = condition
    currentPage.value = 0
  }

  function setSort(sort: SortField): void {
    sortBy.value = sort
  }

  // ══════════════════════════════════════════════════════════════
  // ── PRESTIGE / RESET ───────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  function prestigeReset(): void {
    listings.value = []
    lastRefreshTick.value = 0
    lastFullRestockTick.value = 0
    searchQuery.value = ''
    filterCategory.value = 'all'
    filterRarity.value = 'all'
    filterCondition.value = 'all'
    sortBy.value = 'newest'
    currentPage.value = 0
    totalItemsBought.value = 0
    totalCashSpentOnPurchases.value = ZERO
    totalItemsSoldToShop.value = 0
    totalCashFromSales.value = ZERO
    uniqueItemsBought.value = 0
    bestDeal.value = ZERO
    totalItemsRestored.value = 0
    totalRestorationCashSpent.value = ZERO
    totalAuctionRevenue.value = ZERO
    totalAuctionsCompleted.value = 0
    demands.value = []
    lastDemandTick.value = 0
    restorationSlots.value = Array(restorationSlotCount.value).fill(null)
    activeAuctions.value = []
    auctionHistory.value = []
  }

  function fullReset(): void {
    prestigeReset()
    purchasedUniqueIds.value = new Set()
    restorationSlotCount.value = RESTORATION_SLOT_BASE
    restorationSlots.value = [null]
  }

  // ══════════════════════════════════════════════════════════════
  // ── SAVE / LOAD ────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

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
          condition: l.item.condition,
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
      totalItemsRestored: totalItemsRestored.value,
      totalRestorationCashSpent: totalRestorationCashSpent.value,
      totalAuctionRevenue: totalAuctionRevenue.value,
      totalAuctionsCompleted: totalAuctionsCompleted.value,
      // Demand state
      demands: demands.value,
      lastDemandTick: lastDemandTick.value,
      // Restoration state
      restorationSlotCount: restorationSlotCount.value,
      restorationSlots: restorationSlots.value,
      // Auction state
      activeAuctions: activeAuctions.value,
      auctionHistory: auctionHistory.value,
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
    if (data.totalItemsRestored !== undefined) totalItemsRestored.value = data.totalItemsRestored
    if (data.totalRestorationCashSpent !== undefined) totalRestorationCashSpent.value = data.totalRestorationCashSpent
    if (data.totalAuctionRevenue !== undefined) totalAuctionRevenue.value = data.totalAuctionRevenue
    if (data.totalAuctionsCompleted !== undefined) totalAuctionsCompleted.value = data.totalAuctionsCompleted
    // Demand
    if (data.demands) demands.value = data.demands
    if (data.lastDemandTick !== undefined) lastDemandTick.value = data.lastDemandTick
    // Restoration
    if (data.restorationSlotCount !== undefined) restorationSlotCount.value = data.restorationSlotCount
    if (data.restorationSlots) restorationSlots.value = data.restorationSlots
    // Auctions
    if (data.activeAuctions) activeAuctions.value = data.activeAuctions
    if (data.auctionHistory) auctionHistory.value = data.auctionHistory
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
    filterCondition,
    sortBy,
    currentPage,
    totalItemsBought,
    totalCashSpentOnPurchases,
    totalItemsSoldToShop,
    totalCashFromSales,
    uniqueItemsBought,
    bestDeal,
    totalItemsRestored,
    totalRestorationCashSpent,
    totalAuctionRevenue,
    totalAuctionsCompleted,
    demands,
    lastDemandTick,
    restorationSlots,
    restorationSlotCount,
    activeAuctions,
    auctionHistory,
    _lastGameTick,

    // Computed
    filteredListings,
    listingCount,
    filteredCount,
    flashSaleCount,
    uniqueListingCount,
    shopNetProfit,
    trendingCategories,
    activeRestorations,
    freeRestorationSlots,
    canUpgradeSlots,
    nextSlotUpgradeCost,
    activeAuctionCount,
    canListAuction,

    // Actions
    initShop,
    tick,
    buyItem,
    sellToShop,
    bulkSellToShop,
    getEstimatedSellValue,
    getDemandMultiplier,
    startRestoration,
    cancelRestoration,
    upgradeRestorationSlots,
    listForAuction,
    cancelAuction,
    getLuckBonus,
    setSearch,
    setCategory,
    setRarity,
    setConditionFilter,
    setSort,
    prestigeReset,
    fullReset,
    exportState,
    loadFromSave,
  }
})
