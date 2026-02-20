<script setup lang="ts">
/**
 * TradingGuide — Comprehensive beginner-friendly guide to trading,
 * candlestick charts, order types, and all market activities.
 *
 * Uses InfoPanel (collapsible accordion) to stay compact inside the
 * fullscreen modal sidebar. Adapts content to stock vs crypto context.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'

const props = defineProps<{
    /** Market type — adjusts terminology (shares vs coins, dividends vs staking) */
    type: 'stock' | 'crypto'
}>()

const { t } = useI18n()

const guideSections = computed<InfoSection[]>(() => [
    // ─── 1. Candlestick Basics ──────────────────────────────────
    {
        title: t('guide.candles.title'),
        icon: 'mdi:chart-box-outline',
        entries: [
            { term: t('guide.candles.what'), desc: t('guide.candles.what_desc'), icon: 'mdi:help-circle-outline' },
            { term: t('guide.candles.body'), desc: t('guide.candles.body_desc'), icon: 'mdi:rectangle' },
            { term: t('guide.candles.wicks'), desc: t('guide.candles.wicks_desc'), icon: 'mdi:arrow-expand-vertical' },
            { term: t('guide.candles.green'), desc: t('guide.candles.green_desc'), icon: 'mdi:arrow-up-bold' },
            { term: t('guide.candles.red'), desc: t('guide.candles.red_desc'), icon: 'mdi:arrow-down-bold' },
        ],
    },
    // ─── 2. Reading Patterns ────────────────────────────────────
    {
        title: t('guide.patterns.title'),
        icon: 'mdi:magnify-scan',
        entries: [
            { term: t('guide.patterns.long_body'), desc: t('guide.patterns.long_body_desc'), icon: 'mdi:arrow-expand-vertical' },
            { term: t('guide.patterns.small_body'), desc: t('guide.patterns.small_body_desc'), icon: 'mdi:minus' },
            { term: t('guide.patterns.long_wick_up'), desc: t('guide.patterns.long_wick_up_desc'), icon: 'mdi:arrow-up-thin' },
            { term: t('guide.patterns.long_wick_down'), desc: t('guide.patterns.long_wick_down_desc'), icon: 'mdi:arrow-down-thin' },
            { term: t('guide.patterns.consecutive'), desc: t('guide.patterns.consecutive_desc'), icon: 'mdi:chart-timeline-variant' },
        ],
    },
    // ─── 3. Chart Interaction ───────────────────────────────────
    {
        title: t('guide.chart_ui.title'),
        icon: 'mdi:gesture-swipe',
        entries: [
            { term: t('guide.chart_ui.zoom'), desc: t('guide.chart_ui.zoom_desc'), icon: 'mdi:magnify-plus-outline' },
            { term: t('guide.chart_ui.pan'), desc: t('guide.chart_ui.pan_desc'), icon: 'mdi:pan-horizontal' },
            { term: t('guide.chart_ui.crosshair'), desc: t('guide.chart_ui.crosshair_desc'), icon: 'mdi:crosshairs' },
            { term: t('guide.chart_ui.time_range'), desc: t('guide.chart_ui.time_range_desc'), icon: 'mdi:clock-outline' },
            { term: t('guide.chart_ui.buy_line'), desc: t('guide.chart_ui.buy_line_desc'), icon: 'mdi:ray-start-arrow' },
        ],
    },
    // ─── 4. Trading Modes ───────────────────────────────────────
    {
        title: t('guide.modes.title'),
        icon: 'mdi:swap-horizontal',
        entries: [
            { term: t('guide.modes.qty'), desc: t('guide.modes.qty_desc'), icon: 'mdi:numeric' },
            { term: t('guide.modes.pct'), desc: t('guide.modes.pct_desc'), icon: 'mdi:percent' },
            { term: t('guide.modes.limit'), desc: t('guide.modes.limit_desc'), icon: 'mdi:clock-alert-outline' },
        ],
    },
    // ─── 5. Order Types ─────────────────────────────────────────
    {
        title: t('guide.orders.title'),
        icon: 'mdi:book-open-page-variant',
        entries: [
            { term: t('guide.orders.market'), desc: t('guide.orders.market_desc'), icon: 'mdi:lightning-bolt' },
            { term: t('guide.orders.limit_buy'), desc: t('guide.orders.limit_buy_desc'), icon: 'mdi:cart-arrow-down' },
            { term: t('guide.orders.limit_sell'), desc: t('guide.orders.limit_sell_desc'), icon: 'mdi:cart-arrow-up' },
            { term: t('guide.orders.stop_loss'), desc: t('guide.orders.stop_loss_desc'), icon: 'mdi:shield-alert' },
            { term: t('guide.orders.take_profit'), desc: t('guide.orders.take_profit_desc'), icon: 'mdi:target' },
            { term: t('guide.orders.expiration'), desc: t('guide.orders.expiration_desc'), icon: 'mdi:timer-sand' },
        ],
    },
    // ─── 6. Position & P/L ──────────────────────────────────────
    {
        title: t('guide.position.title'),
        icon: 'mdi:briefcase-outline',
        entries: [
            { term: t('guide.position.avg_price'), desc: t('guide.position.avg_price_desc'), icon: 'mdi:scale-balance' },
            { term: t('guide.position.unrealized'), desc: t('guide.position.unrealized_desc'), icon: 'mdi:chart-line-variant' },
            { term: t('guide.position.realized'), desc: t('guide.position.realized_desc'), icon: 'mdi:check-decagram' },
            { term: t('guide.position.pnl_pct'), desc: t('guide.position.pnl_pct_desc'), icon: 'mdi:percent-circle-outline' },
        ],
    },
    // ─── 7. Key Metrics ─────────────────────────────────────────
    {
        title: t('guide.metrics.title'),
        icon: 'mdi:information-outline',
        entries: [
            { term: t('guide.metrics.ath'), desc: t('guide.metrics.ath_desc'), icon: 'mdi:arrow-up-bold-circle' },
            { term: t('guide.metrics.atl'), desc: t('guide.metrics.atl_desc'), icon: 'mdi:arrow-down-bold-circle' },
            { term: t('guide.metrics.change'), desc: t('guide.metrics.change_desc'), icon: 'mdi:delta' },
            {
                term: t(props.type === 'crypto' ? 'guide.metrics.staking' : 'guide.metrics.dividends'),
                desc: t(props.type === 'crypto' ? 'guide.metrics.staking_desc' : 'guide.metrics.dividends_desc'),
                icon: props.type === 'crypto' ? 'mdi:server-network' : 'mdi:currency-usd',
            },
        ],
    },
    // ─── 8. Tips & Strategy ─────────────────────────────────────
    {
        title: t('guide.tips.title'),
        icon: 'mdi:lightbulb-outline',
        entries: [
            { term: t('guide.tips.diversify'), desc: t('guide.tips.diversify_desc'), icon: 'mdi:view-grid-outline' },
            { term: t('guide.tips.dca'), desc: t('guide.tips.dca_desc'), icon: 'mdi:repeat' },
            { term: t('guide.tips.stop_loss'), desc: t('guide.tips.stop_loss_desc'), icon: 'mdi:shield-check' },
            { term: t('guide.tips.conditions'), desc: t('guide.tips.conditions_desc'), icon: 'mdi:weather-partly-cloudy' },
            { term: t('guide.tips.patience'), desc: t('guide.tips.patience_desc'), icon: 'mdi:timer-sand' },
        ],
    },
])
</script>

<template>
    <InfoPanel :title="$t('guide.title')"
        :description="$t(type === 'crypto' ? 'guide.desc_crypto' : 'guide.desc_stock')" :sections="guideSections" />
</template>
