<script setup lang="ts">
/**
 * MarketStats — Summary stats bar for stock/crypto views
 */
import { computed } from 'vue'
import { useFormat } from '@renderer/composables/useFormat'
import Decimal from 'break_infinity.js'

const props = defineProps<{
    portfolioValue: Decimal
    unrealizedProfit: Decimal
    positionCount: number
    realizedProfit?: Decimal
    /** 'stock' or 'crypto' — for theming */
    type: 'stock' | 'crypto'
}>()

const { formatCash } = useFormat()

const valueColorClass = computed(() => props.type === 'crypto' ? 'text-purple' : 'text-emerald')
</script>

<template>
    <div class="stats-bar">
        <div class="stat-chip">
            <span class="stat-chip-label">{{ $t(type === 'crypto' ? 'market.wallet_value' : 'market.portfolio_value')
                }}</span>
            <span class="stat-chip-value" :class="valueColorClass">{{ formatCash(portfolioValue) }}</span>
        </div>
        <div class="stat-chip">
            <span class="stat-chip-label">{{ $t('market.unrealized_pl') }}</span>
            <span class="stat-chip-value" :class="unrealizedProfit.gte(0) ? 'positive' : 'negative'">
                {{ formatCash(unrealizedProfit) }}
            </span>
        </div>
        <div class="stat-chip" v-if="realizedProfit">
            <span class="stat-chip-label">{{ $t('market.realized_pl') }}</span>
            <span class="stat-chip-value" :class="realizedProfit.gte(0) ? 'positive' : 'negative'">
                {{ formatCash(realizedProfit) }}
            </span>
        </div>
        <div class="stat-chip">
            <span class="stat-chip-label">{{ $t(type === 'crypto' ? 'market.holdings' : 'market.positions') }}</span>
            <span class="stat-chip-value text-sky">{{ positionCount }}</span>
        </div>
    </div>
</template>

<style scoped>
.text-purple {
    color: var(--t-text-secondary);
}

.text-emerald {
    color: var(--t-success);
}

.text-sky {
    color: var(--t-info);
}
</style>
