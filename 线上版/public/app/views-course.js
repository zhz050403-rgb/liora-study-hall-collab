/* 紧凑双栏「一条龙」课程学习室（零隐藏、全图解速览、高清放大灯箱、划词批注、KaTeX 公式、顺滑切换下一周） */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* 清洗旧 HTML 里重复打印的主标题与多余大横幅，保证页面只有 1 个干净标题 */
  function cleanNoteHtml(raw) {
    if (!raw) return '<p style="color:var(--muted)">本周笔记整理中。</p>';
    return String(raw)
      .replace(/<div[^>]*class="[^"]*(?:note-head|wp-banner|notes-banner)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  }

  function applyKatex(el) {
    if (!el || typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'svg'],
        throwOnError: false
      });
    } catch (e) {}
  }

  /* 提取本节小标题，供「知识点目录」使用 */
  function extractHeadings(container) {
    var list = [];
    if (!container) return list;
    container.querySelectorAll('h2, h3, h4.kp-h').forEach(function (h, i) {
      var txt = (h.textContent || '').trim();
      if (!txt) return;
      var id = 'kp-' + i;
      h.id = id;
      list.push({ id: id, text: txt.slice(0, 56) });
    });
    return list;
  }

  /* 全屏高清图解放大灯箱（支持 SVG 矢量无损放大与图片高清查看） */
  function openLightbox(targetEl, captionText) {
    var existing = document.getElementById('edLightbox');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'edLightbox';
    overlay.className = 'ed-lightbox';

    var card = document.createElement('div');
    card.className = 'ed-lightbox-card';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'ed-lightbox-close';
    closeBtn.textContent = '✕ 关闭 (Esc)';
    card.appendChild(closeBtn);

    var mediaWrap = document.createElement('div');
    mediaWrap.style.marginTop = '8px';
    if (targetEl.tagName.toLowerCase() === 'svg') {
      var clone = targetEl.cloneNode(true);
      clone.removeAttribute('width');
      clone.removeAttribute('height');
      mediaWrap.appendChild(clone);
    } else if (targetEl.tagName.toLowerCase() === 'img') {
      var img = document.createElement('img');
      img.src = targetEl.currentSrc || targetEl.src;
      img.alt = targetEl.alt || '';
      mediaWrap.appendChild(img);
    }
    card.appendChild(mediaWrap);

    if (captionText) {
      var cap = document.createElement('p');
      cap.style.cssText = 'margin:12px 0 0;font-size:13.5px;color:#475a70;line-height:1.55';
      cap.textContent = captionText;
      card.appendChild(cap);
    }

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    function close() {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
  }

  /* 自动收集本周全部图解（核心笔记 + 课后答案解析），绑定点击放大并生成顶部速览条 */
  function wireVisuals(rootEl, stripHost) {
    var visuals = [];
    var seen = new Set();

    function labelFor(container, media, idx, sourceTag) {
      var cap = container.querySelector('.cap, figcaption');
      var txt = cap ? (cap.textContent || '').trim() : '';
      if (!txt) txt = media.getAttribute('aria-label') || media.getAttribute('alt') || '';
      if (!txt) {
        var prev = container.previousElementSibling;
        while (prev && !/^H[2-5]$/i.test(prev.tagName)) prev = prev.previousElementSibling;
        if (prev) txt = (prev.textContent || '').trim();
      }
      txt = txt.replace(/^图解[：:]\s*/, '').replace(/\s+/g, ' ').trim();
      if (!txt) txt = (sourceTag ? sourceTag + ' ' : '') + '图解 ' + (idx + 1);
      return txt.slice(0, 34);
    }

    var zones = [
      { el: rootEl.querySelector('#edNoteBody'), tag: '' },
      { el: rootEl.querySelector('#edTutBody'), tag: '解析' }
    ];

    zones.forEach(function (z) {
      if (!z.el) return;
      z.el.querySelectorAll('svg, img').forEach(function (media) {
        if (seen.has(media)) return;
        seen.add(media);
        var host = media.closest('.diagram, figure.cfig, figure') || media;
        var idx = visuals.length;
        var id = 'ed-fig-' + idx;
        if (!host.id) host.id = id;
        var label = labelFor(host, media, idx, z.tag);
        var capEl = host.querySelector('.cap, figcaption');
        var fullCap = (capEl && capEl.textContent.trim()) || media.getAttribute('aria-label') || media.getAttribute('alt') || label;

        visuals.push({ id: host.id, label: label, tag: z.tag, host: host, media: media, fullCap: fullCap });

        host.style.cursor = 'zoom-in';
        host.addEventListener('click', function (e) {
          if (e.target && e.target.closest('a')) return;
          e.preventDefault();
          openLightbox(media, fullCap);
        });
      });
    });

    if (!stripHost) return visuals.length;
    if (!visuals.length) {
      stripHost.innerHTML = '';
      return 0;
    }

    var INITIAL_SHOW = 8;
    var expanded = false;

    function renderStrip() {
      var list = expanded ? visuals : visuals.slice(0, INITIAL_SHOW);
      stripHost.innerHTML =
        '<div class="ed-fig-strip">' +
          '<div class="ed-fig-strip-head">' +
            '<span><b>📊 本周图解速览（共 ' + visuals.length + ' 张）</b> · 点击标签直达对应图解，点图可高清放大</span>' +
            (visuals.length > INITIAL_SHOW
              ? '<button type="button" class="ed-btn ed-btn-sm" id="edFigToggle">' + (expanded ? '收起部分标签' : '展开全部 ' + visuals.length + ' 张图解') + '</button>'
              : '') +
          '</div>' +
          '<div class="ed-fig-chips">' +
            list.map(function (v, i) {
              var badge = v.tag ? ('[' + v.tag + '] ') : '';
              return '<button type="button" class="ed-fig-chip" data-fig-jump="' + esc(v.id) + '">' +
                '<span style="color:var(--gold-deep);font-weight:700">图 ' + (i + 1) + '</span>' +
                '<span>' + esc(badge + v.label) + '</span>' +
              '</button>';
            }).join('') +
          '</div>' +
        '</div>';

      var tgl = stripHost.querySelector('#edFigToggle');
      if (tgl) tgl.addEventListener('click', function () { expanded = !expanded; renderStrip(); });

      stripHost.querySelectorAll('[data-fig-jump]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = document.getElementById(btn.getAttribute('data-fig-jump'));
          if (!target) return;
          // Auto-open any parent <details> so hidden diagrams inside folded answers reveal instantly!
          var det = target.closest('details');
          while (det) {
            det.open = true;
            det = det.parentElement ? det.parentElement.closest('details') : null;
          }
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.remove('ed-fig-pulse');
          void target.offsetWidth;
          target.classList.add('ed-fig-pulse');
        });
      });
    }

    renderStrip();
    return visuals.length;
  }

  /* 找相邻周（支持跨 Term 无缝衔接） */
  function findAdjacentWeeks(course, curTermId, curWeekNum) {
    var flat = [];
    (course.terms || []).forEach(function (t) {
      (t.weeks || []).forEach(function (w) {
        flat.push({ termId: t.id, termName: t.name || t.id, num: w.num, title: w.title || ('Week ' + w.num) });
      });
    });
    var idx = flat.findIndex(function (x) { return x.termId === curTermId && Number(x.num) === Number(curWeekNum); });
    return {
      prev: idx > 0 ? flat[idx - 1] : null,
      next: (idx >= 0 && idx < flat.length - 1) ? flat[idx + 1] : null
    };
  }

  async function renderCourse(app, courseId, termId, weekNum) {
    app.innerHTML = '<div class="ed-container"><div class="ed-card">正在按需加载课程数据…</div></div>';
    var course;
    try {
      course = await window.LioraStore.loadCourse(courseId);
    } catch (e) {
      app.innerHTML = '<div class="ed-container"><div class="ed-card">无法加载课程：' + esc(courseId) + ' · <a href="#/courses">返回课程中心</a></div></div>';
      return;
    }

    var terms = course.terms || [];
    var term = terms.find(function (t) { return t.id === termId; }) || terms[0];
    if (!term) return;
    var weeks = term.weeks || [];
    var week = weeks.find(function (w) { return Number(w.num) === Number(weekNum); }) || weeks[0];
    if (!week) return;

    var route = '#/c/' + course.id + '/' + term.id + '/' + week.num;
    window.LioraStore.setLastVisit(route, (course.nameCn || course.id) + ' · ' + (week.title || 'Week ' + week.num));

    var noteMode = 'full'; // full | cloze | outline
    var api = window.LioraStudyApi;
    var st = await api.loadStudy();
    var adj = findAdjacentWeeks(course, term.id, week.num);

    function draw() {
      var weekDone = window.LioraStore.isWeekDone(course.id, term.id, week.num);
      var weekAnns = (st.annotations || []).filter(function (a) { return a.route === route; });

      var termPills = terms.length > 1 ? (
        '<div class="ed-term-pills">' + terms.map(function (t) {
          var firstW = (t.weeks && t.weeks[0]) ? t.weeks[0].num : 1;
          return '<button class="ed-term-pill' + (t.id === term.id ? ' active' : '') + '" data-goto="#/c/' + esc(course.id) + '/' + esc(t.id) + '/' + firstW + '">' + esc(t.name || t.id) + '</button>';
        }).join('') + '</div>'
      ) : '';

      var weekListHtml = weeks.map(function (w) {
        var isCur = Number(w.num) === Number(week.num);
        var isDone = window.LioraStore.isWeekDone(course.id, term.id, w.num);
        var dCnt = Number(w.diagramCount) || 0;
        return '<button class="ed-week-btn' + (isCur ? ' active' : '') + (isDone ? ' done' : '') + '" data-goto="#/c/' + esc(course.id) + '/' + esc(term.id) + '/' + w.num + '">' +
          '<span class="ed-week-num">' + (isDone ? '✓' : 'W' + w.num) + '</span>' +
          '<span style="flex:1">' + esc((w.title || ('Week ' + w.num)).replace(/^Week\s*\d+\s*[·\-—]?\s*/i, '')) + '</span>' +
          (dCnt > 0 ? '<span class="ed-week-fig-tag">图' + dCnt + '</span>' : '') +
        '</button>';
      }).join('');

      var rawHtml = cleanNoteHtml(week.graphicHtml || week.notesHtml);

      var tasks = week.tasks || [];
      var tasksHtml = tasks.length ? tasks.map(function (t, i) {
        var tKey = course.id + ':' + term.id + ':' + week.num + ':t' + i;
        var tDone = window.LioraStore.isTaskDone(tKey);
        var txt = typeof t === 'string' ? t : (t.text || t.title || '');
        return '<label style="display:flex;align-items:flex-start;gap:10px;padding:9px 10px;border-bottom:1px solid var(--line-2);cursor:pointer">' +
          '<input type="checkbox" data-task-key="' + esc(tKey) + '"' + (tDone ? ' checked' : '') + ' style="width:17px;height:17px;margin-top:2px;accent-color:var(--navy-800)">' +
          '<span style="flex:1;' + (tDone ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(txt) + '</span>' +
        '</label>';
      }).join('') : '<p style="color:var(--muted);font-size:13.5px;margin:0">本周暂无额外打卡任务，直接精读笔记与图解并核对下方解析即可。</p>';

      var tutHtml = week.tutorialAnswers
        ? (typeof week.tutorialAnswers === 'string' ? week.tutorialAnswers : JSON.stringify(week.tutorialAnswers))
        : '<p style="color:var(--muted);margin:0">本周暂无独立课后答案，可点上方按钮去「多科闭卷刷题」或让右下角 AI 伴学讲解。</p>';

      var onlinePdfs = week.onlineSources || [];
      var gloss = week.glossary || [];
      var offlineFiles = week.files || [];

      app.innerHTML = '<div class="ed-container">' +
        '<div class="ed-study-layout">' +
          '<aside class="ed-sidebar">' +
            '<div class="ed-sidebar-title">' + esc(course.nameCn || course.name) + '</div>' +
            termPills +
            '<div class="ed-week-list">' + weekListHtml + '</div>' +
          '</aside>' +
          '<section class="ed-main-col">' +
            '<div class="ed-crumb"><a href="#/courses">课程中心</a> <span>›</span> <span>' + esc(course.nameCn) + '</span> <span>›</span> <span>' + esc(term.name || term.id) + '</span></div>' +
            '<div class="ed-page-head">' +
              '<h1>' + esc(week.title || ('Week ' + week.num)) + '</h1>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                '<button id="edToggleDoneTop" class="ed-btn ed-btn-sm ' + (weekDone ? 'ed-btn-primary' : '') + '">' + (weekDone ? '✓ 已学完本周' : '○ 标记本周学完') + '</button>' +
                '<button id="edAddNoteBtn" class="ed-btn ed-btn-sm ed-btn-gold">🖍️ 记批注</button>' +
              '</div>' +
            '</div>' +

            /* 吸顶「一条龙」顺滑导航条：无需切页隐藏，直接往下滑即可学完全部 3 站，点按钮可秒跳 */
            '<div class="ed-step-bar">' +
              '<button type="button" class="ed-step-pill active" data-sec="sec-figs">📊 本周图解 <span id="edFigCountBadge">' + (Number(week.diagramCount) || 0) + '</span></button>' +
              '<button type="button" class="ed-step-pill" data-sec="sec-notes">① 核心笔记与图解</button>' +
              '<button type="button" class="ed-step-pill" data-sec="sec-practice">② 打卡练习与答案解析</button>' +
              '<button type="button" class="ed-step-pill" data-sec="sec-resources">③ 课件、术语与视频</button>' +
              '<span style="margin-left:auto;font-size:12px;color:var(--muted)">↓ 顺着往下滑即可一条龙学完</span>' +
            '</div>' +

            /* 本周图解速览（自动扫描所有 SVG/图） */
            '<div id="sec-figs"></div>' +

            /* 第 1 站：核心笔记与图解精讲 */
            '<div id="sec-notes" class="ed-stage-head" style="margin-top:6px">' +
              '<h2>① 核心笔记与图解精讲</h2>' +
              '<span class="sub">按「概念 → 图解 → 课件例题（折叠看解答）→ 易错」自然通读</span>' +
            '</div>' +
            '<div class="ed-guide-bar">' +
              '<span>💡 <b>学习提示：</b>点击任意图解可高清放大；遇到例题先自己算再点「看解答」；鼠标<b>划选文字</b>即可高亮批注。</span>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<button class="ed-btn ed-btn-sm' + (noteMode === 'full' ? ' ed-btn-primary' : '') + '" data-nm="full">精读全文</button>' +
                '<button class="ed-btn ed-btn-sm' + (noteMode === 'cloze' ? ' ed-btn-primary' : '') + '" data-nm="cloze">填空自测</button>' +
                '<button class="ed-btn ed-btn-sm' + (noteMode === 'outline' ? ' ed-btn-primary' : '') + '" data-nm="outline">知识点目录</button>' +
                '<button class="ed-btn ed-btn-sm" onclick="window.print()">🖨️ 打印</button>' +
              '</div>' +
            '</div>' +
            (weekAnns.length ? (
              '<div style="margin-bottom:14px;padding:10px 14px;border-radius:10px;background:var(--navy-050);border:1px solid var(--line);font-size:13px">' +
                '<b>🖍️ 我在本周记过的批注（' + weekAnns.length + ' 条）：</b>' +
                weekAnns.slice(0, 3).map(function (a) {
                  return '<div style="margin-top:4px">• ' + (a.quote ? '<em>「' + esc(a.quote.slice(0, 60)) + '」</em> ' : '') + esc(a.note || '') + '</div>';
                }).join('') +
              '</div>'
            ) : '') +
            '<div id="edNoteBody" class="ed-prose' + (noteMode === 'cloze' ? ' cloze-on' : '') + '">' + rawHtml + '</div>' +

            /* 第 2 站：本周打卡任务与课后作业参考解析 */
            '<div id="sec-practice" class="ed-stage-head">' +
              '<h2>② 打卡练习与课后答案解析</h2>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<a class="ed-btn ed-btn-sm ed-btn-gold" href="#/mistakes">➕ 记入错题本</a>' +
                '<a class="ed-btn ed-btn-sm" style="background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.3)" href="#/exam-packs">🎯 去做本课闭卷刷题</a>' +
              '</div>' +
            '</div>' +
            '<div class="ed-card" style="margin-bottom:14px"><h3 style="margin:0 0 8px;font-family:var(--serif);font-size:15.5px;color:var(--navy-900)">✅ 本周学习任务清单</h3>' + tasksHtml + '</div>' +
            '<div class="ed-card"><h3 style="margin:0 0 10px;font-family:var(--serif);font-size:15.5px;color:var(--navy-900)">📝 课后作业参考解析与图解核对</h3><div class="ed-prose" id="edTutBody">' + tutHtml + '</div></div>' +

            /* 第 3 站：站内原件 PDF、核心中英术语与配套视频 */
            '<div id="sec-resources" class="ed-stage-head">' +
              '<h2>③ 课件原件、中英术语与配套视频</h2>' +
              '<span class="sub">随学随查原件、背术语、看双语讲解</span>' +
            '</div>' +
            '<div class="ed-card" style="margin-bottom:14px">' +
              '<h3 style="margin:0 0 10px;font-family:var(--serif);font-size:15.5px;color:var(--navy-900)">📄 本周可在线直达原件（站内已核验 PDF）</h3>' +
              (onlinePdfs.length
                ? '<div style="display:flex;flex-wrap:wrap;gap:8px">' + onlinePdfs.map(function (f) {
                    return '<a class="ed-btn ed-btn-sm ed-btn-primary" target="_blank" rel="noopener" href="' + esc(f.path) + '">📎 ' + esc(f.name) + ' ↗</a>';
                  }).join('') + '</div>'
                : '<p style="font-size:13.5px;color:var(--muted);margin:0">本周核心知识点与例题已完整整理在上方「① 核心笔记与图解精讲」中。</p>') +
            '</div>' +
            '<div class="ed-card" style="margin-bottom:14px">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap">' +
                '<h3 style="margin:0;font-family:var(--serif);font-size:15.5px;color:var(--navy-900)">🃏 本周核心中英术语（' + gloss.length + ' 条）</h3>' +
                '<a class="ed-btn ed-btn-sm ed-btn-gold" href="#/flashcards">去闪卡模式速背 →</a>' +
              '</div>' +
              (gloss.length
                ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px">' + gloss.map(function (g) {
                    return '<div style="padding:10px 12px;border-radius:9px;background:var(--surface-2);border:1px solid var(--line-2)">' +
                      '<div style="font-weight:700;color:var(--navy-900);font-size:13.5px">' + esc(g.term) + '</div>' +
                      '<div style="color:var(--gold-deep);font-size:13px;font-weight:600;margin:2px 0">' + esc(g.zh) + '</div>' +
                      '<div style="font-size:12.5px;color:var(--ink-2)">' + esc(g.def) + '</div>' +
                    '</div>';
                  }).join('') + '</div>'
                : '<p style="font-size:13.5px;color:var(--muted);margin:0">全科 112 条中英核心术语均可直接在「术语闪卡」按学科集中复习。</p>') +
            '</div>' +
            '<div class="ed-card" style="margin-bottom:14px">' +
              '<h3 style="margin:0 0 10px;font-family:var(--serif);font-size:15.5px;color:var(--navy-900)">🎬 配套视频与考前通关手册</h3>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
                '<a class="ed-btn ed-btn-gold" href="#/handbooks/' + esc(course.id) + '">📚 打开本课通关手册（公式/避坑）</a>' +
                '<a class="ed-btn" href="bilingual-video.html?course=' + esc(course.id) + '">🎬 打开中英对照视频页</a>' +
                (course.id === 'accounting' ? '<a class="ed-btn" href="exam-prep.html">🎯 会计 U1–U6 官方引文闭卷库</a>' : '') +
                (course.id === 'english' ? '<a class="ed-btn" href="english/index.html">🇬🇧 打开英语精读与生词工作台</a>' : '') +
              '</div>' +
            '</div>' +
            (offlineFiles.length ? (
              '<details class="ed-card"><summary style="cursor:pointer;font-size:13.5px;font-weight:600;color:var(--muted)">本机课程文件夹原始课件清单（' + offlineFiles.length + ' 份 · 仅原电脑离线保存）</summary>' +
              '<ul style="margin:10px 0 0;padding-left:20px;font-size:13px;color:var(--muted)">' + offlineFiles.map(function (f) {
                return '<li>' + esc(f.name || f.title || f.path || '') + '</li>';
              }).join('') + '</ul></details>'
            ) : '') +

            /* 底部「一条龙收尾栏」：打勾完成 + 一键进入下一周 */
            '<div class="ed-next-bar">' +
              '<div>' +
                (adj.prev
                  ? '<a class="ed-btn ed-btn-sm" href="#/c/' + esc(course.id) + '/' + esc(adj.prev.termId) + '/' + adj.prev.num + '">← 上一周：' + esc(adj.prev.title.slice(0, 18)) + '</a>'
                  : '<a class="ed-btn ed-btn-sm" href="#/courses">← 返回课程中心</a>') +
              '</div>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
                '<button id="edToggleDoneBot" class="ed-btn ' + (weekDone ? 'ed-btn-primary' : 'ed-btn-gold') + '">' + (weekDone ? '✓ 本周已学完' : '✓ 标记本周已学完') + '</button>' +
                (adj.next
                  ? '<a class="ed-btn ed-btn-primary" href="#/c/' + esc(course.id) + '/' + esc(adj.next.termId) + '/' + adj.next.num + '">继续下一周：' + esc(adj.next.title.slice(0, 18)) + ' →</a>'
                  : '<a class="ed-btn ed-btn-primary" href="#/exam-packs">🎓 本课全部学完 · 去模拟刷题 →</a>') +
              '</div>' +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>';

      /* 事件绑定 */
      app.querySelectorAll('[data-goto]').forEach(function (b) {
        b.addEventListener('click', function () { location.hash = b.getAttribute('data-goto'); });
      });
      app.querySelectorAll('[data-nm]').forEach(function (b) {
        b.addEventListener('click', function () { noteMode = b.getAttribute('data-nm'); draw(); });
      });
      app.querySelectorAll('[data-sec]').forEach(function (b) {
        b.addEventListener('click', function () {
          app.querySelectorAll('[data-sec]').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          var target = document.getElementById(b.getAttribute('data-sec'));
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      function onToggleDone() {
        var nowDone = window.LioraStore.toggleWeekDone(course.id, term.id, week.num);
        api.toast(nowDone ? '已标记学完本周！' : '已取消完成标记');
        draw();
      }
      var doneTop = document.getElementById('edToggleDoneTop');
      var doneBot = document.getElementById('edToggleDoneBot');
      if (doneTop) doneTop.addEventListener('click', onToggleDone);
      if (doneBot) doneBot.addEventListener('click', onToggleDone);

      var noteBtn = document.getElementById('edAddNoteBtn');
      if (noteBtn) noteBtn.addEventListener('click', async function () {
        var txt = window.prompt('写一句本周（' + (week.title || 'Week ' + week.num) + '）的学习批注或避坑提醒：');
        if (!txt || !txt.trim()) return;
        await api.saveAnnotation({ route: route, course: course.id, title: week.title || ('Week ' + week.num), kind: 'note', note: txt.trim() });
        st = await api.loadStudy(true);
        api.toast('批注已保存到云端');
        draw();
      });

      app.querySelectorAll('[data-task-key]').forEach(function (chk) {
        chk.addEventListener('change', function () {
          window.LioraStore.toggleTaskDone(chk.getAttribute('data-task-key'));
          draw();
        });
      });

      var noteBody = document.getElementById('edNoteBody');
      if (noteBody) {
        applyKatex(noteBody);
        if (noteMode === 'cloze') {
          noteBody.querySelectorAll('strong, .c-red').forEach(function (el) {
            el.title = '点击翻开关键词';
            el.addEventListener('click', function () { el.classList.toggle('revealed'); });
          });
        }
        if (noteMode === 'outline') {
          var heads = extractHeadings(noteBody);
          if (heads.length) {
            var toc = document.createElement('div');
            toc.className = 'ed-card';
            toc.style.marginBottom = '16px';
            toc.innerHTML = '<b style="font-size:14px;color:var(--navy-900)">本节核心知识点速览（共 ' + heads.length + ' 项 · 点击直达）</b>' +
              '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px;margin-top:10px">' +
              heads.map(function (h, idx) {
                return '<a href="javascript:void(0)" data-jump="' + h.id + '" style="font-size:13px;padding:6px 10px;border-radius:7px;background:var(--surface-2);border:1px solid var(--line-2);color:var(--navy-900)">' + (idx + 1) + '. ' + esc(h.text) + '</a>';
              }).join('') + '</div>';
            noteBody.insertBefore(toc, noteBody.firstChild);
            toc.querySelectorAll('[data-jump]').forEach(function (a) {
              a.addEventListener('click', function () {
                var t = document.getElementById(a.getAttribute('data-jump'));
                if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
              });
            });
          }
        }
      }
      var tutBody = document.getElementById('edTutBody');
      if (tutBody) applyKatex(tutBody);

      /* 扫描全页图解（核心笔记 + 课后答案），生成顶部速览条并绑定点击放大灯箱 */
      var totalVis = wireVisuals(app, document.getElementById('sec-figs'));
      var badgeEl = document.getElementById('edFigCountBadge');
      if (badgeEl) badgeEl.textContent = String(totalVis);
    }

    draw();
  }

  window.LioraViewsCourse = { renderCourse: renderCourse };
})();
