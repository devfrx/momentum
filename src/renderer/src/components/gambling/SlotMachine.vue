<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import SlotLever from './SlotLever.vue'
import { useFormat } from '@renderer/composables/useFormat'
import { usePlayerStore } from '@renderer/stores/usePlayerStore'
import { useGamblingStore } from '@renderer/stores/useGamblingStore'
import { D, ZERO, mul } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'
import { THEME } from '@renderer/assets/theme/colors'

const emit = defineEmits<{ back: [] }>()

const player = usePlayerStore()
const gambling = useGamblingStore()
const { formatCash } = useFormat()

// ─── Symbol definitions ─────────────────────────────────────
interface SlotSymbol {
    id: string
    icon: string       // Iconify icon id
    label: string
    color: string
    weight: number
}

const SYMBOLS: SlotSymbol[] = [
    { id: 'cherry', icon: 'mdi:fruit-cherries', label: 'Cherry', color: THEME.danger, weight: 25 },
    { id: 'lemon', icon: 'mdi:fruit-citrus', label: 'Lemon', color: THEME.gold, weight: 22 },
    { id: 'orange', icon: 'mdi:food-apple', label: 'Orange', color: THEME.orange, weight: 20 },
    { id: 'grape', icon: 'mdi:fruit-grapes', label: 'Grape', color: THEME.purple, weight: 17 },
    { id: 'bell', icon: 'mdi:bell', label: 'Bell', color: THEME.warning, weight: 10 },
    { id: 'bar', icon: 'mdi:view-dashboard', label: 'BAR', color: THEME.blue, weight: 4 },
    { id: 'seven', icon: 'mdi:numeric-7-box', label: '7', color: THEME.danger, weight: 2 },
]

const TOTAL_WEIGHT = SYMBOLS.reduce((s, sym) => s + sym.weight, 0)

// ─── Paytable ────────────────────────────────────────────────
// New rules:
// - 2 horizontal match → ×1
// - Pyramid (row 0+2 same + row 1 center same) → ×2
// - 3 horizontal top/bottom or diagonal → ×5
// - 3 horizontal center → ×10
// - 777 horizontal center → ×100
interface PaytableEntry {
    description: string
    multiplier: number
    pattern: string      // visual identifier for the paytable
}

const PAYTABLE: PaytableEntry[] = [
    { description: '777 on center row', multiplier: 100, pattern: '7-7-7 center' },
    { description: '3 match — center row', multiplier: 10, pattern: 'X-X-X center' },
    { description: '3 match — top/bottom row', multiplier: 5, pattern: 'X-X-X top/bottom' },
    { description: '3 match — diagonal', multiplier: 5, pattern: 'X-X-X diagonal' },
    { description: 'Pyramid (top+bottom & center match)', multiplier: 2, pattern: 'pyramid' },
    { description: '2 adjacent match — horizontal', multiplier: 1, pattern: 'X-X adjacent' },
]

// ─── Reel configuration ──────────────────────────────────────
const REEL_COUNT = 3
const VISIBLE_ROWS = 3
const REEL_SYMBOL_COUNT = 20
const SPIN_DURATION_BASE = 1200
const SPIN_STAGGER = 400

// ─── State ───────────────────────────────────────────────────
const betAmount = ref(10)
const spinning = ref(false)
const autoSpin = ref(false)
const autoSpinCount = ref(0)

const reelStrips = ref<SlotSymbol[][]>([])
const reelPositions = ref<number[]>([0, 0, 0])
const reelStopped = ref<boolean[]>([true, true, true])

// Result state
const resultGrid = ref<SlotSymbol[][]>([[], [], []]) // 3 reels × 3 visible rows
const winResult = ref<{ multiplier: number; description: string; payout: Decimal } | null>(null)
const showResult = ref(false)
const justWon = ref(false)
const luckyTriggered = ref(false)

// Winning cell coordinates: Set of "reel,row" strings
const winningCells = ref<Set<string>>(new Set())

// ─── Build virtual reel strips ───────────────────────────────
function buildReelStrip(): SlotSymbol[] {
    const strip: SlotSymbol[] = []
    for (const sym of SYMBOLS) {
        const count = Math.round((sym.weight / TOTAL_WEIGHT) * REEL_SYMBOL_COUNT)
        for (let i = 0; i < Math.max(1, count); i++) {
            strip.push(sym)
        }
    }
    for (let i = strip.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[strip[i], strip[j]] = [strip[j], strip[i]]
    }
    return strip
}

function initReels(): void {
    reelStrips.value = Array.from({ length: REEL_COUNT }, () => buildReelStrip())
    for (let r = 0; r < REEL_COUNT; r++) {
        reelPositions.value[r] = 0
        updateVisibleSymbols(r)
    }
}

function updateVisibleSymbols(reelIndex: number): void {
    const strip = reelStrips.value[reelIndex]
    if (!strip || strip.length === 0) return
    const pos = reelPositions.value[reelIndex]
    const visible: SlotSymbol[] = []
    for (let row = 0; row < VISIBLE_ROWS; row++) {
        visible.push(strip[(pos + row) % strip.length])
    }
    resultGrid.value[reelIndex] = visible
}

function pickSymbol(): SlotSymbol {
    let rand = Math.random() * TOTAL_WEIGHT
    for (const sym of SYMBOLS) {
        rand -= sym.weight
        if (rand <= 0) return sym
    }
    return SYMBOLS[0]
}

// ─── Payline evaluation ──────────────────────────────────────
// grid[reelIndex][rowIndex]
// Returns all winning lines with their contributing cells
interface WinLine {
    multiplier: number
    description: string
    cells: [number, number][] // [reel, row] pairs
}

function evaluateGrid(grid: SlotSymbol[][]): WinLine[] {
    const wins: WinLine[] = []

    // Helper: check if 3 symbols match
    const match3 = (a: SlotSymbol, b: SlotSymbol, c: SlotSymbol) => a.id === b.id && b.id === c.id
    // Helper: check if 2 ADJACENT symbols match (only pos 0-1 or 1-2, never 0-2)
    const match2adjacent = (syms: SlotSymbol[]): number[] => {
        if (syms[0].id === syms[1].id) return [0, 1]
        if (syms[1].id === syms[2].id) return [1, 2]
        return []
    }

    // ── 1. 777 center row (×100) ──
    const centerRow = [grid[0][1], grid[1][1], grid[2][1]]
    if (match3(centerRow[0], centerRow[1], centerRow[2]) && centerRow[0].id === 'seven') {
        wins.push({
            multiplier: 100,
            description: '777 JACKPOT!',
            cells: [[0, 1], [1, 1], [2, 1]],
        })
        return wins // Jackpot overrides everything
    }

    // ── 2. 3 match center row (×10) ──
    if (match3(centerRow[0], centerRow[1], centerRow[2])) {
        wins.push({
            multiplier: 10,
            description: `3x ${centerRow[0].label} — center`,
            cells: [[0, 1], [1, 1], [2, 1]],
        })
    }

    // ── 3. 3 match top row (×5) ──
    const topRow = [grid[0][0], grid[1][0], grid[2][0]]
    if (match3(topRow[0], topRow[1], topRow[2])) {
        wins.push({
            multiplier: 5,
            description: `3x ${topRow[0].label} — top`,
            cells: [[0, 0], [1, 0], [2, 0]],
        })
    }

    // ── 4. 3 match bottom row (×5) ──
    const bottomRow = [grid[0][2], grid[1][2], grid[2][2]]
    if (match3(bottomRow[0], bottomRow[1], bottomRow[2])) {
        wins.push({
            multiplier: 5,
            description: `3x ${bottomRow[0].label} — bottom`,
            cells: [[0, 2], [1, 2], [2, 2]],
        })
    }

    // ── 5. Diagonal top-left → bottom-right (×5) ──
    const diag1 = [grid[0][0], grid[1][1], grid[2][2]]
    if (match3(diag1[0], diag1[1], diag1[2])) {
        wins.push({
            multiplier: 5,
            description: `3x ${diag1[0].label} — diagonal`,
            cells: [[0, 0], [1, 1], [2, 2]],
        })
    }

    // ── 6. Diagonal bottom-left → top-right (×5) ──
    const diag2 = [grid[0][2], grid[1][1], grid[2][0]]
    if (match3(diag2[0], diag2[1], diag2[2])) {
        wins.push({
            multiplier: 5,
            description: `3x ${diag2[0].label} — diagonal`,
            cells: [[0, 2], [1, 1], [2, 0]],
        })
    }

    // ── 7. Pyramid (×2) ──
    // Center column center slot + two lateral slots from top or bottom row, all 3 equal
    // V-down: left-top [0,0], right-top [2,0], center [1,1]
    const vDown = [grid[0][0], grid[2][0], grid[1][1]]
    if (match3(vDown[0], vDown[1], vDown[2])) {
        wins.push({
            multiplier: 2,
            description: `Pyramid ${vDown[0].label}`,
            cells: [[0, 0], [2, 0], [1, 1]],
        })
    }
    // V-up: bottom-left, bottom-right, center = [0,2], [2,2], [1,1]
    const vUp = [grid[0][2], grid[2][2], grid[1][1]]
    if (match3(vUp[0], vUp[1], vUp[2])) {
        wins.push({
            multiplier: 2,
            description: `Pyramid ${vUp[0].label}`,
            cells: [[0, 2], [2, 2], [1, 1]],
        })
    }

    // ── 8. 2 match horizontal — any row (×1) ──
    // Only if no 3-match was found on that row
    const rows: { row: number; syms: SlotSymbol[] }[] = [
        { row: 0, syms: topRow },
        { row: 1, syms: centerRow },
        { row: 2, syms: bottomRow },
    ]
    for (const { row, syms } of rows) {
        // Skip if this row already has a 3-match win
        const has3 = wins.some(w =>
            w.cells.length === 3 &&
            w.cells.every(([, r]) => r === row) &&
            w.multiplier >= 5
        )
        if (has3) continue

        const pair = match2adjacent(syms)
        if (pair.length === 2) {
            wins.push({
                multiplier: 1,
                description: `2x ${syms[pair[0]].label}`,
                cells: pair.map(i => [i, row] as [number, number]),
            })
        }
    }

    return wins
}

// ─── Spin logic ──────────────────────────────────────────────
async function spin(): Promise<void> {
    const bet = D(betAmount.value)
    if (bet.lte(ZERO) || player.cash.lt(bet) || spinning.value) return
    if (!player.spendCash(bet)) return

    spinning.value = true
    showResult.value = false
    winResult.value = null
    justWon.value = false
    winningCells.value = new Set()
    reelStopped.value = [false, false, false]
    luckyTriggered.value = false

    // Determine final symbols for each reel (3 rows each)
    let finalGrid: SlotSymbol[][] = []
    for (let r = 0; r < REEL_COUNT; r++) {
        finalGrid.push([pickSymbol(), pickSymbol(), pickSymbol()])
    }

    // Luck gives second chance on loss
    let testWins = evaluateGrid(finalGrid)
    let luckyRespin = false
    if (testWins.length === 0) {
        const luckBonus = gambling.getLuckBonus()
        if (luckBonus > 0 && Math.random() < luckBonus) {
            luckyRespin = true
        }
    }

    if (luckyRespin) {
        // Show initial losing grid, then lucky banner, then re-spin
        const losingGrid = finalGrid

        // Animate to losing grid first
        const spinPromises1 = losingGrid.map((finalSymbols, reelIdx) =>
            animateReel(reelIdx, finalSymbols, SPIN_DURATION_BASE + reelIdx * SPIN_STAGGER)
        )
        await Promise.all(spinPromises1)
        resultGrid.value = losingGrid

        // Show lucky banner
        luckyTriggered.value = true
        await new Promise(resolve => setTimeout(resolve, 1400))
        luckyTriggered.value = false

        // Generate new re-roll grid
        finalGrid = []
        for (let r = 0; r < REEL_COUNT; r++) {
            finalGrid.push([pickSymbol(), pickSymbol(), pickSymbol()])
        }

        // Re-spin animation
        reelStopped.value = [false, false, false]
        const spinPromises2 = finalGrid.map((finalSymbols, reelIdx) =>
            animateReel(reelIdx, finalSymbols, SPIN_DURATION_BASE + reelIdx * SPIN_STAGGER)
        )
        await Promise.all(spinPromises2)
    } else {
        // Normal spin — animate to final grid
        const spinPromises = finalGrid.map((finalSymbols, reelIdx) =>
            animateReel(reelIdx, finalSymbols, SPIN_DURATION_BASE + reelIdx * SPIN_STAGGER)
        )
        await Promise.all(spinPromises)
    }

    // All reels stopped — evaluate
    resultGrid.value = finalGrid
    const winLines = evaluateGrid(finalGrid)

    if (winLines.length > 0) {
        const totalMultiplier = winLines.reduce((sum, w) => sum + w.multiplier, 0)
        const payout = mul(bet, totalMultiplier)

        // Collect all winning cells
        const cells = new Set<string>()
        for (const w of winLines) {
            for (const [reel, row] of w.cells) {
                cells.add(`${reel},${row}`)
            }
        }
        winningCells.value = cells

        player.earnCash(payout)
        gambling.recordWin('slots', bet, payout)

        const bestLine = winLines.reduce((best, w) => w.multiplier > best.multiplier ? w : best)
        winResult.value = {
            multiplier: totalMultiplier,
            description: winLines.length === 1
                ? bestLine.description
                : `${winLines.length} wins! Best: ${bestLine.description}`,
            payout,
        }
        justWon.value = true
    } else {
        gambling.recordLoss('slots', bet)
        winResult.value = null
    }

    showResult.value = true
    spinning.value = false

    // Continue auto-spin
    if (autoSpin.value) {
        autoSpinCount.value++
        if (player.cash.gte(bet)) {
            setTimeout(() => {
                if (autoSpin.value) spin()
            }, 800)
        } else {
            autoSpin.value = false
        }
    }
}

// ─── Reel animation ──────────────────────────────────────────
function animateReel(reelIdx: number, finalSymbols: SlotSymbol[], duration: number): Promise<void> {
    return new Promise((resolve) => {
        const startTime = performance.now()
        const cycleInterval = 60

        function tick(): void {
            const elapsed = performance.now() - startTime
            const progress = Math.min(1, elapsed / duration)

            if (progress < 1) {
                const speed = cycleInterval + progress * 200
                const row: SlotSymbol[] = [pickSymbol(), pickSymbol(), pickSymbol()]
                resultGrid.value[reelIdx] = row
                setTimeout(tick, speed * (0.5 + progress * 0.5))
            } else {
                resultGrid.value[reelIdx] = finalSymbols
                reelStopped.value[reelIdx] = true
                resolve()
            }
        }

        tick()
    })
}

// ─── Helpers ─────────────────────────────────────────────────
function isWinningCell(reel: number, row: number): boolean {
    return winningCells.value.has(`${reel},${row}`)
}

function setBet(amount: number): void {
    betAmount.value = Math.max(1, Math.min(amount, player.cash.toNumber()))
}

function halfBet(): void {
    setBet(Math.max(1, Math.floor(betAmount.value / 2)))
}

function doubleBet(): void {
    setBet(betAmount.value * 2)
}

function maxBet(): void {
    setBet(player.cash.toNumber())
}

function toggleAutoSpin(): void {
    if (autoSpin.value) {
        autoSpin.value = false
    } else {
        autoSpinCount.value = 0
        autoSpin.value = true
        if (!spinning.value) spin()
    }
}

// ─── Computed ────────────────────────────────────────────────
const stats = computed(() => gambling.getStats('slots'))
const canSpin = computed(() => !spinning.value && player.cash.gte(D(betAmount.value)) && betAmount.value > 0)
const showPaytable = ref(false)

// ─── Init ────────────────────────────────────────────────────
initReels()

watch(() => player.cash, (cash) => {
    if (autoSpin.value && cash.lt(D(betAmount.value))) {
        autoSpin.value = false
    }
})
</script>

<template>
    <div class="slot-machine">
        <!-- Header -->
        <div class="slot-header">
            <UButton variant="ghost" size="sm" icon="mdi:arrow-left" @click="$emit('back')">
                {{ $t('gambling.back') }}
            </UButton>
            <h2 class="slot-title">
                <AppIcon icon="mdi:slot-machine" class="title-icon" />
                {{ $t('gambling.sl_title') }}
            </h2>
            <UButton variant="ghost" size="sm" icon="mdi:table" @click="showPaytable = !showPaytable">
                {{ showPaytable ? $t('gambling.hide') : $t('gambling.sl_paytable') }}
            </UButton>
        </div>

        <!-- Paytable (collapsible) -->
        <Transition name="slide">
            <div v-if="showPaytable" class="paytable-panel">
                <h3 class="paytable-title">{{ $t('gambling.sl_paytable_title') }}</h3>
                <div class="paytable-grid">
                    <div v-for="entry in PAYTABLE" :key="entry.description" class="paytable-entry">
                        <span class="pt-pattern">{{ entry.pattern }}</span>
                        <span class="pt-desc">{{ entry.description }}</span>
                        <span class="pt-multi">x{{ entry.multiplier }}</span>
                    </div>
                </div>
                <p class="paytable-note">{{ $t('gambling.sl_paytable_note') }}</p>
            </div>
        </Transition>

        <!-- Reel area + Lever -->
        <div class="machine-body">
            <div class="reels-frame">
                <div class="reels-container">
                    <div v-for="(reel, ri) in resultGrid" :key="ri" class="reel"
                        :class="{ spinning: !reelStopped[ri] && spinning }">
                        <div v-for="(sym, si) in reel" :key="si" class="reel-cell" :class="{
                            dim: spinning && !reelStopped[ri],
                            'win-cell': showResult && justWon && isWinningCell(ri, si),
                        }">
                            <AppIcon :icon="sym.icon" class="symbol-icon" :style="{ color: sym.color }"
                                :class="{ 'symbol-bounce': showResult && justWon && isWinningCell(ri, si) }" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lever -->
            <div class="lever-area">
                <SlotLever :disabled="!canSpin" :spinning="spinning" @pull="spin" />
            </div>
        </div>

        <!-- Result Banner -->
        <Transition name="fade">
            <div v-if="showResult" class="result-area">
                <div v-if="winResult" class="win-banner">
                    <AppIcon icon="mdi:trophy" class="win-icon" />
                    <div class="win-info">
                        <span class="win-desc">{{ winResult.description }}</span>
                        <span class="win-amount">{{ formatCash(winResult.payout) }}</span>
                        <span class="win-multi">x{{ winResult.multiplier }} {{ $t('gambling.sl_multiplier_suffix')
                            }}</span>
                    </div>
                </div>
                <div v-else class="lose-banner">
                    <AppIcon icon="mdi:emoticon-neutral" class="lose-icon" />
                    <span>{{ $t('gambling.sl_no_match') }}</span>
                </div>
            </div>
        </Transition>

        <!-- Lucky second chance banner -->
        <Transition name="lucky">
            <div v-if="luckyTriggered" class="lucky-banner">
                <AppIcon icon="mdi:clover" class="lucky-icon" />
                <span class="lucky-text">{{ $t('gambling.lucky_trigger') }}</span>
            </div>
        </Transition>

        <!-- Controls -->
        <div class="controls-area">
            <div class="bet-section">
                <label class="bet-label">{{ $t('gambling.bet') }}</label>
                <div class="bet-row">
                    <UButton variant="ghost" size="xs" @click="halfBet">1/2</UButton>
                    <div class="bet-display">
                        <input type="number" v-model.number="betAmount" :min="1" :max="player.cash.toNumber()"
                            class="bet-input" :disabled="spinning" />
                    </div>
                    <UButton variant="ghost" size="xs" @click="doubleBet">x2</UButton>
                </div>
                <div class="bet-presets">
                    <UButton v-for="pct in [10, 25, 50]" :key="pct" variant="ghost" size="xs"
                        @click="setBet(Math.floor(player.cash.toNumber() * pct / 100))" :disabled="spinning">
                        {{ pct }}%
                    </UButton>
                    <UButton variant="warning" size="xs" @click="maxBet" :disabled="spinning">{{ $t('gambling.max')
                        }}</UButton>
                </div>
            </div>

            <UButton variant="ghost" size="sm" :active="autoSpin" @click="toggleAutoSpin">
                <AppIcon icon="mdi:autorenew" :class="{ 'spin-icon': autoSpin }" />
                {{ autoSpin ? $t('gambling.sl_auto_count', { n: autoSpinCount }) : $t('gambling.sl_auto') }}
            </UButton>
        </div>

        <!-- Stats -->
        <div class="slot-stats">
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_spins') }}</span>
                <span class="stat-value">{{ stats.played }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_wins') }}</span>
                <span class="stat-value">{{ stats.won }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">{{ $t('gambling.stats_win_rate') }}</span>
                <span class="stat-value">{{ stats.played > 0 ? Math.round(stats.won / stats.played * 100) : 0 }}%</span>
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
.slot-machine {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    width: 100%;
    height: 100%;
    min-height: 0;
}

/* ── Header ── */
.slot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--t-space-3);
}

.slot-title {
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

/* ── Paytable ── */
.paytable-panel {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-4);
}

.paytable-title {
    font-size: 0.9rem;
    font-weight: var(--t-font-semibold);
    margin-bottom: var(--t-space-3);
    color: var(--t-text-secondary);
}

.paytable-grid {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-1);
}

.paytable-entry {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-1) var(--t-space-2);
    border-radius: var(--t-radius-sm);
}

.paytable-entry:nth-child(odd) {
    background: var(--t-bg-muted);
}

.pt-pattern {
    font-family: var(--t-font-mono);
    font-size: 0.75rem;
    min-width: 110px;
    color: var(--t-text-muted);
}

.pt-desc {
    flex: 1;
    font-size: 0.85rem;
    color: var(--t-text-secondary);
}

.pt-multi {
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    color: var(--t-text-secondary);
    font-size: 0.95rem;
}

.paytable-note {
    margin-top: var(--t-space-2);
    font-size: 0.75rem;
    color: var(--t-text-muted);
    font-style: italic;
}

/* ── Machine Body (reels + lever) ── */
.machine-body {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: var(--t-space-3);
    align-items: stretch;
}

.lever-area {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-2) 0;
}

/* ── Reels ── */
.reels-frame {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-4);
    overflow: hidden;
}

.reels-container {
    flex: 1;
    display: flex;
    gap: var(--t-space-3);
    justify-content: center;
    align-items: stretch;
}

.reel {
    flex: 1;
    max-width: 200px;
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    padding: var(--t-space-3);
    transition: background 0.2s;
}

.reel.spinning {
    background: var(--t-bg-muted);
}

.reel-cell {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 72px;
    border-radius: var(--t-radius-md);
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.reel-cell.dim {
    opacity: 0.5;
}

.reel-cell.win-cell {
    background: var(--t-success-muted);
    box-shadow: 0 0 16px var(--t-success-muted);
}

.symbol-icon {
    font-size: clamp(2rem, 4vw, 3.5rem);
    line-height: 1;
    user-select: none;
    transition: transform 0.2s;
}

.symbol-bounce {
    animation: bounce 0.5s ease;
}

@keyframes bounce {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.3);
    }
}

/* ── Result ── */
.result-area {
    min-height: 60px;
}

.win-banner {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-success-muted);
    border: 1px solid var(--t-success);
    border-radius: var(--t-radius-lg);
    animation: bannerPop 0.3s ease;
}

.win-icon {
    font-size: 2rem;
    color: var(--t-success);
}

.win-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.win-desc {
    font-size: 0.85rem;
    color: var(--t-text-secondary);
}

.win-amount {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--t-success);
    font-family: var(--t-font-mono);
}

.win-multi {
    font-size: 0.75rem;
    color: var(--t-text-muted);
}

.lose-banner {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    color: var(--t-text-muted);
    font-size: 0.9rem;
}

.lose-icon {
    font-size: 1.5rem;
}

@keyframes bannerPop {
    0% {
        transform: scale(0.95);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ── Controls ── */
.controls-area {
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
    font-size: 0.7rem;
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
    font-size: 1.1rem;
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    padding: var(--t-space-2);
    background: var(--t-bg-sunken, var(--t-bg-muted));
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    color: var(--t-text);
    outline: none;
}

.bet-presets {
    display: flex;
    gap: 4px;
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

/* ── Stats ── */
.slot-stats {
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
.slide-enter-active,
.slide-leave-active {
    transition: all var(--t-transition-normal);
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
    max-height: 500px;
    opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity var(--t-transition-normal);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* ── Lucky banner ── */
.lucky-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-3);
    padding: var(--t-space-3) var(--t-space-5);
    border-radius: var(--t-radius-lg);
    background: linear-gradient(135deg, color-mix(in srgb, var(--t-success) 15%, transparent), color-mix(in srgb, var(--t-success) 5%, transparent));
    border: 1px solid color-mix(in srgb, var(--t-success) 40%, transparent);
    box-shadow: 0 0 24px color-mix(in srgb, var(--t-success) 25%, transparent);
    animation: luckyPulse 0.8s ease infinite alternate;
}

.lucky-icon {
    font-size: 2rem;
    color: var(--t-success);
    animation: luckyCloverSpin 1s ease;
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--t-success) 50%, transparent));
}

.lucky-text {
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--t-success);
    letter-spacing: 0.05em;
    text-shadow: 0 0 8px color-mix(in srgb, var(--t-success) 30%, transparent);
}

@keyframes luckyPulse {
    from {
        box-shadow: 0 0 16px color-mix(in srgb, var(--t-success) 20%, transparent);
    }

    to {
        box-shadow: 0 0 32px color-mix(in srgb, var(--t-success) 40%, transparent);
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
</style>
