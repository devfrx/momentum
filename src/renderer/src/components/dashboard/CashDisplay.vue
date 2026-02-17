<script setup lang="ts">
defineProps<{
    label: string
    value: string
}>()
</script>

<template>
    <div class="cash-display">
        <span class="cash-label">{{ label }}</span>
        <span class="cash-value">{{ value }}</span>
    </div>
</template>

<style scoped>
.cash-display {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: var(--t-space-3) var(--t-space-5);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.cash-label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--t-text-muted);
}

.cash-value {
    font-family: var(--t-font-mono);
    font-size: 1.5rem;
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    letter-spacing: -0.02em;
}
</style>
