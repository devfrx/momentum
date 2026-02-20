/**
 * useLimitOrderStore — Pinia store for managing limit orders
 *
 * Handles order placement, cancellation, execution, expiration, and persistence.
 * Integrates with useStockStore / useCryptoStore for trade execution,
 * usePlayerStore for cash reservation, and useNotify for notifications.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, gte } from '@renderer/core/BigNum'
import {
  evaluateOrders,
  generateOrderId,
  calculateOrderCost,
  isBuyOrder,
  isSellOrder,
  BASE_MAX_ORDERS,
  DEFAULT_EXPIRATION_TICKS,
  type LimitOrder,
  type OrderType,
  type OrderStatus,
  type MarketType,
  type OrderExecutionResult
} from '@renderer/core/LimitOrderEngine'
import i18n from '@renderer/locales'
import { usePlayerStore } from './usePlayerStore'
import { useStockStore } from './useStockStore'
import { useCryptoStore } from './useCryptoStore'
import { useUpgradeStore } from './useUpgradeStore'
import type { useNotify } from '@renderer/composables/useNotify'

/** Cached notify instance — set via initNotify() from a component setup context */
let _notifyInstance: ReturnType<typeof useNotify> | null = null

/** Must be called once from a Vue setup() context to enable toast notifications. */
export function initLimitOrderNotify(notify: ReturnType<typeof useNotify>): void {
  _notifyInstance = notify
}

export const useLimitOrderStore = defineStore('limitOrders', () => {
  // ─── State ──────────────────────────────────────────────────────
  const orders = ref<LimitOrder[]>([])
  const orderHistory = ref<LimitOrder[]>([]) // Filled/cancelled/expired orders (last 50)
  const totalOrdersFilled = ref(0)
  const totalOrdersCancelled = ref(0)
  const totalOrdersExpired = ref(0)
  const totalProfitFromOrders = ref<Decimal>(ZERO)

  // ─── Computed ──────────────────────────────────────────────────
  const activeOrders = computed(() => orders.value.filter((o) => o.status === 'pending'))

  const activeStockOrders = computed(() =>
    activeOrders.value.filter((o) => o.marketType === 'stock')
  )

  const activeCryptoOrders = computed(() =>
    activeOrders.value.filter((o) => o.marketType === 'crypto')
  )

  /** Total cash reserved by pending buy orders */
  const totalReservedCash = computed(() => {
    let total = ZERO
    for (const order of activeOrders.value) {
      if (isBuyOrder(order.orderType)) {
        total = add(total, order.reservedCash)
      }
    }
    return total
  })

  /** Max orders allowed (base + skill tree bonus) */
  const maxOrders = computed(() => {
    const upgrades = useUpgradeStore()
    // Check for limit_order_slots skill (integer multiplier)
    const slotMultiplier = upgrades.getMultiplier('limit_order_slots')
    return Math.floor(BASE_MAX_ORDERS * slotMultiplier.toNumber())
  })

  // ─── Actions ──────────────────────────────────────────────────

  /**
   * Place a new limit order.
   * For buy orders: reserves cash from the player.
   * For sell orders: validates the player holds enough shares/coins.
   *
   * @returns The created order, or null if validation fails.
   */
  function placeOrder(params: {
    assetId: string
    marketType: MarketType
    orderType: OrderType
    targetPrice: number
    quantity: number
    currentTick: number
    expiresAtTick?: number
  }): LimitOrder | null {
    const player = usePlayerStore()
    const stocks = useStockStore()
    const crypto = useCryptoStore()

    // Check order limit
    const marketOrders =
      params.marketType === 'stock' ? activeStockOrders.value : activeCryptoOrders.value
    if (marketOrders.length >= maxOrders.value) {
      return null
    }

    // Validate price and quantity
    if (params.targetPrice <= 0 || params.quantity <= 0) return null

    const reservedCash = isBuyOrder(params.orderType)
      ? calculateOrderCost(params.targetPrice, params.quantity)
      : ZERO

    // For buy orders: check player has enough unreserved cash
    if (isBuyOrder(params.orderType)) {
      const availableCash = sub(player.cash, totalReservedCash.value)
      if (!gte(availableCash, reservedCash)) return null
    }

    // For sell orders: validate position exists with enough unreserved shares/coins
    if (isSellOrder(params.orderType)) {
      // Calculate how many shares/coins are already committed to other pending sell orders
      const committedQty = activeOrders.value
        .filter(o => o.assetId === params.assetId && o.marketType === params.marketType && isSellOrder(o.orderType))
        .reduce((sum, o) => sum + o.quantity, 0)

      if (params.marketType === 'stock') {
        const position = stocks.getPosition(params.assetId)
        if (!position || (position.shares - committedQty) < params.quantity) return null
      } else {
        const holding = crypto.getHolding(params.assetId)
        if (!holding || (holding.amount - committedQty) < params.quantity) return null
      }
    }

    const order: LimitOrder = {
      id: generateOrderId(),
      assetId: params.assetId,
      marketType: params.marketType,
      orderType: params.orderType,
      targetPrice: params.targetPrice,
      quantity: params.quantity,
      status: 'pending',
      createdAtTick: params.currentTick,
      expiresAtTick: params.expiresAtTick ?? DEFAULT_EXPIRATION_TICKS,
      reservedCash
    }

    orders.value.push(order)

    // XP for placing an order
    player.addXp(D(2))

    return order
  }

  /**
   * Cancel a pending order.
   * For buy orders: released reserved cash is not explicitly tracked —
   * it's computed from active orders, so removing the order frees it.
   */
  function cancelOrder(orderId: string): boolean {
    const order = orders.value.find((o) => o.id === orderId)
    if (!order || order.status !== 'pending') return false

    order.status = 'cancelled'
    totalOrdersCancelled.value++

    // Move to history
    _addToHistory(order)
    _removeFromActive(orderId)

    return true
  }

  /**
   * Tick evaluation: check all pending orders against current prices.
   * Executes triggered orders and expires old ones.
   * Called from the game loop subscriber.
   */
  function tick(currentTick: number): void {
    if (activeOrders.value.length === 0) return

    const stocks = useStockStore()
    const crypto = useCryptoStore()

    // Build price map from both markets
    const priceMap = new Map<string, number>()
    for (const asset of stocks.assets) {
      priceMap.set(asset.id, asset.currentPrice)
    }
    for (const asset of crypto.assets) {
      priceMap.set(asset.id, asset.currentPrice)
    }

    const { triggered, expired } = evaluateOrders(activeOrders.value, priceMap, currentTick)

    // Process expired orders
    for (const order of expired) {
      order.status = 'expired'
      totalOrdersExpired.value++
      _addToHistory(order)
      _removeFromActive(order.id)

      _notifyInstance?.warning(
        `⏰ ${_orderLabel(order)} ${order.assetId} — ${_t('orders.notify_expired')}`
      )
    }

    // Process triggered orders
    for (const order of triggered) {
      const result = _executeOrder(order, currentTick)
      if (result.success) {
        order.status = 'filled'
        order.filledAtTick = currentTick
        order.filledPrice = priceMap.get(order.assetId) ?? order.targetPrice
        totalOrdersFilled.value++

        // Track order profit: for sell orders, profit = revenue - cost basis (targetPrice * qty)
        // For buy orders, no immediate profit (profit is realized on sell)
        if (isSellOrder(order.orderType)) {
          const revenue = result.amount
          const costBasis = D(order.targetPrice * order.quantity)
          totalProfitFromOrders.value = add(totalProfitFromOrders.value, sub(revenue, costBasis))
        }

        _notifyInstance?.income(
          `✅ ${_orderLabel(order)} ${order.assetId} × ${order.quantity} @ $${order.filledPrice?.toFixed(2)}`
        )
      } else {
        // Order failed (e.g. insufficient shares/cash at execution time)
        order.status = 'cancelled'
        totalOrdersCancelled.value++

        _notifyInstance?.error(
          `❌ ${_orderLabel(order)} ${order.assetId} — ${result.error ?? _t('orders.notify_failed')}`
        )
      }

      _addToHistory(order)
      _removeFromActive(order.id)
    }
  }

  /**
   * Get active orders for a specific asset.
   */
  function getOrdersForAsset(assetId: string): LimitOrder[] {
    return activeOrders.value.filter((o) => o.assetId === assetId)
  }

  /**
   * Count active orders for a specific asset.
   */
  function countOrdersForAsset(assetId: string): number {
    return activeOrders.value.filter((o) => o.assetId === assetId).length
  }

  // ─── Prestige Reset ───────────────────────────────────────────
  function prestigeReset(): void {
    // Cancel all pending orders
    for (const order of orders.value) {
      if (order.status === 'pending') {
        order.status = 'cancelled'
      }
    }
    orders.value = []
    orderHistory.value = []
    totalOrdersFilled.value = 0
    totalOrdersCancelled.value = 0
    totalOrdersExpired.value = 0
    totalProfitFromOrders.value = ZERO
  }

  // ─── Save / Load ─────────────────────────────────────────────
  function exportState(): Record<string, unknown> {
    return {
      orders: orders.value.map((o) => ({
        ...o,
        reservedCash: o.reservedCash
      })),
      orderHistory: orderHistory.value.map((o) => ({
        ...o,
        reservedCash: o.reservedCash
      })),
      totalOrdersFilled: totalOrdersFilled.value,
      totalOrdersCancelled: totalOrdersCancelled.value,
      totalOrdersExpired: totalOrdersExpired.value,
      totalProfitFromOrders: totalProfitFromOrders.value
    }
  }

  function loadFromSave(saved: Record<string, unknown>): void {
    if (saved.orders && Array.isArray(saved.orders)) {
      orders.value = (saved.orders as LimitOrder[]).filter((o) => o.status === 'pending')
    }
    if (saved.orderHistory && Array.isArray(saved.orderHistory)) {
      orderHistory.value = (saved.orderHistory as LimitOrder[]).slice(-50)
    }
    if (typeof saved.totalOrdersFilled === 'number') {
      totalOrdersFilled.value = saved.totalOrdersFilled
    }
    if (typeof saved.totalOrdersCancelled === 'number') {
      totalOrdersCancelled.value = saved.totalOrdersCancelled
    }
    if (typeof saved.totalOrdersExpired === 'number') {
      totalOrdersExpired.value = saved.totalOrdersExpired
    }
    if (saved.totalProfitFromOrders !== undefined) {
      totalProfitFromOrders.value = saved.totalProfitFromOrders as Decimal
    }
  }

  // ─── Private helpers ──────────────────────────────────────────

  function _executeOrder(order: LimitOrder, currentTick: number): OrderExecutionResult {
    const player = usePlayerStore()
    const stocks = useStockStore()
    const crypto = useCryptoStore()

    if (isBuyOrder(order.orderType)) {
      // Execute buy at current market price (which triggered the order)
      if (order.marketType === 'stock') {
        const result = stocks.buyShares(order.assetId, order.quantity)
        if (result === null) {
          return { order, success: false, amount: ZERO, error: 'Insufficient funds' }
        }
        return { order, success: true, amount: result }
      } else {
        const result = crypto.buyCrypto(order.assetId, order.quantity)
        if (result === null) {
          return { order, success: false, amount: ZERO, error: 'Insufficient funds' }
        }
        return { order, success: true, amount: result }
      }
    } else {
      // Execute sell at current market price
      if (order.marketType === 'stock') {
        const result = stocks.sellShares(order.assetId, order.quantity)
        if (result === null) {
          return { order, success: false, amount: ZERO, error: 'Insufficient shares' }
        }
        return { order, success: true, amount: result }
      } else {
        const result = crypto.sellCrypto(order.assetId, order.quantity)
        if (result === null) {
          return { order, success: false, amount: ZERO, error: 'Insufficient holdings' }
        }
        return { order, success: true, amount: result }
      }
    }
  }

  function _addToHistory(order: LimitOrder): void {
    orderHistory.value.push({ ...order })
    // Keep history bounded
    if (orderHistory.value.length > 50) {
      orderHistory.value.shift()
    }
  }

  function _removeFromActive(orderId: string): void {
    orders.value = orders.value.filter((o) => o.id !== orderId)
  }

  function _orderLabel(order: LimitOrder): string {
    const t = i18n.global.t as (key: string) => string
    const icons: Record<OrderType, string> = {
      limit_buy: '🟢',
      limit_sell: '🔴',
      stop_loss: '🛑',
      take_profit: '🎯'
    }
    return `${icons[order.orderType]} ${t('orders.type_' + order.orderType)}`
  }

  function _t(key: string): string {
    return (i18n.global.t as (key: string) => string)(key)
  }

  return {
    // State
    orders,
    orderHistory,
    totalOrdersFilled,
    totalOrdersCancelled,
    totalOrdersExpired,
    totalProfitFromOrders,
    // Computed
    activeOrders,
    activeStockOrders,
    activeCryptoOrders,
    totalReservedCash,
    maxOrders,
    // Actions
    placeOrder,
    cancelOrder,
    tick,
    getOrdersForAsset,
    countOrdersForAsset,
    prestigeReset,
    exportState,
    loadFromSave
  }
})
