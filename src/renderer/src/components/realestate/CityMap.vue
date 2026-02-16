<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { DISTRICTS, getUnlockedDistricts, type District } from '@renderer/data/realestate'
import AppIcon from '@renderer/components/AppIcon.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const player = usePlayerStore()

const emit = defineEmits<{
    (e: 'select-district', district: District): void
    (e: 'select-opportunity', oppId: string): void
    (e: 'select-property', propId: string): void
}>()

/* ── Grid layout (identical) ── */
interface MapCell {
    district: District
    col: number
    row: number
    colSpan: number
    rowSpan: number
}

const districtPositions: Record<string, { col: number; row: number; colSpan: number; rowSpan: number }> = {
    skyline_heights: { col: 2, row: 0, colSpan: 2, rowSpan: 1 },
    downtown: { col: 2, row: 1, colSpan: 2, rowSpan: 2 },
    midtown: { col: 0, row: 1, colSpan: 2, rowSpan: 2 },
    tech_quarter: { col: 4, row: 0, colSpan: 2, rowSpan: 2 },
    uptown: { col: 0, row: 0, colSpan: 2, rowSpan: 1 },
    waterfront: { col: 4, row: 2, colSpan: 2, rowSpan: 2 },
    old_town: { col: 0, row: 3, colSpan: 2, rowSpan: 2 },
    industrial: { col: 2, row: 3, colSpan: 2, rowSpan: 2 },
    harbor: { col: 4, row: 4, colSpan: 2, rowSpan: 1 },
}

const hoveredDistrict = ref<string | null>(null)
const selectedDistrict = ref<string | null>(null)
const unlockedIds = computed(() => new Set(getUnlockedDistricts(player.netWorth.toNumber()).map(d => d.id)))

const mapCells = computed<MapCell[]>(() =>
    DISTRICTS.map(d => ({
        district: d,
        ...(districtPositions[d.id] ?? { col: 0, row: 0, colSpan: 1, rowSpan: 1 }),
    })),
)

function propertiesInDistrict(id: string): number {
    return realEstate.propertiesByDistrict.get(id)?.length ?? 0
}
function opportunitiesInDistrict(id: string): number {
    return realEstate.availableOpportunities.filter(o => o.districtId === id).length
}
function handleClick(d: District): void {
    if (!unlockedIds.value.has(d.id)) return
    selectedDistrict.value = d.id
    emit('select-district', d)
}

const tierLabel: Record<string, string> = {
    starter: '★',
    mid: '★★',
    premium: '★★★',
    elite: '★★★★',
}

/* ═══ Leaflet map ═══ */
const mapContainer = ref<HTMLDivElement | null>(null)
let leafletMap: L.Map | null = null

const MAP_CENTER: [number, number] = [40.730, -73.998]
const MAP_ZOOM = 13

function initMap(): void {
    if (!mapContainer.value || leafletMap) return

    leafletMap = L.map(mapContainer.value, {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: false,
        keyboard: false,
    })

    // Zoom control — bottom-right to avoid grid overlap
    L.control.zoom({ position: 'bottomright' }).addTo(leafletMap)

    // Dark tile layer (CartoDB Dark Matter — free, no key)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
    }).addTo(leafletMap)

    // NO district circles — just the raw dark map
}

function destroyMap(): void {
    if (leafletMap) {
        leafletMap.remove()
        leafletMap = null
    }
}

onMounted(() => {
    nextTick(() => initMap())
})
onBeforeUnmount(() => destroyMap())

/* ═══ Dots inside district cells ═══ */

/** Deterministic pseudo-random from string id → 0..1 */
function hashPos(id: string, seed: number): number {
    let h = seed
    for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
    return (((h >>> 0) % 10000) / 10000)
}

interface CellDot {
    id: string
    name: string
    kind: 'opp' | 'hot' | 'owned'
    top: number   // %
    left: number  // %
}

function dotsForDistrict(districtId: string): CellDot[] {
    const dots: CellDot[] = []

    // All opportunities in this district
    const opps = realEstate.availableOpportunities.filter(
        o => o.districtId === districtId,
    )
    for (const opp of opps) {
        dots.push({
            id: opp.id,
            name: opp.name,
            kind: opp.isHotDeal ? 'hot' : 'opp',
            top: 25 + hashPos(opp.id, 1) * 50,   // 25%-75% vertical
            left: 10 + hashPos(opp.id, 2) * 80,  // 10%-90% horizontal
        })
    }

    // Owned properties in this district
    const props = realEstate.propertiesByDistrict.get(districtId) ?? []
    for (const p of props) {
        dots.push({
            id: p.id,
            name: p.customName ?? p.name,
            kind: 'owned',
            top: 25 + hashPos(p.id, 3) * 50,
            left: 10 + hashPos(p.id, 4) * 80,
        })
    }

    return dots
}

function handleDotClick(dot: CellDot, ev: MouseEvent): void {
    ev.stopPropagation()
    if (dot.kind === 'owned') {
        emit('select-property', dot.id)
    } else {
        emit('select-opportunity', dot.id)
    }
}

</script>

<template>
    <div class="city-map-wrapper">
        <!-- ── Leaflet background ── -->
        <div class="map-layer">
            <div ref="mapContainer" class="leaflet-host"></div>
        </div>

        <!-- ── District grid overlay ── -->
        <div class="city-grid">
            <div v-for="cell in mapCells" :key="cell.district.id" class="district-cell" :class="{
                locked: !unlockedIds.has(cell.district.id),
                hovered: hoveredDistrict === cell.district.id,
                selected: selectedDistrict === cell.district.id,
                'has-properties': propertiesInDistrict(cell.district.id) > 0,
            }" :style="{
                '--d-color': cell.district.color,
                gridColumn: `${cell.col + 1} / span ${cell.colSpan}`,
                gridRow: `${cell.row + 1} / span ${cell.rowSpan}`,
            }" @mouseenter="hoveredDistrict = cell.district.id" @mouseleave="hoveredDistrict = null"
                @click="handleClick(cell.district)">
                <div v-if="!unlockedIds.has(cell.district.id)" class="locked-overlay">
                    <AppIcon icon="mdi:lock-outline" />
                </div>

                <template v-else>
                    <div class="cell-header">
                        <AppIcon :icon="cell.district.icon" class="cell-icon" />
                        <span class="cell-name">{{ t(cell.district.nameKey) }}</span>
                        <span class="cell-tier">{{ tierLabel[cell.district.tier] }}</span>
                    </div>

                    <!-- Dots: scanned opportunities + owned properties -->
                    <div v-for="dot in dotsForDistrict(cell.district.id)" :key="dot.id" class="cell-dot"
                        :class="'cell-dot--' + dot.kind" :style="{ top: dot.top + '%', left: dot.left + '%' }"
                        :title="dot.name" @click="handleDotClick(dot, $event)" />

                    <div class="cell-body">
                        <div class="cell-stats">
                            <span v-if="propertiesInDistrict(cell.district.id) > 0" class="cell-stat owned">
                                <AppIcon icon="mdi:home" /> {{ propertiesInDistrict(cell.district.id) }}
                            </span>
                            <span v-if="opportunitiesInDistrict(cell.district.id) > 0" class="cell-stat opps">
                                <AppIcon icon="mdi:tag" /> {{ opportunitiesInDistrict(cell.district.id) }}
                            </span>
                            <span v-if="realEstate.isScanOnCooldown(cell.district.id)" class="cell-stat cooldown">
                                <AppIcon icon="mdi:timer-sand" />
                            </span>
                        </div>

                        <div class="cell-mult">
                            {{ cell.district.rentMultiplier }}×
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- Legend -->
        <div class="map-legend">
            <div class="legend-item">
                <span class="legend-swatch legend-swatch--owned"></span>
                <span>{{ t('realestate.map.owned') }}</span>
            </div>
            <div class="legend-item">
                <span class="legend-swatch legend-swatch--opp"></span>
                <span>{{ t('realestate.map.opportunity') }}</span>
            </div>
            <div class="legend-item">
                <span class="legend-swatch legend-swatch--hot"></span>
                <span>{{ t('realestate.map.hot_deal') }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.city-map-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

/* ── Leaflet background layer ── */
.map-layer {
    position: absolute;
    inset: 0;
    bottom: 28px;
    /* legend height */
    z-index: 0;
    border-radius: var(--t-radius-lg);
    overflow: hidden;
    /* pointer-events on map so it's interactive underneath the grid */
    pointer-events: auto;
}

.leaflet-host {
    width: 100%;
    height: 100%;
}

/* Slightly darken tiles — no heavy filter so the map stays crisp */
.leaflet-host :deep(.leaflet-tile-pane) {
    filter: brightness(0.6) saturate(0.35);
}

/* Dark-themed zoom controls */
.leaflet-host :deep(.leaflet-control-zoom) {
    border: 1px solid var(--t-border) !important;
    border-radius: var(--t-radius-sm) !important;
    overflow: hidden;
}

.leaflet-host :deep(.leaflet-control-zoom a) {
    background: var(--t-bg-card) !important;
    color: var(--t-text-secondary) !important;
    border-color: var(--t-border) !important;
    width: 28px !important;
    height: 28px !important;
    line-height: 28px !important;
    font-size: 14px !important;
}

.leaflet-host :deep(.leaflet-control-zoom a:hover) {
    background: var(--t-bg-muted) !important;
    color: var(--t-text) !important;
}

/* ── District grid ── */
.city-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(5, 1fr);
    gap: 3px;
    aspect-ratio: 6 / 5;
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: 3px;
    overflow: hidden;
    /* Let scroll/drag pass through to Leaflet underneath */
    pointer-events: none;
}

/* ── District Cell ── */
.district-cell {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--t-space-2) var(--t-space-3);
    border-radius: var(--t-radius-sm);
    cursor: pointer;
    overflow: hidden;
    transition: transform var(--t-transition-fast), box-shadow var(--t-transition-fast), border-color var(--t-transition-fast);
    /* Re-enable pointer events on individual cells (grid is pointer-events:none) */
    pointer-events: auto;

    /* Light translucent tint — NO blur, map shows through clearly */
    background: color-mix(in srgb, var(--d-color) 8%, color-mix(in srgb, var(--t-bg-base) 62%, transparent));
    border: 1px solid color-mix(in srgb, var(--d-color) 18%, var(--t-border));
}

.district-cell:hover:not(.locked) {
    background: color-mix(in srgb, var(--d-color) 14%, color-mix(in srgb, var(--t-bg-base) 72%, transparent));
    border-color: color-mix(in srgb, var(--d-color) 40%, var(--t-border));
    box-shadow: 0 0 20px color-mix(in srgb, var(--d-color) 12%, transparent);
    transform: scale(1.01);
}

.district-cell.selected {
    border-color: var(--d-color);
    background: color-mix(in srgb, var(--d-color) 12%, color-mix(in srgb, var(--t-bg-base) 72%, transparent));
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--d-color) 25%, transparent),
        0 0 30px color-mix(in srgb, var(--d-color) 15%, transparent);
}

.district-cell.locked {
    background: color-mix(in srgb, var(--t-bg-base) 55%, transparent);
    border-color: var(--t-border);
    cursor: default;
    opacity: 0.45;
}

/* ── Locked overlay ── */
.locked-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    background: var(--t-bg-base);
    color: var(--t-text-muted);
}

/* ── Cell header ── */
.cell-header {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.cell-icon {
    font-size: 1rem;
    color: var(--d-color);
    flex-shrink: 0;
}

.cell-name {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 1px 3px var(--t-overlay);
}

.cell-tier {
    font-size: 0.55rem;
    color: var(--d-color);
    margin-left: auto;
    flex-shrink: 0;
    letter-spacing: -1px;
}

/* ── Cell body ── */
.cell-body {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.cell-stats {
    display: flex;
    gap: 0.3rem;
}

.cell-stat {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    font-size: 0.6rem;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    font-weight: 600;
}

.cell-stat.owned {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.cell-stat.opps {
    background: var(--t-warning-muted);
    color: var(--t-warning);
}

.cell-stat.cooldown {
    color: var(--t-text-muted);
}

.cell-mult {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: 700;
    color: var(--d-color);
    opacity: 0.8;
    text-shadow: 0 1px 3px var(--t-overlay);
}

/* ── Dots (scanned opps + owned props) ── */
.cell-dot {
    position: absolute;
    width: 15px;
    height: 15px;
    border-radius: var(--t-radius-sm);
    border: 2px solid var(--t-border);
    transform: translate(-50%, -50%);
    cursor: pointer;
    z-index: 3;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    pointer-events: auto;
}

.cell-dot:hover {
    transform: translate(-50%, -50%) scale(1.2);
    z-index: 5;
}

/* Scanned opportunity */
.cell-dot--opp {
    background: var(--t-warning);
    /* box-shadow: 0 0 6px var(--t-warning), 0 0 12px rgba(245, 158, 11, 0.3); */
    /* animation: dot-pulse 2s ease-in-out infinite; */
}

.cell-dot--opp:hover {
    /* box-shadow: 0 0 10px var(--t-warning), 0 0 20px rgba(245, 158, 11, 0.5); */
}

/* Hot deal */
.cell-dot--hot {
    background: var(--t-danger);
    /* box-shadow: 0 0 6px var(--t-danger), 0 0 12px rgba(239, 68, 68, 0.3); */
    /* animation: dot-pulse 1.2s ease-in-out infinite; */
}

.cell-dot--hot:hover {
    /* box-shadow: 0 0 10px var(--t-danger), 0 0 20px rgba(239, 68, 68, 0.5); */
}

/* Owned property */
.cell-dot--owned {
    background: var(--t-success);
    /* box-shadow: 0 0 4px rgba(62, 207, 113, 0.4); */
    animation: none;
}

.cell-dot--owned:hover {
    /* box-shadow: 0 0 8px var(--t-success), 0 0 16px rgba(62, 207, 113, 0.4); */
}

/* @keyframes dot-pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
} */

/* ── Legend ── */
.map-legend {
    display: flex;
    gap: var(--t-space-4);
    padding: var(--t-space-2) var(--t-space-1);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.legend-swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 3px;
}

.legend-swatch--owned {
    background: var(--t-success);
}

.legend-swatch--opp {
    background: var(--t-warning);
}

.legend-swatch--hot {
    background: var(--t-danger);
}
</style>
