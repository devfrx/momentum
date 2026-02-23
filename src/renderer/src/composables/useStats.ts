/**
 * useStats — Centralized statistics composable
 *
 * Aggregates all game statistics from every store into categorized
 * groups for display in the unified Statistics view. Each group
 * contains stat items with label (i18n key), value, icon, and
 * optional color class for positive/negative theming.
 *
 * Compatible with: all stores, multipliers, XP, prestige, events,
 * i18n, save/load, gist cloud, achievements.
 */
import { computed } from 'vue'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useJobStore } from '@renderer/stores/useJobStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useStockStore } from '@renderer/stores/useStockStore'
import { useCryptoStore } from '@renderer/stores/useCryptoStore'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { useStartupStore } from '@renderer/stores/useStartupStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { useDepositStore } from '@renderer/stores/useDepositStore'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { useShopStore } from '@renderer/stores/useShopStore'
import { usePrestigeStore } from '@renderer/stores/usePrestigeStore'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { useAchievementStore } from '@renderer/stores/useAchievementStore'
import { useFormat } from './useFormat'
import { useMultipliers } from './useMultipliers'
import { add } from '@renderer/core/BigNum'

// ─── Types ──────────────────────────────────────────────────────

export interface StatItem {
  labelKey: string
  value: string
  icon: string
  colorClass?: string
}

export interface StatGroup {
  id: string
  titleKey: string
  icon: string
  items: StatItem[]
}

// ─── Composable ─────────────────────────────────────────────────

export function useStats() {
  const { formatCash, formatNumber, formatRate, formatMultiplier } = useFormat()

  const player = usePlayerStore()
  const jobs = useJobStore()
  const business = useBusinessStore()
  const stocks = useStockStore()
  const crypto = useCryptoStore()
  const realEstate = useRealEstateStore()
  const startups = useStartupStore()
  const gambling = useGamblingStore()
  const loans = useLoanStore()
  const deposits = useDepositStore()
  const storage = useStorageStore()
  const blackmarket = useBlackMarketStore()
  const vault = useVaultStore()
  const shop = useShopStore()
  const prestige = usePrestigeStore()
  const upgrades = useUpgradeStore()
  const achievements = useAchievementStore()
  const { breakdowns } = useMultipliers()

  // ─── Player / Global ────────────────────────────────────────

  const playerStats = computed<StatGroup>(() => ({
    id: 'player',
    titleKey: 'stats.group_player',
    icon: 'mdi:account-circle',
    items: [
      {
        labelKey: 'stats.net_worth',
        value: formatCash(player.netWorth),
        icon: 'mdi:scale-balance',
        colorClass: 'text-gold'
      },
      {
        labelKey: 'stats.total_earned',
        value: formatCash(player.totalCashEarned),
        icon: 'mdi:cash-multiple',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.total_spent',
        value: formatCash(player.totalCashSpent),
        icon: 'mdi:cash-minus',
        colorClass: 'negative'
      },
      {
        labelKey: 'stats.current_cash',
        value: formatCash(player.cash),
        icon: 'mdi:wallet',
        colorClass: 'positive'
      },
      { labelKey: 'stats.level', value: `${player.level}`, icon: 'mdi:shield-crown' },
      {
        labelKey: 'stats.prestige_points',
        value: formatNumber(player.prestigePoints),
        icon: 'mdi:star-circle',
        colorClass: 'text-purple'
      },
      { labelKey: 'stats.rebirths', value: `${player.rebirthCount}`, icon: 'mdi:reload' },
      {
        labelKey: 'stats.achievements',
        value: `${achievements.unlockedCount}/${achievements.achievements.length}`,
        icon: 'mdi:trophy',
        colorClass: 'text-gold'
      }
    ]
  }))

  // ─── Business ───────────────────────────────────────────────

  const businessStats = computed<StatGroup>(() => ({
    id: 'business',
    titleKey: 'stats.group_business',
    icon: 'mdi:store',
    items: [
      { labelKey: 'stats.biz_count', value: `${business.totalBusinessCount}`, icon: 'mdi:store' },
      {
        labelKey: 'stats.biz_profit_s',
        value: formatCash(business.profitPerSecond),
        icon: 'mdi:trending-up',
        colorClass: business.profitPerSecond.gte(0) ? 'positive' : 'negative'
      },
      {
        labelKey: 'stats.biz_value',
        value: formatCash(business.totalBusinessValue),
        icon: 'mdi:cash',
        colorClass: 'text-gold'
      },
      {
        labelKey: 'stats.biz_levels',
        value: `${business.totalLevels}`,
        icon: 'mdi:arrow-up-bold-circle'
      },
      {
        labelKey: 'stats.biz_branches',
        value: `${business.totalBranches}`,
        icon: 'mdi:source-branch'
      },
      { labelKey: 'stats.biz_corps', value: `${business.corporationCount}`, icon: 'mdi:domain' }
    ]
  }))

  // ─── Jobs ───────────────────────────────────────────────────

  const jobStats = computed<StatGroup>(() => ({
    id: 'jobs',
    titleKey: 'stats.group_jobs',
    icon: 'mdi:briefcase',
    items: [
      {
        labelKey: 'stats.jobs_active',
        value: `${jobs.activeJobCount}/${jobs.maxActiveJobs}`,
        icon: 'mdi:briefcase'
      },
      {
        labelKey: 'stats.jobs_unlocked',
        value: `${jobs.unlockedJobs.length}`,
        icon: 'mdi:briefcase-check'
      },
      {
        labelKey: 'stats.jobs_income_s',
        value: formatCash(jobs.totalJobIncomePerTick.mul(10)),
        icon: 'mdi:cash-fast',
        colorClass: 'positive'
      }
    ]
  }))

  // ─── Stock Market ───────────────────────────────────────────

  const stockStats = computed<StatGroup>(() => ({
    id: 'stocks',
    titleKey: 'stats.group_stocks',
    icon: 'mdi:chart-line',
    items: [
      {
        labelKey: 'stats.stock_positions',
        value: `${stocks.portfolio.length}`,
        icon: 'mdi:format-list-bulleted'
      },
      {
        labelKey: 'stats.stock_portfolio',
        value: formatCash(stocks.totalPortfolioValue),
        icon: 'mdi:briefcase-outline',
        colorClass: 'text-emerald'
      },
      {
        labelKey: 'stats.stock_unrealized',
        value: formatCash(stocks.unrealizedProfit),
        icon: 'mdi:chart-line-variant',
        colorClass: stocks.unrealizedProfit.gte(0) ? 'positive' : 'negative'
      },
      {
        labelKey: 'stats.stock_realized',
        value: formatCash(stocks.totalRealizedProfit),
        icon: 'mdi:check-decagram',
        colorClass: stocks.totalRealizedProfit.gte(0) ? 'positive' : 'negative'
      },
      {
        labelKey: 'stats.stock_dividends',
        value: formatCash(stocks.totalDividendsEarned),
        icon: 'mdi:currency-usd',
        colorClass: 'positive'
      }
    ]
  }))

  // ─── Crypto ─────────────────────────────────────────────────

  const cryptoStats = computed<StatGroup>(() => ({
    id: 'crypto',
    titleKey: 'stats.group_crypto',
    icon: 'mdi:bitcoin',
    items: [
      { labelKey: 'stats.crypto_holdings', value: `${crypto.wallet.length}`, icon: 'mdi:wallet' },
      {
        labelKey: 'stats.crypto_wallet',
        value: formatCash(crypto.totalWalletValue),
        icon: 'mdi:safe-square',
        colorClass: 'text-purple'
      },
      {
        labelKey: 'stats.crypto_unrealized',
        value: formatCash(crypto.unrealizedProfit),
        icon: 'mdi:chart-line-variant',
        colorClass: crypto.unrealizedProfit.gte(0) ? 'positive' : 'negative'
      },
      {
        labelKey: 'stats.crypto_realized',
        value: formatCash(crypto.totalRealizedProfit),
        icon: 'mdi:check-decagram',
        colorClass: crypto.totalRealizedProfit.gte(0) ? 'positive' : 'negative'
      },
      {
        labelKey: 'stats.crypto_staking',
        value: formatCash(crypto.totalStakingEarned),
        icon: 'mdi:percent-circle',
        colorClass: 'positive'
      }
    ]
  }))

  // ─── Real Estate ────────────────────────────────────────────

  const realEstateStats = computed<StatGroup>(() => ({
    id: 'realestate',
    titleKey: 'stats.group_realestate',
    icon: 'mdi:home-city',
    items: [
      {
        labelKey: 'stats.re_properties',
        value: `${realEstate.properties.length}`,
        icon: 'mdi:home-group'
      },
      {
        labelKey: 'stats.re_rent_tick',
        value: formatCash(realEstate.totalRentPerTick),
        icon: 'mdi:cash-fast',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.re_portfolio',
        value: formatCash(realEstate.totalPropertyValue),
        icon: 'mdi:home-city',
        colorClass: 'text-gold'
      },
      {
        labelKey: 'stats.re_opportunities',
        value: `${realEstate.availableOpportunities.length}`,
        icon: 'mdi:map-marker-multiple'
      }
    ]
  }))

  // ─── Startups / Investments ─────────────────────────────────

  const investmentStats = computed<StatGroup>(() => ({
    id: 'investments',
    titleKey: 'stats.group_investments',
    icon: 'mdi:rocket-launch',
    items: [
      {
        labelKey: 'stats.inv_active',
        value: `${startups.activeInvestments.length}`,
        icon: 'mdi:rocket-launch'
      },
      {
        labelKey: 'stats.inv_win_rate',
        value: formatRate(startups.winRate),
        icon: 'mdi:percent-outline'
      },
      {
        labelKey: 'stats.inv_invested',
        value: formatCash(startups.totalInvested),
        icon: 'mdi:cash',
        colorClass: 'text-gold'
      },
      {
        labelKey: 'stats.inv_returned',
        value: formatCash(startups.totalReturned),
        icon: 'mdi:cash-multiple',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.inv_net',
        value: formatCash(startups.netProfit),
        icon: 'mdi:chart-line',
        colorClass: startups.netProfit.gte(0) ? 'positive' : 'negative'
      }
    ]
  }))

  // ─── Loans ──────────────────────────────────────────────────

  const loanStats = computed<StatGroup>(() => ({
    id: 'loans',
    titleKey: 'stats.group_loans',
    icon: 'mdi:bank',
    items: [
      { labelKey: 'stats.loan_active', value: `${loans.loans.length}`, icon: 'mdi:file-document' },
      {
        labelKey: 'stats.loan_debt',
        value: formatCash(loans.totalDebt),
        icon: 'mdi:bank-transfer-out',
        colorClass: 'negative'
      },
      {
        labelKey: 'stats.loan_credit',
        value: `${loans.creditScore}`,
        icon: 'mdi:shield-check',
        colorClass:
          loans.creditScore >= 70
            ? 'positive'
            : loans.creditScore >= 40
              ? 'text-warning'
              : 'negative'
      },
      { labelKey: 'stats.loan_taken', value: `${loans.totalLoansTaken}`, icon: 'mdi:bank-plus' },
      {
        labelKey: 'stats.loan_repaid',
        value: `${loans.totalLoansRepaidOnTime}`,
        icon: 'mdi:check-circle',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.loan_defaults',
        value: `${loans.totalLoansDefaulted}`,
        icon: 'mdi:alert-circle',
        colorClass: 'negative'
      },
      {
        labelKey: 'stats.loan_interest_paid',
        value: formatCash(loans.totalInterestPaidEver),
        icon: 'mdi:percent-circle',
        colorClass: 'text-warning'
      }
    ]
  }))

  // ─── Deposits ───────────────────────────────────────────────

  const depositStats = computed<StatGroup>(() => ({
    id: 'deposits',
    titleKey: 'stats.group_deposits',
    icon: 'mdi:piggy-bank',
    items: [
      {
        labelKey: 'stats.dep_active',
        value: `${deposits.deposits.length}`,
        icon: 'mdi:piggy-bank'
      },
      {
        labelKey: 'stats.dep_locked',
        value: formatCash(deposits.totalLockedBalance),
        icon: 'mdi:lock'
      },
      {
        labelKey: 'stats.dep_avg_apy',
        value: `${(deposits.averageAPY * 100).toFixed(2)}%`,
        icon: 'mdi:percent-outline',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.dep_interest_s',
        value: formatCash(deposits.interestPerSecond),
        icon: 'mdi:cash-fast',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.dep_total_deposited',
        value: formatCash(deposits.totalDeposited),
        icon: 'mdi:bank-transfer-in'
      },
      {
        labelKey: 'stats.dep_total_interest',
        value: formatCash(deposits.totalInterestEarnedEver),
        icon: 'mdi:cash-plus',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.dep_opened',
        value: `${deposits.totalDepositsOpened}`,
        icon: 'mdi:folder-open'
      },
      {
        labelKey: 'stats.dep_matured',
        value: `${deposits.totalDepositsMatured}`,
        icon: 'mdi:check-decagram',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.dep_early_withdraw',
        value: `${deposits.totalEarlyWithdrawals}`,
        icon: 'mdi:clock-alert',
        colorClass: 'text-warning'
      }
    ]
  }))

  // ─── Gambling ───────────────────────────────────────────────

  const gamblingStats = computed<StatGroup>(() => {
    const winRate =
      gambling.gamesPlayed > 0
        ? Math.round(
            (Object.values(gambling.gameStats).reduce((s, g) => s + g.won, 0) /
              gambling.gamesPlayed) *
              100
          )
        : 0

    return {
      id: 'gambling',
      titleKey: 'stats.group_gambling',
      icon: 'mdi:cards-playing',
      items: [
        {
          labelKey: 'stats.gamb_played',
          value: formatNumber(gambling.gamesPlayed),
          icon: 'mdi:gamepad-variant-outline'
        },
        { labelKey: 'stats.gamb_win_rate', value: `${winRate}%`, icon: 'mdi:percent-outline' },
        {
          labelKey: 'stats.gamb_total_won',
          value: formatCash(gambling.totalWon),
          icon: 'mdi:cash-plus',
          colorClass: 'positive'
        },
        {
          labelKey: 'stats.gamb_total_lost',
          value: formatCash(gambling.totalLost),
          icon: 'mdi:cash-minus',
          colorClass: 'negative'
        },
        {
          labelKey: 'stats.gamb_net',
          value: formatCash(gambling.netProfit),
          icon: 'mdi:chart-line',
          colorClass: gambling.netProfit.gte(0) ? 'positive' : 'negative'
        },
        {
          labelKey: 'stats.gamb_best_win',
          value: formatCash(gambling.biggestWin),
          icon: 'mdi:trophy',
          colorClass: 'text-gold'
        },
        {
          labelKey: 'stats.gamb_worst_loss',
          value: formatCash(gambling.biggestLoss),
          icon: 'mdi:alert-circle',
          colorClass: 'negative'
        },
        {
          labelKey: 'stats.gamb_luck',
          value: formatMultiplier(gambling.getLuckMultiplier()),
          icon: 'mdi:clover',
          colorClass: gambling.getLuckMultiplier() > 1 ? 'positive' : ''
        }
      ]
    }
  })

  // ─── Storage Wars ──────────────────────────────────────────

  const storageStats = computed<StatGroup>(() => ({
    id: 'storage',
    titleKey: 'stats.group_storage',
    icon: 'mdi:warehouse',
    items: [
      {
        labelKey: 'stats.stor_auctions',
        value: formatNumber(storage.totalAuctionsWon),
        icon: 'mdi:trophy',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.stor_items_sold',
        value: formatNumber(storage.totalItemsSold),
        icon: 'mdi:tag-check'
      },
      {
        labelKey: 'stats.stor_revenue',
        value: formatCash(storage.totalSaleRevenue),
        icon: 'mdi:cash-multiple',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.stor_spent',
        value: formatCash(
          add(
            add(storage.totalSpentOnAuctions, storage.totalSpentOnAppraisals),
            add(storage.totalSpentOnEntryFees, storage.totalSpentOnStorageFees)
          )
        ),
        icon: 'mdi:cash-minus',
        colorClass: 'negative'
      },
      {
        labelKey: 'stats.stor_net',
        value: formatCash(storage.netProfit),
        icon: 'mdi:chart-line',
        colorClass: storage.netProfit.gte(0) ? 'positive' : 'negative'
      },
      {
        labelKey: 'stats.stor_biggest_flip',
        value: formatCash(storage.biggestFlip),
        icon: 'mdi:star-shooting',
        colorClass: 'text-gold'
      }
    ]
  }))

  // ─── Black Market ──────────────────────────────────────────

  const blackMarketStats = computed<StatGroup>(() => ({
    id: 'blackmarket',
    titleKey: 'stats.group_blackmarket',
    icon: 'mdi:skull-crossbones',
    items: [
      {
        labelKey: 'stats.bm_deals_done',
        value: `${blackmarket.totalDealsCompleted}`,
        icon: 'mdi:handshake',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.bm_deals_failed',
        value: `${blackmarket.totalDealsFailed}`,
        icon: 'mdi:close-circle',
        colorClass: 'negative'
      },
      {
        labelKey: 'stats.bm_cash_spent',
        value: formatCash(blackmarket.totalCashSpent),
        icon: 'mdi:cash-minus',
        colorClass: 'negative'
      },
      {
        labelKey: 'stats.bm_cash_earned',
        value: formatCash(blackmarket.totalCashEarned),
        icon: 'mdi:cash-plus',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.bm_net',
        value: formatCash(blackmarket.netProfit),
        icon: 'mdi:chart-line',
        colorClass: blackmarket.netProfit.gte(0) ? 'positive' : 'negative'
      },
      {
        labelKey: 'stats.bm_fines',
        value: formatCash(blackmarket.totalFinesPaid),
        icon: 'mdi:gavel',
        colorClass: 'negative'
      },
      { labelKey: 'stats.bm_heat', value: `${blackmarket.totalHeatAccumulated}`, icon: 'mdi:fire' },
      {
        labelKey: 'stats.bm_investigations',
        value: `${blackmarket.totalInvestigations}`,
        icon: 'mdi:magnify'
      }
    ]
  }))

  // ─── Online Shop ───────────────────────────────────────────

  const shopStats = computed<StatGroup>(() => ({
    id: 'shop',
    titleKey: 'stats.group_shop',
    icon: 'mdi:store-search',
    items: [
      { labelKey: 'stats.shop_bought', value: `${shop.totalItemsBought}`, icon: 'mdi:cart' },
      {
        labelKey: 'stats.shop_spent',
        value: formatCash(shop.totalCashSpentOnPurchases),
        icon: 'mdi:cart-arrow-down',
        colorClass: 'negative'
      },
      {
        labelKey: 'stats.shop_sales',
        value: formatCash(shop.totalCashFromSales),
        icon: 'mdi:cash-register',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.shop_profit',
        value: formatCash(shop.shopNetProfit),
        icon: 'mdi:chart-line',
        colorClass: shop.shopNetProfit.gte(0) ? 'positive' : 'negative'
      },
      {
        labelKey: 'stats.shop_uniques',
        value: `${shop.uniqueItemsBought}`,
        icon: 'mdi:star-shooting'
      },
      { labelKey: 'stats.shop_restored', value: `${shop.totalItemsRestored}`, icon: 'mdi:tools' },
      {
        labelKey: 'stats.shop_auctions',
        value: `${shop.totalAuctionsCompleted}`,
        icon: 'mdi:gavel'
      },
      {
        labelKey: 'stats.shop_auction_rev',
        value: formatCash(shop.totalAuctionRevenue),
        icon: 'mdi:cash-multiple',
        colorClass: 'positive'
      },
      ...(shop.bestDeal.gt(0)
        ? [
            {
              labelKey: 'stats.shop_best_deal',
              value: formatCash(shop.bestDeal),
              icon: 'mdi:trophy',
              colorClass: 'text-gold'
            }
          ]
        : [])
    ]
  }))

  // ─── Vault ─────────────────────────────────────────────────

  const vaultStats = computed<StatGroup>(() => ({
    id: 'vault',
    titleKey: 'stats.group_vault',
    icon: 'mdi:safe-square',
    items: [
      {
        labelKey: 'stats.vault_items',
        value: `${vault.items.length}/${vault.capacity}`,
        icon: 'mdi:package-variant-closed'
      },
      {
        labelKey: 'stats.vault_stored_cash',
        value: formatCash(vault.storedCash),
        icon: 'mdi:safe-square',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.vault_total_stored',
        value: formatNumber(vault.totalItemsStored),
        icon: 'mdi:arrow-down-bold'
      },
      {
        labelKey: 'stats.vault_sale_revenue',
        value: formatCash(vault.totalSaleRevenue),
        icon: 'mdi:cash-multiple',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.vault_upgrades',
        value: formatNumber(vault.capacityUpgrades),
        icon: 'mdi:arrow-up-bold'
      }
    ]
  }))

  // ─── Prestige / Progression ─────────────────────────────────

  const prestigeStats = computed<StatGroup>(() => ({
    id: 'prestige',
    titleKey: 'stats.group_prestige',
    icon: 'mdi:star-circle',
    items: [
      {
        labelKey: 'stats.prest_points',
        value: formatNumber(prestige.totalPointsEarned),
        icon: 'mdi:star-four-points',
        colorClass: 'text-purple'
      },
      { labelKey: 'stats.prest_rebirths', value: `${prestige.rebirthCount}`, icon: 'mdi:reload' },
      {
        labelKey: 'stats.prest_milestones',
        value: `${prestige.unlockedMilestones}/${prestige.milestones.length}`,
        icon: 'mdi:flag-checkered',
        colorClass: 'positive'
      },
      {
        labelKey: 'stats.prest_perks',
        value: `${prestige.purchasedPerks}/${prestige.perks.length}`,
        icon: 'mdi:diamond',
        colorClass: 'text-purple'
      },
      {
        labelKey: 'stats.prest_upgrade_levels',
        value: `${prestige.totalUpgradeLevels}`,
        icon: 'mdi:arrow-up-bold-circle'
      },
      {
        labelKey: 'stats.prest_global_multi',
        value: formatMultiplier(prestige.globalMultiplier),
        icon: 'mdi:trending-up',
        colorClass: 'positive'
      }
    ]
  }))

  // ─── Skills ─────────────────────────────────────────────────

  const skillStats = computed<StatGroup>(() => ({
    id: 'skills',
    titleKey: 'stats.group_skills',
    icon: 'mdi:graph',
    items: [
      {
        labelKey: 'stats.skill_unlocked',
        value: `${upgrades.nodes.filter((n) => n.purchased).length}/${upgrades.nodes.length}`,
        icon: 'mdi:check-decagram',
        colorClass: 'positive'
      },
      ...breakdowns.value
        .filter((bd) => bd.hasBonus)
        .map((bd) => ({
          labelKey: bd.category.labelKey,
          value: bd.totalFormatted,
          icon: bd.category.icon,
          colorClass: 'positive'
        }))
    ]
  }))

  // ─── All Groups ─────────────────────────────────────────────

  const allGroups = computed<StatGroup[]>(() => [
    playerStats.value,
    businessStats.value,
    jobStats.value,
    stockStats.value,
    cryptoStats.value,
    realEstateStats.value,
    investmentStats.value,
    loanStats.value,
    depositStats.value,
    gamblingStats.value,
    storageStats.value,
    blackMarketStats.value,
    shopStats.value,
    vaultStats.value,
    prestigeStats.value,
    skillStats.value
  ])

  return {
    allGroups,
    playerStats,
    businessStats,
    jobStats,
    stockStats,
    cryptoStats,
    realEstateStats,
    investmentStats,
    loanStats,
    depositStats,
    gamblingStats,
    storageStats,
    blackMarketStats,
    shopStats,
    vaultStats,
    prestigeStats,
    skillStats
  }
}
