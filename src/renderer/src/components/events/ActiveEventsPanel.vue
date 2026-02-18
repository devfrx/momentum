<script setup lang="ts">
/**
 * ActiveEventsPanel — Full overlay showing all active events
 *
 * Follows the same pattern as MultiplierBreakdownPanel:
 * teleported overlay with accordion-style event cards.
 */
import { ref } from 'vue'
import { useActiveEvents } from '@renderer/composables/useActiveEvents'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'

const emit = defineEmits<{ close: [] }>()

const { enrichedEvents, formatTime } = useActiveEvents()

const expandedEvent = ref<string | null>(null)

function toggleEvent(id: string): void {
    expandedEvent.value = expandedEvent.value === id ? null : id
}
</script>

<template>
    <Teleport to="body">
        <div class="ep-overlay" @click.self="emit('close')">
            <div class="ep-panel">
                <!-- Header -->
                <div class="ep-header">
                    <div class="ep-title">
                        <AppIcon icon="mdi:bell-ring" class="title-icon" />
                        <h2>{{ $t('events.panel_title') }}</h2>
                    </div>
                    <UButton variant="ghost" icon="mdi:close" @click="emit('close')" />
                </div>

                <!-- Body -->
                <div class="ep-body">
                    <!-- Empty state -->
                    <div v-if="enrichedEvents.length === 0" class="ep-empty">
                        <AppIcon icon="mdi:sleep" class="empty-icon" />
                        <p>{{ $t('events.no_active') }}</p>
                    </div>

                    <!-- Event cards -->
                    <div v-for="ev in enrichedEvents" :key="ev.id" class="ep-event"
                        :class="{ expanded: expandedEvent === ev.id, positive: ev.isPositive, negative: !ev.isPositive }">
                        <div class="event-header" @click="toggleEvent(ev.id)">
                            <div class="event-left">
                                <div class="event-icon-wrap"
                                    :class="{ positive: ev.isPositive, negative: !ev.isPositive }">
                                    <AppIcon :icon="ev.icon" class="event-icon" />
                                </div>
                                <div class="event-info">
                                    <span class="event-name">{{ ev.name }}</span>
                                    <span class="event-category">{{ $t(`events.categories.${ev.category}`) }}</span>
                                </div>
                            </div>
                            <div class="event-right">
                                <span class="event-timer">
                                    <AppIcon icon="mdi:timer-outline" class="timer-icon" />
                                    {{ formatTime(ev.timeRemaining) }}
                                </span>
                                <AppIcon :icon="expandedEvent === ev.id ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                                    class="event-chevron" />
                            </div>
                        </div>

                        <!-- Progress bar -->
                        <div class="event-progress-track">
                            <div class="event-progress-fill"
                                :class="{ positive: ev.isPositive, negative: !ev.isPositive }"
                                :style="{ width: `${ev.progress}%` }" />
                        </div>

                        <!-- Expanded details -->
                        <transition name="expand">
                            <div v-if="expandedEvent === ev.id" class="event-details">
                                <p class="event-description">{{ ev.description }}</p>
                                <div class="effects-list">
                                    <div class="effects-title">
                                        <AppIcon icon="mdi:lightning-bolt" class="effects-title-icon" />
                                        {{ $t('events.effects_label') }}
                                    </div>
                                    <div v-for="(eff, i) in ev.effects" :key="i" class="effect-line"
                                        :class="{ positive: eff.isPositive, negative: !eff.isPositive }">
                                        <span class="effect-label">{{ $t(eff.labelKey) }}</span>
                                        <span class="effect-value">{{ eff.labelParams.value }}</span>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.ep-overlay {
    position: fixed;
    inset: 0;
    background: var(--t-overlay);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(3px);
    padding-bottom: calc(var(--t-footer-height, 32px) + 8px);
}

.ep-panel {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    width: 480px;
    max-width: 95vw;
    max-height: calc(100vh - var(--t-footer-height, 32px) - var(--t-header-height, 40px) - 32px);
    display: flex;
    flex-direction: column;
    box-shadow: var(--t-shadow-lg);
}

.ep-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--t-border);
    flex-shrink: 0;
}

.ep-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.title-icon {
    font-size: 1.15rem;
    color: var(--t-text-secondary);
}

.ep-title h2 {
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    margin: 0;
}

.ep-body {
    overflow-y: auto;
    padding: 0.5rem;
    flex: 1;
}

/* Empty state */
.ep-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem 1rem;
    color: var(--t-text-muted);
}

.empty-icon {
    font-size: 1.9rem;
}

/* Event card */
.ep-event {
    border-radius: var(--t-radius-md);
    margin-bottom: 4px;
    overflow: hidden;
    border: 1px solid transparent;
    transition: border-color var(--t-transition-fast);
}

.ep-event:hover {
    border-color: var(--t-border-hover);
}

.event-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.75rem;
    cursor: pointer;
    border-radius: var(--t-radius-md);
    transition: background var(--t-transition-fast);
}

.event-header:hover {
    background: var(--t-bg-muted);
}

.event-header:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}

.event-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
}

.event-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--t-radius-sm);
    flex-shrink: 0;
}

.event-icon-wrap.positive {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.event-icon-wrap.negative {
    background: var(--t-danger-muted);
    color: var(--t-danger);
}

.event-icon {
    font-size: 1.1rem;
}

.event-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.event-name {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-category {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: capitalize;
}

.event-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
}

.event-timer {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    font-weight: var(--t-font-medium);
}

.timer-icon {
    font-size: 0.8rem;
}

.event-chevron {
    font-size: 0.85rem;
    color: var(--t-text-muted);
}

/* Progress bar */
.event-progress-track {
    height: 2px;
    background: var(--t-bg-muted);
    margin: 0 0.75rem;
}

.event-progress-fill {
    height: 100%;
    transition: width 0.3s linear;
    border-radius: var(--t-radius-xs);
}

.event-progress-fill.positive {
    background: var(--t-success);
}

.event-progress-fill.negative {
    background: var(--t-danger);
}

/* Details */
.event-details {
    padding: 0.5rem 0.75rem 0.75rem;
}

.event-description {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    margin: 0 0 0.5rem;
    line-height: 1.4;
}

.effects-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.effects-title {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
    margin-bottom: 0.25rem;
}

.effects-title-icon {
    font-size: 0.8rem;
    color: var(--t-warning);
}

.effect-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.2rem 0.5rem;
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
}

.effect-line:hover {
    background: var(--t-bg-muted);
}

.effect-label {
    color: var(--t-text-secondary);
}

.effect-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    white-space: nowrap;
}

.effect-line.positive .effect-value {
    color: var(--t-success);
}

.effect-line.negative .effect-value {
    color: var(--t-danger);
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
    transition: all var(--t-transition-fast) ease;
    overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
    opacity: 1;
    max-height: 500px;
}
</style>
