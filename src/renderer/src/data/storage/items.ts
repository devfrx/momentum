/**
 * Storage Wars — Item type definitions
 *
 * Items are the contents found inside storage units. Each item has a
 * rarity, base value, category, and can be appraised for a more accurate value.
 *
 * **Generation** is handled by `itemGen.ts` (procedural blueprint system).
 * This file only defines the canonical types and re-exports generation helpers.
 */
import type Decimal from 'break_infinity.js'
import type { Rarity } from '../rarity'

export type ItemCategory =
  | 'furniture' | 'electronics' | 'clothing' | 'tools'
  | 'collectibles' | 'art' | 'jewelry' | 'antiques'
  | 'sports' | 'instruments' | 'vehicles' | 'documents'
  | 'junk'
  // Shop-extended categories (items may flow into storage/vault)
  | 'luxury' | 'tech' | 'memorabilia' | 'gems'
  | 'watches' | 'wine' | 'sneakers' | 'cards'
  | 'coins' | 'maps' | 'manuscripts'

/** Item physical condition — affects value via multiplier. */
export type ItemCondition = 'damaged' | 'poor' | 'fair' | 'good' | 'excellent' | 'mint' | 'pristine'

export interface StorageItem {
  id: string
  name: string
  icon: string
  category: ItemCategory
  rarity: Rarity
  /** Base value before any appraisal or multiplier (value at "good" condition). */
  baseValue: Decimal
  /** Flavor text shown to player */
  description: string
  /** Whether this item has been appraised */
  appraised: boolean
  /** Appraised value (set after appraisal) */
  appraisedValue: Decimal | null
  /** Weight factor for sell speed (higher = slower to sell) */
  weight: number
  /** Item condition — optional, defaults to 'good' when absent (backward compat). */
  condition?: ItemCondition
}

// ─── Re-exports from procedural generator ───────────────────────
// The old ITEM_POOL static array is replaced by blueprint-based generation.
// These re-exports maintain backward compatibility for all consumers.

export {
  generateUnitContents,
  generateItem,
  calculateTotalItemsValue,
  applySellTax,
  resolveItemName,
  resolveItemDescription,
  decodeItemParts,
} from './itemGen'
export type { GeneratedItemParts } from './itemGen'
