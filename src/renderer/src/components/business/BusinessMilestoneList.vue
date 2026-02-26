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
        <!-- Active bonuses summary -->
        <div class="bonus-row" v-if="activeMilestones.length > 0">
            <div class="bonus-chip" v-if="bonuses.revenue_mult > 0">
                <AppIcon icon="mdi:currency-usd" class="bonus-chip-icon revenue" />
                <span class="bonus-chip-val">+{{ (bonuses.revenue_mult * 100).toFixed(0) }}%</span>
            </div>
            <div class="bonus-chip" v-if="bonuses.customer_attraction > 0">
                <AppIcon icon="mdi:account-multiple-plus" class="bonus-chip-icon customers" />
                <span class="bonus-chip-val">+{{ (bonuses.customer_attraction * 100).toFixed(0) }}%</span>
            </div>
            <div class="bonus-chip" v-if="bonuses.cost_reduction > 0">
                <AppIcon icon="mdi:tag-minus" class="bonus-chip-icon cost" />
                <span class="bonus-chip-val">-{{ (bonuses.cost_reduction * 100).toFixed(0) }}%</span>
            </div>
        </div>
        <div v-else class="empty-milestones">
            <AppIcon icon="mdi:trophy-outline" class="empty-icon" />
            <span>{{ $t('business.no_milestones_yet') }}</span>
        </div>

        <!-- Milestone tracks -->
        <div class="milestone-tracks">
            <div v-for="mp in milestoneProgress" :key="mp.tier.type" class="track-card">
                <div class="track-top">
                    <div class="track-icon-wrap">
                        <AppIcon :icon="mp.tier.icon" class="track-icon" />
                    </div>
                    <div class="track-info">
                        <span class="track-name">{{ $t(mp.tier.nameKey) }}</span>
                        <span class="track-counter">{{ mp.current }}/{{ mp.next }}</span>
                    </div>
                    <div class="track-achieved-badge" v-if="mp.achieved > 0">
                        <AppIcon icon="mdi:star" class="achieved-star" />
                        <span>{{ mp.achieved }}</span>
                    </div>
                </div>
                <div class="track-bar">
                    <div class="track-fill" :style="{ width: mp.progress + '%' }" />
                </div>
                <div class="track-bottom">
                    <span class="track-reward">
                        +{{ (mp.tier.bonusValue * 100).toFixed(0) }}%
                        {{ $t('business.ms_' + mp.tier.bonusType) }}
                    </span>
                </div>
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

/* Bonus row */
.bonus-row {
    display: flex;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.bonus-chip {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.3rem 0.6rem;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
}

.bonus-chip-icon {
    font-size: 0.85rem;
}

.bonus-chip-icon.revenue {
    color: var(--t-success);
}

.bonus-chip-icon.customers {
    color: var(--t-accent);
}

.bonus-chip-icon.cost {
    color: var(--t-warning);
}

.bonus-chip-val {
    color: var(--t-text);
}

/* Empty state */
.empty-milestones {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    justify-content: center;
    padding: var(--t-space-3);
    color: var(--t-text-muted);
    font-size: var(--t-font-size-xs);
    font-style: italic;
}

.empty-icon {
    font-size: 1.2rem;
    opacity: 0.4;
}

/* Milestone tracks */
.milestone-tracks {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.track-card {
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.track-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.track-icon-wrap {
    width: 26px;
    height: 26px;
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.track-icon {
    font-size: 0.85rem;
    color: var(--t-text-muted);
}

.track-info {
    flex: 1;
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
}

.track-name {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.track-counter {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
}

.track-achieved-badge {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
    color: var(--t-gold);
    padding: 0.05rem 0.35rem;
    background: color-mix(in srgb, var(--t-gold) 12%, transparent);
    border-radius: var(--t-radius-sm);
}

.achieved-star {
    font-size: 0.7rem;
}

/* Track bar */
.track-bar {
    height: 5px;
    background: var(--t-bg-muted);
    border-radius: 999px;
    overflow: hidden;
}

.track-fill {
    height: 100%;
    background: var(--t-accent);
    border-radius: 999px;
    transition: width 0.4s ease;
}

.track-bottom {
    display: flex;
    justify-content: flex-end;
}

.track-reward {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    font-family: var(--t-font-mono);
}
</style>
