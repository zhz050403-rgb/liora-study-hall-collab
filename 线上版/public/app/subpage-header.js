/* 独立子页统一顶栏身份与权限控制器（与主站 main.js 保持 100% 一致） */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initSubHeader() {
    var boot = window.__CLOUD_BOOT__ || {};
    var isAdmin = boot.role === 'admin';
    var perms = boot.perms || {};
    var nav = document.getElementById('edMainNav');
    var inSubdir = location.pathname.indexOf('/english/') === 0;
    var prefix = inSubdir ? '../' : '';

    if (nav) {
      if (!isAdmin) {
        if (perms.extra !== true) {
          var ex = nav.querySelector('a[data-nav="extra"]');
          if (ex) ex.style.display = 'none';
        }
        if (perms.reading === false) {
          var rd = nav.querySelector('a[data-nav="reading"]');
          if (rd) rd.style.display = 'none';
        }
        if (perms.english === false) {
          var en = nav.querySelector('a[data-nav="english"]');
          if (en) en.style.display = 'none';
        }
      }
      if (isAdmin && !nav.querySelector('a[data-nav="admin"]')) {
        var admA = document.createElement('a');
        admA.setAttribute('data-nav', 'admin');
        admA.href = prefix + 'index.html#/admin';
        admA.textContent = '🛡️ 管理员';
        admA.style.cssText = 'color:#9f7820;font-weight:700';
        nav.appendChild(admA);
      }
    }

    var syncEl = document.getElementById('edSyncChip');
    if (syncEl && boot.user) {
      syncEl.style.cssText = 'gap:6px;padding:3px 9px;border-radius:999px;background:var(--navy-050);border:1px solid var(--line);color:var(--navy-900);font-weight:600;flex-shrink:0';
      syncEl.title = '学习进度自动同步云端 · 当前登录：' + boot.user;
      syncEl.innerHTML =
        '<i id="edSyncDot"></i>' +
        '<span>' + (isAdmin ? '🛡️ ' : '👤 ') + esc(boot.user) + '</span>' +
        '<a href="/__logout" style="color:var(--muted);font-weight:500;text-decoration:none;border-left:1px solid var(--line);padding-left:6px">退出</a>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSubHeader);
  else initSubHeader();
})();
