import type Decimal from 'break_infinity.js'

import { BUSINESS_SKILLS } from './skills/business-skills'
import { EMPIRE_SKILLS } from './skills/empire-skills'
import { FINANCE_SKILLS } from './skills/finance-skills'
import { GAMBLING_SKILLS } from './skills/gambling-skills'
import { PRESTIGE_SKILLS } from './skills/prestige-skills'

export type UpgradeTarget =
  | 'jobEfficiency'
  | 'businessRevenue'
  | 'costReduction'
  | 'customerAttraction'
  | 'allIncome'
  | 'stockReturn'
  | 'cryptoReturn'
  | 'realEstateRent'
  | 'startupSuccess'
  | 'gamblingLuck'
  | 'xpGain'
  | 'offlineEfficiency'
  | 'prestigeGain'
  | 'loanRate'
  | 'depositRate'

export interface UpgradeDef {
  id: string
  name: string
  description: string
  effectDescription: string
  icon: string
  cost: Decimal
  target: UpgradeTarget
  /** Bonus fraction added to base 1.0 — e.g. 0.25 → ×1.25, -0.15 → ×0.85 */
  multiplier: number
  category: string
  prerequisites: string[]
  /** Row (tier) in the skill tree — 0 = root */
  row: number
  /** Column in the skill tree — 0-based, typically 0-4 */
  col: number
}

/**
 * Skill tree categories and their display order.
 * Each category is rendered as a separate visual tree.
 */
export const SKILL_TREE_META = [
  { id: 'Business', name: 'Business', icon: 'mdi:domain', accent: '#71717a' },
  { id: 'Finance', name: 'Finance', icon: 'mdi:chart-line', accent: '#22c55e' },
  { id: 'Gambling', name: 'Gambling', icon: 'mdi:clover', accent: '#f59e0b' },
  { id: 'Empire', name: 'Empire', icon: 'mdi:crown', accent: '#a855f7' },
  { id: 'Prestige', name: 'Prestige', icon: 'mdi:star-circle', accent: '#ef4444' },
] as const

/**
 * Combined upgrade definitions — 375 nodes across 5 category trees.
 * Each category file lives in ./skills/<category>-skills.ts for scalability.
 */
export const UPGRADES: UpgradeDef[] = [
  ...BUSINESS_SKILLS,
  ...FINANCE_SKILLS,
  ...GAMBLING_SKILLS,
  ...EMPIRE_SKILLS,
  ...PRESTIGE_SKILLS,
]
