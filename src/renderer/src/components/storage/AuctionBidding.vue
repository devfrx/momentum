<script setup lang="ts">
/**
 * AuctionBidding — Active auction bidding interface.
 * Shows the bidding war in real-time: hints, bidder avatars,
 * current bid, timer, player bid controls, and tactical actions
 * (intimidate, bluff, sniper bid).
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton, UTooltip, UAccordion } from '@renderer/components/ui'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { D, add } from '@renderer/core/BigNum'
import { AUCTION_CONFIG } from '@renderer/data/storage'
import { rarityCssVar } from '@renderer/data/rarity'
import { resolveItemName } from '@renderer/data/storage/items'
import {
    getNpcTell,
    canUseTactic,
    canSniperBid,
    calcSniperBidAmount,
    type TacticLogEntry,
} from '@renderer/data/storage/biddingTactics'
import { getLotTierDef } from '@renderer/data/storage/auctionTiers'
import LotEventBanner from './LotEventBanner.vue'

defineEmits<{ back: [] }>()

const storage = useStorageStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const auction = computed(() => storage.activeAuction)
const tactics = computed(() => storage.biddingTactics)
const location = computed(() =>
    auction.value ? storage.getLocation(auction.value.locationId) : null
)

const bidMultipliers = [1, 2, 5, 10]
const selectedMultiplier = ref(1)

const bidAmount = computed(() => {
    if (!auction.value) return D(0)
    return add(auction.value.currentBid, auction.value.bidIncrement.mul(selectedMultiplier.value))
})

const canBid = computed(() => {
    return auction.value?.status === 'active' && player.cash.gte(bidAmount.value)
})

const isPlayerLeading = computed(() => auction.value?.currentBidder === 'player')

const roundProgress = computed(() => {
    if (!auction.value) return 0
    const maxTicks = auction.value.phase === 'bidding'
        ? AUCTION_CONFIG.ticksPerRound
        : AUCTION_CONFIG.ticksPerGoing
    return ((maxTicks - auction.value.roundTicksLeft) / maxTicks) * 100
})

/** Current auction phase label */
const auctionPhase = computed(() => auction.value?.phase ?? 'bidding')
const isGoingPhase = computed(() => auctionPhase.value !== 'bidding')
const phaseLabel = computed(() => {
    switch (auctionPhase.value) {
        case 'going_once': return t('storage.going_once')
        case 'going_twice': return t('storage.going_twice')
        case 'final_call': return t('storage.final_call')
        default: return ''
    }
})

// ── Tactic computed ─────────────────────────────────────────
const canIntimidate = computed(() => {
    if (!auction.value || !tactics.value) return false
    return auction.value.status === 'active'
        && canUseTactic(tactics.value, 'intimidate', auction.value.roundsElapsed)
})

const canBluff = computed(() => {
    if (!auction.value || !tactics.value) return false
    return auction.value.status === 'active'
        && canUseTactic(tactics.value, 'bluff', auction.value.roundsElapsed)
})

const canSniper = computed(() => {
    if (!auction.value || !tactics.value) return false
    return auction.value.status === 'active'
        && canSniperBid(auction.value.phase, tactics.value.sniperUsesLeft)
        && player.cash.gte(sniperAmount.value)
})

const sniperAmount = computed(() => {
    if (!auction.value) return D(0)
    return calcSniperBidAmount(auction.value.currentBid, auction.value.bidIncrement)
})

const latestTacticEntry = ref<TacticLogEntry | null>(null)
const showTacticFeedback = ref(false)
let tacticFeedbackTimer: ReturnType<typeof setTimeout> | null = null

function showTacticResult(entry: TacticLogEntry | null): void {
    if (!entry) return
    latestTacticEntry.value = entry
    showTacticFeedback.value = true
    if (tacticFeedbackTimer) clearTimeout(tacticFeedbackTimer)
    tacticFeedbackTimer = setTimeout(() => {
        showTacticFeedback.value = false
    }, 4000)
}

/** NPC tells — computed from current auction state */
const bidderTells = computed(() => {
    if (!auction.value) return new Map<string, ReturnType<typeof getNpcTell>>()
    const map = new Map<string, ReturnType<typeof getNpcTell>>()
    for (const b of auction.value.bidders) {
        map.set(b.id, getNpcTell(b, auction.value.currentBid))
    }
    return map
})

const activeBidders = computed(() =>
    auction.value?.bidders.filter(b => !b.droppedOut).length ?? 0
)

// ── Lot tier + events computed ──────────────────────────────
const lotTier = computed(() =>
    auction.value ? getLotTierDef(auction.value.lotTier) : null
)
const showLotTierBadge = computed(() =>
    auction.value && auction.value.lotTier !== 'standard'
)
const revealEvents = computed(() =>
    auction.value?.lotEvents.filter(e => e.def.timing === 'on_reveal') ?? []
)
const activeEvents = computed(() =>
    auction.value?.lotEvents.filter(e => e.applied) ?? []
)
const pendingBidEvents = computed(() =>
    auction.value?.lotEvents.filter(
        e => e.def.timing === 'on_bid' && !e.applied
    ) ?? []
)
const winEvents = computed(() =>
    auction.value?.lotEvents.filter(e => e.def.timing === 'on_win') ?? []
)

function placeBid(): void {
    if (!canBid.value) return
    storage.placeBid(bidAmount.value)
}

function doIntimidate(): void {
    const result = storage.useIntimidate()
    showTacticResult(result)
}

function doBluff(): void {
    const result = storage.useBluff()
    showTacticResult(result)
}

function doSniper(): void {
    storage.placeSniperBid()
    if (tactics.value && tactics.value.tacticLog.length > 0) {
        showTacticResult(tactics.value.tacticLog[tactics.value.tacticLog.length - 1])
    }
}

function leave(): void {
    storage.leaveAuction()
}

/** Map tactic reaction outcomes to CSS modifier class */
function reactionClass(outcome: string): string {
    switch (outcome) {
        case 'dropped': case 'fooled': case 'sniped': return 'reaction--positive'
        case 'counter_bid': case 'called_bluff': return 'reaction--negative'
        default: return 'reaction--neutral'
    }
}
</script>

<template>
    <div class="bidding-screen" v-if="auction" :class="[`bidding-screen--${auction.lotTier}`]"
        :style="{ '--_accent': lotTier?.cssVar ?? 'var(--t-warning)' }">

        <!-- ═══════════════════════════════════════════════════════
             HEADER — Warehouse ambience bar
             ═══════════════════════════════════════════════════════ -->
        <div class="bidding-header">
            <!-- Accent shutter strip -->
            <div class="header-shutter">
                <span class="header-shutter__groove" v-for="n in 5" :key="n" />
            </div>

            <div class="header-content">
                <div class="header-content__left">
                    <UButton variant="ghost" size="sm" icon="mdi:arrow-left" @click="leave" />
                    <div class="header-unit">
                        <AppIcon :icon="location?.icon ?? 'mdi:warehouse'" class="header-unit__icon" />
                    </div>
                    <div class="header-identity">
                        <h2 class="header-identity__name">{{ location?.name }}</h2>
                        <span class="header-identity__sub">{{ t('storage.auction_in_progress') }}</span>
                    </div>
                </div>

                <div class="header-content__right">
                    <!-- Lot Tier Badge -->
                    <UTooltip v-if="showLotTierBadge && lotTier" :text="t(`storage.lot_tier_${lotTier.id}_desc`)"
                        placement="top">
                        <span class="lot-tier-badge" :style="{ '--_tier-color': lotTier.cssVar }">
                            <AppIcon :icon="lotTier.icon" />
                            {{ t(`storage.lot_tier_${lotTier.id}`) }}
                        </span>
                    </UTooltip>

                    <span class="header-round">
                        <AppIcon icon="mdi:counter" />
                        {{ t('storage.round_n', { n: auction.roundsElapsed }) }} / {{ 10 }}
                    </span>

                    <!-- Wallet inline -->
                    <span class="header-wallet">
                        <AppIcon icon="mdi:wallet-outline" />
                        {{ formatCash(player.cash) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             TIMER BAR — visual countdown
             ═══════════════════════════════════════════════════════ -->
        <div class="timer-bar" :class="{ 'timer-bar--going': isGoingPhase }">
            <div class="timer-bar__track">
                <div class="timer-bar__fill" :class="{ 'timer-bar__fill--going': isGoingPhase }"
                    :style="{ width: roundProgress + '%' }"></div>
            </div>
            <span v-if="isGoingPhase" class="timer-bar__phase-pill" :class="`timer-bar__phase-pill--${auctionPhase}`">
                <AppIcon icon="mdi:gavel" />
                {{ phaseLabel }}
            </span>
        </div>

        <!-- Going Phase Banner (dramatic full-width) -->
        <Transition name="going-banner">
            <div v-if="isGoingPhase && auction.status === 'active'" class="going-phase-banner"
                :class="`going-phase-banner--${auctionPhase}`">
                <AppIcon icon="mdi:gavel" class="going-icon" />
                <span class="going-text">{{ phaseLabel }}</span>
            </div>
        </Transition>

        <!-- ═══════════════════════════════════════════════════════
             LOT EVENTS STRIP
             ═══════════════════════════════════════════════════════ -->
        <LotEventBanner v-if="activeEvents.length > 0" :events="activeEvents" compact />

        <!-- ═══════════════════════════════════════════════════════
             BODY — Two-column auction floor
             ═══════════════════════════════════════════════════════ -->
        <div class="bidding-body">

            <!-- ─── LEFT: Intel panel (peek + bidders) ─── -->
            <div class="bidding-left">

                <!-- Peek Hints — "looking through the gap" -->
                <div class="peek-section">
                    <div class="peek-section__head">
                        <AppIcon icon="mdi:eye-outline" class="peek-section__eye" />
                        <span class="peek-section__label">{{ t('storage.peek_inside') }}</span>
                    </div>
                    <ul class="peek-hints">
                        <li v-for="(hint, i) in auction.peekHints" :key="i" class="peek-hint">
                            {{ hint }}
                        </li>
                    </ul>
                </div>

                <!-- Bidders — "the crowd" -->
                <UAccordion :title="t('storage.competitors')" icon="mdi:account-group"
                    :badge="`${activeBidders}/${auction.bidders.length}`" variant="ghost" compact defaultOpen>
                    <div class="bidder-list">
                        <div v-for="bidder in auction.bidders" :key="bidder.id" class="bidder-row" :class="{
                            'bidder-row--dropped': bidder.droppedOut,
                            'bidder-row--leading': auction.currentBidder === bidder.id
                        }">
                            <div class="bidder-row__avatar-wrap">
                                <AppIcon :icon="bidder.avatar" class="bidder-row__avatar" />
                            </div>
                            <div class="bidder-row__info">
                                <span class="bidder-row__name">{{ bidder.name }}</span>
                                <span class="bidder-row__status" v-if="bidder.droppedOut">
                                    {{ t('storage.dropped_out') }}
                                </span>
                                <span class="bidder-row__status bidder-row__status--leading"
                                    v-else-if="auction.currentBidder === bidder.id">
                                    {{ t('storage.leading') }}
                                </span>
                            </div>
                            <!-- NPC Tell -->
                            <UTooltip v-if="bidderTells.get(bidder.id) && !bidder.droppedOut"
                                :text="t(`storage.tell_${bidderTells.get(bidder.id)?.i18nKey}`)" placement="right">
                                <span class="bidder-tell" :class="`bidder-tell--${bidderTells.get(bidder.id)?.mood}`">
                                    <AppIcon :icon="bidderTells.get(bidder.id)?.icon ?? ''" />
                                </span>
                            </UTooltip>
                        </div>
                    </div>
                </UAccordion>

                <!-- Tactic Feedback Toast -->
                <Transition name="tactic-toast">
                    <div v-if="showTacticFeedback && latestTacticEntry" class="tactic-feedback">
                        <div class="tactic-feedback__header">
                            <AppIcon :icon="latestTacticEntry.tactic === 'intimidate' ? 'mdi:arm-flex'
                                : latestTacticEntry.tactic === 'bluff' ? 'mdi:cards-playing-outline'
                                    : 'mdi:target'" />
                            <span>{{ t(`storage.tactic_${latestTacticEntry.tactic}`) }}</span>
                        </div>
                        <div class="tactic-feedback__reactions">
                            <div v-for="(r, i) in latestTacticEntry.reactions" :key="i" class="tactic-reaction"
                                :class="reactionClass(r.outcome)">
                                <span class="tactic-reaction__name">{{ r.bidderName }}</span>
                                <span class="tactic-reaction__outcome">{{ t(`storage.${r.i18nKey}`) }}</span>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>

            <!-- ─── RIGHT: Bidding podium ─── -->
            <div class="bidding-right">

                <!-- Current Bid — the "scoreboard" -->
                <div class="bid-scoreboard" :class="{ 'bid-scoreboard--player': isPlayerLeading }">
                    <div class="bid-scoreboard__gavel">
                        <AppIcon icon="mdi:gavel" />
                    </div>
                    <div class="bid-scoreboard__body">
                        <span class="bid-scoreboard__label">{{ t('storage.current_bid') }}</span>
                        <span class="bid-scoreboard__amount">
                            {{ formatCash(auction.currentBid) }}
                        </span>
                        <span class="bid-scoreboard__holder" :class="{ 'positive': isPlayerLeading }">
                            {{ isPlayerLeading ? t('storage.you_lead') : t('storage.outbid') }}
                        </span>
                    </div>
                </div>

                <!-- Bid Controls (active auction) -->
                <div class="bid-controls" v-if="auction.status === 'active'">

                    <!-- Multiplier selector -->
                    <div class="multiplier-strip">
                        <span class="multiplier-strip__label">{{ t('storage.bid_increment') }}</span>
                        <div class="multiplier-strip__btns">
                            <UTooltip v-for="m in bidMultipliers" :key="m" :text="`${m}× ${t('storage.bid_increment')}`"
                                placement="top">
                                <UButton size="sm" :variant="selectedMultiplier === m ? 'primary' : 'ghost'"
                                    @click="selectedMultiplier = m">{{ m }}×</UButton>
                            </UTooltip>
                        </div>
                    </div>

                    <!-- Bid preview -->
                    <div class="bid-preview">
                        <span class="bid-preview__label">{{ t('storage.your_bid') }}</span>
                        <span class="bid-preview__value">{{ formatCash(bidAmount) }}</span>
                    </div>

                    <!-- Place bid CTA -->
                    <UButton variant="primary" size="lg" icon="mdi:gavel" class="bid-cta" :disabled="!canBid" block
                        @click="placeBid">
                        {{ t('storage.place_bid') }}
                    </UButton>

                    <!-- Tactics panel -->
                    <div class="tactics-panel" v-if="tactics">
                        <span class="tactics-panel__label">
                            <AppIcon icon="mdi:strategy" />
                            {{ t('storage.tactic_intimidate').split(' ')[0] ===
                                t('storage.tactic_intimidate').split(' ')[0] ? 'Tactics' : 'Tattiche' }}
                        </span>
                        <div class="tactics-panel__row">
                            <UTooltip :text="t('storage.tactic_intimidate_desc')" placement="top">
                                <UButton variant="warning" size="sm" icon="mdi:arm-flex" :disabled="!canIntimidate"
                                    @click="doIntimidate"
                                    :subtitle="tactics.intimidateUsesLeft > 0 ? `${tactics.intimidateUsesLeft}` : '0'">
                                    {{ t('storage.tactic_intimidate') }}
                                </UButton>
                            </UTooltip>
                            <UTooltip :text="t('storage.tactic_bluff_desc')" placement="top">
                                <UButton variant="info" size="sm" icon="mdi:cards-playing-outline" :disabled="!canBluff"
                                    @click="doBluff"
                                    :subtitle="tactics.bluffUsesLeft > 0 ? `${tactics.bluffUsesLeft}` : '0'">
                                    {{ t('storage.tactic_bluff') }}
                                </UButton>
                            </UTooltip>
                            <UTooltip v-if="isGoingPhase" :text="t('storage.tactic_sniper_desc')" placement="top">
                                <UButton variant="danger" size="sm" icon="mdi:target" :disabled="!canSniper"
                                    @click="doSniper" :subtitle="formatCash(sniperAmount)">
                                    {{ t('storage.tactic_sniper') }}
                                </UButton>
                            </UTooltip>
                        </div>
                    </div>

                    <!-- Leave -->
                    <UButton variant="text" size="sm" icon="mdi:exit-run" class="leave-btn" @click="leave">
                        {{ t('storage.leave_auction') }}
                    </UButton>
                </div>

                <!-- ── Auction Result ── -->
                <div v-else class="auction-result">
                    <div v-if="auction.status === 'won'" class="result-card result-card--won">
                        <div class="result-card__icon-wrap result-card__icon-wrap--won">
                            <AppIcon icon="mdi:trophy" class="result-card__icon" />
                        </div>
                        <span class="result-card__title">{{ t('storage.you_won') }}</span>
                        <span class="result-card__price">{{ formatCash(auction.currentBid) }}</span>
                    </div>
                    <div v-else class="result-card result-card--lost">
                        <div class="result-card__icon-wrap result-card__icon-wrap--lost">
                            <AppIcon icon="mdi:emoticon-sad" class="result-card__icon" />
                        </div>
                        <span class="result-card__title">{{ t('storage.auction_lost') }}</span>
                    </div>
                </div>

                <!-- Balance row -->
                <div class="balance-strip">
                    <AppIcon icon="mdi:wallet-outline" />
                    <span class="balance-strip__label">Balance</span>
                    <span class="balance-strip__value">{{ formatCash(player.cash) }}</span>
                </div>
            </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             WON ITEMS — the big reveal
             ═══════════════════════════════════════════════════════ -->
        <div v-if="auction.status === 'won'" class="won-section">
            <!-- Win lot events -->
            <LotEventBanner v-if="winEvents.length > 0" :events="winEvents" />

            <div class="won-section__head">
                <AppIcon icon="mdi:package-variant-closed" class="won-section__head-icon" />
                <h3 class="won-section__title">{{ t('storage.items_found') }}</h3>
            </div>

            <div class="items-grid">
                <div v-for="item in auction.items" :key="item.id" class="found-item" :style="{
                    '--_rarity': rarityCssVar(item.rarity),
                    borderColor: rarityCssVar(item.rarity)
                }">
                    <div class="found-item__rarity-strip" />
                    <AppIcon :icon="item.icon" class="found-item__icon" :style="{ color: rarityCssVar(item.rarity) }" />
                    <span class="found-item__name">{{ resolveItemName(item, t) }}</span>
                    <span class="found-item__rarity" :style="{ color: rarityCssVar(item.rarity) }">
                        {{ item.rarity }}
                    </span>
                </div>
            </div>

            <UButton variant="primary" icon="mdi:check" block @click="$emit('back')">
                {{ t('storage.collect_items') }}
            </UButton>
        </div>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   AuctionBidding — Immersive storage-wars bidding floor
   ═══════════════════════════════════════════════════════════════ */

.bidding-screen {
    --_accent: var(--t-warning);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

/* ── HEADER ─────────────────────────────────────────────────── */
.bidding-header {
    position: relative;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    overflow: hidden;
}

.header-shutter {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 3px 0;
    height: 22px;
    background: linear-gradient(180deg,
            color-mix(in srgb, var(--_accent) 18%, var(--t-bg-muted)) 0%,
            color-mix(in srgb, var(--_accent) 6%, var(--t-bg-card)) 100%);
    border-bottom: 2px solid color-mix(in srgb, var(--_accent) 25%, var(--t-border));
    overflow: hidden;
}

.header-shutter__groove {
    display: block;
    width: 100%;
    height: 2px;
    background: color-mix(in srgb, var(--_accent) 10%, transparent);
    border-radius: 1px;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-3) var(--t-space-4);
    gap: var(--t-space-3);
    flex-wrap: wrap;
}

.header-content__left {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.header-unit {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    border-radius: var(--t-radius-sm);
    background: color-mix(in srgb, var(--_accent) 10%, var(--t-bg-muted));
    border: 1px solid color-mix(in srgb, var(--_accent) 20%, var(--t-border));
    flex-shrink: 0;
}

.header-unit__icon {
    font-size: 1.15rem;
    color: var(--_accent);
}

.header-identity {
    display: flex;
    flex-direction: column;
}

.header-identity__name {
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    margin: 0;
    color: var(--t-text);
    line-height: 1.2;
}

.header-identity__sub {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.header-content__right {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.header-round {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-medium);
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
    padding: 0.25rem 0.6rem;
    border-radius: var(--t-radius-full);
    font-family: var(--t-font-mono);
}

.header-wallet {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
    background: var(--t-bg-muted);
    padding: 0.25rem 0.6rem;
    border-radius: var(--t-radius-full);
    font-family: var(--t-font-mono);
}

/* ── Lot Tier Badge ────────────────────────────────────────── */
.lot-tier-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-bold);
    color: var(--_tier-color);
    background: color-mix(in srgb, var(--_tier-color) 12%, transparent);
    padding: 0.2rem 0.55rem;
    border-radius: var(--t-radius-sm);
    border: 1px solid color-mix(in srgb, var(--_tier-color) 25%, transparent);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
}

/* ── TIMER BAR ──────────────────────────────────────────────── */
.timer-bar {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.timer-bar__track {
    flex: 1;
    height: 5px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-xs);
    overflow: hidden;
}

.timer-bar__fill {
    height: 100%;
    background: var(--_accent);
    transition: width var(--t-transition-normal) linear;
    border-radius: var(--t-radius-xs);
}

.timer-bar__fill--going {
    background: var(--t-danger);
    animation: pulse-bar 0.8s ease-in-out infinite;
}

.timer-bar__phase-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-bold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0.2rem 0.5rem;
    border-radius: var(--t-radius-full);
    white-space: nowrap;
    flex-shrink: 0;
    animation: pill-pulse 1.2s ease-in-out infinite;
}

.timer-bar__phase-pill--going_once {
    color: var(--t-warning);
    background: color-mix(in srgb, var(--t-warning) 14%, transparent);
}

.timer-bar__phase-pill--going_twice {
    color: var(--t-orange);
    background: color-mix(in srgb, var(--t-orange) 14%, transparent);
}

.timer-bar__phase-pill--final_call {
    color: var(--t-danger);
    background: color-mix(in srgb, var(--t-danger) 14%, transparent);
}

@keyframes pulse-bar {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.55;
    }
}

@keyframes pill-pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.04);
    }
}

/* ── GOING PHASE BANNER ─────────────────────────────────────── */
.going-phase-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.65rem 1rem;
    border-radius: var(--t-radius-md);
    font-weight: 800;
    font-size: var(--t-font-size-lg);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    animation: phase-scale 1s ease-in-out infinite;
}

.going-phase-banner--going_once {
    background: color-mix(in srgb, var(--t-warning) 13%, transparent);
    border: 2px solid var(--t-warning);
    color: var(--t-warning);
}

.going-phase-banner--going_twice {
    background: color-mix(in srgb, var(--t-orange) 13%, transparent);
    border: 2px solid var(--t-orange);
    color: var(--t-orange);
}

.going-phase-banner--final_call {
    background: color-mix(in srgb, var(--t-danger) 13%, transparent);
    border: 2px solid var(--t-danger);
    color: var(--t-danger);
}

.going-icon {
    font-size: 1.3rem;
}

.going-text {
    white-space: nowrap;
}

@keyframes phase-scale {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.02);
    }
}

.going-banner-enter-active {
    transition: all 0.35s ease-out;
}

.going-banner-leave-active {
    transition: all 0.25s ease-in;
}

.going-banner-enter-from {
    opacity: 0;
    transform: translateY(-6px) scale(0.97);
}

.going-banner-leave-to {
    opacity: 0;
    transform: translateY(4px) scale(0.97);
}

/* ── BODY GRID ──────────────────────────────────────────────── */
.bidding-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-5);
}

/* ── LEFT COLUMN ────────────────────────────────────────────── */
.bidding-left {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

/* Peek section */
.peek-section {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-3);
    position: relative;
    overflow: hidden;
}

/* Faint horizontal lines like peering through shutter slats */
.peek-section::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(0deg,
            transparent,
            transparent 7px,
            color-mix(in srgb, var(--_accent) 3%, transparent) 7px,
            color-mix(in srgb, var(--_accent) 3%, transparent) 8px);
}

.peek-section__head {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    margin-bottom: var(--t-space-2);
    position: relative;
}

.peek-section__eye {
    font-size: 0.95rem;
    color: var(--_accent);
    opacity: 0.7;
}

.peek-section__label {
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--t-text-muted);
    font-weight: var(--t-font-semibold);
}

.peek-hints {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    position: relative;
}

.peek-hint {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    font-style: italic;
    margin: 0;
    padding-left: var(--t-space-2);
    border-left: 2px solid color-mix(in srgb, var(--_accent) 25%, transparent);
    line-height: var(--t-leading-normal);
}

/* Bidders — the crowd */
.bidder-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.bidder-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: 0.4rem 0.6rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    border: 1px solid transparent;
    transition:
        opacity var(--t-transition-normal),
        border-color var(--t-transition-normal),
        background var(--t-transition-normal);
}

.bidder-row--dropped {
    opacity: 0.35;
}

.bidder-row--leading {
    border-color: var(--t-danger);
    background: color-mix(in srgb, var(--t-danger) 6%, transparent);
}

.bidder-row__avatar-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: var(--t-radius-full);
    background: var(--t-bg-card);
    flex-shrink: 0;
}

.bidder-row__avatar {
    font-size: 0.95rem;
    color: var(--t-text-muted);
}

.bidder-row__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.bidder-row__name {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-medium);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bidder-row__status {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
}

.bidder-row__status--leading {
    color: var(--t-danger);
    font-weight: var(--t-font-semibold);
}

/* NPC Tells */
.bidder-tell {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: var(--t-radius-full);
    font-size: 0.75rem;
    margin-left: auto;
    flex-shrink: 0;
    transition: color var(--t-transition-normal), background var(--t-transition-normal);
}

.bidder-tell--nervous {
    color: var(--t-warning);
    background: var(--t-warning-muted);
}

.bidder-tell--confident {
    color: var(--t-success);
    background: var(--t-success-muted);
}

.bidder-tell--disinterested {
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
}

.bidder-tell--aggressive {
    color: var(--t-danger);
    background: var(--t-danger-muted);
}

.bidder-tell--smirking {
    color: var(--t-purple);
    background: var(--t-purple-muted);
}

.bidder-tell--neutral {
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
}

/* ── Tactic Feedback Toast ─────────────────────────────── */
.tactic-feedback {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border-hover);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-3);
    margin-top: var(--t-space-2);
    box-shadow: var(--t-shadow-md);
}

.tactic-feedback__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
    margin-bottom: var(--t-space-2);
}

.tactic-feedback__reactions {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.tactic-reaction {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-1) var(--t-space-2);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
}

.tactic-reaction__name {
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.tactic-reaction__outcome {
    font-weight: var(--t-font-medium);
}

.reaction--positive {
    background: var(--t-success-muted);
}

.reaction--positive .tactic-reaction__outcome {
    color: var(--t-success);
}

.reaction--negative {
    background: var(--t-danger-muted);
}

.reaction--negative .tactic-reaction__outcome {
    color: var(--t-danger);
}

.reaction--neutral {
    background: var(--t-bg-muted);
}

.reaction--neutral .tactic-reaction__outcome {
    color: var(--t-text-muted);
}

.tactic-toast-enter-active {
    transition: all 0.3s ease;
}

.tactic-toast-leave-active {
    transition: all 0.4s ease;
}

.tactic-toast-enter-from {
    opacity: 0;
    transform: translateY(-8px);
}

.tactic-toast-leave-to {
    opacity: 0;
    transform: translateY(4px);
}

/* ── RIGHT COLUMN ───────────────────────────────────────────── */
.bidding-right {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

/* Bid Scoreboard */
.bid-scoreboard {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.bid-scoreboard--player {
    border-color: color-mix(in srgb, var(--t-success) 40%, var(--t-border));
    box-shadow: 0 0 12px color-mix(in srgb, var(--t-success) 8%, transparent);
}

.bid-scoreboard__gavel {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: var(--t-radius-md);
    background: color-mix(in srgb, var(--_accent) 10%, var(--t-bg-muted));
    color: var(--_accent);
    font-size: 1.4rem;
    flex-shrink: 0;
}

.bid-scoreboard__body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.bid-scoreboard__label {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.bid-scoreboard__amount {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--t-text);
    font-family: var(--t-font-mono);
    line-height: 1.1;
}

.bid-scoreboard--player .bid-scoreboard__amount {
    color: var(--t-success);
}

.bid-scoreboard__holder {
    font-size: var(--t-font-size-xs);
    color: var(--t-danger);
    font-weight: var(--t-font-semibold);
    margin-top: 2px;
}

.bid-scoreboard__holder.positive {
    color: var(--t-success);
}

/* Bid Controls */
.bid-controls {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-3);
}

.multiplier-strip {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.multiplier-strip__label {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
}

.multiplier-strip__btns {
    display: flex;
    gap: var(--t-space-1);
}

.bid-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px dashed var(--t-border);
    border-radius: var(--t-radius-sm);
}

.bid-preview__label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.bid-preview__value {
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
    color: var(--t-text);
}

.bid-cta {
    width: 100%;
}

/* Tactics Panel */
.tactics-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding-top: var(--t-space-2);
    border-top: 1px dashed var(--t-border);
}

.tactics-panel__label {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: var(--t-font-semibold);
}

.tactics-panel__row {
    display: flex;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.leave-btn {
    width: 100%;
    opacity: 0.7;
}

.leave-btn:hover {
    opacity: 1;
}

/* ── RESULT CARDS ───────────────────────────────────────────── */
.result-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-5);
    border-radius: var(--t-radius-md);
    text-align: center;
}

.result-card--won {
    background: color-mix(in srgb, var(--t-success) 6%, var(--t-bg-card));
    border: 1px solid color-mix(in srgb, var(--t-success) 35%, var(--t-border));
}

.result-card--lost {
    background: color-mix(in srgb, var(--t-danger) 6%, var(--t-bg-card));
    border: 1px solid color-mix(in srgb, var(--t-danger) 35%, var(--t-border));
}

.result-card__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: var(--t-radius-full);
}

.result-card__icon-wrap--won {
    background: color-mix(in srgb, var(--t-success) 15%, transparent);
    color: var(--t-success);
}

.result-card__icon-wrap--lost {
    background: color-mix(in srgb, var(--t-danger) 15%, transparent);
    color: var(--t-danger);
}

.result-card__icon {
    font-size: 1.8rem;
}

.result-card__title {
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-lg);
    color: var(--t-text);
}

.result-card__price {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

/* ── BALANCE STRIP ──────────────────────────────────────────── */
.balance-strip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.balance-strip__label {
    flex: 1;
}

.balance-strip__value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
}

/* ── WON SECTION — the big reveal ───────────────────────────── */
.won-section {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.won-section__head {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.won-section__head-icon {
    font-size: 1.2rem;
    color: var(--_accent);
}

.won-section__title {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    margin: 0;
}

.items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: var(--t-space-2);
}

.found-item {
    --_rarity: var(--t-text-muted);
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: var(--t-space-3) var(--t-space-2) var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    text-align: center;
    overflow: hidden;
    transition: transform var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.found-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--t-shadow-sm);
}

.found-item__rarity-strip {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--_rarity);
    opacity: 0.8;
}

.found-item__icon {
    font-size: 1.5rem;
}

.found-item__name {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    line-height: 1.2;
}

.found-item__rarity {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: var(--t-font-bold);
}

/* ── TIER-SPECIFIC AMBIENT GLOW ─────────────────────────────── */
.bidding-screen--legendary .bidding-header {
    box-shadow: 0 0 18px color-mix(in srgb, var(--t-warning) 10%, transparent);
}

.bidding-screen--premium .bidding-header {
    box-shadow: 0 0 14px color-mix(in srgb, var(--t-purple) 8%, transparent);
}

.bidding-screen--notable .bidding-header {
    box-shadow: 0 0 10px color-mix(in srgb, var(--t-info) 6%, transparent);
}
</style>
