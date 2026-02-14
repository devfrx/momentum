/**
 * useGameLoop — Composable that subscribes Vue components to the game engine tick
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { gameEngine, type TickContext } from '@renderer/core/GameEngine'
import { D, ZERO, add } from '@renderer/core/BigNum'
import { Formulas } from '@renderer/core'
import { economySim } from '@renderer/core/EconomySim'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useJobStore } from '@renderer/stores/useJobStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useStockStore } from '@renderer/stores/useStockStore'
import { useCryptoStore } from '@renderer/stores/useCryptoStore'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { useStartupStore } from '@renderer/stores/useStartupStore'
import { useEventStore } from '@renderer/stores/useEventStore'
import { usePrestigeStore } from '@renderer/stores/usePrestigeStore'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { useAchievementStore } from '@renderer/stores/useAchievementStore'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { useDepositStore } from '@renderer/stores/useDepositStore'
import { useStorageStore } from '@renderer/stores/useStorageStore'


// Data imports
import { STOCKS } from '@renderer/data/stocks'
import { CRYPTOS } from '@renderer/data/cryptos'
import { EVENTS } from '@renderer/data/events'
import { ACHIEVEMENTS } from '@renderer/data/achievements'
import { UPGRADES } from '@renderer/data/upgrades'

/**
 * Master game loop composable — call once in App.vue.
 * Subscribes all game systems to the engine tick.
 */
export function useGameLoop() {
  const tickCount = ref(0)
  const totalPlayTime = ref(0)

  function startLoop(): void {
    if (gameEngine.running) return

    const player = usePlayerStore()
    const jobs = useJobStore()
    const business = useBusinessStore()
    const stocks = useStockStore()
    const crypto = useCryptoStore()
    const realEstate = useRealEstateStore()
    const startups = useStartupStore()
    const events = useEventStore()
    const prestige = usePrestigeStore()
    const upgrades = useUpgradeStore()
    const achievements = useAchievementStore()
    const gambling = useGamblingStore()
    const loans = useLoanStore()
    const deposits = useDepositStore()
    const storage = useStorageStore()

    // ─── Initialize game data from static definitions ───────────
    if (stocks.assets.length === 0) {
      stocks.initStocks(STOCKS)
    }
    if (crypto.assets.length === 0) {
      crypto.initCryptos(CRYPTOS)
    }
    if (EVENTS.length > 0) {
      events.initEvents(EVENTS)
    }
    if (achievements.achievements.length === 0) {
      achievements.initAchievements(ACHIEVEMENTS)
    }
    if (upgrades.nodes.length === 0) {
      upgrades.initUpgrades(UPGRADES)
    }
    prestige.initPrestige()

    // ─── Economy simulation (macro) ──────────────────────────────
    gameEngine.subscribe('economy', () => {
      economySim.tick()
    })

    // ─── Jobs (gig income — replaces clicks) ─────────────────────
    gameEngine.subscribe('jobs', () => {
      jobs.tick()
    })

    // ─── Businesses (operational P&L) ────────────────────────────
    gameEngine.subscribe('businesses', (ctx: TickContext) => {
      // Business tick handles its own earnCash/spendCash internally
      business.tick(ctx)
    })

    // ─── Loan interest accrual ───────────────────────────────────
    gameEngine.subscribe('loans', () => {
      loans.tick(10) // 10 ticks/s - uses new loan store for comprehensive loan management
    })

    // ─── Deposit interest accrual ────────────────────────────────
    gameEngine.subscribe('deposits', () => {
      deposits.tick(10) // 10 ticks/s — compound interest, maturity checks
    })

    // ─── Stock market ────────────────────────────────────────────
    gameEngine.subscribe('stocks', (ctx: TickContext) => {
      const settings = useSettingsStore()
      if (ctx.tick % settings.marketUpdateInterval === 0) {
        stocks.tick()
      }
      // Pay dividends every 100 ticks (10 seconds) — proportional payout
      if (ctx.tick % 100 === 0) {
        stocks.payDividends(100)
      }
    })

    // ─── Crypto market ───────────────────────────────────────────
    gameEngine.subscribe('crypto', (ctx: TickContext) => {
      const settings = useSettingsStore()
      if (ctx.tick % settings.marketUpdateInterval === 0) {
        crypto.tick()
      }
    })

    // ─── Real estate ─────────────────────────────────────────────
    gameEngine.subscribe('realEstate', (ctx: TickContext) => {
      realEstate.tick(ctx)
    })

    // ─── Startups ────────────────────────────────────────────────
    gameEngine.subscribe('startups', (ctx: TickContext) => {
      // Resolve matured investments (sets status to 'succeeded' or 'failed')
      // Players must manually collect returns via the UI
      startups.tick(ctx.tick)
    })

    // ─── Storage Wars auctions ────────────────────────────────────
    gameEngine.subscribe('storage', (ctx: TickContext) => {
      storage.tick(ctx.tick)
    })

    // ─── Random events ──────────────────────────────────────────
    gameEngine.subscribe('events', () => {
      events.tick()
    })

    // ─── Net worth calculation ───────────────────────────────────
    gameEngine.subscribe('networth', (ctx: TickContext) => {
      // Only recalculate every 10 ticks (1/s) for perf
      if (ctx.tick % 10 !== 0) return

      const portfolioValue = add(stocks.totalPortfolioValue ?? ZERO, crypto.totalWalletValue ?? ZERO)
      const propertyValue = realEstate.totalPropertyValue ?? ZERO
      const startupValue = startups.totalInvested ?? ZERO
      const depositValue = deposits.totalLockedBalance ?? ZERO

      // Use loan store's totalDebt for comprehensive debt tracking
      player.netWorth = Formulas.calculateNetWorth(
        player.cash,
        business.totalBusinessValue,
        portfolioValue,
        propertyValue,
        add(startupValue, depositValue),
        loans.totalDebt
      )
    })

    // ─── Upgrade multiplier application ──────────────────────────
    gameEngine.subscribe('multipliers', () => {
      const reEventMul = D(events.getMultiplier('income_multiplier', 'realestate'))
      const reUpgradeMul = upgrades.getMultiplier('real_estate_rent')
      const allIncomeMul = upgrades.getMultiplier('all_income')
      const prestigeMul = prestige.globalMultiplier
      realEstate.globalRentMultiplier = allIncomeMul.mul(reUpgradeMul).mul(prestigeMul).mul(reEventMul)
    })

    // ─── Achievements (every 5 seconds) ──────────────────────────
    gameEngine.subscribe('achievements', (ctx: TickContext) => {
      if (ctx.tick % 50 !== 0) return

      for (const ach of achievements.achievements) {
        if (ach.unlocked) continue
        const condition = ach.condition
        if (!condition) continue

        let met = false
        switch (condition.type) {
          case 'totalEarned':
            met = player.totalCashEarned.gte(condition.value as number)
            break
          case 'cash':
            met = player.cash.gte(condition.value as number)
            break
          case 'netWorth':
            met = player.netWorth.gte(condition.value as number)
            break
          case 'level':
            met = player.level >= (condition.value as number)
            break
          case 'businesses':
            met = business.businesses.length >= (condition.value as number)
            break
          case 'prestige':
            met = prestige.rebirthCount >= (condition.value as number)
            break
          case 'gambling':
            met = gambling.gamesPlayed >= (condition.value as number)
            break
          case 'stocks':
            met = stocks.portfolio.length >= (condition.value as number)
            break
          case 'realEstate':
            met = realEstate.properties.length >= (condition.value as number)
            break
          case 'upgrades': {
            const purchasedCount = upgrades.nodes.filter(n => n.purchased).length
            met = purchasedCount >= (condition.value as number)
            break
          }
          case 'storageWins':
            met = storage.totalAuctionsWon >= (condition.value as number)
            break
          case 'storageItemsSold':
            met = storage.totalItemsSold >= (condition.value as number)
            break
        }

        if (met) {
          const reward = achievements.unlock(ach.id, ctx.tick)
          // Process achievement reward
          if (reward) {
            switch (reward.type) {
              case 'cash':
                player.earnCash(D(reward.value))
                break
              case 'multiplier':
                // Multiplier rewards are passive — stored in achievement and
                // can be queried by game systems. No instant action needed.
                break
              case 'prestige_points':
                prestige.points = prestige.points.add(D(reward.value))
                prestige.totalPointsEarned = prestige.totalPointsEarned.add(D(reward.value))
                break
            }
          }
        }
      }
    })

    // ─── Prestige Milestones (every 5 seconds) ───────────────────
    gameEngine.subscribe('prestige-milestones', (ctx: TickContext) => {
      if (ctx.tick % 50 !== 0) return
      prestige.checkMilestones(ctx.tick, player.totalCashEarned)
    })

    // ─── UI sync ─────────────────────────────────────────────────
    gameEngine.subscribe('ui-sync', (ctx: TickContext) => {
      tickCount.value = ctx.tick
      totalPlayTime.value = ctx.totalTime
    })

    gameEngine.start()
  }

  function stopLoop(): void {
    gameEngine.pause()
  }

  return {
    tickCount,
    totalPlayTime,
    startLoop,
    stopLoop,
    engine: gameEngine
  }
}

/**
 * Subscribe a single callback to the game tick.
 * Auto-unsubscribes on component unmount.
 */
export function useOnTick(id: string, callback: (ctx: TickContext) => void): void {
  onMounted(() => {
    gameEngine.subscribe(id, callback)
  })
  onUnmounted(() => {
    gameEngine.unsubscribe(id)
  })
}
