<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore, type Property } from '@renderer/stores/useRealEstateStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { getDistrict, getTrait, MANAGEMENT_STYLES, type ManagementStyle, getImprovement, type PropertyTrait, type ImprovementDef } from '@renderer/data/realestate'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Slider from 'primevue/slider'
import InputText from 'primevue/inputtext'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const player = usePlayerStore()
const { formatCash, formatPercent, formatRate } = useFormat()

const props = defineProps<{ property: Property }>()
const emit = defineEmits<{
    (e: 'sold'): void
    (e: 'open-improvements'): void
}>()

const showRename = ref(false)
const newName = ref('')
const confirmSell = ref(false)
const showDetails = ref(false)

const district = computed(() => getDistrict(props.property.districtId))
const traits = computed(() => props.property.traits.map(tid => getTrait(tid)).filter(Boolean) as PropertyTrait[])
const improvements = computed(() => props.property.improvements.map(id => getImprovement(id)).filter(Boolean) as ImprovementDef[])
const netRent = computed(() => realEstate.computePropertyNetRent(props.property))
const grossRent = computed(() => realEstate.computePropertyRent(props.property))
const maintenance = computed(() => realEstate.computePropertyMaintenance(props.property))
const synergy = computed(() => realEstate.getDistrictSynergy(props.property.districtId))
const displayName = computed(() => props.property.customName || props.property.name)

const roi = computed(() => {
    const purchase = props.property.purchasePrice.toNumber()
    if (purchase <= 0) return 0
    return (netRent.value.toNumber() * 10 * 3600 * 24 * 365) / purchase
})

const repairCost = computed(() => realEstate.getRepairCost(props.property))
const renovateCost = computed(() => realEstate.getRenovateCost(props.property))
const sellPrice = computed(() => realEstate.getSellPrice(props.property))
const canAffordRepair = computed(() => player.cash.gte(repairCost.value) && props.property.condition < 98)
const canAffordRenovate = computed(() => player.cash.gte(renovateCost.value) && props.property.renovationLevel < props.property.maxRenovationLevel)

const conditionColor = computed(() => {
    if (props.property.condition >= 80) return 'var(--t-success)'
    if (props.property.condition >= 50) return 'var(--t-warning)'
    if (props.property.condition >= 25) return '#f97316'
    return 'var(--t-danger)'
})

const valueChange = computed(() => {
    const current = props.property.currentValue.toNumber()
    const purchase = props.property.purchasePrice.toNumber()
    if (purchase <= 0) return 0
    return ((current - purchase) / purchase) * 100
})

function handleRenovate(): void { realEstate.renovateProperty(props.property.id) }
function handleRepair(): void { realEstate.repairProperty(props.property.id) }
function handleSell(): void {
    if (!confirmSell.value) { confirmSell.value = true; setTimeout(() => { confirmSell.value = false }, 3000); return }
    realEstate.sellProperty(props.property.id)
    emit('sold')
}
function handleRename(): void { realEstate.renameProperty(props.property.id, newName.value); showRename.value = false }
function handleStyleChange(style: ManagementStyle): void { realEstate.setManagementStyle(props.property.id, style) }
function handleRentSlider(val: number | number[]): void {
    realEstate.setRentMultiplier(props.property.id, (Array.isArray(val) ? val[0] : val) / 100)
}
</script>

<template>
    <div class="prop-card" :style="{ '--_accent': district?.color ?? 'var(--t-accent)' }">
        <!-- ── Header ── -->
        <div class="prop-card__head">
            <AppIcon :icon="property.icon" class="prop-card__icon" />
            <div class="prop-card__identity">
                <div class="prop-card__name-row">
                    <span v-if="!showRename" class="prop-card__name"
                        @dblclick="showRename = true; newName = displayName">
                        {{ displayName }}
                    </span>
                    <div v-else class="prop-card__rename">
                        <InputText v-model="newName" size="small" class="prop-card__rename-input"
                            @keyup.enter="handleRename" />
                        <Button icon="pi pi-check" text rounded size="small" @click="handleRename" />
                        <Button icon="pi pi-times" text rounded size="small" @click="showRename = false" />
                    </div>
                </div>
                <div class="prop-card__meta">
                    <Tag :value="property.category" size="small" severity="secondary" />
                    <span v-if="district" class="prop-card__district">
                        <AppIcon :icon="district.icon" /> {{ t(district.nameKey) }}
                    </span>
                </div>
            </div>
            <!-- Net rent hero -->
            <div class="prop-card__hero-rent">
                <span class="prop-card__hero-label">{{ t('realestate.net_rent') }}/t</span>
                <span class="prop-card__hero-value" :class="netRent.gt(0) ? 'text-emerald' : 'text-red'">
                    {{ formatCash(netRent) }}
                </span>
            </div>
        </div>

        <!-- ── Stat chips (quick glance) ── -->
        <div class="prop-card__chips">
            <span class="chip" :class="valueChange >= 0 ? 'chip--pos' : 'chip--neg'">
                <AppIcon :icon="valueChange >= 0 ? 'mdi:trending-up' : 'mdi:trending-down'" />
                {{ formatPercent(valueChange) }}
            </span>
            <span class="chip">
                <AppIcon icon="mdi:door" /> {{ property.units }} {{ t('realestate.units') }}
            </span>
            <span class="chip">
                <AppIcon icon="mdi:arrow-up-bold" /> Lv.{{ property.renovationLevel }}/{{
                    property.maxRenovationLevel }}
            </span>
            <span class="chip">
                <AppIcon icon="mdi:puzzle" /> {{ property.improvements.length }}/{{
                    property.maxImprovements }}
            </span>
        </div>

        <!-- ── Condition & Occupancy bars ── -->
        <div class="prop-card__bars">
            <div class="bar-row">
                <span class="bar-label">{{ t('realestate.condition') }}</span>
                <div class="bar-track">
                    <div class="bar-fill" :style="{ width: property.condition + '%', background: conditionColor }">
                    </div>
                </div>
                <span class="bar-value" :style="{ color: conditionColor }">{{ Math.round(property.condition) }}%</span>
            </div>
            <div class="bar-row">
                <span class="bar-label">{{ t('realestate.occupancy') }}</span>
                <div class="bar-track">
                    <div class="bar-fill"
                        :style="{ width: (property.occupancy * 100) + '%', background: 'var(--t-accent)' }"></div>
                </div>
                <span class="bar-value">{{ formatRate(property.occupancy * 100) }}</span>
            </div>
        </div>

        <!-- ── Traits ── -->
        <div v-if="traits.length > 0" class="prop-card__traits">
            <span v-for="tr in traits" :key="tr.id" class="trait-badge"
                :class="tr.isPositive ? 'trait-badge--pos' : 'trait-badge--neg'">
                <AppIcon :icon="tr.icon" /> {{ t(tr.nameKey) }}
            </span>
        </div>

        <!-- ── Synergy banner ── -->
        <div v-if="synergy.rentBonus > 0" class="prop-card__synergy">
            <AppIcon icon="mdi:link-variant" />
            <span>{{ t('realestate.synergy.active_bonus') }}: {{ formatPercent(synergy.rentBonus * 100) }}
                {{ t('realestate.rent') }}</span>
        </div>

        <!-- ── Actions row ── -->
        <div class="prop-card__actions">
            <button class="prop-card__act-btn" :disabled="!canAffordRepair" @click="handleRepair"
                :title="t('realestate.repair')">
                <AppIcon icon="mdi:wrench" />
                <span class="act-label">{{ t('realestate.repair') }}</span>
                <span v-if="property.condition < 98" class="act-cost">{{ formatCash(repairCost) }}</span>
            </button>
            <button class="prop-card__act-btn" :disabled="!canAffordRenovate" @click="handleRenovate"
                :title="t('realestate.renovate')">
                <AppIcon icon="mdi:arrow-up-bold" />
                <span class="act-label">{{ t('realestate.renovate') }}</span>
                <span v-if="property.renovationLevel < property.maxRenovationLevel" class="act-cost">{{
                    formatCash(renovateCost) }}</span>
            </button>
            <button class="prop-card__act-btn prop-card__act-btn--sell"
                :class="{ 'prop-card__act-btn--confirm': confirmSell }" @click="handleSell">
                <AppIcon icon="mdi:currency-usd" />
                <span class="act-label">{{ confirmSell ? t('realestate.confirm_sell') : t('realestate.sell') }}</span>
                <span v-if="!confirmSell" class="act-cost act-cost--sell">{{ formatCash(sellPrice) }}</span>
            </button>
        </div>

        <!-- ── Footer: Details toggle ── -->
        <div class="prop-card__footer">
            <div class="prop-card__footer-stats">
                <span>{{ t('realestate.total_rent_collected') }}: {{ formatCash(property.totalRentCollected) }}</span>
                <span>{{ t('realestate.total_maint_paid') }}: {{ formatCash(property.totalMaintenancePaid) }}</span>
            </div>
            <button class="details-toggle" @click="showDetails = !showDetails">
                <AppIcon :icon="showDetails ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
                {{ showDetails ? t('common.less') : t('common.details') }}
            </button>
        </div>

        <!-- ── Expandable Details Panel ── -->
        <Transition name="slide">
            <div v-if="showDetails" class="details-panel">
                <!-- Financials -->
                <div class="detail-section">
                    <h4 class="detail-title">
                        <AppIcon icon="mdi:finance" /> {{ t('realestate.financials') }}
                    </h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.current_value') }}</span>
                            <span class="d-value highlight">{{ formatCash(property.currentValue) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.purchase_price') }}</span>
                            <span class="d-value">{{ formatCash(property.purchasePrice) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.gross_rent') }}/t</span>
                            <span class="d-value success">{{ formatCash(grossRent) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.maintenance') }}/t</span>
                            <span class="d-value danger">-{{ formatCash(maintenance) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.tax_rate') }}</span>
                            <span class="d-value">{{ formatRate(property.taxRate * 100) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.roi') }}</span>
                            <span class="d-value" :class="roi > 0 ? 'success' : 'danger'">{{ formatPercent(roi)
                            }}</span>
                        </div>
                    </div>
                </div>

                <!-- Property Info -->
                <div class="detail-section">
                    <h4 class="detail-title">
                        <AppIcon icon="mdi:information-outline" /> {{ t('realestate.property_info') }}
                    </h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.wear_rate') }}</span>
                            <span class="d-value">{{ property.wearRate.toFixed(4) }}/t</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.appreciation') }}</span>
                            <span class="d-value success">{{ formatPercent(property.baseAppreciationRate * 100)
                            }}/{{ t('common.cycle') }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.rent_multiplier') }}</span>
                            <span class="d-value info">{{ property.rentMultiplier.toFixed(2) }}&#215;</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ t('realestate.sell_value') }}</span>
                            <span class="d-value warn">{{ formatCash(sellPrice) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Management Style -->
                <div class="detail-section">
                    <h4 class="detail-title">
                        <AppIcon icon="mdi:cog" /> {{ t('realestate.management_style') }}
                    </h4>
                    <div class="prop-card__styles">
                        <div v-for="style in MANAGEMENT_STYLES" :key="style.id" class="style-opt"
                            :class="{ active: property.managementStyle === style.id }"
                            @click="handleStyleChange(style.id)">
                            <AppIcon :icon="style.icon" />
                            <span>{{ t(style.nameKey) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Rent Slider -->
                <div class="detail-section">
                    <div class="prop-card__slider-head">
                        <h4 class="detail-title" style="margin:0">
                            <AppIcon icon="mdi:cash-multiple" /> {{ t('realestate.rent_multiplier') }}
                        </h4>
                        <span class="prop-card__rent-val">{{ property.rentMultiplier.toFixed(2) }}&#215;</span>
                    </div>
                    <Slider :modelValue="Math.round(property.rentMultiplier * 100)" :min="50" :max="200" :step="5"
                        class="prop-card__slider" @update:modelValue="handleRentSlider" />
                    <div class="prop-card__slider-labels">
                        <span>0.5&#215;</span><span>1.0&#215;</span><span>2.0&#215;</span>
                    </div>
                </div>

                <!-- Improvements -->
                <div class="detail-section">
                    <h4 class="detail-title">
                        <AppIcon icon="mdi:puzzle" /> {{ t('realestate.improvements_label') }}
                        <span class="detail-count">{{ property.improvements.length }}/{{ property.maxImprovements
                        }}</span>
                    </h4>
                    <div v-if="improvements.length > 0" class="prop-card__improvements">
                        <span v-for="im in improvements" :key="im.id" class="imp-badge">
                            <AppIcon :icon="im.icon" /> {{ t(im.nameKey) }}
                        </span>
                    </div>
                    <button v-if="property.improvements.length < property.maxImprovements" class="prop-card__link-btn"
                        @click="emit('open-improvements')">
                        <AppIcon icon="mdi:plus-circle-outline" /> {{ t('realestate.add_improvement') }}
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.prop-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    box-shadow: var(--t-shadow-sm);
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.prop-card:hover {
    border-color: var(--t-border-hover);
    box-shadow: var(--t-shadow-md);
}

/* ── Head ── */
.prop-card__head {
    display: flex;
    gap: var(--t-space-3);
    align-items: flex-start;
}

.prop-card__icon {
    font-size: 1.75rem;
    color: var(--_accent);
    flex-shrink: 0;
}

.prop-card__identity {
    flex: 1;
    min-width: 0;
}

.prop-card__name-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.prop-card__name {
    font-size: var(--t-font-size-lg);
    font-weight: 700;
    color: var(--t-text);
    cursor: pointer;
}

.prop-card__name:hover {
    text-decoration: underline dotted;
}

.prop-card__rename {
    display: flex;
    align-items: center;
    gap: 0.2rem;
}

.prop-card__rename-input {
    width: 140px;
}

.prop-card__meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.15rem;
}

.prop-card__district {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

/* ── Hero rent ── */
.prop-card__hero-rent {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
}

.prop-card__hero-label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
}

.prop-card__hero-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: 800;
}

/* ── Chips ── */
.prop-card__chips {
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

/* ── Bars ── */
.prop-card__bars {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.bar-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.bar-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    width: 80px;
    flex-shrink: 0;
}

.bar-track {
    flex: 1;
    height: 6px;
    background: var(--t-bg-muted);
    border-radius: 3px;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
}

.bar-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: 700;
    width: 40px;
    text-align: right;
}

/* ── Traits ── */
.prop-card__traits {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.trait-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    font-size: var(--t-font-size-xs);
    font-weight: 500;
}

.trait-badge--pos {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.trait-badge--neg {
    background: var(--t-warning-muted);
    color: var(--t-warning);
}

/* ── Synergy ── */
.prop-card__synergy {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-success-muted);
    border: 1px solid color-mix(in srgb, var(--t-success) 25%, transparent);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-sm);
    color: var(--t-success);
}

/* ── Actions ── */
.prop-card__actions {
    display: flex;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.prop-card__act-btn {
    flex: 1;
    min-width: 90px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: var(--t-space-2) var(--t-space-2);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    border-radius: var(--t-radius-sm);
    border: 1px solid var(--t-border);
    background: var(--t-bg-muted);
    color: var(--t-text-secondary);
    cursor: pointer;
    transition: all var(--t-transition-fast);
    line-height: 1.2;
}

.prop-card__act-btn:hover:not(:disabled) {
    border-color: var(--t-border-hover);
    color: var(--t-text);
    background: var(--t-bg-card-hover);
}

.prop-card__act-btn:disabled {
    opacity: 0.35;
    cursor: default;
}

.act-label {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
}

.act-cost {
    font-family: var(--t-font-mono);
    font-size: 0.6rem;
    color: var(--t-text-muted);
    font-weight: 400;
}

.act-cost--sell {
    color: var(--t-success);
}

.prop-card__act-btn--sell:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--t-warning) 35%, var(--t-border));
    color: var(--t-warning);
}

.prop-card__act-btn--confirm {
    border-color: var(--t-danger);
    background: var(--t-danger-muted);
    color: var(--t-danger);
}

/* ── Footer ── */
.prop-card__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--t-space-2);
    border-top: 1px solid var(--t-border);
}

.prop-card__footer-stats {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.details-toggle {
    display: inline-flex;
    align-items: center;
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
    max-height: 800px;
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

.detail-count {
    margin-left: auto;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    font-weight: 400;
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

.d-value.info {
    color: var(--t-accent);
}

.d-value.warn {
    color: var(--t-warning);
}

.d-value.highlight {
    color: var(--t-warning);
}

/* ── Management Styles ── */
.prop-card__styles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--t-space-1);
}

.style-opt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    padding: var(--t-space-2) var(--t-space-1);
    border-radius: var(--t-radius-sm);
    border: 1px solid var(--t-border);
    cursor: pointer;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    transition: all var(--t-transition-fast);
    background: var(--t-bg-card);
}

.style-opt:hover {
    background: var(--t-bg-card-hover);
    border-color: var(--t-border-hover);
}

.style-opt.active {
    border-color: var(--t-accent);
    background: color-mix(in srgb, var(--t-accent) 8%, var(--t-bg-card));
    color: var(--t-accent);
}

/* ── Slider ── */
.prop-card__slider-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.prop-card__rent-val {
    font-family: var(--t-font-mono);
    font-weight: 700;
    font-size: var(--t-font-size-base);
    color: var(--t-accent);
}

.prop-card__slider {
    width: 100%;
}

.prop-card__slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    color: var(--t-text-muted);
}

/* ── Improvements ── */
.prop-card__improvements {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.imp-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.5rem;
    background: color-mix(in srgb, var(--t-accent) 8%, var(--t-bg-card));
    border-radius: 6px;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

/* ── Link button (add improvement) ── */
.prop-card__link-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    padding: var(--t-space-1) 0;
    transition: color var(--t-transition-fast);
}

.prop-card__link-btn:hover {
    color: var(--t-accent);
}
</style>
