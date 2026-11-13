# Liora 的学习小屋 · 正式项目（唯一编辑入口）

此目录是唯一正式维护入口，也是**所有 AI（WorkBuddy / Codex / ChatGPT / 其他）共同编辑的唯一地方**。
站点：https://liora-study-hall.app.workbuddy.host/?sharecode=L4NKT6REQ6
应用：`wbapp_rBWn4x6EKZDM20OKLiy9jd`，域名 `liora-study-hall`。重发布必须复用这个应用，不新建平行部署。

## 0. 只有一个网站（主人 2026-11-07 再次强调，先读这条）

**全站只有一份代码，就是本目录的 `public/`；正式网站是上面那个网址。不存在「本地网站」和「线上网站」两套。**

- `npm start` 起的 `http://localhost:3000/` 只是**同一份 `public/` 文件**在本机浏览器里的临时预览窗口（`server.js` 里 `PUB = path.join(ROOT,'public')`）。它不是复制品、不是平行站点、不产生第二份内容；关掉窗口或服务，网站本体一点没少。
- `localhost` / `127.0.0.1` 的意思是「这台电脑自己」，不是「另一个网站」。正式网址和 localhost 打开的是**同一个文件夹**，只是访问通道不同。
- **严禁另起本地副本**：不要新建 `本地版/`、`localhost 版`、复制到桌面再改；不要从归档 / 快照 / `_bak` / `发布快照-*` 整目录拷回来覆盖 `线上版/`。历史目录只可查阅。
- 所有改动、所有 AI（WorkBuddy / Codex / ChatGPT）**一律只改本目录**，改完发布到上面那个正式网址。浏览器验收优先直接在正式网址做；只有需要绕开登录态做调试时才临时用 localhost 预览。

## 1. 改完直接发布，不用等主人说「发布」

主人已于 2026-11-06 长期授权、2026-11-07 再次确认：**任何 AI（含 Codex / ChatGPT）做完改动后直接执行「更新发布」，不需要再问一次、也不需要等确认**。
这条覆盖更早「需用户确认才发布」的旧规矩。发布目录固定为 `网站/线上版`，网址不变。Codex 与 WorkBuddy 拥有同等的直接修改、直接发布权限。

- 发布前先跑一次版本留档（见第 4 节）。
- 发布前检查并挪走 `线上版/checks/backups`（回归脚本会自动重建，不挪会撑大上传包导致超时）；`public/` 保持在约 30MB 以内。
- 保留原网址、账号与线上 `data/`；严禁用本地 `auth.json` 或本地进度覆盖线上。

## 2. 授权与并行：Codex 和 WorkBuddy 可以同时改不同板块

主人明确要求两个 AI 同时在不同板块工作，且互不覆盖。实现方式：

- 所有 AI 编辑的是**同一台机器上同一个目录里的不同文件**。文件内容共享在磁盘上，发布时读的是当时磁盘的最新状态，所以「改不同文件」天然不会互相覆盖。
- **严禁整目录复制 / 覆盖**：不要用归档版、历史本地版、快照目录去覆盖 `线上版/`；不要 `cp -r` 整个目录回来。只允许按文件写入。
- **内容类改动优先走即时生效通道**：`board-editor.html` + `/__api/boards/<板块ID>` 的 19 个内容板块，补丁存在线上 `data/board-*.json`，改完立刻生效，**连整站发布都不需要**，也不会被发布覆盖（发布保留线上 `data/`）。
- **代码类改动写进板块专属文件**：Codex 主要维护 `question-bank`、`board-editor`、`study-plan`、`learning-profile`、`english`；WorkBuddy 主要维护 `notes-layout`、`notes-views`、`notes-content`、`notes-theme`、`todo`、`cloud`、`home`、`reading`。同一个板块若两边都要动，先各自留一版再改。
- **Codex 的直接发布权限（主人 2026-11-07 明确要求）**：Codex 改完文件后可以、也应当直接把改动推上线，不需要主人说「发布」、不需要先问 WorkBuddy。若它自己的环境有「更新发布 / 部署」能力，直接复用 appId `wbapp_rBWn4x6EKZDM20OKLiy9jd` 与域名 `liora-study-hall` 发布；若该环境没有发布按钮，把文件落盘即可（内容板块走即时生效通道，代码板块落盘即可），WorkBuddy 在每次对话开始时会检查 `module-hub.js status` 并把未发布改动直接推上线，主人不必再说「发布」。
- 只发布 `线上版/` 这一个目录；不要新建另一份部署、另一个域名、另一个 appId。

## 3. `public/index.html` 是共享骨架，尽量别碰

`index.html` 里挤着全站渲染逻辑，两边同时编辑它才会真正冲突。规则：

- **只允许**三类修改：① 增删 `<script src>` / `<link>` 引用行；② 改 `?v=` 版本号；③ 把调用处改成 `window.xxx(...)`。
- **禁止**在 `index.html` 里新增或修改业务逻辑。新功能一律写进板块专属文件（`public/blocks/*.js` 或已有板块 `.js`），用 `window` 暴露，主页面只留一行引用。
- 示范：中文分行、公式横线分数、**笔记大类分组配置**、**删除「本周概览与目标」铺垫**、**按知识点折叠**都已抽到 `public/blocks/notes-layout.js`；2026-11-06 起 `index.html` 里 `NB_GROUPS` 只保留一行 `window.NotesGroups` 引用，分组怎么分一律改板块文件。骨架里 `window.stripNotesIntro(app)`、`window.flattenEnglishNotes(app)`、`window.rebuildNotesFold(app)`、`window.highlightKeyPoints(app)` 四行都只是调用，不要往里写逻辑。
- **折叠的最终形态（用户 2026-11-06 定义，别改回去）**：点开笔记看到的是「一列默认全部收起的知识点」，不是「方法与步骤 / 公式与计算」这类大类分组栏。每个知识点一张卡片、CSS 自动编号；点标题展开该知识点的讲解 / 公式 / 例题 / 解析。`✏️ 例题 N` 小节并入它**前面**的知识点（显示成「例题 N：xxx」+ 题干 + 解析），不再单独占一条折叠。英语笔记例外：保持顺着学习顺序全部展开、`rebuildNotesFold` 会自动跳过。调分类 / 例题识别 / 卡片样式只动 `notes-layout.js`。
- **重点 / 易错易混的视觉（用户 2026-11-06 定义）**：红字 + 高亮。`highlightKeyPoints()` 处理 4 类：`.kp-key` 考点段、`.c-red` 已标红强调、`Common Mistakes & Confusions` 等易错小节（标题强高亮、节内正文淡高亮）、行内 `<strong>` 易错/考点标签。两档：`kp-mark`（红字 + 荧光黄 + 左红条）/ `kp-mark-soft`（红字 + 淡黄）。**颜色与底色必须写在内联 style**，因为 PDF 读当前 DOM、Word 读 `pane.innerHTML`，都拿不到注入的 `<style>`；边框/圆角放注入 CSS。公式、来源行、例题标题、普通正文一律不染。切换四视图后会自动补跑一次（幂等）。
- 改带 `?v=` 的静态文件内容后，务必同步升 `index.html` 里的版本号，否则 immutable 缓存会让旧文件一直生效。**发布前自检（必做）**：`server.js` 对 `.js/.css` 是 `public, max-age=31536000, immutable`，「文件内容变了但 `?v=` 没变」= 线上白改。逐个核对本次改动过的 `.js/.css` 与 `index.html` 里对应 `<script src>` / `<link href>` 的 `?v=`，内容变了就必须换新版本号。2026-11-07 实例：`question-bank.js` 12:41 改过却沿用 `20261106T1100-publish3`，已修正为 `20261107-qbank2`。

## 4. 每次改完自动留一版，可只回退一个板块

工具：`网站/build/module-hub.js`（零依赖），注册表：`网站/build/module-registry.json`。

```
node 网站/build/module-hub.js modules                     # 列出全部板块
node 网站/build/module-hub.js status                      # 哪些板块有改动还没留档
node 网站/build/module-hub.js auto "这次改了什么"          # 给所有变化的板块各留一版（改完必跑）
node 网站/build/module-hub.js list notes-layout          # 看某板块的历史版本
node 网站/build/module-hub.js rollback notes-layout 20261106-214322   # 只回退这一个板块
```

- 旧版本永久保留在 `网站/归档/板块版本/`，文件内容按 SHA-256 去重存放，同一份只占一次空间。
- 版本清单：`网站/归档/板块版本/版本记录.md`（人读）。
- 回退**只覆盖该板块的文件**，其它板块一个字节不动；回退前还会自动给当前状态留一档，随时能退回来。
- 主人只要说「把 XX 板块退回某版」即可，由 AI 执行上面的命令，不需要主人记命令。

## 5. 红线（任何 AI 都不得违反）

- `auth.json`、`data/state.json`、`data/u_*.json`、`data/board-*.json`：永不覆盖、不进快照、不参与回退。
- **禁止全量重跑 `build_data.py`**：`data.js` 与 `build/notes/*.json` 已分叉，重跑会清空大量周次。改单周用定点替换（范例 `build/gen_econ_u5.py`）。
- 前端不得手写 `/.cloud/**` 接口，一律走 `window.cloud` / `window.cloudLLM`。
- 原始课程资料夹（`Course_*`、`FNDN Economics 2025 STD O1` 等）只读参考，不在其中新建或改动文件。
- 所有新生成、备份、临时产物只能放在 `网站/` 及其子目录内。

## 6. 课外拓展 / 每日简报：导航只有两个入口（2026-11-07 19:15 合并完成）

主人 19:11 明确纠正：**「拓展阅览室和课外拓展并在一起，课外拓展就是拓展阅览室，每日简报就是每日简报，怎么安了三个出来？」**

**最终结构（任何 AI 不得再加第三个入口）：**

| 导航名字 | 指向 | 说明 |
| --- | --- | --- |
| 课外拓展 | `#/extra` | 就是原来的「学院拓展阅览室」页，内容一字未删；名字统一叫「课外拓展」 |
| 每日简报 | `public/daily-brief.html` | 独立一页，内容区 `#dailyBriefContent`（`data-slot-body="daily-brief"`） |

- **新建的 `public/extra-hub.html` 独立页已删除**（连同 `blocks/extra-hub.css|js` 与注册表里的 `extra-hub` 板块）。不要重建，也不要把 `extra-hub.html` 加回导航。旧版留在 `归档/板块版本/`（版本 `20261107-191057`），需要时可按板块回退。
- 主站主导航、页脚、`daily-brief.html` 页内导航三处**都只出现「课外拓展」和「每日简报」**；「拓展阅览室」只是旧页内的 H1 标题，不再是导航名字。
- 两页互不嵌套、不合并：`#/extra` 是主站 SPA 内页，`daily-brief.html` 是独立 HTML 页。
- 改 `public/blocks/daily-brief.css` / `.js` 后，同步升 `daily-brief.html` 里对应的 `?v=`（immutable 长缓存）。
- `public/index.html` 只允许改导航 `<a>` 行、`?v=`、引用行；禁止写业务逻辑。

## 7. 自动发布看门狗（2026-11-07 20:00 启用，任何 AI 都要知道）

主人要求：「每 10 分钟，如果没人在做任务，就检查线上版有没有更新，有更新就定时发布」。实现 = `网站/build/auto_publish_watch.py` + 6 条定时任务。

- **平台定时规则只认到「小时」**：`BYMINUTE` 多值会被忽略，`validFrom` 设在过去也不生效（退化成 now+1h）。因此用了 **6 条 `FREQ=HOURLY;INTERVAL=1` 规则**，靠未来 `validFrom` 分别错到每小时的 :00 / :10 / :20 / :30 / :40 / :50，合起来才是真正的每 10 分钟。**不要合并成一条、不要改 rrule、不要删其中任何一条。**
- 看门狗只盯唯一网站目录 `线上版/`（约 358 个文件），排除 `data/`、`auth.json`、`checks/backups/`、`__pycache__`、临时/锁文件与运行产物。基线在 `build/.auto_publish_state.json`，发布锁在 `build/.auto_publish.lock`，日志在 `归档/自动发布日志.md`。
- 判定顺序：发布锁 → 两次扫描是否一致（是否在写入中）→ 最后一次改动后静默满 180 秒 → 与上次发布基线比对。只有 `NEED_PUBLISH` 才发布；`BUSY`（有人正在改 / 刚改完还没静默 / 上一轮仍持锁）一律跳过。**所以 Codex 编辑期间不会被抢发半成品。**
- 发布单元执行：留档 `node build/module-hub.js auto ...` → JS 语法 / `?v=` / 体积 / 红线自检 → 复用 appId 发布 → 正式站复核 → `--commit` 提交新基线并解锁；失败则 `--unlock`，下一轮自动重试。
- **不要往 `线上版/` 目录里写日志、状态或任何新文件**（会让自己下一轮误判成有更新而无限重复发布），日志只由脚本写进 `归档/自动发布日志.md`。
- 若主人要暂停 / 改频率 / 关掉，操作对象是那 6 条定时任务（WorkBuddy 定时任务面板），不是删脚本；删脚本会让每轮都报 ERROR。
