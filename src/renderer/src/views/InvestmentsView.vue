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
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Slider from 'primevue/slider'
import Dialog from 'primevue/dialog'
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
            <div class="card-grid">
                <div v-for="inv in pendingInvestments" :key="inv.id" class="investment-card success-card">
                    <div class="card-header">
                        <div class="card-title">
                            <AppIcon :icon="inv.icon" class="card-icon" />
                            <span>{{ inv.name }}</span>
                            <Tag v-if="inv.isHotDeal" :value="$t('investments.hot')" severity="danger"
                                class="hot-tag" />
                        </div>
                        <Tag :value="inv.status" severity="success" />
                    </div>
                    <div class="card-stats">
                        <span>{{ $t('investments.invested') }} <strong class="text-gold">{{
                            formatCash(inv.investedAmount) }}</strong></span>
                        <span>{{ $t('investments.return_label') }} <strong class="text-emerald">{{ inv.returnMultiplier
                        }}x</strong></span>
                    </div>
                    <div class="success-result">
                        <p>{{ $t('investments.returns') }} <strong class="text-emerald">{{
                            formatCash(mul(inv.investedAmount, inv.returnMultiplier)) }}</strong></p>
                        <Button :label="$t('investments.collect_returns')" icon="pi pi-wallet" severity="success"
                            @click="collectReturns(inv.id)" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Active Investments -->
        <section v-if="startups.activeInvestments.length" class="section">
            <h2 class="section-header">
                <AppIcon icon="mdi:progress-clock" class="section-icon text-sky" />
                {{ $t('investments.active_investments') }}
            </h2>
            <div class="card-grid">
                <div v-for="inv in startups.activeInvestments" :key="inv.id" class="investment-card">
                    <div class="card-header">
                        <div class="card-title">
                            <AppIcon :icon="inv.icon" class="card-icon" />
                            <span>{{ inv.name }}</span>
                            <Tag v-if="inv.isHotDeal" :value="$t('investments.hot')" severity="danger"
                                class="hot-tag" />
                        </div>
                        <Tag :value="inv.status" severity="secondary" />
                    </div>
                    <div class="card-stats">
                        <span>{{ $t('investments.invested') }} <strong class="text-gold">{{
                            formatCash(inv.investedAmount) }}</strong></span>
                        <span>{{ $t('investments.success') }} <strong class="text-sky">{{ formatRate(inv.successChance *
                            100)
                                }}</strong></span>
                        <span>{{ $t('investments.return_label') }} <strong class="text-emerald">{{
                            inv.returnMultiplier.toFixed(1)
                                }}x</strong></span>
                    </div>
                    <div class="progress-section">
                        <div class="progress-info">
                            <span>{{ $t('investments.maturity_progress') }}</span>
                            <span>{{ formatTime(getInvestmentTimeLeft(inv)) }} {{ $t('investments.left') }}</span>
                        </div>
                        <ProgressBar :value="getInvestmentProgress(inv)" :showValue="false" class="maturity-progress" />
                    </div>
                </div>
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
                <div v-for="opp in startups.opportunities" :key="opp.id" class="opp-card"
                    :class="{ 'opp-card--hot': opp.isHotDeal }" :style="{ '--_accent': SECTORS[opp.sector].color }">

                    <!-- Top row: icon + name + stage -->
                    <div class="opp-card__head">
                        <AppIcon :icon="SECTORS[opp.sector].icon" class="opp-card__icon" />
                        <div class="opp-card__identity">
                            <div class="opp-card__name-row">
                                <span class="opp-card__name">{{ opp.name }}</span>
                                <span v-if="opp.isHotDeal" class="opp-card__hot">
                                    <AppIcon icon="mdi:fire" /> {{ $t('investments.hot') }}
                                </span>
                            </div>
                            <span class="opp-card__tagline">{{ opp.tagline }}</span>
                        </div>
                        <span class="opp-card__stage" :class="`opp-card__stage--${opp.stage}`">{{ STAGES[opp.stage].name
                            }}</span>
                    </div>

                    <!-- Meta row: sector + timer -->
                    <div class="opp-card__meta">
                        <span class="opp-card__sector">{{ SECTORS[opp.sector].name }}</span>
                        <span class="opp-card__timer"
                            :class="{ 'opp-card__timer--urgent': getOpportunityTimeLeft(opp) < 600 }">
                            <AppIcon icon="mdi:clock-outline" />
                            {{ formatTime(getOpportunityTimeLeft(opp)) }}
                        </span>
                    </div>

                    <!-- Traits row -->
                    <div v-if="opp.traits.length" class="opp-card__traits">
                        <span v-for="trait in opp.traits" :key="trait" class="opp-card__trait"
                            :class="getTraitData(trait).isPositive ? 'opp-card__trait--pos' : 'opp-card__trait--neg'">
                            <AppIcon :icon="getTraitData(trait).icon" />
                            {{ getTraitData(trait).name }}
                        </span>
                    </div>

                    <!-- Stats grid -->
                    <div class="opp-card__stats">
                        <div class="opp-card__kpi">
                            <span class="opp-card__kpi-label">{{ $t('investments.investment') }}</span>
                            <span class="opp-card__kpi-value opp-card__kpi-value--gold">
                                {{ formatCash(D(opp.minInvestment)) }}&thinsp;–&thinsp;{{
                                    formatCash(D(opp.maxInvestment)) }}
                            </span>
                        </div>
                        <div class="opp-card__kpi">
                            <span class="opp-card__kpi-label">{{ $t('investments.success') }}</span>
                            <!-- Phase 0: nothing -->
                            <span v-if="getPhaseIndex(opp) === 0"
                                class="opp-card__kpi-value opp-card__kpi-value--muted">
                                {{ $t('investments.unknown_success') }}
                            </span>
                            <!-- Phase 1 (basic): approximate range -->
                            <span v-else-if="getPhaseIndex(opp) === 1"
                                class="opp-card__kpi-value opp-card__kpi-value--blue">
                                ~{{ formatRate(Math.max(0, opp.baseSuccessChance - 0.10) * 100) }}–{{
                                    formatRate(Math.min(1, opp.baseSuccessChance + 0.10) * 100) }}
                            </span>
                            <!-- Phase 2+ (detailed/deep): exact -->
                            <span v-else class="opp-card__kpi-value opp-card__kpi-value--blue">
                                {{ formatRate(opp.baseSuccessChance * 100) }}
                            </span>
                        </div>
                        <div class="opp-card__kpi">
                            <span class="opp-card__kpi-label">{{ $t('investments.return_label') }}</span>
                            <span class="opp-card__kpi-value opp-card__kpi-value--green">
                                {{ opp.baseReturnMultiplier.toFixed(1) }}x
                            </span>
                        </div>
                    </div>

                    <!-- Research reveals (risk rating & founder score) -->
                    <div v-if="getPhaseIndex(opp) >= 2" class="opp-card__reveals">
                        <div class="opp-card__reveal-item">
                            <AppIcon icon="mdi:shield-alert" />
                            <span class="opp-card__reveal-label">{{ $t('investments.risk_rating') }}</span>
                            <span class="opp-card__reveal-value"
                                :class="opp.hiddenRiskRating >= 4 ? 'text-red' : opp.hiddenRiskRating >= 3 ? 'text-gold' : 'text-emerald'">
                                {{ opp.hiddenRiskRating }}/5
                            </span>
                        </div>
                        <div v-if="getPhaseIndex(opp) >= 3" class="opp-card__reveal-item">
                            <AppIcon icon="mdi:account-star" />
                            <span class="opp-card__reveal-label">{{ $t('investments.founder_score') }}</span>
                            <span class="opp-card__reveal-value"
                                :class="opp.hiddenFounderScore >= 70 ? 'text-emerald' : opp.hiddenFounderScore >= 40 ? 'text-gold' : 'text-red'">
                                {{ opp.hiddenFounderScore }}/100
                            </span>
                        </div>
                    </div>

                    <!-- Research Phase Indicator -->
                    <div class="opp-card__research">
                        <div class="research-phases">
                            <div v-for="(phase, idx) in RESEARCH_PHASES.slice(1)" :key="phase"
                                class="research-phase-dot" :class="{
                                    'research-phase-dot--done': getPhaseIndex(opp) > idx,
                                    'research-phase-dot--current': getPhaseIndex(opp) === idx,
                                    'research-phase-dot--locked': getPhaseIndex(opp) < idx
                                }" :title="RESEARCH_PHASE_DATA[phase].name">
                                <AppIcon :icon="RESEARCH_PHASE_DATA[phase].icon" />
                            </div>
                            <span v-if="getPhaseIndex(opp) > 0" class="research-phase-label">
                                {{ RESEARCH_PHASE_DATA[opp.researchPhase].name }}
                            </span>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="opp-card__actions">
                        <Button v-if="getPhaseIndex(opp) < RESEARCH_PHASES.length - 1" :label="$t('investments.research_phase', {
                            phase: RESEARCH_PHASE_DATA[RESEARCH_PHASES[getPhaseIndex(opp) + 1]].name,
                            cost: formatCash(D(opp.researchCosts[RESEARCH_PHASES[getPhaseIndex(opp) + 1]]))
                        })" icon="pi pi-search" severity="secondary" size="small"
                            :disabled="!gte(player.cash, D(opp.researchCosts[RESEARCH_PHASES[getPhaseIndex(opp) + 1]]))"
                            @click="doResearch(opp.id)" class="opp-card__btn" />
                        <span v-else class="opp-card__research-complete">
                            <AppIcon icon="mdi:check-decagram" />
                            {{ $t('investments.fully_researched') }}
                        </span>
                        <Button :label="$t('investments.invest')" icon="pi pi-send" size="small"
                            :disabled="!gte(player.cash, D(opp.minInvestment))" @click="openInvestDialog(opp)"
                            class="opp-card__btn opp-card__btn--primary" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Investment History -->
        <section v-if="startups.completedInvestments.length" class="section">
            <h2 class="section-header">
                <AppIcon icon="mdi:history" class="section-icon" />
                {{ $t('investments.history') }}
            </h2>
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
        </section>

        <!-- Investment Dialog -->
        <Dialog v-model:visible="showInvestDialog" modal :header="$t('investments.dialog_title')"
            :style="{ width: '450px' }">
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
                        :max="Math.min(selectedOpp.maxInvestment, player.cash.toNumber())" :step="1000" />
                </div>

                <div class="dialog-potential">
                    <span>{{ $t('investments.potential_returns') }}</span>
                    <strong class="text-emerald">{{ formatCash(D(investAmount * selectedOpp.baseReturnMultiplier))
                    }}</strong>
                </div>
            </div>

            <template #footer>
                <Button :label="$t('common.cancel')" severity="secondary" @click="showInvestDialog = false" />
                <Button :label="$t('investments.confirm_investment')" icon="pi pi-check" @click="confirmInvest" />
            </template>
        </Dialog>

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
    font-size: 1.1rem;
}

.section-icon {
    font-size: 1.3rem;
}

.section-icon.text-emerald {
    color: var(--t-success);
}

.section-icon.text-sky {
    color: var(--t-info);
}

.section-icon.text-gold {
    color: var(--t-warn);
}

.opp-count {
    font-weight: normal;
    opacity: 0.6;
    font-size: 0.9rem;
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
    background: var(--t-surface-alt);
    border-radius: var(--t-radius-md);
    font-size: 0.9rem;
}

.refresh-icon {
    color: var(--t-surface-alt);
}

.refresh-progress {
    flex: 1;
    height: 6px;
}

/* Card Grids */
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--t-space-4);
}

/* Opportunity Grid */
.opp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: var(--t-space-4);
}

/* ─── Opportunity Card ─── */
.opp-card {
    --_accent: var(--t-accent);
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4) var(--t-space-4) var(--t-space-4) calc(var(--t-space-4) + 4px);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    box-shadow: var(--t-shadow-sm);
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.opp-card:hover {
    border-color: var(--t-border-hover);
    box-shadow: var(--t-shadow-sm);
}

.opp-card--hot {
    background: color-mix(in srgb, var(--t-danger) 3%, var(--t-bg-card));
}

/* Head */
.opp-card__head {
    display: flex;
    align-items: flex-start;
    gap: var(--t-space-3);
}

.opp-card__icon {
    font-size: 1.5rem;
    color: var(--_accent);
    flex-shrink: 0;
    margin-top: 1px;
}

.opp-card__identity {
    flex: 1;
    min-width: 0;
}

.opp-card__name-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.opp-card__name {
    font-weight: 600;
    font-size: var(--t-font-size-base);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.opp-card__hot {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-danger);
    flex-shrink: 0;
}

.opp-card__tagline {
    display: block;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
}

.opp-card__stage {
    flex-shrink: 0;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--t-bg-muted);
    color: var(--t-text-secondary);
}

.opp-card__stage--seed {
    background: var(--t-danger-muted);
    color: var(--t-danger);
}

.opp-card__stage--angel {
    background: var(--t-warning-muted);
    color: var(--t-warning);
}

.opp-card__stage--seriesA {
    background: var(--t-info-muted);
    color: var(--t-info);
}

.opp-card__stage--seriesB {
    background: var(--t-info-muted);
    color: var(--t-info);
}

.opp-card__stage--preIPO {
    background: var(--t-success-muted);
    color: var(--t-success);
}

/* Meta row */
.opp-card__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.opp-card__sector {
    opacity: 0.8;
}

.opp-card__timer {
    display: inline-flex;
    align-items: center;
    gap: 3px;
}

.opp-card__timer--urgent {
    color: var(--t-danger);
    font-weight: 600;
}

/* Traits */
.opp-card__traits {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.opp-card__trait {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 0.68rem;
    font-weight: 500;
    line-height: 1.5;
}

.opp-card__trait--pos {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.opp-card__trait--neg {
    background: var(--t-danger-muted);
    color: var(--t-danger);
}

/* Stats */
.opp-card__stats {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.opp-card__kpi {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.opp-card__kpi:not(:first-child) {
    text-align: right;
    padding-left: var(--t-space-3);
    border-left: 1px solid var(--t-border);
}

.opp-card__kpi-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
}

.opp-card__kpi-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
}

.opp-card__kpi-value--gold {
    color: var(--t-warning);
}

.opp-card__kpi-value--blue {
    color: var(--t-info);
}

.opp-card__kpi-value--green {
    color: var(--t-success);
}

.opp-card__kpi-value--muted {
    color: var(--t-text-muted);
}

/* Research reveals (risk rating, founder score) */
.opp-card__reveals {
    display: flex;
    gap: var(--t-space-3);
    padding: var(--t-space-2) var(--t-space-3);
    background: color-mix(in srgb, var(--_accent) 5%, var(--t-bg-muted));
    border-radius: var(--t-radius-sm);
    border-left: 2px solid var(--_accent);
}

.opp-card__reveal-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    font-size: var(--t-font-size-xs);
}

.opp-card__reveal-label {
    color: var(--t-text-muted);
}

.opp-card__reveal-value {
    font-family: var(--t-font-mono);
    font-weight: 600;
}

/* Research phase indicator */
.opp-card__research {
    display: flex;
    align-items: center;
}

.research-phases {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.research-phase-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 0.75rem;
    border: 2px solid var(--t-border);
    color: var(--t-text-muted);
    transition: all var(--t-transition-normal);
}

.research-phase-dot--done {
    background: var(--t-success);
    border-color: var(--t-success);
    color: #fff;
}

.research-phase-dot--current {
    border-color: var(--t-accent);
    color: var(--t-accent);
    animation: phase-pulse 2s ease-in-out infinite;
}

.research-phase-dot--locked {
    opacity: 0.35;
}

@keyframes phase-pulse {

    0%,
    100% {
        box-shadow: 0 0 0 0 transparent;
    }

    50% {
        box-shadow: 0 0 6px 1px color-mix(in srgb, var(--t-accent) 40%, transparent);
    }
}

.research-phase-label {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--t-text-secondary);
    margin-left: var(--t-space-1);
}

.opp-card__research-complete {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-success);
}

/* Actions */
.opp-card__actions {
    display: flex;
    gap: var(--t-space-2);
    justify-content: flex-end;
    margin-top: auto;
}

.opp-card__btn {
    font-size: var(--t-font-size-xs) !important;
}

.opp-card__btn--primary {
    font-weight: 600;
}

/* Investment Cards */
.investment-card {
    background: var(--t-surface-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-4);
    box-shadow: var(--t-shadow-sm);
}

.investment-card.success-card {
    background: color-mix(in srgb, var(--t-success) 5%, var(--t-surface-card));
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--t-space-3);
}

.card-title {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-weight: 600;
}

.card-icon {
    font-size: 1.3rem;
    color: var(--t-info);
}

.hot-tag {
    font-size: 0.65rem;
}

.card-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-3);
    font-size: 0.85rem;
    margin-bottom: var(--t-space-3);
}

.progress-section {
    margin-top: var(--t-space-3);
}

.progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    margin-bottom: var(--t-space-1);
    opacity: 0.8;
}

.maturity-progress {
    height: 8px;
}

.success-result {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--t-space-3);
    padding-top: var(--t-space-3);
    border-top: 1px solid var(--t-border);
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
    background: var(--t-surface-alt);
    border-radius: var(--t-radius-sm);
    font-size: 0.85rem;
}

.history-item.failed {
    opacity: 0.7;
}

.history-icon {
    font-size: 1.1rem;
    opacity: 0.6;
}

.history-name {
    flex: 1;
}

.history-amount {
    color: var(--t-gold);
}

.history-return {
    font-weight: 600;
    min-width: 80px;
    text-align: right;
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: var(--t-space-8);
    opacity: 0.6;
}

.empty-icon {
    font-size: 3rem;
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
    font-size: 2.5rem;
}

.dialog-opp-info h3 {
    margin: 0;
}

.dialog-opp-info p {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.7;
}

.dialog-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--t-space-3);
    background: var(--t-surface-alt);
    padding: var(--t-space-3);
    border-radius: var(--t-radius-md);
}

.dialog-stat {
    text-align: center;
}

.dialog-stat span {
    display: block;
    font-size: 0.75rem;
    opacity: 0.7;
    margin-bottom: 4px;
}

.invest-slider-section {
    padding: var(--t-space-3);
    background: var(--t-surface-alt);
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
    background: color-mix(in srgb, var(--t-success) 10%, var(--t-surface-alt));
    border-radius: var(--t-radius-md);
}

/* Color utilities */
.text-emerald {
    color: var(--t-success);
}

.text-gold {
    color: var(--t-warn);
}

.text-sky {
    color: var(--t-info);
}

.text-red {
    color: var(--t-danger);
}
</style>
