<script setup lang="ts">
/**
 * UTabs — Unified tab bar + panel system.
 *
 * Replaces both PrimeVue Tabs and manual UButton variant="tab" patterns
 * with a single, minimal component that follows the app design system.
 *
 * Usage:
 *   <UTabs v-model="activeTab" :tabs="[
 *     { id: 'browse', label: 'Browse', icon: 'mdi:store-search', count: 120 },
 *     { id: 'sell',   label: 'Sell',   icon: 'mdi:cash-register' },
 *   ]">
 *     <template #browse> ... </template>
 *     <template #sell>   ... </template>
 *   </UTabs>
 *
 * Or with explicit default slot + v-if on your own:
 *   <UTabs v-model="activeTab" :tabs="tabs" />
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'

export interface TabDef {
    /** Unique tab id — also used as the named slot key */
    id: string
    /** Display label */
    label: string
    /** Optional Iconify icon id */
    icon?: string
    /** Optional badge / count number */
    count?: number
    /** Secondary text shown after label (e.g. cost) */
    subtitle?: string
    /** Disabled state */
    disabled?: boolean
}

const props = defineProps<{
    /** Currently active tab id (v-model) */
    modelValue: string
    /** Tab definitions */
    tabs: TabDef[]
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const activeId = computed({
    get: () => props.modelValue,
    set: (v: string) => emit('update:modelValue', v)
})

function select(tab: TabDef) {
    if (tab.disabled) return
    activeId.value = tab.id
}
</script>

<template>
    <div class="u-tabs">
        <div class="u-tabs__bar" role="tablist">
            <button v-for="tab in tabs" :key="tab.id" role="tab" :aria-selected="activeId === tab.id"
                :disabled="tab.disabled" class="u-tabs__tab" :class="{ active: activeId === tab.id }"
                @click="select(tab)">
                <AppIcon v-if="tab.icon" :icon="tab.icon" class="u-tabs__icon" />
                <span class="u-tabs__label">{{ tab.label }}</span>
                <span v-if="tab.subtitle" class="u-tabs__sub">{{ tab.subtitle }}</span>
                <span v-if="tab.count != null && tab.count > 0" class="u-tabs__count">{{ tab.count }}</span>
            </button>
        </div>
        <div class="u-tabs__panels">
            <template v-for="tab in tabs" :key="tab.id">
                <div v-if="activeId === tab.id" class="u-tabs__panel" role="tabpanel">
                    <slot :name="tab.id" />
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.u-tabs {
    display: flex;
    flex-direction: column;
}

/* ── Tab bar ── */
.u-tabs__bar {
    display: flex;
    gap: 0;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg) var(--t-radius-lg) 0 0;
    overflow: hidden;
}

/* ── Single tab button ── */
.u-tabs__tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: var(--t-space-2-5, 0.625rem) var(--t-space-4);
    background: transparent;
    border: none;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-medium);
    font-family: var(--t-font-sans);
    cursor: pointer;
    transition: color var(--t-transition-fast), background var(--t-transition-fast);
    white-space: nowrap;
    user-select: none;
}

.u-tabs__tab:hover:not(:disabled) {
    color: var(--t-text-secondary);
    background: var(--t-bg-muted);
}

.u-tabs__tab:focus-visible {
    outline: none;
    box-shadow: var(--t-shadow-focus);
    z-index: 1;
}

.u-tabs__tab.active {
    color: var(--t-text);
    background: var(--t-bg-muted);
    font-weight: var(--t-font-semibold);
}

.u-tabs__tab:disabled {
    opacity: 0.35;
    pointer-events: none;
}

/* ── Icon ── */
.u-tabs__icon {
    font-size: 1rem;
    flex-shrink: 0;
}

/* ── Label ── */
.u-tabs__label {
    line-height: 1;
}

/* ── Subtitle (e.g. cost) ── */
.u-tabs__sub {
    font-family: var(--t-font-mono);
    font-size: 0.7em;
    font-weight: 400;
    opacity: 0.6;
}

/* ── Count badge ── */
.u-tabs__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    font-size: 0.65rem;
    font-weight: 700;
    background: var(--t-bg-muted);
    color: var(--t-text-secondary);
    border-radius: var(--t-radius-full);
}

.u-tabs__tab.active .u-tabs__count {
    background: var(--t-text);
    color: var(--t-bg-base);
}

/* ── Panel area ── */
.u-tabs__panels {
    padding: var(--t-space-4) 0 0 0;
}

.u-tabs__panel {
    /* panels are transparent — content provides its own bg */
}
</style>