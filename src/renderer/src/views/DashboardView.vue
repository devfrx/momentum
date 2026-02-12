<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useJobStore } from '@renderer/stores/useJobStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useFormat } from '@renderer/composables/useFormat'
import AppIcon from '@renderer/components/AppIcon.vue'
import { CashDisplay, StatCard, MultiplierStats } from '@renderer/components/dashboard'
import { JOBS } from '@renderer/data/jobs'
import Button from 'primevue/button'

const player = usePlayerStore()
const jobStore = useJobStore()
const business = useBusinessStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const stats = computed(() => [
    { label: t('dashboard.net_worth'), value: formatCash(player.netWorth), icon: 'mdi:scale-balance', colorClass: 'stat-default' },
    { label: t('dashboard.biz_profit'), value: formatCash(business.profitPerSecond), icon: 'mdi:trending-up', colorClass: 'stat-default' },
    { label: t('dashboard.job_income'), value: formatCash(jobStore.totalJobIncomePerTick.mul(10)), icon: 'mdi:briefcase', colorClass: 'stat-default' },
    { label: t('dashboard.total_earned'), value: formatCash(player.totalCashEarned), icon: 'mdi:cash-multiple', colorClass: 'stat-default' },
    { label: t('dashboard.debt'), value: formatCash(player.totalDebt), icon: 'mdi:bank-transfer-out', colorClass: 'stat-default' },
    { label: t('dashboard.level'), value: `${player.level}`, icon: 'mdi:shield-crown', colorClass: 'stat-default' },
])

/** Jobs the player hasn't unlocked yet */
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
        <!-- Header -->
        <div class="dash-header">
            <div>
                <h1 class="dash-title">{{ $t('dashboard.title') }}</h1>
                <p class="dash-subtitle">{{ $t('dashboard.subtitle') }}</p>
            </div>
            <CashDisplay :label="$t('dashboard.current_balance')" :value="formatCash(player.cash)" />
        </div>

        <!-- Stats Grid -->
        <div class="stats-section">
            <h2 class="section-heading">
                <AppIcon icon="mdi:chart-box-outline" class="section-icon" />
                {{ $t('dashboard.key_metrics') }}
            </h2>

            <div class="stats-grid">
                <StatCard v-for="stat in stats" :key="stat.label" :label="stat.label" :value="stat.value"
                    :icon="stat.icon" :color-class="stat.colorClass" />
            </div>
        </div>

        <!-- Multipliers Section -->
        <MultiplierStats />

        <!-- Jobs / Gig Section -->
        <div class="jobs-section">
            <h2 class="section-heading">
                <AppIcon icon="mdi:briefcase-outline" class="section-icon" />
                {{ $t('dashboard.jobs_heading') }}
                <span class="job-count">({{ $t('dashboard.active_jobs', {
                    current: jobStore.activeJobCount, max:
                        jobStore.maxActiveJobs }) }})</span>
            </h2>

            <!-- Unlocked Jobs -->
            <div v-if="jobStore.unlockedJobs.length > 0" class="jobs-grid">
                <div v-for="uj in jobStore.unlockedJobs" :key="uj.id" class="job-card" :class="{ active: uj.active }">
                    <div class="job-header">
                        <AppIcon :icon="JOBS.find(j => j.id === uj.defId)?.icon || 'mdi:briefcase'" class="job-icon" />
                        <div>
                            <h4 class="job-name">{{JOBS.find(j => j.id === uj.defId)?.name}}</h4>
                            <span class="job-xp">{{ $t('dashboard.exp_level', { n: uj.experienceLevel }) }}</span>
                        </div>
                    </div>
                    <Button size="small" :severity="uj.active ? 'danger' : 'success'" @click="toggleJob(uj.defId)">
                        {{ uj.active ? $t('common.stop') : $t('common.start') }}
                    </Button>
                </div>
            </div>

            <!-- Available to Unlock -->
            <div v-if="availableJobs.length > 0" class="unlock-section">
                <h3 class="unlock-heading">{{ $t('dashboard.available_unlock') }}</h3>
                <div class="jobs-grid">
                    <div v-for="job in availableJobs" :key="job.id" class="job-card locked">
                        <div class="job-header">
                            <AppIcon :icon="job.icon" class="job-icon" />
                            <div>
                                <h4 class="job-name">{{ job.name }}</h4>
                                <p class="job-desc">{{ job.description }}</p>
                            </div>
                        </div>
                        <Button size="small" :disabled="!player.canAfford(job.unlockCost)"
                            @click="jobStore.unlockJob(job.id)">
                            {{ job.unlockCost.gt(0) ? $t('dashboard.unlock_cost', { cost: formatCash(job.unlockCost) })
                                : $t('dashboard.unlock_free') }}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard {
    padding: var(--t-space-6);
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-6);
}

.dash-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--t-space-4);
}

.dash-title {
    font-size: var(--t-font-size-2xl);
    font-weight: 700;
    color: var(--t-text);
    letter-spacing: -0.02em;
}

.dash-subtitle {
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    margin-top: 0.1rem;
}

.stats-section,
.jobs-section {
    flex: 1;
}

.section-heading {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-lg);
    font-weight: 600;
    color: var(--t-text);
    margin-bottom: var(--t-space-4);
}

.section-icon {
    color: var(--t-text-muted);
    font-size: 1.1rem;
}

.job-count {
    font-size: var(--t-font-size-sm);
    font-weight: 400;
    color: var(--t-text-muted);
    margin-left: var(--t-space-2);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--t-space-4);
}

.jobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--t-space-3);
}

.job-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    box-shadow: var(--t-shadow-sm);
    transition: border-color var(--t-transition-normal), box-shadow var(--t-transition-normal);
}

.job-card.locked {
    opacity: 0.7;
}

.job-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.job-icon {
    font-size: 1.3rem;
    color: var(--t-text-secondary);
}

.job-name {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text);
}

.job-xp {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.job-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0;
}

.unlock-section {
    margin-top: var(--t-space-4);
}

.unlock-heading {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text-secondary);
    margin-bottom: var(--t-space-3);
}
</style>
