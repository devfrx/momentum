<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCryptoStore } from '@renderer/stores/useCryptoStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import AppIcon from '@renderer/components/AppIcon.vue'
import AssetCard from '@renderer/components/market/AssetCard.vue'
import MarketStats from '@renderer/components/market/MarketStats.vue'
import MarketSettings from '@renderer/components/market/MarketSettings.vue'
import PriceChart from '@renderer/components/charts/PriceChart.vue'
import PositionInfo from '@renderer/components/market/PositionInfo.vue'
import TradePanel from '@renderer/components/market/TradePanel.vue'
import { useFormat } from '@renderer/composables/useFormat'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import { EventImpactBanner } from '@renderer/components/events'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import { useI18n } from 'vue-i18n'

const crypto = useCryptoStore()
const player = usePlayerStore()
const settings = useSettingsStore()
const { formatCash, formatPercent } = useFormat()
const { t } = useI18n()

const showCharts = ref(true)
const pinnedAssetId = computed({
    get: () => settings.pinnedCryptoId,
    set: (v) => { settings.pinnedCryptoId = v }
})

function getHolding(assetId: string) {
    const h = crypto.wallet.find((h) => h.assetId === assetId)
    if (!h) return null
    return { assetId: h.assetId, shares: h.amount, averageBuyPrice: h.averageBuyPrice, totalInvested: h.totalInvested }
}

const sortedAssets = computed(() =>
    [...crypto.assets].sort((a, b) => b.currentPrice - a.currentPrice)
)

const unpinnedAssets = computed(() =>
    sortedAssets.value.filter((a) => a.id !== pinnedAssetId.value)
)

const pinnedAsset = computed(() =>
    pinnedAssetId.value ? crypto.assets.find((a) => a.id === pinnedAssetId.value) ?? null : null
)

const pinnedPosition = computed(() =>
    pinnedAssetId.value ? getHolding(pinnedAssetId.value) : null
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
    crypto.buyCrypto(assetId, amount)
}

function handleSell(assetId: string, amount: number) {
    crypto.sellCrypto(assetId, amount)
}

const cryptoInfoSections = computed<InfoSection[]>(() => [
    {
        title: t('crypto.info.trading.title'),
        icon: 'mdi:swap-horizontal',
        entries: [
            { term: t('crypto.info.trading.buy'), desc: t('crypto.info.trading.buy_desc'), icon: 'mdi:cart-arrow-down' },
            { term: t('crypto.info.trading.sell'), desc: t('crypto.info.trading.sell_desc'), icon: 'mdi:cart-arrow-up' },
            { term: t('crypto.info.trading.xp'), desc: t('crypto.info.trading.xp_desc'), icon: 'mdi:star-circle' },
        ],
    },
    {
        title: t('crypto.info.wallet.title'),
        icon: 'mdi:wallet-outline',
        entries: [
            { term: t('crypto.info.wallet.holdings'), desc: t('crypto.info.wallet.holdings_desc'), icon: 'mdi:format-list-bulleted' },
            { term: t('crypto.info.wallet.value'), desc: t('crypto.info.wallet.value_desc'), icon: 'mdi:cash-multiple' },
            { term: t('crypto.info.wallet.profit'), desc: t('crypto.info.wallet.profit_desc'), icon: 'mdi:chart-line-variant' },
        ],
    },
    {
        title: t('crypto.info.volatility.title'),
        icon: 'mdi:alert-outline',
        entries: [
            { term: t('crypto.info.volatility.warning'), desc: t('crypto.info.volatility.warning_desc'), icon: 'mdi:flash-alert' },
            { term: t('crypto.info.volatility.no_dividends'), desc: t('crypto.info.volatility.no_dividends_desc'), icon: 'mdi:close-circle-outline' },
            { term: t('crypto.info.volatility.separate_sim'), desc: t('crypto.info.volatility.separate_sim_desc'), icon: 'mdi:chart-multiple' },
        ],
    },
    {
        title: t('crypto.info.charts.title'),
        icon: 'mdi:chart-areaspline',
        entries: [
            { term: t('crypto.info.charts.pin'), desc: t('crypto.info.charts.pin_desc'), icon: 'mdi:pin' },
            { term: t('crypto.info.charts.ath_atl'), desc: t('crypto.info.charts.ath_atl_desc'), icon: 'mdi:arrow-expand-vertical' },
            { term: t('crypto.info.charts.toggle'), desc: t('crypto.info.charts.toggle_desc'), icon: 'mdi:eye-outline' },
        ],
    },
    {
        title: t('crypto.info.multipliers.title'),
        icon: 'mdi:multiplication',
        entries: [
            { term: t('crypto.info.multipliers.crypto_returns'), desc: t('crypto.info.multipliers.crypto_returns_desc'), icon: 'mdi:trending-up' },
            { term: t('crypto.info.multipliers.prestige'), desc: t('crypto.info.multipliers.prestige_desc'), icon: 'mdi:crown' },
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
                    <AppIcon icon="mdi:bitcoin" class="page-title-icon" />
                    {{ $t('crypto.title') }}
                </h1>
                <p class="page-subtitle">{{ $t('crypto.subtitle') }}</p>
            </div>
            <div class="header-actions">
                <MarketSettings />
                <button class="btn btn-ghost btn-sm" @click="showCharts = !showCharts">
                    <i :class="showCharts ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                    {{ showCharts ? $t('crypto.hide_charts') : $t('crypto.show_charts') }}
                </button>
            </div>
        </div>

        <!-- Event Impact -->
        <EventImpactBanner route-name="crypto" />

        <!-- Volatility Warning -->
        <div class="alert-box alert-box-warning">
            <AppIcon icon="mdi:alert-circle" class="text-xl" />
            <span>{{ $t('crypto.volatility_warning') }}</span>
        </div>

        <!-- Stats Bar -->
        <MarketStats :portfolio-value="crypto.totalWalletValue" :unrealized-profit="crypto.unrealizedProfit"
            :realized-profit="crypto.totalRealizedProfit" :position-count="crypto.wallet.length" type="crypto" />

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
                <button class="unpin-btn" @click="pinnedAssetId = null" :title="$t('crypto.unpin')">
                    <AppIcon icon="mdi:close" />
                </button>
            </div>

            <div class="pinned-body">
                <div class="pinned-chart">
                    <PriceChart :data="pinnedAsset.priceHistory"
                        :color="pinnedAsset.changePercent >= 0 ? 'purple' : 'red'" :height="560"
                        :buy-price="pinnedPosition?.averageBuyPrice ?? null" />
                </div>
                <div class="pinned-controls">
                    <div class="pinned-stats">
                        <div class="pinned-kpi">
                            <span class="pinned-kpi-label">{{ $t('crypto.ath') }}</span>
                            <span class="pinned-kpi-value positive">{{ formatCash(pinnedAsset.ath) }}</span>
                        </div>
                        <div class="pinned-kpi">
                            <span class="pinned-kpi-label">{{ $t('crypto.atl') }}</span>
                            <span class="pinned-kpi-value negative">{{ formatCash(pinnedAsset.atl) }}</span>
                        </div>
                        <div class="pinned-kpi">
                            <span class="pinned-kpi-label">{{ $t('crypto.data_points') }}</span>
                            <span class="pinned-kpi-value">{{ pinnedAsset.priceHistory.length }}</span>
                        </div>
                    </div>
                    <PositionInfo v-if="pinnedPosition && pinnedPnL" :position="pinnedPosition"
                        :current-price="pinnedAsset.currentPrice" type="crypto" :pnl="pinnedPnL" />
                    <TradePanel :asset-id="pinnedAsset.id" :current-price="pinnedAsset.currentPrice"
                        :available-cash="availableCash" :has-position="!!pinnedPosition"
                        :position-shares="pinnedPosition?.shares ?? 0" type="crypto"
                        @buy="handleBuy(pinnedAsset?.id ?? '', $event)"
                        @sell="handleSell(pinnedAsset?.id ?? '', $event)" />
                </div>
            </div>
        </section>

        <!-- Crypto Cards Grid -->
        <div class="card-grid">
            <AssetCard v-for="asset in unpinnedAssets" :key="asset.id" :asset="asset" :position="getHolding(asset.id)"
                :show-chart="showCharts" :available-cash="availableCash" :pinned="pinnedAssetId === asset.id"
                type="crypto" @buy="handleBuy" @sell="handleSell" @pin="togglePin" />
        </div>

        <!-- Info Panel -->
        <InfoPanel :title="$t('crypto.info_title')" :description="$t('crypto.info_desc')"
            :sections="cryptoInfoSections" />
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
