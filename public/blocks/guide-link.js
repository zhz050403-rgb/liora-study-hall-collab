/* ============================================================
 * 学习小屋 · 使用指南入口（页脚小链接）
 * ------------------------------------------------------------
 * index.html 是冻结的共享骨架，本文件只由一行 <script> 引用加载，
 * 由它在页脚「学习」栏目末尾追加一个链接，不改导航、不改任何业务逻辑。
 * 找不到页脚时静默退出，不影响页面。
 * ============================================================ */
(function () {
  'use strict';

  var HREF = 'guide.html?sharecode=';

  function add() {
    var footer = document.querySelector('footer.site-footer');
    if (!footer) return;
    if (footer.querySelector('a[href^="guide.html"]')) return; /* 不重复添加 */

    var col = footer.querySelector('.footer-col') || footer.querySelector('.footer-inner');
    if (!col) return;

    var a = document.createElement('a');
    a.href = HREF;
    a.textContent = '使用指南';
    a.title = '一页看懂：怎么打开、每天怎么用、按钮都在哪儿';
    col.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', add);
  } else {
    add();
  }
})();
