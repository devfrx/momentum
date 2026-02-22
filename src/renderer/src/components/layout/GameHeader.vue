<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useJobStore } from '@renderer/stores/useJobStore'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { useDepositStore } from '@renderer/stores/useDepositStore'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { usePrestigeStore } from '@renderer/stores/usePrestigeStore'
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { useFormat } from '@renderer/composables/useFormat'
import { add, sub, ZERO } from '@renderer/core/BigNum'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton, UTooltip } from '@renderer/components/ui'
import MultiplierBreakdownPanel from '@renderer/components/MultiplierBreakdownPanel.vue'
import blackLogo from '@renderer/assets/black_logo.png'
import whiteLogo from '@renderer/assets/white_logo.png'

const route = useRoute()
const player = usePlayerStore()
const business = useBusinessStore()
const jobs = useJobStore()
const realEstate = useRealEstateStore()
const deposits = useDepositStore()
const loans = useLoanStore()
const prestige = usePrestigeStore()
const settings = useSettingsStore()
const upgrades = useUpgradeStore()
const { formatCash, formatCashFull, formatNumber, formatMultiplier } = useFormat()

const showMultiplierPanel = ref(false)

const totalIncomePerSecond = computed(() => {
    let total = ZERO
    total = add(total, business.profitPerSecond)
    total = add(total, jobs.jobIncomePerSecond)
    total = add(total, realEstate.rentPerSecond)
    total = add(total, deposits.interestPerSecond)
    total = sub(total, loans.totalInterestPerSecond)
    return total
})

const ROUTE_MULTIPLIER_MAP: Record<string, { id: string; icon: string; labelKey: string }> = {
    business: { id: 'business_revenue', icon: 'mdi:store', labelKey: 'multipliers.business_revenue' },
    realestate: { id: 'real_estate_rent', icon: 'mdi:home-city', labelKey: 'multipliers.real_estate_rent' },
    stocks: { id: 'stock_returns', icon: 'mdi:chart-line', labelKey: 'multipliers.stock_returns' },
    crypto: { id: 'crypto_returns', icon: 'mdi:bitcoin', labelKey: 'multipliers.crypto_returns' },
    gambling: { id: 'gambling_luck', icon: 'mdi:dice-multiple', labelKey: 'multipliers.gambling_luck' },
    investments: { id: 'startup_success', icon: 'mdi:rocket-launch', labelKey: 'multipliers.startup_success' },
    loans: { id: 'loan_rate', icon: 'mdi:bank', labelKey: 'multipliers.loan_rate' },
    deposits: { id: 'deposit_rate', icon: 'mdi:piggy-bank', labelKey: 'multipliers.deposit_rate' },
}

const routeMultiplier = computed(() => {
    const name = route.name as string
    const mapping = ROUTE_MULTIPLIER_MAP[name]
    if (!mapping) return null
    const mul = upgrades.getMultiplier(mapping.id as any)
    return { ...mapping, value: mul, formatted: formatMultiplier(mul), hasBonus: mul.gt(1) }
})

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
        <div class="drag-region"></div>

        <!-- Brand -->
        <div class="brand">
            <img :src="settings.theme === 'dark' ? whiteLogo : blackLogo" alt="FINANX" class="brand-logo" />
            <span class="brand-text">FINANX</span>
        </div>

        <!-- Hero Cash -->
        <UTooltip :text="formatCashFull(player.cash)" placement="bottom">
            <div class="hero-stat">
                <span class="hero-value">{{ formatCash(player.cash) }}</span>
                <span class="hero-profit" :class="{ negative: totalIncomePerSecond.lt(0) }">
                    <AppIcon icon="mdi:trending-up" class="hero-profit-icon" />
                    {{ formatCash(totalIncomePerSecond) }}{{ $t('common.per_second') }}
                </span>
            </div>
        </UTooltip>

        <!-- HUD Stats -->
        <div class="hud-stats">
            <UTooltip :text="$t('header.net_worth') + ': ' + formatCashFull(player.netWorth)" placement="bottom">
                <div class="hud-chip">
                    <span class="hud-chip-label">{{ $t('header.net_worth') }}</span>
                    <span class="hud-chip-value">{{ formatCash(player.netWorth, 2) }}</span>
                </div>
            </UTooltip>

            <UTooltip :text="$t('header.prestige')" placement="bottom">
                <div class="hud-chip">
                    <span class="hud-chip-label">{{ $t('header.prestige') }}</span>
                    <span class="hud-chip-value">{{ formatNumber(prestige.points) }}</span>
                </div>
            </UTooltip>

            <div v-if="routeMultiplier" class="hud-chip" :class="{ 'has-bonus': routeMultiplier.hasBonus }">
                <AppIcon :icon="routeMultiplier.icon" class="hud-route-icon" />
                <span class="hud-chip-value" :class="{ accent: routeMultiplier.hasBonus }">{{ routeMultiplier.formatted
                    }}</span>
            </div>

            <UTooltip :text="$t('header.view_multipliers')" placement="bottom">
                <div class="hud-chip clickable" @click="showMultiplierPanel = !showMultiplierPanel">
                    <span class="hud-chip-label">{{ $t('header.multi') }}</span>
                    <span class="hud-chip-value accent">{{ formatMultiplier(prestige.globalMultiplier) }}</span>
                    <AppIcon icon="mdi:chevron-down" class="hud-chevron" />
                </div>
            </UTooltip>

            <UTooltip :text="`${formatNumber(player.xp)} / ${formatNumber(player.xpToNextLevel)} XP`"
                placement="bottom">
                <div class="hud-chip level-chip">
                    <span class="hud-chip-label">{{ $t('common.level', { n: '' }) }}</span>
                    <span class="hud-chip-value">{{ player.level }}</span>
                    <div class="xp-bar">
                        <div class="xp-fill" :style="{ width: xpProgress + '%' }"></div>
                    </div>
                </div>
            </UTooltip>
        </div>

        <!-- Actions -->
        <div class="header-actions">
            <UTooltip :text="settings.theme === 'dark' ? $t('header.switch_light') : $t('header.switch_dark')"
                placement="bottom">
                <UButton variant="text" :icon="settings.theme === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'"
                    @click="toggleTheme" />
            </UTooltip>

            <div class="header-divider"></div>

            <UTooltip :text="$t('header.minimize')" placement="bottom">
                <UButton variant="text" icon="mdi:minus" @click="handleMinimize" />
            </UTooltip>
            <UTooltip :text="$t('header.maximize')" placement="bottom">
                <UButton variant="text" icon="mdi:checkbox-blank-outline" @click="handleMaximize" />
            </UTooltip>
            <UTooltip :text="$t('header.close')" placement="bottom">
                <UButton variant="danger" icon="mdi:close" @click="handleClose" />
            </UTooltip>
        </div>
    </header>

    <MultiplierBreakdownPanel v-if="showMultiplierPanel" @close="showMultiplierPanel = false" />
</template>

<style scoped>
.app-header {
    display: flex;
    align-items: center;
    height: var(--t-header-height);
    background: var(--t-bg-header);
    border-bottom: 1px solid var(--t-border);
    padding: 0 var(--t-space-3);
    position: relative;
    z-index: 100;
    -webkit-app-region: drag;
    user-select: none;
    gap: var(--t-space-3);
}

.drag-region {
    position: absolute;
    inset: 0;
    -webkit-app-region: drag;
}

.brand {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    z-index: 1;
    -webkit-app-region: no-drag;
    padding-right: var(--t-space-3);
}

.brand-logo {
    height: 32px;
    width: auto;
    object-fit: contain;
}

.brand-text {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    letter-spacing: 0.08em;
    color: var(--t-text);
}

.hero-stat {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    z-index: 1;
    -webkit-app-region: no-drag;
    padding: 0.2rem 0.55rem;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
    transition: border-color var(--t-transition-fast);
}

.hero-stat:hover {
    border-color: var(--t-border-hover);
}

.hero-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    letter-spacing: -0.02em;
}

.hero-profit {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-success);
}

.hero-profit.negative {
    color: var(--t-danger);
}

.hero-profit-icon {
    font-size: 0.6rem;
}

.hud-route-icon {
    font-size: 0.75rem;
    color: var(--t-text-muted);
}

.hud-chip.has-bonus .hud-route-icon {
    color: var(--t-accent);
}

.hud-stats {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    flex: 1;
    z-index: 1;
    -webkit-app-region: no-drag;
}

.hud-chip {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.45rem;
    border-radius: var(--t-radius-sm);
    transition: background var(--t-transition-fast), color var(--t-transition-fast);
}

.hud-chip.clickable {
    cursor: pointer;
}

.hud-chip.clickable:hover {
    background: var(--t-bg-muted);
}

.hud-chip.clickable:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}

.hud-chip-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    white-space: nowrap;
}

.hud-chip-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
    white-space: nowrap;
}

.hud-chip-value.accent {
    color: var(--t-accent);
}

.hud-chevron {
    font-size: 0.6rem;
    color: var(--t-text-muted);
}

.level-chip {
    margin-left: auto;
}

.xp-bar {
    width: 40px;
    height: 3px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-full);
    overflow: hidden;
    margin-left: 0.15rem;
}

.xp-fill {
    height: 100%;
    background: var(--t-text-secondary);
    border-radius: var(--t-radius-full);
    transition: width 0.3s ease;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 1px;
    z-index: 1;
    -webkit-app-region: no-drag;
}

.header-divider {
    width: 1px;
    height: 14px;
    background: var(--t-border);
    margin: 0 var(--t-space-1);
}
</style>
