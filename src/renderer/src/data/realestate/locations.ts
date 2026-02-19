/**
 * Location Grades — Lightweight replacement for the old District system
 *
 * Every generated property is assigned a random grade (S/A/B/C/D).
 * The grade modifies rent income and property appreciation only.
 * Higher net worth shifts the weight distribution toward A/S grades.
 *
 * This replaces the entire district/synergy/scan subsystem with a single,
 * easily extensible concept that works for *any* property type.
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

/** Categories remain the same — they come from templates */
export type PropertyCategory =
  | 'Residential'
  | 'Commercial'
  | 'Mixed'
  | 'Hospitality'
  | 'Luxury'
  | 'Industrial'

export type LocationGrade = 'S' | 'A' | 'B' | 'C' | 'D'

export interface LocationGradeData {
  id: LocationGrade
  nameKey: string
  icon: string
  color: string
  /** Multiplier applied to base rent */
  rentMultiplier: number
  /** Multiplier applied to appreciation rate */
  appreciationMultiplier: number
  /** Base weight for random selection (before net-worth shift) */
  baseWeight: number
}

// ═══════════════════════════════════════════════════════════════════
// DATA — ordered worst → best
// ═══════════════════════════════════════════════════════════════════

export const LOCATION_GRADES: LocationGradeData[] = [
  {
    id: 'D',
    nameKey: 'realestate.grade.d',
    icon: 'mdi:map-marker-outline',
    color: '#94a3b8',        // slate-400
    rentMultiplier: 0.80,
    appreciationMultiplier: 0.70,
    baseWeight: 18,
  },
  {
    id: 'C',
    nameKey: 'realestate.grade.c',
    icon: 'mdi:map-marker',
    color: '#a3e635',        // lime-400
    rentMultiplier: 0.90,
    appreciationMultiplier: 0.85,
    baseWeight: 27,
  },
  {
    id: 'B',
    nameKey: 'realestate.grade.b',
    icon: 'mdi:map-marker-check',
    color: '#60a5fa',        // blue-400
    rentMultiplier: 1.00,
    appreciationMultiplier: 1.00,
    baseWeight: 32,
  },
  {
    id: 'A',
    nameKey: 'realestate.grade.a',
    icon: 'mdi:map-marker-star',
    color: '#a78bfa',        // violet-400
    rentMultiplier: 1.15,
    appreciationMultiplier: 1.20,
    baseWeight: 18,
  },
  {
    id: 'S',
    nameKey: 'realestate.grade.s',
    icon: 'mdi:star-circle',
    color: '#f59e0b',        // amber-500
    rentMultiplier: 1.35,
    appreciationMultiplier: 1.50,
    baseWeight: 5,
  },
]

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Look up a grade's data by its letter */
export function getLocationGrade(grade: LocationGrade): LocationGradeData {
  return LOCATION_GRADES.find((g) => g.id === grade)!
}

/**
 * Pick a random location grade, weighted by the player's net worth.
 *
 * As net worth grows, the probability of A and S grades increases.
 * The shift is gentle and logarithmic so early-game players see
 * mostly D/C/B while billionaires see significantly more A/S.
 *
 * @param netWorth – Player's current net worth (number)
 * @returns A randomly selected LocationGrade
 */
export function rollLocationGrade(netWorth: number): LocationGrade {
  // Net-worth "tier" (0 at $1k, ~3 at $1M, ~6 at $1B, ~9 at $1T)
  const tier = Math.max(0, Math.log10(Math.max(netWorth, 1000)) - 3)

  // Build shifted weights: high tiers boost A/S, reduce D
  const weights = LOCATION_GRADES.map((g) => {
    let w = g.baseWeight
    if (g.id === 'S') w += tier * 1.5          // +1.5 per tier
    else if (g.id === 'A') w += tier * 3       // +3 per tier
    else if (g.id === 'B') w += tier * 1       // +1 per tier
    else if (g.id === 'D') w = Math.max(5, w - tier * 3)  // shrinks
    return Math.max(0, w)
  })

  const total = weights.reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (let i = 0; i < LOCATION_GRADES.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return LOCATION_GRADES[i].id
  }
  return 'B' // fallback
}

/**
 * Portfolio category bonus — replaces the old district synergy system.
 *
 * Owning multiple properties of the same category yields a global
 * rent bonus to ALL properties in that category.
 *
 *   2 same-category  → +3 %
 *   5 same-category  → +8 %
 *  10 same-category  → +15 %
 *
 * @returns additive bonus (e.g. 0.08 for +8 %)
 */
export function getCategoryBonus(ownedInCategory: number): number {
  if (ownedInCategory >= 10) return 0.15
  if (ownedInCategory >= 5) return 0.08
  if (ownedInCategory >= 2) return 0.03
  return 0
}
