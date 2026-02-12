<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'

defineProps<{
    label: string
    value: string
    icon: string
    colorClass: string
}>()
</script>

<template>
    <div class="stat-card">
        <div class="stat-icon-wrap" :class="colorClass">
            <AppIcon :icon="icon" class="stat-icon" />
        </div>
        <div class="stat-content">
            <span class="stat-value">{{ value }}</span>
            <span class="stat-label">{{ label }}</span>
        </div>
    </div>
</template>

<style scoped>
.stat-card {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    box-shadow: var(--t-shadow-sm);
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.stat-card:hover {
    border-color: var(--t-border-hover);
    box-shadow: var(--t-shadow-md);
}

.stat-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: var(--t-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--t-bg-muted);
}

.stat-icon {
    font-size: 1.25rem;
    color: var(--t-text-secondary);
}

.stat-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.stat-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--t-text);
}

.stat-label {
    font-size: var(--t-font-size-xs);
    font-weight: 500;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
    text-transform: uppercase;
}
</style>
