<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'

defineProps<{
    name: string
    description: string
    icon: string
    minInvestment: string
    successChance: string
    returnMultiplier: number
    disabled: boolean
}>()

defineEmits<{
    invest: []
}>()
</script>

<template>
    <div class="item-card opportunity-card">
        <div class="item-card-header">
            <div class="item-card-title">
                <AppIcon :icon="icon" class="item-card-icon" />
                <h3 class="item-card-name">{{ name }}</h3>
            </div>
        </div>

        <p class="item-card-description">{{ description }}</p>

        <div class="item-card-stats">
            <span>{{ $t('investments.min_label') }} <strong class="text-gold">{{ minInvestment }}</strong></span>
            <span>{{ $t('investments.success') }} <strong class="text-sky">{{ successChance }}</strong></span>
            <span>{{ $t('investments.return_label') }} <strong class="text-emerald">{{ returnMultiplier
            }}x</strong></span>
        </div>

        <div class="item-card-actions">
            <UButton variant="primary" size="sm" icon="mdi:send" :disabled="disabled" @click="$emit('invest')">
                {{ $t('investments.invest_amount', { amount: minInvestment }) }}
            </UButton>
        </div>
    </div>
</template>

<style scoped>
.opportunity-card {
    display: flex;
    flex-direction: column;
}

.opportunity-card .item-card-actions {
    margin-top: auto;
}
</style>
