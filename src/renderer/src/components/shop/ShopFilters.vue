<script setup lang="ts">
/**
 * ShopFilters — Search bar, category/rarity/condition filters, and sort controls
 * for the online shop browse interface.
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import { useI18n } from 'vue-i18n'
import { SHOP_CATEGORIES, SHOP_CATEGORY_ICONS } from '@renderer/data/shop/items'
import type { ShopCategory } from '@renderer/data/shop/items'
import { CONDITION_ORDER } from '@renderer/data/shop/restoration'
import type { ItemCondition } from '@renderer/data/storage/items'
import { useShopStore } from '@renderer/stores/useShopStore'
import type { SortField } from '@renderer/stores/useShopStore'

const shop = useShopStore()
const { t } = useI18n()

const rarities = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'jackpot', 'mythic']

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

function rarityLabel(r: string): string {
    if (r === 'all') return t('shop.all_rarities')
    return t(`shop.rarity_${r}`, r.charAt(0).toUpperCase() + r.slice(1))
}

function onSearchInput(e: Event): void {
    shop.setSearch((e.target as HTMLInputElement).value)
}
function onCategoryChange(e: Event): void {
    shop.setCategory((e.target as HTMLSelectElement).value as ShopCategory | 'all')
}
function onRarityChange(e: Event): void {
    shop.setRarity((e.target as HTMLSelectElement).value)
}
function onConditionChange(e: Event): void {
    shop.setConditionFilter((e.target as HTMLSelectElement).value as ItemCondition | 'all')
}
function onSortChange(e: Event): void {
    shop.setSort((e.target as HTMLSelectElement).value as SortField)
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
            <!-- Category Dropdown -->
            <select class="filter-select" :value="shop.filterCategory" @change="onCategoryChange">
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                </option>
            </select>

            <!-- Rarity Dropdown -->
            <select class="filter-select" :value="shop.filterRarity" @change="onRarityChange">
                <option v-for="r in rarities" :key="r" :value="r">
                    {{ rarityLabel(r) }}
                </option>
            </select>

            <!-- Condition Dropdown -->
            <select class="filter-select" :value="shop.filterCondition" @change="onConditionChange">
                <option v-for="c in conditions" :key="c.value" :value="c.value">
                    {{ c.label }}
                </option>
            </select>

            <!-- Sort Dropdown -->
            <select class="filter-select" :value="shop.sortBy" @change="onSortChange">
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

.filter-select:focus-visible {
    box-shadow: var(--t-shadow-focus);
}

.result-count {
    margin-left: auto;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}
</style>
