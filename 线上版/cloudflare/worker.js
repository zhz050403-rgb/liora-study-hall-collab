/* Liora 学习小屋 · Cloudflare Workers 生产服务端（静态资产 + KV 云端进度/错题/批注/成绩/闪卡 + Web Crypto 安全会话） */

const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];
const VALID_GRADE_SOURCES = new Set(['official', 'self_reported', 'practice', 'ai_estimate']);
const COOKIE_NAME = 'liora_cf_sid';
const SESSION_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

const PUBLIC_PATHS = new Set([
  '/__health',
  '/__login',
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

function safeUserKey(u) {
  return String(u || 'owner').replace(/[^A-Za-z0-9_.@-]/g, '_');
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

async function hmacSign(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return hexFromBuf(sig);
}

async function makeSessionToken(env, user) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payload = btoa(JSON.stringify({ u: user, exp })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sig = await hmacSign(env.SESSION_SECRET, payload);
  return `${payload}.${sig}`;
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
  const a = bytesFromHex(sigHex);
  const b = bytesFromHex(expectedHex);
  if (!timingSafeEqualBytes(a, b)) return null;
  try {
    const pad = payload.replace(/-/g, '+').replace(/_/g, '/');
    const obj = JSON.parse(atob(pad + '='.repeat((4 - (pad.length % 4)) % 4)));
    if (!obj || !obj.u || Number(obj.exp) < Math.floor(Date.now() / 1000)) return null;
    return String(obj.u);
  } catch {
    return null;
  }
}

/* Format of env.AUTH_PASS_HASH: pbkdf2$<saltHex>$<hashHex> */
async function verifyPassword(user, pass, env) {
  const expectedUser = String(env.AUTH_USER || 'Liora').trim();
  const stored = String(env.AUTH_PASS_HASH || '').trim();
  if (!expectedUser || !stored) return false;

  const userOk = timingSafeEqualBytes(
    enc.encode(String(user || '').trim().toLowerCase()),
    enc.encode(expectedUser.toLowerCase())
  );

  const parts = stored.split('$');
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
  const passOk = timingSafeEqualBytes(new Uint8Array(derived), expectedHash);
  return userOk && passOk;
}

function isSameOriginMutation(req) {
  const sfs = (req.headers.get('sec-fetch-site') || '').toLowerCase();
  if (sfs && sfs !== 'same-origin' && sfs !== 'same-site' && sfs !== 'none') return false;
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    const reqUrl = new URL(req.url);
    const orgUrl = new URL(origin);
    return orgUrl.origin === reqUrl.origin;
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

function renderLoginPage(nextPath, errMsg) {
  const safeNext = String(nextPath || '/').startsWith('/') && !String(nextPath || '').startsWith('//') ? String(nextPath) : '/';
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>登录 · Liora 的学习小屋</title>
<style>
  :root{--navy:#0f2744;--gold:#c99b3b;--bg:#f4f7fb;--ink:#1b2c40;--muted:#64778d;--line:#d5e1ee}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(circle at 20% 10%,#e6effa 0%,#f4f7fb 52%,#fbf8f0 100%);font-family:-apple-system,"PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:var(--ink)}
  .card{width:100%;max-width:410px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:30px 28px;box-shadow:0 16px 48px rgba(15,39,68,.1)}
  .crest{width:46px;height:46px;border-radius:12px;background:var(--navy);color:#f4d483;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 12px;box-shadow:0 6px 16px rgba(15,39,68,.2)}
  h1{margin:0;text-align:center;font-size:22px;color:var(--navy);font-family:"Songti SC",Georgia,serif}
  .sub{text-align:center;font-size:13px;color:var(--muted);margin:6px 0 22px}
  label{display:block;font-size:13px;font-weight:600;color:var(--navy);margin:12px 0 6px}
  input{width:100%;height:42px;padding:0 12px;border:1.5px solid var(--line);border-radius:10px;font-size:15px;outline:none;transition:border-color .15s}
  input:focus{border-color:var(--navy)}
  button{width:100%;height:44px;margin-top:20px;border:none;border-radius:10px;background:var(--navy);color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .15s}
  button:hover{opacity:.92}
  .err{margin-top:12px;padding:9px 12px;border-radius:8px;background:#fdf0ee;border:1px solid #ebb8b2;color:#b4322a;font-size:13px;display:${errMsg ? 'block' : 'none'}}
  .foot{margin-top:18px;text-align:center;font-size:12px;color:var(--muted)}
</style>
</head>
<body>
  <div class="card">
    <div class="crest">✦</div>
    <h1>Liora 的学习小屋</h1>
    <div class="sub">UNSW Foundation 2026 · Cloudflare 私人云端学习门户</div>
    <form id="f" method="post" action="/__login">
      <input type="hidden" name="next" value="${esc(safeNext)}">
      <label for="u">用户名</label>
      <input id="u" name="user" type="text" autocomplete="username" placeholder="请输入用户名" required autofocus>
      <label for="p">密码</label>
      <input id="p" name="pass" type="password" autocomplete="current-password" placeholder="请输入密码" required>
      <button type="submit">进入学习小屋 →</button>
      <div class="err" id="err">${esc(errMsg || '')}</div>
    </form>
    <div class="foot">进度、错题本、批注与闪卡均已接入 Cloudflare 云端同步</div>
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
</body>
</html>`;
}

/* ==================== KV Storage Helpers ==================== */
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

async function readStateKV(env, user) {
  if (!env.STUDY_KV) return emptyState();
  const raw = await env.STUDY_KV.get(`state:${safeUserKey(user)}`, 'json');
  if (!raw || typeof raw !== 'object') return emptyState();
  return { updatedAt: Number(raw.updatedAt) || 0, data: raw.data && typeof raw.data === 'object' ? raw.data : {} };
}

async function writeStateKV(env, user, obj) {
  if (!env.STUDY_KV) return;
  await env.STUDY_KV.put(`state:${safeUserKey(user)}`, JSON.stringify(obj));
}

async function readStudyKV(env, user) {
  const base = emptyStudy();
  if (!env.STUDY_KV) return base;
  const raw = await env.STUDY_KV.get(`study:${safeUserKey(user)}`, 'json');
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

async function writeStudyKV(env, user, d) {
  if (!env.STUDY_KV) return;
  d.updatedAt = Date.now();
  await env.STUDY_KV.put(`study:${safeUserKey(user)}`, JSON.stringify(d));
}

/* ==================== Study Mutations ==================== */
async function handleStudyApi(req, url, env, user) {
  const p = url.pathname;
  if (req.method === 'GET' && p === '/__api/study') {
    return jsonRes(await readStudyKV(env, user));
  }
  if (req.method === 'GET' && p === '/__api/backup/export') {
    const [state, study] = await Promise.all([readStateKV(env, user), readStudyKV(env, user)]);
    return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), user, state, study }, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="liora-backup-${beijingDay()}.json"`,
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
      await writeStateKV(env, user, { updatedAt: Date.now(), data: body.state.data });
    }
    if (body.study && typeof body.study === 'object') {
      const merged = Object.assign(emptyStudy(), body.study);
      await writeStudyKV(env, user, merged);
    }
    return jsonRes({ ok: true });
  }

  const d = await readStudyKV(env, user);

  if (p === '/__api/study/mistakes') {
    if (body.action === 'delete') {
      const id = String(body.id || '');
      d.mistakes = d.mistakes.filter(x => x.id !== id);
      await writeStudyKV(env, user, d);
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
      await writeStudyKV(env, user, d);
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
    await writeStudyKV(env, user, d);
    return jsonRes({ ok: true, item, total: d.mistakes.length, updatedAt: d.updatedAt });
  }

  if (p === '/__api/study/annotations') {
    if (body.action === 'delete') {
      const id = String(body.id || '');
      d.annotations = d.annotations.filter(x => x.id !== id);
      await writeStudyKV(env, user, d);
      return jsonRes({ ok: true, deleted: id, updatedAt: d.updatedAt });
    }
    const now = Date.now();
    const item = {
      id: String(body.id || '').trim() || randomId('a_'),
      route: String(body.route || '').trim().slice(0, 160),
      course: String(body.course || '').trim().slice(0, 40),
      title: String(body.title || '').trim().slice(0, 140),
      kind: String(body.kind || 'note').trim().slice(0, 20),
      quote: String(body.quote || '').trim().slice(0, 600),
      note: String(body.note || '').trim().slice(0, 1500),
      color: String(body.color || 'gold').trim().slice(0, 20),
      createdAt: now,
      updatedAt: now
    };
    d.annotations.unshift(item);
    if (d.annotations.length > 2000) d.annotations.length = 2000;
    await writeStudyKV(env, user, d);
    return jsonRes({ ok: true, item, updatedAt: d.updatedAt });
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
      await writeStudyKV(env, user, d);
      return jsonRes({ ok: true, dailyFocus: d.dailyFocus, updatedAt: d.updatedAt });
    }
    const minutes = Math.max(1, Math.min(240, Number(body.minutes) || 25));
    const sess = {
      id: randomId('f_'),
      day: beijingDay(),
      course: String(body.course || 'general').trim().slice(0, 40),
      label: String(body.label || '番茄专注').trim().slice(0, 100),
      minutes,
      at: Date.now()
    };
    d.focusSessions.unshift(sess);
    if (d.focusSessions.length > 2000) d.focusSessions.length = 2000;
    await writeStudyKV(env, user, d);
    return jsonRes({ ok: true, session: sess, updatedAt: d.updatedAt });
  }

  if (p === '/__api/study/grades') {
    if (body.action === 'delete') {
      const id = String(body.id || '');
      d.grades = d.grades.filter(x => x.id !== id);
      await writeStudyKV(env, user, d);
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
    await writeStudyKV(env, user, d);
    return jsonRes({ ok: true, item, updatedAt: d.updatedAt });
  }

  if (p === '/__api/study/flashcards') {
    const termId = String(body.termId || '').trim().slice(0, 80);
    if (!termId) return jsonRes({ ok: false, error: 'termId 不能为空' }, 400);
    d.flashcards[termId] = { status: String(body.status || 'known').slice(0, 20), updatedAt: Date.now() };
    await writeStudyKV(env, user, d);
    return jsonRes({ ok: true, termId, updatedAt: d.updatedAt });
  }

  return jsonRes({ ok: false, error: 'Not Found' }, 404);
}

/* ==================== Optional AI Proxy (Streaming) ==================== */
async function handleAiApi(req, url, env) {
  const ready = !!(env.AI_API_KEY && env.AI_BASE_URL);
  if (url.pathname === '/api/ai-info' || url.pathname === '/__api/ai/ping') {
    return jsonRes({ ok: true, ready, configured: ready, model: ready ? (env.AI_MODEL || 'default') : '' });
  }
  if (!ready) {
    return jsonRes({ ok: false, error: 'AI 伴学尚未配置密钥（如需开启，设置 Cloudflare Secret AI_API_KEY 与 AI_BASE_URL 即可）' }, 503);
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.AI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.AI_MODEL || 'gpt-4o-mini',
      messages,
      stream: true
    })
  });

  if (!upstream.ok || !upstream.body) {
    return jsonRes({ ok: false, error: `上游 AI 服务返回 HTTP ${upstream.status}` }, 502);
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

/* ==================== Main Worker Fetch Handler ==================== */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;
    const isHttps = url.protocol === 'https:';

    if (p === '/__health') {
      return jsonRes({ ok: true, runtime: 'cloudflare-workers', ts: Date.now() });
    }

    if (p === '/cloud-config.js') {
      return new Response('window.__CLOUD_CONFIG__ = {};\n', {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
      });
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
        const ok = await verifyPassword(user, pass, env);
        if (!ok) {
          if (ct.includes('application/json')) return jsonRes({ ok: false, error: '用户名或密码错误' }, 401);
          return new Response(renderLoginPage(safeNext, '用户名或密码错误'), {
            status: 401,
            headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        }
        const canonicalUser = String(env.AUTH_USER || 'Liora').trim();
        const tok = await makeSessionToken(env, canonicalUser);
        const hdr = { 'Set-Cookie': cookieHeader(tok, isHttps, false) };
        if (ct.includes('application/json')) return jsonRes({ ok: true, user: canonicalUser, next: safeNext }, 200, hdr);
        return redirectRes(safeNext, hdr);
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (p === '/__logout') {
      return redirectRes('/__login', { 'Set-Cookie': cookieHeader('', isHttps, true) });
    }

    /* Public unauthenticated whitelist (favicon, manifest, login assets) */
    const isPublicAsset = PUBLIC_PATHS.has(p) || PUBLIC_PREFIXES.some(pre => p.startsWith(pre));

    const user = await verifySession(request, env);
    if (!user && !isPublicAsset) {
      if (p.startsWith('/__api/') || p.startsWith('/api/') || p.startsWith('/data-chunks/')) {
        return jsonRes({ ok: false, error: 'Unauthorized' }, 401);
      }
      const next = encodeURIComponent(p + url.search);
      return redirectRes(`/__login?next=${next}`);
    }

    /* Authenticated APIs */
    if (p === '/__api/me') {
      return jsonRes({
        ok: true,
        loggedIn: true,
        user,
        role: 'admin',
        personalMode: true,
        canAI: !!(env.AI_API_KEY && env.AI_BASE_URL)
      });
    }

    if (p === '/__api/state') {
      if (request.method === 'GET') {
        return jsonRes(await readStateKV(env, user));
      }
      if (request.method === 'POST') {
        if (!isSameOriginMutation(request)) return jsonRes({ ok: false, error: 'Forbidden origin' }, 403);
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') return jsonRes({ ok: false, error: 'Invalid JSON' }, 400);
        const cur = await readStateKV(env, user);
        const base = Number(body.base) || 0;
        if (cur.updatedAt && base && base < cur.updatedAt) {
          return jsonRes({ ok: false, conflict: true, updatedAt: cur.updatedAt, data: cur.data }, 409);
        }
        const nextObj = { updatedAt: Date.now(), data: body.data && typeof body.data === 'object' ? body.data : {} };
        await writeStateKV(env, user, nextObj);
        return jsonRes({ ok: true, updatedAt: nextObj.updatedAt });
      }
      return jsonRes({ ok: false, error: 'Method Not Allowed' }, 405);
    }

    if (p.startsWith('/__api/study') || p.startsWith('/__api/backup/')) {
      return handleStudyApi(request, url, env, user);
    }

    if (p === '/api/ai-info' || p.startsWith('/__api/ai/')) {
      return handleAiApi(request, url, env);
    }

    if (p.startsWith('/__api/boards/')) {
      const bid = p.slice('/__api/boards/'.length).replace(/[^A-Za-z0-9_-]/g, '');
      if (!bid) return jsonRes({ ok: false, error: 'Invalid board id' }, 400);
      if (request.method === 'GET') {
        const data = env.STUDY_KV ? await env.STUDY_KV.get(`board:${bid}`, 'json') : null;
        return jsonRes({ ok: true, id: bid, patch: data || null });
      }
      if (request.method === 'PUT' || request.method === 'POST') {
        if (!isSameOriginMutation(request)) return jsonRes({ ok: false, error: 'Forbidden origin' }, 403);
        const body = await request.json().catch(() => null);
        if (env.STUDY_KV && body) await env.STUDY_KV.put(`board:${bid}`, JSON.stringify(body));
        return jsonRes({ ok: true, id: bid });
      }
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

    /* Fetch static asset from Cloudflare Workers Assets */
    const assetRes = await env.ASSETS.fetch(assetReq);
    if (!assetRes.ok) return assetRes;

    /* Inject __CLOUD_BOOT__ into main SPA index.html and __CLOUD_USER__ into sub-HTML pages */
    const ct = (assetRes.headers.get('content-type') || '').toLowerCase();
    if (user && ct.includes('text/html')) {
      const isRoot = p === '/' || p === '/index.html';
      const html = await assetRes.text();
      let inject = '';
      if (isRoot) {
        const st = await readStateKV(env, user);
        const boot = {
          user,
          role: 'admin',
          personalMode: true,
          canAI: !!(env.AI_API_KEY && env.AI_BASE_URL),
          updatedAt: st.updatedAt,
          data: st.data
        };
        inject = `<script>window.__CLOUD_BOOT__=${JSON.stringify(boot).replace(/</g, '\\u003c')};window.__CLOUD_USER__=${JSON.stringify(user)};</script>`;
      } else {
        inject = `<script>window.__CLOUD_USER__=${JSON.stringify(user)};window.__CLOUD_ROLE__="admin";window.__CAN_AI__=${!!(env.AI_API_KEY && env.AI_BASE_URL)};</script>`;
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
