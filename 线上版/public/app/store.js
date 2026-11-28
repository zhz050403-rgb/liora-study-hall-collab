/* Liora 学习小屋 · 统一按需数据加载 + 自动防抖云端同步 + 全局搜索 */
(function () {
  'use strict';

  var STATE_KEY = 'xinnan-portal-state-v1';
  var boot = window.__CLOUD_BOOT__ || {};
  /* 按当前登录账号严格隔离本机缓存，防止同一浏览器切换账号串数据 */
  var LOCAL_KEY = STATE_KEY + ':' + (boot.uid || boot.user || 'anon');
  var state = { weeks: {}, tasks: {}, lastVisit: null };
  var stateUpdatedAt = Number(boot.updatedAt) || 0;
  var syncTimer = null;

  var chunks = {
    index: null,
    courses: {},
    books: {}
  };

  /* 从云端 boot 与本账号专属 localStorage 合并初始进度 */
  (function initProgress() {
    var local = null;
    try { local = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); } catch (e) {}
    var cloudRaw = boot.data && boot.data[STATE_KEY];
    var cloud = null;
    try { if (cloudRaw) cloud = JSON.parse(cloudRaw); } catch (e) {}
    var merged = Object.assign({ weeks: {}, tasks: {}, lastVisit: null }, local || {}, cloud || {});
    if (local && cloud) {
      merged.weeks = Object.assign({}, local.weeks || {}, cloud.weeks || {});
      merged.tasks = Object.assign({}, local.tasks || {}, cloud.tasks || {});
      merged.lastVisit = cloud.lastVisit || local.lastVisit || null;
    }
    state = merged;
  })();

  function setSyncLabel(text, ok) {
    var el = document.getElementById('edSyncText');
    var dot = document.getElementById('edSyncDot');
    if (el) el.textContent = text;
    if (dot) dot.style.background = ok === false ? '#a92a2a' : '#1d6b48';
  }

  function scheduleSync() {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch (e) {}
    setSyncLabel('同步中…', true);
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async function () {
      try {
        var payloadData = Object.assign({}, (boot.data || {}));
        payloadData[STATE_KEY] = JSON.stringify(state);
        var r = await fetch('/__api/state', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ base: stateUpdatedAt, data: payloadData })
        });
        var j = await r.json().catch(function () { return {}; });
        if (r.status === 409 && j.updatedAt) {
          stateUpdatedAt = j.updatedAt;
          if (j.data && j.data[STATE_KEY]) {
            try {
              var remote = JSON.parse(j.data[STATE_KEY]);
              state.weeks = Object.assign({}, remote.weeks || {}, state.weeks || {});
              state.tasks = Object.assign({}, remote.tasks || {}, state.tasks || {});
            } catch (e) {}
          }
          scheduleSync();
          return;
        }
        if (r.ok && j.updatedAt) {
          stateUpdatedAt = j.updatedAt;
          setSyncLabel('已同步云端', true);
        }
      } catch (e) {
        setSyncLabel('已存本机', false);
      }
    }, 700);
  }

  function weekKey(cid, tid, wnum) { return cid + ':' + tid + ':' + wnum; }
  function isWeekDone(cid, tid, wnum) { return !!state.weeks[weekKey(cid, tid, wnum)]; }
  function toggleWeekDone(cid, tid, wnum) {
    var k = weekKey(cid, tid, wnum);
    if (state.weeks[k]) delete state.weeks[k];
    else state.weeks[k] = true;
    scheduleSync();
    return !!state.weeks[k];
  }
  function isTaskDone(taskKey) { return !!state.tasks[taskKey]; }
  function toggleTaskDone(taskKey) {
    if (state.tasks[taskKey]) delete state.tasks[taskKey];
    else state.tasks[taskKey] = true;
    scheduleSync();
    return !!state.tasks[taskKey];
  }
  function setLastVisit(hash, title) {
    state.lastVisit = { hash: hash, title: String(title || '').slice(0, 80), at: Date.now() };
    scheduleSync();
  }
  function getLastVisit() { return state.lastVisit; }

  function courseProgress(courseMeta) {
    var total = 0, done = 0;
    (courseMeta.terms || []).forEach(function (t) {
      (t.weeks || []).forEach(function (w) {
        total++;
        if (isWeekDone(courseMeta.id, t.id, w.num)) done++;
      });
    });
    return { total: total, done: done, pct: total ? Math.round(done / total * 100) : 0 };
  }

  /* 轻索引按需加载（首屏仅 23 KB） */
  async function loadIndex() {
    if (chunks.index) return chunks.index;
    var r = await fetch('/data-chunks/index.json?v=20261123-v10', { credentials: 'same-origin' });
    if (!r.ok) throw new Error('无法加载课程索引');
    chunks.index = await r.json();
    return chunks.index;
  }

  async function loadCourse(courseId) {
    if (chunks.courses[courseId]) return chunks.courses[courseId];
    var r = await fetch('/data-chunks/courses/' + encodeURIComponent(courseId) + '.json?v=20261128-v18', { credentials: 'same-origin' });
    if (!r.ok) throw new Error('课程数据加载失败：' + courseId);
    chunks.courses[courseId] = await r.json();
    return chunks.courses[courseId];
  }

  async function loadBook(bookId) {
    if (chunks.books[bookId]) return chunks.books[bookId];
    var r = await fetch('/data-chunks/books/' + encodeURIComponent(bookId) + '.json?v=20261123-v10', { credentials: 'same-origin' });
    if (!r.ok) throw new Error('书籍数据加载失败：' + bookId);
    chunks.books[bookId] = await r.json();
    return chunks.books[bookId];
  }

  /* 全文检索引擎：覆盖全部 107 周核心概念、非价格因素分点、双语笔记、小节标题、必考大题与 112 术语 */
  var searchIdxCache = null;
  async function loadSearchIndex() {
    if (searchIdxCache) return searchIdxCache;
    try {
      var r = await fetch('/data-chunks/search-index.json?v=20261128-v18', { credentials: 'same-origin' });
      if (r.ok) searchIdxCache = await r.json();
    } catch (e) {}
    return searchIdxCache;
  }

  function stemTok(tok) {
    return tok.replace(/(?:ies)$/, 'y').replace(/(?:es|s)$/, '');
  }

  async function searchAll(query) {
    var raw = String(query || '').trim();
    if (!raw) return [];
    var qLower = raw.toLowerCase();
    var tokens = qLower.split(/[\s,，、/]+/).filter(Boolean);
    var scored = [];

    var sIdx = await loadSearchIndex();
    var entries = (sIdx && Array.isArray(sIdx.entries)) ? sIdx.entries : [];
    var allowExtra = boot.role === 'admin' || (boot.perms && boot.perms.extra === true);

    if (entries.length) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (e.x && !allowExtra) continue;
        var titleL = String(e.t || '').toLowerCase();
        var bodyL = String(e.b || '').toLowerCase();
        var subL = String(e.s || '').toLowerCase();
        var full = titleL + ' ' + subL + ' ' + bodyL;

        var matched = 0;
        var titleHits = 0;
        for (var ti = 0; ti < tokens.length; ti++) {
          var tk = tokens[ti];
          var st = stemTok(tk);
          if (full.indexOf(tk) >= 0 || (st.length >= 3 && full.indexOf(st) >= 0)) {
            matched++;
            if (titleL.indexOf(tk) >= 0 || (st.length >= 3 && titleL.indexOf(st) >= 0)) titleHits++;
          }
        }
        /* 多词查询必须全部命中（或 >= 3 词时至少命中 n-1 词） */
        var minNeed = tokens.length <= 2 ? tokens.length : Math.max(2, tokens.length - 1);
        if (matched < minNeed) continue;

        var score = matched * 20 + titleHits * 35;
        if (titleL.indexOf(qLower) >= 0) score += 80;
        else if (bodyL.indexOf(qLower) >= 0) score += 45;
        if (e.k === 'concept') score += 30;
        else if (e.k === 'note') score += 16;
        else if (e.k === 'qa') score += 12;

        /* 截取命中上下文片段 */
        var bodyRaw = String(e.b || '');
        var pos = bodyL.indexOf(qLower);
        if (pos < 0) {
          for (var j = 0; j < tokens.length; j++) {
            var p2 = bodyL.indexOf(tokens[j]);
            if (p2 >= 0) { pos = p2; break; }
          }
        }
        var snip = '';
        if (bodyRaw) {
          var stPos = Math.max(0, (pos >= 0 ? pos : 0) - 24);
          snip = (stPos > 0 ? '…' : '') + bodyRaw.slice(stPos, stPos + 92) + (stPos + 92 < bodyRaw.length ? '…' : '');
        }
        var href = e.h;
        if (href && href.indexOf('#/c/') === 0) {
          href = href + '?q=' + encodeURIComponent(raw);
        }
        scored.push({ score: score, title: e.t, sub: e.s + (snip ? ' · ' + snip : ''), href: href });
      }
    }

    /* 补充书架匹配 */
    try {
      var idx = await loadIndex();
      (idx.books || []).forEach(function (b) {
        if ((b.nameCn + ' ' + b.name).toLowerCase().indexOf(qLower) >= 0) {
          scored.push({ score: 50, title: '📖 ' + b.nameCn, sub: b.name + ' · ' + b.chapters + ' 章', href: '#/book/' + b.id });
        }
      });
    } catch (e) {}

    scored.sort(function (a, b) { return b.score - a.score; });
    var seenHrefTitle = {};
    var out = [];
    for (var k = 0; k < scored.length && out.length < 18; k++) {
      var key = scored[k].href + '|' + scored[k].title;
      if (seenHrefTitle[key]) continue;
      seenHrefTitle[key] = true;
      out.push(scored[k]);
    }
    return out;
  }

  window.LioraStore = {
    loadIndex: loadIndex,
    loadCourse: loadCourse,
    loadBook: loadBook,
    isWeekDone: isWeekDone,
    toggleWeekDone: toggleWeekDone,
    isTaskDone: isTaskDone,
    toggleTaskDone: toggleTaskDone,
    setLastVisit: setLastVisit,
    getLastVisit: getLastVisit,
    courseProgress: courseProgress,
    searchAll: searchAll
  };
})();
