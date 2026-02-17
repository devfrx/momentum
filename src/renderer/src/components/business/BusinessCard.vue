<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import BusinessUpgradePanel from './BusinessUpgradePanel.vue'
import BusinessStaffPanel from './BusinessStaffPanel.vue'
import BusinessPolicySlider from './BusinessPolicySlider.vue'
import BusinessAdvisorCard from './BusinessAdvisorCard.vue'
import BusinessBranchPanel from './BusinessBranchPanel.vue'
import BusinessSynergyBadge from './BusinessSynergyBadge.vue'
import BusinessMilestoneList from './BusinessMilestoneList.vue'
import { UTooltip, UAccordion, UButton } from '@renderer/components/ui'
import { useFormat } from '@renderer/composables/useFormat'
import { useBusinessStore, type OwnedBusiness } from '@renderer/stores/useBusinessStore'
import { mul } from '@renderer/core/BigNum'
import { getGeoTier } from '@renderer/data/businesses'

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
                        <UButton variant="text" icon="mdi:pencil-outline" @click="startRename"
                            :title="$t('common.rename')" />
                    </template>
                    <span class="biz-category">{{ business.category }}</span>
                    <BusinessSynergyBadge :category="business.category" :count="catCount" />
                </div>
                <!-- Badges row -->
                <div class="badges-row">
                    <UTooltip :text="$t('business.level')" placement="bottom">
                        <span class="level-badge">
                            <AppIcon icon="mdi:arrow-up-bold-circle" /> Lv.{{ business.level }}
                        </span>
                    </UTooltip>
                    <UTooltip v-if="business.branches > 0" :text="$t('business.branches_title')" placement="bottom">
                        <span class="branch-badge">
                            <AppIcon :icon="geoTier.icon" /> {{ business.branches }}
                        </span>
                    </UTooltip>
                    <span v-if="business.isCorporation" class="corp-badge">
                        <AppIcon icon="mdi:domain" /> {{ $t('business.corporation') }}
                    </span>
                    <UTooltip :text="$t('business.reputation')" placement="bottom">
                        <span class="rep-badge">
                            <AppIcon icon="mdi:star" /> {{ business.reputation.toFixed(0) }}
                        </span>
                    </UTooltip>
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
            <UTooltip :text="`${$t('business.capacity')}: ${business.unitsSold} / ${business.maxCapacity}`"
                placement="bottom">
                <div class="stat-chip" :class="utilizationCls">
                    <AppIcon icon="mdi:gauge" class="stat-chip-icon" />
                    <span class="stat-chip-val">{{ utilizationPct }}%</span>
                    <span class="stat-chip-label">{{ $t('business.capacity') }}</span>
                </div>
            </UTooltip>
            <UTooltip
                :text="`${$t('business.price')}: $${business.pricePerUnit.toFixed(2)} (opt: $${business.optimalPrice.toFixed(0)})`"
                placement="bottom">
                <div class="stat-chip" :class="priceStatus.cls">
                    <AppIcon icon="mdi:currency-usd" class="stat-chip-icon" />
                    <span class="stat-chip-val">{{ $t(priceStatus.label) }}</span>
                </div>
            </UTooltip>
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
                <UButton variant="success" icon="mdi:hand-coin" @click="store.collectProfit(business.id)">
                    {{ $t('common.collect') }}
                </UButton>
            </div>
            <UButton variant="primary" icon="mdi:account-tie" @click="store.hireManager(business.id)">
                <div class="manager-btn-text">
                    <span class="manager-btn-title">{{ $t('business.hire_manager') }}</span>
                    <span class="manager-btn-price">{{ formatCash(business.managerCost) }}</span>
                </div>
                <span class="manager-btn-hint">{{ $t('business.auto_collects') }}</span>
            </UButton>
        </div>
        <div v-else class="manager-active">
            <AppIcon icon="mdi:account-tie-hat" class="manager-active-icon" />
            <span class="manager-active-label">{{ $t('business.manager_active') }}</span>
        </div>

        <!-- Action buttons for NEW systems -->
        <div class="action-bar">
            <!-- Level Up -->
            <UButton variant="primary" icon="mdi:arrow-up-bold" @click="store.levelUp(business.id)"
                :title="$t('business.level_up')">
                <span>{{ $t('business.level_up') }}</span>
                <span class="action-cost">{{ formatCash(levelCost) }}</span>
            </UButton>
            <!-- Become Corporation -->
            <UButton v-if="canCorp" variant="warning" icon="mdi:domain" @click="store.becomeCorporation(business.id)">
                {{ $t('business.become_corp') }}
            </UButton>
        </div>

        <!-- Expandable sub-panels -->
        <div class="panel-tabs">
            <UButton variant="tab" :active="activePanel === 'upgrades'" icon="mdi:arrow-up-bold-box"
                @click="togglePanel('upgrades')">
                {{ $t('business.upgrades') }}
            </UButton>
            <UButton variant="tab" :active="activePanel === 'staff'" icon="mdi:account-group"
                @click="togglePanel('staff')">
                {{ $t('business.staff') }}
            </UButton>
            <UButton variant="tab" :active="activePanel === 'branches'" icon="mdi:source-branch"
                @click="togglePanel('branches')">
                {{ $t('business.branches') }}
            </UButton>
            <UButton variant="tab" :active="activePanel === 'policies'" icon="mdi:tune-vertical"
                @click="togglePanel('policies')">
                {{ $t('business.policies') }}
            </UButton>
            <UButton variant="tab" :active="activePanel === 'advisors'" icon="mdi:account-tie"
                @click="togglePanel('advisors')">
                {{ $t('business.advisors') }}
            </UButton>
            <UButton variant="tab" :active="activePanel === 'milestones'" icon="mdi:trophy"
                @click="togglePanel('milestones')">
                {{ $t('business.milestones') }}
            </UButton>
            <UButton variant="tab" :active="activePanel === 'details'" icon="mdi:information"
                @click="togglePanel('details')">
                {{ $t('common.details') }}
            </UButton>
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
                                    <UButton variant="ghost" size="xs" @click="adjustPrice(-1)">−</UButton>
                                    <span class="control-value">${{ business.pricePerUnit.toFixed(2) }}</span>
                                    <UButton variant="ghost" size="xs" @click="adjustPrice(1)">+</UButton>
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
                                    <UButton variant="ghost" size="xs" :disabled="business.marketingBudget <= 0"
                                        @click="adjustMarketing(-10)">−</UButton>
                                    <span class="control-value">${{ business.marketingBudget }}/t</span>
                                    <UButton variant="ghost" size="xs" @click="adjustMarketing(10)">+</UButton>
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
                                    <UButton v-else variant="ghost" size="sm"
                                        @click="store.upgradeQuality(business.id)">
                                        {{ formatCash(business.qualityUpgradeCost) }}
                                    </UButton>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Cost structure + lifetime stats -->
                    <UAccordion :title="$t('business.cost_structure')" icon="mdi:chart-pie" variant="ghost" compact>
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
                    </UAccordion>
                    <UAccordion :title="$t('business.lifetime')" icon="mdi:history" variant="ghost" compact>
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
                    </UAccordion>
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
            <UButton variant="text" size="sm" icon="mdi:store-remove" @click="store.sellBusiness(business.id)">
                {{ $t('common.sell') }}
            </UButton>
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
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.business-card:hover {
    border-color: var(--t-border-hover);
}

.business-card.is-corp {
    border-color: var(--t-gold);
    box-shadow: 0 0 12px var(--t-gold-muted);
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
    font-size: 1.15rem;
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
    font-weight: var(--t-font-semibold);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: text;
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
    font-weight: var(--t-font-semibold);
    padding: 0.1rem 0.4rem;
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    color: var(--t-text-secondary);
}

.corp-badge {
    background: var(--t-gold-muted);
    color: var(--t-gold);
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
    font-weight: var(--t-font-bold);
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
    font-weight: var(--t-font-bold);
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
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
    color: var(--t-success);
    font-size: var(--t-font-size-sm);
}

.manager-btn-icon {
    font-size: 1.1rem;
    color: var(--t-accent);
}

.manager-btn-text {
    display: flex;
    flex-direction: column;
    text-align: left;
}

.manager-btn-title {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
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
    font-weight: var(--t-font-semibold);
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

.action-cost {
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
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
    font-weight: var(--t-font-medium);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.tab-btn:hover {
    color: var(--t-text);
    background: var(--t-bg-muted);
}

.tab-btn:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}

.tab-btn.active {
    color: var(--t-text);
    background: var(--t-bg-muted);
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
    font-weight: var(--t-font-bold);
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
}

.control-actions {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.control-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-xs);
    min-width: 3.5rem;
    text-align: center;
    color: var(--t-text);
}

.quality-max-badge {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-success);
    font-weight: var(--t-font-semibold);
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
    font-weight: var(--t-font-semibold);
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
    transition: all var(--t-transition-fast) ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>
