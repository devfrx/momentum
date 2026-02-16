<script setup lang="ts">
/**
 * LotteryGame — Full lottery mini-game view within the Casino.
 *
 * Features:
 * - Multiple ticket types with different odds/prizes
 * - Interactive number picking with quick-pick option
 * - Animated number draw with match highlighting
 * - Prize tiers with rarity system
 * - Full integration with gambling store, player store,
 *   XP rewards, and skill tree gambling_luck (affects second chance)
 * - Draw history tracking within the session
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import LotteryTicket from './LotteryTicket.vue'
import LotteryDraw from './LotteryDraw.vue'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { useAchievementStore } from '@renderer/stores/useAchievementStore'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import { useFormat } from '@renderer/composables/useFormat'
import { D, ZERO } from '@renderer/core/BigNum'
import { gameEngine } from '@renderer/core/GameEngine'
import {
    LOTTERY_TICKETS,
    DIVINE_ABILITIES,
    executeDraw,
    countMatches,
    determinePrize,
    getDivineAbility,
    type LotteryTicketDef,
    type LotteryDrawResult,
    type DivineAbilityDef,
} from '@renderer/data/lottery'
import { rarityCssVar } from '@renderer/data/rarity'

const emit = defineEmits<{ back: [] }>()

const player = usePlayerStore()
const gambling = useGamblingStore()
const achievements = useAchievementStore()
const settings = useSettingsStore()
const { formatCash, formatNumber } = useFormat()

// ─── Draw speed & multi-draw options ─────────────────────────
const SPEED_OPTIONS = [0.5, 1, 2, 3, 5] as const
const MULTI_DRAW_OPTIONS = [1, 3, 5, 10] as const

// ─── State ───────────────────────────────────────────────────
const selectedTicketId = ref<string>(LOTTERY_TICKETS[0].id)
const isDrawing = ref(false)
const currentResult = ref<LotteryDrawResult | null>(null)
/** Luck triggered — shows clover animation when second chance or rolling luck activates */
const luckyTriggered = ref(false)
/** Indices of drawn balls forced by Rolling Luck — passed to LotteryDraw for glow */
const currentLuckyIndices = ref<Set<number>>(new Set())
/** Per-ball rolling luck chance (%) shown during the draw animation */
const currentLuckChances = ref<number[]>([])
/** Whether the current single draw was a second chance */
const currentSecondChance = ref(false)
/** Original losing result before second-chance re-draw */
const currentOriginalResult = ref<LotteryDrawResult | null>(null)
/** Luck chances for the original (phase 1) draw */
const currentOriginalLuckChances = ref<number[] | null>(null)
/** Indices forced by Rolling Luck in the original (phase 1) draw */
const currentOriginalLuckyIndices = ref<Set<number>>(new Set())

/** Session draw history (most recent first) */
const drawHistory = ref<Array<{
    ticketName: string
    result: LotteryDrawResult
    timestamp: number
}>>([])

const showPrizeTable = ref(false)

/** Toggle for divine abilities gallery */
const showDivineGallery = ref(false)

/** Per-draw data for multi-draw (result + luck visuals + second chance) */
interface MultiDrawEntry {
    result: LotteryDrawResult
    luckyIndices: Set<number>
    luckChances: number[]
    originalLuckyIndices: Set<number>
    originalLuckChances: number[] | null
    secondChance: boolean
    originalResult: LotteryDrawResult | null
}
/** Multi-draw results (when drawing > 1 at a time) */
const multiDrawResults = ref<MultiDrawEntry[]>([])
/** How many draws in the multi-draw have finished their animation */
const multiDrawFinished = ref(0)
/** Summary of multi-draw batch */
const multiDrawSummary = ref<{ total: number; wins: number; totalPayout: number; totalCost: number; abilities: DivineAbilityDef[] } | null>(null)

/** Recently unlocked divine ability (for UI banner) */
const newlyUnlockedAbility = ref<DivineAbilityDef | null>(null)

/** Mapping: ticketId → achievement ID to unlock on jackpot win */
const LOTTERY_ACHIEVEMENT_MAP: Record<string, string> = {
    quick_pick: 'lot_quick_pick',
    classic: 'lot_classic',
    mega: 'lot_mega',
    instant: 'lot_instant',
    ultra: 'lot_ultra',
    cosmic: 'lot_cosmic',
    divine: 'lot_divine',
}

/** All lottery ticket IDs that need a jackpot for the master achievement */
const ALL_LOTTERY_IDS = ['quick_pick', 'classic', 'mega', 'instant', 'ultra', 'cosmic', 'divine']

// ─── Computed ────────────────────────────────────────────────
const selectedTicket = computed<LotteryTicketDef>(() =>
    LOTTERY_TICKETS.find((t) => t.id === selectedTicketId.value) ?? LOTTERY_TICKETS[0]
)

const canAfford = computed(() =>
    player.cash.gte(D(selectedTicket.value.ticketCost))
)

/** Can afford N tickets for multi-draw */
const canAffordMulti = computed(() =>
    player.cash.gte(D(selectedTicket.value.ticketCost * settings.lotteryMultiDraw))
)

const drawSpeed = computed(() => settings.lotteryDrawSpeed)

const stats = computed(() => gambling.getStats('lottery'))

// Luck affects match probability in lottery via bonus matches
const luckMultiplier = computed(() => gambling.getLuckMultiplier())
const luckBonus = computed(() => gambling.getLuckBonus())

const sessionWins = computed(() => drawHistory.value.filter((h) => h.result.prizeTier !== null).length)
const sessionTotal = computed(() => drawHistory.value.length)
const sessionProfit = computed(() => {
    let total = ZERO
    for (const h of drawHistory.value) {
        const ticket = LOTTERY_TICKETS.find((t) => t.name === h.ticketName)
        const cost = D(ticket?.ticketCost ?? 0)
        const payout = D(h.result.payout)
        total = total.add(payout).sub(cost)
    }
    return total
})

// ─── Actions ─────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// ─── Luck constants ──────────────────────────────────────────
const LUCK_CAP_BY_PICKS: Record<number, number> = { 3: 0.12, 4: 0.18, 5: 0.24, 6: 0.30, 8: 0.35, 10: 0.40 }
const LUCK_DECAY = 0.55

/**
 * Execute a single draw with luck mechanics and record results.
 * Returns the finalized result and any newly unlocked ability.
 */
function executeSingleDrawWithLuck(
    ticket: LotteryTicketDef,
    numbers: number[],
    bonus: number | null,
): { result: LotteryDrawResult; ability: DivineAbilityDef | null; luckyIndices: Set<number>; luckChances: number[]; originalLuckyIndices: Set<number>; originalLuckChances: number[] | null; secondChance: boolean; originalResult: LotteryDrawResult | null } {
    const rawBonus = luckBonus.value

    function computeLuckChances(drawnNums: number[]): number[] {
        const cap = LUCK_CAP_BY_PICKS[ticket.pickCount] ?? 0.22
        const bl = rawBonus > 0 ? cap * Math.sqrt(rawBonus) : 0
        const chances: number[] = []
        let unmatchedIdx = 0
        for (let i = 0; i < drawnNums.length; i++) {
            if (numbers.includes(drawnNums[i])) {
                chances.push(-1)
            } else {
                chances.push(bl * Math.pow(LUCK_DECAY, unmatchedIdx))
                unmatchedIdx++
            }
        }
        return chances
    }

    /** Apply rolling luck to a draw result independently. Returns modified draw + forced indices. */
    function applyRollingLuck(draw: ReturnType<typeof executeDraw>): { draw: ReturnType<typeof executeDraw>; luckyIdx: Set<number> } {
        const luckyIdx = new Set<number>()
        if (rawBonus <= 0 || draw.prizeTier) return { draw, luckyIdx }
        const cap = LUCK_CAP_BY_PICKS[ticket.pickCount] ?? 0.22
        const baseLuck = cap * Math.sqrt(rawBonus)
        const drawnArr = [...draw.drawnNumbers]
        const unmatchedPlayer = numbers.filter((n) => !new Set(drawnArr).has(n))
        let forcedCount = 0
        const forcedValues = new Set<number>()
        for (let i = 0; i < drawnArr.length && unmatchedPlayer.length > 0; i++) {
            if (!numbers.includes(drawnArr[i])) {
                const chance = baseLuck * Math.pow(LUCK_DECAY, forcedCount)
                if (Math.random() < chance) {
                    const forced = unmatchedPlayer.shift()!
                    drawnArr[i] = forced
                    forcedValues.add(forced)
                    forcedCount++
                }
            }
        }
        if (forcedCount > 0) {
            drawnArr.sort((a, b) => a - b)
            drawnArr.forEach((n, i) => { if (forcedValues.has(n)) luckyIdx.add(i) })
            const newMatchCount = countMatches(numbers, drawnArr)
            const newPrize = determinePrize(newMatchCount, draw.bonusMatched, ticket.prizes)
            return { draw: { ...draw, drawnNumbers: drawnArr, matchedCount: newMatchCount, prizeTier: newPrize }, luckyIdx }
        }
        return { draw, luckyIdx }
    }

    let drawResult = executeDraw(ticket, numbers, bonus)
    let secondChance = false
    let originalDrawResult: ReturnType<typeof executeDraw> | null = null
    let luckyIdx = new Set<number>()
    let originalLuckyIdx = new Set<number>()

    // Apply rolling luck to Phase 1
    const phase1 = applyRollingLuck(drawResult)
    drawResult = phase1.draw
    luckyIdx = phase1.luckyIdx

    // Second chance (only if Phase 1 still lost after rolling luck)
    if (!drawResult.prizeTier && luckBonus.value > 0 && Math.random() < luckBonus.value) {
        originalDrawResult = drawResult
        originalLuckyIdx = luckyIdx
        drawResult = executeDraw(ticket, numbers, bonus)
        secondChance = true
        // Apply rolling luck to Phase 2 independently
        const phase2 = applyRollingLuck(drawResult)
        drawResult = phase2.draw
        luckyIdx = phase2.luckyIdx
    }

    // Calculate payout
    let payout = 0
    if (drawResult.prizeTier) payout = ticket.ticketCost * drawResult.prizeTier.payoutMultiplier
    const fullResult: LotteryDrawResult = { ...drawResult, payout }

    // Record in stores
    const cost = D(ticket.ticketCost)
    let unlockedAbility: DivineAbilityDef | null = null

    if (fullResult.prizeTier) {
        player.earnCash(D(payout))
        gambling.recordWin('lottery', cost, D(payout))
        gambling.recordLotteryWin(ticket.id, fullResult.prizeTier.label)

        const isJackpot = fullResult.prizeTier.rarity === 'jackpot' || fullResult.prizeTier.rarity === 'mythic'
        if (isJackpot) {
            const achId = LOTTERY_ACHIEVEMENT_MAP[ticket.id]
            if (achId) achievements.unlock(achId, gameEngine.currentTick)
            if (ticket.id === 'divine' && fullResult.prizeTier.label === 'DIVINE JACKPOT') {
                achievements.unlock('lot_divine_jackpot', gameEngine.currentTick)
            }
        }

        if (fullResult.prizeTier.grantsAbility) {
            const abilityId = fullResult.prizeTier.grantsAbility
            const wasNew = gambling.unlockDivineAbility(abilityId)
            if (wasNew) {
                unlockedAbility = getDivineAbility(abilityId) ?? null
                if (ticket.id === 'divine') achievements.unlock('lot_divine', gameEngine.currentTick)
            }
        }

        const allHaveJackpots = ALL_LOTTERY_IDS.every(tid => {
            const ticketDef = LOTTERY_TICKETS.find(t => t.id === tid)
            if (!ticketDef) return false
            const topPrize = ticketDef.prizes[ticketDef.prizes.length - 1]
            return gambling.hasLotteryWin(tid, topPrize.label)
        })
        if (allHaveJackpots) achievements.unlock('lot_master', gameEngine.currentTick)
    } else {
        gambling.recordLoss('lottery', cost)
    }

    // Add to history
    drawHistory.value.unshift({ ticketName: ticket.name, result: fullResult, timestamp: Date.now() })
    if (drawHistory.value.length > 50) drawHistory.value.pop()

    // Build original result for second-chance visual (the losing draw shown first)
    const originalResult: LotteryDrawResult | null = originalDrawResult
        ? { ...originalDrawResult, payout: 0 }
        : null

    return {
        result: fullResult,
        ability: unlockedAbility,
        luckyIndices: luckyIdx,
        luckChances: computeLuckChances(fullResult.drawnNumbers),
        originalLuckyIndices: originalLuckyIdx,
        originalLuckChances: originalDrawResult ? computeLuckChances(originalDrawResult.drawnNumbers) : null,
        secondChance,
        originalResult,
    }
}

/** Generate random numbers for a quick pick */
function generateQuickPick(ticket: LotteryTicketDef): { numbers: number[]; bonus: number | null } {
    const nums = new Set<number>()
    while (nums.size < ticket.pickCount) {
        nums.add(Math.floor(Math.random() * ticket.maxNumber) + 1)
    }
    const bonus = ticket.hasBonus ? Math.floor(Math.random() * ticket.bonusMax) + 1 : null
    return { numbers: Array.from(nums).sort((a, b) => a - b), bonus }
}

/** Single draw with full animation (when multiDraw = 1) */
async function handlePlay(numbers: number[], bonus: number | null): Promise<void> {
    const ticket = selectedTicket.value
    const drawCount = settings.lotteryMultiDraw
    const totalCost = D(ticket.ticketCost * drawCount)

    if (!player.spendCash(totalCost)) return

    isDrawing.value = true
    currentResult.value = null
    multiDrawResults.value = []
    multiDrawSummary.value = null
    luckyTriggered.value = false
    currentLuckyIndices.value = new Set()
    currentLuckChances.value = []
    newlyUnlockedAbility.value = null

    if (drawCount <= 1) {
        // ─── Single draw — LotteryDraw handles all animation phases ─────
        await sleep(200)

        const { result, ability, luckyIndices, luckChances, originalLuckyIndices, originalLuckChances, secondChance, originalResult } =
            executeSingleDrawWithLuck(ticket, numbers, bonus)

        currentLuckChances.value = luckChances
        currentLuckyIndices.value = luckyIndices
        currentOriginalLuckyIndices.value = originalLuckyIndices
        currentSecondChance.value = secondChance
        currentOriginalResult.value = originalResult
        currentOriginalLuckChances.value = originalLuckChances
        currentResult.value = result
        newlyUnlockedAbility.value = ability

        // isDrawing stays true until LotteryDraw emits 'done' (via onSingleDrawDone)
    } else {
        // ─── Multi-draw: execute all draws up-front, animate via LotteryDraw grid ──
        await sleep(100)

        const entries: MultiDrawEntry[] = []
        let wins = 0
        let totalPayout = 0
        const abilities: DivineAbilityDef[] = []

        for (let i = 0; i < drawCount; i++) {
            const nums = i === 0 ? numbers : generateQuickPick(ticket).numbers
            const bn = i === 0 ? bonus : generateQuickPick(ticket).bonus

            const { result, ability, luckyIndices, luckChances, originalLuckyIndices, originalLuckChances, secondChance, originalResult } = executeSingleDrawWithLuck(ticket, nums, bn)
            entries.push({ result, luckyIndices, luckChances, originalLuckyIndices, originalLuckChances, secondChance, originalResult })
            if (result.prizeTier) {
                wins++
                totalPayout += result.payout
            }
            if (ability) abilities.push(ability)
        }

        multiDrawResults.value = entries
        multiDrawFinished.value = 0
        multiDrawSummary.value = {
            total: drawCount,
            wins,
            totalPayout,
            totalCost: ticket.ticketCost * drawCount,
            abilities,
        }

        if (abilities.length > 0) {
            newlyUnlockedAbility.value = abilities[0]
        }

        // isDrawing stays true until all animations finish (handled in onMultiDrawDone)
    }
}

/** Called by each LotteryDraw in the multi-draw grid when its animation finishes */
function onMultiDrawDone(): void {
    multiDrawFinished.value++
    if (multiDrawFinished.value >= multiDrawResults.value.length) {
        isDrawing.value = false
    }
}

/** Called by the single-draw LotteryDraw when its full animation completes */
function onSingleDrawDone(): void {
    isDrawing.value = false
}

function clearResult(): void {
    currentResult.value = null
    multiDrawResults.value = []
    multiDrawFinished.value = 0
    multiDrawSummary.value = null
    newlyUnlockedAbility.value = null
    currentSecondChance.value = false
    currentOriginalResult.value = null
    currentOriginalLuckChances.value = null
    currentOriginalLuckyIndices.value = new Set()
}

function selectTicket(id: string): void {
    if (isDrawing.value) return
    selectedTicketId.value = id
    currentResult.value = null
    multiDrawResults.value = []
    multiDrawFinished.value = 0
    multiDrawSummary.value = null
    currentSecondChance.value = false
    currentOriginalResult.value = null
    currentOriginalLuckChances.value = null
    currentOriginalLuckyIndices.value = new Set()
}

// ─── Dev: Simulate jackpots ─────────────────────────────────
const isDev = import.meta.env.DEV

/**
 * Simulate a winning draw for a specific ticket + prize tier.
 * Fabricates a perfect draw result that triggers the right animation.
 */
function simulateJackpot(ticket: LotteryTicketDef, prizeIndex: number): void {
    if (isDrawing.value) return
    const prize = ticket.prizes[prizeIndex]
    if (!prize) return

    selectedTicketId.value = ticket.id
    currentLuckyIndices.value = new Set()
    currentLuckChances.value = []
    newlyUnlockedAbility.value = null

    // Build fake player numbers: 1..pickCount
    const playerNumbers = Array.from({ length: ticket.pickCount }, (_, i) => i + 1)
    // Build drawn numbers: first `matchCount` match, rest are offset
    const drawnNumbers = Array.from({ length: ticket.pickCount }, (_, i) =>
        i < prize.matchCount ? i + 1 : ticket.maxNumber - i
    ).sort((a, b) => a - b)

    const bonusMatched = prize.bonusRequired
    const bonusNumber = ticket.hasBonus ? (bonusMatched ? 1 : 99) : null
    const playerBonus = ticket.hasBonus ? 1 : null
    const payout = ticket.ticketCost * prize.payoutMultiplier

    const result: LotteryDrawResult = {
        drawnNumbers,
        bonusNumber,
        playerNumbers,
        playerBonus,
        matchedCount: prize.matchCount,
        bonusMatched,
        prizeTier: prize,
        payout,
    }

    currentResult.value = result

    // Track lottery win in store for achievements
    gambling.recordLotteryWin(ticket.id, prize.label)

    // Unlock achievement
    const isJackpot = prize.rarity === 'jackpot' || prize.rarity === 'mythic'
    if (isJackpot) {
        const achId = LOTTERY_ACHIEVEMENT_MAP[ticket.id]
        if (achId) achievements.unlock(achId, gameEngine.currentTick)
        if (ticket.id === 'divine' && prize.label === 'DIVINE JACKPOT') {
            achievements.unlock('lot_divine_jackpot', gameEngine.currentTick)
        }
    }

    // Unlock divine ability
    if (prize.grantsAbility) {
        const wasNew = gambling.unlockDivineAbility(prize.grantsAbility)
        if (wasNew) {
            newlyUnlockedAbility.value = getDivineAbility(prize.grantsAbility) ?? null
            if (ticket.id === 'divine') achievements.unlock('lot_divine', gameEngine.currentTick)
        }
    }

    // Check master achievement
    const allHaveJackpots = ALL_LOTTERY_IDS.every(tid => {
        const t = LOTTERY_TICKETS.find(tk => tk.id === tid)
        if (!t) return false
        return gambling.hasLotteryWin(tid, t.prizes[t.prizes.length - 1].label)
    })
    if (allHaveJackpots) achievements.unlock('lot_master', gameEngine.currentTick)
}
</script>

<template>
    <div class="lottery-game">
        <!-- Header -->
        <div class="lottery-header">
            <button class="back-btn" @click="$emit('back')">
                <AppIcon icon="mdi:arrow-left" /> {{ $t('gambling.back') }}
            </button>
            <h2 class="lottery-title">
                <AppIcon icon="mdi:ticket" class="title-icon" />
                {{ $t('gambling.lt_title') }}
            </h2>
            <div class="header-info">
                <div class="luck-badge" :title="`Luck multiplier: ×${luckMultiplier.toFixed(2)}`">
                    <AppIcon icon="mdi:clover" />
                    <span>×{{ luckMultiplier.toFixed(2) }}</span>
                </div>

                <!-- Draw Speed Selector -->
                <div class="speed-selector">
                    <AppIcon icon="mdi:speedometer" class="speed-icon" />
                    <button v-for="sp in SPEED_OPTIONS" :key="sp" class="speed-btn"
                        :class="{ active: settings.lotteryDrawSpeed === sp }" @click="settings.lotteryDrawSpeed = sp"
                        :disabled="isDrawing">
                        {{ sp }}×
                    </button>
                </div>

                <!-- Multi-Draw Selector -->
                <div class="multi-draw-selector">
                    <AppIcon icon="mdi:layers-triple" class="multi-icon" />
                    <button v-for="n in MULTI_DRAW_OPTIONS" :key="n" class="multi-btn"
                        :class="{ active: settings.lotteryMultiDraw === n }" @click="settings.lotteryMultiDraw = n"
                        :disabled="isDrawing">
                        {{ n }}
                    </button>
                </div>

                <button class="prize-toggle" @click="showDivineGallery = !showDivineGallery"
                    :title="$t('gambling.lt_divine_gallery')">
                    <AppIcon icon="mdi:shimmer" /> {{ showDivineGallery ? $t('gambling.hide') :
                        $t('gambling.lt_divine_gallery') }}
                </button>
                <button class="prize-toggle" @click="showPrizeTable = !showPrizeTable">
                    <AppIcon icon="mdi:table" /> {{ showPrizeTable ? $t('gambling.hide') : $t('gambling.lt_prizes') }}
                </button>
            </div>
        </div>

        <!-- Prize Table (collapsible) -->
        <Transition name="slide">
            <div v-if="showPrizeTable" class="prize-table-panel">
                <h3 class="prize-table-title">{{ $t('gambling.lt_prize_table', { name: selectedTicket.name }) }}</h3>
                <div class="prize-grid">
                    <div v-for="prize in selectedTicket.prizes" :key="prize.label" class="prize-entry"
                        :style="{ '--prize-color': rarityCssVar(prize.rarity) }">
                        <span class="prize-match">{{ prize.matchCount }}/{{ selectedTicket.pickCount }}
                            <template v-if="prize.bonusRequired"> {{ $t('gambling.lt_bonus') }}</template>
                        </span>
                        <span class="prize-label">{{ prize.label }}</span>
                        <span class="prize-rarity">{{ prize.rarity }}</span>
                        <span class="prize-payout">×{{ prize.payoutMultiplier.toLocaleString() }}</span>
                    </div>
                </div>
                <p class="prize-note">{{ $t('gambling.lt_luck_note', { luck: luckMultiplier.toFixed(2) }) }}
                </p>
            </div>
        </Transition>

        <!-- Divine Abilities Gallery (collapsible) — minimal card layout -->
        <Transition name="slide">
            <div v-if="showDivineGallery" class="divine-gallery-panel">
                <div class="divine-gallery-header">
                    <span class="divine-gallery-title">{{ $t('gambling.lt_divine_gallery') }}</span>
                    <span class="divine-gallery-count">{{ gambling.divineAbilities.length }} / {{
                        DIVINE_ABILITIES.length
                    }}</span>
                </div>
                <div class="divine-gallery-grid">
                    <div v-for="ability in DIVINE_ABILITIES" :key="ability.id" class="divine-gallery-card"
                        :class="{ 'divine-locked': !gambling.hasDivineAbility(ability.id) }">
                        <div class="dg-top-row">
                            <AppIcon :icon="gambling.hasDivineAbility(ability.id) ? ability.icon : 'mdi:lock-outline'"
                                class="dg-icon" />
                            <span class="dg-name">{{ gambling.hasDivineAbility(ability.id) ? ability.name : '???'
                            }}</span>
                            <span v-if="gambling.hasDivineAbility(ability.id)" class="dg-value"
                                :style="{ color: rarityCssVar(ability.rarity) }">+{{ Math.round((ability.effect.value -
                                    1) *
                                    100) }}%</span>
                        </div>
                        <span class="dg-desc">{{ gambling.hasDivineAbility(ability.id) ? ability.description :
                            $t('gambling.lt_divine_locked') }}</span>
                        <span class="dg-source">
                            <AppIcon icon="mdi:ticket-outline" class="dg-source-icon" />
                            {{ $t('gambling.lt_divine_source', { tier: ability.source }) }}
                        </span>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Main content area -->
        <div class="lottery-body">
            <!-- Left: Ticket type selector -->
            <div class="ticket-selector">
                <span class="selector-label">{{ $t('gambling.lt_select_ticket') }}</span>
                <div class="ticket-tabs">
                    <button v-for="t in LOTTERY_TICKETS" :key="t.id" class="ticket-tab"
                        :class="{ active: selectedTicketId === t.id }" :style="{ '--tab-accent': t.accent }"
                        @click="selectTicket(t.id)" :disabled="isDrawing">
                        <AppIcon :icon="t.icon" class="tab-icon" />
                        <span class="tab-name">{{ t.name }}</span>
                        <span class="tab-cost">${{ t.ticketCost }}</span>
                    </button>
                </div>
            </div>

            <!-- Center: Number picker / Draw result -->
            <div class="play-area">
                <!-- Single draw result -->
                <template v-if="currentResult && !multiDrawSummary">
                    <LotteryDraw :result="currentResult" :ticket="selectedTicket" :lucky-indices="currentLuckyIndices"
                        :luck-chances="currentLuckChances" :second-chance="currentSecondChance"
                        :original-result="currentOriginalResult" :original-luck-chances="currentOriginalLuckChances"
                        :original-lucky-indices="currentOriginalLuckyIndices" :speed-multiplier="drawSpeed"
                        @done="onSingleDrawDone" />
                    <button class="new-draw-btn" @click="clearResult" :disabled="isDrawing">
                        <AppIcon icon="mdi:refresh" /> {{ $t('gambling.lt_new_draw') }}
                    </button>
                </template>

                <!-- Multi-draw results — animated grid of LotteryDraw components -->
                <template v-else-if="multiDrawSummary">
                    <!-- Summary bar -->
                    <div class="multi-draw-summary">
                        <div class="multi-summary-stats">
                            <div class="multi-stat">
                                <span class="multi-stat-label">{{ $t('gambling.stats_wins') }}</span>
                                <span class="multi-stat-value" :class="multiDrawSummary.wins > 0 ? 'positive' : ''">
                                    {{ multiDrawSummary.wins }} / {{ multiDrawSummary.total }}
                                </span>
                            </div>
                            <div class="multi-stat">
                                <span class="multi-stat-label">{{ $t('gambling.lt_total_cost') }}</span>
                                <span class="multi-stat-value negative">-{{ formatCash(D(multiDrawSummary.totalCost))
                                }}</span>
                            </div>
                            <div class="multi-stat">
                                <span class="multi-stat-label">{{ $t('gambling.lt_total_payout') }}</span>
                                <span class="multi-stat-value positive">+{{ formatCash(D(multiDrawSummary.totalPayout))
                                }}</span>
                            </div>
                            <div class="multi-stat">
                                <span class="multi-stat-label">{{ $t('gambling.stats_net') }}</span>
                                <span class="multi-stat-value"
                                    :class="multiDrawSummary.totalPayout - multiDrawSummary.totalCost >= 0 ? 'positive' : 'negative'">
                                    {{ formatCash(D(multiDrawSummary.totalPayout - multiDrawSummary.totalCost)) }}
                                </span>
                            </div>
                        </div>
                        <div v-if="multiDrawSummary.abilities.length > 0" class="multi-abilities-found">
                            <span class="multi-abilities-label">{{ $t('gambling.lt_abilities_found') }}</span>
                            <div v-for="ab in multiDrawSummary.abilities" :key="ab.id" class="multi-ability-tag"
                                :style="{ color: rarityCssVar(ab.rarity) }">
                                <AppIcon :icon="ab.icon" /> {{ ab.name }}
                            </div>
                        </div>
                    </div>

                    <!-- Animated draws grid -->
                    <div class="multi-draw-grid">
                        <div v-for="(entry, i) in multiDrawResults" :key="i" class="multi-draw-cell">
                            <span class="multi-draw-index">#{{ i + 1 }}</span>
                            <LotteryDraw :result="entry.result" :ticket="selectedTicket"
                                :lucky-indices="entry.luckyIndices" :luck-chances="entry.luckChances"
                                :second-chance="entry.secondChance" :original-result="entry.originalResult"
                                :original-luck-chances="entry.originalLuckChances"
                                :original-lucky-indices="entry.originalLuckyIndices" :speed-multiplier="drawSpeed"
                                @done="onMultiDrawDone" />
                        </div>
                    </div>

                    <button class="new-draw-btn" @click="clearResult" :disabled="isDrawing">
                        <AppIcon icon="mdi:refresh" /> {{ $t('gambling.lt_new_draw') }}
                    </button>
                </template>

                <!-- Number picker (no result showing) -->
                <template v-else>
                    <LotteryTicket :ticket="selectedTicket"
                        :disabled="isDrawing || (settings.lotteryMultiDraw > 1 ? !canAffordMulti : !canAfford)"
                        @play="handlePlay" />
                    <p v-if="settings.lotteryMultiDraw > 1 && !canAffordMulti" class="cant-afford">
                        <AppIcon icon="mdi:alert-circle-outline" /> {{ $t('gambling.lt_cant_afford_multi', {
                            n:
                                settings.lotteryMultiDraw, cost: formatCash(D(selectedTicket.ticketCost *
                                    settings.lotteryMultiDraw))
                        }) }}
                    </p>
                    <p v-else-if="!canAfford" class="cant-afford">
                        <AppIcon icon="mdi:alert-circle-outline" /> {{ $t('gambling.lt_cant_afford') }}
                    </p>
                </template>

                <!-- Lucky indicator -->
                <Transition name="lucky">
                    <div v-if="luckyTriggered" class="lucky-banner">
                        <AppIcon icon="mdi:clover" class="lucky-icon" />
                        <span class="lucky-text">{{ $t('gambling.lucky_trigger') }}</span>
                    </div>
                </Transition>

                <!-- Divine Ability Unlock Banner -->
                <Transition name="lucky">
                    <div v-if="newlyUnlockedAbility" class="divine-ability-banner">
                        <AppIcon :icon="newlyUnlockedAbility.icon" class="divine-ability-icon" />
                        <div class="divine-ability-info">
                            <span class="divine-ability-title">{{ $t('gambling.lt_ability_unlocked') }}</span>
                            <span class="divine-ability-name">{{ newlyUnlockedAbility.name }}</span>
                            <span class="divine-ability-desc">{{ newlyUnlockedAbility.description }}</span>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>

        <!-- Stats & History -->
        <div class="lottery-footer">
            <!-- Stats -->
            <div class="lottery-stats">
                <div class="stat-item">
                    <span class="stat-label">{{ $t('gambling.stats_draws') }}</span>
                    <span class="stat-value">{{ formatNumber(stats.played) }}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">{{ $t('gambling.stats_wins') }}</span>
                    <span class="stat-value">{{ formatNumber(stats.won) }}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">{{ $t('gambling.stats_win_rate') }}</span>
                    <span class="stat-value">{{ stats.played > 0 ? Math.round(stats.won / stats.played * 100) : 0
                        }}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">{{ $t('gambling.stats_net') }}</span>
                    <span class="stat-value" :class="stats.netProfit.gte(0) ? 'positive' : 'negative'">
                        {{ formatCash(stats.netProfit) }}
                    </span>
                </div>
                <div class="stat-item" v-if="sessionTotal > 0">
                    <span class="stat-label">{{ $t('gambling.stats_session') }}</span>
                    <span class="stat-value" :class="sessionProfit.gte(0) ? 'positive' : 'negative'">
                        {{ formatCash(sessionProfit) }} ({{ sessionWins }}/{{ sessionTotal }})
                    </span>
                </div>
            </div>

            <!-- Recent history -->
            <div v-if="drawHistory.length > 0" class="history-section">
                <span class="history-label">{{ $t('gambling.lt_recent') }}</span>
                <div class="history-list">
                    <div v-for="(entry, i) in drawHistory.slice(0, 8)" :key="i" class="history-entry"
                        :class="{ 'history-win': entry.result.prizeTier }">
                        <span class="history-ticket">{{ entry.ticketName }}</span>
                        <span class="history-matches">{{ entry.result.matchedCount }}/{{
                            LOTTERY_TICKETS.find(t => t.name === entry.ticketName)?.pickCount ?? '?'
                            }}</span>
                        <span v-if="entry.result.prizeTier" class="history-prize"
                            :style="{ color: rarityCssVar(entry.result.prizeTier.rarity) }">
                            {{ entry.result.prizeTier.label }} — {{ formatCash(entry.result.payout) }}
                        </span>
                        <span v-else class="history-loss">{{ $t('gambling.lt_no_win') }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dev: Jackpot Simulator -->
        <div v-if="isDev" class="dev-jackpot-panel">
            <div class="dev-panel-header">
                <AppIcon icon="mdi:bug" />
                <span>DEV — Jackpot Simulator</span>
            </div>
            <div v-for="ticket in LOTTERY_TICKETS" :key="ticket.id" class="dev-ticket-group">
                <span class="dev-ticket-name" :style="{ color: ticket.accent }">{{ ticket.name }}</span>
                <div class="dev-btn-row">
                    <button v-for="(prize, pi) in ticket.prizes" :key="pi" class="dev-sim-btn"
                        :class="`dev-rarity-${prize.rarity}`"
                        :title="`${prize.label} — ×${prize.payoutMultiplier.toLocaleString()}`"
                        @click="simulateJackpot(ticket, pi)">
                        {{ prize.label }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.lottery-game {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    width: 100%;
    height: 100%;
    min-height: 0;
}

/* ── Header ── */
.lottery-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--t-space-3);
}

.back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text-secondary);
    cursor: pointer;
    font-size: 0.85rem;
    transition: all var(--t-transition-fast);
}

.back-btn:hover {
    background: var(--t-bg-hover);
    color: var(--t-text);
}

.lottery-title {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: 1.3rem;
    font-weight: 700;
}

.title-icon {
    font-size: 1.5rem;
    color: var(--t-accent);
}

.header-info {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.luck-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: var(--t-space-1) var(--t-space-2);
    background: color-mix(in srgb, var(--t-success) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--t-success) 30%, transparent);
    border-radius: var(--t-radius-sm);
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--t-success);
    font-family: var(--t-font-mono);
}

.prize-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text-secondary);
    cursor: pointer;
    font-size: 0.85rem;
    transition: all var(--t-transition-fast);
}

.prize-toggle:hover {
    background: var(--t-bg-hover);
    color: var(--t-text);
}

/* ── Prize Table ── */
.prize-table-panel {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-4);
}

.prize-table-title {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: var(--t-space-3);
    color: var(--t-text-secondary);
}

.prize-grid {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.prize-entry {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-2);
    border-radius: var(--t-radius-sm);
    border-left: 3px solid var(--prize-color, var(--t-border));
}

.prize-entry:nth-child(odd) {
    background: var(--t-bg-muted);
}

.prize-match {
    font-family: var(--t-font-mono);
    font-size: 0.8rem;
    min-width: 70px;
    color: var(--t-text-secondary);
}

.prize-label {
    flex: 1;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--t-text);
}

.prize-rarity {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--prize-color, var(--t-text-muted));
}

.prize-payout {
    font-family: var(--t-font-mono);
    font-weight: 800;
    font-size: 0.95rem;
    color: var(--prize-color, var(--t-accent));
    min-width: 80px;
    text-align: right;
}

.prize-note {
    margin-top: var(--t-space-2);
    font-size: 0.75rem;
    color: var(--t-text-muted);
    font-style: italic;
}

/* ── Body layout ── */
.lottery-body {
    display: flex;
    gap: var(--t-space-4);
    flex: 1;
    min-height: 0;
}

/* ── Ticket selector ── */
.ticket-selector {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    width: 180px;
    flex-shrink: 0;
}

.selector-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: var(--t-text-muted);
}

.ticket-tabs {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.ticket-tab {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    cursor: pointer;
    transition: all var(--t-transition-fast);
    text-align: left;
}

.ticket-tab:hover:not(:disabled) {
    border-color: var(--tab-accent, var(--t-border-hover));
}

.ticket-tab.active {
    border-color: var(--tab-accent, var(--t-accent));
    background: color-mix(in srgb, var(--tab-accent, var(--t-accent)) 6%, transparent);
}

.ticket-tab:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tab-icon {
    font-size: 1.2rem;
    color: var(--tab-accent, var(--t-text-secondary));
}

.tab-name {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--t-text);
}

.tab-cost {
    font-size: 0.75rem;
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
}

/* ── Play area ── */
.play-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    min-width: 0;
}

.cant-afford {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--t-font-size-sm);
    color: var(--t-danger);
}

.new-draw-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text-secondary);
    cursor: pointer;
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    transition: all var(--t-transition-fast);
}

.new-draw-btn:hover:not(:disabled) {
    background: var(--t-bg-hover);
    color: var(--t-text);
}

.new-draw-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* ── Footer: Stats & History ── */
.lottery-footer {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.lottery-stats {
    display: flex;
    gap: var(--t-space-4);
    justify-content: space-evenly;
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    flex-wrap: wrap;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--t-text-muted);
}

.stat-value {
    font-family: var(--t-font-mono);
    font-weight: 700;
    font-size: 1rem;
}

.positive {
    color: var(--t-success);
}

.negative {
    color: var(--t-danger);
}

/* ── History ── */
.history-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.history-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: var(--t-text-muted);
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.history-entry {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    font-size: 0.8rem;
}

.history-entry.history-win {
    border-left: 3px solid var(--t-success);
}

.history-ticket {
    font-weight: 600;
    color: var(--t-text-secondary);
    min-width: 100px;
}

.history-matches {
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
    min-width: 30px;
}

.history-prize {
    font-weight: 700;
    font-family: var(--t-font-mono);
}

.history-loss {
    color: var(--t-text-muted);
    font-style: italic;
}

/* ── Transitions ── */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
    max-height: 600px;
    opacity: 1;
}

/* ── Lucky banner ── */
.lucky-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-5);
    border-radius: var(--t-radius-lg);
    background: linear-gradient(135deg, color-mix(in srgb, var(--t-success) 15%, transparent), color-mix(in srgb, var(--t-success) 5%, transparent));
    border: 1px solid color-mix(in srgb, var(--t-success) 40%, transparent);
    box-shadow: 0 0 24px color-mix(in srgb, var(--t-success) 25%, transparent);
    animation: luckyPulse 0.8s ease infinite alternate;
}

.lucky-icon {
    font-size: 2rem;
    color: var(--t-success);
    animation: luckyCloverSpin 1s ease;
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--t-success) 50%, transparent));
}

.lucky-text {
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--t-success);
    letter-spacing: 0.05em;
    text-shadow: 0 0 8px color-mix(in srgb, var(--t-success) 30%, transparent);
}

@keyframes luckyPulse {
    from {
        box-shadow: 0 0 16px color-mix(in srgb, var(--t-success) 20%, transparent);
    }

    to {
        box-shadow: 0 0 32px color-mix(in srgb, var(--t-success) 40%, transparent);
    }
}

@keyframes luckyCloverSpin {
    0% {
        transform: scale(0) rotate(-180deg);
        opacity: 0;
    }

    50% {
        transform: scale(1.3) rotate(10deg);
        opacity: 1;
    }

    100% {
        transform: scale(1) rotate(0deg);
    }
}

.lucky-enter-active {
    animation: luckyIn 0.5s ease;
}

.lucky-leave-active {
    animation: luckyOut 0.3s ease;
}

@keyframes luckyIn {
    0% {
        transform: scale(0.5) translateY(-10px);
        opacity: 0;
    }

    60% {
        transform: scale(1.1) translateY(0);
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes luckyOut {
    to {
        transform: scale(0.8) translateY(10px);
        opacity: 0;
    }
}

/* ── Dev Jackpot Simulator ── */
.dev-jackpot-panel {
    border: 2px dashed color-mix(in srgb, var(--t-danger) 40%, transparent);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-3);
    background: color-mix(in srgb, var(--t-danger) 3%, transparent);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.dev-panel-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--t-danger);
}

.dev-ticket-group {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.dev-ticket-name {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.dev-btn-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.dev-sim-btn {
    padding: 3px 8px;
    font-size: 0.6rem;
    font-weight: 700;
    border-radius: var(--t-radius-sm);
    border: 1px solid var(--t-border);
    background: var(--t-bg-muted);
    color: var(--t-text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
}

.dev-sim-btn:hover {
    background: var(--t-bg-hover);
    transform: scale(1.05);
}

.dev-rarity-common {
    border-color: var(--t-rarity-common);
    color: var(--t-rarity-common);
}

.dev-rarity-uncommon {
    border-color: var(--t-rarity-uncommon);
    color: var(--t-rarity-uncommon);
}

.dev-rarity-rare {
    border-color: var(--t-rarity-rare);
    color: var(--t-rarity-rare);
}

.dev-rarity-epic {
    border-color: var(--t-rarity-epic);
    color: var(--t-rarity-epic);
}

.dev-rarity-legendary {
    border-color: var(--t-rarity-legendary);
    color: var(--t-rarity-legendary);
}

.dev-rarity-jackpot {
    border-color: var(--t-rarity-jackpot);
    color: var(--t-rarity-jackpot);
    font-weight: 800;
}

.dev-rarity-mythic {
    border-color: var(--t-rarity-mythic);
    color: var(--t-rarity-mythic);
    font-weight: 800;
}

/* ── Divine Ability Unlock Banner ── */
.divine-ability-banner {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-4) var(--t-space-5);
    border-radius: var(--t-radius-lg);
    background: linear-gradient(135deg, color-mix(in srgb, var(--t-gold) 15%, transparent), color-mix(in srgb, var(--t-purple) 10%, transparent));
    border: 1px solid color-mix(in srgb, var(--t-gold) 50%, transparent);
    box-shadow: 0 0 32px color-mix(in srgb, var(--t-gold) 30%, transparent);
    animation: divinePulse 1s ease infinite alternate;
}

.divine-ability-icon {
    font-size: 2.5rem;
    color: var(--t-gold);
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--t-gold) 60%, transparent));
    animation: divineIconSpin 1.2s ease;
}

.divine-ability-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.divine-ability-title {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 800;
    color: var(--t-gold);
}

.divine-ability-name {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--t-gold);
    text-shadow: 0 0 8px color-mix(in srgb, var(--t-gold) 40%, transparent);
}

.divine-ability-desc {
    font-size: 0.8rem;
    color: var(--t-text-secondary);
}

@keyframes divinePulse {
    from {
        box-shadow: 0 0 16px color-mix(in srgb, var(--t-gold) 20%, transparent);
    }

    to {
        box-shadow: 0 0 40px color-mix(in srgb, var(--t-gold) 50%, transparent);
    }
}

@keyframes divineIconSpin {
    0% {
        transform: scale(0) rotate(-360deg);
        opacity: 0;
    }

    50% {
        transform: scale(1.4) rotate(15deg);
        opacity: 1;
    }

    100% {
        transform: scale(1) rotate(0deg);
    }
}

/* ── Speed & Multi-Draw Selectors ── */
.speed-selector,
.multi-draw-selector {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
}

.speed-icon,
.multi-icon {
    font-size: 0.85rem;
    color: var(--t-text-muted);
    padding: 0px;
    margin: 2px;
}

.speed-btn,
.multi-btn {
    padding: 3px 8px;
    font-size: 0.7rem;
    font-weight: 700;
    font-family: var(--t-font-mono);
    border: none;
    border-radius: var(--t-radius-sm);
    background: transparent;
    color: var(--t-text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
}

.speed-btn:hover:not(:disabled),
.multi-btn:hover:not(:disabled) {
    background: var(--t-bg-hover);
    color: var(--t-text);
}

.speed-btn.active,
.multi-btn.active {
    background: var(--t-accent);
    color: var(--t-text);
}

.speed-btn:disabled,
.multi-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* ── Divine Abilities Gallery (minimal) ── */
.divine-gallery-panel {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-4);
}

.divine-gallery-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--t-space-3);
}

.divine-gallery-title {
    font-size: var(--t-font-size-lg);
    font-weight: 700;
    color: var(--t-text);
}

.divine-gallery-count {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
}

.divine-gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--t-space-2);
}

.divine-gallery-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    transition: border-color var(--t-transition-normal);
}

.divine-gallery-card:hover {
    border-color: var(--t-border-hover);
}

.divine-gallery-card.divine-locked {
    opacity: 0.45;
}

.dg-top-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.dg-icon {
    font-size: 1.1rem;
    color: var(--t-text-secondary);
    flex-shrink: 0;
}

.divine-locked .dg-icon {
    color: var(--t-text-muted);
}

.dg-name {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text);
    flex: 1;
    min-width: 0;
}

.divine-locked .dg-name {
    color: var(--t-text-muted);
}

.dg-value {
    font-family: var(--t-font-mono);
    font-weight: 800;
    font-size: var(--t-font-size-sm);
    flex-shrink: 0;
}

.dg-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    line-height: 1.3;
}

.divine-locked .dg-desc {
    color: var(--t-text-muted);
    font-style: italic;
}

.dg-source {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.dg-source-icon {
    font-size: 0.75rem;
}

/* ── Multi-Draw Summary ── */
.multi-draw-summary {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.multi-summary-stats {
    display: flex;
    gap: var(--t-space-4);
    flex-wrap: wrap;
}

.multi-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.multi-stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--t-text-muted);
}

.multi-stat-value {
    font-family: var(--t-font-mono);
    font-weight: 700;
    font-size: 1rem;
}

.multi-abilities-found {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--t-space-2);
}

.multi-abilities-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--t-text-secondary);
}

.multi-ability-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
}

/* ── Multi-Draw Animated Grid ── */
.multi-draw-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: var(--t-space-3);
    max-height: 60vh;
    overflow-y: auto;
    padding: var(--t-space-1);
}

.multi-draw-cell {
    position: relative;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-2);
    overflow: hidden;
}

.multi-draw-index {
    position: absolute;
    top: var(--t-space-1);
    left: var(--t-space-2);
    font-family: var(--t-font-mono);
    font-weight: 700;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    z-index: 1;
}
</style>
