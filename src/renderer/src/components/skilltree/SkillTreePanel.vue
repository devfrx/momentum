<script setup lang="ts">
/**
 * SkillTreePanel — Detail sidebar for the currently selected skill node.
 * Shows name, description, effect, cost, prerequisites, and a buy button.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'

defineProps<{
    name: string
    description: string
    effectDescription: string
    icon: string
    cost: string
    purchased: boolean
    available: boolean
    canAfford: boolean
    /** Names of prerequisite nodes with their purchase status */
    prereqs: Array<{ name: string; met: boolean }>
    accent: string
}>()

defineEmits<{ buy: [] }>()
</script>

<template>
    <div class="skill-panel" :style="{ '--panel-accent': accent }">
        <!-- Header with accent left border -->
        <div class="panel-header">
            <div class="panel-icon-box">
                <AppIcon :icon="icon" class="panel-icon" />
            </div>
            <div class="panel-title-area">
                <h3 class="panel-name">{{ name }}</h3>
                <span v-if="purchased" class="panel-badge purchased-badge">
                    <AppIcon icon="mdi:check-circle" />
                    {{ $t('skilltree.purchased') }}
                </span>
                <span v-else-if="!available" class="panel-badge locked-badge">
                    <AppIcon icon="mdi:lock" />
                    {{ $t('common.locked') }}
                </span>
                <span v-else class="panel-badge available-badge">
                    <AppIcon icon="mdi:lock-open-variant" />
                    {{ $t('skilltree.available') }}
                </span>
            </div>
        </div>

        <!-- Divider -->
        <div class="panel-divider" />

        <!-- Description -->
        <p class="panel-desc">{{ description }}</p>

        <!-- Effect -->
        <div class="panel-section">
            <span class="panel-section-label">{{ $t('skilltree.effect') }}</span>
            <div class="panel-effect">
                <AppIcon icon="mdi:flash" class="effect-icon" />
                <span>{{ effectDescription }}</span>
            </div>
        </div>

        <!-- Cost -->
        <div v-if="!purchased" class="panel-section">
            <span class="panel-section-label">{{ $t('skilltree.cost') }}</span>
            <div class="panel-cost" :class="{ affordable: canAfford, expensive: !canAfford }">
                <AppIcon icon="mdi:cash" />
                <span>{{ cost }}</span>
            </div>
        </div>

        <!-- Prerequisites -->
        <div v-if="prereqs.length > 0" class="panel-section">
            <span class="panel-section-label">{{ $t('skilltree.prerequisites') }}</span>
            <div class="panel-prereqs">
                <div v-for="(pre, idx) in prereqs" :key="idx" class="prereq-item" :class="{ met: pre.met }">
                    <AppIcon :icon="pre.met ? 'mdi:check-circle' : 'mdi:circle-outline'" />
                    <span>{{ pre.name }}</span>
                </div>
            </div>
        </div>

        <!-- Action -->
        <div class="panel-action">
            <Button v-if="!purchased" :label="available ? $t('skilltree.unlock_skill') : $t('common.locked')"
                :icon="available ? 'pi pi-lock-open' : 'pi pi-lock'"
                :severity="available && canAfford ? undefined : 'secondary'" :disabled="!available || !canAfford"
                class="w-full" @click="$emit('buy')" />
            <div v-else class="panel-owned-indicator">
                <AppIcon icon="mdi:check-decagram" />
                <span>{{ $t('skilltree.purchased') }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.skill-panel {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    /* border-left: 3px solid var(--panel-accent, var(--t-accent)); */
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-5);
    box-shadow: var(--t-shadow-sm);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    min-width: 260px;
    max-width: 320px;
    scrollbar-width: thin;
    scrollbar-color: var(--t-border) transparent;
}

/* ── Header ──────────────────────────── */
.panel-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.panel-icon-box {
    width: 48px;
    height: 48px;
    border-radius: var(--t-radius-md);
    background: color-mix(in srgb, var(--panel-accent, var(--t-accent)) 12%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.panel-icon {
    font-size: 1.5rem;
    color: var(--panel-accent, var(--t-accent));
}

.panel-title-area {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
}

.panel-name {
    font-size: var(--t-font-size-lg);
    font-weight: 700;
    color: var(--t-text);
    margin: 0;
}

.panel-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-xs);
    font-weight: 600;
}

.purchased-badge {
    color: var(--t-success);
}

.available-badge {
    color: var(--panel-accent, var(--t-accent));
}

.locked-badge {
    color: var(--t-text-muted);
}

/* ── Divider ─────────────────────────── */
.panel-divider {
    height: 1px;
    background: var(--t-border);
    margin: 0 calc(var(--t-space-1) * -1);
}

/* ── Description ─────────────────────── */
.panel-desc {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    line-height: 1.5;
    margin: 0;
}

/* ── Sections ────────────────────────── */
.panel-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.panel-section-label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--t-text-muted);
    font-weight: 600;
}

.panel-effect {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-success-muted);
    border-radius: var(--t-radius-sm);
    border: 1px solid color-mix(in srgb, var(--t-success) 15%, transparent);
}

.effect-icon {
    color: var(--t-success);
}

.panel-cost {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    font-family: var(--t-font-mono);
    padding: var(--t-space-2) var(--t-space-3);
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
}

.panel-cost.affordable {
    color: var(--t-success);
    border-color: color-mix(in srgb, var(--t-success) 20%, transparent);
}

.panel-cost.expensive {
    color: var(--t-danger);
    border-color: color-mix(in srgb, var(--t-danger) 20%, transparent);
}

/* ── Prerequisites ───────────────────── */
.panel-prereqs {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.prereq-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.prereq-item.met {
    color: var(--t-success);
}

/* ── Action ──────────────────────────── */
.panel-action {
    margin-top: auto;
}

.panel-owned-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-success-muted);
    border: 1px solid color-mix(in srgb, var(--t-success) 20%, transparent);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-success);
}
</style>
