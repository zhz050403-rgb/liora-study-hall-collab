/* Liora 的学习小屋 · 线上版服务
   纯 Node 核心模块，无第三方依赖：登录保护 + 静态资源 + 进度云端保存
   多账号：每个账号独立密码与进度，互不干扰；仅主人账号拥有 AI 权限 */
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), url = require('url'), https = require('https'), zlib = require('zlib');

const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
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
  '.zip': 'application/zip', '.rar': 'application/x-rar-compressed'
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
  return USERS.find(x => String(x.user).trim().toLowerCase() === k) || null;
}
function checkPass(usr, p) {
  if (!usr) return false;
  const h = crypto.createHash('sha256').update(usr.salt + '|' + usr.user + '|' + p).digest('hex');
  return safeEq(h, usr.passHash);
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
    const file = boardFile(board), temporary = file + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify(overrides), 'utf8');
    fs.renameSync(temporary, file);
    return json(res, 200, { ok: true, revision: boardRevision(baseline, overrides) });
  } catch (error) {
    console.error('Board update failed:', board, error.code || error.name);
    return json(res, 500, { error: 'board_storage_unavailable' });
  }
}

/* ===================== 本地 AI 问答（移植自 serve_ai.py） ===================== */
function loadAICfg() {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'ai_config.json'), 'utf8')); } catch (e) { return null; }
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
function handleAIChat(req, res) {
  const cfg = loadAICfg();
  if (!cfg || !cfg.api_key) {
    return json(res, 200, { ok: false, error: 'AI 还没配置好。请检查 网站/线上版/ai_config.json（需要 base_url / api_key / model 三项）；保存后直接再问一次即可，配置是每次请求实时读取的，不用重启服务器。' });
  }
  readBody(req, 1 << 20).then(function (raw) {
    let payload;
    try { payload = JSON.parse(raw || '{}'); } catch (e) { return json(res, 200, { ok: false, error: '请求内容无法解析：' + e.message }); }
    const question = (payload.question || '').trim();
    const context = (payload.context || '').trim();
    const history = Array.isArray(payload.history) ? payload.history : [];
    if (!question) return json(res, 200, { ok: false, error: '问题是空的。' });
    /* 页面上下文合并进同一条 system 消息：部分上游（如 DeepSeek）不接受连续多条 system */
    let systemText = AI_SYSTEM_PROMPT;
    if (context) systemText += '\n\n当前页面上下文（仅用于定位本周/本章内容）：' + context.slice(0, 1500);
    /* 学生学习档案（常驻背景）：让 AI 老师 permanent 知道成绩/薄弱点/错误模式/协作规则，答疑与出题更有针对性 */
    const profileCtx = loadProfileContext();
    if (profileCtx) systemText += '\n\n【学生学习档案（常驻背景，每次都参考）】\n' + profileCtx;
    const messages = [{ role: 'system', content: systemText }];
    history.slice(-6).forEach(function (h) {
      const role = h.role === 'user' ? 'user' : 'assistant';
      const text = (h.content || '').trim();
      if (text) messages.push({ role: role, content: text });
    });
    messages.push({ role: 'user', content: question });
    const upstream = { model: cfg.model || 'TM ·Auto', messages: messages, stream: true };
    /* temperature 只在配置里显式写了才发送：DeepSeek 思考模式下该参数无效 */
    if (cfg.temperature != null) upstream.temperature = cfg.temperature;
    /* 厂商特有参数由 ai_config.json 的 extra_body 透传，例如 DeepSeek 关闭思考模式：
       "extra_body": { "thinking": { "type": "disabled" } } —— 不需要为换模型改代码 */
    if (cfg.extra_body && typeof cfg.extra_body === 'object' && !Array.isArray(cfg.extra_body)) {
      Object.keys(cfg.extra_body).forEach(function (k) { upstream[k] = cfg.extra_body[k]; });
    }
    let upUrl;
    try { upUrl = new url.URL((cfg.base_url || '').replace(/\/+$/, '') + '/chat/completions'); } catch (e) { return json(res, 200, { ok: false, error: 'ai_config.json 里的 base_url 不是合法网址：' + cfg.base_url }); }
    const reqData = JSON.stringify(upstream);
    const options = {
      method: 'POST',
      hostname: upUrl.hostname,
      port: upUrl.port || (upUrl.protocol === 'https:' ? 443 : 80),
      path: upUrl.pathname + upUrl.search,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.api_key,
        'Accept-Encoding': 'identity',
        'Content-Length': Buffer.byteLength(reqData)
      }
    };
    const proto = upUrl.protocol === 'https:' ? https : http;
    const upReq = proto.request(options, function (upRes) {
      if (upRes.statusCode !== 200) {
        let buf = '';
        upRes.on('data', function (c) { buf += c; });
        upRes.on('end', function () { json(res, 200, { ok: false, error: '模型服务返回错误 HTTP ' + upRes.statusCode + '：' + (buf || '').slice(0, 400) }); });
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', 'Connection': 'close' });
      upRes.on('data', function (chunk) { res.write(chunk); });
      upRes.on('end', function () { try { res.end(); } catch (e) {} });
      upRes.on('error', function () { try { res.end(); } catch (e) {} });
    });
    upReq.on('error', function (e) { json(res, 200, { ok: false, error: '连不上模型服务（可能是断网或地址失效）：' + e.message }); });
    upReq.setTimeout(180000, function () { if (upReq.abort) upReq.abort(); });
    upReq.write(reqData);
    upReq.end();
  }).catch(function (e) { json(res, 200, { ok: false, error: '读取请求失败：' + e.message }); });
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
<div class="foot">仅限本人使用 · 登录后 90 天内不用重复输入<br>学习记录先存在这台设备的浏览器里；点首页下方「同步」可上传云端，换设备时用同一账号同步回来</div></form>
<script>
document.getElementById('f').addEventListener('submit',function(ev){
 ev.preventDefault();var b=document.getElementById('go'),e=document.getElementById('err');
 b.disabled=true;e.textContent='';
 fetch('/__login',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
  body:JSON.stringify({u:document.getElementById('u').value,p:document.getElementById('p').value})})
 .then(function(r){return r.json().then(function(j){return {s:r.status,j:j}})})
 .then(function(x){if(x.j.ok){
  var n='/';try{var q=new URLSearchParams(location.search).get('next');
   if(q&&q.charAt(0)==='/'&&q.indexOf('//')!==0)n=q;}catch(err){}
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
  const payload = JSON.stringify({ ok: true, updatedAt: s.updatedAt || 0, data: s.data || {}, user: u || '', ai: !!usr.ai }).replace(/</g, '\\u003c');
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
                : (name === '/sw.js' || name === '/data.js' || ext === '.webmanifest' || ext === '.zip') ? 'no-cache'
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
      const cookie = `${COOKIE}=${encodeURIComponent(makeToken(usr.user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
      if ((req.headers.accept || '').includes('application/json')) return json(res, 200, { ok: true, user: usr.user, ai: !!usr.ai }, { 'Set-Cookie': cookie });
      return send(res, 302, '', { Location: '/', 'Set-Cookie': cookie });
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
  if (/^\/(manifest\.webmanifest|sw\.js|favicon\.ico|todo-icon\.svg|todo-icon-(192|512|maskable)\.png|cabin-art\/crest-(icon-(192|512|maskable-512)|apple-touch-180)\.png|cabin-art\/crest\.webp|downloads\/(?:[A-Za-z0-9_.-]+\.zip|LioraTodoSetup\.exe))$/.test(name)) {
    return serveFile(req, res, name, rawName, cu);
  }
  if (!cu) {
    if (name.startsWith('/__api/') || name.startsWith('/api/')) return json(res, 401, { ok: false, error: 'unauthorized' });
    if (/\.(webp|png|jpe?g|svg|gif|ico|css|js|woff2?|webmanifest)$/i.test(name)) return send(res, 401, 'Unauthorized');
    /* 记住原本要打开的站内地址：桌面小卡片登录后要回到待办页，而不是首页 */
    const back = (req.url && req.url.charAt(0) === '/' && req.url.indexOf('//') !== 0) ? req.url : '/';
    return send(res, 302, '', { Location: '/__login?next=' + encodeURIComponent(back) });
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
  if ((name === '/api/chat' || name === '/api/ai-info') && !curAI) return json(res, 403, { ok: false, error: '该功能仅限主人账号' });
  /* AI 接口仅限已登录的主人账号。 */
  if (name === '/api/ai-info' && req.method === 'GET') {
    const cfg = loadAICfg();
    return json(res, 200, cfg && cfg.api_key ? { ready: true, model: cfg.model || '' } : { ready: false, model: '', reason: '缺少 ai_config.json 或其中没有 api_key' });
  }
  if (name === '/api/chat' && req.method === 'POST') {
    return handleAIChat(req, res);
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
