<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
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
        <!-- Employees -->
        <div class="staff-card">
            <div class="staff-card-header">
                <div class="staff-icon-wrap">
                    <AppIcon icon="mdi:account-multiple" class="staff-icon" />
                </div>
                <div class="staff-card-info">
                    <span class="staff-card-title">{{ $t('business.employees') }}</span>
                    <span class="staff-card-sub">{{ business.employees }}/{{ maxEmployees }}</span>
                </div>
                <div class="staff-card-actions">
                    <UButton variant="secondary" size="xs" :disabled="business.employees <= 1"
                        @click="store.fireEmployee(business.id)">−</UButton>
                    <UButton variant="primary" size="xs" :disabled="business.employees >= maxEmployees"
                        @click="store.hireEmployee(business.id)">+</UButton>
                </div>
            </div>
            <div class="employee-bar-track">
                <div class="employee-bar-fill" :style="{ width: (business.employees / maxEmployees * 100) + '%' }"
                    :class="business.employees >= maxEmployees ? 'full' : business.employees / maxEmployees > 0.7 ? 'high' : 'normal'" />
            </div>
        </div>

        <!-- Training -->
        <div class="staff-card">
            <div class="staff-card-header">
                <div class="staff-icon-wrap training">
                    <AppIcon icon="mdi:school" class="staff-icon" />
                </div>
                <div class="staff-card-info">
                    <span class="staff-card-title">{{ $t('business.staff_training') }}</span>
                    <div class="training-meta">
                        <span class="training-level">Lv.{{ business.trainingLevel }}</span>
                        <span class="training-mult">×{{ trainingMult.toFixed(2) }}</span>
                    </div>
                </div>
                <UButton variant="success" size="sm" icon="mdi:arrow-up-bold" @click="store.trainStaff(business.id)">
                    {{ formatCash(trainingCost) }}
                </UButton>
            </div>
        </div>

        <!-- Capacity -->
        <div class="capacity-row">
            <div class="cap-left">
                <AppIcon icon="mdi:factory" class="cap-icon" />
                <span class="cap-label">{{ $t('business.production_capacity') }}</span>
            </div>
            <span class="cap-value">{{ business.maxCapacity }} <span class="cap-unit">{{ $t('business.units_tick')
                    }}</span></span>
        </div>
    </div>
</template>

<style scoped>
.staff-panel {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.staff-card {
    padding: var(--t-space-3);
    background: var(--t-bg-card);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.staff-card-header {
    display: flex;
    align-items: center;
    gap: var(--t-space-2);
}

.staff-icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: var(--t-radius-sm);
    background: var(--t-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.staff-icon-wrap.training {
    background: color-mix(in srgb, var(--t-success) 12%, var(--t-bg-muted));
}

.staff-icon {
    font-size: 1rem;
    color: var(--t-text-muted);
}

.training .staff-icon {
    color: var(--t-success);
}

.staff-card-info {
    flex: 1;
    min-width: 0;
}

.staff-card-title {
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
    display: block;
}

.staff-card-sub {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
}

.staff-card-actions {
    display: flex;
    gap: 0.3rem;
    flex-shrink: 0;
}

/* Employee bar */
.employee-bar-track {
    height: 5px;
    background: var(--t-bg-muted);
    border-radius: 999px;
    overflow: hidden;
}

.employee-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
}

.employee-bar-fill.normal {
    background: var(--t-accent);
}

.employee-bar-fill.high {
    background: var(--t-warning);
}

.employee-bar-fill.full {
    background: var(--t-success);
}

/* Training meta */
.training-meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.training-level {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-bold);
    color: var(--t-text-secondary);
}

.training-mult {
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    font-weight: var(--t-font-semibold);
    color: var(--t-accent);
    padding: 0.05rem 0.3rem;
    background: color-mix(in srgb, var(--t-accent) 12%, transparent);
    border-radius: var(--t-radius-sm);
}

/* Capacity */
.capacity-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--t-space-2) var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-md);
}

.cap-left {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.cap-icon {
    font-size: 0.9rem;
    color: var(--t-text-muted);
}

.cap-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.cap-value {
    font-family: var(--t-font-mono);
    font-size: var(--t-font-size-sm);
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.cap-unit {
    font-weight: var(--t-font-medium);
    color: var(--t-text-muted);
    font-size: var(--t-font-size-xs);
}
</style>
