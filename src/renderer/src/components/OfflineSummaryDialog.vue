<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { OfflineSummary } from '@renderer/core/OfflineCalc'
import { useFormat } from '@renderer/composables/useFormat'
import { ZERO } from '@renderer/core/BigNum'
import AppIcon from '@renderer/components/AppIcon.vue'

const props = defineProps<{
    summary: OfflineSummary
}>()

const emit = defineEmits<{
    close: []
}>()

const { formatCash, formatRate } = useFormat()
const { t } = useI18n()

const incomeLines = computed(() => {
    const lines: { label: string; icon: string; value: string; positive: boolean }[] = []
    const s = props.summary
    if (s.jobIncome.gt(ZERO)) {
        lines.push({ label: t('offline.job_income'), icon: 'mdi:briefcase', value: formatCash(s.jobIncome), positive: true })
    }
    if (s.businessIncome.gt(ZERO)) {
        lines.push({ label: t('offline.business_profit'), icon: 'mdi:store', value: formatCash(s.businessIncome), positive: true })
    }
    if (s.realEstateIncome.gt(ZERO)) {
        lines.push({ label: t('offline.rent_income'), icon: 'mdi:home-city', value: formatCash(s.realEstateIncome), positive: true })
    }
    if (s.dividendIncome.gt(ZERO)) {
        lines.push({ label: t('offline.dividends'), icon: 'mdi:chart-line', value: formatCash(s.dividendIncome), positive: true })
    }
    if (s.depositInterest.gt(ZERO)) {
        lines.push({ label: t('offline.deposit_interest'), icon: 'mdi:piggy-bank', value: '+' + formatCash(s.depositInterest), positive: true })
    }
    if (s.loanInterestPaid.gt(ZERO)) {
        lines.push({ label: t('offline.loan_interest'), icon: 'mdi:bank-minus', value: '-' + formatCash(s.loanInterestPaid), positive: false })
    }
    return lines
})
</script>

<template>
    <Teleport to="body">
        <div class="offline-overlay" @click.self="emit('close')">
            <div class="offline-dialog">
                <div class="offline-header">
                    <AppIcon icon="mdi:clock-outline" class="header-icon" />
                    <h2>{{ t('offline.welcome_back') }}</h2>
                </div>

                <div class="offline-time">
                    <span class="away-label">{{ t('offline.time_away') }}</span>
                    <span class="away-value">{{ summary.timeAwayFormatted }}</span>
                </div>

                <div class="offline-efficiency">
                    <span>{{ t('offline.efficiency') }}</span>
                    <span class="eff-value">{{ formatRate(summary.efficiency * 100, 0) }}</span>
                </div>

                <div class="offline-breakdown">
                    <div v-if="incomeLines.length === 0" class="no-income">
                        {{ t('offline.no_income') }}
                    </div>
                    <div v-for="line in incomeLines" :key="line.label" class="income-line"
                        :class="{ negative: !line.positive }">
                        <div class="line-left">
                            <AppIcon :icon="line.icon" class="line-icon" />
                            <span>{{ line.label }}</span>
                        </div>
                        <span class="line-value" :class="{ success: line.positive, danger: !line.positive }">
                            {{ line.value }}
                        </span>
                    </div>
                </div>

                <div class="offline-total">
                    <span>{{ t('offline.total_earned') }}</span>
                    <span class="total-value">{{ formatCash(summary.cashEarned) }}</span>
                </div>

                <button class="collect-btn" @click="emit('close')">
                    <AppIcon icon="mdi:check" />
                    {{ t('offline.collect') }}
                </button>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.offline-overlay {
    position: fixed;
    inset: 0;
    background: var(--t-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
}

.offline-dialog {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: 1.5rem;
    width: 380px;
    max-width: 95vw;
    box-shadow: 0 20px 60px var(--t-overlay-light);
}

.offline-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.header-icon {
    font-size: 1.5rem;
    color: var(--t-accent);
}

.offline-header h2 {
    font-size: var(--t-font-size-lg);
    font-weight: 700;
    color: var(--t-text);
    margin: 0;
}

.offline-time {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    margin-bottom: 0.5rem;
}

.away-label {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.away-value {
    font-family: var(--t-font-mono);
    font-weight: 600;
    color: var(--t-text);
}

.offline-efficiency {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0.75rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    margin-bottom: 0.75rem;
}

.eff-value {
    font-family: var(--t-font-mono);
    color: var(--t-text-secondary);
}

.offline-breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
}

.income-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.75rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-sm);
}

.line-left {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--t-text-secondary);
}

.line-icon {
    font-size: 0.95rem;
    color: var(--t-text-muted);
}

.no-income {
    text-align: center;
    padding: 0.5rem 0.75rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    font-style: italic;
}

.line-value {
    font-family: var(--t-font-mono);
    font-weight: 600;
}

.line-value.success {
    color: var(--t-success);
}

.line-value.danger {
    color: var(--t-danger);
}

.offline-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.75rem;
    border-top: 1px solid var(--t-border);
    margin-bottom: 1rem;
}

.offline-total span:first-child {
    font-weight: 600;
    color: var(--t-text);
}

.total-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: 700;
    color: var(--t-success);
}

.collect-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    background: var(--t-accent);
    color: var(--t-bg-base);
    border: none;
    border-radius: var(--t-radius-md);
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    cursor: pointer;
    transition: opacity 0.15s;
}

.collect-btn:hover {
    opacity: 0.9;
}
</style>
