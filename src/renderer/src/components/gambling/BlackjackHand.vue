<script setup lang="ts">
/**
 * BlackjackHand — Displays a row of cards with overlapping fan layout and a score badge.
 */
import BlackjackCard from './BlackjackCard.vue'
import type { CardData } from './BlackjackCard.vue'

defineProps<{
    label: string
    cards: CardData[]
    score: number
    /** Show "BUST" badge */
    bust?: boolean
    /** Show "BLACKJACK" badge */
    blackjack?: boolean
    /** Index of the card that was drawn by luck (shows green glow) */
    glowIndex?: number | null
}>()
</script>

<template>
    <div class="bj-hand">
        <div class="hand-label-row">
            <span class="hand-label">{{ label }}</span>
            <span class="hand-score" :class="{ bust, blackjack }">
                {{ bust ? $t('gambling.bj_bust') : blackjack ? $t('gambling.bj_bj_short') : score || '—' }}
            </span>
        </div>
        <div class="cards-row">
            <BlackjackCard v-for="(card, i) in cards" :key="`${card.suit}-${card.rank}-${i}`" :card="card"
                :delay="`${i * 120}ms`" :glow="glowIndex === i" class="hand-card" :style="{ '--card-index': i }" />
            <div v-if="cards.length === 0" class="empty-slot">
                <span>?</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bj-hand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
}

.hand-label-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.hand-label {
    font-size: 0.75rem;
    font-weight: var(--t-font-bold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--t-text-muted);
}

.hand-score {
    font-family: var(--t-font-mono);
    font-weight: 800;
    font-size: 1rem;
    padding: 2px 10px;
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    color: var(--t-text);
}

.hand-score.bust {
    background: var(--t-danger-muted);
    border-color: var(--t-danger);
    color: var(--t-danger);
}

.hand-score.blackjack {
    background: var(--t-success-muted);
    border-color: var(--t-success);
    color: var(--t-success);
}

.cards-row {
    display: flex;
    align-items: center;
    min-height: 120px;
}

.hand-card {
    margin-left: calc(var(--card-index, 0) * -1px * 20);
}

.hand-card:first-child {
    margin-left: 0;
}

.empty-slot {
    width: 80px;
    height: 112px;
    border: 2px dashed var(--t-border);
    border-radius: var(--t-radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--t-text-muted);
    font-size: 1.5rem;
}
</style>
