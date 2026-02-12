/**
 * Prestige System Types
 *
 * Core type definitions for the prestige/rebirth system.
 * Used by eras, milestones, perks, and upgrades.
 */
import type Decimal from 'break_infinity.js'

// ─── Effect Types ─────────────────────────────────────────────────
export type PrestigeEffectType =
  | 'global_multiplier'      // Multiplies all income
  | 'prestige_gain'          // Multiplies prestige points earned
  | 'job_efficiency'         // Jobs start more efficient
  | 'offline_bonus'          // Increases offline progress efficiency
  | 'starting_cash'          // Cash granted on prestige
  | 'starting_xp'            // XP granted on prestige
  | 'unlock'                 // Unlocks a feature
  | 'loan_discount'          // Reduces loan interest rates
  | 'xp_gain'                // Multiplies XP gain
  | 'cost_reduction'         // Reduces costs
  | 'business_revenue'       // Multiplies business revenue
  | 'stock_returns'          // Improves stock returns
  | 'crypto_returns'         // Improves crypto returns
  | 'real_estate_income'     // Multiplies real estate income
  | 'deposit_bonus'           // Boosts deposit APY

// ─── Era System ───────────────────────────────────────────────────
export interface EraDef {
  id: string
  name: string
  description: string
  icon: string
  /** Minimum prestige rebirths required to enter this era */
  minRebirths: number
  /** Total prestige points required to unlock */
  pointsRequired: Decimal
  /** Theme color for UI accents */
  themeColor: string
  /** Cumulative multiplier bonus for reaching this era */
  globalBonus: number
  /** Special perks unlocked in this era */
  unlockedPerks: string[]
}

// ─── Milestone System ─────────────────────────────────────────────
export interface MilestoneDef {
  id: string
  name: string
  description: string
  icon: string
  /** Condition to unlock */
  condition: MilestoneCondition
  /** Rewards granted on unlock */
  rewards: MilestoneReward[]
  /** Era requirement (optional) */
  eraRequired?: string
}

export interface MilestoneCondition {
  type: 'total_points' | 'rebirths' | 'era' | 'upgrades_bought' | 'total_cash_earned'
  value: number | Decimal
}

export interface MilestoneReward {
  type: PrestigeEffectType
  value: number
  target?: string
}

// ─── Perk System ──────────────────────────────────────────────────
export interface PerkDef {
  id: string
  name: string
  description: string
  icon: string
  /** Cost in prestige points */
  cost: Decimal
  /** One-time effect */
  effect: PerkEffect
  /** Prerequisites (other perk IDs) */
  prerequisites: string[]
  /** Era requirement */
  eraRequired?: string
  /** Category for UI grouping */
  category: 'automation' | 'boost' | 'unlock' | 'quality_of_life'
}

export interface PerkEffect {
  type: PrestigeEffectType
  value: number
  target?: string
  /** If true, effect is permanent even after prestige reset */
  permanent: boolean
}

// ─── Upgrade System (Repeatable) ──────────────────────────────────
export interface PrestigeUpgradeDef {
  id: string
  name: string
  description: string
  icon: string
  /** Base cost in prestige points */
  cost: Decimal
  /** Cost multiplier per level owned */
  costScaling: number
  /** Max purchasable level (0 = infinite) */
  maxLevel: number
  /** Effect type */
  effectType: PrestigeEffectType
  /** Effect value per level */
  effectValue: number
  /** Category for UI grouping */
  category: 'income' | 'progression' | 'quality_of_life' | 'starting_bonus'
  /** Era requirement */
  eraRequired?: string
}

// ─── Runtime State Types ──────────────────────────────────────────
export interface PrestigeUpgrade extends PrestigeUpgradeDef {
  level: number
}

export interface Milestone extends MilestoneDef {
  unlocked: boolean
  unlockedAtTick: number | null
}

export interface Perk extends PerkDef {
  purchased: boolean
  purchasedAtTick: number | null
}
