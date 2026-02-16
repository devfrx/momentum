<script setup lang="ts">
/**
 * DiceGame — Roll-over / Roll-under dice game with two 3D dice.
 *
 * Mechanic:
 *  - Two dice are rolled (sum 2-12)
 *  - Player picks a target number (3-11) and bets OVER or UNDER
 *  - Payout multiplier scales with difficulty (fewer winning outcomes = higher payout)
 *  - Rolling exactly the target = loss (house edge)
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import DiceFace from './DiceFace.vue'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { D, ZERO, mul } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'

const emit = defineEmits<{ back: [] }>()
const { t } = useI18n()

const player = usePlayerStore()
const gambling = useGamblingStore()
const { formatCash } = useFormat()

// ─── Dice probability table ─────────────────────────────────
// Total ways to roll each sum with 2d6 (total combinations = 36)
const WAYS: Record<number, number> = {
    2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6,
    8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
}

function waysOver(target: number): number {
    let count = 0
    for (let i = target + 1; i <= 12; i++) count += WAYS[i]
    return count
}

function waysUnder(target: number): number {
    let count = 0
    for (let i = 2; i < target; i++) count += WAYS[i]
    return count
}

/** Multiplier = 36 / winning_ways × 0.97 (3% house edge) */
function calcMultiplier(ways: number): number {
    if (ways <= 0) return 0
    return Math.round((36 / ways) * 0.97 * 100) / 100
}

// ─── State ───────────────────────────────────────────────────
type Direction = 'over' | 'under'

const betAmount = ref(10)
const target = ref(7)
const direction = ref<Direction>('over')

const rolling = ref(false)
const die1 = ref<number | null>(null)
const die2 = ref<number | null>(null)
const showResult = ref(false)
const won = ref(false)
const lastPayout = ref<Decimal | null>(null)
/** Luck triggered — shows clover animation between first loss and re-roll */
const luckyTriggered = ref(false)

// ─── Computed ────────────────────────────────────────────────
const winWays = computed(() =>
    direction.value === 'over' ? waysOver(target.value) : waysUnder(target.value)
)
const winChance = computed(() => Math.round((winWays.value / 36) * 1000) / 10)
const multiplier = computed(() => calcMultiplier(winWays.value))
const rollSum = computed(() => (die1.value !== null && die2.value !== null) ? die1.value + die2.value : null)

const betDecimal = computed(() => D(betAmount.value))
const canRoll = computed(() =>
    !rolling.value &&
    betAmount.value > 0 &&
    player.cash.gte(betDecimal.value) &&
    winWays.value > 0
)

const stats = computed(() => gambling.getStats('dice'))

const potentialPayout = computed(() => {
    if (multiplier.value <= 0) return ZERO
    return mul(betDecimal.value, multiplier.value)
})

// ─── Roll logic ──────────────────────────────────────────────
function roll(): void {
    if (!canRoll.value) return
    if (!player.spendCash(betDecimal.value)) return

    rolling.value = true
    showResult.value = false
    die1.value = null
    die2.value = null
    won.value = false
    lastPayout.value = null
    luckyTriggered.value = false

    // Determine base result
    const r1 = Math.floor(Math.random() * 6) + 1
    const r2 = Math.floor(Math.random() * 6) + 1
    const sum = r1 + r2
    const isWin = direction.value === 'over' ? sum > target.value : sum < target.value

    if (isWin) {
        // Won on first roll — normal animation
        playRoll(r1, r2, true)
    } else {
        // Lost — check luck second chance
        const luckBonus = gambling.getLuckBonus()
        const luckyReroll = luckBonus > 0 && Math.random() < luckBonus

        if (luckyReroll) {
            // Show losing dice first, then lucky banner, then re-roll
            playRoll(r1, r2, false, () => {
                luckyTriggered.value = true
                setTimeout(() => {
                    luckyTriggered.value = false
                    // Generate second roll
                    const nr1 = Math.floor(Math.random() * 6) + 1
                    const nr2 = Math.floor(Math.random() * 6) + 1
                    die1.value = null
                    die2.value = null
                    rolling.value = true
                    playRoll(nr1, nr2, true)
                }, 1400) // lucky banner duration
            })
        } else {
            // Normal loss
            playRoll(r1, r2, true)
        }
    }
}

/** Animate a roll to a specific outcome. If `isFinal`, evaluate win/loss at the end. */
function playRoll(r1: number, r2: number, isFinal: boolean, onLand?: () => void): void {
    // Show dice faces after short delay
    setTimeout(() => {
        die1.value = r1
        die2.value = r2
    }, 100)

    setTimeout(() => {
        if (isFinal) {
            const sum = r1 + r2
            const isWin = direction.value === 'over' ? sum > target.value : sum < target.value
            if (isWin) {
                const pay = mul(betDecimal.value, multiplier.value)
                player.earnCash(pay)
                gambling.recordWin('dice', betDecimal.value, pay)
                lastPayout.value = pay
                won.value = true
            } else {
                gambling.recordLoss('dice', betDecimal.value)
                won.value = false
            }

            showResult.value = true
            rolling.value = false
        } else {
            rolling.value = false
            if (onLand) onLand()
        }
    }, 1600)
}

function newRound(): void {
    showResult.value = false
    die1.value = null
    die2.value = null
    lastPayout.value = null
}

// ─── Bet helpers ─────────────────────────────────────────────
function setBet(amount: number): void {
    betAmount.value = Math.max(1, Math.min(amount, player.cash.toNumber()))
}
function halfBet(): void { setBet(Math.max(1, Math.floor(betAmount.value / 2))) }
function doubleBet(): void { setBet(betAmount.value * 2) }
function maxBet(): void { setBet(player.cash.toNumber()) }

// ─── Info Panel ──────────────────────────────────────────────
const diceInfo = computed<InfoSection[]>(() => [
    {
        title: t('gambling.info.dice.how_title'),
        icon: 'mdi:help-circle-outline',
        entries: [
            { term: t('gambling.info.dice.two_dice'), desc: t('gambling.info.dice.two_dice_desc'), icon: 'mdi:dice-multiple' },
            { term: t('gambling.info.dice.pick_target'), desc: t('gambling.info.dice.pick_target_desc'), icon: 'mdi:bullseye' },
            { term: t('gambling.info.dice.over_under'), desc: t('gambling.info.dice.over_under_desc'), icon: 'mdi:arrow-split-horizontal' },
        ]
    },
    {
        title: t('gambling.info.dice.odds_title'),
        icon: 'mdi:cash-multiple',
        entries: [
            { term: t('gambling.info.dice.dynamic'), desc: t('gambling.info.dice.dynamic_desc'), icon: 'mdi:trending-up' },
            { term: t('gambling.info.dice.house_edge'), desc: t('gambling.info.dice.house_edge_desc'), icon: 'mdi:bank' },
            { term: t('gambling.info.dice.example_over7'), desc: t('gambling.info.dice.example_over7_desc'), icon: 'mdi:calculator' },
            { term: t('gambling.info.dice.example_under4'), desc: t('gambling.info.dice.example_under4_desc'), icon: 'mdi:fire' },
        ]
    },
])
</script>

<template>
    <div class="dice-game">
        <!-- Header -->
        <div class="dice-header">
            <button class="back-btn" @click="$emit('back')">
                <AppIcon icon="mdi:arrow-left" /> {{ $t('gambling.back') }}
            </button>
            <h2 class="dice-title">
                <AppIcon icon="mdi:dice-6" class="title-icon" />
                {{ $t('gambling.dc_title') }}
            </h2>
            <div class="balance-chip">
                <AppIcon icon="mdi:cash" />
                {{ formatCash(player.cash) }}
            </div>
        </div>

        <!-- Dice area -->
        <div class="dice-area">
            <div class="dice-pair">
                <DiceFace :value="die1" :rolling="rolling" />
                <DiceFace :value="die2" :rolling="rolling" />
            </div>

            <!-- Roll sum display -->
            <Transition name="pop">
                <div v-if="rollSum !== null && !rolling" class="sum-badge" :class="{ won, lost: showResult && !won }">
                    <span class="sum-value">{{ rollSum }}</span>
                    <span class="sum-label">
                        {{ won ? $t('gambling.dc_win') : showResult ? $t('gambling.dc_lose') : '' }}
                    </span>
                </div>
            </Transition>
        </div>

        <!-- Target selector -->
        <div class="target-section">
            <div class="target-header">
                <span class="target-label-text">{{ $t('gambling.dc_target') }}</span>
                <span class="target-number">{{ target }}</span>
            </div>

            <input type="range" v-model.number="target" :min="3" :max="11" :step="1" class="target-slider"
                :disabled="rolling" />

            <div class="target-scale">
                <span v-for="n in 9" :key="n" class="scale-mark" :class="{ active: n + 2 === target }">
                    {{ n + 2 }}
                </span>
            </div>
        </div>

        <!-- Direction selector + stats -->
        <div class="direction-row">
            <button class="dir-btn dir-under" :class="{ active: direction === 'under' }" :disabled="rolling"
                @click="direction = 'under'">
                <AppIcon icon="mdi:arrow-down-bold" />
                <span class="dir-label">{{ $t('gambling.dc_under', { n: target }) }}</span>
                <span class="dir-detail">{{ waysUnder(target) }}/36 · {{ direction === 'under' ? winChance :
                    Math.round(waysUnder(target) / 36 * 1000) / 10 }}%</span>
            </button>

            <div class="payout-display">
                <span class="payout-label">{{ $t('gambling.dc_multiplier') }}</span>
                <span class="payout-value">{{ multiplier }}×</span>
                <span class="payout-sub">{{ $t('gambling.dc_win_chance', { pct: winChance }) }}</span>
                <span class="payout-sub">{{ $t('gambling.dc_potential', { amount: formatCash(potentialPayout) })
                    }}</span>
            </div>

            <button class="dir-btn dir-over" :class="{ active: direction === 'over' }" :disabled="rolling"
                @click="direction = 'over'">
                <AppIcon icon="mdi:arrow-up-bold" />
                <span class="dir-label">{{ $t('gambling.dc_over', { n: target }) }}</span>
                <span class="dir-detail">{{ waysOver(target) }}/36 · {{ direction === 'over' ? winChance :
                    Math.round(waysOver(target) / 36 * 1000) / 10 }}%</span>
            </button>
        </div>

        <!-- Result banner -->
        <Transition name="pop">
            <div v-if="showResult" class="result-banner" :class="won ? 'banner-win' : 'banner-lose'">
                <AppIcon :icon="won ? 'mdi:trophy' : 'mdi:emoticon-sad'" class="banner-icon" />
                <div class="banner-info">
                    <span class="banner-text">
                        {{ $t('gambling.dc_rolled', { sum: rollSum }) }}
                        {{ won ? $t('gambling.dc_you_win') : $t('gambling.dc_needed', {
                            dir: direction === 'over' ? '>'
                                : '<', target
                        }) }} </span>
                            <span v-if="won && lastPayout" class="banner-amount">{{ formatCash(lastPayout) }}</span>
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

        <!-- Controls -->
        <div class="controls-row">
            <div class="bet-section">
                <label class="bet-label">{{ $t('gambling.bet_amount') }}</label>
                <div class="bet-row">
                    <button class="bet-adj" @click="halfBet" :disabled="rolling">1/2</button>
                    <div class="bet-display">
                        <input type="number" v-model.number="betAmount" :min="1" :max="player.cash.toNumber()"
                            class="bet-input" :disabled="rolling" />
                    </div>
                    <button class="bet-adj" @click="doubleBet" :disabled="rolling">x2</button>
                </div>
                <div class="bet-presets">
                    <button v-for="pct in [10, 25, 50]" :key="pct" class="preset-btn"
                        @click="setBet(Math.floor(player.cash.toNumber() * pct / 100))" :disabled="rolling">
                        {{ pct }}%
                    </button>
                    <button class="preset-btn preset-max" @click="maxBet" :disabled="rolling">{{ $t('gambling.max')
                        }}</button>
                </div>
            </div>

            <div class="action-col">
                <button class="roll-btn" :disabled="!canRoll" @click="roll">
                    <AppIcon :icon="rolling ? 'mdi:loading' : 'mdi:dice-multiple'" :class="{ 'spin-icon': rolling }" />
                    {{ rolling ? $t('gambling.dc_rolling') : $t('gambling.dc_roll') }}
                </button>
                <button v-if="showResult" class="new-round-btn" @click="newRound">
                    <AppIcon icon="mdi:refresh" /> {{ $t('gambling.new_round') }}
                </button>
            </div>
        </div>

        <!-- Info Panel -->
        <InfoPanel :title="$t('gambling.dc_odds')" :sections="diceInfo" />

        <!-- Stats -->
        <div class="dice-stats">
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_rolls') }}</span>
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
.dice-game {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    width: 100%;
    height: 100%;
    min-height: 0;
}

/* ── Header ── */
.dice-header {
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

.dice-title {
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

/* ── Dice area ── */
.dice-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-4);
    padding: var(--t-space-5) 0;
}

.dice-pair {
    display: flex;
    gap: var(--t-space-5);
    justify-content: center;
}

.sum-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--t-space-2) var(--t-space-4);
    border-radius: var(--t-radius-lg);
    background: var(--t-bg-muted);
    border: 2px solid var(--t-border);
}

.sum-badge.won {
    background: var(--t-success-muted);
    border-color: var(--t-success);
}

.sum-badge.lost {
    background: var(--t-danger-muted);
    border-color: var(--t-danger);
}

.sum-value {
    font-size: 2rem;
    font-weight: 900;
    font-family: var(--font-mono, monospace);
}

.sum-badge.won .sum-value {
    color: var(--t-success);
}

.sum-badge.lost .sum-value {
    color: var(--t-danger);
}

.sum-label {
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
}

/* ── Target selector ── */
.target-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.target-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.target-label-text {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--t-text-muted);
}

.target-number {
    font-size: 1.8rem;
    font-weight: 900;
    font-family: var(--font-mono, monospace);
    color: var(--t-accent);
    min-width: 40px;
    text-align: center;
}

.target-slider {
    width: 100%;
    max-width: 400px;
    accent-color: var(--t-accent);
    cursor: pointer;
}

.target-scale {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
}

.scale-mark {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--t-text-muted);
    width: 24px;
    text-align: center;
}

.scale-mark.active {
    color: var(--t-accent);
    font-weight: 800;
}

/* ── Direction buttons ── */
.direction-row {
    display: flex;
    gap: var(--t-space-3);
    align-items: stretch;
}

.dir-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-1);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 2px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    cursor: pointer;
    transition: all var(--t-transition-fast);
    color: var(--t-text-secondary);
    font-size: 1rem;
}

.dir-btn:hover:not(:disabled) {
    background: var(--t-bg-hover);
}

.dir-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.dir-btn.active.dir-under {
    border-color: var(--t-danger);
    background: var(--t-danger-muted);
    color: var(--t-danger);
}

.dir-btn.active.dir-over {
    border-color: var(--t-success);
    background: var(--t-success-muted);
    color: var(--t-success);
}

.dir-label {
    font-weight: 800;
    font-size: 0.95rem;
}

.dir-detail {
    font-size: 0.7rem;
    color: var(--t-text-muted);
}

/* ── Payout display ── */
.payout-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 130px;
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.payout-label {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--t-text-muted);
}

.payout-value {
    font-size: 1.6rem;
    font-weight: 900;
    font-family: var(--font-mono, monospace);
    color: var(--t-accent);
}

.payout-sub {
    font-size: 0.7rem;
    color: var(--t-text-muted);
}

/* ── Result banner ── */
.result-banner {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    border-radius: var(--t-radius-lg);
    animation: bannerPop 0.35s ease;
}

.banner-win {
    background: var(--t-success-muted);
    border: 1px solid var(--t-success);
}

.banner-lose {
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
}

.banner-icon {
    font-size: 1.8rem;
}

.banner-win .banner-icon {
    color: var(--t-success);
}

.banner-lose .banner-icon {
    color: var(--t-text-muted);
}

.banner-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.banner-text {
    font-size: 0.9rem;
}

.banner-amount {
    font-size: 1.3rem;
    font-weight: 800;
    font-family: var(--font-mono, monospace);
    color: var(--t-success);
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

/* ── Controls (shared pattern) ── */
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

.bet-adj:hover:not(:disabled) {
    background: var(--t-bg-hover);
}

.bet-adj:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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

.roll-btn {
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

.roll-btn:hover:not(:disabled) {
    filter: brightness(1.1);
}

.roll-btn:disabled {
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

.new-round-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-accent);
    border-radius: var(--t-radius-md);
    color: var(--t-accent);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    transition: all var(--t-transition-fast);
}

.new-round-btn:hover {
    background: var(--t-bg-hover);
}

/* ── Stats ── */
.dice-stats {
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
.pop-enter-active {
    transition: all 0.35s ease;
}

.pop-leave-active {
    transition: all 0.2s ease;
}

.pop-enter-from {
    transform: scale(0.8);
    opacity: 0;
}

.pop-leave-to {
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
    background: linear-gradient(135deg, var(--t-success-muted), color-mix(in srgb, var(--t-success) 5%, transparent));
    border: 1px solid var(--t-success);
    box-shadow: 0 0 24px var(--t-success-muted);
    animation: luckyPulse 0.8s ease infinite alternate;
}

.lucky-icon {
    font-size: 2rem;
    color: var(--t-success);
    animation: luckyCloverSpin 1s ease;
    filter: drop-shadow(0 0 6px var(--t-success-muted));
}

.lucky-text {
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--t-success);
    letter-spacing: 0.05em;
    text-shadow: 0 0 8px var(--t-success-muted);
}

@keyframes luckyPulse {
    from {
        box-shadow: 0 0 16px var(--t-success-muted);
    }

    to {
        box-shadow: 0 0 32px var(--t-success-muted);
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
