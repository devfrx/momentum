<script setup lang="ts">
/**
 * BlackjackCard — A single playing card with flip animation.
 * Shows back face when hidden, front face when revealed.
 */
import { computed } from 'vue'

export interface CardData {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
    rank: string   // 'A','2'..'10','J','Q','K'
    value: number   // primary value (Ace=11, face=10)
    hidden?: boolean
}

const props = defineProps<{
    card: CardData
    /** Delay before flip animation starts (ms as CSS) */
    delay?: string
    /** Show green lucky glow around this card */
    glow?: boolean
}>()

const SUIT_SYMBOLS: Record<string, string> = {
    hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠'
}

const suitSymbol = computed(() => SUIT_SYMBOLS[props.card.suit] ?? '?')
const isRed = computed(() => props.card.suit === 'hearts' || props.card.suit === 'diamonds')
</script>

<template>
    <div class="bj-card" :class="{ flipped: !card.hidden, 'lucky-glow': glow }"
        :style="{ '--deal-delay': delay || '0ms' }">
        <div class="card-inner">
            <!-- Back face -->
            <div class="card-face card-back">
                <div class="card-pattern"></div>
            </div>
            <!-- Front face -->
            <div class="card-face card-front" :class="{ red: isRed }">
                <span class="card-rank top">{{ card.rank }}</span>
                <span class="card-suit-big">{{ suitSymbol }}</span>
                <span class="card-rank bottom">{{ card.rank }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bj-card {
    width: 80px;
    height: 112px;
    perspective: 600px;
    flex-shrink: 0;
    border-radius: var(--t-radius-xl);
    animation: dealIn 0.4s ease both;
    animation-delay: var(--deal-delay);
}

@keyframes dealIn {
    from {
        opacity: 0;
        transform: translateY(-30px) scale(0.8);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.card-inner {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.5s ease;
    transition-delay: var(--deal-delay);
}

.bj-card.flipped .card-inner {
    transform: rotateY(180deg);
}

.card-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    border-radius: var(--t-radius-xl);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

/* Back */
.card-back {
    background: var(--t-blue);
    border: 2px solid var(--t-border);
}

.card-pattern {
    width: 60%;
    height: 70%;
    border: 2px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
}

/* Front */
.card-front {
    background: var(--t-bg-card);
    border: 2px solid var(--t-border);
    transform: rotateY(180deg);
    color: var(--t-text-inverse);
    padding: 6px;
}

.card-front.red {
    color: var(--t-danger);
}

.card-rank {
    font-size: 0.85rem;
    font-weight: 800;
    line-height: 1;
}

.card-rank.top {
    align-self: flex-start;
}

.card-rank.bottom {
    align-self: flex-end;
    transform: rotate(180deg);
}

.card-suit-big {
    font-size: 2rem;
    line-height: 1;
    flex: 1;
    display: flex;
    align-items: center;
}

/* ── Lucky glow ── */
/* NOTE: must NOT use filter on .bj-card or .card-inner — it flattens
   the 3D context and breaks backface-visibility, leaving the card face-down. */
.lucky-glow {
    animation: cardLuckyGlow 1.5s ease infinite alternate;
}

@keyframes cardLuckyGlow {
    from {
        opacity: 1;
    }

    to {
        opacity: 0.85;
    }
}
</style>
