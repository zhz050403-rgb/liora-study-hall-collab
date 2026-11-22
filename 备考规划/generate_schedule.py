# -*- coding: utf-8 -*-
"""
Liora 备考排期生成器（艾宾浩斯间隔重复）
只读读取 data.js 的周次清单，全部产出写入「备考规划」文件夹，不改动任何原有文件。

如需改考试日期 / 每日时长：改下面 CONFIG 后重跑本脚本即可。
"""
import csv, json, os
from datetime import date, timedelta

OUT = os.path.dirname(os.path.abspath(__file__))
TODAY = date(2026, 10, 30)      # 排期基准日（今天）
EXAM = date(2027, 1, 25)        # 期末考试日 ⚠️ 由本人 2026-10-30 确认
D1 = TODAY + timedelta(days=1)  # 正式开始：2026-10-31
TOTAL_DAYS = (EXAM - TODAY).days  # 87

WD = ["一", "二", "三", "四", "五", "六", "日"]  # Monday=0
def d_of(day_n):            # day_n: 1..87  ->  date
    return D1 + timedelta(days=day_n - 1)
def dow(day_n):
    return WD[d_of(day_n).weekday()]

# ---------------- 单元清单（全部来自网站 data.js 真实周次） ----------------
# (course, term, week, title, tier, mode)
U = []
def add(c, t, w, title, tier, mode):
    U.append(dict(course=c, term=t, week=w, title=title, tier=tier, mode=mode))

COURSE_CN = {
    "accounting": "会计", "economics": "经济", "mathematics": "数学",
    "computing": "计算机", "english": "学术英语",
}
TERM_CN = {"term1": "T1", "term2": "T2", "term1x": "T1补充(2025)"}
MODE_CN = {
    "drill": "实操型 · 动手做分录/编表",
    "graph": "图文型 · 画图 + 口头解释",
    "calc": "刷题型 · 限时做题",
    "excel": "上机型 · Excel 实操",
    "output": "输出型 · 说/写（技能科）",
}

# 会计 T1（13 周）：记账链条 + 三大报表 + 分析 = 必考核心
for w, ti, tier in [(1, "Unit 1-2 会计导论与会计惯例", "A"), (2, "Unit 3 复式记账与交易分析", "A"),
                    (3, "Unit 4 日记账分录", "A"), (4, "Unit 5 调整分录", "A"),
                    (5, "Unit 6 分类账 T 型账户", "A"), (6, "Unit 7 多栏式账户与试算平衡表", "A"),
                    (8, "Unit 8 利润表与 Excel 入门", "A"), (9, "Unit 9 资产负债表", "A"),
                    (10, "Unit 10 财务报表分析", "A"), (11, "Unit 10 现金流量表", "A"),
                    (12, "Week 12 总复习与考试结构", "B")]:
    add("accounting", "term1", w, ti, tier, "drill")

# 经济 T2 宏观（13 周）
for w, ti, tier in [(1, "Unit 0 循环流量模型 + Unit 1 经济增长与 GDP", "A"),
                    (2, "Unit 2 通货膨胀", "A"), (3, "Unit 3 失业", "A"),
                    (4, "Unit 4 总需求与总供给 AD-AS", "A"),
                    (5, "Unit 5 国际贸易与保护", "B"), (6, "Unit 6 汇率", "B"),
                    (8, "Unit 7 金融部门", "B"), (9, "Unit 8 货币政策", "A"),
                    (10, "Unit 9 政府预算与财政政策", "A"),
                    (11, "Unit 10 经济统计解读", "A"),
                    (12, "Unit 11 运用经济政策影响经济", "A"),
                    (13, "Week 13 考试复习", "B")]:
    add("economics", "term2", w, ti, tier, "graph")

# 经济 T1（4 周）
for w, ti, tier in [(1, "Unit 0 导航 + Unit 1 经济学导论", "B"),
                    (2, "Unit 2 生产与技术", "B"),
                    (3, "Unit 3 需求与供给", "A"),
                    (4, "Unit 4 市场成功与失灵", "A")]:
    add("economics", "term1", w, ti, tier, "graph")

# 数学 T1（13 周）⚠️ 其中 3 周网站缺完整笔记，需回看课件原文
for w, ti, tier in [(1, "基础代数、根式与方程", "B"), (2, "坐标几何与函数", "B"),
                    (3, "抛物线、双曲线与绝对值图像", "B"),
                    (4, "反函数、对数与指数", "A"), (5, "对数图像、定义域与分段函数", "B"),
                    (6, "函数与图像应用", "B"), (7, "微积分入门与求导", "A"),
                    (8, "切线、法线与导数符号", "A"), (9, "曲线作图、最优化与不定积分", "A"),
                    (10, "定积分与面积", "A"), (11, "指数对数函数微积分", "A"),
                    (12, "对数积分与考试复习", "B"), (13, "考前综合复习", "B")]:
    add("mathematics", "term1", w, ti, tier, "calc")
add("mathematics", "term2", 1, "Term 2 练习与复习", "B", "calc")

# 计算机 T1（13 周）
for w, ti, tier in [(1, "课程概览：PowerPoint 演示设计", "B"), (2, "Word 概述 / PPT 小组项目启动", "B"),
                    (3, "计算机与互联网", "B"), (4, "网站评价与 Word 分节排版", "B"),
                    (5, "系统开发生命周期 SDLC", "B"), (6, "Excel 概述与核心概念", "A"),
                    (8, "Excel 入门：创建编辑格式化排序", "A"), (9, "Excel 图表", "A"),
                    (10, "Excel 填充、常用函数与单元格引用", "A"), (11, "Excel IF 条件函数", "A"),
                    (12, "Excel XLOOKUP 查找函数", "A"), (13, "期末考信息与 Word/Excel 复习", "B")]:
    add("computing", "term1", w, ti, tier, "excel")
# 计算机 T2（13 周）
for w, ti, tier in [(1, "高级 Excel：嵌套 IF/AND、IF/OR", "A"),
                    (2, "多工作表分组与 XLOOKUP 复习", "A"),
                    (3, "DATE 日期函数与条件统计函数", "A"), (4, "财务函数与文本函数", "A"),
                    (5, "高级图表制作", "A"), (6, "Advanced Excel 考试信息与综合复习", "B"),
                    (8, "Media Presentation 策划：Planning Document", "B"),
                    (9, "Media Presentation 策划与制作", "B"),
                    (11, "演示提交与考前复习", "B"), (12, "考前综合准备", "B"),
                    (13, "Advanced Excel 综合项目与练习考试", "A")]:
    add("computing", "term2", w, ti, tier, "excel")

# 学术英语（14 周）技能科：复习动作 = 输出练习
for w, ti, tier in [(1, "Speaking：海外留学", "B"), (2, "Listening：因果表达", "B"),
                    (3, "Speaking：小组合作", "B"), (4, "Listening & Writing：模糊限制语", "A"),
                    (5, "Speaking：自然灾害 · 信息图总结", "B"),
                    (6, "Listening & Writing：衔接手段", "A"),
                    (8, "Speaking & Listening：AI 与教育", "B"),
                    (9, "Writing：转述动词", "A"), (10, "Speaking：气候变化成因", "B"),
                    (11, "Writing：名词化", "A"), (12, "Writing & Speaking：词性与词形", "A"),
                    (13, "Listening & Writing：澳洲动物", "B"),
                    (14, "Reading · SDG 11 核心文本逐句翻译", "A")]:
    add("english", "term1", w, ti, tier, "output")

# 2025 补充资料（默认 Tier C：考前扫描 1 次，⚠️ 需先确认是否适用于 2026 考试）
C_UNITS = [(5, "Unit 5 弹性"), (6, "Unit 6 厂商短期生产与成本"), (8, "Unit 7 厂商长期规模与成本"),
           (9, "Unit 8 完全竞争"), (10, "Unit 9 垄断"), (11, "Unit 10 垄断竞争与寡头"),
           (12, "Unit 11 复习与样题")]

# ---------------- 间隔与时长规则 ----------------
# A 档：R1 激活 → +1 / +3 / +7 / +15 天（艾宾浩斯 + 现代间隔重复的常用节奏）
# ⚠️ 2026-11-03 修正（两处）：
#  ① 时长：原 R1 28 / R2 12 / R3 12 / R4 16 / R5 18 / R6 20 与网站「怎么做」步骤
#     严重不匹配（R1 步骤实际要 30~40 分钟），全表缺口 53%（标注 118 小时 vs 实际需 180 小时）。
#     现每轮标注时长下调到「按步骤真能做完」的量（标准同步见 CRIT）。
#  ② 轮数：原 6 轮（含 +30 天）。第 6 轮与阶段 3 的考前扫描轮（S）内容高度重叠，
#     且 87 天容量装不下（实测延迟复习 208 次，间隔被打乱反而更伤）。
#     现砍掉 +30 天那一轮，改由 S 轮在考前兜底 → A 档 5 轮。
A_STEPS = [(1, "R2", 10), (3, "R3", 12), (7, "R4", 14), (15, "R5", 16)]
A_R1_MIN = 20
# B 档：R1 激活 → +7 天（2 次接触）。
# ⚠️ 2026-11-03 修正：原为 3 轮（+7 / +21），B 档是次要内容，第 3 轮性价比最低，砍掉。
B_STEPS = [(7, "R2", 10)]
B_R1_MIN = 16

PHASES = [(1, 3, "阶段0 摸底诊断"), (4, 48, "阶段1 激活+首轮循环"),
          (49, 68, "阶段2 间隔循环+专项"), (69, 86, "阶段3 总复习+模考冲刺"),
          (87, 87, "考试日")]
def phase_of(d):
    for a, b, n in PHASES:
        if a <= d <= b:
            return n
    return "—"

# ---------------- 每日预算 ----------------
# ⚠️ 2026-11-03 修正（原值：工作日 110/120 分钟、周末 130 分钟、每日 ≤8 块）：
#    实测 66/87 天超出 4 块，最重一天 8 块跨 4~5 门课 → 几乎必然完不成。
#    现在改为「工作日 75 分钟 / 周末 100 分钟、每日 ≤4 块（周末 ≤6 块）」，
#    与 5 门正课 + 作业的日常占用相容。
#    阶段3 放宽，因为要容纳 8 套 90 分钟模考。
CAP = {}     # day -> 分钟上限
BLK = {}     # day -> 块数上限
for d in range(1, TOTAL_DAYS + 1):
    is_weekend = d_of(d).weekday() >= 5
    if d <= 3:        CAP[d], BLK[d] = 75, 2
    elif d <= 48:     CAP[d], BLK[d] = (100 if is_weekend else 75), (6 if is_weekend else 5)
    elif d <= 68:     CAP[d], BLK[d] = (90 if is_weekend else 70), (5 if is_weekend else 5)
    elif d <= 86:     CAP[d], BLK[d] = (110 if is_weekend else 100), (6 if is_weekend else 5)
    else:             CAP[d], BLK[d] = 30, 1

# ---------------- 模考（8 套，固定日期，90 分钟） ----------------
MOCK_DATES = ["2026-12-19", "2026-12-26", "2027-01-02", "2027-01-07",
              "2027-01-10", "2027-01-14", "2027-01-17", "2027-01-21"]
def day_of_date(ds):
    y, m, dd = map(int, ds.split("-"))
    return (date(y, m, dd) - D1).days + 1

mock_rows = []
mock_no = 1
MOCK_SRC = {
    "2026-12-19": "会计 · 网站 Week 13 Sample Exam Paper（含 MCQ 答题纸）",
    "2026-12-26": "经济 · 网站 Economics T2 Week 13 考试复习 + 2025 往年卷",
    "2027-01-02": "数学 · 网站 Mathematics T2 练习与复习 + T1 W12-13 复习",
    "2027-01-07": "计算机 · 网站 Computing T2 W13 Advanced Excel 练习考试",
    "2027-01-10": "会计 · 第二次完整模考（换成网站 W12 考试结构说明里的题型配比）",
    "2027-01-14": "经济 · 宏观综合模考（AD-AS + 政策 + 统计解读）",
    "2027-01-17": "计算机 + 数学 合卷模考（上机 + 笔试各 45 分钟）",
    "2027-01-21": "学术英语 · 写作 + 口语模考（用网站 W4/W6/W9/W11 的输出模板）",
}
for ds in MOCK_DATES:
    d = day_of_date(ds)
    mock_rows.append(dict(day=d, minutes=90, src=MOCK_SRC[ds], no=mock_no))
    mock_no += 1
MOCK_BY_DAY = {r["day"]: r for r in mock_rows}

# 已用分钟
used = {d: 0 for d in range(1, TOTAL_DAYS + 1)}
blocks = {d: 0 for d in range(1, TOTAL_DAYS + 1)}
for r in mock_rows:
    used[r["day"]] += r["minutes"]
    blocks[r["day"]] += 1

# ---------------- 安排 R1（首次激活） ----------------
# 顺序：A 档按科目轮转（会计→经济→英语→计算机→数学），再 B 档同序轮转
SUBJ_ORDER = ["accounting", "economics", "english", "computing", "mathematics"]
def round_robin(tier):
    pools = {s: [u for u in U if u["tier"] == tier and u["course"] == s] for s in SUBJ_ORDER}
    # 经济内部：T2 先于 T1
    for s in pools:
        pools[s].sort(key=lambda u: (0 if u["term"] == "term2" else 1, u["week"]))
    out, i = [], 0
    while any(pools.values()):
        s = SUBJ_ORDER[i % len(SUBJ_ORDER)]
        if pools[s]:
            out.append(pools[s].pop(0))
        i += 1
    return out

# 用户当前真实进度（2026-11-03 与用户核对）：
# 数学学到 W4（反函数对数指数）、计算机到 T1 W12、会计到 T1 W3、
# 经济宏观到 T2 W2、学术英语到 T1 W3。
# 这些周次已经学过 → 优先安排它们的复习（学完就该复习）；
# 尚未学到的（数学 W5+ / 计算机 T2+）往后放，与新课进度对齐。
# ⚠️ 注意：各科的「考前复习周」（W12 / W13 / Week 13）是最后才学的，
#    不能因为周次数字大就当成「已学」——它们必须排在最后。
LEARNED = {
    "数学": {1, 2, 3, 4},
    "会计": {1, 2, 3, 4},
    "经济": {1, 2, 3, 4},
    "计算机": {1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12},   # T1 已到 W12（T2 尚未开始）
    "学术英语": {1, 2, 3, 4},
}
# 各科最后一两周 = 考前复习周，天然排在最后
REVIEW_WEEK = {
    "数学": {12, 13}, "会计": {12, 13}, "经济": {12, 13},
    "计算机": {13}, "学术英语": {13},
}
def is_learned(u):
    """该单元是否已在用户实际进度内（用于排序，不改变档位）。
    考前复习周永远返回 False —— 它们本来就是最后才学、最后才复习。"""
    cn = COURSE_CN[u["course"]]
    if u["week"] in REVIEW_WEEK.get(cn, set()):
        return False
    return u["week"] in LEARNED.get(cn, set())

# 预计「学到某周」的日期（用户进度外的新课按每周 1 周推进推算）：
# 2026-11-03 时数学学到 W4 → W5 约 11-10、每 +1 周 +1 个周次。
# 用于保证：还没学到的单元，不会被排到「学它之前」去复习（那就又做不了）。
def earliest_day_for(u):
    """该单元最早可以开始复习的那一天（学完当天 +1）。
    ⚠️ 用「已学的最大周次」当基准会算错：计算机 LEARNED 里含 W13（考前周），
       会让 delta 变成 0 → 未学内容被误判成「随时可复习」。这里改用
    「排除考前复习周后的最大已学周次」。"""
    cn = COURSE_CN[u["course"]]
    if is_learned(u):
        return 4
    pool = LEARNED.get(cn, {1}) - REVIEW_WEEK.get(cn, set())
    cur = max(pool) if pool else 1
    # 计算机分 T1 / T2 两学期：T2 的 W1 起算点 = T1 全部学完之后
    if cn == "计算机" and u["term"] == "term2":
        cur = 12
    delta = max(0, u["week"] - cur)
    # 每 4 天推进 1 周（预科课程节奏：一周 1~2 次课 + 密集练习，实测比整周快）
    return 4 + delta * 4

def interleave(a_list, b_list):
    """A 档与 B 档交错合并。
    ⚠️ 2026-11-03 修正：原来先排完所有 A 档再排 B 档，导致 B 档 28 个单元
    整批没排上（其中包括数学 T1 W1-W3 —— 用户当前正在学的内容，绝不能漏）。
    现在按 2:1 交错，让两个档位都能进入排期。
    另外：用户实际已学到的周次优先排在前面（学完就该复习）；
    未学到的（数学 W5+ / 计算机 T2+）往后放，与新课进度对齐——
    组内按周次升序（W5 先于 W12），避免考前复习周被提前激活。"""
    def key(u):
        return (0 if is_learned(u) else 1, u["week"])
    a_list = sorted(a_list, key=key)
    b_list = sorted(b_list, key=key)
    out, ia, ib = [], 0, 0
    while ia < len(a_list) or ib < len(b_list):
        for _ in range(2):
            if ia < len(a_list):
                out.append(a_list[ia]); ia += 1
        if ib < len(b_list):
            out.append(b_list[ib]); ib += 1
    return out

activation = interleave(round_robin("A"), round_robin("B"))
R1_START, R1_END = 4, 48

rows = []   # 所有复习块
def push(day, unit, rep, gap, minutes, crit):
    # 容量检查：超出则顺延到最近的有空位的一天
    d = day
    while d <= TOTAL_DAYS:
        if used[d] + minutes <= CAP[d] and blocks[d] < BLK[d]:
            used[d] += minutes
            blocks[d] += 1
            rows.append(dict(day=d, unit=unit, rep=rep, gap=gap, minutes=minutes, crit=crit))
            return d
        d += 1
    return None

CRIT = {
    # ⚠️ 完成标准必须与该块的标注时长自洽（2026-11-03 修正）：
    #    原来 R2 要求「5 个术语」、R1 要求「3 个定义 + 公式 + 建卡」，但只有 12~28 分钟，
    #    按网站步骤实际需要 25~40 分钟 → 每块都注定完不成，整体缺口 53%。
    #    现在把标准压回「标注时长内真能做到」的量，完成率才有意义。
    "R1": "合上笔记，能默写出本单元 2 个核心英文定义 + 1 个公式/流程；术语卡已建好",
    "R2": "不看笔记，说出本单元 2 个术语的英文原文 + 中文含义",
    "R3": "独立完成 1 道本单元题目，步骤写全（不只写答案）",
    "R4": "1 道混合题正确率 ≥ 80%，并列出本单元 2 个易错点",
    "R5": "错题重做全对 + 能口头讲一遍解题/分析过程",
    "R6": "限时完成 1 道综合题（达到考试时限要求）",
    "S":  "10 分钟内扫完，能说出本单元 2 个必考点",
}
# R1 按科目细化「达成动作」（同样压到标注时长内可完成）
CRIT_R1 = {
    "accounting": "合上笔记，能默写出本单元 2 个核心英文定义 + 1 条典型分录；术语卡已建好",
    "economics":  "合上笔记，能默写出本单元 2 个核心英文定义，并画出 1 张核心图的草稿；术语卡已建好",
    "mathematics": "合上笔记，能默写出本单元 2 个核心定义 + 1 个公式，并写出 1 道例题的关键步骤；术语卡已建好",
    "computing":  "合上笔记，能默写出本单元 2 个核心英文定义 + 1 个函数/功能的完整用法；术语卡已建好",
    "english":    "合上笔记，能默写出本单元 2 个核心英文定义，并造 1 个含目标语言点的句子；术语卡已建好",
}

# 优先级：core = 每天必做（考纲核心 + 早期轮次）；extra = 有余力再做
# 目的：把「每天要做几件」压到真正能完成的量，避免任务清单永远清不掉。
def priority_of(kind, tier, rep):
    if kind in ("mock", "diag"):
        return "core"
    if tier == "X":           # 降级档：实际间隔过大 → 归为「选做」，不占必做名额
        return "extra"
    if tier == "A":
        return "core" if rep in ("R1", "R2", "R3", "R4") else "extra"
    if tier == "B":
        return "core" if rep in ("R1", "R2") else "extra"
    return "extra"

# ===== 逐日模拟：到期复习优先，新激活让位（这才是间隔重复的正确排法）=====
# ⚠️ 2026-11-03 修正：原来第 4-30 天每天预留 60 分钟给「新激活」，
#    而工作日总预算只有 75 分钟 → 到期复习只剩 15 分钟，一天塞不下 2 个 R2，
#    导致 R2 集体排队、实测延迟 208 次（间隔被打乱，复习效果反而更差）。
#    现在把新激活额度压到「每天最多 1 个单元」的量（20~30 分钟），
#    其余额度全部留给到期复习——这才是间隔重复该有的优先级。
NEW_BUDGET = {}   # 每天「新激活 R1」的独占分钟数（复习不得占用）
for d in range(1, TOTAL_DAYS + 1):
    if d <= 3:      NEW_BUDGET[d] = 0
    elif d <= 52:   NEW_BUDGET[d] = 44    # 激活期：每天最多 2 个单元（A 档 20 分 / B 档 16 分）
    elif d <= 66:   NEW_BUDGET[d] = 34    # 收尾激活：每天 1~2 个 B 档
    else:           NEW_BUDGET[d] = 0
B_GATE = 12   # B 档单元从第 12 天起才开始激活

pending = []      # [due_day, seq, unit, rep, gap, minutes, crit]
overflow = []     # 逾期 >6 天、判定为「装不下」的块：优先填入后续机动日
seq = [0]
act_queue = list(activation)
spill = [0]
r1_day = {}       # id(unit) -> R1 所在天（保证轮次严格递进，不会出现 R2 早于 R1）

def place(day, unit, rep, gap, minutes, crit):
    used[day] += minutes
    blocks[day] += 1
    rows.append(dict(day=day, unit=unit, rep=rep, gap=gap, minutes=minutes, crit=crit))

def find_slot(minutes, earliest, latest, skip_first3=False):
    """在 [earliest, latest] 区间里找一个还有余量的日子（负荷均衡）。
    ⚠️ 2026-11-03 新增：原来所有块都硬排在「到期日当天」，
    结果 d22/d23/d29/d30 挤到 84~86 分钟 6 块，而 d31+ 又只有 58 分钟，
    负荷分布严重不均（用户实际感受就是「有的天做不完、有的天没事干」）。
    现在允许在合理窗口内挪到更空的一天。
    skip_first3=True 时跳过 d1-d3（阶段 0 摸底日，已被 2 张自测卷占满）。
    返回 None 表示窗口内都排不下。"""
    best, best_load = None, None
    for d in range(max(1, earliest), min(TOTAL_DAYS, latest) + 1):
        if skip_first3 and d <= 3:
            continue
        if used[d] + minutes <= CAP[d] and blocks[d] < BLK[d]:
            load = used[d] / CAP[d] if CAP[d] else 1
            if best_load is None or load < best_load:
                best, best_load = d, load
                if load < 0.55:      # 已经足够空，直接用
                    return d
    return best

for d in range(1, TOTAL_DAYS + 1):
    # 0) 先算出今天要给「新激活」预留多少额度（有单元可激活才预留）
    reserve = 0
    if NEW_BUDGET[d] > 0 and act_queue:
        head = act_queue[0]
        if not (head["tier"] == "B" and d < B_GATE):
            reserve = NEW_BUDGET[d]
    review_cap = max(0, CAP[d] - reserve)
    # 1) 先塞「逾期装不下」的溢出块：它们本来就是到期复习，优先级最高，
    #    但只有在当天还有余量时才放，避免挤掉当天真正到期的复习。
    if overflow:
        still = []
        for ov in overflow:
            _, _, u, rep, gap, minutes, crit = ov
            if used[d] + minutes <= CAP[d] and blocks[d] < BLK[d]:
                place(d, u, rep, gap, minutes, crit)
            else:
                still.append(ov)
        overflow = still
    # 2) 到期复习（含逾期）优先：A 档 > 逾期越久越优先
    due = [p for p in pending if p[0] <= d]
    pending = [p for p in pending if p[0] > d]
    due.sort(key=lambda p: (p[0], p[4], p[1]))  # 到期日 → 间隔越短越优先（+1 天的复习最不能拖）
    for p in due:
        _, _, u, rep, gap, minutes, crit = p
        # 到期复习优先排当天；当天排不下就在 ±5 天窗口内找最空的一天（负荷均衡）
        target = d
        if not (used[d] + minutes <= review_cap and blocks[d] < BLK[d]):
            lo = d - 5
            # 轮次必须严格递进：不得早于该单元 R1 之后
            rd = r1_day.get(id(u))
            if rd is not None and rd + 1 > lo:
                lo = rd + 1
            target = find_slot(minutes, lo, d + 5)
        if target is not None:
            place(target, u, rep, gap, minutes, crit)
            if rep == "R1":
                steps = A_STEPS if u["tier"] == "A" else B_STEPS
                for g, rp, mm in steps:
                    seq[0] += 1
                    pending.append([target + g, seq[0], u, rp, g, mm, CRIT[rp]])
        else:
            # ⚠️ 2026-11-03 修正：原来无条件顺延到明天，导致 R5（+15 天那轮）
            #    被一路推到 d70/d71（延后 59 天），间隔重复完全失效。
            #    现在区分两种顺延：
            #      · 逾期 ≤ 6 天 → 照常顺延（只是临时挤了一下，间隔仍有效）
            #      · 逾期 > 6 天 → 判定为「装不下」，改排到后面的机动日；
            #        若到阶段2 结束仍装不下 → 直接降级为 extra（有余力再做），
            #        不再占「必做」名额，也不拖累后面的轮次。
            if d - p[0] <= 6:
                pending.append([d, p[1], u, rep, gap, minutes, crit])
                spill[0] += 1
            else:
                overflow.append([p[0], p[1], u, rep, gap, minutes, crit])
    # 2) 新激活：用完今天的到期复习后，若还有额度才开新单元
    #    ⚠️ 2026-11-03 修正：原来只在 NEW_BUDGET>0 的日子才激活，
    #    导致 d6~d10 出现 5 天完全空白，而 d22 之后却挤到 86 分钟/6 块——
    #    「有空间的时段没用满、拥挤的时段硬塞」。现在改成：
    #    只要当天还有剩余容量（无论是否在激活预算期内）就补激活，
    #    但新激活不得挤占已排好的到期复习（review_cap 已经预留了空间）。
    if act_queue:
        nb = NEW_BUDGET[d]
        while act_queue and nb >= 16:
            u = act_queue[0]
            if u["tier"] == "B" and d < B_GATE:
                break
            # ⚠️ 还没学到的单元不许提前激活（否则又变成「做不了的卡」）
            if d < earliest_day_for(u):
                break
            m = A_R1_MIN if u["tier"] == "A" else B_R1_MIN
            if m > nb or used[d] + m > CAP[d] or blocks[d] >= BLK[d]:
                break
            act_queue.pop(0)
            place(d, u, "R1", 0, m, CRIT_R1.get(u["course"], CRIT["R1"]))
            r1_day[id(u)] = d
            nb -= m
            steps = A_STEPS if u["tier"] == "A" else B_STEPS
            for g, rp, mm in steps:
                seq[0] += 1
                pending.append([d + g, seq[0], u, rp, g, mm, CRIT[rp]])
        # 激活预算期外：若当天仍有余量且队列还有 A 档（核心），继续激活
        if not act_queue or (act_queue[0]["tier"] == "A" and d > 52):
            while act_queue and used[d] + A_R1_MIN <= CAP[d] and blocks[d] < BLK[d]:
                u = act_queue[0]
                if u["tier"] != "A" or d < earliest_day_for(u):
                    break
                act_queue.pop(0)
                place(d, u, "R1", 0, A_R1_MIN, CRIT_R1.get(u["course"], CRIT["R1"]))
                r1_day[id(u)] = d
                steps = A_STEPS
                for g, rp, mm in steps:
                    seq[0] += 1
                    pending.append([d + g, seq[0], u, rp, g, mm, CRIT[rp]])

# ===== 补激活：队列里剩下的单元（多为 B 档）必须全部排上 =====
# ⚠️ 2026-11-03 修正：负荷均衡后仍有 15 个单元没排上（其中含数学 T1 W1-W3
#    等用户当前正在学的内容）。这里做一次「补漏」：把剩余单元按最空的日子
#    依次塞进 87 天窗口（优先 A 档、其次 B 档），确保 100% 覆盖。
#    补漏不得占用 d1-d3（阶段 0 摸底日，已被 2 张自测卷占满 90 分钟）。

for u in list(act_queue):
    m = A_R1_MIN if u["tier"] == "A" else B_R1_MIN
    # 优先找激活期内的空位（d4~d58），找不到再放宽到全程
    lo = max(4, earliest_day_for(u))
    slot = find_slot(m, lo, 58, skip_first3=True)
    if slot is None:
        slot = find_slot(m, lo, TOTAL_DAYS, skip_first3=True)
    if slot is None:
        # 最后兜底：允许超容量塞进最早还有空间的一天（仍不得早于进度约束）
        for dd in range(lo, TOTAL_DAYS + 1):
            if used[dd] + m <= CAP[dd] and blocks[dd] < BLK[dd]:
                slot = dd
                break
    if slot is None:
        continue
    act_queue.remove(u)
    place(slot, u, "R1", 0, m, CRIT_R1.get(u["course"], CRIT["R1"]))
    r1_day[id(u)] = slot
    steps = A_STEPS if u["tier"] == "A" else B_STEPS
    for g, rp, mm in steps:
        seq[0] += 1
        pending.append([slot + g, seq[0], u, rp, g, mm, CRIT[rp]])

# ===== 补漏排期：轮次已生成但没排上的，依次填进后续空位 =====
# ⚠️ 2026-11-03 修正：补漏窗口原本从 d0-3 开始，会把 R2 排到比 R1 更早的那天
#    （实测「计算机 T2 W13」的 R2 落在 d6，而 R1 在 d8 —— 顺序颠倒、逻辑不通）。
#    现在窗口起点 = max(到期日, 该单元 R1 日 + 1)，保证轮次严格递进。
#    若在「到期日 + 12 天」窗口内排不下 → 再放宽到全程；
#    仍排不下 → 降级为 extra（有余力再做），不再无限延后占用必做名额。
r1_day = {}
for r in rows:
    if r["rep"] == "R1":
        r1_day[id(r["unit"])] = r["day"]
degraded = []       # 实际间隔 >10 天的轮次 → 降级为 extra（有余力再做）
rest = []
for p in pending:
    d0 = p[0]
    lo = d0
    rd = r1_day.get(id(p[2]))
    if rd is not None and rd + 1 > lo:
        lo = rd + 1
    slot = find_slot(p[5], lo, min(TOTAL_DAYS, d0 + 12), skip_first3=True)
    if slot is None:
        slot = find_slot(p[5], max(4, lo), TOTAL_DAYS, skip_first3=True)
    if slot is not None:
        place(slot, p[2], p[3], p[4], p[5], p[6])
        if slot - d0 > 10:
            degraded.append((slot, p))
    else:
        rest.append(p)

# ===== 排不下的轮次：降级为「选做」=====
# ⚠️ 2026-11-03 新增（关键设计）：间隔重复里「晚 60 天才复习」等于没复习。
#    所以排不下时不能无限顺延——正确做法是把它降级成 extra（有余力再做），
#    让它不再占用「必做」名额，同时如实标注实际间隔。
for slot, p in degraded:
    p = list(p)
    p[2] = dict(p[2])
    p[2]["tier"] = "X"      # X = 降级档（网站显示为「选做」）
    place(slot, p[2], p[3], p[4], p[5], p[6])

# Tier C：2025 补充资料，阶段 3 扫描 1 次
c_day = 69
for w, ti in C_UNITS:
    u = dict(course="economics", term="term1x", week=w, title=ti, tier="C", mode="graph")
    while c_day <= 84:
        if used[c_day] + 20 <= CAP[c_day] and blocks[c_day] < BLK[c_day]:
            place(c_day, u, "S", 0, 20,
                  "⚠️ 先确认该 2025 资料是否适用 2026 考试；适用则说出 2 个考点")
            c_day += 1
            break
        c_day += 1

# 阶段 3：A 档考前扫描轮（S）
for u in [x for x in U if x["tier"] == "A"]:
    sd = 69
    while sd <= 85:
        if used[sd] + 12 <= CAP[sd] and blocks[sd] < BLK[sd]:
            place(sd, u, "S", 0, 12, CRIT["S"])
            break
        sd += 1

# 摸底诊断（阶段 0）——每项必须写明：做哪套题、题量多少、在哪做、怎么算完成
# 结构：(第几天, 标题, 分钟, 完成标准, 课程, 网站链接, 具体步骤列表)
DIAG = [
    (1, "会计摸底卷 · Unit 1-4（T1 W1-W4）：做 W3 复式记账 4 题 + W4 日记账 3 题", 45,
     "对照「课后作业答案」自批：每题标对错，错题知识点写进「学习档案」",
     "会计", "#/c/accounting/term1/4",
     ["打开网站「会计 → Term 1 → W3」和「W4」页面，找到课后作业题（Tutorial Questions）",
      "限时 30 分钟：做 W3 复式记账 4 题 + W4 日记账 3 题，分录必须写全借方/贷方和金额",
      "打开同页的「课后作业答案」标签逐题对照自批，错题用红笔标出",
      "把每道错题的知识点（如：借贷方向、应计费用）填进备考中心「✍️ 作业批改」区记入档案"]),
    (1, "经济摸底 · 宏观 4 模型默画（T2 W1-W4）：循环流量 / 通胀 / 失业 / AD-AS", 45,
     "4 张图每张都能画全并口头解释 1 分钟；卡壳的模型记进「学习档案」",
     "经济", "#/c/economics/term2/4",
     ["拿一张白纸，限时 30 分钟默画 4 张图：① 循环流量模型（T2 W1）② 通货膨胀机制（T2 W2）③ 失业类型与原因（T2 W3）④ AD-AS 均衡（T2 W4）",
      "每张图画完立刻口头解释 1 分钟：坐标轴是什么、每条曲线为什么移动、均衡点怎么变",
      "画不出/讲不清的模型，去对应周的图文笔记重看一遍，并把模型名记进档案"]),
    (2, "计算机上机摸底 · Excel 三大函数：IF / XLOOKUP / 条件统计（6 个任务）", 45,
     "6 个任务全部做出正确结果；做不出的函数记进「学习档案」",
     "计算机", "#/c/computing/term2/1",
     ["新建空白工作簿，先造 5 行假数据（姓名/班级/分数/电话），限时 30 分钟完成 6 个任务",
      "任务清单：① IF 判定等级（≥80 优 / ≥60 中 / 其他 差）② IF+AND 重写一次 ③ XLOOKUP 按姓名查电话 ④ 跨工作表 XLOOKUP 查价格 ⑤ SUMIF 求某班总分 ⑥ COUNTIF 数及格人数",
      "逐个核对结果（用眼睛+手工数验证）；哪个任务卡住的，去对应周笔记重看（IF=T1 W11、XLOOKUP=T1 W12、条件统计=T2 W3）并记入档案"]),
    (2, "数学摸底卷 · 已学范围检测（T1 W1-W4）：代数/根式 + 坐标几何 + 图像 + 对数指数各 2 题", 45,
     "8 题里至少 6 题全对（步骤完整）；错题知识点录入「学习档案」",
     "数学", "#/c/mathematics/term1/4",
     ["⚠️ 只考你已经学过的部分：打开网站「数学 → Term 1」的 W1、W2、W3、W4 笔记（W1 基础代数根式方程 / W2 坐标几何与函数 / W3 抛物线双曲线绝对值 / W4 反函数对数与指数）",
      "每份笔记里各抽 2 道例题（先不看答案），共 8 题；哪一周还没学到就跳过哪一周，已学的部分照做",
      "限时 35 分钟完成，步骤必须写全（不能只写答案）",
      "对照笔记里的例题解答自批，错在哪一步用一句话写下来，知识点录入档案",
      "📌 求导（W7）和定积分（W10）你还没学到，本卷不考——它们会在 11-07 / 11-15 学到时单独安排"]),
    (3, "学术英语写作摸底 · 150 词段落：必须用转述动词 + 模糊限制语 + 衔接手段", 45,
     "写出 150 词段落并提交 AI 批改；错误类型录入「学习档案」",
     "学术英语", "#/c/english/term1/9",
     ["题目：Should universities ban AI tools in assignments?（立场任选）",
      "限时 30 分钟写一段约 150 词的段落，必须用上：3 个转述动词（claims / argues / suggests，W9）、2 个模糊限制语（may / tend to，W4）、3 个衔接手段（however / in addition，W6）",
      "写完粘贴到备考中心「✍️ 作业批改」区（课程选学术英语）提交 AI 批改，把指出的问题录入档案"]),
    (3, "摸底汇总 · 生成个人薄弱点清单，重排 A/B/C 档", 45,
     "产出明确清单：哪 5 个单元升 A 档、哪 5 个降 C 档，并提交 AI 复核",
     "诊断", "#/profile",
     ["翻出前 5 份摸底的结果（会计/经济/计算机/数学/英语），把每个做错或卡壳的知识点列成一张清单",
      "数一数每个单元的错点数：错 0-1 个 → 升 A 档；错 2-3 个 → 保持；错 4 个以上 → 降 C 档",
      "写出最终清单（哪 5 个单元升 A、哪 5 个降 C），粘贴到「✍️ 作业批改」区让 AI 复核，必要时重排复习优先级"]),
]

rows.sort(key=lambda r: (r["day"], 0 if r["unit"]["tier"] == "A" else 1, r["unit"]["course"]))

# ---------------- 写 CSV ----------------
csv_path = os.path.join(OUT, "艾宾浩斯复习排期.csv")
with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["日期", "星期", "第几天", "距考试(天)", "阶段", "课程", "单元", "轮次",
                "距上次(天)", "时长(分钟)", "复习方式", "完成标准（达到才算做完）", "完成"])
    for d in range(1, TOTAL_DAYS + 1):
        dt = d_of(d)
        left = (EXAM - dt).days
        ph = phase_of(d)
        if d == TOTAL_DAYS:
            w.writerow([dt.isoformat(), "周" + dow(d), d, 0, "考试日", "全 5 门", "期末考试日", "—",
                        0, 30, "轻量", "考前 30 分钟只扫术语卡，不碰新题", ""])
            continue
        dayrows = [r for r in rows if r["day"] == d]
        for d5, n, minutes, note, subj, href5, steps5 in [x for x in DIAG if x[0] == d]:
            w.writerow([dt.isoformat(), "周" + dow(d), d, left, ph, subj if subj != "诊断" else "诊断", n, "自测", 0, minutes,
                        "限时自测", note + ("（步骤见网站备考中心）" if steps5 else ""), ""])
        if d in MOCK_BY_DAY:
            mr = MOCK_BY_DAY[d]
            w.writerow([dt.isoformat(), "周" + dow(d), d, left, ph, "模考", "第 %d 套模考" % mr["no"],
                        "MOCK", 0, 90, "全真模考（限时 · 闭卷 · 不查资料）",
                        mr["src"] + " → 做完发给我批改，错题录入档案", ""])
        for r in dayrows:
            u = r["unit"]
            label = "%s %s W%d · %s" % (COURSE_CN[u["course"]], TERM_CN[u["term"]], u["week"], u["title"])
            w.writerow([dt.isoformat(), "周" + dow(d), d, left, ph, COURSE_CN[u["course"]], label,
                        r["rep"] + ("档" if r["rep"] == "R1" else ""), r["gap"], r["minutes"],
                        MODE_CN[u["mode"]], r["crit"], ""])

# ---------------- 写 JSON（供 HTML 日历用） ----------------
data = dict(today=TODAY.isoformat(), exam=EXAM.isoformat(), totalDays=TOTAL_DAYS,
            courseCn=COURSE_CN, termCn=TERM_CN, modeCn=MODE_CN, crit=CRIT)
items = []
for d in range(1, TOTAL_DAYS + 1):
    dt = d_of(d)
    day = dict(d=d, date=dt.isoformat(), dow="周" + dow(d), left=(EXAM - dt).days,
               phase=phase_of(d), items=[])
    for d5, n, minutes, note, subj, href5, steps5 in [x for x in DIAG if x[0] == d]:
        day["items"].append(dict(kind="diag", course=subj, label=n, rep="自测",
                                 pri="core",
                                 minutes=minutes, mode="限时自测", crit=note,
                                 href=href5, steps=steps5))
    if d in MOCK_BY_DAY:
        mr = MOCK_BY_DAY[d]
        day["items"].append(dict(kind="mock", course="模考", label="第 %d 套全真模考" % mr["no"],
                                 pri="core",
                                 rep="MOCK", minutes=90, mode="限时闭卷",
                                 crit=mr["src"] + " → 做完发给我批改，错题录入档案"))
    for r in [x for x in rows if x["day"] == d]:
        u = r["unit"]
        # 实际间隔（相对上一轮）——如实标注，让用户知道这一轮隔了多久
        prev = None
        for pr in sorted([x for x in rows if x["unit"] is u], key=lambda x: x["day"]):
            if pr["day"] < r["day"]:
                prev = pr["day"]
        actual_gap = (r["day"] - prev) if prev is not None else 0
        late = ""
        if r["gap"] and actual_gap > r["gap"] + 3:
            late = "（实际隔了 %d 天）" % actual_gap
        day["items"].append(dict(
            kind="rev", course=COURSE_CN[u["course"]], tier=u["tier"],
            label="%s %s W%d · %s" % (COURSE_CN[u["course"]], TERM_CN[u["term"]], u["week"], u["title"]),
            rep=r["rep"], gap=r["gap"], minutes=r["minutes"], mode=MODE_CN[u["mode"]], crit=r["crit"],
            pri=priority_of("rev", u["tier"], r["rep"]),
            late=late,
            href="#/c/%s/%s/%d" % (u["course"], u["term"], u["week"])))
    day["mins"] = sum(i["minutes"] for i in day["items"])
    items.append(day)
data["days"] = items
with open(os.path.join(OUT, "schedule.json"), "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)

print("总天数 %d 天（%s → %s）" % (TOTAL_DAYS, D1.isoformat(), EXAM.isoformat()))
print("复习块 %d 个，模考 %d 套，诊断自测 %d 项" % (len(rows), len(mock_rows), len(DIAG)))
print("未激活单元 %d 个" % len(act_queue))
# 间隔保真度检查：实际间隔 vs 目标间隔
by_unit = {}
for r in rows:
    by_unit.setdefault(id(r["unit"]), []).append(r)
worst, nlate = [], 0
for uid, rs in by_unit.items():
    rs.sort(key=lambda r: r["day"])
    if rs[0]["rep"] != "R1":
        continue
    for i in range(len(rs) - 1):
        if rs[i + 1]["rep"] in ("S",):
            continue
        target = rs[i + 1]["gap"]
        actual = rs[i + 1]["day"] - rs[i]["day"]
        if actual > target:
            nlate += 1
            worst.append((actual - target, rs[i]["unit"]["course"], rs[i]["unit"]["week"],
                          rs[i + 1]["rep"], target, actual))
worst.sort(reverse=True)
print("延迟复习 %d 次；最严重的 5 条：" % nlate)
for w_ in worst[:5]:
    print("   +%d 天 · %s W%d %s（目标 %d 天，实际 %d 天）" % (w_[0], w_[1], w_[2], w_[3], w_[4], w_[5]))
tot = sum(r["minutes"] for r in rows) + 90 * len(mock_rows) + sum(x[2] for x in DIAG)
print("总时长 %.1f 小时，日均 %.0f 分钟" % (tot / 60, tot / TOTAL_DAYS))
# ---------------- 写独立复习日历 HTML（数据内嵌，双击即可用） ----------------
TPL = r"""<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>艾宾浩斯复习日历 · Liora</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"Segoe UI","Microsoft YaHei",sans-serif;background:#f4f7fb;color:#1a2340;line-height:1.6}
.wrap{max-width:1180px;margin:0 auto;padding:22px 18px 60px}
header{background:#0d1b3e;color:#fff;border-radius:14px;padding:22px 24px;margin-bottom:16px}
header h1{font-size:21px;font-weight:800}
header h1 em{font-style:normal;color:#e5c46b}
header p{font-size:13px;color:#b9c4dd;margin-top:6px}
.kpis{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.kpi{background:rgba(255,255,255,.1);border-radius:10px;padding:10px 16px;min-width:120px}
.kpi .n{font-size:22px;font-weight:800;color:#e5c46b}
.kpi .n small{font-size:12px;color:#c9d3e8;font-weight:600}
.kpi .l{font-size:11.5px;color:#b9c4dd;margin-top:2px}
.bar{height:8px;background:#e3e9f3;border-radius:5px;overflow:hidden;margin-top:14px}
.bar i{display:block;height:100%;background:#e5c46b;width:0}
.bar-t{font-size:12px;color:#c9d3e8;margin-top:6px}
.toolbar{background:#fff;border:1px solid #e1e8f2;border-radius:12px;padding:12px 16px;margin-bottom:16px;
 display:flex;gap:12px;align-items:center;flex-wrap:wrap;position:sticky;top:0;z-index:20}
select,button{font-family:inherit;font-size:13px;padding:7px 13px;border-radius:8px;border:1.5px solid #d7dce8;
 background:#fff;color:#1a2340;cursor:pointer}
button.primary{background:#0d1b3e;color:#fff;border-color:#0d1b3e}
button.primary:hover{background:#16295e}
label.chk{font-size:13px;color:#41506e;display:flex;align-items:center;gap:6px;cursor:pointer}
.week-h{font-size:14px;font-weight:800;color:#0d1b3e;margin:20px 0 10px;padding-left:10px;border-left:4px solid #e5c46b}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}
.day{background:#fff;border:1px solid #e1e8f2;border-radius:12px;padding:13px 15px}
.day.today{border-color:#e5c46b;box-shadow:0 0 0 3px rgba(229,196,107,.25)}
.day.past{opacity:.62}
.day.rest .d-head{color:#8a92a8}
.d-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;border-bottom:1px dashed #e3e9f3;padding-bottom:8px;margin-bottom:8px}
.d-date{font-size:15px;font-weight:800;color:#0d1b3e}
.d-dow{font-size:12px;color:#5a6480}
.d-left{font-size:11.5px;color:#8a92a8;margin-left:auto}
.d-phase{font-size:11px;font-weight:700;color:#1a6fc4;background:#eaf3fc;padding:2px 8px;border-radius:9px}
.d-mins{font-size:11.5px;color:#5a6480;margin-bottom:8px}
.item{border:1px solid #eef2f8;border-radius:9px;padding:8px 10px;margin-bottom:7px;background:#fbfcfe}
.item.done{background:#f2f8f3;border-color:#d6ecda}
.item.done .i-label{text-decoration:line-through;color:#7a8a7a}
.i-top{display:flex;gap:8px;align-items:flex-start}
.i-top input{margin-top:3px;width:15px;height:15px;accent-color:#0d1b3e;flex-shrink:0}
.i-label{font-size:13px;font-weight:600;color:#1a2340;line-height:1.45}
.i-meta{font-size:11px;color:#6b7692;margin-top:3px}
.tag{display:inline-block;font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:8px;margin-right:5px}
.t-rep{background:#eaf3fc;color:#1a6fc4}
.t-A{background:#fdecec;color:#c0392b}
.t-B{background:#eef2f8;color:#5a6480}
.t-C{background:#f4f4f5;color:#8a92a8}
.t-mock{background:#0d1b3e;color:#fff}
.t-diag{background:#e5c46b;color:#4a3a10}
.i-crit{font-size:11.5px;color:#41506e;margin-top:5px;padding-top:5px;border-top:1px dashed #e3e9f3}
.i-crit b{color:#c0392b}
.note{background:#fff;border:1px solid #e1e8f2;border-left:4px solid #1a6fc4;border-radius:10px;
 padding:12px 16px;font-size:12.5px;color:#41506e;margin-bottom:16px}
.note b{color:#0d1b3e}
footer{text-align:center;font-size:12px;color:#8a92a8;margin-top:26px}
@media print{.toolbar{display:none}body{background:#fff}.day{break-inside:avoid}}
</style></head><body><div class="wrap">
<header>
<h1>艾宾浩斯复习日历 · <em>Liora</em></h1>
<p>间隔节奏：首次激活后 <b>第 1 / 3 / 7 / 15 / 30 天</b> 各复习一次（A 档）｜第 7 / 21 天（B 档）｜考前 10 天扫描轮（S）</p>
<div class="kpis">
  <div class="kpi"><div class="n" id="kLeft">—<small> 天</small></div><div class="l">距期末考试</div></div>
  <div class="kpi"><div class="n" id="kDay">—</div><div class="l">今天是第 N 天</div></div>
  <div class="kpi"><div class="n" id="kDone">—</div><div class="l">已完成复习块</div></div>
  <div class="kpi"><div class="n" id="kToday">—</div><div class="l">今天待办（分钟）</div></div>
</div>
<div class="bar"><i id="pbar"></i></div>
<div class="bar-t" id="ptxt">完成率 0%</div>
</header>

<div class="toolbar">
  <button class="primary" id="btnToday">跳到今天</button>
  <select id="fCourse"><option value="">全部课程</option></select>
  <select id="fPhase"><option value="">全部阶段</option></select>
  <label class="chk"><input type="button" id="btnToggle" value="只看未完成"> </label>
  <button id="btnExport">导出打卡</button>
  <button id="btnImport">导入打卡</button>
  <input type="file" id="fileIn" accept=".json" style="display:none">
  <span style="font-size:12px;color:#8a92a8">勾选状态只存在本机浏览器，建议每周导出一次备份</span>
</div>

<div class="note">
<b>怎么用：</b>每天打开这一页 → 看「今天」这张卡 → 从上往下做完，做完一格勾一格 →
每格的「达到标准」写明了<b>做到什么程度才算完成</b>，达不到就别勾，第二天它会继续排进来（我每周按你的完成情况重排一次）。
网站里的位置（如 <code>#/c/accounting/term1/4</code>）复制到浏览器地址栏，接在 <code>index.html</code> 后面就能直接打开那一周的笔记。
</div>

<div id="weeks"></div>
<footer>本页由 备考规划/generate_schedule.py 自动生成 · 数据只取自网站 data.js 的真实周次 · 不修改任何原有文件</footer>
</div>
<script>
const DATA = __DATA__;
const KEY = "liora-review-calendar-v1";
let done = {};
try{ done = JSON.parse(localStorage.getItem(KEY) || "{}"); }catch(e){ done = {}; }
let onlyUndone = false;

function todayStr(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(done)); }catch(e){} }
function examLeft(){
  const t=new Date(); t.setHours(0,0,0,0);
  const e=new Date(DATA.exam+"T00:00:00");
  return Math.round((e-t)/86400000);
}
function pad(n){ return String(n).padStart(2,"0"); }

function build(){
  const courses = new Set(), phases = new Set();
  DATA.days.forEach(d=>{ phases.add(d.phase);
    d.items.forEach(it=>{ if(it.course) courses.add(it.course); }); });
  const fc=document.getElementById("fCourse");
  [...courses].sort().forEach(c=>{ const o=document.createElement("option"); o.value=c; o.textContent=c; fc.appendChild(o); });
  const fp=document.getElementById("fPhase");
  [...phases].forEach(p=>{ const o=document.createElement("option"); o.value=p; o.textContent=p; fp.appendChild(o); });
}

function itemHtml(day, it, idx){
  const k = day.date + "#" + idx;
  const isDone = !!done[k];
  let tags = '<span class="tag t-rep">' + (it.rep||"") + (it.gap?(" +"+it.gap+"天"):"") + "</span>";
  if(it.tier) tags += '<span class="tag t-'+it.tier+'">'+it.tier+"档</span>";
  if(it.kind==="mock") tags += '<span class="tag t-mock">模考</span>';
  if(it.kind==="diag") tags += '<span class="tag t-diag">诊断</span>';
  tags += '<span class="tag t-B">'+it.minutes+" 分钟</span>";
  return '<div class="item'+(isDone?" done":"")+'" data-k="'+k+'">'
    + '<div class="i-top"><input type="checkbox" data-k="'+k+'"'+(isDone?" checked":"")+'>'
    + '<div><div class="i-label">'+esc(it.label)+'</div>'
    + '<div class="i-meta">'+tags+'</div>'
    + '<div class="i-meta">'+esc(it.mode||"")+(it.href?(" · 网站位置 <code>"+it.href+"</code>"):"")+'</div>'
    + '<div class="i-crit"><b>达到标准：</b>'+esc(it.crit||"")+'</div>'
    + '</div></div></div>';
}

function esc(s){ return String(s==null?"":s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }

function render(){
  const fc=document.getElementById("fCourse").value, fp=document.getElementById("fPhase").value;
  const t=todayStr();
  let html="", total=0, doneN=0, todayMins=0, todayDone=0;
  let weekNo=0;
  for(let i=0;i<DATA.days.length;i+=7){
    const chunk=DATA.days.slice(i,i+7);
    weekNo++;
    const wkHtml = chunk.map(day=>{
      let items = day.items.filter(it=> (!fc || it.course===fc));
      const beforeLen = items.length;
      items = items.filter(it=>{
        const k = day.date + "#" + day.items.indexOf(it);
        return !(onlyUndone && done[k]);
      });
      if(fp && day.phase!==fp) return "";
      if(!day.items.length && day.mins===0 && day.phase!=="考试日") return "";
      const isToday = day.date===t;
      const past = day.date < t;
      let m=0; day.items.forEach(it=>{ m+=it.minutes; });
      if(isToday){ todayMins=m; todayDone=day.items.filter(it=>done[day.date+"#"+day.items.indexOf(it)]).length; }
      return '<div class="day'+(isToday?" today":"")+(past?" past":"")+'" id="d-'+day.date+'">'
        + '<div class="d-head"><span class="d-date">'+day.date+'</span><span class="d-dow">'+day.dow+'</span>'
        + '<span class="d-phase">'+day.phase+'</span><span class="d-left">距考试 '+day.left+" 天 · 第 "+day.d+" 天</span></div>"
        + '<div class="d-mins">当天 '+m+" 分钟 · "+day.items.length+" 块</div>"
        + (day.items.length? day.items.map((it,idx)=>itemHtml(day,it,idx)).join("")
            : '<div style="font-size:12.5px;color:#8a92a8">休息 / 机动日（用来补前几天没做完的块）</div>')
        + '</div>';
    }).join("");
    if(!wkHtml.trim()) continue;
    html += '<div class="week-h">第 '+weekNo+" 周 · "+chunk[0].date+" → "+chunk[chunk.length-1].date+"</div>"
          + '<div class="grid">'+wkHtml+"</div>";
  }
  DATA.days.forEach(day=>{ day.items.forEach((it,idx)=>{ total++; if(done[day.date+"#"+idx]) doneN++; }); });
  document.getElementById("weeks").innerHTML = html || '<div class="note">当前筛选下没有内容。</div>';
  const L=examLeft();
  document.getElementById("kLeft").innerHTML = (L>=0? L : "已过")+"<small> 天</small>";
  const td = DATA.days.find(d=>d.date===t);
  document.getElementById("kDay").textContent = td ? ("第 "+td.d+" 天") : "—";
  document.getElementById("kDone").textContent = doneN+" / "+total;
  document.getElementById("kToday").textContent = td ? (todayMins+" 分钟 · 已勾 "+todayDone+"/"+td.items.length) : "—";
  const pct = total? Math.round(doneN/total*100):0;
  document.getElementById("pbar").style.width = pct+"%";
  document.getElementById("ptxt").textContent = "完成率 "+pct+"%（共 "+total+" 个复习块，已完成 "+doneN+" 个）";
  document.querySelectorAll(".item input[type=checkbox]").forEach(cb=>{
    cb.addEventListener("change",()=>{
      const k=cb.getAttribute("data-k");
      if(cb.checked) done[k]=1; else delete done[k];
      save(); render();
    });
  });
}

build(); render();
document.getElementById("btnToday").addEventListener("click",()=>{
  const el=document.getElementById("d-"+todayStr());
  if(el) el.scrollIntoView({behavior:"smooth",block:"center"});
  else alert("今天不在排期范围内（排期 "+DATA.days[0].date+" → "+DATA.days[DATA.days.length-1].date+"）");
});
document.getElementById("fCourse").addEventListener("change",render);
document.getElementById("fPhase").addEventListener("change",render);
document.getElementById("btnToggle").addEventListener("click",()=>{ onlyUndone=!onlyUndone; render(); });
document.getElementById("btnExport").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(done,null,1)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="复习打卡-"+todayStr()+".json"; a.click();
});
document.getElementById("btnImport").addEventListener("click",()=>document.getElementById("fileIn").click());
document.getElementById("fileIn").addEventListener("change",e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{ done=JSON.parse(r.result); save(); render(); alert("导入成功"); }catch(err){ alert("文件格式不对"); } };
  r.readAsText(f);
});
window.addEventListener("load",()=>{ const el=document.getElementById("d-"+todayStr()); if(el) el.scrollIntoView({block:"center"}); });
</script></body></html>"""

html_path = os.path.join(OUT, "复习日历.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write(TPL.replace("__DATA__", json.dumps(data, ensure_ascii=False)))

busy = max(items, key=lambda x: x["mins"])
print("最重的一天：%s（第%d天）%d 分钟 / %d 块" % (busy["date"], busy["d"], busy["mins"], len(busy["items"])))
print("产出：", csv_path)
