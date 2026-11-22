/* 全站前端与内容资产端到端冒烟验证（Phase 6）
   校验：全部 15 个 HTML 统一主题、数据分片完整性、语法检查、实时服务登录后全链路 HTTP 200 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');

// 1. JS syntax check on all modular server + app + scripts files
const jsDirs = ['server', 'scripts', 'public/app'];
let checkedJs = 0;
for (const dir of jsDirs) {
  const full = path.join(ROOT, dir);
  for (const f of fs.readdirSync(full)) {
    if (!f.endsWith('.js')) continue;
    execFileSync(process.execPath, ['--check', path.join(full, f)]);
    checkedJs++;
  }
}
execFileSync(process.execPath, ['--check', path.join(ROOT, 'server.js')]);
console.log(`PASS: JS syntax verified for ${checkedJs + 1} modular files`);

// 2. All 15 HTML pages reference unified styles/theme.css
const htmlFiles = [];
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (['katex', 'sources', 'cabin-art', 'assets', 'data-chunks'].includes(ent.name)) continue;
      walk(p);
    } else if (ent.name.endsWith('.html')) {
      htmlFiles.push(p);
    }
  }
})(PUB);
assert(htmlFiles.length >= 15, `Expected >= 15 HTML pages, got ${htmlFiles.length}`);
for (const fp of htmlFiles) {
  const txt = fs.readFileSync(fp, 'utf8');
  assert(txt.includes('styles/theme.css'), `Missing unified styles/theme.css in ${path.relative(PUB, fp)}`);
}
console.log(`PASS: All ${htmlFiles.length} HTML pages load unified styles/theme.css`);

// 3. Verify all Phase 2-3 JSON chunks
const idxPath = path.join(PUB, 'data-chunks/index.json');
const idxSizeKb = fs.statSync(idxPath).size / 1024;
assert(idxSizeKb < 60, `index.json should be lightweight (<60KB), got ${idxSizeKb.toFixed(1)}KB`);
const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
assert(idx.courses.length >= 6, 'Expected 6 core courses in index.json');

const handbooks = JSON.parse(fs.readFileSync(path.join(PUB, 'data-chunks/handbooks.json'), 'utf8'));
assert.equal(handbooks.length, 5, 'Expected all 5 subject handbooks');

const glossary = JSON.parse(fs.readFileSync(path.join(PUB, 'data-chunks/glossary.json'), 'utf8'));
assert(glossary.length >= 100, `Expected >=100 bilingual glossary terms, got ${glossary.length}`);

const examPacks = JSON.parse(fs.readFileSync(path.join(PUB, 'data-chunks/exam-packs.json'), 'utf8'));
assert.equal(examPacks.packs.length, 5, 'Expected 5 subject practice packs');

const videosExtra = JSON.parse(fs.readFileSync(path.join(PUB, 'data-chunks/videos-extra.json'), 'utf8'));
assert(videosExtra.computing && videosExtra.english, 'Expected computing & english video guides');

console.log(`PASS: Content chunks verified (index=${idxSizeKb.toFixed(1)}KB, handbooks=5, glossary=${glossary.length}, examPacks=5, extraVideos=2)`);

// 4. Live HTTP check with isolated temp auth & data dir
const PORT = 40100 + Math.floor(Math.random() * 500);
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'liora-smoke-'));
const AUTH_FILE = path.join(DATA_DIR, 'auth.smoke.json');
const salt = crypto.randomBytes(16).toString('hex');
const passHash = 'scrypt$' + crypto.scryptSync('smokepass', salt + '|LioraSmoke', 32).toString('hex');
fs.writeFileSync(AUTH_FILE, JSON.stringify({
  sessionSecret: crypto.randomBytes(32).toString('hex'),
  users: [{ user: 'LioraSmoke', uid: 'smoke-1', salt, passHash, ai: true }]
}));

function req(method, pathname, cookie, body) {
  return new Promise((resolve, reject) => {
    const headers = { Accept: 'application/json,text/html', 'Accept-Encoding': 'identity' };
    if (cookie) headers.Cookie = cookie;
    let data;
    if (body) { data = JSON.stringify(body); headers['Content-Type'] = 'application/json'; }
    const r = http.request({ host: '127.0.0.1', port: PORT, method, path: pathname, headers }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { PORT: String(PORT), LIORA_DATA_DIR: DATA_DIR, LIORA_AUTH_FILE: AUTH_FILE }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { const h = await req('GET', '/__health'); if (h.status === 200) { ready = true; break; } } catch (e) {}
    await new Promise(r => setTimeout(r, 100));
  }
  assert(ready, 'Smoke server failed to start');
  try {
    const login = await req('POST', '/__login', '', { u: 'LioraSmoke', p: 'smokepass' });
    assert.equal(login.status, 200);
    const cookie = (login.headers['set-cookie'] || []).map(s => s.split(';')[0]).join('; ');

    const paths = [
      '/', '/guide.html', '/bilingual-video.html', '/exam-prep.html', '/english/index.html',
      '/styles/theme.css', '/styles/editorial.css', '/styles/study-hub.css',
      '/app/svg-covers.js', '/app/study-api.js', '/app/store.js',
      '/app/views-home.js', '/app/views-course.js', '/app/views-reading.js',
      '/app/views-prep.js', '/app/study-views.js', '/app/main.js',
      '/data-chunks/index.json', '/data-chunks/handbooks.json', '/data-chunks/glossary.json',
      '/data-chunks/exam-packs.json', '/data-chunks/videos-extra.json', '/data-chunks/courses/accounting.json'
    ];
    for (const p of paths) {
      const res = await req('GET', p, cookie);
      assert.equal(res.status, 200, `Expected 200 for ${p}, got ${res.status}`);
    }
    // Verify ETag 304 on data-chunks/index.json
    const firstIdx = await req('GET', '/data-chunks/index.json', cookie);
    assert(firstIdx.headers.etag, 'Expected ETag header on data-chunks/index.json');
    const cachedIdx = await new Promise((resolve, reject) => {
      const r = http.request({
        host: '127.0.0.1', port: PORT, method: 'GET', path: '/data-chunks/index.json',
        headers: { Cookie: cookie, 'If-None-Match': firstIdx.headers.etag }
      }, res => { res.resume(); res.on('end', () => resolve({ status: res.statusCode })); });
      r.on('error', reject); r.end();
    });
    assert.equal(cachedIdx.status, 304, 'Expected 304 Not Modified on matching ETag');

    const home = await req('GET', '/', cookie);
    assert(home.body.includes('"personalMode":true'), 'Home bootScript should inject personalMode:true');
    assert(home.body.includes('app/main.js'), 'Home should load app/main.js');
    assert(!home.body.includes('src="data.js'), 'Home should lazy-load data-chunks instead of blocking on 7MB data.js');
    console.log(`PASS: Live HTTP smoke + ETag 304 test passed for all ${paths.length} routes & assets.`);
  } finally {
    child.kill();
    try { fs.rmSync(DATA_DIR, { recursive: true, force: true }); } catch (e) {}
  }
})().catch(e => { console.error(e); process.exit(1); });
