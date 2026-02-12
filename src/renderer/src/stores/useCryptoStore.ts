/**
 * useCryptoStore — Crypto market (higher volatility variant of stocks)
 */
import { defineStore } from 'pinia'
import { shallowRef, ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, gte } from '@renderer/core/BigNum'
import { MarketSimulator, type AssetConfig, type AssetState } from '@renderer/core/MarketSim'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'

export interface CryptoHolding {
  assetId: string
  amount: number
  averageBuyPrice: number
  totalInvested: Decimal
}

export const useCryptoStore = defineStore('crypto', () => {
  const simulator = new MarketSimulator()
  const wallet = ref<CryptoHolding[]>([])
  const assets = shallowRef<AssetState[]>([])
  const totalRealizedProfit = ref<Decimal>(ZERO)

  const totalWalletValue = computed(() => {
    let total = ZERO
    for (const h of wallet.value) {
      const asset = assets.value.find((a) => a.id === h.assetId)
      if (!asset) continue
      total = add(total, D(asset.currentPrice * h.amount))
    }
    return total
  })

  const unrealizedProfit = computed(() => {
    let total = ZERO
    for (const h of wallet.value) {
      const asset = assets.value.find((a) => a.id === h.assetId)
      if (!asset) continue
      const currentValue = D(asset.currentPrice * h.amount)
      const profit = sub(currentValue, h.totalInvested)
      total = add(total, profit)
    }
    return total
  })

  function initCryptos(configs: AssetConfig[]): void {
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

  function buyCrypto(assetId: string, amount: number): Decimal | null {
    const asset = assets.value.find((a) => a.id === assetId)
    if (!asset || amount <= 0) return null

    const player = usePlayerStore()
    const cost = D(asset.currentPrice * amount)
    
    // Check and spend cash
    if (!gte(player.cash, cost)) return null
    if (!player.spendCash(cost)) return null
    
    const existing = wallet.value.find((h) => h.assetId === assetId)

    if (existing) {
      const totalAmount = existing.amount + amount
      existing.averageBuyPrice =
        (existing.averageBuyPrice * existing.amount + asset.currentPrice * amount) / totalAmount
      existing.amount = totalAmount
      existing.totalInvested = add(existing.totalInvested, cost)
    } else {
      wallet.value.push({
        assetId,
        amount,
        averageBuyPrice: asset.currentPrice,
        totalInvested: cost
      })
    }

    // XP for trading
    player.addXp(D(5))

    return cost
  }

  function sellCrypto(assetId: string, amount: number): Decimal | null {
    const holding = wallet.value.find((h) => h.assetId === assetId)
    if (!holding || holding.amount < amount) return null

    const asset = assets.value.find((a) => a.id === assetId)
    if (!asset) return null

    const player = usePlayerStore()
    const upgrades = useUpgradeStore()
    const baseRevenue = D(asset.currentPrice * amount)
    // Apply crypto_returns skill multiplier to revenue
    const revenue = mul(baseRevenue, upgrades.getMultiplier('crypto_returns'))
    const costBasis = D(holding.averageBuyPrice * amount)
    totalRealizedProfit.value = add(totalRealizedProfit.value, sub(revenue, costBasis))
    
    // Add revenue to player cash
    player.earnCash(revenue)

    holding.amount -= amount
    holding.totalInvested = sub(holding.totalInvested, costBasis)

    if (holding.amount <= 0) {
      wallet.value = wallet.value.filter((h) => h.assetId !== assetId)
    }

    // XP for selling crypto (more if profitable)
    const profit = sub(revenue, costBasis)
    player.addXp(profit.gt(0) ? D(15) : D(3))

    return revenue
  }

  function prestigeReset(): void {
    wallet.value = []
    totalRealizedProfit.value = ZERO
  }

  function getHolding(assetId: string): CryptoHolding | undefined {
    return wallet.value.find((h) => h.assetId === assetId)
  }

  function getSimulator(): MarketSimulator { return simulator }

  return {
    wallet, assets, totalRealizedProfit, totalWalletValue, unrealizedProfit,
    initCryptos, tick, buyCrypto, sellCrypto, getHolding, prestigeReset, getSimulator
  }
})
