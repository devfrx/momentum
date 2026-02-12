/**
 * GameEngine — Central game loop and system orchestrator
 *
 * Runs a fixed-interval tick loop (default 100ms = 10 ticks/sec).
 * Tracks real elapsed time to compensate for timer drift.
 * Provides subscribe/unsubscribe for systems to hook into the tick.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface TickContext {
  /** Real delta time since last tick (in seconds) */
  delta: number
  /** Current tick number (monotonically increasing) */
  tick: number
  /** Total game time elapsed (in seconds) since engine started */
  totalTime: number
  /** Timestamp of this tick (performance.now) */
  timestamp: number
}

export type TickCallback = (ctx: TickContext) => void

export interface GameEngineOptions {
  /** Interval between ticks in ms (default: 100 = 10 ticks/sec) */
  tickIntervalMs?: number
  /** Maximum delta (seconds) to process in a single tick to prevent spiral of death */
  maxDelta?: number
}

// ─── Engine ─────────────────────────────────────────────────────────

export class GameEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private callbacks: Map<string, TickCallback> = new Map()
  private tick = 0
  private totalTime = 0
  private lastTimestamp = 0
  private readonly tickIntervalMs: number
  private readonly maxDelta: number
  private _running = false

  constructor(options: GameEngineOptions = {}) {
    this.tickIntervalMs = options.tickIntervalMs ?? 100
    this.maxDelta = options.maxDelta ?? 1.0 // 1 second max to prevent freezes
  }

  // ─── Lifecycle ──────────────────────────────────────────────────

  /** Start the game loop */
  start(): void {
    if (this._running) return
    this._running = true
    this.lastTimestamp = performance.now()

    this.intervalId = setInterval(() => {
      this.processTick()
    }, this.tickIntervalMs)
  }

  /** Pause the game loop (preserves tick count and total time) */
  pause(): void {
    if (!this._running) return
    this._running = false

    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /** Stop and fully reset the game loop */
  stop(): void {
    this.pause()
    this.tick = 0
    this.totalTime = 0
    this.lastTimestamp = 0
  }

  /** Check if the engine is currently running */
  get running(): boolean {
    return this._running
  }

  /** Get the current tick count */
  get currentTick(): number {
    return this.tick
  }

  /** Get total elapsed game time in seconds */
  get elapsedTime(): number {
    return this.totalTime
  }

  // ─── Subscription ───────────────────────────────────────────────

  /**
   * Subscribe a callback to the tick loop.
   * @param id Unique identifier for this subscriber (for unsubscribe)
   * @param callback Function called every tick with TickContext
   */
  subscribe(id: string, callback: TickCallback): void {
    this.callbacks.set(id, callback)
  }

  /** Unsubscribe a callback by its id */
  unsubscribe(id: string): void {
    this.callbacks.delete(id)
  }

  /** Check if a subscriber exists */
  hasSubscriber(id: string): boolean {
    return this.callbacks.has(id)
  }

  /** Get count of active subscribers */
  get subscriberCount(): number {
    return this.callbacks.size
  }

  // ─── Internal ───────────────────────────────────────────────────

  private processTick(): void {
    const now = performance.now()
    let delta = (now - this.lastTimestamp) / 1000 // Convert ms to seconds
    this.lastTimestamp = now

    // Clamp delta to prevent spiral of death
    if (delta > this.maxDelta) {
      delta = this.maxDelta
    }

    // Prevent negative deltas (can happen with system clock adjustments)
    if (delta < 0) {
      delta = this.tickIntervalMs / 1000
    }

    this.tick++
    this.totalTime += delta

    const ctx: TickContext = {
      delta,
      tick: this.tick,
      totalTime: this.totalTime,
      timestamp: now
    }

    // Call all subscribers (order determined by insertion order)
    for (const [, callback] of this.callbacks) {
      try {
        callback(ctx)
      } catch (error) {
        console.error('[GameEngine] Error in tick callback:', error)
      }
    }
  }

  // ─── Manual tick (for testing / offline calc) ───────────────────

  /**
   * Manually process N ticks with a fixed delta.
   * Useful for simulating offline progress or unit tests.
   */
  manualTicks(count: number, fixedDeltaSeconds: number = 0.1): void {
    for (let i = 0; i < count; i++) {
      this.tick++
      this.totalTime += fixedDeltaSeconds

      const ctx: TickContext = {
        delta: fixedDeltaSeconds,
        tick: this.tick,
        totalTime: this.totalTime,
        timestamp: performance.now()
      }

      for (const [, callback] of this.callbacks) {
        try {
          callback(ctx)
        } catch (error) {
          console.error('[GameEngine] Error in manual tick callback:', error)
        }
      }
    }
  }
}

/**
 * Singleton game engine instance.
 * Import and use across the app without passing references around.
 */
export const gameEngine = new GameEngine()
