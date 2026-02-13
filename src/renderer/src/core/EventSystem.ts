/**
 * EventSystem — Random game events engine
 *
 * Manages a pool of possible events, evaluates trigger conditions each tick,
 * and tracks active events with their durations and effects.
 * Events can affect income, costs, market conditions, etc.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type EventCategory =
  | 'economy'
  | 'market'
  | 'business'
  | 'personal'
  | 'global'
  | 'opportunity'
  | 'disaster'

export type EventEffectType =
  | 'income_multiplier'
  | 'cost_multiplier'
  | 'click_multiplier'
  | 'market_drift'
  | 'market_condition'
  | 'unlock'
  | 'cash_grant'
  | 'cash_loss'
  | 'sector_boost'
  | 'sector_penalty'
  | 'prestige_bonus'
  | 'loan_rate_modifier'
  | 'credit_score_modifier'
  | 'deposit_rate_modifier'
  | 'startup_success_modifier'
  | 'startup_return_modifier'
  | 'research_cost_modifier'

export interface EventEffect {
  type: EventEffectType
  /** Numeric value of the effect (e.g. 1.5 for +50% multiplier) */
  value: number
  /** Optional target: sector name, business id, etc. */
  target?: string
}

export interface GameEventDef {
  id: string
  name: string
  description: string
  category: EventCategory
  /** Icon name (Iconify format) */
  icon: string
  /** Probability of triggering per evaluation (0.0–1.0). Evaluated every `evalInterval` ticks. */
  probability: number
  /** Duration in ticks (0 = instant effect, no duration) */
  durationTicks: number
  /** Effects applied while event is active */
  effects: EventEffect[]
  /** Minimum game ticks before this event can trigger (early-game gate) */
  minGameTicks?: number
  /** Cooldown in ticks before this event can trigger again */
  cooldownTicks?: number
  /** If true, only one instance can be active at a time */
  unique?: boolean
  /** If true, player can choose to accept or decline */
  requiresChoice?: boolean
  /** Alternative effects if player declines (only if requiresChoice) */
  declineEffects?: EventEffect[]
}

export interface ActiveEvent {
  eventId: string
  /** Ticks remaining (0 = instant, already applied) */
  ticksRemaining: number
  /** When this event started (game tick number) */
  startedAt: number
  /** Snapshot of effects for quick access */
  effects: EventEffect[]
}

export interface EventSystemState {
  /** Currently active events */
  activeEvents: ActiveEvent[]
  /** Cooldown tracking: eventId → tick when cooldown expires */
  cooldowns: Record<string, number>
  /** Pending choice events awaiting player response */
  pendingChoices: string[]
  /** Total game ticks elapsed (for minGameTicks gating) */
  totalTicks: number
}

// ─── Event System ───────────────────────────────────────────────────

export class EventSystem {
  private definitions: Map<string, GameEventDef> = new Map()
  private state: EventSystemState = {
    activeEvents: [],
    cooldowns: {},
    pendingChoices: [],
    totalTicks: 0
  }
  /** How often (in ticks) to evaluate new events. Default: every 100 ticks (10s) */
  private evalInterval: number

  /** Callbacks */
  private onEventStart?: (event: GameEventDef) => void
  private onEventEnd?: (event: GameEventDef) => void
  private onChoiceRequired?: (event: GameEventDef) => void

  constructor(evalInterval: number = 100) {
    this.evalInterval = evalInterval
  }

  // ─── Setup ──────────────────────────────────────────────────────

  /** Register event definitions */
  registerEvents(events: GameEventDef[]): void {
    for (const e of events) {
      this.definitions.set(e.id, e)
    }
  }

  /** Get the definition of an event by ID */
  getDefinition(eventId: string): GameEventDef | undefined {
    return this.definitions.get(eventId)
  }

  /** Set callback for when an event starts */
  setOnEventStart(cb: (event: GameEventDef) => void): void {
    this.onEventStart = cb
  }

  /** Set callback for when an event ends */
  setOnEventEnd(cb: (event: GameEventDef) => void): void {
    this.onEventEnd = cb
  }

  /** Set callback for when a choice event triggers */
  setOnChoiceRequired(cb: (event: GameEventDef) => void): void {
    this.onChoiceRequired = cb
  }

  // ─── Tick ───────────────────────────────────────────────────────

  /** Process one game tick. Call this every tick from GameEngine. */
  tick(): void {
    this.state.totalTicks++

    // Decrement active event durations
    const expired: string[] = []
    for (const active of this.state.activeEvents) {
      if (active.ticksRemaining > 0) {
        active.ticksRemaining--
        if (active.ticksRemaining <= 0) {
          expired.push(active.eventId)
        }
      }
    }

    // Remove expired events
    for (const id of expired) {
      this.state.activeEvents = this.state.activeEvents.filter((a) => a.eventId !== id)
      const def = this.definitions.get(id)
      if (def) this.onEventEnd?.(def)
    }

    // Evaluate new events periodically
    if (this.state.totalTicks % this.evalInterval === 0) {
      this.evaluateNewEvents()
    }
  }

  /** Evaluate which events should trigger */
  private evaluateNewEvents(): void {
    for (const [id, def] of this.definitions) {
      // Check min game ticks
      if (def.minGameTicks && this.state.totalTicks < def.minGameTicks) continue

      // Check cooldown
      if (this.state.cooldowns[id] && this.state.totalTicks < this.state.cooldowns[id]) continue

      // Check uniqueness
      if (def.unique && this.state.activeEvents.some((a) => a.eventId === id)) continue

      // Check max active events (global cap to avoid spam)
      if (this.state.activeEvents.length >= 5) continue

      // Roll probability
      if (Math.random() >= def.probability) continue

      // Event triggers!
      if (def.requiresChoice) {
        if (!this.state.pendingChoices.includes(id)) {
          this.state.pendingChoices.push(id)
          this.onChoiceRequired?.(def)
        }
      } else {
        this.activateEvent(id)
      }
    }
  }

  /** Activate an event (start it) */
  private activateEvent(eventId: string): void {
    const def = this.definitions.get(eventId)
    if (!def) return

    const active: ActiveEvent = {
      eventId,
      ticksRemaining: def.durationTicks,
      startedAt: this.state.totalTicks,
      effects: [...def.effects]
    }

    this.state.activeEvents.push(active)

    // Set cooldown
    if (def.cooldownTicks) {
      this.state.cooldowns[eventId] = this.state.totalTicks + def.durationTicks + def.cooldownTicks
    }

    this.onEventStart?.(def)
  }

  // ─── Player choice handling ─────────────────────────────────────

  /** Player accepts a pending choice event */
  acceptChoice(eventId: string): void {
    const idx = this.state.pendingChoices.indexOf(eventId)
    if (idx === -1) return
    this.state.pendingChoices.splice(idx, 1)
    this.activateEvent(eventId)
  }

  /** Player declines a pending choice event */
  declineChoice(eventId: string): EventEffect[] | null {
    const idx = this.state.pendingChoices.indexOf(eventId)
    if (idx === -1) return null
    this.state.pendingChoices.splice(idx, 1)

    const def = this.definitions.get(eventId)
    if (def?.cooldownTicks) {
      this.state.cooldowns[eventId] = this.state.totalTicks + def.cooldownTicks
    }
    return def?.declineEffects ?? null
  }

  // ─── Query ──────────────────────────────────────────────────────

  /** Get all currently active events */
  getActiveEvents(): ActiveEvent[] {
    return this.state.activeEvents
  }

  /** Get all pending choice events */
  getPendingChoices(): GameEventDef[] {
    return this.state.pendingChoices
      .map((id) => this.definitions.get(id))
      .filter((d): d is GameEventDef => d !== undefined)
  }

  /**
   * Get the aggregate multiplier for a given effect type.
   * Multiplies all active effects of that type together.
   */
  getMultiplier(effectType: EventEffectType, target?: string): number {
    let multiplier = 1
    for (const active of this.state.activeEvents) {
      for (const effect of active.effects) {
        if (effect.type !== effectType) continue
        if (target && effect.target && effect.target !== target) continue
        multiplier *= effect.value
      }
    }
    return multiplier
  }

  /**
   * Get the aggregate additive bonus for a given effect type.
   */
  getAdditiveBonus(effectType: EventEffectType, target?: string): number {
    let bonus = 0
    for (const active of this.state.activeEvents) {
      for (const effect of active.effects) {
        if (effect.type !== effectType) continue
        if (target && effect.target && effect.target !== target) continue
        bonus += effect.value
      }
    }
    return bonus
  }

  // ─── State persistence ──────────────────────────────────────────

  getState(): EventSystemState {
    return {
      ...this.state,
      activeEvents: this.state.activeEvents.map(e => ({
        ...e,
        effects: [...e.effects]
      })),
      cooldowns: { ...this.state.cooldowns },
      pendingChoices: [...this.state.pendingChoices]
    }
  }

  setState(state: EventSystemState): void {
    this.state = {
      ...state,
      activeEvents: (state.activeEvents ?? []).map(e => ({
        ...e,
        effects: [...(e.effects ?? [])]
      })),
      cooldowns: { ...(state.cooldowns ?? {}) },
      pendingChoices: [...(state.pendingChoices ?? [])]
    }
  }
}
