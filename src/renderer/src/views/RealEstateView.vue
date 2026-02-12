<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { useFormat } from '@renderer/composables/useFormat'
import { gameEngine } from '@renderer/core/GameEngine'
import { PROPERTIES } from '@renderer/data/properties'
import AppIcon from '@renderer/components/AppIcon.vue'
import { PropertyCard } from '@renderer/components/realestate'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'

const realEstate = useRealEstateStore()
const player = usePlayerStore()
const upgrades = useUpgradeStore()
const { formatCash, formatPercent } = useFormat()
const { t } = useI18n()

const availableProperties = computed(() => {
    const ownedIds = new Set(realEstate.properties.map((p) => p.definitionId))
    return PROPERTIES.filter((def) => !ownedIds.has(def.id) && player.netWorth.gte(def.unlockAt))
})

// Rent bonus from skills/prestige
const rentBonus = computed(() => {
    const mul = upgrades.getMultiplier('real_estate_rent').toNumber()
    return mul > 1 ? `+${formatPercent(mul - 1)}` : t('realestate.no_bonus')
})

const realEstateInfoSections = computed<InfoSection[]>(() => [
    {
        title: t('realestate.info.basics.title'),
        icon: 'mdi:home-city',
        entries: [
            { term: t('realestate.info.basics.units'), desc: t('realestate.info.basics.units_desc'), icon: 'mdi:door' },
            { term: t('realestate.info.basics.category'), desc: t('realestate.info.basics.category_desc'), icon: 'mdi:tag' },
            { term: t('realestate.info.basics.base_rent'), desc: t('realestate.info.basics.base_rent_desc'), icon: 'mdi:cash' },
            { term: t('realestate.info.basics.current_value'), desc: t('realestate.info.basics.current_value_desc'), icon: 'mdi:chart-line' },
        ]
    },
    {
        title: t('realestate.info.condition.title'),
        icon: 'mdi:wrench',
        entries: [
            { term: t('realestate.info.condition.condition'), desc: t('realestate.info.condition.condition_desc'), icon: 'mdi:home-thermometer' },
            { term: t('realestate.info.condition.wear_rate'), desc: t('realestate.info.condition.wear_rate_desc'), icon: 'mdi:arrow-down' },
            { term: t('realestate.info.condition.repair'), desc: t('realestate.info.condition.repair_desc'), icon: 'mdi:hammer-wrench' },
            { term: t('realestate.info.condition.low_condition_penalty'), desc: t('realestate.info.condition.low_condition_penalty_desc'), icon: 'mdi:alert-circle' },
        ]
    },
    {
        title: t('realestate.info.occupancy.title'),
        icon: 'mdi:account-multiple',
        entries: [
            { term: t('realestate.info.occupancy.formula'), desc: t('realestate.info.occupancy.formula_desc'), icon: 'mdi:function-variant' },
            { term: t('realestate.info.occupancy.condition_factor'), desc: t('realestate.info.occupancy.condition_factor_desc'), icon: 'mdi:home-thermometer' },
            { term: t('realestate.info.occupancy.price_factor'), desc: t('realestate.info.occupancy.price_factor_desc'), icon: 'mdi:cash-multiple' },
            { term: t('realestate.info.occupancy.economy_factor'), desc: t('realestate.info.occupancy.economy_factor_desc'), icon: 'mdi:earth' },
            { term: t('realestate.info.occupancy.renovation_bonus'), desc: t('realestate.info.occupancy.renovation_bonus_desc'), icon: 'mdi:home-modern' },
        ]
    },
    {
        title: t('realestate.info.financials.title'),
        icon: 'mdi:finance',
        entries: [
            { term: t('realestate.info.financials.gross_rent'), desc: t('realestate.info.financials.gross_rent_desc'), icon: 'mdi:trending-up' },
            { term: t('realestate.info.financials.maintenance'), desc: t('realestate.info.financials.maintenance_desc'), icon: 'mdi:tools' },
            { term: t('realestate.info.financials.property_tax'), desc: t('realestate.info.financials.property_tax_desc'), icon: 'mdi:bank' },
            { term: t('realestate.info.financials.insurance'), desc: t('realestate.info.financials.insurance_desc'), icon: 'mdi:shield-home' },
            { term: t('realestate.info.financials.net_income'), desc: t('realestate.info.financials.net_income_desc'), icon: 'mdi:scale-balance' },
        ]
    },
    {
        title: t('realestate.info.controls.title'),
        icon: 'mdi:tune',
        entries: [
            { term: t('realestate.info.controls.rent_multiplier'), desc: t('realestate.info.controls.rent_multiplier_desc'), icon: 'mdi:cash-multiple' },
            { term: t('realestate.info.controls.renovate'), desc: t('realestate.info.controls.renovate_desc'), icon: 'mdi:home-modern' },
            { term: t('realestate.info.controls.renovation_cost'), desc: t('realestate.info.controls.renovation_cost_desc'), icon: 'mdi:calculator' },
            { term: t('realestate.info.controls.repair'), desc: t('realestate.info.controls.repair_desc'), icon: 'mdi:hammer-wrench' },
            { term: t('realestate.info.controls.sell'), desc: t('realestate.info.controls.sell_desc'), icon: 'mdi:home-remove' },
            { term: t('realestate.info.controls.rename'), desc: t('realestate.info.controls.rename_desc'), icon: 'mdi:pencil' },
        ]
    },
    {
        title: t('realestate.info.market_value.title'),
        icon: 'mdi:chart-areaspline',
        entries: [
            { term: t('realestate.info.market_value.appreciation'), desc: t('realestate.info.market_value.appreciation_desc'), icon: 'mdi:trending-up' },
            { term: t('realestate.info.market_value.economy_multiplier'), desc: t('realestate.info.market_value.economy_multiplier_desc'), icon: 'mdi:sine-wave' },
            { term: t('realestate.info.market_value.value_floor'), desc: t('realestate.info.market_value.value_floor_desc'), icon: 'mdi:shield' },
        ]
    },
    {
        title: t('realestate.info.details.title'),
        icon: 'mdi:text-box-outline',
        entries: [
            { term: t('realestate.info.details.purchase_price'), desc: t('realestate.info.details.purchase_price_desc'), icon: 'mdi:receipt' },
            { term: t('realestate.info.details.base_stats'), desc: t('realestate.info.details.base_stats_desc'), icon: 'mdi:information-outline' },
            { term: t('realestate.info.details.lifetime_totals'), desc: t('realestate.info.details.lifetime_totals_desc'), icon: 'mdi:chart-bar' },
        ]
    },
])

function buyProperty(def: (typeof PROPERTIES)[number]): void {
    realEstate.buyProperty(
        {
            id: def.id + '-' + Date.now(),
            definitionId: def.id,
            name: def.name,
            icon: def.icon,
            category: def.category,
            units: def.units,
            purchasePrice: def.price,
            baseRent: def.baseRent,
            baseMaintenance: def.baseMaintenance,
            wearRate: def.wearRate,
            taxRate: def.taxRate,
            baseAppreciationRate: def.baseAppreciationRate,
            renovationCostMultiplier: def.renovationCostMultiplier,
            maxRenovationLevel: def.maxRenovationLevel,
        },
        gameEngine.currentTick
    )
}
</script>

<template>
    <div class="page-container">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <AppIcon icon="mdi:home-city" class="page-title-icon" />
                    {{ $t('realestate.title') }}
                </h1>
                <p class="page-subtitle">{{ $t('realestate.subtitle') }}</p>
            </div>
        </div>

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-chip bonus-chip">
                <AppIcon icon="mdi:trending-up" class="stat-chip-icon" />
                <span class="stat-chip-label">{{ $t('realestate.rent_bonus') }}</span>
                <span class="stat-chip-value"
                    :class="{ 'text-success': upgrades.getMultiplier('real_estate_rent').gt(1) }">{{ rentBonus }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('realestate.rental_income') }}</span>
                <span class="stat-chip-value text-emerald">{{ formatCash(realEstate.rentPerSecond) }}/sec</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('realestate.total_value') }}</span>
                <span class="stat-chip-value text-sky">{{ formatCash(realEstate.totalPropertyValue) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ $t('realestate.total_properties') }}</span>
                <span class="stat-chip-value">{{ realEstate.properties.length }}</span>
            </div>
        </div>

        <!-- Owned Properties -->
        <section v-if="realEstate.properties.length">
            <h2 class="section-header">
                <AppIcon icon="mdi:key" class="section-icon text-sky" />
                {{ $t('realestate.portfolio') }}
            </h2>
            <div class="card-grid">
                <PropertyCard v-for="prop in realEstate.properties" :key="prop.id" :property="prop"
                    :renovation-cost="realEstate.getRenovationCost(prop)"
                    :can-afford-renovation="!player.cash.lt(realEstate.getRenovationCost(prop))"
                    :can-afford-repair="!player.cash.lt(prop.repairCost)" @repair="realEstate.repairProperty(prop.id)"
                    @renovate="realEstate.renovateProperty(prop.id)"
                    @set-rent="(m: number) => realEstate.setRentMultiplier(prop.id, m)"
                    @rename="(n: string) => realEstate.renameProperty(prop.id, n)"
                    @sell="realEstate.sellProperty(prop.id)" />
            </div>
        </section>

        <!-- Available Properties -->
        <section v-if="availableProperties.length">
            <h2 class="section-header">
                <AppIcon icon="mdi:home-search" class="section-icon" />
                {{ $t('realestate.market') }}
            </h2>
            <div class="card-grid">
                <div v-for="def in availableProperties" :key="def.id" class="purchase-card">
                    <div class="purchase-header">
                        <div class="purchase-icon-wrap">
                            <AppIcon :icon="def.icon" class="purchase-icon" />
                        </div>
                        <div>
                            <h3 class="purchase-name">{{ def.name }}</h3>
                            <div class="purchase-meta">
                                <span class="purchase-category">{{ def.category }}</span>
                                <span class="purchase-units">{{ def.units }} unit{{ def.units > 1 ? 's' : '' }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="purchase-stats">
                        <div class="purchase-stat">
                            <span class="ps-label">{{ $t('realestate.rent') }}</span>
                            <span class="ps-value text-emerald">{{ formatCash(def.baseRent) }}/t</span>
                        </div>
                        <div class="purchase-stat">
                            <span class="ps-label">{{ $t('realestate.maintenance') }}</span>
                            <span class="ps-value text-orange">{{ formatCash(def.baseMaintenance) }}/t</span>
                        </div>
                        <div class="purchase-stat">
                            <span class="ps-label">{{ $t('realestate.tax_rate') }}</span>
                            <span class="ps-value">{{ (def.taxRate * 100).toFixed(1) }}%</span>
                        </div>
                    </div>
                    <button class="buy-btn" :disabled="!player.canAfford(def.price)" @click="buyProperty(def)">
                        {{ $t('realestate.buy') }} — {{ formatCash(def.price) }}
                    </button>
                </div>
            </div>
        </section>

        <!-- Empty State -->
        <div v-if="realEstate.properties.length === 0 && availableProperties.length === 0" class="empty-state">
            <AppIcon icon="mdi:home-city-outline" class="empty-icon" />
            <p class="empty-title">{{ $t('realestate.no_properties') }}</p>
            <p class="empty-text">{{ $t('realestate.no_properties_desc') }}</p>
        </div>

        <!-- Info Panel -->
        <InfoPanel :title="$t('realestate.info_title')" :description="$t('realestate.info_desc')"
            :sections="realEstateInfoSections" />
    </div>
</template>

<style scoped>
section {
    margin-bottom: var(--t-space-8);
}

.section-icon.text-sky {
    color: var(--t-text-secondary);
}

.purchase-card {
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

.purchase-card:hover {
    border-color: var(--t-border-hover);
}

.purchase-header {
    display: flex;
    gap: var(--t-space-3);
    align-items: center;
}

.purchase-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.purchase-icon {
    font-size: 1.2rem;
    color: var(--t-text-secondary);
}

.purchase-name {
    font-size: var(--t-font-size-base);
    font-weight: 600;
    color: var(--t-text);
    margin: 0;
}

.purchase-meta {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    margin-top: 0.15rem;
}

.purchase-category {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    padding: 0.1rem 0.35rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.purchase-units {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.purchase-stats {
    display: flex;
    gap: var(--t-space-4);
    padding: var(--t-space-2) 0;
}

.purchase-stat {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.ps-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.ps-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text);
}

.ps-value.text-emerald {
    color: var(--t-success);
}

.ps-value.text-orange {
    color: var(--t-warning, #f59e0b);
}

.buy-btn {
    width: 100%;
    padding: var(--t-space-2) var(--t-space-4);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    color: var(--t-text);
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.buy-btn:hover:not(:disabled) {
    background: var(--t-text);
    color: var(--t-bg-base);
    border-color: var(--t-text);
}

.buy-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* Empty state */
.empty-state {
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
    opacity: 0.4;
}

.empty-title {
    font-size: var(--t-font-size-lg);
    font-weight: 600;
    color: var(--t-text-secondary);
    margin: 0 0 var(--t-space-2) 0;
}

.empty-text {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    margin: 0;
}
</style>
