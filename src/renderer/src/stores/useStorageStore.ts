/**
 * useStorageStore — Storage Wars auction state and operations
 *
 * Manages storage unit auctions, inventory of won items, appraisal,
 * and selling mechanics. Follows the same Pinia composition API pattern
 * as other stores in the application.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, max } from '@renderer/core/BigNum'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'
import {
  STORAGE_LOCATIONS,
  getUnlockedLocations,
  generateAuction,
  calculateBidderBehavior,
  AUCTION_CONFIG,
  APPRAISER_DEFS,
  type StorageAuction,
  type StorageItem,
  type StorageLocation,
  type AuctionBidder,
  type AppraiserDef,
} from '@renderer/data/storage'

// ─── Types ──────────────────────────────────────────────────────

export interface InventoryItem extends StorageItem {
  /** Source auction ID */
  auctionId: string
  /** Tick when item was acquired */
  acquiredAtTick: number
}

export interface AuctionHistoryEntry {
  auctionId: string
  locationId: string
  won: boolean
  pricePaid: Decimal
  itemsValue: Decimal
  itemCount: number
  tick: number
}

// ─── Store ──────────────────────────────────────────────────────

export const useStorageStore = defineStore('storage', () => {
  // ── Auctions ───────────────────────────────────────────────
  const availableAuctions = ref<StorageAuction[]>([])
  const activeAuction = ref<StorageAuction | null>(null)

  // ── Inventory ──────────────────────────────────────────────
  const inventory = ref<InventoryItem[]>([])

  // ── Statistics ─────────────────────────────────────────────
  const totalAuctionsWon = ref(0)
  const totalAuctionsLost = ref(0)
  const totalSpentOnAuctions = ref<Decimal>(ZERO)
  const totalSpentOnAppraisals = ref<Decimal>(ZERO)
  const totalItemsSold = ref(0)
  const totalSaleRevenue = ref<Decimal>(ZERO)
  const totalProfit = ref<Decimal>(ZERO)
  const biggestFind = ref<Decimal>(ZERO)
  const biggestFlip = ref<Decimal>(ZERO)
  const auctionHistory = ref<AuctionHistoryEntry[]>([])

  // ── Timing ─────────────────────────────────────────────────
  const lastRefreshTick = ref(0)

  // ── Computed ───────────────────────────────────────────────
  const unlockedLocations = computed((): StorageLocation[] => {
    const player = usePlayerStore()
    return getUnlockedLocations(player.cash)
  })

  const inventoryValue = computed((): Decimal => {
    let total = ZERO
    for (const item of inventory.value) {
      total = add(total, item.appraisedValue ?? item.baseValue)
    }
    return total
  })

  const inventoryCount = computed(() => inventory.value.length)

  const netProfit = computed(() => sub(totalSaleRevenue.value, add(totalSpentOnAuctions.value, totalSpentOnAppraisals.value)))

  const unlockedAppraisers = computed((): AppraiserDef[] => {
    const player = usePlayerStore()
    return APPRAISER_DEFS.filter(a => player.level >= a.unlockLevel)
  })

  // ── Tick ───────────────────────────────────────────────────

  function tick(currentTick: number): void {
    // Refresh auctions periodically
    if (currentTick - lastRefreshTick.value >= AUCTION_CONFIG.refreshTicks || availableAuctions.value.length === 0) {
      refreshAuctions(currentTick)
      lastRefreshTick.value = currentTick
    }

    // Process active auction rounds
    if (activeAuction.value && activeAuction.value.status === 'active') {
      processAuctionTick()
    }

    // Expire old available auctions
    const expireThreshold = AUCTION_CONFIG.refreshTicks * 3
    availableAuctions.value = availableAuctions.value.filter(
      a => a.status === 'available' && (currentTick - a.availableAtTick) < expireThreshold
    )
  }

  // ── Auction Refresh ────────────────────────────────────────

  function refreshAuctions(tick: number): void {
    const locs = unlockedLocations.value
    if (locs.length === 0) return

    const luckBonus = getLuckBonus()
    const newAuctions: StorageAuction[] = []
    const targetCount = Math.min(
      AUCTION_CONFIG.minAuctions + Math.floor(locs.length * 0.8),
      AUCTION_CONFIG.maxAuctions
    )

    // Keep existing available ones that haven't expired
    const existing = availableAuctions.value.filter(a => a.status === 'available')
    const needed = Math.max(0, targetCount - existing.length)

    for (let i = 0; i < needed; i++) {
      const loc = locs[Math.floor(Math.random() * locs.length)]
      newAuctions.push(generateAuction(loc, tick, luckBonus))
    }

    availableAuctions.value = [...existing, ...newAuctions]
  }

  // ── Start Auction ──────────────────────────────────────────

  function startAuction(auctionId: string): boolean {
    const auction = availableAuctions.value.find(a => a.id === auctionId)
    if (!auction || auction.status !== 'available') return false

    const player = usePlayerStore()
    const location = STORAGE_LOCATIONS.find(l => l.id === auction.locationId)
    if (!location) return false

    // Check entry fee
    if (player.cash.lt(location.entryFee)) return false

    // Pay entry fee
    player.spendCash(location.entryFee)

    auction.status = 'active'
    auction.roundTicksLeft = AUCTION_CONFIG.ticksPerRound
    auction.roundsElapsed = 0
    activeAuction.value = auction

    // Remove from available
    availableAuctions.value = availableAuctions.value.filter(a => a.id !== auctionId)

    return true
  }

  // ── Place Bid ──────────────────────────────────────────────

  function placeBid(amount: Decimal): boolean {
    if (!activeAuction.value || activeAuction.value.status !== 'active') return false
    const player = usePlayerStore()

    const minBid = activeAuction.value.currentBid.add(activeAuction.value.bidIncrement)
    if (amount.lt(minBid)) return false
    if (player.cash.lt(amount)) return false

    activeAuction.value.currentBid = amount
    activeAuction.value.currentBidder = 'player'

    // Trigger NPC responses
    processNpcBids()

    return true
  }

  // ── NPC Bidding ────────────────────────────────────────────

  function processNpcBids(): void {
    if (!activeAuction.value) return

    const auction = activeAuction.value
    let highestNpcBid: Decimal = ZERO
    let highestNpcBidder: AuctionBidder | null = null

    for (const bidder of auction.bidders) {
      if (bidder.droppedOut) continue

      const npcBid = calculateBidderBehavior(
        bidder,
        auction.currentBid,
        auction.bidIncrement,
        auction.roundsElapsed,
      )

      if (npcBid === null) {
        bidder.droppedOut = true
        continue
      }

      if (npcBid.gt(highestNpcBid)) {
        highestNpcBid = npcBid
        highestNpcBidder = bidder
      }
    }

    // If an NPC outbid, update auction
    if (highestNpcBidder && highestNpcBid.gt(auction.currentBid)) {
      auction.currentBid = highestNpcBid
      auction.currentBidder = highestNpcBidder.id
      highestNpcBidder.currentBid = highestNpcBid
    }

    auction.roundsElapsed++
    auction.roundTicksLeft = AUCTION_CONFIG.ticksPerRound
  }

  // ── Process Auction Tick (countdown) ───────────────────────

  function processAuctionTick(): void {
    if (!activeAuction.value) return
    const auction = activeAuction.value

    auction.roundTicksLeft--

    // If timer expires for this round
    if (auction.roundTicksLeft <= 0) {
      // If nobody bid ever or max rounds reached → close
      if (auction.roundsElapsed >= AUCTION_CONFIG.maxRounds || auction.currentBidder === '') {
        closeAuction()
      } else {
        // Auto-advance: NPCs may bid even without player
        processNpcBids()
      }
    }
  }

  // ── Close Auction ──────────────────────────────────────────

  function closeAuction(): void {
    if (!activeAuction.value) return
    const auction = activeAuction.value
    const player = usePlayerStore()
    const currentTick = auction.availableAtTick + auction.roundsElapsed * AUCTION_CONFIG.ticksPerRound

    if (auction.currentBidder === 'player') {
      // Player won!
      player.spendCash(auction.currentBid)
      auction.status = 'won'
      totalAuctionsWon.value++
      totalSpentOnAuctions.value = add(totalSpentOnAuctions.value, auction.currentBid)

      // Add items to inventory
      for (const item of auction.items) {
        inventory.value.push({
          ...item,
          auctionId: auction.id,
          acquiredAtTick: currentTick,
        })
      }

      // Track biggest find
      const totalVal = auction.hiddenTotalValue
      biggestFind.value = max(biggestFind.value, totalVal)

      // XP for winning
      player.addXp(D(5))

      auctionHistory.value.unshift({
        auctionId: auction.id,
        locationId: auction.locationId,
        won: true,
        pricePaid: auction.currentBid,
        itemsValue: totalVal,
        itemCount: auction.items.length,
        tick: currentTick,
      })
    } else {
      // Player lost (or didn't bid)
      auction.status = 'lost'
      totalAuctionsLost.value++

      auctionHistory.value.unshift({
        auctionId: auction.id,
        locationId: auction.locationId,
        won: false,
        pricePaid: ZERO,
        itemsValue: ZERO,
        itemCount: 0,
        tick: currentTick,
      })
    }

    // Keep history trimmed
    if (auctionHistory.value.length > 50) {
      auctionHistory.value = auctionHistory.value.slice(0, 50)
    }

    activeAuction.value = null
  }

  // ── Skip / Leave Auction ───────────────────────────────────

  function leaveAuction(): void {
    if (!activeAuction.value) return
    // Mark as lost and close
    activeAuction.value.currentBidder = ''
    closeAuction()
  }

  // ── Appraise Item ──────────────────────────────────────────

  function appraiseItem(itemId: string, appraiserId: string): boolean {
    const item = inventory.value.find(i => i.id === itemId)
    if (!item || item.appraised) return false

    const appraiser = APPRAISER_DEFS.find(a => a.id === appraiserId)
    if (!appraiser) return false

    const player = usePlayerStore()
    if (player.cash.lt(appraiser.costPerItem)) return false

    // Pay appraisal fee
    player.spendCash(appraiser.costPerItem)
    totalSpentOnAppraisals.value = add(totalSpentOnAppraisals.value, appraiser.costPerItem)

    // Calculate appraised value based on accuracy
    const accuracyVariance = 1.0 - appraiser.accuracy
    const varianceFactor = 1.0 + (Math.random() * 2 - 1) * accuracyVariance
    let appraisedVal = item.baseValue.mul(varianceFactor)

    // Bonus discovery chance
    if (Math.random() < appraiser.bonusDiscoveryChance) {
      appraisedVal = appraisedVal.mul(appraiser.bonusMultiplier)
    }

    item.appraised = true
    item.appraisedValue = appraisedVal.max(D(1))

    // XP for appraisal
    player.addXp(D(1))

    return true
  }

  // ── Appraise All Items ─────────────────────────────────────

  function appraiseAll(appraiserId: string): number {
    const unappraised = inventory.value.filter(i => !i.appraised)
    let count = 0
    for (const item of unappraised) {
      if (appraiseItem(item.id, appraiserId)) count++
      else break // Stop if can't afford
    }
    return count
  }

  // ── Sell Item ──────────────────────────────────────────────

  function sellItem(itemId: string): Decimal | null {
    const idx = inventory.value.findIndex(i => i.id === itemId)
    if (idx === -1) return null

    const item = inventory.value[idx]
    const value = item.appraisedValue ?? item.baseValue
    const player = usePlayerStore()

    // Apply sell multiplier from upgrades
    const sellMul = getSellMultiplier()
    const finalValue = mul(value, sellMul)

    player.earnCash(finalValue)
    totalItemsSold.value++
    totalSaleRevenue.value = add(totalSaleRevenue.value, finalValue)

    // Track profit
    const profit = finalValue
    totalProfit.value = add(totalProfit.value, profit)
    biggestFlip.value = max(biggestFlip.value, finalValue)

    // XP for selling
    player.addXp(D(1))

    // Remove from inventory
    inventory.value.splice(idx, 1)

    return finalValue
  }

  // ── Sell All Items ─────────────────────────────────────────

  function sellAll(): { count: number; total: Decimal } {
    let total = ZERO
    let count = 0
    // Sell from end to avoid index issues
    while (inventory.value.length > 0) {
      const result = sellItem(inventory.value[0].id)
      if (result) {
        total = add(total, result)
        count++
      } else break
    }
    return { count, total }
  }

  // ── Multipliers ────────────────────────────────────────────

  function getLuckBonus(): number {
    const upgrades = useUpgradeStore()
    return upgrades.getMultiplier('gambling_luck').toNumber() - 1
  }

  function getSellMultiplier(): Decimal {
    const upgrades = useUpgradeStore()
    return upgrades.getMultiplier('all_income')
  }

  // ── Prestige Reset ─────────────────────────────────────────

  function prestigeReset(): void {
    availableAuctions.value = []
    activeAuction.value = null
    inventory.value = []
    totalAuctionsWon.value = 0
    totalAuctionsLost.value = 0
    totalSpentOnAuctions.value = ZERO
    totalSpentOnAppraisals.value = ZERO
    totalItemsSold.value = 0
    totalSaleRevenue.value = ZERO
    totalProfit.value = ZERO
    biggestFind.value = ZERO
    biggestFlip.value = ZERO
    auctionHistory.value = []
    lastRefreshTick.value = 0
  }

  function fullReset(): void {
    prestigeReset()
  }

  // ── Save/Load ──────────────────────────────────────────────

  function loadFromSave(data: Record<string, any>): void {
    if (data.inventory) inventory.value = data.inventory
    if (data.totalAuctionsWon !== undefined) totalAuctionsWon.value = data.totalAuctionsWon
    if (data.totalAuctionsLost !== undefined) totalAuctionsLost.value = data.totalAuctionsLost
    if (data.totalSpentOnAuctions !== undefined) totalSpentOnAuctions.value = data.totalSpentOnAuctions
    if (data.totalSpentOnAppraisals !== undefined) totalSpentOnAppraisals.value = data.totalSpentOnAppraisals
    if (data.totalItemsSold !== undefined) totalItemsSold.value = data.totalItemsSold
    if (data.totalSaleRevenue !== undefined) totalSaleRevenue.value = data.totalSaleRevenue
    if (data.totalProfit !== undefined) totalProfit.value = data.totalProfit
    if (data.biggestFind !== undefined) biggestFind.value = data.biggestFind
    if (data.biggestFlip !== undefined) biggestFlip.value = data.biggestFlip
    if (data.auctionHistory !== undefined) auctionHistory.value = data.auctionHistory
    if (data.lastRefreshTick !== undefined) lastRefreshTick.value = data.lastRefreshTick
  }

  function exportState(): Record<string, unknown> {
    return {
      inventory: inventory.value.map(i => ({
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
        auctionId: i.auctionId,
        acquiredAtTick: i.acquiredAtTick,
      })),
      totalAuctionsWon: totalAuctionsWon.value,
      totalAuctionsLost: totalAuctionsLost.value,
      totalSpentOnAuctions: totalSpentOnAuctions.value,
      totalSpentOnAppraisals: totalSpentOnAppraisals.value,
      totalItemsSold: totalItemsSold.value,
      totalSaleRevenue: totalSaleRevenue.value,
      totalProfit: totalProfit.value,
      biggestFind: biggestFind.value,
      biggestFlip: biggestFlip.value,
      auctionHistory: auctionHistory.value,
      lastRefreshTick: lastRefreshTick.value,
    }
  }

  return {
    // State
    availableAuctions,
    activeAuction,
    inventory,
    totalAuctionsWon,
    totalAuctionsLost,
    totalSpentOnAuctions,
    totalSpentOnAppraisals,
    totalItemsSold,
    totalSaleRevenue,
    totalProfit,
    biggestFind,
    biggestFlip,
    auctionHistory,
    lastRefreshTick,

    // Computed
    unlockedLocations,
    inventoryValue,
    inventoryCount,
    netProfit,
    unlockedAppraisers,

    // Actions
    tick,
    refreshAuctions,
    startAuction,
    placeBid,
    leaveAuction,
    closeAuction,
    appraiseItem,
    appraiseAll,
    sellItem,
    sellAll,
    getLuckBonus,
    getSellMultiplier,
    prestigeReset,
    fullReset,
    loadFromSave,
    exportState,
  }
})
