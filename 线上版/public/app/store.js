/* Liora 学习小屋 · 统一按需数据加载 + 自动防抖云端同步 + 全局搜索 */
(function () {
  'use strict';

  var STATE_KEY = 'xinnan-portal-state-v1';
  var boot = window.__CLOUD_BOOT__ || {};
  var state = { weeks: {}, tasks: {}, lastVisit: null };
  var stateUpdatedAt = Number(boot.updatedAt) || 0;
  var syncTimer = null;

  var chunks = {
    index: null,
    courses: {},
    books: {}
  };

  /* 从云端 boot 与 localStorage 合并初始进度 */
  (function initProgress() {
    var local = null;
    try { local = JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); } catch (e) {}
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
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) {}
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
    var r = await fetch('/data-chunks/index.json?v=20261122-v8', { credentials: 'same-origin' });
    if (!r.ok) throw new Error('无法加载课程索引');
    chunks.index = await r.json();
    return chunks.index;
  }

  async function loadCourse(courseId) {
    if (chunks.courses[courseId]) return chunks.courses[courseId];
    var r = await fetch('/data-chunks/courses/' + encodeURIComponent(courseId) + '.json?v=20261122-v8', { credentials: 'same-origin' });
    if (!r.ok) throw new Error('课程数据加载失败：' + courseId);
    chunks.courses[courseId] = await r.json();
    return chunks.courses[courseId];
  }

  async function loadBook(bookId) {
    if (chunks.books[bookId]) return chunks.books[bookId];
    var r = await fetch('/data-chunks/books/' + encodeURIComponent(bookId) + '.json?v=20261122-v8', { credentials: 'same-origin' });
    if (!r.ok) throw new Error('书籍数据加载失败：' + bookId);
    chunks.books[bookId] = await r.json();
    return chunks.books[bookId];
  }

  async function searchAll(query) {
    var q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    var idx = await loadIndex();
    var out = [];
    (idx.courses || []).forEach(function (c) {
      (c.terms || []).forEach(function (t) {
        (t.weeks || []).forEach(function (w) {
          var hay = (c.nameCn + ' ' + c.name + ' ' + w.title + ' week ' + w.num).toLowerCase();
          if (hay.indexOf(q) >= 0) {
            out.push({
              title: c.nameCn + ' · ' + w.title,
              sub: t.name + ' · Week ' + w.num,
              href: '#/c/' + c.id + '/' + t.id + '/' + w.num
            });
          }
        });
      });
    });
    (idx.books || []).forEach(function (b) {
      if ((b.nameCn + ' ' + b.name).toLowerCase().indexOf(q) >= 0) {
        out.push({ title: '📖 ' + b.nameCn, sub: b.name + ' · ' + b.chapters + ' 章', href: '#/book/' + b.id });
      }
    });
    try {
      var gloss = await window.LioraStudyApi.loadGlossary();
      gloss.forEach(function (g) {
        if ((g.en + ' ' + g.zh + ' ' + g.def).toLowerCase().indexOf(q) >= 0) {
          out.push({ title: '🃏 ' + g.en + '（' + g.zh + '）', sub: g.def.slice(0, 56), href: '#/flashcards' });
        }
      });
    } catch (e) {}
    return out.slice(0, 14);
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
