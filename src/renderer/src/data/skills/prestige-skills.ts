import { D } from '@renderer/core/BigNum'
import type { UpgradeDef } from '@renderer/data/upgrades'

/**
 * Prestige Skill Tree — 65 nodes
 *
 * LEFT path:   Prestige Gain & Acceleration
 * CENTER path: Memory & Permanence
 * RIGHT path:  Evolution & Ascension
 *
 * Highest costs in the game — true late-game Avaritia scaling.
 * Convergence milestones at rows 8, 12, 16.
 */
export const PRESTIGE_SKILLS: UpgradeDef[] = [
  // ═══ ROW 0 — Root ══════════════════════════════════════════════
  {
    id: 'p_root', name: 'First Rebirth', row: 0, col: 2,
    description: 'The first step of an eternal cycle.',
    effectDescription: '+2% prestige gain', icon: 'mdi:reload',
    cost: D(1_000_000), target: 'prestigeGain', multiplier: 0.02,
    category: 'Prestige', prerequisites: [],
  },

  // ═══ ROW 1 ═════════════════════════════════════════════════════
  {
    id: 'p_echo', name: 'Echoes of Wealth', row: 1, col: 1,
    description: 'Faint memories of past riches linger.',
    effectDescription: '+2% prestige gain', icon: 'mdi:wave',
    cost: D(3_000_000), target: 'prestigeGain', multiplier: 0.02,
    category: 'Prestige', prerequisites: ['p_root'],
  },
  {
    id: 'p_instinct2', name: 'Inherited Instincts', row: 1, col: 3,
    description: 'Business sense carried from past lives.',
    effectDescription: '+1% all income', icon: 'mdi:dna',
    cost: D(3_500_000), target: 'allIncome', multiplier: 0.01,
    category: 'Prestige', prerequisites: ['p_root'],
  },

  // ═══ ROW 2 ═════════════════════════════════════════════════════
  {
    id: 'p_momentum', name: 'Rebirth Momentum', row: 2, col: 0,
    description: 'Each rebirth accelerates the next.',
    effectDescription: '+2% prestige gain', icon: 'mdi:speedometer',
    cost: D(8_000_000), target: 'prestigeGain', multiplier: 0.02,
    category: 'Prestige', prerequisites: ['p_echo'],
  },
  {
    id: 'p_memory', name: 'Muscle Memory', row: 2, col: 2,
    description: 'Your body remembers how to work efficiently.',
    effectDescription: '+4% XP gain', icon: 'mdi:arm-flex',
    cost: D(10_000_000), target: 'xpGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_root'],
  },
  {
    id: 'p_adapt', name: 'Adaptive Genes', row: 2, col: 4,
    description: 'Your DNA evolves with each cycle.',
    effectDescription: '+1% all income', icon: 'mdi:transfer',
    cost: D(8_000_000), target: 'allIncome', multiplier: 0.01,
    category: 'Prestige', prerequisites: ['p_instinct2'],
  },

  // ═══ ROW 3 ═════════════════════════════════════════════════════
  {
    id: 'p_cycle', name: 'Faster Cycles', row: 3, col: 0,
    description: 'Compress rebirth cycles for rapid prestige.',
    effectDescription: '+3% prestige gain', icon: 'mdi:fast-forward',
    cost: D(25_000_000), target: 'prestigeGain', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_momentum'],
  },
  {
    id: 'p_deja', name: 'Déjà Vu', row: 3, col: 1,
    description: 'You\'ve done this before — and better each time.',
    effectDescription: '+3% prestige gain', icon: 'mdi:eye-refresh',
    cost: D(30_000_000), target: 'prestigeGain', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_echo', 'p_memory'],
  },
  {
    id: 'p_retain', name: 'Knowledge Retention', row: 3, col: 3,
    description: 'Retain more knowledge between rebirths.',
    effectDescription: '+4% XP gain', icon: 'mdi:head-check',
    cost: D(30_000_000), target: 'xpGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_memory', 'p_instinct2'],
  },
  {
    id: 'p_evolve', name: 'Rapid Evolution', row: 3, col: 4,
    description: 'Evolve faster with each rebirth.',
    effectDescription: '+1% all income', icon: 'mdi:trending-up',
    cost: D(25_000_000), target: 'allIncome', multiplier: 0.01,
    category: 'Prestige', prerequisites: ['p_adapt'],
  },

  // ═══ ROW 4 ═════════════════════════════════════════════════════
  {
    id: 'p_accel', name: 'Prestige Accelerator', row: 4, col: 0,
    description: 'A feedback loop amplifying prestige gain.',
    effectDescription: '+3% prestige gain', icon: 'mdi:rocket-launch',
    cost: D(80_000_000), target: 'prestigeGain', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_cycle'],
  },
  {
    id: 'p_past', name: 'Past Life Mastery', row: 4, col: 1,
    description: 'Master skills from hundreds of past lives.',
    effectDescription: '+3% prestige gain', icon: 'mdi:account-convert',
    cost: D(100_000_000), target: 'prestigeGain', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_deja'],
  },
  {
    id: 'p_nexus', name: 'Rebirth Nexus', row: 4, col: 2,
    description: 'A convergence point where all lives connect.',
    effectDescription: '+3% prestige gain', icon: 'mdi:connection',
    cost: D(120_000_000), target: 'prestigeGain', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_deja', 'p_retain'],
  },
  {
    id: 'p_scholar', name: 'Eternal Scholar', row: 4, col: 3,
    description: 'An undying thirst for knowledge.',
    effectDescription: '+4% XP gain', icon: 'mdi:book-account',
    cost: D(90_000_000), target: 'xpGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_retain'],
  },
  {
    id: 'p_mutate', name: 'Beneficial Mutations', row: 4, col: 4,
    description: 'Each cycle grants beneficial mutations.',
    effectDescription: '+1% all income', icon: 'mdi:virus',
    cost: D(80_000_000), target: 'allIncome', multiplier: 0.01,
    category: 'Prestige', prerequisites: ['p_evolve'],
  },

  // ═══ ROW 5 ═════════════════════════════════════════════════════
  {
    id: 'p_loop', name: 'Time Loop', row: 5, col: 0,
    description: 'Trap yourself in a loop of infinite rebirths.',
    effectDescription: '+3% prestige gain', icon: 'mdi:restore',
    cost: D(250_000_000), target: 'prestigeGain', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_accel'],
  },
  {
    id: 'p_legacy', name: 'Legacy Builder', row: 5, col: 1,
    description: 'Build lasting legacies that persist across cycles.',
    effectDescription: '+3% prestige gain', icon: 'mdi:pillar',
    cost: D(300_000_000), target: 'prestigeGain', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_past'],
  },
  {
    id: 'p_sage', name: 'Ancient Sage', row: 5, col: 3,
    description: 'Wisdom accumulated across millennia of cycles.',
    effectDescription: '+4% XP gain', icon: 'mdi:account-star',
    cost: D(300_000_000), target: 'xpGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_nexus', 'p_scholar'],
  },
  {
    id: 'p_phoenix', name: 'Phoenix Rising', row: 5, col: 4,
    description: 'Rise stronger from every rebirth.',
    effectDescription: '+2% all income', icon: 'mdi:fire-circle',
    cost: D(250_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Prestige', prerequisites: ['p_mutate'],
  },

  // ═══ ROW 6 ═════════════════════════════════════════════════════
  {
    id: 'p_recursion', name: 'Recursion', row: 6, col: 0,
    description: 'Prestige within prestige within prestige.',
    effectDescription: '+3% prestige gain', icon: 'mdi:repeat-variant',
    cost: D(800_000_000), target: 'prestigeGain', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_loop'],
  },
  {
    id: 'p_imprint', name: 'Soul Imprint', row: 6, col: 1,
    description: 'Imprint your skills onto your very soul.',
    effectDescription: '+3% prestige gain', icon: 'mdi:fingerprint',
    cost: D(1e9), target: 'prestigeGain', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_legacy'],
  },
  {
    id: 'p_akashic', name: 'Akashic Memory', row: 6, col: 2,
    description: 'Access the cosmic record of all past lives.',
    effectDescription: '+5% XP gain', icon: 'mdi:cloud-download',
    cost: D(1.2e9), target: 'xpGain', multiplier: 0.05,
    category: 'Prestige', prerequisites: ['p_legacy', 'p_sage'],
  },
  {
    id: 'p_prophet', name: 'Profit Prophet', row: 6, col: 3,
    description: 'Predict market movements from past-life data.',
    effectDescription: '+2% all income', icon: 'mdi:crystal-ball',
    cost: D(900_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Prestige', prerequisites: ['p_sage'],
  },
  {
    id: 'p_hydra', name: 'Hydra Protocol', row: 6, col: 4,
    description: 'Cut one life, two more grow back.',
    effectDescription: '+3% prestige gain', icon: 'mdi:source-branch',
    cost: D(800_000_000), target: 'prestigeGain', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_phoenix'],
  },

  // ═══ ROW 7 ═════════════════════════════════════════════════════
  {
    id: 'p_spiral', name: 'Spiral Dynamics', row: 7, col: 0,
    description: 'Each cycle spirals higher than the last.',
    effectDescription: '+4% prestige gain', icon: 'mdi:rotate-3d-variant',
    cost: D(2.5e9), target: 'prestigeGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_recursion'],
  },
  {
    id: 'p_reincarn', name: 'True Reincarnation', row: 7, col: 1,
    description: 'Full conscious reincarnation between lives.',
    effectDescription: '+4% prestige gain', icon: 'mdi:autorenew',
    cost: D(3e9), target: 'prestigeGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_imprint'],
  },
  {
    id: 'p_codex', name: 'Eternity Codex', row: 7, col: 3,
    description: 'A codex containing wealth formulas across eons.',
    effectDescription: '+2% all income', icon: 'mdi:book-lock',
    cost: D(3e9), target: 'allIncome', multiplier: 0.02,
    category: 'Prestige', prerequisites: ['p_akashic', 'p_prophet'],
  },
  {
    id: 'p_ouroboros', name: 'Ouroboros', row: 7, col: 4,
    description: 'The serpent eats its tail — infinite rebirth.',
    effectDescription: '+4% prestige gain', icon: 'mdi:circle-outline',
    cost: D(2.5e9), target: 'prestigeGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_hydra'],
  },

  // ═══ ROW 8 — Convergence ═══════════════════════════════════════
  {
    id: 'p_singularity', name: 'Prestige Singularity', row: 8, col: 1,
    description: 'Prestige gains spiral into exponential growth.',
    effectDescription: '+6% prestige gain', icon: 'mdi:black-mesa',
    cost: D(10e9), target: 'prestigeGain', multiplier: 0.06,
    category: 'Prestige', prerequisites: ['p_spiral', 'p_reincarn'],
  },
  {
    id: 'p_eternal', name: 'Eternal Knowledge', row: 8, col: 2,
    description: 'Knowledge that persists through the heat death.',
    effectDescription: '+8% XP gain', icon: 'mdi:school-outline',
    cost: D(12e9), target: 'xpGain', multiplier: 0.08,
    category: 'Prestige', prerequisites: ['p_reincarn', 'p_codex'],
  },
  {
    id: 'p_rebirth', name: 'Omega Rebirth', row: 8, col: 3,
    description: 'The ultimate form of rebirth — reality resets for you.',
    effectDescription: '+3% all income', icon: 'mdi:omega',
    cost: D(10e9), target: 'allIncome', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_codex', 'p_ouroboros'],
  },

  // ═══ ROW 9 ═════════════════════════════════════════════════════
  {
    id: 'p_cascade', name: 'Prestige Cascade', row: 9, col: 0,
    description: 'One prestige triggers a cascade of bonuses.',
    effectDescription: '+4% prestige gain', icon: 'mdi:waterfall',
    cost: D(30e9), target: 'prestigeGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_singularity'],
  },
  {
    id: 'p_soulforge', name: 'Soul Forge', row: 9, col: 1,
    description: 'Forge your soul into an indestructible vessel.',
    effectDescription: '+4% prestige gain', icon: 'mdi:fire',
    cost: D(35e9), target: 'prestigeGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_singularity'],
  },
  {
    id: 'p_timechron', name: 'Temporal Archive', row: 9, col: 3,
    description: 'Archive wealth data across all timelines.',
    effectDescription: '+2% all income', icon: 'mdi:archive',
    cost: D(35e9), target: 'allIncome', multiplier: 0.02,
    category: 'Prestige', prerequisites: ['p_eternal'],
  },
  {
    id: 'p_metamorph', name: 'Metamorphosis', row: 9, col: 4,
    description: 'Transform into a higher form of existence.',
    effectDescription: '+4% prestige gain', icon: 'mdi:butterfly',
    cost: D(30e9), target: 'prestigeGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_rebirth'],
  },

  // ═══ ROW 10 ════════════════════════════════════════════════════
  {
    id: 'p_infinity', name: 'Infinite Prestige', row: 10, col: 0,
    description: 'Prestige has no ceiling — only infinite growth.',
    effectDescription: '+4% prestige gain', icon: 'mdi:infinity',
    cost: D(100e9), target: 'prestigeGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_cascade'],
  },
  {
    id: 'p_avatar', name: 'Avatar of Wealth', row: 10, col: 1,
    description: 'Become the physical embodiment of wealth.',
    effectDescription: '+4% prestige gain', icon: 'mdi:account-cowboy-hat',
    cost: D(120e9), target: 'prestigeGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_soulforge'],
  },
  {
    id: 'p_omnimem', name: 'Omni-Memory', row: 10, col: 2,
    description: 'Remember every single event from every past life.',
    effectDescription: '+6% XP gain', icon: 'mdi:brain',
    cost: D(150e9), target: 'xpGain', multiplier: 0.06,
    category: 'Prestige', prerequisites: ['p_soulforge', 'p_timechron'],
  },
  {
    id: 'p_dimension', name: 'Dimensional Shift', row: 10, col: 3,
    description: 'Shift through dimensions to find richer realities.',
    effectDescription: '+2% all income', icon: 'mdi:cube-send',
    cost: D(120e9), target: 'allIncome', multiplier: 0.02,
    category: 'Prestige', prerequisites: ['p_timechron'],
  },
  {
    id: 'p_ascend1', name: 'First Ascension', row: 10, col: 4,
    description: 'Ascend beyond the cycle of rebirth.',
    effectDescription: '+4% prestige gain', icon: 'mdi:arrow-up-bold',
    cost: D(100e9), target: 'prestigeGain', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_metamorph'],
  },

  // ═══ ROW 11 ════════════════════════════════════════════════════
  {
    id: 'p_hyperpres', name: 'Hyper-Prestige', row: 11, col: 0,
    description: 'Prestige so powerful it warps spacetime.',
    effectDescription: '+5% prestige gain', icon: 'mdi:flash',
    cost: D(300e9), target: 'prestigeGain', multiplier: 0.05,
    category: 'Prestige', prerequisites: ['p_infinity'],
  },
  {
    id: 'p_wealth', name: 'Wealth Incarnate', row: 11, col: 1,
    description: 'You don\'t have wealth. You ARE wealth.',
    effectDescription: '+2% all income', icon: 'mdi:cash-lock',
    cost: D(400e9), target: 'allIncome', multiplier: 0.02,
    category: 'Prestige', prerequisites: ['p_avatar'],
  },
  {
    id: 'p_cosmic', name: 'Cosmic Inheritance', row: 11, col: 3,
    description: 'Inherit wealth from civilisations across the cosmos.',
    effectDescription: '+5% prestige gain', icon: 'mdi:telescope',
    cost: D(400e9), target: 'prestigeGain', multiplier: 0.05,
    category: 'Prestige', prerequisites: ['p_omnimem', 'p_dimension'],
  },
  {
    id: 'p_transcend', name: 'Transcendence', row: 11, col: 4,
    description: 'Rise above all physical limitations.',
    effectDescription: '+2% all income', icon: 'mdi:meditation',
    cost: D(300e9), target: 'allIncome', multiplier: 0.02,
    category: 'Prestige', prerequisites: ['p_ascend1'],
  },

  // ═══ ROW 12 — Convergence ══════════════════════════════════════
  {
    id: 'p_ultrapres', name: 'Ultra-Prestige', row: 12, col: 1,
    description: 'Prestige beyond mortal comprehension.',
    effectDescription: '+7% prestige gain', icon: 'mdi:shield-sun',
    cost: D(1.5e12), target: 'prestigeGain', multiplier: 0.07,
    category: 'Prestige', prerequisites: ['p_hyperpres', 'p_wealth'],
  },
  {
    id: 'p_eon', name: 'Eon Wisdom', row: 12, col: 2,
    description: 'Wisdom accumulated over billions of years.',
    effectDescription: '+10% XP gain', icon: 'mdi:timer-sand-complete',
    cost: D(2e12), target: 'xpGain', multiplier: 0.10,
    category: 'Prestige', prerequisites: ['p_wealth', 'p_cosmic'],
  },
  {
    id: 'p_godform', name: 'God Form', row: 12, col: 3,
    description: 'Take on a divine form of infinite potential.',
    effectDescription: '+4% all income', icon: 'mdi:shield-crown',
    cost: D(1.5e12), target: 'allIncome', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_cosmic', 'p_transcend'],
  },

  // ═══ ROW 13 ════════════════════════════════════════════════════
  {
    id: 'p_bigbang', name: 'Big Bang Rebirth', row: 13, col: 0,
    description: 'Each prestige creates a new universe.',
    effectDescription: '+5% prestige gain', icon: 'mdi:creation',
    cost: D(5e12), target: 'prestigeGain', multiplier: 0.05,
    category: 'Prestige', prerequisites: ['p_ultrapres'],
  },
  {
    id: 'p_flux', name: 'Temporal Flux', row: 13, col: 1,
    description: 'Exist in all moments of time simultaneously.',
    effectDescription: '+5% prestige gain', icon: 'mdi:clock-end',
    cost: D(4e12), target: 'prestigeGain', multiplier: 0.05,
    category: 'Prestige', prerequisites: ['p_ultrapres'],
  },
  {
    id: 'p_weave', name: 'Reality Weaver', row: 13, col: 3,
    description: 'Weave the fabric of reality to your benefit.',
    effectDescription: '+3% all income', icon: 'mdi:spider-web',
    cost: D(6e12), target: 'allIncome', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_eon'],
  },
  {
    id: 'p_nirvana', name: 'Financial Nirvana', row: 13, col: 4,
    description: 'Perfect enlightenment through infinite wealth.',
    effectDescription: '+5% prestige gain', icon: 'mdi:weather-sunny',
    cost: D(5e12), target: 'prestigeGain', multiplier: 0.05,
    category: 'Prestige', prerequisites: ['p_godform'],
  },

  // ═══ ROW 14 ════════════════════════════════════════════════════
  {
    id: 'p_entropy', name: 'Entropy Reversal', row: 14, col: 0,
    description: 'Reverse entropy — wealth can only increase.',
    effectDescription: '+5% prestige gain', icon: 'mdi:arrow-u-left-top',
    cost: D(20e12), target: 'prestigeGain', multiplier: 0.05,
    category: 'Prestige', prerequisites: ['p_bigbang'],
  },
  {
    id: 'p_multpres', name: 'Multiverse Prestige', row: 14, col: 1,
    description: 'Prestige across infinite parallel universes.',
    effectDescription: '+5% prestige gain', icon: 'mdi:transit-connection',
    cost: D(15e12), target: 'prestigeGain', multiplier: 0.05,
    category: 'Prestige', prerequisites: ['p_flux'],
  },
  {
    id: 'p_blueprint', name: 'Cosmic Blueprint', row: 14, col: 2,
    description: 'Read the cosmic blueprint underlying all wealth.',
    effectDescription: '+7% XP gain', icon: 'mdi:map-marker-star',
    cost: D(25e12), target: 'xpGain', multiplier: 0.07,
    category: 'Prestige', prerequisites: ['p_flux', 'p_weave'],
  },
  {
    id: 'p_fabric', name: 'Fabric of Fortune', row: 14, col: 3,
    description: 'Luck and wealth are woven into the universe.',
    effectDescription: '+3% all income', icon: 'mdi:texture',
    cost: D(20e12), target: 'allIncome', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_weave'],
  },
  {
    id: 'p_apotheosis', name: 'Apotheosis', row: 14, col: 4,
    description: 'The final metamorphosis into a financial deity.',
    effectDescription: '+5% prestige gain', icon: 'mdi:star-face',
    cost: D(20e12), target: 'prestigeGain', multiplier: 0.05,
    category: 'Prestige', prerequisites: ['p_nirvana'],
  },

  // ═══ ROW 15 ════════════════════════════════════════════════════
  {
    id: 'p_heatdeath', name: 'Beyond Heat Death', row: 15, col: 0,
    description: 'Accumulate wealth even after the universe dies.',
    effectDescription: '+6% prestige gain', icon: 'mdi:snowflake-thermometer',
    cost: D(80e12), target: 'prestigeGain', multiplier: 0.06,
    category: 'Prestige', prerequisites: ['p_entropy'],
  },
  {
    id: 'p_omnipres', name: 'Omni-Prestige', row: 15, col: 1,
    description: 'Prestige happens everywhere, always, instantly.',
    effectDescription: '+6% prestige gain', icon: 'mdi:dots-circle',
    cost: D(70e12), target: 'prestigeGain', multiplier: 0.06,
    category: 'Prestige', prerequisites: ['p_multpres'],
  },
  {
    id: 'p_cosmarch', name: 'Cosmic Architect', row: 15, col: 3,
    description: 'Design universes optimised for wealth generation.',
    effectDescription: '+3% all income', icon: 'mdi:compass-rose',
    cost: D(100e12), target: 'allIncome', multiplier: 0.03,
    category: 'Prestige', prerequisites: ['p_blueprint', 'p_fabric'],
  },
  {
    id: 'p_eternal2', name: 'Eternal Being', row: 15, col: 4,
    description: 'Exist outside time as an eternal financial entity.',
    effectDescription: '+6% prestige gain', icon: 'mdi:account-supervisor-circle',
    cost: D(80e12), target: 'prestigeGain', multiplier: 0.06,
    category: 'Prestige', prerequisites: ['p_apotheosis'],
  },

  // ═══ ROW 16 — Convergence ══════════════════════════════════════
  {
    id: 'p_alpha', name: 'Alpha & Omega', row: 16, col: 1,
    description: 'You are the beginning and end of all wealth.',
    effectDescription: '+9% prestige gain', icon: 'mdi:alpha-a-circle',
    cost: D(500e12), target: 'prestigeGain', multiplier: 0.09,
    category: 'Prestige', prerequisites: ['p_heatdeath', 'p_omnipres'],
  },
  {
    id: 'p_planck', name: 'Planck Wealth', row: 16, col: 2,
    description: 'Wealth at the fundamental quantum scale of reality.',
    effectDescription: '+4% all income', icon: 'mdi:atom',
    cost: D(600e12), target: 'allIncome', multiplier: 0.04,
    category: 'Prestige', prerequisites: ['p_omnipres', 'p_cosmarch'],
  },
  {
    id: 'p_source', name: 'The Source', row: 16, col: 3,
    description: 'Connect to the fundamental source of all value.',
    effectDescription: '+9% prestige gain', icon: 'mdi:white-balance-sunny',
    cost: D(500e12), target: 'prestigeGain', multiplier: 0.09,
    category: 'Prestige', prerequisites: ['p_cosmarch', 'p_eternal2'],
  },

  // ═══ ROW 17 — Capstone ═════════════════════════════════════════
  {
    id: 'p_absolute', name: 'Absolute Prestige', row: 17, col: 1,
    description: 'The ultimate prestige — perfection across all realities.',
    effectDescription: '+12% prestige gain', icon: 'mdi:flare',
    cost: D(5e15), target: 'prestigeGain', multiplier: 0.12,
    category: 'Prestige', prerequisites: ['p_alpha', 'p_planck'],
  },
  {
    id: 'p_creator', name: 'The Creator', row: 17, col: 3,
    description: 'You created wealth. You created the universe. You ARE creation.',
    effectDescription: '+6% all income', icon: 'mdi:all-inclusive',
    cost: D(5e15), target: 'allIncome', multiplier: 0.06,
    category: 'Prestige', prerequisites: ['p_planck', 'p_source'],
  },
]
