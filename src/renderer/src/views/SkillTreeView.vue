<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import { EventImpactBanner } from '@renderer/components/events'
import { SKILL_TREE_META } from '@renderer/data/upgrades'
import { SkillTreeGraph, SkillTreePanel } from '@renderer/components/skilltree'
import type { GraphNode } from '@renderer/components/skilltree/SkillTreeGraph.vue'

const upgrades = useUpgradeStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const skillTreeInfoSections = computed<InfoSection[]>(() => [
    {
        title: t('skilltree.info.nodes.title'),
        icon: 'mdi:circle-double',
        entries: [
            { term: t('skilltree.info.nodes.cash_cost'), desc: t('skilltree.info.nodes.cash_cost_desc') },
            { term: t('skilltree.info.nodes.binary'), desc: t('skilltree.info.nodes.binary_desc') },
            { term: t('skilltree.info.nodes.no_refund'), desc: t('skilltree.info.nodes.no_refund_desc') },
        ],
    },
    {
        title: t('skilltree.info.categories.title'),
        icon: 'mdi:shape',
        entries: [
            { term: t('skilltree.info.categories.five_trees'), desc: t('skilltree.info.categories.five_trees_desc') },
            { term: t('skilltree.info.categories.three_paths'), desc: t('skilltree.info.categories.three_paths_desc') },
            { term: t('skilltree.info.categories.capstones'), desc: t('skilltree.info.categories.capstones_desc') },
        ],
    },
    {
        title: t('skilltree.info.prerequisites.title'),
        icon: 'mdi:lock-open-variant',
        entries: [
            { term: t('skilltree.info.prerequisites.chain'), desc: t('skilltree.info.prerequisites.chain_desc') },
            { term: t('skilltree.info.prerequisites.strategy'), desc: t('skilltree.info.prerequisites.strategy_desc') },
        ],
    },
    {
        title: t('skilltree.info.effects.title'),
        icon: 'mdi:multiplication',
        entries: [
            { term: t('skilltree.info.effects.stacking'), desc: t('skilltree.info.effects.stacking_desc') },
            { term: t('skilltree.info.effects.targets'), desc: t('skilltree.info.effects.targets_desc') },
            { term: t('skilltree.info.effects.prestige_reset'), desc: t('skilltree.info.effects.prestige_reset_desc') },
        ],
    },
])

// ─── Active tab (category) ──────────────────────────────────
type CategoryId = (typeof SKILL_TREE_META)[number]['id']
const activeTab = ref<CategoryId>(SKILL_TREE_META[0].id)

// ─── Selected node for detail panel ─────────────────────────
const selectedId = ref<string | null>(null)

const selectedNode = computed(() => {
    if (!selectedId.value) return null
    return upgrades.nodes.find((n) => n.id === selectedId.value) ?? null
})

// ─── Prerequisite check helper ──────────────────────────────
function arePrereqsMet(node: { prerequisites: string[] }): boolean {
    return node.prerequisites.every((preId) => {
        const pre = upgrades.nodes.find((p) => p.id === preId)
        return pre?.purchased
    })
}

// ─── Per-tab graph nodes ────────────────────────────────────
function graphNodesForCategory(categoryId: string): GraphNode[] {
    return upgrades.nodes
        .filter((n) => n.category === categoryId)
        .map((n) => ({
            id: n.id,
            name: n.name,
            icon: n.icon,
            row: n.row,
            col: n.col,
            purchased: n.purchased,
            available: !n.purchased && arePrereqsMet(n),
            locked: !n.purchased && !arePrereqsMet(n),
            prerequisites: n.prerequisites,
        }))
}

// ─── Stats ──────────────────────────────────────────────────
const purchasedCount = computed(() => upgrades.nodes.filter((n) => n.purchased).length)

function purchasedInCategory(catId: string): number {
    return upgrades.nodes.filter((n) => n.category === catId && n.purchased).length
}

function totalInCategory(catId: string): number {
    return upgrades.nodes.filter((n) => n.category === catId).length
}

function categoryProgress(catId: string): number {
    const total = totalInCategory(catId)
    if (total === 0) return 0
    return (purchasedInCategory(catId) / total) * 100
}

// ─── Selected node prereqs detail ───────────────────────────
const selectedPrereqs = computed(() => {
    if (!selectedNode.value) return []
    return selectedNode.value.prerequisites.map((preId) => {
        const pre = upgrades.nodes.find((n) => n.id === preId)
        return { name: pre?.name ?? preId, met: pre?.purchased ?? false }
    })
})

// ─── Active category meta ───────────────────────────────────
const activeMeta = computed(() => SKILL_TREE_META.find((m) => m.id === activeTab.value)!)

// ─── Actions ────────────────────────────────────────────────
function selectNode(id: string): void {
    selectedId.value = selectedId.value === id ? null : id
}

function buySelected(): void {
    if (!selectedId.value) return
    upgrades.purchaseUpgrade(selectedId.value)
}
</script>

<template>
    <div class="page-container">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <AppIcon icon="mdi:file-tree" class="page-title-icon" />
                    {{ $t('skilltree.title') }}
                </h1>
                <p class="page-subtitle">{{ $t('skilltree.subtitle') }}</p>
            </div>
        </div>

        <!-- Event Impact -->
        <EventImpactBanner route-name="skills" />

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-chip">
                <AppIcon icon="mdi:check-decagram" class="text-success" />
                <span class="stat-chip-label">{{ $t('skilltree.unlocked') }}</span>
                <span class="stat-chip-value">{{ purchasedCount }} / {{ upgrades.nodes.length }}</span>
            </div>
            <div class="stat-chip">
                <AppIcon icon="mdi:cash" />
                <span class="stat-chip-label">{{ $t('skilltree.balance') }}</span>
                <span class="stat-chip-value">{{ formatCash(player.cash) }}</span>
            </div>
        </div>

        <!-- Category Selector -->
        <div class="st-categories">
            <UButton variant="tab" v-for="meta in SKILL_TREE_META" :key="meta.id" :active="activeTab === meta.id"
                :style="{ '--_cat-accent': meta.accent }" @click="activeTab = meta.id; selectedId = null"
                class="st-cat-btn">
                <div class="st-cat-icon-wrap">
                    <AppIcon :icon="meta.icon" class="st-cat-icon" />
                </div>
                <div class="st-cat-info">
                    <span class="st-cat-name">{{ meta.name }}</span>
                    <div class="st-cat-progress-row">
                        <div class="st-cat-progress-bar">
                            <div class="st-cat-progress-fill" :style="{ width: categoryProgress(meta.id) + '%' }" />
                        </div>
                        <span class="st-cat-counter">{{ purchasedInCategory(meta.id) }}/{{
                            totalInCategory(meta.id) }}</span>
                    </div>
                </div>
            </UButton>
        </div>

        <!-- Active Category Header -->
        <div class="st-active-header" :style="{ '--_active-accent': activeMeta.accent }">
            <AppIcon :icon="activeMeta.icon" class="st-active-icon" />
            <div class="st-active-info">
                <h2 class="st-active-name">{{ activeMeta.name }}</h2>
                <span class="st-active-stats">{{ purchasedInCategory(activeMeta.id) }} / {{
                    totalInCategory(activeMeta.id) }} {{ $t('skilltree.unlocked').toLowerCase() }}</span>
            </div>
            <div class="st-active-progress-ring">
                <svg viewBox="0 0 40 40" class="st-ring-svg">
                    <circle cx="20" cy="20" r="17" fill="none" stroke="var(--t-border)" stroke-width="3" />
                    <circle cx="20" cy="20" r="17" fill="none" stroke="var(--_active-accent)" stroke-width="3"
                        stroke-linecap="round" :stroke-dasharray="`${categoryProgress(activeMeta.id) * 1.068} 200`"
                        transform="rotate(-90 20 20)" class="st-ring-progress" />
                </svg>
                <span class="st-ring-pct">{{ Math.round(categoryProgress(activeMeta.id)) }}%</span>
            </div>
        </div>

        <!-- Tree + Panel Layout -->
        <div class="st-workspace">
            <!-- Graph for active category -->
            <div class="st-graph-scroll">
                <SkillTreeGraph v-for="meta in SKILL_TREE_META" v-show="activeTab === meta.id" :key="meta.id"
                    :nodes="graphNodesForCategory(meta.id)" :selected-id="selectedId" :accent="meta.accent"
                    @select="selectNode" />
            </div>

            <!-- Detail Panel -->
            <Transition name="panel-slide">
                <SkillTreePanel v-if="selectedNode" :name="selectedNode.name" :description="selectedNode.description"
                    :effect-description="selectedNode.effectDescription" :icon="selectedNode.icon"
                    :cost="formatCash(upgrades.getNodeCost(selectedNode.id))" :purchased="selectedNode.purchased"
                    :available="!selectedNode.purchased && arePrereqsMet(selectedNode)"
                    :can-afford="player.cash.gte(upgrades.getNodeCost(selectedNode.id))" :prereqs="selectedPrereqs"
                    :accent="activeMeta.accent" @buy="buySelected" />
            </Transition>
        </div>

        <!-- Info Panel -->
        <InfoPanel :title="$t('skilltree.info_title')" :description="$t('skilltree.info_desc')"
            :sections="skillTreeInfoSections" />
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════
   CATEGORY SELECTOR — Horizontal cards with progress bars
   ═══════════════════════════════════════════════════════════════════ */
.st-categories {
    display: flex;
    justify-content: space-evenly;
    gap: var(--t-space-2);
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: thin;
    scrollbar-color: var(--t-border) transparent;
}

.st-cat-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: var(--t-radius-sm);
    background: color-mix(in srgb, var(--_cat-accent, var(--t-accent)) 12%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.st-cat-icon {
    font-size: 1.05rem;
    color: var(--_cat-accent, var(--t-accent));
}

.st-cat-info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
    min-width: 0;
}

.st-cat-name {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    white-space: nowrap;
}

.st-cat-progress-row {
    display: flex;
    width: 100%;
    align-items: center;
    gap: var(--t-space-2);
}

.st-cat-progress-bar {
    flex: 1;
    height: 4px;
    border-radius: var(--t-radius-xs);
    background: var(--t-bg-muted);
    overflow: hidden;
}

.st-cat-progress-fill {
    height: 100%;
    border-radius: var(--t-radius-xs);
    background: var(--_cat-accent, var(--t-accent));
    transition: width var(--t-transition-normal);
}

.st-cat-counter {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
    white-space: nowrap;
}

/* ═══════════════════════════════════════════════════════════════════
   ACTIVE CATEGORY HEADER — bar with icon, name, and progress ring
   ═══════════════════════════════════════════════════════════════════ */
.st-active-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-4);
    padding: var(--t-space-4) var(--t-space-5);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    /* border-left: 3px solid var(--_active-accent, var(--t-accent)); */
}

.st-active-icon {
    font-size: 1.4rem;
    color: var(--_active-accent, var(--t-accent));
}

.st-active-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.st-active-name {
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    margin: 0;
}

.st-active-stats {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

/* ── Progress ring ── */
.st-active-progress-ring {
    position: relative;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
}

.st-ring-svg {
    width: 100%;
    height: 100%;
}

.st-ring-progress {
    transition: stroke-dasharray 0.4s ease;
}

.st-ring-pct {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
    color: var(--t-text-secondary);
}

.st-cat-btn {
    width: 100%;
    display: flex;
    justify-content: stretch;
    align-items: center;
    background: var(--t-bg-card);
    border-radius: var(--t-radius-md) var(--t-radius-md) 0 0;
}

/* ═══════════════════════════════════════════════════════════════════
   WORKSPACE — Graph + Panel side by side
   ═══════════════════════════════════════════════════════════════════ */
.st-workspace {
    display: flex;
    gap: var(--t-space-5);
    flex: 1;
    min-height: 400px;
    max-height: calc(100vh - 320px);
    position: relative;
    overflow: hidden;
}

.st-graph-scroll {
    flex: 1;
    overflow: auto;
    display: flex;
    justify-content: center;
    padding: var(--t-space-4) 0;
    scrollbar-width: thin;
    scrollbar-color: var(--t-scrollbar-thumb) var(--t-scrollbar-track);
}

/* Keep the panel fixed on right side */
.st-workspace> :deep(.skill-panel) {
    align-self: stretch;
    overflow-y: auto;
    flex-shrink: 0;
    max-height: 100%;
}

/* ═══════════════════════════════════════════════════════════════════
   PANEL SLIDE TRANSITION
   ═══════════════════════════════════════════════════════════════════ */
.panel-slide-enter-active {
    transition:
        opacity 0.25s ease-out,
        transform 0.25s ease-out;
}

.panel-slide-leave-active {
    transition:
        opacity 0.15s ease-in,
        transform 0.15s ease-in;
}

.panel-slide-enter-from {
    opacity: 0;
    transform: translateX(16px);
}

.panel-slide-leave-to {
    opacity: 0;
    transform: translateX(10px);
}
</style>
