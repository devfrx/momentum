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
  createBiddingTactics,
  resolveIntimidate,
  resolveBluff,
  canSniperBid,
  calcSniperBidAmount,
  canUseTactic,
  SNIPER_RESPONSE_FRACTION,
  type BiddingTactics,
} from '@renderer/data/storage/biddingTactics'
import {
  getRevealEvents,
  getBidEvents,
  getWinEvents,
  type ActiveLotEvent,
  type LotEventEffect,
} from '@renderer/data/storage/lotEvents'
import {
  getLotTierDef,
} from '@renderer/data/storage/auctionTiers'
import { generateItem } from '@renderer/data/storage/itemGen'
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
  NPC_AGGRESSION_MULT,
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

  // ── Bidding Tactics ────────────────────────────────────────
  const biddingTactics = ref<BiddingTactics | null>(null)

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

    // Initialize bidding tactics for this auction
    biddingTactics.value = createBiddingTactics()

    // Process on_reveal lot events
    applyRevealEvents(auction)

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

    // Process on_bid lot events
    applyBidEvents(auction)

    // No new bid this round (player didn't bid, NPCs passed or all dropped).
    // Start going-phase countdown so whoever leads gets the hammer – and the
    // other side has a last chance to counter-bid during going_once / going_twice.
    if (!anyNpcBid && auction.currentBidder !== '') {
      auction.phase = 'going_once'
      auction.roundTicksLeft = AUCTION_CONFIG.ticksPerGoing
      return
    }

    // NPCs placed a new bid → continue normal bidding (player gets a chance to respond)
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

  // ── Lot Event Processing ────────────────────────────────────

  /** Effect types that modify items and must be deferred to win-time */
  const ITEM_EFFECT_TYPES = new Set<string>([
    'extra_item', 'item_upgrade', 'item_damage', 'hidden_treasure', 'rarity_boost',
  ])

  /**
   * Apply on_reveal lot events when the auction starts.
   * These modify auction state before the first bid.
   * Events with item-level effects are NOT marked as applied here —
   * their item effects are deferred to applyWinEvents.
   */
  function applyRevealEvents(auction: StorageAuction): void {
    const reveals = getRevealEvents(auction.lotEvents)
    for (const ev of reveals) {
      for (const fx of ev.def.effects) {
        applyLotEffect(auction, fx)
      }
      // Only mark fully applied if no item-level effects need deferred processing
      const hasDeferredEffects = ev.def.effects.some(fx => ITEM_EFFECT_TYPES.has(fx.type))
      if (!hasDeferredEffects) ev.applied = true
    }
  }

  /**
   * Apply on_bid lot events that trigger at the current round.
   * Same deferred logic as applyRevealEvents.
   */
  function applyBidEvents(auction: StorageAuction): void {
    const bidEvs = getBidEvents(auction.lotEvents, auction.roundsElapsed)
    for (const ev of bidEvs) {
      for (const fx of ev.def.effects) {
        applyLotEffect(auction, fx)
      }
      const hasDeferredEffects = ev.def.effects.some(fx => ITEM_EFFECT_TYPES.has(fx.type))
      if (!hasDeferredEffects) ev.applied = true
    }
  }

  /**
   * Apply on_win lot events when the player wins.
   * Modifies auction items in-place before they're added to inventory.
   */
  function applyWinEvents(auction: StorageAuction): void {
    // Process ALL unapplied events: dedicated on_win + deferred item effects from reveal/bid
    const pendingEvs = auction.lotEvents.filter(e => !e.applied)
    const player = usePlayerStore()
    const condOrder = ['damaged', 'poor', 'fair', 'good', 'excellent', 'mint', 'pristine']

    for (const ev of pendingEvs) {
      const isWinTiming = ev.def.timing === 'on_win'

      for (const fx of ev.def.effects) {
        // For non-win events, only process item-level effects (NPC effects already applied)
        if (!isWinTiming && !ITEM_EFFECT_TYPES.has(fx.type)) continue

        switch (fx.type) {
          case 'extra_item': {
            // Generate a bonus item using the lot's location stats
            const loc = getLocation(auction.locationId)
            if (loc) {
              const bonusItem = generateItem(
                'uncommon', // base rarity for bonus items
                loc.valueMultiplier,
              )
              auction.items.push(bonusItem)
            }
            break
          }
          case 'hidden_treasure': {
            // Generate a rare/epic+ hidden item — the "treasure" feeling
            const rarityRoll = Math.random()
            const treasureRarity = rarityRoll < 0.05 ? 'mythic'
              : rarityRoll < 0.15 ? 'legendary'
              : rarityRoll < 0.35 ? 'epic'
              : 'rare'
            const loc = getLocation(auction.locationId)
            const bonusTreasure = generateItem(
              treasureRarity,
              loc?.valueMultiplier ?? 1.0,
            )
            auction.items.push(bonusTreasure)
            break
          }
          case 'item_upgrade': {
            // Upgrade ONE random item's condition by fx.value steps
            const upgradeable = auction.items.filter(i => i.condition && i.condition !== 'pristine')
            if (upgradeable.length > 0) {
              const item = upgradeable[Math.floor(Math.random() * upgradeable.length)]
              const curIdx = condOrder.indexOf(item.condition ?? 'good')
              const newIdx = Math.min(condOrder.length - 1, curIdx + fx.value)
              item.condition = condOrder[newIdx] as any
            }
            break
          }
          case 'item_damage': {
            // Damage up to fx.value distinct items, each by 1 condition step
            const damageable = auction.items.filter(i => i.condition && i.condition !== 'damaged')
            const toDamage = Math.min(fx.value, damageable.length)
            // Shuffle to pick distinct items
            const shuffled = [...damageable].sort(() => Math.random() - 0.5)
            for (let j = 0; j < toDamage; j++) {
              const item = shuffled[j]
              const curIdx = condOrder.indexOf(item.condition ?? 'good')
              const newIdx = Math.max(0, curIdx - 1)
              item.condition = condOrder[newIdx] as any
            }
            break
          }
          case 'bonus_xp': {
            player.addXp(D(fx.value))
            break
          }
          case 'rarity_boost': {
            // Chance to upgrade the rarity of one random item
            const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'jackpot', 'mythic']
            const boostable = auction.items.filter(i => {
              const idx = rarityOrder.indexOf(i.rarity)
              return idx >= 0 && idx < rarityOrder.length - 1
            })
            if (boostable.length > 0) {
              const item = boostable[Math.floor(Math.random() * boostable.length)]
              const curIdx = rarityOrder.indexOf(item.rarity)
              item.rarity = rarityOrder[curIdx + 1] as any
              // Also bump base value accordingly
              item.baseValue = item.baseValue.mul(1.8)
            }
            break
          }
          default:
            // fee_refund, npc-related effects are handled at other timings
            break
        }
      }
      ev.applied = true
    }
  }

  /**
   * Apply a single lot event effect to the active auction.
   * Used for on_reveal and on_bid effects (NPC/bidding modifications).
   */
  function applyLotEffect(auction: StorageAuction, fx: LotEventEffect): void {
    const player = usePlayerStore()

    switch (fx.type) {
      case 'npc_dropout': {
        // Force weakest N NPCs to drop out
        const active = auction.bidders
          .filter(b => !b.droppedOut)
          .sort((a, b) => a.maxBid.cmp(b.maxBid))
        const toDrop = Math.min(fx.value, active.length)
        for (let i = 0; i < toDrop; i++) {
          active[i].droppedOut = true
        }
        break
      }
      case 'npc_frenzy': {
        // Boost all active NPC max bids by factor
        for (const b of auction.bidders) {
          if (!b.droppedOut) {
            b.maxBid = b.maxBid.mul(fx.value)
          }
        }
        break
      }
      case 'bid_increment_change': {
        // Multiply bid increment
        auction.bidIncrement = auction.bidIncrement.mul(fx.value).max(D(1))
        break
      }
      case 'fee_refund': {
        // Partial refund of the entry fee (60%)
        const loc = getLocation(auction.locationId)
        if (loc) {
          const refundAmount = loc.entryFee.mul(0.6)
          player.earnCash(refundAmount)
        }
        break
      }
      case 'npc_latecomer': {
        // Add a new NPC bidder mid-auction, scaled by aggression multiplier + lot tier
        const personality = (fx.target ?? 'aggressive') as any
        const tierDef = getLotTierDef(auction.lotTier)
        const baseFactor = 0.8 + Math.random() * 0.5 // 0.8–1.3
        const adjustedFactor = baseFactor * NPC_AGGRESSION_MULT * tierDef.npcAggressionBoost
        const newBidder: AuctionBidder = {
          id: `bidder_late_${Math.random().toString(36).slice(2, 6)}`,
          name: 'Late Arrival',
          personality,
          maxBid: auction.hiddenTotalValue.mul(adjustedFactor),
          currentBid: D(0),
          droppedOut: false,
          avatar: 'mdi:account-alert',
          bidCount: 0,
        }
        auction.bidders.push(newBidder)
        break
      }
      case 'bidder_reveal': {
        // Mark the event result key with the strongest bidder's budget
        // (the UI reads this from the event's resultKeys)
        const strongest = auction.bidders
          .filter(b => !b.droppedOut)
          .sort((a, b) => b.maxBid.cmp(a.maxBid))[0]
        if (strongest) {
          // Store revealed info in the event's resultKeys for UI
          const ev = auction.lotEvents.find(e => e.def.effects.includes(fx))
          if (ev) {
            ev.resultKeys.push(`${strongest.name}:${strongest.maxBid.toString()}`)
          }
        }
        break
      }
      case 'bonus_xp': {
        player.addXp(D(fx.value))
        break
      }
      default:
        // item-level effects handled in applyWinEvents
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

      // Apply on_win lot events (modifies items in-place before inventory)
      applyWinEvents(auction)

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
    biddingTactics.value = null
  }

  // ── Skip / Leave Auction ───────────────────────────────────

  function leaveAuction(): void {
    if (!activeAuction.value) return
    // Mark as lost and close
    activeAuction.value.currentBidder = ''
    closeAuction()
  }

  // ── Intimidate ─────────────────────────────────────────────

  function useIntimidate(): BiddingTactics['tacticLog'][number] | null {
    if (!activeAuction.value || activeAuction.value.status !== 'active') return null
    if (!biddingTactics.value) return null

    const tactics = biddingTactics.value
    const auction = activeAuction.value

    if (!canUseTactic(tactics, 'intimidate', auction.roundsElapsed)) return null

    tactics.intimidateUsesLeft--
    tactics.lastTacticRound = auction.roundsElapsed

    const result = resolveIntimidate(
      auction.bidders,
      auction.currentBid,
      auction.bidIncrement,
    )

    // Apply counter-bids: highest counter-bidder wins
    if (result.counterBids.length > 0) {
      const best = result.counterBids.reduce(
        (top, cb) => cb.amount.gt(top.amount) ? cb : top,
        result.counterBids[0],
      )
      if (best.amount.gt(auction.currentBid)) {
        auction.currentBid = best.amount
        auction.currentBidder = best.bidder.id
        best.bidder.currentBid = best.amount
      }
    }

    // Check if all bidders now dropped → go to going phases
    if (allBiddersDropped(auction.bidders) && auction.currentBidder !== '') {
      auction.phase = 'going_once'
      auction.roundTicksLeft = AUCTION_CONFIG.ticksPerGoing
    }

    const entry: BiddingTactics['tacticLog'][number] = {
      tactic: 'intimidate',
      round: auction.roundsElapsed,
      reactions: result.reactions,
    }
    tactics.tacticLog.push(entry)
    return entry
  }

  // ── Bluff ──────────────────────────────────────────────────

  function useBluff(): BiddingTactics['tacticLog'][number] | null {
    if (!activeAuction.value || activeAuction.value.status !== 'active') return null
    if (!biddingTactics.value) return null

    const tactics = biddingTactics.value
    const auction = activeAuction.value

    if (!canUseTactic(tactics, 'bluff', auction.roundsElapsed)) return null

    tactics.bluffUsesLeft--
    tactics.lastTacticRound = auction.roundsElapsed

    const result = resolveBluff(
      auction.bidders,
      auction.currentBid,
      auction.bidIncrement,
    )

    // Apply caller bids: highest caller wins
    if (result.callerBids.length > 0) {
      const best = result.callerBids.reduce(
        (top, cb) => cb.amount.gt(top.amount) ? cb : top,
        result.callerBids[0],
      )
      if (best.amount.gt(auction.currentBid)) {
        auction.currentBid = best.amount
        auction.currentBidder = best.bidder.id
        best.bidder.currentBid = best.amount
      }
    }

    // Check if all dropped out
    if (allBiddersDropped(auction.bidders) && auction.currentBidder !== '') {
      auction.phase = 'going_once'
      auction.roundTicksLeft = AUCTION_CONFIG.ticksPerGoing
    }

    const entry: BiddingTactics['tacticLog'][number] = {
      tactic: 'bluff',
      round: auction.roundsElapsed,
      reactions: result.reactions,
    }
    tactics.tacticLog.push(entry)
    return entry
  }

  // ── Sniper Bid ─────────────────────────────────────────────

  function placeSniperBid(): boolean {
    if (!activeAuction.value || activeAuction.value.status !== 'active') return false
    if (!biddingTactics.value) return false

    const tactics = biddingTactics.value
    const auction = activeAuction.value

    if (!canSniperBid(auction.phase, tactics.sniperUsesLeft)) return false

    const sniperAmount = calcSniperBidAmount(auction.currentBid, auction.bidIncrement)
    const player = usePlayerStore()
    if (player.cash.lt(sniperAmount)) return false

    tactics.sniperUsesLeft--
    tactics.lastTacticRound = auction.roundsElapsed

    // Place the sniper bid
    auction.currentBid = sniperAmount
    auction.currentBidder = 'player'

    // NPCs get very little time to respond — most will fail to react
    // We give each active NPC reduced chance to respond
    const reactions: BiddingTactics['tacticLog'][number]['reactions'] = []
    for (const b of auction.bidders) {
      if (b.droppedOut) continue
      // Only SNIPER_RESPONSE_FRACTION chance to even react
      if (Math.random() > SNIPER_RESPONSE_FRACTION) {
        reactions.push({
          bidderId: b.id,
          bidderName: b.name,
          outcome: 'sniped',
          i18nKey: 'sniper_caught_off_guard',
        })
        continue
      }
      // Those who react, normal bidding logic
      const npcBid = calculateBidderBehavior(
        b, auction.currentBid, auction.bidIncrement, auction.roundsElapsed,
      )
      if (npcBid === null) {
        b.droppedOut = true
        reactions.push({
          bidderId: b.id,
          bidderName: b.name,
          outcome: 'dropped',
          i18nKey: 'sniper_dropped',
        })
      } else if (npcBid.gt(auction.currentBid)) {
        auction.currentBid = npcBid
        auction.currentBidder = b.id
        b.currentBid = npcBid
        b.bidCount++
        reactions.push({
          bidderId: b.id,
          bidderName: b.name,
          outcome: 'counter_bid',
          i18nKey: 'sniper_countered',
        })
      } else {
        reactions.push({
          bidderId: b.id,
          bidderName: b.name,
          outcome: 'sniped',
          i18nKey: 'sniper_caught_off_guard',
        })
      }
    }

    tactics.tacticLog.push({
      tactic: 'sniper',
      round: auction.roundsElapsed,
      reactions,
    })

    // After sniper bid, reset going phase to going_once
    // (gives the hammer auctioneer pause to process the last-second bid)
    if (auction.currentBidder === 'player') {
      auction.phase = 'going_once'
      auction.roundTicksLeft = AUCTION_CONFIG.ticksPerGoing
    } else {
      // NPC countered — back to bidding
      auction.phase = 'bidding'
      auction.roundTicksLeft = AUCTION_CONFIG.ticksPerRound
    }
    auction.roundsElapsed++

    return true
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
    biddingTactics.value = null
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
    biddingTactics,
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
    placeSniperBid,
    useIntimidate,
    useBluff,
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
