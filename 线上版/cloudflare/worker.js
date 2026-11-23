/* Liora 学习小屋 · Cloudflare Workers 多账号生产服务端
   - 唯一超级管理员（env.AUTH_USER / env.AUTH_PASS_HASH，永不入库、不可删除）
   - 极简自主注册（/__register：仅用户名 + 密码，默认待管理员审核 status='pending'）
   - 严格权限边界（普通账号默认关闭课外拓展；管理员专属 /__api/admin/* 接口严格 403 硬隔离）
   - 100% 账号数据物理隔离（state:<uid> / study:<uid> 强制按签名 Cookie 解析的 uid 读写）
   - 全站彩色高光标注增删改查（含上下文 prefix/suffix 锚点与颜色/批注编辑） */

const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];
const VALID_GRADE_SOURCES = new Set(['official', 'self_reported', 'practice', 'ai_estimate']);
const VALID_HL_COLORS = new Set(['yellow', 'green', 'blue', 'pink', 'gold', 'rose']);
const COOKIE_NAME = 'liora_cf_sid';
const SESSION_TTL_SEC = 60 * 60 * 24 * 30;
const REGISTRY_KEY = 'users:registry';
const ADMIN_UID = 'admin';

const DEFAULT_STUDENT_PERMS = {
  courses: true,
  reading: true,
  extra: false,      // 普通账号默认不可看课外拓展，需管理员显式授权
  english: true,
  highlight: true,
  ai: false
};

const ADMIN_PERMS = {
  courses: true,
  reading: true,
  extra: true,
  english: true,
  highlight: true,
  ai: true
};

const PUBLIC_PATHS = new Set([
  '/__health',
  '/__login',
  '/__register',
  '/__logout',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/cloud-config.js'
]);

const PUBLIC_PREFIXES = [
  '/styles/theme.css',
  '/styles/editorial.css',
  '/cabin-art/crest'
];

const enc = new TextEncoder();

function jsonRes(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

function redirectRes(loc, extraHeaders = {}) {
  return new Response(null, {
    status: 302,
    headers: { Location: loc, 'Cache-Control': 'no-store', ...extraHeaders }
  });
}

function hexFromBuf(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function bytesFromHex(hex) {
  const s = String(hex || '').trim();
  if (!s || s.length % 2 !== 0) return null;
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) {
    const v = parseInt(s.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(v)) return null;
    out[i] = v;
  }
  return out;
}

function timingSafeEqualBytes(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function randomId(prefix) {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return prefix + hexFromBuf(bytes);
}

function beijingDay(ts) {
  return new Date((ts || Date.now()) + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

function calcNextReview(stage, nowMs) {
  const idx = Math.max(0, Math.min(REVIEW_INTERVALS_DAYS.length - 1, stage));
  return (nowMs || Date.now()) + REVIEW_INTERVALS_DAYS[idx] * 86400 * 1000;
}

function safeKey(s) {
  return String(s || '').replace(/[^A-Za-z0-9_.@-]/g, '_');
}

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parseCookies(req) {
  const raw = req.headers.get('cookie') || '';
  const map = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) map[k] = v;
  }
  return map;
}

async function hashPassword(pass) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(String(pass || '')), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    256
  );
  return `pbkdf2$${hexFromBuf(salt)}$${hexFromBuf(derived)}`;
}

async function verifyPbkdf2(pass, stored) {
  const parts = String(stored || '').trim().split('$');
  if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false;
  const saltBytes = bytesFromHex(parts[1]);
  const expectedHash = bytesFromHex(parts[2]);
  if (!saltBytes || !expectedHash) return false;
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(String(pass || '')), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    256
  );
  return timingSafeEqualBytes(new Uint8Array(derived), expectedHash);
}

async function hmacSign(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return hexFromBuf(sig);
}

async function makeSessionToken(env, sess) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const obj = { uid: sess.uid, u: sess.user, r: sess.role, tv: Number(sess.tokenVersion) || 1, exp };
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sig = await hmacSign(env.SESSION_SECRET, payload);
  return `${payload}.${sig}`;
}

function normalizePerms(p) {
  return {
    courses: p?.courses !== false,
    reading: p?.reading !== false,
    extra: p?.extra === true,
    english: p?.english !== false,
    highlight: p?.highlight !== false,
    ai: p?.ai === true
  };
}

async function readUsersRegistry(env) {
  if (!env.STUDY_KV) return [];
  const raw = await env.STUDY_KV.get(REGISTRY_KEY, 'json');
  return Array.isArray(raw) ? raw : [];
}

async function writeUsersRegistry(env, list) {
  if (!env.STUDY_KV) return;
  await env.STUDY_KV.put(REGISTRY_KEY, JSON.stringify(list));
}

async function verifySession(req, env) {
  if (!env.SESSION_SECRET) return null;
  const cookies = parseCookies(req);
  const tok = cookies[COOKIE_NAME];
  if (!tok) return null;
  const dot = tok.indexOf('.');
  if (dot <= 0) return null;
  const payload = tok.slice(0, dot);
  const sigHex = tok.slice(dot + 1);
  const expectedHex = await hmacSign(env.SESSION_SECRET, payload);
  if (!timingSafeEqualBytes(bytesFromHex(sigHex), bytesFromHex(expectedHex))) return null;

  let obj;
  try {
    const pad = payload.replace(/-/g, '+').replace(/_/g, '/');
    obj = JSON.parse(decodeURIComponent(escape(atob(pad + '='.repeat((4 - (pad.length % 4)) % 4)))));
  } catch {
    return null;
  }
  if (!obj || !obj.u || Number(obj.exp) < Math.floor(Date.now() / 1000)) return null;

  const adminName = String(env.AUTH_USER || 'Liora').trim();
  if (obj.r === 'admin' || obj.uid === ADMIN_UID || (!obj.uid && obj.u.toLowerCase() === adminName.toLowerCase())) {
    return {
      uid: ADMIN_UID,
      user: adminName,
      role: 'admin',
      status: 'active',
      perms: { ...ADMIN_PERMS },
      canAI: !!(env.AI_API_KEY && env.AI_BASE_URL)
    };
  }

  // Non-admin user: strictly validate active status & tokenVersion against KV registry!
  const users = await readUsersRegistry(env);
  const rec = users.find(x => x.uid === obj.uid);
  if (!rec || rec.status !== 'active') return null;
  if (Number(rec.tokenVersion || 1) !== Number(obj.tv || 1)) return null;

  const perms = normalizePerms(rec.perms);
  return {
    uid: rec.uid,
    user: rec.username,
    role: 'student',
    status: rec.status,
    perms,
    canAI: !!(perms.ai && env.AI_API_KEY && env.AI_BASE_URL)
  };
}

function isSameOriginMutation(req) {
  const sfs = (req.headers.get('sec-fetch-site') || '').toLowerCase();
  if (sfs && sfs !== 'same-origin' && sfs !== 'same-site' && sfs !== 'none') return false;
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

function cookieHeader(token, isHttps, clear = false) {
  const parts = [
    `${COOKIE_NAME}=${clear ? '' : token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${clear ? 0 : SESSION_TTL_SEC}`
  ];
  if (isHttps) parts.push('Secure');
  return parts.join('; ');
}

/* ==================== Auth HTML Pages ==================== */
const AUTH_STYLE = `
  :root{--navy:#0f2744;--gold:#c99b3b;--bg:#f4f7fb;--ink:#1b2c40;--muted:#64778d;--line:#d5e1ee}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(circle at 20% 10%,#e6effa 0%,#f4f7fb 52%,#fbf8f0 100%);font-family:-apple-system,"PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:var(--ink)}
  .card{width:100%;max-width:420px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:30px 28px;box-shadow:0 16px 48px rgba(15,39,68,.1)}
  .crest{width:46px;height:46px;border-radius:12px;background:var(--navy);color:#f4d483;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 12px;box-shadow:0 6px 16px rgba(15,39,68,.2)}
  h1{margin:0;text-align:center;font-size:22px;color:var(--navy);font-family:"Songti SC",Georgia,serif}
  .sub{text-align:center;font-size:13px;color:var(--muted);margin:6px 0 20px}
  label{display:block;font-size:13px;font-weight:600;color:var(--navy);margin:12px 0 6px}
  input{width:100%;height:42px;padding:0 12px;border:1.5px solid var(--line);border-radius:10px;font-size:15px;outline:none;transition:border-color .15s}
  input:focus{border-color:var(--navy)}
  button{width:100%;height:44px;margin-top:20px;border:none;border-radius:10px;background:var(--navy);color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .15s}
  button:hover{opacity:.92}
  .msg{margin-top:12px;padding:10px 12px;border-radius:9px;font-size:13px;line-height:1.55;display:none}
  .msg.err{background:#fdf0ee;border:1px solid #ebb8b2;color:#b4322a}
  .msg.ok{background:#ebf7f1;border:1px solid #a8d8c0;color:#16653e}
  .switch{margin-top:18px;text-align:center;font-size:13px;color:var(--muted)}
  .switch a{color:var(--navy);font-weight:700;text-decoration:none}
  .switch a:hover{text-decoration:underline}
`;

function renderLoginPage(nextPath, errMsg) {
  const safeNext = String(nextPath || '/').startsWith('/') && !String(nextPath || '').startsWith('//') ? String(nextPath) : '/';
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>登录 · Liora 的学习小屋</title><style>${AUTH_STYLE}</style></head>
<body>
  <div class="card">
    <div class="crest">✦</div>
    <h1>Liora 的学习小屋</h1>
    <div class="sub">UNSW Foundation 2026 · 云端学习门户</div>
    <form id="f" method="post" action="/__login">
      <label for="u">用户名</label>
      <input id="u" name="user" type="text" autocomplete="username" placeholder="请输入用户名" required autofocus>
      <label for="p">密码</label>
      <input id="p" name="pass" type="password" autocomplete="current-password" placeholder="请输入密码" required>
      <button type="submit">登录进入学习小屋 →</button>
      <div class="msg err" id="err" style="${errMsg ? 'display:block' : ''}">${escHtml(errMsg || '')}</div>
    </form>
    <div class="switch">还没有账号？ <a href="/__register">点此注册新账号 →</a></div>
  </div>
  <script>
    document.getElementById('f').addEventListener('submit', async function(e){
      e.preventDefault();
      var err = document.getElementById('err');
      err.style.display = 'none';
      var r = await fetch('/__login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          user: document.getElementById('u').value.trim(),
          pass: document.getElementById('p').value,
          next: ${JSON.stringify(safeNext)}
        })
      });
      var j = await r.json().catch(function(){ return {}; });
      if (r.ok && j.ok) { location.href = j.next || '/'; return; }
      err.textContent = j.error || '用户名或密码错误';
      err.style.display = 'block';
    });
  </script>
</body></html>`;
}

function renderRegisterPage() {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>注册账号 · Liora 的学习小屋</title><style>${AUTH_STYLE}</style></head>
<body>
  <div class="card">
    <div class="crest">✦</div>
    <h1>注册新学习账号</h1>
    <div class="sub">只需设置用户名和密码，提交后待管理员同意即可登录</div>
    <form id="rf">
      <label for="ru">用户名（2–24 位，支持中英文、数字、下划线）</label>
      <input id="ru" type="text" autocomplete="username" placeholder="例如：Alice 或 小明" required autofocus>
      <label for="rp">设置密码（至少 6 位）</label>
      <input id="rp" type="password" autocomplete="new-password" placeholder="请输入密码" required>
      <label for="rp2">确认密码</label>
      <input id="rp2" type="password" autocomplete="new-password" placeholder="请再次输入密码" required>
      <button type="submit" id="rbtn">提交注册申请</button>
      <div class="msg err" id="rerr"></div>
      <div class="msg ok" id="rok"></div>
    </form>
    <div class="switch">已有账号？ <a href="/__login">← 返回登录</a></div>
  </div>
  <script>
    document.getElementById('rf').addEventListener('submit', async function(e){
      e.preventDefault();
      var err = document.getElementById('rerr');
      var ok = document.getElementById('rok');
      var btn = document.getElementById('rbtn');
      err.style.display = 'none'; ok.style.display = 'none';
      var u = document.getElementById('ru').value.trim();
      var p1 = document.getElementById('rp').value;
      var p2 = document.getElementById('rp2').value;
      if (p1 !== p2) { err.textContent = '两次输入的密码不一致'; err.style.display = 'block'; return; }
      btn.disabled = true; btn.textContent = '提交中…';
      try {
        var r = await fetch('/__register', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ user: u, pass: p1 })
        });
        var j = await r.json().catch(function(){ return {}; });
        if (r.ok && j.ok) {
          ok.textContent = j.message || '注册申请已提交！请等待管理员审核通过后登录。';
          ok.style.display = 'block';
          document.getElementById('rf').reset();
        } else {
          err.textContent = j.error || '注册失败，请检查输入';
          err.style.display = 'block';
        }
      } catch (ex) {
        err.textContent = '网络异常，请重试';
        err.style.display = 'block';
      }
      btn.disabled = false; btn.textContent = '提交注册申请';
    });
  </script>
</body></html>`;
}

/* ==================== Per-UID Isolated KV Helpers ==================== */
function emptyState() {
  return { updatedAt: 0, data: {} };
}

function emptyStudy() {
  return {
    version: 1,
    updatedAt: 0,
    mistakes: [],
    annotations: [],
    focusSessions: [],
    grades: [],
    flashcards: {},
    dailyFocus: { day: '', items: [] }
  };
}

async function readStateKV(env, uid, legacyAdminName) {
  if (!env.STUDY_KV) return emptyState();
  let raw = await env.STUDY_KV.get(`state:${safeKey(uid)}`, 'json');
  if (!raw && uid === ADMIN_UID && legacyAdminName) {
    raw = await env.STUDY_KV.get(`state:${safeKey(legacyAdminName)}`, 'json');
  }
  if (!raw || typeof raw !== 'object') return emptyState();
  return { updatedAt: Number(raw.updatedAt) || 0, data: raw.data && typeof raw.data === 'object' ? raw.data : {} };
}

async function writeStateKV(env, uid, obj) {
  if (!env.STUDY_KV) return;
  await env.STUDY_KV.put(`state:${safeKey(uid)}`, JSON.stringify(obj));
}

async function readStudyKV(env, uid, legacyAdminName) {
  const base = emptyStudy();
  if (!env.STUDY_KV) return base;
  let raw = await env.STUDY_KV.get(`study:${safeKey(uid)}`, 'json');
  if (!raw && uid === ADMIN_UID && legacyAdminName) {
    raw = await env.STUDY_KV.get(`study:${safeKey(legacyAdminName)}`, 'json');
  }
  if (!raw || typeof raw !== 'object') return base;
  base.updatedAt = Number(raw.updatedAt) || 0;
  if (Array.isArray(raw.mistakes)) base.mistakes = raw.mistakes;
  if (Array.isArray(raw.annotations)) base.annotations = raw.annotations;
  if (Array.isArray(raw.focusSessions)) base.focusSessions = raw.focusSessions;
  if (Array.isArray(raw.grades)) base.grades = raw.grades;
  if (raw.flashcards && typeof raw.flashcards === 'object' && !Array.isArray(raw.flashcards)) base.flashcards = raw.flashcards;
  if (raw.dailyFocus && typeof raw.dailyFocus === 'object') base.dailyFocus = raw.dailyFocus;
  return base;
}

async function writeStudyKV(env, uid, d) {
  if (!env.STUDY_KV) return;
  d.updatedAt = Date.now();
  await env.STUDY_KV.put(`study:${safeKey(uid)}`, JSON.stringify(d));
}

/* ==================== Study & Highlight APIs (Per-UID) ==================== */
async function handleStudyApi(req, url, env, sess) {
  const p = url.pathname;
  const legacy = sess.role === 'admin' ? sess.user : '';

  if (req.method === 'GET' && p === '/__api/study') {
    return jsonRes(await readStudyKV(env, sess.uid, legacy));
  }
  if (req.method === 'GET' && p === '/__api/backup/export') {
    const [state, study] = await Promise.all([readStateKV(env, sess.uid, legacy), readStudyKV(env, sess.uid, legacy)]);
    return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), user: sess.user, state, study }, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="liora-backup-${safeKey(sess.user)}-${beijingDay()}.json"`,
        'Cache-Control': 'no-store'
      }
    });
  }

  if (req.method !== 'POST') return jsonRes({ ok: false, error: 'Method Not Allowed' }, 405);
  if (!isSameOriginMutation(req)) return jsonRes({ ok: false, error: 'Forbidden origin' }, 403);

  let body = {};
  try { body = await req.json(); } catch { return jsonRes({ ok: false, error: 'Invalid JSON' }, 400); }

  if (p === '/__api/backup/import') {
    if (body.state && typeof body.state === 'object' && body.state.data) {
      await writeStateKV(env, sess.uid, { updatedAt: Date.now(), data: body.state.data });
    }
    if (body.study && typeof body.study === 'object') {
      const merged = Object.assign(emptyStudy(), body.study);
      await writeStudyKV(env, sess.uid, merged);
    }
    return jsonRes({ ok: true });
  }

  const d = await readStudyKV(env, sess.uid, legacy);

  if (p === '/__api/study/mistakes') {
    if (body.action === 'delete') {
      const id = String(body.id || '');
      d.mistakes = d.mistakes.filter(x => x.id !== id);
      await writeStudyKV(env, sess.uid, d);
      return jsonRes({ ok: true, deleted: id, total: d.mistakes.length, updatedAt: d.updatedAt });
    }
    if (body.action === 'review') {
      const item = d.mistakes.find(x => x.id === String(body.id || ''));
      if (!item) return jsonRes({ ok: false, error: '错题不存在' }, 404);
      const now = Date.now();
      item.reviewCount = (Number(item.reviewCount) || 0) + 1;
      item.lastReviewedAt = now;
      if (body.passed === true) {
        item.stage = Math.min(REVIEW_INTERVALS_DAYS.length, (Number(item.stage) || 0) + 1);
        item.mastered = item.stage >= REVIEW_INTERVALS_DAYS.length;
        item.nextReviewAt = item.mastered ? 0 : calcNextReview(item.stage, now);
      } else {
        item.stage = 0;
        item.mastered = false;
        item.nextReviewAt = calcNextReview(0, now);
      }
      await writeStudyKV(env, sess.uid, d);
      return jsonRes({ ok: true, item, updatedAt: d.updatedAt });
    }
    const prompt = String(body.prompt || body.question || '').trim().slice(0, 2000);
    if (!prompt) return jsonRes({ ok: false, error: '题干不能为空' }, 400);
    const now = Date.now();
    const id = String(body.id || '').trim() || randomId('m_');
    const existing = d.mistakes.find(x => x.id === id);
    const item = existing || { id, createdAt: now, stage: 0, reviewCount: 0, mastered: false, nextReviewAt: calcNextReview(0, now) };
    item.course = String(body.course || 'general').trim().slice(0, 40);
    item.term = String(body.term || '').trim().slice(0, 24);
    item.week = String(body.week || '').trim().slice(0, 24);
    item.topic = String(body.topic || '').trim().slice(0, 120);
    item.errorTag = String(body.errorTag || (Array.isArray(body.tags) ? body.tags.join(' · ') : '')).trim().slice(0, 100);
    item.prompt = prompt;
    item.myAnswer = String(body.myAnswer || body.myError || '').trim().slice(0, 1200);
    item.correctAnswer = String(body.correctAnswer || body.answer || '').trim().slice(0, 2000);
    item.note = String(body.note || '').trim().slice(0, 1500);
    item.sourceHref = String(body.sourceHref || '').trim().slice(0, 200);
    item.updatedAt = now;
    if (!existing) {
      if (d.mistakes.length >= 2000) return jsonRes({ ok: false, error: '错题本已达上限' }, 400);
      d.mistakes.unshift(item);
    }
    await writeStudyKV(env, sess.uid, d);
    return jsonRes({ ok: true, item, total: d.mistakes.length, updatedAt: d.updatedAt });
  }

  if (p === '/__api/study/annotations') {
    if (!sess.perms.highlight && sess.role !== 'admin') {
      return jsonRes({ ok: false, error: '当前账号未开通高光标注权限' }, 403);
    }
    if (body.action === 'delete') {
      const id = String(body.id || '');
      d.annotations = d.annotations.filter(x => x.id !== id);
      await writeStudyKV(env, sess.uid, d);
      return jsonRes({ ok: true, deleted: id, total: d.annotations.length, updatedAt: d.updatedAt });
    }
    if (body.action === 'update') {
      const id = String(body.id || '');
      const item = d.annotations.find(x => x.id === id);
      if (!item) return jsonRes({ ok: false, error: '高光记录不存在' }, 404);
      if (body.color && VALID_HL_COLORS.has(body.color)) item.color = body.color;
      if (body.note !== undefined) item.note = String(body.note || '').trim().slice(0, 2000);
      if (body.kind && ['highlight', 'note', 'bookmark'].includes(body.kind)) item.kind = body.kind;
      item.updatedAt = Date.now();
      await writeStudyKV(env, sess.uid, d);
      return jsonRes({ ok: true, item, total: d.annotations.length, updatedAt: d.updatedAt });
    }
    const route = String(body.route || '').trim().slice(0, 180);
    const quote = String(body.quote || '').trim().slice(0, 800);
    const note = String(body.note || '').trim().slice(0, 2000);
    if (!route || (!quote && !note)) return jsonRes({ ok: false, error: '标注位置与内容不能为空' }, 400);
    const now = Date.now();
    const item = {
      id: String(body.id || '').trim() || randomId('hl_'),
      route,
      course: String(body.course || '').trim().slice(0, 40),
      title: String(body.title || '').trim().slice(0, 140),
      kind: ['highlight', 'note', 'bookmark'].includes(body.kind) ? body.kind : (quote ? 'highlight' : 'note'),
      quote,
      prefix: String(body.prefix || '').slice(-40),
      suffix: String(body.suffix || '').slice(0, 40),
      note,
      color: VALID_HL_COLORS.has(body.color) ? body.color : 'yellow',
      createdAt: now,
      updatedAt: now
    };
    d.annotations.unshift(item);
    if (d.annotations.length > 3000) d.annotations.length = 3000;
    await writeStudyKV(env, sess.uid, d);
    return jsonRes({ ok: true, item, total: d.annotations.length, updatedAt: d.updatedAt });
  }

  if (p === '/__api/study/focus') {
    if (body.action === 'set_daily') {
      const items = Array.isArray(body.items) ? body.items.slice(0, 6).map((it, i) => ({
        id: String(it.id || ('d' + i)).slice(0, 32),
        text: String(it.text || '').trim().slice(0, 160),
        minutes: Math.max(5, Math.min(240, Number(it.minutes) || 25)),
        done: it.done === true
      })).filter(it => it.text) : [];
      d.dailyFocus = { day: beijingDay(), items };
      await writeStudyKV(env, sess.uid, d);
      return jsonRes({ ok: true, dailyFocus: d.dailyFocus, updatedAt: d.updatedAt });
    }
    const minutes = Math.max(1, Math.min(240, Number(body.minutes) || 25));
    const sessItem = {
      id: randomId('f_'),
      day: beijingDay(),
      course: String(body.course || 'general').trim().slice(0, 40),
      label: String(body.label || body.task || '番茄专注').trim().slice(0, 100),
      minutes,
      at: Date.now()
    };
    d.focusSessions.unshift(sessItem);
    if (d.focusSessions.length > 2000) d.focusSessions.length = 2000;
    await writeStudyKV(env, sess.uid, d);
    return jsonRes({ ok: true, session: sessItem, updatedAt: d.updatedAt });
  }

  if (p === '/__api/study/grades') {
    if (body.action === 'delete') {
      const id = String(body.id || '');
      d.grades = d.grades.filter(x => x.id !== id);
      await writeStudyKV(env, sess.uid, d);
      return jsonRes({ ok: true, deleted: id, updatedAt: d.updatedAt });
    }
    const src = VALID_GRADE_SOURCES.has(body.sourceType) ? body.sourceType : 'self_reported';
    const maxScore = Math.max(1, Number(body.maxScore) || 100);
    const score = Math.max(0, Math.min(maxScore, Number(body.score) || 0));
    const item = {
      id: String(body.id || '').trim() || randomId('g_'),
      course: String(body.course || 'general').trim().slice(0, 40),
      title: String(body.title || '练习记录').trim().slice(0, 120),
      score,
      maxScore,
      pct: Math.round((score / maxScore) * 1000) / 10,
      sourceType: src,
      day: String(body.day || beijingDay()).slice(0, 16),
      note: String(body.note || body.summary || '').trim().slice(0, 800),
      createdAt: Date.now()
    };
    d.grades.unshift(item);
    if (d.grades.length > 500) d.grades.length = 500;
    await writeStudyKV(env, sess.uid, d);
    return jsonRes({ ok: true, item, updatedAt: d.updatedAt });
  }

  if (p === '/__api/study/flashcards') {
    const termId = String(body.termId || '').trim().slice(0, 80);
    if (!termId) return jsonRes({ ok: false, error: 'termId 不能为空' }, 400);
    d.flashcards[termId] = { status: String(body.status || 'known').slice(0, 20), updatedAt: Date.now() };
    await writeStudyKV(env, sess.uid, d);
    return jsonRes({ ok: true, termId, updatedAt: d.updatedAt });
  }

  return jsonRes({ ok: false, error: 'Not Found' }, 404);
}

/* ==================== Admin-Only APIs (Strictly role === 'admin') ==================== */
function summarizeProgress(stateObj, studyObj) {
  let weeksObj = {};
  let tasksObj = {};
  let lastVisit = null;
  try {
    const raw = stateObj?.data?.['xinnan-portal-state-v1'];
    if (raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed && typeof parsed === 'object') {
        weeksObj = parsed.weeks || {};
        tasksObj = parsed.tasks || {};
        lastVisit = parsed.lastVisit || null;
      }
    }
  } catch {}

  const byCourse = { accounting: 0, economics: 0, mathematics: 0, computing: 0, english: 0, extracurricular: 0 };
  const completedKeys = [];
  for (const [k, v] of Object.entries(weeksObj)) {
    if (!v) continue;
    completedKeys.push(k);
    const cid = k.split(':')[0];
    if (Object.prototype.hasOwnProperty.call(byCourse, cid)) byCourse[cid]++;
  }

  const focusMinutes = (studyObj.focusSessions || []).reduce((acc, f) => acc + (Number(f.minutes) || 0), 0);
  const completedTasks = Object.values(tasksObj).filter(Boolean).length;
  const highlightsCount = (studyObj.annotations || []).length;
  const mistakesCount = (studyObj.mistakes || []).length;
  const gradesCount = (studyObj.grades || []).length;
  const flashcardsKnown = Object.values(studyObj.flashcards || {}).filter(x => x && x.status === 'known').length;

  return {
    completedWeeks: completedKeys.length,
    completedTasks,
    byCourse,
    completedKeys: completedKeys.slice(0, 120),
    mistakesCount,
    highlightsCount,
    focusMinutes,
    gradesCount,
    flashcardsKnown,
    lastVisit,
    stateUpdatedAt: stateObj.updatedAt || 0,
    studyUpdatedAt: studyObj.updatedAt || 0
  };
}

async function handleAdminApi(req, url, env, sess) {
  if (sess.role !== 'admin') {
    return jsonRes({ ok: false, error: 'Forbidden: 仅超级管理员有权访问管理接口' }, 403);
  }
  const p = url.pathname;
  const users = await readUsersRegistry(env);

  // GET /__api/admin/users — list all registered users with live progress summary
  if (req.method === 'GET' && p === '/__api/admin/users') {
    const enriched = await Promise.all(users.map(async u => {
      const [st, sd] = await Promise.all([readStateKV(env, u.uid), readStudyKV(env, u.uid)]);
      return {
        uid: u.uid,
        username: u.username,
        role: u.role || 'student',
        status: u.status || 'pending',
        perms: normalizePerms(u.perms),
        createdAt: u.createdAt || 0,
        lastLoginAt: u.lastLoginAt || 0,
        progress: summarizeProgress(st, sd)
      };
    }));
    // Sort: pending first, then active, then disabled, newest first
    const rank = { pending: 0, active: 1, disabled: 2 };
    enriched.sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || (b.createdAt - a.createdAt));
    return jsonRes({
      ok: true,
      admin: { user: sess.user, uid: ADMIN_UID },
      counts: {
        total: enriched.length,
        pending: enriched.filter(x => x.status === 'pending').length,
        active: enriched.filter(x => x.status === 'active').length,
        disabled: enriched.filter(x => x.status === 'disabled').length
      },
      users: enriched
    });
  }

  // Match /__api/admin/users/:uid[/action]
  const m = p.match(/^\/__api\/admin\/users\/([A-Za-z0-9_-]+)(?:\/([a-z-]+))?$/);
  if (!m) return jsonRes({ ok: false, error: 'Not Found' }, 404);
  const targetUid = m[1];
  const action = m[2] || '';
  if (targetUid === ADMIN_UID) {
    return jsonRes({ ok: false, error: '超级管理员账号受保护，不可被修改或删除' }, 400);
  }
  const idx = users.findIndex(u => u.uid === targetUid);
  if (idx === -1) return jsonRes({ ok: false, error: '用户不存在' }, 404);
  const target = users[idx];

  // GET /__api/admin/users/:uid — detailed read-only student view
  if (req.method === 'GET' && !action) {
    const [st, sd] = await Promise.all([readStateKV(env, target.uid), readStudyKV(env, target.uid)]);
    return jsonRes({
      ok: true,
      user: {
        uid: target.uid,
        username: target.username,
        status: target.status,
        perms: normalizePerms(target.perms),
        createdAt: target.createdAt,
        lastLoginAt: target.lastLoginAt
      },
      progress: summarizeProgress(st, sd),
      recentFocus: (sd.focusSessions || []).slice(0, 12),
      recentGrades: (sd.grades || []).slice(0, 12),
      recentHighlights: (sd.annotations || []).slice(0, 15).map(a => ({
        route: a.route, title: a.title, color: a.color, quote: a.quote, note: a.note, createdAt: a.createdAt
      }))
    });
  }

  if (!isSameOriginMutation(req)) return jsonRes({ ok: false, error: 'Forbidden origin' }, 403);

  // DELETE /__api/admin/users/:uid — remove account + wipe isolated KV data
  if (req.method === 'DELETE' && !action) {
    users.splice(idx, 1);
    await writeUsersRegistry(env, users);
    if (env.STUDY_KV) {
      await Promise.all([
        env.STUDY_KV.delete(`state:${safeKey(targetUid)}`),
        env.STUDY_KV.delete(`study:${safeKey(targetUid)}`)
      ]);
    }
    return jsonRes({ ok: true, deleted: targetUid });
  }

  if (req.method !== 'POST') return jsonRes({ ok: false, error: 'Method Not Allowed' }, 405);
  const body = await req.json().catch(() => ({}));

  if (action === 'approve') {
    target.status = 'active';
    target.approvedAt = Date.now();
    await writeUsersRegistry(env, users);
    return jsonRes({ ok: true, uid: targetUid, status: 'active' });
  }

  if (action === 'status') {
    const nextStatus = body.status === 'active' ? 'active' : 'disabled';
    target.status = nextStatus;
    if (nextStatus !== 'active') target.tokenVersion = (Number(target.tokenVersion) || 1) + 1;
    await writeUsersRegistry(env, users);
    return jsonRes({ ok: true, uid: targetUid, status: nextStatus });
  }

  if (action === 'perms') {
    target.perms = normalizePerms(body.perms || body);
    await writeUsersRegistry(env, users);
    return jsonRes({ ok: true, uid: targetUid, perms: target.perms });
  }

  if (action === 'reset-password') {
    const newPass = String(body.password || body.pass || '');
    if (newPass.length < 6 || newPass.length > 72) {
      return jsonRes({ ok: false, error: '新密码长度需在 6–72 位之间' }, 400);
    }
    target.passHash = await hashPassword(newPass);
    target.tokenVersion = (Number(target.tokenVersion) || 1) + 1;
    await writeUsersRegistry(env, users);
    return jsonRes({ ok: true, uid: targetUid });
  }

  return jsonRes({ ok: false, error: 'Unknown admin action' }, 404);
}

/* ==================== Optional AI Proxy ==================== */
async function handleAiApi(req, url, env, sess) {
  const ready = !!(env.AI_API_KEY && env.AI_BASE_URL && (sess.role === 'admin' || sess.perms.ai));
  if (url.pathname === '/api/ai-info' || url.pathname === '/__api/ai/ping') {
    return jsonRes({ ok: true, ready, configured: !!(env.AI_API_KEY && env.AI_BASE_URL), model: ready ? (env.AI_MODEL || 'default') : '' });
  }
  if (!ready) {
    return jsonRes({ ok: false, error: 'AI 伴学未开通或尚未配置密钥' }, 403);
  }
  if (!isSameOriginMutation(req)) return jsonRes({ ok: false, error: 'Forbidden origin' }, 403);
  let body = {};
  try { body = await req.json(); } catch { return jsonRes({ ok: false, error: 'Invalid JSON' }, 400); }

  const messages = Array.isArray(body.messages) ? body.messages : [
    {
      role: 'system',
      content: '你是 UNSW Foundation 预科学生的私人学习伴学助手。专业术语保留英文并附中文解释。' +
        (body.context ? '\n当前学习页面上下文：' + String(body.context).slice(0, 1400) : '')
    },
    ...(Array.isArray(body.history) ? body.history.slice(-6) : []),
    { role: 'user', content: String(body.question || '').trim() }
  ];

  const upstream = await fetch(String(env.AI_BASE_URL).replace(/\/+$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.AI_API_KEY}` },
    body: JSON.stringify({ model: env.AI_MODEL || 'gpt-4o-mini', messages, stream: true })
  });
  if (!upstream.ok || !upstream.body) {
    return jsonRes({ ok: false, error: `上游 AI 服务返回 HTTP ${upstream.status}` }, 502);
  }
  return new Response(upstream.body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

/* ==================== Main Worker Fetch Handler ==================== */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;
    const isHttps = url.protocol === 'https:';

    if (p === '/__health') {
      return jsonRes({ ok: true, runtime: 'cloudflare-workers', multiUser: true, ts: Date.now() });
    }

    if (p === '/cloud-config.js') {
      return new Response('window.__CLOUD_CONFIG__ = {};\n', {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
      });
    }

    /* Registration: Username + Password only, defaults to pending admin approval */
    if (p === '/__register') {
      if (request.method === 'GET') {
        return new Response(renderRegisterPage(), {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }
      if (request.method === 'POST') {
        if (!isSameOriginMutation(request)) return jsonRes({ ok: false, error: 'Forbidden origin' }, 403);
        const body = await request.json().catch(() => ({}));
        const username = String(body.user || body.username || '').trim();
        const pass = String(body.pass || body.password || '');
        if (!/^[\u4e00-\u9fa5A-Za-z0-9_.-]{2,24}$/.test(username)) {
          return jsonRes({ ok: false, error: '用户名需为 2–24 位中英文、数字或下划线' }, 400);
        }
        if (pass.length < 6 || pass.length > 72) {
          return jsonRes({ ok: false, error: '密码长度需在 6–72 位之间' }, 400);
        }
        const adminName = String(env.AUTH_USER || 'Liora').trim();
        const lower = username.toLowerCase();
        if (lower === adminName.toLowerCase() || lower === 'admin' || lower === 'administrator') {
          return jsonRes({ ok: false, error: '该用户名已被系统保留，请换一个用户名' }, 409);
        }
        const users = await readUsersRegistry(env);
        if (users.some(u => (u.usernameLower || u.username.toLowerCase()) === lower)) {
          return jsonRes({ ok: false, error: '该用户名已被注册，请换一个用户名' }, 409);
        }
        if (users.length >= 500) {
          return jsonRes({ ok: false, error: '当前注册人数已达上限，请联系管理员' }, 400);
        }
        const passHash = await hashPassword(pass);
        const rec = {
          uid: randomId('u_'),
          username,
          usernameLower: lower,
          passHash,
          role: 'student',
          status: 'pending',
          tokenVersion: 1,
          perms: { ...DEFAULT_STUDENT_PERMS },
          createdAt: Date.now(),
          lastLoginAt: 0
        };
        users.push(rec);
        await writeUsersRegistry(env, users);
        return jsonRes({
          ok: true,
          pending: true,
          message: '注册申请已提交！您的账号需要管理员审核同意后才可登录，审核通过后请用刚才的用户名和密码直接登录。'
        }, 201);
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    /* Login & Logout */
    if (p === '/__login') {
      if (request.method === 'GET') {
        const cur = await verifySession(request, env);
        const next = url.searchParams.get('next') || '/';
        if (cur) return redirectRes(next.startsWith('/') && !next.startsWith('//') ? next : '/');
        return new Response(renderLoginPage(next, ''), {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }
      if (request.method === 'POST') {
        const ct = (request.headers.get('content-type') || '').toLowerCase();
        let user = '', pass = '', next = '/';
        if (ct.includes('application/json')) {
          const j = await request.json().catch(() => ({}));
          user = j.user || ''; pass = j.pass || ''; next = j.next || '/';
        } else {
          const fd = await request.formData().catch(() => null);
          if (fd) { user = String(fd.get('user') || ''); pass = String(fd.get('pass') || ''); next = String(fd.get('next') || '/'); }
        }
        const safeNext = String(next).startsWith('/') && !String(next).startsWith('//') ? String(next) : '/';
        const inputLower = String(user || '').trim().toLowerCase();
        const adminName = String(env.AUTH_USER || 'Liora').trim();

        // 1. Check Super Admin first
        if (inputLower && timingSafeEqualBytes(enc.encode(inputLower), enc.encode(adminName.toLowerCase()))) {
          const passOk = await verifyPbkdf2(pass, env.AUTH_PASS_HASH);
          if (!passOk) {
            return ct.includes('application/json')
              ? jsonRes({ ok: false, error: '用户名或密码错误' }, 401)
              : new Response(renderLoginPage(safeNext, '用户名或密码错误'), { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
          }
          const tok = await makeSessionToken(env, { uid: ADMIN_UID, user: adminName, role: 'admin', tokenVersion: 1 });
          const hdr = { 'Set-Cookie': cookieHeader(tok, isHttps, false) };
          return ct.includes('application/json') ? jsonRes({ ok: true, user: adminName, role: 'admin', next: safeNext }, 200, hdr) : redirectRes(safeNext, hdr);
        }

        // 2. Check Registered Students in KV
        const users = await readUsersRegistry(env);
        const rec = users.find(u => (u.usernameLower || u.username.toLowerCase()) === inputLower);
        if (!rec || !(await verifyPbkdf2(pass, rec.passHash))) {
          return ct.includes('application/json')
            ? jsonRes({ ok: false, error: '用户名或密码错误' }, 401)
            : new Response(renderLoginPage(safeNext, '用户名或密码错误'), { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        if (rec.status === 'pending') {
          const msg = '您的账号正在等待管理员审核同意，通过后即可登录';
          return ct.includes('application/json')
            ? jsonRes({ ok: false, pending: true, error: msg }, 403)
            : new Response(renderLoginPage(safeNext, msg), { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        if (rec.status !== 'active') {
          const msg = '该账号已被管理员停用，如有疑问请联系管理员';
          return ct.includes('application/json')
            ? jsonRes({ ok: false, error: msg }, 403)
            : new Response(renderLoginPage(safeNext, msg), { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        rec.lastLoginAt = Date.now();
        ctx.waitUntil(writeUsersRegistry(env, users));
        const tok = await makeSessionToken(env, { uid: rec.uid, user: rec.username, role: 'student', tokenVersion: rec.tokenVersion || 1 });
        const hdr = { 'Set-Cookie': cookieHeader(tok, isHttps, false) };
        return ct.includes('application/json') ? jsonRes({ ok: true, user: rec.username, role: 'student', next: safeNext }, 200, hdr) : redirectRes(safeNext, hdr);
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (p === '/__logout') {
      return redirectRes('/__login', { 'Set-Cookie': cookieHeader('', isHttps, true) });
    }

    /* Public unauthenticated whitelist */
    const isPublicAsset = PUBLIC_PATHS.has(p) || PUBLIC_PREFIXES.some(pre => p.startsWith(pre));
    const sess = await verifySession(request, env);
    if (!sess && !isPublicAsset) {
      if (p.startsWith('/__api/') || p.startsWith('/api/') || p.startsWith('/data-chunks/')) {
        return jsonRes({ ok: false, error: 'Unauthorized' }, 401);
      }
      return redirectRes(`/__login?next=${encodeURIComponent(p + url.search)}`);
    }

    /* Authenticated APIs */
    if (p === '/__api/me') {
      return jsonRes({
        ok: true,
        loggedIn: true,
        uid: sess.uid,
        user: sess.user,
        role: sess.role,
        perms: sess.perms,
        personalMode: true,
        canAI: sess.canAI
      });
    }

    if (p.startsWith('/__api/admin/')) {
      return handleAdminApi(request, url, env, sess);
    }

    if (p === '/__api/state') {
      const legacy = sess.role === 'admin' ? sess.user : '';
      if (request.method === 'GET') {
        return jsonRes(await readStateKV(env, sess.uid, legacy));
      }
      if (request.method === 'POST') {
        if (!isSameOriginMutation(request)) return jsonRes({ ok: false, error: 'Forbidden origin' }, 403);
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') return jsonRes({ ok: false, error: 'Invalid JSON' }, 400);
        const cur = await readStateKV(env, sess.uid, legacy);
        const base = Number(body.base) || 0;
        if (cur.updatedAt && base && base < cur.updatedAt) {
          return jsonRes({ ok: false, conflict: true, updatedAt: cur.updatedAt, data: cur.data }, 409);
        }
        const nextObj = { updatedAt: Date.now(), data: body.data && typeof body.data === 'object' ? body.data : {} };
        await writeStateKV(env, sess.uid, nextObj);
        return jsonRes({ ok: true, updatedAt: nextObj.updatedAt });
      }
      return jsonRes({ ok: false, error: 'Method Not Allowed' }, 405);
    }

    if (p.startsWith('/__api/study') || p.startsWith('/__api/backup/')) {
      return handleStudyApi(request, url, env, sess);
    }

    if (p === '/api/ai-info' || p.startsWith('/__api/ai/')) {
      return handleAiApi(request, url, env, sess);
    }

    if (p.startsWith('/__api/boards/')) {
      if (request.method !== 'GET' && sess.role !== 'admin') {
        return jsonRes({ ok: false, error: 'Forbidden: 仅管理员可编辑公共内容板块' }, 403);
      }
      const bid = p.slice('/__api/boards/'.length).replace(/[^A-Za-z0-9_-]/g, '');
      if (!bid) return jsonRes({ ok: false, error: 'Invalid board id' }, 400);
      if (request.method === 'GET') {
        const data = env.STUDY_KV ? await env.STUDY_KV.get(`board:${bid}`, 'json') : null;
        return jsonRes({ ok: true, id: bid, patch: data || null });
      }
      if (!isSameOriginMutation(request)) return jsonRes({ ok: false, error: 'Forbidden origin' }, 403);
      const body = await request.json().catch(() => null);
      if (env.STUDY_KV && body) await env.STUDY_KV.put(`board:${bid}`, JSON.stringify(body));
      return jsonRes({ ok: true, id: bid });
    }

    /* Hard Permission Enforcement on Protected Static Data/Pages */
    if (sess && sess.role !== 'admin') {
      let decP = p;
      try { decP = decodeURIComponent(p); } catch {}
      if (!sess.perms.extra && (
        decP === '/data-chunks/courses/extracurricular.json' ||
        decP.startsWith('/课外/') ||
        decP.startsWith('/assets/note-images/') ||
        decP.startsWith('/assets/extracurricular_imgs/')
      )) {
        return jsonRes({ ok: false, error: 'Forbidden: 当前账号未获管理员授权访问「课外拓展」' }, 403);
      }
      if (!sess.perms.reading && (decP.startsWith('/data-chunks/books/') || decP === '/reading-data.js')) {
        return jsonRes({ ok: false, error: 'Forbidden: 当前账号未获授权访问书库' }, 403);
      }
      if (!sess.perms.english && decP.startsWith('/english/')) {
        return redirectRes('/#/');
      }
      if (decP === '/admin.html' || decP === '/board-editor.html' || decP === '/ai-console.html') {
        return redirectRes('/#/');
      }
    }

    /* Filter index.json dynamically so students without extra/reading perm never see restricted courses */
    if (sess && sess.role !== 'admin' && p === '/data-chunks/index.json') {
      const idxRes = await env.ASSETS.fetch(request);
      if (!idxRes.ok) return idxRes;
      const idxData = await idxRes.json();
      if (!sess.perms.extra && Array.isArray(idxData.courses)) {
        idxData.courses = idxData.courses.filter(c => !c.extra && c.id !== 'extracurricular');
      }
      if (!sess.perms.courses && Array.isArray(idxData.courses)) {
        idxData.courses = idxData.courses.filter(c => c.extra);
      }
      if (!sess.perms.reading) {
        idxData.books = [];
      }
      return jsonRes(idxData, 200);
    }

    /* Static Asset URL Remap (课外/.note-images/ -> /assets/note-images/) */
    let assetReq = request;
    let decodedPath = p;
    try { decodedPath = decodeURIComponent(p); } catch {}
    if (decodedPath.startsWith('/课外/.note-images/')) {
      const remapped = new URL(request.url);
      remapped.pathname = '/assets/note-images/' + decodedPath.slice('/课外/.note-images/'.length);
      assetReq = new Request(remapped.toString(), request);
    }

    const assetRes = await env.ASSETS.fetch(assetReq);
    if (!assetRes.ok) return assetRes;

    /* Inject __CLOUD_BOOT__ & __CLOUD_USER__ into authenticated HTML pages */
    const ct = (assetRes.headers.get('content-type') || '').toLowerCase();
    if (sess && ct.includes('text/html')) {
      const isRoot = p === '/' || p === '/index.html';
      const html = await assetRes.text();
      let inject = '';
      if (isRoot) {
        const st = await readStateKV(env, sess.uid, sess.role === 'admin' ? sess.user : '');
        const boot = {
          uid: sess.uid,
          user: sess.user,
          role: sess.role,
          perms: sess.perms,
          personalMode: true,
          canAI: sess.canAI,
          updatedAt: st.updatedAt,
          data: st.data
        };
        inject = `<script>window.__CLOUD_BOOT__=${JSON.stringify(boot).replace(/</g, '\\u003c')};window.__CLOUD_USER__=${JSON.stringify(sess.user)};window.__CLOUD_ROLE__=${JSON.stringify(sess.role)};</script>`;
      } else {
        inject = `<script>window.__CLOUD_BOOT__=${JSON.stringify({ uid: sess.uid, user: sess.user, role: sess.role, perms: sess.perms, canAI: sess.canAI })};window.__CLOUD_USER__=${JSON.stringify(sess.user)};window.__CLOUD_ROLE__=${JSON.stringify(sess.role)};window.__CAN_AI__=${sess.canAI};</script>`;
      }
      const patched = html.includes('</head>') ? html.replace('</head>', inject + '\n</head>') : (inject + html);
      const headers = new Headers(assetRes.headers);
      headers.set('Cache-Control', 'no-store');
      headers.delete('content-length');
      return new Response(patched, { status: assetRes.status, headers });
    }

    return assetRes;
  }
};
