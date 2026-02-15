<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
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
        <h4 class="panel-title">
            <AppIcon icon="mdi:arrow-up-bold-circle" />
            {{ $t('business.upgrades_title') }}
        </h4>

        <div v-if="applicableUpgrades.length === 0" class="empty-text">
            {{ $t('business.no_upgrades_yet') }}
        </div>

        <div v-else class="upgrade-list">
            <div v-for="upgDef in applicableUpgrades" :key="upgDef.id" class="upgrade-item">
                <div class="upg-header">
                    <AppIcon :icon="upgDef.icon" class="upg-icon" />
                    <div class="upg-info">
                        <span class="upg-name">{{ $t(upgDef.nameKey) }}</span>
                        <span class="upg-desc">{{ $t(upgDef.descKey) }}</span>
                    </div>
                    <span class="upg-level">Lv.{{ getLevel(upgDef.id) }}</span>
                </div>

                <div class="upg-stats">
                    <span class="upg-current">
                        {{ $t('business.current_bonus') }}: +{{ (getBonus(upgDef.id) * 100).toFixed(1) }}%
                    </span>
                    <span class="upg-next">
                        → +{{ (getNextBonus(upgDef.id) * 100).toFixed(1) }}%
                    </span>
                </div>

                <Button size="small" severity="secondary" class="upg-buy-btn"
                    @click="store.purchaseUpgrade(business.id, upgDef.id)">
                    {{ $t('business.upgrade_cost', { cost: formatCash(store.getUpgradeCost(business, upgDef.id)) }) }}
                </Button>
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

.panel-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    font-weight: 700;
    color: var(--t-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
}

.empty-text {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    padding: var(--t-space-2);
}

.upgrade-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.upgrade-item {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

.upg-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.upg-icon {
    font-size: 1.1rem;
    color: var(--t-text-muted);
}

.upg-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.upg-name {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text);
}

.upg-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.upg-level {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: 700;
    color: var(--t-accent);
    background: var(--t-bg-card);
    padding: 0.1rem 0.4rem;
    border-radius: var(--t-radius-sm);
}

.upg-stats {
    display: flex;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-xs);
}

.upg-current {
    color: var(--t-text-secondary);
    font-family: var(--t-font-mono);
}

.upg-next {
    color: var(--t-success);
    font-family: var(--t-font-mono);
    font-weight: 600;
}

.upg-buy-btn {
    align-self: flex-end;
}
</style>
