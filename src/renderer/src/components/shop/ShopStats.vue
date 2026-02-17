<script setup lang="ts">
/**
 * ShopStats — KPI dashboard strip for the online shop.
 * Compact metric cards with icon accents, inspired by Shopify admin.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { useShopStore } from '@renderer/stores/useShopStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'

const shop = useShopStore()
const { formatCash } = useFormat()
const { t } = useI18n()
</script>

<template>
    <div class="kpi-strip">
        <!-- Primary metrics row -->
        <div class="kpi-card kpi-card--wide">
            <div class="kpi-icon-wrap kpi-icon-wrap--profit">
                <AppIcon icon="mdi:chart-line" />
            </div>
            <div class="kpi-body">
                <span class="kpi-label">{{ t('shop.stat_profit') }}</span>
                <span class="kpi-value"
                    :class="{ 'kpi-value--positive': shop.shopNetProfit.gte(0), 'kpi-value--negative': shop.shopNetProfit.lt(0) }">
                    {{ formatCash(shop.shopNetProfit) }}
                </span>
            </div>
        </div>

        <div class="kpi-card">
            <div class="kpi-icon-wrap kpi-icon-wrap--spent">
                <AppIcon icon="mdi:cart-arrow-down" />
            </div>
            <div class="kpi-body">
                <span class="kpi-label">{{ t('shop.stat_spent') }}</span>
                <span class="kpi-value">{{ formatCash(shop.totalCashSpentOnPurchases) }}</span>
            </div>
        </div>

        <div class="kpi-card">
            <div class="kpi-icon-wrap kpi-icon-wrap--sales">
                <AppIcon icon="mdi:cash-register" />
            </div>
            <div class="kpi-body">
                <span class="kpi-label">{{ t('shop.stat_sales') }}</span>
                <span class="kpi-value">{{ formatCash(shop.totalCashFromSales) }}</span>
            </div>
        </div>

        <div class="kpi-card">
            <div class="kpi-icon-wrap kpi-icon-wrap--auctions">
                <AppIcon icon="mdi:gavel" />
            </div>
            <div class="kpi-body">
                <span class="kpi-label">{{ t('shop.stat_auction_revenue') }}</span>
                <span class="kpi-value">{{ formatCash(shop.totalAuctionRevenue) }}</span>
            </div>
        </div>

        <!-- Secondary inline metrics -->
        <div class="kpi-secondary">
            <span class="kpi-pill">
                <AppIcon icon="mdi:cart" class="kpi-pill__icon" />
                {{ shop.totalItemsBought }} {{ t('shop.stat_bought') }}
            </span>
            <span class="kpi-pill">
                <AppIcon icon="mdi:star-shooting" class="kpi-pill__icon" />
                {{ shop.uniqueItemsBought }} {{ t('shop.stat_uniques') }}
            </span>
            <span class="kpi-pill">
                <AppIcon icon="mdi:flash" class="kpi-pill__icon" />
                {{ shop.flashSaleCount }} {{ t('shop.stat_flash_sales') }}
            </span>
            <span class="kpi-pill">
                <AppIcon icon="mdi:tools" class="kpi-pill__icon" />
                {{ shop.totalItemsRestored }} {{ t('shop.stat_restored') }}
            </span>
            <span class="kpi-pill">
                <AppIcon icon="mdi:gavel" class="kpi-pill__icon" />
                {{ shop.totalAuctionsCompleted }} {{ t('shop.stat_auctions') }}
            </span>
            <span v-if="shop.bestDeal.gt(0)" class="kpi-pill kpi-pill--highlight">
                <AppIcon icon="mdi:trophy" class="kpi-pill__icon" />
                {{ t('shop.stat_best_deal') }}: {{ formatCash(shop.bestDeal) }}
            </span>
        </div>
    </div>
</template>

<style scoped>
.kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--t-space-3);
}

.kpi-card {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    min-width: 0;
}

.kpi-card--wide {
    /* reserved for future grid-column span */
    min-width: 0;
}

.kpi-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--t-radius-sm);
    font-size: 1.1rem;
    flex-shrink: 0;
}

.kpi-icon-wrap--profit {
    background: color-mix(in srgb, var(--t-success) 10%, transparent);
    color: var(--t-success);
}

.kpi-icon-wrap--spent {
    background: color-mix(in srgb, var(--t-danger) 10%, transparent);
    color: var(--t-danger);
}

.kpi-icon-wrap--sales {
    background: color-mix(in srgb, var(--t-blue) 10%, transparent);
    color: var(--t-blue);
}

.kpi-icon-wrap--auctions {
    background: color-mix(in srgb, var(--t-purple) 10%, transparent);
    color: var(--t-purple);
}

.kpi-body {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.kpi-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.kpi-value {
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    line-height: 1.3;
    white-space: nowrap;
}

.kpi-value--positive {
    color: var(--t-success);
}

.kpi-value--negative {
    color: var(--t-danger);
}

/* Secondary pills row */
.kpi-secondary {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-2);
    padding: var(--t-space-2) 0 0;
}

.kpi-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-full);
    white-space: nowrap;
}

.kpi-pill__icon {
    font-size: 0.75rem;
    color: var(--t-text-muted);
}

.kpi-pill--highlight {
    background: color-mix(in srgb, var(--t-gold) 10%, transparent);
    border-color: color-mix(in srgb, var(--t-gold) 30%, transparent);
    color: var(--t-gold-hover);
}

.kpi-pill--highlight .kpi-pill__icon {
    color: var(--t-gold-hover);
}

/* Responsive: stack on narrow screens */
@media (max-width: 900px) {
    .kpi-strip {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 500px) {
    .kpi-strip {
        grid-template-columns: 1fr;
    }
}
</style>
