/* 个人学习扩展 API 回归测试（错题本/遗忘曲线/批注/番茄钟/成绩簿/闪卡/一键备份恢复/并发安全/缓存） */
'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const assert = require('node:assert/strict');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PORT = 39800 + Math.floor(Math.random() * 500);
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'liora-study-test-'));
const AUTH_FILE = path.join(DATA_DIR, 'auth.test.json');

const salt = crypto.randomBytes(16).toString('hex');
const owner = 'LioraStudyTest';
const passHash = 'scrypt$' + crypto.scryptSync('devpass123', salt + '|' + owner, 32).toString('hex');
const secret = crypto.randomBytes(32).toString('hex');
fs.writeFileSync(AUTH_FILE, JSON.stringify({
  sessionSecret: secret,
  users: [{ user: owner, uid: 'uid-study-1', salt, passHash, ai: true }]
}));

function req(method, pathname, opts) {
  opts = opts || {};
  return new Promise((resolve, reject) => {
    const headers = Object.assign({ Accept: 'application/json', 'Accept-Encoding': 'identity' }, opts.headers || {});
    if (opts.cookie) headers.Cookie = opts.cookie;
    let payload;
    if (opts.body !== undefined) {
      payload = JSON.stringify(opts.body);
      headers['Content-Type'] = 'application/json';
    }
    const r = http.request({ host: '127.0.0.1', port: PORT, method, path: pathname, headers }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(body); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body, json });
      });
    });
    r.on('error', reject);
    if (payload !== undefined) r.write(payload);
    r.end();
  });
}

async function run() {
  // 1. scrypt login works
  const login = await req('POST', '/__login', { body: { u: owner, p: 'devpass123' } });
  assert.equal(login.status, 200);
  assert.equal(login.json.ok, true);
  const cookie = (login.headers['set-cookie'] || []).map(s => s.split(';')[0]).join('; ');
  assert.match(cookie, /liora_sess=/);

  // 2. Empty initial study store
  let r = await req('GET', '/__api/study', { cookie });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.mistakes, []);
  assert.deepEqual(r.json.annotations, []);

  // 3. Mistakes CRUD + spaced repetition 1 -> 3 -> 7 -> 14 -> 30 -> mastered
  r = await req('POST', '/__api/study/mistakes', {
    cookie,
    body: { course: 'accounting', term: 'term1', week: '3', topic: 'Discounts', errorTag: '折扣基数', prompt: '$7,200 退货 $200 后 1% 折扣', myAnswer: '$72', correctAnswer: '$70', note: '先减退货再算折扣' }
  });
  assert.equal(r.status, 200);
  const mId = r.json.item.id;
  assert.equal(r.json.item.stage, 0);

  r = await req('POST', '/__api/study/mistakes', { cookie, body: { action: 'review', id: mId, passed: true } });
  assert.equal(r.status, 200);
  assert.equal(r.json.item.stage, 1);
  assert.equal(r.json.item.mastered, false);

  r = await req('POST', '/__api/study/mistakes', { cookie, body: { action: 'review', id: mId, passed: false } });
  assert.equal(r.json.item.stage, 0);

  // 4. Annotations
  r = await req('POST', '/__api/study/annotations', {
    cookie,
    body: { route: '#/c/economics/term1/2', course: 'economics', title: 'PPC', kind: 'highlight', color: 'gold', quote: 'resources not equally suited', note: '原因→机制→结果必写' }
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.total, 1);

  // 5. Focus session & daily focus
  r = await req('POST', '/__api/study/focus', {
    cookie,
    body: { action: 'set_daily', items: [{ text: '复习会计 U4 折扣分录', course: 'accounting', minutes: 25, done: false }] }
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.dailyFocus.items.length, 1);

  r = await req('POST', '/__api/study/focus', { cookie, body: { minutes: 25, course: 'accounting', task: 'U4 错题' } });
  assert.equal(r.status, 200);
  assert.equal(r.json.session.minutes, 25);

  // 6. Grades with strict sourceType
  r = await req('POST', '/__api/study/grades', {
    cookie,
    body: { course: 'mathematics', title: 'Weekly Quiz 3', score: 134, maxScore: 136, sourceType: 'official', weakPoints: ['符号检查'], errorTags: ['E01'] }
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.item.sourceType, 'official');
  assert.equal(r.json.item.pct, 98.53);

  // 7. Flashcards mastery
  r = await req('POST', '/__api/study/flashcards', { cookie, body: { termId: 'acc-accrual', status: 'known' } });
  assert.equal(r.status, 200);
  assert.equal(r.json.totalTracked, 1);

  // 8. Concurrent writes do not lose data (withFileLock)
  await Promise.all([
    req('POST', '/__api/study/mistakes', { cookie, body: { course: 'mathematics', prompt: '并发错题 A' } }),
    req('POST', '/__api/study/mistakes', { cookie, body: { course: 'economics', prompt: '并发错题 B' } }),
    req('POST', '/__api/study/mistakes', { cookie, body: { course: 'computing', prompt: '并发错题 C' } })
  ]);
  r = await req('GET', '/__api/study', { cookie });
  assert.equal(r.json.mistakes.length, 4, '4 mistakes should all persist under concurrent POSTs');

  // 9. Backup export & restore
  const exp = await req('GET', '/__api/backup/export', { cookie });
  assert.equal(exp.status, 200);
  assert.equal(exp.json.schema, 'liora-study-hall-backup-v1');
  assert.equal(exp.json.study.mistakes.length, 4);

  // Delete one mistake then restore from backup
  await req('POST', '/__api/study/mistakes', { cookie, body: { action: 'delete', id: mId } });
  let afterDel = await req('GET', '/__api/study', { cookie });
  assert.equal(afterDel.json.mistakes.length, 3);

  const imp = await req('POST', '/__api/backup/import', { cookie, body: exp.json });
  assert.equal(imp.status, 200);
  assert.equal(imp.json.ok, true);
  let afterImp = await req('GET', '/__api/study', { cookie });
  assert.equal(afterImp.json.mistakes.length, 4);

  // 10. personalMode flag in bootScript & /__api/me
  const me = await req('GET', '/__api/me', { cookie });
  assert.equal(me.json.personalMode, true);

  console.log('PASS: study-api-regression (scrypt login, mistakes SRS, annotations, focus, grades, flashcards, concurrent lock, backup export/import, personalMode).');
}

(async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { PORT: String(PORT), LIORA_DATA_DIR: DATA_DIR, LIORA_AUTH_FILE: AUTH_FILE }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let log = '';
  child.stdout.on('data', d => { log += d.toString(); });
  child.stderr.on('data', d => { log += d.toString(); });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { const h = await req('GET', '/__health'); if (h.status === 200) { ready = true; break; } } catch (e) {}
    await new Promise(r => setTimeout(r, 120));
  }
  if (!ready) { console.error('Server failed to start:\n' + log); child.kill(); process.exit(1); }
  try {
    await run();
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    child.kill();
    try { fs.rmSync(DATA_DIR, { recursive: true, force: true }); } catch (e) {}
  }
})();
