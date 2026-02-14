/**
 * Storage Wars — Location definitions
 *
 * Each location represents a storage facility tier where auctions take place.
 * Higher tiers have better items but cost more to participate.
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'

export type LocationTier = 'suburban' | 'urban' | 'downtown' | 'industrial' | 'luxury' | 'elite'

export interface StorageLocation {
  id: string
  name: string
  icon: string
  tier: LocationTier
  description: string
  /** Minimum cash required to unlock this location */
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

export const STORAGE_LOCATIONS: StorageLocation[] = [
  {
    id: 'suburban_self_storage',
    name: 'Suburban Self Storage',
    icon: 'mdi:garage',
    tier: 'suburban',
    description: 'Small suburban facility. Mostly household items and old furniture.',
    unlockAt: D(500),
    entryFee: D(10),
    minBid: D(25),
    maxBidders: 3,
    valueMultiplier: 1.0,
    rareChance: 0.05,
    maxItems: 6,
    minItems: 2,
  },
  {
    id: 'city_storage_depot',
    name: 'City Storage Depot',
    icon: 'mdi:warehouse',
    tier: 'urban',
    description: 'Urban storage facility with mixed contents from city dwellers.',
    unlockAt: D(5_000),
    entryFee: D(50),
    minBid: D(100),
    maxBidders: 4,
    valueMultiplier: 2.0,
    rareChance: 0.10,
    maxItems: 8,
    minItems: 3,
  },
  {
    id: 'downtown_vault',
    name: 'Downtown Vault Storage',
    icon: 'mdi:bank',
    tier: 'downtown',
    description: 'Premium downtown storage. Higher chance of valuables and collectibles.',
    unlockAt: D(25_000),
    entryFee: D(200),
    minBid: D(500),
    maxBidders: 5,
    valueMultiplier: 4.0,
    rareChance: 0.18,
    maxItems: 10,
    minItems: 3,
  },
  {
    id: 'industrial_complex',
    name: 'Industrial Storage Complex',
    icon: 'mdi:factory',
    tier: 'industrial',
    description: 'Massive industrial units. Could contain equipment, tools, or bulk inventory.',
    unlockAt: D(100_000),
    entryFee: D(500),
    minBid: D(1_500),
    maxBidders: 5,
    valueMultiplier: 7.0,
    rareChance: 0.22,
    maxItems: 12,
    minItems: 4,
  },
  {
    id: 'luxury_locker',
    name: 'Luxury Locker Facility',
    icon: 'mdi:safe',
    tier: 'luxury',
    description: 'High-end storage for affluent clients. Expect designer goods and art.',
    unlockAt: D(500_000),
    entryFee: D(2_000),
    minBid: D(5_000),
    maxBidders: 6,
    valueMultiplier: 15.0,
    rareChance: 0.30,
    maxItems: 10,
    minItems: 4,
  },
  {
    id: 'elite_archive',
    name: 'Elite Archive Vault',
    icon: 'mdi:shield-crown',
    tier: 'elite',
    description: 'Top-secret elite storage. Legendary finds rumored within.',
    unlockAt: D(5_000_000),
    entryFee: D(10_000),
    minBid: D(25_000),
    maxBidders: 7,
    valueMultiplier: 40.0,
    rareChance: 0.40,
    maxItems: 15,
    minItems: 5,
  },
]

export function getLocation(id: string): StorageLocation | undefined {
  return STORAGE_LOCATIONS.find(l => l.id === id)
}

export function getUnlockedLocations(cash: Decimal): StorageLocation[] {
  return STORAGE_LOCATIONS.filter(l => cash.gte(l.unlockAt))
}
