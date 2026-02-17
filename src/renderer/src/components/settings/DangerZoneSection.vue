<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotify } from '@renderer/composables/useNotify'
import { setResetting } from '@renderer/composables/useAutoSave'
import { gameEngine } from '@renderer/core/GameEngine'
import { UButton, UModal } from '@renderer/components/ui'
import SettingsSection from './SettingsSection.vue'
import SettingRow from './SettingRow.vue'

const notify = useNotify()
const { t } = useI18n()
const showResetDialog = ref(false)

async function handleHardReset(): Promise<void> {
    try {
        // Stop the game engine and block auto-save to prevent overwriting the fresh save
        gameEngine.stop()
        setResetting(true)

        await window.api.resetSave()
        showResetDialog.value = false
        window.location.reload()
    } catch {
        setResetting(false)
        notify.error(t('settings.reset_failed'))
    }
}
</script>

<template>
    <SettingsSection icon="mdi:alert" :title="$t('settings.danger_zone')" danger>
        <SettingRow :label="$t('settings.hard_reset')" :description="$t('settings.hard_reset_desc')" danger>
            <UButton variant="danger" @click="showResetDialog = true">{{ $t('settings.reset_btn') }}</UButton>
        </SettingRow>
    </SettingsSection>

    <UModal v-model="showResetDialog" :title="$t('settings.hard_reset')" icon="mdi:alert-octagon" size="sm" danger>
        <p class="reset-warning" v-html="$t('settings.hard_reset_warning')"></p>
        <div class="reset-actions">
            <UButton variant="ghost" @click="showResetDialog = false">{{ $t('common.cancel') }}</UButton>
            <UButton variant="danger" @click="handleHardReset">{{ $t('settings.yes_reset') }}</UButton>
        </div>
    </UModal>
</template>

<style scoped>
.reset-dialog {
    max-width: 400px;
}

.reset-warning {
    margin-bottom: var(--t-space-4);
    color: var(--t-text-secondary);
}

.reset-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--t-space-2);
}
</style>
