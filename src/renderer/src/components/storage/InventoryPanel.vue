<script setup lang="ts">
/**
 * InventoryPanel — Displays all items in the player's storage inventory.
 * Supports filtering, bulk operations, and appraisal selection.
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import GarageItemCard from './GarageItemCard.vue'
import AppraiseDialog from './AppraiseDialog.vue'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'

const storage = useStorageStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const filterCategory = ref<string>('all')
const showAppraiseDialog = ref(false)
const appraiseTargetId = ref<string | null>(null)

const categories = computed(() => {
    const cats = new Set(storage.inventory.map(i => i.category))
    return ['all', ...Array.from(cats).sort()]
})

const filteredItems = computed(() => {
    if (filterCategory.value === 'all') return storage.inventory
    return storage.inventory.filter(i => i.category === filterCategory.value)
})

const unappraisedCount = computed(() => storage.inventory.filter(i => !i.appraised).length)

function onAppraise(itemId: string): void {
    appraiseTargetId.value = itemId
    showAppraiseDialog.value = true
}

function onSell(itemId: string): void {
    storage.sellItem(itemId)
}

function sellAllItems(): void {
    storage.sellAll()
}
</script>

<template>
    <div class="inventory-panel">
        <!-- Header -->
        <div class="inventory-header">
            <h3 class="inventory-title">
                <AppIcon icon="mdi:package-variant" />
                {{ t('storage.inventory') }}
                <span class="inventory-count">({{ storage.inventoryCount }})</span>
            </h3>
            <div class="inventory-value">
                <span class="inv-val-label">{{ t('storage.est_value') }}</span>
                <span class="inv-val-amount">{{ formatCash(storage.inventoryValue) }}</span>
            </div>
        </div>

        <!-- Toolbar -->
        <div class="inventory-toolbar" v-if="storage.inventoryCount > 0">
            <div class="filter-row">
                <UButton v-for="cat in categories" :key="cat" size="sm"
                    :variant="filterCategory === cat ? 'primary' : 'ghost'" @click="filterCategory = cat">{{ cat ===
                        'all' ? t('common.all') : cat }}</UButton>
            </div>
            <div class="bulk-actions">
                <UButton v-if="unappraisedCount > 0" variant="ghost" size="sm" icon="mdi:magnify"
                    @click="showAppraiseDialog = true; appraiseTargetId = null">{{ t('storage.appraise_all', {
                        n:
                    unappraisedCount }) }}</UButton>
                <UButton variant="warning" size="sm" icon="mdi:currency-usd" @click="sellAllItems">{{
                    t('storage.sell_all') }}</UButton>
            </div>
        </div>

        <!-- Items Grid -->
        <div v-if="filteredItems.length > 0" class="inventory-grid">
            <GarageItemCard v-for="item in filteredItems" :key="item.id" :item="item" @appraise="onAppraise"
                @sell="onSell" />
        </div>

        <!-- Empty State -->
        <div v-else class="inventory-empty">
            <AppIcon icon="mdi:package-variant-closed" class="empty-icon" />
            <p>{{ t('storage.inventory_empty') }}</p>
        </div>

        <!-- Appraise Dialog -->
        <AppraiseDialog v-if="showAppraiseDialog" :item-id="appraiseTargetId" @close="showAppraiseDialog = false" />
    </div>
</template>

<style scoped>
.inventory-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.inventory-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--t-space-3);
}

.inventory-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    margin: 0;
    color: var(--t-text);
}

.inventory-count {
    color: var(--t-text-muted);
    font-weight: 400;
}

.inventory-value {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.inv-val-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.inv-val-amount {
    font-weight: var(--t-font-bold);
    color: var(--t-success);
}

.inventory-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--t-space-2);
}

.filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
}

.bulk-actions {
    display: flex;
    gap: var(--t-space-2);
}

.inventory-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--t-space-3);
}

.inventory-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-6);
    color: var(--t-text-muted);
}

.empty-icon {
    font-size: 2.9rem;
}
</style>
