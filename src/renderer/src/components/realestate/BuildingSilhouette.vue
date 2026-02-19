<script setup lang="ts">
/**
 * BuildingSilhouette — Procedural SVG building silhouette
 *
 * Each building type has a highly distinct silhouette with seed-based
 * per-property variations (window count, decorations, proportions)
 * so no two buildings look exactly the same.
 */
import { computed } from 'vue'
import type { Property } from '@renderer/stores/useRealEstateStore'

const props = withDefaults(
    defineProps<{
        property: Property
        height?: number
        active?: boolean
        showStatus?: boolean
        compact?: boolean
    }>(),
    {
        height: 150,
        active: false,
        showStatus: true,
        compact: false,
    },
)

// ── Seed from property ID for per-building variation ──
const seed = computed(() => {
    let h = 0
    for (let i = 0; i < props.property.id.length; i++) {
        h = ((h << 5) - h + props.property.id.charCodeAt(i)) | 0
    }
    return Math.abs(h)
})

/** Seeded pseudo-random [0,1) */
function seededRand(offset: number): number {
    const x = Math.sin(seed.value + offset * 9301 + 49297) * 233280
    return x - Math.floor(x)
}

type SilhouetteType =
    | 'house'
    | 'apartment'
    | 'duplex'
    | 'tower'
    | 'skyscraper'
    | 'warehouse'
    | 'hotel'
    | 'villa'
    | 'factory'
    | 'castle'

const silhouetteType = computed<SilhouetteType>(() => {
    const id = props.property.templateId
    if (id === 'studio_apt' || id === 'one_bed_apt') return 'apartment'
    if (id === 'duplex') return 'duplex'
    if (id === 'townhouse') return 'house'
    if (id === 'retail_shop' || id === 'strip_mall') return 'warehouse'
    if (id === 'office_floor') return 'tower'
    if (id === 'office_tower') return 'skyscraper'
    if (id === 'apt_complex_sm') return 'tower'
    if (id === 'boutique_hotel' || id === 'luxury_hotel') return 'hotel'
    if (id === 'penthouse') return 'villa'
    if (id === 'skyscraper') return 'skyscraper'
    if (id === 'private_island') return 'castle'
    if (id === 'warehouse') return 'warehouse'
    if (id === 'factory') return 'factory'
    if (id === 'resort_complex') return 'hotel'
    if (id === 'corporate_campus') return 'skyscraper'
    return 'apartment'
})

const svgWidth = computed(() => {
    const widths: Record<SilhouetteType, number> = {
        house: 130,
        apartment: 96,
        duplex: 144,
        tower: 114,
        skyscraper: 130,
        warehouse: 162,
        hotel: 138,
        villa: 154,
        factory: 180,
        castle: 200,
    }
    return widths[silhouetteType.value]
})

// ── Variation parameters ──
const windowRows = computed(() => {
    const t = silhouetteType.value
    if (t === 'skyscraper') return 7 + Math.floor(seededRand(1) * 4)    // 7-10
    if (t === 'tower') return 5 + Math.floor(seededRand(1) * 3)         // 5-7
    if (t === 'hotel') return 5 + Math.floor(seededRand(1) * 3)         // 5-7
    if (t === 'apartment') return 3 + Math.floor(seededRand(1) * 3)     // 3-5
    return 3
})

const windowCols = computed(() => {
    const t = silhouetteType.value
    if (t === 'skyscraper') return 3 + Math.floor(seededRand(2) * 2)    // 3-4
    if (t === 'tower') return 2 + Math.floor(seededRand(2) * 2)         // 2-3
    if (t === 'hotel') return 3 + Math.floor(seededRand(2) * 2)         // 3-4
    if (t === 'apartment') return 2
    return 2
})

const hasChimney = computed(() => seededRand(3) > 0.5)
const hasDormer = computed(() => seededRand(4) > 0.6)
const hasBalcony = computed(() => seededRand(5) > 0.4)
const hasAwning = computed(() => seededRand(6) > 0.5)
const hasFence = computed(() => seededRand(7) > 0.5)
const hasAntenna = computed(() => seededRand(8) > 0.3)
const hasFlag = computed(() => seededRand(9) > 0.5)
const roofVariant = computed(() => Math.floor(seededRand(10) * 3))  // 0, 1, or 2

// ── Extra procedural variation ──
const hasGarage = computed(() => seededRand(11) > 0.55)
const hasGarden = computed(() => seededRand(12) > 0.5)
const windowStyle = computed(() => Math.floor(seededRand(13) * 3))  // 0=square, 1=tall, 2=wide
const doorStyle = computed(() => Math.floor(seededRand(14) * 3))    // 0=rect, 1=arched, 2=double
const hasAC = computed(() => seededRand(15) > 0.5)
const hasSatellite = computed(() => seededRand(16) > 0.6)
const hasMailbox = computed(() => seededRand(17) > 0.5)
const hasSteps = computed(() => seededRand(18) > 0.45)
const facadeDetail = computed(() => Math.floor(seededRand(19) * 3)) // 0=plain, 1=horizontal lines, 2=corner stones
const hasRooftopTank = computed(() => seededRand(20) > 0.6)
const hasSecondDormer = computed(() => seededRand(21) > 0.7)
const hasCanopy = computed(() => seededRand(22) > 0.5)
const hasBalustrade = computed(() => seededRand(23) > 0.5)
const bodyInset = computed(() => Math.floor(seededRand(24) * 3))    // slight width variation 0-2

// ── Lit windows based on occupancy ──
/** Determine if a specific window is "lit" based on occupancy + seed */
function isWindowLit(row: number, col: number): boolean {
    // Each window has its own pseudo-random threshold
    const threshold = seededRand(row * 17 + col * 31 + 100)
    return threshold < props.property.occupancy
}

// ── Condition ──
const conditionPercent = computed(() => props.property.condition)

// ── Renovation stars ──
const renovationLevel = computed(() => props.property.renovationLevel ?? 0)

</script>

<template>
    <div class="building-silhouette" :class="{
        'building-silhouette--active': active,
        'building-silhouette--compact': compact,
    }">
        <svg :width="svgWidth" :height="height" :viewBox="`0 0 ${svgWidth} ${height}`" fill="none"
            xmlns="http://www.w3.org/2000/svg" class="building-svg">

            <!-- ═══ House ═══ -->
            <template v-if="silhouetteType === 'house'">
                <!-- Main body -->
                <rect :x="10 + bodyInset" :y="height * 0.45" :width="svgWidth - 20 - bodyInset * 2"
                    :height="height * 0.55 - 10" rx="1" class="building-fill" />
                <!-- Facade detail -->
                <template v-if="facadeDetail === 1">
                    <line :x1="12 + bodyInset" :y1="height * 0.6" :x2="svgWidth - 12 - bodyInset" :y2="height * 0.6"
                        class="building-stroke" stroke-opacity="0.3" />
                    <line :x1="12 + bodyInset" :y1="height * 0.72" :x2="svgWidth - 12 - bodyInset" :y2="height * 0.72"
                        class="building-stroke" stroke-opacity="0.3" />
                </template>
                <template v-else-if="facadeDetail === 2">
                    <!-- Corner stones -->
                    <rect :x="10 + bodyInset" :y="height * 0.45" width="4" :height="height * 0.55 - 10"
                        class="building-stroke" fill="none" stroke-opacity="0.2" />
                    <rect :x="svgWidth - 14 - bodyInset" :y="height * 0.45" width="4" :height="height * 0.55 - 10"
                        class="building-stroke" fill="none" stroke-opacity="0.2" />
                </template>
                <!-- Roof variants -->
                <template v-if="roofVariant === 0">
                    <polygon
                        :points="`6,${height * 0.47} ${svgWidth / 2},${height * 0.15} ${svgWidth - 6},${height * 0.47}`"
                        class="building-fill" />
                </template>
                <template v-else-if="roofVariant === 1">
                    <polygon
                        :points="`6,${height * 0.47} ${svgWidth * 0.3},${height * 0.2} ${svgWidth * 0.7},${height * 0.2} ${svgWidth - 6},${height * 0.47}`"
                        class="building-fill" />
                </template>
                <template v-else>
                    <polygon
                        :points="`6,${height * 0.47} 6,${height * 0.35} ${svgWidth / 2},${height * 0.18} ${svgWidth - 6},${height * 0.35} ${svgWidth - 6},${height * 0.47}`"
                        class="building-fill" />
                </template>
                <!-- Chimney -->
                <rect v-if="hasChimney" :x="svgWidth * 0.7" :y="height * 0.18" width="6" :height="height * 0.15" rx="1"
                    class="building-fill" />
                <!-- Smoke from chimney -->
                <template v-if="hasChimney && hasGarden">
                    <circle :cx="svgWidth * 0.7 + 3" :cy="height * 0.14" r="3" class="building-smoke" />
                    <circle :cx="svgWidth * 0.7 + 6" :cy="height * 0.11" r="2.5" class="building-smoke" />
                </template>
                <!-- Dormer window(s) -->
                <template v-if="hasDormer">
                    <rect :x="svgWidth / 2 - 6" :y="height * 0.32" width="12" height="10" rx="1"
                        :class="isWindowLit(0, 0) ? 'building-window--lit' : 'building-window'" />
                    <polygon
                        :points="`${svgWidth / 2 - 8},${height * 0.34} ${svgWidth / 2},${height * 0.26} ${svgWidth / 2 + 8},${height * 0.34}`"
                        class="building-fill" />
                </template>
                <!-- Second dormer -->
                <template v-if="hasSecondDormer && roofVariant !== 0">
                    <rect :x="svgWidth * 0.28 - 5" :y="height * 0.34" width="10" height="8" rx="1"
                        :class="isWindowLit(0, 1) ? 'building-window--lit' : 'building-window'" />
                    <polygon
                        :points="`${svgWidth * 0.28 - 7},${height * 0.36} ${svgWidth * 0.28},${height * 0.29} ${svgWidth * 0.28 + 7},${height * 0.36}`"
                        class="building-fill" />
                </template>
                <!-- Door variants -->
                <template v-if="doorStyle === 0">
                    <rect :x="svgWidth / 2 - 6" :y="height - 28" width="12" height="18" rx="2"
                        class="building-window" />
                </template>
                <template v-else-if="doorStyle === 1">
                    <!-- Arched door -->
                    <path
                        :d="`M ${svgWidth / 2 - 6} ${height - 10} L ${svgWidth / 2 - 6} ${height - 24} A 6 6 0 0 1 ${svgWidth / 2 + 6} ${height - 24} L ${svgWidth / 2 + 6} ${height - 10} Z`"
                        class="building-window" />
                </template>
                <template v-else>
                    <!-- Double door -->
                    <rect :x="svgWidth / 2 - 8" :y="height - 28" width="7" height="18" rx="1" class="building-window" />
                    <rect :x="svgWidth / 2 + 1" :y="height - 28" width="7" height="18" rx="1" class="building-window" />
                </template>
                <!-- Steps below door -->
                <template v-if="hasSteps">
                    <rect :x="svgWidth / 2 - 10" :y="height - 12" width="20" height="2" rx="0.5"
                        class="building-fill" />
                    <rect :x="svgWidth / 2 - 12" :y="height - 10" width="24" height="2" rx="0.5"
                        class="building-fill" />
                </template>
                <!-- Window style varies -->
                <template v-if="windowStyle === 0">
                    <!-- Square windows -->
                    <rect :x="16" :y="height * 0.52" width="10" height="10" rx="1"
                        :class="isWindowLit(1, 1) ? 'building-window--lit' : 'building-window'" />
                    <rect :x="svgWidth - 26" :y="height * 0.52" width="10" height="10" rx="1"
                        :class="isWindowLit(1, 2) ? 'building-window--lit' : 'building-window'" />
                </template>
                <template v-else-if="windowStyle === 1">
                    <!-- Tall windows -->
                    <rect :x="16" :y="height * 0.50" width="8" height="16" rx="1"
                        :class="isWindowLit(1, 1) ? 'building-window--lit' : 'building-window'" />
                    <rect :x="svgWidth - 24" :y="height * 0.50" width="8" height="16" rx="1"
                        :class="isWindowLit(1, 2) ? 'building-window--lit' : 'building-window'" />
                </template>
                <template v-else>
                    <!-- Wide windows -->
                    <rect :x="16" :y="height * 0.53" width="14" height="8" rx="1"
                        :class="isWindowLit(1, 1) ? 'building-window--lit' : 'building-window'" />
                    <rect :x="svgWidth - 30" :y="height * 0.53" width="14" height="8" rx="1"
                        :class="isWindowLit(1, 2) ? 'building-window--lit' : 'building-window'" />
                </template>
                <!-- Shutters -->
                <line v-if="hasBalcony" :x1="14" :y1="height * 0.52" :x2="14" :y2="height * 0.52 + 12"
                    class="building-stroke" />
                <line v-if="hasBalcony" :x1="svgWidth - 14" :y1="height * 0.52" :x2="svgWidth - 14"
                    :y2="height * 0.52 + 12" class="building-stroke" />
                <!-- Garage -->
                <template v-if="hasGarage">
                    <rect :x="svgWidth - 24" :y="height - 26" width="16" height="16" rx="1" class="building-window" />
                    <line :x1="svgWidth - 24" :y1="height - 22" :x2="svgWidth - 8" :y2="height - 22"
                        class="building-stroke" stroke-opacity="0.4" />
                    <line :x1="svgWidth - 24" :y1="height - 18" :x2="svgWidth - 8" :y2="height - 18"
                        class="building-stroke" stroke-opacity="0.4" />
                </template>
                <!-- Mailbox -->
                <template v-if="hasMailbox">
                    <rect :x="svgWidth - 8" :y="height - 18" width="4" height="6" rx="0.5" class="building-fill" />
                    <line :x1="svgWidth - 6" :y1="height - 12" :x2="svgWidth - 6" :y2="height - 10"
                        class="building-stroke" />
                </template>
                <!-- Fence -->
                <template v-if="hasFence">
                    <line x1="2" :y1="height - 10" x2="2" :y2="height - 16" class="building-stroke" />
                    <line x1="6" :y1="height - 10" x2="6" :y2="height - 16" class="building-stroke" />
                    <line x1="2" :y1="height - 14" :x2="10" :y2="height - 14" class="building-stroke" />
                    <line :x1="svgWidth - 2" :y1="height - 10" :x2="svgWidth - 2" :y2="height - 16"
                        class="building-stroke" />
                    <line :x1="svgWidth - 6" :y1="height - 10" :x2="svgWidth - 6" :y2="height - 16"
                        class="building-stroke" />
                    <line :x1="svgWidth - 10" :y1="height - 14" :x2="svgWidth - 2" :y2="height - 14"
                        class="building-stroke" />
                </template>
                <!-- Satellite dish -->
                <template v-if="hasSatellite && !hasChimney">
                    <circle :cx="svgWidth * 0.75" :cy="height * 0.3" r="4" class="building-stroke" fill="none"
                        stroke-opacity="0.5" />
                    <line :x1="svgWidth * 0.75" :y1="height * 0.3" :x2="svgWidth * 0.75 + 3" :y2="height * 0.3 - 3"
                        class="building-stroke" stroke-opacity="0.5" />
                </template>
                <!-- Garden bushes -->
                <template v-if="hasGarden">
                    <circle cx="6" :cy="height - 12" r="4" class="building-fill" />
                    <circle :cx="svgWidth - 6" :cy="height - 12" r="3.5" class="building-fill" />
                </template>
            </template>

            <!-- ═══ Apartment ═══ -->
            <template v-if="silhouetteType === 'apartment'">
                <rect x="8" :y="height * 0.2" :width="svgWidth - 16" :height="height * 0.8 - 10" rx="2"
                    class="building-fill" />
                <!-- Facade horizontal bands -->
                <template v-if="facadeDetail === 1">
                    <line x1="10" :y1="height * 0.35" :x2="svgWidth - 10" :y2="height * 0.35" class="building-stroke"
                        stroke-opacity="0.2" />
                    <line x1="10" :y1="height * 0.5" :x2="svgWidth - 10" :y2="height * 0.5" class="building-stroke"
                        stroke-opacity="0.2" />
                    <line x1="10" :y1="height * 0.65" :x2="svgWidth - 10" :y2="height * 0.65" class="building-stroke"
                        stroke-opacity="0.2" />
                </template>
                <!-- Stairwell accent -->
                <rect :x="svgWidth / 2 - 3" :y="height * 0.18" width="6" :height="height * 0.82 - 10" rx="1"
                    class="building-accent-line" />
                <!-- Windows vary by row count -->
                <g v-for="row in windowRows" :key="`apt-${row}`">
                    <rect :x="13" :y="height * 0.25 + (row - 1) * (height * 0.65 / windowRows)" width="8" height="8"
                        rx="1" :class="isWindowLit(row, 1) ? 'building-window--lit' : 'building-window'" />
                    <rect :x="svgWidth - 21" :y="height * 0.25 + (row - 1) * (height * 0.65 / windowRows)" width="8"
                        height="8" rx="1" :class="isWindowLit(row, 2) ? 'building-window--lit' : 'building-window'" />
                    <!-- Balcony railing on some rows -->
                    <line v-if="hasBalcony && row % 2 === 0" :x1="svgWidth - 22"
                        :y1="height * 0.25 + (row - 1) * (height * 0.65 / windowRows) + 9" :x2="svgWidth - 12"
                        :y2="height * 0.25 + (row - 1) * (height * 0.65 / windowRows) + 9" class="building-stroke" />
                    <!-- AC unit on alternating rows (opposite side) -->
                    <rect v-if="hasAC && row % 2 === 1" :x="7"
                        :y="height * 0.25 + (row - 1) * (height * 0.65 / windowRows) + 2" width="5" height="4" rx="0.5"
                        class="building-fill" />
                </g>
                <!-- Awning over entrance -->
                <template v-if="hasAwning">
                    <polygon
                        :points="`${svgWidth / 2 - 14},${height - 24} ${svgWidth / 2},${height - 28} ${svgWidth / 2 + 14},${height - 24}`"
                        class="building-fill" />
                </template>
                <!-- Entrance door -->
                <template v-if="doorStyle === 1">
                    <path
                        :d="`M ${svgWidth / 2 - 5} ${height - 10} L ${svgWidth / 2 - 5} ${height - 20} A 5 5 0 0 1 ${svgWidth / 2 + 5} ${height - 20} L ${svgWidth / 2 + 5} ${height - 10} Z`"
                        class="building-window" />
                </template>
                <template v-else>
                    <rect :x="svgWidth / 2 - 5" :y="height - 22" width="10" height="12" rx="1"
                        class="building-window" />
                </template>
                <!-- Rooftop elements -->
                <rect v-if="hasAntenna" :x="svgWidth / 2 - 1" :y="height * 0.1" width="2" :height="height * 0.1"
                    class="building-stroke-rect" />
                <!-- Satellite dish on roof -->
                <template v-if="hasSatellite">
                    <circle :cx="svgWidth * 0.3" :cy="height * 0.19" r="4" class="building-stroke" fill="none"
                        stroke-opacity="0.5" />
                    <line :x1="svgWidth * 0.3" :y1="height * 0.19" :x2="svgWidth * 0.3 + 3" :y2="height * 0.19 - 3"
                        class="building-stroke" stroke-opacity="0.5" />
                </template>
                <!-- Rooftop water tank -->
                <template v-if="hasRooftopTank">
                    <rect :x="svgWidth * 0.65" :y="height * 0.14" width="10" height="6" rx="1" class="building-fill" />
                    <line :x1="svgWidth * 0.67" :y1="height * 0.2" :x2="svgWidth * 0.67" :y2="height * 0.22"
                        class="building-stroke" />
                    <line :x1="svgWidth * 0.73" :y1="height * 0.2" :x2="svgWidth * 0.73" :y2="height * 0.22"
                        class="building-stroke" />
                </template>
                <!-- Intercom panel -->
                <rect v-if="hasMailbox" :x="svgWidth / 2 + 8" :y="height - 20" width="3" height="5" rx="0.5"
                    class="building-accent-fill" />
            </template>

            <!-- ═══ Duplex ═══ -->
            <template v-if="silhouetteType === 'duplex'">
                <!-- Left unit (shorter) -->
                <rect x="6" :y="height * 0.38" :width="svgWidth / 2 - 8" :height="height * 0.62 - 10" rx="2"
                    class="building-fill" />
                <!-- Right unit (taller) -->
                <rect :x="svgWidth / 2 + 2" :y="height * 0.28" :width="svgWidth / 2 - 8" :height="height * 0.72 - 10"
                    rx="2" class="building-fill" />
                <!-- Roofs vary -->
                <template v-if="roofVariant !== 2">
                    <polygon
                        :points="`4,${height * 0.4} ${svgWidth / 4 + 1},${height * 0.22} ${svgWidth / 2 - 4},${height * 0.4}`"
                        class="building-fill" />
                    <polygon
                        :points="`${svgWidth / 2},${height * 0.3} ${svgWidth * 0.75},${height * 0.12} ${svgWidth - 4},${height * 0.3}`"
                        class="building-fill" />
                </template>
                <template v-else>
                    <!-- Flat roofs with parapet -->
                    <line x1="4" :y1="height * 0.37" :x2="svgWidth / 2 - 4" :y2="height * 0.37"
                        class="building-stroke" />
                    <line :x1="svgWidth / 2" :y1="height * 0.27" :x2="svgWidth - 4" :y2="height * 0.27"
                        class="building-stroke" />
                </template>
                <!-- Chimneys -->
                <rect v-if="hasChimney" :x="svgWidth * 0.2" :y="height * 0.2" width="5" :height="height * 0.1" rx="1"
                    class="building-fill" />
                <rect v-if="hasChimney && hasSatellite" :x="svgWidth * 0.8" :y="height * 0.1" width="5"
                    :height="height * 0.1" rx="1" class="building-fill" />
                <!-- Windows - different styles per unit -->
                <template v-if="windowStyle === 0">
                    <rect x="14" :y="height * 0.48" width="8" height="10" rx="1"
                        :class="isWindowLit(1, 1) ? 'building-window--lit' : 'building-window'" />
                    <rect :x="svgWidth / 2 - 16" :y="height * 0.48" width="8" height="10" rx="1"
                        :class="isWindowLit(1, 2) ? 'building-window--lit' : 'building-window'" />
                </template>
                <template v-else>
                    <!-- Round-top windows for left unit -->
                    <path
                        :d="`M 14 ${height * 0.58} L 14 ${height * 0.5} A 4 4 0 0 1 22 ${height * 0.5} L 22 ${height * 0.58} Z`"
                        :class="isWindowLit(1, 1) ? 'building-window--lit' : 'building-window'" />
                    <path
                        :d="`M ${svgWidth / 2 - 16} ${height * 0.58} L ${svgWidth / 2 - 16} ${height * 0.5} A 4 4 0 0 1 ${svgWidth / 2 - 8} ${height * 0.5} L ${svgWidth / 2 - 8} ${height * 0.58} Z`"
                        :class="isWindowLit(1, 2) ? 'building-window--lit' : 'building-window'" />
                </template>
                <!-- Right unit windows -->
                <rect :x="svgWidth / 2 + 8" :y="height * 0.38" width="10" height="8" rx="1"
                    :class="isWindowLit(2, 1) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth - 22" :y="height * 0.38" width="10" height="8" rx="1"
                    :class="isWindowLit(2, 2) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth / 2 + 8" :y="height * 0.55" width="10" height="8" rx="1"
                    :class="isWindowLit(3, 1) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth - 22" :y="height * 0.55" width="10" height="8" rx="1"
                    :class="isWindowLit(3, 2) ? 'building-window--lit' : 'building-window'" />
                <!-- Extra upper floor window (right unit) -->
                <rect v-if="windowStyle !== 0" :x="svgWidth / 2 + 16" :y="height * 0.32" width="8" height="6" rx="1"
                    :class="isWindowLit(4, 1) ? 'building-window--lit' : 'building-window'" />
                <!-- Doors -->
                <template v-if="doorStyle === 2">
                    <path
                        :d="`M 16 ${height - 10} L 16 ${height - 22} A 5 5 0 0 1 26 ${height - 22} L 26 ${height - 10} Z`"
                        class="building-window" />
                    <path
                        :d="`M ${svgWidth / 2 + 12} ${height - 10} L ${svgWidth / 2 + 12} ${height - 22} A 5 5 0 0 1 ${svgWidth / 2 + 22} ${height - 22} L ${svgWidth / 2 + 22} ${height - 10} Z`"
                        class="building-window" />
                </template>
                <template v-else>
                    <rect x="16" :y="height - 24" width="10" height="14" rx="1" class="building-window" />
                    <rect :x="svgWidth / 2 + 12" :y="height - 24" width="10" height="14" rx="1"
                        class="building-window" />
                </template>
                <!-- House number plaques -->
                <rect v-if="hasMailbox" x="18" :y="height - 30" width="6" height="4" rx="0.5"
                    class="building-accent-fill" />
                <rect v-if="hasMailbox" :x="svgWidth / 2 + 14" :y="height - 30" width="6" height="4" rx="0.5"
                    class="building-accent-fill" />
                <!-- Steps -->
                <template v-if="hasSteps">
                    <rect x="14" :y="height - 12" width="14" height="2" rx="0.5" class="building-fill" />
                    <rect :x="svgWidth / 2 + 10" :y="height - 12" width="14" height="2" rx="0.5"
                        class="building-fill" />
                </template>
                <!-- Dividing wall -->
                <line :x1="svgWidth / 2" :y1="height * 0.38" :x2="svgWidth / 2" :y2="height - 10"
                    class="building-stroke" stroke-dasharray="3 2" />
                <!-- Balcony on right unit -->
                <template v-if="hasBalcony">
                    <line :x1="svgWidth / 2 + 6" :y1="height * 0.48" :x2="svgWidth - 6" :y2="height * 0.48"
                        class="building-stroke" />
                    <line :x1="svgWidth / 2 + 6" :y1="height * 0.48" :x2="svgWidth / 2 + 6" :y2="height * 0.44"
                        class="building-stroke" />
                    <line :x1="svgWidth - 6" :y1="height * 0.48" :x2="svgWidth - 6" :y2="height * 0.44"
                        class="building-stroke" />
                </template>
                <!-- Garden shrub between units -->
                <template v-if="hasGarden">
                    <circle :cx="svgWidth / 2" :cy="height - 13" r="3" class="building-fill" />
                </template>
            </template>

            <!-- ═══ Tower ═══ -->
            <template v-if="silhouetteType === 'tower'">
                <!-- Main body with slight taper -->
                <polygon
                    :points="`10,${height - 10} 13,${height * 0.12} ${svgWidth - 13},${height * 0.12} ${svgWidth - 10},${height - 10}`"
                    class="building-fill" />
                <!-- Horizontal floor bands -->
                <template v-if="facadeDetail === 1">
                    <line v-for="b in 4" :key="`tb-${b}`" :x1="14" :y1="height * (0.2 + b * 0.14)" :x2="svgWidth - 14"
                        :y2="height * (0.2 + b * 0.14)" class="building-stroke" stroke-opacity="0.15" />
                </template>
                <!-- Vertical pilasters -->
                <template v-if="facadeDetail === 2">
                    <line :x1="svgWidth * 0.33" :y1="height * 0.13" :x2="svgWidth * 0.33" :y2="height - 10"
                        class="building-stroke" stroke-opacity="0.15" />
                    <line :x1="svgWidth * 0.66" :y1="height * 0.13" :x2="svgWidth * 0.66" :y2="height - 10"
                        class="building-stroke" stroke-opacity="0.15" />
                </template>
                <!-- Crown/top feature variants -->
                <template v-if="roofVariant === 0">
                    <rect :x="svgWidth / 2 - 8" :y="height * 0.06" width="16" height="6" rx="1" class="building-fill" />
                    <line v-if="hasAntenna" :x1="svgWidth / 2" :y1="height * 0.01" :x2="svgWidth / 2"
                        :y2="height * 0.06" class="building-stroke" />
                    <!-- Second antenna -->
                    <line v-if="hasAntenna && hasSatellite" :x1="svgWidth / 2 + 6" :y1="height * 0.03"
                        :x2="svgWidth / 2 + 6" :y2="height * 0.06" class="building-stroke" />
                </template>
                <template v-else-if="roofVariant === 1">
                    <polygon
                        :points="`15,${height * 0.12} ${svgWidth / 2},${height * 0.03} ${svgWidth - 15},${height * 0.12}`"
                        class="building-fill" />
                </template>
                <template v-else>
                    <rect :x="18" :y="height * 0.07" :width="svgWidth - 36" :height="height * 0.05" rx="1"
                        class="building-fill" />
                    <!-- Rooftop water tank -->
                    <rect v-if="hasRooftopTank" :x="svgWidth * 0.2" :y="height * 0.04" width="8" height="5" rx="1"
                        class="building-fill" />
                </template>
                <!-- Windows grid (varies) -->
                <g v-for="row in windowRows" :key="`tw-${row}`">
                    <rect v-for="col in windowCols" :key="`tw-${row}-${col}`"
                        :x="16 + (col - 1) * ((svgWidth - 32) / windowCols)"
                        :y="height * 0.17 + (row - 1) * ((height * 0.7) / windowRows)" width="6" height="5" rx="1"
                        :class="isWindowLit(row, col) ? 'building-window--lit' : 'building-window'" />
                    <!-- Balcony ledges every other row -->
                    <line v-if="hasBalcony && row % 2 === 0" :x1="14"
                        :y1="height * 0.17 + (row - 1) * ((height * 0.7) / windowRows) + 6" :x2="svgWidth - 14"
                        :y2="height * 0.17 + (row - 1) * ((height * 0.7) / windowRows) + 6" class="building-stroke"
                        stroke-opacity="0.25" />
                </g>
                <!-- AC units on side -->
                <template v-if="hasAC">
                    <rect :x="svgWidth - 12" :y="height * 0.4" width="5" height="4" rx="0.5" class="building-fill" />
                    <rect :x="svgWidth - 12" :y="height * 0.55" width="5" height="4" rx="0.5" class="building-fill" />
                </template>
                <!-- Entrance canopy -->
                <template v-if="hasCanopy">
                    <polygon
                        :points="`${svgWidth / 2 - 16},${height - 24} ${svgWidth / 2},${height - 28} ${svgWidth / 2 + 16},${height - 24}`"
                        class="building-fill" />
                </template>
                <!-- Entrance -->
                <template v-if="doorStyle === 1">
                    <path
                        :d="`M ${svgWidth / 2 - 7} ${height - 10} L ${svgWidth / 2 - 7} ${height - 20} A 7 7 0 0 1 ${svgWidth / 2 + 7} ${height - 20} L ${svgWidth / 2 + 7} ${height - 10} Z`"
                        class="building-window" />
                </template>
                <template v-else>
                    <rect :x="svgWidth / 2 - 7" :y="height - 22" width="14" height="12" rx="2"
                        class="building-window" />
                </template>
            </template>

            <!-- ═══ Skyscraper ═══ -->
            <template v-if="silhouetteType === 'skyscraper'">
                <!-- Base (wider) -->
                <rect x="8" :y="height * 0.7" :width="svgWidth - 16" :height="height * 0.3 - 10" rx="2"
                    class="building-fill" />
                <!-- Main shaft -->
                <rect x="14" :y="height * 0.12" :width="svgWidth - 28" :height="height * 0.6" rx="1"
                    class="building-fill" />
                <!-- Setback middle -->
                <rect x="11" :y="height * 0.45" :width="svgWidth - 22" :height="height * 0.27" rx="1"
                    class="building-fill" />
                <!-- Crown variants -->
                <template v-if="roofVariant === 0">
                    <!-- Art deco stepped crown -->
                    <rect :x="18" :y="height * 0.07" :width="svgWidth - 36" :height="height * 0.06" rx="1"
                        class="building-fill" />
                    <rect :x="24" :y="height * 0.03" :width="svgWidth - 48" :height="height * 0.05" rx="1"
                        class="building-fill" />
                    <polygon
                        :points="`${svgWidth / 2 - 4},${height * 0.03} ${svgWidth / 2},${height * 0.005} ${svgWidth / 2 + 4},${height * 0.03}`"
                        class="building-accent-fill" />
                </template>
                <template v-else-if="roofVariant === 1">
                    <!-- Spire -->
                    <polygon
                        :points="`${svgWidth / 2 - 6},${height * 0.12} ${svgWidth / 2},${height * 0.01} ${svgWidth / 2 + 6},${height * 0.12}`"
                        class="building-fill" />
                </template>
                <template v-else>
                    <!-- Flat with helipad circle -->
                    <rect :x="16" :y="height * 0.1" :width="svgWidth - 32" height="3" rx="1" class="building-fill" />
                    <circle :cx="svgWidth / 2" :cy="height * 0.1" r="5" class="building-stroke" fill="none"
                        stroke-opacity="0.3" />
                </template>
                <!-- Facade bands -->
                <template v-if="facadeDetail === 1">
                    <line v-for="b in 3" :key="`skb-${b}`" x1="12" :y1="height * (0.25 + b * 0.15)" :x2="svgWidth - 12"
                        :y2="height * (0.25 + b * 0.15)" class="building-stroke" stroke-opacity="0.12" />
                </template>
                <!-- Curtain wall windows (dense grid) -->
                <g v-for="row in windowRows" :key="`sk-${row}`">
                    <rect v-for="col in windowCols" :key="`sk-${row}-${col}`"
                        :x="18 + (col - 1) * ((svgWidth - 36) / windowCols)"
                        :y="height * 0.15 + (row - 1) * ((height * 0.5) / windowRows)" width="5" height="4" rx="0.5"
                        :class="isWindowLit(row, col) ? 'building-window--lit' : 'building-window'" />
                </g>
                <!-- Base-level shop windows -->
                <template v-if="hasAwning">
                    <rect x="12" :y="height * 0.75" width="12" height="8" rx="1"
                        :class="isWindowLit(10, 1) ? 'building-window--lit' : 'building-window'" />
                    <rect :x="svgWidth - 24" :y="height * 0.75" width="12" height="8" rx="1"
                        :class="isWindowLit(10, 2) ? 'building-window--lit' : 'building-window'" />
                </template>
                <!-- Flag on top -->
                <template v-if="hasFlag">
                    <line :x1="svgWidth / 2" :y1="height * 0.005" :x2="svgWidth / 2" :y2="height * 0.06"
                        class="building-stroke" />
                    <rect :x="svgWidth / 2" :y="height * 0.005" width="8" height="4" rx="0.5"
                        class="building-accent-fill" />
                </template>
                <!-- Revolving door entrance -->
                <template v-if="doorStyle === 1">
                    <path
                        :d="`M ${svgWidth / 2 - 10} ${height - 10} L ${svgWidth / 2 - 10} ${height - 20} A 10 10 0 0 1 ${svgWidth / 2 + 10} ${height - 20} L ${svgWidth / 2 + 10} ${height - 10} Z`"
                        class="building-window" />
                </template>
                <template v-else>
                    <rect :x="svgWidth / 2 - 10" :y="height - 22" width="20" height="12" rx="3"
                        class="building-window" />
                </template>
                <!-- Entrance canopy -->
                <line v-if="hasCanopy" :x1="6" :y1="height - 24" :x2="svgWidth - 6" :y2="height - 24"
                    class="building-stroke" stroke-width="2" />
            </template>

            <!-- ═══ Warehouse ═══ -->
            <template v-if="silhouetteType === 'warehouse'">
                <rect x="6" :y="height * 0.42" :width="svgWidth - 12" :height="height * 0.58 - 10" rx="2"
                    class="building-fill" />
                <!-- Side annex -->
                <rect v-if="hasGarage" :x="svgWidth - 22" :y="height * 0.5" width="16" :height="height * 0.5 - 10"
                    rx="1" class="building-fill" />
                <!-- Roof variants -->
                <template v-if="roofVariant === 0">
                    <path
                        :d="`M 6 ${height * 0.44} Q ${svgWidth / 2} ${height * 0.22} ${svgWidth - 6} ${height * 0.44} Z`"
                        class="building-fill" />
                </template>
                <template v-else-if="roofVariant === 1">
                    <line x1="4" :y1="height * 0.41" :x2="svgWidth - 4" :y2="height * 0.41" class="building-stroke" />
                    <line x1="4" :y1="height * 0.39" :x2="4" :y2="height * 0.43" class="building-stroke" />
                    <line :x1="svgWidth - 4" :y1="height * 0.39" :x2="svgWidth - 4" :y2="height * 0.43"
                        class="building-stroke" />
                </template>
                <template v-else>
                    <polygon
                        :points="`4,${height * 0.44} ${svgWidth / 2},${height * 0.28} ${svgWidth - 4},${height * 0.44}`"
                        class="building-fill" />
                </template>
                <!-- Loading doors (big) -->
                <rect x="12" :y="height - 32" width="20" height="22" rx="2" class="building-window" />
                <!-- Roll-up lines on door -->
                <line x1="12" :y1="height - 27" :x2="32" :y2="height - 27" class="building-stroke"
                    stroke-opacity="0.3" />
                <line x1="12" :y1="height - 22" :x2="32" :y2="height - 22" class="building-stroke"
                    stroke-opacity="0.3" />
                <line x1="12" :y1="height - 17" :x2="32" :y2="height - 17" class="building-stroke"
                    stroke-opacity="0.3" />
                <rect :x="svgWidth - 32" :y="height - 32" width="20" height="22" rx="2" class="building-window" />
                <line :x1="svgWidth - 32" :y1="height - 27" :x2="svgWidth - 12" :y2="height - 27"
                    class="building-stroke" stroke-opacity="0.3" />
                <line :x1="svgWidth - 32" :y1="height - 22" :x2="svgWidth - 12" :y2="height - 22"
                    class="building-stroke" stroke-opacity="0.3" />
                <!-- Loading dock strip -->
                <line x1="10" :y1="height - 10" :x2="svgWidth - 10" :y2="height - 10" class="building-accent-stroke" />
                <!-- Forklift symbol -->
                <template v-if="hasSteps">
                    <rect :x="svgWidth / 2 - 3" :y="height - 18" width="6" height="6" rx="1" class="building-fill" />
                    <line :x1="svgWidth / 2 + 3" :y1="height - 18" :x2="svgWidth / 2 + 3" :y2="height - 24"
                        class="building-stroke" stroke-opacity="0.4" />
                </template>
                <!-- Signage area -->
                <rect v-if="hasAwning" :x="svgWidth / 2 - 12" :y="height * 0.48" width="24" height="8" rx="1"
                    class="building-accent-fill" />
                <!-- Small upper windows (varied count) -->
                <rect :x="svgWidth * 0.3 - 3" :y="height * 0.48" width="4" height="4" rx="0.5"
                    :class="isWindowLit(1, 1) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.5 - 2" :y="height * 0.48" width="4" height="4" rx="0.5"
                    :class="isWindowLit(1, 2) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.7 - 1" :y="height * 0.48" width="4" height="4" rx="0.5"
                    :class="isWindowLit(1, 3) ? 'building-window--lit' : 'building-window'" />
                <!-- Ventilation unit on roof -->
                <template v-if="hasRooftopTank">
                    <rect :x="svgWidth * 0.7" :y="height * 0.36" width="8" height="5" rx="1" class="building-fill" />
                </template>
                <!-- Security light -->
                <circle v-if="hasAntenna" :cx="svgWidth - 8" :cy="height * 0.44" r="2" class="building-accent-fill" />
            </template>

            <!-- ═══ Hotel ═══ -->
            <template v-if="silhouetteType === 'hotel'">
                <!-- Main body -->
                <rect x="10" :y="height * 0.1" :width="svgWidth - 20" :height="height * 0.9 - 10" rx="3"
                    class="building-fill" />
                <!-- Penthouse setback -->
                <rect :x="14" :y="height * 0.08" :width="svgWidth - 28" :height="height * 0.08" rx="2"
                    class="building-fill" />
                <!-- Facade horizontal bands -->
                <template v-if="facadeDetail === 1">
                    <line v-for="b in 5" :key="`htb-${b}`" x1="12" :y1="height * (0.15 + b * 0.1)" :x2="svgWidth - 12"
                        :y2="height * (0.15 + b * 0.1)" class="building-stroke" stroke-opacity="0.12" />
                </template>
                <!-- Grand entrance canopy -->
                <rect x="4" :y="height - 24" :width="svgWidth - 8" height="5" rx="1" class="building-accent-fill" />
                <!-- Columns (varied count) -->
                <line :x1="svgWidth * 0.2" :y1="height - 19" :x2="svgWidth * 0.2" :y2="height - 10"
                    class="building-stroke" />
                <line :x1="svgWidth * 0.4" :y1="height - 19" :x2="svgWidth * 0.4" :y2="height - 10"
                    class="building-stroke" />
                <line :x1="svgWidth * 0.6" :y1="height - 19" :x2="svgWidth * 0.6" :y2="height - 10"
                    class="building-stroke" />
                <line :x1="svgWidth * 0.8" :y1="height - 19" :x2="svgWidth * 0.8" :y2="height - 10"
                    class="building-stroke" />
                <!-- Window grid -->
                <g v-for="row in windowRows" :key="`ht-${row}`">
                    <rect v-for="col in windowCols" :key="`ht-${row}-${col}`"
                        :x="15 + (col - 1) * ((svgWidth - 30) / windowCols)"
                        :y="height * 0.15 + (row - 1) * ((height * 0.5) / windowRows)" width="7" height="6" rx="1"
                        :class="isWindowLit(row, col) ? 'building-window--lit' : 'building-window'" />
                    <!-- Balcony ledges -->
                    <line v-if="hasBalcony && row % 2 === 0" :x1="12"
                        :y1="height * 0.15 + (row - 1) * ((height * 0.5) / windowRows) + 7" :x2="svgWidth - 12"
                        :y2="height * 0.15 + (row - 1) * ((height * 0.5) / windowRows) + 7" class="building-stroke"
                        stroke-opacity="0.2" />
                </g>
                <!-- Side wing (if hasGarage) -->
                <template v-if="hasGarage">
                    <rect x="2" :y="height * 0.4" width="10" :height="height * 0.6 - 10" rx="1" class="building-fill" />
                    <rect x="4" :y="height * 0.45" width="4" height="4" rx="0.5"
                        :class="isWindowLit(5, 1) ? 'building-window--lit' : 'building-window'" />
                    <rect x="4" :y="height * 0.55" width="4" height="4" rx="0.5"
                        :class="isWindowLit(5, 2) ? 'building-window--lit' : 'building-window'" />
                </template>
                <!-- Entrance door -->
                <template v-if="doorStyle === 1">
                    <path
                        :d="`M ${svgWidth / 2 - 8} ${height - 10} L ${svgWidth / 2 - 8} ${height - 18} A 8 8 0 0 1 ${svgWidth / 2 + 8} ${height - 18} L ${svgWidth / 2 + 8} ${height - 10} Z`"
                        class="building-window" />
                </template>
                <template v-else>
                    <rect :x="svgWidth / 2 - 6" :y="height - 20" width="12" height="10" rx="2"
                        class="building-window" />
                </template>
                <!-- Flag or sign -->
                <template v-if="hasFlag">
                    <line :x1="svgWidth / 2" :y1="height * 0.01" :x2="svgWidth / 2" :y2="height * 0.08"
                        class="building-stroke" />
                    <rect :x="svgWidth / 2" :y="height * 0.01" width="10" height="5" rx="1"
                        class="building-accent-fill" />
                </template>
                <template v-else>
                    <rect v-if="hasAntenna" :x="svgWidth / 2 - 1" :y="height * 0.01" width="2" :height="height * 0.07"
                        class="building-stroke-rect" />
                </template>
                <!-- Rooftop pool -->
                <template v-if="hasBalustrade">
                    <rect :x="svgWidth * 0.6" :y="height * 0.085" :width="svgWidth * 0.2" height="3" rx="1"
                        class="building-accent-fill" />
                </template>
                <!-- Stars indicator (accent dots) -->
                <circle v-for="star in 3" :key="`star-${star}`" :cx="svgWidth / 2 - 8 + (star - 1) * 8"
                    :cy="height * 0.13" r="1.5" class="building-accent-fill" />
                <!-- Valet parking sign -->
                <rect v-if="hasSteps" :x="svgWidth - 12" :y="height - 16" width="6" height="8" rx="0.5"
                    class="building-accent-fill" />
            </template>

            <!-- ═══ Villa / Penthouse ═══ -->
            <template v-if="silhouetteType === 'villa'">
                <!-- Main body -->
                <rect x="12" :y="height * 0.38" :width="svgWidth - 24" :height="height * 0.62 - 10" rx="2"
                    class="building-fill" />
                <!-- Left wing -->
                <rect x="4" :y="height * 0.48" width="18" :height="height * 0.52 - 10" rx="2" class="building-fill" />
                <!-- Right wing -->
                <rect :x="svgWidth - 22" :y="height * 0.48" width="18" :height="height * 0.52 - 10" rx="2"
                    class="building-fill" />
                <!-- Central roof -->
                <polygon
                    :points="`18,${height * 0.4} ${svgWidth / 2},${height * 0.18} ${svgWidth - 18},${height * 0.4}`"
                    class="building-fill" />
                <!-- Wing roofs -->
                <template v-if="roofVariant !== 2">
                    <polygon :points="`2,${height * 0.5} 13,${height * 0.38} 24,${height * 0.5}`"
                        class="building-fill" />
                    <polygon
                        :points="`${svgWidth - 24},${height * 0.5} ${svgWidth - 13},${height * 0.38} ${svgWidth - 2},${height * 0.5}`"
                        class="building-fill" />
                </template>
                <!-- Chimney -->
                <rect v-if="hasChimney" :x="svgWidth * 0.35" :y="height * 0.2" width="5" :height="height * 0.1" rx="1"
                    class="building-fill" />
                <!-- Columns (classical) -->
                <line :x1="svgWidth / 2 - 14" :y1="height * 0.43" :x2="svgWidth / 2 - 14" :y2="height - 12"
                    class="building-stroke" />
                <line :x1="svgWidth / 2 + 14" :y1="height * 0.43" :x2="svgWidth / 2 + 14" :y2="height - 12"
                    class="building-stroke" />
                <line :x1="svgWidth / 2 - 6" :y1="height * 0.43" :x2="svgWidth / 2 - 6" :y2="height - 12"
                    class="building-stroke" />
                <line :x1="svgWidth / 2 + 6" :y1="height * 0.43" :x2="svgWidth / 2 + 6" :y2="height - 12"
                    class="building-stroke" />
                <!-- Pediment (triangular above columns) -->
                <template v-if="hasBalustrade">
                    <line :x1="svgWidth / 2 - 16" :y1="height * 0.43" :x2="svgWidth / 2 + 16" :y2="height * 0.43"
                        class="building-stroke" stroke-width="2" />
                </template>
                <!-- Large arched window (center) -->
                <path
                    :d="`M ${svgWidth / 2 - 8} ${height * 0.58} A 8 8 0 0 1 ${svgWidth / 2 + 8} ${height * 0.58} L ${svgWidth / 2 + 8} ${height * 0.68} L ${svgWidth / 2 - 8} ${height * 0.68} Z`"
                    :class="isWindowLit(1, 1) ? 'building-window--lit' : 'building-window'" />
                <!-- Side windows (varied style) -->
                <template v-if="windowStyle === 1">
                    <!-- Tall windows -->
                    <rect x="7" :y="height * 0.53" width="6" height="12" rx="1"
                        :class="isWindowLit(1, 2) ? 'building-window--lit' : 'building-window'" />
                    <rect :x="svgWidth - 13" :y="height * 0.53" width="6" height="12" rx="1"
                        :class="isWindowLit(1, 3) ? 'building-window--lit' : 'building-window'" />
                </template>
                <template v-else>
                    <rect x="8" :y="height * 0.55" width="8" height="8" rx="1"
                        :class="isWindowLit(1, 2) ? 'building-window--lit' : 'building-window'" />
                    <rect :x="svgWidth - 16" :y="height * 0.55" width="8" height="8" rx="1"
                        :class="isWindowLit(1, 3) ? 'building-window--lit' : 'building-window'" />
                </template>
                <!-- Upper floor wing windows -->
                <rect v-if="windowStyle !== 2" x="8" :y="height * 0.72" width="6" height="6" rx="1"
                    :class="isWindowLit(2, 1) ? 'building-window--lit' : 'building-window'" />
                <rect v-if="windowStyle !== 2" :x="svgWidth - 14" :y="height * 0.72" width="6" height="6" rx="1"
                    :class="isWindowLit(2, 2) ? 'building-window--lit' : 'building-window'" />
                <!-- Grand entrance -->
                <template v-if="doorStyle === 2">
                    <rect :x="svgWidth / 2 - 8" :y="height - 22" width="7" height="14" rx="1" class="building-window" />
                    <rect :x="svgWidth / 2 + 1" :y="height - 22" width="7" height="14" rx="1" class="building-window" />
                </template>
                <template v-else>
                    <rect :x="svgWidth / 2 - 5" :y="height - 20" width="10" height="12" rx="2"
                        class="building-window" />
                </template>
                <!-- Steps -->
                <template v-if="hasSteps">
                    <rect :x="svgWidth / 2 - 14" :y="height - 10" width="28" height="2" rx="0.5"
                        class="building-fill" />
                    <rect :x="svgWidth / 2 - 16" :y="height - 8" width="32" height="2" rx="0.5" class="building-fill" />
                </template>
                <!-- Garden/pool -->
                <template v-if="hasGarden">
                    <ellipse :cx="svgWidth / 2" :cy="height - 14" rx="10" ry="2.5" class="building-accent-fill" />
                </template>
                <!-- Terrace railing -->
                <line x1="3" :y1="height - 10" :x2="svgWidth - 3" :y2="height - 10" class="building-stroke"
                    stroke-dasharray="2 2" />
                <!-- Satellite dish on wing -->
                <template v-if="hasSatellite">
                    <circle :cx="svgWidth - 14" :cy="height * 0.46" r="3" class="building-stroke" fill="none"
                        stroke-opacity="0.4" />
                </template>
            </template>

            <!-- ═══ Factory ═══ -->
            <template v-if="silhouetteType === 'factory'">
                <rect x="6" :y="height * 0.38" :width="svgWidth - 12" :height="height * 0.62 - 10" rx="2"
                    class="building-fill" />
                <!-- Office annex -->
                <template v-if="hasGarage">
                    <rect x="6" :y="height * 0.28" width="20" :height="height * 0.12" rx="1" class="building-fill" />
                    <rect x="10" :y="height * 0.3" width="5" height="5" rx="0.5"
                        :class="isWindowLit(5, 1) ? 'building-window--lit' : 'building-window'" />
                    <rect x="18" :y="height * 0.3" width="5" height="5" rx="0.5"
                        :class="isWindowLit(5, 2) ? 'building-window--lit' : 'building-window'" />
                </template>
                <!-- Industrial sawtooth roof -->
                <polygon
                    :points="`6,${height * 0.4} 6,${height * 0.22} ${svgWidth * 0.25},${height * 0.4} ${svgWidth * 0.25},${height * 0.18} ${svgWidth * 0.5},${height * 0.4} ${svgWidth * 0.5},${height * 0.14} ${svgWidth * 0.75},${height * 0.4}`"
                    class="building-fill" />
                <!-- Smokestacks (1-3 based on seed) -->
                <rect :x="svgWidth - 18" :y="height * 0.02" width="7" :height="height * 0.36" rx="1"
                    class="building-fill" />
                <rect v-if="hasChimney" :x="svgWidth - 30" :y="height * 0.08" width="6" :height="height * 0.3" rx="1"
                    class="building-fill" />
                <rect v-if="hasChimney && hasRooftopTank" :x="svgWidth - 40" :y="height * 0.12" width="5"
                    :height="height * 0.26" rx="1" class="building-fill" />
                <!-- Smoke puffs (more) -->
                <circle :cx="svgWidth - 14" :cy="height * 0.01" r="4" class="building-smoke" />
                <circle :cx="svgWidth - 10" :cy="height * 0.03" r="3" class="building-smoke" />
                <circle v-if="hasChimney" :cx="svgWidth - 27" :cy="height * 0.06" r="3.5" class="building-smoke" />
                <circle v-if="hasChimney" :cx="svgWidth - 24" :cy="height * 0.03" r="2.5" class="building-smoke" />
                <!-- Industrial doors (roll-up) -->
                <rect x="12" :y="height - 32" width="24" height="22" rx="1" class="building-window" />
                <line x1="12" :y1="height - 26" :x2="36" :y2="height - 26" class="building-stroke" />
                <line x1="12" :y1="height - 20" :x2="36" :y2="height - 20" class="building-stroke" />
                <line x1="12" :y1="height - 14" :x2="36" :y2="height - 14" class="building-stroke" />
                <rect :x="svgWidth / 2 + 6" :y="height - 32" width="24" height="22" rx="1" class="building-window" />
                <line :x1="svgWidth / 2 + 6" :y1="height - 26" :x2="svgWidth / 2 + 30" :y2="height - 26"
                    class="building-stroke" />
                <line :x1="svgWidth / 2 + 6" :y1="height - 20" :x2="svgWidth / 2 + 30" :y2="height - 20"
                    class="building-stroke" />
                <!-- Small personnel door -->
                <rect v-if="hasSteps" :x="svgWidth / 2 - 5" :y="height - 22" width="8" height="12" rx="1"
                    class="building-window" />
                <!-- Pipes -->
                <line :x1="svgWidth * 0.6" :y1="height * 0.42" :x2="svgWidth * 0.6" :y2="height * 0.58"
                    class="building-accent-stroke" />
                <!-- Horizontal pipe -->
                <line v-if="hasAC" :x1="svgWidth * 0.35" :y1="height * 0.44" :x2="svgWidth * 0.65" :y2="height * 0.44"
                    class="building-stroke" stroke-opacity="0.3" />
                <!-- Warning stripes on dock edge -->
                <template v-if="hasAwning">
                    <line x1="8" :y1="height - 10" :x2="svgWidth - 8" :y2="height - 10" class="building-accent-stroke"
                        stroke-width="2" />
                </template>
                <!-- Crane -->
                <template v-if="hasFlag">
                    <line x1="40" :y1="height * 0.05" x2="40" :y2="height * 0.38" class="building-stroke" />
                    <line x1="40" :y1="height * 0.05" x2="60" :y2="height * 0.05" class="building-stroke" />
                    <line x1="60" :y1="height * 0.05" x2="60" :y2="height * 0.12" class="building-stroke"
                        stroke-dasharray="2 2" />
                </template>
            </template>

            <!-- ═══ Castle ═══ -->
            <template v-if="silhouetteType === 'castle'">
                <!-- Curtain wall (main body) -->
                <rect :x="svgWidth * 0.2" :y="height * 0.32" :width="svgWidth * 0.6" :height="height * 0.6" rx="2"
                    class="building-fill" />

                <!-- Left tower -->
                <rect :x="svgWidth * 0.1" :y="height * 0.18" :width="svgWidth * 0.16" :height="height * 0.74" rx="1"
                    class="building-fill" />
                <!-- Left tower battlements -->
                <rect :x="svgWidth * 0.1" :y="height * 0.14" width="5" :height="height * 0.06" class="building-fill" />
                <rect :x="svgWidth * 0.1 + 8" :y="height * 0.14" width="5" :height="height * 0.06"
                    class="building-fill" />
                <rect :x="svgWidth * 0.1 + 16" :y="height * 0.14" width="5" :height="height * 0.06"
                    class="building-fill" />
                <!-- Left tower windows -->
                <rect :x="svgWidth * 0.14" :y="height * 0.26" width="5" height="8" rx="2.5"
                    :class="isWindowLit(1, 1) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.14" :y="height * 0.42" width="5" height="8" rx="2.5"
                    :class="isWindowLit(1, 2) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.14" :y="height * 0.58" width="5" height="8" rx="2.5"
                    :class="isWindowLit(1, 3) ? 'building-window--lit' : 'building-window'" />

                <!-- Right tower -->
                <rect :x="svgWidth * 0.74" :y="height * 0.18" :width="svgWidth * 0.16" :height="height * 0.74" rx="1"
                    class="building-fill" />
                <!-- Right tower battlements -->
                <rect :x="svgWidth * 0.74" :y="height * 0.14" width="5" :height="height * 0.06" class="building-fill" />
                <rect :x="svgWidth * 0.74 + 8" :y="height * 0.14" width="5" :height="height * 0.06"
                    class="building-fill" />
                <rect :x="svgWidth * 0.74 + 16" :y="height * 0.14" width="5" :height="height * 0.06"
                    class="building-fill" />
                <!-- Right tower windows -->
                <rect :x="svgWidth * 0.78" :y="height * 0.26" width="5" height="8" rx="2.5"
                    :class="isWindowLit(2, 1) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.78" :y="height * 0.42" width="5" height="8" rx="2.5"
                    :class="isWindowLit(2, 2) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.78" :y="height * 0.58" width="5" height="8" rx="2.5"
                    :class="isWindowLit(2, 3) ? 'building-window--lit' : 'building-window'" />

                <!-- Central keep (taller middle tower) -->
                <rect :x="svgWidth * 0.38" :y="height * 0.12" :width="svgWidth * 0.24" :height="height * 0.52" rx="2"
                    class="building-fill" />
                <!-- Keep battlements -->
                <rect :x="svgWidth * 0.38" :y="height * 0.08" width="5" :height="height * 0.06" class="building-fill" />
                <rect :x="svgWidth * 0.38 + 8" :y="height * 0.08" width="5" :height="height * 0.06"
                    class="building-fill" />
                <rect :x="svgWidth * 0.38 + 16" :y="height * 0.08" width="5" :height="height * 0.06"
                    class="building-fill" />
                <rect :x="svgWidth * 0.38 + 24" :y="height * 0.08" width="5" :height="height * 0.06"
                    class="building-fill" />
                <rect :x="svgWidth * 0.38 + 32" :y="height * 0.08" width="5" :height="height * 0.06"
                    class="building-fill" />
                <!-- Keep windows (arched) -->
                <rect :x="svgWidth * 0.42" :y="height * 0.18" width="5" height="8" rx="2.5"
                    :class="isWindowLit(3, 1) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.53" :y="height * 0.18" width="5" height="8" rx="2.5"
                    :class="isWindowLit(3, 2) ? 'building-window--lit' : 'building-window'" />
                <!-- Keep lower row windows -->
                <rect :x="svgWidth * 0.42" :y="height * 0.34" width="5" height="8" rx="2.5"
                    :class="isWindowLit(4, 1) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.475" :y="height * 0.34" width="5" height="8" rx="2.5"
                    :class="isWindowLit(4, 2) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.53" :y="height * 0.34" width="5" height="8" rx="2.5"
                    :class="isWindowLit(4, 3) ? 'building-window--lit' : 'building-window'" />

                <!-- Center wall battlements -->
                <rect :x="svgWidth * 0.26" :y="height * 0.28" width="4" :height="height * 0.06" class="building-fill" />
                <rect :x="svgWidth * 0.32" :y="height * 0.28" width="4" :height="height * 0.06" class="building-fill" />
                <rect :x="svgWidth * 0.64" :y="height * 0.28" width="4" :height="height * 0.06" class="building-fill" />
                <rect :x="svgWidth * 0.70" :y="height * 0.28" width="4" :height="height * 0.06" class="building-fill" />

                <!-- Gatehouse / main gate (arched) -->
                <path :d="`M ${svgWidth * 0.43} ${height * 0.92}
                    L ${svgWidth * 0.43} ${height * 0.72}
                    A 8 8 0 0 1 ${svgWidth * 0.57} ${height * 0.72}
                    L ${svgWidth * 0.57} ${height * 0.92} Z`" class="building-window" />
                <!-- Portcullis lines -->
                <line :x1="svgWidth * 0.47" :y1="height * 0.72" :x2="svgWidth * 0.47" :y2="height * 0.92"
                    class="building-stroke" stroke-opacity="0.3" />
                <line :x1="svgWidth * 0.53" :y1="height * 0.72" :x2="svgWidth * 0.53" :y2="height * 0.92"
                    class="building-stroke" stroke-opacity="0.3" />
                <line :x1="svgWidth * 0.43" :y1="height * 0.80" :x2="svgWidth * 0.57" :y2="height * 0.80"
                    class="building-stroke" stroke-opacity="0.3" />
                <line :x1="svgWidth * 0.43" :y1="height * 0.86" :x2="svgWidth * 0.57" :y2="height * 0.86"
                    class="building-stroke" stroke-opacity="0.3" />

                <!-- Wall windows (on main curtain wall) -->
                <rect :x="svgWidth * 0.26" :y="height * 0.5" width="5" height="7" rx="2.5"
                    :class="isWindowLit(5, 1) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.33" :y="height * 0.5" width="5" height="7" rx="2.5"
                    :class="isWindowLit(5, 2) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.64" :y="height * 0.5" width="5" height="7" rx="2.5"
                    :class="isWindowLit(5, 3) ? 'building-window--lit' : 'building-window'" />
                <rect :x="svgWidth * 0.70" :y="height * 0.5" width="5" height="7" rx="2.5"
                    :class="isWindowLit(5, 4) ? 'building-window--lit' : 'building-window'" />

                <!-- Flag on left tower -->
                <template v-if="hasFlag">
                    <line :x1="svgWidth * 0.18" :y1="height * 0.14" :x2="svgWidth * 0.18" :y2="height * 0.02"
                        class="building-stroke" />
                    <polygon
                        :points="`${svgWidth * 0.18},${height * 0.02} ${svgWidth * 0.18},${height * 0.09} ${svgWidth * 0.24},${height * 0.055}`"
                        class="building-accent-fill" />
                </template>

                <!-- Flag on right tower -->
                <template v-if="hasChimney">
                    <line :x1="svgWidth * 0.82" :y1="height * 0.14" :x2="svgWidth * 0.82" :y2="height * 0.04"
                        class="building-stroke" />
                    <polygon
                        :points="`${svgWidth * 0.82},${height * 0.04} ${svgWidth * 0.82},${height * 0.10} ${svgWidth * 0.88},${height * 0.07}`"
                        class="building-accent-fill" />
                </template>

                <!-- Turret on keep (optional) -->
                <template v-if="hasBalcony">
                    <rect :x="svgWidth * 0.46" :y="height * 0.02" width="8" :height="height * 0.08" rx="1"
                        class="building-fill" />
                    <polygon
                        :points="`${svgWidth * 0.46},${height * 0.02} ${svgWidth * 0.5},${height * -0.04} ${svgWidth * 0.54},${height * 0.02}`"
                        class="building-fill" />
                </template>

                <!-- Stone texture lines -->
                <line :x1="svgWidth * 0.2" :y1="height * 0.5" :x2="svgWidth * 0.38" :y2="height * 0.5"
                    class="building-stroke" stroke-opacity="0.15" />
                <line :x1="svgWidth * 0.62" :y1="height * 0.5" :x2="svgWidth * 0.8" :y2="height * 0.5"
                    class="building-stroke" stroke-opacity="0.15" />
                <line :x1="svgWidth * 0.2" :y1="height * 0.65" :x2="svgWidth * 0.8" :y2="height * 0.65"
                    class="building-stroke" stroke-opacity="0.1" />

                <!-- Bridge / drawbridge (optional) -->
                <template v-if="hasGarage">
                    <rect :x="svgWidth * 0.44" :y="height * 0.91" :width="svgWidth * 0.12" height="3" rx="0.5"
                        class="building-accent-fill" opacity="0.5" />
                </template>
            </template>

            <!-- Ground line -->
            <line x1="0" :y1="height - 8" :x2="svgWidth" :y2="height - 8" class="building-ground" />
        </svg>

        <!-- Renovation stars (between SVG and condition bar) -->
        <!-- <div v-if="renovationLevel > 0" class="building-reno-stars">
            <span v-for="s in renovationLevel" :key="`star-${s}`" class="building-reno-star">&#9733;</span>
        </div> -->

        <!-- Condition bar -->
        <div v-if="showStatus" class="building-condition-bar">
            <div class="building-condition-bar__fill" :style="{
                width: conditionPercent + '%',
                background: conditionPercent >= 70 ? 'var(--t-success)'
                    : conditionPercent >= 40 ? 'var(--t-warning)'
                        : 'var(--t-danger)',
            }" />
        </div>
    </div>
</template>

<style scoped>
.building-silhouette {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: transform var(--t-transition-normal);
    margin: 0 auto;
}

.building-silhouette:hover {
    transform: translateY(-2px);
}

.building-silhouette--active {
    transform: translateY(-4px);
}

.building-silhouette--compact {
    cursor: pointer;
}

.building-svg {
    transition: opacity var(--t-transition-slow);
}

/* Building fills and strokes — solid theme-aware (white on dark, black on light) */
.building-fill {
    fill: var(--t-text);
    transition: fill var(--t-transition-normal);
}

.building-stroke {
    stroke: var(--t-text);
    stroke-width: 1.5;
    fill: none;
    transition: stroke var(--t-transition-normal);
}

.building-window {
    fill: var(--t-bg-base);
    stroke: var(--t-text);
    stroke-width: 0.5;
}

.building-window--lit {
    fill: #f59e0b;
    stroke: var(--t-text);
    stroke-width: 0.5;
    filter: drop-shadow(0 0 3px rgba(245, 158, 11, 0.5));
}

.building-accent-fill {
    fill: var(--t-text);
}

.building-accent-line {
    fill: var(--t-text);
}

.building-accent-stroke {
    stroke: var(--t-text);
    stroke-width: 1.5;
    fill: none;
}

.building-stroke-rect {
    fill: var(--t-text);
}

.building-smoke {
    fill: var(--t-text);
    opacity: 0.3;
}

.building-ground {
    stroke: var(--t-text);
    stroke-width: 5;
}

/* Renovation stars */
.building-reno-stars {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-top: 4px;
    line-height: 1;
}

.building-reno-star {
    color: var(--t-accent);
    font-size: 16px;
    line-height: 1;
}

/* Condition bar */
.building-condition-bar {
    width: 100px;
    height: 10px;
    border-radius: 5px;
    background: var(--t-bg-elevated);
    overflow: hidden;
    margin-top: 4px;
}

.building-condition-bar__fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.5s ease, background 0.5s ease;
}

.building-silhouette--compact .building-condition-bar {
    height: 8px;
    width: 80px;
}
</style>
