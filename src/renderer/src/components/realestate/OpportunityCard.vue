<script setup lang="ts">
import { computed } from 'vue'
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
const { formatCash } = useFormat()

const props = defineProps<{ opportunity: PropertyOpportunity }>()
const emit = defineEmits<{ (e: 'bought', propId: string): void }>()

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

        <!-- Head row -->
        <div class="opp-card__head">
            <AppIcon :icon="opportunity.icon" class="opp-card__icon" />
            <div class="opp-card__identity">
                <div class="opp-card__name-row">
                    <span class="opp-card__name">{{ opportunity.name }}</span>
                    <span v-if="opportunity.isHotDeal" class="opp-card__hot">
                        <AppIcon icon="mdi:fire" /> {{ t('realestate.opp.hot') }}
                    </span>
                    <!-- <Tag v-if="opportunity.isScanned" value="SCANNED" severity="info" size="small" /> -->
                </div>
                <div class="opp-card__meta">
                    <Tag :value="opportunity.category" size="small" severity="secondary" />
                    <span v-if="district" class="opp-card__district">
                        <AppIcon :icon="district.icon" /> {{ t(district.nameKey) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Price section -->
        <div class="opp-card__stats">
            <div class="opp-card__kpi">
                <span class="opp-card__kpi-label">{{ t('realestate.asking_price') }}</span>
                <span class="opp-card__kpi-value opp-card__kpi-value--gold">{{ formatCash(opportunity.askingPrice)
                }}</span>
            </div>
            <div v-if="showTrueValue" class="opp-card__kpi">
                <span class="opp-card__kpi-label">{{ t('realestate.true_value') }}</span>
                <span class="opp-card__kpi-value" :class="isGoodDeal ? 'text-emerald' : 'text-red'">
                    {{ formatCash(opportunity.trueValue) }}
                </span>
            </div>
            <div class="opp-card__kpi">
                <span class="opp-card__kpi-label">{{ t('realestate.rent') }}/t</span>
                <span class="opp-card__kpi-value opp-card__kpi-value--green">{{ formatCash(opportunity.baseRent)
                }}</span>
            </div>
            <div class="opp-card__kpi">
                <span class="opp-card__kpi-label">{{ t('realestate.units') }}</span>
                <span class="opp-card__kpi-value">{{ opportunity.units }}</span>
            </div>
        </div>

        <!-- Hidden scores (inspection+) -->
        <div v-if="showHiddenScores" class="opp-card__reveals">
            <div class="opp-card__reveal-item">
                <AppIcon icon="mdi:map-marker" />
                <span class="opp-card__reveal-label">{{ t('realestate.neighborhood') }}</span>
                <span class="opp-card__reveal-value"
                    :class="opportunity.hiddenNeighborhoodScore >= 70 ? 'text-emerald' : opportunity.hiddenNeighborhoodScore >= 40 ? 'text-gold' : 'text-red'">
                    {{ opportunity.hiddenNeighborhoodScore }}/100
                </span>
            </div>
            <div class="opp-card__reveal-item">
                <AppIcon icon="mdi:home-analytics" />
                <span class="opp-card__reveal-label">{{ t('realestate.structural') }}</span>
                <span class="opp-card__reveal-value"
                    :class="opportunity.hiddenStructuralScore >= 70 ? 'text-emerald' : opportunity.hiddenStructuralScore >= 40 ? 'text-gold' : 'text-red'">
                    {{ opportunity.hiddenStructuralScore }}/100
                </span>
            </div>
        </div>

        <!-- Traits -->
        <div v-if="traits.length > 0" class="opp-card__traits">
            <span v-for="tr in traits" :key="tr.id" class="opp-card__trait"
                :class="tr.isPositive ? 'opp-card__trait--pos' : 'opp-card__trait--neg'">
                <AppIcon :icon="tr.icon" /> {{ t(tr.nameKey) }}
            </span>
        </div>

        <!-- Hidden hint -->
        <div v-if="currentScoutIdx < 1" class="opp-card__hidden-hint">
            <AppIcon icon="mdi:eye-off-outline" />
            <span>{{ t('realestate.scout.hidden_info') }}</span>
        </div>

        <!-- Scout Phase Indicator -->
        <div class="opp-card__research">
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
        </div>

        <!-- Actions -->
        <div class="opp-card__actions">
            <button v-if="nextScoutPhase" class="opp-card__act-btn" :disabled="!canAffordScout" @click="handleScout">
                <AppIcon icon="mdi:magnify" /> {{ t('realestate.scout.action', {
                    phase:
                        t(SCOUT_PHASE_DATA[nextScoutPhase].nameKey), cost: scanCostFormatted
                }) }}
            </button>
            <span v-else class="opp-card__research-complete">
                <AppIcon icon="mdi:check-decagram" /> {{ t('realestate.scout.appraisal') }}
            </span>
            <button class="opp-card__act-btn opp-card__act-btn--buy" :disabled="!canAfford" @click="handleBuy">
                <AppIcon icon="mdi:cart" /> {{ t('realestate.buy') }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.opp-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    /* border: 1px solid var(--t-border); */
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

/* ── Stats ── */
.opp-card__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.opp-card__kpi {
    display: flex;
    flex-direction: column;
}

.opp-card__kpi-label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
}

.opp-card__kpi-value {
    font-family: var(--t-font-mono);
    font-weight: 700;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.opp-card__kpi-value--gold {
    color: var(--t-warning);
}

.opp-card__kpi-value--green {
    color: var(--t-success);
}

/* ── Reveals ── */
.opp-card__reveals {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
    padding: var(--t-space-2) var(--t-space-3);
    border-left: 3px solid var(--_accent);
    background: color-mix(in srgb, var(--_accent) 4%, var(--t-bg-card));
    border-radius: 0 var(--t-radius-sm) var(--t-radius-sm) 0;
}

.opp-card__reveal-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-sm);
}

.opp-card__reveal-label {
    flex: 1;
    color: var(--t-text-secondary);
}

.opp-card__reveal-value {
    font-family: var(--t-font-mono);
    font-weight: 600;
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

/* ── Scout / Research phases ── */
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

/* ── Actions ── */
.opp-card__actions {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    justify-content: flex-end;
}

.opp-card__act-btn {
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

.opp-card__act-btn:hover:not(:disabled) {
    border-color: var(--t-border-hover);
    color: var(--t-text);
    background: var(--t-bg-card-hover);
}

.opp-card__act-btn:disabled {
    opacity: 0.35;
    cursor: default;
}

.opp-card__act-btn--buy {
    border-color: color-mix(in srgb, var(--t-accent) 25%, var(--t-border));
    color: var(--t-accent);
}

.opp-card__act-btn--buy:hover:not(:disabled) {
    border-color: var(--t-accent);
    background: color-mix(in srgb, var(--t-accent) 8%, var(--t-bg-card));
}

.opp-card__research-complete {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-accent);
    font-weight: 500;
}
</style>
