# LIORA-FAST-PH0-001｜全站功能与交付周期审计报告
2026-11-22 Asia/Shanghai。L0只读+L1报告归档。结论：现状盘点完成但功能端到端、平台部署身份和学术质量存在证据缺口；不得宣称全站验收或按本报告自动开发。RELEASE HOLD，Production Write DENIED。

## 1. 本轮来源及身份
实际读取权威Google Docs最新v2.4和统一台账第67/68节（原始任务26项编号）。规范ID1tfXd7YCyOezXgA9o0qEs-YhNaG2fcLwzQ71OHL1HxIM；台账ID1YM2FVNXRqyCKOJpZljMR4yysEXRgebnWjq-ZdXXGU4Y。台账最新报告GitHub已转Private：这是REPORTED，替代过时Public历史说法，但本轮未重新核验仓库状态。SCM前次本地来源仍可复用，关键现场SHA重新读取。
正式源码C:/Users/Liora/Desktop/新南2026/网站/线上版；Git根网站；分支feat/bilingual-video-config；HEAD667f77493d14b400e9e9fb09470c139d793d00c0；Remote为空。Git数量见git-counts.json。GitHub不是正式生产源。实际线上Deployment ID/产物SHA UNKNOWN，不能把磁盘等同线上或R07。
当前主要文件SHA:
{
  "index.html": "39934650b4f96743b1bbcc0a863a6619aa9ced62aa6a67cf86895e11b3d5f059",
  "data.js": "c189bff38b7e605b45f537845435a1602f8159355b2e24b5192345beee46edc0",
  "question-bank.js": "53ea4755fbed0bd6d34ad996edb9ba7574c456a499730574309ee87006be1f6d",
  "note-views.js": "14757fd1e2138ee4ea5d2b3b1736949f84b1742dfdac6bdf6ab73c8c0484bb43"
}
命令证据baseline.json：rev-parse HEAD,branch --show-current,remote-v,diff --name-only，GIT_OPTIONAL_LOCKS=0；额外status --porcelain=v1 -uall仅计数避免传播无关个人路径。代码匹配均未运行写数据测试。未运行构建/旧生成器，不触碰真实账号/进度/成绩。

## 2. 内容规模与质量边界
{
  "topLevelCourses": 67,
  "mainCourseWeeks": {
    "accounting": 13,
    "economics": 27,
    "mathematics": 27,
    "computing": 26,
    "english": 14
  },
  "mainTotal": 107,
  "allRecordCount": 345,
  "terms": 71,
  "headingNodes": 1813,
  "detailsNodes": 1112,
  "emptyBothFields": 0,
  "quality": "All current production records UNKNOWN_AMOS_QA unless independently hash-linked; R07 isolation35/37 concepts25/26 examples PASS REPORTED in ledger, not production acceptance. SDG33 materials PASS REPORTED not imported."
}
67个顶层条目含书籍和拓展，71个Term/chapters容器、345个Week/章节不是345教学周。五门主课实际accounting13、economics27、mathematics27、computing26、english14，合计107 course-term-week记录。Unit没有统一稳定字段，不能由标题擅自推导真实Unit总数；course-inventory.json保留精确course.id/term.id/week.num及标题、正文长度、摘要、结构计数。1813是h3/h4节点含概览与解题流程，不是唯一ConceptID数量；1112是details节点，不保证1112题均独立且正确。
没有两类正文同时为空，不等于无缺失；占位、缺概念/例题/英语或来源等语义缺失未全量审定。所有正式记录质量默认UNKNOWN_AMOS_QA；不得把未知直接标待重写。R07隔离35/37考点、25/26例题PASS据最新台账REPORTED并保护，Q6外部依赖继续BLOCKED；正式data未集成，因此不能给正式W1直接贴PASS。SDG33素材PASS同属历史独立QA记录，网站适配仍未证实。需要升级的准确数量暂UNKNOWN，而非把107全部重做。
数据流程：build/notes+file_index→build_data.py→正式data/reading-data；与现有增量数据能否无损再现未证明，禁止全量重建。server动态board-overrides会覆盖，运行时内容未读；故这里统计的是磁盘静态基线，真实生效全站规模仍UNKNOWN。读取Board需后续受控只读接口权限。

## 3. 26项逐项核销
源码存在不能算端到端完成。本轮不启动生产服务器、不操作真实进度；没有足够当前运行证据的项目标PARTIAL/UNVERIFIED。NOT_FOUND只有搜索范围明确且缺实现才可用，本轮不滥用；EXISTS_VERIFIED不以按钮或关键词授予。详细每项依赖/复用/授权见requirements-26.json。
|ID|需求|状态|实际文件及匹配行（仅静态证据）|
|---|---|---|---|
|H01|Accounting W1 Golden Sample|PARTIAL|线上版/public/index.html:733,1271,1296,1494,1594|
|H02|全课程AMOS笔记|PARTIAL|线上版/public/note-views.js:84,106,139,605,719; 线上版/public/blocks/notes-layout.js:83,86,89,94,249|
|H03|SDG11 Reading Adventure|UNVERIFIED|线上版/public/english/js/modules.js:58,67; 线上版/public/english/js/app.js（无匹配或缺文件）|
|H04|SDG11 Speaking文字词汇|UNVERIFIED|线上版/public/english/js/modules.js:188,375,377,393,400|
|H05|Speaking音频AI反馈|UNVERIFIED|线上版/public/english/js/modules.js:560,586,660,677,697; 线上版/public/english/js/api.js（无匹配或缺文件）|
|H06|IELTS Reading模拟考试|UNVERIFIED|线上版/public/exam-prep.html（无匹配或缺文件）; 线上版/public/blocks/exam-prep.js（无匹配或缺文件）|
|H07|UNSW AE Reading模拟考试|UNVERIFIED|线上版/public/exam-prep.html:8; 线上版/public/blocks/exam-prep.js:457,470,563,680,682|
|H08|私人知识库Docs同步|UNVERIFIED|线上版/public/index.html:2264,2271,2386,2661; 线上版/public/learning-profile-data.js（无匹配或缺文件）|
|H09|笔记统一布局|PARTIAL|线上版/public/note-views.js:2,4,12,14,15; 线上版/public/blocks/notes-layout.js:2,82,88,89,228|
|H10|逐页课件阅读器|PARTIAL|线上版/public/source-reader.js（无匹配或缺文件）; 线上版/public/source-reader.css（无匹配或缺文件）; 线上版/public/index.html:318,319,320,321,322|
|H11|Word/PDF真实导出|PARTIAL|线上版/public/index.html:3009,3050,3080|
|H12|三色公式双语排版|PARTIAL|线上版/public/notes-quality.css:2,3,4,5,6; 线上版/public/note-views.js:193,194,197,199,361; 线上版/public/blocks/notes-layout.js:11,13,17,19,24|
|H13|会计W12重点标记|PARTIAL|线上版/public/blocks/notes-layout.js:507,510,512,513,514|
|H14|AI课件逐页引用|UNVERIFIED|线上版/public/ai-console.html:50,59; 线上版/public/english/js/api.js（无匹配或缺文件）|
|H15|AI Teacher真实学习数据|UNVERIFIED|线上版/public/ai-console.html（无匹配或缺文件）; 线上版/public/learning-profile-data.js:42,93,156,226,279|
|H16|知识点关联题库|PARTIAL|线上版/public/question-bank.js:1,27,1660,1934,3275; 线上版/public/exam-bank-data.js:2|
|H17|错题掌握度|PARTIAL|线上版/public/question-bank.js:2597,2817,2986,4729,5158; 线上版/public/learning-profile-data.js（无匹配或缺文件）|
|H18|经济B站精确匹配|PARTIAL|线上版/public/blocks/bilingual-video.js:10,27,40,41,110|
|H19|双语视频|PARTIAL|线上版/public/bilingual-video.html:94; 线上版/public/blocks/bilingual-video.js:5,6,10,31,32|
|H20|管理员AI权限成本|PARTIAL|线上版/public/ai-console.html:81,93,184,185,193|
|H21|进度快照恢复|PARTIAL|线上版/public/progress.js（无匹配或缺文件）; 线上版/public/cloud-sync.js:157; 线上版/public/prep-center.js:84,85,87,276,281|
|H22|每日简报|PARTIAL|线上版/public/daily-brief.html:6,9,29,37,47; 线上版/public/blocks/daily-brief.js:2,4,7,13,15|
|H23|GitHub治理|UNVERIFIED|SCM/P0历史证据，当前平台未核验|
|H24|发布门禁|UNVERIFIED|SCM/P0历史证据，当前平台未核验|
|H25|源码线上映射|UNVERIFIED|SCM/P0历史证据，当前平台未核验|
|H26|共享入口回归|PARTIAL|线上版/public/index.html:1020,1021,1022,1023,1025|
H01 R07独立QA结论可复用但正式集成/整周锁定未批准。H10 source-reader.js/css指定文件缺失，index中的PDF字样只能证明可能替代实现，不能认定阅读器完成。H11 exportNoteWord和window.print存在，Word桌面/PDF质量未验证。H13须对W12正文和实际高亮结果定点QA，不能仅凭共享highlight函数判完成。H18/H19/H22原始PRD/聊天范围SOURCE_NOT_VERIFIED，不自动纳入新开发。H14原暂缓与后续AI Teacher存在授权冲突，须01统一范围；源码不能激活暂缓需求。H03-H08模拟考试/知识库等未取得完整原PRD，状态不代表不存在，只表示无法核实业务要求已实现。所有条目当前实施授权仅L0/L1。

## 4. 发布、备份及阻断
WorkBuddy正式appId历史wbapp_rBWn4x6EKZDM20OKLiy9jd，路径线上版，实际平台任务列表/当前6任务状态/Deployment ID无法通过本轮工具核实，UNKNOWN；PAUSED仅历史REPORTED。auto_publish_watch.py和module-hub归档历史存在，但存在锁/快照不等于审批或恢复成功。前SCM已读看门狗静默判断，无强制QA/用户批准身份门禁；平台旁路是否封闭UNKNOWN。备份manifest哈希匹配不等于恢复演练；当前恢复能力NOT TESTED。解除：04提供只读平台ID/部署产物摘要/触发入口和私有化影响/数据排除/隔离恢复演练证据，禁止为取证启动部署或回滚。
其他阻断：完整来源授权及逐考点学术QA、真实运行态Board差异、账号进度读写验证权限、AI模型/费用边界、音频转录服务/隐私、考试样题和评分标准来源。每类独立排队；Q6不拖住无依赖内容草稿，但仍阻断整周Golden Sample。

## 5. 最小提速方案与顺序
复用notes-layout/note-views排版、question-bank错题/题库、prep-center排程、English素材/词汇模块、cloud-sync进度、现有导出和源文件清单。不要并行重造多套系统；reading与speaking共享素材ID但成绩分别记录。代码和语义需依赖证据而非关键词判断。
顺序：①固定单来源及覆盖层只读快照、26项PRD核销、发布门禁证据；②先做4 course-week试批，保留PASS仅修已定位FAIL，分离SourceID/ConceptID/题号；③自动结构、英中非空、来源映射、公式/例题存在性、重复/空白伪修复、目标字段/任务映射、可逆性检查；④每个重要考点/例题独立来源和语义QA，不用抽样代替；⑤共享组件一次完整浏览器矩阵，后续仅变更范围；⑥L3三方增量集成另批，L4上线另批。Single Writer Codex集成；02可独立准备课程补丁、03提前审源/定矩阵、04盘发布门禁，相互不写正式共享产物。
批量生成只能是L1草稿或另批L2候选，模型输出必须经清单、校验、修复上限和待审区，不能直接覆盖当前107记录。进度/成绩/任务数据不进生成路径。

## 6. 工期模型：条件估算，不是承诺
基数仅五门主课107记录，尚未证明多少需要小修/重写。为不低估，每条按一次来源/内容核对预算，学术规模由实际考点数决定，首4条试批后必须重估。阅读书籍/拓展238记录不当教学周，也不包含在核心版质量全覆盖预算；若全功能定义要求全部书籍逐章学术QA，应追加按章估算，当前未授权。
资源假设：1代码集成者、1内容准备者、1独立QA；每天7有效小时、每周5天，三流可并行但同一内容先生成后QA，不把同一AI多开窗口当三倍产能。外部审批/教师/平台等待单列。
|情景|每course-week内容准备小时|每course-week独立QA小时|核心工程人日|核心日历工作日估算|全功能额外工程+QA人日|全功能日历工作日估算|
|---|---:|---:|---:|---|---:|---|
|最低|1.5|2|10|约35–45|20–30|约60–80|
|正常|4|5|20|约85–105|40–60|约135–180|
|不利|8|10|35|约165–210|80–120|约265–350|
计算：内容107×小时÷7；QA107×小时÷7；核心关键路径=max(工程人日,内容人日,QA人日)+启动/串联/返修缓冲，得到上述区间。全功能在核心后加双考试、SDG适配、音频AI、受控知识库与其测试，按额外工作去重，不是26项各自相加。完整book QA、全历史安全修复、额外教师等待未含，出现则另估。最低情景要求绝大多数笔记仅小修且来源齐、组件可复用；不利情景假设多项重写/服务不可用。2027-01-17只作为台账目标检查点，正常场景不支持承诺到日全课程达标；应以核心可用子集+分批验收解释，范围另由用户确认。
首4 course-week完成后量化真实每知识点审查时长、每周通过数、一次通过率、返修轮次；更新剩余量和关键路径。当前没有真实团队吞吐，所有数值为透明规划假设，不能包装成已测产能。

## 7. 下一阶段唯一建议工单
建议LIORA-FAST-PILOT-001，先申请L2隔离“4个course-week证据门禁试批”，候选周从course-inventory中由01选定，排除Accounting W1及已锁定SDG素材；不由本报告擅自指定重写。精确范围：建立源清单→内容差异审查→只修已确认缺口→结构/保护脚本→共享笔记页三视口→独立逐项QA→汇总吞吐。禁止新增全站功能、正式data/Board/Git/部署写入。DoD为4条稳定ID、原始来源SHA、逐概念/例题矩阵、无非目标差异、可逆候选和实际页面证据。01批准具体4条和隔离基线后才执行。04发布只读工作作为并行依赖，不新开多个集成写入任务。

## 8. 状态与交接限制
本报告实际完成静态规模/源码基线/26项索引核对，未声称端到端功能通过；台账历史QA与平台状态已分开。敏感运行数据未读取或上传。报告只含业务摘要、代码路径和SHA。独立QA/04仍需补证。正式权限未变；R07与SDG PASS字节未改。整体READ_ONLY_INVENTORY_COMPLETE_WITH_EVIDENCE_GAPS；不构成L2/L3/L4批准。
