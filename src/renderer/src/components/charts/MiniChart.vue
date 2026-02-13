<script setup lang="ts">
/**
 * MiniChart — Lightweight sparkline for asset cards.
 * Pure canvas drawing, no Chart.js. Zero layout side-effects.
 */
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{
    data: number[]
    color?: string
    height?: number
    buyPrice?: number | null
}>(), {
    color: 'emerald',
    height: 70,
    buyPrice: null
})

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0

const palette: Record<string, { line: string; fill: string; buy: string }> = {
    gold: { line: '#f59e0b', fill: 'rgba(245,158,11,0.15)', buy: '#71717a' },
    emerald: { line: '#10b981', fill: 'rgba(16,185,129,0.15)', buy: '#71717a' },
    sky: { line: '#64748b', fill: 'rgba(100,116,139,0.15)', buy: '#f59e0b' },
    purple: { line: '#a855f7', fill: 'rgba(168,85,247,0.15)', buy: '#71717a' },
    red: { line: '#ef4444', fill: 'rgba(239,68,68,0.15)', buy: '#71717a' }
}

/** Downsample an array to at most `maxPts` using LTTB algorithm */
function downsample(data: number[], maxPts: number): number[] {
    if (data.length <= maxPts) return data

    const out: number[] = [data[0]]
    const bucketSize = (data.length - 2) / (maxPts - 2)

    let prevIndex = 0
    for (let i = 1; i < maxPts - 1; i++) {
        const avgStart = Math.floor((i) * bucketSize) + 1
        const avgEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, data.length)

        let avgX = 0, avgY = 0, count = 0
        for (let j = avgStart; j < avgEnd; j++) {
            avgX += j; avgY += data[j]; count++
        }
        avgX /= count; avgY /= count

        const rangeStart = Math.floor((i - 1) * bucketSize) + 1
        const rangeEnd = Math.floor((i) * bucketSize) + 1

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

function draw() {
    const canvas = canvasRef.value
    const wrap = wrapRef.value
    if (!canvas || !wrap) return

    const dpr = window.devicePixelRatio || 1
    const w = wrap.clientWidth
    const h = props.height

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const d = downsample(props.data, 300)
    if (d.length < 2) return

    const colors = palette[props.color] || palette.emerald
    const pad = 2
    const minP = Math.min(...d)
    const maxP = Math.max(...d)
    const range = maxP - minP || maxP * 0.01

    function x(i: number) { return pad + ((w - pad * 2) / (d.length - 1)) * i }
    function y(v: number) { return pad + (1 - (v - minP) / range) * (h - pad * 2) }

    // Buy price line
    if (props.buyPrice != null && props.buyPrice >= minP && props.buyPrice <= maxP) {
        const by = y(props.buyPrice)
        ctx.save()
        ctx.setLineDash([4, 3])
        ctx.strokeStyle = colors.buy
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.6
        ctx.beginPath()
        ctx.moveTo(0, by)
        ctx.lineTo(w, by)
        ctx.stroke()
        ctx.restore()
    }

    // Build path
    ctx.beginPath()
    ctx.moveTo(x(0), y(d[0]))
    for (let i = 1; i < d.length; i++) {
        // Smooth curve using quadratic bezier
        const px = x(i - 1), py = y(d[i - 1])
        const cx = x(i), cy = y(d[i])
        const mx = (px + cx) / 2
        ctx.quadraticCurveTo(px, py, mx, (py + cy) / 2)
    }
    ctx.lineTo(x(d.length - 1), y(d[d.length - 1]))

    // Stroke line
    ctx.strokeStyle = colors.line
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Fill area
    ctx.lineTo(x(d.length - 1), h)
    ctx.lineTo(x(0), h)
    ctx.closePath()

    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, colors.fill)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fill()
}

function scheduleDraw() {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(draw)
}

let ro: ResizeObserver | null = null

onMounted(() => {
    nextTick(draw)
    if (wrapRef.value) {
        ro = new ResizeObserver(scheduleDraw)
        ro.observe(wrapRef.value)
    }
})

onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    ro?.disconnect()
})

watch([() => props.data, () => props.color, () => props.buyPrice], scheduleDraw, { deep: true })
</script>

<template>
    <div ref="wrapRef" class="mini-chart" :style="{ height: height + 'px' }">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<style scoped>
.mini-chart {
    width: 100%;
    flex-shrink: 0;
    line-height: 0;
}

.mini-chart canvas {
    display: block;
}
</style>
