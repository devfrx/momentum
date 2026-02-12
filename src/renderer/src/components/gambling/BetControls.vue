<script setup lang="ts">
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'

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
    <div class="bet-controls glass-card-static">
        <label class="bet-label">{{ $t('gambling.bet_amount_label') }}</label>
        <InputNumber :modelValue="modelValue" @update:modelValue="(v: number) => updateBet(v)" :min="1" mode="currency"
            currency="USD" locale="en-US" class="bet-input" />
        <div class="bet-multipliers">
            <Button :label="$t('gambling.double')" size="small" severity="secondary" outlined
                @click="updateBet(modelValue * 2)" />
            <Button :label="$t('gambling.x5')" size="small" severity="secondary" outlined
                @click="updateBet(modelValue * 5)" />
            <Button :label="$t('gambling.x10')" size="small" severity="secondary" outlined
                @click="updateBet(modelValue * 10)" />
            <Button :label="$t('gambling.max')" size="small" severity="secondary" @click="updateBet(maxBet)" />
        </div>
    </div>
</template>

<style scoped>
.bet-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    flex-wrap: wrap;
}

.bet-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text-muted);
}

.bet-input {
    width: 150px;
}

.bet-multipliers {
    display: flex;
    gap: 4px;
}
</style>
