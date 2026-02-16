<script setup lang="ts">
/**
 * BlackMarketView — Main view for the Underground Market feature.
 * Tabbed layout: Deals, Contacts, Stats.
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { CashDisplay } from '@renderer/components/dashboard'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import {
    DealGrid,
    ContactPanel,
    ReputationBar,
    HeatMeter,
    InvestigationAlert,
    ActiveEffects,
    BlackMarketStats,
    ActivityLog,
} from '@renderer/components/blackmarket'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { useNotify } from '@renderer/composables/useNotify'

const bm = useBlackMarketStore()
const player = usePlayerStore()
const { formatCash } = useFormat()
const { t } = useI18n()
const { error: notifyError, warning: notifyWarning } = useNotify()

type ViewTab = 'deals' | 'contacts' | 'stats'
const activeTab = ref<ViewTab>('deals')

const tabs = computed(() => [
    { id: 'deals' as ViewTab, label: t('blackmarket.tab_deals'), icon: 'mdi:skull-crossbones', count: bm.availableDeals.length },
    { id: 'contacts' as ViewTab, label: t('blackmarket.tab_contacts'), icon: 'mdi:account-group', count: bm.unlockedContacts.length },
    { id: 'stats' as ViewTab, label: t('blackmarket.tab_stats'), icon: 'mdi:chart-box' },
])

function handleDealAccepted(_dealId: string, _success: boolean, _message: string): void {
    // Activity log in the store handles all deal feedback
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleAbilityUsed(_contactId: string, _abilityId: string, response: unknown): void {
    // Activity log in the store handles success/failure logging.
    // Only show a toast for critical betrayal/scam events.
    const resp = response as { success: boolean; message: string; result?: Record<string, unknown> }

    if (resp.message === 'betrayed') {
        notifyError(t('blackmarket.notify_betrayed'))
        return
    }
    if (resp.message === 'scammed') {
        notifyWarning(t('blackmarket.notify_scammed'))
        return
    }

    if (!resp.success && resp.message !== 'ability_used') {
        notifyWarning(t(`blackmarket.notify_${resp.message}`))
    }
}

// ─── Info panel sections ─────────────────────────────────────
const infoSections = computed(() => [
    {
        title: t('blackmarket.info_deals_title'),
        icon: 'mdi:handshake',
        entries: [
            { term: t('blackmarket.info_deals_rotation'), desc: t('blackmarket.info_deals_rotation_desc'), icon: 'mdi:timer-sand' },
            { term: t('blackmarket.info_deals_pool'), desc: t('blackmarket.info_deals_pool_desc'), icon: 'mdi:view-grid' },
            { term: t('blackmarket.info_deals_risk'), desc: t('blackmarket.info_deals_risk_desc'), icon: 'mdi:dice-multiple' },
            { term: t('blackmarket.info_deals_heat_success'), desc: t('blackmarket.info_deals_heat_success_desc'), icon: 'mdi:fire' },
            { term: t('blackmarket.info_deals_heat_fail'), desc: t('blackmarket.info_deals_heat_fail_desc'), icon: 'mdi:fire-alert' },
            { term: t('blackmarket.info_deals_xp_fail'), desc: t('blackmarket.info_deals_xp_fail_desc'), icon: 'mdi:star-half-full' },
            { term: t('blackmarket.info_deals_categories'), desc: t('blackmarket.info_deals_categories_desc'), icon: 'mdi:folder-multiple' },
        ],
    },
    {
        title: t('blackmarket.info_heat_title'),
        icon: 'mdi:fire',
        entries: [
            { term: t('blackmarket.info_heat_max'), desc: t('blackmarket.info_heat_max_desc'), icon: 'mdi:thermometer' },
            { term: t('blackmarket.info_heat_lv0'), desc: t('blackmarket.info_heat_lv0_desc'), icon: 'mdi:shield-check' },
            { term: t('blackmarket.info_heat_lv1'), desc: t('blackmarket.info_heat_lv1_desc'), icon: 'mdi:alert-circle-outline' },
            { term: t('blackmarket.info_heat_lv2'), desc: t('blackmarket.info_heat_lv2_desc'), icon: 'mdi:alert' },
            { term: t('blackmarket.info_heat_lv3'), desc: t('blackmarket.info_heat_lv3_desc'), icon: 'mdi:fire' },
            { term: t('blackmarket.info_heat_lv4'), desc: t('blackmarket.info_heat_lv4_desc'), icon: 'mdi:fire-alert' },
            { term: t('blackmarket.info_heat_lv5'), desc: t('blackmarket.info_heat_lv5_desc'), icon: 'mdi:skull-crossbones' },
            { term: t('blackmarket.info_heat_inv_check'), desc: t('blackmarket.info_heat_inv_check_desc'), icon: 'mdi:shield-alert' },
        ],
    },
    {
        title: t('blackmarket.info_rep_title'),
        icon: 'mdi:star-circle',
        entries: [
            { term: t('blackmarket.info_rep_overview'), desc: t('blackmarket.info_rep_overview_desc'), icon: 'mdi:information' },
            { term: t('blackmarket.info_rep_t0'), desc: t('blackmarket.info_rep_t0_desc'), icon: 'mdi:eye-off' },
            { term: t('blackmarket.info_rep_t1'), desc: t('blackmarket.info_rep_t1_desc'), icon: 'mdi:account-question' },
            { term: t('blackmarket.info_rep_t2'), desc: t('blackmarket.info_rep_t2_desc'), icon: 'mdi:account-check' },
            { term: t('blackmarket.info_rep_t3'), desc: t('blackmarket.info_rep_t3_desc'), icon: 'mdi:shield-account' },
            { term: t('blackmarket.info_rep_t4'), desc: t('blackmarket.info_rep_t4_desc'), icon: 'mdi:star-face' },
            { term: t('blackmarket.info_rep_t5'), desc: t('blackmarket.info_rep_t5_desc'), icon: 'mdi:crown' },
        ],
    },
    {
        title: t('blackmarket.info_contacts_title'),
        icon: 'mdi:account-group',
        entries: [
            { term: t('blackmarket.info_contacts_overview'), desc: t('blackmarket.info_contacts_overview_desc'), icon: 'mdi:account-tie' },
            { term: t('blackmarket.info_contacts_loyalty_gain'), desc: t('blackmarket.info_contacts_loyalty_gain_desc'), icon: 'mdi:heart-plus' },
            { term: t('blackmarket.info_contacts_loyalty_recovery'), desc: t('blackmarket.info_contacts_loyalty_recovery_desc'), icon: 'mdi:timer-outline' },
            { term: t('blackmarket.info_contacts_heat'), desc: t('blackmarket.info_contacts_heat_desc'), icon: 'mdi:fire' },
            { term: t('blackmarket.info_contacts_daily'), desc: t('blackmarket.info_contacts_daily_desc'), icon: 'mdi:calendar-clock' },
        ],
    },
    {
        title: t('blackmarket.info_betrayal_title'),
        icon: 'mdi:account-alert',
        entries: [
            { term: t('blackmarket.info_betrayal_formula'), desc: t('blackmarket.info_betrayal_formula_desc'), icon: 'mdi:knife' },
            { term: t('blackmarket.info_scam_formula'), desc: t('blackmarket.info_scam_formula_desc'), icon: 'mdi:account-cancel' },
            { term: t('blackmarket.info_betrayal_trust'), desc: t('blackmarket.info_betrayal_trust_desc'), icon: 'mdi:shield-alert' },
            { term: t('blackmarket.info_betrayal_roll'), desc: t('blackmarket.info_betrayal_roll_desc'), icon: 'mdi:dice-multiple' },
        ],
    },
    {
        title: t('blackmarket.info_scaling_title'),
        icon: 'mdi:chart-line',
        entries: [
            { term: t('blackmarket.info_scaling_formula'), desc: t('blackmarket.info_scaling_formula_desc'), icon: 'mdi:function-variant' },
            { term: t('blackmarket.info_scaling_caps'), desc: t('blackmarket.info_scaling_caps_desc'), icon: 'mdi:arrow-collapse-up' },
            { term: t('blackmarket.info_scaling_flat'), desc: t('blackmarket.info_scaling_flat_desc'), icon: 'mdi:equal' },
        ],
    },
    {
        title: t('blackmarket.info_inv_title'),
        icon: 'mdi:shield-search',
        entries: [
            { term: t('blackmarket.info_inv_trigger'), desc: t('blackmarket.info_inv_trigger_desc'), icon: 'mdi:alert-octagon' },
            { term: t('blackmarket.info_inv_severity'), desc: t('blackmarket.info_inv_severity_desc'), icon: 'mdi:signal-cellular-3' },
            { term: t('blackmarket.info_inv_duration'), desc: t('blackmarket.info_inv_duration_desc'), icon: 'mdi:timer-sand' },
            { term: t('blackmarket.info_inv_catch'), desc: t('blackmarket.info_inv_catch_desc'), icon: 'mdi:target-account' },
            { term: t('blackmarket.info_inv_fine'), desc: t('blackmarket.info_inv_fine_desc'), icon: 'mdi:cash-remove' },
            { term: t('blackmarket.info_inv_caught'), desc: t('blackmarket.info_inv_caught_desc'), icon: 'mdi:gavel' },
            { term: t('blackmarket.info_inv_dodged'), desc: t('blackmarket.info_inv_dodged_desc'), icon: 'mdi:shield-check' },
        ],
    },
    {
        title: t('blackmarket.info_effects_title'),
        icon: 'mdi:lightning-bolt',
        entries: [
            { term: t('blackmarket.info_effects_max'), desc: t('blackmarket.info_effects_max_desc'), icon: 'mdi:counter' },
            { term: t('blackmarket.info_effects_duration'), desc: t('blackmarket.info_effects_duration_desc'), icon: 'mdi:timer-outline' },
            { term: t('blackmarket.info_effects_stacking'), desc: t('blackmarket.info_effects_stacking_desc'), icon: 'mdi:layers-triple' },
        ],
    },
    {
        title: t('blackmarket.info_abilities_title'),
        icon: 'mdi:account-star',
        entries: [
            { term: t('blackmarket.info_broker_abilities'), desc: t('blackmarket.info_broker_abilities_desc'), icon: 'mdi:chart-line' },
            { term: t('blackmarket.info_fence_abilities'), desc: t('blackmarket.info_fence_abilities_desc'), icon: 'mdi:cash-fast' },
            { term: t('blackmarket.info_smuggler_abilities'), desc: t('blackmarket.info_smuggler_abilities_desc'), icon: 'mdi:truck-fast' },
            { term: t('blackmarket.info_hacker_abilities'), desc: t('blackmarket.info_hacker_abilities_desc'), icon: 'mdi:laptop' },
            { term: t('blackmarket.info_fixer_abilities'), desc: t('blackmarket.info_fixer_abilities_desc'), icon: 'mdi:wrench' },
        ],
    },
    {
        title: t('blackmarket.info_prestige_title'),
        icon: 'mdi:restart',
        entries: [
            { term: t('blackmarket.info_prestige_kept'), desc: t('blackmarket.info_prestige_kept_desc'), icon: 'mdi:lock' },
            { term: t('blackmarket.info_prestige_reset'), desc: t('blackmarket.info_prestige_reset_desc'), icon: 'mdi:delete-sweep' },
        ],
    },
    {
        title: t('blackmarket.info_tips_title'),
        icon: 'mdi:lightbulb',
        entries: [
            { term: t('blackmarket.info_tip_heat'), desc: t('blackmarket.info_tip_heat_desc'), icon: 'mdi:thermometer' },
            { term: t('blackmarket.info_tip_rep'), desc: t('blackmarket.info_tip_rep_desc'), icon: 'mdi:trophy' },
            { term: t('blackmarket.info_tip_fixer'), desc: t('blackmarket.info_tip_fixer_desc'), icon: 'mdi:shield-check' },
            { term: t('blackmarket.info_tip_loyalty'), desc: t('blackmarket.info_tip_loyalty_desc'), icon: 'mdi:heart' },
            { term: t('blackmarket.info_tip_scaling'), desc: t('blackmarket.info_tip_scaling_desc'), icon: 'mdi:chart-line' },
            { term: t('blackmarket.info_tip_investigations'), desc: t('blackmarket.info_tip_investigations_desc'), icon: 'mdi:shield-search' },
        ],
    },
])
</script>

<template>
    <div class="page-container">
        <!-- Header -->
        <div class="bm-header">
            <div>
                <h1 class="page-title">
                    <AppIcon icon="mdi:skull-crossbones" class="page-title-icon" />
                    {{ t('blackmarket.title') }}
                </h1>
                <p class="page-subtitle">{{ t('blackmarket.subtitle') }}</p>
            </div>
            <CashDisplay :label="t('blackmarket.balance')" :value="formatCash(player.cash)" />
        </div>

        <!-- Status ribbon: Reputation + Heat -->
        <div class="bm-status-row">
            <ReputationBar />
            <HeatMeter />
        </div>

        <!-- Investigation alerts -->
        <InvestigationAlert />

        <!-- Active effects -->
        <ActiveEffects />

        <!-- Tab Navigation -->
        <div class="tab-bar">
            <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id">
                <AppIcon :icon="tab.icon" />
                <span>{{ tab.label }}</span>
                <span v-if="tab.count && tab.count > 0" class="tab-count">{{ tab.count }}</span>
            </button>
        </div>

        <!-- Deals Tab -->
        <template v-if="activeTab === 'deals'">
            <DealGrid @accepted="handleDealAccepted" />
        </template>

        <!-- Contacts Tab -->
        <template v-if="activeTab === 'contacts'">
            <div v-if="bm.unlockedContacts.length > 0" class="contacts-grid">
                <ContactPanel v-for="contact in bm.unlockedContacts" :key="contact.id" :contact-id="contact.id"
                    @ability-used="handleAbilityUsed" />
            </div>
            <div v-else class="empty-state">
                <AppIcon icon="mdi:account-off" class="empty-icon" />
                <p>{{ t('blackmarket.no_contacts') }}</p>
                <span class="empty-hint">{{ t('blackmarket.no_contacts_hint') }}</span>
            </div>
        </template>

        <!-- Stats Tab -->
        <template v-if="activeTab === 'stats'">
            <BlackMarketStats />
        </template>

        <!-- Activity log — persistent feed -->
        <ActivityLog />

        <!-- Info Panel -->
        <InfoPanel :title="t('blackmarket.info_title')" :description="t('blackmarket.info_desc')"
            :sections="infoSections" />
    </div>
</template>

<style scoped>
.bm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--t-space-4);
}

.bm-status-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-4);
}

@media (max-width: 768px) {
    .bm-status-row {
        grid-template-columns: 1fr;
    }
}

.tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--t-border);
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.75rem 1.25rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--t-text-muted);
    font-size: var(--t-font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.tab-btn:hover {
    color: var(--t-text);
    background: var(--t-bg-muted);
}

.tab-btn.active {
    color: var(--t-accent);
    border-bottom-color: var(--t-accent);
    font-weight: 600;
}

.tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    font-size: 0.65rem;
    font-weight: 700;
    background: var(--t-bg-muted);
    color: var(--t-text-muted);
    border-radius: 9px;
}

.tab-btn.active .tab-count {
    background: var(--t-accent);
    color: white;
}

.contacts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: var(--t-space-4);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-8);
    color: var(--t-text-muted);
    text-align: center;
}

.empty-icon {
    font-size: 4rem;
    opacity: 0.2;
}

.empty-hint {
    font-size: var(--t-font-size-xs);
    opacity: 0.6;
}
</style>
