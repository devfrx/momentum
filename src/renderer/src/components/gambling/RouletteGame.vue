<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import RouletteWheel from './RouletteWheel.vue'
import RouletteBoard from './RouletteBoard.vue'
import type { RouletteBet, RouletteBetType } from './RouletteBoard.vue'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { D, ZERO, mul, add } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'

const emit = defineEmits<{ back: [] }>()
const { t } = useI18n()

const player = usePlayerStore()
const gambling = useGamblingStore()
const { formatCash } = useFormat()

// ─── Roulette constants ──────────────────────────────────────
const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

// Payout multipliers (payout = bet × multiplier, includes the original bet)
const PAYOUT_MAP: Record<RouletteBetType, number> = {
    straight: 36,
    red: 2, black: 2,
    odd: 2, even: 2,
    low: 2, high: 2,
    dozen1: 3, dozen2: 3, dozen3: 3,
    col1: 3, col2: 3, col3: 3,
}

// ─── State ───────────────────────────────────────────────────
const betAmount = ref(10)
const bets = ref<RouletteBet[]>([])
const spinning = ref(false)
const result = ref<number | null>(null)
const showResult = ref(false)
const lastPayout = ref<Decimal | null>(null)
const lastWinBets = ref<RouletteBet[]>([])
/** Luck triggered — shows clover animation between first loss and re-spin */
const luckyTriggered = ref(false)

// ─── Bet management ──────────────────────────────────────────
function onBet(bet: RouletteBet): void {
    if (spinning.value) return

    // Toggle: remove if already placed, add otherwise
    const idx = bets.value.findIndex(
        b => b.type === bet.type && b.number === bet.number
    )
    if (idx !== -1) {
        bets.value.splice(idx, 1)
    } else {
        bets.value.push(bet)
    }
}

function clearBets(): void {
    bets.value = []
}

const totalBetCost = computed(() => mul(D(betAmount.value), bets.value.length))
const canSpin = computed(() =>
    !spinning.value &&
    bets.value.length > 0 &&
    player.cash.gte(totalBetCost.value) &&
    betAmount.value > 0
)

// ─── Spin logic ──────────────────────────────────────────────
function spin(): void {
    if (!canSpin.value) return

    const totalCost = totalBetCost.value
    if (!player.spendCash(totalCost)) return

    spinning.value = true
    showResult.value = false
    lastPayout.value = null
    lastWinBets.value = []
    luckyTriggered.value = false

    // Generate first result after a short delay (so wheel starts first)
    setTimeout(() => {
        const firstNum = Math.floor(Math.random() * 37) // 0-36
        const hasAnyWin = bets.value.some(b => isBetWinner(b, firstNum))

        if (hasAnyWin) {
            // Won on first roll — normal flow
            result.value = firstNum
        } else {
            // Lost — check luck second chance
            const luckBonus = gambling.getLuckBonus()
            const luckyReroll = luckBonus > 0 && Math.random() < luckBonus

            if (luckyReroll) {
                // Show losing spin first, then lucky banner, then re-spin
                result.value = firstNum
                // After wheel finishes (~4200ms), show lucky banner then re-spin
                setTimeout(() => {
                    luckyTriggered.value = true
                    setTimeout(() => {
                        luckyTriggered.value = false
                        // Re-spin with new number
                        spinning.value = true
                        showResult.value = false
                        const secondNum = Math.floor(Math.random() * 37)
                        setTimeout(() => {
                            result.value = secondNum
                        }, 200)
                    }, 1400) // lucky banner duration
                }, 4200) // wait for first wheel animation
                return
            } else {
                result.value = firstNum
            }
        }
    }, 200)
}

// When wheel finishes spinning, evaluate bets
watch(() => spinning.value, () => { })

// Detect when the RouletteWheel finishes its animation
// The wheel animation takes ~4s after result is set
watch(result, (num) => {
    if (num === null) return
    // Don't evaluate if lucky banner is showing (intermediate spin)
    if (luckyTriggered.value) return
    setTimeout(() => {
        // Double-check we're not in a lucky-triggered intermediate state
        if (!luckyTriggered.value) {
            evaluateResult(num)
        }
    }, 4200)
})

function evaluateResult(num: number): void {
    const betPerChip = D(betAmount.value)
    let totalPayout = ZERO
    const winningBets: RouletteBet[] = []

    for (const bet of bets.value) {
        if (isBetWinner(bet, num)) {
            const payout = mul(betPerChip, PAYOUT_MAP[bet.type])
            totalPayout = add(totalPayout, payout)
            winningBets.push(bet)
        }
    }

    if (totalPayout.gt(ZERO)) {
        player.earnCash(totalPayout)
        gambling.recordWin('roulette', totalBetCost.value, totalPayout)
        lastPayout.value = totalPayout
    } else {
        gambling.recordLoss('roulette', totalBetCost.value)
        lastPayout.value = null
    }

    lastWinBets.value = winningBets
    showResult.value = true
    spinning.value = false
}

function isBetWinner(bet: RouletteBet, num: number): boolean {
    switch (bet.type) {
        case 'straight': return bet.number === num
        case 'red': return num > 0 && RED_NUMBERS.has(num)
        case 'black': return num > 0 && !RED_NUMBERS.has(num)
        case 'odd': return num > 0 && num % 2 === 1
        case 'even': return num > 0 && num % 2 === 0
        case 'low': return num >= 1 && num <= 18
        case 'high': return num >= 19 && num <= 36
        case 'dozen1': return num >= 1 && num <= 12
        case 'dozen2': return num >= 13 && num <= 24
        case 'dozen3': return num >= 25 && num <= 36
        case 'col1': return num > 0 && num % 3 === 1
        case 'col2': return num > 0 && num % 3 === 2
        case 'col3': return num > 0 && num % 3 === 0
        default: return false
    }
}

function newRound(): void {
    result.value = null
    showResult.value = false
    lastPayout.value = null
    lastWinBets.value = []
}

// ─── Bet helpers ─────────────────────────────────────────────
function setBet(amount: number): void {
    betAmount.value = Math.max(1, Math.min(amount, player.cash.toNumber()))
}

function halfBet(): void { setBet(Math.max(1, Math.floor(betAmount.value / 2))) }
function doubleBet(): void { setBet(betAmount.value * 2) }
function maxBet(): void { setBet(player.cash.toNumber()) }

// ─── Computed ────────────────────────────────────────────────
const stats = computed(() => gambling.getStats('roulette'))

function getResultColor(num: number): string {
    if (num === 0) return 'green'
    return RED_NUMBERS.has(num) ? 'red' : 'black'
}

// ─── Info Panel data ─────────────────────────────────────────
const rouletteInfo = computed<InfoSection[]>(() => [
    {
        title: t('gambling.info.roulette.how_title'),
        icon: 'mdi:help-circle-outline',
        entries: [
            { term: t('gambling.info.roulette.european'), desc: t('gambling.info.roulette.european_desc'), icon: 'mdi:record-circle' },
            { term: t('gambling.info.roulette.placing_bets'), desc: t('gambling.info.roulette.placing_bets_desc'), icon: 'mdi:cursor-default-click' },
            { term: t('gambling.info.roulette.spin'), desc: t('gambling.info.roulette.spin_desc'), icon: 'mdi:rotate-right' },
        ]
    },
    {
        title: t('gambling.info.roulette.inside_title'),
        icon: 'mdi:grid',
        entries: [
            { term: t('gambling.info.roulette.straight'), desc: t('gambling.info.roulette.straight_desc'), icon: 'mdi:numeric' },
        ]
    },
    {
        title: t('gambling.info.roulette.outside_title'),
        icon: 'mdi:table-large',
        entries: [
            { term: t('gambling.info.roulette.red_black'), desc: t('gambling.info.roulette.red_black_desc'), icon: 'mdi:circle' },
            { term: t('gambling.info.roulette.even_odd'), desc: t('gambling.info.roulette.even_odd_desc'), icon: 'mdi:numeric-2-box-outline' },
            { term: t('gambling.info.roulette.high_low'), desc: t('gambling.info.roulette.high_low_desc'), icon: 'mdi:arrow-split-vertical' },
            { term: t('gambling.info.roulette.dozen'), desc: t('gambling.info.roulette.dozen_desc'), icon: 'mdi:numeric-12-box-outline' },
            { term: t('gambling.info.roulette.column'), desc: t('gambling.info.roulette.column_desc'), icon: 'mdi:view-column' },
        ]
    },
    {
        title: t('gambling.info.roulette.payout_title'),
        icon: 'mdi:cash-multiple',
        entries: [
            { term: t('gambling.info.roulette.pay_straight'), desc: t('gambling.info.roulette.pay_straight_desc'), icon: 'mdi:star-four-points' },
            { term: t('gambling.info.roulette.pay_outside'), desc: t('gambling.info.roulette.pay_outside_desc'), icon: 'mdi:circle-half-full' },
            { term: t('gambling.info.roulette.pay_dozen'), desc: t('gambling.info.roulette.pay_dozen_desc'), icon: 'mdi:view-grid' },
        ]
    },
])
</script>

<template>
    <div class="roulette-game">
        <!-- Header -->
        <div class="roulette-header">
            <button class="back-btn" @click="$emit('back')">
                <AppIcon icon="mdi:arrow-left" /> {{ $t('gambling.back') }}
            </button>
            <h2 class="roulette-title">
                <AppIcon icon="mdi:record-circle" class="title-icon" />
                {{ $t('gambling.rl_title') }}
            </h2>
            <div class="balance-chip">
                <AppIcon icon="mdi:cash" />
                {{ formatCash(player.cash) }}
            </div>
        </div>

        <!-- Main layout: wheel + board side by side -->
        <div class="roulette-body">
            <!-- Left: Wheel -->
            <div class="wheel-section">
                <RouletteWheel :result="result" :spinning="spinning" />

                <!-- Active bets summary -->
                <div class="bets-summary" v-if="bets.length > 0">
                    <div class="bets-chips">
                        <span v-for="(bet, i) in bets" :key="i" class="bet-chip">
                            {{ bet.label }}
                        </span>
                    </div>
                    <div class="bets-total">
                        {{ bets.length }} bet{{ bets.length > 1 ? 's' : '' }} ×
                        {{ formatCash(D(betAmount)) }} =
                        <strong>{{ formatCash(totalBetCost) }}</strong>
                    </div>
                </div>
            </div>

            <!-- Right: Board + controls -->
            <div class="board-section">
                <RouletteBoard :active-bets="bets" :disabled="spinning" @bet="onBet" />

                <!-- Bet controls -->
                <div class="controls-row">
                    <div class="bet-section">
                        <label class="bet-label">{{ $t('gambling.bet_per_chip') }}</label>
                        <div class="bet-row">
                            <button class="bet-adj" @click="halfBet">1/2</button>
                            <div class="bet-display">
                                <input type="number" v-model.number="betAmount" :min="1" :max="player.cash.toNumber()"
                                    class="bet-input" :disabled="spinning" />
                            </div>
                            <button class="bet-adj" @click="doubleBet">x2</button>
                        </div>
                        <div class="bet-presets">
                            <button v-for="pct in [10, 25, 50]" :key="pct" class="preset-btn"
                                @click="setBet(Math.floor(player.cash.toNumber() * pct / 100))" :disabled="spinning">
                                {{ pct }}%
                            </button>
                            <button class="preset-btn preset-max" @click="maxBet" :disabled="spinning">{{
                                $t('gambling.max') }}</button>
                        </div>
                    </div>

                    <div class="action-col">
                        <button class="spin-btn" :disabled="!canSpin" @click="spin">
                            <AppIcon :icon="spinning ? 'mdi:loading' : 'mdi:rotate-right'"
                                :class="{ 'spin-icon': spinning }" />
                            {{ spinning ? $t('gambling.rl_spinning') : $t('gambling.rl_spin') }}
                        </button>
                        <div class="action-row">
                            <button class="clear-btn" :disabled="spinning || bets.length === 0" @click="clearBets">
                                <AppIcon icon="mdi:close" /> {{ $t('gambling.rl_clear') }}
                            </button>
                            <button v-if="showResult" class="new-round-btn" @click="newRound">
                                <AppIcon icon="mdi:refresh" /> {{ $t('gambling.new_round') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Result Banner -->
        <Transition name="fade">
            <div v-if="showResult" class="result-area">
                <div v-if="lastPayout" class="win-banner">
                    <AppIcon icon="mdi:trophy" class="win-icon" />
                    <div class="win-info">
                        <span class="win-num" :class="`num-${getResultColor(result!)}`">{{ result }}</span>
                        <span class="win-desc">
                            {{ $t('gambling.rl_bets_won', { n: lastWinBets.length }) }}
                            ({{lastWinBets.map(b => b.label).join(', ')}})
                        </span>
                        <span class="win-amount">{{ formatCash(lastPayout) }}</span>
                    </div>
                </div>
                <div v-else class="lose-banner">
                    <span class="lose-num" :class="`num-${getResultColor(result!)}`">{{ result }}</span>
                    <span>{{ $t('gambling.rl_no_winning') }}</span>
                </div>
            </div>
        </Transition>

        <!-- Lucky second chance banner -->
        <Transition name="lucky">
            <div v-if="luckyTriggered" class="lucky-banner">
                <AppIcon icon="mdi:clover" class="lucky-icon" />
                <span class="lucky-text">{{ $t('gambling.lucky_trigger') }}</span>
            </div>
        </Transition>

        <!-- Info Panel -->
        <InfoPanel :title="$t('gambling.rl_odds')" :sections="rouletteInfo" />

        <!-- Stats -->
        <div class="roulette-stats">
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_spins') }}</span>
                <span class="stat-value">{{ stats.played }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_wins') }}</span>
                <span class="stat-value">{{ stats.won }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_win_rate') }}</span>
                <span class="stat-value">
                    {{ stats.played > 0 ? Math.round(stats.won / stats.played * 100) : 0 }}%
                </span>
            </div>
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_net') }}</span>
                <span class="stat-value" :class="stats.netProfit.gte(0) ? 'success' : 'danger'">
                    {{ formatCash(stats.netProfit) }}
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.roulette-game {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    width: 100%;
    height: 100%;
    min-height: 0;
}

/* ── Header ── */
.roulette-header {
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

.roulette-title {
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

.balance-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-success);
    font-family: var(--font-mono, monospace);
    font-weight: 700;
    font-size: 0.85rem;
}

/* ── Body (wheel + board) ── */
.roulette-body {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: var(--t-space-4);
    align-items: flex-start;
}

.wheel-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-4);
    min-width: 280px;
}

.board-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    min-width: 0;
}

/* ── Bets summary ── */
.bets-summary {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    width: 100%;
}

.bets-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
}

.bet-chip {
    padding: 2px var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--t-text-secondary);
}

.bets-total {
    font-size: 0.8rem;
    color: var(--t-text-muted);
}

.bets-total strong {
    color: var(--t-accent);
}

/* ── Controls ── */
.controls-row {
    display: flex;
    gap: var(--t-space-3);
    align-items: center;
}

.bet-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-3);
    box-shadow: var(--t-shadow-sm);
}

.bet-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    color: var(--t-text-muted);
}

.bet-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.bet-adj {
    width: 36px;
    height: 36px;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    color: var(--t-text);
    cursor: pointer;
    font-weight: 700;
    font-size: 0.9rem;
    transition: all var(--t-transition-fast);
}

.bet-adj:hover {
    background: var(--t-bg-hover);
}

.bet-display {
    flex: 1;
}

.bet-input {
    width: 100%;
    text-align: center;
    font-size: 1rem;
    font-family: var(--font-mono, monospace);
    font-weight: 700;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text);
    outline: none;
}

.bet-presets {
    display: flex;
    gap: 4px;
}

.preset-btn {
    flex: 1;
    padding: var(--t-space-1) var(--t-space-2);
    font-size: 0.7rem;
    font-weight: 600;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    color: var(--t-text-secondary);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.preset-btn:hover:not(:disabled) {
    background: var(--t-bg-hover);
}

.preset-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.preset-max {
    color: var(--t-accent);
    font-weight: 700;
}

/* ── Action buttons ── */
.action-col {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    min-width: 130px;
}

.spin-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-accent);
    color: var(--t-text);
    border: none;
    border-radius: var(--t-radius-md);
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.spin-btn:hover:not(:disabled) {
    filter: brightness(1.1);
}

.spin-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.spin-icon {
    animation: spinAnim 1s linear infinite;
}

@keyframes spinAnim {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.action-row {
    display: flex;
    gap: var(--t-space-2);
}

.clear-btn,
.new-round-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text-secondary);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    transition: all var(--t-transition-fast);
}

.clear-btn:hover:not(:disabled),
.new-round-btn:hover {
    background: var(--t-bg-hover);
}

.clear-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.new-round-btn {
    color: var(--t-accent);
}

/* ── Result ── */
.result-area {
    min-height: 56px;
}

.win-banner {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-success-muted);
    border: 1px solid var(--t-success);
    border-radius: var(--t-radius-lg);
    animation: bannerPop 0.3s ease;
}

.win-icon {
    font-size: 2rem;
    color: var(--t-success);
}

.win-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.win-num,
.lose-num {
    font-size: 1.2rem;
    font-weight: 800;
    font-family: var(--font-mono, monospace);
}

.num-red {
    color: var(--t-gamble-roulette-red);
}

.num-black {
    color: var(--t-text);
}

.num-green {
    color: var(--t-gamble-roulette-green);
}

.win-desc {
    font-size: 0.85rem;
    color: var(--t-text-secondary);
}

.win-amount {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--t-success);
    font-family: var(--font-mono, monospace);
}

.lose-banner {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    color: var(--t-text-muted);
    font-size: 0.9rem;
}

@keyframes bannerPop {
    0% {
        transform: scale(0.95);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ── Stats ── */
.roulette-stats {
    display: flex;
    gap: var(--t-space-4);
    justify-content: space-evenly;
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    box-shadow: var(--t-shadow-sm);
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
    font-family: var(--font-mono, monospace);
    font-weight: 700;
    font-size: 1rem;
}

.success {
    color: var(--t-success);
}

.danger {
    color: var(--t-danger);
}

/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
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
</style>
