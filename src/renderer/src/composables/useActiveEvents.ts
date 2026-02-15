/**
 * useActiveEvents — Composable for active event display and per-route impact analysis
 *
 * Maps EventSystem effects to route names so each page can show
 * which events are currently influencing its economy.
 */
import { computed } from 'vue'
import { useEventStore } from '@renderer/stores/useEventStore'
import { useFormat } from './useFormat'
import type { ActiveEvent, EventEffect, EventEffectType } from '@renderer/core/EventSystem'
import type { RouteName } from '@renderer/router'

// ─── Types ──────────────────────────────────────────────────────

export interface EnrichedActiveEvent {
  id: string
  name: string
  description: string
  icon: string
  category: string
  timeRemaining: number
  durationTotal: number
  progress: number
  effects: EnrichedEffect[]
  isPositive: boolean
}

export interface EnrichedEffect {
  type: EventEffectType
  value: number
  target?: string
  /** i18n key for the effect description */
  labelKey: string
  /** interpolation params for i18n */
  labelParams: Record<string, string | number>
  isPositive: boolean
}

export interface RouteEventImpact {
  event: EnrichedActiveEvent
  relevantEffects: EnrichedEffect[]
}

// ─── Effect → Route mapping ─────────────────────────────────────

/**
 * Which routes are affected by each effect type + target combination.
 * `null` target means the effect is global (affects specified routes).
 */
const EFFECT_ROUTE_MAP: Array<{
  type: EventEffectType
  target?: string
  routes: RouteName[]
}> = [
  // Income multipliers
  { type: 'income_multiplier', routes: ['business', 'stocks', 'crypto', 'realestate', 'deposits', 'investments'] },
  { type: 'income_multiplier', target: 'stocks', routes: ['stocks'] },
  { type: 'income_multiplier', target: 'business', routes: ['business'] },
  { type: 'income_multiplier', target: 'crypto', routes: ['crypto'] },
  { type: 'income_multiplier', target: 'realestate', routes: ['realestate'] },

  // Cost multipliers
  { type: 'cost_multiplier', routes: ['business'] },

  // Click multiplier
  { type: 'click_multiplier', routes: ['business'] },

  // Market effects
  { type: 'market_drift', routes: ['stocks', 'crypto'] },
  { type: 'market_condition', routes: ['stocks', 'crypto'] },

  // Sector boosts
  { type: 'sector_boost', target: 'gambling', routes: ['gambling'] },
  { type: 'sector_boost', target: 'xp', routes: ['skills'] },
  { type: 'sector_boost', target: 'business', routes: ['business'] },
  { type: 'sector_penalty', target: 'gambling', routes: ['gambling'] },
  { type: 'sector_penalty', target: 'business', routes: ['business'] },

  // Prestige
  { type: 'prestige_bonus', routes: ['prestige'] },

  // Loans
  { type: 'loan_rate_modifier', routes: ['loans'] },
  { type: 'credit_score_modifier', routes: ['loans'] },

  // Deposits
  { type: 'deposit_rate_modifier', routes: ['deposits'] },

  // Startups / Investments
  { type: 'startup_success_modifier', routes: ['investments'] },
  { type: 'startup_return_modifier', routes: ['investments'] },
  { type: 'research_cost_modifier', routes: ['investments'] },

  // Instant effects (shown on dashboard)
  { type: 'cash_grant', routes: ['dashboard'] },
  { type: 'cash_loss', routes: ['dashboard'] },
]

// ─── Effect label helpers ───────────────────────────────────────

function effectLabelKey(effect: EventEffect): string {
  const base = 'events.effects.'
  if (effect.target) {
    return `${base}${effect.type}_${effect.target}`
  }
  return `${base}${effect.type}`
}

function isPositiveEffect(effect: EventEffect): boolean {
  switch (effect.type) {
    case 'income_multiplier':
    case 'sector_boost':
    case 'click_multiplier':
    case 'cash_grant':
    case 'prestige_bonus':
    case 'unlock':
      return effect.value > 1 || effect.value > 0
    case 'cost_multiplier':
    case 'cash_loss':
    case 'sector_penalty':
      return effect.value < 1
    case 'loan_rate_modifier':
      return effect.value < 0 // negative = cheaper loans = good
    case 'credit_score_modifier':
      return effect.value > 0
    case 'deposit_rate_modifier':
      return effect.value > 0
    case 'startup_success_modifier':
      return effect.value > 0
    case 'startup_return_modifier':
      return effect.value > 0
    case 'research_cost_modifier':
      return effect.value < 0 // negative = cheaper = good
    default:
      return effect.value >= 1
  }
}

function formatEffectValue(effect: EventEffect): string {
  switch (effect.type) {
    case 'income_multiplier':
    case 'cost_multiplier':
    case 'click_multiplier':
    case 'sector_boost':
    case 'sector_penalty':
      return `×${effect.value}`

    case 'loan_rate_modifier':
    case 'deposit_rate_modifier':
    case 'startup_success_modifier':
    case 'startup_return_modifier':
    case 'research_cost_modifier': {
      const pct = Math.round(effect.value * 100)
      return pct >= 0 ? `+${pct}%` : `${pct}%`
    }

    case 'credit_score_modifier':
      return effect.value >= 0 ? `+${effect.value}` : `${effect.value}`

    case 'cash_grant':
    case 'cash_loss':
      return `$${effect.value}`

    case 'prestige_bonus':
      return `+${Math.round(effect.value * 100)}%`

    default:
      return String(effect.value)
  }
}

// ─── Composable ─────────────────────────────────────────────────

export function useActiveEvents() {
  const eventStore = useEventStore()
  const { formatTime } = useFormat()

  /** All active events enriched with definition data */
  const enrichedEvents = computed<EnrichedActiveEvent[]>(() => {
    const system = eventStore.getSystem()
    return eventStore.activeEvents.map((ae: ActiveEvent) => {
      const def = system.getDefinition(ae.eventId)
      const durationTotal = def?.durationTicks ?? ae.ticksRemaining
      const progress = durationTotal > 0
        ? ((durationTotal - ae.ticksRemaining) / durationTotal) * 100
        : 100

      const effects: EnrichedEffect[] = ae.effects.map((eff) => ({
        type: eff.type,
        value: eff.value,
        target: eff.target,
        labelKey: effectLabelKey(eff),
        labelParams: { value: formatEffectValue(eff) },
        isPositive: isPositiveEffect(eff),
      }))

      const isPositive = effects.length > 0
        ? effects.filter(e => e.isPositive).length >= effects.filter(e => !e.isPositive).length
        : true

      return {
        id: ae.eventId,
        name: def?.name ?? ae.eventId,
        description: def?.description ?? '',
        icon: def?.icon ?? 'mdi:alert-circle',
        category: def?.category ?? 'global',
        timeRemaining: ae.ticksRemaining / 10,
        durationTotal: durationTotal / 10,
        progress,
        effects,
        isPositive,
      }
    })
  })

  /** Events relevant to a specific route */
  function eventsForRoute(routeName: RouteName | string): RouteEventImpact[] {
    const impacts: RouteEventImpact[] = []

    for (const event of enrichedEvents.value) {
      const relevantEffects = event.effects.filter((eff) => {
        return EFFECT_ROUTE_MAP.some(
          (mapping) =>
            mapping.type === eff.type &&
            mapping.target === eff.target &&
            mapping.routes.includes(routeName as RouteName)
        )
      })

      // Also include untargeted effects that match a mapping without target
      const globalEffects = event.effects.filter((eff) => {
        if (eff.target) return false // already handled above
        return EFFECT_ROUTE_MAP.some(
          (mapping) =>
            mapping.type === eff.type &&
            !mapping.target &&
            mapping.routes.includes(routeName as RouteName)
        )
      })

      const combined = [...new Set([...relevantEffects, ...globalEffects])]

      if (combined.length > 0) {
        impacts.push({ event, relevantEffects: combined })
      }
    }

    return impacts
  }

  /** Computed version for current route (pass route name reactively) */
  function useRouteEvents(routeName: () => string) {
    return computed(() => eventsForRoute(routeName()))
  }

  return {
    enrichedEvents,
    eventsForRoute,
    useRouteEvents,
    formatTime,
  }
}
