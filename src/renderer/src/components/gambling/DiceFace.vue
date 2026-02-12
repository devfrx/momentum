<script setup lang="ts">
/**
 * DiceFace — A single 3D CSS die with animated roll.
 * Displays pips on all 6 faces and rotates to show the result.
 * Uses the Web Animations API so the tumble ends on the correct face.
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps<{
    /** The face value to show (1-6), null = idle */
    value: number | null
    /** Whether the die is currently rolling */
    rolling: boolean
}>()

const dieRef = ref<HTMLElement>()
let currentAnim: Animation | null = null

// Maps face value → [rotateX, rotateY] degrees to bring that face to front
const FACE_ANGLES: Record<number, [number, number]> = {
    1: [0, 0],       // front
    2: [0, -90],     // right
    3: [-90, 0],     // top
    4: [90, 0],      // bottom
    5: [0, 90],      // left
    6: [180, 0],     // back
}

const FACE_ROTATIONS: Record<number, string> = {
    1: 'rotateX(0deg)    rotateY(0deg)',
    2: 'rotateX(0deg)    rotateY(-90deg)',
    3: 'rotateX(-90deg)  rotateY(0deg)',
    4: 'rotateX(90deg)   rotateY(0deg)',
    5: 'rotateX(0deg)    rotateY(90deg)',
    6: 'rotateX(180deg)  rotateY(0deg)',
}

// Inline transform for when not animating
const dieStyle = computed(() => {
    if (props.value === null) return {}
    return { transform: FACE_ROTATIONS[props.value] }
})

// When the target value is set during a roll, start a tumble → land animation
watch(() => props.value, (val) => {
    if (val === null || !props.rolling || !dieRef.value) return

    const [endX, endY] = FACE_ANGLES[val]

    currentAnim?.cancel()
    currentAnim = dieRef.value.animate(
        [
            { transform: 'rotateX(0deg)   rotateY(0deg)   rotateZ(0deg)' },
            { transform: 'rotateX(200deg) rotateY(150deg)  rotateZ(80deg)', offset: 0.15 },
            { transform: 'rotateX(450deg) rotateY(320deg)  rotateZ(200deg)', offset: 0.4 },
            { transform: 'rotateX(620deg) rotateY(510deg)  rotateZ(310deg)', offset: 0.7 },
            { transform: `rotateX(${720 + endX}deg) rotateY(${720 + endY}deg) rotateZ(360deg)` },
        ],
        { duration: 1400, easing: 'cubic-bezier(0.15, 0.8, 0.25, 1)', fill: 'forwards' },
    )
})

// When rolling finishes, drop the fill so inline dieStyle takes over
watch(() => props.rolling, (isRolling) => {
    if (!isRolling && currentAnim) {
        currentAnim.cancel()
        currentAnim = null
    }
})

onBeforeUnmount(() => { currentAnim?.cancel(); currentAnim = null })
</script>

<template>
    <div class="die-stage">
        <div ref="dieRef" class="die" :style="dieStyle">
            <!-- Face 1 (front) -->
            <div class="face face-1">
                <span class="pip center"></span>
            </div>
            <!-- Face 2 (right) -->
            <div class="face face-2">
                <span class="pip top-right"></span>
                <span class="pip bottom-left"></span>
            </div>
            <!-- Face 3 (top) -->
            <div class="face face-3">
                <span class="pip top-right"></span>
                <span class="pip center"></span>
                <span class="pip bottom-left"></span>
            </div>
            <!-- Face 4 (bottom) -->
            <div class="face face-4">
                <span class="pip top-left"></span>
                <span class="pip top-right"></span>
                <span class="pip bottom-left"></span>
                <span class="pip bottom-right"></span>
            </div>
            <!-- Face 5 (left) -->
            <div class="face face-5">
                <span class="pip top-left"></span>
                <span class="pip top-right"></span>
                <span class="pip center"></span>
                <span class="pip bottom-left"></span>
                <span class="pip bottom-right"></span>
            </div>
            <!-- Face 6 (back) -->
            <div class="face face-6">
                <span class="pip top-left"></span>
                <span class="pip top-right"></span>
                <span class="pip mid-left"></span>
                <span class="pip mid-right"></span>
                <span class="pip bottom-left"></span>
                <span class="pip bottom-right"></span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.die-stage {
    width: 100px;
    height: 100px;
    perspective: 400px;
}

.die {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.3, 1);
}

.face {
    position: absolute;
    width: 100px;
    height: 100px;
    background: linear-gradient(145deg, #fafafa, #e0e0e0);
    border: 2px solid #bbb;
    border-radius: var(--t-radius-xl);
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
    padding: 12px;
    box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.05);
}

.pip {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #444, #1a1a1a);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* pip placement via grid */
.top-left {
    grid-column: 1;
    grid-row: 1;
    align-self: start;
    justify-self: start;
}

.top-right {
    grid-column: 3;
    grid-row: 1;
    align-self: start;
    justify-self: end;
}

.mid-left {
    grid-column: 1;
    grid-row: 2;
    align-self: center;
    justify-self: start;
}

.center {
    grid-column: 2;
    grid-row: 2;
    align-self: center;
    justify-self: center;
}

.mid-right {
    grid-column: 3;
    grid-row: 2;
    align-self: center;
    justify-self: end;
}

.bottom-left {
    grid-column: 1;
    grid-row: 3;
    align-self: end;
    justify-self: start;
}

.bottom-right {
    grid-column: 3;
    grid-row: 3;
    align-self: end;
    justify-self: end;
}

/* 3D face positions */
.face-1 {
    transform: translateZ(50px);
}

/* front */
.face-6 {
    transform: rotateY(180deg) translateZ(50px);
}

/* back */
.face-2 {
    transform: rotateY(90deg) translateZ(50px);
}

/* right */
.face-5 {
    transform: rotateY(-90deg) translateZ(50px);
}

/* left */
.face-3 {
    transform: rotateX(90deg) translateZ(50px);
}

/* top */
.face-4 {
    transform: rotateX(-90deg) translateZ(50px);
}

/* bottom */
</style>
