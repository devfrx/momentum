import type { AssetConfig } from '@renderer/core/MarketSim'

/**
 * Drift values are set so log-drift (μ − σ²/2) is positive for every asset.
 * This ensures the median price trajectory trends upward over time,
 * while meme coins have higher risk AND higher expected reward.
 *
 * stakingYield is annual yield (like dividendYield for stocks).
 * Tokens without proof-of-stake / staking have 0 yield.
 */
export const CRYPTOS: AssetConfig[] = [
  {
    id: 'BTC',
    name: 'BitCoin',
    ticker: 'BTC',
    sector: 'crypto',
    basePrice: 42000,
    drift: 0.25,       // log-drift ≈ +7% (σ²/2 = 0.18)
    volatility: 0.60,
    minPrice: 0.01,
    maxHistory: 2000,
    stakingYield: 0.01  // 1% — PoW, minimal staking
  },
  {
    id: 'ETH',
    name: 'EtherBlock',
    ticker: 'ETH',
    sector: 'crypto',
    basePrice: 2200,
    drift: 0.22,       // log-drift ≈ +6.9% (σ²/2 = 0.151)
    volatility: 0.55,
    minPrice: 0.01,
    maxHistory: 2000,
    stakingYield: 0.04  // 4% — PoS
  },
  {
    id: 'DOGE',
    name: 'DogeToken',
    ticker: 'DOGE',
    sector: 'meme',
    basePrice: 0.08,
    drift: 0.35,       // log-drift ≈ +3% (σ²/2 = 0.32)
    volatility: 0.80,
    minPrice: 0.0001,
    maxHistory: 2000,
    stakingYield: 0     // meme — no staking
  },
  {
    id: 'SOL',
    name: 'Solarium',
    ticker: 'SOL',
    sector: 'crypto',
    basePrice: 95,
    drift: 0.28,       // log-drift ≈ +6.9% (σ²/2 = 0.211)
    volatility: 0.65,
    minPrice: 0.01,
    maxHistory: 2000,
    stakingYield: 0.055 // 5.5% — PoS, higher yield
  },
  {
    id: 'PEPE',
    name: 'PepeCoin',
    ticker: 'PEPE',
    sector: 'meme',
    basePrice: 0.001,
    drift: 0.42,       // log-drift ≈ +1.5% (σ²/2 = 0.405)
    volatility: 0.90,
    minPrice: 0.000001,
    maxHistory: 2000,
    stakingYield: 0     // meme — no staking
  },
  {
    id: 'LINK',
    name: 'ChainLink',
    ticker: 'LINK',
    sector: 'defi',
    basePrice: 14,
    drift: 0.20,       // log-drift ≈ +7.5% (σ²/2 = 0.125)
    volatility: 0.50,
    minPrice: 0.01,
    maxHistory: 2000,
    stakingYield: 0.03  // 3% — protocol staking
  },
  {
    id: 'AVAX',
    name: 'Avalanche',
    ticker: 'AVAX',
    sector: 'crypto',
    basePrice: 35,
    drift: 0.22,       // log-drift ≈ +6.9% (σ²/2 = 0.151)
    volatility: 0.55,
    minPrice: 0.01,
    maxHistory: 2000,
    stakingYield: 0.06  // 6% — PoS, high yield
  },
  {
    id: 'SHIB',
    name: 'ShibaSwap',
    ticker: 'SHIB',
    sector: 'meme',
    basePrice: 0.00001,
    drift: 0.46,       // log-drift ≈ +0.9% (σ²/2 = 0.451)
    volatility: 0.95,
    minPrice: 0.0000001,
    maxHistory: 2000,
    stakingYield: 0     // meme — no staking
  }
]
