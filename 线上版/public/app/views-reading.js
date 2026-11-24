/* 真实 3D 书封书房书架 + 沉浸式双栏书页阅读器（零破图、真实 cabin-art/books/*.jpg 封面） */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function renderReadingShelf(app) {
    var idx = await window.LioraStore.loadIndex();
    var wishlist = await window.LioraStudyApi.loadWishlist().catch(function () { return []; });
    var books = idx.books || [];

    var shelfCards = books.map(function (b) {
      var coverHtml = b.coverUrl
        ? '<img src="' + esc(b.coverUrl) + '" alt="' + esc(b.nameCn) + '" loading="lazy">'
        : '<div style="padding:16px;color:#f5e6c3;font-family:var(--serif);font-weight:700">' + esc(b.nameCn) + '</div>';
      return '<a class="ed-book-card" href="#/book/' + esc(b.id) + '/1">' +
        '<div class="ed-book-cover">' + coverHtml + '</div>' +
        '<div class="ed-book-title">' + esc(b.nameCn) + '</div>' +
        '<div class="ed-book-meta">' + esc(b.chapters) + ' 章 · ' + (b.hasReader ? '全文+导读' : '精读笔记') + '</div>' +
      '</a>';
    }).join('');

    var wishHtml = wishlist.map(function (w) {
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;background:var(--surface-2);border:1px solid var(--line-2)">' +
        (w.coverUrl ? '<img src="' + esc(w.coverUrl) + '" alt="" style="width:34px;height:50px;object-fit:cover;border-radius:3px;flex-shrink:0" loading="lazy">' : '') +
        '<div style="min-width:0"><div style="font-size:13.5px;font-weight:600;color:var(--navy-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(w.nameCn) + '</div>' +
        '<div style="font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(w.name || w.note || '想读书单') + '</div></div>' +
      '</div>';
    }).join('');

    app.innerHTML = '<div class="ed-container">' +
      '<div class="ed-hero ed-hero-art ed-hero-art-reading" style="grid-template-columns:1fr;padding:24px 28px">' +
        '<div><div class="ed-hero-kicker">PRIVATE LIBRARY · 个人书房</div>' +
        '<h1>学院书库 · 精读书架</h1>' +
        '<p style="margin-bottom:0">已完整收录 <b>' + books.length + ' 本经典好书</b>（支持沉浸书页阅读、4 色荧光笔高光与阅读进度同步）；另收纳 ' + wishlist.length + ' 本想读书单。</p></div>' +
      '</div>' +
      '<div class="ed-section-head"><h2>已收录可精读书架（' + books.length + ' 本）</h2><span class="sub">点击任意书封直接打开沉浸书页阅读器</span></div>' +
      '<div class="ed-bookshelf">' + shelfCards + '</div>' +
      '<details id="edWishDetails" class="ed-card" style="margin-top:28px"><summary style="cursor:pointer;font-family:var(--serif);font-size:16px;font-weight:700;color:var(--navy-900)">📋 我的想读书单（' + wishlist.length + ' 本 · 点开浏览，不打扰主书架）</summary>' +
        '<div id="edWishGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-top:14px"></div>' +
      '</details>' +
    '</div>';

    var wd = document.getElementById('edWishDetails');
    var wg = document.getElementById('edWishGrid');
    if (wd && wg) {
      wd.addEventListener('toggle', function () {
        if (wd.open && !wg.dataset.loaded) {
          wg.dataset.loaded = '1';
          wg.innerHTML = wishHtml;
        }
      });
    }
  }

  /* 从 book.reader（readingVersions / originalTexts）提取可用原文版本并精准切出本章原文 */
  var CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  function numToCn(n) {
    n = Number(n) || 0;
    if (n <= 10) return CN_DIGITS[n] || String(n);
    if (n < 20) return '十' + (n % 10 ? CN_DIGITS[n % 10] : '');
    var t = Math.floor(n / 10), u = n % 10;
    return (CN_DIGITS[t] || t) + '十' + (u ? CN_DIGITS[u] : '');
  }
  function getBookSources(book) {
    var r = book && book.reader;
    if (!r) return [];
    var sources = [];
    if (r.readingVersions && typeof r.readingVersions === 'object') {
      Object.keys(r.readingVersions).forEach(function (k) {
        var v = r.readingVersions[k];
        var txt = v && typeof v === 'object' ? (v.text || '') : String(v || '');
        if (txt.trim().length > 80) {
          sources.push({ key: 'rv:' + k, label: k === 'zh' ? '中文原文' : ('原文 (' + k + ')'), text: txt });
        }
      });
    }
    if (r.originalTexts && typeof r.originalTexts === 'object') {
      Object.keys(r.originalTexts).forEach(function (k) {
        var txt = String(r.originalTexts[k] || '');
        if (txt.trim().length > 80) {
          var isEn = /^[\x00-\x7F\s\S]{0,400}$/.test(txt.slice(0, 300)) && (txt.slice(0, 800).match(/[\u4e00-\u9fa5]/g) || []).length < 20;
          sources.push({ key: 'ot:' + k, label: isEn ? '英文原版' : '原书全文', text: txt, fileName: k });
        }
      });
    }
    return sources;
  }

  function findChapterOffset(fullText, chNum, chTitle, minPos) {
    var n = Number(chNum);
    if (!n || n < 1) return -1;
    var cn = numToCn(n);
    var pad = n < 10 ? ('0' + n) : String(n);
    var romanMap = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV'];
    var rom = romanMap[n] || '';
    var titleCore = String(chTitle || '').replace(/^第[\d一二三四五六七八九十百]+[章节回讲]\s*[·：:、\-\s]*/, '').replace(/^\d+\s*/, '').split(/[\n\r]/)[0].trim().slice(0, 12);

    var patterns = [
      new RegExp('(?:^|\\n)\\s*第\\s*(?:' + n + '|' + cn + ')\\s*[章节回](?:\\s|\\n|[：:·]|$)', 'g'),
      new RegExp('(?:^|\\n)\\s*CHAPTER\\s+(?:' + n + (rom ? '|' + rom : '') + ')(?:\\b|\\.|\\s|\\n)', 'gi'),
      new RegExp('(?:^|\\n)\\s*' + pad + '\\s*\\n', 'g')
    ];
    if (titleCore.length >= 4) {
      var escT = titleCore.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      patterns.push(new RegExp('(?:^|\\n)[^\\n]{0,16}' + escT, 'g'));
    }

    var skipToc = Math.min(Math.floor(fullText.length * 0.06), 4500);
    for (var pi = 0; pi < patterns.length; pi++) {
      var re = patterns[pi];
      var matches = [];
      var m;
      while ((m = re.exec(fullText)) !== null) {
        if (m.index >= (minPos || 0)) matches.push(m.index);
        if (matches.length > 6) break;
      }
      if (matches.length) {
        /* 若命中了目录页和正文两处，优先取跳过目录后的正文处 */
        var bodyHit = matches.find(function (pos) { return pos > skipToc; });
        return bodyHit !== undefined ? bodyHit : matches[0];
      }
    }
    return -1;
  }

  function extractChapterSlice(fullText, ch, chapters) {
    var realChs = chapters.filter(function (w) { return Number(w.num) >= 1; });
    var idx = realChs.findIndex(function (w) { return Number(w.num) === Number(ch.num); });
    if (idx < 0) return { text: fullText.slice(0, 18000), matched: false };

    var start = findChapterOffset(fullText, ch.num, ch.title, 0);
    if (start >= 0) {
      var nextCh = realChs[idx + 1];
      var end = nextCh ? findChapterOffset(fullText, nextCh.num, nextCh.title, start + 120) : fullText.length;
      if (end < 0 || end <= start) end = Math.min(fullText.length, start + 24000);
      return { text: fullText.slice(start, end).trim(), matched: true };
    }

    /* 兜底按章节比例定位，避免整本书几百万字一次渲染卡顿 */
    var chunkSize = Math.max(3500, Math.floor(fullText.length / Math.max(1, realChs.length)));
    var sPos = Math.min(fullText.length - 1, idx * chunkSize);
    var ePos = Math.min(fullText.length, sPos + chunkSize);
    return { text: fullText.slice(sPos, ePos).trim(), matched: false };
  }

  function formatPlainTextHtml(raw) {
    var lines = String(raw || '').replace(/\r\n/g, '\n').split(/\n+/);
    return lines.map(function (ln) {
      var t = ln.trim();
      if (!t) return '';
      if (/^〔原书第\s*\d+\s*页〕$/.test(t)) {
        return '<div style="margin:18px 0 8px;font-size:12px;color:var(--muted);border-bottom:1px dashed var(--line);padding-bottom:3px">' + esc(t) + '</div>';
      }
      if (/^(?:第[\d一二三四五六七八九十百]+[章节回]|CHAPTER\s+[IVX\d]+)/i.test(t) && t.length <= 42) {
        return '<h3 style="margin:20px 0 10px;color:var(--navy-900);font-family:var(--serif)">' + esc(t) + '</h3>';
      }
      return '<p style="margin:0 0 11px;text-indent:0;line-height:1.85">' + esc(t) + '</p>';
    }).join('');
  }

  async function renderBookReader(app, bookId, chapterNum) {
    app.innerHTML = '<div class="ed-container"><div class="ed-card">正在打开书页…</div></div>';
    var book;
    try {
      book = await window.LioraStore.loadBook(bookId);
    } catch (e) {
      app.innerHTML = '<div class="ed-container"><div class="ed-card">找不到这本书 · <a href="#/reading">返回书架</a></div></div>';
      return;
    }

    var term = (book.terms && book.terms[0]) || { id: 'chapters', weeks: [] };
    var chapters = term.weeks || [];
    var ch = chapters.find(function (w) { return Number(w.num) === Number(chapterNum); }) || chapters[0];
    if (!ch) return;

    var chIdx = chapters.indexOf(ch);
    var prevCh = chIdx > 0 ? chapters[chIdx - 1] : null;
    var nextCh = chIdx < chapters.length - 1 ? chapters[chIdx + 1] : null;
    var isIntroChapter = Number(ch.num) === 0 || /^导读/.test(String(ch.title || '').trim());

    var route = '#/book/' + book.id + '/' + ch.num;
    window.LioraStore.setLastVisit(route, '📖 ' + (book.nameCn || book.id) + ' · ' + (ch.title || '第 ' + ch.num + ' 章'));

    var sources = getBookSources(book);
    var hasOriginal = sources.length > 0 && !isIntroChapter;
    var srcIdx = 0;
    var langMode = 'notes'; // notes | fulltext
    var fullPage = 0; // 长章节分页（每页 6000 字）

    function draw() {
      var isDone = window.LioraStore.isWeekDone(book.id, term.id, ch.num);
      var chListHtml = chapters.map(function (w) {
        var cur = Number(w.num) === Number(ch.num);
        var d = window.LioraStore.isWeekDone(book.id, term.id, w.num);
        return '<button class="ed-week-btn' + (cur ? ' active' : '') + (d ? ' done' : '') + '" data-goto="#/book/' + esc(book.id) + '/' + w.num + '">' +
          '<span class="ed-week-num">' + (d ? '✓' : w.num) + '</span>' +
          '<span>' + esc((w.title || ('第 ' + w.num + ' 章')).slice(0, 38)) + '</span>' +
        '</button>';
      }).join('');

      var contentHtml = '';
      if (langMode === 'fulltext' && hasOriginal) {
        var src = sources[srcIdx] || sources[0];
        var sliced = extractChapterSlice(src.text, ch, chapters);
        var PAGE_LEN = 6500;
        var totalPages = Math.max(1, Math.ceil(sliced.text.length / PAGE_LEN));
        if (fullPage >= totalPages) fullPage = 0;
        var pageText = sliced.text.slice(fullPage * PAGE_LEN, (fullPage + 1) * PAGE_LEN);

        var srcSwitch = sources.length > 1
          ? '<div style="display:flex;gap:6px;flex-wrap:wrap">' + sources.map(function (s, si) {
              return '<button type="button" class="ed-btn ed-btn-sm' + (si === srcIdx ? ' ed-btn-primary' : '') + '" data-src-idx="' + si + '">' + esc(s.label) + '</button>';
            }).join('') + '</div>'
          : '';
        var pager = totalPages > 1
          ? '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:16px 0;padding:10px 14px;background:var(--surface-2);border-radius:10px;border:1px solid var(--line-2)">' +
              '<button type="button" class="ed-btn ed-btn-sm" data-fp="' + Math.max(0, fullPage - 1) + '"' + (fullPage === 0 ? ' disabled' : '') + '>← 上一页</button>' +
              '<span style="font-size:13px;color:var(--muted)">本章原文 第 <b>' + (fullPage + 1) + '</b> / ' + totalPages + ' 页</span>' +
              '<button type="button" class="ed-btn ed-btn-sm" data-fp="' + Math.min(totalPages - 1, fullPage + 1) + '"' + (fullPage >= totalPages - 1 ? ' disabled' : '') + '>下一页 →</button>' +
            '</div>'
          : '';

        contentHtml =
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;padding:10px 14px;background:#fdf8ec;border:1px solid var(--gold-border);border-radius:10px;font-size:13px">' +
            '<span>📖 <b>' + esc(src.label) + '</b>' + (sliced.matched ? ' · 已精准定位到本章原文' : ' · 按章节进度为您展开对应原文区间') + '（支持划词 4 色高光标注）</span>' +
            srcSwitch +
          '</div>' +
          pager +
          '<div class="ed-book-fulltext">' + formatPlainTextHtml(pageText) + '</div>' +
          pager;
      } else {
        contentHtml = ch.graphicHtml || ch.notesHtml || '<p style="color:var(--muted)">本章暂无精读笔记。</p>';
        if (isIntroChapter && sources.length > 0) {
          contentHtml += '<div style="margin-top:16px;padding:12px 15px;border-radius:10px;background:var(--navy-050);border:1px solid var(--line);font-size:13.5px;color:var(--ink-2)">💡 提示：原书全文已挂在<b>每一章标题旁边</b>（点击左侧任意具体章节，标题旁即可一键切换「📖 原文阅读」）。</div>';
        }
      }

      app.innerHTML = '<div class="ed-container">' +
        '<div class="ed-study-layout">' +
          '<aside class="ed-sidebar">' +
            '<div class="ed-sidebar-title">📖 ' + esc(book.nameCn || book.name) + '</div>' +
            '<div style="margin-bottom:10px"><a class="ed-btn ed-btn-sm" style="width:100%" href="#/reading">← 返回书架</a></div>' +
            '<div class="ed-week-list">' + chListHtml + '</div>' +
          '</aside>' +
          '<section class="ed-main-col">' +
            '<div class="ed-crumb"><a href="#/reading">个人书房</a> <span>›</span> <span>' + esc(book.nameCn) + '</span> <span>›</span> <span>' + (isIntroChapter ? '导读' : ('第 ' + ch.num + ' 章')) + '</span></div>' +
            '<div class="ed-page-head">' +
              '<h1>' + esc(ch.title || ('第 ' + ch.num + ' 章')) + '</h1>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
                (hasOriginal
                  ? '<button class="ed-btn ed-btn-sm' + (langMode === 'notes' ? ' ed-btn-primary' : '') + '" data-lm="notes">📝 精读笔记</button>' +
                    '<button class="ed-btn ed-btn-sm' + (langMode === 'fulltext' ? ' ed-btn-gold' : '') + '" data-lm="fulltext">📖 原文阅读</button>'
                  : '') +
                '<button id="edBookDone" class="ed-btn ed-btn-sm ' + (isDone ? 'ed-btn-primary' : '') + '">' + (isDone ? '✓ 已读完本章' : '○ 标记已读') + '</button>' +
              '</div>' +
            '</div>' +
            '<div class="ed-prose" style="max-width:780px">' + contentHtml + '</div>' +
            '<div style="display:flex;justify-content:space-between;margin-top:28px;padding-top:16px;border-top:1px solid var(--line-2)">' +
              (prevCh ? '<a class="ed-btn" href="#/book/' + esc(book.id) + '/' + prevCh.num + '">← 上一章</a>' : '<span></span>') +
              (nextCh ? '<a class="ed-btn ed-btn-primary" href="#/book/' + esc(book.id) + '/' + nextCh.num + '">下一章 →</a>' : '<a class="ed-btn ed-btn-gold" href="#/reading">回到书架 ✓</a>') +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>';

      app.querySelectorAll('[data-goto]').forEach(function (b) {
        b.addEventListener('click', function () { location.hash = b.getAttribute('data-goto'); });
      });
      app.querySelectorAll('[data-lm]').forEach(function (b) {
        b.addEventListener('click', function () { langMode = b.getAttribute('data-lm'); fullPage = 0; draw(); });
      });
      app.querySelectorAll('[data-src-idx]').forEach(function (b) {
        b.addEventListener('click', function () { srcIdx = Number(b.getAttribute('data-src-idx')) || 0; fullPage = 0; draw(); });
      });
      app.querySelectorAll('[data-fp]').forEach(function (b) {
        b.addEventListener('click', function () { fullPage = Number(b.getAttribute('data-fp')) || 0; draw(); window.scrollTo(0, 0); });
      });
      var doneBtn = document.getElementById('edBookDone');
      if (doneBtn) doneBtn.addEventListener('click', function () {
        var now = window.LioraStore.toggleWeekDone(book.id, term.id, ch.num);
        window.LioraStudyApi.toast(now ? '已标记读完本章' : '已取消标记');
        draw();
      });
      if (window.LioraHighlighter && typeof window.LioraHighlighter.refresh === 'function') {
        window.LioraHighlighter.refresh();
      }
    }
    draw();
  }

  window.LioraViewsReading = { renderReadingShelf: renderReadingShelf, renderBookReader: renderBookReader };
})();
