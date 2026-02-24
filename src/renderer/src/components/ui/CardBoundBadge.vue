<script setup lang="ts">
/**
 * CardBoundBadge — Small credit card icon shown on entities with a bound/saved card.
 * 
 * Displays a subtle card icon with a checkmark. On hover, a UTooltip reveals
 * card details: tier, last 4 digits, and fee rate.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCardPaymentStore } from '@renderer/stores/useCardPaymentStore'
import { useBankingStore } from '@renderer/stores/useBankingStore'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UTooltip } from '@renderer/components/ui'

const props = defineProps<{
    /** Entity key in format "entityType:entityId" */
    entityKey: string
}>()

const { t } = useI18n()
const cardPayment = useCardPaymentStore()
const banking = useBankingStore()

const isBound = computed(() => cardPayment.isBound(props.entityKey))
const tierLabel = computed(() => banking.cardTier.charAt(0).toUpperCase() + banking.cardTier.slice(1))
const last4 = computed(() => banking.card.number.slice(-4))
</script>

<template>
    <UTooltip v-if="isBound" placement="top">
        <span class="card-bound-badge">
            <AppIcon icon="mdi:credit-card-check-outline" class="card-bound-icon" />
        </span>
        <template #content>
            <div class="card-bound-tip">
                <div class="card-bound-tip__title">
                    <AppIcon icon="mdi:credit-card-check" class="card-bound-tip__icon" />
                    {{ t('card_bound.tooltip_title') }}
                </div>
                <div class="card-bound-tip__row">
                    <span class="card-bound-tip__label">{{ tierLabel }}</span>
                    <span class="card-bound-tip__digits">&bull;&bull;&bull;&bull; {{ last4 }}</span>
                </div>
                <div class="card-bound-tip__row">
                    <span class="card-bound-tip__label">{{ t('card_bound.fee') }}</span>
                    <span class="card-bound-tip__value"
                        :class="{ 'card-bound-tip__free': cardPayment.feePercent === 0 }">
                        {{ cardPayment.feePercent === 0 ? t('card_bound.free') : cardPayment.feePercent + '%' }}
                    </span>
                </div>
            </div>
        </template>
    </UTooltip>
</template>

<style scoped>
.card-bound-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px;
    border-radius: var(--t-radius-sm, 4px);
    background: color-mix(in srgb, var(--t-accent) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--t-accent) 25%, transparent);
    cursor: default;
}

.card-bound-icon {
    font-size: 14px;
    color: var(--t-accent);
    opacity: 0.85;
}

.card-bound-badge:hover {
    background: color-mix(in srgb, var(--t-accent) 18%, transparent);
    border-color: color-mix(in srgb, var(--t-accent) 40%, transparent);
}

.card-bound-badge:hover .card-bound-icon {
    opacity: 1;
}

/* Tooltip content */
.card-bound-tip {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 140px;
}

.card-bound-tip__title {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-xs);
    margin-bottom: 2px;
}

.card-bound-tip__icon {
    font-size: 12px;
    color: var(--t-accent);
}

.card-bound-tip__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-xs);
}

.card-bound-tip__label {
    color: var(--t-text-muted);
}

.card-bound-tip__digits {
    font-family: var(--t-font-mono);
    letter-spacing: 0.05em;
}

.card-bound-tip__value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
}

.card-bound-tip__free {
    color: var(--t-success);
}
</style>
