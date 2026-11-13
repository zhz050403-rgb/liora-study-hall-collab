"""数学 T1 W6（L16–L18）：生成函数图、组装笔记，并独立核算全部例题答案。"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from svgplot import BLUE, GOLD, GREEN, GREY, NAVY, RED, build, figure, plot  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(__file__))
e, ln = math.exp, math.log

C3 = lambda x: 160 + 10 * x
R3 = lambda x: -1.25 * (x - 20) ** 2 + 500
be3 = 16 + 8 * math.sqrt(2)
f18 = lambda x: x * (x + 2) * (x - 1)  # 讲义图：过 (−2,0)、(−1,2)、(0,0)、(1,0)
pw = lambda x: x + 5 if x < -2 else (1 - x if x <= 1 else x * x)


def two(svg1, svg2, cap):
    return f'<div class="diagram">{svg1}{svg2}<p class="cap">{cap}</p></div>'


figs = {
    "l16ex3": figure(plot([dict(f=C3, dom=(5, 40), color=GOLD, label=(33, 520, "C(x)")),
                           dict(f=R3, dom=(5, 40), color=BLUE, label=(8, 300, "R(x)"))],
                          xr=(-3, 42), yr=(-30, 580), xticks=(10, 20, 30, 40), yticks=(200, 400),
                          points=[(be3, C3(be3), True, "保本点 (27.3, 433.1)", -50, -10), (20, 500, True, "(20, 500)", -20, -8)],
                          shade=[(5, be3, GREEN)], aria="手机的成本与收入"),
                     "绿色区间 R > C，是盈利区；两线交点 x ≈ 27.3 是保本点。"),
    "l16ex4": figure(plot([dict(f=lambda x: 20 * x - 2 * x * x, dom=(0, 10), color=BLUE, label=(7.6, 38, "A(x)"))],
                          xr=(-1, 11), yr=(-5, 58), xticks=(5, 10), yticks=(50,),
                          points=[(5, 50, True, "(5, 50) 最大", 6, 4), (0, 0, False, ""), (10, 0, False, "")],
                          aria="围栏面积"),
                     "A(x) = 20x − 2x²，0 < x < 10；顶点 (5, 50)。"),
    "l16ex5": figure(plot([dict(f=lambda x: -36 * x * x + 1044 * x - 4320, dom=(0, 29), color=BLUE, label=(15, 3500, "P(x)"))],
                          xr=(-1, 30), yr=(-4800, 4200), xticks=(5, 24), shade=[(5, 24, GREEN)],
                          points=[(5, 0, True, ""), (24, 0, True, ""), (14.5, 3249, True, "(14.5, 3249)", 6, 4)],
                          aria="笔记本的利润"),
                     "利润 P(x) = −36x² + 1044x − 4320，在 5 < x < 24（千本）时为正。"),
    "l16ex6": figure(plot([dict(f=lambda x: x / 80 - 1 / 20, dom=(4, 640), color=GOLD, label=(520, 7.4, "供给")),
                           dict(f=lambda x: 1264 / x, dom=(130, 640), color=BLUE, label=(480, 2.0, "需求"))],
                          xr=(0, 660), yr=(-0.5, 10), xticks=(320,), yticks=(4,),
                          points=[(320, 3.95, True, "(320, 3.95)", 6, -6)], aria="供需平衡"),
                     "供给线与需求曲线交于 x = 320、p = 3.95。"),
    "growth": two(plot([dict(f=lambda t: e(0.35 * t), dom=(0, 6), color=BLUE, label=(4.1, 7.6, "Q₀e^(kt)"))],
                       xr=(-0.5, 6), yr=(-0.8, 9), w=230, h=190, points=[(0, 1, True, "Q₀", 6, -2)], aria="指数增长"),
                  plot([dict(f=lambda t: 8 * e(-0.6 * t), dom=(0, 6), color=RED, label=(2.2, 3.8, "Q₀e^(−kt)"))],
                       xr=(-0.5, 6), yr=(-0.8, 9), w=230, h=190, points=[(0, 8, True, "Q₀", 6, 4)], aria="指数衰减"),
                  "左：指数增长；右：指数衰减。两条曲线都从 Q₀ 出发（t = 0 时的值）。"),
    "l17ex1": figure(plot([dict(f=lambda t: 40 * (1 - e(-0.12 * t)), dom=(0, 45), color=BLUE, label=(28, 33, "N(t)"))],
                          xr=(-2, 46), yr=(-3, 46), hlines=[(40, GREY, "4 3", "N = 40")], xticks=(10, 20, 30, 40),
                          points=[(ln(4 / 3) / 0.12, 10, True, "(2.4, 10)", 6, 4)], aria="学习曲线"),
                     "N 从 0 开始增长，越来越接近 40 但到不了。"),
    "l17ex2": figure(plot([dict(f=lambda t: 84 - 25 * ln(t), dom=(1, 32), color=BLUE, label=(14, 40, "R(t)"))],
                          xr=(-1, 33), yr=(-6, 92), xticks=(10, 20, 30), yticks=(84,),
                          points=[(1, 84, True, "(1, 84)", 6, 4), (10, 84 - 25 * ln(10), True, "(10, 26.4)", 6, -4),
                                  (e(3.36), 0, True, "(28.8, 0)", -24, -8)], aria="记忆保持率"),
                     "R = 84 − 25 ln t（t ≥ 1）：先快后慢地下降，约 28.8 小时降到 0。"),
    "l18ex2": figure(plot([dict(f=f18, dom=(-2.4, 1.4), color=GREY, dash="4 3", label=(0.75, 2.6, "f(x)")),
                           dict(f=lambda x: f18(x + 1) - 2, dom=(-3.4, 0.4), color=BLUE, label=(-3.3, 0.9, "f(x + 1) − 2"))],
                          xr=(-4, 2), yr=(-4, 3.5),
                          points=[(-3, -2, True, ""), (-2, 0, True, "(−2, 0)", -16, -8), (-1, -2, True, ""), (0, -2, True, ""),
                                  (-1, 2, True, "(−1, 2) 原图", -20, -8)],
                          aria="图像平移"),
                     "虚线是原图（按讲义图上的点画的示意曲线），实线是左移 1、下移 2 之后的图像。"),
    "l18ex3": two(plot([dict(f=lambda x: abs(2 * x + 1), dom=(-3, 2.5), color=BLUE)], xr=(-3, 2.5), yr=(-1, 5), w=230, h=190,
                       points=[(-0.5, 0, True, "(−½, 0)", -14, 14), (0, 1, True, "1", 4, -2)], aria="|2x + 1|"),
                  plot([dict(f=lambda x: 3 / (x - 1) - 2, dom=(-4, 6), color=BLUE)], xr=(-4, 6), yr=(-9, 5), w=230, h=190,
                       vlines=[(1, GREY, "3 3", "x = 1")], hlines=[(-2, GREY, "3 3", "y = −2")],
                       points=[(2.5, 0, True, "(5/2, 0)", 4, -6), (0, -5, True, "(0, −5)", 4, 12)], aria="3/(x − 1) − 2"),
                  "左：y = |2x + 1|，顶点 (−½, 0)。右：y = 3/(x − 1) − 2，渐近线 x = 1、y = −2。"),
    "l18ex7": two(plot([dict(f=lambda x: 1 - e(2 * x), dom=(-3, 1.2), color=BLUE)], xr=(-3, 1.5), yr=(-4, 2), w=230, h=190,
                       hlines=[(1, GREY, "3 3", "y = 1")], points=[(0, 0, True, "(0, 0)", 6, -4)], aria="1 − e^(2x)"),
                  plot([dict(f=lambda x: abs(ln(3 - x)), dom=(-4, 2.999), color=BLUE)], xr=(-4, 3.5), yr=(-0.5, 4), w=230, h=190,
                       vlines=[(3, GREY, "3 3", "x = 3")], points=[(2, 0, True, "(2, 0)", -10, -8), (0, ln(3), True, "ln 3", 4, -4)],
                       aria="|ln(3 − x)|"),
                  "左：y = 1 − e^(2x)，渐近线 y = 1。右：y = |ln(3 − x)|，在 (2, 0) 处碰到 x 轴后翻上去。"),
    "l18ex8": figure(plot([dict(f=lambda x: x + 5, dom=(-6, -2), color=BLUE, open_hi=True),
                           dict(f=lambda x: 1 - x, dom=(-2, 1), color=BLUE),
                           dict(f=lambda x: x * x, dom=(1, 2.3), color=BLUE, open_lo=True)],
                          xr=(-6, 2.5), yr=(-2, 5.5), hlines=[(3, GOLD, "4 3", "k = 3"), (1, GREEN, "4 3", "k = 1")],
                          points=[(-2, 3, True, "(−2, 3)", -44, -6), (1, 0, True, "(1, 0)", 4, 14), (1, 1, False, "(1, 1)", 6, -4)],
                          aria="例 8 的分段函数"),
                     "x = −2 处两段接上；x = 1 处中段到 (1, 0)，右段从空心点 (1, 1) 开始。"),
    "l18ex9": figure(plot([dict(f=lambda t: 2 * (1 - e(-0.2 * t)), dom=(0, 26), color=BLUE)],
                          xr=(-1, 27), yr=(-0.2, 2.4), hlines=[(2, GREY, "4 3", "C = 2")], xticks=(5, 10, 20),
                          points=[(4, 2 * (1 - e(-0.8)), True, "(4, 1.10)", 6, 10), (ln(4) / 0.2, 1.5, True, "(6.93, 1.5)", 6, 10)],
                          aria="药物浓度"), "C(t) = 2(1 − e^(−0.2t))：从 0 上升，越来越接近 2。"),
}

n = build(os.path.join(ROOT, "math/term1/w06.src.html"), os.path.join(ROOT, "math/term1/w06.html"), figs)

checks = []


def ok(name, got, want, tol=None):
    good = all(abs(a - b) <= tol for a, b in zip(got, want)) if tol else got == want
    checks.append((name, good, got, want))


ok("L16-1", [(w, w + 6) for w in range(1, 40) if 2 * (2 * w + 6) == 64], [(13, 19)])
ok("L16-2", [x for x in range(1, 20000) if 12 * x == 55000 + 2 * x], [5500])
r = [16 - 8 * math.sqrt(2), 16 + 8 * math.sqrt(2)]
ok("L16-3 roots", [C3(x) - R3(x) for x in r], [0, 0], 1e-9)
ok("L16-3 answer", [be3, C3(be3)], [27.31, 433.1], 0.05)
ok("L16-3 profit at 5", [R3(5) - C3(5) > 0], [True])
ok("L16-4", [max(range(1, 10), key=lambda x: x * (20 - 2 * x)), 5 * (20 - 10)], [5, 50])
grid = [i / 100 for i in range(0, 4001)]
prof = [x for x in grid if x * (1190 - 36 * x) - (4320 + 146 * x) > 1e-9]
ok("L16-5", [min(prof), max(prof)], [5.01, 23.99], 1e-9)
ok("L16-6", [320 / 80 - 1 / 20, 1264 / 320], [3.95, 3.95], 1e-12)
ok("L17-1", [ln(0.75) / -0.12, 40 * (1 - e(-0.12 * 2.397))], [2.40, 10.0], 0.01)
ok("L17-2", [84 - 25 * ln(1), 84 - 25 * ln(10), e(84 / 25)], [84, 26.44, 28.79], 0.01)
ok("L17-3", [2000 * e(0), 2000 * e(0.8), 5 * ln(5)], [2000, 4451.08, 8.047], 0.01)
ok("L17-4", [round(23 * e(0.011 * 37), 1), ln(2) / 0.011], [34.6, 63.01], 0.01)
ok("L18-1", [7 / 5], [1.4])
ok("L18-2", [f18(-2), f18(-1), f18(0), f18(1)] + [f18(a + 1) - 2 for a in (-3, -2, -1, 0)], [0, 2, 0, 0, -2, 0, -2, -2])
ok("L18-3b", [3 / (2.5 - 1) - 2, 3 / (0 - 1) - 2], [0, -5], 1e-12)
sol4 = [x for x in [i / 1000 for i in range(-5000, 5001)] if 3 * x * x - 7 * x - 10 > 0]
ok("L18-4", [all(x < -1 or x > 10 / 3 for x in sol4), any(-1 < x < 10 / 3 for x in sol4)], [True, False])
fwd = lambda x: 3 / math.sqrt(x + 1) - 2
inv = lambda y: 9 / (y + 2) ** 2 - 1
ok("L18-5b", [inv(fwd(x)) for x in (-0.5, 0, 3, 8)], [-0.5, 0, 3, 8], 1e-9)
ok("L18-6", [1.205 + 1.692, 2 * 1.692, 1.205 / 2], [2.897, 3.384, 0.6025], 1e-9)
ok("L18-7", [1 - e(0), abs(ln(3 - 2)), ln(3)], [0, 0, 1.0986], 1e-4)


def count(k):
    xs = [i / 1000 for i in range(-20000, 20001)]
    n = sum(1 for a, b in zip(xs, xs[1:]) if (pw(a) - k) * (pw(b) - k) < 0 and abs(pw(a) - pw(b)) < 1)
    return n + sum(1 for x in xs if pw(x) == k)


ok("L18-8 counts", [count(k) for k in (-1, 0, 0.5, 1, 2, 3, 4)], [1, 2, 2, 2, 3, 2, 1])
ok("L18-9", [2 * (1 - e(-0.8)), ln(4) / 0.2], [1.10, 6.93], 0.01)

bad = [c for c in checks if not c[1]]
print(f"built w06.html ({n} chars); {len(checks)} checks:", "ALL OK" if not bad else bad)
raise SystemExit(1 if bad else 0)
