<script setup lang="ts">
/**
 * CreditUtilizationBar — Debt-to-credit utilization indicator.
 *
 * Shows a segmented bar with three zones (healthy / moderate / high)
 * plus a needle marker at the current utilization %.
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'

const props = defineProps<{
    /** 0 – 100 */
    value: number
    color: string
    statusKey: string
    /** Formatted debt amount string */
    debtLabel: string
    /** Formatted credit limit string */
    limitLabel: string
}>()

const clampedPct = computed(() => Math.max(0, Math.min(100, props.value)))
</script>

<template>
    <div class="cub">
        <div class="cub-header">
            <AppIcon icon="mdi:scale-balance" class="cub-header-icon" />
            <span class="cub-title">{{ $t('loans.csw.utilization_title') }}</span>
            <span class="cub-pct" :style="{ color }">{{ clampedPct }}%</span>
        </div>

        <!-- Segmented bar with zones -->
        <div class="cub-track">
            <div class="cub-zone cub-zone--good" />
            <div class="cub-zone cub-zone--moderate" />
            <div class="cub-zone cub-zone--high" />
            <!-- Needle -->
            <div class="cub-needle" :style="{ left: clampedPct + '%' }">
                <div class="cub-needle-line" :style="{ background: color }" />
                <div class="cub-needle-dot" :style="{ background: color }" />
            </div>
        </div>

        <!-- Zone labels -->
        <div class="cub-labels">
            <span class="cub-label">0%</span>
            <span class="cub-label">50%</span>
            <span class="cub-label">100%</span>
        </div>

        <!-- Debt / Limit breakdown -->
        <div class="cub-breakdown">
            <span class="cub-breakdown-item">
                <span class="cub-breakdown-key">{{ $t('loans.csw.util_debt') }}</span>
                <span class="cub-breakdown-val" :style="{ color }">{{ debtLabel }}</span>
            </span>
            <span class="cub-breakdown-sep">/</span>
            <span class="cub-breakdown-item">
                <span class="cub-breakdown-key">{{ $t('loans.csw.util_limit') }}</span>
                <span class="cub-breakdown-val">{{ limitLabel }}</span>
            </span>
        </div>

        <span class="cub-status" :style="{ color }">{{ $t(statusKey) }}</span>
    </div>
</template>

<style scoped>
.cub {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.cub-header {
    display: flex;
    align-items: center;
    gap: 6px;
}

.cub-header-icon {
    font-size: 0.85rem;
    color: var(--t-text-muted);
}

.cub-title {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    flex: 1;
}

.cub-pct {
    font-size: var(--t-font-size-sm);
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
}

/* ─ Track ─ */
.cub-track {
    position: relative;
    display: flex;
    height: 6px;
    border-radius: var(--t-radius-xs);
    overflow: visible;
    margin: var(--t-space-2) 0 var(--t-space-1);
}

.cub-zone {
    height: 100%;
}

.cub-zone--good {
    flex: 50;
    background: var(--t-success);
    opacity: 0.25;
    border-radius: var(--t-radius-xs) 0 0 var(--t-radius-xs);
}

.cub-zone--moderate {
    flex: 30;
    background: var(--t-warning);
    opacity: 0.25;
}

.cub-zone--high {
    flex: 20;
    background: var(--t-danger);
    opacity: 0.25;
    border-radius: 0 var(--t-radius-xs) var(--t-radius-xs) 0;
}

/* ─ Needle ─ */
.cub-needle {
    position: absolute;
    top: -3px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: left 0.5s ease;
}

.cub-needle-line {
    width: 2px;
    height: 12px;
    border-radius: 1px;
}

.cub-needle-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--t-radius-full);
    margin-top: -1px;
}

/* ─ Labels ─ */
.cub-labels {
    display: flex;
    justify-content: space-between;
}

.cub-label {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    font-family: var(--t-font-mono);
}

/* ─ Breakdown ─ */
.cub-breakdown {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: var(--t-space-1);
}

.cub-breakdown-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
}

.cub-breakdown-key {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.cub-breakdown-val {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.cub-breakdown-sep {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    font-weight: var(--t-font-bold);
}

.cub-status {
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-medium);
    text-align: center;
    margin-top: var(--t-space-1);
}
</style>
