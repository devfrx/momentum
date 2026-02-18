<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UTabs, UCard } from '@renderer/components/ui'
import type { TabDef } from '@renderer/components/ui'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import { BusinessCard, BusinessPurchaseCard } from '@renderer/components/business'
import { BusinessAdvisorCard } from '@renderer/components/business'
import { EventImpactBanner } from '@renderer/components/events'
import { BUSINESS_DEFS } from '@renderer/data/businesses'

const { t } = useI18n()
const business = useBusinessStore()
const { formatCash } = useFormat()

// ── Tabs ──
const activeTab = ref<string>('overview')
const businessTabs = computed<TabDef[]>(() => [
    { id: 'overview', label: t('business.tab_overview'), icon: 'mdi:view-dashboard-outline' },
    { id: 'portfolio', label: t('business.tab_portfolio'), icon: 'mdi:briefcase-outline', count: business.businesses.length },
    { id: 'market', label: t('business.tab_market'), icon: 'mdi:store-plus-outline', count: availableBusinesses.value.length },
    { id: 'advisors', label: t('business.tab_advisors'), icon: 'mdi:account-tie' },
])

// ── Market ── (always show all businesses, sorted by price as tiers)
const availableBusinesses = computed(() =>
    [...BUSINESS_DEFS].sort((a, b) => a.purchasePrice.cmp(b.purchasePrice))
)

// ── Overview KPIs ──
const totalLevels = computed(() => business.totalLevels)
const totalBranches = computed(() => business.totalBranches)
const corpCount = computed(() => business.corporationCount)
const totalBiz = computed(() => business.totalBusinessCount)

// ── Info Panel ──
const businessInfoSections = computed<InfoSection[]>(() => [
    {
        title: t('business.info.revenue.title'),
        icon: 'mdi:cash-register',
        entries: [
            { term: t('business.info.revenue.demand'), desc: t('business.info.revenue.demand_desc'), icon: 'mdi:account-multiple' },
            { term: t('business.info.revenue.capacity'), desc: t('business.info.revenue.capacity_desc'), icon: 'mdi:package-variant' },
            { term: t('business.info.revenue.units_sold'), desc: t('business.info.revenue.units_sold_desc'), icon: 'mdi:cart-check' },
            { term: t('business.info.revenue.utilization'), desc: t('business.info.revenue.utilization_desc'), icon: 'mdi:gauge' },
            { term: t('business.info.revenue.revenue_per_s'), desc: t('business.info.revenue.revenue_per_s_desc'), icon: 'mdi:trending-up' },
        ]
    },
    {
        title: t('business.info.scaling.title'),
        icon: 'mdi:arrow-expand-up',
        entries: [
            { term: t('business.info.scaling.levels'), desc: t('business.info.scaling.levels_desc'), icon: 'mdi:arrow-up-bold-circle' },
            { term: t('business.info.scaling.branches'), desc: t('business.info.scaling.branches_desc'), icon: 'mdi:source-branch' },
            { term: t('business.info.scaling.upgrades'), desc: t('business.info.scaling.upgrades_desc'), icon: 'mdi:arrow-up-bold-box' },
            { term: t('business.info.scaling.synergies'), desc: t('business.info.scaling.synergies_desc'), icon: 'mdi:lightning-bolt' },
            { term: t('business.info.scaling.corporation'), desc: t('business.info.scaling.corporation_desc'), icon: 'mdi:domain' },
            { term: t('business.info.scaling.milestones'), desc: t('business.info.scaling.milestones_desc'), icon: 'mdi:trophy' },
        ]
    },
    {
        title: t('business.info.demand.title'),
        icon: 'mdi:chart-line',
        entries: [
            { term: t('business.info.demand.base_customers'), desc: t('business.info.demand.base_customers_desc'), icon: 'mdi:account-multiple' },
            { term: t('business.info.demand.price_factor'), desc: t('business.info.demand.price_factor_desc'), icon: 'mdi:tag-outline' },
            { term: t('business.info.demand.quality_factor'), desc: t('business.info.demand.quality_factor_desc'), icon: 'mdi:star-outline' },
            { term: t('business.info.demand.marketing_factor'), desc: t('business.info.demand.marketing_factor_desc'), icon: 'mdi:bullhorn-outline' },
            { term: t('business.info.demand.economy_demand'), desc: t('business.info.demand.economy_demand_desc'), icon: 'mdi:earth' },
            { term: t('business.info.demand.elasticity'), desc: t('business.info.demand.elasticity_desc'), icon: 'mdi:swap-vertical' },
            { term: t('business.info.demand.customer_attraction'), desc: t('business.info.demand.customer_attraction_desc'), icon: 'mdi:magnet' },
        ]
    },
    {
        title: t('business.info.costs.title'),
        icon: 'mdi:calculator',
        entries: [
            { term: t('business.info.costs.wages'), desc: t('business.info.costs.wages_desc'), icon: 'mdi:account-cash' },
            { term: t('business.info.costs.rent'), desc: t('business.info.costs.rent_desc'), icon: 'mdi:office-building' },
            { term: t('business.info.costs.supplies'), desc: t('business.info.costs.supplies_desc'), icon: 'mdi:package-variant-closed' },
            { term: t('business.info.costs.marketing_spend'), desc: t('business.info.costs.marketing_spend_desc'), icon: 'mdi:bullhorn-outline' },
            { term: t('business.info.costs.cost_reduction'), desc: t('business.info.costs.cost_reduction_desc'), icon: 'mdi:sale' },
            { term: t('business.info.costs.costs_per_s'), desc: t('business.info.costs.costs_per_s_desc'), icon: 'mdi:trending-down' },
        ]
    },
    {
        title: t('business.info.profit.title'),
        icon: 'mdi:bank',
        entries: [
            { term: t('business.info.profit.profit_per_s'), desc: t('business.info.profit.profit_per_s_desc'), icon: 'mdi:scale-balance' },
            { term: t('business.info.profit.avg_profit'), desc: t('business.info.profit.avg_profit_desc'), icon: 'mdi:chart-timeline-variant' },
            { term: t('business.info.profit.valuation'), desc: t('business.info.profit.valuation_desc'), icon: 'mdi:cash' },
        ]
    },
])
</script>

<template>
    <div class="page-container">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <AppIcon icon="mdi:domain" class="page-title-icon" />
                    {{ $t('business.title') }}
                </h1>
                <p class="page-subtitle">{{ $t('business.subtitle') }}</p>
            </div>

            <div class="header-stat">
                <span class="header-stat-label">{{ $t('business.profit') }}</span>
                <span class="header-stat-value">
                    {{ formatCash(business.profitPerSecond) }}
                    <span class="header-stat-suffix">{{ $t('common.per_second') }}</span>
                </span>
            </div>
        </div>

        <!-- Event Impact -->
        <EventImpactBanner route-name="business" />

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('business.stat_businesses') }}</span>
                <span class="stat-chip-value text-sky">{{ totalBiz }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('business.stat_levels') }}</span>
                <span class="stat-chip-value text-gold">{{ totalLevels }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('business.stat_branches') }}</span>
                <span class="stat-chip-value text-emerald">{{ totalBranches }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('business.stat_corps') }}</span>
                <span class="stat-chip-value text-red">{{ corpCount }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('business.stat_value') }}</span>
                <span class="stat-chip-value text-emerald">{{ formatCash(business.totalBusinessValue) }}</span>
            </div>
        </div>

        <!-- Tab Navigation -->
        <UTabs v-model="activeTab" :tabs="businessTabs">
            <template #overview>
                <section class="section">
                    <div class="overview-grid">
                        <!-- Profit Summary -->
                        <UCard class="kpi-card" size="sm">
                            <div class="kpi-label">{{ $t('business.kpi_profit') }}</div>
                            <div class="kpi-value success">{{ formatCash(business.profitPerSecond) }}/s</div>
                        </UCard>
                        <UCard class="kpi-card" size="sm">
                            <div class="kpi-label">{{ $t('business.kpi_value') }}</div>
                            <div class="kpi-value gold">{{ formatCash(business.totalBusinessValue) }}</div>
                        </UCard>
                        <UCard class="kpi-card" size="sm">
                            <div class="kpi-label">{{ $t('business.kpi_businesses') }}</div>
                            <div class="kpi-value">{{ totalBiz }}</div>
                        </UCard>
                        <UCard class="kpi-card" size="sm">
                            <div class="kpi-label">{{ $t('business.kpi_levels') }}</div>
                            <div class="kpi-value">{{ totalLevels }}</div>
                        </UCard>
                        <UCard class="kpi-card" size="sm">
                            <div class="kpi-label">{{ $t('business.kpi_branches') }}</div>
                            <div class="kpi-value">{{ totalBranches }}</div>
                        </UCard>
                        <UCard class="kpi-card" size="sm">
                            <div class="kpi-label">{{ $t('business.kpi_corps') }}</div>
                            <div class="kpi-value">{{ corpCount }}</div>
                        </UCard>
                    </div>

                    <!-- Quick business list -->
                    <div v-if="business.businesses.length > 0" class="overview-list">
                        <h3 class="section-header">
                            <AppIcon icon="mdi:format-list-bulleted" class="section-icon" />
                            {{ $t('business.overview_list') }}
                        </h3>
                        <div class="overview-table">
                            <div v-for="biz in business.businesses" :key="biz.id" class="overview-row"
                                @click="activeTab = 'portfolio'">
                                <AppIcon :icon="biz.icon || 'mdi:store'" class="overview-row-icon" />
                                <span class="overview-row-name">{{ biz.customName || biz.name }}</span>
                                <span class="overview-row-level">Lv.{{ biz.level }}</span>
                                <span class="overview-row-profit"
                                    :class="biz.avgProfitPerTick.gte(0) ? 'success' : 'danger'">
                                    {{ formatCash(biz.avgProfitPerTick.mul(10)) }}/s
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Empty -->
                    <div v-else class="empty-state">
                        <AppIcon icon="mdi:store-off" class="empty-icon" />
                        <p class="empty-title">{{ $t('business.no_businesses') }}</p>
                        <p class="empty-text">{{ $t('business.empty_hint') }}</p>
                    </div>

                    <!-- Info Panel -->
                    <InfoPanel :title="$t('business.info_title')" :description="$t('business.info_desc')"
                        :sections="businessInfoSections" />
                </section>
            </template>

            <template #portfolio>
                <section class="section">
                    <h2 class="section-header">
                        <AppIcon icon="mdi:briefcase" class="section-icon text-sky" />
                        {{ $t('business.tab_portfolio') }}
                        <span class="count-badge">({{ business.businesses.length }})</span>
                    </h2>

                    <div v-if="business.businesses.length === 0" class="empty-state">
                        <AppIcon icon="mdi:store-off" class="empty-icon" />
                        <p class="empty-title">{{ $t('business.no_businesses') }}</p>
                        <p class="empty-text">{{ $t('business.empty_hint') }}</p>
                    </div>

                    <div v-else class="card-grid">
                        <BusinessCard v-for="biz in business.businesses" :key="biz.id" :business="biz" />
                    </div>
                </section>
            </template>

            <template #market>
                <section class="section">
                    <h2 class="section-header">
                        <AppIcon icon="mdi:store-plus" class="section-icon text-gold" />
                        {{ $t('business.tab_market') }}
                        <span class="count-badge">({{ availableBusinesses.length }})</span>
                    </h2>

                    <div v-if="availableBusinesses.length === 0" class="empty-state">
                        <AppIcon icon="mdi:store-search-outline" class="empty-icon" />
                        <p class="empty-title">{{ $t('business.no_available') }}</p>
                        <p class="empty-text">{{ $t('business.market_hint') }}</p>
                    </div>

                    <div v-else class="card-grid">
                        <BusinessPurchaseCard v-for="(def, idx) in availableBusinesses" :key="def.id" :def="def"
                            :tier="idx + 1" @buy="(id, name, icon) => business.buyBusiness(id, name, icon)" />
                    </div>
                </section>
            </template>

            <template #advisors>
                <section class="section">
                    <h2 class="section-header">
                        <AppIcon icon="mdi:account-tie" class="section-icon text-sky" />
                        {{ $t('business.tab_advisors') }}
                    </h2>

                    <div v-if="business.businesses.length === 0" class="empty-state">
                        <AppIcon icon="mdi:account-search-outline" class="empty-icon" />
                        <p class="empty-title">{{ $t('business.no_businesses') }}</p>
                        <p class="empty-text">{{ $t('business.advisors_hint') }}</p>
                    </div>

                    <div v-else class="advisor-section">
                        <div v-for="biz in business.businesses" :key="biz.id" class="advisor-biz-block">
                            <h3 class="advisor-biz-name">
                                <AppIcon :icon="biz.icon || 'mdi:store'" />
                                {{ biz.customName || biz.name }}
                                <span class="advisor-biz-level">Lv.{{ biz.level }}</span>
                            </h3>
                            <BusinessAdvisorCard :business="biz" />
                        </div>
                    </div>
                </section>
            </template>
        </UTabs>
    </div>
</template>

<style scoped>
/* Header stat */
.header-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: var(--t-space-3) var(--t-space-5);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.header-stat-label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--t-text-muted);
}

.header-stat-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xl);
    font-weight: var(--t-font-bold);
    color: var(--t-success);
}

.header-stat-suffix {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}



/* Overview */
.overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--t-space-3);
    margin-bottom: var(--t-space-5);
}

.kpi-card {
    text-align: center;
}

.kpi-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: var(--t-space-1);
}

.kpi-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xl);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.kpi-value.success {
    color: var(--t-success);
}

.kpi-value.gold {
    color: var(--t-gold);
}

/* Overview list */
.overview-list {
    margin-top: var(--t-space-5);
}

.overview-table {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.overview-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    cursor: pointer;
    transition: border-color var(--t-transition-fast);
}

.overview-row:hover {
    border-color: var(--t-border-hover);
}

.overview-row:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}

.overview-row:active {
    transform: scale(0.98);
}

.overview-row-icon {
    font-size: 1.1rem;
    color: var(--t-text-muted);
}

.overview-row-name {
    flex: 1;
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-medium);
}

.overview-row-level {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.overview-row-profit {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
}

.overview-row-profit.success {
    color: var(--t-success);
}

.overview-row-profit.danger {
    color: var(--t-error);
}

/* Count badge */
.count-badge {
    font-weight: 400;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    margin-left: 0.3rem;
}

/* Advisor per-business blocks */
.advisor-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-5);
}

.advisor-biz-block {
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.advisor-biz-name {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-semibold);
    margin: 0 0 var(--t-space-3);
}

.advisor-biz-level {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

/* Empty state */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-10) var(--t-space-4);
    color: var(--t-text-muted);
    text-align: center;
}

.empty-icon {
    font-size: 2.5rem;
    opacity: 0.4;
    margin-bottom: var(--t-space-2);
}

.empty-title {
    font-size: var(--t-font-size-xl);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
    margin-bottom: var(--t-space-2);
}

.empty-text {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}
</style>
