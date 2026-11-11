/* ============================================================
 * 学习小屋 · 待办小组件（独立页面 todo.html 专用）
 *
 * 设计原则：只把网站里的「待办」摘出来，数据完全互通，不另起一份清单。
 *  - 我的待办        → lioraTodoItems（新键，云同步）
 *  - 今日学习任务    → PREP_DATA.days + liora-review-calendar-v1
 *                      + liora-prep-postpone-v1（与首页「今日任务」同一份数据）
 *  - 本周 DDL        → cabin-homework-<周一>（与首页「本周 DDL」同一份数据）
 * 所有键都命中 cloud-sync.js 的同步前缀，桌面小组件打勾 = 网站打勾。
 * ============================================================ */
(function () {
  'use strict';

  var KEY = 'lioraTodoItems';        /* 自定义待办 */
  var UIKEY = 'lioraTodoUi';         /* 折叠等界面偏好 */
  var DONEKEY = 'liora-review-calendar-v1';
  var POSTKEY = 'liora-prep-postpone-v1';
  var HW_PREFIX = 'cabin-homework-';
  /* 线上分享链接有网关校验：从桌面图标点回主站时，地址必须自带通行码，
     优先沿用当前地址里的码，取不到就用站点默认码。 */
  var DEFAULT_SHARECODE = 'L4NKT6REQ6';
  function siteUrl(path) {
    var m = /(?:[?&])sharecode=([^&#]+)/.exec(location.search);
    var code = m ? decodeURIComponent(m[1]) : DEFAULT_SHARECODE;
    return path + (path.indexOf('?') >= 0 ? '&' : '?') + 'sharecode=' + encodeURIComponent(code);
  }
  var COURSES = [
    { id: 'accounting', name: '会计作业' },
    { id: 'economics', name: '经济作业' },
    { id: 'mathematics', name: '数学作业' },
    { id: 'computing', name: '计算机作业' },
    { id: 'english', name: '学术英语作业' }
  ];

  /* ---------- 小工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function read(k, dflt) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? dflt : v; }
    catch (e) { return dflt; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function shift(s, n) {
    var p = s.split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    d.setUTCDate(d.getUTCDate() + n);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function diffDays(a, b) {
    return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
  }
  function dateLabel() {
    var d = new Date();
    return (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · 星期' + ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  }
  function toast(msg) {
    var el = document.getElementById('tdToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2000);
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* ---------- 数据汇集 ---------- */
  function collect() {
    var items = read(KEY, []);
    if (!Array.isArray(items)) items = [];
    items = items.filter(function (x) { return x && typeof x.text === 'string'; });

    var D = window.PREP_DATA || {};
    var days = Array.isArray(D.days) ? D.days : [];
    var last = days.length ? days[days.length - 1].date : todayStr();
    var today = todayStr();
    var done = read(DONEKEY, {}) || {};
    var post = read(POSTKEY, {}) || {};
    var plan = [], late = [];

    days.forEach(function (day) {
      (day.items || []).forEach(function (it, idx) {
        var k = it.id || day.date + '#' + idx;
        var eff = shift(day.date, post[k] || 0);
        if (eff > last) eff = last;                 /* 与首页 renderHomeTaskBoards 完全一致 */
        var row = {
          key: k,
          label: (it.label || '') + (it.minutes ? ' · ' + it.minutes + ' 分钟' : ''),
          href: it.href && it.href.charAt(0) === '#' ? siteUrl('/index.html') + it.href : '',
          done: !!done[k],
          date: eff
        };
        if (eff === today) plan.push(row);
        /* 最近 7 天没打勾、也没有主动顺延的任务 → 补做区 */
        else if (!row.done && !(post[k] > 0) && day.date < today && diffDays(day.date, today) <= 7) {
          row.days = diffDays(day.date, today);
          late.push(row);
        }
      });
    });
    late.sort(function (a, b) { return a.days - b.days; });

    var wd = new Date(today + 'T12:00:00').getDay();
    var monday = shift(today, -((wd + 6) % 7));
    var hwDone = read(HW_PREFIX + monday, {}) || {};
    var ddl = COURSES.map(function (c) {
      return { key: c.id, label: c.name, done: !!hwDone[c.id] };
    });
    return { items: items, plan: plan, late: late, ddl: ddl, hwKey: HW_PREFIX + monday };
  }

  /* ---------- 渲染 ---------- */
  var lists, input;
  function itemHtml(o, kind) {
    return '<div class="td-item' + (o.done ? ' done' : '') + (kind === 'late' ? ' td-late' : '') + '" data-id="' + esc(o.key) + '">' +
      '<label class="td-check"><input type="checkbox" data-kind="' + kind + '" data-key="' + esc(o.key) + '"' +
        (o.done ? ' checked' : '') + '><span class="td-box"></span></label>' +
      '<span class="td-text">' +
        (o.days ? '<span class="td-badge">逾期 ' + o.days + ' 天</span>' : '') +
        esc(o.label) + '</span>' +
      (o.href ? '<a class="td-go" href="' + esc(o.href) + '" target="_blank" rel="noopener">查看 →</a>' : '') +
      (kind === 'mine' ? '<button class="td-del" data-act="del" data-id="' + esc(o.key) + '" title="删除">×</button>' : '') +
      '</div>';
  }
  function section(key, title, tag, count, bodyHtml, ui) {
    var open = !ui.collapsed || !ui.collapsed[key];
    return '<section class="td-sec' + (open ? ' open' : '') + '">' +
      '<button class="td-sec-head" type="button" data-act="toggle" data-sec="' + key + '">' +
        '<span class="td-sec-title">' + title + '</span>' +
        (tag ? '<span class="td-sec-tag">' + tag + '</span>' : '') +
        '<span class="td-count">' + count + '</span><span class="td-caret">▾</span>' +
      '</button>' +
      '<div class="td-sec-body">' + bodyHtml + '</div></section>';
  }
  function render() {
    if (!lists) return;
    var d = collect();
    var ui = read(UIKEY, {}) || {};
    if (!ui.collapsed) ui.collapsed = {};
    var html = '';

    /* 1) 我的待办：未完成在前，已完成在后 */
    var mine = d.items.slice().sort(function (a, b) {
      return (!!a.done - !!b.done) || ((b.createdAt || 0) - (a.createdAt || 0));
    });
    var mineHtml = mine.length ? mine.map(function (o) {
      return itemHtml({ key: o.id, label: o.text, done: !!o.done }, 'mine');
    }).join('') : '<p class="td-empty">还没有待办。<br>在上面输入框写一条，回车就能加上 ✍️</p>';
    html += section('mine', '我的待办', '随手记', d.items.filter(function (x) { return !x.done; }).length, mineHtml, ui);

    /* 2) 网站今日任务（含补做） */
    var planHtml = d.plan.length ? d.plan.map(function (o) { return itemHtml(o, 'plan'); }).join('')
      : '<p class="td-empty">今天网站里没有排定任务 🙂</p>';
    if (d.late.length) {
      var lateOpen = !!ui.lateOpen;
      planHtml += '<button class="td-sub" type="button" data-act="late">' +
        '<span>🕐 之前没打勾的 · ' + d.late.length + ' 项（最近 7 天）</span>' +
        '<span class="td-caret" style="' + (lateOpen ? 'transform:rotate(180deg)' : '') + '">▾</span></button>';
      if (lateOpen) {
        planHtml += d.late.slice(0, 8).map(function (o) { return itemHtml(o, 'late'); }).join('');
        if (d.late.length > 8) planHtml += '<div class="td-late-note">还有 ' + (d.late.length - 8) + ' 项更早的任务，可到网站「复习计划」查看。</div>';
      }
    }
    html += section('plan', '今日学习任务', '网站同步', d.plan.filter(function (x) { return !x.done; }).length, planHtml, ui);

    /* 3) 本周 DDL */
    var ddlHtml = d.ddl.map(function (o) { return itemHtml(o, 'ddl'); }).join('');
    html += section('ddl', '本周 DDL', '网站同步', d.ddl.filter(function (x) { return !x.done; }).length, ddlHtml, ui);

    lists.innerHTML = html;

    /* 顶部进度：把所有待办合并统计 */
    /* 进度只统计看得见的三块；「补做」是折叠的历史提醒，不压低今日完成率 */
    var all = [].concat(
      d.items.map(function (x) { return !!x.done; }),
      d.plan.map(function (x) { return x.done; }),
      d.ddl.map(function (x) { return x.done; })
    );
    var left = all.filter(function (x) { return !x; }).length;
    var total = all.length;
    var pct = total ? Math.round((total - left) / total * 100) : 0;
    document.getElementById('tdLeft').innerHTML = left ? '还剩 <b>' + left + '</b> 项待办' : '今天全部完成 🎉';
    document.getElementById('tdPct').textContent = pct + '% · 共 ' + total + ' 项';
    document.getElementById('tdBar').style.width = pct + '%';
    document.getElementById('tdDate').textContent = dateLabel();

    /* 底部：有已完成项才显示清理入口 */
    var hasDone = d.items.some(function (x) { return x.done; });
    document.getElementById('tdClearDone').style.display = hasDone ? '' : 'none';
  }

  /* ---------- 写回（与主站共用同一批 localStorage 键） ---------- */
  function addItem(text) {
    var items = read(KEY, []);
    if (!Array.isArray(items)) items = [];
    items.unshift({ id: uid(), text: text, done: false, createdAt: Date.now() });
    write(KEY, items);
    render();
  }
  function setMine(id, done) {
    var items = read(KEY, []);
    if (!Array.isArray(items)) return;
    items.forEach(function (x) { if (x.id === id) x.done = done; });
    write(KEY, items);
    render();
  }
  function delMine(id) {
    var items = read(KEY, []);
    if (!Array.isArray(items)) return;
    write(KEY, items.filter(function (x) { return x.id !== id; }));
    render();
  }
  function setDoneKey(key, k, done) {
    var o = read(key, {}) || {};
    if (done) o[k] = true; else delete o[k];
    write(key, o);
    render();
  }
  function editMine(li, id) {
    var span = li.querySelector('.td-text');
    if (!span || li.querySelector('.td-edit')) return;
    var inp = document.createElement('input');
    inp.className = 'td-edit';
    inp.value = span.textContent;
    inp.maxLength = 120;
    span.parentNode.replaceChild(inp, span);
    inp.focus(); inp.select();
    var finished = false;
    function commit(save) {
      if (finished) return;
      finished = true;
      var v = inp.value.trim();
      if (save && v) {
        var items = read(KEY, []);
        if (Array.isArray(items)) {
          items.forEach(function (x) { if (x.id === id) x.text = v; });
          write(KEY, items);
        }
      }
      render();
    }
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(true); }
      else if (e.key === 'Escape') { e.preventDefault(); commit(false); }
    });
    inp.addEventListener('blur', function () { commit(true); });
  }

  /* ---------- 安装到桌面（PWA） ---------- */
  var deferred = null;
  function standalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
  }
  function installedView() {
    document.getElementById('tdInstall').hidden = true;
    document.getElementById('tdInstallTip').hidden = true;
    document.getElementById('tdInstalled').hidden = false;
  }
  function initInstall() {
    var btn = document.getElementById('tdInstall');
    var tip = document.getElementById('tdInstallTip');
    if (standalone()) { installedView(); return; }
    btn.hidden = false;
    /* 按钮文案固定在 HTML 里（APP 模式），脚本不再改写，避免覆盖掉说明小字 */
    btn.addEventListener('click', function () {
      if (deferred) {
        deferred.prompt();
        deferred.userChoice.then(function (r) {
          if (r && r.outcome === 'accepted') { installedView(); toast('已安装，桌面会出现「学习小屋 · 待办」'); }
          else toast('取消安装，随时可以再点这里');
          deferred = null;
        });
      } else {
        tip.hidden = !tip.hidden;
      }
    });
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      btn.hidden = false;
    });
    window.addEventListener('appinstalled', function () { deferred = null; installedView(); });
  }

  /* ---------- APP 模式说明 ----------
     首选浏览器原生安装：启动的是系统本来就信任的浏览器，不运行下载来的脚本，
     因此 Windows 保护提示 / Mac 隔离都不会拦。下载包只作为「常驻小卡片」备选。 */
  var TIP_HEAD =
    '<b>为什么 APP 模式不会被电脑拦？</b><br>' +
    '安装成应用时，系统启动的是你电脑上本来就装好的浏览器，不是从网上下载的脚本 —— ' +
    '所以 Windows 不会弹「已保护你的电脑」，Mac 也不会提示「身份不明的开发者」。<br>';
  var TIP_TAIL =
    '<b>想要一直贴在桌面、不用点开的小卡片？</b><br>' +
    '用下面两个下载按钮：Mac 是真正的 <b>.app</b> 应用包，Windows 是纯文本网页快捷方式，都不是要运行的脚本；第一次在小窗里登录一次即可。<br>' +
    '<span style="color:#68788c">两个下载入口都在，想给别的电脑下包直接点另一个。不管用哪种方式，待办都是同一份（同一账号）。</span>';
  var TIP_WINDOWS = TIP_HEAD +
    '<b>按钮点了没弹窗？手动两下就好（Edge / Chrome）</b><br>' +
    '点地址栏最右边的「安装」小图标；或右上角 <b>⋯</b> → <b>应用</b> → <b>安装此站点</b>。' +
    '确认后桌面出现「学习小屋 · 待办」，双击就是没有地址栏的独立小窗。<br>' +
    '<b>手机 / 平板</b>：浏览器菜单 → <b>添加到主屏幕</b>。<br>' + TIP_TAIL;
  var TIP_MAC = TIP_HEAD +
    '<b>按钮点了没弹窗？手动两下就好</b><br>' +
    'Chrome / Edge → 地址栏最右边的「安装」小图标；' +
    'Safari（macOS Sonoma 或更新）→ 点「共享」→ <b>添加到程序坞</b>。' +
    '程序坞里会出现「学习小屋 · 待办」，点开就是没有地址栏的独立小窗。<br>' + TIP_TAIL;
  var TIP_MOBILE = TIP_HEAD +
    '<b>手机 / 平板：安装到主屏幕</b><br>' +
    '浏览器菜单 → <b>添加到主屏幕</b>，点桌面图标即可打开待办（与网站同一份，自动同步）。<br>' +
    '<span style="color:#68788c">电脑版安装包仅适用于 Windows / Mac 电脑，在手机或平板上无法使用，请用上方「添加到主屏幕」安装。</span>';

  function tdPlatform() {
    var u = navigator.userAgent || '';
    var p = (navigator.platform || '').toLowerCase();
    if (/iphone|ipad|ipod/i.test(u)) return 'mobile';
    /* iPadOS 13+ 会把自己伪装成 Mac，用触控点数区分 */
    if (p === 'macintel' && navigator.maxTouchPoints > 1) return 'mobile';
    if (/^mac/i.test(p) || /macintosh|mac os x/i.test(u)) return 'mac';
    return 'windows';
  }
  function initPlatform() {
    var plat = tdPlatform();
    window.__tdPlatform = plat;
    var win = document.getElementById('tdDownloadWin');
    var mac = document.getElementById('tdDownloadMac');
    var tip = document.getElementById('tdInstallTip');
    var close = document.getElementById('tdClose');
    if (close && plat !== 'windows') close.title = '关闭小卡片（或按 Command + W）';
    /* 两个下载地址直接写在 HTML 里（脚本没加载成功也能下），
       这里只给当前系统挂「这台电脑」标记，不隐藏、不改写另一个入口。 */
    if (win && mac) {
      win.classList.toggle('is-recommended', plat === 'windows');
      mac.classList.toggle('is-recommended', plat === 'mac');
    }
    /* APP 按钮文案固定，只按平台换展开说明里的手动步骤 */
    if (plat === 'mac') { if (tip) tip.innerHTML = TIP_MAC; }
    else if (plat === 'mobile') {
      /* 平板 / 手机：桌面下载包（Windows .exe / Mac .zip）根本用不了，
         直接隐藏，并自动展开「添加到主屏幕」指引，避免误点下载拿到打不开的文件。 */
      if (tip) { tip.innerHTML = TIP_MOBILE; tip.hidden = false; }
      document.body.classList.add('td-mobile');
    }
    else { if (tip) tip.innerHTML = TIP_WINDOWS; }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    lists = document.getElementById('tdLists');
    input = document.getElementById('tdInput');
    if (!lists || !input) return;

    /* 桌宠模式：下载包启动的是无边框置顶小窗，切成常驻桌面的紧凑卡片 */
    if (/[?&]pet=1/.test(location.search)) document.body.classList.add('pet');
    var closeBtn = document.getElementById('tdClose');
    if (closeBtn) closeBtn.addEventListener('click', function () {
      try { window.close(); } catch (e) {}
      setTimeout(function () { toast('小卡片没关掉的话，按 Alt+F4 即可'); }, 350);
    });

    document.getElementById('tdAdd').addEventListener('click', function () {
      var v = input.value.trim();
      if (!v) { input.focus(); return; }
      addItem(v); input.value = ''; input.focus();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var v = input.value.trim();
        if (!v) return;
        addItem(v); input.value = '';
      } else if (e.key === 'Escape') { input.value = ''; input.blur(); }
    });

    lists.addEventListener('change', function (e) {
      var cb = e.target;
      if (!cb || cb.type !== 'checkbox') return;
      var kind = cb.getAttribute('data-kind'), k = cb.getAttribute('data-key'), on = cb.checked;
      if (kind === 'mine') setMine(k, on);
      else if (kind === 'plan' || kind === 'late') setDoneKey(DONEKEY, k, on);
      else if (kind === 'ddl') setDoneKey(collect().hwKey, k, on);
    });

    lists.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'del') { delMine(btn.getAttribute('data-id')); return; }
      if (act === 'toggle') {
        var ui = read(UIKEY, {}) || {};
        if (!ui.collapsed) ui.collapsed = {};
        var sec = btn.getAttribute('data-sec');
        ui.collapsed[sec] = !ui.collapsed[sec];
        write(UIKEY, ui); render(); return;
      }
      if (act === 'late') {
        var u = read(UIKEY, {}) || {};
        u.lateOpen = !u.lateOpen;
        write(UIKEY, u); render(); return;
      }
    });
    lists.addEventListener('dblclick', function (e) {
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains('td-text')) return;
      var li = t.parentNode;
      if (!li || !li.querySelector('input[data-kind="mine"]')) return;
      editMine(li, li.getAttribute('data-id'));
    });

    document.getElementById('tdClearDone').addEventListener('click', function () {
      var items = read(KEY, []);
      if (!Array.isArray(items)) return;
      var n = items.filter(function (x) { return x.done; }).length;
      if (!n) return;
      write(KEY, items.filter(function (x) { return !x.done; }));
      render(); toast('已清掉 ' + n + ' 条完成项');
    });
    document.getElementById('tdBack').addEventListener('click', function () {
      var back = siteUrl('/index.html');
      var w = window.open(back, '_blank');
      if (!w) window.location.href = back;
    });

    initInstall();
    initPlatform();
    render();

    /* 与网站 / 其它设备互通：本地写入、云端拉取都即时重绘 */
    window.addEventListener('storage', function (e) {
      if (!e.key || /^(lioraTodo|liora-review-calendar|liora-prep-postpone|cabin-homework)/i.test(e.key)) render();
    });
    window.addEventListener('hashchange', render);
    window.addEventListener('focus', render);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });

    /* 跨天自动刷新今日任务 */
    var lastDay = todayStr();
    setInterval(function () {
      var t = todayStr();
      if (t !== lastDay) { lastDay = t; render(); }
    }, 60000);

    if (/[?&]focus=1/.test(location.search)) input.focus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
