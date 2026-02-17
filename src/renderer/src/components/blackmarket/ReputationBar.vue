<script setup lang="ts">
/**
 * ReputationBar — Tier progress display showing current reputation
 * tier, deals completed, and progress to the next tier.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useI18n } from 'vue-i18n'

const bm = useBlackMarketStore()
const { t } = useI18n()
</script>

<template>
    <div class="rep-bar" :style="{ '--_tier-color': bm.currentTierDef.color }">
        <div class="rep-bar__head">
            <AppIcon :icon="bm.currentTierDef.icon" class="rep-bar__icon" />
            <span class="rep-bar__tier-name">{{ t(bm.currentTierDef.nameKey) }}</span>
            <span class="rep-bar__tier-label">{{ t('blackmarket.tier') }} {{ bm.currentTier }}</span>
        </div>

        <div class="rep-bar__track">
            <div class="rep-bar__fill" :style="{ width: `${bm.tierProgress.progressPercent}%` }" />
        </div>

        <div class="rep-bar__foot">
            <span class="rep-bar__deals">
                {{ t('blackmarket.deals_completed', { count: bm.totalDealsCompleted }) }}
            </span>
            <span v-if="bm.currentTier < 5" class="rep-bar__next">
                {{ bm.tierProgress.dealsToNext }} {{ t('blackmarket.deals_to_next') }}
            </span>
            <span v-else class="rep-bar__max">{{ t('blackmarket.max_tier') }}</span>
        </div>
    </div>
</template>

<style scoped>
.rep-bar {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
}

.rep-bar__head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.rep-bar__icon {
    font-size: 1.15rem;
    color: var(--_tier-color, var(--t-accent));
}

.rep-bar__tier-name {
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-sm);
    color: var(--_tier-color, var(--t-accent));
}

.rep-bar__tier-label {
    margin-left: auto;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.rep-bar__track {
    height: 6px;
    background: var(--t-bg-muted);
    border-radius: 3px;
    overflow: hidden;
}

.rep-bar__fill {
    height: 100%;
    background: var(--_tier-color, var(--t-accent));
    border-radius: 3px;
    transition: width var(--t-transition-normal);
}

.rep-bar__foot {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.rep-bar__max {
    color: var(--t-success);
    font-weight: var(--t-font-semibold);
}
</style>
