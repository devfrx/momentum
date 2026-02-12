<script setup lang="ts">
/**
 * PlinkoBoard — Canvas-based rendering of the Plinko peg board.
 *
 * Renders pegs, balls with trails, bucket zones with multiplier labels,
 * and animates ball physics via requestAnimationFrame.
 */
import { ref, onMounted, onUnmounted, watch, toRefs, computed } from 'vue'
import { PlinkoEngine, type PlinkoBall, type PlinkoRisk } from '@renderer/core/PlinkoEngine'

const props = withDefaults(defineProps<{
    rows: number
    risk: PlinkoRisk
    width: number
    height: number
    /** Physics steps per animation frame (1 = normal, 2 = fast, 4 = turbo). Does NOT change trajectory. */
    speed?: number
}>(), { speed: 1 })

const emit = defineEmits<{
    ballLanded: [bucketIndex: number, multiplier: number, ballId: number]
}>()

const { rows, risk, width, height } = toRefs(props)
const stepsPerFrame = computed(() => Math.max(1, Math.min(props.speed ?? 1, 8)))
const skipFrames = computed(() => (props.speed ?? 1) < 1 ? Math.round(1 / (props.speed ?? 1)) : 0)
let frameCounter = 0

const canvasRef = ref<HTMLCanvasElement | null>(null)
let engine: PlinkoEngine
let balls: PlinkoBall[] = []
let animId: number | null = null
let lastHitBucket: number | null = null
let hitFlash = 0

// ─── Engine management ──────────────────────────────────────

function rebuildEngine(): void {
    if (engine) engine.destroy()
    engine = new PlinkoEngine({
        rows: rows.value,
        risk: risk.value,
        boardWidth: width.value,
        boardHeight: height.value,
    })
    balls = []
}

watch([rows, risk, width, height], () => {
    rebuildEngine()
})

// ─── Public API (called from parent) ────────────────────────

function dropBall(): void {
    if (!engine) return
    const ball = engine.createBall()
    balls.push(ball)
}

defineExpose({ dropBall })

// ─── Animation loop ─────────────────────────────────────────

function tick(): void {
    if (!engine) return

    // For sub-1 speeds, skip physics on some frames (slow motion)
    const skip = skipFrames.value
    const shouldStep = skip === 0 || (++frameCounter % (skip + 1) === 0)

    if (shouldStep) {
        const steps = stepsPerFrame.value
        for (let s = 0; s < steps; s++) {
            // Advance the Matter.js world once
            engine.tick()

            // Sync every ball from its physics body
            for (const ball of balls) {
                if (!ball.active) continue
                engine.step(ball)

                // Ball just landed
                if (!ball.active && ball.landedBucket !== null) {
                    const mult = engine.getMultiplier(ball.landedBucket)
                    lastHitBucket = ball.landedBucket
                    hitFlash = 15
                    emit('ballLanded', ball.landedBucket, mult, ball.id)
                }
            }
        }
    }

    // Decay flash
    if (hitFlash > 0) hitFlash--
    if (hitFlash === 0) lastHitBucket = null

    // Garbage-collect old landed balls (keep last 3 for visual)
    const landed = balls.filter((b) => !b.active)
    if (landed.length > 3) {
        const removeCount = landed.length - 3
        for (let i = 0; i < removeCount; i++) {
            const idx = balls.indexOf(landed[i])
            if (idx !== -1) balls.splice(idx, 1)
        }
    }

    draw()
    animId = requestAnimationFrame(tick)
}

// ─── Drawing ────────────────────────────────────────────────

function draw(): void {
    const canvas = canvasRef.value
    if (!canvas || !engine) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = width.value
    const h = height.value
    canvas.width = w * window.devicePixelRatio
    canvas.height = h * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    ctx.clearRect(0, 0, w, h)

    drawBuckets(ctx)
    drawPegs(ctx)
    drawBalls(ctx)
}

function drawPegs(ctx: CanvasRenderingContext2D): void {
    for (const peg of engine.pegs) {
        ctx.beginPath()
        ctx.arc(peg.x, peg.y, engine.pegRadius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)'
        ctx.fill()

        // Subtle highlight
        ctx.beginPath()
        ctx.arc(peg.x - 1, peg.y - 1, engine.pegRadius * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.fill()
    }
}

function drawBuckets(ctx: CanvasRenderingContext2D): void {
    const bw = engine.bucketWidth
    const by = engine.bucketY
    const bh = height.value - by

    for (const bucket of engine.buckets) {
        const bx = engine.sidePadding + bucket.index * bw

        // Bucket background
        const isHit = lastHitBucket === bucket.index && hitFlash > 0
        const alpha = isHit ? 0.5 + (hitFlash / 15) * 0.3 : 0.25
        ctx.fillStyle = hexToRgba(bucket.color, alpha)
        ctx.fillRect(bx + 1, by, bw - 2, bh)

        // Border between buckets
        ctx.strokeStyle = hexToRgba(bucket.color, 0.4)
        ctx.lineWidth = 1
        ctx.strokeRect(bx + 1, by, bw - 2, bh)

        // Multiplier label
        ctx.fillStyle = bucket.color
        ctx.font = `bold ${bw < 35 ? 9 : 11}px system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = bucket.multiplier >= 1
            ? `${bucket.multiplier}x`
            : `${bucket.multiplier}x`
        ctx.fillText(label, bx + bw / 2, by + bh / 2)
    }
}

function drawBalls(ctx: CanvasRenderingContext2D): void {
    for (const ball of balls) {
        // Draw trail
        if (ball.trail.length > 1) {
            ctx.beginPath()
            ctx.moveTo(ball.trail[0].x, ball.trail[0].y)
            for (let i = 1; i < ball.trail.length; i++) {
                ctx.lineTo(ball.trail[i].x, ball.trail[i].y)
            }
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'
            ctx.lineWidth = ball.radius * 0.8
            ctx.lineCap = 'round'
            ctx.stroke()
        }

        // Draw ball
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)

        // Glowing ball gradient
        const grad = ctx.createRadialGradient(
            ball.x - 1, ball.y - 1, 0,
            ball.x, ball.y, ball.radius
        )
        grad.addColorStop(0, '#fcd34d')
        grad.addColorStop(0.6, '#f59e0b')
        grad.addColorStop(1, '#d97706')
        ctx.fillStyle = grad
        ctx.fill()

        // Ball highlight
        ctx.beginPath()
        ctx.arc(ball.x - 1.5, ball.y - 1.5, ball.radius * 0.35, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.fill()

        // Land indicator for settled balls
        if (!ball.active && ball.landedBucket !== null) {
            const bucket = engine.buckets[ball.landedBucket]
            ctx.beginPath()
            ctx.arc(ball.x, ball.y, ball.radius + 3, 0, Math.PI * 2)
            ctx.strokeStyle = bucket.color
            ctx.lineWidth = 2
            ctx.stroke()
        }
    }
}

// ─── Helpers ────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ─── Lifecycle ──────────────────────────────────────────────

onMounted(() => {
    rebuildEngine()
    animId = requestAnimationFrame(tick)
})

onUnmounted(() => {
    if (animId !== null) cancelAnimationFrame(animId)
    if (engine) engine.destroy()
})
</script>

<template>
    <div class="plinko-board-wrap">
        <canvas ref="canvasRef" class="plinko-canvas" :style="{ width: width + 'px', height: height + 'px' }" />
    </div>
</template>

<style scoped>
.plinko-board-wrap {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

.plinko-canvas {
    border-radius: var(--t-radius-lg);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    display: block;
}
</style>
