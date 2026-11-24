# Liora 的学习小屋 · Codex / WorkBuddy 协作开发规范

> 这份手册给 **Codex / WorkBuddy / 任何后续接手改代码的 AI 助手** 看，直接发给它就能保证不改坏现有线上版、不丢功能、不泄露密钥。

---

## 一、给 Codex 上传「每日简报原文」到英语素材库的专属指令

以后你让 **Codex** 把每日简报原文同步到 `线上版/public/english/data/daily-brief-articles.json` 时，**直接把下面这段话复制发给它**：

```text
请把新的每日简报原文追加到 线上版/public/english/data/daily-brief-articles.json 的 articles 数组中。
英语学习工作台已经做成 100% 离线免 AI 模式，所以每篇新文章除了原有的 id / originalUrl / source / topic / title / level / paragraphs 字段外，请务必在同一篇文章对象里同时生成并写入 localCache 字段（不要让前端调用 AI）：

"localCache": {
  "words": {
    "单词小写原形": "词性. 中文释义；常见搭配：..."
  },
  "analyze": {
    "完整英文原句（与 paragraphs 中一致）": "1. 中文翻译：...\n2. 句子主干与结构：...\n3. 核心词汇与搭配：..."
  }
}

要求：
1. analyze 必须覆盖该文章 paragraphs 里的每一句核心英文长难句（尤其是每段主旨句和 20 词以上的从句）。
2. words 补充该文中的专业术语/超纲学术词（常用词已由本地 9389 词 ielts-words.js 兜底）。
3. 改完后只在分支 feat/bilingual-video-config 提交推送，不要碰其他页面和 Cloudflare 配置文件。
```

**原理说明**：前端 `english/js/app.js` 和 `english/js/modules.js` 已自动识别 `article.localCache`，文章一旦打开就会自动注册到 `window.LIORA_LOCAL_CACHES[article.id]`，支持**整句/半句划选离线翻译、离线长难句解析、离线点词查词**，完全不依赖 AI 密钥。

---

## 二、后续用 Codex / WorkBuddy 修改功能时的 6 条必守铁律

1. **只改唯一正式目录**：只编辑 `线上版/` 里的文件，不要去动仓库根目录的归档/旧文件夹。
2. **只在同一分支开发**：永远基于当前分支 `feat/bilingual-video-config` 先 `git pull` 再改，不要随意切 `main` 或强制覆盖。
3. **改完 JS / CSS 必须升级 `?v=` 版本号**：HTML 中引用了改动的 `.js` / `.css` 文件时，把后面的 `?v=20261123-v12` 改成更新的日期版本号，避免浏览器缓存旧文件。
4. **绝不提交任何密码/密钥/用户数据**：禁止提交 `线上版/data/`、`线上版/.cloudflare/`、`.dev.vars`、`auth.json`、`ai_config.json` 或管理员密码明文/哈希（GitHub 仓库是公开的，所有管理员密钥只存在 Cloudflare 加密环境变量里）。
5. **改完一定要跑测试与视觉自检**：在 `线上版/` 目录下运行 `npm test`（6 套测试必须 100% 通过），确认零 JS 报错再推送。
6. **上线到 Cloudflare 的 2 行标准命令**（在有 Cloudflare 登录态的电脑上进入 `线上版/` 执行）：
   ```bash
   node scripts/build-cf-output.mjs --kv-id 65e3a9a7f93f4a6b8367606804f874da
   cloudflare deploy --prebuilt
   ```
   > 提示：不要动 `线上版/cloudflare/worker.js` 里的 KV key 前缀（`users:registry`、`state:<uid>`、`study:<uid>`），否则会影响已有账号的数据隔离与云端存档。
