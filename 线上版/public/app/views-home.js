/* 首页驾驶舱 / 课程中心 / 课外拓展（零破图、锐利无切边 Hero、定制 SVG 课程卡） */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function todayStr() {
    return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
  }
  function diffDays(a, b) {
    return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
  }

  function renderCourseCard(c) {
    var p = window.LioraStore.courseProgress(c);
    var firstTerm = (c.terms && c.terms[0]) ? c.terms[0] : null;
    var firstWeek = (firstTerm && firstTerm.weeks && firstTerm.weeks[0]) ? firstTerm.weeks[0].num : 1;
    var href = firstTerm ? ('#/c/' + c.id + '/' + firstTerm.id + '/' + firstWeek) : ('#/c/' + c.id);
    var figCount = Number(c.diagramCount) || 0;
    return '<a class="ed-course-card" href="' + esc(href) + '">' +
      '<div class="ed-course-art">' + window.LioraCovers.svgFor(c.id) + '</div>' +
      '<div class="ed-course-body">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px">' +
          '<div class="ed-course-code">' + esc(c.shortCode || c.id) + '</div>' +
          (figCount ? '<span class="ed-badge ed-badge-gold" style="font-size:11px;padding:1px 7px">📊 ' + figCount + ' 张图解</span>' : '') +
        '</div>' +
        '<div class="ed-course-title">' + esc(c.nameCn) + '</div>' +
        '<div class="ed-course-en">' + esc(c.name) + '</div>' +
        '<div class="ed-prog-bar"><i style="width:' + p.pct + '%"></i></div>' +
        '<div class="ed-prog-meta"><span>已完成 ' + p.done + '/' + p.total + ' 周</span><span>' + p.pct + '%</span></div>' +
      '</div>' +
    '</a>';
  }

  async function renderHome(app) {
    var idx = await window.LioraStore.loadIndex();
    var api = window.LioraStudyApi;
    var st = await api.loadStudy();
    var today = todayStr();

    var hasSavedToday = !!(st.dailyFocus && st.dailyFocus.day === today && Array.isArray(st.dailyFocus.items));
    var daily = hasSavedToday
      ? st.dailyFocus.items.slice()
      : [
          { id: 'd1', text: '精读本周 1 节主课笔记并完成对应 Tutorial', minutes: 30, done: false },
          { id: 'd2', text: '清空「全科错题本」今日待复习错题', minutes: 15, done: false },
          { id: 'd3', text: '英语工作台：精读定位 + 生词复习打卡', minutes: 20, done: false }
        ];
    var editingIdx = -1;

    var now = Date.now();
    var dueMistakes = (st.mistakes || []).filter(function (m) { return !m.mastered && (!m.nextReviewAt || m.nextReviewAt <= now); }).length;
    var focusMins = (st.focusSessions || []).filter(function (f) { return f.day === today; }).reduce(function (a, b) { return a + (Number(b.minutes) || 0); }, 0);
    var last = window.LioraStore.getLastVisit();

    var curWeek = 0;
    var exams = (window.STUDY_PLAN && Array.isArray(window.STUDY_PLAN.exams)) ? window.STUDY_PLAN.exams : [];
    if (window.STUDY_PLAN && window.STUDY_PLAN.anchor && window.STUDY_PLAN.anchor.term1Start) {
      var ds = diffDays(window.STUDY_PLAN.anchor.term1Start, today);
      if (ds >= 0) curWeek = Math.floor(ds / 7) + 1;
    }
    var upcoming = exams
      .filter(function (e) { return !e.done && e.date && diffDays(today, e.date) >= -6; })
      .sort(function (a, b) { return a.date.localeCompare(b.date); })
      .slice(0, 4);

    var mainCourses = (idx.courses || []).filter(function (c) { return !c.extra; });

    function draw() {
      var taskRows = daily.length ? daily.map(function (it, i) {
        if (editingIdx === i) {
          return '<div class="ed-hero-task">' +
            '<div class="ed-task-edit-row">' +
              '<input id="edEditTaskTxt" class="ed-task-edit-inp" value="' + esc(it.text) + '" placeholder="输入任务内容…">' +
              '<input id="edEditTaskMin" class="ed-task-min-inp" type="number" min="5" max="240" value="' + (Number(it.minutes) || 25) + '" title="预计分钟数">' +
              '<span style="font-size:11.5px;opacity:.75">m</span>' +
              '<button type="button" class="ed-btn ed-btn-gold ed-btn-sm" data-hsave="' + i + '" style="min-height:26px;padding:2px 8px;font-size:12px">保存</button>' +
              '<button type="button" class="ed-task-icon-btn" data-hcancel title="取消">✕</button>' +
            '</div>' +
          '</div>';
        }
        return '<div class="ed-hero-task' + (it.done ? ' done' : '') + '">' +
          '<input type="checkbox" data-hchk="' + i + '"' + (it.done ? ' checked' : '') + '>' +
          '<span class="ed-task-txt" data-hedit="' + i + '" title="点击编辑任务">' + esc(it.text) + '</span>' +
          '<small style="opacity:.78;white-space:nowrap">' + (Number(it.minutes) || 25) + 'm</small>' +
          '<button type="button" class="ed-task-icon-btn" data-hedit="' + i + '" title="编辑这条任务">✎</button>' +
          '<button type="button" class="ed-task-icon-btn" data-hdel="' + i + '" title="移除">×</button>' +
        '</div>';
      }).join('') : '<div style="padding:10px 4px;font-size:13px;color:rgba(240,245,251,.72);text-align:center">今日任务已清空，在下方添加一条新任务吧 ✨</div>';

      var examRows = upcoming.map(function (e) {
        var d = diffDays(today, e.date);
        var cls = d <= 14 ? 'ed-badge-red' : 'ed-badge-gold';
        var tag = d < 0 ? '本周进行中' : (d === 0 ? '今天' : ('剩 ' + d + ' 天'));
        return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed var(--line-2);font-size:13.5px">' +
          '<div><b>' + esc(e.subj) + '</b> · ' + esc(e.name) + ' <span style="color:var(--muted);font-size:12px">(' + esc(e.weight) + ')</span></div>' +
          '<span class="ed-badge ' + cls + '">' + tag + '</span>' +
        '</div>';
      }).join('') || '<p style="color:var(--muted);font-size:13.5px;margin:0">近期无紧迫考核，按周节奏稳步推进即可。</p>';

      app.innerHTML = '<div class="ed-container">' +
        '<section class="ed-hero ed-hero-art ed-hero-art-home">' +
          '<div>' +
            '<div class="ed-hero-kicker">UNSW FOUNDATION 2026 · PRIVATE STUDY HALL</div>' +
            '<h1>欢迎回到 Liora 的学习小屋</h1>' +
            '<p>' + (curWeek ? '当前推算 <b>Term 1 · Week ' + curWeek + '</b> · ' : '') +
              '今日已专注 <b>' + focusMins + ' 分钟</b>' +
              (dueMistakes ? ' · 今日待复习错题 <b>' + dueMistakes + ' 题</b>' : ' · 错题已清零') +
              '。选好今天最重要的一件事，直接开始。</p>' +
            '<div class="ed-hero-actions">' +
              (last ? '<a class="ed-btn ed-btn-gold" href="' + esc(last.hash) + '">▶ 继续上次：' + esc(last.title.slice(0, 20)) + '</a>'
                    : '<a class="ed-btn ed-btn-gold" href="#/c/accounting/term1/1">▶ 开始学习第 1 课</a>') +
              '<a class="ed-btn" style="background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.32)" href="#/handbooks">📚 五科通关手册</a>' +
              '<a class="ed-btn" style="background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.32)" href="guide.html">📖 怎么学最提分</a>' +
            '</div>' +
          '</div>' +
          '<div class="ed-hero-card">' +
            '<div class="ed-hero-card-head"><span>✦ 今日首要焦点（点 ✎ 可编辑）</span><span>' + esc(today) + '</span></div>' +
            taskRows +
            '<div style="display:flex;gap:6px;margin-top:10px;align-items:center">' +
              '<input id="edNewTask" placeholder="添加今日任务（回车添加）…" style="flex:1;min-width:0;height:32px;padding:0 10px;border-radius:8px;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.28);color:#fff;font-size:13px">' +
              '<input id="edNewTaskMin" class="ed-task-min-inp" type="number" min="5" max="240" value="25" title="预计分钟数" style="height:32px">' +
              '<button id="edAddTask" class="ed-btn ed-btn-gold ed-btn-sm">添加</button>' +
            '</div>' +
          '</div>' +
        '</section>' +

        '<div class="ed-section-head"><h2>我的 5 门核心课</h2><span class="sub">点任意课程直接进入「图解速览 → 核心笔记 → 练习解析 → 课件术语」一条龙学习台</span></div>' +
        '<div class="ed-course-grid">' + mainCourses.map(renderCourseCard).join('') + '</div>' +

        '<div class="ed-section-head"><h2>提分工具与近期考期</h2><span class="sub">错题遗忘曲线 · 术语闪卡 · 多科刷题 · 4 色高光集</span></div>' +
        '<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:18px" class="ed-home-lower">' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px">' +
            '<a class="ed-card" style="border-left:3.5px solid var(--gold);text-decoration:none" href="#/handbooks"><b style="color:var(--navy-900)">📚 五科通关手册</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">考核规则、公式卡、Excel 函数与避坑表</div></a>' +
            '<a class="ed-card" style="border-left:3.5px solid var(--gold);text-decoration:none" href="#/mistakes"><b style="color:var(--navy-900)">🔁 全科错题本 ' + (dueMistakes ? '<span class="ed-badge ed-badge-red">' + dueMistakes + '待复习</span>' : '') + '</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">1/3/7/14 天遗忘曲线自动推回重刷</div></a>' +
            '<a class="ed-card" style="border-left:3.5px solid var(--gold);text-decoration:none" href="#/flashcards"><b style="color:var(--navy-900)">🃏 中英术语闪卡</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">' + (idx.glossaryCount || 112) + ' 条全英文核心术语速背</div></a>' +
            '<a class="ed-card" style="border-left:3.5px solid var(--gold);text-decoration:none" href="#/exam-packs"><b style="color:var(--navy-900)">🎯 多科闭卷刷题</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">五科高频题 + 会计 U1–6 官方原题库</div></a>' +
            '<a class="ed-card" style="border-left:3.5px solid var(--gold);text-decoration:none" href="#/annotations"><b style="color:var(--navy-900)">🖍️ 我的高光集 (' + ((st.annotations || []).length) + ')</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">全站 4 色荧光笔高光与个人批注汇总</div></a>' +
            '<a class="ed-card" style="border-left:3.5px solid var(--gold);text-decoration:none" href="bilingual-video.html"><b style="color:var(--navy-900)">🎬 五科中英视频</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">会计 / 经济 / 数学 / 计算机 / 英语全覆盖</div></a>' +
          '</div>' +
          '<div class="ed-card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="font-family:var(--serif);font-size:16px;color:var(--navy-900)">📅 近期考试倒计时</b><a href="#/prep" style="font-size:12.5px">完整周计划 →</a></div>' +
            examRows +
            '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
              '<a class="ed-btn ed-btn-sm" href="#/profile">📊 成绩与学习档案</a>' +
              '<a class="ed-btn ed-btn-sm" href="english/index.html">🇬🇧 英语工作台</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

      async function persistDaily() {
        await api.saveFocus({ action: 'set_daily', items: daily }).catch(function () {});
      }

      app.querySelectorAll('[data-hchk]').forEach(function (chk) {
        chk.addEventListener('change', async function () {
          daily[Number(chk.getAttribute('data-hchk'))].done = chk.checked;
          draw();
          await persistDaily();
        });
      });
      app.querySelectorAll('[data-hedit]').forEach(function (el) {
        el.addEventListener('click', function () {
          editingIdx = Number(el.getAttribute('data-hedit'));
          draw();
          var inp = document.getElementById('edEditTaskTxt');
          if (inp) { inp.focus(); inp.select(); }
        });
      });
      async function saveEdit(idxToSave) {
        var inp = document.getElementById('edEditTaskTxt');
        var minInp = document.getElementById('edEditTaskMin');
        var txt = inp ? inp.value.trim() : '';
        var mins = Math.max(5, Math.min(240, Number(minInp && minInp.value) || 25));
        if (!txt) { api.toast('任务内容不能为空'); return; }
        daily[idxToSave].text = txt;
        daily[idxToSave].minutes = mins;
        editingIdx = -1;
        draw();
        await persistDaily();
        api.toast('已更新今日任务并同步云端');
      }
      var saveBtn = app.querySelector('[data-hsave]');
      if (saveBtn) {
        var sIdx = Number(saveBtn.getAttribute('data-hsave'));
        saveBtn.addEventListener('click', function () { saveEdit(sIdx); });
        var editInp = document.getElementById('edEditTaskTxt');
        var editMin = document.getElementById('edEditTaskMin');
        [editInp, editMin].forEach(function (el) {
          if (!el) return;
          el.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') { ev.preventDefault(); saveEdit(sIdx); }
            else if (ev.key === 'Escape') { editingIdx = -1; draw(); }
          });
        });
      }
      var cancelBtn = app.querySelector('[data-hcancel]');
      if (cancelBtn) cancelBtn.addEventListener('click', function () { editingIdx = -1; draw(); });

      app.querySelectorAll('[data-hdel]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var delIdx = Number(btn.getAttribute('data-hdel'));
          daily.splice(delIdx, 1);
          if (editingIdx === delIdx) editingIdx = -1;
          draw();
          await persistDaily();
        });
      });

      async function doAddTask() {
        var inp = document.getElementById('edNewTask');
        var minInp = document.getElementById('edNewTaskMin');
        var txt = (inp && inp.value || '').trim();
        if (!txt) return;
        if (daily.length >= 6) { api.toast('今日焦点最多保留 6 条'); return; }
        var mins = Math.max(5, Math.min(240, Number(minInp && minInp.value) || 25));
        daily.push({ id: 'd' + Date.now(), text: txt, minutes: mins, done: false });
        editingIdx = -1;
        draw();
        await persistDaily();
        api.toast('已添加今日任务');
      }
      var addBtn = document.getElementById('edAddTask');
      if (addBtn) addBtn.addEventListener('click', doAddTask);
      var newInp = document.getElementById('edNewTask');
      if (newInp) newInp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); doAddTask(); }
      });
    }
    draw();
  }

  async function renderCourses(app) {
    var idx = await window.LioraStore.loadIndex();
    var mainCourses = (idx.courses || []).filter(function (c) { return !c.extra; });
    app.innerHTML = '<div class="ed-container">' +
      '<section class="ed-hero ed-hero-art ed-hero-art-courses" style="grid-template-columns:1fr;padding:24px 28px;margin-bottom:20px">' +
        '<div>' +
          '<div class="ed-hero-kicker">UNSW FOUNDATION 2026 · CORE CURRICULUM</div>' +
          '<h1>课程中心 · 五门核心课</h1>' +
          '<p style="margin-bottom:0">全科 107 周 100% 配齐高清图解、中英逐行核心概念与本单元必考大题 · 点进任意课程一条龙自然学完。</p>' +
        '</div>' +
      '</section>' +
      '<div class="ed-course-grid">' + mainCourses.map(renderCourseCard).join('') + '</div>' +
    '</div>';
  }

  async function renderExtra(app) {
    var idx = await window.LioraStore.loadIndex();
    var extra = (idx.courses || []).find(function (c) { return c.extra; });
    if (!extra) {
      app.innerHTML = '<div class="ed-container"><div class="ed-card">🔒 课外拓展（企业法律与财富管理）需要管理员授权开通。如需阅读，请联系管理员开通对应权限。<br><br><a class="ed-btn ed-btn-sm ed-btn-primary" href="#/">返回首页</a></div></div>';
      return;
    }
    var term = extra.terms[0];
    var cards = (term && term.weeks || []).map(function (w) {
      var done = window.LioraStore.isWeekDone(extra.id, term.id, w.num);
      var figs = Number(w.diagramCount) || 0;
      return '<a class="ed-card" style="text-decoration:none;border-left:3.5px solid ' + (done ? 'var(--green)' : 'var(--gold)') + '" href="#/c/' + extra.id + '/' + term.id + '/' + w.num + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:6px">' +
          '<span class="ed-badge ed-badge-gold">Module ' + w.num + '</span>' +
          (figs ? '<span class="ed-badge" style="background:var(--navy-050);color:var(--navy-800)">📊 ' + figs + ' 张图解</span>' : '') +
          (done ? '<span class="ed-badge ed-badge-green">已完成</span>' : '') +
        '</div>' +
        '<div style="font-family:var(--serif);font-size:15.5px;font-weight:700;color:var(--navy-900);margin-bottom:4px">' + esc(w.title) + '</div>' +
        '<div style="font-size:12.5px;color:var(--muted)">' + (w.taskCount || 0) + ' 项任务 · 点击进入模块学习 →</div>' +
      '</a>';
    }).join('');

    app.innerHTML = '<div class="ed-container">' +
      '<div class="ed-hero ed-hero-art ed-hero-art-extra" style="grid-template-columns:1fr;padding:24px 28px">' +
        '<div><div class="ed-hero-kicker">EXTRACURRICULAR · 课外拓展</div>' +
        '<h1>' + esc(extra.nameCn) + '</h1>' +
        '<p style="margin-bottom:0">' + esc(extra.name) + ' · 共 ' + (term ? term.weeks.length : 0) + ' 个专题模块。</p></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:20px">' + cards + '</div>' +
    '</div>';
  }

  window.LioraViewsHome = { renderHome: renderHome, renderCourses: renderCourses, renderExtra: renderExtra };
})();
