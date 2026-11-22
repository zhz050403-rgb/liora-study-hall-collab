# 给 Codex 的任务书 · Liora 的学习小屋

> 用法：下面 **第 0 部分** 发一次（建立上下文），之后每做一个批次，把对应的「第 N 部分」追加发过去。
> 工作目录必须是 `C:/Users/Liora/Desktop/新南2026`。
>
> **批次表**
> | 批次 | 内容 | 性质 |
> |---|---|---|
> | 1 | 修课件链接 bug + 渲染 generalFiles + 挂 source-reader/notes-quality + 搜索增强 | 加功能 |
> | 2 | 日期轴与倒计时 + 四态掌握度 + 复习队列 + 备份提醒 | 加功能 |
> | 3 | 考前复习页补 4 门 + 术语闪卡 | 加功能 |
> | 4 | AI 真读课件 + 补齐空的例题/作业答案标签 | 加功能 |
> | 5 | 数学公式真排版 + 三色密度 + 内嵌图片 | 内容打磨 |
> | 6 | **双语英文主导整改（经济183 + 数学274）+ 公式清理 + 读书5本复核** | 内容整改 |
>
> **建议顺序**：先发第 0 部分 → 再发**第 6 部分**（内容质量是用户最在意的硬规范，
> 且改动面清晰、好验收）→ 然后第 1、2、3、4、5 部分。
> 每个批次独立成篇，做完一个再发下一个。

---

## 第 0 部分 · 总纲（先发这段，一次）

```text
你在改一个给 UNSW 预科生用的学习门户。这是一个纯静态 SPA，没有框架、没有 npm 依赖、
没有构建工具链，只有 Python 脚本和原生 JS。请按下面这份说明书工作。

【工作目录】
C:/Users/Liora/Desktop/新南2026

【代码结构】
网站/index.html          单文件门户，CSS/JS 全部内联（笔记面板样式在第 7-569 行的 <style> 里）
网站/data.js            全站数据，格式 window.PORTAL_DATA = {...}
网站/progress.js        进度备用通道，window.PORTAL_PROGRESS（← 见红线，严禁碰）
网站/records.js         成绩记录
网站/server.js          node 本地服务，给右下角 AI 助手提供 /api/chat
网站/vendor/html2pdf.bundle.min.js   PDF 导出引擎（已下载，已被 index.html 引用）
网站/build/scan_files.py    扫课程文件夹 → 网站/build/file_index.json
网站/build/build_data.py    合并 file_index.json + build/notes/*.json → 网站/data.js
网站/build/notes/{courseId}.json   各门课的笔记源数据，结构：
    { "courseId": "accounting",
      "terms": [ { "id": "...", "weeks": [ { "num": 1, "files": [...], "graphicHtml": "...",
                                              "notesHtml": "...", "examplesHtml": "...",
                                              "tutorialAnswers": "...", "tasks": [...], ...} ] } ] }
    courseId 取值：accounting / economics / mathematics / computing / english / extracurricular
                   xiaodao / guofulun / gupiao / dadian / htlb（后 5 个是「读书」栏目，不是课程）
网站/build/verify_portal.js     测试①：文件链接存在性 + 正文引号规范
网站/build/runtime_test.js      测试②：jsdom 运行时行为回归（约 100 条断言）
网站/build/diagram_lib.py       经济笔记用的 SVG 图（[[DIAG:key]] 占位符，构建时替换）

【环境命令】
Python: "C:/Users/Liora/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
Node  : 需设 NODE_PATH=C:/Users/Liora/.workbuddy/binaries/node/workspace/node_modules

构建（改完 notes/*.json 或 scan_files.py 后跑，顺序固定）：
  cd "C:/Users/Liora/Desktop/新南2026/网站/build"
  "C:/Users/Liora/.workbuddy/binaries/python/envs/default/Scripts/python.exe" scan_files.py
  "C:/Users/Liora/.workbuddy/binaries/python/envs/default/Scripts/python.exe" build_data.py

【★ 重建后必做：版本号 +1，否则用户看不到你的改动】
网站/index.html 里这 4 行带 ?v= 参数，重建 data.js / prep-data.js 之后必须各加 1：
  <script src="data.js?v=20261104a"></script>
  <script src="prep-data.js?v=20261103b"></script>
  <script src="prep-center.js?v=20261103b"></script>
  <link rel="stylesheet" href="prep-center.css?v=20261103b">
原因：data.js 有 4.1MB、prep-data.js 有 143KB，浏览器会长期缓存。
2026-11-03 就发生过一次 —— 文件改对了，用户刷新却还是看到「减负前」的旧排期，
排查了很久才定位到是缓存。改完 ?v= 之后，普通刷新(F5)即可生效。

测试（每次改完必跑，当前基线是双绿）：
  cd "C:/Users/Liora/Desktop/新南2026/网站"
  NODE_PATH="C:/Users/Liora/.workbuddy/binaries/node/workspace/node_modules" node build/verify_portal.js
  NODE_PATH="C:/Users/Liora/.workbuddy/binaries/node/workspace/node_modules" node build/runtime_test.js
  基线：verify_portal 报 "ALL CHECKS PASSED"，runtime_test 报 "ALL RUNTIME TESTS PASSED"

【红线 —— 违反就是事故】
1. 不许删除任何文件；不许改动用户原有的课件、PDF、txt 等素材。只能新建文件。
2. 改任何文件前先备份：cp 文件名 文件名.bak-<YYYYMMDD_HHMMSS>
3. progress.js 和 records.js 一律不许读、不许写。它们只由「存档页复制进度」流程更新。
4. build_data.py 只能写 data.js 里的 window.PORTAL_DATA，绝不许碰 window.PORTAL_PROGRESS。
5. 浏览器里已存的进度和成绩不能丢。localStorage key：
   - 进度/任务/打卡：xinnan-portal-v1
   - 成绩记录：xinnan-portal-records-v1
   改完后必须回归验证三件事：① 周面板勾选状态 ② 任务进度 ③ 成绩记录，一项都不能丢。
6. 笔记正文（HTML 标签之间的文字）里禁止出现 ASCII 双引号 "，一律用「」或（）代替。
   HTML 标签属性里的双引号是允许的，不要动。
7. 笔记的内容规范（要改笔记正文时必须遵守）：
   - 双语且英文主导：解释正文用英文写完整句子，中文只作括注；标题和概念是「English 概念（中文）」
   - 三色：.c-red = 重要规则/结论/易错点；.c-blue = 例题/计算过程/答题示例；正文黑色
   - 例题必须并入讲解流（跟在对应知识点后面），每题含三要素：题目 → 解析 → 知识点讲解
   - 数学公式必须真排版：分数用真分式、上下标用 <sup>/<sub>、根号用 √、禁止 a^2 / 1/x / sqrt() 这种编程式文本
   - 逐页覆盖：一份笔记对课件每一页都要有记录，一页都不能漏
   - 不得编造。所有内容必须能对回原始课件；资料缺失要写明「资料未提供」
8. 一次只做一个批次，做完停下来汇报，不要连续往下做。

【当前基线状态（供你对照，不用重新调查）】
- 课程 11 门 / 219 周，graphicHtml 覆盖 219/219，预览笔记 206/219
- 读书栏目 6 本已完成（每本都是逐章模式）
- Word/PDF 导出按钮已实现（html2pdf + 自写 .doc 生成）
- 每周打卡勾选（预习/作业）、进度保存、成绩记录、艾宾浩斯排期表（备考规划/）均已完成
- 备考中心 #/prep（prep-data.js / prep-center.js / prep-center.css）已上线完成，
  这三个文件属于另一个功能域，不要动它的逻辑
- 计算机课 26 周的「本周课件」链接为 0（是 bug，批次 1 修）
- generalFiles 字段有 151 份文件但 index.html 从未渲染过
- examReview（考前复习页）只有 computing 有，另外 4 门正课是空的
- 笔记里 examplesHtml/tutorialAnswers 仅 37/38 周有内容
- 笔记里没有 ASCII 双引号、进度数据没有丢 —— 这两条是红线，别破坏

【英文主导双语的实测基线（2026-11-04 用 build/scan_bilingual.py 跑出来）】
- accounting 0 处违规 ✅
- english 0 处违规 ✅
- economics 183 处 ❌ —— 全部集中在 term1x（"Term One 补充 · 2025 微观 Unit 5–11"）
  的 W7 23 / W8 30 / W9 20 / W10 24 / W11 27 / W12 59；term1 和 term2 已 0 违规
- mathematics 274 处 ❌ —— T1 W1 19 / W2 16 / W3 14 / W4 25 / W5 16 / W7 38 / W8 9 /
  W9 41 / W10 19 / W11 7 / W12 19 / W13 33，T2 W1 18；其中 3 处是「纯中文无英文」
- computing / 读书栏目 5 本不在这个脚本的扫描范围内（实操课豁免；读书用另一套模板），
  需要单独按批次 6 的 C 项复核
- 复核命令：cd 网站/build && python scan_bilingual.py
  （明细落在 build/notes/_scan_bilingual.json）

现在做批次 1。
```

---

## 第 1 部分 · 批次 1：修 bug + 小改动（先做这个）

```text
做批次 1。四件事，每件做完都自测，全部做完再一起汇报。每件动手前先备份。

【1-1】修计算机课课件链接为 0 的 bug（这是 bug，不是新功能）
根因：网站/build/scan_files.py 第 22 行
  F_CMP = r"Course_ FNDN Computing for Business, Science and Design 2026 STD O2 _ UNSW_term week type unit"
这个目录不存在。实际目录名是：
  Course_ FNDN Computing for Business, Science and Design 2026 STD O2 _ UNSW_补下载_2026-10-22T05-35-58-957Z
（该目录下是 term1/week1..week13 和 term2/...，共 143 个文件：56 xlsx / 46 pdf / 20 docx / 13 jpg / 2 pptx）
做法：把 F_CMP 改成实际目录名，重跑 scan_files.py + build_data.py。
注意 scan_files.py 里的 map_default 映射器需要能把 term1/weekN 这种结构映射到对应周次；
如果现有映射器处理不了，先读懂 map_default 再改，不要硬套。
验收：data.js 里 computing 的各周 files 不再是 0；verify_portal.js 报 files checked 数量明显上升且 errors 0。
      打印出最终各周 files 数量给我看。

【1-2】渲染 generalFiles（151 份文件现在完全看不见）
现状：data.js 里每个 course 有 generalFiles 字段（经济 136 / 数学 10 / 会计 3 / 学术英语 3 / 课外 1），
      但 index.html 从头到尾没有引用过这个字段。
做法：在课程页加一个「本课程其他资料」折叠分组（用 <details> 或现有 .kp-box 风格），
      按 lecture / worksheet / exercise / other 之类分组列出，链接用现有课件链接的同一套路径拼法。
      不要把文件真的复制进 网站/ 目录，用相对路径指向 ../../Course_ FNDN .../ 这类原始位置，
      路径拼法必须和现有 weeks files 的链接一致（先读 index.html 里现成的拼法再动手）。
验收：打开会计/经济任一课程页，能看到并点开「本课程其他资料」；链接点得开，verify_portal 不报错。

【1-3】挂上三个已经写好但从没被引用的零件
现状：这三个文件在磁盘上，但 index.html 一次都没引用：
  网站/notes-quality.css    （2381 字节，含整套打印分页规则：表格/图 break-inside: avoid、
                              按 Unit 另起页、孤行控制、打印时隐藏标签栏）
  网站/source-reader.js      （14478 字节，逐页原始资料阅读器，按页翻课件 + 记录每页阅读状态，
                              存储 key: liora-source-reading-v1）
  网站/source-reader.css    （3848 字节）
做法：在 index.html 的 <head> 里加 <link rel="stylesheet" href="notes-quality.css">，
      在 </body> 前加 <script src="source-reader.js"></script>，
      并把 source-reader.js 的入口挂到周面板的某个按钮上（按钮文案用「逐页读原文」之类）。
      注意：index.html 里已有大量内联 <style>，notes-quality.css 的规则可能和内联样式冲突，
      挂上去后如果发现笔记区样式被改坏，用更具体的选择器覆盖，不要删内联样式。
      source-reader.js 需要的数据（每周的课件 rel 路径列表）从 course.weeks[].files 取。
验收：打开任一周次，能进入逐页阅读器并翻页；笔记区的视觉样式没有被破坏；
      verify_portal 和 runtime_test 都还是绿的。

【1-4】搜索增强
现状：全站搜索命中上限 12 条，没有关键词高亮，点进去不会定位到命中位置，核心术语不在索引里。
做法：
  a) 上限 12 → 30
  b) 命中处关键词高亮（在结果标题和摘要里包 <mark>，样式用暖黄底，别用刺眼颜色）
  c) 点搜索结果跳转到对应周次后，自动滚动到正文里第一次命中的位置并闪一下高亮
  d) 把每个周的「核心术语表」（英文术语 + 中文）也加进搜索索引
验收：搜一个只有术语表里才有的英文单词（比如 accounting 的某个专有名词），能命中；
      点结果能跳到正确周次并看到高亮位置。

汇报格式：每件任务写「改了什么文件 / 怎么验收的 / 测试结果」，并把 verify_portal 与 runtime_test
的完整结尾输出贴出来。测试没过就别交。
```

---

## 第 2 部分 · 批次 2：调度层（日期轴 + 倒计时 + 四态掌握度 + 复习队列）

```text
做批次 2。这是让网站从「资料库」变成「学习引擎」的一轮，改动会碰存储结构，所以最需要小心。

【背景】
现在进度只有二元：state.weeks[key] = true/false（标记本周完成）。state 结构在 index.html 第 786 行附近：
  var base = {tasks:{}, weeks:{}, lastpos:{}, punch:{}};
存储 key 是 localStorage["xinnan-portal-v1"]，另有 window.PORTAL_PROGRESS 作为备用通道
（build/notes/*.json 的 notesHtml 等字段由 build_data.py 合并，data.js 里 window.PORTAL_DATA 是内容源）。
weekKey(cid, tid, wnum) = cid + "/" + tid + "/" + wnum。

【2-1】日期轴 + 考试倒计时
现状：周次只有 "Week 4" 编号，没有任何日期；首页只显示今天几号。
做法：
  a) 给每门课每个 Term 加起止日期字段（startDate / endDate），给每门课加期末考试日期字段（examDate）。
     这些是课程层面的元数据，放进 build/notes/{courseId}.json 的顶层（比如加一个 "meta" 对象），
     不要写死在 index.html 里。日期必须来自 UNSW 官方 2026 学术日历 ——
     先去查 UNSW 官网的 2026 academic calendar 拿准确日期，查不到就在报告里明确标出「需用户确认」，
     绝对不要自己编一个日期。
  b) 周面板顶部显示真实日期区间，例如 "Week 4 · 11/03 – 11/09"
  c) 首页每门课显示「距期末考试 N 天」
  d) 课程中心卡片上也显示日期范围
验收：随便打开 3 门课，周面板都能看到那一周对应的真实日期；首页能看到倒计时；
      考试日期若无法从官方确认，在汇报里列成待确认项。

【2-2】四态掌握度（取代二元勾选）
现状：只有「标记本周完成 / 未完成」，打开笔记看两眼就能打勾，但打勾 ≠ 会做。
做法：未学习 → 已阅读 → 练习中 → 已掌握
  - 「已阅读」只能用户手动点，打开页面绝对不许自动标记
  - 「练习中」在用户提交练习/作业后自动进入
  - 「已掌握」必须由测试结果或用户手动确认
  存储：新增 state.mastery[key] = "unread|reading|practicing|mastered"，默认值 "unread"。
  旧数据迁移：原来 state.weeks[key] === true 的周次，迁移成 "practicing"（因为你至少做过勾选）。
  迁移必须幂等，且不能把用户已有的 weeks/tasks/punch/lastpos 数据弄丢。
  UI：周面板加一个四态选择器；首页统计条拆成两栏 ——「任务完成率」和「测试结果得分率」，
     两者不许混在一起算。
验收：只打开笔记不做任何操作，状态必须停在「未学习」；
      迁移后原有勾选状态、任务进度、成绩记录三项一条都不能丢；
      runtime_test 要新增对应的断言。

【2-3】今日待复习队列（间隔重复）
做法：每个周次记 3 个字段：上次复习日期 lastReview、复习次数 reviewCount、下次到期日 nextDue。
  间隔 1 / 3 / 7 / 15 / 30 天，按 reviewCount 依次取。
  首页和课程页顶部出现「今日到期复习：N 项」列表；勾掉一项 → 下次到期日自动往后推一档。
  存储放 state.review[key] = {lastReview, reviewCount, nextDue}，不要动 state.weeks。
  另外：学习档案页里出现 ≥2 次的薄弱点，对应周次的复习间隔缩短一档（7 天 → 3 天），
  并在首页标红提示 —— 让薄弱点真正回流到复习安排，而不是只统计不干预。
验收：连续用 7 天（或用测试模拟日期推进），首页每天都能列出当天该复习的周次；
      勾掉后当天不再出现，且按间隔在对应日期重新出现；
      在档案里录一个出现 3 次的薄弱点，对应周次 3 天内出现在「今日待复习」。

【2-4】备份提醒
现状：进度和成绩存在浏览器 localStorage，换浏览器/清缓存会丢。
      档案页已有「导出/导入/复制进度」三个按钮，但没有任何提醒。
做法：在档案页加一个「距上次备份 X 天，超过 7 天请导出一次」的提示。
      记录上次备份时间（放 state.lastBackup，新 key，不影响旧数据）。

【铁律提醒】
- state 里所有新字段都要给默认值，老用户的老数据要能自动迁移，不能报错也不能丢
- 改完必须跑 verify_portal + runtime_test，并在 runtime_test 里补上本批次的新断言
- 汇报时把「三项数据一条没丢」的验证过程写清楚（勾选状态 / 任务进度 / 成绩记录）
```

---

## 第 3 部分 · 批次 3：考前冲刺（考前复习页 + 术语闪卡）

```text
做批次 3。

【3-1】考前复习页补齐到 4 门正课
现状：index.html 第 1215 / 1236 / 1636 行有 examReview 的渲染逻辑，但只有 computing 的
      build/notes/computing.json 里真正有 examReview 数据（内容量大，格式是「章节 → 考点 → 必考/可能考/了解」三档）。
      accounting / economics / mathematics / english 这 4 门点进去是空的（代码会走「正在整理中」分支）。
做法：照 computing 的数据结构和渲染逻辑，给这 4 门补 examReview 写进各自的 build/notes/*.json。
  格式必须是「章节 → 考点 → 必考/可能考/了解」三档筛选，考点来自该课已有图形笔记的内容
  （graphiHtml 里的核心定义、易错点、公式），不许编造课件里没有的东西。
  每门至少 10 个考点。
  读书栏目的 5 本书（xiaodao/guofulun/gupiao/dadian/htlb）不需要 examReview，别给它们加。
验收：5 门正课都能打开考前复习页，三档筛选都能用，每门 ≥10 个考点；
      verify_portal + runtime_test 绿。

【3-2】术语表闪卡自测
现状：全部周次都有双语术语表（英文 + 中文 + PPT 英文释义），但只是静态陈列，没有任何自测功能。
做法：术语表加一个「闪卡模式」——
  正面：英文术语；背面：中文 + 英文释义；两个按钮「认识 / 不认识」。
  点「不认识」→ 该术语进入批次 2 的复习队列，并缩短它的复习间隔。
  「认识」→ 间隔正常推进。
  存储放 state.flashcards[weekKey + "/" + 术语] = {known:bool, nextDue:date}。
  术语表已经全量覆盖了（219 周），这一项是纯加交互层，成本低。
验收：任意一周的术语表都能进入闪卡模式；点「不认识」后该术语第二天会再次出现。

汇报：每件写「改了什么文件 / 怎么验收的 / 测试结尾输出」。
```

---

## 第 4 部分 · 批次 4：AI 真读课件 + 补齐空标签

```text
做批次 4。

【4-1】让 AI 助手真的读到课件（现在它答不了课件里的细节）
现状：
  - index.html 第 2179 行发给后端的 context 只有："课程上下文：" + 课程名 + "；" + 标题 —— 约几十个字
  - server.js 第 124 行：const context = String(payload.context||"").slice(0, 8000); 之后拼进 prompt
  - 课件逐页文字没进上下文、笔记正文没进上下文、回答不标来源页码
做法：
  a) 前端组装上下文时带上：当前课程 + Term + Week 号 + 该周的课件逐页文字 + 该周 graphicHtml 全文
  b) 课件逐页文字从哪来：读课件 PDF（用 workbuddy-pdf skill 的 CLI，或 python 侧预先抽好文本缓存）。
     注意课件是 PDF 且有 300+ 份 —— 建议在 build/ 目录下做一个离线抽取脚本，
     把每份课件的逐页文本抽成 JSON 缓存（build/pdf_text_cache.json），构建时并进 data.js，
     前端直接读缓存，不要在浏览器里现抽。
  c) 回答里必须标出来源页码，例如 "Per Lecture Slides p.12"
  d) 课件里找不到依据的内容，回答里必须明确写「以下为补充解释，课件中未出现」
  e) 和批次 1-3 挂上的 source-reader.js 用同一份逐页索引（别搞两套页码体系）
  f) 双击 index.html 打开（没有本地服务）时，AI 面板现在会报错。
     加一个兜底按钮：「复制问题 + 当前周上下文」，把拼好的问题文本复制到剪贴板，
     方便用户粘到 ChatGPT 里问。两种打开方式都能用。
  g) context 的 8000 字符上限要提到能装下「一周课件正文 + 一周笔记」（自己定合理上限，但别把整门课塞进去）。
验收：随便问一个只有课件里才有的细节（比如某道例题的具体数字），AI 能答对并给出页码；
      问一个课件里没有的问题，回答里出现「以下为补充解释，课件中未出现」。

【4-2】补齐空占位标签（现在 219 周里只有 37 周有例题、38 周有作业答案）
现状：examplesHtml（PPT 内例题）只有 accounting 13 + economics 24 = 37 周有；
      tutorialAnswers（课后作业答案）只有 accounting 13 + economics 25 = 38 周有。
      computing 26 周、english 14 周、extracurricular 6 周、mathematics 14 周全是空的。
做法：
  a) examplesHtml：把课件/讲义里的例题提取出来，按批次 0 红线第 7 条的规范写
     （题目 → 解析 → 知识点讲解 三要素），并入讲解流的对应知识点后面。
  b) tutorialAnswers：补课后作业的答案与解题过程。
  c) 读书栏目的 5 本书不要这两个标签（它们的模板是四节：故事梗概/寓意/可学习的点/对应真实事件，
     或 本章概览/关键建议/可照做的点/真实依据）。
  d) 数据量很大（54 周 × 2 个字段）。先做 computing 一个 Term（13 周）给我看格式，
     确认格式对了再批量推剩下的。
验收：至少 computing Term1 的 13 周两个字段都有内容、格式一致、内容真实（能对回课件）；
      确认后再批量，全部做完后 219 周里（除读书栏目）不再有空占位。

汇报：4-1 和 4-2 分开写清楚。
```

---

## 第 5 部分 · 批次 5：打磨项（有空再做）

```text
做批次 5。都是内容层面的细活，按「先给清单、再批量改」的方式做。

【5-1】数学公式真排版（87 处编程式写法）
现状：数学笔记里还有 a^2、1/(√a+√b)、sqrt(x)、a^m·a^n 这种编程式文本，共约 87 处。
做法：改成真分式（<sup>/<sub> 或 CSS 分数）、根号用 √ 加覆盖线、对数写 log<sub>a</sub>x。
      数学是最低优先级科目，但改的时候不许走「逐页转写」偷懒路径 ——
      要保留完整解题过程，每步演算都要在。
      先列出全部 87 处清单（哪一周哪一句）给我看，我确认后再批量改。

【5-2】三色标记密度
现状（实测）：accounting 13 周里 12 周零红标；economics 25 周全部零红标；
      english 14 周全部零红标；xiaodao 19 周里 8 周零红标。
      computing 的 c-blue 有 1885 处但红标也少 —— blue 用在例题，red 应落在重要规则/结论/易错点。
做法：按红线第 7 条的规范补。红色 = 重要规则/核心结论/考试重点/易错点/易混区别；
      蓝色 = 例题/计算过程/应用示范/英文答题示例。只在关键处用色，不要全高亮。
      先给清单：哪一周缺什么类型的标记，我确认后再批量改。

【5-3】笔记内嵌图片偏少
现状：全部笔记里只有 7 处内嵌图片（sources/*.webp 逐页截图），经济靠构建期替换的 SVG 图。
做法：图表型科目（经济、数学）在关键图（AD-AS、成本曲线、函数图像）上保留原图。
      截图从课件 PDF 抽页渲染成 webp，放网站/sources/。
      一周放 1-3 张关键图即可，不要每页都截。

【5-4】三处容易误判的地方顺手确认一下（不是任务，是别改错）
  - 数学有 14 周图形笔记了，不是「数学没笔记」—— 别去「恢复」它，它已经是完整笔记
  - notes-quality.css 里那套打印分页规则已经挂上了（批次 1-3），别重复实现一遍
  - 读书栏目 5 本书是逐章模式、每章一个独立模块，侧栏会显示几十项 —— 这是预期的，不是重复

汇报：5-1 和 5-2 都是「先清单后批量」，清单给我看。
```

---

## 第 6 部分 · 批次 6：笔记内容质量整改（双语英文主导 + 公式排版 + 读书复核）

> 这个批次和批次 1–5 是两条独立的轴：1–5 是「加功能」，批次 6 是「把已有内容改达标」。
> 建议顺序：批次 6-A → 批次 1 → 批次 2 → …（也可以并行做，文件不冲突）。

```text
做批次 6。目标是把已有笔记的内容改到符合红线第 7 条。三个子项按顺序做，
每个子项都先交样本给我确认，再批量。

【6-A】经济 term1x 双语整改 —— 183 处
文件：网站/build/notes/economics.json
位置：terms 里 id=term1x（name =「Term One 补充 · 2025 微观 Unit 5–11」）的 W7 W8 W9 W10 W11 W12
分布：W7 23 处 / W8 30 / W9 20 / W10 24 / W11 27 / W12 59
现状：这 6 周的解释正文是「中文主导」，不是红线要求的「英文主导」。
做法：把每个被判违规的解释块改写成英文主导 ——
  英文写完整句子在前，中文作括注/辅助说明跟在后面；
  标题与概念一律「English 概念（中文）」形式。
  ❌ 只留一个英文术语 + 下面全中文正文
  ✅ "Bookkeeping is the daily recording of financial transactions; accounting is the
      broader process of summarizing, analyzing and reporting those records.
      记账是每日记录；会计是对这些记录做汇总、分析与报告的完整过程。"
不用改：表格、蓝色例题步骤、来源行（.kp-src / .kp-pg-src）、.c-red 块。
注意：term1 和 term2 已经 0 违规，一个字都不要碰。
验收：python scan_bilingual.py 后 economics 变成 0 处；
      随机打开 term1x 的 W7 / W10 / W12，逐段读过去全是英文主导。

【6-B】数学 双语整改 + 公式真排版 —— 274 处 + 公式清理
文件：网站/build/notes/mathematics.json，全部 14 周（T1 W1–W13 + T2 W1）
分布：T1 W1 19 / W2 16 / W3 14 / W4 25 / W5 16 / W7 38 / W8 9 / W9 41 / W10 19 / W11 7 /
      W12 19 / W13 33；T2 W1 18；另有 3 处是「整段纯中文」
优先级：W7(38) 和 W9(41) 最重，先做；W13 是考前综合复习，也重要。
除双语外，还要把公式改成规范排版（红线第 7 条最后两项）：
  · 上标/下标用 <sup>/<sub>，根号用 √ 加覆盖线，对数写 log<sub>a</sub>x，
    分数用真分式或 <sup>1/n</sup> 的形式
  · 现存编程式写法要清掉，典型如 (ab)^m=a^m·b^m、a^0=1、a^(-m)=1/a^m、sqrt(...)
  · 数学是最低优先级科目，但这一科不许走「逐页转写」偷懒路径 ——
    每道例题必须保留完整分步演算，每一步都要在
  · 已知其它周数学的 graphicHtml 已有 11K–48K 字符，别把内容改薄了，
    改完长度不应明显缩水（每处扩写的英文会补回长度）
验收：python scan_bilingual.py 后 mathematics 变成 0 处；
      抽查 T1 W7 / W9 / W13，公式全是 sup/根号/分数，没有 a^2 / 1/x / sqrt()；
      每道例题有完整计算步骤，不是只给答案。

【6-C】读书 5 本逐章复核（这 5 本从没进过 scan_bilingual.py 的扫描范围）
文件：网站/build/notes/xiaodao.json(19章) / guofulun.json(32章) / gupiao.json(24章) /
      dadian.json(12章) / htlb.json(34章)
读书类用轻量四节模板，不适用红线第 7 条里那套课程重结构：
  graphicHtml 固定四节：
    Story Summary（故事梗概）→ Moral / Meaning（寓意）
    → What to Learn（可学习的点）→ Real-world Events（对应真实事件，
      三列表：寓言情节 / 真实事件 / 简要说明）
  notesHtml 三节：一句话概览 / 故事速览 / 真实事件预告
  不设独立术语区（术语并入「可学习的点」）；不写对照表、不写考试要点、不写常见错误
  与课本冲突处只加 1 条红字提醒
  双语保留（章节标题、术语中英对照），解释正文英文主导
  每模块约 850–950 字，不要为凑字数注水
做法：逐章核对是否同时符合「四节模板」+「英文主导」；不合的改。
      先交 2 章样本（xiaodao 任意 1 章 + guofulun 任意 1 章）给我看格式。
验收：随机抽 5 章，四节齐全、英文主导、字数在 850–950 区间；
      scan_bilingual.py 仍全绿。

【6-D】计算机（最低优先级，可最后做或不做）
网站/build/notes/computing.json：26 周里 19 周 notesHtml 为空
（term1 的 W1-W6/W8-W13、term2 的 W1-W5/W8/W9）；term2 W6–W13 的 graphicHtml 偏薄
（1700–3600 字符）。但网站里 graphicHtml 是主内容、notesHtml 只是兜底，
所以这不影响使用。实操课的双语规则经用户明确免除。
若要补，先交 term2 W8「Media Presentation 策划」一个样本给我看。

【每个子项做完都要走】
1. 备份 notes/*.json
2. 改 notes/*.json（只动 graphicHtml / notesHtml 正文，不动 courseId/terms/num/
   tasks/files/verification/prepQuestions 等结构字段）
3. python build/build_data.py
4. 【★】index.html 里 4 个 ?v= 版本号各 +1
5. python build/scan_bilingual.py → economics 0 / mathematics 0 / accounting 0 / english 0
6. node build/verify_portal.js → errors 0
7. node build/runtime_test.js  → ALL RUNTIME TESTS PASSED
8. node build/prep_test.js     → ALL PREP RUNTIME TESTS PASSED
汇报：每个子项写「改了哪些周、每类问题各改了多少处、改前后该周长度对比」，
      并把 scan_bilingual.py 的汇总输出和三个测试的结尾输出贴出来。
```

---

## 附录 · 常用命令速查

```bash
cd "C:/Users/Liora/Desktop/新南2026/网站"

# 构建
cd build && "C:/Users/Liora/.workbuddy/binaries/python/envs/default/Scripts/python.exe" scan_files.py
             "C:/Users/Liora/.workbuddy/binaries/python/envs/default/Scripts/python.exe" build_data.py

# 重建后必做：index.html 里 4 个 ?v= 版本号各 +1
#   data.js / prep-data.js / prep-center.js / prep-center.css

# 双语复核（英文主导）
cd build && "C:/Users/Liora/.workbuddy/binaries/python/envs/default/Scripts/python.exe" scan_bilingual.py

# 测试
NODE_PATH="C:/Users/Liora/.workbuddy/binaries/node/workspace/node_modules" node build/verify_portal.js
NODE_PATH="C:/Users/Liora/.workbuddy/binaries/node/workspace/node_modules" node build/runtime_test.js
NODE_PATH="C:/Users/Liora/.workbuddy/binaries/node/workspace/node_modules" node build/prep_test.js

# 备份
cp index.html index.html.bak-$(date +%Y%m%d_%H%M%S)
cp build/notes/accounting.json build/notes/accounting.json.bak-$(date +%Y%m%d_%H%M%S)
```

## 附录 · 硬红线速查（复制到每个批次末尾）

```text
- 不许删除文件；不许改用户原有素材；只能新建
- 改动前先 .bak 备份
- progress.js / records.js 一律不许读写
- build_data.py 只写 window.PORTAL_DATA，不碰 window.PORTAL_PROGRESS
- 老用户的勾选状态 / 任务进度 / 成绩记录，一项都不能丢
- 笔记正文禁止 ASCII 双引号 "，用「」或（）
- 一次只做一个批次，做完停下汇报，测试必须双绿才交
```
