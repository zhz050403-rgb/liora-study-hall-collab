/* =========================================================
 * 云端进度同步（真实云服务）
 * - 登录后，打卡 / 任务 / 备考记录 / 英语工作台等本地数据，会在手机 / 平板 / 电脑间自动同步
 * - 数据存于云端 user_state 表（按账号隔离）；登录走云端 Auth（邮箱验证码 / WorkBuddy 账号）
 * - 由 cloud-config.js 注入 window.cloud / window.cloudLLM（须先加载 SDK CDN）
 * - 服务端不可用或未登录时，全部退回本机保存，不影响使用
 * ========================================================= */
(function () {
  'use strict';
  var PREFIX = /^(xinnan|liora|cabin|loopenglish)/i;
  var META = 'xinnan-cloud-meta';
  var CLOUD_USER_KEY = 'lioraCloudUser'; /* 记录当前浏览器本地存的是哪个账号的数据（不随进度同步） */
  var OWNER_ROUTES = ['#/extra']; /* 仅主人账号（Liora）可见的栏目：课外拓展 */
  var suppress = false, timer = null, busy = false, queued = false, dirty = false;

  function meta() { try { return JSON.parse(localStorage.getItem(META) || '{}') || {}; } catch (e) { return {}; } }
  function setMeta(m) { try { suppress = true; localStorage.setItem(META, JSON.stringify(m)); } catch (e) {} finally { suppress = false; } }
  function snap() {
    var o = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k === META || k === '__xinnan_probe__' || !PREFIX.test(k)) continue;
        var v = localStorage.getItem(k);
        if (v != null) o[k] = v;
      }
    } catch (e) {}
    return o;
  }
  function apply(data) {
    if (!data) return;
    try {
      suppress = true;
      for (var k in data) if (PREFIX.test(k) && k !== META && typeof data[k] === 'string') localStorage.setItem(k, data[k]);
    } catch (e) {} finally { suppress = false; }
  }
  function mergeVal(server, local) {
    if (server == null) return local;
    if (local == null) return server;
    try {
      var A = JSON.parse(server), B = JSON.parse(local);
      if (Array.isArray(A) && Array.isArray(B)) {
        var map = {};
        A.forEach(function (x) { map[x && x.id != null ? 'id:' + x.id : 'j:' + JSON.stringify(x)] = x; });
        B.forEach(function (x) { map[x && x.id != null ? 'id:' + x.id : 'j:' + JSON.stringify(x)] = x; });
        return JSON.stringify(Object.keys(map).map(function (k) { return map[k]; }));
      }
      if (A && B && typeof A === 'object' && typeof B === 'object') {
        for (var k in B) {
          if (A[k] && B[k] && typeof A[k] === 'object' && typeof B[k] === 'object' && !Array.isArray(A[k]) && !Array.isArray(B[k])) {
            for (var j in B[k]) A[k][j] = B[k][j];
          } else A[k] = B[k];
        }
        return JSON.stringify(A);
      }
    } catch (e) {}
    return local;
  }
  function mergeInto(serverData) {
    var local = snap(), out = {};
    for (var k in serverData) out[k] = mergeVal(serverData[k], local[k]);
    for (var k2 in local) if (!(k2 in out)) out[k2] = local[k2];
    return out;
  }

  var toastTimer = null;
  function toast(text, warn) {
    if (!document.body) return;
    var el = document.getElementById('cloudToast');
    if (!el) {
      el = document.createElement('div'); el.id = 'cloudToast';
      el.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:9997;padding:7px 14px;border-radius:20px;font:12px/1.5 system-ui,"Microsoft YaHei",sans-serif;letter-spacing:.03em;box-shadow:0 4px 16px rgba(10,30,60,.2);opacity:0;transition:opacity .25s;pointer-events:none;max-width:80vw';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.background = warn ? '#fdf3e3' : '#e8f2fb';
    el.style.color = warn ? '#8a6512' : '#1c4375';
    el.style.border = '1px solid ' + (warn ? '#e3c878' : '#c8dcf0');
    el.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.style.opacity = '0'; }, 2400);
  }

  function reloadOnce() {
    try {
      var n = +(sessionStorage.getItem('cloudReload') || 0);
      if (n >= 1) return;
      sessionStorage.setItem('cloudReload', String(n + 1));
      location.reload();
    } catch (e) {}
  }

  /* ============ 云端客户端 ============ */
  var cloud = window.cloud;
  function cloudReady() { return window.cloudAvailable && cloud && cloud.auth && cloud.database; }
  var signedIn = false, currentUser = '';

  async function pullState() {
    var r = await cloud.database.from('user_state').select('data, updated_at').maybeSingle();
    if (r.error || !r.data) return { data: {}, updatedAt: 0 };
    var d = r.data.data;
    return { data: (d && typeof d === 'object') ? d : {}, updatedAt: r.data.updated_at ? Date.parse(r.data.updated_at) : 0 };
  }

  /* ============ 账号隔离：切换账号时清空上一账号的本地数据 ============ */
  function clearAccountData() {
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && PREFIX.test(k)) keys.push(k);
      }
      keys.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    } catch (e) {}
  }

  /* ============ 推送本地改动到云端（合并写入） ============ */
  async function push(force) {
    if (busy) { queued = true; return; }
    if (!force && !dirty) return;
    if (!signedIn || !cloudReady()) { dirty = true; return; } /* 未登录：本机保留，登录后再推 */
    busy = true; dirty = false;
    try {
      var local = snap();
      var remote = await pullState();
      var merged = remote && Object.keys(remote.data).length ? mergeInto(remote.data) : local;
      for (var k in local) if (!(k in merged)) merged[k] = local[k];
      var r = await cloud.database.from('user_state')
        .upsert({ data: merged, updated_at: new Date().toISOString() }, { onConflict: 'owner_id' })
        .select();
      if (r.error) {
        if (r.error.code === '42501' || /permission|policy/i.test(r.error.message || '')) toast('☁ 没有云端写入权限，已存本机', true);
        else { dirty = true; toast('☁ 同步失败，稍后自动重试', true); }
      } else {
        apply(merged);
        setMeta({ ts: Date.now() });
        toast('☁ 进度已同步到云端');
      }
    } catch (e) {
      dirty = true; toast('☁ 离线中，已存本机，联网后自动同步', true);
    } finally {
      busy = false;
      if (queued) { queued = false; push(true); }
      else if (dirty && !timer) { timer = setTimeout(function () { timer = null; push(false); }, 8000); }
    }
  }
  function schedule() {
    dirty = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; push(false); }, 700);
  }

  /* ============ 权限门控（主人可见 课外拓展；AI 对登录用户开放） ============ */
  function hideOwnerNav() {
    OWNER_ROUTES.forEach(function (r) {
      var els = document.querySelectorAll('[data-nav="' + r + '"], a[href="' + r + '"]');
      for (var i = 0; i < els.length; i++) els[i].style.setProperty('display', 'none', 'important');
    });
  }
  function guardRoutes(ai) {
    if (ai) return;
    function check() {
      var h = location.hash || '';
      if (OWNER_ROUTES.indexOf(h) >= 0 || /^#\/c\/extracurricular(?:\/|$)/.test(h)) location.replace('#/');
    }
    check();
    window.addEventListener('hashchange', check);
  }
  function applyAccountMode(ai) {
    guardRoutes(ai);
    if (!ai) {
      if (document.readyState !== 'loading') hideOwnerNav();
      else document.addEventListener('DOMContentLoaded', hideOwnerNav);
      var navObs = new MutationObserver(hideOwnerNav);
      try { navObs.observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
      setTimeout(function () { try { navObs.disconnect(); } catch (e) {} }, 15000);
    }
  }

  /* ============ 登录弹窗 ============ */
  function ensureLoginStyle() {
    if (document.getElementById('cloudLoginStyle')) return;
    var st = document.createElement('style'); st.id = 'cloudLoginStyle';
    st.textContent =
      '.cloud-login-mask{position:fixed;inset:0;z-index:9998;background:rgba(8,20,42,.5);display:flex;align-items:center;justify-content:center;padding:18px}' +
      '.cloud-login-card{width:min(420px,92vw);background:#fff;border:1px solid #d5e3f2;border-radius:18px;padding:26px 24px;box-shadow:0 18px 50px rgba(8,20,42,.35);position:relative;font-family:system-ui,"Microsoft YaHei",sans-serif;color:#17365e}' +
      '.cloud-login-card h3{margin:0 0 6px;font-size:19px;color:#0b2545}' +
      '.cloud-login-sub{margin:0 0 18px;font-size:13px;line-height:1.7;color:#5a7392}' +
      '.cloud-login-row{display:flex;gap:8px;margin-bottom:10px}' +
      '.cloud-login-card input{flex:1;min-width:0;padding:11px 12px;border:1px solid #cdd9e8;border-radius:11px;font-size:14px;outline:none}' +
      '.cloud-login-card input:focus{border-color:#1d4368}' +
      '.cloud-login-card button{padding:11px 16px;border:0;border-radius:11px;background:#1d4368;color:#fff;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;transition:.15s}' +
      '.cloud-login-card button:hover{background:#143150}' +
      '.cloud-login-card button:disabled{opacity:.55;cursor:default}' +
      '.cloud-login-wb{width:100%;margin-top:6px;background:#2a6f4e}' +
      '.cloud-login-wb:hover{background:#1f573c}' +
      '.cloud-login-err{color:#b3261e;font-size:12.5px;min-height:16px;margin:2px 0 8px}' +
      '.cloud-login-tip{font-size:12px;color:#8aa0bb;text-align:center;margin-top:12px}' +
      '.cloud-login-x{position:absolute;top:10px;right:14px;border:0;background:none;font-size:22px;color:#9aacc2;cursor:pointer;line-height:1}' +
      '.cloud-login-sep{display:flex;align-items:center;gap:10px;color:#9aacc2;font-size:12px;margin:14px 0}' +
      '.cloud-login-sep::before,.cloud-login-sep::after{content:"";flex:1;height:1px;background:#e3ecf6}';
    (document.head || document.documentElement).appendChild(st);
  }
  function closeLogin() { var m = document.getElementById('cloudLoginMask'); if (m) m.remove(); }
  async function openLogin() {
    if (!cloudReady()) { toast('☁ 云端未就绪，请稍后重试', true); return; }
    ensureLoginStyle();
    closeLogin();
    var mask = document.createElement('div'); mask.id = 'cloudLoginMask'; mask.className = 'cloud-login-mask';
    mask.innerHTML =
      '<div class="cloud-login-card" role="dialog" aria-modal="true">' +
      '<button class="cloud-login-x" aria-label="关闭">×</button>' +
      '<h3>登录以启用云同步</h3>' +
      '<p class="cloud-login-sub">登录后，你的打卡、任务、备考记录会在手机 / 平板 / 电脑之间自动同步；AI 老师也随时可用。</p>' +
      '<div class="cloud-login-row"><input id="clEmail" type="email" inputmode="email" placeholder="邮箱（用于接收验证码）" autocomplete="email"><button id="clSend">获取验证码</button></div>' +
      '<div class="cloud-login-row" id="clCodeRow" style="display:none"><input id="clCode" inputmode="numeric" placeholder="6 位验证码"><button id="clVerify">登录 / 注册</button></div>' +
      '<div class="cloud-login-err" id="clErr"></div>' +
      '<div class="cloud-login-sep">或</div>' +
      '<button id="clWb" class="cloud-login-wb">使用 WorkBuddy 账号登录</button>' +
      '<div class="cloud-login-tip">首次用邮箱即自动注册，无需密码。</div>' +
      '</div>';
    (document.body || document.documentElement).appendChild(mask);
    var pending = null;
    function err(m) { var e = document.getElementById('clErr'); if (e) e.textContent = m || ''; }
    mask.addEventListener('click', function (e) { if (e.target === mask) closeLogin(); });
    mask.querySelector('.cloud-login-x').addEventListener('click', closeLogin);
    document.getElementById('clSend').addEventListener('click', async function () {
      var email = (document.getElementById('clEmail').value || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err('请输入有效的邮箱地址'); return; }
      this.disabled = true; err('');
      try {
        var r = await cloud.auth.sendOtp({ email: email });
        if (r.error) { err(r.error.message || '发送失败，请重试'); this.disabled = false; return; }
        pending = { email: email, verificationId: r.data.verificationId, isExistingUser: r.data.isExistingUser };
        document.getElementById('clCodeRow').style.display = 'flex';
        err('验证码已发送到 ' + email);
      } catch (e) { err('发送失败，请检查网络后重试'); this.disabled = false; }
    });
    document.getElementById('clVerify').addEventListener('click', async function () {
      if (!pending) { err('请先获取验证码'); return; }
      var token = (document.getElementById('clCode').value || '').trim();
      if (!/^\d{4,8}$/.test(token)) { err('请输入收到的验证码'); return; }
      this.disabled = true; err('');
      try {
        var r = await cloud.auth.verifyOtp({
          email: pending.email, verificationId: pending.verificationId,
          isExistingUser: pending.isExistingUser, token: token
        });
        if (r.error) { err(r.error.message || '验证失败，请重试'); this.disabled = false; return; }
        closeLogin();
        location.reload(); /* 重新初始化，拉取云端进度 */
      } catch (e) { err('验证失败，请重试'); this.disabled = false; }
    });
    document.getElementById('clWb').addEventListener('click', async function () {
      err('');
      try {
        var back = new URL(location.href);
        back.pathname = '/';
        ['code', 'state', 'provider'].forEach(function (k) { back.searchParams.delete(k); });
        var r = await cloud.auth.signInWithOAuth({ provider: 'workbuddy', redirectTo: back.toString() });
        if (r.error) { err(r.error.message || '登录发起失败'); return; }
        if (r.data && r.data.url) location.assign(r.data.url);
        else err('登录发起失败');
      } catch (e) { err('登录发起失败，请重试'); }
    });
  }

  /* ============ 账号区（右上角）：登录 / 退出 / 切换 ============ */
  function ensureAccountStyle() {
    if (document.getElementById('cloudAcctStyle')) return;
    var st = document.createElement('style'); st.id = 'cloudAcctStyle';
    st.textContent =
      '.cloud-acct{display:flex;align-items:center;gap:6px;margin-left:auto;flex-shrink:0}' +
      '.cloud-acct .u{font-size:12.5px;color:#68788c;margin-right:2px;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.cloud-acct a{font-size:12.5px;color:#1d4368;background:#eef3f9;border:1px solid #d5e3f2;border-radius:16px;padding:5px 12px;cursor:pointer;text-decoration:none;font-weight:600;transition:.15s}' +
      '.cloud-acct a:hover{background:#1d4368;color:#fff;border-color:#1d4368}' +
      '.topbar .nav{margin-left:0}' +
      '@media (max-width:640px){.cloud-acct .u{display:none}.cloud-acct a{padding:5px 9px}}';
    (document.head || document.documentElement).appendChild(st);
  }
  function accountHost() {
    return document.querySelector('.header-inner') || document.querySelector('.topbar') || document.querySelector('.footer-bottom');
  }
  function addAccountLinks() {
    if (document.getElementById('cloudLogout')) return;
    ensureAccountStyle();
    var host = accountHost();
    if (!host) return;
    var wrap = document.createElement('div'); wrap.className = 'cloud-acct';
    if (signedIn) {
      if (currentUser) { var u = document.createElement('span'); u.className = 'u'; u.textContent = currentUser; wrap.appendChild(u); }
      var a2 = document.createElement('a'); a2.id = 'cloudSwitch'; a2.textContent = '切换账号';
      a2.addEventListener('click', function (e) { e.preventDefault(); doLogout(false); });
      var a1 = document.createElement('a'); a1.id = 'cloudLogout'; a1.textContent = '退出账号';
      a1.addEventListener('click', function (e) { e.preventDefault(); doLogout(true); });
      wrap.appendChild(a2); wrap.appendChild(a1);
    } else {
      var a0 = document.createElement('a'); a0.id = 'cloudLoginBtn'; a0.textContent = '登录同步';
      a0.addEventListener('click', function (e) { e.preventDefault(); openLogin(); });
      wrap.appendChild(a0);
    }
    host.appendChild(wrap);
  }
  function doLogout(clearFirst) {
    if (clearFirst) clearAccountData();
    try { localStorage.removeItem(CLOUD_USER_KEY); } catch (e) {}
    if (cloudReady()) { cloud.auth.signOut().catch(function () {}); }
    location.reload();
  }

  /* ============ 初始化 ============ */
  async function init() {
    /* OAuth 回调（WorkBuddy 账号登录后回到本站） */
    try {
      var url = new URL(location.href);
      if (url.searchParams.has('code') && url.searchParams.has('state') && url.searchParams.get('provider') === 'workbuddy') {
        if (cloudReady() && typeof cloud.auth.handleWorkBuddyCallback === 'function') {
          await cloud.auth.handleWorkBuddyCallback();
          ['code', 'state', 'provider'].forEach(function (k) { url.searchParams.delete(k); });
          history.replaceState(null, '', url.pathname + url.search + url.hash);
        }
      }
    } catch (e) { /* 回调异常不阻塞本地使用 */ }

    if (!cloudReady()) {
      window.__CLOUD_USER__ = { name: '', ai: false };
      applyAccountMode(true);
      if (document.readyState !== 'loading') setTimeout(addAccountLinks, 0);
      else document.addEventListener('DOMContentLoaded', addAccountLinks);
      return; /* 离线 / SDK 未加载：仅本地模式 */
    }

    /* 检查已登录会话 */
    try {
      var s = await cloud.auth.getSession();
      if (s && s.data) { await onSignedIn(s.data); return; }
    } catch (e) {}

    /* 未登录：本地模式 + 提供登录入口 */
    window.__CLOUD_USER__ = { name: '', ai: false };
    applyAccountMode(true);
    if (document.readyState !== 'loading') setTimeout(addAccountLinks, 0);
    else document.addEventListener('DOMContentLoaded', addAccountLinks);
  }

  async function onSignedIn(session) {
    signedIn = true;
    var u = session && session.user;
    currentUser = (u && (u.name || u.email)) || '我';
    /* 账号隔离：本机若存的是另一账号数据，先清空避免串号 */
    var prev = ''; try { prev = localStorage.getItem(CLOUD_USER_KEY) || ''; } catch (e) {}
    if (prev && prev !== currentUser) clearAccountData();
    /* 拉取云端，合并到本机 */
    try {
      var remote = await pullState();
      if (remote && Object.keys(remote.data).length) apply(mergeInto(remote.data));
    } catch (e) {}
    try { localStorage.setItem(CLOUD_USER_KEY, currentUser); } catch (e) {}
    window.__CLOUD_USER__ = { name: currentUser, ai: true };
    applyAccountMode(true);
    addAccountLinks();
    if (Object.keys(snap()).length) schedule(); /* 本机改动推一次 */
  }

  /* ============ 拦截本机存储写入，自动上传 ============ */
  try {
    var origSet = Storage.prototype.setItem, origRemove = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (k, v) {
      var r = origSet.apply(this, arguments);
      if (!suppress && this === window.localStorage && PREFIX.test(String(k)) && String(k) !== META) schedule();
      return r;
    };
    Storage.prototype.removeItem = function (k) {
      var r = origRemove.apply(this, arguments);
      if (!suppress && this === window.localStorage && PREFIX.test(String(k)) && String(k) !== META) schedule();
      return r;
    };
  } catch (e) {}

  window.addEventListener('online', function () { if (dirty) push(false); });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (dirty) push(true); return; }
    if (signedIn && cloudReady()) {
      pullState().then(function (remote) {
        if (!remote || !Object.keys(remote.data).length) return;
        var m = meta();
        if ((remote.updatedAt || 0) > (m.ts || 0)) {
          apply(mergeInto(remote.data)); setMeta({ ts: remote.updatedAt });
          try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) {}
          toast('☁ 已获取其它设备的最新进度');
        }
      }).catch(function () {});
    }
  });

  if (dirty) setTimeout(function () { push(true); }, 1500);

  init();
})();
