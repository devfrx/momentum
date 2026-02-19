/**
 * Storage Wars — Bidding Tactics & NPC Reactions
 *
 * Adds depth to the bidding phase with player-initiated tactical moves
 * and dynamic NPC behaviour that reacts to those moves. Three core
 * mechanics:
 *
 * 1. **Intimidate** — Player shows confidence, scaring weak NPCs into
 *    dropping out but provoking aggressive/shark NPCs into counter-bids.
 *    Limited uses per auction (1 base, upgradable via skill tree).
 *
 * 2. **Bluff** — Player fakes enthusiasm without actually raising the bid.
 *    Can trick cautious/newbie NPCs into premature dropout but has a
 *    chance to backfire (unpredictable/bluffer NPCs call the bluff).
 *    Limited uses per auction (1 base).
 *
 * 3. **Sniper Bid** — During going-once/going-twice/final-call phases,
 *    player can place a last-second "sniper" bid that gives NPCs very
 *    little time to respond. Costs a small premium on top of the bid.
 *    Only available during going phases, 1 per auction.
 *
 * NPC "tell" system — each personality emits observable micro-behaviours
 * that a skilled player can learn to read:
 *   - Fidgeting, crossing arms, looking away (nervous / about to drop)
 *   - Leaning forward, cracking knuckles (about to bid aggressively)
 *   - Checking phone, whispering (disinterested, close to dropout)
 *   - Smirking (bluffer trait — likely has low budget despite big bids)
 *
 * All constants are grouped for easy rebalancing.
 */

import type { AuctionBidder, BidderPersonality, AuctionPhase } from './auctions'
import type Decimal from 'break_infinity.js'

// ─── Balance Constants ──────────────────────────────────────────

/** Max intimidate uses per auction (base, before skill bonuses). */
export const INTIMIDATE_MAX_USES = 1

/** Max bluff uses per auction (base, before skill bonuses). */
export const BLUFF_MAX_USES = 1

/** Max sniper bid uses per auction. */
export const SNIPER_MAX_USES = 1

/** Extra cost multiplier for sniper bids (1.15 = 15% premium). */
export const SNIPER_PREMIUM = 1.15

/** Minimum round before intimidate/bluff can be used. */
export const TACTIC_MIN_ROUND = 1

/** Cooldown rounds after using a tactic before another can be used. */
export const TACTIC_COOLDOWN_ROUNDS = 1

/** After a sniper bid, NPCs get reduced response ticks (fraction of normal). */
export const SNIPER_RESPONSE_FRACTION = 0.3

// ─── Intimidate Effects per Personality ─────────────────────────

export interface IntimidateEffect {
  /** Extra dropout probability added for this round. */
  dropoutBoost: number
  /** If true, NPC may counter-bid more aggressively instead of dropping. */
  counterBidChance: number
  /** Counter-bid jump multiplier (how much they raise if countering). */
  counterBidJump: number
}

export const INTIMIDATE_EFFECTS: Record<BidderPersonality, IntimidateEffect> = {
  cautious:      { dropoutBoost: 0.45, counterBidChance: 0.05, counterBidJump: 1.0 },
  newbie:        { dropoutBoost: 0.60, counterBidChance: 0.02, counterBidJump: 1.0 },
  aggressive:    { dropoutBoost: 0.05, counterBidChance: 0.55, counterBidJump: 2.5 },
  shark:         { dropoutBoost: 0.02, counterBidChance: 0.65, counterBidJump: 3.0 },
  unpredictable: { dropoutBoost: 0.25, counterBidChance: 0.30, counterBidJump: 2.0 },
  bluffer:       { dropoutBoost: 0.20, counterBidChance: 0.35, counterBidJump: 4.0 },
}

// ─── Bluff Effects per Personality ──────────────────────────────

export interface BluffEffect {
  /** Chance NPC falls for the bluff and drops out. */
  fooledChance: number
  /** Chance NPC "calls the bluff" — stays in and bids harder. */
  callBluffChance: number
  /** Bid jump if NPC calls the bluff. */
  callBluffJump: number
}

export const BLUFF_EFFECTS: Record<BidderPersonality, BluffEffect> = {
  cautious:      { fooledChance: 0.50, callBluffChance: 0.05, callBluffJump: 1.0 },
  newbie:        { fooledChance: 0.65, callBluffChance: 0.03, callBluffJump: 1.0 },
  aggressive:    { fooledChance: 0.10, callBluffChance: 0.40, callBluffJump: 2.0 },
  shark:         { fooledChance: 0.05, callBluffChance: 0.60, callBluffJump: 2.5 },
  unpredictable: { fooledChance: 0.30, callBluffChance: 0.25, callBluffJump: 3.0 },
  bluffer:       { fooledChance: 0.15, callBluffChance: 0.55, callBluffJump: 3.5 },
}

// ─── NPC Tell System ────────────────────────────────────────────

export type TellMood = 'nervous' | 'confident' | 'disinterested' | 'aggressive' | 'smirking' | 'neutral'

export interface NpcTell {
  mood: TellMood
  icon: string
  /** i18n key suffix — resolved as `storage.tell_${key}` */
  i18nKey: string
}

/**
 * Available tells per personality, weighted by budget usage.
 * Low budget usage → more confident tells. High → more nervous.
 */
const PERSONALITY_TELLS: Record<BidderPersonality, {
  low: NpcTell[]    // budgetUsed < 0.3
  mid: NpcTell[]    // 0.3 ≤ budgetUsed < 0.7
  high: NpcTell[]   // budgetUsed ≥ 0.7
}> = {
  cautious: {
    low:  [{ mood: 'nervous',      icon: 'mdi:emoticon-neutral-outline', i18nKey: 'shifting_weight' }],
    mid:  [{ mood: 'nervous',      icon: 'mdi:emoticon-sad-outline',     i18nKey: 'biting_lip' }],
    high: [{ mood: 'disinterested', icon: 'mdi:phone-outline',           i18nKey: 'checking_phone' }],
  },
  aggressive: {
    low:  [{ mood: 'confident',   icon: 'mdi:arm-flex',                  i18nKey: 'cracking_knuckles' }],
    mid:  [{ mood: 'aggressive',  icon: 'mdi:emoticon-angry-outline',    i18nKey: 'leaning_forward' }],
    high: [{ mood: 'aggressive',  icon: 'mdi:fire',                      i18nKey: 'staring_down' }],
  },
  unpredictable: {
    low:  [{ mood: 'smirking',    icon: 'mdi:emoticon-wink-outline',     i18nKey: 'whistling' }],
    mid:  [{ mood: 'neutral',     icon: 'mdi:help-circle-outline',       i18nKey: 'looking_around' }],
    high: [{ mood: 'nervous',     icon: 'mdi:emoticon-confused-outline', i18nKey: 'scratching_head' }],
  },
  shark: {
    low:  [{ mood: 'confident',   icon: 'mdi:eye-outline',               i18nKey: 'watching_closely' }],
    mid:  [{ mood: 'confident',   icon: 'mdi:shield-outline',            i18nKey: 'arms_crossed' }],
    high: [{ mood: 'aggressive',  icon: 'mdi:target',                    i18nKey: 'locked_in' }],
  },
  newbie: {
    low:  [{ mood: 'nervous',     icon: 'mdi:account-question-outline',  i18nKey: 'looking_confused' }],
    mid:  [{ mood: 'nervous',     icon: 'mdi:emoticon-sad-outline',      i18nKey: 'fidgeting' }],
    high: [{ mood: 'disinterested', icon: 'mdi:exit-run',                i18nKey: 'eyeing_exit' }],
  },
  bluffer: {
    low:  [{ mood: 'smirking',    icon: 'mdi:emoticon-cool-outline',     i18nKey: 'smirking' }],
    mid:  [{ mood: 'confident',   icon: 'mdi:cards-playing-outline',     i18nKey: 'poker_face' }],
    high: [{ mood: 'nervous',     icon: 'mdi:eye-off-outline',           i18nKey: 'avoiding_eye_contact' }],
  },
}

// ─── Tactic State (per-auction) ─────────────────────────────────

export interface BiddingTactics {
  /** Uses of intimidate remaining */
  intimidateUsesLeft: number
  /** Uses of bluff remaining */
  bluffUsesLeft: number
  /** Uses of sniper bid remaining */
  sniperUsesLeft: number
  /** Round when last tactic was used (for cooldown) */
  lastTacticRound: number
  /** Log of tactic events for UI display */
  tacticLog: TacticLogEntry[]
}

export interface TacticLogEntry {
  /** Which tactic was used */
  tactic: 'intimidate' | 'bluff' | 'sniper'
  /** Round it happened */
  round: number
  /** NPC reactions — array of { bidderId, outcome } */
  reactions: TacticReaction[]
}

export interface TacticReaction {
  bidderId: string
  bidderName: string
  /** Outcome of the tactic on this NPC */
  outcome: 'dropped' | 'scared' | 'unfazed' | 'counter_bid' | 'called_bluff' | 'fooled' | 'sniped'
  /** i18n key suffix for reaction message */
  i18nKey: string
}

// ─── Factory ────────────────────────────────────────────────────

export function createBiddingTactics(bonusIntimidateUses = 0, bonusBluffUses = 0): BiddingTactics {
  return {
    intimidateUsesLeft: INTIMIDATE_MAX_USES + bonusIntimidateUses,
    bluffUsesLeft: BLUFF_MAX_USES + bonusBluffUses,
    sniperUsesLeft: SNIPER_MAX_USES,
    lastTacticRound: -99,
    tacticLog: [],
  }
}

// ─── Logic: Resolve Intimidate ──────────────────────────────────

export interface IntimidateResult {
  reactions: TacticReaction[]
  /** Any NPC that counter-bid as a result */
  counterBids: { bidder: AuctionBidder; amount: Decimal }[]
}

/**
 * Process the effect of an intimidate action on all active NPC bidders.
 * Modifies bidders in-place (sets droppedOut) and returns reactions.
 */
export function resolveIntimidate(
  bidders: AuctionBidder[],
  currentBid: Decimal,
  bidIncrement: Decimal,
): IntimidateResult {
  const reactions: TacticReaction[] = []
  const counterBids: { bidder: AuctionBidder; amount: Decimal }[] = []

  for (const b of bidders) {
    if (b.droppedOut) continue

    const effect = INTIMIDATE_EFFECTS[b.personality]
    const roll = Math.random()

    if (roll < effect.dropoutBoost) {
      // NPC scared into dropping out
      b.droppedOut = true
      reactions.push({
        bidderId: b.id,
        bidderName: b.name,
        outcome: 'dropped',
        i18nKey: 'intimidate_dropped',
      })
    } else if (roll < effect.dropoutBoost + effect.counterBidChance) {
      // NPC counter-bids aggressively
      const jumpAmount = bidIncrement.mul(effect.counterBidJump)
      const counterAmount = currentBid.add(jumpAmount).min(b.maxBid)
      if (counterAmount.gt(currentBid)) {
        counterBids.push({ bidder: b, amount: counterAmount })
        b.bidCount++
        reactions.push({
          bidderId: b.id,
          bidderName: b.name,
          outcome: 'counter_bid',
          i18nKey: 'intimidate_counter',
        })
      } else {
        reactions.push({
          bidderId: b.id,
          bidderName: b.name,
          outcome: 'unfazed',
          i18nKey: 'intimidate_unfazed',
        })
      }
    } else {
      // NPC shaken but stays
      reactions.push({
        bidderId: b.id,
        bidderName: b.name,
        outcome: 'scared',
        i18nKey: 'intimidate_scared',
      })
    }
  }

  return { reactions, counterBids }
}

// ─── Logic: Resolve Bluff ───────────────────────────────────────

export interface BluffResult {
  reactions: TacticReaction[]
  /** Any NPC that called the bluff and bid */
  callerBids: { bidder: AuctionBidder; amount: Decimal }[]
}

/**
 * Process the effect of a bluff action on all active NPC bidders.
 */
export function resolveBluff(
  bidders: AuctionBidder[],
  currentBid: Decimal,
  bidIncrement: Decimal,
): BluffResult {
  const reactions: TacticReaction[] = []
  const callerBids: { bidder: AuctionBidder; amount: Decimal }[] = []

  for (const b of bidders) {
    if (b.droppedOut) continue

    const effect = BLUFF_EFFECTS[b.personality]
    const roll = Math.random()

    if (roll < effect.fooledChance) {
      // NPC falls for it and drops out
      b.droppedOut = true
      reactions.push({
        bidderId: b.id,
        bidderName: b.name,
        outcome: 'fooled',
        i18nKey: 'bluff_fooled',
      })
    } else if (roll < effect.fooledChance + effect.callBluffChance) {
      // NPC calls the bluff
      const jumpAmount = bidIncrement.mul(effect.callBluffJump)
      const callerAmount = currentBid.add(jumpAmount).min(b.maxBid)
      if (callerAmount.gt(currentBid)) {
        callerBids.push({ bidder: b, amount: callerAmount })
        b.bidCount++
        reactions.push({
          bidderId: b.id,
          bidderName: b.name,
          outcome: 'called_bluff',
          i18nKey: 'bluff_called',
        })
      } else {
        reactions.push({
          bidderId: b.id,
          bidderName: b.name,
          outcome: 'unfazed',
          i18nKey: 'bluff_unfazed',
        })
      }
    } else {
      // NPC unaffected
      reactions.push({
        bidderId: b.id,
        bidderName: b.name,
        outcome: 'unfazed',
        i18nKey: 'bluff_unfazed',
      })
    }
  }

  return { reactions, callerBids }
}

// ─── Logic: Sniper Bid Availability ─────────────────────────────

/** Phases where sniper bid is allowed */
const SNIPER_PHASES: AuctionPhase[] = ['going_once', 'going_twice', 'final_call']

export function canSniperBid(phase: AuctionPhase, sniperUsesLeft: number): boolean {
  return SNIPER_PHASES.includes(phase) && sniperUsesLeft > 0
}

/** Calculate the sniper bid amount (bid + premium). */
export function calcSniperBidAmount(currentBid: Decimal, bidIncrement: Decimal): Decimal {
  const base = currentBid.add(bidIncrement)
  return base.mul(SNIPER_PREMIUM)
}

// ─── Logic: Get NPC Tell ────────────────────────────────────────

/**
 * Determine the current "tell" for an NPC bidder based on their
 * personality and how much of their budget has been used up.
 * Returns undefined if NPC has dropped out.
 */
export function getNpcTell(bidder: AuctionBidder, currentBid: Decimal): NpcTell | undefined {
  if (bidder.droppedOut) return undefined

  const budgetUsed = bidder.maxBid.gt(0)
    ? currentBid.div(bidder.maxBid).toNumber()
    : 1.0

  const tells = PERSONALITY_TELLS[bidder.personality]
  let pool: NpcTell[]

  if (budgetUsed < 0.3) pool = tells.low
  else if (budgetUsed < 0.7) pool = tells.mid
  else pool = tells.high

  // Deterministic per bidder (same tell for a given state, not random per frame)
  return pool[0]
}

/**
 * Check if a tactic can be used this round (respecting cooldown).
 */
export function canUseTactic(
  tactics: BiddingTactics,
  tactic: 'intimidate' | 'bluff',
  currentRound: number,
): boolean {
  if (currentRound < TACTIC_MIN_ROUND) return false
  if (currentRound - tactics.lastTacticRound < TACTIC_COOLDOWN_ROUNDS) return false

  if (tactic === 'intimidate') return tactics.intimidateUsesLeft > 0
  if (tactic === 'bluff') return tactics.bluffUsesLeft > 0
  return false
}
