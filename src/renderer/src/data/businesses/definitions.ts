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
export const LEVEL_COST_GROWTH = 1.15
/** Output scaling exponent per level */
export const LEVEL_OUTPUT_EXPONENT = 1.05
/** Branch cost growth rate */
export const BRANCH_COST_GROWTH = 1.5
/** Training cost growth rate */
export const TRAINING_COST_GROWTH = 1.3

export const BUSINESS_DEFS: BusinessDef[] = [
  {
    id: 'lemonade',
    name: 'Lemonade Stand',
    nameKey: 'business.name_lemonade',
    icon: 'mdi:cup',
    purchasePrice: D(500),
    category: 'Starter',
    unlockAtNetWorth: D(0),
    baseRevenuePerUnit: 3,
    optimalPrice: 3,
    baseCustomers: 8,
    elasticity: 1.2,
    supplyCostPerUnit: 0.5,
    baseRent: 0.1,
    baseSalary: 0.3,
    outputPerEmployee: 5,
    baseQuality: 50,
    qualityUpgradeCost: D(100),
    sectorMultiplier: 0.8,
    branchBaseCost: D(2500),
    maxEmployeesBase: 5,
    trainingBaseCost: D(200),
  },
  {
    id: 'newspaper',
    name: 'Newspaper Delivery',
    nameKey: 'business.name_newspaper',
    icon: 'mdi:newspaper',
    purchasePrice: D(2000),
    category: 'Starter',
    unlockAtNetWorth: D(1000),
    baseRevenuePerUnit: 5,
    optimalPrice: 5,
    baseCustomers: 12,
    elasticity: 0.8,
    supplyCostPerUnit: 1.0,
    baseRent: 0.3,
    baseSalary: 0.5,
    outputPerEmployee: 8,
    baseQuality: 40,
    qualityUpgradeCost: D(300),
    sectorMultiplier: 0.7,
    branchBaseCost: D(10000),
    maxEmployeesBase: 8,
    trainingBaseCost: D(500),
  },
  {
    id: 'carwash',
    name: 'Car Wash',
    nameKey: 'business.name_carwash',
    icon: 'mdi:car-wash',
    purchasePrice: D(8000),
    category: 'Services',
    unlockAtNetWorth: D(5000),
    baseRevenuePerUnit: 15,
    optimalPrice: 15,
    baseCustomers: 6,
    elasticity: 1.0,
    supplyCostPerUnit: 3.0,
    baseRent: 1.0,
    baseSalary: 0.8,
    outputPerEmployee: 3,
    baseQuality: 50,
    qualityUpgradeCost: D(500),
    sectorMultiplier: 0.9,
    branchBaseCost: D(40000),
    maxEmployeesBase: 6,
    trainingBaseCost: D(1000),
  },
  {
    id: 'pizzeria',
    name: 'Pizza Shop',
    nameKey: 'business.name_pizzeria',
    icon: 'mdi:pizza',
    purchasePrice: D(25000),
    category: 'Food',
    unlockAtNetWorth: D(15000),
    baseRevenuePerUnit: 12,
    optimalPrice: 12,
    baseCustomers: 15,
    elasticity: 1.1,
    supplyCostPerUnit: 3.5,
    baseRent: 2.5,
    baseSalary: 1.0,
    outputPerEmployee: 4,
    baseQuality: 50,
    qualityUpgradeCost: D(1000),
    sectorMultiplier: 1.0,
    branchBaseCost: D(125000),
    maxEmployeesBase: 10,
    trainingBaseCost: D(3000),
  },
  {
    id: 'gym',
    name: 'Fitness Center',
    nameKey: 'business.name_gym',
    icon: 'mdi:dumbbell',
    purchasePrice: D(80000),
    category: 'Services',
    unlockAtNetWorth: D(50000),
    baseRevenuePerUnit: 30,
    optimalPrice: 30,
    baseCustomers: 10,
    elasticity: 0.7,
    supplyCostPerUnit: 2.0,
    baseRent: 5.0,
    baseSalary: 1.5,
    outputPerEmployee: 6,
    baseQuality: 50,
    qualityUpgradeCost: D(3000),
    sectorMultiplier: 1.1,
    branchBaseCost: D(400000),
    maxEmployeesBase: 12,
    trainingBaseCost: D(8000),
  },
  {
    id: 'cafe',
    name: 'Coffee Chain',
    nameKey: 'business.name_cafe',
    icon: 'mdi:coffee',
    purchasePrice: D(200000),
    category: 'Food',
    unlockAtNetWorth: D(120000),
    baseRevenuePerUnit: 8,
    optimalPrice: 8,
    baseCustomers: 30,
    elasticity: 1.3,
    supplyCostPerUnit: 2.0,
    baseRent: 4.0,
    baseSalary: 1.2,
    outputPerEmployee: 10,
    baseQuality: 55,
    qualityUpgradeCost: D(5000),
    sectorMultiplier: 1.2,
    branchBaseCost: D(1000000),
    maxEmployeesBase: 15,
    trainingBaseCost: D(15000),
  },
  {
    id: 'boutique',
    name: 'Fashion Boutique',
    nameKey: 'business.name_boutique',
    icon: 'mdi:hanger',
    purchasePrice: D(500000),
    category: 'Retail',
    unlockAtNetWorth: D(300000),
    baseRevenuePerUnit: 60,
    optimalPrice: 60,
    baseCustomers: 8,
    elasticity: 1.5,
    supplyCostPerUnit: 15.0,
    baseRent: 8.0,
    baseSalary: 2.0,
    outputPerEmployee: 3,
    baseQuality: 60,
    qualityUpgradeCost: D(10000),
    sectorMultiplier: 1.3,
    branchBaseCost: D(2500000),
    maxEmployeesBase: 8,
    trainingBaseCost: D(25000),
  },
  {
    id: 'restaurant',
    name: 'Fine Dining',
    nameKey: 'business.name_restaurant',
    icon: 'mdi:silverware-fork-knife',
    purchasePrice: D(1500000),
    category: 'Food',
    unlockAtNetWorth: D(800000),
    baseRevenuePerUnit: 80,
    optimalPrice: 80,
    baseCustomers: 6,
    elasticity: 0.9,
    supplyCostPerUnit: 25.0,
    baseRent: 12.0,
    baseSalary: 3.5,
    outputPerEmployee: 2,
    baseQuality: 65,
    qualityUpgradeCost: D(25000),
    sectorMultiplier: 1.2,
    branchBaseCost: D(7500000),
    maxEmployeesBase: 10,
    trainingBaseCost: D(50000),
  },
  {
    id: 'nightclub',
    name: 'Nightclub',
    nameKey: 'business.name_nightclub',
    icon: 'mdi:music-note',
    purchasePrice: D(5000000),
    category: 'Entertainment',
    unlockAtNetWorth: D(3000000),
    baseRevenuePerUnit: 40,
    optimalPrice: 40,
    baseCustomers: 20,
    elasticity: 1.0,
    supplyCostPerUnit: 8.0,
    baseRent: 20.0,
    baseSalary: 2.5,
    outputPerEmployee: 5,
    baseQuality: 50,
    qualityUpgradeCost: D(50000),
    sectorMultiplier: 1.4,
    branchBaseCost: D(25000000),
    maxEmployeesBase: 15,
    trainingBaseCost: D(100000),
  },
  {
    id: 'hotel',
    name: 'Hotel & Resort',
    nameKey: 'business.name_hotel',
    icon: 'mdi:bed',
    purchasePrice: D(20000000),
    category: 'Services',
    unlockAtNetWorth: D(10000000),
    baseRevenuePerUnit: 150,
    optimalPrice: 150,
    baseCustomers: 12,
    elasticity: 0.8,
    supplyCostPerUnit: 30.0,
    baseRent: 50.0,
    baseSalary: 5.0,
    outputPerEmployee: 3,
    baseQuality: 60,
    qualityUpgradeCost: D(200000),
    sectorMultiplier: 1.3,
    branchBaseCost: D(100000000),
    maxEmployeesBase: 20,
    trainingBaseCost: D(500000),
  },
  {
    id: 'tech_startup',
    name: 'Tech Company',
    nameKey: 'business.name_tech_startup',
    icon: 'mdi:laptop',
    purchasePrice: D(100000000),
    category: 'Tech',
    unlockAtNetWorth: D(50000000),
    baseRevenuePerUnit: 50,
    optimalPrice: 50,
    baseCustomers: 40,
    elasticity: 0.6,
    supplyCostPerUnit: 5.0,
    baseRent: 30.0,
    baseSalary: 10.0,
    outputPerEmployee: 8,
    baseQuality: 50,
    qualityUpgradeCost: D(1000000),
    sectorMultiplier: 2.0,
    branchBaseCost: D(500000000),
    maxEmployeesBase: 25,
    trainingBaseCost: D(2000000),
  },
  {
    id: 'factory',
    name: 'Manufacturing Plant',
    nameKey: 'business.name_factory',
    icon: 'mdi:factory',
    purchasePrice: D(500000000),
    category: 'Industry',
    unlockAtNetWorth: D(200000000),
    baseRevenuePerUnit: 200,
    optimalPrice: 200,
    baseCustomers: 25,
    elasticity: 0.5,
    supplyCostPerUnit: 50.0,
    baseRent: 100.0,
    baseSalary: 8.0,
    outputPerEmployee: 6,
    baseQuality: 55,
    qualityUpgradeCost: D(5000000),
    sectorMultiplier: 1.5,
    branchBaseCost: D(2500000000),
    maxEmployeesBase: 30,
    trainingBaseCost: D(10000000),
  },
  {
    id: 'bank',
    name: 'Investment Bank',
    nameKey: 'business.name_bank',
    icon: 'mdi:bank',
    purchasePrice: D(5000000000),
    category: 'Finance',
    unlockAtNetWorth: D(2000000000),
    baseRevenuePerUnit: 500,
    optimalPrice: 500,
    baseCustomers: 15,
    elasticity: 0.4,
    supplyCostPerUnit: 20.0,
    baseRent: 200.0,
    baseSalary: 25.0,
    outputPerEmployee: 4,
    baseQuality: 60,
    qualityUpgradeCost: D(50000000),
    sectorMultiplier: 2.5,
    branchBaseCost: D(25000000000),
    maxEmployeesBase: 20,
    trainingBaseCost: D(100000000),
  },
]
