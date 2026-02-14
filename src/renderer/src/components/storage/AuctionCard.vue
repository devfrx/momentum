<script setup lang="ts">
/**
 * AuctionCard — Displays an available auction in the lobby grid.
 * Shows location, peek hints, bidder count, starting bid.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import type { StorageAuction } from '@renderer/data/storage'

const props = defineProps<{
    auction: StorageAuction
}>()

defineEmits<{ bid: [auctionId: string] }>()

const { formatCash } = useFormat()
const { t } = useI18n()
const storage = useStorageStore()

const location = storage.getLocation(props.auction.locationId)
</script>

<template>
    <div class="auction-card" :style="{ '--_accent': '#f59e0b' }">
        <!-- Head -->
        <div class="auction-card__head">
            <AppIcon :icon="location?.icon ?? 'mdi:warehouse'" class="auction-card__icon" />
            <div class="auction-card__identity">
                <span class="auction-card__name">{{ location?.name ?? t('storage.unknown_location') }}</span>
                <span class="auction-card__tier">{{ location?.tier?.toUpperCase() }}</span>
            </div>
            <span class="auction-card__badge">
                <AppIcon icon="mdi:account-group" />
                {{ auction.bidders.length }} {{ t('storage.bidders') }}
            </span>
        </div>

        <!-- Peek Hints -->
        <div class="auction-card__hints">
            <AppIcon icon="mdi:eye" class="hint-icon" />
            <div class="hint-list">
                <span v-for="(hint, i) in auction.peekHints" :key="i" class="hint-text">{{ hint }}</span>
            </div>
        </div>

        <!-- Stats -->
        <div class="auction-card__stats">
            <div class="auction-card__kpi">
                <span class="auction-card__kpi-label">{{ t('storage.starting_bid') }}</span>
                <span class="auction-card__kpi-value">{{ formatCash(auction.currentBid) }}</span>
            </div>
            <div class="auction-card__kpi">
                <span class="auction-card__kpi-label">{{ t('storage.items_inside') }}</span>
                <span class="auction-card__kpi-value">{{ t('storage.unknown_items') }}</span>
            </div>
        </div>

        <!-- Actions -->
        <div class="auction-card__actions">
            <Button :label="t('storage.enter_auction')" icon="pi pi-sign-in" size="small" class="auction-card__btn"
                @click="$emit('bid', auction.id)" />
        </div>
    </div>
</template>

<style scoped>
.auction-card {
    --_accent: #f59e0b;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    box-shadow: var(--t-shadow-sm);
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.auction-card:hover {
    border-color: var(--t-border-hover);
}

.auction-card__head {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.auction-card__icon {
    font-size: 1.5rem;
    color: var(--_accent);
    flex-shrink: 0;
}

.auction-card__identity {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.auction-card__name {
    font-weight: 600;
    font-size: var(--t-font-size-base);
    color: var(--t-text);
}

.auction-card__tier {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    letter-spacing: 0.08em;
    font-weight: 600;
}

.auction-card__badge {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
    padding: 0.25rem 0.5rem;
    border-radius: var(--t-radius-sm);
}

.auction-card__hints {
    display: flex;
    gap: var(--t-space-2);
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.hint-icon {
    font-size: 1rem;
    color: var(--t-text-muted);
    flex-shrink: 0;
    margin-top: 2px;
}

.hint-list {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.hint-text {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    font-style: italic;
}

.auction-card__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-2);
}

.auction-card__kpi {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.auction-card__kpi-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.auction-card__kpi-value {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.auction-card__actions {
    display: flex;
    justify-content: flex-end;
}

.auction-card__btn {
    width: 100%;
}
</style>
