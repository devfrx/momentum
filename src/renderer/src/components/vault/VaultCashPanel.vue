<script setup lang="ts">
/**
 * VaultCashPanel — Deposit/withdraw protected cash in the vault.
 */
import { ref } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { D } from '@renderer/core/BigNum'

const vault = useVaultStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const amount = ref('')

function deposit(): void {
    const raw = amount.value.trim()
    if (!raw) return
    const val = D(raw)
    if (!val.gt(0)) return
    vault.depositCash(val)
    amount.value = ''
}

function withdraw(): void {
    const raw = amount.value.trim()
    if (!raw) return
    const val = D(raw)
    if (!val.gt(0)) return
    vault.withdrawCash(val)
    amount.value = ''
}

function depositAll(): void {
    vault.depositCash(player.cash)
    amount.value = ''
}

function withdrawAll(): void {
    vault.withdrawCash(vault.storedCash)
    amount.value = ''
}
</script>

<template>
    <div class="cash-panel">
        <div class="cash-panel__header">
            <AppIcon icon="mdi:safe-square" class="cash-icon" />
            <div class="cash-info">
                <span class="cash-label">{{ t('vault.stored_cash') }}</span>
                <span class="cash-value">{{ formatCash(vault.storedCash) }}</span>
            </div>
            <div class="cash-info">
                <span class="cash-label">{{ t('vault.wallet') }}</span>
                <span class="cash-value cash-value--wallet">{{ formatCash(player.cash) }}</span>
            </div>
        </div>

        <div class="cash-panel__controls">
            <input type="number" class="cash-input" :placeholder="t('vault.enter_amount')" v-model="amount" min="0"
                step="any" />
            <div class="cash-buttons">
                <UButton variant="primary" size="sm" icon="mdi:arrow-down" @click="deposit" :disabled="!amount.trim()">
                    {{ t('vault.deposit') }}
                </UButton>
                <UButton variant="ghost" size="sm" icon="mdi:arrow-up" @click="withdraw" :disabled="!amount.trim()">
                    {{ t('vault.withdraw') }}
                </UButton>
            </div>
            <div class="cash-buttons">
                <UButton variant="ghost" size="sm" icon="mdi:arrow-down" @click="depositAll" :disabled="player.cash.lte(0)">
                    {{ t('vault.deposit_all') }}
                </UButton>
                <UButton variant="ghost" size="sm" icon="mdi:arrow-up" @click="withdrawAll" :disabled="vault.storedCash.lte(0)">
                    {{ t('vault.withdraw_all') }}
                </UButton>
            </div>
        </div>

        <div class="cash-panel__stats">
            <span class="mini-stat">
                <AppIcon icon="mdi:arrow-down" />
                {{ t('vault.total_deposited') }}: {{ formatCash(vault.totalCashDeposited) }}
            </span>
            <span class="mini-stat">
                <AppIcon icon="mdi:arrow-up" />
                {{ t('vault.total_withdrawn') }}: {{ formatCash(vault.totalCashWithdrawn) }}
            </span>
        </div>
    </div>
</template>

<style scoped>
.cash-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
}

.cash-panel__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-4);
}

.cash-icon {
    font-size: 1.9rem;
    color: var(--t-text-secondary);
}

.cash-info {
    display: flex;
    flex-direction: column;
}

.cash-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.cash-value {
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    color: var(--t-success);
}

.cash-value--wallet {
    color: var(--t-text);
}

.cash-panel__controls {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.cash-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    color: var(--t-text);
    font-size: var(--t-font-size-sm);
}

.cash-input:focus {
    outline: none;
    border-color: var(--t-accent);
}

.cash-input:focus-visible {
    box-shadow: var(--t-shadow-focus);
}

.cash-buttons {
    display: flex;
    gap: var(--t-space-2);
}

.cash-panel__stats {
    display: flex;
    gap: var(--t-space-4);
    flex-wrap: wrap;
}

.mini-stat {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}
</style>
