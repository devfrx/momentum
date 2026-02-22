<script setup lang="ts">
/**
 * ResaleAuctionPanel — Immersive online auction house.
 *
 * Live auction cards with countdown bars, bidder avatars, heat indicators,
 * and a marketplace-style listing flow. Feels like eBay/StockX meets
 * a real-time auction platform.
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { useShopStore } from '@renderer/stores/useShopStore'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { UButton, UCard, UModal } from '@renderer/components/ui'
import { D, ZERO } from '@renderer/core/BigNum'
import { rarityCssVar } from '@renderer/data/rarity'
import { calculateListingFee } from '@renderer/data/shop/auction'
import type { ResaleAuction, NpcAuctionBidder } from '@renderer/data/shop/auction'
import {
    CONDITION_ICONS,
    CONDITION_COLORS,
} from '@renderer/data/shop/restoration'
import type { ItemCondition } from '@renderer/data/storage/items'
import { resolveItemName } from '@renderer/data/storage/items'

const shop = useShopStore()
const vault = useVaultStore()
const storage = useStorageStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

// ── List Item Dialog State ─────────────────────────────────────

const showListDialog = ref(false)
const selectedItemId = ref<string | null>(null)
const selectedSource = ref<'vault' | 'storage'>('vault')
const startingPriceInput = ref('')
const buyNowPriceInput = ref('')

const auctionableItems = computed(() => {
    const items: { item: any; source: 'vault' | 'storage' }[] = []
    for (const item of vault.items) {
        items.push({ item, source: 'vault' })
    }
    for (const item of storage.inventory) {
        items.push({ item, source: 'storage' })
    }
    return items
})

const selectedItem = computed(() => {
    if (!selectedItemId.value) return null
    return auctionableItems.value.find(a => a.item.id === selectedItemId.value) ?? null
})

const estimatedListingFee = computed(() => {
    const price = parseFloat(startingPriceInput.value)
    if (isNaN(price) || price <= 0) return ZERO
    return calculateListingFee(D(price))
})

function openListDialog(itemId: string, source: 'vault' | 'storage'): void {
    selectedItemId.value = itemId
    selectedSource.value = source

    // Default starting price = 80% of appraised value
    const found = auctionableItems.value.find(a => a.item.id === itemId)
    if (found) {
        const val = found.item.appraisedValue ?? found.item.baseValue
        startingPriceInput.value = Math.floor(val.toNumber() * 0.8).toString()
        buyNowPriceInput.value = Math.floor(val.toNumber() * 1.5).toString()
    }

    showListDialog.value = true
}

function confirmListing(): void {
    if (!selectedItemId.value) return

    const startPrice = D(parseFloat(startingPriceInput.value) || 0)
    const buyNow = buyNowPriceInput.value
        ? D(parseFloat(buyNowPriceInput.value))
        : null

    shop.listForAuction(
        selectedItemId.value,
        selectedSource.value,
        startPrice,
        buyNow,
    )

    showListDialog.value = false
    selectedItemId.value = null
}

function condLabel(cond: ItemCondition | undefined): string {
    return t(`shop.condition_${cond ?? 'good'}`)
}

function auctionTimeLeft(auction: ResaleAuction): string {
    const remaining = Math.max(0, auction.endsAtTick - shop._lastGameTick)
    const seconds = Math.floor(remaining / 10)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** Progress 0→1 (1 = just started, 0 = expired) */
function auctionProgress(auction: ResaleAuction): number {
    const total = auction.endsAtTick - auction.startedAtTick
    if (total <= 0) return 0
    const remaining = Math.max(0, auction.endsAtTick - shop._lastGameTick)
    return remaining / total
}

/** True when < 20% time remains */
function isUrgent(auction: ResaleAuction): boolean {
    return auctionProgress(auction) < 0.2
}

/** Heat label based on active bidder count */
function auctionHeat(auction: ResaleAuction): 'hot' | 'warm' | 'cool' {
    const active = auction.bidders.filter((b: NpcAuctionBidder) => b.active).length
    if (active >= 4) return 'hot'
    if (active >= 2) return 'warm'
    return 'cool'
}

const HEAT_META: Record<string, { icon: string; color: string }> = {
    hot: { icon: 'mdi:fire', color: 'var(--t-danger)' },
    warm: { icon: 'mdi:trending-up', color: 'var(--t-warning)' },
    cool: { icon: 'mdi:trending-neutral', color: 'var(--t-text-muted)' },
}

const HISTORY_STATUS_ICONS: Record<string, string> = {
    sold: 'mdi:check-circle',
    expired: 'mdi:timer-sand-empty',
    cancelled: 'mdi:close-circle',
}
</script>

<template>
    <div class="auction-panel">
        <!-- ═══════════════════════════════════════════════════
             Header
             ═══════════════════════════════════════════════════ -->
        <div class="panel-header">
            <div class="panel-header__left">
                <div class="panel-header__icon-wrap">
                    <AppIcon icon="mdi:gavel" />
                </div>
                <div>
                    <h3 class="panel-title">{{ t('shop.auction_title') }}</h3>
                    <span class="auction-count">
                        {{ t('shop.auction_active_count', { count: shop.activeAuctionCount, max: 3 }) }}
                    </span>
                </div>
            </div>
            <!-- slot counter pills -->
            <div class="slot-pills">
                <span v-for="i in 3" :key="i" class="slot-pill"
                    :class="{ 'slot-pill--active': i <= shop.activeAuctionCount }" />
            </div>
        </div>

        <!-- ═══════════════════════════════════════════════════
             Active Auctions — Live cards
             ═══════════════════════════════════════════════════ -->
        <div v-if="shop.activeAuctions.length > 0" class="auction-grid">
            <UCard v-for="auction in shop.activeAuctions" :key="auction.id" size="sm" radius="lg"
                :accent="rarityCssVar(auction.item.rarity)"
                :class="['live-card', { 'live-card--urgent': isUrgent(auction), 'live-card--has-bids': !!auction.currentBidder }]">
                <template #header>
                    <!-- Live badge + heat -->
                    <div class="live-card__status-bar">
                        <span class="live-badge">
                            <span class="live-badge__dot" />
                            {{ t('shop.auction_live') }}
                        </span>
                        <!-- <span class="heat-badge" :style="{ color: HEAT_META[auctionHeat(auction)].color }">
                            <AppIcon :icon="HEAT_META[auctionHeat(auction)].icon" />
                            {{ t(`shop.auction_heat_${auctionHeat(auction)}`) }}
                        </span> -->
                    </div>
                    <!-- Timer -->
                    <span class="live-card__timer" :class="{ 'live-card__timer--urgent': isUrgent(auction) }">
                        <AppIcon icon="mdi:clock-outline" />
                        {{ auctionTimeLeft(auction) }}
                    </span>
                </template>

                <!-- Time progress bar -->
                <div class="time-bar">
                    <div class="time-bar__fill" :class="{ 'time-bar__fill--urgent': isUrgent(auction) }"
                        :style="{ width: `${auctionProgress(auction) * 100}%` }" />
                </div>

                <!-- Item showcase -->
                <div class="live-card__showcase">
                    <div class="live-card__icon-ring" :style="{ '--_ring': rarityCssVar(auction.item.rarity) }">
                        <AppIcon :icon="auction.item.icon" class="live-card__item-icon"
                            :style="{ color: rarityCssVar(auction.item.rarity) }" />
                    </div>
                    <div class="live-card__item-info">
                        <span class="live-card__item-name">{{ resolveItemName(auction.item, t) }}</span>
                        <span class="live-card__rarity" :style="{ color: rarityCssVar(auction.item.rarity) }">
                            {{ auction.item.rarity }}
                            <template v-if="auction.item.condition">
                                <span class="live-card__cond-sep">·</span>
                                <AppIcon :icon="CONDITION_ICONS[auction.item.condition]"
                                    :style="{ color: CONDITION_COLORS[auction.item.condition] }" />
                                {{ condLabel(auction.item.condition) }}
                            </template>
                        </span>
                    </div>
                </div>

                <!-- Central bid display -->
                <div class="bid-display">
                    <div class="bid-display__current">
                        <span class="bid-display__label">{{ t('shop.auction_current_bid') }}</span>
                        <span class="bid-display__amount"
                            :class="{ 'bid-display__amount--active': !!auction.currentBidder }">
                            {{ auction.currentBidder ? formatCash(auction.currentBid) : t('shop.auction_no_bids') }}
                        </span>
                    </div>
                    <div class="bid-display__meta">
                        <div class="bid-meta-item">
                            <span class="bid-meta-item__label">{{ t('shop.auction_starting') }}</span>
                            <span class="bid-meta-item__value">{{ formatCash(auction.startingPrice) }}</span>
                        </div>
                        <div v-if="auction.buyNowPrice" class="bid-meta-item">
                            <span class="bid-meta-item__label">{{ t('shop.auction_buy_now_label') }}</span>
                            <span class="bid-meta-item__value bid-meta-item__value--buynow">
                                {{ formatCash(auction.buyNowPrice) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Bidder strip -->
                <div class="bidder-strip">
                    <div class="bidder-strip__header">
                        <span class="bidder-strip__label">
                            {{ t('shop.auction_bidders_count') }}
                            <span class="bidder-strip__count">{{ auction.bidders.length }}</span>
                        </span>
                        <span v-if="auction.currentBidder" class="bidder-strip__leader">
                            <AppIcon icon="mdi:crown" class="bidder-strip__crown" />
                            {{ auction.currentBidder }}
                        </span>
                    </div>
                    <div class="bidder-avatars">
                        <span v-for="(bidder, idx) in auction.bidders" :key="idx" class="bidder-avatar"
                            :class="{ 'bidder-avatar--inactive': !bidder.active, 'bidder-avatar--leader': bidder.name === auction.currentBidder }"
                            :title="bidder.name">
                            <AppIcon :icon="bidder.icon" />
                        </span>
                    </div>
                </div>

                <template #footer>
                    <UButton variant="ghost" size="xs" icon="mdi:close-circle-outline"
                        @click="shop.cancelAuction(auction.id)">
                        {{ t('shop.auction_cancel') }}
                    </UButton>
                </template>
            </UCard>
        </div>

        <div v-else class="empty-auctions">
            <div class="empty-auctions__visual">
                <AppIcon icon="mdi:gavel" class="empty-icon" />
            </div>
            <p class="empty-auctions__text">{{ t('shop.auction_none_active') }}</p>
        </div>

        <!-- ═══════════════════════════════════════════════════
             List New Item
             ═══════════════════════════════════════════════════ -->
        <h4 class="section-label">
            <AppIcon icon="mdi:tag-plus-outline" />
            {{ t('shop.auction_list_item') }}
        </h4>

        <div v-if="auctionableItems.length > 0 && shop.canListAuction" class="auctionable-grid">
            <UCard v-for="{ item, source } in auctionableItems" :key="item.id" size="sm" radius="md" interactive
                :accent="rarityCssVar(item.rarity)" class="listing-card" @click="openListDialog(item.id, source)">
                <div class="listing-card__top">
                    <div class="listing-card__icon-wrap" :style="{ background: rarityCssVar(item.rarity) + '14' }">
                        <AppIcon :icon="item.icon" class="listing-card__icon"
                            :style="{ color: rarityCssVar(item.rarity) }" />
                    </div>
                    <div class="listing-card__info">
                        <span class="listing-card__name">{{ resolveItemName(item, t) }}</span>
                        <div class="listing-card__tags">
                            <span class="listing-card__rarity" :style="{ color: rarityCssVar(item.rarity) }">
                                {{ item.rarity }}
                            </span>
                            <span v-if="item.condition" class="listing-card__condition"
                                :style="{ color: CONDITION_COLORS[item.condition] }">
                                <AppIcon :icon="CONDITION_ICONS[item.condition]" />
                                {{ condLabel(item.condition) }}
                            </span>
                        </div>
                    </div>
                    <span class="listing-card__source"
                        :class="source === 'vault' ? 'listing-card__source--vault' : 'listing-card__source--storage'">
                        <AppIcon :icon="source === 'vault' ? 'mdi:safe-square-outline' : 'mdi:package-variant'" />
                        {{ t(`shop.auction_source_${source}`) }}
                    </span>
                </div>
                <div class="listing-card__bottom">
                    <span class="listing-card__value">
                        <AppIcon icon="mdi:cash" />
                        {{ formatCash(item.appraisedValue ?? item.baseValue) }}
                    </span>
                    <UButton variant="primary" size="xs" icon="mdi:tag-arrow-up-outline"
                        @click.stop="openListDialog(item.id, source)">
                        {{ t('shop.auction_list') }}
                    </UButton>
                </div>
            </UCard>
        </div>

        <div v-else-if="!shop.canListAuction" class="max-auctions-msg">
            <AppIcon icon="mdi:alert-circle-outline" />
            {{ t('shop.auction_max_reached') }}
        </div>

        <div v-else class="empty-state">
            <AppIcon icon="mdi:package-variant-remove" class="empty-icon" />
            <p>{{ t('shop.auction_no_items') }}</p>
        </div>

        <!-- ═══════════════════════════════════════════════════
             Auction History
             ═══════════════════════════════════════════════════ -->
        <template v-if="shop.auctionHistory.length > 0">
            <h4 class="section-label">
                <AppIcon icon="mdi:history" />
                {{ t('shop.auction_history') }}
            </h4>
            <div class="history-list">
                <div v-for="ah in shop.auctionHistory" :key="ah.id" class="history-item"
                    :class="`history-item--${ah.status}`">
                    <div class="history-item__status-icon">
                        <AppIcon :icon="HISTORY_STATUS_ICONS[ah.status] ?? 'mdi:help-circle'" />
                    </div>
                    <AppIcon :icon="ah.item.icon" class="history-item__item-icon"
                        :style="{ color: rarityCssVar(ah.item.rarity) }" />
                    <div class="history-item__info">
                        <span class="history-item__name">{{ resolveItemName(ah.item, t) }}</span>
                        <span class="history-item__rarity" :style="{ color: rarityCssVar(ah.item.rarity) }">
                            {{ ah.item.rarity }}
                        </span>
                    </div>
                    <span class="history-item__status-label">{{ t(`shop.auction_status_${ah.status}`) }}</span>
                    <span v-if="ah.status === 'sold'" class="history-item__price">
                        {{ formatCash(ah.currentBid) }}
                    </span>
                </div>
            </div>
        </template>

        <!-- ═══════════════════════════════════════════════════
             Listing Dialog
             ═══════════════════════════════════════════════════ -->
        <UModal v-model="showListDialog" :title="t('shop.auction_create')" icon="mdi:tag-arrow-up-outline" size="sm">
            <div v-if="selectedItem" class="dialog-item">
                <div class="dialog-item__icon-ring"
                    :style="{ '--_ring': rarityCssVar(selectedItem.item.rarity), background: rarityCssVar(selectedItem.item.rarity) + '14' }">
                    <AppIcon :icon="selectedItem.item.icon" class="dialog-item-icon"
                        :style="{ color: rarityCssVar(selectedItem.item.rarity) }" />
                </div>
                <div class="dialog-item__text">
                    <span class="dialog-item-name">{{ resolveItemName(selectedItem.item, t) }}</span>
                    <span class="dialog-item-rarity" :style="{ color: rarityCssVar(selectedItem.item.rarity) }">
                        {{ selectedItem.item.rarity }}
                    </span>
                    <span class="dialog-item-val">
                        {{ t('shop.auction_value') }}: {{ formatCash(selectedItem.item.appraisedValue ??
                            selectedItem.item.baseValue) }}
                    </span>
                </div>
            </div>

            <div class="dialog-fields">
                <div class="dialog-field">
                    <label>
                        <AppIcon icon="mdi:gavel" />
                        {{ t('shop.auction_starting_price') }}
                    </label>
                    <input type="number" v-model="startingPriceInput" class="dialog-input" min="1" />
                </div>

                <div class="dialog-field">
                    <label>
                        <AppIcon icon="mdi:lightning-bolt" />
                        {{ t('shop.auction_buy_now') }}
                    </label>
                    <input type="number" v-model="buyNowPriceInput" class="dialog-input" min="0"
                        :placeholder="t('shop.auction_optional')" />
                </div>
            </div>

            <div class="dialog-fee">
                <span>
                    <AppIcon icon="mdi:receipt-text-outline" />
                    {{ t('shop.auction_listing_fee') }}
                </span>
                <span class="dialog-fee-amount">{{ formatCash(estimatedListingFee) }}</span>
            </div>

            <template #footer>
                <UButton variant="ghost" @click="showListDialog = false">{{ t('common.cancel') }}</UButton>
                <UButton variant="primary" icon="mdi:check"
                    :disabled="parseFloat(startingPriceInput) <= 0 || player.cash.lt(estimatedListingFee)"
                    @click="confirmListing">{{ t('shop.auction_confirm') }}</UButton>
            </template>
        </UModal>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   AUCTION PANEL — Root
   ═══════════════════════════════════════════════════════════════ */
.auction-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

/* ── Header ──────────────────────────────────────────────────── */
.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel-header__left {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.panel-header__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--t-radius-md);
    background: var(--t-accent-muted);
    color: var(--t-accent);
    font-size: 1.1rem;
}

.panel-title {
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    margin: 0;
    line-height: var(--t-leading-tight);
}

.auction-count {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    letter-spacing: 0.02em;
}

.slot-pills {
    display: flex;
    gap: 4px;
}

.slot-pill {
    width: 8px;
    height: 8px;
    border-radius: var(--t-radius-full);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    transition: all var(--t-transition-normal);
}

.slot-pill--active {
    background: var(--t-accent);
    border-color: var(--t-accent);
    box-shadow: 0 0 6px var(--t-accent-muted);
}

/* ═══════════════════════════════════════════════════════════════
   LIVE AUCTION CARDS
   ═══════════════════════════════════════════════════════════════ */
.auction-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: var(--t-space-3);
}

.live-card {
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.live-card--has-bids {
    /* border-color: var(--t-border-hover); */
}

.live-card--urgent {
    /* animation: urgent-pulse 1.8s ease-in-out infinite; */
}

/* @keyframes urgent-pulse {
    0%, 100% { box-shadow: none; }
    50% { box-shadow: 0 0 0 2px var(--t-danger-muted); }
} */

/* ── Status bar (LIVE + heat) ── */
.live-card__status-bar {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.live-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.6rem;
    font-weight: var(--t-font-bold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--t-danger);
    padding: 2px 8px;
    background: var(--t-danger-muted);
    border-radius: var(--t-radius-full);
}

.live-badge__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--t-danger);
    /* animation: live-blink 1.5s ease-in-out infinite; */
}

/* @keyframes live-blink {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.3;
    }
} */

.heat-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.6rem;
    font-weight: var(--t-font-bold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

/* ── Timer ── */
.live-card__timer {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    font-family: var(--t-font-mono);
    white-space: nowrap;
}

.live-card__timer--urgent {
    color: var(--t-danger);
}

/* ── Time progress bar ── */
.time-bar {
    width: 100%;
    height: 3px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-full);
    overflow: hidden;
}

.time-bar__fill {
    height: 100%;
    background: var(--t-accent);
    border-radius: var(--t-radius-full);
    transition: width 0.5s linear;
}

.time-bar__fill--urgent {
    background: var(--t-danger);
}

/* ── Item showcase ── */
.live-card__showcase {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.live-card__icon-ring {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--t-radius-lg);
    background: color-mix(in srgb, var(--_ring, var(--t-text-muted)) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--_ring, var(--t-text-muted)) 20%, transparent);
    flex-shrink: 0;
}

.live-card__item-icon {
    font-size: 1.35rem;
}

.live-card__item-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.live-card__item-name {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.live-card__rarity {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: var(--t-font-bold);
}

.live-card__cond-sep {
    opacity: 0.4;
}

/* ── Central bid display ── */
.bid-display {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
}

.bid-display__current {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.bid-display__label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--t-text-muted);
    font-weight: var(--t-font-semibold);
}

.bid-display__amount {
    font-size: var(--t-font-size-xl);
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
    font-family: var(--t-font-mono);
    letter-spacing: -0.02em;
}

.bid-display__amount--active {
    color: var(--t-success);
}

.bid-display__meta {
    display: flex;
    gap: var(--t-space-4);
    border-top: 1px solid var(--t-border);
    padding-top: var(--t-space-2);
}

.bid-meta-item {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.bid-meta-item__label {
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--t-text-muted);
    font-weight: var(--t-font-medium);
}

.bid-meta-item__value {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
}

.bid-meta-item__value--buynow {
    color: var(--t-warning);
}

/* ── Bidder strip ── */
.bidder-strip {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1-5);
}

.bidder-strip__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.bidder-strip__label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--t-text-muted);
    font-weight: var(--t-font-semibold);
}

.bidder-strip__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    font-size: 0.55rem;
    font-weight: var(--t-font-bold);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-full);
    color: var(--t-text-secondary);
    margin-left: 4px;
}

.bidder-strip__leader {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.6rem;
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
}

.bidder-strip__crown {
    color: var(--t-gold);
    font-size: 0.7rem;
}

.bidder-avatars {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

.bidder-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: var(--t-radius-full);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    color: var(--t-text-secondary);
    font-size: 0.75rem;
    transition: all var(--t-transition-fast);
}

.bidder-avatar--leader {
    border-color: var(--t-gold);
    background: var(--t-gold-muted);
    color: var(--t-gold);
}

.bidder-avatar--inactive {
    opacity: 0.3;
    filter: grayscale(1);
}

/* ═══════════════════════════════════════════════════════════════
   SECTION LABELS
   ═══════════════════════════════════════════════════════════════ */
.section-label {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-muted);
    margin: var(--t-space-3) 0 0 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* ═══════════════════════════════════════════════════════════════
   LISTABLE ITEMS
   ═══════════════════════════════════════════════════════════════ */
.auctionable-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--t-space-3);
}

.listing-card {
    cursor: pointer;
}

.listing-card__top {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.listing-card__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: var(--t-radius-md);
    flex-shrink: 0;
}

.listing-card__icon {
    font-size: 1.15rem;
}

.listing-card__info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.listing-card__name {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.listing-card__tags {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.listing-card__rarity {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: var(--t-font-bold);
}

.listing-card__condition {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.6rem;
    font-weight: var(--t-font-semibold);
}

.listing-card__source {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.55rem;
    padding: 3px 8px;
    border-radius: var(--t-radius-full);
    text-transform: uppercase;
    font-weight: var(--t-font-bold);
    letter-spacing: 0.04em;
    white-space: nowrap;
    flex-shrink: 0;
}

.listing-card__source--vault {
    background: var(--t-blue-muted);
    color: var(--t-blue);
}

.listing-card__source--storage {
    background: var(--t-orange-muted);
    color: var(--t-orange);
}

.listing-card__bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--t-space-2);
    border-top: 1px solid var(--t-border);
}

.listing-card__value {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-success);
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY / WARNING STATES
   ═══════════════════════════════════════════════════════════════ */
.max-auctions-msg {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    font-size: var(--t-font-size-sm);
    color: var(--t-warning);
    background: var(--t-warning-muted);
    border: 1px solid color-mix(in srgb, var(--t-warning) 20%, transparent);
    border-radius: var(--t-radius-md);
}

.empty-auctions,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-8);
    color: var(--t-text-muted);
    text-align: center;
}

.empty-auctions__visual {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: var(--t-radius-xl);
    background: var(--t-bg-muted);
    border: 1px dashed var(--t-border);
}

.empty-icon {
    font-size: 1.8rem;
    color: var(--t-text-muted);
}

.empty-auctions__text {
    font-size: var(--t-font-size-sm);
    max-width: 280px;
    line-height: var(--t-leading-relaxed);
}

/* ═══════════════════════════════════════════════════════════════
   AUCTION HISTORY
   ═══════════════════════════════════════════════════════════════ */
.history-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.history-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
    transition: background var(--t-transition-fast);
}

.history-item:hover {
    background: var(--t-bg-card-hover);
}

.history-item__status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: var(--t-radius-full);
    font-size: 0.7rem;
    flex-shrink: 0;
}

.history-item--sold .history-item__status-icon {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.history-item--expired .history-item__status-icon {
    background: var(--t-danger-muted);
    color: var(--t-danger);
}

.history-item--cancelled .history-item__status-icon {
    background: var(--t-bg-muted);
    color: var(--t-text-muted);
}

.history-item__item-icon {
    font-size: 0.9rem;
    flex-shrink: 0;
}

.history-item__info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.history-item__name {
    font-weight: var(--t-font-medium);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.history-item__rarity {
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: var(--t-font-bold);
}

.history-item__status-label {
    text-transform: uppercase;
    font-size: 0.6rem;
    font-weight: var(--t-font-bold);
    letter-spacing: 0.05em;
}

.history-item--sold .history-item__status-label {
    color: var(--t-success);
}

.history-item--expired .history-item__status-label {
    color: var(--t-danger);
}

.history-item--cancelled .history-item__status-label {
    color: var(--t-text-muted);
}

.history-item__price {
    font-weight: var(--t-font-semibold);
    color: var(--t-success);
    font-family: var(--t-font-mono);
}

/* ═══════════════════════════════════════════════════════════════
   LISTING DIALOG
   ═══════════════════════════════════════════════════════════════ */
.dialog-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
}

.dialog-item__icon-ring {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--t-radius-lg);
    flex-shrink: 0;
}

.dialog-item-icon {
    font-size: 1.3rem;
}

.dialog-item__text {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.dialog-item-name {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.dialog-item-rarity {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: var(--t-font-bold);
}

.dialog-item-val {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.dialog-fields {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.dialog-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.dialog-field label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    font-weight: var(--t-font-medium);
}

.dialog-input {
    padding: 0.5rem 0.75rem;
    background: var(--t-bg-input);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    color: var(--t-text);
    font-size: var(--t-font-size-sm);
    font-family: var(--t-font-mono);
    transition: border-color var(--t-transition-fast);
}

.dialog-input:focus {
    outline: none;
    border-color: var(--t-accent);
}

.dialog-input:focus-visible {
    box-shadow: var(--t-shadow-focus);
}

.dialog-fee {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    padding: var(--t-space-2) 0;
    border-top: 1px solid var(--t-border);
}

.dialog-fee span {
    display: flex;
    align-items: center;
    gap: 4px;
}

.dialog-fee-amount {
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    font-family: var(--t-font-mono);
}
</style>
