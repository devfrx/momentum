<script setup lang="ts">
/**
 * OrderBook — Displays all active and recent limit orders for a market type.
 * Shows pending orders with cancel buttons, and recent history (filled/expired/cancelled).
 */
import { computed } from 'vue'
import { UButton, UCard } from '@renderer/components/ui'
import AppIcon from '@renderer/components/AppIcon.vue'
import { useLimitOrderStore } from '@renderer/stores/useLimitOrderStore'
import { smartDecimals } from '@renderer/composables/useFormat'
import type { LimitOrder, OrderType, OrderStatus } from '@renderer/core/LimitOrderEngine'

const props = defineProps<{
    /** 'stock' or 'crypto' — filter orders by market type */
    marketType: 'stock' | 'crypto'
}>()

const limitOrders = useLimitOrderStore()

const activeOrders = computed(() =>
    props.marketType === 'stock' ? limitOrders.activeStockOrders : limitOrders.activeCryptoOrders
)

const recentHistory = computed(() =>
    limitOrders.orderHistory
        .filter((o) => o.marketType === props.marketType)
        .slice(-10)
        .reverse()
)

const orderTypeIcons: Record<OrderType, string> = {
    limit_buy: 'mdi:cart-arrow-down',
    limit_sell: 'mdi:cart-arrow-up',
    stop_loss: 'mdi:shield-alert',
    take_profit: 'mdi:target'
}

const statusIcons: Record<OrderStatus, string> = {
    pending: 'mdi:clock-outline',
    filled: 'mdi:check-circle',
    cancelled: 'mdi:close-circle',
    expired: 'mdi:timer-off'
}

function formatPrice(v: number): string {
    const dec = smartDecimals(v, 2)
    return '$' + v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function cancelOrder(orderId: string) {
    limitOrders.cancelOrder(orderId)
}
</script>

<template>
    <UCard class="order-book" v-if="activeOrders.length > 0 || recentHistory.length > 0">
        <template #header>
            <div class="item-card-title">
                <AppIcon icon="mdi:book-open-page-variant" class="order-book-icon" />
                <h3 class="item-card-name">{{ $t('orders.order_book') }}</h3>
                <span class="order-count-badge">{{ activeOrders.length }}</span>
            </div>
            <div class="order-book-stats">
                <span class="stat-item">
                    <span class="stat-label">{{ $t('orders.max_orders') }}</span>
                    <span class="stat-value">{{ activeOrders.length }} / {{ limitOrders.maxOrders }}</span>
                </span>
            </div>
        </template>

        <!-- Active Orders -->
        <div v-if="activeOrders.length > 0" class="order-section">
            <div class="section-title">{{ $t('orders.pending_orders') }}</div>
            <div class="order-list">
                <div v-for="order in activeOrders" :key="order.id" class="order-item">
                    <div class="order-left">
                        <AppIcon :icon="orderTypeIcons[order.orderType]" class="order-icon"
                            :class="'icon--' + order.orderType" />
                        <div class="order-info">
                            <span class="order-asset">{{ order.assetId }}</span>
                            <span class="order-type-label">{{ $t('orders.type_' + order.orderType) }}</span>
                        </div>
                    </div>
                    <div class="order-center">
                        <span class="order-qty">{{ order.quantity }}×</span>
                        <span class="order-price">{{ formatPrice(order.targetPrice) }}</span>
                    </div>
                    <div class="order-right">
                        <span v-if="order.expiresAtTick > 0" class="order-expire">
                            <AppIcon icon="mdi:timer-sand" />
                        </span>
                        <UButton variant="icon" size="xs" icon="mdi:close" @click="cancelOrder(order.id)"
                            :title="$t('orders.cancel')" class="cancel-btn" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent History -->
        <div v-if="recentHistory.length > 0" class="order-section history-section">
            <div class="section-title">{{ $t('orders.recent_history') }}</div>
            <div class="order-list history-list">
                <div v-for="order in recentHistory" :key="order.id" class="order-item history-item"
                    :class="'status--' + order.status">
                    <div class="order-left">
                        <AppIcon :icon="statusIcons[order.status]" class="status-icon"
                            :class="'status-icon--' + order.status" />
                        <div class="order-info">
                            <span class="order-asset">{{ order.assetId }}</span>
                            <span class="order-type-label">{{ $t('orders.type_' + order.orderType) }}</span>
                        </div>
                    </div>
                    <div class="order-center">
                        <span class="order-qty">{{ order.quantity }}×</span>
                        <span class="order-price">
                            {{ order.filledPrice ? formatPrice(order.filledPrice) : formatPrice(order.targetPrice) }}
                        </span>
                    </div>
                    <div class="order-right">
                        <span class="order-status-text">{{ $t('orders.status_' + order.status) }}</span>
                    </div>
                </div>
            </div>
        </div>
    </UCard>
</template>

<style scoped>
.order-book {
    margin-bottom: var(--t-space-4);
}

.order-book-icon {
    color: var(--t-accent);
    font-size: 1rem;
}

.order-count-badge {
    font-size: 0.68rem;
    font-weight: var(--t-font-bold);
    background: var(--t-accent);
    color: var(--t-text-inverse);
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    min-width: 20px;
    text-align: center;
}

.order-book-stats {
    display: flex;
    gap: 0.75rem;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
}

.stat-label {
    color: var(--t-text-muted);
}

.stat-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
}

/* ─── Sections ─── */
.order-section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.order-section+.order-section {
    margin-top: var(--t-space-3);
    padding-top: var(--t-space-3);
    border-top: 1px solid var(--t-border);
}

.section-title {
    font-size: 0.68rem;
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

/* ─── Order list ─── */
.order-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.order-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    font-size: 0.78rem;
}

.order-left {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
}

.order-icon {
    font-size: 0.9rem;
}

.icon--limit_buy {
    color: var(--t-success);
}

.icon--limit_sell {
    color: var(--t-danger);
}

.icon--stop_loss {
    color: var(--t-warning);
}

.icon--take_profit {
    color: var(--t-accent);
}

.order-info {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.order-asset {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    font-size: 0.75rem;
    color: var(--t-text);
}

.order-type-label {
    font-size: 0.6rem;
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.order-center {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex: 1;
    justify-content: center;
}

.order-qty {
    font-family: var(--t-font-mono);
    font-size: 0.72rem;
    color: var(--t-text-secondary);
}

.order-price {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.order-right {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-shrink: 0;
}

.order-expire {
    color: var(--t-text-muted);
    font-size: 0.75rem;
}

.cancel-btn {
    opacity: 0.6;
    transition: opacity 0.15s;
}

.cancel-btn:hover {
    opacity: 1;
}

/* ─── History ─── */
.history-item {
    opacity: 0.75;
}

.status-icon {
    font-size: 0.85rem;
}

.status-icon--filled {
    color: var(--t-success);
}

.status-icon--cancelled {
    color: var(--t-text-muted);
}

.status-icon--expired {
    color: var(--t-warning);
}

.order-status-text {
    font-size: 0.62rem;
    font-weight: var(--t-font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.status--filled .order-status-text {
    color: var(--t-success);
}

.status--cancelled .order-status-text {
    color: var(--t-text-muted);
}

.status--expired .order-status-text {
    color: var(--t-warning);
}
</style>
