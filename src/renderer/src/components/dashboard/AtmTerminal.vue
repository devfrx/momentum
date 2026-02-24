<script setup lang="ts">
/**
 * AtmTerminal — Withdraw from card balance (bank account) to wallet cash.
 *
 * Shows tier-based fee and allows quick or custom withdrawals.
 * Card → ATM → Cash (wallet). Cash is needed for black market, chip purchases, etc.
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCardPaymentStore } from '@renderer/stores/useCardPaymentStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { D, ZERO } from '@renderer/core/BigNum'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import Decimal from 'break_infinity.js'

const { t } = useI18n()
const cardPayment = useCardPaymentStore()
const player = usePlayerStore()
const { formatCash } = useFormat()

const amount = ref('')

const presets = [100, 500, 1000, 5000, 10000]

const parsedAmount = computed((): Decimal => {
    const n = parseFloat(amount.value.replace(/,/g, ''))
    if (isNaN(n) || n <= 0) return ZERO
    return D(n)
})

const feeAmount = computed(() => cardPayment.calculateAtmFee(parsedAmount.value))
const totalCost = computed(() => cardPayment.calculateAtmTotal(parsedAmount.value))

const maxWithdrawable = computed(() => {
    const balance = player.cardBalance
    // Max amount where amount + fee <= balance
    if (cardPayment.atmFeeRate === 0) return balance
    const maxFromBalance = balance.div(1 + cardPayment.atmFeeRate).floor()
    return maxFromBalance
})

const canWithdraw = computed(() => {
    if (parsedAmount.value.lte(0)) return false
    if (totalCost.value.gt(player.cardBalance)) return false
    return true
})

function selectPreset(val: number): void {
    amount.value = val.toString()
}

function setMax(): void {
    if (maxWithdrawable.value.gt(0)) {
        amount.value = maxWithdrawable.value.toString()
    }
}

function doWithdraw(): void {
    if (!canWithdraw.value) return
    cardPayment.withdrawFromAtm(parsedAmount.value)
    amount.value = ''
}

function onInput(e: Event): void {
    const input = e.target as HTMLInputElement
    amount.value = input.value.replace(/[^\d,]/g, '')
}
</script>

<template>
    <div class="atm-widget">
        <!-- Header -->
        <div class="atm-header">
            <AppIcon icon="mdi:atm" class="atm-header-icon" />
            <div class="atm-header-text">
                <h3 class="atm-title">{{ t('atm.title') }}</h3>
                <p class="atm-subtitle">{{ t('atm.subtitle') }}</p>
            </div>
        </div>

        <!-- Balances row -->
        <div class="atm-balances">
            <div class="atm-bal-item">
                <span class="atm-bal-label">
                    <AppIcon icon="mdi:credit-card" class="atm-bal-icon" />
                    {{ t('atm.card_balance') }}
                </span>
                <span class="atm-bal-value">{{ formatCash(player.cardBalance) }}</span>
            </div>
            <AppIcon icon="mdi:arrow-right" class="atm-arrow" />
            <div class="atm-bal-item">
                <span class="atm-bal-label">
                    <AppIcon icon="mdi:wallet" class="atm-bal-icon wallet-icon" />
                    {{ t('atm.wallet') }}
                </span>
                <span class="atm-bal-value wallet-val">{{ formatCash(player.cash) }}</span>
            </div>
        </div>

        <!-- Fee & limit info -->
        <div class="atm-info">
            <div class="atm-info-item">
                <span>{{ t('atm.fee_rate') }}</span>
                <span class="atm-info-val" :class="{ 'fee-free': cardPayment.atmFeeRate === 0 }">
                    {{ cardPayment.atmFeeRate === 0 ? t('atm.free') : cardPayment.atmFeePercent + '%' }}
                </span>
            </div>
        </div>

        <!-- Presets -->
        <div class="atm-presets">
            <button v-for="p in presets" :key="p" class="atm-preset" :class="{ active: amount === String(p) }"
                @click="selectPreset(p)">
                {{ formatCash(D(p)) }}
            </button>
            <button class="atm-preset atm-preset-max" @click="setMax">
                {{ t('atm.max') }}
            </button>
        </div>

        <!-- Custom input -->
        <div class="atm-input-wrap">
            <span class="atm-currency">$</span>
            <input type="text" inputmode="numeric" class="atm-input" :value="amount" @input="onInput"
                :placeholder="t('atm.enter_amount')" />
        </div>

        <!-- Breakdown -->
        <div v-if="parsedAmount.gt(0)" class="atm-breakdown">
            <div class="atm-row">
                <span>{{ t('atm.withdraw_amount') }}</span>
                <span class="atm-mono">{{ formatCash(parsedAmount) }}</span>
            </div>
            <div v-if="feeAmount.gt(0)" class="atm-row atm-row-fee">
                <span>{{ t('atm.fee') }} ({{ cardPayment.atmFeePercent }}%)</span>
                <span class="atm-mono atm-fee">+{{ formatCash(feeAmount) }}</span>
            </div>
            <div class="atm-divider" />
            <div class="atm-row atm-row-total">
                <span>{{ t('atm.deducted_from_card') }}</span>
                <span class="atm-mono atm-total-val">{{ formatCash(totalCost) }}</span>
            </div>
        </div>

        <UButton variant="primary" block :disabled="!canWithdraw" @click="doWithdraw" icon="mdi:cash-fast">
            {{ t('atm.withdraw') }}
        </UButton>
    </div>
</template>

<style scoped>
.atm-widget {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.atm-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.atm-header-icon {
    font-size: 1.5rem;
    color: var(--t-accent);
}

.atm-title {
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    margin: 0;
}

.atm-subtitle {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0;
}

/* Balances */
.atm-balances {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    background: var(--t-bg-elevated);
    border-radius: var(--t-radius-md);
}

.atm-bal-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.atm-bal-label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.atm-bal-icon {
    font-size: 0.75rem;
}

.wallet-icon {
    color: var(--t-success);
}

.atm-bal-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.wallet-val {
    color: var(--t-success);
}

.atm-arrow {
    font-size: 1.2rem;
    color: var(--t-text-muted);
    flex-shrink: 0;
}

/* Info chips */
.atm-info {
    display: flex;
    gap: var(--t-space-3);
}

.atm-info-item {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
}

.atm-info-val {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.fee-free {
    color: var(--t-success);
}

/* Presets */
.atm-presets {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.atm-preset {
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

.atm-preset:hover,
.atm-preset.active {
    background: color-mix(in srgb, var(--t-accent) 15%, transparent);
    border-color: var(--t-accent);
    color: var(--t-accent);
}

.atm-preset-max {
    font-family: var(--t-font-body);
    font-weight: var(--t-font-semibold);
}

/* Input */
.atm-input-wrap {
    display: flex;
    align-items: center;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: 0 var(--t-space-3);
    transition: border-color var(--t-transition-fast);
}

.atm-input-wrap:focus-within {
    border-color: var(--t-accent);
}

.atm-currency {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
}

.atm-input {
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

.atm-input::placeholder {
    color: var(--t-text-muted);
    opacity: 0.5;
}

/* Breakdown */
.atm-breakdown {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
    padding: var(--t-space-3);
    background: var(--t-bg-elevated);
    border-radius: var(--t-radius-md);
}

.atm-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
}

.atm-mono {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
}

.atm-fee {
    color: var(--t-warning);
}

.atm-divider {
    height: 1px;
    background: var(--t-border);
    margin: var(--t-space-1) 0;
}

.atm-row-total {
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.atm-total-val {
    color: var(--t-danger);
}
</style>
