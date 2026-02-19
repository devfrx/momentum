<script setup lang="ts">
/**
 * PropertyCarousel — Horizontal scrollable card strip of owned properties.
 *
 * Replaces the skyline strip with richer cards that show each building's
 * silhouette plus key stats (rent, condition, occupancy, value, grade).
 * Uses UCard + BuildingSilhouette internally.
 */
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore, type Property } from '@renderer/stores/useRealEstateStore'
import { useFormat } from '@renderer/composables/useFormat'
import BuildingSilhouette from './BuildingSilhouette.vue'
import AppIcon from '@renderer/components/AppIcon.vue'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const { formatCash, formatPercent } = useFormat()

const props = defineProps<{
    activePropertyId?: string | null
}>()

const emit = defineEmits<{
    (e: 'select', propertyId: string): void
}>()

const trackRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

/** Sort properties by grade then value */
const sortedProperties = computed(() => {
    const gradeOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 }
    return [...realEstate.properties].sort((a, b) => {
        const gd = (gradeOrder[a.locationGrade] ?? 2) - (gradeOrder[b.locationGrade] ?? 2)
        if (gd !== 0) return gd
        return b.currentValue.toNumber() - a.currentValue.toNumber()
    })
})

function getDisplayName(p: Property): string {
    return p.customName || p.name
}

function getConditionColor(cond: number): string {
    if (cond >= 70) return 'var(--t-success)'
    if (cond >= 40) return 'var(--t-warning)'
    return 'var(--t-danger)'
}

function getGradeColor(grade: string): string {
    const colors: Record<string, string> = {
        S: 'var(--t-purple)',
        A: 'var(--t-gold)',
        B: 'var(--t-sky, var(--t-blue))',
        C: 'var(--t-text-muted)',
        D: 'var(--t-text-muted)',
    }
    return colors[grade] ?? 'var(--t-text-muted)'
}

// ── Scroll logic ──
function updateScrollState(): void {
    const el = trackRef.value
    if (!el) return
    canScrollLeft.value = el.scrollLeft > 4
    canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function scrollBy(dir: -1 | 1): void {
    trackRef.value?.scrollBy({ left: dir * 240, behavior: 'smooth' })
}

let observer: ResizeObserver | null = null

onMounted(async () => {
    await nextTick()
    updateScrollState()
    const el = trackRef.value
    if (el) {
        el.addEventListener('scroll', updateScrollState, { passive: true })
        observer = new ResizeObserver(updateScrollState)
        observer.observe(el)
    }
})

onBeforeUnmount(() => {
    trackRef.value?.removeEventListener('scroll', updateScrollState)
    observer?.disconnect()
})
</script>

<template>
    <div class="carousel">
        <!-- Empty state -->
        <div v-if="sortedProperties.length === 0" class="carousel-empty">
            <AppIcon icon="mdi:city-variant-outline" class="carousel-empty__icon" />
            <span>{{ t('realestate.skyline_empty') }}</span>
        </div>

        <!-- Scroll controls + track -->
        <template v-else>
            <Transition name="arrow-fade">
                <button v-if="canScrollLeft" class="carousel-arrow carousel-arrow--left" @click="scrollBy(-1)"
                    aria-label="Scroll left">
                    <AppIcon icon="mdi:chevron-left" />
                </button>
            </Transition>

            <div ref="trackRef" class="carousel-track">
                <div v-for="prop in sortedProperties" :key="prop.id" class="carousel-card" :class="{
                    'carousel-card--active': activePropertyId === prop.id,
                }" @click="emit('select', prop.id)">

                    <!-- Silhouette area -->
                    <div class="carousel-card__visual">
                        <BuildingSilhouette :property="prop" :height="130" :active="activePropertyId === prop.id"
                            :show-status="false" />
                    </div>

                    <!-- Condition micro-bar -->
                    <div class="carousel-card__condition-track">
                        <div class="carousel-card__condition-fill" :style="{
                            width: Math.round(prop.condition) + '%',
                            background: getConditionColor(prop.condition),
                        }" />
                    </div>

                    <!-- Info area -->
                    <div class="carousel-card__info">
                        <!-- Name + grade -->
                        <div class="carousel-card__header">
                            <span class="carousel-card__name">{{ getDisplayName(prop) }}</span>
                            <span class="carousel-card__grade" :style="{ color: getGradeColor(prop.locationGrade) }">
                                {{ prop.locationGrade }}
                            </span>
                        </div>

                        <!-- KPI row -->
                        <div class="carousel-card__kpis">
                            <div class="carousel-card__kpi">
                                <AppIcon icon="mdi:cash" class="carousel-card__kpi-icon text-emerald" />
                                <span class="text-emerald">{{ formatCash(realEstate.computePropertyNetRent(prop))
                                }}/t</span>
                            </div>
                            <div class="carousel-card__kpi">
                                <AppIcon icon="mdi:tag-text-outline" class="carousel-card__kpi-icon text-gold" />
                                <span>{{ formatCash(prop.currentValue) }}</span>
                            </div>
                        </div>

                        <!-- Secondary row -->
                        <div class="carousel-card__kpis">
                            <div class="carousel-card__kpi">
                                <AppIcon icon="mdi:account-group-outline" class="carousel-card__kpi-icon text-sky" />
                                <span>{{ formatPercent(prop.occupancy) }}</span>
                            </div>
                            <div class="carousel-card__kpi">
                                <AppIcon icon="mdi:wrench-outline" class="carousel-card__kpi-icon"
                                    :style="{ color: getConditionColor(prop.condition) }" />
                                <span :style="{ color: getConditionColor(prop.condition) }">{{
                                    Math.round(prop.condition) }}%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="carousel-card__foot">
                        <span class="carousel-card__units">{{ prop.units }} {{ t('realestate.units') }}</span>
                        <span v-if="prop.renovationLevel > 0" class="carousel-card__reno">
                            <span v-for="s in prop.renovationLevel" :key="s" class="carousel-card__star">&#9733;</span>
                        </span>
                    </div>
                </div>
            </div>

            <Transition name="arrow-fade">
                <button v-if="canScrollRight" class="carousel-arrow carousel-arrow--right" @click="scrollBy(1)"
                    aria-label="Scroll right">
                    <AppIcon icon="mdi:chevron-right" />
                </button>
            </Transition>
        </template>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════
   Carousel Container
   ═══════════════════════════════════════ */
.carousel {
    position: relative;
    display: flex;
    align-items: stretch;
}

/* ── Track ── */
.carousel-track {
    display: flex;
    gap: var(--t-space-3);
    overflow-x: auto;
    overflow-y: visible;
    padding: var(--t-space-2) var(--t-space-5);
    scroll-snap-type: x proximity;
    scrollbar-width: thin;
    scrollbar-color: var(--t-scrollbar-thumb) transparent;
}

.carousel-track::-webkit-scrollbar {
    height: 4px;
}

.carousel-track::-webkit-scrollbar-thumb {
    background: var(--t-scrollbar-thumb);
    border-radius: var(--t-radius-full);
}

/* ═══════════════════════════════════════
   Card
   ═══════════════════════════════════════ */
.carousel-card {
    flex-shrink: 0;
    width: 210px;
    scroll-snap-align: start;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition:
        transform 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}

.carousel-card:hover {
    transform: translateY(-3px);
    border-color: var(--t-border-hover);
    /* box-shadow: var(--t-shadow-md); */
}

.carousel-card--active {
    border-color: var(--t-cta);
    /* box-shadow: 0 0 0 1px var(--t-cta); */
}

/* ── Visual zone (silhouette) ── */
.carousel-card__visual {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    padding: var(--t-space-3) var(--t-space-2) 0;
    min-height: 115px;
    background: var(--t-bg-muted);
}

/* ── Condition micro-bar ── */
.carousel-card__condition-track {
    height: 3px;
    background: var(--t-bg-muted);
    flex-shrink: 0;
}

.carousel-card__condition-fill {
    height: 100%;
    border-radius: 0 1px 1px 0;
    transition: width 0.4s ease;
}

/* ── Info zone ── */
.carousel-card__info {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1-5);
    padding: var(--t-space-2) var(--t-space-3);
}

/* Header: name + grade */
.carousel-card__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
}

.carousel-card__name {
    flex: 1;
    min-width: 0;
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
}

.carousel-card__grade {
    flex-shrink: 0;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    letter-spacing: 0.02em;
}

/* KPI rows */
.carousel-card__kpis {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.carousel-card__kpi {
    display: flex;
    align-items: center;
    gap: 3px;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    line-height: 1;
}

.carousel-card__kpi-icon {
    font-size: 0.75rem;
}

/* ── Footer ── */
.carousel-card__foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-1-5) var(--t-space-3);
    border-top: 1px solid var(--t-border);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.carousel-card__units {
    line-height: 1;
}

.carousel-card__reno {
    display: flex;
    align-items: center;
    gap: 1px;
    line-height: 1;
}

.carousel-card__star {
    color: var(--t-gold);
    font-size: 0.65rem;
}

/* ═══════════════════════════════════════
   Arrows
   ═══════════════════════════════════════ */
.carousel-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: var(--t-radius-full);
    background: var(--t-bg-elevated);
    border: 1px solid var(--t-border);
    color: var(--t-text);
    cursor: pointer;
    box-shadow: var(--t-shadow-md);
    transition:
        background 0.15s ease,
        transform 0.15s ease;
}

.carousel-arrow:hover {
    background: var(--t-bg-card-hover);
    transform: translateY(-50%) scale(1.1);
}

.carousel-arrow--left {
    left: 2px;
}

.carousel-arrow--right {
    right: 2px;
}

.arrow-fade-enter-active,
.arrow-fade-leave-active {
    transition: opacity 0.15s ease;
}

.arrow-fade-enter-from,
.arrow-fade-leave-to {
    opacity: 0;
}

/* ═══════════════════════════════════════
   Empty
   ═══════════════════════════════════════ */
.carousel-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    width: 100%;
    min-height: 140px;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
}

.carousel-empty__icon {
    font-size: 2rem;
    opacity: 0.3;
}
</style>
