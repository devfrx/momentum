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
    --_card-back-start: var(--t-blue);
    --_card-back-end: color-mix(in srgb, var(--t-blue) 60%, black);
    background: linear-gradient(135deg, var(--_card-back-start), var(--_card-back-end));
    border: 2px solid var(--t-blue);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.card-pattern {
    --_pattern-line: color-mix(in srgb, var(--t-text) 15%, transparent);
    --_pattern-stripe: color-mix(in srgb, var(--t-text) 4%, transparent);
    width: 60%;
    height: 70%;
    border: 2px solid var(--_pattern-line);
    border-radius: var(--t-radius-sm);
    background: repeating-linear-gradient(45deg,
            transparent,
            transparent 4px,
            var(--_pattern-stripe) 4px,
            var(--_pattern-stripe) 8px);
}

/* Front */
.card-front {
    --_card-face-light: #fafafa;
    --_card-face-dark: #e8e8e8;
    background: linear-gradient(145deg, var(--_card-face-light), var(--_card-face-dark));
    border: 2px solid var(--t-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
        box-shadow: 0 0 8px 2px color-mix(in srgb, var(--t-success) 35%, transparent);
    }

    to {
        box-shadow: 0 0 18px 6px color-mix(in srgb, var(--t-success) 70%, transparent);
    }
}
</style>
