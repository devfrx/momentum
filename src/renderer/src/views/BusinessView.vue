<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'
import { BusinessCard } from '@renderer/components/business'
import { BUSINESSES } from '@renderer/data/businesses'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import Button from 'primevue/button'

const business = useBusinessStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

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
        title: t('business.info.price_status.title'),
        icon: 'mdi:information-outline',
        entries: [
            { term: t('business.info.price_status.optimal'), desc: t('business.info.price_status.optimal_desc'), icon: 'mdi:check-circle' },
            { term: t('business.info.price_status.underpriced'), desc: t('business.info.price_status.underpriced_desc'), icon: 'mdi:arrow-down-bold' },
            { term: t('business.info.price_status.overpriced'), desc: t('business.info.price_status.overpriced_desc'), icon: 'mdi:arrow-up-bold' },
            { term: t('business.info.price_status.too_expensive'), desc: t('business.info.price_status.too_expensive_desc'), icon: 'mdi:alert' },
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
    {
        title: t('business.info.controls.title'),
        icon: 'mdi:tune',
        entries: [
            { term: t('business.info.controls.employees'), desc: t('business.info.controls.employees_desc'), icon: 'mdi:account-group' },
            { term: t('business.info.controls.price'), desc: t('business.info.controls.price_desc'), icon: 'mdi:currency-usd' },
            { term: t('business.info.controls.marketing'), desc: t('business.info.controls.marketing_desc'), icon: 'mdi:bullhorn' },
            { term: t('business.info.controls.quality_upgrade'), desc: t('business.info.controls.quality_upgrade_desc'), icon: 'mdi:star' },
            { term: t('business.info.controls.rename'), desc: t('business.info.controls.rename_desc'), icon: 'mdi:pencil' },
            { term: t('business.info.controls.sell'), desc: t('business.info.controls.sell_desc'), icon: 'mdi:store-remove' },
        ]
    },
    {
        title: t('business.info.details.title'),
        icon: 'mdi:text-box-outline',
        entries: [
            { term: t('business.info.details.base_customers'), desc: t('business.info.details.base_customers_desc') },
            { term: t('business.info.details.price_factor'), desc: t('business.info.details.price_factor_desc') },
            { term: t('business.info.details.quality_marketing'), desc: t('business.info.details.quality_marketing_desc') },
            { term: t('business.info.details.elasticity'), desc: t('business.info.details.elasticity_desc') },
            { term: t('business.info.details.final_demand'), desc: t('business.info.details.final_demand_desc') },
            { term: t('business.info.details.cost_breakdown'), desc: t('business.info.details.cost_breakdown_desc') },
            { term: t('business.info.details.total_revenue_costs_profit'), desc: t('business.info.details.total_revenue_costs_profit_desc') },
            { term: t('business.info.details.ticks_owned'), desc: t('business.info.details.ticks_owned_desc') },
        ]
    },
])

/** Businesses available for purchase (not yet owned) */
const availableBusinesses = computed(() =>
    BUSINESSES.filter(def =>
        !business.businesses.find(b => b.id === def.id) &&
        player.netWorth.gte(def.unlockAtNetWorth)
    )
)

function buyBusiness(defId: string): void {
    const def = BUSINESSES.find(d => d.id === defId)
    if (def) business.buyBusiness(def)
}
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
                <span class="header-stat-value">{{ formatCash(business.profitPerSecond) }}<span
                        class="header-stat-suffix">{{ $t('common.per_second') }}</span></span>
            </div>
        </div>

        <!-- Owned Businesses -->
        <div v-if="business.businesses.length > 0" class="card-grid">
            <BusinessCard v-for="biz in business.businesses" :key="biz.id" :business="biz"
                @hire="business.hireEmployee(biz.id)" @fire="business.fireEmployee(biz.id)"
                @set-price="(p: number) => business.setPrice(biz.id, p)"
                @set-marketing="(m: number) => business.setMarketingBudget(biz.id, m)"
                @upgrade-quality="business.upgradeQuality(biz.id)"
                @rename="(n: string) => business.renameBusiness(biz.id, n)" @sell="business.sellBusiness(biz.id)"
                @hire-manager="business.hireManager(biz.id)" @collect-profit="business.collectProfit(biz.id)" />
        </div>

        <!-- Available for Purchase -->
        <div v-if="availableBusinesses.length > 0" class="available-section">
            <h2 class="section-heading">
                <AppIcon icon="mdi:store-plus" class="section-icon" />
                {{ $t('business.available_for_purchase') }}
            </h2>
            <div class="card-grid">
                <div v-for="def in availableBusinesses" :key="def.id" class="purchase-card">
                    <div class="purchase-header">
                        <AppIcon :icon="def.icon" class="purchase-icon" />
                        <div>
                            <h3 class="purchase-name">{{ def.name }}</h3>
                            <span class="purchase-category">{{ def.category }}</span>
                        </div>
                    </div>
                    <Button :disabled="!player.canAfford(def.purchasePrice)" @click="buyBusiness(def.id)">
                        {{ $t('common.buy') }} — {{ formatCash(def.purchasePrice) }}
                    </Button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-if="business.businesses.length === 0 && availableBusinesses.length === 0" class="empty-state">
            <AppIcon icon="mdi:store-off" class="empty-icon" />
            <p class="empty-title">{{ $t('business.no_businesses') }}</p>
            <p class="empty-text">{{ $t('business.empty_hint') }}</p>
        </div>

        <!-- Info Panel -->
        <InfoPanel :title="$t('business.info_title')" :sections="businessInfoSections" />
    </div>
</template>

<style scoped>
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
    font-weight: 700;
    color: var(--t-success);
}

.header-stat-suffix {
    font-size: var(--t-font-size-sm);
    opacity: 0.7;
}

.available-section {
    margin-top: var(--t-space-6);
}

.section-heading {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-lg);
    font-weight: 600;
    color: var(--t-text);
    margin-bottom: var(--t-space-4);
}

.section-icon {
    color: var(--t-text-muted);
    font-size: 1.1rem;
}

.purchase-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px dashed var(--t-border);
    border-radius: var(--t-radius-lg);
    box-shadow: var(--t-shadow-sm);
}

.purchase-header {
    display: flex;
    align-items: flex-start;
    gap: var(--t-space-3);
}

.purchase-icon {
    font-size: 1.6rem;
    color: var(--t-text-secondary);
}

.purchase-name {
    font-size: var(--t-font-size-base);
    font-weight: 600;
    color: var(--t-text);
}

.purchase-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0;
}

.purchase-category {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    background: var(--t-bg-secondary);
    padding: 0.1rem 0.4rem;
    border-radius: var(--t-radius-sm);
}

.empty-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    border: 1px dashed var(--t-border);
    border-radius: var(--t-radius-lg);
}

.empty-icon {
    font-size: 3rem;
    color: var(--t-text-muted);
    margin-bottom: var(--t-space-3);
}

.empty-title {
    font-size: var(--t-font-size-xl);
    font-weight: 600;
    color: var(--t-text-secondary);
    margin-bottom: var(--t-space-2);
}

.empty-text {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}
</style>
