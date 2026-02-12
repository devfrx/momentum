<script setup lang="ts">
/**
 * GameCard — Casino lobby game tile.
 * Displays a game with accent color, category badge, odds/payout,
 * win/loss record, and a play button.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'

defineProps<{
    name: string
    icon: string
    description: string
    odds: string
    payout: string
    category: string
    accent: string
    gamesPlayed: number
    wins: string
    losses: string
    netProfit: string
    isProfitable: boolean
    /** Luck mechanic label(s) — e.g. 'Second Chance', 'Anti-Bust', or empty for Pure RNG */
    luckMechanic: string | string[]
}>()

defineEmits<{ play: [] }>()
</script>

<template>
    <div class="game-card item-card" :style="{ '--card-accent': accent }">
        <!-- Accent stripe -->
        <div class="card-stripe"></div>

        <!-- Header: icon + name + category -->
        <div class="card-head">
            <div class="icon-box">
                <AppIcon :icon="icon" class="game-icon" />
            </div>
            <div class="head-info">
                <h3 class="game-name">{{ name }}</h3>
                <div class="tag-row">
                    <span class="category-tag">{{ category }}</span>
                    <template v-if="Array.isArray(luckMechanic) ? luckMechanic.length : luckMechanic">
                        <span v-for="m in (Array.isArray(luckMechanic) ? luckMechanic : [luckMechanic])" :key="m"
                            class="luck-tag luck-yes">
                            <AppIcon icon="mdi:clover" class="luck-icon" />
                            {{ m }}
                        </span>
                    </template>
                    <span v-else class="luck-tag luck-no">
                        <AppIcon icon="mdi:dice-multiple" class="luck-icon" />
                        {{ $t('gambling.pure_rng') }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Description -->
        <p class="game-desc">{{ description }}</p>

        <!-- Odds / Payout badges -->
        <div class="info-row">
            <div class="info-tile">
                <span class="info-lbl">{{ $t('gambling.odds_label') }}</span>
                <span class="info-val">{{ odds }}</span>
            </div>
            <div class="info-tile">
                <span class="info-lbl">{{ $t('gambling.payout_label') }}</span>
                <span class="info-val">{{ payout }}</span>
            </div>
        </div>

        <!-- Win / Loss record -->
        <div class="record-row">
            <template v-if="gamesPlayed > 0">
                <span class="rec positive">W {{ wins }}</span>
                <span class="rec-dot">·</span>
                <span class="rec negative">L {{ losses }}</span>
                <span class="rec-dot">·</span>
                <span class="rec" :class="isProfitable ? 'positive' : 'negative'">{{ netProfit }}</span>
            </template>
            <span v-else class="rec text-muted">{{ $t('gambling.no_games_yet') }}</span>
        </div>

        <!-- Play -->
        <Button :label="$t('gambling.play')" class="play-btn" @click="$emit('play')" />
    </div>
</template>

<style scoped>
.game-card {
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
    cursor: pointer;
    transition:
        border-color var(--t-transition-normal),
        box-shadow var(--t-transition-normal),
        transform var(--t-transition-normal);
}

.game-card:hover {
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--card-accent) 25%, transparent);
    transform: translateY(-2px);
}

/* Accent top stripe */
.card-stripe {
    height: 3px;
    background: var(--card-accent, var(--t-accent));
}

/* ── Header ─────────────────────────────── */
.card-head {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-4) var(--t-space-5) 0;
}

.icon-box {
    width: 48px;
    height: 48px;
    border-radius: var(--t-radius-md);
    background: color-mix(in srgb, var(--card-accent, var(--t-accent)) 12%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background var(--t-transition-normal);
}

.game-card:hover .icon-box {
    background: color-mix(in srgb, var(--card-accent, var(--t-accent)) 20%, transparent);
}

.game-icon {
    font-size: 1.5rem;
    color: var(--card-accent, var(--t-text-secondary));
}

.head-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
}

.game-name {
    font-size: var(--t-font-size-lg);
    font-weight: 700;
    color: var(--t-text);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tag-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
}

.category-tag {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.luck-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.6rem;
    font-weight: 600;
    padding: 0.1rem 0.4rem;
    border-radius: var(--t-radius-sm);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    line-height: 1.3;
}

.luck-icon {
    font-size: 0.65rem;
}

.luck-yes {
    background: color-mix(in srgb, #22c55e 15%, transparent);
    color: #22c55e;
    border: 1px solid color-mix(in srgb, #22c55e 25%, transparent);
}

.luck-no {
    background: color-mix(in srgb, var(--t-text-muted) 10%, transparent);
    color: var(--t-text-muted);
    border: 1px solid color-mix(in srgb, var(--t-text-muted) 15%, transparent);
}

/* ── Description ────────────────────────── */
.game-desc {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    line-height: 1.5;
    padding: 0 var(--t-space-5);
    margin: var(--t-space-3) 0;
}

/* ── Odds / Payout tiles ────────────────── */
.info-row {
    display: flex;
    gap: var(--t-space-2);
    padding: 0 var(--t-space-5);
    margin-bottom: var(--t-space-3);
}

.info-tile {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.info-lbl {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--t-text-muted);
}

.info-val {
    font-family: var(--t-font-mono);
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

/* ── W / L record ───────────────────────── */
.record-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    padding: 0 var(--t-space-5);
    margin-bottom: var(--t-space-4);
    font-size: var(--t-font-size-sm);
    font-family: var(--t-font-mono);
    min-height: 1.4rem;
}

.rec {
    font-weight: 600;
}

.rec-dot {
    color: var(--t-text-muted);
}

/* ── Play button ────────────────────────── */
.play-btn {
    margin: 0 var(--t-space-5) var(--t-space-5);
    margin-top: auto;
}
</style>
