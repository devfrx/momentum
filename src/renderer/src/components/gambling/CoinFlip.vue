<script setup lang="ts">
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { D, ZERO, mul } from '@renderer/core/BigNum'

const emit = defineEmits<{ back: [] }>()
const { t } = useI18n()

const player = usePlayerStore()
const gambling = useGamblingStore()
const { formatCash } = useFormat()

// ─── State ───────────────────────────────────────────────────
type Side = 'heads' | 'tails'

const betAmount = ref(10)
const chosenSide = ref<Side>('heads')
const flipping = ref(false)
const result = ref<Side | null>(null)
const showResult = ref(false)
const won = ref(false)
const payout = ref(ZERO)
/** Number of full rotations for animation (randomised each flip) */
const flipRotations = ref(0)
/** Luck triggered — shows clover animation between first loss and re-flip */
const luckyTriggered = ref(false)

// ─── Computed ────────────────────────────────────────────────
const betDecimal = computed(() => D(betAmount.value))
const canFlip = computed(() =>
    !flipping.value &&
    betAmount.value > 0 &&
    player.cash.gte(betDecimal.value)
)
const stats = computed(() => gambling.getStats('coinflip'))

// ─── Flip logic ──────────────────────────────────────────────
function flip(): void {
    if (!canFlip.value) return
    if (!player.spendCash(betDecimal.value)) return

    flipping.value = true
    showResult.value = false
    result.value = null
    won.value = false
    payout.value = ZERO
    luckyTriggered.value = false

    // First roll: fair 50/50
    const firstRoll = Math.random() < 0.5
    const firstWins = firstRoll

    if (firstWins) {
        // Won on first roll — normal animation
        playFlip(chosenSide.value, true)
    } else {
        // Lost first roll — check second chance
        const luckBonus = gambling.getLuckBonus()
        const luckyReroll = luckBonus > 0 && Math.random() < luckBonus
        if (luckyReroll) {
            // Show losing flip, then "Lucky!" banner, then re-flip
            const losingSide: Side = chosenSide.value === 'heads' ? 'tails' : 'heads'
            playFlip(losingSide, false, () => {
                // After losing flip lands — show lucky banner
                luckyTriggered.value = true
                setTimeout(() => {
                    // Re-flip with fresh 50/50
                    luckyTriggered.value = false
                    const secondWins = Math.random() < 0.5
                    const secondOutcome: Side = secondWins ? chosenSide.value : (chosenSide.value === 'heads' ? 'tails' : 'heads')
                    playFlip(secondOutcome, true)
                }, 1400) // show lucky banner for 1.4s
            })
        } else {
            // Normal loss
            const losingSide: Side = chosenSide.value === 'heads' ? 'tails' : 'heads'
            playFlip(losingSide, true)
        }
    }
}

/** Animate a flip to a specific outcome. If `isFinal`, evaluate win/loss at the end. */
function playFlip(outcome: Side, isFinal: boolean, onLand?: () => void): void {
    // Remove animation class so a fresh animation can restart
    flipping.value = false
    flipRotations.value = 0

    // Double requestAnimationFrame ensures the browser renders the reset state
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const baseSpins = 6 + Math.floor(Math.random() * 4)
            const outcomeIsHeads = outcome === 'heads'
            const totalHalves = outcomeIsHeads
                ? (baseSpins % 2 === 0 ? baseSpins : baseSpins + 1)
                : (baseSpins % 2 === 1 ? baseSpins : baseSpins + 1)
            flipRotations.value = totalHalves * 180
            flipping.value = true

            setTimeout(() => {
                result.value = outcome

                if (isFinal) {
                    const isWin = outcome === chosenSide.value
                    if (isWin) {
                        const winPayout = mul(betDecimal.value, 2)
                        player.earnCash(winPayout)
                        gambling.recordWin('coinflip', betDecimal.value, winPayout)
                        payout.value = winPayout
                        won.value = true
                    } else {
                        gambling.recordLoss('coinflip', betDecimal.value)
                        won.value = false
                    }
                    showResult.value = true
                    flipping.value = false
                } else {
                    // Intermediate flip — call callback
                    onLand?.()
                }
            }, 2200)
        })
    })
}

function newRound(): void {
    showResult.value = false
    result.value = null
    flipRotations.value = 0
}

// ─── Bet helpers ─────────────────────────────────────────────
function setBet(amount: number): void {
    betAmount.value = Math.max(1, Math.min(amount, player.cash.toNumber()))
}
function halfBet(): void { setBet(Math.max(1, Math.floor(betAmount.value / 2))) }
function doubleBet(): void { setBet(betAmount.value * 2) }
function maxBet(): void { setBet(player.cash.toNumber()) }

// ─── Info Panel ──────────────────────────────────────────────
const coinFlipInfo = computed<InfoSection[]>(() => [
    {
        title: t('gambling.info.coinflip.how_title'),
        icon: 'mdi:help-circle-outline',
        entries: [
            { term: t('gambling.info.coinflip.choose_side'), desc: t('gambling.info.coinflip.choose_side_desc'), icon: 'mdi:gesture-tap' },
            { term: t('gambling.info.coinflip.place_bet'), desc: t('gambling.info.coinflip.place_bet_desc'), icon: 'mdi:cash' },
            { term: t('gambling.info.coinflip.fair_coin'), desc: t('gambling.info.coinflip.fair_coin_desc'), icon: 'mdi:scale-balance' },
        ]
    },
    {
        title: t('gambling.info.coinflip.payout_title'),
        icon: 'mdi:cash-multiple',
        entries: [
            { term: t('gambling.info.coinflip.correct'), desc: t('gambling.info.coinflip.correct_desc'), icon: 'mdi:check-circle' },
            { term: t('gambling.info.coinflip.wrong'), desc: t('gambling.info.coinflip.wrong_desc'), icon: 'mdi:close-circle' },
        ]
    },
])
</script>

<template>
    <div class="coinflip-game">
        <!-- Header -->
        <div class="cf-header">
            <button class="back-btn" @click="$emit('back')">
                <AppIcon icon="mdi:arrow-left" /> {{ $t('gambling.back') }}
            </button>
            <h2 class="cf-title">
                <AppIcon icon="mdi:circle-half-full" class="title-icon" />
                {{ $t('gambling.cf_title') }}
            </h2>
            <div class="balance-chip">
                <AppIcon icon="mdi:cash" />
                {{ formatCash(player.cash) }}
            </div>
        </div>

        <!-- Coin area -->
        <div class="coin-area">
            <div class="coin-stage">
                <div class="coin" :class="{ flipping }" :style="{ '--flip-deg': flipRotations + 'deg' }">
                    <div class="coin-face coin-heads">
                        <AppIcon icon="mdi:crown" class="coin-icon" />
                        <span class="coin-label">{{ $t('gambling.cf_h') }}</span>
                    </div>
                    <div class="coin-face coin-tails">
                        <AppIcon icon="mdi:shield" class="coin-icon" />
                        <span class="coin-label">{{ $t('gambling.cf_t') }}</span>
                    </div>
                </div>
            </div>

            <!-- Result overlay -->
            <Transition name="pop">
                <div v-if="showResult" class="result-badge" :class="won ? 'badge-win' : 'badge-lose'">
                    <AppIcon :icon="won ? 'mdi:trophy' : 'mdi:emoticon-sad'" class="badge-icon" />
                    <span class="badge-side">{{ result === 'heads' ? $t('gambling.cf_heads') : $t('gambling.cf_tails')
                    }}</span>
                    <span v-if="won" class="badge-payout">{{ formatCash(payout) }}</span>
                    <span v-else class="badge-text">{{ $t('gambling.cf_you_lose') }}</span>
                </div>
            </Transition>

            <!-- Lucky second chance banner -->
            <Transition name="lucky">
                <div v-if="luckyTriggered" class="lucky-banner">
                    <AppIcon icon="mdi:clover" class="lucky-icon" />
                    <span class="lucky-text">{{ $t('gambling.lucky_trigger') }}</span>
                </div>
            </Transition>
        </div>

        <!-- Side selector -->
        <div class="side-selector">
            <button class="side-btn" :class="{ active: chosenSide === 'heads', disabled: flipping }"
                :disabled="flipping" @click="chosenSide = 'heads'">
                <AppIcon icon="mdi:crown" class="side-icon" />
                <span>{{ $t('gambling.cf_heads') }}</span>
            </button>
            <span class="side-vs">{{ $t('gambling.cf_vs') }}</span>
            <button class="side-btn" :class="{ active: chosenSide === 'tails', disabled: flipping }"
                :disabled="flipping" @click="chosenSide = 'tails'">
                <AppIcon icon="mdi:shield" class="side-icon" />
                <span>{{ $t('gambling.cf_tails') }}</span>
            </button>
        </div>

        <!-- Controls -->
        <div class="controls-row">
            <div class="bet-section">
                <label class="bet-label">{{ $t('gambling.bet_amount') }}</label>
                <div class="bet-row">
                    <button class="bet-adj" @click="halfBet" :disabled="flipping">1/2</button>
                    <div class="bet-display">
                        <input type="number" v-model.number="betAmount" :min="1" :max="player.cash.toNumber()"
                            class="bet-input" :disabled="flipping" />
                    </div>
                    <button class="bet-adj" @click="doubleBet" :disabled="flipping">x2</button>
                </div>
                <div class="bet-presets">
                    <button v-for="pct in [10, 25, 50]" :key="pct" class="preset-btn"
                        @click="setBet(Math.floor(player.cash.toNumber() * pct / 100))" :disabled="flipping">
                        {{ pct }}%
                    </button>
                    <button class="preset-btn preset-max" @click="maxBet" :disabled="flipping">{{ $t('gambling.max')
                    }}</button>
                </div>
            </div>

            <div class="action-col">
                <button class="flip-btn" :disabled="!canFlip" @click="flip">
                    <AppIcon :icon="flipping ? 'mdi:loading' : 'mdi:rotate-3d-variant'"
                        :class="{ 'spin-icon': flipping }" />
                    {{ flipping ? $t('gambling.cf_flipping') : $t('gambling.cf_flip') }}
                </button>
                <button v-if="showResult" class="new-round-btn" @click="newRound">
                    <AppIcon icon="mdi:refresh" /> {{ $t('gambling.new_round') }}
                </button>
            </div>
        </div>

        <!-- Info Panel -->
        <InfoPanel :title="$t('gambling.cf_odds')" :sections="coinFlipInfo" />

        <!-- Stats -->
        <div class="cf-stats">
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_flips') }}</span>
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
.coinflip-game {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    width: 100%;
    height: 100%;
    min-height: 0;
}

/* ── Header ── */
.cf-header {
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

.cf-title {
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

/* ── Coin area ── */
.coin-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-6) 0;
}

.coin-stage {
    width: 160px;
    height: 160px;
}

.coin {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transform-origin: center center;
    transition: none;
}

.coin.flipping {
    animation: coinToss 2s ease-out forwards, coinSpin 2s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
}

/* Vertical toss: up then down */
@keyframes coinToss {
    0% {
        translate: 0 0;
    }

    40% {
        translate: 0 -120px;
    }

    100% {
        translate: 0 0;
    }
}

/* Rotation: continuous spin with deceleration */
@keyframes coinSpin {
    0% {
        transform: perspective(600px) rotateX(0deg);
    }

    100% {
        transform: perspective(600px) rotateX(var(--flip-deg));
    }
}

.coin-face {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    backface-visibility: hidden;
    border: 4px solid rgba(255, 255, 255, 0.15);
    box-shadow:
        0 4px 20px rgba(0, 0, 0, 0.3),
        inset 0 2px 10px rgba(255, 255, 255, 0.1);
}

.coin-heads {
    background: linear-gradient(145deg, #f5c842, #d4a017);
    color: #5a3e00;
}

.coin-tails {
    background: linear-gradient(145deg, #b0b8c8, #7a8599);
    color: #2c3444;
    transform: rotateX(180deg);
}

.coin-icon {
    font-size: 3rem;
}

.coin-label {
    font-size: 1.6rem;
    font-weight: 900;
    letter-spacing: 0.1em;
}

/* ── Result badge ── */
.result-badge {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-5);
    border-radius: var(--t-radius-lg);
    animation: badgePop 0.35s ease;
}

.badge-win {
    background: var(--t-success-muted);
    border: 1px solid var(--t-success);
}

.badge-lose {
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
}

.badge-icon {
    font-size: 1.8rem;
}

.badge-win .badge-icon {
    color: var(--t-success);
}

.badge-lose .badge-icon {
    color: var(--t-text-muted);
}

.badge-side {
    font-size: 1.1rem;
    font-weight: 700;
}

.badge-payout {
    font-size: 1.4rem;
    font-weight: 800;
    font-family: var(--font-mono, monospace);
    color: var(--t-success);
}

.badge-text {
    font-size: 0.9rem;
    color: var(--t-text-muted);
}

@keyframes badgePop {
    0% {
        transform: scale(0.9);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ── Side selector ── */
.side-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-3);
}

.side-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-1);
    padding: var(--t-space-3) var(--t-space-5);
    background: var(--t-bg-card);
    border: 2px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    color: var(--t-text-secondary);
    cursor: pointer;
    font-size: 1rem;
    font-weight: 700;
    transition: all var(--t-transition-fast);
    min-width: 110px;
}

.side-btn:hover:not(.disabled) {
    background: var(--t-bg-hover);
}

.side-btn.active {
    background: var(--t-accent);
    color: #fff;
    box-shadow: 0 0 16px rgba(var(--t-accent-rgb, 99 102 241), 0.35);
}

.side-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.side-icon {
    font-size: 1.8rem;
}

.side-vs {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    color: var(--t-text-muted);
}

/* ── Controls (shared pattern with roulette) ── */
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

.flip-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-accent);
    color: #fff;
    border: none;
    border-radius: var(--t-radius-md);
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.flip-btn:hover:not(:disabled) {
    filter: brightness(1.1);
}

.flip-btn:disabled {
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
.cf-stats {
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
    color: var(--t-danger, #e74c3c);
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
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-5);
    border-radius: var(--t-radius-lg);
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
    border: 1px solid rgba(34, 197, 94, 0.4);
    box-shadow: 0 0 24px rgba(34, 197, 94, 0.25);
    animation: luckyPulse 0.8s ease infinite alternate;
}

.lucky-icon {
    font-size: 2rem;
    color: #22c55e;
    animation: luckyCloverSpin 1s ease;
    filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.5));
}

.lucky-text {
    font-size: 1.2rem;
    font-weight: 800;
    color: #22c55e;
    letter-spacing: 0.05em;
    text-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
}

@keyframes luckyPulse {
    from {
        box-shadow: 0 0 16px rgba(34, 197, 94, 0.2);
    }

    to {
        box-shadow: 0 0 32px rgba(34, 197, 94, 0.4);
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
