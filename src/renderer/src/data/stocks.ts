import type { AssetConfig } from '@renderer/core/MarketSim'

/**
 * Dividend yield is annual yield as a fraction (e.g. 0.035 = 3.5%).
 * Paid out proportionally each dividend tick as: shares × price × yield / ticksPerYear.
 * Growth stocks have 0 yield; value/defensive stocks have higher yields.
 */
export const STOCKS: AssetConfig[] = [
  {
    id: 'TCORP',
    name: 'TechCorp',
    ticker: 'TCORP',
    sector: 'tech',
    basePrice: 150,
    drift: 0.08,
    volatility: 0.25,
    minPrice: 1,
    maxHistory: 50000,
    dividendYield: 0.005 // 0.5% — growth stock, reinvests most profits
  },
  {
    id: 'GRAINX',
    name: 'GrainX Industries',
    ticker: 'GRAINX',
    sector: 'commodities',
    basePrice: 45,
    drift: 0.06,
    volatility: 0.20,
    minPrice: 1,
    maxHistory: 50000,
    dividendYield: 0.028 // 2.8% — commodity producer, moderate yield
  },
  {
    id: 'SOLARW',
    name: 'SolarWave Energy',
    ticker: 'SOLARW',
    sector: 'energy',
    basePrice: 80,
    drift: 0.10,
    volatility: 0.30,
    minPrice: 1,
    maxHistory: 50000,
    dividendYield: 0.022 // 2.2% — growing energy sector
  },
  {
    id: 'MEDVX',
    name: 'MedVax Pharma',
    ticker: 'MEDVX',
    sector: 'healthcare',
    basePrice: 200,
    drift: 0.05,
    volatility: 0.28,
    minPrice: 1,
    maxHistory: 50000,
    dividendYield: 0.018 // 1.8% — pharma, moderate yield
  },
  {
    id: 'RETLX',
    name: 'RetailMax',
    ticker: 'RETLX',
    sector: 'retail',
    basePrice: 30,
    drift: 0.04,
    volatility: 0.18,
    minPrice: 1,
    maxHistory: 50000,
    dividendYield: 0.032 // 3.2% — mature retail, solid yield
  },
  {
    id: 'FINBK',
    name: 'FinBank Holdings',
    ticker: 'FINBK',
    sector: 'finance',
    basePrice: 120,
    drift: 0.03,
    volatility: 0.15,
    minPrice: 1,
    maxHistory: 50000,
    dividendYield: 0.038 // 3.8% — bank, highest yield (value stock)
  },
  {
    id: 'AEROX',
    name: 'AeroX Defense',
    ticker: 'AEROX',
    sector: 'defense',
    basePrice: 300,
    drift: 0.07,
    volatility: 0.22,
    minPrice: 1,
    maxHistory: 50000,
    dividendYield: 0.025 // 2.5% — defense contractor, stable income
  },
  {
    id: 'GAMEV',
    name: 'GameVerse',
    ticker: 'GAMEV',
    sector: 'entertainment',
    basePrice: 60,
    drift: 0.12,
    volatility: 0.35,
    minPrice: 1,
    maxHistory: 50000,
    dividendYield: 0 // 0% — high-growth entertainment, no dividends
  }
]
