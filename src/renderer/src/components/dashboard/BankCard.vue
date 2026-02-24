<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import {
    useBankingStore,
    CARD_STYLES,
    TIER_ORDER,
    type CardTier,
} from '@renderer/stores/useBankingStore'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'

const player = usePlayerStore()
const banking = useBankingStore()
const loans = useLoanStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const flipped = ref(false)
const cvvVisible = ref(false)
const editingName = ref(false)
const nameInput = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)
const showStylePicker = ref(false)

const creditScoreColor = computed(() => {
    const s = loans.creditScore
    if (s >= 80) return 'var(--t-success)'
    if (s >= 60) return 'var(--t-info)'
    if (s >= 40) return 'var(--t-warning)'
    return 'var(--t-danger)'
})

const creditScoreLabel = computed(() => {
    const s = loans.creditScore
    if (s >= 80) return 'Excellent'
    if (s >= 60) return 'Good'
    if (s >= 40) return 'Fair'
    return 'Poor'
})

const displayNumber = computed(() => {
    const n = banking.card.number
    if (!n) return '•••• •••• •••• ••••'
    return `•••• •••• •••• ${n.slice(-4)}`
})

const style = computed(() => banking.activeStyle)

function flipCard(): void {
    flipped.value = !flipped.value
}

function startEditName(): void {
    nameInput.value = banking.holderName
    editingName.value = true
    nextTick(() => nameInputRef.value?.focus())
}

function saveHolderName(): void {
    banking.setHolderName(nameInput.value)
    editingName.value = false
}
</script>

<template>
    <div class="bank-card-wrapper">
        <!-- 3D Flip Container -->
        <div class="card-scene" @click="flipCard">
            <div class="card-flipper" :class="{ flipped }">

                <!-- ═══ FRONT FACE ═══ -->
                <div class="card-face card-front" :style="{ background: style.gradient, color: style.textColor }">
                    <div class="card-pattern" :style="{ opacity: style.patternOpacity }" />

                    <!-- Top row -->
                    <div class="card-top">
                        <div class="card-bank-logo">
                            <AppIcon icon="mdi:credit-card-fast-outline" class="bank-logo-icon" />
                            <span class="bank-name">FINANX</span>
                        </div>
                        <div class="card-tier-badge" :style="{ borderColor: style.accentColor + '40' }">
                            <AppIcon :icon="banking.tierConfig.icon" class="tier-icon" />
                            <span>{{ $t(banking.tierConfig.labelKey).toUpperCase() }}</span>
                        </div>
                    </div>

                    <!-- Chip + Contactless -->
                    <div class="card-chip-row">
                        <div class="card-chip">
                            <div class="chip-body">
                                <div class="chip-left" />
                                <div class="chip-center">
                                    <div class="chip-line" />
                                    <div class="chip-line" />
                                    <div class="chip-line" />
                                    <div class="chip-line" />
                                </div>
                                <div class="chip-right" />
                            </div>
                        </div>
                        <AppIcon icon="mdi:contactless-payment" class="contactless-icon" />
                    </div>

                    <!-- Card Number -->
                    <div class="card-number">{{ displayNumber }}</div>

                    <!-- Balance -->
                    <div class="card-balance-row">
                        <span class="card-balance-label">{{ $t('banking.available_balance') }}</span>
                        <span class="card-balance-value">{{ formatCash(player.cardBalance) }}</span>
                    </div>

                    <!-- Bottom: Name + Expiry -->
                    <div class="card-bottom">
                        <div class="card-holder" @click.stop>
                            <span class="card-label">{{ $t('banking.card_holder') }}</span>
                            <template v-if="editingName">
                                <input ref="nameInputRef" v-model="nameInput" class="card-name-input" maxlength="30"
                                    :placeholder="$t('banking.enter_name')" @keydown.enter="saveHolderName"
                                    @blur="saveHolderName" @click.stop />
                            </template>
                            <template v-else>
                                <span class="card-value card-name-editable" @click.stop="startEditName">
                                    {{ banking.holderName || $t('banking.enter_name') }}
                                    <AppIcon icon="mdi:pencil" class="edit-icon" />
                                </span>
                            </template>
                        </div>
                        <div class="card-expiry">
                            <span class="card-label">{{ $t('banking.valid_thru') }}</span>
                            <span class="card-value">{{ banking.card.expiry || '—' }}</span>
                        </div>
                    </div>

                    <!-- Flip hint -->
                    <div class="flip-hint">
                        <AppIcon icon="mdi:rotate-3d-variant" class="flip-hint-icon" />
                    </div>
                </div>

                <!-- ═══ BACK FACE ═══ -->
                <div class="card-face card-back" :style="{ background: style.gradient, color: style.textColor }">
                    <div class="card-pattern" :style="{ opacity: style.patternOpacity * 0.6 }" />

                    <!-- Magnetic stripe -->
                    <div class="magnetic-stripe" />

                    <!-- Signature + CVV strip -->
                    <div class="cvv-strip">
                        <div class="signature-area">
                            <span class="signature-label">AUTHORIZED SIGNATURE</span>
                            <div class="signature-box">
                                <span class="signature-text">{{ banking.holderName || '—' }}</span>
                            </div>
                        </div>
                        <div class="cvv-area" @click.stop="cvvVisible = !cvvVisible">
                            <span class="cvv-label">CVV</span>
                            <span class="cvv-digits">{{ cvvVisible ? banking.card.cvv : '•••' }}</span>
                        </div>
                    </div>

                    <!-- IBAN -->
                    <div class="back-info-section">
                        <div class="back-info-row">
                            <span class="back-info-label">IBAN</span>
                            <span class="back-info-value mono">{{ banking.card.iban }}</span>
                        </div>
                        <div class="back-info-row">
                            <span class="back-info-label">{{ $t('banking.card_number_full') }}</span>
                            <span class="back-info-value mono">{{ banking.formattedCardNumber }}</span>
                        </div>
                    </div>

                    <!-- Credit Score + Tier -->
                    <div class="back-stats">
                        <div class="back-stat">
                            <span class="back-stat-label">{{ $t('banking.credit_score') }}</span>
                            <div class="credit-bar-wrap">
                                <div class="credit-bar">
                                    <div class="credit-bar-fill"
                                        :style="{ width: loans.creditScore + '%', background: creditScoreColor }" />
                                </div>
                                <span class="credit-score-val" :style="{ color: creditScoreColor }">
                                    {{ loans.creditScore }} · {{ creditScoreLabel }}
                                </span>
                            </div>
                        </div>
                        <div class="back-stat">
                            <span class="back-stat-label">{{ $t('banking.card_tier') }}</span>
                            <span class="back-stat-value" :style="{ color: style.accentColor }">
                                {{ $t(banking.tierConfig.labelKey) }}
                                <span v-if="banking.tierBonusPct > 0" class="tier-pct">+{{ banking.tierBonusPct }}%
                                    income</span>
                            </span>
                        </div>
                    </div>

                    <!-- Bottom: logo + flip hint -->
                    <div class="back-bottom">
                        <div class="back-logo">
                            <AppIcon icon="mdi:credit-card-fast-outline" class="back-logo-icon" />
                            <span class="back-logo-text">FINANX</span>
                        </div>
                        <div class="flip-hint">
                            <AppIcon icon="mdi:rotate-3d-variant" class="flip-hint-icon" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══ Style Picker toggle ═══ -->
        <button class="style-picker-toggle" @click="showStylePicker = !showStylePicker">
            <div class="spt-swatch" :style="{ background: style.gradient }" />
            <span class="spt-label">{{ $t(style.nameKey) }}</span>
            <AppIcon :icon="showStylePicker ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="spt-chevron" />
        </button>

        <!-- ═══ Style Picker ═══ -->
        <transition name="fade-slide">
            <div v-if="showStylePicker" class="style-picker">
                <div v-for="group in banking.allTierStyles" :key="group.tier" class="style-tier-group"
                    :class="{ locked: !group.unlocked }">
                    <div class="style-tier-label">
                        <span>{{ $t(`banking.tier_${group.tier}`) }}</span>
                        <AppIcon v-if="!group.unlocked" icon="mdi:lock" class="lock-icon" />
                    </div>
                    <div class="style-swatches">
                        <button v-for="s in group.styles" :key="s.id" class="style-swatch"
                            :class="{ active: s.id === banking.selectedStyleId, disabled: !group.unlocked }"
                            :style="{ background: s.gradient }" :disabled="!group.unlocked" :title="$t(s.nameKey)"
                            @click.stop="group.unlocked && banking.setCardStyle(s.id)">
                            <AppIcon v-if="s.id === banking.selectedStyleId" icon="mdi:check" class="swatch-check" />
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.bank-card-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-3);
    width: 100%;
}

/* ═══ 3D Flip Scene ═══ */
.card-scene {
    perspective: 1200px;
    width: 100%;
    max-width: 620px;
    aspect-ratio: 1.7;
    cursor: pointer;
}

.card-flipper {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
}

.card-flipper.flipped {
    transform: rotateY(180deg);
}

.card-face {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    overflow: hidden;
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.35),
        0 2px 8px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.card-scene:hover .card-flipper:not(.flipped) {
    transform: rotateY(-4deg) rotateX(2deg);
}

.card-scene:hover .card-flipper.flipped {
    transform: rotateY(176deg) rotateX(2deg);
}

/* ═══ FRONT ═══ */
.card-front {
    padding: clamp(16px, 4%, 24px) clamp(20px, 5%, 28px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 2;
}

.card-pattern {
    position: absolute;
    inset: 0;
    background:
        radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
        radial-gradient(circle at 15% 85%, rgba(255, 255, 255, 0.06) 0%, transparent 40%);
    pointer-events: none;
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
}

.card-bank-logo {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.bank-logo-icon {
    font-size: 1.3rem;
    opacity: 0.9;
}

.bank-name {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    opacity: 0.9;
}

.card-tier-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.55rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    padding: 0.18rem 0.55rem;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(4px);
}

.tier-icon {
    font-size: 0.7rem;
}

/* Chip */
.card-chip-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    position: relative;
    z-index: 1;
}

.card-chip {
    width: 46px;
    height: 34px;
    border-radius: 7px;
    background: linear-gradient(135deg, #c4a35a 0%, #dbc17a 45%, #c4a35a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    overflow: hidden;
}

.chip-body {
    display: flex;
    width: 80%;
    height: 75%;
    gap: 1px;
}

.chip-left,
.chip-right {
    width: 25%;
    border: 1px solid rgba(139, 105, 20, 0.35);
    border-radius: 2px;
}

.chip-center {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
}

.chip-line {
    height: 2px;
    background: rgba(139, 105, 20, 0.35);
    border-radius: 1px;
}

.contactless-icon {
    font-size: 1.5rem;
    opacity: 0.4;
}

/* Number */
.card-number {
    font-family: var(--t-font-mono);
    font-size: 1.2rem;
    letter-spacing: 0.18em;
    font-weight: 500;
    position: relative;
    z-index: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Balance */
.card-balance-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    position: relative;
    z-index: 1;
}

.card-balance-label {
    font-size: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.55;
}

.card-balance-value {
    font-family: var(--t-font-mono);
    font-size: 1.1rem;
    font-weight: 700;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* Bottom */
.card-bottom {
    display: flex;
    gap: var(--t-space-4);
    align-items: flex-end;
    position: relative;
    z-index: 1;
}

.card-holder,
.card-expiry {
    display: flex;
    flex-direction: column;
}

.card-holder {
    flex: 1;
    min-width: 0;
}

.card-label {
    font-size: 0.42rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.45;
    margin-bottom: 0.1rem;
}

.card-value {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.card-name-editable {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    opacity: 0.85;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.card-name-editable:hover {
    opacity: 1;
}

.edit-icon {
    font-size: 0.5rem;
    opacity: 0.4;
    flex-shrink: 0;
}

.card-name-input {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 3px;
    color: inherit;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    padding: 0.12rem 0.3rem;
    outline: none;
    width: 100%;
    text-transform: uppercase;
}

/* Flip hint */
.flip-hint {
    position: absolute;
    right: clamp(16px, 4%, 24px);
    bottom: clamp(14px, 3.5%, 20px);
    z-index: 1;
    opacity: 0;
    transition: opacity 0.25s;
}

.card-scene:hover .flip-hint {
    opacity: 0.45;
}

.flip-hint-icon {
    font-size: 1rem;
}

/* ═══ BACK FACE ═══ */
.card-back {
    transform: rotateY(180deg);
    display: flex;
    flex-direction: column;
    z-index: 1;
}

/* Magnetic stripe */
.magnetic-stripe {
    width: 100%;
    height: 46px;
    background: linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 40%, #1a1a1a 100%);
    margin-top: 18px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

/* CVV strip */
.cvv-strip {
    display: flex;
    align-items: stretch;
    margin: 12px clamp(16px, 4%, 24px) 0;
    gap: 8px;
    position: relative;
    z-index: 1;
}

.signature-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.signature-label {
    font-size: 0.42rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.5;
}

.signature-box {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 3px;
    padding: 5px 10px;
    min-height: 26px;
    display: flex;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.signature-text {
    font-size: 0.78rem;
    font-style: italic;
    opacity: 0.75;
    letter-spacing: 0.04em;
}

.cvv-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    cursor: pointer;
    padding: 0 8px;
}

.cvv-label {
    font-size: 0.42rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.5;
}

.cvv-digits {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    padding: 5px 12px;
    font-family: var(--t-font-mono);
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.12em;
}

/* Back info */
.back-info-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px clamp(16px, 4%, 24px) 0;
    position: relative;
    z-index: 1;
}

.back-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.back-info-label {
    font-size: 0.52rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.5;
    font-weight: 600;
}

.back-info-value {
    font-size: 0.8rem;
    font-weight: 600;
    opacity: 0.85;
}

.back-info-value.mono {
    font-family: var(--t-font-mono);
    letter-spacing: 0.08em;
}

/* Stats on back */
.back-stats {
    display: flex;
    gap: var(--t-space-4);
    padding: 10px clamp(16px, 4%, 24px) 0;
    flex: 1;
    position: relative;
    z-index: 1;
}

.back-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.back-stat-label {
    font-size: 0.52rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.5;
    font-weight: 600;
}

.back-stat-value {
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.tier-pct {
    font-size: 0.62rem;
    opacity: 0.65;
    font-weight: 500;
}

/* Credit bar */
.credit-bar-wrap {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.credit-bar {
    height: 5px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2.5px;
    overflow: hidden;
}

.credit-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.6s ease;
}

.credit-score-val {
    font-family: var(--t-font-mono);
    font-size: 0.74rem;
    font-weight: 700;
}

/* Back bottom */
.back-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 clamp(16px, 4%, 24px) clamp(12px, 3%, 18px);
    position: relative;
    z-index: 1;
}

.back-logo {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    opacity: 0.5;
}

.back-logo-icon {
    font-size: 1.05rem;
}

.back-logo-text {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.2em;
}

/* ═══ Style Picker Toggle ═══ */
.style-picker-toggle {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    cursor: pointer;
    transition: border-color var(--t-transition-fast);
    max-width: 620px;
    width: 100%;
}

.style-picker-toggle:hover {
    border-color: var(--t-border-hover);
}

.spt-swatch {
    width: 20px;
    height: 14px;
    border-radius: 3px;
    box-shadow: var(--t-shadow-sm);
    flex-shrink: 0;
}

.spt-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    font-weight: var(--t-font-medium);
    flex: 1;
}

.spt-chevron {
    font-size: 0.8rem;
    color: var(--t-text-muted);
}

/* ═══ Style Picker Panel ═══ */
.style-picker {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    max-width: 620px;
    width: 100%;
}

.style-tier-group {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.style-tier-group.locked {
    opacity: 0.4;
}

.style-tier-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.lock-icon {
    font-size: 0.65rem;
}

.style-swatches {
    display: flex;
    gap: var(--t-space-2);
}

.style-swatch {
    width: 56px;
    height: 36px;
    border-radius: var(--t-radius-md);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all var(--t-transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--t-shadow-sm);
}

.style-swatch:hover:not(.disabled) {
    transform: scale(1.08);
    box-shadow: var(--t-shadow-md);
}

.style-swatch.active {
    border-color: var(--t-cta);
    box-shadow: 0 0 0 1px var(--t-cta), var(--t-shadow-md);
}

.style-swatch.disabled {
    cursor: not-allowed;
}

.swatch-check {
    font-size: 0.9rem;
    color: #fff;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

/* ═══ Transitions ═══ */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: opacity 0.2s, transform 0.2s;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
</style>
