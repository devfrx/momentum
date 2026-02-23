<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBankingStore, CATEGORY_ICONS, type TransactionCategory } from '@renderer/stores/useBankingStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'

const banking = useBankingStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const filter = ref<'all' | 'income' | 'expense'>('all')

const filteredTransactions = computed(() => {
    const txs = banking.recentTransactions
    if (filter.value === 'income') return txs.filter(tx => tx.amount.gt(0))
    if (filter.value === 'expense') return txs.filter(tx => tx.amount.lt(0))
    return txs
})

/** Group transactions by date */
const groupedTransactions = computed(() => {
    const groups: { label: string; transactions: typeof filteredTransactions.value }[] = []
    const map = new Map<string, typeof filteredTransactions.value>()

    for (const tx of filteredTransactions.value) {
        const d = new Date(tx.timestamp)
        const key = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(tx)
    }

    for (const [label, transactions] of map) {
        groups.push({ label, transactions })
    }

    return groups
})

function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function categoryColor(category: TransactionCategory): string {
    const colors: Record<TransactionCategory, string> = {
        salary: 'var(--t-success)',
        business: 'var(--t-info)',
        investment: 'var(--t-accent)',
        real_estate: 'var(--t-purple)',
        deposit: 'var(--t-cyan)',
        loan: 'var(--t-warning)',
        shop: 'var(--t-orange)',
        storage: 'var(--t-text-secondary)',
        blackmarket: 'var(--t-danger)',
        gambling: 'var(--t-gold)',
        prestige: 'var(--t-accent)',
        achievement: 'var(--t-gold)',
        event: 'var(--t-orange)',
        upgrade: 'var(--t-info)',
        other: 'var(--t-text-muted)',
    }
    return colors[category] ?? 'var(--t-text-muted)'
}
</script>

<template>
    <div class="tx-panel">
        <!-- Header -->
        <div class="tx-header">
            <h3 class="tx-title">
                <AppIcon icon="mdi:swap-vertical" class="tx-title-icon" />
                {{ $t('banking.transactions') }}
            </h3>
            <div class="tx-filters">
                <button class="tx-filter" :class="{ active: filter === 'all' }" @click="filter = 'all'">
                    {{ $t('banking.filter_all') }}
                </button>
                <button class="tx-filter" :class="{ active: filter === 'income' }" @click="filter = 'income'">
                    {{ $t('banking.filter_income') }}
                </button>
                <button class="tx-filter" :class="{ active: filter === 'expense' }" @click="filter = 'expense'">
                    {{ $t('banking.filter_expenses') }}
                </button>
            </div>
        </div>

        <!-- Transaction Groups -->
        <div class="tx-list" v-if="groupedTransactions.length > 0">
            <div v-for="group in groupedTransactions" :key="group.label" class="tx-group">
                <div class="tx-date-label">{{ group.label }}</div>
                <div v-for="tx in group.transactions" :key="tx.id" class="tx-row">
                    <div class="tx-icon-wrap" :style="{ color: categoryColor(tx.category) }">
                        <AppIcon :icon="CATEGORY_ICONS[tx.category]" class="tx-icon" />
                    </div>
                    <div class="tx-info">
                        <span class="tx-desc">
                            {{ tx.descriptionParams
                                ? $t(tx.descriptionKey, tx.descriptionParams)
                                : $t(tx.descriptionKey) }}
                        </span>
                        <span class="tx-time">{{ formatTime(tx.timestamp) }}</span>
                    </div>
                    <div class="tx-amount" :class="{ positive: tx.amount.gt(0), negative: tx.amount.lt(0) }">
                        {{ tx.amount.gt(0) ? '+' : '' }}{{ formatCash(tx.amount) }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else class="tx-empty">
            <AppIcon icon="mdi:receipt-text-clock-outline" class="tx-empty-icon" />
            <span>{{ $t('banking.no_transactions') }}</span>
        </div>
    </div>
</template>

<style scoped>
.tx-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.tx-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--t-space-3);
    flex-wrap: wrap;
    gap: var(--t-space-2);
}

.tx-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    margin: 0;
}

.tx-title-icon {
    color: var(--t-text-muted);
    font-size: 1.1rem;
}

.tx-filters {
    display: flex;
    gap: 2px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    padding: 2px;
}

.tx-filter {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-medium);
    padding: 0.25rem 0.65rem;
    border: none;
    background: none;
    color: var(--t-text-muted);
    cursor: pointer;
    border-radius: var(--t-radius-sm);
    transition: all var(--t-transition-fast);
    white-space: nowrap;
}

.tx-filter.active {
    background: var(--t-bg-card);
    color: var(--t-text);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tx-filter:hover:not(.active) {
    color: var(--t-text-secondary);
}

/* ═══ Transaction List ═══ */
.tx-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    overflow-y: auto;
    max-height: 400px;
    padding-right: var(--t-space-1);
}

.tx-list::-webkit-scrollbar {
    width: 4px;
}

.tx-list::-webkit-scrollbar-track {
    background: transparent;
}

.tx-list::-webkit-scrollbar-thumb {
    background: var(--t-border);
    border-radius: 2px;
}

.tx-group {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.tx-date-label {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0 var(--t-space-1);
    margin-bottom: var(--t-space-1);
}

.tx-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-2) var(--t-space-3);
    border-radius: var(--t-radius-md);
    transition: background var(--t-transition-fast);
}

.tx-row:hover {
    background: var(--t-bg-muted);
}

.tx-icon-wrap {
    width: 34px;
    height: 34px;
    border-radius: var(--t-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--t-bg-muted);
}

.tx-icon {
    font-size: 1rem;
}

.tx-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.tx-desc {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-medium);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tx-time {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.tx-amount {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    white-space: nowrap;
    flex-shrink: 0;
}

.tx-amount.positive {
    color: var(--t-success);
}

.tx-amount.negative {
    color: var(--t-danger);
}

/* ═══ Empty ═══ */
.tx-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-8) var(--t-space-4);
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    gap: var(--t-space-2);
}

.tx-empty-icon {
    font-size: 2rem;
    opacity: 0.4;
}
</style>
