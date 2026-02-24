/**
 * useGameLoop — Composable that subscribes Vue components to the game engine tick
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { gameEngine, type TickContext } from '@renderer/core/GameEngine'
import { D, ZERO, add, mul, min } from '@renderer/core/BigNum'
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
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useShopStore } from '@renderer/stores/useShopStore'
import { useLimitOrderStore, initLimitOrderNotify } from '@renderer/stores/useLimitOrderStore'
import { useBankingStore } from '@renderer/stores/useBankingStore'
import { useNotify } from '@renderer/composables/useNotify'

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

  // Initialize limit order notification bridge NOW (sync setup context — inject() works).
  // Cannot be inside startLoop() because it runs after `await` in onMounted where
  // Vue's currentInstance is null, causing inject() / useToast() to crash.
  initLimitOrderNotify(useNotify())

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
    const blackmarket = useBlackMarketStore()
    const shop = useShopStore()
    const limitOrderStore = useLimitOrderStore()
    const bankingStore = useBankingStore()

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

    // ─── Debt interest (negative cash penalty) ───────────────────
    // When cash < 0, apply 0.5% interest per 100 ticks (≈ 10 sec)
    // to discourage staying in debt without making it instantly fatal.
    // Interest is capped: debt considered for interest maxes out at 1e9
    // and per-tick interest is capped at 5e6 to prevent runaway spirals.
    gameEngine.subscribe('debtInterest', (ctx: TickContext) => {
      if (ctx.tick % 100 !== 0) return
      if (player.cardBalance.lt(0)) {
        const MAX_DEBT_FOR_INTEREST = D(1e9)
        const MAX_INTEREST_PER_TICK = D(5e6)
        const debtAmount = min(player.cardBalance.abs(), MAX_DEBT_FOR_INTEREST)
        const interest = min(mul(debtAmount, 0.005), MAX_INTEREST_PER_TICK) // 0.5% per 10 sec, capped
        player.forcePay(interest, { key: 'banking.tx_debt_interest', cat: 'other' })
      }
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
      // Pay staking rewards every 100 ticks (10 seconds) — analogous to stock dividends
      if (ctx.tick % 100 === 0) {
        crypto.payStakingRewards(100)
      }
    })

    // ─── Limit orders (check every market tick) ──────────────────
    gameEngine.subscribe('limitOrders', (ctx: TickContext) => {
      const settings = useSettingsStore()
      if (ctx.tick % settings.marketUpdateInterval === 0) {
        limitOrderStore.tick(ctx.tick)
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

    // ─── Black Market ────────────────────────────────────────────
    gameEngine.subscribe('blackmarket', (ctx: TickContext) => {
      blackmarket.tick(ctx.tick)
    })
    // ─── Online Shop ──────────────────────────────────────────
    gameEngine.subscribe('shop', (ctx: TickContext) => {
      shop.tick(ctx.tick)
    })
    // ─── Random events ──────────────────────────────────────────
    gameEngine.subscribe('events', () => {
      events.tick()
    })

    // ─── Net worth calculation ───────────────────────────────────
    gameEngine.subscribe('networth', (ctx: TickContext) => {
      // Only recalculate every 10 ticks (1/s) for perf
      if (ctx.tick % 10 !== 0) return

      const portfolioValue = add(
        stocks.totalPortfolioValue ?? ZERO,
        crypto.totalWalletValue ?? ZERO
      )
      const propertyValue = realEstate.totalPropertyValue ?? ZERO
      const startupValue = startups.totalInvested ?? ZERO
      const depositValue = deposits.totalLockedBalance ?? ZERO

      // Use loan store's totalDebt for comprehensive debt tracking
      player.netWorth = Formulas.calculateNetWorth(
        player.totalFunds,
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
      const bmIncomeBoost = D(blackmarket.getEffectMultiplier('income_boost'))
      const bmHeatPenalty = D(blackmarket.getHeatIncomePenalty())
      const cardTierMul = D(bankingStore.tierBonus)
      realEstate.globalRentMultiplier = allIncomeMul
        .mul(reUpgradeMul)
        .mul(prestigeMul)
        .mul(reEventMul)
        .mul(bmIncomeBoost)
        .mul(bmHeatPenalty)
        .mul(cardTierMul)

      // ─── Market conditions from events (Fix #4) ─────────────────
      const stockSim = stocks.getSimulator()
      const cryptoSim = crypto.getSimulator()

      const hasBull = events.activeEvents.some(
        (e: { eventId: string }) => e.eventId === 'bull_market'
      )
      const hasCrash = events.activeEvents.some(
        (e: { eventId: string }) => e.eventId === 'market_crash'
      )
      const hasCryptoBoom = events.activeEvents.some(
        (e: { eventId: string }) => e.eventId === 'crypto_boom'
      )
      const hasCryptoWinter = events.activeEvents.some(
        (e: { eventId: string }) => e.eventId === 'crypto_winter'
      )

      // Stock market condition
      if (hasCrash) stockSim.setCondition('crash', 100)
      else if (hasBull) stockSim.setCondition('bull', 100)
      else if (stockSim.getCondition() !== 'normal') stockSim.setCondition('normal', 0)

      // Crypto market condition
      if (hasCryptoWinter) cryptoSim.setCondition('bear', 100)
      else if (hasCryptoBoom) cryptoSim.setCondition('bubble', 100)
      else if (cryptoSim.getCondition() !== 'normal') cryptoSim.setCondition('normal', 0)

      // ─── Economy → market sentiment (Fix #7) ────────────────────
      const ecoState = economySim.getState()
      let sentiment = 0
      switch (ecoState.cyclePhase) {
        case 'expansion':
          sentiment = 0.02
          break
        case 'peak':
          sentiment = 0.04
          break
        case 'contraction':
          sentiment = -0.03
          break
        case 'trough':
          sentiment = -0.05
          break
      }
      stockSim.setSentimentModifier(sentiment)
      cryptoSim.setSentimentModifier(sentiment * 1.5) // crypto more sensitive to macro
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
            met = player.totalFunds.gte(condition.value as number)
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
            const purchasedCount = upgrades.nodes.filter((n) => n.purchased).length
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
                player.earnToCard(D(reward.value), {
                  key: 'banking.tx_achievement_reward',
                  cat: 'achievement',
                  params: { name: ach.name }
                })
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

    // ─── Banking: transaction recording & card tier ──────────────
    gameEngine.subscribe('banking', (ctx: TickContext) => {
      // Every 100 ticks (10 seconds): record aggregated income/expenses
      if (ctx.tick % 100 !== 0) return

      const bal = player.cardBalance

      // Job income (aggregated over 10s)
      const jobIncome = mul(jobs.jobIncomePerSecond, 10)
      if (jobIncome.gt(0)) {
        bankingStore.recordPeriodicIncome('banking.tx_job_income', jobIncome, 'salary', bal)
      }

      // Business profit/loss (aggregated over 10s) — only managed businesses
      // route profit/loss to the wallet; unmanaged businesses accumulate to pendingProfit
      const bizProfit = mul(business.managedProfitPerSecond, 10)
      if (bizProfit.gt(0)) {
        bankingStore.recordPeriodicIncome('banking.tx_business_profit', bizProfit, 'business', bal)
      } else if (bizProfit.lt(0)) {
        bankingStore.recordTransaction(
          'banking.tx_business_loss',
          bizProfit, // already negative
          'business',
          bal
        )
      }

      // Real estate rent (aggregated over 10s)
      const rent = mul(realEstate.rentPerSecond, 10)
      if (rent.gt(0)) {
        bankingStore.recordPeriodicIncome('banking.tx_rent_income', rent, 'real_estate', bal)
      }

      // NOTE: Deposit interest and loan interest are NOT recorded here because
      // they don't flow to/from the player's wallet. Deposit interest accrues
      // inside deposit balances (withdrawn later), and loan interest increases
      // loan.remaining (paid when repaying). Recording them here would create
      // phantom income/expense entries in the banking log.

      // Update card tier based on current net worth
      bankingStore.updateCardTier(player.netWorth)
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
