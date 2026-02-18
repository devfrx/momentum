<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { THEME } from '@renderer/assets/theme/colors'

const loanStore = useLoanStore()

const scoreColor = computed(() => {
    const score = loanStore.creditScore
    if (score >= 80) return 'var(--t-success)'
    if (score >= 60) return THEME.cyan
    if (score >= 40) return 'var(--t-warning)'
    if (score >= 20) return THEME.orange
    return 'var(--t-danger)'
})

const scoreLabel = computed(() => {
    const score = loanStore.creditScore
    if (score >= 80) return 'loans.score_excellent'
    if (score >= 60) return 'loans.score_good'
    if (score >= 40) return 'loans.score_fair'
    if (score >= 20) return 'loans.score_poor'
    return 'loans.score_very_poor'
})

const healthColor = computed(() => {
    const health = loanStore.portfolioHealth
    switch (health) {
        case 'excellent': return 'var(--t-success)'
        case 'good': return THEME.cyan
        case 'fair': return 'var(--t-warning)'
        case 'poor': return THEME.orange
        case 'critical': return 'var(--t-danger)'
    }
})

const factors = computed(() => loanStore.creditScoreFactors)

/** Credit score breakdown as an array for iteration */
const factorList = computed(() => [
    { key: 'paymentHistory', icon: 'mdi:calendar-check', label: 'loans.payment_history', value: factors.value.paymentHistory, max: 35 },
    { key: 'creditUtilization', icon: 'mdi:chart-pie', label: 'loans.credit_utilization', value: factors.value.creditUtilization, max: 30 },
    { key: 'creditAge', icon: 'mdi:clock-outline', label: 'loans.credit_age', value: factors.value.creditAge, max: 15 },
    { key: 'creditMix', icon: 'mdi:view-list', label: 'loans.credit_mix', value: factors.value.creditMix, max: 10 },
    { key: 'newCredit', icon: 'mdi:file-document-plus', label: 'loans.new_credit', value: factors.value.newCredit, max: 10 },
])

/** SVG arc for score gauge */
const gaugeArc = computed(() => {
    const score = loanStore.creditScore
    const pct = Math.min(score / 100, 1)
    const r = 54
    const circumference = 2 * Math.PI * r
    return {
        dasharray: circumference,
        dashoffset: circumference * (1 - pct),
        r,
    }
})

/** Utilization bar color */
const utilColor = computed(() => {
    const u = loanStore.creditUtilization
    if (u > 80) return 'var(--t-danger)'
    if (u > 50) return 'var(--t-warning)'
    return 'var(--t-success)'
})
</script>

<template>
    <div class="csw">
        <!-- Score Gauge -->
        <div class="csw-gauge">
            <svg viewBox="0 0 120 120" class="csw-ring">
                <circle cx="60" cy="60" :r="gaugeArc.r" fill="none" stroke="var(--t-border)" stroke-width="5" />
                <circle cx="60" cy="60" :r="gaugeArc.r" fill="none" :stroke="scoreColor" stroke-width="5"
                    stroke-linecap="round" :stroke-dasharray="gaugeArc.dasharray"
                    :stroke-dashoffset="gaugeArc.dashoffset" class="csw-ring-progress" />
            </svg>
            <div class="csw-score-inner">
                <span class="csw-score-num" :style="{ color: scoreColor }">{{ loanStore.creditScore }}</span>
                <span class="csw-score-label">{{ $t(scoreLabel) }}</span>
            </div>
        </div>

        <!-- Factor Breakdown -->
        <div class="csw-factors">
            <div v-for="f in factorList" :key="f.key" class="csw-factor">
                <div class="csw-factor-header">
                    <AppIcon :icon="f.icon" class="csw-factor-icon" />
                    <span class="csw-factor-name">{{ $t(f.label) }}</span>
                    <span class="csw-factor-val">{{ Math.round(f.value) }}<span class="csw-factor-max">/{{ f.max
                    }}</span></span>
                </div>
                <div class="csw-factor-track">
                    <div class="csw-factor-fill" :style="{ width: (f.value / f.max * 100) + '%' }" />
                </div>
            </div>
        </div>

        <!-- Utilization & Health footer -->
        <div class="csw-footer">
            <div class="csw-util">
                <div class="csw-util-header">
                    <span class="csw-util-label">{{ $t('loans.debt_ratio') }}</span>
                    <span class="csw-util-pct" :style="{ color: utilColor }">{{ Math.round(loanStore.creditUtilization)
                    }}%</span>
                </div>
                <div class="csw-util-track">
                    <div class="csw-util-fill"
                        :style="{ width: Math.min(loanStore.creditUtilization, 100) + '%', background: utilColor }" />
                </div>
            </div>
            <div class="csw-health">
                <span class="csw-health-dot" :style="{ background: healthColor }" />
                <span class="csw-health-text">{{ $t('loans.portfolio_health') }}</span>
                <strong class="csw-health-val" :style="{ color: healthColor }">{{ loanStore.portfolioHealth }}</strong>
            </div>
        </div>
    </div>
</template>

<style scoped>
.csw {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-5);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
}

/* ── Score Gauge ── */
.csw-gauge {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto;
}

.csw-ring {
    width: 100%;
    height: 100%;
}

.csw-score-inner {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.csw-score-num {
    font-size: 2rem;
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
    line-height: 1;
}

.csw-score-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin-top: 2px;
    text-transform: capitalize;
}

/* ── Factor Breakdown ── */
.csw-factors {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.csw-factor-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
}

.csw-factor-icon {
    font-size: 0.8rem;
    color: var(--t-text-muted);
    flex-shrink: 0;
}

.csw-factor-name {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.csw-factor-val {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    color: var(--t-text);
    flex-shrink: 0;
}

.csw-factor-max {
    color: var(--t-text-muted);
}

.csw-factor-track {
    height: 3px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-xs);
    overflow: hidden;
}

.csw-factor-fill {
    height: 100%;
    background: var(--t-accent);
    border-radius: var(--t-radius-xs);
    transition: width 0.4s ease;
}

/* ── Utilization & Health Footer ── */
.csw-footer {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    padding-top: var(--t-space-3);
    border-top: 1px solid var(--t-border);
}

.csw-util-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.csw-util-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.csw-util-pct {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
}

.csw-util-track {
    height: 4px;
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-xs);
    overflow: hidden;
}

.csw-util-fill {
    height: 100%;
    border-radius: var(--t-radius-xs);
    transition: width 0.4s ease, background var(--t-transition-normal) ease;
}

.csw-health {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--t-font-size-xs);
}

.csw-health-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--t-radius-full);
    flex-shrink: 0;
}

.csw-health-text {
    color: var(--t-text-muted);
}

.csw-health-val {
    margin-left: auto;
    text-transform: capitalize;
}

.csw-ring-progress {
    transform: rotate(-90deg);
    transform-origin: center;
    transition: stroke-dashoffset 0.6s ease;
}
</style>
