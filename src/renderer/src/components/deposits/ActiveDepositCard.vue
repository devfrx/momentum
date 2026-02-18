<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton, UCard } from '@renderer/components/ui'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import { useFormat } from '@renderer/composables/useFormat'
import { DEPOSITS, DEPOSIT_RISK_META, type ActiveDeposit } from '@renderer/data/deposits'

const props = defineProps<{
    deposit: ActiveDeposit
    currentTick: number
}>()

defineEmits<{
    withdraw: []
    withdrawPartial: [amount: number]
}>()

const { formatCash, formatTime } = useFormat()

const def = computed(() => DEPOSITS.find(d => d.id === props.deposit.depositDefId))
const riskMeta = computed(() => def.value ? DEPOSIT_RISK_META[def.value.risk] : null)

const progress = computed(() => {
    if (!def.value || def.value.termTicks === 0) return 100
    return Math.min(100, (props.deposit.ticksActive / def.value.termTicks) * 100)
})

const timeRemaining = computed(() => {
    if (!def.value || def.value.termTicks === 0) return null
    const remainingTicks = Math.max(0, def.value.termTicks - props.deposit.ticksActive)
    return formatTime(remainingTicks / 10)
})

const interestDisplay = computed(() => {
    return formatCash(props.deposit.totalInterestEarned)
})

const balanceDisplay = computed(() => {
    return formatCash(props.deposit.currentBalance)
})

const principalDisplay = computed(() => {
    return formatCash(props.deposit.principal)
})

const roi = computed(() => {
    if (props.deposit.principal.lte(0)) return 0
    return props.deposit.totalInterestEarned.div(props.deposit.principal).toNumber() * 100
})

const tagSeverity = computed<'success' | 'warn' | 'danger'>(() => {
    if (props.deposit.matured) return 'success'
    if (progress.value > 50) return 'warn'
    return 'danger'
})

const statusLabel = computed(() => {
    if (props.deposit.loyaltyActive) return 'deposits.loyalty_bonus'
    if (props.deposit.matured) return 'deposits.matured'
    return 'common.active'
})

const isEarlyWithdrawal = computed(() => {
    if (!def.value) return false
    return def.value.termTicks > 0 && !props.deposit.matured
})
</script>

<template>
    <UCard class="active-deposit-card" :class="{ matured: deposit.matured, loyalty: deposit.loyaltyActive }">
        <template #header>
            <div class="item-card-title">
                <AppIcon :icon="def?.icon ?? 'mdi:bank'" class="item-card-icon" />
                <h3 class="item-card-name">{{ def?.name ?? $t('deposits.unknown') }}</h3>
            </div>
            <Tag :value="$t(statusLabel)" :severity="tagSeverity" />
        </template>

        <!-- Balance Section -->
        <div class="balance-section">
            <div class="balance-row">
                <span class="balance-label">{{ $t('deposits.principal') }}</span>
                <span class="balance-value">{{ principalDisplay }}</span>
            </div>
            <div class="balance-row highlight">
                <span class="balance-label">{{ $t('deposits.current_balance') }}</span>
                <span class="balance-value text-success">{{ balanceDisplay }}</span>
            </div>
            <div class="balance-row">
                <span class="balance-label">{{ $t('deposits.interest_earned') }}</span>
                <span class="balance-value text-success">+{{ interestDisplay }}</span>
            </div>
        </div>

        <!-- Stats Row -->
        <div class="deposit-stats">
            <div class="dep-stat-chip">
                <span class="dep-stat-label">{{ $t('deposits.apy') }}</span>
                <span class="dep-stat-value">{{ (deposit.effectiveAPY * 100).toFixed(2) }}%</span>
            </div>
            <div class="dep-stat-chip">
                <span class="dep-stat-label">{{ $t('deposits.roi') }}</span>
                <span class="dep-stat-value" :class="{ 'text-success': roi > 0 }">{{ roi.toFixed(2) }}%</span>
            </div>
            <div class="dep-stat-chip">
                <span class="dep-stat-label">{{ $t('deposits.compounds') }}</span>
                <span class="dep-stat-value">{{ deposit.totalCompounds }}</span>
            </div>
        </div>

        <!-- Term Progress -->
        <div v-if="def && def.termTicks > 0" class="term-progress">
            <div class="progress-header">
                <span>{{ $t('deposits.term_progress') }}</span>
                <span>{{ timeRemaining ?? $t('deposits.flexible') }}</span>
            </div>
            <ProgressBar :value="progress" :showValue="false" class="dep-progress-bar" />
        </div>

        <!-- Loyalty indicator -->
        <div v-if="deposit.loyaltyActive" class="loyalty-badge">
            <AppIcon icon="mdi:star" class="loyalty-icon" />
            <span>{{ $t('deposits.loyalty_active', { pct: ((def?.loyaltyBonusAPY ?? 0) * 100).toFixed(1) }) }}</span>
        </div>

        <!-- Risk + Warning -->
        <div v-if="riskMeta" class="risk-badge" :class="def?.risk">
            <AppIcon icon="mdi:shield-outline" />
            <span>{{ riskMeta.label }}</span>
        </div>

        <!-- Early withdrawal warning -->
        <div v-if="isEarlyWithdrawal && def && def.earlyWithdrawalPenalty > 0" class="early-warning">
            <AppIcon icon="mdi:alert-outline" />
            <span>{{ $t('deposits.early_forfeit', { pct: (def.earlyWithdrawalPenalty * 100).toFixed(0) }) }}</span>
        </div>

        <!-- Actions -->
        <template #footer>
            <UButton size="sm" :variant="isEarlyWithdrawal ? 'warning' : 'success'" icon="mdi:wallet"
                @click="$emit('withdraw')">
                {{ isEarlyWithdrawal ? $t('deposits.withdraw_early') :
                    $t('deposits.withdraw_all') }}
            </UButton>
        </template>
    </UCard>
</template>

<style scoped>
.balance-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
}

.balance-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.balance-row.highlight {
    padding: var(--t-space-1) 0;
    border-top: 1px solid var(--t-border);
    border-bottom: 1px solid var(--t-border);
    margin: var(--t-space-1) 0;
}

.balance-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.balance-value {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    font-family: var(--t-font-mono);
}

.balance-row.highlight .balance-value {
    font-size: var(--t-font-size-base);
}

.deposit-stats {
    display: flex;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.dep-stat-chip {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.5rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
}

.dep-stat-label {
    color: var(--t-text-muted);
}

.dep-stat-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.term-progress {
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

.dep-progress-bar {
    height: 6px;
}

.loyalty-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-success);
    padding: var(--t-space-2);
    background: var(--t-success-muted);
    border-radius: var(--t-radius-sm);
}

.loyalty-icon {
    color: var(--t-success);
}

.risk-badge {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.risk-badge.insured {
    color: var(--t-success);
}

.risk-badge.volatile {
    color: var(--t-danger);
}

.early-warning {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-warning);
    padding: var(--t-space-2);
    background: var(--t-warning-muted);
    border-radius: var(--t-radius-sm);
}
</style>
