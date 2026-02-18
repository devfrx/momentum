<script setup lang="ts">
/**
 * UCard — Unified card surface component.
 *
 * Replaces ALL card-surface patterns across the app with a single,
 * themeable component that follows the design-system hierarchy.
 *
 * Three structural zones (all optional via slots):
 *   #header  — icon, title, badges, actions
 *   #default — main body content
 *   #footer  — action buttons, status indicators
 *
 * Usage:
 *   <UCard>Simple content</UCard>
 *   <UCard variant="dashed" size="sm" locked>…</UCard>
 *   <UCard accent="var(--t-purple)" interactive>…</UCard>
 */
import { computed, useSlots } from 'vue'

export type CardVariant = 'default' | 'dashed' | 'flat' | 'elevated'
export type CardSize = 'sm' | 'md' | 'lg'
export type CardRadius = 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(
    defineProps<{
        /** Visual variant */
        variant?: CardVariant
        /** Controls padding: sm=space-3, md=space-4, lg=space-5 */
        size?: CardSize
        /** Border radius preset */
        radius?: CardRadius
        /** Clickable card with hover effects */
        interactive?: boolean
        /** Locked state — faded, non-interactive */
        locked?: boolean
        /** Active / selected highlight */
        active?: boolean
        /** Accent color — injected as --_accent CSS custom property */
        accent?: string
        /** Border status color */
        borderStatus?: 'none' | 'success' | 'danger' | 'warning' | 'info'
    }>(),
    {
        variant: 'default',
        size: 'md',
        radius: 'lg',
        interactive: false,
        locked: false,
        active: false,
        borderStatus: 'none'
    }
)

const slots = useSlots()

const hasHeader = computed(() => !!slots.header)
const hasFooter = computed(() => !!slots.footer)

const rootClasses = computed(() => [
    'u-card',
    `u-card--${props.variant}`,
    `u-card--${props.size}`,
    `u-card--r-${props.radius}`,
    {
        'u-card--interactive': props.interactive,
        'u-card--locked': props.locked,
        'u-card--active': props.active,
        [`u-card--border-${props.borderStatus}`]: props.borderStatus !== 'none'
    }
])

const rootStyle = computed(() =>
    props.accent ? { '--_accent': props.accent } as Record<string, string> : undefined
)
</script>

<template>
    <div :class="rootClasses" :style="rootStyle">
        <!-- Header zone -->
        <div v-if="hasHeader" class="u-card__header">
            <slot name="header" />
        </div>

        <!-- Body zone -->
        <div class="u-card__body">
            <slot />
        </div>

        <!-- Footer zone -->
        <div v-if="hasFooter" class="u-card__footer">
            <slot name="footer" />
        </div>
    </div>
</template>

<style scoped>
/* ── Surface ── */
.u-card {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    display: flex;
    flex-direction: column;
    transition:
        border-color var(--t-transition-normal),
        box-shadow var(--t-transition-normal);
}

/* -- Sizes (padding) -- */
.u-card--sm {
    padding: var(--t-space-3);
}

.u-card--md {
    padding: var(--t-space-4);
}

.u-card--lg {
    padding: var(--t-space-5);
}

/* -- Radius -- */
.u-card--r-sm {
    border-radius: var(--t-radius-sm);
}

.u-card--r-md {
    border-radius: var(--t-radius-md);
}

.u-card--r-lg {
    border-radius: var(--t-radius-lg);
}

.u-card--r-xl {
    border-radius: var(--t-radius-xl);
}

/* ── Variants ── */

/* Default — standard card surface */
.u-card--default:hover {
    border-color: var(--t-border-hover);
}

/* Dashed — purchase / empty-state cards */
.u-card--dashed {
    border-style: dashed;
}

.u-card--dashed:hover {
    border-color: var(--t-border-hover);
}

/* Flat — no border, muted bg (sub-cards, nested panels) */
.u-card--flat {
    background: var(--t-bg-muted);
    border-color: transparent;
}

/* Elevated — shadow emphasis */
.u-card--elevated {
    box-shadow: var(--t-shadow-sm);
}

.u-card--elevated:hover {
    border-color: var(--t-border-hover);
    box-shadow: var(--t-shadow-md);
}

/* ── Interactive ── */
.u-card--interactive {
    cursor: pointer;
}

.u-card--interactive:hover {
    border-color: var(--t-border-hover);
    transform: translateY(-1px);
    box-shadow: var(--t-shadow-sm);
}

.u-card--interactive:active {
    transform: translateY(0);
}

/* ── States ── */
.u-card--locked {
    opacity: var(--t-opacity-disabled, 0.35);
    pointer-events: none;
    filter: grayscale(0.5);
}

.u-card--active {
    border-color: var(--_accent, var(--t-cta));
    box-shadow: 0 0 0 1px var(--_accent, var(--t-cta));
}

/* ── Border status ── */
.u-card--border-success {
    border-color: var(--t-success);
}

.u-card--border-danger {
    border-color: var(--t-danger);
}

.u-card--border-warning {
    border-color: var(--t-warning);
}

.u-card--border-info {
    border-color: var(--t-info);
}

/* ── Accent glow (when --_accent is set) ── */
.u-card[style*='--_accent']:hover {
    border-color: var(--_accent);
}

/* ── Structural zones ── */
.u-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--t-space-3);
    gap: var(--t-space-2);
}

.u-card__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.u-card__footer {
    display: flex;
    gap: var(--t-space-2);
    flex-wrap: wrap;
    margin-top: var(--t-space-3);
}

/* ── Legacy class margin resets ──
   Global .item-card-* classes carry margin-bottom that
   conflicts with the body gap. Neutralise inside UCard. */
.u-card__body> :slotted(.item-card-description),
.u-card__body> :slotted(.item-card-stats),
.u-card__body> :slotted(.item-card-header) {
    margin-bottom: 0;
}
</style>
