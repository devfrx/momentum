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
import { usePrestigeStore } from './usePrestigeStore'
import { useEventStore } from './useEventStore'

export interface CryptoHolding {
  assetId: string
  amount: number
  averageBuyPrice: number
  totalInvested: Decimal
}

export const useCryptoStore = defineStore('crypto', () => {
  /**
   * Sim ticked every marketUpdateInterval engine ticks (default 50).
   * Game day = 120 engine ticks → effective sim ticks/day = 120/50 = 2.4.
   */
  const MARKET_TICK_INTERVAL = 50
  const simulator = new MarketSimulator(120 / MARKET_TICK_INTERVAL)
  const configs = ref<AssetConfig[]>([])
  const wallet = ref<CryptoHolding[]>([])
  const assets = shallowRef<AssetState[]>([])
  const totalRealizedProfit = ref<Decimal>(ZERO)
  const totalStakingEarned = ref<Decimal>(ZERO)

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

  function initCryptos(cryptoConfigs: AssetConfig[]): void {
    configs.value = cryptoConfigs
    for (const config of cryptoConfigs) {
      simulator.registerAsset(config)
    }
    assets.value = simulator.getAllAssets()
  }

  function tick(): void {
    simulator.tick()
    // Merge dailyHistory + priceHistory for seamless long-term charts.
    // Creates new array refs so Vue detects prop changes.
    assets.value = simulator.getAllAssets().map(a => ({
      ...a,
      priceHistory: [...a.dailyHistory, ...a.priceHistory]
    }))
  }

  // ─── Combined returns multiplier ──────────────────────────────

  /**
   * Combined returns multiplier from all sources:
   * skill tree × prestige upgrades × prestige perks × event effects.
   */
  function getCryptoReturnsMul(): Decimal {
    const upgrades = useUpgradeStore()
    const prestige = usePrestigeStore()
    const events = useEventStore()

    let mult = upgrades.getMultiplier('crypto_returns')
    // Prestige upgrades (crypto_returns)
    for (const upg of prestige.upgrades) {
      if (upg.level > 0 && upg.effectType === 'crypto_returns') {
        mult = mul(mult, 1 + upg.effectValue * upg.level)
      }
    }
    // Prestige perks (crypto_returns)
    for (const perk of prestige.perks) {
      if (perk.purchased && perk.effect.type === 'crypto_returns') {
        mult = mul(mult, 1 + perk.effect.value)
      }
    }
    // Event multiplier (crypto_boom / crypto_winter + global income events)
    const evMul = events.getMultiplier('income_multiplier', 'crypto')
    if (evMul !== 1) mult = mul(mult, evMul)

    return mult
  }

  // ─── Staking yield ────────────────────────────────────────────

  /**
   * Staking income per second — analogous to stock dividends.
   * Sum of (amount × currentPrice × stakingYield / secondsPerYear) for staked crypto.
   */
  const stakingIncomePerSecond = computed(() => {
    const SECONDS_PER_GAME_YEAR = 252 * 12
    const returnsMul = getCryptoReturnsMul()
    let total = ZERO
    for (const h of wallet.value) {
      const asset = assets.value.find((a) => a.id === h.assetId)
      const config = configs.value.find((c) => c.id === h.assetId)
      if (!asset || !config || !config.stakingYield) continue
      const annualStaking = asset.currentPrice * h.amount * config.stakingYield
      total = add(total, D(annualStaking / SECONDS_PER_GAME_YEAR))
    }
    return mul(total, returnsMul)
  })

  /**
   * Pay staking rewards to the player for all held positions.
   * Called from game loop at a configurable interval (e.g. every 100 ticks = 10s).
   * @param ticksSinceLastPayout Number of engine ticks since last staking payout
   */
  function payStakingRewards(ticksSinceLastPayout: number): void {
    if (wallet.value.length === 0) return
    const TICKS_PER_GAME_YEAR = 252 * 120 // 252 trading days × 120 ticks/day
    const player = usePlayerStore()
    const cryptoReturnsMul = getCryptoReturnsMul()

    let totalPayout = ZERO
    for (const h of wallet.value) {
      const asset = assets.value.find((a) => a.id === h.assetId)
      const config = configs.value.find((c) => c.id === h.assetId)
      if (!asset || !config || !config.stakingYield || config.stakingYield <= 0) continue

      const payout = D(asset.currentPrice * h.amount * config.stakingYield * ticksSinceLastPayout / TICKS_PER_GAME_YEAR)
      totalPayout = add(totalPayout, payout)
    }

    if (totalPayout.gt(0)) {
      const adjustedPayout = mul(totalPayout, cryptoReturnsMul)
      player.earnCash(adjustedPayout)
      totalStakingEarned.value = add(totalStakingEarned.value, adjustedPayout)
    }
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
    const baseRevenue = D(asset.currentPrice * amount)
    const costBasis = D(holding.averageBuyPrice * amount)
    const baseProfit = baseRevenue.sub(costBasis)
    // Apply combined crypto_returns multiplier (skill tree + prestige + events) to profit
    const multipliedProfit = baseProfit.gt(0) ? mul(baseProfit, getCryptoReturnsMul()) : baseProfit
    const revenue = baseRevenue.add(multipliedProfit.sub(baseProfit))
    totalRealizedProfit.value = add(totalRealizedProfit.value, multipliedProfit)
    
    // Add revenue to player cash
    player.earnCash(revenue)

    holding.amount -= amount
    holding.totalInvested = sub(holding.totalInvested, costBasis)

    if (holding.amount <= 0) {
      wallet.value = wallet.value.filter((h) => h.assetId !== assetId)
    }

    // XP for selling crypto (more if profitable)
    const profit = multipliedProfit
    player.addXp(profit.gt(0) ? D(15) : D(3))

    return revenue
  }

  function prestigeReset(): void {
    wallet.value = []
    totalRealizedProfit.value = ZERO
    totalStakingEarned.value = ZERO
  }

  function getHolding(assetId: string): CryptoHolding | undefined {
    return wallet.value.find((h) => h.assetId === assetId)
  }

  function getSimulator(): MarketSimulator { return simulator }

  /** Restore crypto state from saved data */
  function loadFromSave(saved: {
    cryptoWallet?: Array<{ assetId: string; amount: number; averageBuyPrice: number; totalInvested: Decimal }>
    cryptoStats?: { totalRealizedProfit?: Decimal }
    cryptoMarketState?: unknown
  }): void {
    // Restore wallet holdings
    if (saved.cryptoWallet && Array.isArray(saved.cryptoWallet)) {
      for (const savedHolding of saved.cryptoWallet) {
        const existing = wallet.value.find((h) => h.assetId === savedHolding.assetId)
        if (existing) {
          existing.amount = savedHolding.amount ?? 0
          existing.averageBuyPrice = savedHolding.averageBuyPrice ?? 0
          existing.totalInvested = savedHolding.totalInvested ?? existing.totalInvested
        } else if (savedHolding.amount > 0) {
          wallet.value.push({
            assetId: savedHolding.assetId,
            amount: savedHolding.amount,
            averageBuyPrice: savedHolding.averageBuyPrice,
            totalInvested: savedHolding.totalInvested
          })
        }
      }
    }
    // Restore stats
    if (saved.cryptoStats) {
      if (saved.cryptoStats.totalRealizedProfit !== undefined) {
        totalRealizedProfit.value = saved.cryptoStats.totalRealizedProfit
      }
      if ((saved.cryptoStats as Record<string, unknown>).totalStakingEarned !== undefined) {
        totalStakingEarned.value = (saved.cryptoStats as Record<string, unknown>).totalStakingEarned as Decimal
      }
    }
    // Restore market simulator state
    if (saved.cryptoMarketState) {
      try {
        simulator.deserialize(saved.cryptoMarketState as Parameters<MarketSimulator['deserialize']>[0])
        // Merge dailyHistory + priceHistory for chart display
        assets.value = simulator.getAllAssets().map(a => ({
          ...a,
          priceHistory: [...a.dailyHistory, ...a.priceHistory]
        }))
      } catch (e) {
        console.warn('[CryptoStore] Failed to restore market state:', e)
      }
    }
  }

  return {
    configs, wallet, assets, totalRealizedProfit, totalStakingEarned,
    totalWalletValue, unrealizedProfit, stakingIncomePerSecond,
    initCryptos, tick, buyCrypto, sellCrypto, payStakingRewards,
    getHolding, prestigeReset, getSimulator, loadFromSave
  }
})
