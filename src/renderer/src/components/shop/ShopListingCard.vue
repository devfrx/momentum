<script setup lang="ts">
/**
 * ShopListingCard — E-commerce product card.
 * Clean layout inspired by Amazon/StockX product tiles:
 * image area → badges bar → name/rarity → meta row → price → actions.
 * No absolute positioning — everything flows naturally.
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { rarityCssVar } from '@renderer/data/rarity'
import type { ShopListing } from '@renderer/data/shop/items'
import { useShopStore } from '@renderer/stores/useShopStore'
import {
    CONDITION_ICONS,
    CONDITION_COLORS,
} from '@renderer/data/shop/restoration'

const props = defineProps<{
    listing: ShopListing
}>()

defineEmits<{
    buy: [listingId: string, destination: 'vault' | 'storage']
}>()

const shop = useShopStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const condition = computed(() => props.listing.item.condition ?? 'good')
const demandMult = computed(() => shop.getDemandMultiplier(props.listing.item.category))
</script>

<template>
    <div class="card" :style="{ '--_rarity': rarityCssVar(listing.item.rarity) }"
        :class="{ 'card--flash': listing.flashSale, 'card--unique': listing.unique }">

        <!-- ── Icon / Image area ───────────────────────────── -->
        <div class="card__visual">
            <AppIcon :icon="listing.item.icon" class="card__icon"
                :style="{ color: rarityCssVar(listing.item.rarity) }" />
            <!-- Flash sale ribbon -->
            <span v-if="listing.flashSale" class="card__ribbon">
                <AppIcon icon="mdi:flash" /> -{{ Math.round(listing.discount * 100) }}%
            </span>
        </div>

        <!-- ── Tags row — condition · unique · demand ──────── -->
        <div class="card__tags">
            <span class="tag tag--condition"
                :style="{ color: CONDITION_COLORS[condition], borderColor: CONDITION_COLORS[condition] + '40' }">
                <AppIcon :icon="CONDITION_ICONS[condition]" />
                {{ t(`shop.condition_${condition}`) }}
            </span>
            <span v-if="listing.unique" class="tag tag--unique">
                <AppIcon icon="mdi:star-shooting" /> {{ t('shop.unique') }}
            </span>
            <span v-if="demandMult >= 1.4" class="tag tag--trending">
                <AppIcon icon="mdi:trending-up" /> {{ t('shop.demand_trending') }}
            </span>
            <span v-else-if="demandMult <= 0.8" class="tag tag--cold">
                <AppIcon icon="mdi:trending-down" /> {{ t('shop.demand_cold') }}
            </span>
        </div>

        <!-- ── Title + Rarity ──────────────────────────────── -->
        <div class="card__title-block">
            <span class="card__name">{{ listing.item.name }}</span>
            <span class="card__rarity" :style="{ color: rarityCssVar(listing.item.rarity) }">
                {{ listing.item.rarity }}
            </span>
        </div>

        <!-- ── Description ─────────────────────────────────── -->
        <p class="card__desc">{{ listing.item.description }}</p>

        <!-- ── Category pill ───────────────────────────────── -->
        <span class="card__category">{{ listing.item.category }}</span>

        <!-- ── Price block ─────────────────────────────────── -->
        <div class="card__price-block">
            <span v-if="listing.flashSale" class="price-original">{{ formatCash(listing.basePrice) }}</span>
            <span class="price-main" :class="{ 'price-main--sale': listing.flashSale }">
                {{ formatCash(listing.price) }}
            </span>
        </div>

        <!-- ── Buy actions ─────────────────────────────────── -->
        <div class="card__actions">
            <Button class="card__buy-btn" size="small" @click="$emit('buy', listing.id, 'vault')">
                <AppIcon icon="mdi:safe-square-outline" />
                <span>{{ t('shop.buy_to_vault') }}</span>
            </Button>
            <Button class="card__buy-btn card__buy-btn--secondary" size="small" severity="secondary" text
                @click="$emit('buy', listing.id, 'storage')">
                <AppIcon icon="mdi:package-variant" />
                <span>{{ t('shop.buy_to_storage') }}</span>
            </Button>
        </div>
    </div>
</template>

<style scoped>
/* ── Card shell ──────────────────────────────────────────── */
.card {
    display: flex;
    flex-direction: column;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    overflow: hidden;
    transition: border-color var(--t-transition-fast),
        box-shadow var(--t-transition-fast),
        transform var(--t-transition-fast);
}

.card:hover {
    border-color: var(--t-border-hover);
    transform: translateY(-2px);
    box-shadow: var(--t-shadow-md);
}

.card--flash {
    border-color: rgba(239, 68, 68, 0.25);
}

.card--unique {
    border-color: rgba(250, 204, 21, 0.25);
}

/* ── Visual area (icon centered) ─────────────────────────── */
.card__visual {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-5) var(--t-space-4);
    background: var(--t-bg-muted);
    border-bottom: 1px solid var(--t-border);
}

.card__icon {
    font-size: 2.5rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

.card__ribbon {
    position: absolute;
    top: var(--t-space-2);
    right: var(--t-space-2);
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.5rem;
    font-size: 0.6rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #fff;
    background: #ef4444;
    border-radius: var(--t-radius-sm);
    letter-spacing: 0.04em;
}

/* ── Tag row ─────────────────────────────────────────────── */
.card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding: var(--t-space-2) var(--t-space-3) 0;
}

.tag {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.55rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.15rem 0.45rem;
    border-radius: var(--t-radius-sm);
    line-height: 1.3;
}

.tag--condition {
    background: rgba(128, 128, 128, 0.08);
    border: 1px solid;
}

.tag--unique {
    background: rgba(250, 204, 21, 0.1);
    color: #facc15;
}

.tag--trending {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
}

.tag--cold {
    background: rgba(148, 163, 184, 0.08);
    color: #94a3b8;
}

/* ── Title block ─────────────────────────────────────────── */
.card__title-block {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: var(--t-space-2) var(--t-space-3) 0;
}

.card__name {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card__rarity {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}

/* ── Description ─────────────────────────────────────────── */
.card__desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0;
    padding: var(--t-space-1) var(--t-space-3) 0;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* ── Category pill ───────────────────────────────────────── */
.card__category {
    display: inline-flex;
    align-self: flex-start;
    margin: var(--t-space-2) var(--t-space-3) 0;
    font-size: 0.6rem;
    color: var(--t-text-muted);
    text-transform: capitalize;
    background: var(--t-bg-muted);
    padding: 0.15rem 0.5rem;
    border-radius: 100px;
}

/* ── Price ────────────────────────────────────────────────── */
.card__price-block {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    padding: var(--t-space-2) var(--t-space-3) 0;
    margin-top: auto;
}

.price-original {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-decoration: line-through;
}

.price-main {
    font-size: var(--t-font-size-lg);
    font-weight: 800;
    color: var(--t-text);
    font-variant-numeric: tabular-nums;
}

.price-main--sale {
    color: #ef4444;
}

/* ── Actions ─────────────────────────────────────────────── */
.card__actions {
    display: flex;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
}

.card__buy-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    font-size: var(--t-font-size-xs) !important;
    font-weight: 600;
    padding: var(--t-space-2) var(--t-space-2) !important;
    white-space: nowrap;
}

.card__buy-btn--secondary {
    flex: 0 1 auto;
    color: var(--t-text-secondary) !important;
}
</style>
