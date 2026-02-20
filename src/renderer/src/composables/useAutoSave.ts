/**
 * useAutoSave — Auto-save composable
 *
 * Periodically saves game state to LowDB via IPC.
 * Also saves on window close / visibility change.
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useJobStore } from '@renderer/stores/useJobStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useStockStore } from '@renderer/stores/useStockStore'
import { useCryptoStore } from '@renderer/stores/useCryptoStore'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { useStartupStore } from '@renderer/stores/useStartupStore'
import { usePrestigeStore } from '@renderer/stores/usePrestigeStore'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { useAchievementStore } from '@renderer/stores/useAchievementStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { useEventStore } from '@renderer/stores/useEventStore'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { useDepositStore } from '@renderer/stores/useDepositStore'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { useShopStore } from '@renderer/stores/useShopStore'
import { gameEngine } from '@renderer/core/GameEngine'
import { economySim } from '@renderer/core/EconomySim'
import { dehydrateDecimals } from '@renderer/core/BigNum'

/** Module-level flag to prevent auto-save during hard reset */
let _resetting = false

/** Set this before calling resetSave to prevent the beforeunload save from overwriting */
export function setResetting(value: boolean): void {
  _resetting = value
}

export function useAutoSave() {
  const lastSaveTime = ref<number>(Date.now())
  const saving = ref(false)
  const saveError = ref<string | null>(null)
  let intervalId: ReturnType<typeof setInterval> | null = null

  async function save(): Promise<boolean> {
    if (_resetting) return false
    if (saving.value) return false
    if (!window.api) return false
    saving.value = true
    saveError.value = null

    try {
      // Collect state from all stores and serialize
      const state = collectGameState()
      const result = await window.api.saveLocal(state)

      if (result.success) {
        lastSaveTime.value = Date.now()
        saving.value = false
        return true
      } else {
        saveError.value = result.error ?? 'Unknown save error'
        saving.value = false
        return false
      }
    } catch (error) {
      saveError.value = String(error)
      saving.value = false
      return false
    }
  }

  function collectGameState(): Record<string, unknown> {
    // Import all stores
    const player = usePlayerStore()
    const settings = useSettingsStore()
    const jobs = useJobStore()
    const business = useBusinessStore()
    const stocks = useStockStore()
    const crypto = useCryptoStore()
    const realEstate = useRealEstateStore()
    const startups = useStartupStore()
    const prestige = usePrestigeStore()
    const upgrades = useUpgradeStore()
    const achievements = useAchievementStore()
    const gambling = useGamblingStore()
    const events = useEventStore()
    const loanStore = useLoanStore()
    const depositStore = useDepositStore()
    const storageStore = useStorageStore()
    const blackmarketStore = useBlackMarketStore()
    const vaultStore = useVaultStore()
    const shopStore = useShopStore()

    return dehydrateDecimals({
      version: 3,
      savedAt: Date.now(),
      totalTicks: gameEngine.currentTick,
      totalPlayTime: gameEngine.elapsedTime,
      
      // Player state (use prestige store as authoritative source for prestige fields)
      player: {
        cash: player.cash,
        totalCashEarned: player.totalCashEarned,
        totalCashSpent: player.totalCashSpent,
        prestigePoints: prestige.points,
        rebirthCount: prestige.rebirthCount,
        level: player.level,
        xp: player.xp,
        xpToNextLevel: player.xpToNextLevel,
        netWorth: player.netWorth,
      },

      // Jobs state
      jobs: {
        unlockedJobs: jobs.unlockedJobs,
      },

      // Economy simulator state
      economy: economySim.serialize(),

      // Business state (full operational data)
      businesses: business.businesses,

      // Stocks portfolio state
      stockPortfolio: stocks.portfolio.map(p => ({
        assetId: p.assetId,
        shares: p.shares,
        averageBuyPrice: p.averageBuyPrice,
        totalInvested: p.totalInvested
      })),
      stockStats: {
        totalRealizedProfit: stocks.totalRealizedProfit,
        totalDividendsEarned: stocks.totalDividendsEarned
      },
      stockMarketState: stocks.getSimulator().serialize(),

      // Crypto wallet state
      cryptoWallet: crypto.wallet.map(h => ({
        assetId: h.assetId,
        amount: h.amount,
        averageBuyPrice: h.averageBuyPrice,
        totalInvested: h.totalInvested
      })),
      cryptoStats: {
        totalRealizedProfit: crypto.totalRealizedProfit,
        totalStakingEarned: crypto.totalStakingEarned
      },
      cryptoMarketState: crypto.getSimulator().serialize(),

      // Real estate state (use exportState for full state including opportunities)
      realEstate: realEstate.exportState(),

      // Startups state (use exportState for full state including opportunities)
      startups: startups.exportState(),

      // Prestige state
      prestige: {
        points: prestige.points,
        totalPointsEarned: prestige.totalPointsEarned,
        rebirthCount: prestige.rebirthCount,
        upgrades: prestige.upgrades.map(u => ({
          id: u.id,
          level: u.level
        })),
        milestones: prestige.milestones.map(m => ({
          id: m.id,
          unlocked: m.unlocked,
          unlockedAtTick: m.unlockedAtTick
        })),
        perks: prestige.perks.map(p => ({
          id: p.id,
          purchased: p.purchased,
          purchasedAtTick: p.purchasedAtTick
        }))
      },

      // Upgrade tree state
      upgrades: upgrades.nodes.map(u => ({
        id: u.id,
        level: u.level,
        maxLevel: u.maxLevel,
        purchased: u.purchased
      })),

      // Achievement state
      achievements: achievements.achievements.map(a => ({
        id: a.id,
        unlocked: a.unlocked,
        unlockedAtTick: a.unlockedAtTick
      })),

      // Gambling state
      gambling: {
        totalBet: gambling.totalBet,
        totalWon: gambling.totalWon,
        totalLost: gambling.totalLost,
        gamesPlayed: gambling.gamesPlayed,
        biggestWin: gambling.biggestWin,
        biggestLoss: gambling.biggestLoss,
        gameStats: gambling.gameStats,
        divineAbilities: gambling.divineAbilities,
        lotteryWins: gambling.lotteryWins
      },

      // Loans state
      loans: {
        loans: loanStore.loans.map(l => ({
          id: l.id,
          loanDefId: l.loanDefId,
          principal: l.principal,
          remaining: l.remaining,
          effectiveRate: l.effectiveRate,
          minPaymentPerTick: l.minPaymentPerTick,
          totalPaid: l.totalPaid,
          totalInterestPaid: l.totalInterestPaid,
          principalPaid: l.principalPaid,
          startTick: l.startTick,
          ticksActive: l.ticksActive,
          termTicks: l.termTicks,
          collateralType: l.collateralType,
          collateralId: l.collateralId,
          collateralLocked: l.collateralLocked,
          ticksSinceLastPayment: l.ticksSinceLastPayment,
          ticksLate: l.ticksLate,
          isDefaulted: l.isDefaulted,
          onTimePayments: l.onTimePayments,
          latePayments: l.latePayments,
          missedPayments: l.missedPayments
        })),
        creditScore: loanStore.creditScore,
        creditScoreFactors: loanStore.creditScoreFactors,
        loanHistory: loanStore.loanHistory,
        totalTicksWithCredit: loanStore.totalTicksWithCredit,
        recentApplications: loanStore.recentApplications,
        totalLoansTaken: loanStore.totalLoansTaken,
        totalLoansRepaidOnTime: loanStore.totalLoansRepaidOnTime,
        totalLoansDefaulted: loanStore.totalLoansDefaulted,
        totalInterestPaidEver: loanStore.totalInterestPaidEver
      },

      // Deposits state
      deposits: {
        deposits: depositStore.deposits.map(d => ({
          id: d.id,
          depositDefId: d.depositDefId,
          principal: d.principal,
          currentBalance: d.currentBalance,
          totalInterestEarned: d.totalInterestEarned,
          effectiveAPY: d.effectiveAPY,
          startTick: d.startTick,
          termTicks: d.termTicks,
          ticksActive: d.ticksActive,
          matured: d.matured,
          loyaltyActive: d.loyaltyActive,
          ticksSinceLastCompound: d.ticksSinceLastCompound,
          totalCompounds: d.totalCompounds,
          closed: d.closed,
          loyaltyTicks: d.loyaltyTicks
        })),
        depositHistory: depositStore.depositHistory,
        totalDeposited: depositStore.totalDeposited,
        totalInterestEarnedEver: depositStore.totalInterestEarnedEver,
        totalDepositsOpened: depositStore.totalDepositsOpened,
        totalDepositsMatured: depositStore.totalDepositsMatured,
        totalEarlyWithdrawals: depositStore.totalEarlyWithdrawals
      },

      // Event system state
      eventState: events.getSystem().getState(),

      // Storage Wars state
      storage: storageStore.exportState(),

      // Black Market state
      blackmarket: blackmarketStore.exportState(),

      // Vault state
      vault: vaultStore.exportState(),

      // Shop state
      shop: shopStore.exportState(),

      // Settings
      settings: {
        locale: settings.locale,
        autoSaveInterval: settings.autoSaveInterval,
        offlineEfficiency: settings.offlineEfficiency,
        offlineMaxHours: settings.offlineMaxHours,
        offlineProgress: settings.offlineProgress,
        soundVolume: settings.soundVolume,
        musicVolume: settings.musicVolume,
        notificationsEnabled: settings.notificationsEnabled,
        numberFormat: settings.numberFormat,
        theme: settings.theme,
        animationSpeed: settings.animationSpeed,
        lotteryDrawSpeed: settings.lotteryDrawSpeed,
        lotteryMultiDraw: settings.lotteryMultiDraw,
        cloudSaveEnabled: settings.cloudSaveEnabled,
        gistId: settings.gistId,
        buyAmount: settings.buyAmount,
        confirmPrestige: settings.confirmPrestige,
        showTooltips: settings.showTooltips,
        particleEffects: settings.particleEffects,
        confirmBigPurchases: settings.confirmBigPurchases,
        bigPurchaseThreshold: settings.bigPurchaseThreshold,
        marketUpdateInterval: settings.marketUpdateInterval,
        pinnedStockId: settings.pinnedStockId,
        pinnedCryptoId: settings.pinnedCryptoId
      }
    })
  }

  function startAutoSave(): void {
    const settings = useSettingsStore()

    // Clear existing interval
    if (intervalId) clearInterval(intervalId)

    intervalId = setInterval(() => {
      save()
    }, settings.autoSaveInterval * 1000)

    // Re-setup interval when settings change
    watch(() => settings.autoSaveInterval, (newInterval) => {
      if (intervalId) clearInterval(intervalId)
      intervalId = setInterval(() => {
        save()
      }, newInterval * 1000)
    })
  }

  function stopAutoSave(): void {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  // Save on page hide (Electron window minimize/close)
  function handleVisibilityChange(): void {
    if (document.hidden) {
      save()
    }
  }

  function handleBeforeUnload(): void {
    // Use synchronous IPC to guarantee the save completes before the page unloads.
    // Async save() cannot finish in time because the browser may abort it.
    if (_resetting || !window.api?.saveLocalSync) {
      // Fallback: attempt async save (best-effort)
      save()
      return
    }
    try {
      // Collect state and write synchronously — a single sendSync call
      // ensures the main process updates + writes atomically before the
      // page is torn down.  The previous two-step approach (async invoke
      // followed by sendSync) was racy: sendSync could fire before the
      // async invoke handler ran updateGameState(), writing stale data.
      const state = collectGameState()
      window.api.saveLocalSync(state)
    } catch (e) {
      console.error('[AutoSave] Sync save on beforeunload failed:', e)
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    // Save before unload
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Electron-specific: save when the main process signals the window is about to close
    if (window.api?.onBeforeClose) {
      window.api.onBeforeClose(() => {
        save()
      })
    }
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('beforeunload', handleBeforeUnload)
    stopAutoSave()
  })

  return {
    lastSaveTime,
    saving,
    saveError,
    save,
    startAutoSave,
    stopAutoSave
  }
}
