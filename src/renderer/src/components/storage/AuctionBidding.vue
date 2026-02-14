<script setup lang="ts">
/**
 * AuctionBidding — Active auction bidding interface.
 * Shows the bidding war in real-time: hints, bidder avatars,
 * current bid, timer, and player bid controls.
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { D, add } from '@renderer/core/BigNum'
import { STORAGE_LOCATIONS } from '@renderer/data/storage'
import { rarityCssVar } from '@renderer/data/rarity'

defineEmits<{ back: [] }>()

const storage = useStorageStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const auction = computed(() => storage.activeAuction)
const location = computed(() =>
    auction.value ? STORAGE_LOCATIONS.find(l => l.id === auction.value!.locationId) : null
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
    return ((50 - auction.value.roundTicksLeft) / 50) * 100
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
                <Button icon="pi pi-arrow-left" text severity="secondary" size="small" @click="leave" />
                <AppIcon :icon="location?.icon ?? 'mdi:warehouse'" class="bidding-location-icon" />
                <div>
                    <h2 class="bidding-title">{{ location?.name }}</h2>
                    <span class="bidding-subtitle">{{ t('storage.auction_in_progress') }}</span>
                </div>
            </div>
            <div class="bidding-header__right">
                <span class="bidding-round">{{ t('storage.round_n', { n: auction.roundsElapsed }) }}</span>
            </div>
        </div>

        <!-- Timer Bar -->
        <div class="timer-bar">
            <div class="timer-bar__fill" :style="{ width: roundProgress + '%' }"></div>
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
                <div class="bidders-section">
                    <h3 class="section-label">
                        <AppIcon icon="mdi:account-group" /> {{ t('storage.competitors') }}
                    </h3>
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
                </div>
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
                        <Button v-for="m in bidMultipliers" :key="m" :label="`${m}×`"
                            :severity="selectedMultiplier === m ? undefined : 'secondary'" size="small"
                            :outlined="selectedMultiplier !== m" @click="selectedMultiplier = m" />
                    </div>

                    <div class="bid-preview">
                        <span class="bid-preview-label">{{ t('storage.your_bid') }}</span>
                        <span class="bid-preview-value">{{ formatCash(bidAmount) }}</span>
                    </div>

                    <Button :label="t('storage.place_bid')" icon="pi pi-dollar" size="large" :disabled="!canBid"
                        class="bid-button" @click="placeBid" />

                    <Button :label="t('storage.leave_auction')" severity="secondary" text size="small" @click="leave"
                        class="leave-button" />
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
                    <span class="found-item__name">{{ item.name }}</span>
                    <span class="found-item__rarity" :style="{ color: rarityCssVar(item.rarity) }">{{ item.rarity
                        }}</span>
                </div>
            </div>
            <Button :label="t('storage.collect_items')" icon="pi pi-check" @click="$emit('back')" />
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
    font-size: 1.5rem;
    color: #f59e0b;
}

.bidding-title {
    font-size: var(--t-font-size-lg);
    font-weight: 700;
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
    background: #f59e0b;
    transition: width 0.5s linear;
    border-radius: 2px;
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
    font-weight: 600;
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
    border-left: 2px solid #f59e0b33;
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
    transition: opacity 0.3s;
}

.bidder-chip--dropped {
    opacity: 0.4;
}

.bidder-chip--leading {
    border: 1px solid #ef4444;
    background: #ef444410;
}

.bidder-avatar {
    font-size: 1.2rem;
    color: var(--t-text-muted);
}

.bidder-info {
    display: flex;
    flex-direction: column;
}

.bidder-name {
    font-size: var(--t-font-size-sm);
    font-weight: 500;
    color: var(--t-text);
}

.bidder-status {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.bidder-status--leading {
    color: #ef4444;
    font-weight: 600;
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
    color: #22c55e;
}

.bid-holder {
    font-size: var(--t-font-size-sm);
    color: #ef4444;
    font-weight: 600;
}

.bid-holder.positive {
    color: #22c55e;
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
    font-weight: 700;
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
    font-weight: 700;
    font-size: var(--t-font-size-lg);
}

.result-banner--won {
    background: #22c55e15;
    border: 1px solid #22c55e;
    color: #22c55e;
}

.result-banner--lost {
    background: #ef444415;
    border: 1px solid #ef4444;
    color: #ef4444;
}

.result-icon {
    font-size: 2rem;
}

.result-price {
    font-size: var(--t-font-size-sm);
    opacity: 0.8;
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
    font-size: 1.5rem;
}

.found-item__name {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text);
}

.found-item__rarity {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}
</style>
