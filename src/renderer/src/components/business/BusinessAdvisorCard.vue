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
        <div class="advisor-grid">
            <div v-for="adv in advisorItems" :key="adv.def.type" class="advisor-card" :class="{ hired: adv.hired }">
                <!-- Status accent -->
                <div :class="adv.hired ? 'accent-hired' : 'accent-available'" />

                <div class="adv-header">
                    <div class="adv-icon-wrap" :class="{ 'icon-hired': adv.hired }">
                        <AppIcon :icon="adv.def.icon" class="adv-icon" />
                    </div>
                    <div class="adv-title-area">
                        <div class="adv-name-row">
                            <span class="adv-name">{{ $t(adv.def.nameKey) }}</span>
                            <span v-if="adv.hired" class="adv-level-badge">Lv.{{ adv.lvl }}</span>
                        </div>
                        <div class="adv-desc">{{ $t(adv.def.descKey) }}</div>
                    </div>
                </div>

                <!-- Effect display -->
                <div class="adv-effect-block" v-if="adv.hired">
                    <div class="effect-row">
                        <span class="effect-label">{{ $t('business.effect') }}</span>
                        <span class="effect-value" v-if="adv.def.type === 'cfo'">{{ $t('business.auto_pricing')
                        }}</span>
                        <span class="effect-value" v-else>+{{ (adv.effect * 100).toFixed(0) }}%</span>
                    </div>
                    <div class="effect-row next" v-if="adv.lvl > 0">
                        <span class="effect-label">{{ $t('business.next_effect') }}</span>
                        <span class="effect-next" v-if="adv.def.type === 'cfo'">{{ $t('business.faster_pricing')
                        }}</span>
                        <span class="effect-next" v-else>+{{ (adv.nextEffect * 100).toFixed(0) }}%</span>
                    </div>
                </div>
                <div class="adv-effect-block preview" v-else>
                    <div class="effect-row">
                        <span class="effect-label">{{ $t('business.next_effect') }}</span>
                        <span class="effect-next" v-if="adv.def.type === 'cfo'">{{ $t('business.auto_pricing') }}</span>
                        <span class="effect-next" v-else>+{{ (adv.nextEffect * 100).toFixed(0) }}%</span>
                    </div>
                </div>

                <!-- CFO pricing toggle -->
                <div class="cfo-toggle-row" v-if="adv.def.type === 'cfo' && adv.hired">
                    <span class="cfo-label">{{ $t('business.cfo_auto_price') ?? 'Ricerca prezzo' }}</span>
                    <button class="toggle-btn" :class="{ active: business.cfoPricingEnabled }"
                        @click="store.setCfoPricingEnabled(business.id, !business.cfoPricingEnabled)"
                        :title="business.cfoPricingEnabled ? 'Disattiva hill-climbing prezzo' : 'Attiva hill-climbing prezzo'">
                        <span class="toggle-track">
                            <span class="toggle-thumb" />
                        </span>
                        <span class="toggle-label">{{ business.cfoPricingEnabled ? 'ON' : 'OFF' }}</span>
                    </button>
                </div>

                <!-- Action -->
                <UButton :variant="adv.hired ? 'secondary' : 'primary'" size="sm"
                    :icon="adv.hired ? 'mdi:arrow-up-bold' : 'mdi:account-plus'"
                    @click="store.hireAdvisor(business.id, adv.def.type)" class="adv-action-btn">
                    {{ adv.hired ? $t('business.upgrade') : $t('business.hire') }}
                    <span class="adv-action-cost">{{ formatCash(adv.cost) }}</span>
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

.advisor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--t-space-3);
}

.advisor-card {
    position: relative;
    padding: var(--t-space-3);
    padding-left: calc(var(--t-space-3) + 4px);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    /* transition: border-color 0.2s, box-shadow 0.2s; */
    overflow: hidden;
}

/* Accent strip */
.accent-hired {
    background: var(--t-success);
}

.accent-available {
    background: var(--t-text-muted);
    opacity: 0.3;
}

/* Header */
.adv-header {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
}

.adv-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s;
}

.adv-icon-wrap.icon-hired {
    background: color-mix(in srgb, var(--t-success) 15%, var(--t-bg-muted));
}

.adv-icon {
    font-size: 1.1rem;
    color: var(--t-text-muted);
}

.icon-hired .adv-icon {
    color: var(--t-success);
}

.adv-title-area {
    flex: 1;
    min-width: 0;
}

.adv-name-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.adv-name {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.adv-level-badge {
    font-size: 0.65rem;
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    padding: 0.05rem 0.35rem;
    border-radius: var(--t-radius-sm);
    background: color-mix(in srgb, var(--t-accent) 15%, transparent);
    color: var(--t-accent);
}

.adv-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    line-height: 1.35;
    margin-top: 0.1rem;
}

/* Effect block */
.adv-effect-block {
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.adv-effect-block.preview {
    border: 1px dashed var(--t-border);
    background: transparent;
}

.effect-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-xs);
}

.effect-label {
    color: var(--t-text-muted);
}

.effect-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    color: var(--t-accent);
}

.effect-next {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-success);
}

/* CFO toggle */
.cfo-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-1) var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.cfo-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
}

.toggle-track {
    display: inline-block;
    width: 2rem;
    height: 1.1rem;
    border-radius: 999px;
    background: var(--t-border);
    position: relative;
    transition: background 0.2s;
}

.toggle-btn.active .toggle-track {
    background: var(--t-accent);
}

.toggle-thumb {
    position: absolute;
    top: 0.125rem;
    left: 0.125rem;
    width: 0.85rem;
    height: 0.85rem;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
}

.toggle-btn.active .toggle-thumb {
    transform: translateX(0.9rem);
}

.toggle-label {
    font-size: 0.65rem;
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
}

.toggle-btn.active .toggle-label {
    color: var(--t-accent);
}

/* Action button */
.adv-action-btn {
    width: 100%;
    margin-top: auto;
}

.adv-action-cost {
    font-family: var(--t-font-mono);
    margin-left: 0.25rem;
    opacity: 0.8;
}
</style>
