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
/* ── GLOBAL RESET & BASE ── */
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
  line-height: var(--t-leading-normal);
  background: var(--t-bg-base);
  color: var(--t-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}

/* ── SCROLLBAR ── */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
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

/* ── SELECTION ── */
::selection {
  background: var(--t-selection-bg);
  color: var(--t-selection-text);
}

/* ── FOCUS VISIBLE (accessibility) ── */
:focus-visible {
  outline: none;
  box-shadow: var(--t-shadow-focus);
}

/* ── INTERACTIVE ELEMENTS – universal states ── */
a,
button,
[role='button'],
input,
select,
textarea {
  transition: all var(--t-transition-fast);
}

a {
  color: var(--t-text-secondary);
  text-decoration: none;
}

a:hover {
  color: var(--t-text);
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
