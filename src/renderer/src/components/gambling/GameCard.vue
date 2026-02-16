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
    <div class="game-card" :style="{ '--_accent': accent }">

        <!-- Top row: icon + name + category badge -->
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

        <!-- Actions -->
        <div class="game-card__actions">
            <Button :label="$t('gambling.play')" size="small" class="game-card__btn game-card__btn--primary"
                @click="$emit('play')" />
        </div>
    </div>
</template>

<style scoped>
/* ─── Card shell (matches opp-card) ─── */
.game-card {
    --_accent: var(--t-accent);
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4) var(--t-space-4) var(--t-space-4) calc(var(--t-space-4) + 4px);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    box-shadow: var(--t-shadow-sm);
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
    cursor: pointer;
}

/* .game-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    left: -1px;
    width: 4px;
    border-radius: var(--t-radius-md) 0 0 var(--t-radius-md);
    background: var(--_accent);
} */

.game-card:hover {
    border-color: var(--t-border-hover);
    box-shadow: var(--t-shadow-sm);
}

/* ─── Head ─── */
.game-card__head {
    display: flex;
    align-items: flex-start;
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
    font-weight: 600;
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
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--_accent) 12%, transparent);
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
    border-radius: 4px;
    font-size: 0.68rem;
    font-weight: 500;
    line-height: 1.5;
}

.game-card__trait--pos {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.game-card__trait--neutral {
    background: color-mix(in srgb, var(--t-text-muted) 10%, transparent);
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
    font-weight: 600;
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
    font-weight: 600;
    font-size: var(--t-font-size-sm);
}

/* ─── Actions ─── */
.game-card__actions {
    display: flex;
    gap: var(--t-space-2);
    justify-content: flex-end;
    margin-top: auto;
}

.game-card__btn {
    font-size: var(--t-font-size-xs) !important;
}

.game-card__btn--primary {
    font-weight: 600;
}
</style>
