/**
 * LimitOrderEngine — Core logic for limit/stop orders on stocks & crypto
 *
 * Supports four order types:
 * - limit_buy:  Buy when price drops to or below the target price
 * - limit_sell: Sell when price rises to or above the target price
 * - stop_loss:  Sell when price drops to or below the target price
 * - take_profit: Sell when price rises to or above the target price
 *
 * Orders have optional expiration (in game ticks) and quantity.
 * The engine is stateless — it receives orders and prices and returns
 * which orders should be executed.
 */
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, gte } from '@renderer/core/BigNum'

// ─── Types ──────────────────────────────────────────────────────

export type OrderType = 'limit_buy' | 'limit_sell' | 'stop_loss' | 'take_profit'
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'expired'
export type MarketType = 'stock' | 'crypto'

export interface LimitOrder {
  /** Unique order ID (UUID-like) */
  id: string
  /** Asset identifier (e.g. 'AAPL', 'BTC') */
  assetId: string
  /** 'stock' or 'crypto' */
  marketType: MarketType
  /** Order type */
  orderType: OrderType
  /** Target price at which order should trigger */
  targetPrice: number
  /** Number of shares/coins to buy or sell */
  quantity: number
  /** Current order status */
  status: OrderStatus
  /** Tick when the order was placed */
  createdAtTick: number
  /** Tick when the order was filled (if applicable) */
  filledAtTick?: number
  /** Price at which the order was actually filled (may differ slightly from target) */
  filledPrice?: number
  /** Tick when the order expires (0 = no expiration — Good Till Cancelled) */
  expiresAtTick: number
  /** Original cost estimate at time of order placement (for buy orders) */
  reservedCash: Decimal
}

export interface OrderExecutionResult {
  order: LimitOrder
  /** Whether the order was successfully filled */
  success: boolean
  /** Revenue (for sells) or cost (for buys) as Decimal */
  amount: Decimal
  /** Error message if not successful */
  error?: string
}

// ─── Helpers ────────────────────────────────────────────────────

let orderCounter = 0

/** Generate a unique order ID */
export function generateOrderId(): string {
  orderCounter++
  return `ord_${Date.now().toString(36)}_${orderCounter.toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

// ─── Engine ─────────────────────────────────────────────────────

/**
 * Check which orders should trigger given current asset prices.
 * Does NOT execute the orders — just identifies which ones are ready.
 *
 * @param orders Active (pending) orders
 * @param priceMap Current prices by assetId
 * @param currentTick Current game tick
 * @returns Array of orders ready to execute, plus array of expired orders
 */
export function evaluateOrders(
  orders: LimitOrder[],
  priceMap: Map<string, number>,
  currentTick: number
): { triggered: LimitOrder[]; expired: LimitOrder[] } {
  const triggered: LimitOrder[] = []
  const expired: LimitOrder[] = []

  for (const order of orders) {
    if (order.status !== 'pending') continue

    // Check expiration first
    if (order.expiresAtTick > 0 && currentTick >= order.expiresAtTick) {
      expired.push(order)
      continue
    }

    const currentPrice = priceMap.get(order.assetId)
    if (currentPrice === undefined) continue

    let shouldTrigger = false

    switch (order.orderType) {
      case 'limit_buy':
        // Buy when price drops to or below target
        shouldTrigger = currentPrice <= order.targetPrice
        break

      case 'limit_sell':
        // Sell when price rises to or above target
        shouldTrigger = currentPrice >= order.targetPrice
        break

      case 'stop_loss':
        // Sell when price drops to or below target (protect from loss)
        shouldTrigger = currentPrice <= order.targetPrice
        break

      case 'take_profit':
        // Sell when price rises to or above target (lock in profit)
        shouldTrigger = currentPrice >= order.targetPrice
        break
    }

    if (shouldTrigger) {
      triggered.push(order)
    }
  }

  return { triggered, expired }
}

/**
 * Calculate the cash required to reserve for a buy order.
 * This ensures the player can't spend reserved cash elsewhere.
 *
 * @param targetPrice Target price per share/coin
 * @param quantity Number of shares/coins
 * @returns Decimal cost to reserve
 */
export function calculateOrderCost(targetPrice: number, quantity: number): Decimal {
  return D(targetPrice * quantity)
}

/**
 * Determine if an order type is a buy or sell order
 */
export function isBuyOrder(orderType: OrderType): boolean {
  return orderType === 'limit_buy'
}

/**
 * Determine if an order type is a sell order
 */
export function isSellOrder(orderType: OrderType): boolean {
  return orderType === 'limit_sell' || orderType === 'stop_loss' || orderType === 'take_profit'
}

/**
 * Calculate the number of active orders for a given asset
 */
export function countActiveOrders(orders: LimitOrder[], assetId: string): number {
  return orders.filter((o) => o.assetId === assetId && o.status === 'pending').length
}

/**
 * Get human-readable order type label key (for i18n)
 */
export function getOrderTypeI18nKey(orderType: OrderType): string {
  const map: Record<OrderType, string> = {
    limit_buy: 'orders.type_limit_buy',
    limit_sell: 'orders.type_limit_sell',
    stop_loss: 'orders.type_stop_loss',
    take_profit: 'orders.type_take_profit'
  }
  return map[orderType]
}

/** Max active orders per market type (stock / crypto) — can be increased with skill tree */
export const BASE_MAX_ORDERS = 5

/** Default expiration: 2000 game days × 120 ticks/day = 240000 ticks (0 = GTC) */
export const DEFAULT_EXPIRATION_TICKS = 0

/** Expiration presets in game days */
export const EXPIRATION_PRESETS = [
  { label: 'orders.expire_gtc', ticks: 0 },
  { label: 'orders.expire_1d', ticks: 120 },     // 1 game day
  { label: 'orders.expire_7d', ticks: 840 },     // 7 game days
  { label: 'orders.expire_30d', ticks: 3600 },   // 30 game days
  { label: 'orders.expire_90d', ticks: 10800 }   // 90 game days
]
