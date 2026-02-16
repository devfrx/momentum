/**
 * useStorageStore — Storage Wars auction state and operations
 *
 * Manages storage unit auctions, inventory of won items, appraisal,
 * selling mechanics, procedural locations, and session P&L tracking.
 * Follows the same Pinia composition API pattern as other stores.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, max } from '@renderer/core/BigNum'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'
import {
  generateAuction,
  calculateBidderBehavior,
  allBiddersDropped,
  AUCTION_CONFIG,
  APPRAISER_DEFS,
  type StorageAuction,
  type StorageItem,
  type AuctionBidder,
  type AppraiserDef,
} from '@renderer/data/storage'
import {
  type StorageLocation,
  getUnlockedLocations,
  findLocationInPool,
} from '@renderer/data/storage/locations'
import { generateLocationPool } from '@renderer/data/storage/locationGen'
import { applySellTax } from '@renderer/data/storage/items'
import { CONDITION_MULTIPLIERS } from '@renderer/data/shop/restoration'
import {
  SELL_TAX,
  INVENTORY_SOFT_CAP,
  STORAGE_FEE_PER_ITEM,
  LOCATION_RESHUFFLE_TICKS,
} from '@renderer/data/storage/balance'

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

/** Per-session profit & loss tracker (resets on page reload or manual reset). */
export interface SessionPnL {
  /** Total cash spent on entry fees */
  entryFees: Decimal
  /** Total cash spent on auction bids (won auctions) */
  bidSpend: Decimal
  /** Total cash spent on appraisals */
  appraisalSpend: Decimal
  /** Total cash spent on storage fees */
  storageFees: Decimal
  /** Total cash received from selling items */
  saleRevenue: Decimal
  /** Number of auctions entered */
  auctionsEntered: number
  /** Number of auctions won */
  auctionsWon: number
  /** Number of items sold */
  itemsSold: number
}

function freshSessionPnL(): SessionPnL {
  return {
    entryFees: ZERO,
    bidSpend: ZERO,
    appraisalSpend: ZERO,
    storageFees: ZERO,
    saleRevenue: ZERO,
    auctionsEntered: 0,
    auctionsWon: 0,
    itemsSold: 0,
  }
}

// ─── Store ──────────────────────────────────────────────────────

export const useStorageStore = defineStore('storage', () => {
  // ── Auctions ───────────────────────────────────────────────
  const availableAuctions = ref<StorageAuction[]>([])
  const activeAuction = ref<StorageAuction | null>(null)

  // ── Procedural Locations ───────────────────────────────────
  const locationPool = ref<StorageLocation[]>(generateLocationPool())
  const lastLocationReshuffle = ref(0)

  // ── Inventory ──────────────────────────────────────────────
  const inventory = ref<InventoryItem[]>([])

  // ── Lifetime Statistics ────────────────────────────────────
  const totalAuctionsWon = ref(0)
  const totalAuctionsLost = ref(0)
  const totalSpentOnAuctions = ref<Decimal>(ZERO)
  const totalSpentOnAppraisals = ref<Decimal>(ZERO)
  const totalSpentOnEntryFees = ref<Decimal>(ZERO)
  const totalSpentOnStorageFees = ref<Decimal>(ZERO)
  const totalItemsSold = ref(0)
  const totalSaleRevenue = ref<Decimal>(ZERO)
  const totalProfit = ref<Decimal>(ZERO)
  const biggestFind = ref<Decimal>(ZERO)
  const biggestFlip = ref<Decimal>(ZERO)
  const auctionHistory = ref<AuctionHistoryEntry[]>([])

  // ── Session P&L ────────────────────────────────────────────
  const session = ref<SessionPnL>(freshSessionPnL())

  // ── Timing ─────────────────────────────────────────────────
  const lastRefreshTick = ref(0)

  // ── Computed ───────────────────────────────────────────────

  /** Locations the player can currently access (cash ≥ unlockAt). */
  const unlockedLocations = computed((): StorageLocation[] => {
    const player = usePlayerStore()
    return getUnlockedLocations(locationPool.value, player.cash)
  })

  const inventoryValue = computed((): Decimal => {
    let total = ZERO
    for (const item of inventory.value) {
      total = add(total, item.appraisedValue ?? item.baseValue)
    }
    return total
  })

  const inventoryCount = computed(() => inventory.value.length)

  const netProfit = computed(() =>
    sub(
      totalSaleRevenue.value,
      add(add(totalSpentOnAuctions.value, totalSpentOnAppraisals.value),
        add(totalSpentOnEntryFees.value, totalSpentOnStorageFees.value)),
    ),
  )

  /** Session net P&L (revenue − all costs). */
  const sessionNet = computed((): Decimal =>
    sub(
      session.value.saleRevenue,
      add(add(session.value.entryFees, session.value.bidSpend),
        add(session.value.appraisalSpend, session.value.storageFees)),
    ),
  )

  /** Session total costs. */
  const sessionTotalCost = computed((): Decimal =>
    add(add(session.value.entryFees, session.value.bidSpend),
      add(session.value.appraisalSpend, session.value.storageFees)),
  )

  const unlockedAppraisers = computed((): AppraiserDef[] => {
    const player = usePlayerStore()
    return APPRAISER_DEFS.filter(a => player.level >= a.unlockLevel)
  })

  /** Current sell tax rate as a display string. */
  const sellTaxPercent = computed(() => Math.round(SELL_TAX * 100))

  // ── Location Helpers ───────────────────────────────────────

  /** Look up a location by id from the current pool. */
  function getLocation(id: string): StorageLocation | undefined {
    return findLocationInPool(locationPool.value, id)
  }

  /** Force-regenerate the entire location pool. */
  function reshuffleLocations(): void {
    locationPool.value = generateLocationPool()
  }

  // ── Tick ───────────────────────────────────────────────────

  function tick(currentTick: number): void {
    // Refresh auctions periodically
    if (currentTick - lastRefreshTick.value >= AUCTION_CONFIG.refreshTicks || availableAuctions.value.length === 0) {
      refreshAuctions(currentTick)
      lastRefreshTick.value = currentTick
    }

    // Reshuffle location pool periodically
    if (currentTick - lastLocationReshuffle.value >= LOCATION_RESHUFFLE_TICKS) {
      reshuffleLocations()
      lastLocationReshuffle.value = currentTick
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

    // Storage fees for over-capacity inventory (charged each refresh)
    if (currentTick - lastRefreshTick.value === 0 && inventory.value.length > INVENTORY_SOFT_CAP) {
      chargeStorageFees()
    }
  }

  /** Charge storage fees for items exceeding soft cap. */
  function chargeStorageFees(): void {
    const excess = inventory.value.length - INVENTORY_SOFT_CAP
    if (excess <= 0) return
    const fee = D(excess * STORAGE_FEE_PER_ITEM)
    const player = usePlayerStore()
    if (player.cash.gte(fee)) {
      player.spendCash(fee)
      totalSpentOnStorageFees.value = add(totalSpentOnStorageFees.value, fee)
      session.value.storageFees = add(session.value.storageFees, fee)
    }
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
    const location = getLocation(auction.locationId)
    if (!location) return false

    // Check entry fee
    if (player.cash.lt(location.entryFee)) return false

    // Pay entry fee
    player.spendCash(location.entryFee)
    totalSpentOnEntryFees.value = add(totalSpentOnEntryFees.value, location.entryFee)
    session.value.entryFees = add(session.value.entryFees, location.entryFee)
    session.value.auctionsEntered++

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
    const auction = activeAuction.value

    const minBid = auction.currentBid.add(auction.bidIncrement)
    if (amount.lt(minBid)) return false
    if (player.cash.lt(amount)) return false

    auction.currentBid = amount
    auction.currentBidder = 'player'

    // Trigger NPC responses
    const anyNpcBid = processNpcBids()
    auction.roundsElapsed++

    // If all NPCs out → enter going phases immediately
    if (allBiddersDropped(auction.bidders)) {
      auction.phase = 'going_once'
      auction.roundTicksLeft = AUCTION_CONFIG.ticksPerGoing
    } else if (!anyNpcBid) {
      // NPCs still active but none bid → stay in bidding, shorter timer
      auction.phase = 'bidding'
      auction.roundTicksLeft = AUCTION_CONFIG.ticksPerRound
    } else {
      // NPCs responded → reset bidding round
      auction.phase = 'bidding'
      auction.roundTicksLeft = AUCTION_CONFIG.ticksPerRound
    }

    return true
  }

  // ── NPC Bidding ────────────────────────────────────────────

  /**
   * Let each active NPC decide whether to bid or drop out.
   * Returns true if any NPC placed a bid this round.
   */
  function processNpcBids(): boolean {
    if (!activeAuction.value) return false

    const auction = activeAuction.value
    let anyNpcBid = false
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

      anyNpcBid = true
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

    return anyNpcBid
  }

  // ── Process Auction Tick (countdown) ───────────────────────

  function processAuctionTick(): void {
    if (!activeAuction.value) return
    const auction = activeAuction.value

    auction.roundTicksLeft--

    // Phase timer expired
    if (auction.roundTicksLeft <= 0) {
      if (auction.phase === 'bidding') {
        handleBiddingRoundEnd()
      } else {
        advanceGoingPhase()
      }
    }
  }

  /**
   * Handle the end of a normal bidding round.
   * Transitions to going phases when no contest remains.
   */
  function handleBiddingRoundEnd(): void {
    const auction = activeAuction.value!

    // Nobody ever bid → close
    if (auction.currentBidder === '') {
      closeAuction()
      return
    }

    // Max rounds reached → close
    if (auction.roundsElapsed >= AUCTION_CONFIG.maxRounds) {
      closeAuction()
      return
    }

    // Let NPCs decide
    const anyNpcBid = processNpcBids()
    auction.roundsElapsed++

    // All NPCs out and someone leads → going phases
    if (allBiddersDropped(auction.bidders) && auction.currentBidder !== '') {
      auction.phase = 'going_once'
      auction.roundTicksLeft = AUCTION_CONFIG.ticksPerGoing
      return
    }

    // No NPC bid but some are still active → shorter wait
    // (they might bid next round)
    if (!anyNpcBid && auction.currentBidder !== '') {
      // If player leads and NPCs passed, fast-track to going
      const activeNpcs = auction.bidders.filter(b => !b.droppedOut)
      if (activeNpcs.length === 0) {
        auction.phase = 'going_once'
        auction.roundTicksLeft = AUCTION_CONFIG.ticksPerGoing
        return
      }
    }

    // Continue normal bidding
    auction.roundTicksLeft = AUCTION_CONFIG.ticksPerRound
  }

  /**
   * Advance through going_once → going_twice → final_call → close.
   */
  function advanceGoingPhase(): void {
    const auction = activeAuction.value!

    switch (auction.phase) {
      case 'going_once':
        auction.phase = 'going_twice'
        auction.roundTicksLeft = AUCTION_CONFIG.ticksPerGoing
        break
      case 'going_twice':
        auction.phase = 'final_call'
        auction.roundTicksLeft = AUCTION_CONFIG.ticksPerGoing
        break
      case 'final_call':
        closeAuction()
        break
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
      session.value.bidSpend = add(session.value.bidSpend, auction.currentBid)
      session.value.auctionsWon++

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
    session.value.appraisalSpend = add(session.value.appraisalSpend, appraiser.costPerItem)

    // Calculate appraised value based on accuracy + condition
    const accuracyVariance = 1.0 - appraiser.accuracy
    const varianceFactor = 1.0 + (Math.random() * 2 - 1) * accuracyVariance
    // Condition multiplier — baseValue is the "good" condition value, appraisal reveals true worth
    const conditionMult = CONDITION_MULTIPLIERS[item.condition ?? 'good'] ?? 1.0
    let appraisedVal = item.baseValue.mul(varianceFactor).mul(conditionMult)

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
    const rawValue = item.appraisedValue ?? item.baseValue
    const player = usePlayerStore()

    // Apply sell tax (un-appraised items pay extra penalty)
    const afterTax = applySellTax(rawValue, item.appraised)

    // Apply sell multiplier from upgrades
    const sellMul = getSellMultiplier()
    const finalValue = mul(afterTax, sellMul)

    player.earnCash(finalValue)
    totalItemsSold.value++
    totalSaleRevenue.value = add(totalSaleRevenue.value, finalValue)
    session.value.saleRevenue = add(session.value.saleRevenue, finalValue)
    session.value.itemsSold++

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

  // ── Session Reset ───────────────────────────────────────────

  function resetSession(): void {
    session.value = freshSessionPnL()
  }

  // ── Prestige Reset ─────────────────────────────────────────

  function prestigeReset(): void {
    availableAuctions.value = []
    activeAuction.value = null
    inventory.value = []
    locationPool.value = generateLocationPool()
    lastLocationReshuffle.value = 0
    totalAuctionsWon.value = 0
    totalAuctionsLost.value = 0
    totalSpentOnAuctions.value = ZERO
    totalSpentOnAppraisals.value = ZERO
    totalSpentOnEntryFees.value = ZERO
    totalSpentOnStorageFees.value = ZERO
    totalItemsSold.value = 0
    totalSaleRevenue.value = ZERO
    totalProfit.value = ZERO
    biggestFind.value = ZERO
    biggestFlip.value = ZERO
    auctionHistory.value = []
    lastRefreshTick.value = 0
    resetSession()
  }

  function fullReset(): void {
    prestigeReset()
  }

  // ── Save/Load ──────────────────────────────────────────────

  function loadFromSave(data: Record<string, any>): void {
    if (data.inventory) inventory.value = data.inventory
    if (data.locationPool) locationPool.value = data.locationPool
    if (data.totalAuctionsWon !== undefined) totalAuctionsWon.value = data.totalAuctionsWon
    if (data.totalAuctionsLost !== undefined) totalAuctionsLost.value = data.totalAuctionsLost
    if (data.totalSpentOnAuctions !== undefined) totalSpentOnAuctions.value = data.totalSpentOnAuctions
    if (data.totalSpentOnAppraisals !== undefined) totalSpentOnAppraisals.value = data.totalSpentOnAppraisals
    if (data.totalSpentOnEntryFees !== undefined) totalSpentOnEntryFees.value = data.totalSpentOnEntryFees
    if (data.totalSpentOnStorageFees !== undefined) totalSpentOnStorageFees.value = data.totalSpentOnStorageFees
    if (data.totalItemsSold !== undefined) totalItemsSold.value = data.totalItemsSold
    if (data.totalSaleRevenue !== undefined) totalSaleRevenue.value = data.totalSaleRevenue
    if (data.totalProfit !== undefined) totalProfit.value = data.totalProfit
    if (data.biggestFind !== undefined) biggestFind.value = data.biggestFind
    if (data.biggestFlip !== undefined) biggestFlip.value = data.biggestFlip
    if (data.auctionHistory !== undefined) auctionHistory.value = data.auctionHistory
    if (data.lastRefreshTick !== undefined) lastRefreshTick.value = data.lastRefreshTick
    if (data.lastLocationReshuffle !== undefined) lastLocationReshuffle.value = data.lastLocationReshuffle
    // Session is intentionally NOT loaded — it resets each page load
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
        condition: i.condition,
        auctionId: i.auctionId,
        acquiredAtTick: i.acquiredAtTick,
      })),
      locationPool: locationPool.value,
      totalAuctionsWon: totalAuctionsWon.value,
      totalAuctionsLost: totalAuctionsLost.value,
      totalSpentOnAuctions: totalSpentOnAuctions.value,
      totalSpentOnAppraisals: totalSpentOnAppraisals.value,
      totalSpentOnEntryFees: totalSpentOnEntryFees.value,
      totalSpentOnStorageFees: totalSpentOnStorageFees.value,
      totalItemsSold: totalItemsSold.value,
      totalSaleRevenue: totalSaleRevenue.value,
      totalProfit: totalProfit.value,
      biggestFind: biggestFind.value,
      biggestFlip: biggestFlip.value,
      auctionHistory: auctionHistory.value,
      lastRefreshTick: lastRefreshTick.value,
      lastLocationReshuffle: lastLocationReshuffle.value,
    }
  }

  return {
    // State
    availableAuctions,
    activeAuction,
    inventory,
    locationPool,
    totalAuctionsWon,
    totalAuctionsLost,
    totalSpentOnAuctions,
    totalSpentOnAppraisals,
    totalSpentOnEntryFees,
    totalSpentOnStorageFees,
    totalItemsSold,
    totalSaleRevenue,
    totalProfit,
    biggestFind,
    biggestFlip,
    auctionHistory,
    lastRefreshTick,
    session,

    // Computed
    unlockedLocations,
    inventoryValue,
    inventoryCount,
    netProfit,
    sessionNet,
    sessionTotalCost,
    unlockedAppraisers,
    sellTaxPercent,

    // Actions
    tick,
    getLocation,
    reshuffleLocations,
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
    resetSession,
    prestigeReset,
    fullReset,
    loadFromSave,
    exportState,
  }
})
