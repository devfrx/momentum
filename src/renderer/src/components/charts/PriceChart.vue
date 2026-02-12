<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart, registerables } from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import { smartDecimals } from '@renderer/composables/useFormat'

Chart.register(...registerables, zoomPlugin)

const { t } = useI18n()

const props = withDefaults(defineProps<{
    data: number[]
    label?: string
    color?: string
    height?: number
    /** Average buy price line */
    buyPrice?: number | null
}>(), {
    label: 'Price',
    color: 'gold',
    height: 340,
    buyPrice: null
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null
let isDestroyed = false

const zoomOptions = [
    { label: '1m', points: 20 },
    { label: '5m', points: 60 },
    { label: '15m', points: 150 },
    { label: '1h', points: 360 },
    { label: 'All', points: 0 }
]
const selectedRange = ref(2)

const visibleData = computed(() => {
    const pts = zoomOptions[selectedRange.value].points
    if (pts === 0 || pts >= props.data.length) return props.data
    return props.data.slice(-pts)
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
    gold: { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.08)', buy: '#71717a' },
    emerald: { line: '#10b981', fill: 'rgba(16, 185, 129, 0.08)', buy: '#71717a' },
    sky: { line: '#64748b', fill: 'rgba(100, 116, 139, 0.08)', buy: '#f59e0b' },
    purple: { line: '#a855f7', fill: 'rgba(168, 85, 247, 0.08)', buy: '#71717a' },
    red: { line: '#ef4444', fill: 'rgba(239, 68, 68, 0.08)', buy: '#71717a' }
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
        pointHoverBorderColor: '#1e293b',
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
                        color: '#64748b',
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
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
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
                    pan: { enabled: true, mode: 'x' as const },
                    zoom: {
                        wheel: { enabled: true, speed: 0.05 },
                        pinch: { enabled: true },
                        mode: 'x' as const
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
                        color: '#475569',
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
                        color: '#475569',
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
    if (!chartInstance) { createChart(); return }

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

    chartInstance.update('none')
}

function resetZoom() {
    chartInstance?.resetZoom()
}

watch([() => props.data, () => props.color, () => props.buyPrice, selectedRange], updateChart, { deep: true })

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
    <div class="chart-container">
        <!-- Toolbar -->
        <div class="chart-toolbar">
            <div class="toolbar-left">
                <div class="range-group">
                    <button v-for="(opt, idx) in zoomOptions" :key="opt.label"
                        :class="['range-btn', { active: selectedRange === idx }]" @click="selectedRange = idx">
                        {{ opt.label }}
                    </button>
                </div>
            </div>

            <div class="toolbar-center">
                <div class="live-price" :class="priceChange.value >= 0 ? 'is-up' : 'is-down'">
                    <span class="live-price-value">{{ formatPrice(currentPrice) }}</span>
                    <span class="live-price-change">
                        {{ priceChange.value >= 0 ? '+' : '' }}{{ formatPrice(Math.abs(priceChange.value)) }}
                    </span>
                    <span class="live-price-pct">
                        ({{ priceChange.percent >= 0 ? '+' : '' }}{{ priceChange.percent.toFixed(2) }}%)
                    </span>
                </div>
            </div>

            <div class="toolbar-right">
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
                <button class="reset-btn" @click="resetZoom" :title="$t('charts.reset_zoom')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <path d="M1 4v6h6M23 20v-6h-6" />
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Canvas -->
        <div class="chart-canvas-wrap" :style="{ height: height + 'px' }">
            <canvas ref="canvasRef"></canvas>
        </div>
    </div>
</template>

<style scoped>
.chart-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    background: var(--t-bg-muted, #18181b);
    border: 1px solid var(--t-border, #27272a);
    border-radius: var(--t-radius-md, 12px);
    overflow: visible;
}

/* ─── Toolbar ─── */
.chart-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--t-border, #27272a);
    background: var(--t-bg-card, #18181b);
    flex-wrap: wrap;
    min-height: 36px;
}

.toolbar-left,
.toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
    white-space: nowrap;
}

.toolbar-center {
    display: flex;
    align-items: center;
    flex-shrink: 1;
    min-width: 0;
}

.range-group {
    display: flex;
    gap: 1px;
    background: var(--t-border, #27272a);
    border-radius: var(--t-radius-lg);
    overflow: hidden;
}

.range-btn {
    padding: 0.2rem 0.45rem;
    font-size: 0.62rem;
    font-weight: 600;
    font-family: var(--t-font-mono, monospace);
    letter-spacing: 0.02em;
    cursor: pointer;
    background: var(--t-bg-card, #1e1e22);
    color: var(--t-text-muted, #71717a);
    border: none;
    transition: all 0.1s;
    white-space: nowrap;
    flex-shrink: 0;
}

.range-btn:hover {
    color: var(--t-text-secondary, #a1a1aa);
    background: var(--t-bg-muted, #27272a);
}

.range-btn.active {
    color: var(--t-text, #fafafa);
    background: var(--t-bg-muted, #27272a);
}

/* Live price display */
.live-price {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    font-family: var(--t-font-mono, monospace);
    white-space: nowrap;
    flex-shrink: 1;
    min-width: 0;
    overflow: hidden;
}

.live-price-value {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--t-text, #fafafa);
    flex-shrink: 0;
}

.live-price-change {
    font-size: 0.68rem;
    font-weight: 600;
    flex-shrink: 0;
}

.live-price-pct {
    font-size: 0.64rem;
    opacity: 0.8;
    flex-shrink: 0;
}

.live-price.is-up .live-price-change,
.live-price.is-up .live-price-pct {
    color: var(--t-success, #22c55e);
}

.live-price.is-down .live-price-change,
.live-price.is-down .live-price-pct {
    color: var(--t-danger, #ef4444);
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
    font-family: var(--t-font-mono, monospace);
    font-size: 0.6rem;
    white-space: nowrap;
}

.hl-label {
    font-weight: 700;
    opacity: 0.5;
}

.hl-val {
    font-weight: 600;
}

.hl-badge--high .hl-val {
    color: var(--t-success, #22c55e);
}

.hl-badge--low .hl-val {
    color: var(--t-danger, #ef4444);
}

.reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--t-border, #27272a);
    border-radius: var(--t-radius-md);
    background: transparent;
    color: var(--t-text-muted, #71717a);
    cursor: pointer;
    transition: all 0.1s;
}

.reset-btn:hover {
    color: var(--t-text, #fafafa);
    background: var(--t-bg-muted, #27272a);
    border-color: var(--t-border-hover, #3f3f46);
}

/* ─── Canvas ─── */
.chart-canvas-wrap {
    width: 100%;
    position: relative;
    padding: 0.5rem 0.5rem 0.25rem;
    box-sizing: border-box;
}
</style>
