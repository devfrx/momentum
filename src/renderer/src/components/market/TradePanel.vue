<script setup lang="ts">
/**
 * TradePanel — Buy/sell controls with quantity input and % of cash buying
 */
import { ref, computed } from 'vue'
import { UButton } from '@renderer/components/ui'
import InputNumber from 'primevue/inputnumber'
import { smartDecimals } from '@renderer/composables/useFormat'

const props = defineProps<{
    assetId: string
    currentPrice: number
    availableCash: number
    hasPosition: boolean
    positionShares: number
    type: 'stock' | 'crypto'
}>()

const emit = defineEmits<{
    (e: 'buy', amount: number): void
    (e: 'sell', amount: number): void
}>()

const quantity = ref<number>(1)
const mode = ref<'qty' | 'pct'>('qty')
const percentValue = ref<number>(10)

const percentPresets = [10, 25, 50, 100]

const costEstimate = computed(() => {
    if (mode.value === 'qty') {
        return props.currentPrice * (quantity.value || 1)
    }
    // pct mode: calculate from total cash
    return props.availableCash * (percentValue.value / 100)
})

const qtyFromPercent = computed(() => {
    if (props.currentPrice <= 0) return 0
    const cash = props.availableCash * (percentValue.value / 100)
    return Math.floor(cash / props.currentPrice)
})

const effectiveQty = computed(() => {
    if (mode.value === 'qty') return quantity.value || 1
    return qtyFromPercent.value
})

const canAffordAny = computed(() => props.availableCash >= props.currentPrice)

function handleBuy() {
    if (effectiveQty.value > 0) {
        emit('buy', effectiveQty.value)
    }
}

function handleSell() {
    if (effectiveQty.value > 0) {
        emit('sell', effectiveQty.value)
    }
}

function sellAll() {
    if (props.positionShares > 0) {
        emit('sell', props.positionShares)
    }
}

function formatCost(v: number): string {
    const dec = smartDecimals(v, 2)
    return '$' + v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
</script>

<template>
    <div class="trade-panel">
        <!-- Mode toggle -->
        <div class="mode-toggle">
            <UButton variant="ghost" size="sm" :active="mode === 'qty'" @click="mode = 'qty'" icon="mdi:numeric">
                {{ $t('market.qty') }}
            </UButton>
            <UButton variant="ghost" size="sm" :active="mode === 'pct'" @click="mode = 'pct'" icon="mdi:percent">
                {{ $t('market.pct_cash') }}
            </UButton>
        </div>

        <!-- Quantity mode -->
        <div v-if="mode === 'qty'" class="trade-row">
            <InputNumber v-model="quantity" :min="1" :max="999999" size="small" class="qty-input" placeholder="1" />
            <UButton variant="primary" size="sm" icon="mdi:plus" :disabled="!canAffordAny" @click="handleBuy">
                {{ $t('market.buy') }}
            </UButton>
            <UButton variant="danger" size="sm" icon="mdi:minus" :disabled="!hasPosition" @click="handleSell">
                {{ $t('market.sell') }}
            </UButton>
        </div>

        <!-- Percent mode -->
        <div v-else class="trade-row-pct">
            <div class="pct-presets">
                <UButton variant="ghost" size="xs" v-for="pct in percentPresets" :key="pct" :active="percentValue === pct"
                    @click="percentValue = pct">
                    {{ pct }}%
                </UButton>
            </div>
            <div class="pct-info">
                <span class="pct-detail">≈ {{ qtyFromPercent }} {{ $t(type === 'crypto' ? 'market.coins' :
                    'market.shares') }}</span>
                <span class="pct-cost">{{ formatCost(costEstimate) }}</span>
            </div>
            <div class="pct-actions">
                <UButton variant="primary" size="sm" icon="mdi:plus" :disabled="qtyFromPercent <= 0" @click="handleBuy">
                    {{ $t('market.buy_pct', { pct: percentValue }) }}
                </UButton>
                <UButton v-if="hasPosition" variant="danger" size="sm" icon="mdi:minus" @click="sellAll">
                    {{ $t('market.sell_all') }}
                </UButton>
            </div>
        </div>

        <!-- Cost estimate -->
        <div v-if="mode === 'qty'" class="cost-estimate">
            <span class="cost-label">{{ $t('market.est_cost') }}</span>
            <span class="cost-value">{{ formatCost(costEstimate) }}</span>
        </div>
    </div>
</template>

<style scoped>
.trade-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.mode-toggle {
    display: flex;
    gap: 0;
    border-radius: var(--t-radius-sm);
    overflow: hidden;
    border: 1px solid var(--t-border);
}

.trade-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.trade-row-pct {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.pct-presets {
    display: flex;
    gap: 0.25rem;
}

.pct-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
}

.pct-detail {
    color: var(--t-text-secondary);
}

.pct-cost {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.pct-actions {
    display: flex;
    gap: var(--t-space-2);
}

.qty-input {
    width: 90px;
}

.qty-input :deep(.p-inputnumber-input) {
    width: 100%;
}

.cost-estimate {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.72rem;
    padding: 0.25rem 0.5rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.cost-label {
    color: var(--t-text-muted);
}

.cost-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
}
</style>
