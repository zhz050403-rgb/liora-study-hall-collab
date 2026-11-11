"""数学 T2 W5（L13–L15 概率基础）：独立重算笔记中的全部例题答案。"""
from fractions import Fraction as F
from itertools import permutations, product
from math import comb, factorial as f, perm

checks = []


def ok(name, got, want):
    checks.append((name, got == want, got, want))


ok("L13-5", F(sum(1 for a, b in product(range(1, 7), repeat=2) if a + b >= 9), 36), F(5, 18))
ok("L13-4", F(len([n for n in range(1, 30) if int(n ** .5) ** 2 == n]), 29), F(5, 29))
word = "FOUNDATIONS"
ok("L13-3c", F(sum(c in "AEIOU" for c in word), len(word)), F(5, 11))
nums = list(permutations([1, 3, 4, 5, 6], 3))
ok("L13-7a", F(sum(p[2] % 2 == 0 for p in nums), len(nums)), F(2, 5))
ok("L13-7b", F(sum(p[0] >= 4 for p in nums), len(nums)), F(3, 5))
ok("L13-8d", F(13 + 12 - 3, 52), F(11, 26))
ok("L14-1", F(comb(7, 2), comb(12, 2)), F(7, 22))
ok("L14-2", F(comb(13, 2) * comb(13, 3), comb(52, 5)), F(143, 16660))
ok("L14-3b", F(2 * f(7), f(8)), F(1, 4))
ok("L14-3c", F(2 * f(4) ** 2, f(8)), F(1, 35))
ok("L14-4", [comb(8, 4), F(comb(5, 2) * comb(3, 2), 70), F(comb(6, 2), 70), F(comb(6, 3), 70)],
   [70, F(3, 7), F(3, 14), F(2, 7)])
ok("L14-5", F(comb(15, 3), comb(20, 3)), F(91, 228))
ok("L14-6", [perm(10, 3), F(perm(4, 3), 720), F(3 * 6 * 12, 720), comb(10, 3),
             F(comb(4, 2) * 6 + comb(4, 3), 120)], [720, F(1, 30), F(3, 10), 120, F(1, 3)])
ok("L14-7a", f(11) // (f(3) * f(3) * f(2) * f(2)), 277200)
ok("L14-7b", F(f(9) // (f(3) * f(2) * f(2)), 277200), F(3, 55))
pairs = [(i, j) for i in range(11) for j in range(i + 1, 11) if j - i - 1 >= 7]
ok("L14-7c", F(len(pairs), comb(11, 2)), F(6, 55))
ok("L15-2", F(500 // 3 + 500 // 10 - 500 // 30, 500), F(2, 5))
ok("L15-3d", F(14 + 14 - 1, 210), F(9, 70))
ok("L15-6", [F(100 // 30, 100), F(100 - (100 // 6 + 100 // 10 - 100 // 30), 100)], [F(3, 100), F(77, 100)])
ok("L15-7", 1 - F(comb(17, 4), comb(20, 4)), F(29, 57))

bad = [c for c in checks if not c[1]]
print(f"{len(checks)} checks:", "ALL OK" if not bad else bad)
raise SystemExit(1 if bad else 0)
