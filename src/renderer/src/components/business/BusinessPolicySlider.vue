<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'
import { useBusinessStore, type OwnedBusiness } from '@renderer/stores/useBusinessStore'
import { POLICIES } from '@renderer/data/businesses'

const props = defineProps<{
    business: OwnedBusiness
}>()

const store = useBusinessStore()
</script>

<template>
    <div class="policy-panel">
        <h4 class="panel-title">
            <AppIcon icon="mdi:tune-vertical" />
            {{ $t('business.policies_title') }}
        </h4>

        <div class="policy-list">
            <div v-for="policy in POLICIES" :key="policy.id" class="policy-item">
                <div class="pol-header">
                    <AppIcon :icon="policy.icon" class="pol-icon" />
                    <span class="pol-name">{{ $t(policy.nameKey) }}</span>
                </div>
                <p class="pol-desc">{{ $t(policy.descKey) }}</p>
                <div class="slider-row">
                    <span class="slider-label left">{{ $t(policy.leftKey) }}</span>
                    <input type="range" :min="0" :max="100" :value="business.policies[policy.id] ?? 50"
                        class="policy-slider"
                        @input="store.setPolicy(business.id, policy.id, Number(($event.target as HTMLInputElement).value))" />
                    <span class="slider-label right">{{ $t(policy.rightKey) }}</span>
                </div>
                <div class="slider-value">{{ business.policies[policy.id] ?? 50 }}%</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.policy-panel {
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

.policy-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.policy-item {
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

.pol-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.25rem;
}

.pol-icon {
    font-size: 1rem;
    color: var(--t-text-muted);
}

.pol-name {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text);
}

.pol-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0 0 var(--t-space-2);
}

.slider-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.slider-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    white-space: nowrap;
    min-width: 4rem;
}

.slider-label.left {
    text-align: right;
}

.slider-label.right {
    text-align: left;
}

.policy-slider {
    flex: 1;
    height: 4px;
    accent-color: var(--t-accent);
    cursor: pointer;
}

.slider-value {
    text-align: center;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text-secondary);
    margin-top: 0.25rem;
}
</style>
