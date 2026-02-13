<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import BusinessUpgradePanel from './BusinessUpgradePanel.vue'
import BusinessStaffPanel from './BusinessStaffPanel.vue'
import BusinessPolicySlider from './BusinessPolicySlider.vue'
import BusinessAdvisorCard from './BusinessAdvisorCard.vue'
import BusinessBranchPanel from './BusinessBranchPanel.vue'
import BusinessSynergyBadge from './BusinessSynergyBadge.vue'
import BusinessMilestoneList from './BusinessMilestoneList.vue'
import { useFormat } from '@renderer/composables/useFormat'
import { useBusinessStore, type OwnedBusiness } from '@renderer/stores/useBusinessStore'
import { mul } from '@renderer/core/BigNum'
import { MEGA_CORP_REQUIREMENTS, getGeoTier } from '@renderer/data/businesses'

const props = defineProps<{
    business: OwnedBusiness
}>()

const store = useBusinessStore()
const { formatCash } = useFormat()

// ── Computed ──
const profitPerSecond = computed(() => mul(props.business.avgProfitPerTick, 10))
const revenuePerSecond = computed(() => mul(props.business.revenuePerTick, 10))
const costsPerSecond = computed(() => mul(props.business.costsPerTick, 10))
const isProfitable = computed(() => props.business.avgProfitPerTick.gte(0))
const hasPending = computed(() => props.business.pendingProfit.gt(0))
const isQualityMaxed = computed(() => props.business.quality >= 100)
const displayName = computed(() => props.business.customName || props.business.name)
const levelCost = computed(() => store.getLevelCost(props.business))
const geoTier = computed(() => getGeoTier(props.business.branches))
const canCorp = computed(() => store.canBecomeCorporation(props.business))
const catCount = computed(() => store.categoryCounts[props.business.category] || 1)

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
    store.renameBusiness(props.business.id, editName.value)
}
function cancelRename(): void { editing.value = false }

// ── Price factor label ──
const priceStatus = computed(() => {
    const pf = props.business.priceFactor
    if (pf >= 0.95 && pf <= 1.05) return { label: 'business.optimal', cls: 'success' }
    if (pf > 1.05) return { label: 'business.underpriced', cls: 'info' }
    if (pf < 0.95 && pf >= 0.6) return { label: 'business.overpriced', cls: 'warn' }
    return { label: 'business.too_expensive', cls: 'danger' }
})

// ── Utilization ──
const utilizationPct = computed(() => Math.round(props.business.utilization * 100))
const utilizationCls = computed(() => {
    const u = props.business.utilization
    if (u >= 0.9) return 'high'
    if (u >= 0.5) return 'mid'
    return 'low'
})

// ── Sub-panels ──
type SubPanel = 'none' | 'upgrades' | 'staff' | 'branches' | 'policies' | 'advisors' | 'milestones' | 'details'
const activePanel = ref<SubPanel>('none')
function togglePanel(panel: SubPanel) {
    activePanel.value = activePanel.value === panel ? 'none' : panel
}

// ── Operational helpers ──
function adjustPrice(delta: number): void {
    const newPrice = Math.max(0.01, props.business.pricePerUnit + delta)
    store.setPrice(props.business.id, Math.round(newPrice * 100) / 100)
}
function adjustMarketing(delta: number): void {
    const newBudget = Math.max(0, props.business.marketingBudget + delta)
    store.setMarketingBudget(props.business.id, newBudget)
}
</script>

<template>
    <div class="business-card"
        :class="{ profitable: isProfitable, loss: !isProfitable, 'is-corp': business.isCorporation }">
        <!-- Card Header -->
        <div class="card-header">
            <div class="biz-icon-wrap">
                <AppIcon :icon="business.icon || 'mdi:store'" class="biz-icon" />
            </div>
            <div class="biz-info">
                <div class="biz-name-row">
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
                    <BusinessSynergyBadge :category="business.category" :count="catCount" />
                </div>
                <!-- Badges row -->
                <div class="badges-row">
                    <span class="level-badge" :title="$t('business.level')">
                        <AppIcon icon="mdi:arrow-up-bold-circle" /> Lv.{{ business.level }}
                    </span>
                    <span v-if="business.branches > 0" class="branch-badge" :title="$t('business.branches_title')">
                        <AppIcon :icon="geoTier.icon" /> {{ business.branches }}
                    </span>
                    <span v-if="business.isCorporation" class="corp-badge">
                        <AppIcon icon="mdi:domain" /> {{ $t('business.corporation') }}
                    </span>
                    <span class="rep-badge" :title="$t('business.reputation')">
                        <AppIcon icon="mdi:star" /> {{ business.reputation.toFixed(0) }}
                    </span>
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
                <button class="collect-btn" @click="store.collectProfit(business.id)">
                    <AppIcon icon="mdi:hand-coin" />
                    {{ $t('common.collect') }}
                </button>
            </div>
            <button class="manager-btn" @click="store.hireManager(business.id)">
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

        <!-- Action buttons for NEW systems -->
        <div class="action-bar">
            <!-- Level Up -->
            <button class="action-btn accent" @click="store.levelUp(business.id)" :title="$t('business.level_up')">
                <AppIcon icon="mdi:arrow-up-bold" />
                <span>{{ $t('business.level_up') }}</span>
                <span class="action-cost">{{ formatCash(levelCost) }}</span>
            </button>
            <!-- Become Corporation -->
            <button v-if="canCorp" class="action-btn gold" @click="store.becomeCorporation(business.id)">
                <AppIcon icon="mdi:domain" />
                {{ $t('business.become_corp') }}
            </button>
        </div>

        <!-- Expandable sub-panels -->
        <div class="panel-tabs">
            <button class="tab-btn" :class="{ active: activePanel === 'upgrades' }" @click="togglePanel('upgrades')">
                <AppIcon icon="mdi:arrow-up-bold-box" /> {{ $t('business.upgrades') }}
            </button>
            <button class="tab-btn" :class="{ active: activePanel === 'staff' }" @click="togglePanel('staff')">
                <AppIcon icon="mdi:account-group" /> {{ $t('business.staff') }}
            </button>
            <button class="tab-btn" :class="{ active: activePanel === 'branches' }" @click="togglePanel('branches')">
                <AppIcon icon="mdi:source-branch" /> {{ $t('business.branches') }}
            </button>
            <button class="tab-btn" :class="{ active: activePanel === 'policies' }" @click="togglePanel('policies')">
                <AppIcon icon="mdi:tune-vertical" /> {{ $t('business.policies') }}
            </button>
            <button class="tab-btn" :class="{ active: activePanel === 'advisors' }" @click="togglePanel('advisors')">
                <AppIcon icon="mdi:account-tie" /> {{ $t('business.advisors') }}
            </button>
            <button class="tab-btn" :class="{ active: activePanel === 'milestones' }"
                @click="togglePanel('milestones')">
                <AppIcon icon="mdi:trophy" /> {{ $t('business.milestones') }}
            </button>
            <button class="tab-btn" :class="{ active: activePanel === 'details' }" @click="togglePanel('details')">
                <AppIcon icon="mdi:information" /> {{ $t('common.details') }}
            </button>
        </div>

        <Transition name="slide">
            <div v-if="activePanel !== 'none'" class="sub-panel">
                <!-- Upgrades -->
                <BusinessUpgradePanel v-if="activePanel === 'upgrades'" :business="business" />

                <!-- Staff -->
                <BusinessStaffPanel v-if="activePanel === 'staff'" :business="business" />

                <!-- Branches -->
                <BusinessBranchPanel v-if="activePanel === 'branches'" :business="business" />

                <!-- Policies -->
                <BusinessPolicySlider v-if="activePanel === 'policies'" :business="business" />

                <!-- Advisors -->
                <BusinessAdvisorCard v-if="activePanel === 'advisors'" :business="business" />

                <!-- Milestones -->
                <BusinessMilestoneList v-if="activePanel === 'milestones'" :business="business" />

                <!-- Legacy Details -->
                <div v-if="activePanel === 'details'" class="details-panel">
                    <!-- Operational Controls -->
                    <div class="controls-section">
                        <h4 class="section-title">{{ $t('business.operations') }}</h4>
                        <div class="controls-grid">
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
                                    <Button v-else size="small" severity="secondary"
                                        @click="store.upgradeQuality(business.id)">
                                        {{ formatCash(business.qualityUpgradeCost) }}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Cost structure + lifetime stats -->
                    <div class="detail-section">
                        <h4 class="section-title">{{ $t('business.cost_structure') }}</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="d-label">{{ $t('business.wages') }}</span>
                                <span class="d-value">${{ (business.employees * business.baseSalary).toFixed(2)
                                }}</span>
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
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4 class="section-title">{{ $t('business.lifetime') }}</h4>
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
                                <span class="d-value" :class="business.totalProfit.gte(0) ? 'success' : 'danger'">
                                    {{ formatCash(business.totalProfit) }}
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="d-label">{{ $t('business.owned_for') }}</span>
                                <span class="d-value">{{ Math.floor(business.ticksOwned / 10) }}s</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Card Footer -->
        <div class="card-footer">
            <div class="footer-left">
                <span class="valuation-label">
                    {{ $t('business.value_label', { value: formatCash(business.purchasePrice) }) }}
                </span>
            </div>
            <Button size="small" severity="danger" text @click="store.sellBusiness(business.id)">
                <AppIcon icon="mdi:store-remove" />
                {{ $t('common.sell') }}
            </Button>
        </div>
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

.business-card.is-corp {
    border-color: goldenrod;
    box-shadow: 0 0 12px rgba(218, 165, 32, 0.15);
}

/* Header */
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
    flex-wrap: wrap;
}

.biz-name {
    font-size: var(--t-font-size-base);
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: text;
}

.rename-btn {
    background: none;
    border: none;
    color: var(--t-text-muted);
    cursor: pointer;
    padding: 2px;
    font-size: 0.8rem;
}

.rename-input {
    font-size: var(--t-font-size-sm);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-accent);
    border-radius: var(--t-radius-sm);
    padding: 0.15rem 0.4rem;
    color: var(--t-text);
    outline: none;
    min-width: 0;
    width: 140px;
}

.biz-category {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
    padding: 0.1rem 0.4rem;
    border-radius: var(--t-radius-sm);
}

/* Badges row */
.badges-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.3rem;
}

.level-badge,
.branch-badge,
.corp-badge,
.rep-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    padding: 0.1rem 0.4rem;
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    color: var(--t-text-secondary);
}

.corp-badge {
    background: rgba(218, 165, 32, 0.15);
    color: goldenrod;
}

.rep-badge {
    color: var(--t-accent);
}

/* Quick stats */
.quick-stats {
    display: flex;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.stat-chip {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.5rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
}

.stat-chip-icon {
    font-size: 0.85rem;
    color: var(--t-text-muted);
}

.stat-chip-val {
    font-weight: 700;
    font-family: var(--t-font-mono);
    color: var(--t-text);
}

.stat-chip-label {
    color: var(--t-text-muted);
}

.stat-chip.success .stat-chip-val {
    color: var(--t-success);
}

.stat-chip.warn .stat-chip-val {
    color: var(--t-warning);
}

.stat-chip.danger .stat-chip-val {
    color: var(--t-error);
}

.stat-chip.info .stat-chip-val {
    color: var(--t-info);
}

.stat-chip.high .stat-chip-val {
    color: var(--t-success);
}

.stat-chip.mid .stat-chip-val {
    color: var(--t-warning);
}

.stat-chip.low .stat-chip-val {
    color: var(--t-error);
}

/* P&L */
.pl-row {
    display: flex;
    gap: var(--t-space-3);
    flex-wrap: wrap;
}

.pl-item {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.pl-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.pl-value {
    font-size: var(--t-font-size-sm);
    font-weight: 700;
    font-family: var(--t-font-mono);
}

.pl-value.success {
    color: var(--t-success);
}

.pl-value.danger {
    color: var(--t-error);
}

/* Manager banner */
.manager-banner {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px dashed var(--t-border);
}

.pending-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.pending-info {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.pending-icon {
    color: var(--t-warning);
}

.pending-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.pending-amount {
    font-weight: 700;
    font-family: var(--t-font-mono);
    color: var(--t-success);
    font-size: var(--t-font-size-sm);
}

.collect-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    background: var(--t-success);
    color: var(--t-bg);
    border: none;
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    cursor: pointer;
}

.manager-btn {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2);
    background: transparent;
    border: 1px solid var(--t-accent);
    border-radius: var(--t-radius-sm);
    cursor: pointer;
    color: var(--t-text);
    transition: background 0.15s;
}

.manager-btn:hover {
    background: var(--t-accent);
    color: var(--t-bg);
}

.manager-btn-icon {
    font-size: 1.2rem;
    color: var(--t-accent);
}

.manager-btn-text {
    display: flex;
    flex-direction: column;
    text-align: left;
}

.manager-btn-title {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
}

.manager-btn-price {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
}

.manager-btn-hint {
    margin-left: auto;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.manager-active {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-success);
    font-weight: 600;
}

.manager-active-icon {
    font-size: 1rem;
}

/* Action bar */
.action-bar {
    display: flex;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem 0.8rem;
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--t-accent);
    background: transparent;
    color: var(--t-accent);
    transition: all 0.15s;
}

.action-btn:hover {
    background: var(--t-accent);
    color: var(--t-bg);
}

.action-btn.gold {
    border-color: goldenrod;
    color: goldenrod;
}

.action-btn.gold:hover {
    background: goldenrod;
    color: #1a1a1a;
}

.action-cost {
    font-family: var(--t-font-mono);
    opacity: 0.8;
}

/* Panel tabs */
.panel-tabs {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
    border-top: 1px solid var(--t-border);
    padding-top: var(--t-space-2);
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid transparent;
    border-radius: var(--t-radius-sm);
    background: transparent;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-xs);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
}

.tab-btn:hover {
    color: var(--t-text);
    background: var(--t-bg-muted);
}

.tab-btn.active {
    color: var(--t-accent);
    border-color: var(--t-accent);
    background: var(--t-accent-alpha, rgba(99, 102, 241, 0.08));
}

/* Sub panel */
.sub-panel {
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

/* Details panel */
.details-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

.controls-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.section-title {
    font-size: var(--t-font-size-xs);
    font-weight: 700;
    color: var(--t-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
}

.controls-grid {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.control-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.control-icon {
    font-size: 0.9rem;
}

.control-hint {
    font-family: var(--t-font-mono);
    opacity: 0.7;
}

.control-actions {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.control-value {
    font-family: var(--t-font-mono);
    font-weight: 600;
    font-size: var(--t-font-size-xs);
    min-width: 3.5rem;
    text-align: center;
    color: var(--t-text);
}

.adj-btn {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    background: var(--t-bg);
    color: var(--t-text);
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 700;
    transition: all 0.15s;
}

.adj-btn:hover {
    border-color: var(--t-accent);
    color: var(--t-accent);
}

.adj-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.quality-max-badge {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-success);
    font-weight: 600;
}

.detail-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.4rem;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-xs);
}

.d-label {
    color: var(--t-text-muted);
}

.d-value {
    font-weight: 600;
    font-family: var(--t-font-mono);
    color: var(--t-text);
}

.d-value.success {
    color: var(--t-success);
}

.d-value.danger {
    color: var(--t-error);
}

.d-value.highlight {
    color: var(--t-accent);
}

/* Footer */
.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--t-border);
    padding-top: var(--t-space-2);
}

.footer-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.valuation-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>
