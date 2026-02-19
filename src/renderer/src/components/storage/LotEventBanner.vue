<script setup lang="ts">
/**
 * LotEventBanner — Displays lot events/surprises during an auction.
 *
 * Shows unread on_reveal events as a dramatic banner, on_bid events as
 * mid-auction popups, and on_win events in the results screen.
 *
 * Follows the same chip pattern as EventImpactBanner.vue but with a
 * garage-auction vibe: dramatic colors, gavel icons, themed moods.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { UTooltip } from '@renderer/components/ui'
import { useFormat } from '@renderer/composables/useFormat'
import { D } from '@renderer/core/BigNum'
import { useI18n } from 'vue-i18n'
import type { ActiveLotEvent } from '@renderer/data/storage/lotEvents'

defineProps<{
    events: ActiveLotEvent[]
    /** Only show events matching this timing */
    timing?: 'on_reveal' | 'on_bid' | 'on_win'
    /** Compact mode for inline display */
    compact?: boolean
}>()

const { formatCash } = useFormat()
const { t } = useI18n()

function moodClass(mood: string): string {
    switch (mood) {
        case 'positive': return 'lot-event--positive'
        case 'negative': return 'lot-event--negative'
        case 'dramatic': return 'lot-event--dramatic'
        default: return 'lot-event--neutral'
    }
}

function moodIcon(mood: string): string {
    switch (mood) {
        case 'positive': return 'mdi:thumb-up'
        case 'negative': return 'mdi:thumb-down'
        case 'dramatic': return 'mdi:exclamation-thick'
        default: return 'mdi:information'
    }
}

/**
 * Parse a bidder_reveal result key: "Name:maxBid"
 */
function parseRevealInfo(resultKey: string): { name: string; budget: string } | null {
    const colonIdx = resultKey.indexOf(':')
    if (colonIdx === -1) return null
    return {
        name: resultKey.slice(0, colonIdx),
        budget: resultKey.slice(colonIdx + 1),
    }
}
</script>

<template>
    <TransitionGroup name="lot-event-slide" tag="div" class="lot-event-banner"
        :class="{ 'lot-event-banner--compact': compact }">
        <div v-for="ev in events.filter(e => !timing || e.def.timing === timing)" :key="ev.eventId"
            class="lot-event-chip" :class="moodClass(ev.def.mood)">

            <!-- Event icon -->
            <span class="lot-event-chip__icon">
                <AppIcon :icon="ev.def.icon" />
            </span>

            <!-- Event content -->
            <div class="lot-event-chip__body">
                <span class="lot-event-chip__name">
                    {{ t(`storage.lot_event_${ev.def.i18nKey}`) }}
                </span>
                <span class="lot-event-chip__desc">
                    {{ t(`storage.lot_event_${ev.def.i18nKey}_desc`) }}
                </span>
            </div>

            <!-- Mood indicator -->
            <UTooltip :text="ev.def.mood" placement="top">
                <span class="lot-event-chip__mood">
                    <AppIcon :icon="moodIcon(ev.def.mood)" />
                </span>
            </UTooltip>

            <!-- Bidder reveal info (special) -->
            <div v-if="ev.resultKeys.length > 0" class="lot-event-chip__reveals">
                <span v-for="(rk, idx) in ev.resultKeys" :key="idx" class="lot-event-chip__reveal-info">
                    <template v-if="parseRevealInfo(rk)">
                        <AppIcon icon="mdi:eye" />
                        {{ parseRevealInfo(rk)?.name }}:
                        <strong>{{ formatCash(D(parseRevealInfo(rk)?.budget ?? '0')) }}</strong>
                    </template>
                </span>
            </div>
        </div>
    </TransitionGroup>
</template>

<style scoped>
.lot-event-banner {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.lot-event-banner--compact {
    gap: var(--t-space-1);
}

.lot-event-chip {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    border-radius: var(--t-radius-sm);
    border-left: 3px solid transparent;
    transition: all var(--t-transition-normal);
    font-size: var(--t-font-size-sm);
}

.lot-event-chip.lot-event--positive {
    background: color-mix(in srgb, var(--t-success) 10%, transparent);
    border-left-color: var(--t-success);
}

.lot-event-chip.lot-event--negative {
    background: color-mix(in srgb, var(--t-danger) 10%, transparent);
    border-left-color: var(--t-danger);
}

.lot-event-chip.lot-event--dramatic {
    background: color-mix(in srgb, var(--t-warning) 12%, transparent);
    border-left-color: var(--t-warning);
}

.lot-event-chip.lot-event--neutral {
    background: color-mix(in srgb, var(--t-info) 8%, transparent);
    border-left-color: var(--t-info);
}

.lot-event-chip__icon {
    font-size: 1.2rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
}

.lot-event--positive .lot-event-chip__icon {
    color: var(--t-success);
}

.lot-event--negative .lot-event-chip__icon {
    color: var(--t-danger);
}

.lot-event--dramatic .lot-event-chip__icon {
    color: var(--t-warning);
}

.lot-event--neutral .lot-event-chip__icon {
    color: var(--t-info);
}

.lot-event-chip__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
}

.lot-event-chip__name {
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    line-height: 1.3;
}

.lot-event-chip__desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    line-height: 1.3;
}

.lot-event-chip__mood {
    font-size: 0.85rem;
    opacity: 0.5;
    flex-shrink: 0;
}

.lot-event-chip__reveals {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-left: var(--t-space-1);
    padding-left: var(--t-space-2);
    border-left: 1px solid var(--t-border);
}

.lot-event-chip__reveal-info {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.lot-event-chip__reveal-info strong {
    color: var(--t-warning);
    font-weight: var(--t-font-semibold);
}

.lot-event-banner--compact .lot-event-chip {
    padding: var(--t-space-1) var(--t-space-2);
    font-size: var(--t-font-size-xs);
}

.lot-event-banner--compact .lot-event-chip__icon {
    font-size: 1rem;
}

.lot-event-banner--compact .lot-event-chip__desc {
    display: none;
}

/* Transitions */
.lot-event-slide-enter-active {
    transition: all 0.4s ease-out;
}

.lot-event-slide-leave-active {
    transition: all 0.3s ease-in;
}

.lot-event-slide-enter-from {
    opacity: 0;
    transform: translateX(-12px);
}

.lot-event-slide-leave-to {
    opacity: 0;
    transform: translateX(12px);
}
</style>
