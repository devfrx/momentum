<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import { useFormat } from '@renderer/composables/useFormat'
import { useBusinessStore, type OwnedBusiness } from '@renderer/stores/useBusinessStore'

const props = defineProps<{
    business: OwnedBusiness
}>()

const store = useBusinessStore()
const { formatCash } = useFormat()

const applicableUpgrades = computed(() => store.getApplicableUpgrades(props.business))

function getLevel(upgradeId: string): number {
    return props.business.upgrades.find(u => u.upgradeId === upgradeId)?.level ?? 0
}

function getBonus(upgradeId: string): number {
    const level = getLevel(upgradeId)
    return store.getUpgradeBonus(upgradeId, level)
}

function getNextBonus(upgradeId: string): number {
    const level = getLevel(upgradeId) + 1
    return store.getUpgradeBonus(upgradeId, level)
}
</script>

<template>
    <div class="upgrade-panel">
        <div v-if="applicableUpgrades.length === 0" class="empty-state">
            <AppIcon icon="mdi:package-variant" class="empty-icon" />
            <span>{{ $t('business.no_upgrades_yet') }}</span>
        </div>

        <div v-else class="upgrade-list">
            <div v-for="upgDef in applicableUpgrades" :key="upgDef.id" class="upgrade-item">
                <div class="upg-left">
                    <div class="upg-icon-wrap">
                        <AppIcon :icon="upgDef.icon" class="upg-icon" />
                    </div>
                    <div class="upg-info">
                        <div class="upg-name-row">
                            <span class="upg-name">{{ $t(upgDef.nameKey) }}</span>
                            <span class="upg-level-badge">Lv.{{ getLevel(upgDef.id) }}</span>
                        </div>
                        <span class="upg-desc">{{ $t(upgDef.descKey) }}</span>

                        <div class="upg-bonus-row">
                            <span class="upg-current-val">+{{ (getBonus(upgDef.id) * 100).toFixed(1) }}%</span>
                            <AppIcon icon="mdi:arrow-right" class="upg-arrow" />
                            <span class="upg-next-val">+{{ (getNextBonus(upgDef.id) * 100).toFixed(1) }}%</span>
                        </div>
                    </div>
                </div>
                <UButton variant="primary" size="sm" class="upg-buy-btn"
                    @click="store.purchaseUpgrade(business.id, upgDef.id)">
                    {{ formatCash(store.getUpgradeCost(business, upgDef.id)) }}
                </UButton>
            </div>
        </div>
    </div>
</template>

<style scoped>
.upgrade-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.empty-state {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-4);
    justify-content: center;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
}

.empty-icon {
    font-size: 1.3rem;
    opacity: 0.5;
}

.upgrade-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.upgrade-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-card);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
    transition: border-color 0.15s;
}

.upgrade-item:hover {
    border-color: var(--t-border-hover);
}

.upg-left {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    flex: 1;
    min-width: 0;
}

.upg-icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.upg-icon {
    font-size: 1rem;
    color: var(--t-text-muted);
}

.upg-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
}

.upg-name-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.upg-name {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.upg-level-badge {
    font-size: 0.6rem;
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    padding: 0.05rem 0.3rem;
    border-radius: var(--t-radius-sm);
    background: color-mix(in srgb, var(--t-accent) 15%, transparent);
    color: var(--t-accent);
    flex-shrink: 0;
}

.upg-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.upg-bonus-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 0.15rem;
}

.upg-current-val {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

.upg-arrow {
    font-size: 0.7rem;
    color: var(--t-text-muted);
}

.upg-next-val {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--t-success);
}

.upg-buy-btn {
    flex-shrink: 0;
    font-family: var(--t-font-mono);
}
</style>
