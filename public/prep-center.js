/* ============================================================
 * 备考中心（Prep Center）— 主站内部路由 #/prep
 * 将「复习排期 + 作业批改 + 学习档案·薄弱点」三块收进主站单页，
 * 保留顶部导航栏，样式作用域化（pp- 前缀），数据来自 prep-data.js。
 * 记录读写自包含（ppLoadRecords / ppSaveRecords，同一 localStorage 键）。
 * v2：① 每张卡带「怎么做」具体步骤 ② 支持任务延后（顺延到下一天 / 一键延到今天），
 *     延后状态存 localStorage（liora-prep-postpone-v1），不改动原始排期数据。
 * ============================================================ */

/* ---------- 全局状态 ---------- */
var PP = window.PP || {};
PP.done = {};
try { PP.done = JSON.parse(localStorage.getItem("liora-review-calendar-v1") || "{}"); } catch (e) { PP.done = {}; }
PP.postpone = {};   /* 延后状态：{ "原日期#序号": 延后天数 } */
try { PP.postpone = JSON.parse(localStorage.getItem("liora-prep-postpone-v1") || "{}"); } catch (e) { PP.postpone = {}; }
PP.onlyUndone = false;
PP.onlyCore = false;   /* 只看必做（隐藏「有余力再做」区） */
PP.WB_FILES = [];

function ppTodayStr(){
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function ppSave(){ try { localStorage.setItem("liora-review-calendar-v1", JSON.stringify(PP.done)); } catch (e) {} }
function ppSavePost(){ try { localStorage.setItem("liora-prep-postpone-v1", JSON.stringify(PP.postpone)); } catch (e) {} }
/* 日期字符串 + n 天 → 新日期字符串（用 UTC 计算，避免夏令时干扰） */
function ppShift(dateStr, n){
  var p = dateStr.split("-");
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  d.setUTCDate(d.getUTCDate() + n);
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}
/* 两个日期字符串相差天数（b - a） */
function ppDiffDays(a, b){ return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000); }
function ppExamLeft(){
  var t = new Date(); t.setHours(0, 0, 0, 0);
  var e = new Date((window.PREP_DATA && window.PREP_DATA.exam || "2027-01-25") + "T00:00:00");
  return Math.round((e - t) / 86400000);
}
function ppEsc(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/* 本地记录保存：同时写 localStorage 与 window.PORTAL_RECORDS，
   确保主站档案页（会合并 PORTAL_RECORDS）与备考中心读到同一份 */
function ppSaveRecords(recs){
  try { localStorage.setItem("xinnan-portal-records-v1", JSON.stringify(recs)); } catch (e) {}
  if (Array.isArray(recs)) { try { window.PORTAL_RECORDS = recs.slice(); } catch (e) {} }
}
/* 本地记录读取：优先 localStorage，回退 records.js 种子（与主站档案页逻辑一致） */
function ppLoadRecords(){
  try {
    var raw = localStorage.getItem("xinnan-portal-records-v1");
    if (raw) { var a = JSON.parse(raw); if (Array.isArray(a)) return a; }
  } catch (e) {}
  return (window.PORTAL_RECORDS || []).slice();
}

/* ---------- 主路由：渲染整页到 #app ---------- */
function renderPrepCenter(){
  var DATA = window.PREP_DATA;
  var app = document.getElementById("app");
  if (!DATA || !DATA.days) {
    app.innerHTML = '<div class="container"><div class="crumb"><a data-nav="#/">首页</a><span class="sep">/</span><span>复习计划</span></div>'
      + '<div class="container loading" style="padding:40px 0">备考数据（prep-data.js）未加载。<br>请确认 <code>prep-data.js</code> 与 <code>prep-center.js</code> 已放入网站目录。</div></div>';
    return;
  }

  var spInline = (typeof renderStudyPlanInline === "function") ? renderStudyPlanInline() : "";
  var html = '<section class="academy-masthead cabin-light prep-masthead section-banner"><div class="container"><h1>复习计划</h1><p>考试倒计时 · 复习排期 · 作业批改 · 学习档案</p></div></section>' +
    '<div class="pp-plan-box" id="ppPlanBox">' + (spInline || '') + '</div>' +
    '<div class="pp-dashboard"><div class="pp-overview">' +
    '<section class="pp-summary"><h2>考试倒计时</h2><strong id="ppKLeft">—</strong><p id="ppKDay">—</p></section>' +
    '<section class="pp-summary"><h2>今日安排</h2><strong id="ppKToday">—</strong>' +
    '</section>' +
    '<section class="pp-summary"><h2>复习进度</h2><strong id="ppKDone">—</strong>' +
    '<div class="pp-bar"><i id="ppPbar"></i></div><p id="ppPtxt">完成率 0%</p></section></div>';

  /* ===== 工具栏 ===== */
  html += '<div class="pp-toolbar">'
    + ''
    + '<select id="ppFCourse"><option value="">全部课程</option></select>'
    + '<select id="ppFPhase"><option value="">全部阶段</option></select>'
    + '<button class="pp-btn" id="ppBtnCore">只看必做</button>'
    + '<button class="pp-btn" id="ppBtnToggle">只看未完成</button>'
    + '<button class="pp-btn" id="ppBtnExport">导出打卡</button>'
    + '<button class="pp-btn" id="ppBtnImport">导入打卡</button>'
    + '<input type="file" id="ppFileIn" accept=".json" style="display:none">'
    + '<span class="pp-hint">勾选与延后状态只存在本机浏览器，建议每周导出一次备份</span>'
    + '</div>';

  html += '<div class="pp-dashboard-grid"><section class="pp-schedule"><h2>复习排期</h2><div id="ppWeeks"></div></section>';

  /* ===== 两个面板：作业批改 + 学习档案 ===== */
  var courseOpts = (DATA.courseCn ? Object.keys(DATA.courseCn) : []).map(function(id){
    return '<option value="' + id + '">' + ppEsc(DATA.courseCn[id]) + '</option>';
  }).join("");

  html += '<div class="pp-panels">'
    /* 作业批改面板 */
    + '<div class="pp-panel"><div class="pp-panel-h"><h3>✍️ 作业批改 <span class="pp-pill" id="ppRecCount">0</span></h3>'
    + '<div class="pp-sub">在本页直接提交作业 / 练习 / 模考，AI 逐题批改后自动记入本页与「学习档案」。成绩与薄弱点用同一份数据，三处实时同步。</div></div>'
    + '<div class="pp-wb"><div class="pp-wb-h">📝 提交作业 / 考试成绩（AI 批改后自动入档）</div>'
    + '<div class="pp-wb-grid">'
    + '<div><label>课程</label><select id="ppWbCourse">' + courseOpts + '</select></div>'
    + '<div><label>周次（选填）</label><input id="ppWbWeek" type="number" min="1" max="20" placeholder="如 5"></div>'
    + '<div><label>名称（必填）</label><input id="ppWbTitle" type="text" placeholder="如 Unit 3 Worksheet / 期中"></div>'
    + '<div><label>类型</label><select id="ppWbType"><option value="practice">练习 / 作业</option><option value="quiz">测验</option><option value="exam">考试</option></select></div>'
    + '</div>'
    + '<div class="pp-dropzone" id="ppWbDrop">📎 拖放文件到此处，或点击选择（PDF / Word / 图片，可多份）<input id="ppWbFiles" type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" style="display:none"><div id="ppWbFileList"></div></div>'
    + '<textarea id="ppWbText" class="pp-wb-text" placeholder="或直接粘贴作业内容 / 题目 / 你的作答文字…"></textarea>'
    + '<input class="pp-wb-weak" id="ppWbWeak" type="text" placeholder="薄弱点（选填，逗号分隔，如 调整分录,弹性）">'
    + '<div class="pp-wb-submit"><button class="pp-btn pp-btn-navy" id="ppWbGo">提交并让 AI 分析</button><button class="pp-btn" id="ppWbLogOnly" title="不调用 AI，只把本次提交记入档案">仅记录，不调 AI</button><span class="pp-wb-note">提交后成绩与薄弱点自动记入本页与「学习档案」。</span></div>'
    + '<div class="pp-sub-result" id="ppWbResult"></div></div>'
    + '<div id="ppRecList"></div>'
    + '<div class="pp-btn-row"><a class="pp-link pp-link-ghost" data-nav="#/assistant">也用主站批改页 →</a><a class="pp-link pp-link-ghost" data-nav="#/profile">打开主站学习档案 →</a></div>'
    + '</div>'
    /* 学习档案面板 */
    + '<div class="pp-panel"><div class="pp-panel-h"><h3>🎯 学习档案 · 薄弱点 <span class="pp-pill" id="ppWeakCount">0</span></h3>'
    + '<div class="pp-sub">最近批改中出现的薄弱知识点（按出现次数排序）。周 / 任务进度：<b id="ppPWeeks">0/0</b> 周已完成 · <b id="ppPTasks">0/0</b> 任务已完成。</div></div>'
    + '<div id="ppWeakTags"></div>'
    + '<div class="pp-btn-row"><a class="pp-link pp-link-go" data-nav="#/profile">打开主站学习档案 →</a></div>'
    + '</div>'
    + '</div>';

  html += '</div></div>';   /* dashboard grid and container */
  app.innerHTML = html;

  /* ============================================================
   * 2026-11-07 布局：今日复习置顶 + 左侧导航 + 稍长内容全部折叠
   * 只做 DOM 重组，不改动任何 id 与事件绑定；.pp-dashboard 类名必须保留，
   * 否则 prep-center.css 里大量 ".pp-dashboard .xxx" 后代选择器会全部失效。
   * ============================================================ */
  var dashboard = app.querySelector(".pp-dashboard");
  var masthead  = app.querySelector(".prep-masthead");
  var planBox   = app.querySelector("#ppPlanBox");
  var overview  = app.querySelector(".pp-overview");
  var toolbar   = app.querySelector(".pp-toolbar");
  var grid      = app.querySelector(".pp-dashboard-grid");
  var panels    = app.querySelector(".pp-panels");
  var schedH2   = app.querySelector(".pp-schedule > h2");
  if (schedH2) schedH2.textContent = "复习档案 · 按 Week 查看";

  /* 今日两块：自选清单 + 每日任务（保持原有 id：ppSelf / ppDailyTasks） */
  var selfBox = document.createElement("section");
  selfBox.className = "pp-self";
  selfBox.id = "ppSelf";
  selfBox.innerHTML = ppSelfHtml();
  var daily = document.createElement("section");
  daily.className = "pp-daily";
  daily.innerHTML = '<h2>每日任务 · ' + ppTodayStr() + '</h2><div id="ppDailyTasks"></div>';

  /* 作业批改 / 学习档案两个面板保持各自的折叠 */
  panels.querySelectorAll(".pp-panel").forEach(function(panel){
    var bar = document.createElement("details");
    bar.className = "pp-panel pp-horizontal";
    var heading = panel.querySelector(".pp-panel-h");
    var summary = document.createElement("summary");
    if (heading) summary.appendChild(heading);
    bar.appendChild(summary);
    while (panel.firstChild) bar.appendChild(panel.firstChild);
    panel.replaceWith(bar);
  });

  /* 通用折叠包装：稍长的板块一律做成 <details>，可单独开合 */
  function mkFold(id, icon, title, hint, open, nodes){
    var d = document.createElement("details");
    d.className = "pp-fold" + (open ? " pp-fold-hero" : "");
    d.id = id;
    d.open = !!open;
    var s = document.createElement("summary");
    s.className = "pp-fold-h";
    s.innerHTML = '<span class="pp-fold-ic">' + icon + '</span>'
      + '<span class="pp-fold-t">' + ppEsc(title) + '</span>'
      + '<span class="pp-fold-hint">' + ppEsc(hint) + '</span>'
      + '<span class="pp-fold-arrow" aria-hidden="true">▾</span>';
    d.appendChild(s);
    var body = document.createElement("div");
    body.className = "pp-fold-b";
    nodes.forEach(function(n){ if (n) body.appendChild(n); });
    d.appendChild(body);
    return d;
  }

  var folds = [
    mkFold("secToday",   "📌", "今日复习计划 · 自选清单", "今天先做这一块", true,  [selfBox]),
    mkFold("secDaily",   "📅", "每日任务 · " + ppTodayStr(), "按排期逐项勾选", true, [daily]),
    mkFold("secKpi",     "📊", "考试倒计时 · 复习进度", "概览", true,  [overview]),
    null,  /* 工具栏常驻，不折叠 */
    mkFold("secPlan",    "🗓️", "学期备考计划", "目标 / 考试排期 / 每周 2h 分配 / 抗遗忘复习", false, [planBox]),
    mkFold("secPanels",  "✍️", "作业批改 · 学习档案", "AI 批改后自动入档", false, [panels]),
    mkFold("secArchive", "📚", "复习档案 · 按 Week 查看", "精确到日的完整排期", false, [grid])
  ];

  /* 左侧导航栏 */
  var ppNav = [
    ["secToday",   "📌", "今日复习计划"],
    ["secDaily",   "📅", "每日任务"],
    ["secKpi",     "📊", "倒计时 · 进度"],
    ["secPlan",    "🗓️", "学期备考计划"],
    ["secPanels",  "✍️", "作业批改 · 档案"],
    ["secArchive", "📚", "复习档案 · 按周"]
  ];
  var side = document.createElement("aside");
  side.className = "pp-sidenav";
  side.innerHTML = '<div class="pp-nav-h">🧭 本页导航</div>'
    + '<nav class="pp-nav-list">' + ppNav.map(function(n){
        return '<button type="button" class="pp-nav-i' + (n[0] === "secToday" ? " on" : "") + '" data-jump="' + n[0] + '">'
          + '<span class="pp-nav-ic">' + n[1] + '</span><span>' + n[2] + '</span></button>';
      }).join("") + '</nav>'
    + '<div class="pp-nav-tools"><button type="button" class="pp-nav-btn" data-fold="open">全部展开</button>'
    + '<button type="button" class="pp-nav-btn" data-fold="close">全部收起</button></div>'
    + '<div class="pp-nav-foot"><a data-nav="#/">← 返回首页</a><a data-nav="#/extra">课外拓展 →</a></div>';

  /* 重排右侧：今日两块在最前，其余长内容折叠 */
  dashboard.innerHTML = "";
  folds.forEach(function(f){
    if (f) dashboard.appendChild(f);
    else if (toolbar) dashboard.appendChild(toolbar);
  });

  /* 两栏骨架：左导航 + 右内容 */
  var shell = document.createElement("div");
  shell.className = "container pp-shell";
  var main = document.createElement("div");
  main.className = "pp-main";
  main.appendChild(dashboard);
  shell.appendChild(side);
  shell.appendChild(main);
  if (masthead && masthead.nextSibling) app.insertBefore(shell, masthead.nextSibling);
  else app.appendChild(shell);

  /* 左侧导航交互：点条目自动展开并滚动；全部展开 / 收起 */
  side.addEventListener("click", function(ev){
    var t = ev.target.closest ? ev.target.closest("[data-jump],[data-fold]") : null;
    if (!t) return;
    if (t.hasAttribute("data-fold")) {
      var want = t.getAttribute("data-fold") === "open";
      [].slice.call(dashboard.querySelectorAll("details")).forEach(function(d){ d.open = want; });
      return;
    }
    var target = document.getElementById(t.getAttribute("data-jump"));
    if (!target) return;
    if (!target.open) target.open = true;
    [].slice.call(side.querySelectorAll(".pp-nav-i")).forEach(function(x){ x.classList.toggle("on", x === t); });
    if (target.scrollIntoView) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- 初始化 ---------- */
  ppBuildFilters();
  ppBindWorkbench();
  ppBindSelfReview();
  ppRender();
  ppRenderIntegration();

  /* 事件绑定：SPA 每次进入 #/prep 都会重建 DOM，必须每次重新绑定到当前元素。
     不能只绑一次（旧 DOM 已被 route() 清除，新元素的事件不会生效）。 */
  var t1 = document.getElementById("ppBtnToday");
  var t2 = document.getElementById("ppBtnToday2");
  var jumpToday = function(){ var el = document.getElementById("ppd-" + ppTodayStr()); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); else alert("今天不在排期范围内"); };
  if (t1) t1.addEventListener("click", jumpToday);
  if (t2) t2.addEventListener("click", jumpToday);
  var fc = document.getElementById("ppFCourse"), fp = document.getElementById("ppFPhase");
  if (fc) fc.addEventListener("change", ppRender);
  if (fp) fp.addEventListener("change", ppRender);
  var tg = document.getElementById("ppBtnToggle");
  if (tg) tg.addEventListener("click", function(){ PP.onlyUndone = !PP.onlyUndone; this.textContent = PP.onlyUndone ? "显示全部" : "只看未完成"; ppRender(); });
  var cb = document.getElementById("ppBtnCore");
  if (cb) cb.addEventListener("click", function(){ PP.onlyCore = !PP.onlyCore; this.textContent = PP.onlyCore ? "显示全部" : "只看必做"; ppRender(); });
  var ex = document.getElementById("ppBtnExport");
  if (ex) ex.addEventListener("click", function(){
    var blob = new Blob([JSON.stringify({ done: PP.done, postpone: PP.postpone }, null, 1)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "复习打卡-" + ppTodayStr() + ".json"; a.click();
  });
  var im = document.getElementById("ppBtnImport");
  if (im) im.addEventListener("click", function(){ var f = document.getElementById("ppFileIn"); if (f) f.click(); });
  var fi = document.getElementById("ppFileIn");
  if (fi) fi.addEventListener("change", function(e){
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function(){
      try {
        var j = JSON.parse(r.result);
        if (j && typeof j === "object" && ("done" in j || "postpone" in j)) {   /* 新格式：{ done, postpone } */
          if (j.done) PP.done = j.done;
          if (j.postpone) PP.postpone = j.postpone;
        } else { PP.done = j; }                                                  /* 旧格式：纯勾选表 */
        ppSave(); ppSavePost(); ppRender(); alert("导入成功");
      } catch (err) { alert("文件格式不对"); }
    };
    r.readAsText(f);
  });
}

/* ---------- 筛选下拉 ---------- */
function ppBuildFilters(){
  var DATA = window.PREP_DATA;
  var fc = document.getElementById("ppFCourse"), fp = document.getElementById("ppFPhase");
  if (!fc || !fp || !DATA) return;
  var courses = {}, phases = {};
  DATA.days.forEach(function(d){ phases[d.phase] = 1; d.items.forEach(function(it){ if (it.course) courses[it.course] = 1; }); });
  Object.keys(courses).sort().forEach(function(c){ var o = document.createElement("option"); o.value = c; o.textContent = c; fc.appendChild(o); });
  Object.keys(phases).forEach(function(p){ var o = document.createElement("option"); o.value = p; o.textContent = p; fp.appendChild(o); });
}

/* ---------- 「怎么做」步骤生成（按课程 / 任务类型；数据自带 steps 则优先） ---------- */
function ppSteps(it){
  if (Array.isArray(it.steps) && it.steps.length) return it.steps.slice();
  var c = it.course, k = it.kind, rep = it.rep || "";
  var out = [];
  /* 第一步通用：先看笔记（诊断 / 模考除外） */
  if (k === "mock") {
    return [
      "准备好安静环境、计时器和计算器，手机调静音",
      "严格按考试时限、闭卷完成一套卷子（中途不翻笔记）",
      "对答案打分，错题拍照/粘贴到下方「✍️ 作业批改」让 AI 分析薄弱点"
    ];
  }
  if (k === "diag") {
    return [
      "按卡片上的说明，从对应科目最近的单元里抽题（或用样卷）",
      "限时独立完成，不要翻笔记",
      "完成后提交到下方「✍️ 作业批改」区，错误类型会自动记入档案"
    ];
  }
  out.push('点开本卡的「网站位置」进入该周笔记，把<b>预习笔记 + 图文笔记</b>通读一遍');
  if (c === "经济") {
    out.push("在草稿纸上<b>默画</b>本单元的核心图（如循环流量 / AD-AS / 弹性图 / 成本曲线），坐标轴和曲线名称用英文标");
    out.push("合上笔记，对着自己画的图<b>口头解释</b>一遍：每条曲线是什么、为什么会移动、均衡点怎么变");
  } else if (c === "会计") {
    out.push("找出该周课件里的例题，先<b>照着示范抄一遍</b>分录 / 表格，理解每一步为什么这样做");
    out.push("合上答案<b>独立重做</b>一遍：分录写全借方 / 贷方和金额，表格一格一格算");
  } else if (c === "数学") {
    out.push("从该周笔记的例题里选 <b>2~3 题</b>，限时独立完成（一般每题 8~10 分钟）");
    out.push("<b>步骤必须写全</b>（不能只写答案），写完再对答案");
  } else if (c === "计算机") {
    out.push("打开该周的 Excel 素材文件（课件里的练习文件），跟着笔记步骤<b>重做一遍</b>本单元的函数 / 图表 / 排序操作");
    out.push("做完后<b>不看笔记从头再来一遍</b>，两次结果对比，卡壳的地方记下来");
  } else if (c === "学术英语") {
    out.push("重读该周笔记里的<b>目标语言点</b>（如模糊限制语 / 衔接词 / 转述动词 / 名词化）");
    out.push("做一次<b>产出</b>：口头说一段（可录音）或写一小段话，刻意用上这些语言点");
  } else {
    out.push("按本卡说明完成对应练习或任务");
  }
  /* 最后一步通用：错因 + 自查 */
  out.push('对照下方「达到标准」自查；没达标的地方<b>用红笔写一句错因</b>，下一轮（' + (rep === "S" ? "考前扫描" : "R2/R3") + "）重点补");
  return out;
}
function ppStepsHtml(it){
  var steps = ppSteps(it);
  return '<div class="pp-i-steps"><b>怎么做：</b><ol>'
    + steps.map(function(s){ return "<li>" + s + "</li>"; }).join("")
    + "</ol></div>";
}

/* ---------- 单块卡片 ---------- */
function ppItemHtml(it, k, shift, origDate){
  var tags = '<span class="pp-tag pp-t-rep">' + ppEsc(it.rep || "") + (it.gap ? (" +" + it.gap + "天") : "") + "</span>";
  if (it.tier) tags += '<span class="pp-tag pp-t-' + it.tier + '">' + ppEsc(it.tier) + "档</span>";
  if (it.kind === "mock") tags += '<span class="pp-tag pp-t-mock">模考</span>';
  if (it.kind === "diag") tags += '<span class="pp-tag pp-t-diag">诊断</span>';
  /* 优先级标签：core = 今天必做；extra = 有余力再做 */
  if (it.pri === "core") tags += '<span class="pp-tag pp-t-core">必做</span>';
  else tags += '<span class="pp-tag pp-t-extra">选做</span>';
  tags += '<span class="pp-tag pp-t-B" title="独立作答 + 核对订正的真实用时；要练更久请用上方「今日自选清单」或本卡「从题库加练」">' + it.minutes + " 分钟</span>";
  var hrefHtml = it.href ? (' · 网站位置 <a data-nav="' + it.href + '" class="pp-href">打开该周笔记 →</a>') : "";
  var shiftHtml = "";
  if (shift > 0) {
    shiftHtml = '<span class="pp-shift-badge">⏩ 已延后 ' + shift + " 天（原定 " + origDate + "）</span>"
      + '<button class="pp-mini-btn pp-unpost" data-k="' + k + '" title="放回原来的日期">↩ 撤销延后</button>';
  }
  /* 实际间隔过长提示（如实告知，不隐藏） */
  var lateHtml = it.late ? '<span class="pp-late-note">⚠️ 排期拥挤，这一轮实际隔了较久' + ppEsc(it.late.replace(/（|）/g, "")) + '，有精力就补上</span>' : "";
  return '<div class="pp-item' + (PP.done[k] ? " pp-done" : "") + (it.pri === "extra" ? " pp-extra" : "") + '" data-k="' + k + '">'
    + '<div class="pp-i-top"><input type="checkbox" data-k="' + k + '"' + (PP.done[k] ? " checked" : "") + '>'
    + '<div><div class="pp-i-label">' + ppEsc(it.label) + '</div>'
    + '<div class="pp-i-meta">' + tags + '</div>'
    + '<div class="pp-i-meta">' + ppEsc(it.mode || "") + hrefHtml + lateHtml + '</div>'
    + ppStepsHtml(it)
    + (it.exercises || []).map(function(exercise){
      return '<details class="pp-answer"><summary>做完后展开 · 核对答案</summary><p>' + ppEsc(exercise.answer) + '</p></details>';
    }).join("")
    + '<div class="pp-i-crit"><b>达到标准：</b>' + ppEsc(it.crit || "") + '</div>'
    + '<div class="pp-i-btns">' + shiftHtml
    + '<button class="pp-mini-btn pp-post" data-k="' + k + '" title="顺延到下一天">⏭ 延后一天</button>'
    + ((it.href && (it.exercises || []).length)
        ? '<button class="pp-mini-btn pp-qbank" data-qb="' + ppEsc(it.href) + '" title="这一题不够练？从题库多挑几题，自己定复习多久">📚 从题库加练</button>'
        : "")
    + '</div></div></div></div>';
}

/* ---------- 日历渲染 ---------- */
function ppRender(){
  var DATA = window.PREP_DATA;
  var fc = document.getElementById("ppFCourse"), fp = document.getElementById("ppFPhase");
  var onlyUndone = PP.onlyUndone;
  var t = ppTodayStr();
  var fcv = fc ? fc.value : "", fpv = fp ? fp.value : "";
  var lastDate = DATA.days[DATA.days.length - 1].date;

  /* 1) 计算每个任务「延后后」的有效日期，按有效日期归位 */
  var effMap = {};   /* { 有效日期: [ {it, k, shift, origDate, phase, done} ] } */
  var total = 0, doneN = 0;
  DATA.days.forEach(function(day){
    day.items.forEach(function(it, idx){
      var k = it.id || day.date + "#" + idx;
      var shift = PP.postpone[k] || 0;
      var eff = ppShift(day.date, shift);
      if (eff > lastDate) eff = lastDate;   /* 延后也不能超出最后一天 */
      if (!effMap[eff]) effMap[eff] = [];
      effMap[eff].push({ it: it, k: k, shift: shift, origDate: day.date, phase: day.phase });
      total++; if (PP.done[k]) doneN++;
    });
  });

  /* 2) 逾期未完成清单（有效日期 < 今天 且未勾选） */
  var overdue = [];
  Object.keys(effMap).forEach(function(d){
    if (d < t) effMap[d].forEach(function(e){ if (!PP.done[e.k]) overdue.push(e); });
  });
  overdue.sort(function(a, b){ return (a.origDate + a.k).localeCompare(b.origDate + b.k); });

  var openWeeks = Array.from(document.querySelectorAll(".pp-week-archive[open]")).map(function(el){ return el.dataset.week; });
  var dailyTasks = document.getElementById("ppDailyTasks");
  if (dailyTasks) {
    var dailyEntries = effMap[t] || [];
    dailyTasks.innerHTML = dailyEntries.length
      ? dailyEntries.map(function(e){ return ppItemHtml(e.it, e.k, e.shift, e.origDate); }).join("")
      : '<p class="pp-note">今天没有排期任务。</p>';
  }
  /* 3) 渲染周面板 */
  var html = "", todayMins = 0, todayDone = 0, todayCore = 0, todayCoreMin = 0, todayExtra = 0;
  for (var i = 0; i < DATA.days.length; i += 7) {
    var chunk = DATA.days.slice(i, i + 7);
    var wkHtml = chunk.map(function(day){
      var entries = (effMap[day.date] || []).filter(function(e){
        return (!fcv || e.it.course === fcv) && (!fpv || e.phase === fpv) && !(onlyUndone && PP.done[e.k]);
      });
      if (!entries.length) {
        if (day.date !== t) return "";
        var empty = (effMap[t] || []).length ? "当前筛选下没有今日复习任务" : "今天没有排复习块";
        return '<div class="pp-day pp-today" id="ppd-' + t + '">'
          + '<div class="pp-d-head"><span class="pp-d-date">' + t + '</span></div>'
          + '<div class="pp-note">' + empty + '</div></div>';
      }
      var isToday = day.date === t, past = day.date < t;
      var m = 0; entries.forEach(function(e){ m += e.it.minutes; });
      /* 分区：必做（core） / 选做（extra） */
      var coreE = entries.filter(function(e){ return e.it.pri === "core"; });
      var extraE = entries.filter(function(e){ return e.it.pri !== "core"; });
      if (isToday) {
        todayMins = m;
        todayDone = entries.filter(function(e){ return PP.done[e.k]; }).length;
        todayCore = coreE.length; todayExtra = extraE.length;
        todayCoreMin = coreE.reduce(function(a, e){ return a + e.it.minutes; }, 0);
      }
      /* 负荷条：core 分钟数 vs 建议上限（工作日 75 / 周末 100） */
      var dowNum = new Date(day.date + "T00:00:00").getDay();
      var isWe = dowNum === 0 || dowNum === 6;
      var budget = isWe ? 100 : 75;
      var coreMin = coreE.reduce(function(a, e){ return a + e.it.minutes; }, 0);
      var pctLoad = Math.min(100, Math.round(coreMin / budget * 100));
      var loadCls = coreMin > budget ? " pp-load-over" : (coreMin > budget * 0.85 ? " pp-load-high" : "");
      var loadHtml = '<div class="pp-load' + loadCls + '">'
        + '<span class="pp-load-t">必做 <b>' + coreMin + '</b> 分钟 / ' + coreE.length + " 块"
        + (extraE.length ? "（选做 " + extraE.length + " 块）" : "") + '</span>'
        + '<span class="pp-load-bar"><i style="width:' + pctLoad + '%"></i></span>'
        + '<span class="pp-load-note">' + (coreMin > budget ? "已超出建议量，可把选做挪到明天" : "在建议量内") + '</span>'
        + '</div>';
      var coreHtml = coreE.map(function(e){ return ppItemHtml(e.it, e.k, e.shift, e.origDate); }).join("");
      var extraHtml = (!PP.onlyCore && extraE.length)
        ? '<details class="pp-extra-sec"><summary class="pp-extra-h">🌿 有余力再做（' + extraE.length + " 块 · " + extraE.reduce(function(a, e){ return a + e.it.minutes; }, 0) + " 分钟）—— 做完算加分，做不完不算欠账（点开查看）</summary>"
          + extraE.map(function(e){ return ppItemHtml(e.it, e.k, e.shift, e.origDate); }).join("") + "</details>"
        : "";
      return '<div class="pp-day' + (isToday ? " pp-today" : "") + (past ? " pp-past" : "") + '" id="ppd-' + day.date + '">'
        + '<div class="pp-d-head"><span class="pp-d-date">' + day.date + '</span><span class="pp-d-dow">' + day.dow + '</span>'
        + '<span class="pp-d-phase">' + ppEsc(day.phase) + '</span><span class="pp-d-left">距考试 ' + day.left + " 天 · 第 " + day.d + " 天</span></div>"
        + '<div class="pp-d-mins">当天共 ' + m + " 分钟 · " + entries.length + " 块" + (coreE.length ? "（必做 " + coreE.length + "）" : "") + '</div>'
        + loadHtml
        + coreHtml
        + extraHtml
        + '</div>';
    }).join("");
    if (!wkHtml.trim()) continue;
    var weekNo = Math.floor(i / 7) + 1;
    html += '<details class="pp-week-archive" data-week="' + weekNo + '"' + (openWeeks.indexOf(String(weekNo)) >= 0 ? " open" : "") + '><summary class="pp-week-h">Week ' + weekNo + " · " + chunk[0].date + " → " + chunk[chunk.length - 1].date + "</summary>"
      + '<div class="pp-grid">' + wkHtml + "</div></details>";
  }

  /* 4) 逾期区置顶 */
  if (overdue.length) {
    var odRows = overdue.slice(0, 10).map(function(e){
      return '<div class="pp-od-row"><span class="pp-od-label">' + ppEsc(e.it.label) + '</span>'
        + '<span class="pp-od-meta">原定 ' + e.origDate + " · " + e.it.minutes + " 分钟</span>"
        + '<span class="pp-od-btns">'
        + '<button class="pp-mini-btn pp-od-today" data-k="' + e.k + '">→ 延到今天</button>'
        + '<button class="pp-mini-btn pp-od-done" data-k="' + e.k + '">✓ 标记已完成</button>'
        + '</span></div>';
    }).join("");
    html = '<details class="pp-overdue" open><summary class="pp-od-head">⏰ 之前没完成的（' + overdue.length + " 项）— 点「延到今天」补上，或标记已完成"
      + (overdue.length > 10 ? "（下面只列最近 10 项，其余仍在日历里）" : "") + '</summary>' + odRows + "</details>" + html;
  }

  var wk = document.getElementById("ppWeeks");
  if (wk) wk.innerHTML = html || '<div class="pp-note">当前筛选下没有内容。</div>';

  /* 5) KPI 与进度条 */
  var L = ppExamLeft();
  var kL = document.getElementById("ppKLeft"); if (kL) kL.innerHTML = (L >= 0 ? L : "已过") + "<small> 天</small>";
  var td = DATA.days.find(function(d){ return d.date === t; });
  var kD = document.getElementById("ppKDay"); if (kD) kD.textContent = td ? ("第 " + td.d + " 天") : "—";
  var kDn = document.getElementById("ppKDone"); if (kDn) kDn.textContent = doneN + " / " + total;
  var todayEntries = (effMap[t] || []).filter(function(e){
    return (!fcv || e.it.course === fcv) && (!fpv || e.phase === fpv) && !(onlyUndone && PP.done[e.k]);
  });
  var kT = document.getElementById("ppKToday");
  if (kT) kT.textContent = todayEntries.length
    ? ("必做 " + todayCoreMin + " 分/" + todayCore + " 块" + (todayExtra ? " · 选做 " + todayExtra + " 块" : "") + " · 已勾 " + todayDone + "/" + todayEntries.length)
    : (td ? ((effMap[t] || []).length ? "当前筛选下没有今日复习任务" : "今天没有排复习块") : "—");
  var pct = total ? Math.round(doneN / total * 100) : 0;
  var pb = document.getElementById("ppPbar"); if (pb) pb.style.width = pct + "%";
  var pt = document.getElementById("ppPtxt"); if (pt) pt.textContent = "完成率 " + pct + "%（共 " + total + " 个复习块，已完成 " + doneN + " 个）";

  /* 6) 事件绑定（委托在 #ppWeeks 容器上，重渲染后依然有效；容器元素每次进入路由会重建，不会重复绑定） */
  [wk, dailyTasks].forEach(function(wk){
  if (wk && !wk._ppDelegated) {
    wk._ppDelegated = true;
    wk.addEventListener("click", function(ev){
      var btn = ev.target.closest ? ev.target.closest("button") : null;
      if (!btn) return;
      var k = btn.getAttribute("data-k");
      if (btn.classList.contains("pp-post")) {              /* 延后一天 */
        PP.postpone[k] = (PP.postpone[k] || 0) + 1; ppSavePost(); ppRender();
      } else if (btn.classList.contains("pp-unpost")) {     /* 撤销延后 */
        delete PP.postpone[k]; ppSavePost(); ppRender();
      } else if (btn.classList.contains("pp-od-today")) {   /* 逾期 → 今天 */
        var tNow = ppTodayStr();
        var e = findEntry(k); if (!e) return;
        var cur = ppShift(e.origDate, PP.postpone[k] || 0);
        if (cur > lastDate) cur = lastDate;
        var add = ppDiffDays(cur, tNow);
        if (add > 0) { PP.postpone[k] = (PP.postpone[k] || 0) + add; ppSavePost(); ppRender(); }
      } else if (btn.classList.contains("pp-od-done")) {    /* 逾期 → 标记完成 */
        PP.done[k] = 1; ppSave(); ppRender();
      } else if (btn.classList.contains("pp-qbank")) {       /* 从题库加练：带该周定位跳到自选清单 */
        ppQBankFromCard(btn.getAttribute("data-qb") || "");
      }
    });
  }
  });
  /* 勾选打卡：每次渲染后重新绑定（DOM 已重建） */
  document.querySelectorAll(".pp-item input[type=checkbox]").forEach(function(cb){
    cb.addEventListener("change", function(){
      var k = cb.getAttribute("data-k");
      if (cb.checked) PP.done[k] = 1; else delete PP.done[k];
      ppSave(); ppRender();
    });
  });

  function findEntry(k){
    var matched = null;
    DATA.days.some(function(day){
      var it = day.items.find(function(item){ return item.id === k; });
      if (it) matched = { origDate: day.date, it: it };
      return !!matched;
    });
    if (matched) return matched;
    var parts = k.split("#"), date = parts[0], idx = +parts[1];
    var day = DATA.days.find(function(d){ return d.date === date; });
    return day ? { origDate: date, it: day.items[idx] } : null;
  }
}

/* ---------- 整合区：记录 + 薄弱点 + 进度 ---------- */
function ppRenderIntegration(){
  var recs = ppLoadRecords().slice().sort(function(a, b){ return String(b.date || "").localeCompare(String(a.date || "")); });
  var rc = document.getElementById("ppRecList");
  if (!rc) return;
  var DATA = window.PREP_DATA;
  if (!recs.length) {
    rc.innerHTML = '<div class="pp-empty">还没有批改记录。在本页上方「📝 提交作业」区提交作业 / 练习 / 模考，AI 逐题批改后成绩和薄弱点会自动出现在这里，并与「学习档案」页同步。</div>';
  } else {
    rc.innerHTML = recs.slice(0, 12).map(function(r){
      var cn = (DATA.courseCn && DATA.courseCn[r.courseId]) || r.courseId || "—";
      var sc = (r.score != null && r.score !== "") ? (r.score + " 分") : ({ practice: "练习", quiz: "小测", exam: "大考" }[r.type] || r.type || "");
      var wp = (r.weakPoints || []).map(function(w){ return '<span class="pp-wp">' + ppEsc(w) + '</span>'; }).join("");
      return '<div class="pp-rec"><div class="pp-rec-top"><b>' + ppEsc(r.title || "未命名") + '</b>'
        + '<span class="pp-rec-c">' + ppEsc(cn) + '</span><span class="pp-rec-d">' + ppEsc(r.date || "") + '</span></div>'
        + '<div class="pp-rec-meta">' + (sc ? '<span class="pp-sc">' + sc + '</span>' : "") + wp + '</div></div>';
    }).join("");
  }
  var rcc = document.getElementById("ppRecCount"); if (rcc) rcc.textContent = recs.length;

  var wpc = {};
  recs.forEach(function(r){ (r.weakPoints || []).forEach(function(w){ if (w) wpc[w] = (wpc[w] || 0) + 1; }); });
  var top = Object.keys(wpc).map(function(w){ return [w, wpc[w]]; }).sort(function(a, b){ return b[1] - a[1]; }).slice(0, 18);
  var wt = document.getElementById("ppWeakTags");
  if (wt) wt.innerHTML = top.length
    ? top.map(function(p){ return '<span class="pp-wp pp-wp-big" title="出现 ' + p[1] + ' 次">' + ppEsc(p[0]) + " ·" + p[1] + "</span>"; }).join("")
    : '<span class="pp-empty">暂无薄弱点记录（提交批改后会出现在这里）</span>';
  var wcc = document.getElementById("ppWeakCount"); if (wcc) wcc.textContent = Object.keys(wpc).length;

  var p = window.PORTAL_PROGRESS || {};
  var weeks = p.weeks || {}, tasks = p.tasks || {};
  var wkDone = 0, wkTot = 0, tkDone = 0, tkTot = 0;
  for (var k in weeks) { wkTot++; if (weeks[k]) wkDone++; }
  for (var k2 in tasks) { var o = tasks[k2] || {}; for (var t in o) { tkTot++; if (o[t]) tkDone++; } }
  var pw = document.getElementById("ppPWeeks"); if (pw) pw.textContent = wkDone + "/" + wkTot;
  var pt = document.getElementById("ppPTasks"); if (pt) pt.textContent = tkDone + "/" + tkTot;
}

/* ---------- 作业批改工作台（与主站 #/assistant 同逻辑、同记录键） ---------- */
function ppReadText(file){
  return new Promise(function(res){
    var r = new FileReader();
    r.onload = function(){ var b = String(r.result || "").replace(/[\x00-\x1f\x7f]+/g, " ").replace(/\s+/g, " ").trim(); res(b.slice(0, 12000)); };
    r.onerror = function(){ res(""); };
    r.readAsText(file);
  });
}
function ppWbBaseRecord(analysis){
  var cid = document.getElementById("ppWbCourse").value;
  var week = parseInt(document.getElementById("ppWbWeek").value, 10) || null;
  var title = (document.getElementById("ppWbTitle").value || "").trim();
  var type = document.getElementById("ppWbType").value;
  var weak = (document.getElementById("ppWbWeak").value || "").split(/[,，]/).map(function(s){ return s.trim(); }).filter(Boolean);
  return {
    id: "wb_" + Date.now() + "_" + Math.floor(Math.random() * 1e4),
    date: ppTodayStr(), courseId: cid, weekNum: week, type: type, title: title,
    score: (analysis && typeof analysis.score === "number" && !isNaN(analysis.score)) ? analysis.score : null,
    weakPoints: (analysis && Array.isArray(analysis.weakPoints)) ? analysis.weakPoints : (weak.length ? weak : []),
    note: (analysis && analysis.summary) ? ("AI：" + analysis.summary.slice(0, 200)) : "", aiAnalyzed: true
  };
}
function ppWbShowResult(rec){
  var box = document.getElementById("ppWbResult"); if (!box) return;
  var hasScore = typeof rec.score === "number";
  box.innerHTML = '<div class="pp-sr-head"><b>✓ 已记入本页与学习档案</b>'
    + (hasScore ? '<span class="pp-sr-score">' + rec.score + '<small> 分</small></span>' : '<span style="font-size:12px;color:#8a92a8">未评分 · 按掌握度记录</span>')
    + (rec.weakPoints && rec.weakPoints.length ? '<div class="pp-sr-weak">' + rec.weakPoints.map(function(w){ return '<span class="pp-wp">' + ppEsc(w) + '</span>'; }).join("") + '</div>' : "")
    + (rec.note ? '<div class="pp-sr-body">' + ppEsc(rec.note) + '</div>' : "")
    + '<div class="pp-sr-foot">已同步到「学习档案」页（同一份 localStorage 数据）。</div>';
}
function ppWbLogOnly(){
  var rec = ppWbBaseRecord(null);
  if (!rec.title) { alert("请填写作业 / 考试名称"); return; }
  ppSaveRecords(ppLoadRecords().concat([rec]));
  ppWbShowResult(rec); ppRenderIntegration();
}
function ppWbSubmit(){
  var title = (document.getElementById("ppWbTitle").value || "").trim();
  if (!title) { alert("请填写作业 / 考试名称（必填）"); return; }
  if (!PP.WB_FILES.length && !document.getElementById("ppWbText").value.trim()) { alert("请至少提交一项：拖放文件，或粘贴文字。"); return; }
  var wbGo = document.getElementById("ppWbGo");
  wbGo.disabled = true; wbGo.textContent = "AI 分析中…";
  var ctx = PP.WB_FILES.map(function(f){ return "【文件 " + f.name + "】"; }).join(" ") + "【粘贴文字】\n" + document.getElementById("ppWbText").value;
  var typeLbl = { practice: "练习/作业", quiz: "测验", exam: "考试" }[document.getElementById("ppWbType").value];
  var question = "请批改并解析这份「" + title + "」作业（" + typeLbl + "）。" + (PP.WB_FILES.length ? "学生提交的文件内容如下：\n" : "") + ctx
    + "\n要求：①逐题判定对错并指出错误原因；②对薄弱知识点打标签；③若学生提供了正确/总题数或分数，换算成 0-100 的得分率；若没有分数，score 填 null；④最后用一句话总结。"
    + "请严格按以下 JSON 回复，不要其他内容：{\"score\":数字或null,\"weakPoints\":[\"薄弱点1\",\"薄弱点2\"],\"summary\":\"一句话总结\"}";
  if (typeof fetch === "undefined") {
    var rec = ppWbBaseRecord({ summary: "未连接 AI 服务，本次仅记录提交，未评分。" });
    ppSaveRecords(ppLoadRecords().concat([rec]));
    ppWbShowResult(rec); ppRenderIntegration();
    wbGo.disabled = false; wbGo.textContent = "提交并让 AI 分析"; PP.WB_FILES = []; ppRenderWBFiles(); return;
  }
  fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: question, context: "课程：" + ((window.PREP_DATA.courseCn[document.getElementById("ppWbCourse").value]) || "") + "；" + title }) })
    .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(j){
      var a = { score: null, weakPoints: [], summary: j.ok ? j.answer : (j.error || "AI 不可用") };
      if (j.ok && j.answer) { var m = j.answer.match(/\{[\s\S]*\}/); if (m) { try {
        var p = JSON.parse(m[0]);
        if (typeof p.score === "number" && p.score >= 0 && p.score <= 100) a.score = Math.round(p.score); else if (p.score === null) a.score = null;
        if (Array.isArray(p.weakPoints)) a.weakPoints = p.weakPoints.slice(0, 8).map(String);
        if (p.summary) a.summary = String(p.summary).slice(0, 300);
      } catch (e) {} } }
      var rec = ppWbBaseRecord(a);
      ppSaveRecords(ppLoadRecords().concat([rec]));
      ppWbShowResult(rec); ppRenderIntegration();
    })
    .catch(function(e){
      var rec = ppWbBaseRecord({ summary: "AI 服务暂不可用（" + e.message + "），本次仅记录提交，未评分。" });
      ppSaveRecords(ppLoadRecords().concat([rec]));
      ppWbShowResult(rec); ppRenderIntegration();
    })
    .then(function(){ wbGo.disabled = false; wbGo.textContent = "提交并让 AI 分析"; PP.WB_FILES = []; ppRenderWBFiles(); });
}
function ppRenderWBFiles(){
  var list = document.getElementById("ppWbFileList"); if (!list) return;
  list.innerHTML = PP.WB_FILES.map(function(f, i){ return '<span class="pp-dz-file">📎 ' + ppEsc(f.name) + ' <i data-rm="' + i + '">✕</i></span>'; }).join("");
  Array.prototype.forEach.call(list.querySelectorAll("[data-rm]"), function(x){
    x.addEventListener("click", function(ev){ ev.stopPropagation(); PP.WB_FILES.splice(parseInt(x.getAttribute("data-rm"), 10), 1); ppRenderWBFiles(); });
  });
}
function ppBindWorkbench(){
  var drop = document.getElementById("ppWbDrop"), fileInput = document.getElementById("ppWbFiles");
  var wbGo = document.getElementById("ppWbGo"), wbLogOnlyBtn = document.getElementById("ppWbLogOnly");
  if (!drop || !wbGo) return;
  drop.addEventListener("click", function(ev){ if (ev.target.tagName !== "I") fileInput.click(); });
  drop.addEventListener("dragover", function(ev){ ev.preventDefault(); drop.classList.add("pp-drag"); });
  drop.addEventListener("dragleave", function(){ drop.classList.remove("pp-drag"); });
  drop.addEventListener("drop", function(ev){ ev.preventDefault(); drop.classList.remove("pp-drag");
    if (ev.dataTransfer && ev.dataTransfer.files) PP.WB_FILES = PP.WB_FILES.concat(Array.prototype.slice.call(ev.dataTransfer.files)); ppRenderWBFiles(); });
  fileInput.addEventListener("change", function(){ if (fileInput.files) PP.WB_FILES = PP.WB_FILES.concat(Array.prototype.slice.call(fileInput.files || [])); fileInput.value = ""; ppRenderWBFiles(); });
  wbGo.addEventListener("click", ppWbSubmit);
  if (wbLogOnlyBtn) wbLogOnlyBtn.addEventListener("click", ppWbLogOnly);
}

/* ============================================================
 * 今日复习 · 自选清单 + 复习档案（由 question-bank.js 题目库驱动）
 * 流程：先选「今天学多久 / 学什么科目 / 复习哪一周」→ 按题目真实用时凑题出清单
 *      → 逐题作答、展开核对、判定对错 → 存入复习档案（按日期留痕）
 * 档案键：liora-review-archive-v1（只存本机浏览器，与其它打卡数据互不干扰）
 * ============================================================ */
var PP_ARCHIVE_KEY = "liora-review-archive-v1";
function ppArchiveAll(){
  try { var j = JSON.parse(localStorage.getItem(PP_ARCHIVE_KEY) || "{}"); return (j && typeof j === "object") ? j : {}; }
  catch (e) { return {}; }
}
function ppArchiveSave(j){ try { localStorage.setItem(PP_ARCHIVE_KEY, JSON.stringify(j)); } catch (e) {} }
function ppQBank(){ return window.QUESTION_BANK || null; }
function ppQWeekLabel(q){
  var t = q.term === "term1" ? "T1" : (q.term === "term2" ? "T2" : q.term);
  return q.cn + " · " + t + " W" + q.week;
}
function ppQWeekOptions(){
  var B = ppQBank();
  if (!B) return '<option value="all">全部周次（混合复习）</option>';
  var map = {};
  B.questions.forEach(function(q){
    var c = map[q.cid] = map[q.cid] || {};
    c[q.term + "|" + q.week] = q;
  });
  var out = '<option value="all">全部周次（混合复习）</option>';
  B.courses.forEach(function(c){
    var m = map[c.id] || {};
    var keys = Object.keys(m).sort(function(a, b){
      return (parseInt(a.split("|")[1], 10) || 0) - (parseInt(b.split("|")[1], 10) || 0);
    });
    if (!keys.length) return;
    out += '<optgroup label="' + ppEsc(c.cn) + '">';
    keys.forEach(function(k){
      var q = m[k];
      out += '<option value="' + ppEsc(c.id + "|" + k) + '">' + ppEsc(ppQWeekLabel(q)) + ' · ' + ppEsc((q.topic || "").slice(0, 20)) + '</option>';
    });
    out += '</optgroup>';
  });
  return out;
}
function ppSelfHtml(){
  var B = ppQBank();
  if (!B || !B.questions || !B.questions.length) {
    return '<div class="pp-self-h"><h2>📋 复习档案 · 今日自选清单</h2>'
      + '<p>⚠️ 题库（question-bank.js）未加载，暂时无法生成清单。</p></div>';
  }
  var chips = B.courses.map(function(c){
    return '<button type="button" class="pp-chip on" data-sub="' + ppEsc(c.id) + '">' + ppEsc(c.cn) + '</button>';
  }).join("");
  return '<div class="pp-self-h"><h2>📋 复习档案 · 今日自选清单</h2>'
    + '<p>先选「今天学多久 / 学什么科目 / 复习哪一周」，再按题库凑出清单。'
    + ppEsc(B.minutesNote || "") + ' 题库共 <b>' + B.questions.length + '</b> 道题、覆盖 ' + B.courses.length + ' 门课。</p></div>'
    + '<div class="pp-self-form">'
    + '<div class="pp-fld"><label>① 今天学多久</label><select id="ppQMinutes">'
    + [10, 20, 30, 45, 60, 90].map(function(m){
        return '<option value="' + m + '"' + (m === 30 ? ' selected' : '') + '>' + m + ' 分钟（约 ' + Math.round(m / 2.5) + ' 题）</option>';
      }).join("")
    + '</select></div>'
    + '<div class="pp-fld"><label>② 学什么科目（可多选）</label><div class="pp-chips" id="ppQSubjects">' + chips + '</div></div>'
    + '<div class="pp-fld"><label>③ 复习哪一周</label><select id="ppQWeek">' + ppQWeekOptions() + '</select></div>'
    + '<div class="pp-fld pp-fld-btn"><button type="button" class="pp-btn pp-btn-navy" id="ppQGen">生成今日清单 →</button></div>'
    + '</div>'
    + '<div id="ppQResult"><div class="pp-q-empty">选好上面三项，点「生成今日清单」，就会按题目真实用时凑出这一份清单。</div></div>'
    + '<div class="pp-arch" id="ppQArchive"></div>';
}
function ppGenerateList(reroll){
  var B = ppQBank(), box = document.getElementById("ppQResult");
  if (!box) return;
  if (!B || !B.questions.length) { box.innerHTML = '<div class="pp-q-warn">⚠️ 题库未加载。</div>'; return; }
  var minEl = document.getElementById("ppQMinutes"), wkEl = document.getElementById("ppQWeek");
  var target = parseInt(minEl ? minEl.value : "30", 10) || 30;
  var scope = wkEl ? wkEl.value : "all";
  var subs = [].slice.call(document.querySelectorAll("#ppQSubjects .pp-chip.on")).map(function(b){ return b.getAttribute("data-sub"); });
  if (!subs.length) { box.innerHTML = '<div class="pp-q-warn">⚠️ 请至少选一个科目。</div>'; return; }
  var pool = B.questions.filter(function(q){
    if (subs.indexOf(q.cid) < 0) return false;
    if (scope !== "all" && (q.cid + "|" + q.term + "|" + q.week) !== scope) return false;
    return true;
  });
  if (!pool.length) { box.innerHTML = '<div class="pp-q-warn">⚠️ 这个范围里没有题目，换个科目或周次试试。</div>'; return; }
  /* 排序优先：以前做错的 → 没做过的 → 周次靠前的，保证复习有针对性 */
  var hist = ppArchiveAll(), done = {}, wrong = {};
  Object.keys(hist).forEach(function(dt){
    (hist[dt].items || []).forEach(function(r){
      done[r.id] = (done[r.id] || 0) + 1;
      if (r.ok === false) wrong[r.id] = (wrong[r.id] || 0) + 1;
    });
  });
  var prefer = PP.preferKey || "";
  pool.sort(function(a, b){
    var pa = (prefer && (a.cid + "|" + a.term + "|" + a.week) === prefer) ? 1 : 0;
    var pb = (prefer && (b.cid + "|" + b.term + "|" + b.week) === prefer) ? 1 : 0;
    return pb - pa
      || (wrong[b.id] || 0) - (wrong[a.id] || 0)
      || (done[a.id] || 0) - (done[b.id] || 0)
      || a.week - b.week
      || (a.id < b.id ? -1 : 1);
  });
  if (reroll) PP.listOffset = (PP.listOffset || 0) + 5;
  var off = (PP.listOffset || 0) % pool.length;
  var ordered = pool.slice(off).concat(pool.slice(0, off));
  var picked = [], sum = 0;
  for (var i = 0; i < ordered.length && sum < target; i++) { picked.push(ordered[i]); sum += ordered[i].minutes; }
  PP.currentList = { date: ppTodayStr(), target: target, subjects: subs, scope: scope, items: picked, minutes: sum };
  var poolTotal = pool.reduce(function(s, q){ return s + q.minutes; }, 0);
  var subNames = subs.map(function(id){
    var c = B.courses.filter(function(x){ return x.id === id; })[0]; return c ? c.cn : id;
  }).join(" / ");
  var selOpt = (wkEl && wkEl.selectedIndex >= 0) ? wkEl.options[wkEl.selectedIndex] : null;
  var scopeName = scope === "all" ? "全部周次" : (selOpt ? selOpt.textContent : scope);
  var html = '<div class="pp-q-head"><b>今日清单 · ' + ppEsc(PP.currentList.date) + '</b>'
    + '<span class="pp-q-sum">目标 ' + target + ' 分钟 · ' + ppEsc(subNames) + ' · ' + ppEsc(scopeName)
    + (PP.preferKey ? '（该周题目优先，同科目其它周补足）' : '')
    + ' · 共 ' + picked.length + ' 题，预计 ' + sum + ' 分钟</span>'
    + '<button type="button" class="pp-btn pp-btn-navy" id="ppQSave">💾 存入复习档案</button>'
    + '<button type="button" class="pp-btn" id="ppQRegen">🔄 换一批</button></div>';
  if (sum < target) {
    html += '<div class="pp-q-warn">⚠️ 这个范围只有 ' + pool.length + ' 道题、约 ' + poolTotal
      + ' 分钟，已经全部列入，仍差约 ' + (target - sum) + ' 分钟。'
      + (scope !== "all" ? '<button type="button" class="pp-btn" id="ppQExpand">扩展到该科目全部周次</button>' : "")
      + (subs.length < B.courses.length ? '<button type="button" class="pp-btn" id="ppQAllSub">加选全部科目</button>' : "")
      + '</div>';
  } else if (sum > target) {
    html += '<div class="pp-q-warn">⚠️ 按整题凑单，实际约 ' + sum + ' 分钟，比目标多 ' + (sum - target)
      + ' 分钟；最后一题可以留到明天，不必硬做完。</div>';
  }
  html += '<ol class="pp-q-list">' + picked.map(function(q, idx){
    var std = q.kind === "口语 / 写作"
      ? "合上答案独立完成这段说 / 写，留下录音或文字；再展开核对，至少写出 1 处要改的地方。"
      : (q.kind === "分步计算"
        ? "合上答案独立写出完整演算步骤（不能只写答案），再展开核对；错的地方写一句错因。"
        : "合上答案独立写出完整分录 / 计算 / 图形，再展开核对；错的地方写一句错因。");
    return '<li class="pp-q-item" data-id="' + ppEsc(q.id) + '">'
      + '<div class="pp-q-top"><span class="pp-q-no">' + (idx + 1) + '</span>'
      + '<span class="pp-q-tag">' + ppEsc(ppQWeekLabel(q)) + '</span>'
      + '<span class="pp-q-topic">' + ppEsc(q.topic || q.kind) + '</span>'
      + '<span class="pp-q-min">' + q.minutes + ' 分钟</span></div>'
      + '<div class="pp-q-body">' + ppEsc(q.q) + '</div>'
      + '<div class="pp-q-std"><b>做到：</b>' + std + '</div>'
      + '<details class="pp-answer"><summary>做完后展开 · 核对答案</summary><p>' + ppEsc(q.answer) + '</p></details>'
      + '<div class="pp-q-check">'
      + '<label><input type="radio" name="qq-' + ppEsc(q.id) + '" value="ok"> ✓ 做对了</label>'
      + '<label><input type="radio" name="qq-' + ppEsc(q.id) + '" value="wrong"> ✗ 需再复习</label>'
      + '<a data-nav="' + ppEsc(q.href) + '" class="pp-href">打开该周笔记 →</a>'
      + '</div></li>';
  }).join("") + '</ol>';
  box.innerHTML = html;
  var sv = document.getElementById("ppQSave"); if (sv) sv.addEventListener("click", ppSaveToday);
  var rg = document.getElementById("ppQRegen"); if (rg) rg.addEventListener("click", function(){ ppGenerateList(true); });
  var ex = document.getElementById("ppQExpand");
  if (ex) ex.addEventListener("click", function(){
    var e = document.getElementById("ppQWeek"); if (e) e.value = "all";
    PP.listOffset = 0; ppGenerateList();
  });
  var allS = document.getElementById("ppQAllSub");
  if (allS) allS.addEventListener("click", function(){
    [].slice.call(document.querySelectorAll("#ppQSubjects .pp-chip")).forEach(function(b){ b.classList.add("on"); });
    PP.listOffset = 0; ppGenerateList();
  });
  [].slice.call(box.querySelectorAll('.pp-q-item input[type="radio"]')).forEach(function(r){
    r.addEventListener("change", function(){ var li = r.closest(".pp-q-item"); if (li) li.classList.add("q-done"); });
  });
}
function ppSaveToday(){
  var L = PP.currentList, box = document.getElementById("ppQResult");
  if (!L || !L.items || !L.items.length) { alert("请先生成今日清单"); return; }
  var rows = [].slice.call(box.querySelectorAll(".pp-q-item")).map(function(li){
    var r = li.querySelector('input[type="radio"]:checked');
    return { id: li.getAttribute("data-id"), answered: !!r, ok: r ? (r.value === "ok") : null };
  });
  var done = rows.filter(function(r){ return r.answered; }).length;
  var correct = rows.filter(function(r){ return r.ok === true; }).length;
  var wrong = rows.filter(function(r){ return r.ok === false; }).length;
  var hist = ppArchiveAll();
  hist[L.date] = {
    date: L.date, target: L.target, subjects: L.subjects, scope: L.scope,
    plannedMinutes: L.minutes, total: rows.length, done: done,
    correct: correct, wrong: wrong, items: rows, savedAt: new Date().toISOString()
  };
  ppArchiveSave(hist);
  ppRenderArchive();
  var msg = "✓ 已存入复习档案（" + L.date + "）：完成 " + done + "/" + rows.length + " 题";
  if (done) msg += "，做对 " + correct + " 题、需再复习 " + wrong + " 题";
  if (done < rows.length) msg += "。⚠️ 还有 " + (rows.length - done) + " 题没判定，下次清单会优先排这些题。";
  var tip = document.createElement("div");
  tip.className = "pp-q-warn";
  tip.textContent = msg;
  box.insertBefore(tip, box.firstChild);
}
function ppRenderArchive(){
  var box = document.getElementById("ppQArchive"); if (!box) return;
  var hist = ppArchiveAll(), keys = Object.keys(hist).sort().reverse(), B = ppQBank();
  if (!keys.length) {
    box.innerHTML = '<details class="pp-arch-fold"><summary>📁 复习档案 · 历史记录（暂无）</summary>'
      + '<div class="pp-q-empty">还没有记录。生成清单、做完勾选，再点「存入复习档案」，这里会按日期留下每天选了多久、学了什么、做对几题。</div></details>';
    return;
  }
  var html = '<details class="pp-arch-fold"><summary>📁 复习档案 · 历史记录（共 ' + keys.length + ' 天，点开查看）</summary><div class="pp-arch-b">';
  keys.slice(0, 14).forEach(function(dt){
    var r = hist[dt];
    var names = (r.subjects || []).map(function(id){
      var c = B && B.courses.filter(function(x){ return x.id === id; })[0];
      return c ? c.cn : id;
    }).join(" / ");
    var rate = r.total ? Math.round(r.done / r.total * 100) : 0;
    var acc = r.done ? Math.round(r.correct / r.done * 100) : 0;
    var warn = rate < 80 ? '<span class="pp-q-warn-inline">⚠️ 完成率 ' + rate + '%，低于 80%，建议下次把时长调短</span>' : "";
    html += '<div class="pp-arch-row"><span class="pp-arch-date">' + ppEsc(dt) + '</span>'
      + '<span class="pp-arch-sub">' + ppEsc(names || "未记录科目") + '</span>'
      + '<span class="pp-arch-num">目标 ' + (r.target || "—") + ' 分 · 清单 ' + (r.plannedMinutes || 0) + ' 分 · '
      + r.done + '/' + r.total + ' 题已判定 · 正确率 ' + acc + '%</span>' + warn + '</div>';
  });
  box.innerHTML = html + '</div></details>';
}
function ppBindSelfReview(){
  [].slice.call(document.querySelectorAll("#ppQSubjects .pp-chip")).forEach(function(b){
    b.addEventListener("click", function(){ b.classList.toggle("on"); });
  });
  var gen = document.getElementById("ppQGen");
  if (gen) gen.addEventListener("click", function(){ PP.listOffset = 0; PP.preferKey = null; ppGenerateList(); });
  ppRenderArchive();
}
/* 排期卡片上的「从题库加练」：带着该周的科目 / 周次跳到自选清单并生成 */
function ppQBankFromCard(href){
  var self = document.getElementById("ppSelf");
  if (self && typeof self.scrollIntoView === "function") self.scrollIntoView({ behavior: "smooth", block: "start" });
  var m = /^#\/c\/([^/]+)\/([^/]+)\/(\d+)/.exec(href || "");
  if (m) {
    [].slice.call(document.querySelectorAll("#ppQSubjects .pp-chip")).forEach(function(b){
      b.classList.toggle("on", b.getAttribute("data-sub") === m[1]);
    });
    /* 不锁死在该周（题库每周只有 1 题），改为「该周优先 + 同科目其它周补足」 */
    PP.preferKey = m[1] + "|" + m[2] + "|" + m[3];
    var wk = document.getElementById("ppQWeek");
    if (wk) wk.value = "all";
  }
  var min = document.getElementById("ppQMinutes");
  if (min) min.value = "30";
  PP.listOffset = 0;
  ppGenerateList();
}
