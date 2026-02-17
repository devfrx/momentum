<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'
import ProgressBar from 'primevue/progressbar'

defineProps<{
    currentEra: {
        id: string
        name: string
        icon: string
        themeColor: string
        globalBonus: number
    }
    nextEra: {
        id: string
        name: string
        icon: string
        pointsRequired: { toNumber: () => number }
    } | null
    progress: number
    totalPoints: string
}>()
</script>

<template>
    <div class="era-progress">
        <div class="era-current">
            <div class="era-icon-wrap"
                :style="{ backgroundColor: currentEra.themeColor + '20', borderColor: currentEra.themeColor }">
                <AppIcon :icon="currentEra.icon" class="era-icon" :style="{ color: currentEra.themeColor }" />
            </div>
            <div class="era-info">
                <span class="era-label">{{ $t('prestige.current_era') }}</span>
                <h3 class="era-name" :style="{ color: currentEra.themeColor }">{{ currentEra.name }}</h3>
                <span class="era-bonus">
                    <AppIcon icon="mdi:trending-up" />
                    {{ $t('prestige.global_bonus', { n: (currentEra.globalBonus * 100).toFixed(0) }) }}
                </span>
            </div>
        </div>

        <div v-if="nextEra" class="era-progress-section">
            <div class="progress-header">
                <span class="progress-label">{{ $t('prestige.progress_next_era') }}</span>
                <span class="progress-value">{{ totalPoints }} / {{ nextEra.pointsRequired.toNumber().toLocaleString()
                    }} PP</span>
            </div>
            <ProgressBar :value="progress" :showValue="false" class="era-progress-bar" />
            <!-- <div class="era-next">
        <AppIcon :icon="nextEra.icon" class="next-era-icon" />
        <span>{{ nextEra.name }}</span>
      </div> -->
        </div>

        <div v-else class="era-max">
            <AppIcon icon="mdi:crown" class="max-icon" />
            <span>{{ $t('prestige.max_era_reached') }}</span>
        </div>
    </div>
</template>

<style scoped>
.era-progress {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-xl);
    padding: var(--t-space-6);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-5);
}

.era-current {
    display: flex;
    align-items: center;
    gap: var(--t-space-4);
}

.era-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: var(--t-radius-lg);
    border: 2px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.era-icon {
    font-size: 1.9rem;
}

.era-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.era-label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--t-text-muted);
}

.era-name {
    font-size: 1.5rem;
    font-weight: var(--t-font-bold);
    margin: 0;
}

.era-bonus {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
}

.era-progress-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.progress-label {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
}

.progress-value {
    font-size: var(--t-font-size-sm);
    font-family: var(--t-font-mono);
    color: var(--t-text);
}

.era-progress-bar :deep(.p-progressbar) {
    height: 8px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-full);
}

.era-progress-bar :deep(.p-progressbar-value) {
    background: var(--t-primary);
}

.era-next {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.next-era-icon {
    font-size: 1rem;
}

.era-max {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: var(--t-space-4);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-lg);
    color: var(--t-warning);
    font-weight: var(--t-font-semibold);
}

.max-icon {
    font-size: 1.15rem;
}
</style>
