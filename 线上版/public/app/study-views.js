/* Liora 个人学习中心 · 5 大深度学习页面视图
   1) #/handbooks   五科学习方法与考前速查手册
   2) #/mistakes    全科统一错题本 & 1/3/7/14 天遗忘曲线复习
   3) #/flashcards  全科中英术语闪卡自测
   4) #/exam-packs  多科闭卷巩固刷题（支持一键入错题本）
   5) #/annotations 我的笔记高亮与批注汇总 */
(function () {
  'use strict';

  var COURSE_NAMES = {
    accounting: '会计学',
    economics: '经济学',
    mathematics: '商业数学',
    computing: '计算机应用',
    english: '学术英语',
    general: '综合'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function courseLabel(id) { return COURSE_NAMES[id] || id || '综合'; }

  function fmtDate(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ==================== 1. 五科通关方法与考前速查手册 ==================== */
  async function renderHandbooks(app, initialCourse) {
    app.innerHTML = '<div class="lh-wrap"><p>正在加载五科通关手册…</p></div>';
    var api = window.LioraStudyApi;
    var books = await api.loadHandbooks();
    var videosExtra = await api.loadVideosExtra().catch(function () { return {}; });
    var activeId = (initialCourse && books.some(function (b) { return b.id === initialCourse; })) ? initialCourse : books[0].id;

    function draw() {
      var cur = books.find(function (b) { return b.id === activeId; }) || books[0];
      var extraVid = videosExtra[cur.id];
      var tabs = books.map(function (b) {
        return '<button class="lh-tab' + (b.id === cur.id ? ' active' : '') + '" data-hb="' + esc(b.id) + '">' + esc(courseLabel(b.id)) + '</button>';
      }).join('');

      var assessHtml = cur.assessments.map(function (a) {
        return '<tr><th>' + esc(a.name) + '</th><td><span class="lh-badge lh-badge-gold">' + esc(a.weight) + '</span> <span class="lh-badge">' + esc(a.rule) + '</span><div style="margin-top:4px">' + esc(a.tip) + '</div></td></tr>';
      }).join('');

      var methodHtml = '<ol style="padding-left:20px;line-height:1.85">' + cur.weeklyMethod.map(function (s) {
        return '<li style="margin-bottom:6px">' + esc(s) + '</li>';
      }).join('') + '</ol>';

      var sheetsHtml = cur.cheatSheets.map(function (sh) {
        var rows = sh.rows.map(function (r) {
          return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>';
        }).join('');
        return '<div class="lh-card" style="margin-bottom:16px"><h3>📌 ' + esc(sh.title) + '</h3><table class="lh-cheat-table"><tbody>' + rows + '</tbody></table></div>';
      }).join('');

      var pitfallsHtml = '<ul style="padding-left:20px;line-height:1.85">' + cur.pitfalls.map(function (p) {
        return '<li style="margin-bottom:6px;color:#7a1f1f">' + esc(p) + '</li>';
      }).join('') + '</ul>';

      var videoHtml = '';
      if (extraVid && extraVid.units) {
        videoHtml = '<div class="lh-card" style="margin-top:16px"><h3>🎬 ' + esc(extraVid.cn) + ' · 中英对照视频直达</h3><p style="font-size:13px;color:var(--lh-muted);margin-bottom:10px">' + esc(extraVid.desc) + '</p>' +
          '<table class="lh-cheat-table"><tbody>' + extraVid.units.map(function (u) {
            return '<tr><th>' + esc(u.unit) + ' · ' + esc(u.title) + '</th><td>' +
              '<a class="lh-btn lh-btn-sm" target="_blank" rel="noopener" href="' + esc(u.zh.url) + '">中文：' + esc(u.zh.label) + ' ↗</a> ' +
              '<a class="lh-btn lh-btn-sm" target="_blank" rel="noopener" href="' + esc(u.en.url) + '">英文：' + esc(u.en.label) + ' ↗</a></td></tr>';
          }).join('') + '</tbody></table></div>';
      } else {
        videoHtml = '<div class="lh-card" style="margin-top:16px"><h3>🎬 中英对照视频</h3><p style="margin-bottom:10px;font-size:13.5px;color:var(--lh-ink-2)">本学科完整分集视频表已收录在独立视频中心：</p><a class="lh-btn lh-btn-primary" href="bilingual-video.html?course=' + esc(cur.id) + '">打开 ' + esc(courseLabel(cur.id)) + ' 中英对照视频页 →</a></div>';
      }

      app.innerHTML = '<div class="lh-wrap">' +
        '<div class="lh-page-hero">' +
          '<h1>📚 五科学习方法与考前速查手册</h1>' +
          '<p>不只是看笔记：按 UNSW 2026 大纲与你的高频错因整理，涵盖每科考核权重、每周高效学习流程、公式/函数/语法速查卡与考场避坑清单。</p>' +
        '</div>' +
        '<div class="lh-tabs">' + tabs +
          '<button class="lh-btn" style="margin-left:auto" onclick="window.print()">🖨️ 打印 / 存 PDF</button>' +
          '<a class="lh-btn lh-btn-gold" href="#/c/' + esc(cur.id) + '">进入本课笔记 →</a>' +
        '</div>' +
        '<div class="lh-card" style="margin-bottom:16px;border-left:4px solid ' + esc(cur.color) + '">' +
          '<h3>' + esc(cur.title) + '</h3>' +
          '<p style="font-size:13px;color:var(--lh-muted);margin-bottom:12px">' + esc(cur.en) + '</p>' +
          '<h4 style="margin:12px 0 6px;font-size:15px">🎯 考核结构与学术自律边界</h4>' +
          '<table class="lh-cheat-table"><tbody>' + assessHtml + '</tbody></table>' +
        '</div>' +
        '<div class="lh-card" style="margin-bottom:16px"><h3>🧭 本科每周怎么学（4 步闭环）</h3>' + methodHtml + '</div>' +
        sheetsHtml +
        '<div class="lh-card" style="background:#fffaf9;border-color:#f0cece"><h3>⚠️ 高频扣分陷阱清单（考前必扫）</h3>' + pitfallsHtml + '</div>' +
        videoHtml +
      '</div>';

      app.querySelectorAll('[data-hb]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeId = btn.getAttribute('data-hb');
          draw();
        });
      });
    }
    draw();
  }

  /* ==================== 2. 全科统一错题本 & 遗忘曲线 ==================== */
  async function renderMistakes(app) {
    app.innerHTML = '<div class="lh-wrap"><p>正在加载个人错题本…</p></div>';
    var api = window.LioraStudyApi;
    var filterCourse = 'all';
    var filterMode = 'due'; // due | all | mastered
    var showAdd = false;

    async function draw() {
      var st = await api.loadStudy(true);
      var now = Date.now();
      var all = st.mistakes || [];
      var dueCount = all.filter(function (m) { return !m.mastered && (!m.nextReviewAt || m.nextReviewAt <= now); }).length;

      var list = all.filter(function (m) {
        if (filterCourse !== 'all' && m.course !== filterCourse) return false;
        if (filterMode === 'due') return !m.mastered && (!m.nextReviewAt || m.nextReviewAt <= now);
        if (filterMode === 'mastered') return !!m.mastered;
        return true;
      });

      var addForm = showAdd ? (
        '<div class="lh-card" style="margin-bottom:18px;border-left:4px solid var(--lh-gold)">' +
          '<h3>➕ 手动录入一道错题（自动进入 1/3/7/14 天复习队列）</h3>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:10px">' +
            '<select id="mkCourse" class="lh-select">' +
              '<option value="accounting">会计学</option><option value="economics">经济学</option>' +
              '<option value="mathematics">商业数学</option><option value="computing">计算机应用</option><option value="english">学术英语</option>' +
            '</select>' +
            '<input id="mkTopic" class="lh-input" placeholder="章节/知识点（如 U4 折扣退货）">' +
            '<input id="mkTag" class="lh-input" placeholder="错因标签（如 E01符号 / 折扣基数）">' +
          '</div>' +
          '<textarea id="mkPrompt" class="lh-textarea" placeholder="题目内容 / 错题情景（必填）"></textarea>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">' +
            '<input id="mkMy" class="lh-input" placeholder="我当时的错解">' +
            '<input id="mkAns" class="lh-input" placeholder="正确解法 / 关键答案">' +
          '</div>' +
          '<input id="mkNote" class="lh-input" style="width:100%;margin-top:8px" placeholder="一句话防再错提醒">' +
          '<div style="margin-top:10px;display:flex;gap:8px">' +
            '<button class="lh-btn lh-btn-primary" id="mkSaveBtn">保存到错题本</button>' +
            '<button class="lh-btn" id="mkCancelBtn">取消</button>' +
          '</div>' +
        '</div>'
      ) : '';

      var cards = list.length ? list.map(function (m) {
        var stageText = m.mastered ? '已掌握' : ('第 ' + (m.stage + 1) + ' 轮 · 下次复习 ' + fmtDate(m.nextReviewAt));
        return '<div class="lh-card" style="margin-bottom:12px">' +
          '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
            '<div><span class="lh-badge lh-badge-gold">' + esc(courseLabel(m.course)) + '</span> ' +
              (m.topic ? '<span class="lh-badge">' + esc(m.topic) + '</span> ' : '') +
              (m.errorTag ? '<span class="lh-badge lh-badge-red">' + esc(m.errorTag) + '</span>' : '') +
            '</div>' +
            '<span class="lh-badge ' + (m.mastered ? 'lh-badge-green' : '') + '">' + esc(stageText) + '</span>' +
          '</div>' +
          '<div style="font-size:14.5px;font-weight:600;margin-bottom:8px;line-height:1.65">' + esc(m.prompt) + '</div>' +
          (m.myAnswer ? '<div style="font-size:13px;color:var(--lh-red);margin-bottom:4px">当时错解：' + esc(m.myAnswer) + '</div>' : '') +
          '<details style="margin:6px 0 10px"><summary style="cursor:pointer;color:var(--lh-navy-800);font-weight:600;font-size:13.5px">展开正确解析与避坑提醒</summary>' +
            '<div style="margin-top:8px;padding:10px 12px;background:var(--lh-navy-050);border-radius:8px;font-size:13.5px;line-height:1.7">' +
              '<div><b>正解：</b>' + esc(m.correctAnswer || '（未填）') + '</div>' +
              (m.note ? '<div style="margin-top:4px"><b>提醒：</b>' + esc(m.note) + '</div>' : '') +
            '</div>' +
          '</details>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="lh-btn lh-btn-primary lh-btn-sm" data-mk-pass="' + esc(m.id) + '">✅ 这次做对了（推进下一复习周期）</button>' +
            '<button class="lh-btn lh-btn-sm" data-mk-fail="' + esc(m.id) + '">🔁 还会错（明天重刷）</button>' +
            '<button class="lh-btn lh-btn-danger lh-btn-sm" style="margin-left:auto" data-mk-del="' + esc(m.id) + '">删除</button>' +
          '</div>' +
        '</div>';
      }).join('') : '<div class="lh-card"><p style="color:var(--lh-muted);margin:0">当前筛选下没有错题。你可以去「多科刷题」做错自动收录，或点上方「➕ 录入错题」手动记录日常作业错题。</p></div>';

      app.innerHTML = '<div class="lh-wrap">' +
        '<div class="lh-page-hero">' +
          '<h1>🔁 全科统一错题本 · 遗忘曲线复习</h1>' +
          '<p>按 1 → 3 → 7 → 14 → 30 天间隔自动安排重做。已收录 ' + all.length + ' 题，其中今日待复习 <b>' + dueCount + '</b> 题。</p>' +
        '</div>' +
        '<div class="lh-tabs">' +
          '<button class="lh-tab' + (filterMode === 'due' ? ' active' : '') + '" data-fm="due">今日待复习 (' + dueCount + ')</button>' +
          '<button class="lh-tab' + (filterMode === 'all' ? ' active' : '') + '" data-fm="all">全部错题 (' + all.length + ')</button>' +
          '<button class="lh-tab' + (filterMode === 'mastered' ? ' active' : '') + '" data-fm="mastered">已掌握</button>' +
          '<select id="mkFilterCourse" class="lh-select" style="margin-left:auto">' +
            '<option value="all"' + (filterCourse === 'all' ? ' selected' : '') + '>全部学科</option>' +
            '<option value="accounting"' + (filterCourse === 'accounting' ? ' selected' : '') + '>会计学</option>' +
            '<option value="economics"' + (filterCourse === 'economics' ? ' selected' : '') + '>经济学</option>' +
            '<option value="mathematics"' + (filterCourse === 'mathematics' ? ' selected' : '') + '>商业数学</option>' +
            '<option value="computing"' + (filterCourse === 'computing' ? ' selected' : '') + '>计算机应用</option>' +
            '<option value="english"' + (filterCourse === 'english' ? ' selected' : '') + '>学术英语</option>' +
          '</select>' +
          '<button class="lh-btn lh-btn-gold" id="mkToggleAdd">➕ 录入错题</button>' +
        '</div>' +
        addForm + cards +
      '</div>';

      app.querySelectorAll('[data-fm]').forEach(function (b) {
        b.addEventListener('click', function () { filterMode = b.getAttribute('data-fm'); draw(); });
      });
      var sel = document.getElementById('mkFilterCourse');
      if (sel) sel.addEventListener('change', function () { filterCourse = sel.value; draw(); });
      var tog = document.getElementById('mkToggleAdd');
      if (tog) tog.addEventListener('click', function () { showAdd = !showAdd; draw(); });

      var saveBtn = document.getElementById('mkSaveBtn');
      if (saveBtn) saveBtn.addEventListener('click', async function () {
        var prompt = (document.getElementById('mkPrompt').value || '').trim();
        if (!prompt) { api.toast('请先填写题目内容'); return; }
        await api.saveMistake({
          course: document.getElementById('mkCourse').value,
          topic: document.getElementById('mkTopic').value,
          errorTag: document.getElementById('mkTag').value,
          prompt: prompt,
          myAnswer: document.getElementById('mkMy').value,
          correctAnswer: document.getElementById('mkAns').value,
          note: document.getElementById('mkNote').value
        });
        showAdd = false;
        api.toast('已收入错题本，已排入 1 天后首次复习');
        draw();
      });
      var cancelBtn = document.getElementById('mkCancelBtn');
      if (cancelBtn) cancelBtn.addEventListener('click', function () { showAdd = false; draw(); });

      app.querySelectorAll('[data-mk-pass]').forEach(function (b) {
        b.addEventListener('click', async function () {
          await api.saveMistake({ action: 'review', id: b.getAttribute('data-mk-pass'), passed: true });
          api.toast('太棒了！已推至下一遗忘曲线周期');
          draw();
        });
      });
      app.querySelectorAll('[data-mk-fail]').forEach(function (b) {
        b.addEventListener('click', async function () {
          await api.saveMistake({ action: 'review', id: b.getAttribute('data-mk-fail'), passed: false });
          api.toast('已重置复习周期，明天再巩固一遍');
          draw();
        });
      });
      app.querySelectorAll('[data-mk-del]').forEach(function (b) {
        b.addEventListener('click', async function () {
          await api.saveMistake({ action: 'delete', id: b.getAttribute('data-mk-del') });
          api.toast('已删除');
          draw();
        });
      });
    }
    draw();
  }

  /* ==================== 3. 全科中英术语闪卡 ==================== */
  async function renderFlashcards(app) {
    app.innerHTML = '<div class="lh-wrap"><p>正在加载中英术语闪卡…</p></div>';
    var api = window.LioraStudyApi;
    var terms = await api.loadGlossary();
    var st = await api.loadStudy(true);
    var mastery = st.flashcards || {};
    var course = 'all';
    var onlyUnmastered = false;
    var idx = 0;
    var flipped = false;

    function getDeck() {
      return terms.filter(function (t) {
        if (course !== 'all' && t.course !== course) return false;
        if (onlyUnmastered && mastery[t.id] && mastery[t.id].status === 'known') return false;
        return true;
      });
    }

    function draw() {
      var deck = getDeck();
      if (idx >= deck.length) idx = 0;
      var knownCount = terms.filter(function (t) { return mastery[t.id] && mastery[t.id].status === 'known'; }).length;
      var cur = deck[idx];

      var cardHtml = cur ? (
        '<div class="lh-flashcard" id="fcBox" title="点击翻面">' +
          '<div style="margin-bottom:12px"><span class="lh-badge lh-badge-gold">' + esc(courseLabel(cur.course)) + ' · Week ' + esc(cur.week) + '</span> ' +
          '<span class="lh-badge">' + (idx + 1) + ' / ' + deck.length + '</span></div>' +
          '<div class="fc-en">' + esc(cur.en) + '</div>' +
          (flipped
            ? '<div class="fc-zh">' + esc(cur.zh) + '</div><div class="fc-def">' + esc(cur.def) + '</div>'
            : '<div style="color:var(--lh-muted);font-size:13.5px;margin-top:12px">先在脑海里说出中文释义与核心定义，再点击卡片翻面核对 👆</div>') +
        '</div>' +
        '<div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">' +
          '<button class="lh-btn" id="fcPrev">← 上一个</button>' +
          '<button class="lh-btn lh-btn-primary" id="fcKnown">✅ 已掌握</button>' +
          '<button class="lh-btn lh-btn-gold" id="fcReview">🔁 标记待复习</button>' +
          '<button class="lh-btn" id="fcNext">下一个 →</button>' +
        '</div>'
      ) : '<div class="lh-card" style="text-align:center"><p>这一组术语已全部掌握！切换学科或取消「仅看未掌握」可继续复习。</p></div>';

      app.innerHTML = '<div class="lh-wrap">' +
        '<div class="lh-page-hero">' +
          '<h1>🃏 全科中英术语闪卡（共 ' + terms.length + ' 词）</h1>' +
          '<p>全英文授课提分利器：集中掌握 5 门课专业英文术语与中文精准解释。当前已掌握 <b>' + knownCount + ' / ' + terms.length + '</b>。</p>' +
        '</div>' +
        '<div class="lh-tabs">' +
          ['all', 'accounting', 'economics', 'mathematics', 'computing', 'english'].map(function (c) {
            return '<button class="lh-tab' + (course === c ? ' active' : '') + '" data-fc-c="' + c + '">' + (c === 'all' ? '全部学科' : courseLabel(c)) + '</button>';
          }).join('') +
          '<label style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:13.5px;cursor:pointer"><input type="checkbox" id="fcUnm"' + (onlyUnmastered ? ' checked' : '') + '> 仅看未掌握</label>' +
        '</div>' +
        cardHtml +
      '</div>';

      app.querySelectorAll('[data-fc-c]').forEach(function (b) {
        b.addEventListener('click', function () { course = b.getAttribute('data-fc-c'); idx = 0; flipped = false; draw(); });
      });
      var unm = document.getElementById('fcUnm');
      if (unm) unm.addEventListener('change', function () { onlyUnmastered = unm.checked; idx = 0; flipped = false; draw(); });
      var box = document.getElementById('fcBox');
      if (box) box.addEventListener('click', function () { flipped = !flipped; draw(); });
      var prev = document.getElementById('fcPrev');
      if (prev) prev.addEventListener('click', function () { idx = (idx - 1 + deck.length) % deck.length; flipped = false; draw(); });
      var next = document.getElementById('fcNext');
      if (next) next.addEventListener('click', function () { idx = (idx + 1) % deck.length; flipped = false; draw(); });
      var known = document.getElementById('fcKnown');
      if (known && cur) known.addEventListener('click', async function () {
        await api.saveFlashcard(cur.id, 'known');
        mastery[cur.id] = { status: 'known' };
        idx = (idx + 1) % Math.max(1, getDeck().length);
        flipped = false;
        api.toast('已标为掌握');
        draw();
      });
      var rev = document.getElementById('fcReview');
      if (rev && cur) rev.addEventListener('click', async function () {
        await api.saveFlashcard(cur.id, 'review');
        mastery[cur.id] = { status: 'review' };
        idx = (idx + 1) % Math.max(1, deck.length);
        flipped = false;
        api.toast('已标为待复习');
        draw();
      });
    }
    draw();
  }

  /* ==================== 4. 多科闭卷巩固刷题 ==================== */
  async function renderExamPacks(app) {
    app.innerHTML = '<div class="lh-wrap"><p>正在加载多科闭卷刷题包…</p></div>';
    var api = window.LioraStudyApi;
    var data = await api.loadExamPacks();
    var packs = data.packs || [];
    var activePackId = packs[0] ? packs[0].id : '';
    var chosen = {};

    function draw() {
      var pack = packs.find(function (p) { return p.id === activePackId; }) || packs[0];
      var tabs = packs.map(function (p) {
        return '<button class="lh-tab' + (p.id === pack.id ? ' active' : '') + '" data-ep="' + esc(p.id) + '">' + esc(courseLabel(p.course)) + ' · ' + p.questions.length + '题</button>';
      }).join('');

      var correctCnt = 0, answeredCnt = 0;
      pack.questions.forEach(function (q) {
        if (chosen[q.id] !== undefined) {
          answeredCnt++;
          if (chosen[q.id] === q.answer) correctCnt++;
        }
      });

      var qHtml = pack.questions.map(function (q, i) {
        var picked = chosen[q.id];
        var optsHtml = q.options.map(function (o, oi) {
          var bg = '#fff', bd = 'var(--lh-line)';
          if (picked !== undefined) {
            if (oi === q.answer) { bg = 'var(--lh-green-bg)'; bd = 'var(--lh-green)'; }
            else if (oi === picked && oi !== q.answer) { bg = 'var(--lh-red-bg)'; bd = 'var(--lh-red)'; }
          }
          return '<button class="lh-btn" style="justify-content:flex-start;text-align:left;width:100%;margin-bottom:7px;background:' + bg + ';border-color:' + bd + '" data-q="' + esc(q.id) + '" data-opt="' + oi + '">' +
            '<b>' + String.fromCharCode(65 + oi) + '.</b> ' + esc(o) + '</button>';
        }).join('');
        var expHtml = picked !== undefined ? (
          '<div style="margin-top:8px;padding:10px 12px;border-radius:9px;background:var(--lh-navy-050);font-size:13.5px;line-height:1.7">' +
            '<b>' + (picked === q.answer ? '✅ 回答正确！' : '❌ 回答有误（正解 ' + String.fromCharCode(65 + q.answer) + '）') + '</b><br>' +
            esc(q.explanation) +
            '<div style="margin-top:8px"><button class="lh-btn lh-btn-sm lh-btn-gold" data-add-mk="' + esc(q.id) + '">🔁 收入错题本（1/3/7天复习）</button></div>' +
          '</div>'
        ) : '';
        return '<div class="lh-card" style="margin-bottom:14px">' +
          '<div style="margin-bottom:8px"><span class="lh-badge lh-badge-gold">第 ' + (i + 1) + ' 题</span> <span class="lh-badge">' + esc(q.topic) + '</span> <span class="lh-badge">' + esc(q.errorTag) + '</span></div>' +
          '<div style="font-size:15px;font-weight:600;margin-bottom:12px;line-height:1.6">' + esc(q.prompt) + '</div>' +
          optsHtml + expHtml +
        '</div>';
      }).join('');

      app.innerHTML = '<div class="lh-wrap">' +
        '<div class="lh-page-hero">' +
          '<h1>🎯 多科闭卷巩固刷题（支持一键入错题本）</h1>' +
          '<p>' + esc(data.note) + '</p>' +
        '</div>' +
        '<div class="lh-tabs">' + tabs +
          '<a class="lh-btn lh-btn-gold" style="margin-left:auto" href="exam-prep.html">会计 U1–U6 官方引文题库 (496题) →</a>' +
        '</div>' +
        '<div class="lh-card" style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">' +
          '<div><b>' + esc(pack.title) + '</b> · 已答 ' + answeredCnt + '/' + pack.questions.length + ' · 正确 ' + correctCnt + '</div>' +
          '<button class="lh-btn lh-btn-sm" id="epReset">重置本组答题</button>' +
        '</div>' +
        qHtml +
      '</div>';

      app.querySelectorAll('[data-ep]').forEach(function (b) {
        b.addEventListener('click', function () { activePackId = b.getAttribute('data-ep'); draw(); });
      });
      var reset = document.getElementById('epReset');
      if (reset) reset.addEventListener('click', function () {
        pack.questions.forEach(function (q) { delete chosen[q.id]; });
        draw();
      });
      app.querySelectorAll('[data-q]').forEach(function (b) {
        b.addEventListener('click', function () {
          var qid = b.getAttribute('data-q');
          if (chosen[qid] !== undefined) return;
          chosen[qid] = Number(b.getAttribute('data-opt'));
          draw();
        });
      });
      app.querySelectorAll('[data-add-mk]').forEach(function (b) {
        b.addEventListener('click', async function () {
          var qid = b.getAttribute('data-add-mk');
          var q = pack.questions.find(function (x) { return x.id === qid; });
          if (!q) return;
          await api.saveMistake({
            course: pack.course,
            topic: q.topic,
            errorTag: q.errorTag,
            prompt: q.prompt,
            myAnswer: chosen[qid] !== undefined ? q.options[chosen[qid]] : '',
            correctAnswer: q.options[q.answer],
            note: q.explanation,
            sourceHref: '#/exam-packs'
          });
          api.toast('已收入全科错题本，明天提醒复习！');
        });
      });
    }
    draw();
  }

  /* ==================== 5. 我的全站 4 色高光与批注汇总 ==================== */
  async function renderAnnotations(app) {
    app.innerHTML = '<div class="lh-wrap"><p>正在加载个人高光与批注集…</p></div>';
    var api = window.LioraStudyApi;
    var filterCourse = 'all';
    var filterColor = 'all';

    var colorMeta = {
      yellow: { label: '🟡 重点黄', bd: '#eab308', bg: 'rgba(253, 224, 71, 0.25)' },
      green:  { label: '🟢 掌握绿', bd: '#22c55e', bg: 'rgba(134, 239, 172, 0.25)' },
      blue:   { label: '🔵 英文蓝', bd: '#3b82f6', bg: 'rgba(147, 197, 253, 0.25)' },
      pink:   { label: '🩷 易错粉', bd: '#ec4899', bg: 'rgba(249, 168, 212, 0.28)' }
    };
    function normClr(c) {
      if (c === 'gold' || !c) return 'yellow';
      if (c === 'rose') return 'pink';
      return colorMeta[c] ? c : 'yellow';
    }

    async function draw() {
      var st = await api.loadStudy(true);
      var all = st.annotations || [];
      var list = all.filter(function (a) {
        var okCourse = filterCourse === 'all' || a.course === filterCourse;
        var okColor = filterColor === 'all' || normClr(a.color) === filterColor;
        return okCourse && okColor;
      });

      var html = list.length ? list.map(function (a) {
        var c = normClr(a.color);
        var cm = colorMeta[c];
        return '<div class="lh-card" style="margin-bottom:12px;border-left:5px solid ' + cm.bd + '">' +
          '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px;align-items:center">' +
            '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
              '<span class="lh-badge" style="background:' + cm.bg + ';color:#0f2744;border:1px solid ' + cm.bd + '">' + cm.label + '</span>' +
              '<span class="lh-badge lh-badge-gold">' + esc(courseLabel(a.course)) + '</span> ' +
              '<span style="font-weight:600;color:var(--lh-navy-800)">' + esc(a.title || a.route) + '</span>' +
            '</div>' +
            '<span style="font-size:12px;color:var(--lh-muted)">' + fmtDate(a.updatedAt || a.createdAt) + '</span>' +
          '</div>' +
          (a.quote ? '<blockquote style="margin:6px 0;padding:8px 12px;background:' + cm.bg + ';border-left:3px solid ' + cm.bd + ';border-radius:6px;font-size:13.5px;line-height:1.65">' + esc(a.quote) + '</blockquote>' : '') +
          (a.note ? '<div style="font-size:14px;line-height:1.7;margin-top:6px">📝 ' + esc(a.note) + '</div>' : '') +
          '<div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
            '<button class="lh-btn lh-btn-sm lh-btn-primary" data-an-jump="' + esc(a.id) + '" data-an-route="' + esc(a.route || '#/') + '">📍 回到原文定位 →</button>' +
            '<button class="lh-btn lh-btn-danger lh-btn-sm" data-an-del="' + esc(a.id) + '">🗑 擦除高光</button>' +
          '</div>' +
        '</div>';
      }).join('') : '<div class="lh-card"><p style="color:var(--lh-muted);margin:0">当前筛选下还没有高光记录。在网站<b>任意页面</b>用鼠标或手指选中一段文字，就会弹出 <b>4 色荧光笔工具条</b>，点一下颜色就能永久保存并跨设备同步到这里！</p></div>';

      app.innerHTML = '<div class="lh-wrap">' +
        '<div class="lh-page-hero">' +
          '<h1>🖍️ 我的全站高光与个人批注集</h1>' +
          '<p>本账号已累计保存 <b>' + all.length + '</b> 条永久高光与批注（仅自己可见，支持一键跳回原文并闪烁定位）。</p>' +
        '</div>' +
        '<div class="lh-tabs" style="margin-bottom:8px">' +
          ['all', 'yellow', 'green', 'blue', 'pink'].map(function (clr) {
            return '<button class="lh-tab' + (filterColor === clr ? ' active' : '') + '" data-an-clr="' + clr + '">' + (clr === 'all' ? '全部颜色' : colorMeta[clr].label) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="lh-tabs">' +
          ['all', 'accounting', 'economics', 'mathematics', 'computing', 'english', 'reading', 'general'].map(function (c) {
            var lbl = c === 'all' ? '全部学科' : (c === 'reading' ? '读书' : (c === 'general' ? '其他页面' : courseLabel(c)));
            return '<button class="lh-tab' + (filterCourse === c ? ' active' : '') + '" data-an-c="' + c + '">' + lbl + '</button>';
          }).join('') +
          '<button class="lh-btn" style="margin-left:auto" onclick="window.print()">🖨️ 打印高光汇总</button>' +
        '</div>' +
        html +
      '</div>';

      app.querySelectorAll('[data-an-clr]').forEach(function (b) {
        b.addEventListener('click', function () { filterColor = b.getAttribute('data-an-clr'); draw(); });
      });
      app.querySelectorAll('[data-an-c]').forEach(function (b) {
        b.addEventListener('click', function () { filterCourse = b.getAttribute('data-an-c'); draw(); });
      });
      app.querySelectorAll('[data-an-jump]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-an-jump');
          var rt = b.getAttribute('data-an-route') || '#/';
          try { sessionStorage.setItem('lh_jump_hl', id); } catch (e) {}
          if (rt.indexOf('#') === 0) location.hash = rt;
          else location.href = rt;
        });
      });
      app.querySelectorAll('[data-an-del]').forEach(function (b) {
        b.addEventListener('click', async function () {
          await api.saveAnnotation({ action: 'delete', id: b.getAttribute('data-an-del') });
          api.toast('已擦除高光');
          draw();
        });
      });
    }
    draw();
  }

  window.LioraStudyViews = {
    renderHandbooks: renderHandbooks,
    renderMistakes: renderMistakes,
    renderFlashcards: renderFlashcards,
    renderExamPacks: renderExamPacks,
    renderAnnotations: renderAnnotations
  };
})();
