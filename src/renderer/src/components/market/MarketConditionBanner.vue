<script setup lang="ts">
/**
 * MarketConditionBanner — Visual indicator for market state
 *
 * Shows current market condition (bull/bear/crash/bubble), trend direction,
 * Fear & Greed index, volatility level, and actionable market signals.
 */
import { computed, ref } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UTooltip } from '@renderer/components/ui'
import type { MarketAnalysis, MarketCondition, MarketTrend, MarketPhase } from '@renderer/core/MarketSim'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    analysis: MarketAnalysis
    /** 'stock' or 'crypto' — for theming */
    type: 'stock' | 'crypto'
}>()

const { t } = useI18n()
const settings = useSettingsStore()
const expanded = ref(false)

// ─── Condition display ─────────────────────────────────────────

const conditionConfig = computed(() => {
    const map: Record<MarketCondition, { icon: string; color: string; label: string; bgClass: string }> = {
        normal: { icon: 'mdi:minus-circle-outline', color: 'var(--t-text-muted)', label: t('market.condition_normal'), bgClass: 'condition-normal' },
        bull: { icon: 'mdi:bull', color: 'var(--t-success)', label: t('market.condition_bull'), bgClass: 'condition-bull' },
        bear: { icon: 'mdi:arrow-down-bold', color: 'var(--t-danger)', label: t('market.condition_bear'), bgClass: 'condition-bear' },
        crash: { icon: 'mdi:alert-octagon', color: 'var(--t-danger)', label: t('market.condition_crash'), bgClass: 'condition-crash' },
        bubble: { icon: 'mdi:rocket-launch', color: 'var(--t-warning)', label: t('market.condition_bubble'), bgClass: 'condition-bubble' },
    }
    return map[props.analysis.activeCondition]
})

// ─── Trend display ──────────────────────────────────────────────

const trendConfig = computed(() => {
    const map: Record<MarketTrend, { icon: string; color: string; label: string }> = {
        strong_bull: { icon: 'mdi:trending-up', color: 'var(--t-success)', label: t('market.trend_strong_bull') },
        bull: { icon: 'mdi:arrow-top-right', color: 'var(--t-success)', label: t('market.trend_bull') },
        neutral: { icon: 'mdi:arrow-right', color: 'var(--t-text-muted)', label: t('market.trend_neutral') },
        bear: { icon: 'mdi:arrow-bottom-right', color: 'var(--t-danger)', label: t('market.trend_bear') },
        strong_bear: { icon: 'mdi:trending-down', color: 'var(--t-danger)', label: t('market.trend_strong_bear') },
    }
    return map[props.analysis.trend]
})

// ─── Phase display ──────────────────────────────────────────────

const phaseConfig = computed(() => {
    const map: Record<MarketPhase, { icon: string; color: string; label: string }> = {
        normal: { icon: 'mdi:check-circle-outline', color: 'var(--t-text-muted)', label: t('market.phase_normal') },
        bubble: { icon: 'mdi:circle-multiple-outline', color: 'var(--t-warning)', label: t('market.phase_bubble') },
        correction: { icon: 'mdi:swap-vertical', color: 'var(--t-warning)', label: t('market.phase_correction') },
        crash: { icon: 'mdi:flash-alert', color: 'var(--t-danger)', label: t('market.phase_crash') },
        recovery: { icon: 'mdi:sprout', color: 'var(--t-success)', label: t('market.phase_recovery') },
    }
    return map[props.analysis.phase]
})

// ─── Fear & Greed ───────────────────────────────────────────────

const fearGreedLabel = computed(() => {
    const v = props.analysis.fearGreedIndex
    if (v <= 20) return t('market.fear_extreme')
    if (v <= 40) return t('market.fear')
    if (v <= 60) return t('market.neutral')
    if (v <= 80) return t('market.greed')
    return t('market.greed_extreme')
})

const fearGreedColor = computed(() => {
    const v = props.analysis.fearGreedIndex
    if (v <= 20) return 'var(--t-danger)'
    if (v <= 40) return 'var(--t-warning)'
    if (v <= 60) return 'var(--t-text-muted)'
    if (v <= 80) return 'var(--t-success)'
    return 'var(--t-success)'
})

// ─── Volatility ─────────────────────────────────────────────────

const volLabel = computed(() => {
    const v = props.analysis.volatilityIndex
    if (v <= 15) return t('market.vol_low')
    if (v <= 35) return t('market.vol_moderate')
    if (v <= 60) return t('market.vol_high')
    return t('market.vol_extreme')
})

const volColor = computed(() => {
    const v = props.analysis.volatilityIndex
    if (v <= 15) return 'var(--t-success)'
    if (v <= 35) return 'var(--t-text-muted)'
    if (v <= 60) return 'var(--t-warning)'
    return 'var(--t-danger)'
})

// ─── Market Signal ──────────────────────────────────────────────

const marketSignal = computed(() => {
    const a = props.analysis
    if (a.activeCondition === 'crash' || a.phase === 'crash') {
        return { icon: 'mdi:alert', label: t('market.signal_caution'), color: 'var(--t-danger)' }
    }
    if (a.fearGreedIndex <= 25 && a.mediumTermMomentum < -0.2) {
        return { icon: 'mdi:cart-arrow-down', label: t('market.signal_buy'), color: 'var(--t-success)' }
    }
    if (a.fearGreedIndex >= 75 && a.phase === 'bubble') {
        return { icon: 'mdi:cash-register', label: t('market.signal_sell'), color: 'var(--t-warning)' }
    }
    return { icon: 'mdi:hand-extended', label: t('market.signal_hold'), color: 'var(--t-text-muted)' }
})

// ─── Momentum bar value ─────────────────────────────────────────

function momentumPercent(val: number): number {
    return Math.round((val + 1) / 2 * 100)
}

function formatConditionTime(ticks: number): string {
    // each sim tick = marketUpdateInterval engine ticks / 10 tps
    const seconds = Math.ceil(ticks * settings.marketUpdateInterval / 10)
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${seconds}s`
}
</script>

<template>
    <div class="market-condition-banner" :class="[conditionConfig.bgClass, `type-${type}`]">
        <!-- Main row — always visible -->
        <div class="banner-main" @click="expanded = !expanded">
            <!-- Condition badge -->
            <div class="condition-badge" :style="{ color: conditionConfig.color }">
                <AppIcon :icon="conditionConfig.icon" class="condition-icon" />
                <span class="condition-label">{{ conditionConfig.label }}</span>
                <span v-if="analysis.conditionTicksRemaining > 0" class="condition-timer">
                    {{ formatConditionTime(analysis.conditionTicksRemaining) }}
                </span>
            </div>

            <!-- Quick indicators -->
            <div class="quick-indicators">
                <!-- Trend -->
                <UTooltip :text="`${t('market.trend_label')}: ${trendConfig.label}`" placement="bottom">
                    <div class="indicator-chip" :style="{ color: trendConfig.color }">
                        <AppIcon :icon="trendConfig.icon" />
                        <span class="indicator-value">{{ trendConfig.label }}</span>
                    </div>
                </UTooltip>

                <!-- Fear & Greed -->
                <UTooltip :text="`${t('market.fear_greed')}: ${analysis.fearGreedIndex}/100`" placement="bottom">
                    <div class="indicator-chip">
                        <span class="fg-value" :style="{ color: fearGreedColor }">{{ analysis.fearGreedIndex }}</span>
                        <span class="indicator-label" :style="{ color: fearGreedColor }">{{ fearGreedLabel }}</span>
                    </div>
                </UTooltip>

                <!-- Volatility -->
                <UTooltip :text="`${t('market.volatility_index')}: ${Math.round(analysis.volatilityIndex)}`"
                    placement="bottom">
                    <div class="indicator-chip" :style="{ color: volColor }">
                        <AppIcon icon="mdi:pulse" />
                        <span class="indicator-value">{{ volLabel }}</span>
                    </div>
                </UTooltip>

                <!-- Signal -->
                <div class="indicator-chip signal-chip" :style="{ color: marketSignal.color }">
                    <AppIcon :icon="marketSignal.icon" />
                    <span class="indicator-value">{{ marketSignal.label }}</span>
                </div>
            </div>

            <AppIcon :icon="expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="expand-icon" />
        </div>

        <!-- Expanded details -->
        <transition name="details-slide">
            <div v-if="expanded" class="banner-details">
                <div class="detail-grid">
                    <!-- Phase -->
                    <div class="detail-item">
                        <span class="detail-label">{{ t('market.phase_label') }}</span>
                        <div class="detail-value" :style="{ color: phaseConfig.color }">
                            <AppIcon :icon="phaseConfig.icon" />
                            {{ phaseConfig.label }}
                        </div>
                    </div>

                    <!-- Short-term Momentum -->
                    <div class="detail-item">
                        <span class="detail-label">{{ t('market.momentum_short') }}</span>
                        <div class="momentum-bar-container">
                            <div class="momentum-bar">
                                <div class="momentum-fill"
                                    :style="{ width: momentumPercent(analysis.shortTermMomentum) + '%' }"
                                    :class="{ positive: analysis.shortTermMomentum > 0, negative: analysis.shortTermMomentum < 0 }">
                                </div>
                                <div class="momentum-center"></div>
                            </div>
                            <span class="momentum-value"
                                :class="{ positive: analysis.shortTermMomentum > 0, negative: analysis.shortTermMomentum < 0 }">
                                {{ analysis.shortTermMomentum > 0 ? '+' : '' }}{{
                                    (analysis.shortTermMomentum * 100).toFixed(0) }}%
                            </span>
                        </div>
                    </div>

                    <!-- Medium-term Momentum -->
                    <div class="detail-item">
                        <span class="detail-label">{{ t('market.momentum_medium') }}</span>
                        <div class="momentum-bar-container">
                            <div class="momentum-bar">
                                <div class="momentum-fill"
                                    :style="{ width: momentumPercent(analysis.mediumTermMomentum) + '%' }"
                                    :class="{ positive: analysis.mediumTermMomentum > 0, negative: analysis.mediumTermMomentum < 0 }">
                                </div>
                                <div class="momentum-center"></div>
                            </div>
                            <span class="momentum-value"
                                :class="{ positive: analysis.mediumTermMomentum > 0, negative: analysis.mediumTermMomentum < 0 }">
                                {{ analysis.mediumTermMomentum > 0 ? '+' : '' }}{{
                                    (analysis.mediumTermMomentum * 100).toFixed(0) }}%
                            </span>
                        </div>
                    </div>

                    <!-- Fear & Greed gauge -->
                    <div class="detail-item">
                        <span class="detail-label">{{ t('market.fear_greed') }}</span>
                        <div class="gauge-container">
                            <div class="gauge-bar">
                                <div class="gauge-fill" :style="{
                                    width: analysis.fearGreedIndex + '%',
                                    background: `linear-gradient(90deg, var(--t-danger), var(--t-warning) 40%, var(--t-success) 80%)`
                                }"></div>
                            </div>
                            <span class="gauge-value" :style="{ color: fearGreedColor }">
                                {{ analysis.fearGreedIndex }}/100
                            </span>
                        </div>
                    </div>

                    <!-- Volatility gauge -->
                    <div class="detail-item">
                        <span class="detail-label">{{ t('market.volatility_index') }}</span>
                        <div class="gauge-container">
                            <div class="gauge-bar">
                                <div class="gauge-fill" :style="{
                                    width: Math.min(100, analysis.volatilityIndex) + '%',
                                    background: `linear-gradient(90deg, var(--t-success), var(--t-warning) 50%, var(--t-danger))`
                                }"></div>
                            </div>
                            <span class="gauge-value" :style="{ color: volColor }">
                                {{ Math.round(analysis.volatilityIndex) }}
                            </span>
                        </div>
                    </div>

                    <!-- ATH Distance -->
                    <div class="detail-item">
                        <span class="detail-label">ATH Distance</span>
                        <span class="detail-value"
                            :class="{ negative: analysis.avgDistanceFromAth > 0.1, positive: analysis.avgDistanceFromAth < 0.03 }">
                            -{{ (analysis.avgDistanceFromAth * 100).toFixed(1) }}%
                        </span>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.market-condition-banner {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    margin-bottom: 0.75rem;
    overflow: hidden;
    transition: all var(--t-transition-normal);
}

/* Condition-specific border accent */
.condition-bull {
    border-left: 3px solid var(--t-success);
}

.condition-bear {
    border-left: 3px solid var(--t-danger);
}

.condition-crash {
    border-left: 3px solid var(--t-danger);
    background: color-mix(in srgb, var(--t-danger) 5%, var(--t-bg-card));
}

.condition-bubble {
    border-left: 3px solid var(--t-warning);
    background: color-mix(in srgb, var(--t-warning) 5%, var(--t-bg-card));
}

.condition-normal {
    border-left: 3px solid var(--t-border);
}

/* ─── Main Row ─── */
.banner-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    user-select: none;
}

.banner-main:hover {
    background: var(--t-bg-hover);
}

.condition-badge {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
}

.condition-icon {
    font-size: 1.1rem;
}

.condition-label {
    font-weight: var(--t-font-bold);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.condition-timer {
    font-family: var(--t-font-mono);
    font-size: 0.65rem;
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
    padding: 0.1rem 0.35rem;
    border-radius: var(--t-radius-sm);
}

.quick-indicators {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.indicator-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.72rem;
    font-weight: var(--t-font-semibold);
    padding: 0.15rem 0.4rem;
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
}

.indicator-label {
    font-weight: var(--t-font-medium);
}

.fg-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    font-size: 0.75rem;
}

.signal-chip {
    font-weight: var(--t-font-bold);
}

.expand-icon {
    font-size: 0.9rem;
    color: var(--t-text-muted);
    flex-shrink: 0;
}

/* ─── Details Panel ─── */
.banner-details {
    padding: 0.5rem 0.75rem 0.75rem;
    border-top: 1px solid var(--t-border);
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.6rem;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.detail-label {
    font-size: 0.65rem;
    font-weight: var(--t-font-semibold);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.detail-value {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    font-weight: var(--t-font-semibold);
}

.detail-value.positive {
    color: var(--t-success);
}

.detail-value.negative {
    color: var(--t-danger);
}

/* ─── Momentum bars ─── */
.momentum-bar-container {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.momentum-bar {
    position: relative;
    flex: 1;
    height: 6px;
    background: var(--t-bg-muted);
    border-radius: 3px;
    overflow: hidden;
}

.momentum-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 3px;
    transition: width var(--t-transition-normal);
}

.momentum-fill.positive {
    background: var(--t-success);
}

.momentum-fill.negative {
    background: var(--t-danger);
}

.momentum-center {
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 8px;
    background: var(--t-text-muted);
    border-radius: 1px;
}

.momentum-value {
    font-family: var(--t-font-mono);
    font-size: 0.7rem;
    font-weight: var(--t-font-semibold);
    min-width: 2.5rem;
    text-align: right;
}

.momentum-value.positive {
    color: var(--t-success);
}

.momentum-value.negative {
    color: var(--t-danger);
}

/* ─── Gauge bars ─── */
.gauge-container {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.gauge-bar {
    flex: 1;
    height: 6px;
    background: var(--t-bg-muted);
    border-radius: 3px;
    overflow: hidden;
}

.gauge-fill {
    height: 100%;
    border-radius: 3px;
    transition: width var(--t-transition-normal);
}

.gauge-value {
    font-family: var(--t-font-mono);
    font-size: 0.7rem;
    font-weight: var(--t-font-semibold);
    min-width: 2.5rem;
    text-align: right;
}

/* ─── Transitions ─── */
.details-slide-enter-active,
.details-slide-leave-active {
    transition: all var(--t-transition-normal) ease;
    max-height: 300px;
}

.details-slide-enter-from,
.details-slide-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
}
</style>
