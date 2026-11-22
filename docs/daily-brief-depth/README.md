# 每日简报：深度稿件流程

正式页面使用静态 `details.reading-card`。Codex 定时任务负责查资料和写稿；页面的 JS 负责排序、搜索、分类、展开和空状态，未改动。服务器给现有 JS/CSS 使用长缓存，这次没有修改这些资产，无需升版本号。

## 日常生成

1. 读正式目录的 AGENTS.md 和简报；同时查已生成稿件以避开重复来源。近 14 个自然日含当天。优先读原作者或出版商全文，核对首次发布日期，记录数字对应的图表或章节。新闻、行业报告注明数据口径和时间点；定量论文优先写样本、比较条件和可核对的关键数字。
2. 参考 examples.json 写一个对象：`edition`（北京时间日期）、`published`（原文日期）、`title`（英文原名）、`category`（一个主题）、`source`、`url`、`access`（开放获取/免费阅读/付费墙）、`sourceNote`（证据位置）、可选 `alternates`（由 `url`、`label` 构成）。`sections` 中七个键各是一组纯文本段落：`conclusion`、`background`、`method`、`findings`、`limits`、`application`、`practice`。决策要解释推理链、适用条件和其他解释。实践写清10–20分钟步骤、产物和标准；金融只做纸上练习。
3. 中文正文按汉字计600–1000字，不计标题、来源、数字、标点及链接。必要时可超长，并在 `longReason` 记录理由。程序验证结构、长度、日期、单主题、重复与安全转义；内容真实性和证据强度仍由写稿者负责。
4. 从 `网站/` 运行 `node docs/daily-brief-depth/generate.cjs edition build/daily-brief-drafts/YYYY-MM-DD.json`。输出 `build/daily-brief-drafts/YYYY-MM-DD.html`。生成器只读现有页面，不将任何文件写入 WorkBuddy 监听目录。若正式页已有同日或同链接，停止追加。预览文件是审阅工件，不应用过期预览覆盖最新正式源码。

## 本次验收

`node docs/daily-brief-depth/generate.cjs preview docs/daily-brief-depth/examples.json` 只在审阅产物中扩写三篇，保留其标题、期号、来源和排序，其余历史不改。

`node docs/daily-brief-depth/check.cjs` 校验正文扩写和模拟新一期，输出 `build/daily-brief-drafts/browser-check.html` 和 `mobile-check.html`。浏览器探针使用真实简报 JS/CSS，隔离账号与联网脚本；打开后可查看 body 的 `data-test-result`。该探针不验证全站登录或云同步。

当前阶段不发布。恢复原定时行为或进入上线阶段，应先取得发布授权，再通过 Codex 的自动化面板调整原有任务；保留现有 WorkBuddy 应用和用户数据。
