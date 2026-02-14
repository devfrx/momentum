/**
 * Storage Wars — Data definitions barrel export
 *
 * Central re-export point for storage auction definitions,
 * item pools, location tiers, and helper functions.
 */

export {
  findLocationInPool,
  getUnlockedLocations,
  type StorageLocation,
  type LocationTier,
} from './locations'

export {
  ITEM_POOL,
  generateUnitContents,
  calculateTotalItemsValue,
  applySellTax,
  type StorageItem,
  type ItemCategory,
} from './items'

export {
  APPRAISER_DEFS,
  getAppraiser,
  type AppraiserDef,
  type AppraiserTier,
} from './appraisers'

export {
  AUCTION_CONFIG,
  generateAuction,
  generateAuctionBatch,
  calculateBidderBehavior,
  allBiddersDropped,
  type StorageAuction,
  type AuctionStatus,
  type AuctionPhase,
  type BidderPersonality,
  type AuctionBidder,
  type LotTheme,
} from './auctions'

export {
  generateLocationPool,
  generateLocation,
  regenerateTierLocations,
  TIER_ORDER,
  getTierUnlockAt,
} from './locationGen'

export {
  SELL_TAX,
  UNAPPRAISED_SELL_PENALTY,
  JUNK_OVERRIDE_CHANCE,
  DUD_UNIT_CHANCE,
  NPC_AGGRESSION_MULT,
  NPC_MIN_CEILING_FRAC,
  INVENTORY_SOFT_CAP,
  STORAGE_FEE_PER_ITEM,
} from './balance'
