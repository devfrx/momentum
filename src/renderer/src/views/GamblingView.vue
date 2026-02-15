<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import AppIcon from '@renderer/components/AppIcon.vue'
import { GameCard, SlotMachine, RouletteGame, CoinFlip, BlackjackGame, DiceGame, PlinkoGame, LotteryGame } from '@renderer/components/gambling'
import { CashDisplay } from '@renderer/components/dashboard'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import { EventImpactBanner } from '@renderer/components/events'

const gambling = useGamblingStore()
const player = usePlayerStore()
const { formatCash, formatNumber, formatPercent } = useFormat()
const { t } = useI18n()

type GameType = 'coinflip' | 'dice' | 'slots' | 'roulette' | 'blackjack' | 'plinko' | 'lottery'

/** Which full-screen mini-game is open (null = lobby) */
const activeSubGame = ref<GameType | null>(null)

// ─── Luck bonus (from skills, prestige, events) ─────────────
const luckBonus = computed(() => {
    const mul = gambling.getLuckMultiplier()
    return mul > 1 ? `+${formatPercent(mul - 1)}` : t('gambling.no_bonus')
})

// ─── Stats for the header ribbon ─────────────────────────────
const overallStats = computed(() => {
    const winRate = gambling.gamesPlayed > 0
        ? Math.round((Object.values(gambling.gameStats).reduce((s, g) => s + g.won, 0) / gambling.gamesPlayed) * 100)
        : 0
    return [
        { label: t('gambling.luck_bonus'), value: luckBonus.value, icon: 'mdi:clover', colorClass: gambling.getLuckMultiplier() > 1 ? 'bonus' : '' },
        { label: t('gambling.played'), value: formatNumber(gambling.gamesPlayed), icon: 'mdi:gamepad-variant-outline' },
        { label: t('gambling.win_rate'), value: `${winRate}%`, icon: 'mdi:percent-outline' },
        { label: t('gambling.net'), value: formatCash(gambling.netProfit), icon: 'mdi:chart-line', colorClass: gambling.netProfit.gte(0) ? 'positive' : 'negative' },
        { label: t('gambling.best_win'), value: formatCash(gambling.biggestWin), icon: 'mdi:trophy-outline' },
    ]
})

// ─── Game definitions ────────────────────────────────────────
const games = computed(() => [
    {
        id: 'blackjack' as GameType,
        name: t('gambling.game_blackjack'),
        icon: 'mdi:cards-playing-spade',
        description: t('gambling.game_blackjack_desc'),
        odds: t('gambling.odds_49'),
        payout: t('gambling.payout_2x_3x'),
        category: t('gambling.category_table'),
        accent: '#22c55e',
        luckMechanic: t('gambling.luck_anti_bust'),
    },
    {
        id: 'roulette' as GameType,
        name: t('gambling.game_roulette'),
        icon: 'mdi:record-circle',
        description: t('gambling.game_roulette_desc'),
        odds: t('gambling.odds_48'),
        payout: t('gambling.payout_2x_36x'),
        category: t('gambling.category_table'),
        accent: '#ef4444',
        luckMechanic: t('gambling.luck_second_chance'),
    },
    {
        id: 'slots' as GameType,
        name: t('gambling.game_slots'),
        icon: 'mdi:slot-machine',
        description: t('gambling.game_slots_desc'),
        odds: t('gambling.odds_25'),
        payout: t('gambling.payout_100x'),
        category: t('gambling.category_machine'),
        accent: '#a855f7',
        luckMechanic: t('gambling.luck_second_chance'),
    },
    {
        id: 'coinflip' as GameType,
        name: t('gambling.game_coinflip'),
        icon: 'mdi:circle-half-full',
        description: t('gambling.game_coinflip_desc'),
        odds: t('gambling.odds_50'),
        payout: t('gambling.payout_2x'),
        category: t('gambling.category_quick'),
        accent: '#f59e0b',
        luckMechanic: t('gambling.luck_second_chance'),
    },
    {
        id: 'dice' as GameType,
        name: t('gambling.game_dice'),
        icon: 'mdi:dice-6',
        description: t('gambling.game_dice_desc'),
        odds: t('gambling.odds_variable'),
        payout: t('gambling.odds_variable'),
        category: t('gambling.category_quick'),
        accent: '#71717a',
        luckMechanic: t('gambling.luck_second_chance'),
    },
    {
        id: 'plinko' as GameType,
        name: t('gambling.game_plinko'),
        icon: 'mdi:triangle-outline',
        description: t('gambling.game_plinko_desc'),
        odds: t('gambling.odds_variable'),
        payout: t('gambling.payout_30x'),
        category: t('gambling.category_machine'),
        accent: '#f59e0b',
        luckMechanic: '',
    },
    {
        id: 'lottery' as GameType,
        name: t('gambling.game_lottery'),
        icon: 'mdi:ticket',
        description: t('gambling.game_lottery_desc'),
        odds: t('gambling.odds_variable'),
        payout: t('gambling.payout_100000x'),
        category: t('gambling.category_draw'),
        accent: '#06b6d4',
        luckMechanic: [t('gambling.luck_second_chance'), t('gambling.luck_rolling_luck')],
    },
])

const gamblingInfoSections = computed<InfoSection[]>(() => [
    {
        title: t('gambling.info_lobby.games.title'),
        icon: 'mdi:gamepad-variant',
        entries: [
            { term: t('gambling.info_lobby.games.blackjack'), desc: t('gambling.info_lobby.games.blackjack_desc'), icon: 'mdi:cards-playing-spade' },
            { term: t('gambling.info_lobby.games.roulette'), desc: t('gambling.info_lobby.games.roulette_desc'), icon: 'mdi:record-circle' },
            { term: t('gambling.info_lobby.games.slots'), desc: t('gambling.info_lobby.games.slots_desc'), icon: 'mdi:slot-machine' },
            { term: t('gambling.info_lobby.games.coinflip'), desc: t('gambling.info_lobby.games.coinflip_desc'), icon: 'mdi:circle-half-full' },
            { term: t('gambling.info_lobby.games.dice'), desc: t('gambling.info_lobby.games.dice_desc'), icon: 'mdi:dice-6' },
            { term: t('gambling.info_lobby.games.plinko'), desc: t('gambling.info_lobby.games.plinko_desc'), icon: 'mdi:triangle-outline' },
            { term: t('gambling.info_lobby.games.lottery'), desc: t('gambling.info_lobby.games.lottery_desc'), icon: 'mdi:ticket' },
        ],
    },
    {
        title: t('gambling.info_lobby.luck.title'),
        icon: 'mdi:clover',
        entries: [
            { term: t('gambling.info_lobby.luck.bonus'), desc: t('gambling.info_lobby.luck.bonus_desc'), icon: 'mdi:percent' },
            { term: t('gambling.info_lobby.luck.formula'), desc: t('gambling.info_lobby.luck.formula_desc'), icon: 'mdi:function-variant' },
            { term: t('gambling.info_lobby.luck.second_chance'), desc: t('gambling.info_lobby.luck.second_chance_desc'), icon: 'mdi:refresh' },
            { term: t('gambling.info_lobby.luck.biased_random'), desc: t('gambling.info_lobby.luck.biased_random_desc'), icon: 'mdi:scale-unbalanced' },
        ],
    },
    {
        title: t('gambling.info_lobby.stats.title'),
        icon: 'mdi:chart-bar',
        entries: [
            { term: t('gambling.info_lobby.stats.per_game'), desc: t('gambling.info_lobby.stats.per_game_desc'), icon: 'mdi:format-list-bulleted' },
            { term: t('gambling.info_lobby.stats.win_rate'), desc: t('gambling.info_lobby.stats.win_rate_desc'), icon: 'mdi:percent-outline' },
            { term: t('gambling.info_lobby.stats.xp'), desc: t('gambling.info_lobby.stats.xp_desc'), icon: 'mdi:star-circle' },
        ],
    },
    {
        title: t('gambling.info_lobby.divine.title'),
        icon: 'mdi:shimmer',
        entries: [
            { term: t('gambling.info_lobby.divine.what'), desc: t('gambling.info_lobby.divine.what_desc'), icon: 'mdi:help-circle-outline' },
            { term: t('gambling.info_lobby.divine.effect'), desc: t('gambling.info_lobby.divine.effect_desc'), icon: 'mdi:multiplication' },
            { term: t('gambling.info_lobby.divine.persist'), desc: t('gambling.info_lobby.divine.persist_desc'), icon: 'mdi:shield-star' },
        ],
    },
])
</script>

<template>
    <div class="page-container">
        <!-- Slot Machine Sub-Game -->
        <SlotMachine v-if="activeSubGame === 'slots'" @back="activeSubGame = null" />

        <!-- Roulette Sub-Game -->
        <RouletteGame v-else-if="activeSubGame === 'roulette'" @back="activeSubGame = null" />

        <!-- Coin Flip Sub-Game -->
        <CoinFlip v-else-if="activeSubGame === 'coinflip'" @back="activeSubGame = null" />

        <!-- Blackjack Sub-Game -->
        <BlackjackGame v-else-if="activeSubGame === 'blackjack'" @back="activeSubGame = null" />

        <!-- Dice Roll Sub-Game -->
        <DiceGame v-else-if="activeSubGame === 'dice'" @back="activeSubGame = null" />

        <!-- Plinko Sub-Game -->
        <PlinkoGame v-else-if="activeSubGame === 'plinko'" @back="activeSubGame = null" />

        <!-- Lottery Sub-Game -->
        <LotteryGame v-else-if="activeSubGame === 'lottery'" @back="activeSubGame = null" />

        <!-- Casino Lobby -->
        <template v-else>
            <!-- Header -->
            <div class="casino-header">
                <div>
                    <h1 class="page-title">
                        <AppIcon icon="mdi:cards-playing" class="page-title-icon" />
                        {{ $t('gambling.title') }}
                    </h1>
                    <p class="page-subtitle">{{ $t('gambling.subtitle') }}</p>
                </div>
                <CashDisplay :label="$t('gambling.balance')" :value="formatCash(player.cash)" />
            </div>

            <!-- Event Impact -->
            <EventImpactBanner route-name="gambling" />

            <!-- Stats Ribbon -->
            <div class="stats-bar">
                <div v-for="stat in overallStats" :key="stat.label" class="stat-chip">
                    <AppIcon :icon="stat.icon" class="stat-chip-icon" />
                    <span class="stat-chip-label">{{ stat.label }}</span>
                    <span class="stat-chip-value" :class="stat.colorClass">{{ stat.value }}</span>
                </div>
            </div>

            <!-- Games Grid -->
            <div class="casino-grid">
                <GameCard v-for="game in games" :key="game.id" :name="game.name" :icon="game.icon"
                    :description="game.description" :odds="game.odds" :payout="game.payout" :category="game.category"
                    :accent="game.accent" :luck-mechanic="game.luckMechanic"
                    :games-played="gambling.getStats(game.id).played"
                    :wins="formatNumber(gambling.getStats(game.id).won)"
                    :losses="formatNumber(gambling.getStats(game.id).played - gambling.getStats(game.id).won)"
                    :net-profit="formatCash(gambling.getStats(game.id).netProfit)"
                    :is-profitable="gambling.getStats(game.id).netProfit.gte(0)" @play="activeSubGame = game.id" />
            </div>

            <!-- Info Panel -->
            <InfoPanel :title="$t('gambling.info_title')" :description="$t('gambling.info_desc')"
                :sections="gamblingInfoSections" />
        </template>
    </div>
</template>

<style scoped>
.casino-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--t-space-4);
}

.stats-bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--t-space-3);
}

.stat-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.85rem;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    font-size: var(--t-font-size-sm);
    transition: border-color var(--t-transition-normal);
}

.stat-chip:hover {
    border-color: var(--t-border-hover);
}

.stat-chip-icon {
    font-size: 1rem;
    color: var(--t-text-muted);
}

.stat-chip-label {
    color: var(--t-text-muted);
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-chip-value {
    font-family: var(--t-font-mono);
    font-weight: 600;
    color: var(--t-text);
}

.stat-chip-value.bonus {
    color: var(--t-green);
}

.stat-chip-value.positive {
    color: var(--t-green);
}

.stat-chip-value.negative {
    color: var(--t-red);
}

.casino-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: var(--t-space-4);
}
</style>
