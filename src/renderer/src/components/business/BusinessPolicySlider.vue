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
        <div class="policy-list">
            <div v-for="policy in POLICIES" :key="policy.id" class="policy-item">
                <div class="pol-header">
                    <div class="pol-icon-wrap">
                        <AppIcon :icon="policy.icon" class="pol-icon" />
                    </div>
                    <div class="pol-info">
                        <span class="pol-name">{{ $t(policy.nameKey) }}</span>
                        <span class="pol-desc">{{ $t(policy.descKey) }}</span>
                    </div>
                    <span class="pol-value-badge"
                        :class="{ left: (business.policies[policy.id] ?? 50) < 35, right: (business.policies[policy.id] ?? 50) > 65 }">
                        {{ business.policies[policy.id] ?? 50 }}%
                    </span>
                </div>
                <div class="slider-row">
                    <span class="slider-label left">{{ $t(policy.leftKey) }}</span>
                    <div class="slider-track-wrap">
                        <input type="range" :min="0" :max="100" :value="business.policies[policy.id] ?? 50"
                            class="policy-slider"
                            :style="{ '--slider-pct': ((business.policies[policy.id] ?? 50)) + '%' }"
                            @input="store.setPolicy(business.id, policy.id, Number(($event.target as HTMLInputElement).value))" />
                    </div>
                    <span class="slider-label right">{{ $t(policy.rightKey) }}</span>
                </div>
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

.policy-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.policy-item {
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.pol-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.pol-icon-wrap {
    width: 30px;
    height: 30px;
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.pol-icon {
    font-size: 0.95rem;
    color: var(--t-text-muted);
}

.pol-info {
    flex: 1;
    min-width: 0;
}

.pol-name {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    display: block;
}

.pol-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    display: block;
    margin-top: 0.05rem;
}

.pol-value-badge {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    padding: 0.1rem 0.45rem;
    border-radius: var(--t-radius-sm);
    background: color-mix(in srgb, var(--t-accent) 12%, transparent);
    color: var(--t-accent);
    flex-shrink: 0;
    min-width: 2.8rem;
    text-align: center;
}

.pol-value-badge.left {
    background: color-mix(in srgb, var(--t-warning) 12%, transparent);
    color: var(--t-warning);
}

.pol-value-badge.right {
    background: color-mix(in srgb, var(--t-success) 12%, transparent);
    color: var(--t-success);
}

.slider-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.slider-label {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    white-space: nowrap;
    min-width: 3.5rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.slider-label.left {
    text-align: right;
}

.slider-label.right {
    text-align: left;
}

.slider-track-wrap {
    flex: 1;
    position: relative;
}

/* Custom range slider */
.policy-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(to right,
            var(--t-accent) 0%,
            var(--t-accent) var(--slider-pct, 50%),
            var(--t-bg-muted) var(--slider-pct, 50%),
            var(--t-bg-muted) 100%);
    outline: none;
    cursor: pointer;
    transition: background 0.1s;
}

.policy-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--t-accent);
    border: 2px solid var(--t-bg-card);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
}

.policy-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--t-accent) 20%, transparent);
}

.policy-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--t-accent);
    border: 2px solid var(--t-bg-card);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    cursor: pointer;
}

.policy-slider:focus-visible {
    outline: none;
}

.policy-slider:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--t-accent) 30%, transparent);
}
</style>
