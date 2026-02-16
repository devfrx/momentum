<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PrestigeEffectType } from '@renderer/data/prestige'

const { t } = useI18n()

const props = defineProps<{
    name: string
    description: string
    icon?: string
    effectType: PrestigeEffectType
    effectValue: number
    level: number
    maxLevel: number
    cost: string
    canAfford: boolean
    category?: string
}>()

defineEmits<{
    buy: []
}>()

function formatEffect(type: PrestigeEffectType, value: number): string {
    const percent = value * 100
    const n = percent.toFixed(0)
    switch (type) {
        case 'global_multiplier':
            return t('prestige.effect_all_income', { n })
        case 'prestige_gain':
            return t('prestige.effect_prestige_gain', { n })
        case 'starting_cash':
            return t('prestige.effect_cash', { n: value.toLocaleString() })
        case 'starting_xp':
            return t('prestige.effect_xp', { n: value.toLocaleString() })
        case 'job_efficiency':
            return t('prestige.effect_job_efficiency', { n })
        case 'offline_bonus':
            return t('prestige.effect_offline', { n })
        case 'xp_gain':
            return t('prestige.effect_xp_gain', { n })
        case 'cost_reduction':
            return t('prestige.effect_costs', { n })
        case 'business_revenue':
            return t('prestige.effect_business_revenue', { n })
        case 'stock_returns':
            return t('prestige.effect_investment_returns', { n })
        case 'crypto_returns':
            return t('prestige.effect_crypto_returns', { n })
        case 'real_estate_income':
            return t('prestige.effect_realestate_income', { n })
        case 'loan_discount':
            return t('prestige.effect_loan_interest', { n })
        case 'unlock':
            return t('prestige.effect_unlock')
        default:
            return `+${n}% ${type}`
    }
}

const currentEffect = computed(() => formatEffect(props.effectType, props.effectValue * props.level))
const nextEffect = computed(() => formatEffect(props.effectType, props.effectValue * (props.level + 1)))
</script>

<template>
    <div class="upgrade-card item-card" :class="{ owned: level > 0, maxed: level >= maxLevel }">
        <div class="upgrade-header">
            <div class="upgrade-icon-wrap" :class="{ owned: level > 0 }">
                <AppIcon :icon="icon || 'mdi:diamond'" class="upgrade-icon" />
            </div>
            <div class="upgrade-info">
                <h3 class="upgrade-name">{{ name }}</h3>
                <p class="upgrade-description">{{ description }}</p>
            </div>
        </div>

        <div class="upgrade-stats">
            <div v-if="level > 0" class="current-effect">
                <span class="effect-label">{{ $t('prestige.current') }}</span>
                <span class="effect-value">{{ currentEffect }}</span>
            </div>
            <div v-if="level < maxLevel" class="next-effect">
                <span class="effect-label">{{ level > 0 ? $t('prestige.next') : $t('prestige.effect_label') }}</span>
                <span class="effect-value">{{ nextEffect }}</span>
            </div>
        </div>

        <div class="upgrade-footer">
            <div class="level-display">
                <span class="level-current">{{ $t('common.level', { n: level }) }}</span>
                <span class="level-max">/{{ maxLevel }}</span>
            </div>
            <div class="upgrade-action">
                <Button v-if="level < maxLevel" :label="$t('prestige.cost_pp', { n: cost })" icon="pi pi-plus"
                    size="small" :disabled="!canAfford" @click="$emit('buy')" />
                <div v-else class="maxed-badge">
                    <AppIcon icon="mdi:check-circle" />
                    {{ $t('common.max') }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.upgrade-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.upgrade-card.owned {
    border-color: var(--t-border-focus);
}

.upgrade-card.maxed {
    border-color: var(--t-success);
    background: color-mix(in srgb, var(--t-success) 5%, transparent);
}

.upgrade-header {
    display: flex;
    gap: var(--t-space-3);
}

.upgrade-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.upgrade-icon-wrap.owned {
    background: color-mix(in srgb, var(--t-purple) 15%, transparent);
}

.upgrade-icon {
    font-size: 1.35rem;
    color: var(--t-text-secondary);
}

.upgrade-icon-wrap.owned .upgrade-icon {
    color: var(--t-purple);
}

.upgrade-info {
    flex: 1;
    min-width: 0;
}

.upgrade-name {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0 0 0.2rem 0;
}

.upgrade-description {
    font-size: 0.78rem;
    color: var(--t-text-secondary);
    margin: 0;
    line-height: 1.4;
}

.upgrade-stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.current-effect,
.next-effect {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
}

.effect-label {
    color: var(--t-text-muted);
}

.effect-value {
    font-weight: 600;
    color: var(--t-text);
}

.current-effect .effect-value {
    color: var(--t-success);
}

.next-effect .effect-value {
    color: var(--t-text-secondary);
}

.upgrade-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
}

.level-display {
    font-family: var(--t-font-mono);
    font-size: 0.9rem;
}

.level-current {
    font-weight: 700;
    color: var(--t-text);
}

.level-max {
    color: var(--t-text-muted);
}

.upgrade-action {
    min-width: 90px;
}

.maxed-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    background: color-mix(in srgb, var(--t-success) 15%, transparent);
    border-radius: var(--t-radius-sm);
    color: var(--t-success);
    font-weight: 700;
    font-size: 0.8rem;
}
</style>
