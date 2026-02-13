<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'
import { useBusinessStore, type OwnedBusiness } from '@renderer/stores/useBusinessStore'
import { getGeoTier, getNextGeoTier, GEO_TIERS } from '@renderer/data/businesses'
import { useFormat } from '@renderer/composables/useFormat'
import { computed } from 'vue'

const props = defineProps<{
    business: OwnedBusiness
}>()

const store = useBusinessStore()
const { formatCash } = useFormat()

const currentTier = computed(() => getGeoTier(props.business.branches))
const nextTier = computed(() => getNextGeoTier(props.business.branches))

const branchCost = computed(() => store.getBranchCost(props.business))

const tierProgress = computed(() => {
    if (!nextTier.value) return 100
    const prevMin = currentTier.value.minBranches
    const nextMin = nextTier.value.minBranches
    const range = nextMin - prevMin
    if (range <= 0) return 100
    return Math.min(100, ((props.business.branches - prevMin) / range) * 100)
})
</script>

<template>
    <div class="branch-panel">
        <h4 class="panel-title">
            <AppIcon icon="mdi:source-branch" />
            {{ $t('business.branches_title') }}
        </h4>

        <!-- Current Stats -->
        <div class="branch-stats">
            <div class="stat-block">
                <span class="stat-label">{{ $t('business.total_branches') }}</span>
                <span class="stat-value">{{ business.branches }}</span>
            </div>
            <div class="stat-block">
                <span class="stat-label">{{ $t('business.geo_tier') }}</span>
                <div class="tier-badge">
                    <AppIcon :icon="currentTier.icon" />
                    <span>{{ $t(currentTier.nameKey) }}</span>
                </div>
            </div>
            <div class="stat-block">
                <span class="stat-label">{{ $t('business.revenue_mult') }}</span>
                <span class="stat-value accent">×{{ currentTier.revenueMultiplier.toFixed(1) }}</span>
            </div>
        </div>

        <!-- Next Tier Progress -->
        <div v-if="nextTier" class="next-tier">
            <div class="tier-target">
                <AppIcon :icon="nextTier.icon" class="tier-icon" />
                <span>{{ $t(nextTier.nameKey) }}</span>
                <span class="tier-req">({{ business.branches }}/{{ nextTier.minBranches }})</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" :style="{ width: tierProgress + '%' }" />
            </div>
            <span class="tier-reward">×{{ nextTier.revenueMultiplier.toFixed(1) }} {{ $t('business.revenue') }}</span>
        </div>
        <div v-else class="max-tier-badge">
            <AppIcon icon="mdi:rocket-launch" />
            {{ $t('business.max_tier_reached') }}
        </div>

        <!-- All tiers reference -->
        <details class="tier-details">
            <summary>{{ $t('business.all_tiers') }}</summary>
            <div class="tier-list">
                <div v-for="tier in GEO_TIERS" :key="tier.tier" class="tier-item"
                    :class="{ active: tier.tier === currentTier.tier }">
                    <AppIcon :icon="tier.icon" class="tier-item-icon" />
                    <span class="tier-item-name">{{ $t(tier.nameKey) }}</span>
                    <span class="tier-item-req">{{ tier.minBranches }}+</span>
                    <span class="tier-item-mult">×{{ tier.revenueMultiplier.toFixed(1) }}</span>
                </div>
            </div>
        </details>

        <!-- Open branch button -->
        <button class="btn-branch" @click="store.openBranch(business.id)">
            <AppIcon icon="mdi:plus-circle" />
            {{ $t('business.open_branch') }}
            <span class="cost">{{ formatCash(branchCost) }}</span>
        </button>
    </div>
</template>

<style scoped>
.branch-panel {
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

.branch-stats {
    display: flex;
    gap: var(--t-space-4);
    flex-wrap: wrap;
}

.stat-block {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.stat-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.stat-value {
    font-size: var(--t-font-size-md);
    font-weight: 700;
    font-family: var(--t-font-mono);
    color: var(--t-text);
}

.stat-value.accent {
    color: var(--t-accent);
}

.tier-badge {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-accent);
}

.next-tier {
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

.tier-target {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text);
    margin-bottom: 0.4rem;
}

.tier-icon {
    color: var(--t-text-muted);
}

.tier-req {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.progress-bar {
    height: 6px;
    background: var(--t-bg);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.3rem;
}

.progress-fill {
    height: 100%;
    background: var(--t-accent);
    border-radius: 3px;
    transition: width 0.3s;
}

.tier-reward {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.max-tier-badge {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-success);
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
}

.tier-details {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.tier-details summary {
    cursor: pointer;
    font-weight: 600;
}

.tier-list {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    margin-top: 0.4rem;
    padding-left: 0.2rem;
}

.tier-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.15rem 0.3rem;
    border-radius: var(--t-radius-sm);
}

.tier-item.active {
    background: var(--t-accent-alpha);
    color: var(--t-text);
    font-weight: 600;
}

.tier-item-icon {
    font-size: 0.9rem;
}

.tier-item-name {
    flex: 1;
}

.tier-item-req {
    font-family: var(--t-font-mono);
}

.tier-item-mult {
    font-family: var(--t-font-mono);
    font-weight: 600;
    color: var(--t-accent);
}

.btn-branch {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--t-accent);
    border-radius: var(--t-radius-sm);
    background: transparent;
    color: var(--t-accent);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
}

.btn-branch:hover {
    background: var(--t-accent);
    color: var(--t-bg);
}

.cost {
    font-family: var(--t-font-mono);
    opacity: 0.8;
}
</style>
