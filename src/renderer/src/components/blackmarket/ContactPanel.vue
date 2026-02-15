<script setup lang="ts">
/**
 * ContactPanel — Displays an NPC contact with abilities, loyalty bar,
 * and interaction buttons.
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { type ContactDef, type ContactState, getContactDef, scaleContactCost } from '@renderer/data/blackmarket'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'

const props = defineProps<{
    contactId: string
}>()

const emit = defineEmits<{ abilityUsed: [contactId: string, abilityId: string, result: unknown] }>()

const blackmarket = useBlackMarketStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const def = computed((): ContactDef | undefined =>
    getContactDef(props.contactId as import('@renderer/data/blackmarket').ContactId),
)

const state = computed((): ContactState | undefined =>
    blackmarket.getContactState(props.contactId as import('@renderer/data/blackmarket').ContactId),
)

const loyaltyPct = computed(() => {
    if (!def.value || !state.value) return 0
    return Math.round((state.value.loyalty / def.value.maxLoyalty) * 100)
})

/** Combined betrayal + scam probability for this contact */
const riskEstimate = computed(() =>
    blackmarket.getContactRiskEstimate(props.contactId as import('@renderer/data/blackmarket').ContactId),
)

function riskSeverity(pct: number): string {
    if (pct <= 10) return 'low'
    if (pct <= 20) return 'medium'
    return 'high'
}

function scaledAbilityCost(baseCost: number): string {
    if (baseCost <= 0) return ''
    const scaled = scaleContactCost(baseCost, player.cash.toNumber())
    return formatCash(scaled)
}

function isAbilityReady(abilityId: string): boolean {
    if (!state.value) return false
    const cd = state.value.abilityCooldowns[abilityId]
    if (!cd) return true
    return blackmarket.lastTickProcessed >= cd
}

function cooldownRemaining(abilityId: string): string {
    if (!state.value) return ''
    const cd = state.value.abilityCooldowns[abilityId]
    if (!cd) return ''
    const remaining = cd - blackmarket.lastTickProcessed
    if (remaining <= 0) return ''
    const secs = Math.ceil(remaining / 10)
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

function handleAbility(abilityId: string): void {
    const result = blackmarket.useContactAbility(
        props.contactId as import('@renderer/data/blackmarket').ContactId,
        abilityId,
    )
    emit('abilityUsed', props.contactId, abilityId, result)
}
</script>

<template>
    <div v-if="def" class="contact-panel" :style="{ '--_accent': def.color }">
        <!-- Header -->
        <div class="contact-panel__head">
            <AppIcon :icon="def.icon" class="contact-panel__avatar" />
            <div class="contact-panel__info">
                <span class="contact-panel__name">{{ t(def.nameKey) }}</span>
                <span class="contact-panel__title">{{ t(def.titleKey) }}</span>
            </div>
        </div>

        <!-- Description -->
        <p class="contact-panel__desc">{{ t(def.descKey) }}</p>

        <!-- Loyalty bar -->
        <div class="contact-panel__loyalty">
            <span class="contact-panel__loyalty-label">{{ t('blackmarket.loyalty') }}</span>
            <div class="contact-panel__loyalty-bar">
                <div class="contact-panel__loyalty-fill" :style="{ width: `${loyaltyPct}%` }" />
            </div>
            <span class="contact-panel__loyalty-value">{{ state?.loyalty ?? 0 }} / {{ def.maxLoyalty }}</span>
        </div>

        <!-- Stats row -->
        <div class="contact-panel__stats">
            <span class="contact-panel__stat">
                <AppIcon icon="mdi:handshake" />
                {{ t('blackmarket.interactions', { count: state?.totalInteractions ?? 0 }) }}
            </span>
            <span class="contact-panel__stat">
                <AppIcon icon="mdi:calendar-today" />
                {{ t('blackmarket.daily_uses', { count: state?.dailyUses ?? 0 }) }}
            </span>
            <span class="contact-panel__stat contact-panel__risk" :class="`risk-${riskSeverity(riskEstimate)}`">
                <AppIcon icon="mdi:alert-circle" />
                {{ t('blackmarket.risk_estimate', { pct: riskEstimate }) }}
            </span>
        </div>

        <!-- Abilities -->
        <div class="contact-panel__abilities">
            <div v-for="ability in def.abilities" :key="ability.id" class="contact-panel__ability"
                :class="{ locked: (state?.loyalty ?? 0) < ability.minLoyalty }">
                <div class="ability__head">
                    <AppIcon :icon="ability.icon" class="ability__icon" />
                    <div class="ability__info">
                        <span class="ability__name">{{ t(ability.nameKey) }}</span>
                        <span class="ability__desc">{{ t(ability.descKey) }}</span>
                    </div>
                </div>
                <div class="ability__footer">
                    <span v-if="ability.cost > 0" class="ability__cost">{{ scaledAbilityCost(ability.cost) }}</span>
                    <span v-if="!isAbilityReady(ability.id)" class="ability__cd">
                        <AppIcon icon="mdi:timer-sand" /> {{ cooldownRemaining(ability.id) }}
                    </span>
                    <Button :label="t('blackmarket.use')" size="small" severity="secondary" :disabled="!isAbilityReady(ability.id) ||
                        (state?.loyalty ?? 0) < ability.minLoyalty ||
                        blackmarket.currentTier < ability.minTier
                        " @click="handleAbility(ability.id)" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.contact-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    box-shadow: var(--t-shadow-sm);
    transition: border-color var(--t-transition-normal);
}

.contact-panel:hover {
    border-color: var(--t-border-hover);
}

/* Header */
.contact-panel__head {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.contact-panel__avatar {
    font-size: 2rem;
    color: var(--_accent, var(--t-accent));
}

.contact-panel__info {
    display: flex;
    flex-direction: column;
}

.contact-panel__name {
    font-weight: 700;
    font-size: var(--t-font-size-base);
    color: var(--t-text);
}

.contact-panel__title {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.contact-panel__desc {
    margin: 0;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    line-height: 1.5;
}

/* Loyalty */
.contact-panel__loyalty {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.contact-panel__loyalty-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    white-space: nowrap;
}

.contact-panel__loyalty-bar {
    flex: 1;
    height: 6px;
    background: var(--t-bg-muted);
    border-radius: 3px;
    overflow: hidden;
}

.contact-panel__loyalty-fill {
    height: 100%;
    background: var(--_accent, var(--t-accent));
    border-radius: 3px;
    transition: width var(--t-transition-normal);
}

.contact-panel__loyalty-value {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text-secondary);
    white-space: nowrap;
}

/* Stats */
.contact-panel__stats {
    display: flex;
    gap: var(--t-space-4);
}

.contact-panel__stat {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.contact-panel__risk {
    font-weight: 600;
}

.contact-panel__risk.risk-low {
    color: var(--t-success);
}

.contact-panel__risk.risk-medium {
    color: var(--t-warning);
}

.contact-panel__risk.risk-high {
    color: var(--t-danger);
}

/* Abilities */
.contact-panel__abilities {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.contact-panel__ability {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    transition: opacity var(--t-transition-fast);
}

.contact-panel__ability.locked {
    opacity: 0.5;
}

.ability__head {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
}

.ability__icon {
    font-size: 1.1rem;
    color: var(--_accent, var(--t-accent));
    flex-shrink: 0;
    margin-top: 2px;
}

.ability__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.ability__name {
    font-weight: 600;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.ability__desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    line-height: 1.4;
}

.ability__footer {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    justify-content: flex-end;
}

.ability__cost {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text-secondary);
}

.ability__cd {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-warning);
}
</style>
