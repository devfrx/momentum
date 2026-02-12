<script setup lang="ts">
import { ref } from 'vue'
import { useMultipliers } from '@renderer/composables/useMultipliers'
import AppIcon from '@renderer/components/AppIcon.vue'

const { breakdowns } = useMultipliers()
const expandedId = ref<string | null>(null)

function toggle(id: string): void {
    expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
    <div class="multi-section">
        <h2 class="section-heading">
            <AppIcon icon="mdi:chart-bar" class="section-icon" />
            {{ $t('dashboard.multipliers_heading') }}
        </h2>

        <div class="multi-grid">
            <div v-for="bd in breakdowns" :key="bd.category.id" class="multi-card"
                :class="{ active: bd.hasBonus, expanded: expandedId === bd.category.id }"
                @click="toggle(bd.category.id)">
                <!-- Card header -->
                <div class="mc-top">
                    <div class="mc-icon-wrap" :class="{ glow: bd.hasBonus }">
                        <AppIcon :icon="bd.category.icon" class="mc-icon" />
                    </div>
                    <div class="mc-info">
                        <span class="mc-value" :class="{ boosted: bd.hasBonus }">{{ bd.totalFormatted }}</span>
                        <span class="mc-label">{{ $t(bd.category.labelKey) }}</span>
                    </div>
                    <AppIcon :icon="expandedId === bd.category.id ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                        class="mc-chevron" />
                </div>

                <!-- Expanded sources -->
                <transition name="slide">
                    <div v-if="expandedId === bd.category.id" class="mc-sources" @click.stop>
                        <div v-if="bd.sources.length === 0" class="mc-empty">
                            {{ $t('multipliers.no_bonuses') }}
                        </div>
                        <div v-for="(src, i) in bd.sources" :key="i" class="mc-source">
                            <div class="src-left">
                                <AppIcon :icon="src.icon" class="src-icon" />
                                <span>{{ src.sourceParam ? $t(src.sourceKey, { name: src.sourceParam }) :
                                    $t(src.sourceKey) }}</span>
                            </div>
                            <span class="src-val">{{ src.value }}</span>
                        </div>
                    </div>
                </transition>
            </div>
        </div>
    </div>
</template>

<style scoped>
.multi-section {
    margin-top: 0;
}

.section-heading {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-lg);
    font-weight: 600;
    color: var(--t-text);
    margin-bottom: var(--t-space-4);
}

.section-icon {
    color: var(--t-text-muted);
    font-size: 1.1rem;
}

.multi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--t-space-3);
}

.multi-card {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-3) var(--t-space-4);
    cursor: pointer;
    transition: all var(--t-transition-normal);
    box-shadow: var(--t-shadow-sm);
}

.multi-card:hover {
    border-color: var(--t-border-hover);
    box-shadow: var(--t-shadow-md);
}

.multi-card.active {
    border-color: color-mix(in srgb, var(--t-accent) 40%, transparent);
}

.mc-top {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.mc-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: var(--t-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--t-bg-muted);
    transition: all 0.2s;
}

.mc-icon-wrap.glow {
    background: color-mix(in srgb, var(--t-accent) 15%, var(--t-bg-muted));
}

.mc-icon {
    font-size: 1.1rem;
    color: var(--t-text-muted);
}

.active .mc-icon {
    color: var(--t-accent);
}

.mc-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
}

.mc-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: 700;
    color: var(--t-text-muted);
}

.mc-value.boosted {
    color: var(--t-success);
}

.mc-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mc-chevron {
    font-size: 0.8rem;
    color: var(--t-text-muted);
    flex-shrink: 0;
}

/* Expanded sources */
.mc-sources {
    margin-top: var(--t-space-3);
    padding-top: var(--t-space-2);
    border-top: 1px solid var(--t-border);
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mc-empty {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    font-style: italic;
    padding: var(--t-space-1) 0;
}

.mc-source {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.2rem 0.4rem;
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-xs);
}

.mc-source:hover {
    background: var(--t-bg-muted);
}

.src-left {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--t-text-secondary);
    min-width: 0;
}

.src-left span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.src-icon {
    font-size: 0.8rem;
    color: var(--t-text-muted);
    flex-shrink: 0;
}

.src-val {
    font-family: var(--t-font-mono);
    font-weight: 600;
    color: var(--t-success);
    white-space: nowrap;
    margin-left: 0.5rem;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
    padding-top: 0;
}

.slide-enter-to,
.slide-leave-from {
    opacity: 1;
    max-height: 400px;
}
</style>
