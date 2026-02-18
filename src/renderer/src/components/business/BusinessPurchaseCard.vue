<script setup lang="ts">
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton, UCard, UTooltip, UModal } from '@renderer/components/ui'
import { useFormat } from '@renderer/composables/useFormat'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { type BusinessDef } from '@renderer/data/businesses'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    def: BusinessDef
    tier: number
}>()

const emit = defineEmits<{
    buy: [defId: string, customName: string, customIcon: string]
}>()

const { t } = useI18n()
const player = usePlayerStore()
const { formatCash } = useFormat()

const canAfford = computed(() => player.canAfford(props.def.purchasePrice))
const isUnlocked = computed(() => player.netWorth.gte(props.def.unlockAtNetWorth))

// ── Size-class names (generalized, no real names) ──
const SIZE_KEYS = [
    'business.size_stand',
    'business.size_workshop',
    'business.size_store',
    'business.size_shop',
    'business.size_venture',
    'business.size_business',
    'business.size_company',
    'business.size_firm',
    'business.size_corporation',
    'business.size_enterprise',
    'business.size_conglomerate',
    'business.size_holding',
    'business.size_empire',
]
const sizeName = computed(() => t(SIZE_KEYS[Math.min(props.tier - 1, SIZE_KEYS.length - 1)]))

/** Generic tier icon — escalates with tier */
const TIER_ICONS = [
    'mdi:store-outline',
    'mdi:store',
    'mdi:storefront-outline',
    'mdi:storefront',
    'mdi:office-building-outline',
    'mdi:office-building',
    'mdi:domain',
    'mdi:domain',
    'mdi:city-variant-outline',
    'mdi:city-variant',
    'mdi:city',
    'mdi:city',
    'mdi:castle',
]
const tierIcon = computed(() => TIER_ICONS[Math.min(props.tier - 1, TIER_ICONS.length - 1)])

// ── Estimated stats at 1 employee (honest starting state) ──
const startEmployees = 1
const startCapacity = computed(() => startEmployees * props.def.outputPerEmployee)
const qualityFactor = computed(() => 0.5 + (props.def.baseQuality / 100) * 1.5)
const estimatedDemand = computed(() => Math.floor(props.def.baseCustomers * qualityFactor.value))
const estimatedSold = computed(() => Math.min(estimatedDemand.value, startCapacity.value))
const estimatedRevenue = computed(() => estimatedSold.value * props.def.optimalPrice)
const estimatedCosts = computed(() =>
    startEmployees * props.def.baseSalary +
    props.def.baseRent +
    props.def.supplyCostPerUnit * estimatedSold.value
)
const estimatedProfit = computed(() => estimatedRevenue.value - estimatedCosts.value)
const profitPerSecond = computed(() => estimatedProfit.value * 10)
const margin = computed(() => estimatedRevenue.value > 0
    ? (estimatedProfit.value / estimatedRevenue.value * 100)
    : 0
)
const roiMinutes = computed(() =>
    estimatedProfit.value > 0
        ? props.def.purchasePrice.toNumber() / (estimatedProfit.value * 10 * 60)
        : Infinity
)
const roiLabel = computed(() => {
    const min = roiMinutes.value
    if (!isFinite(min)) return '∞'
    if (min < 60) return `${Math.round(min)}m`
    const hrs = min / 60
    if (hrs < 24) return `${hrs.toFixed(1)}h`
    return `${(hrs / 24).toFixed(1)}d`
})

// ── Buy dialog (name + icon selection) ──
const showBuyDialog = ref(false)
const customName = ref('')
const customIcon = ref('')

const ICON_CHOICES = [
    'mdi:store', 'mdi:storefront', 'mdi:office-building', 'mdi:domain',
    'mdi:factory', 'mdi:bank', 'mdi:cup', 'mdi:coffee',
    'mdi:pizza', 'mdi:silverware-fork-knife', 'mdi:food-variant', 'mdi:hamburger',
    'mdi:dumbbell', 'mdi:car-wash', 'mdi:newspaper', 'mdi:hanger',
    'mdi:music-note', 'mdi:bed', 'mdi:laptop', 'mdi:rocket-launch',
    'mdi:shopping', 'mdi:cart', 'mdi:cash-register', 'mdi:briefcase',
    'mdi:hammer-wrench', 'mdi:palette', 'mdi:camera', 'mdi:medical-bag',
    'mdi:school', 'mdi:book-open-variant', 'mdi:flower', 'mdi:paw',
]

function openBuyDialog() {
    customName.value = ''
    customIcon.value = tierIcon.value
    showBuyDialog.value = true
}

function confirmBuy() {
    const name = customName.value.trim() || sizeName.value
    emit('buy', props.def.id, name, customIcon.value)
    showBuyDialog.value = false
}
</script>

<template>
    <div>
        <UCard class="purchase-card" variant="dashed" :locked="!isUnlocked">
            <template #header>
                <div class="purchase-header">
                    <div class="biz-icon-wrap">
                        <AppIcon :icon="tierIcon" class="biz-icon" />
                    </div>
                    <div class="purchase-info">
                        <h3 class="purchase-name">{{ sizeName }}</h3>
                        <span class="purchase-price-tag">{{ formatCash(def.purchasePrice) }}</span>
                    </div>
                    <UTooltip :text="t('business.roi_tooltip')">
                        <span class="roi-badge"
                            :class="{ fast: roiMinutes < 60, mid: roiMinutes >= 60 && roiMinutes < 480 }">
                            <AppIcon icon="mdi:clock-fast" class="roi-icon" />
                            {{ roiLabel }}
                        </span>
                    </UTooltip>
                </div>
            </template>

            <div class="purchase-stats">
                <div class="ps-row">
                    <span class="ps-label">{{ $t('business.production_cap') }}</span>
                    <span class="ps-value">{{ startCapacity }} {{ $t('business.units_tick') }}</span>
                </div>
                <div class="ps-row">
                    <span class="ps-label">{{ $t('business.optimal_price') }}</span>
                    <span class="ps-value">{{ formatCash(def.optimalPrice) }}</span>
                </div>
                <div class="ps-row">
                    <span class="ps-label">{{ $t('business.max_employees') }}</span>
                    <span class="ps-value">{{ def.maxEmployeesBase }}</span>
                </div>
                <div class="ps-divider" />
                <div class="ps-row highlight">
                    <span class="ps-label">{{ $t('business.est_profit') }}</span>
                    <span class="ps-value" :class="profitPerSecond >= 0 ? 'text-success' : 'text-danger'">
                        {{ formatCash(profitPerSecond) }}/s
                    </span>
                </div>
                <div class="ps-row">
                    <span class="ps-label">{{ $t('business.est_margin') }}</span>
                    <span class="ps-value"
                        :class="margin >= 25 ? 'text-success' : margin >= 10 ? 'text-warning' : 'text-danger'">
                        {{ margin.toFixed(1) }}%
                    </span>
                </div>
            </div>

            <template #footer>
                <UButton variant="success" icon="mdi:cart-plus" class="buy-button" :disabled="!canAfford"
                    @click="openBuyDialog">
                    <span>{{ $t('common.buy') }} — {{ formatCash(def.purchasePrice) }}</span>
                </UButton>
            </template>
        </UCard>

        <!-- Buy dialog: choose name & icon -->
        <UModal v-model="showBuyDialog" :title="$t('business.customize_title')" icon="mdi:pencil-outline" size="sm">
            <div class="buy-dialog-body">
                <label class="buy-label">{{ $t('business.custom_name') }}</label>
                <input v-model="customName" type="text" class="buy-input" :placeholder="sizeName" maxlength="30" />

                <label class="buy-label icon-label">{{ $t('business.custom_icon') }}</label>
                <div class="icon-grid">
                    <button v-for="ic in ICON_CHOICES" :key="ic" class="icon-btn" :class="{ active: customIcon === ic }"
                        @click="customIcon = ic">
                        <AppIcon :icon="ic" />
                    </button>
                </div>
            </div>

            <template #footer>
                <div class="buy-dialog-footer">
                    <UButton variant="ghost" size="sm" @click="showBuyDialog = false">
                        {{ $t('common.cancel') }}
                    </UButton>
                    <UButton variant="success" size="sm" icon="mdi:cart-plus" @click="confirmBuy">
                        {{ $t('common.buy') }} — {{ formatCash(def.purchasePrice) }}
                    </UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>

<style scoped>
.purchase-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.biz-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.biz-icon {
    font-size: 1.1rem;
    color: var(--t-text-secondary);
}

.purchase-info {
    flex: 1;
}

.purchase-name {
    font-size: var(--t-font-size-base);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    margin: 0;
}

.purchase-price-tag {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    color: var(--t-gold);
    font-weight: var(--t-font-semibold);
}

/* ── ROI badge ── */
.roi-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    padding: 0.15rem 0.5rem;
    border-radius: var(--t-radius-pill);
    background: var(--t-bg-secondary);
    color: var(--t-text-muted);
    white-space: nowrap;
}

.roi-badge.fast {
    background: color-mix(in srgb, var(--t-success) 15%, transparent);
    color: var(--t-success);
}

.roi-badge.mid {
    background: color-mix(in srgb, var(--t-gold) 15%, transparent);
    color: var(--t-gold);
}

.roi-icon {
    font-size: 0.85rem;
}

/* ── Stats ── */
.purchase-stats {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.ps-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-xs);
}

.ps-row.highlight {
    padding-top: 0.15rem;
}

.ps-label {
    color: var(--t-text-muted);
}

.ps-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-text-secondary);
}

.ps-value.text-success {
    color: var(--t-success);
}

.ps-value.text-warning {
    color: var(--t-gold);
}

.ps-value.text-danger {
    color: var(--t-error);
}

.ps-divider {
    height: 1px;
    background: var(--t-border);
    margin: 0.2rem 0;
}

.buy-button {
    width: 100%;
}

.buy-button:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}

/* ── Buy dialog ── */
.buy-dialog-body {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.buy-label {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-medium);
    color: var(--t-text-secondary);
}

.buy-label.icon-label {
    margin-top: var(--t-space-2);
}

.buy-input {
    width: 100%;
    padding: var(--t-space-2) var(--t-space-3);
    border-radius: var(--t-radius-md);
    border: 1px solid var(--t-border);
    background: var(--t-bg-secondary);
    color: var(--t-text);
    font-size: var(--t-font-size-sm);
    outline: none;
    transition: border-color 0.15s;
}

.buy-input:focus {
    border-color: var(--t-accent);
}

.icon-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: var(--t-space-1);
}

.icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--t-radius-md);
    border: 2px solid transparent;
    background: var(--t-bg-secondary);
    color: var(--t-text-muted);
    cursor: pointer;
    transition: all 0.12s;
    font-size: 1.1rem;
}

.icon-btn:hover {
    background: var(--t-bg-tertiary);
    color: var(--t-text);
}

.icon-btn.active {
    border-color: var(--t-accent);
    background: color-mix(in srgb, var(--t-accent) 15%, transparent);
    color: var(--t-accent);
}

.buy-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--t-space-2);
}
</style>
