"""把函数图画成网站笔记可直接嵌入的 SVG（按真实函数逐点采样，不手画）。"""
import itertools
import math

_ids = itertools.count(1)

NAVY, GOLD, BLUE, RED, GREEN, GREY = "#173860", "#b08a3c", "#16569c", "#b03030", "#2e7d4f", "#9fb3cc"


def _fmt(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def plot(curves=(), xr=(-5, 5), yr=(-5, 5), w=320, h=240, points=(), hlines=(), vlines=(),
         labels=(), xticks=(), yticks=(), aria="函数图像", shade=()):
    """curves: dict(f, dom=(a,b), color, dash, width, open_ends)
    points: (x, y, filled, text, dx, dy)   hlines/vlines: (value, color, dash, text)
    labels: (x, y, text, color, anchor)    shade: (x1, x2, color) 竖直色带，用来标出解集"""
    pad = 18
    x0, x1 = xr
    y0, y1 = yr
    sx = (w - 2 * pad) / (x1 - x0)
    sy = (h - 2 * pad) / (y1 - y0)
    X = lambda x: pad + (x - x0) * sx
    Y = lambda y: h - pad - (y - y0) * sy
    out = [f'<svg viewBox="0 0 {w} {h}" width="{w}" role="img" aria-label="{aria}" font-family="sans-serif">']
    out.append(f'<rect x="0" y="0" width="{w}" height="{h}" rx="8" fill="#fbfcfe" stroke="#dfe9f5"/>')
    for a, b, col in shade:
        out.append(f'<rect x="{_fmt(X(a))}" y="{pad}" width="{_fmt(X(b) - X(a))}" height="{h - 2 * pad}" fill="{col}" fill-opacity="0.18"/>')
    if y0 < 0 < y1:
        out.append(f'<line x1="{pad}" y1="{_fmt(Y(0))}" x2="{w - pad + 6}" y2="{_fmt(Y(0))}" stroke="#7a8ba3" stroke-width="1"/>')
        out.append(f'<text x="{w - pad + 2}" y="{_fmt(Y(0) - 5)}" font-size="11" fill="#4a5d75">x</text>')
    if x0 < 0 < x1:
        out.append(f'<line x1="{_fmt(X(0))}" y1="{h - pad}" x2="{_fmt(X(0))}" y2="{pad - 6}" stroke="#7a8ba3" stroke-width="1"/>')
        out.append(f'<text x="{_fmt(X(0) + 5)}" y="{pad - 2}" font-size="11" fill="#4a5d75">y</text>')
    for v in xticks:
        out.append(f'<text x="{_fmt(X(v))}" y="{_fmt(Y(0) + 13)}" font-size="10" fill="#4a5d75" text-anchor="middle">{v}</text>')
    for v in yticks:
        out.append(f'<text x="{_fmt(X(0) - 4)}" y="{_fmt(Y(v) + 3)}" font-size="10" fill="#4a5d75" text-anchor="end">{v}</text>')
    for v, col, dash, text in vlines:
        out.append(f'<line x1="{_fmt(X(v))}" y1="{pad}" x2="{_fmt(X(v))}" y2="{h - pad}" stroke="{col}" stroke-dasharray="{dash}" stroke-width="1.2"/>')
        if text:
            out.append(f'<text x="{_fmt(X(v) + 3)}" y="{pad + 10}" font-size="10" fill="{col}">{text}</text>')
    for v, col, dash, text in hlines:
        out.append(f'<line x1="{pad}" y1="{_fmt(Y(v))}" x2="{w - pad}" y2="{_fmt(Y(v))}" stroke="{col}" stroke-dasharray="{dash}" stroke-width="1.2"/>')
        if text:
            out.append(f'<text x="{w - pad - 2}" y="{_fmt(Y(v) - 4)}" font-size="10" fill="{col}" text-anchor="end">{text}</text>')
    cid = f"pc{next(_ids)}"
    out.append(f'<clipPath id="{cid}"><rect x="{pad}" y="{pad - 4}" width="{w - 2 * pad}" height="{h - 2 * pad + 8}"/></clipPath><g clip-path="url(#{cid})">')
    for c in curves:
        a, b = c.get("dom", xr)
        a, b = max(a, x0), min(b, x1)
        n = 140
        segs, cur = [], []
        for i in range(n + 1):
            x = a + (b - a) * i / n
            if i == 0 and c.get("open_lo"):
                x += (b - a) * 1e-4
            if i == n and c.get("open_hi"):
                x -= (b - a) * 1e-4
            try:
                y = c["f"](x)
            except (ValueError, ZeroDivisionError):
                y = None
            if y is None or isinstance(y, complex) or math.isnan(y) or y < y0 - (y1 - y0) or y > y1 + (y1 - y0):
                if len(cur) > 1:
                    segs.append(cur)
                cur = []
                continue
            cur.append(f"{_fmt(X(x))},{_fmt(Y(y))}")
        if len(cur) > 1:
            segs.append(cur)
        dash = f' stroke-dasharray="{c["dash"]}"' if c.get("dash") else ""
        for s in segs:
            out.append(f'<polyline points="{" ".join(s)}" fill="none" stroke="{c.get("color", NAVY)}" stroke-width="{c.get("width", 2)}"{dash}/>')
        if c.get("label"):
            lx, ly, txt = c["label"]
            out.append(f'<text x="{_fmt(X(lx))}" y="{_fmt(Y(ly))}" font-size="11" fill="{c.get("color", NAVY)}" font-weight="700">{txt}</text>')
    out.append('</g>')
    for p in points:
        x, y, filled, text = p[:4]
        dx, dy = (p[4], p[5]) if len(p) > 5 else (6, -6)
        fill = NAVY if filled else "#fff"
        out.append(f'<circle cx="{_fmt(X(x))}" cy="{_fmt(Y(y))}" r="3.5" fill="{fill}" stroke="{NAVY}" stroke-width="1.5"/>')
        if text:
            out.append(f'<text x="{_fmt(X(x) + dx)}" y="{_fmt(Y(y) + dy)}" font-size="10" fill="{NAVY}">{text}</text>')
    for x, y, text, col, anchor in labels:
        out.append(f'<text x="{_fmt(X(x))}" y="{_fmt(Y(y))}" font-size="11" fill="{col}" text-anchor="{anchor}">{text}</text>')
    out.append("</svg>")
    return "".join(out)


def figure(svg, caption):
    return f'<div class="diagram">{svg}<p class="cap">{caption}</p></div>'


def build(template_path, out_path, figures):
    """把模板里的 <!--FIG:name--> 换成对应的图；缺图或多余的图都会报错。"""
    s = open(template_path, encoding="utf-8").read()
    for name, html in figures.items():
        marker = f"<!--FIG:{name}-->"
        if marker not in s:
            raise SystemExit(f"模板里没有 {marker}")
        s = s.replace(marker, html)
    if "<!--FIG:" in s:
        raise SystemExit("模板里还有未生成的图：" + s[s.index("<!--FIG:"):s.index("<!--FIG:") + 40])
    open(out_path, "w", encoding="utf-8").write(s)
    return len(s)
