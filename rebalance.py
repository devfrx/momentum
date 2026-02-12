"""
Universal Rebalancing Script v2 — Fully Idempotent

Computes multiplier values from (row, target) progression curves.
Can be run on ANY state of the files (original, single-pass, double-pass)
and will always produce the same correct output.

Design targets (everything maxed — all 5 skill trees + full prestige):
  allIncome:           x5-8
  businessRevenue:     x3-5
  customerAttraction:  x3-4
  jobEfficiency:       x3-5
  costReduction:       x0.45-0.55
  stockReturn:         x3-5
  cryptoReturn:        x3-4
  realEstateRent:      x3-4
  gamblingLuck:        x6-10
  offlineEfficiency:   x3-4
  xpGain:              x3-5
  prestigeGain:        x4-6
  loanRate:            x0.70-0.85
  depositRate:         x1.5-2.5
"""
import re
import os

BASE = r'c:\Users\zagor\Desktop\--\business-tycoon\src\renderer\src'

# ═════════════════════════════════════════════════════════════════
# PROGRESSION CURVES
# (base_at_row_0, top_at_row_17) — linear interpolation
# with convergence bonus (x1.5) at rows 8/12/16
# and capstone bonus (x2.0) at row 17.
# ═════════════════════════════════════════════════════════════════
CURVES = {
    'allIncome':          (0.01,  0.03),   # ~71 nodes -> product ~x5
    'businessRevenue':    (0.02,  0.06),   # ~25 nodes -> product ~x3
    'customerAttraction': (0.03,  0.08),   # ~18 nodes -> product ~x3
    'jobEfficiency':      (0.05,  0.14),   # ~10 nodes -> product ~x3
    'costReduction':      (0.02,  0.06),   # ~15 nodes (negative)
    'stockReturn':        (0.03,  0.08),   # ~20 nodes -> product ~x3
    'cryptoReturn':       (0.03,  0.09),   # ~15 nodes -> product ~x3
    'realEstateRent':     (0.03,  0.09),   # ~15 nodes -> product ~x3
    'gamblingLuck':       (0.02,  0.06),   # ~42 nodes -> product ~x6
    'offlineEfficiency':  (0.03,  0.09),   # ~15 nodes -> product ~x3
    'xpGain':             (0.03,  0.08),   # ~20 nodes -> product ~x3
    'prestigeGain':       (0.02,  0.06),   # ~30 nodes -> product ~x4
    'loanRate':           (0.02,  0.06),   # ~5 nodes (negative)
    'depositRate':        (0.05,  0.12),   # ~5 nodes -> product ~x1.5
}

NEGATIVE_TARGETS = {'costReduction', 'loanRate'}
MAX_ROW = 17


def compute_mult(row, target):
    if target not in CURVES:
        return None
    base, top = CURVES[target]
    t = min(row / MAX_ROW, 1.0)
    m = base + (top - base) * t
    if row in (8, 12, 16):
        m *= 1.5
    elif row == 17:
        m *= 2.0
    m = round(m, 2)
    m = max(0.01, m)
    if target in NEGATIVE_TARGETS:
        m = -m
    return m


def fmt_pct(v):
    p = round(abs(v) * 100, 1)
    if p == int(p):
        return str(int(p))
    return f"{p:.1f}"


# ═════════════════════════════════════════════════════════════════
# 1. SKILL TREES
# ═════════════════════════════════════════════════════════════════

def process_skill_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    changes = 0
    for i in range(len(lines)):
        tm = re.search(r"target:\s*'(\w+)'.*?multiplier:\s*(-?\d+\.?\d*)", lines[i])
        if not tm:
            continue

        target = tm.group(1)
        old_mult = float(tm.group(2))

        row = None
        for j in range(i - 1, max(i - 8, -1), -1):
            rm = re.search(r'\brow:\s*(\d+)', lines[j])
            if rm:
                row = int(rm.group(1))
                break
        if row is None:
            continue

        new_mult = compute_mult(row, target)
        if new_mult is None:
            continue

        if abs(new_mult - old_mult) < 0.001:
            continue

        lines[i] = re.sub(
            r'(multiplier:\s*)-?\d+\.?\d*',
            r'\g<1>' + f"{new_mult:.2f}",
            lines[i], count=1
        )

        sign = '+' if new_mult >= 0 else '-'
        ps = fmt_pct(new_mult)
        for j in range(i - 1, max(i - 5, -1), -1):
            if 'effectDescription' in lines[j]:
                lines[j] = re.sub(
                    r"(effectDescription:\s*')[+-]\d+(?:\.\d+)?(%)",
                    rf"\g<1>{sign}{ps}\2",
                    lines[j], count=1
                )
                break

        changes += 1

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    return changes


print("=== Skill Trees ===")
skill_dir = os.path.join(BASE, 'data', 'skills')
total = 0
for fn in sorted(os.listdir(skill_dir)):
    if not fn.endswith('.ts'):
        continue
    n = process_skill_file(os.path.join(skill_dir, fn))
    print(f"  {fn}: {n} nodes")
    total += n
print(f"  TOTAL: {total} nodes\n")


# ═════════════════════════════════════════════════════════════════
# 2. PRESTIGE ERAS
# ═════════════════════════════════════════════════════════════════

print("=== Eras ===")
ERA_BONUSES = {
    'era_humble': 0,
    'era_rising': 0.03,
    'era_established': 0.06,
    'era_titan': 0.10,
    'era_legend': 0.15,
    'era_eternal': 0.25,
}

fp = os.path.join(BASE, 'data', 'prestige', 'eras.ts')
with open(fp, 'r', encoding='utf-8') as f:
    lines = f.readlines()

cur_era = None
for i in range(len(lines)):
    m = re.search(r"id:\s*'(era_\w+)'", lines[i])
    if m and m.group(1) in ERA_BONUSES:
        cur_era = m.group(1)
    if cur_era and 'globalBonus:' in lines[i]:
        lines[i] = re.sub(
            r'(globalBonus:\s*)\d+\.?\d*',
            rf'\g<1>{ERA_BONUSES[cur_era]}',
            lines[i]
        )
        print(f"  {cur_era} -> {ERA_BONUSES[cur_era]}")
        cur_era = None

with open(fp, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print()


# ═════════════════════════════════════════════════════════════════
# 3. PRESTIGE UPGRADES
# ═════════════════════════════════════════════════════════════════

print("=== Prestige Upgrades ===")
UPG_VALUES = {
    'pup_global_1':         0.03,
    'pup_global_2':         0.05,
    'pup_business_boost':   0.02,
    'pup_investment_boost': 0.02,
    'pup_realestate_boost': 0.02,
    'pup_prestige_gain':    0.03,
    'pup_xp_boost':         0.02,
    'pup_job_efficiency':   0.06,
    'pup_offline':          0.03,
    'pup_cost_reduction':   0.01,
    'pup_loan_discount':    0.005,
}

fp = os.path.join(BASE, 'data', 'prestige', 'upgrades.ts')
with open(fp, 'r', encoding='utf-8') as f:
    lines = f.readlines()

cur = None
for i in range(len(lines)):
    m = re.search(r"id:\s*'(\w+)'", lines[i])
    if m:
        cur = m.group(1)
    if cur in UPG_VALUES and 'effectValue:' in lines[i]:
        lines[i] = re.sub(
            r'(effectValue:\s*)\d+\.?\d*',
            rf'\g<1>{UPG_VALUES[cur]}',
            lines[i], count=1
        )
        print(f"  {cur} -> {UPG_VALUES[cur]}")
        cur = None

with open(fp, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print()


# ═════════════════════════════════════════════════════════════════
# 4. PRESTIGE PERKS
# ═════════════════════════════════════════════════════════════════

print("=== Prestige Perks ===")
PERK_VALUES = {
    'perk_instant_jobs':      0.10,
    'perk_offline_boost':     0.05,
    'perk_market_insight':    0.03,
    'perk_tax_haven':         0.005,
    'perk_business_sense':    0.04,
    'perk_real_estate_mogul': 0.04,
    'perk_golden_touch':      0.08,
    'perk_time_warp':         0.08,
    'perk_prestige_master':   0.08,
    'perk_reality_warp':      0.12,
}

PERK_DESC_FIXES = {
    'perk_instant_jobs':      ('at 50% efficiency', 'at 10% efficiency'),
    'perk_offline_boost':     ('efficiency by 25%', 'efficiency by 5%'),
    'perk_market_insight':    ('gain 15% better',   'gain 3% better'),
    'perk_tax_haven':         ('rates by 3%',       'rates by 0.5%'),
    'perk_business_sense':    ('generate 20% more', 'generate 4% more'),
    'perk_real_estate_mogul': ('generate 20% more', 'generate 4% more'),
    'perk_golden_touch':      ('+50% to all',       '+8% to all'),
    'perk_time_warp':         ('at 100% efficiency', 'with boosted efficiency'),
    'perk_prestige_master':   ('50% more prestige', '8% more prestige'),
    'perk_reality_warp':      ('+100% to all',      '+12% to all'),
}

fp = os.path.join(BASE, 'data', 'prestige', 'perks.ts')
with open(fp, 'r', encoding='utf-8') as f:
    lines = f.readlines()

cur = None
for i in range(len(lines)):
    m = re.search(r"id:\s*'(\w+)'", lines[i])
    if m:
        cur = m.group(1)
    if cur in PERK_VALUES and 'effect:' in lines[i] and 'value:' in lines[i]:
        lines[i] = re.sub(
            r'(value:\s*)\d+\.?\d*',
            rf'\g<1>{PERK_VALUES[cur]}',
            lines[i], count=1
        )
        print(f"  {cur} -> {PERK_VALUES[cur]}")
        cur = None

cur = None
for i in range(len(lines)):
    m = re.search(r"id:\s*'(\w+)'", lines[i])
    if m:
        cur = m.group(1)
    if cur in PERK_DESC_FIXES and 'description:' in lines[i]:
        old_d, new_d = PERK_DESC_FIXES[cur]
        if old_d in lines[i]:
            lines[i] = lines[i].replace(old_d, new_d, 1)

with open(fp, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print()


# ═════════════════════════════════════════════════════════════════
# 5. MILESTONES — exact target values
# ═════════════════════════════════════════════════════════════════

print("=== Milestones ===")
MILESTONE_REWARDS = {
    ('ms_points_10',   'global_multiplier'): 0.008,
    ('ms_points_50',   'prestige_gain'):     0.015,
    ('ms_points_100',  'global_multiplier'): 0.015,
    ('ms_points_500',  'prestige_gain'):     0.025,
    ('ms_points_500',  'xp_gain'):           0.015,
    ('ms_points_1000', 'global_multiplier'): 0.03,
    ('ms_points_5000', 'global_multiplier'): 0.05,
    ('ms_points_5000', 'prestige_gain'):     0.04,
    ('ms_points_10000','global_multiplier'): 0.08,
    ('ms_points_10000','offline_bonus'):     0.03,
    ('ms_rebirth_1',   'prestige_gain'):     0.008,
    ('ms_rebirth_5',   'job_efficiency'):    0.015,
    ('ms_rebirth_10',  'prestige_gain'):     0.025,
    ('ms_rebirth_10',  'global_multiplier'): 0.015,
    ('ms_rebirth_25',  'global_multiplier'): 0.03,
    ('ms_rebirth_25',  'loan_discount'):     0.003,
    ('ms_rebirth_50',  'global_multiplier'): 0.05,
    ('ms_rebirth_50',  'prestige_gain'):     0.04,
    ('ms_rebirth_50',  'offline_bonus'):     0.025,
    ('ms_rebirth_100', 'global_multiplier'): 0.08,
    ('ms_rebirth_100', 'prestige_gain'):     0.06,
    ('ms_upgrades_5',  'prestige_gain'):     0.008,
    ('ms_upgrades_25', 'global_multiplier'): 0.015,
    ('ms_upgrades_25', 'cost_reduction'):    0.008,
    ('ms_upgrades_50', 'prestige_gain'):     0.03,
    ('ms_upgrades_50', 'xp_gain'):           0.02,
}

fp = os.path.join(BASE, 'data', 'prestige', 'milestones.ts')
with open(fp, 'r', encoding='utf-8') as f:
    lines = f.readlines()

cur_ms = None
mc = 0
for i in range(len(lines)):
    m = re.search(r"id:\s*'(ms_\w+)'", lines[i])
    if m:
        cur_ms = m.group(1)
    if not cur_ms:
        continue
    rm = re.search(r"\{\s*type:\s*'(\w+)',\s*value:\s*(\d+\.?\d*)", lines[i])
    if not rm:
        continue
    rtype = rm.group(1)
    key = (cur_ms, rtype)
    if key not in MILESTONE_REWARDS:
        continue
    nv = MILESTONE_REWARDS[key]
    ns = f"{nv:.4f}".rstrip('0')
    if ns.endswith('.'):
        ns += '0'
    lines[i] = re.sub(
        rf"(type:\s*'{rtype}',\s*value:\s*)\d+\.?\d*",
        rf"\g<1>{ns}",
        lines[i], count=1
    )
    mc += 1

with open(fp, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print(f"  {mc} reward values updated\n")


# ═════════════════════════════════════════════════════════════════
# 6. useMultipliers.ts — prestige points coefficient
# ═════════════════════════════════════════════════════════════════

print("=== useMultipliers.ts ===")
fp = os.path.join(BASE, 'composables', 'useMultipliers.ts')
with open(fp, 'r', encoding='utf-8') as f:
    c = f.read()

old_coeff = re.search(r"mul\(prestige\.points,\s*(\d+\.?\d*)\)", c)
if old_coeff:
    print(f"  prestige.points coefficient: {old_coeff.group(1)} -> 0.0003")
c = re.sub(
    r"mul\(prestige\.points,\s*\d+\.?\d*\)",
    "mul(prestige.points, 0.0003)",
    c
)
with open(fp, 'w', encoding='utf-8') as f:
    f.write(c)
print()


# ═════════════════════════════════════════════════════════════════
# VERIFICATION — count nodes per target across all skill files
# ═════════════════════════════════════════════════════════════════

print("=== Verification: Node counts per target ===")
import math

counts = {}
products = {}

for fn in sorted(os.listdir(skill_dir)):
    if not fn.endswith('.ts'):
        continue
    fp = os.path.join(skill_dir, fn)
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()
    for m in re.finditer(r"target:\s*'(\w+)'.*?multiplier:\s*(-?\d+\.?\d*)", content):
        t = m.group(1)
        v = float(m.group(2))
        counts[t] = counts.get(t, 0) + 1
        if t in NEGATIVE_TARGETS:
            products[t] = products.get(t, 1.0) * (1 + v)
        else:
            products[t] = products.get(t, 1.0) * (1 + v)

for t in sorted(counts.keys()):
    print(f"  {t:25s}: {counts[t]:3d} nodes, product = x{products[t]:.2f}")

print()
print("=" * 60)
print("REBALANCING COMPLETE")
print("=" * 60)
