/**
 * Storage Wars — Procedural location generator
 *
 * Instead of a fixed list of locations, generates storage facilities
 * procedurally from tier-based templates. Each generation produces
 * unique names, icons, and stat ranges providing gameplay variety.
 */
import { D } from '@renderer/core/BigNum'
import type { StorageLocation, LocationTier } from './locations'
import { LOCATIONS_PER_TIER } from './balance'

// ─── Tier Configurations ────────────────────────────────────────

interface TierConfig {
  tier: LocationTier
  /** Cash threshold to unlock this tier */
  unlockAt: number
  /** [min, max] entry fee */
  entryFee: [number, number]
  /** [min, max] minimum bid */
  minBid: [number, number]
  /** [min, max] bidder count cap */
  maxBidders: [number, number]
  /** [min, max] value multiplier */
  valueMult: [number, number]
  /** [min, max] rare chance */
  rareChance: [number, number]
  /** [min, max] for minItems */
  minItemsRange: [number, number]
  /** [min, max] for maxItems */
  maxItemsRange: [number, number]
}

const TIER_CONFIGS: TierConfig[] = [
  {
    tier: 'suburban',
    unlockAt: 500,
    entryFee: [8, 20],
    minBid: [20, 40],
    maxBidders: [2, 4],
    valueMult: [0.8, 1.2],
    rareChance: [0.03, 0.07],
    minItemsRange: [2, 3],
    maxItemsRange: [5, 7],
  },
  {
    tier: 'urban',
    unlockAt: 5_000,
    entryFee: [40, 80],
    minBid: [80, 150],
    maxBidders: [3, 5],
    valueMult: [1.5, 2.5],
    rareChance: [0.06, 0.12],
    minItemsRange: [2, 4],
    maxItemsRange: [7, 9],
  },
  {
    tier: 'downtown',
    unlockAt: 25_000,
    entryFee: [150, 350],
    minBid: [400, 700],
    maxBidders: [4, 6],
    valueMult: [3.0, 5.0],
    rareChance: [0.10, 0.18],
    minItemsRange: [3, 4],
    maxItemsRange: [8, 11],
  },
  {
    tier: 'industrial',
    unlockAt: 100_000,
    entryFee: [400, 800],
    minBid: [1_200, 2_000],
    maxBidders: [4, 6],
    valueMult: [5.0, 8.0],
    rareChance: [0.14, 0.22],
    minItemsRange: [3, 5],
    maxItemsRange: [10, 13],
  },
  {
    tier: 'luxury',
    unlockAt: 500_000,
    entryFee: [1_500, 3_000],
    minBid: [4_000, 7_000],
    maxBidders: [5, 7],
    valueMult: [10.0, 18.0],
    rareChance: [0.18, 0.28],
    minItemsRange: [3, 5],
    maxItemsRange: [9, 12],
  },
  {
    tier: 'elite',
    unlockAt: 5_000_000,
    entryFee: [8_000, 15_000],
    minBid: [20_000, 35_000],
    maxBidders: [5, 8],
    valueMult: [25.0, 45.0],
    rareChance: [0.25, 0.38],
    minItemsRange: [4, 6],
    maxItemsRange: [12, 16],
  },
]

// ─── Name Fragments ─────────────────────────────────────────────

const NAME_PREFIXES: Record<LocationTier, string[]> = {
  suburban: [
    'Maple', 'Pine', 'Oakwood', 'Willow', 'Cedar', 'Birch',
    'Sunset', 'Meadow', 'Hillside', 'Lakeside', 'Riverside',
  ],
  urban: [
    'Metro', 'City', 'Central', 'Main St.', 'Uptown', 'Midtown',
    'Harbor', 'Union', 'Market', 'Park Ave', 'Canal',
  ],
  downtown: [
    'Grand', 'Premier', 'Capital', 'Crown', 'Platinum', 'Diamond',
    'Summit', 'Prestige', 'Herald', 'Liberty', 'Empire',
  ],
  industrial: [
    'Ironworks', 'Steelyard', 'Forge', 'Heavy-Duty', 'Titan',
    'Atlas', 'Anvil', 'Weldon', 'Rigger\'s', 'Dockside',
  ],
  luxury: [
    'Belmont', 'Windsor', 'Sterling', 'Ashford', 'Regency',
    'Kensington', 'Mayfair', 'Goldleaf', 'Rothschild', 'Vanderbilt',
  ],
  elite: [
    'Obsidian', 'Sovereign', 'Apex', 'Zenith', 'Paragon',
    'Eclipse', 'Quantum', 'Vanguard', 'Odin\'s', 'Arcanum',
  ],
}

const NAME_SUFFIXES: Record<LocationTier, string[]> = {
  suburban: [
    'Self Storage', 'Storage Units', 'Mini Storage', 'Lock-Up',
    'Garage Lockers', 'Storage Barn', 'Storage Shed',
  ],
  urban: [
    'Storage Depot', 'Storage Center', 'Lockbox', 'Storage Hub',
    'Stash House', 'Container Yard', 'Storage Works',
  ],
  downtown: [
    'Vault Storage', 'Secure Vaults', 'Archive Vaults', 'Safe Storage',
    'Stronghold', 'Premium Vaults', 'Private Storage',
  ],
  industrial: [
    'Storage Complex', 'Warehouse', 'Industrial Park',
    'Freight Depot', 'Storage Yard', 'Container Depot',
  ],
  luxury: [
    'Private Lockers', 'Boutique Storage', 'Estate Vaults',
    'Collection Vaults', 'Gallery Storage', 'Concierge Storage',
  ],
  elite: [
    'Archive Vault', 'Restricted Vault', 'Black Vault',
    'Classified Storage', 'Zero-Access Vault', 'Sanctum',
  ],
}

const TIER_ICONS: Record<LocationTier, string[]> = {
  suburban: ['mdi:garage', 'mdi:home-group', 'mdi:barn', 'mdi:greenhouse'],
  urban: ['mdi:warehouse', 'mdi:office-building', 'mdi:city', 'mdi:store'],
  downtown: ['mdi:bank', 'mdi:domain', 'mdi:city-variant', 'mdi:pillar'],
  industrial: ['mdi:factory', 'mdi:crane', 'mdi:truck', 'mdi:anvil'],
  luxury: ['mdi:safe', 'mdi:diamond', 'mdi:shield-star', 'mdi:crown'],
  elite: ['mdi:shield-crown', 'mdi:star-shooting', 'mdi:eye-lock', 'mdi:key-chain'],
}

const TIER_DESCRIPTIONS: Record<LocationTier, string[]> = {
  suburban: [
    'A quiet neighborhood storage facility. Mostly household items.',
    'Small suburban units, often abandoned by families who moved away.',
    'Dusty garage-style lockers on the edge of town.',
  ],
  urban: [
    'Urban storage facility with a mixed bag of city dwellers\' belongings.',
    'Busy downtown containers — could be anything inside.',
    'City center units from apartment dwellers and small businesses.',
  ],
  downtown: [
    'Premium downtown vaults used by professionals and collectors.',
    'Upscale storage with a higher chance of valuables.',
    'Well-maintained units in the financial district.',
  ],
  industrial: [
    'Massive industrial units that could hold heavy equipment or bulk cargo.',
    'Former factory storage — tools, machinery, and the unexpected.',
    'Large-scale industrial containers from shuttered businesses.',
  ],
  luxury: [
    'High-end storage used by the wealthy. Expect designer goods and fine art.',
    'Climate-controlled units for affluent clients\' prized possessions.',
    'Exclusive facility with biometric access — only the best.',
  ],
  elite: [
    'Top-secret vault facility. Legendary finds rumored within.',
    'Requires special clearance. Contents are completely unknown.',
    'The most exclusive storage in existence. Anything could be inside.',
  ],
}

// ─── Helpers ────────────────────────────────────────────────────

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Generator ──────────────────────────────────────────────────

let _locationCounter = 0

/**
 * Generate a single procedural location for the given tier.
 */
export function generateLocation(tier: LocationTier): StorageLocation {
  const cfg = TIER_CONFIGS.find(c => c.tier === tier)
  if (!cfg) throw new Error(`Unknown tier: ${tier}`)

  const prefix = pick(NAME_PREFIXES[tier])
  const suffix = pick(NAME_SUFFIXES[tier])
  const name = `${prefix} ${suffix}`

  const minItems = randInt(cfg.minItemsRange[0], cfg.minItemsRange[1])
  const maxItems = randInt(Math.max(minItems + 1, cfg.maxItemsRange[0]), cfg.maxItemsRange[1])

  _locationCounter++

  return {
    id: `loc_${tier}_${_locationCounter}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    icon: pick(TIER_ICONS[tier]),
    tier,
    description: pick(TIER_DESCRIPTIONS[tier]),
    unlockAt: D(cfg.unlockAt),
    entryFee: D(Math.round(randRange(cfg.entryFee[0], cfg.entryFee[1]))),
    minBid: D(Math.round(randRange(cfg.minBid[0], cfg.minBid[1]))),
    maxBidders: randInt(cfg.maxBidders[0], cfg.maxBidders[1]),
    valueMultiplier: Math.round(randRange(cfg.valueMult[0], cfg.valueMult[1]) * 100) / 100,
    rareChance: Math.round(randRange(cfg.rareChance[0], cfg.rareChance[1]) * 1000) / 1000,
    maxItems,
    minItems,
  }
}

/**
 * Generate a full set of procedural locations for all unlockable tiers.
 * Returns 1–2 locations per tier (controlled by LOCATIONS_PER_TIER balance constant).
 */
export function generateLocationPool(): StorageLocation[] {
  const pool: StorageLocation[] = []
  for (const cfg of TIER_CONFIGS) {
    const count = randInt(LOCATIONS_PER_TIER[0], LOCATIONS_PER_TIER[1])
    for (let i = 0; i < count; i++) {
      pool.push(generateLocation(cfg.tier))
    }
  }
  return pool
}

/**
 * Regenerate locations for a specific tier (keeping other tiers intact).
 */
export function regenerateTierLocations(
  existingPool: StorageLocation[],
  tier: LocationTier,
): StorageLocation[] {
  const others = existingPool.filter(l => l.tier !== tier)
  const count = randInt(LOCATIONS_PER_TIER[0], LOCATIONS_PER_TIER[1])
  const newLocs: StorageLocation[] = []
  for (let i = 0; i < count; i++) {
    newLocs.push(generateLocation(tier))
  }
  return [...others, ...newLocs]
}

/** All tiers in unlock order. */
export const TIER_ORDER: LocationTier[] = TIER_CONFIGS.map(c => c.tier)

/** Get unlock threshold for a tier. */
export function getTierUnlockAt(tier: LocationTier): number {
  return TIER_CONFIGS.find(c => c.tier === tier)?.unlockAt ?? Infinity
}
