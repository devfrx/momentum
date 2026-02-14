import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'

/**
 * Jobs / Gig Work — the safety net and early-game income source.
 * These replace the old "click" mechanic: passive tasks that generate
 * a reliable $/s while the player builds up capital.
 *
 * Each job has a base pay-per-tick and optional scaling.
 * The player can run multiple jobs simultaneously (up to a concurrency cap).
 *
 * Jobs are "applied to" — you need to reach a certain player level to
 * qualify, rather than buying them outright.
 */

export interface JobDef {
  id: string
  name: string
  description: string
  icon: string
  /** Base income per game tick (10 ticks/s → multiply by 10 for $/s display) */
  basePayPerTick: Decimal
  /** Minimum player level required to apply for this job (0 = available immediately) */
  requiredLevel: number
  /** Efficiency scaling per "experience level" in this job (additive %) */
  experienceScaling: number
  /** Category for UI grouping */
  category: 'Gig' | 'Freelance' | 'Skilled'
}

export const JOBS: JobDef[] = [
  {
    id: 'delivery',
    name: 'Delivery Driver',
    description: 'Pick up packages, drop them off. Simple and reliable.',
    icon: 'mdi:moped',
    basePayPerTick: D(0.04),
    requiredLevel: 0,
    experienceScaling: 0.03,
    category: 'Gig',
  },
  {
    id: 'dogwalker',
    name: 'Dog Walker',
    description: 'Good boys deserve good walks. Flexible hours.',
    icon: 'mdi:dog-side',
    basePayPerTick: D(0.025),
    requiredLevel: 0,
    experienceScaling: 0.02,
    category: 'Gig',
  },
  {
    id: 'freelance_web',
    name: 'Freelance Web Dev',
    description: 'Build websites for small businesses. Decent margins.',
    icon: 'mdi:language-html5',
    basePayPerTick: D(0.12),
    requiredLevel: 3,
    experienceScaling: 0.04,
    category: 'Freelance',
  },
  {
    id: 'tutoring',
    name: 'Private Tutor',
    description: 'Share your knowledge, earn per session.',
    icon: 'mdi:school',
    basePayPerTick: D(0.08),
    requiredLevel: 2,
    experienceScaling: 0.03,
    category: 'Freelance',
  },
  {
    id: 'handyman',
    name: 'Handyman',
    description: 'Fix things around the house. Tools required.',
    icon: 'mdi:wrench',
    basePayPerTick: D(0.18),
    requiredLevel: 5,
    experienceScaling: 0.04,
    category: 'Skilled',
  },
  {
    id: 'consultant',
    name: 'Business Consultant',
    description: 'Advise small companies. High pay, requires reputation.',
    icon: 'mdi:briefcase-outline',
    basePayPerTick: D(0.4),
    requiredLevel: 10,
    experienceScaling: 0.05,
    category: 'Skilled',
  },
]
