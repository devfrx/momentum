/**
 * Black Market (Underground Market) — Type definitions
 *
 * Comprehensive type system for the underground economy:
 * - Rotating deals with risk/reward mechanics
 * - NPC contacts with loyalty and recurring missions
 * - Reputation tiers that gate content progressively
 * - Heat system for consequences and law enforcement
 */
import type Decimal from 'break_infinity.js'

// ─── Reputation ─────────────────────────────────────────────────

export type ReputationTier = 0 | 1 | 2 | 3 | 4 | 5

export interface ReputationTierDef {
  tier: ReputationTier
  /** i18n key for the tier name */
  nameKey: string
  /** Minimum completed deals to reach this tier */
  dealsRequired: number
  /** Risk reduction percentage (0–50) */
  riskReduction: number
  /** Price discount percentage (0–20) */
  priceDiscount: number
  /** Deal categories unlocked at this tier */
  unlockedCategories: DealCategory[]
  /** Icon for the tier badge */
  icon: string
  /** Accent colour for UI */
  color: string
}

// ─── Deals ──────────────────────────────────────────────────────

export type DealCategory =
  | 'intel'       // Insider tips, market info
  | 'goods'       // Contraband, rare items
  | 'finance'     // Money laundering, offshore accounts
  | 'boost'       // Temporary multiplier boosts
  | 'special'     // Unique high-risk high-reward schemes
  | 'legendary'   // Tier 5 exclusive deals

export type DealEffectType =
  | 'income_boost'         // Temporary all-income multiplier
  | 'business_boost'       // Temporary business revenue multiplier
  | 'stock_manipulation'   // Temporary stock price drift
  | 'crypto_manipulation'  // Temporary crypto price drift
  | 'xp_boost'             // Temporary XP gain multiplier
  | 'cash_grant'           // Instant cash payout
  | 'cost_reduction'       // Temporary cost reduction
  | 'gambling_edge'        // Temporary gambling luck boost
  | 'heat_reduction'       // Reduce current heat level
  | 'reputation_boost'     // Extra reputation points
  | 'storage_insider'      // Insider tip on storage wars
  | 'loan_forgery'         // Temporarily reduce loan rates
  | 'deposit_launder'      // Temporarily boost deposit rates (clean money)

export interface DealEffect {
  type: DealEffectType
  /** Numeric value (multiplier, amount, percentage) */
  value: number
  /** Duration in ticks (0 = instant) */
  durationTicks: number
  /** Optional target (stock id, crypto id, sector) */
  target?: string
}

export interface DealConsequence {
  /** Probability (0–1) that this consequence triggers if the deal goes wrong */
  probability: number
  /** Type of negative outcome */
  type: 'cash_loss' | 'heat_spike' | 'income_penalty' | 'market_crash' | 'reputation_loss' | 'investigation'
  /** Value (amount, multiplier, or severity 1–10) */
  value: number
  /** Duration in ticks (0 = instant) */
  durationTicks: number
}

export interface BlackMarketDealDef {
  id: string
  /** i18n key for name */
  nameKey: string
  /** i18n key for description */
  descKey: string
  category: DealCategory
  /** Icon (Iconify format) */
  icon: string
  /** Minimum reputation tier required */
  minTier: ReputationTier
  /** Base cost in cash */
  baseCost: number
  /** Base risk percentage (0–100). Reduced by tier bonuses. */
  baseRisk: number
  /** Effects when the deal succeeds */
  successEffects: DealEffect[]
  /** Possible consequences when the deal fails */
  failConsequences: DealConsequence[]
  /** XP granted on completion (success or fail) */
  xpReward: number
  /** Reputation points granted on success */
  repReward: number
  /** Cooldown in ticks before this deal type appears again */
  cooldownTicks: number
  /** Weight for procedural deal pool generation (higher = more common) */
  weight: number
  /** Whether this deal requires NPC contact involvement */
  requiresContact?: string
}

/** Runtime deal instance (generated from def + current state) */
export interface BlackMarketDeal {
  /** Unique instance id */
  id: string
  /** Reference to definition */
  defId: string
  /** Snapshot of deal properties (with tier adjustments applied) */
  category: DealCategory
  nameKey: string
  descKey: string
  icon: string
  cost: Decimal
  /** Adjusted risk (after tier reduction) */
  risk: number
  effects: DealEffect[]
  failConsequences: DealConsequence[]
  xpReward: number
  repReward: number
  /** Tick when this deal was generated */
  availableAtTick: number
  /** Tick when this deal expires */
  expiresAtTick: number
  /** Status */
  status: 'available' | 'accepted' | 'completed' | 'failed' | 'expired'
}

// ─── NPC Contacts ───────────────────────────────────────────────

export type ContactId = 'broker' | 'fence' | 'fixer' | 'hacker' | 'smuggler'

export interface ContactAbility {
  /** Unique ability id */
  id: string
  /** i18n key for ability name */
  nameKey: string
  /** i18n key for description */
  descKey: string
  /** Icon */
  icon: string
  /** Cost per use */
  cost: number
  /** Cooldown in ticks between uses */
  cooldownTicks: number
  /** Minimum loyalty level (0–100) required */
  minLoyalty: number
  /** Minimum reputation tier */
  minTier: ReputationTier
}

export interface ContactDef {
  id: ContactId
  /** i18n key for NPC name */
  nameKey: string
  /** i18n key for NPC title/role */
  titleKey: string
  /** i18n key for description */
  descKey: string
  /** NPC portrait icon */
  icon: string
  /** Accent color */
  color: string
  /** Minimum reputation tier to unlock this contact */
  unlockTier: ReputationTier
  /** Abilities this NPC offers */
  abilities: ContactAbility[]
  /** Loyalty gain per interaction (base) */
  loyaltyPerUse: number
  /** Maximum loyalty level */
  maxLoyalty: number
}

/** Runtime NPC state */
export interface ContactState {
  contactId: ContactId
  /** Accumulated loyalty (0–100) */
  loyalty: number
  /** Total times used */
  totalInteractions: number
  /** Per-ability cooldowns: abilityId → tick when usable */
  abilityCooldowns: Record<string, number>
  /** Daily uses counter (resets each day cycle) */
  dailyUses: number
  /** Last day-cycle tick for daily reset */
  lastDailyResetTick: number
}

// ─── Heat System ────────────────────────────────────────────────

export type HeatLevel = 0 | 1 | 2 | 3 | 4 | 5

export interface HeatThresholdDef {
  level: HeatLevel
  /** Minimum heat value for this level */
  minHeat: number
  /** i18n key for heat status name */
  nameKey: string
  /** Icon */
  icon: string
  /** Color for UI */
  color: string
  /** Ongoing penalty effects while at this heat level */
  penalties: HeatPenalty[]
}

export interface HeatPenalty {
  type: 'income_penalty' | 'deal_cost_increase' | 'risk_increase' | 'investigation_chance'
  /** Value: multiplier for penalties, percentage for chances */
  value: number
}

// ─── Active Effects ─────────────────────────────────────────────

export interface ActiveBlackMarketEffect {
  /** Unique instance id */
  id: string
  /** Source: deal id or NPC ability id */
  sourceId: string
  /** Effect type (maps to game multipliers) */
  type: DealEffectType
  /** Numeric value */
  value: number
  /** Ticks remaining */
  ticksRemaining: number
  /** Total duration for progress bar */
  totalDuration: number
  /** Optional target */
  target?: string
}

// ─── Investigation Events ───────────────────────────────────────

export interface Investigation {
  /** Unique id */
  id: string
  /** i18n key for investigation title */
  nameKey: string
  /** Severity (1–5, determines penalty) */
  severity: number
  /** Ticks remaining until resolution */
  ticksRemaining: number
  /** Total duration */
  totalDuration: number
  /** Fine amount if found guilty */
  fineAmount: Decimal
  /** Probability of being "caught" (0–1) */
  catchChance: number
  /** Whether the investigation has resolved */
  resolved: boolean
  /** Whether player was caught */
  caught: boolean
}

// ─── Activity Log ───────────────────────────────────────────────

export type ActivityLogSeverity = 'success' | 'danger' | 'warning' | 'info' | 'neutral'

export interface ActivityLogEntry {
  /** Unique id */
  id: string
  /** Tick when the entry was created */
  tick: number
  /** Severity/color coding */
  severity: ActivityLogSeverity
  /** Icon (Iconify format) */
  icon: string
  /** i18n key for the title */
  titleKey: string
  /** i18n interpolation params for title */
  titleParams: Record<string, string | number>
  /** Optional i18n key for detail line */
  detailKey?: string
  /** i18n interpolation params for detail */
  detailParams?: Record<string, string | number>
  /** Source: 'deal' | 'contact' | 'investigation' | 'system' */
  source: 'deal' | 'contact' | 'investigation' | 'system'
}
