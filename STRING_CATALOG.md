# Comprehensive String Catalog — Business Tycoon ("Momentum")

All hardcoded user-visible English text strings across `src/renderer/src/`, organized by directory.

---

## Table of Contents

1. [router/](#router)
2. [views/](#views)
3. [components/layout/](#componentslayout)
4. [components/dashboard/](#componentsdashboard)
5. [components/business/](#componentsbusiness)
6. [components/market/](#componentsmarket)
7. [components/gambling/](#componentsgambling)
8. [components/deposits/](#componentsdeposits)
9. [components/loans/](#componentsloans)
10. [components/prestige/](#componentsprestige)
11. [components/skilltree/](#componentsskilltree)
12. [components/realestate/](#componentsrealestate)
13. [components/investments/](#componentsinvestments)
14. [components/ (root-level)](#components-root-level)
15. [composables/](#composables)
16. [data/](#data)
17. [data/prestige/](#dataprestige)
18. [data/skills/](#dataskills)

---

## router/

### `router/index.ts`
| Context | Strings |
|---------|---------|
| Route meta titles (sidebar nav) | `"Dashboard"`, `"Business"`, `"Stock Market"`, `"Crypto"`, `"Realty"`, `"Startups"`, `"Loans"`, `"Deposits"`, `"Casino"`, `"Skill Tree"`, `"Prestige"`, `"Settings"`, `"Dev Cheats"` |

---

## views/

### `views/DashboardView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Dashboard"`, `"Overview of your financial empire"` |
| Cash display label | `"Current Balance"` |
| Section title | `"Key Metrics"` |
| Stat cards | `"NET WORTH"`, `"BIZ PROFIT/S"`, `"JOB INCOME/S"`, `"TOTAL EARNED"`, `"DEBT"`, `"LEVEL"` |
| Jobs section | `"Jobs & Gigs"`, `"(X/Y active)"`, `"Exp Lv."` |
| Job buttons | `"Stop"`, `"Start"`, `"Available to Unlock"`, `"Unlock (Free)"`, `"Unlock (${cost})"` |

### `views/BusinessView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Businesses"`, `"Manage your operational ventures"` |
| Business cards | `"Profit"`, `"/s"` |
| Purchase section | `"Available for Purchase"`, `"Buy — ${price}"` |
| Empty state | `"No Businesses Available"`, `"Increase your net worth through jobs and investments to unlock businesses."` |
| Info panel title | `"How Businesses Work"` |
| Info: Revenue & Sales | `"Demand"`, `"Capacity"`, `"Units Sold"`, `"Utilization"`, `"Revenue/s"` |
| Info: Demand Formula | `"Base Customers"`, `"Price Factor"`, `"Quality Factor"`, `"Marketing Factor"`, `"Economy Demand"`, `"Elasticity"`, `"Customer Attraction"` |
| Info: Price Status | `"Optimal"`, `"Underpriced"`, `"Overpriced"`, `"Too expensive"` |
| Info: Cost Structure | `"Wages"`, `"Rent"`, `"Supplies"`, `"Marketing Spend"`, `"Cost Reduction"`, `"Costs/s"` |
| Info: Profit & Valuation | `"Profit/s"`, `"Avg Profit/tick"`, `"Valuation"` |
| Info: Controls & Actions | `"Employees ±"`, `"Price ±"`, `"Marketing ±"`, `"Quality Upgrade"`, `"Rename"`, `"Sell"` |
| Info: Details Panel | `"Base Customers"`, `"Price Factor"`, `"Quality / Marketing"`, `"Elasticity"`, `"Final Demand"`, `"Cost Breakdown"`, `"Total Revenue/Costs/Profit"`, `"Ticks Owned"` |

### `views/StockMarketView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Stock Market"`, `"Trade shares in publicly listed companies"` |
| Toggle | `"Hide Charts"`, `"Show Charts"` |
| Chart labels | `"Unpin"`, `"ATH"`, `"ATL"`, `"Data Points"` |

### `views/CryptoView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Crypto Exchange"`, `"Trade volatile cryptocurrencies for high risk/reward"` |
| Toggle | `"Hide Charts"`, `"Show Charts"` |
| Warning | `"Crypto markets are highly volatile. Prices can swing ±30% per day!"` |
| Chart labels | `"Unpin"`, `"ATH"`, `"ATL"`, `"Data Points"` |

### `views/DepositsView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Deposits"`, `"Grow your wealth with interest-bearing accounts"` |
| Stat cards | `"Cash"`, `"Locked"`, `"Active"`, `"Avg APY"`, `"Interest/s"` |
| Tabs | `"Active Deposits"`, `"Available Accounts"`, `"History"` |
| Empty states | `"No active deposits. Open an account to start earning interest!"`, `"No deposit history yet."` |
| Filters | `"Filter by category"`, `"All Accounts"` |
| History row labels | `"Interest:"`, `"APY:"`, `"Early withdrawal"` |
| Lifetime stats title | `"Lifetime Statistics"` |
| Lifetime stat labels | `"Total Deposited"`, `"Total Interest Earned"`, `"Accounts Opened"`, `"Matured"`, `"Early Withdrawals"` |
| Info panel | `"How Deposits Work"`, `"Open Deposit Account"` |
| Info sections | `"Account Types"` → `"Savings"`, `"Fixed Deposit"`, `"Premium"`, `"Special"` |
| Info sections | `"Interest & APY"`, `"Terms & Maturity"`, `"Risk & Protection"`, `"Modifiers & Bonuses"` |

### `views/LoansView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Loans & Credit"`, `"Manage debt, build credit, leverage your assets"` |
| Stat cards | `"Cash"`, `"Total Debt"`, `"Active Loans"`, `"Avg Rate"`, `"Credit Score"` |
| Stats section title | `"Loan Statistics"` |
| Stats labels | `"Total Loans Taken"`, `"Repaid On Time"`, `"Defaults"`, `"Total Interest Paid"` |
| Tabs | `"Active Loans"`, `"Available Loans"`, `"Loan History"` |
| Empty states | `"No active loans. Apply for a loan to get started!"`, `"No loan history yet."` |
| Filters | `"Filter by category"`, `"All Loans"` |
| History row | `"Unknown Loan"`, `"Interest:"`, `"On-time:"`, `"Late:"` |
| Info panel | `"How Loans Work"`, `"Apply for Loan"`, `"Loan Amount"` |
| Loan dialog | `"Interest Rate"`, `"Term"`, `"Revolving"`, `"Collateral Required"`, `"Early Repayment Penalty"` |
| Dialog buttons | `"Cancel"`, `"Confirm Loan"` |
| Info sections | `"Credit Score"`, `"Loan Categories"`, `"Interest & Payments"`, `"Collateral & Security"`, `"Default & Penalties"`, `"Refinancing"` |

### `views/GamblingView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Casino"`, `"Test your luck and win big — or lose it all"` |
| Stats | `"Balance"`, `"PLAYED"`, `"WIN RATE"`, `"NET"`, `"BEST WIN"` |
| Game: Blackjack | `"Blackjack"`, `"Beat the dealer to 21. Skill pays off."`, `"~49%"`, `"2x — 3x BJ"`, `"Table"` |
| Game: Roulette | `"Roulette"`, `"Bet on colors, numbers, or ranges."`, `"~48%"`, `"2x — 36x"`, `"Table"` |
| Game: Slot Machine | `"Slot Machine"`, `"Three reels of fortune. Match symbols for big payouts!"`, `"~25%"`, `"Up to 100x"`, `"Machine"` |
| Game: Coin Flip | `"Coin Flip"`, `"Heads or tails. Simple and clean — 50/50 chance."`, `"50%"`, `"2x"`, `"Quick"` |
| Game: Dice Roll | `"Dice Roll"`, `"Roll over or under the target. Higher risk, higher reward."`, `"Variable"`, `"Variable"`, `"Quick"` |
| Game: Plinko | `"Plinko"`, `"Drop balls through pegs into multiplier buckets. Choose your risk!"`, `"Variable"`, `"Up to 30×"`, `"Machine"` |
| Game: Lottery | `"Lottery"`, `"Pick your lucky numbers and hit the jackpot. Multiple ticket types!"`, `"Variable"`, `"Up to 100,000×"`, `"Draw"` |

### `views/InvestmentsView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Startup Investments"`, `"High-risk venture capital for massive returns"` |
| Stats | `"Active"`, `"Win Rate"`, `"Total Invested"`, `"Total Returns"`, `"Net Profit"` |
| Opportunity list | `"New opportunities in:"`, `"Ready to Collect"`, `"HOT"`, `"Invested:"`, `"Return:"`, `"Success:"` |
| Buttons | `"Collect"`, `"Invest"` |
| Tabs | `"Active Investments"`, `"Available Opportunities"`, `"Investment History"` |
| Maturity | `"Maturity Progress"`, `"left"` |
| Empty / waiting | `"Waiting for new opportunities..."` |
| Invest dialog | `"Invest in Startup"`, `"Research (${cost})"`, `"???"` |
| Dialog fields | `"Min Investment"`, `"Max Investment"`, `"Potential Return"`, `"Investment Amount:"`, `"Potential Returns"`, `"Investment"`, `"Success"`, `"Return"` |
| Dialog buttons | `"Cancel"`, `"Confirm Investment"` |

### `views/RealEstateView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Realty"`, `"Build passive income through property investments"` |
| Stats | `"Net Income"`, `"/sec"`, `"Portfolio Value"`, `"Properties"` |
| Sections | `"Your Properties"`, `"Available for Purchase"` |
| Property labels | `"Base Rent"`, `"/t"`, `"Maintenance"`, `"Tax Rate"`, `"unit"`, `"units"` |
| Purchase | `"Buy — ${price}"` |
| Empty state | `"No Properties Available"`, `"Increase your net worth to unlock real estate opportunities."` |
| Info panel | `"How Realty Works"` |
| Info sections | `"Property Basics"`, `"Condition & Wear"`, `"Occupancy Formula"`, `"Financials P&L"`, `"Controls & Actions"`, `"Market Value"`, `"Details Panel"` |

### `views/PrestigeView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Prestige"`, `"Rebirth to gain powerful permanent bonuses and unlock new eras"` |
| Stats | `"Total Points"`, `"Rebirths"`, `"Milestones"`, `"Perks"`, `"Upgrade Levels"`, `"Global Multiplier"` |
| Tabs | `"Upgrades"`, `"Perks"`, `"Milestones"` |
| Tab descriptions | `"One-time permanent unlocks that provide powerful bonuses."` |
| Tab descriptions | `"Automatic achievements that grant cumulative bonuses as you progress."` |

### `views/SkillTreeView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Skill Tree"`, `"Unlock permanent upgrades to boost your empire"` |
| Stats | `"Unlocked"`, `"X / Y"`, `"Balance"` |

### `views/SettingsView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Settings"`, `"Configure your game experience"` |
| Gameplay section | `"Gameplay"` |
| Setting: Notation | `"Number Notation"`, `"How large numbers are displayed"` |
| Notation options | `"Short (1.5K, 2.3M)"`, `"Scientific (1.5e3)"`, `"Engineering (1.5E3)"` |
| Setting: Confirm | `"Confirm Prestige"`, `"Show confirmation before prestiging"` |
| Setting: Offline | `"Offline Progress"`, `"Earn income while the game is closed"` |
| Display section | `"Display"` |
| Setting: Theme | `"Theme"`, `"Switch between dark and light appearance"` |
| Setting: Tooltips | `"Show Tooltips"`, `"Show helpful tooltips on hover"` |
| Setting: Particles | `"Particle Effects"`, `"Visual effects on click/earn"` |
| Save section | `"Save Management"` |
| Setting: Auto-save | `"Auto-Save Interval"`, `"How often the game auto-saves"` |
| Auto-save options | `"30 seconds"`, `"1 minute"`, `"2 minutes"`, `"5 minutes"` |
| Buttons | `"Save Now"`, `"Export"`, `"Import"` |
| Cloud section | `"Cloud Save (GitHub Gist)"` |
| Cloud setting | `"GitHub PAT"`, `"Personal Access Token with Gist scope"` |
| Cloud placeholder | `"ghp_..."` |
| Cloud buttons | `"Save"`, `"Cloud Save"`, `"Cloud Load"` |
| Toast messages | `"Save exported successfully"`, `"Save imported — reloading..."`, `"Export failed"`, `"Import failed"`, `"Cloud save failed"`, `"Cloud save loaded — reloading..."`, `"Cloud load failed"`, `"Failed to save token"`, `"Token saved securely"`, `"Save failed"` |

### `views/DevCheatsView.vue`
| Context | Strings |
|---------|---------|
| Page header | `"Dev Cheats"`, `"Testing & debugging tools — DEV ONLY"`, `"DEV MODE"` |
| Stats | `"Cash"`, `"Net Worth"`, `"Level"`, `"Tick"`, `"Businesses"` |
| Cash section | `"Cash"`, `"Give Cash"`, `"+$1B"`, `"+$1Qa"`, `"Set $0"` |
| XP section | `"XP & Level"`, `"Give XP"`, `"Lv 10"`, `"Lv 50"`, `"Lv 100"` |
| Prestige section | `"Prestige"`, `"Give PP"` |
| Business section | `"Business"`, `"Buy All Businesses"` |
| Startup section | `"Startups"`, `"Gen as NW"`, `"Refresh Opps"`, `"Research All"`, `"Invest All (min)"`, `"Force Resolve"`, `"Collect All"`, `"Reset Startups"` |
| Cash dropdown | `"$10K (early)"`, `"$100K"`, `"$1M"`, `"$10M"`, `"$100M"`, `"$1B"`, `"$10B"`, `"$1T"` |
| Debug labels | `"Opportunities:"`, `"Active:"`, `"Pending:"`, `"Win Rate:"`, `"Current Opportunities:"` |
| Market section | `"Market & Time"`, `"Tick Markets ×100"`, `"Clear Loans"`, `"+100 Ticks (10s)"`, `"+1000 Ticks (100s)"` |
| Action log | `"Action Log"`, `"No actions yet"` |
| Log messages | `"+$X cash"`, `"+$1B cash"`, `"+$1Qa cash"`, `"Cash set to $0"`, `"+X XP"`, `"Level set to X"`, `"+X prestige points"`, `"Bought X new businesses"` |

---

## components/layout/

### `components/layout/GameSidebar.vue`
| Context | Strings |
|---------|---------|
| Version badge | `"v0.1.0"` |

### `components/layout/GameHeader.vue`
| Context | Strings |
|---------|---------|
| Brand name | `"Momentum"` |
| HUD labels | `"Profit"`, `"/s"`, `"Net Worth"`, `"Prestige"`, `"Multi"`, `"Lv."` |
| Tooltip | `"View all multipliers"` |
| Theme tooltip | `"Switch to light mode"`, `"Switch to dark mode"` |
| Window buttons | `"Minimize"`, `"Maximize"`, `"Close"` |

### `components/layout/GameFooter.vue`
| Context | Strings |
|---------|---------|
| Event status | `"No active events"`, `"X active"` |

### `components/layout/InfoPanel.vue`
| Context | Strings |
|---------|---------|
| Default title | `"How it works"` |

---

## components/dashboard/

### `components/dashboard/CashDisplay.vue`
No hardcoded strings (all content via props).

### `components/dashboard/StatCard.vue`
No hardcoded strings (all content via props).

---

## components/business/

### `components/business/BusinessCard.vue`
| Context | Strings |
|---------|---------|
| Rename tooltip | `"Double-click to rename"`, `"Rename"` |
| Price labels | `"Optimal"`, `"Underpriced"`, `"Overpriced"`, `"Too expensive"` |
| Chips | `"demand"`, `"sold"`, `"capacity"` |
| P&L | `"Revenue/s"`, `"Costs/s"`, `"Profit/s"` |
| Pending state | `"Pending"`, `"Collect"` |
| Manager | `"Hire Manager"`, `"Auto-collects profit"`, `"Manager active"` |
| Controls | `"Employees"`, `"(cap: X/t)"`, `"Price"`, `"(opt: $X)"`, `"Marketing"`, `"(×X)"`, `"Quality"`, `"MAX"`, `"Upgrade ${cost}"` |
| Sell section | `"Value:"`, `"Less"`, `"Details"`, `"Sell"` |
| Details: Demand | `"Demand Breakdown"`, `"Base customers"`, `"Price factor"`, `"Quality factor"`, `"Marketing factor"`, `"Elasticity"`, `"→ Final demand"`, `"customers"` |
| Details: Costs | `"Cost Structure (per tick)"`, `"Wages"`, `"Rent"`, `"Supplies"`, `"Marketing"` |
| Details: Lifetime | `"Lifetime"`, `"Total revenue"`, `"Total costs"`, `"Total profit"`, `"Owned for"`, `"s"` |

### `components/business/BuyAmountSelector.vue`
| Context | Strings |
|---------|---------|
| Label | `"Purchase Amount:"` |

---

## components/market/

### `components/market/AssetCard.vue`
| Context | Strings |
|---------|---------|
| Pin tooltip | `"Unpin"`, `"Pin to focus"` |
| Price labels | `"ATH"`, `"ATL"` |
| Chart toggle | `"Collapse Chart"`, `"Expand Chart"` |

### `components/market/MarketStats.vue`
| Context | Strings |
|---------|---------|
| Labels | `"Wallet Value"` / `"Portfolio Value"`, `"Unrealized P/L"`, `"Realized P/L"`, `"Holdings"` / `"Positions"` |

### `components/market/MarketSettings.vue`
| Context | Strings |
|---------|---------|
| Label | `"Tick Speed:"` |
| Interval options | `"Every 1 second"`, `"Every 3 seconds"`, `"Every 5 seconds"`, `"Every 10 seconds"`, `"Every 30 seconds"`, `"Every 1 minute"` |
| Info panel | `"How markets work"`, `"How Markets Work"` |
| Info terms | `"Tick Speed"`, `"Price Model (GBM)"`, `"Geometric Brownian Motion"`, `"Black-Scholes"`, `"Market Conditions"`, `"Bull"`, `"Bear"`, `"Crash"`, `"Bubble"`, `"Pin & Focus"` |

### `components/market/TradePanel.vue`
| Context | Strings |
|---------|---------|
| Labels | `"Qty"`, `"% Cash"`, `"Buy"`, `"Sell"`, `"coins"`, `"shares"`, `"Sell All"`, `"Est. Cost:"`, `"Buy X%"` |

### `components/market/PositionInfo.vue`
| Context | Strings |
|---------|---------|
| Labels | `"coins"`, `"shares"`, `"avg"`, `"Value"`, `"Invested"`, `"P/L"`, `"P/L %"` |

### `components/charts/PriceChart.vue`
| Context | Strings |
|---------|---------|
| Default label prop | `"Price"` |
| Dataset label | `"Avg Buy"` |
| Range buttons | `"1m"`, `"5m"`, `"15m"`, `"1h"`, `"All"` |
| High/Low badges | `"H"`, `"L"` |
| Reset button title | `"Reset Zoom"` |
| Tooltip callback | `"Avg Buy: "`, `"P/L: "` |
| Tooltip title format | `"#{index} of {total}"` |

### `components/charts/MiniChart.vue`
No hardcoded user-visible strings (pure canvas rendering).

---

## components/gambling/

### `components/gambling/GameCard.vue`
| Context | Strings |
|---------|---------|
| Labels | `"Odds"`, `"Payout"`, `"W"`, `"L"`, `"No games yet"`, `"PLAY"` |

### `components/gambling/GamblingStats.vue`
| Context | Strings |
|---------|---------|
| Title | `"Gambling Statistics"` |
| Labels | `"Total Wins"`, `"Total Losses"`, `"Net Profit"` |

### `components/gambling/BetControls.vue`
| Context | Strings |
|---------|---------|
| Label | `"Bet Amount:"` |
| Presets | `"x2"`, `"x5"`, `"x10"`, `"Max"` |

### `components/gambling/ResultBanner.vue`
| Context | Strings |
|---------|---------|
| Results | `"WON ${amount}!"`, `"Lost ${amount}"` |

### `components/gambling/SlotLever.vue`
| Context | Strings |
|---------|---------|
| Lever states | `"SPINNING"`, `"PULL"` |

### `components/gambling/CoinFlip.vue`
| Context | Strings |
|---------|---------|
| Header | `"Back"`, `"Coin Flip"` |
| Coin faces | `"H"`, `"T"` |
| Results | `"Heads"`, `"Tails"`, `"You lose"` |
| Side selector | `"Heads"`, `"VS"`, `"Tails"` |
| Bet controls | `"BET AMOUNT"`, `"1/2"`, `"x2"`, `"MAX"` |
| Buttons | `"FLIPPING..."`, `"FLIP"`, `"New Round"` |
| Info panel | `"Odds & Payouts"` |
| Info: How it works | `"Choose a side"`, `"Place your bet"`, `"Fair coin"` |
| Info: Payout table | `"Correct guess"`, `"Wrong guess"` |
| Stats | `"Flips"`, `"Wins"`, `"Win Rate"`, `"Net P/L"` |

### `components/gambling/SlotMachine.vue`
| Context | Strings |
|---------|---------|
| Header | `"Back"`, `"Slot Machine"` |
| Symbols | `"Cherry"`, `"Lemon"`, `"Orange"`, `"Grape"`, `"Bell"`, `"BAR"`, `"7"` |
| Paytable descriptions | `"777 on center row"`, `"3 match — center row"`, `"3 match — top/bottom row"`, `"3 match — diagonal"`, `"Pyramid (top+bottom & center match)"`, `"2 adjacent match — horizontal"` |
| Paytable patterns | `"7-7-7 center"`, `"X-X-X center"`, `"X-X-X top/bottom"`, `"X-X-X diagonal"`, `"pyramid"`, `"X-X adjacent"` |
| Dynamic win desc | `"777 JACKPOT!"`, `"3x {label} — center/top/bottom/diagonal"`, `"Pyramid {label}"`, `"2x {label}"`, `"{N} wins! Best: {desc}"` |
| Toggle | `"Hide"`, `"Paytable"` |
| Paytable note | `"Multiple lines can win simultaneously. Multipliers are summed."` |
| No match | `"No match"` |
| Bet controls | `"BET"`, `"1/2"`, `"x2"`, `"MAX"`, `"AUTO ({count})"`, `"AUTO"` |
| Stats | `"Spins"`, `"Wins"`, `"Win Rate"`, `"Net P/L"` |

### `components/gambling/BlackjackGame.vue`
| Context | Strings |
|---------|---------|
| Header | `"Back"`, `"Blackjack"` |
| Outcomes | `"BLACKJACK!"`, `"YOU WIN"`, `"PUSH"`, `"BUST"`, `"DEALER WINS"` |
| Hand labels | `"Dealer"`, `"You"` |
| Actions | `"Hit"`, `"Stand"`, `"Double"` |
| States | `"Dealer is playing..."`, `"New Round"`, `"DEAL"` |
| Bet controls | `"BET AMOUNT"`, `"1/2"`, `"x2"`, `"MAX"` |
| Info panel | `"Rules & Payouts"` |
| Info: How it works | `"Objective"`, `"Card values"`, `"Dealer rules"` |
| Info: Player actions | `"Hit"`, `"Stand"`, `"Double Down"` |
| Info: Payout table | `"Win"`, `"Blackjack"`, `"Push"`, `"Bust or Lose"` |
| Stats | `"Hands"`, `"Wins"`, `"Win Rate"`, `"Net P/L"` |

### `components/gambling/BlackjackHand.vue`
| Context | Strings |
|---------|---------|
| Labels | `"BUST"`, `"BJ!"`, `"?"` |

### `components/gambling/BlackjackCard.vue`
No hardcoded translatable strings (only suit symbols ♥♦♣♠).

### `components/gambling/DiceFace.vue`
No hardcoded strings (SVG rendering via props).

### `components/gambling/RouletteWheel.vue`
No hardcoded strings (SVG wheel rendering).

### `components/gambling/PlinkoBoard.vue`
No hardcoded strings (canvas rendering).

### `components/gambling/DiceGame.vue`
| Context | Strings |
|---------|---------|
| Header | `"Back"`, `"Dice Roll"` |
| Status | `"WIN"`, `"LOSE"`, `"TARGET"` |
| Direction | `"UNDER {target}"`, `"OVER {target}"`, `"{ways}/36 · {pct}%"` |
| Payout | `"MULTIPLIER"`, `"{mult}×"`, `"Win chance: {pct}%"`, `"Potential: {amount}"` |
| Result | `"Rolled {sum} — You win!"`, `"Needed {direction} {target}"` |
| Bet controls | `"BET AMOUNT"`, `"1/2"`, `"x2"`, `"MAX"` |
| Buttons | `"ROLLING..."`, `"ROLL"`, `"New Round"` |
| Info | `"Odds & Payouts"`, `"How it works"` → `"Two dice"`, `"Pick a target"`, `"Over or Under"` |
| Info detail | `"Dynamic multiplier"`, `"House edge"` |
| Stats | `"Rolls"`, `"Wins"`, `"Win Rate"`, `"Net P/L"` |

### `components/gambling/RouletteGame.vue`
| Context | Strings |
|---------|---------|
| Header | `"Back"`, `"Roulette"` |
| Bet summary | `"{N} bet(s) × {amount} = {total}"` |
| Bet controls | `"BET PER CHIP"`, `"1/2"`, `"x2"`, `"MAX"` |
| Buttons | `"SPINNING..."`, `"SPIN"`, `"Clear"`, `"New Round"` |
| Results | `"{N} bet(s) won! ({labels})"`, `"No winning bets"` |
| Info | `"Odds & Payouts"` |
| Info sections | `"How it works"` → `"European Roulette"`, `"Placing bets"`, `"Spin"` |
| Info: Inside bets | `"Straight"` |
| Info: Outside bets | `"Red/Black"`, `"Even/Odd"`, `"1-18/19-36"`, `"Dozen"`, `"Column"` |
| Stats | `"Spins"`, `"Wins"`, `"Win Rate"`, `"Net P/L"` |

### `components/gambling/RouletteBoard.vue`
| Context | Strings |
|---------|---------|
| Bet areas | `"Red"`, `"Black"`, `"Odd"`, `"Even"`, `"1-18"`, `"19-36"` |
| Dozen groups | `"1st 12"`, `"2nd 12"`, `"3rd 12"` |
| Column bets | `"Col 1"`, `"Col 2"`, `"Col 3"`, `"2:1"` |

### `components/gambling/PlinkoGame.vue`
| Context | Strings |
|---------|---------|
| Header | `"Back"`, `"Plinko"` |
| Speed options | `"0.5×"`, `"1×"`, `"2×"`, `"4×"` |
| Risk options | `"Low"`, `"Medium"`, `"High"` |
| Labels | `"RISK LEVEL"`, `"ROWS"`, `"BALL SPEED"`, `"BET AMOUNT"` |
| Bet controls | `"1/2"`, `"×2"`, `"MAX"` |
| Payout | `"MAX PAYOUT"`, `"{mult}×"` |
| Buttons | `"DROP"`, `"STOP"`, `"AUTO"` |
| Results | `"WIN"`, `"LOSS"`, `"RECENT DROPS"` |
| Info | `"Odds & Payouts"`, `"How to play"` → `"Set your bet"`, `"Pick rows"`, `"Choose risk"`, `"Drop the ball"` |
| Info detail | `"Multipliers"` → `"Center buckets"`, `"Edge buckets"`, `"Gambling Luck"` |
| Info detail | `"Max payouts by risk (16 rows)"` → `"Low"`, `"Medium"`, `"High"` |
| Stats | `"Drops"`, `"Wins"`, `"Win Rate"`, `"Net P/L"` |

### `components/gambling/LotteryGame.vue`
| Context | Strings |
|---------|---------|
| Header | `"Back"`, `"Lottery"` |
| Luck badge | `"Luck multiplier: ×{value}"` |
| Toggle | `"Hide"`, `"Prizes"` |
| Prize table title | `"Prize Table — {name}"` |
| Payouts note | `"Payouts are multiplied by your Gambling Luck (×{value})"` |
| Label | `"Select Ticket"` |
| Buttons | `"New Draw"` |
| Error | `"Not enough cash for this ticket"` |
| Stats | `"Draws"`, `"Wins"`, `"Win Rate"`, `"Net P/L"`, `"Session"` |
| History | `"Recent Draws"`, `"No win"` |

### `components/gambling/LotteryTicket.vue`
| Context | Strings |
|---------|---------|
| Label | `"TICKET"`, `"Pick {N} more number(s)"`, `"Numbers selected"` |
| Buttons | `"Quick Pick"`, `"Clear"` |
| Bonus label | `"Bonus Ball"` |
| Buy button | `"Buy & Draw — ${cost}"` |

### `components/gambling/LotteryDraw.vue`
| Context | Strings |
|---------|---------|
| Labels | `"Drawn Numbers"`, `"Your Numbers"`, `"?"`, `"+"` |
| Win result | `"{label}"`, `"{rarity}"`, `"{matched}/{pickCount} matched"`, `"+ Bonus"`, `"×{payout} payout"` |
| Lose result | `"{matched} matched — not enough to win"`, `"No matches — better luck next time!"` |

---

## components/deposits/

### `components/deposits/DepositCard.vue`
| Context | Strings |
|---------|---------|
| Labels | `"APY"`, `"Min Deposit"`, `"Term"`, `"Compound"` |
| Compound types | `"Continuous"`, `"Per Second"`, `"Per Minute"` |
| Term value | `"Flexible"` |
| Penalty | `"{pct}% early withdrawal penalty on interest"` |
| Loyalty | `"+{pct}% loyalty bonus after hold"` |
| Button | `"Open Account"` |

### `components/deposits/ActiveDepositCard.vue`
| Context | Strings |
|---------|---------|
| Status badges | `"Loyalty Bonus"`, `"Matured"`, `"Active"` |
| Balance labels | `"Principal"`, `"Current Balance"`, `"Interest Earned"` |
| Stats | `"APY"`, `"ROI"`, `"Compounds"` |
| Term | `"Term Progress"`, `"Flexible"` |
| Loyalty | `"Loyalty bonus active — +{pct}% APY"` |
| Penalty warning | `"Withdrawing now forfeits {pct}% of interest"` |
| Buttons | `"Withdraw Early"`, `"Withdraw All"` |

---

## components/loans/

### `components/loans/LoanCard.vue`
| Context | Strings |
|---------|---------|
| Labels | `"Interest Rate"`, `"{rate} APR"`, `"Max Amount"`, `"Term"`, `"Min Credit"` |
| Term value | `"Revolving"` |
| Collateral | `"Requires {pct}% {type} collateral"` |
| Button | `"Apply for Loan"` |

### `components/loans/ActiveLoanCard.vue`
| Context | Strings |
|---------|---------|
| Status badges | `"Defaulted"`, `"Behind"`, `"Current"` |
| Balance labels | `"Remaining Balance"`, `"Original Principal"`, `"Interest Paid"` |
| Term | `"Term Progress"`, `"{time} left"`, `"Revolving"` |
| Stats | `"Rate"`, `"On-Time"`, `"Late"`, `"Missed"` |
| Collateral | `"{amount} locked as collateral"` |
| Penalty | `"Early repayment penalty: {pct}%"` |
| Buttons | `"Pay $100"`, `"Pay Off ({amount})"`, `"Refinance"` |
| Fallback | `"Loan"` |

### `components/loans/CreditScoreWidget.vue`
| Context | Strings |
|---------|---------|
| Title | `"Credit Score"` |
| Score levels | `"Excellent"`, `"Good"`, `"Fair"`, `"Poor"`, `"Very Poor"` |
| Factors | `"Payment History"`, `"Credit Utilization"`, `"Credit Age"`, `"Credit Mix"`, `"New Credit"` |
| Portfolio | `"Portfolio Health: {health}"` |
| Meter | `"Credit Utilization"` |

---

## components/prestige/

### `components/prestige/PrestigePanel.vue`
| Context | Strings |
|---------|---------|
| Labels | `"Available Points"`, `"Total earned: {pts}"`, `"Global Multiplier"`, `"Applied to all income"` |
| Rebirth section | `"Rebirth Now For"`, `"+{pts}"`, `"points"`, `"REBIRTH"` |
| Rebirths counter | `"Rebirths"` |
| Warning | `"Rebirth resets cash, businesses, and investments. Prestige upgrades, perks, milestones, and achievements are kept."` |
| Dialog title | `"Confirm Rebirth"` |
| Dialog text | `"Are you sure you want to rebirth?"`, `"You will gain {pts} prestige points."`, `"This will reset your progress but keep all prestige upgrades."` |
| Dialog buttons | `"Cancel"`, `"Confirm Rebirth"` |

### `components/prestige/PrestigeUpgradeCard.vue`
| Context | Strings |
|---------|---------|
| Effect templates | `"+{pct}% All Income"`, `"+{pct}% Prestige Gain"`, `"+${val} Cash"`, `"+{val} XP"`, `"+{pct}% Job Efficiency"`, `"+{pct}% Offline Progress"`, `"+{pct}% XP Gain"`, `"-{pct}% Costs"`, `"+{pct}% Business Revenue"`, `"+{pct}% Investment Returns"`, `"+{pct}% Crypto Returns"`, `"+{pct}% Real Estate Income"`, `"-{pct}% Loan Interest"`, `"Unlocks feature"` |
| Labels | `"Current:"`, `"Next:"`, `"Effect:"`, `"Lv.{n}"`, `"/{max}"` |
| Button | `"{cost} PP"` |
| Badge | `"MAX"` |

### `components/prestige/PerkCard.vue`
| Context | Strings |
|---------|---------|
| Category labels | `"Automation"`, `"Boost"`, `"Unlock"`, `"QoL"` |
| Effect templates | (same as PrestigeUpgradeCard + `"+{pct}% Stock/Crypto Returns"`, `"+${val} per rebirth"`, `"Unlocks: {target}"`) |
| Labels | `"Requires: {prereqs}"`, `"Owned"`, `"{cost} PP"` |

### `components/prestige/MilestoneCard.vue`
| Context | Strings |
|---------|---------|
| Reward templates | `"+{pct}% All Income"`, `"+{pct}% Prestige Gain"`, `"+${val} Starting Cash"`, `"+{val} Starting XP"`, `"+{pct}% XP Gain"`, `"+{pct}% Job Efficiency"`, `"+{pct}% Offline Progress"`, `"-{pct}% Loan Interest"`, `"-{pct}% Costs"` |

### `components/prestige/EraProgress.vue`
| Context | Strings |
|---------|---------|
| Labels | `"Current Era"`, `"+{pct}% Global Bonus"` |
| Progress | `"Progress to Next Era"`, `"{pts} / {required} PP"` |
| Max era | `"Maximum Era Reached!"` |

### `components/prestige/PrestigeStats.vue`
No hardcoded strings (label/value/icon via props).

---

## components/skilltree/

### `components/skilltree/SkillTreePanel.vue`
| Context | Strings |
|---------|---------|
| States | `"Purchased"`, `"Locked"` |
| Section labels | `"Effect"`, `"Cost"`, `"Prerequisites"` |
| Button | `"Unlock Skill"`, `"Locked"` |

### `components/skilltree/SkillNodeCard.vue`
| Context | Strings |
|---------|---------|
| Labels | `"Requires: {prereqs}"`, `"Purchased"`, `"Locked"` |

### `components/skilltree/SkillNode.vue`
No hardcoded strings (label/state via props).

### `components/skilltree/SkillTreeGraph.vue`
No hardcoded strings (SVG layout via props).

---

## components/realestate/

### `components/realestate/PropertyCard.vue`
| Context | Strings |
|---------|---------|
| Rename | `"Double-click to rename"`, `"Rename"` |
| Labels | `"{N} unit(s)"`, `"Reno LV.{n}"` |
| Bars | `"Condition"`, `"Occupancy"` |
| P&L | `"Gross/s"`, `"Expenses/s"`, `"Net/s"` |
| Rent control | `"Rent Price"`, hint `"(discount)"` / `"(premium)"` / `"(market)"` |
| Repair | `"Needs Repair"`, `"Repair {cost}"` |
| Renovate | `"Renovate"`, `"(+12% rent, +5% value)"`, `"LV.{n} — {cost}"` |
| Sell section | `"Value:"`, `"Less"`, `"Details"`, `"Sell"` |
| Details panel | `"Purchase price"`, `"Current value"`, `"Base rent/tick"`, `"Wear rate"`, `"Tax rate"`, `"Maintenance/tick"` |
| Lifetime stats | `"Total rent earned"`, `"Total expenses"`, `"Total net income"`, `"Owned for"` |

---

## components/investments/

### `components/investments/OpportunityCard.vue`
| Context | Strings |
|---------|---------|
| Labels | `"Min:"`, `"Success:"`, `"Return:"`, `"Invest {amount}"` |

### `components/investments/InvestmentCard.vue`
| Context | Strings |
|---------|---------|
| Labels | `"Invested:"`, `"Success:"`, `"Return:"` |
| Maturity | `"Maturity"`, `"{time} left"` |
| Success result | `"Investment succeeded!"`, `"Returns: {amount}"`, `"Collect Returns"` |
| Fail result | `"Investment failed — funds lost."` |
| Collected | `"✓ Returns collected ({mult}x)"` |

---

## components/ (root-level)

### `components/MultiplierBreakdownPanel.vue`
| Context | Strings |
|---------|---------|
| Title | `"Multiplier Breakdown"` |
| Categories | `"All Income"`, `"Business Revenue"`, `"Cost Reduction"`, `"Customer Attraction"`, `"Job Efficiency"`, `"Real Estate Rent"`, `"Stock Returns"`, `"Crypto Returns"`, `"Gambling Luck"`, `"Offline Efficiency"`, `"XP Gain"`, `"Prestige Gain"`, `"Startup Success"`, `"Loan Rate Reduction"`, `"Deposit Rate Boost"` |
| Source prefixes | `"Skill: {name}"`, `"Prestige: {name}"`, `"Milestone: {name}"`, `"Perk: {name}"`, `"Era: {name}"`, `"Prestige Points"`, `"Active Event"`, `"Achievement: {name}"` |
| Empty | `"No active bonuses"` |

### `components/OfflineSummaryDialog.vue`
| Context | Strings |
|---------|---------|
| Title | `"Welcome Back!"` |
| Labels | `"Time away"`, `"Offline efficiency"` |
| Income labels | `"Job Income"`, `"Business Profit"`, `"Rent Income"`, `"Dividends"`, `"Deposit Interest"`, `"Loan Interest"` |
| Empty | `"No active income sources while away."` |
| Totals | `"Total Cash Earned"` |
| Button | `"Collect"` |

### `components/settings/DangerZoneSection.vue`
| Context | Strings |
|---------|---------|
| Section | `"Danger Zone"` |
| Reset button | `"Hard Reset"`, `"Delete all progress. This cannot be undone."`, `"RESET"` |
| Dialog title | `"Hard Reset"` |
| Dialog text | `"Are you absolutely sure? This will delete ALL progress, including prestige upgrades and achievements."` |
| Dialog buttons | `"Cancel"`, `"Yes, Reset Everything"` |
| Error toast | `"Reset failed"` |

### `components/settings/SettingRow.vue`
No hardcoded strings (label/description via props).

### `components/settings/SettingsSection.vue`
No hardcoded strings (icon/title via props).

---

## composables/

### `composables/useNotify.ts`
| Context | Strings |
|---------|---------|
| Notification prefixes | `"🏆 {name}"` (achievement), `"📰 {name}"` (event), `"✨ {message}"` (prestige) |
| Auto-save notification | `"Game saved"` |

---

## data/

### `data/jobs.ts`

| Name | Description | Category |
|------|-------------|----------|
| `"Delivery Driver"` | `"Pick up packages, drop them off. Simple and reliable."` | `"Gig"` |
| `"Dog Walker"` | `"Good boys deserve good walks. Flexible hours."` | `"Gig"` |
| `"Freelance Web Dev"` | `"Build websites for small businesses. Decent margins."` | `"Freelance"` |
| `"Private Tutor"` | `"Share your knowledge, earn per session."` | `"Freelance"` |
| `"Handyman"` | `"Fix things around the house. Tools required."` | `"Skilled"` |
| `"Business Consultant"` | `"Advise small companies. High pay, requires reputation."` | `"Skilled"` |

### `data/businesses.ts`

| Name | Category |
|------|----------|
| `"Lemonade Stand"` | `"Starter"` |
| `"Newspaper Delivery"` | `"Starter"` |
| `"Car Wash"` | `"Starter"` |
| `"Pizza Shop"` | `"Food"` |
| `"Fitness Center"` | `"Services"` |
| `"Coffee Chain"` | `"Food"` |
| `"Fashion Boutique"` | `"Retail"` |
| `"Fine Dining"` | `"Entertainment"` |
| `"Nightclub"` | `"Entertainment"` |
| `"Hotel & Resort"` | `"Services"` |
| `"Tech Company"` | `"Tech"` |
| `"Manufacturing Plant"` | `"Industry"` |

### `data/stocks.ts`

| Name | Ticker | Sector |
|------|--------|--------|
| `"TechCorp"` | `"TCORP"` | `"tech"` |
| `"GrainX Industries"` | `"GRAINX"` | `"commodities"` |
| `"SolarWave Energy"` | `"SOLARW"` | `"energy"` |
| `"MedVax Pharma"` | `"MEDVX"` | `"healthcare"` |
| `"RetailMax"` | `"RETLX"` | `"retail"` |
| `"FinBank Holdings"` | `"FINBK"` | `"finance"` |
| `"AeroX Defense"` | `"AEROX"` | `"defense"` |
| `"GameVerse"` | `"GAMEV"` | `"entertainment"` |

### `data/cryptos.ts`

| Name | Ticker | Sector |
|------|--------|--------|
| `"BitCoin"` | `"BTC"` | `"crypto"` |
| `"EtherBlock"` | `"ETH"` | `"crypto"` |
| `"DogeToken"` | `"DOGE"` | `"meme"` |
| `"Solarium"` | `"SOL"` | `"crypto"` |
| `"PepeCoin"` | `"PEPE"` | `"meme"` |
| `"ChainLink"` | `"LINK"` | `"defi"` |
| `"Avalanche"` | `"AVAX"` | `"defi"` |
| `"ShibaSwap"` | `"SHIB"` | `"meme"` |

### `data/deposits.ts`

| Name | Description | Category |
|------|-------------|----------|
| `"Basic Savings"` | `"A simple savings account with daily interest. Withdraw anytime with no penalty."` | `"savings"` |
| `"High-Yield Savings"` | `"Competitive rates for larger balances. Flexible withdrawals, better compound."` | `"savings"` |
| `"Short-Term CD"` | `"Lock your money for 30 minutes and earn more than a savings account."` | `"fixed"` |
| `"Standard CD"` | `"A balanced certificate of deposit. Good returns for patient investors."` | `"fixed"` |
| `"Long-Term CD"` | `"Maximum FDIC-insured return. Requires patience but rewards handsomely."` | `"fixed"` |
| `"Wealth Management Account"` | `"Exclusive high-net-worth account with superior yields and continuous compounding."` | `"premium"` |
| `"Trust Fund"` | `"Ultra-high-yield trust account. Long commitment, extraordinary returns."` | `"premium"` |
| `"Money Market Fund"` | `"Higher returns by lending your deposit to others. Small risk of temporary freezes."` | `"special"` |
| `"Hedge Deposit"` | `"Aggressive yield strategy. Very high returns but your interest can be wiped by market events."` | `"special"` |
| `"Sovereign Bond Account"` | `"Government-backed ultra-safe deposit. Low returns but immune to all negative events."` | `"special"` |

**Category display names** (DEPOSIT_CATEGORY_META): `"Savings"`, `"Fixed Deposit"`, `"Premium"`, `"Special"`

**Risk display labels** (DEPOSIT_RISK_META):
- `"FDIC Insured"` — `"Principal is fully protected"`
- `"Standard"` — `"Principal safe, interest may vary"`
- `"Volatile"` — `"Interest can be wiped by events"`

### `data/loans.ts`

| Name | Description | Category |
|------|-------------|----------|
| `"Starter Personal Loan"` | `"A small unsecured loan for beginners. Low risk, low reward."` | `"personal"` |
| `"Personal Loan"` | `"Standard unsecured personal loan with competitive rates."` | `"personal"` |
| `"Premium Personal Loan"` | `"Large unsecured loan for established borrowers with excellent credit."` | `"personal"` |
| `"Micro Business Loan"` | `"Small loan to help start or expand a small business."` | `"business"` |
| `"Business Expansion Loan"` | `"Medium-sized loan for growing your business empire."` | `"business"` |
| `"Corporate Credit Line"` | `"Large revolving credit facility for major business operations."` | `"business"` |
| `"Starter Mortgage"` | `"Entry-level mortgage for your first property investment."` | `"mortgage"` |
| `"Jumbo Mortgage"` | `"Large mortgage for premium real estate acquisitions."` | `"mortgage"` |
| `"Commercial Mortgage"` | `"Financing for commercial real estate and developments."` | `"mortgage"` |
| `"Margin Trading Account"` | `"Borrow against your portfolio to leverage investments. High risk!"` | `"investment"` |
| `"Securities-Backed Loan"` | `"Low-rate loan secured by your investment portfolio."` | `"investment"` |
| `"Payday Loan"` | `"Quick cash with sky-high interest. Desperate times call for desperate measures."` | `"predatory"` |
| `"Underground Loan"` | `"No questions asked. Just don't miss a payment... or else."` | `"predatory"` |
| `"Government Small Business Grant"` | `"Low-interest government-backed loan for qualifying businesses."` | `"special"` |
| `"Angel Investor Bridge Loan"` | `"Convertible loan from an angel investor. Great terms, limited availability."` | `"special"` |
| `"Venture Debt"` | `"High-growth financing for your startup portfolio. Expensive but flexible."` | `"special"` |

**Category display names** (LOAN_CATEGORY_META): `"Personal"`, `"Business"`, `"Mortgage"`, `"High-Risk"`, `"Investment"`, `"Special"`

**Risk labels** (RISK_LEVEL_META): `"Low Risk"`, `"Medium Risk"`, `"High Risk"`, `"Extreme Risk"`

### `data/properties.ts`

| Name | Category |
|------|----------|
| `"Studio Apartment"` | `"Residential"` |
| `"Duplex"` | `"Residential"` |
| `"Townhouse"` | `"Residential"` |
| `"Strip Mall"` | `"Commercial"` |
| `"Apartment Complex"` | `"Commercial"` |
| `"Office Tower"` | `"Commercial"` |
| `"Luxury Hotel"` | `"Hospitality"` |
| `"Skyscraper"` | `"Luxury"` |
| `"Private Island"` | `"Luxury"` |

### `data/gambling.ts`

| Name | Description | Rules | Category |
|------|-------------|-------|----------|
| `"Coin Flip"` | `"Heads or tails. Simple and clean."` | `"Pick heads or tails. Win = 2x your bet."` | `"Simple"` |
| `"Dice Roll"` | `"Roll the dice and beat the target."` | `"Roll two dice. Score 7 or higher to win. Payout: 2.4x."` | `"Simple"` |
| `"Slot Machine"` | `"Three reels of fortune."` | `"Match 2 symbols = 2x. Match 3 = 10x. Jackpot (777) = 100x."` | `"Machine"` |
| `"Roulette"` | `"Bet on colors, numbers or ranges."` | `"Red/Black: 2x. Dozen: 3x. Single number: 36x."` | `"Table"` |
| `"Blackjack"` | `"Beat the dealer without going over 21."` | `"Get closer to 21 than the dealer. Blackjack pays 3:2."` | `"Table"` |
| `"Video Poker"` | `"Draw poker against the machine."` | `"Jacks or Better. Draw up to 5 cards. Best hand wins."` | `"Table"` |
| `"Scratch Card"` | `"Scratch and see if you won."` | `"Scratch 3 matching symbols to win. Various tiers."` | `"Simple"` |
| `"Horse Racing"` | `"Bet on the winning horse."` | `"Pick a horse from 6 runners. Odds vary by horse."` | `"Sports"` |
| `"Plinko"` | `"Drop balls through pegs into multiplier buckets."` | `"Choose risk level and rows. Drop a ball from the top..."` | `"Machine"` |
| `"Lottery"` | `"Pick your lucky numbers and win big."` | `"Choose a ticket type, pick your numbers, and watch the draw..."` | `"Draw"` |

### `data/lottery.ts`

| Name | Description |
|------|-------------|
| `"Quick Pick"` | `"Pick 3 numbers from 1–15. Simple and fast — ideal for beginners."` |
| `"Classic Lottery"` | `"Pick 5 numbers from 1–30 plus a bonus ball. The standard lottery experience."` |
| `"Mega Millions"` | `"Pick 6 numbers from 1–45 plus a Power Ball. Massive jackpots await."` |
| `"Lucky Numbers"` | `"Pick 4 numbers from 1–20. Fast draws and decent odds."` |

**Prize labels**: `"2 Match"`, `"3 Match"`, `"3 + Bonus"`, `"4 Match"`, `"4 + Bonus"`, `"5 Match"`, `"JACKPOT"`, `"3 + Power"`, `"4 + Power"`, `"5 + Power"`, `"6 Match"`, `"MEGA JACKPOT"`

**Rarities**: `"common"`, `"uncommon"`, `"rare"`, `"epic"`, `"legendary"`, `"jackpot"`

### `data/events.ts`

| Name | Description |
|------|-------------|
| `"Bull Market"` | `"The stock market is surging! All investment returns are boosted."` |
| `"Tax Break"` | `"Government announces tax cuts. All income increased!"` |
| `"Viral Marketing"` | `"One of your businesses went viral on social media!"` |
| `"Golden Hour"` | `"Everything you touch turns to gold. Click power boosted!"` |
| `"Crypto Boom"` | `"Crypto markets are going parabolic!"` |
| `"Housing Boom"` | `"Property values and rents are skyrocketing!"` |
| `"Lucky Day"` | `"You feel incredibly lucky today. Gambling odds improved!"` |
| `"Lottery Fever"` | `"The whole city is buying tickets! Jackpot pools surge. Gambling luck massively boosted!"` |
| `"Lucky Numbers Alignment"` | `"The stars have aligned — your lucky numbers are especially potent today!"` |
| `"Eureka Moment"` | `"A flash of brilliance! Double XP for a while."` |
| `"Recession"` | `"Economic downturn. All income reduced."` |
| `"Market Crash"` | `"Stock markets are plummeting!"` |
| `"Crypto Winter"` | `"Crypto markets are freezing. Hold on tight!"` |
| `"Supply Shortage"` | `"Supply chain issues hit your businesses."` |
| `"Federal Rate Cut"` | `"The central bank cuts interest rates! All loan rates reduced by 25%."` |
| `"Federal Rate Hike"` | `"Interest rates are rising! All loan rates increased by 30%."` |
| `"Credit Bureau Error"` | `"A glitch at the credit bureau has temporarily boosted your credit score!"` |
| `"Identity Theft Alert"` | `"Someone tried to steal your identity! Credit score temporarily affected."` |
| `"Debt Relief Program"` | `"A new government program offers debt relief! Income boosted as debt burden eases."` |
| `"Bank Holiday"` | `"Banks are closed for a special holiday. No loan interest accrues!"` |
| `"Suspicious Visitor"` | `"Someone questionable is asking about your finances. Better lay low."` |
| `"Financial Advisor Visit"` | `"A financial advisor helps optimize your debt strategy. Better loan terms available!"` |
| `"Credit Line Increase"` | `"Your good payment history has been noticed! Improved borrowing terms."` |
| `"Economic Stimulus"` | `"The government announces economic stimulus! Easy money and low rates."` |
| `"Bank Promotional Rate"` | `"Banks are competing for deposits! All deposit APYs get a massive boost."` |
| `"Central Bank Rate Hike"` | `"The central bank raises rates. Deposit yields soar, but loan costs rise too."` |
| `"Savings Tax"` | `"A new tax on savings accounts reduces deposit yields."` |
| `"FDIC Guarantee Expansion"` | `"The government expands deposit insurance. Confidence in savings rises!"` |
| `"Negative Interest Rates"` | `"Central bank goes negative! Deposit yields plummet across the board."` |

**Choice events**:
| Name | Description |
|------|-------------|
| `"Angel Investor"` | `"An investor offers to double your income for 60s, but takes a 20% cut of current cash."` |
| `"High Roller Invitation"` | `"A VIP invites you to a private game. +50% gambling luck for 30s."` |
| `"Merger Opportunity"` | `"A rival wants to merge. Boosts business income but costs cash upfront."` |

### `data/startups.ts`

**Sectors** (10):
| Name | Description |
|------|-------------|
| `"Technology"` | `"Software and consumer tech"` |
| `"Biotechnology"` | `"Drugs, genetics, and medical research"` |
| `"Green Energy"` | `"Renewable energy and sustainability"` |
| `"Fintech"` | `"Financial technology and payments"` |
| `"Space Tech"` | `"Aerospace and space exploration"` |
| `"Artificial Intelligence"` | `"Machine learning and AI applications"` |
| `"Gaming"` | `"Video games and entertainment"` |
| `"HealthTech"` | `"Digital health and wellness"` |
| `"Crypto/Web3"` | `"Blockchain and decentralized apps"` |
| `"Logistics"` | `"Supply chain and delivery"` |

**Stages** (5):
| Name | Description |
|------|-------------|
| `"Seed"` | `"Very early stage, high risk"` |
| `"Series A"` | `"Early traction, moderate risk"` |
| `"Series B"` | `"Scaling phase, balanced risk"` |
| `"Series C"` | `"Late stage, lower risk"` |
| `"Pre-IPO"` | `"About to go public, safest"` |

**Traits** (14):
| Name | Description |
|------|-------------|
| `"Experienced Team"` | `"Founders have prior successful exits"` |
| `"First Mover"` | `"Creating a new market category"` |
| `"Strong Patents"` | `"Protected intellectual property"` |
| `"Viral Growth"` | `"Explosive user acquisition"` |
| `"Government Backing"` | `"Supported by government grants"` |
| `"Celebrity Founder"` | `"High-profile founder attracts attention"` |
| `"Tech Breakthrough"` | `"Revolutionary technology"` |
| `"Strong Moat"` | `"Difficult for competitors to replicate"` |
| `"Perfect Timing"` | `"Market conditions are ideal"` |
| `"High Burn Rate"` | `"Spending cash faster than revenue"` |
| `"Regulatory Hurdles"` | `"Facing complex legal challenges"` |
| `"Crowded Market"` | `"Many competitors in the space"` |
| `"Pivot Risk"` | `"May need to change direction"` |
| `"Key Person Risk"` | `"Too dependent on one individual"` |

**Startup name suffixes** (generated names): `"Labs"`, `"Tech"`, `"AI"`, `"Systems"`, `"Works"`, `"Hub"`, `"Solutions"`, `"Dynamics"`, `"Ventures"`, `"Corp"`, `"Global"`, `"Logic"`, `"Wave"`, `"Stream"`, `"Forge"`, `"Spark"`, `"Network"`, `"Space"`, `"Base"`, `"Cloud"`, `"Link"`, `"Stack"`, `"Box"`, `"Shift"`

**Startup name prefixes by sector** (10 per sector, 100 total): `"Quantum"`, `"Neo"`, `"Cyber"`, `"Digital"`, `"Cloud"`, `"Pixel"`, `"Byte"`, `"Code"`, `"Data"`, `"Smart"`, `"Gene"`, `"Bio"`, `"Cell"`, `"Vita"`, `"Helix"`, `"Synth"`, `"Neuro"`, `"Pharma"`, `"Genome"`, `"Pulse"`, `"Solar"`, `"Eco"`, `"Green"`, `"Terra"`, `"Clean"`, `"Renew"`, `"Wind"`, `"Hydro"`, `"Earth"`, `"Sustain"`, `"Pay"`, `"Fin"`, `"Cash"`, `"Coin"`, `"Trade"`, `"Wealth"`, `"Capital"`, `"Fund"`, `"Ledger"`, `"Cred"`, `"Astro"`, `"Stellar"`, `"Orbit"`, `"Cosmo"`, `"Nova"`, `"Lunar"`, `"Mars"`, `"Zero-G"`, `"Star"`, `"Void"`, `"Neural"`, `"Cogni"`, `"Mind"`, `"Logic"`, `"Deep"`, `"Synapse"`, `"Intel"`, `"Brain"`, `"Think"`, `"Learn"`, `"Play"`, `"Game"`, `"Quest"`, `"Arena"`, `"Epic"`, `"Arcade"`, `"Level"`, `"Guild"`, `"World"`, `"Med"`, `"Health"`, `"Care"`, `"Vital"`, `"Wellness"`, `"Life"`, `"Cure"`, `"Heal"`, `"Fit"`, `"Block"`, `"Chain"`, `"Defi"`, `"Meta"`, `"Token"`, `"Hash"`, `"Node"`, `"Mint"`, `"Web3"`, `"Decen"`, `"Ship"`, `"Fleet"`, `"Route"`, `"Track"`, `"Swift"`, `"Flow"`, `"Trans"`, `"Pack"`

**Taglines by sector** (5 per sector, 50 total):
- Tech: `"Disrupting the digital landscape"`, `"Next-gen software innovation"`, `"Redefining user experience"`, `"Cloud-native revolution"`, `"Building the future of tech"`
- Biotech: `"Pioneering genetic medicine"`, `"Unlocking life's code"`, `"Curing the incurable"`, `"Biotech breakthrough incoming"`, `"Engineering better health"`
- Green: `"Powering a sustainable future"`, `"Clean energy for everyone"`, `"Making green mainstream"`, `"Zero-emission innovation"`, `"Saving the planet profitably"`
- Fintech: `"Banking without banks"`, `"Money reimagined"`, `"Financial freedom for all"`, `"Smart money, smarter future"`, `"Payments evolved"`
- Space: `"Making space accessible"`, `"The final frontier awaits"`, `"Orbital economy pioneer"`, `"Stars within reach"`, `"Space for humanity"`
- AI: `"Intelligence amplified"`, `"AI that understands"`, `"Machine learning revolution"`, `"Thinking beyond limits"`, `"Cognitive computing redefined"`
- Gaming: `"Play different, win big"`, `"Gamers' dream realized"`, `"The next gaming sensation"`, `"Entertainment evolved"`, `"Where gaming meets innovation"`
- Health: `"Healthcare in your pocket"`, `"Wellness for the modern age"`, `"Democratizing health"`, `"Prevention over cure"`, `"Digital health revolution"`
- Crypto: `"Decentralizing everything"`, `"Web3 is here"`, `"Own your digital future"`, `"Beyond traditional finance"`, `"Blockchain meets reality"`
- Logistics: `"Delivery reimagined"`, `"Supply chain mastery"`, `"From A to B, faster"`, `"Logistics intelligence"`, `"Moving the world forward"`

### `data/achievements.ts`

| Name | Description | Category |
|------|-------------|----------|
| `"First Dollar"` | *earn first cash* | `"Wealth"` |
| `"Hundredaire"` | | `"Wealth"` |
| `"Thousandaire"` | | `"Wealth"` |
| `"Five-Figure Fortune"` | | `"Wealth"` |
| `"Six-Figure Salary"` | | `"Wealth"` |
| `"Millionaire"` | | `"Wealth"` |
| `"Multi-Millionaire"` | | `"Wealth"` |
| `"Billionaire"` | | `"Wealth"` |
| `"Trillionaire"` | | `"Wealth"` |
| `"Positive Balance"` | | `"Net Worth"` |
| `"Comfortable"` | | `"Net Worth"` |
| `"Wealthy"` | | `"Net Worth"` |
| `"Ultra Rich"` | | `"Net Worth"` |
| `"Novice"` | | `"Progress"` |
| `"Apprentice"` | | `"Progress"` |
| `"Expert"` | | `"Progress"` |
| `"Master"` | | `"Progress"` |
| `"Legend"` | | `"Progress"` |
| `"Entrepreneur"` | | `"Business"` |
| `"Business Mogul"` | | `"Business"` |
| `"Tycoon"` | | `"Business"` |
| `"New Era"` | | `"Prestige"` |
| `"Empire Expander"` | | `"Prestige"` |
| `"Eternal Tycoon"` | | `"Prestige"` |
| `"???"` | *secret* | `"Secret"` |
| `"Lucky Streak"` | | `"Secret"` |

### `data/upgrades.ts`

**Skill tree category labels** (UPGRADE_CATEGORIES): `"Business"`, `"Finance"`, `"Gambling"`, `"Empire"`, `"Prestige"`

---

## data/prestige/

### `data/prestige/eras.ts`

| Name | Description |
|------|-------------|
| `"Newcomer"` | `"Your first steps into the simulation. Everything starts from zero."` |
| `"Apprentice"` | `"You've learned the basics. The system responds to your inputs."` |
| `"Practitioner"` | `"Your strategies are refined. Efficiency becomes second nature."` |
| `"Expert"` | `"Mastery of systems unlocks deeper mechanics."` |
| `"Virtuoso"` | `"Every action is optimized. The simulation bends to your will."` |
| `"Transcendent"` | `"Beyond mastery lies transcendence. The rules are yours to shape."` |

### `data/prestige/upgrades.ts`

| Name | Description | Category |
|------|-------------|----------|
| `"Compound Growth"` | `"All income sources are permanently boosted."` | `"income"` |
| `"Solid Foundations"` | `"Build upon a stable economic base."` | `"income"` |
| `"Business Acumen"` | `"All business revenue is multiplied."` | `"income"` |
| `"Investment Guru"` | `"Better returns on stocks and crypto."` | `"income"` |
| `"Rental Efficiency"` | `"Increased rental income from all properties."` | `"income"` |
| `"Prestige Amplifier"` | `"Earn more prestige points on each rebirth."` | `"progression"` |
| `"Wisdom of Ages"` | `"Gain XP faster, leveling up more quickly."` | `"progression"` |
| `"Hustle Memory"` | `"Jobs start more efficient after each rebirth."` | `"progression"` |
| `"Dream Worker"` | `"Earn more while you are away from the game."` | `"quality_of_life"` |
| `"Efficiency Expert"` | `"Reduce all operating costs across your operations."` | `"quality_of_life"` |
| `"Creditor Trust"` | `"Better loan rates across all financial institutions."` | `"quality_of_life"` |
| `"Trust Fund"` | `"Start each rebirth with bonus cash."` | `"starting_bonus"` |
| `"Born Genius"` | `"Start each rebirth with bonus XP."` | `"starting_bonus"` |
| `"Crypto Pioneer"` | `"Unlock crypto trading from the start of each run."` | `"starting_bonus"` |

**Category display labels** (UPGRADE_CATEGORY_INFO): `"Income Boosts"`, `"Progression"`, `"Quality of Life"`, `"Starting Bonuses"`

### `data/prestige/perks.ts`

| Name | Description |
|------|-------------|
| `"Quick Start"` | `"Start each run with a small cash bonus based on your total prestige points."` |
| `"Auto Collector"` | `"Automatically collect all passive income without clicking."` |
| `"Instant Mastery"` | `"New jobs start at 50% efficiency instead of 0%."` |
| `"Dream Worker"` | `"Increase offline progress efficiency by 25%."` |
| `"Market Insight"` | `"All stock and crypto investments gain 15% better returns."` |
| `"Tax Haven"` | `"Reduce all loan interest rates by 3%."` |
| `"Business Acumen"` | `"All businesses generate 20% more revenue."` |
| `"Property Expert"` | `"All properties generate 20% more rental income."` |
| `"Crypto Pioneer"` | `"Unlock cryptocurrency trading from the very start of each run."` |
| `"Wall Street Access"` | `"Unlock stock trading from the very start of each run."` |
| `"Casino Pass"` | `"Unlock gambling features from the very start of each run."` |
| `"Property License"` | `"Unlock real estate from the very start of each run."` |
| `"Golden Touch"` | `"Everything you touch turns to gold. +50% to all income sources."` |
| `"Time Warp"` | `"Offline progress is calculated at 100% efficiency."` |
| `"Prestige Master"` | `"Earn 50% more prestige points on every rebirth."` |
| `"Omniscience"` | `"See all market trends and optimal prices clearly."` |
| `"Reality Warp"` | `"Transcend normal game rules. +100% to all income."` |

### `data/prestige/milestones.ts`

| Name | Description |
|------|-------------|
| `"Point Collector"` | `"Accumulate 10 total prestige points across all rebirths."` |
| `"Point Hoarder"` | `"Accumulate 50 total prestige points."` |
| `"Century Club"` | `"Accumulate 100 total prestige points."` |
| `"Half Millennium"` | `"Accumulate 500 total prestige points."` |
| `"Grand Master"` | `"Accumulate 1,000 total prestige points."` |
| `"Prestige Virtuoso"` | `"Accumulate 5,000 total prestige points."` |
| `"Eternal Collector"` | `"Accumulate 10,000 total prestige points."` |
| `"First Rebirth"` | `"Complete your first prestige rebirth."` |
| `"Cycle Veteran"` | `"Complete 5 prestige rebirths."` |
| `"Decade of Rebirths"` | `"Complete 10 prestige rebirths."` |
| `"Silver Jubilee"` | `"Complete 25 prestige rebirths."` |
| `"Golden Cycle"` | `"Complete 50 prestige rebirths."` |
| `"Century of Lives"` | `"Complete 100 prestige rebirths."` |
| `"Upgrade Enthusiast"` | `"Purchase 5 prestige upgrade levels."` |
| `"Upgrade Collector"` | `"Purchase 25 prestige upgrade levels."` |
| `"Upgrade Master"` | `"Purchase 50 prestige upgrade levels."` |

---

## data/skills/

### `data/skills/business-skills.ts` (75 nodes)

| Name | Effect Description |
|------|-------------------|
| `"Hustle Mindset"` | `"+15% business revenue"` |
| `"Better Equipment"` | `"+15% job efficiency"` |
| `"Social Media"` | `"+15% customer attraction"` |
| `"Reputation Builder"` | `"+20% job efficiency"` |
| `"Customer Service"` | `"+20% business revenue"` |
| `"Online Store"` | `"+20% customer attraction"` |
| `"Freelance Master"` | `"+25% job efficiency"` |
| `"Efficient Operations"` | `"+20% business revenue"` |
| `"Brand Recognition"` | `"+25% customer attraction"` |
| `"SEO Expert"` | `"+20% customer attraction"` |
| `"Workforce Expansion"` | `"+25% job efficiency"` |
| `"Supply Chain"` | `"-15% operating costs"` |
| `"Digital Marketing"` | `"+30% customer attraction"` |
| `"Franchise Model"` | `"+30% business revenue"` |
| `"Outsourcing"` | `"-10% operating costs"` |
| `"Team Leadership"` | `"+30% job efficiency"` |
| `"Lean Manufacturing"` | `"-20% operating costs"` |
| `"Influencer Network"` | `"+35% customer attraction"` |
| `"Franchise Empire"` | `"+35% business revenue"` |
| `"HR Department"` | `"+35% job efficiency"` |
| `"Assembly Line"` | `"-25% operating costs"` |
| `"Viral Campaigns"` | `"+40% customer attraction"` |
| `"Logistics Hub"` | `"+35% business revenue"` |
| `"Tax Optimization"` | `"-15% operating costs"` |
| `"Talent Academy"` | `"+40% job efficiency"` |
| `"Mass Production"` | `"+45% business revenue"` |
| `"Celebrity Endorsement"` | `"+45% customer attraction"` |
| `"Global Logistics"` | `"+40% business revenue"` |
| `"Corporate Structure"` | `"+50% business revenue"` |
| `"Marketing Empire"` | `"+55% customer attraction"` |
| `"Distribution Network"` | `"-30% operating costs"` |
| `"C-Suite Team"` | `"+55% job efficiency"` |
| `"R&D Division"` | `"+60% business revenue"` |
| `"Ad Agency"` | `"+55% customer attraction"` |
| `"Global Supply Chain"` | `"-25% operating costs"` |
| `"Executive Board"` | `"+65% job efficiency"` |
| `"Innovation Lab"` | `"+70% business revenue"` |
| `"Market Dominance"` | `"+75% customer attraction"` |
| `"Content Empire"` | `"+65% customer attraction"` |
| `"Trade Routes"` | `"+65% business revenue"` |
| `"Board of Directors"` | `"+80% job efficiency"` |
| `"Patent Portfolio"` | `"+85% business revenue"` |
| `"Cultural Impact"` | `"+80% customer attraction"` |
| `"Global Trade Network"` | `"+75% business revenue"` |
| `"Mega Corporation"` | `"+100% business revenue"` |
| `"Brand Dynasty"` | `"+100% customer attraction"` |
| `"Market Monopoly"` | `"-40% operating costs"` |
| `"Corporate Titan"` | `"+125% business revenue"` |
| `"Future Technology"` | `"+100% all income"` |
| `"Mind Share"` | `"+120% customer attraction"` |
| `"World Commerce"` | `"+110% business revenue"` |
| `"Industry Leader"` | `"+150% business revenue"` |
| `"AI Operations"` | `"-50% operating costs"` |
| `"Brand Religion"` | `"+175% customer attraction"` |
| `"Climate Empire"` | `"+130% all income"` |
| `"Space Mining"` | `"+140% business revenue"` |
| `"Economic Influence"` | `"+200% business revenue"` |
| `"Quantum Computing"` | `"+200% all income"` |
| `"Planetary Brand"` | `"+225% customer attraction"` |
| `"Galactic Trade"` | `"+200% business revenue"` |
| `"World Dominator"` | `"+350% business revenue"` |
| `"Techno-Singularity"` | `"+300% all income"` |
| `"Universal Brand"` | `"+350% customer attraction"` |
| `"Omniscient CEO"` | `"+500% all income"` |
| `"Infinite Enterprise"` | `"+500% business revenue"` |

### `data/skills/finance-skills.ts` (75 nodes)

| Name | Effect Description |
|------|-------------------|
| `"Financial Literacy"` | `"+15% stock returns"` |
| `"Stock Basics"` | `"+15% stock returns"` |
| `"Crypto Curious"` | `"+15% crypto returns"` |
| `"Technical Analysis"` | `"+20% stock returns"` |
| `"Portfolio Theory"` | `"+15% all income"` |
| `"DeFi Pioneer"` | `"+20% crypto returns"` |
| `"Day Trading"` | `"+25% stock returns"` |
| `"Diversification"` | `"+20% all income"` |
| `"Real Estate 101"` | `"+20% real estate rent"` |
| `"NFT Markets"` | `"+22% crypto returns"` |
| `"Options & Futures"` | `"+28% stock returns"` |
| `"Compound Interest"` | `"+25% all income"` |
| `"Mortgage Mastery"` | `"-15% loan rates"` |
| `"Savings Expert"` | `"+15% deposit APY"` |
| `"Property Flipping"` | `"+28% real estate rent"` |
| `"Yield Farming"` | `"+25% crypto returns"` |
| `"Algorithmic Trading"` | `"+32% stock returns"` |
| `"Wealth Manager"` | `"+30% all income"` |
| `"REIT Portfolio"` | `"+32% real estate rent"` |
| `"DeFi Whale"` | `"+30% crypto returns"` |
| `"High-Frequency Trading"` | `"+38% stock returns"` |
| `"Hedge Fund"` | `"+35% all income"` |
| `"Property Development"` | `"+35% real estate rent"` |
| `"Compound Master"` | `"+25% deposit APY"` |
| `"Mega Landlord"` | `"+38% real estate rent"` |
| `"Blockchain Architect"` | `"+35% crypto returns"` |
| `"Dark Pool Access"` | `"+45% stock returns"` |
| `"Investment Banking"` | `"+42% all income"` |
| `"Skyline Developer"` | `"+45% real estate rent"` |
| `"Layer-1 Chain"` | `"+42% crypto returns"` |
| `"Market Maker"` | `"+55% stock returns"` |
| `"Financial Conglomerate"` | `"+50% all income"` |
| `"Crypto Empire"` | `"+50% crypto returns"` |
| `"Quant Division"` | `"+60% stock returns"` |
| `"Private Equity"` | `"+55% all income"` |
| `"Mega REIT"` | `"+55% real estate rent"` |
| `"Deposit Mogul"` | `"+40% deposit APY"` |
| `"DAO Overlord"` | `"+55% crypto returns"` |
| `"Sovereign Wealth"` | `"+70% stock returns"` |
| `"Financial Lobbying"` | `"-30% loan rates"` |
| `"Smart Cities"` | `"+70% real estate rent"` |
| `"DeFi Central Bank"` | `"+65% crypto returns"` |
| `"Yield Vault"` | `"+60% deposit APY"` |
| `"Metaverse Real Estate"` | `"+60% real estate rent"` |
| `"Central Bank Advisor"` | `"+85% stock returns"` |
| `"Derivatives Empire"` | `"+80% all income"` |
| `"Arcology Builder"` | `"+80% real estate rent"` |
| `"Quantum Finance"` | `"+80% crypto returns"` |
| `"World Bank"` | `"+100% all income"` |
| `"Global Real Estate"` | `"+100% real estate rent"` |
| `"Crypto God"` | `"+100% crypto returns"` |
| `"IMF Director"` | `"+125% stock returns"` |
| `"Global Reserve Currency"` | `"+110% all income"` |
| `"Orbital Habitats"` | `"+120% real estate rent"` |
| `"Neural Finance"` | `"+110% crypto returns"` |
| `"Bretton Woods II"` | `"+150% stock returns"` |
| `"Dark Matter Markets"` | `"+140% all income"` |
| `"Dyson Finance Sphere"` | `"-50% loan rates"` |
| `"Exoplanet Real Estate"` | `"+150% real estate rent"` |
| `"Sentient Trader AI"` | `"+140% crypto returns"` |
| `"Timeless Investments"` | `"+200% stock returns"` |
| `"Economy Controller"` | `"+200% all income"` |
| `"Dimensional Real Estate"` | `"+200% real estate rent"` |
| `"Omni-Finance"` | `"+200% crypto returns"` |
| `"Plutocrat Supreme"` | `"+350% all income"` |
| `"Multiverse Portfolio"` | `"+300% stock returns"` |
| `"Cryptoverse"` | `"+300% crypto returns"` |
| `"Midas Touch"` | `"+500% all income"` |
| `"Reality Arbiter"` | `"+500% stock returns"` |

### `data/skills/gambling-skills.ts` (75 nodes)

| Name | Effect Description |
|------|-------------------|
| `"Beginner's Luck"` | `"+15% gambling luck"` |
| `"Lucky Charm"` | `"+15% gambling luck"` |
| `"Gut Instinct"` | `"+12% all income"` |
| `"Hot Streak"` | `"+20% gambling luck"` |
| `"Odds Calculator"` | `"+18% gambling luck"` |
| `"Poker Face"` | `"+15% all income"` |
| `"Lucky Rituals"` | `"+25% gambling luck"` |
| `"Card Counting"` | `"+22% gambling luck"` |
| `"Pattern Recognition"` | `"+22% gambling luck"` |
| `"Composure"` | `"+20% all income"` |
| `"Ancient Talisman"` | `"+28% gambling luck"` |
| `"Optimal Strategy"` | `"+28% gambling luck"` |
| `"Probability Master"` | `"+30% gambling luck"` |
| `"Master Bluffer"` | `"+25% gambling luck"` |
| `"Nerves of Steel"` | `"+25% all income"` |
| `"Fortune Amulet"` | `"+32% gambling luck"` |
| `"Game Theory"` | `"+30% gambling luck"` |
| `"Reading Tells"` | `"+30% gambling luck"` |
| `"Zen Gambler"` | `"+30% all income"` |
| `"Lucky Relic"` | `"+38% gambling luck"` |
| `"AI Simulation"` | `"+35% gambling luck"` |
| `"Statistical Edge"` | `"+40% gambling luck"` |
| `"Psychological Warfare"` | `"+35% gambling luck"` |
| `"Flow State"` | `"+35% all income"` |
| `"Chaos Artifact"` | `"+45% gambling luck"` |
| `"Quantum Probability"` | `"+42% gambling luck"` |
| `"Hypnotic Presence"` | `"+42% gambling luck"` |
| `"Transcendent Focus"` | `"+40% all income"` |
| `"Casino VIP"` | `"+55% gambling luck"` |
| `"Probability Prophet"` | `"+55% gambling luck"` |
| `"Fortune Aura"` | `"+50% all income"` |
| `"High Roller"` | `"+60% gambling luck"` |
| `"Entropy Reader"` | `"+60% gambling luck"` |
| `"Precognition"` | `"+60% gambling luck"` |
| `"Golden Touch"` | `"+55% all income"` |
| `"Casino Owner"` | `"+70% gambling luck"` |
| `"Chaos Theory"` | `"+70% gambling luck"` |
| `"Multiverse Bets"` | `"+75% gambling luck"` |
| `"The Oracle"` | `"+70% gambling luck"` |
| `"Manifestation"` | `"+65% all income"` |
| `"Casino Empire"` | `"+85% gambling luck"` |
| `"Laplace's Demon"` | `"+80% gambling luck"` |
| `"Telekinesis"` | `"+80% gambling luck"` |
| `"Reality Distortion"` | `"+75% all income"` |
| `"Lord of Fortunes"` | `"+100% gambling luck"` |
| `"RNG Manipulator"` | `"+100% gambling luck"` |
| `"Fate Weaver"` | `"+100% all income"` |
| `"Eternal Jackpot"` | `"+120% gambling luck"` |
| `"Probability Collapse"` | `"+120% gambling luck"` |
| `"Chrono-Gambling"` | `"+110% gambling luck"` |
| `"Karmic Balance"` | `"+110% all income"` |
| `"Cosmic Fortune"` | `"+150% gambling luck"` |
| `"Maxwell's Demon"` | `"+140% gambling luck"` |
| `"God Hand"` | `"+175% gambling luck"` |
| `"Timeline Gambler"` | `"+130% gambling luck"` |
| `"Dharmic Mastery"` | `"+130% all income"` |
| `"Nebula Gambler"` | `"+200% gambling luck"` |
| `"Absolute Certainty"` | `"+200% gambling luck"` |
| `"Destiny Controller"` | `"+225% gambling luck"` |
| `"Gambling Nirvana"` | `"+200% all income"` |
| `"Luck Paradigm"` | `"+350% gambling luck"` |
| `"Omniscience"` | `"+300% gambling luck"` |
| `"Fortune Incarnate"` | `"+300% all income"` |
| `"God of Chance"` | `"+500% gambling luck"` |
| `"Absolute Fortune"` | `"+500% all income"` |

### `data/skills/empire-skills.ts` (75 nodes)

| Name | Effect Description |
|------|-------------------|
| `"Empire Foundation"` | `"+15% all income"` |
| `"Speed Reader"` | `"+15% XP gain"` |
| `"Passive Income"` | `"+15% offline efficiency"` |
| `"Find a Mentor"` | `"+20% XP gain"` |
| `"Revenue Streams"` | `"+18% all income"` |
| `"Basic Automation"` | `"+20% offline efficiency"` |
| `"Online Courses"` | `"+25% XP gain"` |
| `"Management Skills"` | `"+20% all income"` |
| `"Scaling Systems"` | `"-15% operating costs"` |
| `"Bot Workers"` | `"+22% offline efficiency"` |
| `"PhD Research"` | `"+28% XP gain"` |
| `"Delegation"` | `"+25% all income"` |
| `"Synergy"` | `"+30% business revenue"` |
| `"Data Pipeline"` | `"-20% operating costs"` |
| `"Cron Scheduler"` | `"+28% offline efficiency"` |
| `"Think Tank"` | `"+32% XP gain"` |
| `"KPI Mastery"` | `"+30% all income"` |
| `"Cloud Infrastructure"` | `"-22% operating costs"` |
| `"ML Workers"` | `"+32% offline efficiency"` |
| `"Research Lab"` | `"+38% XP gain"` |
| `"Holding Company"` | `"+35% all income"` |
| `"Enterprise ERP"` | `"+35% business revenue"` |
| `"Neural Nets"` | `"-28% operating costs"` |
| `"Bot Swarm"` | `"+38% offline efficiency"` |
| `"Private Academy"` | `"+45% XP gain"` |
| `"Global Operations"` | `"+42% all income"` |
| `"AI Core"` | `"-32% operating costs"` |
| `"Self-Repairing Systems"` | `"+45% offline efficiency"` |
| `"Research Institute"` | `"+55% XP gain"` |
| `"Conglomerate"` | `"+50% all income"` |
| `"Full Autonomy"` | `"+55% offline efficiency"` |
| `"Genius Network"` | `"+60% XP gain"` |
| `"Multinational Power"` | `"+55% all income"` |
| `"Quantum Automation"` | `"+60% offline efficiency"` |
| `"Nanobots"` | `"-35% operating costs"` |
| `"Noosphere Access"` | `"+70% XP gain"` |
| `"Government Influence"` | `"+65% all income"` |
| `"Mega AI"` | `"+70% business revenue"` |
| `"Dyson Swarm"` | `"+65% offline efficiency"` |
| `"Von Neumann Probes"` | `"-40% operating costs"` |
| `"Omniscient Learning"` | `"+85% XP gain"` |
| `"Shadow Government"` | `"+80% all income"` |
| `"Matrioshka Brain"` | `"+80% offline efficiency"` |
| `"Replicator Tech"` | `"-45% operating costs"` |
| `"Illuminated Mind"` | `"+100% XP gain"` |
| `"Galaxy Empire"` | `"+100% all income"` |
| `"Perpetual Machine"` | `"+100% offline efficiency"` |
| `"Akashic Records"` | `"+125% XP gain"` |
| `"Galactic Council"` | `"+110% all income"` |
| `"Time Dilation"` | `"+120% offline efficiency"` |
| `"Nanoforge"` | `"-50% operating costs"` |
| `"Cosmic Intellect"` | `"+150% XP gain"` |
| `"Supercluster Dominion"` | `"+140% all income"` |
| `"Omega Point"` | `"+150% business revenue"` |
| `"Temporal Loops"` | `"+150% offline efficiency"` |
| `"Zero-Point Energy"` | `"-60% operating costs"` |
| `"God-Mind"` | `"+200% XP gain"` |
| `"Universe Inc."` | `"+200% all income"` |
| `"Chronosphere"` | `"+200% offline efficiency"` |
| `"Post-Scarcity"` | `"-70% operating costs"` |
| `"Ascended Intellect"` | `"+350% XP gain"` |
| `"Multiverse Empire"` | `"+300% all income"` |
| `"Eternal Engine"` | `"+300% offline efficiency"` |
| `"Reality Architect"` | `"+500% all income"` |
| `"Perpetuum Mobile"` | `"+500% offline efficiency"` |

### `data/skills/prestige-skills.ts` (75 nodes)

| Name | Effect Description |
|------|-------------------|
| `"First Rebirth"` | `"+15% prestige gain"` |
| `"Echoes of Wealth"` | `"+15% prestige gain"` |
| `"Inherited Instincts"` | `"+12% all income"` |
| `"Rebirth Momentum"` | `"+20% prestige gain"` |
| `"Muscle Memory"` | `"+18% XP gain"` |
| `"Adaptive Genes"` | `"+15% all income"` |
| `"Faster Cycles"` | `"+25% prestige gain"` |
| `"Déjà Vu"` | `"+22% prestige gain"` |
| `"Knowledge Retention"` | `"+22% XP gain"` |
| `"Rapid Evolution"` | `"+20% all income"` |
| `"Prestige Accelerator"` | `"+28% prestige gain"` |
| `"Past Life Mastery"` | `"+28% prestige gain"` |
| `"Rebirth Nexus"` | `"+30% prestige gain"` |
| `"Eternal Scholar"` | `"+28% XP gain"` |
| `"Beneficial Mutations"` | `"+25% all income"` |
| `"Time Loop"` | `"+32% prestige gain"` |
| `"Legacy Builder"` | `"+30% prestige gain"` |
| `"Ancient Sage"` | `"+30% XP gain"` |
| `"Phoenix Rising"` | `"+30% all income"` |
| `"Recursion"` | `"+38% prestige gain"` |
| `"Soul Imprint"` | `"+35% prestige gain"` |
| `"Akashic Memory"` | `"+40% XP gain"` |
| `"Profit Prophet"` | `"+35% all income"` |
| `"Hydra Protocol"` | `"+35% prestige gain"` |
| `"Spiral Dynamics"` | `"+45% prestige gain"` |
| `"True Reincarnation"` | `"+42% prestige gain"` |
| `"Eternity Codex"` | `"+42% all income"` |
| `"Ouroboros"` | `"+42% prestige gain"` |
| `"Prestige Singularity"` | `"+55% prestige gain"` |
| `"Eternal Knowledge"` | `"+55% XP gain"` |
| `"Omega Rebirth"` | `"+50% all income"` |
| `"Prestige Cascade"` | `"+60% prestige gain"` |
| `"Soul Forge"` | `"+60% prestige gain"` |
| `"Temporal Archive"` | `"+55% all income"` |
| `"Metamorphosis"` | `"+55% prestige gain"` |
| `"Infinite Prestige"` | `"+70% prestige gain"` |
| `"Avatar of Wealth"` | `"+70% prestige gain"` |
| `"Omni-Memory"` | `"+75% XP gain"` |
| `"Dimensional Shift"` | `"+65% all income"` |
| `"First Ascension"` | `"+65% prestige gain"` |
| `"Hyper-Prestige"` | `"+85% prestige gain"` |
| `"Wealth Incarnate"` | `"+80% all income"` |
| `"Cosmic Inheritance"` | `"+80% prestige gain"` |
| `"Transcendence"` | `"+75% all income"` |
| `"Ultra-Prestige"` | `"+100% prestige gain"` |
| `"Eon Wisdom"` | `"+100% XP gain"` |
| `"God Form"` | `"+100% all income"` |
| `"Big Bang Rebirth"` | `"+125% prestige gain"` |
| `"Temporal Flux"` | `"+110% prestige gain"` |
| `"Reality Weaver"` | `"+120% all income"` |
| `"Financial Nirvana"` | `"+110% prestige gain"` |
| `"Entropy Reversal"` | `"+150% prestige gain"` |
| `"Multiverse Prestige"` | `"+140% prestige gain"` |
| `"Cosmic Blueprint"` | `"+150% XP gain"` |
| `"Fabric of Fortune"` | `"+130% all income"` |
| `"Apotheosis"` | `"+140% prestige gain"` |
| `"Beyond Heat Death"` | `"+200% prestige gain"` |
| `"Omni-Prestige"` | `"+200% prestige gain"` |
| `"Cosmic Architect"` | `"+225% all income"` |
| `"Eternal Being"` | `"+200% prestige gain"` |
| `"Alpha & Omega"` | `"+350% prestige gain"` |
| `"Planck Wealth"` | `"+300% all income"` |
| `"The Source"` | `"+300% prestige gain"` |
| `"Absolute Prestige"` | `"+500% prestige gain"` |
| `"The Creator"` | `"+500% all income"` |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| View files | 13 |
| Component files | ~55 |
| Data entity definitions | ~750+ (skills: 375, deposits: 10, loans: 16, businesses: 12, jobs: 6, stocks: 8, cryptos: 8, properties: 9, gambling games: 10, lottery tickets: 4, events: ~30, achievements: ~33, prestige upgrades: 14, perks: 17, milestones: 16, eras: 6, startup sectors: 10, stages: 5, traits: 14) |
| Unique hardcoded strings | ~2,500+ |
