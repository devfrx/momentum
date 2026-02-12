<script setup lang="ts">
defineProps<{
    modelValue: number
    options?: number[]
}>()

defineEmits<{
    'update:modelValue': [value: number]
}>()
</script>

<template>
    <div class="buy-controls">
        <span class="buy-label">{{ $t('business.purchase_amount') }}</span>
        <div class="buy-buttons">
            <button v-for="amount in (options ?? [1, 10, 100])" :key="amount" class="buy-btn"
                :class="{ active: modelValue === amount }" @click="$emit('update:modelValue', amount)">
                x{{ amount }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.buy-controls {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.buy-label {
    font-size: 0.85rem;
    color: var(--t-text-secondary);
}

.buy-buttons {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.buy-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    background: transparent;
    border: none;
    border-radius: var(--t-radius-sm);
    color: var(--t-text-secondary);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.buy-btn:hover {
    background: var(--t-bg-card-hover);
    color: var(--t-text);
}

.buy-btn.active {
    background: var(--t-text);
    color: var(--t-text-inverse);
}
</style>
