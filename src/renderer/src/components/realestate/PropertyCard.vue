<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useFormat } from '@renderer/composables/useFormat'
import { mul } from '@renderer/core/BigNum'
import type { Property } from '@renderer/stores/useRealEstateStore'
import type Decimal from 'break_infinity.js'

const props = defineProps<{
    property: Property
    renovationCost: Decimal
    canAffordRenovation: boolean
    canAffordRepair: boolean
}>()

const emit = defineEmits<{
    repair: []
    renovate: []
    'set-rent': [multiplier: number]
    rename: [name: string]
    sell: []
}>()

const { formatCash } = useFormat()

const displayName = computed(() => props.property.customName || props.property.name)
const netPerSecond = computed(() => mul(props.property.netIncomePerTick, 10))
const grossPerSecond = computed(() => mul(props.property.grossRentPerTick, 10))
const expensesPerSecond = computed(() => mul(props.property.expensesPerTick, 10))
const isProfitable = computed(() => props.property.netIncomePerTick.gte(0))
const occupancyPct = computed(() => Math.round(props.property.occupancy * 100))
const conditionPct = computed(() => Math.round(props.property.condition))
const needsRepair = computed(() => props.property.condition < 70)

// Condition bar color
const conditionCls = computed(() => {
    if (props.property.condition >= 80) return 'good'
    if (props.property.condition >= 50) return 'warn'
    return 'danger'
})

// Occupancy bar color
const occupancyCls = computed(() => {
    if (props.property.occupancy >= 0.85) return 'good'
    if (props.property.occupancy >= 0.5) return 'warn'
    return 'danger'
})

// ── Rename ──
const editing = ref(false)
const editName = ref('')
const nameInput = ref<HTMLInputElement>()

function startRename(): void {
    editName.value = displayName.value
    editing.value = true
    nextTick(() => nameInput.value?.select())
}

function confirmRename(): void {
    editing.value = false
    emit('rename', editName.value)
}

function cancelRename(): void {
    editing.value = false
}

// ── Rent adjustment ──
function adjustRent(delta: number): void {
    const newMul = Math.round((props.property.rentMultiplier + delta) * 10) / 10
    emit('set-rent', Math.max(0.5, Math.min(3.0, newMul)))
}

// ── Details toggle ──
const showDetails = ref(false)
</script>

<template>
    <div class="prop-card" :class="{ profitable: isProfitable, loss: !isProfitable }">
        <!-- Header -->
        <div class="prop-header">
            <div class="prop-icon-wrap">
                <AppIcon :icon="property.icon || 'mdi:home'" class="prop-icon" />
            </div>
            <div class="prop-info">
                <div class="prop-name-row">
                    <template v-if="editing">
                        <input ref="nameInput" v-model="editName" class="rename-input" maxlength="30"
                            @keyup.enter="confirmRename" @keyup.escape="cancelRename" @blur="confirmRename" />
                    </template>
                    <template v-else>
                        <h3 class="prop-name" @dblclick="startRename" :title="$t('common.double_click_rename')">
                            {{ displayName }}
                        </h3>
                        <button class="rename-btn" @click="startRename" :title="$t('common.rename')">
                            <AppIcon icon="mdi:pencil-outline" />
                        </button>
                    </template>
                    <span class="prop-category">{{ property.category }}</span>
                </div>
                <div class="prop-meta">
                    <span>{{ property.units }} {{ $t('common.unit', property.units) }}</span>
                    <span>·</span>
                    <span>{{ $t('realestate.reno_lv', { level: property.renovationLevel }) }}</span>
                </div>
            </div>
        </div>

        <!-- Condition & Occupancy Bars -->
        <div class="bars-section">
            <div class="bar-row">
                <div class="bar-label">
                    <AppIcon icon="mdi:wrench" class="bar-icon" />
                    <span>{{ $t('realestate.condition') }}</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" :class="conditionCls" :style="{ width: conditionPct + '%' }"></div>
                </div>
                <span class="bar-value" :class="conditionCls">{{ conditionPct }}%</span>
            </div>
            <div class="bar-row">
                <div class="bar-label">
                    <AppIcon icon="mdi:account-multiple" class="bar-icon" />
                    <span>{{ $t('realestate.occupancy') }}</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" :class="occupancyCls" :style="{ width: occupancyPct + '%' }"></div>
                </div>
                <span class="bar-value" :class="occupancyCls">{{ occupancyPct }}%
                    <small>({{ property.occupiedUnits }}/{{ property.units }})</small>
                </span>
            </div>
        </div>

        <!-- P&L Summary -->
        <div class="pl-row">
            <div class="pl-item">
                <span class="pl-label">{{ $t('realestate.gross_s') }}</span>
                <span class="pl-value success">{{ formatCash(grossPerSecond) }}</span>
            </div>
            <div class="pl-item">
                <span class="pl-label">{{ $t('realestate.expenses_s') }}</span>
                <span class="pl-value danger">{{ formatCash(expensesPerSecond) }}</span>
            </div>
            <div class="pl-item">
                <span class="pl-label">{{ $t('realestate.net_s') }}</span>
                <span class="pl-value" :class="isProfitable ? 'success' : 'danger'">
                    {{ formatCash(netPerSecond) }}
                </span>
            </div>
        </div>

        <!-- Controls -->
        <div class="controls-section">
            <!-- Rent Multiplier -->
            <div class="control-row">
                <div class="control-label">
                    <AppIcon icon="mdi:cash-multiple" class="control-icon" />
                    <span>{{ $t('realestate.rent_price') }}</span>
                    <span class="control-hint">
                        ({{ property.rentMultiplier < 1 ? $t('realestate.discount') : property.rentMultiplier > 1.1 ?
                            $t('realestate.premium') :
                            $t('realestate.market') }})
                    </span>
                </div>
                <div class="control-actions">
                    <button class="adj-btn" :disabled="property.rentMultiplier <= 0.5"
                        @click="adjustRent(-0.1)">−</button>
                    <span class="control-value">×{{ property.rentMultiplier.toFixed(1) }}</span>
                    <button class="adj-btn" :disabled="property.rentMultiplier >= 3.0"
                        @click="adjustRent(0.1)">+</button>
                </div>
            </div>

            <!-- Repair -->
            <div v-if="needsRepair" class="control-row repair-row">
                <div class="control-label">
                    <AppIcon icon="mdi:hammer-wrench" class="control-icon warn-icon" />
                    <span class="warn-text">{{ $t('realestate.needs_repair') }}</span>
                </div>
                <Button size="small" severity="warn" outlined :disabled="!canAffordRepair" @click="$emit('repair')">
                    {{ $t('realestate.repair_cost', { cost: formatCash(property.repairCost) }) }}
                </Button>
            </div>

            <!-- Renovate -->
            <div v-if="property.renovationLevel < property.maxRenovationLevel" class="control-row">
                <div class="control-label">
                    <AppIcon icon="mdi:home-modern" class="control-icon" />
                    <span>{{ $t('realestate.renovate') }}</span>
                    <span class="control-hint">{{ $t('realestate.reno_hint') }}</span>
                </div>
                <Button size="small" severity="secondary" outlined :disabled="!canAffordRenovation"
                    @click="$emit('renovate')">
                    {{ $t('realestate.reno_level', {
                        level: property.renovationLevel + 1, cost:
                            formatCash(renovationCost) }) }}
                </Button>
            </div>
        </div>

        <!-- Footer -->
        <div class="card-footer">
            <div class="footer-left">
                <span class="valuation-label">{{ $t('realestate.value_label', {
                    value: formatCash(property.currentValue)
                    })
                    }}</span>
                <button class="details-toggle" @click="showDetails = !showDetails">
                    <AppIcon :icon="showDetails ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
                    {{ showDetails ? $t('common.less') : $t('common.details') }}
                </button>
            </div>
            <Button size="small" severity="danger" text @click="$emit('sell')">
                <AppIcon icon="mdi:home-remove" />
                {{ $t('common.sell') }}
            </Button>
        </div>

        <!-- Expandable details -->
        <Transition name="slide">
            <div v-if="showDetails" class="details-panel">
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="d-label">{{ $t('realestate.purchase_price') }}</span>
                        <span class="d-value">{{ formatCash(property.purchasePrice) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="d-label">{{ $t('realestate.current_value') }}</span>
                        <span class="d-value">{{ formatCash(property.currentValue) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="d-label">{{ $t('realestate.base_rent_tick') }}</span>
                        <span class="d-value">{{ formatCash(property.baseRent) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="d-label">{{ $t('realestate.wear_rate') }}</span>
                        <span class="d-value">{{ property.wearRate.toFixed(4) }}/t</span>
                    </div>
                    <div class="detail-item">
                        <span class="d-label">{{ $t('realestate.tax_rate') }}</span>
                        <span class="d-value">{{ (property.taxRate * 100).toFixed(1) }}% /yr</span>
                    </div>
                    <div class="detail-item">
                        <span class="d-label">{{ $t('realestate.maint_tick') }}</span>
                        <span class="d-value">{{ formatCash(property.baseMaintenance) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="d-label">{{ $t('realestate.total_rent') }}</span>
                        <span class="d-value success">{{ formatCash(property.totalRentEarned) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="d-label">{{ $t('realestate.total_expenses') }}</span>
                        <span class="d-value danger">{{ formatCash(property.totalExpensesPaid) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="d-label">{{ $t('realestate.total_net') }}</span>
                        <span class="d-value" :class="property.totalNetIncome.gte(0) ? 'success' : 'danger'">
                            {{ formatCash(property.totalNetIncome) }}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="d-label">{{ $t('realestate.owned_for') }}</span>
                        <span class="d-value">{{ Math.floor((property.ownedSinceTick > 0 ? property.ownedSinceTick : 0)
                            / 10)
                            }}s</span>
                    </div>
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
    padding: var(--t-space-5);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    box-shadow: var(--t-shadow-sm);
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.prop-card:hover {
    border-color: var(--t-border-hover);
}

/* Header */
.prop-header {
    display: flex;
    gap: var(--t-space-3);
}

.prop-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.prop-icon {
    font-size: 1.25rem;
    color: var(--t-text-secondary);
}

.prop-info {
    flex: 1;
    min-width: 0;
}

.prop-name-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.prop-name {
    font-size: var(--t-font-size-base);
    font-weight: 600;
    color: var(--t-text);
    cursor: pointer;
    margin: 0;
}

.prop-name:hover {
    text-decoration: underline dotted;
}

.rename-btn {
    background: none;
    border: none;
    color: var(--t-text-muted);
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0;
    opacity: 0.5;
    transition: opacity var(--t-transition-fast);
}

.rename-btn:hover {
    opacity: 1;
    color: var(--t-text);
}

.rename-input {
    font-size: var(--t-font-size-base);
    font-weight: 600;
    color: var(--t-text);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-primary, #71717a);
    border-radius: var(--t-radius-sm);
    padding: 0.1rem 0.35rem;
    outline: none;
    max-width: 160px;
    -webkit-app-region: no-drag;
}

.prop-category {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    padding: 0.1rem 0.35rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.prop-meta {
    display: flex;
    gap: 0.35rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin-top: 0.15rem;
}

/* Condition & Occupancy Bars */
.bars-section {
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
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    min-width: 5.5rem;
}

.bar-icon {
    font-size: 0.85rem;
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
    transition: width 0.3s ease;
}

.bar-fill.good {
    background: var(--t-success);
}

.bar-fill.warn {
    background: var(--t-warning, #f59e0b);
}

.bar-fill.danger {
    background: var(--t-danger, #e74c3c);
}

.bar-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    min-width: 4.5rem;
    text-align: right;
}

.bar-value small {
    font-weight: 400;
    opacity: 0.7;
}

.bar-value.good {
    color: var(--t-success);
}

.bar-value.warn {
    color: var(--t-warning, #f59e0b);
}

.bar-value.danger {
    color: var(--t-danger, #e74c3c);
}

/* P&L Row */
.pl-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
}

.pl-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
}

.pl-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.pl-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: 700;
}

.pl-value.success {
    color: var(--t-success);
}

.pl-value.danger {
    color: var(--t-danger, #e74c3c);
}

/* Controls */
.controls-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.3rem 0;
}

.repair-row {
    padding: 0.4rem var(--t-space-2);
    background: rgba(245, 158, 11, 0.08);
    border-radius: var(--t-radius-sm);
}

.control-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
}

.control-icon {
    font-size: 1rem;
    color: var(--t-text-muted);
}

.warn-icon {
    color: var(--t-warning, #f59e0b);
}

.warn-text {
    color: var(--t-warning, #f59e0b);
    font-weight: 600;
}

.control-hint {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    opacity: 0.7;
}

.control-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.control-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    min-width: 2.5rem;
    text-align: center;
    color: var(--t-text);
}

.adj-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    color: var(--t-text);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--t-transition-fast);
    -webkit-app-region: no-drag;
}

.adj-btn:hover:not(:disabled) {
    background: var(--t-bg-elevated, var(--t-bg-card));
    border-color: var(--t-border-hover);
}

.adj-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

/* Footer */
.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--t-space-2);
    border-top: 1px solid var(--t-border);
    margin-top: auto;
}

.footer-left {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.valuation-label {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    font-family: var(--t-font-mono);
}

.details-toggle {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    background: none;
    border: none;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-xs);
    cursor: pointer;
    padding: 0.15rem 0.4rem;
    border-radius: var(--t-radius-sm);
    transition: all var(--t-transition-fast);
}

.details-toggle:hover {
    background: var(--t-bg-muted);
    color: var(--t-text);
}

/* Details Panel */
.details-panel {
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

.detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem 1rem;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.1rem 0;
}

.d-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.d-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text);
}

.d-value.success {
    color: var(--t-success);
}

.d-value.danger {
    color: var(--t-danger, #e74c3c);
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.2s ease;
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
    max-height: 500px;
}
</style>
