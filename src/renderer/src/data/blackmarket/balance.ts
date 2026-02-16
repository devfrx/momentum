/**
 * Black Market — Balance constants
 *
 * Centralized tuning knobs for the underground market system.
 * Adjust these to rebalance without touching game logic.
 */

// ─── Timing (in ticks, 10 ticks/sec) ───────────────────────────

/** How often the deal pool rotates (ticks). Range of [MIN, MAX] for randomized rotation. */
export const DEAL_ROTATION_MIN_TICKS = 9_000   // 15 minutes
export const DEAL_ROTATION_MAX_TICKS = 36_000  // 60 minutes

/** How many deals are available at once */
export const MIN_DEALS_AVAILABLE = 3
export const MAX_DEALS_AVAILABLE = 8

/** Heat decay rate per tick (passive heat reduction) */
export const HEAT_DECAY_PER_TICK = 0.002

/** NPC daily cycle length in ticks (resets daily use counters) */
export const NPC_DAILY_CYCLE_TICKS = 36_000  // 1 hour real time = 1 "day"

/** Investigation base duration range (ticks) */
export const INVESTIGATION_MIN_TICKS = 3_000  // 5 min
export const INVESTIGATION_MAX_TICKS = 9_000  // 15 min

// ─── Economy ────────────────────────────────────────────────────

/** Maximum heat value before capping */
export const MAX_HEAT = 100

/** Heat per deal completed (base, scaled by deal risk) */
export const HEAT_PER_DEAL_BASE = 2

/** Heat per failed deal */
export const HEAT_PER_FAILED_DEAL = 8

/** Investigation fine multiplier (fine = player.cash * this * severity) */
export const INVESTIGATION_FINE_MULT = 0.05

/** Maximum concurrent active effects */
export const MAX_ACTIVE_EFFECTS = 10

/** Maximum concurrent investigations */
export const MAX_INVESTIGATIONS = 3

/** Fence: max daily sell operations */
export const FENCE_DAILY_LIMIT = 3

/** Fence: sell price multiplier (vs base value) */
export const FENCE_SELL_MULTIPLIER = 1.2

/** Fence forge: min value boost (fraction, e.g. 0.25 = +25%) */
export const FENCE_FORGE_MIN_BONUS = 0.25

/** Fence forge: max value boost (fraction, e.g. 0.60 = +60%) */
export const FENCE_FORGE_MAX_BONUS = 0.60

/** Fence forge: heat added per forge */
export const FENCE_FORGE_HEAT = 5

/** Fence forge: cost as fraction of item's current value */
export const FENCE_FORGE_COST_FRACTION = 0.10

/** Fence network: sell multiplier applied to ALL sell channels */
export const FENCE_NETWORK_SELL_BOOST = 1.35

/** Fence network: duration in ticks */
export const FENCE_NETWORK_DURATION_TICKS = 3000  // 5 min

/** Hacker: stock/crypto manipulation range (±%) */
export const HACKER_MANIPULATION_RANGE = 0.50

/** Hacker: manipulation duration (ticks) */
export const HACKER_MANIPULATION_TICKS = 600  // 1 minute

/** Fixer: cost multiplier per active negative event severity */
export const FIXER_COST_PER_SEVERITY = 500

/** Broker: base accuracy for market intel */
export const BROKER_BASE_ACCURACY = 0.5

/** Broker: accuracy bonus per 10 loyalty points */
export const BROKER_LOYALTY_ACCURACY_BONUS = 0.05

/** Smuggler: contraband value multiplier range */
export const SMUGGLER_VALUE_MIN = 0.8
export const SMUGGLER_VALUE_MAX = 3.0
