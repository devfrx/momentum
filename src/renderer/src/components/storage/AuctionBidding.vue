<script setup lang="ts">
/**
 * AuctionBidding — Active auction bidding interface.
 * Shows the bidding war in real-time: hints, bidder avatars,
 * current bid, timer, and player bid controls.
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

defineEmits<{ back: [] }>()

const storage = useStorageStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const auction = computed(() => storage.activeAuction)
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

function placeBid(): void {
    if (!canBid.value) return
    storage.placeBid(bidAmount.value)
}

function leave(): void {
    storage.leaveAuction()
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
                <UAccordion :title="t('storage.competitors')" icon="mdi:account-group" :badge="auction.bidders.length"
                    variant="ghost" compact defaultOpen>
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
                        </div>
                    </div>
                </UAccordion>
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
    border-radius: 2px;
    overflow: hidden;
}

.timer-bar__fill {
    height: 100%;
    background: var(--t-warning);
    transition: width var(--t-transition-normal) linear;
    border-radius: 2px;
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
</style>
