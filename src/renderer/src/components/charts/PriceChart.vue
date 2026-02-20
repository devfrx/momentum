<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart, registerables, type UpdateMode } from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import { smartDecimals } from '@renderer/composables/useFormat'
import { UButton } from '@renderer/components/ui'
import { THEME } from '@renderer/assets/theme/colors'

Chart.register(...registerables, zoomPlugin)

const { t } = useI18n()

const props = withDefaults(defineProps<{
    data: number[]
    label?: string
    color?: string
    height?: number
    /** Average buy price line */
    buyPrice?: number | null
    /** When true, canvas wrapper fills parent height via flex instead of fixed px */
    fill?: boolean
}>(), {
    label: 'Price',
    color: 'gold',
    height: 340,
    buyPrice: null,
    fill: false
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null
let isDestroyed = false

/** Tracks whether the user has manually zoomed/panned (via wheel/pinch/drag) */
const isUserZoomed = ref(false)

const zoomOptions = [
    { label: '1m', points: 20 },
    { label: '5m', points: 60 },
    { label: '15m', points: 150 },
    { label: '1h', points: 720 },
    { label: '6h', points: 4320 },
    { label: '1d', points: 17280 },
    { label: 'All', points: 0 }
]
const selectedRange = ref(3)

/** Maximum data points to render in Chart.js for performance */
const MAX_CHART_POINTS = 800

/** Downsample array to at most maxPts entries using LTTB */
function lttb(data: number[], maxPts: number): number[] {
    if (data.length <= maxPts) return data
    const out: number[] = [data[0]]
    const bucketSize = (data.length - 2) / (maxPts - 2)
    let prevIndex = 0
    for (let i = 1; i < maxPts - 1; i++) {
        const avgStart = Math.floor(i * bucketSize) + 1
        const avgEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, data.length)
        let avgX = 0, avgY = 0, count = 0
        for (let j = avgStart; j < avgEnd; j++) { avgX += j; avgY += data[j]; count++ }
        avgX /= count; avgY /= count
        const rangeStart = Math.floor((i - 1) * bucketSize) + 1
        const rangeEnd = Math.floor(i * bucketSize) + 1
        let maxArea = -1, bestIdx = rangeStart
        for (let j = rangeStart; j < rangeEnd; j++) {
            const area = Math.abs((prevIndex - avgX) * (data[j] - data[prevIndex]) - (prevIndex - j) * (avgY - data[prevIndex]))
            if (area > maxArea) { maxArea = area; bestIdx = j }
        }
        out.push(data[bestIdx])
        prevIndex = bestIdx
    }
    out.push(data[data.length - 1])
    return out
}

const visibleData = computed(() => {
    const pts = zoomOptions[selectedRange.value].points
    const raw = (pts === 0 || pts >= props.data.length) ? props.data : props.data.slice(-pts)
    return lttb(raw, MAX_CHART_POINTS)
})

const priceChange = computed(() => {
    const d = visibleData.value
    if (d.length < 2) return { value: 0, percent: 0 }
    const first = d[0]
    const last = d[d.length - 1]
    return {
        value: last - first,
        percent: first > 0 ? ((last - first) / first) * 100 : 0
    }
})

const currentPrice = computed(() => {
    const d = props.data
    return d.length > 0 ? d[d.length - 1] : 0
})

const highPrice = computed(() => Math.max(...visibleData.value))
const lowPrice = computed(() => Math.min(...visibleData.value))

const colorMap: Record<string, { line: string; fill: string; buy: string }> = {
    gold: { line: THEME.warning, fill: 'rgba(245, 158, 11, 0.08)', buy: THEME.info },
    emerald: { line: THEME.success, fill: 'rgba(16, 185, 129, 0.08)', buy: THEME.info },
    sky: { line: THEME.info, fill: 'rgba(100, 116, 139, 0.08)', buy: THEME.warning },
    purple: { line: THEME.purple, fill: 'rgba(168, 85, 247, 0.08)', buy: THEME.info },
    red: { line: THEME.danger, fill: 'rgba(239, 68, 68, 0.08)', buy: THEME.info }
}

function getColors() {
    return colorMap[props.color || 'gold'] || colorMap.gold
}

/* ─── Crosshair plugin (local, interactive only) ─── */
const crosshairPlugin = {
    id: 'crosshair',
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

function destroyChart() {
    if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
    }
}

// ─── Legend-safe update helpers ──────────────────────────────────
/**
 * Sync meta.hidden → dataset.hidden before calling chart.update().
 * Guarantees legend toggle state survives every update code-path.
 */
function safeChartUpdate(chart: Chart, mode = 'none') {
    for (let i = 0; i < chart.data.datasets.length; i++) {
        const meta = chart.getDatasetMeta(i)
        if (typeof meta.hidden === 'boolean') {
            ; (chart.data.datasets[i] as any).hidden = meta.hidden
        }
    }
    chart.update(mode as UpdateMode)
}

/**
 * Rebuild chart while preserving legend visibility state.
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
                    ; (chartInstance.data.datasets[i] as any).hidden = h
                chartInstance.getDatasetMeta(i).hidden = h
            }
        }
        safeChartUpdate(chartInstance)
    }
}

function createChart() {
    if (isDestroyed || !canvasRef.value) return
    destroyChart()

    const ctx = canvasRef.value.getContext('2d')
    if (!ctx) return

    const colors = getColors()
    const chartData = visibleData.value
    const labels = chartData.map((_, i) => {
        const totalPts = chartData.length
        const step = Math.max(1, Math.floor(totalPts / 10))
        return i % step === 0 ? `T-${totalPts - i}` : ''
    })

    const minPrice = Math.min(...chartData)
    const maxPrice = Math.max(...chartData)
    const range = maxPrice - minPrice || maxPrice * 0.01
    const yPadding = range * 0.12

    const gradient = ctx.createLinearGradient(0, 0, 0, canvasRef.value.height)
    gradient.addColorStop(0, colors.fill.replace('0.08', '0.20'))
    gradient.addColorStop(0.7, colors.fill.replace('0.08', '0.05'))
    gradient.addColorStop(1, 'transparent')

    const datasets: any[] = [{
        label: props.label || t('charts.price'),
        data: chartData,
        borderColor: colors.line,
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: colors.line,
        pointHoverBorderColor: THEME.rouletteBlack,
        pointHoverBorderWidth: 2
    }]

    if (props.buyPrice) {
        datasets.push({
            label: t('charts.avg_buy'),
            data: chartData.map(() => props.buyPrice),
            borderColor: colors.buy,
            borderWidth: 1.5,
            borderDash: [6, 4],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0
        })
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        plugins: [crosshairPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: {
                    display: !!props.buyPrice,
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
                    padding: { x: 12, y: 8 } as any,
                    cornerRadius: 6,
                    displayColors: false,
                    titleFont: { size: 10, family: 'Inter, sans-serif' },
                    bodyFont: { size: 12, family: '"JetBrains Mono", monospace', weight: 600 as any },
                    callbacks: {
                        title: (items) => {
                            if (!items.length) return ''
                            return `#${items[0].dataIndex + 1} of ${chartData.length}`
                        },
                        label: (tooltipCtx) => {
                            const val = tooltipCtx.parsed.y ?? 0
                            const dec = smartDecimals(val, 2)
                            const prefix = tooltipCtx.datasetIndex === 0 ? '' : `${t('charts.avg_buy')}: `
                            return `${prefix}$${val.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}`
                        },
                        afterBody: (items) => {
                            if (!props.buyPrice || !items.length) return ''
                            const curPrice = items[0].parsed.y
                            if (curPrice == null) return ''
                            const diff = curPrice - props.buyPrice
                            const pct = (diff / props.buyPrice) * 100
                            const sign = diff >= 0 ? '+' : ''
                            const dec = smartDecimals(Math.abs(diff), 2)
                            return `${t('charts.pl_label')}: ${sign}$${Math.abs(diff).toFixed(dec)} (${sign}${pct.toFixed(2)}%)`
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x' as const,
                        // onPan fires IMMEDIATELY — no 250ms debounce
                        onPan: () => { isUserZoomed.value = true }
                    },
                    zoom: {
                        wheel: { enabled: true, speed: 0.05 },
                        pinch: { enabled: true },
                        mode: 'x' as const,
                        // onZoom fires IMMEDIATELY — no 250ms debounce
                        onZoom: () => { isUserZoomed.value = true }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: true,
                        color: 'rgba(148, 163, 184, 0.06)',
                        lineWidth: 0.5
                    },
                    ticks: {
                        color: THEME.infoHover,
                        font: { size: 9, family: '"JetBrains Mono", monospace' },
                        maxTicksLimit: 10,
                        maxRotation: 0
                    },
                    border: { display: false }
                },
                y: {
                    display: true,
                    position: 'right' as const,
                    min: Math.max(0, minPrice - yPadding),
                    max: maxPrice + yPadding,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.06)',
                        lineWidth: 0.5
                    },
                    ticks: {
                        color: THEME.infoHover,
                        font: { size: 9, family: '"JetBrains Mono", monospace' },
                        callback: (value) => {
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
    })
}

function updateChart() {
    if (isDestroyed) return
    if (!chartInstance) { rebuildChart(); return }

    // When user has zoomed/panned: skip chart update entirely.
    // The chartjs-plugin-zoom owns scale.options.min/max — touching them
    // destroys the zoom state. Stats (price, change%, high, low) still
    // update via computed props in the template.
    if (isUserZoomed.value) return

    const colors = getColors()
    const chartData = visibleData.value
    chartInstance.data.labels = chartData.map((_, i) => {
        const totalPts = chartData.length
        const step = Math.max(1, Math.floor(totalPts / 10))
        return i % step === 0 ? `T-${totalPts - i}` : ''
    })
    chartInstance.data.datasets[0].data = chartData
    chartInstance.data.datasets[0].borderColor = colors.line

    const ctx = canvasRef.value?.getContext('2d')
    if (ctx && canvasRef.value) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasRef.value.height)
        gradient.addColorStop(0, colors.fill.replace('0.08', '0.20'))
        gradient.addColorStop(0.7, colors.fill.replace('0.08', '0.05'))
        gradient.addColorStop(1, 'transparent')
        chartInstance.data.datasets[0].backgroundColor = gradient
    }

    if (props.buyPrice && chartInstance.data.datasets[1]) {
        chartInstance.data.datasets[1].data = chartData.map(() => props.buyPrice)
    }

    const minPrice = Math.min(...chartData)
    const maxPrice = Math.max(...chartData)
    const range = maxPrice - minPrice || maxPrice * 0.01
    const yPadding = range * 0.12
    if (chartInstance.options.scales?.y) {
        (chartInstance.options.scales.y as any).min = Math.max(0, minPrice - yPadding)
            ; (chartInstance.options.scales.y as any).max = maxPrice + yPadding
    }

    safeChartUpdate(chartInstance)
}

function resetZoom() {
    isUserZoomed.value = false
    chartInstance?.resetZoom()
}

// Range change: full rebuild (resets zoom)
watch(selectedRange, () => {
    isUserZoomed.value = false
    if (!isDestroyed) rebuildChart()
})

// Config changes (color, buyPrice): rebuild but preserve zoom via imperative API
watch([() => props.color, () => props.buyPrice], () => {
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
    // Restore zoom on the NEW chart via official zoomScale API
    if (wasZoomed && savedX && chartInstance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ; (chartInstance as any).zoomScale?.('x', savedX, 'none')
        isUserZoomed.value = true
    } else {
        isUserZoomed.value = false
    }
})

// Data change: in-place update (skips when zoomed)
watch(() => props.data, () => {
    if (!isDestroyed) updateChart()
})

onMounted(() => {
    isDestroyed = false
    nextTick(() => createChart())
})

onBeforeUnmount(() => {
    isDestroyed = true
    destroyChart()
})

defineExpose({ resetZoom })

function formatPrice(v: number): string {
    const dec = smartDecimals(v, 2)
    return '$' + v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
</script>

<template>
    <div class="chart-container" :class="{ 'is-fill': fill }">
        <!-- Toolbar -->
        <div class="chart-toolbar">
            <div class="toolbar-row toolbar-row--top">
                <div class="range-group">
                    <UButton variant="text" size="xs" v-for="(opt, idx) in zoomOptions" :key="opt.label"
                        :active="selectedRange === idx" @click="selectedRange = idx">
                        {{ opt.label }}
                    </UButton>
                </div>
                <UButton variant="icon" @click="resetZoom" :title="$t('charts.reset_zoom')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <path d="M1 4v6h6M23 20v-6h-6" />
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                    </svg>
                </UButton>
            </div>
            <div class="toolbar-row toolbar-row--bottom">
                <div class="live-price" :class="priceChange.value >= 0 ? 'is-up' : 'is-down'">
                    <span class="live-price-value">{{ formatPrice(currentPrice) }}</span>
                    <span class="live-price-change">
                        {{ priceChange.value >= 0 ? '+' : '' }}{{ formatPrice(Math.abs(priceChange.value)) }}
                    </span>
                    <span class="live-price-pct">
                        ({{ priceChange.percent >= 0 ? '+' : '' }}{{ priceChange.percent.toFixed(2) }}%)
                    </span>
                </div>
                <div class="hl-badges">
                    <span class="hl-badge hl-badge--high">
                        <span class="hl-label">{{ $t('charts.high') }}</span>
                        <span class="hl-val">{{ formatPrice(highPrice) }}</span>
                    </span>
                    <span class="hl-badge hl-badge--low">
                        <span class="hl-label">{{ $t('charts.low') }}</span>
                        <span class="hl-val">{{ formatPrice(lowPrice) }}</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- Canvas -->
        <div class="chart-canvas-wrap" :class="{ 'canvas-fill': fill }"
            :style="fill ? undefined : { height: height + 'px' }">
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
    overflow: visible;
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
</style>
