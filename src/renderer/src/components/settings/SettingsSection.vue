<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'

defineProps<{
    icon: string
    title: string
    danger?: boolean
}>()
</script>

<template>
    <section class="settings-section" :class="{ danger }">
        <h2 class="settings-section-title" :class="{ 'is-danger': danger }">
            <AppIcon :icon="icon" />
            {{ title }}
        </h2>
        <slot />
    </section>
</template>

<style scoped>
.settings-section {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-5);
    margin-bottom: var(--t-space-5);
    box-shadow: var(--t-shadow-sm);
}

.settings-section-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-lg);
    font-weight: 600;
    color: var(--t-text);
    margin-bottom: var(--t-space-4);
}

.settings-section-title.is-danger {
    color: var(--t-danger);
}
</style>
