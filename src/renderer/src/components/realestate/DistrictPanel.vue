<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import {
    type District,
    getActiveSynergies,
} from '@renderer/data/realestate'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const player = usePlayerStore()
const { formatCash, formatPercent } = useFormat()

const props = defineProps<{ district: District }>()
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'view-property', propId: string): void
    (e: 'view-opportunity', oppId: string): void
}>()

const owned = computed(() => realEstate.propertiesByDistrict.get(props.district.id) ?? [])
const opps = computed(() => realEstate.availableOpportunities.filter(o => o.districtId === props.district.id))

const activeSynergies = computed(() => getActiveSynergies(props.district, owned.value.length))
const nextSynergy = computed(() => {
    const all = props.district.synergies
    const next = all.find(s => s.minProperties > owned.value.length)
    return next ?? null
})

const nextSynergyDelta = computed(() => nextSynergy.value ? nextSynergy.value.minProperties - owned.value.length : 0)

const isCooldown = computed(() => realEstate.isScanOnCooldown(props.district.id))
const scanCooldownFormatted = computed(() => {
    if (!isCooldown.value) return ''
    const cd = realEstate.scannedDistricts.find(s => s.districtId === props.district.id)
    if (!cd) return ''
    const remaining = Math.max(0, cd.expiresAt - Date.now())
    const m = Math.floor(remaining / 60000)
    const s = Math.floor((remaining % 60000) / 1000)
    return `${m}m ${s}s`
})

const scanCostFormatted = computed(() => formatCash(props.district.scanCost))
const canAffordScan = computed(() => player.cash.gte(props.district.scanCost))

function handleScan(): void {
    realEstate.scanDistrict(props.district.id)
}

const tierColors: Record<string, string> = {
    starter: 'var(--t-success)',
    mid: '#64748b',
    premium: 'var(--t-warning)',
    elite: '#a855f7',
}
</script>

<template>
    <aside class="district-panel" :style="{ '--_accent': district.color }">
        <!-- Header -->
        <div class="dp-header">
            <div class="dp-header-left">
                <AppIcon :icon="district.icon" class="dp-icon" />
                <div>
                    <h3 class="dp-name">{{ t(district.nameKey) }}</h3>
                    <span class="dp-tier" :style="{ color: tierColors[district.tier] }">
                        {{ district.tier.toUpperCase() }}
                    </span>
                </div>
            </div>
            <button class="dp-close" @click="emit('close')">
                <AppIcon icon="mdi:close" />
            </button>
        </div>

        <p class="dp-desc">{{ t(district.descriptionKey) }}</p>

        <!-- Stats grid -->
        <div class="dp-stats">
            <div class="dp-stat">
                <span class="dp-stat__label">{{ t('realestate.district.rent_mult') }}</span>
                <span class="dp-stat__value">{{ district.rentMultiplier }}×</span>
            </div>
            <div class="dp-stat">
                <span class="dp-stat__label">{{ t('realestate.district.appreciation') }}</span>
                <span class="dp-stat__value">{{ district.appreciationMultiplier }}×</span>
            </div>
            <div class="dp-stat">
                <span class="dp-stat__label">{{ t('realestate.district.owned') }}</span>
                <span class="dp-stat__value">{{ owned.length }}</span>
            </div>
        </div>

        <!-- Synergies -->
        <div class="dp-section">
            <h4 class="dp-section-title">
                <AppIcon icon="mdi:link-variant" /> {{ t('realestate.synergy.title') }}
            </h4>

            <div v-if="activeSynergies.length > 0" class="dp-synergy-list">
                <div v-for="syn in activeSynergies" :key="syn.labelKey" class="dp-synergy active">
                    <AppIcon icon="mdi:check-circle" class="text-emerald" />
                    <span>{{ t(syn.labelKey) }}</span>
                    <span class="dp-synergy-bonus text-emerald">{{ formatPercent(syn.rentBonus * 100) }}</span>
                </div>
            </div>
            <p v-else class="dp-hint">{{ t('realestate.synergy.none') }}</p>

            <div v-if="nextSynergy" class="dp-next-synergy">
                <AppIcon icon="mdi:arrow-right-circle-outline" class="text-muted" />
                <span>{{ t('realestate.synergy.next', { count: nextSynergyDelta }) }} — <strong>{{
                    t(nextSynergy.labelKey) }}</strong></span>
            </div>
        </div>

        <!-- Scan -->
        <div class="dp-section">
            <h4 class="dp-section-title">
                <AppIcon icon="mdi:radar" /> {{ t('realestate.scan.title') }}
            </h4>
            <p class="dp-hint">{{ t('realestate.scan.desc') }}</p>
            <Button v-if="!isCooldown" :label="t('realestate.scan.action', { cost: scanCostFormatted })"
                icon="pi pi-search" :disabled="!canAffordScan" severity="info" size="small" class="dp-scan-btn"
                @click="handleScan" />
            <div v-else class="dp-cooldown">
                <AppIcon icon="mdi:timer-sand" />
                <span>{{ t('realestate.scan.cooldown', { time: scanCooldownFormatted }) }}</span>
            </div>
        </div>

        <!-- Opportunities -->
        <div v-if="opps.length > 0" class="dp-section">
            <h4 class="dp-section-title">
                <AppIcon icon="mdi:tag" /> {{ t('realestate.district.opportunities') }} ({{ opps.length }})
            </h4>
            <div class="dp-list">
                <div v-for="opp in opps" :key="opp.id" class="dp-list-item" @click="emit('view-opportunity', opp.id)">
                    <AppIcon :icon="opp.icon" />
                    <span class="dp-list-name">{{ opp.name }}</span>
                    <span class="dp-list-price">{{ formatCash(opp.askingPrice) }}</span>
                    <Tag v-if="opp.isScanned" value="SCAN" severity="info" size="small" />
                </div>
            </div>
        </div>

        <!-- Owned -->
        <div v-if="owned.length > 0" class="dp-section">
            <h4 class="dp-section-title">
                <AppIcon icon="mdi:home" /> {{ t('realestate.district.owned') }} ({{ owned.length }})
            </h4>
            <div class="dp-list">
                <div v-for="prop in owned" :key="prop.id" class="dp-list-item" @click="emit('view-property', prop.id)">
                    <AppIcon :icon="prop.icon" />
                    <span class="dp-list-name">{{ prop.customName || prop.name }}</span>
                    <span class="dp-list-price text-emerald">{{ formatCash(prop.currentValue) }}</span>
                </div>
            </div>
        </div>
    </aside>
</template>

<style scoped>
.district-panel {
    width: 320px;
    min-width: 280px;
    max-height: 560px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    box-shadow: var(--t-shadow-md);
    flex-shrink: 0;
}

/* ── Header ── */
.dp-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.dp-header-left {
    display: flex;
    gap: var(--t-space-2);
    align-items: center;
}

.dp-icon {
    font-size: 1.5rem;
    color: var(--_accent);
}

.dp-name {
    margin: 0;
    font-size: var(--t-font-size-lg);
    font-weight: 700;
    color: var(--t-text);
}

.dp-tier {
    font-size: var(--t-font-size-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
}

.dp-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: var(--t-text-muted);
    padding: 0.2rem;
    border-radius: 4px;
    transition: color var(--t-transition-fast);
}

.dp-close:hover {
    color: var(--t-text);
}

.dp-desc {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    line-height: 1.45;
    margin: 0;
}

/* ── Stats grid ── */
.dp-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-2);
}

.dp-stat {
    display: flex;
    flex-direction: column;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
}

.dp-stat__label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
}

.dp-stat__value {
    font-family: var(--t-font-mono);
    font-weight: 700;
    font-size: var(--t-font-size-base);
    color: var(--t-text);
}

/* ── Sections ── */
.dp-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.dp-section-title {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text);
    margin: 0;
}

.dp-hint {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0;
    line-height: 1.4;
}

/* ── Synergy ── */
.dp-synergy-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.dp-synergy {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-sm);
    padding: var(--t-space-1) var(--t-space-2);
    background: var(--t-success-muted);
    border-radius: 6px;
}

.dp-synergy-bonus {
    margin-left: auto;
    font-family: var(--t-font-mono);
    font-weight: 600;
    font-size: var(--t-font-size-xs);
}

.dp-next-synergy {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

/* ── Scan ── */
.dp-scan-btn {
    width: 100%;
}

.dp-cooldown {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

/* ── Lists ── */
.dp-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.dp-list-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2);
    border-radius: 6px;
    cursor: pointer;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    transition: background var(--t-transition-fast);
}

.dp-list-item:hover {
    background: var(--t-bg-card-hover);
}

.dp-list-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dp-list-price {
    font-family: var(--t-font-mono);
    font-weight: 600;
    font-size: var(--t-font-size-xs);
    flex-shrink: 0;
}
</style>
