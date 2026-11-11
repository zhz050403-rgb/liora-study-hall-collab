"""会计 T1 W5（T 形账户）：从分录过账、结账、编试算平衡表，组装笔记并核对讲义给出的数字。"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from ledger import Ledger  # noqa: E402
from svgplot import build  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(__file__))
A, L, OE, R, E, D = "asset", "liability", "equity", "revenue", "expense", "drawings"
checks = []


def ok(name, got, want):
    checks.append((name, got == want, got, want))


def wrap(html):
    return f'<div class="ledger-set">{html}</div>'


# 例 1：课件 Feb（只过账）
g = Ledger()
for d, dr, cr, amt in [("1 Feb", ("Cash at Bank", A), ("Capital", OE), 10000),
                       ("6 Feb", ("Office Furniture", A), ("A/P – Fantastic", L), 5000),
                       ("13 Feb", ("A/R – Barry", A), ("Sales", R), 100),
                       ("22 Feb", ("Cash at Bank", A), ("A/R – Barry", A), 100),
                       ("25 Feb", ("A/P – Fantastic", L), ("Cash at Bank", A), 1000)]:
    g.journal(d, [(*dr, amt)], [(*cr, amt)])
lec1 = wrap("".join(g.taccount_html(n, "", "", balance_it=False) for n in g.acc))
ok("lec1 cash", g.balance("Cash at Bank"), 9100)


def single(name, kind, drs, crs, end, nxt):
    l = Ledger()
    a = l.account(name, kind)
    a["dr"].extend(drs)
    a["cr"].extend(crs)
    return l, wrap(l.taccount_html(name, end, nxt))


l2, lec2 = single("Cash at Bank", A, [("1 Jan", "Capital", 30000), ("2 Jan", "Loans", 10000)],
                  [("13 Jan", "Furniture", 2000), ("14 Jan", "Equipment", 6000)], "31 Jan", "1 Feb")
ok("lec2", l2.balance("Cash at Bank"), 32000)
l3, oct_ = single("Cash at Bank", A, [("Oct 1", "Capital", 40000), ("3", "Bank Loan", 7000), ("7", "Sales", 8000)],
                  [("Oct 5", "Rent Expense", 12000), ("12", "Office Equipment", 2000), ("18", "Drawings", 2000)], "31", "Nov 1")
ok("reading oct", l3.balance("Cash at Bank"), 39000)
l4, mar = single("Cash at Bank", A, [("Mar 1", "Capital", 15000), ("5", "Sales", 1000)],
                 [("Mar 4", "Salaries expense", 500), ("14", "Office Equipment", 2000), ("19", "Drawings", 60),
                  ("27", "Office Rent", 560)], "31", "Apr 1")
ok("reading mar", l4.balance("Cash at Bank"), 12880)

b = Ledger()
for d, dr, cr, amt in [("1/2", ("Cash at Bank", A), ("Capital", OE), 10000),
                       ("4/2", ("A/R – Vicky", A), ("Service Revenue", R), 2500),
                       ("8/2", ("Cash at Bank", A), ("A/R – Vicky", A), 2500),
                       ("21/2", ("Prepaid Rent", A), ("Cash at Bank", A), 3000),
                       ("28/2", ("Cash at Bank", A), ("Unearned Revenue", L), 1000)]:
    b.journal(d, [(*dr, amt)], [(*cr, amt)])
barry = wrap(b.taccount_html("Cash at Bank", "28/2", "1/3"))
ok("barry cash", b.balance("Cash at Bank"), 10500)

t = Ledger()
for d, dr, cr, amt in [("1/6", ("Cash at Bank", A), ("Capital", OE), 10000),
                       ("2/6", ("Office Furniture", A), ("Cash at Bank", A), 2000),
                       ("3/6", ("Cash at Bank", A), ("Loan", L), 30000)]:
    t.journal(d, [(*dr, amt)], [(*cr, amt)])
tq1 = wrap(t.taccount_html("Cash at Bank", "30/6", "1/7") +
           "".join(t.taccount_html(n, "", "", balance_it=False) for n in ("Office Furniture", "Loan", "Capital")))
ok("tq1 cash", t.balance("Cash at Bank"), 38000)

j = Ledger()
for d, dr, cr, amt in [("Mar 1", ("Cash at Bank", A), ("Capital", OE), 15000),
                       ("Mar 2", ("Office Furniture", A), ("A/P – Furniture Warehouse", L), 8000),
                       ("Mar 5", ("Cash at Bank", A), ("Capital", OE), 7000),
                       ("Mar 7", ("A/P – Furniture Warehouse", L), ("Cash at Bank", A), 500),
                       ("Mar 14", ("Office Equipment", A), ("Cash at Bank", A), 2000),
                       ("Mar 19", ("Drawings", D), ("Cash at Bank", A), 50),
                       ("Mar 26", ("Motor Vehicle", A), ("A/P – Daisy Car Dealer", L), 4500),
                       ("Mar 27", ("Office Furniture", A), ("Cash at Bank", A), 560)]:
    j.journal(d, [(*dr, amt)], [(*cr, amt)])
ok("jjay balances (reading p7–8)", [j.balance(n) for n in ("Cash at Bank", "Capital", "Office Furniture", "Office Equipment",
                                                          "Drawings", "Motor Vehicle")], [18890, -22000, 8560, 2000, 50, 4500])
ok("jjay A/P total (reading p8)", j.balance("A/P – Furniture Warehouse") + j.balance("A/P – Daisy Car Dealer"), -12000)
jjay = wrap(j.ledgers_html("Mar 31", "Apr 1") + j.trial_balance_html("J. Jay Trading Trial Balance as at 31 March"))

gr = Ledger()
for d, dr, cr, amt in [("May 1", ("Cash at Bank", A), ("Capital – L Grunweld", OE), 10000),
                       ("May 2", ("Motor Vehicle", A), ("A/P – BMX Auto", L), 5000),
                       ("May 3", ("A/R – Mira Ltd", A), ("Service Fees Revenue", R), 1800),
                       ("May 4", ("Cash at Bank", A), ("A/R – Mira Ltd", A), 700),
                       ("May 5", ("A/P – BMX Auto", L), ("Cash at Bank", A), 3000)]:
    gr.journal(d, [(*dr, amt)], [(*cr, amt)])
grunweld = wrap(gr.ledgers_html("May 31", "Jun 1") + gr.trial_balance_html("Trial Balance as at 31 May（补充核对）"))
ok("grunweld", [gr.balance("Cash at Bank"), gr.balance("A/R – Mira Ltd"), gr.balance("A/P – BMX Auto")], [7700, 1100, -2000])

c = Ledger()
for n, k, v in [("Cash at Bank", A, 50000), ("Accounts Receivable", A, 8000), ("Accounts Payable", L, 5000), ("Capital", OE, 53000)]:
    c.opening(n, k, v, "Jan 1")
for d, dr, cr, amt in [("Jan 1", ("Cash at Bank", A), ("Capital", OE), 50000),
                       ("Jan 2", ("Purchases", E), ("Accounts Payable", L), 5000),
                       ("Jan 5", ("Accounts Receivable", A), ("Sales", R), 1000),
                       ("Jan 15", ("Accounts Payable", L), ("Cash at Bank", A), 3000),
                       ("Jan 19", ("Cash at Bank", A), ("Accounts Receivable", A), 1000)]:
    c.journal(d, [(*dr, amt)], [(*cr, amt)])
christie = wrap(c.ledgers_html("Jan 31", "Feb 1") + c.trial_balance_html("Christie's Toys Shoppe Trial Balance as at 31 January（补充核对）"))
ok("christie", [c.balance(n) for n in ("Cash at Bank", "Accounts Receivable", "Accounts Payable", "Capital")], [98000, 8000, -7000, -103000])

bn = Ledger()
for d, dr, cr, amt in [("Jan 1", ("Cash at Bank", A), ("Capital", OE), 111900),
                       ("Jan 2", ("Rent Expense", E), ("Cash at Bank", A), 840),
                       ("Jan 3", ("Cash at Bank", A), ("Sales", R), 1380),
                       ("Jan 4", ("Purchases", E), ("A/P – Randwick Trading", L), 300),
                       ("Jan 8", ("Telephone Expense", E), ("Cash at Bank", A), 18),
                       ("Jan 9", ("A/R – Vicky", A), ("Sales", R), 680),
                       ("Jan 12", ("Cash at Bank", A), ("Sales", R), 500),
                       ("Jan 18", ("Cash at Bank", A), ("A/R – Vicky", A), 360),
                       ("Jan 27", ("A/P – Randwick Trading", L), ("Cash at Bank", A), 180),
                       ("Jan 31", ("Wages Expense", E), ("Cash at Bank", A), 2660)]:
    bn.journal(d, [(*dr, amt)], [(*cr, amt)])
ben = wrap(bn.ledgers_html("Jan 31", "Feb 1") + bn.trial_balance_html("Ben's Pharmacy Trial Balance as at 31 January 2025"))
ok("ben TB", bn.trial_balance()[1:], (114580, 114580))

ro = Ledger()
ro.journal("2 Jul", [("Cash at Bank", A, 30000)], [("Capital", OE, 30000)])
ro.journal("3 Jul", [("Delivery Van", A, 20000)], [("Cash at Bank", A, 4000), ("Accounts Payable", L, 16000)])
ro.journal("5 Jul", [("Accounts Receivable", A, 2000)], [("Sales", R, 2000)])
ro.journal("6 Jul", [("Drawings", D, 400)], [("Cash at Bank", A, 400)])
ro.journal("7 Jul", [("Cash at Bank", A, 1470), ("Discount Allowed", E, 30)], [("Accounts Receivable", A, 1500)])
ro.journal("7 Jul", [("Purchases", E, 3000)], [("Accounts Payable", L, 3000)])
ro.journal("9 Jul", [("Accounts Payable", L, 3000)], [("Cash at Bank", A, 3000)])
ro.journal("11 Jul", [("Accounts Payable", L, 3000)], [("Discount Received", R, 60), ("Cash at Bank", A, 2940)])
ro.journal("12 Jul", [("Accounts Receivable", A, 7200)], [("Sales", R, 7200)])
ro.journal("12 Jul", [("Salaries Expense", E, 1500)], [("Cash at Bank", A, 1500)])
ro.journal("13 Jul", [("Sales Returns", E, 200)], [("Accounts Receivable", A, 200)])
ro.journal("15 Jul", [("Purchases", E, 2100)], [("Accounts Payable", L, 2100)])
ro.journal("17 Jul", [("Cash at Bank", A, 6930), ("Discount Allowed", E, 70)], [("Accounts Receivable", A, 7000)])
ro.journal("18 Jul", [("Accounts Payable", L, 100)], [("Purchase Returns", R, 100)])
ro.journal("23 Jul", [("Purchases", E, 1500)], [("Cash at Bank", A, 1500)])
ro.journal("29 Jul", [("Cash at Bank", A, 4000)], [("Sales", R, 4000)])
roger = wrap(ro.ledgers_html("31 Jul", "1 Aug") + ro.trial_balance_html("Alex Roger Trial Balance as at 31 July"))
ok("roger TB", ro.trial_balance()[1:], (58360, 58360))
ok("roger cash/AR/AP", [ro.balance("Cash at Bank"), ro.balance("Accounts Receivable"), ro.balance("Accounts Payable")], [29060, 500, -15000])

th = Ledger()
th.journal("May 1", [("Cash at Bank", A, 7000)], [("Sales", R, 7000)])
th.journal("May 2", [("A/R – Acacia", A, 12400)], [("Sales", R, 12400)])
th.journal("May 3", [("Sales Returns", E, 400)], [("A/R – Acacia", A, 400)])
th.journal("May 4", [("A/R – Aloe", A, 3500)], [("Sales", R, 3500)])
th.journal("May 5", [("Cash at Bank", A, 11760), ("Discount Allowed", E, 240)], [("A/R – Acacia", A, 12000)])
th.journal("May 9", [("Sales Returns", E, 500)], [("A/R – Aloe", A, 500)])
thor = wrap(th.ledgers_html("May 31", "1 June"))
ok("thor (guide p21)", [-th.balance("Sales"), th.balance("Sales Returns"), th.balance("A/R – Acacia"), th.balance("A/R – Aloe")],
   [22900, 900, 0, 3000])

lo = Ledger()
lo.opening("Cash at Bank", A, 15000, "June 1")
lo.opening("Accounts Payable", L, 5000, "June 1")
lo.journal("June 1", [("Purchases", E, 7300)], [("Accounts Payable", L, 7300)])
lo.journal("June 2", [("Accounts Payable", L, 1200)], [("Purchase Returns", R, 1200)])
lo.journal("June 3", [("Accounts Payable", L, 300)], [("Purchase Returns", R, 300)])
lo.journal("June 4", [("Accounts Payable", L, 7000)], [("Cash at Bank", A, 6650), ("Discount Received", R, 350)])
lo.journal("June 7", [("Accounts Payable", L, 2400)], [("Cash at Bank", A, 2400)])
lois = wrap(lo.ledgers_html("June 30", "1 July"))
ok("lois", [lo.balance("Cash at Bank"), lo.balance("Accounts Payable"), (7300 - 300) * 0.05, 7300 - 300 - 350], [5950, -1400, 350, 6650])

kings_dr = [1940, 3110, 3500, 30, 104, 21800, 0, 740, 9700, 26, 250, 20, 100, 680]
kings_cr = [550, 20950, 100, 12900, 6840, 10, 650]
ok("kingsford TB (lecture p32)", (sum(kings_dr), sum(kings_cr)), (42000, 42000))

def _cycle():
    parts = []
    for i, t in enumerate(["交易", "原始凭证", "日记账", "分类账", "试算表", "报表"]):
        hot = i == 3
        fill, stroke = ("#f6e3b4", "#b08a3c") if hot else ("#eef4fb", "#9fb3cc")
        weight = ' font-weight="700"' if hot else ""
        parts.append(f'<rect x="{6 + i * 105}" y="12" width="96" height="40" rx="8" fill="{fill}" stroke="{stroke}"/>'
                     f'<text x="{54 + i * 105}" y="37" font-size="13" text-anchor="middle" fill="#173860"{weight}>{i + 1} {t}</text>')
        if i < 5:
            parts.append(f'<text x="{104 + i * 105}" y="37" font-size="13" fill="#7a8ba3">›</text>')
    return ('<div class="diagram"><svg viewBox="0 0 640 70" width="640" role="img" aria-label="会计循环六步" font-family="sans-serif">'
            + "".join(parts) + '</svg><p class="cap">会计循环六步：本周在第 4 步「分类账」，月底结账后进入第 5 步「试算平衡表」。</p></div>')


CYCLE = _cycle()
TANAT = ('<div class="diagram"><svg viewBox="0 0 520 170" width="520" role="img" aria-label="T 形账户的结构" font-family="sans-serif">'
         '<text x="260" y="22" font-size="15" font-weight="700" fill="#173860" text-anchor="middle">账户名（如 Cash at Bank）</text>'
         '<line x1="20" y1="34" x2="500" y2="34" stroke="#173860" stroke-width="2.5"/>'
         '<line x1="260" y1="34" x2="260" y2="160" stroke="#173860" stroke-width="2.5"/>'
         '<text x="140" y="56" font-size="14" fill="#16569c" font-weight="700" text-anchor="middle">借方 Debit（左）</text>'
         '<text x="380" y="56" font-size="14" fill="#b03030" font-weight="700" text-anchor="middle">贷方 Credit（右）</text>'
         '<text x="140" y="80" font-size="12" fill="#4a5d75" text-anchor="middle">Date ｜ Particulars ｜ $</text>'
         '<text x="380" y="80" font-size="12" fill="#4a5d75" text-anchor="middle">Date ｜ Particulars ｜ $</text>'
         '<text x="140" y="108" font-size="12" fill="#173860" text-anchor="middle">1 Feb ｜ Capital ｜ 10,000</text>'
         '<text x="140" y="136" font-size="11" fill="#7a8ba3" text-anchor="middle">摘要写「对方账户」Capital</text>'
         '</svg><p class="cap">T 形账户：左借右贷，每边三栏。例：业主投入现金，现金账户借方记一行，摘要栏写对方账户 Capital。</p></div>')
BAL = ('<div class="diagram"><svg viewBox="0 0 540 190" width="540" role="img" aria-label="结账四步" font-family="sans-serif">'
       '<line x1="20" y1="20" x2="520" y2="20" stroke="#173860" stroke-width="2"/><line x1="270" y1="20" x2="270" y2="182" stroke="#173860" stroke-width="2"/>'
       '<g font-size="12" fill="#173860"><text x="30" y="42">Capital 30,000</text><text x="30" y="62">Loans 10,000</text>'
       '<text x="280" y="42">Furniture 2,000</text><text x="280" y="62">Equipment 6,000</text></g>'
       '<rect x="276" y="72" width="236" height="22" fill="#f6e3b4"/><text x="280" y="88" font-size="12" fill="#8a6d1f" font-weight="700">③ 31 Jan Balance c/d 32,000（较小一边补平）</text>'
       '<line x1="30" y1="104" x2="260" y2="104" stroke="#7a8ba3"/><line x1="280" y1="104" x2="510" y2="104" stroke="#7a8ba3"/>'
       '<text x="30" y="122" font-size="12" font-weight="700" fill="#173860">② Total 40,000</text><text x="280" y="122" font-size="12" font-weight="700" fill="#173860">② Total 40,000</text>'
       '<line x1="30" y1="130" x2="260" y2="130" stroke="#7a8ba3"/><line x1="30" y1="133" x2="260" y2="133" stroke="#7a8ba3"/>'
       '<line x1="280" y1="130" x2="510" y2="130" stroke="#7a8ba3"/><line x1="280" y1="133" x2="510" y2="133" stroke="#7a8ba3"/>'
       '<rect x="26" y="142" width="236" height="22" fill="#d9e8f8"/><text x="30" y="158" font-size="12" fill="#16569c" font-weight="700">④ 1 Feb Balance b/d 32,000（对面一边）</text>'
       '<text x="140" y="182" font-size="11" fill="#7a8ba3" text-anchor="middle">① 先把两边各自加总：40,000 与 8,000</text>'
       '</svg><p class="cap">结账四步（以课件 Example 2 为例）：两边加总 → 大数写两边 Total → 小的一边写 c/d → 下月 1 日在对面写 b/d。</p></div>')

figs = {"cycle": CYCLE, "tanatomy": TANAT, "balancing": BAL, "lec_ex1": lec1, "lec_ex2": lec2, "read_oct": oct_, "read_mar": mar,
        "barry": barry, "tq1": tq1, "jjay": jjay, "grunweld": grunweld, "christie": christie, "ben": ben, "roger": roger,
        "thor": thor, "lois": lois}
n = build(os.path.join(ROOT, "accounting/term1/w05.src.html"), os.path.join(ROOT, "accounting/term1/w05.html"), figs)
bad = [x for x in checks if not x[1]]
print(f"built accounting w05.html ({n} chars); {len(checks)} checks:", "ALL OK" if not bad else bad)
raise SystemExit(1 if bad else 0)
