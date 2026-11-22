'use strict';
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const { createApp } = require('../server/app');

let writes = 0;
const fakeFs = {
  readFileSync(file) {
    if (file.endsWith('auth.json')) {
      return JSON.stringify({
        sessionSecret: 'test',
        users: [{ user: 'owner', ai: true }, { user: 'guest', ai: false }]
      });
    }
    if (file.endsWith('skipped-files.json')) return '{"files":[]}';
    if (file.includes('u_owner.json')) return JSON.stringify({ updatedAt: 1000, data: { 'xinnan-test': 'old' } });
    if (file.endsWith('board-notes-extracurricular.json')) return '{"modules/7":{"notesHtml":"owner-only fixture"}}';
    throw Object.assign(new Error('not found'), { code: 'ENOENT' });
  },
  readFile(file, encoding, callback) {
    try { callback(null, fs.readFileSync(file, encoding)); }
    catch (e) { callback(e); }
  },
  statSync(file) {
    if (file.endsWith('data.js')) return fs.statSync(file);
    if (file.includes('u_owner.json')) return { mtimeMs: 1000, size: 64 };
    throw Object.assign(new Error('not found'), { code: 'ENOENT' });
  },
  existsSync() { return false; },
  mkdirSync() {},
  writeFileSync() { writes++; },
  renameSync() {},
  appendFileSync() {}
};

const accountsFactory = {
  createService({ builtinUsers }) {
    const ROLES = { ADMIN: 'admin', PREMIUM: 'premium', MEMBER: 'member', USER: 'user', LEGACY: 'legacy' };
    return {
      ROLES,
      findUser() { return null; },
      roleOf(k) {
        const b = builtinUsers.find(x => x.user.toLowerCase() === String(k || '').toLowerCase());
        if (!b) return null;
        return b.ai ? ROLES.ADMIN : ROLES.LEGACY;
      },
      noteLogin() {},
      status() { return {}; }
    };
  }
};

const app = createApp({ fs: fakeFs, accountsFactory, env: {} });

async function request(url, method = 'GET', user, body) {
  const handlers = {};
  const req = {
    url,
    method,
    headers: {},
    socket: { remoteAddress: 'test' },
    on(event, fn) { handlers[event] = fn; return this; }
  };
  if (user) req.headers.cookie = 'liora_sess=' + app.auth.makeToken(user);
  let status, data;
  const res = {
    writeHead(code) { status = code; },
    end(value) { data = Buffer.isBuffer(value) ? value.toString('utf8') : value; }
  };
  const task = app.handler(req, res);
  if (body) {
    handlers.data(Buffer.from(JSON.stringify(body)));
    handlers.end();
  }
  await task;
  return { status, data };
}

(async () => {
  for (const route of ['/api/chat', '/api/ai-info', '/__api/state', '/__api/study', '/__api/backup/export']) {
    assert.equal((await request(route)).status, 401);
  }
  assert.equal((await request('/api/chat', 'POST', 'guest')).status, 403);
  assert.equal((await request('/__api/notes-pipeline', 'POST')).status, 401);
  assert.equal((await request('/__api/notes-pipeline', 'POST', 'guest')).status, 403);
  assert.equal((await request('/notes-review.html', 'GET', 'guest')).status, 403);
  assert.equal((await request('/__api/notes-pipeline', 'POST', 'owner')).status, 403);
  assert.equal((await request('/api/ai-info', 'GET', 'guest')).status, 403);

  const guestData = await request('/data.js?v=test', 'GET', 'guest');
  const ownerData = await request('/data.js?v=test', 'GET', 'owner');
  assert.equal(guestData.status, 200);
  assert.equal(ownerData.status, 200);
  const guestCourses = JSON.parse(guestData.data.slice('window.PORTAL_DATA = '.length, -1)).courses;
  assert(guestCourses.length > 0 && guestCourses.every(course => !course.extra));
  assert(ownerData.data.includes('"id":"extracurricular"'));

  assert.equal((await request('/build/extracurricular_imgs/p2_1.png', 'GET', 'guest')).status, 403);
  assert.equal((await request('/assets/extracurricular_imgs/p2_1.png', 'GET', 'guest')).status, 403);
  assert((await request('/board-overrides.js', 'GET', 'owner')).data.includes('owner-only fixture'));
  assert(!(await request('/board-overrides.js', 'GET', 'guest')).data.includes('"notes-extracurricular"'));

  assert.equal((await request('/__api/state', 'POST', 'owner', { base: 999, data: { 'xinnan-test': 'new' } })).status, 409);
  assert.equal(writes, 0);
  assert.equal((await request('/__api/state', 'POST', 'owner', { base: 1000, data: { 'xinnan-test': 'new' } })).status, 200);
  assert.equal(writes, 1);
  assert(!(await request('/__login')).data.includes('maximum-scale'));

  console.log('PASS: anonymous AI/state/study denied, guest AI denied, cached data.js filtered, stale state rejected without writes, current state accepted, login zoom enabled. Real auth/state files untouched.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
