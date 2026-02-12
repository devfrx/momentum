<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import { useFormat } from '@renderer/composables/useFormat'
import type { ActiveLoan } from '@renderer/stores/useLoanStore'
import { LOANS } from '@renderer/data/loans'

const props = defineProps<{
    loan: ActiveLoan
    currentTick: number
}>()

defineEmits<{
    repay: [amount: number]
    repayFull: []
    refinance: []
}>()

const { formatCash, formatTime } = useFormat()

const loanDef = computed(() => LOANS.find(l => l.id === props.loan.loanDefId))

const progress = computed(() => {
    if (props.loan.termTicks === 0) return 0 // Revolving has no progress
    return Math.min(100, (props.loan.ticksActive / props.loan.termTicks) * 100)
})

const timeRemaining = computed(() => {
    if (props.loan.termTicks === 0) return null
    const remainingTicks = Math.max(0, props.loan.termTicks - props.loan.ticksActive)
    const seconds = remainingTicks / 10
    return formatTime(seconds)
})

const statusSeverity = computed<'success' | 'warn' | 'danger' | 'info'>(() => {
    if (props.loan.isDefaulted) return 'danger'
    if (props.loan.missedPayments > 0) return 'warn'
    if (props.loan.latePayments > 1) return 'warn'
    return 'success'
})

const statusLabel = computed(() => {
    if (props.loan.isDefaulted) return 'loans.defaulted'
    if (props.loan.missedPayments > 0) return 'loans.behind'
    return 'loans.current_status'
})

const payoffAmount = computed(() => {
    // Calculate total amount needed to pay off
    let amount = props.loan.remaining
    if (loanDef.value && loanDef.value.earlyRepaymentPenalty > 0) {
        if (props.loan.ticksActive < props.loan.termTicks) {
            amount = amount.mul(1 + loanDef.value.earlyRepaymentPenalty)
        }
    }
    return amount
})

const hasEarlyPenalty = computed(() => {
    if (!loanDef.value) return false
    return loanDef.value.earlyRepaymentPenalty > 0 &&
        props.loan.ticksActive < props.loan.termTicks
})
</script>

<template>
    <div class="item-card active-loan-card" :class="{ defaulted: loan.isDefaulted }">
        <div class="item-card-header">
            <div class="item-card-title">
                <AppIcon :icon="loanDef?.icon ?? 'mdi:cash'" class="item-card-icon" />
                <h3 class="item-card-name">{{ loanDef?.name ?? $t('loans.loan') }}</h3>
            </div>
            <Tag :value="$t(statusLabel)" :severity="statusSeverity" />
        </div>

        <div class="loan-balance-section">
            <div class="balance-row">
                <span class="balance-label">{{ $t('loans.remaining_balance') }}</span>
                <span class="balance-value text-danger">{{ formatCash(loan.remaining) }}</span>
            </div>
            <div class="balance-row">
                <span class="balance-label">{{ $t('loans.original_principal') }}</span>
                <span class="balance-value">{{ formatCash(loan.principal) }}</span>
            </div>
            <div class="balance-row">
                <span class="balance-label">{{ $t('loans.interest_paid') }}</span>
                <span class="balance-value text-warning">{{ formatCash(loan.totalInterestPaid) }}</span>
            </div>
        </div>

        <div v-if="loan.termTicks > 0" class="loan-progress">
            <div class="progress-header">
                <span class="progress-label">{{ $t('loans.term_progress') }}</span>
                <span class="progress-time">{{ (timeRemaining ?? $t('loans.revolving')) }} {{ $t('loans.left') }}</span>
            </div>
            <ProgressBar :value="progress" :showValue="false" style="height: 6px" />
        </div>

        <div class="loan-stats">
            <div class="loan-stat-mini">
                <span class="stat-label">{{ $t('loans.rate') }}</span>
                <span class="stat-value">{{ (loan.effectiveRate * 100).toFixed(1) }}%</span>
            </div>
            <div class="loan-stat-mini">
                <span class="stat-label">{{ $t('loans.on_time_stat') }}</span>
                <span class="stat-value text-success">{{ loan.onTimePayments }}</span>
            </div>
            <div class="loan-stat-mini">
                <span class="stat-label">{{ $t('loans.late_stat') }}</span>
                <span class="stat-value" :class="{ 'text-danger': loan.latePayments > 0 }">{{ loan.latePayments
                    }}</span>
            </div>
            <div class="loan-stat-mini">
                <span class="stat-label">{{ $t('loans.missed_stat') }}</span>
                <span class="stat-value" :class="{ 'text-danger': loan.missedPayments > 0 }">{{ loan.missedPayments
                    }}</span>
            </div>
        </div>

        <div v-if="loan.collateralLocked.gt(0)" class="collateral-info">
            <AppIcon icon="mdi:lock" />
            <span>{{ $t('loans.locked_collateral', { amount: formatCash(loan.collateralLocked) }) }}</span>
        </div>

        <div v-if="hasEarlyPenalty" class="early-penalty-warning">
            <AppIcon icon="mdi:information" />
            <span>{{ $t('loans.early_repay_penalty_pct', {
                pct: ((loanDef?.earlyRepaymentPenalty ?? 0) * 100).toFixed(0)
                }) }}</span>
        </div>

        <div class="item-card-actions">
            <Button :label="$t('loans.pay_amount', { amount: '$100' })" icon="pi pi-minus" size="small"
                severity="secondary" :disabled="loan.isDefaulted" @click="$emit('repay', 100)" />
            <Button :label="$t('loans.pay_off', { amount: formatCash(payoffAmount) })" icon="pi pi-check" size="small"
                severity="success" :disabled="loan.isDefaulted" @click="$emit('repayFull')" />
            <Button v-if="loanDef?.canRefinance && !loan.isDefaulted" :label="$t('loans.refinance')"
                icon="pi pi-refresh" size="small" severity="secondary" @click="$emit('refinance')" />
        </div>
    </div>
</template>

<style scoped>
.active-loan-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.loan-balance-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
}

.balance-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.balance-label {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
}

.balance-value {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    font-family: var(--t-font-mono);
}

.loan-progress {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.progress-header {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.loan-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--t-space-2);
}

.loan-stat-mini {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.loan-stat-mini .stat-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.loan-stat-mini .stat-value {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    font-family: var(--t-font-mono);
}

.collateral-info,
.early-penalty-warning {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.early-penalty-warning {
    color: var(--t-warning);
    background: var(--t-warning-muted);
}

.item-card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-2);
    margin-top: auto;
}
</style>
