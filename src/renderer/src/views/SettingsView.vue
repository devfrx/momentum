<script setup lang="ts">
import { useSettingsStore } from '@renderer/stores/useSettingsStore'
import { useAutoSave } from '@renderer/composables/useAutoSave'
import { useNotify } from '@renderer/composables/useNotify'
import AppIcon from '@renderer/components/AppIcon.vue'
import { UButton } from '@renderer/components/ui'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SettingsSection, SettingRow, DangerZoneSection } from '@renderer/components/settings'

const settings = useSettingsStore()
const { save: saveGame } = useAutoSave()
const notify = useNotify()
const { t } = useI18n()

const cloudToken = ref('')
const isDarkMode = computed({
    get: () => settings.theme === 'dark',
    set: (v: boolean) => { settings.theme = v ? 'dark' : 'light' }
})

const localeOptions = computed(() => [
    { label: 'Italiano', value: 'it' as const },
    { label: 'English', value: 'en' as const }
])

function toggleTheme(value: boolean): void {
    isDarkMode.value = value
}

const notationOptions = computed(() => [
    { label: t('settings.notation_short'), value: 'short' },
    { label: t('settings.notation_scientific'), value: 'scientific' },
    { label: t('settings.notation_engineering'), value: 'engineering' }
])

const autoSaveIntervalOptions = computed(() => [
    { label: t('settings.interval_30s'), value: 30 },
    { label: t('settings.interval_1m'), value: 60 },
    { label: t('settings.interval_2m'), value: 120 },
    { label: t('settings.interval_5m'), value: 300 }
])

async function handleSave(): Promise<void> {
    try {
        const success = await saveGame()
        if (success) {
            notify.saved()
        } else {
            notify.error(t('settings.save_failed'))
        }
    } catch {
        notify.error(t('settings.save_failed'))
    }
}

async function handleExport(): Promise<void> {
    try {
        const result = await window.api.exportFile()
        if (result) notify.info(t('settings.export_success'))
    } catch {
        notify.error(t('settings.export_failed'))
    }
}

async function handleImport(): Promise<void> {
    try {
        const result = await window.api.importFile()
        if (result) {
            notify.info(t('settings.import_success'))
            window.location.reload()
        }
    } catch {
        notify.error(t('settings.import_failed'))
    }
}

async function handleCloudSave(): Promise<void> {
    try {
        await window.api.cloudSave()
        notify.saved()
    } catch {
        notify.error(t('settings.cloud_save_failed'))
    }
}

async function handleCloudLoad(): Promise<void> {
    try {
        await window.api.cloudLoad()
        notify.info(t('settings.cloud_save_loaded'))
        window.location.reload()
    } catch {
        notify.error(t('settings.cloud_load_failed'))
    }
}

async function handleSetToken(): Promise<void> {
    if (!cloudToken.value) return
    try {
        await window.api.cloudSetToken(cloudToken.value)
        cloudToken.value = ''
        notify.info(t('settings.token_saved'))
    } catch {
        notify.error(t('settings.token_save_failed'))
    }
}
</script>

<template>
    <div class="page-container settings-page">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">
                    <AppIcon icon="mdi:cog" class="page-title-icon" />
                    {{ $t('settings.title') }}
                </h1>
                <p class="page-subtitle">{{ $t('settings.subtitle') }}</p>
            </div>
        </div>

        <!-- Gameplay -->
        <SettingsSection icon="mdi:gamepad-variant" :title="$t('settings.gameplay')">
            <SettingRow :label="$t('settings.notation')" :description="$t('settings.notation_desc')">
                <Select v-model="settings.notation" :options="notationOptions" option-label="label" option-value="value"
                    class="setting-input" />
            </SettingRow>
            <SettingRow :label="$t('settings.confirm_prestige')" :description="$t('settings.confirm_prestige_desc')">
                <ToggleSwitch v-model="settings.confirmPrestige" />
            </SettingRow>
            <SettingRow :label="$t('settings.offline')" :description="$t('settings.offline_desc')">
                <ToggleSwitch v-model="settings.offlineProgress" />
            </SettingRow>
        </SettingsSection>

        <!-- Display -->
        <SettingsSection icon="mdi:monitor" :title="$t('settings.display')">
            <SettingRow :label="$t('settings.language')" :description="$t('settings.language_desc')">
                <Select v-model="settings.locale" :options="localeOptions" option-label="label" option-value="value"
                    class="setting-input-sm" />
            </SettingRow>
            <SettingRow :label="$t('settings.theme')" :description="$t('settings.theme_desc')">
                <ToggleSwitch v-model="isDarkMode" @update:model-value="toggleTheme" />
            </SettingRow>
            <SettingRow :label="$t('settings.tooltips')" :description="$t('settings.tooltips_desc')">
                <ToggleSwitch v-model="settings.showTooltips" />
            </SettingRow>
            <SettingRow :label="$t('settings.particles')" :description="$t('settings.particles_desc')">
                <ToggleSwitch v-model="settings.particleEffects" />
            </SettingRow>
        </SettingsSection>

        <!-- Save Management -->
        <SettingsSection icon="mdi:content-save" :title="$t('settings.save_data')">
            <SettingRow :label="$t('settings.auto_save')" :description="$t('settings.auto_save_desc')">
                <Select v-model="settings.autoSaveInterval" :options="autoSaveIntervalOptions" option-label="label"
                    option-value="value" class="setting-input-sm" />
            </SettingRow>
            <div class="setting-actions">
                <UButton variant="primary" icon="mdi:content-save" @click="handleSave">{{
                    $t('settings.save_now') }}</UButton>
                <UButton variant="ghost" icon="mdi:download" @click="handleExport">{{
                    $t('settings.export_save') }}</UButton>
                <UButton variant="ghost" icon="mdi:upload" @click="handleImport">{{
                    $t('settings.import_save') }}</UButton>
            </div>
        </SettingsSection>

        <!-- Cloud Save -->
        <SettingsSection icon="mdi:cloud" :title="$t('settings.cloud_save')">
            <SettingRow :label="$t('settings.github_pat')" :description="$t('settings.github_pat_desc')">
                <div class="token-input-group">
                    <InputText v-model="cloudToken" type="password" placeholder="ghp_..." class="token-input" />
                    <UButton variant="primary" size="sm" @click="handleSetToken">{{ $t('common.save') }}</UButton>
                </div>
            </SettingRow>
            <div class="setting-actions">
                <UButton variant="primary" icon="mdi:cloud-upload" @click="handleCloudSave">{{
                    $t('settings.cloud_save_btn') }}</UButton>
                <UButton variant="ghost" icon="mdi:cloud-download" @click="handleCloudLoad">{{
                    $t('settings.cloud_load_btn') }}</UButton>
            </div>
        </SettingsSection>

        <!-- Danger Zone -->
        <DangerZoneSection />
    </div>
</template>

<style scoped>
.settings-page {
    max-width: 800px;
}

.setting-input {
    width: 220px;
}

.setting-input-sm {
    width: 150px;
}

.setting-actions {
    display: flex;
    gap: var(--t-space-2);
    margin-top: var(--t-space-4);
    flex-wrap: wrap;
}

.token-input-group {
    display: flex;
    gap: var(--t-space-2);
}

.token-input {
    width: 200px;
}
</style>
