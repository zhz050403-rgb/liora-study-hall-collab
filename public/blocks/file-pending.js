/* 判断某个课件 / 资料文件是否指向「线上未上传」的源目录。
   这些目录（Course_*、FNDN Economics 2025 STD O1、富爸爸穷爸爸、小岛经济学、活得更好）
   在 server.js 的 EXCLUDED_DIRS 里整包外置（发布体积限制），线上访问会返回 404 友好页。
   前端据此把列表项标成「待补传」，去掉虚假的「打开 / 下载」按钮，
   避免用户点了才发现拿不到。
   注意：sources / reading-sources 视为已上传，不算待补传。 */
(function () {
  var PENDING_SRC_RE = /^(Course_ FNDN |FNDN Economics 2025 STD O1|富爸爸穷爸爸|小岛经济学|活得更好)/;
  window.isPendingFile = function (f) {
    return !!(f && f.src && PENDING_SRC_RE.test(f.src));
  };
  window.countPending = function (files) {
    var n = 0;
    (files || []).forEach(function (f) { if (window.isPendingFile(f)) n++; });
    return n;
  };
})();
