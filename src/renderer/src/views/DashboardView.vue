<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useJobStore } from '@renderer/stores/useJobStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { useDepositStore } from '@renderer/stores/useDepositStore'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { useBankingStore } from '@renderer/stores/useBankingStore'
import { useFormat } from '@renderer/composables/useFormat'
import { ZERO, add, sub } from '@renderer/core/BigNum'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UAccordion, UButton } from '@renderer/components/ui'
import MultiplierStats from '@renderer/components/dashboard/MultiplierStats.vue'
import BankCard from '@renderer/components/dashboard/BankCard.vue'
import TransactionList from '@renderer/components/dashboard/TransactionList.vue'
import AccountSummary from '@renderer/components/dashboard/AccountSummary.vue'
import ChipExchange from '@renderer/components/dashboard/ChipExchange.vue'
import AtmTerminal from '@renderer/components/dashboard/AtmTerminal.vue'
import { JOBS } from '@renderer/data/jobs'
import { EventImpactBanner } from '@renderer/components/events'

const player = usePlayerStore()
const jobStore = useJobStore()
const business = useBusinessStore()
const realEstate = useRealEstateStore()
const deposits = useDepositStore()
const loans = useLoanStore()
const banking = useBankingStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const scrollContainer = ref<HTMLElement | null>(null)
const parallaxY = ref(0)
let scrollParent: HTMLElement | null = null

function onScroll(): void {
    if (!scrollParent) return
    parallaxY.value = scrollParent.scrollTop
}

onMounted(() => {
    scrollParent = document.querySelector('.app-content') as HTMLElement | null
    if (scrollParent) {
        scrollParent.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
    }
})

onBeforeUnmount(() => {
    if (scrollParent) {
        scrollParent.removeEventListener('scroll', onScroll)
        scrollParent = null
    }
})

const totalIncomePerSecond = computed(() => {
    let total = ZERO
    total = add(total, business.profitPerSecond)
    total = add(total, jobStore.jobIncomePerSecond)
    total = add(total, realEstate.rentPerSecond)
    total = add(total, deposits.interestPerSecond)
    total = sub(total, loans.totalInterestPerSecond)
    return total
})

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
    <div ref="scrollContainer" class="dashboard banking-app">
        <!-- Event Impact -->
        <EventImpactBanner route-name="dashboard" />

        <!-- ═══ Hero: Parallax Bank Card ═══ -->
        <section class="hero-section">
            <!-- Parallax background layers -->
            <div class="hero-bg">
                <div class="hero-bg-grid" :style="{ transform: `translateY(${parallaxY * 0.35}px)` }" />
                <div class="hero-bg-glow hero-bg-glow--1"
                    :style="{ transform: `translate(${parallaxY * 0.18}px, ${parallaxY * 0.25}px)` }" />
                <div class="hero-bg-glow hero-bg-glow--2"
                    :style="{ transform: `translate(${parallaxY * -0.12}px, ${parallaxY * 0.2}px)` }" />
                <div class="hero-bg-glow hero-bg-glow--3"
                    :style="{ transform: `translate(${parallaxY * 0.08}px, ${parallaxY * -0.15}px)` }" />
                <div class="hero-bg-dots" :style="{ transform: `translateY(${parallaxY * 0.12}px)` }" />
            </div>

            <!-- Hero foreground content -->
            <div class="hero-content">
                <!-- Compact header row -->
                <div class="hero-header">
                    <div class="hero-header-left">
                        <div class="bank-logo-header">
                            <!-- <AppIcon icon="mdi:credit-card-fast-outline" class="bank-header-icon" />
                            <span class="bank-header-name">FINANX</span> -->
                        </div>
                        <!-- <h1 class="banking-greeting">{{ $t('banking.welcome') }}</h1> -->
                        <!-- <p class="banking-subtitle">{{ $t('banking.subtitle') }}</p> -->
                    </div>
                    <!-- <div class="hero-flow-pill" :class="{ negative: totalIncomePerSecond.lt(0) }">
                        <AppIcon :icon="totalIncomePerSecond.gte(0) ? 'mdi:trending-up' : 'mdi:trending-down'"
                            class="pill-flow-icon" />
                        <span class="pill-flow-value">
                            {{ totalIncomePerSecond.gte(0) ? '+' : '' }}{{ formatCash(totalIncomePerSecond) }}{{
                                $t('common.per_second') }}
                        </span>
                    </div> -->
                </div>

                <!-- Card: centered, full-width hero -->
                <div class="hero-card-wrapper">
                    <BankCard />
                </div>
            </div>

            <!-- Bottom fade -->
            <div class="hero-fade" />
        </section>

        <!-- ═══ Account Overview ═══ -->
        <section class="banking-section">
            <AccountSummary />
        </section>

        <!-- ═══ Bottom Grid: Transactions + Side Panel ═══ -->
        <div class="bottom-grid">
            <!-- Transactions (wider) -->
            <section class="banking-section bottom-primary">
                <TransactionList />
            </section>

            <!-- Side: Multipliers + Jobs -->
            <div class="bottom-side">
                <!-- Multipliers -->
                <section class="banking-section">
                    <MultiplierStats />
                </section>

                <!-- ATM Terminal -->
                <section class="banking-section">
                    <AtmTerminal />
                </section>

                <!-- Casino Chip Exchange -->
                <section class="banking-section">
                    <ChipExchange />
                </section>

                <!-- Jobs -->
                <section class="banking-section">
                    <h2 class="section-heading">
                        <AppIcon icon="mdi:briefcase-outline" class="section-icon" />
                        {{ $t('dashboard.jobs_heading') }}
                        <span class="section-badge">{{ jobStore.activeJobCount }}/{{ jobStore.maxActiveJobs }}</span>
                    </h2>

                    <div v-if="jobStore.unlockedJobs.length > 0" class="jobs-list">
                        <div v-for="uj in jobStore.unlockedJobs" :key="uj.id" class="job-row"
                            :class="{ active: uj.active }">
                            <AppIcon :icon="JOBS.find(j => j.id === uj.defId)?.icon || 'mdi:briefcase'"
                                class="job-icon" />
                            <div class="job-info">
                                <span class="job-name">{{JOBS.find(j => j.id === uj.defId)?.name}}</span>
                                <span class="job-meta">{{ $t('dashboard.exp_level', { n: uj.experienceLevel }) }}</span>
                            </div>
                            <UButton size="sm" :variant="uj.active ? 'danger' : 'success'" @click="toggleJob(uj.defId)">
                                {{ uj.active ? $t('common.stop') : $t('common.start') }}
                            </UButton>
                        </div>
                    </div>

                    <UAccordion v-if="availableJobs.length > 0" :title="$t('dashboard.available_unlock')"
                        icon="mdi:lock-open-outline" :badge="availableJobs.length" variant="muted" compact>
                        <div class="jobs-list">
                            <div v-for="job in availableJobs" :key="job.id" class="job-row locked">
                                <AppIcon :icon="job.icon" class="job-icon" />
                                <div class="job-info">
                                    <span class="job-name">{{ job.name }}</span>
                                    <span class="job-meta">{{ job.description }}</span>
                                </div>
                                <UButton variant="primary" size="sm" :disabled="player.level < job.requiredLevel"
                                    @click="jobStore.unlockJob(job.id)">
                                    {{ job.requiredLevel > 0 && player.level < job.requiredLevel ?
                                        $t('dashboard.requires_level', { n: job.requiredLevel }) : $t('dashboard.apply')
                                        }} </UButton>
                            </div>
                        </div>
                    </UAccordion>

                    <div v-if="jobStore.unlockedJobs.length === 0 && availableJobs.length === 0" class="empty-state">
                        <AppIcon icon="mdi:briefcase-off-outline" class="empty-icon" />
                        <span>{{ $t('banking.no_jobs') }}</span>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard.banking-app {
    padding: 0;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-6);
}

/* ═══ Hero Section — Full-bleed parallax ═══ */
.hero-section {
    position: relative;
    overflow: hidden;
    background: linear-gradient(165deg, var(--t-bg-sidebar) 0%, var(--t-bg-elevated) 50%, var(--t-bg-base) 100%);
    border-bottom: 1px solid color-mix(in srgb, var(--t-accent) 8%, transparent);
}

/* Parallax grid layer */
.hero-bg {
    position: absolute;
    inset: -60px;
    pointer-events: none;
    z-index: 0;
}

.hero-bg-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(color-mix(in srgb, var(--t-accent) 4%, transparent) 1px, transparent 1px),
        linear-gradient(90deg, color-mix(in srgb, var(--t-accent) 4%, transparent) 1px, transparent 1px);
    background-size: 48px 48px;
    will-change: transform;
}

/* Glowing orbs at different parallax speeds */
.hero-bg-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    will-change: transform;
}

.hero-bg-glow--1 {
    width: 400px;
    height: 400px;
    top: -120px;
    right: -60px;
    background: radial-gradient(circle, color-mix(in srgb, var(--t-accent) 14%, transparent) 0%, transparent 70%);
}

.hero-bg-glow--2 {
    width: 300px;
    height: 300px;
    bottom: -80px;
    left: -40px;
    background: radial-gradient(circle, color-mix(in srgb, var(--t-purple) 10%, transparent) 0%, transparent 70%);
}

.hero-bg-glow--3 {
    width: 200px;
    height: 200px;
    top: 40%;
    left: 55%;
    background: radial-gradient(circle, color-mix(in srgb, var(--t-accent) 8%, transparent) 0%, transparent 70%);
}

/* Decorative dot pattern */
.hero-bg-dots {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, color-mix(in srgb, var(--t-text) 3%, transparent) 1px, transparent 1px);
    background-size: 24px 24px;
    background-position: 12px 12px;
    will-change: transform;
}

/* Foreground content */
.hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-5);
    padding: var(--t-space-8) var(--t-space-6) var(--t-space-6);
}

/* Bottom gradient fade from hero to normal bg */
.hero-fade {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(to bottom, transparent, var(--t-bg-base));
    z-index: 1;
    pointer-events: none;
}

.hero-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    gap: var(--t-space-4);
    flex-wrap: wrap;
}

.hero-header-left {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.bank-logo-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: var(--t-space-1);
}

.bank-header-icon {
    font-size: 1rem;
    color: var(--t-accent);
}

.bank-header-name {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--t-text-muted);
}

.banking-greeting {
    font-size: var(--t-font-size-2xl);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
    letter-spacing: -0.03em;
    margin: 0;
    line-height: 1.2;
}

.banking-subtitle {
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    margin-top: 0.15rem;
}

.hero-flow-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: var(--t-space-2) var(--t-space-4);
    background: color-mix(in srgb, var(--t-accent) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--t-accent) 18%, transparent);
    border-radius: var(--t-radius-lg);
    flex-shrink: 0;
    backdrop-filter: blur(8px);
}

.hero-flow-pill.negative {
    background: color-mix(in srgb, var(--t-danger) 8%, transparent);
    border-color: color-mix(in srgb, var(--t-danger) 20%, transparent);
}

.pill-flow-icon {
    font-size: 0.9rem;
    color: var(--t-success);
}

.hero-flow-pill.negative .pill-flow-icon {
    color: var(--t-danger);
}

.pill-flow-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-success);
}

.hero-flow-pill.negative .pill-flow-value {
    color: var(--t-danger);
}

.hero-card-wrapper {
    width: 100%;
    max-width: 620px;
    display: flex;
    justify-content: center;
}

/* ═══ Content below hero ═══ */
.banking-section {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding-left: var(--t-space-6);
    padding-right: var(--t-space-6);
}

/* ═══ Bottom Grid ═══ */
.bottom-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: var(--t-space-5);
    flex: 1;
    min-height: 0;
    padding: 0 var(--t-space-6) var(--t-space-6);
}

.bottom-primary {
    min-height: 0;
    padding: 0;
}

.bottom-side {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-5);
    min-height: 0;
}

.bottom-side .banking-section {
    padding: 0;
}

/* ═══ Section Headings ═══ */
.section-heading {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-lg);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    margin-bottom: var(--t-space-3);
}

.section-icon {
    color: var(--t-text-muted);
    font-size: 1.1rem;
}

.section-badge {
    margin-left: auto;
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
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
    font-size: 1.1rem;
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
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}

.job-meta {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    .hero-content {
        padding: var(--t-space-6) var(--t-space-4) var(--t-space-4);
    }

    .hero-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .bottom-grid {
        grid-template-columns: 1fr;
    }
}
</style>
