# 学习小屋项目规则

所有为本项目生成、复制或导出的文件都必须放在 `C:\Users\Liora\Desktop\新南2026\网站` 或其子目录内。此规则适用于代码、图片、截图、压缩包、备份、构建产物和中间文件。

开始工作前，将工作目录和输出路径设到「网站」目录内。需要临时文件时，在「网站」下建立任务专用子目录。调用工具前确认其输出位置可设在该范围内。如果工具必定先在目录外生成文件，不要调用，改用可直接输出到项目内的方法。


## 正式网站与唯一维护入口（单来源铁律）

- 唯一正式站点：`https://liora-study-hall.app.workbuddy.host/`，访问用现有 WorkBuddy 分享链接。
- **唯一正式项目目录：`网站/线上版/`。无论 WorkBuddy、Codex 还是任何其他 AI 接手，都必须只打开并编辑这个目录** —— 网页/样式/客户端功能改 `线上版/public/`，服务端改 `线上版/server.js`。不要去改上一级的历史本地版。
- 历史本地版（`网站/index.html`、`网站/data.js` 及旧启动脚本）已于 2026-11-05 退役，整体移入 `网站/归档/根目录历史版-20261105/`，仅作历史查阅，**不再编辑、不再发布**。
- 「更新门户」脚本（`build/update_portal.py` → `build/build_data.py`）现在**直接输出到 `网站/线上版/public/data.js`**，不再生成根目录那份。跑完脚本后只需在 WorkBuddy 应用点「更新发布」即可，不要把文件从根目录搬到线上版。
- 本地测试后，在现有 WorkBuddy 应用执行「更新发布」，用原网址核对。沿用现有应用，不新建平行部署。网址是访问入口，发布目录才是编辑入口。
- 保留线上账号配置与持久化进度：更新时**严禁**用历史本地版覆盖 `线上版/auth.json` 或 `线上版/data/state.json`。归档仅用于查历史。

## 板块化与自动发布（2026-11-06 起，优先级高于上面的旧表述）

完整规则见 `线上版/AGENTS.md`，给主人看的说明见 `网站/板块与版本说明.md`。要点：

- 主人已长期授权：**改完直接「更新发布」，不需要再问、不需要等确认**（覆盖「需确认才发布」的旧规矩）。发布前先跑版本留档并检查 `线上版/checks/backups`。
- Codex / ChatGPT 与 WorkBuddy 可同时改不同板块。所有 AI 改的是同一目录里**不同的文件**，发布读磁盘当前状态，不会互相覆盖；**严禁整目录复制覆盖**。
- `public/index.html` 是共享骨架：只允许改引用行、`?v=` 版本号、把调用改成 `window.xxx(...)`；**禁止在里面新增或修改业务逻辑**，新功能写进板块专属文件。
- 板块注册表 `网站/build/module-registry.json`，版本工具 `网站/build/module-hub.js`：`auto "说明"` 自动留档、`rollback <板块> <版本ID>` 只回退一个板块、`list` 查历史。旧版本永久保留在 `网站/归档/板块版本/`。
- `auth.json`、`data/state.json`、`data/u_*.json`、`data/board-*.json` 永不覆盖、不进快照、不参与回退。

## 只有一个网站 / Codex 直接发布权（2026-11-07 主人再次强调）

- 正式网站只有一份：`线上版/public/` → `https://liora-study-hall.app.workbuddy.host/?sharecode=L4NKT6REQ6`。
- **`http://localhost:3000/` 不是第二个网站**：`npm start` 起的本地服务读的就是 `线上版/public/`（`server.js` 里 `PUB = path.join(ROOT,'public')`），只是同一份文件在本机浏览器里的临时预览窗口，用于浏览器验收。严禁另建「本地版」、复制副本、或从归档/快照整目录拷回来覆盖。
- **Codex / ChatGPT 与 WorkBuddy 拥有同等的直接修改、直接发布权限**：改完直接更新发布，不用等主人说「发布」、不用先问 WorkBuddy；发布复用 appId `wbapp_rBWn4x6EKZDM20OKLiy9jd` 与域名 `liora-study-hall`。若其环境没有发布能力，落盘即可，WorkBuddy 每次对话会自动检查 `module-hub.js status` 并把未发布改动推上线。
