/**
 * Property Customizations — Traits, improvements, and management styles
 *
 * Traits are randomly assigned to generated opportunities.
 * Improvements are player-purchasable upgrades per property.
 * Management styles control overall property strategy.
 */

// ═══════════════════════════════════════════════════════════════════
// TRAITS
// ═══════════════════════════════════════════════════════════════════

export interface PropertyTrait {
  id: string
  nameKey: string
  descriptionKey: string
  icon: string
  isPositive: boolean
  rentMod: number
  appreciationMod: number
  occupancyMod: number
  wearMod: number
  maintenanceMod: number
}

export const PROPERTY_TRAITS: PropertyTrait[] = [
  // ── Positive ──
  {
    id: 'scenic_view',
    nameKey: 'realestate.traits.scenic_view',
    descriptionKey: 'realestate.traits.scenic_view_desc',
    icon: 'mdi:image-filter-hdr',
    isPositive: true,
    rentMod: 0.15,
    appreciationMod: 1.2,
    occupancyMod: 0.05,
    wearMod: 1.0,
    maintenanceMod: 1.0,
  },
  {
    id: 'prime_location',
    nameKey: 'realestate.traits.prime_location',
    descriptionKey: 'realestate.traits.prime_location_desc',
    icon: 'mdi:map-marker-star',
    isPositive: true,
    rentMod: 0.2,
    appreciationMod: 1.3,
    occupancyMod: 0.08,
    wearMod: 1.0,
    maintenanceMod: 1.05,
  },
  {
    id: 'modern_build',
    nameKey: 'realestate.traits.modern_build',
    descriptionKey: 'realestate.traits.modern_build_desc',
    icon: 'mdi:home-modern',
    isPositive: true,
    rentMod: 0.1,
    appreciationMod: 1.15,
    occupancyMod: 0.03,
    wearMod: 0.7,
    maintenanceMod: 0.85,
  },
  {
    id: 'energy_efficient',
    nameKey: 'realestate.traits.energy_efficient',
    descriptionKey: 'realestate.traits.energy_efficient_desc',
    icon: 'mdi:leaf',
    isPositive: true,
    rentMod: 0.05,
    appreciationMod: 1.1,
    occupancyMod: 0.02,
    wearMod: 0.9,
    maintenanceMod: 0.75,
  },
  {
    id: 'historic_charm',
    nameKey: 'realestate.traits.historic_charm',
    descriptionKey: 'realestate.traits.historic_charm_desc',
    icon: 'mdi:castle',
    isPositive: true,
    rentMod: 0.12,
    appreciationMod: 1.25,
    occupancyMod: 0.04,
    wearMod: 1.3,
    maintenanceMod: 1.2,
  },
  {
    id: 'transit_hub',
    nameKey: 'realestate.traits.transit_hub',
    descriptionKey: 'realestate.traits.transit_hub_desc',
    icon: 'mdi:train',
    isPositive: true,
    rentMod: 0.1,
    appreciationMod: 1.1,
    occupancyMod: 0.1,
    wearMod: 1.0,
    maintenanceMod: 1.0,
  },
  {
    id: 'rooftop_terrace',
    nameKey: 'realestate.traits.rooftop_terrace',
    descriptionKey: 'realestate.traits.rooftop_terrace_desc',
    icon: 'mdi:balcony',
    isPositive: true,
    rentMod: 0.08,
    appreciationMod: 1.1,
    occupancyMod: 0.03,
    wearMod: 1.05,
    maintenanceMod: 1.1,
  },
  {
    id: 'smart_home',
    nameKey: 'realestate.traits.smart_home',
    descriptionKey: 'realestate.traits.smart_home_desc',
    icon: 'mdi:home-automation',
    isPositive: true,
    rentMod: 0.12,
    appreciationMod: 1.15,
    occupancyMod: 0.04,
    wearMod: 0.85,
    maintenanceMod: 0.9,
  },

  // ── Negative (fixer-upper potential) ──
  {
    id: 'needs_renovation',
    nameKey: 'realestate.traits.needs_renovation',
    descriptionKey: 'realestate.traits.needs_renovation_desc',
    icon: 'mdi:hammer',
    isPositive: false,
    rentMod: -0.15,
    appreciationMod: 0.8,
    occupancyMod: -0.1,
    wearMod: 1.3,
    maintenanceMod: 1.4,
  },
  {
    id: 'noisy_area',
    nameKey: 'realestate.traits.noisy_area',
    descriptionKey: 'realestate.traits.noisy_area_desc',
    icon: 'mdi:volume-high',
    isPositive: false,
    rentMod: -0.1,
    appreciationMod: 0.9,
    occupancyMod: -0.08,
    wearMod: 1.0,
    maintenanceMod: 1.0,
  },
  {
    id: 'flood_zone',
    nameKey: 'realestate.traits.flood_zone',
    descriptionKey: 'realestate.traits.flood_zone_desc',
    icon: 'mdi:water-alert',
    isPositive: false,
    rentMod: -0.12,
    appreciationMod: 0.75,
    occupancyMod: -0.06,
    wearMod: 1.4,
    maintenanceMod: 1.5,
  },
  {
    id: 'old_wiring',
    nameKey: 'realestate.traits.old_wiring',
    descriptionKey: 'realestate.traits.old_wiring_desc',
    icon: 'mdi:lightning-bolt-circle',
    isPositive: false,
    rentMod: -0.05,
    appreciationMod: 0.95,
    occupancyMod: -0.03,
    wearMod: 1.2,
    maintenanceMod: 1.3,
  },
  {
    id: 'limited_parking',
    nameKey: 'realestate.traits.limited_parking',
    descriptionKey: 'realestate.traits.limited_parking_desc',
    icon: 'mdi:car-off',
    isPositive: false,
    rentMod: -0.08,
    appreciationMod: 0.9,
    occupancyMod: -0.07,
    wearMod: 1.0,
    maintenanceMod: 1.0,
  },
]

export function getTrait(id: string): PropertyTrait | undefined {
  return PROPERTY_TRAITS.find((t) => t.id === id)
}

// ═══════════════════════════════════════════════════════════════════
// PROPERTY IMPROVEMENTS — Per-property purchasable upgrades
// ═══════════════════════════════════════════════════════════════════

export type ImprovementId =
  | 'security_system'
  | 'parking_garage'
  | 'fitness_center'
  | 'concierge'
  | 'smart_systems'
  | 'solar_panels'
  | 'rooftop_garden'
  | 'lobby_renovation'
  | 'ev_charging'
  | 'coworking_space'

export interface ImprovementDef {
  id: ImprovementId
  nameKey: string
  descriptionKey: string
  icon: string
  /** Cost as fraction of property current value */
  costFraction: number
  /** Additive rent bonus */
  rentBonus: number
  /** Occupancy bonus */
  occupancyBonus: number
  /** Wear rate modifier (multiplicative, <1 = less wear) */
  wearMod: number
  /** Appreciation modifier (multiplicative) */
  appreciationMod: number
  /** Value added as fraction of property value */
  valueFraction: number
  /** Minimum property net worth tier to unlock */
  minPropertyValue: number
  /** Categories this improvement is available for */
  categories: ('Residential' | 'Commercial' | 'Mixed' | 'Hospitality' | 'Luxury' | 'Industrial')[]
}

export const IMPROVEMENTS: ImprovementDef[] = [
  {
    id: 'security_system',
    nameKey: 'realestate.improvements.security_system',
    descriptionKey: 'realestate.improvements.security_system_desc',
    icon: 'mdi:shield-lock',
    costFraction: 0.02,
    rentBonus: 0.03,
    occupancyBonus: 0.04,
    wearMod: 0.95,
    appreciationMod: 1.02,
    valueFraction: 0.015,
    minPropertyValue: 0,
    categories: ['Residential', 'Commercial', 'Mixed', 'Hospitality', 'Luxury', 'Industrial'],
  },
  {
    id: 'parking_garage',
    nameKey: 'realestate.improvements.parking_garage',
    descriptionKey: 'realestate.improvements.parking_garage_desc',
    icon: 'mdi:car',
    costFraction: 0.04,
    rentBonus: 0.05,
    occupancyBonus: 0.06,
    wearMod: 1.0,
    appreciationMod: 1.03,
    valueFraction: 0.03,
    minPropertyValue: 100_000,
    categories: ['Residential', 'Commercial', 'Mixed', 'Hospitality', 'Luxury'],
  },
  {
    id: 'fitness_center',
    nameKey: 'realestate.improvements.fitness_center',
    descriptionKey: 'realestate.improvements.fitness_center_desc',
    icon: 'mdi:dumbbell',
    costFraction: 0.03,
    rentBonus: 0.04,
    occupancyBonus: 0.05,
    wearMod: 1.02,
    appreciationMod: 1.02,
    valueFraction: 0.02,
    minPropertyValue: 500_000,
    categories: ['Residential', 'Hospitality', 'Luxury'],
  },
  {
    id: 'concierge',
    nameKey: 'realestate.improvements.concierge',
    descriptionKey: 'realestate.improvements.concierge_desc',
    icon: 'mdi:account-tie',
    costFraction: 0.025,
    rentBonus: 0.06,
    occupancyBonus: 0.07,
    wearMod: 0.92,
    appreciationMod: 1.04,
    valueFraction: 0.02,
    minPropertyValue: 1_000_000,
    categories: ['Residential', 'Hospitality', 'Luxury'],
  },
  {
    id: 'smart_systems',
    nameKey: 'realestate.improvements.smart_systems',
    descriptionKey: 'realestate.improvements.smart_systems_desc',
    icon: 'mdi:home-automation',
    costFraction: 0.035,
    rentBonus: 0.05,
    occupancyBonus: 0.03,
    wearMod: 0.88,
    appreciationMod: 1.05,
    valueFraction: 0.025,
    minPropertyValue: 500_000,
    categories: ['Residential', 'Commercial', 'Mixed', 'Hospitality', 'Luxury'],
  },
  {
    id: 'solar_panels',
    nameKey: 'realestate.improvements.solar_panels',
    descriptionKey: 'realestate.improvements.solar_panels_desc',
    icon: 'mdi:solar-panel',
    costFraction: 0.05,
    rentBonus: 0.03,
    occupancyBonus: 0.02,
    wearMod: 0.95,
    appreciationMod: 1.06,
    valueFraction: 0.04,
    minPropertyValue: 200_000,
    categories: ['Residential', 'Commercial', 'Mixed', 'Industrial'],
  },
  {
    id: 'rooftop_garden',
    nameKey: 'realestate.improvements.rooftop_garden',
    descriptionKey: 'realestate.improvements.rooftop_garden_desc',
    icon: 'mdi:flower',
    costFraction: 0.02,
    rentBonus: 0.04,
    occupancyBonus: 0.04,
    wearMod: 1.0,
    appreciationMod: 1.03,
    valueFraction: 0.015,
    minPropertyValue: 1_000_000,
    categories: ['Residential', 'Luxury', 'Hospitality'],
  },
  {
    id: 'lobby_renovation',
    nameKey: 'realestate.improvements.lobby_renovation',
    descriptionKey: 'realestate.improvements.lobby_renovation_desc',
    icon: 'mdi:door-sliding-lock',
    costFraction: 0.03,
    rentBonus: 0.05,
    occupancyBonus: 0.05,
    wearMod: 0.9,
    appreciationMod: 1.04,
    valueFraction: 0.02,
    minPropertyValue: 500_000,
    categories: ['Residential', 'Commercial', 'Hospitality', 'Luxury'],
  },
  {
    id: 'ev_charging',
    nameKey: 'realestate.improvements.ev_charging',
    descriptionKey: 'realestate.improvements.ev_charging_desc',
    icon: 'mdi:ev-station',
    costFraction: 0.015,
    rentBonus: 0.02,
    occupancyBonus: 0.03,
    wearMod: 1.0,
    appreciationMod: 1.03,
    valueFraction: 0.01,
    minPropertyValue: 100_000,
    categories: ['Residential', 'Commercial', 'Mixed', 'Luxury'],
  },
  {
    id: 'coworking_space',
    nameKey: 'realestate.improvements.coworking_space',
    descriptionKey: 'realestate.improvements.coworking_space_desc',
    icon: 'mdi:desk',
    costFraction: 0.04,
    rentBonus: 0.07,
    occupancyBonus: 0.04,
    wearMod: 1.05,
    appreciationMod: 1.04,
    valueFraction: 0.03,
    minPropertyValue: 1_000_000,
    categories: ['Commercial', 'Mixed'],
  },
]

export function getImprovement(id: ImprovementId): ImprovementDef | undefined {
  return IMPROVEMENTS.find((i) => i.id === id)
}

export function getAvailableImprovements(
  category: string,
  propertyValue: number,
  installed: ImprovementId[],
): ImprovementDef[] {
  return IMPROVEMENTS.filter(
    (imp) =>
      imp.categories.includes(category as never) &&
      propertyValue >= imp.minPropertyValue &&
      !installed.includes(imp.id),
  )
}

// ═══════════════════════════════════════════════════════════════════
// MANAGEMENT STYLES — Player-chosen property strategy
// ═══════════════════════════════════════════════════════════════════

export type ManagementStyle = 'budget' | 'standard' | 'premium' | 'luxury'

export interface ManagementStyleDef {
  id: ManagementStyle
  nameKey: string
  descKey: string
  icon: string
  expenseMod: number
  occupancyMod: number
  wearMod: number
  rentMod: number
}

export const MANAGEMENT_STYLES: ManagementStyleDef[] = [
  {
    id: 'budget',
    nameKey: 'realestate.style.budget',
    descKey: 'realestate.style.budget_desc',
    icon: 'mdi:currency-usd-off',
    expenseMod: 0.6,       // cheapest running cost
    occupancyMod: -0.08,   // tenants notice
    wearMod: 1.4,          // deferred‑maintenance penalty
    rentMod: 0.80,         // can't charge much
  },
  {
    id: 'standard',
    nameKey: 'realestate.style.standard',
    descKey: 'realestate.style.standard_desc',
    icon: 'mdi:home',
    expenseMod: 1.0,
    occupancyMod: 0,
    wearMod: 1.0,
    rentMod: 1.0,
  },
  {
    id: 'premium',
    nameKey: 'realestate.style.premium',
    descKey: 'realestate.style.premium_desc',
    icon: 'mdi:star',
    expenseMod: 1.5,       // noticeable expense jump
    occupancyMod: 0.06,
    wearMod: 0.85,
    rentMod: 1.15,
  },
  {
    id: 'luxury',
    nameKey: 'realestate.style.luxury',
    descKey: 'realestate.style.luxury_desc',
    icon: 'mdi:diamond-stone',
    expenseMod: 2.2,       // disproportionately high — only profitable on big props
    occupancyMod: 0.10,
    wearMod: 0.70,
    rentMod: 1.30,
  },
]

export function getManagementStyle(id: ManagementStyle): ManagementStyleDef {
  return MANAGEMENT_STYLES.find((s) => s.id === id) ?? MANAGEMENT_STYLES[1]
}
