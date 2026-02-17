<script setup lang="ts">
/**
 * PositionInfo — Shows P&L for a position in both % and $
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { useFormat } from '@renderer/composables/useFormat'

export interface PnLData {
    value: number
    percent: number
    currentValue: number
}

const props = defineProps<{
    position: {
        assetId: string
        shares: number
        averageBuyPrice: number
        totalInvested: { toNumber(): number }
    }
    currentPrice: number
    type: 'stock' | 'crypto'
    pnl: PnLData
}>()

const { formatCash, formatNumber } = useFormat()

const iconName = props.type === 'crypto' ? 'mdi:wallet' : 'mdi:briefcase'
const iconColor = props.type === 'crypto' ? 'text-purple' : 'text-sky'
</script>

<template>
    <div class="position-info">
        <div class="position-header">
            <AppIcon :icon="iconName" :class="iconColor" />
            <span class="position-qty">{{ formatNumber(position.shares) }} {{ $t(type === 'crypto' ? 'market.coins' :
                'market.shares') }}</span>
            <span class="text-muted">@</span>
            <span class="avg-price">{{ formatCash(position.averageBuyPrice) }} {{ $t('market.avg') }}</span>
        </div>
        <div class="pnl-row">
            <div class="pnl-item">
                <span class="pnl-label">{{ $t('market.value') }}</span>
                <span class="pnl-value">{{ formatCash(pnl.currentValue) }}</span>
            </div>
            <div class="pnl-item">
                <span class="pnl-label">{{ $t('market.invested') }}</span>
                <span class="pnl-value text-muted">{{ formatCash(position.totalInvested.toNumber()) }}</span>
            </div>
            <div class="pnl-item">
                <span class="pnl-label">{{ $t('market.pl') }}</span>
                <span class="pnl-value" :class="pnl.value >= 0 ? 'positive' : 'negative'">
                    {{ pnl.value >= 0 ? '+' : '' }}{{ formatCash(pnl.value) }}
                </span>
            </div>
            <div class="pnl-item">
                <span class="pnl-label">{{ $t('market.pl_pct') }}</span>
                <span class="pnl-value pnl-percent" :class="pnl.percent >= 0 ? 'positive' : 'negative'">
                    <AppIcon :icon="pnl.percent >= 0 ? 'mdi:trending-up' : 'mdi:trending-down'" class="pnl-icon" />
                    {{ pnl.percent >= 0 ? '+' : '' }}{{ pnl.percent.toFixed(2) }}%
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.position-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
}

.position-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
}

.position-qty {
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.avg-price {
    font-family: var(--t-font-mono);
    font-size: 0.8rem;
}

.pnl-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
}

.pnl-item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.pnl-label {
    font-size: 0.65rem;
    font-weight: var(--t-font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
}

.pnl-value {
    font-family: var(--t-font-mono);
    font-size: 0.8rem;
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.pnl-value.positive {
    color: var(--t-success);
}

.pnl-value.negative {
    color: var(--t-danger);
}

.pnl-percent {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.pnl-icon {
    font-size: 0.9rem;
}

.text-purple {
    color: var(--t-text-secondary);
}

.text-sky {
    color: var(--t-info);
}

.text-muted {
    color: var(--t-text-muted);
}
</style>
