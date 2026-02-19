/**
 * Online Shop — Resale Auction System
 *
 * Players can list items from vault/storage in a marketplace auction.
 * NPC bidders compete based on item rarity, value, and current demand.
 * Higher rarity and trending categories attract more aggressive bidders.
 *
 * Similar to the storage wars NPC bidder system but in reverse:
 * the player is the SELLER, NPCs are BUYERS.
 */
import { D, ZERO, mul } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'
import type { StorageItem, ItemCondition } from '../storage/items'
import { CONDITION_MULTIPLIERS } from './restoration'
import {
  AUCTION_DURATION_TICKS,
  AUCTION_NPC_BASE_CEILING,
  AUCTION_NPC_RARITY_CEILING_MULT,
  AUCTION_DEMAND_CEILING_MULT,
  AUCTION_LISTING_FEE_FRACTION,
  AUCTION_SUCCESS_FEE_FRACTION,
} from './balance'

// ─── Types ──────────────────────────────────────────────────────

export interface NpcAuctionBidder {
  name: string
  icon: string
  /** Maximum this NPC will pay (fraction of fair value). */
  maxBidFraction: number
  /** How aggressively they bid (0-1, higher = jumps more). */
  aggression: number
  /** Whether this bidder is still active in the auction. */
  active: boolean
}

export interface ResaleAuction {
  /** Unique auction ID. */
  id: string
  /** The item being auctioned. */
  item: StorageItem
  /** Where the item came from. */
  source: 'vault' | 'storage'
  /** Player's minimum acceptable price. */
  startingPrice: Decimal
  /** Optional instant sell price. */
  buyNowPrice: Decimal | null
  /** Current highest bid. */
  currentBid: Decimal
  /** Name of the current highest bidder (null = no bids). */
  currentBidder: string | null
  /** NPC bidders participating. */
  bidders: NpcAuctionBidder[]
  /** Tick when auction started. */
  startedAtTick: number
  /** Tick when auction ends. */
  endsAtTick: number
  /** Last tick when bids were processed. */
  lastBidTick: number
  /** Auction status. */
  status: 'active' | 'sold' | 'expired' | 'cancelled'
  /** Demand multiplier at time of listing (affects bidder interest). */
  demandMultiplier: number
}

// ─── NPC Bidder Pool ────────────────────────────────────────────

const NPC_BIDDER_NAMES: { name: string; icon: string }[] = [
  { name: 'AntiqueLover42', icon: 'mdi:account' },
  { name: 'VintageHunter', icon: 'mdi:magnify' },
  { name: 'CollectorPrime', icon: 'mdi:star' },
  { name: 'RareFindsShop', icon: 'mdi:store' },
  { name: 'TreasureSeeker99', icon: 'mdi:treasure-chest' },
  { name: 'LuxuryDealer', icon: 'mdi:diamond' },
  { name: 'AuctionKing', icon: 'mdi:crown' },
  { name: 'BargainHunter', icon: 'mdi:tag' },
  { name: 'MuseumCurator', icon: 'mdi:bank' },
  { name: 'PrivateCollector', icon: 'mdi:safe' },
  { name: 'FlipMaster', icon: 'mdi:swap-horizontal' },
  { name: 'eBayPro2025', icon: 'mdi:cart' },
  { name: 'InvestorX', icon: 'mdi:chart-line' },
  { name: 'AnonymousBuyer', icon: 'mdi:incognito' },
  { name: 'WealthyPatron', icon: 'mdi:cash-multiple' },
]

import { RARITY_ORDER } from '../rarity'

// ─── Auction Logic ──────────────────────────────────────────────

/**
 * Generate NPC bidders for an auction based on item characteristics.
 * Higher rarity and demand = more/richer bidders.
 */
export function generateAuctionBidders(
  item: StorageItem,
  demandMult: number,
  luckBonus: number = 0,
): NpcAuctionBidder[] {
  const rarityIdx = RARITY_ORDER[item.rarity] ?? 0

  // Number of bidders: 1-3 for common, up to 4-6 for mythic
  const baseBidders = 1 + Math.floor(rarityIdx * 0.7)
  const demandBonus = demandMult > 1.3 ? 1 : 0
  const luckBidders = luckBonus > 0.5 ? 1 : 0
  const totalBidders = Math.min(6, baseBidders + demandBonus + luckBidders)

  // Shuffle and pick from pool
  const shuffled = [...NPC_BIDDER_NAMES].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, totalBidders)

  return selected.map(npc => {
    // Max bid fraction: how much of fair value they'll pay
    const baseCeiling = AUCTION_NPC_BASE_CEILING
    const rarityCeiling = rarityIdx * AUCTION_NPC_RARITY_CEILING_MULT
    const demandCeiling = (demandMult - 1) * AUCTION_DEMAND_CEILING_MULT
    const maxBidFraction = baseCeiling + rarityCeiling + demandCeiling + luckBonus * 0.05
    // Add some random variance
    const variance = 0.85 + Math.random() * 0.3
    const finalMax = Math.max(0.3, maxBidFraction * variance)

    return {
      name: npc.name,
      icon: npc.icon,
      maxBidFraction: finalMax,
      aggression: 0.2 + Math.random() * 0.6,
      active: true,
    }
  })
}

/**
 * Calculate the listing fee for an auction.
 */
export function calculateListingFee(startingPrice: Decimal): Decimal {
  return mul(startingPrice, D(AUCTION_LISTING_FEE_FRACTION)).max(D(1))
}

/**
 * Calculate the success fee (taken from proceeds on sale).
 */
export function calculateSuccessFee(salePrice: Decimal): Decimal {
  return mul(salePrice, D(AUCTION_SUCCESS_FEE_FRACTION))
}

/**
 * Get the fair market value of an item (condition-adjusted).
 */
export function getItemFairValue(item: StorageItem): Decimal {
  const condition: ItemCondition = item.condition ?? 'good'
  const condMult = CONDITION_MULTIPLIERS[condition] ?? 1.0
  return mul(item.baseValue, D(condMult))
}

/**
 * Process one round of NPC bidding for an auction.
 * Uses a collect-then-resolve approach: all bidders decide independently
 * based on the incoming currentBid, then the highest wins the round.
 */
export function processAuctionBids(auction: ResaleAuction): ResaleAuction {
  if (auction.status !== 'active') return auction

  const fairValue = getItemFairValue(auction.item)
  let { currentBid, currentBidder } = auction

  // Minimum bid floor: at least 1 (prevents zero-bid deadlock)
  const bidBase = currentBid.gt(ZERO)
    ? currentBid
    : auction.startingPrice.gt(ZERO)
      ? auction.startingPrice
      : D(1)

  // Phase 1 — each active bidder independently decides whether to bid
  const proposals: { bidder: NpcAuctionBidder; bid: Decimal }[] = []
  const updatedBidders = auction.bidders.map(bidder => {
    if (!bidder.active) return bidder

    const maxBid = mul(fairValue, D(bidder.maxBidFraction))

    // Drop out if current bid already exceeds their max
    if (currentBid.gte(maxBid)) {
      return { ...bidder, active: false }
    }

    // Decide to bid based on aggression
    if (Math.random() > bidder.aggression * 0.7) return bidder

    // Calculate bid amount: increment by 2-8% over the incoming bid
    const increment = 0.02 + Math.random() * 0.06 * (1 + bidder.aggression)
    let newBid = mul(bidBase, D(1 + increment))

    // Don't exceed their max
    if (newBid.gt(maxBid)) newBid = maxBid

    // Only propose if it beats the incoming bid
    if (newBid.gt(currentBid)) {
      proposals.push({ bidder, bid: newBid })
    }

    return bidder
  })

  // Phase 2 — resolve: highest proposal wins
  for (const p of proposals) {
    if (p.bid.gt(currentBid)) {
      currentBid = p.bid
      currentBidder = p.bidder.name
    }
  }

  // Check for buy-now
  if (auction.buyNowPrice && currentBid.gte(auction.buyNowPrice)) {
    return {
      ...auction,
      currentBid: auction.buyNowPrice,
      currentBidder,
      bidders: updatedBidders,
      status: 'sold',
    }
  }

  return {
    ...auction,
    currentBid,
    currentBidder,
    bidders: updatedBidders,
  }
}

/**
 * Create a new resale auction.
 */
export function createResaleAuction(
  item: StorageItem,
  source: 'vault' | 'storage',
  startingPrice: Decimal,
  buyNowPrice: Decimal | null,
  currentTick: number,
  demandMultiplier: number,
  luckBonus: number = 0,
): ResaleAuction {
  return {
    id: `auction_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    item,
    source,
    startingPrice,
    buyNowPrice,
    currentBid: ZERO,
    currentBidder: null,
    bidders: generateAuctionBidders(item, demandMultiplier, luckBonus),
    startedAtTick: currentTick,
    endsAtTick: currentTick + AUCTION_DURATION_TICKS,
    lastBidTick: currentTick,
    status: 'active',
    demandMultiplier,
  }
}
