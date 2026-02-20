<script setup lang="ts">
/**
 * CandlestickChart — OHLC candlestick chart using Chart.js + chartjs-chart-financial
 *
 * Displays candlestick data from the MarketSimulator's OHLC history.
 * All data is always passed to Chart.js; range buttons control the visible x-axis window.
 * Zoom/pan works within the full dataset. Y-axis auto-adjusts to visible candles.
 * Shows limit order target lines and buy-price line.
 */
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Chart,
  registerables,
  type ChartConfiguration,
  type UpdateMode
} from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
} from 'chartjs-chart-financial'
import 'chartjs-adapter-luxon'
import { smartDecimals } from '@renderer/composables/useFormat'
import { UButton } from '@renderer/components/ui'
import { UTooltip } from '@renderer/components/ui'
import { THEME } from '@renderer/assets/theme/colors'
import type { CandlestickData } from '@renderer/core/MarketSim'
import { useLimitOrderStore } from '@renderer/stores/useLimitOrderStore'

// Register Chart.js plugins and financial chart types
Chart.register(
  ...registerables,
  zoomPlugin,
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
)

const { t } = useI18n()
const limitOrderStore = useLimitOrderStore()

const props = withDefaults(
  defineProps<{
    /** OHLC candle data from MarketSimulator */
    data: CandlestickData[]
    /** Chart label / asset name */
    label?: string
    /** Chart height in px */
    height?: number
    /** Average buy price line */
    buyPrice?: number | null
    /** Color accent (emerald / red / gold / purple / sky) */
    color?: string
    /** Asset ID — used to show active limit order lines on chart */
    assetId?: string
    /** When true, canvas wrapper fills parent height via flex instead of fixed px */
    fill?: boolean
  }>(),
  {
    label: 'Price',
    height: 340,
    buyPrice: null,
    color: 'emerald',
    assetId: '',
    fill: false
  }
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null
let isDestroyed = false

/** Tracks whether the user has manually zoomed/panned (via wheel/pinch/drag) */
const isUserZoomed = ref(false)

/** Spacing constant: each candle = 1 fake day (86400000ms) */
const DAY_MS = 86_400_000

// ─── Zoom range options (in candles) ─────────────────────────────
const zoomOptions = [
  { label: '30', candles: 30 },
  { label: '60', candles: 60 },
  { label: '120', candles: 120 },
  { label: '250', candles: 250 },
  { label: '500', candles: 500 },
  { label: t('charts.range_all'), candles: 0 }
]
const selectedRange = ref(2) // default: 120 candles

// ─── Stats computed from range-selected window ──────────────────
const rangeStartIdx = computed(() => {
  const count = zoomOptions[selectedRange.value].candles
  if (count === 0 || count >= props.data.length) return 0
  return props.data.length - count
})

const currentPrice = computed(() => {
  return props.data.length > 0 ? props.data[props.data.length - 1].close : 0
})

const priceChange = computed(() => {
  if (props.data.length < 2) return { value: 0, percent: 0 }
  const first = props.data[rangeStartIdx.value].open
  const last = props.data[props.data.length - 1].close
  return {
    value: last - first,
    percent: first > 0 ? ((last - first) / first) * 100 : 0
  }
})

const highPrice = computed(() => {
  const vis = props.data.slice(rangeStartIdx.value)
  if (vis.length === 0) return 0
  return Math.max(...vis.map((c) => c.high))
})

const lowPrice = computed(() => {
  const vis = props.data.slice(rangeStartIdx.value)
  if (vis.length === 0) return 0
  return Math.min(...vis.map((c) => c.low))
})

/** Active limit orders for this asset (for rendering on chart) */
const assetOrders = computed(() =>
  props.assetId ? limitOrderStore.getOrdersForAsset(props.assetId) : []
)

// ─── Colors ──────────────────────────────────────────────────────
const colorMap: Record<string, { up: string; down: string; buy: string }> = {
  gold: { up: THEME.success, down: THEME.danger, buy: THEME.info },
  emerald: { up: THEME.success, down: THEME.danger, buy: THEME.info },
  sky: { up: THEME.info, down: THEME.danger, buy: THEME.warning },
  purple: { up: THEME.purple, down: THEME.danger, buy: THEME.info },
  red: { up: THEME.success, down: THEME.danger, buy: THEME.info }
}

const ORDER_COLORS: Record<string, string> = {
  limit_buy: '#22c55e',
  limit_sell: '#ef4444',
  stop_loss: '#f59e0b',
  take_profit: '#3b82f6'
}

function getColors() {
  return colorMap[props.color || 'emerald'] || colorMap.emerald
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Convert candle index to fake timestamp (evenly spaced 1-day apart) */
function candleTs(idx: number, total: number): number {
  return Date.now() - (total - idx) * DAY_MS
}

/** Calculate y-axis bounds for a slice of candles with padding */
function calcYBounds(candles: CandlestickData[]): { min: number; max: number } {
  if (candles.length === 0) return { min: 0, max: 1 }
  let lo = Infinity
  let hi = -Infinity
  for (const c of candles) {
    if (c.low < lo) lo = c.low
    if (c.high > hi) hi = c.high
  }
  const range = hi - lo || hi * 0.01
  const pad = range * 0.15
  return { min: Math.max(0, lo - pad), max: hi + pad }
}

function formatP(v: number): string {
  const dec = smartDecimals(v, 2)
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

// ─── Crosshair plugin ────────────────────────────────────────────
const crosshairPlugin = {
  id: 'candleCrosshair',
  afterDraw(chart: Chart) {
    const tooltip = chart.tooltip
    if (!tooltip || !tooltip.caretX || !tooltip.caretY) return
    const ctx = chart.ctx
    const { top, bottom, left, right } = chart.chartArea
    const x = tooltip.caretX
    const y = tooltip.caretY

    ctx.save()
    ctx.setLineDash([3, 3])
    ctx.lineWidth = 0.8
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'

    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(left, y)
    ctx.lineTo(right, y)
    ctx.stroke()

    ctx.restore()
  }
}

// ─── Auto-scale Y axis to visible candles after zoom/pan ─────────
function autoScaleY(chart: Chart) {
  const xScale = chart.scales.x
  if (!xScale) return
  const ds = chart.data.datasets[0]
  if (!ds?.data) return

  let lo = Infinity
  let hi = -Infinity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of ds.data as any[]) {
    if (p.x >= xScale.min && p.x <= xScale.max) {
      if (p.l !== undefined) {
        if (p.l < lo) lo = p.l
        if (p.h > hi) hi = p.h
      }
    }
  }
  if (lo === Infinity) return

  const range = hi - lo || hi * 0.01
  const pad = range * 0.15
  const yScale = chart.options.scales?.y
  if (yScale) {
    yScale.min = Math.max(0, lo - pad)
    yScale.max = hi + pad
  }
  safeChartUpdate(chart)
}

// ─── Legend-safe update helper ───────────────────────────────────
/**
 * Sync meta.hidden → dataset.hidden before calling chart.update().
 * Chart.js stores legend toggle state in meta.hidden (set by chart.hide()/show()).
 * If meta is ever recreated (hidden: null), Chart.js falls back to dataset.hidden.
 * By syncing before each update we guarantee visibility survives every code-path.
 */
function safeChartUpdate(chart: Chart, mode = 'none') {
  for (let i = 0; i < chart.data.datasets.length; i++) {
    const meta = chart.getDatasetMeta(i)
    if (typeof meta.hidden === 'boolean') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(chart.data.datasets[i] as any).hidden = meta.hidden
    }
  }
  chart.update(mode as UpdateMode)
}

/**
 * Rebuild chart while preserving legend visibility state.
 * Saves hidden-by-label from the OLD chart, calls createChart(),
 * then restores hidden on the NEW chart (matching datasets by label).
 */
function rebuildChart() {
  const hiddenByLabel = new Map<string, boolean>()
  if (chartInstance) {
    for (let i = 0; i < chartInstance.data.datasets.length; i++) {
      const meta = chartInstance.getDatasetMeta(i)
      if (typeof meta.hidden === 'boolean') {
        hiddenByLabel.set(String(chartInstance.data.datasets[i].label), meta.hidden)
      }
    }
  }
  createChart()
  if (chartInstance && hiddenByLabel.size > 0) {
    for (let i = 0; i < chartInstance.data.datasets.length; i++) {
      const label = String(chartInstance.data.datasets[i].label)
      if (hiddenByLabel.has(label)) {
        const h = hiddenByLabel.get(label)!
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(chartInstance.data.datasets[i] as any).hidden = h
        chartInstance.getDatasetMeta(i).hidden = h
      }
    }
    safeChartUpdate(chartInstance)
  }
}

// ─── Chart creation ──────────────────────────────────────────────
function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

function createChart() {
  if (isDestroyed || !canvasRef.value) return
  destroyChart()

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  const allCandles = props.data
  if (allCandles.length === 0) return

  const colors = getColors()

  // Map ALL candles to Chart.js financial format
  const chartData = allCandles.map((c, i) => ({
    x: candleTs(i, allCandles.length),
    o: c.open,
    h: c.high,
    l: c.low,
    c: c.close
  }))

  // Determine visible x window based on range selection
  const rangeCount = zoomOptions[selectedRange.value].candles
  const startIdx =
    rangeCount > 0 && rangeCount < allCandles.length ? allCandles.length - rangeCount : 0
  const xMin = chartData[startIdx].x
  const xMax = chartData[chartData.length - 1].x + DAY_MS * 0.5

  // Y-axis bounds for the initial visible window
  const visCandles = allCandles.slice(startIdx)
  const yBounds = calcYBounds(visCandles)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datasets: any[] = [
    {
      label: props.label || t('charts.price'),
      data: chartData,
      color: { up: colors.up, down: colors.down, unchanged: THEME.info },
      borderColor: { up: colors.up, down: colors.down, unchanged: THEME.info },
      backgroundColor: {
        up: colors.up + '40',
        down: colors.down + '40',
        unchanged: THEME.info + '40'
      }
    }
  ]

  // Buy price line (spans full data range)
  if (props.buyPrice) {
    datasets.push({
      type: 'line' as const,
      label: t('charts.avg_buy'),
      data: [
        { x: chartData[0].x, y: props.buyPrice },
        { x: chartData[chartData.length - 1].x, y: props.buyPrice }
      ],
      borderColor: colors.buy,
      borderWidth: 1.5,
      borderDash: [6, 4],
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0
    })
  }

  // Limit order target lines
  for (const order of assetOrders.value) {
    const oColor = ORDER_COLORS[order.orderType] || THEME.warning
    const orderLabels: Record<string, string> = {
      limit_buy: t('orders.type_limit_buy'),
      limit_sell: t('orders.type_limit_sell'),
      stop_loss: t('orders.type_stop_loss'),
      take_profit: t('orders.type_take_profit')
    }
    datasets.push({
      type: 'line' as const,
      label: `${orderLabels[order.orderType]} @ ${formatP(order.targetPrice)}`,
      data: [
        { x: chartData[0].x, y: order.targetPrice },
        { x: chartData[chartData.length - 1].x, y: order.targetPrice }
      ],
      borderColor: oColor,
      borderWidth: 1.3,
      borderDash: [5, 3],
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0
    })
  }

  const hasOverlays = !!props.buyPrice || assetOrders.value.length > 0

  const config: ChartConfiguration = {
    type: 'candlestick' as unknown as ChartConfiguration['type'],
    data: { datasets },
    plugins: [crosshairPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: hasOverlays,
          position: 'top',
          align: 'end',
          labels: {
            color: THEME.info,
            font: { size: 10, family: 'Inter, sans-serif' },
            boxWidth: 10,
            padding: 8,
            usePointStyle: true,
            pointStyle: 'line'
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          titleColor: THEME.text,
          bodyColor: THEME.textSecondary,
          borderColor: 'rgba(51, 65, 85, 0.6)',
          borderWidth: 1,
          padding: { x: 12, y: 8 } as unknown as number,
          cornerRadius: 6,
          displayColors: false,
          titleFont: { size: 10, family: 'Inter, sans-serif' },
          bodyFont: {
            size: 11,
            family: '"JetBrains Mono", monospace',
            weight: 600 as unknown as number
          },
          callbacks: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            title: (items: any[]) => {
              if (!items.length) return ''
              return `${t('charts.candle')} #${items[0].dataIndex + 1} / ${allCandles.length}`
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label: (tooltipCtx: any) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const raw = tooltipCtx.raw as any
              if (raw && raw.o !== undefined) {
                return [
                  `O: ${formatP(raw.o)}`,
                  `H: ${formatP(raw.h)}`,
                  `L: ${formatP(raw.l)}`,
                  `C: ${formatP(raw.c)}`
                ] as unknown as string
              }
              // Fallback for line datasets (buy price, order lines)
              const val = tooltipCtx.parsed?.y ?? 0
              const dsLabel = tooltipCtx.dataset.label || ''
              return `${dsLabel}: ${formatP(val)}`
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            afterBody: (items: any[]) => {
              if (!props.buyPrice || !items.length) return ''
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const raw = items[0].raw as any
              const closePrice = raw?.c ?? raw?.y ?? 0
              if (!closePrice) return ''
              const diff = closePrice - props.buyPrice
              const pct = (diff / props.buyPrice) * 100
              const sign = diff >= 0 ? '+' : ''
              return `${t('charts.pl_label')}: ${sign}${formatP(Math.abs(diff))} (${sign}${pct.toFixed(2)}%)`
            }
          }
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x' as const,
            // onPan fires IMMEDIATELY on each drag pixel — no 250ms debounce.
            // This ensures isUserZoomed is true before next data tick.
            onPan: () => { isUserZoomed.value = true },
            onPanComplete: ({ chart }: { chart: Chart }) => autoScaleY(chart)
          },
          zoom: {
            wheel: { enabled: true, speed: 0.05 },
            pinch: { enabled: true },
            mode: 'x' as const,
            // onZoom fires IMMEDIATELY on each wheel/pinch event — no 250ms debounce.
            onZoom: () => { isUserZoomed.value = true },
            onZoomComplete: ({ chart }: { chart: Chart }) => autoScaleY(chart)
          },
          limits: {
            x: {
              min: chartData[0].x - DAY_MS,
              max: chartData[chartData.length - 1].x + DAY_MS,
              minRange: 5 * DAY_MS
            }
          }
        }
      },
      scales: {
        x: {
          type: 'timeseries',
          display: true,
          min: xMin,
          max: xMax,
          grid: {
            display: true,
            color: 'rgba(148, 163, 184, 0.06)',
            lineWidth: 0.5
          },
          ticks: {
            color: THEME.infoHover,
            font: { size: 9, family: '"JetBrains Mono", monospace' },
            maxTicksLimit: 10,
            maxRotation: 0,
            source: 'auto'
          },
          border: { display: false }
        },
        y: {
          display: true,
          position: 'right' as const,
          min: yBounds.min,
          max: yBounds.max,
          grid: {
            color: 'rgba(148, 163, 184, 0.06)',
            lineWidth: 0.5
          },
          ticks: {
            color: THEME.infoHover,
            font: { size: 9, family: '"JetBrains Mono", monospace' },
            callback: (value: string | number) => {
              const n = Number(value)
              const dec = smartDecimals(n, 2)
              return '$' + n.toLocaleString(undefined, { maximumFractionDigits: dec })
            },
            maxTicksLimit: 6
          },
          border: { display: false }
        }
      }
    }
  }

  chartInstance = new Chart(ctx, config as unknown as ChartConfiguration)
}

function resetZoom() {
  if (!chartInstance) return
  isUserZoomed.value = false
  chartInstance.resetZoom()
  // After reset, re-apply y-bounds for the selected range
  nextTick(() => {
    if (chartInstance) autoScaleY(chartInstance)
  })
}

/**
 * Update chart data in-place without destroying/recreating.
 * Preserves zoom/pan state and legend (hidden dataset) state.
 *
 * KEY INSIGHT: the chartjs-plugin-zoom stores zoom state by writing to
 * scale.options.min/max. If we overwrite those values we destroy the plugin's
 * state and the zoom resets. Therefore:
 *   - When user IS zoomed  → update OHLC only, NEVER touch X scale options.
 *   - When user is NOT zoomed → full data sync + rolling window.
 */
function updateChartData() {
  if (isDestroyed || !chartInstance) { rebuildChart(); return }

  const allCandles = props.data
  if (allCandles.length === 0) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ds = chartInstance.data.datasets[0] as any
  const existingData: { x: number; o: number; h: number; l: number; c: number }[] = ds.data

  if (isUserZoomed.value) {
    // ── USER HAS ZOOMED — keep X viewport completely untouched ──
    // Sync OHLC for all existing candles (last one is still forming)
    const prevLen = existingData.length
    for (let i = 0; i < prevLen && i < allCandles.length; i++) {
      existingData[i].o = allCandles[i].open
      existingData[i].h = allCandles[i].high
      existingData[i].l = allCandles[i].low
      existingData[i].c = allCandles[i].close
    }
    // Append new candles with stable timestamps (extend from last existing)
    if (allCandles.length > prevLen) {
      const lastX = prevLen > 0 ? existingData[prevLen - 1].x : Date.now()
      for (let i = prevLen; i < allCandles.length; i++) {
        existingData.push({
          x: lastX + (i - prevLen + 1) * DAY_MS,
          o: allCandles[i].open,
          h: allCandles[i].high,
          l: allCandles[i].low,
          c: allCandles[i].close
        })
      }
    }
    // Extend overlay lines (buy price / limit orders) to cover new candles
    for (let i = 1; i < chartInstance.data.datasets.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const overlay = chartInstance.data.datasets[i] as any
      const pts = overlay.data
      if (Array.isArray(pts) && pts.length === 2 && pts[0]?.y != null) {
        pts[0].x = existingData[0].x
        pts[1].x = existingData[existingData.length - 1].x
      }
    }
    // DO NOT touch scale options — zoom plugin owns them while user is zoomed
    safeChartUpdate(chartInstance)
    return
  }

  // ── NOT ZOOMED — full data sync + rolling window ──
  const chartData = allCandles.map((c, i) => ({
    x: candleTs(i, allCandles.length),
    o: c.open,
    h: c.high,
    l: c.low,
    c: c.close
  }))

  // Replace data array (same dataset object → legend hidden state preserved)
  ds.data = chartData

  // Update overlay line endpoints
  for (let i = 1; i < chartInstance.data.datasets.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overlay = chartInstance.data.datasets[i] as any
    const pts = overlay.data
    if (Array.isArray(pts) && pts.length === 2 && pts[0]?.y != null) {
      overlay.data = [
        { x: chartData[0].x, y: pts[0].y },
        { x: chartData[chartData.length - 1].x, y: pts[0].y }
      ]
    }
  }

  // Update zoom limits
  if (chartInstance.options.plugins?.zoom) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zoomOpts = chartInstance.options.plugins.zoom as any
    if (zoomOpts.limits?.x) {
      zoomOpts.limits.x.min = chartData[0].x - DAY_MS
      zoomOpts.limits.x.max = chartData[chartData.length - 1].x + DAY_MS
    }
  }

  // Apply rolling window (safe — nobody is zoomed, no plugin state to conflict with)
  const rangeCount = zoomOptions[selectedRange.value].candles
  const startIdx = rangeCount > 0 && rangeCount < allCandles.length
    ? allCandles.length - rangeCount : 0
  if (chartInstance.options.scales?.x) {
    ;(chartInstance.options.scales.x as any).min = chartData[startIdx].x
    ;(chartInstance.options.scales.x as any).max = chartData[chartData.length - 1].x + DAY_MS * 0.5
  }

  safeChartUpdate(chartInstance)
  autoScaleY(chartInstance)
}

// Range change: full rebuild (resets zoom to new range - expected behavior)
watch(selectedRange, () => {
  isUserZoomed.value = false
  if (!isDestroyed) rebuildChart()
})

// Config changes (color, buy price, orders): rebuild but preserve zoom via imperative API
watch(
  [() => props.color, () => props.buyPrice, () => assetOrders.value.length],
  () => {
    if (isDestroyed) return
    // Save zoom state from the CURRENT chart before destroying it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ci = chartInstance as any
    let savedX: { min: number; max: number } | null = null
    const wasZoomed = isUserZoomed.value
    if (wasZoomed && ci) {
      try { savedX = ci.getZoomedScaleBounds?.()?.x ?? null } catch { /* ignore */ }
    }
    rebuildChart()
    // Restore zoom on the NEW chart instance via the official zoomScale API
    if (wasZoomed && savedX && chartInstance) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(chartInstance as any).zoomScale?.('x', savedX, 'none')
      isUserZoomed.value = true
      autoScaleY(chartInstance)
    } else {
      isUserZoomed.value = false
    }
  }
)

// Data change (new candle or in-place OHLC update): update in-place to preserve zoom & legend state
watch(
  () => props.data,
  () => {
    if (!isDestroyed) updateChartData()
  }
)

onMounted(() => {
  isDestroyed = false
  nextTick(() => createChart())
})

onBeforeUnmount(() => {
  isDestroyed = true
  destroyChart()
})

defineExpose({ resetZoom })
</script>

<template>
  <div class="chart-container" :class="{ 'is-fill': fill }">
    <!-- Toolbar -->
    <div class="chart-toolbar">
      <div class="toolbar-row toolbar-row--top">
        <div class="range-group">
          <UTooltip v-for="(opt, idx) in zoomOptions" :key="opt.label"
            :text="opt.candles > 0 ? $t('charts.tip_range', { n: opt.candles }) : $t('charts.tip_range_all')"
            placement="bottom">
            <UButton
              variant="text"
              size="xs"
              :active="selectedRange === idx"
              @click="selectedRange = idx"
            >
              {{ opt.label }}
            </UButton>
          </UTooltip>
        </div>
        <UTooltip :text="$t('charts.tip_reset_zoom')" placement="bottom">
          <UButton variant="icon" @click="resetZoom" :title="$t('charts.reset_zoom')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </UButton>
        </UTooltip>
      </div>
      <div class="toolbar-row toolbar-row--bottom">
        <UTooltip :text="$t('charts.tip_price_live')" placement="bottom">
          <div class="live-price" :class="priceChange.value >= 0 ? 'is-up' : 'is-down'">
            <span class="live-price-value">{{ formatP(currentPrice) }}</span>
            <span class="live-price-change">
              {{ priceChange.value >= 0 ? '+' : '' }}{{ formatP(Math.abs(priceChange.value)) }}
            </span>
            <span class="live-price-pct">
              ({{ priceChange.percent >= 0 ? '+' : '' }}{{ priceChange.percent.toFixed(2) }}%)
            </span>
          </div>
        </UTooltip>
        <div class="hl-badges">
          <UTooltip :text="$t('charts.tip_high')" placement="bottom">
            <span class="hl-badge hl-badge--high">
              <span class="hl-label">{{ $t('charts.high') }}</span>
              <span class="hl-val">{{ formatP(highPrice) }}</span>
            </span>
          </UTooltip>
          <UTooltip :text="$t('charts.tip_low')" placement="bottom">
            <span class="hl-badge hl-badge--low">
              <span class="hl-label">{{ $t('charts.low') }}</span>
              <span class="hl-val">{{ formatP(lowPrice) }}</span>
            </span>
          </UTooltip>
        </div>
      </div>
    </div>

    <!-- Candle count info -->
    <div v-if="data.length === 0" class="no-data">
      {{ $t('charts.no_candles') }}
    </div>

    <!-- Canvas -->
    <div v-else class="chart-canvas-wrap" :class="{ 'canvas-fill': fill }" :style="fill ? undefined : { height: height + 'px' }">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--t-bg-muted);
  border: 1px solid var(--t-border);
  border-radius: var(--t-radius-md, 12px);
  overflow: hidden;
}

/* ─── Toolbar ─── */
.chart-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--t-border);
  border-radius: var(--t-radius-md, 12px) var(--t-radius-md, 12px) 0 0;
  background: var(--t-bg-card);
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  white-space: nowrap;
}

.toolbar-row--top {
  gap: 0.5rem;
}

.toolbar-row--bottom {
  gap: 0.75rem;
}

.range-group {
  display: flex;
  gap: 1px;
  background: var(--t-bg-muted);
  border-radius: var(--t-radius-lg);
  overflow: hidden;
}

/* Live price display */
.live-price {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  font-family: var(--t-font-mono);
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
}

.live-price-value {
  font-size: 0.9rem;
  font-weight: var(--t-font-bold);
  color: var(--t-text);
  flex-shrink: 0;
}

.live-price-change {
  font-size: 0.68rem;
  font-weight: var(--t-font-semibold);
  flex-shrink: 0;
}

.live-price-pct {
  font-size: 0.64rem;
  flex-shrink: 0;
}

.live-price.is-up .live-price-change,
.live-price.is-up .live-price-pct {
  color: var(--t-success);
}

.live-price.is-down .live-price-change,
.live-price.is-down .live-price-pct {
  color: var(--t-danger);
}

/* High/Low badges */
.hl-badges {
  display: flex;
  gap: 0.6rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.hl-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--t-font-mono);
  font-size: 0.6rem;
  white-space: nowrap;
}

.hl-label {
  font-weight: var(--t-font-bold);
  color: var(--t-text-muted);
}

.hl-val {
  font-weight: var(--t-font-semibold);
}

.hl-badge--high .hl-val {
  color: var(--t-success);
}

.hl-badge--low .hl-val {
  color: var(--t-danger);
}

/* ─── Canvas ─── */
.chart-canvas-wrap {
  width: 100%;
  position: relative;
  padding: 0.5rem 0.5rem 0.25rem;
  box-sizing: border-box;
}

.canvas-fill {
  flex: 1;
  min-height: 200px;
}

.chart-container.is-fill {
  flex: 1;
  min-height: 0;
}

/* No data message */
.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--t-text-muted);
  font-size: 0.82rem;
  font-style: italic;
}
</style>
