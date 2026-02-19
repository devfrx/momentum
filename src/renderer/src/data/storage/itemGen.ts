/**
 * Storage Wars — Procedural Item Generator
 *
 * Assembles StorageItem instances from category blueprints + shared
 * prefix/suffix pools. Completely replaces the old ITEM_POOL static
 * array while keeping the same StorageItem interface.
 *
 * Generated items store i18n keys internally; the display layer resolves
 * them via `resolveItemName()` / `resolveItemDescription()` at render time.
 *
 * The old `generateUnitContents()` now delegates here for individual items.
 */
import { D } from '@renderer/core/BigNum'
import type { Rarity } from '../rarity'
import { RARITY_ORDER } from '../rarity'
import type { StorageItem, ItemCategory, ItemCondition } from './items'
import {
  CATEGORY_BLUEPRINTS,
  NAME_PREFIXES,
  NAME_SUFFIXES,
  getBlueprint,
  type CategoryBlueprint,
  type BaseName,
  type NamePrefix,
  type NameSuffix,
} from './blueprints'
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
import { applyRarityShift } from './auctionTiers'

// ─── Condition System ───────────────────────────────────────────

interface ConditionDef {
  id: ItemCondition
  valueMult: number
  weight: number
}

const ITEM_CONDITIONS: ConditionDef[] = [
  { id: 'damaged',   valueMult: 0.35,             weight: CONDITION_WEIGHTS.damaged },
  { id: 'poor',      valueMult: 0.55,             weight: CONDITION_WEIGHTS.poor },
  { id: 'fair',      valueMult: 0.80,             weight: CONDITION_WEIGHTS.fair },
  { id: 'good',      valueMult: 1.0,              weight: CONDITION_WEIGHTS.good },
  { id: 'excellent', valueMult: 1.15,             weight: CONDITION_WEIGHTS.excellent },
  { id: 'mint',      valueMult: 1.35,             weight: CONDITION_WEIGHTS.mint },
  { id: 'pristine',  valueMult: PRISTINE_VALUE_CAP, weight: CONDITION_WEIGHTS.pristine },
]

/**
 * Pick a condition with rarity-based coherence bias.
 * Higher rarity → shifted toward better conditions, but still random.
 * A legendary item CAN be damaged, just less likely.
 */
function pickConditionForRarity(rarity: Rarity): ConditionDef {
  const tier = rarityValue(rarity)
  // Normalize condition quality to 0–1 range
  const minMult = 0.35
  const maxMult = PRISTINE_VALUE_CAP
  const range = maxMult - minMult

  const biased = ITEM_CONDITIONS.map(c => {
    const quality = (c.valueMult - minMult) / range // 0 = worst, 1 = best
    // Higher tier → better conditions weighted more, worse weighted less
    const bias = 1 + (quality - 0.45) * tier * 0.10
    return { ...c, weight: c.weight * Math.max(0.05, bias) }
  })

  const totalWeight = biased.reduce((s, c) => s + c.weight, 0)
  let roll = Math.random() * totalWeight
  for (const c of biased) {
    roll -= c.weight
    if (roll <= 0) return c
  }
  return ITEM_CONDITIONS[3]
}

// ─── Prefix / Suffix picking ────────────────────────────────────

/** Min rarity numeric value for comparison. */
function rarityValue(r: Rarity): number {
  return RARITY_ORDER[r] ?? 0
}

/**
 * Pick a prefix eligible for the given rarity.
 * Returns null ~40% of the time for common items (no prefix).
 */
function pickPrefix(rarity: Rarity): NamePrefix | null {
  const rv = rarityValue(rarity)
  const eligible = NAME_PREFIXES.filter(p => rv >= rarityValue(p.minRarity))
  if (eligible.length === 0) return null
  // Higher rarity → higher chance of getting a prefix
  const noPrefix = rarity === 'common' ? 0.50 : rarity === 'uncommon' ? 0.35 : 0.15
  if (Math.random() < noPrefix) return null
  // Rarity-coherence bias: higher rarity favors higher valueMult prefixes
  const tier = rv
  return pickWeighted(eligible, p => {
    const quality = p.valueMult - 1.0 // negative = bad, positive = good
    const bias = 1 + quality * tier * 0.15
    return p.weight * Math.max(0.1, bias)
  })
}

/**
 * Pick a suffix eligible for the given rarity.
 * Returns null ~55% of the time for common items.
 */
function pickSuffix(rarity: Rarity): NameSuffix | null {
  const rv = rarityValue(rarity)
  const eligible = NAME_SUFFIXES.filter(s => rv >= rarityValue(s.minRarity))
  if (eligible.length === 0) return null
  const noSuffix = rarity === 'common' ? 0.65 : rarity === 'uncommon' ? 0.50 : 0.25
  if (Math.random() < noSuffix) return null
  // Rarity-coherence bias: higher rarity favors higher valueBonus suffixes
  const tier = rv
  return pickWeighted(eligible, s => {
    const bias = 1 + s.valueBonus * tier * 0.8
    return s.weight * Math.max(0.1, bias)
  })
}

// ─── Weighted picking utility ───────────────────────────────────

function pickWeighted<T>(items: T[], weightFn: (item: T) => number): T {
  const total = items.reduce((s, i) => s + weightFn(i), 0)
  let roll = Math.random() * total
  for (const item of items) {
    roll -= weightFn(item)
    if (roll <= 0) return item
  }
  return items[0]
}

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

// ─── Single Item Generation ─────────────────────────────────────

export interface GeneratedItemParts {
  /** Category key */
  category: ItemCategory
  /** Blueprint base name index */
  baseIndex: number
  /** Prefix key (null if none) */
  prefixKey: string | null
  /** Suffix key (null if none) */
  suffixKey: string | null
}

/**
 * Generate a single procedural item for a given rarity.
 *
 * @param rarity         - The rarity tier for the item
 * @param valueMultiplier - Location/tier value multiplier
 * @param boostedCategories - Categories with extra weight (from lot theme)
 * @param categoryBoost  - Weight multiplier for boosted categories
 * @param forcedCategory - Force a specific category (e.g. 'junk')
 */
export function generateItem(
  rarity: Rarity,
  valueMultiplier: number = 1,
  boostedCategories: string[] = [],
  categoryBoost: number = 1,
  forcedCategory?: ItemCategory,
): StorageItem {
  // 1. Pick blueprint (category + base name)
  let blueprint: CategoryBlueprint
  let baseName: BaseName

  if (forcedCategory) {
    blueprint = getBlueprint(forcedCategory) ?? CATEGORY_BLUEPRINTS[0]
  } else {
    // Weighted category selection — each category's total dropWeight contributes
    const bpWeights = CATEGORY_BLUEPRINTS
      .filter(bp => bp.category !== 'junk') // junk handled via JUNK_OVERRIDE
      .map(bp => {
        const catWeight = bp.baseNames.reduce((s, bn) => s + bn.dropWeight, 0)
        const boost = boostedCategories.includes(bp.category) ? categoryBoost : 1
        return { bp, weight: catWeight * boost }
      })
    blueprint = pickWeighted(bpWeights, w => w.weight).bp
  }

  // 2. Pick base name (weighted by dropWeight)
  baseName = pickWeighted(blueprint.baseNames, bn => bn.dropWeight)

  // 3. Pick prefix and suffix (rarity-gated)
  const prefix = pickPrefix(rarity)
  const suffix = pickSuffix(rarity)

  // 4. Calculate value from rarity curve
  const curve = blueprint.valueCurves[rarity] ?? blueprint.valueCurves.common
  const rawValue = curve.min + Math.random() * (curve.max - curve.min)

  // Apply prefix multiplier + suffix bonus
  const prefixMult = prefix?.valueMult ?? 1.0
  const suffixBonus = suffix?.valueBonus ?? 0
  const modifiedValue = rawValue * prefixMult * (1 + suffixBonus)

  // Apply location value multiplier
  const finalValue = Math.max(1, Math.round(modifiedValue * valueMultiplier))

  // 5. Roll condition (rarity-biased — higher rarity items tend to be in better condition)
  const condition = pickConditionForRarity(rarity)

  // 6. Build the item key parts (stored for i18n resolution)
  const baseIndex = blueprint.baseNames.indexOf(baseName)

  // 7. Build display name using i18n key parts
  // Format: "items.prefix.X" + "items.base.CATEGORY.Y" + "items.suffix.Z"
  // Stored as structured data in the ID for render-time resolution
  const nameParts: GeneratedItemParts = {
    category: blueprint.category,
    baseIndex,
    prefixKey: prefix?.key ?? null,
    suffixKey: suffix?.key ?? null,
  }

  // Encode name parts into the item ID for persistence & i18n resolution
  const partsEncoded = encodeItemParts(nameParts)

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${partsEncoded}`,
    name: '', // Resolved at render time via resolveItemName()
    icon: baseName.icon,
    category: blueprint.category,
    rarity,
    baseValue: D(finalValue),
    description: '', // Resolved at render time via resolveItemDescription()
    appraised: false,
    appraisedValue: null,
    weight: baseName.weight,
    condition: condition.id,
  }
}

// ─── Batch generation (replaces old generateUnitContents) ───────

/**
 * Generate items for a storage unit based on location parameters.
 * Drop-in replacement for the old `generateUnitContents()`.
 */
export function generateUnitContents(
  minItems: number,
  maxItems: number,
  valueMultiplier: number,
  rareChance: number,
  luckBonus: number = 0,
  boostedCategories: string[] = [],
  categoryBoost: number = 1,
  rarityShift: number = 0,
): StorageItem[] {
  const count = minItems + Math.floor(Math.random() * (maxItems - minItems + 1))
  const items: StorageItem[] = []

  // Determine if this is a "dud" unit (mostly junk)
  const isDud = Math.random() < DUD_UNIT_CHANCE
  const rawWeights = isDud ? { ...DUD_RARITY_WEIGHTS } : { ...BASE_RARITY_WEIGHTS }

  // Apply lot tier rarity shift (shifts weight toward rarer tiers)
  const baseWeights = rarityShift !== 0 ? applyRarityShift(rawWeights, rarityShift) : rawWeights

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
      const junkItem = generateItem('common', valueMultiplier, [], 1, 'junk')
      items.push(junkItem)
      continue
    }

    // Pick rarity
    const rarity = pickWeightedRarity(adjustedWeights)
    items.push(generateItem(rarity, valueMultiplier, boostedCategories, categoryBoost))
  }

  return items
}

// ─── Item Parts Encoding ────────────────────────────────────────
// Encoded as compact string: "C.B.P.S" → category-index.base-index.prefix-key.suffix-key
// Used in item ID for persistence and i18n lookup.

function encodeItemParts(parts: GeneratedItemParts): string {
  const catIdx = CATEGORY_BLUEPRINTS.findIndex(bp => bp.category === parts.category)
  const p = parts.prefixKey ?? '_'
  const s = parts.suffixKey ?? '_'
  return `${catIdx}.${parts.baseIndex}.${p}.${s}`
}

/**
 * Decode item parts from the encoded string in the item ID.
 * Returns null if the item was generated before the procedural system
 * (backward compatibility — those items keep their hardcoded names).
 */
export function decodeItemParts(itemId: string): GeneratedItemParts | null {
  // New-format IDs have the parts appended after a 3rd underscore
  const segments = itemId.split('_')
  if (segments.length < 4) return null

  const partsStr = segments.slice(3).join('_')
  const parts = partsStr.split('.')
  if (parts.length < 4) return null

  const catIdx = parseInt(parts[0], 10)
  if (isNaN(catIdx) || catIdx < 0 || catIdx >= CATEGORY_BLUEPRINTS.length) return null

  const baseIndex = parseInt(parts[1], 10)
  const prefixKey = parts[2] === '_' ? null : parts[2]
  const suffixKey = parts[3] === '_' ? null : parts[3]

  return {
    category: CATEGORY_BLUEPRINTS[catIdx].category,
    baseIndex,
    prefixKey,
    suffixKey,
  }
}

/**
 * Resolve the display name for an item using i18n.
 *
 * @param item - The storage item
 * @param t    - The i18n `t()` function from `useI18n()`
 * @returns    Localized display name
 */
export function resolveItemName(
  item: StorageItem,
  t: (key: string) => string,
): string {
  // Backward compat: if item.name is already filled (old save), use it
  if (item.name && item.name.length > 0) return item.name

  const parts = decodeItemParts(item.id)
  if (!parts) return item.category // ultimate fallback

  const baseName = t(`items.base.${parts.category}.${parts.baseIndex}`)
  const prefix = parts.prefixKey != null ? t(`items.prefix.${parts.prefixKey}`) + ' ' : ''
  const suffix = parts.suffixKey != null ? ' ' + t(`items.suffix.${parts.suffixKey}`) : ''

  // Add condition prefix only when item has been appraised (condition is revealed)
  const showCondition = item.appraised && item.condition && item.condition !== 'good'
  const condPrefix = showCondition ? t(`items.condition.${item.condition}`) + ' ' : ''

  return `${condPrefix}${prefix}${baseName}${suffix}`
}

/**
 * Resolve the description for an item using i18n.
 *
 * @param item - The storage item
 * @param t    - The i18n `t()` function from `useI18n()`
 * @returns    Localized description
 */
export function resolveItemDescription(
  item: StorageItem,
  t: (key: string) => string,
): string {
  // Backward compat: if item.description is already filled, use it
  if (item.description && item.description.length > 0) return item.description

  const parts = decodeItemParts(item.id)
  if (!parts) return ''

  return t(`items.desc.${parts.category}.${parts.baseIndex}`)
}

// ─── Value Utilities (re-exported from old items.ts) ────────────

/**
 * Calculate the total value of a list of items (using appraised value if available).
 */
export function calculateTotalItemsValue(items: StorageItem[]): import('break_infinity.js').default {
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
export function applySellTax(value: import('break_infinity.js').default, isAppraised: boolean): import('break_infinity.js').default {
  const taxRate = isAppraised ? SELL_TAX : (SELL_TAX + UNAPPRAISED_SELL_PENALTY)
  const afterTax = value.mul(1 - taxRate)
  return afterTax.max(D(1))
}
