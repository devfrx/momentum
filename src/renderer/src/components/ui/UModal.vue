<script setup lang="ts">
/**
 * UModal — Universal modal / dialog component.
 *
 * Usage:
 *   <UModal v-model="visible" title="Confirm" size="sm">
 *     <p>Are you sure?</p>
 *     <template #footer>
 *       <button class="btn btn-ghost" @click="visible = false">Cancel</button>
 *       <button class="btn btn-primary" @click="confirm">OK</button>
 *     </template>
 *   </UModal>
 */
import { watch, onMounted, onBeforeUnmount } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'

const props = withDefaults(
    defineProps<{
        /** Two-way visibility */
        modelValue?: boolean
        /** Dialog title */
        title?: string
        /** Title icon */
        icon?: string
        /** Size: sm (400px) | md (540px) | lg (720px) | full */
        size?: 'sm' | 'md' | 'lg' | 'full'
        /** Show close button */
        closable?: boolean
        /** Close on backdrop click */
        dismissable?: boolean
        /** Danger variant */
        danger?: boolean
    }>(),
    {
        modelValue: false,
        size: 'md',
        closable: true,
        dismissable: false,
        danger: false
    }
)

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'close'): void
}>()

function close(): void {
    emit('update:modelValue', false)
    emit('close')
}

function onBackdropClick(): void {
    if (props.dismissable) close()
}

function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && props.closable) close()
}

watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            document.addEventListener('keydown', onKeydown)
        } else {
            document.removeEventListener('keydown', onKeydown)
        }
    }
)

onMounted(() => {
    if (props.modelValue) document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div v-if="modelValue" class="u-modal-overlay" @click.self="onBackdropClick">
                <div class="u-modal" :class="[`u-modal--${size}`, { 'u-modal--danger': danger }]" role="dialog"
                    aria-modal="true">
                    <!-- Header -->
                    <header v-if="title || closable || $slots.header" class="u-modal-header">
                        <slot name="header">
                            <div class="u-modal-title">
                                <AppIcon v-if="icon" :icon="icon" class="u-modal-title-icon" />
                                <span>{{ title }}</span>
                            </div>
                        </slot>
                        <button v-if="closable" class="u-modal-close" @click="close" aria-label="Close">
                            <AppIcon icon="mdi:close" />
                        </button>
                    </header>

                    <!-- Body -->
                    <div class="u-modal-body">
                        <slot />
                    </div>

                    <!-- Footer -->
                    <footer v-if="$slots.footer" class="u-modal-footer">
                        <slot name="footer" />
                    </footer>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.u-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--t-overlay);
    padding: var(--t-space-4);
}

.u-modal {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-xl);
    box-shadow: var(--t-shadow-lg);
    display: flex;
    flex-direction: column;
    max-height: 85vh;
    width: 100%;
}

.u-modal--sm {
    max-width: 400px;
}

.u-modal--md {
    max-width: 540px;
}

.u-modal--lg {
    max-width: 720px;
}

.u-modal--full {
    max-width: 90vw;
    max-height: 90vh;
}

.u-modal--danger .u-modal-header {
    border-bottom-color: color-mix(in srgb, var(--t-danger) 20%, transparent);
}

.u-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-4) var(--t-space-5);
    border-bottom: 1px solid var(--t-border);
    flex-shrink: 0;
}

.u-modal-title {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.u-modal--danger .u-modal-title {
    color: var(--t-danger);
}

.u-modal-title-icon {
    font-size: 1.15rem;
    color: var(--t-text-secondary);
}

.u-modal--danger .u-modal-title-icon {
    color: var(--t-danger);
}

.u-modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--t-text-muted);
    border-radius: var(--t-radius-sm);
    cursor: pointer;
    transition: all var(--t-transition-fast);
    font-size: 1rem;
}

.u-modal-close:hover {
    background: var(--t-bg-muted);
    color: var(--t-text);
}

.u-modal-close:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}

.u-modal-body {
    padding: var(--t-space-5);
    overflow-y: auto;
    flex: 1;
    font-size: var(--t-font-size-sm);
    line-height: var(--t-leading-relaxed);
    color: var(--t-text-secondary);
}

.u-modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-5);
    border-top: 1px solid var(--t-border);
    flex-shrink: 0;
}

/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.15s ease;
}

.modal-fade-enter-active .u-modal,
.modal-fade-leave-active .u-modal {
    transition: transform 0.15s ease, opacity 0.15s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.modal-fade-enter-from .u-modal,
.modal-fade-leave-to .u-modal {
    transform: scale(0.96);
    opacity: 0;
}
</style>