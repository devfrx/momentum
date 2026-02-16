<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { useFormat } from '@renderer/composables/useFormat'

const props = defineProps<{
    name: string
    status: string
    statusSeverity: 'info' | 'success' | 'danger' | 'warn' | 'secondary'
    investedAmount: string
    successChance?: string
    returnMultiplier?: number
    completed?: boolean
    /** For active investments: current tick */
    currentTick?: number
    /** For active investments: tick when invested */
    investedAtTick?: number
    /** For active investments: total ticks until maturity */
    maturityTicks?: number
    /** For succeeded investments: formatted return amount */
    returnAmount?: string
}>()

const emit = defineEmits<{
    collect: []
}>()

const { formatTime } = useFormat()

/** Progress percentage (0-100) for active investments */
const progress = computed(() => {
    if (props.status !== 'active' || !props.currentTick || !props.investedAtTick || !props.maturityTicks) return 0
    const elapsed = props.currentTick - props.investedAtTick
    return Math.min(100, Math.max(0, (elapsed / props.maturityTicks) * 100))
})

/** Remaining time in human-readable format */
const remainingTime = computed(() => {
    if (props.status !== 'active' || !props.currentTick || !props.investedAtTick || !props.maturityTicks) return ''
    const remaining = Math.max(0, props.maturityTicks - (props.currentTick - props.investedAtTick))
    const remainingSeconds = remaining / 10 // 10 ticks per second
    return formatTime(remainingSeconds)
})
</script>

<template>
    <div class="item-card" :class="{
        'border-success': status === 'succeeded',
        'border-danger': status === 'failed',
        'border-exited': status === 'exited'
    }">
        <div class="item-card-header">
            <h3 class="item-card-name">{{ name }}</h3>
            <Tag :value="status" :severity="statusSeverity" />
        </div>

        <div class="item-card-stats">
            <span>{{ $t('investments.invested') }} <strong class="text-gold">{{ investedAmount }}</strong></span>
            <span v-if="status === 'active' && successChance">{{ $t('investments.success') }} <strong
                    class="text-sky">{{ successChance
                    }}</strong></span>
            <span v-if="returnMultiplier">{{ $t('investments.return_label') }} <strong class="text-emerald">{{
                returnMultiplier
                    }}x</strong></span>
        </div>

        <!-- Progress bar for active investments -->
        <div v-if="status === 'active'" class="progress-section">
            <div class="progress-info">
                <span class="progress-label">{{ $t('investments.maturity') }}</span>
                <span class="progress-time">{{ remainingTime }} {{ $t('investments.left') }}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-bar-fill" :style="{ width: progress + '%' }" />
            </div>
            <span class="progress-pct">{{ progress.toFixed(0) }}%</span>
        </div>

        <!-- Result for succeeded investments -->
        <div v-if="status === 'succeeded'" class="result-section success-result">
            <p class="result-text">{{ $t('investments.succeeded') }}</p>
            <p v-if="returnAmount" class="result-amount">{{ $t('investments.returns') }} <strong>{{ returnAmount
            }}</strong></p>
            <Button :label="$t('investments.collect_returns')" severity="success" icon="pi pi-wallet" size="small"
                @click="$emit('collect')" class="collect-btn" />
        </div>

        <!-- Result for failed investments -->
        <div v-if="status === 'failed'" class="result-section failed-result">
            <p class="result-text">{{ $t('investments.failed') }}</p>
        </div>

        <!-- Exited (already collected) -->
        <div v-if="status === 'exited'" class="result-section exited-result">
            <span class="text-emerald">{{ $t('investments.exited', { multiplier: returnMultiplier }) }}</span>
        </div>
    </div>
</template>

<style scoped>
.border-exited {
    border-color: var(--t-border) !important;
    opacity: 0.7;
}

.progress-section {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin-top: var(--t-space-2);
}

.progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.progress-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.progress-time {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

.progress-bar {
    height: 6px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background: var(--t-info);
    border-radius: var(--t-radius-sm);
    transition: width 0.3s ease;
}

.progress-pct {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-align: right;
}

.result-section {
    margin-top: var(--t-space-2);
    padding: var(--t-space-2) var(--t-space-3);
    border-radius: var(--t-radius-md);
}

.success-result {
    background: color-mix(in srgb, var(--t-success) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--t-success) 20%, transparent);
}

.failed-result {
    background: color-mix(in srgb, var(--t-danger) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--t-danger) 20%, transparent);
}

.exited-result {
    background: var(--t-bg-secondary);
}

.result-text {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    margin-bottom: var(--t-space-1);
}

.success-result .result-text {
    color: var(--t-success);
}

.failed-result .result-text {
    color: var(--t-danger);
}

.result-amount {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
    margin-bottom: var(--t-space-2);
}

.collect-btn {
    width: 100%;
}
</style>
