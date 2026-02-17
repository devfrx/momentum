<script setup lang="ts">
/**
 * PlinkoGame — Full Plinko mini-game view.
 *
 * Features:
 * - Risk level (low / medium / high) with distinct payout curves
 * - Row count selection (8 / 12 / 16) for board complexity
 * - Bet controls with presets, half/double/max
 * - Animated ball drop with physics simulation
 * - Result history showing last drops
 * - Auto-drop mode for rapid play
 * - Full integration with gambling store (XP, gambling_luck, stats)
 * - Info panel with odds & payout tables
 */
import { useI18n } from 'vue-i18n'
import { ref, computed, onUnmounted } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import InfoPanel from '@renderer/components/layout/InfoPanel.vue'
import type { InfoSection } from '@renderer/components/layout/InfoPanel.vue'
import PlinkoBoard from './PlinkoBoard.vue'
import { useFormat } from '@renderer/composables/useFormat'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { D, mul } from '@renderer/core/BigNum'
import { PlinkoEngine, type PlinkoRisk } from '@renderer/core/PlinkoEngine'
import { THEME, RISK_COLORS } from '@renderer/assets/theme/colors'

const emit = defineEmits<{ back: [] }>()

const { t } = useI18n()
const player = usePlayerStore()
const gambling = useGamblingStore()
const { formatCash, formatNumber } = useFormat()

// ─── Board configuration ─────────────────────────────────────
const BOARD_WIDTH = 560
const BOARD_HEIGHT = 600

const selectedRows = ref<number>(12)
const selectedRisk = ref<PlinkoRisk>('medium')

// ─── Speed control ───────────────────────────────────────────
export type BallSpeed = 0.5 | 1 | 2 | 4
const selectedSpeed = ref<BallSpeed>(1)
const speedOptions: { value: BallSpeed; label: string; icon: string }[] = [
    { value: 0.5, label: '0.5×', icon: 'mdi:play-speed' },
    { value: 1, label: '1×', icon: 'mdi:play' },
    { value: 2, label: '2×', icon: 'mdi:fast-forward' },
    { value: 4, label: '4×', icon: 'mdi:skip-forward' },
]

const rowOptions = PlinkoEngine.getRowOptions()
const riskOptions = PlinkoEngine.getRiskOptions()

const riskMeta: Record<PlinkoRisk, { label: string; color: string; icon: string }> = {
    low: { label: t('gambling.pk_low'), color: RISK_COLORS.low, icon: 'mdi:shield-check' },
    medium: { label: t('gambling.pk_medium'), color: RISK_COLORS.medium, icon: 'mdi:shield-alert' },
    high: { label: t('gambling.pk_high'), color: RISK_COLORS.high, icon: 'mdi:shield-off' },
}

// ─── Bet state ──────────────────────────────────────────────
const betAmount = ref(10)
const dropping = ref(false)
const autoDrop = ref(false)
let autoDropInterval: ReturnType<typeof setInterval> | null = null

// ─── Result history ─────────────────────────────────────────
interface DropResult {
    id: number
    multiplier: number
    payout: string
    won: boolean
    color: string
}
const lastResults = ref<DropResult[]>([])
const lastMultiplier = ref<number | null>(null)
const showResultFlash = ref(false)

// ─── Board ref ──────────────────────────────────────────────
const boardRef = ref<InstanceType<typeof PlinkoBoard> | null>(null)

// ─── Computed ───────────────────────────────────────────────
const betDecimal = computed(() => D(betAmount.value))
const canDrop = computed(() =>
    betAmount.value > 0 &&
    player.cash.gte(betDecimal.value) &&
    !dropping.value
)
const stats = computed(() => gambling.getStats('plinko'))

// Build a preview multiplier table for the current config
const previewBuckets = computed(() => {
    const eng = new PlinkoEngine({
        rows: selectedRows.value,
        risk: selectedRisk.value,
        boardWidth: BOARD_WIDTH,
        boardHeight: BOARD_HEIGHT,
    })
    return eng.buckets
})

/** Auto-drop interval scaled by speed */
const autoDropDelay = computed(() => Math.max(120, 500 / selectedSpeed.value))

const maxMultiplier = computed(() =>
    Math.max(...previewBuckets.value.map(b => b.multiplier))
)

// ─── Drop logic ─────────────────────────────────────────────
function drop(): void {
    if (!canDrop.value) return
    if (!player.spendCash(betDecimal.value)) return

    dropping.value = true
    showResultFlash.value = false
    lastMultiplier.value = null

    boardRef.value?.dropBall()

    // The dropping flag resets fast-enough to allow queued drops if auto
    setTimeout(() => {
        dropping.value = false
    }, 300)
}

function onBallLanded(bucketIndex: number, multiplier: number, _ballId: number): void {
    const payoutAmount = mul(betDecimal.value, multiplier)
    const isWin = multiplier >= 1

    if (isWin) {
        player.earnCash(payoutAmount)
        gambling.recordWin('plinko', betDecimal.value, payoutAmount)
    } else {
        // Partial return: the payout is less than the bet
        if (multiplier > 0) {
            player.earnCash(payoutAmount)
        }
        gambling.recordLoss('plinko', betDecimal.value)
    }

    // Update result display
    lastMultiplier.value = multiplier
    showResultFlash.value = true

    const result: DropResult = {
        id: Date.now(),
        multiplier,
        payout: formatCash(isWin ? payoutAmount : payoutAmount),
        won: isWin,
        color: previewBuckets.value[bucketIndex]?.color ?? THEME.info,
    }
    lastResults.value.unshift(result)
    if (lastResults.value.length > 20) lastResults.value.pop()

    setTimeout(() => {
        showResultFlash.value = false
    }, 1500)
}

// ─── Auto-drop ──────────────────────────────────────────────
function toggleAutoDrop(): void {
    autoDrop.value = !autoDrop.value
    if (autoDrop.value) {
        autoDropInterval = setInterval(() => {
            if (canDrop.value) {
                drop()
            } else if (!player.cash.gte(betDecimal.value)) {
                // Stop if insufficient funds
                autoDrop.value = false
                if (autoDropInterval) clearInterval(autoDropInterval)
                autoDropInterval = null
            }
        }, autoDropDelay.value)
    } else {
        if (autoDropInterval) clearInterval(autoDropInterval)
        autoDropInterval = null
    }
}

onUnmounted(() => {
    if (autoDropInterval) clearInterval(autoDropInterval)
})

// ─── Bet helpers ────────────────────────────────────────────
function setBet(amount: number): void {
    betAmount.value = Math.max(1, Math.min(amount, player.cash.toNumber()))
}
function halfBet(): void { setBet(Math.max(1, Math.floor(betAmount.value / 2))) }
function doubleBet(): void { setBet(betAmount.value * 2) }
function maxBet(): void { setBet(player.cash.toNumber()) }

// ─── Info Panel ─────────────────────────────────────────────
const plinkoInfo = computed<InfoSection[]>(() => [
    {
        title: t('gambling.info.plinko.how_title'),
        icon: 'mdi:help-circle-outline',
        entries: [
            { term: t('gambling.info.plinko.set_bet'), desc: t('gambling.info.plinko.set_bet_desc'), icon: 'mdi:cash' },
            { term: t('gambling.info.plinko.pick_rows'), desc: t('gambling.info.plinko.pick_rows_desc'), icon: 'mdi:grid' },
            { term: t('gambling.info.plinko.choose_risk'), desc: t('gambling.info.plinko.choose_risk_desc'), icon: 'mdi:shield-alert' },
            { term: t('gambling.info.plinko.drop_ball'), desc: t('gambling.info.plinko.drop_ball_desc'), icon: 'mdi:arrow-down-bold' },
        ]
    },
    {
        title: t('gambling.info.plinko.multipliers_title'),
        icon: 'mdi:cash-multiple',
        entries: [
            { term: t('gambling.info.plinko.center'), desc: t('gambling.info.plinko.center_desc'), icon: 'mdi:chart-bell-curve' },
            { term: t('gambling.info.plinko.edge'), desc: t('gambling.info.plinko.edge_desc'), icon: 'mdi:trophy' },
            { term: t('gambling.info.plinko.luck'), desc: t('gambling.info.plinko.luck_desc'), icon: 'mdi:clover' },
        ]
    },
    {
        title: t('gambling.info.plinko.max_title'),
        icon: 'mdi:star-circle',
        entries: [
            { term: t('gambling.info.plinko.low'), desc: t('gambling.info.plinko.low_desc'), icon: 'mdi:shield-check' },
            { term: t('gambling.info.plinko.medium'), desc: t('gambling.info.plinko.medium_desc'), icon: 'mdi:shield-alert' },
            { term: t('gambling.info.plinko.high'), desc: t('gambling.info.plinko.high_desc'), icon: 'mdi:shield-off' },
        ]
    }
])
</script>

<template>
    <div class="plinko-game">
        <!-- Header -->
        <div class="pk-header">
            <UButton variant="ghost" size="sm" icon="mdi:arrow-left" @click="$emit('back')">
                {{ $t('gambling.back') }}
            </UButton>
            <h2 class="pk-title">
                <AppIcon icon="mdi:triangle-outline" class="title-icon" />
                {{ $t('gambling.pk_title') }}
            </h2>
            <div class="balance-chip">
                <AppIcon icon="mdi:cash" />
                {{ formatCash(player.cash) }}
            </div>
        </div>

        <!-- Main area: Board + Controls side by side -->
        <div class="pk-main">
            <!-- Board -->
            <div class="pk-board-col">
                <!-- Result flash overlay -->
                <Transition name="pop">
                    <div v-if="showResultFlash && lastMultiplier !== null" class="result-flash"
                        :class="lastMultiplier >= 1 ? 'flash-win' : 'flash-lose'">
                        <span class="flash-mult">{{ lastMultiplier }}×</span>
                        <span class="flash-label">{{ lastMultiplier >= 1 ? $t('gambling.pk_win') :
                            $t('gambling.pk_loss') }}</span>
                    </div>
                </Transition>

                <PlinkoBoard ref="boardRef" :rows="selectedRows" :risk="selectedRisk" :width="BOARD_WIDTH"
                    :height="BOARD_HEIGHT" :speed="selectedSpeed" @ball-landed="onBallLanded" />
            </div>

            <!-- Controls panel -->
            <div class="pk-controls-col">
                <!-- Risk selector -->
                <div class="control-group">
                    <label class="control-label">{{ $t('gambling.pk_risk') }}</label>
                    <div class="risk-selector">
                        <UButton variant="ghost" size="xs" v-for="r in riskOptions" :key="r"
                            :active="selectedRisk === r" :style="{
                                '--risk-color': riskMeta[r].color,
                            }" @click="selectedRisk = r" :disabled="autoDrop" :icon="riskMeta[r].icon">
                            <span>{{ riskMeta[r].label }}</span>
                        </UButton>
                    </div>
                </div>

                <!-- Row selector -->
                <div class="control-group">
                    <label class="control-label">{{ $t('gambling.pk_rows') }}</label>
                    <div class="row-selector">
                        <UButton variant="ghost" size="xs" v-for="r in rowOptions" :key="r" :active="selectedRows === r"
                            @click="selectedRows = r" :disabled="autoDrop">
                            {{ r }}
                        </UButton>
                    </div>
                </div>

                <!-- Speed selector -->
                <div class="control-group">
                    <label class="control-label">{{ $t('gambling.pk_speed') }}</label>
                    <div class="speed-selector">
                        <UButton variant="ghost" size="xs" v-for="s in speedOptions" :key="s.value"
                            :active="selectedSpeed === s.value" @click="selectedSpeed = s.value" :icon="s.icon">
                            <span>{{ s.label }}</span>
                        </UButton>
                    </div>
                </div>

                <!-- Bet controls -->
                <div class="control-group">
                    <label class="control-label">{{ $t('gambling.bet_amount') }}</label>
                    <div class="bet-row">
                        <UButton variant="ghost" size="xs" @click="halfBet" :disabled="autoDrop">1/2</UButton>
                        <div class="bet-display">
                            <input type="number" v-model.number="betAmount" :min="1" :max="player.cash.toNumber()"
                                class="bet-input" :disabled="autoDrop" />
                        </div>
                        <UButton variant="ghost" size="xs" @click="doubleBet" :disabled="autoDrop">×2</UButton>
                    </div>
                    <div class="bet-presets">
                        <UButton variant="ghost" size="xs" v-for="pct in [10, 25, 50]" :key="pct"
                            @click="setBet(Math.floor(player.cash.toNumber() * pct / 100))" :disabled="autoDrop">
                            {{ pct }}%
                        </UButton>
                        <UButton variant="warning" size="xs" @click="maxBet" :disabled="autoDrop">{{
                            $t('gambling.max')
                        }}</UButton>
                    </div>
                </div>

                <!-- Max multiplier display -->
                <div class="max-mult-display">
                    <span class="max-mult-label">{{ $t('gambling.pk_max_payout') }}</span>
                    <span class="max-mult-value">{{ maxMultiplier }}×</span>
                </div>

                <!-- Action buttons -->
                <div class="action-buttons">
                    <UButton variant="primary" :disabled="!canDrop && !autoDrop" @click="drop"
                        :icon="dropping ? 'mdi:loading' : 'mdi:arrow-down-bold'">
                        {{ $t('gambling.pk_drop') }}
                    </UButton>
                    <UButton variant="ghost" size="sm" :active="autoDrop" @click="toggleAutoDrop"
                        :icon="autoDrop ? 'mdi:stop' : 'mdi:autorenew'">
                        {{ autoDrop ? $t('gambling.pk_stop') : $t('gambling.pk_auto') }}
                    </UButton>
                </div>

                <!-- Result history -->
                <div class="result-history" v-if="lastResults.length > 0">
                    <label class="control-label">{{ $t('gambling.pk_recent') }}</label>
                    <div class="history-chips">
                        <TransitionGroup name="chip">
                            <span v-for="r in lastResults.slice(0, 12)" :key="r.id" class="history-chip"
                                :class="r.won ? 'chip-win' : 'chip-lose'" :style="{ borderColor: r.color }">
                                {{ r.multiplier }}×
                            </span>
                        </TransitionGroup>
                    </div>
                </div>
            </div>
        </div>

        <!-- Info Panel -->
        <InfoPanel :title="$t('gambling.pk_odds')" :sections="plinkoInfo" />

        <!-- Stats -->
        <div class="pk-stats">
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_drops') }}</span>
                <span class="stat-value">{{ formatNumber(stats.played) }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_wins') }}</span>
                <span class="stat-value">{{ formatNumber(stats.won) }}</span>
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
.plinko-game {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    width: 100%;
    height: 100%;
    min-height: 0;
}

/* ── Header ── */
.pk-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--t-space-3);
}

.pk-title {
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

/* ── Main layout ── */
.pk-main {
    display: flex;
    gap: var(--t-space-4);
    align-items: stretch;
    flex: 1;
    min-height: 0;
}

.pk-board-col {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.pk-controls-col {
    flex: 0 0 280px;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    max-width: 300px;
    overflow-y: auto;
}

/* ── Result flash overlay ── */
.result-flash {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: var(--t-space-3) var(--t-space-5);
    border-radius: var(--t-radius-lg);
    pointer-events: none;
    animation: flashPulse 1.5s ease-out forwards;
}

.flash-win {
    background: color-mix(in srgb, var(--t-success) 20%, transparent);
    border: 2px solid var(--t-success);
}

.flash-lose {
    background: color-mix(in srgb, var(--t-danger) 20%, transparent);
    border: 2px solid var(--t-danger);
}

.flash-mult {
    font-size: 2rem;
    font-weight: 900;
    font-family: var(--t-font-mono);
}

.flash-win .flash-mult {
    color: var(--t-success);
}

.flash-lose .flash-mult {
    color: var(--t-danger);
}

.flash-label {
    font-size: 0.75rem;
    font-weight: var(--t-font-bold);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--t-text-muted);
}

@keyframes flashPulse {
    0% {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 0;
    }

    15% {
        transform: translate(-50%, -50%) scale(1.1);
        opacity: 1;
    }

    30% {
        transform: translate(-50%, -50%) scale(1);
    }

    80% {
        opacity: 1;
    }

    100% {
        opacity: 0;
    }
}

/* ── Control groups ── */
.control-group {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-3);
}

.control-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
}

/* ── Risk selector ── */
.risk-selector {
    display: flex;
    gap: var(--t-space-2);
}

.risk-icon {
    font-size: 1.2rem;
}

/* ── Row selector ── */
.row-selector {
    display: flex;
    gap: var(--t-space-2);
}

/* ── Speed selector ── */
.speed-selector {
    display: flex;
    gap: var(--t-space-2);
}

.speed-icon {
    font-size: 1rem;
}

/* ── Bet controls ── */
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

/* ── Max multiplier display ── */
.max-mult-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
}

.max-mult-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: var(--t-font-bold);
    color: var(--t-text-muted);
}

.max-mult-value {
    font-family: var(--t-font-mono);
    font-weight: 800;
    font-size: 1.1rem;
    color: var(--t-warning);
}

/* ── Action buttons ── */
.action-buttons {
    display: flex;
    gap: var(--t-space-2);
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

/* ── Result history ── */
.result-history {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-3);
}

.history-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.history-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: var(--t-radius-sm);
    font-family: var(--t-font-mono);
    font-size: 0.7rem;
    font-weight: var(--t-font-bold);
    border: 1px solid;
}

.chip-win {
    background: var(--t-success-muted);
    color: var(--t-success);
}

.chip-lose {
    background: var(--t-bg-muted);
    color: var(--t-text-muted);
}

.chip-enter-active {
    transition: all var(--t-transition-normal);
}

.chip-leave-active {
    transition: all var(--t-transition-fast);
}

.chip-enter-from {
    transform: scale(0.8);
    opacity: 0;
}

.chip-leave-to {
    opacity: 0;
}

/* ── Stats ── */
.pk-stats {
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
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
}

.pop-leave-to {
    opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 800px) {
    .pk-main {
        flex-direction: column;
        align-items: stretch;
    }

    .pk-controls-col {
        max-width: 100%;
    }
}
</style>
