<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import { useFormat } from '@renderer/composables/useFormat'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { type BusinessDef } from '@renderer/data/businesses'

const props = withDefaults(defineProps<{
    def: BusinessDef
    owned?: boolean
}>(), {
    owned: false
})

const emit = defineEmits<{
    buy: [defId: string]
}>()

const player = usePlayerStore()
const { formatCash } = useFormat()

const canAfford = computed(() => player.canAfford(props.def.purchasePrice))
const isUnlocked = computed(() => player.netWorth.gte(props.def.unlockAtNetWorth))
</script>

<template>
    <div class="purchase-card" :class="{ locked: !isUnlocked }">
        <div class="purchase-header">
            <div class="biz-icon-wrap">
                <AppIcon :icon="def.icon" class="biz-icon" />
            </div>
            <div class="purchase-info">
                <h3 class="purchase-name">{{ def.name }}</h3>
                <span class="purchase-category">{{ def.category }}</span>
            </div>
        </div>

        <div class="purchase-stats">
            <div class="ps-row">
                <span class="ps-label">{{ $t('business.base_customers') }}</span>
                <span class="ps-value">{{ def.baseCustomers }}</span>
            </div>
            <div class="ps-row">
                <span class="ps-label">{{ $t('business.optimal_price') }}</span>
                <span class="ps-value">${{ def.optimalPrice }}</span>
            </div>
            <div class="ps-row">
                <span class="ps-label">{{ $t('business.output_per_emp') }}</span>
                <span class="ps-value">{{ def.outputPerEmployee }}/t</span>
            </div>
        </div>

        <UButton variant="success" icon="mdi:cart-plus" class="buy-button" :disabled="!canAfford || owned" @click="emit('buy', def.id)">
            <span v-if="owned">{{ $t('business.already_owned') }}</span>
            <span v-else>{{ $t('common.buy') }} — {{ formatCash(def.purchasePrice) }}</span>
        </UButton>
    </div>
</template>

<style scoped>
.purchase-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px dashed var(--t-border);
    border-radius: var(--t-radius-lg);
    transition: border-color var(--t-transition-fast);
}

.purchase-card:hover {
    border-color: var(--t-border-hover);
    border-style: solid;
}

.purchase-card.locked {
    opacity: 0.5;
    pointer-events: none;
}

.purchase-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.biz-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.biz-icon {
    font-size: 1.1rem;
    color: var(--t-text-secondary);
}

.purchase-info {
    flex: 1;
}

.purchase-name {
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    margin: 0;
}

.purchase-category {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    background: var(--t-bg-secondary);
    padding: 0.1rem 0.4rem;
    border-radius: var(--t-radius-sm);
}

.purchase-stats {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.ps-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-xs);
}

.ps-label {
    color: var(--t-text-muted);
}

.ps-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
}

.buy-button {
    width: 100%;
}

.buy-button:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}
</style>
