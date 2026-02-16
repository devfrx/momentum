/**
 * Centralized rarity system — single source of truth for rarity tiers,
 * colors, and CSS variable names used across the entire application.
 *
 * Usage:
 *   import { RARITY_COLORS, rarityColor, rarityCssVar } from '@renderer/data/rarity'
 *
 * CSS variables (defined in theme.css):
 *   --t-rarity-common … --t-rarity-mythic
 */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'jackpot' | 'mythic'

/** Numeric ordering for rarity tiers — single source of truth. */
export const RARITY_ORDER: Record<Rarity, number> = {
  common: 0, uncommon: 1, rare: 2, epic: 3,
  legendary: 4, jackpot: 5, mythic: 6,
}

/** Static hex values — use when a JS string is needed (canvas, charts, etc.) */
export const RARITY_COLORS: Record<string, string> = {
  common:    '#9ca3af',
  uncommon:  '#22c55e',
  rare:      '#3b82f6',
  epic:      '#a855f7',
  legendary: '#f59e0b',
  jackpot:   '#ef4444',
  mythic:    '#facc15',
}

/** Return the hex color for a given rarity string */
export function rarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] ?? RARITY_COLORS.common
}

/** Return the CSS custom-property reference: `var(--t-rarity-<rarity>)` */
export function rarityCssVar(rarity: string): string {
  return `var(--t-rarity-${rarity}, ${RARITY_COLORS[rarity] ?? RARITY_COLORS.common})`
}
