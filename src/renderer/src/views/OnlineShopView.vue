<script setup lang="ts">
/**
 * OnlineShopView — E-commerce style marketplace.
 * Browse / buy / sell / restore / auction items.
 */
import { ref, computed, onMounted, watch } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UTabs, UButton } from '@renderer/components/ui'
import type { TabDef } from '@renderer/components/ui'
import { CashDisplay } from '@renderer/components/dashboard'
import {
    ShopListingCard,
    ShopFilters,
    ShopStats,
    SellPanel,
    DemandTicker,
    RestorationPanel,
    ResaleAuctionPanel,
} from '@renderer/components/shop'
import { useShopStore } from '@renderer/stores/useShopStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'

const shop = useShopStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

function handleBuy(listingId: string, destination: 'vault' | 'storage'): void {
    shop.buyItem(listingId, destination)
}

const activeTab = ref('browse')

const tabs = computed<TabDef[]>(() => [
    {
        id: 'browse',
        label: t('shop.tab_browse'),
        icon: 'mdi:store-search',
        count: shop.filteredCount
    },
    {
        id: 'sell',
        label: t('shop.tab_sell'),
        icon: 'mdi:cash-register',
        count: 0
    },
    {
        id: 'workshop',
        label: t('shop.tab_workshop'),
        icon: 'mdi:tools',
        count: shop.activeRestorations
    },
    {
        id: 'auctions',
        label: t('shop.tab_auctions'),
        icon: 'mdi:gavel',
        count: shop.activeAuctionCount
    },
])

onMounted(() => {
    shop.initShop()
})

// Pagination
const PAGE_SIZE = 60
const currentPage = ref(0)
const pagedListings = computed(() => {
    const start = currentPage.value * PAGE_SIZE
    return shop.filteredListings.slice(start, start + PAGE_SIZE)
})
const totalPages = computed(() => Math.ceil(shop.filteredListings.length / PAGE_SIZE))

function prevPage(): void {
    if (currentPage.value > 0) currentPage.value--
}
function nextPage(): void {
    if (currentPage.value < totalPages.value - 1) currentPage.value++
}

// Reset page when filters change the result set
watch(() => shop.filteredListings.length, () => {
    if (currentPage.value >= totalPages.value) {
        currentPage.value = Math.max(0, totalPages.value - 1)
    }
})
</script>

<template>
    <div class="page-container">
        <!-- Header -->
        <div class="shop-header">
            <div>
                <h1 class="page-title">
                    <AppIcon icon="mdi:store-search" class="page-title-icon" />
                    {{ t('shop.title') }}
                </h1>
                <p class="page-subtitle">{{ t('shop.subtitle') }}</p>
            </div>
            <CashDisplay :label="t('storage.balance')" :value="formatCash(player.cash)" />
        </div>

        <!-- Stats Ribbon -->
        <ShopStats />

        <!-- Demand Ticker -->
        <DemandTicker v-if="shop.demands.length > 0" />

        <!-- Tab Navigation -->
        <UTabs v-model="activeTab" :tabs="tabs">
            <template #browse>
                <ShopFilters />

                <div v-if="pagedListings.length > 0" class="shop-grid">
                    <ShopListingCard v-for="listing in pagedListings" :key="listing.id" :listing="listing"
                        @buy="handleBuy" />
                </div>
                <div v-else class="empty-state">
                    <AppIcon icon="mdi:store-remove" class="empty-icon" />
                    <p>{{ t('shop.no_listings') }}</p>
                </div>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="pagination">
                    <UButton variant="ghost" size="sm" :disabled="currentPage === 0" icon="mdi:chevron-left"
                        @click="prevPage" />
                    <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
                    <UButton variant="ghost" size="sm" :disabled="currentPage >= totalPages - 1"
                        icon="mdi:chevron-right" @click="nextPage" />
                </div>
            </template>

            <template #sell>
                <SellPanel />
            </template>

            <template #workshop>
                <RestorationPanel />
            </template>

            <template #auctions>
                <ResaleAuctionPanel />
            </template>
        </UTabs>
    </div>
</template>

<style scoped>
.shop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--t-space-4);
}

.shop-grid {
    display: grid;
    margin-top: var(--t-space-4);
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--t-space-3);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-8);
    color: var(--t-text-muted);
    text-align: center;
}

.empty-icon {
    font-size: 4rem;
    opacity: 0.2;
}

.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) 0;
}

.page-info {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}
</style>
