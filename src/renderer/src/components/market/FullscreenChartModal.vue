<script setup lang="ts">
/**
 * FullscreenChartModal — Professional trading terminal for a single asset.
 *
 * Two-column layout: chart (main) + sidebar (stats, position, trade).
 * Reuses UModal (size="full"), CandlestickChart / PriceChart, PositionInfo, TradePanel.
 * Delegates buy/sell actions to the parent view via emits.
 */
import { computed, ref, watch } from 'vue'
import { UModal } from '@renderer/components/ui'
import AppIcon from '@renderer/components/AppIcon.vue'
import CandlestickChart from '@renderer/components/charts/CandlestickChart.vue'
import PriceChart from '@renderer/components/charts/PriceChart.vue'
import PositionInfo from './PositionInfo.vue'
import TradePanel from './TradePanel.vue'
import TradingGuide from './TradingGuide.vue'
import { useFormat } from '@renderer/composables/useFormat'
import type { AssetData, PositionData } from './AssetCard.vue'

const props = defineProps<{
    /** Two-way visibility */
    modelValue: boolean
    /** Asset to display */
    asset: AssetData | null
    /** Player position for this asset (null = no position) */
    position: PositionData | null
    /** Market type */
    type: 'stock' | 'crypto'
    /** Available cash for trading */
    availableCash: number
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'buy', assetId: string, amount: number): void
    (e: 'sell', assetId: string, amount: number): void
}>()

const { formatCash, formatPercent } = useFormat()

/** Local chart mode toggle inside the modal */
const chartMode = ref<'line' | 'candle'>('candle')

/** Reset chart mode each time modal opens */
watch(() => props.modelValue, (open) => {
    if (open) chartMode.value = 'candle'
})

const accentColor = computed(() => {
    if (!props.asset) return 'emerald'
    if (props.type === 'crypto') return props.asset.changePercent >= 0 ? 'purple' : 'red'
    return props.asset.changePercent >= 0 ? 'emerald' : 'red'
})

const isPositive = computed(() => (props.asset?.changePercent ?? 0) >= 0)

const pnl = computed(() => {
    if (!props.position || !props.asset) return null
    const currentValue = props.asset.currentPrice * props.position.shares
    const invested = props.position.totalInvested.toNumber()
    const pnlValue = currentValue - invested
    const pnlPercent = invested > 0 ? (pnlValue / invested) * 100 : 0
    return { value: pnlValue, percent: pnlPercent, currentValue }
})

/** Distance from ATH / ATL as percentage */
const athDistance = computed(() => {
    if (!props.asset || props.asset.ath <= 0) return 0
    return ((props.asset.ath - props.asset.currentPrice) / props.asset.ath) * 100
})

const atlDistance = computed(() => {
    if (!props.asset || props.asset.atl <= 0) return 0
    return ((props.asset.currentPrice - props.asset.atl) / props.asset.atl) * 100
})

function handleBuy(amount: number) {
    if (props.asset) emit('buy', props.asset.id, amount)
}

function handleSell(amount: number) {
    if (props.asset) emit('sell', props.asset.id, amount)
}
</script>

<template>
    <UModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" size="full"
        :closable="true" :dismissable="true">
        <!-- ─── Ticker Header ─── -->
        <template #header>
            <div class="fs-header" v-if="asset">
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
                        <button class="toggle-btn" :class="{ active: chartMode === 'candle' }"
                            @click="chartMode = 'candle'" :title="$t('charts.candle')">
                            <AppIcon icon="mdi:chart-box" />
                        </button>
                        <button class="toggle-btn" :class="{ active: chartMode === 'line' }" @click="chartMode = 'line'"
                            :title="$t('charts.line')">
                            <AppIcon icon="mdi:chart-areaspline" />
                        </button>
                    </div>
                </div>
            </div>
        </template>

        <!-- ─── Two-column body ─── -->
        <div class="fs-body" v-if="asset">
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
    </UModal>
</template>

<style scoped>
/* ─── Header ─── */
.fs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: var(--t-space-4);
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
</style>
