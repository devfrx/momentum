/**
 * Centralized JS color palette - mirrors CSS variables from theme.css
 *
 * USE THESE instead of hardcoding hex values in script blocks.
 * In style blocks always reference the corresponding var(--t-*) variable.
 *
 * For canvas / Chart.js contexts where CSS vars are not available,
 * call getComputedColor('--t-success') at runtime or import constants below.
 */

/* -- Semantic colors -- */
export const THEME = {
  accent: '#22c55e',
  accentHover: '#16a34a',
  success: '#22c55e',
  successHover: '#16a34a',
  warning: '#f5a524',
  warningHover: '#d97706',
  danger: '#ef4444',
  dangerHover: '#dc2626',
  info: '#64748b',
  infoHover: '#475569',
  purple: '#a855f7',
  purpleHover: '#9333ea',
  orange: '#f97316',
  orangeHover: '#ea580c',
  cyan: '#06b6d4',
  cyanHover: '#0891b2',
  blue: '#3b82f6',
  blueHover: '#2563eb',
  pink: '#ec4899',
  pinkHover: '#db2777',
  gold: '#facc15',
  goldHover: '#eab308',

  /* Muted (alpha) */
  successMuted: 'rgba(34, 197, 94, 0.10)',
  warningMuted: 'rgba(245, 165, 36, 0.08)',
  dangerMuted: 'rgba(239, 68, 68, 0.08)',
  infoMuted: 'rgba(100, 116, 139, 0.08)',
  purpleMuted: 'rgba(168, 85, 247, 0.08)',
  orangeMuted: 'rgba(249, 115, 22, 0.08)',
  cyanMuted: 'rgba(6, 182, 212, 0.08)',
  blueMuted: 'rgba(59, 130, 246, 0.08)',
  pinkMuted: 'rgba(236, 72, 153, 0.08)',
  goldMuted: 'rgba(250, 204, 21, 0.08)',

  /* Text / neutral */
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#52525b',
  textInverse: '#09090b',

  /* Gambling */
  gambleWin: '#22c55e',
  gambleLose: '#ef4444',
  gamblePush: '#facc15',
  rouletteRed: '#c0392b',
  rouletteBlack: '#1a1a2e',
  rouletteGreen: '#27ae60',
} as const

/* -- Rarity colors -- */
export const RARITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  jackpot: '#ef4444',
  mythic: '#facc15',
} as const

/* -- Chart.js default palette -- */
export const CHART_PALETTE = [
  '#f5a524',
  '#22c55e',
  '#64748b',
  '#a855f7',
  '#ef4444',
  '#3b82f6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
  '#facc15',
] as const

/* -- Risk-level palette -- */
export const RISK_COLORS = {
  low: '#22c55e',
  medium: '#f5a524',
  high: '#f97316',
  extreme: '#ef4444',
  critical: '#dc2626',
} as const

/* -- Helper: read a CSS variable value at runtime -- */
export function getComputedColor(varName: string, el?: Element): string {
  const target = el ?? document.documentElement
  return getComputedStyle(target).getPropertyValue(varName).trim()
}
