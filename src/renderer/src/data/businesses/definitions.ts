/**
 * Business definitions — static data for all purchasable businesses
 *
 * Each business can be purchased multiple times (infinite levels).
 * Costs scale exponentially: purchasePrice × 1.15^level
 * Output scales with level^1.05
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
export const LEVEL_OUTPUT_EXPONENT = 1.05
/** Branch cost growth rate */
export const BRANCH_COST_GROWTH = 1.65
/** Training cost growth rate */
export const TRAINING_COST_GROWTH = 1.40

export const BUSINESS_DEFS: BusinessDef[] = [
  {
    id: 'lemonade',
    name: 'Lemonade Stand',
    nameKey: 'business.name_lemonade',
    icon: 'mdi:cup',
    purchasePrice: D(12000),
    category: 'Starter',
    unlockAtNetWorth: D(4000),
    baseRevenuePerUnit: 1.6,
    optimalPrice: 1.6,
    baseCustomers: 5,
    elasticity: 1.2,
    supplyCostPerUnit: 0.65,
    baseRent: 0.35,
    baseSalary: 0.55,
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
    baseRevenuePerUnit: 2.4,
    optimalPrice: 2.4,
    baseCustomers: 8,
    elasticity: 0.8,
    supplyCostPerUnit: 1.3,
    baseRent: 0.6,
    baseSalary: 0.8,
    outputPerEmployee: 6,
    baseQuality: 40,
    qualityUpgradeCost: D(3000),
    sectorMultiplier: 0.7,
    branchBaseCost: D(180000),
    maxEmployeesBase: 8,
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
    baseRevenuePerUnit: 8,
    optimalPrice: 8,
    baseCustomers: 4,
    elasticity: 1.0,
    supplyCostPerUnit: 3.8,
    baseRent: 2.3,
    baseSalary: 1.35,
    outputPerEmployee: 2,
    baseQuality: 50,
    qualityUpgradeCost: D(6000),
    sectorMultiplier: 0.9,
    branchBaseCost: D(600000),
    maxEmployeesBase: 6,
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
    baseRevenuePerUnit: 6.5,
    optimalPrice: 6.5,
    baseCustomers: 8,
    elasticity: 1.1,
    supplyCostPerUnit: 3.8,
    baseRent: 4.6,
    baseSalary: 1.7,
    outputPerEmployee: 3,
    baseQuality: 50,
    qualityUpgradeCost: D(12000),
    sectorMultiplier: 1.0,
    branchBaseCost: D(1800000),
    maxEmployeesBase: 10,
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
    baseRevenuePerUnit: 16,
    optimalPrice: 16,
    baseCustomers: 6,
    elasticity: 0.7,
    supplyCostPerUnit: 3.3,
    baseRent: 9.0,
    baseSalary: 2.8,
    outputPerEmployee: 4,
    baseQuality: 50,
    qualityUpgradeCost: D(30000),
    sectorMultiplier: 1.1,
    branchBaseCost: D(5000000),
    maxEmployeesBase: 12,
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
    baseRevenuePerUnit: 4,
    optimalPrice: 4,
    baseCustomers: 15,
    elasticity: 1.3,
    supplyCostPerUnit: 2.2,
    baseRent: 6.8,
    baseSalary: 2.0,
    outputPerEmployee: 6,
    baseQuality: 55,
    qualityUpgradeCost: D(60000),
    sectorMultiplier: 1.2,
    branchBaseCost: D(12000000),
    maxEmployeesBase: 15,
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
    baseRevenuePerUnit: 32,
    optimalPrice: 32,
    baseCustomers: 5,
    elasticity: 1.5,
    supplyCostPerUnit: 20,
    baseRent: 14,
    baseSalary: 3.4,
    outputPerEmployee: 2,
    baseQuality: 60,
    qualityUpgradeCost: D(120000),
    sectorMultiplier: 1.3,
    branchBaseCost: D(30000000),
    maxEmployeesBase: 8,
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
    baseRevenuePerUnit: 48,
    optimalPrice: 48,
    baseCustomers: 4,
    elasticity: 0.9,
    supplyCostPerUnit: 27.5,
    baseRent: 20,
    baseSalary: 5.5,
    outputPerEmployee: 2,
    baseQuality: 65,
    qualityUpgradeCost: D(300000),
    sectorMultiplier: 1.2,
    branchBaseCost: D(100000000),
    maxEmployeesBase: 10,
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
    baseRevenuePerUnit: 20,
    optimalPrice: 20,
    baseCustomers: 12,
    elasticity: 1.0,
    supplyCostPerUnit: 8.8,
    baseRent: 33,
    baseSalary: 4.5,
    outputPerEmployee: 4,
    baseQuality: 50,
    qualityUpgradeCost: D(600000),
    sectorMultiplier: 1.4,
    branchBaseCost: D(300000000),
    maxEmployeesBase: 15,
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
    baseRevenuePerUnit: 85,
    optimalPrice: 85,
    baseCustomers: 8,
    elasticity: 0.8,
    supplyCostPerUnit: 38,
    baseRent: 80,
    baseSalary: 9.0,
    outputPerEmployee: 2,
    baseQuality: 60,
    qualityUpgradeCost: D(2000000),
    sectorMultiplier: 1.3,
    branchBaseCost: D(1250000000),
    maxEmployeesBase: 20,
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
    baseRevenuePerUnit: 25,
    optimalPrice: 25,
    baseCustomers: 20,
    elasticity: 0.6,
    supplyCostPerUnit: 5.5,
    baseRent: 55,
    baseSalary: 16.5,
    outputPerEmployee: 5,
    baseQuality: 50,
    qualityUpgradeCost: D(10000000),
    sectorMultiplier: 2.0,
    branchBaseCost: D(6000000000),
    maxEmployeesBase: 25,
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
    baseRevenuePerUnit: 100,
    optimalPrice: 100,
    baseCustomers: 15,
    elasticity: 0.5,
    supplyCostPerUnit: 55,
    baseRent: 160,
    baseSalary: 13.5,
    outputPerEmployee: 4,
    baseQuality: 55,
    qualityUpgradeCost: D(50000000),
    sectorMultiplier: 1.5,
    branchBaseCost: D(30000000000),
    maxEmployeesBase: 30,
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
    baseRevenuePerUnit: 250,
    optimalPrice: 250,
    baseCustomers: 10,
    elasticity: 0.4,
    supplyCostPerUnit: 27.5,
    baseRent: 320,
    baseSalary: 44,
    outputPerEmployee: 3,
    baseQuality: 60,
    qualityUpgradeCost: D(500000000),
    sectorMultiplier: 2.5,
    branchBaseCost: D(300000000000),
    maxEmployeesBase: 20,
    trainingBaseCost: D(1250000000),
  },
]
