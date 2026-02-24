<script setup lang="ts">
/**
 * CardPaymentDialog — Immersive card payment confirmation modal.
 *
 * Shows a mini card preview, amount breakdown (amount + fee = total),
 * input fields for last 4 digits + CVV, and processing animation.
 * Used for ALL transactions except gambling (chips) and black market (crypto/cash).
 */
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCardPaymentStore } from '@renderer/stores/useCardPaymentStore'
import { useBankingStore } from '@renderer/stores/useBankingStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UModal, UButton } from '@renderer/components/ui'

const props = defineProps<{
    modelValue: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const cardPayment = useCardPaymentStore()
const banking = useBankingStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const last4 = ref('')
const cvv = ref('')
const last4Ref = ref<HTMLInputElement | null>(null)

const style = computed(() => banking.activeStyle)
const request = computed(() => cardPayment.currentRequest)
const status = computed(() => cardPayment.status)

const declineMessage = computed(() => {
    const reason = cardPayment.declineReason
    switch (reason) {
        case 'balance': return t('card_payment.declined_balance')
        case 'cooldown': return t('card_payment.declined_cooldown')
        default: return t('card_payment.declined_wrong_pin')
    }
})

const canConfirm = computed(() =>
    last4.value.length === 4 &&
    cvv.value.length === 3 &&
    status.value === 'pending'
)

const statusIcon = computed(() => {
    switch (status.value) {
        case 'processing': return 'mdi:loading'
        case 'success': return 'mdi:check-circle'
        case 'declined': return 'mdi:close-circle'
        case 'failed': return 'mdi:alert-circle'
        default: return ''
    }
})

const statusColor = computed(() => {
    switch (status.value) {
        case 'success': return 'var(--t-success)'
        case 'declined':
        case 'failed': return 'var(--t-danger)'
        default: return 'var(--t-accent)'
    }
})

const processingText = computed(() => {
    if (status.value !== 'processing') return ''
    // Cycle through messages
    const msgs = [
        t('card_payment.verifying'),
        t('card_payment.authorizing'),
        t('card_payment.processing')
    ]
    return msgs[Math.floor(Date.now() / 800) % msgs.length]
})

watch(() => props.modelValue, (open) => {
    if (open) {
        last4.value = ''
        cvv.value = ''
        nextTick(() => last4Ref.value?.focus())
    }
})

// Auto-close on terminal states
watch(status, (s) => {
    if (s === 'success') {
        setTimeout(() => emit('update:modelValue', false), 2200)
    }
    if (s === 'declined' || s === 'failed') {
        setTimeout(() => {
            cardPayment.cancelPayment()
            emit('update:modelValue', false)
        }, 3000)
    }
})

async function confirm(): Promise<void> {
    if (!canConfirm.value) return
    await cardPayment.confirmPayment(last4.value, cvv.value)
}

function cancel(): void {
    cardPayment.cancelPayment()
    emit('update:modelValue', false)
}

function onLast4Input(e: Event): void {
    const input = e.target as HTMLInputElement
    last4.value = input.value.replace(/\D/g, '').slice(0, 4)
}

function onCvvInput(e: Event): void {
    const input = e.target as HTMLInputElement
    cvv.value = input.value.replace(/\D/g, '').slice(0, 3)
}
</script>

<template>
    <UModal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" size="sm"
        :closable="status === 'pending'" :dismissable="false">

        <template #default>
            <div class="cpd" :class="[`cpd--${status}`]">

                <!-- ═══ Mini Card Preview ═══ -->
                <div class="cpd-card-preview" :style="{ background: style.gradient, color: style.textColor }">
                    <div class="cpd-card-pattern" :style="{ opacity: style.patternOpacity }" />
                    <div class="cpd-card-top">
                        <div class="cpd-bank">
                            <AppIcon icon="mdi:credit-card-fast-outline" class="cpd-bank-icon" />
                            <span class="cpd-bank-name">FINANX</span>
                        </div>
                        <div class="cpd-tier">
                            <AppIcon :icon="banking.tierConfig.icon" class="cpd-tier-icon" />
                        </div>
                    </div>
                    <div class="cpd-card-number">
                        •••• •••• •••• {{ banking.card.number.slice(-4) }}
                    </div>
                    <div class="cpd-card-bottom">
                        <span class="cpd-holder">{{ banking.holderName || '—' }}</span>
                        <span class="cpd-expiry">{{ banking.card.expiry }}</span>
                    </div>
                </div>

                <!-- ═══ Processing Overlay ═══ -->
                <transition name="cpd-fade">
                    <div v-if="status === 'processing' || status === 'success' || status === 'declined' || status === 'failed'"
                        class="cpd-overlay">
                        <div class="cpd-overlay-content">
                            <AppIcon :icon="statusIcon" class="cpd-status-icon"
                                :class="{ spinning: status === 'processing' }" :style="{ color: statusColor }" />
                            <span class="cpd-status-text" :style="{ color: statusColor }">
                                {{ status === 'processing' ? processingText :
                                    status === 'success' ? t('card_payment.success') :
                                        status === 'declined' ? t('card_payment.declined') :
                                            t('card_payment.failed') }}
                            </span>
                            <span v-if="status === 'success'" class="cpd-status-detail">
                                {{ t('card_payment.success_detail') }}
                            </span>
                            <span v-if="status === 'declined'" class="cpd-status-detail cpd-error">
                                {{ declineMessage }}
                            </span>
                        </div>
                    </div>
                </transition>

                <!-- ═══ Amount Breakdown ═══ -->
                <div v-if="request && status === 'pending'" class="cpd-breakdown">
                    <div class="cpd-desc">
                        <AppIcon icon="mdi:shopping" class="cpd-desc-icon" />
                        <span>{{ request.descriptionParams
                            ? t(request.descriptionKey, request.descriptionParams)
                            : t(request.descriptionKey) }}</span>
                    </div>

                    <div class="cpd-row">
                        <span class="cpd-label">{{ t('card_payment.amount') }}</span>
                        <span class="cpd-value">{{ formatCash(request.amount) }}</span>
                    </div>
                    <div class="cpd-row cpd-row--fee" v-if="request.fee.gt(0)">
                        <span class="cpd-label">
                            {{ t('card_payment.fee') }}
                            <span class="cpd-fee-badge">{{ t('card_payment.fee_rate', { pct: cardPayment.feePercent })
                                }}</span>
                        </span>
                        <span class="cpd-value cpd-value--fee">+{{ formatCash(request.fee) }}</span>
                    </div>
                    <div v-else class="cpd-row cpd-row--fee">
                        <span class="cpd-label cpd-no-fee">
                            <AppIcon icon="mdi:check-circle" class="cpd-no-fee-icon" />
                            {{ t('card_payment.no_fee') }}
                        </span>
                    </div>
                    <div class="cpd-divider" />
                    <div class="cpd-row cpd-row--total">
                        <span class="cpd-label">{{ t('card_payment.total') }}</span>
                        <span class="cpd-value cpd-value--total">{{ formatCash(request.total) }}</span>
                    </div>

                </div>

                <!-- ═══ PIN Input ═══ -->
                <div v-if="status === 'pending'" class="cpd-pin-section">
                    <div class="cpd-input-row">
                        <div class="cpd-input-group">
                            <label class="cpd-input-label">{{ t('card_payment.enter_last4') }}</label>
                            <input ref="last4Ref" type="text" inputmode="numeric" maxlength="4" class="cpd-input"
                                :value="last4" @input="onLast4Input" placeholder="••••" autocomplete="off" />
                        </div>
                        <div class="cpd-input-group cpd-input-group--cvv">
                            <label class="cpd-input-label">{{ t('card_payment.enter_cvv') }}</label>
                            <input type="text" inputmode="numeric" maxlength="3" class="cpd-input" :value="cvv"
                                @input="onCvvInput" placeholder="•••" autocomplete="off"
                                @keydown.enter="canConfirm && confirm()" />
                        </div>
                    </div>

                    <div class="cpd-actions">
                        <UButton variant="ghost" @click="cancel">
                            {{ t('card_payment.cancel') }}
                        </UButton>
                        <UButton variant="primary" :disabled="!canConfirm" @click="confirm">
                            <AppIcon icon="mdi:lock" class="cpd-lock-icon" />
                            {{ t('card_payment.confirm') }}
                        </UButton>
                    </div>

                    <div class="cpd-secure">
                        <AppIcon icon="mdi:shield-check" class="cpd-secure-icon" />
                        <span>{{ t('card_payment.secure_badge') }}</span>
                    </div>
                </div>

            </div>
        </template>
    </UModal>
</template>

<style scoped>
.cpd {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    position: relative;
    min-height: 380px;
}

/* ═══ Mini Card ═══ */
.cpd-card-preview {
    position: relative;
    border-radius: 12px;
    padding: var(--t-space-4) var(--t-space-5);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    aspect-ratio: 2.8;
}

.cpd-card-pattern {
    position: absolute;
    inset: 0;
    background:
        radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
        radial-gradient(circle at 15% 85%, rgba(255, 255, 255, 0.06) 0%, transparent 40%);
    pointer-events: none;
}

.cpd-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
}

.cpd-bank {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.cpd-bank-icon {
    font-size: 0.9rem;
    opacity: 0.8;
}

.cpd-bank-name {
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.8;
}

.cpd-tier-icon {
    font-size: 1rem;
    opacity: 0.7;
}

.cpd-card-number {
    font-family: var(--t-font-mono);
    font-size: 0.9rem;
    letter-spacing: 0.12em;
    opacity: 0.9;
    position: relative;
    z-index: 1;
}

.cpd-card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    position: relative;
    z-index: 1;
}

.cpd-holder {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    opacity: 0.75;
}

.cpd-expiry {
    font-size: 0.6rem;
    font-weight: 500;
    opacity: 0.65;
}

/* ═══ Processing Overlay ═══ */
.cpd-overlay {
    position: absolute;
    inset: 0;
    background: var(--t-bg-elevated);
    border-radius: var(--t-radius-lg);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cpd-overlay-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-3);
    text-align: center;
}

.cpd-status-icon {
    font-size: 3rem;
    transition: color 0.3s;
}

.cpd-status-icon.spinning {
    animation: cpd-spin 1s linear infinite;
}

@keyframes cpd-spin {
    to {
        transform: rotate(360deg);
    }
}

.cpd-status-text {
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
}

.cpd-status-detail {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.cpd-status-detail.cpd-error {
    color: var(--t-danger);
}

.cpd-fade-enter-active,
.cpd-fade-leave-active {
    transition: opacity 0.3s;
}

.cpd-fade-enter-from,
.cpd-fade-leave-to {
    opacity: 0;
}

/* ═══ Breakdown ═══ */
.cpd-breakdown {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.cpd-desc {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    padding-bottom: var(--t-space-2);
    border-bottom: 1px solid var(--t-border);
    margin-bottom: var(--t-space-1);
}

.cpd-desc-icon {
    font-size: 1rem;
    color: var(--t-text-muted);
}

.cpd-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cpd-label {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
}

.cpd-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.cpd-fee-badge {
    font-size: 0.65rem;
    padding: 0.08rem 0.35rem;
    background: color-mix(in srgb, var(--t-warning) 12%, transparent);
    color: var(--t-warning);
    border-radius: var(--t-radius-sm);
    font-weight: var(--t-font-medium);
}

.cpd-value--fee {
    color: var(--t-warning);
}

.cpd-no-fee {
    color: var(--t-success);
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.cpd-no-fee-icon {
    font-size: 0.85rem;
}

.cpd-divider {
    height: 1px;
    background: var(--t-border);
    margin: var(--t-space-1) 0;
}

.cpd-row--total .cpd-label {
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.cpd-value--total {
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

/* ═══ PIN Input ═══ */
.cpd-pin-section {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.cpd-input-row {
    display: flex;
    gap: var(--t-space-3);
}

.cpd-input-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.cpd-input-group--cvv {
    max-width: 100px;
}

.cpd-input-label {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.cpd-input {
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text);
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-bold);
    letter-spacing: 0.2em;
    padding: var(--t-space-3) var(--t-space-4);
    text-align: center;
    outline: none;
    transition: border-color var(--t-transition-fast);
}

.cpd-input:focus {
    border-color: var(--t-accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--t-accent) 20%, transparent);
}

.cpd-input::placeholder {
    color: var(--t-text-muted);
    opacity: 0.5;
    letter-spacing: 0.3em;
}

/* Actions */
.cpd-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--t-space-2);
}

.cpd-lock-icon {
    font-size: 0.85rem;
    margin-right: 0.2rem;
}

/* Secure badge */
.cpd-secure {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    opacity: 0.6;
}

.cpd-secure-icon {
    font-size: 0.75rem;
    color: var(--t-success);
}
</style>
