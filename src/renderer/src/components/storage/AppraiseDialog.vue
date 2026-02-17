<script setup lang="ts">
/**
 * AppraiseDialog — Dialog to select an appraiser for item(s).
 * Shows available appraisers with costs and accuracy.
 */
import { computed } from 'vue'
import AppIcon from '@renderer/components/AppIcon.vue'
import { useStorageStore } from '@renderer/stores/useStorageStore'
import { useFormat } from '@renderer/composables/useFormat'
import { useI18n } from 'vue-i18n'
import { UModal } from '@renderer/components/ui'

const props = defineProps<{
    /** Specific item ID or null for appraise-all */
    itemId: string | null
}>()

const emit = defineEmits<{ close: [] }>()

const storage = useStorageStore()
const { formatCash, formatPercent } = useFormat()
const { t } = useI18n()

const appraisers = computed(() => storage.unlockedAppraisers)

function selectAppraiser(appraiserId: string): void {
    if (props.itemId) {
        storage.appraiseItem(props.itemId, appraiserId)
    } else {
        storage.appraiseAll(appraiserId)
    }
    emit('close')
}
</script>

<template>
    <UModal :modelValue="true" @update:modelValue="$emit('close')" :title="itemId ? t('storage.choose_appraiser') : t('storage.appraise_all_title')" icon="mdi:magnify" size="lg">
            <p class="dialog-desc">{{ t('storage.appraiser_desc') }}</p>

            <div class="appraiser-list">
                <div v-for="appraiser in appraisers" :key="appraiser.id" class="appraiser-card"
                    @click="selectAppraiser(appraiser.id)">
                    <AppIcon :icon="appraiser.icon" class="appraiser-icon" />
                    <div class="appraiser-info">
                        <span class="appraiser-name">{{ appraiser.name }}</span>
                        <span class="appraiser-tier">{{ appraiser.tier }}</span>
                        <span class="appraiser-desc">{{ appraiser.description }}</span>
                    </div>
                    <div class="appraiser-stats">
                        <div class="stat-row">
                            <span class="stat-label">{{ t('storage.cost') }}</span>
                            <span class="stat-value">{{ formatCash(appraiser.costPerItem) }}/{{ t('storage.per_item')
                                }}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">{{ t('storage.accuracy') }}</span>
                            <span class="stat-value">{{ formatPercent(appraiser.accuracy) }}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">{{ t('storage.bonus_chance') }}</span>
                            <span class="stat-value">{{ formatPercent(appraiser.bonusDiscoveryChance) }}</span>
                        </div>
                    </div>
                </div>
            </div>
    </UModal>
</template>

<style scoped>
.dialog-desc {
    font-size: var(--t-font-size-sm);
    color: var(--t-text-muted);
    margin: 0 0 var(--t-space-3);
}

.appraiser-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-3);
}

.appraiser-card {
    display: flex;
    gap: var(--t-space-3);
    padding: var(--t-space-3);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-md);
    cursor: pointer;
    transition: all var(--t-transition-fast);
}

.appraiser-card:hover {
    border-color: var(--t-border-hover);
    background: var(--t-bg-muted);
}

.appraiser-card:focus-visible {
    box-shadow: var(--t-shadow-focus);
    outline: none;
}

.appraiser-card:active {
    transform: scale(0.98);
}

.appraiser-icon {
    font-size: 1.9rem;
    color: var(--t-text-secondary);
    flex-shrink: 0;
}

.appraiser-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.appraiser-name {
    font-weight: var(--t-font-bold);
    color: var(--t-text);
}

.appraiser-tier {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.appraiser-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
}

.appraiser-stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex-shrink: 0;
}

.stat-row {
    display: flex;
    gap: var(--t-space-2);
    align-items: center;
}

.stat-label {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    min-width: 60px;
}

.stat-value {
    font-size: var(--t-font-size-xs);
    font-weight: var(--t-font-semibold);
    color: var(--t-text);
}
</style>
