/**
 * useBankingStore — FINANX Card & Transaction management
 *
 * Tracks the player's debit card details, transaction history, card tier,
 * and card visual styles. The card number is a unique player identifier
 * (future multiplayer), generated deterministically from a seed.
 *
 * Card tiers provide passive income bonuses (integrated with useMultipliers):
 *   Standard → 0%  |  Gold → +2%  |  Platinum → +5%  |  Black → +10%
 *
 * Each tier has multiple visual styles. Players can choose from any style
 * within their current or previously unlocked tiers.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Decimal from 'break_infinity.js'
import { D, ZERO, add } from '@renderer/core/BigNum'

// ─── Types ────────────────────────────────────────────────────

export type CardTier = 'standard' | 'gold' | 'platinum' | 'black'

export type TransactionCategory =
  | 'salary'
  | 'business'
  | 'investment'
  | 'real_estate'
  | 'deposit'
  | 'loan'
  | 'shop'
  | 'storage'
  | 'blackmarket'
  | 'gambling'
  | 'prestige'
  | 'achievement'
  | 'event'
  | 'upgrade'
  | 'other'

export interface Transaction {
  id: string
  /** Unix timestamp (ms) */
  timestamp: number
  /** i18n key for the description */
  descriptionKey: string
  /** Optional params for the i18n description */
  descriptionParams?: Record<string, string | number>
  /** + for income, − for expense */
  amount: Decimal
  /** Category for icon/color mapping */
  category: TransactionCategory
  /** Current balance after this transaction */
  balanceAfter: Decimal
}

export interface CardDetails {
  /** 16-digit card number */
  number: string
  /** Expiry MM/YY */
  expiry: string
  /** 3-digit CVV */
  cvv: string
  /** IBAN-like account number */
  iban: string
  /** Card creation seed (for deterministic generation) */
  seed: number
}

export interface CardStyle {
  id: string
  /** i18n key */
  nameKey: string
  gradient: string
  accentColor: string
  textColor: string
  patternOpacity: number
}

// ─── Card Tier Thresholds (by net worth) ───────────────────────

export const TIER_ORDER: CardTier[] = ['standard', 'gold', 'platinum', 'black']

const TIER_THRESHOLDS: { tier: CardTier; minNetWorth: number; bonus: number }[] = [
  { tier: 'black', minNetWorth: 1e12, bonus: 0.1 },
  { tier: 'platinum', minNetWorth: 1e9, bonus: 0.05 },
  { tier: 'gold', minNetWorth: 1e6, bonus: 0.02 },
  { tier: 'standard', minNetWorth: 0, bonus: 0 }
]

// ─── Card Visual Styles ─────────────────────────────────────────

export const CARD_STYLES: Record<CardTier, CardStyle[]> = {
  standard: [
    {
      id: 'std_midnight',
      nameKey: 'banking.style_midnight',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      accentColor: '#64748b',
      textColor: '#e2e8f0',
      patternOpacity: 0.04
    },
    {
      id: 'std_obsidian',
      nameKey: 'banking.style_obsidian',
      gradient: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #18181b 100%)',
      accentColor: '#71717a',
      textColor: '#d4d4d8',
      patternOpacity: 0.04
    },
    {
      id: 'std_storm',
      nameKey: 'banking.style_storm',
      gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      accentColor: '#818cf8',
      textColor: '#e0e7ff',
      patternOpacity: 0.05
    }
  ],
  gold: [
    {
      id: 'gold_imperial',
      nameKey: 'banking.style_imperial',
      gradient: 'linear-gradient(135deg, #7c5a12 0%, #c5a028 40%, #d4af37 70%, #7c5a12 100%)',
      accentColor: '#d4af37',
      textColor: '#fff',
      patternOpacity: 0.06
    },
    {
      id: 'gold_amber',
      nameKey: 'banking.style_amber',
      gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 70%, #78350f 100%)',
      accentColor: '#f59e0b',
      textColor: '#fff',
      patternOpacity: 0.06
    },
    {
      id: 'gold_bronze',
      nameKey: 'banking.style_bronze',
      gradient: 'linear-gradient(135deg, #6b3a15 0%, #a0522d 40%, #cd7f32 70%, #6b3a15 100%)',
      accentColor: '#cd7f32',
      textColor: '#fff',
      patternOpacity: 0.05
    }
  ],
  platinum: [
    {
      id: 'plat_silver',
      nameKey: 'banking.style_silver',
      gradient: 'linear-gradient(135deg, #3d3d5c 0%, #7B7B8F 40%, #A8A8B8 70%, #5c5c7a 100%)',
      accentColor: '#a8a8b8',
      textColor: '#fff',
      patternOpacity: 0.06
    },
    {
      id: 'plat_arctic',
      nameKey: 'banking.style_arctic',
      gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 40%, #38bdf8 70%, #0c4a6e 100%)',
      accentColor: '#38bdf8',
      textColor: '#fff',
      patternOpacity: 0.08
    },
    {
      id: 'plat_chrome',
      nameKey: 'banking.style_chrome',
      gradient: 'linear-gradient(135deg, #44403c 0%, #78716c 40%, #a8a29e 70%, #44403c 100%)',
      accentColor: '#d6d3d1',
      textColor: '#fff',
      patternOpacity: 0.05
    }
  ],
  black: [
    {
      id: 'blk_onyx',
      nameKey: 'banking.style_onyx',
      gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 30%, #2d2d2d 60%, #0a0a0a 100%)',
      accentColor: '#d4af37',
      textColor: '#fff',
      patternOpacity: 0.03
    },
    {
      id: 'blk_carbon',
      nameKey: 'banking.style_carbon',
      gradient: 'linear-gradient(135deg, #111 0%, #1c1c1c 40%, #252525 70%, #111 100%)',
      accentColor: '#ef4444',
      textColor: '#fff',
      patternOpacity: 0.05
    },
    {
      id: 'blk_void',
      nameKey: 'banking.style_void',
      gradient: 'linear-gradient(135deg, #050510 0%, #0f0f20 40%, #151530 70%, #050510 100%)',
      accentColor: '#a855f7',
      textColor: '#fff',
      patternOpacity: 0.04
    }
  ]
}

// ─── Category → icon mapping ────────────────────────────────────

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  salary: 'mdi:briefcase',
  business: 'mdi:store',
  investment: 'mdi:chart-line',
  real_estate: 'mdi:home-city',
  deposit: 'mdi:piggy-bank',
  loan: 'mdi:bank-transfer',
  shop: 'mdi:shopping',
  storage: 'mdi:package-variant-closed',
  blackmarket: 'mdi:eye-off',
  gambling: 'mdi:cards-playing',
  prestige: 'mdi:star-circle',
  achievement: 'mdi:trophy',
  event: 'mdi:flash',
  upgrade: 'mdi:arrow-up-bold-hexagon',
  other: 'mdi:dots-horizontal-circle'
}

// ─── Helpers ──────────────────────────────────────────────────

const MAX_TRANSACTIONS = 200

/** Deterministic PRNG from seed (mulberry32) */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generateCardNumber(rng: () => number): string {
  let num = '4'
  for (let i = 1; i < 16; i++) num += Math.floor(rng() * 10).toString()
  const digits = num.split('').map(Number)
  digits[15] = 0
  let sum = 0
  for (let i = 0; i < 15; i++) {
    let d = digits[i]
    if (i % 2 === 0) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  digits[15] = (10 - (sum % 10)) % 10
  return digits.join('')
}

function generateIBAN(rng: () => number): string {
  const country = 'FX' // FINANX
  const checkDigits = (10 + Math.floor(rng() * 90)).toString()
  const bankCode = 'FNAX'
  let account = ''
  for (let i = 0; i < 12; i++) account += Math.floor(rng() * 10).toString()
  return `${country}${checkDigits} ${bankCode} ${account.slice(0, 4)} ${account.slice(4, 8)} ${account.slice(8, 12)}`
}

function generateCVV(rng: () => number): string {
  return String(100 + Math.floor(rng() * 900))
}

function generateExpiry(rng: () => number): string {
  const month = (1 + Math.floor(rng() * 12)).toString().padStart(2, '0')
  const year = (30 + Math.floor(rng() * 10)).toString()
  return `${month}/${year}`
}

function tierIndex(t: CardTier): number {
  return TIER_ORDER.indexOf(t)
}

// ─── Store ────────────────────────────────────────────────────

export const useBankingStore = defineStore('banking', () => {
  // ─── State ────────────────────────────────────────────────────

  const card = ref<CardDetails>({
    number: '',
    expiry: '',
    cvv: '',
    iban: '',
    seed: 0
  })

  /** User-editable card holder name */
  const holderName = ref('')

  const transactions = ref<Transaction[]>([])
  const totalIncome = ref<Decimal>(ZERO)
  const totalExpenses = ref<Decimal>(ZERO)
  const cardTier = ref<CardTier>('standard')
  /** Tracks the highest tier ever reached (so styles stay unlocked) */
  const highestTierUnlocked = ref<CardTier>('standard')
  /** Selected card style ID */
  const selectedStyleId = ref<string>('std_midnight')
  const lifetimeTransactions = ref(0)

  // ─── Computed ─────────────────────────────────────────────────

  /** Card number formatted with spaces: 4242 4242 4242 4242 */
  const formattedCardNumber = computed(() => {
    if (!card.value.number) return '•••• •••• •••• ••••'
    return card.value.number.replace(/(.{4})/g, '$1 ').trim()
  })

  /** Card tier bonus multiplier (e.g. 1.02 for gold) */
  const tierBonus = computed(() => {
    const entry = TIER_THRESHOLDS.find((t) => t.tier === cardTier.value)
    return 1 + (entry?.bonus ?? 0)
  })

  /** Raw bonus percentage (e.g. 2 for gold) */
  const tierBonusPct = computed(() => {
    const entry = TIER_THRESHOLDS.find((t) => t.tier === cardTier.value)
    return Math.round((entry?.bonus ?? 0) * 100)
  })

  /** The currently selected card style object */
  const activeStyle = computed<CardStyle>(() => {
    for (const tier of TIER_ORDER) {
      const style = CARD_STYLES[tier].find((s) => s.id === selectedStyleId.value)
      if (style) return style
    }
    return CARD_STYLES.standard[0]
  })

  /** All styles the player can currently choose from (up to highest unlocked tier) */
  const availableStyles = computed(() => {
    const maxIdx = tierIndex(highestTierUnlocked.value)
    const result: { tier: CardTier; styles: CardStyle[] }[] = []
    for (let i = 0; i <= maxIdx; i++) {
      result.push({ tier: TIER_ORDER[i], styles: CARD_STYLES[TIER_ORDER[i]] })
    }
    return result
  })

  /** All tiers with lock status */
  const allTierStyles = computed(() => {
    const maxIdx = tierIndex(highestTierUnlocked.value)
    return TIER_ORDER.map((tier, i) => ({
      tier,
      styles: CARD_STYLES[tier],
      unlocked: i <= maxIdx,
      threshold: TIER_THRESHOLDS.find((t) => t.tier === tier)!.minNetWorth
    }))
  })

  /** Tier display config (icon, label i18n key) */
  const tierConfig = computed(() => {
    const configs: Record<CardTier, { labelKey: string; icon: string }> = {
      standard: { labelKey: 'banking.tier_standard', icon: 'mdi:credit-card-outline' },
      gold: { labelKey: 'banking.tier_gold', icon: 'mdi:credit-card' },
      platinum: { labelKey: 'banking.tier_platinum', icon: 'mdi:credit-card-chip-outline' },
      black: { labelKey: 'banking.tier_black', icon: 'mdi:credit-card-chip' }
    }
    return configs[cardTier.value]
  })

  /** Recent transactions (last 50 for display) */
  const recentTransactions = computed(() => transactions.value.slice(0, 50))

  /** Today's transactions */
  const todayTransactions = computed(() => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const ts = startOfDay.getTime()
    return transactions.value.filter((t) => t.timestamp >= ts)
  })

  /** Net flow today */
  const todayNetFlow = computed(() => {
    let total = ZERO
    for (const tx of todayTransactions.value) total = add(total, tx.amount)
    return total
  })

  // ─── Actions ──────────────────────────────────────────────────

  /** Initialize card details (only once, on first game creation) */
  function initCard(): void {
    if (card.value.number) return
    const seed = Date.now() ^ (Math.random() * 0xffffffff)
    _generateCard(seed)
  }

  function _generateCard(seed: number): void {
    const rng = mulberry32(seed)
    card.value = {
      number: generateCardNumber(rng),
      expiry: generateExpiry(rng),
      cvv: generateCVV(rng),
      iban: generateIBAN(rng),
      seed
    }
    selectedStyleId.value = CARD_STYLES.standard[0].id
  }

  /** Set card holder name (user choice) */
  function setHolderName(name: string): void {
    holderName.value = name.toUpperCase().slice(0, 30)
  }

  /** Select a card visual style */
  function setCardStyle(styleId: string): void {
    const maxIdx = tierIndex(highestTierUnlocked.value)
    for (let i = 0; i <= maxIdx; i++) {
      if (CARD_STYLES[TIER_ORDER[i]].find((s) => s.id === styleId)) {
        selectedStyleId.value = styleId
        return
      }
    }
  }

  /** Record a transaction */
  function recordTransaction(
    descriptionKey: string,
    amount: Decimal,
    category: TransactionCategory,
    currentBalance: Decimal,
    descriptionParams?: Record<string, string | number>
  ): void {
    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      descriptionKey,
      descriptionParams,
      amount,
      category,
      balanceAfter: currentBalance
    }

    transactions.value.unshift(tx)
    lifetimeTransactions.value++

    if (amount.gt(0)) {
      totalIncome.value = add(totalIncome.value, amount)
    } else {
      totalExpenses.value = add(totalExpenses.value, amount.abs())
    }

    if (transactions.value.length > MAX_TRANSACTIONS) {
      transactions.value = transactions.value.slice(0, MAX_TRANSACTIONS)
    }
  }

  /**
   * Batch-record an aggregated income transaction.
   * Used by the game loop to avoid one TX per tick.
   */
  function recordPeriodicIncome(
    descriptionKey: string,
    amount: Decimal,
    category: TransactionCategory,
    currentBalance: Decimal,
    descriptionParams?: Record<string, string | number>
  ): void {
    if (amount.lte(0)) return
    recordTransaction(descriptionKey, amount, category, currentBalance, descriptionParams)
  }

  /** Update card tier based on net worth */
  function updateCardTier(netWorth: Decimal): void {
    const nw = netWorth.toNumber()
    let newTier: CardTier = 'standard'
    for (const entry of TIER_THRESHOLDS) {
      if (nw >= entry.minNetWorth) {
        newTier = entry.tier
        break
      }
    }

    const oldTierIdx = tierIndex(cardTier.value)
    const newTierIdx = tierIndex(newTier)
    cardTier.value = newTier

    // Track highest unlocked (never goes down)
    if (newTierIdx > tierIndex(highestTierUnlocked.value)) {
      highestTierUnlocked.value = newTier
      selectedStyleId.value = CARD_STYLES[newTier][0].id
    }

    // If tier went UP past previous, auto-switch to the new tier's style
    if (newTierIdx > oldTierIdx && newTierIdx <= tierIndex(highestTierUnlocked.value)) {
      selectedStyleId.value = CARD_STYLES[newTier][0].id
    }
  }

  /** Prestige reset — keep card details but clear transactions */
  function prestigeReset(): void {
    transactions.value = []
    totalIncome.value = ZERO
    totalExpenses.value = ZERO
    // Card, holder name, selected style, and highest tier persist
  }

  /** Load from save */
  function loadFromSave(data: Record<string, unknown>): void {
    const d = data as Record<string, unknown>
    if (d.card && typeof d.card === 'object') {
      const c = d.card as Record<string, unknown>
      card.value = {
        number: (c.number as string) || '',
        expiry: (c.expiry as string) || '',
        cvv: (c.cvv as string) || '',
        iban: (c.iban as string) || '',
        seed: (c.seed as number) || 0
      }
    }
    if (typeof d.holderName === 'string') holderName.value = d.holderName
    if (d.transactions && Array.isArray(d.transactions)) {
      transactions.value = d.transactions as Transaction[]
    }
    if (d.totalIncome) totalIncome.value = D(d.totalIncome as string | number)
    if (d.totalExpenses) totalExpenses.value = D(d.totalExpenses as string | number)
    if (typeof d.cardTier === 'string') cardTier.value = d.cardTier as CardTier
    if (typeof d.highestTierUnlocked === 'string') {
      highestTierUnlocked.value = d.highestTierUnlocked as CardTier
    }
    if (typeof d.selectedStyleId === 'string') selectedStyleId.value = d.selectedStyleId
    if (typeof d.lifetimeTransactions === 'number') {
      lifetimeTransactions.value = d.lifetimeTransactions
    }
  }

  /** Export for save */
  function exportState() {
    return {
      card: { ...card.value },
      holderName: holderName.value,
      transactions: transactions.value.map((tx) => ({
        id: tx.id,
        timestamp: tx.timestamp,
        descriptionKey: tx.descriptionKey,
        descriptionParams: tx.descriptionParams,
        amount: tx.amount,
        category: tx.category,
        balanceAfter: tx.balanceAfter
      })),
      totalIncome: totalIncome.value,
      totalExpenses: totalExpenses.value,
      cardTier: cardTier.value,
      highestTierUnlocked: highestTierUnlocked.value,
      selectedStyleId: selectedStyleId.value,
      lifetimeTransactions: lifetimeTransactions.value
    }
  }

  return {
    // State
    card,
    holderName,
    transactions,
    totalIncome,
    totalExpenses,
    cardTier,
    highestTierUnlocked,
    selectedStyleId,
    lifetimeTransactions,
    // Computed
    formattedCardNumber,
    tierBonus,
    tierBonusPct,
    activeStyle,
    availableStyles,
    allTierStyles,
    tierConfig,
    recentTransactions,
    todayTransactions,
    todayNetFlow,
    // Actions
    initCard,
    setHolderName,
    setCardStyle,
    recordTransaction,
    recordPeriodicIncome,
    updateCardTier,
    prestigeReset,
    loadFromSave,
    exportState
  }
})
