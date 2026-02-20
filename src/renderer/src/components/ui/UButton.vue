<script setup lang="ts">
/**
 * UButton — Unified CTA component.
 *
 * Replaces ALL button patterns across the app with a single,
 * themeable component that follows the design-system hierarchy.
 *
 * Usage:
 *   <UButton variant="primary" icon="mdi:check" @click="save">Save</UButton>
 *   <UButton variant="ghost" size="sm" icon="mdi:delete" />
 *   <UButton variant="danger" loading>Deleting…</UButton>
 */
import { computed, useSlots } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'ghost'
    | 'muted'
    | 'contrast'
    | 'text'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'tab'
    | 'icon'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(
    defineProps<{
        /** Visual variant */
        variant?: ButtonVariant
        /** Size */
        size?: ButtonSize
        /** Leading icon (Iconify name) */
        icon?: string
        /** Trailing icon */
        iconRight?: string
        /** Full-width */
        block?: boolean
        /** Loading spinner — disables interaction and shows spinner */
        loading?: boolean
        /** Active / selected state */
        active?: boolean
        /** HTML disabled attribute */
        disabled?: boolean
        /** Optional text label (alternative to default slot) */
        label?: string
        /** Secondary text displayed after the label (e.g. cost, subtitle) */
        subtitle?: string
        /** Native button type */
        type?: 'button' | 'submit' | 'reset'
        /** Skip all btn-* classes — the caller provides its own CSS class */
        unstyled?: boolean
    }>(),
    {
        variant: 'primary',
        size: 'md',
        block: false,
        loading: false,
        active: false,
        disabled: false,
        type: 'button',
        unstyled: false
    }
)

const slots = useSlots()

const isIconOnly = computed(
    () => !slots.default && !props.label && !!props.icon
)

const classes = computed(() => {
    if (props.unstyled) return { active: props.active }

    /* Tab variant uses the separate .tab-btn hierarchy from theme.css */
    if (props.variant === 'tab') {
        return ['tab-btn', { active: props.active }]
    }

    return [
        'btn',
        `btn-${props.variant}`,
        {
            'btn-xs': props.size === 'xs',
            'btn-sm': props.size === 'sm',
            'btn-md': props.size === 'md',
            'btn-lg': props.size === 'lg',
            'btn-xl': props.size === 'xl',
            'btn-icon': isIconOnly.value,
            'btn-block': props.block,
            'btn-loading': props.loading,
            active: props.active
        }
    ]
})
</script>

<template>
    <button :class="classes" :type="type" :disabled="disabled || loading"
        :aria-disabled="disabled || loading || undefined" :aria-busy="loading || undefined">
        <!-- Leading icon -->
        <AppIcon v-if="icon && !loading" :icon="icon" class="btn__icon" />
        <!-- Loading spinner replaces leading icon -->
        <AppIcon v-if="loading" icon="mdi:loading" class="btn__icon btn__icon--spin" />
        <!-- Label -->
        <span v-if="!isIconOnly" class="btn__label">
            <slot>{{ label }}</slot>
        </span>
        <!-- Subtitle (secondary text, e.g. cost) -->
        <span v-if="subtitle" class="btn__sub">{{ subtitle }}</span>
        <!-- Trailing icon -->
        <AppIcon v-if="iconRight && !loading" :icon="iconRight" class="btn__icon" />
    </button>
</template>

<style scoped>
/* Subtitle — secondary text, uses currentColor so it adapts to any variant/theme */
.btn__sub {
    font-family: var(--t-font-mono);
    font-size: 0.7em;
    font-weight: 400;
    opacity: 0.7;
    margin-left: 0.15em;
}

/* Spin animation for loading icon */
.btn__icon--spin {
    animation: u-btn-spin 0.8s linear infinite;
}

@keyframes u-btn-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
