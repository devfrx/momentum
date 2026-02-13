/**
 * Real Estate Data — Barrel export
 */
export {
  DISTRICTS,
  getDistrict,
  getUnlockedDistricts,
  getActiveSynergies,
  getCombinedSynergyBonus,
} from './districts'
export type { District, DistrictTier, PropertyDistrictCategory, DistrictSynergyBonus } from './districts'

export { PROPERTY_TEMPLATES } from './templates'
export type { PropertyTemplate } from './templates'

export {
  PROPERTY_TRAITS,
  getTrait,
  MANAGEMENT_STYLES,
  getManagementStyle,
  IMPROVEMENTS,
  getImprovement,
  getAvailableImprovements,
} from './customizations'
export type { PropertyTrait, ManagementStyle, ManagementStyleDef, ImprovementId, ImprovementDef } from './customizations'

export {
  OPPORTUNITY_REFRESH_TICKS,
  MIN_OPPORTUNITIES,
  MAX_OPPORTUNITIES,
  OPPORTUNITY_LIFETIME_MS,
  SCOUT_PHASES,
  SCOUT_PHASE_DATA,
  APPRAISAL_DISCOUNT,
  generateOpportunity,
  generateScanOpportunity,
  generateOpportunityBatch,
  isOpportunityExpired,
} from './generators'
export type { ScoutPhase, ScoutPhaseData, PropertyOpportunity } from './generators'
