<script setup lang="ts">
/**
 * ActivityLog — Persistent scrollable feed of black market events.
 * Replaces volatile toast notifications with a dark, ominous log
 * that keeps history of all deals, contact interactions, betrayals,
 * scams, investigations, and consequences.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import type { ActivityLogSeverity } from '@renderer/data/blackmarket'

const bm = useBlackMarketStore()
const { t } = useI18n()

const entries = computed(() => bm.activityLog)

function severityClass(severity: ActivityLogSeverity): string {
    return `log-entry--${severity}`
}

function severityLabel(severity: ActivityLogSeverity): string {
    const map: Record<ActivityLogSeverity, string> = {
        success: '✓',
        danger: '✗',
        warning: '⚠',
        info: 'ℹ',
        neutral: '·',
    }
    return map[severity]
}

function translateEntry(key: string, params?: Record<string, unknown>): string {
    return t(key, params ?? {})
}

function relativeTime(entryTick: number): string {
    const diff = (bm.lastTickProcessed ?? 0) - entryTick
    const secs = Math.floor(diff / 10)
    if (secs < 5) return t('blackmarket.log_just_now')
    if (secs < 60) return t('blackmarket.log_seconds_ago', { s: secs })
    const mins = Math.floor(secs / 60)
    if (mins < 60) return t('blackmarket.log_minutes_ago', { m: mins })
    const hrs = Math.floor(mins / 60)
    return t('blackmarket.log_hours_ago', { h: hrs })
}

function clearLog(): void {
    bm.activityLog.length = 0
}
</script>

<template>
    <div class="activity-log">
        <div class="activity-log__header">
            <span class="activity-log__title">
                <AppIcon icon="mdi:script-text-outline" />
                {{ t('blackmarket.log_title') }}
            </span>
            <button v-if="entries.length > 0" class="activity-log__clear" :title="t('blackmarket.log_clear')"
                @click="clearLog">
                <AppIcon icon="mdi:notification-clear-all" />
            </button>
        </div>

        <div v-if="entries.length === 0" class="activity-log__empty">
            {{ t('blackmarket.log_empty') }}
        </div>

        <div v-else class="activity-log__scroll">
            <TransitionGroup name="log-item" tag="div" class="activity-log__list">
                <div v-for="entry in entries" :key="entry.id" class="log-entry" :class="severityClass(entry.severity)">
                    <span class="log-entry__badge">{{ severityLabel(entry.severity) }}</span>
                    <AppIcon :icon="entry.icon" class="log-entry__icon" />
                    <div class="log-entry__content">
                        <span class="log-entry__title">
                            {{ translateEntry(entry.titleKey, entry.titleParams) }}
                        </span>
                        <span v-if="entry.detailKey" class="log-entry__detail">
                            {{ translateEntry(entry.detailKey, entry.detailParams) }}
                        </span>
                    </div>
                    <span class="log-entry__time">{{ relativeTime(entry.tick) }}</span>
                </div>
            </TransitionGroup>
        </div>
    </div>
</template>

<style scoped>
.activity-log {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    background: var(--t-bg-elevated);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-3);
    max-height: 320px;
}

.activity-log__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.activity-log__title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    font-weight: 700;
    color: var(--t-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.activity-log__clear {
    all: unset;
    cursor: pointer;
    color: var(--t-text-muted);
    font-size: 1rem;
    padding: 0.2rem;
    border-radius: var(--t-radius-sm);
    transition: color 0.15s, background 0.15s;
}

.activity-log__clear:hover {
    color: var(--t-danger);
    background: var(--t-danger-muted);
}

.activity-log__empty {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-align: center;
    padding: 1.5rem 0;
    font-style: italic;
    opacity: 0.6;
}

.activity-log__scroll {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}

.activity-log__list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

/* ─── Entry ─── */
.log-entry {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.45rem 0.6rem;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-card);
    border-left: 3px solid transparent;
    transition: background 0.2s;
}

.log-entry:hover {
    background: var(--t-bg-card-hover);
}

/* Severity variants */
/* .log-entry--success {
    border-left-color: var(--t-success);
}

.log-entry--danger {
    border-left-color: var(--t-danger);
}

.log-entry--warning {
    border-left-color: var(--t-warning);
}

.log-entry--info {
    border-left-color: var(--t-accent);
}

.log-entry--neutral {
    border-left-color: var(--t-text-muted);
} */

.log-entry__badge {
    font-size: 0.7rem;
    width: 1rem;
    text-align: center;
    flex-shrink: 0;
    margin-top: 0.1rem;
}

.log-entry--success .log-entry__badge {
    color: var(--t-success);
}

.log-entry--danger .log-entry__badge {
    color: var(--t-danger);
}

.log-entry--warning .log-entry__badge {
    color: var(--t-warning);
}

.log-entry--info .log-entry__badge {
    color: var(--t-accent);
}

.log-entry--neutral .log-entry__badge {
    color: var(--t-text-muted);
}

.log-entry__icon {
    font-size: 0.9rem;
    flex-shrink: 0;
    margin-top: 0.1rem;
    color: var(--t-text-secondary);
}

.log-entry--danger .log-entry__icon {
    color: var(--t-danger);
}

.log-entry--warning .log-entry__icon {
    color: var(--t-warning);
}

.log-entry__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
}

.log-entry__title {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text);
    line-height: 1.3;
}

.log-entry--danger .log-entry__title {
    color: var(--t-danger);
}

.log-entry__detail {
    font-size: 0.7rem;
    color: var(--t-text-muted);
    line-height: 1.25;
}

.log-entry__time {
    font-size: 0.65rem;
    color: var(--t-text-muted);
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 0.15rem;
    opacity: 0.7;
}

/* ─── Transition ─── */
.log-item-enter-active {
    transition: all 0.3s ease-out;
}

.log-item-leave-active {
    transition: all 0.2s ease-in;
}

.log-item-enter-from {
    opacity: 0;
    transform: translateX(-12px);
}

.log-item-leave-to {
    opacity: 0;
    transform: translateX(12px);
}

/* ─── Scrollbar ─── */
.activity-log__scroll::-webkit-scrollbar {
    width: 4px;
}

.activity-log__scroll::-webkit-scrollbar-track {
    background: transparent;
}

.activity-log__scroll::-webkit-scrollbar-thumb {
    background: var(--t-scrollbar);
    border-radius: 2px;
}

.activity-log__scroll::-webkit-scrollbar-thumb:hover {
    background: var(--t-scrollbar-hover);
}
</style>
