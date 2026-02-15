/**
 * useBlackMarketStore — Underground Market state and operations
 *
 * Manages the black market system: rotating deals, NPC contacts,
 * reputation progression, heat/consequences, and active effects.
 * Follows the same Pinia composition API pattern as other stores.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add, sub, gte, mul } from '@renderer/core/BigNum'
import { formatCashStandalone } from '@renderer/composables/useFormat'
import { usePlayerStore } from './usePlayerStore'
import { useEventStore } from './useEventStore'
import { useStockStore } from './useStockStore'
import { useCryptoStore } from './useCryptoStore'
import { useStorageStore } from './useStorageStore'
import { STOCKS } from '@renderer/data/stocks'
import { CRYPTOS } from '@renderer/data/cryptos'
import {
  // Data & defs
  DEAL_DEFS,
  CONTACTS,
  getDealDef,
  getContactDef,
  // Reputation
  calculateTier,
  getTierProgress,
  getReputationTier,
  // Heat
  getHeatLevel,
  getHeatPenalty,
  // Balance
  DEAL_ROTATION_MIN_TICKS,
  DEAL_ROTATION_MAX_TICKS,
  MIN_DEALS_AVAILABLE,
  MAX_DEALS_AVAILABLE,
  HEAT_DECAY_PER_TICK,
  NPC_DAILY_CYCLE_TICKS,
  INVESTIGATION_MIN_TICKS,
  INVESTIGATION_MAX_TICKS,
  MAX_HEAT,
  HEAT_PER_DEAL_BASE,
  HEAT_PER_FAILED_DEAL,
  INVESTIGATION_FINE_MULT,
  MAX_ACTIVE_EFFECTS,
  MAX_INVESTIGATIONS,
  FENCE_DAILY_LIMIT,
  FENCE_SELL_MULTIPLIER,
  HACKER_MANIPULATION_RANGE,
  FIXER_COST_PER_SEVERITY,
  BROKER_BASE_ACCURACY,
  BROKER_LOYALTY_ACCURACY_BONUS,
  SMUGGLER_VALUE_MIN,
  SMUGGLER_VALUE_MAX,
  // Types
  type BlackMarketDeal,
  type ContactState,
  type ActiveBlackMarketEffect,
  type Investigation,
  type ReputationTier,
  type DealEffectType,
  type ContactId,
  type ActivityLogEntry,
  type ActivityLogSeverity,
  // Scaling
  scaleDealCost,
  scaleDealEffect,
  scaleDealConsequence,
  scaleContactCost,
  scaleContactReward,
  rollContactRisk,
  getBetrayalChance,
  getScamChance,
} from '@renderer/data/blackmarket'

// ─── Helpers ────────────────────────────────────────────────────

function uid(): string {
  return `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ─── Store ──────────────────────────────────────────────────────

export const useBlackMarketStore = defineStore('blackmarket', () => {
  // ── Reputation ─────────────────────────────────────────────
  const totalDealsCompleted = ref(0)
  const totalDealsFailed = ref(0)
  const reputationPoints = ref(0)

  // ── Heat ───────────────────────────────────────────────────
  const heat = ref(0)

  // ── Deals ──────────────────────────────────────────────────
  const availableDeals = ref<BlackMarketDeal[]>([])
  const dealCooldowns = ref<Record<string, number>>({})
  const lastDealRotationTick = ref(0)
  const nextRotationTick = ref(0)

  // ── Contacts ───────────────────────────────────────────────
  const contactStates = ref<ContactState[]>([])

  // ── Active Effects ─────────────────────────────────────────
  const activeEffects = ref<ActiveBlackMarketEffect[]>([])

  // ── Investigations ─────────────────────────────────────────
  const investigations = ref<Investigation[]>([])

  // ── Activity Log ───────────────────────────────────────────
  const activityLog = ref<ActivityLogEntry[]>([])
  const MAX_LOG_ENTRIES = 50

  // ── Lifetime Statistics ────────────────────────────────────
  const totalCashSpent = ref<Decimal>(ZERO)
  const totalCashEarned = ref<Decimal>(ZERO)
  const totalHeatAccumulated = ref(0)
  const totalInvestigations = ref(0)
  const totalFinesPaid = ref<Decimal>(ZERO)

  // ── Timing ─────────────────────────────────────────────────
  const lastTickProcessed = ref(0)

  // ─── Computed ──────────────────────────────────────────────

  const currentTier = computed((): ReputationTier => calculateTier(totalDealsCompleted.value))

  const tierProgress = computed(() => {
    const progress = getTierProgress(totalDealsCompleted.value)
    const tier = currentTier.value
    const nextTier = tier < 5 ? getReputationTier((tier + 1) as ReputationTier) : null
    const dealsToNext = nextTier ? nextTier.dealsRequired - totalDealsCompleted.value : 0
    return {
      progress,
      progressPercent: Math.round(progress * 100),
      dealsToNext,
    }
  })

  const currentTierDef = computed(() => getReputationTier(currentTier.value))

  const currentHeatLevel = computed(() => getHeatLevel(heat.value))

  const unlockedContacts = computed(() => {
    return CONTACTS.filter(c => currentTier.value >= c.unlockTier)
  })

  const activeInvestigations = computed(() =>
    investigations.value.filter(i => !i.resolved)
  )

  const netProfit = computed(() => sub(totalCashEarned.value, add(totalCashSpent.value, totalFinesPaid.value)))

  /** Time until next deal rotation in seconds */
  const timeToNextRotation = computed(() => {
    const remaining = nextRotationTick.value - lastTickProcessed.value
    return Math.max(0, remaining / 10)
  })

  // ─── Initialization ───────────────────────────────────────

  function addLogEntry(
    severity: ActivityLogSeverity,
    icon: string,
    titleKey: string,
    titleParams: Record<string, string | number>,
    source: ActivityLogEntry['source'],
    detailKey?: string,
    detailParams?: Record<string, string | number>,
  ): void {
    activityLog.value.unshift({
      id: uid(),
      tick: lastTickProcessed.value,
      severity,
      icon,
      titleKey,
      titleParams,
      detailKey,
      detailParams,
      source,
    })
    if (activityLog.value.length > MAX_LOG_ENTRIES) {
      activityLog.value = activityLog.value.slice(0, MAX_LOG_ENTRIES)
    }
  }

  function initContacts(): void {
    if (contactStates.value.length > 0) return
    contactStates.value = CONTACTS.map(c => ({
      contactId: c.id,
      loyalty: 0,
      totalInteractions: 0,
      abilityCooldowns: {},
      dailyUses: 0,
      lastDailyResetTick: 0,
    }))
  }

  // ─── Deal Generation ──────────────────────────────────────

  function generateDeals(currentTick: number): void {
    const tier = currentTier.value
    const tierDef = currentTierDef.value
    const player = usePlayerStore()
    const wealth = player.cash

    const eligible = DEAL_DEFS.filter(d => {
      // Check tier
      if (d.minTier > tier) return false
      // Check category unlock
      if (!tierDef.unlockedCategories.includes(d.category)) return false
      // Check cooldown
      if (dealCooldowns.value[d.id] && currentTick < dealCooldowns.value[d.id]) return false
      return true
    })

    if (eligible.length === 0) return

    // Weighted random selection
    const totalWeight = eligible.reduce((sum, d) => sum + d.weight, 0)
    const count = clamp(
      MIN_DEALS_AVAILABLE + Math.floor(tier * 0.8),
      MIN_DEALS_AVAILABLE,
      Math.min(MAX_DEALS_AVAILABLE, eligible.length),
    )

    const selected = new Set<string>()
    const deals: BlackMarketDeal[] = []
    let attempts = 0

    while (deals.length < count && attempts < 100) {
      attempts++
      let roll = Math.random() * totalWeight
      for (const def of eligible) {
        roll -= def.weight
        if (roll <= 0) {
          if (selected.has(def.id)) break
          selected.add(def.id)

          // Apply tier adjustments
          const riskReduction = tierDef.riskReduction
          const priceDiscount = tierDef.priceDiscount / 100
          const heatPenalty = getHeatPenalty(heat.value, 'deal_cost_increase')
          const heatRiskIncrease = getHeatPenalty(heat.value, 'risk_increase')

          // Scale cost by player wealth
          const scaledBaseCost = scaleDealCost(def.baseCost, wealth)
          const adjustedCost = D(scaledBaseCost * (1 - priceDiscount) * (1 + heatPenalty))

          // Risk: base + random variance (-5 to +15) + heat — ensures variety
          const riskVariance = randomInt(-5, 15)
          const adjustedRisk = clamp(
            def.baseRisk + riskVariance - riskReduction + heatRiskIncrease,
            1, 95,
          )

          // Scale cash-based effects by wealth
          const scaledEffects = def.successEffects.map(e => ({
            ...e,
            value: scaleDealEffect(e.type, e.value, wealth),
          }))
          const scaledConsequences = def.failConsequences.map(c => ({
            ...c,
            value: scaleDealConsequence(c.type, c.value, wealth),
          }))

          // Deal expires at next rotation
          const expiresAt = currentTick + randomInt(DEAL_ROTATION_MIN_TICKS, DEAL_ROTATION_MAX_TICKS)

          deals.push({
            id: uid(),
            defId: def.id,
            category: def.category,
            nameKey: def.nameKey,
            descKey: def.descKey,
            icon: def.icon,
            cost: adjustedCost,
            risk: adjustedRisk,
            effects: scaledEffects,
            failConsequences: scaledConsequences,
            xpReward: def.xpReward,
            repReward: def.repReward,
            availableAtTick: currentTick,
            expiresAtTick: expiresAt,
            status: 'available',
          })
          break
        }
      }
    }

    availableDeals.value = deals
    lastDealRotationTick.value = currentTick
    nextRotationTick.value = currentTick + randomInt(DEAL_ROTATION_MIN_TICKS, DEAL_ROTATION_MAX_TICKS)
  }

  // ─── Accept Deal ──────────────────────────────────────────

  function acceptDeal(dealId: string): { success: boolean; message: string } {
    const deal = availableDeals.value.find(d => d.id === dealId)
    if (!deal || deal.status !== 'available') {
      return { success: false, message: 'deal_not_available' }
    }

    const player = usePlayerStore()

    // Check cost
    if (!gte(player.cash, deal.cost)) {
      return { success: false, message: 'insufficient_cash' }
    }

    // Pay for the deal
    player.spendCash(deal.cost)
    totalCashSpent.value = add(totalCashSpent.value, deal.cost)

    // Roll for success
    const roll = Math.random() * 100
    const succeeded = roll >= deal.risk

    if (succeeded) {
      // ─── Success ────────────────────────────────────
      deal.status = 'completed'
      totalDealsCompleted.value++
      reputationPoints.value += deal.repReward

      // Apply success effects
      for (const effect of deal.effects) {
        applyDealEffect(effect.type, effect.value, effect.durationTicks, deal.id, effect.target)
      }

      // Heat from success (scaled by deal risk)
      const heatGain = HEAT_PER_DEAL_BASE * (deal.risk / 50)
      addHeat(heatGain)

      // XP reward
      player.addXp(D(deal.xpReward))

      // Set cooldown for this deal type
      const def = getDealDef(deal.defId)
      if (def) {
        dealCooldowns.value[def.id] = lastTickProcessed.value + def.cooldownTicks
      }

      addLogEntry('success', deal.icon, 'blackmarket.log_deal_success', {
        deal: deal.nameKey, cost: deal.cost.toNumber(), risk: deal.risk,
      }, 'deal')

      return { success: true, message: 'deal_success' }
    } else {
      // ─── Failure ────────────────────────────────────
      deal.status = 'failed'
      totalDealsFailed.value++

      // Apply failure consequences
      for (const consequence of deal.failConsequences) {
        if (Math.random() < consequence.probability) {
          applyConsequence(consequence.type, consequence.value, consequence.durationTicks)
        }
      }

      // Heat from failure (larger)
      addHeat(HEAT_PER_FAILED_DEAL)

      // Partial XP even on failure
      player.addXp(D(Math.ceil(deal.xpReward * 0.3)))

      addLogEntry('danger', 'mdi:alert-octagon', 'blackmarket.log_deal_failed', {
        deal: deal.nameKey, cost: deal.cost.toNumber(), risk: deal.risk,
      }, 'deal')

      return { success: false, message: 'deal_failed' }
    }
  }

  // ─── Effect Application ───────────────────────────────────

  function applyDealEffect(
    type: DealEffectType,
    value: number,
    durationTicks: number,
    sourceId: string,
    target?: string,
  ): void {
    const player = usePlayerStore()

    // Handle instant effects
    if (durationTicks === 0) {
      switch (type) {
        case 'cash_grant':
          player.earnCash(D(value))
          totalCashEarned.value = add(totalCashEarned.value, D(value))
          return
        case 'heat_reduction':
          heat.value = clamp(heat.value + value, 0, MAX_HEAT) // value is negative for reduction
          return
        case 'reputation_boost':
          reputationPoints.value += value
          return
      }
    }

    // Timed effects
    if (activeEffects.value.length >= MAX_ACTIVE_EFFECTS) return

    activeEffects.value.push({
      id: uid(),
      sourceId,
      type,
      value,
      ticksRemaining: durationTicks,
      totalDuration: durationTicks,
      target,
    })
  }

  function applyConsequence(type: string, value: number, durationTicks: number): void {
    const player = usePlayerStore()

    switch (type) {
      case 'cash_loss': {
        const loss = D(value)
        if (gte(player.cash, loss)) {
          player.spendCash(loss)
        }
        addLogEntry('danger', 'mdi:cash-minus', 'blackmarket.log_cash_loss', { amount: value }, 'deal')
        break
      }
      case 'heat_spike':
        addHeat(value)
        addLogEntry('warning', 'mdi:fire', 'blackmarket.log_heat_spike', { amount: Math.round(value) }, 'deal')
        break
      case 'income_penalty':
        if (activeEffects.value.length < MAX_ACTIVE_EFFECTS) {
          activeEffects.value.push({
            id: uid(),
            sourceId: 'consequence',
            type: 'income_boost',
            value,  // value < 1 = penalty
            ticksRemaining: durationTicks || 1200,
            totalDuration: durationTicks || 1200,
          })
        }
        break
      case 'market_crash':
        if (activeEffects.value.length < MAX_ACTIVE_EFFECTS) {
          activeEffects.value.push({
            id: uid(),
            sourceId: 'consequence',
            type: 'stock_manipulation',
            value,
            ticksRemaining: durationTicks || 600,
            totalDuration: durationTicks || 600,
            target: 'all',
          })
        }
        break
      case 'reputation_loss':
        reputationPoints.value = Math.max(0, reputationPoints.value - value)
        break
      case 'investigation':
        triggerInvestigation(Math.round(value))
        break
    }
  }

  // ─── Heat ─────────────────────────────────────────────────

  function addHeat(amount: number): void {
    heat.value = clamp(heat.value + amount, 0, MAX_HEAT)
    totalHeatAccumulated.value += Math.abs(amount)
  }

  // ─── Investigations ───────────────────────────────────────

  function triggerInvestigation(severity: number): void {
    if (activeInvestigations.value.length >= MAX_INVESTIGATIONS) return
    const player = usePlayerStore()

    const duration = randomInt(INVESTIGATION_MIN_TICKS, INVESTIGATION_MAX_TICKS)
    const fineBase = player.cash.mul(INVESTIGATION_FINE_MULT * severity)

    investigations.value.push({
      id: uid(),
      nameKey: `blackmarket.investigation_${severity}`,
      severity,
      ticksRemaining: duration,
      totalDuration: duration,
      fineAmount: fineBase,
      catchChance: 0.3 + severity * 0.1,
      resolved: false,
      caught: false,
    })

    totalInvestigations.value++
    addLogEntry('danger', 'mdi:shield-alert', 'blackmarket.log_investigation_started', {
      severity,
    }, 'investigation')
  }

  function resolveInvestigation(investigationId: string): void {
    const inv = investigations.value.find(i => i.id === investigationId)
    if (!inv || inv.resolved) return

    inv.resolved = true
    const caught = Math.random() < inv.catchChance
    inv.caught = caught

    if (caught) {
      const player = usePlayerStore()
      const fine = inv.fineAmount
      if (gte(player.cash, fine)) {
        player.spendCash(fine)
      } else {
        // Take all remaining cash if can't pay full fine
        player.spendCash(player.cash)
      }
      totalFinesPaid.value = add(totalFinesPaid.value, fine)
      // Heat spike on getting caught
      addHeat(inv.severity * 5)
      addLogEntry('danger', 'mdi:gavel', 'blackmarket.log_investigation_caught', {
        fine: fine.toNumber(), severity: inv.severity,
      }, 'investigation')
    } else {
      // Dodged it — small heat reduction
      heat.value = clamp(heat.value - 5, 0, MAX_HEAT)
      addLogEntry('success', 'mdi:shield-check', 'blackmarket.log_investigation_dodged', {
        severity: inv.severity,
      }, 'investigation')
    }
  }

  // ─── NPC Contact Actions ──────────────────────────────────

  function getContactState(contactId: ContactId): ContactState | undefined {
    return contactStates.value.find(c => c.contactId === contactId)
  }

  function useContactAbility(contactId: ContactId, abilityId: string): { success: boolean; message: string; result?: unknown } {
    const def = getContactDef(contactId)
    if (!def) return { success: false, message: 'contact_not_found' }
    if (currentTier.value < def.unlockTier) return { success: false, message: 'contact_locked' }

    const ability = def.abilities.find(a => a.id === abilityId)
    if (!ability) return { success: false, message: 'ability_not_found' }

    const state = getContactState(contactId)
    if (!state) return { success: false, message: 'contact_state_error' }

    // Check loyalty requirement
    if (state.loyalty < ability.minLoyalty) return { success: false, message: 'insufficient_loyalty' }
    // Check tier
    if (currentTier.value < ability.minTier) return { success: false, message: 'tier_too_low' }
    // Check cooldown
    if (state.abilityCooldowns[abilityId] && lastTickProcessed.value < state.abilityCooldowns[abilityId]) {
      return { success: false, message: 'on_cooldown' }
    }

    // ── Pre-flight checks (refund-safe: reject before paying) ──
    if (abilityId === 'fixer_dismiss_investigation' && activeInvestigations.value.length === 0) {
      return { success: false, message: 'no_investigations' }
    }
    if ((abilityId === 'broker_stock_tip' || abilityId === 'broker_insider_trade') && useStockStore().assets.length === 0) {
      return { success: false, message: 'no_assets' }
    }
    if (abilityId === 'broker_crypto_tip' && useCryptoStore().assets.length === 0) {
      return { success: false, message: 'no_assets' }
    }
    if (abilityId === 'hacker_manipulate_stock' && useStockStore().assets.length === 0) {
      return { success: false, message: 'no_assets' }
    }
    if (abilityId === 'hacker_manipulate_crypto' && useCryptoStore().assets.length === 0) {
      return { success: false, message: 'no_assets' }
    }
    if ((abilityId === 'fence_sell_premium' || abilityId === 'fence_bulk_deal') && useStorageStore().inventory.length === 0) {
      return { success: false, message: 'no_items' }
    }
    if (abilityId === 'fence_sell_premium' && state.dailyUses >= FENCE_DAILY_LIMIT) {
      return { success: false, message: 'daily_limit' }
    }
    if (abilityId === 'fixer_clear_event') {
      const evStore = useEventStore()
      const sys = evStore.getSystem()
      const sysState = sys.getState()
      const negEvents = sysState.activeEvents.filter((e: { eventId: string }) => {
        const evDef = sys.getDefinition(e.eventId)
        return evDef?.category === 'economy' || evDef?.category === 'disaster' || evDef?.category === 'market'
      })
      if (negEvents.length === 0) {
        return { success: false, message: 'no_events' }
      }
    }

    const player = usePlayerStore()
    const scaledCost = ability.cost > 0
      ? D(scaleContactCost(ability.cost, player.cash.toNumber()))
      : ZERO

    // Check and pay cost
    if (scaledCost.gt(ZERO)) {
      if (!gte(player.cash, scaledCost)) return { success: false, message: 'insufficient_cash' }
      player.spendCash(scaledCost)
      totalCashSpent.value = add(totalCashSpent.value, scaledCost)
    }

    // ── Betrayal / Scam risk ──
    const riskOutcome = rollContactRisk(heat.value, state.loyalty)

    if (riskOutcome === 'betrayal') {
      // Contact tipped off the authorities — investigation + heat spike
      const heatGain = 15 + randomInt(0, 10)
      addHeat(heatGain)
      triggerInvestigation(randomInt(2, 4))
      state.loyalty = Math.max(0, state.loyalty - 15)
      state.totalInteractions++
      state.abilityCooldowns[abilityId] = lastTickProcessed.value + ability.cooldownTicks * 2
      addLogEntry('danger', 'mdi:account-alert', 'blackmarket.log_betrayal', {
        contact: def.nameKey, ability: ability.id, heatGain,
      }, 'contact', 'blackmarket.log_betrayal_detail')
      return { success: false, message: 'betrayed', result: { type: 'betrayal', contact: def.nameKey, heatGain } }
    }

    if (riskOutcome === 'scam') {
      // Contact took the money and delivered nothing
      state.loyalty = Math.max(0, state.loyalty - 10)
      state.totalInteractions++
      state.abilityCooldowns[abilityId] = lastTickProcessed.value + ability.cooldownTicks
      addLogEntry('warning', 'mdi:account-cancel', 'blackmarket.log_scam', {
        contact: def.nameKey, ability: ability.id, cost: scaledCost.toNumber(),
      }, 'contact', 'blackmarket.log_scam_detail')
      return { success: false, message: 'scammed', result: { type: 'scam', contact: def.nameKey, cost: scaledCost.toNumber() } }
    }

    // ── Execute ability (no risk triggered) ──
    const result = executeAbility(contactId, abilityId, state)

    // Update state
    state.totalInteractions++
    state.loyalty = Math.min(def.maxLoyalty, state.loyalty + def.loyaltyPerUse)
    state.abilityCooldowns[abilityId] = lastTickProcessed.value + ability.cooldownTicks
    state.dailyUses++

    // Small heat gain for using contacts
    addHeat(1)

    // XP for interacting with contacts
    player.addXp(D(3))

    // Note: detailed log entries are added inside executeAbility per-ability

    return { success: true, message: 'ability_used', result }
  }

  function executeAbility(_contactId: ContactId, abilityId: string, state: ContactState): unknown {
    const player = usePlayerStore()

    switch (abilityId) {
      // ─── Broker abilities ─────────────────────────────
      case 'broker_stock_tip': {
        const stocks = useStockStore()
        const allAssets = stocks.assets
        if (!allAssets.length) {
          addLogEntry('warning', 'mdi:chart-line-variant', 'blackmarket.log_tip_no_assets', { market: 'Stock' }, 'contact')
          return { type: 'tip', failed: true, reason: 'no_assets' }
        }
        const idx = randomInt(0, allAssets.length - 1)
        const asset = allAssets[idx]
        const config = STOCKS.find(s => s.id === asset.id)
        const accuracy = BROKER_BASE_ACCURACY + (state.loyalty / 100) * BROKER_LOYALTY_ACCURACY_BONUS
        const recentChange = asset.changePercent
        const actualLikelihood = (config?.drift ?? 0) + recentChange
        const realDirection = actualLikelihood >= 0 ? 'up' : 'down'
        const isAccurate = Math.random() < accuracy
        const predictedDirection = isAccurate ? realDirection : (Math.random() > 0.5 ? 'up' : 'down')
        const arrow = predictedDirection === 'up' ? '▲' : '▼'
        const conf = Math.round(accuracy * 100)
        addLogEntry('info', 'mdi:chart-line-variant', 'blackmarket.log_stock_tip', {
          asset: asset.name, ticker: config?.ticker ?? asset.id, arrow, confidence: conf,
        }, 'contact', 'blackmarket.log_stock_tip_detail', {
          price: formatCashStandalone(asset.currentPrice), direction: predictedDirection,
        })
        return {
          type: 'tip', assetType: 'stock', assetId: asset.id, assetName: asset.name,
          ticker: config?.ticker ?? asset.id, currentPrice: asset.currentPrice,
          direction: predictedDirection, confidence: conf,
        }
      }

      case 'broker_crypto_tip': {
        const crypto = useCryptoStore()
        const allCrypto = crypto.assets
        if (!allCrypto.length) {
          addLogEntry('warning', 'mdi:currency-btc', 'blackmarket.log_tip_no_assets', { market: 'Crypto' }, 'contact')
          return { type: 'tip', failed: true, reason: 'no_assets' }
        }
        const idx = randomInt(0, allCrypto.length - 1)
        const asset = allCrypto[idx]
        const config = CRYPTOS.find(c => c.id === asset.id)
        const accuracy = BROKER_BASE_ACCURACY + (state.loyalty / 100) * BROKER_LOYALTY_ACCURACY_BONUS
        const recentChange = asset.changePercent
        const actualLikelihood = (config?.drift ?? 0) + recentChange
        const realDirection = actualLikelihood >= 0 ? 'up' : 'down'
        const isAccurate = Math.random() < accuracy
        const predictedDirection = isAccurate ? realDirection : (Math.random() > 0.5 ? 'up' : 'down')
        const arrow = predictedDirection === 'up' ? '▲' : '▼'
        const conf = Math.round(accuracy * 100)
        addLogEntry('info', 'mdi:currency-btc', 'blackmarket.log_crypto_tip', {
          asset: asset.name, ticker: config?.ticker ?? asset.id, arrow, confidence: conf,
        }, 'contact', 'blackmarket.log_crypto_tip_detail', {
          price: formatCashStandalone(asset.currentPrice), direction: predictedDirection,
        })
        return {
          type: 'tip', assetType: 'crypto', assetId: asset.id, assetName: asset.name,
          ticker: config?.ticker ?? asset.id, currentPrice: asset.currentPrice,
          direction: predictedDirection, confidence: conf,
        }
      }

      case 'broker_insider_trade': {
        const isStock = Math.random() > 0.5
        if (isStock) {
          const stocks = useStockStore()
          const sim = stocks.getSimulator()
          const allAssets = stocks.assets
          if (!allAssets.length) {
            addLogEntry('warning', 'mdi:trending-up', 'blackmarket.log_insider_no_assets', {}, 'contact')
            return { type: 'insider', failed: true, reason: 'no_assets' }
          }
          const idx = randomInt(0, allAssets.length - 1)
          const asset = allAssets[idx]
          const targetAsset = sim.getAsset(asset.id)
          const boostPct = Math.round((0.15 + Math.random() * 0.10) * 100)
          if (targetAsset) {
            targetAsset.currentPrice *= 1 + boostPct / 100
          }
          addHeat(5)
          const ticker = STOCKS.find(s => s.id === asset.id)?.ticker ?? asset.id
          addLogEntry('success', 'mdi:trending-up', 'blackmarket.log_insider_trade', {
            asset: asset.name, ticker, pct: boostPct, market: 'Stock',
          }, 'contact', 'blackmarket.log_insider_trade_detail', {
            priceBefore: formatCashStandalone(asset.currentPrice / (1 + boostPct / 100)),
            priceAfter: formatCashStandalone(asset.currentPrice),
          })
          return {
            type: 'insider', applied: true, assetType: 'stock',
            assetId: asset.id, assetName: asset.name, ticker,
            priceChange: `+${boostPct}%`,
          }
        } else {
          const crypto = useCryptoStore()
          const sim = crypto.getSimulator()
          const allCrypto = crypto.assets
          if (!allCrypto.length) {
            addLogEntry('warning', 'mdi:trending-up', 'blackmarket.log_insider_no_assets', {}, 'contact')
            return { type: 'insider', failed: true, reason: 'no_assets' }
          }
          const idx = randomInt(0, allCrypto.length - 1)
          const asset = allCrypto[idx]
          const targetAsset = sim.getAsset(asset.id)
          const boostPct = Math.round((0.15 + Math.random() * 0.10) * 100)
          if (targetAsset) {
            targetAsset.currentPrice *= 1 + boostPct / 100
          }
          addHeat(5)
          const ticker = CRYPTOS.find(c => c.id === asset.id)?.ticker ?? asset.id
          addLogEntry('success', 'mdi:trending-up', 'blackmarket.log_insider_trade', {
            asset: asset.name, ticker, pct: boostPct, market: 'Crypto',
          }, 'contact', 'blackmarket.log_insider_trade_detail', {
            priceBefore: formatCashStandalone(asset.currentPrice / (1 + boostPct / 100)),
            priceAfter: formatCashStandalone(asset.currentPrice),
          })
          return {
            type: 'insider', applied: true, assetType: 'crypto',
            assetId: asset.id, assetName: asset.name, ticker,
            priceChange: `+${boostPct}%`,
          }
        }
      }

      // ─── Fence abilities ──────────────────────────────
      case 'fence_sell_premium': {
        if (state.dailyUses >= FENCE_DAILY_LIMIT) {
          addLogEntry('warning', 'mdi:store-alert', 'blackmarket.log_fence_daily_limit', {}, 'contact')
          return { type: 'fence', sold: false, reason: 'daily_limit' }
        }
        const storage = useStorageStore()
        const inv = storage.inventory
        if (inv.length === 0) {
          addLogEntry('warning', 'mdi:package-variant-remove', 'blackmarket.log_fence_no_items', {}, 'contact')
          return { type: 'fence', sold: false, reason: 'no_items' }
        }
        const premiumMul = FENCE_SELL_MULTIPLIER + (state.loyalty / 200)
        let bestIdx = 0
        let bestVal = ZERO
        for (let i = 0; i < inv.length; i++) {
          const val = inv[i].appraisedValue ?? inv[i].baseValue
          if (val.gt(bestVal)) { bestVal = val; bestIdx = i }
        }
        const item = inv[bestIdx]
        const rawVal = item.appraisedValue ?? item.baseValue
        const finalVal = mul(rawVal, D(premiumMul))
        player.earnCash(finalVal)
        totalCashEarned.value = add(totalCashEarned.value, finalVal)
        storage.totalItemsSold++
        storage.totalSaleRevenue = add(storage.totalSaleRevenue, finalVal)
        const itemName = item.name
        const premPct = Math.round((premiumMul - 1) * 100)
        inv.splice(bestIdx, 1)
        addLogEntry('success', 'mdi:cash-plus', 'blackmarket.log_fence_sold', {
          item: itemName, premium: premPct,
        }, 'contact', 'blackmarket.log_fence_sold_detail', {
          value: formatCashStandalone(finalVal), remaining: FENCE_DAILY_LIMIT - state.dailyUses - 1,
        })
        return {
          type: 'fence', sold: true, itemName, value: finalVal.toNumber(),
          premiumPercent: premPct, dailyRemaining: FENCE_DAILY_LIMIT - state.dailyUses - 1,
        }
      }

      case 'fence_bulk_deal': {
        const storage = useStorageStore()
        const inv = storage.inventory
        if (inv.length === 0) {
          addLogEntry('warning', 'mdi:package-variant-remove', 'blackmarket.log_fence_no_items', {}, 'contact')
          return { type: 'fence_bulk', sold: false, reason: 'no_items' }
        }
        const premiumMul = FENCE_SELL_MULTIPLIER + (state.loyalty / 200)
        let totalSold = ZERO
        let count = 0
        while (inv.length > 0) {
          const item = inv[0]
          const rawVal = item.appraisedValue ?? item.baseValue
          const finalVal = mul(rawVal, D(premiumMul))
          player.earnCash(finalVal)
          totalCashEarned.value = add(totalCashEarned.value, finalVal)
          storage.totalItemsSold++
          storage.totalSaleRevenue = add(storage.totalSaleRevenue, finalVal)
          totalSold = add(totalSold, finalVal)
          count++
          inv.splice(0, 1)
        }
        const premPct = Math.round((premiumMul - 1) * 100)
        addLogEntry('success', 'mdi:cash-plus', 'blackmarket.log_fence_bulk', {
          count, premium: premPct,
        }, 'contact', 'blackmarket.log_fence_bulk_detail', {
          total: formatCashStandalone(totalSold),
        })
        return {
          type: 'fence_bulk', sold: true, itemCount: count,
          totalValue: totalSold.toNumber(), premiumPercent: premPct,
        }
      }

      // ─── Smuggler abilities ───────────────────────────
      case 'smuggler_contraband': {
        const valueRoll = SMUGGLER_VALUE_MIN + Math.random() * (SMUGGLER_VALUE_MAX - SMUGGLER_VALUE_MIN)
        const baseValue = Math.round(2000 * valueRoll)
        const scaledValue = scaleContactReward(baseValue, player.cash.toNumber())
        const cashGrant = D(scaledValue)
        player.earnCash(cashGrant)
        totalCashEarned.value = add(totalCashEarned.value, cashGrant)
        addHeat(3)
        addLogEntry('success', 'mdi:package-variant-closed-check', 'blackmarket.log_contraband', {
          value: formatCashStandalone(cashGrant),
        }, 'contact')
        return { type: 'contraband', value: cashGrant.toNumber() }
      }

      case 'smuggler_supply_run': {
        applyDealEffect('cost_reduction', 0.75, 3600, 'smuggler_supply')
        applyDealEffect('business_boost', 1.3, 3600, 'smuggler_supply')
        addHeat(5)
        addLogEntry('info', 'mdi:truck-fast', 'blackmarket.log_supply_run', {
          duration: 360,
        }, 'contact', 'blackmarket.log_supply_run_detail', {})
        return { type: 'supply_run', applied: true, durationSecs: 360 }
      }

      // ─── Hacker abilities ─────────────────────────────
      case 'hacker_manipulate_stock': {
        const stocks = useStockStore()
        const sim = stocks.getSimulator()
        const allAssets = stocks.assets
        if (!allAssets.length) {
          addLogEntry('warning', 'mdi:alert-decagram', 'blackmarket.log_hack_no_assets', { market: 'Stock' }, 'contact')
          return { type: 'hack', failed: true, reason: 'no_assets' }
        }
        const idx = randomInt(0, allAssets.length - 1)
        const asset = allAssets[idx]
        const targetAsset = sim.getAsset(asset.id)
        const direction = Math.random() > 0.5 ? 1 : -1
        const changePct = Math.round(HACKER_MANIPULATION_RANGE * (0.5 + Math.random() * 0.5) * 100)
        if (targetAsset) {
          targetAsset.currentPrice *= (1 + (changePct / 100) * direction)
          targetAsset.currentPrice = Math.max(1, targetAsset.currentPrice)
        }
        addHeat(4)
        const ticker = STOCKS.find(s => s.id === asset.id)?.ticker ?? asset.id
        const arrow = direction > 0 ? '▲' : '▼'
        addLogEntry('success', 'mdi:code-braces', 'blackmarket.log_hack_stock', {
          asset: asset.name, ticker, arrow, pct: changePct,
        }, 'contact', 'blackmarket.log_hack_stock_detail', {
          price: formatCashStandalone(asset.currentPrice),
        })
        return {
          type: 'hack', target: 'stock', assetId: asset.id, assetName: asset.name,
          ticker, direction: direction > 0 ? 'up' : 'down', magnitude: changePct,
        }
      }

      case 'hacker_manipulate_crypto': {
        const crypto = useCryptoStore()
        const sim = crypto.getSimulator()
        const allCrypto = crypto.assets
        if (!allCrypto.length) {
          addLogEntry('warning', 'mdi:alert-decagram', 'blackmarket.log_hack_no_assets', { market: 'Crypto' }, 'contact')
          return { type: 'hack', failed: true, reason: 'no_assets' }
        }
        const idx = randomInt(0, allCrypto.length - 1)
        const asset = allCrypto[idx]
        const targetAsset = sim.getAsset(asset.id)
        const direction = Math.random() > 0.5 ? 1 : -1
        const changePct = Math.round(HACKER_MANIPULATION_RANGE * (0.5 + Math.random() * 0.5) * 100)
        if (targetAsset) {
          targetAsset.currentPrice *= (1 + (changePct / 100) * direction)
          targetAsset.currentPrice = Math.max(0.0001, targetAsset.currentPrice)
        }
        addHeat(4)
        const ticker = CRYPTOS.find(c => c.id === asset.id)?.ticker ?? asset.id
        const arrow = direction > 0 ? '▲' : '▼'
        addLogEntry('success', 'mdi:code-braces', 'blackmarket.log_hack_crypto', {
          asset: asset.name, ticker, arrow, pct: changePct,
        }, 'contact', 'blackmarket.log_hack_crypto_detail', {
          price: formatCashStandalone(asset.currentPrice),
        })
        return {
          type: 'hack', target: 'crypto', assetId: asset.id, assetName: asset.name,
          ticker, direction: direction > 0 ? 'up' : 'down', magnitude: changePct,
        }
      }

      case 'hacker_ddos': {
        applyDealEffect('business_boost', 2.0, 1800, 'hacker_ddos')
        applyDealEffect('income_boost', 1.5, 1800, 'hacker_ddos')
        addHeat(15)
        addLogEntry('danger', 'mdi:web-cancel', 'blackmarket.log_ddos', {
          duration: 180,
        }, 'contact', 'blackmarket.log_ddos_detail', {})
        return { type: 'ddos', applied: true, durationSecs: 180 }
      }

      // ─── Fixer abilities ──────────────────────────────
      case 'fixer_clear_event': {
        const eventStore = useEventStore()
        const system = eventStore.getSystem()
        const sysState = system.getState()
        const negativeEvents = sysState.activeEvents.filter((e: { eventId: string }) => {
          const def = system.getDefinition(e.eventId)
          return def?.category === 'economy' || def?.category === 'disaster' || def?.category === 'market'
        })
        if (negativeEvents.length > 0) {
          const target = negativeEvents[0]
          const cost = D(FIXER_COST_PER_SEVERITY * (target.ticksRemaining / 100))
          if (gte(player.cash, cost)) {
            player.spendCash(cost)
            totalCashSpent.value = add(totalCashSpent.value, cost)
            sysState.activeEvents = sysState.activeEvents.filter(
              (e: { eventId: string }) => e.eventId !== target.eventId
            )
            system.setState(sysState)
            const storeIdx = eventStore.activeEvents.findIndex(e => e.eventId === target.eventId)
            if (storeIdx >= 0) eventStore.activeEvents.splice(storeIdx, 1)
            const eventDef = system.getDefinition(target.eventId)
            const evName = eventDef?.name ?? target.eventId
            addLogEntry('success', 'mdi:shield-check', 'blackmarket.log_event_fixed', {
              event: evName, cost: formatCashStandalone(cost),
            }, 'contact')
            return { type: 'fixed', eventId: target.eventId, eventName: evName, cost: cost.toNumber() }
          }
          addLogEntry('warning', 'mdi:cash-remove', 'blackmarket.log_fixer_no_cash', {
            cost: formatCashStandalone(cost),
          }, 'contact')
          return { type: 'fixed', failed: true, reason: 'insufficient_cash', costNeeded: cost.toNumber() }
        }
        addLogEntry('info', 'mdi:check-circle', 'blackmarket.log_fixer_no_events', {}, 'contact')
        return { type: 'fixed', failed: true, reason: 'no_events' }
      }

      case 'fixer_clear_heat': {
        const before = heat.value
        heat.value = clamp(heat.value - 40, 0, MAX_HEAT)
        const removed = Math.round(before - heat.value)
        // Side effect: burning favors costs loyalty
        state.loyalty = Math.max(0, state.loyalty - 8)
        addLogEntry('success', 'mdi:thermometer-minus', 'blackmarket.log_heat_cleared', {
          removed, heat: Math.round(heat.value),
        }, 'contact', 'blackmarket.log_heat_cleared_detail')
        return { type: 'heat_cleared', removed, newHeat: Math.round(heat.value) }
      }

      case 'fixer_dismiss_investigation': {
        const active = activeInvestigations.value
        if (active.length > 0) {
          const inv = active[0]
          // Cost = 60% of the fine — always cheaper than getting caught
          const cost = mul(inv.fineAmount, D(0.6))
          if (gte(player.cash, cost)) {
            player.spendCash(cost)
            totalCashSpent.value = add(totalCashSpent.value, cost)
            inv.resolved = true
            inv.caught = false
            // Side effects: bribing officials draws attention + burns loyalty
            const heatGain = 5 + inv.severity * 3
            addHeat(heatGain)
            state.loyalty = Math.max(0, state.loyalty - 12)
            addLogEntry('success', 'mdi:shield-off', 'blackmarket.log_investigation_dismissed', {
              cost: formatCashStandalone(cost),
            }, 'contact', 'blackmarket.log_dismiss_side_effects', {
              heatGain, loyaltyCost: 12,
            })
            return { type: 'dismissed', investigationId: inv.id, cost: cost.toNumber(), heatGain }
          }
          addLogEntry('warning', 'mdi:cash-remove', 'blackmarket.log_dismiss_no_cash', {
            cost: formatCashStandalone(cost),
          }, 'contact')
          return { type: 'dismissed', failed: true, reason: 'insufficient_cash', costNeeded: cost.toNumber() }
        }
        addLogEntry('info', 'mdi:shield-check', 'blackmarket.log_dismiss_no_inv', {}, 'contact')
        return { type: 'dismissed', failed: true, reason: 'no_investigations' }
      }

      default:
        return null
    }
  }

  // ─── Multiplier Query (for game systems) ──────────────────

  /** Get the aggregate multiplier from active black market effects */
  function getEffectMultiplier(type: DealEffectType, target?: string): number {
    let multiplier = 1
    for (const effect of activeEffects.value) {
      if (effect.type !== type) continue
      if (target && effect.target && effect.target !== target && effect.target !== 'all') continue
      multiplier *= effect.value
    }
    return multiplier
  }

  /** Check if any black market income penalty is active (from heat) */
  function getHeatIncomePenalty(): number {
    const penalty = getHeatPenalty(heat.value, 'income_penalty')
    return penalty || 1
  }

  /**
   * Get combined risk estimate (betrayal + scam %) for a contact.
   * Used by UI to show player a "danger level" before using an ability.
   */
  function getContactRiskEstimate(contactId: ContactId): number {
    const cs = getContactState(contactId)
    if (!cs) return 0
    const betrayal = getBetrayalChance(heat.value, cs.loyalty)
    const scam = getScamChance(cs.loyalty)
    return Math.round((betrayal + scam) * 100)
  }

  // ─── Tick ─────────────────────────────────────────────────

  function tick(currentTick: number): void {
    lastTickProcessed.value = currentTick

    // Initialize contacts if needed
    if (contactStates.value.length === 0) initContacts()

    // ─── Deal rotation ────────────────────────────────
    if (currentTick >= nextRotationTick.value || availableDeals.value.length === 0) {
      generateDeals(currentTick)
    }

    // ─── Expire deals ─────────────────────────────────
    availableDeals.value = availableDeals.value.filter(
      d => d.status === 'available' && currentTick < d.expiresAtTick,
    )

    // ─── Tick active effects ──────────────────────────
    const expired: string[] = []
    for (const effect of activeEffects.value) {
      if (effect.ticksRemaining > 0) {
        effect.ticksRemaining--
        if (effect.ticksRemaining <= 0) expired.push(effect.id)
      }
    }
    if (expired.length > 0) {
      activeEffects.value = activeEffects.value.filter(e => !expired.includes(e.id))
    }

    // ─── Tick investigations ──────────────────────────
    for (const inv of investigations.value) {
      if (inv.resolved) continue
      if (inv.ticksRemaining > 0) {
        inv.ticksRemaining--
        if (inv.ticksRemaining <= 0) {
          resolveInvestigation(inv.id)
        }
      }
    }
    // Clean old resolved investigations (keep last 10)
    const resolved = investigations.value.filter(i => i.resolved)
    if (resolved.length > 10) {
      const toRemove = resolved.slice(0, resolved.length - 10)
      investigations.value = investigations.value.filter(
        i => !toRemove.some(r => r.id === i.id),
      )
    }

    // ─── Heat decay ───────────────────────────────────
    if (heat.value > 0) {
      heat.value = clamp(heat.value - HEAT_DECAY_PER_TICK, 0, MAX_HEAT)
    }

    // ─── Investigation chance from heat (every 100 ticks) ──
    if (currentTick % 100 === 0) {
      const investigationChance = getHeatPenalty(heat.value, 'investigation_chance')
      if (investigationChance > 0 && Math.random() < investigationChance) {
        const severity = Math.min(5, Math.ceil(heat.value / 20))
        triggerInvestigation(severity)
      }
    }

    // ─── NPC daily cycle reset ────────────────────────
    for (const cs of contactStates.value) {
      if (currentTick - cs.lastDailyResetTick >= NPC_DAILY_CYCLE_TICKS) {
        cs.dailyUses = 0
        cs.lastDailyResetTick = currentTick
      }
    }

    // ─── Passive loyalty recovery (every 300 ticks ≈ 30s) ──
    if (currentTick % 300 === 0) {
      for (const cs of contactStates.value) {
        const cDef = getContactDef(cs.contactId as ContactId)
        if (!cDef) continue
        if (cs.loyalty < cDef.maxLoyalty) {
          cs.loyalty = Math.min(cDef.maxLoyalty, cs.loyalty + 1)
        }
      }
    }
  }

  // ─── Prestige Reset ───────────────────────────────────────

  function prestigeReset(): void {
    // Keep reputation and contacts (persistent progression)
    // Reset transient state
    availableDeals.value = []
    dealCooldowns.value = {}
    activeEffects.value = []
    heat.value = 0
    investigations.value = []
    activityLog.value = []
    lastDealRotationTick.value = 0
    nextRotationTick.value = 0
    lastTickProcessed.value = 0
  }

  function fullReset(): void {
    totalDealsCompleted.value = 0
    totalDealsFailed.value = 0
    reputationPoints.value = 0
    heat.value = 0
    availableDeals.value = []
    dealCooldowns.value = {}
    lastDealRotationTick.value = 0
    nextRotationTick.value = 0
    contactStates.value = []
    activeEffects.value = []
    investigations.value = []
    totalCashSpent.value = ZERO
    totalCashEarned.value = ZERO
    totalHeatAccumulated.value = 0
    totalInvestigations.value = 0
    totalFinesPaid.value = ZERO
    activityLog.value = []
    lastTickProcessed.value = 0
    initContacts()
  }

  // ─── Save / Load ─────────────────────────────────────────

  function exportState(): Record<string, unknown> {
    return {
      totalDealsCompleted: totalDealsCompleted.value,
      totalDealsFailed: totalDealsFailed.value,
      reputationPoints: reputationPoints.value,
      heat: heat.value,
      dealCooldowns: dealCooldowns.value,
      lastDealRotationTick: lastDealRotationTick.value,
      nextRotationTick: nextRotationTick.value,
      contactStates: contactStates.value,
      activeEffects: activeEffects.value.map(e => ({
        id: e.id,
        sourceId: e.sourceId,
        type: e.type,
        value: e.value,
        ticksRemaining: e.ticksRemaining,
        totalDuration: e.totalDuration,
        target: e.target,
      })),
      investigations: investigations.value.map(i => ({
        id: i.id,
        nameKey: i.nameKey,
        severity: i.severity,
        ticksRemaining: i.ticksRemaining,
        totalDuration: i.totalDuration,
        fineAmount: i.fineAmount,
        catchChance: i.catchChance,
        resolved: i.resolved,
        caught: i.caught,
      })),
      totalCashSpent: totalCashSpent.value,
      totalCashEarned: totalCashEarned.value,
      totalHeatAccumulated: totalHeatAccumulated.value,
      totalInvestigations: totalInvestigations.value,
      totalFinesPaid: totalFinesPaid.value,
      lastTickProcessed: lastTickProcessed.value,
      activityLog: activityLog.value,
      availableDeals: availableDeals.value,
    }
  }

  function loadFromSave(data: Record<string, unknown>): void {
    if (!data) return
    if (data.totalDealsCompleted !== undefined) totalDealsCompleted.value = data.totalDealsCompleted as number
    if (data.totalDealsFailed !== undefined) totalDealsFailed.value = data.totalDealsFailed as number
    if (data.reputationPoints !== undefined) reputationPoints.value = data.reputationPoints as number
    if (data.heat !== undefined) heat.value = data.heat as number
    if (data.dealCooldowns) dealCooldowns.value = data.dealCooldowns as Record<string, number>
    if (data.lastDealRotationTick !== undefined) lastDealRotationTick.value = data.lastDealRotationTick as number
    if (data.nextRotationTick !== undefined) nextRotationTick.value = data.nextRotationTick as number
    if (data.contactStates) contactStates.value = data.contactStates as ContactState[]
    if (data.activeEffects) activeEffects.value = data.activeEffects as ActiveBlackMarketEffect[]
    if (data.investigations) investigations.value = data.investigations as Investigation[]
    if (data.totalCashSpent !== undefined) totalCashSpent.value = data.totalCashSpent as Decimal
    if (data.totalCashEarned !== undefined) totalCashEarned.value = data.totalCashEarned as Decimal
    if (data.totalHeatAccumulated !== undefined) totalHeatAccumulated.value = data.totalHeatAccumulated as number
    if (data.totalInvestigations !== undefined) totalInvestigations.value = data.totalInvestigations as number
    if (data.totalFinesPaid !== undefined) totalFinesPaid.value = data.totalFinesPaid as Decimal
    if (data.lastTickProcessed !== undefined) lastTickProcessed.value = data.lastTickProcessed as number
    if (data.activityLog) activityLog.value = data.activityLog as ActivityLogEntry[]
    if (data.availableDeals) availableDeals.value = data.availableDeals as BlackMarketDeal[]

    // Initialize contacts if not loaded
    if (contactStates.value.length === 0) initContacts()
  }

  return {
    // State
    totalDealsCompleted,
    totalDealsFailed,
    reputationPoints,
    heat,
    availableDeals,
    dealCooldowns,
    contactStates,
    activeEffects,
    investigations,
    activityLog,
    totalCashSpent,
    totalCashEarned,
    totalHeatAccumulated,
    totalInvestigations,
    totalFinesPaid,
    lastTickProcessed,

    // Computed
    currentTier,
    tierProgress,
    currentTierDef,
    currentHeatLevel,
    unlockedContacts,
    activeInvestigations,
    netProfit,
    timeToNextRotation,

    // Actions
    initContacts,
    generateDeals,
    acceptDeal,
    getEffectMultiplier,
    getHeatIncomePenalty,
    getContactState,
    getContactRiskEstimate,
    useContactAbility,
    addLogEntry,
    tick,
    prestigeReset,
    fullReset,
    exportState,
    loadFromSave,
  }
})
