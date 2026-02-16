<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'

defineProps<{
    name: string
    description: string
    icon: string
    effectTarget: string
    baseEffect: string | number
    prerequisites: string[]
    purchased: boolean
    unlocked: boolean
    cost: string
    canAfford: boolean
}>()

defineEmits<{
    buy: []
}>()
</script>

<template>
    <div class="upgrade-card item-card" :class="{
        'owned': purchased,
        'locked': !unlocked,
        'available': unlocked && !purchased
    }">
        <div class="upgrade-header">
            <div class="upgrade-icon-wrap" :class="{
                'icon-purchased': purchased,
                'icon-available': unlocked && !purchased,
                'icon-locked': !unlocked
            }">
                <AppIcon :icon="icon || 'mdi:arrow-up-bold'" class="upgrade-icon" />
            </div>
            <div class="upgrade-info">
                <h3 class="upgrade-name">{{ name }}</h3>
                <p class="upgrade-description">{{ description }}</p>
            </div>
        </div>

        <div class="upgrade-effect">
            <AppIcon icon="mdi:flash" class="text-emerald" />
            <span>{{ effectTarget }}: <strong>+{{ baseEffect }}</strong></span>
        </div>

        <div v-if="prerequisites?.length" class="upgrade-prereqs">
            <AppIcon icon="mdi:lock" />
            <span>{{ $t('skilltree.requires', { list: prerequisites.join(', ') }) }}</span>
        </div>

        <div class="upgrade-action">
            <button v-if="!purchased" class="btn btn-sm btn-block" :class="unlocked ? 'btn-primary' : 'btn-ghost'"
                :disabled="!unlocked || !canAfford" @click="$emit('buy')">
                <i :class="unlocked ? 'pi pi-shopping-cart' : 'pi pi-lock'"></i>
                {{ unlocked ? cost : $t('common.locked') }}
            </button>
            <div v-else class="purchased-badge">
                <AppIcon icon="mdi:check-circle" />
                <span>{{ $t('skilltree.purchased') }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.upgrade-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.upgrade-card.owned {
    border-color: var(--t-border-focus);
}

.upgrade-card.available:hover {
    border-color: var(--t-border-hover);
    transform: translateY(-2px);
}

.upgrade-card.locked {
    opacity: 0.5;
}

.upgrade-header {
    display: flex;
    gap: var(--t-space-3);
}

.upgrade-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: var(--t-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.upgrade-icon {
    font-size: 1.5rem;
}

.icon-purchased {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.icon-available {
    background: var(--t-bg-muted);
    color: var(--t-text);
}

.icon-locked {
    background: var(--t-bg-muted);
    color: var(--t-text-muted);
}

.upgrade-info {
    flex: 1;
    min-width: 0;
}

.upgrade-name {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.upgrade-description {
    font-size: 0.8rem;
    color: var(--t-text-secondary);
    line-height: 1.4;
}

.upgrade-effect {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.upgrade-prereqs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--t-text-muted);
}

.upgrade-action {
    margin-top: auto;
}

.purchased-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    color: var(--t-success);
    font-size: 0.9rem;
    font-weight: 600;
}
</style>
