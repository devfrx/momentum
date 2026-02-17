<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { OfflineSummary } from '@renderer/core/OfflineCalc'
import { useFormat } from '@renderer/composables/useFormat'
import { ZERO } from '@renderer/core/BigNum'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UModal, UButton } from '@renderer/components/ui'

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
    <UModal :modelValue="true" @update:modelValue="emit('close')" :title="t('offline.welcome_back')" icon="mdi:clock-outline" size="sm" :closable="false">
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

                <template #footer>
                    <UButton variant="primary" block icon="mdi:check" @click="emit('close')">
                        {{ t('offline.collect') }}
                    </UButton>
                </template>
    </UModal>
</template>

<style scoped>
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
    font-weight: var(--t-font-semibold);
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
    font-weight: var(--t-font-semibold);
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
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.total-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-success);
}
</style>
