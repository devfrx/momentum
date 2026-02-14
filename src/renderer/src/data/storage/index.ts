/**
 * Storage Wars — Data definitions barrel export
 *
 * Central re-export point for storage auction definitions,
 * item pools, location tiers, and helper functions.
 */

export {
  STORAGE_LOCATIONS,
  getLocation,
  getUnlockedLocations,
  type StorageLocation,
  type LocationTier,
} from './locations'

export {
  ITEM_POOL,
  generateUnitContents,
  calculateTotalItemsValue,
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
  type StorageAuction,
  type AuctionStatus,
  type BidderPersonality,
  type AuctionBidder,
} from './auctions'
