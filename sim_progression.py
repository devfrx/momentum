"""
Full business progression simulation.
Analyzes: levels, branches, training, upgrades, corporation.
"""
import math

LEVEL_COST_GROWTH   = 1.18
LEVEL_OUTPUT_EXP    = 1.05
BRANCH_COST_GROWTH  = 1.65
TRAINING_COST_GROWTH = 1.40

# name, price, out, maxEBase, cust, qual, optP, sup, sal, rent, branchCost, trainCost
DATA = [
    ("Lemonade",   12000,         4, 5,  5,  50, 2.2, 1.0, 0.5, 0.3,  60000,       5000),
    ("Newspaper",  35000,         4, 4,  8,  45, 3.9, 1.75, 0.8, 0.5, 180000,      12000),
    ("Carwash",    120000,        2, 5,  6,  50, 18,  8,   1.5, 2.0,  600000,      20000),
    ("Pizzeria",   350000,        3, 6, 10,  50, 24,  11,  2.5, 4.0,  1800000,     50000),
    ("Gym",        1000000,       3, 7, 15,  50, 54,  24,  5,   8,    5000000,     125000),
    ("Cafe",       2500000,       4, 9, 25,  55, 75,  34,  6,   10,   12000000,    200000),
    ("Boutique",   6000000,       3, 5, 10,  55, 188, 85,  10,  15,   30000000,    375000),
    ("Restaurant", 20000000,      3, 7, 14,  60, 480, 216, 20,  30,   100000000,   750000),
    ("Nightclub",  60000000,      5, 10, 36, 50, 690, 310, 30,  50,   300000000,   1500000),
    ("Hotel",      250000000,     4, 14, 36, 60, 2800,1260,50,  100,  1250000000,  7500000),
    ("Tech",       1250000000,    8, 20,110, 55, 5600,2520,100, 200,  6000000000,  30000000),
    ("Factory",    6000000000,    8, 25,135, 55,23000,10350,200,400,  30000000000, 150000000),
    ("Bank",       60000000000,   6, 20, 77, 60,253000,113850,500,1000,300000000000,1250000000),
]

def compute_profit(out, maxE, cust, qual, optP, sup, sal, rent,
                   level=1, branches=0, trainingLvl=0, employees=None,
                   upgRevMult=1, upgCostRed=1, upgCustMult=1, upgOutputMult=1, upgQualMult=1,
                   isCorp=False, catCount=1):
    """Compute per-tick profit with all multipliers."""
    if employees is None:
        employees = maxE + (level // 5) * 2
    
    levelMult = level ** LEVEL_OUTPUT_EXP
    trainingMult = 1 + trainingLvl * 0.05
    effQual = qual * upgQualMult
    qf = 0.5 + (effQual / 100) * 1.5
    demand = int(cust * qf * upgCustMult)
    
    effOut = out * levelMult * trainingMult * upgOutputMult
    cap = int(employees * effOut * (1 + branches * 0.5))
    sold = min(demand, cap)
    
    # Revenue multipliers
    geoMult = 1.0
    if branches >= 50: geoMult = 12.0
    elif branches >= 40: geoMult = 7.0
    elif branches >= 30: geoMult = 4.0
    elif branches >= 20: geoMult = 2.5
    elif branches >= 10: geoMult = 1.5
    
    synergyMult = 1 + 0.1 * max(0, catCount - 1) ** 1.2 if catCount > 1 else 1
    corpMult = (1 + 0.05 * catCount ** 1.5) if isCorp else 1
    
    revMultTotal = geoMult * synergyMult * corpMult * upgRevMult
    
    rev = sold * optP * revMultTotal
    
    # Costs
    wages = employees * sal
    adj_rent = rent * (1 + branches * 0.3)
    supply = sup * sold
    costs = (wages + adj_rent + supply) / upgCostRed
    
    profit = rev - costs
    return profit, rev, costs, sold, cap, demand


def fmt(n):
    if abs(n) >= 1e12: return f"{n/1e12:.1f}T"
    if abs(n) >= 1e9: return f"{n/1e9:.1f}B"
    if abs(n) >= 1e6: return f"{n/1e6:.1f}M"
    if abs(n) >= 1e3: return f"{n/1e3:.1f}K"
    return f"{n:.1f}"


# ============================================================
# 1. LEVEL-UP ROI ANALYSIS
# ============================================================
print("=" * 130)
print("1. LEVEL-UP ROI (max employees at each level, no branches/training/upgrades)")
print("   Shows: how much each level costs, profit gain, and ROI of that single level")
print("=" * 130)

for name, price, out, maxE, cust, qual, optP, sup, sal, rent, brCost, trCost in DATA:
    print(f"\n--- {name} (price={fmt(price)}) ---")
    hdr = f"{'Lvl':>4} {'LvlCost':>14} {'TotalInv':>14} {'MaxE':>5} {'Cap':>7} {'Sold':>5} {'Prof/t':>12} {'Prof/s':>12} {'ROI_lvl':>10} {'ROI_total':>10}"
    print(hdr)
    
    totalInvested = price
    prevProfPerS = 0
    for lvl in [1, 2, 3, 5, 10, 15, 20, 25, 50]:
        lvlCost = price * (LEVEL_COST_GROWTH ** lvl) if lvl > 1 else 0
        totalInvested_at_lvl = price + sum(price * (LEVEL_COST_GROWTH ** l) for l in range(2, lvl + 1))
        
        curMaxE = maxE + (lvl // 5) * 2
        profit, rev, costs, sold, cap, demand = compute_profit(
            out, maxE, cust, qual, optP, sup, sal, rent,
            level=lvl, employees=curMaxE
        )
        profS = profit * 10
        
        marginalProfS = profS - prevProfPerS
        roiLvl = lvlCost / (marginalProfS * 60) if marginalProfS > 0 and lvl > 1 else 0
        roiTotal = totalInvested_at_lvl / (profS * 60) if profS > 0 else float('inf')
        
        prevProfPerS = profS
        
        roiLvlStr = f"{roiLvl:.1f}m" if roiLvl < 9999 else "INF"
        roiTotStr = f"{roiTotal:.1f}m" if roiTotal < 99999 else "INF"
        
        print(f"{lvl:>4} {fmt(lvlCost):>14} {fmt(totalInvested_at_lvl):>14} {curMaxE:>5} {cap:>7} {sold:>5} {fmt(profit):>12} {fmt(profS):>12} {roiLvlStr:>10} {roiTotStr:>10}")


# ============================================================
# 2. BRANCH ROI ANALYSIS
# ============================================================
print("\n\n" + "=" * 130)
print("2. BRANCH ROI (level=1, max base employees, adding branches)")
print("   Key question: is the branch cost justified by the production increase?")
print("=" * 130)

for name, price, out, maxE, cust, qual, optP, sup, sal, rent, brCost, trCost in DATA:
    print(f"\n--- {name} (branchBaseCost={fmt(brCost)}) ---")
    print(f"{'Br':>4} {'BrCost':>14} {'TotalBrInv':>14} {'Cap':>7} {'Sold':>5} {'Rev/t':>12} {'Cost/t':>10} {'Prof/t':>12} {'Prof/s':>12} {'BR_ROI':>10} {'GeoTier':>12}")
    
    totalBrInv = 0
    prevProfS = 0
    for br in [0, 1, 2, 5, 10, 15, 20, 25, 30, 40, 50]:
        thisBrCost = brCost * (BRANCH_COST_GROWTH ** br) if br > 0 else 0
        totalBrInv_at = sum(brCost * (BRANCH_COST_GROWTH ** b) for b in range(1, br + 1))
        
        profit, rev, costs, sold, cap, demand = compute_profit(
            out, maxE, cust, qual, optP, sup, sal, rent,
            level=1, branches=br, employees=maxE
        )
        profS = profit * 10
        
        geo = "Local"
        if br >= 50: geo = "Interplan."
        elif br >= 40: geo = "Global"
        elif br >= 30: geo = "Continental"
        elif br >= 20: geo = "National"
        elif br >= 10: geo = "Regional"
        
        margProfS = profS - prevProfS
        brRoi = thisBrCost / (margProfS * 60) if margProfS > 0 and br > 0 else 0
        brRoiStr = f"{brRoi:.1f}m" if brRoi < 999999 else "INF"
        
        prevProfS = profS
        print(f"{br:>4} {fmt(thisBrCost):>14} {fmt(totalBrInv_at):>14} {cap:>7} {sold:>5} {fmt(rev):>12} {fmt(costs):>10} {fmt(profit):>12} {fmt(profS):>12} {brRoiStr:>10} {geo:>12}")


# ============================================================
# 3. TRAINING ROI ANALYSIS
# ============================================================
print("\n\n" + "=" * 130)
print("3. TRAINING ROI (level=1, max base employees, no branches)")
print("   Each training level = +5% output multiplier")
print("=" * 130)

for name, price, out, maxE, cust, qual, optP, sup, sal, rent, brCost, trCost in DATA:
    print(f"\n--- {name} (trainBaseCost={fmt(trCost)}) ---")
    print(f"{'TrLvl':>6} {'TrCost':>14} {'TotalTrInv':>14} {'EffOut':>8} {'Cap':>7} {'Sold':>5} {'Prof/t':>12} {'Prof/s':>12} {'TR_ROI':>10}")
    
    prevProfS = 0
    for tl in [0, 1, 2, 3, 5, 10, 15, 20]:
        thisTrCost = trCost * (TRAINING_COST_GROWTH ** tl) if tl > 0 else 0
        totalTrInv = sum(trCost * (TRAINING_COST_GROWTH ** t) for t in range(1, tl + 1))
        
        profit, rev, costs, sold, cap, demand = compute_profit(
            out, maxE, cust, qual, optP, sup, sal, rent,
            level=1, trainingLvl=tl, employees=maxE
        )
        profS = profit * 10
        effOut = out * (1 + tl * 0.05)
        
        margProfS = profS - prevProfS
        trRoi = thisTrCost / (margProfS * 60) if margProfS > 0 and tl > 0 else 0
        trRoiStr = f"{trRoi:.1f}m" if trRoi < 999999 else "INF"
        
        prevProfS = profS
        print(f"{tl:>6} {fmt(thisTrCost):>14} {fmt(totalTrInv):>14} {effOut:>8.2f} {cap:>7} {sold:>5} {fmt(profit):>12} {fmt(profS):>12} {trRoiStr:>10}")


# ============================================================
# 4. UPGRADE ROI ANALYSIS (universal upgrades)
# ============================================================
print("\n\n" + "=" * 130)
print("4. UPGRADE ROI (universal upgrades at various levels)")
print("   efficiency_boost: +10% rev_mult x log2(L+1), cost=1000 x 1.25^L")
print("   bulk_discount: +5% cost_red x log2(L+1), cost=2000 x 1.30^L")
print("   brand_awareness: +8% cust_mult x log2(L+1), cost=5000 x 1.28^L")
print("   automation: +6% output_mult x log2(L+1), cost=10000 x 1.35^L")
print("   workforce_expansion: +2 emp_cap x log2(L+1), cost=15000 x 1.40^L")
print("=" * 130)

UPGRADES = [
    ("efficiency",  0.10, 1000,  1.25, "rev_mult"),
    ("bulk_disc",   0.05, 2000,  1.30, "cost_red"),
    ("brand",       0.08, 5000,  1.28, "cust_mult"),
    ("automation",  0.06, 10000, 1.35, "output_mult"),
    ("workforce",   2.0,  15000, 1.40, "emp_cap"),
]

for upgName, baseBonus, baseCost, growth, effType in UPGRADES:
    print(f"\n--- {upgName} ({effType}, base_bonus={baseBonus}, base_cost={fmt(baseCost)}, growth={growth}x) ---")
    print(f"{'Lvl':>4} {'Cost':>14} {'TotalInv':>14} {'Bonus':>10} {'CumBonus':>10}")
    for lvl in [1, 2, 3, 5, 10, 15, 20, 30, 50]:
        cost = baseCost * (growth ** lvl)
        totalInv = sum(baseCost * (growth ** l) for l in range(1, lvl + 1))
        bonus = baseBonus * math.log2(lvl + 1)
        # Cumulative = sum of bonuses from level 1 to lvl (each upgrade level gives its own bonus computation)
        # Actually the bonus IS the cumulative at that level (not marginal)
        print(f"{lvl:>4} {fmt(cost):>14} {fmt(totalInv):>14} {bonus:>10.3f} {bonus:>10.3f}")

# Show how upgrades affect a mid-game business (Nightclub as example)
print("\n\n--- UPGRADE IMPACT ON NIGHTCLUB (lvl=1, maxE=10, 0 branches) ---")
name_idx = 8  # Nightclub
_, price, out, maxE, cust, qual, optP, sup, sal, rent, brCost, trCost = DATA[name_idx]
baseProfit, *_ = compute_profit(out, maxE, cust, qual, optP, sup, sal, rent, employees=maxE)
baseProfS = baseProfit * 10
print(f"Base profit/s: {fmt(baseProfS)}")

for upgName, baseBonus, baseCost, growth, effType in UPGRADES:
    for lvl in [5, 10, 20]:
        bonus = baseBonus * math.log2(lvl + 1)
        totalInv = sum(baseCost * (growth ** l) for l in range(1, lvl + 1))
        
        kw = {}
        if effType == "rev_mult": kw["upgRevMult"] = 1 + bonus
        elif effType == "cost_red": kw["upgCostRed"] = 1 + bonus
        elif effType == "cust_mult": kw["upgCustMult"] = 1 + bonus
        elif effType == "output_mult": kw["upgOutputMult"] = 1 + bonus
        elif effType == "emp_cap":
            emp_extra = int(bonus)
            kw["employees"] = maxE + emp_extra
        
        profit, *_ = compute_profit(out, maxE, cust, qual, optP, sup, sal, rent, **kw)
        profS = profit * 10
        margS = profS - baseProfS
        roi = totalInv / (margS * 60) if margS > 0 else float('inf')
        roiStr = f"{roi:.1f}m" if roi < 999999 else "INF"
        print(f"  {upgName} lvl {lvl}: bonus={bonus:.3f}, cost={fmt(totalInv)}, profS={fmt(profS)}, gain={fmt(margS)}/s, ROI={roiStr}")


# ============================================================
# 5. ADVISOR ROI ANALYSIS
# ============================================================
print("\n\n" + "=" * 130)
print("5. ADVISOR COSTS (cost = purchasePrice x baseCostMult x costGrowth ^ level)")
print("=" * 130)

ADVISORS = [
    ("operations", 0.5, 2.0, 0.05, "cost_red (capped 90%)"),
    ("marketing",  0.4, 2.0, 0.10, "marketing_eff"),
    ("hr",         0.3, 1.8, 0.05, "output_boost"),
    ("cfo",        0.6, 2.2, 0.02, "auto_price_adjust"),
]

for name, price, out, maxE, cust, qual, optP, sup, sal, rent, brCost, trCost in [DATA[0], DATA[4], DATA[8], DATA[12]]:
    print(f"\n--- {name} (price={fmt(price)}) ---")
    for advName, costMult, costGrowth, baseEff, desc in ADVISORS:
        print(f"  {advName} ({desc}):")
        for lvl in [1, 2, 3, 5, 10]:
            cost = price * costMult * (costGrowth ** (lvl - 1))
            totalCost = sum(price * costMult * (costGrowth ** l) for l in range(lvl))
            effect = baseEff * lvl
            print(f"    Lvl {lvl}: cost={fmt(cost)}, total={fmt(totalCost)}, effect={effect:.0%}")


# ============================================================
# 6. CORPORATION ANALYSIS
# ============================================================
print("\n\n" + "=" * 130)
print("6. CORPORATION REQUIREMENTS & COST")
print("   Requires: level >= 50, branches >= 25")
print("   Shows total investment needed to reach requirements")
print("=" * 130)

for name, price, out, maxE, cust, qual, optP, sup, sal, rent, brCost, trCost in DATA:
    # Cost to reach level 50
    lvlInv = sum(price * (LEVEL_COST_GROWTH ** l) for l in range(2, 51))
    # Cost to reach 25 branches
    brInv = sum(brCost * (BRANCH_COST_GROWTH ** b) for b in range(1, 26))
    totalCorpInv = price + lvlInv + brInv
    
    # Profit at lvl 50, 25 branches, maxE at that level
    curMaxE = maxE + (50 // 5) * 2
    profit, rev, costs, sold, cap, demand = compute_profit(
        out, maxE, cust, qual, optP, sup, sal, rent,
        level=50, branches=25, employees=curMaxE, isCorp=True, catCount=1
    )
    profS = profit * 10
    totalRoi = totalCorpInv / (profS * 60) if profS > 0 else float('inf')
    
    # Also compute base profit at lvl50+25br WITHOUT corp
    profitNoCorp, *_ = compute_profit(
        out, maxE, cust, qual, optP, sup, sal, rent,
        level=50, branches=25, employees=curMaxE, isCorp=False
    )
    profSNoCorp = profitNoCorp * 10
    corpGain = profS - profSNoCorp
    
    print(f"{name:>12}: lvlInv={fmt(lvlInv)}, brInv={fmt(brInv)}, total={fmt(totalCorpInv)}")
    print(f"{'':>12}  profS(corp)={fmt(profS)}, profS(no-corp)={fmt(profSNoCorp)}, corp_gain={fmt(corpGain)}/s, totalROI={totalRoi:.1f}m")

print("\n\nDONE.")
