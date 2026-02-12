/**
 * useUpgradeStore — Skill tree and upgrades (DAG)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, mul, gte } from '@renderer/core/BigNum'
import { upgradeCost, upgradeEffect } from '@renderer/core/Formulas'
import type { UpgradeDef, UpgradeTarget } from '@renderer/data/upgrades'
import { usePlayerStore } from './usePlayerStore'

/** Map camelCase data target names to snake_case store enum */
const TARGET_MAP: Record<UpgradeTarget, UpgradeEffectTarget> = {
  jobEfficiency: 'job_efficiency',
  businessRevenue: 'business_revenue',
  costReduction: 'cost_reduction',
  customerAttraction: 'customer_attraction',
  allIncome: 'all_income',
  stockReturn: 'stock_returns',
  cryptoReturn: 'crypto_returns',
  realEstateRent: 'real_estate_rent',
  startupSuccess: 'startup_success',
  gamblingLuck: 'gambling_luck',
  xpGain: 'xp_gain',
  offlineEfficiency: 'offline_efficiency',
  prestigeGain: 'prestige_gain',
  loanRate: 'loan_rate',
  depositRate: 'deposit_rate',
}

export type UpgradeEffectTarget =
  | 'job_efficiency'
  | 'business_revenue'
  | 'cost_reduction'
  | 'customer_attraction'
  | 'all_income'
  | 'stock_returns'
  | 'crypto_returns'
  | 'real_estate_rent'
  | 'gambling_luck'
  | 'offline_efficiency'
  | 'xp_gain'
  | 'prestige_gain'
  | 'startup_success'
  | 'loan_rate'
  | 'deposit_rate'

export interface UpgradeNodeDef {
  id: string
  name: string
  description: string
  effectDescription: string
  icon: string
  category: string
  /** Max level (0 = unlimited) */
  maxLevel: number
  baseCost: Decimal
  costPolyExp: number
  costExpBase: number
  effectTarget: UpgradeEffectTarget
  baseEffect: Decimal
  effectScaling: number
  /** IDs of prerequisites (must be purchased before this) */
  prerequisites: string[]
  /** Grid position in the skill tree */
  row: number
  col: number
}

export interface UpgradeNode extends UpgradeNodeDef {
  level: number
  purchased: boolean
}

export const useUpgradeStore = defineStore('upgrades', () => {
  const nodes = ref<UpgradeNode[]>([])

  // ─── Computed ─────────────────────────────────────────────────

  const availableUpgrades = computed(() =>
    nodes.value.filter((n) => {
      if (n.maxLevel > 0 && n.level >= n.maxLevel) return false
      return n.prerequisites.every((preId) => {
        const pre = nodes.value.find((p) => p.id === preId)
        return pre?.purchased
      })
    })
  )

  /** Get the combined multiplier for a target category */
  function getMultiplier(target: UpgradeEffectTarget): Decimal {
    let result = D(1)
    for (const node of nodes.value) {
      if (node.level <= 0 || node.effectTarget !== target) continue
      const effect = upgradeEffect(node.baseEffect, node.level, node.effectScaling)
      result = mul(result, effect.add(1))
    }
    return result
  }

  function getNodeCost(nodeId: string): Decimal {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (!node) return ZERO
    return upgradeCost(node.baseCost, node.level, node.costPolyExp, node.costExpBase)
  }

  // ─── Actions ──────────────────────────────────────────────────

  function initUpgrades(defs: UpgradeDef[]): void {
    nodes.value = defs.map((def) => ({
      id: def.id,
      name: def.name,
      description: def.description,
      effectDescription: def.effectDescription,
      icon: def.icon,
      category: def.category,
      maxLevel: 1,
      baseCost: def.cost,
      costPolyExp: 1,
      costExpBase: 1,
      effectTarget: TARGET_MAP[def.target] ?? 'all_income',
      baseEffect: D(def.multiplier),
      effectScaling: 0,
      prerequisites: def.prerequisites,
      row: def.row ?? 0,
      col: def.col ?? 0,
      level: 0,
      purchased: false
    }))
  }

  /** Purchase/level up an upgrade. Returns cost, or null if can't. */
  function purchaseUpgrade(nodeId: string): Decimal | null {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (!node) return null
    if (node.maxLevel > 0 && node.level >= node.maxLevel) return null

    // Check prerequisites
    const presMet = node.prerequisites.every((preId) => {
      const pre = nodes.value.find((p) => p.id === preId)
      return pre?.purchased
    })
    if (!presMet) return null

    const player = usePlayerStore()
    const cost = upgradeCost(node.baseCost, node.level, node.costPolyExp, node.costExpBase)
    
    // Check and spend cash
    if (!gte(player.cash, cost)) return null
    if (!player.spendCash(cost)) return null
    
    node.level++
    node.purchased = true

    // XP for purchasing upgrades
    player.addXp(D(10))

    return cost
  }

  function prestigeReset(): void {
    for (const node of nodes.value) {
      node.level = 0
      node.purchased = false
    }
  }

  return {
    nodes,
    availableUpgrades, getMultiplier, getNodeCost,
    initUpgrades, purchaseUpgrade, prestigeReset
  }
})
