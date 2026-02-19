<script setup lang="ts">
/**
 * CreditScoreWidget — Revamped credit score panel for the loans sidebar.
 *
 * Composition:
 *   CreditScoreGauge     → ring gauge with score number & tier
 *   CreditFactorRow × 5  → per-factor mini-ring + bar + expandable desc
 *   CreditUtilizationBar → segmented utilization indicator with needle
 *   Health badge          → portfolio health status
 *
 * All presentation logic is delegated to useCreditScore composable.
 */
import { useCreditScore } from '@renderer/composables/useCreditScore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'
import CreditScoreGauge from './CreditScoreGauge.vue'
import CreditFactorRow from './CreditFactorRow.vue'
import CreditUtilizationBar from './CreditUtilizationBar.vue'

const { formatCash } = useFormat()
const { score, scoreRatio, tierInfo, factors, utilization, health } = useCreditScore()
</script>

<template>
    <div class="csw">
        <!-- ── Header ── -->
        <div class="csw-title-row">
            <AppIcon icon="mdi:shield-account" class="csw-title-icon" />
            <span class="csw-title">{{ $t('loans.csw.title') }}</span>
        </div>

        <!-- ── Score Gauge ── -->
        <CreditScoreGauge :score="score" :ratio="scoreRatio" :color="tierInfo.color" :tier-label="$t(tierInfo.labelKey)"
            :tier-icon="tierInfo.icon" />

        <!-- ── Factor Breakdown ── -->
        <div class="csw-section">
            <div class="csw-section-header">
                <span class="csw-section-label">{{ $t('loans.csw.factors_title') }}</span>
                <span class="csw-section-hint">{{ $t('loans.csw.factors_hint') }}</span>
            </div>
            <div class="csw-factors">
                <CreditFactorRow v-for="f in factors" :key="f.key" :factor="f" />
            </div>
        </div>

        <!-- ── Utilization ── -->
        <div class="csw-section">
            <CreditUtilizationBar :value="utilization.value" :color="utilization.color"
                :status-key="utilization.statusKey" :debt-label="formatCash(utilization.debt)"
                :limit-label="formatCash(utilization.limit)" />
        </div>

        <!-- ── Portfolio Health ── -->
        <div class="csw-health">
            <span class="csw-health-dot" :style="{ background: health.color }" />
            <span class="csw-health-label">{{ $t('loans.csw.health_label') }}</span>
            <strong class="csw-health-val" :style="{ color: health.color }">
                {{ $t(health.labelKey) }}
            </strong>
        </div>
    </div>
</template>

<style scoped>
.csw {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

/* ── Title row ── */
.csw-title-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.csw-title-icon {
    font-size: 1rem;
    color: var(--t-text-muted);
}

.csw-title {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

/* ── Section ── */
.csw-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.csw-section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: var(--t-space-1);
}

.csw-section-label {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.csw-section-hint {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
}

/* ── Factors wrapper ── */
.csw-factors {
    display: flex;
    flex-direction: column;
    gap: 0;
}

/* ── Health footer ── */
.csw-health {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--t-font-size-xs);
    padding-top: var(--t-space-3);
    border-top: 1px solid var(--t-border);
}

.csw-health-dot {
    width: 7px;
    height: 7px;
    border-radius: var(--t-radius-full);
    flex-shrink: 0;
}

.csw-health-label {
    color: var(--t-text-muted);
}

.csw-health-val {
    margin-left: auto;
    text-transform: capitalize;
}
</style>
