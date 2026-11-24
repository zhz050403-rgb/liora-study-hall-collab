/* 自动化视觉与资产质量门禁（Step 4 · 真实无头 Chrome 验收）
   强制红线：
   1) 全站所有可见 <img> 零破图（complete && naturalWidth > 0）
   2) 课程页/读书页左右双栏间距 <= 40px（杜绝中间 250px 大白条）
   3) 主标题字号 <= 28px，不出现重复主标题
   4) 屏幕右下角可见 fixed 控件严格 === 1（仅 #lh-dock，零旧球露底）
   5) 桌面 1280px & 手机 390px 横向溢出 === 0px，0 条 JS 异常，0 个站内 404/500 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOT_DIR = process.env.LIORA_SHOT_DIR || '';

if (!fs.existsSync(CHROME_BIN)) {
  console.log('SKIP: Chrome not installed at ' + CHROME_BIN);
  process.exit(0);
}

const PORT = 41200 + Math.floor(Math.random() * 400);
const CDP_PORT = 9522 + Math.floor(Math.random() * 60);
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'liora-visual-'));
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const CHROME_PROF = path.join(DATA_DIR, 'chrome-prof');

const salt = crypto.randomBytes(16).toString('hex');
const passHash = 'scrypt$' + crypto.scryptSync('audit123', salt + '|Liora', 32).toString('hex');
fs.writeFileSync(AUTH_FILE, JSON.stringify({
  sessionSecret: crypto.randomBytes(32).toString('hex'),
  users: [{ user: 'Liora', uid: 'audit-1', salt, passHash, ai: true }]
}));

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      const c = []; res.on('data', d => c.push(d));
      res.on('end', () => resolve(JSON.parse(Buffer.concat(c).toString('utf8'))));
    }).on('error', reject);
  });
}

async function main() {
  const srv = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { PORT: String(PORT), LIORA_DATA_DIR: DATA_DIR, LIORA_AUTH_FILE: AUTH_FILE }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  for (let i = 0; i < 60; i++) {
    try { await getJson(`http://127.0.0.1:${PORT}/__health`); break; } catch { await new Promise(r => setTimeout(r, 100)); }
  }

  const chrome = spawn(CHROME_BIN, [
    '--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${CHROME_PROF}`, '--window-size=1280,860', 'about:blank'
  ], { stdio: 'ignore' });

  let wsUrl = '';
  for (let i = 0; i < 60; i++) {
    try {
      const list = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const p = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
    } catch {}
    await new Promise(r => setTimeout(r, 120));
  }
  if (!wsUrl) throw new Error('Chrome CDP unavailable');

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let seq = 0;
  const pending = new Map();
  const jsErrors = [];
  const badHttp = [];

  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const ex = msg.params.exceptionDetails;
      jsErrors.push((ex && (ex.text || (ex.exception && ex.exception.description))) || 'JS error');
    }
    if (msg.method === 'Network.responseReceived') {
      const r = msg.params.response;
      if (r.url.startsWith(`http://127.0.0.1:${PORT}/`) && r.status >= 400 && !r.url.includes('favicon')) {
        badHttp.push(`${r.status} ${r.url}`);
      }
    }
  });
  const send = (method, params) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params: params || {} }));
  });
  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result && r.result.value;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  // Login & wait for SPA shell to mount
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/__login` });
  await new Promise(r => setTimeout(r, 600));
  await evalJs(`(async()=>{
    document.getElementById('u').value='Liora';
    document.getElementById('p').value='audit123';
    document.getElementById('f').dispatchEvent(new Event('submit',{cancelable:true}));
  })()`);
  for (let i = 0; i < 30; i++) {
    const ready = await evalJs('!!document.getElementById("lh-dock") && !!document.querySelector("#app h1")');
    if (ready) break;
    await new Promise(r => setTimeout(r, 150));
  }

  const routes = [
    { name: 'home', hash: '#/', shot: 'v4-home.png', hasTwoCol: false },
    { name: 'reading-shelf', hash: '#/reading', shot: 'v4-reading.png', hasTwoCol: false },
    { name: 'book-reader', hash: '#/book/guofulun/1', hasTwoCol: true },
    { name: 'acc-w1', hash: '#/c/accounting/term1/1', shot: 'v5-acc-w1.png', hasTwoCol: true, expectVisuals: true, expectBiExam: true },
    { name: 'eco-w1', hash: '#/c/economics/term1/1', shot: 'v5-eco-w1.png', hasTwoCol: true, expectVisuals: true, expectBiExam: true },
    { name: 'math-w1', hash: '#/c/mathematics/term1/1', shot: 'v5-math-w1.png', hasTwoCol: true, expectVisuals: true, expectBiExam: true },
    { name: 'comp-w1', hash: '#/c/computing/term1/1', hasTwoCol: true, expectVisuals: true, expectBiExam: true },
    { name: 'comp-w10', hash: '#/c/computing/term1/10', shot: 'v5-comp-w10.png', hasTwoCol: true, expectVisuals: true, expectBiExam: true },
    { name: 'eng-w1', hash: '#/c/english/term1/1', shot: 'v5-eng-w1.png', hasTwoCol: true, expectVisuals: true, expectBiExam: true },
    { name: 'extra-m11', hash: '#/c/extracurricular/modules/11', hasTwoCol: true, expectVisuals: true },
    { name: 'handbooks', hash: '#/handbooks', hasTwoCol: false },
    { name: 'mistakes', hash: '#/mistakes', hasTwoCol: false },
    { name: 'flashcards', hash: '#/flashcards', hasTwoCol: false },
    { name: 'exam-packs', hash: '#/exam-packs', hasTwoCol: false }
  ];

  let fails = 0;
  for (const rt of routes) {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${rt.hash}` });
    await new Promise(r => setTimeout(r, 900));
    const report = await evalJs(`(function(){
      var imgs = Array.from(document.querySelectorAll('img')).filter(function(i){
        var r = i.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && i.offsetParent !== null;
      });
      var broken = imgs.filter(function(i){ return !i.complete || i.naturalWidth === 0; }).map(function(i){ return i.getAttribute('src'); });
      var svgs = document.querySelectorAll('#edNoteBody svg, #edTutBody svg').length;
      var noteImgs = document.querySelectorAll('#edNoteBody img, #edTutBody img').length;
      var hasStrip = !!document.querySelector('.ed-fig-strip');
      var hasAllStages = !!document.getElementById('sec-checklist') && !!document.getElementById('sec-notes') && !!document.getElementById('sec-tutorial') && !!document.getElementById('sec-resources') && !!document.getElementById('sec-videos');
      var biConcepts = document.querySelectorAll('.bi-concept-card').length;
      var examQAs = document.querySelectorAll('.ed-qa-card').length;
      var h1s = Array.from(document.querySelectorAll('#app h1'));
      var h1Size = h1s[0] ? parseFloat(getComputedStyle(h1s[0]).fontSize) : 0;
      var overflow = document.documentElement.scrollWidth - window.innerWidth;
      var side = document.querySelector('.ed-sidebar');
      var main = document.querySelector('.ed-main-col');
      var gap = (side && main) ? Math.round(main.getBoundingClientRect().left - side.getBoundingClientRect().right) : null;
      var fixedBottom = Array.from(document.querySelectorAll('*')).filter(function(el){
        var cs = getComputedStyle(el);
        if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
        var r = el.getBoundingClientRect();
        return r.width > 10 && r.height > 10 && r.bottom > window.innerHeight - 120;
      }).map(function(el){ return el.id || el.className; });
      return { imgCount: imgs.length, broken: broken, visuals: svgs + noteImgs, hasStrip: hasStrip, hasAllStages: hasAllStages, biConcepts: biConcepts, examQAs: examQAs, h1Count: h1s.length, h1Size: h1Size, overflow: overflow, gap: gap, fixedBottom: fixedBottom };
    })()`);

    const okBroken = report.broken.length === 0;
    const okOverflow = report.overflow <= 0;
    const okH1 = report.h1Size <= 28 && report.h1Count <= 1;
    const okGap = !rt.hasTwoCol || (report.gap !== null && report.gap >= 16 && report.gap <= 40);
    const okFixed = report.fixedBottom.length === 1 && report.fixedBottom[0] === 'lh-dock';
    const okVis = !rt.expectVisuals || (report.visuals >= 1 && report.hasStrip && report.hasAllStages);
    const okBiExam = !rt.expectBiExam || (report.biConcepts >= 1 && report.examQAs >= 1);
    const pass = okBroken && okOverflow && okH1 && okGap && okFixed && okVis && okBiExam;
    if (!pass) fails++;
    console.log(`[1280px] ${rt.name.padEnd(14)} pass=${pass} vis=${report.visuals} bi=${report.biConcepts} qa=${report.examQAs} broken=${report.broken.length} h1=${report.h1Size}px(${report.h1Count}) gap=${report.gap}px overflow=${report.overflow}px`);
    if (SHOT_DIR && rt.shot) {
      fs.mkdirSync(SHOT_DIR, { recursive: true });
      const pic = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SHOT_DIR, rt.shot), Buffer.from(pic.data, 'base64'));
    }
  }

  // Mobile 390px overflow check
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const rt of [routes[0], routes[1], routes[3]]) {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${rt.hash}` });
    await new Promise(r => setTimeout(r, 700));
    const ov = await evalJs('document.documentElement.scrollWidth - window.innerWidth');
    if (ov > 0) fails++;
    console.log(`[ 390px] ${rt.name.padEnd(14)} overflow=${ov}px`);
  }

  console.log('JS errors:', jsErrors.length, jsErrors);
  console.log('Bad local HTTP:', badHttp.length, badHttp);
  ws.close(); chrome.kill(); srv.kill();
  try { fs.rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
  if (fails || jsErrors.length || badHttp.length) process.exit(1);
  console.log('PASS: Visual & Asset Audit Gate 100% GREEN!');
}

main().catch(e => { console.error(e); process.exit(1); });
