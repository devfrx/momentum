<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'
import { UCard } from '@renderer/components/ui'
import { useI18n } from 'vue-i18n'
import type { MilestoneReward } from '@renderer/data/prestige'

const { t } = useI18n()

defineProps<{
    name: string
    description: string
    icon: string
    unlocked: boolean
    rewards: MilestoneReward[]
}>()

function formatReward(reward: MilestoneReward): string {
    const value = reward.value * 100
    const n = value.toFixed(0)
    switch (reward.type) {
        case 'global_multiplier':
            return t('prestige.effect_all_income', { n })
        case 'prestige_gain':
            return t('prestige.effect_prestige_gain', { n })
        case 'starting_cash':
            return t('prestige.effect_starting_cash', { n: reward.value.toLocaleString() })
        case 'starting_xp':
            return t('prestige.effect_starting_xp', { n: reward.value.toLocaleString() })
        case 'xp_gain':
            return t('prestige.effect_xp_gain', { n })
        case 'job_efficiency':
            return t('prestige.effect_job_efficiency', { n })
        case 'offline_bonus':
            return t('prestige.effect_offline', { n })
        case 'loan_discount':
            return t('prestige.effect_loan_interest', { n })
        case 'cost_reduction':
            return t('prestige.effect_costs', { n })
        default:
            return `+${n}% ${reward.type}`
    }
}
</script>

<template>
    <UCard class="milestone-card" :class="{ unlocked }" size="sm" radius="lg">
        <div class="milestone-icon-wrap" :class="{ unlocked }">
            <AppIcon :icon="icon" class="milestone-icon" />
            <AppIcon v-if="unlocked" icon="mdi:check-circle" class="check-icon" />
        </div>
        <div class="milestone-content">
            <h4 class="milestone-name">{{ name }}</h4>
            <p class="milestone-description">{{ description }}</p>
            <div class="milestone-rewards">
                <span v-for="(reward, idx) in rewards" :key="idx" class="reward-tag">
                    {{ formatReward(reward) }}
                </span>
            </div>
        </div>
    </UCard>
</template>

<style scoped>
.milestone-card :deep(.u-card__body) {
    flex-direction: row;
    align-items: flex-start;
}

.milestone-card.unlocked {
    opacity: 1;
    border-color: var(--t-border-focus);
    background: var(--t-bg-card-hover);
}

.milestone-icon-wrap {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.milestone-icon-wrap.unlocked {
    background: color-mix(in srgb, var(--t-success) 15%, transparent);
}

.milestone-icon {
    font-size: 1.4rem;
    color: var(--t-text-muted);
}

.milestone-icon-wrap.unlocked .milestone-icon {
    color: var(--t-success);
}

.check-icon {
    position: absolute;
    bottom: -4px;
    right: -4px;
    font-size: 1rem;
    color: var(--t-success);
    background: var(--t-bg-card);
    border-radius: var(--t-radius-full);
}

.milestone-content {
    flex: 1;
    min-width: 0;
}

.milestone-name {
    font-size: 0.95rem;
    font-weight: var(--t-font-semibold);
    margin: 0 0 0.25rem 0;
    color: var(--t-text);
}

.milestone-card:not(.unlocked) .milestone-name {
    color: var(--t-text-secondary);
}

.milestone-description {
    font-size: 0.8rem;
    color: var(--t-text-muted);
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
}

.milestone-rewards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.reward-tag {
    font-size: 0.7rem;
    font-weight: var(--t-font-medium);
    padding: 0.2rem 0.5rem;
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    color: var(--t-text-secondary);
}

.milestone-card.unlocked .reward-tag {
    background: color-mix(in srgb, var(--t-success) 15%, transparent);
    color: var(--t-success);
}
</style>
