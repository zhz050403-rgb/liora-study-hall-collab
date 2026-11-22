/* AI 主人授权、服务端代调、配额与安全日志、常驻学生档案注入 */
'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
const { json, readBody } = require('./http-utils');

const AI_DEFAULT_LIMITS = {
  maxQuestionChars: 4000,
  maxContextChars: 1800,
  maxHistoryItems: 8,
  maxHistoryChars: 8000,
  maxOutputTokens: 1500,
  timeoutMs: 45000,
  perMinute: 8,
  perDay: 80,
  maxConcurrent: 2,
  dailyChars: 150000,
  monthlyBudgetCny: 20,
  estimateInputPer1MTokensCny: 2,
  estimateOutputPer1MTokensCny: 8
};

const AI_SYSTEM_PROMPT =
  '你是 UNSW 预科学生的私人学习伴学助手（学生母语为中文，课程为英文授课）。\n' +
  '工作方式：\n' +
  '1. 优先用苏格拉底式引导：先用一个简短的问题确认学生的理解卡在哪里，再给解释；学生明确要答案或切换到「直接解答」模式时直接给完整答案。\n' +
  '2. 所有专业术语保留英文原词，并紧跟中文解释（如 Accrual basis（权责发生制））。\n' +
  '3. 涉及计算题必须给完整步骤和数值，不能只给结论。\n' +
  '4. 用简洁的分点表达，别写长篇大论；重要结论用加粗。\n' +
  '5. 不确定的内容要说明不确定，绝不编造课件里没有的事实。';

const MODE_INSTRUCTIONS = {
  socratic: '当前模式【苏格拉底引导】：先定位卡点、给提示，再逐步拆解。',
  direct: '当前模式【直接完整解答】：直接给出清晰定义、完整计算/推导步骤、最终答案与避坑提醒。',
  grade: '当前模式【作业批改入档】：请先逐题指出对错与错误类型（知识漏洞/计算/审题/英文表达），在回答末尾另起一行输出 JSON 摘要块（```grade-json ... ```），包含字段 course, title, score, maxScore, sourceType("ai_estimate" 或 "practice"), weakPoints(数组), errorTags(数组), summary，方便前端一键存入学习档案。'
};

function createAIService(opts) {
  const f = opts.fs || fs;
  const config = opts.config;
  const auth = opts.auth;
  const storage = opts.storage;

  const AI_ACL_FILE = path.join(config.root, 'ai_acl.json');
  const AI_PROVIDER_FILE = path.join(config.root, 'ai_provider.json');
  const AI_USAGE_FILE = path.join(config.dataDir, 'ai-usage.json');
  const AI_LOG_FILE = path.join(config.dataDir, 'ai-security.log');

  function readJsonSafe(p, fallback) {
    try {
      const v = JSON.parse(f.readFileSync(p, 'utf8'));
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function loadAICfg() {
    const c = readJsonSafe(AI_PROVIDER_FILE, null);
    if (!c || c.disabled || !c.api_key || !c.base_url || !c.model) return null;
    return c;
  }

  function loadAIAcl() {
    const a = readJsonSafe(AI_ACL_FILE, {});
    return {
      ownerUids: Array.isArray(a.ownerUids) ? a.ownerUids.map(String) : [],
      providers: Array.isArray(a.providers) ? a.providers : [],
      limits: Object.assign({}, AI_DEFAULT_LIMITS, (a && a.limits) || {})
    };
  }

  function aiUidOf(cu) {
    const u = auth.findUser(cu);
    return (u && u.uid && u.ai === true) ? String(u.uid) : null;
  }

  function isAIOwner(cu) {
    const uid = aiUidOf(cu);
    if (!uid) return false;
    const acl = loadAIAcl();
    return acl.ownerUids.includes(uid);
  }

  function aiLog(kind, req, cu, detail) {
    const rec = {
      t: new Date().toISOString(),
      kind,
      ip: String((req && req.socket && req.socket.remoteAddress) || '').slice(0, 64),
      user: String(cu || '').slice(0, 40),
      detail: String(detail || '').slice(0, 160)
    };
    try {
      storage.ensureDir(config.dataDir);
      if (typeof f.appendFileSync === 'function') {
        f.appendFileSync(AI_LOG_FILE, JSON.stringify(rec) + '\n');
      }
    } catch (e) {}
  }

  function aiAuthorize(req, res, cu) {
    if (!cu) {
      aiLog('DENY_ANON', req, '', '');
      json(res, 401, { ok: false, error: '请先登录' });
      return null;
    }
    const uid = aiUidOf(cu);
    if (!uid || !loadAIAcl().ownerUids.includes(uid)) {
      aiLog('DENY_NON_OWNER', req, cu, uid || 'no-uid');
      json(res, 403, { ok: false, error: '该功能仅限主人账号' });
      return null;
    }
    return uid;
  }

  function aiDay() { return new Date().toISOString().slice(0, 10); }
  function aiMonth() { return new Date().toISOString().slice(0, 7); }

  function aiUsageOf(uid) {
    const all = storage.readJson(AI_USAGE_FILE, {});
    const safeAll = (all && typeof all === 'object') ? all : {};
    const d = aiDay();
    const m = aiMonth();
    let u = safeAll[uid];
    if (!u || typeof u !== 'object') u = {};
    if (u.day !== d) { u.day = d; u.dayCalls = 0; u.dayChars = 0; u.minute = []; }
    if (u.month !== m) { u.month = m; u.monthCalls = 0; u.monthInTokens = 0; u.monthOutTokens = 0; u.monthCostCny = 0; }
    u.minute = Array.isArray(u.minute) ? u.minute.filter(t => Date.now() - t < 60000) : [];
    ['dayCalls', 'dayChars', 'monthCalls', 'monthInTokens', 'monthOutTokens', 'monthCostCny', 'totalCalls'].forEach(k => {
      if (typeof u[k] !== 'number') u[k] = 0;
    });
    return { all: safeAll, u };
  }

  function aiQuotaCheck(uid, chars, L) {
    const q = aiUsageOf(uid);
    const u = q.u;
    if (u.minute.length >= L.perMinute) return { ok: false, code: 'RATE_MINUTE', msg: '每分钟调用次数已达上限，请稍等一会儿' };
    if (u.dayCalls >= L.perDay) return { ok: false, code: 'RATE_DAY', msg: '今日调用次数已达上限' };
    if (u.dayChars + chars > L.dailyChars) return { ok: false, code: 'QUOTA_DAY_CHARS', msg: '今日输入字数额度已用完' };
    if (u.monthCostCny >= L.monthlyBudgetCny) return { ok: false, code: 'BUDGET_MONTH', msg: '本月预算已达上限，调用已阻断' };
    return { ok: true, all: q.all, u };
  }

  const aiRunning = new Map();
  function aiAcquire(uid, max) {
    const n = aiRunning.get(uid) || 0;
    if (n >= max) return false;
    aiRunning.set(uid, n + 1);
    return true;
  }
  function aiRelease(uid) {
    const n = aiRunning.get(uid) || 1;
    if (n <= 1) aiRunning.delete(uid);
    else aiRunning.set(uid, n - 1);
  }

  function aiObserveSse(text, st) {
    st.buf += text;
    let i;
    while ((i = st.buf.indexOf('\n')) >= 0) {
      const line = st.buf.slice(0, i);
      st.buf = st.buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const j = JSON.parse(raw);
        if (j.usage) {
          st.inTokens = j.usage.prompt_tokens || st.inTokens;
          st.outTokens = j.usage.completion_tokens || st.outTokens;
          st.gotUsage = true;
        }
        const ch = j.choices && j.choices[0];
        const d = ch && (ch.delta || ch.message);
        if (d && typeof d.content === 'string') st.outChars += d.content.length;
      } catch (e) {}
    }
  }

  function aiSettle(uid, st, chars, L) {
    return storage.withFileLock(AI_USAGE_FILE, () => {
      const fresh = aiUsageOf(uid);
      const u = fresh.u;
      const inT = st.gotUsage ? st.inTokens : Math.ceil(chars / 4);
      const outT = st.gotUsage ? st.outTokens : Math.ceil(st.outChars / 4);
      const cost = (inT / 1e6) * L.estimateInputPer1MTokensCny + (outT / 1e6) * L.estimateOutputPer1MTokensCny;
      u.dayCalls += 1;
      u.dayChars += chars;
      u.monthCalls += 1;
      u.monthInTokens += inT;
      u.monthOutTokens += outT;
      u.monthCostCny = Math.round((u.monthCostCny + cost) * 1e6) / 1e6;
      u.totalCalls += 1;
      u.minute.push(Date.now());
      u.lastAt = Date.now();
      fresh.all[uid] = u;
      try { storage.writeJsonAtomic(AI_USAGE_FILE, fresh.all); } catch (e) {}
      return { inT, outT, cost };
    });
  }

  function aiMaskKey(k) { return String(k || '').slice(0, 3) + '****' + String(k || '').slice(-4); }

  function aiSaveProvider(p) {
    storage.writeJsonAtomic(AI_PROVIDER_FILE, p, { pretty: true, mode: 0o600 });
  }

  let _pcCache = { mtime: 0, text: '' };
  function loadProfileContext() {
    try {
      const p = path.join(config.root, 'profile-context.md');
      const st = f.statSync(p);
      if (st.mtimeMs !== _pcCache.mtime) {
        _pcCache = { mtime: st.mtimeMs, text: f.readFileSync(p, 'utf8').trim() };
      }
      return _pcCache.text;
    } catch (e) {
      return '';
    }
  }

  function handleAIStatus(req, res, uid) {
    const cfg = loadAICfg();
    const acl = loadAIAcl();
    const q = aiUsageOf(uid);
    const u = q.u;
    return json(res, 200, {
      ok: true,
      owner: true,
      ready: !!(cfg && cfg.api_key),
      provider: cfg ? (cfg.provider || '') : '',
      model: cfg ? cfg.model : '',
      keyMasked: cfg ? aiMaskKey(cfg.api_key) : '',
      usage: {
        day: u.day,
        dayCalls: u.dayCalls,
        dayChars: u.dayChars,
        month: u.month,
        monthCalls: u.monthCalls,
        monthInTokens: u.monthInTokens,
        monthOutTokens: u.monthOutTokens,
        monthCostCny: u.monthCostCny,
        totalCalls: u.totalCalls,
        inFlight: aiRunning.get(uid) || 0
      },
      limits: acl.limits,
      providers: acl.providers
        .map(p => ({ id: p.id, label: p.label, models: p.models || [], defaultModel: p.defaultModel || '', enabled: !!p.baseUrl }))
        .filter(p => p.enabled),
      costNote: '费用为按估算单价推算，实际以服务商账单为准；结算延迟可能导致少量超额。'
    });
  }

  function handleAILogs(req, res) {
    let lines = [];
    try { lines = f.readFileSync(AI_LOG_FILE, 'utf8').trim().split('\n').slice(-30); } catch (e) {}
    return json(res, 200, {
      ok: true,
      lines: lines.map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean)
    });
  }

  function handleAIConfig(req, res, cu) {
    if (!auth.sameSite(req) || req.headers['x-liora-ai'] !== '1') {
      aiLog('DENY_CSRF', req, cu, '');
      return json(res, 403, { ok: false, error: '请求来源校验未通过' });
    }
    return readBody(req, 8192).then(raw => {
      let p;
      try { p = JSON.parse(raw || '{}'); } catch (e) { return json(res, 400, { ok: false, error: '请求内容无法解析' }); }
      if (p.action === 'revoke') {
        try { aiSaveProvider({ disabled: true, revokedAt: new Date().toISOString() }); }
        catch (e) { return json(res, 500, { ok: false, error: '写入失败' }); }
        aiLog('KEY_REVOKED', req, cu, '');
        return json(res, 200, { ok: true, revoked: true });
      }
      const acl = loadAIAcl();
      const prov = acl.providers.find(x => x.id === String(p.provider || ''));
      if (!prov || !prov.baseUrl) {
        aiLog('DENY_PROVIDER', req, cu, String(p.provider || ''));
        return json(res, 400, { ok: false, error: '不支持的服务商' });
      }
      const model = String(p.model || prov.defaultModel || '');
      if (Array.isArray(prov.models) && prov.models.length && !prov.models.includes(model)) {
        return json(res, 400, { ok: false, error: '不支持的模型' });
      }
      const key = String(p.apiKey || '').trim();
      if (!/^[A-Za-z0-9_\-.]{20,200}$/.test(key)) {
        return json(res, 400, { ok: false, error: '密钥格式不正确：请只粘贴密钥本身，不要带空格或引号' });
      }
      try {
        aiSaveProvider({ provider: prov.id, base_url: prov.baseUrl, model, api_key: key, updatedAt: new Date().toISOString() });
      } catch (e) {
        return json(res, 500, { ok: false, error: '密钥写入失败' });
      }
      aiLog('KEY_SAVED', req, cu, prov.id + '/' + model + '/' + aiMaskKey(key));
      return json(res, 200, { ok: true, provider: prov.id, model, masked: aiMaskKey(key) });
    }).catch(() => json(res, 400, { ok: false, error: '读取请求失败' }));
  }

  function handleAIChat(req, res, cu, uid) {
    const L = loadAIAcl().limits;
    return readBody(req, 256 * 1024).then(raw => {
      let payload;
      try { payload = JSON.parse(raw || '{}'); } catch (e) { return json(res, 400, { ok: false, error: '请求内容无法解析' }); }
      const question = String(payload.question || '').trim();
      const context = String(payload.context || '').trim();
      const mode = MODE_INSTRUCTIONS[payload.mode] ? payload.mode : 'socratic';
      const history = Array.isArray(payload.history) ? payload.history : [];
      const dryRun = payload.dryRun === true;
      if (!question) return json(res, 400, { ok: false, error: '问题是空的。' });
      if (question.length > L.maxQuestionChars) {
        aiLog('LIMIT_QUESTION', req, cu, 'len=' + question.length);
        return json(res, 413, { ok: false, code: 'QUESTION_TOO_LONG', error: '问题太长（上限 ' + L.maxQuestionChars + ' 字）' });
      }
      let histChars = 0;
      const msgs = [];
      history.slice(-L.maxHistoryItems).forEach(h => {
        const t = String((h && h.content) || '').trim();
        if (!t || histChars + t.length > L.maxHistoryChars) return;
        histChars += t.length;
        msgs.push({ role: (h && h.role === 'user') ? 'user' : 'assistant', content: t });
      });
      const chars = question.length + Math.min(context.length, L.maxContextChars) + histChars;
      const q = aiQuotaCheck(uid, chars, L);
      if (!q.ok) {
        aiLog('BLOCK_' + q.code, req, cu, q.code);
        return json(res, 429, { ok: false, code: q.code, error: q.msg });
      }
      const cfg = loadAICfg();
      if (dryRun) {
        return json(res, 200, {
          ok: true, dryRun: true, charged: false, owner: true,
          ready: !!(cfg && cfg.api_key), model: cfg ? cfg.model : '', limits: L
        });
      }
      if (!cfg || !cfg.api_key) {
        return json(res, 200, { ok: false, code: 'NOT_CONFIGURED', error: 'AI 密钥尚未配置：请主人账号在「AI 设置」页填入密钥。' });
      }
      if (!aiAcquire(uid, L.maxConcurrent)) {
        aiLog('BLOCK_CONCURRENT', req, cu, '');
        return json(res, 429, { ok: false, code: 'CONCURRENT', error: '同时进行中的提问已达上限' });
      }

      let systemText = AI_SYSTEM_PROMPT + '\n\n' + MODE_INSTRUCTIONS[mode];
      if (context) systemText += '\n\n当前页面上下文（仅用于定位本周/本章内容）：' + context.slice(0, L.maxContextChars);
      const profileCtx = loadProfileContext();
      if (profileCtx) systemText += '\n\n【学生学习档案（常驻背景，每次都参考）】\n' + profileCtx;

      const messages = [{ role: 'system', content: systemText }].concat(msgs, [{ role: 'user', content: question }]);
      const upstream = {
        model: cfg.model,
        messages,
        stream: true,
        max_tokens: L.maxOutputTokens,
        stream_options: { include_usage: true }
      };
      if (cfg.temperature != null) upstream.temperature = cfg.temperature;
      if (cfg.extra_body && typeof cfg.extra_body === 'object' && !Array.isArray(cfg.extra_body)) {
        Object.keys(cfg.extra_body).forEach(k => { upstream[k] = cfg.extra_body[k]; });
      }
      let upUrl;
      try { upUrl = new url.URL(String(cfg.base_url).replace(/\/+$/, '') + '/chat/completions'); }
      catch (e) { aiRelease(uid); return json(res, 200, { ok: false, error: '服务端模型地址配置无效' }); }
      if (upUrl.protocol !== 'https:') { aiRelease(uid); return json(res, 200, { ok: false, error: '服务端模型地址必须使用 HTTPS' }); }

      const reqData = JSON.stringify(upstream);
      const options = {
        method: 'POST',
        hostname: upUrl.hostname,
        port: upUrl.port || 443,
        path: upUrl.pathname + upUrl.search,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + cfg.api_key,
          'Accept-Encoding': 'identity',
          'Content-Length': Buffer.byteLength(reqData)
        }
      };

      const st = { buf: '', inTokens: 0, outTokens: 0, outChars: 0, gotUsage: false };
      let settled = false, released = false, started = false, replied = false, timedOut = false;
      function reply(obj) { if (replied) return; replied = true; json(res, 200, obj); }
      function finishOnce(countAsCall) {
        if (released) return;
        released = true;
        aiRelease(uid);
        if (!settled && countAsCall !== false) {
          settled = true;
          aiSettle(uid, st, chars, L);
        }
      }

      const upReq = https.request(options, upRes => {
        if (upRes.statusCode !== 200) {
          upRes.resume();
          aiLog('UPSTREAM_HTTP', req, cu, 'status=' + upRes.statusCode);
          finishOnce(false);
          return reply({ ok: false, code: 'UPSTREAM_' + upRes.statusCode, error: '模型服务暂时不可用（HTTP ' + upRes.statusCode + '），本次未计费' });
        }
        started = true;
        res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'Connection': 'close' });
        upRes.on('data', chunk => {
          try { aiObserveSse(chunk.toString('utf8'), st); } catch (e) {}
          res.write(chunk);
        });
        upRes.on('end', () => { finishOnce(true); try { res.end(); } catch (e) {} });
        upRes.on('error', () => { finishOnce(true); try { res.end(); } catch (e) {} });
      });
      upReq.on('error', e => {
        aiLog(timedOut ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR', req, cu, (e && e.code) || 'unknown');
        finishOnce(false);
        if (!started) return reply({ ok: false, error: timedOut ? '模型响应超时，本次未计费' : '连不上模型服务，本次未计费' });
        try { res.end(); } catch (err) {}
      });
      upReq.setTimeout(L.timeoutMs, () => { timedOut = true; try { upReq.destroy(new Error('timeout')); } catch (e) {} });
      res.on('close', () => { finishOnce(true); });
      upReq.write(reqData);
      upReq.end();
    }).catch(e => {
      if (e && e.message === 'too large') return json(res, 413, { ok: false, error: '请求体过大' });
      return json(res, 400, { ok: false, error: '读取请求失败' });
    });
  }

  return {
    loadAICfg,
    isAIOwner,
    aiLog,
    aiAuthorize,
    handleAIStatus,
    handleAILogs,
    handleAIConfig,
    handleAIChat
  };
}

module.exports = { createAIService };
