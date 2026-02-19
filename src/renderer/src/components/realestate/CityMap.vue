<script setup lang="ts">
/**
 * CityMap — Isometric 2.5D city map powered by PixiJS + D3
 *
 * Renders an interactive isometric city with:
 * - District zones as colored terrain tiles
 * - Isometric buildings for owned properties & opportunities
 * - Activity particles per district (spawned by zone activity level)
 * - D3 SVG overlay for heatmap & trend indicators
 * - Pan & zoom with mouse/touch
 * - Click districts to select, click buildings to view property/opportunity
 * - Neighborhood event banners rendered in-world
 * - Trend border colors around each district
 * - Lock icons for inaccessible districts
 */
import { ref, computed, onMounted, onBeforeUnmount, watch, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import {
    DISTRICTS,
    getNeighborhoodEvent,
    type District,
    type ZoneActivity,
} from '@renderer/data/realestate'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import {
    IsometricEngine,
    type DistrictRenderData,
    type BuildingSprite,
} from '@renderer/core/IsometricEngine'

const { t } = useI18n()
const { formatCash } = useFormat()
const realEstate = useRealEstateStore()
const player = usePlayerStore()

const props = defineProps<{
    /** Whether the map tab is currently visible */
    active?: boolean
}>()

const emit = defineEmits<{
    (e: 'select-district', district: District): void
    (e: 'select-opportunity', oppId: string): void
    (e: 'select-property', propId: string): void
}>()

// ─── Refs ──────────────────────────────────────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null)
const engine = ref<IsometricEngine | null>(null)
const hoveredDistrict = ref<string | null>(null)
const isZoomed = ref(false)
const selectedDistrictId = ref<string | null>(null)

// ─── Computed data for engine ──────────────────────────────────
const districtRenderData = computed<DistrictRenderData[]>(() => {
    return DISTRICTS.map(district => {
        const ds = realEstate.getDistrictState(district.id)
        const opps = realEstate.availableOpportunities.filter(o => o.districtId === district.id)
        const owned = realEstate.propertiesByDistrict.get(district.id) ?? []
        const evt = ds.activeEventId ? getNeighborhoodEvent(ds.activeEventId) : null

        return {
            district,
            unlocked: true, // All districts always accessible
            ownedCount: owned.length,
            opportunityCount: opps.length,
            hotDealCount: opps.filter(o => o.isHotDeal).length,
            activity: ds.activity,
            trend: ds.trend,
            activeEventName: evt ? t(evt.nameKey) : null,
            activeEventIcon: evt?.icon ?? null,
        }
    })
})

/** Deterministic pseudo-random for building placement within district */
function hashPos(id: string, seed: number): number {
    let h = seed
    for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
    return ((h >>> 0) % 1000) / 1000
}

const buildingSprites = computed<BuildingSprite[]>(() => {
    const sprites: BuildingSprite[] = []

    // Owned properties
    for (const prop of realEstate.properties) {
        sprites.push({
            id: prop.id,
            districtId: prop.districtId,
            name: prop.customName || prop.name,
            kind: 'owned',
            col: Math.floor(hashPos(prop.id, 1) * 4) + 0.5,
            row: Math.floor(hashPos(prop.id, 2) * 3) + 0.5,
        })
    }

    // Opportunities
    for (const opp of realEstate.availableOpportunities) {
        sprites.push({
            id: opp.id,
            districtId: opp.districtId,
            name: opp.name,
            kind: opp.isHotDeal ? 'hot' : 'opportunity',
            col: Math.floor(hashPos(opp.id, 3) * 4) + 0.5,
            row: Math.floor(hashPos(opp.id, 4) * 3) + 0.5,
        })
    }

    return sprites
})

// ─── Engine lifecycle ──────────────────────────────────────────
onMounted(async () => {
    if (!canvasRef.value) return

    try {
        const eng = new IsometricEngine()
        await eng.init(canvasRef.value, {
            onDistrictClick: (id) => {
                selectedDistrictId.value = id
                const district = DISTRICTS.find(d => d.id === id)
                if (district) emit('select-district', district)
            },
            onDistrictHover: (id) => {
                hoveredDistrict.value = id
            },
            onBuildingClick: (id, kind) => {
                if (kind === 'owned') {
                    emit('select-property', id)
                } else {
                    emit('select-opportunity', id)
                }
            },
        })

        engine.value = eng

        // Initial render
        eng.updateDistricts(districtRenderData.value)
        eng.updateBuildings(buildingSprites.value)
    } catch (err) {
        console.error('[CityMap] PixiJS init failed:', err)
    }
})

onBeforeUnmount(() => {
    engine.value?.destroy()
    engine.value = null
})

// ─── Watchers ──────────────────────────────────────────────────

/** Fingerprint to detect real changes, not every tick */
function districtFingerprint(data: DistrictRenderData[]): string {
    return data.map(d =>
        `${d.district.id}:${d.ownedCount}:${d.opportunityCount}:${d.hotDealCount}:${d.activity}:${d.trend}:${d.activeEventName ?? ''}`
    ).join('|')
}

let lastDistrictFP = ''
watch(districtRenderData, (data) => {
    const fp = districtFingerprint(data)
    if (fp === lastDistrictFP) return
    lastDistrictFP = fp
    engine.value?.updateDistricts(data)
}, { deep: true })

let lastBuildingCount = -1
watch(buildingSprites, (sprites) => {
    // Only update when count or composition changes
    const key = sprites.length + ':' + sprites.map(s => s.id).join(',')
    if (key === String(lastBuildingCount)) return
    lastBuildingCount = key as unknown as number
    engine.value?.updateBuildings(sprites)
}, { deep: true })

// Pause / resume engine when tab visibility changes
watch(toRef(props, 'active'), (visible) => {
    if (visible) {
        engine.value?.resume()
    } else {
        engine.value?.pause()
    }
})

// ─── Actions ───────────────────────────────────────────────────
function handleResetView(): void {
    engine.value?.resetView()
    isZoomed.value = false
    selectedDistrictId.value = null
}

function handleZoomToDistrict(id: string): void {
    engine.value?.zoomToDistrict(id)
    isZoomed.value = true
    selectedDistrictId.value = id
}

// ─── Tooltip data ──────────────────────────────────────────────
const tooltipDistrict = computed(() => {
    if (!hoveredDistrict.value) return null
    const d = DISTRICTS.find(d => d.id === hoveredDistrict.value)
    if (!d) return null
    const ds = realEstate.getDistrictState(d.id)
    const owned = realEstate.propertiesByDistrict.get(d.id)?.length ?? 0
    const opps = realEstate.availableOpportunities.filter(o => o.districtId === d.id).length
    return { ...d, ds, owned, opps }
})

// ─── City Scan ─────────────────────────────────────────────────
const scanCooldownText = computed(() => {
    const ms = realEstate.getCityScanCooldownRemaining()
    if (ms <= 0) return ''
    const s = Math.ceil(ms / 1000)
    const m = Math.floor(s / 60)
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
})

function handleScanCity(): void {
    realEstate.scanCity()
}

// Force reactivity on cooldown timer
const scanCooldownTick = ref(0)
let scanTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
    scanTimer = setInterval(() => {
        if (realEstate.isCityScanOnCooldown()) scanCooldownTick.value++
    }, 1000)
})
onBeforeUnmount(() => {
    if (scanTimer) clearInterval(scanTimer)
})

const activityIcons: Record<ZoneActivity, string> = {
    dormant: 'mdi:moon-waning-crescent',
    quiet: 'mdi:weather-night',
    active: 'mdi:pulse',
    booming: 'mdi:chart-line',
    overheated: 'mdi:fire',
}
</script>

<template>
    <div class="city-map">
        <!-- PixiJS Canvas -->
        <canvas ref="canvasRef" class="city-map__canvas" />

        <!-- Controls overlay -->
        <div class="city-map__controls">
            <UButton v-if="isZoomed" variant="ghost" size="sm" icon="mdi:arrow-left" :label="t('realestate.map_back')"
                @click="handleResetView" />
            <UButton variant="ghost" size="sm" icon="mdi:fit-to-screen-outline" @click="handleResetView"
                title="Reset view" />
        </div>

        <!-- Tooltip -->
        <transition name="tooltip-fade">
            <div v-if="tooltipDistrict" class="city-map__tooltip">
                <div class="tooltip-header">
                    <span class="tooltip-name">{{ t(tooltipDistrict.nameKey) }}</span>
                    <span class="tooltip-tier" :style="{ color: tooltipDistrict.color }">
                        {{ tooltipDistrict.tier.toUpperCase() }}
                    </span>
                </div>
                <div class="tooltip-stats">
                    <span>
                        <AppIcon :icon="activityIcons[tooltipDistrict.ds.activity]" />
                        {{ t('realestate.activity.' + tooltipDistrict.ds.activity) }}
                    </span>
                    <span>🏠 {{ tooltipDistrict.owned }}</span>
                    <span>📋 {{ tooltipDistrict.opps }}</span>
                </div>
            </div>
        </transition>

        <!-- Legend -->
        <div class="city-map__legend">
            <div class="legend-title">{{ t('realestate.tab.map') }}</div>
            <div class="legend-row">
                <span class="legend-dot legend-dot--owned" />
                <span>{{ t('realestate.map.owned') }}</span>
            </div>
            <div class="legend-row">
                <span class="legend-dot legend-dot--opp" />
                <span>{{ t('realestate.map.opportunity') }}</span>
            </div>
            <div class="legend-row">
                <span class="legend-dot legend-dot--hot" />
                <span>{{ t('realestate.map.hot_deal') }}</span>
            </div>
            <div class="legend-divider" />
            <div class="legend-row">
                <span class="legend-swatch" style="background: var(--t-success)" />
                <span>{{ t('realestate.trend.growing') }}</span>
            </div>
            <div class="legend-row">
                <span class="legend-swatch" style="background: var(--t-danger)" />
                <span>{{ t('realestate.trend.declining') }}</span>
            </div>
            <div class="legend-row">
                <span class="legend-swatch" style="background: var(--t-warning)" />
                <span>{{ t('realestate.trend.bubble') }}</span>
            </div>
        </div>

        <!-- Scan City button -->
        <div class="city-map__scan">
            <UButton :disabled="realEstate.isCityScanOnCooldown() || player.cash.lt(5000)" icon="mdi:radar" :label="realEstate.isCityScanOnCooldown()
                ? `${t('realestate.scan_city')} (${scanCooldownText})`
                : `${t('realestate.scan_city')} \u2014 ${formatCash(5000)}`" size="sm" @click="handleScanCity" />
            <span v-if="scanCooldownTick >= 0" style="display:none" />
        </div>

        <!-- District quick-access bar -->
        <div class="city-map__district-bar">
            <button v-for="d in DISTRICTS" :key="d.id" class="district-chip" :class="{
                'district-chip--selected': selectedDistrictId === d.id,
            }" :style="{ '--chip-color': d.color }" @click="handleZoomToDistrict(d.id)">
                <span class="district-chip__dot" />
                <span class="district-chip__name">{{ d.name }}</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.city-map {
    position: relative;
    width: 100%;
    height: 520px;
    background: radial-gradient(ellipse at center, #12121a 0%, #09090f 100%);
    border-radius: var(--t-radius-lg);
    border: 1px solid var(--t-border);
    overflow: hidden;
    user-select: none;
}

.city-map__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

/* ── Controls ── */
.city-map__controls {
    position: absolute;
    top: var(--t-space-3);
    left: var(--t-space-3);
    display: flex;
    gap: var(--t-space-2);
    z-index: 10;
}

/* ── Scan City ── */
.city-map__scan {
    position: absolute;
    top: var(--t-space-3);
    right: var(--t-space-3);
    z-index: 10;
}

/* ── Tooltip ── */
.city-map__tooltip {
    position: absolute;
    top: var(--t-space-3);
    right: var(--t-space-3);
    padding: var(--t-space-3);
    background: rgba(9, 9, 15, 0.92);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    backdrop-filter: blur(8px);
    z-index: 10;
    min-width: 180px;
}

.tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--t-space-2);
    margin-bottom: var(--t-space-2);
}

.tooltip-name {
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.tooltip-tier {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    letter-spacing: 0.06em;
}

.tooltip-stats {
    display: flex;
    gap: var(--t-space-3);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
    transition: opacity 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
    opacity: 0;
}

/* ── Legend ── */
.city-map__legend {
    position: absolute;
    bottom: 48px;
    right: var(--t-space-3);
    padding: var(--t-space-2) var(--t-space-3);
    background: rgba(9, 9, 15, 0.85);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    backdrop-filter: blur(6px);
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.legend-title {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 2px;
}

.legend-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

.legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.legend-dot--owned {
    background: #4ade80;
}

.legend-dot--opp {
    background: #60a5fa;
}

.legend-dot--hot {
    background: #fbbf24;
}

.legend-swatch {
    width: 14px;
    height: 3px;
    border-radius: 2px;
    flex-shrink: 0;
}

.legend-divider {
    height: 1px;
    background: var(--t-border);
    margin: 2px 0;
}

/* ── District quick-access bar ── */
.city-map__district-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 2px;
    padding: var(--t-space-2) var(--t-space-3);
    background: rgba(9, 9, 15, 0.88);
    border-top: 1px solid var(--t-border);
    overflow-x: auto;
    scrollbar-width: none;
    z-index: 10;
}

.city-map__district-bar::-webkit-scrollbar {
    display: none;
}

.district-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border: 1px solid color-mix(in srgb, var(--chip-color, #888) 30%, transparent);
    border-radius: var(--t-radius-sm);
    background: color-mix(in srgb, var(--chip-color, #888) 8%, transparent);
    color: var(--t-text-secondary);
    font-size: 10px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
}

.district-chip:hover:not(:disabled) {
    background: color-mix(in srgb, var(--chip-color) 20%, transparent);
    border-color: color-mix(in srgb, var(--chip-color) 50%, transparent);
    color: var(--t-text);
}

.district-chip--selected {
    background: color-mix(in srgb, var(--chip-color) 25%, transparent);
    border-color: var(--chip-color);
    color: var(--t-text);
}

.district-chip__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--chip-color);
    flex-shrink: 0;
}

.district-chip__name {
    line-height: 1;
}
</style>
