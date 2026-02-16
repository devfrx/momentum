/**
 * Online Shop — Item catalog and procedural item generation
 *
 * Extends the storage wars item system with a much larger catalog
 * designed for buy/sell trading. Includes unique/legendary items,
 * procedural naming, and enormous value ranges for rare finds.
 *
 * Reuses the existing StorageItem interface and rarity system.
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'
import type { Rarity } from '../rarity'
import type { ItemCategory, ItemCondition, StorageItem } from '../storage/items'
import {
  SHOP_RARITY_WEIGHTS,
  UNIQUE_ITEM_CHANCE,
  SHOP_BUY_MARKUP,
  FLASH_SALE_CHANCE,
  FLASH_SALE_DISCOUNT,
  SHOP_CONDITION_WEIGHTS,
} from './balance'
import { CONDITION_MULTIPLIERS } from './restoration'

// ─── Extended Categories ────────────────────────────────────────

/**
 * Shop items use the same ItemCategory from storage.
 * All extended categories are now part of ItemCategory itself.
 */
export type ShopCategory = ItemCategory

/** All categories available in the shop. */
export const SHOP_CATEGORIES: ShopCategory[] = [
  'furniture', 'electronics', 'clothing', 'tools',
  'collectibles', 'art', 'jewelry', 'antiques',
  'sports', 'instruments', 'vehicles', 'documents',
  'luxury', 'tech', 'memorabilia', 'gems',
  'watches', 'wine', 'sneakers', 'cards',
  'coins', 'maps', 'manuscripts',
]

export const SHOP_CATEGORY_ICONS: Record<string, string> = {
  furniture: 'mdi:sofa',
  electronics: 'mdi:laptop',
  clothing: 'mdi:tshirt-crew',
  tools: 'mdi:toolbox',
  collectibles: 'mdi:cards',
  art: 'mdi:palette',
  jewelry: 'mdi:ring',
  antiques: 'mdi:clock-outline',
  sports: 'mdi:trophy',
  instruments: 'mdi:guitar-acoustic',
  vehicles: 'mdi:car-cog',
  documents: 'mdi:certificate',
  luxury: 'mdi:diamond-stone',
  tech: 'mdi:chip',
  memorabilia: 'mdi:star-shooting',
  gems: 'mdi:diamond',
  watches: 'mdi:watch',
  wine: 'mdi:glass-wine',
  sneakers: 'mdi:shoe-sneaker',
  cards: 'mdi:cards-playing',
  coins: 'mdi:circle-multiple',
  maps: 'mdi:map',
  manuscripts: 'mdi:book-lock',
}

// ─── Shop Listing ───────────────────────────────────────────────

export interface ShopListing {
  /** Unique listing ID. */
  id: string
  /** The item for sale. */
  item: StorageItem
  /** Shop asking price (markup applied). */
  price: Decimal
  /** Original base value before markup. */
  basePrice: Decimal
  /** Whether this is a flash sale. */
  flashSale: boolean
  /** Flash sale discount percentage (0–1). */
  discount: number
  /** Whether this is a unique one-time item. */
  unique: boolean
  /** Tick when listing was added to the shop. */
  listedAtTick: number
  /** Number of times this item has been viewed. */
  views: number
}

// ─── Extended Item Templates ────────────────────────────────────

interface ShopItemTemplate {
  name: string
  icon: string
  category: ShopCategory
  rarity: Rarity
  minValue: number
  maxValue: number
  description: string
  weight: number
  dropWeight: number
}

/**
 * Massive item pool for the online shop — includes all storage wars items
 * plus hundreds of additional templates for variety.
 */
export const SHOP_ITEM_POOL: ShopItemTemplate[] = [
  // ─── Luxury ────────────────────────────────────────────────
  { name: 'Silk Scarf', icon: 'mdi:scarf', category: 'luxury', rarity: 'uncommon', minValue: 80, maxValue: 400, description: 'A fine silk scarf from a boutique.', weight: 1, dropWeight: 7 },
  { name: 'Crystal Decanter', icon: 'mdi:glass-cocktail', category: 'luxury', rarity: 'rare', minValue: 200, maxValue: 1500, description: 'Hand-cut lead crystal decanter.', weight: 3, dropWeight: 4 },
  { name: 'Cashmere Coat', icon: 'mdi:hanger', category: 'luxury', rarity: 'rare', minValue: 500, maxValue: 3000, description: 'Premium cashmere winter coat.', weight: 2, dropWeight: 3 },
  { name: 'Hermès Birkin Bag', icon: 'mdi:bag-personal', category: 'luxury', rarity: 'legendary', minValue: 15000, maxValue: 200000, description: 'The most sought-after handbag in the world.', weight: 1, dropWeight: 1 },
  { name: 'Fabergé Egg Replica', icon: 'mdi:egg-easter', category: 'luxury', rarity: 'epic', minValue: 2000, maxValue: 25000, description: 'Exquisite replica of a Fabergé Imperial Egg.', weight: 2, dropWeight: 2 },
  { name: 'Genuine Fabergé Egg', icon: 'mdi:egg-easter', category: 'luxury', rarity: 'mythic', minValue: 500000, maxValue: 10000000, description: 'An authentic Fabergé Imperial Egg — priceless!', weight: 2, dropWeight: 1 },

  // ─── Tech ──────────────────────────────────────────────────
  { name: 'Mechanical Keyboard', icon: 'mdi:keyboard', category: 'tech', rarity: 'common', minValue: 30, maxValue: 150, description: 'Cherry MX mechanical keyboard.', weight: 2, dropWeight: 10 },
  { name: 'VR Headset', icon: 'mdi:virtual-reality', category: 'tech', rarity: 'uncommon', minValue: 100, maxValue: 500, description: 'High-end virtual reality headset.', weight: 3, dropWeight: 6 },
  { name: 'Rare GPU', icon: 'mdi:expansion-card', category: 'tech', rarity: 'rare', minValue: 400, maxValue: 3000, description: 'A limited-edition graphics card, highly sought after.', weight: 3, dropWeight: 3 },
  { name: 'Quantum Computing Module', icon: 'mdi:chip', category: 'tech', rarity: 'legendary', minValue: 10000, maxValue: 150000, description: 'Experimental quantum processing module — the future is here.', weight: 2, dropWeight: 1 },
  { name: 'Apple I Original', icon: 'mdi:desktop-classic', category: 'tech', rarity: 'mythic', minValue: 200000, maxValue: 5000000, description: 'An original Apple I computer, hand-built by Wozniak!', weight: 5, dropWeight: 1 },

  // ─── Memorabilia ───────────────────────────────────────────
  { name: 'Movie Poster (Signed)', icon: 'mdi:movie', category: 'memorabilia', rarity: 'uncommon', minValue: 50, maxValue: 300, description: 'A signed movie poster from a cult classic.', weight: 1, dropWeight: 6 },
  { name: 'Concert Ticket Stub Collection', icon: 'mdi:ticket', category: 'memorabilia', rarity: 'uncommon', minValue: 30, maxValue: 200, description: 'Ticket stubs from legendary concerts.', weight: 1, dropWeight: 7 },
  { name: 'Space Shuttle Part', icon: 'mdi:rocket', category: 'memorabilia', rarity: 'epic', minValue: 3000, maxValue: 50000, description: 'Authentic piece from a NASA Space Shuttle.', weight: 4, dropWeight: 1 },
  { name: 'Moon Rock Fragment', icon: 'mdi:meteor', category: 'memorabilia', rarity: 'mythic', minValue: 1000000, maxValue: 50000000, description: 'A certified lunar sample — literally out of this world!', weight: 1, dropWeight: 1 },
  { name: 'Olympic Gold Medal', icon: 'mdi:medal', category: 'memorabilia', rarity: 'legendary', minValue: 20000, maxValue: 500000, description: 'A genuine Olympic gold medal from a historic games.', weight: 1, dropWeight: 1 },

  // ─── Gems ──────────────────────────────────────────────────
  { name: 'Rough Amethyst', icon: 'mdi:diamond', category: 'gems', rarity: 'common', minValue: 10, maxValue: 60, description: 'An uncut amethyst crystal.', weight: 1, dropWeight: 10 },
  { name: 'Sapphire', icon: 'mdi:diamond', category: 'gems', rarity: 'rare', minValue: 300, maxValue: 3000, description: 'A polished blue sapphire of good clarity.', weight: 1, dropWeight: 3 },
  { name: 'Emerald', icon: 'mdi:diamond', category: 'gems', rarity: 'epic', minValue: 1500, maxValue: 15000, description: 'A vibrant Colombian emerald.', weight: 1, dropWeight: 2 },
  { name: 'Flawless Diamond', icon: 'mdi:diamond-stone', category: 'gems', rarity: 'legendary', minValue: 25000, maxValue: 500000, description: 'A flawless, colorless diamond of exceptional cut.', weight: 1, dropWeight: 1 },
  { name: 'Hope Diamond Shard', icon: 'mdi:diamond-stone', category: 'gems', rarity: 'mythic', minValue: 5000000, maxValue: 100000000, description: 'A fragment said to be from the legendary Hope Diamond!', weight: 1, dropWeight: 1 },

  // ─── Watches ───────────────────────────────────────────────
  { name: 'Casio Digital Watch', icon: 'mdi:watch', category: 'watches', rarity: 'common', minValue: 15, maxValue: 60, description: 'An iconic cheap digital watch.', weight: 1, dropWeight: 12 },
  { name: 'Seiko Automatic', icon: 'mdi:watch', category: 'watches', rarity: 'uncommon', minValue: 100, maxValue: 500, description: 'A reliable Japanese automatic watch.', weight: 1, dropWeight: 6 },
  { name: 'Omega Speedmaster', icon: 'mdi:watch', category: 'watches', rarity: 'rare', minValue: 3000, maxValue: 12000, description: 'The Moonwatch — worn on the lunar surface.', weight: 1, dropWeight: 3 },
  { name: 'Rolex Submariner', icon: 'mdi:watch', category: 'watches', rarity: 'epic', minValue: 8000, maxValue: 40000, description: 'The iconic diving watch, in excellent condition.', weight: 1, dropWeight: 2 },
  { name: 'Patek Philippe Nautilus', icon: 'mdi:watch', category: 'watches', rarity: 'legendary', minValue: 50000, maxValue: 500000, description: 'One of the most coveted watches in existence.', weight: 1, dropWeight: 1 },
  { name: 'Paul Newman Daytona', icon: 'mdi:watch', category: 'watches', rarity: 'mythic', minValue: 2000000, maxValue: 20000000, description: 'THE Paul Newman Rolex Daytona — worth a fortune!', weight: 1, dropWeight: 1 },

  // ─── Wine ──────────────────────────────────────────────────
  { name: 'House Red Wine', icon: 'mdi:glass-wine', category: 'wine', rarity: 'common', minValue: 5, maxValue: 25, description: 'A basic table wine.', weight: 2, dropWeight: 12 },
  { name: 'Bordeaux 2010', icon: 'mdi:glass-wine', category: 'wine', rarity: 'uncommon', minValue: 50, maxValue: 250, description: 'A fine Bordeaux from a good vintage.', weight: 2, dropWeight: 6 },
  { name: 'Château Margaux 1996', icon: 'mdi:glass-wine', category: 'wine', rarity: 'rare', minValue: 300, maxValue: 2000, description: 'A premier grand cru classé.', weight: 2, dropWeight: 3 },
  { name: 'Penfolds Grange 1951', icon: 'mdi:glass-wine', category: 'wine', rarity: 'epic', minValue: 5000, maxValue: 50000, description: 'The inaugural vintage of Australia\'s finest.', weight: 2, dropWeight: 1 },
  { name: 'Romanée-Conti 1945', icon: 'mdi:glass-wine', category: 'wine', rarity: 'legendary', minValue: 100000, maxValue: 1000000, description: 'One of fewer than 600 bottles ever produced.', weight: 2, dropWeight: 1 },
  { name: 'Shipwrecked Champagne 1820', icon: 'mdi:glass-wine', category: 'wine', rarity: 'mythic', minValue: 2000000, maxValue: 50000000, description: 'Champagne recovered from a 200-year-old Baltic shipwreck!', weight: 2, dropWeight: 1 },

  // ─── Sneakers ──────────────────────────────────────────────
  { name: 'Generic Sneakers', icon: 'mdi:shoe-sneaker', category: 'sneakers', rarity: 'common', minValue: 10, maxValue: 50, description: 'Basic athletic shoes.', weight: 2, dropWeight: 12 },
  { name: 'Nike Dunk Low', icon: 'mdi:shoe-sneaker', category: 'sneakers', rarity: 'uncommon', minValue: 80, maxValue: 300, description: 'A popular retro silhouette.', weight: 2, dropWeight: 6 },
  { name: 'Air Jordan 1 Retro', icon: 'mdi:shoe-sneaker', category: 'sneakers', rarity: 'rare', minValue: 200, maxValue: 1500, description: 'The original Jordan 1, deadstock condition.', weight: 2, dropWeight: 3 },
  { name: 'Yeezy 750 Sample', icon: 'mdi:shoe-sneaker', category: 'sneakers', rarity: 'epic', minValue: 2000, maxValue: 15000, description: 'A pre-production sample, never released.', weight: 2, dropWeight: 2 },
  { name: 'Nike MAG Back to the Future', icon: 'mdi:shoe-sneaker', category: 'sneakers', rarity: 'legendary', minValue: 20000, maxValue: 200000, description: 'Self-lacing sneakers from a limited charity auction.', weight: 2, dropWeight: 1 },

  // ─── Trading Cards ─────────────────────────────────────────
  { name: 'Common Trading Card Pack', icon: 'mdi:cards', category: 'cards', rarity: 'common', minValue: 5, maxValue: 30, description: 'A sealed pack of trading cards.', weight: 1, dropWeight: 12 },
  { name: 'Holographic Rare Card', icon: 'mdi:cards', category: 'cards', rarity: 'uncommon', minValue: 20, maxValue: 150, description: 'A shiny holographic card from a popular TCG.', weight: 1, dropWeight: 6 },
  { name: 'First Edition Charizard', icon: 'mdi:cards', category: 'cards', rarity: 'epic', minValue: 5000, maxValue: 50000, description: 'A first edition base set Charizard — the holy grail.', weight: 1, dropWeight: 2 },
  { name: 'PSA 10 Black Lotus', icon: 'mdi:cards-playing', category: 'cards', rarity: 'mythic', minValue: 100000, maxValue: 5000000, description: 'A perfect-graded Alpha Black Lotus. Absurdly rare.', weight: 1, dropWeight: 1 },
  { name: 'Mickey Mantle 1952 Topps', icon: 'mdi:cards', category: 'cards', rarity: 'legendary', minValue: 50000, maxValue: 2000000, description: 'The most valuable baseball card in existence.', weight: 1, dropWeight: 1 },

  // ─── Coins ─────────────────────────────────────────────────
  { name: 'Wheat Penny', icon: 'mdi:circle-multiple', category: 'coins', rarity: 'common', minValue: 2, maxValue: 15, description: 'A common wheat penny.', weight: 1, dropWeight: 15 },
  { name: 'Buffalo Nickel', icon: 'mdi:circle-multiple', category: 'coins', rarity: 'uncommon', minValue: 20, maxValue: 100, description: 'A classic American coin.', weight: 1, dropWeight: 6 },
  { name: 'Morgan Silver Dollar', icon: 'mdi:circle-multiple', category: 'coins', rarity: 'rare', minValue: 100, maxValue: 1000, description: 'A beautiful 19th-century silver dollar.', weight: 1, dropWeight: 3 },
  { name: 'Double Eagle Gold Coin', icon: 'mdi:circle-multiple', category: 'coins', rarity: 'epic', minValue: 2000, maxValue: 25000, description: 'A $20 gold piece in excellent condition.', weight: 1, dropWeight: 2 },
  { name: '1933 Double Eagle', icon: 'mdi:circle-multiple', category: 'coins', rarity: 'mythic', minValue: 5000000, maxValue: 20000000, description: 'The most valuable coin in the world — only one in private hands!', weight: 1, dropWeight: 1 },

  // ─── Maps ──────────────────────────────────────────────────
  { name: 'Tourist Map', icon: 'mdi:map', category: 'maps', rarity: 'common', minValue: 2, maxValue: 10, description: 'A foldable tourist map.', weight: 1, dropWeight: 12 },
  { name: 'Antique Maritime Chart', icon: 'mdi:map', category: 'maps', rarity: 'rare', minValue: 200, maxValue: 2000, description: 'A nautical chart from the age of sail.', weight: 1, dropWeight: 3 },
  { name: 'Treasure Map Fragment', icon: 'mdi:map-marker-question', category: 'maps', rarity: 'epic', minValue: 5000, maxValue: 50000, description: 'An old parchment that might lead to buried treasure...', weight: 1, dropWeight: 1 },
  { name: 'Columbus Navigation Map', icon: 'mdi:map', category: 'maps', rarity: 'mythic', minValue: 1000000, maxValue: 50000000, description: 'A map believed to have been used by Columbus himself!', weight: 1, dropWeight: 1 },

  // ─── Manuscripts ───────────────────────────────────────────
  { name: 'Old Diary', icon: 'mdi:book-open-variant', category: 'manuscripts', rarity: 'common', minValue: 5, maxValue: 30, description: 'Someone\'s personal diary from decades ago.', weight: 1, dropWeight: 10 },
  { name: 'Handwritten Recipe Book', icon: 'mdi:book-open-variant', category: 'manuscripts', rarity: 'uncommon', minValue: 30, maxValue: 200, description: 'A grandmother\'s recipe book, beautifully illustrated.', weight: 1, dropWeight: 6 },
  { name: 'Medieval Manuscript Page', icon: 'mdi:book-lock', category: 'manuscripts', rarity: 'rare', minValue: 500, maxValue: 5000, description: 'An illuminated manuscript page on vellum.', weight: 1, dropWeight: 3 },
  { name: 'Shakespeare First Folio Page', icon: 'mdi:book-lock', category: 'manuscripts', rarity: 'legendary', minValue: 100000, maxValue: 2000000, description: 'A page from the original 1623 First Folio.', weight: 1, dropWeight: 1 },
  { name: 'Leonardo da Vinci Codex', icon: 'mdi:book-lock', category: 'manuscripts', rarity: 'mythic', minValue: 10000000, maxValue: 500000000, description: 'An undiscovered codex by Leonardo da Vinci! Museum-worthy.', weight: 1, dropWeight: 1 },

  // ─── Existing item categories with higher-value additions ──

  // Art additions
  { name: 'Street Art Print', icon: 'mdi:spray', category: 'art', rarity: 'common', minValue: 15, maxValue: 80, description: 'A limited run street art print.', weight: 2, dropWeight: 8 },
  { name: 'Banksy Print', icon: 'mdi:spray', category: 'art', rarity: 'epic', minValue: 5000, maxValue: 50000, description: 'An authenticated Banksy print.', weight: 2, dropWeight: 2 },
  { name: 'Warhol Original', icon: 'mdi:palette', category: 'art', rarity: 'legendary', minValue: 100000, maxValue: 5000000, description: 'An original Andy Warhol screen print.', weight: 3, dropWeight: 1 },
  { name: 'Picasso Sketch', icon: 'mdi:palette', category: 'art', rarity: 'mythic', minValue: 5000000, maxValue: 200000000, description: 'An authenticated pencil sketch by Pablo Picasso!', weight: 2, dropWeight: 1 },

  // Jewelry additions
  { name: 'Pearl Necklace', icon: 'mdi:necklace', category: 'jewelry', rarity: 'rare', minValue: 500, maxValue: 5000, description: 'A strand of cultured pearls.', weight: 1, dropWeight: 3 },
  { name: 'Cartier Love Bracelet', icon: 'mdi:circle-outline', category: 'jewelry', rarity: 'epic', minValue: 5000, maxValue: 30000, description: 'The iconic Cartier gold bracelet.', weight: 1, dropWeight: 2 },
  { name: 'Elizabeth Taylor Diamond', icon: 'mdi:diamond-stone', category: 'jewelry', rarity: 'mythic', minValue: 10000000, maxValue: 100000000, description: 'A legendary diamond once owned by Elizabeth Taylor!', weight: 1, dropWeight: 1 },

  // Vehicles additions
  { name: 'Vintage Ferrari', icon: 'mdi:car-sports', category: 'vehicles', rarity: 'legendary', minValue: 200000, maxValue: 5000000, description: 'A classic Ferrari in need of restoration.', weight: 15, dropWeight: 1 },
  { name: 'James Bond Aston Martin', icon: 'mdi:car-sports', category: 'vehicles', rarity: 'mythic', minValue: 5000000, maxValue: 50000000, description: 'The actual Aston Martin DB5 from a Bond film!', weight: 15, dropWeight: 1 },

  // Antiques additions
  { name: 'Ming Dynasty Vase', icon: 'mdi:flower-tulip', category: 'antiques', rarity: 'legendary', minValue: 50000, maxValue: 1000000, description: 'A genuine Ming Dynasty porcelain vase.', weight: 3, dropWeight: 1 },
  { name: 'Cleopatra\'s Mirror', icon: 'mdi:mirror', category: 'antiques', rarity: 'mythic', minValue: 20000000, maxValue: 500000000, description: 'Said to be the personal mirror of Cleopatra herself!', weight: 2, dropWeight: 1 },

  // Electronics additions  
  { name: 'Original iPhone Sealed', icon: 'mdi:cellphone', category: 'electronics', rarity: 'epic', minValue: 5000, maxValue: 50000, description: 'A sealed original 2007 iPhone. Collectors go crazy.', weight: 1, dropWeight: 2 },
  { name: 'Enigma Machine', icon: 'mdi:cog', category: 'electronics', rarity: 'legendary', minValue: 100000, maxValue: 1000000, description: 'A genuine WWII Enigma encryption machine.', weight: 8, dropWeight: 1 },

  // Instruments additions
  { name: 'Jimi Hendrix Guitar', icon: 'mdi:guitar-electric', category: 'instruments', rarity: 'legendary', minValue: 500000, maxValue: 5000000, description: 'A guitar played and burned by Jimi Hendrix on stage.', weight: 4, dropWeight: 1 },

  // Sports additions  
  { name: 'Game-Worn Jersey (Legend)', icon: 'mdi:tshirt-crew', category: 'sports', rarity: 'legendary', minValue: 50000, maxValue: 500000, description: 'A game-worn jersey from a sports icon.', weight: 2, dropWeight: 1 },
  { name: 'World Cup Trophy Replica', icon: 'mdi:trophy', category: 'sports', rarity: 'epic', minValue: 3000, maxValue: 25000, description: 'Official FIFA-licensed World Cup replica.', weight: 5, dropWeight: 2 },

  // Documents additions
  { name: 'Declaration of Independence Copy', icon: 'mdi:text-box-outline', category: 'documents', rarity: 'legendary', minValue: 200000, maxValue: 5000000, description: 'An original Dunlap broadside printing of the Declaration.', weight: 1, dropWeight: 1 },
]

// ─── Unique Items (one-time-only) ───────────────────────────────

export const UNIQUE_ITEM_POOL: ShopItemTemplate[] = [
  { name: 'The Holy Grail', icon: 'mdi:cup', category: 'antiques', rarity: 'mythic', minValue: 999999999, maxValue: 9999999999, description: 'Is this... the actual Holy Grail?! Unbelievable!', weight: 1, dropWeight: 1 },
  { name: 'Rosetta Stone Fragment', icon: 'mdi:text-box-outline', category: 'antiques', rarity: 'mythic', minValue: 500000000, maxValue: 5000000000, description: 'A piece of the original Rosetta Stone!', weight: 3, dropWeight: 1 },
  { name: 'T-Rex Skull', icon: 'mdi:skull', category: 'collectibles', rarity: 'mythic', minValue: 1000000000, maxValue: 10000000000, description: 'A complete Tyrannosaurus Rex skull in incredible condition!', weight: 20, dropWeight: 1 },
  { name: 'Van Gogh Starry Night Study', icon: 'mdi:palette', category: 'art', rarity: 'mythic', minValue: 2000000000, maxValue: 50000000000, description: 'A preparatory study for The Starry Night, by Van Gogh himself.', weight: 2, dropWeight: 1 },
  { name: 'Original US Constitution Draft', icon: 'mdi:text-box-outline', category: 'documents', rarity: 'mythic', minValue: 5000000000, maxValue: 100000000000, description: 'A handwritten draft of the US Constitution!', weight: 1, dropWeight: 1 },
  { name: 'Meteorite with Alien Fossils', icon: 'mdi:meteor', category: 'collectibles', rarity: 'mythic', minValue: 10000000000, maxValue: 999999999999, description: 'A meteorite containing what appear to be fossilized alien microbes!!!', weight: 3, dropWeight: 1 },
]

// ─── Procedural Name Generation ─────────────────────────────────

const CONDITION_PREFIXES = [
  '', '', '', '', // 50% no prefix
  'Vintage ', 'Antique ', 'Rare ', 'Pristine ', 'Well-worn ',
  'Mint ', 'Refurbished ', 'Estate ', 'Auction-grade ',
]

const PROVENANCE_SUFFIXES = [
  '', '', '', '', '', // 60% no suffix
  ' (Estate Sale)', ' (Private Collection)', ' (Museum Deaccession)',
  ' (Celebrity-Owned)', ' (Limited Edition)', ' (Numbered)',
  ' (One of a Kind)', ' (Authenticated)', ' (With Papers)',
]

// ─── Generation Functions ───────────────────────────────────────

function pickWeightedRarity(weights: Record<string, number>): string {
  const entries = Object.entries(weights)
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let roll = Math.random() * total
  for (const [rarity, weight] of entries) {
    roll -= weight
    if (roll <= 0) return rarity
  }
  return 'common'
}

function pickWeightedTemplate(candidates: ShopItemTemplate[]): ShopItemTemplate {
  const totalWeight = candidates.reduce((s, c) => s + c.dropWeight, 0)
  let roll = Math.random() * totalWeight
  for (const c of candidates) {
    roll -= c.dropWeight
    if (roll <= 0) return c
  }
  return candidates[0]
}

/**
 * Pick a random item condition using shop-specific weights.
 * Shop items have slightly more damaged items to create restoration opportunities.
 */
function pickShopCondition(): ItemCondition {
  const entries = Object.entries(SHOP_CONDITION_WEIGHTS)
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let roll = Math.random() * total
  for (const [condition, weight] of entries) {
    roll -= weight
    if (roll <= 0) return condition as ItemCondition
  }
  return 'good'
}

/**
 * Generate a single shop item procedurally.
 */
export function generateShopItem(
  luckBonus: number = 0,
  tick: number = 0,
): ShopListing {
  // Adjust rarity weights with luck
  const weights = { ...SHOP_RARITY_WEIGHTS }
  const boost = 1 + luckBonus * 0.2
  weights.rare *= boost
  weights.epic *= boost * 0.9
  weights.legendary *= boost * 0.7
  weights.jackpot *= boost * 0.6
  weights.mythic *= boost * 0.4

  // Check for unique item
  const isUnique = Math.random() < UNIQUE_ITEM_CHANCE * (1 + luckBonus * 0.5)

  let template: ShopItemTemplate
  if (isUnique && UNIQUE_ITEM_POOL.length > 0) {
    template = UNIQUE_ITEM_POOL[Math.floor(Math.random() * UNIQUE_ITEM_POOL.length)]
  } else {
    const rarity = pickWeightedRarity(weights)
    const candidates = SHOP_ITEM_POOL.filter(t => t.rarity === rarity)
    if (candidates.length === 0) {
      template = SHOP_ITEM_POOL[Math.floor(Math.random() * SHOP_ITEM_POOL.length)]
    } else {
      template = pickWeightedTemplate(candidates)
    }
  }

  // Calculate base value ("good" condition reference)
  const range = template.maxValue - template.minValue
  const rawValue = template.minValue + Math.random() * range
  const baseValue = Math.max(1, Math.round(rawValue))

  // Roll condition (unique items are always pristine)
  const condition: ItemCondition = isUnique ? 'pristine' : pickShopCondition()
  const conditionMult = CONDITION_MULTIPLIERS[condition] ?? 1.0
  const conditionedValue = Math.max(1, Math.round(baseValue * conditionMult))

  // Apply buy markup on the condition-adjusted value
  let price = Math.round(conditionedValue * SHOP_BUY_MARKUP)

  // Flash sale?
  let flashSale = false
  let discount = 0
  if (!isUnique && Math.random() < FLASH_SALE_CHANCE) {
    flashSale = true
    discount = FLASH_SALE_DISCOUNT[0] + Math.random() * (FLASH_SALE_DISCOUNT[1] - FLASH_SALE_DISCOUNT[0])
    price = Math.round(price * (1 - discount))
  }

  // Procedural name variation
  const prefix = isUnique ? '' : CONDITION_PREFIXES[Math.floor(Math.random() * CONDITION_PREFIXES.length)]
  const suffix = isUnique ? '' : PROVENANCE_SUFFIXES[Math.floor(Math.random() * PROVENANCE_SUFFIXES.length)]
  const itemName = `${prefix}${template.name}${suffix}`

  const item: StorageItem = {
    id: `shop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: itemName,
    icon: template.icon,
    category: template.category as ItemCategory,
    rarity: template.rarity,
    baseValue: D(baseValue),          // full value at "good" condition
    description: template.description,
    appraised: true,
    appraisedValue: D(conditionedValue), // condition-adjusted value
    weight: template.weight,
    condition,
  }

  return {
    id: `listing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    item,
    price: D(price),
    basePrice: D(conditionedValue),
    flashSale,
    discount,
    unique: isUnique,
    listedAtTick: tick,
    views: 0,
  }
}

/**
 * Generate a batch of shop listings.
 */
export function generateShopBatch(
  count: number,
  luckBonus: number = 0,
  tick: number = 0,
): ShopListing[] {
  const listings: ShopListing[] = []
  for (let i = 0; i < count; i++) {
    listings.push(generateShopItem(luckBonus, tick))
  }
  return listings
}

/**
 * Partially refresh the shop, replacing a fraction of old listings.
 */
export function refreshShopPartial(
  currentListings: ShopListing[],
  fraction: number,
  luckBonus: number = 0,
  tick: number = 0,
): ShopListing[] {
  const removeCount = Math.max(1, Math.floor(currentListings.length * fraction))
  // Remove the oldest listings (sort a copy to avoid mutating input)
  const sorted = [...currentListings]
    .sort((a, b) => b.listedAtTick - a.listedAtTick)
  const kept = sorted.slice(0, currentListings.length - removeCount)
  const newOnes = generateShopBatch(removeCount, luckBonus, tick)
  return [...kept, ...newOnes]
}
