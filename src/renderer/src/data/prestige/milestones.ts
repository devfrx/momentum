/**
 * Prestige Milestones — Achievement-like unlocks for prestige progress
 *
 * Milestones are passive bonuses that unlock automatically when conditions are met.
 * They provide stacking bonuses that encourage continued prestige progression.
 */
import { D } from '@renderer/core/BigNum'
import type { MilestoneDef } from './types'

export const PRESTIGE_MILESTONES: MilestoneDef[] = [
  // ─── Total Points Milestones ────────────────────────────────────
  {
    id: 'ms_points_10',
    name: 'Point Collector',
    description: 'Accumulate 10 total prestige points across all rebirths.',
    icon: 'mdi:star',
    condition: { type: 'total_points', value: D(10) },
    rewards: [{ type: 'global_multiplier', value: 0.008 }],
  },
  {
    id: 'ms_points_50',
    name: 'Point Hoarder',
    description: 'Accumulate 50 total prestige points.',
    icon: 'mdi:star-half-full',
    condition: { type: 'total_points', value: D(50) },
    rewards: [{ type: 'prestige_gain', value: 0.015 }],
  },
  {
    id: 'ms_points_100',
    name: 'Century Club',
    description: 'Accumulate 100 total prestige points.',
    icon: 'mdi:star-circle',
    condition: { type: 'total_points', value: D(100) },
    rewards: [
      { type: 'global_multiplier', value: 0.015 },
      { type: 'starting_cash', value: 1000 },
    ],
  },
  {
    id: 'ms_points_500',
    name: 'Half Millennium',
    description: 'Accumulate 500 total prestige points.',
    icon: 'mdi:star-shooting',
    condition: { type: 'total_points', value: D(500) },
    rewards: [
      { type: 'prestige_gain', value: 0.025 },
      { type: 'xp_gain', value: 0.015 },
    ],
  },
  {
    id: 'ms_points_1000',
    name: 'Grand Master',
    description: 'Accumulate 1,000 total prestige points.',
    icon: 'mdi:star-four-points',
    condition: { type: 'total_points', value: D(1000) },
    rewards: [
      { type: 'global_multiplier', value: 0.03 },
      { type: 'starting_cash', value: 10000 },
      { type: 'starting_xp', value: 500 },
    ],
  },
  {
    id: 'ms_points_5000',
    name: 'Prestige Virtuoso',
    description: 'Accumulate 5,000 total prestige points.',
    icon: 'mdi:star-face',
    condition: { type: 'total_points', value: D(5000) },
    rewards: [
      { type: 'global_multiplier', value: 0.05 },
      { type: 'prestige_gain', value: 0.04 },
    ],
  },
  {
    id: 'ms_points_10000',
    name: 'Eternal Collector',
    description: 'Accumulate 10,000 total prestige points.',
    icon: 'mdi:star-box',
    condition: { type: 'total_points', value: D(10000) },
    rewards: [
      { type: 'global_multiplier', value: 0.08 },
      { type: 'starting_cash', value: 100000 },
      { type: 'offline_bonus', value: 0.03 },
    ],
  },

  // ─── Rebirth Count Milestones ───────────────────────────────────
  {
    id: 'ms_rebirth_1',
    name: 'First Rebirth',
    description: 'Complete your first prestige rebirth.',
    icon: 'mdi:reload',
    condition: { type: 'rebirths', value: 1 },
    rewards: [{ type: 'prestige_gain', value: 0.008 }],
  },
  {
    id: 'ms_rebirth_5',
    name: 'Cycle Veteran',
    description: 'Complete 5 prestige rebirths.',
    icon: 'mdi:sync',
    condition: { type: 'rebirths', value: 5 },
    rewards: [
      { type: 'job_efficiency', value: 0.015 },
      { type: 'starting_cash', value: 500 },
    ],
  },
  {
    id: 'ms_rebirth_10',
    name: 'Decade of Rebirths',
    description: 'Complete 10 prestige rebirths.',
    icon: 'mdi:autorenew',
    condition: { type: 'rebirths', value: 10 },
    rewards: [
      { type: 'prestige_gain', value: 0.025 },
      { type: 'global_multiplier', value: 0.015 },
    ],
  },
  {
    id: 'ms_rebirth_25',
    name: 'Silver Jubilee',
    description: 'Complete 25 prestige rebirths.',
    icon: 'mdi:restart',
    condition: { type: 'rebirths', value: 25 },
    rewards: [
      { type: 'global_multiplier', value: 0.03 },
      { type: 'starting_xp', value: 1000 },
      { type: 'loan_discount', value: 0.003 },
    ],
  },
  {
    id: 'ms_rebirth_50',
    name: 'Golden Cycle',
    description: 'Complete 50 prestige rebirths.',
    icon: 'mdi:history',
    condition: { type: 'rebirths', value: 50 },
    rewards: [
      { type: 'global_multiplier', value: 0.05 },
      { type: 'prestige_gain', value: 0.04 },
      { type: 'offline_bonus', value: 0.025 },
    ],
  },
  {
    id: 'ms_rebirth_100',
    name: 'Century of Lives',
    description: 'Complete 100 prestige rebirths.',
    icon: 'mdi:infinity',
    condition: { type: 'rebirths', value: 100 },
    rewards: [
      { type: 'global_multiplier', value: 0.08 },
      { type: 'prestige_gain', value: 0.06 },
      { type: 'starting_cash', value: 1000000 },
    ],
  },

  // ─── Upgrade Milestones ─────────────────────────────────────────
  {
    id: 'ms_upgrades_5',
    name: 'Upgrade Enthusiast',
    description: 'Purchase 5 prestige upgrade levels.',
    icon: 'mdi:arrow-up-bold-box',
    condition: { type: 'upgrades_bought', value: 5 },
    rewards: [{ type: 'prestige_gain', value: 0.008 }],
  },
  {
    id: 'ms_upgrades_25',
    name: 'Upgrade Collector',
    description: 'Purchase 25 prestige upgrade levels.',
    icon: 'mdi:arrow-up-bold-circle',
    condition: { type: 'upgrades_bought', value: 25 },
    rewards: [
      { type: 'global_multiplier', value: 0.015 },
      { type: 'cost_reduction', value: 0.008 },
    ],
  },
  {
    id: 'ms_upgrades_50',
    name: 'Upgrade Master',
    description: 'Purchase 50 prestige upgrade levels.',
    icon: 'mdi:trophy-award',
    condition: { type: 'upgrades_bought', value: 50 },
    rewards: [
      { type: 'prestige_gain', value: 0.03 },
      { type: 'xp_gain', value: 0.02 },
    ],
  },
]
