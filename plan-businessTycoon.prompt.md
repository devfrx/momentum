## Plan: Incremental Business Tycoon — Electron + Vue 3

Un clicker/idle incrementale dove il giocatore parte da zero e costruisce un impero economico attraverso click, business, investimenti, immobili, crypto, gambling e prestige. Stack: **Vue 3 + PrimeVue + Pinia + Electron (via electron-vite) + LowDB + GitHub Gist per cloud saves**. Si usa **break_infinity.js** per gestire numeri astronomici e **Chart.js** (integrato in PrimeVue) per grafici finanziari. Iconify bundled offline tramite `@iconify/json`.

---

### Steps

**Step 1 — Scaffold del progetto**
- Creare il progetto con `npm create @quick-start/electron@latest business-tycoon -- --template vue-ts`
- Installare le dipendenze principali: `vue-router`, `pinia`, `primevue`, `@primeuix/themes`, `@iconify/vue`, `@iconify/json`, `break_infinity.js`, `chart.js`, `lowdb`
- DevDeps: `electron-builder`, `@electron-toolkit/preload`, `sass`

**Step 2 — Struttura del progetto**

```
business-tycoon/
├── src/
│   ├── main/                         # Electron main process
│   │   ├── index.ts                  # Window creation, app lifecycle
│   │   ├── ipc/
│   │   │   ├── save.ipc.ts           # Handlers save/load locale (LowDB)
│   │   │   └── cloud.ipc.ts          # Handlers GitHub Gist save/load
│   │   ├── database/
│   │   │   ├── db.ts                 # LowDB init, path: userData/savegame.json
│   │   │   └── schema.ts            # TypeScript interface del save file
│   │   └── services/
│   │       └── gist.service.ts       # Wrapper API GitHub Gist
│   │
│   ├── preload/
│   │   ├── index.ts                  # contextBridge: espone API al renderer
│   │   └── index.d.ts               # Tipi per window.api
│   │
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.ts               # Bootstrap Vue + PrimeVue + Router + Pinia
│           ├── App.vue
│           ├── core/                 # Game engine (logica pura, no Vue)
│           │   ├── GameEngine.ts     # Loop principale (setInterval 100ms)
│           │   ├── BigNum.ts         # Re-export break_infinity Decimal
│           │   ├── Formulas.ts       # Costi, income, scaling, prestige
│           │   ├── OfflineCalc.ts    # Calcolo guadagni offline
│           │   ├── EventSystem.ts    # Random events engine
│           │   └── MarketSim.ts      # Simulazione mercato (azioni + crypto)
│           ├── stores/               # Pinia stores (fonte di verità)
│           │   ├── usePlayerStore.ts  # Cash, stats, click power, prestige pts
│           │   ├── useBusinessStore.ts
│           │   ├── useStockStore.ts
│           │   ├── useCryptoStore.ts
│           │   ├── useRealEstateStore.ts
│           │   ├── useGamblingStore.ts
│           │   ├── useStartupStore.ts
│           │   ├── useUpgradeStore.ts # Skill tree + upgrades
│           │   ├── useAchievementStore.ts
│           │   ├── usePrestigeStore.ts
│           │   ├── useEventStore.ts   # Random events attivi
│           │   └── useSettingsStore.ts
│           ├── composables/
│           │   ├── useGameLoop.ts     # Subscribe/unsubscribe al tick
│           │   ├── useAutoSave.ts     # Auto-save ogni 30s + su quit
│           │   ├── useFormat.ts       # Formattazione Big Numbers (1K, 1M, 1B...)
│           │   └── useNotify.ts       # Toast wrapper per achievement/eventi
│           ├── components/
│           │   ├── layout/            # Header, Sidebar, Footer, HUD
│           │   ├── dashboard/         # Overview, MoneyDisplay, ClickButton
│           │   ├── businesses/        # BusinessCard, BusinessList
│           │   ├── stocks/            # StockChart, StockTicker, TradePanel
│           │   ├── crypto/            # CryptoChart, CryptoWallet
│           │   ├── realestate/        # PropertyCard, PropertyManager
│           │   ├── gambling/          # SlotMachine, Roulette, Poker, Dice
│           │   ├── startups/          # StartupCard, PortfolioView
│           │   ├── upgrades/          # SkillTree, UpgradeNode
│           │   ├── prestige/          # PrestigePanel, PrestigeShop
│           │   ├── achievements/      # AchievementGrid, AchievementPopup
│           │   ├── events/            # EventBanner, EventDialog
│           │   └── common/            # MoneyDisplay, ResourceBar, AnimatedCounter
│           ├── views/
│           │   ├── DashboardView.vue
│           │   ├── BusinessView.vue
│           │   ├── StockMarketView.vue
│           │   ├── CryptoView.vue
│           │   ├── RealEstateView.vue
│           │   ├── InvestmentsView.vue
│           │   ├── GamblingView.vue
│           │   ├── SkillTreeView.vue
│           │   ├── PrestigeView.vue
│           │   └── SettingsView.vue
│           ├── data/                  # Dati statici del gioco
│           │   ├── businesses.ts
│           │   ├── upgrades.ts
│           │   ├── achievements.ts
│           │   ├── stocks.ts
│           │   ├── cryptos.ts
│           │   ├── properties.ts
│           │   ├── events.ts
│           │   └── gambling.ts
│           ├── router/
│           │   └── index.ts
│           └── assets/
│               └── theme/
│                   └── custom-preset.ts  # PrimeVue preset custom (dark/lusso)
```

**Step 3 — Configurazione PrimeVue + Tema custom**
- Creare un preset custom basato su Aura con palette scura "lusso" (oro, nero, accenti emerald) usando `definePreset()`
- Configurare PrimeVue in `main.ts` con il preset custom e dark mode attivo di default
- Registrare solo i componenti PrimeVue usati (tree-shaking automatico in PrimeVue 4)
- Installare Iconify con `@iconify/json` bundled (nessuna dipendenza rete)

**Step 4 — Game Engine (core/)**
- **`GameEngine.ts`**: `setInterval` a 100ms (10 tick/sec). Ogni tick aggiorna tutti i sistemi. Traccia `delta` reale con `performance.now()` per compensare drift
- **`BigNum.ts`**: wrapper su `break_infinity.js` Decimal con metodi helper (`add`, `multiply`, `format`)
- **`Formulas.ts`**: tutte le formule di scaling — costi esponenziali, income, moltiplicatori prestige. Es: `cost(n) = baseCost * growthRate^n`
- **`OfflineCalc.ts`**: al caricamento, calcola `elapsed = now - lastSave`, simula i guadagni con efficienza ridotta (50-75%), mostra dialog "Bentornato!"
- **`MarketSim.ts`**: random walk con drift per simulare prezzi azioni/crypto. Parametri per stock: `{ volatility, trend, sector }`. Crypto = alta volatilità
- **`EventSystem.ts`**: ogni N tick valuta probabilità di eventi random. Pool di eventi con effetti temporanei (boom +50% income, crisi -30%, tasse, ecc.)

**Step 5 — Pinia Stores**
- **`usePlayerStore`**: `cash` (Decimal), `totalCashEarned`, `clickPower`, `clickCount`, `prestigePoints`, `prestigeMultiplier`
- **`useBusinessStore`**: array di business posseduti, ciascuno con `{ id, level, baseIncome, managerHired }`. Income = `baseIncome * level * multipliers`
- **`useStockStore`**: portfolio azioni, prezzi correnti (aggiornati ogni tick), cronologia prezzi per grafici
- **`useCryptoStore`**: simile a stock ma con volatilità molto più alta. Wallet di crypto
- **`useRealEstateStore`**: immobili acquistati con `{ location, rentIncome, upgradeLevel, value }`
- **`useStartupStore`**: investimenti startup con rischio/rendimento, alcune falliscono, altre 100x
- **`useGamblingStore`**: bilancio gambling, statistiche, mini-game states
- **`useUpgradeStore`**: DAG di upgrade/skill, prerequisiti, effetti
- **`useAchievementStore`**: lista achievement con `condition()` valutata ogni tick
- **`usePrestigeStore`**: layer prestige, shop prestige, moltiplicatori
- **`useEventStore`**: eventi attivi, durata residua, effetti applicati

**Step 6 — Sistema di Salvataggio (LowDB + Gist)**
- LowDB gira nel **main process**. Path: `app.getPath('userData')/savegame.json`
- Save serializza tutti i Pinia stores. I `Decimal` vengono salvati come `{ m, e }` (mantissa/esponente)
- Auto-save ogni 30 secondi + save su `before-quit` + save manuale
- Include campo `version` per migrazioni future
- Esporre via IPC: `save:local`, `load:local`, `save:cloud`, `load:cloud`, `export:file`, `import:file`
- **Gist cloud save**: token PAT cifrato con `safeStorage`. Salva come gist segreto. Gist ID in LowDB locale

**Step 7 — UI e Views (implementazione progressiva)**

1. **Dashboard** — overview empire: cash totale, income/sec, click button grande animato, statistiche rapide, ticker azioni in basso
2. **Business** — lista business acquistabili con costi crescenti, hire manager per auto-earn, upgrade
3. **Stock Market** — grafici Chart.js (linea temporale), compra/vendi, portfolio, filtri per settore
4. **Crypto** — come stocks ma con grafici candlestick (lightweight-charts di TradingView), wallet
5. **Real Estate** — mappa/griglia di proprietà, upgrade, rent income, market value fluctuations
6. **Investments** — startup cards con pitch, rischio, potenziale, timeline investimento
7. **Gambling** — mini-games: slot machine (CSS animata), roulette, dice, poker semplificato, blackjack
8. **Skill Tree** — visualizzazione DAG interattiva (PrimeVue Tree o custom SVG), nodi sbloccabili
9. **Prestige** — pannello reset con preview guadagni prestige, shop multiplicatori permanenti
10. **Settings** — volume, velocità animazioni, tema, cloud save config, esporta/importa save

**Step 8 — Sistema stile "HUD" sempre visibile**
- Header fisso: cash corrente (con contatore animato), income/sec, prestige points
- Sidebar: navigazione tra le sezioni
- Footer/ticker: notizie di mercato, eventi in corso, achievement sbloccati

**Step 9 — Animazioni e Polish**
- Counter cash animato (CSS transitions su numeri)
- Particelle al click (puro CSS o canvas leggero)
- Toast per achievement (PrimeVue Toast con icone Iconify)
- Transizioni tra views (Vue `<Transition>`)
- Effetti sonori opzionali (Howler.js, caricamento lazy)

**Step 10 — Packaging e distribuzione**
- Configurare `electron-builder` per generare installer Windows (.exe / NSIS)
- Opzionale: firma digitale, auto-update via electron-updater + GitHub Releases

---

### Altre idee di feature (da valutare in fasi successive)

- **Mercato nero / contrabbando**: guadagni altissimi ma rischio di "raid" che fa perdere tutto
- **Lotteria**: biglietti con jackpot crescente, estrazioni periodiche
- **Dipendenti / HR**: assumi staff con skill diversi, assegna a business per bonus
- **Ricerca & Sviluppo**: investi per sbloccare nuovi tipi di business/upgrade
- **Politica / Lobbying**: influenza leggi per vantaggi fiscali o eliminare concorrenti
- **Beneficenza / Reputazione**: dona per bonus PR che aumentano income dei business
- **Collezione / Museo**: colleziona oggetti rari che danno bonus passivi
- **Challenges / Missioni giornaliere**: obiettivi con ricompense
- **Stagioni / Cicli economici**: il mercato ha fasi bull/bear cicliche
---

### Verification

1. **Scaffold**: `npm create @quick-start/electron@latest` → progetto si avvia con `npm run dev` (finestra Electron con HMR Vue)
2. **Game loop**: il cash incrementa visivamente in tempo reale — verificare che il tick sia stabile (~10/sec)
3. **Save/Load**: chiudere e riaprire l'app → lo stato è preservato. Verificare `savegame.json` in `%APPDATA%/business-tycoon/`
4. **Cloud save**: configurare PAT GitHub → salvare/caricare → verificare gist creato su gist.github.com
5. **Offline progress**: chiudere app, aspettare 5 min, riaprire → dialog "Bentornato" con guadagni calcolati
6. **Big numbers**: raggiungere cifre > 1e15 → verificare formattazione corretta (1.23Qa, ecc.)
7. **Build**: `npm run build:win` → installer .exe funzionante

### Decisions

- **electron-vite** over electron-forge: template Vue-TS nativo, HMR superiore, config singola
- **LowDB nel main process**: renderer sandboxed, accesso fs solo via IPC
- **break_infinity.js** over decimal.js: 2-400x più veloce, sufficiente per numeri fino a 1e9e15
- **setInterval 100ms** over requestAnimationFrame per game loop: funziona anche quando la finestra non ha focus (essenziale per idle game)
- **Gist segreti** per cloud saves: gratis, fino a 1MB per file, nessun backend necessario
- **Iconify bundled** (non API): app desktop non deve dipendere da connessione internet
- **lightweight-charts** per crypto candlestick charts, Chart.js (via PrimeVue) per tutto il resto
