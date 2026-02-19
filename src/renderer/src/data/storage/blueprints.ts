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
      { key: '7', icon: 'mdi:guitar-electric',  weight: 4,  dropWeight: 4 }, // Electric Guitar
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
