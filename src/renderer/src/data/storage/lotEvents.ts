/**
 * Storage Wars — Lot Events / Surprises
 *
 * Random events that fire during or before an auction, changing the
 * dynamics in surprising ways. Events are tied to the actual lot being
 * auctioned and affect bidding, item quality, NPC behavior, or the
 * player directly.
 *
 * Design pillars:
 *   1. Surprises must feel immersive — they're narrated like real auction moments.
 *   2. Economy-safe — effects are scoped to a single auction, never permanent.
 *   3. Compatible with existing systems: bidding tactics, NPC AI, rarity, conditions.
 *   4. Lottery feel preserved — cheap auctions CAN still yield amazing items.
 *
 * Events are resolved at two timings:
 *   • ON_REVEAL  — when the lot preview is shown (before first bid)
 *   • ON_BID     — triggered mid-auction at a specific round threshold
 *   • ON_WIN     — bonus/penalty applied after the player wins
 */

// ─── Types ──────────────────────────────────────────────────────

/** When the event fires within the auction lifecycle */
export type LotEventTiming = 'on_reveal' | 'on_bid' | 'on_win'

/** How the event affects the auction */
export type LotEventEffectType =
  | 'npc_dropout'          // One or more NPCs leave immediately
  | 'npc_frenzy'           // Active NPCs increase their max bids
  | 'bid_increment_change' // Bid increment increases or decreases
  | 'extra_item'           // Extra item added to the lot on win
  | 'item_upgrade'         // Random item rarity/condition upgrade in the lot
  | 'item_damage'          // Random item condition downgrade
  | 'hidden_treasure'      // Adds a high-value hidden item on win
  | 'fee_refund'           // Entry fee refunded
  | 'bonus_xp'             // Extra XP on win
  | 'npc_latecomer'        // A new NPC bidder joins mid-auction
  | 'bidder_reveal'        // Reveal the max bid of one NPC
  | 'rarity_boost'         // Improve odds for an on-win bonus roll

/** Mood categorization for UI presentation */
export type LotEventMood = 'positive' | 'negative' | 'neutral' | 'dramatic'

/** An individual effect within a lot event */
export interface LotEventEffect {
  type: LotEventEffectType
  /** Parameter value (e.g. how many NPCs leave, increment multiplier, XP amount) */
  value: number
  /** Optional target (e.g. personality type for npc_dropout) */
  target?: string
}

/** Full definition of a lot event */
export interface LotEventDef {
  id: string
  /** i18n key prefix — actual keys: `storage.lot_event_${id}`, `storage.lot_event_${id}_desc` */
  i18nKey: string
  icon: string
  mood: LotEventMood
  timing: LotEventTiming
  /** Probability weight (higher = more common) */
  weight: number
  /** Effects applied when event triggers */
  effects: LotEventEffect[]
  /** Min round for on_bid events */
  minRound?: number
  /** Auction tier requirements (empty = any tier) */
  allowedTiers?: string[]
  /** Tier exclusions */
  excludedTiers?: string[]
}

/** Runtime state for a resolved lot event on an active auction */
export interface ActiveLotEvent {
  eventId: string
  def: LotEventDef
  /** Whether effects have been applied already */
  applied: boolean
  /** Round at which the event triggers (on_bid only) */
  triggerRound?: number
  /** Result messages for the UI (i18n keys after resolution) */
  resultKeys: string[]
}

// ─── Event Definitions ──────────────────────────────────────────

export const LOT_EVENT_DEFS: LotEventDef[] = [
  // ── Positive Events ──────────────────────────────────────────

  {
    id: 'nervous_bidder',
    i18nKey: 'nervous_bidder',
    icon: 'mdi:emoticon-frown-outline',
    mood: 'positive',
    timing: 'on_reveal',
    weight: 12,
    effects: [{ type: 'npc_dropout', value: 1 }],
  },
  {
    id: 'leaked_manifest',
    i18nKey: 'leaked_manifest',
    icon: 'mdi:file-document-alert',
    mood: 'positive',
    timing: 'on_reveal',
    weight: 8,
    effects: [{ type: 'bidder_reveal', value: 1 }],
  },
  {
    id: 'auctioneer_discount',
    i18nKey: 'auctioneer_discount',
    icon: 'mdi:sale',
    mood: 'positive',
    timing: 'on_reveal',
    weight: 7,
    effects: [{ type: 'bid_increment_change', value: 0.5 }], // halve increment
  },
  {
    id: 'forgotten_safe',
    i18nKey: 'forgotten_safe',
    icon: 'mdi:safe-square-outline',
    mood: 'dramatic',
    timing: 'on_win',
    weight: 4,
    effects: [{ type: 'hidden_treasure', value: 1 }],
  },
  {
    id: 'bonus_crate',
    i18nKey: 'bonus_crate',
    icon: 'mdi:package-variant-plus',
    mood: 'positive',
    timing: 'on_win',
    weight: 6,
    effects: [{ type: 'extra_item', value: 1 }],
  },
  {
    id: 'pristine_find',
    i18nKey: 'pristine_find',
    icon: 'mdi:star-shooting',
    mood: 'dramatic',
    timing: 'on_win',
    weight: 3,
    effects: [{ type: 'item_upgrade', value: 2 }], // upgrade 2 steps
  },
  {
    id: 'entry_refund',
    i18nKey: 'entry_refund',
    icon: 'mdi:cash-refund',
    mood: 'positive',
    timing: 'on_reveal',
    weight: 5,
    effects: [{ type: 'fee_refund', value: 1 }],
  },
  {
    id: 'lucky_break',
    i18nKey: 'lucky_break',
    icon: 'mdi:clover',
    mood: 'positive',
    timing: 'on_win',
    weight: 5,
    effects: [{ type: 'bonus_xp', value: 15 }],
  },
  {
    id: 'insurance_payout',
    i18nKey: 'insurance_payout',
    icon: 'mdi:shield-check',
    mood: 'positive',
    timing: 'on_win',
    weight: 3,
    effects: [{ type: 'rarity_boost', value: 1 }],
    excludedTiers: ['suburban'],
  },

  // ── Negative Events ──────────────────────────────────────────

  {
    id: 'bidding_war',
    i18nKey: 'bidding_war',
    icon: 'mdi:sword-cross',
    mood: 'negative',
    timing: 'on_reveal',
    weight: 10,
    effects: [{ type: 'npc_frenzy', value: 1.3 }], // +30% NPC budgets
  },
  {
    id: 'auctioneer_surcharge',
    i18nKey: 'auctioneer_surcharge',
    icon: 'mdi:cash-plus',
    mood: 'negative',
    timing: 'on_reveal',
    weight: 6,
    effects: [{ type: 'bid_increment_change', value: 1.8 }], // nearly double
  },
  {
    id: 'water_damage',
    i18nKey: 'water_damage',
    icon: 'mdi:water-alert',
    mood: 'negative',
    timing: 'on_win',
    weight: 7,
    effects: [{ type: 'item_damage', value: 2 }], // downgrade 2 steps
  },
  {
    id: 'late_shark',
    i18nKey: 'late_shark',
    icon: 'mdi:account-alert',
    mood: 'negative',
    timing: 'on_bid',
    weight: 5,
    effects: [{ type: 'npc_latecomer', value: 1, target: 'shark' }],
    minRound: 3,
  },

  // ── Neutral / Dramatic Events ────────────────────────────────

  {
    id: 'crowd_surge',
    i18nKey: 'crowd_surge',
    icon: 'mdi:account-group',
    mood: 'neutral',
    timing: 'on_bid',
    weight: 6,
    effects: [
      { type: 'npc_frenzy', value: 1.15 },
      { type: 'bonus_xp', value: 5 },
    ],
    minRound: 2,
  },
  {
    id: 'mystery_box',
    i18nKey: 'mystery_box',
    icon: 'mdi:help-box',
    mood: 'dramatic',
    timing: 'on_win',
    weight: 4,
    effects: [
      { type: 'extra_item', value: 1 },
      { type: 'item_damage', value: 1 },
    ],
  },
  {
    id: 'famous_owner',
    i18nKey: 'famous_owner',
    icon: 'mdi:star-face',
    mood: 'dramatic',
    timing: 'on_reveal',
    weight: 3,
    effects: [
      { type: 'npc_frenzy', value: 1.5 },
      { type: 'item_upgrade', value: 1 },
    ],
  },
  {
    id: 'power_outage',
    i18nKey: 'power_outage',
    icon: 'mdi:flash-alert',
    mood: 'neutral',
    timing: 'on_bid',
    weight: 4,
    effects: [
      { type: 'npc_dropout', value: 1 },
      { type: 'bid_increment_change', value: 1.5 },
    ],
    minRound: 4,
  },
]

// ─── Generation Helpers ─────────────────────────────────────────

/**
 * Pick lot events for a new auction. An auction can have 0–2 events.
 *
 * @param tierKey  Location tier (used for tier-gated events)
 * @param luckBonus  Player luck bonus (increases event chance)
 */
export function rollLotEvents(
  tierKey: string,
  luckBonus: number = 0,
  eventChanceMult: number = 1,
): ActiveLotEvent[] {
  // Base chance of having at least one event: 35% + luck, scaled by tier multiplier
  const eventChance = Math.min(0.65, (0.35 + luckBonus * 0.05) * eventChanceMult)
  if (Math.random() > eventChance) return []

  // Filter eligible events
  const eligible = LOT_EVENT_DEFS.filter(e => {
    if (e.allowedTiers && e.allowedTiers.length > 0 && !e.allowedTiers.includes(tierKey)) return false
    if (e.excludedTiers && e.excludedTiers.includes(tierKey)) return false
    return true
  })
  if (eligible.length === 0) return []

  const picked: ActiveLotEvent[] = []
  const usedIds = new Set<string>()

  // First event (always)
  const first = weightedPick(eligible)
  if (first) {
    usedIds.add(first.id)
    picked.push(toActiveLotEvent(first))
  }

  // 20% chance of a second event (+ luck), also scaled by tier multiplier
  const secondChance = Math.min(0.40, (0.20 + luckBonus * 0.03) * eventChanceMult)
  if (Math.random() < secondChance) {
    const remaining = eligible.filter(e => !usedIds.has(e.id))
    const second = weightedPick(remaining)
    if (second) {
      picked.push(toActiveLotEvent(second))
    }
  }

  return picked
}

/**
 * Get the on_reveal events (those the player sees immediately).
 */
export function getRevealEvents(events: ActiveLotEvent[]): ActiveLotEvent[] {
  return events.filter(e => e.def.timing === 'on_reveal')
}

/**
 * Get on_bid events that should fire at the given round.
 */
export function getBidEvents(events: ActiveLotEvent[], round: number): ActiveLotEvent[] {
  return events.filter(e =>
    e.def.timing === 'on_bid'
    && !e.applied
    && round >= (e.triggerRound ?? 0),
  )
}

/**
 * Get on_win events (applied when the player wins the auction).
 */
export function getWinEvents(events: ActiveLotEvent[]): ActiveLotEvent[] {
  return events.filter(e => e.def.timing === 'on_win' && !e.applied)
}

/**
 * Check if a lot event set has any unapplied event for a given timing.
 */
export function hasUnappliedEvent(events: ActiveLotEvent[], timing: LotEventTiming): boolean {
  return events.some(e => e.def.timing === timing && !e.applied)
}

// ─── Internal Helpers ───────────────────────────────────────────

function weightedPick(defs: LotEventDef[]): LotEventDef | null {
  if (defs.length === 0) return null
  const total = defs.reduce((s, d) => s + d.weight, 0)
  let roll = Math.random() * total
  for (const d of defs) {
    roll -= d.weight
    if (roll <= 0) return d
  }
  return defs[defs.length - 1]
}

function toActiveLotEvent(def: LotEventDef): ActiveLotEvent {
  return {
    eventId: def.id,
    def,
    applied: false,
    // on_bid events trigger at minRound + 0–2 random delay
    triggerRound: def.timing === 'on_bid'
      ? (def.minRound ?? 2) + Math.floor(Math.random() * 3)
      : undefined,
    resultKeys: [],
  }
}
