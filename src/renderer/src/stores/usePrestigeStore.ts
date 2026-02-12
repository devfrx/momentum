/**
 * usePrestigeStore — Complete Prestige/Rebirth System
 *
 * Features:
 * - Era progression system
 * - Milestone achievements
 * - One-time perks
 * - Repeatable upgrades
 * - Full backward compatibility with existing saves
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, ONE, add, mul } from '@renderer/core/BigNum'
import { prestigePointsGain, prestigeMultiplier as calcPrestigeMultiplier } from '@renderer/core/Formulas'
import { useUpgradeStore } from './useUpgradeStore'
import {
  type PrestigeUpgradeDef,
  type PrestigeUpgrade,
  type MilestoneDef,
  type Milestone,
  type PerkDef,
  type Perk,
  type EraDef,
  type PrestigeEffectType,
  PRESTIGE_ERAS,
  PRESTIGE_MILESTONES,
  PRESTIGE_PERKS,
  PRESTIGE_UPGRADES,
  getCurrentEra,
  getNextEra,
  getEraProgress,
} from '@renderer/data/prestige'

// Re-export types for backward compatibility
export type { PrestigeUpgradeDef, PrestigeUpgrade }

export const usePrestigeStore = defineStore('prestige', () => {
  // ─── Core State ─────────────────────────────────────────────────
  const points = ref<Decimal>(ZERO)
  const totalPointsEarned = ref<Decimal>(ZERO)
  const rebirthCount = ref(0)

  // ─── Upgrades (repeatable, leveled) ─────────────────────────────
  const upgrades = ref<PrestigeUpgrade[]>([])

  // ─── Milestones (auto-unlock achievements) ──────────────────────
  const milestones = ref<Milestone[]>([])

  // ─── Perks (one-time purchases) ─────────────────────────────────
  const perks = ref<Perk[]>([])

  // ─── Derived State ──────────────────────────────────────────────

  /** Current era based on total points and rebirths */
  const currentEra = computed<EraDef>(() =>
    getCurrentEra(totalPointsEarned.value, rebirthCount.value)
  )

  /** Next era to unlock (or null if at max) */
  const nextEra = computed<EraDef | null>(() =>
    getNextEra(totalPointsEarned.value, rebirthCount.value)
  )

  /** Progress toward next era (0-100) */
  const eraProgress = computed<number>(() =>
    getEraProgress(totalPointsEarned.value, rebirthCount.value)
  )

  /** Total upgrade levels purchased */
  const totalUpgradeLevels = computed<number>(() =>
    upgrades.value.reduce((sum, u) => sum + u.level, 0)
  )

  /** Unlocked milestones count */
  const unlockedMilestones = computed<number>(() =>
    milestones.value.filter(m => m.unlocked).length
  )

  /** Purchased perks count */
  const purchasedPerks = computed<number>(() =>
    perks.value.filter(p => p.purchased).length
  )

  // ─── Multiplier Calculations ────────────────────────────────────

  /**
   * Global multiplier from prestige system
   * Combines: base prestige multiplier + upgrades + milestones + perks + era bonus
   */
  const globalMultiplier = computed<Decimal>(() => {
    // Base multiplier from prestige points
    let mult = calcPrestigeMultiplier(points.value, 0.1)

    // Era bonus
    mult = mul(mult, 1 + currentEra.value.globalBonus)

    // Prestige upgrades (global_multiplier type)
    mult = mul(mult, getEffectMultiplier('global_multiplier', upgrades.value))

    // Milestone bonuses (global_multiplier type)
    mult = mul(mult, getMilestoneMultiplier('global_multiplier'))

    // Perk bonuses (global_multiplier type)
    mult = mul(mult, getPerkMultiplier('global_multiplier'))

    return mult
  })

  /**
   * Get combined multiplier from upgrades for a specific effect type
   */
  function getEffectMultiplier(effectType: PrestigeEffectType, items: PrestigeUpgrade[]): Decimal {
    let mult = ONE
    for (const item of items) {
      if (item.level > 0 && item.effectType === effectType) {
        mult = mul(mult, 1 + item.effectValue * item.level)
      }
    }
    return mult
  }

  /**
   * Get combined multiplier from milestones for a specific effect type
   */
  function getMilestoneMultiplier(effectType: PrestigeEffectType): Decimal {
    let mult = ONE
    for (const ms of milestones.value) {
      if (ms.unlocked) {
        for (const reward of ms.rewards) {
          if (reward.type === effectType) {
            mult = mul(mult, 1 + reward.value)
          }
        }
      }
    }
    return mult
  }

  /**
   * Get combined multiplier from perks for a specific effect type
   */
  function getPerkMultiplier(effectType: PrestigeEffectType): Decimal {
    let mult = ONE
    for (const perk of perks.value) {
      if (perk.purchased && perk.effect.type === effectType) {
        mult = mul(mult, 1 + perk.effect.value)
      }
    }
    return mult
  }

  /**
   * Get total effect value for a specific type (additive, for flat bonuses)
   */
  function getTotalEffect(effectType: PrestigeEffectType): number {
    let total = 0

    // From upgrades
    for (const upg of upgrades.value) {
      if (upg.level > 0 && upg.effectType === effectType) {
        total += upg.effectValue * upg.level
      }
    }

    // From milestones
    for (const ms of milestones.value) {
      if (ms.unlocked) {
        for (const reward of ms.rewards) {
          if (reward.type === effectType) {
            total += reward.value
          }
        }
      }
    }

    // From perks
    for (const perk of perks.value) {
      if (perk.purchased && perk.effect.type === effectType) {
        total += perk.effect.value
      }
    }

    return total
  }

  /**
   * Check if a specific feature is unlocked via prestige
   */
  function isUnlocked(target: string): boolean {
    // Check upgrades
    for (const upg of upgrades.value) {
      if (upg.level > 0 && upg.effectType === 'unlock') {
        // Check if this upgrade unlocks the target
        if (upg.id.includes(target.toLowerCase())) return true
      }
    }

    // Check perks
    for (const perk of perks.value) {
      if (perk.purchased && perk.effect.type === 'unlock' && perk.effect.target === target) {
        return true
      }
    }

    return false
  }

  // ─── Prestige Points ────────────────────────────────────────────

  /** Preview points gain from rebirth */
  function previewPointsGain(totalCashEarned: Decimal): Decimal {
    const base = prestigePointsGain(totalCashEarned)

    // Apply prestige_gain from skill tree
    const skillMul = useUpgradeStore().getMultiplier('prestige_gain')

    // Apply prestige_gain from prestige upgrades
    const upgradeMul = getEffectMultiplier('prestige_gain', upgrades.value)

    // Apply prestige_gain from milestones
    const milestoneMul = getMilestoneMultiplier('prestige_gain')

    // Apply prestige_gain from perks
    const perkMul = getPerkMultiplier('prestige_gain')

    return mul(mul(mul(mul(base, skillMul), upgradeMul), milestoneMul), perkMul)
  }

  /** Check if prestige is worthwhile */
  function canPrestige(totalCashEarned: Decimal): boolean {
    return previewPointsGain(totalCashEarned).gte(1)
  }

  /** Perform prestige rebirth */
  function performPrestige(totalCashEarned: Decimal): Decimal {
    const gained = previewPointsGain(totalCashEarned)
    points.value = add(points.value, gained)
    totalPointsEarned.value = add(totalPointsEarned.value, gained)
    rebirthCount.value++
    return gained
  }

  // ─── Upgrades ───────────────────────────────────────────────────

  /** Initialize upgrades from definitions */
  function initPrestigeUpgrades(defs: PrestigeUpgradeDef[]): void {
    upgrades.value = defs.map((def) => ({ ...def, level: 0 }))
  }

  /** Buy an upgrade level */
  function buyPrestigeUpgrade(upgradeId: string): boolean {
    const upg = upgrades.value.find((u) => u.id === upgradeId)
    if (!upg || (upg.maxLevel > 0 && upg.level >= upg.maxLevel)) return false

    const cost = getUpgradeCost(upgradeId)
    if (points.value.lt(cost)) return false

    points.value = points.value.sub(cost)
    upg.level++
    return true
  }

  /** Get scaled cost for an upgrade */
  function getUpgradeCost(upgradeId: string): Decimal {
    const upg = upgrades.value.find((u) => u.id === upgradeId)
    if (!upg) return ZERO
    return mul(upg.cost, Math.pow(upg.costScaling, upg.level))
  }

  // ─── Milestones ─────────────────────────────────────────────────

  /** Initialize milestones from definitions */
  function initMilestones(defs: MilestoneDef[]): void {
    milestones.value = defs.map((def) => ({
      ...def,
      unlocked: false,
      unlockedAtTick: null,
    }))
  }

  /** Check and unlock milestones based on current state */
  function checkMilestones(currentTick: number, lifetimeCashEarned?: Decimal): Milestone[] {
    const newlyUnlocked: Milestone[] = []

    for (const ms of milestones.value) {
      if (ms.unlocked) continue

      let conditionMet = false
      const { type, value } = ms.condition
      const numValue = typeof value === 'number' ? value : (value as Decimal).toNumber()

      switch (type) {
        case 'total_points':
          conditionMet = totalPointsEarned.value.gte(numValue)
          break
        case 'rebirths':
          conditionMet = rebirthCount.value >= numValue
          break
        case 'upgrades_bought':
          conditionMet = totalUpgradeLevels.value >= numValue
          break
        case 'total_cash_earned':
          conditionMet = lifetimeCashEarned ? lifetimeCashEarned.gte(numValue) : false
          break
        case 'era':
          conditionMet = currentEra.value.id === String(value)
          break
      }

      // Check era requirement
      if (conditionMet && ms.eraRequired) {
        const eraIndex = PRESTIGE_ERAS.findIndex(e => e.id === ms.eraRequired)
        const currentEraIndex = PRESTIGE_ERAS.findIndex(e => e.id === currentEra.value.id)
        if (currentEraIndex < eraIndex) conditionMet = false
      }

      if (conditionMet) {
        ms.unlocked = true
        ms.unlockedAtTick = currentTick
        newlyUnlocked.push(ms)
      }
    }

    return newlyUnlocked
  }

  // ─── Perks ──────────────────────────────────────────────────────

  /** Initialize perks from definitions */
  function initPerks(defs: PerkDef[]): void {
    perks.value = defs.map((def) => ({
      ...def,
      purchased: false,
      purchasedAtTick: null,
    }))
  }

  /** Check if a perk can be purchased */
  function canBuyPerk(perkId: string): boolean {
    const perk = perks.value.find(p => p.id === perkId)
    if (!perk || perk.purchased) return false

    // Check cost
    if (points.value.lt(perk.cost)) return false

    // Check prerequisites
    if (!perk.prerequisites.every(preId => perks.value.find(p => p.id === preId)?.purchased)) {
      return false
    }

    // Check era requirement
    if (perk.eraRequired) {
      const eraIndex = PRESTIGE_ERAS.findIndex(e => e.id === perk.eraRequired)
      const currentEraIndex = PRESTIGE_ERAS.findIndex(e => e.id === currentEra.value.id)
      if (currentEraIndex < eraIndex) return false
    }

    return true
  }

  /** Purchase a perk */
  function buyPerk(perkId: string, currentTick: number): boolean {
    if (!canBuyPerk(perkId)) return false

    const perk = perks.value.find(p => p.id === perkId)
    if (!perk) return false

    points.value = points.value.sub(perk.cost)
    perk.purchased = true
    perk.purchasedAtTick = currentTick

    return true
  }

  // ─── Starting Bonuses ───────────────────────────────────────────

  /** Get starting cash bonus from all sources */
  function getStartingCash(): Decimal {
    let cash = ZERO

    // From upgrades
    for (const upg of upgrades.value) {
      if (upg.level > 0 && upg.effectType === 'starting_cash') {
        cash = add(cash, D(upg.effectValue * upg.level))
      }
    }

    // From milestones
    for (const ms of milestones.value) {
      if (ms.unlocked) {
        for (const reward of ms.rewards) {
          if (reward.type === 'starting_cash') {
            cash = add(cash, D(reward.value))
          }
        }
      }
    }

    // From perks
    for (const perk of perks.value) {
      if (perk.purchased && perk.effect.type === 'starting_cash') {
        cash = add(cash, D(perk.effect.value))
      }
    }

    return cash
  }

  /** Get starting XP bonus from all sources */
  function getStartingXp(): Decimal {
    let xp = ZERO

    // From upgrades
    for (const upg of upgrades.value) {
      if (upg.level > 0 && upg.effectType === 'starting_xp') {
        xp = add(xp, D(upg.effectValue * upg.level))
      }
    }

    // From milestones
    for (const ms of milestones.value) {
      if (ms.unlocked) {
        for (const reward of ms.rewards) {
          if (reward.type === 'starting_xp') {
            xp = add(xp, D(reward.value))
          }
        }
      }
    }

    return xp
  }

  /** Get offline bonus multiplier */
  function getOfflineBonusMultiplier(): Decimal {
    return mul(
      getEffectMultiplier('offline_bonus', upgrades.value),
      mul(getMilestoneMultiplier('offline_bonus'), getPerkMultiplier('offline_bonus'))
    )
  }

  /** Get loan discount (additive) */
  function getLoanDiscount(): number {
    return getTotalEffect('loan_discount')
  }

  /** Get job efficiency bonus */
  function getJobEfficiencyBonus(): number {
    return getTotalEffect('job_efficiency')
  }

  // ─── Initialization ─────────────────────────────────────────────

  /** Initialize all prestige systems */
  function initPrestige(): void {
    initPrestigeUpgrades(PRESTIGE_UPGRADES)
    initMilestones(PRESTIGE_MILESTONES)
    initPerks(PRESTIGE_PERKS)
  }

  // ─── Persistence ────────────────────────────────────────────────

  /** Load from save data (backward compatible) */
  function loadFromSave(data: {
    points?: Decimal
    totalPointsEarned?: Decimal
    rebirthCount?: number
    upgrades?: { id: string; level: number }[]
    milestones?: { id: string; unlocked: boolean; unlockedAtTick: number | null }[]
    perks?: { id: string; purchased: boolean; purchasedAtTick: number | null }[]
  }): void {
    if (data.points !== undefined) points.value = data.points
    if (data.totalPointsEarned !== undefined) totalPointsEarned.value = data.totalPointsEarned
    if (data.rebirthCount !== undefined) rebirthCount.value = data.rebirthCount

    // Load upgrades (handles both old and new format)
    if (data.upgrades) {
      for (const savedUpg of data.upgrades) {
        const upg = upgrades.value.find((u) => u.id === savedUpg.id)
        if (upg) upg.level = savedUpg.level
      }
    }

    // Load milestones
    if (data.milestones) {
      for (const savedMs of data.milestones) {
        const ms = milestones.value.find((m) => m.id === savedMs.id)
        if (ms) {
          ms.unlocked = savedMs.unlocked
          ms.unlockedAtTick = savedMs.unlockedAtTick
        }
      }
    }

    // Load perks
    if (data.perks) {
      for (const savedPerk of data.perks) {
        const perk = perks.value.find((p) => p.id === savedPerk.id)
        if (perk) {
          perk.purchased = savedPerk.purchased
          perk.purchasedAtTick = savedPerk.purchasedAtTick
        }
      }
    }
  }

  return {
    // Core state
    points,
    totalPointsEarned,
    rebirthCount,

    // Collections
    upgrades,
    milestones,
    perks,

    // Computed
    currentEra,
    nextEra,
    eraProgress,
    totalUpgradeLevels,
    unlockedMilestones,
    purchasedPerks,
    globalMultiplier,

    // Points & prestige
    previewPointsGain,
    canPrestige,
    performPrestige,

    // Upgrades
    initPrestigeUpgrades,
    buyPrestigeUpgrade,
    getUpgradeCost,

    // Milestones
    initMilestones,
    checkMilestones,

    // Perks
    initPerks,
    canBuyPerk,
    buyPerk,

    // Bonuses
    getStartingCash,
    getStartingXp,
    getOfflineBonusMultiplier,
    getLoanDiscount,
    getJobEfficiencyBonus,
    getTotalEffect,
    isUnlocked,

    // Initialization & persistence
    initPrestige,
    loadFromSave,
  }
})
