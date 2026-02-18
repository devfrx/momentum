<script setup lang="ts">
/**
 * DealCard — Displays a single black-market deal with risk indicator,
 * cost, effects, and accept action.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton, UCard } from '@renderer/components/ui'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import type { BlackMarketDeal } from '@renderer/data/blackmarket'

const props = defineProps<{
    deal: BlackMarketDeal
    disabled?: boolean
}>()

defineEmits<{ accept: [dealId: string] }>()

const { formatCash, formatNumber } = useFormat()
const { t } = useI18n()

import { RISK_COLORS } from '@renderer/assets/theme/colors'

function riskColor(risk: number): string {
    if (risk <= 20) return RISK_COLORS.low
    if (risk <= 40) return RISK_COLORS.medium
    if (risk <= 60) return RISK_COLORS.high
    if (risk <= 80) return RISK_COLORS.extreme
    return RISK_COLORS.critical
}

function riskLabel(risk: number): string {
    if (risk <= 20) return t('blackmarket.risk_low')
    if (risk <= 40) return t('blackmarket.risk_moderate')
    if (risk <= 60) return t('blackmarket.risk_high')
    if (risk <= 80) return t('blackmarket.risk_very_high')
    return t('blackmarket.risk_extreme')
}

function categoryIcon(category: string): string {
    const map: Record<string, string> = {
        intel: 'mdi:eye',
        goods: 'mdi:package-variant-closed',
        finance: 'mdi:bank-transfer',
        boost: 'mdi:rocket-launch',
        special: 'mdi:star-shooting',
        legendary: 'mdi:crown',
    }
    return map[category] ?? 'mdi:help-circle'
}
</script>

<template>
    <UCard class="deal-card" radius="md" :style="{ '--_risk-color': riskColor(deal.risk) }">
        <template #header>
            <div class="deal-card__head">
                <AppIcon :icon="deal.icon" class="deal-card__icon" />
                <div class="deal-card__identity">
                    <span class="deal-card__name">{{ t(deal.nameKey) }}</span>
                    <span class="deal-card__category">
                        <AppIcon :icon="categoryIcon(deal.category)" />
                        {{ t(`blackmarket.cat_${deal.category}`) }}
                    </span>
                </div>
            </div>
        </template>

        <!-- Description -->
        <p class="deal-card__desc">{{ t(deal.descKey) }}</p>

        <!-- Risk bar -->
        <div class="deal-card__risk">
            <span class="deal-card__risk-label">{{ t('blackmarket.risk') }}</span>
            <div class="deal-card__risk-bar">
                <div class="deal-card__risk-fill" :style="{ width: `${deal.risk}%` }" />
            </div>
            <span class="deal-card__risk-value">{{ riskLabel(deal.risk) }} ({{ deal.risk }}%)</span>
        </div>

        <!-- Effects preview -->
        <div v-if="deal.effects.length" class="deal-card__effects">
            <div v-for="(eff, i) in deal.effects" :key="i" class="deal-card__effect">
                <AppIcon icon="mdi:arrow-up-bold" class="deal-card__effect-icon" />
                <span>{{ t(`blackmarket.effect_${eff.type}`, {
                    value: eff.type === 'cash_grant' ? formatNumber(eff.value) : eff.value,
                    duration: Math.round(eff.durationTicks / 10)
                }) }}</span>
            </div>
        </div>

        <!-- Stats -->
        <div class="deal-card__stats">
            <div class="deal-card__kpi">
                <span class="deal-card__kpi-label">{{ t('blackmarket.cost') }}</span>
                <span class="deal-card__kpi-value">{{ formatCash(deal.cost) }}</span>
            </div>
            <div class="deal-card__kpi">
                <span class="deal-card__kpi-label">{{ t('blackmarket.xp_reward') }}</span>
                <span class="deal-card__kpi-value">+{{ deal.xpReward }} XP</span>
            </div>
            <div class="deal-card__kpi">
                <span class="deal-card__kpi-label">{{ t('blackmarket.rep_reward') }}</span>
                <span class="deal-card__kpi-value">+{{ deal.repReward }}</span>
            </div>
        </div>

        <template #footer>
            <UButton variant="primary" size="sm" icon="mdi:check" block :disabled="disabled"
                @click="$emit('accept', deal.id)">{{ t('blackmarket.accept_deal') }}</UButton>
        </template>
    </UCard>
</template>

<style scoped>
.deal-card__head {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.deal-card__icon {
    font-size: 1.4rem;
    color: var(--_risk-color, var(--t-accent));
    flex-shrink: 0;
}

.deal-card__identity {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.deal-card__name {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-base);
    color: var(--t-text);
}

.deal-card__category {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.deal-card__desc {
    margin: 0;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    line-height: 1.5;
}

/* Risk bar */
.deal-card__risk {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.deal-card__risk-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
}

.deal-card__risk-bar {
    flex: 1;
    height: 6px;
    background: var(--t-bg-muted);
    border-radius: 3px;
    overflow: hidden;
}

.deal-card__risk-fill {
    height: 100%;
    background: var(--_risk-color, var(--t-danger));
    border-radius: 3px;
    transition: width var(--t-transition-normal);
}

.deal-card__risk-value {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--_risk-color, var(--t-danger));
    white-space: nowrap;
}

/* Effects */
.deal-card__effects {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.deal-card__effect {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

.deal-card__effect-icon {
    color: var(--t-success);
    font-size: 0.75rem;
}

/* Stats */
.deal-card__stats {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--t-space-2);
}

.deal-card__kpi {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.deal-card__kpi-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.deal-card__kpi-value {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}
</style>
