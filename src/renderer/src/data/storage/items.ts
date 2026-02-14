/**
 * Storage Wars — Item definitions and generation
 *
 * Items are the contents found inside storage units. Each item has a
 * rarity, base value, category, and can be appraised for a more accurate value.
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'
import type { Rarity } from '../rarity'
import {
  BASE_RARITY_WEIGHTS,
  DUD_RARITY_WEIGHTS,
  DUD_UNIT_CHANCE,
  JUNK_OVERRIDE_CHANCE,
  CONDITION_WEIGHTS,
  PRISTINE_VALUE_CAP,
  SELL_TAX,
  UNAPPRAISED_SELL_PENALTY,
} from './balance'

export type ItemCategory =
  | 'furniture' | 'electronics' | 'clothing' | 'tools'
  | 'collectibles' | 'art' | 'jewelry' | 'antiques'
  | 'sports' | 'instruments' | 'vehicles' | 'documents'
  | 'junk'

export interface StorageItem {
  id: string
  name: string
  icon: string
  category: ItemCategory
  rarity: Rarity
  /** Base value before any appraisal or multiplier */
  baseValue: Decimal
  /** Flavor text shown to player */
  description: string
  /** Whether this item has been appraised */
  appraised: boolean
  /** Appraised value (set after appraisal) */
  appraisedValue: Decimal | null
  /** Weight factor for sell speed (higher = slower to sell) */
  weight: number
}

/** Master pool of possible items with rarity-weighted probabilities */
interface ItemTemplate {
  name: string
  icon: string
  category: ItemCategory
  rarity: Rarity
  minValue: number
  maxValue: number
  description: string
  weight: number
  /** Relative drop chance within its rarity (higher = more common) */
  dropWeight: number
}

export const ITEM_POOL: ItemTemplate[] = [
  // ─── Junk (common filler) ──────────────────────────────────
  { name: 'Old Newspapers', icon: 'mdi:newspaper', category: 'junk', rarity: 'common', minValue: 1, maxValue: 5, description: 'A stack of yellowed newspapers.', weight: 1, dropWeight: 15 },
  { name: 'Broken Lamp', icon: 'mdi:lamp', category: 'junk', rarity: 'common', minValue: 2, maxValue: 8, description: 'A lamp that has seen better days.', weight: 2, dropWeight: 12 },
  { name: 'Cardboard Boxes', icon: 'mdi:package-variant', category: 'junk', rarity: 'common', minValue: 1, maxValue: 3, description: 'Empty flattened boxes.', weight: 1, dropWeight: 18 },
  { name: 'Dusty Curtains', icon: 'mdi:curtains', category: 'junk', rarity: 'common', minValue: 3, maxValue: 10, description: 'Moth-eaten old curtains.', weight: 2, dropWeight: 10 },
  { name: 'Plastic Bins', icon: 'mdi:delete-empty', category: 'junk', rarity: 'common', minValue: 2, maxValue: 6, description: 'Assorted plastic storage bins.', weight: 1, dropWeight: 14 },

  // ─── Furniture (common–uncommon) ───────────────────────────
  { name: 'Folding Chair', icon: 'mdi:seat', category: 'furniture', rarity: 'common', minValue: 5, maxValue: 20, description: 'A basic folding chair.', weight: 3, dropWeight: 10 },
  { name: 'Wooden Desk', icon: 'mdi:desk', category: 'furniture', rarity: 'common', minValue: 15, maxValue: 60, description: 'A solid wooden desk.', weight: 5, dropWeight: 8 },
  { name: 'Bookshelf', icon: 'mdi:bookshelf', category: 'furniture', rarity: 'uncommon', minValue: 30, maxValue: 120, description: 'Oak bookshelf in decent condition.', weight: 6, dropWeight: 7 },
  { name: 'Leather Sofa', icon: 'mdi:sofa', category: 'furniture', rarity: 'uncommon', minValue: 80, maxValue: 350, description: 'Genuine leather sofa, minor wear.', weight: 8, dropWeight: 5 },
  { name: 'Antique Armoire', icon: 'mdi:wardrobe', category: 'furniture', rarity: 'rare', minValue: 200, maxValue: 1200, description: 'Hand-carved antique armoire.', weight: 10, dropWeight: 3 },

  // ─── Electronics ───────────────────────────────────────────
  { name: 'Old TV', icon: 'mdi:television-classic', category: 'electronics', rarity: 'common', minValue: 10, maxValue: 40, description: 'A bulky CRT television.', weight: 7, dropWeight: 9 },
  { name: 'Vintage Radio', icon: 'mdi:radio', category: 'electronics', rarity: 'uncommon', minValue: 40, maxValue: 200, description: 'A vintage tube radio.', weight: 4, dropWeight: 6 },
  { name: 'Retro Game Console', icon: 'mdi:gamepad-square', category: 'electronics', rarity: 'rare', minValue: 100, maxValue: 800, description: 'A classic gaming console, collectors love these.', weight: 3, dropWeight: 4 },
  { name: 'Sealed Laptop', icon: 'mdi:laptop', category: 'electronics', rarity: 'rare', minValue: 150, maxValue: 600, description: 'A laptop still sealed in its box.', weight: 3, dropWeight: 3 },
  { name: 'Audiophile Turntable', icon: 'mdi:disc-player', category: 'electronics', rarity: 'epic', minValue: 500, maxValue: 3000, description: 'High-end turntable for audiophiles.', weight: 5, dropWeight: 2 },

  // ─── Clothing ──────────────────────────────────────────────
  { name: 'Box of Clothes', icon: 'mdi:tshirt-crew', category: 'clothing', rarity: 'common', minValue: 5, maxValue: 25, description: 'Mixed bag of used clothing.', weight: 3, dropWeight: 12 },
  { name: 'Vintage Leather Jacket', icon: 'mdi:tshirt-v', category: 'clothing', rarity: 'uncommon', minValue: 50, maxValue: 200, description: 'A retro leather jacket in great shape.', weight: 2, dropWeight: 5 },
  { name: 'Designer Handbag', icon: 'mdi:bag-personal', category: 'clothing', rarity: 'rare', minValue: 200, maxValue: 1500, description: 'Luxury brand handbag, authenticated.', weight: 1, dropWeight: 3 },
  { name: 'Fur Coat', icon: 'mdi:hanger', category: 'clothing', rarity: 'epic', minValue: 800, maxValue: 5000, description: 'Genuine mink fur coat.', weight: 3, dropWeight: 1 },

  // ─── Tools ─────────────────────────────────────────────────
  { name: 'Toolbox', icon: 'mdi:toolbox', category: 'tools', rarity: 'common', minValue: 15, maxValue: 60, description: 'A complete set of basic tools.', weight: 5, dropWeight: 8 },
  { name: 'Power Drill Set', icon: 'mdi:screwdriver', category: 'tools', rarity: 'uncommon', minValue: 40, maxValue: 180, description: 'Professional-grade power drill with bits.', weight: 4, dropWeight: 5 },
  { name: 'Industrial Welder', icon: 'mdi:fire', category: 'tools', rarity: 'rare', minValue: 300, maxValue: 1500, description: 'Heavy-duty industrial welding equipment.', weight: 12, dropWeight: 2 },

  // ─── Collectibles ──────────────────────────────────────────
  { name: 'Comic Book Collection', icon: 'mdi:book-open-variant', category: 'collectibles', rarity: 'uncommon', minValue: 50, maxValue: 400, description: 'A box of vintage comic books.', weight: 3, dropWeight: 6 },
  { name: 'Baseball Card Binder', icon: 'mdi:cards', category: 'collectibles', rarity: 'rare', minValue: 200, maxValue: 2000, description: 'Binder full of rare baseball cards.', weight: 2, dropWeight: 3 },
  { name: 'Vintage Coin Set', icon: 'mdi:circle-multiple', category: 'collectibles', rarity: 'epic', minValue: 500, maxValue: 5000, description: 'A collection of rare coins.', weight: 1, dropWeight: 2 },
  { name: 'First Edition Book', icon: 'mdi:book-lock', category: 'collectibles', rarity: 'legendary', minValue: 2000, maxValue: 20000, description: 'A signed first edition by a famous author.', weight: 1, dropWeight: 1 },

  // ─── Art ────────────────────────────────────────────────────
  { name: 'Framed Print', icon: 'mdi:image-frame', category: 'art', rarity: 'common', minValue: 10, maxValue: 50, description: 'A mass-produced art print.', weight: 3, dropWeight: 8 },
  { name: 'Oil Painting', icon: 'mdi:palette', category: 'art', rarity: 'rare', minValue: 200, maxValue: 3000, description: 'An original oil painting.', weight: 5, dropWeight: 3 },
  { name: 'Bronze Sculpture', icon: 'mdi:human', category: 'art', rarity: 'epic', minValue: 1000, maxValue: 10000, description: 'A heavy bronze sculpture.', weight: 10, dropWeight: 1 },
  { name: 'Lost Masterpiece', icon: 'mdi:star-shooting', category: 'art', rarity: 'mythic', minValue: 50000, maxValue: 500000, description: 'A painting thought to be by a legendary master!', weight: 2, dropWeight: 1 },

  // ─── Jewelry ───────────────────────────────────────────────
  { name: 'Costume Jewelry Box', icon: 'mdi:ring', category: 'jewelry', rarity: 'common', minValue: 8, maxValue: 30, description: 'Mixed costume jewelry.', weight: 1, dropWeight: 8 },
  { name: 'Silver Necklace', icon: 'mdi:necklace', category: 'jewelry', rarity: 'uncommon', minValue: 60, maxValue: 250, description: 'A sterling silver necklace.', weight: 1, dropWeight: 5 },
  { name: 'Gold Watch', icon: 'mdi:watch', category: 'jewelry', rarity: 'rare', minValue: 300, maxValue: 2500, description: 'A genuine gold wristwatch.', weight: 1, dropWeight: 3 },
  { name: 'Diamond Ring', icon: 'mdi:diamond-stone', category: 'jewelry', rarity: 'epic', minValue: 1500, maxValue: 15000, description: '1-carat diamond engagement ring.', weight: 1, dropWeight: 1 },
  { name: 'Royal Tiara', icon: 'mdi:crown', category: 'jewelry', rarity: 'legendary', minValue: 10000, maxValue: 100000, description: 'A jewel-encrusted tiara of royal provenance.', weight: 1, dropWeight: 1 },

  // ─── Antiques ──────────────────────────────────────────────
  { name: 'Pocket Watch', icon: 'mdi:clock-outline', category: 'antiques', rarity: 'uncommon', minValue: 50, maxValue: 300, description: 'An old pocket watch, still ticking.', weight: 1, dropWeight: 5 },
  { name: 'Porcelain Vase', icon: 'mdi:flower-tulip', category: 'antiques', rarity: 'rare', minValue: 200, maxValue: 2000, description: 'A delicate hand-painted porcelain vase.', weight: 3, dropWeight: 3 },
  { name: 'Samurai Sword', icon: 'mdi:sword', category: 'antiques', rarity: 'epic', minValue: 2000, maxValue: 20000, description: 'An authentic Japanese katana.', weight: 4, dropWeight: 1 },
  { name: 'Egyptian Artifact', icon: 'mdi:pyramid', category: 'antiques', rarity: 'legendary', minValue: 15000, maxValue: 150000, description: 'An ancient Egyptian artifact of uncertain origin.', weight: 2, dropWeight: 1 },

  // ─── Sports ────────────────────────────────────────────────
  { name: 'Old Golf Clubs', icon: 'mdi:golf', category: 'sports', rarity: 'common', minValue: 10, maxValue: 50, description: 'A bag of rusty golf clubs.', weight: 6, dropWeight: 8 },
  { name: 'Signed Jersey', icon: 'mdi:tshirt-crew', category: 'sports', rarity: 'rare', minValue: 150, maxValue: 1500, description: 'A jersey signed by a sports legend.', weight: 2, dropWeight: 3 },
  { name: 'Championship Trophy', icon: 'mdi:trophy', category: 'sports', rarity: 'epic', minValue: 1000, maxValue: 8000, description: 'A real championship trophy.', weight: 5, dropWeight: 1 },

  // ─── Instruments ───────────────────────────────────────────
  { name: 'Acoustic Guitar', icon: 'mdi:guitar-acoustic', category: 'instruments', rarity: 'uncommon', minValue: 60, maxValue: 300, description: 'A well-used acoustic guitar.', weight: 4, dropWeight: 5 },
  { name: 'Vintage Saxophone', icon: 'mdi:saxophone', category: 'instruments', rarity: 'rare', minValue: 300, maxValue: 2500, description: 'A brass saxophone from the jazz era.', weight: 5, dropWeight: 2 },
  { name: 'Stradivarius Violin', icon: 'mdi:violin', category: 'instruments', rarity: 'mythic', minValue: 100000, maxValue: 1000000, description: 'Could this be a genuine Stradivarius?!', weight: 2, dropWeight: 1 },

  // ─── Vehicles ──────────────────────────────────────────────
  { name: 'Old Bicycle', icon: 'mdi:bicycle', category: 'vehicles', rarity: 'common', minValue: 15, maxValue: 80, description: 'A rusty old bicycle.', weight: 8, dropWeight: 6 },
  { name: 'Vintage Motorcycle', icon: 'mdi:motorbike', category: 'vehicles', rarity: 'epic', minValue: 2000, maxValue: 25000, description: 'A classic motorcycle needing restoration.', weight: 15, dropWeight: 1 },
  { name: 'Classic Car Parts', icon: 'mdi:car-cog', category: 'vehicles', rarity: 'rare', minValue: 500, maxValue: 5000, description: 'Rare parts for a classic car.', weight: 12, dropWeight: 2 },

  // ─── Documents ─────────────────────────────────────────────
  { name: 'Old Photo Album', icon: 'mdi:image-multiple', category: 'documents', rarity: 'common', minValue: 5, maxValue: 20, description: 'A family photo album.', weight: 2, dropWeight: 8 },
  { name: 'Vintage Stock Certificates', icon: 'mdi:certificate', category: 'documents', rarity: 'rare', minValue: 100, maxValue: 1200, description: 'Old stock certificates, might still have value.', weight: 1, dropWeight: 2 },
  { name: 'Historical Letter', icon: 'mdi:email-seal', category: 'documents', rarity: 'legendary', minValue: 5000, maxValue: 50000, description: 'A letter written by a historical figure.', weight: 1, dropWeight: 1 },

  // ─── Extra Templates (procedural variety) ───────────────────
  { name: 'Vinyl Record Collection', icon: 'mdi:album', category: 'collectibles', rarity: 'uncommon', minValue: 30, maxValue: 250, description: 'A crate of vinyl records from various eras.', weight: 3, dropWeight: 6 },
  { name: 'Typewriter', icon: 'mdi:keyboard', category: 'antiques', rarity: 'uncommon', minValue: 40, maxValue: 200, description: 'An old mechanical typewriter.', weight: 5, dropWeight: 5 },
  { name: 'Camera Equipment', icon: 'mdi:camera', category: 'electronics', rarity: 'uncommon', minValue: 80, maxValue: 400, description: 'Professional camera and lenses.', weight: 4, dropWeight: 4 },
  { name: 'Persian Rug', icon: 'mdi:rug', category: 'antiques', rarity: 'rare', minValue: 300, maxValue: 3000, description: 'A hand-woven Persian rug.', weight: 8, dropWeight: 2 },
  { name: 'Wine Collection', icon: 'mdi:glass-wine', category: 'collectibles', rarity: 'rare', minValue: 200, maxValue: 2500, description: 'A case of aged wines.', weight: 4, dropWeight: 3 },
  { name: 'Drum Kit', icon: 'mdi:music', category: 'instruments', rarity: 'uncommon', minValue: 80, maxValue: 500, description: 'A complete drum kit, some wear on the skins.', weight: 10, dropWeight: 4 },
  { name: 'Grand Piano', icon: 'mdi:piano', category: 'instruments', rarity: 'epic', minValue: 2000, maxValue: 30000, description: 'A baby grand piano, needs tuning.', weight: 20, dropWeight: 1 },
  { name: 'Electric Scooter', icon: 'mdi:scooter-electric', category: 'vehicles', rarity: 'uncommon', minValue: 50, maxValue: 300, description: 'An electric scooter, battery condition unknown.', weight: 6, dropWeight: 4 },
  { name: 'Antique Map Collection', icon: 'mdi:map', category: 'documents', rarity: 'epic', minValue: 800, maxValue: 8000, description: 'Antique navigation maps from the 18th century.', weight: 2, dropWeight: 1 },
  { name: 'Trophy Collection', icon: 'mdi:trophy-variant', category: 'sports', rarity: 'uncommon', minValue: 30, maxValue: 150, description: 'A shelf of various sports trophies.', weight: 5, dropWeight: 5 },
  { name: 'Snow Globe Collection', icon: 'mdi:snowflake', category: 'collectibles', rarity: 'common', minValue: 5, maxValue: 30, description: 'A box of assorted snow globes.', weight: 3, dropWeight: 8 },
  { name: 'Board Game Collection', icon: 'mdi:dice-multiple', category: 'collectibles', rarity: 'common', minValue: 10, maxValue: 40, description: 'A stack of classic board games.', weight: 4, dropWeight: 10 },
  { name: 'Military Medals', icon: 'mdi:medal', category: 'antiques', rarity: 'epic', minValue: 1000, maxValue: 12000, description: 'A case of military decorations and medals.', weight: 1, dropWeight: 1 },
  { name: 'Vintage Sunglasses', icon: 'mdi:sunglasses', category: 'clothing', rarity: 'uncommon', minValue: 30, maxValue: 180, description: 'Retro designer sunglasses.', weight: 1, dropWeight: 5 },
  { name: 'Sewing Machine', icon: 'mdi:sewing-machine', category: 'tools', rarity: 'uncommon', minValue: 40, maxValue: 250, description: 'A vintage sewing machine, still operational.', weight: 7, dropWeight: 4 },
  { name: 'Telescope', icon: 'mdi:telescope', category: 'electronics', rarity: 'rare', minValue: 150, maxValue: 1200, description: 'A high-powered telescope for stargazing.', weight: 6, dropWeight: 2 },
  { name: 'Antique Clock', icon: 'mdi:clock-time-eight', category: 'antiques', rarity: 'rare', minValue: 250, maxValue: 2500, description: 'A beautifully ornate antique mantel clock.', weight: 4, dropWeight: 2 },
  { name: 'Model Train Set', icon: 'mdi:train', category: 'collectibles', rarity: 'uncommon', minValue: 60, maxValue: 350, description: 'A detailed model railway set.', weight: 5, dropWeight: 4 },
]

// Rarity weights are now imported from balance.ts (BASE_RARITY_WEIGHTS / DUD_RARITY_WEIGHTS)

// ─── Procedural Condition System ────────────────────────────────

interface ItemCondition {
  id: string
  label: string
  /** Value multiplier (< 1 = worse, > 1 = better) */
  valueMult: number
  /** Description suffix */
  descSuffix: string
  /** Random selection weight */
  weight: number
}

const ITEM_CONDITIONS: ItemCondition[] = [
  { id: 'damaged',   label: 'Damaged',   valueMult: 0.35, descSuffix: 'Heavily damaged, needs major repair.', weight: CONDITION_WEIGHTS.damaged },
  { id: 'poor',      label: 'Poor',      valueMult: 0.55, descSuffix: 'In poor condition, shows significant wear.', weight: CONDITION_WEIGHTS.poor },
  { id: 'fair',      label: 'Fair',      valueMult: 0.80, descSuffix: 'Fair condition with some visible wear.', weight: CONDITION_WEIGHTS.fair },
  { id: 'good',      label: 'Good',      valueMult: 1.0,  descSuffix: '', weight: CONDITION_WEIGHTS.good },
  { id: 'excellent', label: 'Excellent', valueMult: 1.15, descSuffix: 'Excellent condition, well maintained.', weight: CONDITION_WEIGHTS.excellent },
  { id: 'mint',      label: 'Mint',      valueMult: 1.35, descSuffix: 'Mint condition \u2014 like new!', weight: CONDITION_WEIGHTS.mint },
  { id: 'pristine',  label: 'Pristine',  valueMult: PRISTINE_VALUE_CAP, descSuffix: 'Pristine condition, museum-quality.', weight: CONDITION_WEIGHTS.pristine },
]

function pickCondition(): ItemCondition {
  const totalWeight = ITEM_CONDITIONS.reduce((s, c) => s + c.weight, 0)
  let roll = Math.random() * totalWeight
  for (const c of ITEM_CONDITIONS) {
    roll -= c.weight
    if (roll <= 0) return c
  }
  return ITEM_CONDITIONS[3] // default: 'good'
}

/**
 * Generate items for a storage unit based on location parameters.
 * Supports theme-biased category selection and condition modifiers.
 */
export function generateUnitContents(
  minItems: number,
  maxItems: number,
  valueMultiplier: number,
  rareChance: number,
  luckBonus: number = 0,
  boostedCategories: string[] = [],
  categoryBoost: number = 1,
): StorageItem[] {
  const count = minItems + Math.floor(Math.random() * (maxItems - minItems + 1))
  const items: StorageItem[] = []

  // Determine if this is a "dud" unit (mostly junk)
  const isDud = Math.random() < DUD_UNIT_CHANCE
  const baseWeights = isDud ? { ...DUD_RARITY_WEIGHTS } : { ...BASE_RARITY_WEIGHTS }

  // Adjust rarity weights based on location rare chance + luck bonus
  const adjustedWeights = { ...baseWeights }
  if (!isDud) {
    const boost = 1 + rareChance + luckBonus * 0.3
    adjustedWeights.rare *= boost
    adjustedWeights.epic *= boost * 0.9
    adjustedWeights.legendary *= boost * 0.7
    adjustedWeights.mythic *= boost * 0.5
  }

  for (let i = 0; i < count; i++) {
    // Junk override chance — force a junk item regardless of rarity roll
    if (!isDud && Math.random() < JUNK_OVERRIDE_CHANCE) {
      const junkItems = ITEM_POOL.filter(t => t.category === 'junk')
      if (junkItems.length > 0) {
        const template = junkItems[Math.floor(Math.random() * junkItems.length)]
        const range = template.maxValue - template.minValue
        const rawValue = template.minValue + Math.random() * range
        const finalValue = Math.max(1, Math.round(rawValue * valueMultiplier))
        items.push({
          id: `item_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          name: template.name,
          icon: template.icon,
          category: template.category,
          rarity: template.rarity as Rarity,
          baseValue: D(finalValue),
          description: template.description,
          appraised: false,
          appraisedValue: null,
          weight: template.weight,
        })
        continue
      }
    }

    // Pick rarity first
    const rarity = pickWeightedRarity(adjustedWeights)
    // Filter items by rarity
    const candidates = ITEM_POOL.filter(t => t.rarity === rarity)
    if (candidates.length === 0) continue

    // Pick item weighted by dropWeight (with theme category boost)
    const template = pickWeightedTemplate(candidates, boostedCategories, categoryBoost)

    // Roll a condition modifier
    const condition = pickCondition()

    // Calculate value with condition + location multiplier
    const range = template.maxValue - template.minValue
    const rawValue = template.minValue + Math.random() * range
    const conditionedValue = rawValue * condition.valueMult
    const finalValue = Math.max(1, Math.round(conditionedValue * valueMultiplier))

    // Build name: add condition prefix for uncommon+ items (skip 'Good')
    const showCondition = rarity !== 'common' && condition.id !== 'good'
    const itemName = showCondition ? `${condition.label} ${template.name}` : template.name
    const itemDesc = showCondition && condition.descSuffix
      ? `${template.description} ${condition.descSuffix}`
      : template.description

    items.push({
      id: `item_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      name: itemName,
      icon: template.icon,
      category: template.category,
      rarity: template.rarity as Rarity,
      baseValue: D(finalValue),
      description: itemDesc,
      appraised: false,
      appraisedValue: null,
      weight: template.weight,
    })
  }

  return items
}

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

function pickWeightedTemplate(
  candidates: ItemTemplate[],
  boostedCategories: string[] = [],
  categoryBoost: number = 1,
): ItemTemplate {
  const weights = candidates.map(c => {
    const base = c.dropWeight
    return boostedCategories.includes(c.category) ? base * categoryBoost : base
  })
  const totalWeight = weights.reduce((s, w) => s + w, 0)
  let roll = Math.random() * totalWeight
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return candidates[i]
  }
  return candidates[0]
}

/**
 * Calculate the total value of a list of items (using appraised value if available).
 */
export function calculateTotalItemsValue(items: StorageItem[]): Decimal {
  let total = D(0)
  for (const item of items) {
    total = total.add(item.appraisedValue ?? item.baseValue)
  }
  return total
}

/**
 * Apply the sell tax to an item value.
 * Un-appraised items get an additional penalty.
 */
export function applySellTax(value: Decimal, isAppraised: boolean): Decimal {
  const taxRate = isAppraised ? SELL_TAX : (SELL_TAX + UNAPPRAISED_SELL_PENALTY)
  const afterTax = value.mul(1 - taxRate)
  return afterTax.max(D(1))
}
