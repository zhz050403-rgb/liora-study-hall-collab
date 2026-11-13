/* 学科学习档案 V1.0 — 2026-11-06
 * 数据来源：用户整理的四份个人学习档案（经济 / 数学 / 会计 / 学术英语）+ 计算机大纲（Computing for Business, Science and Design，仅大纲排期，暂无个人成绩基线）
 * 渲染函数见 index.html 的 renderLPArchives()
 * 改这份数据后，记得把 index.html 里 learning-profile-data.js?v= 的版本号升一位。
 */
window.LP_ARCHIVES = {
  updated: "2026-11-06",
  version: "V1.0",
  note: "以下为五门课的档案：经济/数学/会计/学术英语为个人基线档案（含成绩）；计算机目前仅有大纲排期与考核权重，暂无个人成绩基线（待每次测验/考试后由 AI 补充）。成绩按口径严格区分：真实考试 / 自报 / 练习 / AI 估分；没有真实成绩时绝不以估分推算。",
  /* 考试排期：五科大纲均为「周次制」，未印绝对日历日期。
     锚点已由用户确认：Term 1 第 1 周 = 2026-10-12（周一），故本周（2026-11-06）= Week 4。
     下方 weekMap 把 W1–W13 + Exam 换算成真实日历日期；考试周（Exam Period）为预估，待官方 timetable 确认。 */
  examCalendar: {
    basis: "confirmed",
    anchor: {
      confirmed: true,
      week1Monday: "2026-10-12",   // 用户确认
      today: "2026-11-06",
      todayWeek: 4,
      examPeriodEst: "2027-01-11 ~ 01-24（预估，待官方 timetable）"
    },
    weekMap: {
      "W1": "10/12–10/18", "W2": "10/19–10/25", "W3": "10/26–11/01", "W4": "11/02–11/08",
      "W5": "11/09–11/15", "W6": "11/16–11/22", "W7": "11/23–11/29", "W8": "11/30–12/06",
      "W9": "12/07–12/13", "W10": "12/14–12/20", "W11": "12/21–12/27", "W12": "12/28–01/03",
      "W13": "01/04–01/10", "EXAM": "01/11–01/24（预估）"
    },
    subjects: {
      econ: "A2 简答(W4 · 11/02–11/08) → A3 展示(W7 · 11/23–11/29) → A4 期末(Exam · 01/11 起)",
      math: "A1 测验(W4/6/10/13 · 11/02 起) → A2 期末(Exam · 01/11 起, 45%)",
      acct: "Diagnostic(W5 · 11/09–11/15) → Challenge(W7 · 11/23–11/29) → 报告(W11 · 12/21–12/27)/答辩(W12 · 12/28–01/03) → 期末(Exam · 01/11 起, 50%)",
      eng: "A1–A4 全在 Term 1 Exam Period（01/11 起）；A8 准备测验贯穿 T1&T2",
      comp: "A1 每周在线测验(W1–6 · 10/12–11/22,20%) → A2 Tutorial(W1–13 · 20%) → A3 期末 Excel+Word 实操(Exam Block · 01/11 起,60%)"
    }
  },
  subjects: [
    {
      key: "econ",
      name: "经济学",
      en: "Economics — Microeconomics (Term 1)",
      color: "#2e7d5b",
      progress: "U1 已学已模考 · U2 有薄弱点 · U3 选择题多练 · U4 巩固外部性画图 · U5 Elasticity 系统学习中",
      assessments: [
        { code: "A1/A5", name: "Participation Portfolio 课堂参与", weight: "20%", week: "W2–13", note: "" },
        { code: "A2", name: "Short Answer Written 简答书面考（U1–2, 45min）", weight: "15%", week: "W4", status: "done", note: "✅ 已考完（W4 周五 11/06 确认），成绩待出" },
        { code: "A3", name: "Group Presentation 小组展示", weight: "15%", week: "W7", note: "Challenge Week" },
        { code: "A6", name: "Pair Work Presentation 双人展示", weight: "20%", week: "W3–13", note: "" },
        { code: "A4", name: "Final Exam 期末考（全单元）", weight: "50%", week: "Exam Period", note: "权重最大" }
      ],
      verdict: "基础概念与选择题较好；英文简答题的因果解释、PPC 深度分析与答案完整性是主要失分点。",
      scores: [
        { name: "A2 简答书面考（U1–2, W4, 45min, 满分100, 权重15%）", val: "已考完，成绩待出", note: "⚠️ 不能由模拟分推算；分数出来后告诉我即更新" },
        { name: "模拟卷 Practice Paper C（U1–2）", val: "72/100（内容）· 69/100（含英语表达）", note: "MC 36/40=90%；简答 36/60=60%" },
        { name: "Q11 Scarcity & Factors of Production", val: "9/12（内容）· 8/12（语言）", note: "" },
        { name: "Q12 Opportunity Cost & Marginal", val: "9/14 · 8/14", note: "" },
        { name: "Q13 PPC 画图与计算", val: "11/18 · 11/18", note: "" },
        { name: "Q14 PPC & Economic Growth", val: "7/16 · 6/16", note: "综合题最弱" }
      ],
      weak: [
        { t: "Increasing Opportunity Cost 原因解释不充分", sev: "高" },
        { t: "PPC Movement vs Shift 区分不完整", sev: "高" },
        { t: "Capital Investment & Growth 因果分析不完整", sev: "中" },
        { t: "Opportunity Cost 计算缺过程 / 单位", sev: "中" },
        { t: "英文术语与语法（human's unlimited want 等）", sev: "中" }
      ],
      errors: [
        "解释 PPC 向外凸漏掉因果链：应写 resources not equally suited → increasing opportunity cost → bowed-out PPC",
        "PPC movement（沿曲线重分配资源）与 shift（生产能力提升）区分不全，未说明 inside→frontier 是否改变产能；技术只影响一种商品时缺 pivot / 截距描述",
        "Opportunity Cost 计算缺「放弃量 / 获得量 / 单位 / next-best alternative」完整过程",
        "英文：human's unlimited want → unlimited human wants；opportunity cost is happened → arises；inefficiently capacity → increasing opportunity cost"
      ],
      priorities: [
        "P0 · PPC 因果解释（bowed-out / IOC / movement / shift / pivot）",
        "P0 · 英文简答题完整性（原因→机制→结果，不漏采分点）",
        "P0 · Opportunity Cost 计算完整（过程 + 单位）",
        "P1 · U3–4 图像分析（DS shifts / equilibrium / price controls / externalities / socially optimal）",
        "P1 · U5 Elasticity（PED/PES/YED/XED、midpoint、total revenue、tax incidence）",
        "P2 · 经济学英文语法（主谓一致、术语搭配、连接词）"
      ],
      rules: [
        "固定答题结构：Definition → Explanation → Evaluation",
        "看到 Explain 题必须写「原因 → 机制 → 结果」",
        "少分值题不为了套模板加无关内容",
        "Discuss / Evaluate 要含条件、权衡、局限、结论",
        "批改时把新成绩与档案旧记录对比，让用户看到实际进步"
      ]
    },
    {
      key: "math",
      name: "数学",
      en: "Mathematics for Commerce (Term 1 · Lecture 16/36)",
      color: "#1f6fb2",
      progress: "Term 1 · 已学到 Lecture 16（Application of Functions and Graphs）；L19 起进入微积分（尚未作答验证）",
      assessments: [
        { code: "A1", name: "Moodle Quizzes 线上测验", weight: "5%", week: "W4, 6, 10, 13", ai: "考场禁用（C1·你自律）", note: "4 次 quiz 各开放一周、无限次尝试、考此前所有周话题；必须通过全部 4 次才记 5%" },
        { code: "A2", name: "Term 1 Exam 期末考", weight: "45%", week: "Exam Period", ai: "考场禁用（C1·你自律）", note: "⚠️ 权重最大 · 2 小时 · 6 道 multipart 题（等分值递增难度）· 考前给 3 套 sample papers" }
      ],
      units: [
        { w: "W1", t: "Basic Algebra · Surds & Indices · Equations (linear/quadratic/simultaneous/absolute value)" },
        { w: "W2", t: "Coordinate Geometry · Relations & Functions · Basic Graphs & Transformations" },
        { w: "W3", t: "Graphs of Parabolas & Hyperbolas · Max/Min · Quadratic Inequalities · |x| Graphs" },
        { w: "W4", t: "Inverse Functions · Logarithms · Graphs of Exponential Functions（A1 #1 在 W4）" },
        { w: "W5", t: "Logarithmic Graphs · More on Domain · Piecewise Functions · Use of Graphs: Eqns & Inequations" },
        { w: "W6", t: "Applications of Functions & Graphs · Review W1–6（A1 #2 在 W6）" },
        { w: "W7", t: "Challenge Week 挑战周" },
        { w: "W8", t: "Introduction to Calculus · Basic Differentiation & Chain Rule · Product/Quotient Rules" },
        { w: "W9", t: "Tangents & Normals · First Derivative Sign · Second Derivative & Concavity" },
        { w: "W10", t: "Curve Sketching · Max/Min Problems · Antiderivatives & Indefinite Integrals（A1 #3 在 W10）" },
        { w: "W11", t: "Definite Integrals · Fundamental Theorem · Areas (below x-axis / between curves)" },
        { w: "W12", t: "Differentiation/Integration of Exponential · Differentiation of Logarithmic" },
        { w: "W13", t: "Integration of Logarithmic · Revision ×2（A1 #4 在 W13）" }
      ],
      verdict: "知识理解较好、能完成综合题；主要风险在计算执行细节、图像变换、答案完整表达与应用题最后一步的现实含义。目标稳定 95%+。",
      scores: [
        { name: "早期数学测验", val: "45/55（81.82%）", note: "自报，排名第二" },
        { name: "Moodle Quiz 1", val: "26/29（89.66%）", note: "系统 8.97/10；有一道指数化简等价但被误判" },
        { name: "第三周数学周测", val: "96/100", note: "主要扣符号与计算细节" },
        { name: "Weekly Quiz 3（数学 Week 3 · Moodle A1 测验）", val: "134/136（98.53%）", note: "真实成绩（2026-11-06 用户提供）；原 AI 估 131–135/136 已作废" },
        { name: "Term 1 Exam", val: "暂无", note: "尚未记录" }
      ],
      weak: [
        { t: "符号 / 括号处理（漏负号、配方常数项符号）", sev: "高" },
        { t: "图像与代数不一致（ln(-x) 方向、|2x+y| 误画、渐近线截距）", sev: "高" },
        { t: "忽略定义域与端点（> 与 ≥、空心实心点、对数非法根）", sev: "中" },
        { t: "没有完全回答题目（类型 / 单位 / 精度 / 范围）", sev: "中" },
        { t: "应用题综合运算（建模对、后续计算或解释错）", sev: "中" }
      ],
      errors: [
        "E01 符号括号：括号展开漏负号、配方常数项符号错、平移反射正负混淆、不等式边界偶尔算错",
        "E02 图像：把 y=ln(-x) 画错方向；把 |2x+y|=1 误画成 V 形；渐近线或截距标错",
        "E03 定义域：对数方程没排除非法根；混淆 > 与 ≥；限制定义域题目误把不含端点放入值域",
        "E04 审题：要 Equation 却只给表达式；问解的数量却给多个 x；要 3 位有效数字却留对数形式；应用题求出临界值没解释实际数量",
        "E05 应用：成本/收入/利润/面积建模对，但交点计算（如 Q3 ≈27.314 千部）、最大面积（Q4 应为 50 m²）、盈利区间（Q5 5,000–24,000 不含端点）、均衡价（Q6 量320 价$3.95）出错"
      ],
      priorities: [
        "P0 · 订正 Lecture 16 的 Q3–Q6",
        "P0 · 二次函数应用题的计算、最大值与区间",
        "P0 · 函数平移 / 反射 / 定义域 / 图像截距",
        "P1 · 完成 L17–18，加入计时综合题",
        "P2 · 微积分 L19–34（导数 / 切线 / 最优化 / 积分 / 指数对数微积分）"
      ],
      rules: [
        "优先使用当期官方课件与 Tutorial Guide",
        "每道题区分：知识漏洞 / 计算错误 / 审题错误 / 答案表达错误；不随意归因「粗心」",
        "批改先核对正确性再评价方法",
        "严格区分真实成绩 / 自报 / 练习 / AI 估分",
        "稳定掌握的内容减少重复，优先训练高频错误",
        "每次阶段测验后更新成绩、知识点状态与错误类型；未学不标薄弱，一次正确不等同掌握"
      ]
    },
    {
      key: "acct",
      name: "会计",
      en: "Accounting (Term 1 · U1–U6 较多学习，U7–11 缺独立验证)",
      color: "#b8862e",
      progress: "U1–2 概念 · U3 账户分类 · U4 基础分录（作业证据最充分）· U5 调整分录（部分理解）· U6 T 型账（理解逻辑）· U7–11 仅接触概念",
      assessments: [
        { code: "P", name: "Participation Portfolio 课堂参与", weight: "10%", week: "W2–13", ai: "可用辅助（C2）", note: "考勤20%+参与40%+作业40%" },
        { code: "DQ", name: "Diagnostic Quiz 诊断测验", weight: "5%", week: "W5", ai: "考场禁用（C1·你自律）", note: "监考测验" },
        { code: "CW", name: "Challenge Week 挑战周测验", weight: "15%", week: "W7", ai: "考场禁用（C1·你自律）", note: "Monopoly 实战+MCQ，监考" },
        { code: "BR", name: "Business Report + Viva Voce 报告与答辩", weight: "20%", week: "W11 报告 / W12 答辩", ai: "可用辅助（C2）· 报告需自己写（Turnitin）", note: "⚠️ 答辩为 hurdle：个人不过则整份报告 0 分" },
        { code: "FE", name: "Final Exam 期末考", weight: "50%", week: "Exam Period", ai: "考场禁用（C1·你自律）", note: "权重最大 · 监考" }
      ],
      units: [
        { w: "W1", t: "Unit 1 Introduction to Accounting 会计入门" },
        { w: "W2", t: "Unit 2 Accounting Conventions 会计惯例" },
        { w: "W3", t: "Unit 3 Double Entry & Transaction Analysis 复式记账与交易分析" },
        { w: "W4", t: "Unit 4 Journal Entries 日记账分录" },
        { w: "W5", t: "Unit 5 Adjusting Journal Entries 调整分录（Diagnostic W5）" },
        { w: "W6", t: "Unit 6 Ledger Accounts: T-format T 型分类账" },
        { w: "W7", t: "Challenge Week Activity 挑战周（CW 15%）" },
        { w: "W8", t: "Unit 7 Ledger Accounts: Column format & Trial Balance 栏式账与试算平衡" },
        { w: "W9", t: "Unit 8 Financial Statements I – Income Statement 利润表" },
        { w: "W10", t: "Unit 9 Financial Statements II: Balance Sheet 资产负债表" },
        { w: "W11", t: "Unit 10 Financial Statements Analysis 报表分析（Report W11）" },
        { w: "W12", t: "Unit 11 Financial Statements III: Cash Flow Statement 现金流量表（Viva W12）" },
        { w: "W13", t: "Revision 总复习" }
      ],
      verdict: "基础两账户分录较稳；一旦题目同时含折扣 / 退货 / 部分付款 / 多日期，错误明显增多。U5、U6 独立实操尚未充分验证。",
      scores: [
        { name: "U4 Tutorial 手写作业（逐项批改）", val: "未按学校标准核定", note: "Q1 全对；Q4 多笔折扣退货错；Thor Painting 全对" },
        { name: "Diagnostic Quiz / Challenge Week", val: "暂无", note: "⚠️ 无核实成绩" },
        { name: "Business Report & Viva / Final Exam", val: "暂无", note: "⚠️ 无核实成绩" },
        { name: "U1–U5 模拟卷 A / B", val: "已制作", note: "⚠️ 无完成记录，不能当已考试" }
      ],
      weak: [
        { t: "Discounts & Returns（折扣基数、退货后折扣、部分付款）", sev: "高" },
        { t: "Adjusting Entries（跨期计提与结算）", sev: "高" },
        { t: "Posting & Balancing（T-account c/d、b/d）", sev: "高" },
        { t: "账户精确分类（Purchases / Supplies / Sales / Service Revenue）", sev: "中" },
        { t: "Trial Balance 汇总", sev: "中" }
      ],
      errors: [
        "Discount Allowed 算成 $700（应为 $70，实际现金 $6,930）",
        "Discount Received：$3,000 应付账款 2% → 正确 Discount Received $60，Cash Paid $2,940",
        "Sales Returns + Settlement Discount：赊销 $7,200 退货 $200 折扣 1% → Remaining A/R $7,000、Discount Allowed $70、Cash $6,930",
        "购买办公文具记入 Purchases → 应为 Office Supplies / Stationery Supplies",
        "提供服务收入记 Sales → 应为 Service Revenue",
        "部分收款 $1,000 错记 $5,000"
      ],
      priorities: [
        "P0 · U4 Discounts & Returns（独立做带退货/折扣/部分付款的分录）",
        "P0 · U5 Adjusting Entries（计提、结算、跨期调整）",
        "P0 · U6 Posting & Balancing（全部 T-account、c/d、b/d）",
        "P1 · U3 账户分类（准确判断业务性质与账户类型）",
        "P1 · U7 Trial Balance（Ledger 余额正确汇总）",
        "P2 · U1–2 定义与惯例（英文概念 + 情景判断）"
      ],
      rules: [
        "先确定交易主体：企业是谁、谁向谁借钱/付款/收款",
        "分清时间线：原始交易 / 期末调整 / 实际结算，避免重复确认",
        "多步骤计算顺序：先退货后余额 → 再折扣 → 再实际现金",
        "看到英文交易能自主选对具体 Account Title",
        "按 Instruction 选 Journal / T-account / Columnar Ledger / Trial Balance",
        "记录保留历史，区分首次作答与订正后表现，才能判断是否真进步",
        "⚠️ 考勤红线：出勤率低于 80% 可能拿不到结业证书；课堂参与占分考勤20%+参与40%+作业40%",
        "⚠️ Viva Voce 是 hurdle（W12）：个人必须过答辩，否则整份 Business Report（20%）记 0 分；小组 4–5 人，Case 在 W9 发放",
        "考场纪律（你自律）：Diagnostic/Challenge/Final 属 C1 考场禁用；Participation/Report 属 C2 可辅助，但报告禁用 AI 生成文本（Turnitin）。AI 老师日常照常帮你。"
      ]
    },
    {
      key: "eng",
      name: "学术英语",
      en: "Academic English (2026 STD O2)",
      color: "#7a4fb0",
      progress: "课堂参与积极、任务完成快；Reading / Listening 标准化答题准确率偏低；Speaking 课堂强、即兴语法待提升；Writing 缺独立评分样本",
      assessments: [
        { code: "A1", name: "Integrated Speaking 口语", weight: "10%", week: "T1 Exam Period", note: "" },
        { code: "A2", name: "Integrated Short Answer 简答", weight: "10%", week: "T1 Exam Period", note: "" },
        { code: "A3", name: "Term 1 Reading Exam 阅读考", weight: "5%", week: "T1 Exam Period", note: "" },
        { code: "A4", name: "Term 1 Listening Exam 听力考", weight: "5%", week: "T1 Exam Period", note: "" },
        { code: "A8", name: "Reading & Listening Prep Quizzes", weight: "3%", week: "T1 & T2", note: "" }
      ],
      verdict: "课堂交流较好，但独立完成标准化学术阅读题正确率明显偏低。不能仅凭一份 Reading Quiz 断言整体英语能力。",
      scores: [
        { name: "IELTS（历史自述）", val: "L6.0 / R6.0 / W5.5 / S5.5 / Overall 6.0", note: "历史自述" },
        { name: "Academic English Reading Quiz", val: "10.40/30（34.67%）", note: "Moodle 截图确认" },
        { name: "Academic English Listening Quiz", val: "约 10/30", note: "历史自述，待完整截图复核" },
        { name: "A1 Integrated Speaking", val: "暂无正式评分", note: "有讨论题/视频，缺可靠转写" },
        { name: "A2 Integrated Short Answer", val: "无批改成绩", note: "待补充" },
        { name: "正式 Reading / Listening Exam", val: "暂无", note: "⚠️ 无正式成绩" }
      ],
      weak: [
        { t: "Reading 主旨理解（抓局部关键词忽略整段目的）", sev: "高" },
        { t: "Reading 信息定位（同义替换不敏感、长文忘位置）", sev: "高" },
        { t: "Reading 推断题（may/could vs must/should、相关性≠因果）", sev: "中" },
        { t: "Listening 整句语义与逻辑关系实时处理不稳", sev: "中" },
        { t: "Speaking 即兴语法与表达灵活度", sev: "中" },
        { t: "Writing 缺独立评分样本（无法判定）", sev: "待验证" }
      ],
      errors: [
        "Reading：把具体案例或细节当作 Main Idea；只匹配相同词汇不做同义替换定位",
        "Reading：推断题把相关性直接推断为因果关系；忽略 may/could 与 must/should 的语气差异",
        "Listening：听到关键词直接选对应选项；对倍数/比较/转折/原因结果的实时处理不稳；选项 paraphrasing 辨认不足",
        "长篇阅读耐受度低：无 Highlight 时定位更困难、易烦躁"
      ],
      priorities: [
        "每天 45 分钟：Reading 20min（主旨/定位/证据）· Listening 10min（整句逻辑+同义替换）· Speaking 10min（即兴→纠错→重答）· Writing 5min（改写/总结）",
        "P0 · Reading 新练习正确率逐步达 60%+",
        "P0 · Listening 能解释关键词与完整语义的关系",
        "P1 · Speaking 减少反复出现的语法错误",
        "P1 · Writing 建立至少 2 份可对照修改的独立样本",
        "注意：A1 Rubric 中 Processing Text 与 Transformation 各占 20%，Grammar/Vocabulary/Interaction 各 10%"
      ],
      rules: [
        "用新独立练习区分：词汇 / 句法理解 / 信息定位 / 选项判断 / 时间压力 各自的影响",
        "Reading 先找段落目的再选 Main Idea；定位靠同义替换而非原词",
        "推断题只选原文证据支持的选项，不超范围",
        "Speaking 训练包含文本理解（Processing Text）与转述（Transformation）",
        "每次测试/作业记录：日期、任务、类型、分数正确率、原题作答、正确答案、错误类型与原因、纠正表达、复测结果"
      ]
    }
    ,
    {
      key: "comp",
      name: "计算机应用",
      en: "Computing for Business, Science and Design (Term 1)",
      color: "#2f8f9d",
      progress: "W1–6 概念+PPT/Word 基础（A1 每周测验 W1–6）；W7 Challenge Week 自主复习；W8–13 Excel 函数与图表（A3 期末 60% 重点）；W13 模拟考",
      assessments: [
        { code: "A1", name: "Weekly Online Quizzes 每周在线测验（Computing Theory）", weight: "20%", week: "W1–6", ai: "考场禁用（C1·你自律）", note: "每周 MCQ 仅一次机会，开到 W7 末；须次周 lecture 前完成" },
        { code: "A2", name: "Tutorial Performance 课堂表现", weight: "20%", week: "W1–13", ai: "考场禁用（C1·你自律）", note: "评分 0/1/2：未做=0；部分完成=1；持续投入+文件准时完整=2" },
        { code: "A3", name: "Term 1 Exam：Excel MCQ + Word 实操", weight: "60%", week: "Exam Block", ai: "考场禁用（C1·你自律）", note: "⚠️ 权重最大 · 闭卷 · Excel 30 道随机 MCQ + Word 按指令排版回传" }
      ],
      units: [
        { w: "W1", t: "Tutorial：建/编/排/导出演示文稿；Lecture：课程导论 + 演示策划" },
        { w: "W2", t: "Tutorial：分组建并排版演示、同伴互评；Lecture：Word 文字处理概念" },
        { w: "W3", t: "Tutorial：文档元素/排版技巧/信息图；Lecture：计算机基础（硬件软件数据）+ 互联网" },
        { w: "W4", t: "Tutorial：建适合学术提交的文档；Lecture：网站评估" },
        { w: "W5", t: "Tutorial：问卷布局/复习巩固；Lecture：系统开发" },
        { w: "W6", t: "Tutorial：学术文档引用；Lecture：Excel 电子表格概念" },
        { w: "W7", t: "Challenge Week：无 Computing 课，自主复习为 W8–13 做准备" },
        { w: "W8", t: "Tutorial：Excel 基础（建表/编辑/格式/基础公式函数/打印布局）；W8–13 无 Lecture" },
        { w: "W9", t: "Tutorial：数据可视化 Charts 图表" },
        { w: "W10", t: "Tutorial：高效操作（填充数据/公式函数/绝对引用 $）" },
        { w: "W11", t: "Tutorial：IF 函数" },
        { w: "W12", t: "Tutorial：XLOOKUP 函数" },
        { w: "W13", t: "Tutorial：总复习 + 模拟考（Excel Quiz / Word 实操）" },
        { w: "Exam", t: "Term 1 Final Exam（65 分钟）：Excel MCQ + Word Processing Practical" }
      ],
      verdict: "暂无个人成绩基线（仅大纲）。从大纲判断重点风险在 Excel 函数（IF / XLOOKUP / 绝对引用）与 Word 样式排版实操，二者占期末 60%，且全部为闭卷禁用 AI。",
      scores: [
        { name: "A1 Weekly Online Quizzes (W1–6, 20%)", val: "暂无", note: "每周 MCQ，尚无成绩" },
        { name: "A2 Tutorial Performance (W1–13, 20%)", val: "暂无", note: "评分 0/1/2" },
        { name: "A3 Term 1 Exam：Excel MCQ + Word 实操 (60%)", val: "暂无", note: "闭卷 Exam Block" }
      ],
      weak: [
        { t: "Excel 函数（IF / XLOOKUP / 绝对引用 $）实操熟练度 — 待基线", sev: "待验证" },
        { t: "Word 样式集与封面排版（WordArt / 形状 / 修改 Normal·H1·H2 样式）— 待基线", sev: "待验证" },
        { t: "图表可视化与数据呈现 — 待基线", sev: "待验证" }
      ],
      errors: [
        "暂无（未提供练习/考试记录）"
      ],
      priorities: [
        "每周紧跟 tutorial：W1–6 概念+PPT/Word；W8–13 Excel 函数与图表（重点 IF / XLOOKUP / 绝对引用）",
        "A1 每周 quiz 务必在次周 lecture 前完成（仅一次机会，开到 W7 末）",
        "A2 每周 tutorial 任务当周完成/提交，争取 2 分档",
        "P0 · A3 期末（60%）闭卷实操：Excel 30 MCQ + Word 排版，按 sample 指令练手速与准确度",
        "注意：W7 Challenge Week 无课，自主复习为 W8–13 做准备"
      ],
      rules: [
        "AI Category 1：A1 / A2 / A3 三项考核全部禁用 AI（含闭卷考试、课堂测验、实操任务）",
        "A1 每周在线测验仅一次机会、随机题，须次周 lecture 前完成，W7 末截止",
        "A2 Tutorial Performance 评分 0/1/2：未做或脱离课堂=0；部分完成=1；持续投入且文件准时完整=2",
        "A3 用本机安装好的 MS Office（Excel + Word）考试；Excel 30 道随机 MCQ（可能多选），Word 按指令下载文件排版后回传",
        "80% 出勤红线：低于 80% 可能拿不到结业证书（整个 Foundation Program 计）",
        "每周建议 1–2 小时自主复习（大纲建议），须用笔记本/笔电，手机/平板不适合实操"
      ]
    }
  ]
};
