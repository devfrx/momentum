/**
 * useInitGame — Initialize game state from saved data on startup
 *
 * This composable loads the saved game from LowDB (via IPC) and
 * restores all Pinia store states before the game loop starts.
 */
import { ref } from 'vue'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useJobStore } from '@renderer/stores/useJobStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useStockStore } from '@renderer/stores/useStockStore'
import { useCryptoStore } from '@renderer/stores/useCryptoStore'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { useStartupStore } from '@renderer/stores/useStartupStore'
import { usePrestigeStore } from '@renderer/stores/usePrestigeStore'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import { useAchievementStore } from '@renderer/stores/useAchievementStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { useEventStore } from '@renderer/stores/useEventStore'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { useDepositStore } from '@renderer/stores/useDepositStore'
import { D, hydrateDecimals, ZERO, add, mul } from '@renderer/core/BigNum'
import { economySim } from '@renderer/core/EconomySim'
import { calculateOfflineProgress, type OfflineSummary } from '@renderer/core/OfflineCalc'
import { Formulas } from '@renderer/core'

// Data imports
import { STOCKS } from '@renderer/data/stocks'
import { CRYPTOS } from '@renderer/data/cryptos'
import { ACHIEVEMENTS } from '@renderer/data/achievements'
import { UPGRADES } from '@renderer/data/upgrades'
import { EVENTS } from '@renderer/data/events'

const initialized = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)
const offlineSummary = ref<OfflineSummary | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SaveData = Record<string, any>

export function useInitGame() {
  async function initGame(): Promise<boolean> {
    if (initialized.value) return true

    loading.value = true
    error.value = null

    try {
      // Get stores
      const player = usePlayerStore()
      const jobs = useJobStore()
      const business = useBusinessStore()
      const stocks = useStockStore()
      const crypto = useCryptoStore()
      const realEstate = useRealEstateStore()
      const startups = useStartupStore()
      const prestige = usePrestigeStore()
      const upgrades = useUpgradeStore()
      const settings = useSettingsStore()
      const achievements = useAchievementStore()
      const gambling = useGamblingStore()
      const events = useEventStore()
      const loanStore = useLoanStore()
      const depositStore = useDepositStore()

      // Initialize static data first (always refresh from source to pick up rebalances)
      // Note: businesses are no longer initialized from static defs — they are created by player action
      if (stocks.assets.length === 0) stocks.initStocks(STOCKS)
      if (crypto.assets.length === 0) crypto.initCryptos(CRYPTOS)
      if (achievements.achievements.length === 0) achievements.initAchievements(ACHIEVEMENTS)
      upgrades.initUpgrades(UPGRADES)
      prestige.initPrestige()
      if (EVENTS.length > 0) events.initEvents(EVENTS)

      // Try to load saved game from disk
      if (!window.api) {
        console.log('[Init] No IPC bridge available (running outside Electron), skipping save load')
        initialized.value = true
        loading.value = false
        return true
      }

      const result = await window.api.loadLocal()

      if (result.success && result.data) {
        const save: SaveData = hydrateDecimals(result.data)
        console.log('[Init] Loading saved game:', save)

        // Restore player state
        if (save.player) {
          player.loadFromSave(save.player)
        }

        // Restore business state (full operational data)
        if (save.businesses && Array.isArray(save.businesses)) {
          business.loadFromSave(save.businesses)
        }

        // Restore jobs state
        if (save.jobs) {
          jobs.loadFromSave(save.jobs)
        }

        // Restore economy simulator
        if (save.economy) {
          economySim.deserialize(save.economy)
        }

        // Restore stock portfolio
        if (save.stockPortfolio && Array.isArray(save.stockPortfolio)) {
          for (const savedPos of save.stockPortfolio) {
            const existingPos = stocks.portfolio.find((p) => p.assetId === savedPos.assetId)
            if (existingPos) {
              existingPos.shares = savedPos.shares ?? 0
              existingPos.averageBuyPrice = savedPos.averageBuyPrice ?? 0
              existingPos.totalInvested = savedPos.totalInvested ?? existingPos.totalInvested
            } else if (savedPos.shares > 0) {
              stocks.portfolio.push({
                assetId: savedPos.assetId,
                shares: savedPos.shares,
                averageBuyPrice: savedPos.averageBuyPrice,
                totalInvested: savedPos.totalInvested
              })
            }
          }
        }

        // Restore stock stats
        if (save.stockStats) {
          if (save.stockStats.totalRealizedProfit !== undefined) {
            stocks.totalRealizedProfit = save.stockStats.totalRealizedProfit
          }
          if (save.stockStats.totalDividendsEarned !== undefined) {
            stocks.totalDividendsEarned = save.stockStats.totalDividendsEarned
          }
        }

        // Restore stock market state
        if (save.stockMarketState) {
          try {
            stocks.getSimulator().deserialize(save.stockMarketState)
            stocks.assets = [...stocks.getSimulator().getAllAssets()]
          } catch (e) {
            console.warn('[Init] Failed to restore stock market state:', e)
          }
        }

        // Restore crypto wallet
        if (save.cryptoWallet && Array.isArray(save.cryptoWallet)) {
          for (const savedHolding of save.cryptoWallet) {
            const existingHolding = crypto.wallet.find((h) => h.assetId === savedHolding.assetId)
            if (existingHolding) {
              existingHolding.amount = savedHolding.amount ?? 0
              existingHolding.averageBuyPrice = savedHolding.averageBuyPrice ?? 0
              existingHolding.totalInvested = savedHolding.totalInvested ?? existingHolding.totalInvested
            } else if (savedHolding.amount > 0) {
              crypto.wallet.push({
                assetId: savedHolding.assetId,
                amount: savedHolding.amount,
                averageBuyPrice: savedHolding.averageBuyPrice,
                totalInvested: savedHolding.totalInvested
              })
            }
          }
        }

        // Restore crypto stats
        if (save.cryptoStats) {
          if (save.cryptoStats.totalRealizedProfit !== undefined) {
            crypto.totalRealizedProfit = save.cryptoStats.totalRealizedProfit
          }
        }

        // Restore crypto market state
        if (save.cryptoMarketState) {
          try {
            crypto.getSimulator().deserialize(save.cryptoMarketState)
            crypto.assets = [...crypto.getSimulator().getAllAssets()]
          } catch (e) {
            console.warn('[Init] Failed to restore crypto market state:', e)
          }
        }

        // Restore real estate
        if (save.realEstate && Array.isArray(save.realEstate)) {
          realEstate.loadFromSave(save.realEstate)
        }

        // Restore startups
        if (save.startups) {
          startups.loadFromSave(save.startups)
        }

        // Restore prestige
        if (save.prestige) {
          prestige.loadFromSave(save.prestige)
        }

        // Restore upgrades
        if (save.upgrades && Array.isArray(save.upgrades)) {
          for (const savedUpgrade of save.upgrades) {
            const upgrade = upgrades.nodes.find((u) => u.id === savedUpgrade.id)
            if (upgrade) {
              upgrade.purchased = savedUpgrade.purchased ?? false
              upgrade.level = savedUpgrade.level ?? (savedUpgrade.purchased ? 1 : 0)
            }
          }
        }

        // Restore settings
        if (save.settings) {
          settings.loadFromSave(save.settings)
        }

        // Restore achievements
        if (save.achievements && Array.isArray(save.achievements)) {
          for (const savedAch of save.achievements) {
            const ach = achievements.achievements.find((a) => a.id === savedAch.id)
            if (ach) {
              ach.unlocked = savedAch.unlocked ?? false
              ach.unlockedAtTick = savedAch.unlockedAtTick ?? null
            }
          }
        }

        // Restore gambling stats
        if (save.gambling) {
          gambling.loadFromSave(save.gambling)
        }

        // Restore loans state
        if (save.loans) {
          loanStore.loadFromSave(save.loans)
        }

        // Restore deposits state
        if (save.deposits) {
          depositStore.loadFromSave(save.deposits)
        }

        // Restore event system state
        if (save.eventState) {
          try {
            events.getSystem().setState(save.eventState)
          } catch (e) {
            console.warn('[Init] Failed to restore event state:', e)
          }
        }

        // Calculate offline progress
        if (save.savedAt && settings.offlineProgress !== false) {
          try {
            // Calculate offline efficiency: base setting + skill tree multiplier + prestige offline_bonus
            let offlineEff = settings.offlineEfficiency ?? 0.5
            // Apply offline_efficiency skill tree multiplier
            offlineEff *= upgrades.getMultiplier('offline_efficiency').toNumber()
            // Apply prestige offline_bonus (additive per level)
            for (const upg of prestige.upgrades) {
              if (upg.level > 0 && upg.effectType === 'offline_bonus') {
                offlineEff += upg.effectValue * upg.level
              }
            }
            // Cap at 100%
            offlineEff = Math.min(offlineEff, 1.0)

            const summary = calculateOfflineProgress(
              save.savedAt,
              Date.now(),
              {
                jobs: jobs.jobIncomePerSecond,
                business: business.profitPerSecond,
                realEstate: realEstate.rentPerSecond,
                dividends: D(0),
                depositInterest: depositStore.interestPerSecond,
                loanInterest: loanStore.totalInterestPerSecond,
              },
              {
                efficiency: offlineEff,
                maxHours: settings.offlineMaxHours ?? 24
              }
            )

            if (summary) {
              // Check if anything meaningful happened offline
              const hasAnything = summary.cashEarned.gt(0) ||
                summary.depositInterest.gt(0) ||
                summary.loanInterestPaid.gt(0)

              // Apply cash earnings (jobs + business + real estate + dividends)
              if (summary.cashEarned.gt(0)) {
                player.earnCash(summary.cashEarned)
              }

              // Apply deposit interest (add to deposit balances)
              if (summary.depositInterest.gt(0)) {
                for (const dep of depositStore.deposits) {
                  const ratio = dep.currentBalance.div(depositStore.totalLockedBalance.gt(0) ? depositStore.totalLockedBalance : D(1))
                  const share = mul(summary.depositInterest, ratio)
                  dep.currentBalance = add(dep.currentBalance, share)
                  dep.totalInterestEarned = add(dep.totalInterestEarned, share)
                }
              }

              // Apply loan interest (add to loan remaining balances)
              if (summary.loanInterestPaid.gt(0)) {
                for (const loan of loanStore.loans) {
                  const ratio = loan.remaining.div(loanStore.totalDebt.gt(0) ? loanStore.totalDebt : D(1))
                  const share = mul(summary.loanInterestPaid, ratio)
                  loan.remaining = add(loan.remaining, share)
                  loan.totalInterestPaid = add(loan.totalInterestPaid, share)
                }
              }

              // Store summary for the offline dialog (only if something happened)
              if (hasAnything) {
                offlineSummary.value = summary
              }
              console.log(`[Init] Offline earnings: ${summary.cashEarned.toString()} (${summary.timeAwayFormatted} away)`)
              console.log(`[Init] Offline deposits interest: ${summary.depositInterest.toString()}`)
              console.log(`[Init] Offline loan interest: ${summary.loanInterestPaid.toString()}`)
            }
          } catch (e) {
            console.warn('[Init] Failed to calculate offline progress:', e)
          }
        }

        console.log('[Init] Game state restored successfully')
      } else {
        console.log('[Init] No save found, starting fresh game')
      }

      // Compute net worth immediately so business unlock filters work on first render
      {
        const portfolioValue = add(stocks.totalPortfolioValue ?? ZERO, crypto.totalWalletValue ?? ZERO)
        const propertyValue = realEstate.totalPropertyValue ?? ZERO
        const startupValue = startups.totalInvested ?? ZERO
        const depositValue = depositStore.totalLockedBalance ?? ZERO
        player.netWorth = Formulas.calculateNetWorth(
          player.cash,
          business.totalBusinessValue,
          portfolioValue,
          propertyValue,
          add(startupValue, depositValue),
          loanStore.totalDebt
        )
      }

      initialized.value = true
      loading.value = false
      return true
    } catch (err) {
      console.error('[Init] Failed to load game:', err)
      error.value = String(err)
      loading.value = false
      // Still mark as initialized so the game can run
      initialized.value = true
      return false
    }
  }

  return {
    initialized,
    loading,
    error,
    offlineSummary,
    initGame
  }
}
