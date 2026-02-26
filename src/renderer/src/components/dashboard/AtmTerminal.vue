<script setup lang="ts">
/**
 * AtmTerminal — Withdraw from card balance (bank account) to wallet cash,
 * or deposit cash from wallet back to card.
 *
 * Shows tier-based fee and allows quick or custom withdrawals/deposits.
 * Withdraw: Card → ATM → Cash (wallet)
 * Deposit:  Cash (wallet) → ATM → Card
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

type AtmMode = 'withdraw' | 'deposit'
const mode = ref<AtmMode>('withdraw')
const amount = ref('')

const presets = [100, 500, 1000, 5000, 10000]

const isDeposit = computed(() => mode.value === 'deposit')

const parsedAmount = computed((): Decimal => {
    const n = parseFloat(amount.value.replace(/,/g, ''))
    if (isNaN(n) || n <= 0) return ZERO
    return D(n)
})

const feeAmount = computed(() => cardPayment.calculateAtmFee(parsedAmount.value))
const totalCost = computed(() => cardPayment.calculateAtmTotal(parsedAmount.value))

const maxWithdrawable = computed(() => {
    const balance = player.cardBalance
    return balance.div(1 + cardPayment.atmFeeRate).floor()
})

const maxDepositable = computed(() => {
    const cash = player.cash
    return cash.div(1 + cardPayment.atmFeeRate).floor()
})

const canExecute = computed(() => {
    if (parsedAmount.value.lte(0)) return false
    if (isDeposit.value) {
        return totalCost.value.lte(player.cash)
    }
    return totalCost.value.lte(player.cardBalance)
})

function switchMode(m: AtmMode): void {
    mode.value = m
    amount.value = ''
}

function selectPreset(val: number): void {
    amount.value = val.toString()
}

function setMax(): void {
    const max = isDeposit.value ? maxDepositable.value : maxWithdrawable.value
    if (max.gt(0)) {
        amount.value = max.toString()
    }
}

function doExecute(): void {
    if (!canExecute.value) return
    if (isDeposit.value) {
        cardPayment.depositToCard(parsedAmount.value)
    } else {
        cardPayment.withdrawFromAtm(parsedAmount.value)
    }
    amount.value = ''
}

function onInput(e: Event): void {
    const input = e.target as HTMLInputElement
    amount.value = input.value.replace(/[^\d,]/g, '')
}
</script>

<template>
    <div class="atm-terminal">
        <!-- Header with glass effect -->
        <div class="atm-top-bar">
            <div class="atm-logo">
                <AppIcon icon="mdi:atm" class="atm-logo-icon" />
                <span class="atm-logo-text">ATM</span>
            </div>
            <div class="atm-fee-badge">
                {{ cardPayment.atmFeePercent }}%
                <span class="atm-fee-label">{{ t('atm.fee_rate') }}</span>
            </div>
        </div>

        <!-- Mode toggle -->
        <div class="atm-mode-toggle">
            <button class="atm-mode-btn" :class="{ 'atm-mode-btn--active': mode === 'withdraw' }"
                @click="switchMode('withdraw')">
                <AppIcon icon="mdi:cash-fast" class="atm-mode-icon" />
                {{ t('atm.mode_withdraw') }}
            </button>
            <button class="atm-mode-btn" :class="{ 'atm-mode-btn--active': mode === 'deposit' }"
                @click="switchMode('deposit')">
                <AppIcon icon="mdi:credit-card-plus" class="atm-mode-icon" />
                {{ t('atm.mode_deposit') }}
            </button>
        </div>

        <!-- Balance transfer visual -->
        <div class="atm-flow">
            <div class="atm-flow-side" :class="{ 'atm-flow-side--source': !isDeposit }">
                <AppIcon icon="mdi:credit-card" class="atm-flow-icon" />
                <span class="atm-flow-val">{{ formatCash(player.cardBalance) }}</span>
            </div>
            <div class="atm-flow-arrow">
                <AppIcon :icon="isDeposit ? 'mdi:arrow-left' : 'mdi:arrow-right'" class="atm-flow-arrow-icon" />
            </div>
            <div class="atm-flow-side"
                :class="{ 'atm-flow-side--source': isDeposit, 'atm-flow-side--wallet': !isDeposit }">
                <AppIcon icon="mdi:wallet" class="atm-flow-icon" />
                <span class="atm-flow-val">{{ formatCash(player.cash) }}</span>
            </div>
        </div>

        <!-- Presets -->
        <div class="atm-presets">
            <button v-for="p in presets" :key="p" class="atm-chip" :class="{ active: amount === String(p) }"
                @click="selectPreset(p)">
                {{ formatCash(D(p)) }}
            </button>
            <button class="atm-chip atm-chip--max" @click="setMax">
                {{ t('atm.max') }}
            </button>
        </div>

        <!-- Input -->
        <div class="atm-input-row">
            <span class="atm-input-currency">$</span>
            <input type="text" inputmode="numeric" class="atm-input" :value="amount" @input="onInput"
                :placeholder="t('atm.enter_amount')" />
        </div>

        <!-- Breakdown -->
        <div v-if="parsedAmount.gt(0)" class="atm-receipt">
            <div class="atm-receipt-row">
                <span>{{ isDeposit ? t('atm.deposit_amount') : t('atm.withdraw_amount') }}</span>
                <span class="atm-receipt-val">{{ formatCash(parsedAmount) }}</span>
            </div>
            <div class="atm-receipt-row atm-receipt-row--fee">
                <span>{{ t('atm.fee') }} ({{ cardPayment.atmFeePercent }}%)</span>
                <span class="atm-receipt-val atm-receipt-val--fee">+{{ formatCash(feeAmount) }}</span>
            </div>
            <div class="atm-receipt-divider" />
            <div class="atm-receipt-row atm-receipt-row--total">
                <span>{{ isDeposit ? t('atm.deducted_from_wallet') : t('atm.deducted_from_card') }}</span>
                <span class="atm-receipt-val atm-receipt-val--total">{{ formatCash(totalCost) }}</span>
            </div>
            <div v-if="isDeposit" class="atm-receipt-row atm-receipt-row--credit">
                <span>{{ t('atm.added_to_card') }}</span>
                <span class="atm-receipt-val atm-receipt-val--credit">+{{ formatCash(parsedAmount) }}</span>
            </div>
        </div>

        <UButton variant="primary" block :disabled="!canExecute" @click="doExecute"
            :icon="isDeposit ? 'mdi:credit-card-plus' : 'mdi:cash-fast'">
            {{ isDeposit ? t('atm.deposit') : t('atm.withdraw') }}
        </UButton>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   ATM Terminal — Premium Glass Style
   ═══════════════════════════════════════════ */
.atm-terminal {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding: var(--t-space-5);
    background: color-mix(in srgb, var(--t-bg-card) 65%, transparent);
    backdrop-filter: blur(18px) saturate(1.3);
    border: 1px solid var(--t-glass-border);
    border-radius: var(--t-radius-lg);
    box-shadow:
        0 4px 24px color-mix(in srgb, var(--t-shadow) 18%, transparent),
        inset 0 1px 0 color-mix(in srgb, white 4%, transparent);
    width: 100%;
}

/* ─── Top Bar ─── */
.atm-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.atm-logo {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.atm-logo-icon {
    font-size: 1.3rem;
    color: var(--t-accent);
}

.atm-logo-text {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.atm-fee-badge {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    padding: 0.2rem 0.6rem;
    border-radius: var(--t-radius-full);
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--t-warning);
    background: color-mix(in srgb, var(--t-warning) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--t-warning) 20%, transparent);
}



.atm-fee-label {
    font-family: var(--t-font-body);
    font-size: var(--t-font-size-2xs);
    font-weight: var(--t-font-medium);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

/* ─── Mode Toggle ─── */
.atm-mode-toggle {
    display: flex;
    gap: 2px;
    background: color-mix(in srgb, var(--t-bg-muted) 60%, transparent);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: 2px;
}

.atm-mode-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-1);
    padding: 0.35rem 0.5rem;
    border: none;
    border-radius: calc(var(--t-radius-md) - 2px);
    background: transparent;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.atm-mode-btn:hover {
    color: var(--t-text-secondary);
    background: color-mix(in srgb, var(--t-bg-elevated) 50%, transparent);
}

.atm-mode-btn--active {
    background: color-mix(in srgb, var(--t-accent) 14%, transparent);
    color: var(--t-accent);
    box-shadow: 0 1px 4px color-mix(in srgb, var(--t-shadow) 12%, transparent);
}

.atm-mode-icon {
    font-size: 0.85rem;
}

/* ─── Balance Flow ─── */
.atm-flow {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3);
    background: color-mix(in srgb, var(--t-bg-elevated) 50%, transparent);
    border: 1px solid color-mix(in srgb, var(--t-border) 50%, transparent);
    border-radius: var(--t-radius-md);
}

.atm-flow-side {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    min-width: 0;
}

.atm-flow-icon {
    font-size: 0.9rem;
    color: var(--t-text-muted);
}

.atm-flow-side--wallet .atm-flow-icon {
    color: var(--t-success);
}

.atm-flow-side--source .atm-flow-icon {
    color: var(--t-accent);
}

.atm-flow-val {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.atm-flow-side--wallet .atm-flow-val {
    color: var(--t-success);
}

.atm-flow-arrow {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--t-accent) 12%, transparent);
}

.atm-flow-arrow-icon {
    font-size: 0.8rem;
    color: var(--t-accent);
}

/* ─── Presets ─── */
.atm-presets {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-1);
}

.atm-chip {
    padding: 0.2rem 0.6rem;
    background: color-mix(in srgb, var(--t-bg-muted) 70%, transparent);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-full);
    color: var(--t-text-secondary);
    font-size: var(--t-font-size-2xs);
    font-family: var(--t-font-mono);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.atm-chip:hover,
.atm-chip.active {
    background: color-mix(in srgb, var(--t-accent) 14%, transparent);
    border-color: var(--t-accent);
    color: var(--t-accent);
}

.atm-chip--max {
    font-family: var(--t-font-body);
    font-weight: var(--t-font-bold);
    text-transform: uppercase;
    font-size: var(--t-font-size-2xs);
    letter-spacing: 0.04em;
}

/* ─── Input ─── */
.atm-input-row {
    display: flex;
    align-items: center;
    background: color-mix(in srgb, var(--t-bg-muted) 60%, transparent);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    padding: 0 var(--t-space-3);
    transition: border-color var(--t-transition-fast), box-shadow var(--t-transition-fast);
}

.atm-input-row:focus-within {
    border-color: var(--t-accent);
}

.atm-input-currency {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
}

.atm-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none !important;
    color: var(--t-text);
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    padding: var(--t-space-2) var(--t-space-2);
}

.atm-input::placeholder {
    color: var(--t-text-muted);
    opacity: 0.45;
    font-size: var(--t-font-size-sm);
}

/* ─── Receipt / Breakdown ─── */
.atm-receipt {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
    padding: var(--t-space-3);
    background: color-mix(in srgb, var(--t-bg-elevated) 50%, transparent);
    border: 1px solid color-mix(in srgb, var(--t-border) 50%, transparent);
    border-radius: var(--t-radius-md);
}

.atm-receipt-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

.atm-receipt-val {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.atm-receipt-val--fee {
    color: var(--t-warning);
}

.atm-receipt-divider {
    height: 1px;
    background: color-mix(in srgb, var(--t-border) 60%, transparent);
    margin: var(--t-space-1) 0;
}

.atm-receipt-row--total {
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.atm-receipt-val--total {
    color: var(--t-danger);
}

.atm-receipt-row--credit {
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.atm-receipt-val--credit {
    color: var(--t-success);
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
}
</style>
