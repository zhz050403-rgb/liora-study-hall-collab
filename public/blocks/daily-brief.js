/* ============================================================
   每日简报 · 独立页的行为层
   ------------------------------------------------------------
   - 挂载点 API 保留：window.DailyBrief.render / clear / slots
   - 2026-11-07：统一主站导航（汉堡菜单）、报纸式折叠、
     展开/收起全部、本期搜索、无结果提示。
   - 兼容 ChatGPT 后续用 DailyBrief.render() 注入平铺 <article>，
     渲染后会自动转成 <details> 折叠卡，不改内容。
   - 2026-11-09：期号日期不再用「今天」冒充新一期，改由内容算出；
     单期页 = 卡片 .rc-date[datetime] 最大值 →「本期收录 · 截至 …」；
     多期存档页（卡片带 data-edition）= 最大期号 →「收录至 …」；
     每次渲染/搜索都会重算，ChatGPT 注入新内容后也能自动对齐。
   改完请同步升 daily-brief.html 里的 ?v=（.js 是 immutable 长缓存）。
   ============================================================ */
(function () {
  'use strict';

  var slots = { 'main': document.getElementById('dailyBriefContent') };
  var root = slots.main;
  var searchInput = document.getElementById('briefSearch');
  var foldBtn = document.getElementById('briefFoldAll');
  var emptyTip = document.getElementById('briefEmpty');
  var countTip = document.getElementById('briefCount');

  function box(name) {
    var el = slots[name];
    if (!el) {
      console.warn('[DailyBrief] 未找到挂载点：' + name);
      return null;
    }
    return el;
  }

  function cardList() {
    if (!root) return [];
    return Array.prototype.slice.call(root.querySelectorAll('.reading-card'));
  }

  function visibleCards() {
    return cardList().filter(function (c) { return !c.hidden; });
  }

  /* 平铺文章自动转成报纸式折叠卡，保证别人注入的内容也一律可折叠 */
  function normalize(container) {
    if (!container) return;
    var flat = Array.prototype.slice.call(container.querySelectorAll('.reading-card:not(details)'));
    var existing = container.querySelectorAll('details.reading-card').length;

    flat.forEach(function (card, i) {
      if (card.closest('details')) return;
      var small = card.querySelector('small');
      var heading = card.querySelector('h1,h2,h3,.rc-title');
      var timeEl = small ? small.querySelector('time') : null;
      var date = timeEl ? (timeEl.textContent || '').trim() : '';
      var cat = (small ? (small.textContent || '').replace(/\s+/g, ' ').trim() : '本期简报')
        .replace(date, '').replace(/[·\s]+$/, '').trim() || '本期简报';
      var title = heading ? (heading.textContent || '').trim() : '本期简报';

      var detail = document.createElement('details');
      detail.className = card.className;
      Array.prototype.forEach.call(card.attributes, function (a) {
        if (a.name !== 'class') detail.setAttribute(a.name, a.value);
      });

      var summary = document.createElement('summary');
      var no = document.createElement('span');
      no.className = 'rc-no';
      no.textContent = String(existing + i + 1).padStart(2, '0');
      var meta = document.createElement('span');
      meta.className = 'rc-meta';
      var catSpan = document.createElement('span');
      catSpan.className = 'rc-cat';
      catSpan.textContent = cat;
      meta.appendChild(catSpan);
      if (date) {
        var t = document.createElement('time');
        t.className = 'rc-date';
        t.setAttribute('datetime', (timeEl && timeEl.getAttribute('datetime')) || date);
        t.textContent = date;
        meta.appendChild(t);
      }
      var titleSpan = document.createElement('span');
      titleSpan.className = 'rc-title';
      titleSpan.textContent = title;
      var hint = document.createElement('span');
      hint.className = 'rc-hint';
      hint.textContent = '展开';
      summary.appendChild(no);
      summary.appendChild(meta);
      summary.appendChild(titleSpan);
      summary.appendChild(hint);

      var body = document.createElement('div');
      body.className = 'rc-body';
      Array.prototype.slice.call(card.childNodes).forEach(function (node) {
        if (node === small || node === heading) return;
        body.appendChild(node.cloneNode(true));
      });

      detail.appendChild(summary);
      detail.appendChild(body);
      if (card.parentNode) card.parentNode.replaceChild(detail, card);
    });
  }

  function syncHints() {
    cardList().forEach(function (card) {
      var hint = card.querySelector('summary .rc-hint');
      if (hint) hint.textContent = card.open ? '收起' : '展开';
    });
  }

  function syncFoldLabel() {
    if (!foldBtn) return;
    var list = visibleCards();
    var allOpen = list.length > 0 && list.every(function (c) { return c.open; });
    foldBtn.textContent = allOpen ? '收起全部' : '展开全部';
    foldBtn.setAttribute('aria-expanded', allOpen ? 'true' : 'false');
  }

  function cardText(card) {
    var parts = [];
    var title = card.querySelector('.rc-title, h3');
    var meta = card.querySelector('.rc-meta, small');
    var body = card.querySelector('.rc-body');
    if (title) parts.push(title.textContent || '');
    if (meta) parts.push(meta.textContent || '');
    if (body) parts.push(body.textContent || '');
    return parts.join(' ').replace(/\s+/g, ' ').toLowerCase();
  }

  /* 期号日期由本期收录内容决定，避免把标题日期伪装成「今天」。
     多期存档页（卡片带 data-edition）优先用期号，单期页退回用文章发表日。 */
  function syncEditionDate() {
    var el = document.getElementById('briefDate');
    var host = document.getElementById('dailyBriefContent');
    if (!el || !host) return;
    var editionCards = host.querySelectorAll('.reading-card[data-edition]');
    var archive = editionCards.length > 0;
    var source = archive ? editionCards : host.querySelectorAll('.rc-date[datetime]');
    var dates = Array.prototype.map.call(source, function (node) {
      var raw = archive ? node.getAttribute('data-edition') : node.getAttribute('datetime');
      return (raw || '').slice(0, 10);
    }).filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); }).sort();
    if (!dates.length) return;
    var latest = dates[dates.length - 1];
    var d = new Date(latest + 'T12:00:00+08:00');
    var parts = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: 'numeric', day: 'numeric'
    }).formatToParts(d);
    var y = '', m = '', day = '';
    parts.forEach(function (p) {
      if (p.type === 'year') y = p.value;
      if (p.type === 'month') m = p.value;
      if (p.type === 'day') day = p.value;
    });
    el.setAttribute('datetime', latest);
    el.textContent = (archive ? '收录至 ' : '本期收录 · 截至 ') + y + ' 年 ' + m + ' 月 ' + day + ' 日';
  }

  var categorySelect = document.getElementById('briefCategory');

  function categoryOf(card) {
    var label = card.querySelector('.rc-cat');
    return label ? label.textContent.split('·')[0].trim() : '';
  }

  function dateOf(card) {
    var time = card.querySelector('.rc-date');
    return card.dataset.edition || (time && time.dateTime) || '';
  }

  function applySearch() {
    var q = ((searchInput && searchInput.value) || '').trim().toLowerCase();
    var shown = 0;
    var cards = cardList();
    var selected = categorySelect ? categorySelect.value : '';
    if (categorySelect) {
      var categories = Array.from(new Set(cards.map(categoryOf).filter(Boolean))).sort();
      categorySelect.options.length = 1;
      categories.forEach(function (category) {
        categorySelect.add(new Option(category, category));
      });
      selected = categories.includes(selected) ? selected : '';
      categorySelect.value = selected;
    }
    cards.sort(function (a, b) { return dateOf(b).localeCompare(dateOf(a)); });
    cards.forEach(function (card, index) {
      root.insertBefore(card, emptyTip);
      var published = card.querySelector('.rc-date');
      if (published && published.dateTime) {
        published.textContent = '原文 ' + published.dateTime;
        if (card.dataset.edition && !card.querySelector('.rc-edition')) {
          var edition = document.createElement('time');
          edition.className = 'rc-edition';
          edition.dateTime = card.dataset.edition;
          edition.textContent = '简报 ' + edition.dateTime;
          published.before(edition, ' · ');
        }
      }
      var number = card.querySelector('.rc-no');
      if (number) number.textContent = String(index + 1).padStart(2, '0');
      var hit = (!selected || categoryOf(card) === selected) &&
        (!q || cardText(card).indexOf(q) !== -1);
      card.hidden = !hit;
      if (hit) shown++;
    });
    if (emptyTip) emptyTip.hidden = shown !== 0;
    if (countTip) {
      countTip.textContent = q || selected
        ? '匹配 ' + shown + ' 篇 · 点击标题展开'
        : '共 ' + shown + ' 篇 · 点击标题展开';
    }
    syncEditionDate();
    syncFoldLabel();
  }

  function bindCards() {
    cardList().forEach(function (card) {
      if (card.dataset.briefBound === '1') return;
      card.dataset.briefBound = '1';
      card.addEventListener('toggle', function () {
        syncHints();
        syncFoldLabel();
      });
    });
    syncHints();
    syncFoldLabel();
  }

  /* 顶部导航：与主站同款汉堡菜单 */
  function bindNav() {
    var header = document.querySelector('.site-header');
    var toggle = document.getElementById('navToggle');
    if (header && toggle) {
      toggle.addEventListener('click', function () {
        var open = header.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
      });
      Array.prototype.forEach.call(document.querySelectorAll('.main-nav a'), function (a) {
        a.addEventListener('click', function () {
          header.classList.remove('nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  function render(name, content) {
    var el = box(name);
    if (!el) return null;
    if (content instanceof Node) {
      el.innerHTML = '';
      el.appendChild(content);
    } else {
      el.innerHTML = (content == null) ? '' : String(content);
    }
    if (name === 'main') {
      root = el;
      normalize(el);
      bindCards();
      applySearch();
    }
    return el;
  }

  function clear(name) { return render(name, ''); }

  var api = { slots: slots, render: render, clear: clear };
  window.DailyBrief = api;

  if (foldBtn) {
    foldBtn.addEventListener('click', function () {
      var list = visibleCards();
      var allOpen = list.length > 0 && list.every(function (c) { return c.open; });
      list.forEach(function (c) { c.open = !allOpen; });
      syncHints();
      syncFoldLabel();
    });
  }
  if (searchInput) searchInput.addEventListener('input', applySearch);
  if (categorySelect) categorySelect.addEventListener('change', applySearch);

  normalize(root);
  bindCards();
  applySearch();
  bindNav();

  document.dispatchEvent(new CustomEvent('daily-brief:ready', { detail: api }));
})();
