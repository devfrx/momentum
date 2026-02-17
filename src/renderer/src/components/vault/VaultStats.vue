<script setup lang="ts">
/**
 * VaultStats — Stats ribbon for vault overview.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'

const vault = useVaultStore()
const { formatCash, formatNumber } = useFormat()
const { t } = useI18n()
</script>

<template>
    <div class="vault-stats">
        <div class="stat">
            <AppIcon icon="mdi:package-variant-closed" />
            <div class="stat-body">
                <span class="stat-value">{{ vault.items.length }} / {{ vault.capacity }}</span>
                <span class="stat-label">{{ t('vault.capacity') }}</span>
            </div>
        </div>
        <div class="stat">
            <AppIcon icon="mdi:safe-square" />
            <div class="stat-body">
                <span class="stat-value">{{ formatCash(vault.storedCash) }}</span>
                <span class="stat-label">{{ t('vault.stored_cash') }}</span>
            </div>
        </div>
        <div class="stat">
            <AppIcon icon="mdi:arrow-down-bold" />
            <div class="stat-body">
                <span class="stat-value">{{ formatNumber(vault.totalItemsStored) }}</span>
                <span class="stat-label">{{ t('vault.items_stored') }}</span>
            </div>
        </div>
        <div class="stat">
            <AppIcon icon="mdi:cash-multiple" />
            <div class="stat-body">
                <span class="stat-value">{{ formatCash(vault.totalSaleRevenue) }}</span>
                <span class="stat-label">{{ t('vault.total_sold') }}</span>
            </div>
        </div>
        <div class="stat">
            <AppIcon icon="mdi:arrow-up-bold" />
            <div class="stat-body">
                <span class="stat-value">{{ formatNumber(vault.capacityUpgrades) }}</span>
                <span class="stat-label">{{ t('vault.upgrades') }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.vault-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-3);
}

.stat {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    flex: 1 1 140px;
    min-width: 140px;
}

.stat-body {
    display: flex;
    flex-direction: column;
}

.stat-value {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.stat-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}
</style>
