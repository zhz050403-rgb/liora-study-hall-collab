/* Liora 的学习小屋 · 线上版服务
   纯 Node 核心模块，无第三方依赖：登录保护 + 静态资源 + 进度云端保存
   多账号：每个账号独立密码与进度，互不干扰；仅主人账号拥有 AI 权限 */
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), url = require('url'), https = require('https'), zlib = require('zlib');

const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
/* 本地回归测试可用 LIORA_DATA_DIR 指向临时目录，避免污染真实进度/账号数据；
   线上不设此变量，行为与此前完全一致。 */
const DATA_DIR = process.env.LIORA_DATA_DIR || path.join(ROOT, 'data');
const PORT = Number(process.env.PORT || 3000);
let auth;
try {
  auth = JSON.parse(fs.readFileSync(path.join(ROOT, 'auth.json'), 'utf8'));
} catch (e) {
  console.error('[auth] 读取 auth.json 失败，已回退到空配置（所有账号将无法登录，但服务可正常启动）：', (e && e.message) || e);
  auth = {};
}
const SESSION_DAYS = 90;
const COOKIE = 'liora_sess';
const KEY_RE = /^(xinnan|liora|cabin|loopenglish)[A-Za-z0-9_-]*$/;

/* 仅主人账号（ai:true）可见的内容目录：课外拓展；客人账号直接拒绝访问（读书栏目对客人开放） */
const OWNER_FOLDERS = ['课外'];
const OWNER_RE = new RegExp('^/(' + OWNER_FOLDERS.map(function (f) { return f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')(/|$)');

/* 发布时为减小上传体积，以下大体积源文件 / PDF 目录未上传线上版；访问时给出友好提示而非 404 */
const EXCLUDED_DIRS = ['sources', 'reading-sources', 'Course_ FNDN Academic English 2026 STD O2 _ UNSW_week type unit', 'Course_ FNDN Accounting 2026 STD O2 _ UNSW_week type unit', 'Course_ FNDN Computing for Business, Science and Design 2026 STD O2 _ UNSW_补下载_2026-10-22T05-35-58-957Z', 'Course_ FNDN Mathematics for Commerce 2026 STD O2 _ UNSW_term week type unit', 'FNDN Economics 2025 STD O1', '富爸爸穷爸爸', '小岛经济学', '活得更好'];
function isExcludedPath(p) { return EXCLUDED_DIRS.some(function (d) { return p === d || p.startsWith(d + '/'); }); }

/* 多账号支持：auth.json 形如 { sessionSecret, users:[{user,salt,passHash,ai}] }
   兼容旧的单账号结构（顶层 user/salt/passHash），缺失时按主人账号处理 */
const USERS = Array.isArray(auth.users) && auth.users.length
  ? auth.users
  : (auth.user ? [{ user: auth.user, salt: auth.salt, passHash: auth.passHash, ai: true }] : []);
const SESSION_SECRET = auth.sessionSecret || crypto.randomBytes(32).toString('hex');

/* 注册账号 / 角色 / 积分（2026-11-14）：auth.json 完全只读，注册数据落在
   data/accounts.json（运行时目录，不进发布基线、发版不覆盖）。 */
const ACCOUNTS = require('./accounts/service').createService({
  dataDir: DATA_DIR,
  builtinUsers: USERS
});
const ROLES = ACCOUNTS.ROLES;
/* 一次 AI 调用的估算成本：与 aiSettle 的估算口径一致，用于「每天 0.1 元 /
   10 积分 = 0.01 元」这类额度换算。真实扣减仍以服务端 aiSettle 为准。 */
const CNY_PER_AI_CALL = 0.01;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'video/mp4',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip', '.rar': 'application/x-rar-compressed',
  '.apk': 'application/vnd.android.package-archive'
};

let skipped = new Set();
try {
  JSON.parse(fs.readFileSync(path.join(ROOT, 'skipped-files.json'), 'utf8')).files.forEach(f => {
    skipped.add(f.rel);
    skipped.add(f.rel.split('/').map(encodeURIComponent).join('/'));
  });
} catch (e) {}

const sign = s => crypto.createHmac('sha256', SESSION_SECRET).update(s).digest('base64url');
const safeEq = (a, b) => { try { return String(a).length === String(b).length && crypto.timingSafeEqual(Buffer.from(String(a)), Buffer.from(String(b))); } catch (e) { return false; } };
function findUser(u) {
  const k = String(u == null ? '' : u).trim().toLowerCase();
  if (!k) return null;
  const b = USERS.find(x => String(x.user).trim().toLowerCase() === k);
  if (b) return b;
  return ACCOUNTS.findUser(k);          // 注册账号与 checkPass 同构
}
function checkPass(usr, p) {
  if (!usr) return false;
  const h = crypto.createHash('sha256').update(usr.salt + '|' + usr.user + '|' + p).digest('hex');
  return safeEq(h, usr.passHash);
}
/* 角色完全由服务端判定，前端传任何值都不参与 */
function roleOf(cu) { return ACCOUNTS.roleOf(cu); }
/* 页面可见性：服务端硬闸门。返回 true 表示允许访问该路径。
   - admin      全部
   - premium    除「课外拓展」外全部
   - member     除「课外拓展」外全部
   - user       只有英语学习（含其静态资源、必要的 API）
   - legacy     原有账号保持不变（除「课外拓展」外全部） */
function pageAllowed(role, name) {
  if (!role) return false;
  if (role === ROLES.ADMIN) return true;
  const extraAsset = OWNER_RE.test(name) || name.toLowerCase().indexOf('/assets/extracurricular_imgs/') === 0;
  if (role === ROLES.USER) {
    if (name === '/english' || name === '/english/' || name === '/english/index.html') return true;
    if (name.indexOf('/english/') === 0) return true;          // 英语台自有 css/js/数据
    if (name === '/__api/state' || name === '/__api/me' || name === '/__api/points/status' ||
        name === '/__api/points/words' || name === '/__api/points/claim' || name === '/__api/points/redeem' ||
        name === '/__logout' || name === '/__health' || name === '/__api/ai/ticket') return true;
    if (name === '/cloud-config.js' || name === '/cloud-sync.js' || name === '/board-overrides.js') return true;
    /* 主站课程内容数据不向「用户」下发；英语台自有资源都在 /english/ 下，不受影响。
       英语台还会引用 /board-catalog.js、/board-overrides-client.js 等公共脚本，故只列内容数据文件。 */
    if (/^\/(data|reading-data|question-bank|prep-data|learning-profile-data)\.js$/i.test(name)) return false;
    if (/\.(css|js|json|png|jpe?g|svg|webp|gif|ico|woff2?|webmanifest|mp3|wav|m4a)$/i.test(name)) return true;
    if (name === '/' || name === '/index.html') return true;    // 由前端 role-nav 立刻跳去英语台
    return false;
  }
  if (extraAsset) return false;                                  // 课外拓展
  if (name === '/ai-console.html' || name === '/board-editor.html' ||
      name === '/notes-review.html' || name === '/admin.html' || name === '/register.html') {
    // 这些是管理员/公开页，下面按各自规则单独处理；此处仅拦管理页
    if (name === '/admin.html') return false;
  }
  return true;
}

function makeToken(u) {
  const payload = Buffer.from(JSON.stringify({ u: u, exp: Date.now() + SESSION_DAYS * 864e5, n: crypto.randomBytes(6).toString('hex') })).toString('base64url');
  return payload + '.' + sign(payload);
}
/* 返回已登录的账号名（字符串），无效或过期返回 null */
function userOf(tok) {
  if (!tok || !tok.includes('.')) return null;
  const [p, s] = tok.split('.');
  if (!safeEq(sign(p), s)) return null;
  try { const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return (o.exp > Date.now() && findUser(o.u)) ? o.u : null; } catch (e) { return null; }
}
function cookieOf(req) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('='); if (i < 0) continue;
    if (part.slice(0, i).trim() === COOKIE) { try { return decodeURIComponent(part.slice(i + 1).trim()); } catch (e) { return ''; } }
  }
  return '';
}

const failed = new Map();
function rateLimited(ip) {
  const rec = failed.get(ip);
  return !!(rec && rec.until > Date.now());
}
function noteFail(ip) {
  const now = Date.now(), rec = failed.get(ip) || { n: 0, until: 0, last: now };
  if (now - rec.last > 6e4) rec.n = 0;
  rec.n++; rec.last = now;
  if (rec.n >= 8) { rec.until = now + 6e4; rec.n = 0; }
  failed.set(ip, rec);
}

function send(res, code, body, headers) {
  const h = Object.assign({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' }, headers || {});
  res.writeHead(code, h); res.end(body);
}
function json(res, code, obj, headers) { send(res, code, JSON.stringify(obj), Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers || {})); }
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0, done = false;
    req.on('data', c => { n += c.length; if (n > limit) { if (!done) { done = true; reject(new Error('too large')); } } else chunks.push(c); });
    req.on('end', () => { if (!done) { done = true; resolve(Buffer.concat(chunks).toString('utf8')); } });
    req.on('error', e => { if (!done) { done = true; reject(e); } });
  });
}

// Board patches live beside cloud progress, in separate files. The deployed
// content remains the baseline and untouched entries follow later deployments.
const BOARDS = require(path.join(PUB, 'board-catalog.js'));
const vm = require('node:vm');
function boardFile(board) { return path.join(DATA_DIR, 'board-' + board + '.json'); }
function boardOverrides(board) {
  try { return JSON.parse(fs.readFileSync(boardFile(board), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
}
function boardBaseline(board) {
  const spec = BOARDS[board];
  const source = fs.readFileSync(path.join(PUB, spec.file), 'utf8');
  const data = vm.runInNewContext(source + '\n;' + spec.expression, { window: {} }, { timeout: 1000 });
  return Object.fromEntries(spec.entries(data).map(([key, entry]) => [
    key, Object.fromEntries(spec.fields.filter(field => Object.hasOwn(entry, field)).map(field => [field, entry[field]]))
  ]));
}
function validBoardValue(field, value) {
  if (field === 'minutes') return Number.isInteger(value) && value > 0;
  if (field === 'dailyHours') return Number.isFinite(value) && value > 0;
  if (field === 'done') return typeof value === 'boolean';
  if (field === 'paragraphs' || field === 'steps') return Array.isArray(value) && value.every(text => typeof text === 'string');
  return typeof value === 'string';
}
function boardRevision(baseline, overrides) {
  return crypto.createHash('sha256').update(JSON.stringify([baseline, overrides])).digest('hex');
}
function saveBoardOverrides(board, overrides) {
  const file = boardFile(board), temporary = file + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(overrides), 'utf8');
  fs.renameSync(temporary, file);
}
async function handleBoard(req, res, board) {
  let payload;
  if (req.method === 'POST') {
    if (req.headers['x-liora-board'] !== '1' ||
        !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '') ||
        req.headers['sec-fetch-site'] === 'cross-site') {
      return json(res, 403, { error: 'invalid_patch_request' });
    }
    let body;
    try { body = await readBody(req, 2 * 1024 * 1024); }
    catch (error) { return json(res, 413, { error: 'patch_too_large' }); }
    try { payload = JSON.parse(body); }
    catch (error) { return json(res, 400, { error: 'invalid_json' }); }
  } else if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  try {
    const baseline = boardBaseline(board), overrides = boardOverrides(board);
    const revision = boardRevision(baseline, overrides);
    const entries = Object.fromEntries(Object.entries(baseline).map(([key, entry]) => [
      key, { ...entry, ...overrides[key] }
    ]));
    if (req.method === 'GET') return json(res, 200, { board, revision, entries });
    if (!payload || payload.revision !== revision) {
      return json(res, 409, { error: 'board_changed', revision });
    }
    const changes = payload.changes;
    if (!changes || typeof changes !== 'object' || Array.isArray(changes) || !Object.keys(changes).length) {
      return json(res, 400, { error: 'empty_patch' });
    }
    for (const [key, change] of Object.entries(changes)) {
      if (!Object.hasOwn(baseline, key)) return json(res, 400, { error: 'unknown_entry', key });
      if (change === null) { delete overrides[key]; continue; }
      const fields = Object.keys(baseline[key]);
      if (!change || typeof change !== 'object' || Array.isArray(change) || !Object.keys(change).length ||
          Object.entries(change).some(([field, value]) => !fields.includes(field) ||
            !validBoardValue(field, value))) {
        return json(res, 400, { error: 'invalid_entry', key });
      }
      overrides[key] = { ...overrides[key], ...change };
    }
    // Validation, compare and rename are synchronous in this single server process.
    saveBoardOverrides(board, overrides);
    return json(res, 200, { ok: true, revision: boardRevision(baseline, overrides) });
  } catch (error) {
    console.error('Board update failed:', board, error.code || error.name);
    return json(res, 500, { error: 'board_storage_unavailable' });
  }
}

let notesPipeline;
function getNotesPipeline() {
  if (!notesPipeline) {
    notesPipeline = require('./notes/pipeline/service').createService({
      draftDir: path.join(DATA_DIR, 'notes-review'),
      roots: [path.join(PUB, 'sources'), PUB, path.resolve(ROOT, '../_deploy_excluded/sources')],
      readConfig: loadAICfg,
      lookup(board, key) {
        const spec = BOARDS[board];
        if (!spec || !spec.fields.includes('graphicHtml')) return null;
        const data = vm.runInNewContext(fs.readFileSync(path.join(PUB, spec.file), 'utf8') +
          '\n;' + spec.expression, {window: {}}, {timeout: 1000});
        return spec.entries(data).find(([id]) => id === key)?.[1];
      },
      readBoard(board, key) {
        const baseline = boardBaseline(board), overrides = boardOverrides(board);
        if (!Object.hasOwn(baseline[key] || {}, 'graphicHtml')) throw new Error('This week does not have an editable graphicHtml field.');
        return {html: overrides[key]?.graphicHtml ?? baseline[key].graphicHtml,
          revision: boardRevision(baseline, overrides)};
      },
      writeBoard(board, key, html, revision) {
        const baseline = boardBaseline(board), overrides = boardOverrides(board);
        if (boardRevision(baseline, overrides) !== revision) throw new Error('The board changed. Reopen the draft before publishing.');
        overrides[key] = {...overrides[key], graphicHtml: html};
        saveBoardOverrides(board, overrides);
      }
    });
  }
  return notesPipeline;
}

async function handleNotesPipeline(req, res, url) {
  const sendResult = (status, payload) => json(res, status, payload, {'Cache-Control': 'private, no-store'});
  try {
    if (req.method === 'GET') return sendResult(200, getNotesPipeline().get(url.searchParams.get('id')));
    if (req.method !== 'POST') return sendResult(405, {error: 'method_not_allowed'});
    if (req.headers['x-liora-board'] !== '1' || req.headers['sec-fetch-site'] === 'cross-site' ||
        !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
      return sendResult(403, {error: 'invalid_request'});
    }
    let body;
    try { body = JSON.parse(await readBody(req, 8192)); }
    catch { return sendResult(400, {error: 'invalid_json'}); }
    if (body?.action === 'generate') {
      const result = await getNotesPipeline().generate(body);
      return sendResult(result.validation.errors.length ? 422 : 201, result);
    }
    if (body?.action === 'publish') return sendResult(200, getNotesPipeline().publish(body.id, body.revision));
    return sendResult(400, {error: 'invalid_action'});
  } catch (error) {
    if (!error.status) console.error('Notes pipeline failed:', error.code || error.name);
    return sendResult(error.status || 500, {error: error.status ? error.message : 'Notes pipeline failed.', calls: error.calls || 0});
  }
}

/* ===================== AI 授权 / 密钥 / 额度（服务端专用，2026-11-13） =====================
   原则：浏览器永远拿不到密钥；每次调用都在服务端重新验证「签名 Cookie → 不可变 uid → 白名单」；
        配额在服务端硬阻断；密钥由主人账号在配置页写入独立文件，不进 Git、不在 public/ 下。 */
const AI_ACL_FILE = path.join(ROOT, 'ai_acl.json');
const AI_PROVIDER_FILE = path.join(ROOT, 'ai_provider.json');
const AI_USAGE_FILE = path.join(DATA_DIR, 'ai-usage.json');
const AI_LOG_FILE = path.join(DATA_DIR, 'ai-security.log');

function readJsonSafe(p, fallback) {
  try { const v = JSON.parse(fs.readFileSync(p, 'utf8')); return v == null ? fallback : v; }
  catch (e) { return fallback; }
}
/* 旧的 ai_config.json 保持原样、不再读取：只有「AI 设置页」写入的 ai_provider.json 才生效。
   文件缺失 / disabled / 字段不全 => 一律不发任何上游请求（不擅自使用任何付费 API）。 */
function loadAICfg() {
  const c = readJsonSafe(AI_PROVIDER_FILE, null);
  if (!c || c.disabled || !c.api_key || !c.base_url || !c.model) return null;
  return c;
}
const AI_DEFAULT_LIMITS = {
  maxQuestionChars: 4000, maxContextChars: 1500, maxHistoryItems: 6, maxHistoryChars: 6000,
  maxOutputTokens: 1200, timeoutMs: 45000, perMinute: 6, perDay: 60, maxConcurrent: 2,
  dailyChars: 120000, monthlyBudgetCny: 20,
  estimateInputPer1MTokensCny: 2, estimateOutputPer1MTokensCny: 8
};
function loadAIAcl() {
  const a = readJsonSafe(AI_ACL_FILE, {});
  return {
    ownerUids: Array.isArray(a.ownerUids) ? a.ownerUids.map(String) : [],
    providers: Array.isArray(a.providers) ? a.providers : [],
    limits: Object.assign({}, AI_DEFAULT_LIMITS, (a && a.limits) || {})
  };
}
/* uid 来自 auth.json，由服务端在验证签名 Cookie 之后查得；前端传什么都不影响 */
function aiUidOf(cu) {
  const u = findUser(cu);
  return (u && u.uid && u.ai === true) ? String(u.uid) : null;
}
function isAIOwner(cu) {
  const uid = aiUidOf(cu);
  return !!(uid && loadAIAcl().ownerUids.indexOf(uid) >= 0);
}
function aiLog(kind, req, cu, detail) {
  const rec = {
    t: new Date().toISOString(), kind: kind,
    ip: String((req && req.socket && req.socket.remoteAddress) || '').slice(0, 64),
    user: String(cu || '').slice(0, 40), detail: String(detail || '').slice(0, 160)
  };
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.appendFileSync(AI_LOG_FILE, JSON.stringify(rec) + '\n'); }
  catch (e) {}
}
/* 统一闸门：未登录 401、非 Owner 403，其余返回 uid */
function aiAuthorize(req, res, cu) {
  if (!cu) {
    aiLog('DENY_ANON', req, '', '');
    json(res, 401, { ok: false, error: '请先登录' });
    return null;
  }
  const uid = aiUidOf(cu);
  if (!uid || loadAIAcl().ownerUids.indexOf(uid) < 0) {
    aiLog('DENY_NON_OWNER', req, cu, uid || 'no-uid');
    json(res, 403, { ok: false, error: '该功能仅限主人账号' });
    return null;
  }
  return uid;
}
/* 同站校验：阻止别的网站借你的登录 Cookie 偷偷提交密钥 */
function aiSameOrigin(req) {
  const h = req.headers || {};
  const o = h.origin || h.referer || '';
  if (!o) return true;
  try { return new url.URL(o).host === h.host; } catch (e) { return false; }
}

/* ---------- 用量台账（与学习进度同在 data/，不进 Git / 不进自动发布基线） ---------- */
function aiUsageAll() { const d = readJsonSafe(AI_USAGE_FILE, {}); return (d && typeof d === 'object') ? d : {}; }
function aiUsageWrite(all) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(AI_USAGE_FILE, JSON.stringify(all)); } catch (e) {}
}
function aiDay() { return new Date().toISOString().slice(0, 10); }
function aiMonth() { return new Date().toISOString().slice(0, 7); }
function aiUsageOf(uid) {
  const all = aiUsageAll(), d = aiDay(), m = aiMonth();
  let u = all[uid];
  if (!u || typeof u !== 'object') u = {};
  if (u.day !== d) { u.day = d; u.dayCalls = 0; u.dayChars = 0; u.minute = []; }
  if (u.month !== m) { u.month = m; u.monthCalls = 0; u.monthInTokens = 0; u.monthOutTokens = 0; u.monthCostCny = 0; }
  u.minute = Array.isArray(u.minute) ? u.minute.filter(t => Date.now() - t < 60000) : [];
  ['dayCalls', 'dayChars', 'monthCalls', 'monthInTokens', 'monthOutTokens', 'monthCostCny', 'totalCalls']
    .forEach(k => { if (typeof u[k] !== 'number') u[k] = 0; });
  return { all: all, u: u };
}
function aiQuotaCheck(uid, chars, L) {
  const q = aiUsageOf(uid), u = q.u;
  if (u.minute.length >= L.perMinute) return { ok: false, code: 'RATE_MINUTE', msg: '每分钟调用次数已达上限，请稍等一会儿' };
  if (u.dayCalls >= L.perDay) return { ok: false, code: 'RATE_DAY', msg: '今日调用次数已达上限' };
  if (u.dayChars + chars > L.dailyChars) return { ok: false, code: 'QUOTA_DAY_CHARS', msg: '今日输入字数额度已用完' };
  if (u.monthCostCny >= L.monthlyBudgetCny) return { ok: false, code: 'BUDGET_MONTH', msg: '本月预算已达上限，调用已阻断' };
  return { ok: true, all: q.all, u: u };
}
const aiRunning = new Map();
function aiAcquire(uid, max) { const n = aiRunning.get(uid) || 0; if (n >= max) return false; aiRunning.set(uid, n + 1); return true; }
function aiRelease(uid) { const n = aiRunning.get(uid) || 1; if (n <= 1) aiRunning.delete(uid); else aiRunning.set(uid, n - 1); }
/* 只统计用量，不改变转发给浏览器的字节 */
function aiObserveSse(text, st) {
  st.buf += text;
  let i;
  while ((i = st.buf.indexOf('\n')) >= 0) {
    const line = st.buf.slice(0, i); st.buf = st.buf.slice(i + 1);
    if (line.indexOf('data:') !== 0) continue;
    const raw = line.slice(5).trim();
    if (!raw || raw === '[DONE]') continue;
    try {
      const j = JSON.parse(raw);
      if (j.usage) { st.inTokens = j.usage.prompt_tokens || st.inTokens; st.outTokens = j.usage.completion_tokens || st.outTokens; st.gotUsage = true; }
      const ch = j.choices && j.choices[0];
      const d = ch && (ch.delta || ch.message);
      if (d && typeof d.content === 'string') st.outChars += d.content.length;
    } catch (e) {}
  }
}
function aiSettle(uid, all, u, st, chars, L) {
  const inT = st.gotUsage ? st.inTokens : Math.ceil(chars / 4);
  const outT = st.gotUsage ? st.outTokens : Math.ceil(st.outChars / 4);
  const cost = (inT / 1e6) * L.estimateInputPer1MTokensCny + (outT / 1e6) * L.estimateOutputPer1MTokensCny;
  u.dayCalls += 1; u.dayChars += chars; u.monthCalls += 1;
  u.monthInTokens += inT; u.monthOutTokens += outT;
  u.monthCostCny = Math.round((u.monthCostCny + cost) * 1e6) / 1e6;
  u.totalCalls += 1; u.minute.push(Date.now()); u.lastAt = Date.now();
  all[uid] = u; aiUsageWrite(all);
  return { inT: inT, outT: outT, cost: cost };
}
/* 密钥只在这里写盘；响应里永远不回显，日志里永远不出现 */
function aiMaskKey(k) { return String(k || '').slice(0, 3) + '****' + String(k || '').slice(-4); }
function aiSaveProvider(p) {
  const tmp = AI_PROVIDER_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(p, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, AI_PROVIDER_FILE);
}
function handleAIStatus(req, res, uid) {
  const cfg = loadAICfg(), acl = loadAIAcl(), q = aiUsageOf(uid), u = q.u;
  return json(res, 200, {
    ok: true, owner: true, ready: !!(cfg && cfg.api_key),
    provider: cfg ? (cfg.provider || '') : '', model: cfg ? cfg.model : '',
    keyMasked: cfg ? aiMaskKey(cfg.api_key) : '',
    usage: {
      day: u.day, dayCalls: u.dayCalls, dayChars: u.dayChars, month: u.month,
      monthCalls: u.monthCalls, monthInTokens: u.monthInTokens, monthOutTokens: u.monthOutTokens,
      monthCostCny: u.monthCostCny, totalCalls: u.totalCalls, inFlight: aiRunning.get(uid) || 0
    },
    limits: acl.limits,
    providers: acl.providers.map(function (p) {
      return { id: p.id, label: p.label, models: p.models || [], defaultModel: p.defaultModel || '', enabled: !!p.baseUrl };
    }).filter(function (p) { return p.enabled; }),
    costNote: '费用为按估算单价推算，实际以服务商账单为准；结算延迟可能导致少量超额。'
  });
}
function handleAILogs(req, res, uid) {
  let lines = [];
  try { lines = fs.readFileSync(AI_LOG_FILE, 'utf8').trim().split('\n').slice(-30); } catch (e) {}
  return json(res, 200, {
    ok: true,
    lines: lines.map(function (l) { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean)
  });
}
function handleAIConfig(req, res, cu, uid) {
  if (!aiSameOrigin(req) || req.headers['x-liora-ai'] !== '1') {
    aiLog('DENY_CSRF', req, cu, '');
    return json(res, 403, { ok: false, error: '请求来源校验未通过' });
  }
  return readBody(req, 8192).then(function (raw) {
    let p;
    try { p = JSON.parse(raw || '{}'); } catch (e) { return json(res, 400, { ok: false, error: '请求内容无法解析' }); }
    if (p.action === 'revoke') {
      try { aiSaveProvider({ disabled: true, revokedAt: new Date().toISOString() }); }
      catch (e) { return json(res, 500, { ok: false, error: '写入失败' }); }
      aiLog('KEY_REVOKED', req, cu, '');
      return json(res, 200, { ok: true, revoked: true });
    }
    const acl = loadAIAcl();
    /* base_url 只从服务端白名单取，绝不接受前端传来的地址（防把密钥发到别处） */
    const prov = acl.providers.find(x => x.id === String(p.provider || ''));
    if (!prov || !prov.baseUrl) {
      aiLog('DENY_PROVIDER', req, cu, String(p.provider || ''));
      return json(res, 400, { ok: false, error: '不支持的服务商' });
    }
    const model = String(p.model || prov.defaultModel || '');
    if (Array.isArray(prov.models) && prov.models.length && prov.models.indexOf(model) < 0) {
      return json(res, 400, { ok: false, error: '不支持的模型' });
    }
    const key = String(p.apiKey || '').trim();
    if (!/^[A-Za-z0-9_\-]{20,160}$/.test(key)) {
      return json(res, 400, { ok: false, error: '密钥格式不正确：请只粘贴密钥本身，不要带空格或引号' });
    }
    try {
      aiSaveProvider({ provider: prov.id, base_url: prov.baseUrl, model: model, api_key: key, updatedAt: new Date().toISOString() });
    } catch (e) { return json(res, 500, { ok: false, error: '密钥写入失败' }); }
    aiLog('KEY_SAVED', req, cu, prov.id + '/' + model + '/' + aiMaskKey(key));
    return json(res, 200, { ok: true, provider: prov.id, model: model, masked: aiMaskKey(key) });
  }).catch(function () { return json(res, 400, { ok: false, error: '读取请求失败' }); });
}
/* 学生学习档案（常驻 AI 背景）：每次请求实时读取 profile-context.md，按 mtime 缓存，文件缺失时静默降级 */
let _pcCache = { mtime: 0, text: '' };
function loadProfileContext() {
  try {
    const p = path.join(ROOT, 'profile-context.md');
    const st = fs.statSync(p);
    if (st.mtimeMs !== _pcCache.mtime) {
      _pcCache = { mtime: st.mtimeMs, text: fs.readFileSync(p, 'utf8').trim() };
    }
    return _pcCache.text;
  } catch (e) { return ''; }
}
const AI_SYSTEM_PROMPT = "你是 UNSW 预科学生的私人学习伴学助手（学生母语为中文，课程为英文授课）。\n工作方式：\n1. 优先用苏格拉底式引导：先用一个简短的问题确认学生的理解卡在哪里，再给解释；学生明确要答案时再直接给完整答案。\n2. 所有专业术语保留英文原词，并紧跟中文解释（如 Accrual basis（权责发生制））。\n3. 涉及计算题必须给完整步骤和数值，不能只给结论。\n4. 用简洁的分点表达，别写长篇大论；重要结论用加粗。\n5. 不确定的内容要说明不确定，绝不编造课件里没有的事实。";
function handleAIChat(req, res, cu, uid) {
  const L = loadAIAcl().limits;
  return readBody(req, 256 * 1024).then(function (raw) {
    let payload;
    try { payload = JSON.parse(raw || '{}'); } catch (e) { return json(res, 400, { ok: false, error: '请求内容无法解析' }); }
    const question = String(payload.question || '').trim();
    const context = String(payload.context || '').trim();
    const history = Array.isArray(payload.history) ? payload.history : [];
    const dryRun = payload.dryRun === true;
    if (!question) return json(res, 400, { ok: false, error: '问题是空的。' });
    if (question.length > L.maxQuestionChars) {
      aiLog('LIMIT_QUESTION', req, cu, 'len=' + question.length);
      return json(res, 413, { ok: false, code: 'QUESTION_TOO_LONG', error: '问题太长（上限 ' + L.maxQuestionChars + ' 字）' });
    }
    let histChars = 0;
    const msgs = [];
    history.slice(-L.maxHistoryItems).forEach(function (h) {
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
    /* 无费用演练：跑完权限与额度校验，但不发上游请求、不计费、不写用量 */
    if (dryRun) {
      return json(res, 200, { ok: true, dryRun: true, charged: false, owner: true,
        ready: !!(cfg && cfg.api_key), model: cfg ? cfg.model : '', limits: L });
    }
    if (!cfg || !cfg.api_key) {
      return json(res, 200, { ok: false, code: 'NOT_CONFIGURED', error: 'AI 密钥尚未配置：请主人账号在「AI 设置」页填入密钥。' });
    }
    if (!aiAcquire(uid, L.maxConcurrent)) {
      aiLog('BLOCK_CONCURRENT', req, cu, '');
      return json(res, 429, { ok: false, code: 'CONCURRENT', error: '同时进行中的提问已达上限' });
    }

    /* 页面上下文合并进同一条 system 消息：部分上游（如 DeepSeek）不接受连续多条 system */
    let systemText = AI_SYSTEM_PROMPT;
    if (context) systemText += '\n\n当前页面上下文（仅用于定位本周/本章内容）：' + context.slice(0, L.maxContextChars);
    const profileCtx = loadProfileContext();
    if (profileCtx) systemText += '\n\n【学生学习档案（常驻背景，每次都参考）】\n' + profileCtx;
    const messages = [{ role: 'system', content: systemText }].concat(msgs, [{ role: 'user', content: question }]);
    const upstream = {
      model: cfg.model, messages: messages, stream: true,
      max_tokens: L.maxOutputTokens, stream_options: { include_usage: true }
    };
    if (cfg.temperature != null) upstream.temperature = cfg.temperature;
    if (cfg.extra_body && typeof cfg.extra_body === 'object' && !Array.isArray(cfg.extra_body)) {
      Object.keys(cfg.extra_body).forEach(function (k) { upstream[k] = cfg.extra_body[k]; });
    }
    let upUrl;
    try { upUrl = new url.URL(String(cfg.base_url).replace(/\/+$/, '') + '/chat/completions'); }
    catch (e) { aiRelease(uid); return json(res, 200, { ok: false, error: '服务端模型地址配置无效' }); }
    if (upUrl.protocol !== 'https:') { aiRelease(uid); return json(res, 200, { ok: false, error: '服务端模型地址必须使用 HTTPS' }); }
    const reqData = JSON.stringify(upstream);
    const options = {
      method: 'POST', hostname: upUrl.hostname, port: upUrl.port || 443,
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
      released = true; aiRelease(uid);
      if (!settled && countAsCall !== false) {
        settled = true;
        try { const fresh = aiUsageOf(uid); aiSettle(uid, fresh.all, fresh.u, st, chars, L); } catch (e) {}
      }
    }
    const upReq = https.request(options, function (upRes) {
      if (upRes.statusCode !== 200) {
        /* 上游错误体不回显：可能含请求原文或鉴权信息，只回状态码 */
        upRes.resume();
        aiLog('UPSTREAM_HTTP', req, cu, 'status=' + upRes.statusCode);
        finishOnce(false);
        return reply({ ok: false, code: 'UPSTREAM_' + upRes.statusCode, error: '模型服务暂时不可用（HTTP ' + upRes.statusCode + '），本次未计费' });
      }
      started = true;
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'Connection': 'close' });
      upRes.on('data', function (chunk) {
        try { aiObserveSse(chunk.toString('utf8'), st); } catch (e) {}
        res.write(chunk);
      });
      upRes.on('end', function () { finishOnce(true); try { res.end(); } catch (e) {} });
      upRes.on('error', function () { finishOnce(true); try { res.end(); } catch (e) {} });
    });
    upReq.on('error', function (e) {
      aiLog(timedOut ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR', req, cu, (e && e.code) || 'unknown');
      finishOnce(false);
      if (!started) return reply({ ok: false, error: timedOut ? '模型响应超时，本次未计费' : '连不上模型服务，本次未计费' });
      try { res.end(); } catch (err) {}
    });
    upReq.setTimeout(L.timeoutMs, function () { timedOut = true; try { upReq.destroy(new Error('timeout')); } catch (e) {} });
    res.on('close', function () { finishOnce(true); });
    upReq.write(reqData);
    upReq.end();
  }).catch(function (e) {
    if (e && e.message === 'too large') return json(res, 413, { ok: false, error: '请求体过大' });
    return json(res, 400, { ok: false, error: '读取请求失败' });
  });
}

const LOGIN_CSS = `
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{font-family:"Songti SC","STSong","SimSun",Georgia,serif;background:#08192f;color:#f2e8d2;display:grid;place-items:center;padding:24px;
 background-image:radial-gradient(ellipse at 50% -10%,rgba(116,155,203,.28),transparent 58%),linear-gradient(180deg,#0d2440 0%,#08192f 60%,#050e1d 100%)}
.card{width:min(420px,100%);background:rgba(13,34,60,.86);border:1px solid rgba(201,165,92,.45);border-radius:18px;
 padding:38px 34px 30px;box-shadow:0 24px 70px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06);text-align:center}
.crest{width:76px;height:76px;margin:0 auto 16px;border-radius:50%;border:2px solid #c9a55c;display:grid;place-items:center;
 background:radial-gradient(circle at 50% 35%,#254a76,#0b1f38);font-size:34px;color:#e9d6a7;box-shadow:0 0 0 6px rgba(201,165,92,.09)}
h1{font-size:25px;letter-spacing:.16em;margin:6px 0 6px;color:#f5e9cd;font-weight:600}
.en{font:400 11px/1.6 Georgia,serif;letter-spacing:.28em;color:#a9bdd6;margin:0 0 26px;text-transform:uppercase}
label{display:block;text-align:left;font-size:13px;letter-spacing:.08em;color:#cbd8ea;margin:16px 0 7px}
input{width:100%;height:48px;padding:0 14px;border-radius:9px;border:1px solid rgba(168,192,222,.32);background:rgba(4,14,28,.6);
 color:#fff;font-size:16px;outline:none;font-family:system-ui,"Microsoft YaHei",sans-serif;transition:border-color .2s,box-shadow .2s}
input:focus{border-color:#c9a55c;box-shadow:0 0 0 3px rgba(201,165,92,.16)}
button{width:100%;height:48px;margin-top:24px;border:0;border-radius:9px;background:linear-gradient(180deg,#d9b96f,#b8923f);
 color:#12233c;font-size:15px;font-weight:700;letter-spacing:.18em;cursor:pointer;font-family:inherit}
button:hover{filter:brightness(1.08)}button:active{transform:translateY(1px)}button:disabled{opacity:.6;cursor:wait}
.err{min-height:20px;margin-top:14px;font-size:13px;color:#f0a9a0;font-family:system-ui,"Microsoft YaHei",sans-serif}
.foot{margin-top:22px;font:400 11px/1.8 system-ui,"Microsoft YaHei",sans-serif;color:#7f96b2;letter-spacing:.04em}
.reg{margin-top:18px;padding-top:16px;border-top:1px solid rgba(168,192,222,.2);font:400 13px/1.6 system-ui,"Microsoft YaHei",sans-serif;color:#a9bdd6}
.reg a{color:#e9cf8f;text-decoration:none;font-weight:700;letter-spacing:.04em}
.reg a:hover{text-decoration:underline}
/* 桌面待办小卡片是 340px 无边框小窗，登录页也要能塞进去 */
@media (max-width:400px){body{padding:10px}.card{padding:22px 18px 20px}.crest{width:56px;height:56px;font-size:26px}
 h1{font-size:20px}.en{margin-bottom:16px}button{margin-top:18px}}
`;
function loginPage(err) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>登录 · Liora 的学习小屋</title><style>${LOGIN_CSS}</style></head><body>
<form class="card" id="f" method="post" action="/__login" autocomplete="on">
<div class="crest" aria-hidden="true">✦</div><h1>Liora 的学习小屋</h1><p class="en">Private Study Hall</p>
<label for="u">账号</label><input id="u" name="u" type="text" required autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="请输入账号">
<label for="p">密码</label><input id="p" name="p" type="password" required placeholder="请输入密码">
<button type="submit" id="go">进 入 学 习 小 屋</button><div class="err" id="err">${err || ''}</div>
<div class="foot">登录后 90 天内不用重复输入<br>学习记录先存在这台设备的浏览器里；点首页下方「同步」可上传云端，换设备时用同一账号同步回来</div>
<div class="reg">还没有账号？<a href="/register.html">用手机号注册 →</a><br><span style="font-size:11px;color:#7f96b2">新注册默认只开放「英语学习」，更多内容由管理员授权</span></div></form>
<script>
document.getElementById('f').addEventListener('submit',function(ev){
 ev.preventDefault();var b=document.getElementById('go'),e=document.getElementById('err');
 b.disabled=true;e.textContent='';
 fetch('/__login',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
  body:JSON.stringify({u:document.getElementById('u').value,p:document.getElementById('p').value})})
 .then(function(r){return r.json().then(function(j){return {s:r.status,j:j}})})
 .then(function(x){if(x.j.ok){
  var n=x.j.redirect||'/';try{var q=new URLSearchParams(location.search).get('next');
   /* 「用户」身份固定落在英语台，不能被 next 覆盖；其余账号在默认回首页时
      仍要尊重 next（桌面小卡片登录后要回到原本打开的页面）。 */
   if(q&&q.charAt(0)==='/'&&q.indexOf('//')!==0&&n==='/')n=q;}catch(err){}
  location.href=n;
 }else{e.textContent=x.j.error||'登录失败';b.disabled=false;}})
 .catch(function(){e.textContent='网络异常，请重试';b.disabled=false;});
});
</script></body></html>`;
}

/* ---------- 进度存储（每账号独立文件） ---------- */
function statePath(u) {
  const safe = String(u || '').replace(/[^A-Za-z0-9_.@-]/g, '_');
  return path.join(DATA_DIR, 'u_' + safe + '.json');
}
function readState(u) {
  try { const o = JSON.parse(fs.readFileSync(statePath(u), 'utf8')); return o && typeof o === 'object' ? o : { updatedAt: 0, data: {} }; }
  catch (e) { return { updatedAt: 0, data: {} }; }
}
function writeState(u, obj) {
  const f = statePath(u);
  const tmp = f + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj));
  fs.renameSync(tmp, f);
}
function sanitizeData(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const out = {};
  for (const k of Object.keys(d)) {
    if (!KEY_RE.test(k) || typeof d[k] !== 'string' || d[k].length > 400000) continue;
    out[k] = d[k];
    if (Object.keys(out).length > 60) break;
  }
  return out;
}

/* ---------- 静态文件 ---------- */
function bootScript(u) {
  const s = readState(u);
  const usr = findUser(u) || {};
  const role = roleOf(u);
  const isOwner = !!usr.ai;
  const st = ACCOUNTS.status(u, role);
  /* canAI：是否显示 AI 悬浮球。管理员/高级会员/会员显示入口，实际能否提问
     由服务端 /__api/ai/ticket 按当日额度硬判断（会员没兑换会收到引导提示）。
     legacy 账号保持原样（ai:false）→ 与改动前一致。 */
  const canAI = isOwner || role === ROLES.PREMIUM || role === ROLES.MEMBER;
  const payload = JSON.stringify({
    ok: true, updatedAt: s.updatedAt || 0, data: s.data || {}, user: u || '',
    ai: isOwner,                       // 兼容旧逻辑：仅主人账号为 true
    role: role, canAI: canAI,
    accountStatus: st,
    roleLabel: ({ admin: '管理员', premium: '高级会员', member: '会员', user: '用户', legacy: '账号' })[role] || '账号'
  }).replace(/</g, '\\u003c');
  return '<script>window.__CLOUD_BOOT__=' + payload + ';</script>';
}
/* 隐藏目录 / build 目录在发布时可能被过滤，构建脚本已把图片改放到 assets/ */
const URL_REMAP = [
  [/^\/课外\/\.note-images\//, '/assets/note-images/'],
  [/^\/build\/extracurricular_imgs\//, '/assets/extracurricular_imgs/']
];
/* 文本类资源走 gzip 压缩传输，省流量、首屏更快；带版本号的 .js/.css 用 immutable 长缓存，
   之后每次打开直接读浏览器缓存，几乎秒开。gzCache 复用压缩结果，避免重复压缩。 */
const COMPRESSIBLE = new Set(['.js', '.css', '.html', '.json', '.svg', '.txt', '.md', '.xml', '.csv']);
const gzCache = new Map();
function gzipBuf(buf) {
  return new Promise((resolve, reject) => { zlib.gzip(buf, { level: 9 }, (e, out) => e ? reject(e) : resolve(out)); });
}
function sendGz(res, ctype, cache, gz) {
  res.writeHead(200, { 'Content-Type': ctype, 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding', 'Cache-Control': cache, 'Content-Length': gz.length, 'X-Content-Type-Options': 'nosniff' });
  res.end(gz);
}
function sendRaw(res, ctype, cache, file, st, req) {
  const h = { 'Content-Type': ctype, 'Cache-Control': cache, 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff' };
  /* 下载包一律以附件形式送出：Safari 对 HTML5 的 download 属性和中文文件名
     处理不稳定，服务端明确声明后，Mac / Windows 点一下都会直接存到下载文件夹。 */
  if (path.extname(file).toLowerCase() === '.zip' || path.basename(file) === 'LioraTodoSetup.exe') {
    h['Content-Disposition'] = 'attachment; filename="' + path.basename(file) + '"';
  }
  const m = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
  let start = 0, end = st.size - 1, code = 200;
  if (m) {
    start = +m[1]; end = m[2] ? Math.min(+m[2], end) : end;
    if (start > end) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); return res.end(); }
    code = 206; h['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
  }
  h['Content-Length'] = end - start + 1;
  res.writeHead(code, h);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file, { start, end }).on('error', () => res.end()).pipe(res);
}
function serveFile(req, res, name, rawName, cu) {
  let lookup = name;
  for (const [re, to] of URL_REMAP) if (re.test(lookup)) { lookup = lookup.replace(re, to); break; }
  let file;
  try { file = path.resolve(PUB, '.' + lookup); } catch (e) { return send(res, 404, 'Not found'); }
  if (!file.startsWith(PUB + path.sep) && file !== PUB) return send(res, 404, 'Not found');
  const owner = !!(findUser(cu) || {}).ai;
  const relative = '/' + path.relative(PUB, file).split(path.sep).join('/');
  const protectedAsset = OWNER_RE.test(relative) || relative.toLowerCase().startsWith('/assets/extracurricular_imgs/');
  if (protectedAsset && !owner) return send(res, 403, 'Forbidden', { 'Cache-Control': 'private, no-store' });
  if (relative.toLowerCase() === '/data.js') {
    fs.readFile(file, 'utf8', (err, source) => {
      if (err) return send(res, 500, 'read error');
      const cache = 'private, no-store';
      let body = source;
      if (!owner) {
        try {
          const match = /^window\.PORTAL_DATA = ([\s\S]+);\s*$/.exec(source);
          const data = JSON.parse(match[1]);
          data.courses = data.courses.filter(course => !course.extra);
          body = 'window.PORTAL_DATA = ' + JSON.stringify(data) + ';';
        } catch (error) {
          return send(res, 500, 'course data unavailable', { 'Content-Type': MIME['.js'], 'Cache-Control': cache });
        }
      }
      const buf = Buffer.from(body, 'utf8');
      const acceptGz = /\bgzip\b/i.test(req.headers['accept-encoding'] || '');
      if (acceptGz) {
        gzipBuf(buf)
          .then(gz => sendGz(res, MIME['.js'], cache, gz))
          .catch(() => { res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': cache, 'Content-Length': buf.length }); res.end(buf); });
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': cache, 'Content-Length': buf.length });
      res.end(buf);
    });
    return;
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return missing(res, name, rawName);
    const ext = path.extname(file).toLowerCase();
    const acceptGz = /\bgzip\b/i.test(req.headers['accept-encoding'] || '');
    /* 入口 HTML 注入云端进度，首屏即为最新状态，无需额外请求 */
    if (ext === '.html' && (name === '/index.html' || name === '/english/index.html')) {
      fs.readFile(file, 'utf8', (e2, html) => {
        if (e2) return send(res, 500, 'read error');
        const out = html.replace('<head>', '<head>' + bootScript(cu));
        const body = Buffer.from(out, 'utf8');
        const cache = ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable';
        if (acceptGz && COMPRESSIBLE.has(ext)) {
          gzipBuf(body).then(gz => sendGz(res, MIME['.html'], cache, gz)).catch(() => { res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': cache, 'Content-Length': body.length }); res.end(body); });
        } else {
          res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': cache, 'Content-Length': body.length });
          res.end(body);
        }
      });
      return;
    }
    /* 带版本号的可缓存资源长期 immutable；图片等 1 天；HTML 不缓存（入口需即时更新） */
    /* sw.js / manifest 必须每次回源校验，否则桌面小组件永远拿不到更新 */
    const cache = protectedAsset ? 'private, no-store'
                : (name === '/sw.js' || name === '/data.js' || ext === '.webmanifest' || ext === '.zip' || ext === '.apk') ? 'no-cache'
                : (ext === '.js' || ext === '.css') ? 'public, max-age=31536000, immutable'
                : (ext === '.html') ? 'no-cache'
                : 'public, max-age=86400';
    /* 文本类资源压缩传输；不支持 gzip 或有 range 请求（音视频/PDF）时走原始流式 */
    if (acceptGz && COMPRESSIBLE.has(ext) && !req.headers.range) {
      const key = file + ':' + st.size + ':' + st.mtimeMs;
      const cached = gzCache.get(key);
      if (cached) return sendGz(res, MIME[ext] || 'application/octet-stream', cache, cached);
      fs.readFile(file, (e3, buf) => {
        if (e3) return send(res, 500, 'read error');
        gzipBuf(buf).then(gz => {
          if (gzCache.size >= 40) gzCache.clear();
          gzCache.set(key, gz);
          sendGz(res, MIME[ext] || 'application/octet-stream', cache, gz);
        }).catch(() => sendRaw(res, MIME[ext] || 'application/octet-stream', cache, file, st, req));
      });
      return;
    }
    sendRaw(res, MIME[ext] || 'application/octet-stream', cache, file, st, req);
  });
}
function missing(res, name, rawName) {
  const rel = name.slice(1), raw = (rawName || name).slice(1);
  if (skipped.has(rel) || skipped.has(raw) || isExcludedPath(rel) || isExcludedPath(raw)) {
    const safe = rel.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return send(res, 404, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>文件未上传线上版</title><body style="font-family:system-ui,'Microsoft YaHei',sans-serif;background:#f3f7fc;color:#17365e;padding:40px;line-height:1.9">
<div style="max-width:560px;margin:auto;background:#fff;border:1px solid #d5e3f2;border-radius:14px;padding:30px">
<h2 style="margin-top:0">这个文件没有放到线上版</h2><p>这份资料尚未随当前版本发布，暂时无法在线预览或下载。</p>
<p style="color:#5a7392;word-break:break-all">文件名：${safe}</p><p>请返回课程页面查看已上线的资料。</p>
<a href="javascript:history.back()" style="color:#1c4375">← 返回上一页</a></div></body></html>`);
  }
  send(res, 404, '<!doctype html><meta charset="utf-8"><body style="font-family:system-ui,sans-serif;padding:40px;color:#17365e"><h2>文件不存在</h2><p>请返回上一页重试。</p></body>');
}

/* ===================== 注册 / 角色 / 积分 / AI 额度 API（2026-11-14） =====================
   全部只读签名 Cookie 判定身份，前端传来的 role/user/uid 一律不参与授权。 */
/* 正式站经平台网关转发后，req.headers.host 会被改写成内部地址，而浏览器
   同源请求带的 Origin 仍是对外域名。旧实现直接比对两者，导致线上所有写入
   接口（注册 / 授权 / 积分 / 领票）一律 403「请求来源校验未通过」，
   本地 localhost 却测不出来。这里改为：Origin/Referer 的 host 命中
   「本机看到的 host」或「已知对外域名」即放行；Sec-Fetch-Site:cross-site
   仍一律拒绝。Cookie 是 SameSite=Lax，跨站 POST 本来就不会带登录态。 */
const PUBLIC_HOSTS = new Set(['liora-study-hall.app.workbuddy.host']);
(function () {
  const extra = String(process.env.LIORA_PUBLIC_HOST || '').split(',');
  extra.forEach(function (x) { const v = x.trim().toLowerCase(); if (v) PUBLIC_HOSTS.add(v); });
})();
function sameSite(req) {
  const h = req.headers || {};
  if (h['sec-fetch-site'] === 'cross-site') return false;
  const o = h.origin || h.referer || '';
  if (!o) return true;
  let host;
  try { host = new url.URL(o).host.toLowerCase(); } catch (e) { return false; }
  if (String(h.host || '').toLowerCase() === host) return true;
  if (PUBLIC_HOSTS.has(host)) return true;
  /* 有些网关会把对外域名放在 x-forwarded-host 里 */
  const fwd = String(h['x-forwarded-host'] || '').split(',')[0].trim().toLowerCase();
  return !!(fwd && (fwd === host || PUBLIC_HOSTS.has(fwd)));
}
async function apiBody(req, limit) {
  let raw;
  try { raw = await readBody(req, limit || 8192); } catch (e) { return null; }
  try { return JSON.parse(raw || '{}'); } catch (e) { return null; }
}
function guardApi(req, res) {
  if (!sameSite(req) || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
    json(res, 403, { ok: false, error: '请求来源校验未通过' });
    return false;
  }
  return true;
}

/* 注册：公开，但做基础频率限制 + 手机号/密码校验 */
async function handleRegister(req, res, ip) {
  if (rateLimited(ip)) return json(res, 429, { ok: false, error: '操作太频繁，请稍等 1 分钟再试' });
  if (!guardApi(req, res)) return;
  const b = await apiBody(req, 4096);
  if (!b) return json(res, 400, { ok: false, error: '请求内容无法解析' });
  const r = ACCOUNTS.register(b);
  if (!r.ok) { noteFail(ip); return json(res, 400, { ok: false, error: r.error }); }
  failed.delete(ip);
  const cookie = `${COOKIE}=${encodeURIComponent(makeToken(r.phone))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
  aiLog('REGISTER', req, r.phone, 'new user');
  return json(res, 200, { ok: true, user: r.phone, redirect: '/english/index.html' }, { 'Set-Cookie': cookie });
}

/* 当前身份（前端渲染导航、额度面板用） */
function handleMe(req, res, cu) {
  const role = roleOf(cu);
  return json(res, 200, {
    ok: true, user: cu, role: role,
    roleLabel: ({ admin: '管理员', premium: '高级会员', member: '会员', user: '用户', legacy: '账号' })[role] || '账号',
    accountStatus: ACCOUNTS.status(cu, role),
    canAdmin: role === ROLES.ADMIN
  });
}

/* 管理后台：只有管理员 */
async function handleAdmin(req, res, cu, name) {
  if (roleOf(cu) !== ROLES.ADMIN) return json(res, 403, { ok: false, error: '仅管理员可使用' });
  if (name === '/__api/admin/accounts' && req.method === 'GET') {
    return json(res, 200, { ok: true, accounts: ACCOUNTS.list(), overview: ACCOUNTS.overview() });
  }
  if (req.method !== 'POST' || !guardApi(req, res)) return json(res, 405, { ok: false, error: '不支持的请求' });
  const b = await apiBody(req);
  if (!b) return json(res, 400, { ok: false, error: '请求内容无法解析' });
  if (name === '/__api/admin/role') {
    const r = ACCOUNTS.setRole(String(b.key || ''), String(b.role || ''));
    aiLog('ADMIN_ROLE', req, cu, String(b.key || '') + ':' + String(b.role || ''));
    return json(res, r.ok ? 200 : 400, r);
  }
  if (name === '/__api/admin/status') {
    const r = ACCOUNTS.setStatus(String(b.key || ''), String(b.status || ''));
    aiLog('ADMIN_STATUS', req, cu, String(b.key || '') + ':' + String(b.status || ''));
    return json(res, r.ok ? 200 : 400, r);
  }
  if (name === '/__api/admin/remove') {
    const r = ACCOUNTS.remove(String(b.key || ''));
    aiLog('ADMIN_REMOVE', req, cu, String(b.key || '') + (r.ok ? ':ok' : ':fail'));
    return json(res, r.ok ? 200 : 400, r);
  }
  return json(res, 404, { ok: false, error: 'unknown_action' });
}

/* 积分：背单词上报 / 领取 / 兑换 */
async function handlePoints(req, res, cu, name) {
  const role = roleOf(cu);
  if (name === '/__api/points/status' && req.method === 'GET') {
    return json(res, 200, Object.assign({ ok: true }, ACCOUNTS.status(cu, role)));
  }
  if (req.method !== 'POST' || !guardApi(req, res)) return json(res, 405, { ok: false, error: '不支持的请求' });
  const b = await apiBody(req);
  if (!b) return json(res, 400, { ok: false, error: '请求内容无法解析' });
  let r;
  if (name === '/__api/points/words') r = ACCOUNTS.addWords(cu, role, b.n);
  else if (name === '/__api/points/claim') r = ACCOUNTS.claim(cu, role);
  else if (name === '/__api/points/redeem') r = ACCOUNTS.redeem(cu, role);
  else return json(res, 404, { ok: false, error: 'unknown_action' });
  return json(res, r.ok ? 200 : 400, r);
}

/* AI 领票：主站 AI 助手走云端模型，前端提问前先向服务端领一张票。
   服务端按角色与当日额度硬判断并预扣，前端拿不到票就不发模型请求。
   管理员：不限；高级会员：每天 0.1 元；会员：只能是积分兑换来的额度；用户/旧账号：拒绝。 */
function handleAITicket(req, res, cu) {
  const role = roleOf(cu);
  const st = ACCOUNTS.status(cu, role);
  if (role === ROLES.ADMIN) return json(res, 200, { ok: true, unlimited: true, left: null });
  if (role !== ROLES.PREMIUM && role !== ROLES.MEMBER) {
    return json(res, 403, { ok: false, error: '当前身份暂不能使用 AI，请联系管理员调整' });
  }
  const left = typeof st.aiLeftCny === 'number' ? st.aiLeftCny : 0;
  if (left < CNY_PER_AI_CALL) {
    return json(res, 403, {
      ok: false, code: 'NO_QUOTA',
      error: role === ROLES.MEMBER
        ? '今日 AI 额度不足，去「英语学习」背满 50 个单词领 10 积分，再兑换 0.01 元额度'
        : '今天的 0.1 元 AI 额度已用完，明天会自动恢复'
    });
  }
  ACCOUNTS.consume(cu, role, CNY_PER_AI_CALL);
  const after = ACCOUNTS.status(cu, role);
  aiLog('AI_TICKET', req, cu, role + ' left=' + (after.aiLeftCny));
  return json(res, 200, { ok: true, left: after.aiLeftCny, cost: CNY_PER_AI_CALL });
}

const server = http.createServer(async (req, res) => {
  let name, rawName;
  try {
    const u = new URL(req.url, 'http://localhost');
    rawName = u.pathname;
    name = decodeURIComponent(u.pathname);
  } catch (e) { return send(res, 400, 'Bad request'); }
  const ip = req.socket.remoteAddress || 'unknown';

  if (name === '/__health') return json(res, 200, { ok: true });

  /* 【安全】已从源码删除、但旧版发布仍残留在沙箱里的文件，一律 404 掉。
     - english/config.local.js：曾把真实 API Key 写进前端，2026-11-08 已删除，
       但发布只做覆盖不做清理，旧文件仍能被直接下载，这里强制屏蔽。
     - cabin-art/banner-*.png：已换成 webp（原 PNG 单张 2MB+），停用避免继续被引用。 */
  const GONE_PATHS = /^\/(?:english\/config\.local\.js|cabin-art\/banner-(?:chapter|courses|daily-brief-painted|english|extra|guide|prep|reading)\.png)$/;
  if (GONE_PATHS.test(name)) {
    return send(res, 404, '<!doctype html><meta charset="utf-8"><title>404</title><body style="font-family:system-ui,-apple-system,sans-serif;padding:40px;color:#17365e;background:#f7fafd"><h2>这个文件已停用</h2><p>它已经从站点里移除。请从首页或导航重新进入。</p><p><a href="/">← 回到学习小屋</a></p></body>');
  }
  /* 注册接口公开（免登录），但自身带频率限制 */
  if (name === '/__api/register' && req.method === 'POST') return handleRegister(req, res, ip);
  if (name === '/__login' && req.method === 'GET') return send(res, 200, loginPage(''));
  if (name === '/__login' && req.method === 'POST') {
    if (rateLimited(ip)) {
      const msg = '尝试次数过多，请稍等 1 分钟再试';
      if ((req.headers.accept || '').includes('application/json')) return json(res, 429, { ok: false, error: msg });
      return send(res, 429, loginPage(msg));
    }
    let body = '';
    try { body = await readBody(req, 4096); } catch (e) { return json(res, 413, { ok: false }); }
    let u = '', p = '';
    try { const j = JSON.parse(body); u = j.u || ''; p = j.p || ''; }
    catch (e) { const q = new url.URLSearchParams(body); u = q.get('u') || ''; p = q.get('p') || ''; }
    /* 手机输入法/密码管理器很容易在账号末尾带一个空格，导致「明明密码对却登不上」。
       账号与密码一律去掉首尾空白（本站密码不含空格，去掉更安全）；账号忽略大小写。 */
    u = String(u).trim();
    p = String(p).trim();
    const usr = findUser(u);
    if (usr && checkPass(usr, p)) {
      failed.delete(ip);
      ACCOUNTS.noteLogin(usr.user);
      const cookie = `${COOKIE}=${encodeURIComponent(makeToken(usr.user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
      /* 「用户」身份登录后直接落到英语学习台（它唯一能看的页面） */
      const dest = roleOf(usr.user) === ROLES.USER ? '/english/index.html' : '/';
      if ((req.headers.accept || '').includes('application/json')) return json(res, 200, { ok: true, user: usr.user, ai: !!usr.ai, redirect: dest }, { 'Set-Cookie': cookie });
      return send(res, 302, '', { Location: dest, 'Set-Cookie': cookie });
    }
    noteFail(ip);
    const msg = '账号或密码不正确，请再试一次';
    if ((req.headers.accept || '').includes('application/json')) return json(res, 401, { ok: false, error: msg });
    return send(res, 401, loginPage(msg));
  }
  if (name === '/__logout') return send(res, 302, '', {
    Location: '/__login', 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  });

  /* 以下均需登录 */
  const cu = userOf(cookieOf(req));
  const curAI = !!(findUser(cu) || {}).ai;
  if (cu && !curAI && OWNER_RE.test(name)) {
    return send(res, 403, '<!doctype html><meta charset="utf-8"><body style="font-family:system-ui,sans-serif;padding:40px;color:#17365e"><h2>该栏目仅限主人账号</h2><p>「课外拓展」仅主人账号（Liora）可见。如需查看，请切换为主人账号登录。</p><p><a href="/__logout">切换账号</a></p></body>');
  }
  /* PWA 安装与桌面小组件下载包所需的公开资源：
     浏览器抓取 manifest / 图标时不一定携带登录 Cookie，下载包也不含任何用户数据，
     放行即可；否则「安装到桌面」和「下载桌面小组件」都会失败。 */
  /* 城堡徽章图标位于 cabin-art/（发布瘦身时该目录被外置过），
     它们是 manifest / apple-touch-icon 引用的公开图标，同样必须免登录。 */
  /* 安卓安装包与它的下载说明页同样免登录：APK 只是访问正式站的空壳，
     内含公钥证书、不含任何账号或课程数据，和上面的桌面下载包性质一致。 */
  /* 注册页 / 安卓下载页都是免登录独立页，它们引用的配图与样式同样必须放行，
     否则页面能开、图带和 CSS 却是 401。cabin-art 下都是纯装饰图，不含用户数据。 */
  if (/^\/(?:android-install\.html|register\.html|page-art\.css|manifest\.webmanifest|sw\.js|favicon\.ico|todo-icon\.svg|todo-icon-(?:192|512|maskable)\.png|cabin-art\/[A-Za-z0-9_.-]+\.(?:webp|png|jpe?g|svg)|downloads\/(?:[A-Za-z0-9_.-]+\.zip|LioraTodoSetup\.exe|[A-Za-z0-9_.-]+\.apk))$/.test(name)) {
    return serveFile(req, res, name, rawName, cu);
  }
  if (!cu) {
    if (name.startsWith('/__api/') || name.startsWith('/api/')) {
      if (name === '/api/chat' || name === '/api/ai-info' || name.indexOf('/__api/ai/') === 0) aiLog('DENY_ANON', req, '', name);
      return json(res, 401, { ok: false, error: 'unauthorized' });
    }
    if (/\.(webp|png|jpe?g|svg|gif|ico|css|js|woff2?|webmanifest)$/i.test(name)) return send(res, 401, 'Unauthorized');
    /* 记住原本要打开的站内地址：桌面小卡片登录后要回到待办页，而不是首页 */
    const back = (req.url && req.url.charAt(0) === '/' && req.url.indexOf('//') !== 0) ? req.url : '/';
    return send(res, 302, '', { Location: '/__login?next=' + encodeURIComponent(back) });
  }

  /* ===== 注册账号 / 角色 API（先于页面闸门，需登录） ===== */
  if (name === '/__api/me' && req.method === 'GET') return handleMe(req, res, cu);
  if (name.indexOf('/__api/admin/') === 0) return handleAdmin(req, res, cu, name);
  if (name.indexOf('/__api/points/') === 0) return handlePoints(req, res, cu, name);
  if (name === '/__api/ai/ticket' && req.method === 'POST') {
    if (!guardApi(req, res)) return;
    return handleAITicket(req, res, cu);
  }

  /* ===== 角色硬闸门：服务端按身份决定能不能看到这个页面 ===== */
  const curRole = roleOf(cu);
  if (curRole === ROLES.USER && (name === '/' || name === '/index.html')) {
    return send(res, 302, '', { Location: '/english/index.html' });
  }
  if (!pageAllowed(curRole, name)) {
    const isExtra = OWNER_RE.test(name) || name.toLowerCase().indexOf('/assets/extracurricular_imgs/') === 0;
    const title = isExtra ? '「课外拓展」暂未向你开放' : '这个页面暂未向你开放';
    const hint = isExtra
      ? '课外拓展仅管理员可见。'
      : (curRole === ROLES.USER
          ? '你当前的身份是「用户」，只能使用「英语学习」。需要更多内容请联系管理员为你授权。'
          : '如需访问，请联系管理员。');
    return send(res, 403, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><body style="font-family:system-ui,'Microsoft YaHei',sans-serif;background:#f3f7fc;color:#17365e;padding:40px;line-height:1.9">
<div style="max-width:520px;margin:auto;background:#fff;border:1px solid #d5e3f2;border-radius:14px;padding:30px">
<h2 style="margin-top:0">${title}</h2><p>${hint}</p>
<p style="color:#5a7392">当前身份：${({ admin:'管理员', premium:'高级会员', member:'会员', user:'用户', legacy:'账号' })[curRole] || '账号'}</p>
<p><a href="/english/index.html" style="color:#1c4375">去英语学习 →</a> · <a href="/__logout" style="color:#1c4375">切换账号</a></p></div></body></html>`);
  }
  /* 管理页只有管理员能打开（页面本身不含数据，数据全走 /__api/admin/*） */
  if (name === '/admin.html' && curRole !== ROLES.ADMIN) {
    return send(res, 403, '<!doctype html><meta charset="utf-8"><body style="font-family:system-ui,sans-serif;padding:40px;color:#17365e"><h2>仅管理员可进入</h2><p><a href="/">返回学习小屋</a></p></body>');
  }

  if (name === '/notes-review.html' || name === '/notes-review.js' || name === '/__api/notes-pipeline') {
    if (!curAI) return json(res, 403, {error: 'owner_only'});
    if (name === '/__api/notes-pipeline') return handleNotesPipeline(req, res, new URL(req.url, 'http://localhost'));
  }
  /* AI 设置页：只有白名单里的 uid 能打开（页面本身也不含任何密钥） */
  if (name === '/ai-console.html') {
    if (!isAIOwner(cu)) { aiLog('DENY_CONSOLE', req, cu, ''); return json(res, 403, { error: 'owner_only' }); }
  }

  if (name.startsWith('/__api/boards/')) {
    if (!curAI) return json(res, 403, { error: 'owner_only' });
    const board = name.slice('/__api/boards/'.length);
    if (!Object.hasOwn(BOARDS, board)) return json(res, 404, { error: 'unknown_board' });
    return handleBoard(req, res, board);
  }
  if (name === '/board-editor.html' && !curAI) return json(res, 403, { error: 'owner_only' });
  if (name === '/board-overrides.js' && req.method === 'GET') {
    const overrides = {};
    for (const board of Object.keys(BOARDS)) {
      if (!curAI && board === 'notes-extracurricular') continue;
      try { overrides[board] = boardOverrides(board); }
      catch (error) { console.error('Board read failed:', board, error.code || error.name); }
    }
    return send(res, 200, 'window.LIORA_BOARD_OVERRIDES = ' + JSON.stringify(overrides) + ';',
      { 'Content-Type': MIME['.js'], 'Cache-Control': 'private, no-store' });
  }
  /* ===== 付费 AI 统一闸门：签名 Cookie → 服务端 uid → 白名单 → 额度，缺一不可 =====
     前端传来的 email / role / uid / localStorage 一律不参与判断。 */
  const AI_PATHS = ['/api/chat', '/api/ai-info', '/__api/ai/status', '/__api/ai/config', '/__api/ai/chat', '/__api/ai/logs'];
  if (AI_PATHS.indexOf(name) >= 0) {
    const uid = aiAuthorize(req, res, cu);
    if (!uid) return;
    if (name === '/api/ai-info' && req.method === 'GET') {
      const cfg = loadAICfg();
      return json(res, 200, { ready: !!(cfg && cfg.api_key), model: cfg ? cfg.model : '' });
    }
    if ((name === '/api/chat' || name === '/__api/ai/chat') && req.method === 'POST') {
      return handleAIChat(req, res, cu, uid);
    }
    if (name === '/__api/ai/status' && req.method === 'GET') return handleAIStatus(req, res, uid);
    if (name === '/__api/ai/logs' && req.method === 'GET') return handleAILogs(req, res, uid);
    if (name === '/__api/ai/config' && req.method === 'POST') return handleAIConfig(req, res, cu, uid);
    return json(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  if (name === '/__api/state' && req.method === 'GET') {
    const s = readState(cu);
    return json(res, 200, { ok: true, updatedAt: s.updatedAt || 0, data: s.data || {}, user: cu, ai: !!(findUser(cu) || {}).ai });
  }
  if (name === '/__api/state' && req.method === 'POST') {
    let body = '';
    try { body = await readBody(req, 2 * 1024 * 1024); } catch (e) { return json(res, 413, { ok: false }); }
    let payload;
    try { payload = JSON.parse(body); } catch (e) { return json(res, 400, { ok: false }); }
    const data = sanitizeData(payload.data);
    if (!data) return json(res, 400, { ok: false });
    const cur = readState(cu), now = Math.max(Date.now(), (cur.updatedAt || 0) + 1);
    if (payload.base != null && Number(payload.base) !== (cur.updatedAt || 0)) {
      return json(res, 409, { ok: false, conflict: true, updatedAt: cur.updatedAt, data: cur.data });
    }
    const next = { updatedAt: now, data };
    try { writeState(cu, next); } catch (e) { return json(res, 500, { ok: false }); }
    return json(res, 200, { ok: true, updatedAt: now });
  }

  if (name === '/') name = '/index.html';
  return serveFile(req, res, name, rawName, cu);
});

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
/* 迁移：旧版单账号共享的 state.json -> 主人账号 u_Liora.json（仅执行一次，避免丢进度） */
const LEGACY_STATE = path.join(DATA_DIR, 'state.json');
const OWNER_STATE = path.join(DATA_DIR, 'u_Liora.json');
if (fs.existsSync(LEGACY_STATE) && !fs.existsSync(OWNER_STATE)) {
  try { fs.renameSync(LEGACY_STATE, OWNER_STATE); console.log('Migrated legacy state.json -> u_Liora.json'); }
  catch (e) { console.error('legacy migration failed', e); }
}
server.listen(PORT, '0.0.0.0', () => console.log('Liora Study Hall online: 0.0.0.0:' + PORT));
server.on('error', e => { console.error(e); process.exit(1); });
