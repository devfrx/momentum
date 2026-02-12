import type { AssetConfig } from '@renderer/core/MarketSim'

export const CRYPTOS: AssetConfig[] = [
  {
    id: 'BTC',
    name: 'BitCoin',
    ticker: 'BTC',
    sector: 'crypto',
    basePrice: 42000,
    drift: 0.15,
    volatility: 0.60,
    minPrice: 0.01,
    maxHistory: 500
  },
  {
    id: 'ETH',
    name: 'EtherBlock',
    ticker: 'ETH',
    sector: 'crypto',
    basePrice: 2200,
    drift: 0.12,
    volatility: 0.55,
    minPrice: 0.01,
    maxHistory: 500
  },
  {
    id: 'DOGE',
    name: 'DogeToken',
    ticker: 'DOGE',
    sector: 'meme',
    basePrice: 0.08,
    drift: 0.20,
    volatility: 0.80,
    minPrice: 0.0001,
    maxHistory: 500
  },
  {
    id: 'SOL',
    name: 'Solarium',
    ticker: 'SOL',
    sector: 'crypto',
    basePrice: 95,
    drift: 0.18,
    volatility: 0.65,
    minPrice: 0.01,
    maxHistory: 500
  },
  {
    id: 'PEPE',
    name: 'PepeCoin',
    ticker: 'PEPE',
    sector: 'meme',
    basePrice: 0.001,
    drift: 0.25,
    volatility: 0.90,
    minPrice: 0.000001,
    maxHistory: 500
  },
  {
    id: 'LINK',
    name: 'ChainLink',
    ticker: 'LINK',
    sector: 'defi',
    basePrice: 14,
    drift: 0.10,
    volatility: 0.50,
    minPrice: 0.01,
    maxHistory: 500
  },
  {
    id: 'AVAX',
    name: 'Avalanche',
    ticker: 'AVAX',
    sector: 'crypto',
    basePrice: 35,
    drift: 0.14,
    volatility: 0.55,
    minPrice: 0.01,
    maxHistory: 500
  },
  {
    id: 'SHIB',
    name: 'ShibaSwap',
    ticker: 'SHIB',
    sector: 'meme',
    basePrice: 0.00001,
    drift: 0.30,
    volatility: 0.95,
    minPrice: 0.0000001,
    maxHistory: 500
  }
]
