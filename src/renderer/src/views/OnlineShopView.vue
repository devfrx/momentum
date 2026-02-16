<script setup lang="ts">
/**
 * OnlineShopView — E-commerce style marketplace.
 * Browse / buy / sell / restore / auction items.
 */
import { ref, computed, onMounted, watch } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
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

type ViewTab = 'browse' | 'sell' | 'workshop' | 'auctions'
const activeTab = ref<ViewTab>('browse')

const tabs = computed(() => [
    {
        id: 'browse' as ViewTab,
        label: t('shop.tab_browse'),
        icon: 'mdi:store-search',
        count: shop.filteredCount
    },
    {
        id: 'sell' as ViewTab,
        label: t('shop.tab_sell'),
        icon: 'mdi:cash-register',
        count: 0
    },
    {
        id: 'workshop' as ViewTab,
        label: t('shop.tab_workshop'),
        icon: 'mdi:tools',
        count: shop.activeRestorations
    },
    {
        id: 'auctions' as ViewTab,
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
        <div class="tab-bar">
            <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id">
                <AppIcon :icon="tab.icon" />
                <span>{{ tab.label }}</span>
                <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
            </button>
        </div>

        <!-- Browse Tab -->
        <template v-if="activeTab === 'browse'">
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
                <button class="page-btn" :disabled="currentPage === 0" @click="prevPage">
                    <AppIcon icon="mdi:chevron-left" />
                </button>
                <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
                <button class="page-btn" :disabled="currentPage >= totalPages - 1" @click="nextPage">
                    <AppIcon icon="mdi:chevron-right" />
                </button>
            </div>
        </template>

        <!-- Sell Tab -->
        <template v-if="activeTab === 'sell'">
            <SellPanel />
        </template>

        <!-- Workshop Tab -->
        <template v-if="activeTab === 'workshop'">
            <RestorationPanel />
        </template>

        <!-- Auctions Tab -->
        <template v-if="activeTab === 'auctions'">
            <ResaleAuctionPanel />
        </template>
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

.tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--t-border);
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.75rem 1.25rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.tab-btn:hover {
    color: var(--t-text);
    background: var(--t-bg-muted);
}

.tab-btn.active {
    color: var(--t-accent);
    border-bottom-color: var(--t-accent);
    font-weight: 600;
}

.tab-count {
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

.tab-btn.active .tab-count {
    background: var(--t-accent);
    color: white;
}

.shop-grid {
    display: grid;
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

.page-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    color: var(--t-text);
    cursor: pointer;
    transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
    background: var(--t-bg-muted);
    border-color: var(--t-accent);
}

.page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.page-info {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}
</style>
