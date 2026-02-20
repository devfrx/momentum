/**
 * useEventStore — Active random events state
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { EventSystem, type GameEventDef, type ActiveEvent, type EventEffectType } from '@renderer/core/EventSystem'
import { EVENTS } from '@renderer/data/events'
import type { MarketCondition } from '@renderer/core/MarketSim'

/**
 * Maps event IDs to MarketSimulator conditions.
 * When these events fire, setCondition() is called on the appropriate simulator.
 */
const EVENT_TO_STOCK_CONDITION: Record<string, MarketCondition> = {
  bull_market: 'bull',
  market_crash: 'crash',
}

const EVENT_TO_CRYPTO_CONDITION: Record<string, MarketCondition> = {
  crypto_boom: 'bubble',
  crypto_winter: 'bear',
}

export const useEventStore = defineStore('events', () => {
  const eventSystem = new EventSystem(100) // evaluate every 100 ticks (10s)
  const activeEvents = ref<ActiveEvent[]>([])
  const pendingChoices = ref<GameEventDef[]>([])
  /** Recent event notifications for toast display */
  const recentEvents = ref<GameEventDef[]>([])

  const hasActiveEvents = computed(() => activeEvents.value.length > 0)
  const hasPendingChoices = computed(() => pendingChoices.value.length > 0)

  /** Dev cheat: suppress automatic event evaluation */
  const suppressAutoEvents = ref(false)

  function initEvents(definitions: GameEventDef[]): void {
    eventSystem.registerEvents(definitions)

    eventSystem.setOnEventStart((event) => {
      recentEvents.value.push(event)
      if (recentEvents.value.length > 5) recentEvents.value.shift()

      // Wire market events to MarketSimulator conditions
      _applyMarketCondition(event)

      syncState()
    })

    eventSystem.setOnEventEnd((event) => {
      // When a market-impacting event ends, clear the condition
      // (MarketSimulator auto-clears via timer, but this is defensive)
      _clearMarketCondition(event)

      syncState()
    })

    eventSystem.setOnChoiceRequired(() => {
      syncState()
    })
  }

  /**
   * Apply market condition to the relevant simulator when an event fires.
   * Uses lazy imports to avoid circular dependency issues.
   */
  function _applyMarketCondition(event: GameEventDef): void {
    const stockCondition = EVENT_TO_STOCK_CONDITION[event.id]
    if (stockCondition) {
      // Convert duration from event ticks to sim ticks: event uses engine ticks (10/sec),
      // stock sim ticks = engineTicks / MARKET_TICK_INTERVAL (50)
      const simTicks = Math.ceil(event.durationTicks / 50)
      try {
        const { useStockStore } = require('./useStockStore')
        const stocks = useStockStore()
        stocks.setMarketCondition(stockCondition, simTicks)
      } catch { /* store not ready yet */ }
    }

    const cryptoCondition = EVENT_TO_CRYPTO_CONDITION[event.id]
    if (cryptoCondition) {
      const simTicks = Math.ceil(event.durationTicks / 50)
      try {
        const { useCryptoStore } = require('./useCryptoStore')
        const crypto = useCryptoStore()
        crypto.setMarketCondition(cryptoCondition, simTicks)
      } catch { /* store not ready yet */ }
    }
  }

  function _clearMarketCondition(event: GameEventDef): void {
    if (EVENT_TO_STOCK_CONDITION[event.id]) {
      try {
        const { useStockStore } = require('./useStockStore')
        const stocks = useStockStore()
        stocks.setMarketCondition('normal', 0)
      } catch { /* store not ready yet */ }
    }
    if (EVENT_TO_CRYPTO_CONDITION[event.id]) {
      try {
        const { useCryptoStore } = require('./useCryptoStore')
        const crypto = useCryptoStore()
        crypto.setMarketCondition('normal', 0)
      } catch { /* store not ready yet */ }
    }
  }

  function tick(): void {
    eventSystem.tick(suppressAutoEvents.value)
    syncState()
  }

  function syncState(): void {
    activeEvents.value = [...eventSystem.getActiveEvents()]
    pendingChoices.value = [...eventSystem.getPendingChoices()]
  }

  function acceptChoice(eventId: string): void {
    eventSystem.acceptChoice(eventId)
    syncState()
  }

  function declineChoice(eventId: string): void {
    eventSystem.declineChoice(eventId)
    syncState()
  }

  function getMultiplier(effectType: EventEffectType, target?: string): number {
    return eventSystem.getMultiplier(effectType, target)
  }

  /** Force-activate an event by ID (dev cheat) */
  function forceActivateEvent(eventId: string): boolean {
    // Ensure definitions are registered (defensive fallback)
    if (eventSystem.getAllDefinitions().length === 0) {
      console.warn('[EventStore] Definitions not loaded, re-registering EVENTS')
      eventSystem.registerEvents(EVENTS)
    }
    const ok = eventSystem.forceActivateEvent(eventId)
    syncState()
    return ok
  }

  /** Get all registered event definitions */
  function getAllDefinitions(): GameEventDef[] {
    return eventSystem.getAllDefinitions()
  }

  function popRecentEvent(): GameEventDef | null {
    return recentEvents.value.shift() ?? null
  }

  function getSystem(): EventSystem {
    return eventSystem
  }

  /** Restore event state from a save */
  function loadFromSave(savedState: unknown): void {
    if (!savedState || typeof savedState !== 'object') return
    try {
      eventSystem.setState(savedState as Parameters<EventSystem['setState']>[0])
      syncState()
    } catch (e) {
      console.warn('[EventStore] Failed to restore event state:', e)
    }
  }

  /** Reset event state on prestige */
  function prestigeReset(): void {
    eventSystem.setState({
      activeEvents: [],
      cooldowns: {},
      pendingChoices: [],
      totalTicks: 0,
    })
    recentEvents.value = []
    syncState()
  }

  return {
    activeEvents, pendingChoices, recentEvents,
    hasActiveEvents, hasPendingChoices, suppressAutoEvents,
    initEvents, tick, acceptChoice, declineChoice,
    getMultiplier, popRecentEvent, getSystem, loadFromSave, prestigeReset,
    forceActivateEvent, getAllDefinitions
  }
})
