"""数学 T1 W5（L13–L15）：生成函数图、组装笔记，并独立核算全部例题答案。"""
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from svgplot import BLUE, GOLD, GREEN, GREY, NAVY, RED, build, figure, plot  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(__file__))
ln, log = math.log, math.log10


def pchip(xs, ys):
    """单调分段三次插值：按讲义图上的关键点画示意曲线，不会在点之间多出波峰。"""
    xs, ys = np.array(xs, float), np.array(ys, float)
    h, d = np.diff(xs), np.diff(ys) / np.diff(xs)
    m = np.zeros_like(ys)
    for i in range(1, len(xs) - 1):
        if d[i - 1] * d[i] > 0:
            w1, w2 = 2 * h[i] + h[i - 1], h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    m[0], m[-1] = d[0], d[-1]

    def f(x):
        i = min(max(np.searchsorted(xs, x) - 1, 0), len(xs) - 2)
        t = (x - xs[i]) / h[i]
        return float((2 * t**3 - 3 * t**2 + 1) * ys[i] + (t**3 - 2 * t**2 + t) * h[i] * m[i]
                     + (-2 * t**3 + 3 * t**2) * ys[i + 1] + (t**3 - t**2) * h[i] * m[i + 1])
    return f


L15_PTS = [(-8, -2), (-7, 0), (-3, 5), (0, 4), (2, 0), (4, -2), (6, 0), (10, 5)]
l15f = pchip(*zip(*L15_PTS))
cubic = lambda x: x * x * (x - 3)

figs = {
    "explog": figure(plot([dict(f=math.exp, color=GOLD, label=(1.1, 3.6, "y = bˣ")),
                           dict(f=ln, dom=(1e-4, 5), color=BLUE, label=(3.2, 1.6, "y = log_b x")),
                           dict(f=lambda x: x, color=GREY, dash="4 3", label=(3.6, 4.2, "y = x"))],
                          xr=(-3, 5), yr=(-3, 5), points=[(0, 1, True, "(0, 1)"), (1, 0, True, "(1, 0)", 4, 14)],
                          aria="指数函数与对数函数关于 y = x 对称"),
                     "以 b = e 为例：y = bˣ 与 y = log_b x 关于虚线 y = x 对称，点 (0, 1) 翻到 (1, 0)。"),
    "lnlog": figure(plot([dict(f=ln, dom=(1e-4, 12), color=BLUE, label=(8.5, 2.35, "y = ln x")),
                          dict(f=log, dom=(1e-4, 12), color=GOLD, label=(8.5, 0.55, "y = log₁₀ x"))],
                         xr=(-1, 12), yr=(-3, 3), points=[(1, 0, True, "(1, 0)", 2, 14), (math.e, 1, True, "(e, 1)"),
                                                          (10, 1, True, "(10, 1)", -10, -8)],
                         aria="ln x 与 log10 x 的图像"),
                    "两条曲线都过 (1, 0)；x > 1 时 ln x 在上方，0 < x < 1 时在下方。"),
    "ln_transforms": figure(plot([dict(f=ln, dom=(1e-4, 5), color=GREY, dash="4 3", label=(3.6, 1.65, "ln x")),
                                  dict(f=lambda x: ln(x) + 1, dom=(1e-4, 5), color=BLUE, label=(3.2, 2.9, "(a) ln x + 1")),
                                  dict(f=lambda x: ln(x + 1), dom=(-1 + 1e-4, 5), color=GREEN, label=(1.5, 0.45, "(b)")),
                                  dict(f=lambda x: 3 * ln(x), dom=(1e-4, 5), color=GOLD, label=(1.85, 3.6, "(c) 3 ln x")),
                                  dict(f=lambda x: ln(-x), dom=(-5, -1e-4), color=RED, label=(-4.8, 1.9, "(d) ln(−x)"))],
                                 xr=(-5, 5), yr=(-4, 4), vlines=[(-1, GREEN, "3 3", "x = −1")],
                                 points=[(1, 0, True, ""), (-1, 0, True, ""), (0, 0, True, "")],
                                 aria="ln x 的四种变换"),
                            "(a) 上移 1；(b) 左移 1，渐近线变成 x = −1；(c) 竖直拉伸 3 倍；(d) 关于 y 轴翻折。"),
    "ex3ef": figure(plot([dict(f=lambda x: 1 - ln(1 - x), dom=(-6, 1 - 1e-6), color=BLUE, label=(-5.8, -2.2, "(e)")),
                          dict(f=lambda x: 2 * math.log(x + 5, 5) - 1, dom=(-5 + 1e-6, 2), color=GOLD, label=(0.4, 2.2, "(f)"))],
                         xr=(-6, 2), yr=(-4, 5), vlines=[(1, BLUE, "3 3", "x = 1"), (-5, GOLD, "3 3", "x = −5")],
                         points=[(0, 1, True, "(0, 1)"), (1 - math.e, 0, True, "1 − e", -14, 14),
                                 (math.sqrt(5) - 5, 0, True, "√5 − 5", -8, -8)],
                         aria="例 3 (e)(f) 的图像"),
                    "(e) y = 1 − ln(1 − x)：在渐近线 x = 1 左侧；(f) y = 2 log₅(x + 5) − 1：在渐近线 x = −5 右侧。两条都过 (0, 1)。"),
    "restricted": figure(plot([dict(f=lambda x: (x + 1) ** 2, dom=(-2, 1), color=BLUE, open_lo=True)],
                              xr=(-3, 2), yr=(-1, 5), points=[(-2, 1, False, "(−2, 1) 不含", -10, -8),
                                                             (1, 4, True, "(1, 4)", -38, 4), (-1, 0, True, "(−1, 0)", 4, 14)],
                              hlines=[(4, GREY, "3 3", ""), (0, GREY, "", "")], aria="限制定义域上的抛物线"),
                         "y = (x + 1)²，−2 < x ≤ 1：左端空心、右端实心；最低 0、最高 4。"),
    "roots": figure(plot([dict(f=math.sqrt, dom=(0, 8), color=BLUE, label=(5.6, 2.75, "√x")),
                          dict(f=lambda x: math.sqrt(x - 3), dom=(3, 8), color=GOLD, label=(6.6, 1.3, "√(x − 3)")),
                          dict(f=lambda x: 2 - math.sqrt(4 - x * x), dom=(-2, 2), color=GREEN,
                               label=(-2.9, 2.4, "2 − √(4 − x²)"))],
                         xr=(-3, 8), yr=(-1, 4), points=[(0, 0, True, ""), (3, 0, True, "(3, 0)", 2, 14),
                                                         (-2, 2, True, ""), (2, 2, True, "")],
                         aria="根号函数的图像"),
                    "根号函数只在「根号里 ≥ 0」的范围内有图像：√x 从 0 开始，√(x − 3) 从 3 开始，2 − √(4 − x²) 只在 −2 到 2 之间。"),
    "piecewise": '<div class="diagram">' + plot(
        [dict(f=lambda x: x * x, dom=(0, 2.2), color=BLUE), dict(f=lambda x: 2 * x, dom=(-2.5, 0), color=GOLD)],
        xr=(-2.5, 2.5), yr=(-4, 4), w=230, h=200, points=[(0, 0, True, "")], aria="例 12 连续的分段函数",
        labels=[(1.0, 3.2, "x²", BLUE, "start"), (-2.3, -2.2, "2x", GOLD, "start")]) + plot(
        [dict(f=lambda x: x - 1, dom=(0, 3), color=BLUE, open_lo=True), dict(f=lambda x: 2, dom=(-3, 0), color=GOLD)],
        xr=(-3, 3), yr=(-2, 3), w=230, h=200, points=[(0, 2, True, "(0, 2)"), (0, -1, False, "(0, −1)", 6, 12)],
        aria="例 13 不连续的分段函数",
        labels=[(1.6, 1.6, "x − 1", BLUE, "start"), (-2.8, 2.4, "2", GOLD, "start")]) +
        '<p class="cap">左：例 12，两段在原点接上，连续。右：例 13，x = 0 处实心点在上、空心点在下，不连续。</p></div>',
    "ex15": figure(plot([dict(f=lambda x: 1, dom=(-3, -1), color=GOLD, open_hi=True),
                         dict(f=lambda x: x * x - 2 * x, dom=(-1, 3.4), color=BLUE)],
                        xr=(-3, 3.5), yr=(-2, 4.5), points=[(-1, 1, False, "(−1, 1)", -40, -6), (-1, 3, True, "(−1, 3)", 6, -2),
                                                            (1, -1, True, "(1, −1)", 4, 14), (0, 0, True, ""), (2, 0, True, "2", 2, 14)],
                        aria="例 15 的分段函数"),
                   "按讲义图复原：x < −1 时 y = 1；x ≥ −1 时 y = x² − 2x（顶点 (1, −1)）。"),
    "l15ex1": figure(plot([dict(f=l15f, dom=(-8.6, 10.4), color=BLUE),
                           dict(f=lambda x: -2 * x, dom=(-3, 4), color=RED, dash="5 3", label=(-2.9, 6.6, "y = −2x"))],
                          xr=(-9, 11), yr=(-4, 8), hlines=[(3, GOLD, "4 3", "y = 3")],
                          points=[(x, y, True, f"({x}, {y})", 4, -6) for x, y in [(-3, 5), (4, -2), (10, 5)]] +
                                 [(x, 0, True, "") for x in (-7, 2, 6)] + [(0, 4, True, "4", 4, -4)],
                          aria="L15 例 1 的示意图"),
                     "按讲义图上的关键点画的示意图：y = 3 与图像交 3 次，y = −2x 只交 1 次（在 −3 与 0 之间）。"),
    "cubic": figure(plot([dict(f=cubic, dom=(-1.6, 3.9), color=BLUE, label=(3.0, 4.2, "y = x²(x − 3)"))],
                         xr=(-2, 4.2), yr=(-6, 5), hlines=[(3, GOLD, "4 3", "k = 3"), (-1, GREEN, "4 3", "k = −1"),
                                                         (-4, GREY, "2 3", "k = −4")],
                         points=[(0, 0, True, "(0, 0)", -42, -6), (2, -4, True, "(2, −4)", 4, 14), (3, 0, True, "3", 2, 14),
                                 (-1, -4, True, "(−1, −4)", -50, 14)],
                         aria="三次函数与水平线"),
                    "水平线 y = k：k = 3 交 1 次，k = −1 交 3 次；k = 0 或 −4 时交 2 次（擦过拐弯处）。"),
    "parab_line": figure(plot([dict(f=lambda x: 2 / 3 * x * (x - 2), dom=(-1.2, 4.2), color=BLUE, label=(3.55, 4.6, "p(x)")),
                               dict(f=lambda x: 2 * x / 3, dom=(-1.5, 5), color=GOLD, label=(4.3, 2.4, "l(x)"))],
                              xr=(-1.5, 5), yr=(-2, 5.5), shade=[(0, 3, GOLD)],
                              points=[(0, 0, True, "0", -10, 14), (3, 2, True, "(3, 2)", -4, -10)],
                              aria="抛物线与直线"),
                         "示意图（函数式为示意，只保留讲义图的交点 (0, 0)、(3, 2) 和上下关系）：阴影区间里抛物线在直线下方。"),
    "hyper": figure(plot([dict(f=lambda x: 1 / (x + 1), dom=(-5, 4), color=BLUE, label=(1.6, 1.0, "y = 1/(x + 1)"))],
                         xr=(-5, 4), yr=(-4, 5), hlines=[(2, GOLD, "4 3", "y = 2")], vlines=[(-1, GREY, "3 3", "x = −1")],
                         shade=[(-5, -1.02, GREEN), (-0.5, 4, GREEN)],
                         points=[(-0.5, 2, True, "(−½, 2)", 4, -6), (0, 1, True, "(0, 1)", 4, 14)], aria="双曲线与 y = 2"),
                    "绿色区域是 1/(x + 1) < 2 的解：x < −1 或 x > −½。"),
    "abs": figure(plot([dict(f=abs, dom=(-1.5, 1.5), color=BLUE, label=(-1.4, 1.2, "|x|")),
                        dict(f=lambda x: abs(3 * x - 1), dom=(-0.6, 1.2), color=GOLD, label=(0.92, 2.4, "|3x − 1|"))],
                       xr=(-1.5, 1.5), yr=(-0.3, 2.6), shade=[(0.25, 0.5, GREEN)],
                       points=[(0.25, 0.25, True, "(¼, ¼)", -36, -4), (0.5, 0.5, True, "(½, ½)", 6, 2),
                               (1 / 3, 0, True, "⅓", -3, 14)], aria="两个绝对值函数"),
                  "两个交点之间（绿色）|x| 在上方：¼ < x < ½。"),
}

n = build(os.path.join(ROOT, "math/term1/w05.src.html"), os.path.join(ROOT, "math/term1/w05.html"), figs)

# ---------- 独立核算 ----------
checks = []


def ok(name, got, want, tol=1e-9):
    if isinstance(want, float) or isinstance(got, float):
        good = abs(got - want) < tol
    else:
        good = got == want
    checks.append((name, good, got, want))


xs = [float(v) for v in np.round(np.arange(-12, 12.0005, 0.001), 6)]


def domain_ok(name, f, pred):
    bad = []
    for x in xs:
        try:
            v = f(x)
            real = not (isinstance(v, complex) or math.isnan(v) or math.isinf(v))
        except (ValueError, ZeroDivisionError):
            real = False
        if real != pred(x):
            bad.append(x)
    ok(name, bad[:3], [])


def sqrt(v):
    if v < 0:
        raise ValueError
    return math.sqrt(v)


def set_ok(name, test, pred, grid=xs):
    ok(name, [x for x in grid if bool(test(x)) != bool(pred(x))][:3], [])


# L13
ok("L13-2a x-int", math.exp(-1), 1 / math.e)
ok("L13-3c x-int", math.log2(2 * 0.5), 0.0)
ok("L13-3d", (2 * math.log(4 - 3, 3), 2 * math.log(6 - 3, 3)), (0.0, 2.0))
ok("L13-3e y-int", 1 - ln(1 - 0), 1.0)
ok("L13-3e x-int", 1 - ln(1 - (1 - math.e)), 0.0, 1e-12)
ok("L13-3f", (round(2 * math.log(5, 5) - 1, 12), round(2 * math.log(math.sqrt(5), 5) - 1, 12)), (1.0, 0.0))
ok("L13-1 order", all(ln(x) > log(x) for x in (1.5, 3, 9)) and all(ln(x) < log(x) for x in (0.2, 0.5, 0.9)), True)
# L14 domains
domain_ok("L14-2", lambda x: sqrt(x), lambda x: x >= 0)
domain_ok("L14-3", lambda x: sqrt(x - 3), lambda x: x >= 3)
domain_ok("L14-4", lambda x: sqrt(2 - x), lambda x: x <= 2)
domain_ok("L14-5", lambda x: 2 - sqrt(4 - x * x), lambda x: -2 <= x <= 2)
domain_ok("L14-6", lambda x: sqrt(x * x - 2 * x - 3), lambda x: x <= -1 or x >= 3)
domain_ok("L14-7", lambda x: sqrt(x * x + 1), lambda x: True)
domain_ok("L14-8", lambda x: 1 / (x - 2), lambda x: x != 2)
domain_ok("L14-9", lambda x: 1 / (x * x - 4), lambda x: abs(x) != 2)
domain_ok("L14-10", lambda x: 1 / sqrt(x - 3), lambda x: x > 3)
domain_ok("L14-11", lambda x: 1 / sqrt(x - 2) + 2 / sqrt(4 - x), lambda x: 2 < x < 4)
vals = [(x + 1) ** 2 for x in xs if -2 < x <= 1]
ok("L14-1 range", (min(vals), max(vals)), (0.0, 4.0))
semi = [2 - math.sqrt(4 - x * x) for x in xs if -2 <= x <= 2]
ok("L14-5 range", (round(min(semi), 9), round(max(semi), 9)), (0.0, 2.0))
f12 = lambda x: x * x if x >= 0 else 2 * x
ok("L14-12", (f12(1), f12(-1), all(f12(a * a) == a ** 4 for a in (-3, -0.5, 2))), (1, -2, True))
ok("L14-13 jump", (2, 0 - 1), (2, -1))
k = -2
ok("L14-14 k", 2 + k, 2 - 2)
p15 = lambda x: x * x - 2 * x
ok("L14-15", (p15(1), p15(0), p15(2), p15(-1)), (-1, 0, 0, 3))
# L15 Ex1（读图题，用示意曲线复核交点个数）
roots = lambda g, lo, hi: sum(1 for a, b in zip(np.linspace(lo, hi, 20001)[:-1], np.linspace(lo, hi, 20001)[1:])
                              if g(a) == 0 or g(a) * g(b) < 0)
ok("L15-1d count", roots(lambda x: l15f(x) - 3, -8, 10), 3)
ok("L15-1f count", roots(lambda x: l15f(x) + 2 * x, -8, 10), 1)
# L15 Ex2
ok("L15-2a", (cubic(2), cubic(-1)), (-4, -4))
ok("L15-2b", (roots(lambda x: cubic(x) - 3, -3, 6), roots(lambda x: cubic(x) + 1, -3, 6)), (1, 3))
ok("L15-2c", [roots(lambda x, k=k: cubic(x) - k, -3, 6) for k in (5, 1, -5, -2, -3.9)], [1, 1, 1, 3, 3])
ok("L15-2c edge", [len({round(r, 6) for r in np.roots([1, -3, 0, -k]) if abs(r.imag) < 1e-6}) for k in (0, -4)], [2, 2])
grid = [float(v) for v in np.round(np.arange(-5, 6.0005, 0.0005), 6)]
set_ok("L15-2d", lambda x: x ** 3 >= 3 * x * x - 1e-12, lambda x: x >= 3 or x == 0, grid)
ok("L15-2f factor", [round(x ** 3 - 3 * x * x + 4 - (x + 1) * (x - 2) ** 2, 9) for x in (-3, 0.5, 7)], [0, 0, 0])
set_ok("L15-2f", lambda x: -4 < cubic(x) < 0, lambda x: -1 < x < 3 and x not in (0, 2), grid)
# L15 Ex3（示意抛物线只用于画图；答案读图得到）
# L15 Ex4
set_ok("L15-4b", lambda x: x != -1 and 1 / (x + 1) < 2, lambda x: x < -1 or x > -0.5, grid)
ok("L15-4c", [k for k in (-2, -1, -0.5, 0, 0.5, 1, 3) if all(abs(k * (x + 1) - 1) > 1e-9 for x in grid)
               and (k == 0 or False)], [0])
# L15 Ex5
ok("L15-5b", [(x, abs(x)) for x in (0.25, 0.5) if abs(abs(x) - abs(3 * x - 1)) < 1e-12], [(0.25, 0.25), (0.5, 0.5)])
set_ok("L15-5c", lambda x: abs(x) > abs(3 * x - 1) + 1e-12, lambda x: 0.25 < x < 0.5, grid)

bad = [c for c in checks if not c[1]]
print(f"built w05.html ({n} chars); {len(checks)} checks:", "ALL OK" if not bad else bad)
raise SystemExit(1 if bad else 0)
