/* Phase 3 内容资产构建脚本：
   生成 5 科专属《学习方法与考前速查手册》(handbooks.json)
   + 多科闭卷练习题包 (exam-packs.json，明确标注为练习巩固题，与会计 U1-U6 官方原题包严格区分)
   + 5 科中英视频补充索引 (videos-extra.json，补齐计算机与学术英语) */
'use strict';

const fs = require('fs');
const path = require('path');

const PUB = path.resolve(__dirname, '..', 'public');
const CHUNKS = path.join(PUB, 'data-chunks');
fs.mkdirSync(CHUNKS, { recursive: true });

const HANDBOOKS = [
  {
    id: 'accounting',
    title: '会计学 · 通关方法与考前速查手册',
    en: 'Accounting (UNSW FNDN) · Study Method & Cheat Sheet',
    color: '#1c4375',
    assessments: [
      { name: 'Diagnostic Quiz (U1–5)', weight: '5%', rule: 'C1 考场禁用 AI', tip: '重点抓账户分类、基础分录与调整分录方向' },
      { name: 'Challenge Week (U1–6)', weight: '15%', rule: 'C1 考场禁用 AI', tip: '综合演练多步交易、退货折扣、T 型账结转与试算表' },
      { name: 'Business Report & Viva Voce', weight: '20% (Viva 须通过否则 0 分)', rule: 'C2 报告自写防 Turnitin', tip: 'W9 发 Case、W12 个人答辩，务必亲自弄懂每笔分录与报表比率' },
      { name: 'Final Exam 期末考', weight: '50%', rule: 'C1 闭卷禁用 AI', tip: '全单元覆盖：分录、调整、T 型账、利润表、资产负债表、比率与现金流' }
    ],
    weeklyMethod: [
      '第 1 步（先定主体与时间线）：读题先标出「谁向谁买/卖」和三个时点（原始交易日 / 期末调整日 / 实际收付款日）。',
      '第 2 步（口诀判借贷）：牢记 DEAD（Debit 增：Drawings / Expenses / Assets）与 CLIC（Credit 增：Capital / Liabilities / Income）。',
      '第 3 步（严格按指令格式作答）：看清题目要 Journal Entry、T-Account、Columnar Ledger 还是 Trial Balance，不要画错表。',
      '第 4 步（借贷必验平）：每写完一笔分录立即核对 Dr 总额 = Cr 总额，退货折扣题必走「原额 − 退货 → 乘折扣率 → 实际现金」三步。'
    ],
    cheatSheets: [
      {
        title: '会计等式与借贷规则（DEAD / CLIC）',
        rows: [
          ['基本等式', 'Assets = Liabilities + Owner’s Equity（扩展：A + Expenses + Drawings = L + Capital + Revenue）'],
          ['借方增加 (Dr +)', 'Assets（资产）、Expenses（费用）、Drawings（提款）、Sales Returns（销货退回）'],
          ['贷方增加 (Cr +)', 'Liabilities（负债）、Owner’s Equity（权益）、Revenue（收入）、Accumulated Depreciation（累计折旧）']
        ]
      },
      {
        title: '五大期末调整分录速查（Unit 5）',
        rows: [
          ['Prepaid Expense（预付耗用）', 'Dr Expense / Cr Prepaid Expense（按已过月数分摊）'],
          ['Unearned Revenue（预收实现）', 'Dr Unearned Revenue / Cr Service/Sales Revenue'],
          ['Accrued Expense（应计未付费用）', 'Dr Expense / Cr Accrued Expense（如期末欠发工资）'],
          ['Accrued Revenue（应计未收收入）', 'Dr Accrued Revenue / Cr Revenue'],
          ['Depreciation（折旧）', 'Dr Depreciation Expense / Cr Accumulated Depreciation（备抵资产，绝不直接贷记原资产！）']
        ]
      },
      {
        title: '财务比率核心公式（Unit 10）',
        rows: [
          ['Current Ratio（流动比率）', 'Current Assets ÷ Current Liabilities（衡量短期偿债能力）'],
          ['Quick / Acid-Test Ratio（速动比率）', '(Current Assets − Inventory − Prepayments) ÷ Current Liabilities'],
          ['Gross Profit Margin（毛利率）', '(Gross Profit ÷ Net Sales) × 100%'],
          ['Net Profit Margin（净利率）', '(Net Profit ÷ Net Sales) × 100%'],
          ['Return on Equity (ROE)', '(Net Profit ÷ Average Owner’s Equity) × 100%']
        ]
      }
    ],
    pitfalls: [
      '折扣基数错：赊销 $7,200、退货 $200、折扣 1% → 必须先减退货得 $7,000，再算 Discount Allowed = $70（不是 $72），实际收现金 $6,930。',
      '购货文具误记 Purchases：只有买来转售的商品（Inventory/Merchandise）才记 Purchases；买办公用品记 Office Supplies，买设备记 Equipment。',
      '服务收入误记 Sales：提供咨询/维修等服务记 Service Revenue，销售实物商品记 Sales。',
      '部分付款算错：客户欠 $5,000 只付 $1,000，分录只按实际收到的 $1,000 记（除非明确触发折扣条款）。',
      'T 型账 c/d 与 b/d 放反：Balance c/d 永远填在「较小一侧」用来凑平，Balance b/d 永远写在下期「正常余额一侧」。'
    ]
  },
  {
    id: 'economics',
    title: '经济学 · 通关方法与考前速查手册',
    en: 'Economics (Micro & Macro) · Study Method & Cheat Sheet',
    color: '#276749',
    assessments: [
      { name: 'A2 简答书面考 (U1–2)', weight: '15%', rule: 'C1 书面闭卷', tip: '英文因果链完整度决定 60 分简答上限' },
      { name: 'A3 小组展示 (Challenge Week)', weight: '15%', rule: '小组协作', tip: '定义 + 经济图像 + 现实案例 + 权衡局限四件套' },
      { name: 'A4 期末考', weight: '50%', rule: 'C1 闭卷', tip: '微观全单元 / 宏观全模型（AD-AS、政策传导与画图）' }
    ],
    weeklyMethod: [
      '答题结构铁律（D-E-E）：任何简答题按 Definition（精准英文定义）→ Explanation（原因 → 机制 → 结果完整因果链）→ Evaluation（前提条件、权衡、局限性）三段展开。',
      '画图四必标：所有图（PPC / D&S / 外部性 / 市场结构 / AD-AS）必标「横纵坐标轴名 + 曲线名 + 原均衡与新均衡点（虚线到坐标轴）+ 移动箭头」。',
      '计算题写全过程：Opportunity Cost 与 Elasticity 必须写「公式 → 代入带单位数值 → 经济含义解读」。',
      '每日 5 分钟术语纠偏：用站内「术语闪卡」背准地道经济英文，避免中式直译扣分。'
    ],
    cheatSheets: [
      {
        title: '微观核心公式与判断（Term 1）',
        rows: [
          ['Opportunity Cost（机会成本）', '放弃量 ÷ 获得量（必写单位 + next-best alternative）'],
          ['PED（需求价格弹性）', '%ΔQd ÷ %ΔP（Midpoint 法：[(Q2−Q1)/((Q1+Q2)/2)] ÷ [(P2−P1)/((P1+P2)/2)]）'],
          ['总收益与弹性关系', '|PED|>1（弹性大）降价增收；|PED|<1（弹性小）提价增收'],
          ['YED / XED', 'YED>0 正常品、<0 低档品；XED>0 替代品、<0 互补品'],
          ['利润最大化 & 停产点', 'MR = MC；短期 P < AVC 停产；完全竞争长期 P = min AC（经济利润 = 0）']
        ]
      },
      {
        title: '宏观核心公式与政策传导（Term 2）',
        rows: [
          ['Real GDP（实际 GDP）', '(Nominal GDP ÷ Price Index) × 100'],
          ['Inflation Rate（通胀率）', '[(CPI₂ − CPI₁) ÷ CPI₁] × 100%'],
          ['Unemployment Rate（失业率）', '(Unemployed ÷ Labour Force) × 100%（Labour Force = Employed + Unemployed）'],
          ['AD 组成', 'AD = C + I + G + (X − M)'],
          ['紧缩货币政策传导', 'RBA 升息 → 借贷成本升 & 储蓄意愿升 → C、I 降 & 汇率升致净出口降 → AD 左移 → 通胀回落但增速放缓']
        ]
      }
    ],
    pitfalls: [
      'PPC 向外凸（bowed-out）漏掉因果链：必须完整写出 resources are not equally suited to producing both goods → increasing opportunity cost → bowed-out PPC。',
      'Movement vs Shift 混淆：沿 PPC 移动是现有资源重分配；整条曲线外移才是资源增多/技术进步带来的能力扩张（只影响一种商品时表现为绕一轴旋转 pivot）。',
      '地道英文高频纠错：用 unlimited human wants（勿写 human’s unlimited want）；用 opportunity cost arises（勿写 is happened）；用 increasing opportunity cost（勿写 inefficiently capacity）。',
      '失业率陷阱：气馁工人（discouraged workers）退出劳动力市场会使失业率数字下降，但并不代表就业增加！'
    ]
  },
  {
    id: 'mathematics',
    title: '商业数学 · 公式速查与 E01–E05 防扣分手册',
    en: 'Mathematics for Commerce · Formula Sheet & Error Checklist',
    color: '#7d5a1c',
    assessments: [
      { name: 'A1 线上测验 (W4/6/10/13)', weight: '5%', rule: 'C1 独立完成', tip: '4 次全过才拿 5%，用它检验当周计算盲区' },
      { name: 'A2 期末考 (2小时闭卷)', weight: '45%', rule: 'C1 闭卷', tip: '6 道递增难度多问大题，考前必限时刷完 3 套 Sample Papers' }
    ],
    weeklyMethod: [
      '先做再看解答：每学完一讲，合上笔记独立手算 3 道讲义原题，再点开笔记里的「看解答」逐行对步骤。',
      '每道错题贴 E01–E05 标签：绝不笼统归因为「粗心」，必须标清是符号、图像、定义域、审题还是应用建模错误。',
      '草稿分区 + 反向代入验算：方程解出根后花 10 秒代回原式检验（尤其是对数真数 > 0 和分母 ≠ 0）。',
      '考前公式盲默：对照本手册默写导数、积分、数列、年金与分布公式，保证考场零卡壳。'
    ],
    cheatSheets: [
      {
        title: 'Term 1 核心公式（代数、函数、微积分）',
        rows: [
          ['二次函数顶点与求根', 'y = a(x−h)² + k，顶点 (h, k)；x = [−b ± √(b²−4ac)] / (2a)'],
          ['对数核心法则', 'log(ab)=log a + log b；log(a/b)=log a − log b；log(aⁿ)=n log a；真数严格 > 0'],
          ['基本求导', '(xⁿ)′ = nxⁿ⁻¹；(eᵏˣ)′ = keᵏˣ；(ln|ax+b|)′ = a/(ax+b)；积商链式法则'],
          ['驻点与最值', 'f′(x)=0 求驻点；f″(x)>0 极小值，f″(x)<0 极大值；闭区间必比端点'],
          ['定积分与面积', '∫(1/x)dx = ln|x| + C（区间不能跨 0）；求面积先找零点，x 轴下方加负号取绝对值']
        ]
      },
      {
        title: 'Term 2 核心公式（金融、概率、统计分布）',
        rows: [
          ['AP / GP 数列', 'AP: Tn=a+(n−1)d, Sn=n/2[2a+(n−1)d]；GP: Tn=arⁿ⁻¹, S∞=a/(1−r) 仅当 |r|<1'],
          ['复利与年金', 'FV = P(1+i)ⁿ；普通年金终值 S = R[(1+i)ⁿ−1]/i；现值 A = R[1−(1+i)⁻ⁿ]/i'],
          ['排列组合与概率', 'nPr = n!/(n−r)!（有序）；nCr = n!/[r!(n−r)!]（无序）；P(A|B)=P(A∩B)/P(B)'],
          ['二项分布 B(n,p)', 'P(X=k)=C(n,k)pᵏ(1−p)ⁿ⁻ᵏ；E(X)=np；Var(X)=np(1−p)；SD=√(np(1−p))'],
          ['正态分布 N(μ,σ²)', 'Z = (X−μ)/σ；画钟形图确认阴影方向，注意题目给的是方差 σ² 还是标准差 σ']
        ]
      }
    ],
    pitfalls: [
      '【E01 符号与括号】展开负号括号、配方常数项、平移/反射（f(-x) 关于 y 轴翻折，-f(x) 关于 x 轴翻折）最易丢负号。',
      '【E02 图像完整性】画 y=ln(-x) 看清定义域在 x<0；|2x+y|=1 是两条平行线不是 V 形；必标渐近线方程与 x/y 截距。',
      '【E03 定义域与端点】解对数方程必排除非法根；严格区分 >（空心圆）与 ≥（实心圆），盈亏区间是否含端点要看题意。',
      '【E04 审题与精度】要 Equation 别只写表达式；问解的个数别只列 x；要 3 s.f. 别留 ln 形式；应用题求完 x 必须写一句实际文字结论（带单位）。',
      '【E05 金融与统计舍入】中间步骤保留完整计算器精度，最后一步再按要求舍入；保证年限/次数题看清是向上取整还是保守向下取整。'
    ]
  },
  {
    id: 'computing',
    title: '计算机应用 · Excel 函数卡与 Word 闭卷实战手册',
    en: 'Computing (Excel & Word) · Closed-Book Exam Cheat Sheet',
    color: '#6b46c1',
    assessments: [
      { name: 'A1 每周在线测验 (W1–6)', weight: '20%', rule: 'C1 仅一次机会', tip: 'W7 末截止，PPT/Word/硬件/网络/SDLC/Excel 概念逐周清空' },
      { name: 'A2 Tutorial Performance (W1–13)', weight: '20%', rule: '0/1/2 评分', tip: '每周文件准时且完整提交就能稳拿 2 分' },
      { name: 'A3 Term 1 期末闭卷考 (65 分钟)', weight: '60%', rule: 'C1 闭卷禁 AI', tip: '30 道随机 Excel MCQ + Word 按指令排版回传，是最高权重冲 A+ 核心' }
    ],
    weeklyMethod: [
      '必须用笔记本实操（手机/平板无法练手速）：每次做完公式按 Ctrl+`（Mac 按 Control+`）切换「公式视图」逐格复核。',
      '函数三问自检法：写任何 Excel 公式前先问 ① 拖拉时哪些单元格要加 `$`？② 文本条件有没有加英文双引号？③ 参数顺序有没有反（SUMIF vs SUMIFS）？',
      'Word 排版三铁律：改全篇格式永远改 Styles（Normal / Heading 1 / Heading 2）不手动刷；换页用 Page Break、换页眉/方向用 Section Break 并取消 Link to Previous。',
      '考前 1 周做 2 次 65 分钟计时全真模拟：30 分钟 Excel MCQ + 35 分钟 Word 实操回传。'
    ],
    cheatSheets: [
      {
        title: 'Excel 闭卷必考函数速查卡',
        rows: [
          ['绝对/混合引用 ($)', '$A$1 锁行列；$A1 锁列不锁行；A$1 锁行不锁列（编辑栏按 F4 循环切换）'],
          ['IF 与嵌套 IF', '=IF(C2>=85,"HD",IF(C2>=75,"DN",IF(C2>=50,"PS","FL")))'],
          ['AND / OR 组合', '=IF(AND(B2>=50,C2>=50),"Pass","Fail")（每个条件必须写完整比较式！）'],
          ['XLOOKUP 查找', '=XLOOKUP(查找值, 查找区$绝对引用, 返回区$绝对引用, "Not Found", [匹配模式])'],
          ['条件统计（防反序！）', 'COUNTIF(范围,条件) | SUMIF(条件区,条件,求和区) | SUMIFS(求和区,条件区1,条件1,...)'],
          ['财务与文本函数', '=PMT(年利率/12, 年数*12, -本金) | LEFT / RIGHT / MID / LEN / TRIM / TEXTJOIN']
        ]
      },
      {
        title: 'Excel 常见错误代码速诊',
        rows: [
          ['#DIV/0!', '分母为 0 或引用了空白单元格'],
          ['#N/A', 'XLOOKUP 找不到匹配值（常因查找区忘加 $ 导致拖拉错位，或有多余空格）'],
          ['#NAME?', '函数名拼错，或公式里的英文文本忘了加双引号 ""'],
          ['#VALUE!', '数据类型错误（如把文字拿去做加减乘除）'],
          ['#REF!', '公式引用的行/列被删除导致引用失效']
        ]
      },
      {
        title: 'Word 闭卷排版核对清单',
        rows: [
          ['Styles 样式集', '右键 Modify Normal / Heading 1 / Heading 2 统一字体、字号、段前段后距'],
          ['分节与页眉页脚', 'Layout → Breaks → Section Break (Next Page) → 点掉 Link to Previous'],
          ['封面与目录', 'Cover Page / WordArt / Shapes 按指令设置；正文用 Heading 样式后可自动插目录'],
          ['出勤与交卷红线', '确认出勤率 ≥ 80%；交卷前核对文件名与保存路径']
        ]
      }
    ],
    pitfalls: [
      '拖拉公式忘锁 `$`：税率、折扣率、XLOOKUP 的查找表区域只要向下拖拉，必须加 `$`！',
      'AND 写成简写：不能写 AND(B2,C2>=50)，必须写 AND(B2>=50,C2>=50)。',
      'SUMIF 与 SUMIFS 参数顺序颠倒：SUMIF 求和区在最后，SUMIFS 求和区在最前！',
      '多工作表操作忘取消分组（Ungroup Sheets）：选多张表统一改完格式后忘记取消，后续输入会覆盖所有表。'
    ]
  },
  {
    id: 'english',
    title: '学术英语 · 每日 45 分钟提分剧本与 Rubric 手册',
    en: 'Academic English (2026 STD O2) · Daily Drill & Rubric Guide',
    color: '#b03030',
    assessments: [
      { name: 'A1 Speaking（口语与文本转述）', weight: '10%', rule: 'Processing Text 20% + Transformation 20%', tip: '不是背模板，关键是听/读懂原文后用自己的话准确转述并互动' },
      { name: 'A2 Short Answer（简答写作）', weight: '10%', rule: '学术写作规范', tip: '用准模糊限制语、转述动词、衔接词与名词化' },
      { name: 'A3 Reading & A4 Listening Exam', weight: '10% (R5%+L5%)', rule: 'C1 闭卷', tip: '核心提分点：同义替换定位 + 证据型推断，目标正确率稳步突破 60%+' }
    ],
    weeklyMethod: [
      '每日 45 分钟固定剧本：Reading 20 分钟（只做主旨 + 定位 + 找原文证据）→ Listening 10 分钟（抓整句逻辑与同义替换）→ Speaking 10 分钟（90 秒即兴录音 → AI/自检纠错 → 重录一遍）→ Writing 5 分钟（1–2 句改写/名词化）。',
      '阅读三步法：先读题干划定位词 → 扫读段落首尾句抓「段落目的（Main Idea）」→ 逐词核对同义替换证据句，绝不凭局部词猜答案。',
      '推断题铁律：只选「原文逻辑必然推出」的选项，凡是把原文 may/could 偷换成 must/always、或把相关说成因果的选项一律排除。',
      '每次练习必记录错因分类（词汇 / 句法 / 定位 / 推断 / 时间压力），避免笼统归因于词汇量不足。'
    ],
    cheatSheets: [
      {
        title: '学术表达四大提分工具（W4 / W6 / W9 / W11）',
        rows: [
          ['Hedging（模糊限制语）', 'may / might / could / tend to / appear to / arguably / to some extent（禁用无证据的 all / always / prove）'],
          ['Reporting Verbs（转述动词）', '中立：state, observe, note；支持：demonstrate, confirm；谨慎/争议：claim, contend, suggest'],
          ['Cohesion（衔接手段）', '递进：Furthermore / Moreover；转折：However / Conversely / Whereas；因果：Consequently / As a result'],
          ['Nominalisation（名词化）', 'cities expand rapidly → the rapid expansion of cities；people consume energy → energy consumption']
        ]
      },
      {
        title: 'A1 Speaking 转述三步框架',
        rows: [
          ['1. 抓主旨 (Main Point)', 'According to the text, the primary argument is that...'],
          ['2. 转述机制 (Transform)', 'Rather than repeating words, paraphrase the cause-effect link using your own sentence structure.'],
          ['3. 评价与互动 (Interact)', 'While this approach may address..., a potential limitation is that... What is your view on...?']
        ]
      }
    ],
    pitfalls: [
      '阅读抓局部关键词忽略整段目的：选 Main Idea 前先用中文一句话总结「这一段作者到底想干嘛」。',
      '推断题过度脑补：没有原文直接证据支撑的「常识正确」选项往往是干扰项。',
      '转述只换近义词不换句式：既容易踩 Turnitin 相似率，也会在 A1 Transformation 项失分。',
      '口语即兴遗漏主谓一致与单复数：每次录完 60–90 秒回听一遍，专门抓时态和三单错误后重说一遍效果最好。'
    ]
  }
];

/* ---------- 多科闭卷巩固练习题包（与会计 U1-U6 官方原题库互补） ---------- */
const EXAM_PACKS = {
  version: '20261122-v1',
  note: '以下题目为基于 UNSW 2026 五科课程范围与个人高频薄弱点编写的巩固练习题（sourceType: practice_pack），与会计 U1–U6 官方 PDF 引文题库严格区分。',
  packs: [
    {
      id: 'acc-u7-11',
      course: 'accounting',
      title: '会计 U7–U11 核心巩固（试算表 / 报表 / 比率 / 现金流）',
      questions: [
        { id: 'ep-acc-1', topic: 'Unit 7 Trial Balance', prompt: 'Which of the following errors WILL still allow a Trial Balance to balance (Dr = Cr)?', options: ['Posting only the debit side of a $500 cash sale', 'Recording a $300 purchase of office supplies as Debit Purchases $300, Credit Cash $300', 'Entering $450 on the debit side and $540 on the credit side', 'Adding the credit column incorrectly by $100'], answer: 1, explanation: '记错科目但借贷金额相等（Error of Principle / Commission）不会破坏试算表借贷平衡；单边过账、金额不等或加总错才会导致不平。', errorTag: '试算表局限' },
        { id: 'ep-acc-2', topic: 'Unit 4 Discounts & Returns', prompt: 'A business sells goods on credit for $7,200. The customer returns $200 of goods and pays within the 1% settlement discount period. What is the Discount Allowed and Cash Received?', options: ['Discount Allowed $72; Cash $6,928', 'Discount Allowed $70; Cash $6,930', 'Discount Allowed $72; Cash $7,128', 'Discount Allowed $20; Cash $6,980'], answer: 1, explanation: '必须先扣退货：$7,200 − $200 = $7,000，再算 1% 现金折扣 = $70，实际收到现金 = $7,000 − $70 = $6,930。', errorTag: '折扣基数' },
        { id: 'ep-acc-3', topic: 'Unit 5 Adjusting Entries', prompt: 'On 1 May, a business paid $8,000 for 8 months of rent in advance (recorded as Prepaid Rent). What is the adjusting entry on 30 June?', options: ['Dr Prepaid Rent $2,000 / Cr Cash $2,000', 'Dr Rent Expense $2,000 / Cr Prepaid Rent $2,000', 'Dr Rent Expense $6,000 / Cr Prepaid Rent $6,000', 'Dr Prepaid Rent $6,000 / Cr Rent Expense $6,000'], answer: 1, explanation: '5 月 1 日到 6 月 30 日共耗用 2 个月：$8,000 × (2/8) = $2,000 转为当期 Rent Expense，同时冲减资产 Prepaid Rent。', errorTag: '跨期调整' },
        { id: 'ep-acc-4', topic: 'Unit 9 Balance Sheet', prompt: 'Where does Accumulated Depreciation appear in a Classified Balance Sheet?', options: ['Under Current Liabilities', 'Under Non-Current Liabilities', 'As a deduction from the related Non-Current Asset', 'Under Owner’s Equity'], answer: 2, explanation: 'Accumulated Depreciation 是资产备抵账户（Contra-Asset），列在对应非流动资产原值下方作扣减以得出 Carrying Amount（账面净值）。', errorTag: '报表分类' },
        { id: 'ep-acc-5', topic: 'Unit 10 Financial Ratios', prompt: 'Current Assets = $50,000 (including Inventory $15,000 and Prepayments $5,000). Current Liabilities = $20,000. What is the Quick (Acid-Test) Ratio?', options: ['2.50 : 1', '1.75 : 1', '1.50 : 1', '1.25 : 1'], answer: 2, explanation: 'Quick Assets = $50,000 − $15,000 − $5,000 = $30,000；Quick Ratio = $30,000 ÷ $20,000 = 1.50 : 1。', errorTag: '财务比率' },
        { id: 'ep-acc-6', topic: 'Unit 11 Cash Flow Statement', prompt: 'Cash paid to purchase new delivery equipment is classified under which section of the Statement of Cash Flows?', options: ['Operating Activities', 'Investing Activities', 'Financing Activities', 'Non-cash Disclosure'], answer: 1, explanation: '购置或处置长期资产（如设备、房产）属于 Investing Activities（投资活动现金流）。', errorTag: '现金流分类' }
      ]
    },
    {
      id: 'econ-core',
      course: 'economics',
      title: '经济学高频核心（PPC / 弹性 / 外部性 / AD-AS / 宏观政策）',
      questions: [
        { id: 'ep-eco-1', topic: 'Unit 2 PPC', prompt: 'Why is a typical Production Possibility Curve (PPC) bowed outward (concave to the origin)?', options: ['Resources are unlimited in the long run', 'Resources are not equally suited to producing all goods, leading to increasing opportunity cost', 'Technology improves at a constant rate', 'All goods have identical opportunity costs'], answer: 1, explanation: '核心因果链：resources are not equally suited to producing both goods → increasing opportunity cost → bowed-out PPC。', errorTag: 'PPC因果链' },
        { id: 'ep-eco-2', topic: 'Unit 5 PED & Revenue', prompt: 'If the Price Elasticity of Demand (|PED|) for a product is 0.4, what happens to Total Revenue when the firm raises its price?', options: ['Total Revenue increases', 'Total Revenue decreases', 'Total Revenue remains unchanged', 'Quantity demanded falls to zero'], answer: 0, explanation: '|PED| = 0.4 < 1 属于缺乏弹性（inelastic），涨价带来价格上升比例大于销量下降比例，因此总收益 TR 上升。', errorTag: '弹性与收益' },
        { id: 'ep-eco-3', topic: 'Unit 4 Market Failure', prompt: 'A factory emits air pollution that harms nearby residents without paying for the damage. Which relationship holds at the free-market equilibrium?', options: ['MSC > MPC, causing overproduction relative to the social optimum', 'MSB > MPB, causing underproduction', 'MSC < MPC, causing underproduction', 'MSC = MSB, achieving allocative efficiency'], answer: 0, explanation: '负生产外部性使社会边际成本高于私人边际成本（MSC > MPC），市场产量高于社会最优产量，产生无谓损失 DWL。', errorTag: '外部性' },
        { id: 'ep-eco-4', topic: 'Macro T2 Unemployment', prompt: 'Employed = 950, Unemployed = 50. If 10 unemployed workers become discouraged and stop looking for work, what happens to the official unemployment rate?', options: ['Increases from 5.0% to 6.0%', 'Remains at 5.0%', 'Decreases from 5.0% to about 4.04%', 'Falls to 0%'], answer: 2, explanation: '退出后劳动力变为 990、失业变为 40，失业率 = 40/990 ≈ 4.04%。失业率下降是因为分子分母同减，不代表就业好转！', errorTag: '失业率口径' },
        { id: 'ep-eco-5', topic: 'Macro T2 AD-AS', prompt: 'A sharp rise in global oil and energy prices shifts which curve in the short-run AD-AS model, and what is the result?', options: ['AD shifts right; higher GDP and higher inflation', 'SRAS shifts left; lower real GDP and higher price level (cost-push inflation)', 'SRAS shifts right; higher GDP and lower price level', 'AD shifts left; lower GDP and lower price level'], answer: 1, explanation: '能源成本飙升推高企业生产成本，导致短期总供给 SRAS 左移，出现产出下降与物价上升（成本推动型通胀/滞胀风险）。', errorTag: 'AD-AS模型' }
      ]
    },
    {
      id: 'math-core',
      course: 'mathematics',
      title: '商业数学高频防错（E01–E05 / 对数 / 微积分 / 金融 / 概率统计）',
      questions: [
        { id: 'ep-math-1', topic: 'T1 W4 Logarithms (E03)', prompt: 'Solve log₂(x − 1) + log₂(x + 1) = 3. What is the valid solution?', options: ['x = 3 and x = −3', 'x = 3 only', 'x = √10 only', 'x = 4 only'], answer: 1, explanation: '合并得 (x−1)(x+1)=2³=8 → x²=9 → x=±3。检验定义域需 x−1>0 且 x+1>0 即 x>1，排除非法根 x=−3，仅 x=3（典型 E03 考点）。', errorTag: 'E03定义域' },
        { id: 'ep-math-2', topic: 'T1 W10 Definite Integrals', prompt: 'What is the total area bounded by y = x, the x-axis, x = −2, and x = 2?', options: ['0', '2', '4', '8'], answer: 2, explanation: '直接积分 ∫₋₂² x dx = 0 会正负抵消！必须按零点 x=0 分段：|∫₋₂⁰ x dx| + ∫₀² x dx = 2 + 2 = 4。', errorTag: '定积分面积' },
        { id: 'ep-math-3', topic: 'T2 W2 Infinite GP', prompt: 'For which values of common ratio r does the infinite geometric series a + ar + ar² + ... (a ≠ 0) converge?', options: ['r < 1', '−1 < r < 1', '−1 ≤ r ≤ 1', 'r > 0'], answer: 1, explanation: '无穷等比级数收敛充要条件是严格满足 |r| < 1（即 −1 < r < 1）；r = ±1 均发散。', errorTag: '级数收敛条件' },
        { id: 'ep-math-4', topic: 'T2 W11 Binomial Distribution', prompt: 'If X ~ B(n = 100, p = 0.2), what are E(X) and the standard deviation SD(X)?', options: ['E(X) = 20, SD = 16', 'E(X) = 20, SD = 4', 'E(X) = 80, SD = 4', 'E(X) = 20, SD = 2√5'], answer: 1, explanation: 'E(X) = np = 20；Var(X) = np(1−p) = 100×0.2×0.8 = 16；SD(X) = √16 = 4（注意别漏开根号！）。', errorTag: '方差与标准差' },
        { id: 'ep-math-5', topic: 'T1 W3 Graphs (E02)', prompt: 'Which description correctly matches the graph of y = ln(−x)?', options: ['Defined for x > 0, reflected across the x-axis', 'Defined for x < 0, reflected across the y-axis, vertical asymptote x = 0', 'Defined for all real x, horizontal asymptote y = 0', 'Same graph as y = −ln(x)'], answer: 1, explanation: '真数 −x > 0 得定义域 x < 0，是 y = ln(x) 关于 y 轴对称的图像，x 截距为 (−1, 0)，渐近线 x = 0（典型 E02 错题）。', errorTag: 'E02图像变换' }
      ]
    },
    {
      id: 'comp-core',
      course: 'computing',
      title: '计算机闭卷核心（Excel $ / IF / XLOOKUP / SUMIFS / Word 样式）',
      questions: [
        { id: 'ep-comp-1', topic: 'Excel Absolute Ref ($)', prompt: 'Cell B2 holds price and $E$1 holds the 10% GST rate. You write =B2*$E$1 in C2 and drag down to C10. What formula appears in C5?', options: ['=B5*E4', '=B5*$E$1', '=$B$2*$E$1', '=B2*$E$4'], answer: 1, explanation: 'B2 为相对引用随行变为 B5，$E$1 锁定行列保持不变。', errorTag: '绝对引用' },
        { id: 'ep-comp-2', topic: 'Excel IF & AND', prompt: 'A student passes only if BOTH Quiz (B2) ≥ 50 AND Exam (C2) ≥ 50. Which Excel formula is valid?', options: ['=IF(AND(B2,C2>=50),"Pass","Fail")', '=IF(AND(B2>=50,C2>=50),"Pass","Fail")', '=IF(OR(B2>=50,C2>=50),"Pass","Fail")', '=IF(B2>=50 AND C2>=50,Pass,Fail)'], answer: 1, explanation: 'AND 里每个参数必须是完整比较式，且返回文本 Pass/Fail 必须加英文双引号。', errorTag: 'IF/AND语法' },
        { id: 'ep-comp-3', topic: 'Excel XLOOKUP', prompt: 'In =XLOOKUP(A2, $F$2:$F$20, $G$2:$G$20, "Missing"), what does the 4th argument "Missing" do?', options: ['Sorts the lookup array alphabetically', 'Returns "Missing" instead of #N/A if A2 is not found', 'Forces an approximate match', 'Searches from bottom to top'], answer: 1, explanation: 'XLOOKUP 第 4 参数是 [if_not_found]，找不到时返回友好文案而非 #N/A 报错。', errorTag: 'XLOOKUP参数' },
        { id: 'ep-comp-4', topic: 'SUMIF vs SUMIFS', prompt: 'Which formula correctly sums Sales (C2:C50) where Region (A2:A50)="NSW" AND Quarter (B2:B50)="Q1"?', options: ['=SUMIFS(A2:A50,"NSW",B2:B50,"Q1",C2:C50)', '=SUMIFS(C2:C50,A2:A50,"NSW",B2:B50,"Q1")', '=SUMIF(C2:C50,A2:A50,"NSW")', '=COUNTIFS(C2:C50,A2:A50,"NSW")'], answer: 1, explanation: 'SUMIFS 的第一个参数永远是 sum_range（求和区域 C2:C50），与单条件 SUMIF 正好相反！', errorTag: 'SUMIFS顺序' },
        { id: 'ep-comp-5', topic: 'Word Section Breaks', prompt: 'You want Page 2 of a Word document to have Landscape orientation and a different header from Page 1 without affecting Page 1. What must you do?', options: ['Insert a Page Break and change orientation', 'Insert a Section Break (Next Page), switch Section 2 to Landscape, and turn off "Link to Previous" in the header', 'Press Enter until Page 2 starts', 'Change the Normal Style to Landscape'], answer: 1, explanation: '页面方向与独立页眉都按 Section（节）控制，必须插 Section Break 并取消 Link to Previous。', errorTag: 'Word分节' }
      ]
    },
    {
      id: 'eng-core',
      course: 'english',
      title: '学术英语高频核心（推断防脑补 / Hedging / 转述动词 / 名词化）',
      questions: [
        { id: 'ep-eng-1', topic: 'Reading Inference', prompt: 'Passage: "Extended screen time may contribute to reduced sleep quality among adolescents, though family routines also play a role." Which statement is validly supported?', options: ['Screen time is the sole cause of poor adolescent sleep.', 'Reducing screen time will definitely cure all sleep disorders.', 'Screen time is possibly one factor linked to poorer sleep in teenagers.', 'Family routines have no impact on adolescent sleep.'], answer: 2, explanation: '原文用 may（可能）和 also（因素之一），只有选项 C 保留了限定语气；A/B 犯了绝对化（sole/definitely）错误。', errorTag: '推断过度绝对' },
        { id: 'ep-eng-2', topic: 'Hedging Language', prompt: 'Which sentence demonstrates appropriate academic hedging?', options: ['AI tools will always ruin students’ critical thinking.', 'Frequent unguided reliance on AI tools may undermine independent reasoning.', 'Every student who uses AI fails to learn anything.', 'AI tools obviously destroy education completely.'], answer: 1, explanation: '学术写作使用 may / tend to 等模糊限制语，并限定条件（frequent unguided reliance），避免 always / every / obviously。', errorTag: '模糊限制语' },
        { id: 'ep-eng-3', topic: 'Nominalisation', prompt: 'Which option best nominalises the clause "Because cities expanded rapidly, housing became less affordable"?', options: ['Cities expanded very fast so houses cost more.', 'The rapid expansion of cities reduced housing affordability.', 'People saw cities grow and paid more rent.', 'Rapidly expanding cities are always expensive.'], answer: 1, explanation: '把动词短语 expanded rapidly 名词化为 the rapid expansion of cities，became less affordable 转为 reduced housing affordability。', errorTag: '名词化' },
        { id: 'ep-eng-4', topic: 'Reporting Verbs', prompt: 'An author presents an argument that lacks strong empirical proof, and you want to report it cautiously. Which verb fits best?', options: ['proves', 'confirms', 'contends / claims', 'demonstrates conclusively'], answer: 2, explanation: 'contend / claim 表达「声称/主张」且保留审慎距离，适用于尚有争议或证据不足的观点。', errorTag: '转述动词' }
      ]
    }
  ]
};

/* ---------- 补齐计算机 & 学术英语双语视频索引 ---------- */
const EXTRA_VIDEOS = {
  computing: {
    id: 'computing',
    cn: '计算机应用',
    en: 'Computing (Excel & Word)',
    desc: '针对 UNSW 闭卷期末（占 60%）：Excel 核心函数、绝对引用、图表与 Word 学术排版中英对照检索与精选教程',
    units: [
      {
        unit: 'W4 / Word',
        title: 'Word 样式集（Styles）、分节符与学术排版',
        zh: { label: 'B 站 · Word 样式与分节页眉页脚实战', url: 'https://search.bilibili.com/all?keyword=Word+%E6%A0%B7%E5%BC%8F+%E5%88%86%E8%8A%82%E7%AC%A6+%E9%A1%B5%E7%9C%89%E9%A1%B5%E8%84%9A' },
        en: { label: 'YouTube · Microsoft Word Styles & Section Breaks', url: 'https://www.youtube.com/results?search_query=Microsoft+Word+Styles+Heading+Section+Breaks+tutorial' }
      },
      {
        unit: 'W10 / $',
        title: 'Excel 绝对引用 ($)、相对引用与混合引用',
        zh: { label: 'B 站 · Excel 绝对引用相对引用彻底讲透', url: 'https://search.bilibili.com/all?keyword=Excel+%E7%BB%9D%E5%AF%B9%E5%BC%95%E7%94%A8+%E6%B7%B7%E5%90%88%E5%BC%95%E7%94%A8' },
        en: { label: 'YouTube · Excel Relative vs Absolute Cell References ($)', url: 'https://www.youtube.com/results?search_query=Excel+Relative+Absolute+Mixed+Cell+References+tutorial' }
      },
      {
        unit: 'W11 / IF',
        title: 'Excel IF 条件判断、嵌套 IF 与 AND / OR',
        zh: { label: 'B 站 · Excel IF 嵌套与 AND OR 实战讲解', url: 'https://search.bilibili.com/all?keyword=Excel+IF%E5%87%BD%E6%95%B0+%E5%B5%8C%E5%A5%97+AND+OR' },
        en: { label: 'YouTube · Excel Nested IF with AND OR Functions', url: 'https://www.youtube.com/results?search_query=Excel+IF+AND+OR+Nested+IF+tutorial' }
      },
      {
        unit: 'W12 / XLOOKUP',
        title: 'Excel XLOOKUP 精确/近似查找与跨表引用',
        zh: { label: 'B 站 · XLOOKUP 从入门到跨表实战', url: 'https://search.bilibili.com/all?keyword=Excel+XLOOKUP+%E5%87%BD%E6%95%B0+%E6%95%99%E7%A8%8B' },
        en: { label: 'YouTube · Excel XLOOKUP Complete Tutorial', url: 'https://www.youtube.com/results?search_query=Excel+XLOOKUP+tutorial+exact+approximate+match' }
      },
      {
        unit: 'T2 / 高级',
        title: 'SUMIFS / COUNTIFS 条件统计、PMT 财务函数与组合图',
        zh: { label: 'B 站 · SUMIFS 条件求和与次坐标轴组合图', url: 'https://search.bilibili.com/all?keyword=Excel+SUMIFS+PMT+%E7%BB%84%E5%90%88%E5%9B%BE+%E6%AC%A1%E5%9D%90%E6%A0%87%E8%BD%B4' },
        en: { label: 'YouTube · Excel SUMIFS, PMT & Combo Charts', url: 'https://www.youtube.com/results?search_query=Excel+SUMIFS+PMT+Combo+Chart+Secondary+Axis' }
      }
    ]
  },
  english: {
    id: 'english',
    cn: '学术英语',
    en: 'Academic English (UNSW STD O2)',
    desc: '聚焦 A1–A4 考核：学术阅读同义替换定位、证据型推断、听力逻辑信号词与学术改写/名词化',
    units: [
      {
        unit: 'Reading',
        title: '学术阅读主旨题（Main Idea）、同义替换定位与推断题',
        zh: { label: 'B 站 · 雅思/学术阅读同义替换与推断题技巧', url: 'https://search.bilibili.com/all?keyword=%E9%9B%85%E6%80%9D%E9%98%85%E8%AF%BB+%E5%90%8C%E4%B9%89%E6%9B%BF%E6%8D%A2+%E6%8E%A8%E6%96%AD%E9%A2%98+%E4%B8%BB%E6%97%A8' },
        en: { label: 'YouTube · Academic Reading Paraphrasing & Inference Skills', url: 'https://www.youtube.com/results?search_query=academic+reading+main+idea+inference+paraphrasing+university' }
      },
      {
        unit: 'Listening',
        title: '学术讲座听力：信号词、因果逻辑与高效笔记法',
        zh: { label: 'B 站 · 英文讲座精听笔记法与逻辑信号词', url: 'https://search.bilibili.com/all?keyword=%E5%AD%A6%E6%9C%AF%E5%90%AC%E5%8A%9B+%E8%AE%B2%E5%BA%A7%E7%AC%94%E8%AE%B0+%E4%BF%A1%E5%8F%B7%E8%AF%8D' },
        en: { label: 'YouTube · Academic Lecture Listening & Signposting', url: 'https://www.youtube.com/results?search_query=academic+listening+signposting+note+taking+university+lecture' }
      },
      {
        unit: 'Writing',
        title: '学术写作核心：Hedging、Reporting Verbs 与 Nominalisation',
        zh: { label: 'B 站 · 学术英语写作 名词化 模糊限制语 转述动词', url: 'https://search.bilibili.com/all?keyword=%E5%AD%A6%E6%9C%AF%E8%8B%B1%E8%AF%AD+%E5%90%8D%E8%AF%8D%E5%8C%96+hedging+reporting+verbs' },
        en: { label: 'YouTube · EAP Hedging, Reporting Verbs & Nominalisation', url: 'https://www.youtube.com/results?search_query=academic+english+hedging+reporting+verbs+nominalisation' }
      },
      {
        unit: 'Speaking',
        title: 'A1 口语转述与小组学术讨论（Processing & Transformation）',
        zh: { label: 'B 站 · 英文学术讨论与文献口头转述表达', url: 'https://search.bilibili.com/all?keyword=%E5%AD%A6%E6%9C%AF%E8%8B%B1%E8%AF%AD%E5%8F%A3%E8%AF%AD+%E5%B0%8F%E7%BB%84%E8%AE%A8%E8%AE%BA+%E8%BD%AC%E8%BF%B0' },
        en: { label: 'YouTube · Academic Seminar Discussion & Paraphrasing', url: 'https://www.youtube.com/results?search_query=university+seminar+discussion+speaking+paraphrasing+academic+english' }
      }
    ]
  }
};

fs.writeFileSync(path.join(CHUNKS, 'handbooks.json'), JSON.stringify(HANDBOOKS, null, 2), 'utf8');
fs.writeFileSync(path.join(CHUNKS, 'exam-packs.json'), JSON.stringify(EXAM_PACKS, null, 2), 'utf8');
fs.writeFileSync(path.join(CHUNKS, 'videos-extra.json'), JSON.stringify(EXTRA_VIDEOS, null, 2), 'utf8');

console.log('Wrote handbooks.json (' + HANDBOOKS.length + ' subjects), exam-packs.json (' + EXAM_PACKS.packs.reduce((a, p) => a + p.questions.length, 0) + ' questions across ' + EXAM_PACKS.packs.length + ' packs), videos-extra.json (2 subjects)');
