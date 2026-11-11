'use strict';
/* 把一周的结构化笔记（JSON）渲染成网站用的 graphicHtml。
   AI 只写内容和图的「规格」；图、账页、排版全部由这里按固定规则生成，保证格式统一、数字可复算。 */
const { parse } = require('./expr');

const COLORS = { navy: '#173860', blue: '#16569c', gold: '#b08a3c', green: '#2e7d4f', red: '#b03030', grey: '#9fb3cc' };
const ALLOWED_TAGS = new Set(['strong', 'em', 'br', 'sub', 'sup']);

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* 正文只允许少量标签；分数写成 {{frac 分子|分母}}，其余 HTML 一律转义。 */
function inline(text) {
  let s = escapeHtml(text);
  s = s.replace(/&lt;(\/?)([a-z]+)\s*\/?&gt;/g, (m, slash, tag) => ALLOWED_TAGS.has(tag) ? '<' + slash + tag + '>' : m);
  for (let i = 0; i < 4 && /\{\{frac /.test(s); i++) {
    s = s.replace(/\{\{frac ([^{}|]*)\|([^{}]*)\}\}/g, '<span class="frac"><span class="n">$1</span><span class="d">$2</span></span>');
  }
  return s.replace(/\n/g, '<br>');
}

const fmt = v => (Math.round(v * 10) / 10).toString();
let clipSeq = 0;

function plotSvg(fig) {
  const w = fig.width || 320, h = fig.height || 240, pad = 18;
  const [x0, x1] = fig.xr, [y0, y1] = fig.yr;
  const sx = (w - 2 * pad) / (x1 - x0), sy = (h - 2 * pad) / (y1 - y0);
  const X = x => pad + (x - x0) * sx, Y = y => h - pad - (y - y0) * sy;
  const color = c => COLORS[c] || COLORS.navy;
  const o = [`<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${escapeHtml(fig.alt || fig.caption || '函数图像')}" font-family="sans-serif">`,
    `<rect x="0" y="0" width="${w}" height="${h}" rx="8" fill="#fbfcfe" stroke="#dfe9f5"/>`];
  for (const [a, b, c] of fig.shade || []) o.push(`<rect x="${fmt(X(a))}" y="${pad}" width="${fmt(X(b) - X(a))}" height="${h - 2 * pad}" fill="${color(c || 'green')}" fill-opacity="0.18"/>`);
  if (y0 < 0 && y1 > 0) o.push(`<line x1="${pad}" y1="${fmt(Y(0))}" x2="${w - pad + 6}" y2="${fmt(Y(0))}" stroke="#7a8ba3"/><text x="${w - pad + 2}" y="${fmt(Y(0) - 5)}" font-size="11" fill="#4a5d75">${escapeHtml(fig.xLabel || 'x')}</text>`);
  if (x0 < 0 && x1 > 0) o.push(`<line x1="${fmt(X(0))}" y1="${h - pad}" x2="${fmt(X(0))}" y2="${pad - 6}" stroke="#7a8ba3"/><text x="${fmt(X(0) + 5)}" y="${pad - 2}" font-size="11" fill="#4a5d75">${escapeHtml(fig.yLabel || 'y')}</text>`);
  for (const v of fig.xticks || []) o.push(`<text x="${fmt(X(v))}" y="${fmt(Y(Math.max(y0, Math.min(0, y1))) + 13)}" font-size="10" fill="#4a5d75" text-anchor="middle">${v}</text>`);
  for (const v of fig.yticks || []) o.push(`<text x="${fmt(X(Math.max(x0, Math.min(0, x1))) - 4)}" y="${fmt(Y(v) + 3)}" font-size="10" fill="#4a5d75" text-anchor="end">${v}</text>`);
  for (const l of fig.vlines || []) o.push(`<line x1="${fmt(X(l.x))}" y1="${pad}" x2="${fmt(X(l.x))}" y2="${h - pad}" stroke="${color(l.color || 'grey')}" stroke-dasharray="3 3"/>` + (l.label ? `<text x="${fmt(X(l.x) + 3)}" y="${pad + 10}" font-size="10" fill="${color(l.color || 'grey')}">${escapeHtml(l.label)}</text>` : ''));
  for (const l of fig.hlines || []) o.push(`<line x1="${pad}" y1="${fmt(Y(l.y))}" x2="${w - pad}" y2="${fmt(Y(l.y))}" stroke="${color(l.color || 'grey')}" stroke-dasharray="4 3"/>` + (l.label ? `<text x="${w - pad - 2}" y="${fmt(Y(l.y) - 4)}" font-size="10" fill="${color(l.color || 'grey')}" text-anchor="end">${escapeHtml(l.label)}</text>` : ''));
  const cid = 'npc' + (++clipSeq);
  o.push(`<clipPath id="${cid}"><rect x="${pad}" y="${pad - 4}" width="${w - 2 * pad}" height="${h - 2 * pad + 8}"/></clipPath><g clip-path="url(#${cid})">`);
  for (const c of fig.curves || []) {
    const f = parse(c.expr);
    let [a, b] = c.dom || fig.xr;
    a = Math.max(a, x0); b = Math.min(b, x1);
    const n = 140, segs = [];
    let cur = [];
    for (let i = 0; i <= n; i++) {
      let x = a + (b - a) * i / n;
      if (i === 0 && c.openLo) x += (b - a) * 1e-4;
      if (i === n && c.openHi) x -= (b - a) * 1e-4;
      let y;
      try { y = f({ x }); } catch (e) { y = NaN; }
      if (!Number.isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) { if (cur.length > 1) segs.push(cur); cur = []; continue; }
      cur.push(fmt(X(x)) + ',' + fmt(Y(y)));
    }
    if (cur.length > 1) segs.push(cur);
    for (const s of segs) o.push(`<polyline points="${s.join(' ')}" fill="none" stroke="${color(c.color)}" stroke-width="2"${c.dash ? ' stroke-dasharray="4 3"' : ''}/>`);
    if (c.label) o.push(`<text x="${fmt(X(c.label[0]))}" y="${fmt(Y(c.label[1]))}" font-size="11" fill="${color(c.color)}" font-weight="700">${escapeHtml(c.label[2])}</text>`);
  }
  o.push('</g>');
  for (const pt of fig.points || []) {
    o.push(`<circle cx="${fmt(X(pt.x))}" cy="${fmt(Y(pt.y))}" r="3.5" fill="${pt.open ? '#fff' : COLORS.navy}" stroke="${COLORS.navy}" stroke-width="1.5"/>`);
    if (pt.label) o.push(`<text x="${fmt(X(pt.x) + (pt.dx ?? 6))}" y="${fmt(Y(pt.y) + (pt.dy ?? -6))}" font-size="10" fill="${COLORS.navy}">${escapeHtml(pt.label)}</text>`);
  }
  o.push('</svg>');
  return o.join('');
}

function vennSvg(fig) {
  const [a, b] = fig.sets, c = fig.counts || {};
  const t = v => v == null ? '' : escapeHtml(v);
  return `<svg viewBox="0 0 320 200" width="320" role="img" aria-label="${escapeHtml(fig.alt || fig.caption || '韦恩图')}" font-family="sans-serif">` +
    `<rect x="4" y="4" width="312" height="192" rx="10" fill="#f7f9fc" stroke="#9fb3cc"/>` +
    (fig.universe ? `<text x="16" y="24" font-size="12" fill="#4a5d75">${escapeHtml(fig.universe)}</text>` : '') +
    `<circle cx="125" cy="105" r="70" fill="#d9e8f8" fill-opacity="0.8" stroke="#16569c"/><circle cx="200" cy="105" r="70" fill="#f6e3b4" fill-opacity="0.75" stroke="#b08a3c"/>` +
    `<g text-anchor="middle"><text x="95" y="62" font-size="12" fill="#16569c" font-weight="700">${escapeHtml(a)}</text><text x="232" y="62" font-size="12" fill="#8a6d1f" font-weight="700">${escapeHtml(b)}</text>` +
    `<text x="92" y="112" font-size="18" fill="#173860">${t(c.aOnly)}</text><text x="162" y="112" font-size="18" fill="#173860" font-weight="700">${t(c.both)}</text>` +
    `<text x="235" y="112" font-size="18" fill="#173860">${t(c.bOnly)}</text><text x="290" y="182" font-size="14" fill="#4a5d75">${t(c.neither)}</text></g></svg>`;
}

/* 网格：例如两颗骰子的 36 种结果。cell / highlight 都是含 r、c 的表达式。 */
function gridSvg(fig) {
  const rows = fig.rows, cols = fig.cols, s = 40, left = 55, top = 50;
  const cell = parse(fig.cell), hl = fig.highlight ? parse(fig.highlight) : null;
  const o = [`<svg viewBox="0 0 ${left + cols.length * s + 10} ${top + rows.length * s + 10}" width="${left + cols.length * s + 10}" role="img" aria-label="${escapeHtml(fig.alt || fig.caption || '网格')}" font-family="sans-serif"><g text-anchor="middle" font-size="12">`];
  if (fig.colTitle) o.push(`<text x="${left + cols.length * s / 2}" y="16" fill="#173860" font-weight="700">${escapeHtml(fig.colTitle)}</text>`);
  if (fig.rowTitle) o.push(`<text x="14" y="${top + rows.length * s / 2}" fill="#173860" font-weight="700" transform="rotate(-90 14 ${top + rows.length * s / 2})">${escapeHtml(fig.rowTitle)}</text>`);
  cols.forEach((c, j) => o.push(`<text x="${left + j * s + s / 2}" y="40" fill="#4a5d75">${c}</text>`));
  rows.forEach((r, i) => {
    o.push(`<text x="40" y="${top + i * s + 25}" fill="#4a5d75">${r}</text>`);
    cols.forEach((c, j) => {
      const on = hl && hl({ r, c });
      o.push(`<rect x="${left + j * s}" y="${top + i * s}" width="${s}" height="${s}" fill="${on ? '#f6e3b4' : '#fff'}" stroke="${on ? '#c9a55c' : '#c9d7ea'}"/><text x="${left + j * s + s / 2}" y="${top + i * s + 25}" font-size="13"${on ? ' font-weight="700"' : ''}>${fmt(cell({ r, c }))}</text>`);
    });
  });
  o.push('</g></svg>');
  return o.join('');
}

function tableHtml(fig) {
  return `<table class="kp-tbl">${fig.title ? `<caption>${inline(fig.title)}</caption>` : ''}<thead><tr>${fig.headers.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>` +
    fig.rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
}

/* ---------- 会计：过账、结账、试算平衡表，金额全由程序计算 ---------- */
const DEBIT_NORMAL = new Set(['asset', 'expense', 'drawings']);
const money = v => Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function postLedger(fig) {
  const acc = new Map();
  const get = (name, kind) => { if (!acc.has(name)) acc.set(name, { kind, dr: [], cr: [], seq: [] }); return acc.get(name); };
  const add = (name, kind, side, row) => { const a = get(name, kind); a[side].push(row); a.seq.push([...row, side]); };
  for (const o of fig.openings || []) add(o.account, o.kind, DEBIT_NORMAL.has(o.kind) ? 'dr' : 'cr', [o.date, 'Balance b/d', o.amount]);
  for (const j of fig.journal) {
    const dr = j.dr.reduce((s, x) => s + x[2], 0), cr = j.cr.reduce((s, x) => s + x[2], 0);
    if (Math.abs(dr - cr) > 1e-9) throw new Error(`${j.date} 分录借贷不等：${dr} ≠ ${cr}`);
    for (const [n, k, v] of j.dr) add(n, k, 'dr', [j.date, j.cr.map(x => x[0]).join(' & '), v]);
    for (const [n, k, v] of j.cr) add(n, k, 'cr', [j.date, j.dr.map(x => x[0]).join(' & '), v]);
  }
  return acc;
}
/* 账户名比较用：忽略大小写、空格、Account 字样和单复数，「Account Receivable」与「Accounts Receivable」视为同一账户。 */
function normName(n) {
  return String(n).toLowerCase().replace(/\baccounts?\b/g, 'acct').replace(/\b(a\/r)\b/g, 'acct receivable').replace(/\b(a\/p)\b/g, 'acct payable')
    .replace(/[^a-z]/g, '').replace(/s$/, '');
}
const balanceOf = a => a.dr.reduce((s, x) => s + x[2], 0) - a.cr.reduce((s, x) => s + x[2], 0);

function taccount(name, a, endDate, nextDate, balanceIt) {
  const dr = [...a.dr], cr = [...a.cr], bal = balanceOf(a);
  let total = null;
  if (balanceIt && bal) { (bal > 0 ? cr : dr).push([endDate, 'Balance c/d', Math.abs(bal)]); total = dr.reduce((s, x) => s + x[2], 0); }
  const rows = [];
  for (let i = 0; i < Math.max(dr.length, cr.length); i++) {
    rows.push('<tr>' + [dr[i], cr[i]].map(e => e ? `<td>${escapeHtml(e[0])}</td><td${e[1] === 'Balance c/d' ? ' class="cd"' : ''}>${escapeHtml(e[1])}</td><td>${money(e[2])}</td>` : '<td></td><td></td><td></td>').join('') + '</tr>');
  }
  if (total != null) {
    rows.push(`<tr class="tot"><td></td><td>Total</td><td>${money(total)}</td><td></td><td>Total</td><td>${money(total)}</td></tr>`);
    rows.push(bal > 0 ? `<tr class="bd"><td>${escapeHtml(nextDate)}</td><td>Balance b/d</td><td>${money(bal)}</td><td></td><td></td><td></td></tr>`
      : `<tr class="bd"><td></td><td></td><td></td><td>${escapeHtml(nextDate)}</td><td>Balance b/d</td><td>${money(-bal)}</td></tr>`);
  }
  return `<table class="kp-tbl ledger"><caption>${escapeHtml(name)}</caption><thead><tr><th>Date</th><th>Particulars</th><th>Dr $</th><th>Date</th><th>Particulars</th><th>Cr $</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

const KIND_CODE = { asset: 'A', liability: 'L', equity: 'OE', revenue: 'R', expense: 'E', drawings: 'OE (Drawings)' };
/* 借记资产、费用、提款是增加；贷记负债、权益、收入是增加；反过来就是减少。 */
const effect = (kind, side) => (DEBIT_NORMAL.has(kind) === (side === 'dr')) ? 'Increase' : 'Decrease';

function analysisHtml(fig) {
  const rows = [];
  for (const j of fig.journal) {
    const lines = [...j.dr.map(x => [x, 'dr']), ...j.cr.map(x => [x, 'cr'])];
    lines.forEach(([[n, k, v], side], i) => rows.push(`<tr><td>${i ? '' : escapeHtml(j.date)}</td><td>${escapeHtml(n)}</td><td>${KIND_CODE[k]}</td><td>${effect(k, side)}</td><td>${side === 'dr' ? 'Dr' : 'Cr'}</td><td>${money(v)}</td></tr>`));
  }
  return `<table class="kp-tbl"><caption>Transaction Analysis 交易分析表</caption><thead><tr><th>Date</th><th>Account</th><th>A/L/OE/R/E</th><th>Increase / Decrease</th><th>Dr / Cr</th><th>Amount $</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

function journalHtml(fig) {
  const rows = [];
  for (const j of fig.journal) {
    j.dr.forEach(([n, , v], i) => rows.push(`<tr><td>${i ? '' : escapeHtml(j.date)}</td><td>${escapeHtml(n)}</td><td>${money(v)}</td><td></td></tr>`));
    j.cr.forEach(([n, , v]) => rows.push(`<tr><td></td><td class="jcr">${escapeHtml(n)}</td><td></td><td>${money(v)}</td></tr>`));
    if (j.narration) rows.push(`<tr class="narr"><td></td><td colspan="3">(${escapeHtml(j.narration)})</td></tr>`);
  }
  return `<table class="kp-tbl journal"><caption>General Journal 普通日记账</caption><thead><tr><th>Date</th><th>Particulars</th><th>Dr $</th><th>Cr $</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

/* 多栏式账户：按时间顺序逐笔记录，每一行算出余额并标明借方或贷方。 */
function columnar(name, a) {
  let bal = 0;
  const rows = a.seq.map(([d, p, v, side]) => {
    if (p === 'Balance b/d') { bal = side === 'dr' ? v : -v; return `<tr><td>${escapeHtml(d)}</td><td>Balance b/d</td><td></td><td></td><td>${money(Math.abs(bal))} ${bal >= 0 ? 'Dr' : 'Cr'}</td></tr>`; }
    bal += side === 'dr' ? v : -v;
    return `<tr><td>${escapeHtml(d)}</td><td>${escapeHtml(p)}</td><td>${side === 'dr' ? money(v) : ''}</td><td>${side === 'cr' ? money(v) : ''}</td><td>${money(Math.abs(bal))} ${bal > 0 ? 'Dr' : bal < 0 ? 'Cr' : ''}</td></tr>`;
  });
  return `<table class="kp-tbl ledger columnar"><caption>${escapeHtml(name)}</caption><thead><tr><th>Date</th><th>Particulars</th><th>Dr $</th><th>Cr $</th><th>Balance $</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

function ledgerHtml(fig) {
  const acc = postLedger(fig);
  const names = fig.show || [...acc.keys()];
  const views = new Set(fig.views || ['taccounts']);
  const balanceSet = new Set(fig.balance === true ? names : (fig.balance || []));
  let html = '';
  if (views.has('analysis')) html += analysisHtml(fig);
  if (views.has('journal')) html += journalHtml(fig);
  if (views.has('taccounts')) html += names.map(n => taccount(n, acc.get(n), fig.endDate, fig.nextDate, balanceSet.has(n))).join('');
  if (views.has('columnar')) html += names.map(n => columnar(n, acc.get(n))).join('');
  if (fig.trialBalance) {
    let tdr = 0, tcr = 0;
    const rows = [...acc].filter(([, a]) => balanceOf(a)).map(([n, a]) => { const b = balanceOf(a); tdr += Math.max(b, 0); tcr += Math.max(-b, 0); return `<tr><td>${escapeHtml(n)}</td><td>${b > 0 ? money(b) : ''}</td><td>${b < 0 ? money(-b) : ''}</td></tr>`; });
    if (Math.abs(tdr - tcr) > 1e-9) throw new Error(`试算不平：${tdr} ≠ ${tcr}`);
    html += `<table class="kp-tbl"><caption>${escapeHtml(fig.trialBalance)}</caption><thead><tr><th>Account</th><th>Dr $</th><th>Cr $</th></tr></thead><tbody>${rows.join('')}<tr class="tot"><td>Total</td><td>${money(tdr)}</td><td>${money(tcr)}</td></tr></tbody></table>`;
  }
  return `<div class="ledger-set">${html}</div>`;
}

function figureHtml(fig) {
  const body = { plot: plotSvg, venn: vennSvg, grid: gridSvg, table: tableHtml, ledger: ledgerHtml }[fig.type];
  if (!body) throw new Error('不支持的图类型：' + fig.type);
  const inner = body(fig);
  if (fig.type === 'ledger' || fig.type === 'table') return inner + (fig.caption ? `<p class="cap">${inline(fig.caption)}</p>` : '');
  return `<div class="diagram">${inner}${fig.caption ? `<p class="cap">${inline(fig.caption)}</p>` : ''}</div>`;
}

function renderWeek(note) {
  const h = [];
  h.push('<h4 class="kp-h">本周导览 · 怎么自学这一周</h4>');
  for (const p of [].concat(note.intro || [])) h.push(`<p>${inline(p)}</p>`);
  h.push(`<div class="callout blue"><strong>建议顺序</strong>：${inline(note.studyOrder || '①读「概念」；②看图；③做例题时先遮住解答，自己做完再点「看解答」核对；④读「易错」和「常见疑惑」；⑤用本周末尾的流程表自测。')}</div>`);
  for (const s of note.sections) {
    h.push(`<h4 class="kp-h">${inline(s.title)}</h4>`);
    h.push(`<p class="kp-src">${escapeHtml(s.sources.map(x => x.file + ' · PDF ' + x.pages).join('；'))}</p>`);
    h.push(`<div class="callout blue"><strong>概念</strong><br>${inline(s.concept)}</div>`);
    for (const f of s.formulas || []) h.push(`<div class="formula">${inline(f)}</div>`);
    for (const fig of s.figures || []) h.push(figureHtml(fig));
    for (const ex of s.examples || []) {
      h.push(`<p class="c-blue"><strong>${inline(ex.label)}（${escapeHtml(ex.ref)}）</strong> ${inline(ex.question)}</p>`);
      for (const fig of ex.questionFigures || []) h.push(figureHtml(fig));
      h.push('<details><summary>看解答</summary>');
      h.push(`<p>${inline(ex.solution)}${ex.sourceNote ? '<br>注：' + inline(ex.sourceNote) : ''}${ex.answer ? '<br>Answer: ' + inline(ex.answer) : ''}</p>`);
      for (const fig of ex.figures || []) h.push(figureHtml(fig));
      h.push('</details>');
    }
    if ((s.mistakes || []).length) h.push(`<div class="callout red"><strong>易错</strong><br>${s.mistakes.map((m, i) => '①②③④⑤⑥⑦⑧'[i] + ' ' + inline(m)).join('<br>')}</div>`);
    if ((s.faqs || []).length) h.push(`<div class="callout blue"><strong>常见疑惑</strong><br>${s.faqs.map(f => `<strong>问：${inline(f.q)}</strong> ${inline(f.a)}`).join('<br>')}</div>`);
  }
  if (note.checklist) {
    h.push('<h4 class="kp-h">本周解题流程（自测清单）</h4>');
    h.push(tableHtml(note.checklist));
  }
  if (note.practice) h.push(`<p>${inline(note.practice)}</p>`);
  return h.join('\n');
}

module.exports = { renderWeek, figureHtml, inline, postLedger, balanceOf, normName };
