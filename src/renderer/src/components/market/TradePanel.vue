<script setup lang="ts">
/**
 * TradePanel — Buy/sell controls with quantity input, % of cash, and limit orders
 */
import { ref, computed } from 'vue'
import { UButton } from '@renderer/components/ui'
import { UTooltip } from '@renderer/components/ui'
import InputNumber from 'primevue/inputnumber'
import { smartDecimals } from '@renderer/composables/useFormat'
import { useLimitOrderStore } from '@renderer/stores/useLimitOrderStore'
import { EXPIRATION_PRESETS, type OrderType } from '@renderer/core/LimitOrderEngine'
import { gameEngine } from '@renderer/core/GameEngine'

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

const limitOrders = useLimitOrderStore()

const quantity = ref<number>(1)
const mode = ref<'qty' | 'pct' | 'limit'>('qty')
const percentValue = ref<number>(10)

// ─── Limit order state ──────────────────────────────────────────
const limitOrderType = ref<OrderType>('limit_buy')
const limitTargetPrice = ref<number | null>(null)
const limitQty = ref<number>(1)
const limitExpireIdx = ref<number>(0) // Index into EXPIRATION_PRESETS

const percentPresets = [10, 25, 50, 100]

const orderTypeOptions: { value: OrderType; icon: string; labelKey: string; tipKey: string }[] = [
    { value: 'limit_buy', icon: 'mdi:cart-arrow-down', labelKey: 'orders.type_limit_buy', tipKey: 'orders.tip_limit_buy' },
    { value: 'limit_sell', icon: 'mdi:cart-arrow-up', labelKey: 'orders.type_limit_sell', tipKey: 'orders.tip_limit_sell' },
    { value: 'stop_loss', icon: 'mdi:shield-alert', labelKey: 'orders.type_stop_loss', tipKey: 'orders.tip_stop_loss' },
    { value: 'take_profit', icon: 'mdi:target', labelKey: 'orders.type_take_profit', tipKey: 'orders.tip_take_profit' }
]

const costEstimate = computed(() => {
    if (mode.value === 'qty') {
        return props.currentPrice * (quantity.value || 1)
    }
    if (mode.value === 'limit') {
        return (limitTargetPrice.value ?? props.currentPrice) * (limitQty.value || 1)
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
    if (mode.value === 'limit') return limitQty.value || 1
    return qtyFromPercent.value
})

const canAffordAny = computed(() => props.availableCash >= props.currentPrice)

/** Whether the limit order is a buy type */
const isLimitBuy = computed(() => limitOrderType.value === 'limit_buy')

/** Whether sell order types are available (need a position) */
const canPlaceSellOrder = computed(() =>
    props.hasPosition && props.positionShares >= (limitQty.value || 1)
)

/** Whether the limit order can be placed */
const canPlaceLimit = computed(() => {
    const price = limitTargetPrice.value
    const qty = limitQty.value
    if (!price || price <= 0 || !qty || qty <= 0) return false

    if (isLimitBuy.value) {
        // Need enough cash for the order
        return props.availableCash >= price * qty
    }
    // Sell orders need position
    return canPlaceSellOrder.value
})

/** Active orders for this asset */
const assetOrders = computed(() => limitOrders.getOrdersForAsset(props.assetId))

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

function handlePlaceLimitOrder() {
    if (!canPlaceLimit.value) return

    const expPreset = EXPIRATION_PRESETS[limitExpireIdx.value]
    const expiresAt = expPreset.ticks > 0 ? gameEngine.currentTick + expPreset.ticks : 0

    const order = limitOrders.placeOrder({
        assetId: props.assetId,
        marketType: props.type,
        orderType: limitOrderType.value,
        targetPrice: limitTargetPrice.value!,
        quantity: limitQty.value,
        currentTick: gameEngine.currentTick,
        expiresAtTick: expiresAt
    })

    if (order) {
        // Keep current price as the target for convenience (don't reset to null)
        limitTargetPrice.value = Math.round(props.currentPrice * 100) / 100
        limitQty.value = 1
    }
}

function cancelOrder(orderId: string) {
    limitOrders.cancelOrder(orderId)
}

function formatCost(v: number): string {
    const dec = smartDecimals(v, 2)
    return '$' + v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function formatPrice(v: number): string {
    const dec = smartDecimals(v, 2)
    return '$' + v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

/** Auto-fill target price with current price when switching to limit mode */
function switchToLimit() {
    mode.value = 'limit'
    if (limitTargetPrice.value === null || limitTargetPrice.value <= 0) {
        limitTargetPrice.value = Math.round(props.currentPrice * 100) / 100
    }
}

/** Set target price to the current market price */
function setToMarketPrice() {
    limitTargetPrice.value = Math.round(props.currentPrice * 100) / 100
}
</script>

<template>
    <div class="trade-panel">
        <!-- Mode toggle -->
        <div class="mode-toggle">
            <UTooltip :text="$t('orders.tip_mode_qty')" placement="top">
                <UButton variant="tab" size="sm" :active="mode === 'qty'" @click="mode = 'qty'" icon="mdi:numeric">
                    {{ $t('market.qty') }}
                </UButton>
            </UTooltip>
            <UTooltip :text="$t('orders.tip_mode_pct')" placement="top">
                <UButton variant="tab" size="sm" :active="mode === 'pct'" @click="mode = 'pct'" icon="mdi:percent">
                    {{ $t('market.pct_cash') }}
                </UButton>
            </UTooltip>
            <UTooltip :text="$t('orders.tip_mode_limit')" placement="top">
                <UButton variant="tab" size="sm" :active="mode === 'limit'" @click="switchToLimit"
                    icon="mdi:clock-alert-outline">
                    {{ $t('orders.limit') }}
                </UButton>
            </UTooltip>
        </div>

        <!-- Quantity mode -->
        <div v-if="mode === 'qty'" class="trade-row">
            <UTooltip :text="$t('orders.tip_qty_input')" placement="top">
                <InputNumber v-model="quantity" :min="1" :max="999999" size="small" class="qty-input" placeholder="1" />
            </UTooltip>
            <UTooltip :text="$t('orders.tip_buy')" placement="top">
                <UButton variant="primary" size="sm" icon="mdi:plus" :disabled="!canAffordAny" @click="handleBuy">
                    {{ $t('market.buy') }}
                </UButton>
            </UTooltip>
            <UTooltip :text="$t('orders.tip_sell')" placement="top">
                <UButton variant="danger" size="sm" icon="mdi:minus" :disabled="!hasPosition" @click="handleSell">
                    {{ $t('market.sell') }}
                </UButton>
            </UTooltip>
        </div>

        <!-- Percent mode -->
        <div v-else-if="mode === 'pct'" class="trade-row-pct">
            <div class="pct-presets">
                <UTooltip v-for="pct in percentPresets" :key="pct" :text="$t('orders.tip_pct_preset', { pct })"
                    placement="top">
                    <UButton variant="ghost" size="xs" :active="percentValue === pct" @click="percentValue = pct">
                        {{ pct }}%
                    </UButton>
                </UTooltip>
            </div>
            <div class="pct-info">
                <span class="pct-detail">≈ {{ qtyFromPercent }} {{ $t(type === 'crypto' ? 'market.coins' :
                    'market.shares') }}</span>
                <span class="pct-cost">{{ formatCost(costEstimate) }}</span>
            </div>
            <div class="pct-actions">
                <UTooltip :text="$t('orders.tip_buy')" placement="top">
                    <UButton variant="primary" size="sm" icon="mdi:plus" :disabled="qtyFromPercent <= 0"
                        @click="handleBuy">
                        {{ $t('market.buy_pct', { pct: percentValue }) }}
                    </UButton>
                </UTooltip>
                <UTooltip v-if="hasPosition" :text="$t('orders.tip_sell_all')" placement="top">
                    <UButton variant="danger" size="sm" icon="mdi:minus" @click="sellAll">
                        {{ $t('market.sell_all') }}
                    </UButton>
                </UTooltip>
            </div>
        </div>

        <!-- Limit order mode -->
        <div v-else class="limit-panel">
            <!-- Order type selector -->
            <div class="limit-type-row">
                <UTooltip v-for="opt in orderTypeOptions" :key="opt.value" :text="$t(opt.tipKey)" placement="top">
                    <UButton variant="ghost" size="xs" :active="limitOrderType === opt.value" :icon="opt.icon"
                        @click="limitOrderType = opt.value">
                        {{ $t(opt.labelKey) }}
                    </UButton>
                </UTooltip>
            </div>

            <!-- Price & quantity inputs -->
            <div class="limit-inputs">
                <div class="limit-field">
                    <label class="limit-label">{{ $t('orders.target_price') }}</label>
                    <div class="limit-price-wrap">
                        <UTooltip :text="$t('orders.tip_target_price')" placement="top">
                            <InputNumber v-model="limitTargetPrice" mode="decimal" :minFractionDigits="2"
                                :maxFractionDigits="6" :min="0.01" size="small" class="limit-input"
                                placeholder="0.00" />
                        </UTooltip>
                        <UTooltip :text="$t('orders.tip_set_market')" placement="top">
                            <UButton variant="ghost" size="xs" icon="mdi:crosshairs-gps" @click="setToMarketPrice"
                                class="set-market-btn" />
                        </UTooltip>
                    </div>
                    <span class="market-hint">{{ $t('orders.current_market') }}: {{ formatPrice(currentPrice) }}</span>
                </div>
                <div class="limit-field">
                    <label class="limit-label">{{ $t('orders.quantity') }}</label>
                    <UTooltip :text="$t('orders.tip_limit_qty')" placement="top">
                        <InputNumber v-model="limitQty" :min="1" :max="999999" size="small" class="limit-input"
                            placeholder="1" />
                    </UTooltip>
                </div>
            </div>

            <!-- Expiration selector -->
            <div class="limit-expire-row">
                <UTooltip :text="$t('orders.tip_expiration')" placement="top">
                    <span class="limit-label">{{ $t('orders.expiration') }}</span>
                </UTooltip>
                <div class="expire-presets">
                    <UTooltip v-for="(preset, idx) in EXPIRATION_PRESETS" :key="preset.label"
                        :text="idx === 0 ? $t('orders.tip_expire_gtc') : $t('orders.tip_expiration')" placement="top">
                        <UButton variant="ghost" size="xs" :active="limitExpireIdx === idx"
                            @click="limitExpireIdx = idx">
                            {{ $t(preset.label) }}
                        </UButton>
                    </UTooltip>
                </div>
            </div>

            <!-- Cost estimate -->
            <UTooltip :text="$t('orders.tip_cost_estimate')" placement="top">
                <div class="cost-estimate">
                    <span class="cost-label">
                        {{ isLimitBuy ? $t('orders.est_cost') : $t('orders.est_revenue') }}
                    </span>
                    <span class="cost-value">{{ formatCost(costEstimate) }}</span>
                </div>
            </UTooltip>

            <!-- Place order button -->
            <UTooltip :text="$t('orders.tip_place_order')" placement="top">
                <UButton :variant="isLimitBuy ? 'primary' : 'danger'" size="sm"
                    :icon="isLimitBuy ? 'mdi:cart-arrow-down' : 'mdi:cart-arrow-up'" :disabled="!canPlaceLimit"
                    @click="handlePlaceLimitOrder" class="place-order-btn">
                    {{ $t('orders.place_order') }}
                </UButton>
            </UTooltip>

            <!-- Active orders for this asset -->
            <div v-if="assetOrders.length > 0" class="active-orders">
                <div class="active-orders-title">
                    {{ $t('orders.active_orders') }} ({{ assetOrders.length }})
                </div>
                <div v-for="order in assetOrders" :key="order.id" class="order-row">
                    <span class="order-type-badge" :class="'order-type--' + order.orderType">
                        {{ $t('orders.type_' + order.orderType) }}
                    </span>
                    <span class="order-detail">
                        {{ order.quantity }} × {{ formatPrice(order.targetPrice) }}
                    </span>
                    <UTooltip :text="$t('orders.tip_cancel_order')" placement="left">
                        <UButton variant="icon" size="xs" icon="mdi:close" @click="cancelOrder(order.id)" />
                    </UTooltip>
                </div>
            </div>
        </div>

        <!-- Cost estimate (qty mode) -->
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

/* ─── Limit order panel ─── */
.limit-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.limit-type-row {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.limit-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}

.limit-field {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.limit-label {
    font-size: 0.68rem;
    font-weight: var(--t-font-semibold);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.limit-input {
    width: 100%;
}

.limit-input :deep(.p-inputnumber-input) {
    width: 100%;
    font-size: 0.82rem;
}

.limit-expire-row {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.expire-presets {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.place-order-btn {
    width: 100%;
}

/* ─── Active orders ─── */
.active-orders {
    border-top: 1px solid var(--t-border);
    padding-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.active-orders-title {
    font-size: 0.7rem;
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.order-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.2rem 0.35rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    font-size: 0.72rem;
}

.order-type-badge {
    font-size: 0.62rem;
    font-weight: var(--t-font-bold);
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    white-space: nowrap;
}

.order-type--limit_buy {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.order-type--limit_sell {
    background: var(--t-danger-muted);
    color: var(--t-danger);
}

.order-type--stop_loss {
    background: var(--t-warning-muted);
    color: var(--t-warning);
}

.order-type--take_profit {
    background: var(--t-accent-muted, rgba(34, 197, 94, 0.1));
    color: var(--t-accent);
}

.order-detail {
    flex: 1;
    font-family: var(--t-font-mono);
    font-size: 0.72rem;
    color: var(--t-text-secondary);
}

/* ─── Limit price input wrapper ─── */
.limit-price-wrap {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.limit-price-wrap .limit-input {
    flex: 1;
}

.set-market-btn {
    flex-shrink: 0;
}

.market-hint {
    font-size: 0.62rem;
    color: var(--t-text-muted);
    font-family: var(--t-font-mono);
    margin-top: 0.1rem;
}
</style>
