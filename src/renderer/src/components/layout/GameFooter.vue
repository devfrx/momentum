<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEventStore } from '@renderer/stores/useEventStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'
import { ActiveEventsPanel } from '@renderer/components/events'

const events = useEventStore()
const { formatTime } = useFormat()

const showEventsPanel = ref(false)

const activeEvents = computed(() => events.activeEvents)

const latestEvent = computed(() => {
    const ae = activeEvents.value[0]
    if (!ae) return null
    const def = events.getSystem().getDefinition(ae.eventId)
    return {
        name: def?.name ?? ae.eventId,
        description: def?.description ?? '',
        timeRemaining: ae.ticksRemaining / 10
    }
})

function toggleEventsPanel(): void {
    if (activeEvents.value.length > 0) {
        showEventsPanel.value = !showEventsPanel.value
    }
}
</script>

<template>
    <footer class="app-footer" :class="{ clickable: activeEvents.length > 0 }" @click="toggleEventsPanel">
        <div class="ticker">
            <template v-if="latestEvent">
                <div class="ticker-event">
                    <AppIcon icon="mdi:bell-ring" class="ticker-icon pulse" />
                    <span class="event-text">
                        <strong>{{ latestEvent.name }}</strong> — {{ latestEvent.description }}
                    </span>
                    <span class="event-timer">
                        {{ formatTime(latestEvent.timeRemaining) }}
                    </span>
                </div>
            </template>
            <template v-else>
                <div class="ticker-idle">
                    <AppIcon icon="mdi:information-outline" class="ticker-icon" />
                    <span>{{ $t('footer.no_events') }}</span>
                </div>
            </template>
        </div>

        <div v-if="activeEvents.length > 0" class="event-count-badge" @click.stop="toggleEventsPanel">
            <AppIcon icon="mdi:bell-badge" class="badge-icon" />
            <span>{{ activeEvents.length }}</span>
        </div>

        <ActiveEventsPanel v-if="showEventsPanel" @close="showEventsPanel = false" />
    </footer>
</template>

<style scoped>
.app-footer {
    display: flex;
    align-items: center;
    height: var(--t-footer-height);
    background: var(--t-bg-footer);
    border-top: 1px solid var(--t-border);
    padding: 0 var(--t-space-4);
    font-size: var(--t-font-size-xs);
    gap: var(--t-space-4);
    color: var(--t-text-muted);
    user-select: none;
}

.app-footer.clickable {
    cursor: pointer;
    transition: background 0.15s;
}

.app-footer.clickable:hover {
    background: var(--t-bg-muted);
}

.ticker {
    flex: 1;
    overflow: hidden;
}

.ticker-event,
.ticker-idle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ticker-icon {
    font-size: 0.85rem;
    flex-shrink: 0;
}

.ticker-icon.pulse {
    animation: bell-pulse 2s ease-in-out infinite;
    color: var(--t-warning);
}

@keyframes bell-pulse {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.6;
        transform: scale(1.15);
    }
}

.event-text {
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-timer {
    flex-shrink: 0;
    color: var(--t-text-muted);
    font-family: var(--t-font-mono);
}

.event-count-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
    background: color-mix(in srgb, var(--t-accent) 15%, transparent);
    color: var(--t-accent);
    font-weight: 700;
    font-size: var(--t-font-size-xs);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
}

.event-count-badge:hover {
    background: color-mix(in srgb, var(--t-accent) 25%, transparent);
}

.badge-icon {
    font-size: 0.85rem;
}
</style>
