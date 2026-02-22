/**
 * Storage Wars — Procedural Item Blueprints
 *
 * Instead of a fixed pool of 62 static templates, items are assembled
 * combinatorially from **category blueprints**. Each blueprint defines:
 *   - base names     (the core noun: "Ring", "Chair", "Painting" …)
 *   - material/era prefixes  ("Victorian", "Gold-plated", "1960s" …)
 *   - detail suffixes       ("with emerald inlay", "signed by artist" …)
 *   - icons per base name
 *   - rarity ↔ value curves (no more min/max per template)
 *
 * The generator picks one entry from each pool, producing thousands of
 * unique combinations per category while keeping game-balanced values.
 *
 * All user-facing strings are i18n keys resolved at render time.
 * The key format is `items.<pool>.<index>` — e.g. `items.base.jewelry.0`.
 */
import type { ItemCategory } from './items'
import type { Rarity } from '../rarity'

// ─── Types ──────────────────────────────────────────────────────

/** A single base-name entry within a category blueprint. */
export interface BaseName {
  /** i18n key fragment — resolved as `items.base.<category>.<index>` */
  key: string
  /** MDI icon */
  icon: string
  /** Weight in grams (sell speed). */
  weight: number
  /** Relative drop chance (higher = more common). */
  dropWeight: number
}

/** A prefix (material / era / style) that modifies value. */
export interface NamePrefix {
  /** i18n key fragment — resolved as `items.prefix.<index>` */
  key: string
  /** Multiplicative factor applied to base value (1.0 = neutral). */
  valueMult: number
  /** Minimum rarity tier required to roll this prefix. */
  minRarity: Rarity
  /** Relative selection weight (among eligible prefixes). */
  weight: number
}

/** A detail suffix (provenance, special trait). */
export interface NameSuffix {
  /** i18n key fragment — resolved as `items.suffix.<index>` */
  key: string
  /** Additive bonus multiplier (e.g. 0.15 = +15% value). */
  valueBonus: number
  /** Minimum rarity tier that unlocks this suffix. */
  minRarity: Rarity
  /** Relative selection weight. */
  weight: number
}

/**
 * Rarity-based value curve for a category.
 * Value = random(min, max) × prefixMult × (1 + suffixBonus) × conditionMult × locationMult
 */
export interface RarityValueRange {
  min: number
  max: number
}

/** Full blueprint for one item category. */
export interface CategoryBlueprint {
  category: ItemCategory
  /** Base names available for this category. */
  baseNames: BaseName[]
  /** Rarity → value range mapping. */
  valueCurves: Record<string, RarityValueRange>
  /**
   * Optional per-category description i18n key.
   * Resolved as `items.desc.<category>.<baseIndex>`.
   * A fallback generic description is used when absent.
   */
  hasDescriptions: boolean
}

// ─── Shared Prefix Pool ─────────────────────────────────────────
// (used across all categories — filtered by minRarity at generation time)

export const NAME_PREFIXES: NamePrefix[] = [
  // ── Era / Age ──
  { key: '0',  valueMult: 0.85, minRarity: 'common',    weight: 12 },   // Old
  { key: '1',  valueMult: 1.10, minRarity: 'common',    weight: 10 },   // Vintage
  { key: '2',  valueMult: 1.25, minRarity: 'uncommon',  weight: 8 },    // Antique
  { key: '3',  valueMult: 1.15, minRarity: 'common',    weight: 9 },    // Retro
  { key: '4',  valueMult: 1.40, minRarity: 'rare',      weight: 5 },    // Victorian
  { key: '5',  valueMult: 1.05, minRarity: 'common',    weight: 10 },   // Classic
  { key: '6',  valueMult: 1.20, minRarity: 'uncommon',  weight: 7 },    // Mid-Century
  // ── Material / Quality ──
  { key: '7',  valueMult: 0.70, minRarity: 'common',    weight: 14 },   // Rusty
  { key: '8',  valueMult: 1.50, minRarity: 'rare',      weight: 4 },    // Gold-plated
  { key: '9',  valueMult: 1.35, minRarity: 'uncommon',  weight: 5 },    // Silver
  { key: '10', valueMult: 1.60, minRarity: 'epic',      weight: 3 },    // Hand-crafted
  { key: '11', valueMult: 0.90, minRarity: 'common',    weight: 11 },   // Used
  { key: '12', valueMult: 1.00, minRarity: 'common',    weight: 13 },   // Standard
  { key: '13', valueMult: 1.30, minRarity: 'uncommon',  weight: 6 },    // Premium
  { key: '14', valueMult: 1.70, minRarity: 'epic',      weight: 3 },    // Artisan
  // ── Style ──
  { key: '15', valueMult: 1.20, minRarity: 'uncommon',  weight: 6 },    // Ornate
  { key: '16', valueMult: 1.10, minRarity: 'common',    weight: 8 },    // Elegant
  { key: '17', valueMult: 0.80, minRarity: 'common',    weight: 12 },   // Worn
  { key: '18', valueMult: 1.45, minRarity: 'rare',      weight: 4 },    // Engraved
  { key: '19', valueMult: 1.55, minRarity: 'rare',      weight: 3 },    // Gilded
  // ── Provenance ──
  { key: '20', valueMult: 1.80, minRarity: 'legendary', weight: 2 },    // Royal
  { key: '21', valueMult: 1.90, minRarity: 'legendary', weight: 2 },    // Imperial
  { key: '22', valueMult: 2.00, minRarity: 'mythic',    weight: 1 },    // Legendary
  { key: '23', valueMult: 1.15, minRarity: 'uncommon',  weight: 7 },    // Restored
  { key: '24', valueMult: 1.65, minRarity: 'epic',      weight: 3 },    // Museum-quality
  // ── Era / Age (expanded) ──
  { key: '25', valueMult: 1.30, minRarity: 'uncommon',  weight: 7 },    // Edwardian
  { key: '26', valueMult: 1.35, minRarity: 'rare',      weight: 5 },    // Art Deco
  { key: '27', valueMult: 1.25, minRarity: 'uncommon',  weight: 6 },    // Art Nouveau
  { key: '28', valueMult: 1.45, minRarity: 'rare',      weight: 4 },    // Renaissance
  { key: '29', valueMult: 1.50, minRarity: 'rare',      weight: 4 },    // Medieval
  { key: '30', valueMult: 1.20, minRarity: 'uncommon',  weight: 7 },    // Georgian
  { key: '31', valueMult: 1.15, minRarity: 'common',    weight: 9 },    // Post-War
  { key: '32', valueMult: 1.10, minRarity: 'common',    weight: 9 },    // 1950s
  { key: '33', valueMult: 1.12, minRarity: 'common',    weight: 9 },    // 1960s
  { key: '34', valueMult: 1.08, minRarity: 'common',    weight: 10 },   // 1970s
  { key: '35', valueMult: 1.05, minRarity: 'common',    weight: 10 },   // 1980s
  { key: '36', valueMult: 0.95, minRarity: 'common',    weight: 11 },   // 1990s
  { key: '37', valueMult: 1.55, minRarity: 'rare',      weight: 4 },    // Baroque
  { key: '38', valueMult: 1.40, minRarity: 'rare',      weight: 5 },    // Colonial
  { key: '39', valueMult: 1.60, minRarity: 'epic',      weight: 3 },    // Ancient
  { key: '40', valueMult: 1.35, minRarity: 'rare',      weight: 5 },    // Pre-War
  { key: '41', valueMult: 1.50, minRarity: 'rare',      weight: 4 },    // Belle Époque
  // ── Material / Quality (expanded) ──
  { key: '42', valueMult: 1.55, minRarity: 'rare',      weight: 4 },    // Platinum
  { key: '43', valueMult: 1.40, minRarity: 'rare',      weight: 5 },    // Bronze
  { key: '44', valueMult: 1.25, minRarity: 'uncommon',  weight: 6 },    // Copper
  { key: '45', valueMult: 1.30, minRarity: 'uncommon',  weight: 6 },    // Mahogany
  { key: '46', valueMult: 1.35, minRarity: 'uncommon',  weight: 5 },    // Walnut
  { key: '47', valueMult: 1.45, minRarity: 'rare',      weight: 4 },    // Rosewood
  { key: '48', valueMult: 1.50, minRarity: 'rare',      weight: 4 },    // Ivory
  { key: '49', valueMult: 1.20, minRarity: 'uncommon',  weight: 7 },    // Oak
  { key: '50', valueMult: 1.10, minRarity: 'common',    weight: 9 },    // Pine
  { key: '51', valueMult: 1.60, minRarity: 'epic',      weight: 3 },    // Ebony
  { key: '52', valueMult: 1.70, minRarity: 'epic',      weight: 3 },    // Mother-of-Pearl
  { key: '53', valueMult: 0.75, minRarity: 'common',    weight: 13 },   // Plastic
  { key: '54', valueMult: 0.80, minRarity: 'common',    weight: 12 },   // Tin
  { key: '55', valueMult: 1.15, minRarity: 'common',    weight: 8 },    // Brass
  { key: '56', valueMult: 1.65, minRarity: 'epic',      weight: 3 },    // Crystal
  { key: '57', valueMult: 1.75, minRarity: 'epic',      weight: 2 },    // Jade
  { key: '58', valueMult: 1.80, minRarity: 'legendary', weight: 2 },    // Obsidian
  { key: '59', valueMult: 1.40, minRarity: 'rare',      weight: 4 },    // Marble
  { key: '60', valueMult: 1.30, minRarity: 'uncommon',  weight: 6 },    // Porcelain
  { key: '61', valueMult: 1.55, minRarity: 'rare',      weight: 4 },    // Titanium
  { key: '62', valueMult: 0.65, minRarity: 'common',    weight: 14 },   // Corroded
  { key: '63', valueMult: 0.60, minRarity: 'common',    weight: 14 },   // Broken
  { key: '64', valueMult: 1.85, minRarity: 'legendary', weight: 2 },    // Diamond-encrusted
  { key: '65', valueMult: 1.45, minRarity: 'rare',      weight: 4 },    // Lacquered
  { key: '66', valueMult: 1.35, minRarity: 'uncommon',  weight: 5 },    // Polished
  { key: '67', valueMult: 0.85, minRarity: 'common',    weight: 11 },   // Scratched
  { key: '68', valueMult: 0.90, minRarity: 'common',    weight: 11 },   // Faded
  { key: '69', valueMult: 1.50, minRarity: 'rare',      weight: 4 },    // Enameled
  { key: '70', valueMult: 1.25, minRarity: 'uncommon',  weight: 6 },    // Leather-bound
  // ── Style (expanded) ──
  { key: '71', valueMult: 1.30, minRarity: 'uncommon',  weight: 6 },    // Gothic
  { key: '72', valueMult: 1.25, minRarity: 'uncommon',  weight: 7 },    // Rococo
  { key: '73', valueMult: 1.20, minRarity: 'uncommon',  weight: 7 },    // Minimalist
  { key: '74', valueMult: 1.15, minRarity: 'common',    weight: 8 },    // Rustic
  { key: '75', valueMult: 1.35, minRarity: 'rare',      weight: 5 },    // Art-Nouveau
  { key: '76', valueMult: 1.10, minRarity: 'common',    weight: 9 },    // Industrial
  { key: '77', valueMult: 1.40, minRarity: 'rare',      weight: 4 },    // Bohemian
  { key: '78', valueMult: 1.25, minRarity: 'uncommon',  weight: 6 },    // Scandinavian
  { key: '79', valueMult: 1.30, minRarity: 'uncommon',  weight: 6 },    // Japanese
  { key: '80', valueMult: 1.35, minRarity: 'rare',      weight: 5 },    // Chinese
  { key: '81', valueMult: 1.45, minRarity: 'rare',      weight: 4 },    // Persian
  { key: '82', valueMult: 1.20, minRarity: 'uncommon',  weight: 7 },    // Moroccan
  { key: '83', valueMult: 1.50, minRarity: 'rare',      weight: 4 },    // Byzantine
  { key: '84', valueMult: 1.15, minRarity: 'common',    weight: 8 },    // Bohemian
  { key: '85', valueMult: 1.55, minRarity: 'rare',      weight: 3 },    // Venetian
  { key: '86', valueMult: 1.40, minRarity: 'rare',      weight: 4 },    // Florentine
  { key: '87', valueMult: 1.10, minRarity: 'common',    weight: 9 },    // Modern
  { key: '88', valueMult: 1.20, minRarity: 'uncommon',  weight: 7 },    // Contemporary
  { key: '89', valueMult: 1.05, minRarity: 'common',    weight: 10 },   // Traditional
  // ── Provenance (expanded) ──
  { key: '90', valueMult: 1.75, minRarity: 'legendary', weight: 2 },    // Aristocratic
  { key: '91', valueMult: 1.85, minRarity: 'legendary', weight: 2 },    // Papal
  { key: '92', valueMult: 1.70, minRarity: 'epic',      weight: 2 },    // Commissioned
  { key: '93', valueMult: 1.60, minRarity: 'epic',      weight: 3 },    // Heritage
  { key: '94', valueMult: 1.65, minRarity: 'epic',      weight: 3 },    // Heirloom
  { key: '95', valueMult: 1.55, minRarity: 'rare',      weight: 3 },    // Estate
  { key: '96', valueMult: 2.10, minRarity: 'mythic',    weight: 1 },    // Pharaoh's
  { key: '97', valueMult: 2.05, minRarity: 'mythic',    weight: 1 },    // Emperor's
  { key: '98', valueMult: 1.95, minRarity: 'legendary', weight: 1 },    // Sultan's
  { key: '99', valueMult: 1.90, minRarity: 'legendary', weight: 2 },    // Tsar's
  // ── Condition / State ──
  { key: '100', valueMult: 0.55, minRarity: 'common',   weight: 13 },   // Tarnished
  { key: '101', valueMult: 0.50, minRarity: 'common',   weight: 13 },   // Cracked
  { key: '102', valueMult: 0.75, minRarity: 'common',   weight: 12 },   // Dusty
  { key: '103', valueMult: 0.70, minRarity: 'common',   weight: 12 },   // Weathered
  { key: '104', valueMult: 1.00, minRarity: 'common',   weight: 10 },   // Refurbished
  { key: '105', valueMult: 1.20, minRarity: 'uncommon', weight: 7 },    // Pristine
  { key: '106', valueMult: 1.25, minRarity: 'uncommon', weight: 6 },    // Immaculate
  { key: '107', valueMult: 0.65, minRarity: 'common',   weight: 13 },   // Chipped
  { key: '108', valueMult: 0.45, minRarity: 'common',   weight: 14 },   // Shattered
  { key: '109', valueMult: 0.88, minRarity: 'common',   weight: 11 },   // Patinated
  // ── Special / Exotic ──
  { key: '110', valueMult: 1.70, minRarity: 'epic',     weight: 2 },    // Bespoke
  { key: '111', valueMult: 1.80, minRarity: 'legendary', weight: 2 },   // Ceremonial
  { key: '112', valueMult: 1.65, minRarity: 'epic',     weight: 3 },    // Monogrammed
  { key: '113', valueMult: 1.75, minRarity: 'epic',     weight: 2 },    // Filigree
  { key: '114', valueMult: 1.60, minRarity: 'epic',     weight: 3 },    // Inlaid
  { key: '115', valueMult: 1.85, minRarity: 'legendary', weight: 2 },   // Jewel-studded
  { key: '116', valueMult: 1.45, minRarity: 'rare',     weight: 4 },    // Embossed
  { key: '117', valueMult: 1.50, minRarity: 'rare',     weight: 4 },    // Cloisonné
  { key: '118', valueMult: 1.55, minRarity: 'rare',     weight: 3 },    // Damascened
  { key: '119', valueMult: 2.20, minRarity: 'mythic',   weight: 1 },    // Sacred
]

// ─── Shared Suffix Pool ─────────────────────────────────────────

export const NAME_SUFFIXES: NameSuffix[] = [
  { key: '0',  valueBonus: 0.05, minRarity: 'common',    weight: 10 },  // from estate sale
  { key: '1',  valueBonus: 0.10, minRarity: 'uncommon',  weight: 7 },   // with certificate
  { key: '2',  valueBonus: 0.15, minRarity: 'rare',      weight: 5 },   // limited edition
  { key: '3',  valueBonus: 0.20, minRarity: 'rare',      weight: 4 },   // signed
  { key: '4',  valueBonus: 0.25, minRarity: 'epic',      weight: 3 },   // one of a kind
  { key: '5',  valueBonus: 0.08, minRarity: 'common',    weight: 9 },   // with papers
  { key: '6',  valueBonus: 0.12, minRarity: 'uncommon',  weight: 6 },   // authenticated
  { key: '7',  valueBonus: 0.30, minRarity: 'epic',      weight: 3 },   // celebrity-owned
  { key: '8',  valueBonus: 0.18, minRarity: 'rare',      weight: 4 },   // private collection
  { key: '9',  valueBonus: 0.35, minRarity: 'legendary', weight: 2 },   // museum deaccession
  { key: '10', valueBonus: 0.15, minRarity: 'uncommon',  weight: 6 },   // numbered
  { key: '11', valueBonus: 0.40, minRarity: 'legendary', weight: 2 },   // with provenance
  { key: '12', valueBonus: 0.50, minRarity: 'mythic',    weight: 1 },   // national treasure
  // ── Provenance (expanded) ──
  { key: '13', valueBonus: 0.06, minRarity: 'common',    weight: 9 },   // from garage sale
  { key: '14', valueBonus: 0.07, minRarity: 'common',    weight: 9 },   // from flea market
  { key: '15', valueBonus: 0.09, minRarity: 'common',    weight: 8 },   // from attic find
  { key: '16', valueBonus: 0.04, minRarity: 'common',    weight: 10 },  // from thrift store
  { key: '17', valueBonus: 0.11, minRarity: 'uncommon',  weight: 7 },   // from auction house
  { key: '18', valueBonus: 0.13, minRarity: 'uncommon',  weight: 6 },   // from private dealer
  { key: '19', valueBonus: 0.16, minRarity: 'rare',      weight: 5 },   // from royal collection
  { key: '20', valueBonus: 0.22, minRarity: 'rare',      weight: 4 },   // from shipwreck salvage
  { key: '21', valueBonus: 0.28, minRarity: 'epic',      weight: 3 },   // from archaeological dig
  { key: '22', valueBonus: 0.33, minRarity: 'epic',      weight: 3 },   // from ancient tomb
  { key: '23', valueBonus: 0.38, minRarity: 'legendary', weight: 2 },   // from palace vault
  { key: '24', valueBonus: 0.45, minRarity: 'legendary', weight: 2 },   // from Vatican archives
  { key: '25', valueBonus: 0.55, minRarity: 'mythic',    weight: 1 },   // from lost civilization
  // ── Special Traits ──
  { key: '26', valueBonus: 0.10, minRarity: 'uncommon',  weight: 7 },   // with original box
  { key: '27', valueBonus: 0.14, minRarity: 'uncommon',  weight: 6 },   // with receipt
  { key: '28', valueBonus: 0.12, minRarity: 'uncommon',  weight: 6 },   // with warranty
  { key: '29', valueBonus: 0.17, minRarity: 'rare',      weight: 5 },   // prototype
  { key: '30', valueBonus: 0.19, minRarity: 'rare',      weight: 4 },   // first production run
  { key: '31', valueBonus: 0.21, minRarity: 'rare',      weight: 4 },   // artist's proof
  { key: '32', valueBonus: 0.24, minRarity: 'epic',      weight: 3 },   // exhibition piece
  { key: '33', valueBonus: 0.27, minRarity: 'epic',      weight: 3 },   // award-winning
  { key: '34', valueBonus: 0.32, minRarity: 'epic',      weight: 3 },   // historically significant
  { key: '35', valueBonus: 0.36, minRarity: 'legendary', weight: 2 },   // war trophy
  { key: '36', valueBonus: 0.42, minRarity: 'legendary', weight: 2 },   // crown jewel
  { key: '37', valueBonus: 0.48, minRarity: 'mythic',    weight: 1 },   // world heritage item
  // ── Condition / History ──
  { key: '38', valueBonus: 0.03, minRarity: 'common',    weight: 10 },  // slightly used
  { key: '39', valueBonus: 0.06, minRarity: 'common',    weight: 9 },   // well-maintained
  { key: '40', valueBonus: 0.08, minRarity: 'common',    weight: 8 },   // recently serviced
  { key: '41', valueBonus: 0.11, minRarity: 'uncommon',  weight: 7 },   // professionally cleaned
  { key: '42', valueBonus: 0.14, minRarity: 'uncommon',  weight: 6 },   // expertly restored
  { key: '43', valueBonus: 0.16, minRarity: 'rare',      weight: 5 },   // never opened
  { key: '44', valueBonus: 0.20, minRarity: 'rare',      weight: 4 },   // factory sealed
  { key: '45', valueBonus: 0.23, minRarity: 'rare',      weight: 4 },   // time capsule find
  // ── Celebrity / Famous ──
  { key: '46', valueBonus: 0.26, minRarity: 'epic',      weight: 3 },   // previously exhibited
  { key: '47', valueBonus: 0.29, minRarity: 'epic',      weight: 3 },   // featured in documentary
  { key: '48', valueBonus: 0.34, minRarity: 'legendary', weight: 2 },   // owned by royalty
  { key: '49', valueBonus: 0.37, minRarity: 'legendary', weight: 2 },   // presidential artifact
  { key: '50', valueBonus: 0.41, minRarity: 'legendary', weight: 2 },   // Hollywood provenance
  { key: '51', valueBonus: 0.44, minRarity: 'legendary', weight: 2 },   // Nobel laureate's
  { key: '52', valueBonus: 0.52, minRarity: 'mythic',    weight: 1 },   // cursed artifact
  { key: '53', valueBonus: 0.58, minRarity: 'mythic',    weight: 1 },   // legendary lost relic
  // ── Miscellaneous ──
  { key: '54', valueBonus: 0.05, minRarity: 'common',    weight: 9 },   // with minor flaws
  { key: '55', valueBonus: 0.07, minRarity: 'common',    weight: 9 },   // estate clearance
  { key: '56', valueBonus: 0.09, minRarity: 'common',    weight: 8 },   // barn find
  { key: '57', valueBonus: 0.13, minRarity: 'uncommon',  weight: 6 },   // inherited piece
  { key: '58', valueBonus: 0.15, minRarity: 'uncommon',  weight: 6 },   // collector's grade
  { key: '59', valueBonus: 0.18, minRarity: 'rare',      weight: 5 },   // investment grade
  { key: '60', valueBonus: 0.22, minRarity: 'rare',      weight: 4 },   // competition winner
  { key: '61', valueBonus: 0.25, minRarity: 'epic',      weight: 3 },   // master craftsman's
  { key: '62', valueBonus: 0.31, minRarity: 'epic',      weight: 3 },   // once-in-a-lifetime
  { key: '63', valueBonus: 0.39, minRarity: 'legendary', weight: 2 },   // insured for millions
  { key: '64', valueBonus: 0.46, minRarity: 'legendary', weight: 1 },   // Sotheby's certified
  { key: '65', valueBonus: 0.60, minRarity: 'mythic',    weight: 1 },   // eighth wonder
]

// ─── Category Blueprints ────────────────────────────────────────

export const CATEGORY_BLUEPRINTS: CategoryBlueprint[] = [
  // ── Junk ──
  {
    category: 'junk',
    baseNames: [
      { key: '0', icon: 'mdi:newspaper',        weight: 1, dropWeight: 15 },  // Newspapers
      { key: '1', icon: 'mdi:lamp',             weight: 2, dropWeight: 12 },  // Broken Lamp
      { key: '2', icon: 'mdi:package-variant',  weight: 1, dropWeight: 18 },  // Cardboard Boxes
      { key: '3', icon: 'mdi:curtains',         weight: 2, dropWeight: 10 },  // Dusty Curtains
      { key: '4', icon: 'mdi:delete-empty',     weight: 1, dropWeight: 14 },  // Plastic Bins
      { key: '5', icon: 'mdi:spray-bottle',     weight: 1, dropWeight: 13 },  // Cleaning Supplies
      { key: '6', icon: 'mdi:pot-mix',          weight: 2, dropWeight: 11 },  // Old Kitchenware
      { key: '7', icon: 'mdi:pipe-wrench',      weight: 3, dropWeight: 9 },   // Rusty Pipes
      { key: '8', icon: 'mdi:lightbulb-off',    weight: 1, dropWeight: 12 },  // Dead Light Fixtures
      { key: '9', icon: 'mdi:toy-brick',        weight: 1, dropWeight: 10 },  // Broken Toys
      { key: '10', icon: 'mdi:broom',           weight: 1, dropWeight: 14 },  // Old Broom
      { key: '11', icon: 'mdi:hanger',          weight: 1, dropWeight: 13 },  // Wire Hangers
      { key: '12', icon: 'mdi:alarm-light',     weight: 2, dropWeight: 11 },  // Broken Alarm
      { key: '13', icon: 'mdi:food-drumstick',  weight: 1, dropWeight: 10 },  // Expired Cans
      { key: '14', icon: 'mdi:shoe-formal',     weight: 2, dropWeight: 12 },  // Mismatched Shoes
      { key: '15', icon: 'mdi:battery',         weight: 1, dropWeight: 13 },  // Dead Batteries
      { key: '16', icon: 'mdi:bottle-soda',     weight: 1, dropWeight: 14 },  // Empty Bottles
      { key: '17', icon: 'mdi:pillow',          weight: 2, dropWeight: 11 },  // Stained Pillows
      { key: '18', icon: 'mdi:image-broken',    weight: 1, dropWeight: 10 },  // Cracked Frame
      { key: '19', icon: 'mdi:cup-water',       weight: 1, dropWeight: 15 },  // Chipped Mugs
    ],
    valueCurves: {
      common:    { min: 1,   max: 10 },
      uncommon:  { min: 5,   max: 20 },
      rare:      { min: 10,  max: 40 },
      epic:      { min: 20,  max: 60 },
      legendary: { min: 30,  max: 80 },
      jackpot:   { min: 40,  max: 100 },
      mythic:    { min: 50,  max: 120 },
    },
    hasDescriptions: true,
  },

  // ── Furniture ──
  {
    category: 'furniture',
    baseNames: [
      { key: '0', icon: 'mdi:seat',          weight: 3,  dropWeight: 10 },  // Chair
      { key: '1', icon: 'mdi:desk',          weight: 5,  dropWeight: 8 },   // Desk
      { key: '2', icon: 'mdi:bookshelf',     weight: 6,  dropWeight: 7 },   // Bookshelf
      { key: '3', icon: 'mdi:sofa',          weight: 8,  dropWeight: 5 },   // Sofa
      { key: '4', icon: 'mdi:wardrobe',      weight: 10, dropWeight: 3 },   // Armoire
      { key: '5', icon: 'mdi:table-furniture', weight: 5, dropWeight: 7 },  // Table
      { key: '6', icon: 'mdi:bed',           weight: 10, dropWeight: 4 },   // Bed Frame
      { key: '7', icon: 'mdi:dresser',       weight: 8,  dropWeight: 5 },   // Dresser
      { key: '8', icon: 'mdi:file-cabinet',   weight: 7,  dropWeight: 6 },   // Cabinet
      { key: '9', icon: 'mdi:mirror',        weight: 4,  dropWeight: 7 },   // Mirror
      { key: '10', icon: 'mdi:lamp',          weight: 2,  dropWeight: 9 },   // Floor Lamp
      { key: '11', icon: 'mdi:seat-recline-normal', weight: 7, dropWeight: 5 }, // Recliner
      { key: '12', icon: 'mdi:treasure-chest', weight: 6, dropWeight: 4 },  // Hope Chest
      { key: '13', icon: 'mdi:dresser-outline', weight: 9, dropWeight: 4 }, // Buffet
      { key: '14', icon: 'mdi:coat-rack',     weight: 4,  dropWeight: 8 },  // Coat Rack
      { key: '15', icon: 'mdi:table-chair',   weight: 12, dropWeight: 3 },  // Dining Set
      { key: '16', icon: 'mdi:fireplace',     weight: 15, dropWeight: 2 },  // Fireplace Mantle
      { key: '17', icon: 'mdi:vanity-light',  weight: 5,  dropWeight: 6 },  // Vanity Table
      { key: '18', icon: 'mdi:seat-outline',  weight: 4,  dropWeight: 7 },  // Ottoman
      { key: '19', icon: 'mdi:clock-time-eight', weight: 15, dropWeight: 2 }, // Grandfather Clock
    ],
    valueCurves: {
      common:    { min: 5,     max: 40 },
      uncommon:  { min: 30,    max: 200 },
      rare:      { min: 150,   max: 1500 },
      epic:      { min: 800,   max: 8000 },
      legendary: { min: 3000,  max: 30000 },
      jackpot:   { min: 10000, max: 80000 },
      mythic:    { min: 30000, max: 250000 },
    },
    hasDescriptions: true,
  },

  // ── Electronics ──
  {
    category: 'electronics',
    baseNames: [
      { key: '0', icon: 'mdi:television-classic', weight: 7, dropWeight: 9 },  // TV
      { key: '1', icon: 'mdi:radio',              weight: 4, dropWeight: 6 },  // Radio
      { key: '2', icon: 'mdi:gamepad-square',     weight: 3, dropWeight: 5 },  // Game Console
      { key: '3', icon: 'mdi:laptop',             weight: 3, dropWeight: 4 },  // Laptop
      { key: '4', icon: 'mdi:disc-player',        weight: 5, dropWeight: 3 },  // Turntable
      { key: '5', icon: 'mdi:camera',             weight: 4, dropWeight: 5 },  // Camera
      { key: '6', icon: 'mdi:telescope',          weight: 6, dropWeight: 3 },  // Telescope
      { key: '7', icon: 'mdi:cellphone',          weight: 1, dropWeight: 7 },  // Phone
      { key: '8', icon: 'mdi:speaker',            weight: 5, dropWeight: 6 },  // Speaker System
      { key: '9', icon: 'mdi:printer',            weight: 4, dropWeight: 7 },  // Printer
      { key: '10', icon: 'mdi:tape-drive',        weight: 3, dropWeight: 5 },  // Tape Deck
      { key: '11', icon: 'mdi:video-vintage',     weight: 4, dropWeight: 4 },  // VCR
      { key: '12', icon: 'mdi:calculator',        weight: 1, dropWeight: 8 },  // Calculator
      { key: '13', icon: 'mdi:projector',         weight: 6, dropWeight: 3 },  // Projector
      { key: '14', icon: 'mdi:fax',               weight: 5, dropWeight: 6 },  // Fax Machine
      { key: '15', icon: 'mdi:amplifier',         weight: 6, dropWeight: 4 },  // Amplifier
      { key: '16', icon: 'mdi:headphones',        weight: 1, dropWeight: 7 },  // Headphones
      { key: '17', icon: 'mdi:router-wireless',   weight: 2, dropWeight: 8 },  // Router
      { key: '18', icon: 'mdi:microphone',        weight: 2, dropWeight: 5 },  // Microphone
      { key: '19', icon: 'mdi:cassette',          weight: 2, dropWeight: 6 },  // Walkman
    ],
    valueCurves: {
      common:    { min: 8,     max: 50 },
      uncommon:  { min: 35,    max: 250 },
      rare:      { min: 100,   max: 1000 },
      epic:      { min: 400,   max: 4000 },
      legendary: { min: 2000,  max: 20000 },
      jackpot:   { min: 5000,  max: 50000 },
      mythic:    { min: 15000, max: 150000 },
    },
    hasDescriptions: true,
  },

  // ── Clothing ──
  {
    category: 'clothing',
    baseNames: [
      { key: '0', icon: 'mdi:tshirt-crew',   weight: 3, dropWeight: 12 },  // Clothes Box
      { key: '1', icon: 'mdi:tshirt-v',      weight: 2, dropWeight: 6 },   // Jacket
      { key: '2', icon: 'mdi:bag-personal',  weight: 1, dropWeight: 4 },   // Handbag
      { key: '3', icon: 'mdi:hanger',        weight: 3, dropWeight: 3 },   // Coat
      { key: '4', icon: 'mdi:sunglasses',    weight: 1, dropWeight: 5 },   // Sunglasses
      { key: '5', icon: 'mdi:shoe-heel',     weight: 2, dropWeight: 5 },   // Shoes
      { key: '6', icon: 'mdi:hat-fedora',    weight: 1, dropWeight: 6 },   // Hat
      { key: '7', icon: 'mdi:bow-tie',        weight: 1, dropWeight: 7 },   // Scarf
      { key: '8', icon: 'mdi:bow-tie',       weight: 1, dropWeight: 4 },   // Tie Collection
      { key: '9', icon: 'mdi:tshirt-crew',   weight: 2, dropWeight: 5 },   // Kimono
      { key: '10', icon: 'mdi:hat-fedora',   weight: 1, dropWeight: 5 },   // Beret
      { key: '11', icon: 'mdi:hanger',       weight: 3, dropWeight: 4 },   // Evening Gown
      { key: '12', icon: 'mdi:bag-personal', weight: 1, dropWeight: 3 },   // Clutch Purse
      { key: '13', icon: 'mdi:shoe-formal',  weight: 2, dropWeight: 4 },   // Boots
      { key: '14', icon: 'mdi:tshirt-crew',  weight: 2, dropWeight: 6 },   // Denim Jacket
      { key: '15', icon: 'mdi:hanger',       weight: 2, dropWeight: 5 },   // Fur Stole
      { key: '16', icon: 'mdi:bag-personal', weight: 1, dropWeight: 4 },   // Leather Belt
      { key: '17', icon: 'mdi:tshirt-v',     weight: 2, dropWeight: 7 },   // Vest
      { key: '18', icon: 'mdi:hanger',       weight: 3, dropWeight: 3 },   // Tuxedo
      { key: '19', icon: 'mdi:shoe-heel',    weight: 2, dropWeight: 4 },   // Stilettos
    ],
    valueCurves: {
      common:    { min: 5,     max: 30 },
      uncommon:  { min: 40,    max: 250 },
      rare:      { min: 150,   max: 2000 },
      epic:      { min: 600,   max: 6000 },
      legendary: { min: 3000,  max: 40000 },
      jackpot:   { min: 8000,  max: 80000 },
      mythic:    { min: 20000, max: 200000 },
    },
    hasDescriptions: true,
  },

  // ── Tools ──
  {
    category: 'tools',
    baseNames: [
      { key: '0', icon: 'mdi:toolbox',         weight: 5, dropWeight: 8 },   // Toolbox
      { key: '1', icon: 'mdi:screwdriver',      weight: 4, dropWeight: 5 },   // Drill Set
      { key: '2', icon: 'mdi:fire',             weight: 12, dropWeight: 2 },  // Welder
      { key: '3', icon: 'mdi:content-cut',       weight: 7, dropWeight: 4 },   // Sewing Machine
      { key: '4', icon: 'mdi:saw-blade',        weight: 6, dropWeight: 5 },   // Saw
      { key: '5', icon: 'mdi:hammer',           weight: 3, dropWeight: 7 },   // Hand Tools
      { key: '6', icon: 'mdi:wrench',           weight: 4, dropWeight: 6 },   // Wrench Set
      { key: '7', icon: 'mdi:spray',            weight: 3, dropWeight: 5 },   // Paint Equipment
      { key: '8', icon: 'mdi:screwdriver',      weight: 3, dropWeight: 6 },   // Screwdriver Set
      { key: '9', icon: 'mdi:ruler-square',     weight: 2, dropWeight: 7 },   // Measuring Tools
      { key: '10', icon: 'mdi:hammer-wrench',   weight: 5, dropWeight: 4 },   // Socket Set
      { key: '11', icon: 'mdi:knife',           weight: 2, dropWeight: 6 },   // Chisel Set
      { key: '12', icon: 'mdi:anvil',           weight: 15, dropWeight: 2 },  // Anvil
      { key: '13', icon: 'mdi:air-filter',      weight: 8, dropWeight: 3 },   // Compressor
      { key: '14', icon: 'mdi:water-pump',      weight: 7, dropWeight: 4 },   // Water Pump
      { key: '15', icon: 'mdi:magnify',         weight: 1, dropWeight: 5 },   // Magnifying Glass
      { key: '16', icon: 'mdi:clamp',           weight: 3, dropWeight: 7 },   // Clamp Set
      { key: '17', icon: 'mdi:ruler',           weight: 2, dropWeight: 8 },   // Level
    ],
    valueCurves: {
      common:    { min: 10,    max: 70 },
      uncommon:  { min: 35,    max: 250 },
      rare:      { min: 200,   max: 2000 },
      epic:      { min: 800,   max: 8000 },
      legendary: { min: 3000,  max: 25000 },
      jackpot:   { min: 8000,  max: 60000 },
      mythic:    { min: 20000, max: 200000 },
    },
    hasDescriptions: true,
  },

  // ── Collectibles ──
  {
    category: 'collectibles',
    baseNames: [
      { key: '0', icon: 'mdi:book-open-variant', weight: 3, dropWeight: 6 },  // Comic Books
      { key: '1', icon: 'mdi:cards',             weight: 2, dropWeight: 5 },   // Trading Cards
      { key: '2', icon: 'mdi:circle-multiple',   weight: 1, dropWeight: 4 },   // Coins
      { key: '3', icon: 'mdi:book-lock',         weight: 1, dropWeight: 2 },   // First Edition
      { key: '4', icon: 'mdi:album',             weight: 3, dropWeight: 6 },   // Vinyl Records
      { key: '5', icon: 'mdi:snowflake',         weight: 3, dropWeight: 8 },   // Snow Globes
      { key: '6', icon: 'mdi:dice-multiple',     weight: 4, dropWeight: 7 },   // Board Games
      { key: '7', icon: 'mdi:train',             weight: 5, dropWeight: 4 },   // Model Train
      { key: '8', icon: 'mdi:glass-wine',        weight: 4, dropWeight: 3 },   // Wine Collection
      { key: '9', icon: 'mdi:toy-brick',         weight: 2, dropWeight: 5 },   // Action Figures
      { key: '10', icon: 'mdi:post-outline',     weight: 1, dropWeight: 4 },   // Stamps
      { key: '11', icon: 'mdi:teddy-bear',       weight: 2, dropWeight: 6 },   // Teddy Bear
      { key: '12', icon: 'mdi:baseball',         weight: 2, dropWeight: 5 },   // Signed Baseball
      { key: '13', icon: 'mdi:bottle-tonic',     weight: 3, dropWeight: 4 },   // Vintage Bottle
      { key: '14', icon: 'mdi:puzzle',           weight: 2, dropWeight: 7 },   // Jigsaw Puzzle
      { key: '15', icon: 'mdi:movie',            weight: 1, dropWeight: 5 },   // Movie Poster
      { key: '16', icon: 'mdi:typewriter',       weight: 3, dropWeight: 3 },   // Typewriter
      { key: '17', icon: 'mdi:robot',            weight: 2, dropWeight: 4 },   // Tin Robot
      { key: '18', icon: 'mdi:car-sports',       weight: 3, dropWeight: 3 },   // Diecast Car
      { key: '19', icon: 'mdi:music-note',       weight: 1, dropWeight: 5 },   // Music Box
      { key: '20', icon: 'mdi:crystal-ball',     weight: 2, dropWeight: 3 },   // Crystal Ball
    ],
    valueCurves: {
      common:    { min: 5,     max: 40 },
      uncommon:  { min: 30,    max: 400 },
      rare:      { min: 150,   max: 2500 },
      epic:      { min: 500,   max: 6000 },
      legendary: { min: 2000,  max: 25000 },
      jackpot:   { min: 5000,  max: 60000 },
      mythic:    { min: 15000, max: 200000 },
    },
    hasDescriptions: true,
  },

  // ── Art ──
  {
    category: 'art',
    baseNames: [
      { key: '0', icon: 'mdi:image-frame',     weight: 3, dropWeight: 8 },   // Print
      { key: '1', icon: 'mdi:palette',          weight: 5, dropWeight: 4 },   // Oil Painting
      { key: '2', icon: 'mdi:human',            weight: 10, dropWeight: 2 },  // Sculpture
      { key: '3', icon: 'mdi:star-shooting',    weight: 2, dropWeight: 1 },   // Masterpiece
      { key: '4', icon: 'mdi:drawing',          weight: 2, dropWeight: 6 },   // Sketch
      { key: '5', icon: 'mdi:image',            weight: 3, dropWeight: 5 },   // Photograph
      { key: '6', icon: 'mdi:pot',              weight: 4, dropWeight: 4 },   // Ceramics
      { key: '7', icon: 'mdi:glass-fragile',    weight: 3, dropWeight: 3 },   // Glass Art
      { key: '8', icon: 'mdi:rug',              weight: 6, dropWeight: 3 },   // Tapestry
      { key: '9', icon: 'mdi:image-frame',      weight: 4, dropWeight: 5 },   // Watercolor
      { key: '10', icon: 'mdi:palette',         weight: 3, dropWeight: 4 },   // Acrylic Painting
      { key: '11', icon: 'mdi:grease-pencil',   weight: 2, dropWeight: 6 },   // Charcoal Drawing
      { key: '12', icon: 'mdi:human',           weight: 8, dropWeight: 2 },   // Bronze Bust
      { key: '13', icon: 'mdi:spray',           weight: 2, dropWeight: 5 },   // Street Art Print
      { key: '14', icon: 'mdi:image',           weight: 3, dropWeight: 4 },   // Lithograph
      { key: '15', icon: 'mdi:image-frame',     weight: 4, dropWeight: 3 },   // Etching
      { key: '16', icon: 'mdi:shape',           weight: 5, dropWeight: 3 },   // Abstract Piece
      { key: '17', icon: 'mdi:face-woman',      weight: 3, dropWeight: 4 },   // Portrait
      { key: '18', icon: 'mdi:nature',          weight: 3, dropWeight: 5 },   // Landscape
      { key: '19', icon: 'mdi:hand-heart',      weight: 6, dropWeight: 2 },   // Mosaic
    ],
    valueCurves: {
      common:    { min: 8,      max: 60 },
      uncommon:  { min: 50,     max: 500 },
      rare:      { min: 200,    max: 4000 },
      epic:      { min: 1000,   max: 15000 },
      legendary: { min: 5000,   max: 80000 },
      jackpot:   { min: 15000,  max: 200000 },
      mythic:    { min: 50000,  max: 1000000 },
    },
    hasDescriptions: true,
  },

  // ── Jewelry ──
  {
    category: 'jewelry',
    baseNames: [
      { key: '0', icon: 'mdi:ring',            weight: 1, dropWeight: 8 },   // Ring
      { key: '1', icon: 'mdi:necklace',        weight: 1, dropWeight: 5 },   // Necklace
      { key: '2', icon: 'mdi:watch',           weight: 1, dropWeight: 4 },   // Watch
      { key: '3', icon: 'mdi:diamond-stone',   weight: 1, dropWeight: 2 },   // Diamond Piece
      { key: '4', icon: 'mdi:crown',           weight: 1, dropWeight: 1 },   // Crown
      { key: '5', icon: 'mdi:necklace',        weight: 1, dropWeight: 5 },   // Bracelet
      { key: '6', icon: 'mdi:star-four-points', weight: 1, dropWeight: 4 },  // Brooch
      { key: '7', icon: 'mdi:heart-outline',   weight: 1, dropWeight: 6 },   // Locket
      { key: '8', icon: 'mdi:earbuds-outline', weight: 1, dropWeight: 5 },   // Earrings
      { key: '9', icon: 'mdi:ring',            weight: 1, dropWeight: 3 },   // Signet Ring
      { key: '10', icon: 'mdi:necklace',       weight: 1, dropWeight: 4 },   // Choker
      { key: '11', icon: 'mdi:diamond-stone',  weight: 1, dropWeight: 2 },   // Tiara
      { key: '12', icon: 'mdi:star-four-points', weight: 1, dropWeight: 3 }, // Cufflinks
      { key: '13', icon: 'mdi:necklace',       weight: 1, dropWeight: 4 },   // Pendant
      { key: '14', icon: 'mdi:ring',           weight: 1, dropWeight: 3 },   // Wedding Band
      { key: '15', icon: 'mdi:necklace',       weight: 1, dropWeight: 5 },   // Anklet
      { key: '16', icon: 'mdi:star-four-points', weight: 1, dropWeight: 3 }, // Cameo
      { key: '17', icon: 'mdi:diamond-stone',  weight: 1, dropWeight: 2 },   // Diadem
      { key: '18', icon: 'mdi:necklace',       weight: 1, dropWeight: 4 },   // Chain
      { key: '19', icon: 'mdi:star-four-points', weight: 1, dropWeight: 3 }, // Hairpin
    ],
    valueCurves: {
      common:    { min: 5,      max: 40 },
      uncommon:  { min: 50,     max: 300 },
      rare:      { min: 250,    max: 3000 },
      epic:      { min: 1200,   max: 18000 },
      legendary: { min: 8000,   max: 120000 },
      jackpot:   { min: 25000,  max: 300000 },
      mythic:    { min: 80000,  max: 1500000 },
    },
    hasDescriptions: true,
  },

  // ── Antiques ──
  {
    category: 'antiques',
    baseNames: [
      { key: '0', icon: 'mdi:clock-outline',     weight: 1, dropWeight: 5 },  // Pocket Watch
      { key: '1', icon: 'mdi:flower-tulip',      weight: 3, dropWeight: 4 },  // Vase
      { key: '2', icon: 'mdi:sword',             weight: 4, dropWeight: 2 },  // Sword
      { key: '3', icon: 'mdi:pyramid',           weight: 2, dropWeight: 1 },  // Artifact
      { key: '4', icon: 'mdi:keyboard',          weight: 5, dropWeight: 5 },  // Typewriter
      { key: '5', icon: 'mdi:rug',               weight: 8, dropWeight: 3 },  // Rug
      { key: '6', icon: 'mdi:clock-time-eight',  weight: 4, dropWeight: 3 },  // Clock
      { key: '7', icon: 'mdi:medal',             weight: 1, dropWeight: 2 },  // Medals
      { key: '8', icon: 'mdi:candelabra',        weight: 3, dropWeight: 4 },  // Candelabra
      { key: '9', icon: 'mdi:treasure-chest',    weight: 5, dropWeight: 2 },  // Chest
      { key: '10', icon: 'mdi:bell',             weight: 2, dropWeight: 4 },  // Bell
      { key: '11', icon: 'mdi:compass',          weight: 1, dropWeight: 3 },  // Compass
      { key: '12', icon: 'mdi:scale-balance',    weight: 3, dropWeight: 3 },  // Scales
      { key: '13', icon: 'mdi:key-variant',      weight: 1, dropWeight: 5 },  // Skeleton Key
      { key: '14', icon: 'mdi:fan',              weight: 1, dropWeight: 5 },  // Hand Fan
      { key: '15', icon: 'mdi:glass-cocktail',   weight: 2, dropWeight: 4 },  // Decanter
      { key: '16', icon: 'mdi:oil-lamp',         weight: 2, dropWeight: 4 },  // Oil Lamp
      { key: '17', icon: 'mdi:binoculars',       weight: 2, dropWeight: 3 },  // Opera Glasses
      { key: '18', icon: 'mdi:shield',           weight: 3, dropWeight: 2 },  // Shield
      { key: '19', icon: 'mdi:pistol',           weight: 2, dropWeight: 2 },  // Flintlock Pistol
    ],
    valueCurves: {
      common:    { min: 10,     max: 60 },
      uncommon:  { min: 40,     max: 350 },
      rare:      { min: 200,    max: 3000 },
      epic:      { min: 1500,   max: 25000 },
      legendary: { min: 10000,  max: 180000 },
      jackpot:   { min: 30000,  max: 400000 },
      mythic:    { min: 80000,  max: 1500000 },
    },
    hasDescriptions: true,
  },

  // ── Sports ──
  {
    category: 'sports',
    baseNames: [
      { key: '0', icon: 'mdi:golf',           weight: 6, dropWeight: 8 },   // Golf Clubs
      { key: '1', icon: 'mdi:tshirt-crew',    weight: 2, dropWeight: 4 },   // Jersey
      { key: '2', icon: 'mdi:trophy',         weight: 5, dropWeight: 2 },   // Trophy
      { key: '3', icon: 'mdi:trophy-variant', weight: 5, dropWeight: 5 },   // Medal Collection
      { key: '4', icon: 'mdi:baseball-bat',   weight: 3, dropWeight: 6 },   // Baseball Gear
      { key: '5', icon: 'mdi:basketball',     weight: 2, dropWeight: 5 },   // Basketball
      { key: '6', icon: 'mdi:tennis',         weight: 3, dropWeight: 6 },   // Tennis Racket
      { key: '7', icon: 'mdi:boxing-glove',   weight: 2, dropWeight: 4 },   // Boxing Gloves
      { key: '8', icon: 'mdi:hockey-sticks',  weight: 3, dropWeight: 5 },   // Hockey Stick
      { key: '9', icon: 'mdi:soccer',         weight: 2, dropWeight: 6 },   // Soccer Ball
      { key: '10', icon: 'mdi:swim',          weight: 1, dropWeight: 7 },   // Swim Goggles
      { key: '11', icon: 'mdi:ski',           weight: 4, dropWeight: 4 },   // Ski Set
      { key: '12', icon: 'mdi:weight-lifter', weight: 8, dropWeight: 3 },   // Dumbbell Set
      { key: '13', icon: 'mdi:cricket',       weight: 3, dropWeight: 5 },   // Cricket Bat
      { key: '14', icon: 'mdi:fencing',       weight: 3, dropWeight: 3 },   // Fencing Sword
      { key: '15', icon: 'mdi:skateboard',    weight: 3, dropWeight: 6 },   // Skateboard
      { key: '16', icon: 'mdi:horse-variant',  weight: 4, dropWeight: 3 },  // Riding Helmet
      { key: '17', icon: 'mdi:bow-arrow',     weight: 4, dropWeight: 4 },   // Archery Bow
    ],
    valueCurves: {
      common:    { min: 8,     max: 60 },
      uncommon:  { min: 25,    max: 200 },
      rare:      { min: 120,   max: 2000 },
      epic:      { min: 800,   max: 10000 },
      legendary: { min: 4000,  max: 50000 },
      jackpot:   { min: 10000, max: 100000 },
      mythic:    { min: 30000, max: 500000 },
    },
    hasDescriptions: true,
  },

  // ── Instruments ──
  {
    category: 'instruments',
    baseNames: [
      { key: '0', icon: 'mdi:guitar-acoustic', weight: 4,  dropWeight: 5 },  // Guitar
      { key: '1', icon: 'mdi:saxophone',       weight: 5,  dropWeight: 3 },  // Saxophone
      { key: '2', icon: 'mdi:violin',          weight: 2,  dropWeight: 1 },  // Violin
      { key: '3', icon: 'mdi:music',           weight: 10, dropWeight: 4 },  // Drum Kit
      { key: '4', icon: 'mdi:piano',           weight: 20, dropWeight: 2 },  // Piano
      { key: '5', icon: 'mdi:trumpet',         weight: 3,  dropWeight: 4 },  // Trumpet
      { key: '6', icon: 'mdi:music-note',      weight: 2,  dropWeight: 5 },  // Flute
      { key: '7', icon: 'mdi:guitar-electric', weight: 4,  dropWeight: 4 },  // Electric Guitar
      { key: '8', icon: 'mdi:music-note',      weight: 3,  dropWeight: 4 },  // Clarinet
      { key: '9', icon: 'mdi:music',           weight: 2,  dropWeight: 5 },  // Harmonica
      { key: '10', icon: 'mdi:music-note',     weight: 5,  dropWeight: 3 },  // Cello
      { key: '11', icon: 'mdi:music',          weight: 6,  dropWeight: 3 },  // Harp
      { key: '12', icon: 'mdi:music-note',     weight: 3,  dropWeight: 4 },  // Oboe
      { key: '13', icon: 'mdi:music',          weight: 2,  dropWeight: 5 },  // Banjo
      { key: '14', icon: 'mdi:music-note',     weight: 4,  dropWeight: 3 },  // Tuba
      { key: '15', icon: 'mdi:accordion',      weight: 5,  dropWeight: 3 },  // Accordion
      { key: '16', icon: 'mdi:music',          weight: 2,  dropWeight: 5 },  // Ukulele
      { key: '17', icon: 'mdi:music-note',     weight: 3,  dropWeight: 4 },  // Mandolin
    ],
    valueCurves: {
      common:    { min: 10,     max: 60 },
      uncommon:  { min: 50,     max: 400 },
      rare:      { min: 250,    max: 3000 },
      epic:      { min: 1500,   max: 35000 },
      legendary: { min: 8000,   max: 100000 },
      jackpot:   { min: 25000,  max: 300000 },
      mythic:    { min: 100000, max: 2000000 },
    },
    hasDescriptions: true,
  },

  // ── Vehicles ──
  {
    category: 'vehicles',
    baseNames: [
      { key: '0', icon: 'mdi:bicycle',          weight: 8,  dropWeight: 6 },  // Bicycle
      { key: '1', icon: 'mdi:motorbike',         weight: 15, dropWeight: 2 },  // Motorcycle
      { key: '2', icon: 'mdi:car-cog',           weight: 12, dropWeight: 3 },  // Car Parts
      { key: '3', icon: 'mdi:scooter-electric',  weight: 6,  dropWeight: 4 },  // Electric Scooter
      { key: '4', icon: 'mdi:go-kart',           weight: 10, dropWeight: 3 },  // Go-Kart
      { key: '5', icon: 'mdi:engine',            weight: 15, dropWeight: 2 },  // Engine
      { key: '6', icon: 'mdi:steering',          weight: 5,  dropWeight: 5 },  // Steering Wheel
      { key: '7', icon: 'mdi:car-tire-alert',    weight: 8,  dropWeight: 5 },  // Tire Set
      { key: '8', icon: 'mdi:car-seat',          weight: 6,  dropWeight: 4 },  // Car Seat
      { key: '9', icon: 'mdi:car-light-high',    weight: 3,  dropWeight: 6 },  // Headlights
      { key: '10', icon: 'mdi:sail-boat',        weight: 12, dropWeight: 2 },  // Boat Motor
      { key: '11', icon: 'mdi:atv',              weight: 8,  dropWeight: 3 },  // ATV Parts
      { key: '12', icon: 'mdi:car-cog',          weight: 10, dropWeight: 3 },  // Transmission
      { key: '13', icon: 'mdi:car-battery',      weight: 7,  dropWeight: 4 },  // Car Battery
      { key: '14', icon: 'mdi:car-door',         weight: 8,  dropWeight: 4 },  // Car Door
      { key: '15', icon: 'mdi:moped',            weight: 4,  dropWeight: 5 },  // Moped
      { key: '16', icon: 'mdi:snowflake',        weight: 12, dropWeight: 2 },  // Snowmobile Parts
    ],
    valueCurves: {
      common:    { min: 10,     max: 100 },
      uncommon:  { min: 40,     max: 400 },
      rare:      { min: 300,    max: 6000 },
      epic:      { min: 1500,   max: 30000 },
      legendary: { min: 8000,   max: 100000 },
      jackpot:   { min: 20000,  max: 250000 },
      mythic:    { min: 60000,  max: 1000000 },
    },
    hasDescriptions: true,
  },

  // ── Documents ──
  {
    category: 'documents',
    baseNames: [
      { key: '0', icon: 'mdi:image-multiple',  weight: 2, dropWeight: 8 },   // Photo Album
      { key: '1', icon: 'mdi:certificate',     weight: 1, dropWeight: 3 },   // Stock Certificates
      { key: '2', icon: 'mdi:email-seal',      weight: 1, dropWeight: 1 },   // Historical Letter
      { key: '3', icon: 'mdi:map',             weight: 2, dropWeight: 2 },   // Maps
      { key: '4', icon: 'mdi:script-text',     weight: 1, dropWeight: 4 },   // Manuscript
      { key: '5', icon: 'mdi:file-document',   weight: 1, dropWeight: 5 },   // Deed
      { key: '6', icon: 'mdi:notebook',        weight: 1, dropWeight: 6 },   // Journal
      { key: '7', icon: 'mdi:drawing-box',     weight: 1, dropWeight: 3 },   // Blueprint
      { key: '8', icon: 'mdi:post-outline',    weight: 1, dropWeight: 5 },   // Postcard
      { key: '9', icon: 'mdi:newspaper',       weight: 1, dropWeight: 7 },   // Newspaper Clipping
      { key: '10', icon: 'mdi:file-sign',      weight: 1, dropWeight: 3 },   // Signed Contract
      { key: '11', icon: 'mdi:passport',       weight: 1, dropWeight: 4 },   // Old Passport
      { key: '12', icon: 'mdi:ticket-confirmation', weight: 1, dropWeight: 6 }, // Event Ticket
      { key: '13', icon: 'mdi:receipt',        weight: 1, dropWeight: 7 },   // Vintage Receipt
      { key: '14', icon: 'mdi:book-open-page-variant', weight: 1, dropWeight: 3 }, // Patent Document
      { key: '15', icon: 'mdi:email',          weight: 1, dropWeight: 4 },   // Love Letter
      { key: '16', icon: 'mdi:file-chart',     weight: 1, dropWeight: 5 },   // War Bond
      { key: '17', icon: 'mdi:certificate',    weight: 1, dropWeight: 3 },   // Diploma
    ],
    valueCurves: {
      common:    { min: 3,      max: 25 },
      uncommon:  { min: 20,     max: 200 },
      rare:      { min: 80,     max: 1500 },
      epic:      { min: 600,    max: 10000 },
      legendary: { min: 4000,   max: 60000 },
      jackpot:   { min: 10000,  max: 150000 },
      mythic:    { min: 30000,  max: 500000 },
    },
    hasDescriptions: true,
  },

  // ── Luxury (shop-extended) ──
  {
    category: 'luxury',
    baseNames: [
      { key: '0', icon: 'mdi:bow-tie',          weight: 1, dropWeight: 7 },   // Silk Scarf
      { key: '1', icon: 'mdi:glass-cocktail',  weight: 3, dropWeight: 4 },   // Decanter
      { key: '2', icon: 'mdi:hanger',          weight: 2, dropWeight: 3 },   // Designer Coat
      { key: '3', icon: 'mdi:bag-personal',    weight: 1, dropWeight: 1 },   // Designer Bag
      { key: '4', icon: 'mdi:egg-easter',      weight: 2, dropWeight: 2 },   // Decorative Egg
      { key: '5', icon: 'mdi:bottle-tonic',    weight: 1, dropWeight: 5 },   // Perfume
      { key: '6', icon: 'mdi:cigar',           weight: 1, dropWeight: 4 },   // Cigar Box
      { key: '7', icon: 'mdi:fountain-pen-tip', weight: 1, dropWeight: 5 },  // Fountain Pen
      { key: '8', icon: 'mdi:briefcase-outline', weight: 2, dropWeight: 3 }, // Attaché Case
      { key: '9', icon: 'mdi:sunglasses',      weight: 1, dropWeight: 4 },   // Designer Shades
      { key: '10', icon: 'mdi:bottle-wine',    weight: 2, dropWeight: 3 },   // Crystal Vase
      { key: '11', icon: 'mdi:silverware-fork-knife', weight: 2, dropWeight: 4 }, // Silver Cutlery
      { key: '12', icon: 'mdi:candle',         weight: 1, dropWeight: 5 },   // Luxury Candle
      { key: '13', icon: 'mdi:necklace',       weight: 1, dropWeight: 3 },   // Cashmere Wrap
      { key: '14', icon: 'mdi:wallet',         weight: 1, dropWeight: 5 },   // Designer Wallet
      { key: '15', icon: 'mdi:cufflinks',      weight: 1, dropWeight: 4 },   // Gold Cufflinks
      { key: '16', icon: 'mdi:umbrella',       weight: 2, dropWeight: 5 },   // Parasol
      { key: '17', icon: 'mdi:chess-queen',    weight: 2, dropWeight: 3 },   // Chess Set
    ],
    valueCurves: {
      common:    { min: 20,     max: 120 },
      uncommon:  { min: 60,     max: 500 },
      rare:      { min: 200,    max: 3500 },
      epic:      { min: 1500,   max: 30000 },
      legendary: { min: 10000,  max: 250000 },
      jackpot:   { min: 50000,  max: 600000 },
      mythic:    { min: 200000, max: 12000000 },
    },
    hasDescriptions: true,
  },

  // ── Tech (shop-extended) ──
  {
    category: 'tech',
    baseNames: [
      { key: '0', icon: 'mdi:keyboard',         weight: 2, dropWeight: 10 },  // Keyboard
      { key: '1', icon: 'mdi:virtual-reality',  weight: 3, dropWeight: 6 },   // VR Headset
      { key: '2', icon: 'mdi:chip',             weight: 1, dropWeight: 4 },   // Processor
      { key: '3', icon: 'mdi:drone',            weight: 2, dropWeight: 3 },   // Drone
      { key: '4', icon: 'mdi:robot',            weight: 3, dropWeight: 2 },   // Robot Kit
      { key: '5', icon: 'mdi:server',           weight: 8, dropWeight: 3 },   // Server Rack
      { key: '6', icon: 'mdi:monitor',          weight: 4, dropWeight: 7 },   // Monitor
      { key: '7', icon: 'mdi:memory',           weight: 1, dropWeight: 6 },   // RAM Module
      { key: '8', icon: 'mdi:harddisk',         weight: 2, dropWeight: 7 },   // Hard Drive
      { key: '9', icon: 'mdi:usb',              weight: 1, dropWeight: 8 },   // USB Hub
      { key: '10', icon: 'mdi:gpu',             weight: 2, dropWeight: 4 },   // Graphics Card
      { key: '11', icon: 'mdi:network',         weight: 3, dropWeight: 5 },   // Network Switch
      { key: '12', icon: 'mdi:printer-3d',      weight: 4, dropWeight: 3 },   // 3D Printer
      { key: '13', icon: 'mdi:tablet',          weight: 2, dropWeight: 6 },   // Tablet
      { key: '14', icon: 'mdi:smartwatch',      weight: 1, dropWeight: 5 },   // Smartwatch
      { key: '15', icon: 'mdi:raspberry-pi',    weight: 1, dropWeight: 7 },   // Single Board PC
      { key: '16', icon: 'mdi:solar-panel',     weight: 4, dropWeight: 3 },   // Solar Panel
      { key: '17', icon: 'mdi:power-plug',      weight: 2, dropWeight: 6 },   // Power Supply
    ],
    valueCurves: {
      common:    { min: 15,     max: 150 },
      uncommon:  { min: 80,     max: 600 },
      rare:      { min: 300,    max: 3000 },
      epic:      { min: 1500,   max: 15000 },
      legendary: { min: 5000,   max: 60000 },
      jackpot:   { min: 15000,  max: 150000 },
      mythic:    { min: 40000,  max: 500000 },
    },
    hasDescriptions: true,
  },

  // ── Memorabilia (shop-extended) ──
  {
    category: 'memorabilia',
    baseNames: [
      { key: '0', icon: 'mdi:star-shooting',  weight: 2, dropWeight: 5 },   // Movie Prop
      { key: '1', icon: 'mdi:movie-open',     weight: 2, dropWeight: 4 },   // Film Reel
      { key: '2', icon: 'mdi:ticket',         weight: 1, dropWeight: 6 },   // Concert Ticket
      { key: '3', icon: 'mdi:microphone',     weight: 2, dropWeight: 3 },   // Signed Mic
      { key: '4', icon: 'mdi:television',     weight: 3, dropWeight: 4 },   // TV Prop
      { key: '5', icon: 'mdi:music-circle',   weight: 1, dropWeight: 5 },   // Gold Record
      { key: '6', icon: 'mdi:tshirt-crew',    weight: 1, dropWeight: 5 },   // Band T-Shirt
      { key: '7', icon: 'mdi:movie',          weight: 2, dropWeight: 4 },   // Movie Poster
      { key: '8', icon: 'mdi:pen',            weight: 1, dropWeight: 5 },   // Celebrity Autograph
      { key: '9', icon: 'mdi:guitar-acoustic', weight: 3, dropWeight: 2 },  // Stage Guitar
      { key: '10', icon: 'mdi:disc',          weight: 1, dropWeight: 6 },   // Demo Tape
      { key: '11', icon: 'mdi:image-frame',   weight: 2, dropWeight: 4 },   // Press Photo
      { key: '12', icon: 'mdi:head',          weight: 3, dropWeight: 3 },   // Costume Mask
      { key: '13', icon: 'mdi:script-text',   weight: 1, dropWeight: 4 },   // Script Page
      { key: '14', icon: 'mdi:shoe-formal',   weight: 2, dropWeight: 3 },   // Worn Stage Shoes
      { key: '15', icon: 'mdi:clapper',       weight: 2, dropWeight: 4 },   // Clapperboard
      { key: '16', icon: 'mdi:seat',          weight: 4, dropWeight: 2 },   // Director's Chair
      { key: '17', icon: 'mdi:badge-account', weight: 1, dropWeight: 5 },   // Backstage Pass
    ],
    valueCurves: {
      common:    { min: 10,    max: 80 },
      uncommon:  { min: 50,    max: 400 },
      rare:      { min: 200,   max: 3000 },
      epic:      { min: 1000,  max: 15000 },
      legendary: { min: 5000,  max: 80000 },
      jackpot:   { min: 15000, max: 200000 },
      mythic:    { min: 40000, max: 800000 },
    },
    hasDescriptions: true,
  },

  // ── Gems (shop-extended) ──
  {
    category: 'gems',
    baseNames: [
      { key: '0', icon: 'mdi:diamond',          weight: 1, dropWeight: 4 },  // Diamond
      { key: '1', icon: 'mdi:diamond-outline',  weight: 1, dropWeight: 5 },  // Ruby
      { key: '2', icon: 'mdi:hexagon',          weight: 1, dropWeight: 6 },  // Emerald
      { key: '3', icon: 'mdi:octagon',          weight: 1, dropWeight: 5 },  // Sapphire
      { key: '4', icon: 'mdi:circle',           weight: 1, dropWeight: 7 },  // Pearl
      { key: '5', icon: 'mdi:rhombus',          weight: 1, dropWeight: 3 },  // Opal
      { key: '6', icon: 'mdi:hexagon-outline',  weight: 1, dropWeight: 5 },  // Amethyst
      { key: '7', icon: 'mdi:pentagon',         weight: 1, dropWeight: 5 },  // Topaz
      { key: '8', icon: 'mdi:circle-outline',   weight: 1, dropWeight: 6 },  // Garnet
      { key: '9', icon: 'mdi:diamond',          weight: 1, dropWeight: 4 },  // Tanzanite
      { key: '10', icon: 'mdi:rhombus-outline', weight: 1, dropWeight: 4 },  // Alexandrite
      { key: '11', icon: 'mdi:hexagon',         weight: 1, dropWeight: 6 },  // Turquoise
      { key: '12', icon: 'mdi:octagon-outline', weight: 1, dropWeight: 5 },  // Aquamarine
      { key: '13', icon: 'mdi:diamond-outline', weight: 1, dropWeight: 3 },  // Morganite
      { key: '14', icon: 'mdi:circle',          weight: 1, dropWeight: 6 },  // Jade Stone
      { key: '15', icon: 'mdi:pentagon-outline', weight: 1, dropWeight: 4 }, // Lapis Lazuli
      { key: '16', icon: 'mdi:hexagon',         weight: 1, dropWeight: 5 },  // Citrine
      { key: '17', icon: 'mdi:diamond',         weight: 1, dropWeight: 3 },  // Black Diamond
    ],
    valueCurves: {
      common:    { min: 20,     max: 100 },
      uncommon:  { min: 80,     max: 500 },
      rare:      { min: 400,    max: 4000 },
      epic:      { min: 2000,   max: 25000 },
      legendary: { min: 10000,  max: 150000 },
      jackpot:   { min: 30000,  max: 400000 },
      mythic:    { min: 100000, max: 2000000 },
    },
    hasDescriptions: true,
  },

  // ── Watches (shop-extended) ──
  {
    category: 'watches',
    baseNames: [
      { key: '0', icon: 'mdi:watch',           weight: 1, dropWeight: 6 },   // Wristwatch
      { key: '1', icon: 'mdi:clock-outline',   weight: 1, dropWeight: 4 },   // Pocket Watch
      { key: '2', icon: 'mdi:clock-digital',   weight: 1, dropWeight: 7 },   // Digital Watch
      { key: '3', icon: 'mdi:timer-outline',   weight: 1, dropWeight: 3 },   // Chronograph
      { key: '4', icon: 'mdi:clock-star-four-points', weight: 1, dropWeight: 2 },  // Tourbillon
      { key: '5', icon: 'mdi:watch',           weight: 1, dropWeight: 5 },   // Diver's Watch
      { key: '6', icon: 'mdi:clock-outline',   weight: 1, dropWeight: 4 },   // Pilot's Watch
      { key: '7', icon: 'mdi:timer-outline',   weight: 1, dropWeight: 3 },   // Moonphase
      { key: '8', icon: 'mdi:watch',           weight: 1, dropWeight: 5 },   // Field Watch
      { key: '9', icon: 'mdi:clock-digital',   weight: 1, dropWeight: 6 },   // Smartwatch
      { key: '10', icon: 'mdi:watch',          weight: 1, dropWeight: 4 },   // Dress Watch
      { key: '11', icon: 'mdi:timer-outline',  weight: 1, dropWeight: 3 },   // Perpetual Calendar
      { key: '12', icon: 'mdi:clock-star-four-points', weight: 1, dropWeight: 2 }, // Minute Repeater
      { key: '13', icon: 'mdi:watch',          weight: 1, dropWeight: 5 },   // Racing Watch
      { key: '14', icon: 'mdi:clock-outline',  weight: 1, dropWeight: 4 },   // Skeleton Watch
    ],
    valueCurves: {
      common:    { min: 15,     max: 80 },
      uncommon:  { min: 60,     max: 400 },
      rare:      { min: 300,    max: 5000 },
      epic:      { min: 2000,   max: 30000 },
      legendary: { min: 10000,  max: 200000 },
      jackpot:   { min: 40000,  max: 500000 },
      mythic:    { min: 100000, max: 3000000 },
    },
    hasDescriptions: true,
  },

  // ── Wine (shop-extended) ──
  {
    category: 'wine',
    baseNames: [
      { key: '0', icon: 'mdi:glass-wine',       weight: 2, dropWeight: 7 },  // Red Wine
      { key: '1', icon: 'mdi:glass-tulip',       weight: 2, dropWeight: 6 },  // White Wine
      { key: '2', icon: 'mdi:bottle-wine',       weight: 3, dropWeight: 4 },  // Champagne
      { key: '3', icon: 'mdi:barrel',            weight: 5, dropWeight: 3 },  // Wine Barrel
      { key: '4', icon: 'mdi:bottle-wine-outline', weight: 2, dropWeight: 2 },// Rare Vintage
      { key: '5', icon: 'mdi:glass-wine',        weight: 2, dropWeight: 5 },  // Rosé
      { key: '6', icon: 'mdi:bottle-wine',       weight: 3, dropWeight: 4 },  // Port Wine
      { key: '7', icon: 'mdi:glass-tulip',       weight: 2, dropWeight: 5 },  // Riesling
      { key: '8', icon: 'mdi:bottle-wine',       weight: 2, dropWeight: 4 },  // Burgundy
      { key: '9', icon: 'mdi:glass-wine',        weight: 2, dropWeight: 5 },  // Merlot
      { key: '10', icon: 'mdi:bottle-wine',      weight: 2, dropWeight: 4 },  // Bordeaux
      { key: '11', icon: 'mdi:glass-tulip',      weight: 2, dropWeight: 5 },  // Prosecco
      { key: '12', icon: 'mdi:bottle-wine',      weight: 2, dropWeight: 3 },  // Cognac
      { key: '13', icon: 'mdi:glass-cocktail',   weight: 2, dropWeight: 4 },  // Brandy
      { key: '14', icon: 'mdi:bottle-wine-outline', weight: 2, dropWeight: 3 }, // Scotch Whisky
    ],
    valueCurves: {
      common:    { min: 10,     max: 50 },
      uncommon:  { min: 40,     max: 300 },
      rare:      { min: 150,    max: 2500 },
      epic:      { min: 800,    max: 12000 },
      legendary: { min: 4000,   max: 60000 },
      jackpot:   { min: 15000,  max: 200000 },
      mythic:    { min: 50000,  max: 1000000 },
    },
    hasDescriptions: true,
  },

  // ── Sneakers (shop-extended) ──
  {
    category: 'sneakers',
    baseNames: [
      { key: '0', icon: 'mdi:shoe-sneaker',   weight: 1, dropWeight: 8 },   // Sneakers
      { key: '1', icon: 'mdi:shoe-formal',    weight: 1, dropWeight: 5 },   // Jordans
      { key: '2', icon: 'mdi:shoe-print',     weight: 1, dropWeight: 3 },   // Limited Drop
      { key: '3', icon: 'mdi:shoe-cleat',     weight: 1, dropWeight: 4 },   // Sports Shoes
      { key: '4', icon: 'mdi:shoe-sneaker',   weight: 1, dropWeight: 6 },   // High Tops
      { key: '5', icon: 'mdi:shoe-sneaker',   weight: 1, dropWeight: 5 },   // Runners
      { key: '6', icon: 'mdi:shoe-formal',    weight: 1, dropWeight: 4 },   // Retro Kicks
      { key: '7', icon: 'mdi:shoe-sneaker',   weight: 1, dropWeight: 3 },   // Collab Edition
      { key: '8', icon: 'mdi:shoe-print',     weight: 1, dropWeight: 4 },   // Platform Sneakers
      { key: '9', icon: 'mdi:shoe-sneaker',   weight: 1, dropWeight: 5 },   // Skate Shoes
      { key: '10', icon: 'mdi:shoe-sneaker',  weight: 1, dropWeight: 6 },   // Canvas Shoes
      { key: '11', icon: 'mdi:shoe-formal',   weight: 1, dropWeight: 3 },   // Designer Kicks
    ],
    valueCurves: {
      common:    { min: 15,    max: 80 },
      uncommon:  { min: 60,    max: 400 },
      rare:      { min: 200,   max: 2500 },
      epic:      { min: 1000,  max: 12000 },
      legendary: { min: 4000,  max: 50000 },
      jackpot:   { min: 10000, max: 100000 },
      mythic:    { min: 25000, max: 300000 },
    },
    hasDescriptions: true,
  },

  // ── Cards (shop-extended) ──
  {
    category: 'cards',
    baseNames: [
      { key: '0', icon: 'mdi:cards-playing',   weight: 1, dropWeight: 7 },  // Playing Cards
      { key: '1', icon: 'mdi:cards',            weight: 1, dropWeight: 5 },  // Trading Cards
      { key: '2', icon: 'mdi:card-account-details', weight: 1, dropWeight: 3 }, // Sports Card
      { key: '3', icon: 'mdi:cards-heart',      weight: 1, dropWeight: 4 },  // Rare Card
      { key: '4', icon: 'mdi:cards-spade',      weight: 1, dropWeight: 5 },  // Pokemon Card
      { key: '5', icon: 'mdi:cards-diamond',    weight: 1, dropWeight: 4 },  // Magic Card
      { key: '6', icon: 'mdi:cards-club',       weight: 1, dropWeight: 5 },  // Yugioh Card
      { key: '7', icon: 'mdi:cards-playing',    weight: 1, dropWeight: 3 },  // Tarot Deck
      { key: '8', icon: 'mdi:cards',            weight: 1, dropWeight: 6 },  // Baseball Card
      { key: '9', icon: 'mdi:card-account-details', weight: 1, dropWeight: 4 }, // Graded Card
      { key: '10', icon: 'mdi:cards-heart',     weight: 1, dropWeight: 3 },  // Holographic Card
      { key: '11', icon: 'mdi:cards-playing',   weight: 1, dropWeight: 5 },  // Vintage Deck
    ],
    valueCurves: {
      common:    { min: 5,     max: 30 },
      uncommon:  { min: 20,    max: 200 },
      rare:      { min: 100,   max: 2000 },
      epic:      { min: 500,   max: 8000 },
      legendary: { min: 2000,  max: 40000 },
      jackpot:   { min: 8000,  max: 120000 },
      mythic:    { min: 20000, max: 500000 },
    },
    hasDescriptions: true,
  },

  // ── Coins (shop-extended) ──
  {
    category: 'coins',
    baseNames: [
      { key: '0', icon: 'mdi:circle-multiple',  weight: 1, dropWeight: 7 },  // Coin Set
      { key: '1', icon: 'mdi:cash-100',         weight: 1, dropWeight: 5 },  // Gold Coin
      { key: '2', icon: 'mdi:hand-coin',         weight: 1, dropWeight: 4 },  // Ancient Coin
      { key: '3', icon: 'mdi:currency-usd-circle', weight: 1, dropWeight: 3 }, // Rare Mint
      { key: '4', icon: 'mdi:circle-multiple',  weight: 1, dropWeight: 5 },  // Silver Dollar
      { key: '5', icon: 'mdi:hand-coin',        weight: 1, dropWeight: 4 },  // Roman Coin
      { key: '6', icon: 'mdi:cash-100',         weight: 1, dropWeight: 5 },  // Doubloon
      { key: '7', icon: 'mdi:circle-multiple',  weight: 1, dropWeight: 6 },  // Proof Set
      { key: '8', icon: 'mdi:hand-coin',        weight: 1, dropWeight: 3 },  // Greek Drachma
      { key: '9', icon: 'mdi:currency-usd-circle', weight: 1, dropWeight: 4 }, // Morgan Dollar
      { key: '10', icon: 'mdi:circle-multiple', weight: 1, dropWeight: 5 },  // Commemorative
      { key: '11', icon: 'mdi:cash-100',        weight: 1, dropWeight: 3 },  // Gold Sovereign
    ],
    valueCurves: {
      common:    { min: 5,      max: 30 },
      uncommon:  { min: 25,     max: 200 },
      rare:      { min: 100,    max: 1500 },
      epic:      { min: 500,    max: 8000 },
      legendary: { min: 3000,   max: 50000 },
      jackpot:   { min: 10000,  max: 120000 },
      mythic:    { min: 30000,  max: 500000 },
    },
    hasDescriptions: true,
  },

  // ── Maps (shop-extended) ──
  {
    category: 'maps',
    baseNames: [
      { key: '0', icon: 'mdi:map',             weight: 2, dropWeight: 6 },   // Map
      { key: '1', icon: 'mdi:map-legend',       weight: 1, dropWeight: 4 },  // Navigation Chart
      { key: '2', icon: 'mdi:compass',          weight: 1, dropWeight: 3 },  // Globe
      { key: '3', icon: 'mdi:earth',            weight: 2, dropWeight: 2 },  // Atlas
      { key: '4', icon: 'mdi:map-marker',       weight: 1, dropWeight: 5 },  // Treasure Map
      { key: '5', icon: 'mdi:map-outline',      weight: 1, dropWeight: 4 },  // Star Chart
      { key: '6', icon: 'mdi:map',              weight: 2, dropWeight: 3 },  // Nautical Map
      { key: '7', icon: 'mdi:compass-rose',     weight: 1, dropWeight: 4 },  // Compass Rose
      { key: '8', icon: 'mdi:map-marker-path',  weight: 1, dropWeight: 3 },  // Explorer's Map
      { key: '9', icon: 'mdi:earth',            weight: 2, dropWeight: 3 },  // Celestial Globe
      { key: '10', icon: 'mdi:map-legend',      weight: 1, dropWeight: 4 },  // Topographic Map
      { key: '11', icon: 'mdi:map',             weight: 1, dropWeight: 5 },  // City Plan
    ],
    valueCurves: {
      common:    { min: 5,     max: 40 },
      uncommon:  { min: 30,    max: 250 },
      rare:      { min: 150,   max: 2000 },
      epic:      { min: 600,   max: 10000 },
      legendary: { min: 3000,  max: 50000 },
      jackpot:   { min: 10000, max: 120000 },
      mythic:    { min: 25000, max: 400000 },
    },
    hasDescriptions: true,
  },

  // ── Manuscripts (shop-extended) ──
  {
    category: 'manuscripts',
    baseNames: [
      { key: '0', icon: 'mdi:book-lock',       weight: 1, dropWeight: 4 },   // Manuscript
      { key: '1', icon: 'mdi:script-text',     weight: 1, dropWeight: 3 },   // Scroll
      { key: '2', icon: 'mdi:book-open-page-variant', weight: 1, dropWeight: 5 }, // Codex
      { key: '3', icon: 'mdi:fountain-pen-tip', weight: 1, dropWeight: 2 },   // Original Script
      { key: '4', icon: 'mdi:book-lock',       weight: 1, dropWeight: 3 },   // Grimoire
      { key: '5', icon: 'mdi:script-text',     weight: 1, dropWeight: 4 },   // Illuminated Text
      { key: '6', icon: 'mdi:book-open-page-variant', weight: 1, dropWeight: 3 }, // Incunabulum
      { key: '7', icon: 'mdi:notebook',        weight: 1, dropWeight: 5 },   // Field Notes
      { key: '8', icon: 'mdi:book-lock',       weight: 1, dropWeight: 3 },   // Psalter
      { key: '9', icon: 'mdi:script-text',     weight: 1, dropWeight: 4 },   // Calligraphy
      { key: '10', icon: 'mdi:book-open-page-variant', weight: 1, dropWeight: 3 }, // Folio
      { key: '11', icon: 'mdi:fountain-pen-tip', weight: 1, dropWeight: 2 },  // Treatise
    ],
    valueCurves: {
      common:    { min: 8,      max: 50 },
      uncommon:  { min: 40,     max: 350 },
      rare:      { min: 200,    max: 3000 },
      epic:      { min: 1000,   max: 15000 },
      legendary: { min: 5000,   max: 80000 },
      jackpot:   { min: 15000,  max: 200000 },
      mythic:    { min: 40000,  max: 800000 },
    },
    hasDescriptions: true,
  },
]

// ─── Lookup helpers ─────────────────────────────────────────────

const _blueprintMap = new Map<string, CategoryBlueprint>()
for (const bp of CATEGORY_BLUEPRINTS) {
  _blueprintMap.set(bp.category, bp)
}

/** Get the blueprint for a given category (O(1) lookup). */
export function getBlueprint(category: ItemCategory): CategoryBlueprint | undefined {
  return _blueprintMap.get(category)
}

/**
 * Get all categories that have blueprints.
 * Useful for the shop to know which categories can generate items.
 */
export function getBlueprintCategories(): ItemCategory[] {
  return CATEGORY_BLUEPRINTS.map(bp => bp.category)
}
