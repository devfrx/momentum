<script setup lang="ts">
defineProps<{
    label: string
    description: string
    danger?: boolean
}>()
</script>

<template>
    <div class="setting-row">
        <div class="setting-info">
            <label class="setting-label" :class="{ 'is-danger': danger }">{{ label }}</label>
            <p class="setting-description">{{ description }}</p>
        </div>
        <slot />
    </div>
</template>

<style scoped>
.setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-3) 0;
    border-bottom: 1px solid var(--t-border);
    gap: var(--t-space-4);
}

.setting-row:last-child {
    border-bottom: none;
}

.setting-info {
    flex: 1;
}

.setting-label {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-base);
    color: var(--t-text);
}

.setting-label.is-danger {
    color: var(--t-danger);
}

.setting-description {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    margin-top: 0.1rem;
}
</style>
