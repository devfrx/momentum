<script setup lang="ts">
/**
 * DealGrid — Grid of available black-market deals with rotation timer.
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import DealCard from './DealCard.vue'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useI18n } from 'vue-i18n'
import { gte } from '@renderer/core/BigNum'

const blackmarket = useBlackMarketStore()
const player = usePlayerStore()
const { t } = useI18n()

const emit = defineEmits<{ accepted: [dealId: string, success: boolean, message: string] }>()

const rotationMinutes = computed(() => {
    const secs = blackmarket.timeToNextRotation
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
})

function handleAccept(dealId: string): void {
    const result = blackmarket.acceptDeal(dealId)
    emit('accepted', dealId, result.success, result.message)
}

function canAfford(cost: import('break_infinity.js').default): boolean {
    return gte(player.cash, cost)
}
</script>

<template>
    <div class="deal-grid-wrapper">
        <!-- Rotation timer -->
        <div class="deal-grid__timer">
            <AppIcon icon="mdi:timer-sand" />
            <span>{{ t('blackmarket.next_rotation') }}: <strong>{{ rotationMinutes }}</strong></span>
        </div>

        <!-- Deals grid -->
        <div v-if="blackmarket.availableDeals.length > 0" class="deal-grid">
            <DealCard v-for="deal in blackmarket.availableDeals" :key="deal.id" :deal="deal"
                :disabled="!canAfford(deal.cost)" @accept="handleAccept" />
        </div>

        <!-- Empty state -->
        <div v-else class="empty-state">
            <AppIcon icon="mdi:skull-crossbones" class="empty-icon" />
            <p>{{ t('blackmarket.no_deals') }}</p>
            <span class="empty-hint">{{ t('blackmarket.no_deals_hint') }}</span>
        </div>
    </div>
</template>

<style scoped>
.deal-grid-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

.deal-grid__timer {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    width: fit-content;
}

.deal-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--t-space-4);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-8);
    color: var(--t-text-muted);
    text-align: center;
}

.empty-icon {
    font-size: 4rem;
    opacity: 0.2;
}

.empty-hint {
    font-size: var(--t-font-size-xs);
}
</style>
