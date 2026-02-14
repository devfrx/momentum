import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'

export type PropertyCategory = 'Residential' | 'Commercial' | 'Hospitality' | 'Luxury'

export interface PropertyDef {
  id: string
  name: string
  icon: string
  price: Decimal
  /** Base rent per tick at 100% occupancy, no upgrades */
  baseRent: Decimal
  /** Number of rentable units (apartments, offices, rooms, etc.) */
  units: number
  /** Annual property tax rate (fraction of current value per year) */
  taxRate: number
  /** Base maintenance cost per tick */
  baseMaintenance: Decimal
  /** How fast condition degrades per tick (0–1 scale, subtracted from condition) */
  wearRate: number
  /** Base appreciation per economy cycle period (can go negative in downturns) */
  baseAppreciationRate: number
  /** Cost multiplier for renovations (each level costs more) */
  renovationCostMultiplier: number
  /** Max renovation level */
  maxRenovationLevel: number
  category: PropertyCategory
  /** Minimum net worth to unlock for purchase */
  unlockAt: Decimal
}

export const PROPERTIES: PropertyDef[] = [
  {
    id: 'studio',
    name: 'Studio Apartment',
    icon: 'mdi:home',
    price: D(70_000),
    baseRent: D(1.1),
    units: 1,
    taxRate: 0.012,
    baseMaintenance: D(0.5),
    wearRate: 0.002,
    baseAppreciationRate: 0.001,
    renovationCostMultiplier: 1.5,
    maxRenovationLevel: 10,
    category: 'Residential',
    unlockAt: D(37_500),
  },
  {
    id: 'duplex',
    name: 'Duplex',
    icon: 'mdi:home-group',
    price: D(280_000),
    baseRent: D(4.5),
    units: 2,
    taxRate: 0.012,
    baseMaintenance: D(1.9),
    wearRate: 0.002,
    baseAppreciationRate: 0.0012,
    renovationCostMultiplier: 1.5,
    maxRenovationLevel: 10,
    category: 'Residential',
    unlockAt: D(150_000),
  },
  {
    id: 'townhouse',
    name: 'Townhouse',
    icon: 'mdi:home-city',
    price: D(1_050_000),
    baseRent: D(19),
    units: 3,
    taxRate: 0.014,
    baseMaintenance: D(7.5),
    wearRate: 0.0015,
    baseAppreciationRate: 0.0015,
    renovationCostMultiplier: 1.6,
    maxRenovationLevel: 8,
    category: 'Residential',
    unlockAt: D(600_000),
  },
  {
    id: 'strip_mall',
    name: 'Strip Mall',
    icon: 'mdi:store',
    price: D(2_800_000),
    baseRent: D(53),
    units: 6,
    taxRate: 0.017,
    baseMaintenance: D(23),
    wearRate: 0.0018,
    baseAppreciationRate: 0.001,
    renovationCostMultiplier: 1.7,
    maxRenovationLevel: 8,
    category: 'Commercial',
    unlockAt: D(1_500_000),
  },
  {
    id: 'apartment_complex',
    name: 'Apartment Complex',
    icon: 'mdi:office-building',
    price: D(14_000_000),
    baseRent: D(225),
    units: 50,
    taxRate: 0.014,
    baseMaintenance: D(100),
    wearRate: 0.002,
    baseAppreciationRate: 0.0012,
    renovationCostMultiplier: 1.8,
    maxRenovationLevel: 6,
    category: 'Residential',
    unlockAt: D(7_500_000),
  },
  {
    id: 'office_tower',
    name: 'Office Tower',
    icon: 'mdi:office-building-cog',
    price: D(70_000_000),
    baseRent: D(1350),
    units: 30,
    taxRate: 0.021,
    baseMaintenance: D(625),
    wearRate: 0.0015,
    baseAppreciationRate: 0.0008,
    renovationCostMultiplier: 2.0,
    maxRenovationLevel: 5,
    category: 'Commercial',
    unlockAt: D(37_500_000),
  },
  {
    id: 'hotel',
    name: 'Luxury Hotel',
    icon: 'mdi:bed',
    price: D(280_000_000),
    baseRent: D(6000),
    units: 120,
    taxRate: 0.017,
    baseMaintenance: D(3125),
    wearRate: 0.0025,
    baseAppreciationRate: 0.001,
    renovationCostMultiplier: 2.2,
    maxRenovationLevel: 4,
    category: 'Hospitality',
    unlockAt: D(150_000_000),
  },
  {
    id: 'skyscraper',
    name: 'Skyscraper',
    icon: 'mdi:city',
    price: D(1.4e9),
    baseRent: D(37_500),
    units: 80,
    taxRate: 0.023,
    baseMaintenance: D(18_750),
    wearRate: 0.0012,
    baseAppreciationRate: 0.0015,
    renovationCostMultiplier: 2.5,
    maxRenovationLevel: 3,
    category: 'Commercial',
    unlockAt: D(750_000_000),
  },
  {
    id: 'island',
    name: 'Private Island',
    icon: 'mdi:island',
    price: D(14e9),
    baseRent: D(262_500),
    units: 10,
    taxRate: 0.009,
    baseMaintenance: D(125_000),
    wearRate: 0.001,
    baseAppreciationRate: 0.002,
    renovationCostMultiplier: 3.0,
    maxRenovationLevel: 3,
    category: 'Luxury',
    unlockAt: D(7.5e9),
  },
]
