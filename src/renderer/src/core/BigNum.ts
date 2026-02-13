/**
 * BigNum — Wrapper around break_infinity.js Decimal
 *
 * Provides a centralized import point and utility helpers for working with
 * arbitrarily large numbers in the game. All monetary values, quantities,
 * and multipliers should use Decimal instead of native numbers.
 */
import Decimal from 'break_infinity.js'

// Re-export as both named and default
export { Decimal }
export default Decimal

// ─── Factory helpers ────────────────────────────────────────────────

/** Create a Decimal from any compatible value */
export function D(value: Decimal | number | string): Decimal {
  return new Decimal(value)
}

/** Decimal zero constant (avoids repeated allocations) */
export const ZERO = D(0)
/** Decimal one constant */
export const ONE = D(1)
/** Decimal ten constant */
export const TEN = D(10)
/** Decimal hundred constant */
export const HUNDRED = D(100)
/** Decimal thousand constant */
export const THOUSAND = D(1000)

// ─── Arithmetic helpers ─────────────────────────────────────────────

export function add(a: Decimal, b: Decimal | number): Decimal {
  return a.add(b)
}

export function sub(a: Decimal, b: Decimal | number): Decimal {
  return a.sub(b)
}

export function mul(a: Decimal, b: Decimal | number): Decimal {
  return a.mul(b)
}

export function div(a: Decimal, b: Decimal | number): Decimal {
  const bDec = b instanceof Decimal ? b : new Decimal(b)
  if (bDec.eq(0)) return ZERO
  return a.div(b)
}

export function pow(base: Decimal, exp: Decimal | number): Decimal {
  return base.pow(exp)
}

/** Check if a >= b */
export function gte(a: Decimal, b: Decimal | number): boolean {
  return a.gte(b)
}

/** Check if a > b */
export function gt(a: Decimal, b: Decimal | number): boolean {
  return a.gt(b)
}

/** Check if a <= b */
export function lte(a: Decimal, b: Decimal | number): boolean {
  return a.lte(b)
}

/** Check if a < b */
export function lt(a: Decimal, b: Decimal | number): boolean {
  return a.lt(b)
}

/** Check if a == b */
export function eq(a: Decimal, b: Decimal | number): boolean {
  return a.eq(b)
}

/** Return the maximum of two Decimals */
export function max(a: Decimal, b: Decimal | number): Decimal {
  return Decimal.max(a, b)
}

/** Return the minimum of two Decimals */
export function min(a: Decimal, b: Decimal | number): Decimal {
  return Decimal.min(a, b)
}

/** Clamp a Decimal between min and max */
export function clamp(value: Decimal, minVal: Decimal | number, maxVal: Decimal | number): Decimal {
  return Decimal.max(minVal, Decimal.min(maxVal, value))
}

/** Floor a Decimal to an integer */
export function floor(value: Decimal): Decimal {
  return value.floor()
}

/** Ceil a Decimal to an integer */
export function ceil(value: Decimal): Decimal {
  return value.ceil()
}

// ─── Serialization ──────────────────────────────────────────────────

/** Portable shape for JSON serialization of a Decimal */
export interface SerializedDecimal {
  /** mantissa */
  m: number
  /** exponent */
  e: number
}

/** Serialize a Decimal for JSON storage */
export function serializeDecimal(d: Decimal): SerializedDecimal {
  return { m: d.mantissa, e: d.exponent }
}

/** Deserialize a SerializedDecimal back to a Decimal */
export function deserializeDecimal(s: SerializedDecimal): Decimal {
  return Decimal.fromMantissaExponent(s.m, s.e)
}

/**
 * Deep-walk an object and convert all SerializedDecimal shapes ({ m, e })
 * back into Decimal instances. Useful when loading a full save file.
 */
export function hydrateDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  // Check if this object itself is a SerializedDecimal
  const raw = obj as Record<string, unknown>
  if (
    typeof raw.m === 'number' &&
    typeof raw.e === 'number' &&
    Object.keys(raw).length === 2
  ) {
    return deserializeDecimal(raw as unknown as SerializedDecimal) as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => hydrateDecimals(item)) as unknown as T
  }

  const result: Record<string, unknown> = {}
  for (const key in raw) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      result[key] = hydrateDecimals(raw[key])
    }
  }
  return result as T
}

/**
 * Deep-walk an object and convert all Decimal instances into
 * SerializedDecimal shapes for JSON storage.
 */
export function dehydrateDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Decimal) {
    return serializeDecimal(obj) as unknown as T
  }
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map((item) => dehydrateDecimals(item)) as unknown as T
  }

  const raw = obj as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const key in raw) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      result[key] = dehydrateDecimals(raw[key])
    }
  }
  return result as T
}

// ─── Percentage & ratio helpers ─────────────────────────────────────

/** Compute percentage: (part / total) * 100 — returns a plain number for UI */
export function pct(part: Decimal, total: Decimal): number {
  if (total.eq(0)) return 0
  return part.div(total).mul(100).toNumber()
}

/** Apply a percentage bonus: value * (1 + bonus/100) */
export function applyBonus(value: Decimal, bonusPercent: number): Decimal {
  return value.mul(1 + bonusPercent / 100)
}

/** Linear interpolation between a and b */
export function lerp(a: Decimal, b: Decimal, t: number): Decimal {
  return a.add(b.sub(a).mul(t))
}
