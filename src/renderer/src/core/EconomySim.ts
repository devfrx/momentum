/**
 * EconomySim — Macroeconomic simulation engine
 *
 * Simulates a living economy with inflation, interest rates,
 * consumer confidence, and boom/bust cycles.
 * All values evolve smoothly over time (no sudden jumps).
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface EconomyState {
  /** Annual inflation rate (e.g., 0.02 = 2%). Affects all costs over time. */
  inflationRate: number
  /** Cumulative inflation index (starts at 1.0, costs × this index) */
  inflationIndex: number
  /** Central bank interest rate (e.g., 0.05 = 5%). Affects loan rates & savings. */
  interestRate: number
  /** Consumer confidence 0.0–2.0 (1.0 = normal). Affects customer demand for all businesses. */
  consumerConfidence: number
  /** Economic cycle phase */
  cyclePhase: EconomicPhase
  /** Ticks into current phase */
  cycleTicksElapsed: number
  /** Duration of current phase in ticks */
  cyclePhaseDuration: number
  /** Total economic ticks elapsed */
  totalTicks: number
  /** Tax rate on business profits (e.g. 0.15 = 15%) */
  taxRate: number
  /** Wage index — multiplier on all employee salaries (tracks inflation) */
  wageIndex: number
}

export type EconomicPhase =
  | 'expansion'    // Growing economy: confidence rises, interest may rise
  | 'peak'         // Peak: high confidence, high rates, inflation pressure
  | 'contraction'  // Slowing: confidence falling, rates may drop
  | 'trough'       // Bottom: low confidence, low rates, cheap to expand

/** Minimum durations per phase (in ticks at 10 ticks/s) */
const PHASE_DURATIONS: Record<EconomicPhase, { min: number; max: number }> = {
  expansion:   { min: 3000, max: 8000 },   // 5–13 min
  peak:        { min: 1500, max: 4000 },   // 2.5–6.5 min
  contraction: { min: 2000, max: 6000 },   // 3.3–10 min
  trough:      { min: 1500, max: 4000 },   // 2.5–6.5 min
}

/** Phase transition order */
const PHASE_ORDER: EconomicPhase[] = ['expansion', 'peak', 'contraction', 'trough']

// ─── Economy Simulator ──────────────────────────────────────────────

export class EconomySimulator {
  private state: EconomyState

  constructor() {
    this.state = createDefaultEconomyState()
  }

  /** Advance economy by one tick */
  tick(): void {
    this.state.totalTicks++
    this.state.cycleTicksElapsed++

    // Smooth parameter evolution based on current phase
    const phase = this.state.cyclePhase

    switch (phase) {
      case 'expansion':
        // Confidence rises, rates slowly rise, inflation creeps up
        this.state.consumerConfidence = this.lerp(this.state.consumerConfidence, 1.3, 0.0002)
        this.state.interestRate = this.lerp(this.state.interestRate, 0.06, 0.00005)
        this.state.inflationRate = this.lerp(this.state.inflationRate, 0.04, 0.00003)
        break

      case 'peak':
        // High confidence, rates peak, inflation highest
        this.state.consumerConfidence = this.lerp(this.state.consumerConfidence, 1.5, 0.0001)
        this.state.interestRate = this.lerp(this.state.interestRate, 0.08, 0.00003)
        this.state.inflationRate = this.lerp(this.state.inflationRate, 0.06, 0.00005)
        break

      case 'contraction':
        // Confidence drops, rates drop, inflation slows
        this.state.consumerConfidence = this.lerp(this.state.consumerConfidence, 0.7, 0.0003)
        this.state.interestRate = this.lerp(this.state.interestRate, 0.03, 0.00005)
        this.state.inflationRate = this.lerp(this.state.inflationRate, 0.01, 0.00005)
        break

      case 'trough':
        // Low confidence, low rates (good for borrowing), low inflation
        this.state.consumerConfidence = this.lerp(this.state.consumerConfidence, 0.6, 0.0001)
        this.state.interestRate = this.lerp(this.state.interestRate, 0.015, 0.00003)
        this.state.inflationRate = this.lerp(this.state.inflationRate, 0.005, 0.00003)
        break
    }

    // Apply inflation per tick (convert annual to per-tick)
    // At 10 ticks/s: ~315,360,000 ticks/year
    // inflationIndex *= (1 + inflationRate)^(1/315360000) ≈ 1 + inflationRate/315360000
    const ticksPerYear = 10 * 3600 * 24 * 365
    this.state.inflationIndex *= (1 + this.state.inflationRate / ticksPerYear)

    // Wage index tracks inflation with a lag
    this.state.wageIndex = this.lerp(this.state.wageIndex, this.state.inflationIndex, 0.00001)

    // Phase transition check
    if (this.state.cycleTicksElapsed >= this.state.cyclePhaseDuration) {
      this.advancePhase()
    }
  }

  /** Get the current economy state (read-only snapshot) */
  getState(): Readonly<EconomyState> {
    return this.state
  }

  /** Get effective loan interest rate (base rate + spread) */
  getLoanRate(riskSpread: number = 0.02): number {
    return this.state.interestRate + riskSpread
  }

  /** Get consumer demand multiplier for businesses */
  getDemandMultiplier(): number {
    return this.state.consumerConfidence
  }

  /** Get cost multiplier (inflation affects operating costs) */
  getCostMultiplier(): number {
    return this.state.inflationIndex
  }

  /** Get wage multiplier (affects employee salaries) */
  getWageMultiplier(): number {
    return this.state.wageIndex
  }

  /** Get tax rate */
  getTaxRate(): number {
    return this.state.taxRate
  }

  /** Serialize for save */
  serialize(): EconomyState {
    return { ...this.state }
  }

  /** Restore from save */
  deserialize(data: Partial<EconomyState>): void {
    this.state = { ...createDefaultEconomyState(), ...data }
  }

  // ─── Internal ───────────────────────────────────────────────────

  private advancePhase(): void {
    const currentIdx = PHASE_ORDER.indexOf(this.state.cyclePhase)
    const nextIdx = (currentIdx + 1) % PHASE_ORDER.length
    const nextPhase = PHASE_ORDER[nextIdx]

    const durations = PHASE_DURATIONS[nextPhase]
    const duration = durations.min + Math.random() * (durations.max - durations.min)

    this.state.cyclePhase = nextPhase
    this.state.cycleTicksElapsed = 0
    this.state.cyclePhaseDuration = Math.floor(duration)
  }

  /** Linear interpolation toward target (smooth transitions) */
  private lerp(current: number, target: number, speed: number): number {
    return current + (target - current) * speed
  }
}

// ─── Factory ────────────────────────────────────────────────────────

export function createDefaultEconomyState(): EconomyState {
  const durations = PHASE_DURATIONS['expansion']
  return {
    inflationRate: 0.02,
    inflationIndex: 1.0,
    interestRate: 0.04,
    consumerConfidence: 1.0,
    cyclePhase: 'expansion',
    cycleTicksElapsed: 0,
    cyclePhaseDuration: Math.floor(durations.min + Math.random() * (durations.max - durations.min)),
    totalTicks: 0,
    taxRate: 0.15,
    wageIndex: 1.0,
  }
}

/** Singleton economy simulator */
export const economySim = new EconomySimulator()
