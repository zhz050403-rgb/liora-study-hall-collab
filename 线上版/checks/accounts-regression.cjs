/* ============================================================
   账号 / 角色 / 积分 / AI 额度 · 本地回归（2026-11-14）
   ------------------------------------------------------------
   红线：绝不碰真实 data/。用 LIORA_DATA_DIR 指向系统临时目录，
   auth.json 只读（仅取 sessionSecret 与主人账号名来签合法会话）。
   运行：node checks/accounts-regression.cjs
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const zlib = require('zlib');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PORT = 39000 + Math.floor(Math.random() * 800);
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'liora-accounts-test-'));
const REAL_AUTH = path.join(ROOT, 'auth.json');
let AUTH_FILE = REAL_AUTH;
let auth;
if (fs.existsSync(REAL_AUTH)) {
  auth = JSON.parse(fs.readFileSync(REAL_AUTH, 'utf8'));
} else {
  /* 公开仓库不含 auth.json：自动在系统临时目录生成隔离测试凭据，绝不写入项目目录 */
  AUTH_FILE = path.join(DATA_DIR, 'auth.test.json');
  const salt = crypto.randomBytes(16).toString('hex');
  const user = 'LioraTestOwner';
  const passHash = crypto.createHash('sha256').update(salt + '|' + user + '|testpass').digest('hex');
  auth = { sessionSecret: crypto.randomBytes(32).toString('hex'), users: [{ user, uid: 'test-owner-1', salt, passHash, ai: true }] };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(auth), 'utf8');
}
const OWNER = (auth.users.find(u => u.ai === true) || {}).user;
if (!OWNER || !auth.sessionSecret) { console.error('auth.json 缺少主账号或 sessionSecret'); process.exit(1); }

function makeToken(u) {
  const payload = Buffer.from(JSON.stringify({
    u: u, exp: Date.now() + 90 * 864e5, n: crypto.randomBytes(6).toString('hex')
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', auth.sessionSecret).update(payload).digest('base64url');
  return payload + '.' + sig;
}
const OWNER_COOKIE = 'liora_sess=' + encodeURIComponent(makeToken(OWNER));

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function req(method, pathname, opts) {
  opts = opts || {};
  return new Promise((resolve, reject) => {
    const headers = Object.assign({ 'Accept-Encoding': 'identity', 'Accept': 'application/json' }, opts.headers || {});
    if (opts.cookie) headers.Cookie = opts.cookie;
    let payload;
    if (opts.body !== undefined) {
      payload = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
      headers['Content-Type'] = opts.contentType || 'application/json';
    }
    const r = http.request({ host: '127.0.0.1', port: PORT, method, path: pathname, headers }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        let body;
        try { body = res.headers['content-encoding'] === 'gzip' ? zlib.gunzipSync(buf).toString('utf8') : buf.toString('utf8'); }
        catch (e) { body = buf.toString('utf8'); }
        let j = null; try { j = JSON.parse(body); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body, json: j });
      });
    });
    r.on('error', reject);
    if (payload !== undefined) r.write(payload);
    r.end();
  });
}

let pass = 0, fail = 0;
function ok(cond, name, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  → ' + detail : '')); }
}
function cookieOf(r) {
  const list = r.headers['set-cookie'] || [];
  return list.map(s => String(s).split(';')[0]).join('; ');
}
const API = { 'Content-Type': 'application/json', Accept: 'application/json' };

async function run() {
  console.log('\n=== 1. 公开页面与服务 ===');
  let r = await req('GET', '/__health');
  ok(r.status === 200 && r.json && r.json.ok, '健康检查 200');

  r = await req('GET', '/register.html');
  ok(r.status === 200 && /注册学习账号/.test(r.body), '未登录可打开注册页');
  /* 注册页是免登录独立页，后来加了配图；它引用的 css/图片必须同样免登录，
     否则线上页面能开、图带却是 401。这里不再要求「完全自包含」。 */
  const pubCss = await req('GET', '/page-art.css?v=20261115-page-art2');
  ok(pubCss.status === 200 && pubCss.body.length > 200, '注册页样式表免登录可加载', 'status=' + pubCss.status);
  const pubImg = await req('GET', '/cabin-art/library.webp');
  ok(pubImg.status === 200, '注册页配图免登录可加载', 'status=' + pubImg.status);
  ok(/page-art\.css/.test(r.body) && /cabin-art\/library\.webp/.test(r.body),
    '注册页引用的静态资源都在免登录白名单内');

  r = await req('GET', '/admin.html');
  ok(r.status === 302 && /__login/.test(r.headers.location || ''), '未登录访问管理页跳转登录');

  console.log('\n=== 2. 注册校验 ===');
  r = await req('POST', '/__api/register', { body: { phone: '123', password: 'abc123' }, headers: API });
  ok(r.status === 400 && /手机号/.test((r.json || {}).error || ''), '非法手机号被拒绝');

  const TEST_PHONE = '138' + String(Date.now()).slice(-8);
  r = await req('POST', '/__api/register', { body: { phone: TEST_PHONE, name: '回归测试', password: 'test123456' }, headers: API });
  ok(r.status === 200 && r.json && r.json.ok, '合法手机号注册成功');
  ok(r.json && r.json.redirect === '/english/index.html', '注册后落到英语学习');
  const USER_COOKIE = cookieOf(r);
  ok(/liora_sess=/.test(USER_COOKIE), '注册即写入登录 Cookie');

  r = await req('POST', '/__api/register', { body: { phone: TEST_PHONE, password: 'test123456' }, headers: API });
  ok(r.status === 400 && /已经注册/.test((r.json || {}).error || ''), '重复手机号被拒绝');

  r = await req('POST', '/__api/register', {
    body: { phone: '13900001111', password: 'test123456' },
    contentType: 'text/plain', headers: { Accept: 'application/json' }
  });
  ok(r.status === 403, '非 JSON 请求被 guardApi 拦下');

  r = await req('POST', '/__api/register', { body: { phone: '13900001111', password: 'test123456' }, headers: Object.assign({}, API, { Origin: 'https://evil.example' }) });
  ok(r.status === 403, '跨站 Origin 被 sameSite 拦下');

  /* 正式站经平台网关转发后 req.headers.host 被改成内部地址，浏览器带的 Origin
     仍是对外域名。旧实现直接比对两者，会把注册/授权/积分/领票全部误判成跨站 403。 */
  r = await req('POST', '/__api/register', {
    body: { phone: '123', password: 'abc123' },
    headers: Object.assign({}, API, { Origin: 'https://liora-study-hall.app.workbuddy.host' })
  });
  ok(r.status === 400 && /手机号/.test((r.json || {}).error || ''),
    '网关改写 Host 后对外域名 Origin 仍被认可', 'status=' + r.status);

  r = await req('POST', '/__api/register', {
    body: { phone: '123', password: 'abc123' },
    headers: Object.assign({}, API, { Origin: 'https://liora-study-hall.app.workbuddy.host', 'Sec-Fetch-Site': 'cross-site' })
  });
  ok(r.status === 403, 'Sec-Fetch-Site: cross-site 仍一律拒绝');

  console.log('\n=== 3. 「用户」权限硬闸门 ===');
  r = await req('GET', '/__api/me', { cookie: USER_COOKIE });
  ok(r.status === 200 && r.json && r.json.role === 'user' && r.json.canAdmin !== true, '身份接口返回 user');

  r = await req('GET', '/', { cookie: USER_COOKIE });
  ok(r.status === 302 && r.headers.location === '/english/index.html', '访问主站被送去英语台');

  r = await req('GET', '/daily-brief.html', { cookie: USER_COOKIE });
  ok(r.status === 403, '每日简报对 user 返回 403');

  r = await req('GET', '/data.js', { cookie: USER_COOKIE });
  ok(r.status === 403, '主站课程内容数据对 user 不下发');

  r = await req('GET', '/english/index.html', { cookie: USER_COOKIE });
  ok(r.status === 200 && /member-access\.js\?v=/.test(r.body), '英语台挂了会员板块');
  ok(/"role":"user"/.test(r.body) && /"canAI":false/.test(r.body), '英语台注入 user 身份且 canAI=false');

  r = await req('GET', '/blocks/member-access.js?v=test', { cookie: USER_COOKIE });
  ok(r.status === 200, '英语台能加载会员板块脚本');

  r = await req('POST', '/__api/ai/ticket', { cookie: USER_COOKIE, body: {}, headers: API });
  ok(r.status === 403 && /暂不能使用 AI/.test((r.json || {}).error || ''), 'user 领不到 AI 票');

  console.log('\n=== 4. 管理员与账号列表 ===');
  r = await req('GET', '/__api/me', { cookie: OWNER_COOKIE });
  ok(r.status === 200 && r.json && r.json.role === 'admin' && r.json.canAdmin === true, '主账号是管理员');

  r = await req('GET', '/admin.html', { cookie: OWNER_COOKIE });
  ok(r.status === 200 && /账号管理与授权/.test(r.body), '管理员能打开管理页');

  r = await req('GET', '/__api/admin/accounts', { cookie: USER_COOKIE });
  ok(r.status === 403, '非管理员读不了账号列表');

  r = await req('GET', '/__api/admin/accounts', { cookie: OWNER_COOKIE });
  ok(r.status === 200 && Array.isArray(r.json.accounts), '管理员读到账号列表');
  const found = (r.json.accounts || []).find(a => a.key === TEST_PHONE);
  ok(!!found && found.role === 'user', '新注册账号出现在列表且默认 user');

  r = await req('POST', '/__api/admin/role', { cookie: OWNER_COOKIE, body: { key: OWNER, role: 'user' }, headers: API });
  ok(r.status === 400 && /不可更改/.test((r.json || {}).error || ''), '主账号身份不可被改');

  r = await req('POST', '/__api/ai/ticket', {
    cookie: OWNER_COOKIE, body: {},
    headers: Object.assign({}, API, { Origin: 'https://liora-study-hall.app.workbuddy.host' })
  });
  ok(r.status === 200 && r.json && r.json.unlimited === true, '网关 Origin 下管理员领票仍可用', 'status=' + r.status);

  r = await req('GET', '/index.html', { cookie: OWNER_COOKIE });
  ok(r.status === 200 && /member-access\.js\?v=/.test(r.body), '主站挂了会员板块');
  ok(/ai-visibility\.js\?v=/.test(r.body), 'AI 可见性板块已挂版本号');

  console.log('\n=== 5. 高级会员：每天 0.1 元 ===');
  r = await req('POST', '/__api/admin/role', { cookie: OWNER_COOKIE, body: { key: TEST_PHONE, role: 'premium' }, headers: API });
  ok(r.status === 200 && r.json.ok, '授权为高级会员');
  r = await req('GET', '/__api/me', { cookie: USER_COOKIE });
  ok(r.json && r.json.role === 'premium' && r.json.accountStatus.aiDailyLimitCny === 0.1, '额度上限 0.1 元');

  let granted = 0;
  for (let i = 0; i < 10; i++) {
    const t = await req('POST', '/__api/ai/ticket', { cookie: USER_COOKIE, body: {}, headers: API });
    if (t.status === 200 && t.json && t.json.ok) granted++;
  }
  ok(granted === 10, '0.1 元恰好可领 10 张票（每次 0.01 元）', '实得 ' + granted);
  r = await req('POST', '/__api/ai/ticket', { cookie: USER_COOKIE, body: {}, headers: API });
  ok(r.status === 403 && r.json && r.json.code === 'NO_QUOTA', '第 11 次被额度闸门拒绝');

  console.log('\n=== 6. 会员：背词 → 积分 → 兑换 → AI ===');
  r = await req('POST', '/__api/admin/role', { cookie: OWNER_COOKIE, body: { key: TEST_PHONE, role: 'member' }, headers: API });
  ok(r.status === 200, '降级为会员');

  r = await req('POST', '/__api/ai/ticket', { cookie: USER_COOKIE, body: {}, headers: API });
  ok(r.status === 403 && r.json && r.json.code === 'NO_QUOTA', '未兑换时不能用 AI');

  r = await req('POST', '/__api/points/claim', { cookie: USER_COOKIE, body: {}, headers: API });
  ok(r.status === 400 && /还差/.test((r.json || {}).error || ''), '没背满 50 词不能领积分');

  r = await req('POST', '/__api/points/words', { cookie: USER_COOKIE, body: { n: 50 }, headers: API });
  ok(r.status === 200 && r.json.wordsToday === 50, '上报 50 个单词');

  r = await req('POST', '/__api/points/claim', { cookie: USER_COOKIE, body: {}, headers: API });
  ok(r.status === 200 && r.json.points === 10, '领取 10 积分');

  r = await req('POST', '/__api/points/claim', { cookie: USER_COOKIE, body: {}, headers: API });
  ok(r.status === 400 && /已经领过/.test((r.json || {}).error || ''), '同一天不能重复领');

  r = await req('POST', '/__api/points/redeem', { cookie: USER_COOKIE, body: {}, headers: API });
  ok(r.status === 200 && r.json.aiExtraCny === 0.01 && r.json.points === 0, '10 积分兑换 0.01 元额度');

  r = await req('POST', '/__api/ai/ticket', { cookie: USER_COOKIE, body: {}, headers: API });
  ok(r.status === 200 && r.json.ok, '兑换后能领 1 张 AI 票');

  r = await req('POST', '/__api/ai/ticket', { cookie: USER_COOKIE, body: {}, headers: API });
  ok(r.status === 403 && r.json && r.json.code === 'NO_QUOTA', '额度用尽后再被拒绝');

  /* 按角色分账：当天在高级会员池用掉的 0.1 元，不能因为来回改身份被清零 */
  r = await req('POST', '/__api/admin/role', { cookie: OWNER_COOKIE, body: { key: TEST_PHONE, role: 'premium' }, headers: API });
  ok(r.status === 200, '切回高级会员');
  r = await req('POST', '/__api/ai/ticket', { cookie: USER_COOKIE, body: {}, headers: API });
  ok(r.status === 403 && r.json && r.json.code === 'NO_QUOTA', '来回改身份不能刷新已用尽的额度');
  r = await req('POST', '/__api/admin/role', { cookie: OWNER_COOKIE, body: { key: TEST_PHONE, role: 'member' }, headers: API });
  ok(r.status === 200, '再切回会员');

  console.log('\n=== 7. 停用 / 启用 ===');
  r = await req('POST', '/__api/admin/status', { cookie: OWNER_COOKIE, body: { key: TEST_PHONE, status: 'disabled' }, headers: API });
  ok(r.status === 200, '停用账号');
  r = await req('GET', '/__api/me', { cookie: USER_COOKIE });
  ok(r.status === 401 || r.status === 302, '停用后原 Cookie 立刻失效', 'status=' + r.status);
  r = await req('POST', '/__api/admin/status', { cookie: OWNER_COOKIE, body: { key: TEST_PHONE, status: 'active' }, headers: API });
  ok(r.status === 200, '重新启用');
  r = await req('GET', '/__api/me', { cookie: USER_COOKIE });
  ok(r.status === 200 && r.json.ok, '启用后会话恢复');

  console.log('\n=== 7b. 删除误注册账号 ===');
  r = await req('POST', '/__api/admin/remove', { cookie: OWNER_COOKIE, body: { key: OWNER }, headers: API });
  ok(r.status === 400 && /不可删除/.test((r.json || {}).error || ''), '主账号不可删除');
  r = await req('POST', '/__api/admin/remove', { cookie: USER_COOKIE, body: { key: TEST_PHONE }, headers: API });
  ok(r.status === 403, '非管理员不能删除账号');
  r = await req('POST', '/__api/admin/remove', { cookie: OWNER_COOKIE, body: { key: TEST_PHONE }, headers: API });
  ok(r.status === 200 && r.json && r.json.ok, '管理员可删除误注册的账号');
  r = await req('GET', '/__api/me', { cookie: USER_COOKIE });
  ok(r.status === 401 || r.status === 302, '删除后旧 Cookie 立刻失效', 'status=' + r.status);
  r = await req('GET', '/__api/admin/accounts', { cookie: OWNER_COOKIE });
  ok(!(r.json.accounts || []).some(a => a.key === TEST_PHONE), '删除后账号从列表消失');

  console.log('\n=== 8. 静态源码检查 ===');
  const ma = fs.readFileSync(path.join(ROOT, 'public/blocks/member-access.js'), 'utf8');
  ok(/wrap\('stream'\)/.test(ma) && /wrap\('chat'\)/.test(ma), 'chat 与 stream 双链路都领票');
  ok(/window\.cloudLLM\.chat = noAI/.test(ma), '「用户」在英语台的 AI 被禁用');
  const srvBundle = ['server.js', 'server/app.js', 'server/config.js', 'server/auth.js', 'server/login-page.js']
    .map(p => fs.readFileSync(path.join(ROOT, p), 'utf8')).join('\n');
  ok(/n==='\/'/.test(srvBundle), '登录页 next 回跳逻辑已修复');
  ok(/register\.html/.test(srvBundle), '注册页在免登录白名单内');
  ok(/publicHosts/.test(srvBundle), '同站校验含对外域名白名单');
  ok(/page-art\\.css/.test(srvBundle) && /cabin-art/.test(srvBundle), '注册页配图与样式在免登录白名单内');
  ok(/ADMIN_REMOVE/.test(srvBundle), '服务端提供删除账号接口');
  const adm = fs.readFileSync(path.join(ROOT, 'public/admin.html'), 'utf8');
  ok(!/v: 'admin'/.test(adm) && !/v: 'legacy'/.test(adm), '管理页下拉不再提供不可授权的身份');
  ok(/data-del-key/.test(adm), '管理页有删除入口');
  ok(!fs.existsSync(path.join(ROOT, 'data/accounts.json')), '真实 data/ 未被测试污染');
}

(async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { PORT: String(PORT), LIORA_DATA_DIR: DATA_DIR, LIORA_AUTH_FILE: AUTH_FILE }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverLog = '';
  child.stdout.on('data', d => { serverLog += d.toString(); });
  child.stderr.on('data', d => { serverLog += d.toString(); });

  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { const r = await req('GET', '/__health'); if (r.status === 200) { ready = true; break; } } catch (e) {}
    await sleep(150);
  }
  if (!ready) {
    console.error('服务未能启动：\n' + serverLog);
    child.kill(); process.exit(1);
  }
  console.log('临时数据目录：' + DATA_DIR + '  端口：' + PORT);
  try {
    await run();
  } catch (e) {
    fail++; console.error('\n测试异常：', e && e.stack || e);
  } finally {
    child.kill();
    try { fs.rmSync(DATA_DIR, { recursive: true, force: true }); } catch (e) {}
    console.log('\n=========================================');
    console.log('  通过 ' + pass + ' 项，失败 ' + fail + ' 项');
    console.log('=========================================\n');
    process.exit(fail ? 1 : 0);
  }
})();
