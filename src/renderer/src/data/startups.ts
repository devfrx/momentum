/**
 * Startup generation data and types
 * Used for procedurally generating time-limited startup opportunities
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type StartupSector =
  | 'tech'
  | 'biotech'
  | 'greentech'
  | 'fintech'
  | 'space'
  | 'ai'
  | 'gaming'
  | 'health'
  | 'crypto'
  | 'logistics'

export type StartupStage = 'seed' | 'seriesA' | 'seriesB' | 'seriesC' | 'preIPO'

/**
 * Multi-phase research system.
 * Each phase reveals more information about the startup at increasing cost.
 *  - none:     No research done — success chance hidden
 *  - basic:    Quick scan — reveals approximate success chance range
 *  - detailed: Due diligence — reveals exact success chance + risk rating
 *  - deep:     Deep analysis — reveals founder score + grants a small success bonus
 */
export type ResearchPhase = 'none' | 'basic' | 'detailed' | 'deep'

export const RESEARCH_PHASES: ResearchPhase[] = ['none', 'basic', 'detailed', 'deep']

export interface ResearchPhaseData {
  id: ResearchPhase
  name: string
  icon: string
  /** Cost multiplier relative to min investment */
  costMultiplier: number
  /** What this phase reveals (used for UI descriptions) */
  reveals: string
}

/**
 * Research cost scales per phase.
 * basic =  8% of minInvestment, detailed = 18%, deep = 35%.
 * This makes deep research a serious financial commitment.
 */
export const RESEARCH_PHASE_DATA: Record<ResearchPhase, ResearchPhaseData> = {
  none:     { id: 'none',     name: 'None',            icon: 'mdi:help-circle-outline', costMultiplier: 0,    reveals: '' },
  basic:    { id: 'basic',    name: 'Quick Scan',      icon: 'mdi:magnify',             costMultiplier: 0.08, reveals: 'Approximate success range' },
  detailed: { id: 'detailed', name: 'Due Diligence',   icon: 'mdi:file-search',         costMultiplier: 0.18, reveals: 'Exact success chance + Risk rating' },
  deep:     { id: 'deep',     name: 'Deep Analysis',   icon: 'mdi:brain',               costMultiplier: 0.35, reveals: 'Founder score + Success bonus' },
}

/** Success chance bonus granted by deep analysis */
export const DEEP_ANALYSIS_BONUS = 0.04

export type StartupTrait =
  | 'experienced_team'
  | 'first_mover'
  | 'strong_patents'
  | 'viral_growth'
  | 'government_backing'
  | 'celebrity_founder'
  | 'burn_rate_risk'
  | 'regulatory_hurdles'
  | 'competitive_market'
  | 'pivot_risk'
  | 'key_person_risk'
  | 'tech_breakthrough'
  | 'market_timing'
  | 'strong_moat'

export interface StartupTraitData {
  id: StartupTrait
  name: string
  description: string
  icon: string
  successMod: number    // Additive modifier to success chance (e.g., 0.1 = +10%)
  returnMod: number     // Multiplicative modifier to return (e.g., 1.2 = +20%)
  isPositive: boolean
}

export interface StartupOpportunity {
  id: string
  name: string
  tagline: string
  sector: StartupSector
  stage: StartupStage
  icon: string
  minInvestment: number
  maxInvestment: number
  baseReturnMultiplier: number
  baseSuccessChance: number
  maturityTicks: number
  traits: StartupTrait[]
  expiresAtTick: number        // When this opportunity disappears
  appearedAtTick: number       // When this opportunity was generated
  isHotDeal: boolean           // Hot deals have better returns but shorter windows
  /** @deprecated — use researchPhases instead */
  dueDiligenceCost: number     // Legacy: cost for basic research
  dueDiligenceDone: boolean    // Legacy: whether basic research is done
  /** Multi-phase research system */
  researchPhase: ResearchPhase // Current research level
  researchCosts: Record<ResearchPhase, number> // Cost per phase
  /** Hidden risk rating revealed at phase 2+ (1–5 scale, 5 = very risky) */
  hiddenRiskRating: number
  /** Hidden founder score revealed at phase 3 (1–100, higher = more competent) */
  hiddenFounderScore: number
}

// ═══════════════════════════════════════════════════════════════════
// SECTOR DATA
// ═══════════════════════════════════════════════════════════════════

export interface SectorData {
  id: StartupSector
  name: string
  icon: string
  description: string
  baseRiskMod: number      // Risk modifier (lower = safer)
  baseReturnMod: number    // Return modifier
  color: string
}

export const SECTORS: Record<StartupSector, SectorData> = {
  tech: {
    id: 'tech',
    name: 'Technology',
    icon: 'mdi:laptop',
    description: 'Software and consumer tech',
    baseRiskMod: 1.0,
    baseReturnMod: 1.0,
    color: '#71717a'
  },
  biotech: {
    id: 'biotech',
    name: 'Biotechnology',
    icon: 'mdi:dna',
    description: 'Drugs, genetics, and medical research',
    baseRiskMod: 1.4,
    baseReturnMod: 1.5,
    color: '#8b5cf6'
  },
  greentech: {
    id: 'greentech',
    name: 'Green Energy',
    icon: 'mdi:leaf',
    description: 'Renewable energy and sustainability',
    baseRiskMod: 0.9,
    baseReturnMod: 0.9,
    color: '#22c55e'
  },
  fintech: {
    id: 'fintech',
    name: 'Fintech',
    icon: 'mdi:credit-card-chip',
    description: 'Financial technology and payments',
    baseRiskMod: 1.1,
    baseReturnMod: 1.1,
    color: '#f59e0b'
  },
  space: {
    id: 'space',
    name: 'Space Tech',
    icon: 'mdi:rocket',
    description: 'Aerospace and space exploration',
    baseRiskMod: 1.8,
    baseReturnMod: 2.0,
    color: '#6366f1'
  },
  ai: {
    id: 'ai',
    name: 'Artificial Intelligence',
    icon: 'mdi:robot',
    description: 'Machine learning and AI applications',
    baseRiskMod: 1.2,
    baseReturnMod: 1.3,
    color: '#ec4899'
  },
  gaming: {
    id: 'gaming',
    name: 'Gaming',
    icon: 'mdi:gamepad-variant',
    description: 'Video games and entertainment',
    baseRiskMod: 1.3,
    baseReturnMod: 1.2,
    color: '#ef4444'
  },
  health: {
    id: 'health',
    name: 'HealthTech',
    icon: 'mdi:heart-pulse',
    description: 'Digital health and wellness',
    baseRiskMod: 0.8,
    baseReturnMod: 0.85,
    color: '#14b8a6'
  },
  crypto: {
    id: 'crypto',
    name: 'Crypto/Web3',
    icon: 'mdi:ethereum',
    description: 'Blockchain and decentralized apps',
    baseRiskMod: 2.0,
    baseReturnMod: 2.5,
    color: '#f97316'
  },
  logistics: {
    id: 'logistics',
    name: 'Logistics',
    icon: 'mdi:truck-fast',
    description: 'Supply chain and delivery',
    baseRiskMod: 0.7,
    baseReturnMod: 0.75,
    color: '#64748b'
  }
}

// ═══════════════════════════════════════════════════════════════════
// STAGE DATA
// ═══════════════════════════════════════════════════════════════════

export interface StageData {
  id: StartupStage
  name: string
  description: string
  minInvestmentMult: number    // Multiplier for min investment
  maxInvestmentMult: number    // Multiplier for max investment
  riskMod: number              // Risk modifier (lower stage = higher risk)
  returnMod: number            // Return potential modifier
  maturityMult: number         // Maturity time multiplier
}

export const STAGES: Record<StartupStage, StageData> = {
  seed: {
    id: 'seed',
    name: 'Seed',
    description: 'Very early stage, high risk',
    minInvestmentMult: 0.5,
    maxInvestmentMult: 1,
    riskMod: 1.5,
    returnMod: 2.0,
    maturityMult: 1.5
  },
  seriesA: {
    id: 'seriesA',
    name: 'Series A',
    description: 'Early traction, moderate risk',
    minInvestmentMult: 1,
    maxInvestmentMult: 3,
    riskMod: 1.2,
    returnMod: 1.5,
    maturityMult: 1.2
  },
  seriesB: {
    id: 'seriesB',
    name: 'Series B',
    description: 'Scaling phase, balanced risk',
    minInvestmentMult: 3,
    maxInvestmentMult: 10,
    riskMod: 1.0,
    returnMod: 1.2,
    maturityMult: 1.0
  },
  seriesC: {
    id: 'seriesC',
    name: 'Series C',
    description: 'Late stage, lower risk',
    minInvestmentMult: 10,
    maxInvestmentMult: 50,
    riskMod: 0.8,
    returnMod: 0.9,
    maturityMult: 0.8
  },
  preIPO: {
    id: 'preIPO',
    name: 'Pre-IPO',
    description: 'About to go public, safest',
    minInvestmentMult: 50,
    maxInvestmentMult: 200,
    riskMod: 0.5,
    returnMod: 0.6,
    maturityMult: 0.5
  }
}

// ═══════════════════════════════════════════════════════════════════
// TRAITS DATA
// ═══════════════════════════════════════════════════════════════════

export const TRAITS: Record<StartupTrait, StartupTraitData> = {
  experienced_team: {
    id: 'experienced_team',
    name: 'Experienced Team',
    description: 'Founders have prior successful exits',
    icon: 'mdi:account-group',
    successMod: 0.12,
    returnMod: 1.0,
    isPositive: true
  },
  first_mover: {
    id: 'first_mover',
    name: 'First Mover',
    description: 'Creating a new market category',
    icon: 'mdi:flag-checkered',
    successMod: 0.05,
    returnMod: 1.25,
    isPositive: true
  },
  strong_patents: {
    id: 'strong_patents',
    name: 'Strong Patents',
    description: 'Protected intellectual property',
    icon: 'mdi:shield-check',
    successMod: 0.08,
    returnMod: 1.1,
    isPositive: true
  },
  viral_growth: {
    id: 'viral_growth',
    name: 'Viral Growth',
    description: 'Explosive user acquisition',
    icon: 'mdi:trending-up',
    successMod: 0.10,
    returnMod: 1.3,
    isPositive: true
  },
  government_backing: {
    id: 'government_backing',
    name: 'Government Backing',
    description: 'Supported by government grants',
    icon: 'mdi:bank',
    successMod: 0.15,
    returnMod: 0.9,
    isPositive: true
  },
  celebrity_founder: {
    id: 'celebrity_founder',
    name: 'Celebrity Founder',
    description: 'High-profile founder attracts attention',
    icon: 'mdi:star',
    successMod: 0.03,
    returnMod: 1.15,
    isPositive: true
  },
  tech_breakthrough: {
    id: 'tech_breakthrough',
    name: 'Tech Breakthrough',
    description: 'Revolutionary technology',
    icon: 'mdi:lightbulb',
    successMod: 0.05,
    returnMod: 1.5,
    isPositive: true
  },
  strong_moat: {
    id: 'strong_moat',
    name: 'Strong Moat',
    description: 'Difficult for competitors to replicate',
    icon: 'mdi:castle',
    successMod: 0.10,
    returnMod: 1.1,
    isPositive: true
  },
  market_timing: {
    id: 'market_timing',
    name: 'Perfect Timing',
    description: 'Market conditions are ideal',
    icon: 'mdi:clock-check',
    successMod: 0.08,
    returnMod: 1.2,
    isPositive: true
  },
  burn_rate_risk: {
    id: 'burn_rate_risk',
    name: 'High Burn Rate',
    description: 'Spending cash faster than revenue',
    icon: 'mdi:fire',
    successMod: -0.15,
    returnMod: 1.2,
    isPositive: false
  },
  regulatory_hurdles: {
    id: 'regulatory_hurdles',
    name: 'Regulatory Hurdles',
    description: 'Facing complex legal challenges',
    icon: 'mdi:gavel',
    successMod: -0.12,
    returnMod: 1.15,
    isPositive: false
  },
  competitive_market: {
    id: 'competitive_market',
    name: 'Crowded Market',
    description: 'Many competitors in the space',
    icon: 'mdi:account-multiple',
    successMod: -0.10,
    returnMod: 0.9,
    isPositive: false
  },
  pivot_risk: {
    id: 'pivot_risk',
    name: 'Pivot Risk',
    description: 'May need to change direction',
    icon: 'mdi:rotate-right',
    successMod: -0.08,
    returnMod: 1.1,
    isPositive: false
  },
  key_person_risk: {
    id: 'key_person_risk',
    name: 'Key Person Risk',
    description: 'Too dependent on one individual',
    icon: 'mdi:account-alert',
    successMod: -0.10,
    returnMod: 1.0,
    isPositive: false
  }
}

// ═══════════════════════════════════════════════════════════════════
// NAME GENERATION
// ═══════════════════════════════════════════════════════════════════

const NAME_PREFIXES: Record<StartupSector, string[]> = {
  tech: ['Quantum', 'Neo', 'Cyber', 'Digital', 'Cloud', 'Pixel', 'Byte', 'Code', 'Data', 'Smart'],
  biotech: ['Gene', 'Bio', 'Cell', 'Vita', 'Helix', 'Synth', 'Neuro', 'Pharma', 'Genome', 'Pulse'],
  greentech: ['Solar', 'Eco', 'Green', 'Terra', 'Clean', 'Renew', 'Wind', 'Hydro', 'Earth', 'Sustain'],
  fintech: ['Pay', 'Fin', 'Cash', 'Coin', 'Trade', 'Wealth', 'Capital', 'Fund', 'Ledger', 'Cred'],
  space: ['Astro', 'Stellar', 'Orbit', 'Cosmo', 'Nova', 'Lunar', 'Mars', 'Zero-G', 'Star', 'Void'],
  ai: ['Neural', 'Cogni', 'Mind', 'Logic', 'Deep', 'Synapse', 'Intel', 'Brain', 'Think', 'Learn'],
  gaming: ['Play', 'Game', 'Quest', 'Arena', 'Pixel', 'Epic', 'Arcade', 'Level', 'Guild', 'World'],
  health: ['Med', 'Health', 'Care', 'Vital', 'Wellness', 'Life', 'Cure', 'Heal', 'Pulse', 'Fit'],
  crypto: ['Block', 'Chain', 'Defi', 'Meta', 'Token', 'Hash', 'Node', 'Mint', 'Web3', 'Decen'],
  logistics: ['Ship', 'Fleet', 'Route', 'Track', 'Swift', 'Hub', 'Link', 'Flow', 'Trans', 'Pack']
}

const NAME_SUFFIXES = [
  'Labs', 'Tech', 'AI', 'Systems', 'Works', 'Hub', 'Solutions', 'Dynamics',
  'Ventures', 'Corp', 'Global', 'Logic', 'Wave', 'Stream', 'Forge', 'Spark',
  'Network', 'Space', 'Base', 'Cloud', 'Link', 'Stack', 'Box', 'Shift'
]

const TAGLINES_BY_SECTOR: Record<StartupSector, string[]> = {
  tech: [
    'Disrupting the digital landscape',
    'Next-gen software innovation',
    'Redefining user experience',
    'Cloud-native revolution',
    'Building the future of tech'
  ],
  biotech: [
    'Pioneering genetic medicine',
    'Unlocking life\'s code',
    'Curing the incurable',
    'Biotech breakthrough incoming',
    'Engineering better health'
  ],
  greentech: [
    'Powering a sustainable future',
    'Clean energy for everyone',
    'Making green mainstream',
    'Zero-emission innovation',
    'Saving the planet profitably'
  ],
  fintech: [
    'Banking without banks',
    'Money reimagined',
    'Financial freedom for all',
    'Smart money, smarter future',
    'Payments evolved'
  ],
  space: [
    'Making space accessible',
    'The final frontier awaits',
    'Orbital economy pioneer',
    'Stars within reach',
    'Space for humanity'
  ],
  ai: [
    'Intelligence amplified',
    'AI that understands',
    'Machine learning revolution',
    'Thinking beyond limits',
    'Cognitive computing redefined'
  ],
  gaming: [
    'Play different, win big',
    'Gamers\' dream realized',
    'The next gaming sensation',
    'Entertainment evolved',
    'Where gaming meets innovation'
  ],
  health: [
    'Healthcare in your pocket',
    'Wellness for the modern age',
    'Democratizing health',
    'Prevention over cure',
    'Digital health revolution'
  ],
  crypto: [
    'Decentralizing everything',
    'Web3 is here',
    'Own your digital future',
    'Beyond traditional finance',
    'Blockchain meets reality'
  ],
  logistics: [
    'Delivery reimagined',
    'Supply chain mastery',
    'From A to B, faster',
    'Logistics intelligence',
    'Moving the world forward'
  ]
}

// ═══════════════════════════════════════════════════════════════════
// GENERATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateStartupName(sector: StartupSector): string {
  const prefix = randomElement(NAME_PREFIXES[sector])
  const suffix = randomElement(NAME_SUFFIXES)
  return `${prefix}${suffix}`
}

function generateTagline(sector: StartupSector): string {
  return randomElement(TAGLINES_BY_SECTOR[sector])
}

function selectRandomTraits(count: number): StartupTrait[] {
  const allTraits = Object.keys(TRAITS) as StartupTrait[]
  const positive = allTraits.filter(t => TRAITS[t].isPositive)
  const negative = allTraits.filter(t => !TRAITS[t].isPositive)

  const selected: StartupTrait[] = []

  // Ensure at least one positive and possibly one negative
  if (count >= 1) {
    selected.push(randomElement(positive))
  }
  if (count >= 2 && Math.random() > 0.4) {
    selected.push(randomElement(negative))
  }

  // Fill remaining with random traits
  while (selected.length < count) {
    const pool = Math.random() > 0.5 ? positive : negative
    const trait = randomElement(pool)
    if (!selected.includes(trait)) {
      selected.push(trait)
    }
  }

  return selected
}

/**
 * Pick a random stage using continuous Gaussian curves in log-space.
 *
 * Each stage has a "peak" net-worth where it's most likely to appear,
 * with smooth bell-curve falloff in both directions.
 * This means:
 *   • At $10B you CAN still roll a tiny Seed deal (rare but possible)
 *   • At $10K you CAN land a once-in-a-lifetime Series C (very rare)
 *   • The distribution shifts naturally and continuously with net worth
 *   • No hardcoded if/else thresholds anywhere
 */
function selectRandomStage(playerNetWorth: number): StartupStage {
  const nw = Math.max(1, playerNetWorth)
  const logNW = Math.log10(nw)
  const stages: StartupStage[] = ['seed', 'seriesA', 'seriesB', 'seriesC', 'preIPO']

  // Each stage: [peakNetWorth, amplitudeAtPeak, spreadInLogSpace]
  // • peak: the NW where this stage is most common
  // • amplitude: how tall the bell curve is (relative weight)
  // • spread: how wide the bell is (bigger = stays relevant across more NW ranges)
  const curves: [number, number, number][] = [
    [50_000,          30, 1.8],   // Seed:     peaks early, very wide tail
    [500_000,         35, 1.5],   // Series A: peaks mid-early
    [10_000_000,      35, 1.4],   // Series B: mid game
    [500_000_000,     30, 1.3],   // Series C: late game
    [10_000_000_000,  25, 1.2],   // Pre-IPO:  very late, narrowest spread
  ]

  const weights = curves.map(([peak, amplitude, spread]) => {
    // Gaussian in log-space: w = A × exp(-½ × ((log₁₀(nw) - log₁₀(peak)) / spread)²)
    const logDist = logNW - Math.log10(peak)
    const w = amplitude * Math.exp(-(logDist * logDist) / (2 * spread * spread))
    // Floor: every stage always has at least a tiny chance (0.5 out of ~60-100 total)
    return Math.max(0.5, w)
  })

  // Weighted random pick
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let roll = Math.random() * totalWeight
  for (let i = 0; i < stages.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return stages[i]
  }
  return 'seed'
}

function selectRandomSector(): StartupSector {
  const sectors = Object.keys(SECTORS) as StartupSector[]
  return randomElement(sectors)
}

let opportunityIdCounter = 0

/**
 * Generate a single random startup opportunity.
 *
 * Investment sizing uses a log-normal distribution centered around the
 * player's net worth, shifted by stage. This naturally produces:
 *   • Many opportunities around 1-5% of NW (bread & butter deals)
 *   • Some smaller ones (0.1% NW — pocket change, quick flips)
 *   • Rare huge ones (15-30% NW — game-changing, all-in bets)
 * No hardcoded thresholds — everything scales continuously.
 */
export function generateOpportunity(
  currentTick: number,
  playerNetWorth: number,
  refreshIntervalTicks: number,
  isHotDeal = false
): StartupOpportunity {
  const sector = selectRandomSector()
  const stage = selectRandomStage(playerNetWorth)
  const sectorData = SECTORS[sector]
  const stageData = STAGES[stage]

  // Determine trait count (1-3)
  const traitCount = randomInt(1, 3)
  const traits = selectRandomTraits(traitCount)

  // Calculate trait modifiers
  let traitSuccessMod = 0
  let traitReturnMod = 1
  for (const t of traits) {
    const td = TRAITS[t]
    traitSuccessMod += td.successMod
    traitReturnMod *= td.returnMod
  }

  // ═══ DYNAMIC INVESTMENT SIZING (log-normal distribution) ═══════
  //
  // Roll a "magnitude" from a log-normal centered on (NW × stageFraction).
  // The variance parameter spreads values across ~2 orders of magnitude,
  // so with $1B NW you might see anything from $500K to $300M in a
  // single batch — with most clustering around the stage's sweet spot.
  // ═══════════════════════════════════════════════════════════════

  const effectiveNW = Math.max(50_000, playerNetWorth)

  // Each stage's "center" as a fraction of NW
  const stageCenterFraction: Record<StartupStage, number> = {
    seed:    0.008,   // ~0.8% of NW
    seriesA: 0.02,    // ~2%
    seriesB: 0.05,    // ~5%
    seriesC: 0.10,    // ~10%
    preIPO:  0.18,    // ~18%
  }

  // Box-Muller transform → gaussian sample
  const u1 = Math.max(1e-10, Math.random())
  const u2 = Math.random()
  const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)

  // variance controls spread: 0.7 ≈ ±2 orders of magnitude at 2σ
  const variance = 0.7
  const centerAmount = effectiveNW * stageCenterFraction[stage]
  const rolledAmount = centerAmount * Math.exp(gaussian * variance)

  // Absolute floor per stage (keeps early game playable)
  const stageFloor: Record<StartupStage, number> = {
    seed: 1_000, seriesA: 5_000, seriesB: 25_000, seriesC: 100_000, preIPO: 500_000
  }

  // Ceiling: cap at 35% of NW so you can't go bankrupt in one deal
  const rawMin = Math.max(stageFloor[stage], Math.min(effectiveNW * 0.35, rolledAmount))

  // Smart rounding that adapts to the magnitude of the number
  const roundTo = rawMin >= 1_000_000_000 ? 10_000_000
                : rawMin >= 100_000_000   ? 1_000_000
                : rawMin >= 1_000_000     ? 100_000
                : rawMin >= 100_000       ? 10_000
                : rawMin >= 10_000        ? 1_000
                : 100
  const minInvestment = Math.round(rawMin / roundTo) * roundTo || roundTo

  // Max is 3-6× the min (randomized for variety)
  const maxSpread = 3 + Math.random() * 3
  const maxInvestment = Math.round((minInvestment * maxSpread) / roundTo) * roundTo

  // Risk-adjusted return: higher risk sectors/stages have higher potential returns
  const baseReturn = 2 + (sectorData.baseReturnMod * stageData.returnMod * traitReturnMod - 1) * 3
  // Clamp to minimum 1.5x — a successful investment must always be profitable
  const returnMultiplier = Math.max(1.5, Math.round(baseReturn * 10) / 10)

  // Success chance: inverse of return potential, modified by traits and stage
  const baseSuccessChance = 1 / (1 + Math.log(returnMultiplier))
  const riskAdjusted = baseSuccessChance / (sectorData.baseRiskMod * stageData.riskMod)
  const successChance = Math.min(0.95, Math.max(0.05, riskAdjusted + traitSuccessMod))

  // Maturity time (in ticks, 10 ticks = 1 second)
  const baseMaturity = 6000 * stageData.maturityMult // ~10 minutes base
  const maturityTicks = Math.round(baseMaturity * (0.8 + Math.random() * 0.4))

  // Hot deals have shorter windows but better returns
  const windowMultiplier = isHotDeal ? 0.3 : 1
  const expiresAtTick = currentTick + Math.round(refreshIntervalTicks * windowMultiplier)

  // ═══ RESEARCH COSTS (multi-phase) ════════════════════════════════
  // Each phase costs a % of minInvestment — basic(8%), detailed(18%), deep(35%)
  // Legacy dueDiligenceCost kept for backward compatibility
  // ═════════════════════════════════════════════════════════════════
  const ddRoundTo = minInvestment >= 1_000_000 ? 100_000 : minInvestment >= 10_000 ? 1_000 : 100
  const dueDiligenceCost = Math.max(100, Math.round(minInvestment * 0.05 / ddRoundTo) * ddRoundTo)

  const researchCosts = {} as Record<ResearchPhase, number>
  for (const phase of RESEARCH_PHASES) {
    const data = RESEARCH_PHASE_DATA[phase]
    if (data.costMultiplier === 0) {
      researchCosts[phase] = 0
    } else {
      const rawCost = minInvestment * data.costMultiplier
      researchCosts[phase] = Math.max(100, Math.round(rawCost / ddRoundTo) * ddRoundTo)
    }
  }

  // ═══ HIDDEN ATTRIBUTES (revealed through research) ═════════════
  // Risk rating (1–5): derived from sector risk × stage risk, plus some randomness
  const compositeRisk = sectorData.baseRiskMod * stageData.riskMod
  // Map composite risk [0.35 .. 3.0] → [1 .. 5]
  const riskNorm = Math.min(1, Math.max(0, (compositeRisk - 0.3) / 2.7))
  const riskBase = 1 + riskNorm * 4
  // Jitter ±0.5 then clamp to [1, 5]
  const hiddenRiskRating = Math.round(Math.min(5, Math.max(1, riskBase + (Math.random() - 0.5))))

  // Founder score (1–100): base 50, influenced by traits
  let founderBase = 50 + (Math.random() * 20 - 10) // random ±10
  for (const t of traits) {
    const td = TRAITS[t]
    if (t === 'experienced_team')   founderBase += 20
    else if (t === 'celebrity_founder')   founderBase += 8
    else if (t === 'key_person_risk')     founderBase -= 15
    else if (td.isPositive)               founderBase += 5
    else                                  founderBase -= 5
  }
  const hiddenFounderScore = Math.round(Math.min(100, Math.max(1, founderBase)))

  opportunityIdCounter++
  const id = `startup_${currentTick}_${opportunityIdCounter}`

  return {
    id,
    name: generateStartupName(sector),
    tagline: generateTagline(sector),
    sector,
    stage,
    icon: sectorData.icon,
    minInvestment,
    maxInvestment,
    baseReturnMultiplier: isHotDeal ? returnMultiplier * 1.3 : returnMultiplier,
    baseSuccessChance: successChance,
    maturityTicks,
    traits,
    expiresAtTick,
    appearedAtTick: currentTick,
    isHotDeal,
    dueDiligenceCost,
    dueDiligenceDone: false,
    researchPhase: 'none' as ResearchPhase,
    researchCosts,
    hiddenRiskRating,
    hiddenFounderScore
  }
}

/**
 * Generate a batch of startup opportunities
 */
export function generateOpportunityBatch(
  currentTick: number,
  playerNetWorth: number,
  refreshIntervalTicks: number,
  count = 4
): StartupOpportunity[] {
  const opportunities: StartupOpportunity[] = []

  // Chance for 1 hot deal in the batch
  const hotDealIndex = Math.random() < 0.25 ? randomInt(0, count - 1) : -1

  for (let i = 0; i < count; i++) {
    opportunities.push(
      generateOpportunity(
        currentTick,
        playerNetWorth,
        refreshIntervalTicks,
        i === hotDealIndex
      )
    )
  }

  return opportunities
}

/**
 * Calculate effective success chance after traits and bonuses
 */
export function calculateEffectiveSuccessChance(
  opportunity: StartupOpportunity,
  sectorBonus = 0,
  globalBonus = 0
): number {
  let chance = opportunity.baseSuccessChance + sectorBonus + globalBonus
  return Math.min(0.95, Math.max(0.05, chance))
}

/**
 * Calculate effective return multiplier after traits and bonuses
 */
export function calculateEffectiveReturn(
  opportunity: StartupOpportunity,
  returnBonus = 1
): number {
  return opportunity.baseReturnMultiplier * returnBonus
}

// Export constants for use in other modules
export const OPPORTUNITY_REFRESH_TICKS = 36000 // 1 hour at 10 ticks/sec
export const MIN_OPPORTUNITIES = 3
export const MAX_OPPORTUNITIES = 6
