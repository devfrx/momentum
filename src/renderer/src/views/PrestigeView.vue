<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePrestigeStore } from '@renderer/stores/usePrestigeStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useStockStore } from '@renderer/stores/useStockStore'
import { useCryptoStore } from '@renderer/stores/useCryptoStore'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { useStartupStore } from '@renderer/stores/useStartupStore'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { useJobStore } from '@renderer/stores/useJobStore'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { useDepositStore } from '@renderer/stores/useDepositStore'
import { useBlackMarketStore } from '@renderer/stores/useBlackMarketStore'
import { useVaultStore } from '@renderer/stores/useVaultStore'
import { useShopStore } from '@renderer/stores/useShopStore'
import { EventImpactBanner } from '@renderer/components/events'
import { useAchievementStore } from '@renderer/stores/useAchievementStore'
import { useFormat } from '@renderer/composables/useFormat'
import { gameEngine } from '@renderer/core/GameEngine'
import AppIcon from '@renderer/components/AppIcon.vue'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import {
    PrestigePanel,
    PrestigeUpgradeCard,
    EraProgress,
    MilestoneCard,
    PerkCard,
    PrestigeStats
} from '@renderer/components/prestige'
import { UPGRADE_CATEGORY_INFO, type PrestigeUpgradeDef } from '@renderer/data/prestige'
import { rarityCssVar } from '@renderer/data/rarity'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

const prestige = usePrestigeStore()
const player = usePlayerStore()
const business = useBusinessStore()
const stocks = useStockStore()
const crypto = useCryptoStore()
const realEstate = useRealEstateStore()
const startups = useStartupStore()
const upgrades = useUpgradeStore()
const gambling = useGamblingStore()
const jobs = useJobStore()
const loans = useLoanStore()
const deposits = useDepositStore()
const blackmarket = useBlackMarketStore()
const vault = useVaultStore()
const shop = useShopStore()
const achievementStore = useAchievementStore()
const { formatNumber, formatMultiplier } = useFormat()
const { t } = useI18n()

type UpgradeWithLevel = PrestigeUpgradeDef & { level: number }

const prestigeInfoSections = computed<InfoSection[]>(() => [
    {
        title: t('prestige.info.points.title'),
        icon: 'mdi:star-circle',
        entries: [
            { term: t('prestige.info.points.formula'), desc: t('prestige.info.points.formula_desc') },
            { term: t('prestige.info.points.threshold'), desc: t('prestige.info.points.threshold_desc') },
        ],
    },
    {
        title: t('prestige.info.rebirth.title'),
        icon: 'mdi:refresh',
        entries: [
            { term: t('prestige.info.rebirth.resets'), desc: t('prestige.info.rebirth.resets_desc') },
            { term: t('prestige.info.rebirth.keeps'), desc: t('prestige.info.rebirth.keeps_desc') },
            { term: t('prestige.info.rebirth.starting_bonuses'), desc: t('prestige.info.rebirth.starting_bonuses_desc') },
        ],
    },
    {
        title: t('prestige.info.eras.title'),
        icon: 'mdi:crown',
        entries: [
            { term: t('prestige.info.eras.progression'), desc: t('prestige.info.eras.progression_desc') },
            { term: t('prestige.info.eras.bonus'), desc: t('prestige.info.eras.bonus_desc') },
        ],
    },
    {
        title: t('prestige.info.upgrades.title'),
        icon: 'mdi:arrow-up-bold-circle',
        entries: [
            { term: t('prestige.info.upgrades.repeatable'), desc: t('prestige.info.upgrades.repeatable_desc') },
            { term: t('prestige.info.upgrades.effects'), desc: t('prestige.info.upgrades.effects_desc') },
            { term: t('prestige.info.upgrades.categories'), desc: t('prestige.info.upgrades.categories_desc') },
        ],
    },
    {
        title: t('prestige.info.perks.title'),
        icon: 'mdi:gift',
        entries: [
            { term: t('prestige.info.perks.one_time'), desc: t('prestige.info.perks.one_time_desc') },
            { term: t('prestige.info.perks.prerequisites'), desc: t('prestige.info.perks.prerequisites_desc') },
            { term: t('prestige.info.perks.types'), desc: t('prestige.info.perks.types_desc') },
        ],
    },
    {
        title: t('prestige.info.milestones.title'),
        icon: 'mdi:flag-checkered',
        entries: [
            { term: t('prestige.info.milestones.auto_unlock'), desc: t('prestige.info.milestones.auto_unlock_desc') },
            { term: t('prestige.info.milestones.achievements'), desc: t('prestige.info.milestones.achievements_desc') },
            { term: t('prestige.info.milestones.divine'), desc: t('prestige.info.milestones.divine_desc') },
        ],
    },
])

// ─── Computed ───────────────────────────────────────────────────
const pendingPoints = computed(() => prestige.previewPointsGain(player.totalCashEarned))
const canPrestige = computed(() => pendingPoints.value.gt(0))

// Upgrades grouped by category as entries array
const upgradeCategories = computed(() => {
    const grouped: Record<string, UpgradeWithLevel[]> = {}
    for (const upg of prestige.upgrades) {
        const cat = upg.category || 'income'
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(upg as UpgradeWithLevel)
    }
    return Object.entries(grouped).map(([category, upgrades]) => ({
        category,
        upgrades,
        info: UPGRADE_CATEGORY_INFO[category as keyof typeof UPGRADE_CATEGORY_INFO] || { label: category, icon: 'mdi:star', color: '#888' }
    }))
})

// Stats for the stats bar
const prestigeStats = computed(() => [
    {
        label: t('prestige.points'),
        value: formatNumber(prestige.totalPointsEarned),
        icon: 'mdi:star-four-points',
        color: prestige.currentEra.themeColor
    },
    {
        label: t('prestige.rebirths'),
        value: prestige.rebirthCount.toString(),
        icon: 'mdi:reload',
        color: '#71717a'
    },
    {
        label: t('prestige.milestones'),
        value: `${prestige.unlockedMilestones}/${prestige.milestones.length}`,
        icon: 'mdi:flag-checkered',
        color: '#22c55e'
    },
    {
        label: t('prestige.perks'),
        value: `${prestige.purchasedPerks}/${prestige.perks.length}`,
        icon: 'mdi:diamond',
        color: '#a855f7'
    },
    {
        label: t('prestige.upgrade_levels'),
        value: prestige.totalUpgradeLevels.toString(),
        icon: 'mdi:arrow-up-bold-circle',
        color: '#f59e0b'
    },
    {
        label: t('prestige.global_multi'),
        value: formatMultiplier(prestige.globalMultiplier),
        icon: 'mdi:trending-up',
        color: '#22c55e'
    },
])

// Perks with prerequisite checking
const perksWithStatus = computed(() =>
    prestige.perks.map(perk => ({
        ...perk,
        canBuy: prestige.canBuyPerk(perk.id),
        prerequisitesMet: perk.prerequisites.every(
            preId => prestige.perks.find(p => p.id === preId)?.purchased
        )
    }))
)

// Achievements grouped by category
const achievementsByCategory = computed(() => {
    const cats: Record<string, typeof achievementStore.achievements> = {}
    for (const ach of achievementStore.achievements) {
        const cat = ach.category || 'Other'
        if (!cats[cat]) cats[cat] = []
        cats[cat].push(ach)
    }
    return Object.entries(cats).map(([category, items]) => ({ category, items }))
})

// Divine abilities from gambling store
const divineAbilities = computed(() => gambling.getUnlockedDivineAbilities())

// ─── Actions ────────────────────────────────────────────────────
function doPrestige(): void {
    if (!canPrestige.value) return

    prestige.performPrestige(player.totalCashEarned)

    // Reset all stores
    player.prestigeReset()
    business.prestigeReset()
    jobs.prestigeReset()
    stocks.prestigeReset()
    crypto.prestigeReset()
    realEstate.prestigeReset()
    startups.prestigeReset()
    upgrades.prestigeReset()
    gambling.prestigeReset()
    loans.prestigeReset()
    deposits.prestigeReset()
    blackmarket.prestigeReset()
    vault.prestigeReset()
    shop.prestigeReset()

    // Apply starting bonuses
    const startingCash = prestige.getStartingCash()
    if (startingCash.gt(0)) {
        player.earnCash(startingCash)
    }

    const startingXp = prestige.getStartingXp()
    if (startingXp.gt(0)) {
        player.addXp(startingXp)
    }

    // Check for new milestones
    prestige.checkMilestones(gameEngine.currentTick, player.totalCashEarned)
}

function buyPerk(perkId: string): void {
    prestige.buyPerk(perkId, gameEngine.currentTick)
}

/** Map lottery achievement IDs to display rarity */
function getLotteryAchRarity(achId: string): string {
    const map: Record<string, string> = {
        lot_quick_pick: 'uncommon',
        lot_classic: 'rare',
        lot_mega: 'epic',
        lot_instant: 'uncommon',
        lot_ultra: 'legendary',
        lot_cosmic: 'jackpot',
        lot_divine: 'mythic',
        lot_divine_jackpot: 'mythic',
        lot_master: 'mythic',
    }
    return map[achId] || 'common'
}

/** Format achievement reward for display */
function formatAchReward(reward: { type: string; target?: string; value: number }): string {
    if (reward.type === 'multiplier' && reward.target) {
        const pct = Math.round((reward.value - 1) * 100)
        const label = reward.target.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        return pct > 0 ? `+${pct}% ${label}` : `${pct}% ${label}`
    }
    return reward.target ?? ''
}
</script>

<template>
    <div class="page-container">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <AppIcon :icon="prestige.currentEra.icon" class="page-title-icon"
                        :style="{ color: prestige.currentEra.themeColor }" />
                    {{ $t('prestige.title') }}
                </h1>
                <p class="page-subtitle">{{ $t('prestige.subtitle') }}</p>
            </div>
        </div>

        <!-- Event Impact -->
        <EventImpactBanner route-name="prestige" />

        <!-- Era Progress -->
        <EraProgress :current-era="prestige.currentEra" :next-era="prestige.nextEra" :progress="prestige.eraProgress"
            :total-points="formatNumber(prestige.totalPointsEarned)" />

        <!-- Stats Bar -->
        <section class="stats-section">
            <PrestigeStats :stats="prestigeStats" />
        </section>

        <!-- Prestige Panel -->
        <PrestigePanel :current-points="formatNumber(prestige.points)"
            :total-points="formatNumber(prestige.totalPointsEarned)"
            :global-multiplier="formatMultiplier(prestige.globalMultiplier)"
            :pending-points="formatNumber(pendingPoints)" :can-prestige="canPrestige"
            :rebirth-count="prestige.rebirthCount" :era-color="prestige.currentEra.themeColor" @prestige="doPrestige" />

        <!-- Tabbed Content -->
        <Tabs value="upgrades" class="prestige-tabs">
            <TabList>
                <Tab value="upgrades">{{ $t('prestige.upgrades') }}</Tab>
                <Tab value="perks">{{ $t('prestige.perks') }}</Tab>
                <Tab value="milestones">{{ $t('prestige.milestones') }}</Tab>
                <Tab value="achievements">{{ $t('prestige.tab_achievements') }}</Tab>
            </TabList>
            <TabPanels>
                <!-- Upgrades Tab -->
                <TabPanel value="upgrades">
                    <div v-for="cat in upgradeCategories" :key="cat.category" class="upgrade-category">
                        <h3 class="category-header">
                            <AppIcon :icon="cat.info.icon" :style="{ color: cat.info.color }" />
                            {{ cat.info.label }}
                        </h3>
                        <div class="card-grid">
                            <PrestigeUpgradeCard v-for="upgrade in cat.upgrades" :key="upgrade.id" :name="upgrade.name"
                                :description="upgrade.description" :icon="upgrade.icon"
                                :effect-type="upgrade.effectType" :effect-value="upgrade.effectValue"
                                :level="upgrade.level" :max-level="upgrade.maxLevel"
                                :cost="formatNumber(prestige.getUpgradeCost(upgrade.id))"
                                :can-afford="!prestige.points.lt(prestige.getUpgradeCost(upgrade.id))"
                                @buy="prestige.buyPrestigeUpgrade(upgrade.id)" />
                        </div>
                    </div>
                </TabPanel>

                <!-- Perks Tab -->
                <TabPanel value="perks">
                    <p class="tab-description">
                        {{ $t('prestige.perks_desc') }}
                    </p>
                    <div class="card-grid">
                        <PerkCard v-for="perk in perksWithStatus" :key="perk.id" :name="perk.name"
                            :description="perk.description" :icon="perk.icon" :cost="formatNumber(perk.cost)"
                            :purchased="perk.purchased" :can-buy="perk.canBuy" :effect="perk.effect"
                            :category="perk.category" :prerequisites="perk.prerequisites"
                            :prerequisites-met="perk.prerequisitesMet" @buy="buyPerk(perk.id)" />
                    </div>
                </TabPanel>

                <!-- Milestones Tab -->
                <TabPanel value="milestones">
                    <p class="tab-description">
                        {{ $t('prestige.milestones_desc') }}
                    </p>
                    <div class="milestones-grid">
                        <MilestoneCard v-for="ms in prestige.milestones" :key="ms.id" :name="ms.name"
                            :description="ms.description" :icon="ms.icon" :unlocked="ms.unlocked"
                            :rewards="ms.rewards" />
                    </div>
                </TabPanel>

                <!-- Achievements Tab -->
                <TabPanel value="achievements">
                    <p class="tab-description">
                        {{ $t('prestige.achievements_desc') }}
                    </p>

                    <!-- Achievement progress bar -->
                    <div class="ach-progress-bar">
                        <div class="ach-progress-label">
                            <AppIcon icon="mdi:trophy" />
                            <span>{{ achievementStore.unlockedCount }} / {{ achievementStore.totalCount }}</span>
                            <span class="ach-progress-pct">{{ Math.round(achievementStore.completionPercent) }}%</span>
                        </div>
                        <div class="ach-progress-track">
                            <div class="ach-progress-fill"
                                :style="{ width: achievementStore.completionPercent + '%' }" />
                        </div>
                    </div>

                    <!-- Divine Abilities Section (if any unlocked) -->
                    <div v-if="divineAbilities.length > 0" class="divine-section">
                        <h3 class="category-header divine-header">
                            <AppIcon icon="mdi:shimmer" />
                            {{ $t('prestige.divine_abilities') }}
                        </h3>
                        <div class="divine-grid">
                            <div v-for="ability in divineAbilities" :key="ability.id" class="divine-card">
                                <AppIcon :icon="ability.icon" class="divine-card-icon" />
                                <div class="divine-card-body">
                                    <span class="divine-card-name">{{ ability.name }}</span>
                                    <span class="divine-card-value" :style="{ color: rarityCssVar(ability.rarity) }">+{{
                                        Math.round((ability.effect.value - 1) * 100) }}%</span>
                                    <span class="divine-card-desc">{{ ability.description }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Achievements by category -->
                    <div v-for="cat in achievementsByCategory" :key="cat.category" class="ach-category">
                        <h3 class="category-header">
                            <AppIcon
                                :icon="cat.category === 'Lottery' ? 'mdi:ticket' : cat.category === 'Wealth' ? 'mdi:cash' : cat.category === 'Net Worth' ? 'mdi:scale-balance' : cat.category === 'Progress' ? 'mdi:arrow-up-bold-circle' : cat.category === 'Business' ? 'mdi:store' : cat.category === 'Prestige' ? 'mdi:star-circle' : 'mdi:trophy'" />
                            {{ cat.category }}
                            <span class="ach-cat-count">({{cat.items.filter(a => a.unlocked).length}}/{{
                                cat.items.length }})</span>
                        </h3>
                        <div class="ach-grid">
                            <div v-for="ach in cat.items" :key="ach.id" class="ach-card"
                                :class="{ 'ach-unlocked': ach.unlocked, 'ach-hidden': ach.hidden && !ach.unlocked }"
                                :style="{ '--ach-color': ach.category === 'Lottery' ? rarityCssVar(getLotteryAchRarity(ach.id)) : 'var(--t-success)' }">
                                <div class="ach-icon-wrap">
                                    <AppIcon :icon="ach.hidden && !ach.unlocked ? 'mdi:help-circle' : ach.icon"
                                        class="ach-icon" />
                                </div>
                                <div class="ach-info">
                                    <span class="ach-name">{{ ach.hidden && !ach.unlocked ? '???' : ach.name }}</span>
                                    <span class="ach-desc">{{ ach.hidden && !ach.unlocked ? $t('prestige.ach_hidden') :
                                        ach.description }}</span>
                                    <span v-if="ach.reward && ach.unlocked" class="ach-reward">
                                        <AppIcon icon="mdi:gift" /> {{ formatAchReward(ach.reward) }}
                                    </span>
                                </div>
                                <AppIcon v-if="ach.unlocked" icon="mdi:check-circle" class="ach-check" />
                            </div>
                        </div>
                    </div>
                </TabPanel>
            </TabPanels>
        </Tabs>

        <!-- Info Panel -->
        <InfoPanel :title="$t('prestige.info_title')" :description="$t('prestige.info_desc')"
            :sections="prestigeInfoSections" />
    </div>
</template>

<style scoped>
.page-title-icon {
    transition: color 0.3s ease;
}

.stats-section {
    margin: var(--t-space-6) 0;
}

.prestige-tabs {
    margin-top: var(--t-space-6);
}

.prestige-tabs :deep(.p-tabs-panels) {
    background: transparent;
    padding: var(--t-space-4) 0;
    border-radius: 0;
}

.prestige-tabs :deep(.p-tablist) {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    box-shadow: var(--t-shadow-sm);
}

.prestige-tabs :deep(.p-tab) {
    background: transparent;
    border: none;
    border-radius: 0;
    color: var(--t-text-secondary);
    padding: var(--t-space-3) var(--t-space-4);
}

.prestige-tabs :deep(.p-tab[data-p-active="true"]) {
    background: var(--t-bg-muted);
    color: var(--t-text);
    border-radius: 0;
}

.tab-description {
    color: var(--t-text-secondary);
    margin-bottom: var(--t-space-4);
    font-size: 0.9rem;
}

.upgrade-category {
    margin-bottom: var(--t-space-8);
}

.upgrade-category:last-child {
    margin-bottom: 0;
}

.category-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: var(--t-space-4);
    padding-bottom: var(--t-space-2);
    border-bottom: 1px solid var(--t-border);
}

.milestones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--t-space-3);
}

/* ── Achievements Tab ── */
.ach-progress-bar {
    margin-bottom: var(--t-space-4);
}

.ach-progress-label {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: var(--t-space-2);
    color: var(--t-text-secondary);
}

.ach-progress-pct {
    font-family: var(--t-font-mono);
    font-size: 0.8rem;
    color: var(--t-text-muted);
}

.ach-progress-track {
    width: 100%;
    height: 6px;
    background: var(--t-bg-muted);
    border-radius: 3px;
    overflow: hidden;
}

.ach-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #22c55e, #facc15);
    border-radius: 3px;
    transition: width 0.5s ease;
}

.ach-category {
    margin-bottom: var(--t-space-6);
}

.ach-cat-count {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--t-text-muted);
    margin-left: var(--t-space-1);
}

.ach-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--t-space-3);
}

.ach-card {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    transition: all var(--t-transition-fast);
    opacity: 0.5;
    border-left: 3px solid var(--t-border);
}

.ach-card.ach-unlocked {
    opacity: 1;
    border-left-color: var(--ach-color, #22c55e);
    background: color-mix(in srgb, var(--ach-color, #22c55e) 5%, var(--t-bg-card));
}

.ach-card.ach-hidden {
    opacity: 0.35;
    border-left-color: var(--t-text-muted);
}

.ach-icon-wrap {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--t-radius-md);
    background: var(--t-bg-muted);
    flex-shrink: 0;
}

.ach-unlocked .ach-icon-wrap {
    background: color-mix(in srgb, var(--ach-color, #22c55e) 15%, transparent);
}

.ach-icon {
    font-size: 1.3rem;
    color: var(--t-text-muted);
}

.ach-unlocked .ach-icon {
    color: var(--ach-color, #22c55e);
}

.ach-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
}

.ach-name {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--t-text);
}

.ach-desc {
    font-size: 0.75rem;
    color: var(--t-text-muted);
}

.ach-reward {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--ach-color, #22c55e);
    margin-top: 2px;
}

.ach-check {
    font-size: 1.2rem;
    color: var(--ach-color, #22c55e);
    flex-shrink: 0;
}

/* ── Divine Abilities Section ── */
.divine-section {
    margin-bottom: var(--t-space-6);
}

.divine-header {
    color: #facc15;
}

.divine-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--t-space-2);
}

.divine-card {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    transition: border-color var(--t-transition-normal);
}

.divine-card:hover {
    border-color: var(--t-border-hover);
}

.divine-card-icon {
    font-size: 1.25rem;
    color: var(--t-text-secondary);
    flex-shrink: 0;
}

.divine-card-body {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
}

.divine-card-name {
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text);
}

.divine-card-value {
    font-family: var(--t-font-mono);
    font-weight: 800;
    font-size: var(--t-font-size-sm);
}

.divine-card-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}
</style>
