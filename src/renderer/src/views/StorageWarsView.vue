<script setup lang="ts">
/**
 * StorageWarsView — Main view for Storage Wars feature.
 * Shows auction lobby with available units, active bidding,
 * player inventory, and storage statistics.
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UTabs } from '@renderer/components/ui'
import type { TabDef } from '@renderer/components/ui'
import { CashDisplay } from '@renderer/components/dashboard'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import { AuctionCard, AuctionBidding, InventoryPanel, StorageStats, SessionPnL } from '@renderer/components/storage'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'

const storage = useStorageStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const activeTab = ref('auctions')

const tabs = computed<TabDef[]>(() => [
    { id: 'auctions', label: t('storage.tab_auctions'), icon: 'mdi:gavel', count: storage.availableAuctions.length },
    { id: 'inventory', label: t('storage.tab_inventory'), icon: 'mdi:package-variant', count: storage.inventoryCount },
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
            <UTabs v-model="activeTab" :tabs="tabs">
                <template #auctions>
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

                <template #inventory>
                    <InventoryPanel />
                </template>
            </UTabs>

            <!-- Session P&L -->
            <SessionPnL />

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
}
</style>
