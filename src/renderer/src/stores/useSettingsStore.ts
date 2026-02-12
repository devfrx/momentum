/**
 * useSettingsStore — User preferences and app settings
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type NumberFormat = 'short' | 'scientific' | 'engineering'
export type SupportedLocale = 'en' | 'it'
export type BuyAmount = 1 | 10 | 25 | 100 | 'max'

export const useSettingsStore = defineStore('settings', () => {
  const locale = ref<SupportedLocale>('it')
  const autoSaveInterval = ref(30)
  const offlineEfficiency = ref(0.5)
  const offlineMaxHours = ref(24)
  const soundVolume = ref(50)
  const musicVolume = ref(30)
  const notificationsEnabled = ref(true)
  const numberFormat = ref<NumberFormat>('short')
  const theme = ref<'dark' | 'light'>('dark')
  const animationSpeed = ref(1.0)
  /** Lottery draw animation speed multiplier (higher = faster) */
  const lotteryDrawSpeed = ref(1)
  /** How many draws to run simultaneously */
  const lotteryMultiDraw = ref(1)
  const cloudSaveEnabled = ref(false)
  const gistId = ref<string | null>(null)
  const buyAmount = ref<BuyAmount>(1)
  /** Show confirmation dialogs for big purchases */
  const confirmBigPurchases = ref(true)
  /** Threshold for "big purchase" confirmation (as a % of total cash) */
  const bigPurchaseThreshold = ref(50)
  /** Confirm before prestige */
  const confirmPrestige = ref(true)
  /** Enable offline progress */
  const offlineProgress = ref(true)
  /** Show tooltips on hover */
  const showTooltips = ref(true)
  /** Particle/visual effects */
  const particleEffects = ref(true)

  /** Market update frequency in game ticks (10 ticks = 1 second) */
  const marketUpdateInterval = ref(50) // default: every 5 seconds

  /** Pinned asset IDs (persist across page changes & restarts) */
  const pinnedStockId = ref<string | null>(null)
  const pinnedCryptoId = ref<string | null>(null)

  /** Alias for numberFormat to match 'notation' naming in views */
  const notation = numberFormat

  // Apply theme via data-theme attribute on <html>
  watch(theme, (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
  }, { immediate: true })

  // Sync locale with vue-i18n
  watch(locale, (newLocale) => {
    // Dynamic import to avoid circular dependency at store creation
    import('../locales').then(({ default: i18n }) => {
      ;(i18n.global.locale as unknown as { value: string }).value = newLocale
    })
  })

  function loadFromSave(data: Record<string, unknown>): void {
    if (data.locale != null) locale.value = data.locale as SupportedLocale
    if (data.autoSaveInterval != null) autoSaveInterval.value = data.autoSaveInterval as number
    if (data.offlineEfficiency != null) offlineEfficiency.value = data.offlineEfficiency as number
    if (data.offlineMaxHours != null) offlineMaxHours.value = data.offlineMaxHours as number
    if (data.offlineProgress != null) offlineProgress.value = data.offlineProgress as boolean
    if (data.soundVolume != null) soundVolume.value = data.soundVolume as number
    if (data.musicVolume != null) musicVolume.value = data.musicVolume as number
    if (data.notificationsEnabled != null) notificationsEnabled.value = data.notificationsEnabled as boolean
    if (data.numberFormat != null) numberFormat.value = data.numberFormat as NumberFormat
    if (data.theme != null) theme.value = data.theme as 'dark' | 'light'
    if (data.animationSpeed != null) animationSpeed.value = data.animationSpeed as number
    if (data.lotteryDrawSpeed != null) lotteryDrawSpeed.value = data.lotteryDrawSpeed as number
    if (data.lotteryMultiDraw != null) lotteryMultiDraw.value = data.lotteryMultiDraw as number
    if (data.cloudSaveEnabled != null) cloudSaveEnabled.value = data.cloudSaveEnabled as boolean
    if (data.gistId !== undefined) gistId.value = data.gistId as string | null
    if (data.buyAmount != null) buyAmount.value = data.buyAmount as BuyAmount
    if (data.confirmPrestige != null) confirmPrestige.value = data.confirmPrestige as boolean
    if (data.showTooltips != null) showTooltips.value = data.showTooltips as boolean
    if (data.particleEffects != null) particleEffects.value = data.particleEffects as boolean
    if (data.confirmBigPurchases != null) confirmBigPurchases.value = data.confirmBigPurchases as boolean
    if (data.bigPurchaseThreshold != null) bigPurchaseThreshold.value = data.bigPurchaseThreshold as number
    if (data.marketUpdateInterval != null) marketUpdateInterval.value = data.marketUpdateInterval as number
    if (data.pinnedStockId !== undefined) pinnedStockId.value = data.pinnedStockId as string | null
    if (data.pinnedCryptoId !== undefined) pinnedCryptoId.value = data.pinnedCryptoId as string | null
  }

  function cycleBuyAmount(): void {
    const cycle: BuyAmount[] = [1, 10, 25, 100, 'max']
    const idx = cycle.indexOf(buyAmount.value)
    buyAmount.value = cycle[(idx + 1) % cycle.length]
  }

  return {
    locale,
    autoSaveInterval, offlineEfficiency, offlineMaxHours,
    soundVolume, musicVolume, notificationsEnabled,
    numberFormat, notation, theme, animationSpeed,
    lotteryDrawSpeed, lotteryMultiDraw,
    cloudSaveEnabled, gistId, buyAmount,
    confirmBigPurchases, bigPurchaseThreshold,
    confirmPrestige, offlineProgress, showTooltips, particleEffects,
    marketUpdateInterval,
    pinnedStockId, pinnedCryptoId,
    loadFromSave, cycleBuyAmount
  }
})
