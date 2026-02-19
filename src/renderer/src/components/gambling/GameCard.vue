<script setup lang="ts">
/**
 * GameCard — Casino lobby game tile.
 * Displays a game with accent color, category badge, odds/payout,
 * win/loss record, and a play button.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton, UCard } from '@renderer/components/ui'

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
    <UCard class="game-card" radius="md" :interactive="true" :accent="accent">

        <template #header>
            <div class="game-card__head">
                <AppIcon :icon="icon" class="game-card__icon" />
                <div class="game-card__identity">
                    <div class="game-card__name-row">
                        <span class="game-card__name">{{ name }}</span>
                    </div>
                    <span class="game-card__tagline">{{ description }}</span>
                </div>
                <span class="game-card__stage">{{ category }}</span>
            </div>
        </template>

        <!-- Meta row: luck mechanic tags -->
        <div class="game-card__meta">
            <template v-if="Array.isArray(luckMechanic) ? luckMechanic.length : luckMechanic">
                <span v-for="m in (Array.isArray(luckMechanic) ? luckMechanic : [luckMechanic])" :key="m"
                    class="game-card__trait game-card__trait--pos">
                    <AppIcon icon="mdi:clover" />
                    {{ m }}
                </span>
            </template>
            <span v-else class="game-card__trait game-card__trait--neutral">
                <AppIcon icon="mdi:dice-multiple" />
                {{ $t('gambling.pure_rng') }}
            </span>
        </div>

        <!-- Stats grid: odds / payout / record -->
        <div class="game-card__stats">
            <div class="game-card__kpi">
                <span class="game-card__kpi-label">{{ $t('gambling.odds_label') }}</span>
                <span class="game-card__kpi-value game-card__kpi-value--blue">{{ odds }}</span>
            </div>
            <div class="game-card__kpi">
                <span class="game-card__kpi-label">{{ $t('gambling.payout_label') }}</span>
                <span class="game-card__kpi-value game-card__kpi-value--green">{{ payout }}</span>
            </div>
            <div class="game-card__kpi">
                <span class="game-card__kpi-label">{{ $t('gambling.record_label', 'Record') }}</span>
                <template v-if="gamesPlayed > 0">
                    <span class="game-card__kpi-value"
                        :class="isProfitable ? 'game-card__kpi-value--green' : 'game-card__kpi-value--red'">
                        {{ wins }}W / {{ losses }}L
                    </span>
                </template>
                <span v-else class="game-card__kpi-value game-card__kpi-value--muted">—</span>
            </div>
        </div>

        <!-- Net profit (if played) -->
        <div v-if="gamesPlayed > 0" class="game-card__net">
            <span class="game-card__net-label">{{ $t('gambling.net') }}</span>
            <span class="game-card__net-value" :class="isProfitable ? 'positive' : 'negative'">{{ netProfit }}</span>
        </div>

        <template #footer>
            <UButton variant="primary" size="xs" @click="$emit('play')">
                {{ $t('gambling.play') }}</UButton>
        </template>
    </UCard>
</template>

<style scoped>
.game-card:focus-visible {
    outline: 2px solid var(--t-accent);
    outline-offset: 2px;
}

/* ─── Head ─── */
.game-card__head {
    display: flex;
    align-items: flex-start;
    width: 100%;
    gap: var(--t-space-3);
}

.game-card__icon {
    font-size: 1.5rem;
    color: var(--_accent);
    flex-shrink: 0;
    margin-top: 1px;
}

.game-card__identity {
    flex: 1;
    min-width: 0;
}

.game-card__name-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.game-card__name {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-base);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.game-card__tagline {
    display: block;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
}

.game-card__stage {
    flex-shrink: 0;
    font-size: 0.65rem;
    font-weight: var(--t-font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: var(--t-radius-xs);
    background: var(--t-bg-muted);
    color: var(--_accent);
}

/* ─── Meta / Traits ─── */
.game-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.game-card__trait {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 6px;
    border-radius: var(--t-radius-xs);
    font-size: 0.68rem;
    font-weight: var(--t-font-medium);
    line-height: 1.5;
}

.game-card__trait--pos {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.game-card__trait--neutral {
    background: var(--t-bg-muted);
    color: var(--t-text-muted);
}

/* ─── Stats grid ─── */
.game-card__stats {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.game-card__kpi {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.game-card__kpi:not(:first-child) {
    text-align: right;
    padding-left: var(--t-space-3);
    border-left: 1px solid var(--t-border);
}

.game-card__kpi-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
}

.game-card__kpi-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
}

.game-card__kpi-value--gold {
    color: var(--t-warning);
}

.game-card__kpi-value--blue {
    color: var(--t-info);
}

.game-card__kpi-value--green {
    color: var(--t-success);
}

.game-card__kpi-value--red {
    color: var(--t-danger);
}

.game-card__kpi-value--muted {
    color: var(--t-text-muted);
}

/* ─── Net profit row ─── */
.game-card__net {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--t-font-size-xs);
}

.game-card__net-label {
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.game-card__net-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-sm);
}
</style>
