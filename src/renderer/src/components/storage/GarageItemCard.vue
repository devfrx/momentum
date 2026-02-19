<script setup lang="ts">
/**
 * GarageItemCard — Garage-sale themed card for items won from storage auctions.
 *
 * Designed to evoke the feel of rummaging through a dusty storage unit:
 * masking-tape price tags, hand-written vibes, grungy category labels,
 * and a rarity strip that feels like a coloured sticker on a crate.
 *
 * Built entirely on UCard / UButton + CSS variables — nothing hardcoded.
 */
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton, UCard } from '@renderer/components/ui'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { rarityCssVar } from '@renderer/data/rarity'
import { resolveItemName, resolveItemDescription } from '@renderer/data/storage/items'
import { CONDITION_ICONS, CONDITION_COLORS } from '@renderer/data/shop/restoration'
import type { InventoryItem } from '@renderer/stores/useStorageStore'

defineProps<{
    item: InventoryItem
}>()

defineEmits<{
    appraise: [itemId: string]
    sell: [itemId: string]
}>()

const { formatCash } = useFormat()
const { t } = useI18n()
</script>

<template>
    <UCard class="garage-card" variant="default" size="sm" radius="md" :accent="rarityCssVar(item.rarity)"
        :style="{ '--_rarity': rarityCssVar(item.rarity) }">
        <!-- Rarity strip — coloured tape on the top edge -->
        <template #header>
            <div class="garage-card__strip" />

            <div class="garage-card__head">
                <div class="garage-card__icon-wrap">
                    <AppIcon :icon="item.icon" class="garage-card__icon" />
                </div>

                <div class="garage-card__titles">
                    <span class="garage-card__name">{{ resolveItemName(item, t) }}</span>
                    <span class="garage-card__rarity">{{ item.rarity }}</span>
                </div>
            </div>
        </template>

        <!-- Body -->
        <p class="garage-card__desc">{{ resolveItemDescription(item, t) }}</p>

        <div class="garage-card__meta">
            <span class="garage-card__category">
                <AppIcon icon="mdi:tag-outline" class="garage-card__cat-icon" />
                {{ item.category }}
            </span>

            <!-- Condition -->
            <span v-if="item.appraised && item.condition" class="garage-card__condition"
                :style="{ color: CONDITION_COLORS[item.condition] }">
                <AppIcon :icon="CONDITION_ICONS[item.condition]" />
                {{ t(`items.condition.${item.condition}`) }}
            </span>
            <span v-else-if="!item.appraised && item.condition"
                class="garage-card__condition garage-card__condition--unknown">
                <AppIcon icon="mdi:help-circle-outline" />
                {{ t('storage.condition_unknown') }}
            </span>
        </div>

        <!-- Price tag sticker -->
        <div class="garage-card__price-tag">
            <template v-if="item.appraised">
                <AppIcon icon="mdi:check-decagram" class="garage-card__appraised-icon" />
                <span class="garage-card__value garage-card__value--known">{{ formatCash(item.appraisedValue ?? 0)
                    }}</span>
            </template>
            <template v-else>
                <AppIcon icon="mdi:help-rhombus-outline" class="garage-card__unknown-icon" />
                <span class="garage-card__value garage-card__value--unknown">{{ t('storage.not_appraised') }}</span>
            </template>
        </div>

        <!-- Actions -->
        <template #footer>
            <div class="garage-card__actions">
                <UButton v-if="!item.appraised" variant="ghost" size="sm" icon="mdi:magnify"
                    @click="$emit('appraise', item.id)">{{ t('storage.appraise') }}</UButton>

                <UButton variant="success" size="sm" icon="mdi:currency-usd" @click="$emit('sell', item.id)">{{
                    t('storage.sell_item') }}</UButton>
            </div>
        </template>
    </UCard>
</template>

<style scoped>
/* ─── Card Override ─────────────────────────────────────────── */
.garage-card {
    /* --_strip-h: 4px; */
    position: relative;
    overflow: hidden;
    transition:
        transform var(--t-transition-normal),
        box-shadow var(--t-transition-normal),
        border-color var(--t-transition-normal);
}

.garage-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--t-shadow-md);
    border-color: var(--t-border-hover);
}

/* ─── Rarity Strip (masking-tape accent) ────────────────────── */
.garage-card__strip {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: var(--_strip-h);
    background: var(--_rarity);
    opacity: 0.85;
}

/* ─── Header ────────────────────────────────────────────────── */
.garage-card__head {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding-top: var(--t-space-1);
}

.garage-card__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--t-icon-md);
    height: var(--t-icon-md);
    border-radius: var(--t-radius-sm);
    background: color-mix(in srgb, var(--_rarity) 12%, transparent);
    flex-shrink: 0;
}

.garage-card__icon {
    font-size: var(--t-font-size-lg);
    color: var(--_rarity);
}

.garage-card__titles {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.garage-card__name {
    font-weight: var(--t-font-semibold);
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.garage-card__rarity {
    font-size: var(--t-font-size-2xs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: var(--t-font-bold);
    color: var(--_rarity);
}

/* ─── Description ───────────────────────────────────────────── */
.garage-card__desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0;
    line-height: var(--t-leading-normal);
    font-style: italic;
}

/* ─── Meta Row (category + condition) ───────────────────────── */
.garage-card__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--t-space-1);
    margin-top: var(--t-space-2);
}

.garage-card__category {
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-1);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    text-transform: capitalize;
    background: var(--t-bg-muted);
    padding: var(--t-space-0-5) var(--t-space-2);
    border-radius: var(--t-radius-full);
    border: 1px dashed var(--t-border);
}

.garage-card__cat-icon {
    font-size: var(--t-font-size-xs);
    opacity: var(--t-opacity-subtle);
}

.garage-card__condition {
    display: inline-flex;
    align-items: center;
    gap: var(--t-space-0-5);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    text-transform: capitalize;
}

.garage-card__condition--unknown {
    color: var(--t-text-muted);
    font-style: italic;
    font-weight: var(--t-font-normal);
}

/* ─── Price Tag ─────────────────────────────────────────────── */
.garage-card__price-tag {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    margin-top: var(--t-space-2);
    padding: var(--t-space-1-5) var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px dashed var(--t-border);
    border-radius: var(--t-radius-sm);
    position: relative;
}

/* Tape-tab decoration on the left */
.garage-card__price-tag::before {
    content: '';
    position: absolute;
    left: calc(-1 * var(--t-space-1));
    top: 50%;
    transform: translateY(-50%);
    width: var(--t-space-2);
    height: var(--t-space-4);
    background: var(--_rarity);
    /* opacity: 0.5; */
    border-radius: var(--t-radius-xs);
}

.garage-card__appraised-icon {
    font-size: var(--t-font-size-sm);
    color: var(--t-success);
}

.garage-card__unknown-icon {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.garage-card__value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
}

.garage-card__value--known {
    color: var(--t-success);
}

.garage-card__value--unknown {
    color: var(--t-text-muted);
    font-style: italic;
    font-weight: var(--t-font-normal);
}

/* ─── Footer Actions ────────────────────────────────────────── */
.garage-card__actions {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    justify-content: flex-end;
    padding-top: var(--t-space-1);
    border-top: 1px solid var(--t-border);
}
</style>
