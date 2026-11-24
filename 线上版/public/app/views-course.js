/* 紧凑双栏「一条龙」中英双语课程学习室（逐行中英概念、全单元必考大题、797张图解速览、高清灯箱、3档背诵切换） */
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

  /* 精准考点词填空：只遮盖真正的专业术语、定义关键词与公式，绝不随机乱遮 */
  function escRe(s) { return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function makeClozeEn(text, term, glossTerms) {
    var escaped = esc(text);
    var targets = [];
    /* 1. 提取当前概念标题中的英文核心术语（括号前部分） */
    var enHead = String(term || '').replace(/[（(][^）)]*[）)]/g, ' ').trim();
    enHead.split(/\s*(?:vs\.?|&|\/|,|and|\+)\s*/i).forEach(function (part) {
      var p = part.trim();
      if (p.length >= 3 && /^[A-Za-z]/.test(p)) targets.push(p);
    });
    /* 2. 加入本周术语表中的英文专业术语 */
    (glossTerms || []).forEach(function (g) {
      var t = String(g && g.term || '').trim();
      if (t.length >= 3 && /^[A-Za-z]/.test(t)) targets.push(t);
    });
    /* 去重并按长度降序优先匹配完整词组 */
    var seen = {};
    targets = targets.filter(function (x) {
      var k = x.toLowerCase();
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    }).sort(function (a, b) { return b.length - a.length; });

    var count = 0;
    targets.forEach(function (kw) {
      if (count >= 4) return;
      var re = new RegExp('(?<!<[^>]*)\\b(' + escRe(kw) + ')\\b', 'i');
      if (re.test(escaped)) {
        escaped = escaped.replace(re, '<span class="ed-cloze-blank" title="点击翻开英文考点词">$1</span>');
        count++;
      }
    });
    /* 3. 若句中未出现标题原词，兜底只遮盖专业缩写/公式（如 GDP / PED / MR = MC / XLOOKUP） */
    if (count === 0) {
      escaped = escaped.replace(/\b([A-Z]{2,}(?:\s*=\s*[A-Z]{2,})?)\b/g, function (m) {
        if (count >= 3) return m;
        count++;
        return '<span class="ed-cloze-blank" title="点击翻开英文缩写/公式">' + m + '</span>';
      });
    }
    return escaped;
  }

  function makeClozeZh(text, term) {
    var escaped = esc(text);
    var count = 0;
    /* 1. 优先遮盖当前概念的中文专业术语（来自标题括号内中文，绝不遮中文句里的英文词） */
    var zhMatch = String(term || '').match(/[（(]([^）)]+)[）)]/);
    if (zhMatch && zhMatch[1]) {
      zhMatch[1].split(/[、，,\/与及和\s]+/).forEach(function (part) {
        var p = part.trim();
        if (p.length >= 2 && /[\u4e00-\u9fa5]/.test(p) && !/[A-Za-z]/.test(p) && count < 3) {
          var idx = escaped.indexOf(p);
          if (idx >= 0) {
            escaped = escaped.slice(0, idx) + '<span class="ed-cloze-blank" title="点击翻开中文核心概念">' + p + '</span>' + escaped.slice(idx + p.length);
            count++;
          }
        }
      });
    }
    /* 2. 遮盖中文「…」内标注的核心定义词（仅纯中文） */
    escaped = escaped.replace(/「([\u4e00-\u9fa5]{2,14})」/g, function (full, inner) {
      if (count >= 4) return full;
      count++;
      return '「<span class="ed-cloze-blank" title="点击翻开中文要点">' + inner + '</span>」';
    });
    /* 3. 若仍未命中，遮盖「是指/等于/核心是/分为/包括」紧跟的纯中文核心短语 */
    if (count === 0) {
      escaped = escaped.replace(/(是指|指的是|即|本质是|核心是|等于|包括|分为)([\u4e00-\u9fa5]{2,12})/, function (full, lead, body) {
        count++;
        return lead + '<span class="ed-cloze-blank" title="点击翻开中文核心定义">' + body + '</span>';
      });
    }
    return escaped;
  }

  /* 渲染「核心概念中英逐行精讲」卡片块 */
  function renderBilingualConcepts(concepts, isCloze, isRecall, glossTerms) {
    if (!concepts || !concepts.length) return '';
    return '<div class="bi-concept-wrap" id="edBiConcepts">' +
      '<div class="bi-concept-banner">' +
        '<h3>📌 核心概念中英逐行精讲 · Core Concepts（共 ' + concepts.length + ' 条）</h3>' +
        '<span style="font-size:12px;color:var(--muted)">' +
          (isCloze ? '🧠 填空自测已启用 · 精准遮盖核心术语与定义，点击色块翻开核对'
            : (isRecall ? '🧠 看中文背英文 · 看下方中文复述英文，点浅蓝卡翻开核对'
              : '上行英文规范句（直接背考场定义） · 紧跟下行中文精解')) +
        '</span>' +
      '</div>' +
      '<div class="bi-concept-list">' +
        concepts.map(function (c, i) {
          var isOfficial = /课件原话|真题|官方核心文本/.test(c.src || '');
          /* 看中文背英文模式下不再叠加英文局部挖空，避免遮罩冲突 */
          var enHtml = (isCloze && !isRecall) ? makeClozeEn(c.en, c.term, glossTerms) : esc(c.en);
          var zhHtml = isCloze ? makeClozeZh(c.zh, c.term) : esc(c.zh);
          return '<div class="bi-concept-card" id="bi-item-' + i + '">' +
            '<div class="bi-concept-head">' +
              '<span class="bi-concept-term">' + (i + 1) + '. ' + esc(c.term) + '</span>' +
              (c.src ? '<span class="bi-src-badge' + (isOfficial ? ' official' : '') + '">' + (isOfficial ? '✓ ' : '') + esc(c.src) + '</span>' : '') +
            '</div>' +
            '<div class="bi-pair">' +
              '<div class="bi-en">🇬🇧 ' + enHtml + '</div>' +
              '<div class="bi-zh">🇨🇳 ' + zhHtml + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* 渲染「本单元必考大题与中英对照标准答案」专区 */
  function renderExamQA(qaList) {
    if (!qaList || !qaList.length) return '';
    return '<div id="sec-exam-qa" class="ed-stage-head" style="background:linear-gradient(90deg,#1d4374 0%,#7a5818 100%)">' +
      '<h2>🎯 本单元必考大题与标准答案（中英对照 · 共 ' + qaList.length + ' 题）</h2>' +
      '<span class="sub">先看题自己想思路，再展开核对英文高分踩分句与中文解析</span>' +
    '</div>' +
    '<div class="ed-exam-qa">' +
      qaList.map(function (q, idx) {
        var ptsHtml = (q.points || []).map(function (p, pi) {
          return '<div class="bi-pair">' +
            '<div class="bi-en"><b>(' + (pi + 1) + ') 🇬🇧</b> ' + esc(p.en) + '</div>' +
            '<div class="bi-zh">🇨🇳 ' + esc(p.zh) + '</div>' +
          '</div>';
        }).join('');
        var kwHtml = (q.keywords && q.keywords.length)
          ? '<div class="ed-qa-kws"><span>🔑 英文采分关键词：</span>' + q.keywords.map(function (k) {
              return '<span class="ed-qa-kw">' + esc(k) + '</span>';
            }).join('') + '</div>'
          : '';
        return '<div class="ed-qa-card" id="qa-item-' + idx + '">' +
          '<div class="ed-qa-top">' +
            '<span class="ed-qa-num">必考大题 Q' + (idx + 1) + '</span>' +
            (q.tag ? '<span class="ed-qa-tag">' + esc(q.tag) + '</span>' : '') +
          '</div>' +
          '<div class="ed-qa-q-en">🇬🇧 ' + esc(q.qEn) + '</div>' +
          '<div class="ed-qa-q-zh">🇨🇳 ' + esc(q.qZh) + '</div>' +
          '<details class="ed-qa-details">' +
            '<summary>▶ 点击展开中英对照高分标准答案与采分点</summary>' +
            '<div class="ed-qa-points">' + ptsHtml + '</div>' +
            kwHtml +
            '<div class="ed-qa-foot">' +
              '<button type="button" class="ed-btn ed-btn-sm ed-btn-gold" data-qa-save="' + idx + '">➕ 没答全，收入遗忘曲线错题本</button>' +
            '</div>' +
          '</details>' +
        '</div>';
      }).join('') +
    '</div>';
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

    var noteMode = 'full';   // full | cloze | outline
    var biMode = 'both';     // both | en | recall
    var api = window.LioraStudyApi;
    var st = await api.loadStudy();
    var adj = findAdjacentWeeks(course, term.id, week.num);

    function draw() {
      var weekDone = window.LioraStore.isWeekDone(course.id, term.id, week.num);
      var weekAnns = (st.annotations || []).filter(function (a) { return a.route === route; });
      var biConcepts = week.bilingualConcepts || [];
      var qaList = week.examQA || [];

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
      }).join('') : '<p style="color:var(--muted);font-size:13.5px;margin:0">本周暂无额外打卡任务，直接精读双语概念、图解与必考大题即可。</p>';

      var tutHtml = week.tutorialAnswers
        ? (typeof week.tutorialAnswers === 'string' ? week.tutorialAnswers : JSON.stringify(week.tutorialAnswers))
        : '<p style="color:var(--muted);margin:0">本周暂无独立课后答案，可先刷上方「本单元必考大题」或前往「多科闭卷刷题」。</p>';

      var onlinePdfs = week.onlineSources || [];
      var gloss = week.glossary || [];
      var offlineFiles = week.files || [];

      var biCls = biMode === 'en' ? ' ed-bi-en-only' : (biMode === 'recall' ? ' ed-bi-recall' : '');

      app.innerHTML = '<div class="ed-container">' +
        '<div class="ed-study-layout">' +
          '<aside class="ed-sidebar">' +
            '<div class="ed-sidebar-title">' + esc(course.nameCn || course.name) + '</div>' +
            termPills +
            '<div class="ed-week-list">' + weekListHtml + '</div>' +
          '</aside>' +
          '<section class="ed-main-col' + biCls + '">' +
            '<div class="ed-crumb"><a href="#/courses">课程中心</a> <span>›</span> <span>' + esc(course.nameCn) + '</span> <span>›</span> <span>' + esc(term.name || term.id) + '</span></div>' +
            '<div class="ed-page-head">' +
              '<h1>' + esc(week.title || ('Week ' + week.num)) + '</h1>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                '<button id="edToggleDoneTop" class="ed-btn ed-btn-sm ' + (weekDone ? 'ed-btn-primary' : '') + '">' + (weekDone ? '✓ 已学完本周' : '○ 标记本周学完') + '</button>' +
                '<button id="edAddNoteBtn" class="ed-btn ed-btn-sm ed-btn-gold">🖍️ 记批注</button>' +
              '</div>' +
            '</div>' +

            /* 吸顶「一条龙」顺滑导航条（打卡置顶，课后解析保留在原位置，中英视频独立标签） */
            '<div class="ed-step-bar">' +
              '<button type="button" class="ed-step-pill active" data-sec="sec-checklist">✅ 本周打卡</button>' +
              '<button type="button" class="ed-step-pill" data-sec="sec-figs">📊 本周图解 <span id="edFigCountBadge">' + (Number(week.diagramCount) || 0) + '</span></button>' +
              '<button type="button" class="ed-step-pill" data-sec="sec-notes">📖 概念与笔记</button>' +
              (qaList.length ? '<button type="button" class="ed-step-pill" data-sec="sec-exam-qa">🎯 必考大题 ' + qaList.length + '</button>' : '') +
              '<button type="button" class="ed-step-pill" data-sec="sec-tutorial">📝 课后解析</button>' +
              '<button type="button" class="ed-step-pill" data-sec="sec-resources">📄 课件与术语</button>' +
              '<button type="button" class="ed-step-pill" data-sec="sec-videos">🎬 中英视频</button>' +
            '</div>' +

            /* 第 1 站（置顶）：仅放本周学习任务打卡清单，清爽直接打勾 */
            '<div id="sec-checklist" class="ed-card" style="margin:6px 0 14px;border-left:4px solid var(--gold)">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
                '<h3 style="margin:0;font-family:var(--serif);font-size:15.5px;color:var(--navy-900)">✅ 本周学习任务打卡清单</h3>' +
                '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                  '<a class="ed-btn ed-btn-sm ed-btn-gold" href="#/mistakes">➕ 错题本</a>' +
                  '<a class="ed-btn ed-btn-sm" href="#/exam-packs">🎯 闭卷刷题</a>' +
                '</div>' +
              '</div>' +
              tasksHtml +
            '</div>' +

            /* 本周图解速览 */
            '<div id="sec-figs"></div>' +

            /* 第 2 站：中英逐行核心概念 + 笔记与图解精讲（含恢复的 🧠 思维导图） */
            '<div id="sec-notes" class="ed-stage-head" style="margin-top:6px">' +
              '<h2>📖 核心概念（中英逐行）与图解笔记</h2>' +
              '<span class="sub">英文规范句 → 中文精解 → 图解 → 思维导图，一条龙自然通读</span>' +
            '</div>' +
            '<div class="ed-guide-bar">' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
                '<b style="font-size:12.5px">语言模式：</b>' +
                '<button class="ed-btn ed-btn-sm' + (biMode === 'both' ? ' ed-btn-primary' : '') + '" data-bm="both">🌐 中英对照</button>' +
                '<button class="ed-btn ed-btn-sm' + (biMode === 'en' ? ' ed-btn-primary' : '') + '" data-bm="en">🇬🇧 纯英文</button>' +
                '<button class="ed-btn ed-btn-sm' + (biMode === 'recall' ? ' ed-btn-primary' : '') + '" data-bm="recall">🧠 看中文背英文</button>' +
              '</div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<button class="ed-btn ed-btn-sm' + (noteMode === 'full' ? ' ed-btn-primary' : '') + '" data-nm="full">精读全文</button>' +
                '<button class="ed-btn ed-btn-sm' + (noteMode === 'mindmap' ? ' ed-btn-primary' : '') + '" data-nm="mindmap">🧠 思维导图</button>' +
                '<button class="ed-btn ed-btn-sm' + (noteMode === 'cloze' ? ' ed-btn-primary' : '') + '" data-nm="cloze">填空自测</button>' +
                '<button class="ed-btn ed-btn-sm' + (noteMode === 'outline' ? ' ed-btn-primary' : '') + '" data-nm="outline">知识点目录</button>' +
                '<button class="ed-btn ed-btn-sm" onclick="window.print()">🖨️ 打印</button>' +
              '</div>' +
            '</div>' +

            '<div id="edModeSlot"></div>' +

            renderBilingualConcepts(biConcepts, noteMode === 'cloze', biMode === 'recall', gloss) +

            (weekAnns.length ? (
              '<div style="margin-bottom:14px;padding:10px 14px;border-radius:10px;background:var(--navy-050);border:1px solid var(--line);font-size:13px">' +
                '<b>🖍️ 我在本周记过的批注（' + weekAnns.length + ' 条）：</b>' +
                weekAnns.slice(0, 3).map(function (a) {
                  return '<div style="margin-top:4px">• ' + (a.quote ? '<em>「' + esc(a.quote.slice(0, 60)) + '」</em> ' : '') + esc(a.note || '') + '</div>';
                }).join('') +
              '</div>'
            ) : '') +
            '<div id="edNoteBody" class="ed-prose' + (noteMode === 'cloze' ? ' cloze-on' : '') + '">' + rawHtml + '</div>' +

            /* 必考大题与中英对照标准答案 */
            renderExamQA(qaList) +

            /* 课后作业参考解析（保留在原位置：必考大题下方） */
            '<div id="sec-tutorial" class="ed-stage-head">' +
              '<h2>📝 课后作业参考解析与图解核对</h2>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<a class="ed-btn ed-btn-sm ed-btn-gold" href="#/mistakes">➕ 记入错题本</a>' +
                '<a class="ed-btn ed-btn-sm" style="background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.3)" href="#/exam-packs">🎯 去做本课闭卷刷题</a>' +
              '</div>' +
            '</div>' +
            '<div class="ed-card" style="margin-bottom:14px"><div class="ed-prose" id="edTutBody">' + tutHtml + '</div></div>' +

            /* 第 3 站：站内原件 PDF 与核心中英术语 */
            '<div id="sec-resources" class="ed-stage-head">' +
              '<h2>📄 课件原件与核心中英术语</h2>' +
              '<span class="sub">随学随查原件、背考场术语</span>' +
            '</div>' +
            '<div class="ed-card" style="margin-bottom:14px">' +
              '<h3 style="margin:0 0 10px;font-family:var(--serif);font-size:15.5px;color:var(--navy-900)">📄 本周可在线直达原件（站内已核验 PDF）</h3>' +
              (onlinePdfs.length
                ? '<div style="display:flex;flex-wrap:wrap;gap:8px">' + onlinePdfs.map(function (f) {
                    return '<a class="ed-btn ed-btn-sm ed-btn-primary" target="_blank" rel="noopener" href="' + esc(f.path) + '">📎 ' + esc(f.name) + ' ↗</a>';
                  }).join('') + '</div>'
                : '<p style="font-size:13.5px;color:var(--muted);margin:0">本周核心双语概念、必考大题与例题已完整整理在上方正文中。</p>') +
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
            (offlineFiles.length ? (
              '<details class="ed-card" style="margin-bottom:14px"><summary style="cursor:pointer;font-size:13.5px;font-weight:600;color:var(--muted)">本机课程文件夹原始课件清单（' + offlineFiles.length + ' 份 · 仅原电脑离线保存）</summary>' +
              '<ul style="margin:10px 0 0;padding-left:20px;font-size:13px;color:var(--muted)">' + offlineFiles.map(function (f) {
                return '<li>' + esc(f.name || f.title || f.path || '') + '</li>';
              }).join('') + '</ul></details>'
            ) : '') +

            /* 第 4 站：独立中英视频与考前通关手册专区（与上方标签一键直达） */
            '<div id="sec-videos" class="ed-stage-head">' +
              '<h2>🎬 本课中英对照视频与考前通关手册</h2>' +
              '<span class="sub">中英双语讲解视频 · 考前公式手册 · 专项题库</span>' +
            '</div>' +
            '<div class="ed-card" style="margin-bottom:14px">' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
                '<a class="ed-btn ed-btn-primary" href="bilingual-video.html?course=' + esc(course.id) + '">🎬 打开本课中英对照视频页 ↗</a>' +
                '<a class="ed-btn ed-btn-gold" href="#/handbooks/' + esc(course.id) + '">📚 打开本课通关手册（公式/避坑）</a>' +
                (course.id === 'accounting' ? '<a class="ed-btn" href="exam-prep.html">🎯 会计 U1–U6 官方引文闭卷库</a>' : '') +
                (course.id === 'english' ? '<a class="ed-btn" href="english/index.html">🇬🇧 打开英语精读与生词工作台</a>' : '') +
              '</div>' +
            '</div>' +

            /* 底部「一条龙收尾栏」 */
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
      app.querySelectorAll('[data-bm]').forEach(function (b) {
        b.addEventListener('click', function () { biMode = b.getAttribute('data-bm'); draw(); });
      });
      app.querySelectorAll('[data-sec]').forEach(function (b) {
        b.addEventListener('click', function () {
          app.querySelectorAll('[data-sec]').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          var target = document.getElementById(b.getAttribute('data-sec'));
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      /* 背诵模式：点击被遮住的英文原句逐句翻开核对 */
      if (biMode === 'recall') {
        app.querySelectorAll('.bi-en, .bi-add').forEach(function (el) {
          el.title = '点击翻开/隐藏英文原句';
          el.addEventListener('click', function () { el.classList.toggle('revealed'); });
        });
      }

      /* 必考大题一键收入遗忘曲线错题本 */
      app.querySelectorAll('[data-qa-save]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var q = qaList[Number(btn.getAttribute('data-qa-save'))];
          if (!q) return;
          var ansText = (q.points || []).map(function (p, i) { return '(' + (i + 1) + ') ' + p.en + '\n' + p.zh; }).join('\n');
          btn.disabled = true;
          btn.textContent = '保存中…';
          try {
            await api.saveMistake({
              course: course.id,
              topic: week.title || ('Week ' + week.num),
              question: q.qEn + '\n' + q.qZh,
              answer: ansText,
              myError: '本单元必考大题自测未完全答出，待按遗忘曲线重背',
              tags: (q.keywords || []).slice(0, 4)
            });
            btn.textContent = '✓ 已收入错题本';
            api.toast('已加入错题本（1/3/7/14天自动提醒复习）');
          } catch (e) {
            btn.disabled = false;
            btn.textContent = '➕ 没答全，收入遗忘曲线错题本';
            api.toast('保存失败，请重试');
          }
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
      var modeSlot = document.getElementById('edModeSlot');
      if (noteBody) applyKatex(noteBody);

      /* 跳转辅助 */
      function jumpToId(targetId) {
        var t = document.getElementById(targetId);
        if (!t) return;
        var det = t.closest('details');
        while (det) { det.open = true; det = det.parentElement ? det.parentElement.closest('details') : null; }
        t.scrollIntoView({ behavior: 'smooth', block: 'center' });
        t.classList.remove('ed-fig-pulse');
        void t.offsetWidth;
        t.classList.add('ed-fig-pulse');
      }

      if (noteMode === 'mindmap' && modeSlot) {
        var mmHeads = noteBody ? extractHeadings(noteBody) : [];
        var branches = [];
        if (biConcepts.length) {
          branches.push({
            title: '📌 核心概念（中英对照 · ' + biConcepts.length + ' 条）',
            jump: 'edBiConcepts',
            kids: biConcepts.map(function (c, i) {
              return { label: '<b>' + esc(c.term) + '</b> — ' + esc((c.zh || '').slice(0, 64)), jump: 'bi-item-' + i };
            })
          });
        }
        mmHeads.forEach(function (h) {
          var hEl = document.getElementById(h.id);
          var pts = [];
          if (hEl) {
            var cur = hEl.nextElementSibling;
            while (cur && !/^H[234]$/.test(cur.tagName) && pts.length < 6) {
              if (cur.tagName === 'UL' || cur.tagName === 'OL') {
                cur.querySelectorAll('li').forEach(function (li) {
                  if (pts.length < 6) {
                    var tx = li.textContent.replace(/\s+/g, ' ').trim();
                    if (tx.length > 4) pts.push({ label: esc(tx.slice(0, 78) + (tx.length > 78 ? '…' : '')), jump: h.id });
                  }
                });
              } else if (cur.tagName === 'P') {
                var ptx = cur.textContent.replace(/\s+/g, ' ').trim();
                if (ptx.length > 8) pts.push({ label: esc(ptx.slice(0, 78) + (ptx.length > 78 ? '…' : '')), jump: h.id });
              }
              cur = cur.nextElementSibling;
            }
          }
          branches.push({ title: '📖 ' + h.text, jump: h.id, kids: pts });
        });
        if (qaList.length) {
          branches.push({
            title: '🎯 本单元必考大题（' + qaList.length + ' 题）',
            jump: 'sec-exam-qa',
            kids: qaList.map(function (q, i) {
              return { label: '<b>Q' + (i + 1) + '.</b> ' + esc((q.qZh || q.qEn || '').slice(0, 66)), jump: 'qa-item-' + i };
            })
          });
        }

        modeSlot.innerHTML =
          '<div class="mm-wrap">' +
            '<div class="mm-bar">' +
              '<b style="font-size:14px;color:var(--navy-900)">🧠 本周知识思维导图（点击任意节点直达原文，点 −/+ 折叠分支）</b>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<button type="button" class="ed-btn ed-btn-sm" id="mmExpandAll">展开全部</button>' +
                '<button type="button" class="ed-btn ed-btn-sm" id="mmCollapseAll">折叠全部</button>' +
                '<button type="button" class="ed-btn ed-btn-sm ed-btn-primary" id="mmClose">返回精读</button>' +
              '</div>' +
            '</div>' +
            '<div class="mm-root">' + esc(course.nameCn + ' · ' + (week.title || ('Week ' + week.num))) + '</div>' +
            '<div class="mm-branches">' +
              branches.map(function (b, bi) {
                return '<div class="mm-branch">' +
                  '<div class="mm-node">' +
                    (b.kids.length ? '<button type="button" class="mm-tog" data-mm-tog="' + bi + '" title="展开/折叠">−</button>' : '') +
                    '<button type="button" class="mm-jump" data-jump="' + esc(b.jump) + '">' + esc(b.title) + '</button>' +
                  '</div>' +
                  (b.kids.length ? (
                    '<div class="mm-kids" id="mm-kids-' + bi + '">' +
                      b.kids.map(function (k) {
                        return '<div class="mm-leaf" data-jump="' + esc(k.jump) + '">' + k.label + '</div>';
                      }).join('') +
                    '</div>'
                  ) : '') +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>';

        modeSlot.querySelectorAll('[data-mm-tog]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var kids = document.getElementById('mm-kids-' + btn.getAttribute('data-mm-tog'));
            if (!kids) return;
            var collapsed = kids.classList.toggle('collapsed');
            btn.textContent = collapsed ? '+' : '−';
          });
        });
        var exAll = document.getElementById('mmExpandAll');
        var coAll = document.getElementById('mmCollapseAll');
        var mmClose = document.getElementById('mmClose');
        if (exAll) exAll.addEventListener('click', function () {
          modeSlot.querySelectorAll('.mm-kids').forEach(function (k) { k.classList.remove('collapsed'); });
          modeSlot.querySelectorAll('[data-mm-tog]').forEach(function (b) { b.textContent = '−'; });
        });
        if (coAll) coAll.addEventListener('click', function () {
          modeSlot.querySelectorAll('.mm-kids').forEach(function (k) { k.classList.add('collapsed'); });
          modeSlot.querySelectorAll('[data-mm-tog]').forEach(function (b) { b.textContent = '+'; });
        });
        if (mmClose) mmClose.addEventListener('click', function () { noteMode = 'full'; draw(); });
        modeSlot.querySelectorAll('[data-jump]').forEach(function (el) {
          el.addEventListener('click', function () { jumpToId(el.getAttribute('data-jump')); });
        });
      } else if (noteMode === 'cloze') {
        var allBlanks = Array.prototype.slice.call(
          app.querySelectorAll('#edBiConcepts .ed-cloze-blank, #edNoteBody strong, #edNoteBody .c-red')
        );
        allBlanks.forEach(function (el) {
          el.title = '点击翻开/隐藏考点词';
          el.addEventListener('click', function () { el.classList.toggle('revealed'); });
        });
        if (modeSlot) {
          modeSlot.innerHTML =
            '<div class="ed-mode-banner">' +
              '<span>🧠 <b>填空自测模式</b>：已精准遮盖本节 <b>' + allBlanks.length + '</b> 处专业术语与核心定义（英文遮英文术语、中文遮中文核心概念），点击任意浅蓝遮罩核对。</span>' +
              '<div style="display:flex;gap:6px">' +
                '<button type="button" class="ed-btn ed-btn-sm ed-btn-gold" id="edClozeRevealAll">👁️ 全部翻开</button>' +
                '<button type="button" class="ed-btn ed-btn-sm" id="edClozeHideAll">🙈 重新遮盖</button>' +
              '</div>' +
            '</div>';
          var rBtn = document.getElementById('edClozeRevealAll');
          var hBtn = document.getElementById('edClozeHideAll');
          if (rBtn) rBtn.addEventListener('click', function () { allBlanks.forEach(function (el) { el.classList.add('revealed'); }); });
          if (hBtn) hBtn.addEventListener('click', function () { allBlanks.forEach(function (el) { el.classList.remove('revealed'); }); });
        }
      } else if (noteMode === 'outline' && modeSlot) {
        var heads = noteBody ? extractHeadings(noteBody) : [];
        var tocGroups = [];
        if (biConcepts.length) {
          tocGroups.push(
            '<div style="margin-top:8px"><div style="font-size:12px;font-weight:700;color:var(--gold-deep);margin-bottom:5px">📌 核心概念（' + biConcepts.length + ' 条）</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px">' +
            biConcepts.map(function (c, idx) {
              return '<button type="button" data-jump="bi-item-' + idx + '" style="text-align:left;cursor:pointer;font-size:13px;padding:6px 10px;border-radius:7px;background:var(--surface-2);border:1px solid var(--line-2);color:var(--navy-900)">' + (idx + 1) + '. ' + esc(c.term) + '</button>';
            }).join('') + '</div></div>'
          );
        }
        if (heads.length) {
          tocGroups.push(
            '<div style="margin-top:10px"><div style="font-size:12px;font-weight:700;color:var(--navy-700);margin-bottom:5px">📖 笔记正文小节（' + heads.length + ' 节）</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px">' +
            heads.map(function (h, idx) {
              return '<button type="button" data-jump="' + h.id + '" style="text-align:left;cursor:pointer;font-size:13px;padding:6px 10px;border-radius:7px;background:var(--surface-2);border:1px solid var(--line-2);color:var(--navy-900)">' + (idx + 1) + '. ' + esc(h.text) + '</button>';
            }).join('') + '</div></div>'
          );
        }
        if (qaList.length) {
          tocGroups.push(
            '<div style="margin-top:10px"><div style="font-size:12px;font-weight:700;color:#8a4f16;margin-bottom:5px">🎯 本单元必考大题（' + qaList.length + ' 题）</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px">' +
            qaList.map(function (q, idx) {
              return '<button type="button" data-jump="qa-item-' + idx + '" style="text-align:left;cursor:pointer;font-size:13px;padding:6px 10px;border-radius:7px;background:#fdf8ec;border:1px solid var(--gold-border);color:var(--navy-900)">Q' + (idx + 1) + '. ' + esc((q.qZh || q.qEn || '').slice(0, 34)) + '</button>';
            }).join('') + '</div></div>'
          );
        }
        var totalItems = biConcepts.length + heads.length + qaList.length;
        modeSlot.innerHTML = '<div class="ed-card" style="margin-bottom:16px;border-left:4px solid var(--navy-800)">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
            '<b style="font-size:14.5px;color:var(--navy-900)">📑 本节知识点速览目录（共 ' + totalItems + ' 项 · 点击任意一条直达）</b>' +
            '<button type="button" class="ed-btn ed-btn-sm" id="edCloseToc">返回精读</button>' +
          '</div>' +
          (tocGroups.join('') || '<p style="font-size:13px;color:var(--muted);margin:8px 0 0">本节暂无二级目录项。</p>') +
        '</div>';
        var closeToc = document.getElementById('edCloseToc');
        if (closeToc) closeToc.addEventListener('click', function () { noteMode = 'full'; draw(); });
        modeSlot.querySelectorAll('[data-jump]').forEach(function (a) {
          a.addEventListener('click', function () { jumpToId(a.getAttribute('data-jump')); });
        });
      } else if (biMode === 'recall' && modeSlot) {
        modeSlot.innerHTML =
          '<div class="ed-mode-banner">' +
            '<span>🧠 <b>看中文背英文模式</b>：下方英文原句已温柔隐藏，先看中文自己口头复述英文，再点浅蓝卡片翻开核对。</span>' +
            '<div style="display:flex;gap:6px">' +
              '<button type="button" class="ed-btn ed-btn-sm ed-btn-gold" id="edRecallRevealAll">👁️ 全部翻开</button>' +
              '<button type="button" class="ed-btn ed-btn-sm" id="edRecallHideAll">🙈 全部遮盖</button>' +
            '</div>' +
          '</div>';
        var rAll = document.getElementById('edRecallRevealAll');
        var hAll = document.getElementById('edRecallHideAll');
        if (rAll) rAll.addEventListener('click', function () { app.querySelectorAll('.bi-en, .bi-add').forEach(function (el) { el.classList.add('revealed'); }); });
        if (hAll) hAll.addEventListener('click', function () { app.querySelectorAll('.bi-en, .bi-add').forEach(function (el) { el.classList.remove('revealed'); }); });
      }
      var tutBody = document.getElementById('edTutBody');
      if (tutBody) applyKatex(tutBody);

      /* 扫描全页图解（核心笔记 + 课后答案），生成顶部速览条并绑定点击放大灯箱 */
      var totalVis = wireVisuals(app, document.getElementById('sec-figs'));
      var badgeEl = document.getElementById('edFigCountBadge');
      if (badgeEl) badgeEl.textContent = String(totalVis);

      /* 重新着色本页所有已保存的 4 色高光 */
      if (window.LioraHighlighter && typeof window.LioraHighlighter.refresh === 'function') {
        window.LioraHighlighter.refresh();
      }
    }

    draw();
  }

  window.LioraViewsCourse = { renderCourse: renderCourse };
})();
