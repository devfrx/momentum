/**
 * Prestige System Data Exports
 *
 * Central export for all prestige-related data definitions.
 */

// Types
export * from './types'

// Eras
export { PRESTIGE_ERAS, getCurrentEra, getNextEra, getEraProgress } from './eras'

// Milestones
export { PRESTIGE_MILESTONES } from './milestones'

// Perks
export { PRESTIGE_PERKS, getPerksForEra, getPerksUpToEra } from './perks'

// Upgrades
export {
  PRESTIGE_UPGRADES,
  getUpgradesByCategory,
  getUpgradeCategories,
  UPGRADE_CATEGORY_INFO
} from './upgrades'
