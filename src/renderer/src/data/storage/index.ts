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
  generateUnitContents,
  generateItem,
  calculateTotalItemsValue,
  applySellTax,
  resolveItemName,
  resolveItemDescription,
  decodeItemParts,
  type StorageItem,
  type ItemCategory,
  type ItemCondition,
  type GeneratedItemParts,
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

export {
  // Constants
  INTIMIDATE_MAX_USES,
  BLUFF_MAX_USES,
  SNIPER_MAX_USES,
  SNIPER_PREMIUM,
  TACTIC_MIN_ROUND,
  TACTIC_COOLDOWN_ROUNDS,
  SNIPER_RESPONSE_FRACTION,
  // Types
  type BiddingTactics,
  type TacticLogEntry,
  type TacticReaction,
  type NpcTell,
  type TellMood,
  type IntimidateResult,
  type BluffResult,
  type IntimidateEffect,
  type BluffEffect,
  // Functions
  createBiddingTactics,
  resolveIntimidate,
  resolveBluff,
  canSniperBid,
  calcSniperBidAmount,
  getNpcTell,
  canUseTactic,
} from './biddingTactics'

export {
  // Types
  type LotEventTiming,
  type LotEventEffectType,
  type LotEventMood,
  type LotEventEffect,
  type LotEventDef,
  type ActiveLotEvent,
  // Constants
  LOT_EVENT_DEFS,
  // Functions
  rollLotEvents,
  getRevealEvents,
  getBidEvents,
  getWinEvents,
  hasUnappliedEvent,
} from './lotEvents'

export {
  // Types
  type AuctionLotTier,
  type AuctionLotTierDef,
  // Constants
  AUCTION_LOT_TIERS,
  LOT_TIER_ORDER,
  // Functions
  rollAuctionLotTier,
  getLotTierDef,
  applyRarityShift,
} from './auctionTiers'
