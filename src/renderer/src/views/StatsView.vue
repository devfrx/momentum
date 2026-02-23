<script setup lang="ts">
/**
 * StatsView — Unified Statistics hub.
 *
 * Aggregates every stat from all game systems into categorized,
 * collapsible groups via UAccordion. Replaces scattered stats-bars
 * throughout the app.
 */
import { ref, computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStats } from '@renderer/composables/useStats'
import { UAccordion } from '@renderer/components/ui'
import { EventImpactBanner } from '@renderer/components/events'
import AppIcon from '@renderer/components/AppIcon.vue'

const { t } = useI18n()
const { allGroups } = useStats()

// ─── Search ──────────────────────────────────────────────────
const searchQuery = ref('')

const filteredGroups = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return allGroups.value

    return allGroups.value
        .map(group => {
            const matchingItems = group.items.filter(
                item =>
                    t(item.labelKey).toLowerCase().includes(q) ||
                    item.value.toLowerCase().includes(q)
            )
            if (matchingItems.length === 0) return null
            return { ...group, items: matchingItems }
        })
        .filter(Boolean) as typeof allGroups.value
})

// ─── Open state per group ───────────────────────────────────
const openStates = reactive<Record<string, boolean>>({})

watch(allGroups, (groups) => {
    groups.forEach(g => {
        if (!(g.id in openStates)) openStates[g.id] = true
    })
}, { immediate: true })

const allOpen = computed(() =>
    filteredGroups.value.every(g => openStates[g.id] !== false)
)

function toggleAll(): void {
    const next = !allOpen.value
    filteredGroups.value.forEach(g => { openStates[g.id] = next })
}

// ─── Summary ────────────────────────────────────────────────
const totalStats = computed(() =>
    allGroups.value.reduce((sum, g) => sum + g.items.length, 0)
)
</script>

<template>
    <div class="stats-page">
        <!-- Event Impact -->
        <EventImpactBanner route-name="stats" />

        <!-- ═══ Header ═══ -->
        <section class="stats-header">
            <div class="stats-header-left">
                <div class="stats-header-icon-wrap">
                    <AppIcon icon="mdi:chart-box" class="stats-header-icon" />
                </div>
                <div>
                    <h1 class="stats-title">{{ $t('stats.title') }}</h1>
                    <p class="stats-subtitle">
                        {{ $t('stats.subtitle', { count: totalStats, groups: allGroups.length }) }}
                    </p>
                </div>
            </div>

            <div class="stats-header-actions">
                <div class="stats-search">
                    <AppIcon icon="mdi:magnify" class="stats-search-icon" />
                    <input v-model="searchQuery" type="text" class="stats-search-input"
                        :placeholder="$t('stats.search_placeholder')" />
                </div>
                <button class="stats-toggle-btn" @click="toggleAll">
                    <AppIcon :icon="allOpen ? 'mdi:unfold-less-horizontal' : 'mdi:unfold-more-horizontal'" />
                    <span>{{ allOpen ? $t('stats.collapse_all') : $t('stats.expand_all') }}</span>
                </button>
            </div>
        </section>

        <!-- ═══ Accordion Groups ═══ -->
        <section class="stats-groups">
            <UAccordion v-for="group in filteredGroups" :key="group.id" :title="$t(group.titleKey)" :icon="group.icon"
                :badge="group.items.length" v-model="openStates[group.id]">
                <div class="sg-grid">
                    <div v-for="item in group.items" :key="item.labelKey" class="sg-item">
                        <div class="sg-item-icon-wrap">
                            <AppIcon :icon="item.icon" class="sg-item-icon" />
                        </div>
                        <div class="sg-item-text">
                            <span class="sg-item-value" :class="item.colorClass">{{ item.value }}</span>
                            <span class="sg-item-label">{{ $t(item.labelKey) }}</span>
                        </div>
                    </div>
                </div>
            </UAccordion>

            <div v-if="filteredGroups.length === 0" class="stats-empty">
                <AppIcon icon="mdi:chart-box-outline" class="stats-empty-icon" />
                <p>{{ $t('stats.no_results') }}</p>
            </div>
        </section>
    </div>
</template>

<style scoped>
.stats-page {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    padding: var(--t-space-4);
    max-width: 1200px;
}

/* ─── Header ─── */
.stats-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--t-space-4);
    flex-wrap: wrap;
}

.stats-header-left {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.stats-header-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.stats-header-icon {
    font-size: 1.4rem;
    color: var(--t-text-secondary);
}

.stats-title {
    font-size: var(--t-font-size-xl);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    margin: 0;
}

.stats-subtitle {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    margin: 0.15rem 0 0;
}

/* ─── Actions ─── */
.stats-header-actions {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.stats-search {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: 0.35rem 0.65rem;
    transition: border-color var(--t-transition-fast);
}

.stats-search:focus-within {
    border-color: var(--t-border-hover);
}

.stats-search-icon {
    font-size: 0.85rem;
    color: var(--t-text-muted);
    flex-shrink: 0;
}

.stats-search-input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--t-text);
    font-size: var(--t-font-size-sm);
    font-family: inherit;
    width: 160px;
}

.stats-search-input::placeholder {
    color: var(--t-text-muted);
}

.stats-toggle-btn {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    font-family: inherit;
    cursor: pointer;
    padding: 0.35rem 0.65rem;
    transition: all var(--t-transition-fast);
}

.stats-toggle-btn:hover {
    border-color: var(--t-border-hover);
    color: var(--t-text);
}

/* ─── Accordion wrapper ─── */
.stats-groups {
    display: flex;
    flex-direction: column;
}

/* ─── Stat grid inside each accordion ─── */
.sg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--t-space-3);
    padding: var(--t-space-3) 0 var(--t-space-1);
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

/* ─── Empty State ─── */
.stats-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-8) 0;
    gap: var(--t-space-3);
    color: var(--t-text-muted);
}

.stats-empty-icon {
    font-size: 2.5rem;
    opacity: 0.4;
}

.stats-empty p {
    margin: 0;
    font-size: var(--t-font-size-sm);
}
</style>
