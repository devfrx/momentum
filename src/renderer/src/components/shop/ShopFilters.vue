<script setup lang="ts">
/**
 * ShopFilters — Search bar, category/rarity filters, and sort controls
 * for the online shop browse interface.
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { useI18n } from 'vue-i18n'
import { SHOP_CATEGORIES, SHOP_CATEGORY_ICONS } from '@renderer/data/shop/items'
import type { ShopCategory } from '@renderer/data/shop/items'
import { useShopStore } from '@renderer/stores/useShopStore'
import type { SortField } from '@renderer/stores/useShopStore'

const shop = useShopStore()
const { t } = useI18n()

const rarities = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'jackpot', 'mythic']

const sortOptions: { value: SortField; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price ↑' },
    { value: 'price_desc', label: 'Price ↓' },
    { value: 'rarity_asc', label: 'Rarity ↑' },
    { value: 'rarity_desc', label: 'Rarity ↓' },
    { value: 'name', label: 'Name' },
]

const categories = computed(() => {
    const items: { value: ShopCategory | 'all'; label: string; icon: string }[] = [
        { value: 'all', label: t('common.all'), icon: 'mdi:view-grid' },
    ]
    for (const cat of SHOP_CATEGORIES) {
        if (cat === 'junk') continue // skip junk in shop
        items.push({
            value: cat,
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            icon: SHOP_CATEGORY_ICONS[cat],
        })
    }
    return items
})
</script>

<template>
    <div class="shop-filters">
        <!-- Search -->
        <div class="search-box">
            <AppIcon icon="mdi:magnify" class="search-icon" />
            <input type="text" class="search-input" :placeholder="t('shop.search_placeholder')"
                :value="shop.searchQuery" @input="shop.setSearch(($event.target as HTMLInputElement).value)" />
            <button v-if="shop.searchQuery" class="search-clear" @click="shop.setSearch('')">
                <AppIcon icon="mdi:close" />
            </button>
        </div>

        <div class="filter-row">
            <!-- Category Dropdown -->
            <select class="filter-select" :value="shop.filterCategory"
                @change="shop.setCategory(($event.target as HTMLSelectElement).value as any)">
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                </option>
            </select>

            <!-- Rarity Dropdown -->
            <select class="filter-select" :value="shop.filterRarity"
                @change="shop.setRarity(($event.target as HTMLSelectElement).value as any)">
                <option v-for="r in rarities" :key="r" :value="r">
                    {{ r === 'all' ? t('common.all') : r }}
                </option>
            </select>

            <!-- Sort Dropdown -->
            <select class="filter-select" :value="shop.sortBy"
                @change="shop.setSort(($event.target as HTMLSelectElement).value as SortField)">
                <option v-for="s in sortOptions" :key="s.value" :value="s.value">
                    {{ s.label }}
                </option>
            </select>

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

.search-input::placeholder {
    color: var(--t-text-muted);
}

.search-clear {
    position: absolute;
    right: 0.5rem;
    background: none;
    border: none;
    color: var(--t-text-muted);
    cursor: pointer;
    padding: 0.2rem;
    font-size: 1rem;
}

.search-clear:hover {
    color: var(--t-text);
}

.filter-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.filter-select {
    padding: 0.35rem 0.6rem;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    color: var(--t-text);
    font-size: var(--t-font-size-xs);
    cursor: pointer;
    text-transform: capitalize;
}

.filter-select:focus {
    outline: none;
    border-color: var(--t-accent);
}

.result-count {
    margin-left: auto;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}
</style>
