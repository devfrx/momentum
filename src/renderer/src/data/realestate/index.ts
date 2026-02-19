/**
 * Real Estate Data — Barrel export
 */
export {
  LOCATION_GRADES,
  getLocationGrade,
  rollLocationGrade,
  getCategoryBonus,
} from './locations'
export type { LocationGrade, LocationGradeData, PropertyCategory } from './locations'

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
  SCOUT_PHASES,
  SCOUT_PHASE_DATA,
  APPRAISAL_DISCOUNT,
  SCOUT_COOLDOWN_MS,
  getScoutMarketCost,
  generateOpportunity,
  generateScoutOpportunity,
  generateOpportunityBatch,
} from './generators'
export type { ScoutPhase, ScoutPhaseData, PropertyOpportunity } from './generators'
