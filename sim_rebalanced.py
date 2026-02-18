"""
Rebalanced Progression Verification — using REAL current business data
"""
import math

LEVEL_COST_GROWTH = 1.18
LEVEL_OUTPUT_EXP = 1.05
BRANCH_COST_GROWTH_NEW = 1.30      # was 1.65
TRAINING_COST_GROWTH_NEW = 1.25    # was 1.40

GEO_TIERS = [(0, 1.0, "Local"), (5, 1.5, "Regional"), (12, 2.5, "National"), (20, 4.0, "Continental"), (30, 7.0, "Global"), (45, 12.0, "Interplanetary")]

def get_geo(branches):
    m, n = 1.0, "Local"
    for minB, mult, name in GEO_TIERS:
        if branches >= minB: m, n = mult, name
    return m, n

BUSINESSES = {
    "Lemonade": dict(pp=12000, baseCust=5, optP=2.2, sCost=1.0, rent=0.3, sal=0.5, outPerEmp=4, qual=50, elast=1.2, maxEmp=5, brBase=60000, trBase=5000),
    "Pizzeria": dict(pp=350000, baseCust=10, optP=24.0, sCost=11.0, rent=4.0, sal=2.5, outPerEmp=3, qual=50, elast=1.1, maxEmp=6, brBase=1800000, trBase=50000),
    "Nightclub": dict(pp=60000000, baseCust=36, optP=690.0, sCost=310.0, rent=50.0, sal=30.0, outPerEmp=5, qual=50, elast=1.0, maxEmp=10, brBase=300000000, trBase=1500000),
    "TechStartup": dict(pp=1250000000, baseCust=110, optP=5600.0, sCost=2520.0, rent=200.0, sal=100.0, outPerEmp=8, qual=55, elast=0.6, maxEmp=20, brBase=6000000000, trBase=30000000),
    "Bank": dict(pp=60000000000, baseCust=77, optP=253000.0, sCost=113850.0, rent=1000.0, sal=500.0, outPerEmp=6, qual=60, elast=0.4, maxEmp=20, brBase=300000000000, trBase=1250000000),
}

def cust_demand(baseCust, optP, quality, elast):
    qualFac = 0.5 + (quality / 100) * 1.5
    return max(0, math.floor(baseCust * qualFac))

def op_costs(emp, sal, rent, sCost, sold, branches):
    return emp * sal + rent * (1 + branches * 0.3) + sCost * sold

def sim(name, b):
    pp, baseCust, optP, sCost = b['pp'], b['baseCust'], b['optP'], b['sCost']
    rent, sal, outPerEmp = b['rent'], b['sal'], b['outPerEmp']
    qual, elast, maxEmp = b['qual'], b['elast'], b['maxEmp']
    brBase, trBase = b['brBase'], b['trBase']

    print(f"\n{'='*90}")
    print(f"  {name} (purchase ${pp:,.0f})")
    print(f"{'='*90}")

    # Baseline: 1 employee
    emp = 1
    d0 = cust_demand(baseCust, optP, qual, elast)
    c0 = emp * outPerEmp
    s0 = min(d0, c0)
    r0 = s0 * optP
    co0 = op_costs(emp, sal, rent, sCost, s0, 0)
    p0 = r0 - co0
    print(f"  Baseline (L1, 1 emp): D={d0}, Cap={c0}, Sold={s0}, Profit={p0:.1f}/tick, ROI={pp/p0/600:.1f}min" if p0 > 0 else f"  Baseline LOSS")

    # Full staff baseline
    empF = maxEmp
    cF = empF * outPerEmp
    sF = min(d0, cF)
    rF = sF * optP
    coF = op_costs(empF, sal, rent, sCost, sF, 0)
    pF = rF - coF
    print(f"  Full staff (L1, {empF} emp): D={d0}, Cap={cF}, Sold={sF}, Profit={pF:.1f}/tick")

    # ── LEVELS ──
    print(f"\n  LEVELS:")
    print(f"  {'Lv':>4} {'Cost':>14} {'Emp':>4} {'LvCustX':>8} {'Demand':>7} {'Cap':>6} {'Sold':>5} {'Profit':>12} {'Marg':>10} {'ROI min':>10}")
    prevP = pF
    for lv in [1, 2, 3, 5, 10, 15, 20, 25, 50]:
        lvCost = pp * LEVEL_COST_GROWTH ** lv
        lvMult = lv ** LEVEL_OUTPUT_EXP
        emp = maxEmp + (lv // 5) * 2
        lvCustMult = 1 + math.log2(lv + 1) * 0.25
        demand = math.floor(d0 * lvCustMult)
        cap = math.floor(emp * outPerEmp * lvMult)
        sold = min(demand, cap)
        rev = sold * optP
        cost = op_costs(emp, sal, rent, sCost, sold, 0)
        profit = rev - cost
        marg = profit - prevP
        roi = f"{lvCost/marg/600:.1f}" if marg > 0 else "INF"
        prevP = profit
        print(f"  {lv:4d} {lvCost:14,.0f} {emp:4d} {lvCustMult:8.3f} {demand:7d} {cap:6d} {sold:5d} {profit:12.1f} {marg:10.1f} {roi:>10}")

    # ── BRANCHES ──
    print(f"\n  BRANCHES (growth {BRANCH_COST_GROWTH_NEW}):")
    print(f"  {'Br':>4} {'Cost':>14} {'BrCusX':>7} {'Geo':>5} {'Demand':>7} {'Cap':>6} {'Sold':>5} {'Profit':>12} {'Marg':>10} {'ROI min':>10} {'Tier'}")
    prevP = pF
    for br in [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 45]:
        brCost = brBase * BRANCH_COST_GROWTH_NEW ** br
        geoM, geoN = get_geo(br)
        brCustMult = 1 + br * 0.15
        demand = math.floor(d0 * brCustMult)
        cap = math.floor(empF * outPerEmp * (1 + br * 0.5))
        sold = min(demand, cap)
        rev = sold * optP * geoM
        cost = op_costs(empF, sal, rent, sCost, sold, br)
        profit = rev - cost
        marg = profit - prevP
        roi = f"{brCost/marg/600:.1f}" if marg > 0 else "INF"
        prevP = profit
        print(f"  {br:4d} {brCost:14,.0f} {brCustMult:7.2f} {geoM:5.1f} {demand:7d} {cap:6d} {sold:5d} {profit:12.1f} {marg:10.1f} {roi:>10} {geoN}")

    # ── TRAINING ──
    print(f"\n  TRAINING (growth {TRAINING_COST_GROWTH_NEW}):")
    print(f"  {'TL':>4} {'Cost':>14} {'EffQual':>8} {'Demand':>7} {'Cap':>5} {'Sold':>5} {'Profit':>12} {'Marg':>10} {'ROI min':>10}")
    prevP = pF
    for tl in [1, 2, 3, 5, 8, 10, 15, 20]:
        tCost = trBase * TRAINING_COST_GROWTH_NEW ** tl
        effQual = min(100, qual + tl * 2)
        trainMult = 1 + tl * 0.05
        demand = cust_demand(baseCust, optP, effQual, elast)
        cap = math.floor(empF * outPerEmp * trainMult)
        sold = min(demand, cap)
        rev = sold * optP
        cost = op_costs(empF, sal, rent, sCost, sold, 0)
        profit = rev - cost
        marg = profit - prevP
        roi = f"{tCost/marg/600:.1f}" if marg > 0 else "INF"
        prevP = profit
        print(f"  {tl:4d} {tCost:14,.0f} {effQual:8.1f} {demand:7d} {cap:5d} {sold:5d} {profit:12.1f} {marg:10.1f} {roi:>10}")

    # ── COMBINED ──
    for label, lv, br, tl in [("Mid-game", 10, 10, 5), ("Corporation", 25, 15, 10), ("Late-game", 50, 30, 20)]:
        lvMult = lv ** LEVEL_OUTPUT_EXP
        trainMult = 1 + tl * 0.05
        emp = maxEmp + (lv // 5) * 2
        lvCustMult = 1 + math.log2(lv + 1) * 0.25
        brCustMult = 1 + br * 0.15
        effQual = min(100, qual + tl * 2)
        geoM, geoN = get_geo(br)
        demand = math.floor(cust_demand(baseCust, optP, effQual, elast) * lvCustMult * brCustMult)
        cap = math.floor(emp * outPerEmp * lvMult * trainMult * (1 + br * 0.5))
        sold = min(demand, cap)
        corpMult = (1 + 0.15 * 2 ** 1.5) if label == "Corporation" else 1.0
        rev = sold * optP * geoM * corpMult
        cost = op_costs(emp, sal, rent, sCost, sold, br)
        profit = rev - cost
        totalInv = pp
        for l in range(1, lv): totalInv += pp * LEVEL_COST_GROWTH ** l
        for b2 in range(1, br + 1): totalInv += brBase * BRANCH_COST_GROWTH_NEW ** b2
        for t in range(1, tl + 1): totalInv += trBase * TRAINING_COST_GROWTH_NEW ** t
        roi = f"{totalInv/profit/600:.1f}min" if profit > 0 else "LOSS"
        print(f"\n  {label} (L{lv}+{br}br+TL{tl}): D={demand}, Cap={cap}, Sold={sold}, {geoN}")
        print(f"    Profit={profit:.1f}/tick ({profit/max(0.01,pF):.1f}x baseline), Invested=${totalInv:,.0f}, ROI={roi}")

for name, biz in BUSINESSES.items():
    sim(name, biz)
