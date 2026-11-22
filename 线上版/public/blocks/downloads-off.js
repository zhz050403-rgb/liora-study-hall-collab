/* ============================================================
   资料下载功能整体下线（2026-11-16）

   背景：课程原版资料里有 297 份并不在部署包内，若要把「打开 / 下载」
   全部补齐，需额外搬运约 885 MB 文件，部署包会过大。用户决定直接
   撤掉这个功能，而不是继续补文件。

   index.html 是冻结文件，只允许改 <script> 引用行与 ?v=，因此这里：
     1) 在主逻辑执行前把旧的「待补传」判定接管，避免渲染出指向 404
        的「打开 / 下载」链接；
     2) 注入样式，让资料区在渲染瞬间也不闪现；
     3) 用 MutationObserver 把周面板「📎 资料下载」、AI 批改页
        「各课程考核资料」以及可能残留的侧栏入口从 DOM 里真正移除。
   ============================================================ */
(function () {
  "use strict";

  /* 1) 旧渲染函数仍会读这两个全局。全部判为不可用，即使样式未生效，
        也不会再生成指向缺失文件的可点击链接。 */
  window.isPendingFile = function () { return true; };
  window.countPending = function (files) { return (files || []).length; };

  /* 2) 立即注入样式，防止切周 / 首次渲染时资料区一闪而过。 */
  var style = document.createElement("style");
  style.id = "downloads-off-css";
  style.textContent = [
    "#app .wp-downloads,",
    "#app #assessAnchor,",
    "#app .fg-sub,",
    "#app .file-group,",
    "#app .f-open,",
    "#app .f-download,",
    ".ws-tree [data-tree-jump='downloads'],",
    ".ws-tree [data-tree-jump='other']{display:none!important}"
  ].join("\n");
  (document.head || document.documentElement).appendChild(style);

  /* 3) 真正摘除节点。周次 / 视图切换都会重新 innerHTML，需持续生效。 */
  var SELECTORS = [
    "#app .wp-downloads",
    "#app #assessAnchor",
    "#app .fg-sub",
    "#app .file-group",
    ".ws-tree [data-tree-jump='downloads']",
    ".ws-tree [data-tree-jump='other']"
  ];

  function scrub() {
    SELECTORS.forEach(function (sel) {
      var list;
      try { list = document.querySelectorAll(sel); } catch (e) { return; }
      Array.prototype.forEach.call(list, function (el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    });
    /* 兜底：旧版缓存的侧栏若用纯文字按钮，按文案清掉整个直连条目。 */
    Array.prototype.forEach.call(
      document.querySelectorAll(".ws-tree .tleaf, .tree-direct button"),
      function (b) {
        if (!/资料下载|其他资料/.test(b.textContent || "")) return;
        var box = b.closest ? b.closest(".tree-direct") : null;
        var target = box || b;
        if (target.parentNode) target.parentNode.removeChild(target);
      });
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; scrub(); }, 0);
  }

  if (window.MutationObserver) {
    new MutationObserver(schedule).observe(
      document.documentElement, { childList: true, subtree: true });
  }
  document.addEventListener("DOMContentLoaded", schedule);
  window.addEventListener("hashchange", schedule);
  window.addEventListener("load", schedule);
  schedule();
})();
