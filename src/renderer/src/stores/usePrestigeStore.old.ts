/**
 * usePrestigeStore — Prestige/rebirth system
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, mul } from '@renderer/core/BigNum'
import { prestigePointsGain, prestigeMultiplier as calcPrestigeMultiplier } from '@renderer/core/Formulas'
import { useUpgradeStore } from './useUpgradeStore'

export interface PrestigeUpgradeDef {
  id: string
  name: string
  description: string
  icon: string
  cost: Decimal
  costScaling: number
  maxLevel: number
  effectType: 'global_multiplier' | 'job_efficiency' | 'offline_bonus' | 'starting_cash' | 'unlock' | 'loan_discount'
  effectValue: number
}

export interface PrestigeUpgrade extends PrestigeUpgradeDef {
  level: number
}

export const usePrestigeStore = defineStore('prestige', () => {
  const points = ref<Decimal>(ZERO)
  const totalPointsEarned = ref<Decimal>(ZERO)
  const rebirthCount = ref(0)
  const upgrades = ref<PrestigeUpgrade[]>([])

  const globalMultiplier = computed(() => {
    let mult = calcPrestigeMultiplier(points.value, 0.1)
    // Apply prestige upgrades that boost global multiplier
    for (const upg of upgrades.value) {
      if (upg.level > 0 && upg.effectType === 'global_multiplier') {
        mult = mul(mult, 1 + upg.effectValue * upg.level)
      }
    }
    return mult
  })

  /** Preview how many points would be gained from rebirth */
  function previewPointsGain(totalCashEarned: Decimal): Decimal {
    const base = prestigePointsGain(totalCashEarned)
    // Apply prestige_gain skill multiplier
    const prestigeMul = useUpgradeStore().getMultiplier('prestige_gain')
    return mul(base, prestigeMul)
  }

  /** Check if prestige is worthwhile (at least 1 point) */
  function canPrestige(totalCashEarned: Decimal): boolean {
    return prestigePointsGain(totalCashEarned).gte(1)
  }

  /** Perform prestige: gain points, increment rebirth count */
  function performPrestige(totalCashEarned: Decimal): Decimal {
    const base = prestigePointsGain(totalCashEarned)
    // Apply prestige_gain skill multiplier
    const prestigeMul = useUpgradeStore().getMultiplier('prestige_gain')
    const gained = mul(base, prestigeMul)
    points.value = add(points.value, gained)
    totalPointsEarned.value = add(totalPointsEarned.value, gained)
    rebirthCount.value++
    return gained
  }

  function initPrestigeUpgrades(defs: PrestigeUpgradeDef[]): void {
    upgrades.value = defs.map((def) => ({ ...def, level: 0 }))
  }

  /** Buy a prestige upgrade with prestige points */
  function buyPrestigeUpgrade(upgradeId: string): boolean {
    const upg = upgrades.value.find((u) => u.id === upgradeId)
    if (!upg || (upg.maxLevel > 0 && upg.level >= upg.maxLevel)) return false

    const cost = getUpgradeCost(upgradeId)
    if (points.value.lt(cost)) return false

    points.value = points.value.sub(cost)
    upg.level++
    return true
  }

  /** Get the scaled cost for a prestige upgrade at its current level */
  function getUpgradeCost(upgradeId: string): Decimal {
    const upg = upgrades.value.find((u) => u.id === upgradeId)
    if (!upg) return ZERO
    return mul(upg.cost, Math.pow(upg.costScaling, upg.level))
  }

  /** Get starting cash bonus from prestige upgrades */
  function getStartingCash(): Decimal {
    let cash = ZERO
    for (const upg of upgrades.value) {
      if (upg.level > 0 && upg.effectType === 'starting_cash') {
        cash = add(cash, D(upg.effectValue * upg.level))
      }
    }
    return cash
  }

  function loadFromSave(data: { points?: Decimal; totalPointsEarned?: Decimal; rebirthCount?: number; upgrades?: { id: string; level: number }[] }): void {
    if (data.points !== undefined) points.value = data.points
    if (data.totalPointsEarned !== undefined) totalPointsEarned.value = data.totalPointsEarned
    if (data.rebirthCount !== undefined) rebirthCount.value = data.rebirthCount
    if (data.upgrades) {
      for (const savedUpg of data.upgrades) {
        const upg = upgrades.value.find((u) => u.id === savedUpg.id)
        if (upg) upg.level = savedUpg.level
      }
    }
  }

  return {
    points, totalPointsEarned, rebirthCount, upgrades,
    globalMultiplier,
    previewPointsGain, canPrestige, performPrestige,
    initPrestigeUpgrades, buyPrestigeUpgrade, getUpgradeCost, getStartingCash, loadFromSave
  }
})
