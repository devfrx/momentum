<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useFormat } from '@renderer/composables/useFormat'
import type { OwnedBusiness } from '@renderer/stores/useBusinessStore'
import { mul } from '@renderer/core/BigNum'

const props = defineProps<{
    business: OwnedBusiness
}>()

const emit = defineEmits<{
    hire: []
    fire: []
    'set-price': [price: number]
    'set-marketing': [budget: number]
    'upgrade-quality': []
    rename: [name: string]
    sell: []
    'hire-manager': []
    'collect-profit': []
}>()

const { formatCash } = useFormat()

const profitPerSecond = computed(() => mul(props.business.avgProfitPerTick, 10))
const revenuePerSecond = computed(() => mul(props.business.revenuePerTick, 10))
const costsPerSecond = computed(() => mul(props.business.costsPerTick, 10))
const isProfitable = computed(() => props.business.avgProfitPerTick.gte(0))
const hasPending = computed(() => props.business.pendingProfit.gt(0))
const isQualityMaxed = computed(() => props.business.quality >= 100)

const displayName = computed(() => props.business.customName || props.business.name)

// ── Rename inline editing ──
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

// ── Price factor label ──
const priceStatus = computed(() => {
    const pf = props.business.priceFactor
    if (pf >= 0.95 && pf <= 1.05) return { label: 'business.optimal', cls: 'success' }
    if (pf > 1.05) return { label: 'business.underpriced', cls: 'info' }
    if (pf < 0.95 && pf >= 0.6) return { label: 'business.overpriced', cls: 'warn' }
    return { label: 'business.too_expensive', cls: 'danger' }
})

// ── Utilization bar color ──
const utilizationPct = computed(() => Math.round(props.business.utilization * 100))
const utilizationCls = computed(() => {
    const u = props.business.utilization
    if (u >= 0.9) return 'high'
    if (u >= 0.5) return 'mid'
    return 'low'
})

// ── Expanded details toggle ──
const showDetails = ref(false)

function adjustPrice(delta: number): void {
    const newPrice = Math.max(0.01, props.business.pricePerUnit + delta)
    emit('set-price', Math.round(newPrice * 100) / 100)
}

function adjustMarketing(delta: number): void {
    const newBudget = Math.max(0, props.business.marketingBudget + delta)
    emit('set-marketing', newBudget)
}
</script>

<template>
    <div class="business-card" :class="{ profitable: isProfitable, loss: !isProfitable }">
        <!-- Card Header -->
        <div class="card-header">
            <div class="biz-icon-wrap">
                <AppIcon :icon="business.icon || 'mdi:store'" class="biz-icon" />
            </div>
            <div class="biz-info">
                <div class="biz-name-row">
                    <!-- Inline rename -->
                    <template v-if="editing">
                        <input ref="nameInput" v-model="editName" class="rename-input" maxlength="30"
                            @keyup.enter="confirmRename" @keyup.escape="cancelRename" @blur="confirmRename" />
                    </template>
                    <template v-else>
                        <h3 class="biz-name" @dblclick="startRename" :title="$t('common.double_click_rename')">
                            {{ displayName }}
                        </h3>
                        <button class="rename-btn" @click="startRename" :title="$t('common.rename')">
                            <AppIcon icon="mdi:pencil-outline" />
                        </button>
                    </template>
                    <span class="biz-category">{{ business.category }}</span>
                </div>

            </div>
        </div>

        <!-- Quick Stats Bar -->
        <div class="quick-stats">
            <div class="stat-chip">
                <AppIcon icon="mdi:account-multiple" class="stat-chip-icon" />
                <span class="stat-chip-val">{{ business.currentCustomers }}</span>
                <span class="stat-chip-label">{{ $t('business.demand') }}</span>
            </div>
            <div class="stat-chip">
                <AppIcon icon="mdi:package-variant" class="stat-chip-icon" />
                <span class="stat-chip-val">{{ business.unitsSold }}/{{ business.maxCapacity }}</span>
                <span class="stat-chip-label">{{ $t('business.sold') }}</span>
            </div>
            <div class="stat-chip" :class="utilizationCls">
                <AppIcon icon="mdi:gauge" class="stat-chip-icon" />
                <span class="stat-chip-val">{{ utilizationPct }}%</span>
                <span class="stat-chip-label">{{ $t('business.capacity') }}</span>
            </div>
            <div class="stat-chip" :class="priceStatus.cls">
                <AppIcon icon="mdi:currency-usd" class="stat-chip-icon" />
                <span class="stat-chip-val">{{ $t(priceStatus.label) }}</span>
            </div>
        </div>

        <!-- P&L Summary -->
        <div class="pl-row">
            <div class="pl-item">
                <span class="pl-label">{{ $t('business.revenue_s') }}</span>
                <span class="pl-value success">{{ formatCash(revenuePerSecond) }}</span>
            </div>
            <div class="pl-item">
                <span class="pl-label">{{ $t('business.costs_s') }}</span>
                <span class="pl-value danger">{{ formatCash(costsPerSecond) }}</span>
            </div>
            <div class="pl-item">
                <span class="pl-label">{{ $t('business.profit_s') }}</span>
                <span class="pl-value" :class="isProfitable ? 'success' : 'danger'">
                    {{ formatCash(profitPerSecond) }}
                </span>
            </div>
        </div>

        <!-- Manager / Collect Banner -->
        <div v-if="!business.hasManager" class="manager-banner">
            <div class="pending-section" v-if="hasPending">
                <div class="pending-info">
                    <AppIcon icon="mdi:cash-lock" class="pending-icon" />
                    <span class="pending-label">{{ $t('business.pending') }}</span>
                    <span class="pending-amount">{{ formatCash(business.pendingProfit) }}</span>
                </div>
                <button class="collect-btn" @click="$emit('collect-profit')">
                    <AppIcon icon="mdi:hand-coin" />
                    {{ $t('common.collect') }}
                </button>
            </div>
            <button class="manager-btn" @click="$emit('hire-manager')">
                <AppIcon icon="mdi:account-tie" class="manager-btn-icon" />
                <div class="manager-btn-text">
                    <span class="manager-btn-title">{{ $t('business.hire_manager') }}</span>
                    <span class="manager-btn-price">{{ formatCash(business.managerCost) }}</span>
                </div>
                <span class="manager-btn-hint">{{ $t('business.auto_collects') }}</span>
            </button>
        </div>
        <div v-else class="manager-active">
            <AppIcon icon="mdi:account-tie-hat" class="manager-active-icon" />
            <span class="manager-active-label">{{ $t('business.manager_active') }}</span>
        </div>

        <!-- Operational Controls -->
        <div class="controls-grid">
            <!-- Employees -->
            <div class="control-row">
                <div class="control-label">
                    <AppIcon icon="mdi:account-group" class="control-icon" />
                    <span>{{ $t('business.employees') }}</span>
                    <span class="control-hint">(cap: {{ business.employees * business.outputPerEmployee }}/t)</span>
                </div>
                <div class="control-actions">
                    <button class="adj-btn" :disabled="business.employees <= 1" @click="$emit('fire')">−</button>
                    <span class="control-value">{{ business.employees }}</span>
                    <button class="adj-btn" @click="$emit('hire')">+</button>
                </div>
            </div>

            <!-- Price -->
            <div class="control-row">
                <div class="control-label">
                    <AppIcon icon="mdi:tag-outline" class="control-icon" />
                    <span>{{ $t('business.price') }}</span>
                    <span class="control-hint">(opt: ${{ business.optimalPrice.toFixed(0) }})</span>
                </div>
                <div class="control-actions">
                    <button class="adj-btn" @click="adjustPrice(-1)">−</button>
                    <span class="control-value">${{ business.pricePerUnit.toFixed(2) }}</span>
                    <button class="adj-btn" @click="adjustPrice(1)">+</button>
                </div>
            </div>

            <!-- Marketing -->
            <div class="control-row">
                <div class="control-label">
                    <AppIcon icon="mdi:bullhorn-outline" class="control-icon" />
                    <span>{{ $t('business.marketing') }}</span>
                    <span class="control-hint">(×{{ business.marketingFactor.toFixed(2) }})</span>
                </div>
                <div class="control-actions">
                    <button class="adj-btn" :disabled="business.marketingBudget <= 0"
                        @click="adjustMarketing(-10)">−</button>
                    <span class="control-value">${{ business.marketingBudget }}/t</span>
                    <button class="adj-btn" @click="adjustMarketing(10)">+</button>
                </div>
            </div>

            <!-- Quality -->
            <div class="control-row">
                <div class="control-label">
                    <AppIcon icon="mdi:star-outline" class="control-icon" />
                    <span>{{ $t('business.quality') }}</span>
                    <span class="control-hint">(×{{ business.qualityFactor.toFixed(2) }})</span>
                </div>
                <div class="control-actions">
                    <span class="control-value">★ {{ business.quality.toFixed(1) }}</span>
                    <span v-if="isQualityMaxed" class="quality-max-badge">
                        <AppIcon icon="mdi:check-decagram" /> {{ $t('common.max') }}
                    </span>
                    <Button v-else size="small" severity="secondary" outlined @click="$emit('upgrade-quality')">
                        {{ $t('business.upgrade_cost', { cost: formatCash(business.qualityUpgradeCost) }) }}
                    </Button>
                </div>
            </div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
            <div class="footer-left">
                <span class="valuation-label">
                    {{ $t('business.value_label', { value: formatCash(business.purchasePrice) }) }}
                </span>
                <button class="details-toggle" @click="showDetails = !showDetails">
                    <AppIcon :icon="showDetails ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
                    {{ showDetails ? $t('common.less') : $t('common.details') }}
                </button>
            </div>
            <Button size="small" severity="danger" text @click="$emit('sell')">
                <AppIcon icon="mdi:store-remove" />
                {{ $t('common.sell') }}
            </Button>
        </div>

        <!-- Expandable Details Panel -->
        <Transition name="slide">
            <div v-if="showDetails" class="details-panel">
                <div class="detail-section">
                    <h4 class="detail-title">{{ $t('business.demand_breakdown') }}</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.base_customers') }}</span>
                            <span class="d-value">{{ business.baseCustomers }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.price_factor') }}</span>
                            <span class="d-value" :class="priceStatus.cls">×{{
                                business.priceFactor.toFixed(2) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.quality_factor') }}</span>
                            <span class="d-value">×{{ business.qualityFactor.toFixed(2) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.marketing_factor') }}</span>
                            <span class="d-value">×{{ business.marketingFactor.toFixed(2) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.elasticity') }}</span>
                            <span class="d-value">{{ business.elasticity.toFixed(2) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.final_demand') }}</span>
                            <span class="d-value highlight">{{ business.currentCustomers }} {{ $t('business.customers')
                                }}</span>
                        </div>
                    </div>
                </div>
                <div class="detail-section">
                    <h4 class="detail-title">{{ $t('business.cost_structure') }}</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.wages') }}</span>
                            <span class="d-value">${{ (business.employees * business.baseSalary).toFixed(2) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.rent') }}</span>
                            <span class="d-value">${{ business.baseRent.toFixed(2) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.supplies') }}</span>
                            <span class="d-value">${{ (business.supplyCostPerUnit * business.unitsSold).toFixed(2)
                            }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.marketing') }}</span>
                            <span class="d-value">${{ business.marketingBudget.toFixed(2) }}</span>
                        </div>
                    </div>
                </div>
                <div class="detail-section">
                    <h4 class="detail-title">{{ $t('business.lifetime') }}</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.total_revenue') }}</span>
                            <span class="d-value success">{{ formatCash(business.totalRevenue) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.total_costs') }}</span>
                            <span class="d-value danger">{{ formatCash(business.totalCosts) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.total_profit') }}</span>
                            <span class="d-value" :class="business.totalProfit.gte(0) ? 'success' : 'danger'">{{
                                formatCash(business.totalProfit) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="d-label">{{ $t('business.owned_for') }}</span>
                            <span class="d-value">{{ Math.floor(business.ticksOwned / 10) }}s</span>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.business-card {
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

.business-card:hover {
    border-color: var(--t-border-hover);
}

/* Card Header */
.card-header {
    display: flex;
    gap: var(--t-space-3);
}

.biz-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.biz-icon {
    font-size: 1.25rem;
    color: var(--t-text-secondary);
}

.biz-info {
    flex: 1;
    min-width: 0;
}

.biz-name-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.biz-name {
    font-size: var(--t-font-size-base);
    font-weight: 600;
    color: var(--t-text);
    cursor: pointer;
}

.biz-name:hover {
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

.biz-category {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    padding: 0.1rem 0.35rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}



/* Quick Stats Bar */
.quick-stats {
    display: flex;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.stat-chip {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.5rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
}

.stat-chip-icon {
    font-size: 0.85rem;
    color: var(--t-text-muted);
}

.stat-chip-val {
    font-family: var(--t-font-mono);
    font-weight: 700;
    color: var(--t-text);
}

.stat-chip-label {
    color: var(--t-text-muted);
}

.stat-chip.high .stat-chip-val {
    color: var(--t-success);
}

.stat-chip.mid .stat-chip-val {
    color: var(--t-warning, #f59e0b);
}

.stat-chip.low .stat-chip-val {
    color: var(--t-danger, #e74c3c);
}

.stat-chip.success .stat-chip-val {
    color: var(--t-success);
}

.stat-chip.info .stat-chip-val {
    color: var(--t-info, #71717a);
}

.stat-chip.warn .stat-chip-val {
    color: var(--t-warning, #f59e0b);
}

.stat-chip.danger .stat-chip-val {
    color: var(--t-danger, #e74c3c);
}

/* P&L Summary Row */
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

/* Controls Grid */
.controls-grid {
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
    min-width: 3.5rem;
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

/* Card Footer */
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
    gap: var(--t-space-1);
}

.detail-title {
    font-size: var(--t-font-size-xs);
    font-weight: 700;
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0;
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

.d-value.info {
    color: var(--t-info, #71717a);
}

.d-value.warn {
    color: var(--t-warning, #f59e0b);
}

.d-value.highlight {
    font-weight: 700;
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

/* Manager / Collect Banner */
.manager-banner {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.pending-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-success-muted, rgba(34, 197, 94, 0.1));
    border: 1px solid rgba(34, 197, 94, 0.25);
    border-radius: var(--t-radius-md);
}

.pending-info {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.pending-icon {
    font-size: 1rem;
    color: var(--t-success);
}

.pending-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.pending-amount {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: 700;
    color: var(--t-success);
}

.collect-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.75rem;
    border: 1px solid var(--t-success);
    border-radius: var(--t-radius-md);
    background: transparent;
    color: var(--t-success);
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.collect-btn:hover {
    background: var(--t-success);
    color: #fff;
}

.manager-btn {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    width: 100%;
    padding: var(--t-space-2) var(--t-space-3);
    border: 1px dashed var(--t-border);
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.manager-btn:hover {
    border-color: var(--t-info, #71717a);
    border-style: solid;
    background: var(--t-info-muted, rgba(113, 113, 122, 0.08));
}

.manager-btn-icon {
    font-size: 1.3rem;
    color: var(--t-text-muted);
}

.manager-btn-text {
    display: flex;
    flex-direction: column;
    flex: 1;
    text-align: left;
}

.manager-btn-title {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text);
}

.manager-btn-price {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    color: var(--t-info, #71717a);
    font-weight: 600;
}

.manager-btn-hint {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    white-space: nowrap;
}

.manager-active {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.5rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.manager-active-icon {
    color: var(--t-success);
    font-size: 0.95rem;
}

.manager-active-label {
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
}

/* Quality MAX Badge */
.quality-max-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.5rem;
    font-size: var(--t-font-size-xs);
    font-weight: 700;
    color: var(--t-success);
    background: var(--t-success-muted, rgba(34, 197, 94, 0.12));
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: var(--t-radius-sm);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
</style>
