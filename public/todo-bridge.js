/* 主站 ↔ 桌面待办小组件 的实时互通桥（主站唯一新增的脚本，不改任何现有逻辑）
   桌面小组件打勾 / 云端拉到新进度时，把主站内存里的 PP.done 刷新，
   并只重画首页的「今日任务 / 本周 DDL」两块，其它页面完全不碰。 */
(function () {
  'use strict';
  var KEY_RE = /^(lioraTodo|liora-review-calendar-v1|liora-prep-postpone-v1|cabin-homework-)/;
  var busy = false;

  function refresh() {
    try {
      if (window.PP) {
        PP.done = JSON.parse(localStorage.getItem('liora-review-calendar-v1') || '{}') || {};
        PP.postpone = JSON.parse(localStorage.getItem('liora-prep-postpone-v1') || '{}') || {};
      }
    } catch (e) {}
    var h = location.hash || '';
    if (h !== '' && h !== '#/' && h !== '#/index') return;   /* 只在首页重画 */
    if (typeof window.renderHomeTaskBoards !== 'function' || !window.DATA || !DATA.courses) return;
    try {
      var courses = DATA.courses.filter(function (c) { return !c.extra && !c.reading; });
      window.renderHomeTaskBoards(courses);
    } catch (e) {}
  }
  function schedule() {
    if (busy) return;
    busy = true;
    setTimeout(function () { busy = false; refresh(); }, 60);
  }
  /* 同一浏览器里，桌面小组件窗口写入 localStorage 会触发 storage */
  window.addEventListener('storage', function (e) {
    if (!e.key || KEY_RE.test(e.key)) schedule();
  });
  /* cloud-sync.js 从云端拉到新数据后会派发 hashchange */
  window.addEventListener('hashchange', schedule);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(); });
})();
