<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'

defineProps<{
    won: boolean
    amount: string
}>()
</script>

<template>
    <div class="result-banner" :class="won ? 'result-win' : 'result-lose'">
        <AppIcon :icon="won ? 'mdi:party-popper' : 'mdi:emoticon-sad'" class="result-icon" />
        <span>{{ won ? $t('gambling.won_amount', { amount }) : $t('gambling.lost_amount', { amount }) }}</span>
    </div>
</template>

<style scoped>
.result-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-5);
    border-radius: var(--t-radius-md);
    font-size: 1.25rem;
    font-weight: var(--t-font-bold);
}

.result-win {
    background: var(--t-success-muted);
    border: 1px solid var(--t-success);
    color: var(--t-success);
}

.result-lose {
    background: var(--t-danger-muted);
    border: 1px solid var(--t-danger);
    color: var(--t-danger);
}

.result-icon {
    font-size: 1.75rem;
}
</style>
