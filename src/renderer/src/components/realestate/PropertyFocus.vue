<script setup lang="ts">
/**
 * PropertyFocus — Single-property detail panel
 *
 * Uses the app's standard card-grid + KPI patterns so it looks
 * consistent with BusinessView, InvestmentsView, DepositsView etc.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore, type Property } from '@renderer/stores/useRealEstateStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import {
    getLocationGrade,
    getTrait,
    getImprovement,
    MANAGEMENT_STYLES,
    type ManagementStyle,
    type PropertyTrait,
    type ImprovementDef,
} from '@renderer/data/realestate'
import BuildingSilhouette from './BuildingSilhouette.vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton, UAccordion, UTooltip } from '@renderer/components/ui'
import Tag from 'primevue/tag'
import Slider from 'primevue/slider'
import InputText from 'primevue/inputtext'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const player = usePlayerStore()
const { formatCash, formatPercent, formatRate } = useFormat()

const props = defineProps<{
    propertyId: string
}>()

const emit = defineEmits<{
    (e: 'back'): void
    (e: 'navigate', propertyId: string): void
    (e: 'sold'): void
    (e: 'open-improvements', propertyId: string): void
    (e: 'open-customizer', propertyId: string): void
}>()

// ── Property data ──
const property = computed<Property | undefined>(() =>
    realEstate.properties.find((p) => p.id === props.propertyId),
)

const gradeData = computed(() =>
    property.value ? getLocationGrade(property.value.locationGrade) : undefined,
)

const traits = computed<PropertyTrait[]>(() =>
    property.value
        ? (property.value.traits
            .map((tid) => getTrait(tid))
            .filter(Boolean) as PropertyTrait[])
        : [],
)

const improvements = computed<ImprovementDef[]>(() =>
    property.value
        ? (property.value.improvements
            .map((id) => getImprovement(id))
            .filter(Boolean) as ImprovementDef[])
        : [],
)

const displayName = computed(() =>
    property.value?.customName || property.value?.name || '',
)

// ── Computed stats ──
const netRent = computed(() =>
    property.value ? realEstate.computePropertyNetRent(property.value) : undefined,
)
const grossRent = computed(() =>
    property.value ? realEstate.computePropertyRent(property.value) : undefined,
)
const maintenance = computed(() =>
    property.value ? realEstate.computePropertyMaintenance(property.value) : undefined,
)
const categoryBonus = computed(() =>
    property.value ? realEstate.getCategoryRentBonus(property.value.category) : 0,
)
const repairCost = computed(() =>
    property.value ? realEstate.getRepairCost(property.value) : undefined,
)
const renovateCost = computed(() =>
    property.value ? realEstate.getRenovateCost(property.value) : undefined,
)
const sellPrice = computed(() =>
    property.value ? realEstate.getSellPrice(property.value) : undefined,
)

const TICKS_PER_SECOND = 10
const SECONDS_PER_DAY = 86_400

const paybackDays = computed(() => {
    if (!property.value || !netRent.value) return Infinity
    const netPerSec = netRent.value.toNumber() * TICKS_PER_SECOND
    if (netPerSec <= 0) return Infinity
    return property.value.purchasePrice.toNumber() / (netPerSec * SECONDS_PER_DAY)
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

const valueChange = computed(() => {
    if (!property.value) return 0
    const current = property.value.currentValue.toNumber()
    const purchase = property.value.purchasePrice.toNumber()
    if (purchase <= 0) return 0
    return ((current - purchase) / purchase) * 100
})

const conditionColor = computed(() => {
    if (!property.value) return 'var(--t-text-muted)'
    if (property.value.condition >= 80) return 'var(--t-success)'
    if (property.value.condition >= 50) return 'var(--t-warning)'
    if (property.value.condition >= 25) return 'var(--t-orange)'
    return 'var(--t-danger)'
})

const canAffordRepair = computed(
    () =>
        property.value &&
        repairCost.value &&
        player.cash.gte(repairCost.value) &&
        property.value.condition < 98,
)
const canAffordRenovate = computed(
    () =>
        property.value &&
        renovateCost.value &&
        player.cash.gte(renovateCost.value) &&
        property.value.renovationLevel < property.value.maxRenovationLevel,
)

// ── Navigation ──
const currentIdx = computed(() =>
    realEstate.properties.findIndex((p) => p.id === props.propertyId),
)
const canGoPrev = computed(() => currentIdx.value > 0)
const canGoNext = computed(() => currentIdx.value < realEstate.properties.length - 1)

function navigatePrev(): void {
    if (canGoPrev.value) {
        emit('navigate', realEstate.properties[currentIdx.value - 1].id)
    }
}
function navigateNext(): void {
    if (canGoNext.value) {
        emit('navigate', realEstate.properties[currentIdx.value + 1].id)
    }
}

// ── Rename ──
const showRename = ref(false)
const newName = ref('')
const confirmSell = ref(false)

function handleRename(): void {
    if (!property.value) return
    realEstate.renameProperty(property.value.id, newName.value)
    showRename.value = false
}

// ── Actions ──
function handleRepair(): void {
    if (property.value) realEstate.repairProperty(property.value.id)
}

function handleRenovate(): void {
    if (property.value) realEstate.renovateProperty(property.value.id)
}

function handleSell(): void {
    if (!property.value) return
    if (!confirmSell.value) {
        confirmSell.value = true
        setTimeout(() => {
            confirmSell.value = false
        }, 3000)
        return
    }
    realEstate.sellProperty(property.value.id)
    emit('sold')
}

function handleStyleChange(style: ManagementStyle): void {
    if (property.value) realEstate.setManagementStyle(property.value.id, style)
}

function handleRentSlider(val: number | number[]): void {
    if (!property.value) return
    realEstate.setRentMultiplier(
        property.value.id,
        (Array.isArray(val) ? val[0] : val) / 100,
    )
}

// Reset confirm on property change
watch(
    () => props.propertyId,
    () => {
        confirmSell.value = false
        showRename.value = false
    },
)
</script>

<template>
    <div v-if="property" class="pf">
        <!-- ── Toolbar ── -->
        <div class="pf-toolbar">
            <UButton variant="ghost" size="sm" icon="mdi:arrow-left" @click="$emit('back')">
                {{ t('realestate.back_to_skyline') }}
            </UButton>
            <div class="pf-toolbar__nav">
                <UButton variant="ghost" size="sm" icon="mdi:chevron-left" :disabled="!canGoPrev"
                    @click="navigatePrev" />
                <span class="pf-toolbar__counter">{{ currentIdx + 1 }}/{{ realEstate.properties.length }}</span>
                <UButton variant="ghost" size="sm" icon="mdi:chevron-right" :disabled="!canGoNext"
                    @click="navigateNext" />
            </div>
        </div>

        <!-- ══════════════════════════════════════
             HERO CARD
             ══════════════════════════════════════ -->
        <div class="pf-hero">
            <div class="pf-hero__layout">
                <!-- Visual zone (muted bg) -->
                <div class="pf-hero__visual">
                    <BuildingSilhouette :property="property" :height="150" active :show-status="false" />
                </div>

                <!-- Center: identity -->
                <div class="pf-hero__center">
                    <div class="pf-hero__name-row">
                        <template v-if="!showRename">
                            <h2 class="pf-hero__name" @dblclick="showRename = true; newName = displayName">
                                {{ displayName }}
                            </h2>
                            <UButton variant="ghost" size="sm" icon="mdi:pencil-outline"
                                @click="showRename = true; newName = displayName" />
                        </template>
                        <template v-else>
                            <InputText v-model="newName" size="small" class="pf-hero__rename"
                                @keyup.enter="handleRename" />
                            <UButton variant="ghost" size="sm" icon="mdi:check" @click="handleRename" />
                            <UButton variant="ghost" size="sm" icon="mdi:close" @click="showRename = false" />
                        </template>
                    </div>

                    <div class="pf-hero__badges">
                        <Tag :value="property.category" size="small" severity="secondary" />
                        <span v-if="gradeData" class="pf-grade" :style="{ '--_gc': gradeData.color }">
                            <AppIcon :icon="gradeData.icon" /> {{ t(gradeData.nameKey) }}
                        </span>
                        <span class="pf-hero__units">{{ property.units }} {{ t('realestate.units') }}</span>
                        <span v-if="property.renovationLevel > 0" class="pf-hero__reno">
                            <span v-for="s in property.renovationLevel" :key="s" class="pf-star">&#9733;</span>
                            Lv.{{ property.renovationLevel }}
                        </span>
                    </div>

                    <div v-if="traits.length > 0" class="pf-hero__traits">
                        <UTooltip v-for="tr in traits" :key="tr.id" :text="t(tr.descriptionKey)">
                            <span class="pf-trait" :class="tr.isPositive ? 'pf-trait--pos' : 'pf-trait--neg'">
                                <AppIcon :icon="tr.icon" /> {{ t(tr.nameKey) }}
                            </span>
                        </UTooltip>
                    </div>
                </div>

                <!-- Right: KPIs -->
                <div class="pf-hero__right">
                    <div class="pf-kpi-cell">
                        <span class="pf-kpi-label">{{ t('realestate.net_rent') }}/t</span>
                        <span class="pf-kpi-val" :class="netRent && netRent.gt(0) ? 'c-green' : 'c-red'">
                            {{ netRent ? formatCash(netRent) : '—' }}
                        </span>
                    </div>
                    <div class="pf-kpi-cell">
                        <span class="pf-kpi-label">{{ t('realestate.current_value') }}</span>
                        <span class="pf-kpi-val c-gold">{{ formatCash(property.currentValue) }}</span>
                        <span class="pf-kpi-sub" :class="valueChange >= 0 ? 'c-green' : 'c-red'">
                            <AppIcon :icon="valueChange >= 0 ? 'mdi:trending-up' : 'mdi:trending-down'" />
                            {{ formatPercent(valueChange) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Condition micro-bar -->
            <div class="pf-hero__cbar">
                <div class="pf-hero__cfill" :style="{
                    width: Math.round(property.condition) + '%',
                    background: conditionColor,
                }" />
            </div>
        </div>

        <!-- ══════════════════════════════════════
             STATS STRIP
             ══════════════════════════════════════ -->
        <div class="pf-strip">
            <UTooltip :text="t('realestate.tip.condition')">
                <div class="pf-strip__cell">
                    <span class="pf-strip__label">{{ t('realestate.condition') }}</span>
                    <div class="pf-bar-row">
                        <div class="pf-bar">
                            <div class="pf-bar__fill"
                                :style="{ width: property.condition + '%', background: conditionColor }" />
                        </div>
                        <span class="pf-strip__val" :style="{ color: conditionColor }">{{ Math.round(property.condition)
                        }}%</span>
                    </div>
                </div>
            </UTooltip>

            <div class="pf-strip__sep" />

            <UTooltip :text="t('realestate.tip.occupancy')">
                <div class="pf-strip__cell">
                    <span class="pf-strip__label">{{ t('realestate.occupancy') }}</span>
                    <div class="pf-bar-row">
                        <div class="pf-bar">
                            <div class="pf-bar__fill"
                                :style="{ width: (property.occupancy * 100) + '%', background: 'var(--t-accent)' }" />
                        </div>
                        <span class="pf-strip__val">{{ formatRate(property.occupancy * 100) }}</span>
                    </div>
                </div>
            </UTooltip>

            <div class="pf-strip__sep" />

            <div class="pf-strip__cell">
                <span class="pf-strip__label">{{ t('realestate.roi') }}</span>
                <span class="pf-strip__val"
                    :class="paybackDays < 30 ? 'c-green' : paybackDays === Infinity ? 'c-red' : ''">{{
                    paybackLabel }}</span>
            </div>
        </div>

        <!-- Portfolio bonus -->
        <div v-if="categoryBonus > 0" class="pf-bonus">
            <AppIcon icon="mdi:briefcase-check" />
            <span>{{ t('realestate.portfolio_bonus') }}: +{{ formatPercent(categoryBonus * 100) }} {{
                t('realestate.rent')
            }}</span>
        </div>

        <!-- ══════════════════════════════════════
             ACTIONS
             ══════════════════════════════════════ -->
        <div class="pf-actions">
            <UButton variant="ghost" size="sm" icon="mdi:wrench" :disabled="!canAffordRepair"
                :label="t('realestate.repair')"
                :subtitle="property.condition < 98 && repairCost ? formatCash(repairCost) : undefined"
                @click="handleRepair" />
            <UButton variant="ghost" size="sm" icon="mdi:arrow-up-bold" :disabled="!canAffordRenovate"
                :label="t('realestate.renovate')"
                :subtitle="property.renovationLevel < property.maxRenovationLevel && renovateCost ? formatCash(renovateCost) : undefined"
                @click="handleRenovate" />
            <UButton variant="ghost" size="sm" icon="mdi:puzzle-plus" :label="t('realestate.improvements_label')"
                :subtitle="`${property.improvements.length}/${property.maxImprovements}`"
                @click="$emit('open-improvements', property.id)" />
            <div class="pf-actions__spacer" />
            <UButton :variant="confirmSell ? 'warning' : 'danger'" size="sm" icon="mdi:currency-usd"
                :label="confirmSell ? t('realestate.confirm_sell') : t('realestate.sell')"
                :subtitle="!confirmSell && sellPrice ? formatCash(sellPrice) : undefined" @click="handleSell" />
        </div>

        <!-- ══════════════════════════════════════
             DETAIL ACCORDIONS
             ══════════════════════════════════════ -->
        <div class="pf-details">
            <!-- Financials -->
            <UAccordion :title="t('realestate.financials')" icon="mdi:finance" variant="ghost" compact>
                <div class="pf-grid">
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.current_value') }}</span>
                        <span class="pf-row__v c-gold">{{ formatCash(property.currentValue) }}</span>
                    </div>
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.purchase_price') }}</span>
                        <span class="pf-row__v">{{ formatCash(property.purchasePrice) }}</span>
                    </div>
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.gross_rent') }}/t</span>
                        <span class="pf-row__v c-green">{{ grossRent ? formatCash(grossRent) : '—' }}</span>
                    </div>
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.maintenance') }}/t</span>
                        <span class="pf-row__v c-red">{{ maintenance ? '-' + formatCash(maintenance) : '—' }}</span>
                    </div>
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.tax_rate') }}</span>
                        <span class="pf-row__v">{{ formatRate(property.taxRate * 100) }}</span>
                    </div>
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.roi') }}</span>
                        <span class="pf-row__v"
                            :class="paybackDays < 30 ? 'c-green' : paybackDays === Infinity ? 'c-red' : ''">{{
                            paybackLabel
                            }}</span>
                    </div>
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.appreciation') }}</span>
                        <span class="pf-row__v c-green">{{ formatPercent(property.baseAppreciationRate * 100) }}/{{
                            t('common.cycle') }}</span>
                    </div>
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.sell_value') }}</span>
                        <span class="pf-row__v c-warn">{{ sellPrice ? formatCash(sellPrice) : '—' }}</span>
                    </div>
                </div>
                <div class="pf-lifetime">
                    <span>{{ t('realestate.total_rent_collected') }}: {{ formatCash(property.totalRentCollected)
                    }}</span>
                    <span>{{ t('realestate.total_maint_paid') }}: {{ formatCash(property.totalMaintenancePaid) }}</span>
                </div>
            </UAccordion>

            <!-- Management Style -->
            <UAccordion :title="t('realestate.management_style')" icon="mdi:cog" variant="ghost" compact>
                <div class="pf-styles">
                    <div v-for="style in MANAGEMENT_STYLES" :key="style.id" class="pf-style"
                        :class="{ 'pf-style--active': property.managementStyle === style.id }"
                        @click="handleStyleChange(style.id)">
                        <AppIcon :icon="style.icon" />
                        <span class="pf-style__name">{{ t(style.nameKey) }}</span>
                        <span class="pf-style__desc">{{ t(style.descKey) }}</span>
                    </div>
                </div>
            </UAccordion>

            <!-- Rent Pricing -->
            <UAccordion :title="t('realestate.rent_multiplier')" icon="mdi:cash-multiple" variant="ghost" compact>
                <div class="pf-slider">
                    <div class="pf-slider__head">
                        <span class="pf-slider__hint">{{ t('realestate.rent_hint') }}</span>
                        <span class="pf-slider__val">{{ property.rentMultiplier.toFixed(2) }}&times;</span>
                    </div>
                    <Slider :modelValue="Math.round(property.rentMultiplier * 100)" :min="50" :max="200" :step="5"
                        class="pf-slider__track" @update:modelValue="handleRentSlider" />
                    <div class="pf-slider__labels">
                        <span>0.5&times;</span><span>1.0&times;</span><span>2.0&times;</span>
                    </div>
                </div>
            </UAccordion>

            <!-- Improvements -->
            <UAccordion :title="t('realestate.improvements_label')" icon="mdi:puzzle" variant="ghost" compact>
                <div class="pf-imps">
                    <div v-if="improvements.length > 0" class="pf-imps__list">
                        <UTooltip v-for="imp in improvements" :key="imp.id" :text="t(imp.descriptionKey)">
                            <span class="pf-imp">
                                <AppIcon :icon="imp.icon" /> {{ t(imp.nameKey) }}
                            </span>
                        </UTooltip>
                    </div>
                    <span v-else class="pf-muted">{{ t('realestate.no_improvements_available') }}</span>
                    <UButton v-if="property.improvements.length < property.maxImprovements" variant="text" size="sm"
                        icon="mdi:plus-circle-outline" @click="$emit('open-improvements', property.id)">
                        {{ t('realestate.add_improvement') }} ({{ property.improvements.length }}/{{
                            property.maxImprovements
                        }})
                    </UButton>
                </div>
            </UAccordion>

            <!-- Property Info -->
            <UAccordion :title="t('realestate.property_info')" icon="mdi:information-outline" variant="ghost" compact>
                <div class="pf-grid">
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.wear_rate') }}</span>
                        <span class="pf-row__v">{{ property.wearRate.toFixed(4) }}/t</span>
                    </div>
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.base_rent') }}</span>
                        <span class="pf-row__v">{{ formatCash(property.baseRent) }}/t</span>
                    </div>
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.location_grade') }}</span>
                        <span v-if="gradeData" class="pf-row__v" :style="{ color: gradeData.color }">
                            {{ property.locationGrade }} ({{ gradeData.rentMultiplier.toFixed(2) }}&times;)
                        </span>
                    </div>
                    <div class="pf-row">
                        <span class="pf-row__l">{{ t('realestate.appreciation') }}</span>
                        <span class="pf-row__v">{{ formatPercent(property.baseAppreciationRate * 100) }}/{{
                            t('common.cycle')
                        }}</span>
                    </div>
                </div>
            </UAccordion>
        </div>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════
   Root
   ═══════════════════════════════════════ */
.pf {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    animation: pfIn 0.2s ease;
}

@keyframes pfIn {
    from {
        opacity: 0;
        transform: translateY(6px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ═══════════════════════════════════════
   Toolbar
   ═══════════════════════════════════════ */
.pf-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pf-toolbar__nav {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
}

.pf-toolbar__counter {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    min-width: 3.5em;
    text-align: center;
}

/* ═══════════════════════════════════════
   Hero Card
   ═══════════════════════════════════════ */
.pf-hero {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    overflow: hidden;
}

.pf-hero__layout {
    display: flex;
    align-items: stretch;
    min-height: 160px;
}

.pf-hero__visual {
    width: 180px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    padding: var(--t-space-3) var(--t-space-2) 0;
    background: var(--t-bg-muted);
}

.pf-hero__center {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--t-space-1-5);
    padding: var(--t-space-3) var(--t-space-4);
}

.pf-hero__name-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
}

.pf-hero__name {
    margin: 0;
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    cursor: pointer;
    line-height: 1.2;
}

.pf-hero__name:hover {
    color: var(--t-text-secondary);
}

.pf-hero__rename {
    width: 180px;
}

.pf-hero__badges {
    display: flex;
    align-items: center;
    gap: var(--t-space-1-5);
    flex-wrap: wrap;
}

.pf-hero__units {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    font-family: var(--t-font-mono);
}

.pf-hero__reno {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    font-family: var(--t-font-mono);
}

.pf-star {
    color: var(--t-gold);
    font-size: 0.6rem;
}

.pf-hero__traits {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

/* Right KPI panel */
.pf-hero__right {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    border-left: 1px solid var(--t-border);
    min-width: 140px;
}

.pf-kpi-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
}

.pf-kpi-label {
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
    line-height: 1;
}

.pf-kpi-val {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    line-height: 1.2;
}

.pf-kpi-sub {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    line-height: 1;
}

/* Condition micro-bar */
.pf-hero__cbar {
    height: 3px;
    background: var(--t-bg-muted);
}

.pf-hero__cfill {
    height: 100%;
    transition: width 0.4s ease;
}

/* Grade badge */
.pf-grade {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.1rem 0.45rem;
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--_gc);
    background: color-mix(in srgb, var(--_gc) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--_gc) 25%, transparent);
}

/* Trait badge */
.pf-trait {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.12rem 0.4rem;
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
}

.pf-trait--pos {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.pf-trait--neg {
    background: var(--t-warning-muted);
    color: var(--t-warning);
}

/* ═══════════════════════════════════════
   Stats Strip
   ═══════════════════════════════════════ */
.pf-strip {
    display: flex;
    align-items: stretch;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    overflow: hidden;
}

.pf-strip__cell {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
    padding: var(--t-space-2) var(--t-space-3);
}

.pf-strip__sep {
    width: 1px;
    align-self: stretch;
    background: var(--t-border);
}

.pf-strip__label {
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
}

.pf-strip__val {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.pf-bar-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.pf-bar {
    flex: 1;
    height: 5px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-xs);
    overflow: hidden;
}

.pf-bar__fill {
    height: 100%;
    border-radius: var(--t-radius-xs);
    transition: width 0.5s ease;
}

/* ═══════════════════════════════════════
   Portfolio Bonus
   ═══════════════════════════════════════ */
.pf-bonus {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-1-5) var(--t-space-3);
    background: var(--t-success-muted);
    border: 1px solid color-mix(in srgb, var(--t-success) 25%, transparent);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
    color: var(--t-success);
}

/* ═══════════════════════════════════════
   Actions
   ═══════════════════════════════════════ */
.pf-actions {
    display: flex;
    align-items: center;
    gap: var(--t-space-1-5);
    flex-wrap: wrap;
    padding: var(--t-space-1-5) var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.pf-actions__spacer {
    flex: 1;
}

/* ═══════════════════════════════════════
   Details (Accordions)
   ═══════════════════════════════════════ */
.pf-details {
    display: flex;
    flex-direction: column;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    overflow: hidden;
    padding: var(--t-space-1) 0;
}

.pf-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 var(--t-space-4);
}

.pf-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-0-5) 0;
    border-bottom: 1px solid color-mix(in srgb, var(--t-border) 50%, transparent);
}

.pf-row:last-child {
    border-bottom: none;
}

.pf-row__l {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.pf-row__v {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.pf-lifetime {
    display: flex;
    gap: var(--t-space-4);
    margin-top: var(--t-space-2);
    padding-top: var(--t-space-1-5);
    border-top: 1px solid var(--t-border);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

/* Management styles */
.pf-styles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--t-space-1);
}

.pf-style {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--t-space-1-5) var(--t-space-1);
    border-radius: var(--t-radius-sm);
    border: 1px solid var(--t-border);
    background: var(--t-bg-muted);
    cursor: pointer;
    text-align: center;
    transition: all 0.15s ease;
}

.pf-style:hover {
    background: var(--t-bg-card-hover);
    border-color: var(--t-border-hover);
}

.pf-style:active {
    transform: scale(0.97);
}

.pf-style--active {
    border-color: var(--t-cta);
    box-shadow: 0 0 0 1px var(--t-cta);
    background: var(--t-bg-card);
}

.pf-style__name {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
}

.pf-style__desc {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    line-height: 1.2;
}

/* Rent slider */
.pf-slider {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.pf-slider__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pf-slider__hint {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.pf-slider__val {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-base);
    color: var(--t-text);
}

.pf-slider__track {
    width: 100%;
}

.pf-slider__labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    color: var(--t-text-muted);
}

/* Improvements */
.pf-imps {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.pf-imps__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.pf-imp {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.4rem;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

/* ═══════════════════════════════════════
   Colors
   ═══════════════════════════════════════ */
.c-green {
    color: var(--t-success);
}

.c-red {
    color: var(--t-danger);
}

.c-gold {
    color: var(--t-gold);
}

.c-warn {
    color: var(--t-warning);
}

.pf-muted {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}
</style>
