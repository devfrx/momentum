<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { usePrestigeStore } from '@renderer/stores/usePrestigeStore'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'
import MultiplierBreakdownPanel from '@renderer/components/MultiplierBreakdownPanel.vue'

const player = usePlayerStore()
const business = useBusinessStore()
const prestige = usePrestigeStore()
const settings = useSettingsStore()
const { formatCash, formatNumber, formatMultiplier } = useFormat()

const showMultiplierPanel = ref(false)

// XP progress percentage (0-100)
const xpProgress = computed(() => {
    if (player.xpToNextLevel.eq(0)) return 100
    return Math.min(100, player.xp.div(player.xpToNextLevel).mul(100).toNumber())
})

function toggleTheme(): void {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark'
}

function handleMinimize(): void {
    window.api?.minimize?.()
}

function handleMaximize(): void {
    window.api?.maximize?.()
}

function handleClose(): void {
    window.api?.close?.()
}
</script>

<template>
    <header class="app-header">
        <!-- Drag region -->
        <div class="drag-region"></div>

        <!-- Brand -->
        <div class="brand">
            <AppIcon icon="mdi:chart-timeline-variant-shimmer" class="brand-icon" />
            <span class="brand-text">{{ $t('header.brand') }}</span>
        </div>

        <!-- Hero: Primary Cash -->
        <div class="hero-stat">
            <span class="hero-value">{{ formatCash(player.cash) }}</span>
            <span class="hero-profit">
                <AppIcon icon="mdi:trending-up" class="hero-profit-icon" />
                {{ formatCash(business.profitPerSecond) }}{{ $t('common.per_second') }}
            </span>
        </div>

        <!-- Secondary Stats -->
        <div class="hud-stats">
            <div class="hud-chip" :title="$t('header.net_worth')">
                <span class="hud-chip-label">{{ $t('header.net_worth') }}</span>
                <span class="hud-chip-value">{{ formatCash(player.netWorth, 2) }}</span>
            </div>

            <div class="hud-chip" :title="$t('header.prestige')">
                <span class="hud-chip-label">{{ $t('header.prestige') }}</span>
                <span class="hud-chip-value">{{ formatNumber(prestige.points) }}</span>
            </div>

            <div class="hud-chip clickable" @click="showMultiplierPanel = !showMultiplierPanel"
                :title="$t('header.view_multipliers')">
                <span class="hud-chip-label">{{ $t('header.multi') }}</span>
                <span class="hud-chip-value accent">{{ formatMultiplier(prestige.globalMultiplier) }}</span>
                <AppIcon icon="mdi:chevron-down" class="hud-chevron" />
            </div>

            <div class="hud-chip level-chip"
                :title="`${formatNumber(player.xp)} / ${formatNumber(player.xpToNextLevel)} XP`">
                <span class="hud-chip-label">{{ $t('common.level', { n: '' }) }}</span>
                <span class="hud-chip-value">{{ player.level }}</span>
                <div class="xp-bar">
                    <div class="xp-fill" :style="{ width: xpProgress + '%' }"></div>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="header-actions">
            <button class="icon-btn" @click="toggleTheme"
                :title="settings.theme === 'dark' ? $t('header.switch_light') : $t('header.switch_dark')">
                <AppIcon :icon="settings.theme === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'" />
            </button>

            <div class="header-divider"></div>

            <button class="icon-btn" @click="handleMinimize" :title="$t('header.minimize')">
                <AppIcon icon="mdi:minus" />
            </button>
            <button class="icon-btn" @click="handleMaximize" :title="$t('header.maximize')">
                <AppIcon icon="mdi:checkbox-blank-outline" />
            </button>
            <button class="icon-btn close" @click="handleClose" :title="$t('header.close')">
                <AppIcon icon="mdi:close" />
            </button>
        </div>
    </header>

    <!-- Multiplier Breakdown Panel -->
    <MultiplierBreakdownPanel v-if="showMultiplierPanel" @close="showMultiplierPanel = false" />
</template>

<style scoped>
.app-header {
    display: flex;
    align-items: center;
    height: var(--t-header-height);
    background: var(--t-bg-header);
    border-bottom: 1px solid var(--t-border);
    padding: 0 0.5rem;
    position: relative;
    z-index: 100;
    -webkit-app-region: drag;
    user-select: none;
    gap: 0.75rem;
}

.drag-region {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    -webkit-app-region: drag;
}

/* ─── Brand ─── */
.brand {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    z-index: 1;
    -webkit-app-region: no-drag;
    padding-right: 0.75rem;
    margin-right: 0.25rem;
}

.brand-icon {
    font-size: 1.15rem;
    color: var(--t-accent);
}

.brand-text {
    font-size: var(--t-font-size-base);
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--t-text);
}

/* ─── Hero Cash (primary focus) ─── */
.hero-stat {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    z-index: 1;
    -webkit-app-region: no-drag;
    padding: 0.2rem 0.65rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

.hero-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: 700;
    color: var(--t-text);
    letter-spacing: -0.02em;
}

.hero-profit {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-success);
}

.hero-profit-icon {
    font-size: 0.7rem;
}

/* ─── Secondary HUD Stats ─── */
.hud-stats {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex: 1;
    z-index: 1;
    -webkit-app-region: no-drag;
}

.hud-chip {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.15rem 0.5rem;
    border-radius: var(--t-radius-sm);
    transition: background 0.15s;
}

.hud-chip.clickable {
    cursor: pointer;
}

.hud-chip.clickable:hover {
    background: var(--t-bg-muted);
}

.hud-chip-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    white-space: nowrap;
}

.hud-chip-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text-secondary);
    white-space: nowrap;
}

.hud-chip-value.accent {
    color: var(--t-accent);
}

.hud-chevron {
    font-size: 0.65rem;
    color: var(--t-text-muted);
    margin-left: -0.05rem;
}

/* ─── Level + XP ─── */
.level-chip {
    margin-left: auto;
}

.xp-bar {
    width: 44px;
    height: 3px;
    background: var(--t-bg-muted);
    border-radius: 2px;
    overflow: hidden;
    margin-left: 0.2rem;
}

.xp-fill {
    height: 100%;
    background: var(--t-accent);
    border-radius: 2px;
    transition: width 0.3s ease;
}

/* ─── Actions ─── */
.header-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    z-index: 1;
    -webkit-app-region: no-drag;
}

.header-divider {
    width: 1px;
    height: 18px;
    background: var(--t-border);
    margin: 0 4px;
}

.icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background: transparent;
    border: none;
    color: var(--t-text-muted);
    cursor: pointer;
    border-radius: var(--t-radius-sm);
    transition: all 0.1s;
    font-size: 0.9rem;
}

.icon-btn:hover {
    background: var(--t-bg-muted);
    color: var(--t-text);
}

.icon-btn.close:hover {
    background: #dc2626;
    color: white;
}
</style>
