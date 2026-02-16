<script setup lang="ts">
/**
 * ResaleAuctionPanel — List items for NPC auction and monitor active bids.
 * Shows active auctions with live bid tracking and auction history.
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useShopStore } from '@renderer/stores/useShopStore'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { D, ZERO } from '@renderer/core/BigNum'
import { rarityCssVar } from '@renderer/data/rarity'
import { calculateListingFee } from '@renderer/data/shop/auction'
import {
    CONDITION_ICONS,
    CONDITION_COLORS,
} from '@renderer/data/shop/restoration'
import type { ItemCondition } from '@renderer/data/storage/items'

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

function auctionTimeLeft(auction: any): string {
    const remaining = Math.max(0, auction.endsAtTick - shop._lastGameTick)
    const seconds = Math.floor(remaining / 10)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
    <div class="auction-panel">
        <div class="panel-header">
            <h3 class="panel-title">
                <AppIcon icon="mdi:gavel" />
                {{ t('shop.auction_title') }}
            </h3>
            <span class="auction-count">
                {{ t('shop.auction_active_count', { count: shop.activeAuctionCount, max: 3 }) }}
            </span>
        </div>

        <!-- Active Auctions -->
        <div v-if="shop.activeAuctions.length > 0" class="auction-grid">
            <div v-for="auction in shop.activeAuctions" :key="auction.id" class="auction-card"
                :class="{ 'auction-card--has-bids': auction.currentBid.gt(0) }">
                <div class="auction-card__header">
                    <AppIcon :icon="auction.item.icon" class="auction-card__icon"
                        :style="{ color: rarityCssVar(auction.item.rarity) }" />
                    <div class="auction-card__info">
                        <span class="auction-card__name">{{ auction.item.name }}</span>
                        <span class="auction-card__rarity" :style="{ color: rarityCssVar(auction.item.rarity) }">
                            {{ auction.item.rarity }}
                            <template v-if="auction.item.condition">
                                ·
                                <AppIcon :icon="CONDITION_ICONS[auction.item.condition]"
                                    :style="{ color: CONDITION_COLORS[auction.item.condition] }" />
                                {{ condLabel(auction.item.condition) }}
                            </template>
                        </span>
                    </div>
                    <span class="auction-card__timer">
                        <AppIcon icon="mdi:clock-outline" />
                        {{ auctionTimeLeft(auction) }}
                    </span>
                </div>

                <div class="auction-card__bids">
                    <div class="bid-row">
                        <span class="bid-label">{{ t('shop.auction_starting') }}</span>
                        <span class="bid-value">{{ formatCash(auction.startingPrice) }}</span>
                    </div>
                    <div class="bid-row bid-row--current">
                        <span class="bid-label">{{ t('shop.auction_current_bid') }}</span>
                        <span class="bid-value bid-value--highlight">
                            {{ auction.currentBid.gt(0) ? formatCash(auction.currentBid) : t('shop.auction_no_bids') }}
                        </span>
                    </div>
                    <div v-if="auction.currentBidder" class="bid-row">
                        <span class="bid-label">{{ t('shop.auction_bidder') }}</span>
                        <span class="bid-value">{{ auction.currentBidder }}</span>
                    </div>
                    <div class="bid-row">
                        <span class="bid-label">{{ t('shop.auction_bidders_count') }}</span>
                        <span class="bid-value">{{ auction.bidders.length }}</span>
                    </div>
                </div>

                <Button :label="t('shop.auction_cancel')" icon="pi pi-times" size="small" severity="secondary" text
                    @click="shop.cancelAuction(auction.id)" />
            </div>
        </div>

        <div v-else class="empty-auctions">
            <AppIcon icon="mdi:gavel" class="empty-icon" />
            <p>{{ t('shop.auction_none_active') }}</p>
        </div>

        <!-- List New Item -->
        <h4 class="section-label">{{ t('shop.auction_list_item') }}</h4>

        <div v-if="auctionableItems.length > 0 && shop.canListAuction" class="auctionable-grid">
            <div v-for="{ item, source } in auctionableItems" :key="item.id" class="auctionable-item"
                :style="{ '--_rarity': rarityCssVar(item.rarity) }">
                <div class="auctionable-item__header">
                    <AppIcon :icon="item.icon" class="auctionable-item__icon"
                        :style="{ color: rarityCssVar(item.rarity) }" />
                    <div class="auctionable-item__info">
                        <span class="auctionable-item__name">{{ item.name }}</span>
                        <span class="auctionable-item__rarity" :style="{ color: rarityCssVar(item.rarity) }">
                            {{ item.rarity }}
                        </span>
                    </div>
                    <span class="auctionable-item__source badge">{{ source }}</span>
                </div>
                <div class="auctionable-item__footer">
                    <span class="auctionable-item__value">{{ formatCash(item.appraisedValue ?? item.baseValue) }}</span>
                    <Button :label="t('shop.auction_list')" icon="pi pi-tag" size="small"
                        @click="openListDialog(item.id, source)" />
                </div>
            </div>
        </div>

        <div v-else-if="!shop.canListAuction" class="max-auctions-msg">
            <AppIcon icon="mdi:alert-circle" />
            {{ t('shop.auction_max_reached') }}
        </div>

        <div v-else class="empty-state">
            <AppIcon icon="mdi:package-variant-remove" class="empty-icon" />
            <p>{{ t('shop.auction_no_items') }}</p>
        </div>

        <!-- Auction History -->
        <template v-if="shop.auctionHistory.length > 0">
            <h4 class="section-label">{{ t('shop.auction_history') }}</h4>
            <div class="history-list">
                <div v-for="ah in shop.auctionHistory" :key="ah.id" class="history-item"
                    :class="`history-item--${ah.status}`">
                    <AppIcon :icon="ah.item.icon" class="history-item__icon" />
                    <span class="history-item__name">{{ ah.item.name }}</span>
                    <span class="history-item__status">{{ t(`shop.auction_status_${ah.status}`) }}</span>
                    <span v-if="ah.status === 'sold'" class="history-item__price">
                        {{ formatCash(ah.currentBid) }}
                    </span>
                </div>
            </div>
        </template>

        <!-- Listing Dialog (inline) -->
        <Teleport to="body">
            <div v-if="showListDialog" class="dialog-overlay" @click.self="showListDialog = false">
                <div class="dialog-box">
                    <h3 class="dialog-title">
                        <AppIcon icon="mdi:tag-plus" />
                        {{ t('shop.auction_create') }}
                    </h3>

                    <div v-if="selectedItem" class="dialog-item">
                        <AppIcon :icon="selectedItem.item.icon" class="dialog-item-icon"
                            :style="{ color: rarityCssVar(selectedItem.item.rarity) }" />
                        <div>
                            <span class="dialog-item-name">{{ selectedItem.item.name }}</span>
                            <span class="dialog-item-val">
                                {{ t('shop.auction_value') }}: {{ formatCash(selectedItem.item.appraisedValue ??
                                selectedItem.item.baseValue) }}
                            </span>
                        </div>
                    </div>

                    <div class="dialog-field">
                        <label>{{ t('shop.auction_starting_price') }}</label>
                        <input type="number" v-model="startingPriceInput" class="dialog-input" min="1" />
                    </div>

                    <div class="dialog-field">
                        <label>{{ t('shop.auction_buy_now') }}</label>
                        <input type="number" v-model="buyNowPriceInput" class="dialog-input" min="0"
                            :placeholder="t('shop.auction_optional')" />
                    </div>

                    <div class="dialog-fee">
                        <span>{{ t('shop.auction_listing_fee') }}:</span>
                        <span class="dialog-fee-amount">{{ formatCash(estimatedListingFee) }}</span>
                    </div>

                    <div class="dialog-actions">
                        <Button :label="t('common.cancel')" severity="secondary" outlined
                            @click="showListDialog = false" />
                        <Button :label="t('shop.auction_confirm')" icon="pi pi-check"
                            :disabled="parseFloat(startingPriceInput) <= 0 || player.cash.lt(estimatedListingFee)"
                            @click="confirmListing" />
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.auction-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel-title {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-md);
    font-weight: 600;
    color: var(--t-text);
    margin: 0;
}

.auction-count {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.auction-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--t-space-3);
}

.auction-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    transition: all var(--t-transition-fast);
}

.auction-card--has-bids {
    border-left: 3px solid #22c55e;
}

.auction-card__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.auction-card__icon {
    font-size: 1.3rem;
}

.auction-card__info {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.auction-card__name {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.auction-card__rarity {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}

.auction-card__timer {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-accent);
    white-space: nowrap;
}

.auction-card__bids {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.bid-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--t-font-size-xs);
}

.bid-label {
    color: var(--t-text-muted);
}

.bid-value {
    font-weight: 600;
    color: var(--t-text);
}

.bid-value--highlight {
    color: #22c55e;
    font-size: var(--t-font-size-sm);
}

.bid-row--current {
    padding: 0.25rem 0;
    border-top: 1px solid var(--t-border);
    border-bottom: 1px solid var(--t-border);
}

.section-label {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text-muted);
    margin: var(--t-space-2) 0 0 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.auctionable-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--t-space-3);
}

.auctionable-item {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-left: 3px solid var(--_rarity, var(--t-border));
    border-radius: var(--t-radius-md);
}

.auctionable-item__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.auctionable-item__icon {
    font-size: 1.3rem;
}

.auctionable-item__info {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.auctionable-item__name {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.auctionable-item__rarity {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}

.auctionable-item__source {
    font-size: 0.6rem;
    padding: 0.15rem 0.4rem;
    background: var(--t-bg-muted);
    color: var(--t-text-muted);
    border-radius: var(--t-radius-sm);
    text-transform: uppercase;
    font-weight: 700;
}

.auctionable-item__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.auctionable-item__value {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: #22c55e;
}

.max-auctions-msg {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
}

.empty-auctions,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-6);
    color: var(--t-text-muted);
    text-align: center;
}

.empty-icon {
    font-size: 3rem;
    opacity: 0.2;
}

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
}

.history-item__icon {
    font-size: 1rem;
    color: var(--t-text-muted);
}

.history-item__name {
    flex: 1;
    font-weight: 500;
    color: var(--t-text);
}

.history-item__status {
    text-transform: uppercase;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.05em;
}

.history-item--sold .history-item__status {
    color: #22c55e;
}

.history-item--expired .history-item__status {
    color: #ef4444;
}

.history-item--cancelled .history-item__status {
    color: var(--t-text-muted);
}

.history-item__price {
    font-weight: 600;
    color: #22c55e;
}

/* ── Dialog ─────────────────────────────────────────────────── */

.dialog-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
}

.dialog-box {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    max-width: 420px;
    width: 100%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dialog-title {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-md);
    font-weight: 600;
    color: var(--t-text);
    margin: 0;
}

.dialog-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.dialog-item-icon {
    font-size: 1.5rem;
}

.dialog-item-name {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
    display: block;
}

.dialog-item-val {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.dialog-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.dialog-field label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    font-weight: 500;
}

.dialog-input {
    padding: 0.5rem 0.75rem;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    color: var(--t-text);
    font-size: var(--t-font-size-sm);
}

.dialog-input:focus {
    outline: none;
    border-color: var(--t-accent);
}

.dialog-fee {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    padding: var(--t-space-2) 0;
    border-top: 1px solid var(--t-border);
}

.dialog-fee-amount {
    font-weight: 600;
    color: var(--t-text);
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--t-space-2);
}
</style>
