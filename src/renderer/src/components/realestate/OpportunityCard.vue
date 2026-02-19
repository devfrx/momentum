<script setup lang="ts">
/**
 * OpportunityCard — Immersive real estate deal card
 *
 * Redesigned from scratch with:
 *  • Grade-driven visual theming (accent border/glow per grade)
 *  • UCard component for structure
 *  • Dynamic computed metrics (ROI, payback, daily income)
 *  • Progressive reveal via scouting phases
 *  • Responsive layout using CSS variables
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import {
    getLocationGrade,
    SCOUT_PHASES,
    SCOUT_PHASE_DATA,
    PROPERTY_TEMPLATES,
    type PropertyOpportunity,
    type ScoutPhase,
} from '@renderer/data/realestate'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UCard, UButton, UTooltip } from '@renderer/components/ui'
import Tag from 'primevue/tag'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const player = usePlayerStore()
const { formatCash, formatPercent } = useFormat()

const props = defineProps<{ opportunity: PropertyOpportunity }>()
const emit = defineEmits<{ (e: 'bought', propId: string): void }>()

// ── Grade theming ──
const gradeData = computed(() => getLocationGrade(props.opportunity.locationGrade))
const gradeAccent = computed(() => gradeData.value?.color ?? 'var(--t-accent)')

// ── Template reference ──
const template = computed(() =>
    PROPERTY_TEMPLATES.find((tp) => tp.id === props.opportunity.templateId),
)

// ── Affordability ──
const canAfford = computed(() => player.cash.gte(props.opportunity.askingPrice))

// ── Scouting state ──
const currentScoutIdx = computed(() => SCOUT_PHASES.indexOf(props.opportunity.scoutPhase))
const nextScoutPhase = computed<ScoutPhase | null>(() => {
    const idx = currentScoutIdx.value
    return idx >= SCOUT_PHASES.length - 1 ? null : SCOUT_PHASES[idx + 1]
})
const nextScoutCost = computed(() =>
    nextScoutPhase.value ? props.opportunity.scoutCosts[nextScoutPhase.value] : 0,
)
const canAffordScout = computed(() => player.cash.gte(nextScoutCost.value))

// ── Progressive reveal gates ──
const showTraits = computed(() => currentScoutIdx.value >= 1)
const showDetailedStats = computed(() => currentScoutIdx.value >= 2)
const showTrueValue = computed(() => currentScoutIdx.value >= 3)

// ── Deal quality ──
const isGoodDeal = computed(() => {
    if (!showTrueValue.value) return null
    return props.opportunity.trueValue.gte(props.opportunity.askingPrice)
})

const dealSpread = computed(() => {
    if (!showTrueValue.value) return 0
    const ask = props.opportunity.askingPrice.toNumber()
    const val = props.opportunity.trueValue.toNumber()
    return ask > 0 ? ((val - ask) / ask) * 100 : 0
})

// ── Traits ──
const traits = computed(() => (showTraits.value ? props.opportunity.traits : []))
const positiveTraitCount = computed(() => traits.value.filter((tr) => tr.isPositive).length)
const negativeTraitCount = computed(() => traits.value.filter((tr) => !tr.isPositive).length)

// ── Financial metrics ──
const TICKS_PER_SECOND = 10
const SECONDS_PER_DAY = 86_400

const grossRentPerSecond = computed(() => {
    const rent = props.opportunity.baseRent.toNumber()
    return rent * props.opportunity.units * TICKS_PER_SECOND
})

const maintenancePerSecond = computed(() => {
    const maint = props.opportunity.baseMaintenance.toNumber()
    return maint * props.opportunity.units * TICKS_PER_SECOND
})

const taxPerSecond = computed(() => {
    return grossRentPerSecond.value * props.opportunity.taxRate
})

const netRentPerSecond = computed(() => {
    return grossRentPerSecond.value - maintenancePerSecond.value - taxPerSecond.value
})

const dailyNetIncome = computed(() => {
    return netRentPerSecond.value * SECONDS_PER_DAY * 0.85 // ~85% avg occupancy
})

const paybackDays = computed(() => {
    if (dailyNetIncome.value <= 0) return Infinity
    return props.opportunity.askingPrice.toNumber() / dailyNetIncome.value
})

const paybackLabel = computed(() => {
    const d = paybackDays.value
    if (!isFinite(d)) return '\u221e'
    if (d < 1) {
        const hrs = d * 24
        if (hrs < 1) return `${Math.round(hrs * 60)}m`
        return `${hrs.toFixed(1)}h`
    }
    return `~${Math.ceil(d)}d`
})

// ── Appreciation ──
const dailyAppreciation = computed(() => {
    const rate = props.opportunity.baseAppreciationRate
    // (1 + rate)^144 - 1 (144 appreciation periods per day at 10min each)
    return (Math.pow(1 + rate, 144) - 1) * 100
})

// ── Condition quality ──
const conditionLabel = computed(() => {
    const c = props.opportunity.startingCondition
    if (c >= 90) return { color: 'var(--t-success)', icon: 'mdi:check-decagram' }
    if (c >= 70) return { color: 'var(--t-accent)', icon: 'mdi:check-circle' }
    if (c >= 50) return { color: 'var(--t-warning)', icon: 'mdi:alert-circle' }
    return { color: 'var(--t-danger)', icon: 'mdi:alert' }
})

// ── Max improvements from template ──
const maxImprovements = computed(() => template.value?.maxImprovements ?? 6)
const maxRenovation = computed(() => props.opportunity.maxRenovationLevel)

// ── Card border status ──
const borderStatus = computed(() => {
    if (props.opportunity.isHotDeal) return 'danger' as const
    if (props.opportunity.isScanned) return 'info' as const
    return 'none' as const
})

// ── Actions ──
function handleScout(): void {
    if (nextScoutPhase.value) realEstate.scoutOpportunity(props.opportunity.id, nextScoutPhase.value)
}

function handleBuy(): void {
    const prop = realEstate.buyProperty(props.opportunity.id, Date.now())
    if (prop) emit('bought', prop.id)
}
</script>

<template>
    <UCard variant="elevated" size="sm" radius="lg" :accent="gradeAccent" :border-status="borderStatus" class="opp-card"
        :class="{
            'opp-card--hot': opportunity.isHotDeal,
            'opp-card--scanned': opportunity.isScanned,
        }" :style="{ '--_grade': gradeAccent }">
        <!-- ═══ HEADER ═══ -->
        <template #header>
            <div class="opp-header">
                <!-- Icon + identity -->
                <div class="opp-header__left">
                    <div class="opp-icon-wrapper" :style="{ '--_icon-color': gradeAccent }">
                        <AppIcon :icon="opportunity.icon" class="opp-icon" />
                    </div>
                    <div class="opp-identity">
                        <div class="opp-name-row">
                            <span class="opp-name">{{ opportunity.name }}</span>
                            <span v-if="opportunity.isHotDeal" class="opp-hot-badge">
                                <AppIcon icon="mdi:fire" /> {{ t('realestate.opp.hot') }}
                            </span>
                        </div>
                        <div class="opp-meta">
                            <Tag :value="opportunity.category" size="small" severity="secondary" />
                            <span class="opp-grade" :style="{ color: gradeAccent }">
                                <AppIcon :icon="gradeData.icon" />
                                {{ t(gradeData.nameKey) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Price hero -->
                <div class="opp-price-hero">
                    <span class="opp-price-label">{{ t('realestate.asking_price') }}</span>
                    <span class="opp-price-value" :class="{ 'opp-price-value--hot': opportunity.isHotDeal }">
                        {{ formatCash(opportunity.askingPrice) }}
                    </span>
                    <span v-if="showTrueValue && dealSpread !== 0" class="opp-deal-spread"
                        :class="dealSpread > 0 ? 'opp-deal-spread--good' : 'opp-deal-spread--bad'">
                        <AppIcon :icon="dealSpread > 0 ? 'mdi:trending-up' : 'mdi:trending-down'" />
                        {{ dealSpread > 0 ? '+' : '' }}{{ dealSpread.toFixed(1) }}%
                    </span>
                </div>
            </div>
        </template>

        <!-- ═══ BODY ═══ -->

        <!-- ── Key Metrics Strip ── -->
        <div class="metrics-strip">
            <UTooltip :text="t('realestate.tip.base_rent')" placement="bottom">
                <div class="metric">
                    <AppIcon icon="mdi:cash-plus" class="metric-icon metric-icon--income" />
                    <div class="metric-content">
                        <span class="metric-value metric-value--income">{{ formatCash(grossRentPerSecond) }}/s</span>
                        <span class="metric-label">{{ t('realestate.gross_s') }}</span>
                    </div>
                </div>
            </UTooltip>

            <UTooltip :text="t('realestate.tip.units')" placement="bottom">
                <div class="metric">
                    <AppIcon icon="mdi:door" class="metric-icon" />
                    <div class="metric-content">
                        <span class="metric-value">{{ opportunity.units }}</span>
                        <span class="metric-label">{{ t('realestate.units') }}</span>
                    </div>
                </div>
            </UTooltip>

            <UTooltip :text="t('realestate.tip.roi')" placement="bottom">
                <div class="metric">
                    <AppIcon icon="mdi:calendar-clock" class="metric-icon" />
                    <div class="metric-content">
                        <span class="metric-value"
                            :class="paybackDays < 30 ? 'metric-value--income' : paybackDays === Infinity ? 'metric-value--expense' : ''">
                            {{ paybackLabel }}
                        </span>
                        <span class="metric-label">{{ t('realestate.roi') }}</span>
                    </div>
                </div>
            </UTooltip>

            <UTooltip v-if="showTrueValue" :text="t('realestate.tip.true_value')" placement="bottom">
                <div class="metric">
                    <AppIcon :icon="isGoodDeal ? 'mdi:check-decagram' : 'mdi:alert-circle'" class="metric-icon"
                        :class="isGoodDeal ? 'metric-icon--income' : 'metric-icon--expense'" />
                    <div class="metric-content">
                        <span class="metric-value"
                            :class="isGoodDeal ? 'metric-value--income' : 'metric-value--expense'">
                            {{ formatCash(opportunity.trueValue) }}
                        </span>
                        <span class="metric-label">{{ t('realestate.true_value') }}</span>
                    </div>
                </div>
            </UTooltip>
        </div>

        <!-- ── Financial Breakdown (revealed at inspection) ── -->
        <div v-if="showDetailedStats" class="financial-breakdown">
            <div class="fin-row">
                <div class="fin-item">
                    <span class="fin-label">
                        <AppIcon icon="mdi:cash-multiple" /> {{ t('realestate.net_income') }}/day
                    </span>
                    <span class="fin-value" :class="dailyNetIncome > 0 ? 'fin-value--pos' : 'fin-value--neg'">
                        {{ formatCash(Math.abs(dailyNetIncome)) }}
                    </span>
                </div>
                <div class="fin-item">
                    <span class="fin-label">
                        <AppIcon icon="mdi:calendar-clock" /> Payback
                    </span>
                    <span class="fin-value" :class="paybackDays < 30 ? 'fin-value--pos' : ''">
                        {{ paybackDays === Infinity ? '∞' : `~${Math.ceil(paybackDays)}d` }}
                    </span>
                </div>
            </div>
            <div class="fin-row">
                <div class="fin-item">
                    <span class="fin-label">
                        <AppIcon icon="mdi:trending-up" /> {{ t('realestate.appreciation') }}
                    </span>
                    <span class="fin-value fin-value--pos">+{{ dailyAppreciation.toFixed(1) }}%/day</span>
                </div>
                <div class="fin-item">
                    <span class="fin-label">
                        <AppIcon icon="mdi:tools" /> {{ t('realestate.expense') }}
                    </span>
                    <span class="fin-value fin-value--neg">{{ formatCash(maintenancePerSecond + taxPerSecond)
                    }}/s</span>
                </div>
            </div>
        </div>

        <!-- ── Condition & Property Stats (revealed at inspection) ── -->
        <div v-if="showDetailedStats" class="stats-row">
            <UTooltip :text="t('realestate.tip.condition')" placement="bottom">
                <div class="stat-pill" :style="{ '--_pill-color': conditionLabel.color }">
                    <AppIcon :icon="conditionLabel.icon" />
                    <span>{{ opportunity.startingCondition }}%</span>
                </div>
            </UTooltip>

            <div class="stat-pill">
                <AppIcon icon="mdi:hammer-wrench" />
                <span>{{ t('realestate.max_renovation') }} {{ maxRenovation }}</span>
            </div>

            <div class="stat-pill">
                <AppIcon icon="mdi:puzzle-plus" />
                <span>{{ maxImprovements }} slots</span>
            </div>

            <div class="stat-pill">
                <AppIcon icon="mdi:receipt-text-outline" />
                <span>{{ formatPercent(opportunity.taxRate * 100) }} tax</span>
            </div>
        </div>

        <!-- ── Traits ── -->
        <div v-if="traits.length > 0" class="trait-section">
            <div class="trait-list">
                <UTooltip v-for="tr in traits" :key="tr.id" :text="t(tr.descriptionKey)" placement="bottom">
                    <span class="trait-chip" :class="tr.isPositive ? 'trait-chip--pos' : 'trait-chip--neg'">
                        <AppIcon :icon="tr.icon" />
                        <span>{{ t(tr.nameKey) }}</span>
                    </span>
                </UTooltip>
            </div>
            <div v-if="traits.length > 1" class="trait-summary">
                <span v-if="positiveTraitCount > 0" class="trait-count trait-count--pos">
                    {{ positiveTraitCount }}
                    <AppIcon icon="mdi:thumb-up" />
                </span>
                <span v-if="negativeTraitCount > 0" class="trait-count trait-count--neg">
                    {{ negativeTraitCount }}
                    <AppIcon icon="mdi:thumb-down" />
                </span>
            </div>
        </div>

        <!-- ── Unscouted hint ── -->
        <div v-if="currentScoutIdx < 1" class="unscouted-hint">
            <AppIcon icon="mdi:eye-off-outline" />
            <span>{{ t('realestate.scout.hidden_info') }}</span>
        </div>

        <!-- ═══ FOOTER ═══ -->
        <template #footer>
            <div class="opp-footer">
                <!-- Scout segmented bar -->
                <div class="scout-bar">
                    <template v-for="(phase, idx) in SCOUT_PHASES.slice(1)" :key="phase">
                        <UTooltip :text="t(SCOUT_PHASE_DATA[phase].revealsKey || SCOUT_PHASE_DATA[phase].nameKey)"
                            placement="top">
                            <!-- idx+1 = full-array position (0='none' is skipped) -->
                            <button class="scout-seg" :class="{
                                'scout-seg--done': currentScoutIdx >= idx + 1,
                                'scout-seg--next': currentScoutIdx === idx && nextScoutPhase === phase,
                                'scout-seg--locked': currentScoutIdx < idx,
                            }" :disabled="nextScoutPhase !== phase || !canAffordScout"
                                @click="nextScoutPhase === phase && canAffordScout && handleScout()">
                                <AppIcon :icon="currentScoutIdx >= idx + 1
                                    ? 'mdi:check'
                                    : SCOUT_PHASE_DATA[phase].icon" class="scout-seg__icon" />
                                <span class="scout-seg__label">{{ t(SCOUT_PHASE_DATA[phase].nameKey) }}</span>
                                <span v-if="nextScoutPhase === phase" class="scout-seg__cost">{{
                                    formatCash(nextScoutCost) }}</span>
                            </button>
                        </UTooltip>
                    </template>
                </div>

                <!-- Buy button -->
                <UButton variant="primary" size="sm" :icon="canAfford ? 'mdi:cart' : 'mdi:lock'" :disabled="!canAfford"
                    class="buy-btn" @click="handleBuy">
                    {{ t('realestate.buy') }}
                    <span class="buy-price">{{ formatCash(opportunity.askingPrice) }}</span>
                </UButton>
            </div>
        </template>
    </UCard>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════
   OPPORTUNITY CARD — Grade-Themed Immersive Design
   ═══════════════════════════════════════════════════════════ */

.opp-card {
    --_grade: var(--t-accent);
    position: relative;
    overflow: hidden;
}

/* Hot deal subtle gradient shimmer */
.opp-card--hot::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
            color-mix(in srgb, var(--t-danger) 4%, transparent),
            transparent 60%);
    pointer-events: none;
    border-radius: inherit;
    z-index: 0;
}

/* Scanned accent glow */
.opp-card--scanned {
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--_grade) 20%, transparent);
}

/* ── Header ── */
.opp-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--t-space-3);
    width: 100%;
}

.opp-header__left {
    display: flex;
    align-items: flex-start;
    gap: var(--t-space-3);
    min-width: 0;
    flex: 1;
}

.opp-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: var(--t-radius-md);
    background: color-mix(in srgb, var(--_icon-color, var(--t-accent)) 10%, var(--t-bg-muted));
    border: 1px solid color-mix(in srgb, var(--_icon-color, var(--t-accent)) 20%, transparent);
    flex-shrink: 0;
}

.opp-icon {
    font-size: 1.2rem;
    color: var(--_icon-color, var(--t-accent));
}

.opp-identity {
    min-width: 0;
    flex: 1;
}

.opp-name-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.opp-name {
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.opp-hot-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    padding: 0.1rem 0.4rem;
    border-radius: var(--t-radius-xs);
    background: var(--t-danger);
    color: var(--t-text-inverse);
    font-size: 0.55rem;
    font-weight: var(--t-font-bold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    animation: hotPulse 2s ease-in-out infinite;
}

@keyframes hotPulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.75;
    }
}

.opp-meta {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    margin-top: 0.2rem;
}

.opp-grade {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
}

/* ── Price Hero ── */
.opp-price-hero {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
}

.opp-price-label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
}

.opp-price-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: 800;
    color: var(--t-warning);
    line-height: 1.2;
}

.opp-price-value--hot {
    color: var(--t-danger);
}

.opp-deal-spread {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    margin-top: 0.1rem;
}

.opp-deal-spread--good {
    color: var(--t-success);
}

.opp-deal-spread--bad {
    color: var(--t-danger);
}

/* ── Metrics Strip ── */
.metrics-strip {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-2);
}

.metric {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    padding: var(--t-space-1) var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    min-width: 0;
}

.metric-icon {
    font-size: 0.9rem;
    color: var(--t-text-muted);
    flex-shrink: 0;
}

.metric-icon--income {
    color: var(--t-success);
}

.metric-icon--expense {
    color: var(--t-danger);
}

.metric-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.metric-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    line-height: 1.2;
}

.metric-value--income {
    color: var(--t-success);
}

.metric-value--expense {
    color: var(--t-danger);
}

.metric-label {
    font-size: 0.6rem;
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

/* ── Financial Breakdown ── */
.financial-breakdown {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
    padding: var(--t-space-2) var(--t-space-3);
    background: color-mix(in srgb, var(--_grade) 3%, var(--t-bg-muted));
    border: 1px solid color-mix(in srgb, var(--_grade) 10%, var(--t-border));
    border-radius: var(--t-radius-md);
}

.fin-row {
    display: flex;
    gap: var(--t-space-3);
}

.fin-item {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-width: 0;
}

.fin-label {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.fin-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.fin-value--pos {
    color: var(--t-success);
}

.fin-value--neg {
    color: var(--t-danger);
}

/* ── Stats Row ── */
.stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.5rem;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-full);
    font-size: var(--t-font-size-xs);
    color: var(--_pill-color, var(--t-text-secondary));
}

/* ── Traits ── */
.trait-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.trait-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.trait-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.5rem;
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-medium);
    transition: transform var(--t-transition-fast);
}

.trait-chip:hover {
    transform: translateY(-1px);
}

.trait-chip--pos {
    background: var(--t-success-muted);
    color: var(--t-success);
    border: 1px solid color-mix(in srgb, var(--t-success) 15%, transparent);
}

.trait-chip--neg {
    background: var(--t-warning-muted);
    color: var(--t-warning);
    border: 1px solid color-mix(in srgb, var(--t-warning) 15%, transparent);
}

.trait-summary {
    display: flex;
    gap: var(--t-space-2);
    padding-left: var(--t-space-1);
}

.trait-count {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    font-size: 0.6rem;
    font-weight: var(--t-font-semibold);
}

.trait-count--pos {
    color: var(--t-success);
}

.trait-count--neg {
    color: var(--t-warning);
}

/* ── Unscouted Hint ── */
.unscouted-hint {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px dashed var(--t-border);
    border-radius: var(--t-radius-md);
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    font-style: italic;
}

/* ── Footer ── */
.opp-footer {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    width: 100%;
}

/* ── Scout Segmented Bar ── */
.scout-bar {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    width: 100%;
}

.scout-seg {
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-1);
    flex: 1;
    padding: var(--t-space-1) var(--t-space-2);
    border-radius: var(--t-radius-sm);
    border: 1px solid var(--t-border);
    background: var(--t-bg-muted);
    color: var(--t-text-muted);
    font-size: var(--t-font-size-xs);
    font-family: inherit;
    cursor: default;
    transition: all var(--t-transition-fast);
    white-space: nowrap;
    justify-content: center;
}

.scout-seg__icon {
    font-size: 0.8rem;
    flex-shrink: 0;
}

.scout-seg__label {
    font-weight: var(--t-font-semibold);
}

.scout-seg__cost {
    font-family: var(--t-font-mono);
    font-size: 0.6rem;
    opacity: 0.7;
}

/* Done — accent tint */
.scout-seg--done {
    border-color: color-mix(in srgb, var(--_grade) 40%, transparent);
    background: color-mix(in srgb, var(--_grade) 8%, var(--t-bg-muted));
    color: var(--_grade);
}

/* Next available — interactive */
.scout-seg--next {
    border-color: color-mix(in srgb, var(--_grade) 50%, var(--t-border));
    background: color-mix(in srgb, var(--_grade) 5%, var(--t-bg));
    color: var(--t-text);
    cursor: pointer;
}

.scout-seg--next:not(:disabled):hover {
    border-color: var(--_grade);
    background: color-mix(in srgb, var(--_grade) 12%, var(--t-bg));
}

.scout-seg--next:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

/* Locked — dimmed */
.scout-seg--locked {
    opacity: 0.3;
}

/* ── Buy Button ── */
.buy-btn {
    width: 100%;
}

.buy-price {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    margin-left: var(--t-space-1);
    opacity: 0.8;
}
</style>
