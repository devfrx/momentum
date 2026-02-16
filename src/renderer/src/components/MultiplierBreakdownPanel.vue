<script setup lang="ts">
import { ref } from 'vue'
import { useMultipliers } from '@renderer/composables/useMultipliers'
import AppIcon from '@renderer/components/AppIcon.vue'

const emit = defineEmits<{ close: [] }>()

const { breakdowns } = useMultipliers()

const expandedCategory = ref<string | null>(null)

function toggleCategory(id: string): void {
    expandedCategory.value = expandedCategory.value === id ? null : id
}
</script>

<template>
    <Teleport to="body">
        <div class="mp-overlay" @click.self="emit('close')">
            <div class="mp-panel">
                <div class="mp-header">
                    <div class="mp-title">
                        <AppIcon icon="mdi:chart-bar" class="title-icon" />
                        <h2>{{ $t('multipliers.title') }}</h2>
                    </div>
                    <button class="close-btn" @click="emit('close')">
                        <AppIcon icon="mdi:close" />
                    </button>
                </div>

                <div class="mp-body">
                    <div v-for="bd in breakdowns" :key="bd.category.id" class="mp-category"
                        :class="{ expanded: expandedCategory === bd.category.id, 'has-bonus': bd.hasBonus }">
                        <div class="cat-header" @click="toggleCategory(bd.category.id)">
                            <div class="cat-left">
                                <AppIcon :icon="bd.category.icon" class="cat-icon" />
                                <span class="cat-label">{{ $t(bd.category.labelKey) }}</span>
                                <span v-if="bd.category.eraAffected" class="era-badge"
                                    :title="$t('multipliers.era_affected_tip')">
                                    <AppIcon icon="mdi:shield-crown" class="era-badge-icon" />
                                    {{ $t('multipliers.era_affected') }}
                                </span>
                            </div>
                            <div class="cat-right">
                                <span class="cat-total" :class="{ active: bd.hasBonus }">
                                    {{ bd.totalFormatted }}
                                </span>
                                <AppIcon
                                    :icon="expandedCategory === bd.category.id ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                                    class="cat-chevron" />
                            </div>
                        </div>

                        <transition name="expand">
                            <div v-if="expandedCategory === bd.category.id" class="cat-details">
                                <div v-if="bd.sources.length === 0" class="no-sources">
                                    {{ $t('multipliers.no_bonuses') }}
                                </div>
                                <div v-for="(src, i) in bd.sources" :key="i" class="source-line">
                                    <div class="source-left">
                                        <AppIcon :icon="src.icon" class="source-icon" />
                                        <span class="source-name">{{ src.sourceParam ? $t(src.sourceKey, {
                                            name:
                                                src.sourceParam
                                        }) : $t(src.sourceKey) }}</span>
                                    </div>
                                    <span class="source-value">{{ src.value }}</span>
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.mp-overlay {
    position: fixed;
    inset: 0;
    background: var(--t-overlay);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(3px);
    padding-top: calc(var(--t-header-height, 40px) + 8px);
}

.mp-panel {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    width: 440px;
    max-width: 95vw;
    max-height: calc(100vh - var(--t-header-height, 40px) - 32px);
    display: flex;
    flex-direction: column;
    box-shadow: 0 16px 48px var(--t-overlay-light);
}

.mp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--t-border);
    flex-shrink: 0;
}

.mp-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.title-icon {
    font-size: 1.25rem;
    color: var(--t-accent);
}

.mp-title h2 {
    font-size: var(--t-font-size-base);
    font-weight: 700;
    color: var(--t-text);
    margin: 0;
}

.close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    color: var(--t-text-muted);
    cursor: pointer;
    border-radius: var(--t-radius-sm);
    transition: all 0.15s;
}

.close-btn:hover {
    background: var(--t-bg-muted);
    color: var(--t-text);
}

.mp-body {
    overflow-y: auto;
    padding: 0.5rem;
    flex: 1;
}

.mp-category {
    border-radius: var(--t-radius-md);
    margin-bottom: 2px;
    overflow: hidden;
}

.cat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    border-radius: var(--t-radius-md);
    transition: background 0.15s;
}

.cat-header:hover {
    background: var(--t-bg-muted);
}

.cat-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.cat-icon {
    font-size: 1rem;
    color: var(--t-text-muted);
}

.has-bonus .cat-icon {
    color: var(--t-accent);
}

.cat-label {
    font-size: var(--t-font-size-sm);
    font-weight: 500;
    color: var(--t-text-secondary);
}

.era-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    font-size: 0.6rem;
    font-weight: 600;
    padding: 0.05rem 0.35rem;
    border-radius: var(--t-radius-sm);
    background: color-mix(in srgb, var(--t-purple) 12%, transparent);
    color: var(--t-purple);
    border: 1px solid color-mix(in srgb, var(--t-purple) 20%, transparent);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
}

.era-badge-icon {
    font-size: 0.6rem;
}

.cat-right {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.cat-total {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text-muted);
}

.cat-total.active {
    color: var(--t-success);
}

.cat-chevron {
    font-size: 0.85rem;
    color: var(--t-text-muted);
}

.cat-details {
    padding: 0.25rem 0.75rem 0.5rem 2.25rem;
}

.no-sources {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    padding: 0.25rem 0;
    font-style: italic;
}

.source-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.25rem 0.5rem;
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
}

.source-line:hover {
    background: var(--t-bg-muted);
}

.source-left {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--t-text-secondary);
}

.source-icon {
    font-size: 0.85rem;
    color: var(--t-text-muted);
}

.source-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
}

.source-value {
    font-family: var(--t-font-mono);
    font-weight: 600;
    color: var(--t-success);
    white-space: nowrap;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
    opacity: 1;
    max-height: 500px;
}
</style>
