<script setup lang="ts">
import { computed } from 'vue'
import { useEventStore } from '@renderer/stores/useEventStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'

const events = useEventStore()
const { formatTime } = useFormat()

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
</script>

<template>
    <footer class="app-footer">
        <div class="ticker">
            <template v-if="latestEvent">
                <div class="ticker-event">
                    <AppIcon icon="mdi:bell-ring" class="ticker-icon" />
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

        <div v-if="activeEvents.length > 1" class="event-count">
            <span>{{ $t('footer.active_events', { n: activeEvents.length }) }}</span>
        </div>
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

.event-text {
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-timer {
    flex-shrink: 0;
    color: var(--t-text-muted);
}

.event-count {
    flex-shrink: 0;
    color: var(--t-text-muted);
}
</style>
