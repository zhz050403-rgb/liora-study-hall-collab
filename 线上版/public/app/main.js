/* Liora 学习小屋 · 主路由与全局交互（零旧外挂冲突、唯一收纳浮条、划词批注、全局搜索） */
(function () {
  'use strict';

  var boot = window.__CLOUD_BOOT__ || {};
  if (boot.personalMode !== false) document.body.classList.add('lh-personal-mode');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 1. 顶部全局搜索 ---------- */
  function initSearch() {
    var inp = document.getElementById('edSearchInput');
    var pop = document.getElementById('edSearchPop');
    if (!inp || !pop) return;
    var timer = null;
    inp.addEventListener('input', function () {
      clearTimeout(timer);
      var q = inp.value.trim();
      if (!q) { pop.classList.remove('open'); return; }
      timer = setTimeout(async function () {
        var hits = await window.LioraStore.searchAll(q);
        if (!hits.length) {
          pop.innerHTML = '<div style="padding:14px;font-size:13px;color:var(--muted);text-align:center">没有匹配内容，换个关键词试试</div>';
        } else {
          pop.innerHTML = hits.map(function (h) {
            return '<a class="ed-sr-item" href="' + esc(h.href) + '"><div class="ed-sr-t">' + esc(h.title) + '</div><div class="ed-sr-s">' + esc(h.sub) + '</div></a>';
          }).join('');
        }
        pop.classList.add('open');
      }, 150);
    });
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.ed-search-wrap')) pop.classList.remove('open');
    });
    pop.addEventListener('click', function () { pop.classList.remove('open'); inp.value = ''; });
  }

  /* ---------- 2. 划词高亮 / 记批注 ---------- */
  function initSelectionAnnotator() {
    if (document.getElementById('lh-sel-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'lh-sel-bar';
    bar.innerHTML = '<button id="lhSelHl">🖍️ 标为高亮</button><button id="lhSelNote">📝 高亮+写批注</button>';
    document.body.appendChild(bar);

    var currentText = '';
    document.addEventListener('mouseup', function () {
      var h = location.hash || '';
      if (!/^#\/(?:c|book)\//.test(h)) { bar.style.display = 'none'; return; }
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
      var h = location.hash || '';
      if (!currentText) return;
      var parts = h.replace(/^#\//, '').split('/');
      var course = parts[1] || 'general';
      var note = askNote ? (window.prompt('给这段高亮写一句批注：', '') || '') : '';
      var h1 = document.querySelector('#app h1');
      await window.LioraStudyApi.saveAnnotation({
        route: h,
        course: course,
        title: (h1 && h1.textContent.trim().slice(0, 80)) || h,
        kind: askNote ? 'note' : 'highlight',
        quote: currentText,
        note: note
      });
      window.LioraStudyApi.toast('已保存到「我的批注集」');
    }

    document.getElementById('lhSelHl').addEventListener('click', function () { saveSel(false); });
    document.getElementById('lhSelNote').addEventListener('click', function () { saveSel(true); });
  }

  /* ---------- 3. 全站右下角唯一收纳悬浮工具条 ---------- */
  function initDock() {
    if (document.getElementById('lh-dock')) return;
    var dock = document.createElement('div');
    dock.id = 'lh-dock';
    dock.setAttribute('role', 'toolbar');
    dock.setAttribute('aria-label', '个人学习快捷工具条');
    dock.innerHTML =
      '<button id="lhDockPomo" title="番茄钟">🍅 <span id="lhPomoLbl">25:00</span></button>' +
      '<button id="lhDockFocus" title="一键专注阅读模式">📖 专注</button>' +
      '<button id="lhDockFont" title="切换字号（小/中/大）">Aa</button>' +
      '<button id="lhDockBackup" title="数据备份与设置">💾 备份</button>' +
      '<button id="lhDockAI" class="lh-dock-ai" title="统一 AI 伴学与批改">🤖 AI 伴学</button>';
    document.body.appendChild(dock);

    /* Drawer A: 番茄钟 */
    var pomoDrawer = document.createElement('div');
    pomoDrawer.className = 'lh-drawer';
    pomoDrawer.innerHTML =
      '<div class="lh-drawer-head"><h3>🍅 专注番茄钟</h3><button class="lh-btn lh-btn-sm" data-close>关闭</button></div>' +
      '<div class="lh-drawer-body" style="text-align:center">' +
        '<div id="lhPomoBig" style="font-family:var(--serif);font-size:44px;font-weight:700;color:var(--navy-900);margin:8px 0">25:00</div>' +
        '<input id="lhPomoTask" class="lh-input" style="width:100%;margin-bottom:10px" placeholder="本轮专注目标（如：会计 U4 折扣分录）">' +
        '<div style="display:flex;justify-content:center;gap:8px;margin-bottom:12px">' +
          '<button class="lh-btn lh-btn-sm" data-pm="15">15 分钟</button>' +
          '<button class="lh-btn lh-btn-sm" data-pm="25">25 分钟</button>' +
          '<button class="lh-btn lh-btn-sm" data-pm="45">45 分钟</button>' +
        '</div>' +
        '<div style="display:flex;justify-content:center;gap:10px">' +
          '<button class="lh-btn lh-btn-primary" id="lhPomoStart">▶ 开始专注</button>' +
          '<button class="lh-btn" id="lhPomoReset">重置</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(pomoDrawer);

    /* Drawer B: 统一 AI 伴学 */
    var aiDrawer = document.createElement('div');
    aiDrawer.className = 'lh-drawer';
    aiDrawer.innerHTML =
      '<div class="lh-drawer-head"><h3>🤖 统一 AI 伴学助手</h3><button class="lh-btn lh-btn-sm" data-close>关闭</button></div>' +
      '<div class="lh-drawer-body">' +
        '<div id="lhAiStatus" style="font-size:12px;color:var(--muted);margin-bottom:8px">正在检测 AI 通道状态…</div>' +
        '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">' +
          '<button class="lh-btn lh-btn-sm lh-btn-primary" data-am="socratic">苏格拉底引导</button>' +
          '<button class="lh-btn lh-btn-sm" data-am="direct">直接给步骤答案</button>' +
          '<button class="lh-btn lh-btn-sm" data-am="grade">作业批改入档</button>' +
        '</div>' +
        '<div id="lhAiMsgs" class="lh-ai-msgs"><div class="lh-ai-msg bot">你好！我会自动结合你的 UNSW 学习档案和当前页面内容答疑、拆题或批改作业。</div></div>' +
        '<textarea id="lhAiInput" class="lh-textarea" style="min-height:54px" placeholder="输入问题或粘贴作业内容（Ctrl/Cmd+Enter 发送）…"></textarea>' +
        '<div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">' +
          '<a href="ai-console.html" style="font-size:12px;color:var(--muted)">⚙️ 配置个人 API 密钥</a>' +
          '<button class="lh-btn lh-btn-primary" id="lhAiSend">发送</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(aiDrawer);

    /* Drawer C: 一键备份与进阶入口 */
    var bkDrawer = document.createElement('div');
    bkDrawer.className = 'lh-drawer';
    bkDrawer.innerHTML =
      '<div class="lh-drawer-head"><h3>💾 个人数据备份与管理</h3><button class="lh-btn lh-btn-sm" data-close>关闭</button></div>' +
      '<div class="lh-drawer-body">' +
        '<p style="font-size:13.5px;color:var(--ink-2);margin-top:0">一键导出你的<b>全部学习进度、错题本、笔记批注、成绩簿、术语掌握度与专注记录</b>，换设备随时无损恢复。</p>' +
        '<div style="display:flex;flex-direction:column;gap:9px">' +
          '<a class="lh-btn lh-btn-primary" href="/__api/backup/export">⬇️ 下载全站学习备份 (.json)</a>' +
          '<label class="lh-btn" style="cursor:pointer">⬆️ 从 JSON 备份恢复 <input type="file" id="lhRestore" accept="application/json" style="display:none"></label>' +
          '<hr style="border:none;border-top:1px solid var(--line);margin:4px 0">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<a class="lh-btn lh-btn-sm" href="guide.html">📖 学习方法</a>' +
            '<a class="lh-btn lh-btn-sm" href="todo.html">✅ 桌面待办</a>' +
            '<a class="lh-btn lh-btn-sm" href="ai-console.html">🔑 AI 设置</a>' +
            '<a class="lh-btn lh-btn-sm" href="board-editor.html">🧩 内容编辑</a>' +
            '<a class="lh-btn lh-btn-sm" href="admin.html">👤 账号后台</a>' +
            '<a class="lh-btn lh-btn-sm" href="/__logout">退出登录</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bkDrawer);

    function closeAll() { [pomoDrawer, aiDrawer, bkDrawer].forEach(function (d) { d.classList.remove('open'); }); }
    function toggle(t) { var was = t.classList.contains('open'); closeAll(); if (!was) t.classList.add('open'); }
    document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeAll); });

    /* 番茄钟 */
    var total = 25 * 60, left = total, timer = null;
    function fmt(sec) { return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); }
    function syncP() { var s = fmt(left); document.getElementById('lhPomoLbl').textContent = s; document.getElementById('lhPomoBig').textContent = s; }
    document.getElementById('lhDockPomo').addEventListener('click', function () { toggle(pomoDrawer); });
    pomoDrawer.querySelectorAll('[data-pm]').forEach(function (b) {
      b.addEventListener('click', function () {
        clearInterval(timer); timer = null;
        total = Number(b.getAttribute('data-pm')) * 60; left = total;
        document.getElementById('lhPomoStart').textContent = '▶ 开始专注'; syncP();
      });
    });
    document.getElementById('lhPomoStart').addEventListener('click', function () {
      var btn = document.getElementById('lhPomoStart');
      if (timer) { clearInterval(timer); timer = null; btn.textContent = '▶ 继续专注'; return; }
      btn.textContent = '⏸ 暂停';
      timer = setInterval(async function () {
        left--; syncP();
        if (left <= 0) {
          clearInterval(timer); timer = null; btn.textContent = '▶ 开始专注';
          var mins = Math.round(total / 60);
          var task = (document.getElementById('lhPomoTask').value || '').trim();
          await window.LioraStudyApi.saveFocus({ minutes: mins, course: 'general', task: task || '番茄钟专注' }).catch(function () {});
          window.LioraStudyApi.toast('🎉 完成 ' + mins + ' 分钟专注，已自动记入学习档案');
          left = total; syncP();
        }
      }, 1000);
    });
    document.getElementById('lhPomoReset').addEventListener('click', function () {
      clearInterval(timer); timer = null; left = total;
      document.getElementById('lhPomoStart').textContent = '▶ 开始专注'; syncP();
    });

    /* 专注模式 & 字体三档（标准克制：14.5 / 15.5 / 17.5px） */
    var focusBtn = document.getElementById('lhDockFocus');
    focusBtn.addEventListener('click', function () {
      var on = document.body.classList.toggle('ed-focus');
      focusBtn.classList.toggle('active', on);
      window.LioraStudyApi.toast(on ? '已开启专注阅读模式' : '已退出专注模式');
    });
    var fontClasses = ['font-sm', 'font-md', 'font-lg'];
    var fontLabels = ['紧凑字号 (14.5px)', '标准字号 (15.5px)', '舒适大字 (17.5px)'];
    var fIdx = Number(localStorage.getItem('liora-ed-font') || 1);
    if (!fontClasses[fIdx]) fIdx = 1;
    document.body.classList.add(fontClasses[fIdx]);
    document.getElementById('lhDockFont').addEventListener('click', function () {
      document.body.classList.remove(fontClasses[fIdx]);
      fIdx = (fIdx + 1) % fontClasses.length;
      document.body.classList.add(fontClasses[fIdx]);
      try { localStorage.setItem('liora-ed-font', String(fIdx)); } catch (e) {}
      window.LioraStudyApi.toast('已切换：' + fontLabels[fIdx]);
    });

    /* 备份恢复 */
    document.getElementById('lhDockBackup').addEventListener('click', function () { toggle(bkDrawer); });
    document.getElementById('lhRestore').addEventListener('change', function (ev) {
      var f = ev.target.files && ev.target.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = async function () {
        try {
          await window.LioraStudyApi.importBackup(JSON.parse(String(rd.result || '{}')));
          window.LioraStudyApi.toast('✅ 恢复成功，正在刷新…');
          setTimeout(function () { location.reload(); }, 800);
        } catch (e) { window.LioraStudyApi.toast('恢复失败：' + (e.message || '格式错误')); }
      };
      rd.readAsText(f, 'utf-8');
    });

    /* AI 抽屉与通道自检 */
    var aiMode = 'socratic', aiHist = [], pinged = false;
    document.getElementById('lhDockAI').addEventListener('click', function () {
      toggle(aiDrawer);
      if (!pinged) {
        pinged = true;
        fetch('/__api/ai/ping', { credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            var el = document.getElementById('lhAiStatus');
            if (!el) return;
            if (j && j.ready) el.innerHTML = '🟢 服务端个人 AI 已就绪（' + esc(j.model || j.provider) + '）';
            else if (window.cloudLLM) el.innerHTML = '🟡 当前走云端默认 AI；如需个人密钥可点下方「⚙️ 配置个人 API 密钥」';
            else el.innerHTML = '⚪ 尚未配置 API 密钥：点下方「⚙️ 配置个人 API 密钥」2 步启用';
          }).catch(function () {});
      }
    });
    aiDrawer.querySelectorAll('[data-am]').forEach(function (b) {
      b.addEventListener('click', function () {
        aiMode = b.getAttribute('data-am');
        aiDrawer.querySelectorAll('[data-am]').forEach(function (x) { x.classList.toggle('lh-btn-primary', x === b); });
      });
    });
    async function sendAi() {
      var inp = document.getElementById('lhAiInput');
      var q = (inp.value || '').trim(); if (!q) return;
      inp.value = '';
      var box = document.getElementById('lhAiMsgs');
      var u = document.createElement('div'); u.className = 'lh-ai-msg user'; u.textContent = q; box.appendChild(u);
      var b = document.createElement('div'); b.className = 'lh-ai-msg bot'; b.textContent = '思考中…'; box.appendChild(b);
      box.scrollTop = box.scrollHeight;
      var h1 = (document.querySelector('#app h1') || {}).textContent || '';
      var acc = '';
      try {
        var full = await window.LioraStudyApi.askAI({
          question: q, mode: aiMode, context: '路由:' + (location.hash || '#/') + ' 标题:' + h1.trim(),
          history: aiHist,
          onDelta: function (d) { acc += d; b.textContent = acc; box.scrollTop = box.scrollHeight; }
        });
        var finalTxt = acc || full || '';
        b.textContent = finalTxt;
        aiHist.push({ role: 'user', content: q }, { role: 'assistant', content: finalTxt.slice(0, 1200) });
        var g = window.LioraStudyApi.parseGradeBlock(finalTxt);
        if (g) {
          var btn = document.createElement('button');
          btn.className = 'lh-btn lh-btn-gold lh-btn-sm';
          btn.style.marginTop = '8px';
          btn.textContent = '✅ 一键存入成绩档案 (' + g.score + '/' + g.maxScore + ')';
          btn.addEventListener('click', async function () {
            await window.LioraStudyApi.saveGrade(g);
            btn.disabled = true; btn.textContent = '✅ 已存入学习档案';
            window.LioraStudyApi.toast('成绩已写入档案');
          });
          b.appendChild(document.createElement('br'));
          b.appendChild(btn);
        }
      } catch (e) { b.textContent = '⚠️ ' + (e.message || '调用失败'); }
    }
    document.getElementById('lhAiSend').addEventListener('click', sendAi);
    document.getElementById('lhAiInput').addEventListener('keydown', function (ev) {
      if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') { ev.preventDefault(); sendAi(); }
    });
  }

  /* ---------- 4. 路由总分发 ---------- */
  function highlightNav(hash) {
    var target = '#/';
    if (hash.startsWith('#/courses') || hash.startsWith('#/c/')) target = hash.startsWith('#/c/extracurricular') ? '#/extra' : '#/courses';
    else if (hash.startsWith('#/extra')) target = '#/extra';
    else if (hash.startsWith('#/reading') || hash.startsWith('#/book/')) target = '#/reading';
    else if (hash.startsWith('#/handbooks')) target = '#/handbooks';
    else if (hash.startsWith('#/mistakes') || hash.startsWith('#/exam-packs') || hash.startsWith('#/flashcards')) target = '#/mistakes';
    else if (hash.startsWith('#/prep') || hash.startsWith('#/profile')) target = '#/prep';
    document.querySelectorAll('#edMainNav a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === target);
    });
  }

  async function route() {
    var hash = location.hash || '#/';
    if (hash === '#' || hash === '') hash = '#/';
    var app = document.getElementById('app');
    if (!app) return;
    highlightNav(hash);
    window.scrollTo(0, 0);

    var parts = hash.replace(/^#\//, '').split('/').filter(Boolean);
    var p0 = parts[0] || '';
    try {
      if (!p0) return await window.LioraViewsHome.renderHome(app);
      if (p0 === 'courses') return await window.LioraViewsHome.renderCourses(app);
      if (p0 === 'extra') return await window.LioraViewsHome.renderExtra(app);
      if (p0 === 'c' && parts[1]) return await window.LioraViewsCourse.renderCourse(app, parts[1], parts[2], parts[3]);
      if (p0 === 'reading') return await window.LioraViewsReading.renderReadingShelf(app);
      if (p0 === 'book' && parts[1]) return await window.LioraViewsReading.renderBookReader(app, parts[1], parts[2] || 1);
      if (p0 === 'read' && parts[1]) return await window.LioraViewsReading.renderBookReader(app, parts[1], parts[3] || 1);
      if (p0 === 'prep' || p0 === 'plan') return window.LioraViewsPrep.renderPrep(app);
      if (p0 === 'profile') return await window.LioraViewsPrep.renderProfile(app);
      if (p0 === 'handbooks') return await window.LioraStudyViews.renderHandbooks(app, parts[1] || '');
      if (p0 === 'mistakes') return await window.LioraStudyViews.renderMistakes(app);
      if (p0 === 'flashcards') return await window.LioraStudyViews.renderFlashcards(app);
      if (p0 === 'exam-packs') return await window.LioraStudyViews.renderExamPacks(app);
      if (p0 === 'annotations') return await window.LioraStudyViews.renderAnnotations(app);
      return await window.LioraViewsHome.renderHome(app);
    } catch (e) {
      app.innerHTML = '<div class="ed-container"><div class="ed-card">页面渲染异常：' + esc(e && e.message) + ' · <a href="#/">返回首页</a></div></div>';
    }
  }

  function bootApp() {
    initSearch();
    initSelectionAnnotator();
    initDock();
    window.addEventListener('hashchange', route);
    route();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootApp);
  else bootApp();
})();
