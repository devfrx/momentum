"""Quick simulation of business balance at level 1, full staff, optimal price."""
import math

# ═══ CURRENT (BROKEN) VALUES ═══
old_businesses = [
    {"id": "lemonade",     "price": 12000,       "cust": 5,  "q": 50, "optP": 1.6,  "out": 4, "emp": 5,  "sal": 0.55, "rent": 0.35, "sup": 0.65},
    {"id": "newspaper",    "price": 35000,       "cust": 8,  "q": 40, "optP": 2.4,  "out": 6, "emp": 8,  "sal": 0.80, "rent": 0.60, "sup": 1.3},
    {"id": "carwash",      "price": 120000,      "cust": 4,  "q": 50, "optP": 8,    "out": 2, "emp": 6,  "sal": 1.35, "rent": 2.3,  "sup": 3.8},
    {"id": "pizzeria",     "price": 350000,      "cust": 8,  "q": 50, "optP": 6.5,  "out": 3, "emp": 10, "sal": 1.70, "rent": 4.6,  "sup": 3.8},
    {"id": "gym",          "price": 1000000,     "cust": 6,  "q": 50, "optP": 16,   "out": 4, "emp": 12, "sal": 2.80, "rent": 9.0,  "sup": 3.3},
    {"id": "cafe",         "price": 2500000,     "cust": 15, "q": 55, "optP": 4,    "out": 6, "emp": 15, "sal": 2.0,  "rent": 6.8,  "sup": 2.2},
    {"id": "boutique",     "price": 6000000,     "cust": 5,  "q": 60, "optP": 32,   "out": 2, "emp": 8,  "sal": 3.4,  "rent": 14,   "sup": 20},
    {"id": "restaurant",   "price": 20000000,    "cust": 4,  "q": 65, "optP": 48,   "out": 2, "emp": 10, "sal": 5.5,  "rent": 20,   "sup": 27.5},
    {"id": "nightclub",    "price": 60000000,    "cust": 12, "q": 50, "optP": 20,   "out": 4, "emp": 15, "sal": 4.5,  "rent": 33,   "sup": 8.8},
    {"id": "hotel",        "price": 250000000,   "cust": 8,  "q": 60, "optP": 85,   "out": 2, "emp": 20, "sal": 9.0,  "rent": 80,   "sup": 38},
    {"id": "tech_startup", "price": 1250000000,  "cust": 20, "q": 50, "optP": 25,   "out": 5, "emp": 25, "sal": 16.5, "rent": 55,   "sup": 5.5},
    {"id": "factory",      "price": 6000000000,  "cust": 15, "q": 55, "optP": 100,  "out": 4, "emp": 30, "sal": 13.5, "rent": 160,  "sup": 55},
    {"id": "bank",         "price": 60000000000, "cust": 10, "q": 60, "optP": 250,  "out": 3, "emp": 20, "sal": 44,   "rent": 320,  "sup": 27.5},
]

# ═══ REBALANCED VALUES ═══
# Design targets:
#   - All businesses profitable at full staff, optimal price, level 1
#   - Margins: 28–35%
#   - ROI: 8min (starter) → 12-30hrs (endgame, reduced by skill/prestige multipliers)
#   - Capacity ≈ demand (minimal waste)
#   - Late-game: higher unit prices to reflect industry scale
new_businesses = [
    # ── Starter ──────────────────────────────────────────────
    {"id": "lemonade",     "price": 12000,       "cust": 5,  "q": 50, "optP": 1.6,   "out": 4, "emp": 5,  "sal": 0.55,  "rent": 0.35,  "sup": 0.65},   # KEEP
    {"id": "newspaper",    "price": 35000,       "cust": 8,  "q": 45, "optP": 2.4,   "out": 4, "emp": 4,  "sal": 0.70,  "rent": 0.50,  "sup": 1.25},   # fix margin
    # ── Services ─────────────────────────────────────────────
    {"id": "carwash",      "price": 120000,      "cust": 6,  "q": 50, "optP": 8,     "out": 2, "emp": 5,  "sal": 1.40,  "rent": 2.5,   "sup": 3.9},    # fix cap
    {"id": "gym",          "price": 1000000,     "cust": 8,  "q": 50, "optP": 18,    "out": 2, "emp": 7,  "sal": 3.20,  "rent": 9.0,   "sup": 8.5},    # fix cap/cost
    {"id": "hotel",        "price": 250000000,   "cust": 16, "q": 60, "optP": 120,   "out": 2, "emp": 14, "sal": 16.0,  "rent": 95,    "sup": 62},     # scale up price
    # ── Food ─────────────────────────────────────────────────
    {"id": "pizzeria",     "price": 350000,      "cust": 10, "q": 50, "optP": 7.0,   "out": 3, "emp": 6,  "sal": 1.80,  "rent": 4.5,   "sup": 3.3},    # fix margin
    {"id": "cafe",         "price": 2500000,     "cust": 16, "q": 55, "optP": 5.5,   "out": 3, "emp": 9,  "sal": 2.20,  "rent": 6.0,   "sup": 2.5},    # FIXED LOSS
    {"id": "restaurant",   "price": 20000000,    "cust": 7,  "q": 60, "optP": 60,    "out": 2, "emp": 7,  "sal": 8.00,  "rent": 24,    "sup": 31},     # fix margin
    # ── Retail ───────────────────────────────────────────────
    {"id": "boutique",     "price": 6000000,     "cust": 6,  "q": 55, "optP": 38,    "out": 2, "emp": 5,  "sal": 5.00,  "rent": 14,    "sup": 19},     # fix margin
    # ── Entertainment ────────────────────────────────────────
    {"id": "nightclub",    "price": 60000000,    "cust": 20, "q": 50, "optP": 28,    "out": 3, "emp": 10, "sal": 7.50,  "rent": 35,    "sup": 15},     # boost rev
    # ── Tech ─────────────────────────────────────────────────
    {"id": "tech_startup", "price": 1250000000,  "cust": 50, "q": 55, "optP": 150,   "out": 5, "emp": 20, "sal": 55.0,  "rent": 120,   "sup": 85},     # MASSIVE fix
    # ── Industry ─────────────────────────────────────────────
    {"id": "factory",      "price": 6000000000,  "cust": 40, "q": 55, "optP": 600,   "out": 4, "emp": 25, "sal": 120.0, "rent": 250,   "sup": 350},    # big fix
    # ── Finance ──────────────────────────────────────────────
    {"id": "bank",         "price": 60000000000, "cust": 20, "q": 60, "optP": 6600,  "out": 3, "emp": 20, "sal": 600.0, "rent": 2500,  "sup": 4200},   # big fix
]


def sim(label, businesses):
    print(f"\n=== {label} ===")
    print(f"{'ID':15s} | {'dmd':>4s} {'cap':>4s} {'sold':>4s} | {'revenue':>10s} {'costs':>10s} {'profit':>10s} | {'margin':>7s} | {'ROI min':>10s} | {'$/s':>8s}")
    print("-" * 110)
    for b in businesses:
        qf = 0.5 + (b["q"] / 100) * 1.5
        demand = math.floor(b["cust"] * qf)
        cap = b["emp"] * b["out"]
        sold = min(demand, cap)
        rev = sold * b["optP"]
        costs = b["emp"] * b["sal"] + b["rent"] + b["sup"] * sold
        profit = rev - costs
        margin = profit / rev * 100 if rev > 0 else 0
        roi = b["price"] / (profit * 10 * 60) if profit > 0 else float("inf")
        ps = profit * 10  # profit per second
        status = "OK" if profit > 0 else "LOSS!"
        print(f"{b['id']:15s} | {demand:4d} {cap:4d} {sold:4d} | {rev:10.1f} {costs:10.1f} {profit:10.1f} | {margin:6.1f}% | {roi:10.1f} | {ps:8.1f} {status}")


sim("CURRENT (BROKEN)", old_businesses)
sim("REBALANCED", new_businesses)
