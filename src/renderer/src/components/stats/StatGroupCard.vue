<script setup lang="ts">
/**
 * StatGroupCard — Collapsible stat category card for the unified Statistics view.
 *
 * Displays a group of related statistics (e.g. Business, Gambling)
 * with icon header, expandable detail section, and individual stat items
 * matching the project's stat-chip / qs-item aesthetic.
 */
import { ref } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { useI18n } from 'vue-i18n'
import type { StatGroup } from '@renderer/composables/useStats'

const props = defineProps<{
    group: StatGroup
    defaultExpanded?: boolean
}>()

const { t } = useI18n()
const expanded = ref(props.defaultExpanded ?? true)

function toggle(): void {
    expanded.value = !expanded.value
}
</script>

<template>
    <div class="stat-group-card" :class="{ expanded }">
        <div class="sg-header" @click="toggle">
            <div class="sg-header-left">
                <div class="sg-icon-wrap">
                    <AppIcon :icon="group.icon" class="sg-icon" />
                </div>
                <h3 class="sg-title">{{ t(group.titleKey) }}</h3>
                <span class="sg-count">{{ group.items.length }}</span>
            </div>
            <AppIcon :icon="expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="sg-chevron" />
        </div>

        <transition name="slide-stats">
            <div v-if="expanded" class="sg-body">
                <div class="sg-grid">
                    <div v-for="item in group.items" :key="item.labelKey" class="sg-item">
                        <div class="sg-item-icon-wrap">
                            <AppIcon :icon="item.icon" class="sg-item-icon" />
                        </div>
                        <div class="sg-item-text">
                            <span class="sg-item-value" :class="item.colorClass">{{ item.value }}</span>
                            <span class="sg-item-label">{{ t(item.labelKey) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.stat-group-card {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    overflow: hidden;
    transition: border-color var(--t-transition-normal);
}

.stat-group-card:hover {
    border-color: var(--t-border-hover);
}

/* ─── Header ─── */
.sg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-3) var(--t-space-4);
    cursor: pointer;
    user-select: none;
    transition: background var(--t-transition-fast);
}

.sg-header:hover {
    background: var(--t-bg-muted);
}

.sg-header-left {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.sg-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: var(--t-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--t-bg-muted);
}

.sg-icon {
    font-size: 1.1rem;
    color: var(--t-text-secondary);
}

.sg-title {
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    margin: 0;
}

.sg-count {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
    padding: 0.1rem 0.45rem;
    border-radius: var(--t-radius-sm);
}

.sg-chevron {
    font-size: 0.9rem;
    color: var(--t-text-muted);
    flex-shrink: 0;
}

/* ─── Body / Grid ─── */
.sg-body {
    padding: 0 var(--t-space-4) var(--t-space-4);
}

.sg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--t-space-3);
}

.sg-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    background: var(--t-bg-base);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    transition: border-color var(--t-transition-normal);
}

.sg-item:hover {
    border-color: var(--t-border-hover);
}

.sg-item-icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: var(--t-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--t-bg-muted);
}

.sg-item-icon {
    font-size: 0.95rem;
    color: var(--t-text-muted);
}

.sg-item-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.sg-item-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sg-item-label {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-medium);
    letter-spacing: 0.03em;
    color: var(--t-text-muted);
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Color classes */
.sg-item-value.positive {
    color: var(--t-success);
}

.sg-item-value.negative {
    color: var(--t-danger);
}

.sg-item-value.text-gold {
    color: var(--t-gold);
}

.sg-item-value.text-purple {
    color: var(--t-purple);
}

.sg-item-value.text-emerald {
    color: var(--t-success);
}

.sg-item-value.text-sky {
    color: var(--t-info);
}

.sg-item-value.text-warning {
    color: var(--t-warning);
}

/* ─── Slide Transition ─── */
.slide-stats-enter-active,
.slide-stats-leave-active {
    transition: all var(--t-transition-fast) ease;
    overflow: hidden;
}

.slide-stats-enter-from,
.slide-stats-leave-to {
    opacity: 0;
    max-height: 0;
    padding-bottom: 0;
}

.slide-stats-enter-to,
.slide-stats-leave-from {
    opacity: 1;
    max-height: 1000px;
}
</style>
