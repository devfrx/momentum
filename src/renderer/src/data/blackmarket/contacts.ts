/**
 * Black Market — NPC Contact definitions
 *
 * Five underground contacts, each with unique abilities
 * and loyalty-gated progression.
 */
import type { ContactDef } from './types'

export const CONTACTS: ContactDef[] = [
  // ─── The Broker ───────────────────────────────────────────────
  {
    id: 'broker',
    nameKey: 'blackmarket.contact_broker_name',
    titleKey: 'blackmarket.contact_broker_title',
    descKey: 'blackmarket.contact_broker_desc',
    icon: 'mdi:account-tie',
    color: '#26a69a',
    unlockTier: 0,
    loyaltyPerUse: 2,
    maxLoyalty: 100,
    abilities: [
      {
        id: 'broker_stock_tip',
        nameKey: 'blackmarket.ability_stock_tip',
        descKey: 'blackmarket.ability_stock_tip_desc',
        icon: 'mdi:chart-line',
        cost: 500,
        impactTier: 'minor',
        costWeight: 0.3,
        cooldownTicks: 3000,   // 5 min
        minLoyalty: 0,
        minTier: 0,
      },
      {
        id: 'broker_crypto_tip',
        nameKey: 'blackmarket.ability_crypto_tip',
        descKey: 'blackmarket.ability_crypto_tip_desc',
        icon: 'mdi:bitcoin',
        cost: 800,
        impactTier: 'minor',
        costWeight: 0.5,
        cooldownTicks: 3000,
        minLoyalty: 20,
        minTier: 1,
      },
      {
        id: 'broker_insider_trade',
        nameKey: 'blackmarket.ability_insider_trade',
        descKey: 'blackmarket.ability_insider_trade_desc',
        icon: 'mdi:eye',
        cost: 5000,
        impactTier: 'major',
        costWeight: 0.4,
        cooldownTicks: 9000,   // 15 min
        minLoyalty: 60,
        minTier: 3,
      },
    ],
  },

  // ─── The Fence ────────────────────────────────────────────────
  {
    id: 'fence',
    nameKey: 'blackmarket.contact_fence_name',
    titleKey: 'blackmarket.contact_fence_title',
    descKey: 'blackmarket.contact_fence_desc',
    icon: 'mdi:package-variant-closed',
    color: '#ff7043',
    unlockTier: 0,
    loyaltyPerUse: 1,
    maxLoyalty: 100,
    abilities: [
      {
        id: 'fence_sell_premium',
        nameKey: 'blackmarket.ability_fence_sell',
        descKey: 'blackmarket.ability_fence_sell_desc',
        icon: 'mdi:cash-fast',
        cost: 0,  // No cost — this IS the service
        cooldownTicks: 600,    // 1 min between sells
        minLoyalty: 0,
        minTier: 0,
      },
      {
        id: 'fence_bulk_deal',
        nameKey: 'blackmarket.ability_fence_bulk',
        descKey: 'blackmarket.ability_fence_bulk_desc',
        icon: 'mdi:package-variant',
        cost: 0,
        cooldownTicks: 1800,
        minLoyalty: 40,
        minTier: 2,
      },
      {
        id: 'fence_forge',
        nameKey: 'blackmarket.ability_fence_forge',
        descKey: 'blackmarket.ability_fence_forge_desc',
        icon: 'mdi:file-certificate',
        cost: 0,  // Scales dynamically with item value
        cooldownTicks: 3000,   // 5 min
        minLoyalty: 20,
        minTier: 1,
      },
      {
        id: 'fence_network',
        nameKey: 'blackmarket.ability_fence_network',
        descKey: 'blackmarket.ability_fence_network_desc',
        icon: 'mdi:web',
        cost: 3000,
        impactTier: 'standard',
        costWeight: 0.3,
        cooldownTicks: 9000,   // 15 min
        minLoyalty: 60,
        minTier: 3,
      },
    ],
  },

  // ─── The Smuggler ─────────────────────────────────────────────
  {
    id: 'smuggler',
    nameKey: 'blackmarket.contact_smuggler_name',
    titleKey: 'blackmarket.contact_smuggler_title',
    descKey: 'blackmarket.contact_smuggler_desc',
    icon: 'mdi:truck-fast',
    color: '#ab47bc',
    unlockTier: 1,
    loyaltyPerUse: 2,
    maxLoyalty: 100,
    abilities: [
      {
        id: 'smuggler_contraband',
        nameKey: 'blackmarket.ability_contraband',
        descKey: 'blackmarket.ability_contraband_desc',
        icon: 'mdi:box-cutter',
        cost: 2000,
        impactTier: 'standard',
        costWeight: 0.4,
        roiRatio: 2.0,
        cooldownTicks: 6000,  // 10 min
        minLoyalty: 0,
        minTier: 1,
      },
      {
        id: 'smuggler_supply_run',
        nameKey: 'blackmarket.ability_supply_run',
        descKey: 'blackmarket.ability_supply_run_desc',
        icon: 'mdi:route',
        cost: 5000,
        impactTier: 'major',
        costWeight: 0.3,
        cooldownTicks: 12000, // 20 min
        minLoyalty: 50,
        minTier: 3,
      },
    ],
  },

  // ─── The Hacker ───────────────────────────────────────────────
  {
    id: 'hacker',
    nameKey: 'blackmarket.contact_hacker_name',
    titleKey: 'blackmarket.contact_hacker_title',
    descKey: 'blackmarket.contact_hacker_desc',
    icon: 'mdi:laptop',
    color: '#42a5f5',
    unlockTier: 2,
    loyaltyPerUse: 3,
    maxLoyalty: 100,
    abilities: [
      {
        id: 'hacker_manipulate_stock',
        nameKey: 'blackmarket.ability_hack_stock',
        descKey: 'blackmarket.ability_hack_stock_desc',
        icon: 'mdi:chart-bell-curve-cumulative',
        cost: 3000,
        impactTier: 'standard',
        costWeight: 0.5,
        cooldownTicks: 6000,
        minLoyalty: 0,
        minTier: 2,
      },
      {
        id: 'hacker_manipulate_crypto',
        nameKey: 'blackmarket.ability_hack_crypto',
        descKey: 'blackmarket.ability_hack_crypto_desc',
        icon: 'mdi:currency-btc',
        cost: 4000,
        impactTier: 'standard',
        costWeight: 0.6,
        cooldownTicks: 6000,
        minLoyalty: 20,
        minTier: 2,
      },
      {
        id: 'hacker_ddos',
        nameKey: 'blackmarket.ability_ddos',
        descKey: 'blackmarket.ability_ddos_desc',
        icon: 'mdi:server-off',
        cost: 10000,
        impactTier: 'major',
        costWeight: 0.7,
        cooldownTicks: 18000, // 30 min
        minLoyalty: 70,
        minTier: 4,
      },
    ],
  },

  // ─── The Fixer ────────────────────────────────────────────────
  {
    id: 'fixer',
    nameKey: 'blackmarket.contact_fixer_name',
    titleKey: 'blackmarket.contact_fixer_title',
    descKey: 'blackmarket.contact_fixer_desc',
    icon: 'mdi:wrench',
    color: '#ef5350',
    unlockTier: 5,
    loyaltyPerUse: 5,
    maxLoyalty: 100,
    abilities: [
      {
        id: 'fixer_clear_event',
        nameKey: 'blackmarket.ability_clear_event',
        descKey: 'blackmarket.ability_clear_event_desc',
        icon: 'mdi:close-circle',
        cost: 0,  // Dynamic cost based on event severity
        cooldownTicks: 9000,
        minLoyalty: 0,
        minTier: 5,
      },
      {
        id: 'fixer_clear_heat',
        nameKey: 'blackmarket.ability_clear_heat',
        descKey: 'blackmarket.ability_clear_heat_desc',
        icon: 'mdi:snowflake',
        cost: 15000,
        impactTier: 'major',
        costWeight: 0.5,
        cooldownTicks: 18000,
        minLoyalty: 30,
        minTier: 5,
      },
      {
        id: 'fixer_dismiss_investigation',
        nameKey: 'blackmarket.ability_dismiss_investigation',
        descKey: 'blackmarket.ability_dismiss_investigation_desc',
        icon: 'mdi:gavel',
        cost: 0,  // Dynamic cost
        cooldownTicks: 36000, // 1 hour
        minLoyalty: 60,
        minTier: 5,
      },
    ],
  },
]

/** Find a contact definition by id */
export function getContactDef(contactId: string): ContactDef | undefined {
  return CONTACTS.find(c => c.id === contactId)
}
