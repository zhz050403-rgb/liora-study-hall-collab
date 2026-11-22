# 给 Codex 的任务指令 · 课外拓展（企业法律与财富管理）

> 用法：把下面「指令正文」整段复制给 Codex。它不知道我们的对话，正文必须自包含。
>
> 📌 **前提**：先读 `网站/项目结构说明.md`（当前目录结构 + 构建/测试命令）。本指令只讲「课外拓展」这一门课，其他课不要碰。

---

## 指令正文

你接手一个本地学习门户项目中的一门课：**课外拓展 · 企业法律与财富管理**。

项目根目录：

```
C:/Users/Liora/Desktop/新南2026/网站/
```

这是纯静态门户：`index.html`（CSS/JS 全内联）+ `data.js`（`window.PORTAL_DATA`）+ `build/notes/*.json`（源数据）+ `build/` 下的构建与校验脚本。
**所有课程资料文件夹都在 `网站/` 目录内部**，课外课的源文件在 `网站/课外/`。

---

### 一、不可触碰的红线（违反即任务失败）

1. **绝不删除任何用户文件。** 只允许新建文件、改写本指令明确指定的文件。
2. **改写 `build/notes/extracurricular.json` 前必须先备份**，命名 `extracurricular.json.bak-<你的标识>-<时间戳>`。
3. **`progress.js`、`records.js` 一律不许读、不许写、不许重生成**（里面是用户已保存的进度与成绩记录）。重建 `data.js` 时绝不能覆盖它们。
4. **`index.html` 本任务需要改，但只许动下面「三、3」明确列出的那一处**，其余一律不碰。
5. **笔记正文里禁止出现 ASCII 直引号 `"`**（HTML 标签属性里的引号不算）。正文需要引号时用「」或（）。校验脚本会剥掉标签后逐字检查。
6. **HTML class 名只能沿用项目已有的白名单**（`.kp-h` `.kp-key` `.kp-box` `.kp-tbl` `.kp-tbox` `.kp-src` `.gx-h` `.gx-step` `.gx-tbl` `.gx-page` `.gx-pg-h` `.gx-pg-b` `.gx-exam` `.gx-defs` `.gx-def` `.c-blue` `.c-red` `.c-gold` `.key` `.rd-meta` `.diagram` `.cap` `.frac` `.formula` 等）。**不要自创 class**。
7. **只改 `extracurricular` 这一门课**。accounting / economics / mathematics / computing / english / xiaodao / guofulun / gupiao / dadian / htlb 的 JSON 一行都不要动。

---

### 二、当前进度快照（已实测核实，可直接采信）

#### ✅ 已完成，不要重做

- **课外拓展页面（`#/extra`）已建好**：`index.html` 的 `renderExtra()` 已有完整渲染逻辑，课程卡片、统计条、「即将上线」占位区都在。
- **课外课已注册进构建链**：`build/scan_files.py` 有 `F_EXT = "课外"` 常量与 `extracurricular` 条目；`build/build_data.py` 的 `META` 里有 `id: "extracurricular"`（`nameCn: "企业法律与财富管理"`, `color: "#8a5a1a"`, `icon: "gavel"`, `extra: True`, `unitLabel: "模块"`）。
- **6 个模块的笔记内容已经写好且质量达标**（见下面「三、1」），**不要推倒重写**。
- 门户功能（打卡勾选、进度统计、导出、路由）都在 `index.html` 里，不要碰。

#### 📌 现状：6 个模块的「图文笔记」是**空壳模板**，不是真的内容

`build/notes/extracurricular.json` 里 6 个模块的 `graphicHtml`，用的**全部是同一个通用复习模板**（七段固定标题）：

```
一、Unit Overview（本单元概览）
二、Core Definitions（核心定义）
三、Knowledge Map（知识网）
四、Graphical Analysis（图形解析）
五、Comparison & Confusions（对比与易混）
六、Common Mistakes（常见错误）
七、Exam Focus（考试要点）
```

而且每个模块的「本单元概览」开头都写着这句话：

> 本单元为**复习与巩固**周，没有独立课件 PDF。以下内容基于本单元已建立的预习笔记与核心术语整合成「知识网」，用于系统回顾。

**这是错的。** 课外课**有**独立课件 PDF（`课外/企业法律、财富管理与商业能力.pdf`），而且这些模块**不是复习周，是正文内容模块**。

对照 6 个模块标题与 PDF 实际章节，可知这份 PDF 就是这门课的讲义，6 个模块对应它的 6 个章节：

| 模块 | 标题 | PDF 对应内容 |
|---|---|---|
| M1 | 财富传承的四类工具与继承债务规则 | 四类传承工具 + 「遗产 100 万 / 债务 300 万」继承债务算例 |
| M2 | 信托架构：三角色与教育金信托设计 | 信托三角色表（Settlor 委托人 / Trustee 受托人 / Beneficiary 受益人）+ 教育金信托文件约定 |
| M3 | 债权人撤销权与资产隔离 | 资产隔离 Asset Segregation + 五类财产权属 + 「资产隔离不是通过转移资产逃避已有债务」 |
| M4 | 有限合伙治理：GP 与 LP 的责任设计 | GP / LP 对照表（是否执行合伙事务 / 责任特点 / 主要作用） |
| M5 | 财富管理四阶段：创造、保护、使用、传承 | 四阶段表（创造财富 / 保护财富 / 使用财富 / 传承财富） |
| M6 | 风险承受能力：为什么要重视「不可承受的风险」 | 8.3 节 A/B 两人各 100 万的风险对比：高收益机会必须与自身承受能力相匹配 |

**注意**：真正的知识点（那两张角色表、那四个阶段、那个算例、那句红字结论）**目前只存在于 `notesHtml` 里**（`notesHtml` 写得不错，以「五、Key Details（重点详解）」承载了具体内容），而 `graphicHtml`（用户看到的「图文笔记」主区）反而是空壳。

---

### 三、要做的三件事（按顺序做，每做完一件跑一次校验）

#### 3.1 · 把 6 个模块的 `graphicHtml` 从空壳模板改成真正的图文笔记

**唯一事实来源是 `课外/企业法律、财富管理与商业能力.pdf`。**

这份 PDF 的特殊之处（已实测）：**5 页、无文本层、正文是嵌入的矢量图形 + 位图**，所以 `pypdf` / `workbuddy-pdf -f txt` 抽不出文字。

**已为你提取好的图片素材**（直接用，不要重新解析 PDF）—— 我已逐张看过内容，对应关系如下：

| PNG 文件 | 实际内容 | 归属模块 |
|---|---|---|
| `p2_x1157x365.png` | 四类工具对照表（法定继承 / 遗嘱继承 / 生前赠与 / 信托 × 发生作用的方式 × 主要特点） | **M1** |
| `p2_x1194x642.png` | 继承债务算例：遗产 100 万 / 个人债务 300 万 / 儿子继承 100 万 / 限定继承范围 / 共同债务人与担保人例外 | **M1** |
| `p2_x1370x428.png` | 公司股份传承案例：父亲担心儿子经营能力不足，赠与 / 遗嘱 / 股权治理 / 信托四条路径取舍 | **M1** |
| `p3_x1118x400.png` | 信托三角色表：委托人 Settlor / 受托人 Trustee / 受益人 Beneficiary | **M2** |
| `p3_x848x438.png` | 债权人撤销权案例：A 欠债 100 万，无偿转给亲属，债权人可请求撤销 → 「钱转给别人，债权人就找不到了」不是可靠的法律安排 | **M3** |
| `p3_x1308x640.png` | 资产隔离 Asset Segregation 定义 + 五类财产权属 + 红字警示「资产隔离不是通过转移资产逃避已有债务」 | **M3** |
| `p4_x1362x490.png` | GP / LP 对照表（是否执行合伙事务 / 责任特点 / 主要作用） | **M4** |
| `p4_x1198x684.png` | 教育金信托文件约定：按月生活费、教育费按约定支付、达龄领取部分利益、余额继续管理；红字结论「信托能实现什么效果，取决于信托文件、资金来源、财产权属、设立程序和适用法律」 | **M2**（也可放 M4 呼应） |
| `p4_x1180x446.png` | 第 4 页另一张图（请自行查看内容后归位） | 待定 |
| `p5_x876x544.png` | 财富管理四阶段表（创造财富 / 保护财富 / 使用财富 / 传承财富 × 核心问题） | **M5** |
| `p5_x860x744.png` | 8.3 不可承受的风险：A 拿 5 万试高风险 / B 拿 100 万 + 借 200 万；核心结论「高收益机会必须与自身承受能力相匹配」 | **M6** |

> 这 11 张 PNG 是从 PDF 里无损导出的原始图，**可以直接 `<img>` 引用**。但**必须先拷进 `网站/课外/` 目录**（比如 `课外/img/m1_debt_case.png`），**不要引用 `build/` 下的路径**——`build/` 是构建目录，站点运行时不一定能访问，且属于临时产物。
>
> 拷的时候**用有意义的新文件名**（如 `m1_debt_case.png`、`m2_trust_roles.png`、`m3_asset_segregation.png`、`m4_gp_lp.png`、`m5_four_stages.png`、`m6_risk_capacity.png`），避免中文路径和 `-x` 这类噪音。
>
> `p4_x1180x446.png` 的具体内容请你自己打开看一眼再决定放哪个模块（我核对时没逐字读它）。**不要为了凑数把图硬塞进不相关的模块。**

**图片在页面里的引用方式**：用 `<figure class="diagram">` + `<figcaption class="cap">`（两个 class 都在白名单里）。项目里已有同类写法可参考。

**每个模块的 `graphicHtml` 必须包含（顺序固定，沿用项目已有的 h3 标题风格）**：

1. `<h3 class="gx-h">一、…</h3>` 开头的模块导语 —— **删掉「本单元为复习与巩固周，没有独立课件 PDF」这句错误说明**，改成真实的模块导语（这门课有课件 PDF，就直说）。
2. 核心概念速览 —— 保留现有 `notesHtml` 里的概念清单。
3. **知识图解 —— 这里插入对应的 PDF 原图**（见上表），配 `<figcaption>` 说明这张图在讲什么。
4. **重点详解** —— 把 `notesHtml` 里「三、Key Details」那段的实质内容（算例、案例、对比）搬进 `graphicHtml`，并用 `<table class="gx-tbl">` 呈现书里本来就是表格的那两张（信托三角色表、GP/LP 表、财富管理四阶段表）。
5. 对比与易混 —— 用表格对比易混点。
6. 常见错误 —— 用 `<li>`，关键提醒包在 `<span class="c-red">` 里。
7. 一页速记 —— 一个速查表格或要点清单，方便临考扫一眼。

**硬性要求**：

- 剥掉标签后**每个模块的 `graphicHtml` 正文不少于 800 字符**（`runtime_test.js` 会断言 `textContent.length > 800`）。
- **不准编造 PDF 里没有的数字、条款名、案例或术语。** 这份 PDF 是法律与财富管理讲义，编造会造成实质误导。凡 PDF 没写的，就写「本节未展开，原文仅给出结论」。
- 保留中英对照格式（英文术语在前、中文在后，如 `trust（信托）`）——项目里有 `gx-defs` / `gx-def` 的现成写法可参照。
- **不要用 ASCII 直引号**，用「」。
- 现有 `notesHtml` 内容质量不错，**不要删改 `notesHtml`**，只补 `graphicHtml`。

#### 3.2 · 修一个真 bug：6 个模块的课件链接全部失效

`build/notes/extracurricular.json` 里 6 个模块的 `files` 字段全部是：

```
"企业法律、财富管理与商业能力(1).pdf"
```

但磁盘上的真实文件名是：

```
课外/企业法律、财富管理与商业能力.pdf      ← 没有 "(1)"
```

**后果**：`build/build_data.py` 按 `rel` 精确匹配文件索引，匹配不上就把 `files` 落成空数组。所以现在 `data.js` 里课外课 6 个模块的 `files` **全是 `[]`**，用户点开任何模块都看不到那份 PDF。

**这条 bug 在构建日志里有铁证** —— `build_data.py` 每次运行都会打印 `MISSING RELS`，其中**明确列着这 6 条**：

```
MISSING RELS: [..., ('extracurricular', '企业法律、财富管理与商业能力(1).pdf') × 6 ...]
```

**修法**：把 `extracurricular.json` 里 6 处 `企业法律、财富管理与商业能力(1).pdf` 改成 `企业法律、财富管理与商业能力.pdf`，然后重跑构建链。

**已实测验证过这个修法有效**（我改过→重建→确认→已还原成原状）。修好后：

```
[extracurricular] terms=1 weeks=6 weekFiles=6 general=0
M1 files=1 -> 企业法律、财富管理与商业能力.pdf
... M2~M6 同上
```

即：**6 个模块的 files 从 0 变 6，generalFiles 从 1 变 0**。`MISSING RELS` 里那 6 条课外记录也会消失。

**注意**：改完后**每个模块都会挂上同一份 PDF**（这份课就一份讲义）。这是正确的——不要为了「看起来不一样」去编造不存在的分册文件。如果觉得 6 个模块指向同一个文件不理想，**保持现状即可**，并在最终汇报里说明这一点。

> ⚠️ **联动效应（必须知道，否则会误判）**：`build/build_data.py` 第 82–87 行生成 `generalFiles` 时会**排除已被任何模块 `files` 引用过的 rel**（`if rel in used: continue`）。
>
> 所以：**3.2 修好之后，课外课的 `generalFiles` 会从 1 变成 0** —— 因为那份 PDF 已经被 6 个模块引用了。
>
> 这是**正常的**，不是 bug：课外课只有一份课件，它作为「课程资料」出现在模块里，就不会再重复出现在「其他文件」区。
>
> 但这也意味着：**课外课是验证 3.3（generalFiles 渲染）最合适的样本吗？不是** —— 修完后它 generalFiles 归零。验证 3.3 请用 **economics（136 个）** 或 **computing（100 个）**，这两个才是 generalFiles 的大头，渲染效果一眼可见。

#### 3.3 · `generalFiles` 从未渲染（全局问题，顺手修）

`data.js` 里每门课都有 `generalFiles` 字段（经济 136 / 计算 100 / 数学 10 / 会计 3 / 英语 3 / **课外 1**），但 **`index.html` 里搜不到任何 `generalFiles` 的渲染代码** —— 这些文件在页面上完全看不见。

课外课这条尤其明显：`课外/企业法律、财富管理与商业能力.pdf` 是这门课**唯一的课件**，现在只能通过模块里的 `files` 挂上去（3.2 修好后能点到），但 `generalFiles` 这条路是死的。

**做法**：在 `index.html` 的课程详情页（`renderCourse` / `renderWeek` 附近，参考现有 `files` 的渲染写法）加一处 `generalFiles` 的渲染：

- 位置放在课件列表之后，标题类似「课程资料」/「其他文件」。
- 复用现有的 `fileHref()` 与 `ROLE_LABEL` 机制，**不要自创一套路径拼接逻辑**。
- 课外课的 `generalFiles` 只有 1 个文件（那份 PDF），5 门正规课程各自有 3–136 个，**注意别让 136 个经济文件把页面撑爆** —— 建议折叠或限制首屏数量（例：先显示前 12 个 + 「展开全部」）。

> ⚠️ 这一处是 `index.html` 本任务唯一允许的改动。改之前先备份：
> `cp index.html index.html.bak-<你的标识>-<时间戳>`

---

### 四、构建与校验（每做一件事就跑一遍）

**Python 解释器**（不要用系统 python，路径固定）：

```
C:/Users/Liora/.workbuddy/binaries/python/envs/default/Scripts/python.exe
```

**Node 依赖**（jsdom 在这里，必须带 NODE_PATH）：

```bash
cd "C:/Users/Liora/Desktop/新南2026/网站"

# 1) 扫描文件索引（重建 file_index.json）
"C:/Users/Liora/.workbuddy/binaries/python/envs/default/Scripts/python.exe" build/scan_files.py

# 2) 重建 data.js
"C:/Users/Liora/.workbuddy/binaries/python/envs/default/Scripts/python.exe" build/build_data.py

# 3) 静态校验（文件链接 + 引号检查）
NODE_PATH="C:/Users/Liora/.workbuddy/binaries/node/workspace/node_modules" node build/verify_portal.js

# 4) 运行时校验（jsdom，约 100 条断言）
NODE_PATH="C:/Users/Liora/.workbuddy/binaries/node/workspace/node_modules" node build/runtime_test.js
```

**验收标准（两条命令都必须通过，输出 `ALL CHECKS PASSED` / `ALL RUNTIME TESTS PASSED`）**：

- `verify_portal.js` → `errors: 0`，且**课外课的课件链接不再缺失**（改前课外 6 个模块的 files 全空）。
- `runtime_test.js` → 全 PASS。现有断言里有 `extracurricular has 6 modules`（模块数仍是 6，**不要改模块数**）。

> 📌 **别被 `generalFiles` 数量变化吓到**：课外课修完 `files` 后 `generalFiles` 会归零（原因见 3.2 的联动说明）。校验时**不要**把它当成回归错误。

**如果 `runtime_test.js` 里关于课外课的断言与你的改动冲突**（例如你把模块数改了、或删了某个标题），**先停下来汇报**，不要直接改测试脚本迁就实现。

---

### 五、最终汇报要求

做完请明确列出：

1. 6 个模块各自的 `graphicHtml` 剥标签后字符数（都要 > 800）。
2. 课外课 6 个模块的 `files` 修好后的实际值（应为 `企业法律、财富管理与商业能力.pdf` × 6）。
3. `generalFiles` 渲染加在了 `index.html` 的哪一行、折叠策略是什么。
4. 两条校验命令的完整输出尾部（`verify_portal.js` 的 `errors` 数 + `runtime_test.js` 的最后一行）。
5. 你改了哪些文件（列出路径），以及每个文件改了什么。
6. 任何你**没有做**或**做了取舍**的地方 —— 特别是：哪些 PDF 原图你没有用上、为什么。
