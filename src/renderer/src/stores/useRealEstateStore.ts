/**
 * useRealEstateStore — Full real estate management Pinia store
 *
 * Handles property ownership, opportunity generation, buying/selling,
 * rent collection, renovation, improvements, district scanning, synergies,
 * customization, save/load, and prestige resets.
 *
 * Compatible with: useGameLoop, useAutoSave, useInitGame, useMultipliers,
 * OfflineCalc, GameHeader, achievements, prestige, skill tree, events.
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, mul, sub } from '@renderer/core/BigNum'
import { Formulas } from '@renderer/core'
import {
  type PropertyDistrictCategory,
  type ImprovementId,
  type ManagementStyle,
  type PropertyTrait,
  type PropertyOpportunity,
  type ScoutPhase,
  getDistrict,
  getUnlockedDistricts,
  getCombinedSynergyBonus,
  getManagementStyle,
  getImprovement,
  getTrait,
  SCOUT_PHASES,
  APPRAISAL_DISCOUNT,
  generateOpportunity,
  generateScanOpportunity,
  generateOpportunityBatch,
  OPPORTUNITY_REFRESH_TICKS,
  MIN_OPPORTUNITIES,
  MAX_OPPORTUNITIES,
  PROPERTY_TEMPLATES,
} from '@renderer/data/realestate'
import type { TickContext } from '@renderer/core/GameEngine'
import { usePlayerStore } from './usePlayerStore'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface Property {
  id: string
  templateId: string
  name: string
  icon: string
  category: PropertyDistrictCategory
  districtId: string
  location: [number, number]

  /** Price originally paid */
  purchasePrice: Decimal
  /** Current market value (appreciates/depreciates) */
  currentValue: Decimal
  /** Base per-tick rent (before multipliers) */
  baseRent: Decimal
  /** Number of rentable units */
  units: number

  /** Condition 0-100 (affects occupancy & rent) */
  condition: number
  /** Wear rate — condition lost per tick */
  wearRate: number
  /** Tax rate applied to rent income */
  taxRate: number
  /** Base appreciation rate per appreciation period */
  baseAppreciationRate: number
  /** Per-tick maintenance cost */
  baseMaintenance: Decimal

  /** Renovation level (0 = none) */
  renovationLevel: number
  /** Max renovation level */
  maxRenovationLevel: number
  /** Cost scaling per renovation level */
  renovationCostMultiplier: number

  /** Installed improvements (player-purchased upgrades) */
  improvements: ImprovementId[]
  /** Max improvements (from template) */
  maxImprovements: number

  /** Immutable trait IDs */
  traits: string[]
  /** Player-chosen management style */
  managementStyle: ManagementStyle
  /** Player-assigned rent multiplier (0.5-2.0) */
  rentMultiplier: number

  /** Custom name set by player */
  customName: string | null

  /** Tick when purchased */
  purchasedAtTick: number
  /** Occupancy percentage 0-1 */
  occupancy: number
  /** Ticks until next occupancy recalculation */
  occupancyRecalcIn: number

  /** Total rent collected over lifetime */
  totalRentCollected: Decimal
  /** Total maintenance paid over lifetime */
  totalMaintenancePaid: Decimal
}

export interface ScanCooldown {
  districtId: string
  /** Cooldown expiry timestamp (Date.now()) */
  expiresAt: number
}

export interface RealEstateStoreState {
  properties: Property[]
  opportunities: PropertyOpportunity[]
  lastRefreshTick: number
  scannedDistricts: ScanCooldown[]
  totalPropertiesBought: number
  totalPropertiesSold: number
  totalRentEarned: Decimal
  totalMaintenancePaid: Decimal
  totalSaleProfit: Decimal
  totalImprovementsInstalled: number
}

// Scan cooldown duration: 5 minutes in real time
const SCAN_COOLDOWN_MS = 5 * 60 * 1000
// Occupancy is recalculated every 300 ticks (30s)
const OCCUPANCY_RECALC_TICKS = 300
// Appreciation period: every 6000 ticks (10 min)
const APPRECIATION_PERIOD_TICKS = 6000

// ═══════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════

export const useRealEstateStore = defineStore('realEstate', () => {
  // ─── State ─────────────────────────────────────────────────────

  const properties = ref<Property[]>([])
  const opportunities = ref<PropertyOpportunity[]>([])
  const lastRefreshTick = ref(0)
  const scannedDistricts = ref<ScanCooldown[]>([])

  // Statistics
  const totalPropertiesBought = ref(0)
  const totalPropertiesSold = ref(0)
  const totalRentEarned = ref<Decimal>(ZERO)
  const totalMaintenancePaid = ref<Decimal>(ZERO)
  const totalSaleProfit = ref<Decimal>(ZERO)
  const totalImprovementsInstalled = ref(0)

  /** External multiplier set by useGameLoop (skill tree + prestige + events) */
  const globalRentMultiplier = ref<Decimal>(D(1))

  // ─── Computed ──────────────────────────────────────────────────

  const totalPropertyValue = computed<Decimal>(() => {
    let total = ZERO
    for (const p of properties.value) {
      total = add(total, p.currentValue)
    }
    return total
  })

  /** Properties in each district (for synergy calculation) */
  const propertiesByDistrict = computed<Map<string, Property[]>>(() => {
    const map = new Map<string, Property[]>()
    for (const p of properties.value) {
      const list = map.get(p.districtId) || []
      list.push(p)
      map.set(p.districtId, list)
    }
    return map
  })

  /** Get synergy bonus for a specific district */
  function getDistrictSynergy(districtId: string) {
    const district = getDistrict(districtId)
    if (!district) return { rentBonus: 0, appreciationBonus: 0, occupancyBonus: 0 }
    const owned = propertiesByDistrict.value.get(districtId)?.length ?? 0
    return getCombinedSynergyBonus(district, owned)
  }

  /** Compute effective rent per tick for a single property */
  function computePropertyRent(p: Property): Decimal {
    const district = getDistrict(p.districtId)
    if (!district) return ZERO

    const mgmt = getManagementStyle(p.managementStyle)
    const synergy = getDistrictSynergy(p.districtId)

    // Trait rent modifier (additive)
    let traitRentMod = 0
    for (const tid of p.traits) {
      const trait = getTrait(tid)
      if (trait) traitRentMod += trait.rentMod
    }

    // Improvement rent bonus (additive)
    let improvementRentBonus = 0
    for (const impId of p.improvements) {
      const imp = getImprovement(impId)
      if (imp) improvementRentBonus += imp.rentBonus
    }

    // Condition factor: at 100 = 1.0, at 0 = 0.3
    const conditionFactor = 0.3 + (p.condition / 100) * 0.7

    // Base formula (from Formulas.ts)
    const baseRentValue = Formulas.propertyRent(
      p.baseRent,
      p.renovationLevel,
      0.15, // upgradeBonus per renovation level
      district.rentMultiplier,
    )

    // Apply all modifiers
    const modifiedRent = baseRentValue
      .mul(1 + traitRentMod)
      .mul(1 + improvementRentBonus)
      .mul(1 + synergy.rentBonus)
      .mul(mgmt.rentMod)
      .mul(p.rentMultiplier)
      .mul(conditionFactor)
      .mul(p.occupancy)
      .mul(p.units)

    return modifiedRent
  }

  /** Per-tick maintenance for a property */
  function computePropertyMaintenance(p: Property): Decimal {
    const mgmt = getManagementStyle(p.managementStyle)

    let traitMaintenanceMod = 1
    for (const tid of p.traits) {
      const trait = getTrait(tid)
      if (trait) traitMaintenanceMod *= trait.maintenanceMod
    }

    return mul(mul(p.baseMaintenance, mgmt.expenseMod * traitMaintenanceMod), p.units)
  }

  /** Net rent per tick for one property (rent - maintenance - tax) */
  function computePropertyNetRent(p: Property): Decimal {
    const rent = computePropertyRent(p)
    const maintenance = computePropertyMaintenance(p)
    const tax = mul(rent, p.taxRate)
    return sub(rent, add(maintenance, tax))
  }

  /** Get repair cost for a property (restores condition to 100) */
  function getRepairCost(p: Property): Decimal {
    if (p.condition >= 98) return ZERO
    const repairAmount = 100 - p.condition
    return D(Math.round(p.baseMaintenance.toNumber() * repairAmount * 5 * p.units))
  }

  /** Get renovation cost for a property (next level) */
  function getRenovateCost(p: Property): Decimal {
    if (p.renovationLevel >= p.maxRenovationLevel) return ZERO
    const baseCost = p.currentValue.toNumber() * 0.15
    return D(Math.round(baseCost * Math.pow(p.renovationCostMultiplier, p.renovationLevel)))
  }

  /** Get estimated sell price for a property */
  function getSellPrice(p: Property): Decimal {
    const conditionFactor = 0.5 + (p.condition / 100) * 0.5
    return D(Math.round(p.currentValue.toNumber() * conditionFactor))
  }

  /** Total rent per tick across all properties */
  const totalRentPerTick = computed<Decimal>(() => {
    let total = ZERO
    for (const p of properties.value) {
      const net = computePropertyNetRent(p)
      total = add(total, net)
    }
    // Apply global multiplier from skill tree / prestige / events
    return mul(total, globalRentMultiplier.value)
  })

  /** Rent per second (for offline calc) = rentPerTick × 10 */
  const rentPerSecond = computed<Decimal>(() => mul(totalRentPerTick.value, 10))

  /** Hot deals */
  const hotDeals = computed<PropertyOpportunity[]>(() =>
    opportunities.value.filter((o) => o.isHotDeal),
  )

  /** All available opportunities (no expiration — managed via scans & refreshes) */
  const availableOpportunities = computed<PropertyOpportunity[]>(() =>
    [...opportunities.value],
  )

  // ─── Actions ───────────────────────────────────────────────────

  /** Generate initial opportunities if we have none */
  function ensureOpportunities(netWorth: number, currentTime: number): void {
    if (opportunities.value.length < MIN_OPPORTUNITIES) {
      const unlocked = getUnlockedDistricts(netWorth)
      if (unlocked.length === 0) return
      const count = MIN_OPPORTUNITIES + Math.floor(Math.random() * (MAX_OPPORTUNITIES - MIN_OPPORTUNITIES + 1))
      const newOpps = generateOpportunityBatch(netWorth, unlocked, currentTime, count)
      opportunities.value.push(...newOpps)
    }
  }

  /** Refresh opportunities (replace old non-scanned, add new) */
  function refreshOpportunities(netWorth: number, currentTime: number): void {
    // On refresh, remove non-scanned opps to cycle in fresh ones
    opportunities.value = opportunities.value.filter((o) => o.isScanned)
    // Fill up to minimum
    const unlocked = getUnlockedDistricts(netWorth)
    if (unlocked.length === 0) return
    while (opportunities.value.length < MIN_OPPORTUNITIES) {
      opportunities.value.push(generateOpportunity(netWorth, unlocked, currentTime))
    }
    // Chance to add extras
    if (opportunities.value.length < MAX_OPPORTUNITIES && Math.random() < 0.4) {
      opportunities.value.push(generateOpportunity(netWorth, unlocked, currentTime))
    }
  }

  /** Scan a district for a premium opportunity */
  function scanDistrict(districtId: string): PropertyOpportunity[] {
    const player = usePlayerStore()
    const district = getDistrict(districtId)
    if (!district) return []

    // Check cooldown
    const now = Date.now()
    const cd = scannedDistricts.value.find((s) => s.districtId === districtId)
    if (cd && cd.expiresAt > now) return []

    // Check cost
    const cost = D(district.scanCost)
    if (player.cash.lt(cost)) return []

    // Pay
    player.spendCash(cost)

    // Remove old scanned opportunities for this district (replaced by fresh scan)
    opportunities.value = opportunities.value.filter(
      (o) => !(o.isScanned && o.districtId === districtId),
    )

    // Set cooldown
    const existing = scannedDistricts.value.findIndex((s) => s.districtId === districtId)
    if (existing >= 0) {
      scannedDistricts.value[existing].expiresAt = now + SCAN_COOLDOWN_MS
    } else {
      scannedDistricts.value.push({ districtId, expiresAt: now + SCAN_COOLDOWN_MS })
    }

    // Generate 1-4 scan opportunities
    const count = 1 + Math.floor(Math.random() * 4)
    const found: PropertyOpportunity[] = []
    for (let i = 0; i < count; i++) {
      const opp = generateScanOpportunity(player.netWorth.toNumber(), district, now)
      found.push(opp)
    }
    opportunities.value.push(...found)
    return found
  }

  /** Check if district scan is on cooldown */
  function isScanOnCooldown(districtId: string): boolean {
    const now = Date.now()
    const cd = scannedDistricts.value.find((s) => s.districtId === districtId)
    return !!cd && cd.expiresAt > now
  }

  /** Get remaining cooldown ms for a district */
  function getScanCooldownRemaining(districtId: string): number {
    const now = Date.now()
    const cd = scannedDistricts.value.find((s) => s.districtId === districtId)
    if (!cd || cd.expiresAt <= now) return 0
    return cd.expiresAt - now
  }

  /** Scout (reveal hidden info) on an opportunity */
  function scoutOpportunity(oppId: string, targetPhase: ScoutPhase): boolean {
    const player = usePlayerStore()
    const opp = opportunities.value.find((o) => o.id === oppId)
    if (!opp) return false

    const currentIdx = SCOUT_PHASES.indexOf(opp.scoutPhase)
    const targetIdx = SCOUT_PHASES.indexOf(targetPhase)
    if (targetIdx <= currentIdx) return false

    const cost = D(opp.scoutCosts[targetPhase])
    if (player.cash.lt(cost)) return false

    player.spendCash(cost)
    opp.scoutPhase = targetPhase
    return true
  }

  /** Buy a property from an opportunity */
  function buyProperty(oppId: string, currentTick: number): Property | null {
    const player = usePlayerStore()
    const oppIdx = opportunities.value.findIndex((o) => o.id === oppId)
    if (oppIdx < 0) return null

    const opp = opportunities.value[oppIdx]

    // Appraisal discount if fully scouted
    let price = opp.askingPrice
    if (opp.scoutPhase === 'appraisal') {
      price = D(Math.round(price.toNumber() * (1 - APPRAISAL_DISCOUNT)))
    }

    if (player.cash.lt(price)) return null

    player.spendCash(price)

    // Find template to get maxImprovements
    const template = PROPERTY_TEMPLATES.find((t) => t.id === opp.templateId)

    const property: Property = {
      id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      templateId: opp.templateId,
      name: opp.name,
      icon: opp.icon,
      category: opp.category,
      districtId: opp.districtId,
      location: opp.location,
      purchasePrice: price,
      currentValue: opp.trueValue,
      baseRent: opp.baseRent,
      units: opp.units,
      condition: opp.startingCondition,
      wearRate: opp.wearRate,
      taxRate: opp.taxRate,
      baseAppreciationRate: opp.baseAppreciationRate,
      baseMaintenance: opp.baseMaintenance,
      renovationLevel: 0,
      maxRenovationLevel: opp.maxRenovationLevel,
      renovationCostMultiplier: opp.renovationCostMultiplier,
      improvements: [],
      maxImprovements: template?.maxImprovements ?? 6,
      traits: opp.traits.map((t) => t.id),
      managementStyle: 'standard',
      rentMultiplier: 1.0,
      customName: null,
      purchasedAtTick: currentTick,
      occupancy: 0.7 + Math.random() * 0.25, // 70-95% initial occupancy
      occupancyRecalcIn: OCCUPANCY_RECALC_TICKS,
      totalRentCollected: ZERO,
      totalMaintenancePaid: ZERO,
    }

    properties.value.push(property)
    opportunities.value.splice(oppIdx, 1)
    totalPropertiesBought.value++
    return property
  }

  /** Sell a property at current market value */
  function sellProperty(propId: string): Decimal | null {
    const player = usePlayerStore()
    const idx = properties.value.findIndex((p) => p.id === propId)
    if (idx < 0) return null

    const prop = properties.value[idx]
    // Selling price = currentValue × condition factor (damaged = lower price)
    const conditionFactor = 0.5 + (prop.condition / 100) * 0.5
    const salePrice = D(Math.round(prop.currentValue.toNumber() * conditionFactor))

    player.earnCash(salePrice)
    const profit = sub(salePrice, prop.purchasePrice)
    totalSaleProfit.value = add(totalSaleProfit.value, profit)
    totalPropertiesSold.value++
    properties.value.splice(idx, 1)
    return salePrice
  }

  /** Renovate a property (increase condition and renovation level) */
  function renovateProperty(propId: string): boolean {
    const player = usePlayerStore()
    const prop = properties.value.find((p) => p.id === propId)
    if (!prop) return false
    if (prop.renovationLevel >= prop.maxRenovationLevel) return false

    const baseCost = prop.currentValue.toNumber() * 0.15
    if (baseCost <= 0) return false // Prevent free renovation on zero-value properties
    const cost = D(Math.round(baseCost * Math.pow(prop.renovationCostMultiplier, prop.renovationLevel)))
    if (player.cash.lt(cost)) return false

    player.spendCash(cost)
    prop.renovationLevel++
    prop.condition = Math.min(100, prop.condition + 15)
    return true
  }

  /** Repair a property (restore condition without upgrading renovation) */
  function repairProperty(propId: string): boolean {
    const player = usePlayerStore()
    const prop = properties.value.find((p) => p.id === propId)
    if (!prop) return false
    if (prop.condition >= 98) return false

    const repairAmount = 100 - prop.condition
    const cost = D(Math.round(prop.baseMaintenance.toNumber() * repairAmount * 5 * prop.units))
    if (player.cash.lt(cost)) return false

    player.spendCash(cost)
    prop.condition = 100
    return true
  }

  /** Install an improvement on a property */
  function installImprovement(propId: string, improvementId: ImprovementId): boolean {
    const player = usePlayerStore()
    const prop = properties.value.find((p) => p.id === propId)
    if (!prop) return false
    if (prop.improvements.length >= prop.maxImprovements) return false
    if (prop.improvements.includes(improvementId)) return false

    const imp = getImprovement(improvementId)
    if (!imp) return false

    // Check category
    if (!imp.categories.includes(prop.category as never)) return false
    // Check min value
    if (prop.currentValue.toNumber() < imp.minPropertyValue) return false

    const cost = D(Math.round(prop.currentValue.toNumber() * imp.costFraction))
    if (player.cash.lt(cost)) return false

    player.spendCash(cost)
    prop.improvements.push(improvementId)
    // Improvement adds to property value
    prop.currentValue = add(prop.currentValue, D(Math.round(prop.currentValue.toNumber() * imp.valueFraction)))
    totalImprovementsInstalled.value++
    return true
  }

  /** Set management style for a property */
  function setManagementStyle(propId: string, style: ManagementStyle): void {
    const prop = properties.value.find((p) => p.id === propId)
    if (prop) prop.managementStyle = style
  }

  /** Set rent multiplier for a property (0.5-2.0) */
  function setRentMultiplier(propId: string, value: number): void {
    const prop = properties.value.find((p) => p.id === propId)
    if (prop) prop.rentMultiplier = Math.max(0.5, Math.min(2.0, value))
  }

  /** Rename a property */
  function renameProperty(propId: string, name: string): void {
    const prop = properties.value.find((p) => p.id === propId)
    if (prop) prop.customName = name || null
  }

  // ─── Game Tick ─────────────────────────────────────────────────

  function tick(ctx: TickContext): void {
    const player = usePlayerStore()
    const now = Date.now()

    // ── Rent collection & maintenance per property ──
    for (const prop of properties.value) {
      // Wear & tear
      let effectiveWearRate = prop.wearRate
      const mgmt = getManagementStyle(prop.managementStyle)
      effectiveWearRate *= mgmt.wearMod

      // Trait wear mods
      for (const tid of prop.traits) {
        const trait = getTrait(tid)
        if (trait) effectiveWearRate *= trait.wearMod
      }
      // Improvement wear mods
      for (const impId of prop.improvements) {
        const imp = getImprovement(impId)
        if (imp) effectiveWearRate *= imp.wearMod
      }

      prop.condition = Math.max(0, prop.condition - effectiveWearRate)

      // Collect net rent
      const grossRent = mul(computePropertyRent(prop), globalRentMultiplier.value)
      const maintenance = computePropertyMaintenance(prop)
      const tax = mul(grossRent, prop.taxRate)
      const totalExpenses = add(maintenance, tax)
      const netRent = sub(grossRent, totalExpenses)

      // Always track maintenance + tax expenses
      prop.totalMaintenancePaid = add(prop.totalMaintenancePaid, totalExpenses)
      totalMaintenancePaid.value = add(totalMaintenancePaid.value, totalExpenses)

      if (netRent.gt(0)) {
        player.earnCash(netRent)
        prop.totalRentCollected = add(prop.totalRentCollected, grossRent)
        totalRentEarned.value = add(totalRentEarned.value, grossRent)
      } else if (netRent.lt(0)) {
        // Property is operating at a loss — deduct from cash
        const loss = netRent.abs()
        if (player.cash.gte(loss)) {
          player.spendCash(loss)
        }
        // Still track the gross rent earned (even if net is negative)
        prop.totalRentCollected = add(prop.totalRentCollected, grossRent)
        totalRentEarned.value = add(totalRentEarned.value, grossRent)
      }

      // Occupancy recalculation
      prop.occupancyRecalcIn--
      if (prop.occupancyRecalcIn <= 0) {
        prop.occupancyRecalcIn = OCCUPANCY_RECALC_TICKS
        recalculateOccupancy(prop)
      }

      // Appreciation (every APPRECIATION_PERIOD_TICKS)
      if (ctx.tick > 0 && ctx.tick % APPRECIATION_PERIOD_TICKS === 0) {
        let effectiveAppreciation = prop.baseAppreciationRate

        // Synergy appreciation bonus
        const synergy = getDistrictSynergy(prop.districtId)
        effectiveAppreciation += synergy.appreciationBonus

        // Trait appreciation mods (multiplicative)
        for (const tid of prop.traits) {
          const trait = getTrait(tid)
          if (trait) effectiveAppreciation *= trait.appreciationMod
        }
        // Improvement appreciation mods
        for (const impId of prop.improvements) {
          const imp = getImprovement(impId)
          if (imp) effectiveAppreciation *= imp.appreciationMod
        }

        // Condition affects appreciation (bad condition = depreciation)
        if (prop.condition < 30) {
          effectiveAppreciation *= -0.5 // Depreciating badly
        } else if (prop.condition < 60) {
          effectiveAppreciation *= 0.5 // Slower appreciation
        }

        prop.currentValue = Formulas.propertyValue(prop.currentValue, effectiveAppreciation, 1)
      }
    }

    // ── Opportunity refresh (no expiration — only periodic refresh & min-fill) ──
    const ticksSinceRefresh = ctx.tick - lastRefreshTick.value
    if (ticksSinceRefresh >= OPPORTUNITY_REFRESH_TICKS || opportunities.value.length < MIN_OPPORTUNITIES) {
      const netWorth = player.netWorth.toNumber()
      refreshOpportunities(netWorth, now)
      lastRefreshTick.value = ctx.tick
    }

    // ── Prune expired scan cooldowns ──
    scannedDistricts.value = scannedDistricts.value.filter((s) => s.expiresAt > now)
  }

  /** Recalculate occupancy based on property stats */
  function recalculateOccupancy(prop: Property): void {
    const mgmt = getManagementStyle(prop.managementStyle)
    const synergy = getDistrictSynergy(prop.districtId)

    // Base occupancy influenced by condition, rent multiplier, management
    let baseOccupancy = 0.75

    // Condition effect
    baseOccupancy += (prop.condition / 100) * 0.15 // 0-15% from condition

    // Management style
    baseOccupancy += mgmt.occupancyMod

    // Synergy bonus
    baseOccupancy += synergy.occupancyBonus

    // Trait occupancy mods
    for (const tid of prop.traits) {
      const trait = getTrait(tid)
      if (trait) baseOccupancy += trait.occupancyMod
    }

    // Improvement occupancy bonus
    for (const impId of prop.improvements) {
      const imp = getImprovement(impId)
      if (imp) baseOccupancy += imp.occupancyBonus
    }

    // Rent multiplier inversely affects occupancy (higher rent = less demand)
    if (prop.rentMultiplier > 1.0) {
      baseOccupancy -= (prop.rentMultiplier - 1.0) * 0.3
    } else if (prop.rentMultiplier < 1.0) {
      baseOccupancy += (1.0 - prop.rentMultiplier) * 0.15
    }

    // Add some randomness
    baseOccupancy += (Math.random() - 0.5) * 0.08

    prop.occupancy = Math.max(0, Math.min(1, baseOccupancy))
  }

  // ─── Export / Load ─────────────────────────────────────────────

  function exportState(): RealEstateStoreState {
    return {
      properties: properties.value.map((p) => ({
        ...p,
        // Ensure Decimal values are preserved
        purchasePrice: p.purchasePrice,
        currentValue: p.currentValue,
        baseRent: p.baseRent,
        baseMaintenance: p.baseMaintenance,
        totalRentCollected: p.totalRentCollected,
        totalMaintenancePaid: p.totalMaintenancePaid,
      })),
      opportunities: opportunities.value.map((o) => ({
        ...o,
        // Traits stored as full objects in opportunity
        traits: o.traits,
      })),
      lastRefreshTick: lastRefreshTick.value,
      scannedDistricts: scannedDistricts.value,
      totalPropertiesBought: totalPropertiesBought.value,
      totalPropertiesSold: totalPropertiesSold.value,
      totalRentEarned: totalRentEarned.value,
      totalMaintenancePaid: totalMaintenancePaid.value,
      totalSaleProfit: totalSaleProfit.value,
      totalImprovementsInstalled: totalImprovementsInstalled.value,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function loadFromSave(state: any): void {
    if (!state) return

    // Handle both old array format (legacy) and new object format
    if (Array.isArray(state)) {
      // Legacy: state was just an array of properties
      properties.value = state.map(migrateProperty)
      return
    }

    // New format
    if (state.properties && Array.isArray(state.properties)) {
      properties.value = state.properties.map(migrateProperty)
    }

    if (state.opportunities && Array.isArray(state.opportunities)) {
      opportunities.value = state.opportunities.map(migrateOpportunity)
    }

    if (typeof state.lastRefreshTick === 'number') {
      lastRefreshTick.value = state.lastRefreshTick
    }

    if (state.scannedDistricts && Array.isArray(state.scannedDistricts)) {
      scannedDistricts.value = state.scannedDistricts
    }

    // Statistics
    if (state.totalPropertiesBought !== undefined) totalPropertiesBought.value = state.totalPropertiesBought
    if (state.totalPropertiesSold !== undefined) totalPropertiesSold.value = state.totalPropertiesSold
    if (state.totalRentEarned !== undefined) totalRentEarned.value = D(state.totalRentEarned)
    if (state.totalMaintenancePaid !== undefined) totalMaintenancePaid.value = D(state.totalMaintenancePaid)
    if (state.totalSaleProfit !== undefined) totalSaleProfit.value = D(state.totalSaleProfit)
    if (state.totalImprovementsInstalled !== undefined) totalImprovementsInstalled.value = state.totalImprovementsInstalled
  }

  /** Migrate a saved property, backfilling new fields with defaults */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function migrateProperty(saved: any): Property {
    return {
      id: saved.id ?? `prop_migrated_${Math.random().toString(36).slice(2, 8)}`,
      templateId: saved.templateId ?? 'studio_apt',
      name: saved.name ?? 'Property',
      icon: saved.icon ?? 'mdi:home',
      category: saved.category ?? 'Residential',
      districtId: saved.districtId ?? 'uptown',
      location: saved.location ?? [40.785, -73.968],
      purchasePrice: D(saved.purchasePrice ?? 0),
      currentValue: D(saved.currentValue ?? saved.purchasePrice ?? 0),
      baseRent: D(saved.baseRent ?? 0),
      units: saved.units ?? 1,
      condition: saved.condition ?? 80,
      wearRate: saved.wearRate ?? 0.002,
      taxRate: saved.taxRate ?? 0.01,
      baseAppreciationRate: saved.baseAppreciationRate ?? 0.001,
      baseMaintenance: D(saved.baseMaintenance ?? 0),
      renovationLevel: saved.renovationLevel ?? 0,
      maxRenovationLevel: saved.maxRenovationLevel ?? 10,
      renovationCostMultiplier: saved.renovationCostMultiplier ?? 1.5,
      // New fields — backfill for old saves
      improvements: saved.improvements ?? [],
      maxImprovements: saved.maxImprovements ?? 6,
      traits: Array.isArray(saved.traits)
        ? saved.traits.map((t: string | PropertyTrait) => (typeof t === 'string' ? t : t.id))
        : [],
      managementStyle: saved.managementStyle ?? 'standard',
      rentMultiplier: saved.rentMultiplier ?? 1.0,
      customName: saved.customName ?? null,
      purchasedAtTick: saved.purchasedAtTick ?? 0,
      occupancy: saved.occupancy ?? 0.85,
      occupancyRecalcIn: saved.occupancyRecalcIn ?? OCCUPANCY_RECALC_TICKS,
      totalRentCollected: D(saved.totalRentCollected ?? 0),
      totalMaintenancePaid: D(saved.totalMaintenancePaid ?? 0),
    }
  }

  /** Migrate a saved opportunity, rehydrating Decimal and trait objects */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function migrateOpportunity(saved: any): PropertyOpportunity {
    return {
      ...saved,
      askingPrice: D(saved.askingPrice ?? 0),
      trueValue: D(saved.trueValue ?? 0),
      baseRent: D(saved.baseRent ?? 0),
      baseMaintenance: D(saved.baseMaintenance ?? 0),
      traits: Array.isArray(saved.traits)
        ? saved.traits.map((t: string | PropertyTrait) => {
            if (typeof t === 'string') {
              return getTrait(t) ?? { id: t, nameKey: '', descriptionKey: '', icon: '', isPositive: false, rentMod: 0, appreciationMod: 1, occupancyMod: 0, wearMod: 1, maintenanceMod: 1 }
            }
            return t
          })
        : [],
      isScanned: saved.isScanned ?? false,
      scoutPhase: saved.scoutPhase ?? 'none',
      scoutCosts: saved.scoutCosts ?? { none: 0, drive_by: 0, inspection: 0, appraisal: 0 },
    }
  }

  // ─── Prestige / Reset ──────────────────────────────────────────

  function prestigeReset(): void {
    properties.value = []
    opportunities.value = []
    lastRefreshTick.value = 0
    scannedDistricts.value = []
    // Keep lifetime stats
  }

  function fullReset(): void {
    properties.value = []
    opportunities.value = []
    lastRefreshTick.value = 0
    scannedDistricts.value = []
    totalPropertiesBought.value = 0
    totalPropertiesSold.value = 0
    totalRentEarned.value = ZERO
    totalMaintenancePaid.value = ZERO
    totalSaleProfit.value = ZERO
    totalImprovementsInstalled.value = 0
    globalRentMultiplier.value = D(1)
  }

  // ─── Public API ────────────────────────────────────────────────

  return {
    // State
    properties,
    opportunities,
    lastRefreshTick,
    scannedDistricts,
    globalRentMultiplier,

    // Statistics
    totalPropertiesBought,
    totalPropertiesSold,
    totalRentEarned,
    totalMaintenancePaid: totalMaintenancePaid,
    totalSaleProfit,
    totalImprovementsInstalled,

    // Computed
    totalPropertyValue,
    totalRentPerTick,
    rentPerSecond,
    hotDeals,
    availableOpportunities,
    propertiesByDistrict,

    // Actions — Property management
    buyProperty,
    sellProperty,
    renovateProperty,
    repairProperty,
    installImprovement,
    setManagementStyle,
    setRentMultiplier,
    renameProperty,

    // Actions — Opportunities & scanning
    ensureOpportunities,
    refreshOpportunities,
    scanDistrict,
    isScanOnCooldown,
    getScanCooldownRemaining,
    scoutOpportunity,

    // Actions — Computation helpers (for UI)
    computePropertyRent,
    computePropertyMaintenance,
    computePropertyNetRent,
    getDistrictSynergy,
    getRepairCost,
    getRenovateCost,
    getSellPrice,

    // Game loop
    tick,

    // Save / Load / Reset
    exportState,
    loadFromSave,
    prestigeReset,
    fullReset,
  }
})
