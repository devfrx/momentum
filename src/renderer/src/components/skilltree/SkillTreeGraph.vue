<script setup lang="ts">
/**
 * SkillTreeGraph — SVG-based tree visualization for one skill category.
 * Lays out nodes in a grid defined by each node's row/col and draws
 * curved connection paths between prerequisites and dependents.
 */
import { computed } from 'vue'
import SkillNode from './SkillNode.vue'

// ─── Layout constants ──────────────────────────────────────
const NODE_W = 80 // px — node button width
const NODE_H = 76 // px — node button height (circle + label)
const COL_GAP = 140 // px — center-to-center horizontal
const ROW_GAP = 110 // px — center-to-center vertical
const PAD = 24 // px — canvas padding

export interface GraphNode {
    id: string
    name: string
    icon: string
    row: number
    col: number
    purchased: boolean
    available: boolean
    locked: boolean
    prerequisites: string[]
}

const props = defineProps<{
    nodes: GraphNode[]
    selectedId: string | null
    accent: string
}>()

defineEmits<{ select: [id: string] }>()

// ─── Node map ──────────────────────────────────────────────
const nodeMap = computed(() => new Map(props.nodes.map((n) => [n.id, n])))

// ─── Canvas dimensions ─────────────────────────────────────
const maxRow = computed(() => Math.max(...props.nodes.map((n) => n.row), 0))
const maxCol = computed(() => Math.max(...props.nodes.map((n) => n.col), 0))
const canvasW = computed(() => maxCol.value * COL_GAP + NODE_W + PAD * 2)
const canvasH = computed(() => maxRow.value * ROW_GAP + NODE_H + PAD * 2)

// ─── Coordinate helpers ────────────────────────────────────
/** Center X of the node circle for SVG lines */
function cx(col: number): number {
    return col * COL_GAP + NODE_W / 2 + PAD
}

/** Center Y of the node circle (center of the 56px ring, not label) */
function cy(row: number): number {
    return row * ROW_GAP + 28 + PAD // 28 = half of 56px ring
}

/** CSS left for positioning the node button */
function nodeLeft(col: number): string {
    return `${col * COL_GAP + PAD}px`
}

/** CSS top for positioning the node button */
function nodeTop(row: number): string {
    return `${row * ROW_GAP + PAD}px`
}

// ─── Connection paths (curved) ─────────────────────────────
interface Connection {
    path: string
    state: 'purchased' | 'available' | 'locked'
    key: string
}

const connections = computed<Connection[]>(() => {
    const paths: Connection[] = []
    for (const node of props.nodes) {
        for (const preId of node.prerequisites) {
            const parent = nodeMap.value.get(preId)
            if (!parent) continue

            const state =
                parent.purchased && node.purchased
                    ? 'purchased'
                    : parent.purchased && node.available
                        ? 'available'
                        : 'locked'

            const x1 = cx(parent.col)
            const y1 = cy(parent.row) + 28 // bottom of parent ring
            const x2 = cx(node.col)
            const y2 = cy(node.row) - 28   // top of child ring

            // Cubic bezier: vertical ease-out from parent, ease-in to child
            const midY = (y1 + y2) / 2
            const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`

            paths.push({ path, state, key: `${preId}-${node.id}` })
        }
    }
    return paths
})
</script>

<template>
    <div class="tree-canvas" :style="{ width: canvasW + 'px', height: canvasH + 'px' }">
        <!-- SVG connection paths -->
        <svg class="tree-lines" :viewBox="`0 0 ${canvasW} ${canvasH}`" :width="canvasW" :height="canvasH">
            <defs>
                <linearGradient id="grad-purchased" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--t-success)" stop-opacity="0.8" />
                    <stop offset="100%" stop-color="var(--t-success)" stop-opacity="0.5" />
                </linearGradient>
            </defs>
            <path v-for="conn in connections" :key="conn.key" :d="conn.path" :class="`conn-${conn.state}`"
                fill="none" />
        </svg>

        <!-- Node buttons -->
        <SkillNode v-for="node in nodes" :key="node.id" :icon="node.icon" :name="node.name" :purchased="node.purchased"
            :available="node.available" :locked="node.locked" :selected="selectedId === node.id" :accent="accent"
            class="tree-node" :style="{ left: nodeLeft(node.col), top: nodeTop(node.row) }"
            @select="$emit('select', node.id)" />
    </div>
</template>

<style scoped>
.tree-canvas {
    position: relative;
    margin: 0 auto;
}

/* SVG overlay */
.tree-lines {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
}

.tree-lines path {
    stroke-width: 2.5;
    stroke-linecap: round;
    transition:
        stroke var(--t-transition-normal),
        opacity var(--t-transition-normal);
}

.conn-purchased {
    stroke: var(--t-success);
    opacity: 0.65;
}

.conn-available {
    stroke: var(--t-text-secondary);
    opacity: 0.45;
    stroke-dasharray: 8 4;
    animation: dash-flow 1.5s linear infinite;
}

.conn-locked {
    stroke: var(--t-border);
    stroke-dasharray: 4 6;
    opacity: 0.25;
}

@keyframes dash-flow {
    to {
        stroke-dashoffset: -24;
    }
}

/* Node positioning */
.tree-node {
    position: absolute;
}
</style>
