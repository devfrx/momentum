<script setup lang="ts">
/**
 * VaultPanel — Main vault inventory grid with filtering.
 */
import { computed, ref } from 'vue'
import VaultItemCard from './VaultItemCard.vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import Select from 'primevue/select'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { ZERO } from '@renderer/core/BigNum'
import type { Rarity } from '@renderer/data/rarity'

const vault = useVaultStore()
const { formatCash } = useFormat()
const { t } = useI18n()

defineEmits<{
    transfer: [itemId: string]
}>()

const searchQuery = ref('')
const filterRarity = ref<Rarity | ''>('')
const filterSource = ref<'' | 'storage_wars' | 'shop' | 'transfer' | 'other'>('')

const rarityOptions = computed(() => [
    { label: t('vault.all_rarities'), value: '' },
    ...(['common', 'uncommon', 'rare', 'epic', 'legendary', 'jackpot', 'mythic'] as const).map(r => ({
        label: r.charAt(0).toUpperCase() + r.slice(1),
        value: r
    }))
])

const sourceOptions = computed(() => [
    { label: t('vault.all_sources'), value: '' },
    { label: t('vault.source_storage_wars'), value: 'storage_wars' },
    { label: t('vault.source_shop'), value: 'shop' },
    { label: t('vault.source_transfer'), value: 'transfer' },
])

const sortOptions = [
    { label: t('vault.sort_value_desc'), value: 'value_desc' },
    { label: t('vault.sort_value_asc'), value: 'value_asc' },
    { label: t('vault.sort_name'), value: 'name' },
    { label: t('vault.sort_rarity'), value: 'rarity' }
] as const

const sortBy = ref<string>('value_desc')

const RARITY_ORDER: Record<string, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    jackpot: 5,
    mythic: 6
}

const filteredItems = computed(() => {
    let items = [...vault.items]
    const q = searchQuery.value.toLowerCase()
    if (q) items = items.filter(i => i.name.toLowerCase().includes(q))
    if (filterRarity.value) items = items.filter(i => i.rarity === filterRarity.value)
    if (filterSource.value) items = items.filter(i => i.source === filterSource.value)

    switch (sortBy.value) {
        case 'value_desc':
            items.sort((a, b) => (b.appraisedValue ?? b.baseValue).cmp(a.appraisedValue ?? a.baseValue))
            break
        case 'value_asc':
            items.sort((a, b) => (a.appraisedValue ?? a.baseValue).cmp(b.appraisedValue ?? b.baseValue))
            break
        case 'name':
            items.sort((a, b) => a.name.localeCompare(b.name))
            break
        case 'rarity':
            items.sort((a, b) => (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0))
            break
    }
    return items
})

const totalValue = computed(() => {
    return filteredItems.value.reduce((sum, i) => sum.add(i.appraisedValue ?? i.baseValue), ZERO)
})

function sellAllFiltered(): void {
    const ids = filteredItems.value.map(i => i.id)
    for (const id of ids) {
        vault.sellItem(id)
    }
}
</script>

<template>
    <div class="vault-panel">
        <div class="vault-panel__filters">
            <div class="filter-row">
                <input type="text" class="search-input" :placeholder="t('vault.search_placeholder')"
                    v-model="searchQuery" />

                <Select v-model="filterRarity" :options="rarityOptions" optionLabel="label" optionValue="value"
                    :placeholder="t('vault.all_rarities')" />

                <Select v-model="filterSource" :options="sourceOptions" optionLabel="label" optionValue="value"
                    :placeholder="t('vault.all_sources')" />

                <Select v-model="sortBy" :options="sortOptions" optionLabel="label" optionValue="value" />
            </div>
            <div class="filter-meta">
                <span class="meta-label">
                    {{ filteredItems.length }} {{ t('vault.items_label') }} —
                    {{ t('vault.total_value') }}: {{ formatCash(totalValue) }}
                </span>
                <UButton v-if="filteredItems.length > 0" variant="danger" size="sm" icon="mdi:currency-usd"
                    @click="sellAllFiltered()">
                    {{ t('vault.sell_all_filtered') }}
                </UButton>
            </div>
        </div>

        <div v-if="filteredItems.length === 0" class="vault-empty">
            <AppIcon icon="mdi:safe-square-outline" class="empty-icon" />
            <span class="empty-text">{{ t('vault.empty') }}</span>
        </div>

        <div v-else class="vault-grid">
            <VaultItemCard v-for="item in filteredItems" :key="item.id" :item="item" @sell="vault.sellItem($event)"
                @transfer="$emit('transfer', $event)" />
        </div>
    </div>
</template>

<style scoped>
.vault-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.vault-panel__filters {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.filter-row {
    display: flex;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.search-input {
    flex: 2 1 200px;
    padding: 0.45rem 0.75rem;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    color: var(--t-text);
    font-size: var(--t-font-size-sm);
}

.search-input:focus {
    outline: none;
    border-color: var(--t-accent);
}

.search-input:focus-visible {
    box-shadow: var(--t-shadow-focus);
}


.filter-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.meta-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.vault-empty {
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

.empty-text {
    font-size: var(--t-font-size-sm);
}

.vault-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--t-space-3);
}
</style>
