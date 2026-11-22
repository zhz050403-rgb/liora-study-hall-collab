/* Liora 个人学习中心 · 主控制器
   职责：
   1) 个人模式降噪（收纳散落浮标为右下角唯一工具条）
   2) 首页「今日学习驾驶舱」（今日 3 件事 + 实时考试倒计时 + 上次续学 + 6 大核心入口）
   3) 课程周页增强（站内真实 PDF 直达 + 本周中英术语卡 + 划词高亮/批注保存与展示）
   4) 路由挂载：#/handbooks、#/mistakes、#/flashcards、#/exam-packs、#/annotations
   5) 统一收纳工具条：番茄钟 + 专注模式 + 字号切换 + 统一 AI 伴学（含批改一键入档）+ 一键备份恢复 */
(function () {
  'use strict';

  var boot = window.__CLOUD_BOOT__ || {};
  if (boot.personalMode !== false) {
    document.body.classList.add('lh-personal-mode');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function todayStr() {
    var d = new Date(Date.now() + 8 * 3600000);
    return d.toISOString().slice(0, 10);
  }

  function diffDays(a, b) {
    return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
  }

  /* ---------- 1. 记录上次学习位置（供首页「一键续学」） ---------- */
  function rememberCourseVisit() {
    var h = location.hash || '#/';
    if (/^#\/c\/[^/]+\/[^/]+\/\d+/.test(h)) {
      var h1 = document.querySelector('#app h1, #app .wp-title, #app h2');
      var title = (h1 && h1.textContent.trim()) || h;
      try {
        localStorage.setItem('liora-last-visit', JSON.stringify({ hash: h, title: title.slice(0, 80), at: Date.now() }));
      } catch (e) {}
    }
  }

  /* ---------- 2. 首页「今日学习驾驶舱」 ---------- */
  async function mountHomeCockpit() {
    var hash = location.hash || '#/';
    if (hash !== '#/' && hash !== '#' && hash !== '') return;
    var app = document.getElementById('app');
    if (!app || document.getElementById('lh-cockpit-root')) return;

    var api = window.LioraStudyApi;
    var st = await api.loadStudy();
    var today = todayStr();
    var daily = (st.dailyFocus && st.dailyFocus.day === today && Array.isArray(st.dailyFocus.items))
      ? st.dailyFocus.items.slice()
      : [
          { id: 'd1', text: '预习/复盘本周主课笔记并勾选任务', minutes: 25, done: false },
          { id: 'd2', text: '清零「全科错题本」今日待复习错题', minutes: 15, done: false },
          { id: 'd3', text: '英语工作台：精读定位 + 生词复习打卡', minutes: 20, done: false }
        ];

    var now = Date.now();
    var dueMistakes = (st.mistakes || []).filter(function (m) { return !m.mastered && (!m.nextReviewAt || m.nextReviewAt <= now); }).length;
    var focusMinsToday = (st.focusSessions || []).filter(function (f) { return f.day === today; }).reduce(function (a, b) { return a + (Number(b.minutes) || 0); }, 0);

    var lastVisit = null;
    try { lastVisit = JSON.parse(localStorage.getItem('liora-last-visit') || 'null'); } catch (e) {}

    /* 实时考试倒计时（取最近 4 场未结束考核） */
    var exams = (window.STUDY_PLAN && Array.isArray(window.STUDY_PLAN.exams)) ? window.STUDY_PLAN.exams : [];
    var upcoming = exams
      .filter(function (e) { return !e.done && e.date && diffDays(today, e.date) >= -6; })
      .sort(function (a, b) { return a.date.localeCompare(b.date); })
      .slice(0, 4);

    var curWeek = 0;
    if (window.STUDY_PLAN && window.STUDY_PLAN.anchor && window.STUDY_PLAN.anchor.term1Start) {
      var ds = diffDays(window.STUDY_PLAN.anchor.term1Start, today);
      if (ds >= 0) curWeek = Math.floor(ds / 7) + 1;
    }

    var root = document.createElement('section');
    root.id = 'lh-cockpit-root';
    root.className = 'lh-cockpit';

    function drawCockpit() {
      var listHtml = daily.map(function (it, i) {
        return '<div class="lh-focus-item' + (it.done ? ' done' : '') + '">' +
          '<input type="checkbox" data-df-chk="' + i + '"' + (it.done ? ' checked' : '') + '>' +
          '<span class="txt">' + esc(it.text) + '</span>' +
          '<span class="mins">' + (it.minutes || 25) + ' 分钟</span>' +
          '<button class="lh-btn lh-btn-sm" data-df-del="' + i + '" title="移除">×</button>' +
        '</div>';
      }).join('');

      var examHtml = upcoming.length ? upcoming.map(function (e) {
        var d = diffDays(today, e.date);
        var cls = d <= 14 ? 'lh-badge-red' : 'lh-badge-gold';
        var tag = d < 0 ? '本周进行中' : (d === 0 ? '今天' : ('剩 ' + d + ' 天'));
        return '<div class="lh-exam-row">' +
          '<div><b>' + esc(e.subj) + '</b> · ' + esc(e.name) + ' <span style="color:var(--lh-muted);font-size:12px">(' + esc(e.weight) + ')</span></div>' +
          '<span class="lh-badge ' + cls + '">' + tag + '</span>' +
        '</div>';
      }).join('') : '<p style="color:var(--lh-muted);font-size:13.5px">近期无紧迫考核，按周计划稳步推进即可。</p>';

      root.innerHTML =
        '<div class="lh-cockpit-grid">' +
          '<div class="lh-panel lh-panel-accent">' +
            '<div class="lh-panel-head">' +
              '<h2 class="lh-panel-title">✦ 今日首要焦点（最多 3 件）</h2>' +
              '<span class="lh-badge lh-badge-green">今日已专注 ' + focusMinsToday + ' 分钟</span>' +
            '</div>' +
            '<div class="lh-focus-list">' + listHtml + '</div>' +
            '<div class="lh-focus-add">' +
              '<input id="lhNewFocusTxt" class="lh-input" style="flex:1;min-width:160px" placeholder="写下今天最重要的一件学习任务…">' +
              '<input id="lhNewFocusMin" class="lh-input" type="number" value="25" min="5" max="120" style="width:78px">' +
              '<button class="lh-btn lh-btn-primary" id="lhAddFocusBtn">添加</button>' +
            '</div>' +
          '</div>' +
          '<div class="lh-panel">' +
            '<div class="lh-panel-head">' +
              '<h2 class="lh-panel-title">📅 实时考期倒计时</h2>' +
              (curWeek ? '<span class="lh-badge lh-badge-gold">当前推算 Term 1 · Week ' + curWeek + '</span>' : '') +
            '</div>' +
            examHtml +
            '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">' +
              (lastVisit ? '<a class="lh-btn lh-btn-gold" href="' + esc(lastVisit.hash) + '">▶ 续学：' + esc(lastVisit.title.slice(0, 22)) + '</a>' : '') +
              '<a class="lh-btn" href="#/prep">完整周计划 →</a>' +
              '<a class="lh-btn" href="guide.html">学习方法指南 →</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="lh-hub-strip">' +
          '<a class="lh-hub-tile" href="#/handbooks"><div class="t-title">📚 五科通关手册</div><div class="t-sub">考核规则、学习方法、公式/Excel卡、防扣分清单</div></a>' +
          '<a class="lh-hub-tile" href="#/mistakes"><div class="t-title">🔁 全科错题本 ' + (dueMistakes ? '<span class="lh-badge lh-badge-red">' + dueMistakes + '待复习</span>' : '') + '</div><div class="t-sub">1/3/7/14 天遗忘曲线自动推回重刷</div></a>' +
          '<a class="lh-hub-tile" href="#/flashcards"><div class="t-title">🃏 中英术语闪卡</div><div class="t-sub">112+ 门科核心英文原词与中文释义速背</div></a>' +
          '<a class="lh-hub-tile" href="#/exam-packs"><div class="t-title">🎯 多科闭卷刷题</div><div class="t-sub">五科高频题 + 会计 U1–6 官方引文题库</div></a>' +
          '<a class="lh-hub-tile" href="#/annotations"><div class="t-title">🖍️ 我的批注集 (' + ((st.annotations || []).length) + ')</div><div class="t-sub">笔记划词高亮、个人批注与一键打印</div></a>' +
          '<a class="lh-hub-tile" href="bilingual-video.html"><div class="t-title">🎬 五科中英视频</div><div class="t-sub">会计 / 经济 / 数学 / 计算机 / 英语对照讲解</div></a>' +
        '</div>';

      root.querySelectorAll('[data-df-chk]').forEach(function (chk) {
        chk.addEventListener('change', async function () {
          var i = Number(chk.getAttribute('data-df-chk'));
          daily[i].done = chk.checked;
          drawCockpit();
          await api.saveFocus({ action: 'set_daily', items: daily });
        });
      });
      root.querySelectorAll('[data-df-del]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          daily.splice(Number(btn.getAttribute('data-df-del')), 1);
          drawCockpit();
          await api.saveFocus({ action: 'set_daily', items: daily });
        });
      });
      var addBtn = document.getElementById('lhAddFocusBtn');
      if (addBtn) addBtn.addEventListener('click', async function () {
        var txt = (document.getElementById('lhNewFocusTxt').value || '').trim();
        var mins = Number(document.getElementById('lhNewFocusMin').value) || 25;
        if (!txt) return;
        if (daily.length >= 6) { api.toast('今日焦点最多保留 6 条，先专注做完现有的吧'); return; }
        daily.push({ id: 'd' + Date.now(), text: txt, minutes: mins, done: false });
        drawCockpit();
        await api.saveFocus({ action: 'set_daily', items: daily });
      });
    }

    drawCockpit();
    var hero = app.querySelector('.hero');
    if (hero && hero.nextSibling) app.insertBefore(root, hero.nextSibling);
    else app.insertBefore(root, app.firstChild);
  }

  /* ---------- 3. 课程周页增强（真实 PDF + 本周术语 + 我的本周批注） ---------- */
  async function enhanceCourseWeek() {
    var m = (location.hash || '').match(/^#\/c\/([^/]+)\/([^/]+)\/(\d+)/);
    if (!m) return;
    var courseId = m[1], termId = m[2], weekNum = Number(m[3]);
    var app = document.getElementById('app');
    if (!app) return;
    var old = document.getElementById('lh-week-addon-root');
    if (old) old.remove();

    var D = window.PORTAL_DATA;
    var course = D && D.courses && D.courses.find(function (c) { return c.id === courseId; });
    var term = course && (course.terms || []).find(function (t) { return t.id === termId; });
    var week = term && (term.weeks || []).find(function (w) { return Number(w.num) === weekNum; });
    if (!week) return;

    var api = window.LioraStudyApi;
    var st = await api.loadStudy();
    var route = '#/c/' + courseId + '/' + termId + '/' + weekNum;
    var weekAnns = (st.annotations || []).filter(function (a) { return a.route === route; });

    var hasPdfs = Array.isArray(week.onlineSources) && week.onlineSources.length > 0;
    var hasGloss = Array.isArray(week.glossary) && week.glossary.length > 0;

    var box = document.createElement('div');
    box.id = 'lh-week-addon-root';
    box.className = 'lh-week-addon';

    var pdfHtml = hasPdfs ? (
      '<div style="margin-bottom:10px"><div style="font-size:12.5px;font-weight:700;color:var(--lh-navy-900);margin-bottom:6px">📄 本周可在线直达原件（已核验站内 PDF）</div>' +
      '<div class="lh-pill-row">' + week.onlineSources.map(function (f) {
        return '<a class="lh-btn lh-btn-sm" target="_blank" rel="noopener" href="' + esc(f.path) + '">📎 ' + esc(f.name) + ' ↗</a>';
      }).join('') + '</div></div>'
    ) : '';

    var glossHtml = hasGloss ? (
      '<div style="margin-bottom:10px"><div style="font-size:12.5px;font-weight:700;color:var(--lh-navy-900);margin-bottom:6px">🃏 本周核心中英术语（<a href="#/flashcards">去闪卡自测 →</a>）</div>' +
      '<div class="lh-pill-row">' + week.glossary.map(function (g) {
        return '<span class="lh-badge lh-badge-gold" title="' + esc(g.def) + '">' + esc(g.term) + ' · ' + esc(g.zh) + '</span>';
      }).join('') + '</div></div>'
    ) : '';

    var annHtml = '<div><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">' +
      '<span style="font-size:12.5px;font-weight:700;color:var(--lh-navy-900)">🖍️ 我的本周批注（' + weekAnns.length + ' 条 · 划选笔记文字也可直接记）</span>' +
      '<div><a class="lh-btn lh-btn-sm" href="#/handbooks/' + esc(courseId) + '">📚 本科通关手册</a> ' +
      '<button class="lh-btn lh-btn-sm lh-btn-gold" id="lhQuickNoteBtn">➕ 记一条本周批注</button></div>' +
    '</div>' +
    (weekAnns.length ? weekAnns.map(function (a) {
      return '<div style="padding:7px 10px;background:var(--lh-gold-soft);border-radius:8px;font-size:13px;margin-top:6px">' +
        (a.quote ? '<div><em>「' + esc(a.quote) + '」</em></div>' : '') +
        (a.note ? '<div>' + esc(a.note) + '</div>' : '') +
      '</div>';
    }).join('') : '') + '</div>';

    box.innerHTML = pdfHtml + glossHtml + annHtml;

    var anchor = app.querySelector('.week-panel, .wp-head, .note-pane, .week-main');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor.nextSibling);
    else app.appendChild(box);

    var qBtn = document.getElementById('lhQuickNoteBtn');
    if (qBtn) qBtn.addEventListener('click', async function () {
      var note = window.prompt('输入你想记在本周（' + (week.title || 'Week ' + weekNum) + '）的批注或心得：');
      if (!note || !note.trim()) return;
      await api.saveAnnotation({ route: route, course: courseId, title: week.title || ('Week ' + weekNum), kind: 'note', note: note.trim() });
      api.toast('批注已同步云端');
      enhanceCourseWeek();
    });
  }

  /* ---------- 4. 笔记划词高亮/批注浮动条 ---------- */
  function initSelectionAnnotator() {
    if (document.getElementById('lh-sel-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'lh-sel-bar';
    bar.innerHTML = '<button id="lhSelHl">🖍️ 标为高亮</button><button id="lhSelNote">📝 高亮+写批注</button>';
    document.body.appendChild(bar);

    var currentText = '';
    document.addEventListener('mouseup', function () {
      var m = (location.hash || '').match(/^#\/c\/([^/]+)\/([^/]+)\/(\d+)/);
      if (!m) { bar.style.display = 'none'; return; }
      var sel = window.getSelection();
      var txt = sel ? sel.toString().trim() : '';
      if (txt.length < 4 || txt.length > 600) { bar.style.display = 'none'; return; }
      var range = sel.rangeCount ? sel.getRangeAt(0) : null;
      if (!range) return;
      var rect = range.getBoundingClientRect();
      currentText = txt;
      bar.style.left = Math.max(12, Math.min(window.innerWidth - 220, rect.left)) + 'px';
      bar.style.top = Math.max(12, rect.top - 46) + 'px';
      bar.style.display = 'flex';
    });

    async function saveSel(askNote) {
      bar.style.display = 'none';
      var m = (location.hash || '').match(/^#\/c\/([^/]+)\/([^/]+)\/(\d+)/);
      if (!m || !currentText) return;
      var note = '';
      if (askNote) {
        note = window.prompt('给这段高亮写一句批注：', '') || '';
      }
      var h = document.querySelector('#app .wp-title, #app h1, #app h2');
      await window.LioraStudyApi.saveAnnotation({
        route: '#/c/' + m[1] + '/' + m[2] + '/' + m[3],
        course: m[1],
        title: (h && h.textContent.trim().slice(0, 80)) || ('Week ' + m[3]),
        kind: askNote ? 'note' : 'highlight',
        quote: currentText,
        note: note
      });
      window.LioraStudyApi.toast('已保存到「我的批注集」');
      enhanceCourseWeek();
    }

    document.getElementById('lhSelHl').addEventListener('click', function () { saveSel(false); });
    document.getElementById('lhSelNote').addEventListener('click', function () { saveSel(true); });
  }

  /* ---------- 5. 右下角唯一收纳悬浮工具条（番茄钟 / 专注 / 字号 / 统一 AI / 备份） ---------- */
  function initDockAndDrawers() {
    if (document.getElementById('lh-dock')) return;

    var dock = document.createElement('div');
    dock.id = 'lh-dock';
    dock.setAttribute('role', 'toolbar');
    dock.setAttribute('aria-label', '个人学习快捷工具条');
    dock.innerHTML =
      '<button id="lhDockPomo" title="番茄钟">🍅 <span id="lhPomoLbl">25:00</span></button>' +
      '<button id="lhDockFocus" title="一键专注阅读模式">📖 专注</button>' +
      '<button id="lhDockFont" title="切换字号（小/中/大）">Aa</button>' +
      '<button id="lhDockBackup" title="数据备份与工具">💾 备份</button>' +
      '<button id="lhDockAI" class="lh-dock-ai" title="统一 AI 伴学与批改">🤖 AI 伴学</button>';
    document.body.appendChild(dock);

    /* Drawer A: 番茄钟 */
    var pomoDrawer = document.createElement('div');
    pomoDrawer.id = 'lh-drawer-pomo';
    pomoDrawer.className = 'lh-drawer';
    pomoDrawer.innerHTML =
      '<div class="lh-drawer-head"><h3>🍅 专注番茄钟</h3><button class="lh-btn lh-btn-sm" data-close-drawer>关闭</button></div>' +
      '<div class="lh-drawer-body" style="text-align:center">' +
        '<div id="lhPomoBig" style="font-family:var(--lh-serif);font-size:48px;font-weight:700;color:var(--lh-navy-900);margin:10px 0">25:00</div>' +
        '<input id="lhPomoTask" class="lh-input" style="width:100%;margin-bottom:12px" placeholder="本轮专注目标（如：刷完会计 U4 分录）">' +
        '<div style="display:flex;justify-content:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">' +
          '<button class="lh-btn lh-btn-sm" data-pomo-min="15">15分钟</button>' +
          '<button class="lh-btn lh-btn-sm" data-pomo-min="25">25分钟</button>' +
          '<button class="lh-btn lh-btn-sm" data-pomo-min="45">45分钟</button>' +
        '</div>' +
        '<div style="display:flex;justify-content:center;gap:10px">' +
          '<button class="lh-btn lh-btn-primary" id="lhPomoStart">▶ 开始专注</button>' +
          '<button class="lh-btn" id="lhPomoReset">重置</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(pomoDrawer);

    /* Drawer B: 统一 AI 伴学 */
    var aiDrawer = document.createElement('div');
    aiDrawer.id = 'lh-drawer-ai';
    aiDrawer.className = 'lh-drawer';
    aiDrawer.innerHTML =
      '<div class="lh-drawer-head"><h3>🤖 统一 AI 伴学助手</h3><button class="lh-btn lh-btn-sm" data-close-drawer>关闭</button></div>' +
      '<div class="lh-drawer-body">' +
        '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">' +
          '<button class="lh-btn lh-btn-sm lh-btn-primary" data-ai-mode="socratic">苏格拉底引导</button>' +
          '<button class="lh-btn lh-btn-sm" data-ai-mode="direct">直接给步骤答案</button>' +
          '<button class="lh-btn lh-btn-sm" data-ai-mode="grade">作业批改入档</button>' +
        '</div>' +
        '<div id="lhAiMsgs" class="lh-ai-msgs"><div class="lh-ai-msg bot">你好！我会自动参考你的 UNSW 学习档案和当前所在周次。需要答疑、讲解错题或批改练习直接发我就行。</div></div>' +
        '<div style="display:flex;gap:8px">' +
          '<textarea id="lhAiInput" class="lh-textarea" style="min-height:56px" placeholder="输入问题或粘贴作业内容（Ctrl/Cmd+Enter 发送）…"></textarea>' +
        '</div>' +
        '<div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">' +
          '<a href="ai-console.html" style="font-size:12px;color:var(--lh-muted)">⚙️ AI 密钥与额度设置</a>' +
          '<button class="lh-btn lh-btn-primary" id="lhAiSend">发送</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(aiDrawer);

    /* Drawer C: 一键备份与个人设置 */
    var bkDrawer = document.createElement('div');
    bkDrawer.id = 'lh-drawer-bk';
    bkDrawer.className = 'lh-drawer';
    bkDrawer.innerHTML =
      '<div class="lh-drawer-head"><h3>💾 个人数据备份与管理</h3><button class="lh-btn lh-btn-sm" data-close-drawer>关闭</button></div>' +
      '<div class="lh-drawer-body">' +
        '<p style="font-size:13.5px;color:var(--lh-ink-2);line-height:1.7;margin-top:0">一键导出你在本站的<b>全部个人学习数据</b>（课程进度、错题本、笔记高亮批注、成绩簿、番茄钟、术语闪卡）为单个 JSON 文件，随时可无损还原。</p>' +
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          '<a class="lh-btn lh-btn-primary" href="/__api/backup/export">⬇️ 下载全站学习数据备份 (.json)</a>' +
          '<label class="lh-btn" style="cursor:pointer">⬆️ 从备份文件恢复数据 <input type="file" id="lhRestoreFile" accept="application/json" style="display:none"></label>' +
          '<hr style="border:none;border-top:1px solid var(--lh-line);margin:6px 0">' +
          '<div style="font-size:12.5px;color:var(--lh-muted)">进阶管理入口（平时隐藏不打扰）：</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<a class="lh-btn lh-btn-sm" href="guide.html">📖 学习方法指南</a>' +
            '<a class="lh-btn lh-btn-sm" href="ai-console.html">🔑 AI 控制台</a>' +
            '<a class="lh-btn lh-btn-sm" href="board-editor.html">🧩 板块编辑器</a>' +
            '<a class="lh-btn lh-btn-sm" href="admin.html">👤 账号后台</a>' +
            '<a class="lh-btn lh-btn-sm" href="/__logout">退出登录</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bkDrawer);

    function closeAllDrawers() {
      [pomoDrawer, aiDrawer, bkDrawer].forEach(function (d) { d.classList.remove('open'); });
    }
    function toggleDrawer(target) {
      var wasOpen = target.classList.contains('open');
      closeAllDrawers();
      if (!wasOpen) target.classList.add('open');
    }
    document.querySelectorAll('[data-close-drawer]').forEach(function (b) {
      b.addEventListener('click', closeAllDrawers);
    });

    /* 番茄钟逻辑 */
    var pomoTotal = 25 * 60, pomoLeft = pomoTotal, pomoTimer = null;
    function fmtPomo(sec) {
      var m = Math.floor(sec / 60), s = sec % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    function syncPomoUI() {
      var str = fmtPomo(pomoLeft);
      document.getElementById('lhPomoLbl').textContent = str;
      document.getElementById('lhPomoBig').textContent = str;
    }
    document.getElementById('lhDockPomo').addEventListener('click', function () { toggleDrawer(pomoDrawer); });
    pomoDrawer.querySelectorAll('[data-pomo-min]').forEach(function (b) {
      b.addEventListener('click', function () {
        clearInterval(pomoTimer); pomoTimer = null;
        pomoTotal = Number(b.getAttribute('data-pomo-min')) * 60;
        pomoLeft = pomoTotal;
        document.getElementById('lhPomoStart').textContent = '▶ 开始专注';
        syncPomoUI();
      });
    });
    document.getElementById('lhPomoStart').addEventListener('click', function () {
      var btn = document.getElementById('lhPomoStart');
      if (pomoTimer) {
        clearInterval(pomoTimer); pomoTimer = null;
        btn.textContent = '▶ 继续专注';
        return;
      }
      btn.textContent = '⏸ 暂停';
      pomoTimer = setInterval(async function () {
        pomoLeft--;
        syncPomoUI();
        if (pomoLeft <= 0) {
          clearInterval(pomoTimer); pomoTimer = null;
          btn.textContent = '▶ 开始专注';
          var mins = Math.round(pomoTotal / 60);
          var task = (document.getElementById('lhPomoTask').value || '').trim();
          var m = (location.hash || '').match(/^#\/c\/([^/]+)/);
          await window.LioraStudyApi.saveFocus({ minutes: mins, course: m ? m[1] : 'general', task: task || '番茄钟专注' }).catch(function () {});
          window.LioraStudyApi.toast('🎉 完成一轮 ' + mins + ' 分钟专注，已自动记入学习记录！');
          pomoLeft = pomoTotal;
          syncPomoUI();
        }
      }, 1000);
    });
    document.getElementById('lhPomoReset').addEventListener('click', function () {
      clearInterval(pomoTimer); pomoTimer = null;
      pomoLeft = pomoTotal;
      document.getElementById('lhPomoStart').textContent = '▶ 开始专注';
      syncPomoUI();
    });

    /* 专注模式 & 字号切换 */
    var focusBtn = document.getElementById('lhDockFocus');
    focusBtn.addEventListener('click', function () {
      var on = document.body.classList.toggle('lh-focus');
      document.body.classList.toggle('cb-focus', on);
      focusBtn.classList.toggle('active', on);
      window.LioraStudyApi.toast(on ? '已进入专注阅读模式' : '已退出专注模式');
    });

    var scales = [1.65, 1.9, 2.25];
    var scaleNames = ['小字号', '中字号（默认）', '大字号'];
    var scaleIdx = Number(localStorage.getItem('liora-rf-idx') || 1);
    if (scales[scaleIdx]) document.documentElement.style.setProperty('--rf', String(scales[scaleIdx]));
    document.getElementById('lhDockFont').addEventListener('click', function () {
      scaleIdx = (scaleIdx + 1) % scales.length;
      document.documentElement.style.setProperty('--rf', String(scales[scaleIdx]));
      try { localStorage.setItem('liora-rf-idx', String(scaleIdx)); } catch (e) {}
      window.LioraStudyApi.toast('已切换：' + scaleNames[scaleIdx]);
    });

    /* 备份恢复 */
    document.getElementById('lhDockBackup').addEventListener('click', function () { toggleDrawer(bkDrawer); });
    document.getElementById('lhRestoreFile').addEventListener('change', function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = async function () {
        try {
          var j = JSON.parse(String(reader.result || '{}'));
          await window.LioraStudyApi.importBackup(j);
          window.LioraStudyApi.toast('✅ 数据已恢复！即将刷新页面…');
          setTimeout(function () { location.reload(); }, 900);
        } catch (e) {
          window.LioraStudyApi.toast('恢复失败：' + (e.message || '文件格式不正确'));
        }
      };
      reader.readAsText(file, 'utf-8');
    });

    /* 统一 AI 伴学抽屉 */
    var aiMode = 'socratic';
    var aiHistory = [];
    document.getElementById('lhDockAI').addEventListener('click', function () { toggleDrawer(aiDrawer); });
    aiDrawer.querySelectorAll('[data-ai-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        aiMode = b.getAttribute('data-ai-mode');
        aiDrawer.querySelectorAll('[data-ai-mode]').forEach(function (x) { x.classList.toggle('lh-btn-primary', x === b); });
      });
    });

    async function sendAiMsg() {
      var inp = document.getElementById('lhAiInput');
      var q = (inp.value || '').trim();
      if (!q) return;
      inp.value = '';
      var msgsEl = document.getElementById('lhAiMsgs');
      var uDiv = document.createElement('div');
      uDiv.className = 'lh-ai-msg user';
      uDiv.textContent = q;
      msgsEl.appendChild(uDiv);

      var bDiv = document.createElement('div');
      bDiv.className = 'lh-ai-msg bot';
      bDiv.textContent = '思考中…';
      msgsEl.appendChild(bDiv);
      msgsEl.scrollTop = msgsEl.scrollHeight;

      var ctxTitle = (document.querySelector('#app h1, #app .wp-title') || {}).textContent || '';
      var context = '路由：' + (location.hash || '#/') + '；页面标题：' + ctxTitle.trim().slice(0, 120);
      var acc = '';
      try {
        var full = await window.LioraStudyApi.askAI({
          question: q,
          mode: aiMode,
          context: context,
          history: aiHistory,
          onDelta: function (d) {
            acc += d;
            bDiv.textContent = acc;
            msgsEl.scrollTop = msgsEl.scrollHeight;
          }
        });
        if (!acc && full) bDiv.textContent = full;
        var finalTxt = acc || full || '';
        aiHistory.push({ role: 'user', content: q }, { role: 'assistant', content: finalTxt.slice(0, 1200) });

        var gradeObj = window.LioraStudyApi.parseGradeBlock(finalTxt);
        if (gradeObj) {
          var saveBtn = document.createElement('button');
          saveBtn.className = 'lh-btn lh-btn-gold lh-btn-sm';
          saveBtn.style.marginTop = '8px';
          saveBtn.textContent = '✅ 一键写入个人学习档案（' + gradeObj.score + '/' + gradeObj.maxScore + '）';
          saveBtn.addEventListener('click', async function () {
            await window.LioraStudyApi.saveGrade(gradeObj);
            saveBtn.disabled = true;
            saveBtn.textContent = '✅ 已存入学习档案';
            window.LioraStudyApi.toast('批改成绩已写入个人学习档案！');
          });
          bDiv.appendChild(document.createElement('br'));
          bDiv.appendChild(saveBtn);
        }
      } catch (e) {
        bDiv.textContent = '⚠️ ' + (e.message || '调用失败');
      }
    }

    document.getElementById('lhAiSend').addEventListener('click', sendAiMsg);
    document.getElementById('lhAiInput').addEventListener('keydown', function (ev) {
      if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') { ev.preventDefault(); sendAiMsg(); }
    });
  }

  /* ---------- 6. 路由分发与自动增强 ---------- */
  function handleRoute() {
    var hash = location.hash || '#/';
    var app = document.getElementById('app');
    if (!app) return;
    var V = window.LioraStudyViews;
    if (V) {
      if (hash === '#/handbooks' || hash.startsWith('#/handbooks/')) {
        var cid = hash.split('/')[2] || '';
        V.renderHandbooks(app, cid);
        return;
      }
      if (hash === '#/mistakes') { V.renderMistakes(app); return; }
      if (hash === '#/flashcards') { V.renderFlashcards(app); return; }
      if (hash === '#/exam-packs') { V.renderExamPacks(app); return; }
      if (hash === '#/annotations') { V.renderAnnotations(app); return; }
    }
    setTimeout(function () {
      rememberCourseVisit();
      mountHomeCockpit();
      enhanceCourseWeek();
    }, 90);
  }

  function start() {
    initDockAndDrawers();
    initSelectionAnnotator();
    /* 首页明确展示「今日学习驾驶舱」：若旧脚本刚把空首页自动跳走，拦截回首页由驾驶舱提供一键续学 */
    if (!sessionStorage.getItem('lh_boot_home_done') && (location.pathname === '/' || location.pathname === '/index.html')) {
      sessionStorage.setItem('lh_boot_home_done', '1');
      if (/^#\/c\/accounting\/term1(?:\/1)?$/.test(location.hash) && !document.referrer.includes('/#/')) {
        location.hash = '#/';
      }
    }
    window.addEventListener('hashchange', function () { setTimeout(handleRoute, 50); });
    setTimeout(handleRoute, 140);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
