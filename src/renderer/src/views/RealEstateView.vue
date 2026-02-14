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
import Dialog from 'primevue/dialog'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const player = usePlayerStore()
const { formatCash } = useFormat()

const activeTab = ref<'map' | 'opportunities' | 'portfolio'>('map')
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
        <div class="re-tabs">
            <button class="re-tab" :class="{ active: activeTab === 'map' }" @click="activeTab = 'map'">
                <AppIcon icon="mdi:map-outline" />
                <span>{{ t('realestate.tab.map') }}</span>
            </button>
            <button class="re-tab" :class="{ active: activeTab === 'opportunities' }"
                @click="activeTab = 'opportunities'">
                <AppIcon icon="mdi:tag-multiple-outline" />
                <span>{{ t('realestate.tab.opportunities') }}</span>
                <span v-if="realEstate.hotDeals.length > 0" class="tab-badge tab-badge--hot">{{
                    realEstate.hotDeals.length }}</span>
            </button>
            <button class="re-tab" :class="{ active: activeTab === 'portfolio' }" @click="activeTab = 'portfolio'">
                <AppIcon icon="mdi:briefcase-outline" />
                <span>{{ t('realestate.tab.portfolio') }}</span>
                <span v-if="realEstate.properties.length > 0" class="tab-badge">{{ realEstate.properties.length
                    }}</span>
            </button>
        </div>

        <!-- TAB: City Map -->
        <section v-if="activeTab === 'map'" class="section">
            <div class="map-layout">
                <div class="map-area">
                    <CityMap @select-district="handleSelectDistrict" @select-opportunity="handleSelectOpportunity"
                        @select-property="handleSelectProperty" />
                </div>
                <transition name="slide-panel">
                    <DistrictPanel v-if="selectedDistrict" :district="selectedDistrict" @close="selectedDistrict = null"
                        @view-property="handleSelectProperty" @view-opportunity="handleSelectOpportunity" />
                </transition>
            </div>
        </section>

        <!-- TAB: Opportunities -->
        <section v-if="activeTab === 'opportunities'" class="section">
            <h2 class="section-header">
                <AppIcon icon="mdi:tag-multiple" class="section-icon text-gold" />
                {{ t('realestate.opp.market_title') }}
                <span class="opp-count">({{ realEstate.availableOpportunities.length }})</span>
            </h2>

            <div v-if="realEstate.availableOpportunities.length === 0" class="empty-state">
                <AppIcon icon="mdi:map-search-outline" class="empty-icon" />
                <p>{{ t('realestate.no_opportunities') }}</p>
                <p class="text-muted" style="font-size: var(--t-font-size-sm);">{{ t('realestate.scan_hint') }}</p>
            </div>

            <div v-else class="card-grid">
                <OpportunityCard v-for="opp in realEstate.availableOpportunities" :key="opp.id" :opportunity="opp"
                    @bought="handleBought" />
            </div>
        </section>

        <!-- TAB: Portfolio -->
        <section v-if="activeTab === 'portfolio'" class="section">
            <h2 class="section-header">
                <AppIcon icon="mdi:briefcase" class="section-icon text-sky" />
                {{ t('realestate.portfolio') }}
                <span class="opp-count">({{ realEstate.properties.length }})</span>
            </h2>

            <div v-if="realEstate.properties.length === 0" class="empty-state">
                <AppIcon icon="mdi:home-outline" class="empty-icon" />
                <p>{{ t('realestate.no_properties') }}</p>
                <p class="text-muted" style="font-size: var(--t-font-size-sm);">{{ t('realestate.buy_hint') }}</p>
            </div>

            <div v-else class="card-grid-lg">
                <PropertyCard v-for="prop in realEstate.properties" :key="prop.id" :property="prop" @sold="handleSold"
                    @open-improvements="selectedPropertyId = prop.id; handleOpenImprovements()" />
            </div>
        </section>

        <!-- Info Panel -->
        <InfoPanel :title="t('realestate.info_title')" :description="t('realestate.info_desc')"
            :sections="realEstateInfoSections" />

        <!-- Dialogs -->
        <Dialog v-model:visible="showImprovements" :header="t('realestate.improvement_shop')" modal
            :style="{ width: '500px', maxHeight: '80vh' }" :dismissableMask="true">
            <ImprovementShop v-if="improvementProperty" :property="improvementProperty"
                @close="showImprovements = false" @installed="() => { }" />
        </Dialog>

        <Dialog v-model:visible="showCustomizer" :header="t('realestate.customize')" modal
            :style="{ width: '500px', maxHeight: '80vh' }" :dismissableMask="true">
            <PropertyCustomizer v-if="customizerProperty" :property="customizerProperty"
                @close="showCustomizer = false" />
        </Dialog>
    </div>
</template>

<style scoped>
.re-tabs {
    display: flex;
    gap: var(--t-space-1);
    border-bottom: 1px solid var(--t-border);
    padding-bottom: 0;
}

.re-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    font-size: var(--t-font-size-sm);
    font-weight: 500;
    color: var(--t-text-muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color var(--t-transition-fast), border-color var(--t-transition-fast);
}

.re-tab:hover {
    color: var(--t-text);
}

.re-tab.active {
    color: var(--t-accent);
    border-bottom-color: var(--t-accent);
}

.tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--t-accent);
    color: var(--t-bg-base);
    font-size: 0.65rem;
    font-weight: 700;
}

.tab-badge--hot {
    background: var(--t-danger);
    color: white;
}

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
</style>
