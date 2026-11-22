/* 复习计划与考期倒计时（#/prep）+ 个人学习档案与成绩簿（#/profile） */
(function () {
  'use strict';

  var SOURCE_LABELS = {
    official: { text: '官方正式成绩', cls: 'ed-badge-green' },
    self_reported: { text: '自报成绩', cls: 'ed-badge-gold' },
    practice: { text: '模考/练习分', cls: '' },
    ai_estimate: { text: 'AI 估分', cls: 'ed-badge-red' }
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderPrep(app) {
    var html = typeof window.renderStudyPlanInline === 'function'
      ? window.renderStudyPlanInline()
      : '<div class="ed-card">复习计划数据未加载。</div>';
    app.innerHTML = '<div class="ed-container">' +
      '<div class="ed-hero" style="grid-template-columns:1fr;padding:22px 26px">' +
        '<div><div class="ed-hero-kicker">STUDY PLAN &amp; EXAM COUNTDOWN</div>' +
        '<h1>复习计划 · 动态考试倒计时</h1>' +
        '<p style="margin-bottom:0">基于已确认的 Term 1 开学锚点动态推算当前周次与每场考试剩余天数；搭配「<a style="color:#f3dfb3;text-decoration:underline" href="#/exam-packs">多科闭卷刷题</a>」与「<a style="color:#f3dfb3;text-decoration:underline" href="#/mistakes">全科错题本</a>」执行。</p></div>' +
      '</div>' +
      '<div style="margin-top:18px">' + html + '</div>' +
    '</div>';
  }

  async function renderProfile(app) {
    var api = window.LioraStudyApi;
    var showForm = false;

    async function draw() {
      var st = await api.loadStudy(true);
      var grades = st.grades || [];
      var focusTotal = (st.focusSessions || []).reduce(function (a, b) { return a + (Number(b.minutes) || 0); }, 0);
      var officialCount = grades.filter(function (g) { return g.sourceType === 'official'; }).length;

      var formHtml = showForm ? (
        '<div class="ed-card" style="margin-bottom:16px;border-left:4px solid var(--gold)">' +
          '<h3 style="margin:0 0 10px;font-family:var(--serif);color:var(--navy-900)">➕ 录入一条成绩记录（严格区分口径）</h3>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:10px">' +
            '<select id="grCourse" class="lh-select"><option value="accounting">会计学</option><option value="economics">经济学</option><option value="mathematics">商业数学</option><option value="computing">计算机应用</option><option value="english">学术英语</option></select>' +
            '<input id="grTitle" class="lh-input" placeholder="考试/练习名称（如 W6 Quiz）">' +
            '<select id="grSrc" class="lh-select"><option value="official">官方正式成绩</option><option value="practice">模考/练习分</option><option value="self_reported">自报成绩</option><option value="ai_estimate">AI 估分</option></select>' +
            '<input id="grScore" class="lh-input" type="number" step="0.1" placeholder="得分">' +
            '<input id="grMax" class="lh-input" type="number" step="0.1" value="100" placeholder="满分">' +
          '</div>' +
          '<input id="grWeak" class="lh-input" style="width:100%;margin-bottom:8px" placeholder="薄弱点（逗号分隔，如：折扣基数, PPC 因果链）">' +
          '<div style="display:flex;gap:8px"><button class="ed-btn ed-btn-primary" id="grSave">保存成绩</button><button class="ed-btn" id="grCancel">取消</button></div>' +
        '</div>'
      ) : '';

      var rows = grades.length ? grades.map(function (g) {
        var meta = SOURCE_LABELS[g.sourceType] || SOURCE_LABELS.practice;
        return '<div class="ed-card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">' +
          '<div><span class="ed-badge ed-badge-gold">' + esc(g.course) + '</span> <span class="ed-badge ' + meta.cls + '">' + meta.text + '</span> ' +
          '<b style="margin-left:6px;color:var(--navy-900)">' + esc(g.title) + '</b>' +
          '<div style="font-size:12.5px;color:var(--muted);margin-top:4px">' + esc(g.date || '') + (g.weakPoints && g.weakPoints.length ? ' · 薄弱点：' + esc(g.weakPoints.join('、')) : '') + '</div></div>' +
          '<div style="display:flex;align-items:center;gap:10px">' +
            '<span style="font-family:var(--serif);font-size:20px;font-weight:700;color:var(--navy-900)">' + g.score + '/' + g.maxScore + ' <small style="font-size:13px;color:var(--muted)">(' + g.pct + '%)</small></span>' +
            '<button class="ed-btn ed-btn-sm" data-gdel="' + esc(g.id) + '">删</button>' +
          '</div>' +
        '</div>';
      }).join('') : '<div class="ed-card" style="color:var(--muted)">还没有录入云端成绩记录。点右上角「➕ 录入成绩」或用右下角 AI 批改一键写入。</div>';

      app.innerHTML = '<div class="ed-container">' +
        '<div class="ed-hero" style="grid-template-columns:1fr;padding:22px 26px">' +
          '<div><div class="ed-hero-kicker">LEARNING PROFILE · 个人学习档案</div>' +
          '<h1>成绩簿、薄弱点与专注统计</h1>' +
          '<p style="margin-bottom:0">严格区分「官方正式成绩 / 自报成绩 / 模考练习分 / AI 估分」，绝不混淆。累计番茄钟专注 <b>' + focusTotal + ' 分钟</b> · 官方记录 <b>' + officialCount + ' 条</b>。</p></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin:18px 0 12px;flex-wrap:wrap;gap:10px">' +
          '<h2 style="margin:0;font-family:var(--serif);font-size:19px;color:var(--navy-900)">成绩记录（共 ' + grades.length + ' 条）</h2>' +
          '<button class="ed-btn ed-btn-gold" id="grToggle">➕ 录入成绩</button>' +
        '</div>' +
        formHtml + rows +
      '</div>';

      document.getElementById('grToggle').addEventListener('click', function () { showForm = !showForm; draw(); });
      var cancel = document.getElementById('grCancel');
      if (cancel) cancel.addEventListener('click', function () { showForm = false; draw(); });
      var save = document.getElementById('grSave');
      if (save) save.addEventListener('click', async function () {
        var score = Number(document.getElementById('grScore').value);
        var maxScore = Number(document.getElementById('grMax').value);
        var title = (document.getElementById('grTitle').value || '').trim();
        if (!title || !Number.isFinite(score)) { api.toast('请填写名称和有效分数'); return; }
        var weak = (document.getElementById('grWeak').value || '').split(/[,，、]/).map(function (x) { return x.trim(); }).filter(Boolean);
        await api.saveGrade({
          course: document.getElementById('grCourse').value,
          title: title,
          sourceType: document.getElementById('grSrc').value,
          score: score,
          maxScore: maxScore,
          weakPoints: weak
        });
        showForm = false;
        api.toast('已写入个人成绩档案');
        draw();
      });
      app.querySelectorAll('[data-gdel]').forEach(function (b) {
        b.addEventListener('click', async function () {
          await api.saveGrade({ action: 'delete', id: b.getAttribute('data-gdel') });
          api.toast('已删除');
          draw();
        });
      });
    }
    draw();
  }

  window.LioraViewsPrep = { renderPrep: renderPrep, renderProfile: renderProfile };
})();
