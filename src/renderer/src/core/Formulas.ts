/**
 * Formulas — All game scaling, cost, income, and prestige formulas
 *
 * Every formula is a pure function: given inputs it returns a Decimal.
 * No side effects, easy to test, easy to tweak from a balancing spreadsheet.
 */
import Decimal from 'break_infinity.js'
import { D, ZERO, ONE, pow, mul, div, floor, max, add } from './BigNum'

/**
 * Game time unit: rates (interest, taxes, inflation…) are "per 6 hours" of real time.
 * 1 rate-period = ticksPerSecond × 3600 × 6 ticks  (= 216,000 ticks @ 10 tps).
 * Change the multiplier here to retune globally.
 */
export const TICKS_PER_RATE_PERIOD = (tps: number): number => tps * 3600 * 6

// ─── Cost formulas ──────────────────────────────────────────────────

/**
 * Standard exponential cost scaling.
 * cost(n) = baseCost × growthRate^n
 */
export function exponentialCost(baseCost: Decimal, growthRate: Decimal, owned: number): Decimal {
  return mul(baseCost, pow(growthRate, owned))
}

/**
 * Bulk-buy cost: sum of exponential costs from `owned` to `owned + count - 1`.
 * Uses geometric series formula: baseCost × (growthRate^owned) × (growthRate^count - 1) / (growthRate - 1)
 */
export function bulkCost(
  baseCost: Decimal,
  growthRate: Decimal,
  owned: number,
  count: number
): Decimal {
  if (count <= 0) return ZERO
  if (growthRate.eq(1)) return mul(baseCost, count)
  const startCost = pow(growthRate, owned)
  const endCost = pow(growthRate, owned + count)
  const numerator = endCost.sub(startCost)
  const denominator = growthRate.sub(1)
  return mul(baseCost, div(numerator, denominator))
}

/**
 * Maximum affordable count given current cash.
 * Inverse of bulkCost using logarithms.
 */
export function maxAffordable(
  cash: Decimal,
  baseCost: Decimal,
  growthRate: Decimal,
  owned: number
): number {
  if (cash.lte(0) || baseCost.lte(0)) return 0
  if (growthRate.eq(1)) {
    return Math.floor(cash.div(baseCost).toNumber())
  }
  // cash >= baseCost * g^owned * (g^n - 1) / (g - 1)
  // Solve for n: n = log_g(cash * (g-1) / (baseCost * g^owned) + 1)
  const g = growthRate
  const gOwned = pow(g, owned)
  const inner = cash.mul(g.sub(1)).div(mul(baseCost, gOwned)).add(1)
  if (inner.lte(0)) return 0
  const logInner = inner.log10()
  const logG = g.log10()
  if (!Number.isFinite(logInner) || !Number.isFinite(logG) || logG === 0) return 0
  const n = logInner / logG
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

// ─── Operational business formulas ──────────────────────────────────

/**
 * Customer demand based on price, quality, marketing, and economic conditions.
 * Uses a demand curve: lower price → more customers, higher quality → more customers.
 *
 * demand = baseCustomers × qualityFactor × marketingFactor × economyFactor × priceFactor
 *
 * priceFactor uses an inverse elasticity model:
 *   priceFactor = (optimalPrice / actualPrice) ^ elasticity
 *   where elasticity is typically 0.5–1.5
 */
export function customerDemand(
  baseCustomers: number,
  price: number,
  optimalPrice: number,
  quality: number,
  marketingBudget: number,
  economyDemandMultiplier: number,
  elasticity: number = 1.0
): number {
  // Price factor: 1.0 at optimal price, higher if price < optimal, lower if price > optimal
  const priceFactor = optimalPrice > 0 && price > 0
    ? Math.pow(optimalPrice / price, elasticity)
    : 1.0

  // Quality factor: quality 0-100, soft scales from 0.5 to 2.0
  const qualityFactor = 0.5 + (quality / 100) * 1.5

  // Marketing factor: diminishing returns — sqrt curve
  // $0 → factor 1.0, $100 → ~2.0, $1000 → ~4.16
  const marketingFactor = 1.0 + Math.sqrt(marketingBudget / 25)

  return Math.max(0, Math.floor(
    baseCustomers * priceFactor * qualityFactor * marketingFactor * economyDemandMultiplier
  ))
}

/**
 * Operating costs per tick for a business.
 * costs = (employees × salary × wageIndex) + rent + (supplyCostPerUnit × unitsProduced) + marketingBudget
 */
export function operatingCosts(
  employees: number,
  salaryPerEmployee: number,
  wageIndex: number,
  rent: number,
  supplyCostPerUnit: number,
  unitsProduced: number,
  marketingBudget: number,
  inflationIndex: number
): Decimal {
  const wages = employees * salaryPerEmployee * wageIndex
  const adjustedRent = rent * inflationIndex
  const supplies = supplyCostPerUnit * unitsProduced
  // Marketing is a chosen budget, not affected by inflation
  return D(wages + adjustedRent + supplies + marketingBudget)
}

/**
 * Business valuation based on profitability.
 * value = avgProfitPerSecond × sectorMultiplier × 1000
 * (business is worth ~1000 seconds of profit)
 * Minimum value is 10% of original purchase price.
 */
export function businessValuation(
  avgProfitPerTick: Decimal,
  purchasePrice: Decimal,
  sectorMultiplier: number = 1.0
): Decimal {
  // Value = profit × 10000 ticks (≈ 16.6 min of profit) × sector multiplier
  const profitValue = mul(mul(avgProfitPerTick, 10000), sectorMultiplier)
  // Min 10% of purchase price (can't sell for nothing)
  const minValue = mul(purchasePrice, 0.1)
  return max(profitValue, minValue)
}

/**
 * Loan interest amount per tick.
 * interestPerTick = principal × rate / ticksPerPeriod
 */
export function loanInterestPerTick(
  remainingPrincipal: Decimal,
  rate: number,
  ticksPerSecond: number = 10
): Decimal {
  const ticksPerPeriod = TICKS_PER_RATE_PERIOD(ticksPerSecond)
  return mul(remainingPrincipal, rate / ticksPerPeriod)
}

/**
 * Minimum payment per tick for an amortized loan.
 * Uses simplified amortization formula to spread principal + interest over term.
 * paymentPerTick = principal × (r × (1+r)^n) / ((1+r)^n - 1) / n
 * where r = rate/ticksPerPeriod, n = termTicks
 */
export function loanPaymentPerTick(
  principal: Decimal,
  rate: number,
  termTicks: number,
  ticksPerSecond: number = 10
): Decimal {
  if (termTicks <= 0) return ZERO
  const ticksPerPeriod = TICKS_PER_RATE_PERIOD(ticksPerSecond)
  const r = rate / ticksPerPeriod
  const n = termTicks

  if (r <= 0) {
    // Zero interest - just divide principal by term
    return div(principal, n)
  }

  // Standard amortization formula — use logarithms to avoid overflow for large n
  const onePlusR = 1 + r
  const logOnePlusR = Math.log(onePlusR)
  const nLogOnePlusR = n * logOnePlusR

  // For very large exponents (>700), Math.exp overflows to Infinity
  // In that case, the payment approaches r × principal (interest-only)
  if (nLogOnePlusR > 700) {
    return mul(principal, r)
  }

  const onePlusRtoN = Math.exp(nLogOnePlusR)
  const numerator = r * onePlusRtoN
  const denominator = onePlusRtoN - 1

  if (!Number.isFinite(denominator) || denominator <= 0) return div(principal, n)

  const paymentFactor = numerator / denominator
  if (!Number.isFinite(paymentFactor)) return mul(principal, r)

  return mul(principal, paymentFactor)
}

/**
 * Calculate total cost of a loan including all interest.
 * totalCost = paymentPerTick × termTicks
 */
export function loanTotalCost(
  principal: Decimal,
  annualRate: number,
  termTicks: number,
  ticksPerSecond: number = 10
): Decimal {
  if (termTicks <= 0) return principal
  const payment = loanPaymentPerTick(principal, annualRate, termTicks, ticksPerSecond)
  return mul(payment, termTicks)
}

/**
 * Calculate total interest paid over loan term.
 */
export function loanTotalInterest(
  principal: Decimal,
  annualRate: number,
  termTicks: number,
  ticksPerSecond: number = 10
): Decimal {
  const totalCost = loanTotalCost(principal, annualRate, termTicks, ticksPerSecond)
  return max(ZERO, totalCost.sub(principal))
}

/**
 * Calculate credit score impact from various factors.
 * Score ranges from 0-100.
 */
export function calculateCreditScore(
  paymentHistoryScore: number, // 0-35
  utilizationScore: number,    // 0-30
  creditAgeScore: number,      // 0-15
  creditMixScore: number,      // 0-10
  newCreditScore: number       // 0-10
): number {
  const total = paymentHistoryScore + utilizationScore + creditAgeScore + creditMixScore + newCreditScore
  return Math.max(0, Math.min(100, Math.round(total)))
}

/**
 * Calculate effective interest rate based on credit score.
 * Better credit = lower rates. Rate multiplier ranges from 0.5x to 2.0x.
 */
export function creditScoreToRateMultiplier(creditScore: number): number {
  // Score 0 → 2.0x rate, Score 100 → 0.5x rate
  return Math.max(0.5, Math.min(2.0, 2 - (creditScore / 100) * 1.5))
}

/**
 * Net worth calculation.
 * netWorth = cash + businessValues + portfolioValue + propertyValue + startupValue - totalDebt
 */
export function calculateNetWorth(
  cash: Decimal,
  businessValues: Decimal,
  portfolioValue: Decimal,
  propertyValue: Decimal,
  startupValue: Decimal,
  totalDebt: Decimal
): Decimal {
  const assets = cash.add(businessValues).add(portfolioValue).add(propertyValue).add(startupValue)
  return assets.sub(totalDebt)
}

// ─── Prestige formulas ──────────────────────────────────────────────

/**
 * Prestige points earned on reset.
 * Formula: floor(totalEarned / threshold) ^ exponent
 * Standard incremental formula inspired by Antimatter Dimensions.
 *
 * Balanced for moderate progression:
 * - 100M cash → 1 point
 * - 1B cash → ~3 points
 * - 10B cash → 10 points
 * - 100B cash → ~31 points
 * - 1T cash → 100 points
 */
export function prestigePointsGain(
  totalCashEarned: Decimal,
  threshold: Decimal = D(1e8),
  exponent: number = 0.5
): Decimal {
  if (totalCashEarned.lt(threshold)) return ZERO
  return floor(pow(div(totalCashEarned, threshold), exponent))
}

/**
 * Prestige multiplier applied to all income after rebirth.
 * multiplier = 1 + prestigePoints × bonusPerPoint
 */
export function prestigeMultiplier(
  prestigePoints: Decimal,
  bonusPerPoint: number = 0.1
): Decimal {
  return add(ONE, mul(prestigePoints, bonusPerPoint))
}

// ─── Market / Stock formulas ────────────────────────────────────────

/**
 * Simulate a single step of a geometric Brownian motion (GBM) price model.
 * newPrice = price × e^((drift - 0.5×vol²)×dt + vol×sqrt(dt)×Z)
 * where Z is a standard normal random variable.
 *
 * @param price Current price
 * @param drift Annual drift (expected return), e.g. 0.05 = 5%
 * @param volatility Annual volatility, e.g. 0.2 = 20%
 * @param dt Time step fraction (e.g. 1/252 for daily, 1/2520 for ~10 ticks/day)
 * @param randomZ Standard normal random number
 */
export function gbmStep(
  price: number,
  drift: number,
  volatility: number,
  dt: number,
  randomZ: number
): number {
  const exponent = (drift - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * randomZ
  return price * Math.exp(exponent)
}

/**
 * Generate a standard normal random number using Box-Muller transform.
 */
export function boxMullerRandom(): number {
  let u1 = 0
  let u2 = 0
  while (u1 === 0) u1 = Math.random()
  while (u2 === 0) u2 = Math.random()
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
}

// ─── Upgrade / Skill tree formulas ──────────────────────────────────

/**
 * Upgrade cost with polynomial + exponential scaling.
 * cost(level) = baseCost × (1 + level)^polyExp × expBase^level
 */
export function upgradeCost(
  baseCost: Decimal,
  level: number,
  polyExp: number = 2,
  expBase: number = 1.15
): Decimal {
  const polyPart = Math.pow(1 + level, polyExp)
  const expPart = Math.pow(expBase, level)
  return mul(baseCost, polyPart * expPart)
}

/**
 * Upgrade effect value: how strong the upgrade is at a given level.
 * effect(level) = baseEffect × level^scalingExp
 */
export function upgradeEffect(
  baseEffect: Decimal,
  level: number,
  scalingExp: number = 1
): Decimal {
  if (level <= 0) return ZERO
  return mul(baseEffect, Math.pow(level, scalingExp))
}

// ─── Offline progress ───────────────────────────────────────────────

/**
 * Calculate offline earnings.
 * @param incomePerSecond Current total income per second
 * @param elapsedSeconds Seconds since last save
 * @param efficiency Fraction of income earned offline (0.0–1.0)
 * @param maxHours Max hours of offline progress to credit
 */
export function offlineEarnings(
  incomePerSecond: Decimal,
  elapsedSeconds: number,
  efficiency: number = 0.5,
  maxHours: number = 24
): Decimal {
  const cappedSeconds = Math.min(elapsedSeconds, maxHours * 3600)
  return mul(mul(incomePerSecond, cappedSeconds), efficiency)
}

// ─── Gambling formulas ──────────────────────────────────────────────

/**
 * Expected value of a bet.
 * EV = (winChance × payout) - (1 - winChance) × betAmount
 */
export function expectedValue(
  betAmount: Decimal,
  winChance: number,
  payoutMultiplier: number
): Decimal {
  const win = mul(betAmount, winChance * payoutMultiplier)
  const lose = mul(betAmount, 1 - winChance)
  return win.sub(lose)
}

/**
 * Simple dice roll check.
 * @returns true if roll succeeds (random < chance)
 */
export function rollChance(chance: number): boolean {
  return Math.random() < chance
}

// ─── Real Estate formulas ───────────────────────────────────────────

/**
 * Property rent income per tick.
 * rent = baseRent × (1 + upgradeLevel × upgradeBonus) × locationMultiplier
 */
export function propertyRent(
  baseRent: Decimal,
  upgradeLevel: number,
  upgradeBonus: number = 0.15,
  locationMultiplier: number = 1.0
): Decimal {
  const upgradeMul = 1 + upgradeLevel * upgradeBonus
  return mul(mul(baseRent, upgradeMul), locationMultiplier)
}

/**
 * Property appreciation: value changes over time.
 * newValue = baseValue × (1 + appreciationRate) ^ periods
 */
export function propertyValue(
  baseValue: Decimal,
  appreciationRate: number,
  periods: number
): Decimal {
  return mul(baseValue, Math.pow(1 + appreciationRate, periods))
}

// ─── Startup investment formulas ────────────────────────────────────

/**
 * Startup valuation at exit.
 * If successful: investedAmount × returnMultiplier
 * Chance of success decreases with higher multiplier (inverse relationship).
 */
export function startupReturn(
  investedAmount: Decimal,
  returnMultiplier: number,
  isSuccessful: boolean
): Decimal {
  if (!isSuccessful) return ZERO
  return mul(investedAmount, returnMultiplier)
}

/**
 * Startup success probability based on risk tier.
 * Higher potential returns = lower success chance.
 */
export function startupSuccessChance(returnMultiplier: number): number {
  // Rough model: p = 1 / (1 + ln(multiplier))
  return 1 / (1 + Math.log(Math.max(1, returnMultiplier)))
}

// ─── Compound multiplier helper ─────────────────────────────────────

/**
 * Combine multiple multiplicative bonuses.
 * Returns the product of all multipliers.
 */
export function compoundMultipliers(...multipliers: (Decimal | number)[]): Decimal {
  let result = ONE
  for (const m of multipliers) {
    result = mul(result, m)
  }
  return result
}

/**
 * Combine multiple additive bonuses into a single multiplier.
 * result = 1 + sum(bonuses)
 */
export function additiveMultiplier(...bonuses: number[]): Decimal {
  const total = bonuses.reduce((acc, b) => acc + b, 0)
  return D(1 + total)
}

// ─── Diminishing returns helper ─────────────────────────────────────

/**
 * Soft cap with diminishing returns.
 * Below cap: returns value unchanged
 * Above cap: excess is raised to power < 1
 *
 * effective = cap + (value - cap)^softness
 */
export function softCap(
  value: Decimal,
  cap: Decimal,
  softness: number = 0.5
): Decimal {
  if (value.lte(cap)) return value
  const excess = value.sub(cap)
  return add(cap, pow(excess, softness))
}

/**
 * Hard cap: value cannot exceed maximum.
 */
export function hardCap(value: Decimal, maximum: Decimal): Decimal {
  return max(ZERO, Decimal.min(value, maximum))
}

// ─── Namespace-style export for convenient Formulas.xxx() usage ─────

/**
 * Deposit interest earned per tick.
 * interestPerTick = balance × rate / ticksPerPeriod
 */
export function depositInterestPerTick(
  balance: Decimal,
  rate: number,
  ticksPerSecond: number = 10
): Decimal {
  const ticksPerPeriod = TICKS_PER_RATE_PERIOD(ticksPerSecond)
  return mul(balance, rate / ticksPerPeriod)
}

/**
 * Project total interest earned over a deposit term.
 * Uses compound interest: A = P × (1 + r/n)^(n×t) - P
 * where n = compounds per year, t = years
 */
export function depositProjectedInterest(
  principal: Decimal,
  rate: number,
  termTicks: number,
  compoundIntervalTicks: number,
  ticksPerSecond: number = 10
): Decimal {
  if (termTicks <= 0 || rate <= 0) return ZERO
  const ticksPerPeriod = TICKS_PER_RATE_PERIOD(ticksPerSecond)
  const n = ticksPerPeriod / compoundIntervalTicks        // compounds per period
  const t = termTicks / ticksPerPeriod                    // periods
  const ratePerCompound = rate / n
  const compoundPeriods = n * t
  const growthFactor = Math.pow(1 + ratePerCompound, compoundPeriods)
  return max(ZERO, mul(principal, growthFactor - 1))
}

export const Formulas = {
  exponentialCost,
  bulkCost,
  maxAffordable,
  customerDemand,
  operatingCosts,
  businessValuation,
  loanInterestPerTick,
  loanPaymentPerTick,
  loanTotalCost,
  loanTotalInterest,
  calculateCreditScore,
  creditScoreToRateMultiplier,
  calculateNetWorth,
  prestigePointsGain,
  prestigeMultiplier,
  gbmStep,
  boxMullerRandom,
  upgradeCost,
  upgradeEffect,
  offlineEarnings,
  expectedValue,
  rollChance,
  propertyRent,
  propertyValue,
  startupReturn,
  startupSuccessChance,
  compoundMultipliers,
  additiveMultiplier,
  softCap,
  hardCap,
  depositInterestPerTick,
  depositProjectedInterest
}
