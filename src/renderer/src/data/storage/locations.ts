/**
 * Storage Wars — Location type definitions
 *
 * This file now only contains the StorageLocation interface and LocationTier type.
 * Actual instances are procedurally generated — see locationGen.ts.
 * Dynamic location pools are managed by useStorageStore.
 */
import type Decimal from 'break_infinity.js'

export type LocationTier = 'suburban' | 'urban' | 'downtown' | 'industrial' | 'luxury' | 'elite'

export interface StorageLocation {
  id: string
  name: string
  icon: string
  tier: LocationTier
  description: string
  /** Minimum cash required to unlock this tier */
  unlockAt: Decimal
  /** Entry fee to participate in auctions at this location */
  entryFee: Decimal
  /** Base minimum bid for units at this location */
  minBid: Decimal
  /** Maximum number of bidders (NPCs) */
  maxBidders: number
  /** Multiplier for item value range at this location */
  valueMultiplier: number
  /** Chance of finding rare+ items (0–1) */
  rareChance: number
  /** Maximum items a unit can contain */
  maxItems: number
  /** Minimum items a unit contains */
  minItems: number
}

/**
 * Look up a location by id inside an externally-provided pool.
 * Components should call `useStorageStore().getLocation(id)` instead.
 */
export function findLocationInPool(pool: StorageLocation[], id: string): StorageLocation | undefined {
  return pool.find(l => l.id === id)
}

/**
 * Return locations whose unlockAt ≤ player cash.
 */
export function getUnlockedLocations(pool: StorageLocation[], cash: Decimal): StorageLocation[] {
  return pool.filter(l => cash.gte(l.unlockAt))
}
