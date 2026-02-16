<script setup lang="ts">
/**
 * LotteryTicket — Interactive number picker for a single lottery ticket.
 *
 * Displays a grid of numbers the player can pick from,
 * optional bonus number selection, and ticket cost info.
 * Emits the selected numbers when the player confirms.
 */
import { ref, computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import type { LotteryTicketDef } from '@renderer/data/lottery'

const props = defineProps<{
    ticket: LotteryTicketDef
    disabled: boolean
}>()

const emit = defineEmits<{
    play: [numbers: number[], bonus: number | null]
}>()

// ─── State ───────────────────────────────────────────────────
const selectedNumbers = ref<Set<number>>(new Set())
const selectedBonus = ref<number | null>(null)

// ─── Computed ────────────────────────────────────────────────
const mainNumbers = computed(() =>
    Array.from({ length: props.ticket.maxNumber }, (_, i) => i + 1)
)
const bonusNumbers = computed(() =>
    props.ticket.hasBonus
        ? Array.from({ length: props.ticket.bonusMax }, (_, i) => i + 1)
        : []
)
const isComplete = computed(() => {
    const mainOk = selectedNumbers.value.size === props.ticket.pickCount
    const bonusOk = !props.ticket.hasBonus || selectedBonus.value !== null
    return mainOk && bonusOk
})
const remaining = computed(() => props.ticket.pickCount - selectedNumbers.value.size)

// ─── Actions ─────────────────────────────────────────────────
function toggleNumber(n: number): void {
    if (props.disabled) return
    const set = new Set(selectedNumbers.value)
    if (set.has(n)) {
        set.delete(n)
    } else if (set.size < props.ticket.pickCount) {
        set.add(n)
    }
    selectedNumbers.value = set
}

function toggleBonus(n: number): void {
    if (props.disabled) return
    selectedBonus.value = selectedBonus.value === n ? null : n
}

function quickPick(): void {
    if (props.disabled) return
    const nums = new Set<number>()
    while (nums.size < props.ticket.pickCount) {
        nums.add(Math.floor(Math.random() * props.ticket.maxNumber) + 1)
    }
    selectedNumbers.value = nums
    if (props.ticket.hasBonus) {
        selectedBonus.value = Math.floor(Math.random() * props.ticket.bonusMax) + 1
    }
}

function clearSelection(): void {
    selectedNumbers.value = new Set()
    selectedBonus.value = null
}

function confirmPlay(): void {
    if (!isComplete.value || props.disabled) return
    const nums = Array.from(selectedNumbers.value).sort((a, b) => a - b)
    emit('play', nums, selectedBonus.value)
    // Reset after play
    clearSelection()
}
</script>

<template>
    <div class="lottery-ticket" :style="{ '--ticket-accent': ticket.accent }">
        <!-- Ticket Header -->
        <div class="ticket-header">
            <div class="ticket-icon-box">
                <AppIcon :icon="ticket.icon" class="ticket-icon" />
            </div>
            <div class="ticket-info">
                <h3 class="ticket-name">{{ ticket.name }}</h3>
                <p class="ticket-desc">{{ ticket.description }}</p>
            </div>
            <div class="ticket-cost">
                <span class="cost-label">{{ $t('gambling.lt_ticket') }}</span>
                <span class="cost-value">${{ ticket.ticketCost }}</span>
            </div>
        </div>

        <!-- Pick instructions -->
        <div class="pick-instructions">
            <span v-if="remaining > 0" class="picks-remaining">
                {{ $t('gambling.lt_pick_more', { n: remaining }) }}
            </span>
            <span v-else class="picks-complete">
                <AppIcon icon="mdi:check-circle" /> {{ $t('gambling.lt_numbers_selected') }}
            </span>
            <div class="pick-actions">
                <button class="pick-action-btn" @click="quickPick" :disabled="disabled">
                    <AppIcon icon="mdi:dice-multiple" /> {{ $t('gambling.lt_quick_pick') }}
                </button>
                <button class="pick-action-btn" @click="clearSelection"
                    :disabled="disabled || selectedNumbers.size === 0">
                    <AppIcon icon="mdi:close-circle-outline" /> {{ $t('gambling.lt_clear') }}
                </button>
            </div>
        </div>

        <!-- Main number grid -->
        <div class="number-grid">
            <button v-for="n in mainNumbers" :key="n" class="number-ball"
                :class="{ selected: selectedNumbers.has(n), full: selectedNumbers.size >= ticket.pickCount && !selectedNumbers.has(n) }"
                :disabled="disabled" @click="toggleNumber(n)">
                {{ n }}
            </button>
        </div>

        <!-- Bonus number grid (if applicable) -->
        <template v-if="ticket.hasBonus">
            <div class="bonus-divider">
                <span class="bonus-label">
                    <AppIcon icon="mdi:star-four-points" /> {{ $t('gambling.lt_bonus_ball') }}
                </span>
            </div>
            <div class="number-grid bonus-grid">
                <button v-for="n in bonusNumbers" :key="n" class="number-ball bonus-ball"
                    :class="{ selected: selectedBonus === n }" :disabled="disabled" @click="toggleBonus(n)">
                    {{ n }}
                </button>
            </div>
        </template>

        <!-- Confirm button -->
        <button class="play-ticket-btn" :disabled="!isComplete || disabled" @click="confirmPlay">
            <AppIcon icon="mdi:ticket-confirmation" />
            {{ $t('gambling.lt_buy_draw', { cost: ticket.ticketCost }) }}
        </button>
    </div>
</template>

<style scoped>
.lottery-ticket {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-lg);
    padding: var(--t-space-4);
    transition: border-color var(--t-transition-normal);
}

.lottery-ticket:hover {
    border-color: color-mix(in srgb, var(--ticket-accent) 40%, var(--t-border));
}

/* ── Header ── */
.ticket-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-3);
}

.ticket-icon-box {
    width: 44px;
    height: 44px;
    border-radius: var(--t-radius-md);
    background: color-mix(in srgb, var(--ticket-accent) 12%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.ticket-icon {
    font-size: 1.4rem;
    color: var(--ticket-accent);
}

.ticket-info {
    flex: 1;
    min-width: 0;
}

.ticket-name {
    font-size: var(--t-font-size-md);
    font-weight: 700;
    color: var(--t-text);
    margin: 0;
}

.ticket-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0;
    line-height: 1.4;
}

.ticket-cost {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    flex-shrink: 0;
}

.cost-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--t-text-muted);
    font-weight: 600;
}

.cost-value {
    font-family: var(--t-font-mono);
    font-weight: 700;
    font-size: var(--t-font-size-md);
    color: var(--ticket-accent);
}

/* ── Pick instructions ── */
.pick-instructions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--t-space-2);
    flex-wrap: wrap;
}

.picks-remaining {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
}

.picks-complete {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--t-font-size-sm);
    color: var(--t-success);
    font-weight: 600;
}

.pick-actions {
    display: flex;
    gap: 4px;
}

.pick-action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: var(--t-space-1) var(--t-space-2);
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--t-bg-muted);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    color: var(--t-text-secondary);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.pick-action-btn:hover:not(:disabled) {
    background: var(--t-bg-hover);
    color: var(--t-text);
}

.pick-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* ── Number grid ── */
.number-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
}

.number-ball {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    font-family: var(--t-font-mono);
    background: var(--t-bg-muted);
    border: 2px solid var(--t-border);
    color: var(--t-text-secondary);
    cursor: pointer;
    transition: all var(--t-transition-fast);
    user-select: none;
}

.number-ball:hover:not(:disabled):not(.full) {
    border-color: var(--ticket-accent);
    color: var(--ticket-accent);
    background: color-mix(in srgb, var(--ticket-accent) 8%, transparent);
}

.number-ball.selected {
    background: var(--ticket-accent);
    border-color: var(--ticket-accent);
    color: var(--t-text);
    box-shadow: 0 0 8px color-mix(in srgb, var(--ticket-accent) 40%, transparent);
}

.number-ball.full {
    opacity: 0.3;
    cursor: not-allowed;
}

.number-ball:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* ── Bonus section ── */
.bonus-divider {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.bonus-divider::before,
.bonus-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--t-border);
}

.bonus-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--t-text-muted);
    white-space: nowrap;
}

.bonus-ball.selected {
    background: var(--t-warning);
    border-color: var(--t-warning);
    color: var(--t-text);
    box-shadow: 0 0 10px color-mix(in srgb, var(--t-warning) 40%, transparent);
}

/* ── Play button ── */
.play-ticket-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);
    padding: var(--t-space-3) var(--t-space-4);
    background: var(--ticket-accent);
    border: none;
    border-radius: var(--t-radius-md);
    color: var(--t-text);
    font-size: var(--t-font-size-sm);
    font-weight: 700;
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.play-ticket-btn:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--ticket-accent) 30%, transparent);
}

.play-ticket-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    filter: none;
}
</style>
