/* =====================================================================
   Liora 学习小屋 · 细节型考试备考引擎 (Fine-detail Exam Prep)
   ---------------------------------------------------------------------
   数据：exam-bank-data.js（生成器编译，官方引文已逐页校验）
         exam-sources.js （真实 2026 PDF 的逐页原文）
   原则：
     · 闭卷：提交前不出现答案、解析、原文
     · 严格批改：全对只给简短确认；答错给完整题目 + 正确答案 + 原因 + 教材依据
     · 每个知识点可有多题；重测换题干与选项顺序（variants）
     · 错题库按 当天 / 1 天 / 3 天 / 7 天 复测，猜对或不确定也算需复习
     · 官方原文 / 讲义表述 / AI 生成内容 三类来源明确分色标注
   ===================================================================== */
(function () {
  'use strict';
  var BANK = window.EXAM_BANK;
  var SOURCES = window.EXAM_SOURCES || [];
  var APP = document.getElementById('epApp');
  if (!BANK || !APP) return;
  if (window.__lioraExamPrep) return;
  window.__lioraExamPrep = 1;

  var SHARE = 'L4NKT6REQ6';
  var VIDEO_PAGE = 'bilingual-video.html?sharecode=' + SHARE;
  var HOME = 'index.html?sharecode=' + SHARE;
  var KEY = 'liora-exam-prep-v1';
  var SRC_BY_ID = {};
  SOURCES.forEach(function (s) { SRC_BY_ID[s.id] = s; });
  var KP_BY_ID = {};
  BANK.knowledgePoints.forEach(function (k) { KP_BY_ID[k.id] = k; });
  var QS = BANK.questions;
  var Q_BY_ID = {};
  QS.forEach(function (q) { Q_BY_ID[q.id] = q; });
  var QS_BY_KP = {};
  QS.forEach(function (q) { (QS_BY_KP[q.kp] = QS_BY_KP[q.kp] || []).push(q); });

  /* ---------------- storage ---------------- */
  function loadDB() {
    try { var d = JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (e) { d = {}; }
    d.records = d.records || {};
    d.log = d.log || [];
    return d;
  }
  var DB = loadDB();
  function saveDB() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function addDays(iso, n) {
    var p = iso.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function record(qid) {
    return DB.records[qid] || { attempts: 0, correct: 0, stage: 4, weak: false, nextDue: null, history: [], reason: '' };
  }
  var DELAYS = [0, 1, 3, 7];               /* stage 0/1/2/3 -> 当天 / +1 / +3 / +7 */
  function onGrade(qid, ok, guessed) {
    var r = record(qid);
    r.attempts++;
    if (ok) r.correct++;
    r.lastSeen = today();
    r.history = r.history || [];
    r.history.push({ t: Date.now(), ok: !!ok, g: !!guessed, stage: r.stage });
    if (r.history.length > 30) r.history.shift();
    if (!ok || guessed) {
      r.weak = true; r.stage = 0; r.nextDue = today();
      r.reason = ok ? 'guessed' : 'wrong';
    } else if (r.weak) {
      r.stage = Math.min((r.stage || 0) + 1, 4);
      if (r.stage >= 4) { r.weak = false; r.nextDue = null; r.reason = 'mastered'; }
      else { r.nextDue = addDays(today(), DELAYS[r.stage]); r.reason = 'review-' + r.stage; }
    } else {
      r.stage = 4; r.nextDue = null; r.reason = 'ok';
    }
    DB.records[qid] = r;
    DB.log.push({ q: qid, t: Date.now(), ok: !!ok, g: !!guessed });
    if (DB.log.length > 800) DB.log.shift();
    saveDB();
  }

  /* ---------------- state ---------------- */
  var S = {
    view: 'exam', unit: 0, cat: '', search: '',
    mode: 'exam', count: 12,
    session: [], responses: {}, submitted: false, practiceIdx: 0,
    modal: null, pageOf: null
  };
  /* 课程周页链接可带 &unit=N / &view=... 直达 */
  try {
    var qs = new URLSearchParams(location.search || '');
    var u0 = Number(qs.get('unit'));
    if (u0 >= 1 && u0 <= 6) S.unit = u0;
    var v0 = qs.get('view');
    if (['exam', 'index', 'coverage', 'review', 'sources'].indexOf(v0) >= 0) S.view = v0;
  } catch (e) {}

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function unitName(u) {
    var x = BANK.units.filter(function (a) { return a.id === u; })[0];
    return x ? ('Unit ' + u + ' · ' + x.title) : ('Unit ' + u);
  }
  function catLabel(c) {
    return ({
      definition: 'Definitions', classification: 'Classifications',
      characteristic: 'Characteristics', example: 'Examples',
      difference: 'Differences', 'accounting-rule': 'Accounting Rules',
      calculation: 'Calculations', 'small-detail': 'Small Details'
    })[c] || c;
  }
  function typeLabel(t) {
    return ({
      single: 'Single choice', multiple: 'Multiple choice', tf: 'True / False',
      definition: 'Definition recognition', fill: 'Fill in the blanks',
      classification: 'Classification', calculation: 'Calculation',
      journal: 'Journal entry', taccount: 'T-account', trialbalance: 'Trial balance'
    })[t] || t;
  }
  function sourceLine(q) {
    var f = SRC_BY_ID[q.sourceFile];
    return (f ? f.sourceFile : q.sourceFile) + ' · p.' + q.page;
  }
  function normalText(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function pageSize(q) { return 1; }

  /* ---------------- variant materialisation ---------------- */
  function materialise(q, vi) {
    var out = {};
    for (var k in q) if (Object.prototype.hasOwnProperty.call(q, k)) out[k] = q[k];
    /* vi === -1 表示首测用原始题；只有复习重测才套变式，保证题干与选项顺序必变 */
    var v = vi === -1 ? null : (q.variants || [])[vi || 0];
    if (v) {
      if (v.question != null) out.question = v.question;
      if (v.options != null) out.options = v.options;
      if (v.correctAnswer != null) out.correctAnswer = v.correctAnswer;
      if (v.accepted != null) out.accepted = v.accepted;
      if (v.fields != null) out.fields = v.fields;
      if (v.accountOptions != null) out.accountOptions = v.accountOptions;
    }
    out._vi = vi === -1 ? 0 : (vi || 0);
    return out;
  }

  /* ---------------- grading ---------------- */
  function grade(q, r) {
    if (!r) r = {};
    var a = q.correctAnswer, i;
    switch (q.type) {
      case 'single': case 'definition': case 'tf': case 'classification':
        return r.value != null && Number(r.value) === Number(a);
      case 'multiple':
        var got = (r.value || []).slice().sort(function (x, y) { return x - y; });
        var exp = (a || []).slice().sort(function (x, y) { return x - y; });
        return got.length === exp.length && got.every(function (v, k) { return Number(v) === Number(exp[k]); });
      case 'fill':
        var t = normalText(r.value);
        if (!t) return false;
        var acc = [q.correctAnswer].concat(q.accepted || []);
        return acc.some(function (x) { return normalText(x) === t; });
      case 'calculation': case 'taccount': case 'trialbalance':
        var fs = q.fields || [], vals = (r.value && r.value.fields) || [];
        if (vals.length !== fs.length) return false;
        for (i = 0; i < fs.length; i++) {
          var f = fs[i], gv = vals[i];
          if (f.type === 'number') {
            if (gv === '' || gv == null || isNaN(parseFloat(gv))) return false;
            if (Math.abs(parseFloat(gv) - Number(f.answer)) > 0.01) return false;
          } else if (String(gv) !== String(f.answer)) return false;
        }
        return true;
      case 'journal':
        var rows = (r.value && r.value.rows) || [], exp2 = q.rows || [];
        if (rows.length !== exp2.length) return false;
        var used = [];
        for (i = 0; i < exp2.length; i++) {
          var e = exp2[i], found = -1;
          for (var j = 0; j < rows.length; j++) {
            if (used.indexOf(j) >= 0) continue;
            var g = rows[j] || {};
            if (String(g.account) === String(e.account) && String(g.side) === String(e.side)) {
              if (q.amountOptional || e.amount == null) found = j;
              else if (Math.abs(parseFloat(g.amount) - Number(e.amount)) < 0.01) found = j;
              if (found >= 0) break;
            }
          }
          if (found < 0) return false;
          used.push(found);
        }
        return true;
      default: return false;
    }
  }
  function answerText(q) {
    var a = q.correctAnswer, i, out = [];
    switch (q.type) {
      case 'single': case 'definition': case 'tf': case 'classification':
        return (q.options && q.options[a] != null) ? q.options[a] : String(a);
      case 'multiple':
        return (a || []).map(function (n) { return q.options ? q.options[n] : n; }).join(' ; ');
      case 'fill': return String(a);
      case 'calculation': case 'taccount': case 'trialbalance':
        (q.fields || []).forEach(function (f) { out.push(f.label + ' = ' + f.answer); });
        return out.join(' ; ');
      case 'journal':
        (q.rows || []).forEach(function (r) {
          out.push(r.side + ' ' + r.account + (r.amount != null ? ' $' + r.amount : ''));
        });
        return out.join(' ; ');
      default: return String(a);
    }
  }

  /* ---------------- session building ---------------- */
  function pick(arr, n, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a.slice(0, n);
  }
  function seedRand(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function poolFor(mode) {
    if (mode === 'review') {
      var due = QS.filter(function (q) { var r = DB.records[q.id]; return r && r.weak && r.nextDue && r.nextDue <= today(); });
      return due;
    }
    return QS.filter(function (q) {
      if (S.unit && q.unit !== S.unit) return false;
      if (S.cat && q.cat !== S.cat) return false;
      return true;
    });
  }
  function startSession(mode, kpId) {
    var pool = poolFor(mode), rng = seedRand(Date.now() & 0xffffffff);
    if (kpId) {
      pool = (QS_BY_KP[kpId] || []).slice();
      S.mode = 'practice';
    } else S.mode = mode;
    if (!pool.length) { alert(mode === 'review' ? '当前没有到期的错题。先做一套测试，或等复习日到了再来。' : '这个筛选条件下没有题目，换个 Unit 或分类试试。'); return; }
    var n = kpId ? Math.min(3, pool.length) : (mode === 'review' ? Math.min(20, pool.length) : (S.mode === 'practice' ? Math.min(S.count, pool.length) : Math.min(S.count, pool.length)));
    var chosen = pick(pool, n, rng);
    S.session = chosen.map(function (q) {
      var r = DB.records[q.id];
      var vi = mode === 'review' ? ((r ? r.stage : 0) % 2) : -1;
      var active = materialise(q, vi);
      return { src: q, active: active, ok: null, guessed: false };
    });
    S.responses = {}; S.submitted = false; S.practiceIdx = 0;
    S.view = 'exam';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- DOM collection ---------------- */
  function collect() {
    var nodes = APP.querySelectorAll('[data-qid]');
    Array.prototype.forEach.call(nodes, function (node) {
      var qid = node.getAttribute('data-qid');
      var item = null;
      for (var i = 0; i < S.session.length; i++) if (S.session[i].active.id === qid) { item = S.session[i]; break; }
      if (!item) return;
      var q = item.active, val = {}, g = node.querySelector('[data-guess]');
      item.guessed = !!(g && g.checked);
      switch (q.type) {
        case 'multiple':
          val.value = Array.prototype.map.call(node.querySelectorAll('input[data-opt]:checked'), function (x) { return Number(x.getAttribute('data-opt')); });
          break;
        case 'single': case 'definition': case 'tf': case 'classification':
          var c = node.querySelector('input[data-opt]:checked');
          val.value = c ? Number(c.getAttribute('data-opt')) : null;
          break;
        case 'fill':
          var f = node.querySelector('[data-fill]'); val.value = f ? f.value : '';
          break;
        case 'calculation': case 'taccount': case 'trialbalance':
          val.value = { fields: Array.prototype.map.call(node.querySelectorAll('[data-field]'), function (x) { return x.value; }) };
          break;
        case 'journal':
          val.value = { rows: Array.prototype.map.call(node.querySelectorAll('[data-row]'), function (row) {
            return {
              account: (row.querySelector('[data-part=account]') || {}).value || '',
              side: (row.querySelector('[data-part=side]') || {}).value || '',
              amount: (row.querySelector('[data-part=amount]') || {}).value || ''
            };
          }) };
          break;
      }
      S.responses[qid] = val;
    });
  }
  function submitAll() {
    collect();
    S.session.forEach(function (it) {
      it.ok = grade(it.active, S.responses[it.active.id]);
      onGrade(it.active.id, it.ok, it.guessed);
    });
    S.submitted = true;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function submitOne() {
    collect();
    var it = S.session[S.practiceIdx];
    if (!it) return;
    it.ok = grade(it.active, S.responses[it.active.id]);
    onGrade(it.active.id, it.ok, it.guessed);
    if (S.practiceIdx >= S.session.length - 1) S.submitted = true;
    else { S.practiceIdx++; S.responses[it.active.id] = S.responses[it.active.id]; }
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- question rendering ---------------- */
  function optionHtml(q, r, disabled) {
    var chosen = (r && r.value) || [];
    if (!Array.isArray(chosen)) chosen = chosen == null ? [] : [chosen];
    var multi = q.type === 'multiple';
    return '<div class="ep-opts">' + (q.options || []).map(function (o, i) {
      var on = chosen.map(Number).indexOf(i) >= 0;
      return '<label class="ep-opt' + (on ? ' sel' : '') + '" data-opt="' + i + '">' +
        '<input type="' + (multi ? 'checkbox' : 'radio') + '" name="o_' + esc(q.id) + '" value="' + i + '" data-opt="' + i + '"' +
        (on ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
        '<span class="ep-opt-key">' + String.fromCharCode(65 + i) + '.</span><span>' + esc(o) + '</span></label>';
    }).join('') + '</div>';
  }
  function fieldsHtml(q, r, disabled) {
    var vals = (r && r.value && r.value.fields) || [];
    return '<div class="ep-grid">' + (q.fields || []).map(function (f, i) {
      var v = vals[i] == null ? '' : vals[i];
      var input = f.type === 'choice'
        ? '<select class="ep-input" data-field="' + i + '"' + (disabled ? ' disabled' : '') + '><option value="">Choose…</option>' +
          (f.options || []).map(function (o) { return '<option' + (String(o) === String(v) ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>'
        : '<input class="ep-input" type="number" step="any" data-field="' + i + '" value="' + esc(v) + '" placeholder="number"' + (disabled ? ' disabled' : '') + '>';
      return '<div><label class="ep-label">' + esc(f.label) + '</label>' + input + '</div>';
    }).join('') + '</div>';
  }
  function journalHtml(q, r, disabled) {
    var rows = (r && r.value && r.value.rows) || [];
    var accounts = q.accountOptions || [];
    return (q.rows || []).map(function (exp, i) {
      var cur = rows[i] || {};
      return '<div class="ep-journal-row" data-row="' + i + '">' +
        '<select class="ep-select" data-part="account"' + (disabled ? ' disabled' : '') + '><option value="">Account…</option>' +
        accounts.map(function (a) { return '<option' + (a === cur.account ? ' selected' : '') + '>' + esc(a) + '</option>'; }).join('') + '</select>' +
        '<select class="ep-select" data-part="side"' + (disabled ? ' disabled' : '') + '>' +
        ['Dr', 'Cr'].map(function (a) { return '<option' + (a === cur.side ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select>' +
        '<input class="ep-input" type="number" step="any" data-part="amount" value="' + esc(cur.amount || '') + '" placeholder="amount"' + (disabled ? ' disabled' : '') + '>' +
        '</div>';
    }).join('') + (q.amountOptional ? '<div class="ep-sub">金额可不填（本题只考账户与借贷方向）。</div>' : '');
  }
  function answerInputHtml(q, r, disabled) {
    switch (q.type) {
      case 'single': case 'definition': case 'tf': case 'classification': case 'multiple':
        return optionHtml(q, r, disabled);
      case 'fill':
        return '<div class="ep-field"><input class="ep-input" data-fill="1" value="' + esc((r && r.value) || '') + '" placeholder="Type the exact official wording"' + (disabled ? ' disabled' : '') + '></div>';
      case 'calculation': case 'taccount': case 'trialbalance': return fieldsHtml(q, r, disabled);
      case 'journal': return journalHtml(q, r, disabled);
      default: return '';
    }
  }
  function sourceBox(q, small) {
    var f = SRC_BY_ID[q.sourceFile];
    return '<div class="ep-quote"><span class="ep-tag ep-tag-official">官方原文 · 2026</span>' +
      esc(q.originalText) + '<div class="ep-src">' + esc(sourceLine(q)) +
      ' · <button class="ep-source-toggle" data-src="' + esc(q.sourceFile) + '" data-page="' + q.page + '">查看教材原文 ↗</button>' +
      (f ? ' · SHA256 ' + esc(f.sha256.slice(0, 12)) + '…' : '') + '</div></div>';
  }
  function feedbackHtml(it) {
    var q = it.active, ok = it.ok;
    if (ok && !it.guessed) return '<div class="ep-after"><div class="ep-ok">✓ Correct.</div>' +
      '<button class="ep-source-toggle" data-src="' + esc(q.sourceFile) + '" data-page="' + q.page + '">查看官方依据 ↗</button>' + sourceBox(q) + '</div>';
    if (ok && it.guessed) return '<div class="ep-after"><div class="ep-wrong">你答对了，但标记为「不确定 / 猜的」，已按错题进入复习计划。' +
      '<span class="ep-answer">正确答案：' + esc(answerText(q)) + '</span></div>' +
      '<div class="ep-rubric"><b>错误原因：</b>未确认掌握，不能凭选项位置记答案。' + esc(q.rubric || '') + '</div>' +
      '<div class="ep-rubric"><b>解析：</b>' + esc(q.explanation || '') + '</div>' + sourceBox(q) + '</div>';
    var given = S.responses[q.id] ? describeGiven(q, S.responses[q.id]) : '（未作答）';
    return '<div class="ep-after"><div class="ep-wrong"><b>✗ Incorrect.</b> 你的作答：' + esc(given) +
      '<span class="ep-answer">正确答案：' + esc(answerText(q)) + '</span></div>' +
      '<div class="ep-rubric"><b>错误原因 / 依据：</b>' + esc(q.explanation || '') +
      ' <b>评分规则：</b>' + esc(q.rubric || '') + '</div>' + sourceBox(q) + '</div>';
  }
  function describeGiven(q, r) {
    if (!r || r.value == null) return '（未作答）';
    if (q.type === 'multiple') return (r.value || []).map(function (i) { return q.options ? q.options[i] : i; }).join(' ; ') || '（未选择）';
    if (['single', 'definition', 'tf', 'classification'].indexOf(q.type) >= 0) return q.options && q.options[r.value] != null ? q.options[r.value] : String(r.value);
    if (q.type === 'fill') return String(r.value || '（未填写）');
    if (q.type === 'journal') return (r.value.rows || []).map(function (x) { return x.side + ' ' + x.account + ' ' + x.amount; }).join(' ; ');
    return (r.value.fields || []).join(' ; ');
  }
  function questionHtml(it, idx, showFeedback) {
    var q = it.active, r = S.responses[q.id];
    var kp = KP_BY_ID[q.kp] || {};
    var disabled = showFeedback;
    return '<div class="ep-q" data-qid="' + esc(q.id) + '">' +
      '<div class="ep-q-head"><span class="ep-q-num">Q' + (idx + 1) + '</span>' +
      '<span class="ep-pill">' + esc(typeLabel(q.type)) + '</span>' +
      '<span class="ep-pill">' + esc(catLabel(q.cat)) + '</span>' +
      (q.flag ? '<span class="ep-tag ep-tag-trap">' + esc(q.flag) + '</span>' : '') +
      '<span class="ep-q-meta">Unit ' + q.unit + ' · ' + esc(q.topic) + '<br>' + esc(sourceLine(q)) +
      (q._vi ? ' · 变式 ' + (q._vi + 1) : '') + '</span></div>' +
      '<div class="ep-q-stem">' + esc(q.question) + '</div>' +
      answerInputHtml(q, r, disabled) +
      (disabled ? '' : '<label class="ep-guess"><input type="checkbox" data-guess="1"' + (it.guessed ? ' checked' : '') + '>我是猜的 / 不确定（即使答对也计入复习）</label>') +
      (showFeedback ? feedbackHtml(it) : '') +
      '</div>';
  }

  /* ---------------- views ---------------- */
  function tabsHtml() {
    var due = dueCount();
    var tabs = [
      ['exam', '闭卷测试'], ['index', '知识点索引'], ['coverage', '覆盖率'],
      ['review', '错题复习' + (due ? ' <span class="ep-badge">' + due + '</span>' : '')],
      ['sources', '资料原文']
    ];
    var locked = S.session.length && !S.submitted && S.mode !== 'practice';
    return '<nav class="ep-tabs"><div class="ep-wrap ep-row">' + tabs.map(function (t) {
      var dis = locked && t[0] !== 'exam';
      return '<button class="ep-tab' + (S.view === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '"' +
        (dis ? ' disabled title="闭卷进行中：先交卷或退出测试"' : '') + '>' + t[1] + '</button>';
    }).join('') + '</div></nav>';
  }
  function dueCount() {
    return QS.filter(function (q) { var r = DB.records[q.id]; return r && r.weak && r.nextDue && r.nextDue <= today(); }).length;
  }
  function toolbarHtml() {
    var units = '<option value="0">全部 Unit 1–6</option>' + BANK.units.map(function (u) {
      return '<option value="' + u.id + '"' + (S.unit === u.id ? ' selected' : '') + '>Unit ' + u.id + ' · ' + esc(u.title) + '</option>';
    }).join('');
    var cats = ['', 'definition', 'classification', 'characteristic', 'example', 'difference', 'accounting-rule', 'calculation', 'small-detail'];
    return '<div class="ep-toolbar">' +
      '<div><label class="ep-label">范围</label><select class="ep-select" id="epUnit">' + units + '</select></div>' +
      '<div><label class="ep-label">知识点类型</label><select class="ep-select" id="epCat">' + cats.map(function (c) {
        return '<option value="' + c + '"' + (S.cat === c ? ' selected' : '') + '>' + (c ? esc(catLabel(c)) : '全部类型') + '</option>';
      }).join('') + '</select></div>' +
      '<div><label class="ep-label">题量</label><select class="ep-select" id="epCount">' +
      [8, 12, 20, 30, 50].map(function (n) { return '<option value="' + n + '"' + (S.count === n ? ' selected' : '') + '>' + n + ' 题</option>'; }).join('') + '</select></div>' +
      '</div>';
  }
  function viewExam() {
    if (!S.session.length) {
      return '<div class="ep-card"><h2>闭卷模拟测试</h2>' +
        '<p class="ep-sub">题目与选项全部为英文，来自 2026 UNSW 官方课件逐页提取的知识点。提交前不显示答案、解析与原文。</p>' +
        '<div class="ep-note"><b>规则</b>：全对只给一句确认；答错则给出完整题目、正确答案、错误原因与教材页码依据。' +
        '勾选「我是猜的 / 不确定」即使答对也会进入错题库。错题按 <b>当天订正 → 1 天 → 3 天 → 7 天</b> 用变式题重测。</div>' +
        toolbarHtml() +
        '<div class="ep-row"><button class="ep-btn" data-act="start-exam">开始闭卷测试</button>' +
        '<button class="ep-btn ep-btn-2" data-act="start-practice">逐题自由练习</button>' +
        '<button class="ep-btn ep-btn-2" data-act="start-review">错题重测' + (dueCount() ? '（' + dueCount() + ' 题到期）' : '') + '</button></div>' +
        '</div>' +
        '<div class="ep-card"><h3>这套系统如何保证「能追溯」</h3><p class="ep-sub">' +
        '所有知识点与题目由构建脚本编译，' + BANK.stats.knowledgePoints + ' 个知识点、' + BANK.stats.questions +
        ' 道题的每一条英文原文都会拿去与真实 2026 PDF 的指定页做逐字比对；比对失败则整包拒绝生成。' +
        '当前已核验 ' + BANK.stats.sources + ' 份资料 / ' + BANK.stats.sourcePages + ' 页，官方引文校验全部通过。</p>' +
        '<div class="ep-row"><span class="ep-tag ep-tag-official">官方原文</span><span>逐字摘自 2026 PDF，带文件名与页码</span></div>' +
        '<div class="ep-row" style="margin-top:8px"><span class="ep-tag ep-tag-teacher">讲义表述</span><span>课堂讲义措辞；与 Reading 定义不一致时以 Reading 为准</span></div>' +
        '<div class="ep-row" style="margin-top:8px"><span class="ep-tag ep-tag-ai">AI 生成</span><span>题干、选项、解析、备考提示（非官方考题）</span></div>' +
        '</div>';
    }
    var all = S.session, done = all.filter(function (x) { return x.ok !== null; }).length;
    var correct = all.filter(function (x) { return x.ok === true; }).length;
    var head = '';
    if (S.submitted) {
      var pct = all.length ? Math.round(correct / all.length * 100) : 0;
      head = '<div class="ep-score"><div><div class="ep-score-big">' + correct + ' / ' + all.length + '</div><small>正确率 ' + pct + '%</small></div>' +
        '<div class="ep-score-txt">' + (correct === all.length
          ? '<b>All correct.</b> 已确认掌握本组题目。'
          : '已完成批改。下方逐题给出正确答案、错误原因与教材依据；答错或标记「不确定」的题目已自动进入错题库。') +
        '<br><span style="font-size:12.5px;color:#b9cfe8">错题库按当天 / 1 天 / 3 天 / 7 天安排变式重测。</span></div></div>' +
        '<div class="ep-row" style="margin-bottom:16px"><button class="ep-btn ep-btn-2" data-act="restart">再测一组</button>' +
        '<button class="ep-btn ep-btn-2" data-act="go-review">查看错题复习</button></div>';
    } else if (S.mode === 'practice') {
      head = '<div class="ep-lock">逐题练习 · 第 ' + (S.practiceIdx + 1) + ' / ' + all.length + ' 题。提交本题后才显示解析与教材原文。</div>';
    } else {
      head = '<div class="ep-lock">🔒 闭卷进行中：答案、解析与官方原文在交卷前全部隐藏。共 ' + all.length + ' 题。</div>';
    }
    var body;
    if (S.mode === 'practice' && !S.submitted) {
      body = questionHtml(all[S.practiceIdx], S.practiceIdx, false);
      body += '<div class="ep-row"><button class="ep-btn" data-act="submit-one">提交本题</button>' +
        '<button class="ep-btn ep-btn-2" data-act="quit">退出本次练习</button></div>';
    } else {
      body = all.map(function (it, i) { return questionHtml(it, i, S.submitted || it.ok !== null); }).join('');
      if (!S.submitted) body += '<div class="ep-row"><button class="ep-btn ep-btn-gold" data-act="submit-all">提交试卷并批改</button>' +
        '<button class="ep-btn ep-btn-2" data-act="quit">退出（不记分）</button></div>';
    }
    return head + body;
  }
  function viewIndex() {
    var list = BANK.knowledgePoints.filter(function (k) {
      if (S.unit && k.unit !== S.unit) return false;
      if (S.cat && k.cat !== S.cat) return false;
      if (S.search) {
        var hay = (k.term + ' ' + k.fact + ' ' + k.originalText + ' ' + k.topic + ' ' + (k.note || '')).toLowerCase();
        if (hay.indexOf(S.search.toLowerCase()) < 0) return false;
      }
      return true;
    });
    return '<div class="ep-card"><h2>知识点索引</h2><p class="ep-sub">共 ' + BANK.knowledgePoints.length +
      ' 个可考查知识点，含一句话定义、角落文字与限定条件。点任一条看官方原文、页码与相关题目。</p>' +
      '<div class="ep-toolbar">' +
      '<div><label class="ep-label">范围</label><select class="ep-select" id="epUnit"><option value="0">全部 Unit 1–6</option>' +
      BANK.units.map(function (u) { return '<option value="' + u.id + '"' + (S.unit === u.id ? ' selected' : '') + '>Unit ' + u.id + ' · ' + esc(u.title) + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="ep-label">知识点类型</label><select class="ep-select" id="epCat">' +
      ['', 'definition', 'classification', 'characteristic', 'example', 'difference', 'accounting-rule', 'calculation', 'small-detail'].map(function (c) {
        return '<option value="' + c + '"' + (S.cat === c ? ' selected' : '') + '>' + (c ? esc(catLabel(c)) : '全部类型') + '</option>';
      }).join('') + '</select></div>' +
      '<div style="flex:1;min-width:260px"><label class="ep-label">搜索</label><input class="ep-input" id="epSearch" placeholder="Goodwill、Clarity、Ledger、secondary entry…" value="' + esc(S.search) + '"></div>' +
      '</div></div>' +
      '<div class="ep-kp-list">' + (list.length ? list.map(function (k) {
        return '<div class="ep-kp" data-kp="' + esc(k.id) + '"><div class="ep-kp-top">' +
          '<span class="ep-kp-term">' + esc(k.term) + '</span>' +
          '<span class="ep-pill">U' + k.unit + '</span><span class="ep-pill">' + esc(catLabel(k.cat)) + '</span>' +
          (k.flag ? '<span class="ep-tag ep-tag-trap">' + esc(k.flag) + '</span>' : '') +
          '<span class="ep-pill">' + k.questionCount + ' 题</span></div>' +
          '<div class="ep-kp-fact">' + esc(k.fact) + '</div>' +
          '<div class="ep-kp-src">官方依据：' + esc(sourceLine(k)) + ' · ' + esc(k.originalText.slice(0, 110)) + '…</div></div>';
      }).join('') : '<div class="ep-empty">没有匹配的知识点，换个关键词试试。</div>') + '</div>';
  }
  function viewCoverage() {
    var rows = BANK.units.map(function (u) {
      var kps = BANK.knowledgePoints.filter(function (k) { return k.unit === u.id; });
      var qs = QS.filter(function (q) { return q.unit === u.id; });
      var withQ = kps.filter(function (k) { return k.questionCount > 0; }).length;
      var attempted = qs.filter(function (q) { return DB.records[q.id] && DB.records[q.id].attempts; }).length;
      var tries = 0, hits = 0;
      qs.forEach(function (q) { var r = DB.records[q.id]; if (r) { tries += r.attempts; hits += r.correct; } });
      var weak = qs.filter(function (q) { var r = DB.records[q.id]; return r && r.weak; }).length;
      var files = BANK.sourceSummary.filter(function (f) { return f.unit === u.id; });
      var verified = files.filter(function (f) { return f.status === 'verified'; }).length;
      return '<tr><td><b>Unit ' + u.id + '</b><br><span class="ep-file">' + esc(u.title) + '</span></td>' +
        '<td>' + kps.length + '</td><td>' + withQ + ' / ' + kps.length + '<div class="ep-bar good"><i style="width:' + (kps.length ? Math.round(withQ / kps.length * 100) : 0) + '%"></i></div></td>' +
        '<td>' + qs.length + '</td><td>' + attempted + '</td><td>' + (tries ? Math.round(hits / tries * 100) + '%' : '—') + '</td>' +
        '<td>' + (weak ? '<b style="color:var(--ep-red)">' + weak + '</b>' : '0') + '</td>' +
        '<td><span class="ep-status-v">' + verified + '</span> / ' + files.length + '</td></tr>';
    }).join('');
    var unver = BANK.sourceSummary.filter(function (f) { return f.status !== 'verified'; });
    return '<div class="ep-card"><h2>知识覆盖率</h2>' +
      '<p class="ep-sub">「已发现知识点」= 已从官方资料逐页读出的考点；「已出题」= 已转换成英文练习题。' +
      '资料状态区分 <b>已读取并核对</b> 与 <b>仅抽取文本、尚未逐页核对</b>：PDF 已上传不等于内容已完整读取。</p>' +
      '<div style="overflow-x:auto"><table class="ep-table"><thead><tr><th>Unit</th><th>已发现知识点</th><th>已生成题目</th><th>题目数</th><th>已做题目</th><th>正确率</th><th>薄弱点</th><th>资料已核对</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="ep-card"><h3>尚未读取 / 尚未逐页核对的资料（' + unver.length + '）</h3>' +
      '<p class="ep-sub">这些文件已抽取文本，但本轮没有逐页核对并提炼考点，因此不计入「已覆盖」。不能把它们当作已验证。</p>' +
      (unver.length ? unver.map(function (f) {
        return '<div class="ep-file">· <span class="ep-status-u">未核对</span> ' + esc(f.sourceFile) +
          '（' + f.pages + ' 页）</div>';
      }).join('') : '<div class="ep-file">无</div>') + '</div>' +
      '<div class="ep-card"><h3>题库覆盖口径</h3><p class="ep-sub">' +
      '本轮 P0 覆盖 Accounting U1–U6 的 Lecture / Reading / Tutorial 共 ' + BANK.stats.sources + ' 份 2026 官方 PDF、' +
      BANK.stats.sourcePages + ' 页，其中 ' + BANK.stats.verifiedSources + ' 份已逐页核对。' +
      '题库由知识点自动扩写为单选、定义识别、填空、判断、分类、多选等角度，每道题保留两条变式用于错题重测。' +
      'U7–U11 与其他科目属于 P1 / P2，尚未纳入本包，页面不会把它们显示为已覆盖。</p></div>';
  }
  function viewReview() {
    var due = [], later = [];
    QS.forEach(function (q) {
      var r = DB.records[q.id];
      if (!r || !r.weak) return;
      (r.nextDue && r.nextDue <= today() ? due : later).push({ q: q, r: r });
    });
    later.sort(function (a, b) { return (a.r.nextDue || '').localeCompare(b.r.nextDue || ''); });
    var stageName = ['当天订正', '1 天后重测', '3 天后重测', '7 天后检验', '已掌握'];
    function row(x) {
      return '<tr><td>' + esc(x.q.question.slice(0, 110)) + '…</td><td>Unit ' + x.q.unit + '</td>' +
        '<td>' + esc(typeLabel(x.q.type)) + '</td><td>' + esc(stageName[Math.min(x.r.stage, 4)]) + '</td>' +
        '<td>' + esc(x.r.nextDue || '—') + '</td><td>' + x.r.attempts + ' 次 / ' + x.r.correct + ' 对</td>' +
        '<td>' + esc(x.r.reason === 'guessed' ? '猜对 / 不确定' : x.r.reason === 'wrong' ? '答错' : x.r.reason) + '</td></tr>';
    }
    return '<div class="ep-card"><h2>错题复习</h2>' +
      '<p class="ep-sub">答错、猜对或标记「不确定」的题目自动进入这里。复测使用<b>不同的题干与选项顺序</b>，避免只记住答案位置。' +
      '每次复测通过才推进到下一档：当天订正 → 1 天 → 3 天 → 7 天。</p>' +
      '<div class="ep-row"><button class="ep-btn" data-act="start-review"' + (due.length ? '' : ' disabled') + '>开始今日复测（' + due.length + ' 题）</button>' +
      '<button class="ep-btn ep-btn-2" data-act="reset-progress">清空做题记录</button></div></div>' +
      '<div class="ep-card"><h3>今天到期（' + due.length + '）</h3>' +
      (due.length ? '<div style="overflow-x:auto"><table class="ep-table"><thead><tr><th>题目</th><th>Unit</th><th>题型</th><th>阶段</th><th>到期日</th><th>作答</th><th>原因</th></tr></thead><tbody>' + due.map(row).join('') + '</tbody></table></div>' : '<div class="ep-empty">今天没有到期的错题 👍</div>') + '</div>' +
      '<div class="ep-card"><h3>排期等待中（' + later.length + '）</h3>' +
      (later.length ? '<div style="overflow-x:auto"><table class="ep-table"><thead><tr><th>题目</th><th>Unit</th><th>题型</th><th>阶段</th><th>下次复测</th><th>作答</th><th>原因</th></tr></thead><tbody>' + later.map(row).join('') + '</tbody></table></div>' : '<div class="ep-empty">暂无排期</div>') + '</div>';
  }
  function viewSources() {
    return '<div class="ep-card"><h2>官方资料与原文追溯</h2>' +
      '<p class="ep-sub">全部资料来自 2026 STD O2 官方课程文件夹，逐页文本由本地 PDF 真实抽取，附 SHA256 便于复核。' +
      '点「查看逐页原文」可读到该页完整英文原文；PDF 链接在本地服务器可用，正式发布时若未随包上传会明确提示。</p></div>' +
      BANK.units.map(function (u) {
        var fs = BANK.sourceSummary.filter(function (f) { return f.unit === u.id; });
        return '<div class="ep-card"><h3>Unit ' + u.id + ' · ' + esc(u.title) + '</h3>' +
          fs.map(function (f) {
            return '<div class="ep-row" style="border-bottom:1px solid var(--ep-line2);padding:9px 0;align-items:flex-start">' +
              '<span class="ep-tag ' + (f.status === 'verified' ? 'ep-tag-official' : 'ep-tag-teacher') + '">' +
              (f.status === 'verified' ? '已读取核对' : '仅抽取文本') + '</span>' +
              '<div style="flex:1;min-width:220px"><div class="ep-file"><b>' + esc(f.kind) + '</b> · ' + esc(f.sourceFile) + '</div>' +
              '<div class="ep-file ep-mono">' + f.pages + ' 页 · SHA256 ' + esc(f.sha256.slice(0, 20)) + '…</div></div>' +
              '<button class="ep-btn ep-btn-2 ep-btn-sm" data-src="' + esc(f.id) + '" data-page="1">查看逐页原文</button>' +
              '</div>';
          }).join('') + '</div>';
      }).join('');
  }

  /* ---------------- modal ---------------- */
  function modalHtml() {
    if (!S.modal) return '';
    var m = S.modal;
    if (m.type === 'source') {
      var f = SRC_BY_ID[m.id];
      if (!f) return '';
      var p = Math.min(Math.max(m.page || 1, 1), f.pages);
      var text = f.pageText[p - 1] || '（此页无可抽取文本，可能是图片或空白页）';
      return '<div class="ep-modal" data-modal="1"><div class="ep-modal-in">' +
        '<div class="ep-modal-head"><div><span class="ep-tag ep-tag-official">官方原文 · 2026 逐页摘录</span>' +
        '<h3>' + esc(f.sourceFile) + '</h3><div class="ep-src">PDF 第 ' + p + ' / ' + f.pages + ' 页 · SHA256 ' + esc(f.sha256) + '</div></div>' +
        '<button class="ep-x" data-act="close-modal" aria-label="关闭">×</button></div>' +
        '<div class="ep-modal-body">' + esc(text) + '</div>' +
        '<div class="ep-modal-foot">' +
        '<button class="ep-btn ep-btn-2 ep-btn-sm" data-act="page-prev"' + (p <= 1 ? ' disabled' : '') + '>← 上一页</button>' +
        '<button class="ep-btn ep-btn-2 ep-btn-sm" data-act="page-next"' + (p >= f.pages ? ' disabled' : '') + '>下一页 →</button>' +
        '<a class="ep-btn ep-btn-sm" target="_blank" rel="noopener" href="' + esc(f.pdfUrl) + '#page=' + p + '">打开原始 PDF 第 ' + p + ' 页 ↗</a>' +
        '<span class="ep-file" style="margin-left:auto">正式发布时若 PDF 未随包上传，请看左侧逐页原文（内容一致）。</span>' +
        '</div></div></div>';
    }
    if (m.type === 'kp') {
      var k = KP_BY_ID[m.id];
      if (!k) return '';
      var qs = QS_BY_KP[k.id] || [];
      var videos = BANK.videoLinks.filter(function (v) { return v.unit === k.unit; });
      var teacher = k.provenance === 'teacher-note';
      return '<div class="ep-modal" data-modal="1"><div class="ep-modal-in">' +
        '<div class="ep-modal-head"><div><span class="ep-pill">Unit ' + k.unit + '</span><span class="ep-pill">' + esc(catLabel(k.cat)) + '</span>' +
        (k.flag ? '<span class="ep-tag ep-tag-trap">' + esc(k.flag) + '</span>' : '') +
        '<h3>' + esc(k.term) + '</h3><div class="ep-src">' + esc(k.topic) + ' · ' + qs.length + ' 道练习题</div></div>' +
        '<button class="ep-x" data-act="close-modal" aria-label="关闭">×</button></div>' +
        '<div class="ep-modal-body">' +
        '<p style="margin:0 0 10px"><b>考点（AI 归纳）：</b>' + esc(k.fact) + '</p>' +
        '<div class="ep-quote"><span class="ep-tag ' + (teacher ? 'ep-tag-teacher' : 'ep-tag-official') + '">' +
        (teacher ? '讲义表述' : '官方原文 · 2026') + '</span>' + esc(k.originalText) +
        '<div class="ep-src">' + esc(sourceLine(k)) +
        ' · <button class="ep-source-toggle" data-src="' + esc(k.sourceFile) + '" data-page="' + k.page + '">查看教材原文 ↗</button></div></div>' +
        (k.extra || []).map(function (e) {
          return '<div class="ep-quote"><span class="ep-tag ep-tag-official">互相印证 · 官方原文</span>' + esc(e[2]) +
            '<div class="ep-src">' + esc(e[0]) + ' · p.' + e[1] +
            ' · <button class="ep-source-toggle" data-src="' + esc(e[0]) + '" data-page="' + e[1] + '">查看教材原文 ↗</button></div></div>';
        }).join('') +
        (k.note ? '<div class="' + (teacher ? 'ep-teacher-note' : 'ep-ai-note') + '"><span class="ep-tag ' +
          (teacher ? 'ep-tag-teacher' : 'ep-tag-ai') + '">' + (teacher ? '讲义表述 / 差异说明' : 'AI 备考提示') + '</span>' + esc(k.note) + '</div>' : '') +
        '<div class="ep-divider"></div><h3 style="font-size:14px">相关双语视频（辅助资源）</h3>' +
        videos.map(function (v) {
          return '<div class="ep-file" style="margin-bottom:8px"><span class="ep-tag ep-tag-ai">' + esc(v.relation) + '</span>' +
            '<a href="' + esc(VIDEO_PAGE + '&course=' + v.course + '&unit=' + v.unit) + '">' + esc(v.label) + ' ↗</a><br>' + esc(v.note) + '</div>';
        }).join('') +
        '<p class="ep-sub" style="margin-top:10px">视频仅作辅助，<b>官方资料决定考试知识范围</b>；中英文两讲可能来自不同教师，与逐条考点的对应关系未逐条核验。</p>' +
        '</div><div class="ep-modal-foot"><button class="ep-btn" data-act="drill-kp" data-kp="' + esc(k.id) + '">练这个知识点（' + Math.min(3, qs.length) + ' 题）</button>' +
        '<span class="ep-file" style="margin-left:auto">题目与选项为 AI 生成，官方引文为逐字摘录。</span></div></div></div>';
    }
    return '';
  }

  /* ---------------- render ---------------- */
  function render() {
    var body = '';
    switch (S.view) {
      case 'index': body = viewIndex(); break;
      case 'coverage': body = viewCoverage(); break;
      case 'review': body = viewReview(); break;
      case 'sources': body = viewSources(); break;
      default: body = viewExam();
    }
    APP.innerHTML = '<div class="ep-hero"><div class="ep-wrap ep-hero-in"><div>' +
      '<div class="ep-kicker">LIORA 学习小屋 · 2026 UNSW 官方课件备考</div>' +
      '<h1>细节型考试备考</h1>' +
      '<p>逐页提取官方 Lecture / Reading / Tutorial 的一句话定义、分类、限定条件与角落细节，转成英文练习题。每题可翻回原始 PDF 页码。</p></div>' +
      '<div class="ep-hero-side"><a class="ep-back" href="' + esc(HOME) + '">← 返回学习小屋</a></div></div></div>' +
      tabsHtml() + '<main class="ep-main"><div class="ep-wrap">' + body + '</div></main>' + modalHtml();
  }

  /* ---------------- events ---------------- */
  APP.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-act],[data-tab],[data-src],[data-kp],[data-opt]');
    if (!t) return;
    if (t.hasAttribute('data-tab')) {
      var tab = t.getAttribute('data-tab');
      if (tab !== S.view) { collect(); S.view = tab; render(); }
      return;
    }
    if (t.hasAttribute('data-src')) {
      S.modal = { type: 'source', id: t.getAttribute('data-src'), page: Number(t.getAttribute('data-page')) || 1 };
      render(); return;
    }
    if (t.hasAttribute('data-kp') && !t.hasAttribute('data-act')) {
      S.modal = { type: 'kp', id: t.getAttribute('data-kp') }; render(); return;
    }
    var act = t.getAttribute('data-act');
    if (!act) return;
    switch (act) {
      case 'close-modal': S.modal = null; render(); break;
      case 'page-prev': if (S.modal) { S.modal.page = Math.max(1, (S.modal.page || 1) - 1); render(); } break;
      case 'page-next':
        if (S.modal) { var f = SRC_BY_ID[S.modal.id]; S.modal.page = Math.min(f ? f.pages : 1, (S.modal.page || 1) + 1); render(); }
        break;
      case 'start-exam': syncToolbar(); startSession('exam'); break;
      case 'start-practice': syncToolbar(); startSession('practice'); break;
      case 'start-review': startSession('review'); break;
      case 'submit-all': submitAll(); break;
      case 'submit-one': submitOne(); break;
      case 'restart': S.session = []; S.modal = null; render(); break;
      case 'quit': S.session = []; S.modal = null; render(); break;
      case 'go-review': S.session = []; S.view = 'review'; render(); break;
      case 'drill-kp': S.modal = null; syncToolbar(); startSession('practice', t.getAttribute('data-kp')); break;
      case 'reset-progress':
        if (confirm('确定清空所有做题记录与错题复习进度？此操作不可撤销。')) {
          DB = { records: {}, log: [] }; saveDB(); render();
        }
        break;
    }
  });
  APP.addEventListener('input', function (ev) {
    if (ev.target.id === 'epSearch') {
      S.search = ev.target.value;
      var pos = ev.target.selectionStart;
      clearTimeout(window.__epSearchTimer);
      window.__epSearchTimer = setTimeout(function () {
        collect(); render();
        var el = document.getElementById('epSearch');
        if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} }
      }, 260);
    }
  });
  APP.addEventListener('change', function (ev) {
    if (ev.target.id === 'epUnit') { S.unit = Number(ev.target.value) || 0; render(); }
    if (ev.target.id === 'epCat') { S.cat = ev.target.value; render(); }
    if (ev.target.id === 'epCount') { S.count = Number(ev.target.value) || 12; }
    if (ev.target.hasAttribute && ev.target.hasAttribute('data-guess')) {
      var node = ev.target.closest('[data-qid]');
      if (node) {
        var qid = node.getAttribute('data-qid');
        S.session.forEach(function (it) { if (it.active.id === qid) it.guessed = ev.target.checked; });
      }
    }
  });
  function syncToolbar() {
    var u = document.getElementById('epUnit'), c = document.getElementById('epCat'), n = document.getElementById('epCount');
    if (u) S.unit = Number(u.value) || 0;
    if (c) S.cat = c.value;
    if (n) S.count = Number(n.value) || 12;
  }

  render();
})();
