<script setup lang="ts">
/**
 * UAccordion — Universal expandable panel / accordion.
 *
 * Usage:
 *   <UAccordion title="Details" icon="mdi:information">
 *     <p>Expanded content here</p>
 *   </UAccordion>
 */
import { ref, watch } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'

const props = withDefaults(
    defineProps<{
        /** Panel title */
        title: string
        /** Optional icon */
        icon?: string
        /** Badge text (e.g. count) */
        badge?: string | number
        /** Start expanded */
        defaultOpen?: boolean
        /** Controlled open state (v-model) */
        modelValue?: boolean
        /** Visual variant */
        variant?: 'default' | 'muted' | 'ghost'
        /** Compact mode */
        compact?: boolean
    }>(),
    {
        defaultOpen: false,
        variant: 'default',
        compact: false
    }
)

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
}>()

const isOpen = ref(props.modelValue ?? props.defaultOpen)

watch(() => props.modelValue, (v) => {
    if (v !== undefined) isOpen.value = v
})

function toggle(): void {
    isOpen.value = !isOpen.value
    emit('update:modelValue', isOpen.value)
}
</script>

<template>
    <div class="u-accordion" :class="[
        `u-accordion--${variant}`,
        { 'u-accordion--open': isOpen, 'u-accordion--compact': compact }
    ]">
        <button class="u-accordion-trigger" @click="toggle" :aria-expanded="isOpen">
            <AppIcon v-if="icon" :icon="icon" class="u-accordion-icon" />
            <span class="u-accordion-title">{{ title }}</span>
            <span v-if="badge !== undefined" class="u-accordion-badge">{{ badge }}</span>
            <AppIcon icon="mdi:chevron-down" class="u-accordion-chevron" :class="{ rotated: isOpen }" />
        </button>

        <Transition name="accordion-slide">
            <div v-if="isOpen" class="u-accordion-content">
                <slot />
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.u-accordion {
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    background: var(--t-bg-card);
    margin-top: var(--t-space-2);
    overflow: hidden;
    transition: border-color var(--t-transition-normal);
}

.u-accordion--open {
    border-color: var(--t-border-hover);
}

.u-accordion--muted {
    background: var(--t-bg-muted);
    border-color: transparent;
}

.u-accordion--ghost {
    background: transparent;
    border-color: transparent;
}

.u-accordion-trigger {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: 100%;
    padding: var(--t-space-3) var(--t-space-4);
    background: none;
    border: none;
    color: var(--t-text-secondary);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    font-family: var(--t-font-sans);
    cursor: pointer;
    transition: background var(--t-transition-fast), color var(--t-transition-fast);
    text-align: left;
}

.u-accordion--compact .u-accordion-trigger {
    padding: var(--t-space-2) var(--t-space-3);
    font-size: var(--t-font-size-xs);
}

.u-accordion-trigger:hover {
    background: var(--t-bg-muted);
    color: var(--t-text);
}

.u-accordion-trigger:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}

.u-accordion-icon {
    font-size: 1rem;
    flex-shrink: 0;
    color: var(--t-text-muted);
}

.u-accordion-title {
    flex: 1;
    text-align: left;
}

.u-accordion-badge {
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-bold);
    padding: 0.1rem 0.35rem;
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    color: var(--t-text-muted);
}

.u-accordion--open .u-accordion-badge {
    background: var(--t-text);
    color: var(--t-bg-base);
}

.u-accordion-chevron {
    font-size: 0.9rem;
    color: var(--t-text-muted);
    transition: transform var(--t-transition-normal);
    flex-shrink: 0;
}

.u-accordion-chevron.rotated {
    transform: rotate(180deg);
}

.u-accordion-content {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: 0 var(--t-space-4) var(--t-space-4);
    border-top: 1px solid var(--t-border);
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    line-height: var(--t-leading-relaxed);
}

.u-accordion--compact .u-accordion-content {
    padding: 0 var(--t-space-3) var(--t-space-3);
}

/* Transition */
.accordion-slide-enter-active,
.accordion-slide-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
}

.accordion-slide-enter-from,
.accordion-slide-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.accordion-slide-enter-to,
.accordion-slide-leave-from {
    max-height: 2000px;
    opacity: 1;
}
</style>
