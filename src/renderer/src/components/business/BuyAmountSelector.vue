<script setup lang="ts">
import { UButton } from '@renderer/components/ui'

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
            <UButton variant="ghost" size="sm" v-for="amount in (options ?? [1, 10, 100])" :key="amount"
                :active="modelValue === amount" @click="$emit('update:modelValue', amount)">
                x{{ amount }}
            </UButton>
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

</style>
