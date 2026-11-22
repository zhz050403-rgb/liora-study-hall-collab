/* 紧凑双栏 3 步课程学习室（彻底消灭中间大空隙、单标题、清晰三步学习流、划词批注、KaTeX 公式） */
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
        throwOnError: false
      });
    } catch (e) {}
  }

  /* 提取本节小标题，供「知识点速览」与页内目录使用 */
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

    var activeStep = 'notes'; // notes | practice | resources
    var noteMode = 'full';    // full | cloze | outline
    var api = window.LioraStudyApi;
    var st = await api.loadStudy();

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
        return '<button class="ed-week-btn' + (isCur ? ' active' : '') + (isDone ? ' done' : '') + '" data-goto="#/c/' + esc(course.id) + '/' + esc(term.id) + '/' + w.num + '">' +
          '<span class="ed-week-num">' + (isDone ? '✓' : 'W' + w.num) + '</span>' +
          '<span>' + esc((w.title || ('Week ' + w.num)).replace(/^Week\s*\d+\s*[·\-—]?\s*/i, '')) + '</span>' +
        '</button>';
      }).join('');

      var bodyHtml = '';
      if (activeStep === 'notes') {
        var rawHtml = cleanNoteHtml(week.graphicHtml || week.notesHtml);
        bodyHtml =
          '<div class="ed-guide-bar">' +
            '<span>💡 <b>怎么读：</b>先看蓝/金框核心概念，遇到例题先自己算再点「看解答」；鼠标<b>划选任意文字</b>即可高亮或写批注。</span>' +
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
          '<div id="edNoteBody" class="ed-prose' + (noteMode === 'cloze' ? ' cloze-on' : '') + '">' + rawHtml + '</div>';
      } else if (activeStep === 'practice') {
        var tasks = week.tasks || [];
        var tasksHtml = tasks.length ? tasks.map(function (t, i) {
          var tKey = course.id + ':' + term.id + ':' + week.num + ':t' + i;
          var tDone = window.LioraStore.isTaskDone(tKey);
          var txt = typeof t === 'string' ? t : (t.text || t.title || '');
          return '<label style="display:flex;align-items:flex-start;gap:10px;padding:9px 10px;border-bottom:1px solid var(--line-2);cursor:pointer">' +
            '<input type="checkbox" data-task-key="' + esc(tKey) + '"' + (tDone ? ' checked' : '') + ' style="width:17px;height:17px;margin-top:2px;accent-color:var(--navy-800)">' +
            '<span style="flex:1;' + (tDone ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(txt) + '</span>' +
          '</label>';
        }).join('') : '<p style="color:var(--muted);font-size:13.5px">本周暂无额外打卡任务。</p>';

        var tutHtml = week.tutorialAnswers
          ? (typeof week.tutorialAnswers === 'string' ? week.tutorialAnswers : JSON.stringify(week.tutorialAnswers))
          : '<p style="color:var(--muted)">本周暂无独立课后答案，可去「多科刷题」或让右下角 AI 伴学讲解。</p>';

        bodyHtml =
          '<div class="ed-guide-bar">' +
            '<span>💡 <b>怎么练：</b>先勾完本周任务，合上答案独立做题，有错题立刻点右侧按钮收入遗忘曲线错题本。</span>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
              '<a class="ed-btn ed-btn-sm ed-btn-gold" href="#/mistakes">➕ 记入错题本</a>' +
              '<a class="ed-btn ed-btn-sm ed-btn-primary" href="#/exam-packs">🎯 去做本课闭卷刷题</a>' +
            '</div>' +
          '</div>' +
          '<div class="ed-card" style="margin-bottom:16px"><h3 style="margin:0 0 8px;font-family:var(--serif);font-size:16px;color:var(--navy-900)">✅ 本周学习任务清单</h3>' + tasksHtml + '</div>' +
          '<div class="ed-card"><h3 style="margin:0 0 10px;font-family:var(--serif);font-size:16px;color:var(--navy-900)">📝 课后作业参考解析与核对</h3><div class="ed-prose" id="edTutBody">' + tutHtml + '</div></div>';
      } else {
        var onlinePdfs = week.onlineSources || [];
        var gloss = week.glossary || [];
        var offlineFiles = week.files || [];
        bodyHtml =
          '<div class="ed-card" style="margin-bottom:14px">' +
            '<h3 style="margin:0 0 10px;font-family:var(--serif);font-size:16px;color:var(--navy-900)">📄 本周可在线直达原件（站内已核验 PDF）</h3>' +
            (onlinePdfs.length
              ? '<div style="display:flex;flex-wrap:wrap;gap:8px">' + onlinePdfs.map(function (f) {
                  return '<a class="ed-btn ed-btn-sm ed-btn-primary" target="_blank" rel="noopener" href="' + esc(f.path) + '">📎 ' + esc(f.name) + ' ↗</a>';
                }).join('') + '</div>'
              : '<p style="font-size:13.5px;color:var(--muted);margin:0">本周暂无单独上传的 PDF 原件，完整知识点与例题已整理在「① 读核心笔记」中。</p>') +
          '</div>' +
          '<div class="ed-card" style="margin-bottom:14px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
              '<h3 style="margin:0;font-family:var(--serif);font-size:16px;color:var(--navy-900)">🃏 本周核心中英术语（' + gloss.length + ' 条）</h3>' +
              '<a class="ed-btn ed-btn-sm ed-btn-gold" href="#/flashcards">去闪卡模式速背 →</a>' +
            '</div>' +
            (gloss.length
              ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">' + gloss.map(function (g) {
                  return '<div style="padding:10px 12px;border-radius:9px;background:var(--surface-2);border:1px solid var(--line-2)">' +
                    '<div style="font-weight:700;color:var(--navy-900);font-size:13.5px">' + esc(g.term) + '</div>' +
                    '<div style="color:var(--gold-deep);font-size:13px;font-weight:600;margin:2px 0">' + esc(g.zh) + '</div>' +
                    '<div style="font-size:12.5px;color:var(--ink-2)">' + esc(g.def) + '</div>' +
                  '</div>';
                }).join('') + '</div>'
              : '<p style="font-size:13.5px;color:var(--muted);margin:0">全科 112 条中英核心术语均可直接在「术语闪卡」按学科集中复习。</p>') +
          '</div>' +
          '<div class="ed-card" style="margin-bottom:14px">' +
            '<h3 style="margin:0 0 10px;font-family:var(--serif);font-size:16px;color:var(--navy-900)">🎬 配套视频与考前通关手册</h3>' +
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
          ) : '');
      }

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
                '<button id="edToggleDone" class="ed-btn ed-btn-sm ' + (weekDone ? 'ed-btn-primary' : '') + '">' + (weekDone ? '✓ 已学完本周' : '○ 标记本周学完') + '</button>' +
                '<button id="edAddNoteBtn" class="ed-btn ed-btn-sm ed-btn-gold">🖍️ 记批注</button>' +
              '</div>' +
            '</div>' +
            '<div class="ed-step-tabs">' +
              '<button class="ed-step-tab' + (activeStep === 'notes' ? ' active' : '') + '" data-step="notes">① 读核心笔记</button>' +
              '<button class="ed-step-tab' + (activeStep === 'practice' ? ' active' : '') + '" data-step="practice">② 做练习与对答案</button>' +
              '<button class="ed-step-tab' + (activeStep === 'resources' ? ' active' : '') + '" data-step="resources">③ 课件、术语与视频</button>' +
            '</div>' +
            bodyHtml +
          '</section>' +
        '</div>' +
      '</div>';

      /* 事件绑定 */
      app.querySelectorAll('[data-goto]').forEach(function (b) {
        b.addEventListener('click', function () { location.hash = b.getAttribute('data-goto'); });
      });
      app.querySelectorAll('[data-step]').forEach(function (b) {
        b.addEventListener('click', function () { activeStep = b.getAttribute('data-step'); draw(); });
      });
      app.querySelectorAll('[data-nm]').forEach(function (b) {
        b.addEventListener('click', function () { noteMode = b.getAttribute('data-nm'); draw(); });
      });

      var doneBtn = document.getElementById('edToggleDone');
      if (doneBtn) doneBtn.addEventListener('click', function () {
        var nowDone = window.LioraStore.toggleWeekDone(course.id, term.id, week.num);
        api.toast(nowDone ? '已标记学完本周！' : '已取消完成标记');
        draw();
      });

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
    }

    draw();
  }

  window.LioraViewsCourse = { renderCourse: renderCourse };
})();
