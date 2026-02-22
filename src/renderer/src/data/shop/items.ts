/**
 * Online Shop — Item catalog and procedural item generation
 *
 * Uses the shared blueprint system from `storage/blueprints` + `itemGen`
 * for procedural item generation. Unique "one-time-only" legendary items
 * are kept as hardcoded special definitions.
 *
 * Reuses the existing StorageItem interface and rarity system.
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'
import type { Rarity } from '../rarity'
import type { ItemCategory, ItemCondition, StorageItem } from '../storage/items'
import { generateItem } from '../storage/itemGen'
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

// ─── Unique Item Definitions ────────────────────────────────────

/** Special one-time-only items kept as hardcoded definitions. */
interface UniqueItemDef {
  name: string
  icon: string
  category: ItemCategory
  rarity: Rarity
  minValue: number
  maxValue: number
  description: string
  weight: number
}
export const UNIQUE_ITEM_POOL: UniqueItemDef[] = [
  // ── Mythic Tier ──
  { name: 'The Holy Grail', icon: 'mdi:cup', category: 'antiques', rarity: 'mythic', minValue: 999999999, maxValue: 9999999999, description: 'Is this... the actual Holy Grail?! Unbelievable!', weight: 1 },
  { name: 'Rosetta Stone Fragment', icon: 'mdi:text-box-outline', category: 'antiques', rarity: 'mythic', minValue: 500000000, maxValue: 5000000000, description: 'A piece of the original Rosetta Stone!', weight: 3 },
  { name: 'T-Rex Skull', icon: 'mdi:skull', category: 'collectibles', rarity: 'mythic', minValue: 1000000000, maxValue: 10000000000, description: 'A complete Tyrannosaurus Rex skull in incredible condition!', weight: 20 },
  { name: 'Van Gogh Starry Night Study', icon: 'mdi:palette', category: 'art', rarity: 'mythic', minValue: 2000000000, maxValue: 50000000000, description: 'A preparatory study for The Starry Night, by Van Gogh himself.', weight: 2 },
  { name: 'Original US Constitution Draft', icon: 'mdi:text-box-outline', category: 'documents', rarity: 'mythic', minValue: 5000000000, maxValue: 100000000000, description: 'A handwritten draft of the US Constitution!', weight: 1 },
  { name: 'Meteorite with Alien Fossils', icon: 'mdi:meteor', category: 'collectibles', rarity: 'mythic', minValue: 10000000000, maxValue: 999999999999, description: 'A meteorite containing what appear to be fossilized alien microbes!!!', weight: 3 },
  { name: 'Mona Lisa Sketch', icon: 'mdi:drawing', category: 'art', rarity: 'mythic', minValue: 8000000000, maxValue: 80000000000, description: 'A preparatory sketch by Leonardo da Vinci for the Mona Lisa!', weight: 1 },
  { name: 'Shakespeare\'s Lost Play', icon: 'mdi:book-lock', category: 'manuscripts', rarity: 'mythic', minValue: 3000000000, maxValue: 30000000000, description: 'A complete manuscript of one of Shakespeare\'s lost plays!', weight: 1 },
  { name: 'Cleopatra\'s Necklace', icon: 'mdi:necklace', category: 'jewelry', rarity: 'mythic', minValue: 6000000000, maxValue: 60000000000, description: 'A gold necklace said to have belonged to Cleopatra herself!', weight: 1 },
  { name: 'Newton\'s Apple Tree Seed', icon: 'mdi:seed-outline', category: 'collectibles', rarity: 'mythic', minValue: 500000000, maxValue: 5000000000, description: 'A preserved seed from the legendary apple tree that inspired gravity.', weight: 1 },
  { name: 'Viking Longship Figurehead', icon: 'mdi:sail-boat', category: 'antiques', rarity: 'mythic', minValue: 2000000000, maxValue: 20000000000, description: 'An intricately carved dragon figurehead from an actual Viking longship!', weight: 3 },
  { name: 'Moon Rock', icon: 'mdi:moon-waning-crescent', category: 'gems', rarity: 'mythic', minValue: 15000000000, maxValue: 150000000000, description: 'An authentic lunar sample brought back from the Apollo missions!', weight: 2 },

  // ── Legendary Tier ──
  { name: 'Stradivarius Violin', icon: 'mdi:violin', category: 'instruments', rarity: 'legendary', minValue: 500000000, maxValue: 5000000000, description: 'An authentic Stradivarius violin from the 18th century. The sound is otherworldly.', weight: 2 },
  { name: 'Napoleon\'s Sword', icon: 'mdi:sword', category: 'antiques', rarity: 'legendary', minValue: 200000000, maxValue: 2000000000, description: 'A ceremonial sword that once belonged to Napoleon Bonaparte!', weight: 3 },
  { name: 'Fabergé Egg', icon: 'mdi:egg-easter', category: 'luxury', rarity: 'legendary', minValue: 300000000, maxValue: 3000000000, description: 'An original Fabergé egg with jeweled interior. Absolutely stunning!', weight: 2 },
  { name: 'Gutenberg Bible Page', icon: 'mdi:book-open-page-variant', category: 'manuscripts', rarity: 'legendary', minValue: 100000000, maxValue: 1000000000, description: 'A single page from the original Gutenberg Bible. Priceless craftsmanship.', weight: 2 },
  { name: 'Hope Diamond Replica', icon: 'mdi:diamond', category: 'gems', rarity: 'legendary', minValue: 400000000, maxValue: 4000000000, description: 'Wait... this might not be a replica at all! The cursed blue diamond!', weight: 2 },
  { name: 'Da Vinci Codex Page', icon: 'mdi:script-text', category: 'documents', rarity: 'legendary', minValue: 150000000, maxValue: 1500000000, description: 'A page from one of Leonardo da Vinci\'s famous codices!', weight: 1 },
  { name: 'Samurai Katana', icon: 'mdi:sword', category: 'antiques', rarity: 'legendary', minValue: 80000000, maxValue: 800000000, description: 'A medieval Japanese katana forged by a master swordsmith. Still razor sharp.', weight: 3 },
  { name: 'Beatles White Album #0000001', icon: 'mdi:album', category: 'memorabilia', rarity: 'legendary', minValue: 200000000, maxValue: 2000000000, description: 'Serial number 0000001! The very first pressing of the White Album!', weight: 1 },
  { name: 'King Tut\'s Scarab', icon: 'mdi:bug', category: 'antiques', rarity: 'legendary', minValue: 350000000, maxValue: 3500000000, description: 'A golden scarab amulet from the tomb of King Tutankhamun!', weight: 2 },
  { name: 'First Edition Pokémon Box', icon: 'mdi:cards', category: 'cards', rarity: 'legendary', minValue: 100000000, maxValue: 1000000000, description: 'A sealed first edition Pokémon booster box. Pristine condition!', weight: 2 },
  { name: 'Einstein\'s Blackboard', icon: 'mdi:school', category: 'memorabilia', rarity: 'legendary', minValue: 250000000, maxValue: 2500000000, description: 'The actual blackboard Einstein used for his famous lecture at Oxford!', weight: 5 },
  { name: 'Wright Brothers\' Propeller', icon: 'mdi:airplane', category: 'vehicles', rarity: 'legendary', minValue: 180000000, maxValue: 1800000000, description: 'An original propeller from the Wright Flyer! Aviation history!', weight: 4 },
  { name: 'Tesla\'s Notebook', icon: 'mdi:notebook', category: 'documents', rarity: 'legendary', minValue: 300000000, maxValue: 3000000000, description: 'A personal notebook of Nikola Tesla with unpublished inventions!', weight: 1 },
  { name: 'Roman Gladiator Helmet', icon: 'mdi:shield', category: 'antiques', rarity: 'legendary', minValue: 120000000, maxValue: 1200000000, description: 'An authentic bronze gladiator helmet from the Roman Colosseum era!', weight: 4 },
  { name: 'Picasso\'s Napkin Sketch', icon: 'mdi:drawing', category: 'art', rarity: 'legendary', minValue: 80000000, maxValue: 800000000, description: 'Picasso famously sketched on napkins in cafés. This one is authenticated!', weight: 1 },
  { name: 'Rolex Daytona Paul Newman', icon: 'mdi:watch', category: 'watches', rarity: 'legendary', minValue: 150000000, maxValue: 1500000000, description: 'The legendary Rolex Daytona "Paul Newman" — the holy grail of watches!', weight: 1 },
  { name: 'Game-Worn Michael Jordan Jersey', icon: 'mdi:tshirt-crew', category: 'sports', rarity: 'legendary', minValue: 100000000, maxValue: 1000000000, description: 'A jersey actually worn by Michael Jordan during an NBA Finals game!', weight: 2 },
  { name: 'Amber Room Panel', icon: 'mdi:wall', category: 'art', rarity: 'legendary', minValue: 500000000, maxValue: 5000000000, description: 'A panel from the legendary Amber Room, lost since WWII!', weight: 3 },
  { name: 'Original Coca-Cola Recipe', icon: 'mdi:script-text', category: 'documents', rarity: 'legendary', minValue: 200000000, maxValue: 2000000000, description: 'A handwritten copy of the original Coca-Cola formula!', weight: 1 },

  // ── Jackpot Tier ──
  { name: 'Vintage Ferrari Steering Wheel', icon: 'mdi:steering', category: 'vehicles', rarity: 'jackpot', minValue: 25000000, maxValue: 250000000, description: 'An original steering wheel from a 1960s Ferrari racing car!', weight: 3 },
  { name: 'Ancient Greek Amphora', icon: 'mdi:pot', category: 'antiques', rarity: 'jackpot', minValue: 15000000, maxValue: 150000000, description: 'A beautifully preserved amphora from ancient Greece, over 2000 years old!', weight: 4 },
  { name: 'Original Star Wars Lightsaber Prop', icon: 'mdi:sword', category: 'memorabilia', rarity: 'jackpot', minValue: 20000000, maxValue: 200000000, description: 'A lightsaber prop used in the original Star Wars trilogy!', weight: 2 },
  { name: 'Babe Ruth Signed Baseball', icon: 'mdi:baseball', category: 'sports', rarity: 'jackpot', minValue: 10000000, maxValue: 100000000, description: 'A baseball signed by the legendary Babe Ruth himself!', weight: 2 },
  { name: 'Vintage Hermès Birkin Bag', icon: 'mdi:bag-personal', category: 'luxury', rarity: 'jackpot', minValue: 8000000, maxValue: 80000000, description: 'A rare vintage Hermès Birkin in Himalaya crocodile leather!', weight: 1 },
  { name: 'Edison\'s Light Bulb Prototype', icon: 'mdi:lightbulb-on', category: 'tech', rarity: 'jackpot', minValue: 30000000, maxValue: 300000000, description: 'One of Thomas Edison\'s original experimental light bulbs!', weight: 2 },
  { name: 'Ming Dynasty Vase', icon: 'mdi:flower-tulip', category: 'antiques', rarity: 'jackpot', minValue: 20000000, maxValue: 200000000, description: 'An exquisite blue-and-white porcelain vase from the Ming Dynasty!', weight: 3 },
  { name: 'Hemingway\'s Typewriter', icon: 'mdi:keyboard', category: 'memorabilia', rarity: 'jackpot', minValue: 15000000, maxValue: 150000000, description: 'Ernest Hemingway\'s personal Corona typewriter. Still types beautifully.', weight: 3 },
  { name: 'Gold Doubloon Hoard', icon: 'mdi:cash-100', category: 'coins', rarity: 'jackpot', minValue: 12000000, maxValue: 120000000, description: 'A small chest of authentic Spanish gold doubloons from a sunken galleon!', weight: 5 },
  { name: '1952 Topps Mickey Mantle Card', icon: 'mdi:cards', category: 'cards', rarity: 'jackpot', minValue: 10000000, maxValue: 100000000, description: 'The holy grail of baseball cards — PSA 10 grade!', weight: 1 },
  { name: 'Ancient World Map', icon: 'mdi:map', category: 'maps', rarity: 'jackpot', minValue: 8000000, maxValue: 80000000, description: 'A 16th-century world map showing sea monsters and unknown continents!', weight: 2 },
  { name: 'Patek Philippe Grandmaster', icon: 'mdi:watch', category: 'watches', rarity: 'jackpot', minValue: 25000000, maxValue: 250000000, description: 'The most complicated wristwatch ever made. 20+ complications!', weight: 1 },
  { name: 'Elvis Presley\'s Guitar', icon: 'mdi:guitar-acoustic', category: 'instruments', rarity: 'jackpot', minValue: 15000000, maxValue: 150000000, description: 'The King\'s own guitar — with authenticated provenance!', weight: 3 },
  { name: 'Château Lafite 1787', icon: 'mdi:bottle-wine', category: 'wine', rarity: 'jackpot', minValue: 10000000, maxValue: 100000000, description: 'A bottle of 1787 Château Lafite — allegedly owned by Thomas Jefferson!', weight: 2 },
  { name: 'Original Air Jordan 1 (1985)', icon: 'mdi:shoe-sneaker', category: 'sneakers', rarity: 'jackpot', minValue: 5000000, maxValue: 50000000, description: 'A deadstock pair of the original 1985 Air Jordan 1s in box!', weight: 1 },
  { name: 'Dead Sea Scroll Fragment', icon: 'mdi:script-text', category: 'manuscripts', rarity: 'jackpot', minValue: 20000000, maxValue: 200000000, description: 'An authentic fragment of the Dead Sea Scrolls!', weight: 1 },
  { name: 'Casablanca Original Poster', icon: 'mdi:movie', category: 'memorabilia', rarity: 'jackpot', minValue: 8000000, maxValue: 80000000, description: 'An original 1942 Casablanca movie poster in pristine condition!', weight: 1 },

  // ── Epic Tier ──
  { name: 'Prohibition-Era Whiskey', icon: 'mdi:bottle-wine', category: 'wine', rarity: 'epic', minValue: 500000, maxValue: 5000000, description: 'A sealed bottle of whiskey from the Prohibition era — bootlegger special!', weight: 3 },
  { name: 'WWII Enigma Machine Part', icon: 'mdi:cog', category: 'tech', rarity: 'epic', minValue: 1000000, maxValue: 10000000, description: 'A rotary component from an actual WWII Enigma encryption machine!', weight: 3 },
  { name: 'Tiffany Lamp', icon: 'mdi:lamp', category: 'furniture', rarity: 'epic', minValue: 800000, maxValue: 8000000, description: 'An original Tiffany stained-glass lamp. The colors are magnificent!', weight: 4 },
  { name: 'Victorian Dollhouse', icon: 'mdi:home', category: 'collectibles', rarity: 'epic', minValue: 300000, maxValue: 3000000, description: 'A miniature Victorian mansion with incredibly detailed furnishings!', weight: 5 },
  { name: 'Civil War Canteen', icon: 'mdi:cup-water', category: 'antiques', rarity: 'epic', minValue: 200000, maxValue: 2000000, description: 'A soldier\'s canteen from the American Civil War with carved initials.', weight: 2 },
  { name: 'Vintage Leica Camera', icon: 'mdi:camera', category: 'electronics', rarity: 'epic', minValue: 500000, maxValue: 5000000, description: 'A classic Leica rangefinder camera from the 1950s. Still takes photos!', weight: 2 },
  { name: 'Cartier Art Deco Brooch', icon: 'mdi:star-four-points', category: 'jewelry', rarity: 'epic', minValue: 600000, maxValue: 6000000, description: 'An Art Deco platinum and diamond brooch by Cartier. Breathtaking design.', weight: 1 },
  { name: 'First Edition Harry Potter', icon: 'mdi:book-lock', category: 'collectibles', rarity: 'epic', minValue: 400000, maxValue: 4000000, description: 'A first edition of Harry Potter and the Philosopher\'s Stone!', weight: 2 },
  { name: 'Olympic Gold Medal', icon: 'mdi:medal', category: 'sports', rarity: 'epic', minValue: 300000, maxValue: 3000000, description: 'An actual Olympic gold medal from a past games!', weight: 1 },
  { name: 'Original Banksy Print', icon: 'mdi:spray', category: 'art', rarity: 'epic', minValue: 500000, maxValue: 5000000, description: 'An authenticated Banksy print — street art meets high art!', weight: 2 },
  { name: 'Persian Silk Rug', icon: 'mdi:rug', category: 'antiques', rarity: 'epic', minValue: 400000, maxValue: 4000000, description: 'A hand-knotted 16th-century Persian silk rug with 600 knots per square inch!', weight: 8 },
  { name: 'Vintage Chanel No. 5', icon: 'mdi:bottle-tonic', category: 'luxury', rarity: 'epic', minValue: 200000, maxValue: 2000000, description: 'A sealed bottle of original 1920s Chanel No. 5 perfume!', weight: 1 },
  { name: 'Apollo Mission Patch', icon: 'mdi:rocket-launch', category: 'memorabilia', rarity: 'epic', minValue: 300000, maxValue: 3000000, description: 'A mission patch worn by an actual Apollo astronaut!', weight: 1 },
  { name: 'Alexandrite Gemstone', icon: 'mdi:diamond', category: 'gems', rarity: 'epic', minValue: 500000, maxValue: 5000000, description: 'An extremely rare alexandrite that changes color in different light!', weight: 1 },
]

// ─── Generation Functions ───────────────────────────────────────

function pickWeightedRarity(weights: Record<string, number>): Rarity {
  const entries = Object.entries(weights)
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let roll = Math.random() * total
  for (const [rarity, weight] of entries) {
    roll -= weight
    if (roll <= 0) return rarity as Rarity
  }
  return 'common'
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
 * Uses the shared blueprint generator for non-unique items.
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

  let item: StorageItem
  let isUniqueItem = false

  if (isUnique && UNIQUE_ITEM_POOL.length > 0) {
    // ── Unique one-time-only item (hardcoded) ──
    const def = UNIQUE_ITEM_POOL[Math.floor(Math.random() * UNIQUE_ITEM_POOL.length)]
    const range = def.maxValue - def.minValue
    const rawValue = def.minValue + Math.random() * range
    const baseValue = Math.max(1, Math.round(rawValue))

    item = {
      id: `shop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: def.name,
      icon: def.icon,
      category: def.category,
      rarity: def.rarity,
      baseValue: D(baseValue),
      description: def.description,
      appraised: true,
      appraisedValue: D(baseValue),
      weight: def.weight,
      condition: 'pristine',
    }
    isUniqueItem = true
  } else {
    // ── Procedural item from blueprint system ──
    const rarity = pickWeightedRarity(weights)
    item = generateItem(rarity, 1, [], 1)

    // Override condition with shop-specific weights (more damaged → restoration loop)
    const condition = pickShopCondition()
    const conditionMult = CONDITION_MULTIPLIERS[condition] ?? 1.0
    const conditionedValue = item.baseValue.mul(conditionMult).max(D(1)).round()

    item.condition = condition
    item.appraised = true
    item.appraisedValue = conditionedValue
  }

  // Apply buy markup on the appraised (condition-adjusted) value
  const sellValue = item.appraisedValue ?? item.baseValue
  let price = sellValue.mul(SHOP_BUY_MARKUP).round()

  // Flash sale?
  let flashSale = false
  let discount = 0
  if (!isUniqueItem && Math.random() < FLASH_SALE_CHANCE) {
    flashSale = true
    discount = FLASH_SALE_DISCOUNT[0] + Math.random() * (FLASH_SALE_DISCOUNT[1] - FLASH_SALE_DISCOUNT[0])
    price = price.mul(1 - discount).round()
  }

  return {
    id: `listing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    item,
    price,
    basePrice: sellValue,
    flashSale,
    discount,
    unique: isUniqueItem,
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
