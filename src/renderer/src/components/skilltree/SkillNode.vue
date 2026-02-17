<script setup lang="ts">
/**
 * SkillNode — A single circular node in the skill tree.
 * Displays an icon in a ring whose color reflects the node state.
 * States: purchased (green), available (accent pulse), locked (dimmed), selected (glow).
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'

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
    <UButton unstyled class="skill-node" :class="{ purchased, available, locked, selected }" :style="{ '--node-accent': accent }"
        @click="$emit('select')">
        <div class="node-ring">
            <div class="node-inner">
                <AppIcon :icon="icon" class="node-icon" />
            </div>
        </div>
        <span class="node-label">{{ name }}</span>
    </UButton>
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

.skill-node:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}

.skill-node:active {
    transform: scale(0.98);
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
    font-size: 1.25rem;
    color: var(--t-text-muted);
    transition: color var(--t-transition-normal);
}

/* ── Label ────────────────────────────── */
.node-label {
    font-size: 0.7rem;
    font-weight: var(--t-font-semibold);
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

/* Purchased: solid green ring with checkmark-like glow */
.skill-node.purchased .node-ring {
    background: var(--t-success);
    box-shadow: 0 0 8px 0 color-mix(in srgb, var(--t-success) 30%, transparent);
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

/* Available: accent ring, bright icon, subtle pulse */
.skill-node.available .node-ring {
    background: var(--node-accent, var(--t-accent));
    animation: node-pulse 2.5s ease-in-out infinite;
}

.skill-node.available .node-icon {
    color: var(--t-text);
}

.skill-node.available .node-label {
    color: var(--t-text-secondary);
}

.skill-node.available:hover .node-ring {
    box-shadow: 0 0 14px 3px color-mix(in srgb, var(--node-accent, var(--t-accent)) 45%, transparent);
    transform: scale(1.12);
    animation: none;
}

.skill-node.available:hover .node-label {
    color: var(--t-text);
}

/* Locked: dimmed */
.skill-node.locked {
    opacity: 0.35;
    cursor: default;
}

.skill-node.locked:hover .node-ring {
    transform: none;
    box-shadow: none;
}

/* Selected: thicker ring + glow */
.skill-node.selected .node-ring {
    box-shadow: 0 0 0 3px var(--t-bg-base), 0 0 0 5px var(--node-accent, var(--t-accent)),
        0 0 16px 2px color-mix(in srgb, var(--node-accent, var(--t-accent)) 25%, transparent);
    transform: scale(1.1);
    animation: none;
}

.skill-node.selected .node-label {
    color: var(--t-text);
}

/* ── Animations ──────────────────────── */
@keyframes node-pulse {

    0%,
    100% {
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--node-accent, var(--t-accent)) 20%, transparent);
    }

    50% {
        box-shadow: 0 0 10px 3px color-mix(in srgb, var(--node-accent, var(--t-accent)) 25%, transparent);
    }
}
</style>
