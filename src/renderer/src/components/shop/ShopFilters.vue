<script setup lang="ts">
/**
 * ShopFilters — Search bar, category/rarity/condition filters, and sort controls
 * for the online shop browse interface.
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import Select from 'primevue/select'
import { useI18n } from 'vue-i18n'
import { SHOP_CATEGORIES, SHOP_CATEGORY_ICONS } from '@renderer/data/shop/items'
import type { ShopCategory } from '@renderer/data/shop/items'
import { CONDITION_ORDER } from '@renderer/data/shop/restoration'
import type { ItemCondition } from '@renderer/data/storage/items'
import { useShopStore } from '@renderer/stores/useShopStore'
import type { SortField } from '@renderer/stores/useShopStore'

const shop = useShopStore()
const { t } = useI18n()

const rarityOptions = computed(() => [
    { label: t('shop.all_rarities'), value: 'all' },
    ...['common', 'uncommon', 'rare', 'epic', 'legendary', 'jackpot', 'mythic'].map(r => ({
        label: t(`shop.rarity_${r}`, r.charAt(0).toUpperCase() + r.slice(1)),
        value: r
    }))
])

const sortOptions = computed(() => [
    { value: 'newest' as SortField, label: t('shop.sort_newest') },
    { value: 'price_asc' as SortField, label: t('shop.sort_value_asc') },
    { value: 'price_desc' as SortField, label: t('shop.sort_value_desc') },
    { value: 'rarity_asc' as SortField, label: t('shop.sort_rarity') + ' ↑' },
    { value: 'rarity_desc' as SortField, label: t('shop.sort_rarity') + ' ↓' },
    { value: 'name' as SortField, label: t('shop.sort_name') },
])

const categories = computed(() => {
    const items: { value: ShopCategory | 'all'; label: string; icon: string }[] = [
        { value: 'all', label: t('shop.all_categories'), icon: 'mdi:view-grid' },
    ]
    for (const cat of SHOP_CATEGORIES) {
        if (cat === 'junk') continue // skip junk in shop
        items.push({
            value: cat,
            label: t(`shop.category_${cat}`),
            icon: SHOP_CATEGORY_ICONS[cat],
        })
    }
    return items
})

const conditions = computed(() => {
    const items: { value: ItemCondition | 'all'; label: string }[] = [
        { value: 'all', label: t('shop.all_categories') },
    ]
    for (const cond of CONDITION_ORDER) {
        items.push({
            value: cond,
            label: t(`shop.condition_${cond}`),
        })
    }
    return items
})

function onSearchInput(e: Event): void {
    shop.setSearch((e.target as HTMLInputElement).value)
}
</script>

<template>
    <div class="shop-filters">
        <!-- Search -->
        <div class="search-box">
            <AppIcon icon="mdi:magnify" class="search-icon" />
            <input type="text" class="search-input" :placeholder="t('shop.search_placeholder')"
                :value="shop.searchQuery" @input="onSearchInput" />
            <UButton variant="text" v-if="shop.searchQuery" icon="mdi:close" @click="shop.setSearch('')" />
        </div>

        <div class="filter-row">
            <!-- Category -->
            <Select v-model="shop.filterCategory" :options="categories" optionLabel="label" optionValue="value"
                :placeholder="t('shop.all_categories')" />

            <!-- Rarity -->
            <Select v-model="shop.filterRarity" :options="rarityOptions" optionLabel="label" optionValue="value"
                :placeholder="t('shop.all_rarities')" />

            <!-- Condition -->
            <Select v-model="shop.filterCondition" :options="conditions" optionLabel="label" optionValue="value"
                :placeholder="t('shop.all_categories')" />

            <!-- Sort -->
            <Select v-model="shop.sortBy" :options="sortOptions" optionLabel="label" optionValue="value"
                :placeholder="t('shop.sort_newest')" />

            <!-- Result count -->
            <span class="result-count">{{ shop.filteredListings.length }} {{ t('shop.results') }}</span>
        </div>
    </div>
</template>

<style scoped>
.shop-filters {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.search-box {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--t-text-muted);
    font-size: 1.1rem;
    pointer-events: none;
}

.search-input {
    width: 100%;
    padding: 0.6rem 2.5rem 0.6rem 2.5rem;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text);
    font-size: var(--t-font-size-sm);
    transition: border-color var(--t-transition-fast);
}

.search-input:focus {
    outline: none;
    border-color: var(--t-accent);
}

.search-input:focus-visible {
    box-shadow: var(--t-shadow-focus);
}

.search-input::placeholder {
    color: var(--t-text-muted);
}

.filter-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}



.result-count {
    margin-left: auto;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}
</style>
