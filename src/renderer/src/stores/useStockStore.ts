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
import { usePrestigeStore } from './usePrestigeStore'
import { useEventStore } from './useEventStore'

export interface PortfolioPosition {
  assetId: string
  shares: number
  averageBuyPrice: number
  totalInvested: Decimal
}

export const useStockStore = defineStore('stocks', () => {
  /**
   * The sim is ticked every marketUpdateInterval engine ticks (default 50).
   * A game day = 120 engine ticks → effective sim ticks per day = 120/50 = 2.4.
   * This ensures price evolution and dividend timing stay synchronized.
   */
  const MARKET_TICK_INTERVAL = 50
  const simulator = new MarketSimulator(120 / MARKET_TICK_INTERVAL)
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
   * Combined returns multiplier from all sources:
   * skill tree × prestige upgrades × prestige perks × event effects.
   */
  function getStockReturnsMul(): Decimal {
    const upgrades = useUpgradeStore()
    const prestige = usePrestigeStore()
    const events = useEventStore()

    let mult = upgrades.getMultiplier('stock_returns')
    // Prestige upgrades (stock_returns)
    for (const upg of prestige.upgrades) {
      if (upg.level > 0 && upg.effectType === 'stock_returns') {
        mult = mul(mult, 1 + upg.effectValue * upg.level)
      }
    }
    // Prestige perks (stock_returns)
    for (const perk of prestige.perks) {
      if (perk.purchased && perk.effect.type === 'stock_returns') {
        mult = mul(mult, 1 + perk.effect.value)
      }
    }
    // Event multiplier (bull_market / market_crash + global income events)
    const evMul = events.getMultiplier('income_multiplier', 'stocks')
    if (evMul !== 1) mult = mul(mult, evMul)

    return mult
  }

  /**
   * Dividend income per second — used for offline progress calculation.
   * Sum of (shares × currentPrice × annualYield / secondsPerYear) for all held stocks.
   * A game day = 12 real seconds (120 engine ticks / 10 ticks/s).
   */
  const dividendIncomePerSecond = computed(() => {
    const SECONDS_PER_GAME_YEAR = 252 * 12 // 252 trading days × 12 seconds per day at 10 ticks/s
    const returnsMul = getStockReturnsMul()
    let total = ZERO
    for (const pos of portfolio.value) {
      const asset = assets.value.find((a) => a.id === pos.assetId)
      const config = configs.value.find((c) => c.id === pos.assetId)
      if (!asset || !config || !config.dividendYield) continue
      const annualDividend = asset.currentPrice * pos.shares * config.dividendYield
      total = add(total, D(annualDividend / SECONDS_PER_GAME_YEAR))
    }
    // Apply combined stock_returns multiplier (skill tree + prestige + events)
    return mul(total, returnsMul)
  })

  function tick(): void {
    simulator.tick()
    // Merge dailyHistory + priceHistory for seamless long-term charts.
    // Creates new array refs so Vue detects prop changes.
    assets.value = simulator.getAllAssets().map(a => ({
      ...a,
      priceHistory: [...a.dailyHistory, ...a.priceHistory]
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
    const stockReturnsMul = getStockReturnsMul()

    let totalPayout = ZERO
    for (const pos of portfolio.value) {
      const asset = assets.value.find((a) => a.id === pos.assetId)
      const config = configs.value.find((c) => c.id === pos.assetId)
      if (!asset || !config || !config.dividendYield || config.dividendYield <= 0) continue

      const payout = D(asset.currentPrice * pos.shares * config.dividendYield * ticksSinceLastPayout / TICKS_PER_GAME_YEAR)
      totalPayout = add(totalPayout, payout)
    }

    if (totalPayout.gt(0)) {
      // Apply combined stock_returns multiplier (skill tree + prestige + events)
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
    const baseRevenue = D(asset.currentPrice * shareCount)
    const costBasis = D(pos.averageBuyPrice * shareCount)
    const baseProfit = baseRevenue.sub(costBasis)
    // Apply combined stock_returns multiplier (skill tree + prestige + events) to profit
    const multipliedProfit = baseProfit.gt(0) ? mul(baseProfit, getStockReturnsMul()) : baseProfit
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
        // Merge dailyHistory + priceHistory for chart display
        assets.value = simulator.getAllAssets().map(a => ({
          ...a,
          priceHistory: [...a.dailyHistory, ...a.priceHistory]
        }))
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
