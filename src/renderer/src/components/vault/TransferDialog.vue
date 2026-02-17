<script setup lang="ts">
/**
 * TransferDialog — Move items between Storage Wars ↔ Vault.
 */
import { computed, ref, watch } from 'vue'
import { UButton, UModal, UTabs } from '@renderer/components/ui'
import type { TabDef } from '@renderer/components/ui'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { resolveItemName } from '@renderer/data/storage/items'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const vault = useVaultStore()
const storage = useStorageStore()
const { formatCash } = useFormat()
const { t } = useI18n()

type Direction = 'to_vault' | 'from_vault'
const direction = ref<Direction>('to_vault')

const transferTabs = computed<TabDef[]>(() => [
    { id: 'to_vault', label: t('vault.transfer_to_vault'), icon: 'mdi:arrow-right' },
    { id: 'from_vault', label: t('vault.transfer_from_vault'), icon: 'mdi:arrow-left' },
])

const RARITY_ORDER: Record<string, number> = {
    common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, jackpot: 5, mythic: 6
}

const sourceItems = computed(() => {
    const items = direction.value === 'to_vault'
        ? [...storage.inventory]
        : [...vault.items]
    items.sort((a, b) => (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0))
    return items
})

const selectedIds = ref<Set<string>>(new Set())

watch(direction, () => {
    selectedIds.value.clear()
})

function toggle(id: string): void {
    if (selectedIds.value.has(id)) {
        selectedIds.value.delete(id)
    } else {
        selectedIds.value.add(id)
    }
}

function selectAll(): void {
    sourceItems.value.forEach(i => selectedIds.value.add(i.id))
}

function deselectAll(): void {
    selectedIds.value.clear()
}

function transfer(): void {
    for (const id of selectedIds.value) {
        if (direction.value === 'to_vault') {
            const item = storage.inventory.find(i => i.id === id)
            if (item) {
                const added = vault.addItem(item, 'storage_wars')
                if (added) {
                    storage.inventory = storage.inventory.filter(i => i.id !== id)
                }
            }
        } else {
            const item = vault.items.find(i => i.id === id)
            if (item) {
                storage.inventory.push({
                    id: item.id,
                    name: item.name,
                    rarity: item.rarity,
                    category: item.category,
                    icon: item.icon,
                    baseValue: item.baseValue,
                    appraisedValue: item.appraisedValue,
                    appraised: item.appraised,
                    description: item.description,
                    weight: item.weight,
                    condition: item.condition,
                    auctionId: 'vault_transfer',
                    acquiredAtTick: Date.now(),
                } as any)
                vault.removeItem(id)
            }
        }
    }
    selectedIds.value.clear()
}

const canTransfer = computed(() => selectedIds.value.size > 0)

function getRarityClass(rarity: string): string {
    return `rarity-${rarity}`
}
</script>

<template>
    <UModal :modelValue="visible" @update:modelValue="v => !v && emit('close')" :title="t('vault.transfer_title')"
        icon="mdi:swap-horizontal" size="md">
        <UTabs v-model="direction" :tabs="transferTabs" />

        <div class="transfer-info">
            <span>{{ sourceItems.length }} {{ t('vault.available') }}</span>
            <span>{{ selectedIds.size }} {{ t('vault.selected') }}</span>
            <div class="selection-btns">
                <UButton variant="text" size="sm" @click="selectAll">{{ t('vault.select_all') }}</UButton>
                <UButton variant="text" size="sm" @click="deselectAll">{{ t('vault.deselect_all') }}</UButton>
            </div>
        </div>

        <div class="transfer-list">
            <div v-if="sourceItems.length === 0" class="empty-msg">
                {{ t('vault.no_items_to_transfer') }}
            </div>
            <div v-for="item in sourceItems" :key="item.id"
                :class="['transfer-item', getRarityClass(item.rarity), { selected: selectedIds.has(item.id) }]"
                @click="toggle(item.id)">
                <div class="item-check">
                    <span v-if="selectedIds.has(item.id)">☑</span>
                    <span v-else>☐</span>
                </div>
                <div class="item-info">
                    <span class="item-name">{{ resolveItemName(item, t) }}</span>
                    <span class="item-meta" style="text-transform: capitalize">{{ item.rarity }} · {{
                        formatCash(item.appraisedValue ?? item.baseValue) }}</span>
                </div>
            </div>
        </div>

        <template #footer>
            <UButton variant="primary" icon="mdi:swap-horizontal" @click="transfer" :disabled="!canTransfer">
                {{ t('vault.transfer_action', { count: selectedIds.size }) }}
            </UButton>
        </template>
    </UModal>
</template>

<style scoped>
.transfer-info {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-2) var(--t-space-4);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.selection-btns {
    margin-left: auto;
    display: flex;
    gap: var(--t-space-1);
}

.transfer-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--t-space-2) var(--t-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
    max-height: 400px;
}

.empty-msg {
    text-align: center;
    padding: var(--t-space-4);
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
}

.transfer-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2);
    border-radius: var(--t-radius-sm);
    cursor: pointer;
    transition: background var(--t-transition-fast);
    border-left: 3px solid transparent;
}

.transfer-item:hover {
    background: var(--t-bg-muted);
}

.transfer-item:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}

.transfer-item:active {
    transform: scale(0.98);
}

.transfer-item.selected {
    background: color-mix(in srgb, var(--t-accent) 10%, transparent);
}

.transfer-item.rarity-common {
    border-left-color: var(--t-rarity-common);
}

.transfer-item.rarity-uncommon {
    border-left-color: var(--t-rarity-uncommon);
}

.transfer-item.rarity-rare {
    border-left-color: var(--t-rarity-rare);
}

.transfer-item.rarity-epic {
    border-left-color: var(--t-rarity-epic);
}

.transfer-item.rarity-legendary {
    border-left-color: var(--t-rarity-legendary);
}

.transfer-item.rarity-jackpot {
    border-left-color: var(--t-rarity-jackpot);
}

.transfer-item.rarity-mythic {
    border-left-color: var(--t-pink);
}

.item-check {
    font-size: 1rem;
}

.item-info {
    display: flex;
    flex-direction: column;
}

.item-name {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.item-meta {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}
</style>
