<script setup lang="ts">
/**
 * UTooltip — Enhanced tooltip wrapper component.
 *
 * Wraps PrimeVue's v-tooltip with consistent styling.
 * Use native v-tooltip for simple cases; use this for rich tooltips.
 *
 * Usage:
 *   <UTooltip text="Simple tooltip">
 *     <button>Hover me</button>
 *   </UTooltip>
 *
 *   <UTooltip>
 *     <button>Hover me</button>
 *     <template #content>
 *       <div>Rich HTML content</div>
 *     </template>
 *   </UTooltip>
 */
import { ref } from 'vue'

withDefaults(
    defineProps<{
        /** Simple text tooltip */
        text?: string
        /** Placement */
        placement?: 'top' | 'bottom' | 'left' | 'right'
        /** Delay before showing (ms) */
        delay?: number
    }>(),
    {
        placement: 'top',
        delay: 300
    }
)

const visible = ref(false)
let showTimeout: ReturnType<typeof setTimeout> | null = null

function onEnter(delay: number): void {
    showTimeout = setTimeout(() => {
        visible.value = true
    }, delay)
}

function onLeave(): void {
    if (showTimeout) clearTimeout(showTimeout)
    visible.value = false
}
</script>

<template>
    <div class="u-tooltip-wrapper" @mouseenter="onEnter(delay)" @mouseleave="onLeave" @focus="onEnter(delay)"
        @blur="onLeave">
        <slot />

        <Transition name="tooltip-fade">
            <div v-if="visible && (text || $slots.content)" class="u-tooltip" :class="`u-tooltip--${placement}`"
                role="tooltip">
                <slot name="content">
                    <span>{{ text }}</span>
                </slot>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.u-tooltip-wrapper {
    position: relative;
    display: inline-flex;
}

.u-tooltip {
    position: absolute;
    z-index: 1100;
    background: var(--t-bg-elevated);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    box-shadow: var(--t-shadow-md);
    padding: 0.3rem 0.55rem;
    font-size: var(--t-font-size-xs);
    line-height: var(--t-leading-normal);
    color: var(--t-text);
    white-space: nowrap;
    pointer-events: none;
    max-width: 260px;
}

.u-tooltip--top {
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
}

.u-tooltip--bottom {
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
}

.u-tooltip--left {
    right: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
}

.u-tooltip--right {
    left: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
}

/* Transition */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
    transition: opacity 0.1s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
    opacity: 0;
}
</style>