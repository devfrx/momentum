<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'

defineProps<{
    totalWon: string
    totalLost: string
    netProfit: string
    isProfitable: boolean
}>()
</script>

<template>
    <div class="overall-stats card-surface">
        <h3 class="stats-title">
            <AppIcon icon="mdi:chart-bar" class="section-icon" />
            {{ $t('gambling.gambling_statistics') }}
        </h3>
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.total_wins') }}</span>
                <span class="stat-value text-emerald">{{ totalWon }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.total_losses') }}</span>
                <span class="stat-value text-red">{{ totalLost }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.net_profit') }}</span>
                <span class="stat-value" :class="isProfitable ? 'positive' : 'negative'">{{ netProfit }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.overall-stats {
    padding: var(--t-space-6);
}

.stats-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: var(--t-font-bold);
    margin-bottom: var(--t-space-4);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--t-space-6);
}

.stat-item {
    display: flex;
    flex-direction: column;
}

.stat-item .stat-label {
    font-size: 0.75rem;
    color: var(--t-text-secondary);
}

.stat-item .stat-value {
    font-family: var(--t-font-mono);
    font-size: 1.1rem;
    font-weight: var(--t-font-bold);
}
</style>
