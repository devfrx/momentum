/**
 * Online Shop — Economy balance constants
 *
 * Central file for all balance-critical numbers affecting the
 * online shop and personal vault systems.
 */

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
export const SHOP_BUY_MARKUP = 1.25

/** Sell-back fraction (selling to the shop gives less). */
export const SHOP_SELL_FRACTION = 0.70

/** Tax applied when selling from vault. */
export const VAULT_SELL_TAX = 0.10

// ─── Rarity Weights for Shop Generation ─────────────────────────

/** Rarity weights for the shop pool — slightly more generous than storage wars. */
export const SHOP_RARITY_WEIGHTS: Record<string, number> = {
  common: 40,
  uncommon: 25,
  rare: 16,
  epic: 10,
  legendary: 5,
  jackpot: 2.5,
  mythic: 1.0,
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
