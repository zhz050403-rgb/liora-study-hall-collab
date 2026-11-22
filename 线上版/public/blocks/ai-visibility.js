/* AI 功能可见性（板块，2026-11-13 / 11-14 角色体系）
   - 无 AI 权限：用 !important 样式隐藏 AI 悬浮球/面板；站点 hash 路由会反复改写
     内联 display，单靠 JS 改 style 会被覆盖，所以用样式表兜底。
   - 管理员（主人账号）：在 AI 面板里加「AI 设置与用量」小链接（面板内链接，不新增导航入口）。
   - 高级会员 / 会员：显示入口，但每次提问前由 blocks/member-access.js 向服务端领票，
     额度不足时服务端拒绝，前端给出对应提示。
   注意：这里只是界面层，真正的权限判定全在服务端（roleOf / handleAITicket / aiAuthorize）。 */
(function () {
  'use strict';
  var boot = window.__CLOUD_BOOT__ || {};
  var isOwner = boot.ai === true;
  var canAI = isOwner || boot.canAI === true;

  if (!canAI) {
    var st = document.createElement('style');
    st.setAttribute('data-ai-visibility', '1');
    st.textContent = '#ai-fab,#ai-panel{display:none !important}';
    (document.head || document.documentElement).appendChild(st);
    return;
  }

  function injectLink() {
    var panel = document.getElementById('ai-panel');
    if (!panel || document.getElementById('ai-console-link')) return false;
    var a = document.createElement('a');
    a.id = 'ai-console-link';
    a.href = '/ai-console.html';
    a.textContent = '⚙ AI 设置与用量';
    a.title = '配置密钥、查看用量、运行无费用自检';
    a.style.cssText = 'display:block;flex:0 0 auto;margin:6px 14px 12px;text-align:right;' +
      'font-size:13px;color:#c9a55c;text-decoration:none;letter-spacing:.2px';
    a.onmouseover = function () { a.style.textDecoration = 'underline'; };
    a.onmouseout = function () { a.style.textDecoration = 'none'; };
    panel.appendChild(a);
    return true;
  }
  /* 只有管理员能看到「AI 设置」入口；会员/高级会员只保留提问框 */
  if (isOwner) {
    if (!injectLink()) {
      var t = setInterval(function () { if (injectLink()) clearInterval(t); }, 400);
      setTimeout(function () { clearInterval(t); }, 12000);
    }
  }
})();
