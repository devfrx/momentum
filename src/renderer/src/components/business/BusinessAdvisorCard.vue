<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import { useBusinessStore, type OwnedBusiness } from '@renderer/stores/useBusinessStore'
import { ADVISOR_DEFS, advisorCost, advisorEffect } from '@renderer/data/businesses'
import type { AdvisorType } from '@renderer/data/businesses'
import { useFormat } from '@renderer/composables/useFormat'
import { computed } from 'vue'

const props = defineProps<{
    business: OwnedBusiness
}>()

const store = useBusinessStore()
const { formatCash } = useFormat()

function getAdvisorState(type: AdvisorType) {
    return props.business.advisors.find(a => a.type === type)
}

const advisorItems = computed(() =>
    ADVISOR_DEFS.map(def => {
        const state = getAdvisorState(def.type)
        const lvl = state?.level ?? 0
        const cost = advisorCost(props.business.purchasePrice, def, lvl)
        const effect = advisorEffect(def, lvl)
        const nextEffect = advisorEffect(def, lvl + 1)
        return { def, lvl, cost, effect, nextEffect, hired: state?.hired ?? false }
    })
)
</script>

<template>
    <div class="advisor-panel">
        <h4 class="panel-title">
            <AppIcon icon="mdi:account-group" />
            {{ $t('business.advisors_title') }}
        </h4>

        <div class="advisor-grid">
            <div v-for="adv in advisorItems" :key="adv.def.type" class="advisor-card" :class="{ hired: adv.hired }">
                <div class="adv-header">
                    <AppIcon :icon="adv.def.icon" class="adv-icon" />
                    <div>
                        <div class="adv-name">{{ $t(adv.def.nameKey) }}</div>
                        <div class="adv-desc">{{ $t(adv.def.descKey) }}</div>
                    </div>
                </div>

                <div class="adv-stats">
                    <div class="stat-row" v-if="adv.hired">
                        <span class="stat-lbl">{{ $t('business.level') }}</span>
                        <span class="stat-val">{{ adv.lvl }}</span>
                    </div>
                    <div class="stat-row" v-if="adv.hired">
                        <span class="stat-lbl">{{ $t('business.effect') }}</span>
                        <span class="stat-val" v-if="adv.def.type === 'cfo'">{{ $t('business.auto_pricing') }}</span>
                        <span class="stat-val" v-else>+{{ (adv.effect * 100).toFixed(0) }}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-lbl">{{ adv.hired ? $t('business.upgrade_cost') : $t('business.hire_cost')
                            }}</span>
                        <span class="stat-val cost">{{ formatCash(adv.cost) }}</span>
                    </div>
                    <div class="stat-row" v-if="!adv.hired || adv.lvl > 0">
                        <span class="stat-lbl">{{ $t('business.next_effect') }}</span>
                        <span class="stat-val accent" v-if="adv.def.type === 'cfo'">{{ $t('business.faster_pricing')
                            }}</span>
                        <span class="stat-val accent" v-else>+{{ (adv.nextEffect * 100).toFixed(0) }}%</span>
                    </div>
                </div>

                <UButton variant="primary" :icon="adv.hired ? 'mdi:arrow-up-bold' : 'mdi:account-plus'"
                    @click="store.hireAdvisor(business.id, adv.def.type)">
                    {{ adv.hired ? $t('business.upgrade') : $t('business.hire') }} — {{ formatCash(adv.cost) }}
                </UButton>
            </div>
        </div>
    </div>
</template>

<style scoped>
.advisor-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.panel-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
}

.advisor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--t-space-3);
}

.advisor-card {
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    gap: var(--t-space-2);
    transition: border-color var(--t-transition-fast);
}

.advisor-card.hired {
    border-color: var(--t-border-hover);
}

.adv-header {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
}

.adv-icon {
    font-size: 1.3rem;
    color: var(--t-accent);
    flex-shrink: 0;
    margin-top: 2px;
}

.adv-name {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.adv-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    line-height: 1.3;
}

.adv-stats {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.stat-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-xs);
}

.stat-lbl {
    color: var(--t-text-muted);
}

.stat-val {
    font-weight: var(--t-font-semibold);
    font-family: var(--t-font-mono);
    color: var(--t-text);
}

.stat-val.cost {
    color: var(--t-warning);
}

.stat-val.accent {
    color: var(--t-accent);
}
</style>
