你要接手继续开发一个已经存在的中文项目「学习小屋 / 新南 2026 学习门户」。下面信息自包含，请严格按顺序执行。

【第一步 · 拿到代码】
在任意目录执行（仓库已公开，不需要登录）：
git clone --branch feat/bilingual-video-config --single-branch https://github.com/zhz050403-rgb/liora-study-hall-collab.git study-hall
cd study-hall
默认分支就是 feat/bilingual-video-config。仓库里另有 main 和 5 个 claude/* 分支，那是另一条独立历史线；除非我明确要求，不要切换、不要合并、不要覆盖。

【第二步 · 先读文档，别急着写代码】
依次读完：README.md（项目是什么 / 页面导览 / 课程清单）、AGENTS.md（项目铁律，优先级最高）、线上版/AGENTS.md（板块化与发布规则）、项目结构说明.md、板块与版本说明.md、项目交接摘要-20261115.md、.gitignore（红线清单）。
读完后先用自己的话复述：唯一正式目录是哪一个、哪些文件绝对不能动、改完怎么验证。等我确认，再开始写第一行代码。

【项目是什么】
本地 Node 服务 + 静态前端的个人学习门户，没有前端框架、没有构建步骤。
- 唯一正式目录是 线上版/：前端在 线上版/public/，服务端在 线上版/server.js。
- public/index.html 是共享骨架：只允许改引用行、?v= 版本号、把调用改成 window.xxx(...)；禁止在里面新增或修改业务逻辑，新功能写进 public/blocks/ 下的板块专属文件。
- 线上版/checks/ 是回归测试，线上版/notes/pipeline/ 是笔记生成脚本，build/ 是构建与板块版本工具（module-registry.json / module-hub.js）。
- 本地预览：在 线上版/ 下 npm start，它读的就是 public/，不是第二个网站。正式站点 https://liora-study-hall.app.workbuddy.host/ 。
- 根目录的 index.html / data.js 等历史本地版已于 2026-11-05 退役、移入归档/，只作查阅，绝不编辑，更不要整目录复制回来覆盖。

【绝对红线】
1. 账号、密钥、用户进度绝不入库：auth.json、ai_config.json、ai_acl.json、ai_provider.json、state.json、u_*.json、board-*.json、accounts.json、线上版/data/ 只存在本机，.gitignore 已全局排除。代码里只能「读取」这些配置，不能写入真实值。
2. 这个仓库现在是公开的，所有分支的全部历史都对外可见。任何新代码、注释、文档、提交信息里都不要出现真实密钥、账号、密码、个人信息或私有链接。
3. 仓库里含 UNSW 课件与若干书籍 PDF，属于个人学习资料，不要对外分发或另作他用。
4. 严禁整目录复制覆盖；可能有多个 AI 同时改不同文件，只改自己负责的板块。
5. 大文件提醒：线上版/public/data.js ≈ 6.8MB、reading-data.js ≈ 12.4MB，另有大量 PDF / 图片。改动前先确认目标，别整体重写。

【当前状态 · 2026-11-22】
- 默认分支 feat/bilingual-video-config（HEAD 即本次交接提交）是本机最新工作状态：含双语视频配置、备考中心、注册/会员/AI 控制台、板块化 CSS/JS、文档与排查记录。
- 远端 main（b2bd54c8）是另一条独立历史线，是另一个 AI 合并的「重写学习笔记」，与默认分支没有共同祖先。两条线并存，我没有覆盖它。若将来要合并，必须先问我，再用 git merge --allow-unrelated-histories 逐文件处理冲突。
- docs/ 下的 QA 实验大目录（约 9.6GB）、发布快照（含旧 auth.json）、.workbuddy/ 本机工具数据都没有入库，别在本地之外找它们。
- 另有一个独立产品「知跃」（AI英语教学自动化系统/）曾被照搬过学习小屋 UI，但它被 .gitignore 排除、不在这个仓库里，与本次开发无关。

【协作方式】
- 用户自述「纯技术小白」：不要问技术选择题，技术决策你来拍板；交付时给能直接复制照做的最省心步骤，少术语、多步骤；改完说明改了哪些文件、怎么验证、怎么回退。
- 每次动手前 git status；改完跑 线上版/checks/ 里相关回归测试，再提交并推送到 feat/bilingual-video-config。
- 不确定某改动会不会影响正式站点时，先说明再动手。

【开工前请回复这三点】
1. 你读到的项目结构与唯一正式目录；
2. 你理解的 3 条最重要的红线；
3. 你打算从哪里开始（等我确认后再改代码）。
