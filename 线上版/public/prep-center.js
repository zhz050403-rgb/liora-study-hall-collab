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
  /* 自主刷题题库（AI 自动判分）——独立板块，不与「今日清单」共用任何 id */
  var drillBox = document.createElement("section");
  drillBox.className = "pp-drill";
  drillBox.id = "ppDrill";
  drillBox.innerHTML = ppDrHtml();

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
    mkFold("secArchive", "📚", "复习档案 · 按 Week 查看", "精确到日的完整排期", false, [grid]),
    mkFold("secDrill",   "🎯", "自主刷题 · 自动判分", "自由选题 · AI 判对错 · 错题入档", false, [drillBox])
  ];

  /* 左侧导航栏 */
  var ppNav = [
    ["secToday",   "📌", "今日复习计划"],
    ["secDaily",   "📅", "每日任务"],
    ["secKpi",     "📊", "倒计时 · 进度"],
    ["secPlan",    "🗓️", "学期备考计划"],
    ["secPanels",  "✍️", "作业批改 · 档案"],
    ["secArchive", "📚", "复习档案 · 按周"],
    ["secDrill",   "🎯", "自主刷题 · 判分"]
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
  ppDrBind();
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
  var n = /^term(\d+)/.exec(q.term);   /* term1x 是 Term 1 的补充周，主站已并入 Term 1 */
  var t = n ? "T" + n[1] : q.term;
  return q.cn + " · " + t + " W" + q.week;
}
/* 周次多选：把题库按「课程 → term|week」聚合成可选周次列表。
   key 格式与旧单选保持一致：cid|term|week，便于排序/优先逻辑复用。 */
function ppQWeekGroups(){
  var B = ppQBank();
  if (!B || !B.questions) return [];
  var map = {};
  B.questions.forEach(function(q){
    var c = map[q.cid] = map[q.cid] || {};
    c[q.term + "|" + q.week] = q;
  });
  return B.courses.map(function(c){
    var m = map[c.id] || {};
    var keys = Object.keys(m).sort(function(a, b){
      var ta = a.split("|")[0], tb = b.split("|")[0];
      if (ta !== tb) return ta < tb ? -1 : 1;
      return (parseInt(a.split("|")[1], 10) || 0) - (parseInt(b.split("|")[1], 10) || 0);
    });
    return {
      cid: c.id, cn: c.cn,
      items: keys.map(function(k){
        var q = m[k], n = /^term(\d+)/.exec(q.term);
        return {
          key: c.id + "|" + k,
          short: (n ? "T" + n[1] : q.term) + " W" + q.week,
          label: ppQWeekLabel(q) + " · " + (q.topic || "")
        };
      })
    };
  }).filter(function(g){ return g.items.length; });
}

/* ③ 周次选择器：折叠面板 + 可多选 chips（按课程分组）。
   一个都不选 = 「全部周次」，与旧版默认 all 完全等价，老用户无感。 */
function ppQWeekPickHtml(){
  var groups = ppQWeekGroups();
  if (!groups.length) {
    return '<div class="pp-fld"><label>③ 复习哪几周（可多选）</label>'
      + '<div class="pp-q-warn">⚠️ 题库未加载，暂无周次可选。</div></div>';
  }
  var total = groups.reduce(function(s, g){ return s + g.items.length; }, 0);
  var html = '<details class="pp-fld pp-week-pick" id="ppQWeek">'
    + '<summary class="pp-week-sum"><span class="pp-week-lb">③ 复习哪几周（可多选）</span>'
    + '<span class="pp-week-cur" id="ppQWeekCur">全部周次（默认）</span>'
    + '<span class="pp-week-total">共 ' + total + ' 周 · 点开选</span></summary>'
    + '<div class="pp-week-body"><div class="pp-week-tools">'
    + '<button type="button" class="pp-btn" id="ppQWeekAll">↺ 全部周次（清空选择）</button>'
    + '<button type="button" class="pp-btn" id="ppQWeekBySub">按已选科目全选</button>'
    + '<span class="pp-week-tip">不选＝全部周次；点周次会自动勾上对应科目，可跨科多选。</span>'
    + '</div><div class="pp-week-groups">';
  groups.forEach(function(g){
    html += '<div class="pp-week-grp" data-cid="' + ppEsc(g.cid) + '">'
      + '<div class="pp-week-grp-h"><b>' + ppEsc(g.cn) + '</b>'
      + '<button type="button" class="pp-mini-btn" data-pickgrp="' + ppEsc(g.cid) + '">全选 / 取消本科</button></div>'
      + '<div class="pp-chips pp-week-chips">';
    g.items.forEach(function(it){
      html += '<button type="button" class="pp-chip pp-wk-chip"'
        + ' data-wk="' + ppEsc(it.key) + '" data-cid="' + ppEsc(g.cid) + '"'
        + ' data-label="' + ppEsc(it.label) + '" title="' + ppEsc(it.label) + '">'
        + ppEsc(it.short) + '</button>';
    });
    html += '</div></div>';
  });
  return html + '</div></div></details>';
}

/* 当前选中的周次 key 数组（空数组 = 全部周次） */
function ppQSelectedWeeks(){
  return [].slice.call(document.querySelectorAll("#ppQWeek .pp-wk-chip.on"))
    .map(function(b){ return b.getAttribute("data-wk"); });
}
function ppQWeekSyncLabel(){
  var cur = document.getElementById("ppQWeekCur");
  if (!cur) return;
  var n = ppQSelectedWeeks().length;
  cur.textContent = n ? ("已选 " + n + " 个周次") : "全部周次（默认）";
  cur.classList.toggle("has-sel", n > 0);
}
function ppQWeekClear(){
  [].slice.call(document.querySelectorAll("#ppQWeek .pp-wk-chip.on"))
    .forEach(function(b){ b.classList.remove("on"); });
  ppQWeekSyncLabel();
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
    + '<p>先选「今天学多久 / 学什么科目 / 复习哪几周（可多选）」，再按题库凑出清单。'
    + ppEsc(B.minutesNote || "") + ' 题库共 <b>' + B.questions.length + '</b> 道题、覆盖 ' + B.courses.length + ' 门课。</p></div>'
    + '<div class="pp-self-form">'
    + '<div class="pp-fld"><label>① 今天学多久</label><select id="ppQMinutes">'
    + [10, 20, 30, 45, 60, 90].map(function(m){
        return '<option value="' + m + '"' + (m === 30 ? ' selected' : '') + '>' + m + ' 分钟（约 ' + Math.round(m / 2.5) + ' 题）</option>';
      }).join("")
    + '</select></div>'
    + '<div class="pp-fld"><label>② 学什么科目（可多选）</label><div class="pp-chips" id="ppQSubjects">' + chips + '</div></div>'
    + ppQWeekPickHtml()
    + '<div class="pp-fld pp-fld-btn"><button type="button" class="pp-btn pp-btn-navy" id="ppQGen">生成今日清单 →</button></div>'
    + '</div>'
    + '<div id="ppQResult"><div class="pp-q-empty">选好上面三项，点「生成今日清单」，就会按题目真实用时凑出这一份清单。</div></div>'
    + '<div class="pp-arch" id="ppQArchive"></div>';
}
function ppGenerateList(reroll){
  var B = ppQBank(), box = document.getElementById("ppQResult");
  if (!box) return;
  if (!B || !B.questions.length) { box.innerHTML = '<div class="pp-q-warn">⚠️ 题库未加载。</div>'; return; }
  var minEl = document.getElementById("ppQMinutes");
  var target = parseInt(minEl ? minEl.value : "30", 10) || 30;
  /* 周次多选：空数组 = 全部周次；非空则只出这几个 key 的题目 */
  var scopes = ppQSelectedWeeks();
  var selChips = [].slice.call(document.querySelectorAll("#ppQWeek .pp-wk-chip.on"));
  var subs = [].slice.call(document.querySelectorAll("#ppQSubjects .pp-chip.on")).map(function(b){ return b.getAttribute("data-sub"); });
  if (!subs.length) { box.innerHTML = '<div class="pp-q-warn">⚠️ 请至少选一个科目。</div>'; return; }
  var pool = B.questions.filter(function(q){
    if (subs.indexOf(q.cid) < 0) return false;
    if (scopes.length && scopes.indexOf(q.cid + "|" + q.term + "|" + q.week) < 0) return false;
    return true;
  });
  if (!pool.length) { box.innerHTML = '<div class="pp-q-warn">⚠️ 这个范围里没有题目，多选几个周次或加选科目试试。</div>'; return; }
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
  PP.currentList = { date: ppTodayStr(), target: target, subjects: subs,
    scope: (scopes.length ? scopes.slice() : "all"), items: picked, minutes: sum };
  var poolTotal = pool.reduce(function(s, q){ return s + q.minutes; }, 0);
  var subNames = subs.map(function(id){
    var c = B.courses.filter(function(x){ return x.id === id; })[0]; return c ? c.cn : id;
  }).join(" / ");
  var scopeName = !selChips.length ? "全部周次"
    : (selChips.length === 1 ? selChips[0].getAttribute("data-label")
      : "已选 " + selChips.length + " 个周次");
  var html = '<div class="pp-q-head"><b>今日清单 · ' + ppEsc(PP.currentList.date) + '</b>'
    + '<span class="pp-q-sum">目标 ' + target + ' 分钟 · ' + ppEsc(subNames) + ' · ' + ppEsc(scopeName)
    + (PP.preferKey ? '（该周题目优先，同科目其它周补足）' : '')
    + ' · 共 ' + picked.length + ' 题，预计 ' + sum + ' 分钟</span>'
    + '<button type="button" class="pp-btn pp-btn-navy" id="ppQSave">💾 存入复习档案</button>'
    + '<button type="button" class="pp-btn" id="ppQRegen">🔄 换一批</button></div>';
  if (sum < target) {
    html += '<div class="pp-q-warn">⚠️ 这个范围只有 ' + pool.length + ' 道题、约 ' + poolTotal
      + ' 分钟，已经全部列入，仍差约 ' + (target - sum) + ' 分钟。'
      + (scopes.length ? '<button type="button" class="pp-btn" id="ppQExpand">扩展到全部周次</button>' : "")
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
    ppQWeekClear();
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
    var warn = rate < 80
      ? (r.drill ? '<span class="pp-q-warn-inline">⚠️ 完成率 ' + rate + '%，低于 80%</span>'
                 : '<span class="pp-q-warn-inline">⚠️ 完成率 ' + rate + '%，低于 80%，建议下次把时长调短</span>')
      : "";
    /* 自主刷题与今日清单共用同一天档案：有 drill 标记时显示刷题汇总，避免「目标 — 分」这种空话 */
    var numTxt = r.drill
      ? ('🎯 自主刷题 ' + r.drill.sessions + ' 次 · 累计判 ' + r.drill.judged + ' 题 · 档案内 '
          + r.done + '/' + r.total + ' 题已判定 · 正确率 ' + acc + '%')
      : ('目标 ' + (r.target || "—") + ' 分 · 清单 ' + (r.plannedMinutes || 0) + ' 分 · '
          + r.done + '/' + r.total + ' 题已判定 · 正确率 ' + acc + '%');
    html += '<div class="pp-arch-row"><span class="pp-arch-date">' + ppEsc(dt) + '</span>'
      + '<span class="pp-arch-sub">' + ppEsc(names || "未记录科目") + '</span>'
      + '<span class="pp-arch-num">' + numTxt + '</span>' + warn + '</div>';
  });
  box.innerHTML = html + '</div></details>';
}
function ppBindSelfReview(){
  /* ② 科目：取消某科时同步取消该科已选周次，避免「选了周却出不了题」 */
  [].slice.call(document.querySelectorAll("#ppQSubjects .pp-chip")).forEach(function(b){
    b.addEventListener("click", function(){
      var on = b.classList.toggle("on");
      if (!on) {
        var cid = b.getAttribute("data-sub");
        [].slice.call(document.querySelectorAll("#ppQWeek .pp-wk-chip.on")).forEach(function(c){
          if (c.getAttribute("data-cid") === cid) c.classList.remove("on");
        });
      }
      PP.listOffset = 0;
      ppQWeekSyncLabel();
    });
  });
  /* ③ 周次多选：点中某周时自动把对应科目也勾上 */
  [].slice.call(document.querySelectorAll("#ppQWeek .pp-wk-chip")).forEach(function(b){
    b.addEventListener("click", function(){
      var on = b.classList.toggle("on");
      if (on) {
        var cid = b.getAttribute("data-cid");
        [].slice.call(document.querySelectorAll("#ppQSubjects .pp-chip")).forEach(function(s){
          if (s.getAttribute("data-sub") === cid) s.classList.add("on");
        });
      }
      PP.listOffset = 0;
      ppQWeekSyncLabel();
    });
  });
  var allW = document.getElementById("ppQWeekAll");
  if (allW) allW.addEventListener("click", function(){ ppQWeekClear(); PP.listOffset = 0; });
  var bySub = document.getElementById("ppQWeekBySub");
  if (bySub) bySub.addEventListener("click", function(){
    var subs = [].slice.call(document.querySelectorAll("#ppQSubjects .pp-chip.on"))
      .map(function(b){ return b.getAttribute("data-sub"); });
    [].slice.call(document.querySelectorAll("#ppQWeek .pp-wk-chip")).forEach(function(b){
      b.classList.toggle("on", subs.indexOf(b.getAttribute("data-cid")) >= 0);
    });
    PP.listOffset = 0; ppQWeekSyncLabel();
  });
  /* 每门课的「全选 / 取消本科」 */
  [].slice.call(document.querySelectorAll("#ppQWeek [data-pickgrp]")).forEach(function(btn){
    btn.addEventListener("click", function(){
      var cid = btn.getAttribute("data-pickgrp");
      var list = [].slice.call(document.querySelectorAll("#ppQWeek .pp-wk-chip"))
        .filter(function(b){ return b.getAttribute("data-cid") === cid; });
      var allOn = list.length && list.every(function(b){ return b.classList.contains("on"); });
      list.forEach(function(b){ b.classList.toggle("on", !allOn); });
      if (!allOn) {
        [].slice.call(document.querySelectorAll("#ppQSubjects .pp-chip")).forEach(function(s){
          if (s.getAttribute("data-sub") === cid) s.classList.add("on");
        });
      }
      PP.listOffset = 0; ppQWeekSyncLabel();
    });
  });
  var gen = document.getElementById("ppQGen");
  if (gen) gen.addEventListener("click", function(){ PP.listOffset = 0; PP.preferKey = null; ppGenerateList(); });
  ppQWeekSyncLabel();
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
    /* 多选控件：清空所有周次选中 = 回到「全部周次」，让同科目其它周补足 */
    ppQWeekClear();
  }
  var min = document.getElementById("ppQMinutes");
  if (min) min.value = "30";
  PP.listOffset = 0;
  ppGenerateList();
}

/* ============================================================
 * 自主刷题 · 自动判分（2026-11-13 第二版：新增选择题 / 填空题）
 * 题库 1270 道原题全是开放题（题干 + 参考答案，无选项）。为避免 AI 主观题误判，
 * 新增两种客观题型，题目一律从【参考答案里真实存在的数值】派生，不编造任何学科内容：
 *   · 选择题 / 填空题：抽「标签 + 数值」得分点 → 本地精确比对 → 秒判、不经过 AI、结果确定。
 *     干扰项优先取同科其他题答案里的真实数值，不足时只做纯数学扰动，不伪造结论。
 *   · 完整作答：保留原 AI 对照参考答案判分（可能误判，参考答案可展开复核 + 手动改判）。
 * 派生不出客观得分点的题只出现在「完整作答」模式，不假装能出选择题。
 * 三种题型共用错题本(liora-drill-log-v1)、本次进度、复习档案(liora-review-archive-v1)。
 * AI 通道：优先 window.cloudLLM.stream，备用 /api/chat 聚合 SSE；都不可用则明确提示，绝不假装判分。
 * ============================================================ */
var PP_DRILL_LOG = "liora-drill-log-v1";
var PP_DRILL_TYPE_KEY = "liora-drill-type-v1";
function ppDrLogAll(){
  try { var j = JSON.parse(localStorage.getItem(PP_DRILL_LOG) || "{}"); return (j && typeof j === "object") ? j : {}; }
  catch (e) { return {}; }
}
function ppDrLogSave(j){ try { localStorage.setItem(PP_DRILL_LOG, JSON.stringify(j)); } catch (e) {} }
function ppDrTypeGet(){
  try { var t = localStorage.getItem(PP_DRILL_TYPE_KEY);
    return (t === "choice" || t === "blank" || t === "open") ? t : "choice"; }
  catch (e) { return "choice"; }
}
function ppDrTypeSet(t){ try { localStorage.setItem(PP_DRILL_TYPE_KEY, t); } catch (e) {} }
function ppDrCurType(){
  var el = document.getElementById("ppDrType");
  return el ? el.value : ppDrTypeGet();
}

/* ---- 客观题：从参考答案抽取得分点（只挖真实数值） ---- */
var PP_DR_BLANKS = {}, PP_DR_POOL = null, PP_DR_OPTS = {}, PP_DR_USABLE = {};
function ppDrNorm(s){
  var t = String(s == null ? "" : s).trim().toLowerCase();
  t = t.replace(/[\uFF01-\uFF5E]/g, function(c){ return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
       .replace(/\u3000/g, " ").replace(/[$¥£€,\s]/g, "");
  return t;
}
/* 数值等价：1,000 = 1000；50% = 0.5 = 50（百分号省略也认）；非纯数值只做字面比对 */
function ppDrEq(a, b){
  var na = ppDrNorm(a), nb = ppDrNorm(b);
  if (!na && !nb) return true;
  if (na === nb) return true;
  if (/[^0-9.\-%eE]/.test(na) || /[^0-9.\-%eE]/.test(nb)) return false;
  var va = parseFloat(na.replace(/%$/, "")), vb = parseFloat(nb.replace(/%$/, ""));
  if (!isFinite(va) || !isFinite(vb)) return false;
  var pa = /%$/.test(na), pb = /%$/.test(nb);
  if (Math.abs(va - vb) < 1e-6) return true;                       /* 1000 与 1000% 写法互通 */
  if (Math.abs((pa ? va / 100 : va) - (pb ? vb / 100 : vb)) < 1e-6) return true;
  if (Math.abs((pa ? va / 100 : va) - vb) < 1e-6) return true;     /* 0.5 与 50% */
  if (Math.abs(va - (pb ? vb / 100 : vb)) < 1e-6) return true;
  return false;
}
function ppDrNumPoints(ans){
  var s = String(ans == null ? "" : ans), out = [], seen = {}, re = /-?\d+(?:,\d{3})*(?:\.\d+)?%?/g, m;
  while ((m = re.exec(s)) !== null && out.length < 8) {
    var val = m[0];
    if (val.replace(/[-.,%]/g, "").length > 9) continue;
    var before = s.slice(0, m.index)
      .replace(/[$¥£€(（\[{：:=\s]+$/, "")
      .replace(/\s+(is|are|was|were|the|a|an|of|to|and|or|in|at|by|for|equals?)\s*$/i, " ");
    var lm = before.match(/([\u4e00-\u9fa5]{1,8}|[A-Za-z][A-Za-z/_-]{0,15})$/);
    if (!lm) continue;                       /* 没有可读标签的点不出题，避免出现「第 n 空」 */
    var label = lm[1].replace(/[\/_-]+$/, "").trim();
    if (!label) continue;
    var key = label + "|" + val;
    if (seen[key]) continue;
    seen[key] = 1;
    out.push({ label: label, value: val, idx: out.length });
  }
  return out;
}
function ppDrPointScore(p){
  var s = 0;
  if (/%/.test(p.value)) s += 3;
  if (p.label.length >= 2) s += 3; else s -= 2;
  if (String(p.value).replace(/[^\d]/g, "").length >= 3) s += 1;
  if (/[\u4e00-\u9fa5]/.test(p.label)) s += 1;
  return s - p.idx * 0.01;
}
/* 每题最多 3 个空：挑信息量最高的得分点，保持答案中的原有顺序 */
function ppDrBlanks(q){
  var key = q.id + "|" + String(q.answer).length;
  if (PP_DR_BLANKS[key]) return PP_DR_BLANKS[key];
  var pts = ppDrNumPoints(q.answer);
  var picked = pts.slice().sort(function(a, b){ return ppDrPointScore(b) - ppDrPointScore(a); })
    .slice(0, 3).sort(function(a, b){ return a.idx - b.idx; });
  /* 同一答案里出现多次的同名标签加序号，避免三个空都显示「from =」分不清 */
  var seenL = {};
  picked = picked.map(function(p){
    var sc = ppDrPointScore(p);
    seenL[p.label] = (seenL[p.label] || 0) + 1;
    return { label: seenL[p.label] > 1 ? p.label + "（第 " + seenL[p.label] + " 处）" : p.label,
      value: p.value, idx: p.idx, score: sc };
  });
  PP_DR_BLANKS[key] = picked;
  return picked;
}
function ppDrHash(s){
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h >>> 0;
}
/* 同科真实数值池：干扰项只从这里取，或做纯数学扰动，不编造结论 */
function ppDrPool(){
  if (PP_DR_POOL) return PP_DR_POOL;
  var pool = {}, B = ppQBank();
  (B && B.questions ? B.questions : []).forEach(function(q){
    if (!pool[q.cid]) pool[q.cid] = { num: [], pct: [] };
    ppDrNumPoints(q.answer).forEach(function(p){
      (/%$/.test(p.value) ? pool[q.cid].pct : pool[q.cid].num).push(p.value);
    });
  });
  Object.keys(pool).forEach(function(cid){
    ["num", "pct"].forEach(function(k){
      var seen = {}, out = [];
      pool[cid][k].forEach(function(v){ var n = ppDrNorm(v); if (!seen[n]) { seen[n] = 1; out.push(v); } });
      pool[cid][k] = out;
    });
  });
  PP_DR_POOL = pool;
  return pool;
}
/* 每个空 4 个选项（含正确项），同一题每次生成完全一致 */
function ppDrOptions(q, p, i){
  var okey = q.id + "|" + i;
  if (PP_DR_OPTS[okey]) return PP_DR_OPTS[okey];
  var pool = ppDrPool()[q.cid] || { num: [], pct: [] };
  var mine = ppDrNumPoints(q.answer).map(function(x){ return ppDrNorm(x.value); });
  var right = ppDrNorm(p.value), wantPct = /%$/.test(p.value);
  /* 优先挑与正确值同一量级的真实数值，避免正确项一眼就能靠大小猜出来 */
  var rv = parseFloat(String(p.value).replace(/[,%]/g, ""));
  var arr = wantPct ? pool.pct : pool.num;
  if (isFinite(rv)) {
    var near = arr.filter(function(v){
      var x = parseFloat(String(v).replace(/[,%]/g, ""));
      return isFinite(x) && Math.abs(Math.log10(Math.abs(x) + 1) - Math.log10(Math.abs(rv) + 1)) <= 0.6;
    });
    if (near.length >= 6) arr = near;
  }
  var best = [], used = {};
  used[right] = 1;
  arr.forEach(function(v){
    var n = ppDrNorm(v);
    if (used[n] || mine.indexOf(n) >= 0) return;   /* 干扰项不能是本题其它空的正确答案 */
    var h = ppDrHash(okey + "|pick|" + n);
    if (best.length < 6) { best.push({ v: v, h: h, n: n }); best.sort(function(a, b){ return a.h - b.h; }); }
    else if (h < best[5].h) { best[5] = { v: v, h: h, n: n }; best.sort(function(a, b){ return a.h - b.h; }); }
  });
  var picked = [];
  best.forEach(function(o){ if (picked.length < 3 && !used[o.n]) { used[o.n] = 1; picked.push(o.v); } });
  /* 池里不够 3 个时，只用纯数学扰动补数值干扰项 */
  var base = parseFloat(String(p.value).replace(/[,%]/g, ""));
  if (isFinite(base)) {
    var factors = [2, 0.5, 1.1, 0.9, 3, 1.25];
    for (var j = 0; picked.length < 3 && j < factors.length; j++) {
      var v = base * factors[j];
      v = Math.round(v * 100) / 100;
      if (wantPct) v = String(v) + "%"; else v = String(v);
      var n = ppDrNorm(v);
      if (!used[n] && !ppDrEq(v, p.value)) { used[n] = 1; picked.push(v); }
    }
  }
  var opts = picked.concat([p.value]);
  opts.sort(function(a, b){ return ppDrHash(okey + "|opt|" + ppDrNorm(a)) - ppDrHash(okey + "|opt|" + ppDrNorm(b)); });
  PP_DR_OPTS[okey] = opts;
  return opts;
}
function ppDrUsable(q, type){
  if (type === "open") return true;
  var key = type + "|" + q.id;
  if (PP_DR_USABLE[key] != null) return PP_DR_USABLE[key];
  var pts = ppDrBlanks(q), ok = pts.length > 0;
  /* 只有 1 个空且信息量很低（如「represent = 1」）的题不出客观题，避免刷到凑数题 */
  if (ok && pts.length === 1 && (pts[0].score || 0) < 4) ok = false;
  if (ok && type === "choice") {
    ok = pts.every(function(p, i){ return ppDrOptions(q, p, i).length >= 4; });
  }
  PP_DR_USABLE[key] = ok;
  return ok;
}

/* ---- AI 通道：主 cloudLLM / 备 /api/chat（SSE 聚合） ---- */
function ppSseText(t){
  var out = "";
  String(t || "").split("\n").forEach(function(line){
    if (line.indexOf("data:") !== 0) return;
    var d = line.slice(5).trim();
    if (!d || d === "[DONE]") return;
    try {
      var c = JSON.parse(d), dl = c.choices && c.choices[0] && c.choices[0].delta;
      if (dl && dl.content) out += dl.content;
    } catch (e) {}
  });
  return out;
}
function ppReadSse(res){
  if (!res.body || typeof res.body.getReader !== "function") {
    return res.text ? res.text().then(ppSseText) : Promise.resolve("");
  }
  var reader = res.body.getReader();
  var dec = (typeof TextDecoder !== "undefined") ? new TextDecoder("utf-8")
    : { decode: function(b){ return String(b); } };
  var buf = "", out = "";
  function lines(txt){
    buf += txt;
    var parts = buf.split("\n");
    buf = parts.pop();
    parts.forEach(function(line){
      if (line.indexOf("data:") !== 0) return;
      var d = line.slice(5).trim();
      if (!d || d === "[DONE]") return;
      try {
        var c = JSON.parse(d), dl = c.choices && c.choices[0] && c.choices[0].delta;
        if (dl && dl.content) out += dl.content;
      } catch (e) {}
    });
  }
  function loop(){
    return reader.read().then(function(r){
      if (r.done) { lines(dec.decode()); return out; }
      lines(dec.decode(r.value, { stream: true }));
      return loop();
    });
  }
  return loop();
}
function ppAiAsk(messages, onDelta){
  if (window.cloudLLM && typeof window.cloudLLM.stream === "function") {
    return window.cloudLLM.stream(messages, { temperature: 0.2, maxTokens: 700, onDelta: onDelta });
  }
  if (typeof fetch === "undefined") return Promise.reject(new Error("NO_AI"));
  var sys = [], usr = [];
  messages.forEach(function(m){ (m.role === "system" ? sys : usr).push(m.content); });
  /* 服务端 system 里带「苏格拉底式引导」的伴学提示，会干扰「只输出 JSON」；
     把判分指令同时放进 user 消息开头，确保模型稳定返回可解析结果。 */
  return fetch("/api/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: "【自动判分任务·最高优先级】只输出一个 JSON 对象，不要任何解释或 Markdown。\n"
        + sys.join("\n") + "\n\n" + usr.join("\n"),
      context: "自动判分任务（非闲聊），严格按 question 中的格式要求输出。"
    })
  }).then(function(r){
    if (!r.ok) throw new Error("HTTP " + r.status);
    var ct = (r.headers && r.headers.get) ? (r.headers.get("content-type") || "") : "";
    if (ct.indexOf("json") >= 0) {
      return r.json().then(function(j){ if (!j.ok) throw new Error(j.error || "AI 不可用"); return j.answer || ""; });
    }
    return ppReadSse(r);
  });
}
var PP_GRADE_SYS = "你是严格的作业自动判分引擎。只输出一个 JSON 对象，不要输出任何解释文字，不要使用 Markdown 代码块。"
  + "\n判定依据：以【参考答案】的得分点为准，比对【学生作答】。数值允许等价写法（0.5 = 1/2 = 50%）、"
  + "顺序不同或措辞不同但含义正确都算对；只写结论而题目要求写步骤者判 partial；空作答或完全无关判 wrong。"
  + "\n输出格式（必须严格遵守）：{\"verdict\":\"correct|partial|wrong\",\"score\":0-100,\"missing\":[\"缺失的得分点\"],\"reason\":\"一句中文说明\"}";
function ppDrParseVerdict(text){
  var m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    var j = JSON.parse(m[0]);
    var v = String(j.verdict || "").toLowerCase();
    if (v !== "correct" && v !== "partial" && v !== "wrong") {
      v = (typeof j.score === "number" && j.score >= 80) ? "correct" : "partial";
    }
    var sc = (typeof j.score === "number" && isFinite(j.score))
      ? Math.max(0, Math.min(100, Math.round(j.score))) : null;
    return { verdict: v, score: sc, ok: v === "correct",
      missing: Array.isArray(j.missing) ? j.missing.slice(0, 6).map(String) : [],
      reason: String(j.reason || "").slice(0, 400) };
  } catch (e) { return null; }
}

/* ---- 选题范围 ---- */
function ppDrSelectedSubs(){
  return [].slice.call(document.querySelectorAll("#ppDrSubjects .pp-chip.on"))
    .map(function(b){ return b.getAttribute("data-sub"); });
}
function ppDrSelectedWeeks(){
  return [].slice.call(document.querySelectorAll("#ppDrWeeks .pp-dr-wk.on"))
    .map(function(b){ return b.getAttribute("data-wk"); });
}
function ppDrFiltered(){
  var B = ppQBank();
  if (!B || !B.questions) return [];
  var subs = ppDrSelectedSubs(), weeks = ppDrSelectedWeeks();
  var kwEl = document.getElementById("ppDrKw");
  var kw = String((kwEl && kwEl.value) || "").trim().toLowerCase();
  var modeEl = document.getElementById("ppDrMode"), mode = modeEl ? modeEl.value : "all";
  var ordEl = document.getElementById("ppDrOrder"), order = ordEl ? ordEl.value : "week";
  var type = ppDrCurType();
  var log = ppDrLogAll();
  var list = B.questions.filter(function(q){
    if (subs.length && subs.indexOf(q.cid) < 0) return false;
    if (weeks.length && weeks.indexOf(q.cid + "|" + q.term + "|" + q.week) < 0) return false;
    if (!ppDrUsable(q, type)) return false;   /* 客观题型只出能派生真实得分点的题 */
    if (kw && (String(q.q) + " " + String(q.topic) + " " + String(q.kind) + " " + String(q.answer)).toLowerCase().indexOf(kw) < 0) return false;
    var rec = log[q.id];
    if (mode === "wrong" && !(rec && rec.ok === false)) return false;
    if (mode === "new" && rec) return false;
    return true;
  });
  if (order === "random") {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = list[i];
      list[i] = list[j]; list[j] = t;
    }
  } else {
    list.sort(function(a, b){
      if (order === "wrongfirst") {
        var wa = (log[a.id] && log[a.id].ok === false) ? 1 : 0;
        var wb = (log[b.id] && log[b.id].ok === false) ? 1 : 0;
        if (wa !== wb) return wb - wa;
      }
      return a.week - b.week || (a.id < b.id ? -1 : 1);
    });
  }
  return list;
}
function ppDrSyncCount(){
  var B = ppQBank(), weeks = ppDrSelectedWeeks();
  var cnt = document.getElementById("ppDrCount");
  var cur = document.getElementById("ppDrFilterCur");
  var wcur = document.getElementById("ppDrWeeksCur");
  if (wcur) wcur.textContent = weeks.length ? ("已选 " + weeks.length + " 周") : "全部周次";
  var n = ppDrFiltered().length, type = ppDrCurType();
  var typeName = { choice: "选择题", blank: "填空题", open: "完整作答" }[type] || type;
  if (cnt) cnt.innerHTML = '当前题型「' + typeName + '」符合范围的题目：<b>' + n + '</b> 道'
    + (B ? '（题库共 ' + B.questions.length + ' 道）' : '')
    + (type !== "open" ? '<br><span class="pp-dr-count-note">客观题只从参考答案里真实数值出题；需要练完整演算请切到「完整作答」。</span>' : '');
  if (cur) cur.textContent = '（当前 ' + n + ' 道可选）';
}
function ppDrWeekPickHtml(){
  var groups = ppQWeekGroups();
  if (!groups.length) return '<div class="pp-q-warn">⚠️ 题库未加载，暂无周次可选。</div>';
  var total = groups.reduce(function(s, g){ return s + g.items.length; }, 0);
  var h = '<details class="pp-dr-weeks" id="ppDrWeeks"><summary>展开选周次 · 共 ' + total
    + ' 周 <span id="ppDrWeeksCur">全部周次</span></summary><div class="pp-dr-weeks-b">'
    + '<div class="pp-dr-tools"><button type="button" class="pp-mini-btn" data-dr="wkclear">↺ 清空周次</button>'
    + '<button type="button" class="pp-mini-btn" data-dr="wkbysub">按已选科目全选</button></div>';
  groups.forEach(function(g){
    h += '<div class="pp-dr-grp"><div class="pp-dr-grp-h"><b>' + ppEsc(g.cn) + '</b>'
      + '<button type="button" class="pp-mini-btn" data-dr="wkgrp" data-cid="' + ppEsc(g.cid) + '">全选 / 取消本科</button></div><div class="pp-chips">';
    g.items.forEach(function(it){
      h += '<button type="button" class="pp-chip pp-dr-wk" data-dr="wk" data-wk="' + ppEsc(it.key)
        + '" data-cid="' + ppEsc(g.cid) + '" title="' + ppEsc(it.label) + '">' + ppEsc(it.short) + '</button>';
    });
    h += '</div></div>';
  });
  return h + '</div></details>';
}
function ppDrHtml(){
  var B = ppQBank();
  if (!B || !B.questions || !B.questions.length) {
    return '<div class="pp-dr-h"><h2>🎯 自主刷题 · 自动判分</h2>'
      + '<p class="pp-q-warn">⚠️ 题库（question-bank.js）未加载，暂时无法刷题。</p></div>';
  }
  var chips = B.courses.map(function(c){
    return '<button type="button" class="pp-chip on" data-dr="sub" data-sub="' + ppEsc(c.id) + '">' + ppEsc(c.cn) + '</button>';
  }).join("");
  var type = ppDrTypeGet();
  var typeOpts = [
    ["choice", "选择题（推荐 · 秒判不误判）"],
    ["blank", "填空题（自己写答案）"],
    ["open", "完整作答（AI 判分）"]
  ].map(function(o){
    return '<option value="' + o[0] + '"' + (o[0] === type ? " selected" : "") + '>' + o[1] + '</option>';
  }).join("");
  return '<div class="pp-dr-h"><h2>🎯 自主刷题 · 自动判分</h2>'
    + '<p>从题库自由选题 → 按题型作答 → <b>自动判分</b> → 错题自动进错题本，点「存入复习档案」后写回当天档案。'
    + '题库共 <b>' + B.questions.length + '</b> 道原题。<br>'
    + '<b>选择题 / 填空题</b>：从参考答案里的真实数值自动出题，<b>本地精确比对，不经过 AI、秒出结果、不会误判</b>（没网 / 没 AI 也能用）；'
    + '<b>完整作答</b>：仍由 AI 对照参考答案判分，⚠️ 主观题可能误判，可展开答案复核并手动改判。参考答案始终可展开。</p></div>'
    + '<details class="pp-dr-filter" id="ppDrFilter" open><summary>🔎 选题范围 <span class="pp-dr-filter-cur" id="ppDrFilterCur"></span></summary><div class="pp-dr-filter-b">'
    + '<div class="pp-fld"><label>① 科目（可多选）</label><div class="pp-chips" id="ppDrSubjects">' + chips + '</div></div>'
    + '<div class="pp-fld"><label>② 周次（可多选，不选＝全部）</label>' + ppDrWeekPickHtml() + '</div>'
    + '<div class="pp-fld"><label>③ 关键词（题干 / 主题 / 答案）</label><input id="ppDrKw" type="text" placeholder="如 adjusting、弹性、XLOOKUP"></div>'
    + '<div class="pp-fld"><label>④ 只刷哪些</label><select id="ppDrMode">'
    + '<option value="all">全部题目</option><option value="wrong">只看错题（判错的）</option><option value="new">只看没做过的</option></select></div>'
    + '<div class="pp-fld"><label>⑤ 出题顺序</label><select id="ppDrOrder">'
    + '<option value="week">按周次顺序</option><option value="random">随机打乱</option><option value="wrongfirst">错题优先</option></select></div>'
    + '<div class="pp-fld"><label>⑥ 题型</label><select id="ppDrType">' + typeOpts + '</select>'
    + '<div class="pp-dr-type-msg" id="ppDrTypeMsg"></div></div>'
    + '<div class="pp-fld pp-fld-btn"><button type="button" class="pp-btn pp-btn-navy" data-dr="start">▶ 开始刷题</button>'
    + '<button type="button" class="pp-btn" data-dr="shuffle">🔀 换一批（随机）</button></div>'
    + '<div class="pp-dr-count" id="ppDrCount"></div></div></details>'
    + '<div class="pp-dr-progress" id="ppDrProgress"></div>'
    + '<div class="pp-dr-stage" id="ppDrStage"></div>'
    + '<div class="pp-dr-foot"><div id="ppDrWrongBook"></div>'
    + '<div class="pp-dr-save"><button type="button" class="pp-btn pp-btn-navy" data-dr="save">💾 存入复习档案</button>'
    + '<span id="ppDrSaveMsg"></span></div></div>';
}

/* ---- 渲染 ---- */
function ppDrVerdictHtml(r){
  if (r.failed) {
    return '<div class="pp-dr-verdict fail"><b>⚠️ 自动判分未完成</b><p>' + ppEsc(r.reason || "AI 未返回可解析的判分结果。")
      + '</p><p>下方参考答案已展开，请你核对后自行判定本题：</p>'
      + '<div class="pp-dr-manual"><button type="button" class="pp-btn" data-dr="manual-ok">✓ 判为做对</button>'
      + '<button type="button" class="pp-btn" data-dr="manual-no">✗ 判为需复习</button></div></div>';
  }
  var label = { correct: "✅ 做对了", partial: "⚠️ 部分正确（记为需复习）", wrong: "❌ 需复习" }[r.verdict] || "判分完成";
  var h = '<div class="pp-dr-verdict ' + ppEsc(r.verdict) + '"><div class="pp-dr-vh"><b>' + label + '</b>'
    + (r.score != null ? '<span>得分 ' + r.score + ' / 100</span>' : '') + '</div>';
  if (r.reason) h += '<p>' + ppEsc(r.reason) + '</p>';
  if (r.missing && r.missing.length) h += '<p><b>缺失的得分点：</b>' + ppEsc(r.missing.join("；")) + '</p>';
  h += '<p class="pp-dr-vnote">' + (r.type && r.type !== "open"
      ? '本题按参考答案里的客观得分点本地精确判分，不经过 AI，结果确定。'
      : '判分由 AI 对照参考答案给出，下面参考答案可展开复核。')
    + '<button type="button" class="pp-mini-btn" data-dr="override">判错了？点此改判</button></p></div>';
  return h;
}
function ppDrProgressHtml(){
  var D = PP.drill || { list: [], idx: 0, results: {} };
  var keys = Object.keys(D.results || {}), done = keys.length;
  var ok = keys.filter(function(k){ return D.results[k].ok; }).length;
  var acc = done ? Math.round(ok / done * 100) : 0;
  var total = D.list.length, pct = total ? Math.round(done / total * 100) : 0;
  return '<div class="pp-dr-pg-h"><b>本次练习</b><span>已判 ' + done + ' / ' + total
    + ' 题 · 做对 ' + ok + ' 题 · 正确率 ' + acc + '%</span>'
    + (done && acc < 80 ? '<span class="pp-dr-warn">⚠️ 正确率低于 80%，存档后错题会自动排进以后的今日清单</span>' : '')
    + '</div><div class="pp-bar"><i style="width:' + pct + '%"></i></div>';
}
function ppDrWrongHtml(){
  var log = ppDrLogAll(), ids = Object.keys(log);
  var wrong = ids.filter(function(k){ return log[k].ok === false; });
  if (!ids.length) return '<div class="pp-dr-wb-empty">📕 错题本：还没判过题。判为「部分正确 / 需复习」的题会自动收进这里。</div>';
  return '<div class="pp-dr-wb"><b>📕 错题本</b><span>累计判过 ' + ids.length + ' 题 · 其中需复习 <b>'
    + wrong.length + '</b> 题</span><button type="button" class="pp-mini-btn" data-dr="onlywrong">只刷这些错题 →</button>'
    + '<button type="button" class="pp-mini-btn" data-dr="clearlog">清空错题本</button></div>';
}
function ppDrAttr(s){ return ppEsc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function ppDrCardHtml(q, pos, total){
  var D = PP.drill, r = D.results[q.id], type = D.type || "open";
  var std = type !== "open"
    ? (type === "choice"
      ? "每个空都选对才算过关；判分不经过 AI，选完立即出结果，不会误判。"
      : "每个空都填对（等价写法也算对）；判分不经过 AI，填完立即出结果，不会误判。")
    : ((q.kind === "口语 / 写作")
      ? "合上答案独立完成这段说 / 写，把完整内容写进作答框再提交判分。"
      : (q.kind === "分步计算"
        ? "独立写出完整演算步骤（不能只写结论）再提交判分，步骤缺失会被判为部分正确。"
        : "独立写出完整分录 / 计算 / 论证（含借贷方向、金额、理由）再提交判分。"));
  var body;
  if (type === "open") {
    body = '<textarea class="pp-dr-input" id="ppDrAnswer" placeholder="在这里写下你的完整作答（计算写步骤、分录写借贷方向和金额、简答写清理由）…">'
      + ppEsc(r ? (r.answerText || "") : "") + '</textarea>';
  } else {
    var pts = ppDrBlanks(q), prev = (r && r.inputs) || [];
    var rows = pts.map(function(p, i){
      var field;
      if (type === "blank") {
        field = '<input class="pp-dr-blank" type="text" data-blank="' + i + '" autocomplete="off"'
          + ' placeholder="填数值" value="' + ppDrAttr(prev[i] || "") + '">';
      } else {
        var opts = ppDrOptions(q, p, i);
        field = '<div class="pp-dr-opts">' + opts.map(function(o, k){
          return '<label class="pp-dr-opt"><input type="radio" name="ppDrOpt' + i + '" value="' + k + '"'
            + (prev[i] && ppDrEq(prev[i], o) ? " checked" : "") + '><span>' + ppEsc(o) + '</span></label>';
        }).join("") + '</div>';
      }
      return '<div class="pp-dr-obj-row"><b class="pp-dr-obj-no">空 ' + (i + 1) + '</b>'
        + '<span class="pp-dr-obj-label">' + ppEsc(p.label) + ' =</span>' + field + '</div>';
    }).join("");
    body = '<div class="pp-dr-obj"><div class="pp-dr-obj-h"><b>'
      + (type === "choice" ? "☑ 选出每个空的正确数值" : "✎ 填出每个空的数值")
      + '</b><span>共 ' + pts.length + ' 个得分点 · 依据上面的题目独立算出</span></div>'
      + rows + '</div>';
  }
  return '<div class="pp-dr-card" data-id="' + ppEsc(q.id) + '">'
    + '<div class="pp-dr-card-h"><span class="pp-dr-no">第 ' + (pos + 1) + ' / ' + total + ' 题</span>'
    + '<span class="pp-dr-tag">' + ppEsc(ppQWeekLabel(q)) + '</span>'
    + '<span class="pp-dr-kind">' + ppEsc(q.kind || "") + '</span>'
    + '<span class="pp-dr-kind pp-dr-type-tag">' + (type === "choice" ? "选择题" : (type === "blank" ? "填空题" : "完整作答")) + '</span>'
    + '<span class="pp-dr-min">约 ' + q.minutes + ' 分钟</span></div>'
    + '<div class="pp-dr-q">' + ppEsc(q.q) + '</div>'
    + '<div class="pp-dr-std"><b>完成标准：</b>' + std + '</div>'
    + body
    + '<div class="pp-dr-actions">'
    + '<button type="button" class="pp-btn pp-btn-navy" data-dr="grade">'
    + (type === "open" ? "✓ 提交作答 · 自动判分" : "✓ 提交答案 · 立即判分") + '</button>'
    + '<button type="button" class="pp-btn" data-dr="skip">不会，直接看答案（记错题）</button>'
    + '<button type="button" class="pp-btn" data-dr="prev">← 上一题</button>'
    + '<button type="button" class="pp-btn" data-dr="next">下一题 →</button>'
    + '<a class="pp-href" data-nav="' + ppEsc(q.href) + '">打开该周笔记 →</a></div>'
    + '<div id="ppDrVerdict">' + (r ? ppDrVerdictHtml(r) : "") + '</div>'
    + '<details class="pp-dr-ref"' + (r ? " open" : "") + '><summary>📖 参考答案（展开复核）</summary><p>'
    + ppEsc(q.answer) + '</p></details></div>';
}
function ppDrRender(){
  var stage = document.getElementById("ppDrStage"), pg = document.getElementById("ppDrProgress");
  if (!stage) return;
  var D = PP.drill || { list: [], idx: 0, results: {} };
  if (pg) pg.innerHTML = ppDrProgressHtml();
  if (!D.list.length) {
    stage.innerHTML = '<div class="pp-q-empty">选好上面的范围，点「▶ 开始刷题」，就会从题库抽出题目，逐题作答并自动判分。</div>';
  } else {
    var q = D.list[Math.max(0, Math.min(D.idx, D.list.length - 1))];
    stage.innerHTML = q ? ppDrCardHtml(q, D.idx, D.list.length) : "";
  }
  var wb = document.getElementById("ppDrWrongBook");
  if (wb) wb.innerHTML = ppDrWrongHtml();
  ppDrSyncCount();
}

/* ---- 判分 / 记录 / 存档 ---- */
function ppDrRecord(q, v){
  if (v.failed) return;   /* 判分失败不污染错题本 */
  var log = ppDrLogAll(), old = log[q.id] || {};
  log[q.id] = { ok: !!v.ok, score: v.score, verdict: v.verdict, n: (old.n || 0) + 1,
    last: v.at, date: ppTodayStr(), cid: q.cid, term: q.term, week: q.week };
  ppDrLogSave(log);
}
function ppDrStart(shuffle){
  if (shuffle) { var o = document.getElementById("ppDrOrder"); if (o) o.value = "random"; }
  var list = ppDrFiltered();
  var seq = (PP.drill && PP.drill.seq ? PP.drill.seq : 0) + 1;
  PP.drill = { list: list, idx: 0, results: {}, grading: false, seq: seq,
    confirmClear: false, type: ppDrCurType() };
  ppDrRender();
  if (!list.length) {
    var st = document.getElementById("ppDrStage");
    if (st) st.innerHTML = '<div class="pp-q-warn">⚠️ 当前范围没有题目（可能是「只看错题」但错题本还空着，或关键词太窄）。放宽筛选后再开始。</div>';
  }
}
function ppDrGo(delta){
  var D = PP.drill;
  if (!D || !D.list.length) return;
  var n = D.idx + delta;
  if (n < 0 || n >= D.list.length) {
    var st = document.getElementById("ppDrStage");
    if (st) {
      var tip = document.createElement("div");
      tip.className = "pp-q-warn";
      tip.textContent = n < 0 ? "已经是第一题了。" : "已经是最后一题了，点「💾 存入复习档案」保存本次练习。";
      st.insertBefore(tip, st.firstChild);
    }
    return;
  }
  D.idx = n; D.grading = false; ppDrRender();
}
/* 客观题判分：逐空与参考答案里的真实数值精确比对，同步完成、完全不依赖 AI */
function ppDrGradeObjective(){
  var D = PP.drill, q = D.list[D.idx], type = D.type, pts = ppDrBlanks(q);
  var got = [], miss = [], okN = 0, answered = 0;
  pts.forEach(function(p, i){
    var v = "";
    if (type === "blank") {
      var el = document.querySelector('#ppDrStage [data-blank="' + i + '"]');
      v = el ? String(el.value || "").trim() : "";
    } else {
      var sel = document.querySelector('#ppDrStage input[name="ppDrOpt' + i + '"]:checked');
      if (sel) { var opts = ppDrOptions(q, p, i); v = opts[Number(sel.value)] || ""; }
    }
    got.push(v);
    if (v) answered++;
    if (ppDrEq(v, p.value)) okN++;
    else miss.push(p.label + "：正确答案 " + p.value + (v ? "，你答 " + v : "，未作答"));
  });
  if (!answered) {
    var vb0 = document.getElementById("ppDrVerdict");
    if (vb0) vb0.innerHTML = '<div class="pp-q-warn">⚠️ 请先'
      + (type === "choice" ? "选出每个空的答案" : "填好每个空")
      + '再提交；确实不会就点「不会，直接看答案」。</div>';
    return;
  }
  var full = okN === pts.length;
  var v = {
    failed: false, ok: full, verdict: full ? "correct" : (okN > 0 ? "partial" : "wrong"),
    score: Math.round(okN / pts.length * 100), missing: miss,
    reason: full ? ("本题 " + pts.length + " 个得分点全对（本地精确比对，不经过 AI）。")
      : ("答对 " + okN + " / " + pts.length + " 个得分点，请对照下方参考答案订正。"),
    type: type, inputs: got, answerText: got.join(" / "), at: new Date().toISOString()
  };
  ppDrRecord(q, v);
  D.results[q.id] = v;
  D.grading = false;
  ppDrRender();
}
function ppDrGrade(){
  var D = PP.drill;
  if (!D || !D.list.length || D.grading) return;
  if (D.type && D.type !== "open") { ppDrGradeObjective(); return; }
  var q = D.list[D.idx], inp = document.getElementById("ppDrAnswer");
  var ans = inp ? String(inp.value || "").trim() : "";
  if (!ans) {
    var vb0 = document.getElementById("ppDrVerdict");
    if (vb0) vb0.innerHTML = '<div class="pp-q-warn">⚠️ 请先写下你的作答再提交判分；确实不会就点「不会，直接看答案」。</div>';
    return;
  }
  D.grading = true;
  var seq = D.seq;
  var vb = document.getElementById("ppDrVerdict");
  if (vb) vb.innerHTML = '<div class="pp-dr-grading">⏳ AI 正在对照参考答案判分…</div>';
  var gb = document.querySelector('#ppDrStage [data-dr="grade"]');
  if (gb) { gb.disabled = true; gb.textContent = "判分中…"; }
  var usr = "【课程】" + q.cn + " · " + ppQWeekLabel(q)
    + "\n【题型】" + (q.kind || "")
    + "\n【题目】" + q.q
    + "\n【参考答案】" + q.answer
    + "\n【学生作答】" + ans;
  ppAiAsk([{ role: "system", content: PP_GRADE_SYS }, { role: "user", content: usr }], null)
    .then(function(text){
      if (!PP.drill || PP.drill.seq !== seq) return;
      var v = ppDrParseVerdict(text);
      if (!v) v = { failed: true, ok: false, verdict: "wrong", score: null, missing: [],
        reason: "AI 未返回规范判分结果，请对照参考答案手动判定。" };
      v.answerText = ans; v.at = new Date().toISOString();
      ppDrRecord(q, v);
      PP.drill.results[q.id] = v;
      PP.drill.grading = false;
      ppDrRender();
    })
    .catch(function(e){
      if (!PP.drill || PP.drill.seq !== seq) return;
      var v = { failed: true, ok: false, verdict: "wrong", score: null, missing: [],
        reason: "自动判分暂不可用：" + (e && e.message ? e.message : "未知原因") + "。请对照参考答案手动判定。",
        answerText: ans, at: new Date().toISOString() };
      ppDrRecord(q, v);
      PP.drill.results[q.id] = v;
      PP.drill.grading = false;
      ppDrRender();
    });
}
function ppDrManual(ok){
  var D = PP.drill;
  if (!D || !D.list.length) return;
  var q = D.list[D.idx], inp = document.getElementById("ppDrAnswer"), prev = D.results[q.id] || {};
  var v = { failed: false, ok: !!ok, verdict: ok ? "correct" : "wrong", score: ok ? 100 : 0,
    missing: [], reason: ok ? "你对照参考答案后判为做对。" : "你对照参考答案后判为需复习。",
    type: D.type, inputs: prev.inputs,
    answerText: inp ? String(inp.value || "").trim() : (prev.answerText || ""),
    at: new Date().toISOString(), manual: true };
  ppDrRecord(q, v);
  D.results[q.id] = v;
  ppDrRender();
}
function ppDrSkip(){ ppDrManual(false); }
function ppDrOverride(){
  var D = PP.drill;
  if (!D || !D.list.length) return;
  var r = D.results[D.list[D.idx].id];
  if (!r) return;
  r.failed = true;
  r.reason = "你选择手动改判，请对照下方参考答案重新判定。";
  ppDrRender();
}
function ppDrSaveSession(){
  var D = PP.drill, msg = document.getElementById("ppDrSaveMsg");
  if (!D || !D.list.length) { if (msg) msg.textContent = "⚠️ 请先开始刷题"; return; }
  var keys = Object.keys(D.results || {});
  if (!keys.length) { if (msg) msg.textContent = "⚠️ 本次还没有判过任何题"; return; }
  /* 与「今日清单」共用同一份复习档案：按 id 合并，本次判定覆盖同题旧状态 */
  var hist = ppArchiveAll(), dt = ppTodayStr(), cur = hist[dt] || {};
  var byId = {};
  (cur.items || []).forEach(function(r){ byId[r.id] = r; });
  keys.forEach(function(id){ byId[id] = { id: id, answered: true, ok: !!D.results[id].ok }; });
  var items = Object.keys(byId).map(function(k){ return byId[k]; });
  var okN = keys.filter(function(k){ return D.results[k].ok; }).length;
  var drill = cur.drill || { sessions: 0, judged: 0, correct: 0 };
  hist[dt] = {
    date: dt, target: cur.target || null, subjects: cur.subjects || [],
    scope: cur.scope || "drill", plannedMinutes: cur.plannedMinutes || 0,
    total: items.length, done: items.filter(function(r){ return r.answered; }).length,
    correct: items.filter(function(r){ return r.ok === true; }).length,
    wrong: items.filter(function(r){ return r.ok === false; }).length,
    items: items, savedAt: new Date().toISOString(),
    drill: { sessions: drill.sessions + 1, judged: drill.judged + keys.length, correct: drill.correct + okN }
  };
  ppArchiveSave(hist);
  ppRenderArchive();
  var acc = Math.round(okN / keys.length * 100);
  if (msg) msg.innerHTML = '✓ 已存入复习档案（' + ppEsc(dt) + '）：本次判 ' + keys.length + ' 题、正确率 ' + acc + '%'
    + (acc < 80 ? '。⚠️ 低于 80%，错题会自动排进以后的今日清单' : '。');
}

/* ---- 事件委托：只绑一次，重渲染不会丢 ---- */
function ppDrBind(){
  var root = document.getElementById("ppDrill");
  if (!root) return;
  root.addEventListener("click", function(ev){
    var t = ev.target && ev.target.closest ? ev.target.closest("[data-dr]") : null;
    if (!t || !root.contains(t)) return;
    var act = t.getAttribute("data-dr");
    if (act === "sub") { t.classList.toggle("on"); ppDrSyncCount(); }
    else if (act === "wk") {
      var on = t.classList.toggle("on");
      if (on) {
        var cid = t.getAttribute("data-cid");
        [].slice.call(document.querySelectorAll("#ppDrSubjects .pp-chip")).forEach(function(s){
          if (s.getAttribute("data-sub") === cid) s.classList.add("on");
        });
      }
      ppDrSyncCount();
    }
    else if (act === "wkclear") {
      [].slice.call(document.querySelectorAll("#ppDrWeeks .pp-dr-wk.on")).forEach(function(b){ b.classList.remove("on"); });
      ppDrSyncCount();
    }
    else if (act === "wkbysub") {
      var subs = ppDrSelectedSubs();
      [].slice.call(document.querySelectorAll("#ppDrWeeks .pp-dr-wk")).forEach(function(b){
        b.classList.toggle("on", subs.indexOf(b.getAttribute("data-cid")) >= 0);
      });
      ppDrSyncCount();
    }
    else if (act === "wkgrp") {
      var c = t.getAttribute("data-cid");
      var list = [].slice.call(document.querySelectorAll("#ppDrWeeks .pp-dr-wk"))
        .filter(function(b){ return b.getAttribute("data-cid") === c; });
      var allOn = list.length && list.every(function(b){ return b.classList.contains("on"); });
      list.forEach(function(b){ b.classList.toggle("on", !allOn); });
      ppDrSyncCount();
    }
    else if (act === "start") ppDrStart(false);
    else if (act === "shuffle") ppDrStart(true);
    else if (act === "grade") ppDrGrade();
    else if (act === "skip") ppDrSkip();
    else if (act === "prev") ppDrGo(-1);
    else if (act === "next") ppDrGo(1);
    else if (act === "manual-ok") ppDrManual(true);
    else if (act === "manual-no") ppDrManual(false);
    else if (act === "override") ppDrOverride();
    else if (act === "save") ppDrSaveSession();
    else if (act === "onlywrong") {
      var m = document.getElementById("ppDrMode"); if (m) m.value = "wrong";
      [].slice.call(document.querySelectorAll("#ppDrSubjects .pp-chip")).forEach(function(b){ b.classList.add("on"); });
      [].slice.call(document.querySelectorAll("#ppDrWeeks .pp-dr-wk.on")).forEach(function(b){ b.classList.remove("on"); });
      ppDrStart(false);
    }
    else if (act === "clearlog") {
      if (!PP.drill.confirmClear) { PP.drill.confirmClear = true; t.textContent = "再点一次确认清空"; t.classList.add("danger"); }
      else { ppDrLogSave({}); PP.drill.confirmClear = false; ppDrRender(); }
    }
  });
  root.addEventListener("change", function(ev){
    var id = ev.target && ev.target.id;
    if (id === "ppDrMode" || id === "ppDrOrder") ppDrSyncCount();
    else if (id === "ppDrType") {
      ppDrTypeSet(ev.target.value);
      ppDrSyncCount();
      var msg = document.getElementById("ppDrTypeMsg");
      if (msg) msg.textContent = (PP.drill && PP.drill.list.length && PP.drill.type !== ev.target.value)
        ? "题型已切换，点「▶ 开始刷题」用新题型重新开始（已判结果仍在错题本）。" : "";
    }
  });
  root.addEventListener("input", function(ev){
    if (ev.target && ev.target.id === "ppDrKw") ppDrSyncCount();
  });
  PP.drill = { list: [], idx: 0, results: {}, grading: false, seq: 0,
    confirmClear: false, type: ppDrTypeGet() };
  ppDrRender();
}
