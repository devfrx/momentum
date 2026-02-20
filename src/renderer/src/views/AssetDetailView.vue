<script setup lang="ts">
/**
 * AssetDetailView — Full-page trading terminal for a single stock or crypto asset.
 *
 * Replaces the old FullscreenChartModal. Two-column layout: chart (main) + sidebar (stats, position, trade).
 * Delegates buy/sell actions to the appropriate store.
 * Reached via /stocks/:assetId or /crypto/:assetId.
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStockStore } from '@renderer/stores/useStockStore'
import { useCryptoStore } from '@renderer/stores/useCryptoStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useLimitOrderStore } from '@renderer/stores/useLimitOrderStore'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import CandlestickChart from '@renderer/components/charts/CandlestickChart.vue'
import PriceChart from '@renderer/components/charts/PriceChart.vue'
import PositionInfo from '@renderer/components/market/PositionInfo.vue'
import TradePanel from '@renderer/components/market/TradePanel.vue'
import TradingGuide from '@renderer/components/market/TradingGuide.vue'
import { useFormat } from '@renderer/composables/useFormat'

const route = useRoute()
const router = useRouter()
const stocks = useStockStore()
const crypto = useCryptoStore()
const player = usePlayerStore()
const limitOrderStore = useLimitOrderStore()
const { formatCash, formatPercent } = useFormat()

/** Determine type from route meta */
const type = computed<'stock' | 'crypto'>(() => route.meta.assetType as 'stock' | 'crypto')

/** Asset ID from route param */
const assetId = computed(() => route.params.assetId as string)

/** Resolve asset from the appropriate store */
const asset = computed(() => {
    if (!assetId.value) return null
    if (type.value === 'stock') {
        return stocks.assets.find((a) => a.id === assetId.value) ?? null
    }
    return crypto.assets.find((a) => a.id === assetId.value) ?? null
})

/** Resolve position/holding from the appropriate store */
const position = computed(() => {
    if (!assetId.value) return null
    if (type.value === 'stock') {
        return stocks.portfolio.find((p) => p.assetId === assetId.value) ?? null
    }
    const h = crypto.wallet.find((h) => h.assetId === assetId.value)
    if (!h) return null
    return { assetId: h.assetId, shares: h.amount, averageBuyPrice: h.averageBuyPrice, totalInvested: h.totalInvested }
})

const availableCash = computed(() => player.cash.toNumber() - limitOrderStore.totalReservedCash.toNumber())

/** Local chart mode toggle */
const chartMode = ref<'line' | 'candle'>('candle')

const accentColor = computed(() => {
    if (!asset.value) return 'emerald'
    if (type.value === 'crypto') return asset.value.changePercent >= 0 ? 'purple' : 'red'
    return asset.value.changePercent >= 0 ? 'emerald' : 'red'
})

const isPositive = computed(() => (asset.value?.changePercent ?? 0) >= 0)

const pnl = computed(() => {
    if (!position.value || !asset.value) return null
    const currentValue = asset.value.currentPrice * position.value.shares
    const invested = position.value.totalInvested.toNumber()
    const pnlValue = currentValue - invested
    const pnlPercent = invested > 0 ? (pnlValue / invested) * 100 : 0
    return { value: pnlValue, percent: pnlPercent, currentValue }
})

/** Distance from ATH / ATL as percentage */
const athDistance = computed(() => {
    if (!asset.value || asset.value.ath <= 0) return 0
    return ((asset.value.ath - asset.value.currentPrice) / asset.value.ath) * 100
})

const atlDistance = computed(() => {
    if (!asset.value || asset.value.atl <= 0) return 0
    return ((asset.value.currentPrice - asset.value.atl) / asset.value.atl) * 100
})

function handleBuy(amount: number) {
    if (!asset.value) return
    if (type.value === 'stock') {
        stocks.buyShares(asset.value.id, amount)
    } else {
        crypto.buyCrypto(asset.value.id, amount)
    }
}

function handleSell(amount: number) {
    if (!asset.value) return
    if (type.value === 'stock') {
        stocks.sellShares(asset.value.id, amount)
    } else {
        crypto.sellCrypto(asset.value.id, amount)
    }
}

function goBack() {
    router.push({ name: type.value === 'stock' ? 'stocks' : 'crypto' })
}
</script>

<template>
    <div class="asset-detail-page" v-if="asset">
        <!-- ─── Ticker Header ─── -->
        <div class="fs-header">
            <!-- Back button -->
            <UButton variant="icon" size="xl" icon="mdi:arrow-left" @click="goBack" class="back-btn" />

            <!-- Left: Symbol + Name -->
            <div class="fs-ticker">
                <div class="fs-badge" :class="type">
                    <AppIcon :icon="type === 'crypto' ? 'mdi:currency-btc' : 'mdi:chart-line'" />
                    <span>{{ asset.id }}</span>
                </div>
                <div class="fs-identity">
                    <h2 class="fs-name">{{ asset.name }}</h2>
                    <span class="fs-type-label">{{ $t(type === 'crypto' ? 'market.cryptocurrency' : 'market.stock')
                    }}</span>
                </div>
            </div>

            <!-- Center: Price block -->
            <div class="fs-price-block">
                <span class="fs-price">{{ formatCash(asset.currentPrice) }}</span>
                <span class="fs-change-pill" :class="isPositive ? 'up' : 'down'">
                    <AppIcon :icon="isPositive ? 'mdi:triangle-small-up' : 'mdi:triangle-small-down'" />
                    {{ formatPercent(Math.abs(asset.changePercent * 100)) }}
                </span>
            </div>

            <!-- Right: Chart mode toggle -->
            <div class="fs-header-actions">
                <div class="fs-chart-toggle">
                    <button class="toggle-btn" :class="{ active: chartMode === 'candle' }" @click="chartMode = 'candle'"
                        :title="$t('charts.candle')">
                        <AppIcon icon="mdi:chart-box" />
                    </button>
                    <button class="toggle-btn" :class="{ active: chartMode === 'line' }" @click="chartMode = 'line'"
                        :title="$t('charts.line')">
                        <AppIcon icon="mdi:chart-areaspline" />
                    </button>
                </div>
            </div>
        </div>

        <!-- ─── Two-column body ─── -->
        <div class="fs-body">
            <!-- Main: Chart -->
            <div class="fs-main">
                <div class="fs-chart">
                    <CandlestickChart v-if="chartMode === 'candle' && (asset.candlestickHistory?.length ?? 0) > 1"
                        :data="asset.candlestickHistory ?? []" :asset-id="asset.id" :color="accentColor" :fill="true"
                        :buy-price="position?.averageBuyPrice ?? null" :label="asset.name" />
                    <PriceChart v-else-if="asset.priceHistory?.length > 1" :data="asset.priceHistory"
                        :color="accentColor" :fill="true" :buy-price="position?.averageBuyPrice ?? null"
                        :label="asset.name" />
                    <div v-else class="fs-no-data">
                        <AppIcon icon="mdi:chart-line-variant" />
                        <span>{{ $t('charts.no_candles') }}</span>
                    </div>
                </div>

                <!-- Inline stats bar under chart -->
                <div class="fs-inline-stats">
                    <div class="fs-stat-item">
                        <span class="fs-stat-label">{{ $t('market.ath') }}</span>
                        <span class="fs-stat-value positive">{{ formatCash(asset.ath) }}</span>
                        <span class="fs-stat-sub negative">-{{ athDistance.toFixed(1) }}%</span>
                    </div>
                    <div class="fs-stat-divider" />
                    <div class="fs-stat-item">
                        <span class="fs-stat-label">{{ $t('market.atl') }}</span>
                        <span class="fs-stat-value negative">{{ formatCash(asset.atl) }}</span>
                        <span class="fs-stat-sub positive">+{{ atlDistance.toFixed(1) }}%</span>
                    </div>
                    <div class="fs-stat-divider" />
                    <div class="fs-stat-item">
                        <span class="fs-stat-label">{{ $t('market.data_points') }}</span>
                        <span class="fs-stat-value">{{ asset.priceHistory?.length ?? 0 }}</span>
                    </div>
                    <div class="fs-stat-divider" />
                    <div class="fs-stat-item">
                        <span class="fs-stat-label">{{ $t('market.prev_close') }}</span>
                        <span class="fs-stat-value">{{ formatCash(asset.previousPrice) }}</span>
                    </div>
                </div>

                <!-- Trading Guide (collapsible, below chart) -->
                <TradingGuide :type="type" />
            </div>

            <!-- Sidebar: Position + Trade -->
            <aside class="fs-sidebar">
                <!-- Position card -->
                <div class="fs-sidebar-section" v-if="position && pnl">
                    <div class="fs-section-title">
                        <AppIcon :icon="type === 'crypto' ? 'mdi:wallet' : 'mdi:briefcase'" />
                        <span>{{ $t(type === 'crypto' ? 'market.your_holdings' : 'market.your_position') }}</span>
                    </div>
                    <PositionInfo :position="position" :current-price="asset.currentPrice" :type="type" :pnl="pnl" />
                </div>

                <!-- No position hint -->
                <div class="fs-empty-position" v-else>
                    <div class="fs-empty-icon-wrap">
                        <AppIcon :icon="type === 'crypto' ? 'mdi:wallet-outline' : 'mdi:briefcase-outline'" />
                    </div>
                    <span class="fs-empty-text">{{ $t(type === 'crypto' ? 'market.no_holdings' : 'market.no_position')
                    }}</span>
                    <span class="fs-empty-hint">{{ $t('market.no_position_hint') }}</span>
                </div>

                <!-- Trade card -->
                <div class="fs-sidebar-section">
                    <div class="fs-section-title">
                        <AppIcon icon="mdi:swap-horizontal" />
                        <span>{{ $t('market.trade') }}</span>
                    </div>
                    <TradePanel :asset-id="asset.id" :current-price="asset.currentPrice" :available-cash="availableCash"
                        :has-position="!!position" :position-shares="position?.shares ?? 0" :type="type"
                        @buy="handleBuy" @sell="handleSell" />
                </div>

                <!-- Available balance -->
                <div class="fs-balance">
                    <div class="fs-balance-icon">
                        <AppIcon icon="mdi:wallet" />
                    </div>
                    <div class="fs-balance-info">
                        <span class="fs-balance-label">{{ $t('market.available') }}</span>
                        <span class="fs-balance-value">{{ formatCash(availableCash) }}</span>
                    </div>
                </div>
            </aside>
        </div>
    </div>

    <!-- Asset not found fallback -->
    <div v-else class="asset-not-found">
        <AppIcon icon="mdi:alert-circle-outline" class="not-found-icon" />
        <p>{{ $t('market.asset_not_found') ?? 'Asset not found' }}</p>
        <UButton variant="primary" icon="mdi:arrow-left" @click="goBack">
            {{ $t('common.go_back') ?? 'Go back' }}
        </UButton>
    </div>
</template>

<style scoped>
.asset-detail-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    gap: var(--t-space-4);
    padding: var(--t-space-4) var(--t-space-6);
}

/* ─── Header ─── */
.fs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: var(--t-space-4);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border-radius: var(--t-radius-lg);
    border: 1px solid var(--t-border);
    flex-shrink: 0;
}

.back-btn {
    flex-shrink: 0;
}

/* Ticker group */
.fs-ticker {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    min-width: 0;
}

.fs-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-1);
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    padding: 0.3rem 0.6rem;
    border-radius: var(--t-radius-sm);
    letter-spacing: 0.03em;
    white-space: nowrap;
}

.fs-badge.crypto {
    background: var(--t-purple-muted);
    color: var(--t-purple);
}

.fs-badge.stock {
    background: var(--t-accent-muted);
    color: var(--t-accent);
}

.fs-identity {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
}

.fs-name {
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-semibold);
    margin: 0;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.fs-type-label {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

/* Price block */
.fs-price-block {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.fs-price {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-2xl);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    letter-spacing: -0.02em;
    line-height: 1;
}

.fs-change-pill {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    padding: 0.2rem 0.45rem;
    border-radius: var(--t-radius-full);
    line-height: 1;
}

.fs-change-pill.up {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.fs-change-pill.down {
    background: var(--t-danger-muted);
    color: var(--t-danger);
}

/* Header actions */
.fs-header-actions {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.fs-chart-toggle {
    display: flex;
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    overflow: hidden;
}

.toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-1-5) var(--t-space-2);
    background: transparent;
    border: none;
    color: var(--t-text-muted);
    cursor: pointer;
    font-size: 1rem;
    transition: all var(--t-transition-fast);
}

.toggle-btn:hover {
    color: var(--t-text-secondary);
    background: var(--t-bg-muted);
}

.toggle-btn.active {
    color: var(--t-text);
    background: var(--t-bg-muted);
}

/* ─── Body: two-column layout ─── */
.fs-body {
    display: flex;
    gap: var(--t-space-4);
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

/* Main area (chart) */
.fs-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--t-border) transparent;
}

.fs-main::-webkit-scrollbar {
    width: 4px;
}

.fs-main::-webkit-scrollbar-track {
    background: transparent;
}

.fs-main::-webkit-scrollbar-thumb {
    background: var(--t-border);
    border-radius: var(--t-radius-full);
}

.fs-main::-webkit-scrollbar-thumb:hover {
    background: var(--t-border-hover);
}

.fs-chart {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
    border-radius: var(--t-radius-md);
    overflow: hidden;
}

.fs-no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-3);
    flex: 1;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-lg);
}

/* Inline stats bar under chart */
.fs-inline-stats {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    flex-shrink: 0;
}

.fs-stat-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-1-5);
}

.fs-stat-label {
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.fs-stat-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.fs-stat-value.positive {
    color: var(--t-success);
}

.fs-stat-value.negative {
    color: var(--t-danger);
}

.fs-stat-sub {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
}

.fs-stat-sub.positive {
    color: var(--t-success);
}

.fs-stat-sub.negative {
    color: var(--t-danger);
}

.fs-stat-divider {
    width: 1px;
    height: 16px;
    background: var(--t-border);
    flex-shrink: 0;
}

/* ─── Sidebar ─── */
.fs-sidebar {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    overflow-y: auto;
    border-left: 1px solid var(--t-border);
    padding-left: var(--t-space-4);
    scrollbar-width: thin;
    scrollbar-color: var(--t-border) transparent;
}

.fs-sidebar::-webkit-scrollbar {
    width: 4px;
}

.fs-sidebar::-webkit-scrollbar-track {
    background: transparent;
}

.fs-sidebar::-webkit-scrollbar-thumb {
    background: var(--t-border);
    border-radius: var(--t-radius-full);
}

.fs-sidebar::-webkit-scrollbar-thumb:hover {
    background: var(--t-border-hover);
}

.fs-sidebar-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.fs-section-title {
    display: flex;
    align-items: center;
    gap: var(--t-space-1-5);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: var(--t-space-1);
    border-bottom: 1px solid var(--t-border);
}

/* Empty position hint */
.fs-empty-position {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-1-5);
    padding: var(--t-space-4) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px dashed var(--t-border);
    text-align: center;
}

.fs-empty-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--t-radius-full);
    background: var(--t-bg-elevated);
    color: var(--t-text-muted);
    font-size: 1.15rem;
    margin-bottom: var(--t-space-1);
}

.fs-empty-text {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
}

.fs-empty-hint {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    line-height: 1.4;
}

/* Available balance bar */
.fs-balance {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    background: var(--t-bg-elevated);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

.fs-balance-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--t-radius-sm);
    background: var(--t-success-muted);
    color: var(--t-success);
    font-size: 1rem;
    flex-shrink: 0;
}

.fs-balance-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
}

.fs-balance-label {
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    font-weight: var(--t-font-semibold);
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
}

.fs-balance-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

/* ─── Not Found ─── */
.asset-not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-4);
    padding: var(--t-space-8);
    color: var(--t-text-muted);
    text-align: center;
}

.not-found-icon {
    font-size: 3rem;
    opacity: 0.5;
}
</style>
