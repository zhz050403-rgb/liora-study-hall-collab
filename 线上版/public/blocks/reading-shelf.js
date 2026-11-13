/* ============================================================
 * 读书书架增强板块（独立文件，不侵入 index.html 业务逻辑）
 *   1) 真实封面：优先显示网上抓取并保存到本地的
 *      cabin-art/books/<id>.jpg；文件不存在时自动回退到原来的
 *      彩色书封 / 原有封面，不出现破图。
 *   2) 左侧分类导航：把 61 本书按「投资理财 / 管理商业 / 心理学 /
 *      心态成长 / 小说文学 / 散文随笔」分组，点击只看一类。
 *   3) 未读 / 已读分组：已读完的书自动排到最后，并加「已读完」
 *      分隔标签；上方提供「全部 / 未读 / 已读」筛选，点一下只看一类。
 *   4) 分类与阅读状态可叠加：先选分类，再叠加未读/已读筛选。
 *
 * 调用时机：renderReading() 里 app.innerHTML 之后，
 *           window.ReadingShelf.enhance(app)
 * 说明：勾选「整本读完」会重渲染整个读书页，本函数会重新执行，
 *       分组与筛选状态自动跟随最新进度。
 * ============================================================ */
(function () {
  'use strict';

  var STYLE_ID = 'reading-shelf-enhance-style';

  /* ---------- 图书分类（id 取自 data.js 的 reading 课程 id） ---------- */
  var CATS = [
    {
      key: 'invest', name: '投资理财',
      ids: ['xiaodao', 'guofulun', 'gupiao', 'dadian', 'richdad', 'lombard',
            'to-read-bc900c3f45a1', 'to-read-1a92a45d4555']
    },
    {
      key: 'biz', name: '管理商业',
      ids: ['to-read-96d04d36f2bd', 'to-read-b93b3da92a23', 'to-read-ebefafaab3c7']
    },
    {
      key: 'psych', name: '心理学',
      ids: ['jamespsych', 'to-read-5b383059292a', 'to-read-9a1511404f76', 'to-read-f5770426ae1b']
    },
    {
      key: 'mind', name: '心态成长',
      ids: ['htlb', 'to-read-83b2d7571892', 'to-read-c0dce2ad2d3e', 'to-read-0af8b28dcc02',
            'to-read-9a0e58518b2c', 'to-read-f5a41f6f9a2e']
    },
    {
      key: 'novel', name: '小说文学',
      ids: ['to-read-bdcd20771f67', 'to-read-45faeb38fcbe', 'to-read-6a60e68824d3', 'to-read-d87b22d29c0e',
            'to-read-a4d6acfab4b9', 'to-read-aac4b06da860', 'to-read-794e3dafae9e', 'to-read-88b682100d4b',
            'to-read-3e0b668a7e7d', 'to-read-a1aa16277bc1', 'to-read-10e5adbefab1', 'to-read-e8433a30d2c9',
            'to-read-0176d0f00b82', 'to-read-03c280c2f7ab', 'to-read-953bee256c32', 'to-read-bb4867893cc4',
            'to-read-55a1b4aad82b', 'to-read-6803a2d51635', 'to-read-eaf2b9745c60', 'to-read-773ae7600136',
            'to-read-00eba6170b74', 'to-read-977df891b895', 'to-read-48d0d302b399', 'to-read-133b42f2747f',
            'to-read-6287994eb933', 'to-read-8aeee8a8c87b', 'to-read-bfc82410dbbf', 'to-read-a6b76e15424f',
            'to-read-22cc04fc8add', 'to-read-7e218837b59e', 'to-read-5e0c049543d3', 'to-read-24c9223f91bd']
    },
    {
      key: 'essay', name: '散文随笔',
      ids: ['to-read-e8aa2709a286', 'to-read-ab5b5b6aeff4', 'to-read-9d7ba4ed5c02', 'to-read-2fdd5de8a0c0',
            'to-read-233251f1db5e', 'to-read-38575aaab06b', 'to-read-e604c1c93c85', 'to-read-08c4c6d0de51']
    }
  ];
  // id -> 分类 key 反查表（不在任何分类里的书归入「未分类」）
  var ID2CAT = {};
  CATS.forEach(function (c) { c.ids.forEach(function (id) { ID2CAT[id] = c.key; }); });

  var CSS = [
    /* --- 真实封面（直接替换原封面元素，避免两块叠加） --- */
    '.reading-shelf-band .book-item{position:relative}',
    '.book-real-cover{',
    '  display:block;width:var(--shelf-width);height:var(--shelf-cover);',
    '  margin-inline:auto;object-fit:cover;object-position:center center;',
    '  background:#f4f1ea;',
    '  border-radius:2px 4px 4px 2px;',
    '  box-shadow:-2px 0 0 #1c263b,3px 5px 9px rgba(12,34,66,.28);',
    '}',

    /* --- 书卡排版：固定高度、文字不挤、整齐对齐 --- */
    '.reading-shelf-band .book-check-wrap{display:flex;flex-direction:column}',
    '.reading-shelf-band .book-item{display:flex;flex-direction:column;align-items:center;text-decoration:none}',
    '.reading-shelf-band .book-item .b-t{',
    '  margin-top:9px;width:100%;min-height:2.7em;',
    '  font-size:12.5px;line-height:1.35;',
    '  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;',
    '  word-break:break-all;',
    '}',
    '.reading-shelf-band .book-item .b-s{',
    '  width:100%;margin-top:2px;font-size:12px;color:#6b7f99;',
    '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;',
    '}',
    '.reading-shelf-band .book-progress{margin-top:5px;height:5px}',
    '.reading-shelf-band .book-done-label{',
    '  margin:6px 0 0;font-size:12px;white-space:nowrap;gap:4px;line-height:1.3;',
    '}',
    '.reading-shelf-band .book-done-label input{width:13px;height:13px;flex:none}',

    /* --- 已读角标与淡化 --- */
    '.book-check-wrap.is-read .book-item{opacity:.68}',
    '.book-check-wrap.is-read .book-item:hover{opacity:1}',
    '.book-check-wrap.is-read .book-item::after{',
    '  content:"✓ 已读";position:absolute;top:6px;right:calc(50% - var(--shelf-width)/2 - 6px);',
    '  padding:2px 6px;border-radius:6px;background:#2e9e5b;color:#fff;',
    '  font:700 11px/1.3 var(--sans,system-ui);letter-spacing:.3px;',
    '  box-shadow:0 2px 6px rgba(0,0,0,.25);pointer-events:none;z-index:3;',
    '}',

    /* --- 左侧分类导航 --- */
    '.reading-shelf-band{display:flex;gap:18px;align-items:flex-start}',
    '.reading-shelf-band .shelf-cats{',
    '  flex:0 0 172px;align-self:flex-start;position:sticky;top:92px;',
    '  background:#fff;border:1px solid #d8e4f2;border-radius:16px;',
    '  padding:14px 12px;box-shadow:var(--shadow);',
    '  max-height:calc(100vh - 120px);overflow:auto;',
    '}',
    '.shelf-cats h3{font:700 15px var(--serif);color:#173860;margin:0;padding:2px 4px 11px;border-bottom:1px solid #e4edf7}',
    '.shelf-cats button{',
    '  display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;',
    '  padding:9px 11px;margin:3px 0;border:0;border-radius:9px;',
    '  background:transparent;color:#3c5472;font:600 13.5px var(--sans,system-ui);',
    '  cursor:pointer;text-align:left;transition:background .15s,color .15s;',
    '}',
    '.shelf-cats button:hover{background:#eef6ff;color:#1c4375}',
    '.shelf-cats button.on{background:#173860;color:#fff}',
    '.shelf-cats button .cnt{font:700 11px var(--sans,system-ui);background:rgba(23,56,96,.10);color:#26527e;border-radius:999px;padding:1px 8px}',
    '.shelf-cats button.on .cnt{background:rgba(255,255,255,.22);color:#fff}',
    '.shelf-cats .cat-reset{margin-top:7px;border-top:1px dashed #dfe8f2;padding-top:8px}',

    /* --- 右侧主区（标题 + 筛选 + 书架） --- */
    '.reading-shelf-band .shelf-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}',

    /* --- 筛选按钮 --- */
    '.shelf-filter{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0 2px;padding:0 2px}',
    '.shelf-filter .sf-label{font-size:12px;color:#4b637e;margin-right:2px}',
    '.shelf-filter button{',
    '  padding:5px 14px;border:1px solid #cbdcee;border-radius:999px;',
    '  background:#f4f9ff;color:#2b4f78;font:600 12.5px var(--sans,system-ui);cursor:pointer;',
    '  transition:background .15s,color .15s;',
    '}',
    '.shelf-filter button:hover{background:#e2eefb}',
    '.shelf-filter button.on{background:#173860;border-color:#173860;color:#fff}',
    '.shelf-filter .sf-tip{margin-left:auto;font-size:11.5px;color:#7a8ba3}',

    /* --- 「已读完」分隔标签（横滑书架内） --- */
    '.shelf-divider{',
    '  flex:0 0 auto;align-self:stretch;display:flex;align-items:center;justify-content:center;',
    '  width:26px;margin:0 2px;color:#8a7355;',
    '  font:600 11px/1.25 var(--sans,system-ui);writing-mode:vertical-rl;letter-spacing:2px;',
    '  border-left:2px dashed #d8c6a8;',
    '}',
    '.shelf-divider span{background:#f3ead9;padding:6px 2px;border-radius:6px}',

    /* --- 空态 --- */
    '.shelf-empty{padding:26px 8px;color:#7a8ba3;font-size:13px;text-align:center;width:100%}',

    '@media (max-width:760px){',
    '  .reading-shelf-band{flex-direction:column}',
    '  .reading-shelf-band .shelf-cats{flex:none;position:static;max-height:none;width:auto;',
    '    display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 12px}',
    '  .shelf-cats h3{display:none}',
    '  .shelf-cats button{width:auto;flex:0 0 auto;margin:0}',
    '  .shelf-cats .cat-reset{display:none}',
    '  .book-check-wrap.is-read .book-item::after{right:0}',
    '  .shelf-filter .sf-tip{display:none}',
    '}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function mkEmpty(txt) {
    var e = document.createElement('div');
    e.className = 'shelf-empty';
    e.textContent = txt;
    return e;
  }

  function enhance(root) {
    if (!root) return;
    var band = root.querySelector('.reading-shelf-band');
    if (!band) return;
    var head = band.querySelector('.section-head');
    var shelf = band.querySelector('.book-shelf');
    if (!shelf) return;
    injectStyle();

    var wraps = Array.prototype.slice.call(shelf.querySelectorAll('.book-check-wrap'));
    if (!wraps.length) return;

    /* ---------- 1. 真实封面 ----------
       直接「替换」书卡里原来的封面元素（彩色书封 / 旧图），不再两块叠加。 */
    wraps.forEach(function (w) {
      var cb = w.querySelector('[data-book-done]');
      var item = w.querySelector('.book-item');
      if (!cb || !item || item.querySelector('.book-real-cover')) return;
      var id = cb.getAttribute('data-book-done');
      if (!id) return;
      var oldCover = item.querySelector('.book-fallback, .book-illustrated, img');
      var img = document.createElement('img');
      img.className = 'book-real-cover';
      img.alt = '';
      img.loading = 'eager';
      img.decoding = 'async';
      img.addEventListener('error', function () {
        if (oldCover) item.insertBefore(oldCover, img);
        img.remove();
      });
      img.src = 'cabin-art/books/' + encodeURIComponent(id) + '.jpg';
      if (oldCover) item.replaceChild(img, oldCover);
      else item.insertBefore(img, item.firstChild);
    });

    /* ---------- 2. 给每本打上分类标签 ---------- */
    wraps.forEach(function (w) {
      var cb = w.querySelector('[data-book-done]');
      var id = cb ? cb.getAttribute('data-book-done') : '';
      w.setAttribute('data-cat', ID2CAT[id] || '');
    });

    /* ---------- 3. 已读判定 ---------- */
    function isRead(w) {
      var cb = w.querySelector('[data-book-done]');
      return !!(cb && cb.checked);
    }
    wraps.forEach(function (w) {
      if (isRead(w)) w.classList.add('is-read');
      else w.classList.remove('is-read');
    });

    /* 左侧分类导航（垂直列表 + 每类数量），定义在 enhance 作用域内，
       以便点击时共享 catState / applyFilter，切换分类并重排书架。 */
    function buildCats(wraps) {
      var el = document.createElement('aside');
      el.className = 'shelf-cats';
      var h = document.createElement('h3');
      h.textContent = '图书分类';
      el.appendChild(h);

      var all = document.createElement('button');
      all.type = 'button';
      all.setAttribute('data-cat', 'all');
      all.innerHTML = '<span>全部书架</span><span class="cnt">' + wraps.length + '</span>';
      el.appendChild(all);

      CATS.forEach(function (c) {
        var n = wraps.filter(function (w) { return w.getAttribute('data-cat') === c.key; }).length;
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-cat', c.key);
        b.innerHTML = '<span>' + c.name + '</span><span class="cnt">' + n + '</span>';
        el.appendChild(b);
      });

      el.onclick = function (e) {
        var b = e.target.closest('button[data-cat]');
        if (!b) return;
        catState = b.getAttribute('data-cat');
        applyFilter();
      };
      return el;
    }

    /* ---------- 4. 布局：左侧分类导航 + 右侧书架主区 ---------- */
    if (!band.querySelector('.shelf-main')) {
      var main = document.createElement('div');
      main.className = 'shelf-main';
      band.appendChild(main);
      if (head) main.appendChild(head);
      main.appendChild(shelf);
    }
    if (!band.querySelector('.shelf-cats')) {
      band.insertBefore(buildCats(wraps), band.firstChild);
    }

    /* ---------- 5. 顶部「全部 / 未读 / 已读」筛选栏 ---------- */
    var catState = 'all';       // 选中的分类 key（'all' = 全部）
    var readState = 'all';      // 阅读状态筛选

    var filterBar = band.querySelector('.shelf-filter');
    if (!filterBar) {
      filterBar = document.createElement('div');
      filterBar.className = 'shelf-filter';
      var headEl = band.querySelector('.section-head');
      if (headEl && headEl.parentNode) headEl.parentNode.insertBefore(filterBar, headEl.nextSibling);
      else band.insertBefore(filterBar, band.firstChild);
    }
    readState = filterBar.getAttribute('data-current') || 'all';

    function buildBar() {
      filterBar.innerHTML = '';
      var label = document.createElement('span');
      label.className = 'sf-label';
      label.textContent = '看书架：';
      filterBar.appendChild(label);
      var defs = [
        ['all', '全部 ' + wraps.length],
        ['unread', '未读 ' + wraps.filter(function (w) { return !isRead(w); }).length],
        ['read', '已读 ' + wraps.filter(function (w) { return isRead(w); }).length]
      ];
      defs.forEach(function (d) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-sf', d[0]);
        b.textContent = d[1];
        if (readState === d[0]) b.className = 'on';
        filterBar.appendChild(b);
      });
      var tip = document.createElement('span');
      tip.className = 'sf-tip';
      tip.textContent = '读完的书已排到最后 · 书架可左右滑动';
      filterBar.appendChild(tip);
    }

    /* ---------- 6. 组合筛选：分类 × 阅读状态 ---------- */
    function applyFilter() {
      // 同步分类导航高亮
      var catsEl = band.querySelector('.shelf-cats');
      if (catsEl) catsEl.querySelectorAll('button[data-cat]').forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-cat') === catState);
      });
      filterBar.setAttribute('data-current', readState);

      // 按分类收窄
      var byCat = wraps.filter(function (w) {
        return catState === 'all' || w.getAttribute('data-cat') === catState;
      });

      // 清掉上一次的分隔 / 空态节点
      shelf.querySelectorAll('.shelf-divider,.shelf-empty').forEach(function (n) { n.remove(); });

      if (!byCat.length) {
        wraps.forEach(function (w) { w.style.display = 'none'; });
        shelf.appendChild(mkEmpty('这个分类下暂时没有书'));
        buildBar();
        return;
      }

      var visUnread = byCat.filter(function (w) { return !isRead(w); });
      var visRead = byCat.filter(function (w) { return isRead(w); });

      // 先全部隐藏，再只显示当前分类内的书（修复：避免其它分类残留可见）
      wraps.forEach(function (w) { w.style.display = 'none'; });

      // 重排：未读在前、已读沉底（仅限当前分类内）
      visUnread.forEach(function (w) { w.style.display = 'flex'; shelf.appendChild(w); });
      var divider = null;
      if (readState === 'all' && visUnread.length && visRead.length) {
        divider = document.createElement('div');
        divider.className = 'shelf-divider';
        divider.innerHTML = '<span>已读完</span>';
        shelf.appendChild(divider);
      }
      visRead.forEach(function (w) { w.style.display = 'flex'; shelf.appendChild(w); });

      // 阅读状态二次筛选（仅作用于当前分类内）
      if (readState !== 'all') {
        byCat.forEach(function (w) {
          var show = (readState === 'unread' && !isRead(w)) || (readState === 'read' && isRead(w));
          w.style.display = show ? 'flex' : 'none';
        });
        if (divider) divider.style.display = 'none';
        var anyShown = byCat.some(function (w) { return w.style.display !== 'none'; });
        if (!anyShown) {
          shelf.appendChild(mkEmpty(readState === 'read'
            ? '这个分类下还没有读完的书，加油～'
            : '这个分类下还没有未读的书'));
        }
      }
      buildBar();
    }

    filterBar.onclick = function (e) {
      var b = e.target.closest('button[data-sf]');
      if (!b) return;
      readState = b.getAttribute('data-sf');
      applyFilter();
    };

    applyFilter();
  }

  window.ReadingShelf = { enhance: enhance, CATS: CATS };
})();
