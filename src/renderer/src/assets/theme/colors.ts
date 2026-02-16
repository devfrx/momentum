/**
 * Centralized JS color palette — mirrors CSS variables from theme.css
 *
 * USE THESE instead of hardcoding hex values in <script> blocks.
 * In <style> blocks always reference the corresponding var(--t-*) variable.
 *
 * For canvas / Chart.js contexts where CSS vars aren't available,
 * call `getComputedColor('--t-success')` at runtime or import constants below.
 */

/* ── Semantic colors ──────────────────────────────────────────────────── */
export const THEME = {
  accent: '#3ecf71',
  accentHover: '#2db85e',
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

  /* Muted (12 % alpha) */
  successMuted: 'rgba(34, 197, 94, 0.12)',
  warningMuted: 'rgba(245, 165, 36, 0.10)',
  dangerMuted: 'rgba(239, 68, 68, 0.10)',
  infoMuted: 'rgba(100, 116, 139, 0.10)',
  purpleMuted: 'rgba(168, 85, 247, 0.12)',
  orangeMuted: 'rgba(249, 115, 22, 0.10)',
  cyanMuted: 'rgba(6, 182, 212, 0.10)',
  blueMuted: 'rgba(59, 130, 246, 0.10)',
  pinkMuted: 'rgba(236, 72, 153, 0.10)',
  goldMuted: 'rgba(250, 204, 21, 0.10)',

  /* Text / neutral */
  text: '#e8eaed',
  textSecondary: '#8b919e',
  textMuted: '#565c68',
  textInverse: '#0c0e12',

  /* Gambling */
  gambleWin: '#22c55e',
  gambleLose: '#ef4444',
  gamblePush: '#facc15',
  rouletteRed: '#c0392b',
  rouletteBlack: '#1a1a2e',
  rouletteGreen: '#27ae60',
} as const

/* ── Rarity colors ────────────────────────────────────────────────────── */
export const RARITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  jackpot: '#ef4444',
  mythic: '#facc15',
} as const

/* ── Chart.js default palette ─────────────────────────────────────────── */
export const CHART_PALETTE = [
  '#f5a524', // warning gold
  '#22c55e', // success green
  '#64748b', // info slate
  '#a855f7', // purple
  '#ef4444', // danger red
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
  '#facc15', // gold
] as const

/* ── Risk-level palette (low → extreme) ───────────────────────────────── */
export const RISK_COLORS = {
  low: '#22c55e',
  medium: '#f5a524',
  high: '#f97316',
  extreme: '#ef4444',
  critical: '#dc2626',
} as const

/* ── Helper: read a CSS variable value at runtime ─────────────────────── */
export function getComputedColor(varName: string, el?: Element): string {
  const target = el ?? document.documentElement
  return getComputedStyle(target).getPropertyValue(varName).trim()
}
