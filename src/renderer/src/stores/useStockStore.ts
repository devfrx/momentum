/**
 * useStockStore — Stock market portfolio & trading
 */
import { defineStore } from 'pinia'
import { shallowRef, ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, gte } from '@renderer/core/BigNum'
import { MarketSimulator, type AssetConfig, type AssetState } from '@renderer/core/MarketSim'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'

export interface PortfolioPosition {
  assetId: string
  shares: number
  averageBuyPrice: number
  totalInvested: Decimal
}

export const useStockStore = defineStore('stocks', () => {
  const simulator = new MarketSimulator()
  const configs = ref<AssetConfig[]>([])
  const portfolio = ref<PortfolioPosition[]>([])
  const assets = shallowRef<AssetState[]>([])
  const totalRealizedProfit = ref<Decimal>(ZERO)
  const totalDividendsEarned = ref<Decimal>(ZERO)

  // ─── Computed ─────────────────────────────────────────────────

  const unrealizedProfit = computed(() => {
    let total = ZERO
    for (const pos of portfolio.value) {
      const asset = assets.value.find((a) => a.id === pos.assetId)
      if (!asset) continue
      const currentValue = D(asset.currentPrice * pos.shares)
      const profit = sub(currentValue, pos.totalInvested)
      total = add(total, profit)
    }
    return total
  })

  const totalPortfolioValue = computed(() => {
    let total = ZERO
    for (const pos of portfolio.value) {
      const asset = assets.value.find((a) => a.id === pos.assetId)
      if (!asset) continue
      total = add(total, D(asset.currentPrice * pos.shares))
    }
    return total
  })

  // ─── Actions ──────────────────────────────────────────────────

  function initStocks(stockConfigs: AssetConfig[]): void {
    configs.value = stockConfigs
    for (const config of stockConfigs) {
      simulator.registerAsset(config)
    }
    assets.value = simulator.getAllAssets()
  }

  /**
   * Dividend income per second — used for offline progress calculation.
   * Sum of (shares × currentPrice × annualYield / secondsPerYear) for all held stocks.
   * We use 30240 game-seconds per year (252 trading days × 120 ticks/day ÷ 10 ticks/s).
   */
  const dividendIncomePerSecond = computed(() => {
    const SECONDS_PER_GAME_YEAR = 252 * 12 // 252 trading days × 12 seconds per day at 10 ticks/s
    const upgrades = useUpgradeStore()
    const stockReturnsMul = upgrades.getMultiplier('stock_returns')
    let total = ZERO
    for (const pos of portfolio.value) {
      const asset = assets.value.find((a) => a.id === pos.assetId)
      const config = configs.value.find((c) => c.id === pos.assetId)
      if (!asset || !config || !config.dividendYield) continue
      const annualDividend = asset.currentPrice * pos.shares * config.dividendYield
      total = add(total, D(annualDividend / SECONDS_PER_GAME_YEAR))
    }
    // Apply stock_returns skill-tree multiplier (matches online payDividends behaviour)
    return mul(total, stockReturnsMul)
  })

  function tick(): void {
    simulator.tick()
    // Spread each asset with a copied priceHistory to ensure Vue detects prop changes
    assets.value = simulator.getAllAssets().map(a => ({
      ...a,
      priceHistory: a.priceHistory.slice()
    }))
  }

  /**
   * Pay dividends to the player for all held positions.
   * Called from game loop at a configurable interval (e.g. every 100 ticks = 10s).
   * Uses the same annual yield / ticksPerYear formula as the simulator dt.
   * @param ticksSinceLastPayout Number of ticks since last dividend payout
   */
  function payDividends(ticksSinceLastPayout: number): void {
    if (portfolio.value.length === 0) return
    const TICKS_PER_GAME_YEAR = 252 * 120 // 252 trading days × 120 ticks/day
    const player = usePlayerStore()
    const upgrades = useUpgradeStore()
    const stockReturnsMul = upgrades.getMultiplier('stock_returns')

    let totalPayout = ZERO
    for (const pos of portfolio.value) {
      const asset = assets.value.find((a) => a.id === pos.assetId)
      const config = configs.value.find((c) => c.id === pos.assetId)
      if (!asset || !config || !config.dividendYield || config.dividendYield <= 0) continue

      const payout = D(asset.currentPrice * pos.shares * config.dividendYield * ticksSinceLastPayout / TICKS_PER_GAME_YEAR)
      totalPayout = add(totalPayout, payout)
    }

    if (totalPayout.gt(0)) {
      // Apply stock_returns multiplier to dividends too
      const adjustedPayout = mul(totalPayout, stockReturnsMul)
      player.earnCash(adjustedPayout)
      totalDividendsEarned.value = add(totalDividendsEarned.value, adjustedPayout)
    }
  }

  /** Buy shares. Returns cost as Decimal, or null if asset not found. */
  function buyShares(assetId: string, shareCount: number): Decimal | null {
    const asset = assets.value.find((a) => a.id === assetId)
    if (!asset || shareCount <= 0) return null

    const player = usePlayerStore()
    const cost = D(asset.currentPrice * shareCount)
    
    // Check and spend cash
    if (!gte(player.cash, cost)) return null
    if (!player.spendCash(cost)) return null
    
    const existing = portfolio.value.find((p) => p.assetId === assetId)

    if (existing) {
      const totalShares = existing.shares + shareCount
      existing.averageBuyPrice =
        (existing.averageBuyPrice * existing.shares + asset.currentPrice * shareCount) / totalShares
      existing.shares = totalShares
      existing.totalInvested = add(existing.totalInvested, cost)
    } else {
      portfolio.value.push({
        assetId,
        shares: shareCount,
        averageBuyPrice: asset.currentPrice,
        totalInvested: cost
      })
    }

    return cost
  }

  /** Sell shares. Returns revenue as Decimal, or null if not enough shares. */
  function sellShares(assetId: string, shareCount: number): Decimal | null {
    const pos = portfolio.value.find((p) => p.assetId === assetId)
    if (!pos || pos.shares < shareCount) return null

    const asset = assets.value.find((a) => a.id === assetId)
    if (!asset) return null

    const player = usePlayerStore()
    const upgrades = useUpgradeStore()
    const baseRevenue = D(asset.currentPrice * shareCount)
    const costBasis = D(pos.averageBuyPrice * shareCount)
    const baseProfit = baseRevenue.sub(costBasis)
    // Apply stock_returns skill multiplier to profit only (not gross revenue)
    // If profit is positive, multiply it; if negative, leave unchanged
    const multipliedProfit = baseProfit.gt(0) ? mul(baseProfit, upgrades.getMultiplier('stock_returns')) : baseProfit
    const revenue = baseRevenue.add(multipliedProfit.sub(baseProfit))
    const profit = multipliedProfit
    totalRealizedProfit.value = add(totalRealizedProfit.value, profit)
    
    // Add revenue to player cash
    player.earnCash(revenue)

    pos.shares -= shareCount
    pos.totalInvested = sub(pos.totalInvested, costBasis)

    if (pos.shares <= 0) {
      portfolio.value = portfolio.value.filter((p) => p.assetId !== assetId)
    }

    // XP for selling (more if profitable)
    player.addXp(profit.gt(0) ? D(10) : D(3))

    return revenue
  }

  function getPosition(assetId: string): PortfolioPosition | undefined {
    return portfolio.value.find((p) => p.assetId === assetId)
  }

  function prestigeReset(): void {
    portfolio.value = []
    totalRealizedProfit.value = ZERO
    totalDividendsEarned.value = ZERO
  }

  function getSimulator(): MarketSimulator {
    return simulator
  }

  /** Restore stock state from saved data */
  function loadFromSave(saved: {
    stockPortfolio?: Array<{ assetId: string; shares: number; averageBuyPrice: number; totalInvested: Decimal }>
    stockStats?: { totalRealizedProfit?: Decimal; totalDividendsEarned?: Decimal }
    stockMarketState?: unknown
  }): void {
    // Restore portfolio positions
    if (saved.stockPortfolio && Array.isArray(saved.stockPortfolio)) {
      for (const savedPos of saved.stockPortfolio) {
        const existingPos = portfolio.value.find((p) => p.assetId === savedPos.assetId)
        if (existingPos) {
          existingPos.shares = savedPos.shares ?? 0
          existingPos.averageBuyPrice = savedPos.averageBuyPrice ?? 0
          existingPos.totalInvested = savedPos.totalInvested ?? existingPos.totalInvested
        } else if (savedPos.shares > 0) {
          portfolio.value.push({
            assetId: savedPos.assetId,
            shares: savedPos.shares,
            averageBuyPrice: savedPos.averageBuyPrice,
            totalInvested: savedPos.totalInvested
          })
        }
      }
    }
    // Restore stats
    if (saved.stockStats) {
      if (saved.stockStats.totalRealizedProfit !== undefined) {
        totalRealizedProfit.value = saved.stockStats.totalRealizedProfit
      }
      if (saved.stockStats.totalDividendsEarned !== undefined) {
        totalDividendsEarned.value = saved.stockStats.totalDividendsEarned
      }
    }
    // Restore market simulator state
    if (saved.stockMarketState) {
      try {
        simulator.deserialize(saved.stockMarketState as Parameters<MarketSimulator['deserialize']>[0])
        assets.value = [...simulator.getAllAssets()]
      } catch (e) {
        console.warn('[StockStore] Failed to restore market state:', e)
      }
    }
  }

  return {
    configs,
    portfolio,
    assets,
    totalRealizedProfit,
    totalDividendsEarned,
    unrealizedProfit,
    totalPortfolioValue,
    dividendIncomePerSecond,
    initStocks,
    tick,
    payDividends,
    buyShares,
    sellShares,
    getPosition,
    prestigeReset,
    getSimulator,
    loadFromSave
  }
})
