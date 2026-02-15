/**
 * useMultipliers — Centralized multiplier breakdown composable
 *
 * Extracts and computes all active multipliers from every source
 * (Skill Tree, Prestige, Events, Achievements) for use in dashboard,
 * header panel, and any other UI that needs multiplier data.
 */
import { computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ONE, mul } from '@renderer/core/BigNum'
import { upgradeEffect } from '@renderer/core/Formulas'
import { useUpgradeStore, type UpgradeEffectTarget } from '@renderer/stores/useUpgradeStore'
import { usePrestigeStore } from '@renderer/stores/usePrestigeStore'
import { useEventStore } from '@renderer/stores/useEventStore'
import { useAchievementStore } from '@renderer/stores/useAchievementStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { useFormat } from './useFormat'
import type { EventEffectType } from '@renderer/core/EventSystem'

// ─── Types ──────────────────────────────────────────────────────

export interface MultiplierCategory {
  id: string
  labelKey: string
  icon: string
  upgradeTarget: UpgradeEffectTarget | null
  prestigeEffects: string[]
  eventEffect: { type: string; target?: string } | null
  achievementTarget: string | null
  /** Whether this category benefits from the Era global bonus */
  eraAffected: boolean
}

export interface SourceLine {
  sourceKey: string
  sourceParam?: string
  icon: string
  value: string
  raw: Decimal
}

export interface CategoryBreakdown {
  category: MultiplierCategory
  sources: SourceLine[]
  total: Decimal
  totalFormatted: string
  hasBonus: boolean
}

// ─── Category definitions ───────────────────────────────────────

export const MULTIPLIER_CATEGORIES: MultiplierCategory[] = [
  {
    id: 'all_income',
    labelKey: 'multipliers.all_income',
    icon: 'mdi:cash-multiple',
    upgradeTarget: 'all_income',
    prestigeEffects: ['global_multiplier'],
    eventEffect: { type: 'income_multiplier' },
    achievementTarget: 'all_income',
    eraAffected: true,
  },
  {
    id: 'business_revenue',
    labelKey: 'multipliers.business_revenue',
    icon: 'mdi:store',
    upgradeTarget: 'business_revenue',
    prestigeEffects: ['business_revenue'],
    eventEffect: { type: 'income_multiplier', target: 'business' },
    achievementTarget: 'business_revenue',
    eraAffected: true,
  },
  {
    id: 'cost_reduction',
    labelKey: 'multipliers.cost_reduction',
    icon: 'mdi:tag-minus',
    upgradeTarget: 'cost_reduction',
    prestigeEffects: ['cost_reduction'],
    eventEffect: { type: 'cost_multiplier' },
    achievementTarget: 'cost_reduction',
    eraAffected: false,
  },
  {
    id: 'customer_attraction',
    labelKey: 'multipliers.customer_attraction',
    icon: 'mdi:account-group',
    upgradeTarget: 'customer_attraction',
    prestigeEffects: [],
    eventEffect: null,
    achievementTarget: null,
    eraAffected: false,
  },
  {
    id: 'job_efficiency',
    labelKey: 'multipliers.job_efficiency',
    icon: 'mdi:briefcase',
    upgradeTarget: 'job_efficiency',
    prestigeEffects: ['job_efficiency'],
    eventEffect: null,
    achievementTarget: 'job_efficiency',
    eraAffected: true,
  },
  {
    id: 'real_estate_rent',
    labelKey: 'multipliers.real_estate_rent',
    icon: 'mdi:home-city',
    upgradeTarget: 'real_estate_rent',
    prestigeEffects: ['real_estate_income'],
    eventEffect: { type: 'income_multiplier', target: 'realestate' },
    achievementTarget: 'real_estate_rent',
    eraAffected: true,
  },
  {
    id: 'stock_returns',
    labelKey: 'multipliers.stock_returns',
    icon: 'mdi:chart-line',
    upgradeTarget: 'stock_returns',
    prestigeEffects: ['stock_returns'],
    eventEffect: null,
    achievementTarget: 'stock_returns',
    eraAffected: false,
  },
  {
    id: 'crypto_returns',
    labelKey: 'multipliers.crypto_returns',
    icon: 'mdi:bitcoin',
    upgradeTarget: 'crypto_returns',
    prestigeEffects: ['crypto_returns'],
    eventEffect: null,
    achievementTarget: 'crypto_returns',
    eraAffected: false,
  },
  {
    id: 'gambling_luck',
    labelKey: 'multipliers.gambling_luck',
    icon: 'mdi:dice-multiple',
    upgradeTarget: 'gambling_luck',
    prestigeEffects: [],
    eventEffect: null,
    achievementTarget: 'gambling_luck',
    eraAffected: false,
  },
  {
    id: 'offline_efficiency',
    labelKey: 'multipliers.offline_efficiency',
    icon: 'mdi:clock-outline',
    upgradeTarget: 'offline_efficiency',
    prestigeEffects: ['offline_bonus'],
    eventEffect: null,
    achievementTarget: null,
    eraAffected: false,
  },
  {
    id: 'xp_gain',
    labelKey: 'multipliers.xp_gain',
    icon: 'mdi:star',
    upgradeTarget: 'xp_gain',
    prestigeEffects: ['xp_gain'],
    eventEffect: null,
    achievementTarget: 'xp_gain',
    eraAffected: false,
  },
  {
    id: 'prestige_gain',
    labelKey: 'multipliers.prestige_gain',
    icon: 'mdi:trophy',
    upgradeTarget: 'prestige_gain',
    prestigeEffects: ['prestige_gain'],
    eventEffect: null,
    achievementTarget: null,
    eraAffected: false,
  },
  {
    id: 'startup_success',
    labelKey: 'multipliers.startup_success',
    icon: 'mdi:rocket-launch',
    upgradeTarget: 'startup_success',
    prestigeEffects: [],
    eventEffect: null,
    achievementTarget: null,
    eraAffected: false,
  },
  {
    id: 'loan_rate',
    labelKey: 'multipliers.loan_rate',
    icon: 'mdi:bank',
    upgradeTarget: 'loan_rate',
    prestigeEffects: ['loan_discount'],
    eventEffect: { type: 'loan_rate_modifier' },
    achievementTarget: null,
    eraAffected: false,
  },
  {
    id: 'deposit_rate',
    labelKey: 'multipliers.deposit_rate',
    icon: 'mdi:piggy-bank',
    upgradeTarget: 'deposit_rate',
    prestigeEffects: ['deposit_bonus'],
    eventEffect: { type: 'deposit_rate_modifier' },
    achievementTarget: null,
    eraAffected: false,
  },
]

const IMPORTANT_CATEGORIES = new Set([
  'all_income',
  'business_revenue',
  'gambling_luck',
  'offline_efficiency',
])

export function useMultipliers() {
  const upgrades = useUpgradeStore()
  const prestige = usePrestigeStore()
  const events = useEventStore()
  const achievements = useAchievementStore()
  const gambling = useGamblingStore()
  const { formatMultiplier } = useFormat()

  const breakdowns = computed<CategoryBreakdown[]>(() => {
    return MULTIPLIER_CATEGORIES.map((cat) => {
      const sources: SourceLine[] = []

      // 1. Skill Tree upgrades
      if (cat.upgradeTarget) {
        for (const node of upgrades.nodes) {
          if (node.level <= 0 || node.effectTarget !== cat.upgradeTarget) continue
          const effect = upgradeEffect(node.baseEffect, node.level, node.effectScaling)
          sources.push({
            sourceKey: 'multipliers.source_skill',
            sourceParam: node.name,
            icon: node.icon || 'mdi:puzzle',
            value: formatMultiplier(effect.add(1)),
            raw: effect.add(1),
          })
        }
      }

      // 2. Prestige upgrades, milestones, perks
      for (const effType of cat.prestigeEffects) {
        for (const upg of prestige.upgrades) {
          if (upg.level > 0 && upg.effectType === effType) {
            const val = 1 + upg.effectValue * upg.level
            sources.push({
              sourceKey: 'multipliers.source_prestige',
              sourceParam: upg.name,
              icon: upg.icon || 'mdi:crown',
              value: formatMultiplier(D(val)),
              raw: D(val),
            })
          }
        }
        for (const ms of prestige.milestones) {
          if (ms.unlocked) {
            for (const reward of ms.rewards) {
              if (reward.type === effType) {
                const val = 1 + reward.value
                sources.push({
                  sourceKey: 'multipliers.source_milestone',
                  sourceParam: ms.name,
                  icon: ms.icon || 'mdi:flag',
                  value: formatMultiplier(D(val)),
                  raw: D(val),
                })
              }
            }
          }
        }
        for (const perk of prestige.perks) {
          if (perk.purchased && perk.effect.type === effType) {
            const val = 1 + perk.effect.value
            sources.push({
              sourceKey: 'multipliers.source_perk',
              sourceParam: perk.name,
              icon: perk.icon || 'mdi:lightning-bolt',
              value: formatMultiplier(D(val)),
              raw: D(val),
            })
          }
        }
      }

      // 3. Era bonus (only global_multiplier)
      if (cat.prestigeEffects.includes('global_multiplier')) {
        const eraBonus = prestige.currentEra.globalBonus
        if (eraBonus > 0) {
          sources.push({
            sourceKey: 'multipliers.source_era',
            sourceParam: prestige.currentEra.name,
            icon: prestige.currentEra.icon || 'mdi:shield-crown',
            value: formatMultiplier(D(1 + eraBonus)),
            raw: D(1 + eraBonus),
          })
        }
        const basePM = D(1).add(mul(prestige.points, 0.1))
        if (basePM.gt(1)) {
          sources.push({
            sourceKey: 'multipliers.source_prestige_points',
            icon: 'mdi:diamond-stone',
            value: formatMultiplier(basePM),
            raw: basePM,
          })
        }
      }

      // 4. Event bonuses
      if (cat.eventEffect) {
        const evMul = events.getMultiplier(
          cat.eventEffect.type as EventEffectType,
          cat.eventEffect.target
        )
        if (evMul !== 1) {
          sources.push({
            sourceKey: 'multipliers.source_event',
            icon: 'mdi:lightning-bolt-circle',
            value: formatMultiplier(D(evMul)),
            raw: D(evMul),
          })
        }
      }

      // 5. Achievement rewards
      if (cat.achievementTarget) {
        for (const ach of achievements.achievements) {
          if (
            ach.unlocked &&
            ach.reward?.type === 'multiplier' &&
            ach.reward?.target === cat.achievementTarget
          ) {
            sources.push({
              sourceKey: 'multipliers.source_achievement',
              sourceParam: ach.name,
              icon: ach.icon || 'mdi:medal',
              value: formatMultiplier(D(ach.reward.value)),
              raw: D(ach.reward.value),
            })
          }
        }
      }

      // 6. Divine Abilities (permanent lottery rewards)
      for (const ability of gambling.getUnlockedDivineAbilities()) {
        if (ability.effect.target === cat.id) {
          sources.push({
            sourceKey: 'multipliers.source_divine',
            sourceParam: ability.name,
            icon: ability.icon || 'mdi:shimmer',
            value: formatMultiplier(D(ability.effect.value)),
            raw: D(ability.effect.value),
          })
        }
      }

      let total = ONE
      for (const s of sources) total = mul(total, s.raw)

      return {
        category: cat,
        sources,
        total,
        totalFormatted: formatMultiplier(total),
        hasBonus: total.gt(1),
      }
    }).filter(
      (b) => b.hasBonus || b.sources.length > 0 || IMPORTANT_CATEGORIES.has(b.category.id)
    )
  })

  /** Only categories that have an active bonus */
  const activeBreakdowns = computed(() => breakdowns.value.filter((b) => b.hasBonus))

  return { breakdowns, activeBreakdowns, MULTIPLIER_CATEGORIES }
}
