<script setup lang="ts">
/**
 * LotteryDraw — Animated lottery draw results display.
 *
 * Shows drawn numbers being revealed one by one with matching highlights.
 * Displays prize tier result with rarity-based visual feedback.
 * Supports second-chance animation: shows losing draw first, "Lucky!" banner, then re-draw.
 */
import { ref, computed, onMounted, watch } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { type LotteryDrawResult, type LotteryTicketDef } from '@renderer/data/lottery'
import { rarityColor } from '@renderer/data/rarity'
import { useFormat } from '@renderer/composables/useFormat'

const props = defineProps<{
    result: LotteryDrawResult
    ticket: LotteryTicketDef
    /** Indices of drawn numbers that were forced by Rolling Luck */
    luckyIndices?: Set<number>
    /** Per-ball rolling luck chance (0–1); -1 = already matched */
    luckChances?: number[]
    /** Speed multiplier for draw animation (higher = faster, default 1) */
    speedMultiplier?: number
    /** Whether this draw was a second chance (lost first, re-drawn) */
    secondChance?: boolean
    /** The original losing result before second-chance re-draw */
    originalResult?: LotteryDrawResult | null
    /** Per-ball luck chances for the original (phase 1) draw */
    originalLuckChances?: number[] | null
    /** Indices forced by Rolling Luck in the original (phase 1) draw */
    originalLuckyIndices?: Set<number>
}>()

const { formatCash } = useFormat()

// ─── Jackpot tier calculation ────────────────────────────────
/** Determines which epic tier an animation should use based on payout multiplier */
type JackpotTier = 'none' | 'minor' | 'major' | 'grand' | 'mega' | 'cosmic'
const jackpotTier = computed<JackpotTier>(() => {
    const pm = activeResult.value.prizeTier?.payoutMultiplier ?? 0
    if (pm >= 100_000_000) return 'cosmic'
    if (pm >= 1_000_000) return 'mega'
    if (pm >= 10_000) return 'grand'
    if (pm >= 1_000) return 'major'
    if (pm >= 100) return 'minor'
    return 'none'
})

// ─── Two-phase animation state (for second chance) ───────────
/** Which result is currently being displayed/animated */
const activeResult = ref<LotteryDrawResult>(props.result)
/** Whether we're in the second phase of a second-chance draw */
const inSecondPhase = ref(false)
/** Show "Lucky!" banner between phases */
const showLuckyBanner = ref(false)
/** Show "Lucky!" banner after rolling luck (final phase) */
const showRollingLuck = ref(false)

// ─── Animation state ─────────────────────────────────────────
const revealedCount = ref(0)
const bonusRevealed = ref(false)
const animationDone = ref(false)

const emit = defineEmits<{ done: [] }>()

const revealDelay = computed(() => {
    const speed = props.speedMultiplier ?? 1
    return Math.max(30, Math.floor(props.ticket.drawDuration / speed / (activeResult.value.drawnNumbers.length + (props.ticket.hasBonus ? 1 : 0) + 1)))
})

// ─── Computed ────────────────────────────────────────────────
const playerSet = computed(() => new Set(activeResult.value.playerNumbers))

const rarityColorVal = computed(() =>
    activeResult.value.prizeTier ? rarityColor(activeResult.value.prizeTier.rarity) : ''
)

const isJackpot = computed(() =>
    activeResult.value.prizeTier?.rarity === 'jackpot' || activeResult.value.prizeTier?.rarity === 'legendary'
)

/** Active luck chances — switches between Phase 1 (original) and Phase 2 (final) */
const activeLuckChances = computed(() => {
    if (props.secondChance && !inSecondPhase.value && props.originalLuckChances) {
        return props.originalLuckChances
    }
    return props.luckChances ?? []
})

/** Active lucky indices — Phase 1 uses originalLuckyIndices, Phase 2 uses luckyIndices */
const activeLuckyIndices = computed(() => {
    if (props.secondChance && !inSecondPhase.value) {
        return props.originalLuckyIndices ?? new Set<number>()
    }
    return props.luckyIndices ?? new Set<number>()
})

// ─── Animate reveal ──────────────────────────────────────────
function animateReveal(result: LotteryDrawResult, onComplete: () => void): void {
    revealedCount.value = 0
    bonusRevealed.value = false
    animationDone.value = false
    activeResult.value = result

    const total = result.drawnNumbers.length
    let idx = 0

    const interval = setInterval(() => {
        idx++
        if (idx <= total) {
            revealedCount.value = idx
        } else if (props.ticket.hasBonus && !bonusRevealed.value) {
            bonusRevealed.value = true
        } else {
            animationDone.value = true
            clearInterval(interval)
            onComplete()
        }
    }, revealDelay.value)
}

function startReveal(): void {
    showLuckyBanner.value = false
    showRollingLuck.value = false
    inSecondPhase.value = false

    if (props.secondChance && props.originalResult) {
        // Phase 1: Animate the original losing draw
        animateReveal(props.originalResult, () => {
            setTimeout(() => {
                showLuckyBanner.value = true
                setTimeout(() => {
                    showLuckyBanner.value = false
                    inSecondPhase.value = true
                    // Phase 2: Animate the actual (winning/better) result
                    animateReveal(props.result, () => {
                        // Show rolling luck banner after Phase 2 if lucky indices exist
                        if (props.luckyIndices && props.luckyIndices.size > 0) {
                            setTimeout(() => {
                                showRollingLuck.value = true
                                setTimeout(() => {
                                    showRollingLuck.value = false
                                    emit('done')
                                }, 1500)
                            }, 300)
                        } else {
                            emit('done')
                        }
                    })
                }, 1500)
            }, 500)
        })
    } else {
        // No second chance — single-phase animation
        animateReveal(props.result, () => {
            // Show rolling luck banner if lucky indices exist
            if (props.luckyIndices && props.luckyIndices.size > 0) {
                setTimeout(() => {
                    showRollingLuck.value = true
                    setTimeout(() => {
                        showRollingLuck.value = false
                        emit('done')
                    }, 1500)
                }, 300)
            } else {
                emit('done')
            }
        })
    }
}

onMounted(() => startReveal())
watch(() => props.result, () => startReveal())
</script>

<template>
    <div class="lottery-draw" :class="{
        'jackpot-glow': animationDone && isJackpot && jackpotTier === 'none',
        'tier-minor': animationDone && jackpotTier === 'minor',
        'tier-major': animationDone && jackpotTier === 'major',
        'tier-grand': animationDone && jackpotTier === 'grand',
        'tier-mega': animationDone && jackpotTier === 'mega',
        'tier-cosmic': animationDone && jackpotTier === 'cosmic',
    }">
        <!-- Second-Chance "Lucky!" banner (between phases) -->
        <Transition name="lucky-pop">
            <div v-if="showLuckyBanner" class="draw-lucky-banner">
                <AppIcon icon="mdi:clover" class="draw-lucky-icon" />
                <span class="draw-lucky-text">{{ $t('gambling.lucky_trigger') }}</span>
            </div>
        </Transition>

        <!-- Rolling Luck banner (after final phase) -->
        <Transition name="lucky-pop">
            <div v-if="showRollingLuck" class="draw-lucky-banner rolling-luck">
                <AppIcon icon="mdi:clover" class="draw-lucky-icon" />
                <span class="draw-lucky-text">{{ $t('gambling.rolling_luck_trigger') }}</span>
            </div>
        </Transition>

        <!-- Drawn Numbers -->
        <div class="draw-section">
            <span class="draw-label">{{ $t('gambling.lt_drawn_numbers') }}</span>
            <div class="drawn-balls">
                <div v-for="(num, i) in activeResult.drawnNumbers" :key="i" class="drawn-ball" :class="{
                    revealed: i < revealedCount,
                    matched: i < revealedCount && playerSet.has(num),
                    unmatched: i < revealedCount && !playerSet.has(num),
                    'lucky-forced': i < revealedCount && activeLuckyIndices.has(i),
                }">
                    <span v-if="i < revealedCount">{{ num }}</span>
                    <span v-else class="ball-placeholder">?</span>
                    <AppIcon v-if="i < revealedCount && activeLuckyIndices.has(i)" icon="mdi:clover"
                        class="ball-clover" />
                    <span
                        v-if="i < revealedCount && activeLuckChances[i] !== undefined && activeLuckChances[i] >= 0 && !playerSet.has(num)"
                        class="luck-pct"
                        :class="{ 'luck-high': activeLuckChances[i] >= 0.20, 'luck-mid': activeLuckChances[i] >= 0.10 && activeLuckChances[i] < 0.20 }">
                        <AppIcon icon="mdi:clover" class="luck-pct-icon" />
                        {{ (activeLuckChances[i] * 100).toFixed(1) }}%
                    </span>
                </div>
                <!-- Bonus ball -->
                <template v-if="ticket.hasBonus">
                    <div class="bonus-separator">+</div>
                    <div class="drawn-ball bonus-drawn" :class="{
                        revealed: bonusRevealed,
                        matched: bonusRevealed && activeResult.bonusMatched,
                        unmatched: bonusRevealed && !activeResult.bonusMatched,
                    }">
                        <span v-if="bonusRevealed">{{ activeResult.bonusNumber }}</span>
                        <span v-else class="ball-placeholder">?</span>
                    </div>
                </template>
            </div>
        </div>

        <!-- Player's Numbers -->
        <div class="draw-section">
            <span class="draw-label">{{ $t('gambling.lt_your_numbers') }}</span>
            <div class="drawn-balls player-balls">
                <div v-for="num in activeResult.playerNumbers" :key="num" class="drawn-ball player-ball"
                    :class="{ matched: animationDone && activeResult.drawnNumbers.includes(num) }">
                    {{ num }}
                </div>
                <template v-if="ticket.hasBonus && activeResult.playerBonus !== null">
                    <div class="bonus-separator">+</div>
                    <div class="drawn-ball player-ball bonus-drawn"
                        :class="{ matched: animationDone && activeResult.bonusMatched }">
                        {{ activeResult.playerBonus }}
                    </div>
                </template>
            </div>
        </div>

        <!-- Result -->
        <Transition name="result-pop">
            <div v-if="animationDone" class="draw-result">
                <template v-if="activeResult.prizeTier">
                    <div class="win-result" :class="`win-${jackpotTier}`" :style="{ '--rarity-color': rarityColorVal }">
                        <!-- Particle overlays for epic+ tiers -->
                        <div v-if="jackpotTier === 'grand' || jackpotTier === 'mega' || jackpotTier === 'cosmic'"
                            class="win-particles">
                            <span v-for="p in (jackpotTier === 'cosmic' ? 24 : jackpotTier === 'mega' ? 16 : 10)"
                                :key="p" class="particle"
                                :style="{ '--i': p, '--total': jackpotTier === 'cosmic' ? 24 : jackpotTier === 'mega' ? 16 : 10 }" />
                        </div>
                        <!-- Screen flash for mega+ -->
                        <div v-if="jackpotTier === 'mega' || jackpotTier === 'cosmic'" class="screen-flash" />
                        <div class="win-label-row">
                            <AppIcon
                                :icon="jackpotTier === 'cosmic' ? 'mdi:creation' : jackpotTier === 'mega' ? 'mdi:fire' : jackpotTier === 'grand' ? 'mdi:crown' : isJackpot ? 'mdi:trophy' : 'mdi:party-popper'"
                                class="win-trophy" :class="`trophy-${jackpotTier}`" />
                            <span class="win-tier" :class="`tier-text-${jackpotTier}`">{{ activeResult.prizeTier.label
                            }}</span>
                            <span class="win-rarity-tag">{{ activeResult.prizeTier.rarity.toUpperCase() }}</span>
                        </div>
                        <div class="win-details">
                            <span class="win-matches">
                                {{ $t('gambling.lt_matched', { n: activeResult.matchedCount, total: ticket.pickCount })
                                }}
                                <template v-if="activeResult.bonusMatched"> {{ $t('gambling.lt_bonus') }}</template>
                            </span>
                            <span class="win-payout" :class="`payout-${jackpotTier}`">{{ formatCash(activeResult.payout)
                            }}</span>
                            <span class="win-multi">{{ $t('gambling.lt_payout_multi', {
                                n:
                                    activeResult.prizeTier.payoutMultiplier.toLocaleString()
                            }) }}</span>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="lose-result">
                        <AppIcon icon="mdi:emoticon-neutral" class="lose-icon" />
                        <span class="lose-text">
                            {{ activeResult.matchedCount > 0
                                ? $t('gambling.lt_not_enough', { n: activeResult.matchedCount })
                                : $t('gambling.lt_no_matches') }}
                        </span>
                    </div>
                </template>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.lottery-draw {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    transition: box-shadow 0.5s ease;
}

.jackpot-glow {
    box-shadow: 0 0 30px rgba(245, 158, 11, 0.3), 0 0 60px rgba(245, 158, 11, 0.1);
}

/* ── Tiered jackpot container glows ── */
.tier-minor {
    animation: tierMinorGlow 2s ease infinite alternate;
    border-color: color-mix(in srgb, #a855f7 40%, transparent);
}

.tier-major {
    animation: tierMajorGlow 1.5s ease infinite alternate;
    border-color: color-mix(in srgb, #f59e0b 50%, transparent);
}

.tier-grand {
    animation: tierGrandGlow 1.2s ease infinite alternate;
    border-color: color-mix(in srgb, #ef4444 50%, transparent);
}

.tier-mega {
    animation: tierMegaGlow 1s ease infinite alternate;
    border-color: transparent;
    border-image: linear-gradient(135deg, #ef4444, #f59e0b, #a855f7, #3b82f6) 1;
}

.tier-cosmic {
    animation: tierCosmicGlow 0.8s ease infinite alternate;
    border-color: transparent;
    border-image: linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4, #10b981, #f59e0b, #ef4444) 1;
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.03), rgba(139, 92, 246, 0.03), rgba(6, 182, 212, 0.03));
}

@keyframes tierMinorGlow {
    from {
        box-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
    }

    to {
        box-shadow: 0 0 30px rgba(168, 85, 247, 0.4);
    }
}

@keyframes tierMajorGlow {
    from {
        box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
    }

    to {
        box-shadow: 0 0 50px rgba(245, 158, 11, 0.5);
    }
}

@keyframes tierGrandGlow {
    from {
        box-shadow: 0 0 25px rgba(239, 68, 68, 0.3), 0 0 50px rgba(239, 68, 68, 0.1);
    }

    to {
        box-shadow: 0 0 50px rgba(239, 68, 68, 0.5), 0 0 80px rgba(239, 68, 68, 0.2);
    }
}

@keyframes tierMegaGlow {
    from {
        box-shadow: 0 0 30px rgba(239, 68, 68, 0.4), 0 0 60px rgba(245, 158, 11, 0.2), 0 0 90px rgba(168, 85, 247, 0.1);
    }

    to {
        box-shadow: 0 0 60px rgba(239, 68, 68, 0.6), 0 0 100px rgba(245, 158, 11, 0.4), 0 0 140px rgba(168, 85, 247, 0.2);
    }
}

@keyframes tierCosmicGlow {
    from {
        box-shadow: 0 0 40px rgba(236, 72, 153, 0.5), 0 0 80px rgba(139, 92, 246, 0.3), 0 0 120px rgba(6, 182, 212, 0.2);
    }

    to {
        box-shadow: 0 0 80px rgba(236, 72, 153, 0.7), 0 0 140px rgba(139, 92, 246, 0.5), 0 0 200px rgba(6, 182, 212, 0.3);
    }
}

/* ── Sections ── */
.draw-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    align-items: center;
}

.draw-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: var(--t-text-muted);
}

/* ── Balls ── */
.drawn-balls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    padding-bottom: 20px;
    /* room for luck % labels */
}

.drawn-ball {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    font-weight: 800;
    font-family: var(--t-font-mono);
    background: var(--t-bg-muted);
    border: 2px solid var(--t-border);
    color: var(--t-text-muted);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.drawn-ball.revealed {
    transform: scale(1);
    animation: ballReveal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.drawn-ball.matched {
    background: var(--t-success);
    border-color: var(--t-success);
    color: #fff;
    box-shadow: 0 0 12px var(--t-success-muted, rgba(34, 197, 94, 0.4));
}

.drawn-ball.lucky-forced {
    position: relative;
    animation: luckyBallPulse 1s ease infinite alternate;
}

.ball-clover {
    position: absolute;
    top: -6px;
    right: -6px;
    font-size: 0.7rem;
    color: #22c55e;
    filter: drop-shadow(0 0 3px rgba(34, 197, 94, 0.6));
    animation: cloverPop 0.5s ease;
}

@keyframes luckyBallPulse {
    from {
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
    }

    to {
        box-shadow: 0 0 18px rgba(34, 197, 94, 0.6);
    }
}

@keyframes cloverPop {
    0% {
        transform: scale(0);
    }

    60% {
        transform: scale(1.4);
    }

    100% {
        transform: scale(1);
    }
}

.drawn-ball.unmatched {
    background: var(--t-bg-muted);
    border-color: var(--t-border);
    color: var(--t-text-secondary);
}

.player-ball {
    width: 38px;
    height: 38px;
    font-size: 0.85rem;
    border: 2px solid var(--t-border);
    opacity: 0.7;
}

.player-ball.matched {
    opacity: 1;
    background: color-mix(in srgb, var(--t-success) 15%, transparent);
    border-color: var(--t-success);
    color: var(--t-success);
}

.bonus-drawn {
    border-color: #f59e0b;
}

.bonus-drawn.matched {
    background: #f59e0b;
    border-color: #f59e0b;
    color: #fff;
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
}

.bonus-separator {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--t-text-muted);
}

.ball-placeholder {
    color: var(--t-text-muted);
    font-size: 1.1rem;
}

/* ── Luck percentage badge ── */
.luck-pct {
    position: absolute;
    bottom: -18px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.55rem;
    font-weight: 700;
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
    white-space: nowrap;
    opacity: 0.7;
    animation: luckPctFade 0.4s ease;
}

.luck-pct.luck-mid {
    color: #22c55e;
    opacity: 0.85;
}

.luck-pct.luck-high {
    color: #4ade80;
    opacity: 1;
    text-shadow: 0 0 4px rgba(34, 197, 94, 0.4);
}

.luck-pct-icon {
    font-size: 0.5rem;
}

@keyframes luckPctFade {
    0% {
        opacity: 0;
        transform: translateX(-50%) translateY(4px);
    }

    100% {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

@keyframes ballReveal {
    0% {
        transform: scale(0.3) rotate(-180deg);
        opacity: 0;
    }

    100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
    }
}

/* ── Result displays ── */
.draw-result {
    margin-top: var(--t-space-2);
}

.win-result {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-4);
    background: color-mix(in srgb, var(--rarity-color, #f59e0b) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--rarity-color, #f59e0b) 50%, transparent);
    border-radius: var(--t-radius-lg);
    text-align: center;
    animation: resultPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ── Tiered win panel animations ── */
.win-minor {
    animation: resultPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), winPulseSoft 2s ease 0.5s infinite alternate;
}

.win-major {
    animation: resultShake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97), winPulseMedium 1.5s ease 0.6s infinite alternate;
}

.win-grand {
    animation: resultEpicEntry 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), winPulseStrong 1.2s ease 0.8s infinite alternate;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.08));
}

.win-mega {
    animation: resultEpicEntry 1s cubic-bezier(0.34, 1.56, 0.64, 1), winRainbow 3s linear 1s infinite;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.1), rgba(168, 85, 247, 0.08));
}

.win-cosmic {
    animation: resultCosmicEntry 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), winCosmicPulse 2s ease 1.2s infinite alternate;
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(139, 92, 246, 0.12), rgba(6, 182, 212, 0.08));
}

@keyframes winPulseSoft {
    from {
        box-shadow: inset 0 0 20px rgba(168, 85, 247, 0.05);
    }

    to {
        box-shadow: inset 0 0 40px rgba(168, 85, 247, 0.12);
    }
}

@keyframes winPulseMedium {
    from {
        box-shadow: inset 0 0 20px rgba(245, 158, 11, 0.08);
    }

    to {
        box-shadow: inset 0 0 50px rgba(245, 158, 11, 0.18);
    }
}

@keyframes winPulseStrong {
    from {
        box-shadow: inset 0 0 30px rgba(239, 68, 68, 0.1);
    }

    to {
        box-shadow: inset 0 0 60px rgba(239, 68, 68, 0.25);
    }
}

@keyframes winRainbow {
    0% {
        filter: hue-rotate(0deg);
    }

    100% {
        filter: hue-rotate(360deg);
    }
}

@keyframes winCosmicPulse {
    from {
        box-shadow: inset 0 0 40px rgba(236, 72, 153, 0.15), inset 0 0 80px rgba(139, 92, 246, 0.08);
    }

    to {
        box-shadow: inset 0 0 80px rgba(236, 72, 153, 0.3), inset 0 0 120px rgba(6, 182, 212, 0.15);
    }
}

@keyframes resultShake {
    0% {
        transform: scale(0.3);
        opacity: 0;
    }

    40% {
        transform: scale(1.08);
        opacity: 1;
    }

    50% {
        transform: scale(1.08) rotate(1deg);
    }

    60% {
        transform: scale(1.05) rotate(-1deg);
    }

    70% {
        transform: scale(1.03) rotate(0.5deg);
    }

    80% {
        transform: scale(1.01) rotate(-0.5deg);
    }

    100% {
        transform: scale(1) rotate(0);
    }
}

@keyframes resultEpicEntry {
    0% {
        transform: scale(0) rotate(-10deg);
        opacity: 0;
    }

    30% {
        transform: scale(1.15) rotate(2deg);
        opacity: 1;
    }

    50% {
        transform: scale(0.95) rotate(-1deg);
    }

    70% {
        transform: scale(1.05) rotate(0.5deg);
    }

    100% {
        transform: scale(1) rotate(0);
    }
}

@keyframes resultCosmicEntry {
    0% {
        transform: scale(0) rotate(-20deg);
        opacity: 0;
        filter: brightness(3);
    }

    20% {
        transform: scale(1.3) rotate(5deg);
        opacity: 1;
        filter: brightness(2);
    }

    40% {
        transform: scale(0.9) rotate(-3deg);
        filter: brightness(1.5);
    }

    60% {
        transform: scale(1.1) rotate(1deg);
        filter: brightness(1.2);
    }

    80% {
        transform: scale(0.98) rotate(-0.5deg);
        filter: brightness(1.1);
    }

    100% {
        transform: scale(1) rotate(0);
        filter: brightness(1);
    }
}

/* ── Particle burst ── */
.win-particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}

.particle {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    background: var(--rarity-color, #f59e0b);
    animation: particleBurst 2s ease-out forwards;
    animation-delay: calc(var(--i) * 0.05s);
    --angle: calc(var(--i) * (360 / var(--total)) * 1deg);
    --dist: calc(60px + var(--i) * 8px);
}

@keyframes particleBurst {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 1;
    }

    30% {
        transform: translate(calc(-50% + cos(var(--angle)) * var(--dist)),
                calc(-50% + sin(var(--angle)) * var(--dist))) scale(1.5);
        opacity: 1;
    }

    100% {
        transform: translate(calc(-50% + cos(var(--angle)) * var(--dist) * 2),
                calc(-50% + sin(var(--angle)) * var(--dist) * 2)) scale(0);
        opacity: 0;
    }
}

/* ── Screen flash ── */
.screen-flash {
    position: absolute;
    inset: 0;
    background: white;
    opacity: 0;
    pointer-events: none;
    animation: flashBang 0.6s ease-out forwards;
    border-radius: inherit;
}

@keyframes flashBang {
    0% {
        opacity: 0.8;
    }

    100% {
        opacity: 0;
    }
}

/* ── Trophy icon tiers ── */
.trophy-minor {
    animation: trophySpin 0.6s ease;
}

.trophy-major {
    animation: trophySpin 0.8s ease;
    font-size: 2.2rem !important;
}

.trophy-grand {
    animation: trophyGrandEntry 1s ease;
    font-size: 2.5rem !important;
    filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.5));
}

.trophy-mega {
    animation: trophyGrandEntry 1.2s ease;
    font-size: 2.8rem !important;
    filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.6));
}

.trophy-cosmic {
    animation: trophyCosmicEntry 1.5s ease;
    font-size: 3.2rem !important;
    filter: drop-shadow(0 0 16px rgba(236, 72, 153, 0.7));
}

@keyframes trophySpin {
    0% {
        transform: scale(0) rotate(-360deg);
    }

    60% {
        transform: scale(1.3) rotate(20deg);
    }

    100% {
        transform: scale(1) rotate(0);
    }
}

@keyframes trophyGrandEntry {
    0% {
        transform: scale(0) rotate(-360deg);
        filter: brightness(3);
    }

    40% {
        transform: scale(1.5) rotate(10deg);
        filter: brightness(2);
    }

    70% {
        transform: scale(0.9) rotate(-5deg);
        filter: brightness(1.2);
    }

    100% {
        transform: scale(1) rotate(0);
        filter: brightness(1);
    }
}

@keyframes trophyCosmicEntry {
    0% {
        transform: scale(0) rotate(-720deg);
        opacity: 0;
        filter: brightness(5);
    }

    30% {
        transform: scale(2) rotate(30deg);
        opacity: 1;
        filter: brightness(3);
    }

    50% {
        transform: scale(0.8) rotate(-15deg);
        filter: brightness(1.5);
    }

    70% {
        transform: scale(1.2) rotate(5deg);
        filter: brightness(1.2);
    }

    100% {
        transform: scale(1) rotate(0);
        filter: brightness(1);
    }
}

/* ── Tier text effects ── */
.tier-text-grand {
    text-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.tier-text-mega {
    text-shadow: 0 0 15px rgba(239, 68, 68, 0.6), 0 0 30px rgba(245, 158, 11, 0.3);
    animation: textPulse 1s ease infinite alternate;
}

.tier-text-cosmic {
    text-shadow: 0 0 20px rgba(236, 72, 153, 0.7), 0 0 40px rgba(139, 92, 246, 0.4);
    animation: textRainbow 3s linear infinite;
}

@keyframes textPulse {
    from {
        opacity: 0.9;
        transform: scale(1);
    }

    to {
        opacity: 1;
        transform: scale(1.05);
    }
}

@keyframes textRainbow {
    0% {
        filter: hue-rotate(0deg);
    }

    100% {
        filter: hue-rotate(360deg);
    }
}

/* ── Payout amount tiers ── */
.payout-minor {
    font-size: 2rem;
}

.payout-major {
    font-size: 2.2rem;
    animation: payoutBounce 0.8s ease;
}

.payout-grand {
    font-size: 2.5rem;
    animation: payoutBounce 1s ease;
    text-shadow: 0 0 10px var(--rarity-color, #ef4444);
}

.payout-mega {
    font-size: 2.8rem;
    animation: payoutCountUp 1.5s ease;
    text-shadow: 0 0 15px var(--rarity-color, #ef4444);
}

.payout-cosmic {
    font-size: 3.2rem;
    animation: payoutCountUp 2s ease, payoutGlow 2s ease 2s infinite alternate;
    text-shadow: 0 0 20px rgba(236, 72, 153, 0.7);
}

@keyframes payoutBounce {
    0% {
        transform: scale(0.5);
        opacity: 0;
    }

    50% {
        transform: scale(1.2);
        opacity: 1;
    }

    75% {
        transform: scale(0.95);
    }

    100% {
        transform: scale(1);
    }
}

@keyframes payoutCountUp {
    0% {
        transform: scale(0.3) translateY(20px);
        opacity: 0;
        filter: blur(4px);
    }

    40% {
        transform: scale(1.3) translateY(-5px);
        opacity: 1;
        filter: blur(0);
    }

    60% {
        transform: scale(0.95) translateY(2px);
    }

    80% {
        transform: scale(1.05) translateY(-1px);
    }

    100% {
        transform: scale(1) translateY(0);
    }
}

@keyframes payoutGlow {
    from {
        text-shadow: 0 0 15px rgba(236, 72, 153, 0.5);
    }

    to {
        text-shadow: 0 0 30px rgba(236, 72, 153, 0.9), 0 0 60px rgba(139, 92, 246, 0.4);
    }
}

.win-label-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
}

.win-trophy {
    font-size: 1.8rem;
    color: var(--rarity-color, #f59e0b);
}

.win-tier {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--rarity-color, #f59e0b);
}

.win-rarity-tag {
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    padding: 2px 8px;
    border-radius: var(--t-radius-sm);
    background: color-mix(in srgb, var(--rarity-color, #f59e0b) 15%, transparent);
    color: var(--rarity-color, #f59e0b);
}

.win-details {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.win-matches {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
}

.win-payout {
    font-size: 1.8rem;
    font-weight: 900;
    font-family: var(--t-font-mono);
    color: var(--rarity-color, var(--t-success));
    transition: font-size 0.3s ease;
}

.win-multi {
    font-size: 0.75rem;
    color: var(--t-text-muted);
}

.lose-result {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    animation: resultPop 0.3s ease;
}

.lose-icon {
    font-size: 1.4rem;
    color: var(--t-text-muted);
}

.lose-text {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

@keyframes resultPop {
    0% {
        transform: scale(0.9);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ── Transition ── */
.result-pop-enter-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.result-pop-leave-active {
    transition: all 0.2s ease;
}

.result-pop-enter-from {
    opacity: 0;
    transform: scale(0.8);
}

.result-pop-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

/* ── "Lucky!" banner inside draw ── */
.draw-lucky-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-4);
    border-radius: var(--t-radius-lg);
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
    border: 1px solid rgba(34, 197, 94, 0.4);
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.25);
    animation: drawLuckyPulse 0.8s ease infinite alternate;
}

.draw-lucky-icon {
    font-size: 1.4rem;
    color: #22c55e;
    animation: drawCloverSpin 0.8s ease;
    filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.5));
}

.draw-lucky-text {
    font-size: 1rem;
    font-weight: 800;
    color: #22c55e;
    letter-spacing: 0.05em;
    text-shadow: 0 0 6px rgba(34, 197, 94, 0.3);
}

@keyframes drawLuckyPulse {
    from {
        box-shadow: 0 0 12px rgba(34, 197, 94, 0.2);
    }

    to {
        box-shadow: 0 0 28px rgba(34, 197, 94, 0.4);
    }
}

@keyframes drawCloverSpin {
    0% {
        transform: scale(0) rotate(-180deg);
    }

    60% {
        transform: scale(1.3) rotate(20deg);
    }

    100% {
        transform: scale(1) rotate(0);
    }
}

.lucky-pop-enter-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.lucky-pop-leave-active {
    transition: all 0.3s ease;
}

.lucky-pop-enter-from {
    opacity: 0;
    transform: scale(0.5);
}

.lucky-pop-leave-to {
    opacity: 0;
    transform: scale(0.8);
}
</style>
