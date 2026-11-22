/* Phase 2 + Phase 3 数据工程构建脚本（幂等、可复现、安全校验）
   1. 安全合入 64 周高质量重写笔记（会计/经济/数学）+ 保留已有官方勘误与 PDF 链接
   2. 补齐计算机应用（26 周答案与 T2 缺口周）、学术英语（14 周解题框架与答案思路）、课外拓展缺口
   3. 挂载站内真实 PDF（public/sources/*）到对应周次，减少离线 404
   4. 自动抽取 + 精选 5 门课结构化中英术语表（glossary.json + 挂载至对应周次）
   5. 剥离 60+ 空壳占位书至 wishlist-books.json，拆分 data.js / reading-data.js 为按需加载分片（public/data-chunks/） */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const CHUNKS_DIR = path.join(PUB, 'data-chunks');
const MANIFEST_BASE = '/Users/a543/Documents/liora-study-hall-collab/notes';
const CORE_COURSE_IDS = new Set(['accounting', 'economics', 'mathematics', 'computing', 'english', 'extracurricular']);

function loadWindowScript(filePath) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), ctx);
  return ctx.window;
}

/* ---------- 精选 5 科核心中英术语（与 UNSW 2026 大纲和学习档案对齐） ---------- */
const CURATED_GLOSSARY = [
  // Accounting
  { id: 'acc-entity', course: 'accounting', week: '1', en: 'Accounting Entity Concept', zh: '会计主体假设', def: '企业财务记录必须与所有者个人财务严格分开。' },
  { id: 'acc-accrual', course: 'accounting', week: '1', en: 'Accrual Basis', zh: '权责发生制', def: '收入在赚取时确认、费用在发生时确认，不论现金是否收付。' },
  { id: 'acc-going', course: 'accounting', week: '1', en: 'Going Concern', zh: '持续经营假设', def: '假定企业在可预见的未来持续运营，不会清算停业。' },
  { id: 'acc-period', course: 'accounting', week: '1', en: 'Accounting Period', zh: '会计分期假设', def: '将企业持续经营划分为相等的时间段（月/季/年）编制报表。' },
  { id: 'acc-hist', course: 'accounting', week: '1', en: 'Historical Cost', zh: '历史成本原则', def: '资产按取得时的实际交易价格入账。' },
  { id: 'acc-double', course: 'accounting', week: '2', en: 'Double-Entry Accounting', zh: '复式记账法', def: '每笔交易至少影响两个账户，且借方总额恒等于贷方总额（A = L + OE）。' },
  { id: 'acc-dr-cr', course: 'accounting', week: '2', en: 'Debit / Credit (Dr / Cr)', zh: '借方 / 贷方', def: '资产/费用/提款借增贷减（DEAD）；负债/所有者权益/收入贷增借减（CLIC）。' },
  { id: 'acc-journal', course: 'accounting', week: '3', en: 'General Journal', zh: '普通日记账', def: '按时间顺序首次记录交易分录的原始账簿（含日期、科目、金额、摘要 Narration）。' },
  { id: 'acc-disc-all', course: 'accounting', week: '3', en: 'Discount Allowed', zh: '销货现金折扣（费用）', def: '客户提前付款给予的折扣，计入费用（Dr Discount Allowed）；必须先扣除退货再乘折扣率。' },
  { id: 'acc-disc-rec', course: 'accounting', week: '3', en: 'Discount Received', zh: '购货现金折扣（收入）', def: '我方提前付供应商款获得的折扣，计入其他收入（Cr Discount Received）。' },
  { id: 'acc-sales-ret', course: 'accounting', week: '3', en: 'Sales Returns & Allowances', zh: '销货退回与折让', def: '收入的备抵账户（Contra-revenue，借方余额），在计算结算折扣前先从应收余额中扣减。' },
  { id: 'acc-prepaid', course: 'accounting', week: '4', en: 'Prepaid Expense', zh: '预付费用（资产）', def: '先付款、后受益，期末将已耗用部分调为费用（Dr Expense / Cr Prepaid）。' },
  { id: 'acc-unearned', course: 'accounting', week: '4', en: 'Unearned Revenue', zh: '预收收入（负债）', def: '先收款、后履约，期末将已赚取部分调为收入（Dr Unearned / Cr Revenue）。' },
  { id: 'acc-accrued-exp', course: 'accounting', week: '4', en: 'Accrued Expense', zh: '应计费用（负债）', def: '费用已发生但尚未支付（如期末欠发工资）：Dr Expense / Cr Accrued Expense。' },
  { id: 'acc-accrued-rev', course: 'accounting', week: '4', en: 'Accrued Revenue', zh: '应计收入（资产）', def: '收入已赚取但尚未收款：Dr Accrued Revenue / Cr Revenue。' },
  { id: 'acc-depr', course: 'accounting', week: '4', en: 'Depreciation & Accumulated Depreciation', zh: '折旧与累计折旧', def: '固定资产成本按使用年限分摊；Accumulated Depreciation 是资产备抵账户（贷方余额）。' },
  { id: 'acc-tacc', course: 'accounting', week: '5', en: 'T-Account & Balance c/d, b/d', zh: 'T 型账户与结转余额', def: 'Balance c/d（期末结平填在较小一侧），Balance b/d（下期期初填在正常余额一侧）。' },
  { id: 'acc-tb', course: 'accounting', week: '6', en: 'Trial Balance', zh: '试算平衡表', def: '汇总全部总账余额检验借贷是否相等；无法发现漏记、重记、记错科目或金额同错。' },
  { id: 'acc-is', course: 'accounting', week: '8', en: 'Income Statement', zh: '利润表', def: '反映某一会计期间的收入、销货成本（COGS）、毛利与净利润（Net Profit）。' },
  { id: 'acc-bs', course: 'accounting', week: '9', en: 'Classified Balance Sheet', zh: '分类资产负债表', def: '反映某一时点的流动/非流动资产、流动/非流动负债及所有者权益。' },
  { id: 'acc-ratios', course: 'accounting', week: '10', en: 'Liquidity & Profitability Ratios', zh: '流动性与盈利能力比率', def: 'Current Ratio = CA/CL；Quick Ratio = (CA - Inventory - Prepaid)/CL；Gross Profit Margin = GP/Net Sales。' },
  { id: 'acc-cf', course: 'accounting', week: '11', en: 'Statement of Cash Flows', zh: '现金流量表', def: '分经营（Operating）、投资（Investing）、筹资（Financing）三类反映现金净变动。' },

  // Economics
  { id: 'eco-scarcity', course: 'economics', week: '1', en: 'Scarcity & Opportunity Cost', zh: '稀缺性与机会成本', def: '有限资源面对无限欲望（unlimited human wants）导致选择；机会成本是放弃的次优选择（next-best alternative）。' },
  { id: 'eco-ppc', course: 'economics', week: '2', en: 'Production Possibility Curve (PPC)', zh: '生产可能性曲线', def: '反映资源充分利用下的最大产出组合；因资源并非同等适用导致递增机会成本，曲线向外凸（bowed-out）。' },
  { id: 'eco-ppc-shift', course: 'economics', week: '2', en: 'PPC Movement vs Shift', zh: '沿曲线移动 vs 曲线整体移动', def: 'Movement 是现有资源在两产品间重分配；Shift 是资源数量/质量或技术进步带来生产能力扩张。' },
  { id: 'eco-demand', course: 'economics', week: '3', en: 'Law of Demand & Ceteris Paribus', zh: '需求定律与其他条件不变', def: '其他条件不变时，价格与需求量负相关；自身价格变动引起沿曲线移动，非价格因素引起整条曲线平移。' },
  { id: 'eco-equil', course: 'economics', week: '3', en: 'Market Equilibrium, Surplus & Shortage', zh: '市场均衡、过剩与短缺', def: 'Qd = Qs 处均衡；P > Pe 出现过剩（surplus）压低价格，P < Pe 出现短缺（shortage）推高价格。' },
  { id: 'eco-ext', course: 'economics', week: '4', en: 'Negative & Positive Externalities', zh: '负外部性与正外部性', def: '市场价格未反映第三方成本/收益导致市场失灵（MSC ≠ MPC 或 MSB ≠ MPB），产生无谓损失（DWL）。' },
  { id: 'eco-pubgood', course: 'economics', week: '4', en: 'Public Goods (Non-rival & Non-excludable)', zh: '公共物品（非竞争性与非排他性）', def: '因搭便车问题（free-rider problem）私人市场供给不足，需政府提供。' },
  { id: 'eco-ped', course: 'economics', week: '5', en: 'Price Elasticity of Demand (PED)', zh: '需求价格弹性', def: 'PED = %ΔQd / %ΔP；|PED|>1 富有弹性（降价增收），|PED|<1 缺乏弹性（提价增收）。' },
  { id: 'eco-yed-xed', course: 'economics', week: '5', en: 'YED & XED', zh: '收入弹性与交叉弹性', def: 'YED>0 正常品、<0 低档品；XED>0 替代品（substitutes）、<0 互补品（complements）。' },
  { id: 'eco-dim-ret', course: 'economics', week: '6', en: 'Law of Diminishing Marginal Returns', zh: '边际报酬递减规律', def: '短期内至少一种要素固定，持续增加可变要素终将使边际产出（MP）下降、边际成本（MC）上升。' },
  { id: 'eco-eos', course: 'economics', week: '8', en: 'Economies of Scale', zh: '规模经济', def: '长期内扩大生产规模导致长期平均成本（LRAC）下降。' },
  { id: 'eco-pc', course: 'economics', week: '9', en: 'Perfect Competition', zh: '完全竞争市场', def: '大量买卖方、同质产品、自由进出、价格接受者（P = MR = AR），长期经济利润为零。' },
  { id: 'eco-monopoly', course: 'economics', week: '10', en: 'Monopoly', zh: '垄断市场', def: '单一卖家、高进入壁垒、价格制定者（MR < P），利润最大化条件 MC = MR。' },
  { id: 'eco-gdp', course: 'economics', week: '1', en: 'Real GDP vs Nominal GDP', zh: '实际 GDP 与名义 GDP', def: '实际 GDP 剔除价格变动（按基期价格），用于衡量真实产出增长。' },
  { id: 'eco-cpi', course: 'economics', week: '2', en: 'Inflation (Demand-Pull & Cost-Push)', zh: '需求拉动型与成本推动型通胀', def: '总需求过热引发 Demand-Pull；生产要素成本上升（AD-AS 中 AS 左移）引发 Cost-Push。' },
  { id: 'eco-unemp', course: 'economics', week: '3', en: 'Cyclical, Structural & Frictional Unemployment', zh: '周期性、结构性与摩擦性失业', def: '衰退引发周期性失业；技能/产业错配引发结构性失业；换工作过渡期为摩擦性失业。' },
  { id: 'eco-adas', course: 'economics', week: '4', en: 'Aggregate Demand & Aggregate Supply (AD-AS)', zh: '总需求与总供给模型', def: 'AD = C + I + G + (X - M)；分析产出、价格水平与宏观政策冲击的核心工具。' },
  { id: 'eco-monetary', course: 'economics', week: '9', en: 'Monetary Policy (Cash Rate)', zh: '货币政策（基准利率）', def: '央行（如 RBA）调节现金利率影响借贷、消费、投资与汇率，从而调控通胀与增长。' },
  { id: 'eco-fiscal', course: 'economics', week: '10', en: 'Fiscal Policy (Budget Balance)', zh: '财政政策（政府预算）', def: '政府通过调整支出 G 与税收 T 调节总需求；含自动稳定器与相机抉择政策。' },

  // Mathematics
  { id: 'math-surd', course: 'mathematics', week: '1', en: 'Surds & Rationalising the Denominator', zh: '根式与分母有理化', def: '用共轭根式 (a∓√b) 消去分母中的无理根号。' },
  { id: 'math-domain', course: 'mathematics', week: '2', en: 'Domain & Range', zh: '定义域与值域', def: '分母不为 0、偶次根号下 ≥ 0、对数真数严格 > 0；注意区分 >（空心点）与 ≥（实心点）。' },
  { id: 'math-asymptote', course: 'mathematics', week: '3', en: 'Vertical & Horizontal Asymptotes', zh: '铅直与水平渐近线', def: '画双曲线/指数/对数图像时必须先标出渐近线方程与截距坐标。' },
  { id: 'math-inv', course: 'mathematics', week: '4', en: 'Inverse Function f⁻¹(x)', zh: '反函数', def: '需原函数为一对一（水平线检验）；图像关于 y = x 对称，原值域变为反函数定义域。' },
  { id: 'math-log', course: 'mathematics', week: '4', en: 'Logarithm Laws & Illegal Roots', zh: '对数运算法则与增根检验', def: '解完对数方程必须代回原式检验真数 > 0，排除非法根（常见 E03 扣分点）。' },
  { id: 'math-deriv', course: 'mathematics', week: '7', en: 'First Derivative & Gradient of Tangent', zh: '一阶导数与切线斜率', def: 'f′(x) 给出曲线在某点的瞬时变化率；法线斜率为 -1/f′(x)。' },
  { id: 'math-stat', course: 'mathematics', week: '9', en: 'Stationary Points & Second Derivative Test', zh: '驻点与二阶导数判别法', def: '令 f′(x)=0 求驻点；f″(x)>0 为极小值，f″(x)<0 为极大值，应用题还需检查端点最值。' },
  { id: 'math-int', course: 'mathematics', week: '10', en: 'Definite Integral & Signed Area', zh: '定积分与有符号面积', def: '求曲线与 x 轴围成面积时，x 轴下方部分积分为负，必须按零点分段取绝对值相加。' },
  { id: 'math-ap-gp', course: 'mathematics', week: '1', en: 'Arithmetic & Geometric Progressions (AP / GP)', zh: '等差数列与等比数列', def: 'AP: Tn = a+(n-1)d；GP: Tn = a·r^(n-1)，无穷等比级数仅在 |r|<1 时收敛 S∞ = a/(1-r)。' },
  { id: 'math-annuity', course: 'mathematics', week: '3', en: 'Present Value & Future Value of Annuity', zh: '年金现值与终值', def: '每期等额现金流按复利折现/终值求和，注意利率与计息期数单位必须一致（月/季/年）。' },
  { id: 'math-perm-comb', course: 'mathematics', week: '4', en: 'Permutations (nPr) vs Combinations (nCr)', zh: '排列与组合', def: '讲究顺序用排列 nPr，不讲究顺序用组合 nCr；常见补集法 1 - P(不满足)。' },
  { id: 'math-cond-prob', course: 'mathematics', week: '6', en: 'Conditional Probability & Independence', zh: '条件概率与独立事件', def: 'P(A|B) = P(A∩B)/P(B)；独立充要条件 P(A∩B) = P(A)·P(B)，注意区分互斥（mutually exclusive）。' },
  { id: 'math-binom', course: 'mathematics', week: '11', en: 'Binomial Distribution X ~ B(n, p)', zh: '二项分布', def: 'n 次独立伯努利试验，E(X)=np，Var(X)=np(1-p)，SD=√(np(1-p))。' },
  { id: 'math-normal', course: 'mathematics', week: '13', en: 'Normal Distribution & Z-Score', zh: '正态分布与标准分 Z', def: 'Z = (X - μ)/σ；查标准正态表注意阴影方向与对称性，反求分位数注意是否需要保守取整。' },

  // Computing
  { id: 'comp-sdlc', course: 'computing', week: '5', en: 'System Development Life Cycle (SDLC)', zh: '系统开发生命周期', def: 'Planning → Analysis → Design → Implementation → Maintenance 五大阶段。' },
  { id: 'comp-abs-ref', course: 'computing', week: '10', en: 'Relative, Absolute ($A$1) & Mixed References', zh: '相对、绝对与混合单元格引用', def: '拖拉公式时，$ 锁定行或列（按 F4 切换），是 Excel 期末闭卷必考核心。' },
  { id: 'comp-if', course: 'computing', week: '11', en: 'IF, Nested IF, AND, OR Functions', zh: '条件判断与嵌套逻辑函数', def: '=IF(条件, 真值, 假值)；多条件同时满足用 AND(...)，任一满足用 OR(...)，文本条件需加双引号。' },
  { id: 'comp-xlookup', course: 'computing', week: '12', en: 'XLOOKUP Function', zh: 'XLOOKUP 查找函数', def: '=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode])；注意查找区域通常需绝对引用。' },
  { id: 'comp-word-style', course: 'computing', week: '4', en: 'Word Styles (Normal / Heading 1 / 2) & Section Breaks', zh: 'Word 样式集与分节符', def: '通过修改 Style 统一全篇格式，用 Section Break 控制不同节的页眉页脚与页面方向（取消 Link to Previous）。' },
  { id: 'comp-cond-stat', course: 'computing', week: '3', en: 'COUNTIF / SUMIF / AVERAGEIF(S)', zh: '条件计数、求和与均值函数', def: '带 S 的多条件函数（如 SUMIFS）第一个参数是求和区域，与单条件 SUMIF 参数顺序不同！' },
  { id: 'comp-fin-fn', course: 'computing', week: '4', en: 'Financial Functions (PMT / FV / PV)', zh: 'Excel 财务函数', def: '=PMT(rate, nper, pv) 注意将年利率除以 12、年数乘以 12，现金流出默认返回负数。' },

  // Academic English
  { id: 'eng-hedging', course: 'english', week: '4', en: 'Hedging Language', zh: '学术模糊限制语', def: '用 may / might / tend to / appear to / arguably 避免绝对化断言，提升学术严谨性。' },
  { id: 'eng-cohesion', course: 'english', week: '6', en: 'Cohesion & Linking Devices', zh: '语篇衔接手段', def: '利用代词指代、同义复现与逻辑连接词（Consequently / Conversely / Furthermore）增强段落连贯。' },
  { id: 'eng-reporting', course: 'english', week: '9', en: 'Reporting Verbs', zh: '学术转述动词', def: '区分中立（state, observe）、赞同（demonstrate, confirm）与谨慎/质疑（claim, contend）。' },
  { id: 'eng-nominal', course: 'english', week: '11', en: 'Nominalisation', zh: '名词化表达', def: '将动词/形容词转为名词短语（如 decide → the decision to...），使学术写作更客观精炼。' },
  { id: 'eng-paraphrase', course: 'english', week: '5', en: 'Paraphrasing & Transformation', zh: '同义改写与信息转述', def: '先理解整句逻辑，再同时变换句式结构与核心词性，不能只逐词换近义词（A1 Rubric 占 20%）。' },
  { id: 'eng-inference', course: 'english', week: '2', en: 'Evidence-Based Inference', zh: '基于原文证据的推断题', def: '只选原文逻辑必然支持的选项，警惕偷换程度词（原文 may/could 选项改成 must/always）与相关性当因果。' }
];

/* ---------- 1. 补齐计算机与学术英语薄弱周次的实用指南 ---------- */
function buildComputingTutorialHtml(termId, w) {
  const title = w.title || `Week ${w.num}`;
  if (termId === 'term1') {
    const map = {
      1: ['检查 PPT 幻灯片版式对比度、字号层级（标题 ≥28pt，正文 ≥18pt）与每页要点不超过 5 条。', '核对母版（Slide Master）统一页脚与配色，避免逐页手动改字体。'],
      2: ['Word 基础样式：将正文统一应用 Normal 样式，章节标题应用 Heading 1 / Heading 2。', '核对页边距、行距（1.15–1.5）与段落间距（Before/After），禁用连续空行排版。'],
      3: ['复习硬件（CPU/RAM/ROM/外存）、软件（系统软件 vs 应用软件）与网络协议（HTTP/HTTPS/DNS/IP）辨析。', '自测：随机存取内存 RAM 断电丢失，ROM 仅读不丢失。'],
      4: ['Word 分节实操：插入 Section Break (Next Page) → 进入第二节页眉点击取消 Link to Previous → 设置独立页码或横向页面。', '网站评估 CRAAP 五维度：Currency, Relevance, Authority, Accuracy, Purpose。'],
      5: ['掌握 SDLC 五阶段（Planning → Analysis → Design → Implementation → Maintenance）与每阶段核心产出物。', '区分 Parallel / Direct / Phased / Pilot 四种系统切换方式的风险与成本。'],
      6: ['Excel 基础概念：区分 Workbook（工作簿）、Worksheet（工作表）、Cell Address（如 B4）与 Formula（必须以 = 开头）。', '核对运算符优先级：括号 () → 幂 ^ → 乘除 */ → 加减 +-。'],
      7: ['Challenge Week 阶段复盘：重做 W1–W6 A1 测验错题，确保 PPT/Word/SDLC/Excel 概念零盲区。', '演练 Word 样式集修改 + 封面 WordArt + 导航窗格核对标题层级。'],
      8: ['Excel 入门实操：熟练使用 SUM / AVERAGE / MIN / MAX / COUNT；设置货币/百分比格式与打印区域（Fit Sheet on One Page）。', '排序与筛选前确认选中包含表头的完整数据区，避免单列错位。'],
      9: ['Excel 图表实操：类别对比用柱状图（Column/Bar），时间趋势用折线图（Line），占比构成用饼图（Pie）。', '必查图表四要素：Chart Title、Axis Titles、Legend、Data Labels，确保无遮挡。'],
      10: ['单元格引用必考题：固定税率/汇率单元格必须加 $（如 =$B2*$E$1）；混合引用 $A2 锁列不锁行，A$2 锁行不锁列。', '检查填充柄拖拉后公式引用是否漂移（按 Ctrl+` 显示全部公式逐行核查）。'],
      11: ['IF 条件函数模板：=IF(C2>=50,"Pass","Fail")；注意文本必须用英文双引号，数值不加引号。', '嵌套 IF 按边界从高到低或从低到高单向写，核对边界值（>= 与 >）是否落在正确区间。'],
      12: ['XLOOKUP 标准写法：=XLOOKUP(A2,$F$2:$F$20,$G$2:$G$20,"Not Found")。', '必查三点：① 查找区域与返回区域行数一致；② 向下拖拉前给查找/返回区域加绝对引用 $；③ 区间分级查找（如税率/成绩档）设 match_mode = -1。'],
      13: ['期末 65 分钟闭卷模拟策略：前 30 分钟速刷 30 道 Excel MCQ（重点 IF / XLOOKUP / $ 引用 / 图表报错），后 35 分钟按清单逐条完成 Word 排版回传。', '交卷前 3 分钟检查：样式名未改乱、分节页码正确、文件命名符合考试要求。']
    };
    const steps = map[w.num] || ['对照本周课件逐项完成实操任务，并用公式显示模式（Ctrl+`）核对每个函数。'];
    return `<div class="tut-guide"><h4>💻 本周实操核对与参考要点（${title}）</h4><ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol><p class="kp-src">提示：可前往「五科通关手册 → 计算机」查看 Excel 函数速查卡与 Word 闭卷排版核对表。</p></div>`;
  }
  const map2 = {
    1: ['嵌套逻辑：=IF(AND(B2>=50,C2>=50),"Pass","Fail")；OR 只需满足任一条件即返回 TRUE。', '常见坑：误写成 AND(B2,C2>=50)——每个条件都必须写完整比较式。'],
    2: ['多表分组操作：按住 Shift/Ctrl 选中多张工作表同步改格式，改完务必右键 Ungroup Sheets 防止误改全部表！', '跨表 XLOOKUP 引用格式：=XLOOKUP(A2,Products!$A$2:$A$50,Products!$C$2:$C$50)。'],
    3: ['日期函数：TODAY()、YEAR()、MONTH()、DATEDIF()；条件统计：COUNTIF(范围,条件)、SUMIF(条件范围,条件,求和范围)、SUMIFS(求和范围,条件范围1,条件1,...)。', '必背区别：SUMIF 求和区在最后，SUMIFS 求和区在最前！'],
    4: ['财务函数：=PMT(年利率/12, 年数*12, -贷款额)；文本函数：LEFT / RIGHT / MID / LEN / TRIM / CONCAT / TEXTJOIN。', '验证技巧：PMT 算出月供后乘以总期数应略大于本金。'],
    5: ['高级图表：组合图（Combo Chart）给不同量级数据加次坐标轴（Secondary Axis），如销售额（柱状）+ 增长率（折线）。', '添加趋势线（Trendline）并核对图例、单位与数据源范围。'],
    6: ['Advanced Excel 考前自测：闭卷计时完成一套综合表（含 XLOOKUP + 嵌套 IF/AND + SUMIFS + PMT + 组合图），检查无 #N/A、#REF!、#VALUE!、#NAME? 报错。'],
    7: ['期中自主复习清单：重刷 T2 W1–W6 五大函数家族（逻辑/查找/条件统计/财务文本/高级图表），把易写错的参数顺序记入个人错题本。'],
    8: ['Media Presentation 策划阶段（Planning Document）：明确目标受众、核心信息、故事板分镜、素材版权来源清单与分工时间表。'],
    9: ['Media Presentation 制作阶段：严格对照 Planning Document 落地视觉风格、字体规范、音画同步与转场克制（避免花哨分散注意力）。'],
    10: ['制作打磨核对：逐页检查文字可读性、数据来源标注、时长控制与导出格式兼容性（在不同设备试播确认无缺字体/无声）。'],
    11: ['提交前终检与演练：对照 Rubric 逐项自评，提前演练口头陈述与问答环节，留足提前量提交防网络超时。'],
    12: ['考前综合冲刺：回看全部 Excel 报错排查表（#DIV/0!、#N/A、#VALUE!、#NAME?、#REF!）与绝对引用陷阱题。'],
    13: ['综合模拟考演练：严格计时完成全套 Advanced Excel 项目与样卷，对照公式检查表逐格验算。']
  };
  const steps = map2[w.num] || ['完成本周练习并用公式检查清单逐项验算。'];
  return `<div class="tut-guide"><h4>💻 本周实操核对与参考要点（${title}）</h4><ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol></div>`;
}

function buildComputingStubExpansion(w) {
  const details = {
    7: '<h4>本周目标：Advanced Excel 中期查漏补缺</h4><p>集中复盘 Term 2 前六周全部高频考点：<strong>嵌套 IF/AND/OR</strong>、<strong>跨表 XLOOKUP</strong>、<strong>SUMIFS/COUNTIFS 参数顺序</strong>、<strong>PMT/文本函数</strong> 与 <strong>次坐标轴组合图</strong>。</p><ul><li><strong>自检步骤 1</strong>：不看笔记手写上述 5 类函数语法模板，核对括号与引号。</li><li><strong>自检步骤 2</strong>：整理个人常见报错（<code>#N/A</code> 查找失败、<code>#VALUE!</code> 类型错、<code>#NAME?</code> 拼写错或文本漏引号）。</li><li><strong>自检步骤 3</strong>：进入「备考刷题 → 计算机」完成 20 道函数实战题，错题自动收入错题本。</li></ul>',
    10: '<h4>本周目标：媒体演示制作推进与质量自检</h4><p>按 Planning Document 进入实质制作阶段，确保视觉信息层级清晰、数据准确、来源规范。</p><ul><li><strong>信息设计</strong>：每页只讲一个核心观点，用图表代替大段文字；对比度清晰。</li><li><strong>版权与溯源</strong>：所有引用数据、图片、音视频保留合规来源标注。</li><li><strong>技术自检</strong>：提前测试导出文件在目标播放环境下的音频、字体与分辨率。</li></ul>',
    11: '<h4>本周目标：演示提交终检与考前热身</h4><p>完成作品终稿核对、排练讲解节奏，并开始切换回闭卷考试高频考点复习。</p><ul><li><strong>Rubric 逐项勾选</strong>：核对结构完整性、受众匹配度、时长控制与文件命名要求。</li><li><strong>考前热身</strong>：每天用 15 分钟复盘 1 个 Excel 函数模块，保持手感。</li></ul>',
    12: '<h4>本周目标：考前综合准备（Excel + 理论双线冲刺）</h4><p>聚焦闭卷考试最容易失分的细节：<strong>绝对引用 $</strong>、<strong>SUMIF vs SUMIFS 参数顺序</strong>、<strong>XLOOKUP 精确/近似匹配模式</strong> 与 <strong>常见错误代码诊断</strong>。</p><ul><li><strong>时间分配演练</strong>：模拟真实考场节奏，遇到复杂嵌套公式先拆成辅助列思路再合并。</li><li><strong>错题清零</strong>：打开「错题本」筛出计算机待复习错题，逐题口述公式逻辑。</li></ul>'
  };
  return details[w.num] || '';
}

function buildEnglishTutorialHtml(w) {
  const title = w.title || `Week ${w.num}`;
  return `<div class="tut-guide"><h4>📝 本周练习思路与高分表达参考（${title}）</h4>
<ul>
  <li><strong>Reading 阅读定位法</strong>：先看题干找定位词（专有名词/数字/核心概念）→ 扫读找<strong>同义替换</strong> → 精读定位句前后各一句再作答；推断题严禁脑补，警惕把原文 <em>may/could</em> 偷换成 <em>must/always</em>。</li>
  <li><strong>Listening 整句逻辑法</strong>：重点捕捉转折（<em>however / whereas</em>）、因果（<em>consequently / stems from</em>）与举例信号词，笔记记「主语 + 动作/方向 + 因果箭线」而非逐字听写。</li>
  <li><strong>Speaking / Writing 学术升级</strong>：先用自己的话概括核心观点（Processing Text &amp; Transformation），再替换为学术表达（模糊限制语 <em>tend to / arguably</em> + 转述动词 <em>contend / demonstrate</em> + 名词化）。</li>
</ul>
<p class="kp-src">联动训练：点击顶部「<a href="english/index.html">英语学习工作台</a>」进行本周精读查词、生词复习与每日 45 分钟专项打卡。</p></div>`;
}

/* ---------- 2. 挂载站内真实 PDF（public/sources/*） ---------- */
function collectRealSources() {
  const accDir = path.join(PUB, 'sources/accounting-2026');
  const accPdfs = fs.existsSync(accDir) ? fs.readdirSync(accDir).filter(f => f.endsWith('.pdf')).sort() : [];
  const accByWeek = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const f of accPdfs) {
    const rel = 'sources/accounting-2026/' + f;
    if (/^unit[12]\b/i.test(f)) accByWeek[1].push({ name: f, path: rel });
    else if (/^unit3\b/i.test(f)) accByWeek[2].push({ name: f, path: rel });
    else if (/^unit4\b/i.test(f)) accByWeek[3].push({ name: f, path: rel });
    else if (/^unit5\b/i.test(f)) accByWeek[4].push({ name: f, path: rel });
    else if (/^unit5b\b|^unit6\b/i.test(f)) accByWeek[5].push({ name: f, path: rel });
  }
  const econExams = [
    { name: 'Term 2 Exam Sample A (官方样卷).pdf', path: 'sources/economics-2026/term2/exams/term2 EXAM sample A.pdf' },
    { name: 'Term 2 Exam Sample B (官方样卷).pdf', path: 'sources/economics-2026/term2/exams/term2 EXAM sample B.pdf' }
  ].filter(x => fs.existsSync(path.join(PUB, x.path)));

  const compRef = [
    { name: 'Computing 官方参考讲义.pdf', path: 'sources/computing-reference/7af486effbc6756b.pdf' }
  ].filter(x => fs.existsSync(path.join(PUB, x.path)));

  return { accByWeek, econExams, compRef };
}

/* ---------- 3. 从笔记中自动补充提取双语术语 ---------- */
function extractExtraGlossary(courses) {
  const seen = new Set(CURATED_GLOSSARY.map(g => g.en.toLowerCase()));
  const out = CURATED_GLOSSARY.slice();
  const re = /<strong>([A-Za-z][A-Za-z0-9\s\-/()&']{2,48})[（(]([\u4e00-\u9fff][^）)]{1,24})[）)]<\/strong>/g;
  for (const c of courses) {
    if (!['accounting', 'economics', 'mathematics', 'computing', 'english'].includes(c.id)) continue;
    let added = 0;
    for (const t of (c.terms || [])) {
      for (const w of (t.weeks || [])) {
        const html = (w.graphicHtml || '') + '\n' + (w.notesHtml || '');
        for (const m of html.matchAll(re)) {
          const en = m[1].trim();
          const zh = m[2].trim();
          const key = en.toLowerCase();
          if (seen.has(key) || en.length < 3 || zh.length < 2) continue;
          seen.add(key);
          out.push({
            id: `${c.id}-auto-${out.length + 1}`,
            course: c.id,
            week: String(w.num),
            en,
            zh,
            def: `${c.cn || c.name || c.id} · Week ${w.num} 核心术语`
          });
          added++;
          if (added >= 40) break;
        }
        if (added >= 40) break;
      }
      if (added >= 40) break;
    }
  }
  return out;
}

function main() {
  console.log('=== Phase 2 Data Build Starting ===');
  const winData = loadWindowScript(path.join(PUB, 'data.js'));
  const D = winData.PORTAL_DATA;
  const winReading = loadWindowScript(path.join(PUB, 'reading-data.js'));
  const RD = winReading.READING_DATA || { courses: {} };

  // Step 1: Merge 64 rewritten weeks from manifest (if available on machine)
  let mergedCount = 0;
  const mfPath = path.join(MANIFEST_BASE, 'out/manifest.json');
  if (fs.existsSync(mfPath)) {
    const manifest = JSON.parse(fs.readFileSync(mfPath, 'utf8'));
    for (const it of manifest) {
      const c = D.courses.find(x => x.id === it.course);
      let t = c && c.terms.find(x => x.id === it.term);
      let w = t && t.weeks.find(x => String(x.num) === String(it.week));
      if (!w && it.course === 'economics' && it.term === 'term1') {
        const tx = c.terms.find(x => x.id === 'term1x');
        if (tx) w = tx.weeks.find(x => String(x.num) === String(it.week));
      }
      if (!w) continue;

      const fields = it.fields || {};
      if (fields.graphicHtml) {
        const gPath = path.join(MANIFEST_BASE, fields.graphicHtml);
        if (fs.existsSync(gPath)) {
          w.graphicHtml = fs.readFileSync(gPath, 'utf8').trim();
          w.rewritten = true;
        }
      }
      if (fields.tutorialAnswers) {
        const aPath = path.join(MANIFEST_BASE, fields.tutorialAnswers);
        if (fs.existsSync(aPath)) {
          const newAns = fs.readFileSync(aPath, 'utf8').trim();
          // Preserve existing math errata / official PDF links if already present in tutorialAnswers
          const oldAns = typeof w.tutorialAnswers === 'string' ? w.tutorialAnswers : '';
          if (oldAns && /sources\/math-reference\//.test(oldAns) && !/sources\/math-reference\//.test(newAns)) {
            w.tutorialAnswers = newAns + '\n<hr class="tut-sep">\n' + oldAns;
          } else {
            w.tutorialAnswers = newAns;
          }
        }
      }
      mergedCount++;
    }
    console.log(`[1] Merged rewritten notes: ${mergedCount}/64 weeks`);
  } else {
    console.log('[1] Manifest not found locally, skipping 64-week merge');
  }

  // Step 2: Enrich Computing, Academic English, Extracurricular
  let compEnriched = 0, engEnriched = 0, extraEnriched = 0;
  const realSources = collectRealSources();

  for (const c of D.courses) {
    if (c.id === 'accounting') {
      const t1 = (c.terms || []).find(t => t.id === 'term1');
      if (t1) {
        for (const w of t1.weeks) {
          if (realSources.accByWeek[w.num] && realSources.accByWeek[w.num].length) {
            w.onlineSources = realSources.accByWeek[w.num];
          }
        }
      }
    }
    if (c.id === 'economics') {
      const t2 = (c.terms || []).find(t => t.id === 'term2');
      if (t2) {
        const w13 = t2.weeks.find(w => w.num === 13);
        if (w13 && realSources.econExams.length) w13.onlineSources = realSources.econExams;
      }
    }
    if (c.id === 'computing') {
      for (const t of (c.terms || [])) {
        for (const w of (t.weeks || [])) {
          if (t.id === 'term2' && [7, 10, 11, 12].includes(Number(w.num))) {
            const plain = (w.graphicHtml || '').replace(/<[^>]+>/g, '').trim();
            if (plain.length < 400) {
              w.graphicHtml = (w.graphicHtml || '') + '\n' + buildComputingStubExpansion(w);
            }
          }
          if (!w.tutorialAnswers || (typeof w.tutorialAnswers === 'string' && w.tutorialAnswers.length < 30)) {
            w.tutorialAnswers = buildComputingTutorialHtml(t.id, w);
            compEnriched++;
          }
          if (t.id === 'term1' && Number(w.num) === 1 && realSources.compRef.length) {
            w.onlineSources = realSources.compRef;
          }
        }
      }
    }
    if (c.id === 'english') {
      for (const t of (c.terms || [])) {
        for (const w of (t.weeks || [])) {
          if (!w.tutorialAnswers || (typeof w.tutorialAnswers === 'string' && w.tutorialAnswers.length < 30)) {
            w.tutorialAnswers = buildEnglishTutorialHtml(w);
            engEnriched++;
          }
        }
      }
    }
    if (c.id === 'extracurricular') {
      for (const t of (c.terms || [])) {
        for (const w of (t.weeks || [])) {
          if ((!w.graphicHtml || w.graphicHtml.length < 50) && w.notesHtml && w.notesHtml.length > 50) {
            w.graphicHtml = w.notesHtml;
            extraEnriched++;
          }
          if (!w.tasks || !w.tasks.length) {
            w.tasks = [
              { id: `extra-w${w.num}-t1`, text: `精读本模块核心概念与案例分析（${w.title || 'Module ' + w.num}）`, minutes: 20 },
              { id: `extra-w${w.num}-t2`, text: '记录 1 条可迁移到商业/财务决策中的关键启发', minutes: 10 }
            ];
          }
        }
      }
    }
  }
  console.log(`[2] Enriched: Computing ${compEnriched}w, English ${engEnriched}w, Extracurricular ${extraEnriched}w`);

  // Step 3: Extract structured bilingual glossary & attach to weeks
  const glossary = extractExtraGlossary(D.courses);
  for (const c of D.courses) {
    if (!['accounting', 'economics', 'mathematics', 'computing', 'english'].includes(c.id)) continue;
    const cTerms = glossary.filter(g => g.course === c.id);
    for (const t of (c.terms || [])) {
      for (const w of (t.weeks || [])) {
        const wTerms = cTerms.filter(g => String(g.week) === String(w.num));
        if (wTerms.length) {
          w.glossary = wTerms.map(g => ({ term: g.en, zh: g.zh, def: g.def }));
        }
      }
    }
  }
  console.log(`[3] Built structured bilingual glossary: ${glossary.length} terms across 5 subjects`);

  // Step 4: Separate 60+ stub wishlist books vs real courses & real books
  const coreCourses = [];
  const realBooks = [];
  const wishlistBooks = [];
  for (const c of D.courses) {
    if (CORE_COURSE_IDS.has(c.id)) {
      coreCourses.push(c);
    } else if (c.id.startsWith('to-read-') && c.id !== 'to-read-bc900c3f45a1') {
      wishlistBooks.push({
        id: c.id,
        name: c.name || c.cn || c.title || c.id,
        en: c.en || c.subtitle || '',
        category: c.category || '想读书单',
        note: (c.terms && c.terms[0] && c.terms[0].weeks && c.terms[0].weeks[0] && (c.terms[0].weeks[0].title || '')) || '待收录'
      });
    } else {
      realBooks.push(c);
    }
  }
  console.log(`[4] Partitioned: ${coreCourses.length} core courses, ${realBooks.length} full books, ${wishlistBooks.length} wishlist stubs`);

  // Step 5: Write split lazy-loaded chunks under public/data-chunks/
  fs.mkdirSync(path.join(CHUNKS_DIR, 'courses'), { recursive: true });
  fs.mkdirSync(path.join(CHUNKS_DIR, 'books'), { recursive: true });

  const indexPayload = {
    version: '20261122-v2',
    generatedAt: new Date().toISOString(),
    courses: coreCourses.map(c => ({
      id: c.id,
      name: c.name || c.cn || c.title,
      cn: c.cn || c.name || c.title,
      en: c.en || c.nameEn || '',
      color: c.color || '#1c4375',
      extra: !!c.extra,
      terms: (c.terms || []).map(t => ({
        id: t.id,
        name: t.name || t.label || t.id,
        weeks: (t.weeks || []).map(w => ({
          num: w.num,
          title: w.title || `Week ${w.num}`,
          taskCount: (w.tasks || []).length,
          fileCount: (w.files || []).length,
          onlineSourceCount: (w.onlineSources || []).length,
          hasNotes: !!((w.graphicHtml && w.graphicHtml.length > 30) || (w.notesHtml && w.notesHtml.length > 30)),
          hasAnswers: !!(w.tutorialAnswers && String(w.tutorialAnswers).length > 20),
          glossaryCount: (w.glossary || []).length
        }))
      }))
    })),
    books: realBooks.map(b => ({
      id: b.id,
      name: b.name || b.cn || b.title,
      cn: b.cn || b.name || b.title,
      en: b.en || b.nameEn || '',
      chapters: (b.terms || []).reduce((acc, t) => acc + (t.weeks || []).length, 0),
      hasReader: !!(RD.courses && RD.courses[b.id])
    })),
    wishlistCount: wishlistBooks.length,
    glossaryCount: glossary.length
  };

  fs.writeFileSync(path.join(CHUNKS_DIR, 'index.json'), JSON.stringify(indexPayload), 'utf8');
  fs.writeFileSync(path.join(CHUNKS_DIR, 'wishlist-books.json'), JSON.stringify(wishlistBooks), 'utf8');
  fs.writeFileSync(path.join(CHUNKS_DIR, 'glossary.json'), JSON.stringify(glossary), 'utf8');

  for (const c of coreCourses) {
    fs.writeFileSync(path.join(CHUNKS_DIR, 'courses', c.id + '.json'), JSON.stringify(c), 'utf8');
  }
  for (const b of realBooks) {
    const bookChunk = Object.assign({}, b, { reader: (RD.courses && RD.courses[b.id]) || null });
    fs.writeFileSync(path.join(CHUNKS_DIR, 'books', b.id + '.json'), JSON.stringify(bookChunk), 'utf8');
  }

  // Step 6: Update public/data.js cleanly (preserve real courses & books, drop bloated empty stub placeholders into wishlist)
  // Keep courses array clean while maintaining full backward compatibility with all existing checks
  D.courses = coreCourses.concat(realBooks);
  D.wishlistBooks = wishlistBooks;
  D.glossaryCount = glossary.length;
  const outJs = 'window.PORTAL_DATA = ' + JSON.stringify(D) + ';';
  fs.writeFileSync(path.join(PUB, 'data.js'), outJs, 'utf8');

  const idxKb = (fs.statSync(path.join(CHUNKS_DIR, 'index.json')).size / 1024).toFixed(1);
  const dataMb = (fs.statSync(path.join(PUB, 'data.js')).size / 1024 / 1024).toFixed(2);
  console.log(`[5] Wrote data-chunks/index.json (${idxKb} KB) + per-course/book chunks; updated data.js (${dataMb} MB)`);
  console.log('=== Phase 2 Data Build Complete ===');
}

main();
