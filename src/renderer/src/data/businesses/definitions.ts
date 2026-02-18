/**
 * Business definitions — static data for all purchasable businesses
 *
 * Each business can be purchased multiple times (infinite levels).
 * Costs scale exponentially: purchasePrice × 1.18^level
 * Output scales with level^1.05
 *
 * Balance targets (level 1, full staff, optimal price, no multipliers):
 *   - All businesses profitable: margins 27–36%
 *   - ROI curve: 8 min (starter) → 31 hrs (endgame)
 *   - Late-game businesses use higher unit prices to reflect industry scale
 *   - Capacity ≈ demand (minimal employee waste)
 */
import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'

export type BusinessCategory =
  | 'Starter'
  | 'Food'
  | 'Services'
  | 'Retail'
  | 'Entertainment'
  | 'Tech'
  | 'Industry'
  | 'Finance'

export interface BusinessDef {
  id: string
  name: string
  nameKey: string
  icon: string
  /** Base price to acquire the first level */
  purchasePrice: Decimal
  /** Category for grouping & synergies */
  category: BusinessCategory
  /** Minimum net worth to unlock for purchase */
  unlockAtNetWorth: Decimal
  /** Base revenue per unit per tick */
  baseRevenuePerUnit: number
  /** Base customer volume per tick at optimal conditions */
  baseCustomers: number
  /** Price elasticity (how sensitive demand is to price changes) */
  elasticity: number
  /** Cost of supplies per unit produced */
  supplyCostPerUnit: number
  /** Rent per tick for this business type */
  baseRent: number
  /** Salary per employee per tick */
  baseSalary: number
  /** How many units each employee can produce per tick */
  outputPerEmployee: number
  /** Starting quality (0-100) */
  baseQuality: number
  /** Base cost to upgrade quality by 1 point */
  qualityUpgradeCost: Decimal
  /** Sector multiplier for valuation */
  sectorMultiplier: number
  /** Optimal price per unit (demand curve center) */
  optimalPrice: number
  /** Base cost to open a branch */
  branchBaseCost: Decimal
  /** Max employees per business level */
  maxEmployeesBase: number
  /** Base training cost */
  trainingBaseCost: Decimal
}

/** Cost growth rate per level */
export const LEVEL_COST_GROWTH = 1.18
/** Output scaling exponent per level */
export const LEVEL_OUTPUT_EXPONENT = 0.75
/** Branch cost growth rate */
export const BRANCH_COST_GROWTH = 1.30
/** Training cost growth rate */
export const TRAINING_COST_GROWTH = 1.25

export const BUSINESS_DEFS: BusinessDef[] = [
  {
    id: 'lemonade',
    name: 'Lemonade Stand',
    nameKey: 'business.name_lemonade',
    icon: 'mdi:cup',
    purchasePrice: D(12000),
    category: 'Starter',
    unlockAtNetWorth: D(4000),
    baseRevenuePerUnit: 2.2,
    optimalPrice: 2.2,
    baseCustomers: 5,
    elasticity: 1.2,
    supplyCostPerUnit: 1.0,
    baseRent: 0.3,
    baseSalary: 0.5,
    outputPerEmployee: 4,
    baseQuality: 50,
    qualityUpgradeCost: D(1000),
    sectorMultiplier: 0.8,
    branchBaseCost: D(60000),
    maxEmployeesBase: 5,
    trainingBaseCost: D(5000),
  },
  {
    id: 'newspaper',
    name: 'Newspaper Delivery',
    nameKey: 'business.name_newspaper',
    icon: 'mdi:newspaper',
    purchasePrice: D(35000),
    category: 'Starter',
    unlockAtNetWorth: D(16000),
    baseRevenuePerUnit: 3.9,
    optimalPrice: 3.9,
    baseCustomers: 8,
    elasticity: 0.8,
    supplyCostPerUnit: 1.75,
    baseRent: 0.5,
    baseSalary: 0.8,
    outputPerEmployee: 4,
    baseQuality: 45,
    qualityUpgradeCost: D(3000),
    sectorMultiplier: 0.7,
    branchBaseCost: D(180000),
    maxEmployeesBase: 4,
    trainingBaseCost: D(12000),
  },
  {
    id: 'carwash',
    name: 'Car Wash',
    nameKey: 'business.name_carwash',
    icon: 'mdi:car-wash',
    purchasePrice: D(120000),
    category: 'Services',
    unlockAtNetWorth: D(60000),
    baseRevenuePerUnit: 18,
    optimalPrice: 18,
    baseCustomers: 6,
    elasticity: 1.0,
    supplyCostPerUnit: 8,
    baseRent: 2.0,
    baseSalary: 1.5,
    outputPerEmployee: 2,
    baseQuality: 50,
    qualityUpgradeCost: D(6000),
    sectorMultiplier: 0.9,
    branchBaseCost: D(600000),
    maxEmployeesBase: 5,
    trainingBaseCost: D(20000),
  },
  {
    id: 'pizzeria',
    name: 'Pizza Shop',
    nameKey: 'business.name_pizzeria',
    icon: 'mdi:pizza',
    purchasePrice: D(350000),
    category: 'Food',
    unlockAtNetWorth: D(160000),
    baseRevenuePerUnit: 24,
    optimalPrice: 24,
    baseCustomers: 10,
    elasticity: 1.1,
    supplyCostPerUnit: 11,
    baseRent: 4.0,
    baseSalary: 2.5,
    outputPerEmployee: 3,
    baseQuality: 50,
    qualityUpgradeCost: D(12000),
    sectorMultiplier: 1.0,
    branchBaseCost: D(1800000),
    maxEmployeesBase: 6,
    trainingBaseCost: D(50000),
  },
  {
    id: 'gym',
    name: 'Fitness Center',
    nameKey: 'business.name_gym',
    icon: 'mdi:dumbbell',
    purchasePrice: D(1000000),
    category: 'Services',
    unlockAtNetWorth: D(500000),
    baseRevenuePerUnit: 54,
    optimalPrice: 54,
    baseCustomers: 15,
    elasticity: 0.7,
    supplyCostPerUnit: 24,
    baseRent: 8,
    baseSalary: 5,
    outputPerEmployee: 3,
    baseQuality: 50,
    qualityUpgradeCost: D(30000),
    sectorMultiplier: 1.1,
    branchBaseCost: D(5000000),
    maxEmployeesBase: 7,
    trainingBaseCost: D(125000),
  },
  {
    id: 'cafe',
    name: 'Coffee Chain',
    nameKey: 'business.name_cafe',
    icon: 'mdi:coffee',
    purchasePrice: D(2500000),
    category: 'Food',
    unlockAtNetWorth: D(1200000),
    baseRevenuePerUnit: 75,
    optimalPrice: 75,
    baseCustomers: 25,
    elasticity: 1.3,
    supplyCostPerUnit: 34,
    baseRent: 10,
    baseSalary: 6,
    outputPerEmployee: 4,
    baseQuality: 55,
    qualityUpgradeCost: D(60000),
    sectorMultiplier: 1.2,
    branchBaseCost: D(12000000),
    maxEmployeesBase: 9,
    trainingBaseCost: D(200000),
  },
  {
    id: 'boutique',
    name: 'Fashion Boutique',
    nameKey: 'business.name_boutique',
    icon: 'mdi:hanger',
    purchasePrice: D(6000000),
    category: 'Retail',
    unlockAtNetWorth: D(3000000),
    baseRevenuePerUnit: 188,
    optimalPrice: 188,
    baseCustomers: 10,
    elasticity: 1.5,
    supplyCostPerUnit: 85,
    baseRent: 15,
    baseSalary: 10,
    outputPerEmployee: 3,
    baseQuality: 55,
    qualityUpgradeCost: D(120000),
    sectorMultiplier: 1.3,
    branchBaseCost: D(30000000),
    maxEmployeesBase: 5,
    trainingBaseCost: D(375000),
  },
  {
    id: 'restaurant',
    name: 'Fine Dining',
    nameKey: 'business.name_restaurant',
    icon: 'mdi:silverware-fork-knife',
    purchasePrice: D(20000000),
    category: 'Food',
    unlockAtNetWorth: D(10000000),
    baseRevenuePerUnit: 480,
    optimalPrice: 480,
    baseCustomers: 14,
    elasticity: 0.9,
    supplyCostPerUnit: 216,
    baseRent: 30,
    baseSalary: 20,
    outputPerEmployee: 3,
    baseQuality: 60,
    qualityUpgradeCost: D(300000),
    sectorMultiplier: 1.2,
    branchBaseCost: D(100000000),
    maxEmployeesBase: 7,
    trainingBaseCost: D(750000),
  },
  {
    id: 'nightclub',
    name: 'Nightclub',
    nameKey: 'business.name_nightclub',
    icon: 'mdi:music-note',
    purchasePrice: D(60000000),
    category: 'Entertainment',
    unlockAtNetWorth: D(30000000),
    baseRevenuePerUnit: 690,
    optimalPrice: 690,
    baseCustomers: 36,
    elasticity: 1.0,
    supplyCostPerUnit: 310,
    baseRent: 50,
    baseSalary: 30,
    outputPerEmployee: 5,
    baseQuality: 50,
    qualityUpgradeCost: D(600000),
    sectorMultiplier: 1.4,
    branchBaseCost: D(300000000),
    maxEmployeesBase: 10,
    trainingBaseCost: D(1500000),
  },
  {
    id: 'hotel',
    name: 'Hotel & Resort',
    nameKey: 'business.name_hotel',
    icon: 'mdi:bed',
    purchasePrice: D(250000000),
    category: 'Services',
    unlockAtNetWorth: D(120000000),
    baseRevenuePerUnit: 2800,
    optimalPrice: 2800,
    baseCustomers: 36,
    elasticity: 0.8,
    supplyCostPerUnit: 1260,
    baseRent: 100,
    baseSalary: 50,
    outputPerEmployee: 4,
    baseQuality: 60,
    qualityUpgradeCost: D(2000000),
    sectorMultiplier: 1.3,
    branchBaseCost: D(1250000000),
    maxEmployeesBase: 14,
    trainingBaseCost: D(7500000),
  },
  {
    id: 'tech_startup',
    name: 'Tech Company',
    nameKey: 'business.name_tech_startup',
    icon: 'mdi:laptop',
    purchasePrice: D(1250000000),
    category: 'Tech',
    unlockAtNetWorth: D(600000000),
    baseRevenuePerUnit: 5600,
    optimalPrice: 5600,
    baseCustomers: 110,
    elasticity: 0.6,
    supplyCostPerUnit: 2520,
    baseRent: 200,
    baseSalary: 100,
    outputPerEmployee: 8,
    baseQuality: 55,
    qualityUpgradeCost: D(10000000),
    sectorMultiplier: 2.0,
    branchBaseCost: D(6000000000),
    maxEmployeesBase: 20,
    trainingBaseCost: D(30000000),
  },
  {
    id: 'factory',
    name: 'Manufacturing Plant',
    nameKey: 'business.name_factory',
    icon: 'mdi:factory',
    purchasePrice: D(6000000000),
    category: 'Industry',
    unlockAtNetWorth: D(3000000000),
    baseRevenuePerUnit: 23000,
    optimalPrice: 23000,
    baseCustomers: 135,
    elasticity: 0.5,
    supplyCostPerUnit: 10350,
    baseRent: 400,
    baseSalary: 200,
    outputPerEmployee: 8,
    baseQuality: 55,
    qualityUpgradeCost: D(50000000),
    sectorMultiplier: 1.5,
    branchBaseCost: D(30000000000),
    maxEmployeesBase: 25,
    trainingBaseCost: D(150000000),
  },
  {
    id: 'bank',
    name: 'Investment Bank',
    nameKey: 'business.name_bank',
    icon: 'mdi:bank',
    purchasePrice: D(60000000000),
    category: 'Finance',
    unlockAtNetWorth: D(30000000000),
    baseRevenuePerUnit: 253000,
    optimalPrice: 253000,
    baseCustomers: 77,
    elasticity: 0.4,
    supplyCostPerUnit: 113850,
    baseRent: 1000,
    baseSalary: 500,
    outputPerEmployee: 6,
    baseQuality: 60,
    qualityUpgradeCost: D(500000000),
    sectorMultiplier: 2.5,
    branchBaseCost: D(300000000000),
    maxEmployeesBase: 20,
    trainingBaseCost: D(1250000000),
  },
]
