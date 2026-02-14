/**
 * Storage Wars — Appraiser definitions
 *
 * Appraisers can evaluate items to reveal their true value.
 * Higher tier appraisers have better accuracy and can spot hidden value.
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'

export type AppraiserTier = 'amateur' | 'professional' | 'expert' | 'master' | 'legendary'

export interface AppraiserDef {
  id: string
  name: string
  icon: string
  tier: AppraiserTier
  description: string
  /** Cost per item to appraise */
  costPerItem: Decimal
  /** Accuracy: 1.0 = perfect, lower = wider variance */
  accuracy: number
  /** Chance to discover hidden bonus value (0–1) */
  bonusDiscoveryChance: number
  /** Hidden bonus value multiplier when discovered */
  bonusMultiplier: number
  /** Minimum player level to unlock */
  unlockLevel: number
}

export const APPRAISER_DEFS: AppraiserDef[] = [
  {
    id: 'pawn_shop_pete',
    name: 'Pawn Shop Pete',
    icon: 'mdi:account',
    tier: 'amateur',
    description: 'A guy from the local pawn shop. Cheap but not very accurate.',
    costPerItem: D(5),
    accuracy: 0.5,
    bonusDiscoveryChance: 0.05,
    bonusMultiplier: 1.2,
    unlockLevel: 1,
  },
  {
    id: 'martha_the_dealer',
    name: 'Martha the Dealer',
    icon: 'mdi:account-star',
    tier: 'professional',
    description: 'An experienced antique dealer with a keen eye.',
    costPerItem: D(25),
    accuracy: 0.7,
    bonusDiscoveryChance: 0.15,
    bonusMultiplier: 1.5,
    unlockLevel: 5,
  },
  {
    id: 'professor_chen',
    name: 'Professor Chen',
    icon: 'mdi:school',
    tier: 'expert',
    description: 'Art history professor who moonlights as an appraiser.',
    costPerItem: D(100),
    accuracy: 0.85,
    bonusDiscoveryChance: 0.25,
    bonusMultiplier: 2.0,
    unlockLevel: 15,
  },
  {
    id: 'victoria_blackwood',
    name: 'Victoria Blackwood',
    icon: 'mdi:diamond',
    tier: 'master',
    description: 'Former Sotheby\'s specialist. Rarely misses hidden gems.',
    costPerItem: D(500),
    accuracy: 0.95,
    bonusDiscoveryChance: 0.35,
    bonusMultiplier: 3.0,
    unlockLevel: 30,
  },
  {
    id: 'the_oracle',
    name: 'The Oracle',
    icon: 'mdi:crystal-ball',
    tier: 'legendary',
    description: 'Mythical appraiser. Knows the exact value of everything.',
    costPerItem: D(2500),
    accuracy: 1.0,
    bonusDiscoveryChance: 0.50,
    bonusMultiplier: 5.0,
    unlockLevel: 50,
  },
]

export function getAppraiser(id: string): AppraiserDef | undefined {
  return APPRAISER_DEFS.find(a => a.id === id)
}
