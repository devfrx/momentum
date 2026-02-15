/**
 * useBusinessStore — Complete rework: "Business Empire: Infinite Scaling"
 *
 * - Infinite levels (cost × 1.15^level, output × level^1.05)
 * - Infinite branches (cost × 1.5^branches, geo tier bonuses)
 * - Infinite upgrades with log2 scaling
 * - Mega-Corporation fusion system
 * - Continuous policy sliders
 * - Staff training (infinite, +5% per level)
 * - Category synergies
 * - Reputation system (0-100)
 * - Advisor system
 * - Automatic milestones
 *
 * Fully compatible with: multipliers, prestige, skill tree, events,
 * XP, i18n, save/load, gist cloud, offline calc, achievements, economy sim.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, div, pow, gte } from '@renderer/core/BigNum'
import { Formulas } from '@renderer/core'
import { economySim } from '@renderer/core/EconomySim'
import type { TickContext } from '@renderer/core/GameEngine'
import {
  BUSINESS_DEFS,
  LEVEL_COST_GROWTH,
  LEVEL_OUTPUT_EXPONENT,
  BRANCH_COST_GROWTH,
  TRAINING_COST_GROWTH,
  BUSINESS_UPGRADES,
  POLICIES,
  ADVISOR_DEFS,
  computePolicyEffects,
  advisorCost,
  advisorEffect,
  getActiveMilestones,
  aggregateMilestoneBonuses,
  synergyCategoryMultiplier,
  getGeoTier,
  MEGA_CORP_REQUIREMENTS,
  marketDominanceMultiplier,
} from '@renderer/data/businesses'
import type {
  BusinessDef,
  BusinessCategory,
  AdvisorType,
  AdvisorState,
} from '@renderer/data/businesses'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'
import { usePrestigeStore } from './usePrestigeStore'
import { useEventStore } from './useEventStore'

// ─── Types ────────────────────────────────────────────────────

export interface BusinessUpgradeState {
  upgradeId: string
  level: number
}

export interface OwnedBusiness {
  /** Unique instance id */
  id: string
  /** BusinessDef.id reference */
  defId: string
  name: string
  icon: string
  category: BusinessCategory

  /** Player-chosen custom name */
  customName?: string

  // ── Scaling ──
  level: number
  branches: number
  trainingLevel: number

  // ── Operational levers (player adjustable) ──
  employees: number
  pricePerUnit: number
  marketingBudget: number
  quality: number

  // ── Policies (slider 0-100) ──
  policies: Record<string, number>

  // ── Upgrades (per-business levels) ──
  upgrades: BusinessUpgradeState[]

  // ── Advisors ──
  advisors: AdvisorState[]

  // ── Reputation (0-100) ──
  reputation: number

  // ── Mega-Corp ──
  isCorporation: boolean

  // ── Fixed from definition ──
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
  avgProfitPerTick: Decimal
  ticksOwned: number

  // ── Live stats (updated each tick) ──
  currentCustomers: number
  maxCapacity: number
  unitsSold: number
  utilization: number
  revenuePerTick: Decimal
  costsPerTick: Decimal
  profitPerTick: Decimal
  priceFactor: number
  qualityFactor: number
  marketingFactor: number

  // ── Manager ──
  hasManager: boolean
  managerCost: Decimal
  pendingProfit: Decimal
}

export const useBusinessStore = defineStore('business', () => {
  const businesses = ref<OwnedBusiness[]>([])

  // ─── Computed ─────────────────────────────────────────────────

  const totalProfitPerTick = computed<Decimal>(() => {
    let total = ZERO
    for (const biz of businesses.value) {
      total = add(total, biz.avgProfitPerTick)
    }
    return total
  })

  const profitPerSecond = computed<Decimal>(() => mul(totalProfitPerTick.value, 10))

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

  /** Category counts for synergy calculation */
  const categoryCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const biz of businesses.value) {
      counts[biz.category] = (counts[biz.category] || 0) + 1
    }
    return counts
  })

  const totalBusinessCount = computed(() => businesses.value.length)
  const totalLevels = computed(() => businesses.value.reduce((sum, b) => sum + b.level, 0))
  const totalBranches = computed(() => businesses.value.reduce((sum, b) => sum + b.branches, 0))
  const corporationCount = computed(() => businesses.value.filter(b => b.isCorporation).length)

  // ─── Helpers ──────────────────────────────────────────────────

  function getDef(defId: string): BusinessDef | undefined {
    return BUSINESS_DEFS.find(d => d.id === defId)
  }

  function getLevelCost(biz: OwnedBusiness): Decimal {
    return mul(biz.purchasePrice, pow(D(LEVEL_COST_GROWTH), biz.level))
  }

  function getBranchCost(biz: OwnedBusiness): Decimal {
    const def = getDef(biz.defId)
    if (!def) return D(1e18)
    return mul(def.branchBaseCost, pow(D(BRANCH_COST_GROWTH), biz.branches))
  }

  function getTrainingCost(biz: OwnedBusiness): Decimal {
    const def = getDef(biz.defId)
    if (!def) return D(1e18)
    return mul(def.trainingBaseCost, pow(D(TRAINING_COST_GROWTH), biz.trainingLevel))
  }

  function getTrainingMultiplier(biz: OwnedBusiness): number {
    return 1 + biz.trainingLevel * 0.05
  }

  function getMaxEmployees(biz: OwnedBusiness): number {
    const def = getDef(biz.defId)
    if (!def) return 10
    // Also factor in upgrade-provided employee capacity
    let upgEmpCap = 0
    for (const state of biz.upgrades) {
      const upgDef = BUSINESS_UPGRADES.find(u => u.id === state.upgradeId)
      if (upgDef?.effectType === 'employee_capacity') {
        upgEmpCap += getUpgradeBonus(state.upgradeId, state.level)
      }
    }
    return def.maxEmployeesBase + Math.floor(biz.level / 5) * 2 + Math.floor(upgEmpCap)
  }

  function getLevelOutputMult(level: number): number {
    return Math.pow(level, LEVEL_OUTPUT_EXPONENT)
  }

  function getUpgradeCost(biz: OwnedBusiness, upgradeId: string): Decimal {
    const upgDef = BUSINESS_UPGRADES.find(u => u.id === upgradeId)
    if (!upgDef) return D(1e18)
    const state = biz.upgrades.find(u => u.upgradeId === upgradeId)
    const level = state?.level ?? 0
    return mul(upgDef.baseCost, pow(D(upgDef.costGrowth), level))
  }

  function getUpgradeBonus(upgradeId: string, level: number): number {
    const upgDef = BUSINESS_UPGRADES.find(u => u.id === upgradeId)
    if (!upgDef || level <= 0) return 0
    return upgDef.baseBonus * Math.log2(level + 1)
  }

  function getApplicableUpgrades(biz: OwnedBusiness) {
    return BUSINESS_UPGRADES.filter(u => {
      if (biz.level < u.unlockAtBusinessLevel) return false
      if (u.categories && !u.categories.includes(biz.category)) return false
      return true
    })
  }

  function canBecomeCorporation(biz: OwnedBusiness): boolean {
    return (
      !biz.isCorporation &&
      biz.level >= MEGA_CORP_REQUIREMENTS.minLevel &&
      biz.branches >= MEGA_CORP_REQUIREMENTS.minBranches
    )
  }

  // ─── Actions ──────────────────────────────────────────────────

  function buyBusiness(defId: string): boolean {
    const def = BUSINESS_DEFS.find(d => d.id === defId)
    if (!def) return false

    const player = usePlayerStore()
    if (!player.spendCash(def.purchasePrice)) return false

    const defaultPolicies: Record<string, number> = {}
    for (const p of POLICIES) {
      defaultPolicies[p.id] = p.defaultValue
    }

    businesses.value.push({
      id: `${def.id}_${Date.now()}`,
      defId: def.id,
      name: def.name,
      icon: def.icon,
      category: def.category,
      level: 1,
      branches: 0,
      trainingLevel: 0,
      employees: 1,
      pricePerUnit: def.optimalPrice,
      marketingBudget: 0,
      quality: def.baseQuality,
      policies: defaultPolicies,
      upgrades: [],
      advisors: [],
      reputation: 50,
      isCorporation: false,
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
      hasManager: false,
      managerCost: mul(def.purchasePrice, 0.5),
      pendingProfit: ZERO,
    })

    player.addXp(D(50))
    return true
  }

  function levelUp(businessId: string): boolean {
    const biz = businesses.value.find(b => b.id === businessId)
    if (!biz) return false
    const cost = getLevelCost(biz)
    const player = usePlayerStore()
    if (!player.spendCash(cost)) return false
    biz.level++
    player.addXp(D(10 + biz.level * 2))
    return true
  }

  function levelUpBulk(businessId: string, count: number): number {
    let bought = 0
    for (let i = 0; i < count; i++) {
      if (!levelUp(businessId)) break
      bought++
    }
    return bought
  }

  function openBranch(businessId: string): boolean {
    const biz = businesses.value.find(b => b.id === businessId)
    if (!biz) return false
    const cost = getBranchCost(biz)
    const player = usePlayerStore()
    if (!player.spendCash(cost)) return false
    biz.branches++
    player.addXp(D(25 + biz.branches * 5))
    return true
  }

  function trainStaff(businessId: string): boolean {
    const biz = businesses.value.find(b => b.id === businessId)
    if (!biz) return false
    const cost = getTrainingCost(biz)
    const player = usePlayerStore()
    if (!player.spendCash(cost)) return false
    biz.trainingLevel++
    player.addXp(D(15))
    return true
  }

  function purchaseUpgrade(businessId: string, upgradeId: string): boolean {
    const biz = businesses.value.find(b => b.id === businessId)
    if (!biz) return false
    const upgDef = BUSINESS_UPGRADES.find(u => u.id === upgradeId)
    if (!upgDef) return false
    if (biz.level < upgDef.unlockAtBusinessLevel) return false
    if (upgDef.categories && !upgDef.categories.includes(biz.category)) return false
    const cost = getUpgradeCost(biz, upgradeId)
    const player = usePlayerStore()
    if (!player.spendCash(cost)) return false
    let state = biz.upgrades.find(u => u.upgradeId === upgradeId)
    if (state) {
      state.level++
    } else {
      biz.upgrades.push({ upgradeId, level: 1 })
    }
    player.addXp(D(20))
    return true
  }

  function hireAdvisor(businessId: string, advisorType: AdvisorType): boolean {
    const biz = businesses.value.find(b => b.id === businessId)
    if (!biz) return false
    const advDef = ADVISOR_DEFS.find(a => a.type === advisorType)
    if (!advDef) return false
    let state = biz.advisors.find(a => a.type === advisorType)
    const currentLevel = state?.level ?? 0
    const cost = advisorCost(biz.purchasePrice, advDef, currentLevel)
    const player = usePlayerStore()
    if (!player.spendCash(cost)) return false
    if (state) {
      state.level++
    } else {
      biz.advisors.push({ type: advisorType, level: 1, hired: true })
      if (advisorType === 'operations' && !biz.hasManager) {
        biz.hasManager = true
        if (biz.pendingProfit.gt(ZERO)) {
          player.earnCash(biz.pendingProfit)
          biz.pendingProfit = ZERO
        }
      }
    }
    player.addXp(D(30))
    return true
  }

  function setPolicy(businessId: string, policyId: string, value: number): void {
    const biz = businesses.value.find(b => b.id === businessId)
    if (biz) biz.policies[policyId] = Math.max(0, Math.min(100, value))
  }

  function becomeCorporation(businessId: string): boolean {
    const biz = businesses.value.find(b => b.id === businessId)
    if (!biz || !canBecomeCorporation(biz)) return false
    biz.isCorporation = true
    biz.reputation = Math.min(100, biz.reputation + 10)
    const player = usePlayerStore()
    player.addXp(D(500))
    return true
  }

  function sellBusiness(businessId: string): Decimal {
    const idx = businesses.value.findIndex(b => b.id === businessId)
    if (idx === -1) return ZERO
    const biz = businesses.value[idx]
    const valuation = Formulas.businessValuation(
      biz.avgProfitPerTick, biz.purchasePrice, biz.sectorMultiplier
    )
    const player = usePlayerStore()
    player.earnCash(valuation)
    businesses.value.splice(idx, 1)
    return valuation
  }

  function hireEmployee(businessId: string): boolean {
    const biz = businesses.value.find(b => b.id === businessId)
    if (!biz) return false
    const maxEmp = getMaxEmployees(biz)
    if (biz.employees >= maxEmp) return false
    biz.employees++
    return true
  }

  function fireEmployee(businessId: string): boolean {
    const biz = businesses.value.find(b => b.id === businessId)
    if (!biz || biz.employees <= 1) return false
    biz.employees--
    return true
  }

  function setPrice(businessId: string, price: number): void {
    const biz = businesses.value.find(b => b.id === businessId)
    if (biz && price > 0) biz.pricePerUnit = price
  }

  function setMarketingBudget(businessId: string, budget: number): void {
    const biz = businesses.value.find(b => b.id === businessId)
    if (biz && budget >= 0) biz.marketingBudget = budget
  }

  function upgradeQuality(businessId: string): boolean {
    const biz = businesses.value.find(b => b.id === businessId)
    if (!biz) return false
    const player = usePlayerStore()
    if (!player.spendCash(biz.qualityUpgradeCost)) return false
    biz.quality++
    biz.qualityUpgradeCost = mul(biz.qualityUpgradeCost, 1.15)
    return true
  }

  function renameBusiness(businessId: string, newName: string): void {
    const biz = businesses.value.find(b => b.id === businessId)
    if (biz) biz.customName = newName.trim() || undefined
  }

  function hireManager(businessId: string): boolean {
    return hireAdvisor(businessId, 'operations')
  }

  function collectProfit(businessId: string): Decimal {
    const biz = businesses.value.find(b => b.id === businessId)
    if (!biz || biz.pendingProfit.lte(ZERO)) return ZERO
    const player = usePlayerStore()
    const amount = biz.pendingProfit
    player.earnCash(amount)
    biz.pendingProfit = ZERO
    return amount
  }

  // ─── Tick ─────────────────────────────────────────────────────

  function tick(_ctx: TickContext): Decimal {
    const player = usePlayerStore()
    const ecoState = economySim.getState()
    const upgrades = useUpgradeStore()
    const prestige = usePrestigeStore()
    const events = useEventStore()

    // Global multipliers
    const bizRevenueMul = upgrades.getMultiplier('business_revenue')
    const costReductionMul = upgrades.getMultiplier('cost_reduction')
    const customerAttractionMul = upgrades.getMultiplier('customer_attraction')
    const allIncomeMul = upgrades.getMultiplier('all_income')
    const prestigeGlobalMul = prestige.globalMultiplier

    // Event multipliers (FIX: now correctly applying business events in tick)
    const bizEventRevMul = D(events.getMultiplier('income_multiplier', 'business'))
    const bizEventCostMul = D(events.getMultiplier('cost_multiplier'))
    const generalEventIncomeMul = D(events.getMultiplier('income_multiplier'))

    let totalNet = ZERO

    for (const biz of businesses.value) {
      // ── Level & Branch scaling ──
      const levelMult = getLevelOutputMult(biz.level)
      const geoTier = getGeoTier(biz.branches)
      const geoMult = geoTier.revenueMultiplier

      // ── Synergy ──
      const catCount = categoryCounts.value[biz.category] || 1
      const synergyMult = synergyCategoryMultiplier(catCount)

      // ── Corporation bonuses ──
      const corpMult = biz.isCorporation ? marketDominanceMultiplier(catCount) : 1

      // ── Training ──
      const trainingMult = getTrainingMultiplier(biz)

      // ── Milestones ──
      const totalUpgLevels = biz.upgrades.reduce((s, u) => s + u.level, 0)
      const milestones = getActiveMilestones(biz.level, biz.branches, totalUpgLevels)
      const msBonus = aggregateMilestoneBonuses(milestones)

      // ── Per-business upgrade bonuses ──
      let upgRevMult = 1
      let upgCostRedMult = 1
      let upgCustMult = 1
      let upgOutputMult = 1
      let upgQualMult = 1
      for (const state of biz.upgrades) {
        const bonus = getUpgradeBonus(state.upgradeId, state.level)
        const upgDef = BUSINESS_UPGRADES.find(u => u.id === state.upgradeId)
        if (!upgDef) continue
        switch (upgDef.effectType) {
          case 'revenue_mult': upgRevMult += bonus; break
          case 'cost_reduction': upgCostRedMult += bonus; break
          case 'customer_mult': upgCustMult += bonus; break
          case 'output_mult': upgOutputMult += bonus; break
          case 'quality_mult': upgQualMult += bonus; break
          default: break
        }
      }

      // ── Advisor effects ──
      let advCostReduction = 0
      let advMarketingEff = 0
      let advOutputBoost = 0
      let hasCFO = false
      for (const adv of biz.advisors) {
        const advDef = ADVISOR_DEFS.find(a => a.type === adv.type)
        if (!advDef || adv.level <= 0) continue
        const eff = advisorEffect(advDef, adv.level)
        switch (adv.type) {
          case 'operations': advCostReduction += eff; break
          case 'marketing': advMarketingEff += eff; break
          case 'hr': advOutputBoost += eff; break
          case 'cfo': hasCFO = true; break
        }
      }

      // ── CFO auto-pricing ──
      if (hasCFO) {
        const diff = biz.optimalPrice - biz.pricePerUnit
        if (Math.abs(diff) > 0.01) {
          biz.pricePerUnit += diff * 0.02
        }
      }

      // ── Policies ──
      const policyEffects = computePolicyEffects(biz.policies, biz.reputation)

      // ── Demand (customers) ──
      const effectiveQuality = biz.quality * upgQualMult
      const baseCustomers = Formulas.customerDemand(
        biz.baseCustomers,
        biz.pricePerUnit,
        biz.optimalPrice,
        effectiveQuality,
        biz.marketingBudget * (1 + advMarketingEff) * policyEffects.marketingEfficiency,
        economySim.getDemandMultiplier(),
        biz.elasticity
      )
      const repFactor = Math.max(0.01, biz.reputation / 50) // rep=50 → ×1
      const customers = Math.floor(
        baseCustomers
        * customerAttractionMul.toNumber()
        * upgCustMult
        * policyEffects.customerMult
        * (1 + msBonus.customer_attraction)
        * repFactor
      )

      // ── Production capacity ──
      const effectiveOutput = biz.outputPerEmployee * levelMult * trainingMult * upgOutputMult * (1 + advOutputBoost) * policyEffects.outputMult
      const maxOutput = Math.floor(biz.employees * effectiveOutput * (1 + biz.branches * 0.5))
      const unitsSold = Math.min(customers, maxOutput)

      // ── Revenue ──
      const baseRevenue = D(unitsSold * biz.pricePerUnit)
      const revMultTotal = D(geoMult * synergyMult * corpMult * upgRevMult * policyEffects.revenueMult * (1 + msBonus.revenue_mult))
      const revenue = mul(
        mul(mul(mul(mul(baseRevenue, bizRevenueMul), allIncomeMul), prestigeGlobalMul), revMultTotal),
        mul(bizEventRevMul, generalEventIncomeMul)
      )

      // ── Costs ──
      const baseCosts = Formulas.operatingCosts(
        biz.employees,
        biz.baseSalary * policyEffects.costMult,
        economySim.getWageMultiplier(),
        biz.baseRent * (1 + biz.branches * 0.3),
        biz.supplyCostPerUnit,
        unitsSold,
        biz.marketingBudget,
        ecoState.inflationIndex
      )
      const costRedTotal = costReductionMul.toNumber() * upgCostRedMult * (1 + msBonus.cost_reduction)
      const afterCostRed = costRedTotal > 1 ? div(baseCosts, D(costRedTotal)) : baseCosts
      const afterEventCosts = mul(afterCostRed, bizEventCostMul)
      const costs = advCostReduction > 0 ? mul(afterEventCosts, D(1 - Math.min(0.9, advCostReduction))) : afterEventCosts

      // ── Profit ──
      const profit = sub(revenue, costs)

      // ── Update live stats ──
      const priceFactor = biz.optimalPrice > 0 && biz.pricePerUnit > 0
        ? Math.pow(biz.optimalPrice / biz.pricePerUnit, biz.elasticity) : 1.0
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

      biz.totalRevenue = add(biz.totalRevenue, revenue)
      biz.totalCosts = add(biz.totalCosts, costs)
      biz.totalProfit = add(biz.totalProfit, profit)
      biz.ticksOwned++

      // Rolling average (EMA, α=0.01)
      biz.avgProfitPerTick = add(mul(biz.avgProfitPerTick, 0.99), mul(profit, 0.01))

      totalNet = add(totalNet, profit)

      // ── Reputation update ──
      const qualFac = biz.quality / 100
      const prBal = Math.min(1, biz.optimalPrice / Math.max(0.01, biz.pricePerUnit))
      const repDelta = (qualFac * 0.3 + prBal * 0.3 - 0.3) * 0.01
      biz.reputation = Math.max(0, Math.min(100, biz.reputation + repDelta))

      // ── HR auto-train (every 100 ticks) ──
      const hrAdvisor = biz.advisors.find(a => a.type === 'hr')
      if (hrAdvisor && hrAdvisor.level > 0 && biz.ticksOwned % 100 === 0) {
        const tCost = getTrainingCost(biz)
        const p = usePlayerStore()
        if (p.spendCash(tCost)) biz.trainingLevel++
      }

      // ── Credit / accumulate ──
      if (biz.hasManager) {
        if (profit.gt(ZERO)) {
          player.earnCash(profit)
          player.addXp(D(0.05))
        } else if (profit.lt(ZERO)) {
          const loss = profit.abs()
          if (gte(player.cash, loss)) player.spendCash(loss)
          else player.spendCash(player.cash)
        }
      } else {
        if (profit.gt(ZERO)) {
          biz.pendingProfit = add(biz.pendingProfit, profit)
        } else if (profit.lt(ZERO)) {
          const loss = profit.abs()
          if (biz.pendingProfit.gte(loss)) {
            biz.pendingProfit = sub(biz.pendingProfit, loss)
          } else {
            const remaining = sub(loss, biz.pendingProfit)
            biz.pendingProfit = ZERO
            if (gte(player.cash, remaining)) player.spendCash(remaining)
            else player.spendCash(player.cash)
          }
        }
      }
    }

    return totalNet
  }

  function prestigeReset(): void {
    businesses.value = []
  }

  function loadFromSave(saved: unknown): void {
    if (!saved) return
    const arr = Array.isArray(saved) ? saved : (saved as Record<string, unknown>)?.businesses
    if (!Array.isArray(arr)) {
      // If saved is the old direct array format
      if (Array.isArray(saved)) {
        // already handled above
      }
      return
    }

    const migrated = arr.map((biz: Record<string, unknown>) => ({
      ...biz,
      defId: (biz.defId as string) ?? (biz.id as string)?.replace(/_\d+$/, '') ?? (biz.id as string),
      level: (biz.level as number) ?? 1,
      branches: (biz.branches as number) ?? 0,
      trainingLevel: (biz.trainingLevel as number) ?? 0,
      policies: (biz.policies as Record<string, number>) ?? Object.fromEntries(POLICIES.map(p => [p.id, p.defaultValue])),
      upgrades: (biz.upgrades as BusinessUpgradeState[]) ?? [],
      advisors: (biz.advisors as AdvisorState[]) ?? [],
      reputation: (biz.reputation as number) ?? 50,
      isCorporation: (biz.isCorporation as boolean) ?? false,
      hasManager: (biz.hasManager as boolean) ?? false,
      managerCost: biz.managerCost ? D(biz.managerCost as string | number) : mul(D(biz.purchasePrice as string | number || 100), 0.5),
      pendingProfit: biz.pendingProfit ? D(biz.pendingProfit as string | number) : ZERO,
      totalRevenue: biz.totalRevenue ? D(biz.totalRevenue as string | number) : ZERO,
      totalCosts: biz.totalCosts ? D(biz.totalCosts as string | number) : ZERO,
      totalProfit: biz.totalProfit ? D(biz.totalProfit as string | number) : ZERO,
      avgProfitPerTick: biz.avgProfitPerTick ? D(biz.avgProfitPerTick as string | number) : ZERO,
      revenuePerTick: biz.revenuePerTick ? D(biz.revenuePerTick as string | number) : ZERO,
      costsPerTick: biz.costsPerTick ? D(biz.costsPerTick as string | number) : ZERO,
      profitPerTick: biz.profitPerTick ? D(biz.profitPerTick as string | number) : ZERO,
      purchasePrice: biz.purchasePrice ? D(biz.purchasePrice as string | number) : ZERO,
      qualityUpgradeCost: biz.qualityUpgradeCost ? D(biz.qualityUpgradeCost as string | number) : D(100),
    })) as OwnedBusiness[]

    businesses.value = migrated
  }

  return {
    businesses,
    totalProfitPerTick,
    profitPerSecond,
    totalBusinessValue,
    categoryCounts,
    totalBusinessCount,
    totalLevels,
    totalBranches,
    corporationCount,
    getDef,
    getLevelCost,
    getBranchCost,
    getTrainingCost,
    getTrainingMultiplier,
    getMaxEmployees,
    getUpgradeCost,
    getUpgradeBonus,
    getApplicableUpgrades,
    canBecomeCorporation,
    buyBusiness,
    levelUp,
    levelUpBulk,
    openBranch,
    trainStaff,
    purchaseUpgrade,
    hireAdvisor,
    setPolicy,
    becomeCorporation,
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
