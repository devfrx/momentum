<script setup lang="ts">
/**
 * AssetCard — Reusable card for stocks & crypto assets
 * Shows price, chart, position info, and trade controls
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UTooltip, UButton } from '@renderer/components/ui'
import { useFormat } from '@renderer/composables/useFormat'
import MiniChart from '@renderer/components/charts/MiniChart.vue'
import PriceChart from '@renderer/components/charts/PriceChart.vue'
import TradePanel from './TradePanel.vue'
import PositionInfo from './PositionInfo.vue'

export interface AssetData {
    id: string
    name: string
    currentPrice: number
    previousPrice: number
    priceHistory: number[]
    changePercent: number
    ath: number
    atl: number
}

export interface PositionData {
    assetId: string
    shares: number       // shares or amount
    averageBuyPrice: number
    totalInvested: { toNumber(): number }
}

const props = defineProps<{
    asset: AssetData
    position?: PositionData | null
    /** 'stock' or 'crypto' */
    type: 'stock' | 'crypto'
    showChart: boolean
    /** Player's available cash as number */
    availableCash: number
    /** Whether this asset is currently pinned */
    pinned?: boolean
}>()

const emit = defineEmits<{
    (e: 'buy', assetId: string, amount: number): void
    (e: 'sell', assetId: string, amount: number): void
    (e: 'pin', assetId: string): void
}>()

const { formatCash, formatPercent } = useFormat()

const expanded = ref(false)

const accentColor = computed(() => {
    if (props.type === 'crypto') return props.asset.changePercent >= 0 ? 'purple' : 'red'
    return props.asset.changePercent >= 0 ? 'emerald' : 'red'
})

const symbolClass = computed(() => props.type === 'crypto' ? 'crypto-symbol' : 'stock-symbol')

const positionPnL = computed(() => {
    if (!props.position) return null
    const currentValue = props.asset.currentPrice * props.position.shares
    const invested = props.position.totalInvested.toNumber()
    const pnlValue = currentValue - invested
    const pnlPercent = invested > 0 ? (pnlValue / invested) * 100 : 0
    return { value: pnlValue, percent: pnlPercent, currentValue }
})

function handleBuy(amount: number) {
    emit('buy', props.asset.id, amount)
}

function handleSell(amount: number) {
    emit('sell', props.asset.id, amount)
}
</script>

<template>
    <div class="asset-card item-card" :class="{ 'has-position': !!position, 'is-pinned': pinned }">
        <!-- Header -->
        <div class="item-card-header">
            <div class="item-card-title">
                <div :class="symbolClass">{{ asset.id }}</div>
                <h3 class="item-card-name">{{ asset.name }}</h3>
            </div>
            <div class="header-right">
                <UButton variant="text" :active="pinned" @click="emit('pin', asset.id)"
                    :title="pinned ? $t('market.unpin') : $t('market.pin_to_focus')" :icon="pinned ? 'mdi:pin' : 'mdi:pin-outline'">
                </UButton>
                <div class="price-display">
                    <div class="current-price">{{ formatCash(asset.currentPrice) }}</div>
                    <div class="change-indicator" :class="asset.changePercent >= 0 ? 'up' : 'down'">
                        <AppIcon :icon="asset.changePercent >= 0 ? 'mdi:arrow-up' : 'mdi:arrow-down'" />
                        {{ formatPercent(Math.abs(asset.changePercent * 100)) }}
                    </div>
                </div>
            </div>
        </div>

        <!-- ATH / ATL mini stats -->
        <div class="ath-atl-row">
            <UTooltip :text="$t('market.ath')" placement="bottom">
                <span class="mini-stat">
                    <span class="mini-stat-label">{{ $t('market.ath') }}</span>
                    <span class="mini-stat-value positive">{{ formatCash(asset.ath) }}</span>
                </span>
            </UTooltip>
            <UTooltip :text="$t('market.atl')" placement="bottom">
                <span class="mini-stat">
                    <span class="mini-stat-label">{{ $t('market.atl') }}</span>
                    <span class="mini-stat-value negative">{{ formatCash(asset.atl) }}</span>
                </span>
            </UTooltip>
        </div>

        <!-- Price Chart (mini sparkline) -->
        <MiniChart v-if="showChart && asset.priceHistory?.length > 1 && !expanded" :data="asset.priceHistory"
            :color="accentColor" :height="60" :buy-price="position?.averageBuyPrice ?? null" />

        <!-- Expand to full chart -->
        <UButton variant="text" v-if="showChart && asset.priceHistory?.length > 1"
            @click="expanded = !expanded" :icon="expanded ? 'mdi:chevron-up' : 'mdi:chart-areaspline'">
            {{ expanded ? $t('market.collapse_chart') : $t('market.expand_chart') }}
        </UButton>

        <!-- Expanded Interactive Chart -->
        <PriceChart v-if="expanded && asset.priceHistory?.length > 1" :data="asset.priceHistory" :color="accentColor"
            :height="220" :buy-price="position?.averageBuyPrice ?? null" />

        <!-- Position Info -->
        <PositionInfo v-if="position && positionPnL" :position="position" :current-price="asset.currentPrice"
            :type="type" :pnl="positionPnL" />

        <!-- Trade Panel -->
        <TradePanel :asset-id="asset.id" :current-price="asset.currentPrice" :available-cash="availableCash"
            :has-position="!!position" :position-shares="position?.shares ?? 0" :type="type" @buy="handleBuy"
            @sell="handleSell" />
    </div>
</template>

<style scoped>
.asset-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.asset-card.has-position {
    border-color: var(--t-border-focus);
}

.asset-card.is-pinned {
    box-shadow: 0 0 0 1px var(--t-accent);
}

.header-right {
    display: flex;
    align-items: flex-start;
    gap: var(--t-space-2);
}

.stock-symbol {
    font-family: var(--t-font-mono);
    font-size: 0.75rem;
    font-weight: var(--t-font-bold);
    padding: 0.25rem 0.5rem;
    background: var(--t-bg-muted);
    color: var(--t-text);
    border-radius: var(--t-radius-sm);
}

.crypto-symbol {
    font-family: var(--t-font-mono);
    font-size: 0.75rem;
    font-weight: var(--t-font-bold);
    padding: 0.25rem 0.5rem;
    background: var(--t-bg-muted);
    color: var(--t-text);
    border-radius: var(--t-radius-sm);
}

.price-display {
    text-align: right;
}

.current-price {
    font-family: var(--t-font-mono);
    font-size: 1.25rem;
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.ath-atl-row {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
}

.mini-stat {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
}

.mini-stat-label {
    color: var(--t-text-muted);
    font-weight: var(--t-font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.mini-stat-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
}

.mini-stat-value.positive {
    color: var(--t-success);
}

.mini-stat-value.negative {
    color: var(--t-danger);
}

</style>
