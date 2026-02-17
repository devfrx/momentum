<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UModal, UButton } from '@renderer/components/ui'
import { UTabs } from '@renderer/components/ui'
import type { TabDef } from '@renderer/components/ui'
import Slider from 'primevue/slider'
import Select from 'primevue/select'
import { useDepositStore } from '@renderer/stores/useDepositStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { useOnTick } from '@renderer/composables/useGameLoop'
import { gameEngine } from '@renderer/core/GameEngine'
import { D } from '@renderer/core/BigNum'
import { EventImpactBanner } from '@renderer/components/events'
import {
    DEPOSITS,
    DEPOSIT_CATEGORY_META,
    type DepositDef,
    type DepositCategory,
} from '@renderer/data/deposits'
import { DepositCard, ActiveDepositCard } from '@renderer/components/deposits'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'

const depositStore = useDepositStore()
const player = usePlayerStore()
const upgrades = useUpgradeStore()
const { formatCash, formatPercent } = useFormat()
const { t } = useI18n()

const depositActiveTab = ref('active')
const depositTabs = computed<TabDef[]>(() => [
    { id: 'active', label: t('deposits.tab_active'), icon: 'mdi:piggy-bank-outline', count: depositStore.deposits.length },
    { id: 'available', label: t('deposits.tab_available'), icon: 'mdi:bank-outline' },
    { id: 'history', label: t('deposits.tab_history'), icon: 'mdi:history' },
])

// Live tick counter
const currentTick = ref(gameEngine.currentTick)
useOnTick('deposits-tick', (ctx) => {
    currentTick.value = ctx.tick
})

// Deposit rate bonus from skills/prestige
const depositRateBonus = computed(() => {
    const mul = upgrades.getMultiplier('deposit_rate').toNumber()
    return mul > 1 ? `+${formatPercent(mul - 1)}` : t('deposits.no_bonus')
})

// Category filter
const selectedCategory = ref<DepositCategory | 'all'>('all')
const categoryOptions = computed(() => [
    { label: t('deposits.all_accounts'), value: 'all' },
    ...Object.entries(DEPOSIT_CATEGORY_META).map(([key, meta]) => ({
        label: (meta as { name: string }).name,
        value: key as DepositCategory,
    }))
])

// Filtered available deposits
const filteredDeposits = computed(() => {
    const defs = DEPOSITS.filter(d => {
        if (selectedCategory.value !== 'all' && d.category !== selectedCategory.value) return false
        return true
    })
    return defs.map(def => {
        const check = depositStore.canOpenDeposit(def.id)
        return {
            def,
            eligible: check.eligible,
            reason: check.reason,
            effectiveAPY: check.effectiveAPY || depositStore.getModifiedAPY(def),
        }
    })
})

// Open deposit dialog
const showOpenDialog = ref(false)
const selectedDeposit = ref<DepositDef | null>(null)
const depositAmount = ref(0)
const minAmount = ref(0)
const maxAmount = ref(0)

function openDepositDialog(def: DepositDef) {
    const check = depositStore.canOpenDeposit(def.id)
    if (!check.eligible) return

    selectedDeposit.value = def
    minAmount.value = def.minDeposit.toNumber()
    const capMax = def.maxDeposit.gt(0) ? def.maxDeposit.toNumber() : player.cash.toNumber()
    maxAmount.value = Math.min(capMax, player.cash.toNumber())
    depositAmount.value = minAmount.value
    showOpenDialog.value = true
}

function confirmDeposit() {
    if (!selectedDeposit.value) return

    const id = depositStore.openDeposit(
        selectedDeposit.value.id,
        D(depositAmount.value),
        currentTick.value
    )

    if (id) {
        showOpenDialog.value = false
        selectedDeposit.value = null
    }
}

// Withdraw handling
function handleWithdraw(depositId: string) {
    depositStore.withdraw(depositId, null, currentTick.value)
}

// InfoPanel sections
const depositInfoSections = computed<InfoSection[]>(() => [
    {
        title: t('deposits.info.account_types.title'),
        icon: 'mdi:shape-outline',
        entries: [
            { term: t('deposits.info.account_types.savings'), desc: t('deposits.info.account_types.savings_desc') },
            { term: t('deposits.info.account_types.fixed'), desc: t('deposits.info.account_types.fixed_desc') },
            { term: t('deposits.info.account_types.premium'), desc: t('deposits.info.account_types.premium_desc') },
            { term: t('deposits.info.account_types.special'), desc: t('deposits.info.account_types.special_desc') },
        ],
    },
    {
        title: t('deposits.info.interest.title'),
        icon: 'mdi:percent-circle-outline',
        entries: [
            { term: t('deposits.info.interest.apy'), desc: t('deposits.info.interest.apy_desc') },
            { term: t('deposits.info.interest.effective_apy'), desc: t('deposits.info.interest.effective_apy_desc') },
            { term: t('deposits.info.interest.compounding'), desc: t('deposits.info.interest.compounding_desc') },
            { term: t('deposits.info.interest.economy_rate'), desc: t('deposits.info.interest.economy_rate_desc') },
        ],
    },
    {
        title: t('deposits.info.terms.title'),
        icon: 'mdi:clock-outline',
        entries: [
            { term: t('deposits.info.terms.term'), desc: t('deposits.info.terms.term_desc') },
            { term: t('deposits.info.terms.maturity'), desc: t('deposits.info.terms.maturity_desc') },
            { term: t('deposits.info.terms.early_withdrawal'), desc: t('deposits.info.terms.early_withdrawal_desc') },
            { term: t('deposits.info.terms.loyalty_bonus'), desc: t('deposits.info.terms.loyalty_bonus_desc') },
        ],
    },
    {
        title: t('deposits.info.risk.title'),
        icon: 'mdi:shield-outline',
        entries: [
            { term: t('deposits.info.risk.fdic'), desc: t('deposits.info.risk.fdic_desc') },
            { term: t('deposits.info.risk.standard'), desc: t('deposits.info.risk.standard_desc') },
            { term: t('deposits.info.risk.volatile'), desc: t('deposits.info.risk.volatile_desc') },
        ],
    },
    {
        title: t('deposits.info.modifiers.title'),
        icon: 'mdi:tune-vertical',
        entries: [
            { term: t('deposits.info.modifiers.credit_score'), desc: t('deposits.info.modifiers.credit_score_desc') },
            { term: t('deposits.info.modifiers.skill_tree'), desc: t('deposits.info.modifiers.skill_tree_desc') },
            { term: t('deposits.info.modifiers.prestige'), desc: t('deposits.info.modifiers.prestige_desc') },
            { term: t('deposits.info.modifiers.events'), desc: t('deposits.info.modifiers.events_desc') },
        ],
    },
])
</script>

<template>
    <div class="page-container">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <AppIcon icon="mdi:piggy-bank-outline" class="page-title-icon" />
                    {{ $t('deposits.title') }}
                </h1>
                <p class="page-subtitle">{{ $t('deposits.subtitle') }}</p>
            </div>
        </div>

        <!-- Event Impact -->
        <EventImpactBanner route-name="deposits" />

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-chip bonus-chip">
                <AppIcon icon="mdi:trending-up" class="stat-chip-icon" />
                <span class="stat-chip-label">{{ $t('deposits.rate_bonus') }}</span>
                <span class="stat-chip-value"
                    :class="{ 'text-success': upgrades.getMultiplier('deposit_rate').gt(1) }">{{ depositRateBonus
                    }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('deposits.cash') }}</span>
                <span class="stat-chip-value text-success">{{ formatCash(player.cash) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('deposits.locked') }}</span>
                <span class="stat-chip-value">{{ formatCash(depositStore.totalLockedBalance) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('deposits.active') }}</span>
                <span class="stat-chip-value">{{ depositStore.deposits.length }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('deposits.avg_apy') }}</span>
                <span class="stat-chip-value text-success">{{ (depositStore.averageAPY * 100).toFixed(2) }}%</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('deposits.interest_s') }}</span>
                <span class="stat-chip-value text-success">{{ formatCash(depositStore.interestPerSecond) }}</span>
            </div>
        </div>

        <!-- Main Content -->
        <UTabs v-model="depositActiveTab" :tabs="depositTabs">
            <template #active>
                <div v-if="depositStore.deposits.length === 0" class="empty-state">
                    <AppIcon icon="mdi:piggy-bank-outline" class="empty-icon" />
                    <p>{{ $t('deposits.no_active') }}</p>
                </div>

                <div v-else class="card-grid">
                    <ActiveDepositCard v-for="dep in depositStore.deposits" :key="dep.id" :deposit="dep"
                        :current-tick="currentTick" @withdraw="handleWithdraw(dep.id)" />
                </div>
            </template>

            <template #available>
                <div class="category-filter">
                    <Select v-model="selectedCategory" :options="categoryOptions" optionLabel="label"
                        optionValue="value" :placeholder="$t('common.filter_by_category')" />
                </div>

                <div class="card-grid">
                    <DepositCard v-for="{ def, eligible, reason, effectiveAPY } in filteredDeposits" :key="def.id"
                        :deposit="def" :effective-a-p-y="effectiveAPY" :eligible="eligible" :reason="reason"
                        @open="openDepositDialog(def)" />
                </div>
            </template>

            <template #history>
                <div v-if="depositStore.depositHistory.length === 0" class="empty-state">
                    <AppIcon icon="mdi:history" class="empty-icon" />
                    <p>{{ $t('deposits.no_history') }}</p>
                </div>

                <div v-else class="history-list">
                    <div v-for="(entry, idx) in depositStore.depositHistory" :key="idx" class="history-item"
                        :class="entry.status">
                        <div class="history-main">
                            <span class="history-name">
                                {{DEPOSITS.find(d => d.id === entry.depositDefId)?.name ?? $t('deposits.unknown')}}
                            </span>
                            <span class="history-amount">{{ formatCash(entry.principal) }}</span>
                        </div>
                        <div class="history-details">
                            <span>{{ $t('deposits.interest_label') }} <strong class="text-success">{{
                                formatCash(entry.totalInterestEarned)
                            }}</strong></span>
                            <span>{{ $t('deposits.apy_label') }} {{ (entry.effectiveAPY * 100).toFixed(1) }}%</span>
                            <span v-if="entry.earlyWithdrawal" class="text-warning">{{
                                $t('deposits.early_withdrawal', { penalty: formatCash(entry.penaltyPaid) })
                            }}</span>
                            <span class="history-status" :class="entry.status">{{ entry.status.replace(/_/g, ' ')
                            }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </UTabs>

        <!-- Deposit Stats Card -->
        <div class="deposit-lifetime-stats">
            <h4>{{ $t('deposits.statistics') }}</h4>
            <div class="stat-row">
                <span>{{ $t('deposits.total_deposited') }}</span>
                <strong>{{ formatCash(depositStore.totalDeposited) }}</strong>
            </div>
            <div class="stat-row">
                <span>{{ $t('deposits.total_interest') }}</span>
                <strong class="text-success">{{ formatCash(depositStore.totalInterestEarnedEver) }}</strong>
            </div>
            <div class="stat-row">
                <span>{{ $t('deposits.accounts_opened') }}</span>
                <strong>{{ depositStore.totalDepositsOpened }}</strong>
            </div>
            <div class="stat-row">
                <span>{{ $t('deposits.matured') }}</span>
                <strong class="text-success">{{ depositStore.totalDepositsMatured }}</strong>
            </div>
            <div class="stat-row">
                <span>{{ $t('deposits.early_withdrawals') }}</span>
                <strong class="text-warning">{{ depositStore.totalEarlyWithdrawals }}</strong>
            </div>
        </div>

        <!-- InfoPanel -->
        <InfoPanel :title="$t('deposits.how_it_works')" :description="$t('deposits.info_desc')"
            :sections="depositInfoSections" />

        <!-- Open Deposit Dialog -->
        <UModal v-model="showOpenDialog" :title="$t('deposits.open_title')" icon="mdi:piggy-bank" size="md">
            <div v-if="selectedDeposit" class="open-dialog-content">
                <div class="deposit-summary">
                    <AppIcon :icon="selectedDeposit.icon" class="deposit-summary-icon" />
                    <div>
                        <h3>{{ selectedDeposit.name }}</h3>
                        <p>{{ selectedDeposit.description }}</p>
                    </div>
                </div>

                <div class="amount-selector">
                    <label>{{ $t('deposits.deposit_amount') }}</label>
                    <Slider v-model="depositAmount" :min="minAmount" :max="maxAmount"
                        :step="Math.max(100, Math.floor((maxAmount - minAmount) / 100))" />
                    <div class="amount-display">
                        <span class="amount-value">{{ formatCash(depositAmount) }}</span>
                        <span class="amount-range">{{ formatCash(minAmount) }} — {{ formatCash(maxAmount) }}</span>
                    </div>
                </div>

                <div class="deposit-terms">
                    <div class="term-row">
                        <span>{{ $t('deposits.effective_apy') }}</span>
                        <strong class="text-success">{{ (depositStore.getModifiedAPY(selectedDeposit) * 100).toFixed(2)
                            }}%</strong>
                    </div>
                    <div class="term-row">
                        <span>{{ $t('deposits.term') }}</span>
                        <strong>{{ selectedDeposit.termTicks === 0 ? $t('deposits.flexible') :
                            `${Math.floor(selectedDeposit.termTicks / 600)}min` }}</strong>
                    </div>
                    <div class="term-row">
                        <span>{{ $t('deposits.compound') }}</span>
                        <strong>{{ selectedDeposit.compoundFrequency === 'per_tick' ? $t('deposits.continuous') :
                            selectedDeposit.compoundFrequency === 'per_second' ? $t('deposits.per_second') :
                                $t('deposits.per_minute') }}</strong>
                    </div>
                    <div v-if="selectedDeposit.earlyWithdrawalPenalty > 0" class="term-row">
                        <span>{{ $t('deposits.early_penalty') }}</span>
                        <strong class="text-warning">{{ (selectedDeposit.earlyWithdrawalPenalty * 100).toFixed(0) }}{{
                            $t('deposits.pct_of_interest') }}</strong>
                    </div>
                </div>

                <div class="dialog-actions">
                    <UButton variant="ghost" @click="showOpenDialog = false">{{ $t('common.cancel') }}</UButton>
                    <UButton variant="success" @click="confirmDeposit">{{ $t('deposits.confirm_deposit')
                        }}</UButton>
                </div>
            </div>
        </UModal>
    </div>
</template>

<style scoped>
.category-filter {
    margin-bottom: var(--t-space-4);
}

.deposit-lifetime-stats {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-4);
    margin-bottom: var(--t-space-6);
}

.deposit-lifetime-stats h4 {
    margin: 0 0 var(--t-space-3) 0;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.stat-row {
    display: flex;
    justify-content: space-between;
    padding: var(--t-space-2) 0;
    border-bottom: 1px solid var(--t-border);
    font-size: var(--t-font-size-sm);
}

.stat-row:last-child {
    border-bottom: none;
}

.stat-row span {
    color: var(--t-text-muted);
}

.stat-row strong {
    font-family: var(--t-font-mono);
}

/* Dialog Styles */
.open-dialog-content {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

.deposit-summary {
    display: flex;
    align-items: flex-start;
    gap: var(--t-space-3);
}

.deposit-summary-icon {
    font-size: 2rem;
    color: var(--t-text-secondary);
    flex-shrink: 0;
}

.deposit-summary h3 {
    margin: 0;
    font-size: var(--t-font-size-base);
}

.deposit-summary p {
    margin: 0.25rem 0 0;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.amount-selector {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.amount-selector label {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
}

.amount-display {
    display: flex;
    justify-content: space-between;
}

.amount-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-base);
}

.amount-range {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.deposit-terms {
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-3);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.term-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-sm);
}

.term-row span {
    color: var(--t-text-muted);
}

.term-row strong {
    font-family: var(--t-font-mono);
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--t-space-2);
    padding-top: var(--t-space-2);
}

/* History */
.history-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.history-item {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-3);
}

.history-main {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--t-space-1);
}

.history-name {
    font-weight: var(--t-font-semibold);
}

.history-amount {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
}

.history-details {
    display: flex;
    gap: var(--t-space-4);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    flex-wrap: wrap;
}

.history-status {
    font-weight: var(--t-font-semibold);
    text-transform: capitalize;
}

.history-status.completed,
.history-status.closed_at_maturity {
    color: var(--t-success);
}

.history-status.withdrawn_early {
    color: var(--t-warning);
}

/* Empty state */
.empty-state {
    text-align: center;
    padding: var(--t-space-8) var(--t-space-4);
    color: var(--t-text-muted);
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: var(--t-space-3);
    opacity: 0.4;
}
</style>
