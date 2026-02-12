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
    <div class="overall-stats glass-card-static">
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
    padding: var(--spacing-lg);
}

.stats-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: var(--spacing-md);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-lg);
}

.stat-item {
    display: flex;
    flex-direction: column;
}

.stat-item .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-dim);
}

.stat-item .stat-value {
    font-family: var(--font-mono);
    font-size: 1.1rem;
    font-weight: 700;
}
</style>
