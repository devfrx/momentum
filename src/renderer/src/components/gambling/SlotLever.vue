<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
    disabled?: boolean
    spinning?: boolean
}>()

const emit = defineEmits<{ pull: [] }>()

// Lever state: idle → pulling (drag down) → release (spring back) → idle
const leverEl = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const pullProgress = ref(0) // 0..1

const PULL_THRESHOLD = 0.7 // must pull past 70% to trigger
const TRACK_HEIGHT = 140
const HANDLE_SIZE = 48
const HANDLE_OFFSET = -6
const TRAVEL = TRACK_HEIGHT - HANDLE_SIZE + 12 // max px the handle can slide

const leverStyle = computed(() => ({
    transform: `translateY(${pullProgress.value * TRAVEL}px)`,
    transition: isDragging.value ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
}))

const trackFillStyle = computed(() => {
    const handleCenter = HANDLE_OFFSET + HANDLE_SIZE / 2 + pullProgress.value * TRAVEL
    return {
        height: `${Math.max(0, handleCenter)}px`,
        transition: isDragging.value ? 'none' : 'height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }
})

let startY = 0
let trackHeight = 0

function onPointerDown(e: PointerEvent): void {
    if (props.disabled || props.spinning) return
    isDragging.value = true
    startY = e.clientY
    const track = leverEl.value?.parentElement
    trackHeight = track?.getBoundingClientRect().height ?? 200

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
        ; (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent): void {
    if (!isDragging.value) return
    const delta = e.clientY - startY
    pullProgress.value = Math.max(0, Math.min(1, delta / (trackHeight * 0.7)))
}

function onPointerUp(): void {
    isDragging.value = false
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)

    if (pullProgress.value >= PULL_THRESHOLD) {
        emit('pull')
    }

    // Spring back
    pullProgress.value = 0
}

const canPull = computed(() => !props.disabled && !props.spinning)
</script>

<template>
    <div class="lever-wrapper" :class="{ disabled: !canPull, spinning: spinning }">
        <div class="lever-track">
            <!-- Fill that follows the pull -->
            <div class="lever-track-fill" :style="trackFillStyle"></div>

            <!-- The handle -->
            <div ref="leverEl" class="lever-handle" :style="leverStyle"
                :class="{ dragging: isDragging, glow: canPull && !isDragging }" @pointerdown.prevent="onPointerDown">
                <div class="handle-grip">
                    <div class="grip-line"></div>
                    <div class="grip-line"></div>
                    <div class="grip-line"></div>
                </div>
            </div>
        </div>

        <!-- Label -->
        <span class="lever-label" :class="{ active: isDragging }">
            {{ spinning ? $t('gambling.sl_spinning') : $t('gambling.sl_pull') }}
        </span>
    </div>
</template>

<style scoped>
.lever-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    user-select: none;
    touch-action: none;
}

.lever-wrapper.disabled {
    opacity: 0.4;
    pointer-events: none;
}

.lever-track {
    position: relative;
    width: 12px;
    height: 140px;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    overflow: visible;
}

.lever-track-fill {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: var(--t-accent);
    opacity: 0.25;
    border-radius: var(--t-radius-lg) var(--t-radius-lg) 0 0;
}

.lever-handle {
    position: absolute;
    top: -6px;
    left: 50%;
    margin-left: -24px;
    width: 48px;
    height: 48px;
    border-radius: var(--t-radius-full);
    background: var(--t-accent);
    border: 3px solid var(--t-bg-card);
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 2;
}

.lever-handle.dragging {
    cursor: grabbing;
}

.lever-handle.glow {
    animation: leverPulse 2s ease-in-out infinite;
}

@keyframes leverPulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.85;
    }
}

.handle-grip {
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: center;
}

.grip-line {
    width: 16px;
    height: 2px;
    background: var(--t-text-muted);
    border-radius: var(--t-radius-xs);
}

.lever-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
    transition: color var(--t-transition-fast);
}

.lever-label.active {
    color: var(--t-accent);
}

.lever-wrapper.spinning .lever-label {
    animation: spinText 1s ease-in-out infinite;
}

@keyframes spinText {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.4;
    }
}
</style>
