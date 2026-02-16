<script setup lang="ts">
/**
 * SellPanel — Choose which warehouse to sell items from.
 * Integrates with shop's sell-to-shop, vault sell, and storage wars sell.
 * Supports selling from "Vault", "Storage Wars", or directly "Shop sell-back".
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { useShopStore, type SellSource } from '@renderer/stores/useShopStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { rarityCssVar } from '@renderer/data/rarity'
import { resolveItemName } from '@renderer/data/storage/items'
import {
    CONDITION_ICONS,
    CONDITION_COLORS,
} from '@renderer/data/shop/restoration'

const storageStore = useStorageStore()
const vaultStore = useVaultStore()
const shopStore = useShopStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const activeSource = ref<SellSource>('vault')

const sources = computed(() => [
    {
        id: 'vault' as SellSource,
        label: t('shop.sell_from_vault'),
        icon: 'mdi:safe-square',
        count: vaultStore.itemCount,
    },
    {
        id: 'storage_wars' as SellSource,
        label: t('shop.sell_from_storage'),
        icon: 'mdi:warehouse',
        count: storageStore.inventoryCount,
    },
])

const currentItems = computed(() => {
    if (activeSource.value === 'vault') return vaultStore.items
    if (activeSource.value === 'storage_wars') return storageStore.inventory
    return []
})

function sellSingle(itemId: string): void {
    shopStore.sellToShop(itemId, activeSource.value)
}

function sellAllFromSource(): void {
    shopStore.bulkSellToShop(activeSource.value)
}
</script>

<template>
    <div class="sell-panel">
        <h3 class="sell-panel__title">
            <AppIcon icon="mdi:cash-register" />
            {{ t('shop.sell_title') }}
        </h3>

        <!-- Source Selector -->
        <div class="source-tabs">
            <button v-for="src in sources" :key="src.id" class="source-tab" :class="{ active: activeSource === src.id }"
                @click="activeSource = src.id">
                <AppIcon :icon="src.icon" />
                <span>{{ src.label }}</span>
                <span class="source-count">{{ src.count }}</span>
            </button>
        </div>

        <!-- Bulk Actions -->
        <div v-if="currentItems.length > 0" class="sell-actions">
            <Button
                :label="t('shop.sell_all_from', { source: activeSource === 'vault' ? t('shop.vault') : t('shop.storage_wars') })"
                icon="pi pi-dollar" size="small" severity="danger" @click="sellAllFromSource" />
        </div>

        <!-- Item Grid -->
        <div v-if="currentItems.length > 0" class="sell-grid">
            <div v-for="item in currentItems" :key="item.id" class="sell-item"
                :style="{ '--_rarity': rarityCssVar(item.rarity) }">
                <div class="sell-item__header">
                    <AppIcon :icon="item.icon" class="sell-item__icon" :style="{ color: rarityCssVar(item.rarity) }" />
                    <div class="sell-item__info">
                        <span class="sell-item__name">{{ resolveItemName(item, t) }}</span>
                        <span class="sell-item__rarity" :style="{ color: rarityCssVar(item.rarity) }">
                            {{ item.rarity }}
                        </span>
                    </div>
                </div>
                <div class="sell-item__footer">
                    <div class="sell-item__value-col">
                        <span v-if="item.condition" class="sell-item__condition"
                            :style="{ color: CONDITION_COLORS[item.condition] }">
                            <AppIcon :icon="CONDITION_ICONS[item.condition]" />
                            {{ t(`shop.condition_${item.condition}`) }}
                        </span>
                        <span class="sell-item__value">
                            {{ formatCash(shopStore.getEstimatedSellValue(item)) }}
                        </span>
                        <span v-if="shopStore.getDemandMultiplier(item.category) >= 1.4" class="sell-item__demand-hint">
                            <AppIcon icon="mdi:trending-up" /> {{ t('shop.demand_trending') }}
                        </span>
                    </div>
                    <Button :label="t('shop.sell_item')" icon="pi pi-dollar" size="small"
                        @click="sellSingle(item.id)" />
                </div>
            </div>
        </div>

        <div v-else class="sell-empty">
            <AppIcon icon="mdi:package-variant-remove" class="empty-icon" />
            <p>{{ t('shop.sell_empty') }}</p>
        </div>
    </div>
</template>

<style scoped>
.sell-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.sell-panel__title {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-md);
    font-weight: 600;
    color: var(--t-text);
    margin: 0;
}

.source-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--t-border);
}

.source-tab {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.source-tab:hover {
    color: var(--t-text);
    background: var(--t-bg-muted);
}

.source-tab.active {
    color: var(--t-accent);
    border-bottom-color: var(--t-accent);
    font-weight: 600;
}

.source-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    font-size: 0.65rem;
    font-weight: 700;
    background: var(--t-bg-muted);
    color: var(--t-text-muted);
    border-radius: 9px;
}

.source-tab.active .source-count {
    background: var(--t-accent);
    color: white;
}

.sell-actions {
    display: flex;
    justify-content: flex-end;
}

.sell-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--t-space-3);
}

.sell-item {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-left: 3px solid var(--_rarity, var(--t-border));
    border-radius: var(--t-radius-md);
}

.sell-item__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.sell-item__icon {
    font-size: 1.3rem;
}

.sell-item__info {
    display: flex;
    flex-direction: column;
}

.sell-item__name {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.sell-item__rarity {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}

.sell-item__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.sell-item__value-col {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.sell-item__condition {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
}

.sell-item__value {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-success);
}

.sell-item__demand-hint {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    font-size: 0.55rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--t-success);
}

.sell-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-6);
    color: var(--t-text-muted);
    text-align: center;
}

.empty-icon {
    font-size: 3rem;
    opacity: 0.2;
}
</style>
