/**
 * useFormat — Number and currency formatting composable
 *
 * Formats Decimal (big numbers) for display with suffixes or scientific notation.
 */
import { toRaw } from 'vue'
import Decimal from 'break_infinity.js'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'

// Standard SI-style suffixes for "short" format
const SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc',
  'No', 'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc',
  'SpDc', 'OcDc', 'NoDc', 'Vg', 'UVg', 'DVg', 'TVg', 'QaVg',
  'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', 'Tg'
]

export function useFormat() {
  const settings = useSettingsStore()

  /**
   * Format a Decimal for display according to user settings.
   */
  function formatNumber(value: Decimal | number, decimals: number = 2): string {
    const raw = toRaw(value)
    const d = raw instanceof Decimal ? raw : new Decimal(raw)

    if (d.eq(0)) return '0'
    if (!isFinite(d.mantissa) || !isFinite(d.exponent)) return '∞'

    const format = settings.numberFormat

    if (format === 'scientific') {
      return formatScientific(d, decimals)
    }
    if (format === 'engineering') {
      return formatEngineering(d, decimals)
    }

    // Short format with suffixes
    return formatShort(d, decimals)
  }

  /** Format as currency ($) */
  function formatCash(value: Decimal | number, decimals: number = 2): string {
    const raw = toRaw(value)
    const d = raw instanceof Decimal ? raw : new Decimal(raw)
    if (d.lt(0)) return `-$${formatNumber(d.abs(), decimals)}`
    return `$${formatNumber(d, decimals)}`
  }

  /** Format a percentage with +/- sign (for deltas/changes) */
  function formatPercent(value: number, decimals: number = 1): string {
    if (!isFinite(value)) return '∞%'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(decimals)}%`
  }

  /** Format a percentage without sign (for rates, probabilities) */
  function formatRate(value: number, decimals: number = 1): string {
    if (!isFinite(value)) return '∞%'
    return `${value.toFixed(decimals)}%`
  }

  /** Format time in seconds to human-readable */
  function formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.floor(seconds)}s`
    if (seconds < 3600) {
      const m = Math.floor(seconds / 60)
      const s = Math.floor(seconds % 60)
      return `${m}m ${s}s`
    }
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  /** Format with multiplier display (e.g. "×1.50") */
  function formatMultiplier(value: Decimal | number): string {
    const raw = toRaw(value)
    const d = raw instanceof Decimal ? raw : new Decimal(raw)
    if (d.lt(1000)) return `×${d.toFixed(2)}`
    return `×${formatNumber(d, 2)}`
  }

  /**
   * Full cash value with thousand separators, no suffix abbreviation.
   * e.g. $1,234,567,890.12 — useful for tooltips.
   */
  function formatCashFull(value: Decimal | number, decimals: number = 2): string {
    const raw = toRaw(value)
    const d = raw instanceof Decimal ? raw : new Decimal(raw)
    if (d.eq(0)) return '$0'
    const neg = d.lt(0)
    const abs = neg ? d.abs() : d
    // If the number is beyond safe integer range, show scientific notation
    if (abs.exponent > 15) {
      const mantissa = abs.mantissa.toFixed(decimals)
      const exp = abs.exponent
      return `${neg ? '-' : ''}$${mantissa} × 10^${exp}`
    }
    const n = abs.toNumber()
    const formatted = n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    return neg ? `-$${formatted}` : `$${formatted}`
  }

  return { formatNumber, formatCash, formatCashFull, formatPercent, formatRate, formatTime, formatMultiplier }
}

// ─── Internal formatters ────────────────────────────────────────────

/** Compute how many decimals to show for small numbers so they're never "0.00" */
export function smartDecimals(n: number, minDecimals: number = 2): number {
  const abs = Math.abs(n)
  if (abs === 0 || abs >= 1) return minDecimals
  // Count leading zeros after decimal: e.g. 0.00001 → 5
  const leadingZeros = Math.max(0, -Math.floor(Math.log10(abs)) - 1)
  return Math.max(minDecimals, leadingZeros + 2)
}

function formatShort(d: Decimal, decimals: number): string {
  if (d.abs().lt(1000)) {
    const n = d.toNumber()
    // Auto-increase precision for very small numbers
    const effectiveDecimals = smartDecimals(n, decimals)
    return n.toFixed(effectiveDecimals)
  }

  const exp = d.exponent
  const suffixIndex = Math.floor(exp / 3)

  if (suffixIndex < SUFFIXES.length) {
    const divisor = Math.pow(10, suffixIndex * 3)
    const value = d.div(divisor).toNumber()
    return `${value.toFixed(decimals)}${SUFFIXES[suffixIndex]}`
  }

  // Beyond known suffixes, fall back to scientific
  return formatScientific(d, decimals)
}

function formatScientific(d: Decimal, decimals: number): string {
  if (d.abs().lt(1000)) {
    const n = d.toNumber()
    return n.toFixed(smartDecimals(n, decimals))
  }
  const m = d.mantissa
  const e = d.exponent
  return `${m.toFixed(decimals)}e${e}`
}

function formatEngineering(d: Decimal, decimals: number): string {
  if (d.abs().lt(1000)) {
    const n = d.toNumber()
    return n.toFixed(smartDecimals(n, decimals))
  }
  const exp = d.exponent
  const engExp = Math.floor(exp / 3) * 3
  const mantissa = d.div(new Decimal(10).pow(engExp)).toNumber()
  return `${mantissa.toFixed(decimals)}E${engExp}`
}

// ─── Standalone formatCash (for use outside composable context) ─────

export function formatCashStandalone(value: Decimal | number, decimals: number = 2): string {
  const raw = toRaw(value)
  const d = raw instanceof Decimal ? raw : new Decimal(raw)
  if (d.eq(0)) return '$0'
  if (d.lt(0)) return `-$${formatShort(d.abs(), decimals)}`
  return `$${formatShort(d, decimals)}`
}

/** Format a raw number as price string with smart precision for small values */
export function formatPrice(v: number): string {
  const dec = smartDecimals(v, 2)
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
