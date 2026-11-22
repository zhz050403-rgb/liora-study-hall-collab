/* 复习导航跳转修复（2026-11-15）
 * 问题：
 *   1) 「直接跳到本周笔记」用 scrollIntoView({block:'start'})，目标停在视口 top=0，
 *      被 75px 吸顶导航整个盖住 —— 和术语表跳转是同一个病。
 *   2) 「打开 W1 / 回到 W1」的 href 与当前 hash 完全相同，浏览器不触发 hashchange，
 *      点了零反应（实测 scrollDelta=0）。
 *   3) 「复习计划 · 看今天必做」只换页到 #/prep 顶部，没有把「今天必做」送到眼前。
 * 做法：捕获阶段统一接管 #wpReview 内的这几类点击（不改动 index.html 内联逻辑），
 *      先切好笔记视图/页签，再按 .site-header 高度做确定性滚动，并做一次轻高亮。
 * 注意：只接管「笔记按钮 / hash 相同的链接 / #/prep」；跳别的周、思维导图外链保持原生行为。
 */
(function () {
  'use strict';
  window.__reviewJumpVersion = '20261115-review-jump1';

  function headerH() {
    var h = document.querySelector('.site-header');
    return h ? h.getBoundingClientRect().height : 0;
  }
  function scrollParent(node) {
    var el = node.parentElement;
    while (el && el !== document.body) {
      var oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) return el;
      el = el.parentElement;
    }
    return document.documentElement;
  }
  /* 目标停在吸顶导航正下方 pad 处，兼容 window 滚动与内层容器滚动 */
  function scrollToEl(el, pad) {
    if (!el) return;
    if (pad == null) pad = 14;
    var hh = headerH();
    var sc = scrollParent(el);
    var r = el.getBoundingClientRect();
    if (sc === document.documentElement || sc === document.body) {
      var y = r.top + window.pageYOffset - hh - pad;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    } else {
      var sr = sc.getBoundingClientRect();
      sc.scrollTo({ top: Math.max(0, r.top - sr.top - hh - pad), behavior: 'smooth' });
    }
  }
  function flash(el) {
    if (!el) return;
    var t = el.querySelector ? (el.querySelector('.wp-sec-t') || el) : el;
    var old = t.style.backgroundColor;
    var oldTr = t.style.transition;
    t.style.transition = 'background-color .45s';
    t.style.backgroundColor = '#fff3c4';
    setTimeout(function () {
      t.style.backgroundColor = old;
      setTimeout(function () { t.style.transition = oldTr; }, 500);
    }, 1500);
  }
  function appEl(sel) {
    var app = document.getElementById('app');
    return app ? app.querySelector(sel) : null;
  }
  /* 本周笔记区：优先整块「学习笔记」标题，其次标签栏 / 版本切换栏 */
  function noteTarget() {
    return appEl('.note-sec') || appEl('.note-tabs') || appEl('.nv-switch') ||
           appEl('.eng-sec') || appEl('.wp-sections');
  }
  function headTarget() {
    return appEl('.wp-head') || appEl('.wp-sections') || noteTarget();
  }
  function openFolds(el) {
    var p = el, guard = 0;
    while (p && guard++ < 8) {
      if (p.tagName === 'DETAILS') p.open = true;
      p = p.parentElement;
    }
  }
  /* 先切到「文字版 + 笔记页签」，等 DOM 稳定后再滚，避免重渲染把滚动位置带偏 */
  function jumpToNotes() {
    try { if (window.NoteViews && window.NoteViews.switchTo) window.NoteViews.switchTo('note'); } catch (e) {}
    var tab = appEl('.note-tab[data-ntab="note"]');
    if (tab && !tab.classList.contains('active')) { try { tab.click(); } catch (e) {} }
    setTimeout(function () {
      var el = noteTarget();
      if (!el) return;
      openFolds(el);
      scrollToEl(el);
      flash(el);
    }, 90);
  }
  function jumpToHead() {
    setTimeout(function () {
      var el = headTarget();
      if (!el) return;
      openFolds(el);
      scrollToEl(el);
      flash(el);
    }, 40);
  }

  /* ---- 复习计划：换页后把「今天必做」送到眼前 ---- */
  var pendingToday = false;
  function focusToday(tries) {
    var el = document.getElementById('secToday');
    if (el) {
      openFolds(el);
      setTimeout(function () { scrollToEl(el); flash(el); }, 60);
      return;
    }
    if (tries < 40) setTimeout(function () { focusToday(tries + 1); }, 100);
  }
  window.addEventListener('hashchange', function () {
    if (!pendingToday) return;
    pendingToday = false;
    if (location.hash === '#/prep' || location.hash.indexOf('#/plan') === 0) focusToday(0);
  });

  /* ---- 捕获阶段接管 ----
     在 document 捕获阶段 stopPropagation，可阻止目标元素上原有的 click 监听器
     （index.html bindWeekPanel 里绑在按钮本身的 scrollIntoView）执行。 */
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t && t.nodeType === 3) t = t.parentElement;
    if (!t || !t.closest) return;
    var el = t.closest('#wpReview a, #wpReview button');
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var isNoteBtn = el.hasAttribute('data-rv-note');
    var isHashLink = href.indexOf('#/') === 0;
    if (!isNoteBtn && !isHashLink) return;           /* mindmap.html 等外链不拦截 */
    var cur = location.hash || '#/';
    var same = isHashLink && href === cur;
    var isPrep = href === '#/prep';
    if (!isNoteBtn && !same && !isPrep) return;     /* 跳别的周保持原生行为 */

    ev.preventDefault();
    ev.stopPropagation();
    if (isNoteBtn) { jumpToNotes(); return; }
    if (isPrep) {
      pendingToday = true;
      if (location.hash === href) { focusToday(0); } else { location.hash = href; }
      return;
    }
    /* href 与当前 hash 相同：浏览器不会给任何反馈，这里补上明确的滚动 */
    if (el.classList.contains('rv-card')) jumpToNotes();
    else jumpToHead();
  }, true);
})();
