<script setup lang="ts">
/**
 * MarketSettings — Controls for market tick speed + info panel
 */
import { ref } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'

const settings = useSettingsStore()
const showInfo = ref(false)

const intervalOptions = [
    { label: '1s', value: 10, descKey: 'market.every_1s' },
    { label: '3s', value: 30, descKey: 'market.every_3s' },
    { label: '5s', value: 50, descKey: 'market.every_5s' },
    { label: '10s', value: 100, descKey: 'market.every_10s' },
    { label: '30s', value: 300, descKey: 'market.every_30s' },
    { label: '1m', value: 600, descKey: 'market.every_1m' }
]
</script>

<template>
    <div class="market-settings">
        <div class="setting-row">
            <div class="setting-label">
                <AppIcon icon="mdi:metronome" />
                <span>{{ $t('market.tick_speed') }}</span>
            </div>
            <div class="interval-buttons">
                <UButton variant="icon" size="xs" v-for="opt in intervalOptions" :key="opt.value"
                    :active="settings.marketUpdateInterval === opt.value"
                    @click="settings.marketUpdateInterval = opt.value" :title="$t(opt.descKey)">
                    {{ opt.label }}
                </UButton>
            </div>
            <UButton variant="text" :active="showInfo" @click="showInfo = !showInfo"
                :title="$t('market.how_markets_work_tip')" icon="mdi:information-outline">
            </UButton>
        </div>

        <!-- Info Panel -->
        <Transition name="slide">
            <div v-if="showInfo" class="info-panel">
                <div class="info-panel-header">
                    <AppIcon icon="mdi:chart-timeline-variant-shimmer" />
                    <span>{{ $t('market.how_markets_work') }}</span>
                </div>
                <div class="info-content">
                    <div class="info-block">
                        <h4>
                            <AppIcon icon="mdi:metronome" />
                            {{ $t('market.info_tick_title') }}
                        </h4>
                        <p v-html="$t('market.info_tick_desc')"></p>
                    </div>
                    <div class="info-block">
                        <h4>
                            <AppIcon icon="mdi:sine-wave" />
                            {{ $t('market.info_gbm_title') }}
                        </h4>
                        <p v-html="$t('market.info_gbm_desc')"></p>
                    </div>
                    <div class="info-block">
                        <h4>
                            <AppIcon icon="mdi:weather-cloudy-alert" />
                            {{ $t('market.info_conditions_title') }}
                        </h4>
                        <p v-html="$t('market.info_conditions_desc')"></p>
                    </div>
                    <div class="info-block">
                        <h4>
                            <AppIcon icon="mdi:pin" />
                            {{ $t('market.info_pin_title') }}
                        </h4>
                        <p v-html="$t('market.info_pin_desc')"></p>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.market-settings {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.setting-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.setting-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
    white-space: nowrap;
}

.interval-buttons {
    display: flex;
    gap: 0.2rem;
}

/* ─── Info Panel ─── */
.info-panel {
    margin-top: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    overflow: hidden;
}

.info-panel-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-muted);
    font-size: 0.85rem;
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    border-bottom: 1px solid var(--t-border);
}

.info-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
}

.info-block h4 {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    margin: 0 0 var(--t-space-1) 0;
}

.info-block p {
    font-size: 0.72rem;
    line-height: 1.5;
    color: var(--t-text-secondary);
    margin: 0;
}

.info-block p strong {
    color: var(--t-text);
}

.info-block p em {
    color: var(--t-info);
    font-style: normal;
}

/* Transition */
.slide-enter-active,
.slide-leave-active {
    transition: all var(--t-transition-fast) ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
}

.slide-enter-to,
.slide-leave-from {
    opacity: 1;
    max-height: 500px;
}
</style>
