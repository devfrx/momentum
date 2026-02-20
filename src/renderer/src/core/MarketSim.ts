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
  /** Max number of tick-level prices to keep (recent data for charts) */
  maxHistory: number
  /** Max number of daily close prices to keep (long-term history). Default 2000 (~5.5 game years). */
  dailyHistoryMax?: number
  /** Annual dividend yield as a fraction (e.g. 0.035 = 3.5%). 0 = no dividends. */
  dividendYield?: number
  /** Annual staking yield as a fraction (for crypto). 0 = no staking rewards. */
  stakingYield?: number
}

/** OHLC candle data for candlestick charts */
export interface CandlestickData {
  /** Opening price of the candle period */
  open: number
  /** Highest price during the candle period */
  high: number
  /** Lowest price during the candle period */
  low: number
  /** Closing price of the candle period */
  close: number
  /** Timestamp (game tick) when the candle started */
  timestamp: number
}

export interface AssetState {
  id: string
  name: string
  currentPrice: number
  previousPrice: number
  /** Tick-level price history (recent data, bounded by maxHistory) */
  priceHistory: number[]
  /** Daily close prices (one sample per game day, long-term history) */
  dailyHistory: number[]
  /** OHLC candlestick data (one candle per game day, for candlestick charts) */
  candlestickHistory: CandlestickData[]
  /** Change since last tick as a ratio (-0.05 = -5%) */
  changePercent: number
  /** All-time high */
  ath: number
  /** All-time low */
  atl: number
  /** Total volume traded (game metric) */
  totalVolume: number
}

// ─── Market Trend Analysis ──────────────────────────────────────────

export type MarketTrend = 'strong_bull' | 'bull' | 'neutral' | 'bear' | 'strong_bear'
export type MarketPhase = 'normal' | 'bubble' | 'correction' | 'crash' | 'recovery'

export interface MarketAnalysis {
  /** Current detected trend across all assets */
  trend: MarketTrend
  /** Current market phase (bubble/crash detection) */
  phase: MarketPhase
  /** Short-term momentum (-1 to +1) */
  shortTermMomentum: number
  /** Medium-term momentum (-1 to +1) */
  mediumTermMomentum: number
  /** Average distance from ATH across assets (0 = at ATH, 1 = 100% below) */
  avgDistanceFromAth: number
  /** Volatility index (VIX-like): average recent volatility across assets */
  volatilityIndex: number
  /** Fear & Greed index (0-100, 0 = extreme fear, 100 = extreme greed) */
  fearGreedIndex: number
  /** Active market condition from the simulator */
  activeCondition: MarketCondition
  /** Ticks remaining for active condition */
  conditionTicksRemaining: number
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
  bubble: { driftMod: 0.4, volMod: 1.3 }
}

// ─── Market Simulator ───────────────────────────────────────────────

export class MarketSimulator {
  private configs: Map<string, AssetConfig> = new Map()
  private state: MarketState

  /** Time step per tick: represents a fraction of a trading year */
  private readonly dt: number
  /** Simulator ticks per game day (e.g. 2.4) */
  private readonly ticksPerDay: number
  /** Accumulator for daily history sampling */
  private dayAccumulator: number = 0
  /** Current in-progress candle OHLC per asset (accumulates during each game day) */
  private candleAccumulators: Map<string, { open: number; high: number; low: number; startTick: number }> = new Map()
  /** Total ticks elapsed (for candle timestamps) */
  private totalTicks: number = 0
  /** Max number of candles to keep per asset */
  private readonly maxCandles: number = 2000

  constructor(ticksPerGameDay: number = 120) {
    // dt in "annual" units: 1 game day = 1/252 of a year (trading days)
    // With larger dt, price moves are more visible and realistic
    this.dt = 1 / (252 * ticksPerGameDay)
    this.ticksPerDay = ticksPerGameDay
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
      dailyHistory: [],
      candlestickHistory: [],
      changePercent: 0,
      ath: config.basePrice,
      atl: config.basePrice,
      totalVolume: 0
    })
    // Initialize candle accumulator for this asset
    this.candleAccumulators.set(config.id, {
      open: config.basePrice,
      high: config.basePrice,
      low: config.basePrice,
      startTick: this.totalTicks
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

      // ── Update candle accumulator (track high/low during the day) ──
      const candle = this.candleAccumulators.get(id)
      if (candle) {
        if (newPrice > candle.high) candle.high = newPrice
        if (newPrice < candle.low) candle.low = newPrice
      }
    }

    // ── Daily history sampling & candle close ──────────────────────
    this.totalTicks += 1
    this.dayAccumulator += 1
    if (this.dayAccumulator >= this.ticksPerDay) {
      this.dayAccumulator -= this.ticksPerDay
      for (const [id, config] of this.configs) {
        const assetState = this.state.assets.get(id)
        if (!assetState) continue

        // Daily close price
        assetState.dailyHistory.push(assetState.currentPrice)
        const maxDaily = config.dailyHistoryMax ?? 2000
        if (assetState.dailyHistory.length > maxDaily) {
          assetState.dailyHistory.shift()
        }

        // Close current candle & start a new one
        const candle = this.candleAccumulators.get(id)
        if (candle) {
          assetState.candlestickHistory.push({
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: assetState.currentPrice,
            timestamp: candle.startTick
          })
          if (assetState.candlestickHistory.length > this.maxCandles) {
            assetState.candlestickHistory.shift()
          }
          // Start new candle
          this.candleAccumulators.set(id, {
            open: assetState.currentPrice,
            high: assetState.currentPrice,
            low: assetState.currentPrice,
            startTick: this.totalTicks
          })
        }
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

  /** Set market-wide sentiment modifier (added to drift for all assets) */
  setSentimentModifier(modifier: number): void {
    this.state.sentimentModifier = modifier
  }

  /** Get current sentiment modifier */
  getSentimentModifier(): number {
    return this.state.sentimentModifier
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
      assets: Array.from(this.state.assets.entries()),
      dayAccumulator: this.dayAccumulator,
      totalTicks: this.totalTicks,
      candleAccumulators: Array.from(this.candleAccumulators.entries())
    }
  }

  /** Deserialize state from JSON */
  deserialize(data: {
    condition: MarketCondition
    conditionTicksRemaining: number
    sentimentModifier: number
    sectorModifiers: Partial<Record<MarketSector, number>>
    assets: [string, AssetState][]
    dayAccumulator?: number
    totalTicks?: number
    candleAccumulators?: [string, { open: number; high: number; low: number; startTick: number }][]
  }): void {
    this.dayAccumulator = data.dayAccumulator ?? 0
    this.totalTicks = data.totalTicks ?? 0
    // Restore candle accumulators
    if (data.candleAccumulators) {
      this.candleAccumulators = new Map(data.candleAccumulators)
    }
    // Ensure dailyHistory and candlestickHistory exist for each asset (backward compat with old saves)
    const entries: [string, AssetState][] = data.assets.map(([id, state]) => [
      id,
      { ...state, dailyHistory: state.dailyHistory ?? [], candlestickHistory: state.candlestickHistory ?? [] }
    ])
    this.state = {
      condition: data.condition,
      conditionTicksRemaining: data.conditionTicksRemaining,
      sentimentModifier: data.sentimentModifier,
      sectorModifiers: data.sectorModifiers,
      assets: new Map(entries)
    }
    // Re-initialize candle accumulators for any assets that don't have one
    for (const [id, assetState] of this.state.assets) {
      if (!this.candleAccumulators.has(id)) {
        this.candleAccumulators.set(id, {
          open: assetState.currentPrice,
          high: assetState.currentPrice,
          low: assetState.currentPrice,
          startTick: this.totalTicks
        })
      }
    }
  }

  // ─── Market Trend Analysis ──────────────────────────────────────

  /**
   * Analyze current market conditions by examining price histories.
   * Returns a comprehensive market analysis object.
   */
  analyzeMarket(): MarketAnalysis {
    const assets = Array.from(this.state.assets.values())
    if (assets.length === 0) {
      return {
        trend: 'neutral',
        phase: 'normal',
        shortTermMomentum: 0,
        mediumTermMomentum: 0,
        avgDistanceFromAth: 0,
        volatilityIndex: 0,
        fearGreedIndex: 50,
        activeCondition: this.state.condition,
        conditionTicksRemaining: this.state.conditionTicksRemaining
      }
    }

    // ── Momentum calculation ──
    // Short-term: last 10 ticks, Medium-term: last 50 ticks
    const shortWindow = 10
    const mediumWindow = 50

    let shortMomSum = 0
    let mediumMomSum = 0
    let athDistSum = 0
    let volSum = 0
    let validCount = 0

    for (const asset of assets) {
      const history = asset.priceHistory
      if (history.length < 2) continue
      validCount++

      // Short-term momentum: % change over last N ticks
      const shortStart = history[Math.max(0, history.length - shortWindow)]
      const shortEnd = history[history.length - 1]
      shortMomSum += shortStart > 0 ? (shortEnd - shortStart) / shortStart : 0

      // Medium-term momentum: % change over last N ticks
      const medStart = history[Math.max(0, history.length - mediumWindow)]
      const medEnd = history[history.length - 1]
      mediumMomSum += medStart > 0 ? (medEnd - medStart) / medStart : 0

      // Distance from ATH (0 = at ATH, 1 = 100% below)
      athDistSum += asset.ath > 0 ? 1 - asset.currentPrice / asset.ath : 0

      // Volatility: standard deviation of recent returns
      const recentPrices = history.slice(-Math.min(30, history.length))
      if (recentPrices.length > 1) {
        const returns: number[] = []
        for (let i = 1; i < recentPrices.length; i++) {
          if (recentPrices[i - 1] > 0) {
            returns.push((recentPrices[i] - recentPrices[i - 1]) / recentPrices[i - 1])
          }
        }
        if (returns.length > 0) {
          const mean = returns.reduce((s, r) => s + r, 0) / returns.length
          const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
          volSum += Math.sqrt(variance)
        }
      }
    }

    if (validCount === 0) validCount = 1
    const shortTermMomentum = Math.max(-1, Math.min(1, shortMomSum / validCount * 10))
    const mediumTermMomentum = Math.max(-1, Math.min(1, mediumMomSum / validCount * 5))
    const avgDistanceFromAth = athDistSum / validCount
    const volatilityIndex = Math.min(100, volSum / validCount * 1000)

    // ── Trend detection ──
    const combinedMomentum = shortTermMomentum * 0.4 + mediumTermMomentum * 0.6
    let trend: MarketTrend
    if (combinedMomentum > 0.5) trend = 'strong_bull'
    else if (combinedMomentum > 0.15) trend = 'bull'
    else if (combinedMomentum < -0.5) trend = 'strong_bear'
    else if (combinedMomentum < -0.15) trend = 'bear'
    else trend = 'neutral'

    // ── Phase detection ──
    let phase: MarketPhase = 'normal'
    if (this.state.condition === 'crash') {
      phase = 'crash'
    } else if (this.state.condition === 'bubble') {
      phase = 'bubble'
    } else if (avgDistanceFromAth < 0.03 && mediumTermMomentum > 0.4) {
      phase = 'bubble' // near ATH with strong upward momentum
    } else if (avgDistanceFromAth > 0.25 && mediumTermMomentum < -0.3) {
      phase = 'crash' // far from ATH with strong downward momentum
    } else if (avgDistanceFromAth > 0.15 && mediumTermMomentum > 0.1) {
      phase = 'recovery' // recovering from a dip
    } else if (avgDistanceFromAth > 0.10 && mediumTermMomentum < -0.1) {
      phase = 'correction' // pulling back from recent highs
    }

    // ── Fear & Greed Index ──
    // Composite score: momentum (40%), volatility inverse (30%), ATH distance inverse (30%)
    const momentumScore = (combinedMomentum + 1) / 2 * 100 // 0-100
    const volScore = Math.max(0, 100 - volatilityIndex * 2)  // low vol = high score
    const athScore = (1 - avgDistanceFromAth) * 100           // near ATH = high score
    const fearGreedIndex = Math.round(
      momentumScore * 0.4 + volScore * 0.3 + athScore * 0.3
    )

    return {
      trend,
      phase,
      shortTermMomentum,
      mediumTermMomentum,
      avgDistanceFromAth,
      volatilityIndex,
      fearGreedIndex: Math.max(0, Math.min(100, fearGreedIndex)),
      activeCondition: this.state.condition,
      conditionTicksRemaining: this.state.conditionTicksRemaining
    }
  }
}
