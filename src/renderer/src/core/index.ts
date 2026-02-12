/**
 * Core barrel export
 *
 * Central re-export point for the entire game engine layer.
 * Import from '@renderer/core' instead of individual files.
 */

export { Decimal, D, ZERO, ONE, TEN, HUNDRED, THOUSAND } from './BigNum'
export {
  serializeDecimal,
  deserializeDecimal,
  hydrateDecimals,
  dehydrateDecimals,
  type SerializedDecimal
} from './BigNum'
export * from './BigNum'

export * from './Formulas'
export { GameEngine, gameEngine, type TickContext, type TickCallback } from './GameEngine'
export {
  EconomySimulator,
  economySim,
  createDefaultEconomyState,
  type EconomyState,
  type EconomicPhase
} from './EconomySim'
export { MarketSimulator, type AssetConfig, type AssetState, type MarketState } from './MarketSim'
export type { MarketSector, MarketCondition } from './MarketSim'
export {
  EventSystem,
  type GameEventDef,
  type ActiveEvent,
  type EventSystemState,
  type EventEffect,
  type EventEffectType,
  type EventCategory
} from './EventSystem'
export { calculateOfflineProgress, type OfflineSummary, type OfflineConfig } from './OfflineCalc'
export {
  PlinkoEngine,
  type PlinkoRisk,
  type PlinkoBucketDef,
  type PlinkoPeg,
  type PlinkoBall,
  type PlinkoConfig
} from './PlinkoEngine'
