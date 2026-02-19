<script setup lang="ts">
/**
 * UTooltip — Enhanced tooltip wrapper component.
 *
 * Uses Teleport to render at body level so tooltips are never clipped
 * by parent overflow. Position is calculated dynamically from the
 * trigger element's bounding rect.
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
import { ref, reactive, nextTick } from 'vue'

const props = withDefaults(
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
const wrapperRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const pos = reactive({ top: '0px', left: '0px' })
let showTimeout: ReturnType<typeof setTimeout> | null = null

const GAP = 6

function updatePosition(): void {
    if (!wrapperRef.value || !tooltipRef.value) return
    const rect = wrapperRef.value.getBoundingClientRect()
    const tt = tooltipRef.value.getBoundingClientRect()

    let top = 0
    let left = 0

    switch (props.placement) {
        case 'top':
            top = rect.top - tt.height - GAP
            left = rect.left + rect.width / 2 - tt.width / 2
            break
        case 'bottom':
            top = rect.bottom + GAP
            left = rect.left + rect.width / 2 - tt.width / 2
            break
        case 'left':
            top = rect.top + rect.height / 2 - tt.height / 2
            left = rect.left - tt.width - GAP
            break
        case 'right':
            top = rect.top + rect.height / 2 - tt.height / 2
            left = rect.right + GAP
            break
    }

    // Clamp to viewport
    const margin = 8
    if (left < margin) left = margin
    if (left + tt.width > window.innerWidth - margin) left = window.innerWidth - margin - tt.width
    if (top < margin) top = margin
    if (top + tt.height > window.innerHeight - margin) top = window.innerHeight - margin - tt.height

    pos.top = `${top}px`
    pos.left = `${left}px`
}

function onEnter(): void {
    showTimeout = setTimeout(async () => {
        visible.value = true
        await nextTick()
        updatePosition()
    }, props.delay)
}

function onLeave(): void {
    if (showTimeout) clearTimeout(showTimeout)
    visible.value = false
}
</script>

<template>
    <div ref="wrapperRef" class="u-tooltip-wrapper" @mouseenter="onEnter" @mouseleave="onLeave" @focus="onEnter"
        @blur="onLeave">
        <slot />

        <Teleport to="body">
            <Transition name="tooltip-fade">
                <div v-if="visible && (text || $slots.content)" ref="tooltipRef" class="u-tooltip" role="tooltip"
                    :style="{ top: pos.top, left: pos.left }">
                    <slot name="content">
                        <span>{{ text }}</span>
                    </slot>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.u-tooltip-wrapper {
    position: relative;
    display: inline-flex;
}
</style>

<style>
/* Global styles — tooltip is teleported to body */
.u-tooltip {
    position: fixed;
    z-index: 10000;
    background: var(--t-bg-elevated);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    box-shadow: var(--t-shadow-md);
    padding: 0.3rem 0.55rem;
    font-size: var(--t-font-size-xs);
    line-height: var(--t-leading-normal);
    color: var(--t-text);
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
    pointer-events: none;
    max-width: 320px;
    width: max-content;
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