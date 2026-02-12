<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'
import { SKILL_TREE_META } from '@renderer/data/upgrades'
import { SkillTreeGraph, SkillTreePanel } from '@renderer/components/skilltree'
import type { GraphNode } from '@renderer/components/skilltree/SkillTreeGraph.vue'

const upgrades = useUpgradeStore()
const player = usePlayerStore()
const { formatCash } = useFormat()

// ─── Active tab (category) ──────────────────────────────────
type CategoryId = typeof SKILL_TREE_META[number]['id']
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

// ─── Selected node prereqs detail ───────────────────────────
const selectedPrereqs = computed(() => {
    if (!selectedNode.value) return []
    return selectedNode.value.prerequisites.map((preId) => {
        const pre = upgrades.nodes.find((n) => n.id === preId)
        return { name: pre?.name ?? preId, met: pre?.purchased ?? false }
    })
})

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

        <!-- Category Tabs -->
        <div class="tree-tabs">
            <button v-for="meta in SKILL_TREE_META" :key="meta.id" class="tree-tab"
                :class="{ active: activeTab === meta.id }" :style="{ '--tab-accent': meta.accent }"
                @click="activeTab = meta.id; selectedId = null">
                <AppIcon :icon="meta.icon" class="tab-icon" />
                <span class="tab-label">{{ meta.name }}</span>
                <span class="tab-counter">{{ purchasedInCategory(meta.id) }}/{{ totalInCategory(meta.id) }}</span>
            </button>
        </div>

        <!-- Tree + Panel Layout -->
        <div class="tree-layout">
            <!-- Graph for active category -->
            <div class="tree-scroll">
                <SkillTreeGraph v-for="meta in SKILL_TREE_META" v-show="activeTab === meta.id" :key="meta.id"
                    :nodes="graphNodesForCategory(meta.id)" :selected-id="selectedId" :accent="meta.accent"
                    @select="selectNode" />
            </div>

            <!-- Detail Panel -->
            <Transition name="panel-slide">
                <SkillTreePanel v-if="selectedNode" :key="selectedNode.id" :name="selectedNode.name"
                    :description="selectedNode.description" :effect-description="selectedNode.effectDescription"
                    :icon="selectedNode.icon" :cost="formatCash(upgrades.getNodeCost(selectedNode.id))"
                    :purchased="selectedNode.purchased"
                    :available="!selectedNode.purchased && arePrereqsMet(selectedNode)"
                    :can-afford="player.cash.gte(upgrades.getNodeCost(selectedNode.id))" :prereqs="selectedPrereqs"
                    :accent="SKILL_TREE_META.find(m => m.id === activeTab)?.accent ?? 'var(--t-text-secondary)'"
                    @buy="buySelected" />
            </Transition>
        </div>
    </div>
</template>

<style scoped>
/* ── Category tabs ───────────────────── */
.tree-tabs {
    display: flex;
    gap: var(--t-space-2);
    overflow-x: auto;
    padding-bottom: 2px;
}

.tree-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text-secondary);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition:
        background var(--t-transition-normal),
        border-color var(--t-transition-normal),
        color var(--t-transition-normal);
}

.tree-tab:hover {
    border-color: var(--t-border-hover);
    color: var(--t-text);
}

.tree-tab.active {
    border-color: var(--tab-accent, var(--t-accent));
    color: var(--t-text);
    background: color-mix(in srgb, var(--tab-accent, var(--t-accent)) 8%, var(--t-bg-card));
}

.tab-icon {
    font-size: 1.1rem;
}

.tab-label {
    /* visible on md+ */
}

.tab-counter {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
}

/* ── Layout ──────────────────────────── */
.tree-layout {
    display: flex;
    gap: var(--t-space-5);
    flex: 1;
    min-height: 0;
    position: relative;
}

.tree-scroll {
    flex: 1;
    overflow: auto;
    display: flex;
    justify-content: center;
    padding: var(--t-space-4) 0;
}

/* Keep the panel fixed on right side */
.tree-layout> :deep(.skill-panel) {
    position: sticky;
    top: 0;
    align-self: flex-start;
    max-height: calc(100vh - 280px);
    overflow-y: auto;
    flex-shrink: 0;
}

/* ── Panel slide transition ──────────── */
.panel-slide-enter-active,
.panel-slide-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
    opacity: 0;
    transform: translateX(12px);
}
</style>
