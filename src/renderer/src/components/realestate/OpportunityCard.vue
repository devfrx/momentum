<script setup lang="ts">
/**
 * OpportunityCard — Property Purchase Document ("Proposta d'Acquisto")
 *
 * Styled as an authentic property purchase document with:
 *   - Official seal + document heading + reference number
 *   - Form-style fields with dotted underlines
 *   - Financial summary table
 *   - Detailed analysis section (progressively revealed)
 *   - Notes/observations for traits
 *   - Stamp-style verification stages
 *   - Corner flourishes and paper texture
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
import { UButton, UTooltip } from '@renderer/components/ui'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const player = usePlayerStore()
const { formatCash, formatPercent } = useFormat()

const props = defineProps<{ opportunity: PropertyOpportunity }>()
const emit = defineEmits<{ (e: 'bought', propId: string): void }>()

// ── Grade ──
const gradeData = computed(() => getLocationGrade(props.opportunity.locationGrade))
const gradeColor = computed(() => gradeData.value?.color ?? 'var(--t-accent)')

// ── Template ──
const template = computed(() =>
    PROPERTY_TEMPLATES.find((tp) => tp.id === props.opportunity.templateId),
)

// ── Affordability ──
const canAfford = computed(() => player.cardBalance.gte(props.opportunity.askingPrice))

// ── Scouting state ──
const currentScoutIdx = computed(() => SCOUT_PHASES.indexOf(props.opportunity.scoutPhase))
const nextScoutPhase = computed<ScoutPhase | null>(() => {
    const idx = currentScoutIdx.value
    return idx >= SCOUT_PHASES.length - 1 ? null : SCOUT_PHASES[idx + 1]
})
const nextScoutCost = computed(() =>
    nextScoutPhase.value ? props.opportunity.scoutCosts[nextScoutPhase.value] : 0,
)
const canAffordScout = computed(() => player.cardBalance.gte(nextScoutCost.value))
const isFullyScouted = computed(() => currentScoutIdx.value >= SCOUT_PHASES.length - 1)

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

const grossRentPerSecond = computed(() =>
    props.opportunity.baseRent.toNumber() * props.opportunity.units * TICKS_PER_SECOND,
)
const maintenancePerSecond = computed(() =>
    props.opportunity.baseMaintenance.toNumber() * props.opportunity.units * TICKS_PER_SECOND,
)
const taxPerSecond = computed(() => grossRentPerSecond.value * props.opportunity.taxRate)
const expensePerSecond = computed(() => maintenancePerSecond.value + taxPerSecond.value)
const netRentPerSecond = computed(() => grossRentPerSecond.value - expensePerSecond.value)

const dailyNetIncome = computed(() => netRentPerSecond.value * SECONDS_PER_DAY * 0.85)

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
    return (Math.pow(1 + rate, 144) - 1) * 100
})

// ── Condition ──
const conditionTier = computed(() => {
    const c = props.opportunity.startingCondition
    if (c >= 90) return { color: 'var(--t-success)', icon: 'mdi:shield-check', label: 'A+' }
    if (c >= 70) return { color: 'var(--t-accent)', icon: 'mdi:shield-half-full', label: 'B' }
    if (c >= 50) return { color: 'var(--t-warning)', icon: 'mdi:shield-alert', label: 'C' }
    return { color: 'var(--t-danger)', icon: 'mdi:shield-off', label: 'D' }
})

// ── Max improvements from template ──
const maxImprovements = computed(() => template.value?.maxImprovements ?? 6)
const maxRenovation = computed(() => props.opportunity.maxRenovationLevel)

// ── Actions ──
function handleScout(): void {
    if (nextScoutPhase.value) realEstate.scoutOpportunity(props.opportunity.id, nextScoutPhase.value)
}
function handleBuy(): void {
    realEstate.buyProperty(props.opportunity.id, Date.now(), (propId) => {
        emit('bought', propId)
    })
}
</script>

<template>
    <div class="deed" :style="{ '--_gc': gradeColor }">
        <!-- ── Decorative corner flourishes ── -->
        <span class="deed__corner deed__corner--tl" />
        <span class="deed__corner deed__corner--tr" />
        <span class="deed__corner deed__corner--bl" />
        <span class="deed__corner deed__corner--br" />

        <!-- ═══ HEADER — Official document heading ═══ -->
        <header class="deed__header">
            <div class="deed__seal">
                <AppIcon :icon="opportunity.icon" />
            </div>
            <div class="deed__titles">
                <span class="deed__doc-type">{{ t('realestate.opp.deed_title') }}</span>
                <h3 class="deed__prop-name">{{ opportunity.name }}</h3>
            </div>
            <div class="deed__ref">
                <span class="deed__ref-label">Ref.</span>
                <span class="deed__ref-num">#{{ opportunity.id.slice(-6).toUpperCase() }}</span>
            </div>
        </header>

        <hr class="deed__rule deed__rule--double" />

        <!-- ═══ SECTION 1 — Property Description ═══ -->
        <section class="deed__section">
            <div class="deed__field-grid">
                <div class="deed__field">
                    <span class="deed__label">{{ t('realestate.opp.doc_category') }}</span>
                    <span class="deed__value deed__value--dotted">{{ opportunity.category }}</span>
                </div>
                <div class="deed__field">
                    <span class="deed__label">{{ t('realestate.opp.doc_units') }}</span>
                    <span class="deed__value deed__value--dotted">{{ opportunity.units }}</span>
                </div>
                <div class="deed__field">
                    <span class="deed__label">{{ t('realestate.opp.doc_zone') }}</span>
                    <UTooltip :text="t(gradeData.nameKey)" placement="top">
                        <span class="deed__value deed__value--dotted deed__value--grade" :style="{ color: gradeColor }">
                            <AppIcon :icon="gradeData.icon" />
                            {{ t(gradeData.nameKey) }} ({{ opportunity.locationGrade }})
                        </span>
                    </UTooltip>
                </div>
            </div>
        </section>

        <hr class="deed__rule" />

        <!-- ═══ SECTION 2 — Financial Summary ═══ -->
        <section class="deed__section">
            <h4 class="deed__section-title">
                <AppIcon icon="mdi:file-document-outline" />
                {{ t('realestate.opp.doc_financial') }}
            </h4>

            <table class="deed__table">
                <tbody>
                    <tr>
                        <td class="deed__td-label">{{ t('realestate.opp.doc_asking') }}</td>
                        <td class="deed__td-value deed__td-value--price"
                            :class="{ 'deed__td-value--hot': opportunity.isHotDeal }">
                            {{ formatCash(opportunity.askingPrice) }}
                            <span v-if="opportunity.isHotDeal" class="deed__hot-stamp">
                                <AppIcon icon="mdi:fire" />HOT
                            </span>
                        </td>
                    </tr>
                    <tr v-if="showTrueValue">
                        <td class="deed__td-label">{{ t('realestate.opp.doc_appraisal') }}</td>
                        <td class="deed__td-value" :class="isGoodDeal ? 'deed__td-value--good' : 'deed__td-value--bad'">
                            {{ formatCash(opportunity.trueValue) }}
                            <span v-if="dealSpread !== 0" class="deed__spread"
                                :class="dealSpread > 0 ? 'deed__spread--pos' : 'deed__spread--neg'">
                                ({{ dealSpread > 0 ? '+' : '' }}{{ dealSpread.toFixed(1) }}%)
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td class="deed__td-label">{{ t('realestate.opp.doc_gross_rent') }}</td>
                        <td class="deed__td-value deed__td-value--good">
                            {{ formatCash(grossRentPerSecond) }}<small>/s</small>
                        </td>
                    </tr>
                    <tr>
                        <td class="deed__td-label">{{ t('realestate.opp.doc_payback') }}</td>
                        <td class="deed__td-value"
                            :class="{ 'deed__td-value--good': paybackDays < 30, 'deed__td-value--bad': paybackDays === Infinity }">
                            {{ paybackLabel }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>

        <!-- ═══ SECTION 3 — Detailed Metrics (after inspection) ═══ -->
        <template v-if="showDetailedStats">
            <hr class="deed__rule" />
            <section class="deed__section">
                <h4 class="deed__section-title">
                    <AppIcon icon="mdi:chart-box-outline" />
                    {{ t('realestate.opp.doc_details') }}
                </h4>

                <table class="deed__table">
                    <tbody>
                        <tr>
                            <td class="deed__td-label">{{ t('realestate.net_income') }}</td>
                            <td class="deed__td-value"
                                :class="dailyNetIncome >= 0 ? 'deed__td-value--good' : 'deed__td-value--bad'">
                                {{ formatCash(Math.abs(dailyNetIncome)) }}<small>/{{ t('realestate.day') }}</small>
                            </td>
                        </tr>
                        <tr>
                            <td class="deed__td-label">{{ t('realestate.expense') }}</td>
                            <td class="deed__td-value deed__td-value--bad">
                                {{ formatCash(expensePerSecond) }}<small>/s</small>
                            </td>
                        </tr>
                        <tr>
                            <td class="deed__td-label">{{ t('realestate.appreciation') }}</td>
                            <td class="deed__td-value deed__td-value--good">
                                +{{ dailyAppreciation.toFixed(1) }}%<small>/{{ t('realestate.day') }}</small>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Property specs as form fields -->
                <div class="deed__field-grid deed__field-grid--4">
                    <UTooltip :text="t('realestate.tip.condition')" placement="bottom">
                        <div class="deed__field deed__field--compact">
                            <span class="deed__label">{{ t('realestate.opp.doc_condition') }}</span>
                            <span class="deed__value deed__value--dotted" :style="{ color: conditionTier.color }">
                                <AppIcon :icon="conditionTier.icon" /> {{ opportunity.startingCondition }}%
                            </span>
                        </div>
                    </UTooltip>
                    <div class="deed__field deed__field--compact">
                        <span class="deed__label">{{ t('realestate.opp.doc_reno') }}</span>
                        <span class="deed__value deed__value--dotted">Lv.{{ maxRenovation }}</span>
                    </div>
                    <div class="deed__field deed__field--compact">
                        <span class="deed__label">{{ t('realestate.opp.doc_slots') }}</span>
                        <span class="deed__value deed__value--dotted">×{{ maxImprovements }}</span>
                    </div>
                    <div class="deed__field deed__field--compact">
                        <span class="deed__label">{{ t('realestate.opp.doc_tax') }}</span>
                        <span class="deed__value deed__value--dotted">{{ formatPercent(opportunity.taxRate * 100)
                        }}</span>
                    </div>
                </div>
            </section>
        </template>

        <!-- ═══ SECTION 4 — Notes / Traits (after drive-by) ═══ -->
        <template v-if="traits.length > 0">
            <hr class="deed__rule" />
            <section class="deed__section">
                <h4 class="deed__section-title">
                    <AppIcon icon="mdi:note-text-outline" />
                    {{ t('realestate.opp.doc_notes') }}
                </h4>
                <ul class="deed__notes-list">
                    <li v-for="tr in traits" :key="tr.id" class="deed__note"
                        :class="tr.isPositive ? 'deed__note--pos' : 'deed__note--neg'">
                        <UTooltip :text="t(tr.descriptionKey)" placement="bottom">
                            <span>
                                <AppIcon :icon="tr.icon" /> {{ t(tr.nameKey) }}
                            </span>
                        </UTooltip>
                    </li>
                </ul>
                <div v-if="positiveTraitCount > 0 || negativeTraitCount > 0" class="deed__trait-summary">
                    <span v-if="positiveTraitCount" class="deed__td-value--good">+{{ positiveTraitCount }} {{
                        t('realestate.opp.doc_favorable') }}</span>
                    <span v-if="negativeTraitCount" class="deed__td-value--bad">-{{ negativeTraitCount }} {{
                        t('realestate.opp.doc_unfavorable') }}</span>
                </div>
            </section>
        </template>

        <!-- Fog-of-war hint -->
        <div v-if="currentScoutIdx < 1" class="deed__classified">
            <AppIcon icon="mdi:file-lock-outline" />
            <span>{{ t('realestate.scout.hidden_info') }}</span>
            <small class="deed__classified-sub">{{ t('realestate.opp.doc_classified_hint') }}</small>
        </div>

        <hr class="deed__rule deed__rule--double" />

        <!-- ═══ FOOTER — Scout pipeline + Purchase ═══ -->
        <footer class="deed__footer">
            <!-- Scout steps as official "verification stages" -->
            <div class="deed__verification">
                <span class="deed__verif-title">{{ t('realestate.opp.doc_verification') }}</span>
                <div class="deed__verif-row">
                    <template v-for="(phase, idx) in SCOUT_PHASES.slice(1)" :key="phase">
                        <UTooltip :text="t(SCOUT_PHASE_DATA[phase].revealsKey || SCOUT_PHASE_DATA[phase].nameKey)"
                            placement="top">
                            <button class="deed__stamp" :class="{
                                'deed__stamp--approved': currentScoutIdx >= idx + 1,
                                'deed__stamp--pending': currentScoutIdx === idx && nextScoutPhase === phase,
                                'deed__stamp--locked': currentScoutIdx < idx,
                            }" :disabled="nextScoutPhase !== phase || !canAffordScout"
                                @click="nextScoutPhase === phase && canAffordScout && handleScout()">
                                <AppIcon
                                    :icon="currentScoutIdx >= idx + 1 ? 'mdi:check-decagram' : SCOUT_PHASE_DATA[phase].icon" />
                                <span class="deed__stamp-label">{{ t(SCOUT_PHASE_DATA[phase].nameKey) }}</span>
                                <span v-if="nextScoutPhase === phase" class="deed__stamp-cost">{{
                                    formatCash(nextScoutCost) }}</span>
                            </button>
                        </UTooltip>
                    </template>
                </div>
            </div>

            <!-- Purchase button styled as official action -->
            <UButton :variant="canAfford ? 'primary' : 'muted'" size="sm"
                :icon="canAfford ? 'mdi:stamp' : 'mdi:lock-outline'" :disabled="!canAfford" block @click="handleBuy">
                {{ t('realestate.opp.doc_purchase') }}
                <span class="deed__buy-amount">{{ formatCash(opportunity.askingPrice) }}</span>
            </UButton>
        </footer>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════
   DEED CARD — Property Purchase Document style
   Inspired by real "Proposta d'Acquisto" / MLS listing sheets
   ═══════════════════════════════════════════════════════════ */

.deed {
    --_gc: var(--t-accent);
    --_paper: var(--t-bg-card);
    --_ink: var(--t-text);
    --_ink-muted: var(--t-text-muted);
    --_rule: color-mix(in srgb, var(--t-border) 80%, var(--t-text-secondary) 20%);

    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--_paper);
    border: 2px solid var(--_rule);
    border-radius: var(--t-radius-xs);
    padding: var(--t-space-5) var(--t-space-4);
    font-family: var(--t-font-sans);
    color: var(--_ink);
    overflow: hidden;

    /* Subtle paper texture via vignette */
    background-image:
        radial-gradient(ellipse at center, transparent 60%, color-mix(in srgb, var(--_rule) 8%, transparent) 100%);
}

/* ── Corner flourishes ── */
.deed__corner {
    position: absolute;
    width: var(--t-space-4);
    height: var(--t-space-4);
    border-color: var(--_rule);
    border-style: solid;
    opacity: 0.5;
    pointer-events: none;
}

.deed__corner--tl {
    top: var(--t-space-1);
    left: var(--t-space-1);
    border-width: 2px 0 0 2px;
}

.deed__corner--tr {
    top: var(--t-space-1);
    right: var(--t-space-1);
    border-width: 2px 2px 0 0;
}

.deed__corner--bl {
    bottom: var(--t-space-1);
    left: var(--t-space-1);
    border-width: 0 0 2px 2px;
}

.deed__corner--br {
    bottom: var(--t-space-1);
    right: var(--t-space-1);
    border-width: 0 2px 2px 0;
}

/* ═══ HEADER ═══ */
.deed__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.deed__seal {
    width: var(--t-icon-xl);
    height: var(--t-icon-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--t-radius-full);
    border: 2px solid var(--_gc);
    color: var(--_gc);
    font-size: var(--t-font-size-xl);
    flex-shrink: 0;
    background: color-mix(in srgb, var(--_gc) 8%, transparent);
    box-shadow: 0 0 0 var(--t-space-1) color-mix(in srgb, var(--_gc) 5%, transparent);
}

.deed__titles {
    flex: 1;
    min-width: 0;
}

.deed__doc-type {
    display: block;
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-weight: var(--t-font-bold);
    color: var(--_gc);
    line-height: 1.4;
}

.deed__prop-name {
    margin: 0;
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--_ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
}

.deed__ref {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
}

.deed__ref-label {
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--_ink-muted);
}

.deed__ref-num {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--_ink-muted);
}

/* ═══ HORIZONTAL RULES ═══ */
.deed__rule {
    border: none;
    border-top: 1px solid var(--_rule);
    margin: var(--t-space-2) 0;
    opacity: 0.6;
}

.deed__rule--double {
    border-top: 2px double var(--_rule);
    opacity: 0.8;
}

/* ═══ SECTIONS ═══ */
.deed__section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.deed__section-title {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    margin: 0;
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: var(--t-font-bold);
    color: var(--_ink-muted);
}

/* ═══ FIELD GRID (form-like) ═══ */
.deed__field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-1) var(--t-space-3);
}

.deed__field-grid--4 {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--t-space-1) var(--t-space-2);
    margin-top: var(--t-space-2);
}

.deed__field {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-0-5);
}

.deed__field--compact {
    text-align: center;
}

.deed__label {
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--_ink-muted);
    font-weight: var(--t-font-semibold);
}

.deed__value {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--_ink);
}

.deed__value--dotted {
    border-bottom: 1px dotted var(--_rule);
    padding-bottom: var(--t-space-0-5);
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-1);
}

.deed__value--grade {
    font-weight: var(--t-font-bold);
}

/* ═══ FINANCIAL TABLE ═══ */
.deed__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--t-font-size-sm);
}

.deed__table tbody tr {
    border-bottom: 1px dotted color-mix(in srgb, var(--_rule) 50%, transparent);
}

.deed__table tbody tr:last-child {
    border-bottom: none;
}

.deed__td-label {
    padding: var(--t-space-1) 0;
    color: var(--_ink-muted);
    font-weight: var(--t-font-medium);
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
}

.deed__td-value {
    padding: var(--t-space-1) 0;
    text-align: right;
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    white-space: nowrap;
}

.deed__td-value small {
    font-weight: var(--t-font-normal);
    opacity: 0.6;
}

.deed__td-value--price {
    font-size: var(--t-font-size-base);
    color: var(--_ink);
}

.deed__td-value--hot {
    color: var(--t-danger);
}

.deed__td-value--good {
    color: var(--t-success);
}

.deed__td-value--bad {
    color: var(--t-danger);
}

/* Hot deal stamp */
.deed__hot-stamp {
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-0-5);
    margin-left: var(--t-space-1);
    padding: var(--t-space-0-5) var(--t-space-1);
    border: 1px solid var(--t-danger);
    border-radius: var(--t-radius-xs);
    color: var(--t-danger);
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-sans);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transform: rotate(-2deg);
}

/* Appraisal spread */
.deed__spread {
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-bold);
    margin-left: var(--t-space-1);
}

.deed__spread--pos {
    color: var(--t-success);
}

.deed__spread--neg {
    color: var(--t-danger);
}

/* ═══ NOTES / TRAITS ═══ */
.deed__notes-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.deed__note {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    padding: var(--t-space-1) var(--t-space-2);
    border-left: var(--t-space-1) solid transparent;
    border-radius: 0 var(--t-radius-sm) var(--t-radius-sm) 0;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-medium);
    cursor: default;
}

.deed__note--pos {
    border-left-color: var(--t-success);
    background: color-mix(in srgb, var(--t-success) 6%, transparent);
    color: var(--t-success);
}

.deed__note--neg {
    border-left-color: var(--t-warning);
    background: color-mix(in srgb, var(--t-warning) 6%, transparent);
    color: var(--t-warning);
}

.deed__trait-summary {
    display: flex;
    justify-content: flex-end;
    gap: var(--t-space-3);
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    margin-top: var(--t-space-1);
}

/* ═══ CLASSIFIED / FOG ═══ */
.deed__classified {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-1);
    padding: var(--t-space-3) var(--t-space-2);
    margin: var(--t-space-1) 0;
    border: 1px dashed var(--_rule);
    border-radius: var(--t-radius-xs);
    color: var(--_ink-muted);
    font-size: var(--t-font-size-sm);
    font-style: italic;
    text-align: center;
    background: repeating-linear-gradient(-45deg,
            transparent,
            transparent var(--t-space-3),
            color-mix(in srgb, var(--_rule) 5%, transparent) var(--t-space-3),
            color-mix(in srgb, var(--_rule) 5%, transparent) calc(var(--t-space-3) * 2));
}

.deed__classified-sub {
    font-size: var(--t-font-size-2xs);
    opacity: 0.6;
    font-style: normal;
}

/* ═══ FOOTER ═══ */
.deed__footer {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    margin-top: auto;
}

/* ── Verification / Scout steps ── */
.deed__verification {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.deed__verif-title {
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: var(--t-font-semibold);
    color: var(--_ink-muted);
}

.deed__verif-row {
    display: flex;
    gap: var(--t-space-1);
}

/* ── Stamp-style scout dots ── */
.deed__stamp {
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-1);
    flex: 1;
    justify-content: center;
    padding: var(--t-space-1);
    border-radius: var(--t-radius-xs);
    border: 1px solid var(--_rule);
    background: var(--_paper);
    color: var(--_ink-muted);
    font-size: var(--t-font-size-xs);
    font-family: inherit;
    cursor: default;
    white-space: nowrap;
    transition: all var(--t-transition-normal);
}

.deed__stamp-label {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-2xs);
    letter-spacing: 0.02em;
}

.deed__stamp-cost {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-2xs);
    opacity: 0.65;
}

.deed__stamp--approved {
    border-color: var(--_gc);
    background: color-mix(in srgb, var(--_gc) 10%, var(--_paper));
    color: var(--_gc);
    border-style: solid;
}

.deed__stamp--pending {
    border-color: color-mix(in srgb, var(--_gc) 60%, var(--_rule));
    border-style: dashed;
    color: var(--_ink);
    cursor: pointer;
}

.deed__stamp--pending:not(:disabled):hover {
    border-color: var(--_gc);
    border-style: solid;
    background: color-mix(in srgb, var(--_gc) 6%, var(--_paper));
}

.deed__stamp--pending:disabled {
    cursor: not-allowed;
    opacity: 0.4;
}

.deed__stamp--locked {
    opacity: 0.25;
    border-style: dotted;
}

/* ── Buy amount inline ── */
.deed__buy-amount {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    margin-left: var(--t-space-1);
    opacity: 0.8;
}
</style>
