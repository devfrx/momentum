/**
 * Startup Investment Store
 * Manages randomly generated time-limited startup opportunities and investments
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import Decimal from 'break_infinity.js'
import { ZERO, D, add, sub, mul, gte } from '@renderer/core/BigNum'
import { usePlayerStore } from './usePlayerStore'
import { rollChance } from '@renderer/core/Formulas'
import {
  generateOpportunityBatch,
  calculateEffectiveSuccessChance,
  calculateEffectiveReturn,
  OPPORTUNITY_REFRESH_TICKS,
  MIN_OPPORTUNITIES,
  MAX_OPPORTUNITIES,
  type StartupOpportunity,
  type StartupSector,
  SECTORS,
  STAGES,
  TRAITS
} from '@renderer/data/startups'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface StartupInvestment {
  id: string
  opportunityId: string
  name: string
  sector: StartupSector
  investedAmount: Decimal
  investedAtTick: number
  maturityTicks: number
  status: 'active' | 'succeeded' | 'failed' | 'exited'
  returnMultiplier: number
  successChance: number
  icon: string
  isHotDeal: boolean
}

interface StartupStoreState {
  /** Available opportunities (time-limited) */
  opportunities: StartupOpportunity[]
  /** Active and completed investments */
  investments: StartupInvestment[]
  /** Tick when opportunities were last refreshed */
  lastRefreshTick: number
  /** Total amount invested all-time */
  totalInvested: Decimal
  /** Total returns collected all-time */
  totalReturned: Decimal
  /** Sector bonus percentages (from skill tree) */
  sectorBonuses: Partial<Record<StartupSector, number>>
  /** Global success chance bonus */
  globalSuccessBonus: number
  /** Global return multiplier bonus */
  globalReturnBonus: number
  /** Number of successful investments (for achievements) */
  successfulCount: number
  /** Number of failed investments */
  failedCount: number
}

// ═══════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════

export const useStartupStore = defineStore('startups', () => {
  // State
  const opportunities = ref<StartupOpportunity[]>([])
  const investments = ref<StartupInvestment[]>([])
  const lastRefreshTick = ref(0)
  const totalInvested = ref<Decimal>(ZERO)
  const totalReturned = ref<Decimal>(ZERO)
  const sectorBonuses = ref<Partial<Record<StartupSector, number>>>({})
  const globalSuccessBonus = ref(0)
  const globalReturnBonus = ref(1)
  const successfulCount = ref(0)
  const failedCount = ref(0)

  // ─────────────────────────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────────────────────────

  /** Active investments (not matured yet) */
  const activeInvestments = computed(() =>
    investments.value.filter((i) => i.status === 'active')
  )

  /** Succeeded investments awaiting collection */
  const pendingInvestments = computed(() =>
    investments.value.filter((i) => i.status === 'succeeded')
  )

  /** Completed investments (exited or failed) */
  const completedInvestments = computed(() =>
    investments.value.filter((i) => i.status === 'exited' || i.status === 'failed')
  )

  /** Net profit from all investments */
  const netProfit = computed(() => sub(totalReturned.value, totalInvested.value))

  /** Win rate percentage */
  const winRate = computed(() => {
    const total = successfulCount.value + failedCount.value
    if (total === 0) return 0
    return (successfulCount.value / total) * 100
  })

  /** Time until next opportunity refresh (in ticks) */
  const ticksUntilRefresh = computed(() => {
    return Math.max(0, lastRefreshTick.value + OPPORTUNITY_REFRESH_TICKS - Date.now())
  })

  /** Available (non-expired) opportunities */
  const availableOpportunities = computed(() =>
    opportunities.value.filter((o) => !isOpportunityExpired(o, Date.now()))
  )

  /** Hot deals in current batch */
  const hotDeals = computed(() =>
    availableOpportunities.value.filter((o) => o.isHotDeal)
  )

  // ─────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────

  function isOpportunityExpired(opp: StartupOpportunity, currentTick: number): boolean {
    return currentTick >= opp.expiresAtTick
  }

  function getPlayerNetWorth(): number {
    const player = usePlayerStore()
    // Approximate net worth for opportunity scaling
    return player.cash.toNumber()
  }

  // ─────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Refresh opportunities - generate new batch
   */
  function refreshOpportunities(currentTick: number, force = false): void {
    const timeSinceRefresh = currentTick - lastRefreshTick.value

    // Only refresh if enough time has passed or forced
    if (!force && timeSinceRefresh < OPPORTUNITY_REFRESH_TICKS && opportunities.value.length > 0) {
      // Just remove expired ones
      opportunities.value = opportunities.value.filter(
        (o) => !isOpportunityExpired(o, currentTick)
      )
      return
    }

    // Generate new batch
    const count = MIN_OPPORTUNITIES + Math.floor(Math.random() * (MAX_OPPORTUNITIES - MIN_OPPORTUNITIES + 1))
    const netWorth = getPlayerNetWorth()

    opportunities.value = generateOpportunityBatch(
      currentTick,
      netWorth,
      OPPORTUNITY_REFRESH_TICKS,
      count
    )

    lastRefreshTick.value = currentTick
  }

  /**
   * Perform due diligence on an opportunity
   */
  function performDueDiligence(opportunityId: string): boolean {
    const opp = opportunities.value.find((o) => o.id === opportunityId)
    if (!opp || opp.dueDiligenceDone) return false

    const player = usePlayerStore()
    const cost = D(opp.dueDiligenceCost)

    if (!gte(player.cash, cost)) return false

    player.spendCash(cost)
    opp.dueDiligenceDone = true
    return true
  }

  /**
   * Invest in a startup opportunity
   */
  function invest(
    opportunityId: string,
    amount: Decimal,
    currentTick: number
  ): boolean {
    const opp = opportunities.value.find((o) => o.id === opportunityId)
    if (!opp) return false

    // Check if opportunity is still valid
    if (isOpportunityExpired(opp, currentTick)) return false

    // Check investment limits
    const amountNum = amount.toNumber()
    if (amountNum < opp.minInvestment || amountNum > opp.maxInvestment) return false

    const player = usePlayerStore()
    if (!gte(player.cash, amount)) return false

    // Deduct cash
    player.spendCash(amount)

    // Calculate effective values with bonuses
    const sectorBonus = sectorBonuses.value[opp.sector] || 0
    const effectiveSuccessChance = calculateEffectiveSuccessChance(
      opp,
      sectorBonus,
      globalSuccessBonus.value
    )
    const effectiveReturn = calculateEffectiveReturn(opp, globalReturnBonus.value)

    // Create investment record
    const investment: StartupInvestment = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      opportunityId: opp.id,
      name: opp.name,
      sector: opp.sector,
      investedAmount: amount,
      investedAtTick: currentTick,
      maturityTicks: opp.maturityTicks,
      status: 'active',
      returnMultiplier: effectiveReturn,
      successChance: effectiveSuccessChance,
      icon: opp.icon,
      isHotDeal: opp.isHotDeal
    }

    investments.value.push(investment)
    totalInvested.value = add(totalInvested.value, amount)

    // Remove opportunity from available list
    opportunities.value = opportunities.value.filter((o) => o.id !== opportunityId)

    // XP for startup investing
    player.addXp(D(20))

    return true
  }

  /**
   * Process tick - check for matured investments and expired opportunities
   */
  function tick(currentTick: number): void {
    // Check for matured investments
    for (const inv of investments.value) {
      if (inv.status !== 'active') continue

      const elapsed = currentTick - inv.investedAtTick
      if (elapsed >= inv.maturityTicks) {
        // Determine success or failure
        const isSuccessful = rollChance(inv.successChance)

        if (isSuccessful) {
          inv.status = 'succeeded'
          successfulCount.value++
        } else {
          inv.status = 'failed'
          failedCount.value++
        }
      }
    }

    // Check for expired opportunities and refresh if needed
    const remainingOpps = opportunities.value.filter(
      (o) => !isOpportunityExpired(o, currentTick)
    )

    // If most opportunities expired, trigger a refresh
    if (remainingOpps.length < 2) {
      refreshOpportunities(currentTick, true)
    } else {
      opportunities.value = remainingOpps
    }
  }

  /**
   * Collect returns from a succeeded investment
   */
  function exitInvestment(investmentId: string): Decimal | null {
    const inv = investments.value.find((i) => i.id === investmentId)
    if (!inv || inv.status !== 'succeeded') return null

    const player = usePlayerStore()
    const returnAmount = mul(inv.investedAmount, inv.returnMultiplier)

    // Add returns to player cash
    player.earnCash(returnAmount)

    inv.status = 'exited'
    totalReturned.value = add(totalReturned.value, returnAmount)

    // XP for successful exit
    player.addXp(D(100))

    return returnAmount
  }

  /**
   * Get opportunity details (for UI)
   */
  function getOpportunityDetails(opportunityId: string) {
    const opp = opportunities.value.find((o) => o.id === opportunityId)
    if (!opp) return null

    const sectorData = SECTORS[opp.sector]
    const stageData = STAGES[opp.stage]
    const traitData = opp.traits.map((t) => TRAITS[t])

    const sectorBonus = sectorBonuses.value[opp.sector] || 0
    const effectiveSuccessChance = calculateEffectiveSuccessChance(
      opp,
      sectorBonus,
      globalSuccessBonus.value
    )
    const effectiveReturn = calculateEffectiveReturn(opp, globalReturnBonus.value)

    return {
      ...opp,
      sectorData,
      stageData,
      traitData,
      effectiveSuccessChance,
      effectiveReturn,
      displayedSuccessChance: opp.dueDiligenceDone ? effectiveSuccessChance : null
    }
  }

  /**
   * Apply sector bonus from skill tree
   */
  function applySectorBonus(sector: StartupSector, bonus: number): void {
    sectorBonuses.value[sector] = (sectorBonuses.value[sector] || 0) + bonus
  }

  /**
   * Apply global bonuses from skill tree
   */
  function applyGlobalBonus(successBonus: number, returnBonus: number): void {
    globalSuccessBonus.value += successBonus
    globalReturnBonus.value *= returnBonus
  }

  /**
   * Reset on prestige
   */
  function prestigeReset(): void {
    investments.value = []
    opportunities.value = []
    totalInvested.value = ZERO
    totalReturned.value = ZERO
    lastRefreshTick.value = 0
    // Keep bonuses from skill tree
  }

  /**
   * Full reset (new game)
   */
  function fullReset(): void {
    prestigeReset()
    sectorBonuses.value = {}
    globalSuccessBonus.value = 0
    globalReturnBonus.value = 1
    successfulCount.value = 0
    failedCount.value = 0
  }

  /**
   * Load from save
   */
  function loadFromSave(state: Partial<StartupStoreState>): void {
    if (state.opportunities) opportunities.value = state.opportunities
    if (state.investments) {
      // Convert saved amounts back to Decimal
      investments.value = state.investments.map((inv) => ({
        ...inv,
        investedAmount: D(inv.investedAmount)
      }))
    }
    if (state.lastRefreshTick !== undefined) lastRefreshTick.value = state.lastRefreshTick
    if (state.totalInvested) totalInvested.value = D(state.totalInvested)
    if (state.totalReturned) totalReturned.value = D(state.totalReturned)
    if (state.sectorBonuses) sectorBonuses.value = state.sectorBonuses
    if (state.globalSuccessBonus !== undefined) globalSuccessBonus.value = state.globalSuccessBonus
    if (state.globalReturnBonus !== undefined) globalReturnBonus.value = state.globalReturnBonus
    if (state.successfulCount !== undefined) successfulCount.value = state.successfulCount
    if (state.failedCount !== undefined) failedCount.value = state.failedCount
  }

  /**
   * Export state for saving
   */
  function exportState(): StartupStoreState {
    return {
      opportunities: opportunities.value,
      investments: investments.value.map((inv) => ({
        ...inv,
        investedAmount: inv.investedAmount // Will be serialized
      })),
      lastRefreshTick: lastRefreshTick.value,
      totalInvested: totalInvested.value,
      totalReturned: totalReturned.value,
      sectorBonuses: sectorBonuses.value,
      globalSuccessBonus: globalSuccessBonus.value,
      globalReturnBonus: globalReturnBonus.value,
      successfulCount: successfulCount.value,
      failedCount: failedCount.value
    }
  }

  return {
    // State
    opportunities,
    investments,
    lastRefreshTick,
    totalInvested,
    totalReturned,
    sectorBonuses,
    globalSuccessBonus,
    globalReturnBonus,
    successfulCount,
    failedCount,

    // Computed
    activeInvestments,
    pendingInvestments,
    completedInvestments,
    netProfit,
    winRate,
    ticksUntilRefresh,
    availableOpportunities,
    hotDeals,

    // Actions
    refreshOpportunities,
    performDueDiligence,
    invest,
    tick,
    exitInvestment,
    getOpportunityDetails,
    applySectorBonus,
    applyGlobalBonus,
    prestigeReset,
    fullReset,
    loadFromSave,
    exportState
  }
})
