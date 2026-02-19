<script setup lang="ts">
/**
 * CreditFactorRow — Single credit score factor with ring chart, explanation and tooltip.
 *
 * Shows a mini radial gauge per factor + label + score + expandable description.
 * Uses UTooltip for contextual tips.
 */
import { computed, ref } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UTooltip } from '@renderer/components/ui'
import type { CreditFactor } from '@renderer/composables/useCreditScore'

const props = defineProps<{
    factor: CreditFactor
}>()

const expanded = ref(false)

// Mini ring math
const R = 14
const CIRCUMFERENCE = 2 * Math.PI * R
const dashOffset = computed(() => CIRCUMFERENCE * (1 - props.factor.ratio))
</script>

<template>
    <div class="cfr" :class="{ 'cfr--expanded': expanded }" @click="expanded = !expanded">

        <!-- Mini radial gauge -->
        <div class="cfr-ring-wrap">
            <svg viewBox="0 0 36 36" class="cfr-ring" aria-hidden="true">
                <circle cx="18" cy="18" :r="R" fill="none" stroke="var(--t-border)" stroke-width="3" />
                <circle cx="18" cy="18" :r="R" fill="none" :stroke="factor.color" stroke-width="3"
                    stroke-linecap="round" :stroke-dasharray="CIRCUMFERENCE" :stroke-dashoffset="dashOffset"
                    class="cfr-ring-arc" />
            </svg>
            <span class="cfr-ring-pct">{{ Math.round(factor.ratio * 100) }}</span>
        </div>

        <!-- Label + value -->
        <div class="cfr-body">
            <div class="cfr-header">
                <AppIcon :icon="factor.icon" class="cfr-icon" :style="{ color: factor.color }" />
                <span class="cfr-label">{{ $t(factor.labelKey) }}</span>
                <UTooltip :placement="'top'">
                    <AppIcon icon="mdi:help-circle-outline" class="cfr-help" />
                    <template #content>
                        <span>{{ $t(factor.tipKey) }}</span>
                    </template>
                </UTooltip>
                <span class="cfr-score">
                    {{ Math.round(factor.value) }}<span class="cfr-score-max">/{{ factor.max }}</span>
                </span>
            </div>

            <!-- Progress bar -->
            <div class="cfr-bar">
                <div class="cfr-bar-fill" :style="{ width: (factor.ratio * 100) + '%', background: factor.color }" />
            </div>

            <!-- Expanded description -->
            <Transition name="cfr-expand">
                <p v-if="expanded" class="cfr-desc">{{ $t(factor.descKey) }}</p>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
.cfr {
    display: flex;
    align-items: flex-start;
    gap: var(--t-space-3);
    padding: var(--t-space-2) var(--t-space-3);
    border-radius: var(--t-radius-md);
    cursor: pointer;
    transition: background var(--t-transition-fast);
}

.cfr:hover {
    background: var(--t-bg-muted);
}

/* ─ Mini ring ─ */
.cfr-ring-wrap {
    position: relative;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
}

.cfr-ring {
    width: 100%;
    height: 100%;
}

.cfr-ring-arc {
    transform: rotate(-90deg);
    transform-origin: center;
    transition: stroke-dashoffset 0.5s ease;
}

.cfr-ring-pct {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.55rem;
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
    pointer-events: none;
}

/* ─ Body ─ */
.cfr-body {
    flex: 1;
    min-width: 0;
}

.cfr-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
}

.cfr-icon {
    font-size: 0.85rem;
    flex-shrink: 0;
}

.cfr-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.cfr-help {
    font-size: 0.7rem;
    color: var(--t-text-muted);
    opacity: 0;
    transition: opacity var(--t-transition-fast);
    flex-shrink: 0;
    cursor: help;
}

.cfr:hover .cfr-help {
    opacity: 1;
}

.cfr-score {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    flex-shrink: 0;
}

.cfr-score-max {
    color: var(--t-text-muted);
    font-weight: var(--t-font-normal);
}

/* ─ Bar ─ */
.cfr-bar {
    height: 3px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-xs);
    overflow: hidden;
}

.cfr-bar-fill {
    height: 100%;
    border-radius: var(--t-radius-xs);
    transition: width 0.4s ease;
}

/* ─ Expandable description ─ */
.cfr-desc {
    margin: var(--t-space-2) 0 0;
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    line-height: 1.5;
}

.cfr-expand-enter-active,
.cfr-expand-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
}

.cfr-expand-enter-from,
.cfr-expand-leave-to {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
}

.cfr-expand-enter-to,
.cfr-expand-leave-from {
    opacity: 1;
    max-height: 80px;
}
</style>
