<script setup lang="ts">
/**
 * PropertyCustomizer — Dedicated customization dialog for a property.
 * Allows: renaming, trait viewing, management style, rent slider.
 * Opened as a focused panel from PropertyCard.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRealEstateStore, type Property } from '@renderer/stores/useRealEstateStore'
import { useFormat } from '@renderer/composables/useFormat'
import { getTrait, MANAGEMENT_STYLES } from '@renderer/data/realestate'
import AppIcon from '@renderer/components/AppIcon.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Slider from 'primevue/slider'
import Tag from 'primevue/tag'

const { t } = useI18n()
const realEstate = useRealEstateStore()
const { formatPercent } = useFormat()

const props = defineProps<{
    property: Property
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

// ─── Local state ────────────────────────────────────────────────
const localName = ref(props.property.customName || props.property.name)
const localRentMul = ref(Math.round(props.property.rentMultiplier * 100))
const localStyle = ref(props.property.managementStyle)

const traits = computed(() =>
    (props.property.traits.map(tid => getTrait(tid)).filter(Boolean)) as import('@renderer/data/realestate').PropertyTrait[],
)

// ─── Actions ────────────────────────────────────────────────────
function apply(): void {
    realEstate.renameProperty(props.property.id, localName.value)
    realEstate.setRentMultiplier(props.property.id, localRentMul.value / 100)
    realEstate.setManagementStyle(props.property.id, localStyle.value)
    emit('close')
}
</script>

<template>
    <div class="property-customizer">
        <div class="customizer-header">
            <h3>{{ t('realestate.customize') }}</h3>
            <Button icon="pi pi-times" text rounded size="small" @click="emit('close')" />
        </div>

        <!-- Name -->
        <div class="field">
            <label>{{ t('realestate.custom_name') }}</label>
            <InputText v-model="localName" class="name-input" />
        </div>

        <!-- Traits (read-only, informational) -->
        <div class="field">
            <label>{{ t('realestate.traits_label') }}</label>
            <div class="trait-list">
                <div v-for="tr in traits" :key="tr.id" class="trait-detail">
                    <div class="trait-header">
                        <Tag :severity="tr.isPositive ? 'success' : 'warn'" size="small">
                            <AppIcon :icon="tr.icon" size="0.7rem" />
                            <span style="margin-left: 0.2rem;">{{ t(tr.nameKey) }}</span>
                        </Tag>
                    </div>
                    <p class="trait-desc">{{ t(tr.descriptionKey) }}</p>
                    <div class="trait-mods">
                        <span v-if="tr.rentMod !== 0">Rent: {{ tr.rentMod > 0 ? '+' : '' }}{{ formatPercent(tr.rentMod)
                            }}</span>
                        <span v-if="tr.occupancyMod !== 0">Occ: {{ tr.occupancyMod > 0 ? '+' : '' }}{{
                            formatPercent(tr.occupancyMod) }}</span>
                        <span v-if="tr.wearMod !== 1">Wear: {{ tr.wearMod }}×</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Management style -->
        <div class="field">
            <label>{{ t('realestate.management_style') }}</label>
            <div class="style-options">
                <div v-for="style in MANAGEMENT_STYLES" :key="style.id" class="style-card"
                    :class="{ active: localStyle === style.id }" @click="localStyle = style.id">
                    <AppIcon :icon="style.icon" size="1.25rem" />
                    <span class="style-name">{{ t(style.nameKey) }}</span>
                    <span class="style-desc">{{ t(style.descKey) }}</span>
                    <div class="style-effects">
                        <span>{{ t('realestate.expense') }}: {{ style.expenseMod }}×</span>
                        <span>{{ t('realestate.rent') }}: {{ style.rentMod }}×</span>
                        <span>{{ t('realestate.wear') }}: {{ style.wearMod }}×</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Rent multiplier -->
        <div class="field">
            <div class="field-header">
                <label>{{ t('realestate.rent_multiplier') }}</label>
                <span class="field-value">{{ (localRentMul / 100).toFixed(2) }}×</span>
            </div>
            <Slider v-model="localRentMul" :min="50" :max="200" :step="5" />
            <div class="slider-labels">
                <span>{{ t('realestate.low_rent') }}</span>
                <span>{{ t('realestate.normal') }}</span>
                <span>{{ t('realestate.high_rent') }}</span>
            </div>
            <p class="field-hint">{{ t('realestate.rent_hint') }}</p>
        </div>

        <!-- Apply -->
        <Button :label="t('realestate.apply')" icon="pi pi-check" severity="success" class="apply-btn" @click="apply" />
    </div>
</template>

<style scoped>
.property-customizer {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-4);
    padding: var(--t-space-4);
}

.customizer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.customizer-header h3 {
    margin: 0;
    font-size: var(--t-font-size-lg);
    font-weight: 700;
    color: var(--t-text);
}

.field {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.field label {
    font-size: var(--t-font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--t-text-muted);
}

.name-input {
    width: 100%;
}

.trait-list {
    display: flex;
    flex-direction: column;
    gap: var(--t-space-2);
}

.trait-detail {
    padding: var(--t-space-3);
    background: var(--t-bg-muted);
    border-radius: var(--t-radius-sm);
    border: 1px solid var(--t-border);
}

.trait-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    margin: var(--t-space-1) 0 0;
    line-height: 1.35;
}

.trait-mods {
    display: flex;
    gap: var(--t-space-2);
    margin-top: var(--t-space-1);
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    color: var(--t-text-secondary);
}

.style-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--t-space-2);
}

.style-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: var(--t-space-3);
    border-radius: var(--t-radius-md);
    border: 2px solid var(--t-border);
    cursor: pointer;
    transition: all var(--t-transition-fast);
    text-align: center;
    background: var(--t-bg-card);
}

.style-card:hover {
    border-color: var(--t-border-hover);
    background: var(--t-bg-card-hover);
}

.style-card.active {
    border-color: var(--t-accent);
    background: color-mix(in srgb, var(--t-accent) 6%, var(--t-bg-card));
}

.style-name {
    font-weight: 700;
    font-size: var(--t-font-size-sm);
    color: var(--t-text);
}

.style-desc {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-secondary);
    line-height: 1.25;
}

.style-effects {
    display: flex;
    flex-direction: column;
    font-size: var(--t-font-size-xs);
    font-family: var(--t-font-mono);
    color: var(--t-text-muted);
    margin-top: var(--t-space-1);
}

.field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.field-value {
    font-family: var(--t-font-mono);
    font-weight: 700;
    color: var(--t-accent);
}

.slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
}

.field-hint {
    font-size: var(--t-font-size-xs);
    color: var(--t-text-muted);
    margin: 0;
    font-style: italic;
}

.apply-btn {
    width: 100%;
    font-weight: 700;
}
</style>
