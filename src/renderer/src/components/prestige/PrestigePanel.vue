<script setup lang="ts">
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { ref } from 'vue'

const props = defineProps<{
    currentPoints: string
    totalPoints: string
    globalMultiplier: string
    pendingPoints: string
    canPrestige: boolean
    rebirthCount: number
    eraColor?: string
}>()

const emit = defineEmits<{
    prestige: []
}>()

const showConfirm = ref(false)

function handlePrestige(): void {
    showConfirm.value = true
}

function confirmPrestige(): void {
    showConfirm.value = false
    emit('prestige')
}
</script>

<template>
    <div class="prestige-panel" :style="{ '--era-color': eraColor || 'var(--t-purple)' }">
        <div class="panel-grid">
            <!-- Current Points -->
            <div class="panel-section">
                <span class="section-label">{{ $t('prestige.available_points') }}</span>
                <div class="points-display">
                    <AppIcon icon="mdi:star-four-points" class="points-icon" />
                    <span class="points-value">{{ currentPoints }}</span>
                </div>
                <div class="points-total">
                    {{ $t('prestige.total_earned') }} {{ totalPoints }}
                </div>
            </div>

            <!-- Global Multiplier -->
            <div class="panel-section">
                <span class="section-label">{{ $t('prestige.global_multiplier') }}</span>
                <div class="multiplier-display">
                    <AppIcon icon="mdi:trending-up" class="multiplier-icon" />
                    <span class="multiplier-value">{{ globalMultiplier }}</span>
                </div>
                <div class="multiplier-desc">
                    {{ $t('prestige.applied_all_income') }}
                </div>
            </div>

            <!-- Rebirth Preview -->
            <div class="panel-section preview-section">
                <span class="section-label">{{ $t('prestige.rebirth_for') }}</span>
                <div class="pending-display" :class="{ active: canPrestige }">
                    <span class="pending-value">+{{ pendingPoints }}</span>
                    <span class="pending-suffix">{{ $t('prestige.points') }}</span>
                </div>
                <Button :label="$t('prestige.rebirth_btn')" icon="pi pi-replay" severity="contrast"
                    :disabled="!canPrestige" class="rebirth-btn" @click="handlePrestige" />
            </div>

            <!-- Rebirth Count -->
            <div class="panel-section count-section">
                <div class="rebirth-badge">
                    <AppIcon icon="mdi:reload" />
                    <span>{{ rebirthCount }}</span>
                </div>
                <span class="rebirth-label">{{ $t('prestige.rebirth_badge') }}</span>
            </div>
        </div>

        <div class="panel-warning">
            <AppIcon icon="mdi:information-outline" />
            <span>{{ $t('prestige.rebirth_warning') }}</span>
        </div>
    </div>

    <!-- Confirmation Dialog -->
    <Dialog v-model:visible="showConfirm" modal :header="$t('prestige.confirm_title')" :style="{ width: '400px' }">
        <div class="confirm-content">
            <AppIcon icon="mdi:alert-circle" class="confirm-icon" />
            <p>{{ $t('prestige.confirm_question') }}</p>
            <p class="confirm-gain">{{ $t('prestige.confirm_gain', { n: pendingPoints }) }}</p>
            <p class="confirm-warning">{{ $t('prestige.confirm_warning') }}</p>
        </div>
        <template #footer>
            <Button :label="$t('common.cancel')" severity="secondary" @click="showConfirm = false" />
            <Button :label="$t('prestige.confirm_rebirth')" severity="contrast" @click="confirmPrestige" />
        </template>
    </Dialog>
</template>

<style scoped>
.prestige-panel {
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-xl);
    padding: var(--t-space-6);
    box-shadow: var(--t-shadow-sm);
}

.panel-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--t-space-6);
    margin-bottom: var(--t-space-4);
}

@media (max-width: 900px) {
    .panel-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 500px) {
    .panel-grid {
        grid-template-columns: 1fr;
    }
}

.panel-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--t-space-2);
}

.section-label {
    font-size: var(--t-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--t-text-muted);
}

.points-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.points-icon {
    font-size: 1.75rem;
    color: var(--era-color);
}

.points-value {
    font-family: var(--t-font-mono);
    font-size: 2rem;
    font-weight: 800;
    color: var(--t-text);
}

.points-total {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.multiplier-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.multiplier-icon {
    font-size: 1.5rem;
    color: var(--t-success);
}

.multiplier-value {
    font-family: var(--t-font-mono);
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--t-success);
}

.multiplier-desc {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.preview-section {
    border-left: 1px solid var(--t-border);
    border-right: 1px solid var(--t-border);
    padding: 0 var(--t-space-4);
}

@media (max-width: 900px) {
    .preview-section {
        border: none;
        padding: 0;
        grid-column: span 2;
    }
}

@media (max-width: 500px) {
    .preview-section {
        grid-column: span 1;
    }
}

.pending-display {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    color: var(--t-text-muted);
}

.pending-display.active {
    color: var(--t-success);
}

.pending-value {
    font-family: var(--t-font-mono);
    font-size: 2rem;
    font-weight: 800;
}

.pending-suffix {
    font-size: 0.9rem;
}

.rebirth-btn {
    margin-top: var(--t-space-2);
    min-width: 160px;
}

.count-section {
    justify-content: center;
}

.rebirth-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--t-font-mono);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--era-color);
}

.rebirth-label {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
}

.panel-warning {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    padding-top: var(--t-space-4);
    border-top: 1px solid var(--t-border);
}

/* Dialog styles */
.confirm-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--t-space-3);
    padding: var(--t-space-4);
}

.confirm-icon {
    font-size: 3rem;
    color: var(--t-warning);
}

.confirm-gain {
    font-size: 1.1rem;
}

.confirm-gain strong {
    color: var(--t-success);
}

.confirm-warning {
    font-size: 0.9rem;
    color: var(--t-text-muted);
}
</style>
