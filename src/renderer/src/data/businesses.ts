import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'

export type BusinessCategory = 'Starter' | 'Food' | 'Services' | 'Retail' | 'Entertainment' | 'Tech' | 'Industry' | 'Finance'

export interface BusinessDef {
  id: string
  name: string
  icon: string
  /** Price to open/acquire this business */
  purchasePrice: Decimal
  /** Category for grouping */
  category: BusinessCategory
  /** Minimum net worth to unlock this business for purchase */
  unlockAtNetWorth: Decimal
  /** Optimal price per unit (demand curve center) */
  optimalPrice: number
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
  /** Cost to upgrade quality by 1 point */
  qualityUpgradeCost: Decimal
  /** Sector multiplier for valuation */
  sectorMultiplier: number
}

export const BUSINESSES: BusinessDef[] = [
  {
    id: 'lemonade',
    name: 'Lemonade Stand',
    icon: 'mdi:cup',
    purchasePrice: D(500),
    category: 'Starter',
    unlockAtNetWorth: D(0),
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
  },
  {
    id: 'newspaper',
    name: 'Newspaper Delivery',
    icon: 'mdi:newspaper',
    purchasePrice: D(2000),
    category: 'Starter',
    unlockAtNetWorth: D(1000),
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
  },
  {
    id: 'carwash',
    name: 'Car Wash',
    icon: 'mdi:car-wash',
    purchasePrice: D(8000),
    category: 'Services',
    unlockAtNetWorth: D(5000),
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
  },
  {
    id: 'pizzeria',
    name: 'Pizza Shop',
    icon: 'mdi:pizza',
    purchasePrice: D(25000),
    category: 'Food',
    unlockAtNetWorth: D(15000),
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
  },
  {
    id: 'gym',
    name: 'Fitness Center',
    icon: 'mdi:dumbbell',
    purchasePrice: D(80000),
    category: 'Services',
    unlockAtNetWorth: D(50000),
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
  },
  {
    id: 'cafe',
    name: 'Coffee Chain',
    icon: 'mdi:coffee',
    purchasePrice: D(200000),
    category: 'Food',
    unlockAtNetWorth: D(120000),
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
  },
  {
    id: 'boutique',
    name: 'Fashion Boutique',
    icon: 'mdi:hanger',
    purchasePrice: D(500000),
    category: 'Retail',
    unlockAtNetWorth: D(300000),
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
  },
  {
    id: 'restaurant',
    name: 'Fine Dining',
    icon: 'mdi:silverware-fork-knife',
    purchasePrice: D(1500000),
    category: 'Food',
    unlockAtNetWorth: D(800000),
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
  },
  {
    id: 'nightclub',
    name: 'Nightclub',
    icon: 'mdi:music-note',
    purchasePrice: D(5000000),
    category: 'Entertainment',
    unlockAtNetWorth: D(3000000),
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
  },
  {
    id: 'hotel',
    name: 'Hotel & Resort',
    icon: 'mdi:bed',
    purchasePrice: D(20000000),
    category: 'Services',
    unlockAtNetWorth: D(10000000),
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
  },
  {
    id: 'tech_startup',
    name: 'Tech Company',
    icon: 'mdi:laptop',
    purchasePrice: D(100000000),
    category: 'Tech',
    unlockAtNetWorth: D(50000000),
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
  },
  {
    id: 'factory',
    name: 'Manufacturing Plant',
    icon: 'mdi:factory',
    purchasePrice: D(500000000),
    category: 'Industry',
    unlockAtNetWorth: D(200000000),
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
  },
]
