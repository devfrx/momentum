<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useJobStore } from '@renderer/stores/useJobStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'
import MultiplierStats from '@renderer/components/dashboard/MultiplierStats.vue'
import { JOBS } from '@renderer/data/jobs'
import Button from 'primevue/button'
import { EventImpactBanner } from '@renderer/components/events'

const player = usePlayerStore()
const jobStore = useJobStore()
const business = useBusinessStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const quickStats = computed(() => [
    { label: t('dashboard.net_worth'), value: formatCash(player.netWorth), icon: 'mdi:scale-balance' },
    { label: t('dashboard.biz_profit'), value: formatCash(business.profitPerSecond), icon: 'mdi:trending-up' },
    { label: t('dashboard.job_income'), value: formatCash(jobStore.totalJobIncomePerTick.mul(10)), icon: 'mdi:briefcase' },
    { label: t('dashboard.total_earned'), value: formatCash(player.totalCashEarned), icon: 'mdi:cash-multiple' },
    { label: t('dashboard.debt'), value: formatCash(player.totalDebt), icon: 'mdi:bank-transfer-out' },
    { label: t('dashboard.level'), value: `${player.level}`, icon: 'mdi:shield-crown' },
])

/** Jobs the player hasn't unlocked yet but qualifies for */
const availableJobs = computed(() =>
    JOBS.filter(j => !jobStore.unlockedJobs.find(uj => uj.defId === j.id))
)

function toggleJob(defId: string): void {
    const job = jobStore.unlockedJobs.find(j => j.defId === defId)
    if (!job) return
    if (job.active) {
        jobStore.stopJob(defId)
    } else {
        jobStore.startJob(defId)
    }
}
</script>

<template>
    <div class="dashboard">
        <!-- Event Impact -->
        <EventImpactBanner route-name="dashboard" />

        <!-- ═══ Hero Section ═══ -->
        <section class="hero-section">
            <div class="hero-left">
                <h1 class="hero-greeting">{{ $t('dashboard.title') }}</h1>
                <p class="hero-subtitle">{{ $t('dashboard.subtitle') }}</p>
            </div>
            <div class="hero-balance">
                <span class="hero-label">{{ $t('dashboard.current_balance') }}</span>
                <span class="hero-amount">{{ formatCash(player.cash) }}</span>
                <span class="hero-income">
                    <AppIcon icon="mdi:trending-up" class="hero-income-icon" />
                    +{{ formatCash(business.profitPerSecond) }}{{ $t('common.per_second') }}
                </span>
            </div>
        </section>

        <!-- ═══ Quick Stats Bar ═══ -->
        <section class="quick-stats">
            <div v-for="stat in quickStats" :key="stat.label" class="qs-item">
                <div class="qs-icon-wrap">
                    <AppIcon :icon="stat.icon" class="qs-icon" />
                </div>
                <div class="qs-text">
                    <span class="qs-value">{{ stat.value }}</span>
                    <span class="qs-label">{{ stat.label }}</span>
                </div>
            </div>
        </section>

        <!-- ═══ Two-Column Content ═══ -->
        <div class="dash-columns">
            <!-- Left: Jobs -->
            <section class="dash-panel jobs-panel">
                <h2 class="panel-heading">
                    <AppIcon icon="mdi:briefcase-outline" class="panel-icon" />
                    {{ $t('dashboard.jobs_heading') }}
                    <span class="panel-badge">{{ jobStore.activeJobCount }}/{{ jobStore.maxActiveJobs }}</span>
                </h2>

                <!-- Unlocked Jobs -->
                <div v-if="jobStore.unlockedJobs.length > 0" class="jobs-list">
                    <div v-for="uj in jobStore.unlockedJobs" :key="uj.id" class="job-row"
                        :class="{ active: uj.active }">
                        <AppIcon :icon="JOBS.find(j => j.id === uj.defId)?.icon || 'mdi:briefcase'" class="job-icon" />
                        <div class="job-info">
                            <span class="job-name">{{JOBS.find(j => j.id === uj.defId)?.name}}</span>
                            <span class="job-meta">{{ $t('dashboard.exp_level', { n: uj.experienceLevel }) }}</span>
                        </div>
                        <Button size="small" :severity="uj.active ? 'danger' : 'success'" @click="toggleJob(uj.defId)">
                            {{ uj.active ? $t('common.stop') : $t('common.start') }}
                        </Button>
                    </div>
                </div>

                <!-- Available to Unlock -->
                <div v-if="availableJobs.length > 0" class="unlock-section">
                    <h3 class="unlock-heading">{{ $t('dashboard.available_unlock') }}</h3>
                    <div class="jobs-list">
                        <div v-for="job in availableJobs" :key="job.id" class="job-row locked">
                            <AppIcon :icon="job.icon" class="job-icon" />
                            <div class="job-info">
                                <span class="job-name">{{ job.name }}</span>
                                <span class="job-meta">{{ job.description }}</span>
                            </div>
                            <Button size="small" :disabled="player.level < job.requiredLevel"
                                @click="jobStore.unlockJob(job.id)">
                                {{ job.requiredLevel > 0 && player.level < job.requiredLevel ?
                                    $t('dashboard.requires_level', { n: job.requiredLevel }) : $t('dashboard.apply') }}
                                    </Button>
                        </div>
                    </div>
                </div>

                <div v-if="jobStore.unlockedJobs.length === 0 && availableJobs.length === 0" class="empty-state">
                    <AppIcon icon="mdi:briefcase-off-outline" class="empty-icon" />
                    <span>No jobs available yet</span>
                </div>
            </section>

            <!-- Right: Multipliers -->
            <section class="dash-panel multi-panel">
                <MultiplierStats />
            </section>
        </div>
    </div>
</template>

<style scoped>
.dashboard {
    padding: var(--t-space-6);
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-5);
}

/* ═══ Hero Section ═══ */
.hero-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--t-space-4);
    flex-wrap: wrap;
}

.hero-left {
    flex: 1;
    min-width: 180px;
}

.hero-greeting {
    font-size: var(--t-font-size-2xl);
    font-weight: 700;
    color: var(--t-text);
    letter-spacing: -0.03em;
    margin: 0;
}

.hero-subtitle {
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    margin-top: 0.15rem;
}

.hero-balance {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: var(--t-space-4) var(--t-space-5);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    box-shadow: var(--t-shadow-sm);
    min-width: 200px;
}

.hero-label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--t-text-muted);
    font-weight: 600;
}

.hero-amount {
    font-family: var(--t-font-mono);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--t-text);
    letter-spacing: -0.02em;
    line-height: 1.2;
}

.hero-income {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-success);
    margin-top: 0.15rem;
}

.hero-income-icon {
    font-size: 0.7rem;
}

/* ═══ Quick Stats ═══ */
.quick-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
    gap: var(--t-space-3);
}

.qs-item {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.qs-item:hover {
    border-color: var(--t-border-hover);
    box-shadow: var(--t-shadow-md);
}

.qs-icon-wrap {
    width: 34px;
    height: 34px;
    border-radius: var(--t-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--t-bg-muted);
}

.qs-icon {
    font-size: 1.1rem;
    color: var(--t-text-secondary);
}

.qs-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.qs-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-base);
    font-weight: 700;
    color: var(--t-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.qs-label {
    font-size: var(--t-font-size-xs);
    font-weight: 500;
    letter-spacing: 0.03em;
    color: var(--t-text-muted);
    text-transform: uppercase;
}

/* ═══ Two-Column Layout ═══ */
.dash-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-5);
    flex: 1;
    min-height: 0;
}

.dash-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.panel-heading {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-lg);
    font-weight: 600;
    color: var(--t-text);
    margin-bottom: var(--t-space-3);
}

.panel-icon {
    color: var(--t-text-muted);
    font-size: 1.1rem;
}

.panel-badge {
    margin-left: auto;
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    color: var(--t-text-muted);
    background: var(--t-bg-muted);
    padding: 0.1rem 0.45rem;
    border-radius: var(--t-radius-sm);
}

/* ═══ Jobs ═══ */
.jobs-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.job-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    transition: border-color var(--t-transition-normal);
}

.job-row:hover {
    border-color: var(--t-border-hover);
}

.job-row.active {
    border-color: color-mix(in srgb, var(--t-success) 30%, var(--t-border));
}

.job-row.locked {
    opacity: 0.65;
}

.job-icon {
    font-size: 1.2rem;
    color: var(--t-text-secondary);
    flex-shrink: 0;
}

.job-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.job-name {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text);
}

.job-meta {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.unlock-section {
    margin-top: var(--t-space-4);
}

.unlock-heading {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text-secondary);
    margin-bottom: var(--t-space-2);
}

/* ═══ Empty State ═══ */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-8) var(--t-space-4);
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    gap: var(--t-space-2);
}

.empty-icon {
    font-size: 2rem;
    opacity: 0.4;
}

/* ═══ Responsive ═══ */
@media (max-width: 900px) {
    .dash-columns {
        grid-template-columns: 1fr;
    }
}
</style>
