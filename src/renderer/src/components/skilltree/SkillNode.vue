<script setup lang="ts">
/**
 * SkillNode — A single circular node in the skill tree.
 * Displays an icon in a ring whose color reflects the node state.
 */
import AppIcon from '@renderer/components/AppIcon.vue'

defineProps<{
    icon: string
    name: string
    purchased: boolean
    available: boolean
    locked: boolean
    selected: boolean
    accent: string
}>()

defineEmits<{ select: [] }>()
</script>

<template>
    <button class="skill-node" :class="{ purchased, available, locked, selected }" :style="{ '--node-accent': accent }"
        @click="$emit('select')">
        <div class="node-ring">
            <div class="node-inner">
                <AppIcon :icon="icon" class="node-icon" />
            </div>
        </div>
        <span class="node-label">{{ name }}</span>
    </button>
</template>

<style scoped>
.skill-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    outline: none;
    width: 80px;
    -webkit-tap-highlight-color: transparent;
}

/* ── Ring ─────────────────────────────── */
.node-ring {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    padding: 3px;
    background: var(--t-border);
    transition:
        background var(--t-transition-normal),
        box-shadow var(--t-transition-normal),
        transform var(--t-transition-normal);
}

.node-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--t-bg-card);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--t-transition-normal);
}

.node-icon {
    font-size: 1.35rem;
    color: var(--t-text-muted);
    transition: color var(--t-transition-normal);
}

/* ── Label ────────────────────────────── */
.node-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--t-text-muted);
    text-align: center;
    line-height: 1.2;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color var(--t-transition-normal);
}

/* ── States ───────────────────────────── */

/* Purchased: solid green ring */
.skill-node.purchased .node-ring {
    background: var(--t-success);
}

.skill-node.purchased .node-inner {
    background: var(--t-success-muted);
}

.skill-node.purchased .node-icon {
    color: var(--t-success);
}

.skill-node.purchased .node-label {
    color: var(--t-success);
}

/* Available: accent ring, bright icon */
.skill-node.available .node-ring {
    background: var(--node-accent, var(--t-accent));
}

.skill-node.available .node-icon {
    color: var(--t-text);
}

.skill-node.available .node-label {
    color: var(--t-text-secondary);
}

.skill-node.available:hover .node-ring {
    box-shadow: 0 0 12px 2px color-mix(in srgb, var(--node-accent, var(--t-accent)) 40%, transparent);
    transform: scale(1.08);
}

.skill-node.available:hover .node-label {
    color: var(--t-text);
}

/* Locked: dimmed */
.skill-node.locked {
    opacity: 0.4;
    cursor: default;
}

/* Selected: thicker ring + glow */
.skill-node.selected .node-ring {
    box-shadow: 0 0 0 3px var(--t-bg-base), 0 0 0 5px var(--node-accent, var(--t-accent));
    transform: scale(1.1);
}

.skill-node.selected .node-label {
    color: var(--t-text);
}
</style>
