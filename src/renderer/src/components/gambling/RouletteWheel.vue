<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
    /** The winning number (0-36), null = idle */
    result: number | null
    /** Whether the wheel is currently spinning */
    spinning: boolean
}>()

// European roulette number order on the wheel
const WHEEL_ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
    11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
    22, 18, 29, 7, 28, 12, 35, 3, 26
]

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

function getColor(n: number): string {
    if (n === 0) return 'green'
    return RED_NUMBERS.has(n) ? 'red' : 'black'
}

const SEGMENT_ANGLE = 360 / WHEEL_ORDER.length

// Current rotation of the wheel
const wheelRotation = ref(0)
const isAnimating = ref(false)

// When result changes, animate the spin
watch(() => props.result, (newResult) => {
    if (newResult === null || !props.spinning) return
    animateToNumber(newResult)
})

watch(() => props.spinning, (spin) => {
    if (spin && props.result === null) {
        // Start indefinite spin (will be stopped when result arrives)
        isAnimating.value = true
    }
})

function animateToNumber(num: number): void {
    const idx = WHEEL_ORDER.indexOf(num)
    if (idx === -1) return

    isAnimating.value = true

    // Where the wheel must stop so the center of this segment is under the pointer
    const targetAngle = -(idx * SEGMENT_ANGLE + SEGMENT_ANGLE / 2)

    // Normalise current & target to [0, 360)
    const curEff = ((wheelRotation.value % 360) + 360) % 360
    const tgtEff = ((targetAngle % 360) + 360) % 360

    // Delta: always negative (clockwise)
    let delta = tgtEff - curEff
    if (delta > 0) delta -= 360

    // Add 3-5 exact full rotations for drama
    const extraSpins = (3 + Math.floor(Math.random() * 3)) * 360

    wheelRotation.value += delta - extraSpins

    setTimeout(() => {
        isAnimating.value = false
    }, 4000)
}

const wheelStyle = computed(() => ({
    transform: `rotate(${wheelRotation.value}deg)`,
    transition: isAnimating.value
        ? 'transform 4s cubic-bezier(0.15, 0.6, 0.35, 1)'
        : 'none',
}))
</script>

<template>
    <div class="wheel-container">
        <!-- Pointer -->
        <div class="wheel-pointer"></div>

        <!-- Wheel -->
        <div class="wheel" :style="wheelStyle">
            <svg viewBox="0 0 400 400" class="wheel-svg">
                <g transform="translate(200,200)">
                    <template v-for="(num, i) in WHEEL_ORDER" :key="num">
                        <path :d="describeArc(0, 0, 190, i * SEGMENT_ANGLE - 90, (i + 1) * SEGMENT_ANGLE - 90)"
                            :fill="getColor(num) === 'red' ? 'var(--roulette-red)' : getColor(num) === 'black' ? 'var(--roulette-black)' : 'var(--roulette-green)'"
                            stroke="var(--t-bg-card)" stroke-width="1" />
                        <text :transform="`rotate(${i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2}) translate(0, -165)`"
                            text-anchor="middle" dominant-baseline="central" fill="white" font-size="10"
                            font-weight="700">{{ num }}</text>
                    </template>
                    <!-- Center hub -->
                    <circle r="30" fill="var(--t-bg-card)" stroke="var(--t-border)" stroke-width="2" />
                    <circle r="12" fill="var(--t-bg-muted)" />
                </g>
            </svg>
        </div>

        <!-- Result overlay -->
        <Transition name="fade">
            <div v-if="result !== null && !isAnimating" class="result-chip" :class="`chip-${getColor(result)}`">
                {{ result }}
            </div>
        </Transition>
    </div>
</template>

<script lang="ts">
// SVG arc helper (outside setup for template use)
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const large = endAngle - startAngle > 180 ? 1 : 0
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`
}
</script>

<style scoped>
.wheel-container {
    --roulette-red: var(--t-gamble-roulette-red);
    --roulette-black: var(--t-gamble-roulette-black);
    --roulette-green: var(--t-gamble-roulette-green);

    position: relative;
    width: 100%;
    max-width: 340px;
    aspect-ratio: 1;
    margin: 0 auto;
}

.wheel {
    width: 100%;
    height: 100%;
    border-radius: var(--t-radius-full);
    overflow: hidden;
    border: 6px solid var(--t-border);
}

.wheel-svg {
    width: 100%;
    height: 100%;
    display: block;
}

.wheel-pointer {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 20px solid var(--t-accent);
    z-index: 5;
}

.result-chip {
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
    min-width: 48px;
    height: 48px;
    border-radius: var(--t-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--t-text);
    border: 3px solid var(--t-bg-card);
    z-index: 6;
}

.chip-red {
    background: var(--roulette-red);
}

.chip-black {
    background: var(--roulette-black);
}

.chip-green {
    background: var(--roulette-green);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity var(--t-transition-normal);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
