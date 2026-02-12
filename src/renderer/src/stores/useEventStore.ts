/**
 * useEventStore — Active random events state
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { EventSystem, type GameEventDef, type ActiveEvent, type EventEffectType } from '@renderer/core/EventSystem'

export const useEventStore = defineStore('events', () => {
  const eventSystem = new EventSystem(100) // evaluate every 100 ticks (10s)
  const activeEvents = ref<ActiveEvent[]>([])
  const pendingChoices = ref<GameEventDef[]>([])
  /** Recent event notifications for toast display */
  const recentEvents = ref<GameEventDef[]>([])

  const hasActiveEvents = computed(() => activeEvents.value.length > 0)
  const hasPendingChoices = computed(() => pendingChoices.value.length > 0)

  function initEvents(definitions: GameEventDef[]): void {
    eventSystem.registerEvents(definitions)

    eventSystem.setOnEventStart((event) => {
      recentEvents.value.push(event)
      if (recentEvents.value.length > 5) recentEvents.value.shift()
      syncState()
    })

    eventSystem.setOnEventEnd(() => {
      syncState()
    })

    eventSystem.setOnChoiceRequired(() => {
      syncState()
    })
  }

  function tick(): void {
    eventSystem.tick()
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

  function popRecentEvent(): GameEventDef | null {
    return recentEvents.value.shift() ?? null
  }

  function getSystem(): EventSystem {
    return eventSystem
  }

  return {
    activeEvents, pendingChoices, recentEvents,
    hasActiveEvents, hasPendingChoices,
    initEvents, tick, acceptChoice, declineChoice,
    getMultiplier, popRecentEvent, getSystem
  }
})
