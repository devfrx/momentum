/**
 * Storage Wars — Auction generation and bidder AI
 *
 * Generates auction events with NPC bidders who compete against the player.
 * Bidder behavior is personality-driven with escalation mechanics.
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'
import { type StorageLocation } from './locations'
import { generateUnitContents, type StorageItem } from './items'

export type AuctionStatus = 'available' | 'active' | 'won' | 'lost' | 'expired'
export type BidderPersonality = 'cautious' | 'aggressive' | 'unpredictable' | 'shark' | 'newbie'

export interface AuctionBidder {
  id: string
  name: string
  personality: BidderPersonality
  /** Max the NPC is willing to pay */
  maxBid: Decimal
  /** Current NPC bid */
  currentBid: Decimal
  /** Whether NPC has dropped out */
  droppedOut: boolean
  avatar: string
}

export interface StorageAuction {
  id: string
  locationId: string
  /** Items inside (hidden until won) */
  items: StorageItem[]
  /** The peek hints (vague clues about what's inside) */
  peekHints: string[]
  /** NPC bidders */
  bidders: AuctionBidder[]
  /** Current highest bid */
  currentBid: Decimal
  /** Who holds the current bid ('player' or bidder id) */
  currentBidder: string
  /** Minimum next bid increment */
  bidIncrement: Decimal
  /** Tick when auction became available */
  availableAtTick: number
  /** Ticks remaining to bid (countdown per round) */
  roundTicksLeft: number
  /** Total bidding rounds elapsed */
  roundsElapsed: number
  /** Auction status */
  status: AuctionStatus
  /** Total value of items (hidden, for internal calculations) */
  hiddenTotalValue: Decimal
}

export interface AuctionConfig {
  /** Time between new auction batches (in ticks) */
  refreshTicks: number
  /** Min auctions available at any time */
  minAuctions: number
  /** Max auctions available at any time */
  maxAuctions: number
  /** Ticks per bidding round */
  ticksPerRound: number
  /** Max rounds before auction closes */
  maxRounds: number
}

export const AUCTION_CONFIG: AuctionConfig = {
  refreshTicks: 300, // 30 seconds at 10 ticks/sec
  minAuctions: 2,
  maxAuctions: 5,
  ticksPerRound: 50, // 5 seconds per round
  maxRounds: 15,
}

const BIDDER_NAMES = [
  'Dave the Digger', 'Rosie Reseller', 'Big Tony', 'Scrap Yard Sam',
  'Bargain Betty', 'Gold Rush Gary', 'Silent Mike', 'Auntie Auction',
  'Flip-it Frank', 'Lucky Linda', 'Hammer Hans', 'Cash Carol',
  'Junkyard Joe', 'Treasure Tina', 'Bold Barry',
]

const BIDDER_AVATARS = [
  'mdi:account-cowboy-hat', 'mdi:account-hard-hat', 'mdi:account-tie',
  'mdi:account-supervisor', 'mdi:account-star', 'mdi:account-cash',
  'mdi:account-search', 'mdi:account-heart', 'mdi:account-wrench',
]

/** Peek hint templates based on item categories present */
const PEEK_HINTS: Record<string, string[]> = {
  furniture: ['You spot some furniture shapes under sheets.', 'Looks like there\'s a large piece of furniture.'],
  electronics: ['You see some cables and screens.', 'Electronic devices are visible.'],
  clothing: ['Bags of clothes are piled up.', 'You notice hanging garments.'],
  tools: ['Metal tools glint in the light.', 'A workbench is visible.'],
  collectibles: ['Small boxes and binders are stacked.', 'You see sealed containers.'],
  art: ['Canvases lean against the wall.', 'Frames are visible.'],
  jewelry: ['Small locked boxes catch your eye.', 'A jewelry case peeks out.'],
  antiques: ['Something old and ornate is visible.', 'Aged items fill the space.'],
  sports: ['Sports equipment is spotted.', 'Balls and gear are visible.'],
  instruments: ['A musical instrument case stands out.', 'You hear nothing, but see cases.'],
  vehicles: ['Vehicle parts or wheels are visible.', 'Something with wheels is inside.'],
  documents: ['Boxes of papers and files.', 'Envelopes and binders are stacked.'],
  junk: ['Mostly looks like junk.', 'Nothing stands out at first glance.'],
}

/**
 * Generate a single auction with hidden items and NPC bidders.
 */
export function generateAuction(
  location: StorageLocation,
  tick: number,
  luckBonus: number = 0,
): StorageAuction {
  // Generate hidden items
  const items = generateUnitContents(
    location.minItems,
    location.maxItems,
    location.valueMultiplier,
    location.rareChance,
    luckBonus,
  )

  // Calculate hidden total value
  let hiddenTotal = D(0)
  for (const item of items) {
    hiddenTotal = hiddenTotal.add(item.baseValue)
  }

  // Generate peek hints (2–4 hints based on item categories)
  const categories = [...new Set(items.map(i => i.category))]
  const hints: string[] = []
  for (const cat of categories.slice(0, 3)) {
    const catHints = PEEK_HINTS[cat]
    if (catHints) {
      hints.push(catHints[Math.floor(Math.random() * catHints.length)])
    }
  }
  if (hints.length === 0) hints.push('The unit is dark. Hard to tell what\'s inside.')

  // Generate NPC bidders
  const bidderCount = 1 + Math.floor(Math.random() * location.maxBidders)
  const usedNames = new Set<string>()
  const bidders: AuctionBidder[] = []

  for (let i = 0; i < bidderCount; i++) {
    let name: string
    do {
      name = BIDDER_NAMES[Math.floor(Math.random() * BIDDER_NAMES.length)]
    } while (usedNames.has(name))
    usedNames.add(name)

    const personalities: BidderPersonality[] = ['cautious', 'aggressive', 'unpredictable', 'shark', 'newbie']
    const personality = personalities[Math.floor(Math.random() * personalities.length)]

    // NPC max bid is proportional to hidden value with personality factor
    const personalityFactor = getPersonalityMaxBidFactor(personality)
    const maxBid = hiddenTotal.mul(personalityFactor * (0.5 + Math.random() * 0.8))

    bidders.push({
      id: `bidder_${i}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      personality,
      maxBid,
      currentBid: D(0),
      droppedOut: false,
      avatar: BIDDER_AVATARS[Math.floor(Math.random() * BIDDER_AVATARS.length)],
    })
  }

  const bidIncrement = location.minBid.mul(0.1).max(D(5))

  return {
    id: `auction_${tick}_${Math.random().toString(36).slice(2, 8)}`,
    locationId: location.id,
    items,
    peekHints: hints,
    bidders,
    currentBid: location.minBid,
    currentBidder: '',
    bidIncrement,
    availableAtTick: tick,
    roundTicksLeft: AUCTION_CONFIG.ticksPerRound,
    roundsElapsed: 0,
    status: 'available',
    hiddenTotalValue: hiddenTotal,
  }
}

/**
 * Generate a batch of auctions for the current locations.
 */
export function generateAuctionBatch(
  locations: StorageLocation[],
  tick: number,
  luckBonus: number = 0,
): StorageAuction[] {
  const auctions: StorageAuction[] = []
  for (const loc of locations) {
    const count = 1 + Math.floor(Math.random() * 2) // 1–2 per location
    for (let i = 0; i < count; i++) {
      auctions.push(generateAuction(loc, tick, luckBonus))
    }
  }
  // Cap total
  return auctions.slice(0, AUCTION_CONFIG.maxAuctions)
}

function getPersonalityMaxBidFactor(personality: BidderPersonality): number {
  switch (personality) {
    case 'cautious': return 0.4
    case 'aggressive': return 0.9
    case 'unpredictable': return 0.3 + Math.random() * 0.8
    case 'shark': return 1.1
    case 'newbie': return 0.25
    default: return 0.5
  }
}

/**
 * Calculate NPC bidding behavior for a round.
 * Returns the new bid amount (or null if the NPC drops out).
 */
export function calculateBidderBehavior(
  bidder: AuctionBidder,
  currentBid: Decimal,
  bidIncrement: Decimal,
  roundsElapsed: number,
): Decimal | null {
  if (bidder.droppedOut) return null

  const nextBid = currentBid.add(bidIncrement)
  if (nextBid.gt(bidder.maxBid)) return null

  // Personality-based escalation
  switch (bidder.personality) {
    case 'cautious':
      // Bids conservatively, drops out early
      if (Math.random() < 0.3 + roundsElapsed * 0.05) return null
      return nextBid
    case 'aggressive':
      // Bids higher than minimum, rarely drops
      if (Math.random() < 0.05 + roundsElapsed * 0.02) return null
      return nextBid.add(bidIncrement.mul(Math.random() * 2))
          .min(bidder.maxBid)
    case 'unpredictable':
      // Random jumps or sudden drops
      if (Math.random() < 0.2) return null
      if (Math.random() < 0.3) {
        return nextBid.add(bidIncrement.mul(1 + Math.random() * 5))
            .min(bidder.maxBid)
      }
      return nextBid
    case 'shark':
      // Patient, bids at the last moment, goes high
      if (roundsElapsed < 3 && Math.random() < 0.6) return null
      return nextBid.add(bidIncrement.mul(Math.random() * 3))
          .min(bidder.maxBid)
    case 'newbie':
      // Hesitant, often drops
      if (Math.random() < 0.4) return null
      return nextBid
    default:
      return nextBid
  }
}
