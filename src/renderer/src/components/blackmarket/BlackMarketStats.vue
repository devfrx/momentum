<script setup lang="ts">
/**
 * BlackMarketStats — Lifetime statistics panel for the black market.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const bm = useBlackMarketStore()
const { formatCash, formatNumber } = useFormat()
const { t } = useI18n()

const stats = computed(() => [
    { label: t('blackmarket.stat_deals_completed'), value: formatNumber(bm.totalDealsCompleted), icon: 'mdi:check-circle', colorClass: 'positive' },
    { label: t('blackmarket.stat_deals_failed'), value: formatNumber(bm.totalDealsFailed), icon: 'mdi:close-circle', colorClass: 'negative' },
    { label: t('blackmarket.stat_cash_spent'), value: formatCash(bm.totalCashSpent), icon: 'mdi:cash-minus', colorClass: 'negative' },
    { label: t('blackmarket.stat_cash_earned'), value: formatCash(bm.totalCashEarned), icon: 'mdi:cash-plus', colorClass: 'positive' },
    { label: t('blackmarket.stat_net_profit'), value: formatCash(bm.netProfit), icon: 'mdi:chart-line', colorClass: bm.netProfit.gte(0) ? 'positive' : 'negative' },
    { label: t('blackmarket.stat_fines_paid'), value: formatCash(bm.totalFinesPaid), icon: 'mdi:gavel', colorClass: 'negative' },
    { label: t('blackmarket.stat_heat_total'), value: formatNumber(bm.totalHeatAccumulated), icon: 'mdi:fire' },
    { label: t('blackmarket.stat_investigations'), value: formatNumber(bm.totalInvestigations), icon: 'mdi:shield-alert' },
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
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.stat-chip-value.positive {
    color: var(--t-success);
}

.stat-chip-value.negative {
    color: var(--t-danger);
}
</style>
