/* ============================================================
   Liora 学习小屋 · 内容更新提醒（游戏式热更新）
   ------------------------------------------------------------
   为什么不需要重装 App：
     APK 只是一个打开正式站的窗口，笔记 / 简报 / 题库都在服务器上。
     游戏要下载更新包，这里连「包」都不存在，只缺一个「有新东西了」的提醒。
   做法：
     定时（以及切回前台时）重新取一次本站 HTML，只比较结构化指纹
     —— 带 ?v= 的资源版本 + 简报卡片的期号与标题 —— 不比较整页文本，
     因此平台注入脚本、搜索筛选、卡片重排、展开状态都不会造成误报。
   纯前端实现：不新增接口、不改后端、不改 APK。
   改本文件必须同步升 index.html 与 daily-brief.html 的 content-update.js?v=。
   ============================================================ */
(function () {
  'use strict';
  if (window.__lioraContentUpdate) return;
  window.__lioraContentUpdate = 1;

  var CHECK_MS = 120000;      /* 自动检查间隔：2 分钟 */
  var THROTTLE_MS = 8000;     /* 回前台/获得焦点的去抖 */
  var BAR_ID = 'liora-upd-bar';
  var FAB_ID = 'liora-upd-fab';
  var TOAST_ID = 'liora-upd-toast';
  var KEY_APPLIED = 'liora_upd_applied';
  var KEY_DISMISS = 'liora_upd_dismissed';

  var isBrief = !!document.getElementById('dailyBriefApp');
  var expectSel = isBrief ? '#dailyBriefApp'
    : (document.getElementById('font-ctrl') ? '#font-ctrl' : null);
  var busy = false;
  var lastCheck = 0;
  var toastTimer = null;

  function store(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }
  function save(key, value) {
    try { sessionStorage.setItem(key, value); } catch (e) {}
  }

  /* 指纹只取「服务器写死、前端不会改写」的字段。
     主站只比资源版本号；简报页额外比卡片数量、期号、标题。 */
  function vsOf(doc) {
    var vs = [];
    Array.prototype.forEach.call(doc.querySelectorAll('script[src],link[href]'), function (el) {
      var u = el.getAttribute('src') || el.getAttribute('href') || '';
      if (!/\.(js|css)(\?|$)/i.test(u)) return;
      var m = /[?&]v=([^&"']+)/.exec(u);
      if (m) vs.push(u.split('?')[0] + '@' + m[1]);
    });
    return vs.sort();
  }

  function cardsOf(doc, brief) {
    if (!brief) return '';
    var eds = [], titles = [];
    Array.prototype.forEach.call(doc.querySelectorAll('[data-edition]'), function (el) {
      eds.push(el.getAttribute('data-edition') || '');
    });
    Array.prototype.forEach.call(doc.querySelectorAll('.rc-title'), function (el) {
      titles.push((el.textContent || '').replace(/\s+/g, ' ').trim());
    });
    return [doc.querySelectorAll('.reading-card').length,
            eds.length + ':' + eds.sort().join('|'),
            titles.sort().join('|')].join('##');
  }

  function snap(doc, brief) { return { vs: vsOf(doc), cards: cardsOf(doc, brief) }; }
  function keyOf(s) { return JSON.stringify(s); }

  var baseSnap = snap(document, isBrief);

  /* 远端有而当前没有的引用、或同路径版本不同 = 有新内容。
     当前有而远端没有的（读书懒加载脚本等动态注入）一律忽略，避免误报。 */
  function sameContent(base, remote) {
    if (base.cards !== remote.cards) return false;
    var b = {};
    base.vs.forEach(function (x) {
      var i = x.lastIndexOf('@');
      b[x.slice(0, i)] = x.slice(i + 1);
    });
    for (var i = 0; i < remote.vs.length; i++) {
      var x = remote.vs[i], p = x.lastIndexOf('@');
      var path = x.slice(0, p), ver = x.slice(p + 1);
      if (!Object.prototype.hasOwnProperty.call(b, path) || b[path] !== ver) return false;
    }
    return true;
  }

  function kindOf(base, remote) {
    return isBrief && base.cards && remote.cards && base.cards !== remote.cards
      ? '发现新一期简报' : '学习小屋有新内容';
  }

  var CSS = '' +
    '#liora-upd-fab{cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.liora-upd-fab{position:fixed;left:12px;bottom:calc(14px + env(safe-area-inset-bottom));' +
      'z-index:9998;display:inline-flex;align-items:center;gap:6px;padding:8px 13px;' +
      'border:1px solid rgba(11,37,69,.18);border-radius:999px;background:rgba(255,255,255,.95);' +
      'color:#0b2545;font-size:12px;font-family:inherit;line-height:1;' +
      'box-shadow:0 4px 14px rgba(11,37,69,.16)}' +
    '.font-ctrl #liora-upd-fab{min-width:34px;padding:4px 11px;font-size:14px}' +
    '.font-ctrl #liora-upd-fab .liora-upd-txt{display:none}' +
    '.liora-upd-ico{display:inline-block;font-size:15px;line-height:1}' +
    '#liora-upd-fab.busy .liora-upd-ico{animation:lioraUpdSpin .9s linear infinite}' +
    '@keyframes lioraUpdSpin{to{transform:rotate(360deg)}}' +
    '@media (prefers-reduced-motion:reduce){#liora-upd-fab.busy .liora-upd-ico{animation:none}}' +
    '#liora-upd-bar{position:fixed;top:0;left:0;right:0;z-index:9999;display:none;' +
      'align-items:center;justify-content:center;gap:8px;cursor:pointer;text-align:center;' +
      'padding:calc(10px + env(safe-area-inset-top)) 46px 10px;' +
      'background:#0b2545;color:#f2e6c9;font-size:14px;line-height:1.5;' +
      'box-shadow:0 4px 18px rgba(11,37,69,.32);font-family:inherit}' +
    '#liora-upd-bar b{color:#ffd98a;text-decoration:underline;text-underline-offset:3px}' +
    '#liora-upd-close{position:absolute;right:8px;top:calc(6px + env(safe-area-inset-top));' +
      'width:34px;height:34px;border:0;background:transparent;color:#b8cbe2;font-size:20px;' +
      'line-height:1;cursor:pointer}' +
    '#liora-upd-toast{position:fixed;left:50%;bottom:calc(70px + env(safe-area-inset-bottom));' +
      'transform:translateX(-50%);z-index:9999;display:none;align-items:center;gap:10px;' +
      'max-width:calc(100vw - 32px);white-space:nowrap;background:rgba(11,37,69,.95);' +
      'color:#f2e6c9;border-radius:999px;padding:9px 15px;font-size:13px;' +
      'box-shadow:0 6px 20px rgba(11,37,69,.28);font-family:inherit}' +
    '#liora-upd-toast button{border:0;background:transparent;color:#ffd98a;font-size:13px;' +
      'text-decoration:underline;cursor:pointer;padding:0;font-family:inherit}' +
    '@media print{#liora-upd-fab,#liora-upd-bar,#liora-upd-toast{display:none!important}}';

  function ensureCss() {
    if (document.getElementById('liora-upd-css')) return;
    var s = document.createElement('style');
    s.id = 'liora-upd-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function el(id) { return document.getElementById(id); }

  function buildFab() {
    if (el(FAB_ID)) return;
    var host = document.querySelector('.font-ctrl');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = FAB_ID;
    btn.className = host ? 'fc-btn' : 'liora-upd-fab';
    btn.title = '检查学习小屋是否有新内容';
    btn.setAttribute('aria-label', '检查更新');
    btn.innerHTML = '<span class="liora-upd-ico" aria-hidden="true">↻</span>' +
                    '<span class="liora-upd-txt">检查更新</span>';
    btn.addEventListener('click', function () { check({ manual: true }); });
    (host || document.body).appendChild(btn);
  }

  function setBusy(on) {
    busy = on;
    var b = el(FAB_ID);
    if (b) b.classList.toggle('busy', on);
  }

  function toast(text, ms, withReload) {
    var t = el(TOAST_ID);
    if (!t) {
      t = document.createElement('div');
      t.id = TOAST_ID;
      document.body.appendChild(t);
    }
    t.textContent = text;
    if (withReload) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = '仍要刷新';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        location.reload();
      });
      t.appendChild(b);
    }
    t.style.display = 'inline-flex';
    if (toastTimer) clearTimeout(toastTimer);
    if (ms > 0) {
      toastTimer = setTimeout(function () { t.style.display = 'none'; }, ms);
    }
  }
  function hideToast() {
    if (toastTimer) clearTimeout(toastTimer);
    var t = el(TOAST_ID);
    if (t) t.style.display = 'none';
  }

  function hideBanner() {
    var b = el(BAR_ID);
    if (b) b.style.display = 'none';
  }

  function showBanner(sig, label) {
    if (store(KEY_DISMISS) === sig || store(KEY_APPLIED) === sig) return;
    var b = el(BAR_ID);
    if (!b) {
      b = document.createElement('div');
      b.id = BAR_ID;
      b.setAttribute('role', 'status');
      b.innerHTML = '<span class="liora-upd-bar-text"></span>';
      var close = document.createElement('button');
      close.type = 'button';
      close.id = 'liora-upd-close';
      close.setAttribute('aria-label', '关闭更新提示');
      close.textContent = '×';
      close.addEventListener('click', function (e) {
        e.stopPropagation();
        save(KEY_DISMISS, b.getAttribute('data-sig') || '');
        b.style.display = 'none';
      });
      b.appendChild(close);
      b.addEventListener('click', function () {
        save(KEY_APPLIED, b.getAttribute('data-sig') || '');
        location.reload();
      });
      document.body.appendChild(b);
    }
    b.setAttribute('data-sig', sig);
    b.querySelector('.liora-upd-bar-text').innerHTML =
      '✨ ' + label + ' · <b>点此更新</b>（不用重装 App）';
    b.style.display = 'flex';
  }

  function done(remote, opts) {
    setBusy(false);
    if (remote == null) {
      if (opts.manual) toast('暂时检查不了，联网后再试', 3200);
      return;
    }
    if (sameContent(baseSnap, remote)) {
      if (opts.manual) toast('已是最新版本 ✓', 4200, true);
      return;
    }
    hideToast();
    showBanner(keyOf(remote), kindOf(baseSnap, remote));
  }

  function check(opts) {
    opts = opts || {};
    if (busy) {
      /* 用户正好点在上一次检查途中：排到下一次，不吞掉这次点击 */
      opts._retry = (opts._retry || 0) + 1;
      if (opts._retry <= 8) setTimeout(function () { check(opts); }, 400);
      return;
    }
    var now = Date.now();
    if (!opts.manual && !opts.fakeRemote && !opts.force && now - lastCheck < THROTTLE_MS) return;
    lastCheck = now;
    setBusy(true);
    if (opts.manual) toast('正在检查更新…', 0);

    /* 验收钩子：简报页模拟「新增一张卡片」，主站模拟「资源换了版本」 */
    if (opts.fakeRemote) {
      var fake = isBrief
        ? { vs: baseSnap.vs.slice(), cards: baseSnap.cards + '|NEW-EDITION' }
        : { vs: baseSnap.vs.concat(['fake-asset@new-version']), cards: baseSnap.cards };
      setTimeout(function () { done(fake, opts); }, 320);
      return;
    }

    if (!window.fetch || !window.DOMParser) {
      done(baseSnap, opts);
      return;
    }
    fetch(location.pathname + location.search, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    }).then(function (res) {
      if (!res.ok) return null;
      if (/__login|\/login/i.test(res.url || '')) return null;
      return res.text();
    }).then(function (html) {
      if (!html) { done(null, opts); return; }
      var doc = new DOMParser().parseFromString(html, 'text/html');
      if (expectSel && !doc.querySelector(expectSel)) { done(null, opts); return; }
      done(snap(doc, isBrief), opts);
    }).catch(function () {
      done(null, opts);
    });
  }

  function init() {
    if (!/^https?:$/.test(location.protocol)) return;
    ensureCss();
    buildFab();
    /* 页面刚打开时不打扰；3 秒后建立首次检查 */
    setTimeout(function () { check({ force: true }); }, 3000);
    setInterval(function () { if (!document.hidden) check({}); }, CHECK_MS);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) check({});
    });
    window.addEventListener('focus', function () { check({}); });
    window.addEventListener('pageshow', function () { check({}); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* 供线上真实浏览器验收使用：check({fakeRemote:'...'}) 模拟新一期 */
  window.LioraUpdate = {
    check: check,
    signature: function () { return keyOf(baseSnap); },
    base: function () { return baseSnap; },
    bannerText: function () {
      var b = el(BAR_ID);
      return (b && b.style.display === 'flex')
        ? (b.textContent || '').replace(/\s+/g, ' ').trim() : '';
    },
    hideBanner: hideBanner
  };
})();
