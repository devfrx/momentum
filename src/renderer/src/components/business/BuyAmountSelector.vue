<script setup lang="ts">
import { UButton } from '@renderer/components/ui'
import type Decimal from 'break_infinity.js'
import { useFormat } from '@renderer/composables/useFormat'

defineProps<{
    modelValue: number
    options?: number[]
    /** If provided, called with each amount to get the total cost to display */
    costFn?: (amount: number) => Decimal
}>()

defineEmits<{
    'update:modelValue': [value: number]
}>()

const { formatCash } = useFormat()
</script>

<template>
    <div class="buy-controls">
        <span class="buy-label">{{ $t('business.purchase_amount') }}</span>
        <div class="buy-buttons">
            <UButton variant="ghost" size="sm" v-for="amount in (options ?? [1, 10, 100])" :key="amount"
                :active="modelValue === amount" @click="$emit('update:modelValue', amount)">
                <span class="btn-amount">x{{ amount }}</span>
                <span v-if="costFn" class="btn-cost">{{ formatCash(costFn(amount)) }}</span>
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

.btn-amount {
    font-weight: var(--t-font-semibold);
}

.btn-cost {
    display: block;
    font-size: 0.7rem;
    color: var(--t-text-muted);
    font-family: var(--t-font-mono);
    line-height: 1;
    margin-top: 2px;
}
</style>
