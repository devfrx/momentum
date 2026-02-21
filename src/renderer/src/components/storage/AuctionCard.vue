<script setup lang="ts">
/**
 * AuctionCard — Storage-unit themed auction lobby card.
 *
 * Visual metaphor: a sealed storage unit with a roll-up door.
 * The top "shutter" strip carries the lot-tier accent, the body
 * simulates reading clues through a gap in the door, and the
 * CTA invites the player to step up and bid.
 *
 * All original data preserved: location, tier, lot tier badge,
 * event indicator, bidders, peek hints, starting bid, items count.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton, UTooltip } from '@renderer/components/ui'
import LotEventBanner from './LotEventBanner.vue'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import type { StorageAuction } from '@renderer/data/storage'
import { getLotTierDef } from '@renderer/data/storage/auctionTiers'
import { computed } from 'vue'

const props = defineProps<{
    auction: StorageAuction
}>()

defineEmits<{ bid: [auctionId: string] }>()

const { formatCash } = useFormat()
const { t } = useI18n()
const storage = useStorageStore()

const location = storage.getLocation(props.auction.locationId)

const lotTier = computed(() => getLotTierDef(props.auction.lotTier))
const showTierBadge = computed(() => props.auction.lotTier !== 'standard')
const revealEvents = computed(() =>
    props.auction.lotEvents.filter(e => e.def.timing === 'on_reveal')
)
const hasEvents = computed(() => props.auction.lotEvents.length > 0)
</script>

<template>
    <div class="auction-card" :class="[`auction-card--${auction.lotTier}`]" :style="{ '--_accent': lotTier.cssVar }">

        <!-- ── Shutter – Coloured top band (lot tier accent) ── -->
        <div class="auction-card__shutter">
            <div class="shutter__grooves">
                <span class="shutter__groove" v-for="n in 4" :key="n" />
            </div>
        </div>

        <!-- ── Unit header ── -->
        <div class="auction-card__head">
            <div class="auction-card__unit-number">
                <AppIcon :icon="location?.icon ?? 'mdi:warehouse'" class="auction-card__icon" />
            </div>

            <div class="auction-card__identity">
                <span class="auction-card__name">{{ location?.name ?? t('storage.unknown_location') }}</span>
                <span class="auction-card__tier-tag">{{ location?.tier?.toUpperCase() }}</span>
            </div>

            <!-- Lot tier badge -->
            <UTooltip v-if="showTierBadge" :text="t(`storage.lot_tier_${lotTier.id}_desc`)" placement="top">
                <span class="lot-tier-badge" :style="{ '--_tier-color': lotTier.cssVar }">
                    <AppIcon :icon="lotTier.icon" />
                    {{ t(`storage.lot_tier_${lotTier.id}`) }}
                </span>
            </UTooltip>
        </div>

        <!-- ── Status chips row ── -->
        <div class="auction-card__chips">
            <span class="auction-chip auction-chip--bidders">
                <AppIcon icon="mdi:account-group" />
                <span>{{ auction.bidders.length }} {{ t('storage.bidders') }}</span>
            </span>

            <UTooltip v-if="hasEvents" :text="t('storage.lot_has_events')" placement="top">
                <span class="auction-chip auction-chip--event">
                    <AppIcon icon="mdi:lightning-bolt" />
                    <span>{{ t('storage.lot_has_events') }}</span>
                </span>
            </UTooltip>
        </div>

        <!-- ── Lot Events (on_reveal) ── -->
        <LotEventBanner v-if="revealEvents.length > 0" :events="revealEvents" timing="on_reveal" compact />

        <!-- ── Peek window – "through the gap" ── -->
        <div class="auction-card__peek">
            <div class="peek__header">
                <AppIcon icon="mdi:eye-outline" class="peek__eye" />
                <span class="peek__label">{{ t('storage.peek_inside') }}</span>
            </div>
            <ul class="peek__hints">
                <li v-for="(hint, i) in auction.peekHints" :key="i" class="peek__hint">
                    {{ hint }}
                </li>
            </ul>
        </div>

        <!-- ── Stats bar ── -->
        <div class="auction-card__stats">
            <div class="stat-block stat-block--bid">
                <span class="stat-block__label">{{ t('storage.starting_bid') }}</span>
                <span class="stat-block__value">{{ formatCash(auction.currentBid) }}</span>
            </div>
            <div class="stat-block">
                <span class="stat-block__label">{{ t('storage.items_inside') }}</span>
                <span class="stat-block__value stat-block__value--mystery">
                    <AppIcon icon="mdi:help-circle-outline" />
                    {{ t('storage.unknown_items') }}
                </span>
            </div>
        </div>

        <!-- ── CTA ── -->
        <UButton variant="tab" size="sm" icon="mdi:gavel" block @click="$emit('bid', auction.id)">
            {{ t('storage.enter_auction') }}
        </UButton>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   AuctionCard — Storage unit door metaphor
   ═══════════════════════════════════════════════════════════════ */

.auction-card {
    --_accent: var(--t-warning);
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--t-space-3);
    padding: 0 0 var(--t-space-4) 0;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    overflow: hidden;
    transition:
        transform var(--t-transition-normal),
        box-shadow var(--t-transition-normal),
        border-color var(--t-transition-normal);
}

.auction-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--t-shadow-md);
    border-color: color-mix(in srgb, var(--_accent) 40%, var(--t-border-hover));
}

/* ── Shutter ────────────────────────────────────────────────── */
.auction-card__shutter {
    position: relative;
    height: 28px;
    background: linear-gradient(180deg,
            color-mix(in srgb, var(--_accent) 22%, var(--t-bg-muted)) 0%,
            color-mix(in srgb, var(--_accent) 10%, var(--t-bg-card)) 100%);
    border-bottom: 2px solid color-mix(in srgb, var(--_accent) 30%, var(--t-border));
    overflow: hidden;
}

.shutter__grooves {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding-top: 4px;
    height: 100%;
}

.shutter__groove {
    display: block;
    width: 100%;
    height: 2px;
    background: color-mix(in srgb, var(--_accent) 12%, transparent);
    border-radius: 1px;
}

/* ── Head (unit label) ──────────────────────────────────────── */
.auction-card__head {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: 0 var(--t-space-4);
    padding-top: var(--t-space-1);
}

.auction-card__unit-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: var(--t-radius-sm);
    background: color-mix(in srgb, var(--_accent) 10%, var(--t-bg-muted));
    border: 1px solid color-mix(in srgb, var(--_accent) 20%, var(--t-border));
    flex-shrink: 0;
}

.auction-card__icon {
    font-size: 1.25rem;
    color: var(--_accent);
}

.auction-card__identity {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.auction-card__name {
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-base);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.auction-card__tier-tag {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    letter-spacing: 0.1em;
    font-weight: var(--t-font-semibold);
    text-transform: uppercase;
}

/* ── Lot tier badge ─────────────────────────────────────────── */
.lot-tier-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-bold);
    color: var(--_tier-color);
    background: color-mix(in srgb, var(--_tier-color) 12%, transparent);
    padding: 0.2rem 0.55rem;
    border-radius: var(--t-radius-sm);
    border: 1px solid color-mix(in srgb, var(--_tier-color) 25%, transparent);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
    flex-shrink: 0;
}

/* ── Status chips row ───────────────────────────────────────── */
.auction-card__chips {
    display: flex;
    gap: var(--t-space-2);
    padding: 0 var(--t-space-4);
    flex-wrap: wrap;
}

.auction-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-medium);
    padding: 0.2rem 0.55rem;
    border-radius: var(--t-radius-full);
    white-space: nowrap;
}

.auction-chip--bidders {
    color: var(--t-text-secondary);
    background: var(--t-bg-muted);
}

.auction-chip--event {
    color: var(--t-warning);
    background: color-mix(in srgb, var(--t-warning) 10%, transparent);
    animation: chip-pulse 2.5s ease-in-out infinite;
}

@keyframes chip-pulse {

    0%,
    100% {
        opacity: 0.7;
    }

    50% {
        opacity: 1;
    }
}

/* ── Peek window ────────────────────────────────────────────── */
.auction-card__peek {
    margin: 0 var(--t-space-4);
    padding: var(--t-space-2) var(--t-space-3);
    background:
        repeating-linear-gradient(0deg,
            transparent,
            transparent 5px,
            color-mix(in srgb, var(--_accent) 3%, transparent) 5px,
            color-mix(in srgb, var(--_accent) 3%, transparent) 6px),
        var(--t-bg-muted);
    border: 1px dashed color-mix(in srgb, var(--_accent) 18%, var(--t-border));
    border-radius: var(--t-radius-sm);
    position: relative;
}

.peek__header {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    margin-bottom: var(--t-space-1);
}

.peek__eye {
    font-size: 0.9rem;
    color: var(--_accent);
    opacity: 0.7;
}

.peek__label {
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--t-text-muted);
    font-weight: var(--t-font-semibold);
}

.peek__hints {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.peek__hint {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    font-style: italic;
    padding-left: var(--t-space-2);
    border-left: 2px solid color-mix(in srgb, var(--_accent) 25%, transparent);
    line-height: var(--t-leading-normal);
}

/* ── Stats bar ──────────────────────────────────────────────── */
.auction-card__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    margin: 0 var(--t-space-4);
    background: var(--t-border);
    border-radius: var(--t-radius-sm);
    overflow: hidden;
}

.stat-block {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-card);
}

.stat-block__label {
    font-size: var(--t-font-size-2xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.stat-block__value {
    font-weight: var(--t-font-bold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
    font-family: var(--t-font-mono);
}

.stat-block--bid .stat-block__value {
    color: var(--t-success);
}

.stat-block__value--mystery {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--t-text-muted);
    font-style: italic;
    font-weight: var(--t-font-normal);
    font-family: var(--t-font-sans);
}

/* ── CTA wrapper ────────────────────────────────────────────── */
.auction-card>.u-btn {
    margin: 0 var(--t-space-4);
}

/* ── Tier-specific ambient glow on hover ────────────────────── */
.auction-card--legendary:hover {
    box-shadow:
        var(--t-shadow-md),
        0 0 18px color-mix(in srgb, var(--t-warning) 18%, transparent);
}

.auction-card--premium:hover {
    box-shadow:
        var(--t-shadow-md),
        0 0 14px color-mix(in srgb, var(--t-purple) 14%, transparent);
}

.auction-card--notable:hover {
    box-shadow:
        var(--t-shadow-md),
        0 0 10px color-mix(in srgb, var(--t-info) 10%, transparent);
}
</style>
