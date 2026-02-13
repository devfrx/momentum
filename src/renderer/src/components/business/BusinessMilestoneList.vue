<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'
import { getActiveMilestones, aggregateMilestoneBonuses, MILESTONE_TIERS } from '@renderer/data/businesses'
import type { OwnedBusiness } from '@renderer/stores/useBusinessStore'
import { computed } from 'vue'

const props = defineProps<{
    business: OwnedBusiness
}>()

const totalUpgradeLevels = computed(() =>
    props.business.upgrades.reduce((sum, u) => sum + u.level, 0)
)

const activeMilestones = computed(() =>
    getActiveMilestones(props.business.level, props.business.branches, totalUpgradeLevels.value)
)

const bonuses = computed(() => aggregateMilestoneBonuses(activeMilestones.value))

const milestoneProgress = computed(() =>
    MILESTONE_TIERS.map(tier => {
        let current = 0
        switch (tier.type) {
            case 'level': current = props.business.level; break
            case 'branch': current = props.business.branches; break
            case 'upgrade': current = totalUpgradeLevels.value; break
        }
        const achieved = Math.floor(current / tier.every)
        const next = (achieved + 1) * tier.every
        const progress = ((current % tier.every) / tier.every) * 100
        return { tier, current, achieved, next, progress }
    })
)
</script>

<template>
    <div class="milestone-panel">
        <h4 class="panel-title">
            <AppIcon icon="mdi:trophy" />
            {{ $t('business.milestones_title') }}
        </h4>

        <!-- Active bonuses summary -->
        <div class="bonus-summary" v-if="activeMilestones.length > 0">
            <div class="bonus-item" v-if="bonuses.revenue_mult > 0">
                <AppIcon icon="mdi:currency-usd" class="bonus-icon" />
                <span>{{ $t('business.ms_revenue') }}: +{{ (bonuses.revenue_mult * 100).toFixed(0) }}%</span>
            </div>
            <div class="bonus-item" v-if="bonuses.customer_attraction > 0">
                <AppIcon icon="mdi:account-multiple-plus" class="bonus-icon" />
                <span>{{ $t('business.ms_customers') }}: +{{ (bonuses.customer_attraction * 100).toFixed(0) }}%</span>
            </div>
            <div class="bonus-item" v-if="bonuses.cost_reduction > 0">
                <AppIcon icon="mdi:tag-minus" class="bonus-icon" />
                <span>{{ $t('business.ms_cost_reduction') }}: -{{ (bonuses.cost_reduction * 100).toFixed(0) }}%</span>
            </div>
        </div>
        <div v-else class="no-milestones">
            {{ $t('business.no_milestones_yet') }}
        </div>

        <!-- Next milestone progress -->
        <div class="milestone-tracks">
            <div v-for="mp in milestoneProgress" :key="mp.tier.type" class="track">
                <div class="track-header">
                    <AppIcon :icon="mp.tier.icon" class="track-icon" />
                    <span class="track-name">{{ $t(mp.tier.nameKey) }}</span>
                    <span class="track-counter">{{ mp.current }}/{{ mp.next }}</span>
                </div>
                <div class="track-bar">
                    <div class="track-fill" :style="{ width: mp.progress + '%' }" />
                </div>
                <span class="track-reward">
                    +{{ (mp.tier.bonusValue * 100).toFixed(0) }}%
                    {{ $t('business.ms_' + mp.tier.bonusType) }}
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.milestone-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.panel-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    font-weight: 700;
    color: var(--t-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
}

.bonus-summary {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-2);
}

.bonus-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.6rem;
    background: var(--t-accent-alpha, rgba(99, 102, 241, 0.1));
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-accent);
}

.bonus-icon {
    font-size: 0.85rem;
}

.no-milestones {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    font-style: italic;
}

.milestone-tracks {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.track {
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

.track-header {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-bottom: 0.3rem;
}

.track-icon {
    font-size: 0.9rem;
    color: var(--t-text-muted);
}

.track-name {
    flex: 1;
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text);
}

.track-counter {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.track-bar {
    height: 4px;
    background: var(--t-bg);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.2rem;
}

.track-fill {
    height: 100%;
    background: var(--t-accent);
    border-radius: 2px;
    transition: width 0.3s;
}

.track-reward {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}
</style>
