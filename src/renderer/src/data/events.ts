import type { GameEventDef } from '@renderer/core/EventSystem'

/**
 * Static event definitions.
 *
 * durationTicks = seconds × 10  (engine runs at 10 ticks/sec)
 * probability   = chance per evaluation cycle (every ~10s)
 */

export const EVENTS: GameEventDef[] = [
  // ─── Positive events ──────────────────────────────────────────

  {
    id: 'bull_market',
    name: 'Bull Market',
    description: 'The stock market is surging! All investment returns are boosted.',
    probability: 0.03,
    durationTicks: 1200, // 120s
    effects: [{ type: 'income_multiplier', value: 1.5, target: 'stocks' }],
    icon: 'mdi:chart-line-variant',
    category: 'market'
  },
  {
    id: 'tax_break',
    name: 'Tax Break',
    description: 'Government announces tax cuts. All income increased!',
    probability: 0.025,
    durationTicks: 1800,
    effects: [{ type: 'income_multiplier', value: 1.3 }],
    icon: 'mdi:file-document-check',
    category: 'economy'
  },
  {
    id: 'viral_marketing',
    name: 'Viral Marketing',
    description: 'One of your businesses went viral on social media!',
    probability: 0.04,
    durationTicks: 900,
    effects: [{ type: 'income_multiplier', value: 2, target: 'business' }],
    icon: 'mdi:share-variant',
    category: 'business'
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    description: 'Everything you touch turns to gold. Click power boosted!',
    probability: 0.05,
    durationTicks: 600,
    effects: [{ type: 'click_multiplier', value: 5 }],
    icon: 'mdi:hand-coin',
    category: 'personal'
  },
  {
    id: 'crypto_boom',
    name: 'Crypto Boom',
    description: 'Crypto markets are going parabolic!',
    probability: 0.02,
    durationTicks: 900,
    effects: [{ type: 'income_multiplier', value: 2, target: 'crypto' }],
    icon: 'mdi:bitcoin',
    category: 'market'
  },
  {
    id: 'real_estate_boom',
    name: 'Housing Boom',
    description: 'Property values and rents are skyrocketing!',
    probability: 0.025,
    durationTicks: 1500,
    effects: [{ type: 'income_multiplier', value: 1.75, target: 'realestate' }],
    icon: 'mdi:home-city',
    category: 'market'
  },
  {
    id: 'lucky_day',
    name: 'Lucky Day',
    description: 'You feel incredibly lucky today. Gambling odds improved!',
    probability: 0.03,
    durationTicks: 1200,
    effects: [{ type: 'sector_boost', value: 1.2, target: 'gambling' }],
    icon: 'mdi:clover',
    category: 'personal'
  },
  {
    id: 'lottery_fever',
    name: 'Lottery Fever',
    description: 'The whole city is buying tickets! Jackpot pools surge. Gambling luck massively boosted!',
    probability: 0.015,
    durationTicks: 1800,
    effects: [{ type: 'sector_boost', value: 1.5, target: 'gambling' }],
    icon: 'mdi:ticket-percent',
    category: 'personal'
  },
  {
    id: 'lucky_numbers',
    name: 'Lucky Numbers Alignment',
    description: 'The stars have aligned — your lucky numbers are especially potent today!',
    probability: 0.02,
    durationTicks: 900,
    effects: [{ type: 'sector_boost', value: 1.35, target: 'gambling' }],
    icon: 'mdi:numeric-7-circle',
    category: 'personal'
  },
  {
    id: 'xp_boost',
    name: 'Eureka Moment',
    description: 'A flash of brilliance! Double XP for a while.',
    probability: 0.04,
    durationTicks: 1200,
    effects: [{ type: 'sector_boost', value: 2, target: 'xp' }],
    icon: 'mdi:lightbulb-on',
    category: 'personal'
  },

  // ─── Negative events ──────────────────────────────────────────

  {
    id: 'recession',
    name: 'Recession',
    description: 'Economic downturn. All income reduced.',
    probability: 0.02,
    durationTicks: 1500,
    effects: [{ type: 'income_multiplier', value: 0.7 }],
    icon: 'mdi:trending-down',
    category: 'economy'
  },
  {
    id: 'market_crash',
    name: 'Market Crash',
    description: 'Stock markets are plummeting!',
    probability: 0.015,
    durationTicks: 1200,
    effects: [{ type: 'income_multiplier', value: 0.5, target: 'stocks' }],
    icon: 'mdi:chart-line-variant',
    category: 'market'
  },
  {
    id: 'crypto_winter',
    name: 'Crypto Winter',
    description: 'Crypto markets are freezing. Hold on tight!',
    probability: 0.015,
    durationTicks: 1800,
    effects: [{ type: 'income_multiplier', value: 0.4, target: 'crypto' }],
    icon: 'mdi:snowflake',
    category: 'market'
  },
  {
    id: 'supply_shortage',
    name: 'Supply Shortage',
    description: 'Supply chain issues hit your businesses.',
    probability: 0.025,
    durationTicks: 1200,
    effects: [{ type: 'income_multiplier', value: 0.6, target: 'business' }],
    icon: 'mdi:truck-alert',
    category: 'business'
  },

  // ─── Choice events ────────────────────────────────────────────

  {
    id: 'investor_offer',
    name: 'Angel Investor',
    description: 'An investor offers to double your income for 60s, but takes a 20% cut of current cash.',
    probability: 0.02,
    durationTicks: 600,
    effects: [{ type: 'income_multiplier', value: 2 }],
    icon: 'mdi:account-cash',
    category: 'opportunity',
    requiresChoice: true,
    declineEffects: []
  },
  {
    id: 'risky_bet',
    name: 'High Roller Invitation',
    description: 'A VIP invites you to a private game. +50% gambling luck for 30s.',
    probability: 0.015,
    durationTicks: 300,
    effects: [{ type: 'sector_boost', value: 1.5, target: 'gambling' }],
    icon: 'mdi:cards-playing-diamond',
    category: 'opportunity',
    requiresChoice: true,
    declineEffects: []
  },
  {
    id: 'merger_opportunity',
    name: 'Merger Opportunity',
    description: 'A rival wants to merge. Boosts business income but costs cash upfront.',
    probability: 0.02,
    durationTicks: 1800,
    effects: [{ type: 'income_multiplier', value: 1.5, target: 'business' }],
    icon: 'mdi:handshake',
    category: 'opportunity',
    requiresChoice: true,
    declineEffects: []
  },

  // ─── Loan-related events ──────────────────────────────────────

  {
    id: 'federal_rate_cut',
    name: 'Federal Rate Cut',
    description: 'The central bank cuts interest rates! All loan rates reduced by 25%.',
    probability: 0.02,
    durationTicks: 3600, // 6 minutes
    effects: [{ type: 'loan_rate_modifier', value: -0.25 }],
    icon: 'mdi:bank',
    category: 'economy'
  },
  {
    id: 'federal_rate_hike',
    name: 'Federal Rate Hike',
    description: 'Interest rates are rising! All loan rates increased by 30%.',
    probability: 0.018,
    durationTicks: 3600,
    effects: [{ type: 'loan_rate_modifier', value: 0.30 }],
    icon: 'mdi:bank-transfer',
    category: 'economy'
  },
  {
    id: 'credit_bureau_error',
    name: 'Credit Bureau Error',
    description: 'A glitch at the credit bureau has temporarily boosted your credit score!',
    probability: 0.015,
    durationTicks: 1800,
    effects: [{ type: 'credit_score_modifier', value: 15 }],
    icon: 'mdi:file-document-check',
    category: 'personal'
  },
  {
    id: 'credit_card_fraud',
    name: 'Identity Theft Alert',
    description: 'Someone tried to steal your identity! Credit score temporarily affected.',
    probability: 0.012,
    durationTicks: 1200,
    effects: [{ type: 'credit_score_modifier', value: -10 }],
    icon: 'mdi:shield-alert',
    category: 'personal'
  },
  {
    id: 'loan_forgiveness',
    name: 'Debt Relief Program',
    description: 'A new government program offers debt relief! Income boosted as debt burden eases.',
    probability: 0.01,
    durationTicks: 2400,
    effects: [
      { type: 'income_multiplier', value: 1.25 },
      { type: 'loan_rate_modifier', value: -0.15 }
    ],
    icon: 'mdi:heart-pulse',
    category: 'economy'
  },
  {
    id: 'bank_holiday',
    name: 'Bank Holiday',
    description: 'Banks are closed for a special holiday. No loan interest accrues!',
    probability: 0.025,
    durationTicks: 600, // 1 minute
    effects: [{ type: 'loan_rate_modifier', value: -1.0 }], // -100% = no interest
    icon: 'mdi:calendar-check',
    category: 'economy'
  },
  {
    id: 'loan_shark_threat',
    name: 'Suspicious Visitor',
    description: 'Someone questionable is asking about your finances. Better lay low.',
    probability: 0.01,
    durationTicks: 900,
    effects: [
      { type: 'income_multiplier', value: 0.85, target: 'business' },
      { type: 'loan_rate_modifier', value: 0.20, target: 'predatory' }
    ],
    icon: 'mdi:account-question',
    category: 'personal'
  },
  {
    id: 'financial_advisor',
    name: 'Financial Advisor Visit',
    description: 'A financial advisor helps optimize your debt strategy. Better loan terms available!',
    probability: 0.02,
    durationTicks: 1800,
    effects: [
      { type: 'loan_rate_modifier', value: -0.20 },
      { type: 'credit_score_modifier', value: 5 }
    ],
    icon: 'mdi:account-tie',
    category: 'opportunity'
  },
  {
    id: 'credit_line_increase',
    name: 'Credit Line Increase',
    description: 'Your good payment history has been noticed! Improved borrowing terms.',
    probability: 0.025,
    durationTicks: 2400,
    effects: [
      { type: 'credit_score_modifier', value: 8 },
      { type: 'loan_rate_modifier', value: -0.10 }
    ],
    icon: 'mdi:credit-card-plus',
    category: 'personal'
  },
  {
    id: 'economic_stimulus',
    name: 'Economic Stimulus',
    description: 'The government announces economic stimulus! Easy money and low rates.',
    probability: 0.015,
    durationTicks: 3000,
    effects: [
      { type: 'income_multiplier', value: 1.20 },
      { type: 'loan_rate_modifier', value: -0.30 },
      { type: 'sector_boost', value: 1.15, target: 'business' }
    ],
    icon: 'mdi:cash-plus',
    category: 'economy'
  },

  // ─── Deposit-related events ───────────────────────────────────

  {
    id: 'savings_promo',
    name: 'Bank Promotional Rate',
    description: 'Banks are competing for deposits! All deposit APYs get a massive boost.',
    probability: 0.02,
    durationTicks: 1800, // 3 minutes
    effects: [{ type: 'deposit_rate_modifier', value: 0.50 }],
    icon: 'mdi:piggy-bank',
    category: 'economy'
  },
  {
    id: 'rate_hike_deposits',
    name: 'Central Bank Rate Hike',
    description: 'The central bank raises rates. Deposit yields soar, but loan costs rise too.',
    probability: 0.018,
    durationTicks: 3600, // 6 minutes
    effects: [
      { type: 'deposit_rate_modifier', value: 0.35 },
      { type: 'loan_rate_modifier', value: 0.20 }
    ],
    icon: 'mdi:bank-plus',
    category: 'economy'
  },
  {
    id: 'savings_tax',
    name: 'Savings Tax',
    description: 'A new tax on savings accounts reduces deposit yields.',
    probability: 0.015,
    durationTicks: 2400, // 4 minutes
    effects: [{ type: 'deposit_rate_modifier', value: -0.30 }],
    icon: 'mdi:file-document-minus',
    category: 'economy'
  },
  {
    id: 'deposit_insurance_boost',
    name: 'FDIC Guarantee Expansion',
    description: 'The government expands deposit insurance. Confidence in savings rises!',
    probability: 0.015,
    durationTicks: 3000, // 5 minutes
    effects: [
      { type: 'deposit_rate_modifier', value: 0.20 },
      { type: 'credit_score_modifier', value: 5 }
    ],
    icon: 'mdi:shield-check',
    category: 'economy'
  },
  {
    id: 'negative_rates',
    name: 'Negative Interest Rates',
    description: 'Central bank goes negative! Deposit yields plummet across the board.',
    probability: 0.01,
    durationTicks: 2400,
    effects: [
      { type: 'deposit_rate_modifier', value: -0.60 },
      { type: 'loan_rate_modifier', value: -0.40 }
    ],
    icon: 'mdi:trending-down',
    category: 'economy'
  },

  // ─── Startup / Investment events ──────────────────────────────

  {
    id: 'startup_boom',
    name: 'Startup Boom',
    description: 'The venture capital scene is on fire! Startup success chances boosted.',
    probability: 0.02,
    durationTicks: 1800, // 3 minutes
    effects: [{ type: 'startup_success_modifier', value: 0.08 }],
    icon: 'mdi:rocket-launch',
    category: 'market'
  },
  {
    id: 'vc_winter',
    name: 'VC Winter',
    description: 'Investors are pulling back. Startup returns are lower than usual.',
    probability: 0.015,
    durationTicks: 2400, // 4 minutes
    effects: [{ type: 'startup_return_modifier', value: -0.20 }],
    icon: 'mdi:snowflake-alert',
    category: 'market'
  },
  {
    id: 'research_grant',
    name: 'Research Grant',
    description: 'A government research fund subsidises due diligence costs!',
    probability: 0.02,
    durationTicks: 1500, // 2.5 minutes
    effects: [{ type: 'research_cost_modifier', value: -0.30 }],
    icon: 'mdi:file-certificate',
    category: 'opportunity'
  },
  {
    id: 'unicorn_mania',
    name: 'Unicorn Mania',
    description: 'Everyone wants in on the next unicorn! Startup returns skyrocket.',
    probability: 0.012,
    durationTicks: 1200,
    effects: [
      { type: 'startup_return_modifier', value: 0.40 },
      { type: 'startup_success_modifier', value: -0.05 }
    ],
    icon: 'mdi:unicorn-variant',
    category: 'market'
  },
  {
    id: 'due_diligence_leak',
    name: 'Industry Insider Leak',
    description: 'Insider intel surfaces — research is cheaper and more effective!',
    probability: 0.015,
    durationTicks: 900,
    effects: [
      { type: 'research_cost_modifier', value: -0.50 },
      { type: 'startup_success_modifier', value: 0.04 }
    ],
    icon: 'mdi:account-voice',
    category: 'opportunity'
  },
  {
    id: 'tech_bubble_burst',
    name: 'Tech Bubble Burst',
    description: 'A wave of startup failures shakes investor confidence.',
    probability: 0.01,
    durationTicks: 2400,
    effects: [
      { type: 'startup_success_modifier', value: -0.10 },
      { type: 'startup_return_modifier', value: -0.15 }
    ],
    icon: 'mdi:chart-bubble',
    category: 'market'
  }
]
