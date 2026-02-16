<script setup lang="ts">
/**
 * InventoryItem — Displays a single item in the inventory.
 * Shows rarity-colored border, appraisal status, value, and action buttons.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { rarityCssVar } from '@renderer/data/rarity'
import { resolveItemName, resolveItemDescription } from '@renderer/data/storage/items'
import { CONDITION_ICONS, CONDITION_COLORS } from '@renderer/data/shop/restoration'
import type { InventoryItem as InventoryItemType } from '@renderer/stores/useStorageStore'

defineProps<{
    item: InventoryItemType
}>()

defineEmits<{
    appraise: [itemId: string]
    sell: [itemId: string]
}>()

const { formatCash } = useFormat()
const { t } = useI18n()
</script>

<template>
    <div class="inv-item" :style="{ '--_rarity': rarityCssVar(item.rarity) }">
        <div class="inv-item__header">
            <AppIcon :icon="item.icon" class="inv-item__icon" :style="{ color: rarityCssVar(item.rarity) }" />
            <div class="inv-item__info">
                <span class="inv-item__name">{{ resolveItemName(item, t) }}</span>
                <span class="inv-item__rarity" :style="{ color: rarityCssVar(item.rarity) }">{{ item.rarity }}</span>
            </div>
        </div>

        <p class="inv-item__desc">{{ resolveItemDescription(item, t) }}</p>

        <div class="inv-item__value-row">
            <span class="inv-item__category">{{ item.category }}</span>
            <div v-if="item.appraised && item.condition" class="inv-item__condition"
                :style="{ color: CONDITION_COLORS[item.condition] }">
                <AppIcon :icon="CONDITION_ICONS[item.condition]" />
                {{ t(`items.condition.${item.condition}`) }}
            </div>
            <div v-else-if="!item.appraised && item.condition" class="inv-item__condition inv-item__condition--hidden">
                <AppIcon icon="mdi:help-circle-outline" />
                {{ t('storage.condition_unknown') }}
            </div>
            <div class="inv-item__value">
                <template v-if="item.appraised">
                    <AppIcon icon="mdi:check-circle" class="appraised-icon" />
                    <span class="value-text value-text--appraised">{{ formatCash(item.appraisedValue!) }}</span>
                </template>
                <template v-else>
                    <AppIcon icon="mdi:help-circle" class="unappraised-icon" />
                    <span class="value-text value-text--unknown">{{ t('storage.not_appraised') }}</span>
                </template>
            </div>
        </div>

        <div class="inv-item__actions">
            <button v-if="!item.appraised" class="btn btn-ghost btn-sm" @click="$emit('appraise', item.id)"><i
                    class="pi pi-search"></i> {{ t('storage.appraise') }}</button>
            <button class="btn btn-primary btn-sm" @click="$emit('sell', item.id)"><i class="pi pi-dollar"></i> {{
                t('storage.sell_item') }}</button>
        </div>
    </div>
</template>

<style scoped>
.inv-item {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-left: 3px solid var(--_rarity, var(--t-border));
    border-radius: var(--t-radius-md);
    transition: border-color var(--t-transition-normal);
}

.inv-item:hover {
    border-color: var(--t-border-hover);
}

.inv-item__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.inv-item__icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.inv-item__info {
    display: flex;
    flex-direction: column;
}

.inv-item__name {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.inv-item__rarity {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}

.inv-item__desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0;
    line-height: 1.4;
}

.inv-item__value-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.inv-item__condition {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    text-transform: capitalize;
}

.inv-item__condition--hidden {
    color: var(--t-text-muted);
    font-style: italic;
}

.inv-item__category {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: capitalize;
    background: var(--t-bg-muted);
    padding: 0.15rem 0.5rem;
    border-radius: var(--t-radius-sm);
}

.inv-item__value {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.appraised-icon {
    color: var(--t-success);
    font-size: 0.9rem;
}

.unappraised-icon {
    color: var(--t-text-muted);
    font-size: 0.9rem;
}

.value-text {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
}

.value-text--appraised {
    color: var(--t-success);
}

.value-text--unknown {
    color: var(--t-text-muted);
    font-style: italic;
}

.inv-item__actions {
    display: flex;
    gap: var(--t-space-2);
    justify-content: flex-end;
}
</style>
