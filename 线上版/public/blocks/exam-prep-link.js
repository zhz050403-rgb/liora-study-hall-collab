/* =====================================================================
   细节型考试备考 · 主站入口注入
   ---------------------------------------------------------------------
   遵守站点红线：顶部导航维持「课外拓展 / 每日简报」两个入口不变，
   只在页脚「学习」列与会计课程周页追加一个链接胶囊；不注入 .note-tab，
   不接管任何既有 active 切换逻辑。index.html 只加这一行 script 引用。
   ===================================================================== */
(function () {
  'use strict';
  if (window.__lioraExamPrepLink) return;
  window.__lioraExamPrepLink = 1;
  if (document.getElementById('epApp')) return;   /* 独立页不需要注入 */

  var SHARE = 'L4NKT6REQ6';
  var PAGE = 'exam-prep.html?sharecode=' + SHARE;
  var WEEK_UNIT = { 1: 1, 2: 3, 3: 4, 4: 5, 5: 6 };

  function css() {
    if (document.getElementById('epChipStyle')) return;
    var s = document.createElement('style');
    s.id = 'epChipStyle';
    s.textContent =
      '.ep-chip{display:inline-flex;align-items:center;gap:6px;margin:6px 8px 6px 0;padding:6px 12px;' +
      'border-radius:999px;background:#eef4fc;border:1px solid #c9dcf2;color:#1a4f88;font-size:12.5px;' +
      'font-weight:800;text-decoration:none;line-height:1.4;vertical-align:middle}' +
      '.ep-chip:hover{background:#dfeafb;text-decoration:none}' +
      'a.ep-footer-link{color:#c8dcf3!important}';
    document.head.appendChild(s);
  }

  function footerLink() {
    var footer = document.querySelector('footer.site-footer');
    if (!footer || footer.querySelector('a[href^="exam-prep.html"]')) return;
    var col = footer.querySelector('.footer-col') || footer.querySelector('.footer-inner');
    if (!col) return;
    var a = document.createElement('a');
    a.href = PAGE;
    a.className = 'ep-footer-link';
    a.textContent = '细节备考（2026 官方课件）';
    a.title = '按官方课件逐页提炼的细节题库：闭卷测试、原文追溯、覆盖率与错题复习';
    col.appendChild(a);
  }

  function courseOfHash() {
    var m = /^#\/c\/([^/]+)/.exec(location.hash || '');
    return m ? decodeURIComponent(m[1]) : '';
  }
  function weekOfHash() {
    var m = /^#\/c\/[^/]+\/[^/]+\/(\d+)/.exec(location.hash || '');
    return m ? Number(m[1]) : 0;
  }

  function enhance() {
    css();
    footerLink();
    if (courseOfHash() !== 'accounting') return;
    var head = document.querySelector('.wp-head');
    if (!head) return;
    var old = head.querySelector('.ep-chip');
    var week = weekOfHash();
    var unit = WEEK_UNIT[week] || 0;
    var href = PAGE + (unit ? '&unit=' + unit : '');
    var label = unit ? '🎯 细节备考 · Unit ' + unit : '🎯 细节备考（Accounting）';
    if (old) { old.setAttribute('href', href); old.textContent = label; return; }
    var a = document.createElement('a');
    a.className = 'ep-chip';
    a.href = href;
    a.textContent = label;
    a.title = '2026 官方课件逐页细节题库 · 英文出题 · 可追溯页码';
    head.appendChild(a);
  }

  function boot() {
    enhance();
    var timer = null;
    function schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { timer = null; try { enhance(); } catch (e) {} }, 240);
    }
    window.addEventListener('hashchange', function () { setTimeout(schedule, 60); });
    if (typeof MutationObserver === 'function') {
      var app = document.getElementById('app');
      if (app) new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].type === 'childList' && muts[i].addedNodes.length) { schedule(); return; }
        }
      }).observe(app, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
