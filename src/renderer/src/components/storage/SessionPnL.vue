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
import { UButton } from '@renderer/components/ui'
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
            <UButton v-if="hasActivity" variant="text" size="sm" icon="mdi:refresh" @click="storage.resetSession()">{{
                t('storage.session_reset') }}</UButton>
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
    font-weight: var(--t-font-bold);
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
    font-weight: var(--t-font-semibold);
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
    font-weight: var(--t-font-semibold);
    font-variant-numeric: tabular-nums;
}

.cost-value.negative {
    color: var(--t-danger);
}

.cost-value.positive {
    color: var(--t-success);
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
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-sm);
}

.session-pnl__net.positive {
    background: color-mix(in srgb, var(--t-success) 10%, transparent);
    color: var(--t-success);
}

.session-pnl__net.negative {
    background: color-mix(in srgb, var(--t-danger) 10%, transparent);
    color: var(--t-danger);
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
    color: var(--t-text-muted);
}
</style>
