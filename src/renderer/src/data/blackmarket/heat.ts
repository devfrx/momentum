/**
 * Black Market — Heat system definitions
 */
import type { HeatThresholdDef } from './types'

export const HEAT_THRESHOLDS: HeatThresholdDef[] = [
  {
    level: 0,
    minHeat: 0,
    nameKey: 'blackmarket.heat_0',
    icon: 'mdi:shield-check',
    color: '#4caf50',
    penalties: [],
  },
  {
    level: 1,
    minHeat: 20,
    nameKey: 'blackmarket.heat_1',
    icon: 'mdi:alert-circle-outline',
    color: '#8bc34a',
    penalties: [
      { type: 'deal_cost_increase', value: 0.05 },
    ],
  },
  {
    level: 2,
    minHeat: 40,
    nameKey: 'blackmarket.heat_2',
    icon: 'mdi:alert',
    color: '#ff9800',
    penalties: [
      { type: 'deal_cost_increase', value: 0.15 },
      { type: 'risk_increase', value: 5 },
    ],
  },
  {
    level: 3,
    minHeat: 60,
    nameKey: 'blackmarket.heat_3',
    icon: 'mdi:fire',
    color: '#f44336',
    penalties: [
      { type: 'deal_cost_increase', value: 0.25 },
      { type: 'risk_increase', value: 10 },
      { type: 'investigation_chance', value: 0.03 },
    ],
  },
  {
    level: 4,
    minHeat: 80,
    nameKey: 'blackmarket.heat_4',
    icon: 'mdi:fire-alert',
    color: '#d32f2f',
    penalties: [
      { type: 'income_penalty', value: 0.90 },
      { type: 'deal_cost_increase', value: 0.40 },
      { type: 'risk_increase', value: 20 },
      { type: 'investigation_chance', value: 0.08 },
    ],
  },
  {
    level: 5,
    minHeat: 95,
    nameKey: 'blackmarket.heat_5',
    icon: 'mdi:skull-crossbones',
    color: '#b71c1c',
    penalties: [
      { type: 'income_penalty', value: 0.75 },
      { type: 'deal_cost_increase', value: 0.60 },
      { type: 'risk_increase', value: 35 },
      { type: 'investigation_chance', value: 0.15 },
    ],
  },
]

/** Get current heat level from heat value */
export function getHeatLevel(heat: number): HeatThresholdDef {
  for (let i = HEAT_THRESHOLDS.length - 1; i >= 0; i--) {
    if (heat >= HEAT_THRESHOLDS[i].minHeat) return HEAT_THRESHOLDS[i]
  }
  return HEAT_THRESHOLDS[0]
}

/** Get aggregate heat penalty value for a given type */
export function getHeatPenalty(heat: number, type: string): number {
  const level = getHeatLevel(heat)
  const penalty = level.penalties.find(p => p.type === type)
  return penalty?.value ?? 0
}
