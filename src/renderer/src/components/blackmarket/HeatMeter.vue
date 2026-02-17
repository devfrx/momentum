<script setup lang="ts">
/**
 * HeatMeter — Visualizes the current heat level with color-coded
 * segments and active penalty indicators.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { MAX_HEAT } from '@renderer/data/blackmarket'

const bm = useBlackMarketStore()
const { t } = useI18n()

const heatPct = computed(() => Math.round((bm.heat / MAX_HEAT) * 100))

const currentLevel = computed(() => bm.currentHeatLevel)

const activePenalties = computed(() =>
    currentLevel.value.penalties.filter(p => p.value > 0),
)

function penaltyLabel(type: string, value: number): string {
    switch (type) {
        case 'income_penalty': return t('blackmarket.penalty_income', { pct: Math.round((1 - value) * 100) })
        case 'deal_cost_increase': return t('blackmarket.penalty_cost', { pct: Math.round(value * 100) })
        case 'risk_increase': return t('blackmarket.penalty_risk', { value })
        case 'investigation_chance': return t('blackmarket.penalty_investigation', { pct: Math.round(value * 100) })
        default: return ''
    }
}
</script>

<template>
    <div class="heat-meter" :style="{ '--_heat-color': currentLevel.color }">
        <div class="heat-meter__head">
            <AppIcon :icon="currentLevel.icon" class="heat-meter__icon" />
            <span class="heat-meter__label">{{ t('blackmarket.heat') }}</span>
            <span class="heat-meter__level">{{ t(currentLevel.nameKey) }}</span>
            <span class="heat-meter__value">{{ bm.heat.toFixed(0) }} / {{ MAX_HEAT }}</span>
        </div>

        <div class="heat-meter__track">
            <div class="heat-meter__fill" :style="{ width: `${heatPct}%` }" />
        </div>

        <!-- Active penalties -->
        <div v-if="activePenalties.length > 0" class="heat-meter__penalties">
            <span v-for="(pen, i) in activePenalties" :key="i" class="heat-meter__penalty">
                <AppIcon icon="mdi:alert-circle" />
                {{ penaltyLabel(pen.type, pen.value) }}
            </span>
        </div>
    </div>
</template>

<style scoped>
.heat-meter {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
}

.heat-meter__head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.heat-meter__icon {
    font-size: 1.1rem;
    color: var(--_heat-color, var(--t-text-muted));
}

.heat-meter__label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.heat-meter__level {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-sm);
    color: var(--_heat-color, var(--t-text));
}

.heat-meter__value {
    margin-left: auto;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-muted);
}

.heat-meter__track {
    height: 8px;
    background: var(--t-bg-muted);
    border-radius: 4px;
    overflow: hidden;
}

.heat-meter__fill {
    height: 100%;
    background: var(--_heat-color, var(--t-danger));
    border-radius: 4px;
    transition: width var(--t-transition-normal);
}

.heat-meter__penalties {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-2);
}

.heat-meter__penalty {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-xs);
    color: var(--_heat-color, var(--t-danger));
    padding: 0.2rem 0.5rem;
    background: var(--t-danger-muted);
    border-radius: var(--t-radius-sm);
}
</style>
