# 学习小屋笔记重写 · 进度

格式（2026-11-11 用户确认）：每个知识点「概念 → 图 → 课件例题（解答折叠在「看解答」里）→ 易错 → 常见疑惑」，周末附解题流程表。
例题全部用讲义原题，英文题干保留；每周答案用 checks/ 下的脚本独立重算。
输出是网站 graphicHtml 片段（h4.kp-h / p.kp-src / .callout / .formula / .frac / .diagram / details），由原电脑导入 data.js。
本文件夹不放课件原文。笔记放在协作仓库的 `notes/` 文件夹、分支 `claude/notes-rewrite`；用户同意先公开，之后再把仓库改成私有。

当前交付范围以 `out/manifest.json` 为准，共 64 周。

| 课程 | 学期及周次 |
|---|---|
| 会计 | T1 W1–W13 |
| 经济学 | T1 W1–W12、T2 W1–W13 |
| 数学 | T1 W1–W13、T2 W1–W13 |

其中 62 周由流水线生成，数学 T1 W5、W6 使用原核算过的手工稿。清单中 34 周另有作业答案。生成校验和正式站回归分别执行，站点导入步骤见 [流水线说明](pipeline/README.md#导入正式网站)。

以下保留早期样稿和逐题核算记录。

| 课程 | 周 | 状态 | 例题数 | 核算 | 备注 |
|---|---|---|---|---|---|
| 数学 T2 | W5 概率基础 | 完成（样稿） | 22 | 20 项全部通过 | 用户已确认格式 |
| 数学 T1 | W5 对数图像、定义域与分段函数、用图像解题 | 完成 | 33 | 36 项全部通过；13 张图已渲染目视检查 | 讲义印刷问题：L14 例 14 第二段应为 x > 2；L15 例 2 无 (e) |
| 数学 T1 | W6 经济应用、指数对数模型、前半段复习 | 完成 | 31 | 21 项全部通过；15 张图已渲染目视检查 | 本周有课堂测验 |
| 会计 T1 | W5 T 形账户：过账、结账、试算平衡表 | 完成（流水线生成） | 17 | 36 项全部通过；交付物逐题核对，与原文要求交叉核对通过 | 原手写版漏了 Q1 的 Office Furniture、Loan，Thor、Lois 只有汇总表，Ben 缺分析表；现由 `weeks/accounting/term1/w05.json` 生成，所有表齐全。讲义问题：5b 练习把预收现金记在现金贷方；Lois Lane 6/1 分录 7000 应为 7300；Alex Roger 分录多一笔交易清单里没有的工资 1500；Ben 试算表模板漏 Rent Expense；Worksheet 4 缺交易数据 |

## 生成方式

- 在 `notes/` 目录下运行。`math/term1/w05.src.html` 是正文模板，图用 `<!--FIG:名字-->` 占位；`python3 checks/math_t1_w05.py` 生成图、组装成 `w05.html` 并核算答案。
- 函数图由 `checks/svgplot.py` 按真实函数采样生成；读图题的曲线按讲义图上的关键点插值，图注写明是示意图。
- 当前学期：Term 1 第 5 周（2026-11-09 至 11-15）。顺序：数学 T1 W5、W6（测验周），再做会计、经济学的当前周，之后逐周往后。

- 会计 T1 W5 改为流水线生成：`python3 checks/make_acct_t1_w05_json.py` 写出 JSON，`node pipeline/cli.js weeks/accounting/term1/w05.json accounting/term1/w05.html --requirements weeks/accounting/term1/w05.requirements.json` 校验并输出。旧的 `accounting/term1/w05.src.html` 和 `checks/acct_t1_w05.py` 只作参考，不要再运行（会覆盖成旧的不完整版本）。
