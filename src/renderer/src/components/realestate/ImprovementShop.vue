<script setup lang="ts">
/**
 * ImprovementShop — Panel showing available improvements for a property
 * and allowing the player to purchase and install them.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore, type Property } from '@renderer/stores/useRealEstateStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { getAvailableImprovements, type ImprovementDef } from '@renderer/data/realestate'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const player = usePlayerStore()
const { formatCash, formatPercent } = useFormat()

const props = defineProps<{
    property: Property
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'installed'): void
}>()

const availableImprovements = computed(() =>
    getAvailableImprovements(
        props.property.category,
        props.property.currentValue.toNumber(),
        props.property.improvements,
    ),
)

const slotsRemaining = computed(() =>
    props.property.maxImprovements - props.property.improvements.length,
)

function getCost(imp: ImprovementDef): number {
    return Math.round(props.property.currentValue.toNumber() * imp.costFraction)
}

function canAfford(imp: ImprovementDef): boolean {
    return player.cash.gte(getCost(imp))
}

function handleInstall(imp: ImprovementDef): void {
    const ok = realEstate.installImprovement(props.property.id, imp.id)
    if (ok) emit('installed')
}
</script>

<template>
    <div class="improvement-shop">
        <div class="shop-header">
            <div>
                <!-- <h3 class="shop-title">{{ t('realestate.improvement_shop') }}</h3> -->
                <span class="shop-subtitle">
                    {{ t('realestate.slots_remaining', { count: slotsRemaining }) }}
                </span>
            </div>
            <!-- <Button icon="pi pi-times" text rounded size="small" @click="emit('close')" /> -->
        </div>

        <div v-if="slotsRemaining <= 0" class="full-notice">
            <AppIcon icon="mdi:alert-circle-outline" size="1rem" />
            <span>{{ t('realestate.improvements_full') }}</span>
        </div>

        <div v-else-if="availableImprovements.length === 0" class="empty-notice">
            <AppIcon icon="mdi:information-outline" size="1rem" />
            <span>{{ t('realestate.no_improvements_available') }}</span>
        </div>

        <div v-else class="improvement-grid">
            <div v-for="imp in availableImprovements" :key="imp.id" class="imp-card"
                :class="{ unaffordable: !canAfford(imp) }">
                <div class="imp-header">
                    <AppIcon :icon="imp.icon" size="1.5rem" />
                    <div>
                        <h4 class="imp-name">{{ t(imp.nameKey) }}</h4>
                        <p class="imp-desc">{{ t(imp.descriptionKey) }}</p>
                    </div>
                </div>

                <div class="imp-stats">
                    <div class="imp-stat" v-if="imp.rentBonus > 0">
                        <AppIcon icon="mdi:cash-plus" size="0.7rem" />
                        <span>{{ formatPercent(imp.rentBonus * 100) }} {{ t('realestate.rent') }}</span>
                    </div>
                    <div class="imp-stat" v-if="imp.occupancyBonus > 0">
                        <AppIcon icon="mdi:account-plus" size="0.7rem" />
                        <span>{{ formatPercent(imp.occupancyBonus * 100) }} {{ t('realestate.occupancy') }}</span>
                    </div>
                    <div class="imp-stat" v-if="imp.wearMod < 1">
                        <AppIcon icon="mdi:shield-check" size="0.7rem" />
                        <span>{{ formatPercent((1 - imp.wearMod) * 100) }} {{ t('realestate.less_wear') }}</span>
                    </div>
                    <div class="imp-stat" v-if="imp.appreciationMod > 1">
                        <AppIcon icon="mdi:trending-up" size="0.7rem" />
                        <span>{{ formatPercent((imp.appreciationMod - 1) * 100) }} {{ t('realestate.appreciation')
                            }}</span>
                    </div>
                    <div class="imp-stat" v-if="imp.valueFraction > 0">
                        <AppIcon icon="mdi:home-plus" size="0.7rem" />
                        <span>{{ formatPercent(imp.valueFraction * 100) }} {{ t('realestate.current_value') }}</span>
                    </div>
                </div>

                <div class="imp-footer">
                    <span class="imp-cost">{{ formatCash(getCost(imp)) }}</span>
                    <Button :label="t('realestate.install')" icon="pi pi-plus" :disabled="!canAfford(imp)"
                        severity="success" size="small" @click="handleInstall(imp)" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.improvement-shop {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
}

.shop-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.shop-title {
    margin: 0;
    font-size: var(--t-font-size-lg);
    font-weight: 700;
    color: var(--t-text);
}

.shop-subtitle {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

.full-notice,
.empty-notice {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-sm);
}

.full-notice {
    background: var(--t-danger-muted);
    border: 1px solid color-mix(in srgb, var(--t-danger) 20%, transparent);
    color: var(--t-danger);
}

.empty-notice {
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    color: var(--t-text-secondary);
}

.improvement-grid {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.imp-card {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
    background: var(--t-bg-card);
    transition: border-color var(--t-transition-fast);
}

.imp-card:hover {
    border-color: var(--t-border-hover);
}

.imp-card.unaffordable {
    opacity: 0.45;
}

.imp-header {
    display: flex;
    gap: var(--t-space-2);
    align-items: flex-start;
}

.imp-name {
    margin: 0;
    font-size: var(--t-font-size-base);
    font-weight: 700;
    color: var(--t-text);
}

.imp-desc {
    margin: 0;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    line-height: 1.35;
}

.imp-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.imp-stat {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    padding: 2px 6px;
    background: var(--t-success-muted);
    border-radius: 4px;
    font-size: var(--t-font-size-xs);
    color: var(--t-success);
}

.imp-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--t-space-2);
    border-top: 1px solid var(--t-border);
}

.imp-cost {
    font-family: var(--t-font-mono);
    font-weight: 800;
    font-size: var(--t-font-size-base);
    color: var(--t-accent);
}
</style>
