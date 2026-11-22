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
      '<div class="ed-hero" style="grid-template-columns:1fr;padding:22px 26px">' +
        '<div><div class="ed-hero-kicker">PRIVATE LIBRARY · 个人书房</div>' +
        '<h1>学院书库 · 精读书架</h1>' +
        '<p style="margin-bottom:0">已完整收录 <b>' + books.length + ' 本经典好书</b>（支持沉浸书页阅读、划词批注与阅读进度同步）；另收纳 ' + wishlist.length + ' 本想读书单。</p></div>' +
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

    var route = '#/book/' + book.id + '/' + ch.num;
    window.LioraStore.setLastVisit(route, '📖 ' + (book.nameCn || book.id) + ' · ' + (ch.title || '第 ' + ch.num + ' 章'));

    var langMode = 'notes'; // notes | fulltext
    var readerChapters = (book.reader && Array.isArray(book.reader.chapters)) ? book.reader.chapters : [];
    var matchedReader = readerChapters[chIdx] || readerChapters.find(function (rc) { return Number(rc.num) === Number(ch.num); });

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
      if (langMode === 'fulltext' && matchedReader) {
        var paras = matchedReader.paragraphs || matchedReader.blocks || [];
        contentHtml = paras.length
          ? paras.map(function (p) {
              if (typeof p === 'string') return '<p>' + esc(p) + '</p>';
              var zh = p.zh || p.cn || '';
              var en = p.en || p.text || '';
              return '<div style="margin-bottom:14px">' +
                (en ? '<p style="margin:0 0 4px;color:var(--ink)">' + esc(en) + '</p>' : '') +
                (zh ? '<p style="margin:0;color:var(--ink-2);font-size:14.5px;background:var(--surface-2);padding:6px 10px;border-radius:6px">' + esc(zh) + '</p>' : '') +
              '</div>';
            }).join('')
          : (matchedReader.html || '<p style="color:var(--muted)">本章暂无原文文本。</p>');
      } else {
        contentHtml = ch.graphicHtml || ch.notesHtml || '<p style="color:var(--muted)">本章暂无精读笔记。</p>';
      }

      app.innerHTML = '<div class="ed-container">' +
        '<div class="ed-study-layout">' +
          '<aside class="ed-sidebar">' +
            '<div class="ed-sidebar-title">📖 ' + esc(book.nameCn || book.name) + '</div>' +
            '<div style="margin-bottom:10px"><a class="ed-btn ed-btn-sm" style="width:100%" href="#/reading">← 返回书架</a></div>' +
            '<div class="ed-week-list">' + chListHtml + '</div>' +
          '</aside>' +
          '<section class="ed-main-col">' +
            '<div class="ed-crumb"><a href="#/reading">个人书房</a> <span>›</span> <span>' + esc(book.nameCn) + '</span> <span>›</span> <span>第 ' + ch.num + ' 章</span></div>' +
            '<div class="ed-page-head">' +
              '<h1>' + esc(ch.title || ('第 ' + ch.num + ' 章')) + '</h1>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                (matchedReader ? '<button class="ed-btn ed-btn-sm' + (langMode === 'notes' ? ' ed-btn-primary' : '') + '" data-lm="notes">精读笔记</button>' +
                  '<button class="ed-btn ed-btn-sm' + (langMode === 'fulltext' ? ' ed-btn-primary' : '') + '" data-lm="fulltext">原书全文</button>' : '') +
                '<button id="edBookDone" class="ed-btn ed-btn-sm ' + (isDone ? 'ed-btn-primary' : '') + '">' + (isDone ? '✓ 已读完本章' : '○ 标记已读') + '</button>' +
              '</div>' +
            '</div>' +
            '<div class="ed-prose" style="max-width:760px">' + contentHtml + '</div>' +
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
        b.addEventListener('click', function () { langMode = b.getAttribute('data-lm'); draw(); });
      });
      var doneBtn = document.getElementById('edBookDone');
      if (doneBtn) doneBtn.addEventListener('click', function () {
        var now = window.LioraStore.toggleWeekDone(book.id, term.id, ch.num);
        window.LioraStudyApi.toast(now ? '已标记读完本章' : '已取消标记');
        draw();
      });
    }
    draw();
  }

  window.LioraViewsReading = { renderReadingShelf: renderReadingShelf, renderBookReader: renderBookReader };
})();
