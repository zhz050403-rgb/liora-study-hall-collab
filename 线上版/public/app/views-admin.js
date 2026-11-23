/* Liora 学习小屋 · 超级管理员总控台（#/admin）
   仅超级管理员（role === 'admin'）可见与可用：
   - 审核新注册账号（同意通过 / 拒绝删除）
   - 查看全部账号的实时学习进度、各科完成周数、错题数、高光数与专注时长
   - 精细开关每个账号的访问权限（主课 / 读书 / 课外拓展 / 英语台 / 高光 / AI）
   - 停用/启用、重置密码、删除账号及其全部隔离数据 */
(function () {
  'use strict';

  var COURSE_TOTALS = [
    { id: 'accounting', name: '会计学', total: 13 },
    { id: 'economics', name: '经济学', total: 27 },
    { id: 'mathematics', name: '商业数学', total: 27 },
    { id: 'computing', name: '计算机', total: 26 },
    { id: 'english', name: '学术英语', total: 14 }
  ];

  var PERM_ITEMS = [
    { key: 'courses',   label: '五门核心课', desc: '笔记、图解、双语概念、必考大题与刷题' },
    { key: 'reading',   label: '读书书架',   desc: '9 本完整书库与书单' },
    { key: 'extra',     label: '课外拓展',   desc: '企业法律、财富管理与商业能力（默认关闭）' },
    { key: 'english',   label: '英语工作台', desc: 'SDG 11 精读定位与生词本' },
    { key: 'highlight', label: '全站高光标注', desc: '4 色荧光笔标注与云端同步' },
    { key: 'ai',        label: 'AI 伴学',    desc: '开启站内 AI 对话与批改（需配置密钥）' }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtTime(ts) {
    if (!ts) return '尚未登录';
    var d = new Date(Number(ts) + 8 * 3600000);
    return d.toISOString().slice(0, 16).replace('T', ' ');
  }

  async function adminFetch(url, opts) {
    var r = await fetch(url, Object.assign({
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    }, opts || {}));
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok || j.ok === false) throw new Error(j.error || ('请求失败 HTTP ' + r.status));
    return j;
  }

  function statusBadge(st) {
    if (st === 'pending') return '<span class="ed-badge ed-badge-gold">⏳ 待审核</span>';
    if (st === 'active') return '<span class="ed-badge ed-badge-green">● 正常</span>';
    return '<span class="ed-badge ed-badge-red">⛔ 已停用</span>';
  }

  function showModal(title, bodyHtml) {
    var old = document.getElementById('edAdminModal');
    if (old) old.remove();
    var ov = document.createElement('div');
    ov.id = 'edAdminModal';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10080;background:rgba(11,25,46,.65);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:18px';
    ov.innerHTML =
      '<div style="width:100%;max-width:680px;max-height:88vh;overflow:auto;background:#fff;border-radius:16px;padding:22px 24px;box-shadow:0 20px 60px rgba(0,0,0,.3)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--line);margin-bottom:16px">' +
          '<h3 style="margin:0;font-family:var(--serif);font-size:18px;color:var(--navy-900)">' + esc(title) + '</h3>' +
          '<button type="button" class="ed-btn ed-btn-sm" id="edAdminModalClose">✕ 关闭</button>' +
        '</div>' +
        '<div id="edAdminModalBody">' + bodyHtml + '</div>' +
      '</div>';
    document.body.appendChild(ov);
    function close() { ov.remove(); }
    document.getElementById('edAdminModalClose').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    return { close: close, el: ov };
  }

  async function renderAdmin(app) {
    var boot = window.__CLOUD_BOOT__ || {};
    if (boot.role !== 'admin') {
      app.innerHTML = '<div class="ed-container"><div class="ed-card" style="text-align:center;padding:36px">' +
        '<h1 style="font-size:20px;margin:0 0 8px">⛔ 权限不足</h1>' +
        '<p style="color:var(--muted);margin:0 0 16px">管理窗口仅对超级管理员开放。</p>' +
        '<a class="ed-btn ed-btn-primary" href="#/">返回首页</a>' +
      '</div></div>';
      return;
    }

    app.innerHTML = '<div class="ed-container"><div class="ed-card">正在加载全部账号与学习进度…</div></div>';
    var data;
    try {
      data = await adminFetch('/__api/admin/users', { method: 'GET' });
    } catch (e) {
      app.innerHTML = '<div class="ed-container"><div class="ed-card">' +
        '<h1 style="font-size:20px;margin:0 0 8px">🛡️ 管理员总控台</h1>' +
        '<p style="color:var(--red)">' + esc(e.message) + '</p>' +
        '<p style="font-size:13px;color:var(--muted)">提示：完整多账号 KV 审核与进度管理运行在 Cloudflare 线上环境。</p>' +
      '</div></div>';
      return;
    }

    var users = data.users || [];
    var counts = data.counts || { total: 0, pending: 0, active: 0, disabled: 0 };
    var pendingUsers = users.filter(function (u) { return u.status === 'pending'; });
    var api = window.LioraStudyApi;

    var pendingBanner = pendingUsers.length ? (
      '<div class="ed-card" style="margin-bottom:18px;border:1.5px solid var(--gold);background:linear-gradient(135deg,#fffbf0 0%,#fdf5e2 100%)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">' +
          '<b style="font-size:15.5px;color:#7a540e">⏳ 有 ' + pendingUsers.length + ' 位新注册用户正在等待管理员同意</b>' +
          '<span style="font-size:12.5px;color:#7a540e">同意后对方立即可登录（默认关闭「课外拓展」，支持随时调权限）</span>' +
        '</div>' +
        pendingUsers.map(function (u) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px 12px;background:#fff;border-radius:10px;border:1px solid var(--gold-border);margin-top:8px">' +
            '<div><b style="font-size:14.5px;color:var(--navy-900)">' + esc(u.username) + '</b> <span style="font-size:12px;color:var(--muted);margin-left:8px">申请时间：' + esc(fmtTime(u.createdAt)) + '</span></div>' +
            '<div style="display:flex;gap:8px">' +
              '<button class="ed-btn ed-btn-sm ed-btn-primary" data-approve="' + esc(u.uid) + '">✅ 同意通过</button>' +
              '<button class="ed-btn ed-btn-sm" style="color:var(--red);border-color:#ebb8b2" data-del="' + esc(u.uid) + '" data-uname="' + esc(u.username) + '">❌ 拒绝并删除</button>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>'
    ) : '';

    var rowsHtml = users.length ? users.map(function (u) {
      var pr = u.progress || {};
      var pct = Math.min(100, Math.round(((pr.completedWeeks || 0) / 107) * 100));
      var extraOn = !!(u.perms && u.perms.extra);
      return '<div class="ed-card" style="margin-bottom:12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:10px">' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
              '<b style="font-size:16px;color:var(--navy-900)">' + esc(u.username) + '</b>' +
              statusBadge(u.status) +
              (extraOn ? '<span class="ed-badge" style="background:#eef5fc;color:var(--navy-800)">已开课外拓展</span>' : '<span class="ed-badge" style="background:#f3f5f8;color:var(--muted)">课外拓展：关闭</span>') +
            '</div>' +
            '<div style="font-size:12.5px;color:var(--muted);margin-top:4px">' +
              '注册：' + esc(fmtTime(u.createdAt)) + ' · 最近登录：' + esc(fmtTime(u.lastLoginAt)) +
              (pr.lastVisit && pr.lastVisit.title ? ' · 最近学到：<b>' + esc(pr.lastVisit.title.slice(0, 28)) + '</b>' : '') +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
            (u.status === 'pending'
              ? '<button class="ed-btn ed-btn-sm ed-btn-gold" data-approve="' + esc(u.uid) + '">✅ 同意通过</button>'
              : '<button class="ed-btn ed-btn-sm" data-toggle="' + esc(u.uid) + '" data-next="' + (u.status === 'active' ? 'disabled' : 'active') + '">' + (u.status === 'active' ? '⏸ 停用' : '▶ 启用') + '</button>') +
            '<button class="ed-btn ed-btn-sm ed-btn-primary" data-detail="' + esc(u.uid) + '">📊 详细进度</button>' +
            '<button class="ed-btn ed-btn-sm" data-perms="' + esc(u.uid) + '">⚙️ 调权限</button>' +
            '<button class="ed-btn ed-btn-sm" data-reset="' + esc(u.uid) + '" data-uname="' + esc(u.username) + '">🔑 重置密码</button>' +
            '<button class="ed-btn ed-btn-sm" style="color:var(--red);border-color:#ebb8b2" data-del="' + esc(u.uid) + '" data-uname="' + esc(u.username) + '">🗑 删除</button>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1.5fr repeat(4,1fr);gap:10px;align-items:center;padding-top:10px;border-top:1px dashed var(--line-2);font-size:13px">' +
          '<div>' +
            '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:4px"><span>主课完成进度</span><b>' + (pr.completedWeeks || 0) + ' / 107 周 (' + pct + '%)</b></div>' +
            '<div class="ed-prog-bar"><i style="width:' + pct + '%"></i></div>' +
          '</div>' +
          '<div><span style="color:var(--muted);font-size:12px">高光标注</span><br><b>' + (pr.highlightsCount || 0) + ' 条</b></div>' +
          '<div><span style="color:var(--muted);font-size:12px">错题本</span><br><b>' + (pr.mistakesCount || 0) + ' 题</b></div>' +
          '<div><span style="color:var(--muted);font-size:12px">累计专注</span><br><b>' + (pr.focusMinutes || 0) + ' 分钟</b></div>' +
          '<div><span style="color:var(--muted);font-size:12px">闪卡掌握</span><br><b>' + (pr.flashcardsKnown || 0) + ' 词</b></div>' +
        '</div>' +
      '</div>';
    }).join('') : '<div class="ed-card" style="text-align:center;color:var(--muted);padding:28px">目前还没有其他注册账号。分享注册页链接 <a href="/__register" target="_blank">/__register</a>，对方提交用户名和密码后就会出现在这里等你审核。</div>';

    app.innerHTML = '<div class="ed-container">' +
      '<div class="ed-page-head" style="margin-bottom:14px">' +
        '<h1>🛡️ 管理员总控台 · 学员进度与权限管理</h1>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="ed-btn ed-btn-sm" id="edAdminRefresh">🔄 刷新数据</button>' +
          '<a class="ed-btn ed-btn-sm ed-btn-gold" href="/__register" target="_blank">🔗 打开注册页</a>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:18px">' +
        '<div class="ed-card"><div style="font-size:12px;color:var(--muted)">总注册学员</div><b style="font-size:24px;color:var(--navy-900)">' + counts.total + '</b></div>' +
        '<div class="ed-card"><div style="font-size:12px;color:var(--muted)">⏳ 待审核申请</div><b style="font-size:24px;color:#b27a12">' + counts.pending + '</b></div>' +
        '<div class="ed-card"><div style="font-size:12px;color:var(--muted)">● 正常学习中</div><b style="font-size:24px;color:var(--green)">' + counts.active + '</b></div>' +
        '<div class="ed-card"><div style="font-size:12px;color:var(--muted)">⛔ 已停用账号</div><b style="font-size:24px;color:var(--red)">' + counts.disabled + '</b></div>' +
      '</div>' +
      pendingBanner +
      '<div class="ed-section-head"><h2>全部账号与学习进度总览</h2><span class="sub">每个账号数据完全物理隔离 · 仅超级管理员 ' + esc(boot.user || 'Liora') + ' 可见</span></div>' +
      rowsHtml +
    '</div>';

    document.getElementById('edAdminRefresh').addEventListener('click', function () { renderAdmin(app); });

    /* 同意通过 */
    app.querySelectorAll('[data-approve]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var uid = btn.getAttribute('data-approve');
        try {
          await adminFetch('/__api/admin/users/' + encodeURIComponent(uid) + '/approve', { method: 'POST', body: '{}' });
          api.toast('已审核通过，对方现在可以登录学习了');
          renderAdmin(app);
        } catch (ex) { api.toast(ex.message); }
      });
    });

    /* 停用 / 启用 */
    app.querySelectorAll('[data-toggle]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var uid = btn.getAttribute('data-toggle');
        var next = btn.getAttribute('data-next');
        try {
          await adminFetch('/__api/admin/users/' + encodeURIComponent(uid) + '/status', { method: 'POST', body: JSON.stringify({ status: next }) });
          api.toast(next === 'active' ? '账号已重新启用' : '账号已停用并立刻踢下线');
          renderAdmin(app);
        } catch (ex) { api.toast(ex.message); }
      });
    });

    /* 重置密码 */
    app.querySelectorAll('[data-reset]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var uid = btn.getAttribute('data-reset');
        var uname = btn.getAttribute('data-uname');
        var pw = window.prompt('给用户「' + uname + '」设置新密码（至少 6 位，设置后对方旧登录态将失效）：');
        if (!pw) return;
        try {
          await adminFetch('/__api/admin/users/' + encodeURIComponent(uid) + '/reset-password', { method: 'POST', body: JSON.stringify({ password: pw }) });
          api.toast('密码已重置！请把新密码告知 ' + uname);
        } catch (ex) { api.toast(ex.message); }
      });
    });

    /* 删除账号与全部数据 */
    app.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var uid = btn.getAttribute('data-del');
        var uname = btn.getAttribute('data-uname');
        if (!window.confirm('确定彻底删除用户「' + uname + '」及其所有学习进度、错题与高光数据吗？此操作不可恢复。')) return;
        try {
          await adminFetch('/__api/admin/users/' + encodeURIComponent(uid), { method: 'DELETE' });
          api.toast('已删除用户「' + uname + '」及其数据');
          renderAdmin(app);
        } catch (ex) { api.toast(ex.message); }
      });
    });

    /* 调整权限 */
    app.querySelectorAll('[data-perms]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var uid = btn.getAttribute('data-perms');
        var u = users.find(function (x) { return x.uid === uid; });
        if (!u) return;
        var cur = Object.assign({}, u.perms || {});
        var html = PERM_ITEMS.map(function (it) {
          return '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid var(--line);margin-bottom:8px;cursor:pointer">' +
            '<input type="checkbox" data-pk="' + it.key + '"' + (cur[it.key] ? ' checked' : '') + ' style="width:18px;height:18px;margin-top:2px;accent-color:var(--navy-900)">' +
            '<div><b style="font-size:14px;color:var(--navy-900)">' + esc(it.label) + '</b><div style="font-size:12.5px;color:var(--muted)">' + esc(it.desc) + '</div></div>' +
          '</label>';
        }).join('') +
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">' +
          '<button type="button" class="ed-btn ed-btn-primary" id="edSavePermsBtn">💾 保存权限设置</button>' +
        '</div>';
        var modal = showModal('⚙️ 权限配置 · ' + u.username, html);
        document.getElementById('edSavePermsBtn').addEventListener('click', async function () {
          var nextPerms = {};
          modal.el.querySelectorAll('[data-pk]').forEach(function (chk) {
            nextPerms[chk.getAttribute('data-pk')] = chk.checked;
          });
          try {
            await adminFetch('/__api/admin/users/' + encodeURIComponent(uid) + '/perms', { method: 'POST', body: JSON.stringify({ perms: nextPerms }) });
            modal.close();
            api.toast('已更新「' + u.username + '」的访问权限');
            renderAdmin(app);
          } catch (ex) { api.toast(ex.message); }
        });
      });
    });

    /* 查看详细进度 */
    app.querySelectorAll('[data-detail]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var uid = btn.getAttribute('data-detail');
        try {
          var d = await adminFetch('/__api/admin/users/' + encodeURIComponent(uid), { method: 'GET' });
          var pr = d.progress || {};
          var byC = pr.byCourse || {};
          var barsHtml = COURSE_TOTALS.map(function (c) {
            var done = byC[c.id] || 0;
            var pct = Math.min(100, Math.round((done / c.total) * 100));
            return '<div style="margin-bottom:10px">' +
              '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><b>' + c.name + '</b><span>' + done + ' / ' + c.total + ' 周 (' + pct + '%)</span></div>' +
              '<div class="ed-prog-bar"><i style="width:' + pct + '%"></i></div>' +
            '</div>';
          }).join('');

          var hls = (d.recentHighlights || []).slice(0, 6).map(function (h) {
            return '<div style="padding:8px 10px;border-radius:8px;background:var(--surface-2);border:1px solid var(--line-2);margin-bottom:6px;font-size:12.5px">' +
              '<div style="color:var(--muted);font-size:11.5px">' + esc(h.title || h.route) + '</div>' +
              '<div style="margin-top:2px">「' + esc((h.quote || '').slice(0, 90)) + '」</div>' +
              (h.note ? '<div style="color:var(--navy-800);margin-top:2px">📝 ' + esc(h.note) + '</div>' : '') +
            '</div>';
          }).join('') || '<p style="font-size:13px;color:var(--muted);margin:0">暂无高光记录</p>';

          var body =
            '<div style="margin-bottom:16px"><h4 style="margin:0 0 10px;font-size:14.5px;color:var(--navy-900)">📚 五科学习进度</h4>' + barsHtml + '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">' +
              '<div style="padding:10px;border-radius:10px;background:var(--surface-2);text-align:center"><div style="font-size:12px;color:var(--muted)">错题本</div><b>' + (pr.mistakesCount || 0) + ' 题</b></div>' +
              '<div style="padding:10px;border-radius:10px;background:var(--surface-2);text-align:center"><div style="font-size:12px;color:var(--muted)">累计专注</div><b>' + (pr.focusMinutes || 0) + ' 分钟</b></div>' +
              '<div style="padding:10px;border-radius:10px;background:var(--surface-2);text-align:center"><div style="font-size:12px;color:var(--muted)">高光/批注</div><b>' + (pr.highlightsCount || 0) + ' 条</b></div>' +
            '</div>' +
            '<div><h4 style="margin:0 0 8px;font-size:14.5px;color:var(--navy-900)">🖍️ 最近高光标注</h4>' + hls + '</div>';
          showModal('📊 学员学习详情 · ' + d.user.username, body);
        } catch (ex) { api.toast(ex.message); }
      });
    });
  }

  window.LioraViewsAdmin = { renderAdmin: renderAdmin };
})();
