/**
 * useAchievementStore — Achievement tracking and rewards
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type AchievementRewardType = 'cash' | 'multiplier' | 'unlock' | 'prestige_points'

export interface AchievementReward {
  type: AchievementRewardType
  value: number
  target?: string
}

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  category: string
  /** Condition is evaluated externally (in game loop composable) */
  condition?: { type: string; value: unknown }
  hidden?: boolean
  reward?: AchievementReward
}

export interface Achievement extends AchievementDef {
  unlocked: boolean
  unlockedAtTick: number | null
}

export const useAchievementStore = defineStore('achievements', () => {
  const achievements = ref<Achievement[]>([])
  /** Queue of recently unlocked achievements (for toast notifications) */
  const recentUnlocks = ref<Achievement[]>([])

  const unlockedCount = computed(() => achievements.value.filter((a) => a.unlocked).length)
  const totalCount = computed(() => achievements.value.length)
  const completionPercent = computed(() =>
    totalCount.value > 0 ? (unlockedCount.value / totalCount.value) * 100 : 0
  )

  function initAchievements(defs: AchievementDef[]): void {
    achievements.value = defs.map((def) => ({
      ...def,
      unlocked: false,
      unlockedAtTick: null
    }))
  }

  /** Unlock an achievement by ID. Returns the reward if any. */
  function unlock(achievementId: string, currentTick: number): AchievementReward | null {
    const ach = achievements.value.find((a) => a.id === achievementId)
    if (!ach || ach.unlocked) return null

    ach.unlocked = true
    ach.unlockedAtTick = currentTick
    recentUnlocks.value.push(ach)

    // Keep recent unlocks queue manageable
    if (recentUnlocks.value.length > 10) {
      recentUnlocks.value.shift()
    }

    return ach.reward ?? null
  }

  /** Pop a recent unlock from the queue (for toast display) */
  function popRecentUnlock(): Achievement | null {
    return recentUnlocks.value.shift() ?? null
  }

  function isUnlocked(achievementId: string): boolean {
    return achievements.value.find((a) => a.id === achievementId)?.unlocked ?? false
  }

  // Achievements persist across prestige (never reset)

  /** Restore achievement state from a save */
  function loadFromSave(savedAchievements: Array<{ id: string; unlocked?: boolean; unlockedAtTick?: number | null }>): void {
    if (!Array.isArray(savedAchievements)) return
    for (const saved of savedAchievements) {
      const ach = achievements.value.find((a) => a.id === saved.id)
      if (ach) {
        ach.unlocked = saved.unlocked ?? false
        ach.unlockedAtTick = saved.unlockedAtTick ?? null
      }
    }
  }

  return {
    achievements, recentUnlocks,
    unlockedCount, totalCount, completionPercent,
    initAchievements, unlock, popRecentUnlock, isUnlocked, loadFromSave
  }
})
