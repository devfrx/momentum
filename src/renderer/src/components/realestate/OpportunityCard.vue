<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { getDistrict, SCOUT_PHASES, SCOUT_PHASE_DATA, type PropertyOpportunity, type ScoutPhase } from '@renderer/data/realestate'
import AppIcon from '@renderer/components/AppIcon.vue'
import Tag from 'primevue/tag'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const player = usePlayerStore()
const { formatCash, formatPercent, formatRate } = useFormat()

const props = defineProps<{ opportunity: PropertyOpportunity }>()
const emit = defineEmits<{ (e: 'bought', propId: string): void }>()

const showDetails = ref(false)

const district = computed(() => getDistrict(props.opportunity.districtId))

const canAfford = computed(() => player.cash.gte(props.opportunity.askingPrice))
const currentScoutIdx = computed(() => SCOUT_PHASES.indexOf(props.opportunity.scoutPhase))
const nextScoutPhase = computed<ScoutPhase | null>(() => {
    const idx = currentScoutIdx.value
    return idx >= SCOUT_PHASES.length - 1 ? null : SCOUT_PHASES[idx + 1]
})
const nextScoutCost = computed(() => nextScoutPhase.value ? props.opportunity.scoutCosts[nextScoutPhase.value] : 0)
const canAffordScout = computed(() => player.cash.gte(nextScoutCost.value))

const showTraits = computed(() => currentScoutIdx.value >= 1)
const showTrueValue = computed(() => currentScoutIdx.value >= 3)
const showHiddenScores = computed(() => currentScoutIdx.value >= 2)

const isGoodDeal = computed(() => {
    if (!showTrueValue.value) return null
    return props.opportunity.trueValue.gte(props.opportunity.askingPrice)
})

const traits = computed(() => {
    if (!showTraits.value) return []
    return props.opportunity.traits
})

const estimatedRoi = computed(() => {
    const price = props.opportunity.askingPrice.toNumber()
    if (price <= 0) return 0
    return (props.opportunity.baseRent.toNumber() * props.opportunity.units * 10 * 3600 * 24 * 365) / price
})

const scanCostFormatted = computed(() => formatCash(nextScoutCost.value))

function handleScout(): void {
    if (nextScoutPhase.value) realEstate.scoutOpportunity(props.opportunity.id, nextScoutPhase.value)
}

function handleBuy(): void {
    const prop = realEstate.buyProperty(props.opportunity.id, Date.now())
    if (prop) emit('bought', prop.id)
}
</script>

<template>
    <div class="opp-card"
        :class="{ 'opp-card--hot': opportunity.isHotDeal, 'opp-card--scanned': opportunity.isScanned }"
        :style="{ '--_accent': district?.color ?? 'var(--t-accent)' }">

        <!-- ── Header ── -->
        <div class="opp-card__head">
            <AppIcon :icon="opportunity.icon" class="opp-card__icon" />
            <div class="opp-card__identity">
                <div class="opp-card__name-row">
                    <span class="opp-card__name">{{ opportunity.name }}</span>
                    <span v-if="opportunity.isHotDeal" class="opp-card__hot">
                        <AppIcon icon="mdi:fire" /> {{ t('realestate.opp.hot') }}
                    </span>
                </div>
                <div class="opp-card__meta">
                    <Tag :value="opportunity.category" size="small" severity="secondary" />
                    <span v-if="district" class="opp-card__district">
                        <AppIcon :icon="district.icon" /> {{ t(district.nameKey) }}
                    </span>
                </div>
            </div>
            <!-- Price hero -->
            <div class="opp-card__hero-price">
                <span class="opp-card__hero-label">{{ t('realestate.asking_price') }}</span>
                <span class="opp-card__hero-value">{{ formatCash(opportunity.askingPrice) }}</span>
            </div>
        </div>

        <!-- ── Quick stats chips ── -->
        <div class="opp-card__chips">
            <span class="chip chip--accent">
                <AppIcon icon="mdi:cash-plus" /> {{ formatCash(opportunity.baseRent) }}/t
            </span>
            <span class="chip">
                <AppIcon icon="mdi:door" /> {{ opportunity.units }} {{ t('realestate.units') }}
            </span>
            <span class="chip">
                <AppIcon icon="mdi:percent" /> ~{{ formatPercent(estimatedRoi) }} ROI
            </span>
            <span v-if="showTrueValue" class="chip" :class="isGoodDeal ? 'chip--pos' : 'chip--neg'">
                <AppIcon :icon="isGoodDeal ? 'mdi:check-circle' : 'mdi:alert'" />
                {{ formatCash(opportunity.trueValue) }}
            </span>
        </div>

        <!-- ── Traits ── -->
        <div v-if="traits.length > 0" class="opp-card__traits">
            <span v-for="tr in traits" :key="tr.id" class="opp-card__trait"
                :class="tr.isPositive ? 'opp-card__trait--pos' : 'opp-card__trait--neg'">
                <AppIcon :icon="tr.icon" /> {{ t(tr.nameKey) }}
            </span>
        </div>

        <!-- ── Hidden hint ── -->
        <div v-if="currentScoutIdx < 1" class="opp-card__hidden-hint">
            <AppIcon icon="mdi:eye-off-outline" />
            <span>{{ t('realestate.scout.hidden_info') }}</span>
        </div>

        <!-- ── Scout Phase Indicator + Action ── -->
        <div class="opp-card__scout-row">
            <div class="research-phases">
                <div v-for="(phase, idx) in SCOUT_PHASES" :key="phase" class="research-phase-dot" :class="{
                    'research-phase-dot--done': currentScoutIdx > idx,
                    'research-phase-dot--current': currentScoutIdx === idx,
                    'research-phase-dot--locked': currentScoutIdx < idx,
                }" :title="t(SCOUT_PHASE_DATA[phase].nameKey)">
                    <AppIcon :icon="SCOUT_PHASE_DATA[phase].icon" />
                </div>
                <span v-if="currentScoutIdx > 0" class="research-phase-label">
                    {{ t(SCOUT_PHASE_DATA[opportunity.scoutPhase].nameKey) }}
                </span>
            </div>
            <button v-if="nextScoutPhase" class="opp-card__scout-btn" :disabled="!canAffordScout" @click="handleScout">
                <AppIcon icon="mdi:magnify" />
                {{ t(SCOUT_PHASE_DATA[nextScoutPhase].nameKey) }}
                <span class="scout-cost">{{ scanCostFormatted }}</span>
            </button>
            <span v-else class="opp-card__research-complete">
                <AppIcon icon="mdi:check-decagram" /> {{ t('realestate.scout.appraisal') }}
            </span>
        </div>

        <!-- ── Buy action ── -->
        <button class="opp-card__buy-btn" :disabled="!canAfford" @click="handleBuy">
            <AppIcon icon="mdi:cart" />
            <span>{{ t('realestate.buy') }}</span>
            <span class="opp-card__buy-price">{{ formatCash(opportunity.askingPrice) }}</span>
        </button>

        <!-- ── Details toggle ── -->
        <button class="details-toggle" @click="showDetails = !showDetails">
            <AppIcon :icon="showDetails ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
            {{ showDetails ? t('common.less') : t('common.details') }}
        </button>

        <!-- ── Expandable Details ── -->
        <Transition name="slide">
            <div v-if="showDetails" class="details-panel">
                <!-- Hidden scores (inspection+) -->
                <div v-if="showHiddenScores" class="detail-section">
                    <h4 class="detail-title">
                        <AppIcon icon="mdi:clipboard-check-outline" /> {{ t('realestate.inspection_results') }}
                    </h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.neighborhood') }}</span>
                            <span class="d-value"
                                :class="opportunity.hiddenNeighborhoodScore >= 70 ? 'success' : opportunity.hiddenNeighborhoodScore >= 40 ? 'warn' : 'danger'">
                                {{ opportunity.hiddenNeighborhoodScore }}/100
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.structural') }}</span>
                            <span class="d-value"
                                :class="opportunity.hiddenStructuralScore >= 70 ? 'success' : opportunity.hiddenStructuralScore >= 40 ? 'warn' : 'danger'">
                                {{ opportunity.hiddenStructuralScore }}/100
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Property details -->
                <div class="detail-section">
                    <h4 class="detail-title">
                        <AppIcon icon="mdi:information-outline" /> {{ t('realestate.property_info') }}
                    </h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.condition') }}</span>
                            <span class="d-value">{{ opportunity.startingCondition }}%</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.wear_rate') }}</span>
                            <span class="d-value">{{ opportunity.wearRate.toFixed(4) }}/t</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.tax_rate') }}</span>
                            <span class="d-value">{{ formatRate(opportunity.taxRate * 100) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.appreciation') }}</span>
                            <span class="d-value success">{{ formatPercent(opportunity.baseAppreciationRate * 100)
                            }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.maintenance') }}</span>
                            <span class="d-value danger">{{ formatCash(opportunity.baseMaintenance) }}/t</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.max_renovation') }}</span>
                            <span class="d-value">Lv.{{ opportunity.maxRenovationLevel }}</span>
                        </div>
                    </div>
                </div>

                <!-- Scout costs breakdown -->
                <div class="detail-section">
                    <h4 class="detail-title">
                        <AppIcon icon="mdi:magnify" /> {{ t('realestate.scout_costs') }}
                    </h4>
                    <div class="detail-grid">
                        <div v-for="phase in SCOUT_PHASES.slice(1)" :key="phase" class="detail-item">
                            <span class="d-label">{{ t(SCOUT_PHASE_DATA[phase].nameKey) }}</span>
                            <span class="d-value"
                                :class="currentScoutIdx >= SCOUT_PHASES.indexOf(phase) ? 'success' : ''">
                                {{ currentScoutIdx >= SCOUT_PHASES.indexOf(phase) ? '✓' :
                                    formatCash(opportunity.scoutCosts[phase]) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.opp-card {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    box-shadow: var(--t-shadow-sm);
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.opp-card:hover {
    border-color: var(--t-border-hover);
    box-shadow: var(--t-shadow-md);
}

.opp-card--hot {
    background: color-mix(in srgb, var(--t-danger) 3%, var(--t-bg-card));
    border-color: color-mix(in srgb, var(--t-danger) 20%, var(--t-border));
}

.opp-card--scanned {
    border-color: color-mix(in srgb, var(--t-accent) 25%, var(--t-border));
}

/* ── Head ── */
.opp-card__head {
    display: flex;
    gap: var(--t-space-3);
    align-items: flex-start;
}

.opp-card__icon {
    font-size: 1.5rem;
    color: var(--_accent);
    flex-shrink: 0;
}

.opp-card__identity {
    flex: 1;
    min-width: 0;
}

.opp-card__name-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.opp-card__name {
    font-size: var(--t-font-size-base);
    font-weight: 700;
    color: var(--t-text);
}

.opp-card__hot {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    background: var(--t-danger);
    color: white;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.opp-card__meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.15rem;
}

.opp-card__district {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

/* ── Hero price ── */
.opp-card__hero-price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
}

.opp-card__hero-label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
}

.opp-card__hero-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: 800;
    color: var(--t-warning);
}

/* ── Chips ── */
.opp-card__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.45rem;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: 6px;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

.chip--accent {
    background: var(--t-success-muted);
    color: var(--t-success);
    border-color: color-mix(in srgb, var(--t-success) 20%, transparent);
}

.chip--pos {
    background: var(--t-success-muted);
    color: var(--t-success);
    border-color: color-mix(in srgb, var(--t-success) 20%, transparent);
}

.chip--neg {
    background: var(--t-danger-muted);
    color: var(--t-danger);
    border-color: color-mix(in srgb, var(--t-danger) 20%, transparent);
}

/* ── Traits ── */
.opp-card__traits {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.opp-card__trait {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    font-size: var(--t-font-size-xs);
    font-weight: 500;
}

.opp-card__trait--pos {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.opp-card__trait--neg {
    background: var(--t-warning-muted);
    color: var(--t-warning);
}

/* ── Hidden hint ── */
.opp-card__hidden-hint {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    font-style: italic;
}

/* ── Scout row ── */
.opp-card__scout-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--t-space-2);
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
    width: 26px;
    height: 26px;
    border-radius: 50%;
    font-size: 0.75rem;
    border: 2px solid var(--t-border);
    color: var(--t-text-muted);
    transition: all var(--t-transition-fast);
}

.research-phase-dot--done {
    border-color: var(--t-accent);
    color: var(--t-accent);
    background: color-mix(in srgb, var(--t-accent) 10%, transparent);
}

.research-phase-dot--current {
    border-color: var(--t-accent);
    color: var(--t-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--t-accent) 15%, transparent);
}

.research-phase-dot--locked {
    opacity: 0.4;
}

.research-phase-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin-left: var(--t-space-1);
}

.opp-card__scout-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: var(--t-space-2) var(--t-space-3);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    border-radius: var(--t-radius-sm);
    border: 1px solid var(--t-border);
    background: var(--t-bg-muted);
    color: var(--t-text-secondary);
    cursor: pointer;
    transition: all var(--t-transition-fast);
    white-space: nowrap;
}

.opp-card__scout-btn:hover:not(:disabled) {
    border-color: var(--t-border-hover);
    color: var(--t-text);
    background: var(--t-bg-card-hover);
}

.opp-card__scout-btn:disabled {
    opacity: 0.35;
    cursor: default;
}

.scout-cost {
    font-family: var(--t-font-mono);
    font-size: 0.6rem;
    color: var(--t-text-muted);
    margin-left: 0.2rem;
}

.opp-card__research-complete {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-accent);
    font-weight: 500;
}

/* ── Buy button ── */
.opp-card__buy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    font-size: var(--t-font-size-sm);
    font-weight: 700;
    border-radius: var(--t-radius-sm);
    border: 1px solid color-mix(in srgb, var(--t-accent) 25%, var(--t-border));
    background: color-mix(in srgb, var(--t-accent) 6%, var(--t-bg-card));
    color: var(--t-accent);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.opp-card__buy-btn:hover:not(:disabled) {
    border-color: var(--t-accent);
    background: color-mix(in srgb, var(--t-accent) 12%, var(--t-bg-card));
}

.opp-card__buy-btn:disabled {
    opacity: 0.35;
    cursor: default;
}

.opp-card__buy-price {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    opacity: 0.7;
}

/* ── Details toggle ── */
.details-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: var(--t-space-1) var(--t-space-2);
    border: none;
    background: none;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-xs);
    font-weight: 500;
    cursor: pointer;
    border-radius: var(--t-radius-sm);
    transition: color var(--t-transition-fast), background var(--t-transition-fast);
}

.details-toggle:hover {
    color: var(--t-accent);
    background: color-mix(in srgb, var(--t-accent) 6%, transparent);
}

/* ── Slide transition ── */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.25s ease;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
    opacity: 1;
    max-height: 600px;
}

/* ── Details Panel ── */
.details-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

.detail-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.detail-title {
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text-secondary);
}

.detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-1) var(--t-space-3);
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-1) 0;
}

.d-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.d-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: 700;
    color: var(--t-text);
}

.d-value.success {
    color: var(--t-success);
}

.d-value.danger {
    color: var(--t-danger);
}

.d-value.warn {
    color: var(--t-warning);
}
</style>
