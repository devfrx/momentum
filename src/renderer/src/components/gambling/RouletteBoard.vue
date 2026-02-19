<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@renderer/components/AppIcon.vue'

export type RouletteBetType =
    | 'straight'   // single number (36:1)
    | 'red'        // red   (1:1)
    | 'black'      // black (1:1)
    | 'odd'        // odd   (1:1)
    | 'even'       // even  (1:1)
    | 'low'        // 1-18  (1:1)
    | 'high'       // 19-36 (1:1)
    | 'dozen1'     // 1-12  (2:1)
    | 'dozen2'     // 13-24 (2:1)
    | 'dozen3'     // 25-36 (2:1)
    | 'col1'       // column 1 (2:1)
    | 'col2'       // column 2 (2:1)
    | 'col3'       // column 3 (2:1)

export interface RouletteBet {
    type: RouletteBetType
    number?: number    // only for 'straight'
    label: string
}

const props = defineProps<{
    activeBets: RouletteBet[]
    disabled?: boolean
}>()

const emit = defineEmits<{
    bet: [bet: RouletteBet]
}>()

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

const { t } = useI18n()

function getColor(n: number): 'red' | 'black' | 'green' {
    if (n === 0) return 'green'
    return RED_NUMBERS.has(n) ? 'red' : 'black'
}

// Grid layout: 3 columns × 12 rows (numbers 1-36)
const numberGrid = computed(() => {
    const rows: number[][] = []
    for (let row = 0; row < 12; row++) {
        const base = row * 3
        rows.push([base + 3, base + 2, base + 1]) // 3,2,1 / 6,5,4 ...
    }
    return rows
})

function isActive(type: RouletteBetType, number?: number): boolean {
    return props.activeBets.some(b => b.type === type && b.number === number)
}

function placeBet(type: RouletteBetType, number?: number): void {
    if (props.disabled) return
    const labels: Record<string, string> = {
        red: t('gambling.rl_red'), black: t('gambling.rl_black'), odd: t('gambling.rl_odd'), even: t('gambling.rl_even'),
        low: t('gambling.rl_low'), high: t('gambling.rl_high'),
        dozen1: t('gambling.rl_1st12'), dozen2: t('gambling.rl_2nd12'), dozen3: t('gambling.rl_3rd12'),
        col1: t('gambling.rl_col1'), col2: t('gambling.rl_col2'), col3: t('gambling.rl_col3'),
    }
    emit('bet', {
        type,
        number: type === 'straight' ? number : undefined,
        label: type === 'straight' ? `${number}` : labels[type] || type,
    })
}
</script>

<template>
    <div class="roulette-board" :class="{ disabled }">
        <!-- Zero -->
        <div class="board-zero" :class="{ active: isActive('straight', 0) }" @click="placeBet('straight', 0)">
            <span class="cell-num green">0</span>
        </div>

        <!-- Number grid -->
        <div class="board-grid">
            <template v-for="row in numberGrid" :key="row[0]">
                <div v-for="num in row" :key="num" class="board-cell" :class="{ active: isActive('straight', num) }"
                    @click="placeBet('straight', num)">
                    <span class="cell-num" :class="getColor(num)">{{ num }}</span>
                </div>
            </template>
        </div>

        <!-- Column bets (bottom of grid) -->
        <div class="board-columns">
            <div class="col-bet" :class="{ active: isActive('col1') }" @click="placeBet('col1')">{{
                $t('gambling.rl_2to1') }}
            </div>
            <div class="col-bet" :class="{ active: isActive('col2') }" @click="placeBet('col2')">{{
                $t('gambling.rl_2to1') }}
            </div>
            <div class="col-bet" :class="{ active: isActive('col3') }" @click="placeBet('col3')">{{
                $t('gambling.rl_2to1') }}
            </div>
        </div>

        <!-- Dozen bets -->
        <div class="board-dozens">
            <div class="dozen-bet" :class="{ active: isActive('dozen1') }" @click="placeBet('dozen1')">{{
                $t('gambling.rl_1st12') }}</div>
            <div class="dozen-bet" :class="{ active: isActive('dozen2') }" @click="placeBet('dozen2')">{{
                $t('gambling.rl_2nd12') }}</div>
            <div class="dozen-bet" :class="{ active: isActive('dozen3') }" @click="placeBet('dozen3')">{{
                $t('gambling.rl_3rd12') }}</div>
        </div>

        <!-- Outside bets -->
        <div class="board-outside">
            <div class="outside-bet" :class="{ active: isActive('low') }" @click="placeBet('low')">{{
                $t('gambling.rl_low') }}
            </div>
            <div class="outside-bet" :class="{ active: isActive('even') }" @click="placeBet('even')">{{
                $t('gambling.rl_even')
                }}</div>
            <div class="outside-bet color-bet red-bet" :class="{ active: isActive('red') }" @click="placeBet('red')">
                <AppIcon icon="mdi:diamond" />
            </div>
            <div class="outside-bet color-bet black-bet" :class="{ active: isActive('black') }"
                @click="placeBet('black')">
                <AppIcon icon="mdi:diamond" />
            </div>
            <div class="outside-bet" :class="{ active: isActive('odd') }" @click="placeBet('odd')">{{
                $t('gambling.rl_odd') }}
            </div>
            <div class="outside-bet" :class="{ active: isActive('high') }" @click="placeBet('high')">{{
                $t('gambling.rl_high')
                }}</div>
        </div>
    </div>
</template>

<style scoped>
.roulette-board {
    --roulette-red: var(--t-gamble-roulette-red);
    --roulette-black: var(--t-gamble-roulette-black);
    --roulette-green: var(--t-gamble-roulette-green);

    display: flex;
    flex-direction: column;
    gap: 2px;
    user-select: none;
}

.roulette-board.disabled {
    opacity: 0.5;
    pointer-events: none;
}

/* ── Zero ── */
.board-zero {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md) var(--t-radius-md) 0 0;
    padding: var(--t-space-2);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.board-zero:hover {
    background: var(--t-bg-card-hover, var(--t-bg-hover));
}

.board-zero.active {
    outline: 2px solid var(--t-accent);
    outline-offset: -2px;
}

/* ── Number grid ── */
.board-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
}

.board-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-1) var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    cursor: pointer;
    transition: all var(--t-transition-fast);
    min-height: 32px;
}

.board-cell:hover {
    background: var(--t-bg-card-hover, var(--t-bg-hover));
    z-index: 1;
}

.board-cell.active {
    outline: 2px solid var(--t-accent);
    outline-offset: -2px;
}

.cell-num {
    font-size: 0.8rem;
    font-weight: var(--t-font-bold);
    font-family: var(--t-font-mono);
}

.cell-num.red {
    color: var(--roulette-red);
}

.cell-num.black {
    color: var(--t-text);
}

.cell-num.green {
    color: var(--roulette-green);
}

/* ── Column bets ── */
.board-columns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
}

.col-bet {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-1);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: var(--t-font-bold);
    color: var(--t-text-secondary);
    transition: all var(--t-transition-fast);
}

.col-bet:hover {
    background: var(--t-bg-card-hover, var(--t-bg-hover));
}

.col-bet.active {
    outline: 2px solid var(--t-accent);
    outline-offset: -2px;
}

/* ── Dozen bets ── */
.board-dozens {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
}

.dozen-bet {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: var(--t-font-bold);
    color: var(--t-text-secondary);
    transition: all var(--t-transition-fast);
}

.dozen-bet:hover {
    background: var(--t-bg-card-hover, var(--t-bg-hover));
}

.dozen-bet.active {
    outline: 2px solid var(--t-accent);
    outline-offset: -2px;
}

/* ── Outside bets ── */
.board-outside {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 2px;
    border-radius: 0 0 var(--t-radius-md) var(--t-radius-md);
    overflow: hidden;
}

.outside-bet {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--t-space-2);
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: var(--t-font-bold);
    color: var(--t-text-secondary);
    transition: all var(--t-transition-fast);
}

.outside-bet:hover {
    background: var(--t-bg-card-hover, var(--t-bg-hover));
}

.outside-bet.active {
    outline: 2px solid var(--t-accent);
    outline-offset: -2px;
}

.color-bet {
    font-size: 1rem;
}

.red-bet {
    color: var(--roulette-red);
}

.black-bet {
    color: var(--t-text);
}
</style>
