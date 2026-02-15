<script setup lang="ts">
/**
 * EventImpactBanner — Per-page banner showing active events affecting the current view
 *
 * Drop this into any view and provide the route name.
 * It automatically shows only events that have effects on that page.
 */
import { computed } from 'vue'
import { useActiveEvents, type RouteEventImpact } from '@renderer/composables/useActiveEvents'
import AppIcon from '@renderer/components/AppIcon.vue'

const props = defineProps<{
    /** The route name to filter events for (e.g. 'business', 'stocks') */
    routeName: string
}>()

const { eventsForRoute, formatTime } = useActiveEvents()

const impacts = computed<RouteEventImpact[]>(() => eventsForRoute(props.routeName))
</script>

<template>
    <transition name="banner-slide">
        <div v-if="impacts.length > 0" class="event-impact-banner">
            <div class="banner-header">
                <AppIcon icon="mdi:lightning-bolt-circle" class="banner-icon" />
                <span class="banner-title">{{ $t('events.impact_title') }}</span>
                <span class="banner-count">{{ impacts.length }}</span>
            </div>
            <div class="banner-events">
                <div v-for="impact in impacts" :key="impact.event.id" class="impact-chip"
                    :class="{ positive: impact.event.isPositive, negative: !impact.event.isPositive }"
                    :title="impact.event.description">
                    <AppIcon :icon="impact.event.icon" class="chip-icon" />
                    <span class="chip-name">{{ impact.event.name }}</span>
                    <span class="chip-effects">
                        <span v-for="(eff, i) in impact.relevantEffects" :key="i" class="chip-effect-value"
                            :class="{ positive: eff.isPositive, negative: !eff.isPositive }">{{ eff.labelParams.value
                            }}</span>
                    </span>
                    <span class="chip-timer">{{ formatTime(impact.event.timeRemaining) }}</span>
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.event-impact-banner {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.75rem;
}

.banner-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: 0.35rem;
}

.banner-icon {
    font-size: 0.9rem;
    color: var(--t-warning);
}

.banner-title {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.banner-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    background: var(--t-accent);
    color: var(--t-text-inverse);
    font-size: 0.65rem;
    font-weight: 700;
}

.banner-events {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.impact-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.5rem;
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
    border: 1px solid transparent;
    transition: all 0.15s;
    cursor: default;
}

.impact-chip.positive {
    background: var(--t-success-muted);
    border-color: color-mix(in srgb, var(--t-success) 20%, transparent);
}

.impact-chip.negative {
    background: var(--t-danger-muted);
    border-color: color-mix(in srgb, var(--t-danger) 20%, transparent);
}

.chip-icon {
    font-size: 0.85rem;
}

.impact-chip.positive .chip-icon {
    color: var(--t-success);
}

.impact-chip.negative .chip-icon {
    color: var(--t-danger);
}

.chip-name {
    font-weight: 500;
    color: var(--t-text);
    white-space: nowrap;
}

.chip-effects {
    display: flex;
    gap: 0.2rem;
}

.chip-effect-value {
    font-family: var(--t-font-mono);
    font-weight: 700;
    font-size: var(--t-font-size-xs);
}

.chip-effect-value.positive {
    color: var(--t-success);
}

.chip-effect-value.negative {
    color: var(--t-danger);
}

.chip-timer {
    font-family: var(--t-font-mono);
    font-size: 0.65rem;
    color: var(--t-text-muted);
    margin-left: 0.15rem;
}

/* Banner transition */
.banner-slide-enter-active,
.banner-slide-leave-active {
    transition: all 0.25s ease;
    overflow: hidden;
}

.banner-slide-enter-from,
.banner-slide-leave-to {
    opacity: 0;
    max-height: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.banner-slide-enter-to,
.banner-slide-leave-from {
    opacity: 1;
    max-height: 200px;
}
</style>
