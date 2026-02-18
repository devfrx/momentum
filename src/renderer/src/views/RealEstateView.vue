<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { type District } from '@renderer/data/realestate'
import CityMap from '@renderer/components/realestate/CityMap.vue'
import DistrictPanel from '@renderer/components/realestate/DistrictPanel.vue'
import OpportunityCard from '@renderer/components/realestate/OpportunityCard.vue'
import PropertyCard from '@renderer/components/realestate/PropertyCard.vue'
import ImprovementShop from '@renderer/components/realestate/ImprovementShop.vue'
import PropertyCustomizer from '@renderer/components/realestate/PropertyCustomizer.vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UTabs, UModal } from '@renderer/components/ui'
import type { TabDef } from '@renderer/components/ui'
import { EventImpactBanner } from '@renderer/components/events'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const player = usePlayerStore()
const { formatCash } = useFormat()

const activeTab = ref<string>('map')
const reTabs = computed<TabDef[]>(() => [
    { id: 'map', label: t('realestate.tab.map'), icon: 'mdi:map-outline' },
    { id: 'opportunities', label: t('realestate.tab.opportunities'), icon: 'mdi:tag-multiple-outline', count: realEstate.hotDeals.length },
    { id: 'portfolio', label: t('realestate.tab.portfolio'), icon: 'mdi:briefcase-outline', count: realEstate.properties.length },
])
const selectedDistrict = ref<District | null>(null)
const selectedPropertyId = ref<string | null>(null)
const showImprovements = ref(false)
const showCustomizer = ref(false)

const improvementProperty = computed(() =>
    showImprovements.value && selectedPropertyId.value
        ? realEstate.properties.find(p => p.id === selectedPropertyId.value) ?? null : null,
)

const customizerProperty = computed(() =>
    showCustomizer.value && selectedPropertyId.value
        ? realEstate.properties.find(p => p.id === selectedPropertyId.value) ?? null : null,
)

onMounted(() => {
    realEstate.ensureOpportunities(player.netWorth.toNumber(), Date.now())
})

function handleSelectDistrict(district: District): void {
    selectedDistrict.value = district
}
function handleSelectOpportunity(_oppId: string): void {
    activeTab.value = 'opportunities'
}
function handleSelectProperty(propId: string): void {
    selectedPropertyId.value = propId
    activeTab.value = 'portfolio'
}
function handleBought(propId: string): void {
    selectedPropertyId.value = propId
    activeTab.value = 'portfolio'
}
function handleSold(): void {
    selectedPropertyId.value = null
}
function handleOpenImprovements(): void {
    showImprovements.value = true
}

const realEstateInfoSections = computed<InfoSection[]>(() => [
    {
        title: t('realestate.info.basics.title'),
        icon: 'mdi:home-outline',
        entries: [
            { term: t('realestate.info.basics.units'), desc: t('realestate.info.basics.units_desc'), icon: 'mdi:door-open' },
            { term: t('realestate.info.basics.category'), desc: t('realestate.info.basics.category_desc'), icon: 'mdi:shape-outline' },
            { term: t('realestate.info.basics.base_rent'), desc: t('realestate.info.basics.base_rent_desc'), icon: 'mdi:cash' },
            { term: t('realestate.info.basics.current_value'), desc: t('realestate.info.basics.current_value_desc'), icon: 'mdi:tag-text-outline' },
        ],
    },
    {
        title: t('realestate.info.condition.title'),
        icon: 'mdi:wrench-outline',
        entries: [
            { term: t('realestate.info.condition.condition'), desc: t('realestate.info.condition.condition_desc'), icon: 'mdi:gauge' },
            { term: t('realestate.info.condition.wear_rate'), desc: t('realestate.info.condition.wear_rate_desc'), icon: 'mdi:trending-down' },
            { term: t('realestate.info.condition.repair'), desc: t('realestate.info.condition.repair_desc'), icon: 'mdi:hammer-wrench' },
            { term: t('realestate.info.condition.low_condition_penalty'), desc: t('realestate.info.condition.low_condition_penalty_desc'), icon: 'mdi:alert-circle-outline' },
        ],
    },
    {
        title: t('realestate.info.occupancy.title'),
        icon: 'mdi:account-group-outline',
        entries: [
            { term: t('realestate.info.occupancy.formula'), desc: t('realestate.info.occupancy.formula_desc'), icon: 'mdi:function-variant' },
            { term: t('realestate.info.occupancy.condition_factor'), desc: t('realestate.info.occupancy.condition_factor_desc'), icon: 'mdi:wrench' },
            { term: t('realestate.info.occupancy.price_factor'), desc: t('realestate.info.occupancy.price_factor_desc'), icon: 'mdi:currency-usd' },
            { term: t('realestate.info.occupancy.economy_factor'), desc: t('realestate.info.occupancy.economy_factor_desc'), icon: 'mdi:earth' },
            { term: t('realestate.info.occupancy.renovation_bonus'), desc: t('realestate.info.occupancy.renovation_bonus_desc'), icon: 'mdi:arrow-up-bold-circle' },
        ],
    },
    {
        title: t('realestate.info.financials.title'),
        icon: 'mdi:calculator',
        entries: [
            { term: t('realestate.info.financials.gross_rent'), desc: t('realestate.info.financials.gross_rent_desc'), icon: 'mdi:cash-plus' },
            { term: t('realestate.info.financials.maintenance'), desc: t('realestate.info.financials.maintenance_desc'), icon: 'mdi:tools' },
            { term: t('realestate.info.financials.property_tax'), desc: t('realestate.info.financials.property_tax_desc'), icon: 'mdi:file-document-outline' },
            { term: t('realestate.info.financials.insurance'), desc: t('realestate.info.financials.insurance_desc'), icon: 'mdi:shield-check-outline' },
            { term: t('realestate.info.financials.net_income'), desc: t('realestate.info.financials.net_income_desc'), icon: 'mdi:scale-balance' },
        ],
    },
    {
        title: t('realestate.info.controls.title'),
        icon: 'mdi:tune-vertical',
        entries: [
            { term: t('realestate.info.controls.rent_multiplier'), desc: t('realestate.info.controls.rent_multiplier_desc'), icon: 'mdi:knob' },
            { term: t('realestate.info.controls.renovate'), desc: t('realestate.info.controls.renovate_desc'), icon: 'mdi:hammer' },
            { term: t('realestate.info.controls.renovation_cost'), desc: t('realestate.info.controls.renovation_cost_desc'), icon: 'mdi:cash-fast' },
            { term: t('realestate.info.controls.repair'), desc: t('realestate.info.controls.repair_desc'), icon: 'mdi:hammer-wrench' },
            { term: t('realestate.info.controls.sell'), desc: t('realestate.info.controls.sell_desc'), icon: 'mdi:home-export-outline' },
            { term: t('realestate.info.controls.rename'), desc: t('realestate.info.controls.rename_desc'), icon: 'mdi:pencil-outline' },
        ],
    },
    {
        title: t('realestate.info.market_value.title'),
        icon: 'mdi:chart-line',
        entries: [
            { term: t('realestate.info.market_value.appreciation'), desc: t('realestate.info.market_value.appreciation_desc'), icon: 'mdi:trending-up' },
            { term: t('realestate.info.market_value.economy_multiplier'), desc: t('realestate.info.market_value.economy_multiplier_desc'), icon: 'mdi:earth' },
            { term: t('realestate.info.market_value.value_floor'), desc: t('realestate.info.market_value.value_floor_desc'), icon: 'mdi:shield-outline' },
        ],
    },
    {
        title: t('realestate.info.details.title'),
        icon: 'mdi:information-outline',
        entries: [
            { term: t('realestate.info.details.purchase_price'), desc: t('realestate.info.details.purchase_price_desc'), icon: 'mdi:receipt' },
            { term: t('realestate.info.details.base_stats'), desc: t('realestate.info.details.base_stats_desc'), icon: 'mdi:format-list-numbered' },
            { term: t('realestate.info.details.lifetime_totals'), desc: t('realestate.info.details.lifetime_totals_desc'), icon: 'mdi:sigma' },
        ],
    },
])
</script>

<template>
    <div class="page-container">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <AppIcon icon="mdi:city-variant-outline" class="page-title-icon" />
                    {{ t('realestate.title') }}
                </h1>
                <p class="page-subtitle">{{ t('realestate.subtitle') }}</p>
            </div>
        </div>

        <!-- Event Impact -->
        <EventImpactBanner route-name="realestate" />

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-chip">
                <span class="stat-chip-label">{{ t('realestate.stat.properties') }}</span>
                <span class="stat-chip-value text-sky">{{ realEstate.properties.length }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ t('realestate.stat.rent_tick') }}</span>
                <span class="stat-chip-value text-emerald">{{ formatCash(realEstate.totalRentPerTick) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ t('realestate.stat.portfolio_value') }}</span>
                <span class="stat-chip-value text-gold">{{ formatCash(realEstate.totalPropertyValue) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ t('realestate.stat.opportunities') }}</span>
                <span class="stat-chip-value text-sky">{{ realEstate.availableOpportunities.length }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ t('realestate.stat.hot_deals') }}</span>
                <span class="stat-chip-value text-red">{{ realEstate.hotDeals.length }}</span>
            </div>
        </div>

        <!-- Tab Navigation -->
        <UTabs v-model="activeTab" :tabs="reTabs">
            <template #map>
                <section class="section">
                    <div class="map-layout">
                        <div class="map-area">
                            <CityMap @select-district="handleSelectDistrict"
                                @select-opportunity="handleSelectOpportunity" @select-property="handleSelectProperty" />
                        </div>
                        <transition name="slide-panel">
                            <DistrictPanel v-if="selectedDistrict" :district="selectedDistrict"
                                @close="selectedDistrict = null" @view-property="handleSelectProperty"
                                @view-opportunity="handleSelectOpportunity" />
                        </transition>
                    </div>
                </section>
            </template>

            <template #opportunities>
                <section class="section">
                    <h2 class="section-header">
                        <AppIcon icon="mdi:tag-multiple" class="section-icon text-gold" />
                        {{ t('realestate.opp.market_title') }}
                        <span class="opp-count">({{ realEstate.availableOpportunities.length }})</span>
                    </h2>

                    <div v-if="realEstate.availableOpportunities.length === 0" class="empty-state">
                        <AppIcon icon="mdi:map-search-outline" class="empty-icon" />
                        <p>{{ t('realestate.no_opportunities') }}</p>
                        <p class="text-muted text-sm">{{ t('realestate.scan_hint') }}
                        </p>
                    </div>

                    <div v-else class="card-grid">
                        <OpportunityCard v-for="opp in realEstate.availableOpportunities" :key="opp.id"
                            :opportunity="opp" @bought="handleBought" />
                    </div>
                </section>
            </template>

            <template #portfolio>
                <section class="section">
                    <h2 class="section-header">
                        <AppIcon icon="mdi:briefcase" class="section-icon text-sky" />
                        {{ t('realestate.portfolio') }}
                        <span class="opp-count">({{ realEstate.properties.length }})</span>
                    </h2>

                    <div v-if="realEstate.properties.length === 0" class="empty-state">
                        <AppIcon icon="mdi:home-outline" class="empty-icon" />
                        <p>{{ t('realestate.no_properties') }}</p>
                        <p class="text-muted text-sm">{{ t('realestate.buy_hint') }}
                        </p>
                    </div>

                    <div v-else class="card-grid-lg">
                        <PropertyCard v-for="prop in realEstate.properties" :key="prop.id" :property="prop"
                            @sold="handleSold"
                            @open-improvements="selectedPropertyId = prop.id; handleOpenImprovements()" />
                    </div>
                </section>
            </template>
        </UTabs>

        <!-- Info Panel -->
        <InfoPanel :title="t('realestate.info_title')" :description="t('realestate.info_desc')"
            :sections="realEstateInfoSections" />

        <!-- Dialogs -->
        <UModal v-model="showImprovements" :title="t('realestate.improvement_shop')" icon="mdi:hammer-wrench" size="md">
            <ImprovementShop v-if="improvementProperty" :property="improvementProperty"
                @close="showImprovements = false" @installed="() => { }" />
        </UModal>

        <UModal v-model="showCustomizer" :title="t('realestate.customize')" icon="mdi:palette" size="md">
            <PropertyCustomizer v-if="customizerProperty" :property="customizerProperty"
                @close="showCustomizer = false" />
        </UModal>
    </div>
</template>

<style scoped>
.map-layout {
    display: flex;
    gap: var(--t-space-4);
    min-height: 520px;
}

.map-area {
    flex: 1;
    min-width: 0;
}

.opp-count {
    font-weight: 400;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    margin-left: 0.3rem;
}

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

.slide-panel-enter-active,
.slide-panel-leave-active {
    transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
    transform: translateX(20px);
    opacity: 0;
}

.text-sm {
    font-size: var(--t-font-size-sm);
}
</style>
