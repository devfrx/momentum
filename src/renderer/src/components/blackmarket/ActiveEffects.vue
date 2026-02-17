<script setup lang="ts">
/**
 * ActiveEffects — Shows all currently active black market effects
 * with duration progress bars.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useI18n } from 'vue-i18n'

const bm = useBlackMarketStore()
const { t } = useI18n()

function effectIcon(type: string): string {
    const map: Record<string, string> = {
        income_boost: 'mdi:cash-plus',
        business_boost: 'mdi:store',
        stock_manipulation: 'mdi:chart-line',
        crypto_manipulation: 'mdi:bitcoin',
        xp_boost: 'mdi:star',
        cost_reduction: 'mdi:tag-minus',
        gambling_edge: 'mdi:dice-multiple',
        storage_insider: 'mdi:warehouse',
        loan_forgery: 'mdi:bank',
        deposit_launder: 'mdi:piggy-bank',
    }
    return map[type] ?? 'mdi:flash'
}

function timeLeft(ticks: number): string {
    const secs = Math.ceil(ticks / 10)
    if (secs >= 60) {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }
    return `${secs}s`
}

function isPositive(value: number): boolean {
    return value >= 1
}
</script>

<template>
    <div v-if="bm.activeEffects.length > 0" class="effects-panel">
        <span class="effects-panel__title">
            <AppIcon icon="mdi:flash" />
            {{ t('blackmarket.active_effects') }} ({{ bm.activeEffects.length }})
        </span>

        <div class="effects-list">
            <div v-for="eff in bm.activeEffects" :key="eff.id" class="effect-chip"
                :class="{ negative: !isPositive(eff.value) }">
                <AppIcon :icon="effectIcon(eff.type)" class="effect-chip__icon" />
                <div class="effect-chip__info">
                    <span class="effect-chip__label">
                        {{ t(`blackmarket.effect_${eff.type}_short`, { value: eff.value }) }}
                    </span>
                    <div class="effect-chip__bar">
                        <div class="effect-chip__fill"
                            :style="{ width: `${(eff.ticksRemaining / eff.totalDuration) * 100}%` }" />
                    </div>
                </div>
                <span class="effect-chip__time">{{ timeLeft(eff.ticksRemaining) }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.effects-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.effects-panel__title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.effects-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-2);
}

.effect-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    min-width: 180px;
}

.effect-chip.negative {
    border-color: var(--t-danger);
}

.effect-chip__icon {
    font-size: 1rem;
    color: var(--t-accent);
    flex-shrink: 0;
}

.effect-chip.negative .effect-chip__icon {
    color: var(--t-danger);
}

.effect-chip__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
}

.effect-chip__label {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.effect-chip__bar {
    height: 3px;
    background: var(--t-bg-muted);
    border-radius: 2px;
    overflow: hidden;
}

.effect-chip__fill {
    height: 100%;
    background: var(--t-accent);
    border-radius: 2px;
    transition: width 0.5s linear;
}

.effect-chip.negative .effect-chip__fill {
    background: var(--t-danger);
}

.effect-chip__time {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    white-space: nowrap;
}
</style>
