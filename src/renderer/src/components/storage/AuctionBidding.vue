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
    <div class="bidding-screen" v-if="auction">
        <!-- Header -->
        <div class="bidding-header">
            <div class="bidding-header__left">
                <UButton variant="text" size="sm" icon="mdi:arrow-left" @click="leave" />
                <AppIcon :icon="location?.icon ?? 'mdi:warehouse'" class="bidding-location-icon" />
                <div>
                    <h2 class="bidding-title">{{ location?.name }}</h2>
                    <span class="bidding-subtitle">{{ t('storage.auction_in_progress') }}</span>
                </div>
            </div>
            <div class="bidding-header__right">
                <!-- Lot Tier Badge -->
                <UTooltip v-if="showLotTierBadge && lotTier" :text="t(`storage.lot_tier_${lotTier.id}_desc`)"
                    placement="top">
                    <span class="lot-tier-badge" :style="{ '--_tier-color': lotTier.cssVar }">
                        <AppIcon :icon="lotTier.icon" />
                        {{ t(`storage.lot_tier_${lotTier.id}`) }}
                    </span>
                </UTooltip>
                <span class="bidding-round">{{ t('storage.round_n', { n: auction.roundsElapsed }) }} / {{ 10 }}</span>
            </div>
        </div>

        <!-- Timer Bar -->
        <div class="timer-bar">
            <div class="timer-bar__fill" :class="{ 'timer-bar__fill--going': isGoingPhase }"
                :style="{ width: roundProgress + '%' }"></div>
        </div>

        <!-- Going Phase Banner -->
        <div v-if="isGoingPhase && auction.status === 'active'" class="going-phase-banner"
            :class="`going-phase-banner--${auctionPhase}`">
            <AppIcon icon="mdi:gavel" class="going-icon" />
            <span class="going-text">{{ phaseLabel }}</span>
        </div>

        <!-- Lot Events Banner (on_reveal + applied on_bid) -->
        <LotEventBanner v-if="activeEvents.length > 0" :events="activeEvents" compact />

        <!-- Two-column layout: Auction info + Bidding controls -->
        <div class="bidding-body">
            <!-- Left: peek hints + bidders -->
            <div class="bidding-left">
                <!-- Peek Hints -->
                <div class="peek-section">
                    <h3 class="section-label">
                        <AppIcon icon="mdi:eye" /> {{ t('storage.peek_inside') }}
                    </h3>
                    <div class="peek-hints">
                        <p v-for="(hint, i) in auction.peekHints" :key="i" class="peek-hint">
                            {{ hint }}
                        </p>
                    </div>
                </div>

                <!-- Bidders -->
                <UAccordion :title="t('storage.competitors')" icon="mdi:account-group"
                    :badge="`${activeBidders}/${auction.bidders.length}`" variant="ghost" compact defaultOpen>
                    <div class="bidder-list">
                        <div v-for="bidder in auction.bidders" :key="bidder.id" class="bidder-chip"
                            :class="{ 'bidder-chip--dropped': bidder.droppedOut, 'bidder-chip--leading': auction.currentBidder === bidder.id }">
                            <AppIcon :icon="bidder.avatar" class="bidder-avatar" />
                            <div class="bidder-info">
                                <span class="bidder-name">{{ bidder.name }}</span>
                                <span class="bidder-status" v-if="bidder.droppedOut">{{ t('storage.dropped_out')
                                }}</span>
                                <span class="bidder-status bidder-status--leading"
                                    v-else-if="auction.currentBidder === bidder.id">{{ t('storage.leading') }}</span>
                            </div>
                            <!-- NPC Tell indicator -->
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

            <!-- Right: Current bid + Controls -->
            <div class="bidding-right">
                <!-- Current Bid Display -->
                <div class="current-bid-display">
                    <span class="bid-label">{{ t('storage.current_bid') }}</span>
                    <span class="bid-amount" :class="{ 'bid-amount--player': isPlayerLeading }">
                        {{ formatCash(auction.currentBid) }}
                    </span>
                    <span class="bid-holder" :class="{ 'positive': isPlayerLeading }">
                        {{ isPlayerLeading ? t('storage.you_lead') : t('storage.outbid') }}
                    </span>
                </div>

                <!-- Bid Controls -->
                <div class="bid-controls" v-if="auction.status === 'active'">
                    <div class="bid-multiplier-row">
                        <UTooltip v-for="m in bidMultipliers" :key="m" :text="`${m}× ${t('storage.bid_increment')}`"
                            placement="top">
                            <UButton size="sm" :variant="selectedMultiplier === m ? 'primary' : 'ghost'"
                                @click="selectedMultiplier = m">{{ m }}×</UButton>
                        </UTooltip>
                    </div>

                    <div class="bid-preview">
                        <span class="bid-preview-label">{{ t('storage.your_bid') }}</span>
                        <span class="bid-preview-value">{{ formatCash(bidAmount) }}</span>
                    </div>

                    <UButton variant="primary" size="lg" icon="mdi:currency-usd" class="bid-button" :disabled="!canBid"
                        @click="placeBid">{{ t('storage.place_bid') }}</UButton>

                    <!-- Tactics Row -->
                    <div class="tactics-row" v-if="tactics">
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

                    <UButton variant="text" size="sm" class="leave-button" @click="leave">{{ t('storage.leave_auction')
                        }}</UButton>
                </div>

                <!-- Auction Result -->
                <div v-else class="auction-result">
                    <div v-if="auction.status === 'won'" class="result-banner result-banner--won">
                        <AppIcon icon="mdi:trophy" class="result-icon" />
                        <span>{{ t('storage.you_won') }}</span>
                        <span class="result-price">{{ formatCash(auction.currentBid) }}</span>
                    </div>
                    <div v-else class="result-banner result-banner--lost">
                        <AppIcon icon="mdi:emoticon-sad" class="result-icon" />
                        <span>{{ t('storage.auction_lost') }}</span>
                    </div>
                </div>

                <!-- Balance -->
                <div class="balance-row">
                    <AppIcon icon="mdi:wallet" />
                    <span>{{ formatCash(player.cash) }}</span>
                </div>
            </div>
        </div>

        <!-- Won Items (if auction is won) -->
        <div v-if="auction.status === 'won'" class="won-items">
            <!-- Win lot events -->
            <LotEventBanner v-if="winEvents.length > 0" :events="winEvents" />

            <h3 class="section-label">
                <AppIcon icon="mdi:package-variant" /> {{ t('storage.items_found') }}
            </h3>
            <div class="items-grid">
                <div v-for="item in auction.items" :key="item.id" class="found-item"
                    :style="{ borderColor: rarityCssVar(item.rarity) }">
                    <AppIcon :icon="item.icon" class="found-item__icon" :style="{ color: rarityCssVar(item.rarity) }" />
                    <span class="found-item__name">{{ resolveItemName(item, t) }}</span>
                    <span class="found-item__rarity" :style="{ color: rarityCssVar(item.rarity) }">{{ item.rarity
                    }}</span>
                </div>
            </div>
            <UButton variant="primary" icon="mdi:check" @click="$emit('back')">{{ t('storage.collect_items') }}
            </UButton>
        </div>
    </div>
</template>

<style scoped>
.bidding-screen {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

.bidding-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.bidding-header__left {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.bidding-location-icon {
    font-size: 1.4rem;
    color: var(--t-warning);
}

.bidding-title {
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    margin: 0;
    color: var(--t-text);
}

.bidding-subtitle {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.bidding-round {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
    padding: 0.3rem 0.75rem;
    border-radius: var(--t-radius-sm);
}

/* Timer */
.timer-bar {
    height: 4px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-xs);
    overflow: hidden;
}

.timer-bar__fill {
    height: 100%;
    background: var(--t-warning);
    transition: width var(--t-transition-normal) linear;
    border-radius: var(--t-radius-xs);
}

.timer-bar__fill--going {
    background: var(--t-danger);
    animation: pulse-bar 0.8s ease-in-out infinite;
}

@keyframes pulse-bar {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.6;
    }
}

/* Going Phase Banner */
.going-phase-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.6rem 1rem;
    border-radius: var(--t-radius-md);
    font-weight: 800;
    font-size: var(--t-font-size-lg);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    animation: phase-pulse 1s ease-in-out infinite;
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

@keyframes phase-pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.02);
    }
}

/* Body */
.bidding-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-5);
}

.section-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    margin: 0 0 var(--t-space-2);
}

/* Peek */
.peek-section,
.bidders-section {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-3);
}

.peek-hints {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.peek-hint {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    font-style: italic;
    margin: 0;
    padding-left: var(--t-space-2);
    border-left: 2px solid color-mix(in srgb, var(--t-warning) 20%, transparent);
}

/* Bidders */
.bidder-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.bidder-chip {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: 0.4rem 0.6rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    transition: opacity var(--t-transition-normal);
}

.bidder-chip--dropped {
    opacity: 0.4;
}

.bidder-chip--leading {
    border: 1px solid var(--t-danger);
    background: color-mix(in srgb, var(--t-danger) 6%, transparent);
}

.bidder-avatar {
    font-size: 1.1rem;
    color: var(--t-text-muted);
}

.bidder-info {
    display: flex;
    flex-direction: column;
}

.bidder-name {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-medium);
    color: var(--t-text);
}

.bidder-status {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.bidder-status--leading {
    color: var(--t-danger);
    font-weight: var(--t-font-semibold);
}

/* Right column */
.bidding-right {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.bidding-left {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.current-bid-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    text-align: center;
}

.bid-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.bid-amount {
    font-size: 2rem;
    font-weight: 800;
    color: var(--t-text);
    margin: 0.25rem 0;
}

.bid-amount--player {
    color: var(--t-success);
}

.bid-holder {
    font-size: var(--t-font-size-sm);
    color: var(--t-danger);
    font-weight: var(--t-font-semibold);
}

.bid-holder.positive {
    color: var(--t-success);
}

/* Bid controls */
.bid-controls {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.bid-multiplier-row {
    display: flex;
    gap: var(--t-space-2);
}

.bid-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.bid-preview-label {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.bid-preview-value {
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.bid-button {
    width: 100%;
}

.leave-button {
    width: 100%;
}

/* Result */
.result-banner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: var(--t-space-4);
    border-radius: var(--t-radius-md);
    text-align: center;
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-lg);
}

.result-banner--won {
    background: color-mix(in srgb, var(--t-success) 8%, transparent);
    border: 1px solid var(--t-success);
    color: var(--t-success);
}

.result-banner--lost {
    background: color-mix(in srgb, var(--t-danger) 8%, transparent);
    border: 1px solid var(--t-danger);
    color: var(--t-danger);
}

.result-icon {
    font-size: 1.9rem;
}

.result-price {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

/* Balance */
.balance-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

/* Won items */
.won-items {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-4);
}

.items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--t-space-2);
    margin-bottom: var(--t-space-3);
}

.found-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    text-align: center;
}

.found-item__icon {
    font-size: 1.4rem;
}

.found-item__name {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.found-item__rarity {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: var(--t-font-bold);
}

/* ── NPC Tells ─────────────────────────────────────────── */
.bidder-tell {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.4rem;
    height: 1.4rem;
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

/* ── Tactics Row ───────────────────────────────────────── */
.tactics-row {
    display: flex;
    gap: var(--t-space-2);
    flex-wrap: wrap;
    padding-top: var(--t-space-2);
    border-top: 1px dashed var(--t-border);
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

/* ── Lot Tier Badge ────────────────────────────────────────── */

.lot-tier-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--_tier-color);
    background: color-mix(in srgb, var(--_tier-color) 12%, transparent);
    padding: 0.2rem 0.5rem;
    border-radius: var(--t-radius-sm);
    border: 1px solid color-mix(in srgb, var(--_tier-color) 25%, transparent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
}

/* Tactic toast transition */
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
</style>
