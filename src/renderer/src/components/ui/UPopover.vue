<script setup lang="ts">
/**
 * UPopover — Contextual info popover triggered by hover or click.
 *
 * Usage:
 *   <UPopover>
 *     <template #trigger>
 *       <button class="btn btn-ghost">Info</button>
 *     </template>
 *     <p>Contextual information here</p>
 *   </UPopover>
 */
import { ref, onBeforeUnmount } from 'vue'

withDefaults(
    defineProps<{
        /** Trigger mode */
        trigger?: 'hover' | 'click'
        /** Preferred placement */
        placement?: 'top' | 'bottom' | 'left' | 'right'
        /** Max width */
        maxWidth?: string
        /** Title text */
        title?: string
    }>(),
    {
        trigger: 'hover',
        placement: 'bottom',
        maxWidth: '280px'
    }
)

const visible = ref(false)
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

function showPopover(): void {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    visible.value = true
}

function hidePopover(): void {
    hoverTimeout = setTimeout(() => {
        visible.value = false
    }, 100)
}

function togglePopover(): void {
    visible.value = !visible.value
}

function onClickOutside(e: MouseEvent): void {
    const el = (e.target as HTMLElement)
    if (!el.closest('.u-popover-wrapper')) {
        visible.value = false
    }
}

function handleTriggerInteraction(mode: 'hover' | 'click', action: 'enter' | 'leave' | 'click'): void {
    if (mode === 'hover') {
        if (action === 'enter') showPopover()
        else if (action === 'leave') hidePopover()
    } else if (mode === 'click' && action === 'click') {
        togglePopover()
    }
}

onBeforeUnmount(() => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    document.removeEventListener('click', onClickOutside)
})
</script>

<template>
    <div class="u-popover-wrapper" @mouseenter="handleTriggerInteraction(trigger, 'enter')"
        @mouseleave="handleTriggerInteraction(trigger, 'leave')">
        <!-- Trigger -->
        <div class="u-popover-trigger" @click="handleTriggerInteraction(trigger, 'click')">
            <slot name="trigger" />
        </div>

        <!-- Popover Content -->
        <Transition name="popover-fade">
            <div v-if="visible" class="u-popover" :class="`u-popover--${placement}`" :style="{ maxWidth }"
                @mouseenter="trigger === 'hover' ? showPopover() : undefined"
                @mouseleave="trigger === 'hover' ? hidePopover() : undefined">
                <div v-if="title" class="u-popover-title">{{ title }}</div>
                <div class="u-popover-body">
                    <slot />
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.u-popover-wrapper {
    position: relative;
    display: inline-flex;
}

.u-popover-trigger {
    display: inline-flex;
    cursor: pointer;
}

.u-popover {
    position: absolute;
    z-index: 500;
    background: var(--t-bg-elevated);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    box-shadow: var(--t-shadow-lg);
    padding: var(--t-space-3);
    font-size: var(--t-font-size-xs);
    line-height: var(--t-leading-relaxed);
    color: var(--t-text-secondary);
}

.u-popover--bottom {
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
}

.u-popover--top {
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
}

.u-popover--left {
    right: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
}

.u-popover--right {
    left: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
}

.u-popover-title {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    margin-bottom: var(--t-space-1);
}

.u-popover-body {
    color: var(--t-text-secondary);
}

/* Transition */
.popover-fade-enter-active,
.popover-fade-leave-active {
    transition: opacity 0.12s ease, transform 0.12s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
}
</style>