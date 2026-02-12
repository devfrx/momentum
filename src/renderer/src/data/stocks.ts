import type { AssetConfig } from '@renderer/core/MarketSim'

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
    maxHistory: 500
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
    maxHistory: 500
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
    maxHistory: 500
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
    maxHistory: 500
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
    maxHistory: 500
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
    maxHistory: 500
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
    maxHistory: 500
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
    maxHistory: 500
  }
]
