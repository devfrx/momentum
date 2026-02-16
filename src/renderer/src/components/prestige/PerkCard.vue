<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import type { PerkEffect } from '@renderer/data/prestige'
import { THEME } from '@renderer/assets/theme/colors'

const { t } = useI18n()

defineProps<{
    name: string
    description: string
    icon: string
    cost: string
    purchased: boolean
    canBuy: boolean
    effect: PerkEffect
    category: 'automation' | 'boost' | 'unlock' | 'quality_of_life'
    prerequisites: string[]
    prerequisitesMet: boolean
}>()

defineEmits<{
    buy: []
}>()

const categoryColors: Record<string, string> = {
    automation: THEME.info,
    boost: THEME.success,
    unlock: THEME.purple,
    quality_of_life: THEME.warning,
}

const catKeys: Record<string, string> = {
    automation: 'prestige.cat_automation',
    boost: 'prestige.cat_boost',
    unlock: 'prestige.cat_unlock',
    quality_of_life: 'prestige.cat_qol',
}

function formatEffect(effect: PerkEffect): string {
    const value = effect.value * 100
    const n = value.toFixed(0)
    switch (effect.type) {
        case 'global_multiplier':
            return t('prestige.effect_all_income', { n })
        case 'prestige_gain':
            return t('prestige.effect_prestige_gain', { n })
        case 'starting_cash':
            return t('prestige.effect_rebirth_cash', { n: effect.value.toLocaleString() })
        case 'job_efficiency':
            return t('prestige.effect_job_efficiency', { n })
        case 'offline_bonus':
            return t('prestige.effect_offline', { n })
        case 'stock_returns':
            return t('prestige.effect_stock_returns', { n })
        case 'loan_discount':
            return t('prestige.effect_loan_interest', { n })
        case 'business_revenue':
            return t('prestige.effect_business_revenue', { n })
        case 'real_estate_income':
            return t('prestige.effect_realestate_income', { n })
        case 'unlock':
            return t('prestige.effect_unlock_target', { target: effect.target?.replace(/_/g, ' ') })
        default:
            return `+${n}% ${effect.type}`
    }
}
</script>

<template>
    <div class="perk-card item-card" :class="{ purchased, locked: !prerequisitesMet && !purchased }">
        <div class="perk-header">
            <div class="perk-icon-wrap" :style="{ borderColor: categoryColors[category] }">
                <AppIcon :icon="icon" class="perk-icon" :style="{ color: categoryColors[category] }" />
            </div>
            <div class="perk-info">
                <div class="perk-title-row">
                    <h4 class="perk-name">{{ name }}</h4>
                    <span class="perk-category"
                        :style="{ backgroundColor: categoryColors[category] + '20', color: categoryColors[category] }">
                        {{ $t(catKeys[category]) }}
                    </span>
                </div>
                <p class="perk-description">{{ description }}</p>
            </div>
        </div>

        <div class="perk-effect">
            <AppIcon icon="mdi:flash" />
            <span>{{ formatEffect(effect) }}</span>
        </div>

        <div v-if="!prerequisitesMet && !purchased && prerequisites.length" class="perk-prerequisites">
            <AppIcon icon="mdi:lock" />
            <span>{{ $t('prestige.requires', { list: prerequisites.join(', ') }) }}</span>
        </div>

        <div class="perk-action">
            <div v-if="purchased" class="purchased-badge">
                <AppIcon icon="mdi:check-circle" />
                <span>{{ $t('common.owned') }}</span>
            </div>
            <Button v-else :label="$t('prestige.cost_pp', { n: cost })" icon="pi pi-shopping-cart" size="small"
                :disabled="!canBuy" class="w-full" @click="$emit('buy')" />
        </div>
    </div>
</template>

<style scoped>
.perk-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.perk-card.purchased {
    border-color: var(--t-border-focus);
    background: var(--t-bg-card-hover);
}

.perk-card.locked {
    opacity: 0.6;
}

.perk-header {
    display: flex;
    gap: var(--t-space-3);
}

.perk-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: var(--t-radius-md);
    border: 2px solid;
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.perk-icon {
    font-size: 1.5rem;
}

.perk-info {
    flex: 1;
    min-width: 0;
}

.perk-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
}

.perk-name {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
}

.perk-category {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.4rem;
    border-radius: var(--t-radius-sm);
}

.perk-description {
    font-size: 0.8rem;
    color: var(--t-text-secondary);
    margin: 0;
    line-height: 1.4;
}

.perk-effect {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    color: var(--t-text-secondary);
}

.perk-effect svg {
    color: var(--t-purple);
}

.perk-prerequisites {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--t-text-muted);
}

.perk-prerequisites svg {
    font-size: 0.9rem;
}

.perk-action {
    margin-top: auto;
}

.purchased-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: color-mix(in srgb, var(--t-success) 15%, transparent);
    border-radius: var(--t-radius-sm);
    color: var(--t-success);
    font-weight: 600;
    font-size: 0.85rem;
}
</style>
