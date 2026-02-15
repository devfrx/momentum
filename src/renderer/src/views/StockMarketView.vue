<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStockStore } from '@renderer/stores/useStockStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import AssetCard from '@renderer/components/market/AssetCard.vue'
import MarketStats from '@renderer/components/market/MarketStats.vue'
import MarketSettings from '@renderer/components/market/MarketSettings.vue'
import PriceChart from '@renderer/components/charts/PriceChart.vue'
import PositionInfo from '@renderer/components/market/PositionInfo.vue'
import TradePanel from '@renderer/components/market/TradePanel.vue'
import { useFormat } from '@renderer/composables/useFormat'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import { EventImpactBanner } from '@renderer/components/events'
import { useI18n } from 'vue-i18n'

const stocks = useStockStore()
const player = usePlayerStore()
const settings = useSettingsStore()
const { formatCash, formatPercent } = useFormat()
const { t } = useI18n()

const showCharts = ref(true)
const pinnedAssetId = computed({
    get: () => settings.pinnedStockId,
    set: (v) => { settings.pinnedStockId = v }
})

function getPosition(assetId: string) {
    return stocks.portfolio.find((p) => p.assetId === assetId)
}

const sortedAssets = computed(() =>
    [...stocks.assets].sort((a, b) => b.currentPrice - a.currentPrice)
)

const unpinnedAssets = computed(() =>
    sortedAssets.value.filter((a) => a.id !== pinnedAssetId.value)
)

const pinnedAsset = computed(() =>
    pinnedAssetId.value ? stocks.assets.find((a) => a.id === pinnedAssetId.value) ?? null : null
)

const pinnedPosition = computed(() =>
    pinnedAssetId.value ? getPosition(pinnedAssetId.value) ?? null : null
)

const pinnedPnL = computed(() => {
    if (!pinnedPosition.value || !pinnedAsset.value) return null
    const currentValue = pinnedAsset.value.currentPrice * pinnedPosition.value.shares
    const invested = pinnedPosition.value.totalInvested.toNumber()
    const pnlValue = currentValue - invested
    const pnlPercent = invested > 0 ? (pnlValue / invested) * 100 : 0
    return { value: pnlValue, percent: pnlPercent, currentValue }
})

const availableCash = computed(() => player.cash.toNumber())

function togglePin(assetId: string) {
    pinnedAssetId.value = pinnedAssetId.value === assetId ? null : assetId
}

function handleBuy(assetId: string, amount: number) {
    stocks.buyShares(assetId, amount)
}

function handleSell(assetId: string, amount: number) {
    stocks.sellShares(assetId, amount)
}

const stockInfoSections = computed<InfoSection[]>(() => [
    {
        title: t('stocks.info.trading.title'),
        icon: 'mdi:swap-horizontal',
        entries: [
            { term: t('stocks.info.trading.buy'), desc: t('stocks.info.trading.buy_desc'), icon: 'mdi:cart-arrow-down' },
            { term: t('stocks.info.trading.sell'), desc: t('stocks.info.trading.sell_desc'), icon: 'mdi:cart-arrow-up' },
            { term: t('stocks.info.trading.xp'), desc: t('stocks.info.trading.xp_desc'), icon: 'mdi:star-circle' },
        ],
    },
    {
        title: t('stocks.info.portfolio.title'),
        icon: 'mdi:briefcase-outline',
        entries: [
            { term: t('stocks.info.portfolio.positions'), desc: t('stocks.info.portfolio.positions_desc'), icon: 'mdi:format-list-bulleted' },
            { term: t('stocks.info.portfolio.unrealized'), desc: t('stocks.info.portfolio.unrealized_desc'), icon: 'mdi:chart-line-variant' },
            { term: t('stocks.info.portfolio.realized'), desc: t('stocks.info.portfolio.realized_desc'), icon: 'mdi:check-decagram' },
        ],
    },
    {
        title: t('stocks.info.charts.title'),
        icon: 'mdi:chart-areaspline',
        entries: [
            { term: t('stocks.info.charts.pin'), desc: t('stocks.info.charts.pin_desc'), icon: 'mdi:pin' },
            { term: t('stocks.info.charts.ath_atl'), desc: t('stocks.info.charts.ath_atl_desc'), icon: 'mdi:arrow-expand-vertical' },
            { term: t('stocks.info.charts.toggle'), desc: t('stocks.info.charts.toggle_desc'), icon: 'mdi:eye-outline' },
        ],
    },
    {
        title: t('stocks.info.price_model.title'),
        icon: 'mdi:function-variant',
        entries: [
            { term: t('stocks.info.price_model.gbm'), desc: t('stocks.info.price_model.gbm_desc'), icon: 'mdi:sigma' },
            { term: t('stocks.info.price_model.drift'), desc: t('stocks.info.price_model.drift_desc'), icon: 'mdi:trending-up' },
            { term: t('stocks.info.price_model.volatility'), desc: t('stocks.info.price_model.volatility_desc'), icon: 'mdi:pulse' },
        ],
    },
    {
        title: t('stocks.info.conditions.title'),
        icon: 'mdi:weather-partly-cloudy',
        entries: [
            { term: t('stocks.info.conditions.normal'), desc: t('stocks.info.conditions.normal_desc'), icon: 'mdi:minus-circle-outline' },
            { term: t('stocks.info.conditions.bull'), desc: t('stocks.info.conditions.bull_desc'), icon: 'mdi:bull' },
            { term: t('stocks.info.conditions.bear'), desc: t('stocks.info.conditions.bear_desc'), icon: 'mdi:arrow-down-bold' },
            { term: t('stocks.info.conditions.crash'), desc: t('stocks.info.conditions.crash_desc'), icon: 'mdi:alert-octagon' },
            { term: t('stocks.info.conditions.bubble'), desc: t('stocks.info.conditions.bubble_desc'), icon: 'mdi:rocket-launch' },
        ],
    },
    {
        title: t('stocks.info.dividends.title'),
        icon: 'mdi:currency-usd',
        entries: [
            { term: t('stocks.info.dividends.yield'), desc: t('stocks.info.dividends.yield_desc'), icon: 'mdi:percent' },
            { term: t('stocks.info.dividends.payout'), desc: t('stocks.info.dividends.payout_desc'), icon: 'mdi:clock-outline' },
            { term: t('stocks.info.dividends.multiplier'), desc: t('stocks.info.dividends.multiplier_desc'), icon: 'mdi:multiplication' },
            { term: t('stocks.info.dividends.total'), desc: t('stocks.info.dividends.total_desc'), icon: 'mdi:cash-multiple' },
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
                    <AppIcon icon="mdi:chart-line" class="page-title-icon" />
                    {{ $t('stocks.title') }}
                </h1>
                <p class="page-subtitle">{{ $t('stocks.subtitle') }}</p>
            </div>
            <div class="header-actions">
                <MarketSettings />
                <Button :icon="showCharts ? 'pi pi-eye-slash' : 'pi pi-eye'"
                    :label="showCharts ? $t('stocks.hide_charts') : $t('stocks.show_charts')" severity="secondary"
                    size="small" outlined @click="showCharts = !showCharts" />
            </div>
        </div>

        <!-- Event Impact -->
        <EventImpactBanner route-name="stocks" />

        <!-- Stats Bar -->
        <MarketStats :portfolio-value="stocks.totalPortfolioValue" :unrealized-profit="stocks.unrealizedProfit"
            :realized-profit="stocks.totalRealizedProfit" :dividends-earned="stocks.totalDividendsEarned"
            :position-count="stocks.portfolio.length" type="stock" />

        <!-- Pinned / Focus Asset -->
        <section v-if="pinnedAsset" class="pinned-section">
            <div class="pinned-header">
                <div class="pinned-title">
                    <AppIcon icon="mdi:pin" class="pinned-icon" />
                    <div class="pinned-ticker">{{ pinnedAsset.id }}</div>
                    <h2>{{ pinnedAsset.name }}</h2>
                    <div class="pinned-price">{{ formatCash(pinnedAsset.currentPrice) }}</div>
                    <div class="pinned-change" :class="pinnedAsset.changePercent >= 0 ? 'positive' : 'negative'">
                        <AppIcon :icon="pinnedAsset.changePercent >= 0 ? 'mdi:arrow-up' : 'mdi:arrow-down'" />
                        {{ formatPercent(Math.abs(pinnedAsset.changePercent * 100)) }}
                    </div>
                </div>
                <button class="unpin-btn" @click="pinnedAssetId = null" :title="$t('stocks.unpin')">
                    <AppIcon icon="mdi:close" />
                </button>
            </div>

            <div class="pinned-body">
                <div class="pinned-chart">
                    <PriceChart :data="pinnedAsset.priceHistory"
                        :color="pinnedAsset.changePercent >= 0 ? 'emerald' : 'red'" :height="560"
                        :buy-price="pinnedPosition?.averageBuyPrice ?? null" />
                </div>
                <div class="pinned-controls">
                    <div class="pinned-stats">
                        <div class="pinned-kpi">
                            <span class="pinned-kpi-label">{{ $t('stocks.ath') }}</span>
                            <span class="pinned-kpi-value positive">{{ formatCash(pinnedAsset.ath) }}</span>
                        </div>
                        <div class="pinned-kpi">
                            <span class="pinned-kpi-label">{{ $t('stocks.atl') }}</span>
                            <span class="pinned-kpi-value negative">{{ formatCash(pinnedAsset.atl) }}</span>
                        </div>
                        <div class="pinned-kpi">
                            <span class="pinned-kpi-label">{{ $t('stocks.data_points') }}</span>
                            <span class="pinned-kpi-value">{{ pinnedAsset.priceHistory.length }}</span>
                        </div>
                    </div>
                    <PositionInfo v-if="pinnedPosition && pinnedPnL" :position="pinnedPosition"
                        :current-price="pinnedAsset.currentPrice" type="stock" :pnl="pinnedPnL" />
                    <TradePanel :asset-id="pinnedAsset.id" :current-price="pinnedAsset.currentPrice"
                        :available-cash="availableCash" :has-position="!!pinnedPosition"
                        :position-shares="pinnedPosition?.shares ?? 0" type="stock"
                        @buy="handleBuy(pinnedAsset?.id ?? '', $event)"
                        @sell="handleSell(pinnedAsset?.id ?? '', $event)" />
                </div>
            </div>
        </section>

        <!-- Stock Cards Grid -->
        <div class="card-grid">
            <AssetCard v-for="asset in unpinnedAssets" :key="asset.id" :asset="asset"
                :position="getPosition(asset.id) ?? null" :show-chart="showCharts" :available-cash="availableCash"
                :pinned="pinnedAssetId === asset.id" type="stock" @buy="handleBuy" @sell="handleSell"
                @pin="togglePin" />
        </div>

        <!-- Info Panel -->
        <InfoPanel :title="$t('stocks.info_title')" :description="$t('stocks.info_desc')"
            :sections="stockInfoSections" />
    </div>
</template>

<style scoped>
.header-actions {
    display: flex;
    align-items: center;
    gap: var(--t-space-4);
}

/* ─── Pinned / Focus Section ─── */
.pinned-section {
    margin-bottom: var(--t-space-6);
    background: var(--t-bg-card);
    border: 1px solid var(--t-accent);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-4);
    box-shadow: var(--t-shadow-sm);
}

.pinned-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--t-space-4);
}

.pinned-title {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.pinned-icon {
    color: var(--t-accent);
    font-size: 1.1rem;
}

.pinned-ticker {
    font-family: var(--t-font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.pinned-title h2 {
    font-size: 1.1rem;
    margin: 0;
}

.pinned-price {
    font-family: var(--t-font-mono);
    font-size: 1.2rem;
    font-weight: 700;
}

.pinned-change {
    display: flex;
    align-items: center;
    gap: 2px;
    font-family: var(--t-font-mono);
    font-size: 0.85rem;
    font-weight: 600;
}

.pinned-change.positive {
    color: var(--t-success);
}

.pinned-change.negative {
    color: var(--t-danger);
}

.unpin-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    background: transparent;
    color: var(--t-text-muted);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.unpin-btn:hover {
    background: var(--t-danger-muted);
    color: var(--t-danger);
}

.pinned-body {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

.pinned-chart {
    width: 100%;
    min-width: 0;
}

.pinned-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--t-space-4);
    align-items: start;
}

.pinned-stats {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.pinned-kpi {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
}

.pinned-kpi-label {
    color: var(--t-text-muted);
    text-transform: uppercase;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.04em;
}

.pinned-kpi-value {
    font-family: var(--t-font-mono);
    font-weight: 600;
}

.pinned-kpi-value.positive {
    color: var(--t-success);
}

.pinned-kpi-value.negative {
    color: var(--t-danger);
}
</style>
