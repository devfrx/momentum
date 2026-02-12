/**
 * useJobStore — Gig / Job management
 *
 * Replaces the old "click" mechanic.
 * Jobs are passive income sources: the player starts/stops them and
 * they generate $/tick automatically. Each job gains experience over
 * time, increasing efficiency. Multiple jobs can run concurrently,
 * up to a soft cap based on player level.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, mul } from '@renderer/core/BigNum'
import { JOBS, type JobDef } from '@renderer/data'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'
import { usePrestigeStore } from './usePrestigeStore'

// ─── Types ────────────────────────────────────────────────────

export interface ActiveJob {
  id: string
  /** Reference to definition id */
  defId: string
  /** Experience level (starts 0, grows with ticks) */
  experienceLevel: number
  /** Cumulative ticks worked in this job */
  ticksWorked: number
  /** Whether job is currently active (generating income) */
  active: boolean
}

export const useJobStore = defineStore('jobs', () => {
  const playerStore = usePlayerStore()

  // ─── State ────────────────────────────────────────────────────

  /** All jobs the player has unlocked */
  const unlockedJobs = ref<ActiveJob[]>([])

  // ─── Computed ─────────────────────────────────────────────────

  /** Maximum concurrent active jobs (scales with level) */
  const maxActiveJobs = computed(() => {
    return 1 + Math.floor(playerStore.level / 5)
  })

  const activeJobCount = computed(() =>
    unlockedJobs.value.filter((j) => j.active).length
  )

  /**
   * Total income per tick from all active jobs.
   * Formula: basePayPerTick * (1 + experienceLevel * experienceScaling)
   */
  const totalJobIncomePerTick = computed<Decimal>(() => {
    let total = ZERO
    for (const job of unlockedJobs.value) {
      if (!job.active) continue
      const def = getJobDef(job.defId)
      if (!def) continue
      const efficiencyMult = 1 + job.experienceLevel * def.experienceScaling
      const income = mul(def.basePayPerTick, efficiencyMult)
      total = add(total, income)
    }
    return total
  })

  /**
   * Total job income per second INCLUDING all multipliers (upgrades, prestige).
   * Mirrors the actual tick() logic for accurate offline calculations.
   */
  const jobIncomePerSecond = computed<Decimal>(() => {
    const upgrades = useUpgradeStore()
    const prestige = usePrestigeStore()
    const jobEfficiencyMul = upgrades.getMultiplier('job_efficiency')
    const allIncomeMul = upgrades.getMultiplier('all_income')
    const prestigeGlobalMul = prestige.globalMultiplier
    let prestigeJobMul = 1
    for (const upg of prestige.upgrades) {
      if (upg.level > 0 && upg.effectType === 'job_efficiency') {
        prestigeJobMul += upg.effectValue * upg.level
      }
    }

    let total = ZERO
    for (const job of unlockedJobs.value) {
      if (!job.active) continue
      const def = getJobDef(job.defId)
      if (!def) continue
      const efficiencyMult = 1 + job.experienceLevel * def.experienceScaling
      let income = mul(def.basePayPerTick, efficiencyMult)
      income = mul(income, jobEfficiencyMul)
      income = mul(income, allIncomeMul)
      income = mul(income, prestigeGlobalMul)
      income = mul(income, prestigeJobMul)
      total = add(total, income)
    }
    // 10 ticks per second
    return mul(total, 10)
  })

  // ─── Helpers ──────────────────────────────────────────────────

  function getJobDef(defId: string): JobDef | undefined {
    return JOBS.find((j) => j.id === defId)
  }

  // ─── Actions ──────────────────────────────────────────────────

  /** Unlock a job (pay unlock cost if any). Returns false if can't afford. */
  function unlockJob(defId: string): boolean {
    const def = getJobDef(defId)
    if (!def) return false
    // Already unlocked?
    if (unlockedJobs.value.find((j) => j.defId === defId)) return false
    // Check cost
    if (def.unlockCost.gt(ZERO) && !playerStore.spendCash(def.unlockCost)) {
      return false
    }
    unlockedJobs.value.push({
      id: `job_${defId}_${Date.now()}`,
      defId,
      experienceLevel: 0,
      ticksWorked: 0,
      active: false,
    })
    return true
  }

  /** Start working a job (set active). */
  function startJob(defId: string): boolean {
    if (activeJobCount.value >= maxActiveJobs.value) return false
    const job = unlockedJobs.value.find((j) => j.defId === defId)
    if (!job || job.active) return false
    job.active = true
    return true
  }

  /** Stop working a job. */
  function stopJob(defId: string): void {
    const job = unlockedJobs.value.find((j) => j.defId === defId)
    if (job) job.active = false
  }

  /**
   * Game tick — earns income from active jobs and accumulates experience.
   * Returns total income earned this tick.
   */
  function tick(): Decimal {
    let totalIncome = ZERO
    const TICKS_PER_XP_LEVEL = 600 // ~60 seconds per experience level at 10 ticks/s

    // Get upgrade + prestige multipliers for job efficiency
    const upgrades = useUpgradeStore()
    const prestige = usePrestigeStore()
    const jobEfficiencyMul = upgrades.getMultiplier('job_efficiency')
    const allIncomeMul = upgrades.getMultiplier('all_income')
    const prestigeGlobalMul = prestige.globalMultiplier
    // Prestige job-efficiency bonus
    let prestigeJobMul = 1
    for (const upg of prestige.upgrades) {
      if (upg.level > 0 && upg.effectType === 'job_efficiency') {
        prestigeJobMul += upg.effectValue * upg.level
      }
    }

    for (const job of unlockedJobs.value) {
      if (!job.active) continue
      const def = getJobDef(job.defId)
      if (!def) continue

      // Calculate income with upgrade & prestige multipliers
      const efficiencyMult = 1 + job.experienceLevel * def.experienceScaling
      let income = mul(def.basePayPerTick, efficiencyMult)
      income = mul(income, jobEfficiencyMul)
      income = mul(income, allIncomeMul)
      income = mul(income, prestigeGlobalMul)
      income = mul(income, prestigeJobMul)
      totalIncome = add(totalIncome, income)

      // Accumulate experience
      job.ticksWorked++
      if (job.ticksWorked > 0 && job.ticksWorked % TICKS_PER_XP_LEVEL === 0) {
        job.experienceLevel++
      }
    }

    if (totalIncome.gt(ZERO)) {
      playerStore.earnCash(totalIncome)
      // Jobs also give XP
      playerStore.addXp(D(0.1))
    }

    return totalIncome
  }

  /** Reset for prestige */
  function prestigeReset(): void {
    // Keep unlocked jobs but reset experience and deactivate
    for (const job of unlockedJobs.value) {
      job.experienceLevel = 0
      job.ticksWorked = 0
      job.active = false
    }
  }

  /** Hydrate from save */
  function loadFromSave(data: { unlockedJobs: ActiveJob[] }): void {
    unlockedJobs.value = data.unlockedJobs ?? []
  }

  return {
    // State
    unlockedJobs,
    // Computed
    maxActiveJobs,
    activeJobCount,
    totalJobIncomePerTick,
    jobIncomePerSecond,
    // Actions
    unlockJob,
    startJob,
    stopJob,
    tick,
    prestigeReset,
    loadFromSave,
  }
})
