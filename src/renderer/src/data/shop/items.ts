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
  { name: 'The Holy Grail', icon: 'mdi:cup', category: 'antiques', rarity: 'mythic', minValue: 999999999, maxValue: 9999999999, description: 'Is this... the actual Holy Grail?! Unbelievable!', weight: 1 },
  { name: 'Rosetta Stone Fragment', icon: 'mdi:text-box-outline', category: 'antiques', rarity: 'mythic', minValue: 500000000, maxValue: 5000000000, description: 'A piece of the original Rosetta Stone!', weight: 3 },
  { name: 'T-Rex Skull', icon: 'mdi:skull', category: 'collectibles', rarity: 'mythic', minValue: 1000000000, maxValue: 10000000000, description: 'A complete Tyrannosaurus Rex skull in incredible condition!', weight: 20 },
  { name: 'Van Gogh Starry Night Study', icon: 'mdi:palette', category: 'art', rarity: 'mythic', minValue: 2000000000, maxValue: 50000000000, description: 'A preparatory study for The Starry Night, by Van Gogh himself.', weight: 2 },
  { name: 'Original US Constitution Draft', icon: 'mdi:text-box-outline', category: 'documents', rarity: 'mythic', minValue: 5000000000, maxValue: 100000000000, description: 'A handwritten draft of the US Constitution!', weight: 1 },
  { name: 'Meteorite with Alien Fossils', icon: 'mdi:meteor', category: 'collectibles', rarity: 'mythic', minValue: 10000000000, maxValue: 999999999999, description: 'A meteorite containing what appear to be fossilized alien microbes!!!', weight: 3 },
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
