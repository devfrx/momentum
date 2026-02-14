import { D } from '@renderer/core/BigNum'
import type Decimal from 'break_infinity.js'

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  category: string
  condition: AchievementCondition
  reward?: AchievementReward
  hidden?: boolean
}

export interface AchievementCondition {
  type: 'cash' | 'totalEarned' | 'netWorth' | 'level' | 'businesses' | 'prestige' | 'gambling' | 'stocks' | 'realEstate' | 'upgrades' | 'storageWins' | 'storageItemsSold' | 'manual'
  value: Decimal | number
}

export interface AchievementReward {
  type: 'multiplier' | 'unlock'
  target: string
  value: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Cash milestones
  { id: 'cash_1', name: 'First Dollar', description: 'Earn your first dollar.', icon: 'mdi:cash', category: 'Wealth', condition: { type: 'totalEarned', value: D(1) } },
  { id: 'cash_2', name: 'Hundredaire', description: 'Accumulate $100.', icon: 'mdi:cash', category: 'Wealth', condition: { type: 'totalEarned', value: D(100) } },
  { id: 'cash_3', name: 'Thousandaire', description: 'Accumulate $1,000.', icon: 'mdi:cash-multiple', category: 'Wealth', condition: { type: 'totalEarned', value: D(1000) } },
  { id: 'cash_4', name: 'Five-Figure Fortune', description: 'Accumulate $10,000.', icon: 'mdi:cash-multiple', category: 'Wealth', condition: { type: 'totalEarned', value: D(10_000) } },
  { id: 'cash_5', name: 'Six-Figure Salary', description: 'Accumulate $100,000.', icon: 'mdi:safe', category: 'Wealth', condition: { type: 'totalEarned', value: D(100_000) } },
  { id: 'cash_6', name: 'Millionaire', description: 'Accumulate $1,000,000.', icon: 'mdi:diamond', category: 'Wealth', condition: { type: 'totalEarned', value: D(1_000_000) }, reward: { type: 'multiplier', target: 'all_income', value: 1.1 } },
  { id: 'cash_7', name: 'Multi-Millionaire', description: 'Accumulate $10,000,000.', icon: 'mdi:diamond-stone', category: 'Wealth', condition: { type: 'totalEarned', value: D(10_000_000) } },
  { id: 'cash_8', name: 'Billionaire', description: 'Accumulate $1,000,000,000.', icon: 'mdi:crown', category: 'Wealth', condition: { type: 'totalEarned', value: D(1e9) }, reward: { type: 'multiplier', target: 'all_income', value: 1.25 } },
  { id: 'cash_9', name: 'Trillionaire', description: 'Accumulate $1,000,000,000,000.', icon: 'mdi:crown-circle', category: 'Wealth', condition: { type: 'totalEarned', value: D(1e12) }, reward: { type: 'multiplier', target: 'all_income', value: 1.5 } },

  // Net worth milestones
  { id: 'nw_1', name: 'Positive Balance', description: 'Reach $1,000 net worth.', icon: 'mdi:scale-balance', category: 'Net Worth', condition: { type: 'netWorth', value: D(1000) } },
  { id: 'nw_2', name: 'Comfortable', description: 'Reach $100,000 net worth.', icon: 'mdi:scale-balance', category: 'Net Worth', condition: { type: 'netWorth', value: D(100_000) } },
  { id: 'nw_3', name: 'Wealthy', description: 'Reach $10,000,000 net worth.', icon: 'mdi:chart-areaspline', category: 'Net Worth', condition: { type: 'netWorth', value: D(10_000_000) }, reward: { type: 'multiplier', target: 'all_income', value: 1.15 } },
  { id: 'nw_4', name: 'Ultra Rich', description: 'Reach $1,000,000,000 net worth.', icon: 'mdi:chart-areaspline-variant', category: 'Net Worth', condition: { type: 'netWorth', value: D(1e9) }, reward: { type: 'multiplier', target: 'all_income', value: 1.3 } },

  // Level milestones
  { id: 'level_1', name: 'Novice', description: 'Reach level 5.', icon: 'mdi:arrow-up-bold-circle', category: 'Progress', condition: { type: 'level', value: 5 } },
  { id: 'level_2', name: 'Apprentice', description: 'Reach level 10.', icon: 'mdi:arrow-up-bold-circle', category: 'Progress', condition: { type: 'level', value: 10 } },
  { id: 'level_3', name: 'Expert', description: 'Reach level 25.', icon: 'mdi:arrow-up-bold-circle', category: 'Progress', condition: { type: 'level', value: 25 } },
  { id: 'level_4', name: 'Master', description: 'Reach level 50.', icon: 'mdi:medal', category: 'Progress', condition: { type: 'level', value: 50 }, reward: { type: 'multiplier', target: 'all_income', value: 1.2 } },
  { id: 'level_5', name: 'Legend', description: 'Reach level 100.', icon: 'mdi:trophy', category: 'Progress', condition: { type: 'level', value: 100 }, reward: { type: 'multiplier', target: 'all_income', value: 1.5 } },

  // Business milestones
  { id: 'biz_1', name: 'Entrepreneur', description: 'Own 1 business.', icon: 'mdi:store', category: 'Business', condition: { type: 'businesses', value: 1 } },
  { id: 'biz_2', name: 'Business Mogul', description: 'Own 5 businesses.', icon: 'mdi:domain', category: 'Business', condition: { type: 'businesses', value: 5 } },
  { id: 'biz_3', name: 'Tycoon', description: 'Own all businesses.', icon: 'mdi:city', category: 'Business', condition: { type: 'businesses', value: 12 }, reward: { type: 'multiplier', target: 'all_income', value: 2 } },

  // Prestige milestones
  { id: 'pres_1', name: 'New Era', description: 'Expand to a new era for the first time.', icon: 'mdi:refresh', category: 'Prestige', condition: { type: 'prestige', value: 1 } },
  { id: 'pres_2', name: 'Empire Expander', description: 'Expand 5 times.', icon: 'mdi:star-circle', category: 'Prestige', condition: { type: 'prestige', value: 5 }, reward: { type: 'multiplier', target: 'prestige_gain', value: 1.2 } },
  { id: 'pres_3', name: 'Eternal Tycoon', description: 'Expand 25 times.', icon: 'mdi:infinity', category: 'Prestige', condition: { type: 'prestige', value: 25 }, reward: { type: 'multiplier', target: 'prestige_gain', value: 1.5 } },

  // Hidden achievements
  { id: 'secret_1', name: '???', description: 'You found a secret!', icon: 'mdi:help-circle', category: 'Secret', condition: { type: 'netWorth', value: D(42) }, hidden: true },
  { id: 'secret_2', name: 'Lucky Streak', description: 'Win 10 gambles in a row.', icon: 'mdi:clover', category: 'Secret', condition: { type: 'gambling', value: 10 }, hidden: true },

  // ─── Lottery Achievements ───────────────────────────────────────
  // One achievement per lottery ticket jackpot — unlocked manually from LotteryGame.vue
  { id: 'lot_quick_pick', name: 'Quick Winner', description: 'Win the Quick Pick jackpot (3 Match).', icon: 'mdi:lightning-bolt', category: 'Lottery', condition: { type: 'manual', value: 0 }, reward: { type: 'multiplier', target: 'gambling_luck', value: 1.02 } },
  { id: 'lot_classic', name: 'Classic Champion', description: 'Win the Classic Lottery jackpot.', icon: 'mdi:ticket', category: 'Lottery', condition: { type: 'manual', value: 0 }, reward: { type: 'multiplier', target: 'gambling_luck', value: 1.03 } },
  { id: 'lot_mega', name: 'Mega Winner', description: 'Win the Mega Millions jackpot.', icon: 'mdi:star-circle', category: 'Lottery', condition: { type: 'manual', value: 0 }, reward: { type: 'multiplier', target: 'gambling_luck', value: 1.05 } },
  { id: 'lot_instant', name: 'Lucky Numbers Master', description: 'Win the Lucky Numbers jackpot (4 Match).', icon: 'mdi:numeric', category: 'Lottery', condition: { type: 'manual', value: 0 }, reward: { type: 'multiplier', target: 'gambling_luck', value: 1.02 } },
  { id: 'lot_ultra', name: 'Ultra Jackpot Winner', description: 'Win the Ultra Jackpot.', icon: 'mdi:fire-circle', category: 'Lottery', condition: { type: 'manual', value: 0 }, reward: { type: 'multiplier', target: 'all_income', value: 1.05 } },
  { id: 'lot_cosmic', name: 'Cosmic Conqueror', description: 'Win the Cosmic Infinity jackpot.', icon: 'mdi:creation', category: 'Lottery', condition: { type: 'manual', value: 0 }, reward: { type: 'multiplier', target: 'all_income', value: 1.10 } },
  { id: 'lot_divine', name: 'Touched by Fate', description: 'Unlock Omniscience from Divine Fate.', icon: 'mdi:shimmer', category: 'Lottery', condition: { type: 'manual', value: 0 }, reward: { type: 'multiplier', target: 'all_income', value: 1.15 } },
  { id: 'lot_divine_jackpot', name: 'Divine Chosen', description: 'Win the Divine Fate ultimate jackpot.', icon: 'mdi:shimmer', category: 'Lottery', condition: { type: 'manual', value: 0 }, reward: { type: 'multiplier', target: 'all_income', value: 1.25 }, hidden: true },
  // Master achievement for all lottery jackpots
  { id: 'lot_master', name: 'Lottery Grandmaster', description: 'Win a jackpot on every lottery type.', icon: 'mdi:trophy-variant', category: 'Lottery', condition: { type: 'manual', value: 0 }, reward: { type: 'multiplier', target: 'all_income', value: 1.50 }, hidden: true },

  // ─── Storage Wars Achievements ──────────────────────────────────
  { id: 'storage_1', name: 'First Bid', description: 'Win your first storage auction.', icon: 'mdi:gavel', category: 'Storage Wars', condition: { type: 'storageWins', value: 1 } },
  { id: 'storage_2', name: 'Auction Regular', description: 'Win 10 storage auctions.', icon: 'mdi:warehouse', category: 'Storage Wars', condition: { type: 'storageWins', value: 10 } },
  { id: 'storage_3', name: 'Storage Mogul', description: 'Win 50 storage auctions.', icon: 'mdi:warehouse', category: 'Storage Wars', condition: { type: 'storageWins', value: 50 }, reward: { type: 'multiplier', target: 'all_income', value: 1.1 } },
  { id: 'storage_4', name: 'Auction King', description: 'Win 200 storage auctions.', icon: 'mdi:crown', category: 'Storage Wars', condition: { type: 'storageWins', value: 200 }, reward: { type: 'multiplier', target: 'all_income', value: 1.2 } },
  { id: 'storage_5', name: 'Flipper', description: 'Sell 25 items from storage units.', icon: 'mdi:cash-register', category: 'Storage Wars', condition: { type: 'storageItemsSold', value: 25 } },
  { id: 'storage_6', name: 'Treasure Hunter', description: 'Sell 100 items from storage units.', icon: 'mdi:treasure-chest', category: 'Storage Wars', condition: { type: 'storageItemsSold', value: 100 }, reward: { type: 'multiplier', target: 'all_income', value: 1.05 } },
  { id: 'storage_7', name: 'Pawn Star', description: 'Sell 500 items from storage units.', icon: 'mdi:star-circle', category: 'Storage Wars', condition: { type: 'storageItemsSold', value: 500 }, reward: { type: 'multiplier', target: 'all_income', value: 1.15 } },
]
