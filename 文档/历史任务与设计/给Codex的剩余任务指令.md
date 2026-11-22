# 给 Codex 的任务指令 · 学习门户剩余收尾（目录搬迁后版）

> 用法：把下面「指令正文」整段复制给 Codex。它不知道我们的对话，正文必须自包含。
>
> ⚠️ **2026-11-04 目录已整体搬迁**：所有文件已从 `新南2026/` 根目录移入 `新南2026/网站/`。
> 本文档中的路径已按新结构写好，与旧版指令不同，请以本文为准。

---

## 指令正文

你接手一个本地学习门户项目的**收尾工作**。项目根目录现在是：

```
C:/Users/Liora/Desktop/新南2026/网站/
```

**这是纯静态门户**：`index.html`（CSS/JS 全内联）+ `data.js`（`window.PORTAL_DATA` 数据）+ `build/notes/*.json`（源数据）+ `build/` 下的构建与校验脚本。
所有课程资料文件夹（`Course_ FNDN *`、`FNDN Economics 2025 STD O1`、`课外`、`小岛经济学`、`国富论`、`大癫狂`、`股票作手回忆录`、`活得更好`、`备考规划`、`技能包`、`zip` 等）都已在 `网站/` 目录**内部**。

### 一、不可触碰的红线（违反即任务失败）

1. **绝不删除任何用户文件。** 只允许新建文件、改写本任务明确指定的文件。
2. **`build/notes/accounting.json`、`economics.json`、`mathematics.json` 改写前必须先备份**，命名 `xxx.json.bak-<你的标识>-<时间戳>`。
3. **`progress.js`、`records.js` 一律不许读、不许写、不许重生成**（里面是用户已保存的进度与成绩记录）。重建 `data.js` 时也绝不能覆盖它们。
4. **`index.html` 本任务不需要改。**（三个子任务都不涉及；原因见第五节）
5. **笔记正文里禁止出现 ASCII 直引号 `"`**（HTML 标签属性里的引号不算）。正文需要引号时用「」或（）。校验脚本会剥掉标签后逐字检查。
6. **HTML class 名只能沿用项目已有的白名单**（`.kp-h` `.kp-key` `.kp-box` `.kp-tbl` `.kp-tbox` `.kp-src` `.gx-h` `.gx-step` `.gx-tbl` `.gx-page` `.gx-pg-h` `.gx-pg-b` `.c-blue` `.c-red` `.c-gold` `.key` `.rd-meta` `.diagram` `.cap` `.frac` `.formula` 等）。**不要自创 class**。

### 二、当前进度快照（已实测核实，可直接采信）

#### ✅ 已完成，不要重做
- **目录搬迁已完成**：所有文件已移入 `网站/` 内部；桌面只剩 `新南2026/网站`。搬迁后路径已相应修正并全部校验通过：
  - `index.html` 的 `fileHref()` 已去掉 `../` 前缀（资料文件夹已在 `网站/` 内部，改为站内相对路径）
  - `build/verify_portal.js` 的 `path.join(portalDir, "..", base, sub)` 已改为 `path.join(portalDir, base, sub)`
  - `build/build_data.py` 的 `BASE` 已改为 `C:\Users\Liora\Desktop\新南2026\网站`（`BUILD`/`NOTES`/`OUT` 随之调整）
  - `build/extract_text.py`、`gen_xiaodao.py`、`gen_guofulun.py`、`gen_gupiao.py`、`gen_dadian.py`、`gen_htlb.py` 的 `BASE` 同样已改
  - `index.html` 里 6 处给用户看的「复制到「新南2026」目录下」文案已改为「「网站」目录」
  - 搬迁后实测：**448 个资料链接全部可达、0 失效**；`verify_portal.js` errors=0；`runtime_test.js` 全 PASS
- 经济 24 周的「PPT 内例题内联」已完成：例题按知识点顺序并入 `graphicHtml`，`index.html` 中独立渲染 `examplesHtml` 的代码已删除（第 1463 行只剩注释）。经济各周 `examplesHtml` 是占位串，不参与渲染。
- 计算机 19 周已重做为纯 Activity 步骤。
- 门户功能：课程自动跳到首个未完成周、每周打卡勾选（数学按课/题拆分）、下载真 PDF。**都已在 `index.html` 里，不要碰。**

#### 📌 待办一：双语「英文主导」改写还差 2 周
扫描脚本 `build/scan_bilingual.py` 判定「解释正文中文字符数 > 英文字母数」为违规。
- 已改好但**尚未合入 JSON** 的有 19 周（`build/_bifix/*.html`，注意文件名不带 `.src`）：
  - `economics_term1x_5,6,7,8,9,10,11,12`
  - `mathematics_term1_1,2,3,4,5,7,8,9,10,11,12`
- **仍缺产出**（`.src.html` 已提取好，只差改写后的 `.html`）：
  - `build/_bifix/mathematics_term1_13.src.html` → `build/_bifix/mathematics_term1_13.html`
  - `build/_bifix/mathematics_term2_1.src.html` → `build/_bifix/mathematics_term2_1.html`
- 已改好的 19 周已通过 `build/scan_one.py` 单文件校验（0 违规）。

#### 📌 待办二：19 周双语成果尚未合入 notes JSON
`_bifix/*.html` 里全部是改写后的最终 `graphicHtml`，但 `build/notes/economics.json` / `mathematics.json` 里还是旧版 —— 所以全局扫描仍报 457 处违规。合入脚本 `build/_apply_bifix.py` 已写好，其正则 `^([a-z]+)_([a-z0-9]+)_(\d+)\.html$` **不会误伤 `.src.html`**（已验证：38 个 `.html` 中命中 19 个，正确排除 19 个 `.src.html`）。

#### 📌 待办三：会计的「PPT 内例题内联」尚未完成
会计 13 周中，**W1–W6、W8–W11 共 10 周**的 `graphicHtml` 末尾仍有一个独立的「PPT 内例题 · 逐题完整解析」板块，需要拆出来按知识点顺序并入讲解流。W7 / W12 / W13 本来就没有该板块，**不要动**。

- 拆分原料已备好：`build/_acct_merge/_raw/term1_{1,2,3,4,5,6,8,9,10,11}_concept.html` 与 `_examples.html`（已验证 10 周全齐）。
- ⚠️ **重要警告**：`build/_acct_merge/term1_1.html` ~ `term1_6.html` 这 6 个已生成的合并文件**有内容丢失，不可直接使用**。
  实测 W1：原 `graphicHtml` 剥标签后 32384 字符，该合并文件只有 21226 字符，原文里 `Example 3`、`Example 4`、`third section contains` 等段落整段消失（合并尾部被 Unit2 Tutorial 解析占掉，顺序也错了）。
  → **这 6 个文件请一律丢弃重做**，不要合入。

### 三、执行步骤（按顺序做，每步做完都跑一次校验）

#### 步骤 1 · 补完 2 周双语改写
对 `build/_bifix/mathematics_term1_13.src.html` 和 `build/_bifix/mathematics_term2_1.src.html` 各产出一个同名 `.html`（去掉 `.src`）。

改写规则（《总规范》）：
- **解释正文必须英文主导**：用完整英文句子写解释，中文只作括注辅助。判定标准是英文字母数 > 中文字符数。
- **标题、概念、定义：英文在前、中文在后**，如 `Market failure（市场失灵）`。
- 要改的块：`<p class="kp-key">`、`<p class="kp-box">`、`<div class="kp-tbox">`、`<h4 class="kp-h">` 章节内的解释性 `<p>`、中文主导的 `<p class="c-red">`。
- **原样保留**：`<p class="kp-src">`（来源引用）、`<p class="c-blue">`（计算/例题演示）、全部 `<table>` / `.gx-tbl` / 公式 / `<sup>` / `<sub>` / `<ul>/<ol>` / `.gx-step` / `.gx-h`；以及所有 `gx-page` / `gx-pg-b` 原始例题文本块。**数学公式一个符号都不能改。**
- 事实与数字保持不变，只改语言配比。

示例：
- 改前 `<p class="kp-key">二次三项式 ax² + bx + c 分解为两个一次因式的乘积。</p>`
- 改后 `<p class="kp-key">A quadratic trinomial ax² + bx + c is expressed as the product of two linear factors.</p>`

**单文件门禁（必须通过）**：
```
cd C:/Users/Liora/Desktop/新南2026/网站
python3 build/scan_one.py build/_bifix/mathematics_term1_13.html
python3 build/scan_one.py build/_bifix/mathematics_term2_1.html
```
两条都必须输出 `violations: 0`。

#### 步骤 2 · 合入 19 周双语成果
```
cd C:/Users/Liora/Desktop/新南2026/网站
cp build/notes/economics.json   build/notes/economics.json.bak-codex-<时间戳>
cp build/notes/mathematics.json build/notes/mathematics.json.bak-codex-<时间戳>
python3 build/_apply_bifix.py
```
脚本按 `course_termid_week.html` 匹配并只写 `graphicHtml` 字段，其他字段不动。跑完必须核对输出「已写入 N 周」，且 N 应为 **21**（经济学 8 + 数学 13）。

#### 步骤 3 · 会计 PPT 例题内联（10 周）
对 `term1_1,2,3,4,5,6,8,9,10,11` 每一周：

1. 从 `build/_acct_merge/_raw/term1_N_concept.html` 出发，把 `_examples.html` 里的每道例题**按主题匹配**插入到 concept 流中对应知识点之后（例题讲 market failure 就插在 market failure 讲完之后；先讲的知识点的例题在前）。
2. 插入时给例题块加上原有结构的包裹标签（`.gx-page` / `.gx-pg-h` / `.gx-pg-b` 这类，照 `_raw/term1_N_examples.html` 里已有的结构照抄），不要自创 class。
3. **合并完成后，合并文件里不能残留「PPT 内例题」这个独立标题。**
4. **必须做内容守恒校验**（这一步不能省）：把原始 `accounting.json` 里该周 `graphicHtml` 剥掉标签后的正文，按 `</p>` / `</h4>` / `</div>` / `</tr>` 切成段，**每一段的前 80 个字符都必须能在新文件里找到**；缺的段落数为 0 才算通过。把校验脚本写出来（可放 `build/_check_acct_merge.py`），跑一遍给出逐周结果。
5. 通过后写回 `accounting.json` 该周的 `graphicHtml` = 合并结果；该周 `examplesHtml` 保持下面这串**占位符**（会计现有各周已经是这个写法，不要自创措辞）：
   ```
   <p class="rd-meta">本周 PPT 内例题已并入上方「笔记」标签，请切换到「笔记」查看逐题完整解析（与讲义按页顺序合并在一起）。</p>
   ```
   （经济学各周的 `examplesHtml` 用的是另一句纯文本 `已并入讲解流（PPT 内例题已跟随对应知识点按讲义顺序出现）`——**经济学不要改**，只有会计需要按上面这串写。）

#### 步骤 4 · 重建 data.js 并全量校验
```
cd C:/Users/Liora/Desktop/新南2026/网站
python3 build/build_data.py
node build/verify_portal.js
```
（Windows 上若 `python` 不存在就用 `python3`；`build_data.py` 只写 `data.js`，不会碰 `progress.js` / `records.js`。）

`verify_portal.js` 必须输出 `errors: 0`。

再跑运行时回归（jsdom）：
```
set NODE_PATH=C:/Users/Liora/.workbuddy/binaries/node/workspace/node_modules
node build/runtime_test.js
```
必须全部 PASS。

最后再跑一次双语全局扫描：
```
python3 build/scan_bilingual.py
```
**合计违规必须是 0**（当前基线 457：经济学 183 + 数学 274）。

### 四、验收清单（全部满足才算完成）

| 检查项 | 通过标准 |
|---|---|
| `python3 build/scan_bilingual.py` | 合计违规 = 0 |
| `python3 build/scan_one.py`（21 个已修文件逐个跑） | 每个都 `violations: 0` |
| `node build/verify_portal.js` | `errors: 0` |
| `node build/runtime_test.js` | 全部 PASS，无 FAIL |
| 资料链接可达性 | 448 条链接 0 失效 |
| `build/notes/*.json` 三门课 | 已备份；`graphicHtml` 是新版；`examplesHtml` 为占位串 |
| `progress.js` / `records.js` | 文件未被修改（用修改时间核对） |
| 会计 10 周内容守恒 | 逐周缺失段落数 = 0 |
| 正文 ASCII 直引号 | 笔记正文 0 处（`verify_portal.js` 已覆盖） |
| 目录结构 | `新南2026/` 顶层只有 `网站/` 一项，不要把文件挪回去 |

### 五、几个容易踩的坑

- **不用改 `index.html`。** 独立「PPT 内例题」板块的渲染代码在第 1463 行已经注释掉，`examplesHtml` 现在完全不参与渲染。会计只要把 `graphicHtml` 换成就好。
- **`build_data.py` 只写 `data.js`**，不要试图让它重建进度数据。
- **`scan_one.py` / `scan_bilingual.py` 已排除 `.kp-src`**，来源行不受「英文主导」约束，不要为了过扫描去改来源行。
- **路径前缀**：资料链接现在是站内相对路径（无 `../`）。如果你看到 `fileHref` 或 `verify_portal.js` 里又出现 `../` 或 `path.join(portalDir, "..", ...)`，说明被改回去了，要改回来。
- **不要用 `rm -rf` 清理目录。** 临时目录（`build/_acct_merge`、`build/_bifix`）在全部验收通过前先保留，便于回滚；确认无误后只删 `.src.html` 中间件与废弃的 `build/_acct_merge/term1_*.html`（那 6 个有损文件），保留 `_raw/`。
- **不要自己发明新脚本去做第 2 步**，`_apply_bifix.py` 已经可用；第 3 步才需要新写脚本。
- **`build/_premove_backup/` 是本次目录搬迁的备份目录**（含移动前全量清单 `manifest_before.json`），先别删，用于出问题回溯。

### 六、汇报要求

完成后请给出：
1. 每个子任务的结果（双语补完 / 合入周数 / 会计合入周数 / 各项校验的实际输出）。
2. 会计 10 周内容守恒校验的逐周缺失段落数。
3. 改动的文件清单（含备份文件名）。
4. 如果某一步卡住或校验没过，如实说明卡在哪一步、实际输出是什么，不要用「应该没问题」代替验证。

开始吧。先跑一遍 `python3 build/scan_bilingual.py` 和 `node build/verify_portal.js` 确认基线与我的描述一致，再动手。
