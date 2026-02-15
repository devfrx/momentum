<script setup lang="ts">
/**
 * ShopListingCard — Displays a single shop listing.
 * Shows item info, price, rarity, flash sale badge, and buy button.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { rarityCssVar } from '@renderer/data/rarity'
import type { ShopListing } from '@renderer/data/shop/items'

const props = defineProps<{
    listing: ShopListing
}>()

defineEmits<{
    buy: [listingId: string, destination: 'vault' | 'storage']
}>()

const { formatCash } = useFormat()
const { t } = useI18n()
</script>

<template>
    <div class="shop-card" :style="{ '--_rarity': rarityCssVar(listing.item.rarity) }"
        :class="{ 'shop-card--flash': listing.flashSale, 'shop-card--unique': listing.unique }">
        <!-- Badges -->
        <div class="shop-card__badges">
            <span v-if="listing.flashSale" class="badge badge--flash">
                <AppIcon icon="mdi:flash" /> {{ t('shop.flash_sale') }}
                -{{ Math.round(listing.discount * 100) }}%
            </span>
            <span v-if="listing.unique" class="badge badge--unique">
                <AppIcon icon="mdi:star-shooting" /> {{ t('shop.unique') }}
            </span>
        </div>

        <div class="shop-card__header">
            <AppIcon :icon="listing.item.icon" class="shop-card__icon"
                :style="{ color: rarityCssVar(listing.item.rarity) }" />
            <div class="shop-card__info">
                <span class="shop-card__name">{{ listing.item.name }}</span>
                <span class="shop-card__rarity" :style="{ color: rarityCssVar(listing.item.rarity) }">{{
                    listing.item.rarity }}</span>
            </div>
        </div>

        <p class="shop-card__desc">{{ listing.item.description }}</p>

        <div class="shop-card__meta">
            <span class="shop-card__category">{{ listing.item.category }}</span>
            <div class="shop-card__price">
                <span v-if="listing.flashSale" class="price-original">{{ formatCash(listing.basePrice) }}</span>
                <span class="price-current" :class="{ 'price-current--sale': listing.flashSale }">
                    {{ formatCash(listing.price) }}
                </span>
            </div>
        </div>

        <div class="shop-card__actions">
            <Button :label="t('shop.buy_to_vault')" icon="pi pi-lock" size="small"
                @click="$emit('buy', listing.id, 'vault')" />
            <Button :label="t('shop.buy_to_storage')" icon="pi pi-box" size="small" severity="secondary" outlined
                @click="$emit('buy', listing.id, 'storage')" />
        </div>
    </div>
</template>

<style scoped>
.shop-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-left: 3px solid var(--_rarity, var(--t-border));
    border-radius: var(--t-radius-md);
    transition: all var(--t-transition-fast);
    position: relative;
}

.shop-card:hover {
    border-color: var(--t-border-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.shop-card--flash {
    background: linear-gradient(135deg, var(--t-bg-card) 92%, rgba(239, 68, 68, 0.08));
}

.shop-card--unique {
    background: linear-gradient(135deg, var(--t-bg-card) 92%, rgba(250, 204, 21, 0.08));
    border-left-width: 4px;
}

.shop-card__badges {
    display: flex;
    gap: var(--t-space-1);
    position: absolute;
    top: var(--t-space-2);
    right: var(--t-space-2);
}

.badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.15rem 0.4rem;
    border-radius: var(--t-radius-sm);
}

.badge--flash {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
}

.badge--unique {
    background: rgba(250, 204, 21, 0.15);
    color: #facc15;
}

.shop-card__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.shop-card__icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.shop-card__info {
    display: flex;
    flex-direction: column;
}

.shop-card__name {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.shop-card__rarity {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}

.shop-card__desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0;
    line-height: 1.4;
}

.shop-card__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.shop-card__category {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: capitalize;
    background: var(--t-bg-muted);
    padding: 0.15rem 0.5rem;
    border-radius: var(--t-radius-sm);
}

.shop-card__price {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.price-original {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-decoration: line-through;
}

.price-current {
    font-size: var(--t-font-size-sm);
    font-weight: 700;
    color: #22c55e;
}

.price-current--sale {
    color: #ef4444;
}

.shop-card__actions {
    display: flex;
    gap: var(--t-space-2);
    justify-content: flex-end;
}
</style>
