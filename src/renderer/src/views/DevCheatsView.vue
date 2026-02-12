<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useBusinessStore } from '@renderer/stores/useBusinessStore'
import { useStockStore } from '@renderer/stores/useStockStore'
import { useCryptoStore } from '@renderer/stores/useCryptoStore'
import { usePrestigeStore } from '@renderer/stores/usePrestigeStore'
import { useStartupStore } from '@renderer/stores/useStartupStore'
import { useUpgradeStore } from '@renderer/stores/useUpgradeStore'
import { useLoanStore } from '@renderer/stores/useLoanStore'
import { useDepositStore } from '@renderer/stores/useDepositStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { useEventStore } from '@renderer/stores/useEventStore'
import { useRealEstateStore } from '@renderer/stores/useRealEstateStore'
import { useAchievementStore } from '@renderer/stores/useAchievementStore'
import { useFormat } from '@renderer/composables/useFormat'
import { D, ZERO } from '@renderer/core/BigNum'
import { BUSINESSES } from '@renderer/data/businesses'
import { SECTORS, STAGES, TRAITS } from '@renderer/data/startups'
import { gameEngine } from '@renderer/core/GameEngine'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { LOTTERY_TICKETS } from '@renderer/data/lottery'
import { DIVINE_ABILITIES } from '@renderer/data/lottery'

const player = usePlayerStore()
const business = useBusinessStore()
const stocks = useStockStore()
const crypto = useCryptoStore()
const prestige = usePrestigeStore()
const startups = useStartupStore()
const upgrades = useUpgradeStore()
const loans = useLoanStore()
const deposits = useDepositStore()
const gambling = useGamblingStore()
const events = useEventStore()
const realEstate = useRealEstateStore()
const achievements = useAchievementStore()
const { formatCash } = useFormat()
const { t } = useI18n()

const cashAmount = ref(10000)
const xpAmount = ref(1000)
const prestigeAmount = ref(100)
const log = ref<string[]>([])

function addLog(msg: string) {
    log.value.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`)
    if (log.value.length > 50) log.value.pop()
}

// ─── Cash ──────────────────────────────

function giveCash() {
    const amount = D(cashAmount.value)
    player.earnCash(amount)
    addLog(`+$${cashAmount.value.toLocaleString()} cash`)
}

function giveMegaCash() {
    const amount = D(1e9)
    player.earnCash(amount)
    addLog('+$1B cash')
}

function giveInfiniteCash() {
    const amount = D(1e15)
    player.earnCash(amount)
    addLog('+$1Qa cash')
}

function setCashZero() {
    player.cash = D(0)
    addLog('Cash set to $0')
}

// ─── XP / Level ────────────────────────

function giveXp() {
    player.addXp(D(xpAmount.value))
    addLog(`+${xpAmount.value} XP`)
}

function setLevel(lv: number) {
    player.level = lv
    addLog(`Level set to ${lv}`)
}

// ─── Prestige ──────────────────────────

function givePrestigePoints() {
    prestige.points = prestige.points.add(D(prestigeAmount.value))
    prestige.totalPointsEarned = prestige.totalPointsEarned.add(D(prestigeAmount.value))
    addLog(`+${prestigeAmount.value} prestige points`)
}

// ─── Businesses ────────────────────────

function buyAllBusinesses() {
    let count = 0
    for (const def of BUSINESSES) {
        if (!business.businesses.find(b => b.id === def.id)) {
            // Force-give cash to afford it, then buy
            const cost = def.purchasePrice
            if (player.cash.lt(cost)) {
                player.earnCash(cost)
            }
            business.buyBusiness(def)
            count++
        }
    }
    addLog(`Bought ${count} new businesses (${BUSINESSES.length} total defs)`)
}

// ─── Startups ──────────────────────────

const startupTestNW = ref(1_000_000)

function refreshStartupOpps() {
    startups.refreshOpportunities(gameEngine.currentTick, true)
    addLog(`Generated ${startups.opportunities.length} new opportunities (NW: ${formatCash(player.cash)})`)
}

function refreshWithCustomNW() {
    // Temporarily override to test scaling at different NW levels
    const realCash = player.cash
    player.cash = D(startupTestNW.value)
    startups.refreshOpportunities(gameEngine.currentTick, true)
    player.cash = realCash
    addLog(`Generated ${startups.opportunities.length} opps as if NW=$${startupTestNW.value.toLocaleString()}`)
}

function resolveAllStartups() {
    const beforeActive = startups.activeInvestments.length
    startups.tick(gameEngine.currentTick + 999999)
    const afterActive = startups.activeInvestments.length
    addLog(`Force-resolved ${beforeActive - afterActive} startups`)
}

function investInAll() {
    let count = 0
    for (const opp of [...startups.opportunities]) {
        const amount = D(opp.minInvestment)
        // Give cash if needed
        if (player.cash.lt(amount)) player.earnCash(amount)
        const ok = startups.invest(opp.id, amount, gameEngine.currentTick)
        if (ok) count++
    }
    addLog(`Invested in ${count} startups (min amount each)`)
}

function collectAllPending() {
    let count = 0
    for (const inv of [...startups.pendingInvestments]) {
        startups.exitInvestment(inv.id)
        count++
    }
    addLog(`Collected ${count} pending returns`)
}

function dueDiligenceAll() {
    let count = 0
    for (const opp of startups.opportunities) {
        if (!opp.dueDiligenceDone) {
            // Give cash for DD cost
            player.earnCash(D(opp.dueDiligenceCost))
            startups.performDueDiligence(opp.id)
            count++
        }
    }
    addLog(`Researched ${count} startups (free)`)
}

function clearStartups() {
    startups.fullReset()
    addLog('Startup state fully reset')
}

// ─── Market ────────────────────────────

function tickMarket100() {
    for (let i = 0; i < 100; i++) {
        stocks.tick()
        crypto.tick()
    }
    addLog('Ticked stock + crypto markets ×100')
}

// ─── Time ──────────────────────────────

function fastForward(ticks: number) {
    gameEngine.manualTicks(ticks)
    addLog(`Fast-forwarded ${ticks} ticks (${ticks / 10}s)`)
}

// ─── Loans ─────────────────────────────

function clearAllLoans() {
    loans.loans.forEach(l => loans.repayLoanInFull(l.id, gameEngine.currentTick))
    addLog('All loans cleared')
}

// ─── Credit Score ──────────────────────

const creditScoreAmount = ref(50)

function setCreditScore(score: number) {
    // Directly manipulate the credit score factors
    const target = Math.max(0, Math.min(100, score))
    // Force update by setting factors proportionally
    loans.creditScoreFactors.paymentHistory = Math.round(target * 0.35)
    loans.creditScoreFactors.creditUtilization = Math.round(target * 0.30)
    loans.creditScoreFactors.creditAge = Math.round(target * 0.15)
    loans.creditScoreFactors.creditMix = Math.round(target * 0.10)
    loans.creditScoreFactors.newCredit = Math.round(target * 0.10)
    loans.recalculateCreditScore()
    addLog(`Credit score set to ~${target} (actual: ${loans.creditScore})`)
}

function maxCreditScore() {
    loans.creditScoreFactors.paymentHistory = 35
    loans.creditScoreFactors.creditUtilization = 30
    loans.creditScoreFactors.creditAge = 15
    loans.creditScoreFactors.creditMix = 10
    loans.creditScoreFactors.newCredit = 10
    loans.recalculateCreditScore()
    addLog(`Credit score maxed to ${loans.creditScore}`)
}

function minCreditScore() {
    loans.creditScoreFactors.paymentHistory = 0
    loans.creditScoreFactors.creditUtilization = 0
    loans.creditScoreFactors.creditAge = 0
    loans.creditScoreFactors.creditMix = 0
    loans.creditScoreFactors.newCredit = 0
    loans.recalculateCreditScore()
    addLog(`Credit score set to ${loans.creditScore}`)
}

// ─── Skill Tree / Upgrades ─────────────

function unlockAllSkills() {
    let count = 0
    for (const node of upgrades.nodes) {
        if (node.level === 0) {
            node.level = 1
            node.purchased = true
            count++
        }
    }
    addLog(`Unlocked ${count} skill nodes`)
}

function maxAllSkills() {
    let count = 0
    for (const node of upgrades.nodes) {
        if (node.maxLevel > 0) {
            node.level = node.maxLevel
        } else {
            node.level = Math.max(node.level, 5)
        }
        node.purchased = true
        count++
    }
    addLog(`Maxed ${count} skill nodes`)
}

function resetAllSkills() {
    for (const node of upgrades.nodes) {
        node.level = 0
        node.purchased = false
    }
    addLog('All skills reset')
}

// ─── Events ────────────────────────────

function triggerRandomEvent() {
    // Force multiple ticks to increase chance of event firing
    const before = events.activeEvents.length
    for (let i = 0; i < 20; i++) events.tick()
    const after = events.activeEvents.length
    addLog(`Forced 20 event ticks. Events: ${before} → ${after}`)
}

function clearAllEvents() {
    // Clear both the EventSystem internal state and the store
    const system = events.getSystem()
    const state = system.getState()
    state.activeEvents = []
    state.pendingChoices = []
    system.setState(state)
    events.activeEvents.splice(0, events.activeEvents.length)
    events.pendingChoices.splice(0, events.pendingChoices.length)
    addLog('All active events cleared')
}

// ─── Gambling ──────────────────────────

function resetGamblingStats() {
    gambling.prestigeReset()
    addLog('Gambling stats reset')
}

function setGamblingWinStreak() {
    // recordWin(game, betAmount, payout) — payout > bet = profit
    for (let i = 0; i < 10; i++) {
        gambling.recordWin('slots', D(10_000), D(100_000))
    }
    addLog(`Recorded 10 big wins. Net profit: ${gambling.netProfit}`)
}

// ─── Lottery / Divine ──────────────────

function unlockAllLotteryJackpots() {
    for (const ticket of LOTTERY_TICKETS) {
        const topPrize = ticket.prizes[ticket.prizes.length - 1]
        gambling.recordLotteryWin(ticket.id, topPrize.label)
    }
    // Unlock all lottery achievements
    const achIds = ['lot_quick_pick', 'lot_classic', 'lot_mega', 'lot_instant', 'lot_ultra', 'lot_cosmic', 'lot_divine', 'lot_divine_jackpot', 'lot_master']
    for (const id of achIds) {
        achievements.unlock(id, gameEngine.currentTick)
    }
    addLog('All lottery jackpots recorded + achievements unlocked')
}

function unlockAllDivineAbilities() {
    let count = 0
    for (const ability of DIVINE_ABILITIES) {
        if (gambling.unlockDivineAbility(ability.id)) count++
    }
    // Also unlock divine achievements
    achievements.unlock('lot_divine', gameEngine.currentTick)
    achievements.unlock('lot_divine_jackpot', gameEngine.currentTick)
    addLog(`Unlocked ${count} divine abilities`)
}

function resetDivineAbilities() {
    gambling.divineAbilities = []
    gambling.lotteryWins = {}
    addLog('Divine abilities & lottery wins reset')
}

// ─── Deposits ──────────────────────────

function matureAllDeposits() {
    // Set matured flag and advance ticksActive to termTicks
    let count = 0
    for (const dep of deposits.deposits) {
        if (!dep.matured) {
            dep.matured = true
            dep.ticksActive = dep.termTicks
            count++
        }
    }
    addLog(`Force-matured ${count} deposits (${deposits.deposits.length} total)`)
}

function clearAllDeposits() {
    deposits.deposits.splice(0, deposits.deposits.length)
    addLog('All deposits cleared')
}

// ─── Real Estate ───────────────────────

function repairAllProperties() {
    for (const prop of realEstate.properties) {
        prop.condition = 100
        prop.repairCost = ZERO
    }
    addLog(`Repaired ${realEstate.properties.length} properties`)
}

function maxOccupancyAll() {
    for (const prop of realEstate.properties) {
        prop.occupancy = 1.0
        prop.occupiedUnits = prop.units
    }
    addLog('All properties at 100% occupancy')
}

// ─── Achievements ──────────────────────

function unlockAllAchievements() {
    let count = 0
    for (const ach of achievements.achievements) {
        if (!ach.unlocked) {
            ach.unlocked = true
            ach.unlockedAtTick = gameEngine.currentTick
            count++
        }
    }
    addLog(`Unlocked ${count} achievements`)
}

function resetAchievements() {
    for (const ach of achievements.achievements) {
        ach.unlocked = false
        ach.unlockedAtTick = null
    }
    addLog('All achievements reset')
}

// ─── Prestige Extended ─────────────────

function unlockAllPrestigeUpgrades() {
    for (const upg of prestige.upgrades) {
        if (upg.level < upg.maxLevel) {
            upg.level = upg.maxLevel
        }
    }
    addLog('All prestige upgrades maxed')
}

function unlockAllMilestones() {
    for (const ms of prestige.milestones) {
        ms.unlocked = true
    }
    addLog('All milestones unlocked')
}

function purchaseAllPerks() {
    for (const perk of prestige.perks) {
        perk.purchased = true
    }
    addLog('All perks purchased')
}

function advanceEra() {
    const nextEra = prestige.nextEra
    if (!nextEra) {
        addLog('Already at max era!')
        return
    }
    // Eras require BOTH totalPointsEarned >= threshold AND rebirthCount >= min
    const neededPoints = nextEra.pointsRequired
    if (prestige.totalPointsEarned.lt(neededPoints)) {
        const diff = neededPoints.sub(prestige.totalPointsEarned)
        prestige.totalPointsEarned = prestige.totalPointsEarned.add(diff)
        prestige.points = prestige.points.add(diff)
    }
    if (prestige.rebirthCount < nextEra.minRebirths) {
        prestige.rebirthCount = nextEra.minRebirths
    }
    addLog(`Advanced to era: ${prestige.currentEra.name} (rebirths: ${prestige.rebirthCount}, points: ${prestige.totalPointsEarned})`)
}

// ─── Multiplier Info ───────────────────

const multiplierInfo = computed(() => {
    return [
        { name: 'All Income', value: upgrades.getMultiplier('all_income').toNumber() },
        { name: 'Business Revenue', value: upgrades.getMultiplier('business_revenue').toNumber() },
        { name: 'Job Efficiency', value: upgrades.getMultiplier('job_efficiency').toNumber() },
        { name: 'Cost Reduction', value: upgrades.getMultiplier('cost_reduction').toNumber() },
        { name: 'Customer Attraction', value: upgrades.getMultiplier('customer_attraction').toNumber() },
        { name: 'Stock Returns', value: upgrades.getMultiplier('stock_returns').toNumber() },
        { name: 'Crypto Returns', value: upgrades.getMultiplier('crypto_returns').toNumber() },
        { name: 'Real Estate Rent', value: upgrades.getMultiplier('real_estate_rent').toNumber() },
        { name: 'Gambling Luck', value: upgrades.getMultiplier('gambling_luck').toNumber() },
        { name: 'XP Gain', value: upgrades.getMultiplier('xp_gain').toNumber() },
        { name: 'Offline Efficiency', value: upgrades.getMultiplier('offline_efficiency').toNumber() },
        { name: 'Prestige Gain', value: upgrades.getMultiplier('prestige_gain').toNumber() },
        { name: 'Loan Rate', value: upgrades.getMultiplier('loan_rate').toNumber() },
        { name: 'Deposit Rate', value: upgrades.getMultiplier('deposit_rate').toNumber() },
        { name: 'Startup Success', value: upgrades.getMultiplier('startup_success').toNumber() },
    ]
})
</script>

<template>
    <div class="page-container">
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <AppIcon icon="mdi:bug" class="page-title-icon" style="color: #ef4444;" />
                    {{ t('dev.title') }}
                </h1>
                <p class="page-subtitle">{{ t('dev.subtitle') }}</p>
            </div>
            <div class="dev-badge">{{ t('dev.badge') }}</div>
        </div>

        <!-- Current State -->
        <div class="stats-bar">
            <div class="stat-chip">
                <span class="stat-chip-label">{{ t('dev.cash') }}</span>
                <span class="stat-chip-value text-gold">{{ formatCash(player.cash) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ t('dev.net_worth') }}</span>
                <span class="stat-chip-value">{{ formatCash(player.netWorth) }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ t('dev.level') }}</span>
                <span class="stat-chip-value">{{ player.level }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ t('dev.tick') }}</span>
                <span class="stat-chip-value">{{ gameEngine.currentTick }}</span>
            </div>
            <div class="stat-chip">
                <span class="stat-chip-label">{{ t('dev.businesses') }}</span>
                <span class="stat-chip-value">{{ business.businesses.length }}</span>
            </div>
        </div>

        <div class="cheat-grid">
            <!-- Cash Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:cash-multiple" class="section-icon text-gold" /> {{ t('dev.section_cash') }}
                </h2>
                <div class="cheat-row">
                    <div class="input-group">
                        <input v-model.number="cashAmount" type="number" class="cheat-input" min="1" />
                        <Button :label="t('dev.give_cash')" icon="pi pi-plus" size="small" @click="giveCash" />
                    </div>
                </div>
                <div class="cheat-buttons">
                    <Button :label="t('dev.plus_1b')" severity="warn" size="small" @click="giveMegaCash" />
                    <Button :label="t('dev.plus_1qa')" severity="danger" size="small" @click="giveInfiniteCash" />
                    <Button :label="t('dev.set_zero')" severity="secondary" size="small" @click="setCashZero" />
                </div>
            </section>

            <!-- XP / Level Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:star-four-points" class="section-icon text-sky" /> {{ t('dev.section_xp') }}
                </h2>
                <div class="cheat-row">
                    <div class="input-group">
                        <input v-model.number="xpAmount" type="number" class="cheat-input" min="1" />
                        <Button :label="t('dev.give_xp')" icon="pi pi-plus" size="small" @click="giveXp" />
                    </div>
                </div>
                <div class="cheat-buttons">
                    <Button label="Lv 10" severity="secondary" size="small" @click="setLevel(10)" />
                    <Button label="Lv 50" severity="secondary" size="small" @click="setLevel(50)" />
                    <Button label="Lv 100" severity="warn" size="small" @click="setLevel(100)" />
                </div>
            </section>

            <!-- Prestige Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:star-circle" class="section-icon text-purple" /> {{ t('dev.section_prestige') }}
                </h2>
                <div class="cheat-row">
                    <div class="input-group">
                        <input v-model.number="prestigeAmount" type="number" class="cheat-input" min="1" />
                        <Button :label="t('dev.give_pp')" icon="pi pi-plus" size="small" @click="givePrestigePoints" />
                    </div>
                </div>
            </section>

            <!-- Business Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:domain" class="section-icon" /> {{ t('dev.section_business') }}
                </h2>
                <div class="cheat-buttons">
                    <Button :label="t('dev.buy_all')" icon="pi pi-shopping-cart" severity="warn" size="small"
                        @click="buyAllBusinesses" />
                </div>
            </section>

            <!-- Startup Section -->
            <section class="cheat-section cheat-section-wide">
                <h2 class="section-header">
                    <AppIcon icon="mdi:rocket-launch" class="section-icon text-orange" /> {{ t('dev.section_startups')
                    }}
                </h2>
                <div class="cheat-row">
                    <div class="input-group">
                        <select v-model.number="startupTestNW" class="cheat-input">
                            <option :value="10000">$10K (early)</option>
                            <option :value="100000">$100K</option>
                            <option :value="1000000">$1M</option>
                            <option :value="10000000">$10M</option>
                            <option :value="100000000">$100M</option>
                            <option :value="1000000000">$1B</option>
                            <option :value="10000000000">$10B</option>
                            <option :value="1000000000000">$1T</option>
                        </select>
                        <Button :label="t('dev.gen_nw')" icon="pi pi-refresh" severity="warn" size="small"
                            @click="refreshWithCustomNW" />
                    </div>
                </div>
                <div class="cheat-buttons">
                    <Button :label="t('dev.refresh_opps')" icon="pi pi-refresh" size="small"
                        @click="refreshStartupOpps" />
                    <Button :label="t('dev.research_all')" icon="pi pi-search" severity="secondary" size="small"
                        @click="dueDiligenceAll" />
                    <Button :label="t('dev.invest_min')" icon="pi pi-send" severity="warn" size="small"
                        @click="investInAll" />
                    <Button :label="t('dev.force_resolve')" icon="pi pi-bolt" severity="warn" size="small"
                        @click="resolveAllStartups" />
                    <Button :label="t('dev.collect_all')" icon="pi pi-wallet" severity="success" size="small"
                        @click="collectAllPending" />
                    <Button :label="t('dev.reset_startups')" icon="pi pi-trash" severity="danger" size="small"
                        @click="clearStartups" />
                </div>

                <!-- Live Startup Info -->
                <div class="startup-debug-info">
                    <div class="debug-row">
                        <span>{{ t('dev.opportunities') }} <strong>{{ startups.opportunities.length }}</strong></span>
                        <span>{{ t('dev.active_label') }} <strong class="text-sky">{{ startups.activeInvestments.length
                        }}</strong></span>
                        <span>{{ t('dev.pending') }} <strong class="text-emerald">{{ startups.pendingInvestments.length
                                }}</strong></span>
                        <span>{{ t('dev.win_rate_label') }} <strong>{{ startups.winRate.toFixed(1) }}%</strong></span>
                    </div>
                </div>

                <!-- Current Opportunities Preview -->
                <div v-if="startups.opportunities.length" class="startup-debug-opps">
                    <div class="debug-subtitle">{{ t('dev.current_opps') }}</div>
                    <div v-for="opp in startups.opportunities" :key="opp.id" class="debug-opp">
                        <AppIcon :icon="SECTORS[opp.sector].icon" :style="{ color: SECTORS[opp.sector].color }" />
                        <span class="debug-opp-name">{{ opp.name }}</span>
                        <Tag :value="STAGES[opp.stage].name" size="small"
                            :severity="opp.stage === 'seed' ? 'danger' : opp.stage === 'preIPO' ? 'success' : 'info'" />
                        <span class="text-gold">${{ opp.minInvestment.toLocaleString() }}</span>
                        <span>→</span>
                        <span class="text-gold">${{ opp.maxInvestment.toLocaleString() }}</span>
                        <span class="text-emerald">{{ opp.baseReturnMultiplier.toFixed(1) }}x</span>
                        <span v-if="opp.dueDiligenceDone" class="text-sky">{{ (opp.baseSuccessChance * 100).toFixed(0)
                            }}%</span>
                        <span v-else class="text-muted">???</span>
                        <Tag v-if="opp.isHotDeal" value="HOT" severity="danger" size="small" />
                        <span class="debug-traits">
                            <span v-for="t in opp.traits" :key="t" class="debug-trait"
                                :class="TRAITS[t].isPositive ? 'text-emerald' : 'text-red'"
                                :title="TRAITS[t].description">
                                {{ TRAITS[t].name }}
                            </span>
                        </span>
                    </div>
                </div>
            </section>

            <!-- Market Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:chart-line" class="section-icon" /> {{ t('dev.section_market') }}
                </h2>
                <div class="cheat-buttons">
                    <Button :label="t('dev.tick_markets')" severity="secondary" size="small" @click="tickMarket100" />
                    <Button :label="t('dev.clear_loans')" severity="secondary" size="small" @click="clearAllLoans" />
                    <Button :label="t('dev.plus_100_ticks')" severity="secondary" size="small"
                        @click="fastForward(100)" />
                    <Button :label="t('dev.plus_1000_ticks')" severity="warn" size="small" @click="fastForward(1000)" />
                    <Button label="+10K ticks" severity="danger" size="small" @click="fastForward(10000)" />
                </div>
            </section>

            <!-- Credit Score Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:speedometer" class="section-icon text-cyan" /> Credit Score
                </h2>
                <div class="cheat-row">
                    <div class="input-group">
                        <input v-model.number="creditScoreAmount" type="number" class="cheat-input" min="0" max="100" />
                        <Button label="Set Score" icon="pi pi-check" size="small"
                            @click="setCreditScore(creditScoreAmount)" />
                    </div>
                </div>
                <div class="cheat-buttons">
                    <Button label="Max (100)" severity="success" size="small" @click="maxCreditScore" />
                    <Button label="Min (0)" severity="danger" size="small" @click="minCreditScore" />
                    <Button label="Fair (50)" severity="secondary" size="small" @click="setCreditScore(50)" />
                </div>
                <div class="debug-row">
                    <span>Current: <strong
                            :class="loans.creditScore >= 70 ? 'text-emerald' : loans.creditScore >= 40 ? 'text-gold' : 'text-red'">{{
                                loans.creditScore }}</strong></span>
                </div>
            </section>

            <!-- Skill Tree Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:graph" class="section-icon text-purple" /> Skill Tree
                </h2>
                <div class="cheat-buttons">
                    <Button label="Unlock All" severity="secondary" size="small" @click="unlockAllSkills" />
                    <Button label="Max All" severity="warn" size="small" @click="maxAllSkills" />
                    <Button label="Reset All" severity="danger" size="small" @click="resetAllSkills" />
                </div>
                <div class="debug-row">
                    <span>Purchased: <strong>{{upgrades.nodes.filter(n => n.purchased).length}}</strong>/{{
                        upgrades.nodes.length }}</span>
                </div>
            </section>

            <!-- Events Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:lightning-bolt" class="section-icon text-gold" /> Events
                </h2>
                <div class="cheat-buttons">
                    <Button label="Trigger Random" severity="warn" size="small" @click="triggerRandomEvent" />
                    <Button label="Clear Events" severity="secondary" size="small" @click="clearAllEvents" />
                </div>
                <div class="debug-row">
                    <span>Active: <strong>{{ events.activeEvents?.length ?? 0 }}</strong></span>
                </div>
            </section>

            <!-- Gambling Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:dice-multiple" class="section-icon text-emerald" /> Gambling
                </h2>
                <div class="cheat-buttons">
                    <Button label="Reset Stats" severity="secondary" size="small" @click="resetGamblingStats" />
                    <Button label="Win Streak" severity="success" size="small" @click="setGamblingWinStreak" />
                </div>
                <div class="debug-row">
                    <span>Games: <strong>{{ gambling.gamesPlayed }}</strong></span>
                    <span>Net: <strong :class="gambling.netProfit.gte(0) ? 'text-emerald' : 'text-red'">{{
                        formatCash(gambling.netProfit) }}</strong></span>
                    <span>Luck: <strong>×{{ upgrades.getMultiplier('gambling_luck').toFixed(2) }}</strong></span>
                </div>
            </section>

            <!-- Lottery & Divine Abilities Section -->
            <section class="cheat-section cheat-section-wide">
                <h2 class="section-header">
                    <AppIcon icon="mdi:shimmer" class="section-icon" style="color: #facc15;" /> Lottery & Divine
                    Abilities
                </h2>
                <div class="cheat-buttons">
                    <Button label="All Lottery Jackpots" severity="warn" size="small" icon="pi pi-star"
                        @click="unlockAllLotteryJackpots" />
                    <Button label="All Divine Abilities" severity="warn" size="small" icon="pi pi-bolt"
                        @click="unlockAllDivineAbilities" />
                    <Button label="Reset Divine" severity="danger" size="small" icon="pi pi-trash"
                        @click="resetDivineAbilities" />
                </div>
                <div class="debug-row">
                    <span>Divine Abilities: <strong class="text-gold">{{ gambling.divineAbilities.length }} / {{
                        DIVINE_ABILITIES.length }}</strong></span>
                    <span>Lottery Wins: <strong>{{ Object.keys(gambling.lotteryWins).length }}</strong></span>
                </div>
                <div v-if="gambling.divineAbilities.length > 0" class="startup-debug-opps">
                    <div class="debug-subtitle">Unlocked Divine Abilities:</div>
                    <div v-for="id in gambling.divineAbilities" :key="id" class="debug-opp">
                        <span class="debug-opp-name text-gold">{{DIVINE_ABILITIES.find(a => a.id === id)?.name || id
                        }}</span>
                        <span class="text-muted">{{DIVINE_ABILITIES.find(a => a.id === id)?.description || ''}}</span>
                    </div>
                </div>
            </section>

            <!-- Deposits Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:piggy-bank" class="section-icon text-pink" /> Deposits
                </h2>
                <div class="cheat-buttons">
                    <Button label="Mature All" severity="warn" size="small" @click="matureAllDeposits" />
                    <Button label="Clear All" severity="danger" size="small" @click="clearAllDeposits" />
                </div>
                <div class="debug-row">
                    <span>Active: <strong>{{ deposits.deposits?.length ?? 0 }}</strong></span>
                </div>
            </section>

            <!-- Real Estate Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:home-city" class="section-icon text-sky" /> Real Estate
                </h2>
                <div class="cheat-buttons">
                    <Button label="Repair All" severity="secondary" size="small" @click="repairAllProperties" />
                    <Button label="100% Occupancy" severity="success" size="small" @click="maxOccupancyAll" />
                </div>
                <div class="debug-row">
                    <span>Properties: <strong>{{ realEstate.properties.length }}</strong></span>
                </div>
            </section>

            <!-- Achievements Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:trophy" class="section-icon text-gold" /> Achievements
                </h2>
                <div class="cheat-buttons">
                    <Button label="Unlock All" severity="warn" size="small" @click="unlockAllAchievements" />
                    <Button label="Reset All" severity="danger" size="small" @click="resetAchievements" />
                </div>
                <div class="debug-row">
                    <span>Unlocked: <strong>{{achievements.achievements.filter(a => a.unlocked).length}}</strong>/{{
                        achievements.achievements.length }}</span>
                </div>
            </section>

            <!-- Prestige Extended Section -->
            <section class="cheat-section">
                <h2 class="section-header">
                    <AppIcon icon="mdi:star-circle" class="section-icon text-purple" /> Prestige Advanced
                </h2>
                <div class="cheat-buttons">
                    <Button label="Max Upgrades" severity="warn" size="small" @click="unlockAllPrestigeUpgrades" />
                    <Button label="Unlock Milestones" severity="warn" size="small" @click="unlockAllMilestones" />
                    <Button label="Buy All Perks" severity="warn" size="small" @click="purchaseAllPerks" />
                    <Button label="Next Era" severity="success" size="small" @click="advanceEra" />
                </div>
                <div class="debug-row">
                    <span>Era: <strong>{{ prestige.currentEra?.name ?? 'None' }}</strong></span>
                    <span>Points: <strong class="text-purple">{{ prestige.points.toString() }}</strong></span>
                </div>
            </section>

            <!-- Multiplier Debug Section -->
            <section class="cheat-section cheat-section-wide">
                <h2 class="section-header">
                    <AppIcon icon="mdi:chart-bar" class="section-icon" /> Multipliers Overview
                </h2>
                <div class="multiplier-grid">
                    <div v-for="m in multiplierInfo" :key="m.name" class="multiplier-item"
                        :class="{ active: m.value > 1 }">
                        <span class="mul-name">{{ m.name }}</span>
                        <span class="mul-value" :class="{ bonus: m.value > 1, penalty: m.value < 1 }">×{{
                            m.value.toFixed(2) }}</span>
                    </div>
                </div>
            </section>
        </div>

        <!-- Log -->
        <section class="cheat-log-section">
            <h2 class="section-header">
                <AppIcon icon="mdi:console" class="section-icon" /> {{ t('dev.section_log') }}
            </h2>
            <div class="cheat-log">
                <div v-if="log.length === 0" class="log-empty">{{ t('dev.no_actions') }}</div>
                <div v-for="(entry, i) in log" :key="i" class="log-entry">{{ entry }}</div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.dev-badge {
    background: #ef4444;
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.25rem 0.75rem;
    border-radius: var(--t-radius-sm);
    letter-spacing: 0.1em;
    align-self: flex-start;
}

.cheat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--t-space-4);
    margin-top: var(--t-space-4);
}

.cheat-section {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-4);
    box-shadow: var(--t-shadow-sm);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.cheat-row {
    display: flex;
    gap: var(--t-space-2);
}

.input-group {
    display: flex;
    gap: var(--t-space-2);
    flex: 1;
}

.cheat-input {
    flex: 1;
    min-width: 80px;
    padding: 0.4rem 0.6rem;
    background: var(--t-bg-secondary);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text);
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
}

.cheat-input:focus {
    outline: none;
    border-color: var(--t-border-focus);
}

.cheat-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-2);
}

.text-gold {
    color: var(--t-warning, #f59e0b);
}

.text-sky {
    color: var(--t-info, #71717a);
}

.text-purple {
    color: #a855f7;
}

.text-emerald {
    color: var(--t-success, #10b981);
}

.cheat-log-section {
    margin-top: var(--t-space-6);
}

.cheat-log {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-3);
    box-shadow: var(--t-shadow-sm);
    max-height: 200px;
    overflow-y: auto;
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-xs);
}

.log-empty {
    color: var(--t-text-muted);
    text-align: center;
    padding: var(--t-space-3);
}

.log-entry {
    padding: 0.15rem 0;
    color: var(--t-text-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.log-entry:first-child {
    color: var(--t-text);
}

.text-orange {
    color: #f97316;
}

.text-red {
    color: #ef4444;
}

.text-muted {
    color: var(--t-text-muted);
}

.cheat-section-wide {
    grid-column: 1 / -1;
}

.startup-debug-info {
    background: var(--t-bg-secondary);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-2) var(--t-space-3);
}

.debug-row {
    display: flex;
    gap: var(--t-space-4);
    font-size: var(--t-font-size-sm);
    flex-wrap: wrap;
}

.startup-debug-opps {
    background: var(--t-bg-secondary);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-2) var(--t-space-3);
    max-height: 240px;
    overflow-y: auto;
}

.debug-subtitle {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    opacity: 0.6;
    margin-bottom: var(--t-space-2);
}

.debug-opp {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: 3px 0;
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    flex-wrap: wrap;
}

.debug-opp-name {
    font-weight: 600;
    min-width: 120px;
}

.debug-traits {
    display: flex;
    gap: var(--t-space-1);
    font-size: 0.65rem;
}

.debug-trait {
    padding: 0 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.05);
}

/* Additional color classes */
.text-cyan {
    color: #22d3ee;
}

.text-pink {
    color: #ec4899;
}

/* Multiplier Grid */
.multiplier-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--t-space-2);
}

.multiplier-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-secondary);
    border-radius: var(--t-radius-md);
    border: 1px solid transparent;
}

.multiplier-item.active {
    border-color: color-mix(in srgb, var(--t-accent) 30%, transparent);
    background: color-mix(in srgb, var(--t-accent) 8%, var(--t-bg-secondary));
}

.mul-name {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

.mul-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    color: var(--t-text-muted);
}

.mul-value.bonus {
    color: var(--t-success);
}

.mul-value.penalty {
    color: var(--t-warning);
}
</style>
