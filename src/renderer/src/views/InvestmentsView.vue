<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStartupStore, type StartupInvestment } from '@renderer/stores/useStartupStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { D, mul, gte } from '@renderer/core/BigNum'
import { gameEngine } from '@renderer/core/GameEngine'
import { useOnTick } from '@renderer/composables/useGameLoop'
import AppIcon from '@renderer/components/AppIcon.vue'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import { EventImpactBanner } from '@renderer/components/events'
import Tag from 'primevue/tag'
import Slider from 'primevue/slider'
import { UButton, UCard, UModal, UTooltip, UAccordion } from '@renderer/components/ui'
import ProgressBar from 'primevue/progressbar'
import {
    SECTORS,
    STAGES,
    TRAITS,
    RESEARCH_PHASES,
    RESEARCH_PHASE_DATA,
    type StartupOpportunity,
    type StartupTrait,
    OPPORTUNITY_REFRESH_TICKS
} from '@renderer/data/startups'

const startups = useStartupStore()
const player = usePlayerStore()
const { formatCash, formatRate, formatTime } = useFormat()
const { t } = useI18n()

// Live tick counter
const currentTick = ref(gameEngine.currentTick)
useOnTick('investments-tick', (ctx) => {
    currentTick.value = ctx.tick
})

// Initialize opportunities on mount
onMounted(() => {
    if (startups.opportunities.length === 0) {
        startups.refreshOpportunities(currentTick.value, true)
    }
})

// Selected opportunity for investment dialog
const selectedOpp = ref<StartupOpportunity | null>(null)
const investAmount = ref(0)
const showInvestDialog = ref(false)

// Countdown timer for refresh
const refreshCountdown = computed(() => {
    const remaining = startups.lastRefreshTick + OPPORTUNITY_REFRESH_TICKS - currentTick.value
    return Math.max(0, Math.floor(remaining / 10)) // Convert ticks to seconds
})

const refreshProgress = computed(() => {
    const elapsed = currentTick.value - startups.lastRefreshTick
    return Math.min(100, (elapsed / OPPORTUNITY_REFRESH_TICKS) * 100)
})

// Pending investments
const pendingInvestments = computed(() =>
    startups.investments.filter(i => i.status === 'succeeded')
)

// Status badge helper
function statusSeverity(status: string): 'info' | 'success' | 'danger' | 'warn' | 'secondary' {
    switch (status) {
        case 'active': return 'info'
        case 'succeeded': return 'success'
        case 'failed': return 'danger'
        case 'exited': return 'warn'
        default: return 'secondary'
    }
}

// Open investment dialog
function openInvestDialog(opp: StartupOpportunity): void {
    selectedOpp.value = opp
    investAmount.value = opp.minInvestment
    showInvestDialog.value = true
}

// Confirm investment
function confirmInvest(): void {
    if (!selectedOpp.value) return
    const success = startups.invest(
        selectedOpp.value.id,
        D(investAmount.value),
        currentTick.value
    )
    if (success) {
        showInvestDialog.value = false
        selectedOpp.value = null
    }
}

// Perform multi-phase research (new system)
function doResearch(oppId: string): void {
    startups.performResearch(oppId)
}

// Research phase index for a given opportunity
function getPhaseIndex(opp: StartupOpportunity): number {
    return RESEARCH_PHASES.indexOf(opp.researchPhase ?? 'none')
}

// Collect returns
function collectReturns(investmentId: string): void {
    startups.exitInvestment(investmentId)
}

// Get trait data for display
function getTraitData(trait: StartupTrait) {
    return TRAITS[trait]
}

// Calculate opportunity time remaining
function getOpportunityTimeLeft(opp: StartupOpportunity): number {
    const remaining = opp.expiresAtTick - currentTick.value
    return Math.max(0, Math.floor(remaining / 10)) // seconds
}

// Calculate investment progress
function getInvestmentProgress(inv: StartupInvestment): number {
    const elapsed = currentTick.value - inv.investedAtTick
    return Math.min(100, (elapsed / inv.maturityTicks) * 100)
}

function getInvestmentTimeLeft(inv: StartupInvestment): number {
    const remaining = inv.maturityTicks - (currentTick.value - inv.investedAtTick)
    return Math.max(0, Math.floor(remaining / 10))
}

const investInfoSections = computed<InfoSection[]>(() => [
    {
        title: t('investments.info.opportunities.title'),
        icon: 'mdi:lightbulb-outline',
        entries: [
            { term: t('investments.info.opportunities.refresh'), desc: t('investments.info.opportunities.refresh_desc'), icon: 'mdi:timer-sand' },
            { term: t('investments.info.opportunities.expiry'), desc: t('investments.info.opportunities.expiry_desc'), icon: 'mdi:clock-alert-outline' },
            { term: t('investments.info.opportunities.sectors'), desc: t('investments.info.opportunities.sectors_desc'), icon: 'mdi:shape-outline' },
            { term: t('investments.info.opportunities.traits'), desc: t('investments.info.opportunities.traits_desc'), icon: 'mdi:tag-multiple' },
        ],
    },
    {
        title: t('investments.info.research.title'),
        icon: 'mdi:magnify',
        entries: [
            { term: t('investments.info.research.quick_scan'), desc: t('investments.info.research.quick_scan_desc'), icon: 'mdi:eye-outline' },
            { term: t('investments.info.research.due_diligence'), desc: t('investments.info.research.due_diligence_desc'), icon: 'mdi:file-search-outline' },
            { term: t('investments.info.research.deep_analysis'), desc: t('investments.info.research.deep_analysis_desc'), icon: 'mdi:microscope' },
        ],
    },
    {
        title: t('investments.info.stages.title'),
        icon: 'mdi:stairs',
        entries: [
            { term: t('investments.info.stages.seed'), desc: t('investments.info.stages.seed_desc'), icon: 'mdi:sprout' },
            { term: t('investments.info.stages.series_a'), desc: t('investments.info.stages.series_a_desc'), icon: 'mdi:alpha-a-circle-outline' },
            { term: t('investments.info.stages.series_b'), desc: t('investments.info.stages.series_b_desc'), icon: 'mdi:alpha-b-circle-outline' },
            { term: t('investments.info.stages.series_c'), desc: t('investments.info.stages.series_c_desc'), icon: 'mdi:alpha-c-circle-outline' },
            { term: t('investments.info.stages.pre_ipo'), desc: t('investments.info.stages.pre_ipo_desc'), icon: 'mdi:rocket-launch' },
        ],
    },
    {
        title: t('investments.info.investing.title'),
        icon: 'mdi:cash-check',
        entries: [
            { term: t('investments.info.investing.invest'), desc: t('investments.info.investing.invest_desc'), icon: 'mdi:cash-plus' },
            { term: t('investments.info.investing.maturity'), desc: t('investments.info.investing.maturity_desc'), icon: 'mdi:progress-clock' },
            { term: t('investments.info.investing.success'), desc: t('investments.info.investing.success_desc'), icon: 'mdi:check-circle' },
            { term: t('investments.info.investing.failure'), desc: t('investments.info.investing.failure_desc'), icon: 'mdi:close-circle' },
        ],
    },
    {
        title: t('investments.info.modifiers.title'),
        icon: 'mdi:tune-vertical',
        entries: [
            { term: t('investments.info.modifiers.skill_tree'), desc: t('investments.info.modifiers.skill_tree_desc'), icon: 'mdi:file-tree' },
            { term: t('investments.info.modifiers.events'), desc: t('investments.info.modifiers.events_desc'), icon: 'mdi:calendar-alert' },
            { term: t('investments.info.modifiers.prestige'), desc: t('investments.info.modifiers.prestige_desc'), icon: 'mdi:crown' },
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
                    <AppIcon icon="mdi:rocket-launch" class="page-title-icon" />
                    {{ $t('investments.title') }}
                </h1>
                <p class="page-subtitle">{{ $t('investments.subtitle') }}</p>
            </div>
        </div>

        <!-- Event Impact -->
        <EventImpactBanner route-name="investments" />

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('investments.active') }}</span>
                <span class="stat-chip-value text-sky">{{ startups.activeInvestments.length }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('investments.win_rate') }}</span>
                <span class="stat-chip-value text-emerald">{{ formatRate(startups.winRate) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('investments.total_invested') }}</span>
                <span class="stat-chip-value text-gold">{{ formatCash(startups.totalInvested) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('investments.total_returns') }}</span>
                <span class="stat-chip-value text-emerald">{{ formatCash(startups.totalReturned) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('investments.net_profit') }}</span>
                <span class="stat-chip-value" :class="startups.netProfit.gte(0) ? 'text-emerald' : 'text-red'">
                    {{ formatCash(startups.netProfit) }}
                </span>
            </div>
        </div>

        <!-- Refresh Timer -->
        <div class="refresh-timer-section">
            <div class="refresh-timer">
                <AppIcon icon="mdi:refresh" class="refresh-icon" />
                <span>{{ $t('investments.new_opps_in') }}<strong>{{ formatTime(refreshCountdown) }}</strong></span>
                <ProgressBar :value="refreshProgress" :showValue="false" class="refresh-progress" />
            </div>
        </div>

        <!-- Pending Collection -->
        <section v-if="pendingInvestments.length" class="section">
            <h2 class="section-header">
                <AppIcon icon="mdi:check-circle" class="section-icon text-emerald" />
                {{ $t('investments.ready_collect') }}
            </h2>
            <div class="collect-grid">
                <UCard v-for="inv in pendingInvestments" :key="inv.id" class="collect-card" borderStatus="success"
                    :size="'md'">
                    <div class="collect-card__left">
                        <div class="collect-card__check-circle">
                            <AppIcon icon="mdi:check-bold" />
                        </div>
                    </div>
                    <div class="collect-card__center">
                        <div class="collect-card__name-row">
                            <AppIcon :icon="inv.icon" class="collect-card__sector-icon" />
                            <span class="collect-card__name">{{ inv.name }}</span>
                            <Tag v-if="inv.isHotDeal" :value="$t('investments.hot')" severity="danger" />
                        </div>
                        <div class="collect-card__flow">
                            <span class="collect-card__amount">
                                {{ formatCash(inv.investedAmount) }}
                            </span>
                            <span class="collect-card__arrow">
                                <AppIcon icon="mdi:chevron-triple-right" />
                            </span>
                            <span class="collect-card__profit">
                                {{ formatCash(mul(inv.investedAmount, inv.returnMultiplier)) }}
                            </span>
                            <span class="collect-card__mult">
                                {{ inv.returnMultiplier }}x
                            </span>
                        </div>
                    </div>
                    <div class="collect-card__right">
                        <UButton variant="success" icon="mdi:wallet" @click="collectReturns(inv.id)">
                            {{ $t('investments.collect_returns') }}
                        </UButton>
                    </div>
                </UCard>
            </div>
        </section>

        <!-- Active Investments -->
        <section v-if="startups.activeInvestments.length" class="section">
            <h2 class="section-header">
                <AppIcon icon="mdi:progress-clock" class="section-icon text-sky" />
                {{ $t('investments.active_investments') }}
            </h2>
            <div class="inv-grid">
                <UCard v-for="inv in startups.activeInvestments" :key="inv.id" class="inv-card" :size="'md'">
                    <!-- Circular Progress Ring -->
                    <div class="inv-card__ring-wrap">
                        <svg class="inv-card__ring" viewBox="0 0 88 88">
                            <circle class="inv-card__ring-track" cx="44" cy="44" r="36" />
                            <circle class="inv-card__ring-fill" cx="44" cy="44" r="36" :stroke-dasharray="226.2"
                                :stroke-dashoffset="226.2 * (1 - getInvestmentProgress(inv) / 100)" />
                        </svg>
                        <span class="inv-card__ring-pct">{{ getInvestmentProgress(inv).toFixed(0)
                            }}<small>%</small></span>
                    </div>
                    <!-- Info -->
                    <div class="inv-card__info">
                        <div class="inv-card__header">
                            <div class="inv-card__name-row">
                                <AppIcon :icon="inv.icon" class="inv-card__icon" />
                                <span class="inv-card__name">{{ inv.name }}</span>
                                <Tag v-if="inv.isHotDeal" :value="$t('investments.hot')" severity="danger" />
                            </div>
                            <Tag :value="inv.status" severity="info" />
                        </div>
                        <div class="inv-card__metrics">
                            <div class="inv-card__metric">
                                <span class="inv-card__metric-lbl">{{ $t('investments.invested') }}</span>
                                <span class="inv-card__metric-val text-gold">{{ formatCash(inv.investedAmount) }}</span>
                            </div>
                            <div class="inv-card__metric">
                                <span class="inv-card__metric-lbl">{{ $t('investments.success') }}</span>
                                <span class="inv-card__metric-val text-sky">{{ formatRate(inv.successChance * 100)
                                    }}</span>
                            </div>
                            <div class="inv-card__metric">
                                <span class="inv-card__metric-lbl">{{ $t('investments.return_label') }}</span>
                                <span class="inv-card__metric-val text-emerald">{{ inv.returnMultiplier.toFixed(1)
                                    }}x</span>
                            </div>
                        </div>
                        <div class="inv-card__time">
                            <AppIcon icon="mdi:clock-outline" />
                            <span>{{ formatTime(getInvestmentTimeLeft(inv)) }} {{ $t('investments.left') }}</span>
                            <div class="inv-card__bar">
                                <div class="inv-card__bar-fill" :style="{ width: getInvestmentProgress(inv) + '%' }" />
                            </div>
                        </div>
                    </div>
                </UCard>
            </div>
        </section>

        <!-- Available Opportunities -->
        <section class="section">
            <h2 class="section-header">
                <AppIcon icon="mdi:lightbulb-on" class="section-icon text-gold" />
                {{ $t('investments.available_opps') }}
                <span class="opp-count">({{ startups.opportunities.length }})</span>
            </h2>

            <div v-if="startups.opportunities.length === 0" class="empty-state">
                <AppIcon icon="mdi:timer-sand" class="empty-icon" />
                <p>{{ $t('investments.waiting_opps') }}</p>
            </div>

            <div v-else class="opp-grid">
                <article v-for="opp in startups.opportunities" :key="opp.id" class="opp-card"
                    :class="{ 'opp-card--hot': opp.isHotDeal }" :style="{ '--_ac': SECTORS[opp.sector].color }">

                    <!-- Gradient header band -->
                    <div class="opp-card__header">
                        <div class="opp-card__header-top">
                            <div class="opp-card__identity">
                                <div class="opp-card__icon-wrap">
                                    <AppIcon :icon="SECTORS[opp.sector].icon" />
                                </div>
                                <div class="opp-card__titles">
                                    <h3 class="opp-card__name">
                                        {{ opp.name }}
                                        <span v-if="opp.isHotDeal" class="opp-card__fire">
                                            <AppIcon icon="mdi:fire" />
                                        </span>
                                    </h3>
                                    <p class="opp-card__tagline">{{ opp.tagline }}</p>
                                </div>
                            </div>
                            <span class="opp-card__stage" :class="`opp-card__stage--${opp.stage}`">
                                {{ STAGES[opp.stage].name }}
                            </span>
                        </div>
                        <div class="opp-card__badges">
                            <span class="opp-card__sector-badge">
                                <AppIcon :icon="SECTORS[opp.sector].icon" />
                                {{ SECTORS[opp.sector].name }}
                            </span>
                            <UTooltip v-for="trait in opp.traits" :key="trait"
                                :text="getTraitData(trait).description ?? getTraitData(trait).name" placement="bottom">
                                <span class="opp-card__trait"
                                    :class="getTraitData(trait).isPositive ? 'opp-card__trait--pos' : 'opp-card__trait--neg'">
                                    <AppIcon :icon="getTraitData(trait).icon" />
                                    {{ getTraitData(trait).name }}
                                </span>
                            </UTooltip>
                        </div>
                    </div>

                    <!-- Card body -->
                    <div class="opp-card__body">
                        <!-- KPI tiles -->
                        <div class="opp-card__kpis">
                            <div class="opp-card__kpi">
                                <span class="opp-card__kpi-val kpi--cash">
                                    {{ formatCash(D(opp.minInvestment)) }}&thinsp;&ndash;&thinsp;{{
                                        formatCash(D(opp.maxInvestment)) }}
                                </span>
                                <span class="opp-card__kpi-lbl">{{ $t('investments.investment') }}</span>
                            </div>
                            <div class="opp-card__kpi opp-card__kpi--hero">
                                <span class="opp-card__kpi-val kpi--return">
                                    {{ opp.baseReturnMultiplier.toFixed(1) }}x
                                </span>
                                <span class="opp-card__kpi-lbl">{{ $t('investments.return_label') }}</span>
                            </div>
                            <div class="opp-card__kpi">
                                <span v-if="getPhaseIndex(opp) === 0" class="opp-card__kpi-val kpi--hidden">? ? ?</span>
                                <span v-else-if="getPhaseIndex(opp) === 1" class="opp-card__kpi-val kpi--range">
                                    ~{{ formatRate(Math.max(0, opp.baseSuccessChance - 0.10) * 100) }}&ndash;{{
                                        formatRate(Math.min(1, opp.baseSuccessChance + 0.10) * 100) }}
                                </span>
                                <span v-else class="opp-card__kpi-val kpi--exact">
                                    {{ formatRate(opp.baseSuccessChance * 100) }}
                                </span>
                                <span class="opp-card__kpi-lbl">{{ $t('investments.success') }}</span>
                            </div>
                        </div>

                        <!-- Success gauge (phase >= 2) -->
                        <div v-if="getPhaseIndex(opp) >= 2" class="opp-card__gauge">
                            <div class="opp-card__gauge-fill" :style="{ width: (opp.baseSuccessChance * 100) + '%' }"
                                :class="opp.baseSuccessChance >= 0.5 ? 'gauge--hi'
                                    : opp.baseSuccessChance >= 0.25 ? 'gauge--mid' : 'gauge--lo'" />
                        </div>

                        <!-- Intel chips -->
                        <div v-if="getPhaseIndex(opp) >= 2" class="opp-card__intel">
                            <div class="opp-card__intel-tag">
                                <AppIcon icon="mdi:shield-alert" />
                                <span>{{ $t('investments.risk_rating') }}</span>
                                <strong
                                    :class="opp.hiddenRiskRating >= 4 ? 'text-red' : opp.hiddenRiskRating >= 3 ? 'text-gold' : 'text-emerald'">
                                    {{ opp.hiddenRiskRating }}/5
                                </strong>
                            </div>
                            <div v-if="getPhaseIndex(opp) >= 3" class="opp-card__intel-tag">
                                <AppIcon icon="mdi:account-star" />
                                <span>{{ $t('investments.founder_score') }}</span>
                                <strong
                                    :class="opp.hiddenFounderScore >= 70 ? 'text-emerald' : opp.hiddenFounderScore >= 40 ? 'text-gold' : 'text-red'">
                                    {{ opp.hiddenFounderScore }}/100
                                </strong>
                            </div>
                        </div>

                        <!-- Research stepper -->
                        <div class="opp-card__research">
                            <div class="opp-card__steps">
                                <template v-for="(phase, idx) in RESEARCH_PHASES.slice(1)" :key="phase">
                                    <div v-if="idx > 0" class="opp-card__connector"
                                        :class="{ 'opp-card__connector--done': getPhaseIndex(opp) > idx }" />
                                    <div class="opp-card__step" :class="{
                                        'opp-card__step--done': getPhaseIndex(opp) > idx,
                                        'opp-card__step--current': getPhaseIndex(opp) === idx,
                                        'opp-card__step--locked': getPhaseIndex(opp) < idx
                                    }">
                                        <div class="opp-card__step-dot">
                                            <AppIcon
                                                :icon="getPhaseIndex(opp) > idx ? 'mdi:check' : RESEARCH_PHASE_DATA[phase].icon" />
                                        </div>
                                        <span class="opp-card__step-name">{{ RESEARCH_PHASE_DATA[phase].name }}</span>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="opp-card__footer">
                        <div class="opp-card__timer"
                            :class="{ 'opp-card__timer--urgent': getOpportunityTimeLeft(opp) < 600 }">
                            <AppIcon icon="mdi:clock-outline" />
                            <span>{{ formatTime(getOpportunityTimeLeft(opp)) }}</span>
                        </div>
                        <div class="opp-card__actions">
                            <UButton v-if="getPhaseIndex(opp) < RESEARCH_PHASES.length - 1" variant="ghost" size="xs"
                                icon="mdi:magnify"
                                :disabled="!gte(player.cash, D(opp.researchCosts[RESEARCH_PHASES[getPhaseIndex(opp) + 1]]))"
                                @click="doResearch(opp.id)">
                                {{ $t('investments.research_phase', {
                                    phase: RESEARCH_PHASE_DATA[RESEARCH_PHASES[getPhaseIndex(opp) + 1]].name,
                                    cost: formatCash(D(opp.researchCosts[RESEARCH_PHASES[getPhaseIndex(opp) + 1]]))
                                }) }}
                            </UButton>
                            <span v-else class="opp-card__fully-done">
                                <AppIcon icon="mdi:check-decagram" />
                                {{ $t('investments.fully_researched') }}
                            </span>
                            <UButton variant="primary" size="xs" icon="mdi:send"
                                :disabled="!gte(player.cash, D(opp.minInvestment))" @click="openInvestDialog(opp)">
                                {{ $t('investments.invest') }}
                            </UButton>
                        </div>
                    </div>
                </article>
            </div>
        </section>

        <!-- Investment History -->
        <section v-if="startups.completedInvestments.length" class="section">
            <UAccordion :title="$t('investments.history')" icon="mdi:history"
                :badge="startups.completedInvestments.length" variant="muted">
                <div class="history-grid">
                    <div v-for="inv in startups.completedInvestments.slice(-20).reverse()" :key="inv.id"
                        class="history-item" :class="inv.status">
                        <AppIcon :icon="inv.icon" class="history-icon" />
                        <span class="history-name">{{ inv.name }}</span>
                        <span class="history-amount">{{ formatCash(inv.investedAmount) }}</span>
                        <Tag :value="inv.status" :severity="statusSeverity(inv.status)" size="small" />
                        <span v-if="inv.status === 'exited'" class="history-return text-emerald">
                            +{{ formatCash(mul(inv.investedAmount, inv.returnMultiplier - 1)) }}
                        </span>
                        <span v-else-if="inv.status === 'failed'" class="history-return text-red">
                            -{{ formatCash(inv.investedAmount) }}
                        </span>
                    </div>
                </div>
            </UAccordion>
        </section>

        <!-- Investment Dialog -->
        <UModal v-model="showInvestDialog" :title="$t('investments.dialog_title')" icon="mdi:rocket-launch" size="md">
            <div v-if="selectedOpp" class="invest-dialog">
                <div class="dialog-opp-info">
                    <AppIcon :icon="SECTORS[selectedOpp.sector].icon" class="dialog-icon"
                        :style="{ color: SECTORS[selectedOpp.sector].color }" />
                    <div>
                        <h3>{{ selectedOpp.name }}</h3>
                        <p>{{ selectedOpp.tagline }}</p>
                    </div>
                </div>

                <div class="dialog-stats">
                    <div class="dialog-stat">
                        <span>{{ $t('investments.min_investment') }}</span>
                        <strong>{{ formatCash(D(selectedOpp.minInvestment)) }}</strong>
                    </div>
                    <div class="dialog-stat">
                        <span>{{ $t('investments.max_investment') }}</span>
                        <strong>{{ formatCash(D(selectedOpp.maxInvestment)) }}</strong>
                    </div>
                    <div class="dialog-stat">
                        <span>{{ $t('investments.potential_return') }}</span>
                        <strong class="text-emerald">{{ selectedOpp.baseReturnMultiplier.toFixed(1) }}x</strong>
                    </div>
                </div>

                <div class="invest-slider-section">
                    <label>{{ $t('investments.investment_amount') }} <strong class="text-gold">{{
                        formatCash(D(investAmount))
                            }}</strong></label>
                    <Slider v-model="investAmount" :min="selectedOpp.minInvestment"
                        :max="Math.min(selectedOpp.maxInvestment, player.cash.toNumber())" :step="1" />
                </div>

                <div class="dialog-potential">
                    <span>{{ $t('investments.potential_returns') }}</span>
                    <strong class="text-emerald">{{ formatCash(D(investAmount * selectedOpp.baseReturnMultiplier))
                        }}</strong>
                </div>
            </div>

            <template #footer>
                <UButton variant="ghost" @click="showInvestDialog = false">{{ $t('common.cancel') }}</UButton>
                <UButton variant="primary" icon="mdi:check" @click="confirmInvest">
                    {{ $t('investments.confirm_investment') }}
                </UButton>
            </template>
        </UModal>

        <!-- Info Panel -->
        <InfoPanel :title="$t('investments.info_title')" :description="$t('investments.info_desc')"
            :sections="investInfoSections" />
    </div>
</template>

<style scoped>
.section {
    margin-bottom: var(--t-space-8);
}

.section-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    margin-bottom: var(--t-space-4);
    font-size: var(--t-font-size-lg);
}

.section-icon {
    font-size: var(--t-font-size-xl);
}

.section-icon.text-emerald {
    color: var(--t-success);
}

.section-icon.text-sky {
    color: var(--t-info);
}

.section-icon.text-gold {
    color: var(--t-warning);
}

.opp-count {
    font-weight: normal;
    opacity: var(--t-opacity-muted);
    font-size: var(--t-font-size-base);
}

/* Refresh Timer */
.refresh-timer-section {
    margin-bottom: var(--t-space-6);
}

.refresh-timer {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    font-size: var(--t-font-size-base);
}

.refresh-icon {
    color: var(--t-text);
}

.refresh-progress {
    flex: 1;
    height: var(--t-space-1-5);
}

/* ═══════════════════════════════════════════════════════════════
   OPPORTUNITY CARDS — "Venture Dossier" design
   ═══════════════════════════════════════════════════════════════ */

.opp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: var(--t-space-5);
}

.opp-card {
    --_ac: var(--t-accent);
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: var(--t-radius-lg);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    overflow: hidden;
    transition: transform var(--t-transition-slow), box-shadow var(--t-transition-slow);
}

.opp-card:hover {
    transform: translateY(-3px);
    /* box-shadow:
        0 12px 40px -12px color-mix(in srgb, var(--_ac) 18%, rgba(0, 0, 0, 0.4)),
        0 0 0 1px color-mix(in srgb, var(--_ac) 20%, transparent); */
}

/* Hot deal */
.opp-card--hot {
    border: 1.5px solid transparent;
    background:
        linear-gradient(var(--t-bg-card), var(--t-bg-card)) padding-box,
        linear-gradient(135deg, var(--t-danger), var(--t-warning), var(--t-danger)) border-box;
    animation: opp-hot-glow 3s ease-in-out infinite alternate;
}

@keyframes opp-hot-glow {
    from {
        box-shadow: 0 0 12px -4px color-mix(in srgb, var(--t-danger) 20%, transparent);
    }

    to {
        box-shadow: 0 0 24px -4px color-mix(in srgb, var(--t-danger) 35%, transparent);
    }
}

/* --- Header band with gradient tint --- */
.opp-card__header {
    padding: var(--t-space-4) var(--t-space-5) var(--t-space-3);
    background: var(--t-bg-card);
    border-bottom: 1px solid color-mix(in srgb, var(--_ac) 10%, var(--t-border));
}

.opp-card__header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--t-space-3);
    margin-bottom: var(--t-space-3);
}

.opp-card__identity {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    min-width: 0;
}

.opp-card__icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: var(--t-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--_ac) 15%, transparent);
    color: var(--_ac);
    font-size: var(--t-font-size-2xl);
    flex-shrink: 0;
    box-shadow: 0 0 20px -6px color-mix(in srgb, var(--_ac) 30%, transparent);
}

.opp-card__titles {
    min-width: 0;
}

.opp-card__name {
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-xl);
    letter-spacing: -0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
}

.opp-card__fire {
    color: var(--t-danger);
    font-size: var(--t-font-size-lg);
    animation: fire-dance 1.5s ease-in-out infinite;
}

@keyframes fire-dance {

    0%,
    100% {
        transform: scale(1) rotate(-5deg);
    }

    50% {
        transform: scale(1.15) rotate(5deg);
    }
}

.opp-card__tagline {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    font-style: italic;
    margin: 2px 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Stage badge */
.opp-card__stage {
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-bold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: var(--t-space-0-5) var(--t-space-2);
    border-radius: var(--t-radius-sm);
    flex-shrink: 0;
    white-space: nowrap;
    border: 1px solid transparent;
}

.opp-card__stage--seed {
    background: var(--t-danger-muted);
    color: var(--t-danger);
    border-color: color-mix(in srgb, var(--t-danger) 20%, transparent);
}

.opp-card__stage--seriesA {
    background: var(--t-orange-muted);
    color: var(--t-orange);
    border-color: color-mix(in srgb, var(--t-orange) 20%, transparent);
}

.opp-card__stage--seriesB {
    background: var(--t-blue-muted);
    color: var(--t-blue);
    border-color: color-mix(in srgb, var(--t-blue) 20%, transparent);
}

.opp-card__stage--seriesC {
    background: var(--t-purple-muted);
    color: var(--t-purple);
    border-color: color-mix(in srgb, var(--t-purple) 20%, transparent);
}

.opp-card__stage--preIPO {
    background: var(--t-success-muted);
    color: var(--t-success);
    border-color: color-mix(in srgb, var(--t-success) 20%, transparent);
}

/* Badges row */
.opp-card__badges {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--t-space-1-5);
}

.opp-card__sector-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-1);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--_ac);
    background: color-mix(in srgb, var(--_ac) 10%, transparent);
    padding: var(--t-space-0-5) var(--t-space-2);
    border-radius: var(--t-radius-full);
}

.opp-card__trait {
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-0-5);
    padding: var(--t-space-0-5) var(--t-space-2);
    border-radius: var(--t-radius-full);
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-semibold);
    line-height: 1.5;
    cursor: default;
}

.opp-card__trait--pos {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.opp-card__trait--neg {
    background: var(--t-danger-muted);
    color: var(--t-danger);
}

/* --- Card body --- */
.opp-card__body {
    padding: var(--t-space-4) var(--t-space-5);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    flex: 1;
}

/* KPI tiles */
.opp-card__kpis {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 0;
    border-radius: var(--t-radius-lg);
    overflow: hidden;
    border: 1px solid var(--t-border);
}

.opp-card__kpi {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-1);
    padding: var(--t-space-3) var(--t-space-2);
    background: var(--t-bg-muted);
    min-width: 0;
}

.opp-card__kpi--hero {
    background: var(--t-bg-muted);
    border-left: 1px solid var(--t-border);
    border-right: 1px solid var(--t-border);
}

.opp-card__kpi-val {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    white-space: nowrap;
    font-size: var(--t-font-size-sm);
}

.opp-card__kpi-lbl {
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--t-text-muted);
    white-space: nowrap;
}

.kpi--cash {
    color: var(--t-gold);
}

.kpi--return {
    color: var(--t-success);
    font-size: var(--t-font-size-2xl);
    text-shadow: 0 0 16px color-mix(in srgb, var(--t-success) 30%, transparent);
}

.kpi--hidden {
    color: var(--t-text-muted);
    letter-spacing: 0.2em;
}

.kpi--range {
    color: var(--t-blue);
    font-size: var(--t-font-size-xs);
}

.kpi--exact {
    color: var(--t-blue);
}

/* Success gauge */
.opp-card__gauge {
    height: 5px;
    border-radius: var(--t-radius-full);
    background: color-mix(in srgb, var(--t-text-muted) 12%, transparent);
    overflow: hidden;
}

.opp-card__gauge-fill {
    height: 100%;
    border-radius: var(--t-radius-full);
    transition: width 0.6s cubic-bezier(.4, 0, .2, 1);
}

.gauge--hi {
    background: var(--t-success);
}

.gauge--mid {
    background: var(--t-warning);
}

.gauge--lo {
    background: var(--t-danger);
}

/* Intel tags */
.opp-card__intel {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-2);
}

.opp-card__intel-tag {
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-1);
    font-size: var(--t-font-size-xs);
    padding: var(--t-space-1) var(--t-space-2);
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
}

.opp-card__intel-tag span {
    color: var(--t-text-muted);
}

.opp-card__intel-tag strong {
    font-family: var(--t-font-mono);
}

/* Research stepper */
.opp-card__research {
    padding-top: var(--t-space-1);
}

.opp-card__steps {
    display: flex;
    align-items: center;
    gap: 0;
}

.opp-card__connector {
    flex: 1;
    height: 2px;
    background: var(--t-border);
    min-width: var(--t-space-3);
    transition: background var(--t-transition-slow);
}

.opp-card__connector--done {
    background: var(--t-success);
}

.opp-card__step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-1);
    position: relative;
}

.opp-card__step-dot {
    width: 30px;
    height: 30px;
    border-radius: var(--t-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--t-font-size-xs);
    border: 2px solid var(--t-border);
    background: var(--t-bg-card);
    color: var(--t-text-muted);
    transition: all var(--t-transition-slow);
}

.opp-card__step--done .opp-card__step-dot {
    background: var(--t-success);
    border-color: var(--t-success);
    color: var(--t-text-inverse);
}

.opp-card__step--current .opp-card__step-dot {
    border-color: var(--_ac);
    color: var(--_ac);
    /* box-shadow: 0 0 0 4px color-mix(in srgb, var(--_ac) 15%, transparent); */
    /* animation: step-pulse 2s ease-in-out infinite; */
}

.opp-card__step--locked .opp-card__step-dot {
    opacity: var(--t-opacity-disabled);
}

/* @keyframes step-pulse {

    0%,
    100% {
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--_ac) 15%, transparent);
    }

    50% {
        box-shadow: 0 0 0 8px color-mix(in srgb, var(--_ac) 8%, transparent);
    }
} */

.opp-card__step-name {
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-muted);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.opp-card__step--done .opp-card__step-name {
    color: var(--t-success);
}

.opp-card__step--current .opp-card__step-name {
    color: var(--_ac);
}

/* --- Footer --- */
.opp-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-3) var(--t-space-5);
    margin-top: auto;
    border-top: 1px solid var(--t-border);
    background: color-mix(in srgb, var(--t-bg-muted) 50%, transparent);
}

.opp-card__timer {
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-1);
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
}

.opp-card__timer--urgent {
    color: var(--t-danger);
    font-weight: var(--t-font-bold);
    animation: urgent-blink 1.2s ease-in-out infinite;
}

@keyframes urgent-blink {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.4;
    }
}

.opp-card__actions {
    display: flex;
    gap: var(--t-space-2);
    align-items: center;
}

.opp-card__fully-done {
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-1);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-success);
}

/* ═══════════════════════════════════════════════════════════════
   ACTIVE INVESTMENT CARDS — "Live Monitor" with ring
   ═══════════════════════════════════════════════════════════════ */

.inv-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: var(--t-space-4);
}

.inv-card {
    display: flex;
    align-items: stretch;
    gap: var(--t-space-4);
    flex-direction: row;
}

.inv-card:hover {
    border-color: color-mix(in srgb, var(--t-info) 30%, var(--t-border));
    box-shadow: var(--t-shadow-md);
}

/* SVG Ring */
.inv-card__ring-wrap {
    position: relative;
    width: 88px;
    height: 88px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.inv-card__ring {
    width: 88px;
    height: 88px;
    transform: rotate(-90deg);
}

.inv-card__ring-track {
    fill: none;
    stroke: var(--t-bg-muted);
    stroke-width: 5;
}

.inv-card__ring-fill {
    fill: none;
    stroke: var(--t-blue);
    stroke-width: 5;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.6s cubic-bezier(.4, 0, .2, 1);
}

.inv-card__ring-pct {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    color: var(--t-blue);
}

.inv-card__ring-pct small {
    font-size: var(--t-font-size-2xs);
    opacity: var(--t-opacity-subtle);
}

/* Info panel */
.inv-card__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    min-width: 0;
}

.inv-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.inv-card__name-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    min-width: 0;
}

.inv-card__icon {
    font-size: var(--t-font-size-lg);
    opacity: var(--t-opacity-muted);
}

.inv-card__name {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-base);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.inv-card__metrics {
    display: flex;
    gap: var(--t-space-4);
    flex-wrap: wrap;
}

.inv-card__metric {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-px);
}

.inv-card__metric-lbl {
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--t-text-muted);
}

.inv-card__metric-val {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
}

.inv-card__time {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin-top: auto;
}

.inv-card__bar {
    flex: 1;
    height: 4px;
    border-radius: var(--t-radius-full);
    background: var(--t-bg-muted);
    overflow: hidden;
}

.inv-card__bar-fill {
    height: 100%;
    border-radius: var(--t-radius-full);
    background: var(--t-blue);
    transition: width var(--t-transition-slow);
}

/* ═══════════════════════════════════════════════════════════════
   COLLECTION CARDS — "Payday" with success glow
   ═══════════════════════════════════════════════════════════════ */

.collect-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
    gap: var(--t-space-4);
}

.collect-card {
    display: flex;
    align-items: center;
    gap: var(--t-space-4);
    flex-direction: row;
    background: color-mix(in srgb, var(--t-success) 4%, var(--t-bg-card));
    box-shadow: 0 0 24px -8px color-mix(in srgb, var(--t-success) 15%, transparent);
    animation: collect-glow 2.5s ease-in-out infinite alternate;
}

@keyframes collect-glow {
    from {
        box-shadow: 0 0 16px -8px color-mix(in srgb, var(--t-success) 15%, transparent);
    }

    to {
        box-shadow: 0 0 32px -8px color-mix(in srgb, var(--t-success) 25%, transparent);
    }
}

.collect-card__left {
    flex-shrink: 0;
}

.collect-card__check-circle {
    width: 44px;
    height: 44px;
    border-radius: var(--t-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--t-success);
    color: var(--t-text-inverse);
    font-size: var(--t-font-size-2xl);
    box-shadow: 0 0 12px color-mix(in srgb, var(--t-success) 40%, transparent);
}

.collect-card__center {
    flex: 1;
    min-width: 0;
}

.collect-card__name-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    margin-bottom: var(--t-space-1);
}

.collect-card__sector-icon {
    font-size: var(--t-font-size-lg);
    opacity: var(--t-opacity-muted);
}

.collect-card__name {
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-base);
}

.collect-card__flow {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.collect-card__amount {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.collect-card__arrow {
    color: var(--t-success);
    font-size: var(--t-font-size-base);
    animation: arrow-slide 1.5s ease-in-out infinite;
}

@keyframes arrow-slide {

    0%,
    100% {
        transform: translateX(0);
    }

    50% {
        transform: translateX(3px);
    }
}

.collect-card__profit {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-success);
}

.collect-card__mult {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--t-success);
    background: var(--t-success-muted);
    padding: var(--t-space-px) var(--t-space-1-5);
    border-radius: var(--t-radius-sm);
}

.collect-card__right {
    flex-shrink: 0;
}

/* History */
.history-grid {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    max-height: 300px;
    overflow-y: auto;
}

.history-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-sm);
}

.history-item.failed {
    opacity: var(--t-opacity-subtle);
}

.history-icon {
    font-size: var(--t-font-size-lg);
    opacity: var(--t-opacity-muted);
}

.history-name {
    flex: 1;
}

.history-amount {
    color: var(--t-gold);
}

.history-return {
    font-weight: var(--t-font-semibold);
    min-width: var(--t-space-16);
    text-align: right;
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: var(--t-space-8);
    color: var(--t-text-muted);
}

.empty-icon {
    font-size: var(--t-font-size-4xl);
    margin-bottom: var(--t-space-3);
}

/* Dialog */
.invest-dialog {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

.dialog-opp-info {
    display: flex;
    gap: var(--t-space-3);
    align-items: center;
}

.dialog-icon {
    font-size: var(--t-font-size-4xl);
}

.dialog-opp-info h3 {
    margin: 0;
}

.dialog-opp-info p {
    margin: 0;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.dialog-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--t-space-3);
    background: var(--t-bg-muted);
    padding: var(--t-space-3);
    border-radius: var(--t-radius-md);
}

.dialog-stat {
    text-align: center;
}

.dialog-stat span {
    display: block;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin-bottom: var(--t-space-1);
}

.invest-slider-section {
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
}

.invest-slider-section label {
    display: block;
    margin-bottom: var(--t-space-3);
}

.dialog-potential {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-3);
    background: color-mix(in srgb, var(--t-success) 10%, var(--t-bg-muted));
    border-radius: var(--t-radius-md);
}

/* Color utilities */
.text-emerald {
    color: var(--t-success);
}

.text-gold {
    color: var(--t-warning);
}

.text-sky {
    color: var(--t-info);
}

.text-red {
    color: var(--t-danger);
}
</style>
