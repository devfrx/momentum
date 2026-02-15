<script setup lang="ts">
/**
 * VaultView — Protected personal warehouse for items and cash.
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { CashDisplay } from '@renderer/components/dashboard'
import { VaultPanel, VaultCashPanel, VaultStats, TransferDialog } from '@renderer/components/vault'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'

const vault = useVaultStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

type ViewTab = 'items' | 'cash'
const activeTab = ref<ViewTab>('items')
const showTransfer = ref(false)

const tabs = computed(() => [
    {
        id: 'items' as ViewTab,
        label: t('vault.tab_items'),
        icon: 'mdi:package-variant',
        count: vault.items.length
    },
    {
        id: 'cash' as ViewTab,
        label: t('vault.tab_cash'),
        icon: 'mdi:safe-square',
        count: 0
    },
])
</script>

<template>
    <div class="page-container">
        <!-- Header -->
        <div class="vault-header">
            <div>
                <h1 class="page-title">
                    <AppIcon icon="mdi:safe-square" class="page-title-icon" />
                    {{ t('vault.title') }}
                </h1>
                <p class="page-subtitle">{{ t('vault.subtitle') }}</p>
            </div>
            <div class="header-actions">
                <Button :label="t('vault.transfer_title')" icon="pi pi-arrow-right-arrow-left" size="small"
                    severity="info" outlined @click="showTransfer = true" />
                <Button :label="t('vault.upgrade_capacity')" icon="pi pi-plus" size="small" severity="secondary"
                    outlined @click="vault.upgradeCapacity()" :disabled="player.cash.lt(vault.nextUpgradeCost)" />
                <CashDisplay :label="t('storage.balance')" :value="formatCash(player.cash)" />
            </div>
        </div>

        <!-- Stats Ribbon -->
        <VaultStats />

        <!-- Tab Navigation -->
        <div class="tab-bar">
            <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id">
                <AppIcon :icon="tab.icon" />
                <span>{{ tab.label }}</span>
                <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
            </button>
        </div>

        <!-- Items Tab -->
        <template v-if="activeTab === 'items'">
            <VaultPanel @transfer="showTransfer = true" />
        </template>

        <!-- Cash Tab -->
        <template v-if="activeTab === 'cash'">
            <VaultCashPanel />
        </template>

        <!-- Transfer Dialog -->
        <TransferDialog :visible="showTransfer" @close="showTransfer = false" />
    </div>
</template>

<style scoped>
.vault-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--t-space-4);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    flex-wrap: wrap;
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
</style>
