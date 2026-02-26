<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'
import { UAccordion, UButton } from '@renderer/components/ui'
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
        <!-- Current tier hero -->
        <div class="tier-hero">
            <div class="tier-hero-left">
                <div class="tier-icon-wrap">
                    <AppIcon :icon="currentTier.icon" class="tier-main-icon" />
                </div>
                <div class="tier-hero-info">
                    <span class="tier-hero-name">{{ $t(currentTier.nameKey) }}</span>
                    <span class="tier-hero-mult">×{{ currentTier.revenueMultiplier.toFixed(1) }} {{
                        $t('business.revenue') }}</span>
                </div>
            </div>
            <div class="branch-count">
                <span class="branch-count-val">{{ business.branches }}</span>
                <span class="branch-count-label">{{ $t('business.total_branches') }}</span>
            </div>
        </div>

        <!-- Next Tier Progress -->
        <div v-if="nextTier" class="next-tier-card">
            <div class="next-tier-header">
                <AppIcon :icon="nextTier.icon" class="next-tier-icon" />
                <span class="next-tier-name">{{ $t(nextTier.nameKey) }}</span>
                <span class="next-tier-counter">{{ business.branches }}/{{ nextTier.minBranches }}</span>
            </div>
            <div class="next-tier-bar">
                <div class="next-tier-fill" :style="{ width: tierProgress + '%' }" />
            </div>
            <div class="next-tier-footer">
                <span class="next-tier-reward">
                    <AppIcon icon="mdi:arrow-up" class="reward-icon" />
                    ×{{ nextTier.revenueMultiplier.toFixed(1) }}
                </span>
                <span class="next-tier-remaining">{{ nextTier.minBranches - business.branches }} {{
                    $t('business.branches_needed') }}</span>
            </div>
        </div>
        <div v-else class="max-tier-badge">
            <AppIcon icon="mdi:rocket-launch" class="max-tier-icon" />
            <span>{{ $t('business.max_tier_reached') }}</span>
        </div>

        <!-- All tiers reference -->
        <UAccordion :title="$t('business.all_tiers')" icon="mdi:format-list-bulleted" variant="ghost" compact>
            <div class="tier-list">
                <div v-for="tier in GEO_TIERS" :key="tier.tier" class="tier-item"
                    :class="{ active: tier.tier === currentTier.tier, achieved: tier.minBranches <= business.branches }">
                    <AppIcon :icon="tier.icon" class="tier-item-icon" />
                    <span class="tier-item-name">{{ $t(tier.nameKey) }}</span>
                    <span class="tier-item-req">{{ tier.minBranches }}+</span>
                    <span class="tier-item-mult">×{{ tier.revenueMultiplier.toFixed(1) }}</span>
                    <AppIcon v-if="tier.minBranches <= business.branches" icon="mdi:check-circle" class="tier-check" />
                </div>
            </div>
        </UAccordion>

        <!-- Open branch button -->
        <UButton variant="primary" icon="mdi:plus-circle" class="branch-buy-btn" @click="store.openBranch(business.id)">
            {{ $t('business.open_branch') }}
            <span class="branch-cost">{{ formatCash(branchCost) }}</span>
        </UButton>
    </div>
</template>

<style scoped>
.branch-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

/* Tier hero */
.tier-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-3);
    /* background: color-mix(in srgb, var(--t-accent) 8%, var(--t-bg-card));
    border: 1px solid color-mix(in srgb, var(--t-accent) 25%, var(--t-border)); */
    border-radius: var(--t-radius-md);
}

.tier-hero-left {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.tier-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: var(--t-radius-md);
    background: color-mix(in srgb, var(--t-accent) 15%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
}

.tier-main-icon {
    font-size: 1.3rem;
    color: var(--t-accent);
}

.tier-hero-info {
    display: flex;
    flex-direction: column;
}

.tier-hero-name {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.tier-hero-mult {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    color: var(--t-accent);
}

.branch-count {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.branch-count-val {
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
    color: var(--t-text);
    line-height: 1;
}

.branch-count-label {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

/* Next tier card */
.next-tier-card {
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.next-tier-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.next-tier-icon {
    font-size: 0.9rem;
    color: var(--t-text-muted);
}

.next-tier-name {
    flex: 1;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.next-tier-counter {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.next-tier-bar {
    height: 6px;
    background: var(--t-bg);
    border-radius: 999px;
    overflow: hidden;
}

.next-tier-fill {
    height: 100%;
    background: var(--t-accent);
    border-radius: 999px;
    transition: width 0.4s ease;
}

.next-tier-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.next-tier-reward {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    color: var(--t-accent);
}

.reward-icon {
    font-size: 0.75rem;
}

.next-tier-remaining {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
}

/* Max tier */
.max-tier-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: var(--t-space-3);
    background: color-mix(in srgb, var(--t-success) 10%, var(--t-bg-muted));
    border: 1px solid color-mix(in srgb, var(--t-success) 25%, var(--t-border));
    border-radius: var(--t-radius-md);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-success);
}

.max-tier-icon {
    font-size: 1.2rem;
}

/* Tier list */
.tier-list {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.tier-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.4rem;
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    transition: background 0.15s;
}

.tier-item.active {
    background: color-mix(in srgb, var(--t-accent) 10%, transparent);
    color: var(--t-text);
    font-weight: var(--t-font-semibold);
}

.tier-item.achieved .tier-item-icon {
    color: var(--t-accent);
}

.tier-item-icon {
    font-size: 0.85rem;
}

.tier-item-name {
    flex: 1;
}

.tier-item-req {
    font-family: var(--t-font-mono);
}

.tier-item-mult {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-accent);
}

.tier-check {
    font-size: 0.8rem;
    color: var(--t-success);
}

/* Buy button */
.branch-buy-btn {
    width: 100%;
}

.branch-cost {
    font-family: var(--t-font-mono);
    margin-left: 0.25rem;
    opacity: 0.85;
}
</style>
