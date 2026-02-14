/**
 * MarketSim — Stock & Crypto market price simulation
 *
 * Uses Geometric Brownian Motion (GBM) for realistic price movements.
 * Each asset has configurable drift, volatility, and sector parameters.
 * Includes market-wide events (bull/bear/crash/bubble).
 */
import { gbmStep, boxMullerRandom } from './Formulas'

// ─── Types ──────────────────────────────────────────────────────────

export type MarketSector =
  | 'tech'
  | 'finance'
  | 'energy'
  | 'healthcare'
  | 'retail'
  | 'industrial'
  | 'crypto'
  | 'commodities'
  | 'defense'
  | 'entertainment'
  | 'defi'
  | 'meme'

export type MarketCondition = 'normal' | 'bull' | 'bear' | 'crash' | 'bubble'

export interface AssetConfig {
  id: string
  name: string
  ticker: string
  sector: MarketSector
  /** Initial price in $ */
  basePrice: number
  /** Annual drift: expected return, e.g. 0.08 = 8% */
  drift: number
  /** Annual volatility, e.g. 0.3 = 30% */
  volatility: number
  /** Min price floor (never drops below) */
  minPrice: number
  /** Max number of historical prices to keep (for charts) */
  maxHistory: number
  /** Annual dividend yield as a fraction (e.g. 0.035 = 3.5%). 0 = no dividends. */
  dividendYield?: number
}

export interface AssetState {
  id: string
  name: string
  currentPrice: number
  previousPrice: number
  priceHistory: number[]
  /** Change since last tick as a ratio (-0.05 = -5%) */
  changePercent: number
  /** All-time high */
  ath: number
  /** All-time low */
  atl: number
  /** Total volume traded (game metric) */
  totalVolume: number
}

export interface MarketState {
  condition: MarketCondition
  /** Ticks remaining for current condition (0 = permanent normal) */
  conditionTicksRemaining: number
  /** Global sentiment modifier applied to all drifts */
  sentimentModifier: number
  /** Per-sector modifier applied to drift */
  sectorModifiers: Partial<Record<MarketSector, number>>
  assets: Map<string, AssetState>
}

// ─── Condition effects ──────────────────────────────────────────────

const CONDITION_EFFECTS: Record<MarketCondition, { driftMod: number; volMod: number }> = {
  normal: { driftMod: 0, volMod: 1.0 },
  bull: { driftMod: 0.15, volMod: 0.8 },
  bear: { driftMod: -0.12, volMod: 1.2 },
  crash: { driftMod: -0.5, volMod: 2.5 },
  bubble: { driftMod: 0.4, volMod: 1.8 }
}

// ─── Market Simulator ───────────────────────────────────────────────

export class MarketSimulator {
  private configs: Map<string, AssetConfig> = new Map()
  private state: MarketState

  /** Time step per tick: represents a fraction of a trading year */
  private readonly dt: number

  constructor(ticksPerGameDay: number = 120) {
    // dt in "annual" units: 1 game day = 1/252 of a year (trading days)
    // With larger dt, price moves are more visible and realistic
    this.dt = 1 / (252 * ticksPerGameDay)
    this.state = {
      condition: 'normal',
      conditionTicksRemaining: 0,
      sentimentModifier: 0,
      sectorModifiers: {},
      assets: new Map()
    }
  }

  /** Register an asset with configuration */
  registerAsset(config: AssetConfig): void {
    this.configs.set(config.id, config)
    this.state.assets.set(config.id, {
      id: config.id,
      name: config.name,
      currentPrice: config.basePrice,
      previousPrice: config.basePrice,
      priceHistory: [config.basePrice],
      changePercent: 0,
      ath: config.basePrice,
      atl: config.basePrice,
      totalVolume: 0
    })
  }

  /** Set a market-wide condition for a duration (in ticks) */
  setCondition(condition: MarketCondition, durationTicks: number): void {
    this.state.condition = condition
    this.state.conditionTicksRemaining = durationTicks
  }

  /** Set a sector-specific drift modifier */
  setSectorModifier(sector: MarketSector, modifier: number): void {
    this.state.sectorModifiers[sector] = modifier
  }

  /** Clear sector modifier */
  clearSectorModifier(sector: MarketSector): void {
    delete this.state.sectorModifiers[sector]
  }

  /** Advance all asset prices by one tick */
  tick(): void {
    // Update condition timer
    if (this.state.conditionTicksRemaining > 0) {
      this.state.conditionTicksRemaining--
      if (this.state.conditionTicksRemaining <= 0) {
        this.state.condition = 'normal'
      }
    }

    const conditionEffect = CONDITION_EFFECTS[this.state.condition]

    for (const [id, config] of this.configs) {
      const assetState = this.state.assets.get(id)
      if (!assetState) continue

      // Calculate effective drift & volatility
      const sectorMod = this.state.sectorModifiers[config.sector] ?? 0
      const effectiveDrift = config.drift + conditionEffect.driftMod + this.state.sentimentModifier + sectorMod
      const effectiveVol = config.volatility * conditionEffect.volMod

      // Generate random shock
      const z = boxMullerRandom()

      // Step price
      const newPrice = Math.max(
        config.minPrice,
        gbmStep(assetState.currentPrice, effectiveDrift, effectiveVol, this.dt, z)
      )

      // Update state
      assetState.previousPrice = assetState.currentPrice
      assetState.currentPrice = newPrice
      assetState.changePercent =
        assetState.previousPrice > 0
          ? (newPrice - assetState.previousPrice) / assetState.previousPrice
          : 0

      // Track ATH/ATL
      if (newPrice > assetState.ath) assetState.ath = newPrice
      if (newPrice < assetState.atl) assetState.atl = newPrice

      // Push to history (keep bounded)
      assetState.priceHistory.push(newPrice)
      if (assetState.priceHistory.length > config.maxHistory) {
        assetState.priceHistory.shift()
      }
    }
  }

  /** Get current state of a specific asset */
  getAsset(id: string): AssetState | undefined {
    return this.state.assets.get(id)
  }

  /** Get a snapshot of all asset states (for store sync) */
  getAllAssets(): AssetState[] {
    return Array.from(this.state.assets.values())
  }

  /** Get current market condition */
  getCondition(): MarketCondition {
    return this.state.condition
  }

  /** Get full state (for serialization — returns a copy to prevent external mutation) */
  getState(): MarketState {
    return {
      ...this.state,
      assets: new Map(this.state.assets),
      sectorModifiers: { ...this.state.sectorModifiers }
    }
  }

  /** Restore full state (from deserialization) */
  setState(state: MarketState): void {
    this.state = {
      ...state,
      assets: new Map(
        Array.isArray(state.assets as unknown)
          ? (state.assets as unknown as [string, AssetState][])
          : state.assets
      )
    }
  }

  /** Serialize state for JSON (converts Map to array) */
  serialize(): object {
    return {
      condition: this.state.condition,
      conditionTicksRemaining: this.state.conditionTicksRemaining,
      sentimentModifier: this.state.sentimentModifier,
      sectorModifiers: { ...this.state.sectorModifiers },
      assets: Array.from(this.state.assets.entries())
    }
  }

  /** Deserialize state from JSON */
  deserialize(data: {
    condition: MarketCondition
    conditionTicksRemaining: number
    sentimentModifier: number
    sectorModifiers: Partial<Record<MarketSector, number>>
    assets: [string, AssetState][]
  }): void {
    this.state = {
      condition: data.condition,
      conditionTicksRemaining: data.conditionTicksRemaining,
      sentimentModifier: data.sentimentModifier,
      sectorModifiers: data.sectorModifiers,
      assets: new Map(data.assets)
    }
  }
}
