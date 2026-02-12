/**
 * useRealEstateStore — Property management with condition, occupancy, expenses
 *
 * Deep mechanics:
 * - Condition (0–100): Degrades over time via wearRate. Low condition → lower occupancy, lower rent.
 *   Player repairs to restore condition. Renovations permanently boost rent & value.
 * - Occupancy (0–1): Computed each tick from condition, rent pricing vs market, economy cycle.
 *   Only occupied units generate rent.
 * - Operating expenses: Maintenance + property tax + insurance, deducted from gross rent.
 * - Market value: Fluctuates with economy state (expansion = appreciation, contraction = depreciation).
 * - Rent adjustable by player: Set rent multiplier (higher = more per unit but lower occupancy).
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, mul, gte } from '@renderer/core/BigNum'
import { economySim } from '@renderer/core/EconomySim'
import type { TickContext } from '@renderer/core/GameEngine'
import { usePlayerStore } from './usePlayerStore'
import type { PropertyCategory } from '@renderer/data/properties'

// ─── Types ────────────────────────────────────────────────────

export interface Property {
  id: string
  definitionId: string
  name: string
  icon: string
  category: PropertyCategory

  // ── Core property data ──
  units: number
  purchasePrice: Decimal
  currentValue: Decimal
  baseRent: Decimal

  // ── Player-adjustable levers ──
  /** Rent multiplier set by player (1.0 = market rate, higher = greedier) */
  rentMultiplier: number
  /** Custom name given by player */
  customName?: string

  // ── Condition & renovation ──
  /** Physical condition 0–100. Affects occupancy and rent quality. */
  condition: number
  /** Rate of condition degradation per tick */
  wearRate: number
  /** Renovation level (permanent improvements) */
  renovationLevel: number
  maxRenovationLevel: number
  /** Base cost for renovation (scales with level) */
  renovationCostBase: Decimal
  renovationCostGrowth: number

  // ── Expenses ──
  /** Base maintenance cost per tick */
  baseMaintenance: Decimal
  /** Property tax rate (annual, applied per tick) */
  taxRate: number
  /** Base appreciation rate */
  baseAppreciationRate: number

  // ── Live stats (updated each tick) ──
  /** Current occupancy rate 0–1 */
  occupancy: number
  /** Occupied units count */
  occupiedUnits: number
  /** Gross rent this tick */
  grossRentPerTick: Decimal
  /** Total expenses this tick (maintenance + tax + insurance) */
  expensesPerTick: Decimal
  /** Net income this tick (gross rent - expenses) */
  netIncomePerTick: Decimal

  // ── Tracked stats ──
  totalRentEarned: Decimal
  totalExpensesPaid: Decimal
  totalNetIncome: Decimal
  ownedSinceTick: number
  /** Repair cost for next repair action */
  repairCost: Decimal
}

export const useRealEstateStore = defineStore('realEstate', () => {
  const properties = ref<Property[]>([])
  const totalRentEarned = ref<Decimal>(ZERO)
  /** Global multiplier set by upgrades/events/prestige (set each tick by game loop) */
  const globalRentMultiplier = ref<Decimal>(D(1))

  // ─── Computed ─────────────────────────────────────────────────

  const totalPropertyValue = computed(() => {
    let total = ZERO
    for (const p of properties.value) total = add(total, p.currentValue)
    return total
  })

  const totalNetIncomePerTick = computed(() => {
    let total = ZERO
    for (const p of properties.value) total = add(total, p.netIncomePerTick)
    return total
  })

  const rentPerSecond = computed(() => mul(totalNetIncomePerTick.value, 10))

  // Keep backward compat for useInitGame references
  const totalRentPerTick = totalNetIncomePerTick

  // ─── Helpers ──────────────────────────────────────────────────

  /**
   * Compute occupancy rate based on condition, rent pricing, economy, and renovation.
   * occupancy = conditionFactor × priceFactor × economyFactor × (1 + renovationBonus)
   * Clamped to [0, 1].
   */
  function computeOccupancy(
    condition: number,
    rentMultiplier: number,
    renovationLevel: number,
    economyConfidence: number
  ): number {
    // Condition factor: condition 100 → 1.0, condition 50 → 0.7, condition 0 → 0.2
    const conditionFactor = 0.2 + (condition / 100) * 0.8

    // Price factor: at 1.0x market = 0.95 occupancy base, at 2.0x = 0.4, at 0.5x = 1.0
    // Uses inverse curve: priceFactor = 1 / (rentMultiplier ^ 0.8)
    const priceFactor = Math.pow(1 / Math.max(0.1, rentMultiplier), 0.8)

    // Economy factor: consumer confidence affects demand for rentals
    const economyFactor = 0.6 + economyConfidence * 0.4

    // Renovation bonus: each level adds 3% occupancy bonus
    const renovationBonus = 1 + renovationLevel * 0.03

    return Math.min(1, Math.max(0, conditionFactor * priceFactor * economyFactor * renovationBonus))
  }

  /**
   * Compute repair cost based on condition deficit and property value.
   * Cheaper to repair from 80→100 than from 20→100.
   */
  function computeRepairCost(currentValue: Decimal, condition: number): Decimal {
    const deficit = 100 - condition
    if (deficit <= 0) return ZERO
    // Cost = 0.5% of property value per condition point missing
    return mul(currentValue, deficit * 0.005)
  }

  function getRenovationCost(prop: Property): Decimal {
    return mul(prop.renovationCostBase, Math.pow(prop.renovationCostGrowth, prop.renovationLevel))
  }

  // ─── Actions ──────────────────────────────────────────────────

  function buyProperty(
    defData: {
      id: string
      definitionId: string
      name: string
      icon: string
      category: PropertyCategory
      units: number
      purchasePrice: Decimal
      baseRent: Decimal
      baseMaintenance: Decimal
      wearRate: number
      taxRate: number
      baseAppreciationRate: number
      renovationCostMultiplier: number
      maxRenovationLevel: number
    },
    currentTick: number
  ): boolean {
    const player = usePlayerStore()
    if (!gte(player.cash, defData.purchasePrice)) return false
    if (!player.spendCash(defData.purchasePrice)) return false

    const newProp: Property = {
      id: defData.id,
      definitionId: defData.definitionId,
      name: defData.name,
      icon: defData.icon,
      category: defData.category,
      units: defData.units,
      purchasePrice: defData.purchasePrice,
      currentValue: defData.purchasePrice,
      baseRent: defData.baseRent,
      rentMultiplier: 1.0,
      condition: 100,
      wearRate: defData.wearRate,
      renovationLevel: 0,
      maxRenovationLevel: defData.maxRenovationLevel,
      renovationCostBase: mul(defData.purchasePrice, 0.08),
      renovationCostGrowth: defData.renovationCostMultiplier,
      baseMaintenance: defData.baseMaintenance,
      taxRate: defData.taxRate,
      baseAppreciationRate: defData.baseAppreciationRate,
      // Live stats initialized
      occupancy: 1.0,
      occupiedUnits: defData.units,
      grossRentPerTick: ZERO,
      expensesPerTick: ZERO,
      netIncomePerTick: ZERO,
      // Tracked stats
      totalRentEarned: ZERO,
      totalExpensesPaid: ZERO,
      totalNetIncome: ZERO,
      ownedSinceTick: currentTick,
      repairCost: ZERO,
    }
    properties.value.push(newProp)
    player.addXp(D(30))
    return true
  }

  /** Repair property to 100% condition */
  function repairProperty(propertyId: string): boolean {
    const prop = properties.value.find((p) => p.id === propertyId)
    if (!prop || prop.condition >= 99.5) return false

    const cost = computeRepairCost(prop.currentValue, prop.condition)
    const player = usePlayerStore()
    if (!player.spendCash(cost)) return false

    prop.condition = 100
    prop.repairCost = ZERO
    return true
  }

  /** Renovate property (permanent upgrade) */
  function renovateProperty(propertyId: string): boolean {
    const prop = properties.value.find((p) => p.id === propertyId)
    if (!prop || prop.renovationLevel >= prop.maxRenovationLevel) return false

    const player = usePlayerStore()
    const cost = getRenovationCost(prop)
    if (!player.spendCash(cost)) return false

    prop.renovationLevel++
    // Renovation also boosts base rent by 12% per level
    prop.baseRent = mul(prop.baseRent, 1.12)
    // And adds 5% to current value
    prop.currentValue = mul(prop.currentValue, 1.05)
    return true
  }

  /** Set rent multiplier (player pricing decision) */
  function setRentMultiplier(propertyId: string, multiplier: number): void {
    const prop = properties.value.find((p) => p.id === propertyId)
    if (prop) {
      prop.rentMultiplier = Math.max(0.5, Math.min(3.0, multiplier))
    }
  }

  /** Rename a property */
  function renameProperty(propertyId: string, newName: string): void {
    const prop = properties.value.find((p) => p.id === propertyId)
    if (prop) {
      prop.customName = newName.trim() || undefined
    }
  }

  /** Sell a property for 90% of current market value */
  function sellProperty(propertyId: string): Decimal | null {
    const idx = properties.value.findIndex((p) => p.id === propertyId)
    if (idx === -1) return null

    const player = usePlayerStore()
    const prop = properties.value[idx]
    // Selling fee: 10% of value. Condition also affects sell price.
    const conditionPenalty = 0.5 + (prop.condition / 100) * 0.5 // 50%–100% of value depending on condition
    const sellPrice = mul(mul(prop.currentValue, 0.9), conditionPenalty)

    player.earnCash(sellPrice)
    properties.value.splice(idx, 1)
    return sellPrice
  }

  // ─── Game Tick ────────────────────────────────────────────────

  function tick(_ctx: TickContext): Decimal {
    const player = usePlayerStore()
    const ecoState = economySim.getState()
    const combinedMul = globalRentMultiplier.value

    let totalPayout = ZERO

    for (const prop of properties.value) {
      // ── Condition degradation ──
      prop.condition = Math.max(0, prop.condition - prop.wearRate)

      // ── Compute occupancy ──
      prop.occupancy = computeOccupancy(
        prop.condition,
        prop.rentMultiplier,
        prop.renovationLevel,
        ecoState.consumerConfidence
      )
      prop.occupiedUnits = Math.round(prop.units * prop.occupancy)

      // ── Gross rent ──
      // rent = baseRent × rentMultiplier × occupancy × globalMultiplier
      const grossRent = mul(
        mul(mul(prop.baseRent, prop.rentMultiplier), prop.occupancy),
        combinedMul
      )
      prop.grossRentPerTick = grossRent

      // ── Operating expenses ──
      // Maintenance: scales with condition deficit (worse condition = higher maintenance)
      const conditionPenalty = 1 + ((100 - prop.condition) / 100) * 0.5 // 1.0x at 100, 1.5x at 0
      const maintenance = mul(prop.baseMaintenance, conditionPenalty)

      // Property tax: annual rate / ticks per year, applied to current value
      const ticksPerYear = 10 * 3600 * 24 * 365
      const taxPerTick = mul(mul(prop.currentValue, prop.taxRate), 1 / ticksPerYear)

      // Insurance: ~0.3% of property value per year
      const insurancePerTick = mul(mul(prop.currentValue, 0.003), 1 / ticksPerYear)

      const expenses = add(add(maintenance, taxPerTick), insurancePerTick)
      prop.expensesPerTick = expenses

      // ── Net income ──
      const netIncome = sub(grossRent, expenses)
      prop.netIncomePerTick = netIncome

      // ── Update tracked stats ──
      prop.totalRentEarned = add(prop.totalRentEarned, grossRent)
      prop.totalExpensesPaid = add(prop.totalExpensesPaid, expenses)
      prop.totalNetIncome = add(prop.totalNetIncome, netIncome)

      // ── Update repair cost ──
      prop.repairCost = computeRepairCost(prop.currentValue, prop.condition)

      // ── Market value appreciation/depreciation ──
      // Every 1000 ticks (~100s), adjust value based on economy phase
      const ticksOwned = _ctx.tick - prop.ownedSinceTick
      if (ticksOwned > 0 && ticksOwned % 1000 === 0) {
        let appreciationMul = prop.baseAppreciationRate
        // Economy phase modifies appreciation
        if (ecoState.cyclePhase === 'expansion') appreciationMul *= 2.0
        else if (ecoState.cyclePhase === 'peak') appreciationMul *= 1.5
        else if (ecoState.cyclePhase === 'contraction') appreciationMul *= -0.5
        else if (ecoState.cyclePhase === 'trough') appreciationMul *= 0.0

        // Condition affects appreciation (bad condition = depreciation)
        if (prop.condition < 30) appreciationMul -= 0.002

        prop.currentValue = mul(prop.currentValue, 1 + appreciationMul)
        // Floor: never below 30% of purchase price
        const minValue = mul(prop.purchasePrice, 0.3)
        if (prop.currentValue.lt(minValue)) prop.currentValue = minValue
      }

      totalPayout = add(totalPayout, netIncome)
    }

    // Credit or debit player cash
    if (totalPayout.gt(ZERO)) {
      player.earnCash(totalPayout)
      player.addXp(D(0.2))
    } else if (totalPayout.lt(ZERO)) {
      const loss = totalPayout.abs()
      if (gte(player.cash, loss)) {
        player.spendCash(loss)
      } else {
        player.spendCash(player.cash)
      }
    }

    totalRentEarned.value = add(totalRentEarned.value, totalPayout.gt(ZERO) ? totalPayout : ZERO)
    return totalPayout
  }

  /** Reset on prestige */
  function prestigeReset(): void {
    properties.value = []
    totalRentEarned.value = ZERO
  }

  /** Load from save */
  function loadFromSave(savedProperties: Property[]): void {
    properties.value = (savedProperties ?? []).map((p) => ({
      ...p,
      // Ensure new fields have defaults for old saves
      units: p.units ?? 1,
      category: p.category ?? 'Residential',
      rentMultiplier: p.rentMultiplier ?? 1.0,
      condition: p.condition ?? 100,
      wearRate: p.wearRate ?? 0.002,
      renovationLevel: p.renovationLevel ?? (p as any).upgradeLevel ?? 0,
      maxRenovationLevel: p.maxRenovationLevel ?? (p as any).maxUpgradeLevel ?? 10,
      renovationCostBase: p.renovationCostBase ?? (p as any).upgradeCostBase ?? mul(p.purchasePrice, 0.08),
      renovationCostGrowth: p.renovationCostGrowth ?? (p as any).upgradeGrowthRate ?? 1.5,
      baseMaintenance: p.baseMaintenance ?? D(1),
      taxRate: p.taxRate ?? 0.01,
      baseAppreciationRate: p.baseAppreciationRate ?? 0.001,
      occupancy: p.occupancy ?? 1.0,
      occupiedUnits: p.occupiedUnits ?? (p.units ?? 1),
      grossRentPerTick: p.grossRentPerTick ?? ZERO,
      expensesPerTick: p.expensesPerTick ?? ZERO,
      netIncomePerTick: p.netIncomePerTick ?? ZERO,
      totalExpensesPaid: p.totalExpensesPaid ?? ZERO,
      totalNetIncome: p.totalNetIncome ?? ZERO,
      repairCost: p.repairCost ?? ZERO,
    }))
    // Recalculate totalRentEarned
    let total = ZERO
    for (const p of properties.value) {
      total = add(total, p.totalRentEarned || ZERO)
    }
    totalRentEarned.value = total
  }

  return {
    // State
    properties,
    totalRentEarned,
    globalRentMultiplier,
    // Computed
    totalPropertyValue,
    totalNetIncomePerTick,
    totalRentPerTick,
    rentPerSecond,
    // Actions
    buyProperty,
    repairProperty,
    renovateProperty,
    setRentMultiplier,
    renameProperty,
    sellProperty,
    getRenovationCost,
    // Game loop
    tick,
    prestigeReset,
    loadFromSave,
  }
})
