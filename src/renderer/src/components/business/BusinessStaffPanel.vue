<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import { useFormat } from '@renderer/composables/useFormat'
import { useBusinessStore, type OwnedBusiness } from '@renderer/stores/useBusinessStore'

const props = defineProps<{
    business: OwnedBusiness
}>()

const store = useBusinessStore()
const { formatCash } = useFormat()

const maxEmployees = computed(() => store.getMaxEmployees(props.business))
const trainingMult = computed(() => store.getTrainingMultiplier(props.business))
const trainingCost = computed(() => store.getTrainingCost(props.business))
</script>

<template>
    <div class="staff-panel">
        <h4 class="panel-title">
            <AppIcon icon="mdi:account-group" />
            {{ $t('business.staff_title') }}
        </h4>

        <!-- Employees -->
        <div class="staff-row">
            <div class="sr-label">
                <AppIcon icon="mdi:account-multiple" class="sr-icon" />
                <span>{{ $t('business.employees') }}</span>
                <span class="sr-hint">({{ business.employees }}/{{ maxEmployees }})</span>
            </div>
            <div class="sr-actions">
                <button class="adj-btn" :disabled="business.employees <= 1"
                    @click="store.fireEmployee(business.id)">−</button>
                <span class="sr-value">{{ business.employees }}</span>
                <button class="adj-btn" :disabled="business.employees >= maxEmployees"
                    @click="store.hireEmployee(business.id)">+</button>
            </div>
        </div>

        <!-- Training -->
        <div class="staff-row">
            <div class="sr-label">
                <AppIcon icon="mdi:school" class="sr-icon" />
                <span>{{ $t('business.staff_training') }}</span>
                <span class="sr-hint">(×{{ trainingMult.toFixed(2) }})</span>
            </div>
            <div class="sr-actions">
                <span class="sr-value">Lv.{{ business.trainingLevel }}</span>
                <Button size="small" severity="secondary" @click="store.trainStaff(business.id)">
                    {{ $t('business.train') }} — {{ formatCash(trainingCost) }}
                </Button>
            </div>
        </div>

        <!-- Capacity Info -->
        <div class="capacity-info">
            <span class="ci-label">{{ $t('business.production_capacity') }}</span>
            <span class="ci-value">{{ business.maxCapacity }} {{ $t('business.units_tick') }}</span>
        </div>
    </div>
</template>

<style scoped>
.staff-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.panel-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--t-font-size-sm);
    font-weight: 700;
    color: var(--t-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
}

.staff-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
}

.sr-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: var(--t-font-size-sm);
    color: var(--t-text-secondary);
}

.sr-icon {
    font-size: 1rem;
    color: var(--t-text-muted);
}

.sr-hint {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.sr-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.sr-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: 600;
    min-width: 2.5rem;
    text-align: center;
    color: var(--t-text);
}

.adj-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    color: var(--t-text);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.adj-btn:hover:not(:disabled) {
    background: var(--t-bg-card-hover);
    border-color: var(--t-border-hover);
}

.adj-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.capacity-info {
    display: flex;
    justify-content: space-between;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
    font-size: var(--t-font-size-sm);
}

.ci-label {
    color: var(--t-text-muted);
}

.ci-value {
    font-family: var(--t-font-mono);
    font-weight: 600;
    color: var(--t-text);
}
</style>
