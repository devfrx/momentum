<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'

export interface InfoEntry {
    /** Field or concept name */
    term: string
    /** Explanation text */
    desc: string
    /** Optional icon (Iconify id) */
    icon?: string
}

export interface InfoSection {
    /** Section heading */
    title: string
    /** Optional section icon */
    icon?: string
    /** Entries in this section */
    entries: InfoEntry[]
}

defineProps<{
    /** Panel title */
    title?: string
    /** Introductory description paragraph shown above sections */
    description?: string
    /** Flat list of entries (if no sections needed) */
    entries?: InfoEntry[]
    /** Grouped sections */
    sections?: InfoSection[]
    /** Whether to start expanded */
    startOpen?: boolean
}>()

const open = ref(false)
</script>

<template>
    <div class="info-panel" :class="{ open }">
        <UButton variant="text" icon="mdi:information-outline" @click="open = !open">
            <span class="info-toggle-label">{{ title || $t('info.how_it_works') }}</span>
            <AppIcon :icon="open ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="info-toggle-chevron" />
        </UButton>

        <Transition name="info-slide">
            <div v-if="open" class="info-body">
                <!-- Intro description -->
                <p v-if="description" class="info-description">{{ description }}</p>

                <!-- Flat entries (no sections) -->
                <dl v-if="entries && entries.length && !sections" class="info-list">
                    <div v-for="e in entries" :key="e.term" class="info-entry">
                        <dt class="info-term">
                            <AppIcon v-if="e.icon" :icon="e.icon" class="info-term-icon" />
                            {{ e.term }}
                        </dt>
                        <dd class="info-desc">{{ e.desc }}</dd>
                    </div>
                </dl>

                <!-- Grouped sections -->
                <template v-if="sections">
                    <div v-for="sec in sections" :key="sec.title" class="info-section">
                        <h4 class="info-section-title">
                            <AppIcon v-if="sec.icon" :icon="sec.icon" class="info-section-icon" />
                            {{ sec.title }}
                        </h4>
                        <dl class="info-list">
                            <div v-for="e in sec.entries" :key="e.term" class="info-entry">
                                <dt class="info-term">
                                    <AppIcon v-if="e.icon" :icon="e.icon" class="info-term-icon" />
                                    {{ e.term }}
                                </dt>
                                <dd class="info-desc">{{ e.desc }}</dd>
                            </div>
                        </dl>
                    </div>
                </template>

                <!-- Slot for custom content -->
                <slot />
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.info-panel {
    border-radius: var(--t-radius-md);
    margin-top: var(--t-space-2);
    overflow: hidden;
}



.info-toggle-label {
    flex: 1;
    text-align: left;
}

.info-toggle-chevron {
    font-size: 0.9rem;
    opacity: 0.5;
    transition: transform var(--t-transition-fast);
}

.info-panel.open .info-toggle-chevron {
    transform: rotate(180deg);
}

/* ── Body ── */
.info-body {
    padding: var(--t-space-3) var(--t-space-4) var(--t-space-4);
}

/* ── Description ── */
.info-description {
    margin: 0 0 var(--t-space-2);
    padding: 0;
    font-size: var(--t-font-size-xs);
    line-height: 1.6;
    color: var(--t-text-muted);
}

/* ── Section ── */
.info-section {
    margin-top: var(--t-space-4);
}

.info-section:first-child {
    margin-top: var(--t-space-3);
}

.info-section-title {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    margin: 0 0 var(--t-space-2) 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.info-section-icon {
    font-size: 0.85rem;
    color: var(--t-text-muted);
}

/* ── Definition list ── */
.info-list {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
}

.info-entry {
    display: grid;
    grid-template-columns: minmax(120px, auto) 1fr;
    gap: var(--t-space-2);
    align-items: baseline;
    padding: var(--t-space-1-5) 0;
}

.info-entry+.info-entry {
    border-top: 1px solid var(--t-border);
}

.info-term {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
    white-space: nowrap;
}

.info-term-icon {
    font-size: 0.8rem;
    color: var(--t-text-muted);
    flex-shrink: 0;
}

.info-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    line-height: 1.5;
    margin: 0;
}

/* ── Transition ── */
.info-slide-enter-active,
.info-slide-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
}

.info-slide-enter-from,
.info-slide-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.info-slide-enter-to,
.info-slide-leave-from {
    max-height: 2000px;
    opacity: 1;
}
</style>
