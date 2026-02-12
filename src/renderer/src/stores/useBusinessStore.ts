/**
 * useBusinessStore — Operational business management
 *
 * Each owned business is a real entity with employees, pricing,
 * marketing, quality, supply costs, and rent. Profit = revenue - costs.
 * Businesses can run at a loss!
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, div, gte } from '@renderer/core/BigNum'
import { Formulas } from '@renderer/core'
import { economySim } from '@renderer/core/EconomySim'
import type { TickContext } from '@renderer/core/GameEngine'
import type { BusinessDef } from '@renderer/data/businesses'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'
import { usePrestigeStore } from './usePrestigeStore'

// ─── Types ────────────────────────────────────────────────────

export interface OwnedBusiness {
  /** Matches BusinessDef.id */
  id: string
  name: string
  icon: string
  category: string

  /** Player-chosen custom name (optional) */
  customName?: string

  // ── Operational levers (player adjustable) ──
  employees: number
  pricePerUnit: number
  marketingBudget: number
  quality: number

  // ── Fixed from definition (can be upgraded) ──
  outputPerEmployee: number
  baseSalary: number
  baseRent: number
  supplyCostPerUnit: number
  optimalPrice: number
  baseCustomers: number
  elasticity: number
  sectorMultiplier: number
  qualityUpgradeCost: Decimal
  purchasePrice: Decimal

  // ── Tracked stats ──
  totalRevenue: Decimal
  totalCosts: Decimal
  totalProfit: Decimal
  /** Average profit per tick (rolling ~100 ticks) */
  avgProfitPerTick: Decimal
  /** Ticks since purchase */
  ticksOwned: number

  // ── Live performance stats (updated each tick) ──
  /** Current customer demand (after all multipliers) */
  currentCustomers: number
  /** Max production capacity (employees × outputPerEmployee) */
  maxCapacity: number
  /** Units actually sold this tick */
  unitsSold: number
  /** Capacity utilization 0–1 */
  utilization: number
  /** Revenue this tick */
  revenuePerTick: Decimal
  /** Costs this tick */
  costsPerTick: Decimal
  /** Profit this tick */
  profitPerTick: Decimal
  /** Price factor from demand formula (1.0 = optimal) */
  priceFactor: number
  /** Quality factor from demand formula */
  qualityFactor: number
  /** Marketing factor from demand formula */
  marketingFactor: number

  // ── Manager ──
  /** Whether a manager has been hired (auto-collects profit) */
  hasManager: boolean
  /** One-time cost to hire a manager */
  managerCost: Decimal
  /** Accumulated uncollected profit (only when no manager) */
  pendingProfit: Decimal
}

export const useBusinessStore = defineStore('business', () => {
  const businesses = ref<OwnedBusiness[]>([])

  // ─── Computed ─────────────────────────────────────────────────

  /** Total profit per tick across all managed businesses */
  const totalProfitPerTick = computed<Decimal>(() => {
    let total = ZERO
    for (const biz of businesses.value) {
      if (biz.hasManager) total = add(total, biz.avgProfitPerTick)
    }
    return total
  })

  /** Approximate profit per second (10 ticks/s) */
  const profitPerSecond = computed<Decimal>(() => mul(totalProfitPerTick.value, 10))

  /** Sum of all business valuations (includes uncollected pending profit) */
  const totalBusinessValue = computed<Decimal>(() => {
    let total = ZERO
    for (const biz of businesses.value) {
      const val = Formulas.businessValuation(
        biz.avgProfitPerTick,
        biz.purchasePrice,
        biz.sectorMultiplier
      )
      total = add(total, add(val, biz.pendingProfit))
    }
    return total
  })

  // ─── Actions ──────────────────────────────────────────────────

  /** Purchase a new business from definitions. Returns false if can't afford or already owned. */
  function buyBusiness(def: BusinessDef): boolean {
    if (businesses.value.find((b) => b.id === def.id)) return false
    const player = usePlayerStore()
    if (!player.spendCash(def.purchasePrice)) return false

    businesses.value.push({
      id: def.id,
      name: def.name,
      icon: def.icon,
      category: def.category,
      employees: 1,
      pricePerUnit: def.optimalPrice,
      marketingBudget: 0,
      quality: def.baseQuality,
      outputPerEmployee: def.outputPerEmployee,
      baseSalary: def.baseSalary,
      baseRent: def.baseRent,
      supplyCostPerUnit: def.supplyCostPerUnit,
      optimalPrice: def.optimalPrice,
      baseCustomers: def.baseCustomers,
      elasticity: def.elasticity,
      sectorMultiplier: def.sectorMultiplier,
      qualityUpgradeCost: def.qualityUpgradeCost,
      purchasePrice: def.purchasePrice,
      totalRevenue: ZERO,
      totalCosts: ZERO,
      totalProfit: ZERO,
      avgProfitPerTick: ZERO,
      ticksOwned: 0,
      // Live stats (initialized, updated on first tick)
      currentCustomers: 0,
      maxCapacity: def.outputPerEmployee,
      unitsSold: 0,
      utilization: 0,
      revenuePerTick: ZERO,
      costsPerTick: ZERO,
      profitPerTick: ZERO,
      priceFactor: 1,
      qualityFactor: 0.5 + (def.baseQuality / 100) * 1.5,
      marketingFactor: 1,
      // Manager system
      hasManager: false,
      managerCost: mul(def.purchasePrice, 0.5),
      pendingProfit: ZERO,
    })

    player.addXp(D(50))
    return true
  }

  /** Sell a business for its current valuation */
  function sellBusiness(businessId: string): Decimal {
    const idx = businesses.value.findIndex((b) => b.id === businessId)
    if (idx === -1) return ZERO
    const biz = businesses.value[idx]
    const valuation = Formulas.businessValuation(
      biz.avgProfitPerTick,
      biz.purchasePrice,
      biz.sectorMultiplier
    )
    const player = usePlayerStore()
    player.earnCash(valuation)
    businesses.value.splice(idx, 1)
    return valuation
  }

  /** Hire one employee */
  function hireEmployee(businessId: string): boolean {
    const biz = businesses.value.find((b) => b.id === businessId)
    if (!biz) return false
    biz.employees++
    return true
  }

  /** Fire one employee (min 1) */
  function fireEmployee(businessId: string): boolean {
    const biz = businesses.value.find((b) => b.id === businessId)
    if (!biz || biz.employees <= 1) return false
    biz.employees--
    return true
  }

  /** Set price per unit (player decision) */
  function setPrice(businessId: string, price: number): void {
    const biz = businesses.value.find((b) => b.id === businessId)
    if (biz && price > 0) biz.pricePerUnit = price
  }

  /** Set marketing budget ($/tick) */
  function setMarketingBudget(businessId: string, budget: number): void {
    const biz = businesses.value.find((b) => b.id === businessId)
    if (biz && budget >= 0) biz.marketingBudget = budget
  }

  /** Upgrade quality by 1 point (costs money) */
  function upgradeQuality(businessId: string): boolean {
    const biz = businesses.value.find((b) => b.id === businessId)
    if (!biz || biz.quality >= 100) return false
    const player = usePlayerStore()
    if (!player.spendCash(biz.qualityUpgradeCost)) return false
    biz.quality = Math.min(100, biz.quality + 1)
    // Cost increases each upgrade
    biz.qualityUpgradeCost = mul(biz.qualityUpgradeCost, 1.15)
    return true
  }

  /** Rename a business (custom alias) */
  function renameBusiness(businessId: string, newName: string): void {
    const biz = businesses.value.find((b) => b.id === businessId)
    if (biz) {
      biz.customName = newName.trim() || undefined
    }
  }

  /** Hire a manager for auto-collection */
  function hireManager(businessId: string): boolean {
    const biz = businesses.value.find((b) => b.id === businessId)
    if (!biz || biz.hasManager) return false
    const player = usePlayerStore()
    if (!player.spendCash(biz.managerCost)) return false
    biz.hasManager = true
    // Immediately collect any pending profit
    if (biz.pendingProfit.gt(ZERO)) {
      player.earnCash(biz.pendingProfit)
      biz.pendingProfit = ZERO
    }
    return true
  }

  /** Manually collect accumulated profit */
  function collectProfit(businessId: string): Decimal {
    const biz = businesses.value.find((b) => b.id === businessId)
    if (!biz || biz.pendingProfit.lte(ZERO)) return ZERO
    const player = usePlayerStore()
    const amount = biz.pendingProfit
    player.earnCash(amount)
    biz.pendingProfit = ZERO
    return amount
  }

  /**
   * Game tick — compute revenue, costs, profit for every business.
   * Income is credited directly to player. Losses deduct from cash!
   * Returns total net profit this tick.
   */
  function tick(_ctx: TickContext): Decimal {
    const player = usePlayerStore()
    const ecoState = economySim.getState()
    const upgrades = useUpgradeStore()
    const prestige = usePrestigeStore()

    // Fetch upgrade multipliers once per tick
    const bizRevenueMul = upgrades.getMultiplier('business_revenue')
    const costReductionMul = upgrades.getMultiplier('cost_reduction')
    const customerAttractionMul = upgrades.getMultiplier('customer_attraction')
    const allIncomeMul = upgrades.getMultiplier('all_income')
    const prestigeGlobalMul = prestige.globalMultiplier

    let totalNet = ZERO

    for (const biz of businesses.value) {
      // ── Demand (customers this tick) ──
      const baseCustomers = Formulas.customerDemand(
        biz.baseCustomers,
        biz.pricePerUnit,
        biz.optimalPrice,
        biz.quality,
        biz.marketingBudget,
        economySim.getDemandMultiplier(),
        biz.elasticity
      )
      // Apply customer attraction upgrade multiplier
      const customers = Math.floor(baseCustomers * customerAttractionMul.toNumber())

      // ── Production capacity ──
      const maxOutput = biz.employees * biz.outputPerEmployee
      const unitsSold = Math.min(customers, maxOutput)

      // ── Revenue (apply business revenue + all income + prestige multipliers) ──
      const baseRevenue = D(unitsSold * biz.pricePerUnit)
      const revenue = mul(mul(mul(baseRevenue, bizRevenueMul), allIncomeMul), prestigeGlobalMul)

      // ── Costs (apply cost reduction multiplier — lower is better) ──
      const baseCosts = Formulas.operatingCosts(
        biz.employees,
        biz.baseSalary,
        economySim.getWageMultiplier(),
        biz.baseRent,
        biz.supplyCostPerUnit,
        unitsSold,
        biz.marketingBudget,
        ecoState.inflationIndex
      )
      // costReductionMul > 1 means costs should be lower; interpret multiplier as divisor
      const costs = costReductionMul.gt(1) ? div(baseCosts, costReductionMul) : baseCosts

      // ── Profit ──
      const profit = sub(revenue, costs)

      // ── Update live performance stats ──
      const priceFactor = biz.optimalPrice > 0 && biz.pricePerUnit > 0
        ? Math.pow(biz.optimalPrice / biz.pricePerUnit, biz.elasticity)
        : 1.0
      biz.currentCustomers = customers
      biz.maxCapacity = maxOutput
      biz.unitsSold = unitsSold
      biz.utilization = maxOutput > 0 ? unitsSold / maxOutput : 0
      biz.revenuePerTick = revenue
      biz.costsPerTick = costs
      biz.profitPerTick = profit
      biz.priceFactor = priceFactor
      biz.qualityFactor = 0.5 + (biz.quality / 100) * 1.5
      biz.marketingFactor = 1.0 + Math.sqrt(biz.marketingBudget / 25)

      // Update cumulative stats
      biz.totalRevenue = add(biz.totalRevenue, revenue)
      biz.totalCosts = add(biz.totalCosts, costs)
      biz.totalProfit = add(biz.totalProfit, profit)
      biz.ticksOwned++

      // Rolling average profit (exponential moving average, α=0.01)
      const alpha = 0.01
      biz.avgProfitPerTick = add(
        mul(biz.avgProfitPerTick, 1 - alpha),
        mul(profit, alpha)
      )

      totalNet = add(totalNet, profit)

      // ── Credit / accumulate based on manager ──
      if (biz.hasManager) {
        // Auto-collect: credit/debit immediately
        if (profit.gt(ZERO)) {
          player.earnCash(profit)
          player.addXp(D(0.05))
        } else if (profit.lt(ZERO)) {
          const loss = profit.abs()
          if (gte(player.cash, loss)) {
            player.spendCash(loss)
          } else {
            player.spendCash(player.cash)
          }
        }
      } else {
        // No manager: accumulate positive profit for manual collection.
        // Losses are still deducted automatically (you can't ignore expenses).
        if (profit.gt(ZERO)) {
          biz.pendingProfit = add(biz.pendingProfit, profit)
        } else if (profit.lt(ZERO)) {
          // First eat into pending, then deduct from cash
          const loss = profit.abs()
          if (biz.pendingProfit.gte(loss)) {
            biz.pendingProfit = sub(biz.pendingProfit, loss)
          } else {
            const remaining = sub(loss, biz.pendingProfit)
            biz.pendingProfit = ZERO
            if (gte(player.cash, remaining)) {
              player.spendCash(remaining)
            } else {
              player.spendCash(player.cash)
            }
          }
        }
      }
    }

    return totalNet
  }

  /** Reset on prestige */
  function prestigeReset(): void {
    businesses.value = []
  }

  /** Load from save */
  function loadFromSave(savedBusinesses: OwnedBusiness[]): void {
    // Migrate old saves that may lack manager fields
    const migrated = (savedBusinesses ?? []).map((biz) => ({
      ...biz,
      hasManager: biz.hasManager ?? false,
      managerCost: biz.managerCost ? D(biz.managerCost) : mul(D(biz.purchasePrice), 0.5),
      pendingProfit: biz.pendingProfit ? D(biz.pendingProfit) : ZERO,
    }))
    businesses.value = migrated
  }

  return {
    // State
    businesses,
    // Computed
    totalProfitPerTick,
    profitPerSecond,
    totalBusinessValue,
    // Actions
    buyBusiness,
    sellBusiness,
    hireEmployee,
    fireEmployee,
    setPrice,
    setMarketingBudget,
    upgradeQuality,
    renameBusiness,
    hireManager,
    collectProfit,
    tick,
    prestigeReset,
    loadFromSave,
  }
})
