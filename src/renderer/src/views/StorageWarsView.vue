<script setup lang="ts">
/**
 * StorageWarsView — Main view for Storage Wars feature.
 * Shows auction lobby with available units, active bidding,
 * player inventory, and storage statistics.
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { CashDisplay } from '@renderer/components/dashboard'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import { AuctionCard, AuctionBidding, InventoryPanel, StorageStats } from '@renderer/components/storage'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'

const storage = useStorageStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

type ViewTab = 'auctions' | 'inventory'

const activeTab = ref<ViewTab>('auctions')

const tabs = computed(() => [
    { id: 'auctions' as ViewTab, label: t('storage.tab_auctions'), icon: 'mdi:gavel', count: storage.availableAuctions.length },
    { id: 'inventory' as ViewTab, label: t('storage.tab_inventory'), icon: 'mdi:package-variant', count: storage.inventoryCount },
])

function enterAuction(auctionId: string): void {
    storage.startAuction(auctionId)
}

function onAuctionBack(): void {
    // Return to lobby
}

// ─── Info panel sections ─────────────────────────────────────
const infoSections = computed(() => [
    {
        title: t('storage.info_how_title'),
        icon: 'mdi:information',
        entries: [
            { term: t('storage.info_browse'), desc: t('storage.info_browse_desc'), icon: 'mdi:eye' },
            { term: t('storage.info_bid'), desc: t('storage.info_bid_desc'), icon: 'mdi:gavel' },
            { term: t('storage.info_win'), desc: t('storage.info_win_desc'), icon: 'mdi:trophy' },
            { term: t('storage.info_appraise'), desc: t('storage.info_appraise_desc'), icon: 'mdi:magnify' },
            { term: t('storage.info_sell'), desc: t('storage.info_sell_desc'), icon: 'mdi:cash' },
        ],
    },
    {
        title: t('storage.info_tips_title'),
        icon: 'mdi:lightbulb',
        entries: [
            { term: t('storage.info_tip_peek'), desc: t('storage.info_tip_peek_desc'), icon: 'mdi:eye-check' },
            { term: t('storage.info_tip_bidders'), desc: t('storage.info_tip_bidders_desc'), icon: 'mdi:account-group' },
            { term: t('storage.info_tip_appraise'), desc: t('storage.info_tip_appraise_desc'), icon: 'mdi:star' },
            { term: t('storage.info_tip_luck'), desc: t('storage.info_tip_luck_desc'), icon: 'mdi:clover' },
        ],
    },
])
</script>

<template>
    <div class="page-container">
        <!-- Active Auction Bidding Screen -->
        <AuctionBidding v-if="storage.activeAuction" @back="onAuctionBack" />

        <!-- Storage Wars Lobby -->
        <template v-else>
            <!-- Header -->
            <div class="storage-header">
                <div>
                    <h1 class="page-title">
                        <AppIcon icon="mdi:warehouse" class="page-title-icon" />
                        {{ t('storage.title') }}
                    </h1>
                    <p class="page-subtitle">{{ t('storage.subtitle') }}</p>
                </div>
                <CashDisplay :label="t('storage.balance')" :value="formatCash(player.cash)" />
            </div>

            <!-- Stats Ribbon -->
            <StorageStats />

            <!-- Tab Navigation -->
            <div class="tab-bar">
                <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }"
                    @click="activeTab = tab.id">
                    <AppIcon :icon="tab.icon" />
                    <span>{{ tab.label }}</span>
                    <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
                </button>
            </div>

            <!-- Auctions Tab -->
            <template v-if="activeTab === 'auctions'">
                <div v-if="storage.availableAuctions.length > 0" class="auction-grid">
                    <AuctionCard v-for="auction in storage.availableAuctions" :key="auction.id" :auction="auction"
                        @bid="enterAuction" />
                </div>
                <div v-else class="empty-state">
                    <AppIcon icon="mdi:warehouse" class="empty-icon" />
                    <p>{{ t('storage.no_auctions') }}</p>
                    <span class="empty-hint">{{ t('storage.no_auctions_hint') }}</span>
                </div>
            </template>

            <!-- Inventory Tab -->
            <template v-if="activeTab === 'inventory'">
                <InventoryPanel />
            </template>

            <!-- Info Panel -->
            <InfoPanel :title="t('storage.info_title')" :description="t('storage.info_desc')"
                :sections="infoSections" />
        </template>
    </div>
</template>

<style scoped>
.storage-header {
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

.auction-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--t-space-4);
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

.empty-hint {
    font-size: var(--t-font-size-xs);
    opacity: 0.6;
}
</style>
