/**
 * Centralized JS color palette — mirrors CSS variables from theme.css.
 *
 * IMPORTANT: These values MUST stay in sync with theme.css `:root` tokens.
 * If you change a color here, update the corresponding --t-* variable too.
 *
 * For canvas / Chart.js contexts where CSS vars are not available,
 * prefer `getComputedColor('--t-success')` at runtime instead of these
 * constants — it guarantees consistency with the active theme.
 */

/* -- Semantic colors (synced with theme.css :root) -- */
export const THEME = {
  accent: '#22c55e',
  accentHover: '#16a34a',
  success: '#22c55e',
  successHover: '#16a34a',
  warning: '#eab308',       // theme.css --t-warning
  warningHover: '#ca8a04',  // theme.css --t-warning-hover
  danger: '#ef4444',
  dangerHover: '#dc2626',
  info: '#71717a',          // theme.css --t-info
  infoHover: '#52525b',     // theme.css --t-info-hover
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

  /* Muted (alpha) — synced with theme.css 0.10 alpha */
  successMuted: 'rgba(34, 197, 94, 0.10)',
  warningMuted: 'rgba(234, 179, 8, 0.10)',   // synced
  dangerMuted: 'rgba(239, 68, 68, 0.10)',    // synced
  infoMuted: 'rgba(113, 113, 122, 0.10)',    // synced
  purpleMuted: 'rgba(168, 85, 247, 0.10)',   // synced
  orangeMuted: 'rgba(249, 115, 22, 0.10)',   // synced
  cyanMuted: 'rgba(6, 182, 212, 0.10)',      // synced
  blueMuted: 'rgba(59, 130, 246, 0.10)',     // synced
  pinkMuted: 'rgba(236, 72, 153, 0.10)',     // synced
  goldMuted: 'rgba(250, 204, 21, 0.10)',     // synced

  /* Text / neutral (dark-theme values from theme.css [data-theme='dark']) */
  text: '#ececef',          // theme.css --t-text (dark)
  textSecondary: '#8b8b95', // theme.css --t-text-secondary (dark)
  textMuted: '#55555e',     // theme.css --t-text-muted (dark)
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
