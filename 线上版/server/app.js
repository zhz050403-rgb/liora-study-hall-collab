/* Liora 学习小屋 · 主应用路由器（组合各服务端模块，零第三方依赖） */
'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const { loadConfig } = require('./config');
const { createStorage } = require('./storage');
const { createCache } = require('./cache');
const { createAuth } = require('./auth');
const { createStudyStore } = require('./study-store');
const { createAIService } = require('./ai');
const { createBoardsService } = require('./boards');
const { createStaticHandler } = require('./static');
const { renderLoginPage } = require('./login-page');
const { send, json, readBody, apiBody, guardApi } = require('./http-utils');

function createApp(opts) {
  const f = (opts && opts.fs) || fs;
  const config = loadConfig(opts && opts.env);
  const storage = createStorage(f);
  const cache = createCache({ fs: f, pub: config.pub });
  const accountsFactory = (opts && opts.accountsFactory) || require('../accounts/service');
  const auth = createAuth({ fs: f, config, accountsFactory });
  const studyStore = createStudyStore({ storage, dataDir: config.dataDir });
  const ai = createAIService({ fs: f, config, auth, storage });
  const boards = createBoardsService({ fs: f, config, storage, cache, loadAICfg: ai.loadAICfg });

  /* ---------- 每账号学习进度存储（u_<user>.json） ---------- */
  function statePath(u) {
    const safe = String(u || '').replace(/[^A-Za-z0-9_.@-]/g, '_');
    return path.join(config.dataDir, 'u_' + safe + '.json');
  }
  function readState(u) {
    const o = storage.readJson(statePath(u), null);
    return o && typeof o === 'object' ? o : { updatedAt: 0, data: {} };
  }
  function writeState(u, obj) {
    storage.writeJsonAtomic(statePath(u), obj);
  }
  function sanitizeData(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
    const out = {};
    for (const k of Object.keys(d)) {
      if (!config.keyRe.test(k) || typeof d[k] !== 'string' || d[k].length > 400000) continue;
      out[k] = d[k];
      if (Object.keys(out).length > 80) break;
    }
    return out;
  }

  const staticHandler = createStaticHandler({
    fs: f,
    config,
    auth,
    cache,
    readState,
    studyStore
  });

  /* ---------- 注册 / 角色 / 积分 / AI 领票 ---------- */
  async function handleRegister(req, res, ip) {
    if (auth.rateLimited(ip)) return json(res, 429, { ok: false, error: '操作太频繁，请稍等 1 分钟再试' });
    if (!guardApi(auth, req, res)) return;
    const b = await apiBody(req, 4096);
    if (!b) return json(res, 400, { ok: false, error: '请求内容无法解析' });
    const r = auth.accounts.register(b);
    if (!r.ok) { auth.noteFail(ip); return json(res, 400, { ok: false, error: r.error }); }
    auth.clearFail(ip);
    ai.aiLog('REGISTER', req, r.phone, 'new user');
    return json(
      res,
      200,
      { ok: true, user: r.phone, redirect: '/english/index.html' },
      { 'Set-Cookie': auth.sessionCookieHeader(r.phone) }
    );
  }

  function handleMe(req, res, cu) {
    const role = auth.roleOf(cu);
    return json(res, 200, {
      ok: true,
      user: cu,
      role,
      personalMode: config.personalMode,
      roleLabel: ({ admin: '管理员', premium: '高级会员', member: '会员', user: '用户', legacy: '账号' })[role] || '账号',
      accountStatus: auth.accounts.status(cu, role),
      canAdmin: role === auth.ROLES.ADMIN
    });
  }

  async function handleAdmin(req, res, cu, name) {
    if (auth.roleOf(cu) !== auth.ROLES.ADMIN) return json(res, 403, { ok: false, error: '仅管理员可使用' });
    if (name === '/__api/admin/accounts' && req.method === 'GET') {
      return json(res, 200, { ok: true, accounts: auth.accounts.list(), overview: auth.accounts.overview() });
    }
    if (req.method !== 'POST' || !guardApi(auth, req, res)) return json(res, 405, { ok: false, error: '不支持的请求' });
    const b = await apiBody(req);
    if (!b) return json(res, 400, { ok: false, error: '请求内容无法解析' });
    if (name === '/__api/admin/role') {
      const r = auth.accounts.setRole(String(b.key || ''), String(b.role || ''));
      ai.aiLog('ADMIN_ROLE', req, cu, String(b.key || '') + ':' + String(b.role || ''));
      return json(res, r.ok ? 200 : 400, r);
    }
    if (name === '/__api/admin/status') {
      const r = auth.accounts.setStatus(String(b.key || ''), String(b.status || ''));
      ai.aiLog('ADMIN_STATUS', req, cu, String(b.key || '') + ':' + String(b.status || ''));
      return json(res, r.ok ? 200 : 400, r);
    }
    if (name === '/__api/admin/remove') {
      const r = auth.accounts.remove(String(b.key || ''));
      ai.aiLog('ADMIN_REMOVE', req, cu, String(b.key || '') + (r.ok ? ':ok' : ':fail'));
      return json(res, r.ok ? 200 : 400, r);
    }
    return json(res, 404, { ok: false, error: 'unknown_action' });
  }

  async function handlePoints(req, res, cu, name) {
    const role = auth.roleOf(cu);
    if (name === '/__api/points/status' && req.method === 'GET') {
      return json(res, 200, Object.assign({ ok: true }, auth.accounts.status(cu, role)));
    }
    if (req.method !== 'POST' || !guardApi(auth, req, res)) return json(res, 405, { ok: false, error: '不支持的请求' });
    const b = await apiBody(req);
    if (!b) return json(res, 400, { ok: false, error: '请求内容无法解析' });
    let r;
    if (name === '/__api/points/words') r = auth.accounts.addWords(cu, role, b.n);
    else if (name === '/__api/points/claim') r = auth.accounts.claim(cu, role);
    else if (name === '/__api/points/redeem') r = auth.accounts.redeem(cu, role);
    else return json(res, 404, { ok: false, error: 'unknown_action' });
    return json(res, r.ok ? 200 : 400, r);
  }

  function handleAITicket(req, res, cu) {
    const role = auth.roleOf(cu);
    const st = auth.accounts.status(cu, role);
    if (role === auth.ROLES.ADMIN) return json(res, 200, { ok: true, unlimited: true, left: null });
    if (role !== auth.ROLES.PREMIUM && role !== auth.ROLES.MEMBER) {
      return json(res, 403, { ok: false, error: '当前身份暂不能使用 AI，请联系管理员调整' });
    }
    const left = typeof st.aiLeftCny === 'number' ? st.aiLeftCny : 0;
    if (left < config.cnyPerAiCall) {
      return json(res, 403, {
        ok: false,
        code: 'NO_QUOTA',
        error: role === auth.ROLES.MEMBER
          ? '今日 AI 额度不足，去「英语学习」背满 50 个单词领 10 积分，再兑换 0.01 元额度'
          : '今天的 0.1 元 AI 额度已用完，明天会自动恢复'
      });
    }
    auth.accounts.consume(cu, role, config.cnyPerAiCall);
    const after = auth.accounts.status(cu, role);
    ai.aiLog('AI_TICKET', req, cu, role + ' left=' + after.aiLeftCny);
    return json(res, 200, { ok: true, left: after.aiLeftCny, cost: config.cnyPerAiCall });
  }

  /* ---------- 个人学习核心闭环 API（错题/批注/番茄专注/成绩簿/闪卡/备份恢复） ---------- */
  async function handleStudyApi(req, res, cu, name) {
    if (name === '/__api/study' && req.method === 'GET') {
      const data = studyStore.readStudy(cu);
      return json(res, 200, Object.assign({ ok: true }, data));
    }
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method_not_allowed' });
    if (!guardApi(auth, req, res)) return;
    const b = await apiBody(req, 256 * 1024);
    if (!b) return json(res, 400, { ok: false, error: '请求内容无法解析' });

    let result;
    if (name === '/__api/study/mistakes') result = await studyStore.upsertMistake(cu, b);
    else if (name === '/__api/study/annotations') result = await studyStore.upsertAnnotation(cu, b);
    else if (name === '/__api/study/focus') result = await studyStore.logFocus(cu, b);
    else if (name === '/__api/study/grades') result = await studyStore.upsertGrade(cu, b);
    else if (name === '/__api/study/flashcards') result = await studyStore.updateFlashcard(cu, b);
    else return json(res, 404, { ok: false, error: 'unknown_study_endpoint' });
    return json(res, result.ok === false ? 400 : 200, result);
  }

  async function handleBackupApi(req, res, cu, name) {
    if (name === '/__api/backup/export' && req.method === 'GET') {
      const bundle = {
        schema: 'liora-study-hall-backup-v1',
        exportedAt: new Date().toISOString(),
        user: cu,
        state: readState(cu),
        study: studyStore.readStudy(cu)
      };
      const stamp = studyStore.beijingDay();
      return send(res, 200, JSON.stringify(bundle, null, 2), {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="liora-backup-${stamp}.json"`
      });
    }
    if (name === '/__api/backup/import' && req.method === 'POST') {
      if (!guardApi(auth, req, res)) return;
      const b = await apiBody(req, 4 * 1024 * 1024);
      if (!b || b.schema !== 'liora-study-hall-backup-v1') {
        return json(res, 400, { ok: false, error: '备份文件格式不正确（需为本系统导出的 JSON 备份）' });
      }
      if (b.state && b.state.data) {
        const clean = sanitizeData(b.state.data);
        if (!clean) return json(res, 400, { ok: false, error: '备份中的进度数据格式无效' });
        const cur = readState(cu);
        const now = Math.max(Date.now(), (cur.updatedAt || 0) + 1);
        writeState(cu, { updatedAt: now, data: clean });
      }
      if (b.study) {
        const r = await studyStore.importStudy(cu, b.study);
        if (r.ok === false) return json(res, 400, r);
      }
      return json(res, 200, { ok: true, restoredAt: Date.now() });
    }
    return json(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  /* ---------- 主请求处理入口 ---------- */
  async function handler(req, res) {
    let name, rawName, parsedUrl;
    try {
      parsedUrl = new URL(req.url, 'http://localhost');
      rawName = parsedUrl.pathname;
      name = decodeURIComponent(parsedUrl.pathname);
    } catch (e) {
      return send(res, 400, 'Bad request');
    }
    const ip = (req.socket && req.socket.remoteAddress) || 'unknown';

    if (name === '/__health') return json(res, 200, { ok: true, personalMode: config.personalMode });

    if (config.gonePaths.test(name)) {
      return send(res, 404, '<!doctype html><meta charset="utf-8"><title>404</title><body style="font-family:system-ui,-apple-system,sans-serif;padding:40px;color:#17365e;background:#f7fafd"><h2>这个文件已停用</h2><p>它已经从站点里移除。请从首页或导航重新进入。</p><p><a href="/">← 回到学习小屋</a></p></body>');
    }

    /* 公开路由：注册、登录、退出 */
    if (name === '/__api/register' && req.method === 'POST') return handleRegister(req, res, ip);
    if (name === '/__login' && req.method === 'GET') {
      return send(res, 200, renderLoginPage('', { personalMode: config.personalMode }));
    }
    if (name === '/__login' && req.method === 'POST') {
      if (auth.rateLimited(ip)) {
        const msg = '尝试次数过多，请稍等 1 分钟再试';
        if ((req.headers.accept || '').includes('application/json')) return json(res, 429, { ok: false, error: msg });
        return send(res, 429, renderLoginPage(msg, { personalMode: config.personalMode }));
      }
      let body = '';
      try { body = await readBody(req, 4096); } catch (e) { return json(res, 413, { ok: false }); }
      let u = '', p = '';
      try { const j = JSON.parse(body); u = j.u || ''; p = j.p || ''; }
      catch (e) { const q = new url.URLSearchParams(body); u = q.get('u') || ''; p = q.get('p') || ''; }
      u = String(u).trim();
      p = String(p).trim();
      const usr = auth.findUser(u);
      if (usr && auth.checkPass(usr, p)) {
        auth.clearFail(ip);
        auth.accounts.noteLogin(usr.user);
        const cookie = auth.sessionCookieHeader(usr.user);
        const dest = auth.roleOf(usr.user) === auth.ROLES.USER ? '/english/index.html' : '/';
        if ((req.headers.accept || '').includes('application/json')) {
          return json(res, 200, { ok: true, user: usr.user, ai: !!usr.ai, redirect: dest }, { 'Set-Cookie': cookie });
        }
        return send(res, 302, '', { Location: dest, 'Set-Cookie': cookie });
      }
      auth.noteFail(ip);
      const msg = '账号或密码不正确，请再试一次';
      if ((req.headers.accept || '').includes('application/json')) return json(res, 401, { ok: false, error: msg });
      return send(res, 401, renderLoginPage(msg, { personalMode: config.personalMode }));
    }
    if (name === '/__logout') {
      return send(res, 302, '', { Location: '/__login', 'Set-Cookie': auth.clearCookieHeader() });
    }

    /* 身份判定 */
    const cu = auth.userOf(auth.cookieOf(req));
    const curAI = !!(auth.findUser(cu) || {}).ai;

    if (cu && !curAI && config.ownerRe.test(name)) {
      return send(res, 403, '<!doctype html><meta charset="utf-8"><body style="font-family:system-ui,sans-serif;padding:40px;color:#17365e"><h2>该栏目仅限主人账号</h2><p>「课外拓展」仅主人账号（Liora）可见。如需查看，请切换为主人账号登录。</p><p><a href="/__logout">切换账号</a></p></body>');
    }

    if (config.publicAssetRe.test(name)) {
      return staticHandler.serveFile(req, res, name, rawName, cu);
    }

    if (!cu) {
      if (name.startsWith('/__api/') || name.startsWith('/api/')) {
        if (name === '/api/chat' || name === '/api/ai-info' || name.startsWith('/__api/ai/')) {
          ai.aiLog('DENY_ANON', req, '', name);
        }
        return json(res, 401, { ok: false, error: 'unauthorized' });
      }
      if (/\.(webp|png|jpe?g|svg|gif|ico|css|js|mjs|woff2?|webmanifest)$/i.test(name)) {
        return send(res, 401, 'Unauthorized');
      }
      const back = (req.url && req.url.startsWith('/') && !req.url.startsWith('//')) ? req.url : '/';
      return send(res, 302, '', { Location: '/__login?next=' + encodeURIComponent(back) });
    }

    /* 已登录 API（先于页面硬闸门） */
    if (name === '/__api/me' && req.method === 'GET') return handleMe(req, res, cu);
    if (name.startsWith('/__api/admin/')) return handleAdmin(req, res, cu, name);
    if (name.startsWith('/__api/points/')) return handlePoints(req, res, cu, name);
    if (name === '/__api/study' || name.startsWith('/__api/study/')) return handleStudyApi(req, res, cu, name);
    if (name.startsWith('/__api/backup/')) return handleBackupApi(req, res, cu, name);
    if (name === '/__api/ai/ticket' && req.method === 'POST') {
      if (!guardApi(auth, req, res)) return;
      return handleAITicket(req, res, cu);
    }

    /* 角色页面硬闸门 */
    const curRole = auth.roleOf(cu);
    if (curRole === auth.ROLES.USER && (name === '/' || name === '/index.html')) {
      return send(res, 302, '', { Location: '/english/index.html' });
    }
    if (!auth.pageAllowed(curRole, name)) {
      const isExtra = config.ownerRe.test(name) || name.toLowerCase().startsWith('/assets/extracurricular_imgs/');
      const title = isExtra ? '「课外拓展」暂未向你开放' : '这个页面暂未向你开放';
      const hint = isExtra
        ? '课外拓展仅管理员可见。'
        : (curRole === auth.ROLES.USER
          ? '你当前的身份是「用户」，只能使用「英语学习」。需要更多内容请联系管理员为你授权。'
          : '如需访问，请联系管理员。');
      return send(res, 403, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><body style="font-family:system-ui,'Microsoft YaHei',sans-serif;background:#f7fafd;color:#122e52;padding:40px;line-height:1.9">
<div style="max-width:520px;margin:auto;background:#fff;border:1px solid #d8e4f2;border-radius:14px;padding:30px">
<h2 style="margin-top:0">${title}</h2><p>${hint}</p>
<p style="color:#5c6f88">当前身份：${({ admin: '管理员', premium: '高级会员', member: '会员', user: '用户', legacy: '账号' })[curRole] || '账号'}</p>
<p><a href="/english/index.html" style="color:#1c4375">去英语学习 →</a> · <a href="/__logout" style="color:#1c4375">切换账号</a></p></div></body></html>`);
    }

    if (name === '/admin.html' && curRole !== auth.ROLES.ADMIN) {
      return send(res, 403, '<!doctype html><meta charset="utf-8"><body style="font-family:system-ui,sans-serif;padding:40px;color:#122e52"><h2>仅管理员可进入</h2><p><a href="/">返回学习小屋</a></p></body>');
    }

    if (name === '/notes-review.html' || name === '/notes-review.js' || name === '/__api/notes-pipeline') {
      if (!curAI) return json(res, 403, { error: 'owner_only' });
      if (name === '/__api/notes-pipeline') return boards.handleNotesPipeline(req, res, parsedUrl);
    }

    if (name === '/ai-console.html') {
      if (!ai.isAIOwner(cu)) { ai.aiLog('DENY_CONSOLE', req, cu, ''); return json(res, 403, { error: 'owner_only' }); }
    }

    if (name.startsWith('/__api/boards/')) {
      if (!curAI) return json(res, 403, { error: 'owner_only' });
      const board = name.slice('/__api/boards/'.length);
      if (!Object.hasOwn(boards.BOARDS, board)) return json(res, 404, { error: 'unknown_board' });
      return boards.handleBoard(req, res, board);
    }
    if (name === '/board-editor.html' && !curAI) return json(res, 403, { error: 'owner_only' });
    if (name === '/board-overrides.js' && req.method === 'GET') {
      return boards.serveBoardOverridesJs(res, curAI);
    }

    /* 付费 AI 统一服务端代理闸门 */
    const AI_PATHS = ['/api/chat', '/api/ai-info', '/__api/ai/status', '/__api/ai/config', '/__api/ai/chat', '/__api/ai/logs'];
    if (AI_PATHS.includes(name)) {
      const uid = ai.aiAuthorize(req, res, cu);
      if (!uid) return;
      if (name === '/api/ai-info' && req.method === 'GET') {
        const cfg = ai.loadAICfg();
        return json(res, 200, { ready: !!(cfg && cfg.api_key), model: cfg ? cfg.model : '' });
      }
      if ((name === '/api/chat' || name === '/__api/ai/chat') && req.method === 'POST') {
        return ai.handleAIChat(req, res, cu, uid);
      }
      if (name === '/__api/ai/status' && req.method === 'GET') return ai.handleAIStatus(req, res, uid);
      if (name === '/__api/ai/logs' && req.method === 'GET') return ai.handleAILogs(req, res, uid);
      if (name === '/__api/ai/config' && req.method === 'POST') return ai.handleAIConfig(req, res, cu, uid);
      return json(res, 405, { ok: false, error: 'method_not_allowed' });
    }

    /* 学习进度云端同步 */
    if (name === '/__api/state' && req.method === 'GET') {
      const s = readState(cu);
      return json(res, 200, { ok: true, updatedAt: s.updatedAt || 0, data: s.data || {}, user: cu, ai: curAI });
    }
    if (name === '/__api/state' && req.method === 'POST') {
      let body = '';
      try { body = await readBody(req, 2 * 1024 * 1024); } catch (e) { return json(res, 413, { ok: false }); }
      let payload;
      try { payload = JSON.parse(body); } catch (e) { return json(res, 400, { ok: false }); }
      const data = sanitizeData(payload.data);
      if (!data) return json(res, 400, { ok: false });
      const fp = statePath(cu);
      return storage.withFileLock(fp, () => {
        const cur = readState(cu);
        const now = Math.max(Date.now(), (cur.updatedAt || 0) + 1);
        if (payload.base != null && Number(payload.base) !== (cur.updatedAt || 0)) {
          return json(res, 409, { ok: false, conflict: true, updatedAt: cur.updatedAt, data: cur.data });
        }
        try { writeState(cu, { updatedAt: now, data }); } catch (e) { return json(res, 500, { ok: false }); }
        return json(res, 200, { ok: true, updatedAt: now });
      });
    }

    if (name === '/') name = '/index.html';
    return staticHandler.serveFile(req, res, name, rawName, cu);
  }

  return { handler, config, auth, studyStore, storage };
}

module.exports = { createApp };
