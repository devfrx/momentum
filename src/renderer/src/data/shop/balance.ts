/**
 * Online Shop — Economy balance constants
 *
 * Central file for all balance-critical numbers affecting the
 * online shop, vault, restoration, demand, and resale auction systems.
 */
import type { Rarity } from '../rarity'
import type { ItemCondition } from '../storage/items'

// ─── Shop Listing ───────────────────────────────────────────────

/** Number of items displayed per shop page. */
export const SHOP_PAGE_SIZE = 24

/** Base number of listings in the shop at any time. */
export const SHOP_LISTING_COUNT = 120

/** Ticks between shop inventory refreshes (partial). */
export const SHOP_REFRESH_TICKS = 600 // ~1 minute

/** Fraction of listings replaced each refresh cycle. */
export const SHOP_REFRESH_FRACTION = 0.15

/** Full shop restock interval in ticks. */
export const SHOP_FULL_RESTOCK_TICKS = 6000 // ~10 minutes

// ─── Pricing ────────────────────────────────────────────────────

/** Markup applied on top of base value when buying from the shop. */
export const SHOP_BUY_MARKUP = 1.15

/** Sell-back fraction (selling to the shop gives less). */
export const SHOP_SELL_FRACTION = 0.80

/** Tax applied when selling from vault. */
export const VAULT_SELL_TAX = 0.10

// ─── Rarity Weights for Shop Generation ─────────────────────────

/** Rarity weights for the shop pool — slightly more generous than storage wars. */
export const SHOP_RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 40,
  uncommon: 25,
  rare: 16,
  epic: 10,
  legendary: 5,
  jackpot: 2.5,
  mythic: 1.5,
}

/** Extra-rare "unique" item chance (one-time-only items). */
export const UNIQUE_ITEM_CHANCE = 0.005

/** Chance of a "flash sale" discount on a listing. */
export const FLASH_SALE_CHANCE = 0.08

/** Flash sale discount range [min, max]. */
export const FLASH_SALE_DISCOUNT: [number, number] = [0.15, 0.45]

// ─── Vault ──────────────────────────────────────────────────────

/** Maximum vault slots (base, can be upgraded). */
export const VAULT_BASE_CAPACITY = 50

/** Cost per extra vault slot upgrade. */
export const VAULT_SLOT_COST_BASE = 500

/** Vault slot cost growth exponent. */
export const VAULT_SLOT_COST_GROWTH = 1.15

/** How many slots each upgrade adds. */
export const VAULT_UPGRADE_SLOTS = 10

// ─── Cyclical Demand ────────────────────────────────────────────

/** Minimum ticks before a category's demand target re-rolls. */
export const DEMAND_CYCLE_MIN_TICKS = 1200 // ~2 minutes

/** Maximum ticks before a category's demand target re-rolls. */
export const DEMAND_CYCLE_MAX_TICKS = 9000 // ~15 minutes

/** Minimum demand multiplier (cold category). */
export const DEMAND_MIN_MULT = 0.6

/** Maximum demand multiplier (booming category). */
export const DEMAND_MAX_MULT = 2.0

/** Chance of a demand surge when re-rolling a category cycle. */
export const DEMAND_SURGE_CHANCE = 0.08

/** Minimum multiplier during a demand surge. */
export const DEMAND_SURGE_MULT_MIN = 1.6

/** Maximum multiplier during a demand surge. */
export const DEMAND_SURGE_MULT_MAX = 2.0

/** Lerp speed toward target demand (per tick). */
export const DEMAND_LERP_SPEED = 0.008

/** Demand multiplier threshold to be labeled "trending". */
export const DEMAND_TRENDING_THRESHOLD = 1.4

/** Demand multiplier threshold to be labeled "cold". */
export const DEMAND_COLD_THRESHOLD = 0.75

/** Ticks between demand system updates. */
export const DEMAND_TICK_INTERVAL = 10

// ─── Restoration Workshop ───────────────────────────────────────

/** Base number of restoration workshop slots. */
export const RESTORATION_SLOT_BASE = 1

/** Maximum restoration workshop slots. */
export const RESTORATION_SLOT_MAX = 8

/** Base cost for upgrading workshop slots. */
export const RESTORATION_SLOT_UPGRADE_COST_BASE = 2000

/** Cost growth exponent per slot upgrade. */
export const RESTORATION_SLOT_UPGRADE_COST_GROWTH = 50

/** Restoration cost as a fraction of item's base value (per step). */
export const RESTORATION_BASE_COST_FRACTION = 0.06

/** Base ticks per restoration step (common items). */
export const RESTORATION_BASE_TICKS = 300 // ~30 seconds

/** Rarity multiplier on restoration cost (exponential per rarity tier). */
export const RESTORATION_RARITY_COST_MULT = 1.15

/** Rarity multiplier on restoration time (exponential per rarity tier). */
export const RESTORATION_RARITY_TIME_MULT = 1.2

// ─── Resale Auction ─────────────────────────────────────────────

/** Duration of a resale auction in ticks. */
export const AUCTION_DURATION_TICKS = 1200 // ~2 minutes

/** Maximum number of concurrent auctions. */
export const AUCTION_MAX_ACTIVE = 3

/** Ticks between NPC bid rounds. */
export const AUCTION_NPC_BID_INTERVAL = 30 // ~3 seconds

/** Base NPC ceiling as fraction of fair value. */
export const AUCTION_NPC_BASE_CEILING = 0.72

/** Additional ceiling per rarity tier. */
export const AUCTION_NPC_RARITY_CEILING_MULT = 0.08

/** Additional ceiling from demand multiplier. */
export const AUCTION_DEMAND_CEILING_MULT = 0.25

/** Listing fee as fraction of starting price. */
export const AUCTION_LISTING_FEE_FRACTION = 0.02

/** Success fee as fraction of sale proceeds. */
export const AUCTION_SUCCESS_FEE_FRACTION = 0.05

// ─── Item Condition (Shop-specific weights) ─────────────────────

/** Condition weights for shop item generation.
 *  Slightly more damaged items → creates restoration opportunities. */
export const SHOP_CONDITION_WEIGHTS: Record<ItemCondition, number> = {
  damaged: 15,
  poor: 20,
  fair: 22,
  good: 22,
  excellent: 12,
  mint: 6,
  pristine: 3,
}
