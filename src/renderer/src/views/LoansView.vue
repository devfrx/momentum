<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UModal, UButton } from '@renderer/components/ui'
import { UTabs } from '@renderer/components/ui'
import type { TabDef } from '@renderer/components/ui'
import Slider from 'primevue/slider'
import Select from 'primevue/select'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { useOnTick } from '@renderer/composables/useGameLoop'
import { gameEngine } from '@renderer/core/GameEngine'
import { D } from '@renderer/core/BigNum'
import { EventImpactBanner } from '@renderer/components/events'
import {
    LOANS,
    LOAN_CATEGORY_META,
    type LoanDef,
    type LoanCategory,
    calculateMaxLoanAmount,
    calculateEffectiveRate,
} from '@renderer/data/loans'
import { LoanCard, ActiveLoanCard, CreditScoreWidget } from '@renderer/components/loans'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'

const loanStore = useLoanStore()
const player = usePlayerStore()
const upgrades = useUpgradeStore()
const { formatCash, formatPercent } = useFormat()
const { t } = useI18n()

const loanActiveTab = ref('active')
const loanTabs = computed<TabDef[]>(() => [
    { id: 'active', label: t('loans.tab_active'), icon: 'mdi:file-document-outline', count: loanStore.loans.length },
    { id: 'available', label: t('loans.tab_available'), icon: 'mdi:bank-outline' },
    { id: 'history', label: t('loans.tab_history'), icon: 'mdi:history' },
])

// Live tick counter
const currentTick = ref(gameEngine.currentTick)
useOnTick('loans-tick', (ctx) => {
    currentTick.value = ctx.tick
})

// Loan rate discount from skills/prestige (values < 1 mean discount)
const loanRateDiscount = computed(() => {
    const mul = upgrades.getMultiplier('loan_rate').toNumber()
    if (mul < 1) {
        return `-${formatPercent(1 - mul)}`
    }
    return t('loans.no_discount')
})

// Category filter
const selectedCategory = ref<LoanCategory | 'all'>('all')
const categoryOptions = computed(() => [
    { label: t('loans.all_loans'), value: 'all' },
    ...Object.entries(LOAN_CATEGORY_META).map(([key, meta]) => ({
        label: (meta as { name: string }).name,
        value: key as LoanCategory,
    }))
])

// Filtered loans by category
const filteredLoans = computed(() => {
    const loans = LOANS.filter(l => {
        if (selectedCategory.value !== 'all' && l.category !== selectedCategory.value) return false
        return true
    })
    return loans.map(loan => {
        const application = loanStore.canApplyForLoan(loan.id)
        return {
            loan,
            application,
            effectiveRate: application.effectiveRate ?? calculateEffectiveRate(loan, loanStore.creditScore),
            maxApproved: application.maxApproved?.toNumber() ?? calculateMaxLoanAmount(loan, loanStore.creditScore).toNumber(),
        }
    })
})

// Loan application dialog
const showApplyDialog = ref(false)
const selectedLoan = ref<LoanDef | null>(null)
const loanAmount = ref(0)
const minAmount = ref(0)
const maxAmount = ref(0)

function openApplyDialog(loan: LoanDef) {
    const application = loanStore.canApplyForLoan(loan.id)
    if (!application.approved) return

    selectedLoan.value = loan
    minAmount.value = loan.minAmount.toNumber()
    maxAmount.value = application.maxApproved?.toNumber() ?? loan.maxAmount.toNumber()
    loanAmount.value = minAmount.value
    showApplyDialog.value = true
}

function confirmLoan() {
    if (!selectedLoan.value) return

    const loanId = loanStore.takeLoan(
        selectedLoan.value.id,
        D(loanAmount.value),
        currentTick.value
    )

    if (loanId) {
        showApplyDialog.value = false
        selectedLoan.value = null
    }
}

// Repayment handling
function handleRepay(loanId: string, amount: number) {
    loanStore.repayLoan(loanId, D(amount), currentTick.value)
}

function handleRepayFull(loanId: string) {
    loanStore.repayLoanInFull(loanId, currentTick.value)
}

// Refinance dialog
const showRefinanceDialog = ref(false)
const loanToRefinance = ref<string | null>(null)
const refinanceTarget = ref<string | null>(null)

const refinanceOptions = computed(() => {
    if (!loanToRefinance.value) return []
    const currentLoan = loanStore.getLoan(loanToRefinance.value)
    if (!currentLoan) return []

    return LOANS.filter(l => {
        if (l.id === currentLoan.loanDefId) return false // skip same type
        const app = loanStore.canApplyForLoan(l.id, loanToRefinance.value!)
        if (!app.approved) return false
        if ((app.maxApproved?.toNumber() ?? 0) < currentLoan.remaining.toNumber()) return false
        return true
    }).map(l => ({
        label: `${l.name} (${(calculateEffectiveRate(l, loanStore.creditScore) * 100).toFixed(1)}% ${t('loans.apr')})`,
        value: l.id,
    }))
})

function openRefinanceDialog(loanId: string) {
    loanToRefinance.value = loanId
    refinanceTarget.value = null
    showRefinanceDialog.value = true
}

function confirmRefinance() {
    if (!loanToRefinance.value || !refinanceTarget.value) return
    loanStore.refinanceLoan(loanToRefinance.value, refinanceTarget.value, currentTick.value)
    showRefinanceDialog.value = false
    loanToRefinance.value = null
    refinanceTarget.value = null
}

// Stats
const totalDebt = computed(() => loanStore.totalDebt)
const activeLoansCount = computed(() => loanStore.loans.length)
const avgRate = computed(() => loanStore.averageInterestRate)

// InfoPanel sections – comprehensive loan documentation
const loanInfoSections = computed<InfoSection[]>(() => [
    {
        title: t('loans.info.credit_score.title'),
        icon: 'mdi:speedometer',
        entries: [
            { term: t('loans.info.credit_score.range'), desc: t('loans.info.credit_score.range_desc') },
            { term: t('loans.info.credit_score.on_time'), desc: t('loans.info.credit_score.on_time_desc') },
            { term: t('loans.info.credit_score.late_missed'), desc: t('loans.info.credit_score.late_missed_desc') },
            { term: t('loans.info.credit_score.debt_ratio'), desc: t('loans.info.credit_score.debt_ratio_desc') },
            { term: t('loans.info.credit_score.loan_history'), desc: t('loans.info.credit_score.loan_history_desc') },
        ],
    },
    {
        title: t('loans.info.credit_factors.title'),
        icon: 'mdi:chart-pie',
        entries: [
            { term: t('loans.info.credit_factors.payment_history'), desc: t('loans.info.credit_factors.payment_history_desc') },
            { term: t('loans.info.credit_factors.credit_utilization'), desc: t('loans.info.credit_factors.credit_utilization_desc') },
            { term: t('loans.info.credit_factors.credit_age'), desc: t('loans.info.credit_factors.credit_age_desc') },
            { term: t('loans.info.credit_factors.credit_mix'), desc: t('loans.info.credit_factors.credit_mix_desc') },
            { term: t('loans.info.credit_factors.new_credit'), desc: t('loans.info.credit_factors.new_credit_desc') },
        ],
    },
    {
        title: t('loans.info.categories.title'),
        icon: 'mdi:shape-outline',
        entries: [
            { term: t('loans.info.categories.personal'), desc: t('loans.info.categories.personal_desc') },
            { term: t('loans.info.categories.business'), desc: t('loans.info.categories.business_desc') },
            { term: t('loans.info.categories.mortgage'), desc: t('loans.info.categories.mortgage_desc') },
            { term: t('loans.info.categories.high_risk'), desc: t('loans.info.categories.high_risk_desc') },
        ],
    },
    {
        title: t('loans.info.interest.title'),
        icon: 'mdi:percent-circle-outline',
        entries: [
            { term: t('loans.info.interest.apr'), desc: t('loans.info.interest.apr_desc') },
            { term: t('loans.info.interest.effective_rate'), desc: t('loans.info.interest.effective_rate_desc') },
            { term: t('loans.info.interest.payment_schedule'), desc: t('loans.info.interest.payment_schedule_desc') },
            { term: t('loans.info.interest.amortisation'), desc: t('loans.info.interest.amortisation_desc') },
        ],
    },
    {
        title: t('loans.info.collateral.title'),
        icon: 'mdi:shield-lock-outline',
        entries: [
            { term: t('loans.info.collateral.unsecured'), desc: t('loans.info.collateral.unsecured_desc') },
            { term: t('loans.info.collateral.cash_collateral'), desc: t('loans.info.collateral.cash_collateral_desc') },
            { term: t('loans.info.collateral.collateral_ratio'), desc: t('loans.info.collateral.collateral_ratio_desc') },
            { term: t('loans.info.collateral.margin_call'), desc: t('loans.info.collateral.margin_call_desc') },
        ],
    },
    {
        title: t('loans.info.defaults.title'),
        icon: 'mdi:alert-circle-outline',
        entries: [
            { term: t('loans.info.defaults.missed'), desc: t('loans.info.defaults.missed_desc') },
            { term: t('loans.info.defaults.late_penalty'), desc: t('loans.info.defaults.late_penalty_desc') },
            { term: t('loans.info.defaults.default'), desc: t('loans.info.defaults.default_desc') },
            { term: t('loans.info.defaults.max_active'), desc: t('loans.info.defaults.max_active_desc') },
        ],
    },
    {
        title: t('loans.info.refinancing.title'),
        icon: 'mdi:swap-horizontal',
        entries: [
            { term: t('loans.info.refinancing.what_is'), desc: t('loans.info.refinancing.what_is_desc') },
            { term: t('loans.info.refinancing.eligibility'), desc: t('loans.info.refinancing.eligibility_desc') },
            { term: t('loans.info.refinancing.early_fee'), desc: t('loans.info.refinancing.early_fee_desc') },
            { term: t('loans.info.refinancing.strategy'), desc: t('loans.info.refinancing.strategy_desc') },
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
                    <AppIcon icon="mdi:bank" class="page-title-icon" />
                    {{ $t('loans.title') }}
                </h1>
                <p class="page-subtitle">{{ $t('loans.subtitle') }}</p>
            </div>
        </div>

        <!-- Event Impact -->
        <EventImpactBanner route-name="loans" />

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-chip bonus-chip">
                <AppIcon icon="mdi:percent-circle-outline" class="stat-chip-icon" />
                <span class="stat-chip-label">{{ $t('loans.rate_discount') }}</span>
                <span class="stat-chip-value" :class="{ 'text-success': upgrades.getMultiplier('loan_rate').lt(1) }">{{
                    loanRateDiscount }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('loans.cash') }}</span>
                <span class="stat-chip-value text-success">{{ formatCash(player.cash) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('loans.total_debt') }}</span>
                <span class="stat-chip-value text-danger">{{ formatCash(totalDebt) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('loans.active_loans') }}</span>
                <span class="stat-chip-value">{{ activeLoansCount }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('loans.avg_rate') }}</span>
                <span class="stat-chip-value">{{ (avgRate * 100).toFixed(1) }}%</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('loans.credit_score') }}</span>
                <span class="stat-chip-value" :class="{
                    'text-success': loanStore.creditScore >= 70,
                    'text-warning': loanStore.creditScore >= 40 && loanStore.creditScore < 70,
                    'text-danger': loanStore.creditScore < 40
                }">{{ loanStore.creditScore }}</span>
            </div>
        </div>

        <div class="loans-layout">
            <!-- Sidebar: Credit Score -->
            <aside class="loans-sidebar">
                <CreditScoreWidget />

                <div class="sidebar-section">
                    <h4 class="sidebar-section-title">
                        <AppIcon icon="mdi:chart-bar" class="sidebar-section-icon" />
                        {{ $t('loans.statistics') }}
                    </h4>
                    <div class="sidebar-stats">
                        <div class="sidebar-stat">
                            <span class="sidebar-stat-label">{{ $t('loans.total_taken') }}</span>
                            <span class="sidebar-stat-value">{{ loanStore.totalLoansTaken }}</span>
                        </div>
                        <div class="sidebar-stat">
                            <span class="sidebar-stat-label">{{ $t('loans.repaid_on_time') }}</span>
                            <span class="sidebar-stat-value text-success">{{ loanStore.totalLoansRepaidOnTime }}</span>
                        </div>
                        <div class="sidebar-stat">
                            <span class="sidebar-stat-label">{{ $t('loans.defaults') }}</span>
                            <span class="sidebar-stat-value text-danger">{{ loanStore.totalLoansDefaulted }}</span>
                        </div>
                        <div class="sidebar-stat">
                            <span class="sidebar-stat-label">{{ $t('loans.total_interest_paid') }}</span>
                            <span class="sidebar-stat-value text-warning">{{ formatCash(loanStore.totalInterestPaidEver)
                                }}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <main class="loans-main">
                <UTabs v-model="loanActiveTab" :tabs="loanTabs">
                    <template #active>
                        <div v-if="loanStore.loans.length === 0" class="empty-state">
                            <AppIcon icon="mdi:file-document-outline" class="empty-icon" />
                            <p>{{ $t('loans.no_active') }}</p>
                        </div>

                        <div v-else class="card-grid">
                            <ActiveLoanCard v-for="loan in loanStore.loans" :key="loan.id" :loan="loan"
                                :current-tick="currentTick" @repay="(amount) => handleRepay(loan.id, amount)"
                                @repay-full="handleRepayFull(loan.id)" @refinance="openRefinanceDialog(loan.id)" />
                        </div>
                    </template>

                    <template #available>
                        <div class="category-filter">
                            <Select v-model="selectedCategory" :options="categoryOptions" optionLabel="label"
                                optionValue="value" :placeholder="$t('common.filter_by_category')" />
                        </div>

                        <div class="card-grid">
                            <LoanCard v-for="{ loan, application, effectiveRate, maxApproved } in filteredLoans"
                                :key="loan.id" :loan="loan" :effective-rate="effectiveRate" :max-approved="maxApproved"
                                :approved="application.approved" :reason="application.reason"
                                @apply="openApplyDialog(loan)" />
                        </div>
                    </template>

                    <template #history>
                        <div v-if="loanStore.loanHistory.length === 0" class="empty-state">
                            <AppIcon icon="mdi:history" class="empty-icon" />
                            <p>{{ $t('loans.no_history') }}</p>
                        </div>

                        <div v-else class="history-list">
                            <div v-for="(entry, idx) in loanStore.loanHistory" :key="idx" class="history-item"
                                :class="entry.status">
                                <div class="history-main">
                                    <span class="history-name">
                                        {{LOANS.find(l => l.id === entry.loanDefId)?.name ??
                                            $t('loans.unknown_loan')}}
                                    </span>
                                    <span class="history-amount">{{ formatCash(entry.principal) }}</span>
                                </div>
                                <div class="history-details">
                                    <span>{{ $t('loans.interest_label') }} {{ formatCash(entry.totalInterestPaid)
                                        }}</span>
                                    <span>{{ $t('loans.on_time') }} {{ entry.onTimePayments }} | {{ $t('loans.late')
                                        }} {{ entry.latePayments
                                        }}</span>
                                    <span class="history-status" :class="entry.status">{{ entry.status }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </UTabs>
            </main>
        </div>

        <!-- Loan Documentation -->
        <InfoPanel :title="$t('loans.how_it_works')" :description="$t('loans.info_desc')"
            :sections="loanInfoSections" />

        <!-- Apply for Loan Dialog -->
        <UModal v-model="showApplyDialog" :title="$t('loans.apply_title')" icon="mdi:bank" size="md">
            <div v-if="selectedLoan" class="apply-dialog-content">
                <div class="loan-summary">
                    <AppIcon :icon="selectedLoan.icon" class="loan-summary-icon" />
                    <div>
                        <h3>{{ selectedLoan.name }}</h3>
                        <p>{{ selectedLoan.description }}</p>
                    </div>
                </div>

                <div class="amount-selector">
                    <label>{{ $t('loans.loan_amount') }}</label>
                    <Slider v-model="loanAmount" :min="minAmount" :max="maxAmount"
                        :step="Math.max(100, Math.floor((maxAmount - minAmount) / 100))" />
                    <div class="amount-display">
                        <span class="amount-value">{{ formatCash(loanAmount) }}</span>
                        <span class="amount-range">{{ formatCash(minAmount) }} - {{ formatCash(maxAmount) }}</span>
                    </div>
                </div>

                <div class="loan-terms">
                    <div class="term-row">
                        <span>{{ $t('loans.interest_rate') }}</span>
                        <strong>{{ (calculateEffectiveRate(selectedLoan, loanStore.creditScore) * 100).toFixed(1) }}%
                            APR</strong>
                    </div>
                    <div class="term-row">
                        <span>{{ $t('loans.term') }}</span>
                        <strong>{{ selectedLoan.termTicks === 0 ? $t('loans.revolving') :
                            `${Math.floor(selectedLoan.termTicks /
                                600)}min` }}</strong>
                    </div>
                    <div v-if="selectedLoan.collateralType !== 'none'" class="term-row">
                        <span>{{ $t('loans.collateral_required') }}</span>
                        <strong>{{ formatCash(loanAmount * selectedLoan.collateralRatio) }}</strong>
                    </div>
                    <div v-if="selectedLoan.earlyRepaymentPenalty > 0" class="term-row">
                        <span>{{ $t('loans.early_penalty') }}</span>
                        <strong>{{ (selectedLoan.earlyRepaymentPenalty * 100).toFixed(0) }}%</strong>
                    </div>
                </div>

                <div class="dialog-actions">
                    <UButton variant="ghost" @click="showApplyDialog = false">{{ $t('common.cancel') }}</UButton>
                    <UButton variant="success" @click="confirmLoan">{{ $t('loans.confirm_loan') }}</UButton>
                </div>
            </div>
        </UModal>

        <!-- Refinance Dialog -->
        <UModal v-model="showRefinanceDialog" :title="$t('loans.refinance_title')" icon="mdi:refresh" size="sm">
            <div class="refinance-dialog-content">
                <p>{{ $t('loans.refinance_desc') }}</p>

                <Select v-model="refinanceTarget" :options="refinanceOptions" optionLabel="label" optionValue="value"
                    :placeholder="$t('loans.select_new_type')" class="w-full" />

                <div class="dialog-actions">
                    <UButton variant="ghost" @click="showRefinanceDialog = false">{{ $t('common.cancel')
                        }}</UButton>
                    <UButton variant="ghost" :disabled="!refinanceTarget" @click="confirmRefinance">{{
                        $t('loans.refinance') }}</UButton>
                </div>
            </div>
        </UModal>
    </div>
</template>

<style scoped>
.loans-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: var(--t-space-6);
}

.loans-sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

.loans-main {
    min-width: 0;
}

.sidebar-section {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-4);
}

.sidebar-section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
    margin: 0 0 var(--t-space-3) 0;
}

.sidebar-section-icon {
    font-size: 0.9rem;
}

.sidebar-stats {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.sidebar-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-2) 0;
    border-bottom: 1px solid var(--t-border);
    font-size: var(--t-font-size-xs);
}

.sidebar-stat:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.sidebar-stat:first-child {
    padding-top: 0;
}

.sidebar-stat-label {
    color: var(--t-text-muted);
}

.sidebar-stat-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.category-filter {
    margin-bottom: var(--t-space-4);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-10);
    color: var(--t-text-muted);
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: var(--t-space-4);
    opacity: 0.5;
}

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
    margin-bottom: var(--t-space-2);
}

.history-name {
    font-weight: var(--t-font-semibold);
}

.history-amount {
    font-family: var(--t-font-mono);
}

.history-details {
    display: flex;
    gap: var(--t-space-4);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.history-status {
    text-transform: capitalize;
    font-weight: var(--t-font-semibold);
}

.history-status.repaid {
    color: var(--t-success);
}

.history-status.defaulted {
    color: var(--t-danger);
}

.history-status.refinanced {
    color: var(--t-info);
}

/* Dialog Styles */
.apply-dialog-content,
.refinance-dialog-content {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

.loan-summary {
    display: flex;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
}

.loan-summary-icon {
    font-size: 2rem;
    color: var(--t-text-secondary);
}

.loan-summary h3 {
    margin: 0 0 var(--t-space-1) 0;
    font-size: var(--t-font-size-lg);
}

.loan-summary p {
    margin: 0;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.amount-selector {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.amount-selector label {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-medium);
}

.amount-display {
    display: flex;
    justify-content: space-between;
    margin-top: var(--t-space-2);
}

.amount-value {
    font-size: var(--t-font-size-xl);
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
    color: var(--t-success);
}

.amount-range {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.loan-terms {
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-3);
}

.term-row {
    display: flex;
    justify-content: space-between;
    padding: var(--t-space-1) 0;
    font-size: var(--t-font-size-sm);
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--t-space-2);
    margin-top: var(--t-space-2);
}

/* Responsive */
@media (max-width: 900px) {
    .loans-layout {
        grid-template-columns: 1fr;
    }

    .loans-sidebar {
        order: 1;
    }

    .loans-main {
        order: 0;
    }
}
</style>
