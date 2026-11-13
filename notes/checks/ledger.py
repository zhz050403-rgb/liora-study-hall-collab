"""会计账页生成器：从分录过账到 T 形账户、结账、试算平衡表，金额全部由程序计算。"""
from collections import OrderedDict

DEBIT_NORMAL = ("asset", "expense", "drawings")


def money(v):
    return f"{v:,.0f}" if float(v).is_integer() else f"{v:,.2f}"


class Ledger:
    def __init__(self):
        self.acc = OrderedDict()

    def account(self, name, kind):
        self.acc.setdefault(name, {"kind": kind, "dr": [], "cr": []})
        return self.acc[name]

    def opening(self, name, kind, amount, date):
        a = self.account(name, kind)
        side = "dr" if kind in DEBIT_NORMAL else "cr"
        a[side].append((date, "Balance b/d", amount))

    def journal(self, date, debits, credits):
        """debits/credits: [(账户名, 类型, 金额)]；借贷不等直接报错。"""
        dr, cr = sum(x[2] for x in debits), sum(x[2] for x in credits)
        if round(dr - cr, 6):
            raise ValueError(f"{date} 借贷不等：{dr} ≠ {cr}")
        for name, kind, amt in debits:
            other = " & ".join(x[0] for x in credits)
            self.account(name, kind)["dr"].append((date, other, amt))
        for name, kind, amt in credits:
            other = " & ".join(x[0] for x in debits)
            self.account(name, kind)["cr"].append((date, other, amt))

    def balance(self, name):
        a = self.acc[name]
        return sum(x[2] for x in a["dr"]) - sum(x[2] for x in a["cr"])

    def taccount_html(self, name, end_date, next_date, balance_it=True):
        a = self.acc[name]
        dr, cr = list(a["dr"]), list(a["cr"])
        bal = self.balance(name)
        total = None
        if balance_it and bal:
            if bal > 0:
                cr.append((end_date, "Balance c/d", bal))
            else:
                dr.append((end_date, "Balance c/d", -bal))
            total = sum(x[2] for x in dr)
        rows = max(len(dr), len(cr))
        h = [f'<table class="kp-tbl ledger"><caption>{name}</caption><thead><tr><th>Date</th><th>Particulars</th>'
             '<th>Dr $</th><th>Date</th><th>Particulars</th><th>Cr $</th></tr></thead><tbody>']
        for i in range(rows):
            l = dr[i] if i < len(dr) else ("", "", "")
            r = cr[i] if i < len(cr) else ("", "", "")
            cells = []
            for d, p, v in (l, r):
                style = ' class="cd"' if p == "Balance c/d" else ""
                cells.append(f"<td>{d}</td><td{style}>{p}</td><td{style}>{money(v) if v != '' else ''}</td>")
            h.append("<tr>" + "".join(cells) + "</tr>")
        if total is not None:
            h.append(f'<tr class="tot"><td></td><td>Total</td><td>{money(total)}</td><td></td><td>Total</td><td>{money(total)}</td></tr>')
            if bal > 0:
                h.append(f'<tr class="bd"><td>{next_date}</td><td>Balance b/d</td><td>{money(bal)}</td><td></td><td></td><td></td></tr>')
            else:
                h.append(f'<tr class="bd"><td></td><td></td><td></td><td>{next_date}</td><td>Balance b/d</td><td>{money(-bal)}</td></tr>')
        h.append("</tbody></table>")
        return "".join(h)

    def ledgers_html(self, end_date, next_date, names=None):
        return "".join(self.taccount_html(n, end_date, next_date) for n in (names or self.acc))

    def trial_balance(self):
        rows, tdr, tcr = [], 0, 0
        for n in self.acc:
            b = self.balance(n)
            if not b:
                continue
            rows.append((n, b if b > 0 else "", -b if b < 0 else ""))
            tdr += max(b, 0)
            tcr += max(-b, 0)
        return rows, tdr, tcr

    def trial_balance_html(self, title):
        rows, tdr, tcr = self.trial_balance()
        if round(tdr - tcr, 6):
            raise ValueError(f"试算不平：{tdr} ≠ {tcr}")
        h = [f'<table class="kp-tbl"><caption>{title}</caption><thead><tr><th>Account</th><th>Dr $</th><th>Cr $</th></tr></thead><tbody>']
        for n, d, c in rows:
            h.append(f"<tr><td>{n}</td><td>{money(d) if d != '' else ''}</td><td>{money(c) if c != '' else ''}</td></tr>")
        h.append(f'<tr class="tot"><td>Total</td><td>{money(tdr)}</td><td>{money(tcr)}</td></tr></tbody></table>')
        return "".join(h)
