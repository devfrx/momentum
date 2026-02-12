/**
 * Prestige Eras — Progressive tiers of prestige advancement
 *
 * Each era represents a new phase of the game with:
 * - Visual theme changes
 * - Cumulative bonuses
 * - Access to new perks and upgrades
 *
 * Eras are unlocked by reaching total prestige point thresholds.
 */
import { D } from '@renderer/core/BigNum'
import type { EraDef } from './types'

export const PRESTIGE_ERAS: EraDef[] = [
  {
    id: 'era_humble',
    name: 'Newcomer',
    description: 'Your first steps into the simulation. Everything starts from zero.',
    icon: 'mdi:seed',
    minRebirths: 0,
    pointsRequired: D(0),
    themeColor: '#71717a', // zinc
    globalBonus: 0,
    unlockedPerks: [],
  },
  {
    id: 'era_rising',
    name: 'Apprentice',
    description: 'You\'ve learned the basics. The system responds to your inputs.',
    icon: 'mdi:star-rising',
    minRebirths: 1,
    pointsRequired: D(5),
    themeColor: '#22c55e', // green
    globalBonus: 0.03,
    unlockedPerks: ['perk_quick_start', 'perk_auto_collect'],
  },
  {
    id: 'era_established',
    name: 'Practitioner',
    description: 'Your strategies are refined. Efficiency becomes second nature.',
    icon: 'mdi:briefcase-account',
    minRebirths: 3,
    pointsRequired: D(25),
    themeColor: '#71717a', // neutral
    globalBonus: 0.06,
    unlockedPerks: ['perk_offline_boost', 'perk_instant_jobs'],
  },
  {
    id: 'era_titan',
    name: 'Expert',
    description: 'Mastery of systems unlocks deeper mechanics.',
    icon: 'mdi:crown',
    minRebirths: 10,
    pointsRequired: D(100),
    themeColor: '#a855f7', // purple
    globalBonus: 0.1,
    unlockedPerks: ['perk_market_insight', 'perk_tax_haven'],
  },
  {
    id: 'era_legend',
    name: 'Virtuoso',
    description: 'Every action is optimized. The simulation bends to your will.',
    icon: 'mdi:diamond',
    minRebirths: 25,
    pointsRequired: D(500),
    themeColor: '#f59e0b', // amber
    globalBonus: 0.15,
    unlockedPerks: ['perk_golden_touch', 'perk_time_warp'],
  },
  {
    id: 'era_eternal',
    name: 'Transcendent',
    description: 'Beyond mastery lies transcendence. The rules are yours to shape.',
    icon: 'mdi:infinity',
    minRebirths: 50,
    pointsRequired: D(2500),
    themeColor: '#ef4444', // red
    globalBonus: 0.25,
    unlockedPerks: ['perk_omniscience', 'perk_reality_warp'],
  },
]

/**
 * Get the current era based on total prestige points and rebirth count
 */
export function getCurrentEra(totalPoints: number | { toNumber: () => number }, rebirths: number): EraDef {
  const points = typeof totalPoints === 'number' ? totalPoints : totalPoints.toNumber()

  // Find highest unlocked era (iterate backwards)
  for (let i = PRESTIGE_ERAS.length - 1; i >= 0; i--) {
    const era = PRESTIGE_ERAS[i]
    const requiredPoints = era.pointsRequired.toNumber()
    if (points >= requiredPoints && rebirths >= era.minRebirths) {
      return era
    }
  }

  return PRESTIGE_ERAS[0]
}

/**
 * Get the next era to unlock
 */
export function getNextEra(totalPoints: number | { toNumber: () => number }, rebirths: number): EraDef | null {
  const currentEra = getCurrentEra(totalPoints, rebirths)
  const currentIndex = PRESTIGE_ERAS.findIndex(e => e.id === currentEra.id)

  if (currentIndex < PRESTIGE_ERAS.length - 1) {
    return PRESTIGE_ERAS[currentIndex + 1]
  }

  return null
}

/**
 * Calculate progress to next era (0-100)
 */
export function getEraProgress(totalPoints: number | { toNumber: () => number }, rebirths: number): number {
  const points = typeof totalPoints === 'number' ? totalPoints : totalPoints.toNumber()
  const currentEra = getCurrentEra(points, rebirths)
  const nextEra = getNextEra(points, rebirths)

  if (!nextEra) return 100 // Max era reached

  const currentRequired = currentEra.pointsRequired.toNumber()
  const nextRequired = nextEra.pointsRequired.toNumber()
  const range = nextRequired - currentRequired

  if (range <= 0) return 100

  const progress = ((points - currentRequired) / range) * 100
  return Math.min(100, Math.max(0, progress))
}
