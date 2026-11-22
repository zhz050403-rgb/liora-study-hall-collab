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
    return '<a class="ed-course-card" href="' + esc(href) + '">' +
      '<div class="ed-course-art">' + window.LioraCovers.svgFor(c.id) + '</div>' +
      '<div class="ed-course-body">' +
        '<div class="ed-course-code">' + esc(c.shortCode || c.id) + '</div>' +
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

    var daily = (st.dailyFocus && st.dailyFocus.day === today && Array.isArray(st.dailyFocus.items) && st.dailyFocus.items.length)
      ? st.dailyFocus.items.slice()
      : [
          { id: 'd1', text: '精读本周 1 节主课笔记并完成对应 Tutorial', minutes: 30, done: false },
          { id: 'd2', text: '清空「全科错题本」今日待复习错题', minutes: 15, done: false },
          { id: 'd3', text: '英语工作台：精读定位 + 生词复习打卡', minutes: 20, done: false }
        ];

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
      var taskRows = daily.map(function (it, i) {
        return '<div class="ed-hero-task' + (it.done ? ' done' : '') + '">' +
          '<input type="checkbox" data-hchk="' + i + '"' + (it.done ? ' checked' : '') + '>' +
          '<span style="flex:1">' + esc(it.text) + '</span>' +
          '<small style="opacity:.75;white-space:nowrap">' + (it.minutes || 25) + 'm</small>' +
          '<button type="button" data-hdel="' + i + '" style="background:none;border:none;color:#cbd9eb;cursor:pointer;font-size:15px" title="移除">×</button>' +
        '</div>';
      }).join('');

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
        '<section class="ed-hero">' +
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
              '<a class="ed-btn" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.28)" href="#/handbooks">📚 五科通关手册</a>' +
              '<a class="ed-btn" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.28)" href="guide.html">📖 怎么学最提分</a>' +
            '</div>' +
          '</div>' +
          '<div class="ed-hero-card">' +
            '<div class="ed-hero-card-head"><span>✦ 今日首要焦点（最多 3 件）</span><span>' + esc(today) + '</span></div>' +
            taskRows +
            '<div style="display:flex;gap:6px;margin-top:10px">' +
              '<input id="edNewTask" placeholder="添加今日任务…" style="flex:1;height:32px;padding:0 10px;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.22);color:#fff;font-size:13px">' +
              '<button id="edAddTask" class="ed-btn ed-btn-gold ed-btn-sm">添加</button>' +
            '</div>' +
          '</div>' +
        '</section>' +

        '<div class="ed-section-head"><h2>我的 5 门核心课</h2><span class="sub">点任意课程直接进入「① 读笔记 → ② 练答案 → ③ 课件术语」三步学习台</span></div>' +
        '<div class="ed-course-grid">' + mainCourses.map(renderCourseCard).join('') + '</div>' +

        '<div class="ed-section-head"><h2>提分工具与近期考期</h2><span class="sub">错题遗忘曲线 · 术语闪卡 · 多科刷题 · 个人批注</span></div>' +
        '<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:18px" class="ed-home-lower">' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px">' +
            '<a class="ed-card" style="border-left:3.5px solid var(--gold);text-decoration:none" href="#/handbooks"><b style="color:var(--navy-900)">📚 五科通关手册</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">考核规则、公式卡、Excel 函数与避坑表</div></a>' +
            '<a class="ed-card" style="border-left:3.5px solid var(--gold);text-decoration:none" href="#/mistakes"><b style="color:var(--navy-900)">🔁 全科错题本 ' + (dueMistakes ? '<span class="ed-badge ed-badge-red">' + dueMistakes + '待复习</span>' : '') + '</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">1/3/7/14 天遗忘曲线自动推回重刷</div></a>' +
            '<a class="ed-card" style="border-left:3.5px solid var(--gold);text-decoration:none" href="#/flashcards"><b style="color:var(--navy-900)">🃏 中英术语闪卡</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">' + (idx.glossaryCount || 112) + ' 条全英文核心术语速背</div></a>' +
            '<a class="ed-card" style="border-left:3.5px solid var(--gold);text-decoration:none" href="#/exam-packs"><b style="color:var(--navy-900)">🎯 多科闭卷刷题</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">五科高频题 + 会计 U1–6 官方原题库</div></a>' +
            '<a class="ed-card" style="border-left:3.5px solid var(--gold);text-decoration:none" href="#/annotations"><b style="color:var(--navy-900)">🖍️ 我的批注集 (' + ((st.annotations || []).length) + ')</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">笔记划词高亮与考前个人批注打印</div></a>' +
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

      app.querySelectorAll('[data-hchk]').forEach(function (chk) {
        chk.addEventListener('change', async function () {
          daily[Number(chk.getAttribute('data-hchk'))].done = chk.checked;
          draw();
          await api.saveFocus({ action: 'set_daily', items: daily });
        });
      });
      app.querySelectorAll('[data-hdel]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          daily.splice(Number(btn.getAttribute('data-hdel')), 1);
          draw();
          await api.saveFocus({ action: 'set_daily', items: daily });
        });
      });
      var addBtn = document.getElementById('edAddTask');
      if (addBtn) addBtn.addEventListener('click', async function () {
        var txt = (document.getElementById('edNewTask').value || '').trim();
        if (!txt) return;
        if (daily.length >= 6) { api.toast('今日焦点最多保留 6 条'); return; }
        daily.push({ id: 'd' + Date.now(), text: txt, minutes: 25, done: false });
        draw();
        await api.saveFocus({ action: 'set_daily', items: daily });
      });
    }
    draw();
  }

  async function renderCourses(app) {
    var idx = await window.LioraStore.loadIndex();
    var mainCourses = (idx.courses || []).filter(function (c) { return !c.extra; });
    app.innerHTML = '<div class="ed-container">' +
      '<div class="ed-section-head" style="margin-top:4px"><h2>课程中心 · UNSW 2026 五门核心课</h2><span class="sub">按需加载 · 每课自带 3 步学习流</span></div>' +
      '<div class="ed-course-grid">' + mainCourses.map(renderCourseCard).join('') + '</div>' +
    '</div>';
  }

  async function renderExtra(app) {
    var idx = await window.LioraStore.loadIndex();
    var extra = (idx.courses || []).find(function (c) { return c.extra; });
    if (!extra) {
      app.innerHTML = '<div class="ed-container"><div class="ed-card">课外拓展模块仅管理员账号可见。</div></div>';
      return;
    }
    var term = extra.terms[0];
    var cards = (term && term.weeks || []).map(function (w) {
      var done = window.LioraStore.isWeekDone(extra.id, term.id, w.num);
      return '<a class="ed-card" style="text-decoration:none;border-left:3.5px solid ' + (done ? 'var(--green)' : 'var(--gold)') + '" href="#/c/' + extra.id + '/' + term.id + '/' + w.num + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
          '<span class="ed-badge ed-badge-gold">Module ' + w.num + '</span>' +
          (done ? '<span class="ed-badge ed-badge-green">已完成</span>' : '') +
        '</div>' +
        '<div style="font-family:var(--serif);font-size:15.5px;font-weight:700;color:var(--navy-900);margin-bottom:4px">' + esc(w.title) + '</div>' +
        '<div style="font-size:12.5px;color:var(--muted)">' + (w.taskCount || 0) + ' 项任务 · 点击进入模块学习 →</div>' +
      '</a>';
    }).join('');

    app.innerHTML = '<div class="ed-container">' +
      '<div class="ed-hero" style="grid-template-columns:1fr;padding:22px 26px">' +
        '<div><div class="ed-hero-kicker">EXTRACURRICULAR · 课外拓展</div>' +
        '<h1>' + esc(extra.nameCn) + '</h1>' +
        '<p style="margin-bottom:0">' + esc(extra.name) + ' · 共 ' + (term ? term.weeks.length : 0) + ' 个专题模块。</p></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:20px">' + cards + '</div>' +
    '</div>';
  }

  window.LioraViewsHome = { renderHome: renderHome, renderCourses: renderCourses, renderExtra: renderExtra };
})();
