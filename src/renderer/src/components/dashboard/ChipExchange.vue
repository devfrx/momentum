<script setup lang="ts">
/**
 * ChipExchange — Casino chip buy / cash-out widget.
 *
 * Two tabs: BUY (Cash or Card → Chips) and CASH OUT (Chips → Cash).
 * Shows denomination breakdown, tier bonus, and cashout fee.
 * Lives on the Dashboard or inside the Gambling area.
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCasinoChipStore, CHIP_DENOMINATIONS } from '@renderer/stores/useCasinoChipStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useBankingStore } from '@renderer/stores/useBankingStore'
import { useFormat } from '@renderer/composables/useFormat'
import { D, ZERO, gte, mul } from '@renderer/core/BigNum'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import Decimal from 'break_infinity.js'

const { t } = useI18n()
const chipStore = useCasinoChipStore()
const player = usePlayerStore()
const banking = useBankingStore()
const { formatCash } = useFormat()

type Tab = 'buy' | 'cashout'
const activeTab = ref<Tab>('buy')

const amount = ref('')
const cashoutAmount = ref('')

const presets = [100, 500, 1000, 5000, 25000]

const parsedBuyAmount = computed((): Decimal => {
    const n = parseFloat(amount.value.replace(/,/g, ''))
    if (isNaN(n) || n <= 0) return ZERO
    return D(n)
})

const parsedCashoutAmount = computed((): Decimal => {
    const n = parseFloat(cashoutAmount.value.replace(/,/g, ''))
    if (isNaN(n) || n <= 0) return ZERO
    return D(n)
})

const tierBonusRate = computed(() => chipStore.buyRate)
const bonusChips = computed(() => mul(parsedBuyAmount.value, D(tierBonusRate.value - 1)))
const totalChipsReceived = computed(() => mul(parsedBuyAmount.value, D(tierBonusRate.value)))

const cashoutFeeVal = computed(() => chipStore.cashoutFee)
const cashoutFeeAmt = computed(() => mul(parsedCashoutAmount.value, D(cashoutFeeVal.value)))
const cashoutNet = computed(() => {
    const gross = parsedCashoutAmount.value
    return gross.sub(cashoutFeeAmt.value)
})

const canBuy = computed(() => {
    if (parsedBuyAmount.value.lte(0)) return false
    return gte(player.cash, parsedBuyAmount.value)
})

const canCashout = computed(() => {
    if (parsedCashoutAmount.value.lte(0)) return false
    return gte(chipStore.chipBalance, parsedCashoutAmount.value)
})

function selectPreset(val: number): void {
    if (activeTab.value === 'buy') {
        amount.value = val.toString()
    } else {
        cashoutAmount.value = val.toString()
    }
}

function doBuy(): void {
    if (!canBuy.value) return
    const amt = parsedBuyAmount.value
    chipStore.buyChipsWithCash(amt)
    amount.value = ''
}

function doCashout(): void {
    if (!canCashout.value) return
    chipStore.cashOutChips(parsedCashoutAmount.value)
    cashoutAmount.value = ''
}

function onBuyInput(e: Event): void {
    const input = e.target as HTMLInputElement
    amount.value = input.value.replace(/[^\d,]/g, '')
}

function onCashoutInput(e: Event): void {
    const input = e.target as HTMLInputElement
    cashoutAmount.value = input.value.replace(/[^\d,]/g, '')
}
</script>

<template>
    <div class="ce-widget">
        <!-- Header -->
        <div class="ce-header">
            <AppIcon icon="mdi:poker-chip" class="ce-header-icon" />
            <div class="ce-header-text">
                <h3 class="ce-title">{{ t('casino_chips.title') }}</h3>
                <p class="ce-subtitle">{{ t('casino_chips.subtitle') }}</p>
            </div>
        </div>

        <!-- Chip Balance -->
        <div class="ce-balance-bar">
            <span class="ce-balance-label">{{ t('casino_chips.balance') }}</span>
            <div class="ce-balance-value">
                <AppIcon icon="mdi:poker-chip" class="ce-chip-icon" />
                <span>{{ formatCash(chipStore.chipBalance) }}</span>
            </div>
        </div>

        <!-- Tabs -->
        <div class="ce-tabs">
            <button class="ce-tab" :class="{ active: activeTab === 'buy' }" @click="activeTab = 'buy'">
                <AppIcon icon="mdi:cart" class="ce-tab-icon" />
                {{ t('casino_chips.buy_tab') }}
            </button>
            <button class="ce-tab" :class="{ active: activeTab === 'cashout' }" @click="activeTab = 'cashout'">
                <AppIcon icon="mdi:cash-multiple" class="ce-tab-icon" />
                {{ t('casino_chips.cashout_tab') }}
            </button>
        </div>

        <!-- ═══ BUY TAB ═══ -->
        <template v-if="activeTab === 'buy'">
            <!-- Cash only notice -->
            <div class="ce-notice">
                <AppIcon icon="mdi:cash" />
                <span>{{ t('casino_chips.cash_only_notice') }}</span>
            </div>

            <!-- Presets -->
            <div class="ce-presets">
                <button v-for="p in presets" :key="p" class="ce-preset" :class="{ active: amount === String(p) }"
                    @click="selectPreset(p)">
                    {{ formatCash(D(p)) }}
                </button>
            </div>

            <!-- Custom input -->
            <div class="ce-input-wrap">
                <span class="ce-currency">$</span>
                <input type="text" inputmode="numeric" class="ce-input" :value="amount" @input="onBuyInput"
                    :placeholder="t('casino_chips.enter_amount')" />
            </div>

            <!-- Breakdown -->
            <div v-if="parsedBuyAmount.gt(0)" class="ce-breakdown">
                <div class="ce-row">
                    <span>{{ t('casino_chips.you_pay') }}</span>
                    <span class="ce-mono">{{ formatCash(parsedBuyAmount) }}</span>
                </div>
                <div v-if="bonusChips.gt(0)" class="ce-row ce-bonus">
                    <span>
                        <AppIcon icon="mdi:star" class="ce-star" />
                        {{ t('casino_chips.tier_bonus') }}
                    </span>
                    <span class="ce-mono">+{{ formatCash(bonusChips) }}</span>
                </div>
                <div class="ce-divider" />
                <div class="ce-row ce-row-total">
                    <span>{{ t('casino_chips.chips_received') }}</span>
                    <span class="ce-mono ce-total">
                        <AppIcon icon="mdi:poker-chip" class="ce-chip-sm" />
                        {{ formatCash(totalChipsReceived) }}
                    </span>
                </div>
            </div>

            <UButton variant="primary" block :disabled="!canBuy" @click="doBuy" icon="mdi:cash">
                {{ t('casino_chips.buy_chips') }}
            </UButton>
        </template>

        <!-- ═══ CASHOUT TAB ═══ -->
        <template v-else>
            <!-- Presets -->
            <div class="ce-presets">
                <button v-for="p in presets" :key="p" class="ce-preset" :class="{ active: cashoutAmount === String(p) }"
                    @click="selectPreset(p)">
                    {{ formatCash(D(p)) }}
                </button>
                <button class="ce-preset ce-preset-all" @click="cashoutAmount = chipStore.chipBalance.toString()">
                    {{ t('casino_chips.all') }}
                </button>
            </div>

            <!-- Custom input -->
            <div class="ce-input-wrap">
                <AppIcon icon="mdi:poker-chip" class="ce-currency-chip" />
                <input type="text" inputmode="numeric" class="ce-input" :value="cashoutAmount" @input="onCashoutInput"
                    :placeholder="t('casino_chips.enter_amount')" />
            </div>

            <!-- Breakdown -->
            <div v-if="parsedCashoutAmount.gt(0)" class="ce-breakdown">
                <div class="ce-row">
                    <span>{{ t('casino_chips.chips_spent') }}</span>
                    <span class="ce-mono">{{ formatCash(parsedCashoutAmount) }}</span>
                </div>
                <div class="ce-row ce-row-fee">
                    <span>{{ t('casino_chips.cashout_fee') }} ({{ (cashoutFeeVal * 100).toFixed(1) }}%)</span>
                    <span class="ce-mono ce-fee">−{{ formatCash(cashoutFeeAmt) }}</span>
                </div>
                <div class="ce-divider" />
                <div class="ce-row ce-row-total">
                    <span>{{ t('casino_chips.you_receive') }}</span>
                    <span class="ce-mono ce-total">{{ formatCash(cashoutNet) }}</span>
                </div>
            </div>

            <UButton variant="success" block :disabled="!canCashout" @click="doCashout" icon="mdi:cash-multiple">
                {{ t('casino_chips.cashout') }}
            </UButton>
        </template>

        <!-- Denominations -->
        <details class="ce-denoms">
            <summary class="ce-denoms-summary">
                <AppIcon icon="mdi:information-outline" class="ce-info-icon" />
                {{ t('casino_chips.denominations') }}
            </summary>
            <div class="ce-denom-grid">
                <div v-for="d in CHIP_DENOMINATIONS" :key="d.id" class="ce-denom-item">
                    <span class="ce-denom-dot" :style="{ background: d.color }" />
                    <span class="ce-denom-name">{{ t(d.labelKey) }}</span>
                    <span class="ce-denom-val ce-mono">{{ formatCash(d.value) }}</span>
                </div>
            </div>
        </details>
    </div>
</template>

<style scoped>
.ce-widget {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-5);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.ce-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.ce-header-icon {
    font-size: 1.6rem;
    color: var(--t-warning);
}

.ce-title {
    margin: 0;
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.ce-subtitle {
    margin: 0;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

/* Balance */
.ce-balance-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-3) var(--t-space-4);
    background: color-mix(in srgb, var(--t-warning) 8%, var(--t-bg-elevated));
    border: 1px solid color-mix(in srgb, var(--t-warning) 20%, transparent);
    border-radius: var(--t-radius-md);
}

.ce-balance-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.ce-balance-value {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    color: var(--t-warning);
}

.ce-chip-icon {
    font-size: 1rem;
}

/* Tabs */
.ce-tabs {
    display: flex;
    gap: 2px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    padding: 2px;
}

.ce-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-1);
    padding: var(--t-space-2);
    border: none;
    border-radius: calc(var(--t-radius-md) - 2px);
    background: transparent;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.ce-tab.active {
    background: var(--t-bg-card);
    color: var(--t-text);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.ce-tab-icon {
    font-size: 0.9rem;
}

/* Payment method */
.ce-method {
    display: flex;
    gap: var(--t-space-2);
}

.ce-method-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-1);
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text-secondary);
    font-size: var(--t-font-size-sm);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.ce-method-btn.active {
    background: color-mix(in srgb, var(--t-accent) 12%, transparent);
    border-color: var(--t-accent);
    color: var(--t-accent);
}

/* Cash only notice */
.ce-notice {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    background: color-mix(in srgb, var(--t-info) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--t-info) 25%, transparent);
    border-radius: var(--t-radius-md);
    font-size: var(--t-font-size-xs);
    color: var(--t-info);
}

/* Presets */
.ce-presets {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.ce-preset {
    padding: var(--t-space-1) var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-full);
    color: var(--t-text-secondary);
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.ce-preset:hover,
.ce-preset.active {
    background: color-mix(in srgb, var(--t-warning) 15%, transparent);
    border-color: var(--t-warning);
    color: var(--t-warning);
}

.ce-preset-all {
    font-family: var(--t-font-body);
    font-weight: var(--t-font-semibold);
}

/* Input */
.ce-input-wrap {
    display: flex;
    align-items: center;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: 0 var(--t-space-3);
    transition: border-color var(--t-transition-fast);
}

.ce-input-wrap:focus-within {
    border-color: var(--t-warning);
}

.ce-currency {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
}

.ce-currency-chip {
    font-size: 1.2rem;
    color: var(--t-warning);
}

.ce-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--t-text);
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    padding: var(--t-space-3);
}

.ce-input::placeholder {
    color: var(--t-text-muted);
    opacity: 0.5;
}

/* Breakdown */
.ce-breakdown {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
    padding: var(--t-space-3);
    background: var(--t-bg-elevated);
    border-radius: var(--t-radius-md);
}

.ce-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
}

.ce-mono {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
}

.ce-fee {
    color: var(--t-warning);
}

.ce-bonus {
    color: var(--t-success);
}

.ce-star {
    font-size: 0.75rem;
}

.ce-divider {
    height: 1px;
    background: var(--t-border);
    margin: var(--t-space-1) 0;
}

.ce-row-total {
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.ce-total {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--t-success);
    font-size: var(--t-font-size-base);
}

.ce-chip-sm {
    font-size: 0.85rem;
    color: var(--t-warning);
}

/* Denominations */
.ce-denoms {
    margin-top: var(--t-space-1);
}

.ce-denoms-summary {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    cursor: pointer;
    user-select: none;
}

.ce-info-icon {
    font-size: 0.85rem;
}

.ce-denom-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--t-space-1);
    padding-top: var(--t-space-2);
}

.ce-denom-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

.ce-denom-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.ce-denom-name {
    flex: 1;
}

.ce-denom-val {
    color: var(--t-text-muted);
}
</style>
