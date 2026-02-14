/**
 * Storage Wars — Auction generation and bidder AI (v2)
 *
 * Complete auction lifecycle with "going once / going twice / sold!"
 * mechanic, personality-driven NPC AI, lot themes, and procedural variety.
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'
import { type StorageLocation } from './locations'
import { generateUnitContents, type StorageItem } from './items'
import {
  NPC_AGGRESSION_MULT,
  NPC_MIN_CEILING_FRAC,
  NPC_DROPOUT_DAMPENER,
} from './balance'

// ─── Types ──────────────────────────────────────────────────────

export type AuctionStatus = 'available' | 'active' | 'won' | 'lost' | 'expired'

/** Phase within an active auction */
export type AuctionPhase = 'bidding' | 'going_once' | 'going_twice' | 'final_call'

export type BidderPersonality =
  | 'cautious' | 'aggressive' | 'unpredictable'
  | 'shark' | 'newbie' | 'bluffer'

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
  /** Number of bids this NPC has placed */
  bidCount: number
}

export interface StorageAuction {
  id: string
  locationId: string
  /** Items inside (hidden until won) */
  items: StorageItem[]
  /** Vague clues about contents */
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
  /** Ticks remaining in current phase */
  roundTicksLeft: number
  /** Total bidding rounds elapsed */
  roundsElapsed: number
  /** Auction status */
  status: AuctionStatus
  /** Current phase within active auction */
  phase: AuctionPhase
  /** Total value of items (hidden) */
  hiddenTotalValue: Decimal
  /** Lot theme id */
  lotTheme: string
}

export interface AuctionConfig {
  /** Time between new auction batches (in ticks) */
  refreshTicks: number
  /** Min auctions available at any time */
  minAuctions: number
  /** Max auctions available at any time */
  maxAuctions: number
  /** Ticks per normal bidding round */
  ticksPerRound: number
  /** Ticks per going-once / going-twice / final-call phase */
  ticksPerGoing: number
  /** Max bidding rounds before forced close */
  maxRounds: number
}

export const AUCTION_CONFIG: AuctionConfig = {
  refreshTicks: 300,    // 30s between refreshes
  minAuctions: 2,
  maxAuctions: 5,
  ticksPerRound: 30,    // 3s per bidding round
  ticksPerGoing: 15,    // 1.5s per going phase
  maxRounds: 10,        // cap at 10 rounds
}

const BIDDER_NAMES = [
  'Dave the Digger', 'Rosie Reseller', 'Big Tony', 'Scrap Yard Sam',
  'Bargain Betty', 'Gold Rush Gary', 'Silent Mike', 'Auntie Auction',
  'Flip-it Frank', 'Lucky Linda', 'Hammer Hans', 'Cash Carol',
  'Junkyard Joe', 'Treasure Tina', 'Bold Barry', 'Sneaky Steve',
  'Eagle Eye Emma', 'Quick-Bid Quinn',
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

// ─── Lot Themes ─────────────────────────────────────────────────

export interface LotTheme {
  id: string
  /** Peek hint revealing the theme flavor */
  hint: string
  /** Categories boosted for this theme */
  boostedCategories: string[]
  /** Weight multiplier for boosted categories */
  categoryBoost: number
}

const LOT_THEMES: LotTheme[] = [
  { id: 'musician', hint: 'This looks like it belonged to a musician...', boostedCategories: ['instruments', 'electronics', 'collectibles'], categoryBoost: 3 },
  { id: 'artist', hint: 'Paint-stained tarps cover the contents...', boostedCategories: ['art', 'collectibles', 'antiques'], categoryBoost: 3 },
  { id: 'collector', hint: 'Neatly labeled boxes fill the space...', boostedCategories: ['collectibles', 'antiques', 'documents'], categoryBoost: 3 },
  { id: 'athlete', hint: 'Sports memorabilia is visible near the entrance...', boostedCategories: ['sports', 'clothing', 'collectibles'], categoryBoost: 3 },
  { id: 'craftsman', hint: 'Heavy equipment fills the back of the unit...', boostedCategories: ['tools', 'vehicles', 'electronics'], categoryBoost: 3 },
  { id: 'fashionista', hint: 'Garment bags and shoe boxes line the walls...', boostedCategories: ['clothing', 'jewelry', 'art'], categoryBoost: 3 },
  { id: 'wealthy', hint: 'Everything screams luxury and high-end brands...', boostedCategories: ['jewelry', 'art', 'antiques', 'clothing'], categoryBoost: 2.5 },
  { id: 'hoarder', hint: 'Absolute chaos — boxes everywhere, who knows what\'s in here!', boostedCategories: ['junk', 'electronics', 'documents', 'furniture'], categoryBoost: 1.5 },
  { id: 'random', hint: '', boostedCategories: [], categoryBoost: 1 },
]

// ─── Personality Configuration ──────────────────────────────────

interface PersonalityConfig {
  /** Factor range applied to hiddenValue for maxBid [min, max] */
  maxBidFactor: [number, number]
  /** Budget % threshold where dropout becomes very likely */
  dropoutThreshold: number
  /** Base per-round dropout probability */
  baseDropout: number
  /** Extra dropout probability per elapsed round */
  roundDropout: number
  /** Bid increment multiplier range [min, max] above minimum */
  bidJump: [number, number]
  /** Rounds to skip before first bid (patience) */
  skipRounds: number
}

const PERSONALITY_CONFIG: Record<BidderPersonality, PersonalityConfig> = {
  cautious: {
    maxBidFactor: [0.3, 0.6],
    dropoutThreshold: 0.5,
    baseDropout: 0.15,
    roundDropout: 0.1,
    bidJump: [1, 1.5],
    skipRounds: 0,
  },
  aggressive: {
    maxBidFactor: [0.7, 1.1],
    dropoutThreshold: 0.85,
    baseDropout: 0.02,
    roundDropout: 0.03,
    bidJump: [1, 3],
    skipRounds: 0,
  },
  unpredictable: {
    maxBidFactor: [0.2, 1.2],
    dropoutThreshold: 0.6,
    baseDropout: 0.1,
    roundDropout: 0.05,
    bidJump: [1, 6],
    skipRounds: 0,
  },
  shark: {
    maxBidFactor: [0.8, 1.2],
    dropoutThreshold: 0.9,
    baseDropout: 0.01,
    roundDropout: 0.02,
    bidJump: [1.5, 3],
    skipRounds: 3,
  },
  newbie: {
    maxBidFactor: [0.15, 0.35],
    dropoutThreshold: 0.3,
    baseDropout: 0.25,
    roundDropout: 0.15,
    bidJump: [1, 1],
    skipRounds: 0,
  },
  bluffer: {
    maxBidFactor: [0.3, 0.55],
    dropoutThreshold: 0.45,
    baseDropout: 0.05,
    roundDropout: 0.2,
    bidJump: [2, 5],
    skipRounds: 0,
  },
}

// ─── Helpers ────────────────────────────────────────────────────

function pickLotTheme(): LotTheme {
  // 40% themed, 60% random
  if (Math.random() < 0.4) {
    const themed = LOT_THEMES.filter(t => t.id !== 'random')
    return themed[Math.floor(Math.random() * themed.length)]
  }
  return LOT_THEMES.find(t => t.id === 'random')!
}

/**
 * Check whether every NPC bidder has dropped out.
 */
export function allBiddersDropped(bidders: AuctionBidder[]): boolean {
  return bidders.every(b => b.droppedOut)
}

// ─── Auction Generation ─────────────────────────────────────────

/**
 * Generate a single auction with hidden items and NPC bidders.
 */
export function generateAuction(
  location: StorageLocation,
  tick: number,
  luckBonus: number = 0,
): StorageAuction {
  const theme = pickLotTheme()

  // Generate hidden items with theme category bias
  const items = generateUnitContents(
    location.minItems,
    location.maxItems,
    location.valueMultiplier,
    location.rareChance,
    luckBonus,
    theme.boostedCategories,
    theme.categoryBoost,
  )

  // Hidden total value
  let hiddenTotal = D(0)
  for (const item of items) {
    hiddenTotal = hiddenTotal.add(item.baseValue)
  }

  // Build peek hints: theme hint first, then category-based
  const hints: string[] = []
  if (theme.id !== 'random' && theme.hint) {
    hints.push(theme.hint)
  }
  const categories = [...new Set(items.map(i => i.category))]
  for (const cat of categories.slice(0, 2)) {
    const catHints = PEEK_HINTS[cat]
    if (catHints) hints.push(catHints[Math.floor(Math.random() * catHints.length)])
  }
  if (hints.length === 0) hints.push('The unit is dark. Hard to tell what\'s inside.')

  // Generate NPC bidders with diverse personalities
  const bidderCount = 1 + Math.floor(Math.random() * location.maxBidders)
  const usedNames = new Set<string>()
  const bidders: AuctionBidder[] = []
  const personalities: BidderPersonality[] = [
    'cautious', 'aggressive', 'unpredictable', 'shark', 'newbie', 'bluffer',
  ]

  for (let i = 0; i < bidderCount; i++) {
    let name: string
    do {
      name = BIDDER_NAMES[Math.floor(Math.random() * BIDDER_NAMES.length)]
    } while (usedNames.has(name))
    usedNames.add(name)

    const personality = personalities[Math.floor(Math.random() * personalities.length)]
    const cfg = PERSONALITY_CONFIG[personality]
    const adjMin = cfg.maxBidFactor[0] * NPC_AGGRESSION_MULT
    const adjMax = cfg.maxBidFactor[1] * NPC_AGGRESSION_MULT
    const factor = adjMin + Math.random() * (adjMax - adjMin)
    const maxBid = hiddenTotal.mul(factor).max(location.minBid.mul(1.5))

    bidders.push({
      id: `bidder_${i}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      personality,
      maxBid,
      currentBid: D(0),
      droppedOut: false,
      avatar: BIDDER_AVATARS[Math.floor(Math.random() * BIDDER_AVATARS.length)],
      bidCount: 0,
    })
  }

  // Ensure at least one NPC has a meaningful ceiling (prevents free units)
  const maxNpcBid = bidders.reduce((m, b) => b.maxBid.gt(m) ? b.maxBid : m, D(0))
  const minCeiling = hiddenTotal.mul(NPC_MIN_CEILING_FRAC)
  if (maxNpcBid.lt(minCeiling) && bidders.length > 0) {
    // Boost the strongest bidder
    const strongest = bidders.reduce((best, b) => b.maxBid.gt(best.maxBid) ? b : best, bidders[0])
    strongest.maxBid = minCeiling
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
    phase: 'bidding',
    hiddenTotalValue: hiddenTotal,
    lotTheme: theme.id,
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

// ─── NPC Bidding AI ─────────────────────────────────────────────

/**
 * Determine an NPC's bid for the current round.
 * Returns the bid amount, or null if the NPC drops out.
 */
export function calculateBidderBehavior(
  bidder: AuctionBidder,
  currentBid: Decimal,
  bidIncrement: Decimal,
  roundsElapsed: number,
): Decimal | null {
  if (bidder.droppedOut) return null

  const cfg = PERSONALITY_CONFIG[bidder.personality]
  const nextMinBid = currentBid.add(bidIncrement)

  // Hard cap — can't exceed personal maximum
  if (nextMinBid.gt(bidder.maxBid)) return null

  // Budget usage ratio (0 → 1)
  const budgetUsed = bidder.maxBid.gt(0)
    ? currentBid.div(bidder.maxBid).toNumber()
    : 1

  // Patient personalities (shark) skip early rounds
  if (roundsElapsed < cfg.skipRounds && Math.random() < 0.7) return null

  // Hard dropout when budget is nearly exhausted
  if (budgetUsed >= cfg.dropoutThreshold) {
    if (Math.random() < 0.8) return null
  }

  // Soft per-round dropout probability (dampened by balance constant)
  const dropProb = (cfg.baseDropout + roundsElapsed * cfg.roundDropout) * NPC_DROPOUT_DAMPENER
  if (Math.random() < dropProb) return null

  // Calculate bid amount
  const jumpRange = cfg.bidJump[1] - cfg.bidJump[0]
  const jump = cfg.bidJump[0] + Math.random() * jumpRange
  const desiredBid = nextMinBid.add(bidIncrement.mul(jump - 1))

  bidder.bidCount++
  return desiredBid.min(bidder.maxBid)
}
