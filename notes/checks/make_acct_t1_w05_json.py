"""生成会计 T1 W5 的结构化笔记（pipeline JSON）。分录照抄原文，账页、分析表、分录表、试算表全部交给渲染器生成。"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
A, L, OE, R, E, D, CR, CE = "asset", "liability", "equity", "revenue", "expense", "drawings", "contra-revenue", "contra-expense"
LEC = "unit6 lecture slides t-format.pdf"
READ = "unit6 reading materials ledger accounts t-format.pdf"
TG = "unit6 tutorial guide t-format.pdf"
PRAC = "unit5b practice balancing an account (t-account).pdf"


def j(date, dr, cr, narration=None):
    e = {"date": date, "dr": [list(x) for x in dr], "cr": [list(x) for x in cr]}
    if narration:
        e["narration"] = narration
    return e


def simple(rows):
    return [j(d, [(a, ka, v)], [(b, kb, v)]) for d, (a, ka), (b, kb), v in rows]


def ledger(journal, views, end, nxt, balance=True, show=None, tb=None, expect=None, openings=None, caption=None):
    f = {"type": "ledger", "views": views, "journal": journal, "endDate": end, "nextDate": nxt, "balance": balance}
    for k, v in (("show", show), ("trialBalance", tb), ("expect", expect), ("openings", openings), ("caption", caption)):
        if v is not None:
            f[k] = v
    return f


def single(name, kind, drs, crs, end, nxt, expect):
    """只给出一个账户两边金额的结账题：用一个对方账户补成分录，只显示这个账户。"""
    rows = [j(d, [(name, kind, v)], [(p, "equity", v)]) for d, p, v in drs] + [j(d, [(p, "expense", v)], [(name, kind, v)]) for d, p, v in crs]
    return ledger(rows, ["taccounts"], end, nxt, show=[name], expect={name: expect})


lec1 = simple([("1 Feb", ("Cash at Bank", A), ("Capital", OE), 10000), ("6 Feb", ("Office Furniture", A), ("A/P – Fantastic", L), 5000),
               ("13 Feb", ("A/R – Barry", A), ("Sales", R), 100), ("22 Feb", ("Cash at Bank", A), ("A/R – Barry", A), 100),
               ("25 Feb", ("A/P – Fantastic", L), ("Cash at Bank", A), 1000)])
tq1 = simple([("1/6", ("Cash at Bank", A), ("Capital", OE), 10000), ("2/6", ("Office Furniture", A), ("Cash at Bank", A), 2000),
              ("3/6", ("Cash at Bank", A), ("Loan", L), 30000)])
barry = simple([("1/2", ("Cash at Bank", A), ("Capital", OE), 10000), ("4/2", ("A/R – Vicky", A), ("Service Revenue", R), 2500),
                ("8/2", ("Cash at Bank", A), ("A/R – Vicky", A), 2500), ("21/2", ("Prepaid Rent", A), ("Cash at Bank", A), 3000),
                ("28/2", ("Cash at Bank", A), ("Unearned Revenue", L), 1000)])
jjay = simple([("Mar 1", ("Cash at Bank", A), ("Capital", OE), 15000), ("Mar 2", ("Office Furniture", A), ("A/P – Furniture Warehouse", L), 8000),
               ("Mar 5", ("Cash at Bank", A), ("Capital", OE), 7000), ("Mar 7", ("A/P – Furniture Warehouse", L), ("Cash at Bank", A), 500),
               ("Mar 14", ("Office Equipment", A), ("Cash at Bank", A), 2000), ("Mar 19", ("Drawings", D), ("Cash at Bank", A), 50),
               ("Mar 26", ("Motor Vehicle", A), ("A/P – Daisy Car Dealer", L), 4500), ("Mar 27", ("Office Furniture", A), ("Cash at Bank", A), 560)])
grun = simple([("May 1", ("Cash at Bank", A), ("Capital – L Grunweld", OE), 10000), ("May 2", ("Motor Vehicle", A), ("Accounts Payable", L), 5000),
               ("May 3", ("Accounts Receivable", A), ("Service Fees Revenue", R), 1800), ("May 4", ("Cash at Bank", A), ("Accounts Receivable", A), 700),
               ("May 5", ("Accounts Payable", L), ("Cash at Bank", A), 3000)])
chr_open = [{"account": "Cash at Bank", "kind": A, "amount": 50000, "date": "Jan 1"}, {"account": "Accounts Receivable", "kind": A, "amount": 8000, "date": "Jan 1"},
            {"account": "Accounts Payable", "kind": L, "amount": 5000, "date": "Jan 1"}, {"account": "Capital", "kind": OE, "amount": 53000, "date": "Jan 1"}]
christie = [j("Jan 1", [("Cash at Bank", A, 50000)], [("Capital", OE, 50000)], "Christie invested additional cash"),
            j("Jan 2", [("Purchases", E, 5000)], [("Accounts Payable", L, 5000)], "Purchased toys from Mira Ltd on credit"),
            j("Jan 5", [("Accounts Receivable", A, 1000)], [("Sales", R, 1000)], "Sold teddy bears to Mr Blacksend on credit"),
            j("Jan 15", [("Accounts Payable", L, 3000)], [("Cash at Bank", A, 3000)], "Partial payment to Mira Ltd"),
            j("Jan 19", [("Cash at Bank", A, 1000)], [("Accounts Receivable", A, 1000)], "Mr Blacksend paid in full")]
ben = [j("Jan 1", [("Cash at Bank", A, 111900)], [("Capital", OE, 111900)], "Ben invested cash"),
       j("Jan 2", [("Rent Expense", E, 840)], [("Cash at Bank", A, 840)], "Paid rent by cheque"),
       j("Jan 3", [("Cash at Bank", A, 1380)], [("Sales", R, 1380)], "Cash sales"),
       j("Jan 4", [("Purchases", E, 300)], [("Accounts Payable", L, 300)], "Goods on credit from Randwick Trading"),
       j("Jan 8", [("Telephone Expense", E, 18)], [("Cash at Bank", A, 18)], "Telephone set-up fee"),
       j("Jan 9", [("Accounts Receivable", A, 680)], [("Sales", R, 680)], "Sold goods on credit to Vicky"),
       j("Jan 12", [("Cash at Bank", A, 500)], [("Sales", R, 500)], "Cash received from Grace for goods"),
       j("Jan 18", [("Cash at Bank", A, 360)], [("Accounts Receivable", A, 360)], "Vicky's partial payment"),
       j("Jan 27", [("Accounts Payable", L, 180)], [("Cash at Bank", A, 180)], "Partial payment to Randwick Trading"),
       j("Jan 31", [("Wages Expense", E, 2660)], [("Cash at Bank", A, 2660)], "Paid wages")]
roger = [j("2 Jul", [("Cash at Bank", A, 30000)], [("Capital", OE, 30000)]),
         j("3 Jul", [("Delivery Van", A, 20000)], [("Cash at Bank", A, 4000), ("Accounts Payable", L, 16000)]),
         j("5 Jul", [("Accounts Receivable", A, 2000)], [("Sales", R, 2000)]),
         j("6 Jul", [("Drawings", D, 400)], [("Cash at Bank", A, 400)]),
         j("7 Jul", [("Cash at Bank", A, 1470), ("Discount Allowed", E, 30)], [("Accounts Receivable", A, 1500)]),
         j("7 Jul", [("Purchases", E, 3000)], [("Accounts Payable", L, 3000)]),
         j("9 Jul", [("Accounts Payable", L, 3000)], [("Cash at Bank", A, 3000)]),
         j("11 Jul", [("Accounts Payable", L, 3000)], [("Discount Received", R, 60), ("Cash at Bank", A, 2940)]),
         j("12 Jul", [("Accounts Receivable", A, 7200)], [("Sales", R, 7200)]),
         j("12 Jul", [("Salaries Expense", E, 1500)], [("Cash at Bank", A, 1500)]),
         j("13 Jul", [("Sales Returns", CR, 200)], [("Accounts Receivable", A, 200)]),
         j("15 Jul", [("Purchases", E, 2100)], [("Accounts Payable", L, 2100)]),
         j("17 Jul", [("Cash at Bank", A, 6930), ("Discount Allowed", E, 70)], [("Accounts Receivable", A, 7000)]),
         j("18 Jul", [("Accounts Payable", L, 100)], [("Purchase Returns", CE, 100)]),
         j("23 Jul", [("Purchases", E, 1500)], [("Cash at Bank", A, 1500)]),
         j("29 Jul", [("Cash at Bank", A, 4000)], [("Sales", R, 4000)])]
thor = [j("May 1", [("Cash at Bank", A, 7000)], [("Sales", R, 7000)]), j("May 2", [("Accounts Receivable", A, 12400)], [("Sales", R, 12400)]),
        j("May 3", [("Sales Returns", CR, 400)], [("Accounts Receivable", A, 400)]), j("May 4", [("Accounts Receivable", A, 3500)], [("Sales", R, 3500)]),
        j("May 5", [("Cash at Bank", A, 11760), ("Discount Allowed", E, 240)], [("Accounts Receivable", A, 12000)]),
        j("May 9", [("Sales Returns", CR, 500)], [("Accounts Receivable", A, 500)])]
lois_open = [{"account": "Cash at Bank", "kind": A, "amount": 15000, "date": "June 1"}, {"account": "Accounts Payable", "kind": L, "amount": 5000, "date": "June 1"}]
lois = [j("June 1", [("Purchases", E, 7300)], [("Accounts Payable", L, 7300)]), j("June 2", [("Accounts Payable", L, 1200)], [("Purchase Returns", CE, 1200)]),
        j("June 3", [("Accounts Payable", L, 300)], [("Purchase Returns", CE, 300)]),
        j("June 4", [("Accounts Payable", L, 7000)], [("Cash at Bank", A, 6650), ("Discount Received", R, 350)]),
        j("June 7", [("Accounts Payable", L, 2400)], [("Cash at Bank", A, 2400)])]


def ex(label, ref, question, solution, figs=None, answer=None, note=None, parts=None, numeric=False, qfigs=None):
    e = {"label": label, "ref": ref, "question": question, "solution": solution, "numeric": numeric}
    for k, v in (("figures", figs), ("answer", answer), ("sourceNote", note), ("parts", parts), ("questionFigures", qfigs)):
        if v is not None:
            e[k] = v
    return e


TA = lambda *a: {"type": "taccounts", "accounts": list(a)}
BAL = lambda *a: {"type": "balanced", "accounts": list(a)}
inventory = [
    {"ref": "Lecture Ex 1", "deliverables": [TA("Cash at Bank", "Capital", "Office Furniture", "A/P – Fantastic", "A/R – Barry", "Sales")]},
    {"ref": "Lecture Ex 2", "deliverables": [BAL("Cash at Bank")]},
    {"ref": "Reading p3", "deliverables": [BAL("Cash at Bank")]},
    {"ref": "Reading p4", "deliverables": [BAL("Cash at Bank")]},
    {"ref": "Practice 5b", "deliverables": [BAL("Cash at Bank")]},
    {"ref": "Tutorial Terms", "deliverables": [{"type": "terms", "terms": ["Ledger", "T format", "Balance c/d", "Balance b/d"]}]},
    {"ref": "Tutorial Q1", "deliverables": [TA("Cash at Bank", "Office Furniture", "Loan", "Capital"), BAL("Cash at Bank")]},
    {"ref": "Tutorial Q3", "parts": ["1", "2", "3", "4", "5", "6", "7"]},
    {"ref": "Reading Worked Example", "deliverables": [{"type": "analysis"}, TA("Cash at Bank", "Capital", "Office Furniture", "Office Equipment", "Drawings", "Motor Vehicle"),
                                                       BAL("Cash at Bank", "Capital", "Office Furniture", "Office Equipment", "Drawings", "Motor Vehicle")]},
    {"ref": "Tutorial Q4", "deliverables": [TA("Cash at Bank", "Accounts Receivable", "Motor Vehicle", "Accounts Payable", "Capital", "Service Fees Revenue")]},
    {"ref": "Tutorial In-class", "parts": ["A", "B"], "deliverables": [{"type": "journal"}, TA("Cash at Bank", "Accounts Receivable", "Accounts Payable", "Capital", "Sales", "Purchases"),
                                                                         BAL("Cash at Bank", "Accounts Receivable", "Accounts Payable", "Capital", "Sales", "Purchases")]},
    {"ref": "Tutorial Extra 1", "parts": ["a", "b", "c", "d"], "deliverables": [{"type": "analysis"}, {"type": "journal"}, TA("Cash at Bank", "Accounts Receivable", "Accounts Payable", "Capital", "Sales", "Purchases", "Wages Expense", "Telephone Expense", "Rent Expense"), {"type": "trialBalance"}]},
    {"ref": "Tutorial Q2", "deliverables": [TA("Cash at Bank", "Accounts Receivable", "Accounts Payable", "Capital", "Discount Allowed", "Discount Received", "Drawings", "Purchases", "Sales", "Delivery Van", "Sales Returns", "Purchase Returns", "Salaries Expense"), {"type": "trialBalance"}]},
    {"ref": "Tutorial Extra 2", "deliverables": [TA("Cash at Bank", "Accounts Receivable", "Sales", "Discount Allowed", "Sales Returns"), BAL("Cash at Bank", "Accounts Receivable", "Sales", "Sales Returns")]},
    {"ref": "Tutorial Extra 3", "deliverables": [TA("Cash at Bank", "Accounts Payable", "Purchase Returns", "Discount Received", "Purchases"), BAL("Cash at Bank", "Accounts Payable")]},
    {"ref": "Worksheet 4"},
    {"ref": "Lecture p32"},
]

note = {
    "course": "accounting", "term": "term1", "week": 5, "title": "Week 5 · Unit 6 分类账 T 型账户",
    "inventory": inventory,
    "intro": ["本周进入会计循环第 4 步：把日记账的分录<strong>过账</strong>（posting）到总分类账的 T 形账户，月底<strong>结账</strong>（balancing），再把余额列成<strong>试算平衡表</strong>（trial balance）。讲义、阅读、练习和 Tutorial Guide 的每道题都在下面，题目要求画的每一张表都完整给出：交易分析表、分录表、每一个 T 形账户和试算平衡表都由程序从分录生成并核对。"],
    "sections": [
        {"title": "总分类账与 T 形账户（General Ledger & T-format）",
         "sources": [{"file": LEC, "pages": "p3–23"}, {"file": READ, "pages": "p1–3"}],
         "concept": "<strong>日记账</strong>按时间记下每笔交易；<strong>总分类账</strong>（general ledger）把同一账户的变动集中在一起，是编报表的依据。\n<strong>T 形账户</strong>：账户名在顶上，<strong>左借右贷</strong>，每边有日期、摘要（particulars）、金额三栏。\n<strong>过账五步</strong>：①找到账户；②看记借方还是贷方；③先写金额；④摘要栏写<strong>对方账户</strong>；⑤写日期。",
         "examples": [ex("例 1", "Lecture Ex 1", "Post the journal entries (Feb 1 Cash 10 000 / Capital；Feb 6 Office furniture 5 000 / A/P – Fantastic；Feb 13 A/R – Barry 100 / Sales；Feb 22 Cash 100 / A/R – Barry；Feb 25 A/P – Fantastic 1 000 / Cash) to T-format ledger accounts.",
                         "每笔分录过两次：借方账户记左边、摘要写贷方账户名；贷方账户记右边、摘要写借方账户名。课件这一页只过账，不结账。", [ledger(lec1, ["taccounts"], "", "", balance=False)])],
         "mistakes": ["摘要栏写自己的账户名：要写<strong>对方</strong>账户。", "借贷记反：分录借记谁就记在谁的左边。", "漏过一边：每笔分录至少两个账户。"],
         "faqs": [{"q": "T 形格式和多栏式有什么区别？", "a": "多栏式日期、摘要只写一次，借贷并排，并多一栏随时更新的余额；T 形格式没有余额栏，要定期结账。下周学多栏式。"}]},
        {"title": "结账：Balance c/d 与 Balance b/d（Balancing T-accounts）",
         "sources": [{"file": LEC, "pages": "p24–31"}, {"file": READ, "pages": "p3–4"}, {"file": PRAC, "pages": "p1–3"}, {"file": TG, "pages": "p2–4, p13"}],
         "concept": "①两边分别加总；②<strong>较大的合计</strong>写在两边 Total；③较小一边写 <strong>Balance c/d</strong>（本月最后一天）；④下月 1 日在<strong>另一边</strong>写 <strong>Balance b/d</strong>。\n余额通常在借方：资产、费用、提款；通常在贷方：负债、所有者权益、收入。",
         "examples": [
             ex("例 2", "Lecture Ex 2", "Cash at Bank: Dr Jan 1 Capital 30 000, Jan 2 Loans 10 000; Cr Jan 13 Furniture 2 000, Jan 14 Equipment 6 000. Balance the account.",
                "借方 40 000，贷方 8 000，贷方差 32 000 记 Balance c/d；2 月 1 日借方记 Balance b/d 32 000。", [single("Cash at Bank", A, [("1 Jan", "Capital", 30000), ("2 Jan", "Loans", 10000)], [("13 Jan", "Furniture", 2000), ("14 Jan", "Equipment", 6000)], "31 Jan", "1 Feb", 32000)], "Balance b/d $32,000 Dr"),
             ex("例 3", "Reading p3", "Cash at Bank for October: Dr Oct 1 Capital 40 000, Oct 3 Bank Loan 7 000, Oct 7 Sales 8 000; Cr Oct 5 Rent Expense 12 000, Oct 12 Office Equipment 2 000, Oct 18 Drawings 2 000. Balance the account.",
                "借方 55 000，贷方 16 000，Balance c/d 39 000；Nov 1 Balance b/d 39 000。c/d 只是让两边相等的平衡数，真正的余额是下月的 b/d。", [single("Cash at Bank", A, [("Oct 1", "Capital", 40000), ("Oct 3", "Bank Loan", 7000), ("Oct 7", "Sales", 8000)], [("Oct 5", "Rent Expense", 12000), ("Oct 12", "Office Equipment", 2000), ("Oct 18", "Drawings", 2000)], "Oct 31", "Nov 1", 39000)]),
             ex("例 4", "Reading p4", "Cash at Bank for March: Dr Mar 1 Capital 15 000, Mar 5 Sales 1 000; Cr Mar 4 Salaries expense 500, Mar 14 Office Equipment 2 000, Mar 19 Drawings 60, Mar 27 Office Rent 560. Balance the account.",
                "借方 16 000，贷方 3 120，差 12 880，是借方余额。", [single("Cash at Bank", A, [("Mar 1", "Capital", 15000), ("Mar 5", "Sales", 1000)], [("Mar 4", "Salaries expense", 500), ("Mar 14", "Office Equipment", 2000), ("Mar 19", "Drawings", 60), ("Mar 27", "Office Rent", 560)], "Mar 31", "Apr 1", 12880)]),
             ex("例 5", "Practice 5b", "Barry's Doctor Clinic, February: owner contributed $10 000 cash; treatment $2 500 to Vicky on credit; received $2 500 from Vicky; paid 3 months' rent in advance $3 000; received $1 000 cash from Angelina for future treatment. Balance the Cash at Bank account.",
                "收到现金都记现金借方，包括 Feb 28 的预收款（Unearned Revenue 是负债）。借方 13 500，贷方 3 000，余额 10 500。", [ledger(barry, ["taccounts"], "28/2", "1/3", show=["Cash at Bank"], expect={"Cash at Bank": 10500})],
                note="练习答案页把 Feb 28 的 1 000 写在现金账户的贷方，与同一份练习的分析表（Cash 增加、Dr）矛盾；收到现金一定记借方，这里按借方处理。"),
             ex("例 6", "Tutorial Terms", "Explain: Ledger; The T format; Balance c/d or closing balance; Balance b/d or opening balance.",
                "<strong>Ledger</strong>（分类账）：按账户汇总全部交易记录的账簿，每个账户一页。\n<strong>T format</strong>（T 形格式）：账户呈 T 字形，左边借方、右边贷方，各有日期、摘要、金额三栏。\n<strong>Balance c/d</strong>（期末余额、结转下期）：月末写在较小一边、使两边相等的差额，日期为本月最后一天。\n<strong>Balance b/d</strong>（期初余额、承前）：下月 1 日写在另一边的同一金额，是账户真正的余额。"),
             ex("例 7", "Tutorial Q1", "T. Trader: complete the accounts in the ledger from the General Journal (1/6 Cash 10 000 / Capital 10 000；2/6 Office Furniture 2 000 / Cash 2 000；3/6 Cash 30 000 / Loan 30 000) and balance the cash account.",
                "题目要求<strong>四个账户都要完成</strong>，只结现金账户。现金借方 40 000、贷方 2 000，Balance c/d 38 000；其余三个账户各只有一笔，不结账。", [ledger(tq1, ["taccounts"], "30/6", "1/7", balance=["Cash at Bank"], show=["Cash at Bank", "Office Furniture", "Loan", "Capital"], expect={"Cash at Bank": 38000, "Office Furniture": 2000, "Loan": -30000, "Capital": -10000})]),
             ex("例 8", "Tutorial Q3", "Complete: Other than the columnar format, the other format of the ledger is the __1__. T-format accounts are balanced at the __2__ of the month. The totals of the __3__ and Cr sides are determined; the difference is the balance __4__ __5__ (c/d), dated at the __6__ of the current month, then __7__ down (b/d).",
                "1 T format　2 end　3 Dr（debit）　4 carried　5 down　6 end　7 brought\n分类账有多栏式和 T 形两种格式；T 形账户在月末结账：先加总借贷两边，差额记为 Balance c/d（结转下期），日期为本月最后一天，再在下月 1 日以 Balance b/d（承前）记到另一边。", parts=["1", "2", "3", "4", "5", "6", "7"])],
         "mistakes": ["c/d 写在较大的一边：c/d 写在<strong>较小</strong>的一边。", "b/d 写回同一边：b/d 写在 c/d 的对面，日期是下月 1 日。", "两边 Total 写不同的数。", "把 c/d 当余额抄进试算表：试算表用 b/d 那一边。"],
         "faqs": [{"q": "只有一笔的账户要不要结账？", "a": "题目要求全部结账时要结；只说 balance the cash account 时只结现金。"},
                  {"q": "资产账户会出现贷方余额吗？", "a": "正常不会；算出来是贷方余额，先检查是否过账记反。"}]},
        {"title": "从交易到试算平衡表：综合练习",
         "sources": [{"file": READ, "pages": "p5–8"}, {"file": TG, "pages": "p4–24"}],
         "concept": "<strong>试算平衡表</strong>（trial balance）把每个账户的余额分列 Dr、Cr 两栏，两栏合计相等说明过账时借贷金额没有记错。完整流程：分析交易 → 写分录 → 过账 → 结账 → 试算平衡表。题目要求哪几张表，下面就完整给出哪几张，没有用汇总表代替。",
         "examples": [
             ex("例 9", "Reading Worked Example", "J. Jay Trading, March: commenced business with cash $15 000; office furniture on credit from Furniture Warehouse $8 000; additional capital $7 000; paid $500 to Furniture Warehouse; office equipment $2 000 cash; owner withdrew $50; motor vehicle on credit from Daisy Car Dealer $4 500; office furniture with cash $560. (i) Prepare the analysis chart. (ii)–(iii) Record in T-format accounts and balance all accounts.",
                "分析要点：Mar 7 付欠款是负债减少、资产减少；Mar 19 提款记 Drawings 借方。分析表、全部账户和补充的试算表如下，与阅读材料 p7–8 的答案一致。", [ledger(jjay, ["analysis", "taccounts"], "Mar 31", "Apr 1", tb="J. Jay Trading Trial Balance as at 31 March（补充核对）",
                expect={"Cash at Bank": 18890, "Capital": -22000, "Office Furniture": 8560, "Office Equipment": 2000, "Drawings": 50, "Motor Vehicle": 4500, "A/P – Furniture Warehouse": -7500, "A/P – Daisy Car Dealer": -4500})]),
             ex("例 10", "Tutorial Q4", "Grunweld, May: post the entries (May 1 Cash 10 000 / Capital；May 2 Motor vehicle 5 000 / A/P – BMX Auto；May 3 A/R – Mira Ltd 1 800 / Service revenue；May 4 Cash 700 / A/R；May 5 A/P – BMX Auto 3 000 / Cash) to the general ledger.",
                "按题目模板，六个账户全部过账；结账和试算表是补充核对。", [ledger(grun, ["taccounts"], "May 31", "Jun 1", tb="Trial Balance as at 31 May（补充核对）", expect={"Cash at Bank": 7700, "Accounts Receivable": 1100, "Accounts Payable": -2000})]),
             ex("例 11", "Tutorial In-class", "Christie's Toys Shoppe, January (opening balances: Cash $50 000, A/R $8 000, A/P $5 000, Capital $53 000): Jan 1 additional investment $50 000; Jan 2 toys for resale on credit from Mira Ltd $5 000; Jan 5 Mr Blacksend bought teddy bears on credit $1 000; Jan 15 paid Mira Ltd $3 000; Jan 19 Mr Blacksend paid in full. (A) Enter in the General Journal. (B) Post and balance the T-accounts.",
                "(A) 分录表如下。(B) 有期初余额的账户，第一行先写 Jan 1 Balance b/d，再过本月分录，最后结账。", [ledger(christie, ["journal", "taccounts"], "Jan 31", "Feb 1", openings=chr_open, tb="Christie's Toys Shoppe Trial Balance as at 31 January（补充核对）", expect={"Cash at Bank": 98000, "Accounts Receivable": 8000, "Accounts Payable": -7000, "Capital": -103000})], parts=["A", "B"]),
             ex("例 12", "Tutorial Extra 1", "Ben's Pharmacy, January: (a) Prepare the transaction analysis table (b) Prepare the journal entries (c) Post to the T-accounts (d) Prepare the trial balance. Transactions: invested $111 900; rent $840; cash sales $1 380; goods on credit from Randwick $300; telephone set-up $18; credit sale to Vicky $680; $500 from Grace for goods; Vicky paid $360; paid Randwick $180; wages $2 660.",
                "(a) 分析表、(b) 分录表、(c) 九个 T 形账户、(d) 试算平衡表依次如下。", [ledger(ben, ["analysis", "journal", "taccounts"], "Jan 31", "Feb 1", tb="Ben's Pharmacy Trial Balance as at 31 January 2025", expect={"Cash at Bank": 110442, "Accounts Receivable": 320, "Accounts Payable": -120})],
                note="Tutorial Guide 的试算表模板漏了 Rent Expense 一行，T 形账户模板也没有它；Jan 2 付了租金，必须设这个账户，否则试算表两边差 840。", parts=["a", "b", "c", "d"]),
             ex("例 13", "Tutorial Q2", "Alex Roger's flower shop, July: post the journal entries (Tutorial Guide p5–7) to the relevant T-accounts and prepare a trial balance.",
                "按 Tutorial Guide 给出的分录过账：Jul 7、Jul 17 收款有现金折扣（三个账户），Jul 11 付款享受 2% 折扣。全部 13 个账户与试算表如下。", [ledger(roger, ["taccounts"], "31 Jul", "1 Aug", tb="Alex Roger Trial Balance as at 31 July", expect={"Cash at Bank": 29060, "Accounts Receivable": 500, "Accounts Payable": -15000})],
                note="Tutorial Guide 的分录里有一笔 Jul 12「Salaries Expense 1 500 / Cash 1 500」，交易清单里没有这一条；这里按分录过账。"),
             ex("例 14", "Tutorial Extra 2", "Thor Painting, May: post the given journal entries (May 1–9) into the T-accounts Cash at Bank, Account Receivable, Sales, Discount Allowed and Sales Returns.",
                "按模板只设一个应收账款控制账户。Sales 22 900、Sales Returns 900 与 Tutorial Guide 给出的余额一致。", [ledger(thor, ["taccounts"], "May 31", "1 June", balance=["Cash at Bank", "Accounts Receivable", "Sales", "Sales Returns"], show=["Cash at Bank", "Accounts Receivable", "Sales", "Discount Allowed", "Sales Returns"], expect={"Sales": -22900, "Sales Returns": 900, "Accounts Receivable": 3000})],
                note="May 10 Violet 付 4 月欠款 $4 000 没有给分录，也没有给 A/R 期初余额，账页只过 May 1–9；若要过这一笔，是借 Cash 4 000、贷 A/R 4 000。"),
             ex("例 15", "Tutorial Extra 3", "Lois Lane Bookshop, June (opening balances Cash $15 000, A/P $5 000): post the transactions into the T-accounts Cash at Bank, Account Payable, Purchase Returns, Discount Received and Purchase.",
                "五个账户全部过账，现金和应付账款结出余额。", [ledger(lois, ["taccounts"], "June 30", "1 July", openings=lois_open, balance=["Cash at Bank", "Accounts Payable"], show=["Cash at Bank", "Accounts Payable", "Purchase Returns", "Discount Received", "Purchases"], expect={"Cash at Bank": 5950, "Accounts Payable": -1400})],
                note="题目写 6 月 1 日买书 $7 300，6 月 4 日的付款分录也按 7 300 算折扣（(7 300 − 300) × 5% = 350），但 6 月 1 日的分录写成 7 000；按 7 000 过账会让欠 Oak 的账多冲 300。这里按 7 300 过账。"),
             ex("例 16", "Worksheet 4", "Transfer the 10 transactions in Worksheet Transaction Analysis 2 to the accounts in the General Ledger and balance the cash account only (T format).",
                "这份工作纸要用到「Worksheet Transaction Analysis 2」里的 10 笔交易，本周资料里只有现金账户第一行（Today Capital 1 500），其余交易不在本周文件中，所以无法给出完整答案。做法与例 7 相同：每笔分录过到模板里对应的账户，只结现金账户。",
                note="本周资料缺少 Worksheet Transaction Analysis 2，答案待补。"),
             ex("例 17", "Lecture p32", "Kingsford Trading trial balance: check that the debit total equals the credit total.",
                "14 个借方余额合计 42 000，7 个贷方余额合计 42 000。Accum. Depreciation、Discounts Received、Purchases Returns 在贷方；Sales Returns、Discount Allowed 在借方。", numeric=True)],
         "mistakes": ["用一张余额汇总表代替 T 形账户：题目要求「post to the T-accounts」时，模板里的每个账户都要画出来。", "折扣分录只过两个账户：收款有折扣时是三个账户，过账也要三处。", "有期初余额的账户忘记先写 Balance b/d。", "试算表放错栏：Purchase Returns、Discount Received 是贷方余额。"],
         "faqs": [{"q": "试算平衡了，账就一定对吗？", "a": "不一定。整笔漏记、记错账户、两边同时记错同一金额，试算表都看不出来。"},
                  {"q": "A/R 要不要按客户分开？", "a": "跟着题目模板走：模板只有一个 Account Receivable 时用一个控制账户；题目要求按客户分开时再分。"}]},
    ],
    "checklist": {"headers": ["步骤", "做什么", "对应例题"], "rows": [
        ["1 过账", "找账户 → 定借贷方 → 写金额 → 摘要写对方账户 → 写日期", "例 1、7、10"],
        ["2 期初余额", "账页第一行写 Balance b/d", "例 11、15"],
        ["3 结账", "两边加总 → 大数写两边 Total → 小的一边 c/d → 下月 1 日对面 b/d", "例 2–5"],
        ["4 交齐所有表", "题目列了几个账户、要不要分析表、分录表、试算表，逐项画全", "例 9、11–15"],
        ["5 试算平衡表", "借方余额进 Dr，贷方余额进 Cr，合计相等", "例 12、13"]]},
    "practice": "本周任务：worksheet 4；阅读 unit6 reading materials 的 Posting 与 Balancing；完成 unit6 tutorial guide。",
}
note["sections"][2]["examples"][-1]["checks"] = [{"expr": "1940+3110+3500+30+104+21800+0+740+9700+26+250+20+100+680", "equals": "42000"},
                                                 {"expr": "550+20950+100+12900+6840+10+650", "equals": "42000"}]
out = os.path.join(ROOT, "pipeline/examples/accounting-term1-w5.json")
json.dump(note, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("wrote", out)
