/* ============================================================
   会员权限 · 板块（2026-11-14）
   主站 index.html 与英语台 english/index.html 都引入本文件。
   全部逻辑写在这里，两个入口 HTML 只加一行引用 + 升 ?v=。

   职责：
   1) 「用户」：禁用英语台 AI，只留在英语学习；主站入口一律不出现。
   2) 非管理员隐藏「课外拓展」导航并拦住 #/extra。
   3) 管理员在左下角显示常驻「账号管理与授权」按钮 + 页脚兜底（不新增导航项）。
   4) 高级会员 / 会员：AI 提问前向服务端领票（额度硬闸门）。
      注意 cloudLLM.chat 与 cloudLLM.stream 是两个独立引用，
      英语台用 chat、主站助手用 stream，必须分别包装。
   5) 高级会员 / 会员：右下角小面板显示今日额度、积分、背词进度。
   6) 会员：英语台每次给生词评分时上报 1 个单词，用于「每天背 50 词领 10 积分」。

   注意：这里只是界面与引导，真正的权限判定全在服务端。
   ============================================================ */
(function () {
  'use strict';
  var boot = window.__CLOUD_BOOT__ || {};
  if (!boot.ok) return;                       // 未注入身份（例如静态预览）时不做任何事
  var role = boot.role || 'legacy';
  var isAdmin = role === 'admin';
  var isPremium = role === 'premium';
  var isMember = role === 'member';
  var isUser = role === 'user';
  var hasQuota = isPremium || isMember;
  var st = boot.accountStatus || {};

  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  /* ---------- 通用提示条（所有身份共用） ---------- */
  var toastTimer = null;
  function makeToast() {
    if (q('#member-toast')) return;
    var toast = document.createElement('div');
    toast.id = 'member-toast';
    toast.style.cssText = 'position:fixed;left:50%;top:88px;transform:translateX(-50%);z-index:200;display:none;' +
      'max-width:min(86vw,420px);text-align:center;background:#173860;color:#fff;padding:10px 18px;border-radius:9px;' +
      'font:13px/1.6 system-ui,"Microsoft YaHei",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)';
    (document.body || document.documentElement).appendChild(toast);
  }
  window.__memberToast = function (msg) {
    makeToast();
    var toast = q('#member-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.style.display = 'none'; }, 3600);
  };
  makeToast();

  /* ---------- 0. 「用户」专属：AI 与积分引导卡（2026-11-15） ----------
     普通用户过去只能看到「AI 已接好，打开就能用」，点了却被拦；
     页面里连「积分 / 背 50 词 / 兑换 / 高级会员」这些词都没有，
     更没写 AI 功能在哪。这里给一张默认展开的说明卡 + 左下角常驻入口，
     所有说法都对应 accounts/service.js 的真实规则，不编造额度。 */
  function showUserGuide() {
    var KEY = 'liora-user-guide-v1';
    var card = document.createElement('section');
    card.id = 'user-ai-guide';
    card.setAttribute('aria-label', 'AI 与积分说明');
    var phone = String(boot.user || '');
    var who = /^1\d{10}$/.test(phone) ? '（手机号 ' + phone + '）' : '';
    var copyText = '你好，请把我的学习小屋账号' + who +
      '身份改成「会员」（每天背 50 个单词攒积分换 AI 额度）或「高级会员」（每天 0.1 元 AI 额度）。谢谢！';

    var css = document.createElement('style');
    css.id = 'user-ai-guide-style';
    css.textContent = [
      '#user-ai-guide{box-sizing:border-box;max-width:960px;margin:16px auto 0;padding:16px 20px;',
      'background:#fffdf6;border:1.5px solid #e3c98c;border-left:5px solid #c9a55c;border-radius:12px;',
      'box-shadow:0 6px 20px rgba(23,56,96,.10);font:14px/1.75 system-ui,"Microsoft YaHei",sans-serif;',
      'color:#26364b;overflow-wrap:anywhere;min-width:0}',
      '#user-ai-guide h3{margin:0 0 6px;font-size:16px;color:#173860}',
      '#user-ai-guide .ug-lead{margin:0 0 10px;color:#5b4a2c}',
      '#user-ai-guide .ug-sec{margin:10px 0 0;padding-top:9px;border-top:1px dashed #e6d4a8}',
      '#user-ai-guide .ug-sec b{color:#173860}',
      '#user-ai-guide ul{margin:5px 0 0;padding-left:20px}',
      '#user-ai-guide li{margin:3px 0}',
      '#user-ai-guide .ug-tag{display:inline-block;background:#173860;color:#fff;border-radius:5px;',
      'padding:1px 7px;font-size:12px;font-weight:700;margin-right:5px}',
      '#user-ai-guide .ug-note{margin-top:9px;font-size:12px;color:#8a7a5a}',
      '#user-ai-guide .ug-btn{border:1px solid #b9d0ea;background:#eaf3fd;color:#173860;',
      'border-radius:7px;padding:6px 11px;font:600 12.5px system-ui,"Microsoft YaHei",sans-serif;cursor:pointer}',
      '#user-ai-guide .ug-btn:hover{background:#d8eafe}',
      '#user-ai-guide .ug-close{float:right;border:0;background:transparent;color:#8a7a5a;',
      'font-size:12px;cursor:pointer;text-decoration:underline}',
      '#user-ai-fab{position:fixed;left:18px;bottom:18px;z-index:120;display:inline-flex;',
      'align-items:center;gap:6px;padding:9px 14px;border-radius:999px;background:#173860;',
      'color:#fff;border:1.5px solid #c9a55c;font:600 13px/1.3 system-ui,"Microsoft YaHei",sans-serif;',
      'text-decoration:none;box-shadow:0 6px 20px rgba(13,27,62,.32);white-space:nowrap;cursor:pointer}',
      '#user-ai-fab:hover{background:#0f2b50}',
      '@media (max-width:600px){#user-ai-guide{margin:10px 12px 0;padding:13px 14px;font-size:13px}',
      '#user-ai-guide h3{font-size:15px}#user-ai-fab{left:10px;bottom:12px;padding:8px 11px;font-size:12.5px}}',
      '@media print{#user-ai-guide,#user-ai-fab{display:none!important}}',
      'body.print-notes #user-ai-guide,body.cb-focus #user-ai-guide{display:none!important}'
    ].join('');
    (document.head || document.documentElement).appendChild(css);

    card.innerHTML =
      '<button type="button" class="ug-close" id="ugClose">收起说明</button>' +
      '<h3>🔒 当前身份：用户 · AI 还没开通</h3>' +
      '<p class="ug-lead">不用自己配置任何东西：只要管理员把你的身份换一下就能用 AI。下面写清楚了' +
        '<b>怎么拿到 AI 额度</b>、<b>AI 在哪些地方用</b>，还有一段可以直接复制发给管理员的话。</p>' +
      '<div class="ug-sec"><b>① 怎么拿到 AI 额度</b>' +
        '<ul>' +
          '<li><span class="ug-tag">会员</span>让管理员改成「会员」：在「生词本」每天完成 <b>50 个单词</b>的复习打卡 → ' +
            '右下角「今日 AI 额度」小面板点 <b>领 10 积分</b> → 再点 <b>兑换额度</b>。' +
            '<b>10 积分 = 0.01 元 AI 额度</b>，每次提问约用 0.01 元。</li>' +
          '<li><span class="ug-tag">高级会员</span>让管理员改成「高级会员」：<b>每天自动有 0.1 元 AI 额度</b>，不用背词攒积分。</li>' +
          '<li>你现在是「用户」，只能看英语学习内容，AI 先不开放；上面的额度也要先换身份才会有。</li>' +
        '</ul></div>' +
      '<div class="ug-sec"><b>② AI 在哪里用（开通后自动解锁，不用另外找开关）</b>' +
        '<ul>' +
          '<li><b>素材库</b> → 「✨ AI 生成文章」里的<b>生成文章</b>按钮</li>' +
          '<li><b>精读</b> → 点单词查释义；选中词句后点「🌐 翻译 / 解析」</li>' +
          '<li><b>写作</b> → 「🤖 提交 AI 批改」</li>' +
          '<li><b>口语</b> → AI 对话与「📋 口语反馈报告」</li>' +
          '<li><b>设置</b> → 「🔌 测试连接」可确认 AI 是否就绪</li>' +
          '<li>身份开通后，回到<b>学习小屋主页</b>，右下角也会出现 AI 助手</li>' +
        '</ul></div>' +
      '<div class="ug-sec"><b>③ 让管理员帮你开通</b>' +
        '<p style="margin:6px 0"><button type="button" class="ug-btn" id="ugCopy">📋 复制这段话发给管理员</button> ' +
        '<span style="font-size:12px;color:#8a7a5a">他会去左下角「⚙ 账号管理与授权」里改你的身份</span></p>' +
        '<div id="ugCopyText" style="margin-top:6px;padding:8px 10px;background:#f5f8fd;' +
          'border:1px dashed #c9d8ea;border-radius:7px;font-size:12.5px;color:#3a5270">' +
          esc(copyText) + '</div>' +
      '</div>' +
      '<div class="ug-note">额度是「每次提问约 0.01 元」的估算预扣，实际由服务端核算；本站 AI 走小屋云端通道，不需要你填任何 Key。</div>';
    /* 关键：宽屏下 body.english-page 是 CSS Grid（左 210px 导航 + 右主内容），
       把卡片插到 #main 外面会被自动放成一条 210px 窄列、掉到页面很下面。
       插进 #main 内部第一个位置：既在内容区最上方，又不会被视图切换重写。 */
    var main = q('#main');
    if (main) main.insertBefore(card, main.firstChild);
    else (document.body || document.documentElement).appendChild(card);

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'user-ai-fab';
    fab.textContent = '🔒 AI 与积分说明';
    fab.title = '查看怎么拿 AI 额度、AI 在哪里用';
    (document.body || document.documentElement).appendChild(fab);

    var closed = false;
    try { closed = localStorage.getItem(KEY) === 'closed'; } catch (e) { }
    /* 卡片展开时不显示悬浮按钮，避免手机上压住正文；滚过卡片后自动出现，
       收起卡片后则一直显示，随时能再打开。 */
    function syncFab() {
      if (closed) { fab.style.display = ''; return; }
      var r = card.getBoundingClientRect();
      fab.style.display = (r.bottom < 24) ? '' : 'none';
    }
    function paint() {
      card.style.display = closed ? 'none' : '';
      syncFab();
    }
    paint();
    window.addEventListener('scroll', syncFab, false);
    window.addEventListener('resize', syncFab, false);
    q('#ugClose').addEventListener('click', function () {
      closed = true;
      try { localStorage.setItem(KEY, 'closed'); } catch (e) { }
      paint();
    });
    fab.addEventListener('click', function () {
      closed = false;
      try { localStorage.removeItem(KEY); } catch (e) { }
      paint();
      window.scrollTo(0, 0);
      syncFab();
    });
    q('#ugCopy').addEventListener('click', function () {
      function done(ok) {
        window.__memberToast(ok
          ? '已复制，发给管理员让他帮你改身份就行'
          : '复制失败？已帮你选中下面灰框里的话，按 Ctrl+C（手机长按选择）即可复制');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(function () { done(true); }, function () { fallback(); });
      } else fallback();
      function fallback() {
        try {
          var ta = document.createElement('textarea');
          ta.value = copyText;
          ta.style.cssText = 'position:fixed;left:-9999px';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          var ok = document.execCommand('copy');
          document.body.removeChild(ta);
          if (ok) { done(true); return; }
        } catch (e) { }
        /* 最后一兜底：直接选中卡片里可见的那段话，用户只要按 Ctrl+C */
        try {
          var box = q('#ugCopyText');
          if (box) {
            var range = document.createRange();
            range.selectNodeContents(box);
            var sel = window.getSelection();
            if (sel) { sel.removeAllRanges(); sel.addRange(range); }
          }
        } catch (e) { }
        done(false);
      }
    });
  }

  /* ---------- 1. 「用户」：禁用 AI + 只留在英语学习 ---------- */
  if (isUser) {
    /* 英语台的查词 / 批改 / 对话走 cloudLLM.chat，这里是服务端闸门之外的
       客户端兜底：绝不发起模型请求。服务端也不会给「用户」发票。 */
    if (window.cloudLLM) {
      function noAI() {
        var e = new Error('AI 功能暂未向你开放，请联系管理员为你授权');
        e.__lioraMsg = e.message;
        throw e;
      }
      window.cloudLLM.chat = noAI;
      window.cloudLLM.stream = noAI;
    }
    /* 误入主站（服务端也会 302）时立刻回英语台 */
    if (q('.main-nav')) { location.replace('/english/index.html'); return; }
    /* 英语台顶部的整站导航：只保留「英语学习」，其余入口对「用户」隐藏，
       避免点过去撞 403 友好页。 */
    qa('header.cabin-header nav a').forEach(function (a) {
      if (a.getAttribute('aria-current') === 'page') return;
      a.style.display = 'none';
      a.setAttribute('data-member-hidden', '1');
    });
    showUserGuide();
    return;
  }

  /* ---------- 2. 课外拓展：非管理员隐藏入口 + 拦 hash ---------- */
  if (!isAdmin) {
    /* 主站是 a[href="#/extra"]，英语台是 a[href="../index.html#/extra"] */
    qa('[data-nav="#/extra"], a[href="#/extra"], a[href$="#/extra"]').forEach(function (a) {
      a.style.display = 'none';
      a.setAttribute('data-member-hidden', '1');
    });
    qa('header.cabin-header nav a').forEach(function (a) {
      if (a.textContent.indexOf('课外拓展') >= 0) a.style.display = 'none';
    });
    qa('.footer-col a').forEach(function (a) {
      if ((a.getAttribute('data-nav') === '#/extra') || a.textContent.indexOf('课外拓展') >= 0) a.style.display = 'none';
    });
    function blockExtra() {
      if (location.hash === '#/extra' || location.hash.indexOf('#/extra/') === 0) {
        location.hash = '#/courses';
        window.__memberToast('「课外拓展」暂未向你开放，请联系管理员');
      }
    }
    window.addEventListener('hashchange', blockExtra);
    blockExtra();
  }

  /* ---------- 3. 管理员：显眼的常驻入口 + 页脚兜底（不改主导航） ---------- */
  /* 旧版只把一行 12px 金字塞在页面最底部（实测距顶约 4744px、要滚 4200px），
     实际没人找得到。现在左下角常驻一颗胶囊按钮，滚到任何位置都能看见；
     右下角已被 AI 助手 / 回到顶部占用，所以固定放左下。仅管理员可见。 */
  if (isAdmin) {
    if (!q('#admin-entry-fab')) {
      var css = document.createElement('style');
      css.id = 'admin-entry-style';
      css.textContent = [
        '#admin-entry-fab{position:fixed;left:18px;bottom:18px;z-index:120;',
        'display:inline-flex;align-items:center;gap:7px;padding:10px 16px;border-radius:999px;',
        'background:#173860;color:#fff;border:1.5px solid #c9a55c;',
        'font:600 13.5px/1.3 system-ui,"Microsoft YaHei",sans-serif;text-decoration:none;',
        'box-shadow:0 6px 20px rgba(13,27,62,.32);white-space:nowrap}',
        '#admin-entry-fab:hover,#admin-entry-fab:focus{background:#0f2b50;color:#fff;',
        'outline:2px solid #f0d28a;outline-offset:2px}',
        '#admin-entry-fab .ae-short{display:none}',
        '@media (max-width:600px){#admin-entry-fab{left:10px;bottom:12px;padding:8px 12px;font-size:12.5px}',
        '#admin-entry-fab .ae-full{display:none}#admin-entry-fab .ae-short{display:inline}}',
        '@media print{#admin-entry-fab{display:none!important}}',
        'body.print-notes #admin-entry-fab,body.cb-focus #admin-entry-fab{display:none!important}'
      ].join('');
      (document.head || document.documentElement).appendChild(css);
      var fab = document.createElement('a');
      fab.id = 'admin-entry-fab';
      fab.href = '/admin.html';
      fab.title = '账号管理与授权（仅管理员可见）';
      fab.setAttribute('aria-label', '账号管理与授权');
      fab.innerHTML = '<span aria-hidden="true">⚙</span>' +
        '<span class="ae-full">账号管理与授权</span>' +
        '<span class="ae-short">账号管理</span>';
      (document.body || document.documentElement).appendChild(fab);
    }
    var bottom = q('.footer-bottom');
    if (bottom) {
      var link = q('#admin-accounts-link');
      if (!link) {
        link = document.createElement('a');
        link.id = 'admin-accounts-link';
        link.href = '/admin.html';
        bottom.appendChild(link);
      }
      link.textContent = '⚙ 账号管理与授权';
      link.style.cssText = 'display:inline-block;margin-left:14px;padding:6px 14px;' +
        'border:1px solid #c9a55c;border-radius:8px;background:rgba(201,165,92,.14);' +
        'color:#f0d28a;font-size:13.5px;font-weight:600;text-decoration:none';
    }
  }

  /* ---------- 4. AI 领票：chat 与 stream 分别包装 ---------- */
  /* 领一张票 = 服务端按角色硬判断并预扣 0.01 元；拿不到票就不发模型请求。
     管理员不包装（不限额度）；用户/旧账号在第 1 步或服务端被拦下。 */
  if (hasQuota && window.cloudLLM) {
    var origErr = window.cloudLLM.errorText ? window.cloudLLM.errorText.bind(window.cloudLLM) : null;

    function takeTicket() {
      return fetch('/__api/ai/ticket', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: '{}'
      }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
        .then(function (x) {
          if (!x.j.ok) {
            var e = new Error(x.j.error || 'AI 额度不足');
            e.__lioraMsg = x.j.error || 'AI 额度不足';
            throw e;
          }
          if (window.__memberRefresh) window.__memberRefresh();
        });
    }
    function wrap(name) {
      var orig = window.cloudLLM[name];
      if (typeof orig !== 'function') return;
      var bound = orig.bind(window.cloudLLM);
      window.cloudLLM[name] = function (messages, opts) {
        return takeTicket().then(function () { return bound(messages, opts); });
      };
    }
    wrap('stream');   // 主站 AI 助手
    wrap('chat');     // 英语台 LLM.chat / 部分旧调用

    if (origErr) {
      window.cloudLLM.errorText = function (e) {
        return (e && e.__lioraMsg) ? e.__lioraMsg : origErr(e);
      };
    }
  }

  /* ---------- 5. 额度 / 积分小面板 ---------- */
  function fmtCny(v) { return (Math.round((Number(v) || 0) * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, ''); }
  if (hasQuota) {
    var box = document.createElement('div');
    box.id = 'member-wallet';
    box.style.cssText = 'position:fixed;right:18px;bottom:86px;z-index:70;max-width:260px;' +
      'background:#fff;border:1px solid #cbdcf0;border-radius:12px;box-shadow:0 8px 24px rgba(23,56,96,.16);' +
      'padding:12px 14px;font:13px/1.7 system-ui,"Microsoft YaHei",sans-serif;color:#173860';
    box.innerHTML =
      '<div style="font-weight:800;font-size:13px;margin-bottom:4px">' + esc(boot.roleLabel || '会员') + ' · 今日 AI 额度</div>' +
      '<div id="mw-left" style="font-size:19px;font-weight:800;color:#1c4375">' +
        (st.aiDailyLimitCny == null ? '不限' : '¥ ' + fmtCny(st.aiLeftCny)) + '</div>' +
      (isMember
        ? '<div id="mw-words" style="margin-top:6px;color:#46688e">今日背词 ' + (st.wordsToday || 0) + ' / 50</div>' +
          '<div id="mw-points" style="color:#46688e">积分 ' + (st.points || 0) + ' 分（10 分 = 0.01 元）</div>' +
          '<div style="margin-top:4px;color:#46688e;font-size:11.5px">背满 50 词 → 领 10 积分 → 兑换额度，就能用 AI 了</div>' +
          '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
            '<button type="button" id="mw-claim" class="mw-btn">领 10 积分</button>' +
            '<button type="button" id="mw-redeem" class="mw-btn">兑换额度</button></div>'
        : '<div style="margin-top:4px;color:#46688e">每天自动恢复 0.1 元</div>') +
      '<div id="mw-msg" style="margin-top:8px;color:#b26a00;min-height:0"></div>' +
      '<div style="margin-top:6px;font-size:11px;color:#8aa0b8">每次提问约 0.01 元 · 额度由服务端核算</div>';
    var stl = document.createElement('style');
    stl.textContent = '.mw-btn{border:1px solid #b9d0ea;background:#eaf3fd;color:#173860;border-radius:7px;' +
      'padding:5px 9px;font:600 12px system-ui,"Microsoft YaHei",sans-serif;cursor:pointer}' +
      '.mw-btn:hover{background:#d8eafe}.mw-btn:disabled{opacity:.5;cursor:not-allowed}';
    document.head.appendChild(stl);
    (document.body || document.documentElement).appendChild(box);

    function post(url, body, done) {
      return fetch(url, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body || {})
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (done) done(j);
      }).catch(function () { window.__memberToast('网络异常，请稍后再试'); });
    }
    function refresh() {
      return fetch('/__api/me', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) return;
          var s = j.accountStatus || {};
          var left = q('#mw-left');
          if (left) left.textContent = (s.aiDailyLimitCny == null ? '不限' : '¥ ' + fmtCny(s.aiLeftCny));
          var w = q('#mw-words'); if (w) w.textContent = '今日背词 ' + (s.wordsToday || 0) + ' / 50';
          var p = q('#mw-points'); if (p) p.textContent = '积分 ' + (s.points || 0) + ' 分（10 分 = 0.01 元）';
        }).catch(function () {});
    }
    window.__memberRefresh = refresh;

    var claimBtn = q('#mw-claim'), redeemBtn = q('#mw-redeem');
    if (claimBtn) claimBtn.addEventListener('click', function () {
      claimBtn.disabled = true;
      post('/__api/points/claim', {}, function (j) {
        window.__memberToast(j.error || (j.ok ? '已领取 10 积分！记得点「兑换额度」换成 AI 额度' : '领取失败'));
        claimBtn.disabled = false; refresh();
      });
    });
    if (redeemBtn) redeemBtn.addEventListener('click', function () {
      redeemBtn.disabled = true;
      post('/__api/points/redeem', {}, function (j) {
        window.__memberToast(j.error || (j.ok ? '已兑换 0.01 元 AI 额度，现在可以提问了' : '兑换失败'));
        redeemBtn.disabled = false; refresh();
      });
    });
  }

  /* ---------- 6. 会员：英语台背单词上报 ---------- */
  /* app.js 用事件委托处理 data-action="vocab-rate"，这里在捕获阶段旁听，
     不改英语台原有逻辑。这是学习打卡计数，不是加密防作弊，如实说明。 */
  if (isMember) {
    document.addEventListener('click', function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest('[data-action="vocab-rate"]') : null;
      if (!t) return;
      fetch('/__api/points/words', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ n: 1 }), keepalive: true
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (j && j.ok) {
          var w = q('#mw-words');
          if (w) w.textContent = '今日背词 ' + j.wordsToday + ' / 50';
          if (j.wordsToday === 50 && window.__memberToast) window.__memberToast('今天背满 50 个单词啦！点「领 10 积分」');
        }
      }).catch(function () {});
    }, true);
  }
})();
