import { D } from '@renderer/core/BigNum'
import type { UpgradeDef } from '@renderer/data/upgrades'

/**
 * Empire Skill Tree — 75 nodes
 *
 * LEFT path:   XP & Learning
 * CENTER path: Income & Growth
 * RIGHT path:  Offline & Automation
 *
 * Convergence milestones at rows 8, 12, 16.
 */
export const EMPIRE_SKILLS: UpgradeDef[] = [
  // ═══ ROW 0 — Root ══════════════════════════════════════════════
  {
    id: 'e_root', name: 'Empire Foundation', row: 0, col: 2,
    description: 'Lay the groundwork for a vast empire.',
    effectDescription: '+1% all income', icon: 'mdi:flag',
    cost: D(10_000), target: 'allIncome', multiplier: 0.01,
    category: 'Empire', prerequisites: [],
  },

  // ═══ ROW 1 ═════════════════════════════════════════════════════
  {
    id: 'e_study', name: 'Speed Reader', row: 1, col: 1,
    description: 'Absorb knowledge at superhuman speed.',
    effectDescription: '+3% XP gain', icon: 'mdi:book-open-variant',
    cost: D(25_000), target: 'xpGain', multiplier: 0.03,
    category: 'Empire', prerequisites: ['e_root'],
  },
  {
    id: 'e_idle', name: 'Passive Income', row: 1, col: 3,
    description: 'Money flows even while you sleep.',
    effectDescription: '+3% offline efficiency', icon: 'mdi:sleep',
    cost: D(30_000), target: 'offlineEfficiency', multiplier: 0.03,
    category: 'Empire', prerequisites: ['e_root'],
  },

  // ═══ ROW 2 ═════════════════════════════════════════════════════
  {
    id: 'e_mentor', name: 'Find a Mentor', row: 2, col: 0,
    description: 'Learn from the best in the business.',
    effectDescription: '+4% XP gain', icon: 'mdi:account-supervisor',
    cost: D(60_000), target: 'xpGain', multiplier: 0.04,
    category: 'Empire', prerequisites: ['e_study'],
  },
  {
    id: 'e_stream', name: 'Revenue Streams', row: 2, col: 2,
    description: 'Diversify your income sources.',
    effectDescription: '+1% all income', icon: 'mdi:source-fork',
    cost: D(75_000), target: 'allIncome', multiplier: 0.01,
    category: 'Empire', prerequisites: ['e_root'],
  },
  {
    id: 'e_auto1', name: 'Basic Automation', row: 2, col: 4,
    description: 'Automate routine tasks with scripts.',
    effectDescription: '+4% offline efficiency', icon: 'mdi:cog-play',
    cost: D(60_000), target: 'offlineEfficiency', multiplier: 0.04,
    category: 'Empire', prerequisites: ['e_idle'],
  },

  // ═══ ROW 3 ═════════════════════════════════════════════════════
  {
    id: 'e_courses', name: 'Online Courses', row: 3, col: 0,
    description: 'Master everything through online learning.',
    effectDescription: '+4% XP gain', icon: 'mdi:school',
    cost: D(180_000), target: 'xpGain', multiplier: 0.04,
    category: 'Empire', prerequisites: ['e_mentor'],
  },
  {
    id: 'e_mgmt', name: 'Management Skills', row: 3, col: 1,
    description: 'Lead teams with confidence and vision.',
    effectDescription: '+1% all income', icon: 'mdi:account-tie',
    cost: D(200_000), target: 'allIncome', multiplier: 0.01,
    category: 'Empire', prerequisites: ['e_study', 'e_stream'],
  },
  {
    id: 'e_scaling', name: 'Scaling Systems', row: 3, col: 3,
    description: 'Systems that grow without breaking.',
    effectDescription: '-3% operating costs', icon: 'mdi:arrow-expand-all',
    cost: D(220_000), target: 'costReduction', multiplier: -0.03,
    category: 'Empire', prerequisites: ['e_stream', 'e_idle'],
  },
  {
    id: 'e_bots', name: 'Bot Workers', row: 3, col: 4,
    description: 'Simple bots handle repetitive work.',
    effectDescription: '+4% offline efficiency', icon: 'mdi:robot-outline',
    cost: D(180_000), target: 'offlineEfficiency', multiplier: 0.04,
    category: 'Empire', prerequisites: ['e_auto1'],
  },

  // ═══ ROW 4 ═════════════════════════════════════════════════════
  {
    id: 'e_phd', name: 'PhD Research', row: 4, col: 0,
    description: 'Doctoral-level expertise in business science.',
    effectDescription: '+4% XP gain', icon: 'mdi:certificate',
    cost: D(500_000), target: 'xpGain', multiplier: 0.04,
    category: 'Empire', prerequisites: ['e_courses'],
  },
  {
    id: 'e_delegate', name: 'Delegation', row: 4, col: 1,
    description: 'Delegate effectively and focus on strategy.',
    effectDescription: '+1% all income', icon: 'mdi:account-arrow-right',
    cost: D(600_000), target: 'allIncome', multiplier: 0.01,
    category: 'Empire', prerequisites: ['e_mgmt'],
  },
  {
    id: 'e_synergy', name: 'Synergy', row: 4, col: 2,
    description: 'All your ventures amplify each other.',
    effectDescription: '+3% business revenue', icon: 'mdi:link-variant',
    cost: D(700_000), target: 'businessRevenue', multiplier: 0.03,
    category: 'Empire', prerequisites: ['e_mgmt', 'e_scaling'],
  },
  {
    id: 'e_pipeline', name: 'Data Pipeline', row: 4, col: 3,
    description: 'Real-time data flows power all decisions.',
    effectDescription: '-3% operating costs', icon: 'mdi:pipe',
    cost: D(550_000), target: 'costReduction', multiplier: -0.03,
    category: 'Empire', prerequisites: ['e_scaling'],
  },
  {
    id: 'e_cronos', name: 'Cron Scheduler', row: 4, col: 4,
    description: 'Automated tasks run on perfect schedules.',
    effectDescription: '+4% offline efficiency', icon: 'mdi:timer-cog',
    cost: D(500_000), target: 'offlineEfficiency', multiplier: 0.04,
    category: 'Empire', prerequisites: ['e_bots'],
  },

  // ═══ ROW 5 ═════════════════════════════════════════════════════
  {
    id: 'e_think', name: 'Think Tank', row: 5, col: 0,
    description: 'Assemble the brightest minds to solve problems.',
    effectDescription: '+4% XP gain', icon: 'mdi:head-lightbulb-outline',
    cost: D(1_500_000), target: 'xpGain', multiplier: 0.04,
    category: 'Empire', prerequisites: ['e_phd'],
  },
  {
    id: 'e_kpi', name: 'KPI Mastery', row: 5, col: 1,
    description: 'Track and optimise every key metric.',
    effectDescription: '+2% all income', icon: 'mdi:chart-box',
    cost: D(1_800_000), target: 'allIncome', multiplier: 0.02,
    category: 'Empire', prerequisites: ['e_delegate'],
  },
  {
    id: 'e_cloud', name: 'Cloud Infrastructure', row: 5, col: 3,
    description: 'Scale compute resources on demand.',
    effectDescription: '-3% operating costs', icon: 'mdi:cloud',
    cost: D(1_800_000), target: 'costReduction', multiplier: -0.03,
    category: 'Empire', prerequisites: ['e_pipeline', 'e_cronos'],
  },
  {
    id: 'e_mlbot', name: 'ML Workers', row: 5, col: 4,
    description: 'Machine-learning bots learn and adapt.',
    effectDescription: '+5% offline efficiency', icon: 'mdi:robot',
    cost: D(1_500_000), target: 'offlineEfficiency', multiplier: 0.05,
    category: 'Empire', prerequisites: ['e_cronos'],
  },

  // ═══ ROW 6 ═════════════════════════════════════════════════════
  {
    id: 'e_lab', name: 'Research Lab', row: 6, col: 0,
    description: 'A private lab pushing the boundaries of knowledge.',
    effectDescription: '+5% XP gain', icon: 'mdi:flask',
    cost: D(5_000_000), target: 'xpGain', multiplier: 0.05,
    category: 'Empire', prerequisites: ['e_think'],
  },
  {
    id: 'e_holding', name: 'Holding Company', row: 6, col: 1,
    description: 'An umbrella entity managing all subsidiaries.',
    effectDescription: '+2% all income', icon: 'mdi:domain',
    cost: D(6_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Empire', prerequisites: ['e_kpi'],
  },
  {
    id: 'e_erp', name: 'Enterprise ERP', row: 6, col: 2,
    description: 'Integrate every department via unified ERP.',
    effectDescription: '+3% business revenue', icon: 'mdi:sitemap',
    cost: D(7_000_000), target: 'businessRevenue', multiplier: 0.03,
    category: 'Empire', prerequisites: ['e_kpi', 'e_cloud'],
  },
  {
    id: 'e_neural', name: 'Neural Nets', row: 6, col: 3,
    description: 'Deep neural networks manage operations.',
    effectDescription: '-3% operating costs', icon: 'mdi:brain',
    cost: D(5_500_000), target: 'costReduction', multiplier: -0.03,
    category: 'Empire', prerequisites: ['e_cloud'],
  },
  {
    id: 'e_swarm', name: 'Bot Swarm', row: 6, col: 4,
    description: 'Thousands of bots working in coordination.',
    effectDescription: '+5% offline efficiency', icon: 'mdi:bee',
    cost: D(5_000_000), target: 'offlineEfficiency', multiplier: 0.05,
    category: 'Empire', prerequisites: ['e_mlbot'],
  },

  // ═══ ROW 7 ═════════════════════════════════════════════════════
  {
    id: 'e_academy', name: 'Private Academy', row: 7, col: 0,
    description: 'Your own academy producing elite graduates.',
    effectDescription: '+5% XP gain', icon: 'mdi:school-outline',
    cost: D(15_000_000), target: 'xpGain', multiplier: 0.05,
    category: 'Empire', prerequisites: ['e_lab'],
  },
  {
    id: 'e_global', name: 'Global Operations', row: 7, col: 1,
    description: 'Operate simultaneously on every continent.',
    effectDescription: '+2% all income', icon: 'mdi:earth',
    cost: D(18_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Empire', prerequisites: ['e_holding'],
  },
  {
    id: 'e_aicore', name: 'AI Core', row: 7, col: 3,
    description: 'A central AI manages your entire empire.',
    effectDescription: '-4% operating costs', icon: 'mdi:chip',
    cost: D(18_000_000), target: 'costReduction', multiplier: -0.04,
    category: 'Empire', prerequisites: ['e_erp', 'e_neural'],
  },
  {
    id: 'e_selfrepair', name: 'Self-Repairing Systems', row: 7, col: 4,
    description: 'Systems that fix themselves before breaking.',
    effectDescription: '+5% offline efficiency', icon: 'mdi:auto-fix',
    cost: D(15_000_000), target: 'offlineEfficiency', multiplier: 0.05,
    category: 'Empire', prerequisites: ['e_swarm'],
  },

  // ═══ ROW 8 — Convergence ═══════════════════════════════════════
  {
    id: 'e_instit', name: 'Research Institute', row: 8, col: 1,
    description: 'A world-class institute advancing human knowledge.',
    effectDescription: '+8% XP gain', icon: 'mdi:bank',
    cost: D(50_000_000), target: 'xpGain', multiplier: 0.08,
    category: 'Empire', prerequisites: ['e_academy', 'e_global'],
  },
  {
    id: 'e_conglom', name: 'Conglomerate', row: 8, col: 2,
    description: 'A conglomerate with tentacles in every industry.',
    effectDescription: '+3% all income', icon: 'mdi:octagram',
    cost: D(60_000_000), target: 'allIncome', multiplier: 0.03,
    category: 'Empire', prerequisites: ['e_global', 'e_aicore'],
  },
  {
    id: 'e_autonomy', name: 'Full Autonomy', row: 8, col: 3,
    description: 'Your empire runs itself without any input.',
    effectDescription: '+9% offline efficiency', icon: 'mdi:steering',
    cost: D(50_000_000), target: 'offlineEfficiency', multiplier: 0.09,
    category: 'Empire', prerequisites: ['e_aicore', 'e_selfrepair'],
  },

  // ═══ ROW 9 ═════════════════════════════════════════════════════
  {
    id: 'e_genius', name: 'Genius Network', row: 9, col: 0,
    description: 'A network of geniuses solving impossible problems.',
    effectDescription: '+6% XP gain', icon: 'mdi:account-group',
    cost: D(150_000_000), target: 'xpGain', multiplier: 0.06,
    category: 'Empire', prerequisites: ['e_instit'],
  },
  {
    id: 'e_multinat', name: 'Multinational Power', row: 9, col: 1,
    description: 'Influence that transcends national borders.',
    effectDescription: '+2% all income', icon: 'mdi:flag-variant',
    cost: D(180_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Empire', prerequisites: ['e_instit'],
  },
  {
    id: 'e_quantum', name: 'Quantum Automation', row: 9, col: 3,
    description: 'Quantum computers automate at light speed.',
    effectDescription: '+6% offline efficiency', icon: 'mdi:atom-variant',
    cost: D(180_000_000), target: 'offlineEfficiency', multiplier: 0.06,
    category: 'Empire', prerequisites: ['e_autonomy'],
  },
  {
    id: 'e_nanobot', name: 'Nanobots', row: 9, col: 4,
    description: 'Microscopic robots maintaining every process.',
    effectDescription: '-4% operating costs', icon: 'mdi:eyedropper',
    cost: D(150_000_000), target: 'costReduction', multiplier: -0.04,
    category: 'Empire', prerequisites: ['e_autonomy'],
  },

  // ═══ ROW 10 ════════════════════════════════════════════════════
  {
    id: 'e_noosphere', name: 'Noosphere Access', row: 10, col: 0,
    description: 'Tap into collective human consciousness.',
    effectDescription: '+6% XP gain', icon: 'mdi:head-dots-horizontal',
    cost: D(500_000_000), target: 'xpGain', multiplier: 0.06,
    category: 'Empire', prerequisites: ['e_genius'],
  },
  {
    id: 'e_govinflu', name: 'Government Influence', row: 10, col: 1,
    description: 'Shape policy at the highest levels.',
    effectDescription: '+2% all income', icon: 'mdi:gavel',
    cost: D(600_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Empire', prerequisites: ['e_multinat'],
  },
  {
    id: 'e_megaai', name: 'Mega AI', row: 10, col: 2,
    description: 'An AI smarter than all of humanity combined.',
    effectDescription: '+4% business revenue', icon: 'mdi:memory',
    cost: D(700_000_000), target: 'businessRevenue', multiplier: 0.04,
    category: 'Empire', prerequisites: ['e_multinat', 'e_quantum'],
  },
  {
    id: 'e_dyson', name: 'Dyson Swarm', row: 10, col: 3,
    description: 'Harvest stellar energy for infinite computation.',
    effectDescription: '+7% offline efficiency', icon: 'mdi:white-balance-sunny',
    cost: D(600_000_000), target: 'offlineEfficiency', multiplier: 0.07,
    category: 'Empire', prerequisites: ['e_quantum'],
  },
  {
    id: 'e_vonneumann', name: 'Von Neumann Probes', row: 10, col: 4,
    description: 'Self-replicating probes colonise for you.',
    effectDescription: '-4% operating costs', icon: 'mdi:rocket',
    cost: D(500_000_000), target: 'costReduction', multiplier: -0.04,
    category: 'Empire', prerequisites: ['e_nanobot'],
  },

  // ═══ ROW 11 ════════════════════════════════════════════════════
  {
    id: 'e_omniscience', name: 'Omniscient Learning', row: 11, col: 0,
    description: 'Know everything there is to know.',
    effectDescription: '+6% XP gain', icon: 'mdi:eye-plus',
    cost: D(1.5e9), target: 'xpGain', multiplier: 0.06,
    category: 'Empire', prerequisites: ['e_noosphere'],
  },
  {
    id: 'e_shadow', name: 'Shadow Government', row: 11, col: 1,
    description: 'Pull the strings behind every government.',
    effectDescription: '+2% all income', icon: 'mdi:incognito',
    cost: D(2e9), target: 'allIncome', multiplier: 0.02,
    category: 'Empire', prerequisites: ['e_govinflu'],
  },
  {
    id: 'e_matrioshka', name: 'Matrioshka Brain', row: 11, col: 3,
    description: 'A computing megastructure around a star.',
    effectDescription: '+7% offline efficiency', icon: 'mdi:sun-wireless',
    cost: D(2e9), target: 'offlineEfficiency', multiplier: 0.07,
    category: 'Empire', prerequisites: ['e_megaai', 'e_dyson'],
  },
  {
    id: 'e_replicator', name: 'Replicator Tech', row: 11, col: 4,
    description: 'Create anything from raw atoms.',
    effectDescription: '-5% operating costs', icon: 'mdi:cube-unfolded',
    cost: D(1.5e9), target: 'costReduction', multiplier: -0.05,
    category: 'Empire', prerequisites: ['e_vonneumann'],
  },

  // ═══ ROW 12 — Convergence ══════════════════════════════════════
  {
    id: 'e_illumin', name: 'Illuminated Mind', row: 12, col: 1,
    description: 'Transcend the limits of human cognition.',
    effectDescription: '+10% XP gain', icon: 'mdi:lightbulb-group',
    cost: D(8e9), target: 'xpGain', multiplier: 0.10,
    category: 'Empire', prerequisites: ['e_omniscience', 'e_shadow'],
  },
  {
    id: 'e_galaxyemp', name: 'Galaxy Empire', row: 12, col: 2,
    description: 'Your empire spans an entire galaxy.',
    effectDescription: '+4% all income', icon: 'mdi:blur',
    cost: D(10e9), target: 'allIncome', multiplier: 0.04,
    category: 'Empire', prerequisites: ['e_shadow', 'e_matrioshka'],
  },
  {
    id: 'e_perpetual', name: 'Perpetual Machine', row: 12, col: 3,
    description: 'Systems that never stop or slow down.',
    effectDescription: '+11% offline efficiency', icon: 'mdi:sync',
    cost: D(8e9), target: 'offlineEfficiency', multiplier: 0.11,
    category: 'Empire', prerequisites: ['e_matrioshka', 'e_replicator'],
  },

  // ═══ ROW 13 ════════════════════════════════════════════════════
  {
    id: 'e_akashic', name: 'Akashic Records', row: 13, col: 0,
    description: 'Access the cosmic library of all knowledge.',
    effectDescription: '+7% XP gain', icon: 'mdi:book-multiple',
    cost: D(30e9), target: 'xpGain', multiplier: 0.07,
    category: 'Empire', prerequisites: ['e_illumin'],
  },
  {
    id: 'e_galactic', name: 'Galactic Council', row: 13, col: 1,
    description: 'Lead an intergalactic governing body.',
    effectDescription: '+3% all income', icon: 'mdi:shield-star',
    cost: D(25e9), target: 'allIncome', multiplier: 0.03,
    category: 'Empire', prerequisites: ['e_illumin'],
  },
  {
    id: 'e_timewarp', name: 'Time Dilation', row: 13, col: 3,
    description: 'Accelerate time for your processes.',
    effectDescription: '+8% offline efficiency', icon: 'mdi:clock-fast',
    cost: D(35e9), target: 'offlineEfficiency', multiplier: 0.08,
    category: 'Empire', prerequisites: ['e_galaxyemp'],
  },
  {
    id: 'e_nanoforge', name: 'Nanoforge', row: 13, col: 4,
    description: 'Forge matter at the atomic level on demand.',
    effectDescription: '-5% operating costs', icon: 'mdi:anvil',
    cost: D(30e9), target: 'costReduction', multiplier: -0.05,
    category: 'Empire', prerequisites: ['e_perpetual'],
  },

  // ═══ ROW 14 ════════════════════════════════════════════════════
  {
    id: 'e_cosmiciq', name: 'Cosmic Intellect', row: 14, col: 0,
    description: 'An intellect spanning the observable universe.',
    effectDescription: '+7% XP gain', icon: 'mdi:star-four-points',
    cost: D(100e9), target: 'xpGain', multiplier: 0.07,
    category: 'Empire', prerequisites: ['e_akashic'],
  },
  {
    id: 'e_supercluster', name: 'Supercluster Dominion', row: 14, col: 1,
    description: 'Rule over a supercluster of galaxies.',
    effectDescription: '+3% all income', icon: 'mdi:hexagon-multiple',
    cost: D(80e9), target: 'allIncome', multiplier: 0.03,
    category: 'Empire', prerequisites: ['e_galactic'],
  },
  {
    id: 'e_omega', name: 'Omega Point', row: 14, col: 2,
    description: 'Computing power approaches the ultimate limit.',
    effectDescription: '+5% business revenue', icon: 'mdi:omega',
    cost: D(120e9), target: 'businessRevenue', multiplier: 0.05,
    category: 'Empire', prerequisites: ['e_galactic', 'e_timewarp'],
  },
  {
    id: 'e_temporal', name: 'Temporal Loops', row: 14, col: 3,
    description: 'Trap time in loops for infinite processing.',
    effectDescription: '+8% offline efficiency', icon: 'mdi:reload',
    cost: D(100e9), target: 'offlineEfficiency', multiplier: 0.08,
    category: 'Empire', prerequisites: ['e_timewarp'],
  },
  {
    id: 'e_zerocost', name: 'Zero-Point Energy', row: 14, col: 4,
    description: 'Harvest energy from the quantum vacuum.',
    effectDescription: '-5% operating costs', icon: 'mdi:lightning-bolt-circle',
    cost: D(100e9), target: 'costReduction', multiplier: -0.05,
    category: 'Empire', prerequisites: ['e_nanoforge'],
  },

  // ═══ ROW 15 ════════════════════════════════════════════════════
  {
    id: 'e_godmind', name: 'God-Mind', row: 15, col: 0,
    description: 'A mind that comprehends all of existence.',
    effectDescription: '+7% XP gain', icon: 'mdi:head-snowflake',
    cost: D(400e9), target: 'xpGain', multiplier: 0.07,
    category: 'Empire', prerequisites: ['e_cosmiciq'],
  },
  {
    id: 'e_universe', name: 'Universe Inc.', row: 15, col: 1,
    description: 'Your company IS the universe.',
    effectDescription: '+3% all income', icon: 'mdi:creation',
    cost: D(350e9), target: 'allIncome', multiplier: 0.03,
    category: 'Empire', prerequisites: ['e_supercluster'],
  },
  {
    id: 'e_chrono', name: 'Chronosphere', row: 15, col: 3,
    description: 'Complete mastery over the flow of time.',
    effectDescription: '+8% offline efficiency', icon: 'mdi:history',
    cost: D(450e9), target: 'offlineEfficiency', multiplier: 0.08,
    category: 'Empire', prerequisites: ['e_omega', 'e_temporal'],
  },
  {
    id: 'e_postcost', name: 'Post-Scarcity', row: 15, col: 4,
    description: 'Resources are infinite. Costs are meaningless.',
    effectDescription: '-6% operating costs', icon: 'mdi:infinity',
    cost: D(400e9), target: 'costReduction', multiplier: -0.06,
    category: 'Empire', prerequisites: ['e_zerocost'],
  },

  // ═══ ROW 16 — Convergence ══════════════════════════════════════
  {
    id: 'e_ascend', name: 'Ascended Intellect', row: 16, col: 1,
    description: 'Beyond genius, beyond comprehension.',
    effectDescription: '+12% XP gain', icon: 'mdi:arrow-up-bold-circle',
    cost: D(2e12), target: 'xpGain', multiplier: 0.12,
    category: 'Empire', prerequisites: ['e_godmind', 'e_universe'],
  },
  {
    id: 'e_multiverse', name: 'Multiverse Empire', row: 16, col: 2,
    description: 'Rule across infinite parallel realities.',
    effectDescription: '+4% all income', icon: 'mdi:transit-connection-variant',
    cost: D(2.5e12), target: 'allIncome', multiplier: 0.04,
    category: 'Empire', prerequisites: ['e_universe', 'e_chrono'],
  },
  {
    id: 'e_eternaleng', name: 'Eternal Engine', row: 16, col: 3,
    description: 'An engine running since the Big Bang.',
    effectDescription: '+13% offline efficiency', icon: 'mdi:engine',
    cost: D(2e12), target: 'offlineEfficiency', multiplier: 0.13,
    category: 'Empire', prerequisites: ['e_chrono', 'e_postcost'],
  },

  // ═══ ROW 17 — Capstone ═════════════════════════════════════════
  {
    id: 'e_architect', name: 'Reality Architect', row: 17, col: 1,
    description: 'Design and reshape reality at will.',
    effectDescription: '+6% all income', icon: 'mdi:compass-rose',
    cost: D(20e12), target: 'allIncome', multiplier: 0.06,
    category: 'Empire', prerequisites: ['e_ascend', 'e_multiverse'],
  },
  {
    id: 'e_perpetuum', name: 'Perpetuum Mobile', row: 17, col: 3,
    description: 'Infinite energy, infinite automation, infinite growth.',
    effectDescription: '+18% offline efficiency', icon: 'mdi:all-inclusive',
    cost: D(20e12), target: 'offlineEfficiency', multiplier: 0.18,
    category: 'Empire', prerequisites: ['e_multiverse', 'e_eternaleng'],
  },
]
