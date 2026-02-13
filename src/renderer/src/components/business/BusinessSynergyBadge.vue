<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { synergyCategoryMultiplier } from '@renderer/data/businesses'
import type { BusinessCategory } from '@renderer/data/businesses'

const props = defineProps<{
    category: BusinessCategory
    count: number
}>()

const multiplier = computed(() => synergyCategoryMultiplier(props.count))
</script>

<template>
    <div v-if="count > 1" class="synergy-badge"
        :title="$t('business.synergy_tooltip', { category, count, mult: multiplier.toFixed(2) })">
        <AppIcon icon="mdi:lightning-bolt" class="synergy-icon" />
        <span class="synergy-text">×{{ multiplier.toFixed(2) }}</span>
    </div>
</template>

<style scoped>
.synergy-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.45rem;
    background: var(--t-accent-alpha, rgba(var(--t-accent-rgb, 99, 102, 241), 0.12));
    border: 1px solid var(--t-accent);
    border-radius: var(--t-radius-pill, 999px);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-accent);
    white-space: nowrap;
}

.synergy-icon {
    font-size: 0.85rem;
}

.synergy-text {
    font-family: var(--t-font-mono);
}
</style>
