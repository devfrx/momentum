<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Tag from 'primevue/tag'
import { useFormat } from '@renderer/composables/useFormat'
import { RISK_LEVEL_META, type LoanDef } from '@renderer/data/loans'

const props = defineProps<{
    loan: LoanDef
    effectiveRate: number
    maxApproved: number
    approved: boolean
    reason?: string
    disabled?: boolean
}>()

defineEmits<{
    apply: []
}>()

const { formatCash, formatTime } = useFormat()

const riskMeta = computed(() => RISK_LEVEL_META[props.loan.riskLevel])

const termDisplay = computed(() => {
    if (props.loan.termTicks === 0) return null
    // Convert ticks to readable time (10 ticks = 1 second)
    const seconds = props.loan.termTicks / 10
    return formatTime(seconds)
})

const rateDisplay = computed(() => {
    return `${(props.effectiveRate * 100).toFixed(1)}%`
})

const tagSeverity = computed<'success' | 'warn' | 'danger' | 'info'>(() => {
    const risk = props.loan.riskLevel
    if (risk === 'low') return 'success'
    if (risk === 'medium') return 'warn'
    if (risk === 'high' || risk === 'extreme') return 'danger'
    return 'info'
})
</script>

<template>
    <div class="item-card loan-card" :class="{ locked: !approved }">
        <div class="item-card-header">
            <div class="item-card-title">
                <AppIcon :icon="loan.icon" class="item-card-icon" />
                <h3 class="item-card-name">{{ loan.name }}</h3>
            </div>
            <Tag :value="riskMeta.label" :severity="tagSeverity" />
        </div>

        <p class="item-card-description">{{ loan.description }}</p>

        <div class="loan-details">
            <div class="loan-stat">
                <span class="loan-stat-label">{{ $t('loans.interest_rate') }}</span>
                <span class="loan-stat-value" :class="{ 'text-danger': effectiveRate > 0.2 }">
                    {{ rateDisplay }} {{ $t('loans.apr') }}
                </span>
            </div>
            <div class="loan-stat">
                <span class="loan-stat-label">{{ $t('loans.max_amount') }}</span>
                <span class="loan-stat-value text-success">{{ formatCash(maxApproved) }}</span>
            </div>
            <div class="loan-stat">
                <span class="loan-stat-label">{{ $t('loans.term') }}</span>
                <span class="loan-stat-value">{{ termDisplay ?? $t('loans.revolving') }}</span>
            </div>
            <div class="loan-stat">
                <span class="loan-stat-label">{{ $t('loans.min_credit') }}</span>
                <span class="loan-stat-value">{{ loan.minCreditScore }}</span>
            </div>
        </div>

        <div v-if="loan.collateralType !== 'none'" class="loan-collateral">
            <AppIcon icon="mdi:lock" class="collateral-icon" />
            <span>{{ $t('loans.requires_collateral', { pct: loan.collateralRatio * 100, type: loan.collateralType })
            }}</span>
        </div>

        <div v-if="!approved && reason" class="loan-rejection">
            <AppIcon icon="mdi:alert-circle" class="rejection-icon" />
            <span>{{ reason }}</span>
        </div>

        <div class="item-card-actions">
            <button class="btn btn-primary btn-sm" :disabled="!approved || disabled" @click="$emit('apply')"><i
                    class="pi pi-send"></i> {{ $t('loans.apply_loan') }}</button>
        </div>
    </div>
</template>

<style scoped>
.loan-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.loan-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--t-space-2);
}

.loan-stat {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.loan-stat-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.loan-stat-value {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    font-family: var(--t-font-mono);
}

.loan-collateral {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.collateral-icon {
    color: var(--t-warning);
}

.loan-rejection {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-danger);
    padding: var(--t-space-2);
    background: var(--t-danger-muted);
    border-radius: var(--t-radius-sm);
}

.rejection-icon {
    flex-shrink: 0;
}

.loan-card.locked {
    opacity: 0.7;
}

.loan-card .item-card-actions {
    margin-top: auto;
}
</style>
