'use strict';
/* 校验一周的结构化笔记：结构是否完整、课件例题有没有漏、答案能否复算、账页是否平衡、引用是否规范。
   errors 不为空时不允许发布；warnings 提示人工复查。 */
const { evaluate } = require('./expr');
const { postLedger, balanceOf, renderWeek, normName } = require('./render');

const CJK = /[一-鿿]/;

function textOf(note) { return JSON.stringify(note); }

function validateWeek(note, opts = {}) {
  const errors = [], warnings = [];
  const err = (where, msg) => errors.push(where + '：' + msg), warn = (where, msg) => warnings.push(where + '：' + msg);
  for (const k of ['course', 'term', 'week', 'sections', 'inventory']) if (note[k] == null) err('顶层', '缺少字段 ' + k);
  if (!Array.isArray(note.sections) || !note.sections.length) return { errors: errors.concat('顶层：sections 为空'), warnings, stats: {} };

  const covered = new Set();
  let exampleCount = 0, checkCount = 0;
  note.sections.forEach((s, si) => {
    const at = `第 ${si + 1} 节「${s.title || '?'}」`;
    if (!s.title) err(at, '缺少标题');
    if (!Array.isArray(s.sources) || !s.sources.length) err(at, '缺少来源（文件名和页码）');
    for (const src of s.sources || []) {
      if (!src.file || !src.pages) err(at, '来源要同时写文件名和页码');
      else if (opts.files && !opts.files.includes(src.file)) err(at, '来源文件不在本周资料里：' + src.file);
    }
    if (!s.concept || !CJK.test(s.concept)) err(at, '缺少中文「概念」讲解');
    if (!(s.mistakes || []).length) err(at, '缺少「易错」');
    if (!(s.faqs || []).length) err(at, '缺少「常见疑惑」');
    if (!(s.examples || []).length && !s.noExamples) err(at, '没有例题；如果这一节确实没有例题，写 noExamples: true 并说明');
    (s.examples || []).forEach((ex, ei) => {
      const where = `${at} 例 ${ei + 1}（${ex.ref || '无出处'}）`;
      exampleCount++;
      if (!ex.ref) err(where, '缺少出处（如 L13 Ex 2）');
      for (const r of [ex.ref, ...(ex.covers || [])]) if (r) covered.add(r);
      if (!ex.question) err(where, '缺少题目');
      if (!ex.solution || !CJK.test(ex.solution)) err(where, '缺少中文解答');
      if (ex.numeric !== false && !(ex.checks || []).length && !(ex.figures || []).some(f => f.type === 'ledger')) warn(where, '没有可复算的核对项（纯概念题请写 numeric: false）');
      for (const c of ex.checks || []) {
        checkCount++;
        try {
          const got = evaluate(c.expr), want = evaluate(String(c.equals));
          if (!(Math.abs(got - want) <= (c.tol ?? 1e-9))) err(where, `核对不通过：${c.expr} = ${got}，但写的是 ${c.equals}`);
        } catch (e) { err(where, '核对式无法计算：' + e.message); }
      }
      for (const fig of [...(ex.figures || []), ...(ex.questionFigures || [])]) {
        if (fig.type !== 'ledger') continue;
        try {
          const acc = postLedger(fig);
          for (const [name, want] of Object.entries(fig.expect || {})) {
            checkCount++;
            if (!acc.has(name)) err(where, '期望余额里的账户没有出现：' + name);
            else if (Math.abs(balanceOf(acc.get(name)) - want) > 1e-9) err(where, `${name} 余额是 ${balanceOf(acc.get(name))}，与原文给出的 ${want} 不符`);
          }
        } catch (e) { err(where, e.message); }
      }
    });
  });
  /* 逐题核对交付物：清单里写明这道题要交什么，例题里就必须由程序生成出来，缺一张都不行。 */
  const byRef = new Map();
  note.sections.forEach(s => (s.examples || []).forEach(ex => { for (const r of [ex.ref, ...(ex.covers || [])]) if (r) { if (!byRef.has(r)) byRef.set(r, []); byRef.get(r).push(ex); } }));
  for (const item of note.inventory || []) {
    const ref = typeof item === 'string' ? item : item.ref;
    if (!covered.has(ref)) { err('覆盖', '课件里的例题没有讲到：' + ref); continue; }
    if (typeof item === 'string') continue;
    const exs = byRef.get(ref);
    const figs = exs.flatMap(ex => [...(ex.figures || []), ...(ex.questionFigures || [])]);
    const ledgers = figs.filter(f => f.type === 'ledger');
    const views = new Set(ledgers.flatMap(f => f.views || ['taccounts']));
    const shownIn = view => ledgers.filter(f => (f.views || ['taccounts']).includes(view)).flatMap(f => f.show || [...postLedger(f).keys()]);
    const has = (list, name) => list.some(n => { const a = normName(n), b = normName(name); return a === b || a.startsWith(b) || b.startsWith(a); });
    const answered = new Set(exs.flatMap(ex => ex.parts || []));
    for (const p of item.parts || []) if (!answered.has(p)) err(ref, `小问 (${p}) 没有作答（例题的 parts 里没有它）`);
    for (const d of item.deliverables || []) {
      const t = d.type;
      if (t === 'taccounts' || t === 'columnar') {
        const shown = shownIn(t);
        if (!shown.length) err(ref, t === 'taccounts' ? '要求画 T 形账户，但答案里没有' : '要求用多栏式账户，但答案里没有');
        for (const a of d.accounts || []) if (!has(shown, a)) err(ref, `要求的账户「${a}」没有画出来`);
      } else if (t === 'balanced') {
        const done = ledgers.flatMap(f => f.balance === true ? (f.show || [...postLedger(f).keys()]) : (f.balance || []))
          .concat(shownIn('columnar'));
        for (const a of d.accounts || []) if (!has(done, a)) err(ref, `要求结账的账户「${a}」没有结出余额`);
      } else if (t === 'journal' || t === 'analysis') {
        if (!views.has(t)) err(ref, t === 'journal' ? '要求写分录表，但答案里没有' : '要求写交易分析表，但答案里没有');
      } else if (t === 'trialBalance') {
        if (!ledgers.some(f => f.trialBalance)) err(ref, '要求编试算平衡表，但答案里没有');
      } else if (t === 'figure') {
        if (!figs.some(f => f.type !== 'ledger')) err(ref, '要求作图，但答案里没有图');
      } else if (t === 'table') {
        if (!figs.some(f => f.type === 'table')) err(ref, '要求的表格没有给出：' + (d.title || ''));
      } else if (t === 'terms') {
        const txt = exs.map(ex => ex.solution).join(' ').toLowerCase();
        for (const term of d.terms || []) if (!txt.includes(String(term).toLowerCase())) err(ref, `要求解释的术语「${term}」没有写到`);
      } else err(ref, '不认识的交付物类型：' + t);
    }
  }
  const raw = textOf(note);
  const tags = raw.match(/<\/?([a-z]+)/g) || [];
  const bad = [...new Set(tags.map(t => t.replace(/[</]/g, '')).filter(t => !['strong', 'em', 'br', 'sub', 'sup'].includes(t)))];
  if (bad.length) warn('格式', '正文里出现了不允许的标签（会被转义显示）：' + bad.join(', '));
  try { renderWeek(note); } catch (e) { err('渲染', e.message); }
  return { errors, warnings, stats: { sections: note.sections.length, examples: exampleCount, inventory: (note.inventory || []).length, deliverables: (note.inventory || []).reduce((n, i) => n + ((i.deliverables || []).length + (i.parts || []).length), 0), checks: checkCount } };
}

module.exports = { validateWeek };
