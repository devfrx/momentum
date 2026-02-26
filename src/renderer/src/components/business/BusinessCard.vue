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
import BuyAmountSelector from './BuyAmountSelector.vue'
import CardBoundBadge from '@renderer/components/ui/CardBoundBadge.vue'
import { UTooltip, UAccordion, UButton, UCard } from '@renderer/components/ui'
import { useFormat } from '@renderer/composables/useFormat'
import { useBusinessStore, type OwnedBusiness } from '@renderer/stores/useBusinessStore'
import { mul } from '@renderer/core/BigNum'
import { getGeoTier } from '@renderer/data/businesses'
import { economySim } from '@renderer/core/EconomySim'

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
const bulkLevelCost = computed(() => store.getBulkLevelCost(props.business, buyAmount.value))
const levelCostFn = (amount: number) => store.getBulkLevelCost(props.business, amount)
const geoTier = computed(() => getGeoTier(props.business.branches))
const canCorp = computed(() => store.canBecomeCorporation(props.business))
const catCount = computed(() => store.categoryCounts[props.business.category] || 1)
const managerCost = computed(() => store.getManagerCost(props.business))
const sellValuation = computed(() => store.getBusinessValuation(props.business))

// ── Card collapsed state ──
const isCollapsed = ref(false)

// ── Bulk buy ──
const buyAmount = ref(1)

// ── Sell confirmation ──
const showSellConfirm = ref(false)
function confirmSell(): void {
    store.sellBusiness(props.business.id)
    showSellConfirm.value = false
}

// ── Effective cost display (accounts for multipliers) ──
const effectiveWages = computed(() => {
    const ecoState = economySim.getState()
    return props.business.employees * props.business.baseSalary * ecoState.wageIndex
})
const effectiveRent = computed(() => {
    const ecoState = economySim.getState()
    return props.business.baseRent * (1 + props.business.branches * 0.3) * ecoState.inflationIndex
})
const effectiveSupplies = computed(() => {
    return props.business.supplyCostPerUnit * props.business.unitsSold
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
const PRICE_STEPS = [1, 10, 100, 1000] as const
const MARKETING_STEPS = [10, 100, 1000, 10000] as const
const priceStep = ref<typeof PRICE_STEPS[number]>(1)
const marketingStep = ref<typeof MARKETING_STEPS[number]>(10)

function adjustPrice(direction: 1 | -1): void {
    const newPrice = Math.max(0.01, props.business.pricePerUnit + direction * priceStep.value)
    store.setPrice(props.business.id, Math.round(newPrice * 100) / 100)
}
function resetPriceToOptimal(): void {
    store.setPrice(props.business.id, props.business.optimalPrice)
}
function adjustMarketing(direction: 1 | -1): void {
    const newBudget = Math.max(0, props.business.marketingBudget + direction * marketingStep.value)
    store.setMarketingBudget(props.business.id, newBudget)
}
</script>

<template>
    <UCard class="business-card" size="lg"
        :class="{ profitable: isProfitable, loss: !isProfitable, 'is-corp': business.isCorporation, 'is-collapsed': isCollapsed }">

        <!-- Profit/Loss accent strip -->
        <div class="card-accent" :class="isProfitable ? 'accent-profit' : 'accent-loss'" />

        <!-- Card Header — always visible -->
        <div class="card-header" @click="isCollapsed = !isCollapsed">
            <div class="biz-icon-wrap" :class="{ 'icon-corp': business.isCorporation }">
                <AppIcon :icon="business.icon || 'mdi:store'" class="biz-icon" />
            </div>
            <div class="biz-info">
                <div class="biz-name-row">
                    <template v-if="editing">
                        <input ref="nameInput" v-model="editName" class="rename-input" maxlength="30"
                            @keyup.enter="confirmRename" @keyup.escape="cancelRename" @blur="confirmRename"
                            @click.stop />
                    </template>
                    <template v-else>
                        <h3 class="biz-name" @dblclick.stop="startRename" :title="$t('common.double_click_rename')">
                            {{ displayName }}
                        </h3>
                    </template>
                    <span class="biz-category">{{ business.category }}</span>
                    <BusinessSynergyBadge :category="business.category" :count="catCount" />
                    <CardBoundBadge :entityKey="`business:${business.id}`" />
                </div>
                <!-- Inline badges -->
                <div class="badges-row">
                    <span class="level-badge">
                        <AppIcon icon="mdi:arrow-up-bold-circle" /> Lv.{{ business.level }}
                    </span>
                    <span v-if="business.branches > 0" class="branch-badge">
                        <AppIcon :icon="geoTier.icon" /> {{ business.branches }}
                    </span>
                    <span v-if="business.isCorporation" class="corp-badge">
                        <AppIcon icon="mdi:domain" /> {{ $t('business.corporation') }}
                    </span>
                    <span class="rep-badge">
                        <AppIcon icon="mdi:star" /> {{ business.reputation.toFixed(0) }}
                    </span>
                </div>
            </div>
            <!-- Compact profit display always visible in header -->
            <div class="header-profit" :class="isProfitable ? 'success' : 'danger'">
                <span class="header-profit-val">{{ formatCash(profitPerSecond) }}</span>
                <span class="header-profit-unit">/s</span>
            </div>
            <button class="collapse-toggle" @click.stop="isCollapsed = !isCollapsed"
                :title="isCollapsed ? $t('common.expand') : $t('common.collapse')">
                <AppIcon :icon="isCollapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'" />
            </button>
        </div>

        <!-- Collapsible body -->
        <Transition name="card-body">
            <div v-show="!isCollapsed" class="card-body">

                <!-- Utilization bar -->
                <div class="utilization-bar-wrap">
                    <div class="utilization-bar-header">
                        <span class="utilization-bar-label">
                            <AppIcon icon="mdi:gauge" class="utilization-icon" />
                            {{ $t('business.capacity') }}
                        </span>
                        <span class="utilization-bar-pct" :class="utilizationCls">{{ utilizationPct }}%</span>
                    </div>
                    <div class="utilization-track">
                        <div class="utilization-fill" :class="utilizationCls"
                            :style="{ width: utilizationPct + '%' }" />
                    </div>
                    <div class="utilization-details">
                        <span>{{ business.unitsSold }}/{{ business.maxCapacity }} {{ $t('business.sold') }}</span>
                        <UTooltip
                            :text="`${$t('business.price')}: $${business.pricePerUnit.toFixed(2)} (opt: $${business.optimalPrice.toFixed(0)})`"
                            placement="bottom">
                            <span class="price-status-chip" :class="priceStatus.cls">
                                <AppIcon icon="mdi:currency-usd" />
                                {{ $t(priceStatus.label) }}
                            </span>
                        </UTooltip>
                    </div>
                </div>

                <!-- Quick Stats Row -->
                <div class="quick-stats">
                    <div class="stat-chip">
                        <AppIcon icon="mdi:account-multiple" class="stat-chip-icon" />
                        <span class="stat-chip-val">{{ business.currentCustomers }}</span>
                        <span class="stat-chip-label">{{ $t('business.demand') }}</span>
                    </div>
                </div>

                <!-- P&L Summary — improved visual hierarchy -->
                <div class="pl-summary">
                    <div class="pl-side">
                        <span class="pl-label">{{ $t('business.revenue_s') }}</span>
                        <span class="pl-value success">{{ formatCash(revenuePerSecond) }}</span>
                    </div>
                    <div class="pl-divider">−</div>
                    <div class="pl-side">
                        <span class="pl-label">{{ $t('business.costs_s') }}</span>
                        <span class="pl-value danger">{{ formatCash(costsPerSecond) }}</span>
                    </div>
                    <div class="pl-divider">=</div>
                    <div class="pl-side pl-profit">
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
                            <span class="manager-btn-price">{{ formatCash(managerCost) }}</span>
                        </div>
                        <span class="manager-btn-hint">{{ $t('business.auto_collects') }}</span>
                    </UButton>
                </div>
                <div v-else class="manager-active">
                    <AppIcon icon="mdi:account-tie-hat" class="manager-active-icon" />
                    <span class="manager-active-label">{{ $t('business.manager_active') }}</span>
                </div>

                <!-- Action bar — Level Up + Corp -->
                <div class="action-bar">
                    <BuyAmountSelector v-model="buyAmount" :options="[1, 10, 100]" :cost-fn="levelCostFn" />
                    <UButton variant="success" icon="mdi:arrow-up-bold"
                        @click="buyAmount === 1 ? store.levelUp(business.id) : store.levelUpBulk(business.id, buyAmount)"
                        class="level-up-btn" :title="$t('business.level_up')">
                        <span>{{ $t('business.level_up') }} ×{{ buyAmount }}</span>
                        <span class="action-cost"> - {{ formatCash(bulkLevelCost) }}</span>
                    </UButton>
                    <UButton v-if="canCorp" variant="warning" icon="mdi:domain"
                        @click="store.becomeCorporation(business.id)" class="level-up-btn">
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
                        <BusinessUpgradePanel v-if="activePanel === 'upgrades'" :business="business" />
                        <BusinessStaffPanel v-if="activePanel === 'staff'" :business="business" />
                        <BusinessBranchPanel v-if="activePanel === 'branches'" :business="business" />
                        <BusinessPolicySlider v-if="activePanel === 'policies'" :business="business" />
                        <BusinessAdvisorCard v-if="activePanel === 'advisors'" :business="business" />
                        <BusinessMilestoneList v-if="activePanel === 'milestones'" :business="business" />

                        <!-- Details panel -->
                        <div v-if="activePanel === 'details'" class="details-panel">
                            <!-- Operations controls -->
                            <div class="ops-section">
                                <!-- Price control -->
                                <div class="op-card">
                                    <div class="op-card-header">
                                        <div class="op-icon-wrap price">
                                            <AppIcon icon="mdi:tag-outline" class="op-icon" />
                                        </div>
                                        <div class="op-info">
                                            <span class="op-title">{{ $t('business.price') }}</span>
                                            <span class="op-hint">opt: ${{ business.optimalPrice.toFixed(0) }}</span>
                                        </div>
                                        <span class="op-current-value">${{ business.pricePerUnit.toFixed(2) }}</span>
                                    </div>
                                    <div class="op-controls">
                                        <div class="step-pills">
                                            <button v-for="s in PRICE_STEPS" :key="s" class="step-pill"
                                                :class="{ active: priceStep === s }" @click="priceStep = s">
                                                {{ s >= 1000 ? s / 1000 + 'k' : s }}
                                            </button>
                                        </div>
                                        <div class="op-btn-group">
                                            <UButton variant="secondary" size="xs" @click="adjustPrice(-1)">−</UButton>
                                            <UButton variant="primary" size="xs" @click="adjustPrice(1)">+</UButton>
                                            <UButton variant="ghost" size="xs" icon="mdi:target"
                                                :title="$t('business.reset_optimal')" @click="resetPriceToOptimal" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Marketing control -->
                                <div class="op-card">
                                    <div class="op-card-header">
                                        <div class="op-icon-wrap marketing">
                                            <AppIcon icon="mdi:bullhorn-outline" class="op-icon" />
                                        </div>
                                        <div class="op-info">
                                            <span class="op-title">{{ $t('business.marketing') }}</span>
                                            <span class="op-hint">×{{ business.marketingFactor.toFixed(2) }}</span>
                                        </div>
                                        <span class="op-current-value">${{ business.marketingBudget }}/t</span>
                                    </div>
                                    <div class="op-controls">
                                        <div class="step-pills">
                                            <button v-for="s in MARKETING_STEPS" :key="s" class="step-pill"
                                                :class="{ active: marketingStep === s }" @click="marketingStep = s">
                                                {{ s >= 1000 ? s / 1000 + 'k' : s }}
                                            </button>
                                        </div>
                                        <div class="op-btn-group">
                                            <UButton variant="secondary" size="xs"
                                                :disabled="business.marketingBudget <= 0" @click="adjustMarketing(-1)">−
                                            </UButton>
                                            <UButton variant="primary" size="xs" @click="adjustMarketing(1)">+</UButton>
                                        </div>
                                    </div>
                                </div>

                                <!-- Quality control -->
                                <div class="op-card">
                                    <div class="op-card-header">
                                        <div class="op-icon-wrap quality">
                                            <AppIcon icon="mdi:star-outline" class="op-icon" />
                                        </div>
                                        <div class="op-info">
                                            <span class="op-title">{{ $t('business.quality') }}</span>
                                            <span class="op-hint">×{{ business.qualityFactor.toFixed(2) }}</span>
                                        </div>
                                        <div class="op-quality-display">
                                            <span class="op-quality-stars">★ {{ business.quality }}</span>
                                            <span v-if="isQualityMaxed" class="quality-max-chip">
                                                <AppIcon icon="mdi:check-decagram" /> MAX
                                            </span>
                                        </div>
                                    </div>
                                    <div v-if="!isQualityMaxed" class="op-controls">
                                        <div class="quality-bar-track">
                                            <div class="quality-bar-fill" :style="{ width: business.quality + '%' }" />
                                        </div>
                                        <UButton variant="success" size="sm" icon="mdi:arrow-up-bold"
                                            class="quality-upgrade-btn" @click="store.upgradeQuality(business.id)">
                                            {{ formatCash(business.qualityUpgradeCost) }}
                                        </UButton>
                                    </div>
                                </div>
                            </div>

                            <!-- Cost breakdown -->
                            <UAccordion :title="$t('business.cost_structure')" icon="mdi:chart-pie" variant="ghost"
                                compact>
                                <div class="cost-bars">
                                    <div class="cost-bar-item">
                                        <div class="cost-bar-label">
                                            <AppIcon icon="mdi:account-cash" class="cost-bar-icon" />
                                            <span>{{ $t('business.wages') }}</span>
                                        </div>
                                        <span class="cost-bar-val">${{ effectiveWages.toFixed(2) }}</span>
                                    </div>
                                    <div class="cost-bar-item">
                                        <div class="cost-bar-label">
                                            <AppIcon icon="mdi:home-city" class="cost-bar-icon" />
                                            <span>{{ $t('business.rent') }}</span>
                                        </div>
                                        <span class="cost-bar-val">${{ effectiveRent.toFixed(2) }}</span>
                                    </div>
                                    <div class="cost-bar-item">
                                        <div class="cost-bar-label">
                                            <AppIcon icon="mdi:package-variant-closed" class="cost-bar-icon" />
                                            <span>{{ $t('business.supplies') }}</span>
                                        </div>
                                        <span class="cost-bar-val">${{ effectiveSupplies.toFixed(2) }}</span>
                                    </div>
                                    <div class="cost-bar-item">
                                        <div class="cost-bar-label">
                                            <AppIcon icon="mdi:bullhorn" class="cost-bar-icon" />
                                            <span>{{ $t('business.marketing') }}</span>
                                        </div>
                                        <span class="cost-bar-val">${{ business.marketingBudget.toFixed(2) }}</span>
                                    </div>
                                </div>
                            </UAccordion>

                            <!-- Lifetime stats -->
                            <UAccordion :title="$t('business.lifetime')" icon="mdi:history" variant="ghost" compact>
                                <div class="lifetime-grid">
                                    <div class="lifetime-stat">
                                        <span class="lifetime-val success">{{ formatCash(business.totalRevenue)
                                            }}</span>
                                        <span class="lifetime-lbl">{{ $t('business.total_revenue') }}</span>
                                    </div>
                                    <div class="lifetime-stat">
                                        <span class="lifetime-val danger">{{ formatCash(business.totalCosts) }}</span>
                                        <span class="lifetime-lbl">{{ $t('business.total_costs') }}</span>
                                    </div>
                                    <div class="lifetime-stat highlight">
                                        <span class="lifetime-val"
                                            :class="business.totalProfit.gte(0) ? 'success' : 'danger'">
                                            {{ formatCash(business.totalProfit) }}
                                        </span>
                                        <span class="lifetime-lbl">{{ $t('business.total_profit') }}</span>
                                    </div>
                                    <div class="lifetime-stat">
                                        <span class="lifetime-val">{{ Math.floor(business.ticksOwned / 10) }}s</span>
                                        <span class="lifetime-lbl">{{ $t('business.owned_for') }}</span>
                                    </div>
                                </div>
                            </UAccordion>
                        </div>
                    </div>
                </Transition>

                <!-- Card Footer -->
                <div class="card-footer">
                    <div class="footer-left">
                        <UButton variant="text" size="sm" icon="mdi:pencil-outline" @click="startRename"
                            :title="$t('common.rename')" />
                        <span class="valuation-label">
                            {{ $t('business.value_label', { value: formatCash(sellValuation) }) }}
                        </span>
                    </div>
                    <UButton variant="text" size="sm" icon="mdi:store-remove" @click="showSellConfirm = true">
                        {{ $t('common.sell') }}
                    </UButton>
                </div>
            </div>
        </Transition>

        <!-- Sell confirmation dialog -->
        <Teleport to="body">
            <div v-if="showSellConfirm" class="confirm-overlay" @click.self="showSellConfirm = false">
                <div class="confirm-dialog">
                    <p class="confirm-text">{{ $t('business.sell_confirm', { name: displayName }) }}</p>
                    <div class="confirm-actions">
                        <UButton variant="ghost" size="sm" @click="showSellConfirm = false">
                            {{ $t('common.cancel') }}
                        </UButton>
                        <UButton variant="danger" size="sm" icon="mdi:store-remove" @click="confirmSell">
                            {{ $t('common.sell') }}
                        </UButton>
                    </div>
                </div>
            </div>
        </Teleport>
    </UCard>
</template>

<style scoped>
.business-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    position: relative;
    overflow: hidden;
}

.business-card.is-corp {
    border-color: var(--t-gold);
    box-shadow: 0 0 12px var(--t-gold-muted);
}

/* ── Accent strip ── */
.card-accent {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    border-radius: var(--t-radius-lg) 0 0 var(--t-radius-lg);
}

.accent-profit {
    background: var(--t-bg-muted);
}

.accent-loss {
    background: var(--t-error);
}

/* ── Header ── */
.card-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    cursor: pointer;
    user-select: none;
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
    transition: background 0.2s, box-shadow 0.2s;
}

.biz-icon-wrap.icon-corp {
    background: color-mix(in srgb, var(--t-gold) 15%, var(--t-bg-muted));
    box-shadow: 0 0 8px color-mix(in srgb, var(--t-gold) 20%, transparent);
}

.biz-icon {
    font-size: 1.15rem;
    color: var(--t-text-secondary);
}

.icon-corp .biz-icon {
    color: var(--t-gold);
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

/* Header profit (always visible, right side) */
.header-profit {
    display: flex;
    align-items: baseline;
    gap: 0.1rem;
    flex-shrink: 0;
    margin-left: auto;
}

.header-profit-val {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
}

.header-profit-unit {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.header-profit.success .header-profit-val {
    color: var(--t-success);
}

.header-profit.danger .header-profit-val {
    color: var(--t-error);
}

.collapse-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: var(--t-radius-sm);
    background: transparent;
    color: var(--t-text-muted);
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.15s, background 0.15s;
}

.collapse-toggle:hover {
    color: var(--t-text);
    background: var(--t-bg-muted);
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

/* ── Collapsible body ── */
.card-body {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

/* ── Utilization bar ── */
.utilization-bar-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.utilization-bar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.utilization-bar-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.utilization-icon {
    font-size: 0.85rem;
}

.utilization-bar-pct {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
}

.utilization-bar-pct.high {
    color: var(--t-success);
}

.utilization-bar-pct.mid {
    color: var(--t-warning);
}

.utilization-bar-pct.low {
    color: var(--t-error);
}

.utilization-track {
    height: 6px;
    background: var(--t-bg-muted);
    border-radius: 999px;
    overflow: hidden;
}

.utilization-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.4s ease;
}

.utilization-fill.high {
    background: var(--t-success);
}

.utilization-fill.mid {
    background: var(--t-warning);
}

.utilization-fill.low {
    background: var(--t-error);
}

.utilization-details {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
}

.price-status-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.05rem 0.35rem;
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-semibold);
    background: var(--t-bg-muted);
}

.price-status-chip.success {
    color: var(--t-success);
}

.price-status-chip.warn {
    color: var(--t-warning);
}

.price-status-chip.danger {
    color: var(--t-error);
}

.price-status-chip.info {
    color: var(--t-info);
}

/* ── Quick stats ── */
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

/* ── P&L Summary (improved) ── */
.pl-summary {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    background: color-mix(in srgb, var(--t-bg-muted) 60%, transparent);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
    flex-wrap: wrap;
}

.pl-side {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: 0;
}

.pl-profit {
    padding-left: var(--t-space-2);
    border-left: 2px solid var(--t-border);
}

.pl-divider {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    font-weight: var(--t-font-bold);
    flex-shrink: 0;
}

.pl-label {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
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
    color: var(--t-danger);
}

/* ── Manager ── */
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

/* ── Action bar ── */
.action-bar {
    display: flex;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.action-cost {
    font-family: var(--t-font-medium);
}

.level-up-btn {
    width: 100%;
}

/* ── Panel tabs ── */
.panel-tabs {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
    border-top: 1px solid var(--t-border);
    padding-top: var(--t-space-2);
}

/* ── Sub panel ── */
.sub-panel {
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

/* ── Details panel ── */
.details-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

/* Operations cards */
.ops-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.op-card {
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-3);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.op-card-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.op-icon-wrap {
    width: 1.8rem;
    height: 1.8rem;
    border-radius: var(--t-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    flex-shrink: 0;
}

.op-icon-wrap.price {
    background: var(--t-cta-muted);
    color: var(--t-cta);
}

.op-icon-wrap.marketing {
    background: var(--t-warning-muted);
    color: var(--t-warning);
}

.op-icon-wrap.quality {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.op-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.op-title {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.op-hint {
    font-size: 0.65rem;
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
}

.op-current-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
    margin-left: auto;
    white-space: nowrap;
}

.op-controls {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.step-pills {
    display: flex;
    align-items: center;
    gap: 0.2rem;
}

.step-pill {
    font-size: 0.6rem;
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    border: 1px solid var(--t-border);
    background: transparent;
    color: var(--t-text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
    line-height: 1.5;
}

.step-pill:hover {
    background: var(--t-bg-elevated);
    color: var(--t-text);
    border-color: var(--t-border-hover);
}

.step-pill.active {
    background: var(--t-cta);
    border-color: var(--t-cta);
    color: var(--t-cta-text);
}

.op-btn-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: auto;
}

/* Quality display */
.op-quality-display {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    margin-left: auto;
}

.op-quality-stars {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-sm);
    color: var(--t-warning);
}

.quality-max-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.65rem;
    font-weight: var(--t-font-bold);
    color: var(--t-success);
    background: var(--t-success-muted);
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.quality-bar-track {
    flex: 1;
    height: 4px;
    background: var(--t-bg-elevated);
    border-radius: 999px;
    overflow: hidden;
}

.quality-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--t-success), var(--t-warning));
    border-radius: 999px;
    transition: width 0.3s ease;
}

.quality-upgrade-btn {
    flex-shrink: 0;
}

/* Cost breakdown */
.cost-bars {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.cost-bar-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-1) var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

.cost-bar-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.cost-bar-icon {
    font-size: 0.85rem;
    color: var(--t-text-secondary);
}

.cost-bar-val {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-xs);
    color: var(--t-danger);
}

/* Lifetime stats */
.lifetime-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-2);
}

.lifetime-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    text-align: center;
}

.lifetime-stat.highlight {
    border-color: var(--t-cta);
    background: var(--t-cta-muted);
}

.lifetime-val {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.lifetime-val.success {
    color: var(--t-success);
}

.lifetime-val.danger {
    color: var(--t-danger);
}

.lifetime-lbl {
    font-size: 0.6rem;
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-top: 0.15rem;
}

/* ── Footer ── */
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
    gap: 0.3rem;
}

.valuation-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

/* ── Sell confirm ── */
.confirm-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.confirm-dialog {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-5);
    max-width: 360px;
    width: 90%;
    box-shadow: var(--t-shadow-lg);
}

.confirm-text {
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
    margin: 0 0 var(--t-space-4);
    text-align: center;
}

.confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--t-space-2);
}

/* ── Transitions ── */
.slide-enter-active,
.slide-leave-active {
    transition: all var(--t-transition-fast) ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.card-body-enter-active,
.card-body-leave-active {
    transition: all 0.25s ease;
    overflow: hidden;
}

.card-body-enter-from,
.card-body-leave-to {
    opacity: 0;
    max-height: 0;
}

.card-body-enter-to,
.card-body-leave-from {
    opacity: 1;
    max-height: 2000px;
}

/* Collapsed state — compact card */
.business-card.is-collapsed {
    gap: 0;
}
</style>
