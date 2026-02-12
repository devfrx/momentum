import { D } from '@renderer/core/BigNum'
import type { UpgradeDef } from '@renderer/data/upgrades'

/**
 * Business Skill Tree — 75 nodes
 *
 * LEFT path:   Jobs & Labour
 * CENTER path: Revenue & Operations
 * RIGHT path:  Marketing & Customers
 *
 * Convergence milestones at rows 8, 12, 16.
 */
export const BUSINESS_SKILLS: UpgradeDef[] = [
  // ═══ ROW 0 — Root ══════════════════════════════════════════════
  {
    id: 'b_root', name: 'Hustle Mindset', row: 0, col: 2,
    description: 'A driven mindset boosts all your businesses.',
    effectDescription: '+2% business revenue', icon: 'mdi:head-lightbulb',
    cost: D(500), target: 'businessRevenue', multiplier: 0.02,
    category: 'Business', prerequisites: [],
  },

  // ═══ ROW 1 ═════════════════════════════════════════════════════
  {
    id: 'b_equip', name: 'Better Equipment', row: 1, col: 1,
    description: 'Upgraded tools make your gig work faster.',
    effectDescription: '+6% job efficiency', icon: 'mdi:toolbox',
    cost: D(2_000), target: 'jobEfficiency', multiplier: 0.06,
    category: 'Business', prerequisites: ['b_root'],
  },
  {
    id: 'b_social', name: 'Social Media', row: 1, col: 3,
    description: 'Reach more customers through online presence.',
    effectDescription: '+3% customer attraction', icon: 'mdi:bullhorn',
    cost: D(2_500), target: 'customerAttraction', multiplier: 0.03,
    category: 'Business', prerequisites: ['b_root'],
  },

  // ═══ ROW 2 ═════════════════════════════════════════════════════
  {
    id: 'b_rep', name: 'Reputation Builder', row: 2, col: 0,
    description: 'Word of mouth brings better gigs your way.',
    effectDescription: '+6% job efficiency', icon: 'mdi:star',
    cost: D(8_000), target: 'jobEfficiency', multiplier: 0.06,
    category: 'Business', prerequisites: ['b_equip'],
  },
  {
    id: 'b_service', name: 'Customer Service', row: 2, col: 2,
    description: 'Exceptional service builds lasting loyalty.',
    effectDescription: '+2% business revenue', icon: 'mdi:account-heart',
    cost: D(10_000), target: 'businessRevenue', multiplier: 0.02,
    category: 'Business', prerequisites: ['b_root'],
  },
  {
    id: 'b_online', name: 'Online Store', row: 2, col: 4,
    description: 'Sell your products around the clock online.',
    effectDescription: '+4% customer attraction', icon: 'mdi:cart',
    cost: D(8_000), target: 'customerAttraction', multiplier: 0.04,
    category: 'Business', prerequisites: ['b_social'],
  },

  // ═══ ROW 3 ═════════════════════════════════════════════════════
  {
    id: 'b_freelance', name: 'Freelance Master', row: 3, col: 0,
    description: 'You are the go-to freelancer in every market.',
    effectDescription: '+7% job efficiency', icon: 'mdi:laptop',
    cost: D(25_000), target: 'jobEfficiency', multiplier: 0.07,
    category: 'Business', prerequisites: ['b_rep'],
  },
  {
    id: 'b_ops', name: 'Efficient Operations', row: 3, col: 1,
    description: 'Streamline all internal processes.',
    effectDescription: '+3% business revenue', icon: 'mdi:cog',
    cost: D(30_000), target: 'businessRevenue', multiplier: 0.03,
    category: 'Business', prerequisites: ['b_equip', 'b_service'],
  },
  {
    id: 'b_brand', name: 'Brand Recognition', row: 3, col: 3,
    description: 'Your brand is known across the region.',
    effectDescription: '+4% customer attraction', icon: 'mdi:tag-heart',
    cost: D(35_000), target: 'customerAttraction', multiplier: 0.04,
    category: 'Business', prerequisites: ['b_service', 'b_social'],
  },
  {
    id: 'b_seo', name: 'SEO Expert', row: 3, col: 4,
    description: 'Dominate search engine rankings.',
    effectDescription: '+4% customer attraction', icon: 'mdi:magnify',
    cost: D(25_000), target: 'customerAttraction', multiplier: 0.04,
    category: 'Business', prerequisites: ['b_online'],
  },

  // ═══ ROW 4 ═════════════════════════════════════════════════════
  {
    id: 'b_workforce', name: 'Workforce Expansion', row: 4, col: 0,
    description: 'Hire your first real team of employees.',
    effectDescription: '+7% job efficiency', icon: 'mdi:account-group',
    cost: D(80_000), target: 'jobEfficiency', multiplier: 0.07,
    category: 'Business', prerequisites: ['b_freelance'],
  },
  {
    id: 'b_supply', name: 'Supply Chain', row: 4, col: 1,
    description: 'Optimise procurement and cut waste.',
    effectDescription: '-3% operating costs', icon: 'mdi:truck-delivery',
    cost: D(100_000), target: 'costReduction', multiplier: -0.03,
    category: 'Business', prerequisites: ['b_ops'],
  },
  {
    id: 'b_digimkt', name: 'Digital Marketing', row: 4, col: 2,
    description: 'Paid campaigns across every digital channel.',
    effectDescription: '+4% customer attraction', icon: 'mdi:monitor-cellphone',
    cost: D(120_000), target: 'customerAttraction', multiplier: 0.04,
    category: 'Business', prerequisites: ['b_ops', 'b_brand'],
  },
  {
    id: 'b_franchise', name: 'Franchise Model', row: 4, col: 3,
    description: 'License your brand to expand fast.',
    effectDescription: '+3% business revenue', icon: 'mdi:store',
    cost: D(90_000), target: 'businessRevenue', multiplier: 0.03,
    category: 'Business', prerequisites: ['b_brand'],
  },
  {
    id: 'b_outsource', name: 'Outsourcing', row: 4, col: 4,
    description: 'Delegate non-core tasks to cut overhead.',
    effectDescription: '-3% operating costs', icon: 'mdi:earth',
    cost: D(100_000), target: 'costReduction', multiplier: -0.03,
    category: 'Business', prerequisites: ['b_seo'],
  },

  // ═══ ROW 5 ═════════════════════════════════════════════════════
  {
    id: 'b_teamlead', name: 'Team Leadership', row: 5, col: 0,
    description: 'Inspire peak performance from your team.',
    effectDescription: '+8% job efficiency', icon: 'mdi:account-star',
    cost: D(250_000), target: 'jobEfficiency', multiplier: 0.08,
    category: 'Business', prerequisites: ['b_workforce'],
  },
  {
    id: 'b_lean', name: 'Lean Manufacturing', row: 5, col: 1,
    description: 'Eliminate waste in every production step.',
    effectDescription: '-3% operating costs', icon: 'mdi:factory',
    cost: D(300_000), target: 'costReduction', multiplier: -0.03,
    category: 'Business', prerequisites: ['b_supply'],
  },
  {
    id: 'b_influencer', name: 'Influencer Network', row: 5, col: 3,
    description: 'An army of influencers promoting your brand.',
    effectDescription: '+4% customer attraction', icon: 'mdi:account-voice',
    cost: D(350_000), target: 'customerAttraction', multiplier: 0.04,
    category: 'Business', prerequisites: ['b_digimkt', 'b_franchise'],
  },
  {
    id: 'b_franempire', name: 'Franchise Empire', row: 5, col: 4,
    description: 'Hundreds of franchise locations worldwide.',
    effectDescription: '+3% business revenue', icon: 'mdi:map-marker-multiple',
    cost: D(300_000), target: 'businessRevenue', multiplier: 0.03,
    category: 'Business', prerequisites: ['b_franchise', 'b_outsource'],
  },

  // ═══ ROW 6 ═════════════════════════════════════════════════════
  {
    id: 'b_hr', name: 'HR Department', row: 6, col: 0,
    description: 'Professional hiring and talent management.',
    effectDescription: '+8% job efficiency', icon: 'mdi:badge-account',
    cost: D(800_000), target: 'jobEfficiency', multiplier: 0.08,
    category: 'Business', prerequisites: ['b_teamlead'],
  },
  {
    id: 'b_assembly', name: 'Assembly Line', row: 6, col: 1,
    description: 'Mass production with maximum efficiency.',
    effectDescription: '-3% operating costs', icon: 'mdi:robot-industrial',
    cost: D(1_000_000), target: 'costReduction', multiplier: -0.03,
    category: 'Business', prerequisites: ['b_lean'],
  },
  {
    id: 'b_viral', name: 'Viral Campaigns', row: 6, col: 2,
    description: 'Your content goes viral every time.',
    effectDescription: '+5% customer attraction', icon: 'mdi:fire',
    cost: D(1_200_000), target: 'customerAttraction', multiplier: 0.05,
    category: 'Business', prerequisites: ['b_lean', 'b_influencer'],
  },
  {
    id: 'b_logistics', name: 'Logistics Hub', row: 6, col: 3,
    description: 'Central logistics hub for global distribution.',
    effectDescription: '+3% business revenue', icon: 'mdi:warehouse',
    cost: D(900_000), target: 'businessRevenue', multiplier: 0.03,
    category: 'Business', prerequisites: ['b_influencer'],
  },
  {
    id: 'b_taxopt', name: 'Tax Optimization', row: 6, col: 4,
    description: 'Aggressive but legal fiscal engineering.',
    effectDescription: '-3% operating costs', icon: 'mdi:calculator',
    cost: D(1_000_000), target: 'costReduction', multiplier: -0.03,
    category: 'Business', prerequisites: ['b_franempire'],
  },

  // ═══ ROW 7 ═════════════════════════════════════════════════════
  {
    id: 'b_talent', name: 'Talent Academy', row: 7, col: 0,
    description: 'Train the best employees in the industry.',
    effectDescription: '+9% job efficiency', icon: 'mdi:school',
    cost: D(2_500_000), target: 'jobEfficiency', multiplier: 0.09,
    category: 'Business', prerequisites: ['b_hr'],
  },
  {
    id: 'b_massprod', name: 'Mass Production', row: 7, col: 1,
    description: 'Scale production to meet infinite demand.',
    effectDescription: '+4% business revenue', icon: 'mdi:package-variant-closed',
    cost: D(3_000_000), target: 'businessRevenue', multiplier: 0.04,
    category: 'Business', prerequisites: ['b_assembly'],
  },
  {
    id: 'b_celeb', name: 'Celebrity Endorsement', row: 7, col: 3,
    description: 'A-list celebrities represent your brand.',
    effectDescription: '+5% customer attraction', icon: 'mdi:star-face',
    cost: D(3_500_000), target: 'customerAttraction', multiplier: 0.05,
    category: 'Business', prerequisites: ['b_viral', 'b_logistics'],
  },
  {
    id: 'b_globallog', name: 'Global Logistics', row: 7, col: 4,
    description: 'Same-day delivery to every corner of the world.',
    effectDescription: '+4% business revenue', icon: 'mdi:airplane',
    cost: D(3_000_000), target: 'businessRevenue', multiplier: 0.04,
    category: 'Business', prerequisites: ['b_logistics', 'b_taxopt'],
  },

  // ═══ ROW 8 — Convergence ═══════════════════════════════════════
  {
    id: 'b_corporate', name: 'Corporate Structure', row: 8, col: 1,
    description: 'A fully integrated corporate machine.',
    effectDescription: '+6% business revenue', icon: 'mdi:office-building',
    cost: D(10_000_000), target: 'businessRevenue', multiplier: 0.06,
    category: 'Business', prerequisites: ['b_talent', 'b_massprod'],
  },
  {
    id: 'b_mktempire', name: 'Marketing Empire', row: 8, col: 2,
    description: 'Your marketing machine is self-sustaining.',
    effectDescription: '+8% customer attraction', icon: 'mdi:television',
    cost: D(12_000_000), target: 'customerAttraction', multiplier: 0.08,
    category: 'Business', prerequisites: ['b_massprod', 'b_celeb'],
  },
  {
    id: 'b_distnet', name: 'Distribution Network', row: 8, col: 3,
    description: 'Unrivalled distribution across all channels.',
    effectDescription: '-6% operating costs', icon: 'mdi:sitemap',
    cost: D(10_000_000), target: 'costReduction', multiplier: -0.06,
    category: 'Business', prerequisites: ['b_celeb', 'b_globallog'],
  },

  // ═══ ROW 9 ═════════════════════════════════════════════════════
  {
    id: 'b_csuite', name: 'C-Suite Team', row: 9, col: 0,
    description: 'Recruit world-class executives.',
    effectDescription: '+10% job efficiency', icon: 'mdi:briefcase',
    cost: D(30_000_000), target: 'jobEfficiency', multiplier: 0.10,
    category: 'Business', prerequisites: ['b_corporate'],
  },
  {
    id: 'b_rnd', name: 'R&D Division', row: 9, col: 1,
    description: 'Invest heavily in research and development.',
    effectDescription: '+4% business revenue', icon: 'mdi:flask',
    cost: D(35_000_000), target: 'businessRevenue', multiplier: 0.04,
    category: 'Business', prerequisites: ['b_corporate'],
  },
  {
    id: 'b_adagency', name: 'Ad Agency', row: 9, col: 3,
    description: 'Your own ad agency runs award-winning campaigns.',
    effectDescription: '+6% customer attraction', icon: 'mdi:billboard',
    cost: D(35_000_000), target: 'customerAttraction', multiplier: 0.06,
    category: 'Business', prerequisites: ['b_mktempire'],
  },
  {
    id: 'b_globalsup', name: 'Global Supply Chain', row: 9, col: 4,
    description: 'A supply network spanning every continent.',
    effectDescription: '-4% operating costs', icon: 'mdi:earth-arrow-right',
    cost: D(30_000_000), target: 'costReduction', multiplier: -0.04,
    category: 'Business', prerequisites: ['b_distnet'],
  },

  // ═══ ROW 10 ════════════════════════════════════════════════════
  {
    id: 'b_exec', name: 'Executive Board', row: 10, col: 0,
    description: 'A board of legendary business minds.',
    effectDescription: '+10% job efficiency', icon: 'mdi:account-tie',
    cost: D(100_000_000), target: 'jobEfficiency', multiplier: 0.10,
    category: 'Business', prerequisites: ['b_csuite'],
  },
  {
    id: 'b_innovation', name: 'Innovation Lab', row: 10, col: 1,
    description: 'Cutting-edge products disrupt every market.',
    effectDescription: '+4% business revenue', icon: 'mdi:lightbulb-on',
    cost: D(120_000_000), target: 'businessRevenue', multiplier: 0.04,
    category: 'Business', prerequisites: ['b_rnd'],
  },
  {
    id: 'b_mktdom', name: 'Market Dominance', row: 10, col: 2,
    description: 'You set the trends, everyone else follows.',
    effectDescription: '+6% customer attraction', icon: 'mdi:podium-gold',
    cost: D(150_000_000), target: 'customerAttraction', multiplier: 0.06,
    category: 'Business', prerequisites: ['b_rnd', 'b_adagency'],
  },
  {
    id: 'b_contentemp', name: 'Content Empire', row: 10, col: 3,
    description: 'You own the media narrative.',
    effectDescription: '+6% customer attraction', icon: 'mdi:newspaper-variant',
    cost: D(100_000_000), target: 'customerAttraction', multiplier: 0.06,
    category: 'Business', prerequisites: ['b_adagency'],
  },
  {
    id: 'b_traderoutes', name: 'Trade Routes', row: 10, col: 4,
    description: 'Exclusive trade agreements with every nation.',
    effectDescription: '+4% business revenue', icon: 'mdi:ferry',
    cost: D(100_000_000), target: 'businessRevenue', multiplier: 0.04,
    category: 'Business', prerequisites: ['b_globalsup'],
  },

  // ═══ ROW 11 ════════════════════════════════════════════════════
  {
    id: 'b_board', name: 'Board of Directors', row: 11, col: 0,
    description: 'The most powerful board in corporate history.',
    effectDescription: '+11% job efficiency', icon: 'mdi:gavel',
    cost: D(300_000_000), target: 'jobEfficiency', multiplier: 0.11,
    category: 'Business', prerequisites: ['b_exec'],
  },
  {
    id: 'b_patents', name: 'Patent Portfolio', row: 11, col: 1,
    description: 'Thousands of patents generate licensing income.',
    effectDescription: '+5% business revenue', icon: 'mdi:certificate',
    cost: D(350_000_000), target: 'businessRevenue', multiplier: 0.05,
    category: 'Business', prerequisites: ['b_innovation'],
  },
  {
    id: 'b_culture', name: 'Cultural Impact', row: 11, col: 3,
    description: 'Your brand shapes global culture.',
    effectDescription: '+6% customer attraction', icon: 'mdi:palette',
    cost: D(350_000_000), target: 'customerAttraction', multiplier: 0.06,
    category: 'Business', prerequisites: ['b_mktdom', 'b_contentemp'],
  },
  {
    id: 'b_globtrade', name: 'Global Trade Network', row: 11, col: 4,
    description: 'Control the flow of goods across oceans.',
    effectDescription: '+5% business revenue', icon: 'mdi:web',
    cost: D(300_000_000), target: 'businessRevenue', multiplier: 0.05,
    category: 'Business', prerequisites: ['b_traderoutes'],
  },

  // ═══ ROW 12 — Convergence ══════════════════════════════════════
  {
    id: 'b_megacorp', name: 'Mega Corporation', row: 12, col: 1,
    description: 'Your empire rivals nations in power.',
    effectDescription: '+7% business revenue', icon: 'mdi:city-variant',
    cost: D(1e9), target: 'businessRevenue', multiplier: 0.07,
    category: 'Business', prerequisites: ['b_board', 'b_patents'],
  },
  {
    id: 'b_dynasty', name: 'Brand Dynasty', row: 12, col: 2,
    description: 'A brand dynasty that spans generations.',
    effectDescription: '+10% customer attraction', icon: 'mdi:shield-crown',
    cost: D(1.2e9), target: 'customerAttraction', multiplier: 0.10,
    category: 'Business', prerequisites: ['b_patents', 'b_culture'],
  },
  {
    id: 'b_monopoly', name: 'Market Monopoly', row: 12, col: 3,
    description: 'Total control over your industry.',
    effectDescription: '-7% operating costs', icon: 'mdi:lock',
    cost: D(1e9), target: 'costReduction', multiplier: -0.07,
    category: 'Business', prerequisites: ['b_culture', 'b_globtrade'],
  },

  // ═══ ROW 13 ════════════════════════════════════════════════════
  {
    id: 'b_titan', name: 'Corporate Titan', row: 13, col: 0,
    description: 'A titan whose decisions shape the economy.',
    effectDescription: '+5% business revenue', icon: 'mdi:chess-king',
    cost: D(5e9), target: 'businessRevenue', multiplier: 0.05,
    category: 'Business', prerequisites: ['b_megacorp'],
  },
  {
    id: 'b_futuretech', name: 'Future Technology', row: 13, col: 1,
    description: 'Invest in technology that hasn\'t been invented yet.',
    effectDescription: '+3% all income', icon: 'mdi:chip',
    cost: D(4e9), target: 'allIncome', multiplier: 0.03,
    category: 'Business', prerequisites: ['b_megacorp'],
  },
  {
    id: 'b_mindshare', name: 'Mind Share', row: 13, col: 3,
    description: 'Your brand lives rent-free in every mind.',
    effectDescription: '+7% customer attraction', icon: 'mdi:brain',
    cost: D(6e9), target: 'customerAttraction', multiplier: 0.07,
    category: 'Business', prerequisites: ['b_dynasty'],
  },
  {
    id: 'b_worldcom', name: 'World Commerce', row: 13, col: 4,
    description: 'You control a significant share of world trade.',
    effectDescription: '+5% business revenue', icon: 'mdi:earth',
    cost: D(5e9), target: 'businessRevenue', multiplier: 0.05,
    category: 'Business', prerequisites: ['b_monopoly'],
  },

  // ═══ ROW 14 ════════════════════════════════════════════════════
  {
    id: 'b_indleader', name: 'Industry Leader', row: 14, col: 0,
    description: 'Every industry looks to you for direction.',
    effectDescription: '+5% business revenue', icon: 'mdi:trophy',
    cost: D(25e9), target: 'businessRevenue', multiplier: 0.05,
    category: 'Business', prerequisites: ['b_titan'],
  },
  {
    id: 'b_aiops', name: 'AI Operations', row: 14, col: 1,
    description: 'AI runs your operations with superhuman precision.',
    effectDescription: '-5% operating costs', icon: 'mdi:robot',
    cost: D(20e9), target: 'costReduction', multiplier: -0.05,
    category: 'Business', prerequisites: ['b_futuretech'],
  },
  {
    id: 'b_brandrelig', name: 'Brand Religion', row: 14, col: 2,
    description: 'Customers worship your brand like a religion.',
    effectDescription: '+7% customer attraction', icon: 'mdi:hands-pray',
    cost: D(30e9), target: 'customerAttraction', multiplier: 0.07,
    category: 'Business', prerequisites: ['b_futuretech', 'b_mindshare'],
  },
  {
    id: 'b_climatemp', name: 'Climate Empire', row: 14, col: 3,
    description: 'Control the green economy revolution.',
    effectDescription: '+3% all income', icon: 'mdi:leaf',
    cost: D(22e9), target: 'allIncome', multiplier: 0.03,
    category: 'Business', prerequisites: ['b_mindshare'],
  },
  {
    id: 'b_spacemine', name: 'Space Mining', row: 14, col: 4,
    description: 'Asteroid mining provides unlimited resources.',
    effectDescription: '+5% business revenue', icon: 'mdi:rocket-launch',
    cost: D(25e9), target: 'businessRevenue', multiplier: 0.05,
    category: 'Business', prerequisites: ['b_worldcom'],
  },

  // ═══ ROW 15 ════════════════════════════════════════════════════
  {
    id: 'b_econinfl', name: 'Economic Influence', row: 15, col: 0,
    description: 'Governments consult you on fiscal policy.',
    effectDescription: '+6% business revenue', icon: 'mdi:bank',
    cost: D(100e9), target: 'businessRevenue', multiplier: 0.06,
    category: 'Business', prerequisites: ['b_indleader'],
  },
  {
    id: 'b_quantum', name: 'Quantum Computing', row: 15, col: 1,
    description: 'Quantum-powered logistics optimise everything.',
    effectDescription: '+3% all income', icon: 'mdi:atom',
    cost: D(80e9), target: 'allIncome', multiplier: 0.03,
    category: 'Business', prerequisites: ['b_aiops'],
  },
  {
    id: 'b_planetbrand', name: 'Planetary Brand', row: 15, col: 3,
    description: 'Your brand is recognised on other continents of thought.',
    effectDescription: '+7% customer attraction', icon: 'mdi:earth-plus',
    cost: D(120e9), target: 'customerAttraction', multiplier: 0.07,
    category: 'Business', prerequisites: ['b_brandrelig', 'b_climatemp'],
  },
  {
    id: 'b_galactrade', name: 'Galactic Trade', row: 15, col: 4,
    description: 'Trade routes extending beyond your planet.',
    effectDescription: '+6% business revenue', icon: 'mdi:ufo',
    cost: D(100e9), target: 'businessRevenue', multiplier: 0.06,
    category: 'Business', prerequisites: ['b_spacemine'],
  },

  // ═══ ROW 16 — Convergence ══════════════════════════════════════
  {
    id: 'b_worlddom', name: 'World Dominator', row: 16, col: 1,
    description: 'Your corporation IS the economy.',
    effectDescription: '+9% business revenue', icon: 'mdi:shield-star',
    cost: D(500e9), target: 'businessRevenue', multiplier: 0.09,
    category: 'Business', prerequisites: ['b_econinfl', 'b_quantum'],
  },
  {
    id: 'b_singular', name: 'Techno-Singularity', row: 16, col: 2,
    description: 'Your technology achieves self-improvement loops.',
    effectDescription: '+4% all income', icon: 'mdi:infinity',
    cost: D(600e9), target: 'allIncome', multiplier: 0.04,
    category: 'Business', prerequisites: ['b_quantum', 'b_planetbrand'],
  },
  {
    id: 'b_univbrand', name: 'Universal Brand', row: 16, col: 3,
    description: 'A brand that transcends space and time.',
    effectDescription: '+12% customer attraction', icon: 'mdi:star-shooting',
    cost: D(500e9), target: 'customerAttraction', multiplier: 0.12,
    category: 'Business', prerequisites: ['b_planetbrand', 'b_galactrade'],
  },

  // ═══ ROW 17 — Capstone ═════════════════════════════════════════
  {
    id: 'b_omni', name: 'Omniscient CEO', row: 17, col: 1,
    description: 'You know everything, everywhere, all at once.',
    effectDescription: '+6% all income', icon: 'mdi:eye-circle',
    cost: D(5e12), target: 'allIncome', multiplier: 0.06,
    category: 'Business', prerequisites: ['b_worlddom', 'b_singular'],
  },
  {
    id: 'b_infinite', name: 'Infinite Enterprise', row: 17, col: 3,
    description: 'A business that generates infinite value.',
    effectDescription: '+12% business revenue', icon: 'mdi:all-inclusive',
    cost: D(5e12), target: 'businessRevenue', multiplier: 0.12,
    category: 'Business', prerequisites: ['b_singular', 'b_univbrand'],
  },
]
