import { D } from '@renderer/core/BigNum'
import type { UpgradeDef } from '@renderer/data/upgrades'

/**
 * Finance Skill Tree — 75 nodes
 *
 * LEFT path:   Stocks & Trading
 * CENTER path: Portfolio & Wealth Management
 * RIGHT path:  Crypto, Real Estate & Alternative Assets
 *
 * Convergence milestones at rows 8, 12, 16.
 */
export const FINANCE_SKILLS: UpgradeDef[] = [
  // ═══ ROW 0 — Root ══════════════════════════════════════════════
  {
    id: 'f_root', name: 'Financial Literacy', row: 0, col: 2,
    description: 'Understand the language of money.',
    effectDescription: '+3% stock returns', icon: 'mdi:book-open-page-variant',
    cost: D(5_000), target: 'stockReturn', multiplier: 0.03,
    category: 'Finance', prerequisites: [],
  },

  // ═══ ROW 1 ═════════════════════════════════════════════════════
  {
    id: 'f_stocks', name: 'Stock Basics', row: 1, col: 1,
    description: 'Learn to read charts and pick winners.',
    effectDescription: '+3% stock returns', icon: 'mdi:chart-line',
    cost: D(12_000), target: 'stockReturn', multiplier: 0.03,
    category: 'Finance', prerequisites: ['f_root'],
  },
  {
    id: 'f_crypto', name: 'Crypto Curious', row: 1, col: 3,
    description: 'Dip your toes into the blockchain world.',
    effectDescription: '+3% crypto returns', icon: 'mdi:bitcoin',
    cost: D(15_000), target: 'cryptoReturn', multiplier: 0.03,
    category: 'Finance', prerequisites: ['f_root'],
  },

  // ═══ ROW 2 ═════════════════════════════════════════════════════
  {
    id: 'f_analysis', name: 'Technical Analysis', row: 2, col: 0,
    description: 'Master candlestick patterns & indicators.',
    effectDescription: '+4% stock returns', icon: 'mdi:chart-areaspline',
    cost: D(40_000), target: 'stockReturn', multiplier: 0.04,
    category: 'Finance', prerequisites: ['f_stocks'],
  },
  {
    id: 'f_portfolio', name: 'Portfolio Theory', row: 2, col: 2,
    description: 'Build an optimally diversified portfolio.',
    effectDescription: '+1% all income', icon: 'mdi:briefcase-variant',
    cost: D(50_000), target: 'allIncome', multiplier: 0.01,
    category: 'Finance', prerequisites: ['f_root'],
  },
  {
    id: 'f_defi', name: 'DeFi Pioneer', row: 2, col: 4,
    description: 'Explore decentralised finance protocols.',
    effectDescription: '+4% crypto returns', icon: 'mdi:swap-horizontal',
    cost: D(40_000), target: 'cryptoReturn', multiplier: 0.04,
    category: 'Finance', prerequisites: ['f_crypto'],
  },

  // ═══ ROW 3 ═════════════════════════════════════════════════════
  {
    id: 'f_daytrading', name: 'Day Trading', row: 3, col: 0,
    description: 'Execute dozens of profitable trades daily.',
    effectDescription: '+4% stock returns', icon: 'mdi:speedometer',
    cost: D(120_000), target: 'stockReturn', multiplier: 0.04,
    category: 'Finance', prerequisites: ['f_analysis'],
  },
  {
    id: 'f_diversify', name: 'Diversification', row: 3, col: 1,
    description: 'Spread risk across asset classes.',
    effectDescription: '+1% all income', icon: 'mdi:chart-pie',
    cost: D(150_000), target: 'allIncome', multiplier: 0.01,
    category: 'Finance', prerequisites: ['f_stocks', 'f_portfolio'],
  },
  {
    id: 'f_realestate', name: 'Real Estate 101', row: 3, col: 3,
    description: 'Learn the fundamentals of property investing.',
    effectDescription: '+4% real estate rent', icon: 'mdi:home-city',
    cost: D(150_000), target: 'realEstateRent', multiplier: 0.04,
    category: 'Finance', prerequisites: ['f_portfolio', 'f_crypto'],
  },
  {
    id: 'f_nft', name: 'NFT Markets', row: 3, col: 4,
    description: 'Trade and create non-fungible tokens.',
    effectDescription: '+4% crypto returns', icon: 'mdi:image-frame',
    cost: D(120_000), target: 'cryptoReturn', multiplier: 0.04,
    category: 'Finance', prerequisites: ['f_defi'],
  },

  // ═══ ROW 4 ═════════════════════════════════════════════════════
  {
    id: 'f_options', name: 'Options & Futures', row: 4, col: 0,
    description: 'Leverage derivatives for massive gains.',
    effectDescription: '+4% stock returns', icon: 'mdi:chart-bar-stacked',
    cost: D(400_000), target: 'stockReturn', multiplier: 0.04,
    category: 'Finance', prerequisites: ['f_daytrading'],
  },
  {
    id: 'f_compound', name: 'Compound Interest', row: 4, col: 1,
    description: 'The eighth wonder of the world works for you.',
    effectDescription: '+1% all income', icon: 'mdi:chart-timeline-variant',
    cost: D(500_000), target: 'allIncome', multiplier: 0.01,
    category: 'Finance', prerequisites: ['f_diversify'],
  },
  {
    id: 'f_mortgage', name: 'Mortgage Mastery', row: 4, col: 2,
    description: 'Leverage property with optimal financing.',
    effectDescription: '-3% loan rates', icon: 'mdi:home-percent',
    cost: D(600_000), target: 'loanRate', multiplier: -0.03,
    category: 'Finance', prerequisites: ['f_diversify', 'f_realestate'],
  },
  {
    id: 'f_savings', name: 'Savings Expert', row: 4, col: 3,
    description: 'Master the art of earning interest on idle cash.',
    effectDescription: '+7% deposit APY', icon: 'mdi:piggy-bank-outline',
    cost: D(500_000), target: 'depositRate', multiplier: 0.07,
    category: 'Finance', prerequisites: ['f_realestate'],
  },
  {
    id: 'f_propflip', name: 'Property Flipping', row: 4, col: 2,
    description: 'Buy low, renovate, sell high, repeat.',
    effectDescription: '+4% real estate rent', icon: 'mdi:hammer-wrench',
    cost: D(450_000), target: 'realEstateRent', multiplier: 0.04,
    category: 'Finance', prerequisites: ['f_realestate'],
  },
  {
    id: 'f_yield', name: 'Yield Farming', row: 4, col: 4,
    description: 'Stack yields across DeFi protocols.',
    effectDescription: '+4% crypto returns', icon: 'mdi:sprout',
    cost: D(400_000), target: 'cryptoReturn', multiplier: 0.04,
    category: 'Finance', prerequisites: ['f_nft'],
  },

  // ═══ ROW 5 ═════════════════════════════════════════════════════
  {
    id: 'f_algo', name: 'Algorithmic Trading', row: 5, col: 0,
    description: 'Bots execute your strategies 24/7.',
    effectDescription: '+4% stock returns', icon: 'mdi:code-braces',
    cost: D(1_200_000), target: 'stockReturn', multiplier: 0.04,
    category: 'Finance', prerequisites: ['f_options'],
  },
  {
    id: 'f_wealthmgr', name: 'Wealth Manager', row: 5, col: 1,
    description: 'Manage wealth at scale for the ultra-rich.',
    effectDescription: '+2% all income', icon: 'mdi:account-cash',
    cost: D(1_500_000), target: 'allIncome', multiplier: 0.02,
    category: 'Finance', prerequisites: ['f_compound'],
  },
  {
    id: 'f_reit', name: 'REIT Portfolio', row: 5, col: 3,
    description: 'Passive real estate income through trusts.',
    effectDescription: '+5% real estate rent', icon: 'mdi:office-building-marker',
    cost: D(1_500_000), target: 'realEstateRent', multiplier: 0.05,
    category: 'Finance', prerequisites: ['f_mortgage', 'f_propflip'],
  },
  {
    id: 'f_defiwhale', name: 'DeFi Whale', row: 5, col: 4,
    description: 'Your liquidity moves entire DeFi markets.',
    effectDescription: '+5% crypto returns', icon: 'mdi:fishbowl',
    cost: D(1_200_000), target: 'cryptoReturn', multiplier: 0.05,
    category: 'Finance', prerequisites: ['f_yield'],
  },

  // ═══ ROW 6 ═════════════════════════════════════════════════════
  {
    id: 'f_hft', name: 'High-Frequency Trading', row: 6, col: 0,
    description: 'Nanosecond trades extract hidden alpha.',
    effectDescription: '+5% stock returns', icon: 'mdi:lightning-bolt',
    cost: D(4_000_000), target: 'stockReturn', multiplier: 0.05,
    category: 'Finance', prerequisites: ['f_algo'],
  },
  {
    id: 'f_hedgefund', name: 'Hedge Fund', row: 6, col: 1,
    description: 'Launch your own elite hedge fund.',
    effectDescription: '+2% all income', icon: 'mdi:shield-half-full',
    cost: D(5_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Finance', prerequisites: ['f_wealthmgr'],
  },
  {
    id: 'f_propdev', name: 'Property Development', row: 6, col: 2,
    description: 'Build entire residential complexes.',
    effectDescription: '+5% real estate rent', icon: 'mdi:crane',
    cost: D(6_000_000), target: 'realEstateRent', multiplier: 0.05,
    category: 'Finance', prerequisites: ['f_wealthmgr', 'f_reit'],
  },
  {
    id: 'f_compound_master', name: 'Compound Master', row: 6, col: 3,
    description: 'Unlock the full power of compound interest.',
    effectDescription: '+7% deposit APY', icon: 'mdi:chart-timeline-variant-shimmer',
    cost: D(5_000_000), target: 'depositRate', multiplier: 0.07,
    category: 'Finance', prerequisites: ['f_savings', 'f_reit'],
  },
  {
    id: 'f_landlord', name: 'Mega Landlord', row: 6, col: 2,
    description: 'Thousands of tenants across the region.',
    effectDescription: '+5% real estate rent', icon: 'mdi:home-group',
    cost: D(4_500_000), target: 'realEstateRent', multiplier: 0.05,
    category: 'Finance', prerequisites: ['f_reit'],
  },
  {
    id: 'f_blockchain', name: 'Blockchain Architect', row: 6, col: 4,
    description: 'Design your own blockchain protocols.',
    effectDescription: '+5% crypto returns', icon: 'mdi:link-variant',
    cost: D(4_000_000), target: 'cryptoReturn', multiplier: 0.05,
    category: 'Finance', prerequisites: ['f_defiwhale'],
  },

  // ═══ ROW 7 ═════════════════════════════════════════════════════
  {
    id: 'f_darkpool', name: 'Dark Pool Access', row: 7, col: 0,
    description: 'Trade in exclusive institutional dark pools.',
    effectDescription: '+5% stock returns', icon: 'mdi:eye-off',
    cost: D(12_000_000), target: 'stockReturn', multiplier: 0.05,
    category: 'Finance', prerequisites: ['f_hft'],
  },
  {
    id: 'f_banking', name: 'Investment Banking', row: 7, col: 1,
    description: 'Underwrite IPOs and advise on M&A deals.',
    effectDescription: '+2% all income', icon: 'mdi:bank',
    cost: D(15_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Finance', prerequisites: ['f_hedgefund'],
  },
  {
    id: 'f_skyline', name: 'Skyline Developer', row: 7, col: 3,
    description: 'Build skyscrapers that define city skylines.',
    effectDescription: '+5% real estate rent', icon: 'mdi:city',
    cost: D(15_000_000), target: 'realEstateRent', multiplier: 0.05,
    category: 'Finance', prerequisites: ['f_propdev', 'f_landlord'],
  },
  {
    id: 'f_l1chain', name: 'Layer-1 Chain', row: 7, col: 4,
    description: 'Launch a competing Layer-1 blockchain.',
    effectDescription: '+5% crypto returns', icon: 'mdi:cube-outline',
    cost: D(12_000_000), target: 'cryptoReturn', multiplier: 0.05,
    category: 'Finance', prerequisites: ['f_blockchain'],
  },

  // ═══ ROW 8 — Convergence ═══════════════════════════════════════
  {
    id: 'f_mktmaker', name: 'Market Maker', row: 8, col: 1,
    description: 'You provide liquidity to entire exchanges.',
    effectDescription: '+8% stock returns', icon: 'mdi:scale-balance',
    cost: D(50_000_000), target: 'stockReturn', multiplier: 0.08,
    category: 'Finance', prerequisites: ['f_darkpool', 'f_banking'],
  },
  {
    id: 'f_conglom', name: 'Financial Conglomerate', row: 8, col: 2,
    description: 'Banking, insurance, investments — all under one roof.',
    effectDescription: '+3% all income', icon: 'mdi:domain',
    cost: D(60_000_000), target: 'allIncome', multiplier: 0.03,
    category: 'Finance', prerequisites: ['f_banking', 'f_skyline'],
  },
  {
    id: 'f_cryptoemp', name: 'Crypto Empire', row: 8, col: 3,
    description: 'Your coins are accepted everywhere.',
    effectDescription: '+9% crypto returns', icon: 'mdi:currency-eth',
    cost: D(50_000_000), target: 'cryptoReturn', multiplier: 0.09,
    category: 'Finance', prerequisites: ['f_skyline', 'f_l1chain'],
  },

  // ═══ ROW 9 ═════════════════════════════════════════════════════
  {
    id: 'f_quant', name: 'Quant Division', row: 9, col: 0,
    description: 'PhD mathematicians model every market move.',
    effectDescription: '+6% stock returns', icon: 'mdi:function-variant',
    cost: D(150_000_000), target: 'stockReturn', multiplier: 0.06,
    category: 'Finance', prerequisites: ['f_mktmaker'],
  },
  {
    id: 'f_pe', name: 'Private Equity', row: 9, col: 1,
    description: 'Buy, optimise, and flip entire companies.',
    effectDescription: '+2% all income', icon: 'mdi:handshake',
    cost: D(180_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Finance', prerequisites: ['f_mktmaker'],
  },
  {
    id: 'f_reitmega', name: 'Mega REIT', row: 9, col: 3,
    description: 'Your REIT is the largest in existence.',
    effectDescription: '+6% real estate rent', icon: 'mdi:home-city-outline',
    cost: D(180_000_000), target: 'realEstateRent', multiplier: 0.06,
    category: 'Finance', prerequisites: ['f_conglom'],
  },
  {
    id: 'f_deposit_mogul', name: 'Deposit Mogul', row: 9, col: 2,
    description: 'Your deposits are the backbone of the banking system.',
    effectDescription: '+9% deposit APY', icon: 'mdi:safe-square-outline',
    cost: D(200_000_000), target: 'depositRate', multiplier: 0.09,
    category: 'Finance', prerequisites: ['f_compound_master', 'f_conglom'],
  },
  {
    id: 'f_dao', name: 'DAO Overlord', row: 9, col: 4,
    description: 'Govern decentralised organisations worth billions.',
    effectDescription: '+6% crypto returns', icon: 'mdi:account-network',
    cost: D(150_000_000), target: 'cryptoReturn', multiplier: 0.06,
    category: 'Finance', prerequisites: ['f_cryptoemp'],
  },

  // ═══ ROW 10 ════════════════════════════════════════════════════
  {
    id: 'f_sovereign', name: 'Sovereign Wealth', row: 10, col: 0,
    description: 'Manage a nation-sized sovereign wealth fund.',
    effectDescription: '+6% stock returns', icon: 'mdi:cash-100',
    cost: D(500_000_000), target: 'stockReturn', multiplier: 0.06,
    category: 'Finance', prerequisites: ['f_quant'],
  },
  {
    id: 'f_lobby', name: 'Financial Lobbying', row: 10, col: 1,
    description: 'Shape regulations in your favour.',
    effectDescription: '-4% loan rates', icon: 'mdi:gavel',
    cost: D(600_000_000), target: 'loanRate', multiplier: -0.04,
    category: 'Finance', prerequisites: ['f_pe'],
  },
  {
    id: 'f_smcity', name: 'Smart Cities', row: 10, col: 2,
    description: 'Build AI-managed cities from scratch.',
    effectDescription: '+7% real estate rent', icon: 'mdi:city-variant-outline',
    cost: D(750_000_000), target: 'realEstateRent', multiplier: 0.07,
    category: 'Finance', prerequisites: ['f_pe', 'f_reitmega'],
  },
  {
    id: 'f_defibank', name: 'DeFi Central Bank', row: 10, col: 3,
    description: 'Issue your own stablecoin pegged to real assets.',
    effectDescription: '+7% crypto returns', icon: 'mdi:bank-transfer',
    cost: D(600_000_000), target: 'cryptoReturn', multiplier: 0.07,
    category: 'Finance', prerequisites: ['f_reitmega', 'f_dao'],
  },
  {
    id: 'f_yield_vault', name: 'Yield Vault', row: 10, col: 4,
    description: 'Automate deposit strategies across all institutions.',
    effectDescription: '+9% deposit APY', icon: 'mdi:treasure-chest',
    cost: D(700_000_000), target: 'depositRate', multiplier: 0.09,
    category: 'Finance', prerequisites: ['f_deposit_mogul', 'f_dao'],
  },
  {
    id: 'f_metaverse', name: 'Metaverse Real Estate', row: 10, col: 3,
    description: 'Own virtual land worth more than physical.',
    effectDescription: '+7% real estate rent', icon: 'mdi:virtual-reality',
    cost: D(500_000_000), target: 'realEstateRent', multiplier: 0.07,
    category: 'Finance', prerequisites: ['f_dao'],
  },

  // ═══ ROW 11 ════════════════════════════════════════════════════
  {
    id: 'f_centralbank', name: 'Central Bank Advisor', row: 11, col: 0,
    description: 'Central banks call you before making rate decisions.',
    effectDescription: '+6% stock returns', icon: 'mdi:phone-classic',
    cost: D(1.5e9), target: 'stockReturn', multiplier: 0.06,
    category: 'Finance', prerequisites: ['f_sovereign'],
  },
  {
    id: 'f_deriv', name: 'Derivatives Empire', row: 11, col: 1,
    description: 'Notional value of your derivatives exceeds GDP.',
    effectDescription: '+2% all income', icon: 'mdi:chart-bell-curve',
    cost: D(2e9), target: 'allIncome', multiplier: 0.02,
    category: 'Finance', prerequisites: ['f_lobby'],
  },
  {
    id: 'f_arcology', name: 'Arcology Builder', row: 11, col: 3,
    description: 'Self-sustaining megastructures house millions.',
    effectDescription: '+7% real estate rent', icon: 'mdi:hexagon-multiple',
    cost: D(2e9), target: 'realEstateRent', multiplier: 0.07,
    category: 'Finance', prerequisites: ['f_smcity', 'f_defibank'],
  },
  {
    id: 'f_quantumfi', name: 'Quantum Finance', row: 11, col: 4,
    description: 'Quantum algorithms predict market micro-structure.',
    effectDescription: '+7% crypto returns', icon: 'mdi:atom-variant',
    cost: D(1.5e9), target: 'cryptoReturn', multiplier: 0.07,
    category: 'Finance', prerequisites: ['f_metaverse'],
  },

  // ═══ ROW 12 — Convergence ══════════════════════════════════════
  {
    id: 'f_worldbank', name: 'World Bank', row: 12, col: 1,
    description: 'You control lending to entire nations.',
    effectDescription: '+4% all income', icon: 'mdi:bank-outline',
    cost: D(8e9), target: 'allIncome', multiplier: 0.04,
    category: 'Finance', prerequisites: ['f_centralbank', 'f_deriv'],
  },
  {
    id: 'f_globalre', name: 'Global Real Estate', row: 12, col: 2,
    description: 'Own property on every continent.',
    effectDescription: '+11% real estate rent', icon: 'mdi:map',
    cost: D(10e9), target: 'realEstateRent', multiplier: 0.11,
    category: 'Finance', prerequisites: ['f_deriv', 'f_arcology'],
  },
  {
    id: 'f_cryptogod', name: 'Crypto God', row: 12, col: 3,
    description: 'Your wallet address is a legend on every chain.',
    effectDescription: '+11% crypto returns', icon: 'mdi:crown',
    cost: D(8e9), target: 'cryptoReturn', multiplier: 0.11,
    category: 'Finance', prerequisites: ['f_arcology', 'f_quantumfi'],
  },

  // ═══ ROW 13 ════════════════════════════════════════════════════
  {
    id: 'f_imf', name: 'IMF Director', row: 13, col: 0,
    description: 'Set monetary policy for the entire planet.',
    effectDescription: '+7% stock returns', icon: 'mdi:earth',
    cost: D(30e9), target: 'stockReturn', multiplier: 0.07,
    category: 'Finance', prerequisites: ['f_worldbank'],
  },
  {
    id: 'f_reserve', name: 'Global Reserve Currency', row: 13, col: 1,
    description: 'Your currency IS the world reserve.',
    effectDescription: '+3% all income', icon: 'mdi:cash-lock',
    cost: D(25e9), target: 'allIncome', multiplier: 0.03,
    category: 'Finance', prerequisites: ['f_worldbank'],
  },
  {
    id: 'f_orbital', name: 'Orbital Habitats', row: 13, col: 3,
    description: 'Build and lease orbital space stations.',
    effectDescription: '+8% real estate rent', icon: 'mdi:satellite-variant',
    cost: D(35e9), target: 'realEstateRent', multiplier: 0.08,
    category: 'Finance', prerequisites: ['f_globalre'],
  },
  {
    id: 'f_neurofi', name: 'Neural Finance', row: 13, col: 4,
    description: 'Brain-computer interfaces trade at thought-speed.',
    effectDescription: '+8% crypto returns', icon: 'mdi:head-snowflake',
    cost: D(30e9), target: 'cryptoReturn', multiplier: 0.08,
    category: 'Finance', prerequisites: ['f_cryptogod'],
  },

  // ═══ ROW 14 ════════════════════════════════════════════════════
  {
    id: 'f_bretton', name: 'Bretton Woods II', row: 14, col: 0,
    description: 'Redesign the global financial architecture.',
    effectDescription: '+7% stock returns', icon: 'mdi:pillar',
    cost: D(100e9), target: 'stockReturn', multiplier: 0.07,
    category: 'Finance', prerequisites: ['f_imf'],
  },
  {
    id: 'f_darkm', name: 'Dark Matter Markets', row: 14, col: 1,
    description: 'Trade assets that don\'t officially exist.',
    effectDescription: '+3% all income', icon: 'mdi:blur',
    cost: D(80e9), target: 'allIncome', multiplier: 0.03,
    category: 'Finance', prerequisites: ['f_reserve'],
  },
  {
    id: 'f_dyson', name: 'Dyson Finance Sphere', row: 14, col: 2,
    description: 'A megastructure harvesting stellar returns.',
    effectDescription: '-5% loan rates', icon: 'mdi:sun-wireless',
    cost: D(120e9), target: 'loanRate', multiplier: -0.05,
    category: 'Finance', prerequisites: ['f_reserve', 'f_orbital'],
  },
  {
    id: 'f_exoreal', name: 'Exoplanet Real Estate', row: 14, col: 3,
    description: 'Sell plots on terraformed exoplanets.',
    effectDescription: '+8% real estate rent', icon: 'mdi:planet',
    cost: D(100e9), target: 'realEstateRent', multiplier: 0.08,
    category: 'Finance', prerequisites: ['f_orbital'],
  },
  {
    id: 'f_aitrader', name: 'Sentient Trader AI', row: 14, col: 4,
    description: 'Conscious AI generates infinite alpha.',
    effectDescription: '+8% crypto returns', icon: 'mdi:robot-outline',
    cost: D(100e9), target: 'cryptoReturn', multiplier: 0.08,
    category: 'Finance', prerequisites: ['f_neurofi'],
  },

  // ═══ ROW 15 ════════════════════════════════════════════════════
  {
    id: 'f_timeless', name: 'Timeless Investments', row: 15, col: 0,
    description: 'Compound interest across temporal loops.',
    effectDescription: '+7% stock returns', icon: 'mdi:clock-fast',
    cost: D(400e9), target: 'stockReturn', multiplier: 0.07,
    category: 'Finance', prerequisites: ['f_bretton'],
  },
  {
    id: 'f_econctrl', name: 'Economy Controller', row: 15, col: 1,
    description: 'Every economic variable bends to your will.',
    effectDescription: '+3% all income', icon: 'mdi:tune',
    cost: D(350e9), target: 'allIncome', multiplier: 0.03,
    category: 'Finance', prerequisites: ['f_darkm'],
  },
  {
    id: 'f_dimreal', name: 'Dimensional Real Estate', row: 15, col: 3,
    description: 'Sell property in parallel dimensions.',
    effectDescription: '+8% real estate rent', icon: 'mdi:cube-send',
    cost: D(450e9), target: 'realEstateRent', multiplier: 0.08,
    category: 'Finance', prerequisites: ['f_dyson', 'f_exoreal'],
  },
  {
    id: 'f_omnifi', name: 'Omni-Finance', row: 15, col: 4,
    description: 'A unified financial protocol across all realities.',
    effectDescription: '+8% crypto returns', icon: 'mdi:web',
    cost: D(400e9), target: 'cryptoReturn', multiplier: 0.08,
    category: 'Finance', prerequisites: ['f_aitrader'],
  },

  // ═══ ROW 16 — Convergence ══════════════════════════════════════
  {
    id: 'f_plutocrat', name: 'Plutocrat Supreme', row: 16, col: 1,
    description: 'Wealth beyond any civilisation\'s comprehension.',
    effectDescription: '+4% all income', icon: 'mdi:diamond-stone',
    cost: D(2e12), target: 'allIncome', multiplier: 0.04,
    category: 'Finance', prerequisites: ['f_timeless', 'f_econctrl'],
  },
  {
    id: 'f_multiverse', name: 'Multiverse Portfolio', row: 16, col: 2,
    description: 'Your portfolio spans the multiverse.',
    effectDescription: '+12% stock returns', icon: 'mdi:infinity',
    cost: D(2.5e12), target: 'stockReturn', multiplier: 0.12,
    category: 'Finance', prerequisites: ['f_econctrl', 'f_dimreal'],
  },
  {
    id: 'f_cryptoverse', name: 'Cryptoverse', row: 16, col: 3,
    description: 'Every atom in the universe is tokenised.',
    effectDescription: '+13% crypto returns', icon: 'mdi:creation',
    cost: D(2e12), target: 'cryptoReturn', multiplier: 0.13,
    category: 'Finance', prerequisites: ['f_dimreal', 'f_omnifi'],
  },

  // ═══ ROW 17 — Capstone ═════════════════════════════════════════
  {
    id: 'f_midas', name: 'Midas Touch', row: 17, col: 1,
    description: 'Everything you touch turns to pure profit.',
    effectDescription: '+6% all income', icon: 'mdi:hand-coin',
    cost: D(20e12), target: 'allIncome', multiplier: 0.06,
    category: 'Finance', prerequisites: ['f_plutocrat', 'f_multiverse'],
  },
  {
    id: 'f_arbiter', name: 'Reality Arbiter', row: 17, col: 3,
    description: 'You arbitrage the fabric of reality itself.',
    effectDescription: '+16% stock returns', icon: 'mdi:eye-circle',
    cost: D(20e12), target: 'stockReturn', multiplier: 0.16,
    category: 'Finance', prerequisites: ['f_multiverse', 'f_cryptoverse'],
  },
]
