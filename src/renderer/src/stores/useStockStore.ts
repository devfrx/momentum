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

  function initStocks(configs: AssetConfig[]): void {
    for (const config of configs) {
      simulator.registerAsset(config)
    }
    assets.value = simulator.getAllAssets()
  }

  function tick(): void {
    simulator.tick()
    // Spread each asset with a copied priceHistory to ensure Vue detects prop changes
    assets.value = simulator.getAllAssets().map(a => ({
      ...a,
      priceHistory: a.priceHistory.slice()
    }))
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
    // Apply stock_returns skill multiplier to revenue
    const revenue = mul(baseRevenue, upgrades.getMultiplier('stock_returns'))
    const costBasis = D(pos.averageBuyPrice * shareCount)
    const profit = sub(revenue, costBasis)
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

  return {
    portfolio,
    assets,
    totalRealizedProfit,
    totalDividendsEarned,
    unrealizedProfit,
    totalPortfolioValue,
    initStocks,
    tick,
    buyShares,
    sellShares,
    getPosition,
    prestigeReset,
    getSimulator
  }
})
