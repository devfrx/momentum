export interface GamblingGameDef {
  id: string
  name: string
  description: string
  icon: string
  minBet: number
  maxBetMultiplier: number
  odds: number
  payoutMultiplier: number
  category: string
  rules: string
}

export const GAMBLING_GAMES: GamblingGameDef[] = [
  {
    id: 'coinFlip',
    name: 'Coin Flip',
    description: 'Heads or tails. Simple and clean.',
    icon: 'mdi:circle-half-full',
    minBet: 1,
    maxBetMultiplier: 1,
    odds: 0.5,
    payoutMultiplier: 2,
    category: 'Simple',
    rules: 'Pick heads or tails. Win = 2x your bet.'
  },
  {
    id: 'dice',
    name: 'Dice Roll',
    description: 'Roll the dice and beat the target.',
    icon: 'mdi:dice-6',
    minBet: 5,
    maxBetMultiplier: 1,
    odds: 0.417,
    payoutMultiplier: 2.4,
    category: 'Simple',
    rules: 'Roll two dice. Score 7 or higher to win. Payout: 2.4x.'
  },
  {
    id: 'slots',
    name: 'Slot Machine',
    description: 'Three reels of fortune.',
    icon: 'mdi:slot-machine',
    minBet: 10,
    maxBetMultiplier: 1,
    odds: 0.25,
    payoutMultiplier: 4,
    category: 'Machine',
    rules: 'Match 2 symbols = 2x. Match 3 = 10x. Jackpot (777) = 100x.'
  },
  {
    id: 'roulette',
    name: 'Roulette',
    description: 'Bet on colors, numbers or ranges.',
    icon: 'mdi:record-circle',
    minBet: 10,
    maxBetMultiplier: 1,
    odds: 0.4865,
    payoutMultiplier: 2,
    category: 'Table',
    rules: 'Red/Black: 2x. Dozen: 3x. Single number: 36x.'
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Beat the dealer without going over 21.',
    icon: 'mdi:cards-playing-spade',
    minBet: 25,
    maxBetMultiplier: 1,
    odds: 0.49,
    payoutMultiplier: 2,
    category: 'Table',
    rules: 'Get closer to 21 than the dealer. Blackjack pays 3:2.'
  },
  {
    id: 'poker',
    name: 'Video Poker',
    description: 'Draw poker against the machine.',
    icon: 'mdi:cards-playing-heart',
    minBet: 20,
    maxBetMultiplier: 1,
    odds: 0.45,
    payoutMultiplier: 2.5,
    category: 'Table',
    rules: 'Jacks or Better. Draw up to 5 cards. Best hand wins.'
  },
  {
    id: 'scratchCard',
    name: 'Scratch Card',
    description: 'Scratch and see if you won.',
    icon: 'mdi:cards',
    minBet: 5,
    maxBetMultiplier: 0.1,
    odds: 0.3,
    payoutMultiplier: 3,
    category: 'Simple',
    rules: 'Scratch 3 matching symbols to win. Various tiers.'
  },
  {
    id: 'horseRacing',
    name: 'Horse Racing',
    description: 'Bet on the winning horse.',
    icon: 'mdi:horse-variant',
    minBet: 50,
    maxBetMultiplier: 1,
    odds: 0.2,
    payoutMultiplier: 5,
    category: 'Sports',
    rules: 'Pick a horse from 6 runners. Odds vary by horse.'
  },
  {
    id: 'plinko',
    name: 'Plinko',
    description: 'Drop balls through pegs into multiplier buckets.',
    icon: 'mdi:triangle-outline',
    minBet: 5,
    maxBetMultiplier: 1,
    odds: 0.5,
    payoutMultiplier: 30,
    category: 'Machine',
    rules: 'Choose risk level and rows. Drop a ball from the top — it bounces through pegs and lands in a multiplier bucket. Higher risk = higher max payout but more loss potential.'
  },
  {
    id: 'lottery',
    name: 'Lottery',
    description: 'Pick your lucky numbers and win big.',
    icon: 'mdi:ticket',
    minBet: 10,
    maxBetMultiplier: 1,
    odds: 0.3,
    payoutMultiplier: 100000,
    category: 'Draw',
    rules: 'Choose a ticket type, pick your numbers, and watch the draw. Match enough numbers to win. Multiple ticket tiers with increasing jackpots. Gambling Luck boosts all payouts.'
  }
]
