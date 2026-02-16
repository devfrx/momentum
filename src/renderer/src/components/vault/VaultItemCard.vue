<script setup lang="ts">
/**
 * VaultItemCard — Displays a single item in the vault.
 * Shows rarity border, value, source badge, and action buttons.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { rarityCssVar } from '@renderer/data/rarity'
import { resolveItemName, resolveItemDescription } from '@renderer/data/storage/items'
import { CONDITION_ICONS, CONDITION_COLORS } from '@renderer/data/shop/restoration'
import type { VaultItem } from '@renderer/stores/useVaultStore'

defineProps<{
    item: VaultItem
}>()

defineEmits<{
    sell: [itemId: string]
    transfer: [itemId: string]
}>()

const { formatCash } = useFormat()
const { t } = useI18n()

const SOURCE_ICONS: Record<string, string> = {
    storage_wars: 'mdi:warehouse',
    shop: 'mdi:store',
    transfer: 'mdi:swap-horizontal',
    other: 'mdi:package-variant',
}
</script>

<template>
    <div class="vault-item" :style="{ '--_rarity': rarityCssVar(item.rarity) }">
        <div class="vault-item__header">
            <AppIcon :icon="item.icon" class="vault-item__icon" :style="{ color: rarityCssVar(item.rarity) }" />
            <div class="vault-item__info">
                <span class="vault-item__name">{{ resolveItemName(item, t) }}</span>
                <div class="vault-item__badges">
                    <span class="vault-item__rarity" :style="{ color: rarityCssVar(item.rarity) }">
                        {{ item.rarity }}
                    </span>
                    <span class="vault-item__source">
                        <AppIcon :icon="SOURCE_ICONS[item.source] || 'mdi:package-variant'" />
                        {{ t('vault.source_' + item.source) }}
                    </span>
                </div>
            </div>
        </div>

        <p class="vault-item__desc">{{ resolveItemDescription(item, t) }}</p>

        <div class="vault-item__value-row">
            <span class="vault-item__category">{{ item.category }}</span>
            <div v-if="item.condition" class="vault-item__condition"
                :style="{ color: CONDITION_COLORS[item.condition] }">
                <AppIcon :icon="CONDITION_ICONS[item.condition]" />
                {{ t(`items.condition.${item.condition}`) }}
            </div>
            <span class="vault-item__value">{{ formatCash(item.appraisedValue ?? item.baseValue) }}</span>
        </div>

        <div class="vault-item__actions">
            <Button :label="t('vault.transfer_out')" icon="pi pi-arrow-right" size="small" severity="primary" outlined
                @click="$emit('transfer', item.id)" />
            <Button :label="t('storage.sell_item')" icon="pi pi-dollar" size="small" @click="$emit('sell', item.id)" />
        </div>
    </div>
</template>

<style scoped>
.vault-item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-left: 3px solid var(--_rarity, var(--t-border));
    border-radius: var(--t-radius-md);
    transition: border-color var(--t-transition-normal);
}

.vault-item:hover {
    border-color: var(--t-border-hover);
}

.vault-item__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.vault-item__icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.vault-item__info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.vault-item__name {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.vault-item__badges {
    display: flex;
    gap: var(--t-space-2);
    align-items: center;
}

.vault-item__rarity {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}

.vault-item__source {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.6rem;
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
    padding: 0.1rem 0.35rem;
    border-radius: var(--t-radius-sm);
}

.vault-item__desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0;
    line-height: 1.4;
}

.vault-item__value-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.vault-item__condition {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    text-transform: capitalize;
}

.vault-item__category {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: capitalize;
    background: var(--t-bg-muted);
    padding: 0.15rem 0.5rem;
    border-radius: var(--t-radius-sm);
}

.vault-item__value {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-success);
}

.vault-item__actions {
    display: flex;
    gap: var(--t-space-2);
    justify-content: flex-end;
}
</style>
