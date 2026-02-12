import { D } from '@renderer/core/BigNum'
import type { UpgradeDef } from '@renderer/data/upgrades'

/**
 * Gambling Skill Tree — 75 nodes
 *
 * LEFT path:   Luck & Fortune
 * CENTER path: Strategy & Calculation
 * RIGHT path:  Psychology & Composure
 *
 * Convergence milestones at rows 8, 12, 16.
 */
export const GAMBLING_SKILLS: UpgradeDef[] = [
  // ═══ ROW 0 — Root ══════════════════════════════════════════════
  {
    id: 'g_root', name: 'Beginner\'s Luck', row: 0, col: 2,
    description: 'Everyone gets lucky once — you more than most.',
    effectDescription: '+2% gambling luck', icon: 'mdi:clover',
    cost: D(10_000), target: 'gamblingLuck', multiplier: 0.02,
    category: 'Gambling', prerequisites: [],
  },

  // ═══ ROW 1 ═════════════════════════════════════════════════════
  {
    id: 'g_charm', name: 'Lucky Charm', row: 1, col: 1,
    description: 'A rabbit\'s foot that actually works.',
    effectDescription: '+2% gambling luck', icon: 'mdi:horseshoe',
    cost: D(25_000), target: 'gamblingLuck', multiplier: 0.02,
    category: 'Gambling', prerequisites: ['g_root'],
  },
  {
    id: 'g_instinct', name: 'Gut Instinct', row: 1, col: 3,
    description: 'Your hunches are right more often than not.',
    effectDescription: '+1% all income', icon: 'mdi:stomach',
    cost: D(30_000), target: 'allIncome', multiplier: 0.01,
    category: 'Gambling', prerequisites: ['g_root'],
  },

  // ═══ ROW 2 ═════════════════════════════════════════════════════
  {
    id: 'g_streak', name: 'Hot Streak', row: 2, col: 0,
    description: 'Win streaks last longer than they should.',
    effectDescription: '+2% gambling luck', icon: 'mdi:fire',
    cost: D(60_000), target: 'gamblingLuck', multiplier: 0.02,
    category: 'Gambling', prerequisites: ['g_charm'],
  },
  {
    id: 'g_odds', name: 'Odds Calculator', row: 2, col: 2,
    description: 'You can calculate odds in your head instantly.',
    effectDescription: '+2% gambling luck', icon: 'mdi:calculator-variant',
    cost: D(75_000), target: 'gamblingLuck', multiplier: 0.02,
    category: 'Gambling', prerequisites: ['g_root'],
  },
  {
    id: 'g_pokerface', name: 'Poker Face', row: 2, col: 4,
    description: 'Nobody can read your expressions.',
    effectDescription: '+1% all income', icon: 'mdi:emoticon-neutral',
    cost: D(60_000), target: 'allIncome', multiplier: 0.01,
    category: 'Gambling', prerequisites: ['g_instinct'],
  },

  // ═══ ROW 3 ═════════════════════════════════════════════════════
  {
    id: 'g_ritual', name: 'Lucky Rituals', row: 3, col: 0,
    description: 'Superstitious routines that defy probability.',
    effectDescription: '+3% gambling luck', icon: 'mdi:candelabra',
    cost: D(180_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_streak'],
  },
  {
    id: 'g_counting', name: 'Card Counting', row: 3, col: 1,
    description: 'Track every card through the shoe.',
    effectDescription: '+3% gambling luck', icon: 'mdi:cards-playing-spade',
    cost: D(200_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_charm', 'g_odds'],
  },
  {
    id: 'g_patterns', name: 'Pattern Recognition', row: 3, col: 3,
    description: 'See hidden patterns in randomness.',
    effectDescription: '+3% gambling luck', icon: 'mdi:shape',
    cost: D(220_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_odds', 'g_instinct'],
  },
  {
    id: 'g_composure', name: 'Composure', row: 3, col: 4,
    description: 'Stay calm under immense pressure.',
    effectDescription: '+1% all income', icon: 'mdi:meditation',
    cost: D(180_000), target: 'allIncome', multiplier: 0.01,
    category: 'Gambling', prerequisites: ['g_pokerface'],
  },

  // ═══ ROW 4 ═════════════════════════════════════════════════════
  {
    id: 'g_talisman', name: 'Ancient Talisman', row: 4, col: 0,
    description: 'An artifact radiating improbable fortune.',
    effectDescription: '+3% gambling luck', icon: 'mdi:shield-star',
    cost: D(500_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_ritual'],
  },
  {
    id: 'g_strategy', name: 'Optimal Strategy', row: 4, col: 1,
    description: 'Mathematically optimal play every hand.',
    effectDescription: '+3% gambling luck', icon: 'mdi:chess-knight',
    cost: D(600_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_counting'],
  },
  {
    id: 'g_prob', name: 'Probability Master', row: 4, col: 2,
    description: 'You FEEL the probability distributions.',
    effectDescription: '+3% gambling luck', icon: 'mdi:chart-bell-curve-cumulative',
    cost: D(700_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_counting', 'g_patterns'],
  },
  {
    id: 'g_bluff', name: 'Master Bluffer', row: 4, col: 3,
    description: 'You could bluff a lie detector.',
    effectDescription: '+3% gambling luck', icon: 'mdi:drama-masks',
    cost: D(550_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_patterns'],
  },
  {
    id: 'g_nerves', name: 'Nerves of Steel', row: 4, col: 4,
    description: 'Bet everything without flinching.',
    effectDescription: '+1% all income', icon: 'mdi:arm-flex',
    cost: D(500_000), target: 'allIncome', multiplier: 0.01,
    category: 'Gambling', prerequisites: ['g_composure'],
  },

  // ═══ ROW 5 ═════════════════════════════════════════════════════
  {
    id: 'g_amulet', name: 'Fortune Amulet', row: 5, col: 0,
    description: 'A mystical amulet that bends chance.',
    effectDescription: '+3% gambling luck', icon: 'mdi:necklace',
    cost: D(1_500_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_talisman'],
  },
  {
    id: 'g_gametheory', name: 'Game Theory', row: 5, col: 1,
    description: 'Nash equilibria are your playground.',
    effectDescription: '+3% gambling luck', icon: 'mdi:graph',
    cost: D(1_800_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_strategy'],
  },
  {
    id: 'g_tells', name: 'Reading Tells', row: 5, col: 3,
    description: 'You see micro-expressions others miss.',
    effectDescription: '+3% gambling luck', icon: 'mdi:eye',
    cost: D(1_800_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_bluff', 'g_nerves'],
  },
  {
    id: 'g_zen', name: 'Zen Gambler', row: 5, col: 4,
    description: 'Absolute inner peace at the table.',
    effectDescription: '+2% all income', icon: 'mdi:spa',
    cost: D(1_500_000), target: 'allIncome', multiplier: 0.02,
    category: 'Gambling', prerequisites: ['g_nerves'],
  },

  // ═══ ROW 6 ═════════════════════════════════════════════════════
  {
    id: 'g_relic', name: 'Lucky Relic', row: 6, col: 0,
    description: 'An ancient relic of impossible fortune.',
    effectDescription: '+3% gambling luck', icon: 'mdi:treasure-chest',
    cost: D(5_000_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_amulet'],
  },
  {
    id: 'g_aisim', name: 'AI Simulation', row: 6, col: 1,
    description: 'AI simulates millions of outcomes per second.',
    effectDescription: '+3% gambling luck', icon: 'mdi:robot',
    cost: D(6_000_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_gametheory'],
  },
  {
    id: 'g_edge', name: 'Statistical Edge', row: 6, col: 2,
    description: 'You always have the house edge on your side.',
    effectDescription: '+3% gambling luck', icon: 'mdi:percent',
    cost: D(7_000_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_gametheory', 'g_tells'],
  },
  {
    id: 'g_psych', name: 'Psychological Warfare', row: 6, col: 3,
    description: 'Your presence intimidates opponents.',
    effectDescription: '+3% gambling luck', icon: 'mdi:head-cog',
    cost: D(5_500_000), target: 'gamblingLuck', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_tells'],
  },
  {
    id: 'g_flow', name: 'Flow State', row: 6, col: 4,
    description: 'Enter a gambling flow state at will.',
    effectDescription: '+2% all income', icon: 'mdi:waves',
    cost: D(5_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Gambling', prerequisites: ['g_zen'],
  },

  // ═══ ROW 7 ═════════════════════════════════════════════════════
  {
    id: 'g_artifact', name: 'Chaos Artifact', row: 7, col: 0,
    description: 'Harness the power of pure chaos.',
    effectDescription: '+4% gambling luck', icon: 'mdi:hexagram',
    cost: D(15_000_000), target: 'gamblingLuck', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_relic'],
  },
  {
    id: 'g_quantum', name: 'Quantum Probability', row: 7, col: 1,
    description: 'Observe favourable quantum outcomes.',
    effectDescription: '+4% gambling luck', icon: 'mdi:atom',
    cost: D(18_000_000), target: 'gamblingLuck', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_aisim'],
  },
  {
    id: 'g_hypno', name: 'Hypnotic Presence', row: 7, col: 3,
    description: 'Opponents fold just by looking at you.',
    effectDescription: '+4% gambling luck', icon: 'mdi:eye-circle',
    cost: D(18_000_000), target: 'gamblingLuck', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_psych', 'g_flow'],
  },
  {
    id: 'g_transcend', name: 'Transcendent Focus', row: 7, col: 4,
    description: 'Your mind operates on a higher plane.',
    effectDescription: '+2% all income', icon: 'mdi:brain',
    cost: D(15_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Gambling', prerequisites: ['g_flow'],
  },

  // ═══ ROW 8 — Convergence ═══════════════════════════════════════
  {
    id: 'g_casino', name: 'Casino VIP', row: 8, col: 1,
    description: 'Private rooms and unlimited credit lines.',
    effectDescription: '+6% gambling luck', icon: 'mdi:poker-chip',
    cost: D(50_000_000), target: 'gamblingLuck', multiplier: 0.06,
    category: 'Gambling', prerequisites: ['g_artifact', 'g_quantum'],
  },
  {
    id: 'g_prophet', name: 'Probability Prophet', row: 8, col: 2,
    description: 'You predict outcomes with eerie accuracy.',
    effectDescription: '+6% gambling luck', icon: 'mdi:crystal-ball',
    cost: D(60_000_000), target: 'gamblingLuck', multiplier: 0.06,
    category: 'Gambling', prerequisites: ['g_quantum', 'g_hypno'],
  },
  {
    id: 'g_aura', name: 'Fortune Aura', row: 8, col: 3,
    description: 'Luck radiates from you to everything nearby.',
    effectDescription: '+3% all income', icon: 'mdi:circle-opacity',
    cost: D(50_000_000), target: 'allIncome', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_hypno', 'g_transcend'],
  },

  // ═══ ROW 9 ═════════════════════════════════════════════════════
  {
    id: 'g_whale', name: 'High Roller', row: 9, col: 0,
    description: 'Your bets make casino managers sweat.',
    effectDescription: '+4% gambling luck', icon: 'mdi:cash-multiple',
    cost: D(150_000_000), target: 'gamblingLuck', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_casino'],
  },
  {
    id: 'g_entropy', name: 'Entropy Reader', row: 9, col: 1,
    description: 'Read the entropy of any random system.',
    effectDescription: '+4% gambling luck', icon: 'mdi:dice-multiple',
    cost: D(180_000_000), target: 'gamblingLuck', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_casino'],
  },
  {
    id: 'g_precog', name: 'Precognition', row: 9, col: 3,
    description: 'See outcomes moments before they happen.',
    effectDescription: '+4% gambling luck', icon: 'mdi:third-eye',
    cost: D(180_000_000), target: 'gamblingLuck', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_prophet'],
  },
  {
    id: 'g_golden', name: 'Golden Touch', row: 9, col: 4,
    description: 'Every chip you touch multiplies.',
    effectDescription: '+2% all income', icon: 'mdi:hand-pointing-up',
    cost: D(150_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Gambling', prerequisites: ['g_aura'],
  },

  // ═══ ROW 10 ════════════════════════════════════════════════════
  {
    id: 'g_owner', name: 'Casino Owner', row: 10, col: 0,
    description: 'Why gamble when you can own the casino?',
    effectDescription: '+4% gambling luck', icon: 'mdi:crown',
    cost: D(500_000_000), target: 'gamblingLuck', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_whale'],
  },
  {
    id: 'g_chaos', name: 'Chaos Theory', row: 10, col: 1,
    description: 'Predict the unpredictable through chaos maths.',
    effectDescription: '+4% gambling luck', icon: 'mdi:chart-sankey',
    cost: D(600_000_000), target: 'gamblingLuck', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_entropy'],
  },
  {
    id: 'g_multiverse', name: 'Multiverse Bets', row: 10, col: 2,
    description: 'Win in every possible timeline simultaneously.',
    effectDescription: '+4% gambling luck', icon: 'mdi:source-branch',
    cost: D(700_000_000), target: 'gamblingLuck', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_entropy', 'g_precog'],
  },
  {
    id: 'g_oracle', name: 'The Oracle', row: 10, col: 3,
    description: 'Foresee every card, every spin, every roll.',
    effectDescription: '+4% gambling luck', icon: 'mdi:eye-settings',
    cost: D(600_000_000), target: 'gamblingLuck', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_precog'],
  },
  {
    id: 'g_manifest', name: 'Manifestation', row: 10, col: 4,
    description: 'Your will shapes random outcomes.',
    effectDescription: '+2% all income', icon: 'mdi:creation',
    cost: D(500_000_000), target: 'allIncome', multiplier: 0.02,
    category: 'Gambling', prerequisites: ['g_golden'],
  },

  // ═══ ROW 11 ════════════════════════════════════════════════════
  {
    id: 'g_empire', name: 'Casino Empire', row: 11, col: 0,
    description: 'A chain of casinos across every continent.',
    effectDescription: '+5% gambling luck', icon: 'mdi:city-variant',
    cost: D(1.5e9), target: 'gamblingLuck', multiplier: 0.05,
    category: 'Gambling', prerequisites: ['g_owner'],
  },
  {
    id: 'g_laplace', name: 'Laplace\'s Demon', row: 11, col: 1,
    description: 'Know the position of every atom — predict everything.',
    effectDescription: '+5% gambling luck', icon: 'mdi:math-integral',
    cost: D(2e9), target: 'gamblingLuck', multiplier: 0.05,
    category: 'Gambling', prerequisites: ['g_chaos'],
  },
  {
    id: 'g_telekin', name: 'Telekinesis', row: 11, col: 3,
    description: 'Subtly influence where the ball lands.',
    effectDescription: '+5% gambling luck', icon: 'mdi:hand-wave',
    cost: D(2e9), target: 'gamblingLuck', multiplier: 0.05,
    category: 'Gambling', prerequisites: ['g_multiverse', 'g_oracle'],
  },
  {
    id: 'g_reality', name: 'Reality Distortion', row: 11, col: 4,
    description: 'The universe rearranges itself for your benefit.',
    effectDescription: '+2% all income', icon: 'mdi:blur-radial',
    cost: D(1.5e9), target: 'allIncome', multiplier: 0.02,
    category: 'Gambling', prerequisites: ['g_manifest'],
  },

  // ═══ ROW 12 — Convergence ══════════════════════════════════════
  {
    id: 'g_fortunes', name: 'Lord of Fortunes', row: 12, col: 1,
    description: 'Fortune itself bows before your will.',
    effectDescription: '+7% gambling luck', icon: 'mdi:shield-crown',
    cost: D(8e9), target: 'gamblingLuck', multiplier: 0.07,
    category: 'Gambling', prerequisites: ['g_empire', 'g_laplace'],
  },
  {
    id: 'g_rng', name: 'RNG Manipulator', row: 12, col: 2,
    description: 'Random number generators obey your thoughts.',
    effectDescription: '+7% gambling luck', icon: 'mdi:matrix',
    cost: D(10e9), target: 'gamblingLuck', multiplier: 0.07,
    category: 'Gambling', prerequisites: ['g_laplace', 'g_telekin'],
  },
  {
    id: 'g_fate', name: 'Fate Weaver', row: 12, col: 3,
    description: 'Weave the threads of fate to your advantage.',
    effectDescription: '+4% all income', icon: 'mdi:spider-web',
    cost: D(8e9), target: 'allIncome', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_telekin', 'g_reality'],
  },

  // ═══ ROW 13 ════════════════════════════════════════════════════
  {
    id: 'g_jackpot', name: 'Eternal Jackpot', row: 13, col: 0,
    description: 'Every bet is a jackpot waiting to happen.',
    effectDescription: '+5% gambling luck', icon: 'mdi:slot-machine',
    cost: D(30e9), target: 'gamblingLuck', multiplier: 0.05,
    category: 'Gambling', prerequisites: ['g_fortunes'],
  },
  {
    id: 'g_prob2', name: 'Probability Collapse', row: 13, col: 1,
    description: 'Collapse probability wave functions at will.',
    effectDescription: '+5% gambling luck', icon: 'mdi:sine-wave',
    cost: D(25e9), target: 'gamblingLuck', multiplier: 0.05,
    category: 'Gambling', prerequisites: ['g_fortunes'],
  },
  {
    id: 'g_chrono', name: 'Chrono-Gambling', row: 13, col: 3,
    description: 'Gamble across multiple timelines at once.',
    effectDescription: '+5% gambling luck', icon: 'mdi:clock-outline',
    cost: D(35e9), target: 'gamblingLuck', multiplier: 0.05,
    category: 'Gambling', prerequisites: ['g_rng'],
  },
  {
    id: 'g_karma', name: 'Karmic Balance', row: 13, col: 4,
    description: 'The universe owes you infinite good fortune.',
    effectDescription: '+3% all income', icon: 'mdi:yin-yang',
    cost: D(30e9), target: 'allIncome', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_fate'],
  },

  // ═══ ROW 14 ════════════════════════════════════════════════════
  {
    id: 'g_cosmic', name: 'Cosmic Fortune', row: 14, col: 0,
    description: 'Stars align for your every gamble.',
    effectDescription: '+5% gambling luck', icon: 'mdi:star-four-points',
    cost: D(100e9), target: 'gamblingLuck', multiplier: 0.05,
    category: 'Gambling', prerequisites: ['g_jackpot'],
  },
  {
    id: 'g_maxwell', name: 'Maxwell\'s Demon', row: 14, col: 1,
    description: 'Sort randomness into perfect order.',
    effectDescription: '+5% gambling luck', icon: 'mdi:flash-outline',
    cost: D(80e9), target: 'gamblingLuck', multiplier: 0.05,
    category: 'Gambling', prerequisites: ['g_prob2'],
  },
  {
    id: 'g_godhand', name: 'God Hand', row: 14, col: 2,
    description: 'Your dice rolls are divine interventions.',
    effectDescription: '+5% gambling luck', icon: 'mdi:hand-extended',
    cost: D(120e9), target: 'gamblingLuck', multiplier: 0.05,
    category: 'Gambling', prerequisites: ['g_prob2', 'g_chrono'],
  },
  {
    id: 'g_timeline', name: 'Timeline Gambler', row: 14, col: 3,
    description: 'Bet on outcomes across all possible futures.',
    effectDescription: '+5% gambling luck', icon: 'mdi:timeline-check',
    cost: D(100e9), target: 'gamblingLuck', multiplier: 0.05,
    category: 'Gambling', prerequisites: ['g_chrono'],
  },
  {
    id: 'g_dharma', name: 'Dharmic Mastery', row: 14, col: 4,
    description: 'Transcend the wheel of fortune entirely.',
    effectDescription: '+3% all income', icon: 'mdi:dharmachakra',
    cost: D(100e9), target: 'allIncome', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_karma'],
  },

  // ═══ ROW 15 ════════════════════════════════════════════════════
  {
    id: 'g_nebula', name: 'Nebula Gambler', row: 15, col: 0,
    description: 'Gamble with the energy of dying stars.',
    effectDescription: '+6% gambling luck', icon: 'mdi:weather-night',
    cost: D(400e9), target: 'gamblingLuck', multiplier: 0.06,
    category: 'Gambling', prerequisites: ['g_cosmic'],
  },
  {
    id: 'g_absolute', name: 'Absolute Certainty', row: 15, col: 1,
    description: 'Eliminate uncertainty from every outcome.',
    effectDescription: '+6% gambling luck', icon: 'mdi:check-decagram',
    cost: D(350e9), target: 'gamblingLuck', multiplier: 0.06,
    category: 'Gambling', prerequisites: ['g_maxwell'],
  },
  {
    id: 'g_destiny', name: 'Destiny Controller', row: 15, col: 3,
    description: 'You don\'t gamble — you choose what happens.',
    effectDescription: '+6% gambling luck', icon: 'mdi:gamepad-variant',
    cost: D(450e9), target: 'gamblingLuck', multiplier: 0.06,
    category: 'Gambling', prerequisites: ['g_godhand', 'g_timeline'],
  },
  {
    id: 'g_nirvana', name: 'Gambling Nirvana', row: 15, col: 4,
    description: 'Perfect enlightenment through games of chance.',
    effectDescription: '+3% all income', icon: 'mdi:weather-sunny',
    cost: D(400e9), target: 'allIncome', multiplier: 0.03,
    category: 'Gambling', prerequisites: ['g_dharma'],
  },

  // ═══ ROW 16 — Convergence ══════════════════════════════════════
  {
    id: 'g_paradigm', name: 'Luck Paradigm', row: 16, col: 1,
    description: 'Luck is not random — it is a force you command.',
    effectDescription: '+9% gambling luck', icon: 'mdi:diamond',
    cost: D(2e12), target: 'gamblingLuck', multiplier: 0.09,
    category: 'Gambling', prerequisites: ['g_nebula', 'g_absolute'],
  },
  {
    id: 'g_omniscience', name: 'Omniscience', row: 16, col: 2,
    description: 'Know every outcome of every game that ever was.',
    effectDescription: '+9% gambling luck', icon: 'mdi:infinity',
    cost: D(2.5e12), target: 'gamblingLuck', multiplier: 0.09,
    category: 'Gambling', prerequisites: ['g_absolute', 'g_destiny'],
  },
  {
    id: 'g_fortune', name: 'Fortune Incarnate', row: 16, col: 3,
    description: 'You ARE the living embodiment of fortune.',
    effectDescription: '+4% all income', icon: 'mdi:star-shooting',
    cost: D(2e12), target: 'allIncome', multiplier: 0.04,
    category: 'Gambling', prerequisites: ['g_destiny', 'g_nirvana'],
  },

  // ═══ ROW 17 — Capstone ═════════════════════════════════════════
  {
    id: 'g_god', name: 'God of Chance', row: 17, col: 1,
    description: 'Randomness itself obeys your divine will.',
    effectDescription: '+12% gambling luck', icon: 'mdi:flare',
    cost: D(20e12), target: 'gamblingLuck', multiplier: 0.12,
    category: 'Gambling', prerequisites: ['g_paradigm', 'g_omniscience'],
  },
  {
    id: 'g_absolute2', name: 'Absolute Fortune', row: 17, col: 3,
    description: 'Every moment brings infinite fortune.',
    effectDescription: '+6% all income', icon: 'mdi:all-inclusive',
    cost: D(20e12), target: 'allIncome', multiplier: 0.06,
    category: 'Gambling', prerequisites: ['g_omniscience', 'g_fortune'],
  },
]
