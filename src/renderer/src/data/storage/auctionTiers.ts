/**
 * Storage Wars — Auction Tiers (Lot Quality Tiers)
 *
 * Adds a quality tier to each generated auction lot, independent from
 * location tier. This means a suburban auction CAN still roll a "premium"
 * or even "elite" tier lot — THE THRILL OF THE FIND.
 *
 * Auction tiers influence:
 *   1. Item count range (more items in higher tiers)
 *   2. Rarity weight adjustments (better odds at higher tiers)
 *   3. NPC aggression (NPCs bid harder on premium lots)
 *   4. Visual presentation (badge / glow in the UI)
 *   5. Lot event chance (higher tiers → more dramatic events)
 *
 * The tier roll is weighted: cheap locations mostly get "standard" lots,
 * but there's ALWAYS a small chance of a premium lot — and that's the
 * excitement the user wants preserved.
 */

// ─── Types ──────────────────────────────────────────────────────

/** Quality tier of an individual auction lot */
export type AuctionLotTier = 'junk' | 'standard' | 'notable' | 'premium' | 'legendary'

/** Visual + balance configuration for each lot tier */
export interface AuctionLotTierDef {
  id: AuctionLotTier
  /** i18n key: `storage.lot_tier_${id}` */
  i18nKey: string
  /** Iconify icon for the badge */
  icon: string
  /** CSS color variable for badges/glows */
  cssVar: string
  /** Multiplied onto the location's rareChance */
  rareChanceMultiplier: number
  /** Additive item count bonus [min, max] */
  extraItems: [number, number]
  /** NPC maxBid factor boost (multiplicative on top of personality) */
  npcAggressionBoost: number
  /** Lot event chance multiplier (1 = normal, 1.5 = 50% more events) */
  eventChanceMultiplier: number
  /** Rarity weight shift: shifts BASE_RARITY_WEIGHTS toward rarer. 0 = no shift. */
  rarityShift: number
}

// ─── Tier Definitions ───────────────────────────────────────────

export const AUCTION_LOT_TIERS: Record<AuctionLotTier, AuctionLotTierDef> = {
  junk: {
    id: 'junk',
    i18nKey: 'junk',
    icon: 'mdi:trash-can-outline',
    cssVar: 'var(--t-text-muted)',
    rareChanceMultiplier: 0.5,
    extraItems: [0, 0],
    npcAggressionBoost: 0.85,
    eventChanceMultiplier: 0.6,
    rarityShift: -2,
  },
  standard: {
    id: 'standard',
    i18nKey: 'standard',
    icon: 'mdi:package-variant',
    cssVar: 'var(--t-text-secondary)',
    rareChanceMultiplier: 1.0,
    extraItems: [0, 0],
    npcAggressionBoost: 1.0,
    eventChanceMultiplier: 1.0,
    rarityShift: 0,
  },
  notable: {
    id: 'notable',
    i18nKey: 'notable',
    icon: 'mdi:star-half-full',
    cssVar: 'var(--t-info)',
    rareChanceMultiplier: 1.4,
    extraItems: [0, 1],
    npcAggressionBoost: 1.1,
    eventChanceMultiplier: 1.3,
    rarityShift: 1,
  },
  premium: {
    id: 'premium',
    i18nKey: 'premium',
    icon: 'mdi:diamond-stone',
    cssVar: 'var(--t-purple)',
    rareChanceMultiplier: 2.0,
    extraItems: [1, 2],
    npcAggressionBoost: 1.25,
    eventChanceMultiplier: 1.6,
    rarityShift: 2,
  },
  legendary: {
    id: 'legendary',
    i18nKey: 'legendary',
    icon: 'mdi:crown',
    cssVar: 'var(--t-warning)',
    rareChanceMultiplier: 3.0,
    extraItems: [1, 3],
    npcAggressionBoost: 1.5,
    eventChanceMultiplier: 2.0,
    rarityShift: 4,
  },
}

// ─── Tier Roll Weights ──────────────────────────────────────────

/**
 * Weights per location tier. Cheaper locations lean heavily toward
 * standard/junk BUT always have a small % for premium/legendary —
 * preserving the thrill of the underdog find.
 */
interface TierRollWeights {
  junk: number
  standard: number
  notable: number
  premium: number
  legendary: number
}

const LOCATION_TO_LOT_WEIGHTS: Record<string, TierRollWeights> = {
  suburban:   { junk: 25, standard: 55, notable: 14, premium: 5,  legendary: 1   },
  urban:      { junk: 18, standard: 48, notable: 22, premium: 9,  legendary: 3   },
  downtown:   { junk: 12, standard: 40, notable: 28, premium: 15, legendary: 5   },
  industrial: { junk: 15, standard: 38, notable: 26, premium: 15, legendary: 6   },
  luxury:     { junk: 5,  standard: 25, notable: 35, premium: 25, legendary: 10  },
  elite:      { junk: 2,  standard: 15, notable: 30, premium: 35, legendary: 18  },
}

/** Fallback if a new location tier isn't mapped yet */
const DEFAULT_LOT_WEIGHTS: TierRollWeights = {
  junk: 20, standard: 50, notable: 20, premium: 8, legendary: 2,
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Roll a lot tier for a given auction, influenced by location tier
 * and player luck. Returns the tier definition.
 *
 * @param locationTier  The location tier key (e.g. 'suburban', 'elite')
 * @param luckBonus     Player luck bonus (shifts weights toward rarer tiers)
 */
export function rollAuctionLotTier(
  locationTier: string,
  luckBonus: number = 0,
): AuctionLotTierDef {
  const weights = { ...(LOCATION_TO_LOT_WEIGHTS[locationTier] ?? DEFAULT_LOT_WEIGHTS) }

  // Luck shifts weight away from junk/standard toward notable+
  if (luckBonus > 0) {
    const shift = luckBonus * 3 // Each 1.0 luck moves 3 weight points
    weights.junk = Math.max(1, weights.junk - shift * 1.5)
    weights.standard = Math.max(5, weights.standard - shift)
    weights.notable += shift * 0.8
    weights.premium += shift * 0.5
    weights.legendary += shift * 0.2
  }

  const tier = weightedPickTier(weights)
  return AUCTION_LOT_TIERS[tier]
}

/**
 * Get a lot tier definition by id.
 */
export function getLotTierDef(tier: AuctionLotTier): AuctionLotTierDef {
  return AUCTION_LOT_TIERS[tier]
}

/**
 * Get the ordered list of all lot tiers (worst to best).
 */
export const LOT_TIER_ORDER: AuctionLotTier[] = [
  'junk', 'standard', 'notable', 'premium', 'legendary',
]

/**
 * Apply the lot tier's rarity shift to base rarity weights.
 *
 * Positive shift → more weight to rarer tiers.
 * Negative shift → more weight to common.
 * The result is a new weights record suitable for item generation.
 */
export function applyRarityShift(
  baseWeights: Record<string, number>,
  shift: number,
): Record<string, number> {
  if (shift === 0) return { ...baseWeights }

  const RARITY_TIERS = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'jackpot', 'mythic']
  const result: Record<string, number> = {}

  for (let i = 0; i < RARITY_TIERS.length; i++) {
    const key = RARITY_TIERS[i]
    const base = baseWeights[key] ?? 0
    // Each rarity tier gets a factor: common gets reduced, mythic gets boosted
    // The index (0=common, 6=mythic) determines direction
    const tierIndex = i / (RARITY_TIERS.length - 1) // 0→1
    const factor = 1 + shift * (tierIndex - 0.35) * 0.12
    result[key] = Math.max(0.001, base * factor)
  }

  return result
}

// ─── Internal ───────────────────────────────────────────────────

function weightedPickTier(weights: TierRollWeights): AuctionLotTier {
  const entries: [AuctionLotTier, number][] = [
    ['junk', weights.junk],
    ['standard', weights.standard],
    ['notable', weights.notable],
    ['premium', weights.premium],
    ['legendary', weights.legendary],
  ]
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let roll = Math.random() * total
  for (const [tier, w] of entries) {
    roll -= w
    if (roll <= 0) return tier
  }
  return 'standard'
}
