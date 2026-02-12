<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { usePrestigeStore } from '@renderer/stores/usePrestigeStore'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useMultipliers, type CategoryBreakdown } from '@renderer/composables/useMultipliers'
import AppIcon from '@renderer/components/AppIcon.vue'
import MultiplierBreakdownPanel from '@renderer/components/MultiplierBreakdownPanel.vue'

const route = useRoute()
const player = usePlayerStore()
const business = useBusinessStore()
const prestige = usePrestigeStore()
const settings = useSettingsStore()
const { formatCash, formatNumber, formatMultiplier } = useFormat()
const { breakdowns } = useMultipliers()

// ─── Route-to-Multiplier Mapping ─────────────────────────────
// Maps each route to the multiplier categories relevant to that page
// Includes multipliers from: Skill Tree, Prestige, Events, Achievements
const ROUTE_MULTIPLIERS: Record<string, string[]> = {
    dashboard: ['all_income', 'offline_efficiency'],
    business: ['business_revenue', 'job_efficiency', 'cost_reduction', 'customer_attraction', 'all_income'],
    stocks: ['stock_returns', 'all_income'],
    crypto: ['crypto_returns', 'all_income'],
    realestate: ['real_estate_rent', 'all_income'],
    investments: ['startup_success', 'all_income'],
    loans: ['loan_rate'],
    deposits: ['deposit_rate', 'all_income'],
    gambling: ['gambling_luck', 'all_income'],
    skills: ['xp_gain'],
    prestige: ['prestige_gain', 'all_income'],
    settings: ['offline_efficiency'],
}

/** Get relevant multiplier breakdowns for current page */
const pageMultipliers = computed<CategoryBreakdown[]>(() => {
    const routeName = String(route.name ?? 'dashboard')
    const relevantIds = ROUTE_MULTIPLIERS[routeName] ?? ROUTE_MULTIPLIERS['dashboard']
    return breakdowns.value.filter((b) => relevantIds.includes(b.category.id))
})

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

        <!-- HUD Stats -->
        <div class="hud-stats">
            <div class="hud-item primary-stat">
                <span class="hud-value">{{ formatCash(player.cash) }}</span>
            </div>

            <div class="hud-divider"></div>

            <div class="hud-item">
                <span class="hud-label">{{ $t('header.profit') }}</span>
                <span class="hud-value success">{{ formatCash(business.profitPerSecond) }}{{ $t('common.per_second')
                    }}</span>
            </div>

            <div class="hud-item">
                <span class="hud-label">{{ $t('header.net_worth') }}</span>
                <span class="hud-value">{{ formatCash(player.netWorth, 2) }}</span>
            </div>

            <div class="hud-item">
                <span class="hud-label">{{ $t('header.prestige') }}</span>
                <span class="hud-value">{{ formatNumber(prestige.points) }}</span>
            </div>

            <div class="hud-item clickable" @click="showMultiplierPanel = !showMultiplierPanel"
                :title="$t('header.view_multipliers')">
                <span class="hud-label">{{ $t('header.multi') }}</span>
                <span class="hud-value">{{ formatMultiplier(prestige.globalMultiplier) }}</span>
                <AppIcon icon="mdi:chevron-down" class="hud-chevron" />
            </div>

            <!-- Page-specific multipliers -->
            <div v-if="pageMultipliers.length > 0" class="hud-divider"></div>
            <div v-for="pm in pageMultipliers" :key="pm.category.id" class="hud-item page-bonus"
                :class="{ active: pm.hasBonus }" :title="$t(pm.category.labelKey)">
                <AppIcon :icon="pm.category.icon" class="bonus-icon" />
                <span class="bonus-value">{{ pm.totalFormatted }}</span>
            </div>

            <div class="hud-item level-item"
                :title="`${formatNumber(player.xp)} / ${formatNumber(player.xpToNextLevel)} XP`">
                <span class="hud-label">{{ $t('common.level', { n: '' }) }}</span>
                <span class="hud-value">{{ player.level }}</span>
                <div class="xp-bar">
                    <div class="xp-fill" :style="{ width: xpProgress + '%' }"></div>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="header-actions">
            <!-- Theme Toggle -->
            <button class="icon-btn" @click="toggleTheme"
                :title="settings.theme === 'dark' ? $t('header.switch_light') : $t('header.switch_dark')">
                <AppIcon :icon="settings.theme === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'" />
            </button>

            <div class="header-divider"></div>

            <!-- Window Controls -->
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
    gap: 0.5rem;
}

.drag-region {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    -webkit-app-region: drag;
}

/* Brand */
.brand {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    z-index: 1;
    -webkit-app-region: no-drag;
    padding: 0 0.75rem 0 0.25rem;
    border-right: 1px solid var(--t-border);
    margin-right: 0.25rem;
}

.brand-icon {
    font-size: 1.25rem;
    color: var(--t-text);
}

.brand-text {
    font-size: var(--t-font-size-base);
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--t-text);
}

/* HUD Stats */
.hud-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    z-index: 1;
    -webkit-app-region: no-drag;
}

.hud-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.hud-item.clickable {
    cursor: pointer;
    padding: 0.15rem 0.45rem;
    border-radius: var(--t-radius-sm);
    transition: background 0.15s;
}

.hud-item.clickable:hover {
    background: var(--t-bg-muted);
}

.hud-chevron {
    font-size: 0.7rem;
    color: var(--t-text-muted);
    margin-left: -0.1rem;
}

.hud-divider {
    width: 1px;
    height: 20px;
    background: var(--t-border);
}

.primary-stat {
    padding: 0.2rem 0.55rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
}

.primary-stat .hud-icon {
    font-size: 0.9rem;
    color: var(--t-text-secondary);
}

.primary-stat .hud-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: 700;
    color: var(--t-text);
}

.hud-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.hud-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text-secondary);
}

.hud-value.success {
    color: var(--t-success);
}

/* Actions */
.header-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    z-index: 1;
    -webkit-app-region: no-drag;
}

.header-divider {
    width: 1px;
    height: 20px;
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
    font-size: 0.95rem;
}

.icon-btn:hover {
    background: var(--t-bg-muted);
    color: var(--t-text);
}

.icon-btn.close:hover {
    background: #dc2626;
    color: white;
}

/* Level + XP Progress */
.level-item {
    position: relative;
    padding-right: 0.25rem;
}

.xp-bar {
    width: 50px;
    height: 3px;
    background: var(--t-bg-muted);
    border-radius: 1px;
    overflow: hidden;
    margin-left: 0.25rem;
}

.xp-fill {
    height: 100%;
    background: var(--t-accent);
    border-radius: 1px;
    transition: width 0.3s ease;
}

/* Page-specific bonus chips */
.page-bonus {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.4rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    border: 1px solid transparent;
    transition: all 0.15s;
}

.page-bonus.active {
    background: color-mix(in srgb, var(--t-accent) 12%, transparent);
    border-color: color-mix(in srgb, var(--t-accent) 25%, transparent);
}

.page-bonus .bonus-icon {
    font-size: 0.85rem;
    color: var(--t-text-muted);
}

.page-bonus.active .bonus-icon {
    color: var(--t-accent);
}

.page-bonus .bonus-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text-muted);
}

.page-bonus.active .bonus-value {
    color: var(--t-accent);
}
</style>
