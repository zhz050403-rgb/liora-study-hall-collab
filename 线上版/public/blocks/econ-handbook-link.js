/* =====================================================================
   经济学 U1–U7 中英对照总整理 · 主站入口注入
   ---------------------------------------------------------------------
   遵守站点红线：顶部导航维持「课外拓展 / 每日简报」两个入口不变，
   只在页脚与经济学课程页注入链接胶囊；不触碰 .note-tab，
   不接管任何既有 active 切换逻辑。index.html 只加这一行 script 引用。
   ===================================================================== */
(function () {
  'use strict';
  if (window.__lioraEconHandbookLink) return;
  window.__lioraEconHandbookLink = 1;
  if (document.querySelector('.eh-hero')) return;   /* 独立页本身不需要入口 */

  var SHARE = 'L4NKT6REQ6';
  var PAGE = 'econ-handbook.html?sharecode=' + SHARE;

  function css() {
    if (document.getElementById('ehChipStyle')) return;
    var s = document.createElement('style');
    s.id = 'ehChipStyle';
    s.textContent =
      '.eh-chip{display:inline-flex;align-items:center;gap:6px;margin:6px 8px 6px 0;padding:6px 12px;' +
      'border-radius:999px;background:#faf8f3;border:1px solid #d9d4c9;color:#171717;font-size:12.5px;' +
      'font-weight:800;text-decoration:none;line-height:1.4;vertical-align:middle}' +
      '.eh-chip:hover{border-color:#b03030;color:#b03030;text-decoration:none}' +
      'a.eh-footer-link{color:#c8dcf3!important}';
    document.head.appendChild(s);
  }

  function footerLink() {
    var footer = document.querySelector('footer.site-footer');
    if (!footer || footer.querySelector('a[href^="econ-handbook.html"]')) return;
    var col = footer.querySelector('.footer-col') || footer.querySelector('.footer-inner');
    if (!col) return;
    var a = document.createElement('a');
    a.href = PAGE;
    a.className = 'eh-footer-link';
    a.textContent = '经济学 U1–U7 中英对照总整理';
    a.title = '按 Unit 整理的经济学英文定义 / 中文理解 / 题目答案 / 错题追踪';
    col.appendChild(a);
  }

  function courseOfHash() {
    var m = /^#\/c\/([^/]+)/.exec(location.hash || '');
    return m ? decodeURIComponent(m[1]) : '';
  }

  function enhance() {
    css();
    footerLink();
    if (courseOfHash() !== 'economics') return;
    var head = document.querySelector('.wp-head');
    if (!head) return;
    var old = head.querySelector('.eh-chip');
    if (old) return;
    var a = document.createElement('a');
    a.className = 'eh-chip';
    a.href = PAGE;
    a.textContent = '📘 经济学 U1–U7 中英对照总整理';
    a.title = '黑色加粗英文定义 + 中文原文 + 红色考试重点，按 Unit 速查';
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
