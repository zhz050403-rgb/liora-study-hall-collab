/* ============================================================
 * 复习计划 · 倒计时（Study Plan）
 * 数据供「复习计划」合并页内嵌展示（renderStudyPlanInline）使用
 * 数据全部基于学习档案 V1.0 + 五科大纲（经济/数学/会计/英语/计算机，按周排）+ 推导锚点。
 * 锚点：Term 1 Week1 周一 = 2026-10-12（已由用户确认：2026-11-06 处于 Week 4）。
 * 所有周次与倒计时均按此锚点换算。若日后官方考试周有变动，改下面 anchor.term1Start 即可整体平移。
 * 样式内联（.sp- 作用域），不依赖额外 css 文件。
 * ============================================================ */
window.STUDY_PLAN = {
  anchor: {
    term1Start: "2026-10-12",   // 周一；已由用户确认
    confirmed: true,
    note: "已由你确认：Term 1 第 1 周 = 2026-10-12（周一）。所有周次与倒计时均按此锚点换算（本周=Week 4，含 2026-11-06）。若日后官方考试周有变动，我会相应调整。"
  },
  /* 目标与约束（来自你的设定） */
  goals: {
    dailyHours: 2,
    target: "每科 A+",
    strategy: "5 科齐头并进，向先考试的科目倾斜"
  },
  /* 考试排期（周次来自大纲，date 为按锚点换算的绝对日期 YYYY-MM-DD，用于倒计时） */
  exams: [
    { cid: "economics",   subj: "经济学", name: "A2 简答书面考 (U1–2)", weight: "15%", week: 4, range: "11/02–11/08", date: "2026-11-02", urgent: false, done: true, note: "✅ 已考完（W4 周五 11/06 确认），成绩待出" },
    { cid: "mathematics", subj: "商业数学",   name: "A1 线上测验 (W4/6/10/13)", weight: "5%",  week: 4, range: "11/02 起", date: "2026-11-02", urgent: true,  note: "按周完成 W4/W6/W10/W13" },
    { cid: "accounting",  subj: "会计学",   name: "Diagnostic 测验", weight: "5%",  week: 5, range: "11/09–11/15", date: "2026-11-09", urgent: false, note: "U1–5 综合" },
    { cid: "economics",   subj: "经济学", name: "A3 小组展示", weight: "15%", week: 7, range: "11/23–11/29", date: "2026-11-23", urgent: false, note: "Challenge Week" },
    { cid: "accounting",  subj: "会计学",   name: "Challenge Week", weight: "15%", week: 7, range: "11/23–11/29", date: "2026-11-23", urgent: false, note: "U1–6 综合实战" },
    { cid: "accounting",  subj: "会计学",   name: "Business Report 报告", weight: "—",  week: 11, range: "12/21–12/27", date: "2026-12-21", urgent: false, note: "圣诞周 · 须自写防 Turnitin" },
    { cid: "accounting",  subj: "会计学",   name: "Viva 答辩", weight: "20%（须过答辩才记分）", week: 12, range: "12/28–01/03", date: "2026-12-28", urgent: false, note: "元旦周 · Hurdle" },
    { cid: "english",     subj: "学术英语",   name: "A1 口语 / A2 简答 / A3 阅读 / A4 听力", weight: "30%", week: 99, range: "T1 Exam Period", date: "2027-01-11", urgent: false, note: "口语 10%·简答 10%·阅读 5%·听力 5%" },
    { cid: "mathematics", subj: "商业数学",   name: "A2 期末考", weight: "45%", week: 99, range: "Exam Period ≈01/11–01/24", date: "2027-01-11", urgent: false, note: "2 小时闭卷 · 权重最大" },
    { cid: "accounting",  subj: "会计学",   name: "Final Exam 期末考", weight: "50%", week: 99, range: "Exam Period ≈01/11–01/24", date: "2027-01-11", urgent: false, note: "闭卷全单元" },
    { cid: "economics",   subj: "经济学", name: "A4 期末考", weight: "50%", week: 99, range: "Exam Period ≈01/11–01/24", date: "2027-01-11", urgent: false, note: "闭卷全单元" },
    { cid: "computing",   subj: "计算机应用", name: "A1 每周在线测验", weight: "20%", week: 4, range: "W1–6 每周", date: "2026-11-02", urgent: false, note: "仅一次机会，W7 末截止" },
    { cid: "computing",   subj: "计算机应用", name: "A2 Tutorial Performance", weight: "20%", week: 13, range: "W1–13 每周", date: "2027-01-10", urgent: false, note: "评分 0/1/2" },
    { cid: "computing",   subj: "计算机应用", name: "A3 期末：Excel MCQ + Word 实操", weight: "60%", week: 99, range: "Exam Block ≈01/11–01/24", date: "2027-01-11", urgent: false, note: "65 分钟闭卷·权重最大" }
  ],
  /* 周计划：每天 2h，5 科齐头并进、向先考的倾斜。split 为各科目分钟数（合计 120）。 */
  weeks: [
    { w: 4,  range: "11/02–11/08", focus: "经济 A2 冲刺 + 数学 W4 测验 + 计算机 W4 测验",
      split: { econ: 59, math: 24, eng: 14, acc: 11, comp: 12 },
      econ: "✅ A2 简答已考完（W4 周五）；复盘对照采分点查漏，转入 A3 展示（W7）选题准备",
      math: "W4 测验复习：函数应用、图像与代数一致性（E02）、应用题结论完整性（E05）",
      eng:  "Reading 每日 20min：Main Idea + 段落结构；Listening 一句话逻辑",
      acc:  "U4 折扣与退货（P0）错题重做：Discount Allowed/Received 基数",
      comp: "A1 W4 在线测验（仅一次机会，W7 末前完成）；W4 tutorial：建学术文档 + Website Evaluation 概念" },
    { w: 5,  range: "11/09–11/15", focus: "会计 Diagnostic + 经济 A2 复盘 + 计算机 W5 测验",
      split: { econ: 27, math: 22, eng: 16, acc: 43, comp: 12 },
      econ: "A2 复盘：对照采分点查漏；开始 A3 展示选题",
      math: "函数综合题计时训练；负号/括号自检（E01）",
      eng:  "Reading 主旨+定位；Listening 同义替换",
      acc:  "Diagnostic 冲刺：U1–5 账户分类、基础分录、折扣退货、调整分录概念",
      comp: "A1 W5 测验；W5 tutorial：Survey 布局/巩固 + Systems Development 概念" },
    { w: 6,  range: "11/16–11/22", focus: "数学 W6 测验 + 英语阅读听力 + 计算机 W6 测验",
      split: { econ: 26, math: 32, eng: 26, acc: 21, comp: 15 },
      econ: "A3 展示材料准备（定义/机制/案例）",
      math: "W6 测验复习：图像变换、定义域端点（E03）、未完成作答（E04）",
      eng:  "Reading 推断题 + 干扰项排除；Listening 笔记法",
      acc:  "U5 调整分录独立实操：Prepaid/Accrued/Depreciation",
      comp: "A1 W6 测验（W1–6 最后一场）；W6 tutorial：学术文档引用 + Excel 入门概念" },
    { w: 7,  range: "11/23–11/29", focus: "经济 A3 展示 + 会计 Challenge Week（双 15%）+ 计算机自主复习",
      split: { econ: 37, math: 16, eng: 16, acc: 36, comp: 15 },
      econ: "A3 小组展示：完整讲稿 + 经济图像 + 问答预案",
      math: "微积分前哨：L19 导数概念预习（尚未作答验证）",
      eng:  "Speaking 即兴→纠错→重答；Writing 句子改写",
      acc:  "Challenge Week 实战：多步骤交易、跨期调整、编表",
      comp: "Challenge Week 无课：自主复习 PPT/Word 基础，为 W8–13 Excel 做准备" },
    { w: 8,  range: "11/30–12/06", focus: "三科均衡巩固 + 计算机 Excel 入门",
      split: { econ: 26, math: 31, eng: 20, acc: 25, comp: 18 },
      econ: "U4–5 外部性/画图巩固；弹性 PED/PES 计算",
      math: "L17–18 函数应用 + 计时综合题",
      eng:  "Reading 无 Highlight 限时训练；Listening 倍数/比较",
      acc:  "U6 过账与结账 c/d、b/d 独立实操",
      comp: "Excel 基础：建表/编辑/格式/基础公式函数/打印布局（tutorial 实操）" },
    { w: 9,  range: "12/07–12/13", focus: "数学 W10 测验前 + 会计报告启动 + 计算机图表",
      split: { econ: 23, math: 31, eng: 18, acc: 30, comp: 18 },
      econ: "U5 弹性 Midpoint Formula、Total Revenue、Tax Incidence",
      math: "W10 测验复习：二次函数应用、最值、区间",
      eng:  "Reading Summary Completion；Speaking 连接词",
      acc:  "Report 框架：选企业、交易线、调整、报表结构",
      comp: "图表可视化 Charts：把数据做成图表并美化" },
    { w: 10, range: "12/14–12/20", focus: "数学 W10 测验 + 会计报告撰写 + 计算机绝对引用",
      split: { econ: 20, math: 35, eng: 15, acc: 30, comp: 20 },
      econ: "弹性综合题 + 错题回看",
      math: "W10 测验冲刺：应用题型全过一遍",
      eng:  "Reading 套题 60% 目标；Listening 完整语义",
      acc:  "Report 初稿：Transaction Analysis→Journal→Ledger→报表",
      comp: "高效操作：填充数据、公式函数、绝对引用 $ ；练手速" },
    { w: 11, range: "12/21–12/27", focus: "会计 Report 收尾（圣诞周）+ 计算机 IF 函数",
      split: { econ: 25, math: 20, eng: 23, acc: 32, comp: 20 },
      econ: "期末框架梳理：U1–5 知识树",
      math: "L19–21 导数原理与规则（系统学）",
      eng:  "Reading+Listening 保持手感；Speaking 语法",
      acc:  "Report 定稿 + 自检清单（账户/金额/重复记账）",
      comp: "IF 函数：条件判断实操，做样例题" },
    { w: 12, range: "12/28–01/03", focus: "会计 Viva 答辩（元旦周）+ 计算机 XLOOKUP",
      split: { econ: 25, math: 20, eng: 23, acc: 32, comp: 20 },
      econ: "A4 期末范围总览：U1–5 高频考点",
      math: "L22–26 切线/最优化",
      eng:  "Speaking Rubric：Processing Text + Transformation 各 20%",
      acc:  "Viva 答辩演练：口头解释每笔分录 why",
      comp: "XLOOKUP 函数：查找匹配实操，做样例题" },
    { w: 13, range: "01/04–01/10", focus: "数学 W13 测验 + 进入期末总复习 + 计算机模拟考",
      split: { econ: 27, math: 24, eng: 22, acc: 25, comp: 22 },
      econ: "U1–5 综合套题 + 简答模板固化",
      math: "W13 测验 + L27–30 积分与面积",
      eng:  "四技能模考节奏；Writing 建立 2 份对照样本",
      acc:  "U1–6 全模块错题回看",
      comp: "总复习 + 模拟考：Excel Quiz / Word 排版实操（按 sample 指令限时练）" },
    { w: 99, range: "Exam Period ≈01/11–01/24", focus: "期末总决战（按权重分配）",
      split: { econ: 28, math: 24, eng: 15, acc: 31, comp: 22 },
      econ: "A4 全单元：简答/论述/评估模板 + PPC/外部性/弹性",
      math: "A2 期末：函数+微积分综合，错题清零",
      eng:  "A1–A4：口语/简答/阅读/听力分项冲刺",
      acc:  "Final：U1–6 编表+调整+分析全真模拟",
      comp: "A3 期末（60%）：Excel 30 MCQ + Word 排版闭卷实操，按大纲 sample 指令全真模拟" }
  ],
  /* 抗遗忘复习：把薄弱点拆成高频小任务，分散回看 */
  review: [
    { subj: "经济学", tag: "高", item: "PPC 外凸因果链：Resources not equally suited → Increasing OC → Bowed-out", freq: "每 3 天，Week4–7；之后每周" },
    { subj: "经济学", tag: "高", item: "Movement（资源重配）vs Shift（产能变化）完整话术 + Pivot 描述", freq: "每 3 天" },
    { subj: "经济学", tag: "高", item: "Opportunity Cost 计算四步：放弃量/获得量/单位/next-best", freq: "每周 2 次" },
    { subj: "经济学", tag: "中", item: "英文术语与语法：unlimited human wants / arises / currently available resources", freq: "每次简答前对照" },
    { subj: "商业数学",   tag: "高", item: "E01 负号/括号/平方后独立检查一次", freq: "每题必做" },
    { subj: "商业数学",   tag: "高", item: "E02 作图前查定义域/截距/渐近线，画完用点验证", freq: "每次作图" },
    { subj: "商业数学",   tag: "中", item: "E03 排除非法根、区分 > 与 ≥、空心/实心点", freq: "每周 2 次" },
    { subj: "商业数学",   tag: "中", item: "E04/E05 交卷前重读最后一句：类型/单位/精度/区间/现实意义", freq: "每套题" },
    { subj: "会计学",   tag: "高", item: "P0 折扣与退货：退货后余额→折扣→实际现金 三步顺序", freq: "每周 2 次" },
    { subj: "会计学",   tag: "高", item: "P0 调整分录：Prepaid/Accrued/Depreciation 独立做", freq: "每周 2 次" },
    { subj: "会计学",   tag: "中", item: "P0 过账结账 c/d、b/d 全流程一题", freq: "每周 1 次" },
    { subj: "会计学",   tag: "中", item: "账户精确分类：Office Supplies vs Purchases / Service Revenue vs Sales", freq: "每次做题对照" },
    { subj: "学术英语",   tag: "高", item: "Reading Main Idea：整段目的≠局部关键词/案例", freq: "每日 20min" },
    { subj: "学术英语",   tag: "高", item: "Reading Inference：区分 may/could 与 must/should，不超证据", freq: "每日" },
    { subj: "学术英语",   tag: "中", item: "Listening 一句话逻辑：because/however/therefore 实时捕捉", freq: "每日 10min" },
    { subj: "计算机应用", tag: "中", item: "Excel 绝对引用 $ 与 IF/XLOOKUP 函数逻辑（期末 60% 权重）", freq: "W8–13 每周 2 次" },
    { subj: "计算机应用", tag: "中", item: "Word 样式集修改（Normal/H1/H2）+ 封面 WordArt/形状", freq: "W10–13 每周 1 次" }
  ]
};

/* ---------- 渲染 ---------- */
function renderStudyPlan(){
  var SP = window.STUDY_PLAN;
  if(!SP) return '<div class="container"><p>计划数据未加载。</p></div>';
  var esc = window.esc || function(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };

  /* 计算当前周（基于真实日期与锚点） */
  function diffDays(a,b){ return Math.round((new Date(b+"T00:00:00Z")-new Date(a+"T00:00:00Z"))/86400000); }
  var todayStr = (function(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); })();
  var dSince = diffDays(SP.anchor.term1Start, todayStr);
  var curWeek = dSince >= 0 ? Math.floor(dSince/7)+1 : 0;

  /* 倒计时文案（考试日期落在当前自然周内也显示为「本周」，而非「已结束」） */
  function cdText(dateStr){
    if(!dateStr) return "";
    var d = diffDays(todayStr, dateStr);
    if(d < 0){
      if(d >= -6) return '<span class="sp-cd sp-cd-now">本周</span>';
      return '<span class="sp-cd sp-cd-done">已结束</span>';
    }
    if(d === 0) return '<span class="sp-cd sp-cd-now">今天</span>';
    if(d <= 14) return '<span class="sp-cd sp-cd-hot">剩 '+d+' 天</span>';
    return '<span class="sp-cd">剩 '+d+' 天</span>';
  }
  /* 从周次 range 解析起始绝对日期（W13/元旦周为 2027 年） */
  function parseRangeStart(range){
    var m = String(range).match(/(\d{1,2})\/(\d{1,2})/);
    if(!m) return null;
    var mo = parseInt(m[1],10), da = parseInt(m[2],10);
    var yr = (mo <= 1) ? 2027 : 2026;
    return yr + "-" + String(mo).padStart(2,"0") + "-" + String(da).padStart(2,"0");
  }
  /* 周卡片倒计时（跨周：进行中 / 还有 N 天 / 已结束） */
  function weekCd(wk){
    if(wk.w === 99) return cdText(parseRangeStart(wk.range));
    var ds = parseRangeStart(wk.range);
    if(!ds) return "";
    var de = new Date(ds+"T00:00:00Z"); de.setUTCDate(de.getUTCDate()+6);
    var endStr = de.toISOString().slice(0,10);
    var dStart = diffDays(todayStr, ds);
    var dEnd = diffDays(todayStr, endStr);
    if(dEnd < 0) return '<span class="sp-cd sp-cd-done">已结束</span>';
    if(dStart <= 0) return '<span class="sp-cd sp-cd-now">进行中·剩 '+(dEnd+1)+' 天</span>';
    return '<span class="sp-cd">还有 '+dStart+' 天</span>';
  }

  /* 最近考试：动态取 14 天内（含本周）的考试 */
  var urgent = SP.exams.filter(function(e){
    if(e.done) return false;
    if(!e.date) return e.urgent;
    var d = diffDays(todayStr, e.date);
    return (d >= -6 && d <= 14);
  });
  var urgentLine = urgent.length ? ("最近考试：" + urgent.map(function(e){ return e.subj+" "+e.name+"（"+e.range+"）"; }).join("；")) : "";

  var examRows = SP.exams.map(function(e){
    var done = !!e.done;
    var hot = (!done && e.date && (function(){ var d = diffDays(todayStr, e.date); return d >= -6 && d <= 14; })());
    var cls = done ? " sp-done" : (hot ? " sp-urgent" : "");
    var cd = done ? '<span class="sp-cd sp-cd-done">✅ 已考完</span>' : cdText(e.date);
    return '<tr class="sp-exam'+cls+'">' +
      '<td class="sp-subj">'+esc(e.subj)+'</td>' +
      '<td class="sp-name">'+esc(e.name)+'</td>' +
      '<td class="sp-w">W'+esc(e.week===99?"期末":e.week)+'</td>' +
      '<td class="sp-range">'+esc(e.range)+' '+cd+'</td>' +
      '<td class="sp-wt">'+esc(e.weight)+'</td>' +
      '<td class="sp-note">'+esc(e.note||"")+'</td></tr>';
  }).join("");

  var weekCards = SP.weeks.map(function(wk){
    var s = wk.split;
    var active = (wk.w === curWeek) ? " sp-wk-active" : "";
    var badge = (wk.w === curWeek) ? '<span class="sp-now">本周</span>' : (wk.w === 99 ? '<span class="sp-fin">期末</span>' : '');
    var bar = function(min,label,color){
      var pct = Math.round(min/120*100);
      return '<div class="sp-bar"><span class="sp-bar-l" style="color:'+color+'">'+label+'</span>' +
        '<span class="sp-bar-track"><span class="sp-bar-fill" style="width:'+pct+'%;background:'+color+'"></span></span>' +
        '<span class="sp-bar-v">'+min+'′</span></div>';
    };
    return '<div class="sp-wk'+active+'">' +
      '<div class="sp-wk-h"><div class="sp-wk-t">W'+wk.w+' <span class="sp-wk-r">'+esc(wk.range)+'</span> '+badge+' '+weekCd(wk)+'</div>' +
      '<div class="sp-wk-f">'+esc(wk.focus)+'</div></div>' +
      '<div class="sp-split">' +
        bar(s.econ,"经济学","#c0392b") + bar(s.math,"商业数学","#1d6fb8") + bar(s.eng,"学术英语","#7d3c98") + bar(s.acc,"会计学","#1e8449") + bar(s.comp,"计算机应用","#2f8f9d") +
      '</div>' +
      '<div class="sp-wk-detail"><b>经济学：</b>'+esc(wk.econ)+'</div>' +
      '<div class="sp-wk-detail"><b>商业数学：</b>'+esc(wk.math)+'</div>' +
      '<div class="sp-wk-detail"><b>学术英语：</b>'+esc(wk.eng)+'</div>' +
      '<div class="sp-wk-detail"><b>会计学：</b>'+esc(wk.acc)+'</div>' +
      '<div class="sp-wk-detail"><b>计算机应用：</b>'+esc(wk.comp||"")+'</div>' +
    '</div>';
  }).join("");

  var reviewRows = SP.review.map(function(r){
    var tagColor = r.tag==="高" ? "#c0392b" : "#b9770e";
    return '<tr><td><span class="sp-tag" style="background:'+tagColor+'">'+esc(r.tag)+'</span> '+esc(r.subj)+'</td>' +
      '<td class="sp-ri">'+esc(r.item)+'</td><td class="sp-rf">'+esc(r.freq)+'</td></tr>';
  }).join("");

  return '' +
  '<style>' +
  '.sp-wrap{max-width:none;margin:0;padding:18px 0 60px}' +
  '.sp-hero{background:linear-gradient(135deg,#0b2545,#1a4a7d);color:#fff;border-radius:14px;padding:22px 24px;margin-bottom:18px}' +
  '.sp-hero h1{font-family:var(--serif);font-size:25px;margin:0 0 6px}' +
  '.sp-hero p{margin:4px 0;opacity:.92;font-size:13.5px}' +
  '.sp-anchor{background:#fff8e6;border:1px solid #f0d89a;border-radius:10px;padding:12px 14px;margin:14px 0;font-size:13px;color:#7a5a12}' +
  '.sp-anchor b{color:#9a6a00}' +
  '.sp-sec{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-bottom:16px}' +
  '.sp-sec h2{font-family:var(--serif);font-size:20px;color:var(--navy-900);margin:0 0 12px;border-bottom:2px solid var(--navy-900);padding-bottom:8px}' +
  '.sp-goals{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:4px}' +
  '.sp-goal{background:var(--navy-050);border:1px solid var(--line-2);border-radius:10px;padding:10px 14px;flex:1;min-width:160px}' +
  '.sp-goal .gk{font-size:12px;color:var(--ink-2)} .sp-goal .gv{font-size:16px;font-weight:700;color:var(--navy-900)}' +
  'table.sp-t{width:100%;border-collapse:collapse;font-size:13px}' +
  'table.sp-t th{background:var(--navy-050);color:var(--navy-900);text-align:left;padding:7px 8px;border-bottom:2px solid var(--line)}' +
  'table.sp-t td{padding:7px 8px;border-bottom:1px solid #eef2f7;vertical-align:top}' +
  '.sp-exam.sp-urgent{background:#fff1f0}' + '.sp-exam.sp-urgent td:first-child{font-weight:700}' + '.sp-exam.sp-done{background:#f3f6f4;color:#6b7785}' + '.sp-exam.sp-done td:first-child{font-weight:700;color:#2e7d5b}' +
  '.sp-wk{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:12px}' +
  '.sp-wk.sp-wk-active{border-color:var(--gold);box-shadow:0 0 0 3px rgba(212,175,55,.18)}' +
  '.sp-wk-h{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:8px}' +
  '.sp-wk-t{font-family:var(--serif);font-size:18px;font-weight:700;color:var(--navy-900)}' +
  '.sp-wk-r{font-size:13px;color:var(--ink-2);font-weight:400;margin-left:6px}' +
  '.sp-wk-f{font-size:13.5px;color:#b06a2c;font-weight:600}' +
  '.sp-now{background:var(--gold);color:var(--navy-900);font-size:11px;padding:2px 8px;border-radius:10px;font-weight:700;margin-left:6px}' +
  '.sp-fin{background:var(--navy-800);color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:6px}' +
  '.sp-cd{display:inline-block;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:6px;background:#eef2f7;color:#51617a;font-weight:600;white-space:nowrap}' +
  '.sp-cd.sp-cd-hot{background:#ffe3da;color:#c0392b}' + '.sp-cd.sp-cd-now{background:#fff3cf;color:#9a6a00}' + '.sp-cd.sp-cd-done{background:#eaeaea;color:#9aa3ad}' +
  '.sp-split{display:flex;flex-direction:column;gap:5px;margin:8px 0 10px;background:var(--navy-050);border-radius:9px;padding:9px 11px}' +
  '.sp-bar{display:flex;align-items:center;gap:8px;font-size:12.5px}' +
  '.sp-bar-l{width:34px;flex-shrink:0;font-weight:600}' + '.sp-bar-track{flex:1;height:9px;background:#dfe7f0;border-radius:6px;overflow:hidden}' +
  '.sp-bar-fill{display:block;height:100%;border-radius:6px}' + '.sp-bar-v{width:34px;text-align:right;color:var(--ink-2)}' +
  '.sp-wk-detail{font-size:13px;color:#33485f;margin:3px 0;line-height:1.5}' + '.sp-wk-detail b{color:var(--navy-900)}' +
  '.sp-tag{color:#fff;font-size:11px;padding:1px 7px;border-radius:9px;font-weight:700}' + '.sp-ri{color:#33485f}' + '.sp-rf{color:var(--ink-2);white-space:nowrap}' +
  '</style>' +
  '<div class="sp-wrap">' +
    '<div class="sp-hero"><h1>📅 考试倒计时与周计划</h1>' +
      '<p>'+esc(SP.goals.strategy)+' · 每天 '+SP.goals.dailyHours+' 小时 · 目标 '+esc(SP.goals.target)+'</p>' +
      (urgentLine ? '<p style="color:#ffd9a0">🔥 '+esc(urgentLine)+'</p>' : '') +
      '<p style="opacity:.8">当前推算：你处于 <b>Week '+curWeek+'</b>（基于锚点 '+esc(SP.anchor.term1Start)+' 开学）</p>' +
    '</div>' +
    '<div class="sp-anchor">⚠️ <b>日期锚点说明：</b>'+esc(SP.anchor.note)+'</div>' +
    '<div class="sp-sec"><h2>🎯 目标与策略</h2><div class="sp-goals">' +
      '<div class="sp-goal"><div class="gk">每日投入</div><div class="gv">'+SP.goals.dailyHours+' 小时</div></div>' +
      '<div class="sp-goal"><div class="gk">各科目标</div><div class="gv">'+esc(SP.goals.target)+'</div></div>' +
      '<div class="sp-goal"><div class="gk">排期策略</div><div class="gv" style="font-size:13px">向先考倾斜</div></div>' +
    '</div></div>' +
    '<div class="sp-sec"><h2>📝 考试排期（大纲周次 + 推导日期）</h2>' +
      '<table class="sp-t"><thead><tr><th>科目</th><th>考核</th><th>周次</th><th>日期(推导)</th><th>权重</th><th>备注</th></tr></thead><tbody>'+examRows+'</tbody></table>' +
    '</div>' +
    '<div class="sp-sec"><h2>🗓️ 周计划（每天 2h 分配）</h2>'+weekCards+'</div>' +
    '<div class="sp-sec"><h2>🔁 抗遗忘复习排期</h2>' +
      '<table class="sp-t"><thead><tr><th>科目/严重度</th><th>薄弱点小任务</th><th>频率</th></tr></thead><tbody>'+reviewRows+'</tbody></table>' +
    '</div>' +
    '<div class="sp-anchor" style="background:#eef6ee;border-color:#bfe0bf;color:#2e6b3e">✅ 这份计划已随学习档案一起发布。每次考试/批改后告诉我「记录这次批改」，我会把新成绩与进度同步进来；若开学日与锚点不符，说一声即可整体平移。</div>' +
  '</div>';
}

/* ---------- 内嵌版：供「复习计划」合并页在备考内容之上展示宏观计划（不重复大标题） ---------- */
function spEsc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function spDiffDays(a,b){ return Math.round((new Date(b+"T00:00:00Z")-new Date(a+"T00:00:00Z"))/86400000); }
function spTodayStr(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function spCurWeek(){ var SP=window.STUDY_PLAN; if(!SP) return 0; var t=spTodayStr(); var ds=spDiffDays(SP.anchor.term1Start,t); return ds>=0?Math.floor(ds/7)+1:0; }
function spCdText(dateStr,todayStr){ if(!dateStr) return ""; var d=spDiffDays(todayStr,dateStr); if(d<0){ if(d>=-6) return '<span class="sp-cd sp-cd-now">本周</span>'; return '<span class="sp-cd sp-cd-done">已结束</span>'; } if(d===0) return '<span class="sp-cd sp-cd-now">今天</span>'; if(d<=14) return '<span class="sp-cd sp-cd-hot">剩 '+d+' 天</span>'; return '<span class="sp-cd">剩 '+d+' 天</span>'; }
function spParseRangeStart(range){ var m=String(range).match(/(\d{1,2})\/(\d{1,2})/); if(!m) return null; var mo=parseInt(m[1],10),da=parseInt(m[2],10); var yr=(mo<=1)?2027:2026; return yr+"-"+String(mo).padStart(2,"0")+"-"+String(da).padStart(2,"0"); }
function spWeekCd(wk,todayStr){ if(wk.w===99) return spCdText(spParseRangeStart(wk.range),todayStr); var ds=spParseRangeStart(wk.range); if(!ds) return ""; var de=new Date(ds+"T00:00:00Z"); de.setUTCDate(de.getUTCDate()+6); var endStr=de.toISOString().slice(0,10); var dStart=spDiffDays(todayStr,ds); var dEnd=spDiffDays(todayStr,endStr); if(dEnd<0) return '<span class="sp-cd sp-cd-done">已结束</span>'; if(dStart<=0) return '<span class="sp-cd sp-cd-now">进行中·剩 '+(dEnd+1)+' 天</span>'; return '<span class="sp-cd">还有 '+dStart+' 天</span>'; }
function spExamRows(todayStr){ var SP=window.STUDY_PLAN; return SP.exams.map(function(e){ var done=!!e.done; var hot=(!done&&e.date&&(function(){var d=spDiffDays(todayStr,e.date);return d>=-6&&d<=14;})()); var cls=done?" sp-done":(hot?" sp-urgent":""); var cd=done?'<span class="sp-cd sp-cd-done">✅ 已考完</span>':spCdText(e.date,todayStr); return '<tr class="sp-exam'+cls+'"><td class="sp-subj">'+spEsc(e.subj)+'</td><td class="sp-name">'+spEsc(e.name)+'</td><td class="sp-w">W'+spEsc(e.week===99?"期末":e.week)+'</td><td class="sp-range">'+spEsc(e.range)+' '+cd+'</td><td class="sp-wt">'+spEsc(e.weight)+'</td><td class="sp-note">'+spEsc(e.note||"")+'</td></tr>'; }).join(""); }
function spWeekCards(curWeek,todayStr){ var SP=window.STUDY_PLAN; return SP.weeks.map(function(wk){ var s=wk.split; var active=(wk.w===curWeek)?" sp-wk-active":""; var badge=(wk.w===curWeek)?'<span class="sp-now">本周</span>':(wk.w===99?'<span class="sp-fin">期末</span>':''); var bar=function(min,label,color){ var pct=Math.round(min/120*100); return '<div class="sp-bar"><span class="sp-bar-l" style="color:'+color+'">'+label+'</span><span class="sp-bar-track"><span class="sp-bar-fill" style="width:'+pct+'%;background:'+color+'"></span></span><span class="sp-bar-v">'+min+'′</span></div>'; }; return '<div class="sp-wk'+active+'"><div class="sp-wk-h"><div class="sp-wk-t">W'+wk.w+' <span class="sp-wk-r">'+spEsc(wk.range)+'</span> '+badge+' '+spWeekCd(wk,todayStr)+'</div><div class="sp-wk-f">'+spEsc(wk.focus)+'</div></div><div class="sp-split">'+bar(s.econ,"经济学","#c0392b")+bar(s.math,"商业数学","#1d6fb8")+bar(s.eng,"学术英语","#7d3c98")+bar(s.acc,"会计学","#1e8449")+bar(s.comp,"计算机应用","#2f8f9d")+'</div><div class="sp-wk-detail"><b>经济学：</b>'+spEsc(wk.econ)+'</div><div class="sp-wk-detail"><b>商业数学：</b>'+spEsc(wk.math)+'</div><div class="sp-wk-detail"><b>学术英语：</b>'+spEsc(wk.eng)+'</div><div class="sp-wk-detail"><b>会计学：</b>'+spEsc(wk.acc)+'</div><div class="sp-wk-detail"><b>计算机应用：</b>'+spEsc(wk.comp||"")+'</div></div>'; }).join(""); }
function spReviewRows(){ var SP=window.STUDY_PLAN; return SP.review.map(function(r){ var tagColor=r.tag==="高"?"#c0392b":"#b9770e"; return '<tr><td><span class="sp-tag" style="background:'+tagColor+'">'+spEsc(r.tag)+'</span> '+spEsc(r.subj)+'</td><td class="sp-ri">'+spEsc(r.item)+'</td><td class="sp-rf">'+spEsc(r.freq)+'</td></tr>'; }).join(""); }
function spSections(curWeek,todayStr){ var SP=window.STUDY_PLAN; return '<div class="sp-sec"><h2>🎯 目标与策略</h2><div class="sp-goals"><div class="sp-goal"><div class="gk">每日投入</div><div class="gv">'+SP.goals.dailyHours+' 小时</div></div><div class="sp-goal"><div class="gk">各科目标</div><div class="gv">'+spEsc(SP.goals.target)+'</div></div><div class="sp-goal"><div class="gk">排期策略</div><div class="gv" style="font-size:13px">向先考倾斜</div></div></div></div><div class="sp-sec"><h2>📝 考试排期（大纲周次 + 推导日期）</h2><table class="sp-t"><thead><tr><th>科目</th><th>考核</th><th>周次</th><th>日期(推导)</th><th>权重</th><th>备注</th></tr></thead><tbody>'+spExamRows(todayStr)+'</tbody></table></div><div class="sp-sec"><h2>🗓️ 周计划（每天 2h 分配）</h2>'+spWeekCards(curWeek,todayStr)+'</div><div class="sp-sec"><h2>🔁 抗遗忘复习排期</h2><table class="sp-t"><thead><tr><th>科目/严重度</th><th>薄弱点小任务</th><th>频率</th></tr></thead><tbody>'+spReviewRows()+'</tbody></table></div><div class="sp-anchor" style="background:#eef6ee;border-color:#bfe0bf;color:#2e6b3e">✅ 这份计划已随学习档案一起发布。每次考试/批改后告诉我「记录这次批改」，我会把新成绩与进度同步进来；若开学日与锚点不符，说一声即可整体平移。</div>'; }
function spStyle(){ return '<style>.sp-inline{max-width:none;margin:8px 0 0;padding:0}.sp-sec{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-bottom:16px}.sp-sec h2{font-family:var(--serif);font-size:20px;color:var(--navy-900);margin:0 0 12px;border-bottom:2px solid var(--navy-900);padding-bottom:8px}.sp-goals{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:4px}.sp-goal{background:var(--navy-050);border:1px solid var(--line-2);border-radius:10px;padding:10px 14px;flex:1;min-width:160px}.sp-goal .gk{font-size:12px;color:var(--ink-2)}.sp-goal .gv{font-size:16px;font-weight:700;color:var(--navy-900)}table.sp-t{width:100%;border-collapse:collapse;font-size:13px}table.sp-t th{background:var(--navy-050);color:var(--navy-900);text-align:left;padding:7px 8px;border-bottom:2px solid var(--line)}table.sp-t td{padding:7px 8px;border-bottom:1px solid #eef2f7;vertical-align:top}.sp-exam.sp-urgent{background:#fff1f0}.sp-exam.sp-urgent td:first-child{font-weight:700}.sp-exam.sp-done{background:#f3f6f4;color:#6b7785}.sp-exam.sp-done td:first-child{font-weight:700;color:#2e7d5b}.sp-wk{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:12px}.sp-wk.sp-wk-active{border-color:var(--gold);box-shadow:0 0 0 3px rgba(212,175,55,.18)}.sp-wk-h{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:8px}.sp-wk-t{font-family:var(--serif);font-size:18px;font-weight:700;color:var(--navy-900)}.sp-wk-r{font-size:13px;color:var(--ink-2);font-weight:400;margin-left:6px}.sp-wk-f{font-size:13.5px;color:#b06a2c;font-weight:600}.sp-now{background:var(--gold);color:var(--navy-900);font-size:11px;padding:2px 8px;border-radius:10px;font-weight:700;margin-left:6px}.sp-fin{background:var(--navy-800);color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:6px}.sp-cd{display:inline-block;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:6px;background:#eef2f7;color:#51617a;font-weight:600;white-space:nowrap}.sp-cd.sp-cd-hot{background:#ffe3da;color:#c0392b}.sp-cd.sp-cd-now{background:#fff3cf;color:#9a6a00}.sp-cd.sp-cd-done{background:#eaeaea;color:#9aa3ad}.sp-split{display:flex;flex-direction:column;gap:5px;margin:8px 0 10px;background:var(--navy-050);border-radius:9px;padding:9px 11px}.sp-bar{display:flex;align-items:center;gap:8px;font-size:12.5px}.sp-bar-l{width:34px;flex-shrink:0;font-weight:600}.sp-bar-track{flex:1;height:9px;background:#dfe7f0;border-radius:6px;overflow:hidden}.sp-bar-fill{display:block;height:100%;border-radius:6px}.sp-bar-v{width:34px;text-align:right;color:var(--ink-2)}.sp-wk-detail{font-size:13px;color:#33485f;margin:3px 0;line-height:1.5}.sp-wk-detail b{color:var(--navy-900)}.sp-tag{color:#fff;font-size:11px;padding:1px 7px;border-radius:9px;font-weight:700}.sp-ri{color:#33485f}.sp-rf{color:var(--ink-2);white-space:nowrap}</style>'; }
function renderStudyPlanInline(){
  var SP=window.STUDY_PLAN; if(!SP) return '';
  var todayStr=spTodayStr(); var curWeek=spCurWeek();
  return spStyle()+'<div class="sp-inline">'+spSections(curWeek,todayStr)+'</div>';
}
