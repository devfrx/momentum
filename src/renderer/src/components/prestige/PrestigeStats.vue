<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'

defineProps<{
    stats: {
        label: string
        value: string
        icon: string
        color?: string
    }[]
}>()
</script>

<template>
    <div class="prestige-stats">
        <div v-for="stat in stats" :key="stat.label" class="stat-item">
            <div class="stat-icon" :style="{ color: stat.color || 'var(--t-text-secondary)' }">
                <AppIcon :icon="stat.icon" />
            </div>
            <div class="stat-content">
                <span class="stat-label">{{ stat.label }}</span>
                <span class="stat-value" :style="{ color: stat.color || 'var(--t-text)' }">{{ stat.value }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.prestige-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--t-space-3);
}

.stat-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.stat-icon {
    font-size: 1.4rem;
}

.stat-content {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.stat-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-value {
    font-size: 1.1rem;
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
}
</style>
