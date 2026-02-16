/**
 * Storage Wars — Economy balance constants
 *
 * Central file for all balance-critical numbers. Tweak values here
 * to adjust difficulty and profitability of the storage auction loop.
 *
 * Design goal: the average player should lose money on ~40-50% of auctions.
 * Skilled play (reading hints, choosing appraisers, timing bids) should
 * yield a modest long-term profit, not guaranteed wins.
 */

// ─── Sell / Market Friction ─────────────────────────────────────

/** Fraction deducted from every sale as a market fee (0.20 = 20%). */
export const SELL_TAX = 0.20

/** Additional tax applied to un-appraised items selling at base value. */
export const UNAPPRAISED_SELL_PENALTY = 0.15

// ─── Item Generation ────────────────────────────────────────────

/**
 * Before normal rarity roll, there is this chance to force-pick a junk item instead.
 * Prevents units from being consistently high-value.
 */
export const JUNK_OVERRIDE_CHANCE = 0.28

/**
 * Chance that an entire unit is a "dud" — filled mostly with junk.
 * Dud units override rarity weights to heavily favour common/junk.
 * Dud means a unit with very low total value, often containing no rare items at all.
 * This adds risk to every auction and prevents players from consistently profiting by only going for high-rarity items.
 */
export const DUD_UNIT_CHANCE = 0.18

/** Rarity weight overrides for dud units. */
export const DUD_RARITY_WEIGHTS: Record<string, number> = {
  common: 75,
  uncommon: 18,
  rare: 5,
  epic: 1.5,
  legendary: 0.4,
  jackpot: 0.05,
  mythic: 0.01,
}

/** Standard rarity weights (replacing old hardcoded ones in items.ts). */
export const BASE_RARITY_WEIGHTS: Record<string, number> = {
  common: 48,
  uncommon: 24,
  rare: 14,
  epic: 8,
  legendary: 4,
  jackpot: 1.2,
  mythic: 0.3,
}

// ─── Condition Distribution ─────────────────────────────────────

/**
 * Condition weight overrides — shift toward worn/damaged.
 * (id → weight)
 */
export const CONDITION_WEIGHTS: Record<string, number> = {
  damaged: 12,
  poor: 18,
  fair: 25,
  good: 26,
  excellent: 12,
  mint: 4,
  pristine: 2,
}

/** Cap on pristine condition multiplier. */
export const PRISTINE_VALUE_CAP = 1.7

// ─── NPC Bidder Tuning ──────────────────────────────────────────

/**
 * Global multiplier applied to every NPC's maxBidFactor range.
 * Values > 1.0 make NPCs bid closer to (or above) item true value.
 */
export const NPC_AGGRESSION_MULT = 1.35

/**
 * Minimum fraction of hiddenTotalValue that at least one NPC will
 * be willing to bid up to. Prevents "free" units.
 */
export const NPC_MIN_CEILING_FRAC = 0.55

/**
 * Reduce per-round dropout probability by this factor.
 * Lower = NPCs stay in the auction longer.
 */
export const NPC_DROPOUT_DAMPENER = 0.65

// ─── Inventory / Storage Fees ───────────────────────────────────

/** Soft cap on inventory size before storage fees apply. */
export const INVENTORY_SOFT_CAP = 25

/** Per-item fee charged each auction refresh cycle when over soft cap. */
export const STORAGE_FEE_PER_ITEM = 3

// ─── Location Generation ────────────────────────────────────────

/**
 * How many locations to generate per unlocked tier.
 * Randomized between [min, max].
 */
export const LOCATIONS_PER_TIER: [number, number] = [1, 2]

/** Ticks between location pool reshuffles. */
export const LOCATION_RESHUFFLE_TICKS = 3000 // ~5 min
