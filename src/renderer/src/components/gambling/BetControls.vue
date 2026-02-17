<script setup lang="ts">
import InputNumber from 'primevue/inputnumber'
import { UButton } from '@renderer/components/ui'

defineProps<{
    modelValue: number
    maxBet: number
}>()

const emit = defineEmits<{
    'update:modelValue': [value: number]
}>()

function updateBet(value: number): void {
    emit('update:modelValue', value)
}
</script>

<template>
    <div class="bet-controls card-surface">
        <label class="bet-label">{{ $t('gambling.bet_amount_label') }}</label>
        <InputNumber :modelValue="modelValue" @update:modelValue="(v: number) => updateBet(v)" :min="1" mode="currency"
            currency="USD" locale="en-US" class="bet-input" />
        <div class="bet-multipliers">
            <UButton variant="ghost" size="sm" @click="updateBet(modelValue * 2)">{{ $t('gambling.double') }}</UButton>
            <UButton variant="ghost" size="sm" @click="updateBet(modelValue * 5)">{{ $t('gambling.x5') }}</UButton>
            <UButton variant="ghost" size="sm" @click="updateBet(modelValue * 10)">{{ $t('gambling.x10') }}</UButton>
            <UButton variant="ghost" size="sm" @click="updateBet(maxBet)">{{ $t('gambling.max') }}</UButton>
        </div>
    </div>
</template>

<style scoped>
.bet-controls {
    display: flex;
    align-items: center;
    gap: var(--t-space-4);
    padding: var(--t-space-4) var(--t-space-6);
    flex-wrap: wrap;
}

.bet-label {
    font-size: 0.9rem;
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
}

.bet-input {
    width: 150px;
}

.bet-multipliers {
    display: flex;
    gap: 4px;
}
</style>
