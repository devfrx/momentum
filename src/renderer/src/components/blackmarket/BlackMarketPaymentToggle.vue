<script setup lang="ts">
/**
 * BlackMarketPaymentToggle — Crypto / Cash toggle for Black Market transactions.
 *
 * In the black market you can't use cards (it's illegal!).
 * If the player owns crypto, they can toggle between paying with crypto or cash.
 * When crypto is selected, shows a dropdown of holdings to pick which asset to sell.
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCryptoStore, type CryptoHolding } from '@renderer/stores/useCryptoStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { D, ZERO, gte, mul, sub } from '@renderer/core/BigNum'
import AppIcon from '@renderer/components/AppIcon.vue'
import Decimal from 'break_infinity.js'

const props = defineProps<{
    /** Amount the player needs to pay */
    cost: Decimal
    /** Whether the accept button should be disabled for other reasons */
    externalDisabled?: boolean
}>()

const emit = defineEmits<{
    /** Emitted when the player confirms payment — contains the chosen method and asset */
    pay: [method: 'cash' | 'crypto', assetId?: string]
}>()

const { t } = useI18n()
const crypto = useCryptoStore()
const player = usePlayerStore()
const { formatCash } = useFormat()

const method = ref<'cash' | 'crypto'>('cash')
const selectedAssetId = ref<string | null>(null)

/** Only show crypto toggle if the player actually owns crypto */
const hasCrypto = computed(() => crypto.wallet.length > 0)

/** Holdings worth enough to pay */
const eligibleHoldings = computed((): (CryptoHolding & { asset: any; value: Decimal })[] => {
    return crypto.wallet
        .map((h) => {
            const asset = crypto.assets?.find((a: any) => a.id === h.assetId)
            if (!asset) return null
            const value = D(asset.currentPrice * h.amount)
            return { ...h, asset, value }
        })
        .filter((h): h is NonNullable<typeof h> => h !== null && h.value.gt(0))
        .sort((a, b) => b.value.toNumber() - a.value.toNumber())
})

/** Auto-select the first eligible holding */
watch(eligibleHoldings, (list) => {
    if (list.length && !selectedAssetId.value) {
        selectedAssetId.value = list[0].assetId
    }
}, { immediate: true })

const selectedHolding = computed(() =>
    eligibleHoldings.value.find((h) => h.assetId === selectedAssetId.value) ?? null
)

const canPayCash = computed(() => gte(player.cash, props.cost))
const canPayCrypto = computed(() => {
    if (!selectedHolding.value) return false
    return selectedHolding.value.value.gte(props.cost)
})

const canPay = computed(() => {
    if (props.externalDisabled) return false
    return method.value === 'cash' ? canPayCash.value : canPayCrypto.value
})

/** How many units of the selected crypto are needed */
const cryptoUnitsNeeded = computed((): number => {
    if (!selectedHolding.value) return 0
    const price = selectedHolding.value.asset.currentPrice
    if (price <= 0) return 0
    return Math.ceil(props.cost.toNumber() / price * 1000) / 1000 // 3 decimal places
})

function doPay(): void {
    if (!canPay.value) return
    emit('pay', method.value, method.value === 'crypto' ? selectedAssetId.value ?? undefined : undefined)
}
</script>

<template>
    <div class="bm-toggle">
        <!-- Method selector -->
        <div v-if="hasCrypto" class="bm-methods">
            <button class="bm-method" :class="{ active: method === 'cash' }" @click="method = 'cash'">
                <AppIcon icon="mdi:cash" class="bm-method-icon" />
                <span>{{ t('bm_payment.cash') }}</span>
            </button>
            <button class="bm-method" :class="{ active: method === 'crypto' }" @click="method = 'crypto'">
                <AppIcon icon="mdi:bitcoin" class="bm-method-icon" />
                <span>{{ t('bm_payment.crypto') }}</span>
            </button>
        </div>

        <!-- Cash mode info -->
        <div v-if="method === 'cash'" class="bm-info-row">
            <div class="bm-info-left">
                <AppIcon icon="mdi:wallet" class="bm-info-icon" />
                <span class="bm-info-label">{{ t('bm_payment.your_cash') }}</span>
            </div>
            <span class="bm-info-value" :class="{ insufficient: !canPayCash }">
                {{ formatCash(player.cash) }}
            </span>
        </div>

        <!-- Crypto mode -->
        <template v-if="method === 'crypto'">
            <!-- Asset selector -->
            <div v-if="eligibleHoldings.length > 1" class="bm-asset-selector">
                <label class="bm-select-label">{{ t('bm_payment.select_asset') }}</label>
                <div class="bm-asset-list">
                    <button v-for="h in eligibleHoldings" :key="h.assetId" class="bm-asset-option"
                        :class="{ active: selectedAssetId === h.assetId }" @click="selectedAssetId = h.assetId">
                        <span class="bm-asset-name">{{ h.asset.symbol }}</span>
                        <span class="bm-asset-val">{{ formatCash(h.value) }}</span>
                    </button>
                </div>
            </div>

            <!-- Selected crypto info -->
            <div v-if="selectedHolding" class="bm-crypto-info">
                <div class="bm-info-row">
                    <div class="bm-info-left">
                        <AppIcon icon="mdi:wallet" class="bm-info-icon" />
                        <span class="bm-info-label">{{ selectedHolding.asset.symbol }}</span>
                    </div>
                    <span class="bm-info-value">{{ formatCash(selectedHolding.value) }}</span>
                </div>
                <div class="bm-info-row bm-info-sub">
                    <span class="bm-info-label">{{ t('bm_payment.units_needed') }}</span>
                    <span class="bm-info-value bm-mono">{{ cryptoUnitsNeeded }} {{ selectedHolding.asset.symbol
                        }}</span>
                </div>
            </div>

            <!-- No holdings warning -->
            <div v-if="!eligibleHoldings.length" class="bm-no-crypto">
                <AppIcon icon="mdi:alert-circle-outline" class="bm-warn-icon" />
                {{ t('bm_payment.no_crypto') }}
            </div>

            <!-- Insufficient warning -->
            <div v-else-if="selectedHolding && !canPayCrypto" class="bm-insufficient">
                <AppIcon icon="mdi:alert" class="bm-warn-icon" />
                {{ t('bm_payment.insufficient_crypto') }}
            </div>
        </template>

        <!-- Cost display -->
        <div class="bm-cost-row">
            <span class="bm-cost-label">{{ t('bm_payment.cost') }}</span>
            <span class="bm-cost-value">{{ formatCash(cost) }}</span>
        </div>

        <!-- Pay button -->
        <button class="bm-pay-btn" :disabled="!canPay" @click="doPay">
            <AppIcon :icon="method === 'cash' ? 'mdi:cash-fast' : 'mdi:bitcoin'" class="bm-pay-icon" />
            <span>{{ method === 'cash' ? t('bm_payment.pay_cash') : t('bm_payment.pay_crypto') }}</span>
        </button>
    </div>
</template>

<style scoped>
.bm-toggle {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.bm-methods {
    display: flex;
    gap: 2px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    padding: 2px;
}

.bm-method {
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

.bm-method.active {
    background: var(--t-bg-card);
    color: var(--t-text);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.bm-method-icon {
    font-size: 1rem;
}

/* Info rows */
.bm-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-1) 0;
}

.bm-info-left {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
}

.bm-info-icon {
    font-size: 0.9rem;
    color: var(--t-text-muted);
}

.bm-info-label {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
}

.bm-info-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.bm-info-value.insufficient {
    color: var(--t-danger);
}

.bm-info-sub .bm-info-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.bm-info-sub .bm-info-value {
    font-size: var(--t-font-size-xs);
}

.bm-mono {
    font-family: var(--t-font-mono);
}

/* Asset selector */
.bm-asset-selector {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.bm-select-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.bm-asset-list {
    display: flex;
    gap: var(--t-space-1);
    flex-wrap: wrap;
}

.bm-asset-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--t-space-1) var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.bm-asset-option.active {
    border-color: var(--t-accent);
    background: color-mix(in srgb, var(--t-accent) 10%, transparent);
}

.bm-asset-name {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.bm-asset-val {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    font-family: var(--t-font-mono);
}

/* Warnings */
.bm-no-crypto,
.bm-insufficient {
    display: flex;
    align-items: center;
    gap: var(--t-space-1);
    font-size: var(--t-font-size-xs);
    color: var(--t-warning);
    padding: var(--t-space-2);
    background: color-mix(in srgb, var(--t-warning) 8%, transparent);
    border-radius: var(--t-radius-md);
}

.bm-warn-icon {
    font-size: 0.9rem;
}

/* Cost */
.bm-cost-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-elevated);
    border-radius: var(--t-radius-md);
}

.bm-cost-label {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    font-weight: var(--t-font-semibold);
}

.bm-cost-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

/* Pay button */
.bm-pay-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    width: 100%;
    padding: var(--t-space-3);
    background: var(--t-accent-gradient, var(--t-accent));
    border: none;
    border-radius: var(--t-radius-md);
    color: var(--t-text-on-accent, #fff);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.bm-pay-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
}

.bm-pay-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.bm-pay-icon {
    font-size: 1rem;
}
</style>
