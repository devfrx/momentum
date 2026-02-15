<script setup lang="ts">
/**
 * InvestigationAlert — Warning display for active investigations
 * with timer countdown and severity indicator.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'

const bm = useBlackMarketStore()
const { formatCash } = useFormat()
const { t } = useI18n()

function timeLeft(ticks: number): string {
    const secs = Math.ceil(ticks / 10)
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

function severity(level: number): string {
    const stars = '★'.repeat(level) + '☆'.repeat(5 - level)
    return stars
}
</script>

<template>
    <div v-if="bm.activeInvestigations.length > 0" class="inv-alerts">
        <div v-for="inv in bm.activeInvestigations" :key="inv.id" class="inv-alert"
            :class="`inv-alert--sev-${inv.severity}`">
            <div class="inv-alert__head">
                <AppIcon icon="mdi:shield-alert" class="inv-alert__icon" />
                <span class="inv-alert__title">{{ t(inv.nameKey) }}</span>
                <span class="inv-alert__severity">{{ severity(inv.severity) }}</span>
            </div>

            <div class="inv-alert__body">
                <div class="inv-alert__kpi">
                    <span class="inv-alert__kpi-label">{{ t('blackmarket.time_remaining') }}</span>
                    <span class="inv-alert__kpi-value">{{ timeLeft(inv.ticksRemaining) }}</span>
                </div>
                <div class="inv-alert__kpi">
                    <span class="inv-alert__kpi-label">{{ t('blackmarket.potential_fine') }}</span>
                    <span class="inv-alert__kpi-value inv-alert__kpi-value--danger">{{ formatCash(inv.fineAmount)
                        }}</span>
                </div>
                <div class="inv-alert__kpi">
                    <span class="inv-alert__kpi-label">{{ t('blackmarket.catch_chance') }}</span>
                    <span class="inv-alert__kpi-value">{{ Math.round(inv.catchChance * 100) }}%</span>
                </div>
            </div>

            <!-- Progress -->
            <div class="inv-alert__track">
                <div class="inv-alert__fill"
                    :style="{ width: `${((inv.totalDuration - inv.ticksRemaining) / inv.totalDuration) * 100}%` }" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.inv-alerts {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.inv-alert {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-danger);
    border-left: 4px solid var(--t-danger);
    border-radius: var(--t-radius-md);
    box-shadow: var(--t-shadow-sm);
}

.inv-alert__head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.inv-alert__icon {
    font-size: 1.2rem;
    color: var(--t-danger);
}

.inv-alert__title {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
    flex: 1;
}

.inv-alert__severity {
    font-size: var(--t-font-size-xs);
    color: var(--t-warning);
    letter-spacing: 0.1em;
}

.inv-alert__body {
    display: flex;
    gap: var(--t-space-4);
    flex-wrap: wrap;
}

.inv-alert__kpi {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.inv-alert__kpi-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.inv-alert__kpi-value {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.inv-alert__kpi-value--danger {
    color: var(--t-danger);
}

.inv-alert__track {
    height: 4px;
    background: var(--t-bg-muted);
    border-radius: 2px;
    overflow: hidden;
}

.inv-alert__fill {
    height: 100%;
    background: var(--t-danger);
    border-radius: 2px;
    transition: width var(--t-transition-normal);
}
</style>
