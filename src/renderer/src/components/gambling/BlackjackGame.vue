<script setup lang="ts">
/**
 * BlackjackGame — Full blackjack sub-game orchestrator.
 *
 * Rules:
 *  - Standard 6-deck shoe (312 cards), reshuffled when < 60 remain
 *  - Dealer stands on soft 17
 *  - Blackjack pays 3:2 (2.5× bet)
 *  - Double down: one extra card, bet doubled
 *  - No split (simplified for incremental tycoon)
 *  - Insurance not offered
 */
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import BlackjackHand from './BlackjackHand.vue'
import BlackjackCard from './BlackjackCard.vue'
import type { CardData } from './BlackjackCard.vue'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import { useFormat } from '@renderer/composables/useFormat'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { D, ZERO, mul, add } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'

const emit = defineEmits<{ back: [] }>()

const { t } = useI18n()
const player = usePlayerStore()
const gambling = useGamblingStore()
const { formatCash } = useFormat()

// ─── Types ───────────────────────────────────────────────────
type Phase = 'betting' | 'playing' | 'dealer-turn' | 'result'
type Outcome = 'win' | 'lose' | 'push' | 'blackjack' | 'bust'

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
const RANK_VALUES: Record<string, number> = {
    A: 11, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, '10': 10, J: 10, Q: 10, K: 10,
}

// ─── Deck (6-deck shoe) ──────────────────────────────────────
let shoe: CardData[] = []

function buildShoe(): void {
    shoe = []
    for (let d = 0; d < 6; d++) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                shoe.push({ suit, rank, value: RANK_VALUES[rank] })
            }
        }
    }
    shuffleArray(shoe)
}

function shuffleArray<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
}

function drawCard(hidden = false): CardData {
    if (shoe.length < 60) buildShoe()
    const card = shoe.pop()!
    return { ...card, hidden }
}

/**
 * Draw a card with luck - if the card would bust the player, luck gives a chance to redraw.
 * Luck can only trigger once per hand.
 */
function drawCardWithLuck(): CardData {
    const card = drawCard()
    // Check if this card would ACTUALLY bust (accounting for soft aces)
    const wouldBustScore = calcScore([...playerCards, card])
    if (wouldBustScore > 21 && !luckyUsedThisHand.value) {
        const luckBonus = gambling.getLuckBonus()
        if (luckBonus > 0 && Math.random() < luckBonus) {
            // Store the bust card as discarded
            discardedCard.value = { ...card }
            // Redraw - put bad card back and try again
            shoe.push(card)
            shuffleArray(shoe)
            // Mark luck as used this hand
            luckyUsedThisHand.value = true
            // Track which card index will get the glow
            luckyCardIndex.value = playerCards.length
            // Show lucky flash
            luckyTriggered.value = true
            setTimeout(() => { luckyTriggered.value = false }, 1600)
            return drawCard()
        }
    }
    return card
}

// Init shoe
buildShoe()

// ─── Game state ──────────────────────────────────────────────
const phase = ref<Phase>('betting')
const outcome = ref<Outcome | null>(null)
const betAmount = ref(10)
const currentBet = ref(ZERO)
const doubled = ref(false)

const playerCards = reactive<CardData[]>([])
const dealerCards = reactive<CardData[]>([])
/** When luck saves from bust, briefly show clover flash */
const luckyTriggered = ref(false)
/** The card that would have caused bust (shown as discarded) */
const discardedCard = ref<CardData | null>(null)
/** Index of the player card that was drawn by luck (for glow) */
const luckyCardIndex = ref<number | null>(null)
/** Guard: luck can trigger only once per hand */
const luckyUsedThisHand = ref(false)
// ─── Score calculation ───────────────────────────────────────
function calcScore(cards: CardData[]): number {
    let score = 0
    let aces = 0
    for (const c of cards) {
        if (c.hidden) continue
        score += c.value
        if (c.rank === 'A') aces++
    }
    while (score > 21 && aces > 0) {
        score -= 10
        aces--
    }
    return score
}

const playerScore = computed(() => calcScore(playerCards))
const dealerScore = computed(() => calcScore(dealerCards))
const playerBust = computed(() => playerScore.value > 21)
const dealerBust = computed(() => dealerScore.value > 21)
const isPlayerBlackjack = computed(() => playerCards.length === 2 && playerScore.value === 21)
const isDealerBlackjack = computed(() => {
    const allRevealed = dealerCards.every(c => !c.hidden)
    return allRevealed && dealerCards.length === 2 && calcScore(dealerCards) === 21
})

const canHit = computed(() => phase.value === 'playing' && !playerBust.value)
const canStand = computed(() => phase.value === 'playing')
const canDouble = computed(() =>
    phase.value === 'playing' &&
    playerCards.length === 2 &&
    !doubled.value &&
    player.cash.gte(currentBet.value)
)

// ─── Deal ────────────────────────────────────────────────────
function deal(): void {
    const bet = D(betAmount.value)
    if (bet.lte(ZERO) || player.cash.lt(bet)) return
    if (!player.spendCash(bet)) return

    currentBet.value = bet
    doubled.value = false
    outcome.value = null
    playerCards.length = 0
    dealerCards.length = 0
    discardedCard.value = null
    luckyCardIndex.value = null
    luckyUsedThisHand.value = false
    luckyTriggered.value = false

    // Deal initial cards
    playerCards.push(drawCard())
    dealerCards.push(drawCard())
    playerCards.push(drawCard())
    dealerCards.push(drawCard(true)) // hidden

    phase.value = 'playing'

    // Check for immediate blackjack
    if (isPlayerBlackjack.value) {
        revealDealer()
        if (isDealerBlackjack.value) {
            // Both have blackjack — push (tie)
            settleRound('push')
        } else {
            settleRound('blackjack')
        }
    }
}

// ─── Player actions ──────────────────────────────────────────
function hit(): void {
    if (!canHit.value) return
    playerCards.push(drawCardWithLuck())
    if (playerBust.value) {
        revealDealer()
        settleRound('bust')
    }
}

function stand(): void {
    if (!canStand.value) return
    revealDealer()
    dealerPlay()
}

function doubleDown(): void {
    if (!canDouble.value) return
    if (!player.spendCash(currentBet.value)) return
    currentBet.value = add(currentBet.value, currentBet.value)
    doubled.value = true
    playerCards.push(drawCardWithLuck())
    if (playerBust.value) {
        revealDealer()
        settleRound('bust')
    } else {
        revealDealer()
        dealerPlay()
    }
}

// ─── Dealer logic ────────────────────────────────────────────
function revealDealer(): void {
    for (const c of dealerCards) c.hidden = false
}

function dealerPlay(): void {
    phase.value = 'dealer-turn'
    dealerDrawLoop()
}

function dealerDrawLoop(): void {
    const score = calcScore(dealerCards)
    if (score < 17) {
        setTimeout(() => {
            dealerCards.push(drawCard())
            dealerDrawLoop()
        }, 600)
    } else {
        setTimeout(() => resolveHands(), 400)
    }
}

function resolveHands(): void {
    const ps = calcScore(playerCards)
    const ds = calcScore(dealerCards)

    if (ds > 21) {
        settleRound('win')
    } else if (ps > ds) {
        settleRound('win')
    } else if (ps < ds) {
        settleRound('lose')
    } else {
        settleRound('push')
    }
}

// ─── Settlement ──────────────────────────────────────────────
const lastPayout = ref<Decimal | null>(null)

function settleRound(result: Outcome): void {
    outcome.value = result
    phase.value = 'result'

    switch (result) {
        case 'blackjack': {
            // 3:2 payout — bet back + 1.5× bet
            const pay = mul(currentBet.value, 2.5)
            player.earnCash(pay)
            gambling.recordWin('blackjack', currentBet.value, pay)
            lastPayout.value = pay
            break
        }
        case 'win': {
            const pay = mul(currentBet.value, 2)
            player.earnCash(pay)
            gambling.recordWin('blackjack', currentBet.value, pay)
            lastPayout.value = pay
            break
        }
        case 'push': {
            // Return bet
            player.earnCash(currentBet.value)
            // Push is neither win nor loss — record as win with 0 net
            gambling.recordWin('blackjack', currentBet.value, currentBet.value)
            lastPayout.value = null
            break
        }
        case 'bust':
        case 'lose': {
            gambling.recordLoss('blackjack', currentBet.value)
            lastPayout.value = null
            break
        }
    }
}

function newRound(): void {
    phase.value = 'betting'
    outcome.value = null
    lastPayout.value = null
    playerCards.length = 0
    dealerCards.length = 0
    discardedCard.value = null
    luckyCardIndex.value = null
    luckyUsedThisHand.value = false
    luckyTriggered.value = false
}

// ─── Bet helpers ─────────────────────────────────────────────
function setBet(amount: number): void {
    betAmount.value = Math.max(1, Math.min(amount, player.cash.toNumber()))
}
function halfBet(): void { setBet(Math.max(1, Math.floor(betAmount.value / 2))) }
function doubleBet(): void { setBet(betAmount.value * 2) }
function maxBet(): void { setBet(player.cash.toNumber()) }

// ─── Computed ────────────────────────────────────────────────
const stats = computed(() => gambling.getStats('blackjack'))
const isBetting = computed(() => phase.value === 'betting')
const canDeal = computed(() => isBetting.value && betAmount.value > 0 && player.cash.gte(D(betAmount.value)))

const outcomeLabel = computed(() => {
    switch (outcome.value) {
        case 'blackjack': return t('gambling.bj_blackjack')
        case 'win': return t('gambling.bj_you_win')
        case 'push': return t('gambling.bj_push')
        case 'bust': return t('gambling.bj_bust')
        case 'lose': return t('gambling.bj_dealer_wins')
        default: return ''
    }
})

const outcomeClass = computed(() => {
    switch (outcome.value) {
        case 'blackjack':
        case 'win': return 'outcome-win'
        case 'push': return 'outcome-push'
        default: return 'outcome-lose'
    }
})

// ─── Info Panel ──────────────────────────────────────────────
const bjInfo = computed<InfoSection[]>(() => [
    {
        title: t('gambling.info.blackjack.how_title'),
        icon: 'mdi:help-circle-outline',
        entries: [
            { term: t('gambling.info.blackjack.objective'), desc: t('gambling.info.blackjack.objective_desc'), icon: 'mdi:bullseye-arrow' },
            { term: t('gambling.info.blackjack.card_values'), desc: t('gambling.info.blackjack.card_values_desc'), icon: 'mdi:cards-playing' },
            { term: t('gambling.info.blackjack.dealer_rules'), desc: t('gambling.info.blackjack.dealer_rules_desc'), icon: 'mdi:robot' },
        ]
    },
    {
        title: t('gambling.info.blackjack.actions_title'),
        icon: 'mdi:gesture-tap',
        entries: [
            { term: t('gambling.info.blackjack.hit'), desc: t('gambling.info.blackjack.hit_desc'), icon: 'mdi:plus-circle' },
            { term: t('gambling.info.blackjack.stand'), desc: t('gambling.info.blackjack.stand_desc'), icon: 'mdi:hand-back-right' },
            { term: t('gambling.info.blackjack.double_down'), desc: t('gambling.info.blackjack.double_down_desc'), icon: 'mdi:arrow-up-bold-circle' },
        ]
    },
    {
        title: t('gambling.info.blackjack.payout_title'),
        icon: 'mdi:cash-multiple',
        entries: [
            { term: t('gambling.info.blackjack.win'), desc: t('gambling.info.blackjack.win_desc'), icon: 'mdi:check-circle' },
            { term: t('gambling.info.blackjack.blackjack'), desc: t('gambling.info.blackjack.blackjack_desc'), icon: 'mdi:star' },
            { term: t('gambling.info.blackjack.push'), desc: t('gambling.info.blackjack.push_desc'), icon: 'mdi:equal' },
            { term: t('gambling.info.blackjack.bust'), desc: t('gambling.info.blackjack.bust_desc'), icon: 'mdi:close-circle' },
        ]
    },
])
</script>

<template>
    <div class="bj-game">
        <!-- Header -->
        <div class="bj-header">
            <UButton variant="ghost" size="sm" icon="mdi:arrow-left" @click="$emit('back')">
                {{ $t('gambling.back') }}
            </UButton>
            <h2 class="bj-title">
                <AppIcon icon="mdi:cards-playing-spade" class="title-icon" />
                {{ $t('gambling.bj_title') }}
            </h2>
            <div class="balance-chip">
                <AppIcon icon="mdi:cash" />
                {{ formatCash(player.cash) }}
            </div>
        </div>

        <!-- Table -->
        <div class="bj-table">
            <!-- Dealer hand -->
            <BlackjackHand :label="$t('gambling.bj_dealer')" :cards="dealerCards" :score="dealerScore"
                :bust="dealerBust && phase === 'result'" :blackjack="isDealerBlackjack && phase === 'result'" />

            <!-- Outcome badge -->
            <Transition name="pop">
                <div v-if="phase === 'result'" class="outcome-badge" :class="outcomeClass">
                    {{ outcomeLabel }}
                    <span v-if="lastPayout" class="outcome-amount">{{ formatCash(lastPayout) }}</span>
                </div>
            </Transition>

            <!-- Divider -->
            <div class="table-divider">
                <div class="divider-line"></div>
                <span v-if="phase !== 'betting'" class="bet-tag">
                    <AppIcon icon="mdi:poker-chip" /> {{ formatCash(currentBet) }}
                </span>
                <div class="divider-line"></div>
            </div>

            <!-- Player hand -->
            <BlackjackHand :label="$t('gambling.bj_you')" :cards="playerCards" :score="playerScore" :bust="playerBust"
                :blackjack="isPlayerBlackjack" :glow-index="luckyCardIndex" />

            <!-- Discarded bust card + Lucky anti-bust indicator -->
            <Transition name="lucky">
                <div v-if="luckyTriggered" class="lucky-row">
                    <div class="lucky-banner">
                        <AppIcon icon="mdi:clover" class="lucky-icon" />
                        <span class="lucky-text">{{ $t('gambling.lucky_trigger') }}</span>
                    </div>
                </div>
            </Transition>

            <!-- Discarded card (the one that would have busted) -->
            <Transition name="pop">
                <div v-if="discardedCard && phase !== 'betting'" class="discarded-area">
                    <span class="discarded-label">{{ $t('gambling.bj_discarded') }}</span>
                    <div class="discarded-card-wrapper">
                        <BlackjackCard :card="discardedCard" />
                        <AppIcon icon="mdi:close-circle" class="discard-x" />
                    </div>
                </div>
            </Transition>
        </div>

        <!-- Action buttons (during play) -->
        <div v-if="phase === 'playing'" class="action-buttons">
            <UButton variant="ghost" icon="mdi:plus-circle" :disabled="!canHit" @click="hit">
                {{ $t('gambling.bj_hit') }}
            </UButton>
            <UButton variant="ghost" icon="mdi:hand-back-right" :disabled="!canStand" @click="stand">
                {{ $t('gambling.bj_stand') }}
            </UButton>
            <UButton variant="ghost" icon="mdi:arrow-up-bold-circle" :disabled="!canDouble" @click="doubleDown">
                {{ $t('gambling.bj_double') }}
            </UButton>
        </div>

        <!-- Dealer turn indicator -->
        <div v-if="phase === 'dealer-turn'" class="dealer-thinking">
            <AppIcon icon="mdi:loading" class="spin-icon" />
            {{ $t('gambling.bj_dealer_playing') }}
        </div>

        <!-- New round button -->
        <div v-if="phase === 'result'" class="result-actions">
            <UButton variant="primary" icon="mdi:refresh" @click="newRound">
                {{ $t('gambling.new_round') }}
            </UButton>
        </div>

        <!-- Betting controls (before deal) -->
        <div v-if="isBetting" class="controls-row">
            <div class="bet-section">
                <label class="bet-label">{{ $t('gambling.bet_amount') }}</label>
                <div class="bet-row">
                    <UButton variant="ghost" size="xs" @click="halfBet">1/2</UButton>
                    <div class="bet-display">
                        <input type="number" v-model.number="betAmount" :min="1" :max="player.cash.toNumber()"
                            class="bet-input" />
                    </div>
                    <UButton variant="ghost" size="xs" @click="doubleBet">x2</UButton>
                </div>
                <div class="bet-presets">
                    <UButton v-for="pct in [10, 25, 50]" :key="pct"
                        @click="setBet(Math.floor(player.cash.toNumber() * pct / 100))">
                        {{ pct }}%
                    </UButton>
                    <UButton variant="warning" size="xs" @click="maxBet">{{ $t('gambling.max') }}</UButton>
                </div>
            </div>

            <div class="action-col">
                <UButton variant="primary" icon="mdi:cards-playing" :disabled="!canDeal" @click="deal">
                    {{ $t('gambling.bj_deal') }}
                </UButton>
            </div>
        </div>

        <!-- Info Panel -->
        <InfoPanel :title="$t('gambling.bj_rules')" :sections="bjInfo" />

        <!-- Stats -->
        <div class="bj-stats">
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_hands') }}</span>
                <span class="stat-value">{{ stats.played }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_wins') }}</span>
                <span class="stat-value">{{ stats.won }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_win_rate') }}</span>
                <span class="stat-value">
                    {{ stats.played > 0 ? Math.round(stats.won / stats.played * 100) : 0 }}%
                </span>
            </div>
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_net') }}</span>
                <span class="stat-value" :class="stats.netProfit.gte(0) ? 'success' : 'danger'">
                    {{ formatCash(stats.netProfit) }}
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bj-game {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    width: 100%;
    height: 100%;
    min-height: 0;
}

/* ── Header ── */
.bj-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--t-space-3);
}

.bj-title {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    font-size: 1.3rem;
    font-weight: var(--t-font-bold);
}

.title-icon {
    font-size: 1.1rem;
    color: var(--t-text-secondary);
}

.balance-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-success);
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    font-size: 0.85rem;
}

/* ── Table ── */
.bj-table {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--t-space-4);
    padding: var(--t-space-5) var(--t-space-4);
    background: radial-gradient(ellipse at center, var(--t-gamble-felt-light) 0%, var(--t-gamble-felt) 70%, var(--t-gamble-felt) 100%);
    border: 3px solid var(--t-gamble-felt-border);
    border-radius: var(--t-radius-xl, 16px);
    box-shadow: inset 0 0 40px var(--t-overlay-light), 0 4px 20px var(--t-overlay-light);
    min-height: 320px;
    position: relative;
}

/* ── Outcome badge ── */
.outcome-badge {
    font-size: 1.4rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    padding: var(--t-space-2) var(--t-space-5);
    border-radius: var(--t-radius-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    animation: badgePop 0.35s ease;
}

.outcome-win {
    background: var(--t-success-muted);
    border: 2px solid var(--t-gamble-win);
    color: var(--t-gamble-win);
}

.outcome-lose {
    background: var(--t-danger-muted);
    border: 2px solid var(--t-gamble-lose);
    color: var(--t-gamble-lose);
}

.outcome-push {
    background: var(--t-gold-muted);
    border: 2px solid var(--t-gamble-push);
    color: var(--t-gamble-push);
}

.outcome-amount {
    font-size: 1.1rem;
    font-family: var(--t-font-mono);
}

@keyframes badgePop {
    0% {
        transform: scale(0.8);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ── Table divider ── */
.table-divider {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    width: 100%;
    max-width: 400px;
}

.divider-line {
    flex: 1;
    height: 1px;
    background: var(--t-overlay-light);
}

.bet-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    font-weight: var(--t-font-bold);
    color: var(--t-gold);
    background: var(--t-overlay-light);
    padding: 4px 12px;
    border-radius: var(--t-radius-xl);
    font-family: var(--t-font-mono);
}

/* ── Action buttons ── */
.action-buttons {
    display: flex;
    gap: var(--t-space-3);
    justify-content: center;
}

.dealer-thinking {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    color: var(--t-text-muted);
    font-weight: var(--t-font-semibold);
}

.spin-icon {
    animation: spinAnim 1s linear infinite;
}

@keyframes spinAnim {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.result-actions {
    display: flex;
    justify-content: center;
}

/* ── Controls (betting phase) ── */
.controls-row {
    display: flex;
    gap: var(--t-space-3);
    align-items: center;
}

.bet-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-3);
}

.bet-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
}

.bet-row {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.bet-display {
    flex: 1;
}

.bet-input {
    width: 100%;
    text-align: center;
    font-size: 1rem;
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text);
    outline: none;
}

.bet-presets {
    display: flex;
    gap: 4px;
}

.action-col {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    min-width: 130px;
}

/* ── Stats ── */
.bj-stats {
    display: flex;
    gap: var(--t-space-4);
    justify-content: space-evenly;
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--t-text-muted);
}

.stat-value {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    font-size: 1rem;
}

.success {
    color: var(--t-success);
}

.danger {
    color: var(--t-danger);
}

/* ── Transitions ── */
.pop-enter-active {
    transition: all var(--t-transition-normal);
}

.pop-leave-active {
    transition: all var(--t-transition-fast);
}

.pop-enter-from {
    transform: scale(0.8);
    opacity: 0;
}

.pop-leave-to {
    opacity: 0;
}

/* ── Lucky banner ── */
.lucky-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-3);
}

.lucky-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-3);
    padding: var(--t-space-2) var(--t-space-4);
    border-radius: var(--t-radius-lg);
    background: linear-gradient(135deg, var(--t-success-muted), transparent);
    border: 1px solid var(--t-success);
    box-shadow: 0 0 24px var(--t-success-muted);
    animation: luckyPulse 0.8s ease infinite alternate;
}

.lucky-icon {
    font-size: 1.5rem;
    color: var(--t-success);
    animation: luckyCloverSpin 1s ease;
    filter: drop-shadow(0 0 6px var(--t-success-muted));
}

.lucky-text {
    font-size: 1rem;
    font-weight: 800;
    color: var(--t-success);
    letter-spacing: 0.05em;
    text-shadow: 0 0 8px var(--t-success-muted);
}

@keyframes luckyPulse {
    from {
        box-shadow: 0 0 16px var(--t-success-muted);
    }

    to {
        box-shadow: 0 0 32px var(--t-success-muted);
    }
}

@keyframes luckyCloverSpin {
    0% {
        transform: scale(0) rotate(-180deg);
        opacity: 0;
    }

    50% {
        transform: scale(1.3) rotate(10deg);
        opacity: 1;
    }

    100% {
        transform: scale(1) rotate(0deg);
    }
}

.lucky-enter-active {
    animation: luckyIn 0.5s ease;
}

.lucky-leave-active {
    animation: luckyOut 0.3s ease;
}

@keyframes luckyIn {
    0% {
        transform: scale(0.5) translateY(-10px);
        opacity: 0;
    }

    60% {
        transform: scale(1.1) translateY(0);
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes luckyOut {
    to {
        transform: scale(0.8) translateY(10px);
        opacity: 0;
    }
}

/* ── Discarded card ── */
.discarded-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    position: absolute;
    right: var(--t-space-3);
    bottom: var(--t-space-3);
    opacity: 0.7;
}

.discarded-label {
    font-size: 0.6rem;
    font-weight: var(--t-font-bold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--t-danger);
}

.discarded-card-wrapper {
    position: relative;
    transform: scale(0.7) rotate(-8deg);
    filter: grayscale(0.4) brightness(0.8);
}

.discard-x {
    position: absolute;
    top: -6px;
    right: -6px;
    font-size: 1.2rem;
    color: var(--t-danger);
    filter: drop-shadow(0 0 2px var(--t-overlay));
}
</style>
