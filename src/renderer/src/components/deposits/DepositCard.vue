<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Tag from 'primevue/tag'
import { useFormat } from '@renderer/composables/useFormat'
import { DEPOSIT_RISK_META, type DepositDef, type CompoundFrequency } from '@renderer/data/deposits'

const props = defineProps<{
    deposit: DepositDef
    effectiveAPY: number
    eligible: boolean
    reason?: string
}>()

defineEmits<{
    open: []
}>()

const { formatCash, formatTime } = useFormat()

const riskMeta = computed(() => DEPOSIT_RISK_META[props.deposit.risk])

const termDisplay = computed(() => {
    if (props.deposit.termTicks === 0) return null
    const seconds = props.deposit.termTicks / 10
    return formatTime(seconds)
})

const compoundLabel = computed(() => {
    const map: Record<CompoundFrequency, string> = {
        per_tick: 'deposits.continuous',
        per_second: 'deposits.per_second',
        per_minute: 'deposits.per_minute',
    }
    return map[props.deposit.compoundFrequency]
})

const tagSeverity = computed<'success' | 'warn' | 'danger'>(() => {
    if (props.deposit.risk === 'insured') return 'success'
    if (props.deposit.risk === 'standard') return 'warn'
    return 'danger'
})

const apyClass = computed(() => {
    const apy = props.effectiveAPY
    if (apy >= 0.15) return 'text-success'
    if (apy >= 0.08) return 'text-warning'
    return ''
})
</script>

<template>
    <div class="item-card deposit-card" :class="{ locked: !eligible }">
        <div class="item-card-header">
            <div class="item-card-title">
                <AppIcon :icon="deposit.icon" class="item-card-icon" />
                <h3 class="item-card-name">{{ deposit.name }}</h3>
            </div>
            <Tag :value="riskMeta.label" :severity="tagSeverity" />
        </div>

        <p class="item-card-description">{{ deposit.description }}</p>

        <div class="deposit-details">
            <div class="deposit-stat">
                <span class="deposit-stat-label">{{ $t('deposits.apy') }}</span>
                <span class="deposit-stat-value" :class="apyClass">
                    {{ (effectiveAPY * 100).toFixed(2) }}%
                </span>
            </div>
            <div class="deposit-stat">
                <span class="deposit-stat-label">{{ $t('deposits.min_deposit') }}</span>
                <span class="deposit-stat-value">{{ formatCash(deposit.minDeposit) }}</span>
            </div>
            <div class="deposit-stat">
                <span class="deposit-stat-label">{{ $t('deposits.term') }}</span>
                <span class="deposit-stat-value">{{ termDisplay ?? $t('deposits.flexible') }}</span>
            </div>
            <div class="deposit-stat">
                <span class="deposit-stat-label">{{ $t('deposits.compound') }}</span>
                <span class="deposit-stat-value">{{ $t(compoundLabel) }}</span>
            </div>
        </div>

        <div v-if="deposit.earlyWithdrawalPenalty > 0" class="deposit-info-badge">
            <AppIcon icon="mdi:alert-outline" class="info-badge-icon" />
            <span>{{ $t('deposits.early_penalty_badge', { pct: (deposit.earlyWithdrawalPenalty * 100).toFixed(0) })
            }}</span>
        </div>

        <div v-if="deposit.loyaltyBonusAPY > 0" class="deposit-info-badge loyalty">
            <AppIcon icon="mdi:star-outline" class="info-badge-icon" />
            <span>{{ $t('deposits.loyalty_badge', { pct: (deposit.loyaltyBonusAPY * 100).toFixed(1) }) }}</span>
        </div>

        <div v-if="!eligible && reason" class="deposit-rejection">
            <AppIcon icon="mdi:alert-circle" class="rejection-icon" />
            <span>{{ reason }}</span>
        </div>

        <div class="item-card-actions">
            <button class="btn btn-primary btn-sm" :disabled="!eligible" @click="$emit('open')">
                <i class="pi pi-plus"></i> {{ $t('deposits.open_account') }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.deposit-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.deposit-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--t-space-2);
}

.deposit-stat {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.deposit-stat-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.deposit-stat-value {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    font-family: var(--t-font-mono);
}

.deposit-info-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.deposit-info-badge.loyalty {
    color: var(--t-success);
}

.info-badge-icon {
    flex-shrink: 0;
    color: var(--t-warning);
}

.deposit-info-badge.loyalty .info-badge-icon {
    color: var(--t-success);
}

.deposit-rejection {
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

.deposit-card.locked {
    opacity: 0.7;
}

.deposit-card .item-card-actions {
    margin-top: auto;
}
</style>
