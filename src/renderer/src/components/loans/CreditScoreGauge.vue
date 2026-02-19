<script setup lang="ts">
/**
 * CreditScoreGauge — SVG ring gauge with score + tier label.
 *
 * Pure presentational component. All logic lives in useCreditScore.
 */
import { computed } from 'vue'

const props = defineProps<{
    score: number
    ratio: number
    color: string
    tierLabel: string
    tierIcon: string
}>()

const R = 52
const CIRCUMFERENCE = 2 * Math.PI * R

const dashOffset = computed(() => CIRCUMFERENCE * (1 - props.ratio))
</script>

<template>
    <div class="csg">
        <svg viewBox="0 0 120 120" class="csg-svg" aria-hidden="true">
            <!-- Background track -->
            <circle cx="60" cy="60" :r="R" fill="none" stroke="var(--t-border)" stroke-width="6" />
            <!-- Progress arc -->
            <circle cx="60" cy="60" :r="R" fill="none" :stroke="color" stroke-width="6" stroke-linecap="round"
                :stroke-dasharray="CIRCUMFERENCE" :stroke-dashoffset="dashOffset" class="csg-arc" />
        </svg>
        <div class="csg-inner">
            <span class="csg-num" :style="{ color }">{{ score }}</span>
            <span class="csg-tier">{{ tierLabel }}</span>
        </div>
    </div>
</template>

<style scoped>
.csg {
    position: relative;
    width: 128px;
    height: 128px;
    margin: 0 auto;
}

.csg-svg {
    width: 100%;
    height: 100%;
}

.csg-arc {
    transform: rotate(-90deg);
    transform-origin: center;
    transition: stroke-dashoffset 0.6s ease, stroke 0.4s ease;
}

.csg-inner {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.csg-num {
    font-size: 2.125rem;
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
    line-height: 1;
}

.csg-tier {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin-top: 2px;
    text-transform: capitalize;
}
</style>
