<script setup lang="ts">
/**
 * RestorationPanel — Workshop interface for restoring item conditions.
 * Shows active restoration slots, progress bars, and slot upgrade button.
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import { useShopStore } from '@renderer/stores/useShopStore'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { rarityCssVar } from '@renderer/data/rarity'
import type { ItemCondition } from '@renderer/data/storage/items'
import { resolveItemName } from '@renderer/data/storage/items'
import {
    CONDITION_ORDER,
    CONDITION_ICONS,
    CONDITION_COLORS,
    calculateRestorationCost,
    getNextCondition,
    getRestoredValue,
} from '@renderer/data/shop/restoration'

const shop = useShopStore()
const vault = useVaultStore()
const storage = useStorageStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

/** Items from vault/storage that can be restored (condition < pristine). */
const restorableItems = computed(() => {
    const items: { item: any; source: 'vault' | 'storage' }[] = []
    for (const item of vault.items) {
        const cond: ItemCondition = item.condition ?? 'good'
        if (CONDITION_ORDER.indexOf(cond) < CONDITION_ORDER.length - 1) {
            items.push({ item, source: 'vault' })
        }
    }
    for (const item of storage.inventory) {
        const cond: ItemCondition = item.condition ?? 'good'
        if (CONDITION_ORDER.indexOf(cond) < CONDITION_ORDER.length - 1) {
            items.push({ item, source: 'storage' })
        }
    }
    return items
})

function getRestorationProgress(slot: any): number {
    if (!slot) return 0
    const totalTicks = slot.ticksPerStep * slot.totalSteps
    const elapsed = (slot.currentStep * slot.ticksPerStep) + (slot.ticksPerStep - slot.ticksRemaining)
    return Math.min(100, Math.round((elapsed / totalTicks) * 100))
}

function handleRestore(itemId: string, source: 'vault' | 'storage'): void {
    // Find the item to get current condition
    let item: any = null
    if (source === 'vault') {
        item = vault.items.find(i => i.id === itemId)
    } else {
        item = storage.inventory.find(i => i.id === itemId)
    }
    if (!item) return

    const current: ItemCondition = item.condition ?? 'good'
    const next = getNextCondition(current)
    if (!next) return

    shop.startRestoration(itemId, source, next)
}

function handleRestoreToMax(itemId: string, source: 'vault' | 'storage'): void {
    shop.startRestoration(itemId, source, 'pristine')
}

function conditionLabel(cond: ItemCondition): string {
    return t(`shop.condition_${cond}`)
}

function nextCond(item: any): ItemCondition | null {
    return getNextCondition(item.condition ?? 'good')
}

function nextCondLabel(item: any): string {
    const nc = nextCond(item)
    return nc ? conditionLabel(nc) : ''
}

function nextCondValue(item: any): string {
    const nc = nextCond(item)
    if (!nc) return ''
    return formatCash(getRestoredValue(item, nc))
}

function restoreCost1Step(item: any): string {
    const nc = nextCond(item)
    if (!nc) return ''
    return formatCash(calculateRestorationCost(item, item.condition ?? 'good', nc))
}

/** Show "Restore to Max" only when item is 2+ steps below pristine. */
function showRestoreMax(item: any): boolean {
    const nc = nextCond(item)
    return nc !== null && nc !== 'pristine'
}
</script>

<template>
    <div class="restoration-panel">
        <div class="panel-header">
            <h3 class="panel-title">
                <AppIcon icon="mdi:tools" />
                {{ t('shop.workshop_title') }}
            </h3>
            <div class="panel-header__right">
                <span class="slot-info">
                    {{ t('shop.workshop_slots', { used: shop.activeRestorations, total: shop.restorationSlotCount }) }}
                </span>
                <UButton v-if="shop.canUpgradeSlots" variant="ghost" size="sm" icon="mdi:plus"
                    :disabled="player.cash.lt(shop.nextSlotUpgradeCost)" @click="shop.upgradeRestorationSlots()">
                    {{ t('shop.workshop_upgrade_slot', { cost: formatCash(shop.nextSlotUpgradeCost) }) }}
                </UButton>
            </div>
        </div>

        <!-- Active Restorations -->
        <div class="slot-grid">
            <div v-for="(slot, idx) in shop.restorationSlots" :key="idx" class="restoration-slot"
                :class="{ 'restoration-slot--active': slot !== null, 'restoration-slot--empty': slot === null }">
                <template v-if="slot">
                    <div class="slot-header">
                        <AppIcon :icon="slot.item.icon" class="slot-icon"
                            :style="{ color: rarityCssVar(slot.item.rarity) }" />
                        <div class="slot-info-block">
                            <span class="slot-name">{{ resolveItemName(slot.item, t) }}</span>
                            <span class="slot-cond-flow">
                                <AppIcon :icon="CONDITION_ICONS[slot.startCondition]"
                                    :style="{ color: CONDITION_COLORS[slot.startCondition] }" />
                                {{ conditionLabel(slot.startCondition) }}
                                <AppIcon icon="mdi:arrow-right" class="arrow-icon" />
                                <AppIcon :icon="CONDITION_ICONS[slot.targetCondition]"
                                    :style="{ color: CONDITION_COLORS[slot.targetCondition] }" />
                                {{ conditionLabel(slot.targetCondition) }}
                            </span>
                        </div>
                    </div>

                    <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: getRestorationProgress(slot) + '%' }" />
                    </div>
                    <div class="progress-label">
                        {{ getRestorationProgress(slot) }}% —
                        {{ t('shop.workshop_step', { current: slot.currentStep + 1, total: slot.totalSteps }) }}
                    </div>

                    <UButton variant="primary" size="sm" icon="mdi:close" @click="shop.cancelRestoration(idx)">
                        {{ t('shop.workshop_cancel') }}
                    </UButton>
                </template>

                <template v-else>
                    <div class="empty-slot">
                        <AppIcon icon="mdi:plus-circle-outline" class="empty-slot-icon" />
                        <span>{{ t('shop.workshop_empty_slot') }}</span>
                    </div>
                </template>
            </div>
        </div>

        <!-- Restorable Items -->
        <h4 class="section-label">{{ t('shop.workshop_available') }}</h4>

        <div v-if="restorableItems.length > 0" class="restorable-grid">
            <div v-for="{ item, source } in restorableItems" :key="item.id" class="restorable-item"
                :style="{ '--_rarity': rarityCssVar(item.rarity) }">
                <div class="restorable-item__header">
                    <AppIcon :icon="item.icon" class="restorable-item__icon"
                        :style="{ color: rarityCssVar(item.rarity) }" />
                    <div class="restorable-item__info">
                        <span class="restorable-item__name">{{ resolveItemName(item, t) }}</span>
                        <span class="restorable-item__cond"
                            :style="{ color: CONDITION_COLORS[item.condition ?? 'good'] }">
                            <AppIcon :icon="CONDITION_ICONS[item.condition ?? 'good']" />
                            {{ conditionLabel(item.condition ?? 'good') }}
                        </span>
                    </div>
                    <span class="restorable-item__source badge">{{ source }}</span>
                </div>

                <div class="restorable-item__values">
                    <span class="restorable-item__current-val">
                        {{ t('shop.workshop_current_value') }}: {{ formatCash(item.appraisedValue ?? item.baseValue) }}
                    </span>
                    <span v-if="nextCond(item)" class="restorable-item__next-val">
                        → {{ nextCondLabel(item) }}:
                        {{ nextCondValue(item) }}
                    </span>
                </div>

                <div class="restorable-item__cost">
                    <span v-if="nextCond(item)">
                        {{ t('shop.workshop_cost_1step') }}:
                        {{ restoreCost1Step(item) }}
                    </span>
                </div>

                <div class="restorable-item__actions">
                    <UButton v-if="nextCond(item)" variant="ghost" size="sm" icon="mdi:wrench"
                        :disabled="shop.freeRestorationSlots === 0" @click="handleRestore(item.id, source)">
                        {{ t('shop.workshop_restore_1') }}
                    </UButton>
                    <UButton v-if="showRestoreMax(item)" variant="primary" size="sm" icon="mdi:star"
                        :disabled="shop.freeRestorationSlots === 0" @click="handleRestoreToMax(item.id, source)">
                        {{ t('shop.workshop_restore_max') }}
                    </UButton>
                </div>
            </div>
        </div>

        <div v-else class="empty-state">
            <AppIcon icon="mdi:emoticon-happy" class="empty-icon" />
            <p>{{ t('shop.workshop_no_items') }}</p>
        </div>
    </div>
</template>

<style scoped>
.restoration-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--t-space-2);
}

.panel-title {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-md);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    margin: 0;
}

.panel-header__right {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.slot-info {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.slot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--t-space-3);
}

.restoration-slot {
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.restoration-slot--active {
    border-color: var(--t-border-hover);
    border-left: 3px solid var(--t-border-hover);
}

.restoration-slot--empty {
    border-style: dashed;
}

.slot-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.slot-icon {
    font-size: 1.2rem;
}

.slot-info-block {
    display: flex;
    flex-direction: column;
}

.slot-name {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.slot-cond-flow {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.arrow-icon {
    font-size: 0.75rem;
    color: var(--t-text-muted);
}

.progress-bar {
    height: 6px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-xs);
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--t-accent);
    border-radius: var(--t-radius-xs);
    transition: width var(--t-transition-normal);
}

.progress-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.empty-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-1);
    padding: var(--t-space-4);
    color: var(--t-text-muted);
}

.empty-slot-icon {
    font-size: 1.9rem;
}

.section-label {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-muted);
    margin: var(--t-space-2) 0 0 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.restorable-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--t-space-3);
}

.restorable-item {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-left: 3px solid var(--_rarity, var(--t-border));
    border-radius: var(--t-radius-md);
}

.restorable-item__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.restorable-item__icon {
    font-size: 1.2rem;
}

.restorable-item__info {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.restorable-item__name {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.restorable-item__cond {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
}

.restorable-item__source {
    font-size: 0.6rem;
    padding: 0.15rem 0.4rem;
    background: var(--t-bg-muted);
    color: var(--t-text-muted);
    border-radius: var(--t-radius-sm);
    text-transform: uppercase;
    font-weight: var(--t-font-bold);
}

.restorable-item__values {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: var(--t-font-size-xs);
}

.restorable-item__current-val {
    color: var(--t-text-muted);
}

.restorable-item__next-val {
    color: var(--t-success);
    font-weight: var(--t-font-semibold);
}

.restorable-item__cost {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.restorable-item__actions {
    display: flex;
    gap: var(--t-space-2);
    justify-content: flex-end;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-6);
    color: var(--t-text-muted);
    text-align: center;
}

.empty-icon {
    font-size: 2.9rem;
}
</style>
