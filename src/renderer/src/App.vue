<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useGameLoop } from '@renderer/composables/useGameLoop'
import { useAutoSave } from '@renderer/composables/useAutoSave'
import { useInitGame } from '@renderer/composables/useInitGame'
import GameHeader from '@renderer/components/layout/GameHeader.vue'
import GameSidebar from '@renderer/components/layout/GameSidebar.vue'
import GameFooter from '@renderer/components/layout/GameFooter.vue'
import OfflineSummaryDialog from '@renderer/components/OfflineSummaryDialog.vue'
import Toast from 'primevue/toast'

const { startLoop, stopLoop } = useGameLoop()
const { startAutoSave, stopAutoSave } = useAutoSave()
const { initGame, loading, offlineSummary } = useInitGame()

function dismissOfflineSummary(): void {
  offlineSummary.value = null
}

onMounted(async () => {
  // First load saved game data
  await initGame()
  // Then start game loop and auto-save
  startLoop()
  startAutoSave()
})

onBeforeUnmount(() => {
  stopLoop()
  stopAutoSave()
})
</script>

<template>
  <Toast position="top-right" />
  <div v-if="loading" class="loading-screen">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p>Loading your empire...</p>
    </div>
  </div>
  <div v-else class="app-layout">
    <GameHeader />
    <div class="app-body">
      <GameSidebar />
      <main class="app-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
    <GameFooter />

    <!-- Offline Summary Dialog -->
    <OfflineSummaryDialog v-if="offlineSummary" :summary="offlineSummary" @close="dismissOfflineSummary" />
  </div>
</template>

<style>
/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL BASE — Professional clean design system
   ═══════════════════════════════════════════════════════════════════════════ */

/* Reset */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  height: 100%;
  overflow: hidden;
  font-family: var(--t-font-sans);
  font-size: 14px;
  line-height: 1.5;
  background: var(--t-bg-base);
  color: var(--t-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--t-scrollbar-track);
}

::-webkit-scrollbar-thumb {
  background: var(--t-scrollbar-thumb);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--t-scrollbar-thumb-hover);
}

/* Selection */
::selection {
  background: var(--t-selection-bg);
  color: var(--t-selection-text);
}

/* Section */
.section-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--t-font-size-xl);
  font-weight: 600;
  margin-bottom: var(--t-space-4);
  color: var(--t-text);
}

.section-title .icon {
  color: var(--t-text-muted);
}

/* Stat displays */
.stat-value {
  font-family: var(--t-font-mono);
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: var(--t-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--t-text-muted);
  margin-top: 0.15rem;
}

/* Progress bars */
.progress-bar {
  height: 4px;
  background: var(--t-bg-muted);
  border-radius: var(--t-radius-sm);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--t-text-secondary);
  border-radius: var(--t-radius-sm);
  transition: width var(--t-transition-normal);
}

/* PrimeVue overrides — clean, flat, near-zero radius */
.p-button {
  font-weight: 600;
  border-radius: var(--t-radius-md) !important;
  transition: all var(--t-transition-fast) !important;
  box-shadow: none !important;
}

.p-inputnumber,
.p-inputtext {
  border-radius: var(--t-radius-md) !important;
}

/* Tabs */
.p-tabs {
  border-radius: var(--t-radius-lg) !important;
}

.p-tablist {
  border-radius: var(--t-radius-lg) var(--t-radius-lg) 0 0 !important;
}

.p-tab {
  border-radius: 0 !important;
  font-weight: 600;
  font-size: var(--t-font-size-sm);
  letter-spacing: 0.01em;
}

.p-tabpanels {
  border-radius: 0 0 var(--t-radius-lg) var(--t-radius-lg) !important;
  background: transparent !important;
  padding: var(--t-space-4) 0 0 0 !important;
}

.p-tabpanel {
  border-radius: 0 0 var(--t-radius-lg) var(--t-radius-lg) !important;
  padding: 0 !important;
}

/* Dialog — sharp radius */
.p-dialog {
  border-radius: var(--t-radius-lg) !important;
  box-shadow: var(--t-shadow-lg) !important;
  border: 1px solid var(--t-border) !important;
}

.p-dialog .p-dialog-header {
  border-radius: var(--t-radius-lg) var(--t-radius-lg) 0 0 !important;
}

.p-dialog .p-dialog-content {
  border-radius: 0 !important;
}

.p-dialog .p-dialog-footer {
  border-radius: 0 0 var(--t-radius-lg) var(--t-radius-lg) !important;
}

/* Dropdown — sharp */
.p-select {
  border-radius: var(--t-radius-md) !important;
}

.p-select-overlay {
  border-radius: var(--t-radius-md) !important;
  box-shadow: var(--t-shadow-lg) !important;
  border: 1px solid var(--t-border) !important;
}

/* Slider — thin */
.p-slider {
  border-radius: var(--t-radius-sm) !important;
}

.p-slider-handle {
  border-radius: var(--t-radius-sm) !important;
}

/* Toast — sharp */
.p-toast-message {
  border-radius: var(--t-radius-md) !important;
  box-shadow: var(--t-shadow-md) !important;
}
</style>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
}

/* Page transitions */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.12s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* Loading Screen */
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--t-bg-base);
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 2px solid var(--t-border);
  border-top-color: var(--t-text);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-content p {
  color: var(--t-text-muted);
  font-size: var(--t-font-size-sm);
}
</style>
