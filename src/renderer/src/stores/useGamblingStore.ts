/**
 * useGamblingStore — Gambling mini-games state and statistics
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, max } from '@renderer/core/BigNum'
import { usePlayerStore } from './usePlayerStore'
import { useUpgradeStore } from './useUpgradeStore'
import { DIVINE_ABILITIES, type DivineAbilityDef } from '@renderer/data/lottery'

export type GamblingGame = 'slots' | 'roulette' | 'dice' | 'blackjack' | 'poker' | 'coinflip' | 'plinko' | 'lottery'

export interface GameStat {
  played: number
  won: number
  netProfit: Decimal
}

export const useGamblingStore = defineStore('gambling', () => {
  const totalBet = ref<Decimal>(ZERO)
  const totalWon = ref<Decimal>(ZERO)
  const totalLost = ref<Decimal>(ZERO)
  const gamesPlayed = ref(0)
  const biggestWin = ref<Decimal>(ZERO)
  const biggestLoss = ref<Decimal>(ZERO)
  const gameStats = ref<Record<string, GameStat>>({})
  /** Current active mini-game (null = casino lobby) */
  const activeGame = ref<GamblingGame | null>(null)

  /** Divine abilities unlocked via Divine Fate lottery (persist across prestige) */
  const divineAbilities = ref<string[]>([])

  /** Track which lottery jackpots have been won (for achievements) */
  const lotteryWins = ref<Record<string, boolean>>({})

  const netProfit = computed(() => sub(totalWon.value, totalLost.value))
  const winRate = computed(() => {
    if (gamesPlayed.value === 0) return 0
    const totalWins = Object.values(gameStats.value).reduce((s, g) => s + g.won, 0)
    return totalWins / gamesPlayed.value
  })

  function ensureGameStat(game: string): GameStat {
    if (!gameStats.value[game]) {
      gameStats.value[game] = { played: 0, won: 0, netProfit: ZERO }
    }
    return gameStats.value[game]
  }

  /** Record winning a bet */
  function recordWin(game: GamblingGame, betAmount: Decimal, payout: Decimal): void {
    // Luck now affects probability, not payout - see individual games
    const winAmount = sub(payout, betAmount)
    totalBet.value = add(totalBet.value, betAmount)
    totalWon.value = add(totalWon.value, payout)
    gamesPlayed.value++
    biggestWin.value = max(biggestWin.value, winAmount)

    const stat = ensureGameStat(game)
    stat.played++
    stat.won++
    stat.netProfit = add(stat.netProfit, winAmount)

    // XP for gambling win
    usePlayerStore().addXp(D(2))
  }

  /** Record losing a bet */
  function recordLoss(game: GamblingGame, betAmount: Decimal): void {
    totalBet.value = add(totalBet.value, betAmount)
    totalLost.value = add(totalLost.value, betAmount)
    gamesPlayed.value++
    biggestLoss.value = max(biggestLoss.value, betAmount)

    const stat = ensureGameStat(game)
    stat.played++
    stat.netProfit = sub(stat.netProfit, betAmount)

    // Small XP even on loss
    usePlayerStore().addXp(D(0.5))
  }

  function setActiveGame(game: GamblingGame | null): void {
    activeGame.value = game
  }

  function getStats(game: string): GameStat {
    return gameStats.value[game] ?? { played: 0, won: 0, netProfit: ZERO }
  }

  /**
   * Get the current luck multiplier (1.0 = base, 1.5 = 50% bonus, etc.)
   */
  function getLuckMultiplier(): number {
    return useUpgradeStore().getMultiplier('gambling_luck').toNumber()
  }

  /**
   * Get luck bonus as a 0–1 probability using diminishing returns.
   * Formula: 1 − 1/multiplier (e.g. 2× → 0.5, 5× → 0.8, 100× → 0.99)
   * Used by all gambling games for second-chance mechanics.
   */
  function getLuckBonus(): number {
    const mult = getLuckMultiplier()
    if (mult <= 1) return 0
    return 1 - (1 / mult)
  }

  /**
   * Roll with luck: gives player a second chance to win on a loss.
   * If the initial result would be a loss, there's a (luckBonus) chance to re-roll.
   * @param winProbability - base probability of winning (0-1)
   * @returns true if player wins
   */
  function luckyRoll(winProbability: number): boolean {
    const roll = Math.random()
    if (roll < winProbability) return true
    // Failed first roll - luck gives second chance
    const luckBonus = getLuckBonus()
    if (luckBonus > 0 && Math.random() < luckBonus) {
      return Math.random() < winProbability
    }
    return false
  }

  /**
   * Biased random: shifts the random value toward favorable outcomes
   * @param favorHigh - if true, bias toward 1; if false, bias toward 0
   * @returns biased random value 0-1
   */
  function luckyRandom(favorHigh: boolean = true): number {
    const base = Math.random()
    const luckBonus = getLuckBonus()
    if (luckBonus <= 0) return base
    // Blend toward the favorable extreme
    const favorable = favorHigh ? 1 : 0
    return base + (favorable - base) * luckBonus * 0.5
  }

  function prestigeReset(): void {
    totalBet.value = ZERO
    totalWon.value = ZERO
    totalLost.value = ZERO
    gamesPlayed.value = 0
    biggestWin.value = ZERO
    biggestLoss.value = ZERO
    gameStats.value = {}
    // divineAbilities and lotteryWins persist across prestige — never reset
  }

  /** Unlock a divine ability (from Divine Fate lottery). Returns true if newly unlocked. */
  function unlockDivineAbility(abilityId: string): boolean {
    if (divineAbilities.value.includes(abilityId)) return false
    divineAbilities.value.push(abilityId)
    return true
  }

  /** Check if a divine ability is unlocked */
  function hasDivineAbility(abilityId: string): boolean {
    return divineAbilities.value.includes(abilityId)
  }

  /** Get all unlocked divine ability definitions */
  function getUnlockedDivineAbilities(): DivineAbilityDef[] {
    return divineAbilities.value
      .map(id => DIVINE_ABILITIES.find(a => a.id === id))
      .filter((a): a is DivineAbilityDef => !!a)
  }

  /** Get the combined multiplier from divine abilities for a given target */
  function getDivineMultiplier(target: string): number {
    let mult = 1
    for (const id of divineAbilities.value) {
      const ability = DIVINE_ABILITIES.find(a => a.id === id)
      if (ability && ability.effect.target === target) {
        mult *= ability.effect.value
      }
    }
    return mult
  }

  /** Record a lottery jackpot/prize win by ticket+tier key (for achievements) */
  function recordLotteryWin(ticketId: string, prizeLabel: string): void {
    const key = `${ticketId}:${prizeLabel}`
    lotteryWins.value[key] = true
  }

  /** Check if a specific lottery prize has been won */
  function hasLotteryWin(ticketId: string, prizeLabel: string): boolean {
    return !!lotteryWins.value[`${ticketId}:${prizeLabel}`]
  }

  /** Reset divine abilities and lottery wins (for full hard reset only) */
  function fullReset(): void {
    prestigeReset()
    divineAbilities.value = []
    lotteryWins.value = {}
  }

  function loadFromSave(data: {
    totalBet?: Decimal
    totalWon?: Decimal
    totalLost?: Decimal
    gamesPlayed?: number
    biggestWin?: Decimal
    biggestLoss?: Decimal
    gameStats?: Record<string, GameStat>
    divineAbilities?: string[]
    lotteryWins?: Record<string, boolean>
  }): void {
    if (data.totalBet !== undefined) totalBet.value = data.totalBet
    if (data.totalWon !== undefined) totalWon.value = data.totalWon
    if (data.totalLost !== undefined) totalLost.value = data.totalLost
    if (data.gamesPlayed !== undefined) gamesPlayed.value = data.gamesPlayed
    if (data.biggestWin !== undefined) biggestWin.value = data.biggestWin
    if (data.biggestLoss !== undefined) biggestLoss.value = data.biggestLoss
    if (data.gameStats !== undefined) gameStats.value = data.gameStats
    if (data.divineAbilities !== undefined) divineAbilities.value = data.divineAbilities
    if (data.lotteryWins !== undefined) lotteryWins.value = data.lotteryWins
  }

  return {
    totalBet, totalWon, totalLost, gamesPlayed, biggestWin, biggestLoss,
    gameStats, activeGame, netProfit, winRate,
    divineAbilities, lotteryWins,
    recordWin, recordLoss, setActiveGame, getStats, prestigeReset, fullReset, loadFromSave,
    getLuckMultiplier, getLuckBonus, luckyRoll, luckyRandom,
    unlockDivineAbility, hasDivineAbility, getUnlockedDivineAbilities, getDivineMultiplier,
    recordLotteryWin, hasLotteryWin
  }
})
