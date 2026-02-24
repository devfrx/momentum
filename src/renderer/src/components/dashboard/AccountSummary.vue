<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useJobStore } from '@renderer/stores/useJobStore'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { useDepositStore } from '@renderer/stores/useDepositStore'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { useBankingStore } from '@renderer/stores/useBankingStore'
import { useFormat } from '@renderer/composables/useFormat'
import { ZERO, add, sub } from '@renderer/core/BigNum'
import AppIcon from '@renderer/components/AppIcon.vue'

const player = usePlayerStore()
const business = useBusinessStore()
const jobStore = useJobStore()
const realEstate = useRealEstateStore()
const deposits = useDepositStore()
const loans = useLoanStore()
const banking = useBankingStore()
const { formatCash } = useFormat()

const totalIncomePerSecond = computed(() => {
    let total = ZERO
    total = add(total, business.profitPerSecond)
    total = add(total, jobStore.jobIncomePerSecond)
    total = add(total, realEstate.rentPerSecond)
    total = add(total, deposits.interestPerSecond)
    return total
})

const totalExpensePerSecond = computed(() => {
    return loans.totalInterestPerSecond
})

const netFlowPerSecond = computed(() => {
    return sub(totalIncomePerSecond.value, totalExpensePerSecond.value)
})

const summaryItems = computed(() => [
    {
        icon: 'mdi:scale-balance',
        label: 'banking.net_worth',
        value: formatCash(player.netWorth),
        color: 'var(--t-text)',
    },
    {
        icon: 'mdi:arrow-down-bold-circle',
        label: 'banking.total_income',
        value: formatCash(banking.totalIncome),
        color: 'var(--t-success)',
    },
    {
        icon: 'mdi:arrow-up-bold-circle',
        label: 'banking.total_expenses',
        value: formatCash(banking.totalExpenses),
        color: 'var(--t-danger)',
    },
    {
        icon: 'mdi:bank-transfer-out',
        label: 'banking.total_debt',
        value: formatCash(loans.totalDebt),
        color: loans.totalDebt.gt(0) ? 'var(--t-warning)' : 'var(--t-text-muted)',
    },
])

const incomeBreakdown = computed(() => [
    { label: 'banking.income_business', value: business.profitPerSecond, icon: 'mdi:store', color: 'var(--t-info)' },
    { label: 'banking.income_jobs', value: jobStore.jobIncomePerSecond, icon: 'mdi:briefcase', color: 'var(--t-success)' },
    { label: 'banking.income_realestate', value: realEstate.rentPerSecond, icon: 'mdi:home-city', color: 'var(--t-purple)' },
    { label: 'banking.income_deposits', value: deposits.interestPerSecond, icon: 'mdi:piggy-bank', color: 'var(--t-cyan)' },
].filter(item => item.value.gt(0)))
</script>

<template>
    <div class="account-summary">
        <!-- ═══ Income / Expense Flow ═══ -->
        <div class="flow-section">
            <div class="flow-card income">
                <div class="flow-header">
                    <AppIcon icon="mdi:trending-up" class="flow-icon" />
                    <span class="flow-label">{{ $t('banking.income_per_sec') }}</span>
                </div>
                <span class="flow-value"
                    :class="{ positive: totalIncomePerSecond.gte(0), negative: totalIncomePerSecond.lt(0) }">{{
                        totalIncomePerSecond.gte(0) ? '+' : '' }}{{ formatCash(totalIncomePerSecond) }}/s</span>
            </div>
            <div class="flow-card expense">
                <div class="flow-header">
                    <AppIcon icon="mdi:trending-down" class="flow-icon" />
                    <span class="flow-label">{{ $t('banking.expenses_per_sec') }}</span>
                </div>
                <span class="flow-value negative">-{{ formatCash(totalExpensePerSecond) }}/s</span>
            </div>
            <div class="flow-card net">
                <div class="flow-header">
                    <AppIcon icon="mdi:chart-timeline-variant" class="flow-icon" />
                    <span class="flow-label">{{ $t('banking.net_flow') }}</span>
                </div>
                <span class="flow-value"
                    :class="{ positive: netFlowPerSecond.gte(0), negative: netFlowPerSecond.lt(0) }">
                    {{ netFlowPerSecond.gte(0) ? '+' : '' }}{{ formatCash(netFlowPerSecond) }}/s
                </span>
            </div>
        </div>

        <!-- ═══ Dual Balance ═══ -->
        <div class="dual-balance">
            <div class="dual-bal-item">
                <div class="dual-bal-header">
                    <AppIcon icon="mdi:credit-card" class="dual-bal-icon" />
                    <span class="dual-bal-label">{{ $t('banking.card_balance') }}</span>
                </div>
                <span class="dual-bal-value">{{ formatCash(player.cardBalance) }}</span>
            </div>
            <div class="dual-bal-item wallet-item">
                <div class="dual-bal-header">
                    <AppIcon icon="mdi:wallet" class="dual-bal-icon wallet-icon-color" />
                    <span class="dual-bal-label">{{ $t('banking.wallet_cash') }}</span>
                </div>
                <span class="dual-bal-value wallet-color">{{ formatCash(player.cash) }}</span>
            </div>
        </div>

        <!-- ═══ Summary Grid ═══ -->
        <div class="summary-grid">
            <div v-for="item in summaryItems" :key="item.label" class="summary-item">
                <div class="summary-icon-wrap" :style="{ color: item.color }">
                    <AppIcon :icon="item.icon" class="summary-icon" />
                </div>
                <div class="summary-text">
                    <span class="summary-value" :style="{ color: item.color }">{{ item.value }}</span>
                    <span class="summary-label">{{ $t(item.label) }}</span>
                </div>
            </div>
        </div>

        <!-- ═══ Income Breakdown ═══ -->
        <div v-if="incomeBreakdown.length > 0" class="breakdown-section">
            <h4 class="breakdown-title">
                <AppIcon icon="mdi:chart-pie" class="breakdown-title-icon" />
                {{ $t('banking.income_sources') }}
            </h4>
            <div class="breakdown-list">
                <div v-for="item in incomeBreakdown" :key="item.label" class="breakdown-row">
                    <div class="breakdown-dot" :style="{ background: item.color }" />
                    <AppIcon :icon="item.icon" class="breakdown-icon" :style="{ color: item.color }" />
                    <span class="breakdown-label">{{ $t(item.label) }}</span>
                    <span class="breakdown-value">{{ formatCash(item.value) }}/s</span>
                </div>
            </div>
        </div>

        <!-- ═══ Stats Row ═══ -->
        <div class="stats-row">
            <div class="stat-mini">
                <span class="stat-mini-value">{{ player.level }}</span>
                <span class="stat-mini-label">{{ $t('banking.level') }}</span>
            </div>
            <div class="stat-mini">
                <span class="stat-mini-value">{{ formatCash(player.totalCashEarned) }}</span>
                <span class="stat-mini-label">{{ $t('banking.lifetime_earnings') }}</span>
            </div>
            <div class="stat-mini">
                <span class="stat-mini-value">{{ banking.lifetimeTransactions }}</span>
                <span class="stat-mini-label">{{ $t('banking.total_transactions') }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.account-summary {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

/* ═══ Flow Cards ═══ */
.flow-section {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--t-space-3);
}

.flow-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.flow-header {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.flow-icon {
    font-size: 0.9rem;
    color: var(--t-text-muted);
}

.flow-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: var(--t-font-medium);
}

.flow-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
}

.flow-value.positive {
    color: var(--t-success);
}

.flow-value.negative {
    color: var(--t-danger);
}

/* ═══ Summary Grid ═══ */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--t-space-3);
}

.summary-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    transition: border-color var(--t-transition-normal);
}

.summary-item:hover {
    border-color: var(--t-border-hover);
}

.summary-icon-wrap {
    width: 34px;
    height: 34px;
    border-radius: var(--t-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--t-bg-muted);
}

.summary-icon {
    font-size: 1.1rem;
}

.summary-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.summary-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.summary-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-weight: var(--t-font-medium);
}

/* ═══ Income Breakdown ═══ */
.breakdown-section {
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.breakdown-title {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    margin: 0 0 var(--t-space-3);
}

.breakdown-title-icon {
    font-size: 0.9rem;
    color: var(--t-text-muted);
}

.breakdown-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.breakdown-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.breakdown-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.breakdown-icon {
    font-size: 0.9rem;
    flex-shrink: 0;
}

.breakdown-label {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    flex: 1;
}

.breakdown-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

/* ═══ Stats Row ═══ */
.stats-row {
    display: flex;
    gap: var(--t-space-3);
}

.stat-mini {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.stat-mini-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.stat-mini-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: var(--t-font-medium);
    text-align: center;
}

/* ═══ Dual Balance ═══ */
.dual-balance {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    background: var(--t-bg-elevated);
    border-radius: var(--t-radius-md);
}

.dual-bal-item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.dual-bal-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.dual-bal-icon {
    font-size: 0.8rem;
    color: var(--t-text-muted);
}

.wallet-icon-color {
    color: var(--t-success);
}

.dual-bal-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.dual-bal-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.wallet-color {
    color: var(--t-success);
}

/* ═══ Responsive ═══ */
@media (max-width: 700px) {
    .flow-section {
        grid-template-columns: 1fr;
    }
}
</style>
