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
3. **第二轮：写笔记**。把 `SPEC.md`、标准样例、资料和清单一起交给模型，输出 JSON。
4. **校验与修改**：运行 `validate.js`。有错误就把错误原文发回模型修改，最多重试 3 次（防止无限消耗额度）；仍不通过则停下，交给人处理。
5. **写入**：渲染出 `graphicHtml`，通过 `/__api/boards/notes-<课程>`（数学是 `math-notes`）写入条目 `<term>/<week>` 的 `graphicHtml` 字段。旧内容留档，可以回滚。
6. **标记**：页面上标注「AI 生成，已通过自动核对」，人工抽查后去掉标记。

## 命令

```bash
npm run notes -- notes/pipeline/examples/mathematics-term2-w5.json /tmp/out.html --files L13_Basic_Probability.pdf,L14_Probability_Permutations_Combinations.pdf,L15_Union_Intersection_Complement.pdf
npm test   # 包含 checks/notes-pipeline.cjs：错答案、漏题、不平的账都必须被拦下
```

## 正式目录的待审流程

主人登录后从板块更新页打开「学习笔记待审」（`/notes-review.html`）。生成只保存待审稿，点击发布才写入该周的板块覆盖，并将旧笔记存到 `data/notes-review/`。若该周正式笔记在生成开始后有变动，发布会拒绝覆盖。

服务器需要 Python 和 PyMuPDF，以及本周 files 指向的原始 PDF。Windows 默认调用 python，其他环境可设置 NOTES_PYTHON。公式或图示候选页独立栅格化为图片，与带页码的提取文字一起供模型使用。部署环境也需要具备这些依赖及原文件。

从 ai_config.json 读取现有模型。带图片的资料需要先实测当前 API 识图成功，再将 notes_vision_verified 设置为确切的 model 值。每次生成最多发出五次请求，清单一次、初稿一次、校验失败后的修改最多三次。失败不会发布或替换已有待审稿。
