<script setup lang="ts">
/**
 * PropertySkyline — Horizontal panoramic view of all owned properties
 *
 * Level 1 of the Skyline+Street hybrid navigation:
 * Shows all owned properties as building silhouettes in a scrollable skyline strip.
 * Clicking a building triggers the Street/Focus transition.
 *
 * Visual indicators:
 *   - Building height proportional to value tier
 *   - Status dot (green=active, yellow=issues, red=critical)
 *   - Hover reveals name + rent summary
 *   - Active building elevates and highlights
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore, type Property } from '@renderer/stores/useRealEstateStore'
import { useFormat } from '@renderer/composables/useFormat'
import BuildingSilhouette from './BuildingSilhouette.vue'
import AppIcon from '@renderer/components/AppIcon.vue'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const { formatCash } = useFormat()

const props = defineProps<{
    /** Currently focused property id (if any) */
    activePropertyId?: string | null
}>()

const emit = defineEmits<{
    (e: 'select', propertyId: string): void
}>()

const hovered = ref<string | null>(null)

/** Sort properties by location grade (S>A>B>C>D) then value */
const sortedProperties = computed(() => {
    const gradeOrder: Record<string, number> = {
        S: 0, A: 1, B: 2, C: 3, D: 4,
    }
    return [...realEstate.properties].sort((a, b) => {
        const gradeDiff = (gradeOrder[a.locationGrade] ?? 2) - (gradeOrder[b.locationGrade] ?? 2)
        if (gradeDiff !== 0) return gradeDiff
        return a.currentValue.toNumber() - b.currentValue.toNumber()
    })
})

/** Compute building CSS scale based on relative value */
function getBuildingScale(prop: Property): number {
    const values = realEstate.properties.map((p) => p.currentValue.toNumber())
    const maxVal = Math.max(...values, 1)
    const minVal = Math.min(...values, 0)
    const range = maxVal - minVal || 1
    const normalized = (prop.currentValue.toNumber() - minVal) / range
    return 0.45 + normalized * 0.35 // 0.45 min, 0.8 max
}

function getDisplayName(prop: Property): string {
    return prop.customName || prop.name
}

function handleSelect(propId: string): void {
    emit('select', propId)
}
</script>

<template>
    <div class="skyline-wrapper">
        <!-- Summary stats above skyline -->
        <!-- <div class="skyline-summary">
            <div class="skyline-summary__stat">
                <span class="skyline-summary__label">{{ t('realestate.stat.properties') }}</span>
                <span class="skyline-summary__value">{{ realEstate.properties.length }}</span>
            </div>
            <div class="skyline-summary__stat">
                <span class="skyline-summary__label">{{ t('realestate.stat.portfolio_value') }}</span>
                <span class="skyline-summary__value text-gold">{{ formatCash(realEstate.totalPropertyValue) }}</span>
            </div>
            <div class="skyline-summary__stat">
                <span class="skyline-summary__label">{{ t('realestate.stat.rent_tick') }}</span>
                <span class="skyline-summary__value text-emerald">{{ formatCash(realEstate.totalRentPerTick) }}</span>
            </div>
        </div> -->

        <!-- Skyline strip -->
        <div class="skyline-strip">
            <div v-if="sortedProperties.length === 0" class="skyline-empty">
                <AppIcon icon="mdi:city-variant-outline" class="skyline-empty__icon" />
                <span>{{ t('realestate.skyline_empty') }}</span>
            </div>

            <div v-for="prop in sortedProperties" :key="prop.id" class="skyline-building" :class="{
                'skyline-building--active': activePropertyId === prop.id,
                'skyline-building--hovered': hovered === prop.id,
            }" :style="{ transform: `scale(${getBuildingScale(prop)})` }" @click="handleSelect(prop.id)"
                @mouseenter="hovered = prop.id" @mouseleave="hovered = null">
                <BuildingSilhouette :property="prop" :height="200" :active="activePropertyId === prop.id" show-status />

                <!-- Hover tooltip -->
                <Transition name="tooltip-fade">
                    <div v-if="hovered === prop.id" class="skyline-tooltip"
                        :style="{ transform: `translateX(-50%) scale(${1 / getBuildingScale(prop)})` }">
                        <span class="skyline-tooltip__name">{{ getDisplayName(prop) }}</span>
                        <span class="skyline-tooltip__rent text-emerald">
                            {{ formatCash(realEstate.computePropertyNetRent(prop)) }}/t
                        </span>
                    </div>
                </Transition>
            </div>
        </div>

        <!-- Ground line -->
        <div class="skyline-ground" />
    </div>
</template>

<style scoped>
.skyline-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

/* ── Summary ── */
.skyline-summary {
    display: flex;
    gap: var(--t-space-4);
    justify-content: center;
    padding: var(--t-space-2) var(--t-space-4);
}

.skyline-summary__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-0-5);
}

.skyline-summary__label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--t-text-muted);
}

.skyline-summary__value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

/* ── Skyline strip ── */
.skyline-strip {
    display: flex;
    align-items: flex-end;
    gap: var(--t-space-0-5);
    padding: 60px var(--t-space-6) 0;
    overflow-x: auto;
    overflow-y: visible;
    min-height: 180px;
    scrollbar-width: thin;
    scrollbar-color: var(--t-scrollbar-thumb) transparent;
}

.skyline-strip::-webkit-scrollbar {
    height: 4px;
}

.skyline-strip::-webkit-scrollbar-thumb {
    background: var(--t-scrollbar-thumb);
    border-radius: var(--t-radius-full);
}

/* ── Building slot ── */
.skyline-building {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
    transform-origin: bottom center;
    transition: transform var(--t-transition-normal);
}

/* ── Tooltip ── */
.skyline-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform-origin: bottom center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--t-space-1-5) var(--t-space-3);
    background: var(--t-bg-elevated);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    white-space: nowrap;
    pointer-events: none;
    z-index: var(--t-z-tooltip);
}

.skyline-tooltip__name {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.skyline-tooltip__rent {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(6px);
}

/* ── Empty state ── */
.skyline-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    width: 100%;
    min-height: 120px;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
}

.skyline-empty__icon {
    font-size: 2rem;
    opacity: 0.3;
}

/* ── Ground ── */
.skyline-ground {
    height: 1px;
    background: var(--t-border);
    margin: 0 var(--t-space-4);
}
</style>
