#!/usr/bin/env node
'use strict';

/**
 * Phase 4 Visual Diagram Repair & Completion Pipeline
 * 1. Preserves 100% of existing intact SVGs (515+) and intact images (math-reference 200, comp-reference 7, extracurricular 11).
 * 2. Purges all 172 broken Computing image references & dead PDF links (zero 404s, zero text deleted).
 * 3. Adds bespoke, Claude-standard bilingual <svg> diagrams to every week that lacked visual diagrams:
 *    - Accounting (W2–W13: 12 bespoke diagrams covering the full accounting cycle, DEAD/CLIC, adjusting entries, statements, ratios)
 *    - Economics (T1 W1, T2 W7, T1X W5: 4 diagrams including Circular Flow & Elasticity)
 *    - Mathematics (T1 W13, T2 W14: 2 revision roadmap diagrams)
 *    - Computing (T1 W1–W13, T2 W1–W13: 26 diagrams covering PPT, Word, Hardware/Web, SDLC, Excel refs/IF/XLOOKUP/dates/finance/charts/media)
 *    - Academic English (W1–W14: 14 diagrams covering PEEL, Cornell notes, paragraph structure, infographics, reporting verbs, nominalisation, reading locator)
 *    - Extracurricular (M7–M12: 6 diagrams covering Stocks, Position/Risk-Reward, Drawdown, Futures MTM, Paper Trading loop, Break-Even curve)
 * 4. Syncs data-chunks/courses/*.json, data-chunks/index.json (with diagramCount per week & course), and data.js.
 * Idempotent: re-running cleanly replaces `.liora-auto-fig` blocks without duplicating anything.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const CHUNKS_DIR = path.join(PUB, 'data-chunks');
const COURSES_DIR = path.join(CHUNKS_DIR, 'courses');
const DATA_JS = path.join(PUB, 'data.js');

const FONT = "'PingFang SC','Hiragino Sans GB','Microsoft YaHei',system-ui,sans-serif";
const C = {
  navy: '#153257',
  navy2: '#234a78',
  blue: '#2563a6',
  blueBg: '#eef5fc',
  blueBd: '#bdd5ee',
  gold: '#9c711c',
  goldLine: '#c99b3b',
  goldBg: '#fdf7e7',
  goldBd: '#e6d099',
  green: '#1d6f4e',
  greenBg: '#ebf7f1',
  greenBd: '#a8d8c0',
  red: '#b4322a',
  redBg: '#fdf0ee',
  redBd: '#ebb8b2',
  purple: '#5b3e96',
  purpleBg: '#f3effb',
  purpleBd: '#cfc1eb',
  slate: '#475a70',
  muted: '#6b7e94',
  bg: '#fbfcfe',
  bd: '#d5e2ef'
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrapLines(text, maxChars) {
  const s = String(text || '');
  if (s.length <= maxChars) return [s];
  const out = [];
  let cur = '';
  for (const ch of s) {
    cur += ch;
    const len = [...cur].reduce((n, c) => n + (c.charCodeAt(0) > 127 ? 1 : 0.56), 0);
    if (len >= maxChars) {
      out.push(cur);
      cur = '';
    }
  }
  if (cur) out.push(cur);
  return out;
}

function renderLines(x, y, lines, size, fill, anchor = 'middle', weight = '400', lh = 1.38) {
  return lines.map((ln, i) =>
    `<text x="${x}" y="${(y + i * size * lh).toFixed(1)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(ln)}</text>`
  ).join('');
}

function frameSvg(id, w, h, title, subtitle, inner, caption) {
  const headerH = subtitle ? 56 : 42;
  const svg =
    `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${esc(title)}" font-family="${FONT}">` +
      `<defs>` +
        `<marker id="arr-${id}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">` +
          `<path d="M1,1.5 L8.5,5 L1,8.5 z" fill="${C.navy2}"/>` +
        `</marker>` +
        `<marker id="arrg-${id}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">` +
          `<path d="M1,1.5 L8.5,5 L1,8.5 z" fill="${C.goldLine}"/>` +
        `</marker>` +
      `</defs>` +
      `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="12" fill="${C.bg}" stroke="${C.bd}" stroke-width="1.5"/>` +
      `<path d="M13,1 H${w - 13} Q${w - 1},1 ${w - 1},13 V${headerH} H1 V13 Q1,1 13,1 Z" fill="${C.navy}"/>` +
      `<rect x="1" y="${headerH - 2.5}" width="${w - 2}" height="2.5" fill="${C.goldLine}"/>` +
      `<text x="18" y="26" font-size="14.5" font-weight="700" fill="#ffffff">${esc(title)}</text>` +
      (subtitle ? `<text x="18" y="45" font-size="11.5" fill="#cbdcf0">${esc(subtitle)}</text>` : '') +
      inner +
    `</svg>`;
  return `<div class="diagram liora-auto-fig" data-fig-id="${esc(id)}">${svg}<p class="cap">${esc(caption || title)}</p></div>`;
}

/* 1. Horizontal / 2-row step flow */
function flowSvg(id, title, subtitle, steps, footer, caption) {
  const w = 680;
  const perRow = steps.length <= 4 ? steps.length : Math.ceil(steps.length / 2);
  const rows = steps.length <= 4 ? 1 : 2;
  const padX = 18;
  const gapX = 24;
  const boxW = Math.floor((w - padX * 2 - gapX * (perRow - 1)) / perRow);
  const boxH = 104;
  const startY = 74;
  const rowGap = 32;
  const footerH = footer ? 42 : 0;
  const h = startY + rows * boxH + (rows - 1) * rowGap + (footer ? 16 + footerH : 18);

  const palettes = [
    { bg: C.blueBg, bd: C.blueBd, head: C.navy2 },
    { bg: C.goldBg, bd: C.goldBd, head: C.gold },
    { bg: C.greenBg, bd: C.greenBd, head: C.green },
    { bg: C.purpleBg, bd: C.purpleBd, head: C.purple },
    { bg: C.blueBg, bd: C.blueBd, head: C.blue },
    { bg: C.redBg, bd: C.redBd, head: C.red }
  ];

  let body = '';
  steps.forEach((st, idx) => {
    const r = Math.floor(idx / perRow);
    const c = idx % perRow;
    const x = padX + c * (boxW + gapX);
    const y = startY + r * (boxH + rowGap);
    const pal = palettes[idx % palettes.length];
    const headTxt = st.badge || ('STEP ' + (idx + 1));
    const titleLines = wrapLines(st.title, Math.max(8, Math.floor((boxW - 18) / 13)));
    const descLines = wrapLines(st.desc, Math.max(10, Math.floor((boxW - 18) / 11)));

    body += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="10" fill="${pal.bg}" stroke="${pal.bd}" stroke-width="1.3"/>`;
    body += `<rect x="${x + 10}" y="${y + 10}" width="${Math.min(boxW - 20, Math.max(54, headTxt.length * 8 + 16))}" height="20" rx="10" fill="${pal.head}"/>`;
    body += `<text x="${x + 10 + Math.min(boxW - 20, Math.max(54, headTxt.length * 8 + 16)) / 2}" y="${y + 23.5}" font-size="10.5" font-weight="700" fill="#fff" text-anchor="middle">${esc(headTxt)}</text>`;
    body += renderLines(x + 12, y + 48, titleLines.slice(0, 2), 12.5, C.navy, 'start', '700', 1.28);
    body += renderLines(x + 12, y + (titleLines.length > 1 ? 78 : 66), descLines.slice(0, 2), 11, C.slate, 'start', '400', 1.32);

    if (idx < steps.length - 1) {
      if (c < perRow - 1) {
        const ax1 = x + boxW + 2;
        const ax2 = x + boxW + gapX - 2;
        const ay = y + boxH / 2;
        body += `<line x1="${ax1}" y1="${ay}" x2="${ax2}" y2="${ay}" stroke="${C.navy2}" stroke-width="2" marker-end="url(#arr-${id})"/>`;
      } else if (rows === 2 && r === 0) {
        const ax = x + boxW / 2;
        const ay1 = y + boxH + 2;
        const ay2 = y + boxH + rowGap / 2;
        const nx = padX + boxW / 2;
        const ny2 = startY + boxH + rowGap - 2;
        body += `<path d="M${ax},${ay1} V${ay2} H${nx} V${ny2}" fill="none" stroke="${C.goldLine}" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#arrg-${id})"/>`;
      }
    }
  });

  if (footer) {
    const fy = h - footerH - 10;
    body += `<rect x="${padX}" y="${fy}" width="${w - padX * 2}" height="${footerH - 4}" rx="8" fill="${C.goldBg}" stroke="${C.goldBd}" stroke-width="1.2"/>`;
    body += `<text x="${padX + 12}" y="${fy + 23}" font-size="11.5" font-weight="600" fill="${C.navy}">✦ ${esc(footer)}</text>`;
  }

  return frameSvg(id, w, h, title, subtitle, body, caption);
}

/* 2. Side-by-side comparison */
function compareSvg(id, title, subtitle, left, right, footer, caption) {
  const w = 680;
  const maxItems = Math.max(left.items.length, right.items.length);
  const itemH = 34;
  const boxH = 44 + maxItems * itemH + 14;
  const startY = 74;
  const footerH = footer ? 42 : 0;
  const h = startY + boxH + (footer ? 16 + footerH : 18);
  const boxW = 308;

  function col(x, spec, pal) {
    let s = `<rect x="${x}" y="${startY}" width="${boxW}" height="${boxH}" rx="10" fill="${pal.bg}" stroke="${pal.bd}" stroke-width="1.4"/>`;
    s += `<path d="M${x + 10},${startY} H${x + boxW - 10} Q${x + boxW},${startY} ${x + boxW},${startY + 10} V${startY + 38} H${x} V${startY + 10} Q${x},${startY} ${x + 10},${startY} Z" fill="${pal.head}"/>`;
    s += `<text x="${x + 14}" y="${startY + 24}" font-size="13" font-weight="700" fill="#fff">${esc(spec.title)}</text>`;
    spec.items.forEach((it, i) => {
      const iy = startY + 54 + i * itemH;
      s += `<rect x="${x + 10}" y="${iy - 11}" width="${boxW - 20}" height="${itemH - 6}" rx="6" fill="#ffffff" stroke="${pal.bd}" stroke-width="0.9"/>`;
      s += `<text x="${x + 20}" y="${iy + 6}" font-size="11.5" font-weight="700" fill="${pal.head}">${esc(it.k)}</text>`;
      if (it.v) {
        s += `<text x="${x + boxW - 18}" y="${iy + 6}" font-size="11" fill="${C.slate}" text-anchor="end">${esc(it.v)}</text>`;
      }
    });
    return s;
  }

  const pL = left.palette || { bg: C.blueBg, bd: C.blueBd, head: C.navy2 };
  const pR = right.palette || { bg: C.greenBg, bd: C.greenBd, head: C.green };

  let body = col(18, left, pL) + col(354, right, pR);
  body += `<circle cx="340" cy="${startY + boxH / 2}" r="15" fill="${C.navy}" stroke="${C.goldLine}" stroke-width="1.8"/>`;
  body += `<text x="340" y="${startY + boxH / 2 + 4}" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">VS</text>`;

  if (footer) {
    const fy = h - footerH - 10;
    body += `<rect x="18" y="${fy}" width="${w - 36}" height="${footerH - 4}" rx="8" fill="${C.goldBg}" stroke="${C.goldBd}" stroke-width="1.2"/>`;
    body += `<text x="30" y="${fy + 23}" font-size="11.5" font-weight="600" fill="${C.navy}">✦ ${esc(footer)}</text>`;
  }

  return frameSvg(id, w, h, title, subtitle, body, caption);
}

/* 3. Matrix / Concept Grid (2x2, 2x3, or 3x2) */
function matrixSvg(id, title, subtitle, cards, cols, footer, caption) {
  const w = 680;
  const padX = 18;
  const gap = 14;
  const rows = Math.ceil(cards.length / cols);
  const boxW = Math.floor((w - padX * 2 - gap * (cols - 1)) / cols);
  const boxH = 104;
  const startY = 74;
  const footerH = footer ? 42 : 0;
  const h = startY + rows * boxH + (rows - 1) * gap + (footer ? 16 + footerH : 18);

  const pals = [
    { bg: C.blueBg, bd: C.blueBd, head: C.navy2 },
    { bg: C.goldBg, bd: C.goldBd, head: C.gold },
    { bg: C.greenBg, bd: C.greenBd, head: C.green },
    { bg: C.redBg, bd: C.redBd, head: C.red },
    { bg: C.purpleBg, bd: C.purpleBd, head: C.purple },
    { bg: C.blueBg, bd: C.blueBd, head: C.blue }
  ];

  let body = '';
  cards.forEach((cd, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = padX + c * (boxW + gap);
    const y = startY + r * (boxH + gap);
    const pal = cd.pal || pals[i % pals.length];
    body += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="10" fill="${pal.bg}" stroke="${pal.bd}" stroke-width="1.3"/>`;
    body += `<path d="M${x + 10},${y} H${x + boxW - 10} Q${x + boxW},${y} ${x + boxW},${y + 10} V${y + 32} H${x} V${y + 10} Q${x},${y} ${x + 10},${y} Z" fill="${pal.head}"/>`;
    body += `<text x="${x + 12}" y="${y + 21}" font-size="12" font-weight="700" fill="#fff">${esc(cd.title)}</text>`;
    const lns = cd.lines || wrapLines(cd.desc || '', Math.max(12, Math.floor((boxW - 22) / 11.2)));
    body += renderLines(x + 12, y + 51, lns.slice(0, 3), 11.2, C.navy, 'start', '500', 1.45);
  });

  if (footer) {
    const fy = h - footerH - 10;
    body += `<rect x="${padX}" y="${fy}" width="${w - padX * 2}" height="${footerH - 4}" rx="8" fill="${C.goldBg}" stroke="${C.goldBd}" stroke-width="1.2"/>`;
    body += `<text x="${padX + 12}" y="${fy + 23}" font-size="11.5" font-weight="600" fill="${C.navy}">✦ ${esc(footer)}</text>`;
  }

  return frameSvg(id, w, h, title, subtitle, body, caption);
}

/* 4. Cycle / Closed-Loop Diagram */
function cycleSvg(id, title, subtitle, nodes, centerTop, centerBot, footer, caption) {
  const w = 680;
  const cx = 340, cy = 192;
  const rx = 228, ry = 104;
  const footerH = footer ? 42 : 0;
  const h = 336 + (footer ? footerH + 8 : 0);

  let body = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.goldBd}" stroke-width="2" stroke-dasharray="6 5"/>`;
  body += `<circle cx="${cx}" cy="${cy}" r="58" fill="${C.navy}" stroke="${C.goldLine}" stroke-width="2.5"/>`;
  body += `<text x="${cx}" y="${cy - 4}" font-size="13.5" font-weight="700" fill="#fff" text-anchor="middle">${esc(centerTop)}</text>`;
  body += `<text x="${cx}" y="${cy + 16}" font-size="11" fill="#e5d3a3" text-anchor="middle">${esc(centerBot)}</text>`;

  const n = nodes.length;
  nodes.forEach((nd, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const x = cx + rx * Math.cos(ang);
    const y = cy + ry * Math.sin(ang);
    const bw = 128, bh = 46;
    body += `<rect x="${(x - bw / 2).toFixed(1)}" y="${(y - bh / 2).toFixed(1)}" width="${bw}" height="${bh}" rx="9" fill="#ffffff" stroke="${C.navy2}" stroke-width="1.5"/>`;
    body += `<circle cx="${(x - bw / 2 + 15).toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="${C.navy2}"/>`;
    body += `<text x="${(x - bw / 2 + 15).toFixed(1)}" y="${(y + 4).toFixed(1)}" font-size="10.5" font-weight="700" fill="#fff" text-anchor="middle">${i + 1}</text>`;
    body += `<text x="${(x - bw / 2 + 31).toFixed(1)}" y="${(y - 3).toFixed(1)}" font-size="11.5" font-weight="700" fill="${C.navy}">${esc(nd.t)}</text>`;
    body += `<text x="${(x - bw / 2 + 31).toFixed(1)}" y="${(y + 13).toFixed(1)}" font-size="10" fill="${C.muted}">${esc(nd.s || '')}</text>`;
  });

  if (footer) {
    const fy = h - footerH - 8;
    body += `<rect x="18" y="${fy}" width="${w - 36}" height="${footerH - 4}" rx="8" fill="${C.goldBg}" stroke="${C.goldBd}" stroke-width="1.2"/>`;
    body += `<text x="30" y="${fy + 23}" font-size="11.5" font-weight="600" fill="${C.navy}">✦ ${esc(footer)}</text>`;
  }

  return frameSvg(id, w, h, title, subtitle, body, caption);
}

/* =====================================================================
 * CUSTOM HIGH-VALUE VISUAL DIAGRAMS (Coordinates, Trees, Waterfalls)
 * ===================================================================== */

function diagramAccountingW2() {
  const id = 'acc-w2-deadclic';
  const body =
    // Equation bar
    `<rect x="18" y="70" width="644" height="44" rx="9" fill="${C.goldBg}" stroke="${C.goldLine}" stroke-width="1.5"/>` +
    `<text x="340" y="97" font-size="15" font-weight="700" fill="${C.navy}" text-anchor="middle">Assets (资产)  =  Liabilities (负债)  +  Owner's Equity (所有者权益)  +  Income − Expenses</text>` +
    // Left box: Dr increases (DEAD)
    `<rect x="18" y="128" width="312" height="162" rx="10" fill="${C.blueBg}" stroke="${C.blueBd}" stroke-width="1.5"/>` +
    `<rect x="18" y="128" width="312" height="34" rx="10" fill="${C.navy2}"/>` +
    `<text x="174" y="150" font-size="13.5" font-weight="700" fill="#fff" text-anchor="middle">借方增加 Dr ↑  |  口诀：D · E · A</text>` +
    `<text x="34" y="186" font-size="12.5" font-weight="700" fill="${C.navy}">• Drawings（提款）</text><text x="314" y="186" font-size="11.5" fill="${C.blue}" text-anchor="end">Dr ↑ / Cr ↓</text>` +
    `<text x="34" y="216" font-size="12.5" font-weight="700" fill="${C.navy}">• Expenses（费用）</text><text x="314" y="216" font-size="11.5" fill="${C.blue}" text-anchor="end">Dr ↑ / Cr ↓</text>` +
    `<text x="34" y="246" font-size="12.5" font-weight="700" fill="${C.navy}">• Assets（资产）</text><text x="314" y="246" font-size="11.5" fill="${C.blue}" text-anchor="end">Dr ↑ / Cr ↓</text>` +
    `<text x="34" y="276" font-size="11" fill="${C.slate}">正常余额在左边（Debit Balance）</text>` +
    // Right box: Cr increases (CLIC)
    `<rect x="350" y="128" width="312" height="162" rx="10" fill="${C.greenBg}" stroke="${C.greenBd}" stroke-width="1.5"/>` +
    `<rect x="350" y="128" width="312" height="34" rx="10" fill="${C.green}"/>` +
    `<text x="506" y="150" font-size="13.5" font-weight="700" fill="#fff" text-anchor="middle">贷方增加 Cr ↑  |  口诀：L · I · C</text>` +
    `<text x="366" y="186" font-size="12.5" font-weight="700" fill="${C.navy}">• Liabilities（负债）</text><text x="646" y="186" font-size="11.5" fill="${C.green}" text-anchor="end">Cr ↑ / Dr ↓</text>` +
    `<text x="366" y="216" font-size="12.5" font-weight="700" fill="${C.navy}">• Income / Revenue（收入）</text><text x="646" y="216" font-size="11.5" fill="${C.green}" text-anchor="end">Cr ↑ / Dr ↓</text>` +
    `<text x="366" y="246" font-size="12.5" font-weight="700" fill="${C.navy}">• Capital / Equity（资本）</text><text x="646" y="246" font-size="11.5" fill="${C.green}" text-anchor="end">Cr ↑ / Dr ↓</text>` +
    `<text x="366" y="276" font-size="11" fill="${C.slate}">正常余额在右边（Credit Balance）</text>` +
    // Balance rule
    `<rect x="18" y="302" width="644" height="32" rx="7" fill="#ffffff" stroke="${C.bd}"/>` +
    `<text x="340" y="322" font-size="12" font-weight="700" fill="${C.navy}" text-anchor="middle">黄金检验：每一笔交易必须同时满足 Σ Debit = Σ Credit，且会计等式左右恒等</text>`;
  return frameSvg(id, 680, 346, '复式记账核心速查图：会计等式与 DEAD / CLIC 借贷方向', 'Unit 3 · Double-Entry Bookkeeping & Debit/Credit Rules', body, '图解：DEAD（借方增加）与 CLIC（贷方增加）规则对照，写每笔分录前先判要素再判增减。');
}

function diagramAccountingW8() {
  const id = 'acc-w8-is-waterfall';
  const body =
    // Waterfall bars
    `<rect x="44" y="88" width="110" height="170" rx="6" fill="${C.navy2}"/>` +
    `<text x="99" y="176" font-size="12.5" font-weight="700" fill="#fff" text-anchor="middle">Net Sales</text>` +
    `<text x="99" y="194" font-size="11" fill="#dbe9f8" text-anchor="middle">净销售收入</text>` +
    `<text x="99" y="80" font-size="11.5" font-weight="700" fill="${C.navy}" text-anchor="middle">100%</text>` +

    `<rect x="186" y="88" width="102" height="72" rx="6" fill="${C.red}"/>` +
    `<text x="237" y="122" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">− COGS</text>` +
    `<text x="237" y="139" font-size="10.5" fill="#fde3e0" text-anchor="middle">销货成本</text>` +
    `<line x1="154" y1="88" x2="186" y2="88" stroke="${C.muted}" stroke-dasharray="3 3"/>` +

    `<rect x="320" y="160" width="104" height="98" rx="6" fill="${C.goldLine}"/>` +
    `<text x="372" y="206" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">Gross Profit</text>` +
    `<text x="372" y="224" font-size="10.5" fill="#fff8e6" text-anchor="middle">毛利润</text>` +
    `<line x1="288" y1="160" x2="320" y2="160" stroke="${C.muted}" stroke-dasharray="3 3"/>` +

    `<rect x="454" y="160" width="90" height="56" rx="6" fill="#d97757"/>` +
    `<text x="499" y="186" font-size="11.5" font-weight="700" fill="#fff" text-anchor="middle">− OpEx</text>` +
    `<text x="499" y="202" font-size="10" fill="#fff3ee" text-anchor="middle">营业费用</text>` +
    `<line x1="424" y1="160" x2="454" y2="160" stroke="${C.muted}" stroke-dasharray="3 3"/>` +

    `<rect x="574" y="216" width="84" height="42" rx="6" fill="${C.green}"/>` +
    `<text x="616" y="236" font-size="11.5" font-weight="700" fill="#fff" text-anchor="middle">Net Profit</text>` +
    `<text x="616" y="251" font-size="10" fill="#d9f3e6" text-anchor="middle">净利润</text>` +
    `<line x1="544" y1="216" x2="574" y2="216" stroke="${C.muted}" stroke-dasharray="3 3"/>` +

    `<line x1="24" y1="258" x2="664" y2="258" stroke="${C.navy}" stroke-width="1.5"/>` +
    `<rect x="18" y="274" width="644" height="42" rx="8" fill="${C.goldBg}" stroke="${C.goldBd}"/>` +
    `<text x="340" y="292" font-size="11.5" font-weight="700" fill="${C.navy}" text-anchor="middle">COGS = Opening Inventory + Net Purchases − Closing Inventory（商贸企业必考公式）</text>` +
    `<text x="340" y="309" font-size="11" fill="${C.slate}" text-anchor="middle">注意：提款 Drawings 和买设备 Assets 绝不进利润表！</text>`;
  return frameSvg(id, 680, 328, '多步式利润表（Income Statement）瀑布结构图', 'Unit 8 · From Net Sales to Net Profit (For the period ended ...)', body, '图解：利润表展示一段时期内的盈利路径，最终净利润结转入所有者权益。');
}

function diagramAccountingW9() {
  const id = 'acc-w9-linkage';
  const body =
    // Box 1: Income Statement
    `<rect x="18" y="76" width="194" height="148" rx="10" fill="${C.blueBg}" stroke="${C.blueBd}" stroke-width="1.4"/>` +
    `<rect x="18" y="76" width="194" height="32" rx="10" fill="${C.navy2}"/>` +
    `<text x="115" y="97" font-size="12.5" font-weight="700" fill="#fff" text-anchor="middle">① Income Statement</text>` +
    `<text x="30" y="130" font-size="11.5" fill="${C.navy}">Revenue（收入）</text>` +
    `<text x="30" y="152" font-size="11.5" fill="${C.navy}">− Expenses（费用）</text>` +
    `<rect x="30" y="170" width="170" height="36" rx="7" fill="${C.greenBg}" stroke="${C.greenBd}"/>` +
    `<text x="115" y="193" font-size="12" font-weight="700" fill="${C.green}" text-anchor="middle">= Net Profit（净利润）</text>` +

    // Arrow 1 -> 2
    `<line x1="212" y1="188" x2="242" y2="148" stroke="${C.goldLine}" stroke-width="2.2" marker-end="url(#arrg-${id})"/>` +

    // Box 2: Owner's Equity
    `<rect x="244" y="76" width="192" height="148" rx="10" fill="${C.goldBg}" stroke="${C.goldBd}" stroke-width="1.4"/>` +
    `<rect x="244" y="76" width="192" height="32" rx="10" fill="${C.gold}"/>` +
    `<text x="340" y="97" font-size="12.5" font-weight="700" fill="#fff" text-anchor="middle">② Statement of Equity</text>` +
    `<text x="256" y="128" font-size="11.5" fill="${C.navy}">Opening Capital（期初）</text>` +
    `<text x="256" y="148" font-size="11.5" font-weight="700" fill="${C.green}">+ Net Profit（转入）</text>` +
    `<text x="256" y="168" font-size="11.5" fill="${C.red}">− Drawings（提款）</text>` +
    `<rect x="256" y="178" width="168" height="32" rx="7" fill="#fff" stroke="${C.goldLine}"/>` +
    `<text x="340" y="199" font-size="12" font-weight="700" fill="${C.navy}" text-anchor="middle">= Closing Capital</text>` +

    // Arrow 2 -> 3
    `<line x1="436" y1="194" x2="466" y2="194" stroke="${C.goldLine}" stroke-width="2.2" marker-end="url(#arrg-${id})"/>` +

    // Box 3: Balance Sheet
    `<rect x="468" y="76" width="194" height="148" rx="10" fill="${C.greenBg}" stroke="${C.greenBd}" stroke-width="1.4"/>` +
    `<rect x="468" y="76" width="194" height="32" rx="10" fill="${C.green}"/>` +
    `<text x="565" y="97" font-size="12.5" font-weight="700" fill="#fff" text-anchor="middle">③ Balance Sheet (As at)</text>` +
    `<text x="480" y="128" font-size="11.5" font-weight="700" fill="${C.navy}">Assets: CA + NCA</text>` +
    `<text x="480" y="150" font-size="11.5" fill="${C.slate}">− Liabilities: CL + NCL</text>` +
    `<line x1="480" y1="164" x2="650" y2="164" stroke="${C.greenBd}"/>` +
    `<text x="480" y="185" font-size="11.5" font-weight="700" fill="${C.green}">= Net Assets</text>` +
    `<text x="480" y="205" font-size="11.5" font-weight="700" fill="${C.navy}">= Closing Equity ✓</text>` +

    `<rect x="18" y="238" width="644" height="36" rx="8" fill="#ffffff" stroke="${C.bd}"/>` +
    `<text x="340" y="260" font-size="11.5" font-weight="600" fill="${C.navy}" text-anchor="middle">记忆要点：利润表是「视频（For the year ended）」，资产负债表是「照片（As at 30 June）」。</text>`;
  return frameSvg(id, 680, 288, '三大核心财务报表勾稽关系图（Statement Linkage）', 'Unit 9 · Balance Sheet Classification & Net Assets = Owner\'s Equity', body, '图解：利润表算出 Net Profit → 权益变动表算出 Closing Capital → 填入资产负债表配平。');
}

function diagramEconW1CircularFlow() {
  const id = 'eco-w1-circflow';
  const body =
    // Households & Firms
    `<rect x="26" y="128" width="166" height="86" rx="12" fill="${C.blueBg}" stroke="${C.navy2}" stroke-width="1.8"/>` +
    `<text x="109" y="160" font-size="14" font-weight="700" fill="${C.navy}" text-anchor="middle">Households</text>` +
    `<text x="109" y="180" font-size="12" fill="${C.slate}" text-anchor="middle">居民部门</text>` +
    `<text x="109" y="200" font-size="10.5" fill="${C.muted}" text-anchor="middle">拥有要素 · 消费商品</text>` +

    `<rect x="488" y="128" width="166" height="86" rx="12" fill="${C.greenBg}" stroke="${C.green}" stroke-width="1.8"/>` +
    `<text x="571" y="160" font-size="14" font-weight="700" fill="${C.navy}" text-anchor="middle">Firms</text>` +
    `<text x="571" y="180" font-size="12" fill="${C.slate}" text-anchor="middle">企业部门</text>` +
    `<text x="571" y="200" font-size="10.5" fill="${C.muted}" text-anchor="middle">雇用要素 · 生产供给</text>` +

    // Top arcs: Resource market (generous spacing, zero text collision)
    `<path d="M192,138 C255,68 425,68 486,138" fill="none" stroke="${C.navy2}" stroke-width="2.2" marker-end="url(#arr-${id})"/>` +
    `<rect x="208" y="69" width="264" height="22" rx="11" fill="#ffffff" stroke="${C.blueBd}"/>` +
    `<text x="340" y="84" font-size="11" font-weight="700" fill="${C.navy}" text-anchor="middle">生产要素（Land / Labour / Capital / Ent.）</text>` +

    `<path d="M486,158 C420,122 260,122 194,158" fill="none" stroke="${C.goldLine}" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arrg-${id})"/>` +
    `<rect x="218" y="119" width="244" height="22" rx="11" fill="#fffdf7" stroke="${C.goldBd}"/>` +
    `<text x="340" y="134" font-size="10.8" font-weight="600" fill="${C.gold}" text-anchor="middle">要素报酬（Rent / Wages / Interest / Profit）</text>` +

    // Bottom arcs: Product market
    `<path d="M194,186 C260,222 420,222 486,186" fill="none" stroke="${C.goldLine}" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arrg-${id})"/>` +
    `<rect x="230" y="202" width="220" height="22" rx="11" fill="#fffdf7" stroke="${C.goldBd}"/>` +
    `<text x="340" y="217" font-size="10.8" font-weight="600" fill="${C.gold}" text-anchor="middle">消费支出（Consumption Expenditure）</text>` +

    `<path d="M486,204 C425,274 255,274 194,204" fill="none" stroke="${C.green}" stroke-width="2.2" marker-end="url(#arr-${id})"/>` +
    `<rect x="228" y="249" width="224" height="22" rx="11" fill="#ffffff" stroke="${C.greenBd}"/>` +
    `<text x="340" y="264" font-size="11" font-weight="700" fill="${C.green}" text-anchor="middle">最终商品与服务（Goods &amp; Services）</text>` +

    `<rect x="18" y="286" width="644" height="34" rx="8" fill="${C.goldBg}" stroke="${C.goldBd}"/>` +
    `<text x="340" y="307" font-size="11.5" font-weight="600" fill="${C.navy}" text-anchor="middle">实线 = 实物要素/商品流向（Real Flow） · 虚线 = 货币收入/支出流向（Money Flow）</text>`;
  return frameSvg(id, 680, 332, '两部门经济循环流向图（Circular Flow of Income）', 'Unit 1 · Households, Firms & Four Factors of Production', body, '图解：稀缺资源在居民与企业之间循环配置，是微观与宏观经济学的总起点。');
}

function diagramEconElasticity() {
  const id = 'eco-w5-ped';
  const body =
    // Left mini plot: Elastic vs Inelastic
    `<rect x="18" y="72" width="300" height="206" rx="10" fill="#ffffff" stroke="${C.bd}"/>` +
    `<line x1="56" y1="244" x2="294" y2="244" stroke="${C.navy}" stroke-width="1.6"/>` +
    `<line x1="56" y1="244" x2="56" y2="92" stroke="${C.navy}" stroke-width="1.6"/>` +
    `<text x="48" y="96" font-size="11.5" font-weight="700" fill="${C.navy}" text-anchor="end">P</text>` +
    `<text x="298" y="248" font-size="11.5" font-weight="700" fill="${C.navy}">Q</text>` +
    // Perfectly inelastic (vertical)
    `<line x1="92" y1="104" x2="92" y2="236" stroke="${C.red}" stroke-width="2"/>` +
    `<text x="92" y="100" font-size="9.5" font-weight="700" fill="${C.red}" text-anchor="middle">PED=0</text>` +
    // Inelastic (steep)
    `<line x1="112" y1="106" x2="162" y2="236" stroke="${C.gold}" stroke-width="2.2"/>` +
    `<text x="150" y="138" font-size="10" font-weight="700" fill="${C.gold}">陡峭: |PED|&lt;1</text>` +
    // Elastic (flat)
    `<line x1="76" y1="172" x2="274" y2="218" stroke="${C.blue}" stroke-width="2.4"/>` +
    `<text x="230" y="196" font-size="10" font-weight="700" fill="${C.blue}">平缓: |PED|&gt;1</text>` +
    // Perfectly elastic (horizontal)
    `<line x1="66" y1="148" x2="278" y2="148" stroke="${C.green}" stroke-width="1.8" stroke-dasharray="5 3"/>` +
    `<text x="278" y="142" font-size="9.5" font-weight="700" fill="${C.green}" text-anchor="end">PED=∞</text>` +
    `<text x="174" y="268" font-size="11" fill="${C.muted}" text-anchor="middle">斜率越平缓 → 消费者对价格越敏感 → 弹性越大</text>` +

    // Right table: Total Revenue decision rule
    `<rect x="334" y="72" width="328" height="206" rx="10" fill="${C.blueBg}" stroke="${C.blueBd}"/>` +
    `<rect x="334" y="72" width="328" height="32" rx="10" fill="${C.navy2}"/>` +
    `<text x="498" y="93" font-size="12.5" font-weight="700" fill="#fff" text-anchor="middle">总收益检验法（Total Revenue = P × Q）</text>` +

    `<rect x="348" y="114" width="300" height="44" rx="7" fill="#fff" stroke="${C.blueBd}"/>` +
    `<text x="360" y="133" font-size="12" font-weight="700" fill="${C.blue}">富有弹性 |PED| &gt; 1（如奢侈品/可替代品）</text>` +
    `<text x="360" y="150" font-size="11" fill="${C.slate}">降价 P ↓ → 销量暴涨 → 总收益 TR ↑（薄利多销）</text>` +

    `<rect x="348" y="166" width="300" height="44" rx="7" fill="#fff" stroke="${C.goldBd}"/>` +
    `<text x="360" y="185" font-size="12" font-weight="700" fill="${C.gold}">缺乏弹性 |PED| &lt; 1（如必需品/胰岛素）</text>` +
    `<text x="360" y="202" font-size="11" fill="${C.slate}">涨价 P ↑ → 销量微降 → 总收益 TR ↑（提价增收）</text>` +

    `<rect x="348" y="218" width="300" height="44" rx="7" fill="#fff" stroke="${C.greenBd}"/>` +
    `<text x="360" y="237" font-size="12" font-weight="700" fill="${C.green}">单位弹性 |PED| = 1</text>` +
    `<text x="360" y="254" font-size="11" fill="${C.slate}">价格微调 → 总收益 TR 达到最大值且保持不变</text>`;
  return frameSvg(id, 680, 294, '需求价格弹性（PED）五类曲线与总收益（TR）定价矩阵', 'Unit 5 · PED = %ΔQd / %ΔP  |  Elastic vs Inelastic Pricing Strategy', body, '图解：考试高频题——给弹性判断涨价还是降价能增加企业总收益 TR。');
}

function diagramCompW10Refs() {
  const id = 'comp-w10-cellrefs';
  const body =
    `<rect x="18" y="72" width="204" height="172" rx="10" fill="${C.blueBg}" stroke="${C.blueBd}" stroke-width="1.4"/>` +
    `<rect x="18" y="72" width="204" height="32" rx="10" fill="${C.navy2}"/>` +
    `<text x="120" y="93" font-size="12.5" font-weight="700" fill="#fff" text-anchor="middle">相对引用 Relative: A1</text>` +
    `<text x="120" y="128" font-size="19" font-weight="700" fill="${C.navy}" text-anchor="middle">=A1 * B1</text>` +
    `<text x="32" y="158" font-size="11.5" fill="${C.slate}">• 向下填充：行号变 → A2*B2</text>` +
    `<text x="32" y="180" font-size="11.5" fill="${C.slate}">• 向右填充：列标变 → B1*C1</text>` +
    `<text x="32" y="214" font-size="11" font-weight="700" fill="${C.blue}">场景：每行单价×数量算小计</text>` +

    `<rect x="238" y="72" width="204" height="172" rx="10" fill="${C.goldBg}" stroke="${C.goldLine}" stroke-width="1.6"/>` +
    `<rect x="238" y="72" width="204" height="32" rx="10" fill="${C.gold}"/>` +
    `<text x="340" y="93" font-size="12.5" font-weight="700" fill="#fff" text-anchor="middle">绝对引用 Absolute: $A$1</text>` +
    `<text x="340" y="128" font-size="19" font-weight="700" fill="${C.gold}" text-anchor="middle">=B2 * $E$1</text>` +
    `<text x="252" y="158" font-size="11.5" fill="${C.slate}">• 向下填充：$E$1 锁死不动</text>` +
    `<text x="252" y="180" font-size="11.5" fill="${C.slate}">• 向右填充：$E$1 锁死不动</text>` +
    `<text x="252" y="214" font-size="11" font-weight="700" fill="${C.gold}">场景：固定税率/GST/汇率单元格</text>` +

    `<rect x="458" y="72" width="204" height="172" rx="10" fill="${C.greenBg}" stroke="${C.greenBd}" stroke-width="1.4"/>` +
    `<rect x="458" y="72" width="204" height="32" rx="10" fill="${C.green}"/>` +
    `<text x="560" y="93" font-size="12.5" font-weight="700" fill="#fff" text-anchor="middle">混合引用 Mixed: $A1 / A$1</text>` +
    `<text x="560" y="128" font-size="18" font-weight="700" fill="${C.green}" text-anchor="middle">=$A2 * B$1</text>` +
    `<text x="472" y="158" font-size="11.5" fill="${C.slate}">• $A2：锁列不锁行</text>` +
    `<text x="472" y="180" font-size="11.5" fill="${C.slate}">• B$1：锁行不锁列</text>` +
    `<text x="472" y="214" font-size="11" font-weight="700" fill="${C.green}">场景：二维乘法表 / 利率表</text>` +

    `<rect x="18" y="258" width="644" height="34" rx="8" fill="#ffffff" stroke="${C.bd}"/>` +
    `<text x="340" y="279" font-size="11.5" font-weight="700" fill="${C.navy}" text-anchor="middle">记忆口诀：$ 符号就是一把锁——锁在谁前面，复制公式时谁就绝对不动（Windows 按 F4 / Mac 按 Cmd+T 循环切换）</text>`;
  return frameSvg(id, 680, 304, 'Excel 单元格引用核心对比图（相对 / 绝对 / 混合引用）', 'T1 Week 10 · 机考最高频失分点：复制公式前先检查该锁哪一格', body, '图解：看懂 $ 锁行还是锁列，彻底避免下拉公式变成 #VALUE! 或错位。');
}

function diagramCompW11If() {
  const id = 'comp-w11-if';
  const body =
    // Formula header
    `<rect x="40" y="72" width="600" height="38" rx="8" fill="${C.goldBg}" stroke="${C.goldLine}" stroke-width="1.4"/>` +
    `<text x="340" y="96" font-size="14" font-weight="700" fill="${C.navy}" text-anchor="middle">=IF(  logical_test 条件判断 ,  value_if_true 成立返回 ,  value_if_false 不成立返回  )</text>` +
    // Diamond condition
    `<polygon points="340,124 446,164 340,204 234,164" fill="${C.blueBg}" stroke="${C.navy2}" stroke-width="1.8"/>` +
    `<text x="340" y="160" font-size="12.5" font-weight="700" fill="${C.navy}" text-anchor="middle">条件成立吗？</text>` +
    `<text x="340" y="177" font-size="11" fill="${C.blue}" text-anchor="middle">例如 Score &gt;= 50</text>` +
    // True branch (left)
    `<path d="M234,164 H134 V216" fill="none" stroke="${C.green}" stroke-width="2.2" marker-end="url(#arr-${id})"/>` +
    `<text x="176" y="156" font-size="11.5" font-weight="700" fill="${C.green}" text-anchor="middle">TRUE 成立</text>` +
    `<rect x="44" y="218" width="180" height="60" rx="10" fill="${C.greenBg}" stroke="${C.green}" stroke-width="1.5"/>` +
    `<text x="134" y="244" font-size="13" font-weight="700" fill="${C.green}" text-anchor="middle">返回第 2 参数</text>` +
    `<text x="134" y="264" font-size="11.5" fill="${C.slate}" text-anchor="middle">如 "Pass"（文字加双引号）</text>` +
    // False branch (right)
    `<path d="M446,164 H546 V216" fill="none" stroke="${C.red}" stroke-width="2.2" marker-end="url(#arr-${id})"/>` +
    `<text x="504" y="156" font-size="11.5" font-weight="700" fill="${C.red}" text-anchor="middle">FALSE 不成立</text>` +
    `<rect x="456" y="218" width="180" height="60" rx="10" fill="${C.redBg}" stroke="${C.red}" stroke-width="1.5"/>` +
    `<text x="546" y="244" font-size="13" font-weight="700" fill="${C.red}" text-anchor="middle">返回第 3 参数</text>` +
    `<text x="546" y="264" font-size="11.5" fill="${C.slate}" text-anchor="middle">如 "Fail" 或继续嵌套 IF</text>` +
    `<rect x="18" y="292" width="644" height="32" rx="7" fill="#fff" stroke="${C.bd}"/>` +
    `<text x="340" y="312" font-size="11.5" font-weight="600" fill="${C.navy}" text-anchor="middle">避坑：英文双引号 "" 只包文本，数字（如 0、100）和公式不加引号！</text>`;
  return frameSvg(id, 680, 336, 'Excel IF 条件函数分支决策流程图', 'T1 Week 11 · Logical Test → True Branch vs False Branch', body, '图解：IF 函数固定三段式结构，判断真假后二选一输出结果。');
}

function diagramCompW12Xlookup() {
  const id = 'comp-w12-xlookup';
  const body =
    `<rect x="24" y="72" width="632" height="36" rx="8" fill="${C.goldBg}" stroke="${C.goldLine}"/>` +
    `<text x="340" y="95" font-size="13" font-weight="700" fill="${C.navy}" text-anchor="middle">=XLOOKUP( ①找谁 lookup_value , ②在哪一列找 lookup_array , ③返回哪一列 return_array , [④找不到显示] )</text>` +

    // Left table: Lookup key
    `<rect x="24" y="126" width="146" height="128" rx="9" fill="${C.blueBg}" stroke="${C.blueBd}" stroke-width="1.4"/>` +
    `<text x="97" y="148" font-size="12" font-weight="700" fill="${C.navy}" text-anchor="middle">① 查找目标</text>` +
    `<rect x="44" y="166" width="106" height="36" rx="6" fill="#fff" stroke="${C.navy2}" stroke-width="1.5"/>` +
    `<text x="97" y="189" font-size="13" font-weight="700" fill="${C.navy}" text-anchor="middle">ID: P002</text>` +
    `<text x="97" y="226" font-size="10.5" fill="${C.muted}" text-anchor="middle">如单元格 A2</text>` +

    // Middle table: Lookup array + Return array
    `<rect x="218" y="126" width="248" height="128" rx="9" fill="#ffffff" stroke="${C.navy2}" stroke-width="1.4"/>` +
    `<rect x="218" y="126" width="124" height="28" rx="4" fill="${C.navy2}"/>` +
    `<text x="280" y="145" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">② lookup_array</text>` +
    `<rect x="342" y="126" width="124" height="28" rx="4" fill="${C.green}"/>` +
    `<text x="404" y="145" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">③ return_array</text>` +
    `<text x="280" y="172" font-size="11.5" fill="${C.muted}" text-anchor="middle">P001</text><text x="404" y="172" font-size="11.5" fill="${C.muted}" text-anchor="middle">$120</text>` +
    `<rect x="224" y="182" width="236" height="26" rx="5" fill="${C.goldBg}" stroke="${C.goldLine}"/>` +
    `<text x="280" y="199" font-size="12" font-weight="700" fill="${C.navy}" text-anchor="middle">P002 ✓ 命中</text><text x="404" y="199" font-size="12" font-weight="700" fill="${C.green}" text-anchor="middle">$280 → 取出</text>` +
    `<text x="280" y="228" font-size="11.5" fill="${C.muted}" text-anchor="middle">P003</text><text x="404" y="228" font-size="11.5" fill="${C.muted}" text-anchor="middle">$350</text>` +

    // Right box: Result
    `<rect x="512" y="126" width="144" height="128" rx="9" fill="${C.greenBg}" stroke="${C.green}" stroke-width="1.5"/>` +
    `<text x="584" y="148" font-size="12" font-weight="700" fill="${C.green}" text-anchor="middle">输出结果</text>` +
    `<rect x="532" y="166" width="104" height="36" rx="6" fill="#fff" stroke="${C.green}" stroke-width="1.5"/>` +
    `<text x="584" y="189" font-size="15" font-weight="700" fill="${C.green}" text-anchor="middle">$280</text>` +
    `<text x="584" y="226" font-size="10.5" fill="${C.slate}" text-anchor="middle">找不到时返回④提示</text>` +

    `<line x1="170" y1="194" x2="216" y2="194" stroke="${C.navy2}" stroke-width="2" marker-end="url(#arr-${id})"/>` +
    `<line x1="466" y1="194" x2="510" y2="194" stroke="${C.green}" stroke-width="2" marker-end="url(#arr-${id})"/>` +
    `<rect x="24" y="268" width="632" height="32" rx="7" fill="#fff" stroke="${C.bd}"/>` +
    `<text x="340" y="288" font-size="11.5" font-weight="600" fill="${C.navy}" text-anchor="middle">必记两铁律：②③ 两个区域行数必须完全一致，且下拉复制时务必用 $ 锁死范围（如 $A$2:$A$50）！</text>`;
  return frameSvg(id, 680, 312, 'Excel XLOOKUP 精准查找数据映射图解', 'T1 Week 12 · 支持向左/向右双向查找，默认精确匹配', body, '图解：XLOOKUP 三步走——拿目标值去查找列定位行号，再从返回列同一行取出结果。');
}

function diagramEnglishW9ReportingVerbs() {
  const id = 'eng-w9-verbs';
  const body =
    // Spectrum bar
    `<defs><linearGradient id="spec-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#3b82f6"/><stop offset="50%" stop-color="#d97706"/><stop offset="100%" stop-color="#dc2626"/></linearGradient></defs>` +
    `<rect x="34" y="80" width="612" height="14" rx="7" fill="url(#spec-${id})"/>` +
    `<text x="34" y="112" font-size="11.5" font-weight="700" fill="${C.blue}">弱/谨慎 Tentative</text>` +
    `<text x="340" y="112" font-size="11.5" font-weight="700" fill="${C.gold}" text-anchor="middle">客观中性 Neutral</text>` +
    `<text x="646" y="112" font-size="11.5" font-weight="700" fill="${C.red}" text-anchor="end">强立场 Strong</text>` +

    // 3 columns
    `<rect x="24" y="128" width="198" height="122" rx="9" fill="${C.blueBg}" stroke="${C.blueBd}"/>` +
    `<text x="123" y="150" font-size="12" font-weight="700" fill="${C.blue}" text-anchor="middle">谨慎推测（留余地）</text>` +
    `<text x="40" y="174" font-size="12" fill="${C.navy}">• suggests that...</text>` +
    `<text x="40" y="196" font-size="12" fill="${C.navy}">• implies / speculates</text>` +
    `<text x="40" y="218" font-size="12" fill="${C.navy}">• proposes / hypothesises</text>` +
    `<text x="40" y="240" font-size="10.5" fill="${C.muted}">适合：证据初步、有争议观点</text>` +

    `<rect x="241" y="128" width="198" height="122" rx="9" fill="${C.goldBg}" stroke="${C.goldBd}"/>` +
    `<text x="340" y="150" font-size="12" font-weight="700" fill="${C.gold}" text-anchor="middle">客观陈述（最安全）</text>` +
    `<text x="257" y="174" font-size="12" fill="${C.navy}">• states / notes / observes</text>` +
    `<text x="257" y="196" font-size="12" fill="${C.navy}">• reports / describes</text>` +
    `<text x="257" y="218" font-size="12" fill="${C.navy}">• explains / points out</text>` +
    `<text x="257" y="240" font-size="10.5" fill="${C.muted}">适合：客观事实、研究数据</text>` +

    `<rect x="458" y="128" width="198" height="122" rx="9" fill="${C.redBg}" stroke="${C.redBd}"/>` +
    `<text x="557" y="150" font-size="12" font-weight="700" fill="${C.red}" text-anchor="middle">强烈主张（表态度）</text>` +
    `<text x="474" y="174" font-size="12" fill="${C.navy}">• argues / contends</text>` +
    `<text x="474" y="196" font-size="12" fill="${C.navy}">• demonstrates / proves</text>` +
    `<text x="474" y="218" font-size="12" fill="${C.navy}">• emphasises / insists</text>` +
    `<text x="474" y="240" font-size="10.5" fill="${C.muted}">适合：核心论点、强证据结论</text>` +

    `<rect x="24" y="264" width="632" height="34" rx="7" fill="#fff" stroke="${C.bd}"/>` +
    `<text x="340" y="285" font-size="11.5" font-weight="600" fill="${C.navy}" text-anchor="middle">学术写作提分法则：少用 "says / thinks"，按作者语气强度精准挑选转述动词 + 改写句式防抄袭。</text>`;
  return frameSvg(id, 680, 310, '学术转述动词（Reporting Verbs）立场强弱光谱图', 'Week 9 · AI in Education — 用精准动词展现批判性引用能力', body, '图解：根据原作者论证力度选择 Tentative / Neutral / Strong 三档转述动词。');
}

function diagramExtraM9Drawdown() {
  const id = 'ext-m9-drawdown';
  const pts = [
    { dd: '−10%', rec: '+11%', h1: 18, h2: 20 },
    { dd: '−20%', rec: '+25%', h1: 36, h2: 44 },
    { dd: '−30%', rec: '+43%', h1: 54, h2: 74 },
    { dd: '−50%', rec: '+100%', h1: 90, h2: 145 },
    { dd: '−75%', rec: '+300%', h1: 120, h2: 175 }
  ];
  let bars = `<line x1="48" y1="248" x2="640" y2="248" stroke="${C.navy}" stroke-width="1.5"/>`;
  pts.forEach((p, i) => {
    const x = 68 + i * 114;
    bars += `<rect x="${x}" y="${248 - p.h1}" width="36" height="${p.h1}" rx="4" fill="${C.blue}"/>`;
    bars += `<text x="${x + 18}" y="${242 - p.h1}" font-size="10.5" font-weight="700" fill="${C.blue}" text-anchor="middle">${p.dd}</text>`;
    bars += `<rect x="${x + 42}" y="${248 - p.h2}" width="36" height="${p.h2}" rx="4" fill="${C.red}"/>`;
    bars += `<text x="${x + 60}" y="${242 - p.h2}" font-size="10.5" font-weight="700" fill="${C.red}" text-anchor="middle">${p.rec}</text>`;
    bars += `<text x="${x + 39}" y="266" font-size="11" fill="${C.slate}" text-anchor="middle">回撤 ${p.dd.slice(1)}</text>`;
  });
  bars +=
    `<rect x="440" y="72" width="12" height="12" rx="2" fill="${C.blue}"/><text x="458" y="82" font-size="11" fill="${C.navy}">亏损幅度</text>` +
    `<rect x="526" y="72" width="12" height="12" rx="2" fill="${C.red}"/><text x="544" y="82" font-size="11" fill="${C.navy}">回本所需涨幅</text>` +
    `<rect x="18" y="280" width="644" height="34" rx="7" fill="${C.goldBg}" stroke="${C.goldBd}"/>` +
    `<text x="340" y="301" font-size="11.5" font-weight="700" fill="${C.navy}" text-anchor="middle">核心规律：亏损与回本极度不对称——腰斩（−50%）需翻倍（+100%）才能回本，因此控制最大回撤永远优先于追暴利。</text>`;
  return frameSvg(id, 680, 326, '最大回撤（Max Drawdown）与回本涨幅不对称图解', '投资基础 3 · 为什么巴菲特第一原则是「不要亏钱」', bars, '图解：亏损超过 30% 后回本难度呈指数级上升，必须靠分散与止损控制回撤。');
}

function diagramExtraM12Breakeven() {
  const id = 'ext-m12-bep';
  const body =
    `<rect x="24" y="70" width="388" height="214" rx="10" fill="#fff" stroke="${C.bd}"/>` +
    `<line x1="64" y1="252" x2="390" y2="252" stroke="${C.navy}" stroke-width="1.6"/>` +
    `<line x1="64" y1="252" x2="64" y2="86" stroke="${C.navy}" stroke-width="1.6"/>` +
    `<text x="58" y="92" font-size="11" font-weight="700" fill="${C.navy}" text-anchor="end">金额 $</text>` +
    `<text x="392" y="256" font-size="11" font-weight="700" fill="${C.navy}">销量 Q</text>` +
    // Shaded Loss & Profit zones
    `<polygon points="64,252 64,196 226,158" fill="${C.red}" fill-opacity="0.12"/>` +
    `<polygon points="226,158 378,94 378,122" fill="${C.green}" fill-opacity="0.16"/>` +
    // Fixed cost line
    `<line x1="64" y1="196" x2="378" y2="196" stroke="${C.muted}" stroke-width="1.5" stroke-dasharray="5 4"/>` +
    `<text x="374" y="191" font-size="10" fill="${C.muted}" text-anchor="end">固定成本 FC</text>` +
    // Total cost line
    `<line x1="64" y1="196" x2="378" y2="122" stroke="${C.red}" stroke-width="2.2"/>` +
    `<text x="374" y="138" font-size="10.5" font-weight="700" fill="${C.red}" text-anchor="end">总成本 TC</text>` +
    // Total revenue line
    `<line x1="64" y1="252" x2="378" y2="94" stroke="${C.green}" stroke-width="2.4"/>` +
    `<text x="374" y="92" font-size="10.5" font-weight="700" fill="${C.green}" text-anchor="end">总收入 TR</text>` +
    // Break-even dot & guides
    `<line x1="226" y1="158" x2="226" y2="252" stroke="${C.goldLine}" stroke-width="1.6" stroke-dasharray="4 3"/>` +
    `<circle cx="226" cy="158" r="5.5" fill="${C.goldLine}" stroke="${C.navy}" stroke-width="1.6"/>` +
    `<text x="226" y="268" font-size="11" font-weight="700" fill="${C.gold}" text-anchor="middle">回本销量 BEP</text>` +
    `<text x="128" y="216" font-size="11" font-weight="700" fill="${C.red}">亏损区</text>` +
    `<text x="320" y="114" font-size="11" font-weight="700" fill="${C.green}">盈利区</text>` +

    // Formula card on right
    `<rect x="426" y="70" width="236" height="214" rx="10" fill="${C.goldBg}" stroke="${C.goldBd}" stroke-width="1.4"/>` +
    `<rect x="426" y="70" width="236" height="32" rx="10" fill="${C.navy2}"/>` +
    `<text x="544" y="91" font-size="12.5" font-weight="700" fill="#fff" text-anchor="middle">回本点核心公式</text>` +
    `<rect x="440" y="114" width="208" height="52" rx="8" fill="#fff" stroke="${C.goldLine}"/>` +
    `<text x="544" y="136" font-size="12.5" font-weight="700" fill="${C.navy}" text-anchor="middle">BEP = 固定成本 FC</text>` +
    `<line x1="472" y1="143" x2="616" y2="143" stroke="${C.navy}" stroke-width="1.2"/>` +
    `<text x="544" y="159" font-size="12" font-weight="700" fill="${C.blue}" text-anchor="middle">单价 P − 单位变动成本 VC</text>` +
    `<text x="440" y="190" font-size="11.5" font-weight="700" fill="${C.navy}">• 分母 (P − VC) = 单位边际贡献</text>` +
    `<text x="440" y="212" font-size="11" fill="${C.slate}">  每多卖 1 件帮老板填补的房租/工资</text>` +
    `<text x="440" y="238" font-size="11.5" font-weight="700" fill="${C.green}">• 销量 &gt; BEP 后，每件的 (P − VC)</text>` +
    `<text x="440" y="258" font-size="11" fill="${C.slate}">  全部变成纯利润！</text>`;
  return frameSvg(id, 680, 298, '盈亏平衡点（Break-Even Point）成本—收入交叉图解', '商业定价与回本测算 · 什么时候生意才开始真正赚钱', body, '图解：总收入曲线 TR 与总成本曲线 TC 交点即盈亏平衡点，跨过之后进入盈利区。');
}

/* =====================================================================
 * DIAGRAM REGISTRY BY COURSE / TERM / WEEK
 * ===================================================================== */
function getBespokeDiagrams(courseId, termId, weekNum) {
  const key = `${courseId}:${termId}:${weekNum}`;
  switch (key) {
    /* ---------- ACCOUNTING (W2–W13) ---------- */
    case 'accounting:term1:2':
      return [diagramAccountingW2()];
    case 'accounting:term1:3':
      return [flowSvg('acc-w3-journal', '日记账分录（General Journal）四步编制流程', 'Unit 4 · 从原始商业凭证到标准分录与摘要（Narration）', [
        { badge: '1. 审凭证', title: '识别原始单据', desc: '看发票/收据判断交易日期、金额与现金/赊账' },
        { badge: '2. 定账户', title: '找出受影响账户', desc: '至少涉及 2 个账户，先判断属于五要素哪一类' },
        { badge: '3. 判借贷', title: '套用 DEAD/CLIC', desc: '借方写在上且靠左，贷方写在下且右缩进' },
        { badge: '4. 写摘要', title: '补 Narration 并核平', desc: '写明交易事由并核对借方总额 = 贷方总额' }
      ], '考试细节：日期、借贷缩进、括号内简明 Narration 都会单独给分！', '图解：标准 General Journal 编制四步法，防止漏写摘要或借贷反向。')];
    case 'accounting:term1:4':
      return [matrixSvg('acc-w4-adjusting', '期末四大调整分录（Adjusting Entries）全景速查矩阵', 'Unit 5 · 权责发生制（Accrual Basis）：收入与费用归属到「实际发生」的期间', [
        { title: '① 预付费用 Prepaid Expense', lines: ['先付钱、后受益（如预付保险/房租）', '期末调减资产、确认已耗费用：', 'Dr Expense / Cr Prepaid Asset'] },
        { title: '② 预收收入 Unearned Revenue', lines: ['先收钱、后干活（负债性质）', '期末按已提供服务转入收入：', 'Dr Unearned Rev / Cr Revenue'] },
        { title: '③ 应计费用 Accrued Expense', lines: ['已发生、期末还没付钱（如欠发工资）', '期末补记费用与应付负债：', 'Dr Expense / Cr Accrued Liability'] },
        { title: '④ 应计收入 Accrued Revenue', lines: ['已提供服务、期末还没收到钱', '期末补记应收资产与收入：', 'Dr Receivable / Cr Revenue'] }
      ], 2, '记忆铁律：每一笔调整分录「必含 1 个利润表账户 + 1 个资产负债表账户」，且永远不涉及 Cash！', '图解：期末四大调整分录对照表，一眼看穿先钱后事（Deferral）与先事后钱（Accrual）。')];
    case 'accounting:term1:5':
      return [flowSvg('acc-w5-ledger', '分类账过账（Posting）与 T 型账户结平（Balancing）图解', 'Unit 6 · 从 General Journal 过入 Ledger T-Accounts', [
        { badge: 'Step 1', title: '逐笔过账 Posting', desc: '日记账 Dr 记 T 账户左边，Cr 记右边，写对方科目名' },
        { badge: 'Step 2', title: '加总较重一侧', desc: '比较借贷两边合计数，以较大一侧作为双边总额' },
        { badge: 'Step 3', title: '填入 Balance c/d', desc: '在较小一侧补差额使两边相等（期末结转余额）' },
        { badge: 'Step 4', title: '下期开立 b/d', desc: '画双下划线后，在「较大一侧」下方写次月 Balance b/d' }
      ], '高频易错：c/d 写在较小那一边配平，下期期初 b/d 一定落在较大（正常余额）那一边！', '图解：T-Account 结平四步法，彻底搞懂 c/d（carried down）与 b/d（brought down）。')];
    case 'accounting:term1:6':
      return [matrixSvg('acc-w6-tb', '试算平衡表（Trial Balance）查不出的 6 类隐蔽错误', 'Unit 7 · 借贷总计相等 ≠ 记账完全正确（期末简答必考）', [
        { title: '1. 遗漏错误 Omission', lines: ['整笔交易完全漏记', '借贷同时少记 → 依然配平'] },
        { title: '2. 原理错误 Principle', lines: ['买电脑资产错记成费用', '大类归错但借贷额相等'] },
        { title: '3. 串户错误 Commission', lines: ['张先生应收错记成李先生', '同属资产类，借贷照样平'] },
        { title: '4. 原始金额 Original Entry', lines: ['发票 $540 借贷都错写成 $450', '两边同错，差额为 0'] },
        { title: '5. 借贷颠倒 Reversal', lines: ['本该 Dr Cash Cr Sales 写反了', '总额不变但方向全错'] },
        { title: '6. 抵消错误 Compensating', lines: ['一处多记 $50 另一处少记 $50', '两错巧合相互抵消'] }
      ], 3, '口诀记忆：OPCORC（漏、原、串、初、反、抵）——试算平衡只证明「算术借贷相等」，不代表无错！', '图解：试算平衡表的局限性——6 大隐蔽错误速记卡片。')];
    case 'accounting:term1:7':
      return [cycleSvg('acc-w7-cycle', '完整会计循环（The Accounting Cycle）七步闭环总览', '期中复习 · 把 Unit 1–Unit 7 所有环节串成一条线', [
        { t: '原始凭证', s: 'Source Docs' },
        { t: '日记账分录', s: 'Journal' },
        { t: '分类账过账', s: 'Ledger' },
        { t: '调整前试算', s: 'Unadj. TB' },
        { t: '期末调整', s: 'Adjusting' },
        { t: '调整后试算', s: 'Adj. TB' },
        { t: '三大财务报表', s: 'Statements' }
      ], '会计循环', 'Accounting Cycle', '期中复习抓主线：任何一道题都落在上面 7 步之一，先定位在哪一步再动笔。', '图解：会计循环七步闭环，串起期中前全部核心单元。')];
    case 'accounting:term1:8':
      return [diagramAccountingW8()];
    case 'accounting:term1:9':
      return [diagramAccountingW9()];
    case 'accounting:term1:10':
      return [matrixSvg('acc-w10-ratios', '四大财务比率分析（Financial Ratio Analysis）仪表盘', 'Unit 10 · 答题必须「算准数字 + 解释商业含义 + 给改善建议」', [
        { title: '盈利能力 Profitability', lines: ['Gross Profit Margin = GP / Sales', 'Net Profit Margin = NP / Sales', 'ROA / ROE：每 $1 资产或权益赚多少'] },
        { title: '短期偿债 Liquidity', lines: ['Current Ratio = CA / CL（约 1.5–2）', 'Quick Ratio = (CA − Inv) / CL', '衡量未来 12 个月能不能还上到期债'] },
        { title: '营运效率 Efficiency', lines: ['Inventory Turnover（存货周转天数）', 'Receivables Days（应收回款天数）', '天数越短，现金回笼越快'] },
        { title: '财务杠杆 Solvency / Gearing', lines: ['Debt Ratio = Total Liab / Total Assets', 'Debt-to-Equity = Liab / Equity', '比率过高意味着利息负担与违约风险大'] }
      ], 2, '高分答题模板：趋势变化（升/降）→ 背后的业务原因（如赊销放宽/存货积压）→ 具体管理建议。', '图解：财务比率四大维度核心公式与商业解读要点。')];
    case 'accounting:term1:11':
      return [flowSvg('acc-w11-cashflow', '现金流量表（Statement of Cash Flows）三大活动流向图', 'Unit 10 · 权责发生制净利润 ≠ 真正到手的现金', [
        { badge: '① 经营活动', title: 'Operating Activities', desc: '收客户货款、付供应商/工资/租金/税（造血能力核心）' },
        { badge: '② 投资活动', title: 'Investing Activities', desc: '买卖长期资产（设备、房产、长期股权投资）' },
        { badge: '③ 筹资活动', title: 'Financing Activities', desc: '股东增资/提款 Drawings、向银行借款与还本' },
        { badge: '最终核对', title: 'Net Cash Δ + 期初现金', desc: '等于资产负债表上的期末现金及现金等价物余额 ✓' }
      ], '避坑提醒：折旧（Depreciation）和赊销是非现金项目，绝不直接计入现金流量表（直接法）！', '图解：现金流量表三类现金流分类与期末现金勾稽关系。')];
    case 'accounting:term1:12':
      return [matrixSvg('acc-w12-rev', '会计期末闭卷总复习 · 题型权重与踩分地图', 'Week 12 Revision · 把有限精力精准押在最高频得分模块', [
        { title: '① 概念与惯例（简答）', lines: ['Entity / Accrual / Going Concern', 'Historical Cost / Conservatism', '必须结合题干案例解释，别只背定义'] },
        { title: '② 分录与期末调整', lines: ['普通分录 + 4 大调整分录 + 折旧', '写清日期、借贷缩进与 Narration', '每笔做完立刻口算 Dr = Cr'] },
        { title: '③ 利润表 + 资产负债表', lines: ['严格区分标题 For the year vs As at', '流动/非流动分组必须规范', 'Net Assets = Equity 必须配平'] },
        { title: '④ 比率分析与商业建议', lines: ['写出公式 → 代入数字 → 带单位/%', '对比两年趋势或行业均值', '提出可执行经营改进措施'] }
      ], 2, '考场铁律：遇到配不平的大题先标记跳过，保证后面概念题与比率题的稳拿分全部拿到！', '图解：会计期末复习四块核心板块与考场防丢分策略。')];
    case 'accounting:term1:13':
      return [flowSvg('acc-w13-exam', '会计模拟考场答题与防错核对四步流程', 'Week 13 Sample Exam · 模拟真实考试节奏', [
        { badge: '前 5 分钟', title: '通览卷面配时间', desc: '按分值分配分钟数（大约 1 分 ≈ 1.1 分钟）' },
        { badge: '做题中', title: '边写边做双校验', desc: '分录验 Dr=Cr；报表验标题日期与正负括号' },
        { badge: '卡壳时', title: '用假设数字推进', desc: '若前面算错，后面用正确方法仍拿过程分（Own Figure Rule）' },
        { badge: '最后 10 分钟', title: '专项查四大坑', desc: '查单位($/%)、查 Drawings 位置、查折旧符号、查漏题' }
      ], '重要得分技巧：UNSW 会计阅卷看重步骤分（Method Marks），算式清晰列出比只写结果安全得多。', '图解：模拟考场时间分配与防低级失误检查流程。')];

    /* ---------- ECONOMICS (3 missing weeks) ---------- */
    case 'economics:term1:1':
      return [
        flowSvg('eco-w1-scarcity', '经济学底层逻辑链：稀缺 → 选择 → 机会成本', 'Unit 1 · The Economic Problem（整门经济学的根本出发点）', [
          { badge: '根本矛盾', title: 'Scarcity 稀缺性', desc: '有限资源（4 大生产要素）vs 无限人类欲望' },
          { badge: '必然动作', title: 'Choice 选择', desc: '决定生产什么、怎么生产、为谁生产' },
          { badge: '隐性代价', title: 'Opportunity Cost', desc: '被放弃的「次优选择（Next Best Alternative）」的价值' },
          { badge: '图形表达', title: 'PPC 生产可能性曲线', desc: '线上=有效、线内=低效、外移=经济增长' }
        ], '微观经济学研究个体市场（消费者/企业），宏观经济学研究整体经济（GDP/通胀/失业）。', '图解：从稀缺性到机会成本的经济学核心推导链。'),
        diagramEconW1CircularFlow()
      ];
    case 'economics:term2:7':
      return [flowSvg('eco-t2w7-macro', '宏观经济政策传导总图：财政政策 & 货币政策 → AD 曲线', 'Term 2 Week 7 复习 · 宏观调控如何同时平衡增长、通胀与失业', [
        { badge: '财政政策', title: 'Fiscal Policy (政府)', desc: '扩张：增支出 G↑ / 减税 T↓；紧缩：G↓ / T↑' },
        { badge: '货币政策', title: 'Monetary Policy (RBA)', desc: '调现金利率 Cash Rate：降息刺激借贷消费与投资' },
        { badge: '核心枢纽', title: '总需求 AD = C+I+G+(X−M)', desc: '政策带动 C、I、G 或汇率变化，推动 AD 右移或左移' },
        { badge: '最终目标', title: '三大宏观目标权衡', desc: '实际 GDP 增长 ↑、失业率 ↓，但需警惕需求拉动通胀 ↑' }
      ], '答题必画图：写宏观政策题一定要先画 AD-AS 曲线移动方向，再逐环写出「政策工具 → AD 组成部分 → GDP/CPI/失业」链条。', '图解：财政与货币政策传导至宏观三大目标的完整链路。')];
    case 'economics:term1x:5':
      return [diagramEconElasticity()];

    /* ---------- MATHEMATICS (2 revision weeks) ---------- */
    case 'mathematics:term1:13':
      return [matrixSvg('math-t1w13-rev', 'Term 1 商业数学函数族与高频题型速查图谱', 'Week 13 考前综合复习 · 一眼识别题型与第一步起手式', [
        { title: '① 线性与市场均衡', lines: ['需求 Qd = a − bP，供给 Qs = c + dP', '联立 Qd = Qs 求均衡价格 P* 与销量 Q*', '盈亏平衡：TR = TC（利润 π = 0）'] },
        { title: '② 二次函数与最值', lines: ['顶点横坐标 x = −b / (2a)', '开口向下 (a<0) 求最大收益/利润', '判别式 Δ = b² − 4ac 判交点个数'] },
        { title: '③ 指数与对数方程', lines: ['复利 A = P(1 + r/n)^(nt)，连续 Pe^(rt)', '未知数在指数上 → 两边同时取 ln', '检验真数必须严格 > 0（定义域）'] },
        { title: '④ 定义域与图像解题', lines: ['分母 ≠ 0；偶次根号下 ≥ 0；ln 内 > 0', '分段函数看端点实心●/空心○', '结合官方讲义参考图核对交点'] }
      ], 2, '复习顺序：先过一遍上面 4 块起手式，再向下刷本周附带的 56 页官方课后题解核对细节！', '图解：Term 1 商业数学核心函数与经济应用题型地图。')];
    case 'mathematics:term2:14':
      return [flowSvg('math-t2w14-rev', 'Term 2 商业数学微积分与概率统计解题决策树', 'Exam Revision · 期末考场 10 秒定题型', [
        { badge: '微积分求极值', title: '导数 f\'(x) = 0', desc: '求边际 MR/MC、最大利润；用二阶导 f\'\'(x)<0 验极大值' },
        { badge: '微积分求面积', title: '定积分 ∫ f(x) dx', desc: '消费者剩余 CS / 生产者剩余 PS = 曲线间围成面积' },
        { badge: '集合与概率', title: 'Venn / Tree / 条件概率', desc: '画韦恩图或树状图，牢记 P(A|B) = P(A∩B)/P(B)' },
        { badge: '正态分布', title: '标准化 Z = (X − μ)/σ', desc: '先画钟形图阴影区域，再查标准正态表求面积概率' }
      ], '易错警示：面积/概率结果一定为非负数；求完临界点一定要做二阶导或一阶导符号检验！', '图解：Term 2 微积分与概率统计期末解题总路线。')];

    /* ---------- COMPUTING (ALL 26 WEEKS) ---------- */
    case 'computing:term1:1':
      return [flowSvg('comp-t1w1-ppt', 'PowerPoint 专业演示文稿制作标准四步流', 'T1 Week 1 · Beach Activity 演示设计与母版规范', [
        { badge: '1. 选版式', title: 'Slide Master 母版统一', desc: '先定主题配色、字体与页脚，避免逐页手动乱调' },
        { badge: '2. 控图文', title: '精炼要点 + 高清配图', desc: '每页聚焦 1 个核心信息，用留白代替大段文字' },
        { badge: '3. 加动效', title: '克制切换与对齐', desc: '对齐参考线 + 统一过渡动画（Transition）' },
        { badge: '4. 导出交', title: '桌面版检查并导出 PDF', desc: '务必使用本地安装版 PowerPoint 检查排版再提交' }
      ], '避坑：Web 网页版 PowerPoint 缺少大量母版和高级动画选项，作业必须用桌面客户端完成。', '图解：PowerPoint 从母版设计到导出提交的标准工作流。')];
    case 'computing:term1:2':
      return [flowSvg('comp-t1w2-word', 'MS Word 结构化长文档排版核心架构', 'T1 Week 2 · 用样式（Styles）驱动自动目录而非手敲空格', [
        { badge: '样式体系', title: 'Heading 1 / 2 / 3', desc: '所有章节标题必须套用内置样式，不要手动加粗放大' },
        { badge: '段落控制', title: '段距与分页符', desc: '用段前/段后间距与 Page Break，严禁连敲回车空行' },
        { badge: '自动目录', title: 'References → TOC', desc: '一键生成自动目录，改完正文只需 Update Field' },
        { badge: '小组协作', title: 'PPT 项目分工对齐', desc: '统一文件命名、素材共享文件夹与截止时间节点' }
      ], '核心思维：在 Word 里「结构（样式）」与「外观（主题）」分离，改一处即可全局生效。', '图解：Word 专业排版与自动目录生成逻辑。')];
    case 'computing:term1:3':
      return [matrixSvg('comp-t1w3-hw', '计算机硬件组成与互联网访问链路图解', 'T1 Week 3 · Understanding Computers & The Internet', [
        { title: 'CPU 中央处理器', lines: ['大脑：控制单元 CU + 运算器 ALU', '执行「取指 → 译码 → 执行」循环'] },
        { title: 'RAM 内存 vs Storage 硬盘', lines: ['RAM：断电即失、速度极快（运行中）', 'SSD/HDD：长期永久保存文件数据'] },
        { title: 'Input / Output 外设', lines: ['输入：键盘、鼠标、麦克风、扫描仪', '输出：显示器、打印机、扬声器'] },
        { title: '互联网 DNS → HTTP 链路', lines: ['输入网址 → DNS 解析出 IP 地址', 'TCP/IP 分包传输 → 浏览器渲染网页'] }
      ], 2, '高频概念：RAM 是临时工作台（挥发性），SSD 是文件柜（非挥发性）；HTTPS 比 HTTP 多了加密层。', '图解：计算机核心硬件与网页请求底层工作原理。')];
    case 'computing:term1:4':
      return [matrixSvg('comp-t1w4-craap', '网站可信度 CRAAP 评估法 & Word 分节符控制图', 'T1 Week 4 · 学术资料甄别 + 不同页面独立页眉页脚', [
        { title: 'C · Currency 时效性', lines: ['发布/更新日期是否最新？', '链接是否依然有效？'] },
        { title: 'R · Relevance 相关性', lines: ['内容是否切合研究问题？', '深度是否符合大学学术层级？'] },
        { title: 'A · Authority 权威性', lines: ['作者/机构是谁？(.edu/.gov 优先)', '是否具备相关专业资质？'] },
        { title: 'A · Accuracy 准确性', lines: ['有数据引用与同行评审吗？', '是否能被其他权威来源交叉验证？'] },
        { title: 'P · Purpose 目的性', lines: ['客观科普还是广告/偏见宣传？', '是否存在明显商业利益冲突？'] },
        { title: 'Word 分节符 Section Break', lines: ['插入 Next Page 分节符', '取消「Link to Previous」即可单独设页眉/横向页！'] }
      ], 3, '实操秘诀：Word 想让封面不显示页码、正文从第 1 页开始，核心就是「分节符 + 断开链接到前一节」。', '图解：CRAAP 五维信息评估标准与 Word 分节排版关键开关。')];
    case 'computing:term1:5':
      return [cycleSvg('comp-t1w5-sdlc', '系统开发生命周期（SDLC）六阶段闭环图', 'T1 Week 5 · Systems Development Life Cycle', [
        { t: '1. Planning', s: '可行性与立项' },
        { t: '2. Analysis', s: '调研用户需求' },
        { t: '3. Design', s: '界面与架构设计' },
        { t: '4. Build', s: '编码开发实现' },
        { t: '5. Testing', s: '测试修 Bug' },
        { t: '6. Maintain', s: '上线运维迭代' }
      ], 'SDLC', '系统开发闭环', '考试必记：前期 Analysis 阶段花时间把需求问清，比后期 Testing 返工省 10 倍成本！（下方保留 6 张官方讲义原图）', '图解：SDLC 六大核心阶段及其循环演进关系。')];
    case 'computing:term1:6':
      return [flowSvg('comp-t1w6-excel', 'MS Excel 工作簿层级结构与公式运算优先级', 'T1 Week 6 · Excel Core Concepts & BODMAS', [
        { badge: '文件层', title: 'Workbook 工作簿', desc: '整个 .xlsx 文件，内部可包含多张独立工作表' },
        { badge: '表单层', title: 'Worksheet 工作表', desc: '按列(A,B,C) × 行(1,2,3) 组成的二维数据网格' },
        { badge: '单元层', title: 'Cell & Range 区域', desc: '单格如 B4；连续区域如 B4:D10（冒号表示从…到…）' },
        { badge: '公式铁律', title: '以 = 开头 + BODMAS', desc: '括号 () → 乘方 ^ → 乘除 * / → 加减 + -' }
      ], '高频失误：忘记以等号 = 开头会被当作普通文本；写复杂分式时分子分母务必各自加括号！', '图解：Excel 数据结构层级与公式计算顺序规则。')];
    case 'computing:term1:7':
      return [matrixSvg('comp-t1w7-rev', 'Term 1 前半期知识与实操复盘总图（W1–W6）', 'T1 Week 7 复习 · 查漏补缺，打稳后半学期 Excel 实战基础', [
        { title: 'PowerPoint 演示规范', lines: ['母版统一风格 + 视觉留白', '本地桌面版导出无错位 PDF'] },
        { title: 'Word 专业排版', lines: ['Heading 样式 + 自动目录 TOC', 'Section Break 分节独立页眉页码'] },
        { title: '计算机与信息评估', lines: ['CPU / RAM / Storage 区分', 'CRAAP 五维判断网站可信度'] },
        { title: 'SDLC 与 Excel 起步', lines: ['SDLC 六阶段先后顺序', 'Cell / Range / = 公式与 BODMAS'] }
      ], 2, '复盘自测：闭卷能说出 CRAAP、SDLC 六步和 Word 分节步骤，前半期就稳过！', '图解：Term 1 第 1–6 周核心考点全景回顾。')];
    case 'computing:term1:8':
      return [flowSvg('comp-t1w8-sort', 'Excel 数据格式化、排序与筛选标准实操流', 'T1 Week 8 · Formatting, Multi-Level Sort & AutoFilter', [
        { badge: '1. 格式规范', title: '数字格式 ≠ 改文本', desc: '货币/百分比/日期用 Number Format，绝不手打 $ 或 % 变文本' },
        { badge: '2. 选全表', title: '整表选中再排序', desc: '千万别只选单列排序！否则整行数据会错位毁掉' },
        { badge: '3. 多级排序', title: 'Custom Sort 主次键', desc: '例如先按 Department 升序，同部门再按 Salary 降序' },
        { badge: '4. 筛选汇总', title: 'Filter + 冻结窗格', desc: '开启筛选快速查子集，Freeze Panes 锁定表头方便浏览' }
      ], '头号禁忌：排序时如果弹出 "Expand the selection"，一定要选「扩展选定区域」保护整行对应关系！', '图解：Excel 数据清理、安全排序与表头规范四步法。')];
    case 'computing:term1:9':
      return [matrixSvg('comp-t1w9-charts', 'Excel 图表选型决策矩阵与五要素检查表', 'T1 Week 9 · 选对图表类型 + 补齐专业学术标注', [
        { title: '柱状/条形图 Column/Bar', lines: ['适用：不同类别之间的数值对比', '例：各部门季度销售额比较'] },
        { title: '折线图 Line Chart', lines: ['适用：连续时间维度上的变化趋势', '例：2020–2026 年月度气温/股价走势'] },
        { title: '饼图 Pie Chart', lines: ['适用：整体 100% 中的占比结构', '注意：分类超过 5 项时改用柱状图'] },
        { title: '专业图表 5 必选要素', lines: ['①清晰标题 ②横纵轴标题与单位', '③图例 Legend ④数据标签 ⑤去掉杂乱网格线'] }
      ], 2, '机考扣分重灾区：创建图表后忘记改默认 "Chart Title" 或漏写坐标轴单位（如 $ / %）！', '图解：四种常见场景图表选型指南及扣分避坑要点。')];
    case 'computing:term1:10':
      return [diagramCompW10Refs()];
    case 'computing:term1:11':
      return [diagramCompW11If()];
    case 'computing:term1:12':
      return [diagramCompW12Xlookup()];
    case 'computing:term1:13':
      return [flowSvg('comp-t1w13-exam', 'Term 1 期末实操考试防丢分四步自检流', 'T1 Week 13 · Word + Excel 综合考前终极清单', [
        { badge: '查公式', title: 'Ctrl + ~ 显示公式', desc: '确认全是动态公式而非手算写死的数字，检查 $ 锁定' },
        { badge: '查错误值', title: '清零 #REF/#N/A/#VALUE', desc: '任何报错单元格必须定位修复，检查 IF 引号与范围一致' },
        { badge: '查图表排版', title: '标题/轴标/数字格式', desc: '核对小数位数、货币符号、表头居中及列宽无 ### 溢出' },
        { badge: '查提交文件', title: '命名与打印预览', desc: '按要求命名文件名、设定 Fit to 1 Page 并确认保存最新稿' }
      ], '快捷键神技：按 Ctrl + ~（波浪号）可一键切换「显示所有公式」模式，5 秒查完漏写公式！', '图解：机考交卷前 5 分钟黄金自检流程。')];
    case 'computing:term2:1':
      return [compareSvg('comp-t2w1-logic', '组合逻辑函数对比：IF(AND(...)) vs IF(OR(...))', 'T2 Week 1 · 高级 Excel 多条件嵌套与布尔逻辑真值表', {
        title: 'AND(条件1, 条件2) — 全部满足',
        palette: { bg: C.blueBg, bd: C.blueBd, head: C.navy2 },
        items: [
          { k: '条件1=真 & 条件2=真', v: '返回 TRUE ✓' },
          { k: '条件1=真 & 条件2=假', v: '返回 FALSE ✗' },
          { k: '条件1=假 & 条件2=假', v: '返回 FALSE ✗' },
          { k: '典型场景', v: '成绩≥50 且 出勤≥80%' }
        ]
      }, {
        title: 'OR(条件1, 条件2) — 任一满足',
        palette: { bg: C.greenBg, bd: C.greenBd, head: C.green },
        items: [
          { k: '条件1=真 & 条件2=真', v: '返回 TRUE ✓' },
          { k: '条件1=真 & 条件2=假', v: '返回 TRUE ✓' },
          { k: '条件1=假 & 条件2=假', v: '返回 FALSE ✗' },
          { k: '典型场景', v: 'VIP 会员 或 消费≥$500' }
        ]
      }, '嵌套 IF 秘诀：按「从大到小」或「从小到大」单向写边界（如 ≥85 → ≥75 → ≥65 → ≥50），绝不交叉重叠！', '图解：AND（且）与 OR（或）真值表对照及多档评级嵌套技巧。')];
    case 'computing:term2:2':
      return [flowSvg('comp-t2w2-3d', '多工作表分组编辑与跨表三维引用（3D Reference）图解', 'T2 Week 2 · Multi-Sheet Grouping & Cross-Sheet XLOOKUP', [
        { badge: '1. 跨表语法', title: 'SheetName!Cell', desc: '引用其他表用感叹号隔开；表名含空格需加单引号 \'Q1 Sales\'!B2' },
        { badge: '2. 三维汇总', title: '=SUM(Jan:Dec!B5)', desc: '把连续多张结构相同工作表的同一位置 B5 一键求和' },
        { badge: '3. 工作表分组', title: 'Shift 选中多表同步改', desc: '同时调整多张表的列宽、表头样式与公式，效率翻倍' },
        { badge: '4. 务必解组！', title: 'Ungroup Sheets', desc: '改完立刻右键取消组合，否则后续误改会把所有表同时覆盖！' }
      ], '头号危险提醒：标题栏出现 [Group] 时处于分组态，编辑完公共格式后第一件事就是取消分组！', '图解：跨表引用语法与多工作表同步操作安全流程。')];
    case 'computing:term2:3':
      return [compareSvg('comp-t2w3-date', 'DATE 日期函数与 SUMIFS / COUNTIFS 多条件统计对比', 'T2 Week 3 · 日期底层序列号原理 & 多条件筛选漏斗', {
        title: '日期函数 Date Functions',
        palette: { bg: C.blueBg, bd: C.blueBd, head: C.navy2 },
        items: [
          { k: '底层原理', v: '1900/1/1 = 1，每天+1' },
          { k: 'TODAY() / NOW()', v: '动态取今天日期 / 含时间' },
          { k: 'YEAR / MONTH / DAY', v: '提取年月日整数' },
          { k: '日期相减', v: 'End − Start = 相差天数' }
        ]
      }, {
        title: '条件统计 SUMIFS / COUNTIFS',
        palette: { bg: C.goldBg, bd: C.goldBd, head: C.gold },
        items: [
          { k: 'SUMIFS 第 1 参数', v: '放「要求和的数值列」!' },
          { k: '后续成对出现', v: '条件列1, 条件1, 列2, 条件2' },
          { k: '比较符写法', v: '">100" 或 ">="&A1' },
          { k: 'COUNTIFS', v: '只放条件列与条件，算个数' }
        ]
      }, '极易写反：SUMIF 的求和列在最后，而多条件 SUMIFS 的求和列（sum_range）必须放在第 1 个参数！', '图解：Excel 日期计算原理与 SUMIFS 参数顺序防错对照。')];
    case 'computing:term2:4':
      return [compareSvg('comp-t2w4-fin', '财务函数（PMT/FV/PV）与文本函数（LEFT/MID/RIGHT）速查', 'T2 Week 4 · 房贷复利现金流方向 + 字符串精准拆合', {
        title: '财务函数（现金流符号约定）',
        palette: { bg: C.greenBg, bd: C.greenBd, head: C.green },
        items: [
          { k: 'PMT(rate, nper, pv)', v: '算每期固定还款额' },
          { k: 'rate 与 nper 单位', v: '按月还必须 ÷12 和 ×12!' },
          { k: '正负号规则', v: '流入钱包(+) / 流出钱包(−)' },
          { k: 'FV / PV', v: '终值 / 现值折现计算' }
        ]
      }, {
        title: '文本函数 Text Functions',
        palette: { bg: C.purpleBg, bd: C.purpleBd, head: C.purple },
        items: [
          { k: 'LEFT(txt, n)', v: '从左截取 n 个字符' },
          { k: 'RIGHT(txt, n)', v: '从右截取 n 个字符' },
          { k: 'MID(txt, start, n)', v: '从第 start 位截 n 字符' },
          { k: 'CONCAT / TEXTJOIN', v: '合并姓名、编号与分隔符' }
        ]
      }, '财务函数头号大坑：年利率 6% 按月还款 5 年，公式必须写 rate=6%/12、nper=5*12，切勿直接代 6% 和 5！', '图解：Excel 财务函数期数折算规则与常用文本拆合函数。')];
    case 'computing:term2:5':
      return [flowSvg('comp-t2w5-combo', '高级组合图表（Combo Chart）与双纵轴制作图解', 'T2 Week 5 · 两组量级完全不同的数据画在同一张图里', [
        { badge: '何时使用', title: '量纲差异极大时', desc: '如柱状图显示「销售额($10万)」+ 折线图显示「增长率(12%)」' },
        { badge: '第 1 步', title: 'Insert → Combo Chart', desc: '为不同数据系列分别指定 Clustered Column 与 Line' },
        { badge: '第 2 步', title: '勾选 Secondary Axis', desc: '把百分比系列放到右侧次坐标轴，折线立刻清晰展开' },
        { badge: '第 3 步', title: '加趋势线与双轴标', desc: '左右两侧纵轴都必须标清名称和单位，避免读者看混' }
      ], '美化提示：主轴和次轴标题颜色可分别与柱状/折线同色，读者一眼就知道哪条线看哪边刻度！', '图解：组合图表双纵轴配置步骤与视觉对应技巧。')];
    case 'computing:term2:6':
      return [matrixSvg('comp-t2w6-exam', 'Advanced Excel 实操考试核心函数速查地图', 'T2 Week 6 · 考前 10 分钟扫一眼全部考点', [
        { title: '逻辑与嵌套', lines: ['IF / IF(AND) / IF(OR) 多层评级', '边界单向递减，数字不加引号'] },
        { title: '查找与跨表', lines: ['XLOOKUP 双向查找 + $ 锁区域', '跨表 \'Sheet\'!Cell 与 3D SUM'] },
        { title: '日期与条件汇总', lines: ['TODAY / YEAR / MONTH / 相减', 'SUMIFS 首参数放求和列！'] },
        { title: '财务、文本与图表', lines: ['PMT/FV 牢记月利率÷12 期数×12', 'Combo Chart 双纵轴 + 轴标题'] }
      ], 2, '考场策略：先做最有把握的统计/查找列拿到 70% 基础分，再精雕嵌套 IF 与高级组合图。', '图解：Advanced Excel 机考四大模块核心清单。')];
    case 'computing:term2:7':
      return [matrixSvg('comp-t2w7-err', 'Excel 六大常见报错（Formula Errors）秒速排查树', 'T2 Week 7 复习与巩固 · 看到报错不再慌，5 秒定位病根', [
        { title: '#N/A（查无此项）', lines: ['常见于 XLOOKUP 找不到匹配值', '查多出的空格、文本/数字格式不统一'] },
        { title: '#REF!（引用失效）', lines: ['公式引用的行/列或工作表被删除', '按 Ctrl+Z 撤销或重新框选区域'] },
        { title: '#VALUE!（类型错误）', lines: ['拿文字去做了加减乘除运算', '检查单元格里是否混入了空格或字符'] },
        { title: '#NAME?（拼写错误）', lines: ['函数名拼错（如 XLOOKP）', '或文本参数忘了加英文双引号 ""'] },
        { title: '#DIV/0!（除以零）', lines: ['分母单元格为空或数值为 0', '用 IFERROR(..., 0) 优雅兜底'] },
        { title: '######（列宽不够）', lines: ['不是公式错了！只是格子太窄', '双击列标右边界自动拉宽即可'] }
      ], 3, '万能兜底公式：=IFERROR(原公式, "未找到")，让表格汇报呈现零报错的专业水准。', '图解：Excel 6 大报错代码原因及一键修复方案。')];
    case 'computing:term2:8':
      return [flowSvg('comp-t2w8-plan', 'Media Presentation 策划文档（Planning Document）五板块', 'T2 Week 8 · 先设计再制作，策划文档本身占重要评分权重', [
        { badge: '1. 定位', title: 'Purpose & Audience', desc: '明确目标受众是谁、演示要说服/传达什么核心信息' },
        { badge: '2. 结构', title: 'Storyboard 分镜草图', desc: '逐页规划标题、画面布局、配图与切换逻辑' },
        { badge: '3. 规范', title: 'Style Guide 视觉规范', desc: '定主色/辅色、中英文字体字号、统一图标风格' },
        { badge: '4. 清单', title: 'Assets & Timeline', desc: '列出音频/视频/图片来源版权标注与制作排期' }
      ], '评分要点：Storyboard 越具体（标出素材位置与时长），后续制作越快且策划分越高。', '图解：媒体演示策划文档核心框架。')];
    case 'computing:term2:9':
      return [flowSvg('comp-t2w9-prod', '媒体演示制作与质量验收流水线（Plan → Produce）', 'T2 Week 9 · 把分镜方案落地为可流畅播放的成品', [
        { badge: '素材处理', title: '压缩裁剪对齐版权', desc: '统一图片分辨率与音频音量，补全 Reference 出处' },
        { badge: '搭建母版', title: '套用统一样式框架', desc: '按策划书配色先搭模板，再批量填充每页内容' },
        { badge: '媒体嵌入', title: '嵌入音频/视频定时', desc: '测试自动播放、点击触发与页面过渡节奏' },
        { badge: '彩排测试', title: '全屏实测防翻车', desc: '换一台电脑或脱网测试音视频能否正常播放' }
      ], '易错坑：外链视频换电脑会黑屏，务必使用「嵌入媒体」或把媒体文件放在同级目录一起打包！', '图解：Media Presentation 从素材准备到验收彩排的四步流水线。')];
    case 'computing:term2:10':
      return [matrixSvg('comp-t2w10-crap', '演示视觉设计黄金四原则（CRAP Design Principles）', 'T2 Week 10 制作阶段 · 让你的幻灯片一眼看去像专业设计师作品', [
        { title: 'C · Contrast 对比', lines: ['深色背景配浅字，标题字号远大于正文', '用强调色只高亮每页最关键的 1 个数据'] },
        { title: 'R · Repetition 重复', lines: ['全套幻灯片统一配色、字体与页脚位置', '同类卡片保持相同圆角与图标风格'] },
        { title: 'A · Alignment 对齐', lines: ['所有元素沿网格参考线严格左对齐/居中', '告别随意摆放导致的视觉杂乱感'] },
        { title: 'P · Proximity 亲密性', lines: ['相关图文靠近放一起形成视觉分组', '不同主题之间留出充足空白间距'] }
      ], 2, '自查一招：把幻灯片缩小到 25% 缩略图模式，如果重点和层次依然一眼可见，排版就过关了！', '图解：CRAP 排版四原则快速提升演示文稿质感。')];
    case 'computing:term2:11':
      return [flowSvg('comp-t2w11-qa', '媒体演示最终提交前四维技术自检清单', 'T2 Week 11 · 提交前 15 分钟彻底消除扣分隐患', [
        { badge: '文件规范', title: '格式与大小检查', desc: '核对 Moodle 允许的格式与上限，文件名含学号姓名' },
        { badge: '内容校验', title: '拼写、数据与引用', desc: '通读英文拼写，检查所有图片/数据均附规范 Reference' },
        { badge: '播放测试', title: '全屏计时走一遍', desc: '确认总时长严格落在题目要求区间，无卡顿黑屏' },
        { badge: '双份备份', title: '本地 + 云端留底', desc: '上传后重新下载自己提交的文件打开确认未损坏' }
      ], '金科玉律：在截止时间前至少 2 小时完成首次上传，千万别卡最后 5 分钟赌网速！', '图解：作业终稿提交前四重验收流程。')];
    case 'computing:term2:12':
      return [compareSvg('comp-t2w12-prep', '计算机期末双轨冲刺复习路线：概念理论 vs Excel 实操', 'T2 Week 12 考前综合准备 · 两手抓不偏科', {
        title: '理论概念轨（笔试/选择）',
        palette: { bg: C.blueBg, bd: C.blueBd, head: C.navy2 },
        items: [
          { k: '硬件与网络', v: 'CPU / RAM / DNS / HTTP' },
          { k: '信息评估', v: 'CRAAP 五维应用判断' },
          { k: '系统开发', v: 'SDLC 六阶段顺序与职责' },
          { k: '设计原则', v: 'CRAP 视觉排版与演示规划' }
        ]
      }, {
        title: '实操技能轨（机考实战）',
        palette: { bg: C.greenBg, bd: C.greenBd, head: C.green },
        items: [
          { k: '引用与逻辑', v: '$A$1 锁格 + 嵌套 IF/AND/OR' },
          { k: '查找与统计', v: 'XLOOKUP + SUMIFS/COUNTIFS' },
          { k: '日期与财务', v: 'DATE + PMT/FV（月度折算）' },
          { k: '高级图表', v: 'Combo Chart 双纵轴规范' }
        ]
      }, '冲刺节奏：先用 1 小时默画错题函数语法，再限时 60 分钟完整跑一遍 Week 13 综合模拟项目！', '图解：理论与机考双轨冲刺重点分布。')];
    case 'computing:term2:13':
      return [flowSvg('comp-t2w13-proj', 'Advanced Excel 综合项目全链路数据架构', 'T2 Week 13 · 综合实战与模拟考试', [
        { badge: '原始数据', title: 'Raw Data 清洗核对', desc: '规范日期/货币格式，检查缺失值与命名区域' },
        { badge: '逻辑计算', title: 'XLOOKUP + 嵌套 IF', desc: '跨表匹配单价/等级，自动算出折扣、税费与评级' },
        { badge: '汇总看板', title: 'SUMIFS + 财务分析', desc: '按部门/月份生成动态汇总表，核对总计零报错' },
        { badge: '可视化输出', title: 'Combo Chart 呈现', desc: '插入双纵轴组合图表，配齐标题、单位与打印版式' }
      ], '实战检验标准：随便改动原始表里 1 个数字，整套汇总表与图表都能全自动联动更新！', '图解：Excel 综合项目从原始数据到动态分析看板的完整流水线。')];

    /* ---------- ACADEMIC ENGLISH (ALL 14 WEEKS) ---------- */
    case 'english:term1:1':
      return [flowSvg('eng-w1-peel', '学术口语观点展开 PEEL 结构图（2–3 分钟视频必备）', 'Week 1 · Speaking: Studying in a Foreign Country', [
        { badge: 'P · Point', title: '开门见山抛核心观点', desc: '先用 1 句话直说选择海外留学的核心理由' },
        { badge: 'E · Explain', title: '解释背后的逻辑原因', desc: '用 because / due to / this enables 说明为什么重要' },
        { badge: 'E · Example', title: '举出具体生活/学习例证', desc: '结合澳洲校园、跨文化课堂或具体学科给出实感细节' },
        { badge: 'L · Link', title: '回扣主题并引出下一点', desc: '总结本段如何回应 "Why Australia"，自然过渡' }
      ], '口语提分秘诀：提前准备 Signposting 衔接词（Firstly / Another key factor is / To sum up），听众一听就觉得逻辑极清！', '图解：PEEL 四步框架帮你稳稳撑满 2–3 分钟高分学术口语发言。')];
    case 'english:term1:2':
      return [matrixSvg('eng-w2-cornell', 'Cornell 学术听力笔记三分法与路标词（Signposting）图解', 'Week 2 · Listening: Studying in a Foreign Country', [
        { title: '左栏 Cue（关键词 · 30%）', lines: ['只记主旨词、数字、人名与疑问', '听完后用来遮住右栏自我回忆'] },
        { title: '右栏 Notes（核心笔记 · 70%）', lines: ['用缩写与箭头速记（→ / ↑ / w/ / e.g.）', '绝不逐字抄长句，抓动词和因果'] },
        { title: '底栏 Summary（3 句复盘）', lines: ['听完 5 分钟内用自己的话总结核心论点', '立刻锻炼 Paraphrase 改写能力'] },
        { title: '必听 4 类路标词 Signposting', lines: ['转折：However / In contrast（后必有考点！）', '强调：Crucially / The main reason is...'] }
      ], 2, '听力核心原则：先读题圈定位词，听录音时竖起耳朵抓「转折词 + 列举词 + 举例词」。', '图解：UNSW 课堂高频使用的 Cornell 三栏听力笔记法。')];
    case 'english:term1:3':
      return [flowSvg('eng-w3-group', '学术小组讨论（Group Discussion）高分互动四步流', 'Week 3 · Speaking: Working in Groups', [
        { badge: '1. 破冰开启', title: 'Initiate 抛出议题', desc: '"Shall we start by looking at...?" 主动定好讨论结构' },
        { badge: '2. 衔接他人', title: 'Build On 承接观点', desc: '"Building on [Name]\'s point, I\'d add that..." 展现倾听' },
        { badge: '3. 礼貌质疑', title: 'Politely Challenge', desc: '"That\'s a fair point, however..." 先肯定再提不同视角' },
        { badge: '4. 拉人汇总', title: 'Invite & Summarise', desc: '"What do you think, [Name]?" 照顾沉默队友并总结共识' }
      ], 'UNSW 小组打分真相：不是谁抢话说得多就分高，而是「推进讨论 + 回应队友 + 保持学术礼貌」拿最高分！', '图解：学术小组讨论四步互动策略与高分话术。')];
    case 'english:term1:4':
      return [flowSvg('eng-w4-para', '学术写作标准段落结构图（Academic Paragraph Blueprint）', 'Week 4 · Listening & Writing: Working in Groups', [
        { badge: '第 1 句', title: 'Topic Sentence 主题句', desc: '点明本段唯一中心论点（Topic + Controlling Idea）' },
        { badge: '中间展开', title: 'Explanation 展开阐释', desc: '定义关键概念，把抽象论点讲透彻' },
        { badge: '权威支撑', title: 'Evidence & Citation', desc: '嵌入数据、文献或课堂案例（避免空口无凭）' },
        { badge: '收尾升华', title: 'Analysis + Link 回扣', desc: '解释证据如何证明主题句，严禁把引文直接当段尾！' }
      ], '铁律：One Paragraph = One Main Idea（一段只讲清一个核心论点），长短控制在 120–160 词最清爽。', '图解：大学学术论文标准 TEEL 段落构造。')];
    case 'english:term1:5':
      return [flowSvg('eng-w5-info', '信息图（Infographic）口头汇报四步走图解', 'Week 5 · Speaking: Natural Disasters（信息图总结）', [
        { badge: '1. 总览', title: 'Overview 定调主题', desc: '1 句话说明信息图主题、来源及涵盖的时间/地区范围' },
        { badge: '2. 抓趋势', title: 'Highlight Key Trends', desc: '挑出最显眼的「最高/最低/剧烈变化」，绝不流水账念完所有数' },
        { badge: '3. 做对比', title: 'Compare & Quantify', desc: '用倍数、占比与对比词（whereas / nearly double）讲活数据' },
        { badge: '4. 谈启示', title: 'Draw Implication', desc: '总结这组数据说明了什么风险或应对启示，干脆收尾' }
      ], '避坑提醒：口头总结信息图切忌像机器人一样从头念到尾，把零散数据「归类 + 对比」才是高分关键。', '图解：将视觉信息图转化为清晰学术口头汇报的四步模板。')];
    case 'english:term1:6':
      return [flowSvg('eng-w6-cause', '因果链（Cause & Effect）学术写作逻辑连接图', 'Week 6 · Listening & Writing: Natural Disasters', [
        { badge: '根因 Cause', title: '驱动因素 Driver', desc: '例：Rapid urbanisation / Rising global temperatures' },
        { badge: '连接动词', title: '学术因果表达', desc: 'leads to / triggers / contributes to / results in' },
        { badge: '直接后果', title: 'Primary Effect', desc: '例：Increased frequency of extreme bushfires & floods' },
        { badge: '次生影响', title: 'Secondary Impact', desc: 'consequently → 基础设施损毁、经济损失与居民迁徙' }
      ], '高分升级：多用谨慎限定词（Hedging：may contribute to / is likely to intensify），避免武断的 "always causes"。', '图解：从单一原因到多级后果的学术因果写作链条。')];
    case 'english:term1:7':
      return [matrixSvg('eng-w7-review', '学术英语期中四大能力复盘与提分优先级矩阵', 'Week 7 · 期中反馈与自我诊断', [
        { title: 'Task Response 审题扣题', lines: ['是否完整回应了题目所有小问？', '核心观点立场是否贯穿全文？'] },
        { title: 'Coherence 结构衔接', lines: ['每段都有清晰 Topic Sentence 吗？', '逻辑连接词是否准确不滥用？'] },
        { title: 'Academic Lexis 学术词汇', lines: ['去掉口语词（a lot of / big / get）', '替换精准学术词与固定搭配'] },
        { title: 'Grammar & Citation 准确度', lines: ['主谓一致、时态统一、从句完整', '引用与转述符合学术诚信规范'] }
      ], 2, '期中复盘动作：把老师批注按上面 4 项分类打勾，未来 6 周只猛攻失分最多的前 2 项！', '图解：UNSW 学术英语评分四维自查表。')];
    case 'english:term1:8':
      return [compareSvg('eng-w8-ai', '辩证讨论框架：正反论点（For vs Against）+ 让步转折（Concession）', 'Week 8 · Speaking & Listening: AI in Education', {
        title: '支持视角 Benefits (For)',
        palette: { bg: C.greenBg, bd: C.greenBd, head: C.green },
        items: [
          { k: '个性化辅导', v: 'Personalised feedback 24/7' },
          { k: '学习效率提升', v: 'Streamlines research & drafting' },
          { k: '语言辅助', v: 'Supports non-native speakers' }
        ]
      }, {
        title: '担忧视角 Risks (Against)',
        palette: { bg: C.redBg, bd: C.redBd, head: C.red },
        items: [
          { k: '学术诚信风险', v: 'Plagiarism & over-reliance' },
          { k: '思维退化', v: 'Erodes critical thinking' },
          { k: '信息幻觉', v: 'Hallucinations & bias' }
        ]
      }, '高分辩证句型：Although [对手观点合理之处], it is still crucial that [回归己方核心立场]（让步段立刻拔高批判性深度！）。', '图解：正反双视角拆解议题并用 Concession 句式组织辩证论述。')];
    case 'english:term1:9':
      return [diagramEnglishW9ReportingVerbs()];
    case 'english:term1:10':
      return [flowSvg('eng-w10-sdg', 'SDG 气候与可持续发展演讲：Problem → Cause → Solution 路线图', 'Week 10 · Speaking: Causes of Climate Change (SDG)', [
        { badge: '1. 现状界定', title: 'Define the Problem', desc: '用 1–2 组权威 SDG 数据建立紧迫感与议题范围' },
        { badge: '2. 深挖成因', title: 'Analyse Root Causes', desc: '区分人类活动（化石燃料/城市扩张）与结构性因素' },
        { badge: '3. 提出对策', title: 'Evaluate Solutions', desc: '按「政策 / 技术 / 社区」分层给具体可行方案' },
        { badge: '4. 评估落地', title: 'Feasibility & Call', desc: '客观指出成本或障碍，再强调协同行动的价值' }
      ], '演讲亮点：把宏观 SDG 目标落回 1 个具体城市或澳洲本地案例，说服力瞬间翻倍！', '图解：可持续发展主题演讲四段式结构蓝图。')];
    case 'english:term1:11':
      return [compareSvg('eng-w11-nom', '学术写作核心升级：名词化（Nominalisation）改写对照图', 'Week 11 · Writing: Causes of Climate Change — 从口语动词句变身正式学术句', {
        title: '口语化/日常表达（动词偏多）',
        palette: { bg: C.redBg, bd: C.redBd, head: C.red },
        items: [
          { k: 'Cities grow very fast...', v: '偏口语、信息密度低' },
          { k: 'People burn coal, so...', v: '主语过于泛化' },
          { k: 'The climate is changing...', v: '动词链松散' },
          { k: 'We need to protect...', v: '带第一人称主观色彩' }
        ]
      }, {
        title: '学术名词化升级（高分正式）',
        palette: { bg: C.greenBg, bd: C.greenBd, head: C.green },
        items: [
          { k: 'Rapid urban expansion...', v: '形容词 + 名词短语' },
          { k: 'The combustion of coal...', v: '聚焦客观过程本身' },
          { k: 'Ongoing climate shift...', v: '紧凑高密度主语' },
          { k: 'Environmental protection...', v: '客观去人称化' }
        ]
      }, '改写三步法：① 圈出动词/形容词 → ② 变成对应名词（grow→growth, emit→emission）→ ③ 用强学术动词连接两个名词短语！', '图解：名词化如何让英文句子立刻具备大学学术论文的简洁与客观感。')];
    case 'english:term1:12':
      return [compareSvg('eng-w12-cc', '对比论证（Compare & Contrast）双结构模板图解', 'Week 12 · Writing & Speaking: Dangerous Australian Wildlife', {
        title: '结构 A：Block 整体对比法',
        palette: { bg: C.blueBg, bd: C.blueBd, head: C.navy2 },
        items: [
          { k: 'Body 1', v: '完整介绍对象 A（特征1/2/3）' },
          { k: 'Body 2', v: '完整介绍对象 B（特征1/2/3）' },
          { k: '优点', v: '适合短文、全局画面感强' },
          { k: '注意', v: 'Body 2 必须显式回扣对比 A' }
        ]
      }, {
        title: '结构 B：Point-by-Point 逐点对比法',
        palette: { bg: C.goldBg, bd: C.goldBd, head: C.gold },
        items: [
          { k: 'Body 1', v: '维度 1（如栖息地）：A vs B' },
          { k: 'Body 2', v: '维度 2（如毒性风险）：A vs B' },
          { k: 'Body 3', v: '维度 3（如防备策略）：A vs B' },
          { k: '优点', v: '大学长论文首选，分析极犀利' }
        ]
      }, '高频对比信号词：表示相似用 Similarly / Likewise；表示差异用 Whereas / In contrast / Conversely。', '图解：Block 与 Point-by-Point 两种对比结构适用场景对照。')];
    case 'english:term1:13':
      return [flowSvg('eng-w13-essay', '学术写作全流程：审题 → 提纲 → 起草 → Rubric 自查', 'Week 13 · Listening & Writing: Australian Animals', [
        { badge: '1. 拆题', title: 'Deconstruct Prompt', desc: '圈出指令词（Analyse/Compare）、主题词与限定条件' },
        { badge: '2. 搭骨架', title: 'Outline 列提纲', desc: '先定 Thesis Statement 与每段主题句，不跑题再动笔' },
        { badge: '3. 写正文', title: 'Draft 学术起草', desc: '按 TEEL 展开，穿插转述动词、名词化与客观限定词' },
        { badge: '4. 对表改', title: 'Rubric 终稿校对', desc: '逐项对照评分表查逻辑、词汇正式度、语法与字数' }
      ], '省时提分规律：动笔前花 15% 时间列好提纲，能减少 80% 写到一半逻辑跑偏重写的时间！', '图解：大学学术写作四步闭环流程。')];
    case 'english:term1:14':
      return [flowSvg('eng-w14-read', 'UNSW 学术精读三步定位法（SDG 11 Core Text 实战流程）', 'Week 14 Reading · 先抓骨架再精准定位考点，告别逐词死磕', [
        { badge: 'Step 1 Skim', title: '2 分钟略读抓主旨', desc: '只看标题、小标题、首段和每段首句，画出全文结构树' },
        { badge: 'Step 2 Scan', title: '带题扫读精准定位', desc: '圈出题干专有名词/数字/核心词，快速锁定目标段落' },
        { badge: 'Step 3 Match', title: '识别同义替换 Paraphrase', desc: 'UNSW 考点几乎必考同义改写，逐句核对逻辑关系与否定词' },
        { badge: 'Step 4 Vocab', title: '生词入库 + 长难句拆分', desc: '先找主谓宾剥离定状从句，高频学术词收入英语工作台复习' }
      ], '配合使用：点下方「打开英语精读与生词工作台」可边读 SDG 11 原文边一键收生词！', '图解：应对 UNSW 长篇学术阅读的高效三步定位与改写识别法。')];

    /* ---------- EXTRACURRICULAR (M7–M12) ---------- */
    case 'extracurricular:modules:7':
      return [flowSvg('ext-m7-stock', '股票本质与一、二级市场资金流向图解', '投资基础 1 · 股票入门 — 买股票本质上是成为公司的微小股东', [
        { badge: '一级市场', title: 'IPO 发行融资', desc: '公司向早期投资者发新股，融资款真正进入公司账上发展业务' },
        { badge: '二级市场', title: '交易所自由买卖', desc: '投资者之间竞价交易（如 ASX/美股/A股），价格随预期波动' },
        { badge: '收益来源', title: '资本利得 + 股息分红', desc: '低买高卖赚价差 + 分享公司盈利分红（Dividend）' },
        { badge: '核心定价', title: '盈利能力 × 市场估值', desc: '股价 = EPS（每股盈利）× PE（市盈率预期倍数）' }
      ], '入门第一课：短期股价是投票机（情绪驱动），长期股价是称重机（企业盈利增长驱动）。', '图解：理解股票定价逻辑与一级/二级市场的根本区别。')];
    case 'extracurricular:modules:8':
      return [compareSvg('ext-m8-pos', '仓位控制与止损止盈盈亏比（Risk-Reward Ratio）设计图', '投资基础 2 · 下单之前先想好「最坏亏多少、赚到哪离场」', {
        title: '单笔风险与仓位铁律',
        palette: { bg: C.blueBg, bd: C.blueBd, head: C.navy2 },
        items: [
          { k: '单笔最大亏损上限', v: '通常 ≤ 总资金的 1%–2%' },
          { k: '止损位 Stop-Loss', v: '买前写死，跌破无条件执行' },
          { k: '仓位计算公式', v: '可买股数 = 可亏额 ÷ 止损价差' },
          { k: '切忌行为', v: '越跌越满仓摊平（无底洞）' }
        ]
      }, {
        title: '盈亏比（R:R）与退出计划',
        palette: { bg: C.greenBg, bd: C.greenBd, head: C.green },
        items: [
          { k: '目标盈亏比', v: '争取 ≥ 2:1 或 3:1 再出手' },
          { k: '即使胜率仅 40%', v: '3:1 盈亏比长期依然正期望!' },
          { k: '分批止盈', v: '达目标先落袋一半，留仓滚利润' },
          { k: '移动止损', v: '浮盈后把止损上移至成本价' }
        ]
      }, '专业交易员共识：决定你能不能活下来的不是「买得有多准」，而是「看错时亏得有多小」。', '图解：用仓位上限与盈亏比建立客观可执行的退出计划。')];
    case 'extracurricular:modules:9':
      return [diagramExtraM9Drawdown()];
    case 'extracurricular:modules:10':
      return [flowSvg('ext-m10-futures', '期货合约保证金杠杆与每日无负债结算（Mark-to-Market）机制', '投资基础 4 · 期货为什么既能对冲风险也能迅速爆仓', [
        { badge: '1. 标准化合约', title: '约定未来价与交割日', desc: '多头(Long)看涨买入，空头(Short)看跌卖出，零和博弈' },
        { badge: '2. 保证金杠杆', title: '10% 押金撬动 100% 合约', desc: '价格波动 5%，保证金账面盈亏即放大 10 倍至 ±50%！' },
        { badge: '3. 每日盯市结算', title: 'Mark-to-Market 逐日扣款', desc: '每天收盘按结算价把盈利划给赢家、亏损直接从输家账户扣走' },
        { badge: '4. 强平红线', title: 'Margin Call 追保/强平', desc: '余额跌破维持保证金且未及时补钱，交易所强制平仓止损' }
      ], '核心风控提醒：期货天然带高杠杆且有到期日，新手务必先在纸上模拟完全搞懂合约乘数与追保线！', '图解：期货杠杆放大效应与每日无负债结算流程。')];
    case 'extracurricular:modules:11':
      return [cycleSvg('ext-m11-paper', '纸上演练与交易复盘三步闭环（Paper Trading Loop）', '投资基础 5 · 用零真金白银成本跑通自己的交易纪律', [
        { t: '1. 写计划单', s: '入场/止损/仓位' },
        { t: '2. 模拟执行', s: '严格按纪律下单' },
        { t: '3. 压力测试', s: '测极端回撤承受力' },
        { t: '4. 交易日志', s: '记情绪与偏离点' },
        { t: '5. 归因复盘', s: '分清运气 vs 能力' },
        { t: '6. 迭代规则', s: '修正下一轮计划' }
      ], '演练复盘', 'Paper Trading', '复盘黄金标准：按规则做但亏了是「好交易」，违背规则却碰巧赚了是「最危险的坏交易」！', '图解：计划 → 执行 → 日志 → 归因 → 优化的闭环复盘系统。')];
    case 'extracurricular:modules:12':
      return [diagramExtraM12Breakeven()];

    default:
      return [];
  }
}

/* =====================================================================
 * CLEANUP COMPUTING BROKEN IMAGES & DEAD PDF LINKS
 * ===================================================================== */
function cleanComputingHtml(html) {
  let removedImgs = 0;
  let keptImgs = 0;
  let removedDeadPdfLinks = 0;

  // Process each <details class="cfig-gallery ...">...</details>
  let out = String(html || '').replace(/<details class="cfig-gallery[^"]*"[^>]*>[\s\S]*?<\/details>/gi, (block) => {
    const figures = [...block.matchAll(/<figure class="cfig">[\s\S]*?<\/figure>/gi)].map(m => m[0]);
    if (!figures.length) return '';
    const surviving = [];
    for (const fig of figures) {
      const srcMatch = fig.match(/<img[^>]+src=["']([^"']+)["']/i);
      const src = srcMatch ? srcMatch[1].replace(/^\//, '') : '';
      const exists = src && fs.existsSync(path.join(PUB, src));
      if (exists) {
        keptImgs++;
        // Also check PDF link inside figcaption
        const cleanedFig = fig.replace(/\s*·\s*<a[^>]+href=["'](sources\/computing-reference\/[^"'#]+)(?:#[^"']*)?["'][^>]*>[\s\S]*?<\/a>/gi, (m, pdfPath) => {
          if (fs.existsSync(path.join(PUB, pdfPath))) return m;
          removedDeadPdfLinks++;
          return '';
        });
        surviving.push(cleanedFig);
      } else {
        removedImgs++;
      }
    }
    if (!surviving.length) return '';
    const sumMatch = block.match(/<summary>([\s\S]*?)<\/summary>/i);
    const oldSum = sumMatch ? sumMatch[1] : '老师讲义原页对照';
    const newSum = oldSum.replace(/\d+\s*页/, surviving.length + ' 页');
    return `<details class="cfig-gallery cfig-source-pages"><summary>${newSum}</summary><div class="cfig-gal-grid">${surviving.join('')}</div></details>`;
  });

  // Also strip any stray dead sources/computing-reference/*.pdf anchors outside galleries
  out = out.replace(/<a[^>]+href=["'](sources\/computing-reference\/[^"'#]+)(?:#[^"']*)?["'][^>]*>([\s\S]*?)<\/a>/gi, (m, pdfPath, label) => {
    if (fs.existsSync(path.join(PUB, pdfPath))) return m;
    removedDeadPdfLinks++;
    return `<span style="color:var(--muted)">${label}</span>`;
  });

  // Clean leftover bilingual hint text when no cfig-gallery remains right after heading
  out = out.replace(/\s*Teacher handout original pages for comparison\s*·\s*\d+\s*pages?\s*\(expand to view;\s*click the image to enlarge\)/gi, '');

  // Remove empty "一、你最终要做成这个样子" gallery hint if its gallery was completely removed right after it
  out = out.replace(/(<h3 class="gx-h">[^<]*你最终要做成这个样子[\s\S]*?<\/h3>)\s*(?=<h3|<p class="cfig-empty"|$)/gi, '$1<p style="font-size:13px;color:var(--muted);margin:6px 0 12px">💡 操作要点已按步骤整理在下方，结合本节顶部的结构图解对照练习即可完成成品。</p>');

  return { html: out, removedImgs, keptImgs, removedDeadPdfLinks };
}

/* =====================================================================
 * SMART NATURAL INSERTION INTO graphicHtml (Idempotent)
 * ===================================================================== */
function stripOldAutoFigs(html) {
  return String(html || '').replace(/<div class="diagram liora-auto-fig"[^>]*>[\s\S]*?<\/div>\s*/gi, '');
}

function injectDiagramsNaturally(courseId, html, diagrams) {
  const clean = stripOldAutoFigs(html);
  if (!diagrams || !diagrams.length) return clean;
  const block = '\n' + diagrams.join('\n') + '\n';

  // 1. After Claude's intro callout ("建议顺序") if present
  const calloutIdx = clean.search(/<div class="callout blue">[\s\S]*?<\/div>/i);
  if (calloutIdx !== -1) {
    const m = clean.match(/<div class="callout blue">[\s\S]*?<\/div>/i);
    const end = calloutIdx + m[0].length;
    return clean.slice(0, end) + block + clean.slice(end);
  }

  // 2. For English: right after Weekly Overview paragraph (before Skills & Tasks or first <ul>)
  if (courseId === 'english') {
    const m = clean.match(/<h4[^>]*>[\s\S]*?Overview[\s\S]*?<\/h4>\s*<p>[\s\S]*?<\/p>/i);
    if (m) {
      const end = m.index + m[0].length;
      return clean.slice(0, end) + block + clean.slice(end);
    }
  }

  // 3. For Computing / Extracurricular: right after first intro <p>...</p>
  const firstP = clean.match(/<p[^>]*>[\s\S]*?<\/p>/i);
  if (firstP && firstP.index < 900) {
    const end = firstP.index + firstP[0].length;
    return clean.slice(0, end) + block + clean.slice(end);
  }

  // Fallback: prepend cleanly
  return block + clean;
}

function countVisuals(w) {
  const g = w.graphicHtml || '';
  const a = typeof w.tutorialAnswers === 'string' ? w.tutorialAnswers : '';
  const gSvg = (g.match(/<svg\b/gi) || []).length;
  const aSvg = (a.match(/<svg\b/gi) || []).length;
  const gImg = (g.match(/<img\b/gi) || []).length;
  const aImg = (a.match(/<img\b/gi) || []).length;
  return { gSvg, aSvg, gImg, aImg, total: gSvg + aSvg + gImg + aImg };
}

function main() {
  console.log('Reading data.js ...');
  const rawDataJs = fs.readFileSync(DATA_JS, 'utf8');
  const prefixIdx = rawDataJs.indexOf('window.PORTAL_DATA');
  if (prefixIdx === -1) throw new Error('Could not find window.PORTAL_DATA in data.js');
  const jsonStart = rawDataJs.indexOf('{', prefixIdx);
  let jsonEnd = rawDataJs.lastIndexOf('}');
  const DATA = JSON.parse(rawDataJs.slice(jsonStart, jsonEnd + 1));

  const stats = {
    compRemovedImgs: 0,
    compKeptImgs: 0,
    compRemovedDeadPdfs: 0,
    addedFigs: 0,
    perCourse: {}
  };

  const COURSE_IDS = new Set(['accounting', 'economics', 'mathematics', 'computing', 'english', 'extracurricular']);

  for (const course of DATA.courses || []) {
    if (!COURSE_IDS.has(course.id)) continue;
    let cFigs = 0;
    let cWeeksWithFigs = 0;
    let cTotalWeeks = 0;

    for (const term of course.terms || []) {
      for (const week of term.weeks || []) {
        cTotalWeeks++;
        if (course.id === 'computing') {
          const res = cleanComputingHtml(week.graphicHtml || '');
          week.graphicHtml = res.html;
          stats.compRemovedImgs += res.removedImgs;
          stats.compKeptImgs += res.keptImgs;
          stats.compRemovedDeadPdfs += res.removedDeadPdfLinks;
        }

        const bespoke = getBespokeDiagrams(course.id, term.id, week.num);
        if (bespoke.length) {
          week.graphicHtml = injectDiagramsNaturally(course.id, week.graphicHtml || '', bespoke);
          stats.addedFigs += bespoke.length;
        }

        const vc = countVisuals(week);
        week.diagramCount = vc.total;
        cFigs += vc.total;
        if (vc.total > 0) cWeeksWithFigs++;
      }
    }

    course.diagramCount = cFigs;
    stats.perCourse[course.id] = { totalWeeks: cTotalWeeks, weeksWithFigs: cWeeksWithFigs, totalVisuals: cFigs };

    // Write course chunk JSON
    const chunkPath = path.join(COURSES_DIR, `${course.id}.json`);
    fs.writeFileSync(chunkPath, JSON.stringify(course), 'utf8');
  }

  // Update data-chunks/index.json with diagramCount per course and per week
  const indexPath = path.join(CHUNKS_DIR, 'index.json');
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const courseMap = new Map((DATA.courses || []).map(c => [c.id, c]));
  for (const ic of indexData.courses || []) {
    const full = courseMap.get(ic.id);
    if (!full) continue;
    ic.diagramCount = full.diagramCount || 0;
    for (const it of ic.terms || []) {
      const ft = (full.terms || []).find(t => t.id === it.id);
      if (!ft) continue;
      for (const iw of it.weeks || []) {
        const fw = (ft.weeks || []).find(w => Number(w.num) === Number(iw.num));
        if (fw) iw.diagramCount = fw.diagramCount || 0;
      }
    }
  }
  fs.writeFileSync(indexPath, JSON.stringify(indexData), 'utf8');

  // Re-write data.js preserving exact wrapper
  const tail = rawDataJs.slice(jsonEnd + 1);
  const newDataJs = rawDataJs.slice(0, jsonStart) + JSON.stringify(DATA) + tail;
  fs.writeFileSync(DATA_JS, newDataJs, 'utf8');

  console.log('\n=== Phase 4 Visual Diagram Summary ===');
  console.log('Computing broken <img> removed:', stats.compRemovedImgs, '| real <img> kept:', stats.compKeptImgs, '| dead PDF links cleaned:', stats.compRemovedDeadPdfs);
  console.log('New bespoke <svg> diagrams added:', stats.addedFigs);
  console.table(stats.perCourse);
}

main();
