<script setup lang="ts">
/**
 * StorageStats — Statistics ribbon for storage wars.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const storage = useStorageStore()
const { formatCash, formatNumber } = useFormat()
const { t } = useI18n()

const stats = computed(() => [
    { label: t('storage.auctions_won'), value: formatNumber(storage.totalAuctionsWon), icon: 'mdi:trophy', colorClass: 'positive' },
    { label: t('storage.items_sold'), value: formatNumber(storage.totalItemsSold), icon: 'mdi:tag-check' },
    { label: t('storage.revenue'), value: formatCash(storage.totalSaleRevenue), icon: 'mdi:cash-multiple', colorClass: 'positive' },
    { label: t('storage.net_profit_label'), value: formatCash(storage.netProfit), icon: 'mdi:chart-line', colorClass: storage.netProfit.gte(0) ? 'positive' : 'negative' },
    { label: t('storage.biggest_flip'), value: formatCash(storage.biggestFlip), icon: 'mdi:star-shooting' },
])
</script>

<template>
    <div class="stats-bar">
        <div v-for="stat in stats" :key="stat.label" class="stat-chip">
            <AppIcon :icon="stat.icon" class="stat-chip-icon" />
            <span class="stat-chip-label">{{ stat.label }}</span>
            <span class="stat-chip-value" :class="stat.colorClass">{{ stat.value }}</span>
        </div>
    </div>
</template>

<style scoped>
.stats-bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-3);
}

.stat-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.85rem;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    font-size: var(--t-font-size-sm);
    transition: border-color var(--t-transition-normal);
}

.stat-chip:hover {
    border-color: var(--t-border-hover);
}

.stat-chip-icon {
    font-size: 1rem;
    color: var(--t-text-muted);
}

.stat-chip-label {
    color: var(--t-text-muted);
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-chip-value {
    font-weight: 600;
    color: var(--t-text);
}

.stat-chip-value.positive {
    color: #22c55e;
}

.stat-chip-value.negative {
    color: #ef4444;
}
</style>
