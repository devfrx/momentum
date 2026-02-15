<script setup lang="ts">
/**
 * ShopStats — Horizontal stats ribbon for the online shop.
 * Mirrors the StorageStats component pattern.
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
    <div class="shop-stats">
        <div class="stat">
            <AppIcon icon="mdi:cart" class="stat-icon" />
            <span class="stat-label">{{ t('shop.stat_bought') }}</span>
            <span class="stat-value">{{ shop.totalItemsBought }}</span>
        </div>
        <div class="stat">
            <AppIcon icon="mdi:cash-minus" class="stat-icon" />
            <span class="stat-label">{{ t('shop.stat_spent') }}</span>
            <span class="stat-value">{{ formatCash(shop.totalCashSpentOnPurchases) }}</span>
        </div>
        <div class="stat">
            <AppIcon icon="mdi:cash-plus" class="stat-icon" />
            <span class="stat-label">{{ t('shop.stat_sales') }}</span>
            <span class="stat-value">{{ formatCash(shop.totalCashFromSales) }}</span>
        </div>
        <div class="stat">
            <AppIcon icon="mdi:chart-line" class="stat-icon" />
            <span class="stat-label">{{ t('shop.stat_profit') }}</span>
            <span class="stat-value"
                :class="{ 'stat-value--positive': shop.shopNetProfit.gte(0), 'stat-value--negative': shop.shopNetProfit.lt(0) }">
                {{ formatCash(shop.shopNetProfit) }}
            </span>
        </div>
        <div class="stat">
            <AppIcon icon="mdi:star-shooting" class="stat-icon" />
            <span class="stat-label">{{ t('shop.stat_uniques') }}</span>
            <span class="stat-value">{{ shop.uniqueItemsBought }}</span>
        </div>
        <div class="stat">
            <AppIcon icon="mdi:flash" class="stat-icon" />
            <span class="stat-label">{{ t('shop.stat_flash_sales') }}</span>
            <span class="stat-value">{{ shop.flashSaleCount }}</span>
        </div>
    </div>
</template>

<style scoped>
.shop-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-4);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
}

.stat {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: var(--t-font-size-xs);
}

.stat-icon {
    color: var(--t-text-muted);
    font-size: 0.9rem;
}

.stat-label {
    color: var(--t-text-muted);
}

.stat-value {
    font-weight: 600;
    color: var(--t-text);
}

.stat-value--positive {
    color: #22c55e;
}

.stat-value--negative {
    color: #ef4444;
}
</style>
