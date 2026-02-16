<script setup lang="ts">
/**
 * DemandTicker — Auto-scrolling stock-ticker ribbon showing live category demand.
 * Continuously scrolls left; pauses on hover so users can read values.
 * Hot categories glow green, cold ones are dimmed — like a real financial ticker.
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { useShopStore } from '@renderer/stores/useShopStore'
import { SHOP_CATEGORY_ICONS } from '@renderer/data/shop/items'
import {
    demandLevelColor,
} from '@renderer/data/shop/demand'
import { useI18n } from 'vue-i18n'

const shop = useShopStore()
const { t } = useI18n()

function demandArrow(current: number): string {
    if (current >= 1.4) return '▲'
    if (current >= 1.15) return '↑'
    if (current <= 0.8) return '▼'
    if (current <= 0.95) return '↓'
    return '–'
}

/** Duration in seconds — scales with number of categories for consistent speed. */
const scrollDuration = computed(() => Math.max(20, shop.demands.length * 2.5))
</script>

<template>
    <div class="ticker-wrap">
        <!-- Fixed label on the left -->
        <div class="ticker-badge">
            <AppIcon icon="mdi:chart-line" />
            <span>{{ t('shop.market_trends') }}</span>
        </div>

        <!-- Scrolling track — duplicated content for seamless loop -->
        <div class="ticker-viewport">
            <div class="ticker-track" :style="{ animationDuration: scrollDuration + 's' }">
                <!-- First copy -->
                <div v-for="d in shop.demands" :key="'a-' + d.category" class="ticker-chip" :class="{
                    'ticker-chip--hot': d.current >= 1.4,
                    'ticker-chip--warm': d.current >= 1.15 && d.current < 1.4,
                    'ticker-chip--cold': d.current <= 0.8,
                }">
                    <AppIcon :icon="SHOP_CATEGORY_ICONS[d.category] ?? 'mdi:tag'" class="ticker-chip__icon" />
                    <span class="ticker-chip__name">{{ d.category }}</span>
                    <span class="ticker-chip__arrow" :style="{ color: demandLevelColor(d.current) }">
                        {{ demandArrow(d.current) }}
                    </span>
                    <span class="ticker-chip__mult" :style="{ color: demandLevelColor(d.current) }">
                        {{ d.current.toFixed(2) }}×
                    </span>
                </div>

                <!-- Duplicate copy for seamless loop -->
                <div v-for="d in shop.demands" :key="'b-' + d.category" class="ticker-chip" :class="{
                    'ticker-chip--hot': d.current >= 1.4,
                    'ticker-chip--warm': d.current >= 1.15 && d.current < 1.4,
                    'ticker-chip--cold': d.current <= 0.8,
                }" aria-hidden="true">
                    <AppIcon :icon="SHOP_CATEGORY_ICONS[d.category] ?? 'mdi:tag'" class="ticker-chip__icon" />
                    <span class="ticker-chip__name">{{ d.category }}</span>
                    <span class="ticker-chip__arrow" :style="{ color: demandLevelColor(d.current) }">
                        {{ demandArrow(d.current) }}
                    </span>
                    <span class="ticker-chip__mult" :style="{ color: demandLevelColor(d.current) }">
                        {{ d.current.toFixed(2) }}×
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ── Outer container ─────────────────────────────────── */
.ticker-wrap {
    display: flex;
    align-items: stretch;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    overflow: hidden;
    height: 36px;
}

/* ── Fixed left label ────────────────────────────────── */
.ticker-badge {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0 var(--t-space-3);
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
    flex-shrink: 0;
    background: var(--t-bg-muted);
    border-right: 1px solid var(--t-border);
    z-index: 1;
}

/* ── Viewport masks the overflow ─────────────────────── */
.ticker-viewport {
    flex: 1;
    overflow: hidden;
    position: relative;
    /* Fade edges so items don't pop in/out abruptly */
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 3%, black 97%, transparent 100%);
    mask-image: linear-gradient(90deg, transparent 0%, black 3%, black 97%, transparent 100%);
}

/* ── Scrolling track — contains 2× the items ─────────── */
.ticker-track {
    display: flex;
    align-items: center;
    width: max-content;
    animation: ticker-scroll linear infinite;
    will-change: transform;
}

/* Pause on hover so users can read */
.ticker-wrap:hover .ticker-track {
    animation-play-state: paused;
}

@keyframes ticker-scroll {
    0% {
        transform: translateX(0);
    }

    100% {
        transform: translateX(-50%);
    }
}

/* ── Individual category chip ────────────────────────── */
.ticker-chip {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0 0.75rem;
    height: 36px;
    white-space: nowrap;
    flex-shrink: 0;
    border-right: 1px solid color-mix(in srgb, var(--t-border) 40%, transparent);
    transition: background 0.3s;
}

.ticker-chip--hot {
    background: color-mix(in srgb, var(--t-success) 8%, transparent);
}

.ticker-chip--warm {
    background: color-mix(in srgb, var(--t-success) 3%, transparent);
}

.ticker-chip--cold {
    opacity: 0.5;
}

.ticker-chip__icon {
    font-size: 0.8rem;
    color: var(--t-text-secondary);
}

.ticker-chip__name {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--t-text-secondary);
    text-transform: capitalize;
}

.ticker-chip__arrow {
    font-size: 0.6rem;
    font-weight: 800;
    line-height: 1;
}

.ticker-chip__mult {
    font-size: 0.7rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}
</style>
