# 笔记自动生成流程

目标：以后导入一本书或一门课的新一周资料，按统一规范自动生成笔记，经过程序校验后写入网站，不需要每次在开发环境里手工调整。

## 分工

| 环节 | 谁来做 | 为什么 |
|---|---|---|
| 读资料、写讲解、列例题、给出核对式和图的规格 | AI 模型，按 `SPEC.md` | 需要理解内容 |
| 画函数图、韦恩图、网格；过账、结账、试算平衡表；排版 | `render.js` | 程序画图、算账不会出错，格式统一 |
| 检查是否漏题、答案能否复算、账是否平衡、来源是否规范 | `validate.js` | 任何模型写的内容都要过同一道关 |
| 写入网站 | 已有的板块覆盖接口 `/__api/boards/<板块>` | 不用重新打包 `data.js`，可随时回滚 |

## 一周的处理步骤

1. **取资料**：本周文件清单来自 `data.js` 里这一周的 `files`。PDF 抽取文字；含公式或图的页面同时渲染成图片，供能看图的模型使用（数学讲义的公式抽成文字后经常错位）。
2. **第一轮：列清单**。让模型只做一件事：列出资料里每一道例题、练习题的编号和页码，以及每页讲的知识点。结果存为 `inventory`。
   同时由程序（`extract.js`，不经过模型）从 Tutorial Guide、讲义的文字里提取「每道题要交什么」：模板里列出的账户、要不要分析表、分录表、试算表、要不要作图、有哪些小问，存为 `原文要求.json`。模型写的清单要与它逐项对上，防止「只答一半」。
3. **第二轮：写笔记**。把 `SPEC.md`、标准样例、资料和清单一起交给模型，输出 JSON。
4. **校验与修改**：运行 `validate.js`（带上 `--requirements`）。除了答案复算、账页平衡，还逐题核对交付物：清单写了要画的账户、要给的表、要答的小问，答案里缺一样就是错误。有错误就把错误原文发回模型修改，最多重试 3 次（防止无限消耗额度）；仍不通过则停下，交给人处理。
5. **写入**：渲染出 `graphicHtml`，通过 `/__api/boards/notes-<课程>`（数学是 `math-notes`）写入条目 `<term>/<week>` 的 `graphicHtml` 字段。旧内容留档，可以回滚。
6. **标记**：页面上标注「AI 生成，已通过自动核对」，人工抽查后去掉标记。

## 命令

```bash
npm run notes -- notes/weeks/mathematics/term2/w05.json /tmp/out.html --files L13_Basic_Probability.pdf,L14_Probability_Permutations_Combinations.pdf,L15_Union_Intersection_Complement.pdf
npm run notes -- notes/weeks/accounting/term1/w05.json /tmp/acct.html --requirements notes/weeks/accounting/term1/w05.requirements.json
node checks/server-regression.cjs
node checks/notes-pipeline.cjs
node notes/pipeline/build.js --check
```

完整的 `npm test` 需要正式目录的 `public/data.js` 和对应资料。在正式目录运行，并把站点数据留在原环境内。

## 导入正式网站

1. 在正式电脑读取项目规则，检查 `网站/线上版` 的当前版本与本地改动。合入评审通过的课程入口改动，保留正式目录的其他修复和数据。生成账页的样式在 `public/index.html` 的笔记表格样式区。
2. 校验 `notes/out/manifest.json`。每条记录用 `board` 和 `key` 定位一周，用 `fields` 指定要导入的字段。路径相对于 `notes/`，两个 `legacy` 条目也按清单读取。对照正式站点逐项检查课程、周次和现有字段，列出差异，再备份受影响的内容与 `data/board-<board>.json`。清单缺省的字段保留现值。
3. 用维护者现有的登录环境调用 `/__api/boards/<board>`。先 `GET` 读取 `entries` 和 `revision`，对存在且字段合法的条目以 `POST` 发送 `{ revision, changes: { "term1/5": { graphicHtml: "…" } } }`，设置 `Content-Type: application/json` 和 `X-Liora-Board: 1`。按请求的 UTF-8 字节数分批，单批小于 2 MiB。经济学须拆批。每批读取新 `revision` 并核对写入结果。遇到 409 要重新读回、检查同一字段有无并发修改再合并。遇到不存在的周次先核对路由。周次已核准但基线缺字段时，由维护者在正式数据源合入对应字段并检查既有覆盖值的优先级。
4. 先在维护者的预览环境抽查会计 T1 W5、经济学 T1 W4、数学 T2 W13。检查图文笔记、折叠答案、独立作业答案、填空复习、知识点归纳和手机表格。完整回归通过后，走正式站原有发布流程。用实际访问入口打开这些页面，再核对站上读取的字段与发布清单一致。若出错，按备份恢复受影响的内容和覆盖文件。

## 目前的状态

- 发布清单包含 62 周流水线产物和 2 周已核算的手工稿。会计渲染支持 T 形账户、多栏式账户、试算平衡表和财务报表。
- 六周会计笔记带有 `weeks/<课程>/<学期>/wNN.requirements.json`，可校验原文要求。其余生成校验的覆盖范围以各周的题目清单和核对式为准。
- 已有产物的导入不依赖模型。站点内的自动生成入口、模型和审核机制仍待维护者决定。
