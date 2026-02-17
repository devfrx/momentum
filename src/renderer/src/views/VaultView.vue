<script setup lang="ts">
/**
 * VaultView — Protected personal warehouse for items and cash.
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UTabs, UButton } from '@renderer/components/ui'
import type { TabDef } from '@renderer/components/ui'
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

const activeTab = ref('items')
const showTransfer = ref(false)

const tabs = computed<TabDef[]>(() => [
    {
        id: 'items',
        label: t('vault.tab_items'),
        icon: 'mdi:package-variant',
        count: vault.items.length
    },
    {
        id: 'cash',
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
                <UButton variant="primary" size="sm" icon="mdi:swap-horizontal" @click="showTransfer = true">
                    {{ t('vault.transfer_title') }}
                </UButton>
                <UButton variant="ghost" size="sm" icon="mdi:plus" @click="vault.upgradeCapacity()"
                    :disabled="player.cash.lt(vault.nextUpgradeCost)">
                    {{ t('vault.upgrade_capacity') }}
                </UButton>
                <CashDisplay :label="t('storage.balance')" :value="formatCash(player.cash)" />
            </div>
        </div>

        <!-- Stats Ribbon -->
        <VaultStats />

        <!-- Tab Navigation -->
        <UTabs v-model="activeTab" :tabs="tabs">
            <template #items>
                <VaultPanel @transfer="showTransfer = true" />
            </template>
            <template #cash>
                <VaultCashPanel />
            </template>
        </UTabs>

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
</style>
