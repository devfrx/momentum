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
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { useShopStore } from '@renderer/stores/useShopStore'
import { hydrateDecimals, ZERO, add, mul } from '@renderer/core/BigNum'
import { economySim } from '@renderer/core/EconomySim'
import { gameEngine } from '@renderer/core/GameEngine'
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
      const storageStore = useStorageStore()
      const blackmarketStore = useBlackMarketStore()
      const vaultStore = useVaultStore()
      const shopStore = useShopStore()

      // Initialize static data first (always refresh from source to pick up rebalances)
      // Note: businesses are no longer initialized from static defs — they are created by player action
      if (stocks.assets.length === 0) stocks.initStocks(STOCKS)
      if (crypto.assets.length === 0) crypto.initCryptos(CRYPTOS)
      if (achievements.achievements.length === 0) achievements.initAchievements(ACHIEVEMENTS)
      upgrades.initUpgrades(UPGRADES)
      prestige.initPrestige()
      if (EVENTS.length > 0) events.initEvents(EVENTS)
      shopStore.initShop(gameEngine.currentTick)

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

        // Restore GameEngine tick counter and total play time so that
        // tick-relative logic (real-estate appreciation, startup maturity, etc.)
        // continues seamlessly after reload instead of resetting to 0.
        if (typeof save.totalTicks === 'number' || typeof save.totalPlayTime === 'number') {
          gameEngine.restore(save.totalTicks ?? 0, save.totalPlayTime ?? 0)
        }

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

        // Restore stock state (portfolio, stats, market simulator)
        stocks.loadFromSave({
          stockPortfolio: save.stockPortfolio,
          stockStats: save.stockStats,
          stockMarketState: save.stockMarketState
        })

        // Restore crypto state (wallet, stats, market simulator)
        crypto.loadFromSave({
          cryptoWallet: save.cryptoWallet,
          cryptoStats: save.cryptoStats,
          cryptoMarketState: save.cryptoMarketState
        })

        // Restore real estate (handles both old array format and new object format)
        if (save.realEstate) {
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

        // Sync player store prestige fields from the authoritative prestige store
        player.prestigePoints = prestige.points
        player.rebirthCount = prestige.rebirthCount

        // Restore upgrades
        if (save.upgrades && Array.isArray(save.upgrades)) {
          upgrades.loadFromSave(save.upgrades)
        }

        // Restore settings
        if (save.settings) {
          settings.loadFromSave(save.settings)
        }

        // Restore achievements
        if (save.achievements && Array.isArray(save.achievements)) {
          achievements.loadFromSave(save.achievements)
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

        // Restore storage wars state
        if (save.storage) {
          storageStore.loadFromSave(save.storage)
        }

        // Restore black market state
        if (save.blackmarket) {
          blackmarketStore.loadFromSave(save.blackmarket as Record<string, unknown>)
        }

        // Restore vault state
        if (save.vault) {
          vaultStore.loadFromSave(save.vault as Record<string, unknown>)
        }

        // Restore shop state
        if (save.shop) {
          shopStore.loadFromSave(save.shop as Record<string, unknown>)
        }

        // Restore event system state
        if (save.eventState) {
          events.loadFromSave(save.eventState)
        }

        // Calculate offline progress
        if (save.savedAt && settings.offlineProgress !== false) {
          try {
            // Calculate offline efficiency: base setting + skill tree multiplier + prestige offline_bonus
            let offlineEff = settings.offlineEfficiency ?? 0.5
            // Apply offline_efficiency skill tree multiplier
            offlineEff *= upgrades.getMultiplier('offline_efficiency').toNumber()
            // Apply prestige offline_bonus (additive per level)
            offlineEff += prestige.getTotalEffect('offline_bonus')
            // Cap at 100%
            offlineEff = Math.min(offlineEff, 1.0)

            const summary = calculateOfflineProgress(
              save.savedAt,
              Date.now(),
              {
                jobs: jobs.jobIncomePerSecond,
                business: business.profitPerSecond,
                realEstate: realEstate.rentPerSecond,
                dividends: stocks.dividendIncomePerSecond,
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

              // Apply deposit interest (add to deposit balances, weighted by balance × APY)
              if (summary.depositInterest.gt(0)) {
                let totalWeight = ZERO
                for (const dep of depositStore.deposits) {
                  totalWeight = add(totalWeight, mul(dep.currentBalance, dep.effectiveAPY))
                }
                if (totalWeight.gt(0)) {
                  for (const dep of depositStore.deposits) {
                    const weight = mul(dep.currentBalance, dep.effectiveAPY)
                    const ratio = weight.div(totalWeight)
                    const share = mul(summary.depositInterest, ratio)
                    dep.currentBalance = add(dep.currentBalance, share)
                    dep.totalInterestEarned = add(dep.totalInterestEarned, share)
                  }
                }
              }

              // Apply loan interest (add to loan remaining balances, weighted by remaining × rate)
              if (summary.loanInterestPaid.gt(0)) {
                let totalWeight = ZERO
                for (const loan of loanStore.loans) {
                  totalWeight = add(totalWeight, mul(loan.remaining, loan.effectiveRate))
                }
                if (totalWeight.gt(0)) {
                  for (const loan of loanStore.loans) {
                    const weight = mul(loan.remaining, loan.effectiveRate)
                    const ratio = weight.div(totalWeight)
                    const share = mul(summary.loanInterestPaid, ratio)
                    loan.remaining = add(loan.remaining, share)
                    loan.totalInterestPaid = add(loan.totalInterestPaid, share)
                  }
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
