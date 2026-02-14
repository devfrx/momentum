<script setup lang="ts">
/**
 * SessionPnL — Per-session profit & loss breakdown panel.
 *
 * Shows a real-time breakdown of costs (entry fees, bids, appraisals,
 * storage fees) vs. revenue for the current play session. Resets on
 * page reload or manual reset.
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { ZERO } from '@renderer/core/BigNum'

const storage = useStorageStore()
const { formatCash, formatNumber } = useFormat()
const { t } = useI18n()

const s = computed(() => storage.session)
const net = computed(() => storage.sessionNet)
const totalCost = computed(() => storage.sessionTotalCost)
const isPositive = computed(() => net.value.gte(ZERO))

const costRows = computed(() => [
    { label: t('storage.session_entry_fees'), value: s.value.entryFees, icon: 'mdi:ticket' },
    { label: t('storage.session_bids'), value: s.value.bidSpend, icon: 'mdi:gavel' },
    { label: t('storage.session_appraisals'), value: s.value.appraisalSpend, icon: 'mdi:magnify' },
    { label: t('storage.session_storage_fees'), value: s.value.storageFees, icon: 'mdi:warehouse' },
])

const hasActivity = computed(() =>
    s.value.auctionsEntered > 0 || s.value.itemsSold > 0
)
</script>

<template>
    <div class="session-pnl" :class="{ 'session-pnl--positive': isPositive, 'session-pnl--negative': !isPositive }">
        <div class="session-pnl__header">
            <div class="session-pnl__title">
                <AppIcon icon="mdi:chart-box" />
                <span>{{ t('storage.session_pnl_title') }}</span>
            </div>
            <Button v-if="hasActivity" icon="pi pi-refresh" :label="t('storage.session_reset')" text size="small"
                severity="primary" @click="storage.resetSession()" />
        </div>

        <template v-if="hasActivity">
            <!-- Activity row -->
            <div class="session-pnl__activity">
                <span class="activity-chip">
                    <AppIcon icon="mdi:gavel" />
                    {{ formatNumber(s.auctionsEntered) }} {{ t('storage.session_entered') }}
                </span>
                <span class="activity-chip">
                    <AppIcon icon="mdi:trophy" />
                    {{ formatNumber(s.auctionsWon) }} {{ t('storage.session_won') }}
                </span>
                <span class="activity-chip">
                    <AppIcon icon="mdi:tag-check" />
                    {{ formatNumber(s.itemsSold) }} {{ t('storage.session_sold') }}
                </span>
            </div>

            <!-- Cost breakdown -->
            <div class="session-pnl__costs">
                <div v-for="row in costRows" :key="row.label" class="cost-row">
                    <AppIcon :icon="row.icon" class="cost-icon" />
                    <span class="cost-label">{{ row.label }}</span>
                    <span class="cost-value negative">-{{ formatCash(row.value) }}</span>
                </div>
                <div class="cost-row cost-row--total">
                    <AppIcon icon="mdi:minus-circle" class="cost-icon" />
                    <span class="cost-label">{{ t('storage.session_total_cost') }}</span>
                    <span class="cost-value negative">-{{ formatCash(totalCost) }}</span>
                </div>
            </div>

            <!-- Revenue -->
            <div class="session-pnl__revenue">
                <AppIcon icon="mdi:cash-multiple" class="cost-icon" />
                <span class="cost-label">{{ t('storage.session_revenue') }}</span>
                <span class="cost-value positive">+{{ formatCash(s.saleRevenue) }}</span>
            </div>

            <!-- Net P&L -->
            <div class="session-pnl__net" :class="isPositive ? 'positive' : 'negative'">
                <AppIcon :icon="isPositive ? 'mdi:trending-up' : 'mdi:trending-down'" />
                <span class="net-label">{{ t('storage.session_net') }}</span>
                <span class="net-value">{{ isPositive ? '+' : '' }}{{ formatCash(net) }}</span>
            </div>
        </template>

        <!-- No activity yet -->
        <div v-else class="session-pnl__empty">
            <AppIcon icon="mdi:chart-line" class="empty-icon" />
            <span>{{ t('storage.session_empty') }}</span>
        </div>
    </div>
</template>

<style scoped>
.session-pnl {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    box-shadow: var(--t-shadow-sm);
}

.session-pnl__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.session-pnl__title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 700;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.session-pnl__activity {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-2);
}

.activity-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
    padding: 0.2rem 0.5rem;
    border-radius: var(--t-radius-sm);
}

.session-pnl__costs {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.cost-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-xs);
}

.cost-row--total {
    border-top: 1px solid var(--t-border);
    padding-top: 0.3rem;
    margin-top: 0.15rem;
    font-weight: 600;
}

.cost-icon {
    font-size: 0.9rem;
    color: var(--t-text-muted);
    flex-shrink: 0;
}

.cost-label {
    flex: 1;
    color: var(--t-text-secondary);
}

.cost-value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.cost-value.negative {
    color: #ef4444;
}

.cost-value.positive {
    color: #22c55e;
}

.session-pnl__revenue {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-xs);
    padding-top: 0.3rem;
    border-top: 1px solid var(--t-border);
}

.session-pnl__net {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: var(--t-space-2);
    border-radius: var(--t-radius-sm);
    font-weight: 700;
    font-size: var(--t-font-size-sm);
}

.session-pnl__net.positive {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
}

.session-pnl__net.negative {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.net-label {
    flex: 1;
}

.net-value {
    font-variant-numeric: tabular-nums;
}

.session-pnl__empty {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    color: var(--t-text-muted);
    font-size: var(--t-font-size-xs);
    padding: var(--t-space-2) 0;
}

.empty-icon {
    opacity: 0.3;
}
</style>
