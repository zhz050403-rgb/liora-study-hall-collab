/* 静态资源服务、gzip 压缩、断点续传、入口 HTML 身份/进度注入、缺失文件友好提示 */
'use strict';

const fs = require('fs');
const path = require('path');
const { isExcludedPath } = require('./config');
const { send } = require('./http-utils');

function createStaticHandler(opts) {
  const f = opts.fs || fs;
  const config = opts.config;
  const auth = opts.auth;
  const cache = opts.cache;
  const readState = opts.readState;
  const studyStore = opts.studyStore;

  let skipped = new Set();
  try {
    JSON.parse(f.readFileSync(path.join(config.root, 'skipped-files.json'), 'utf8')).files.forEach(item => {
      skipped.add(item.rel);
      skipped.add(item.rel.split('/').map(encodeURIComponent).join('/'));
    });
  } catch (e) {}

  function bootScript(u) {
    const s = readState(u);
    const usr = auth.findUser(u) || {};
    const role = auth.roleOf(u);
    const isOwner = !!usr.ai;
    const st = auth.accounts.status(u, role);
    const canAI = isOwner || role === auth.ROLES.PREMIUM || role === auth.ROLES.MEMBER;
    const studySummary = studyStore ? (() => {
      const sd = studyStore.readStudy(u);
      const now = Date.now();
      const dueMistakes = sd.mistakes.filter(m => !m.mastered && (!m.nextReviewAt || m.nextReviewAt <= now)).length;
      return {
        mistakesTotal: sd.mistakes.length,
        dueMistakes,
        annotationsTotal: sd.annotations.length,
        gradesTotal: sd.grades.length
      };
    })() : null;

    const payload = JSON.stringify({
      ok: true,
      updatedAt: s.updatedAt || 0,
      data: s.data || {},
      user: u || '',
      ai: isOwner,
      role,
      canAI,
      personalMode: config.personalMode,
      accountStatus: st,
      studySummary,
      roleLabel: ({ admin: '管理员', premium: '高级会员', member: '会员', user: '用户', legacy: '账号' })[role] || '账号'
    }).replace(/</g, '\\u003c');
    return '<script>window.__CLOUD_BOOT__=' + payload + ';</script>';
  }

  function sendGz(res, ctype, cacheHeader, gz, etag) {
    const h = {
      'Content-Type': ctype,
      'Content-Encoding': 'gzip',
      'Vary': 'Accept-Encoding',
      'Cache-Control': cacheHeader,
      'Content-Length': gz.length,
      'X-Content-Type-Options': 'nosniff'
    };
    if (etag) h.ETag = etag;
    res.writeHead(200, h);
    res.end(gz);
  }

  function sendRaw(res, ctype, cacheHeader, file, st, req, etag) {
    const h = {
      'Content-Type': ctype,
      'Cache-Control': cacheHeader,
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff'
    };
    if (etag) h.ETag = etag;
    if (path.extname(file).toLowerCase() === '.zip' || path.basename(file) === 'LioraTodoSetup.exe') {
      h['Content-Disposition'] = 'attachment; filename="' + path.basename(file) + '"';
    }
    const m = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
    let start = 0, end = st.size - 1, code = 200;
    if (m) {
      start = +m[1];
      end = m[2] ? Math.min(+m[2], end) : end;
      if (start > end) {
        res.writeHead(416, { 'Content-Range': 'bytes */' + st.size });
        return res.end();
      }
      code = 206;
      h['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
    }
    h['Content-Length'] = end - start + 1;
    res.writeHead(code, h);
    if (req.method === 'HEAD') return res.end();
    f.createReadStream(file, { start, end }).on('error', () => res.end()).pipe(res);
  }

  function missing(res, name, rawName) {
    const rel = name.slice(1);
    const raw = (rawName || name).slice(1);
    if (skipped.has(rel) || skipped.has(raw) || isExcludedPath(rel) || isExcludedPath(raw)) {
      const safe = rel.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return send(res, 404, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>离线课件提示</title><body style="font-family:system-ui,'Microsoft YaHei',sans-serif;background:#f7fafd;color:#122e52;padding:40px;line-height:1.9">
<div style="max-width:560px;margin:auto;background:#fff;border:1px solid #d8e4f2;border-radius:14px;padding:30px;box-shadow:0 8px 24px rgba(18,46,82,.08)">
<h2 style="margin-top:0">这份原件属于本机离线课件</h2><p>为保持网站轻快打开，超大原始课程包仅保存在本机课程文件夹，未随线上版全量上传。课程页的预习笔记、题库与核心讲义均可直接在线查看。</p>
<p style="color:#5c6f88;word-break:break-all;font-size:13px">文件名：${safe}</p>
<a href="javascript:history.back()" style="color:#1c4375;font-weight:600">← 返回课程页面</a></div></body></html>`);
    }
    send(res, 404, '<!doctype html><meta charset="utf-8"><body style="font-family:system-ui,sans-serif;padding:40px;color:#122e52"><h2>文件不存在</h2><p>请返回上一页重试。</p></body>');
  }

  function serveFile(req, res, name, rawName, cu) {
    let lookup = name;
    for (const [re, to] of config.urlRemap) {
      if (re.test(lookup)) { lookup = lookup.replace(re, to); break; }
    }
    let file;
    try { file = path.resolve(config.pub, '.' + lookup); } catch (e) { return send(res, 404, 'Not found'); }
    if (!file.startsWith(config.pub + path.sep) && file !== config.pub) return send(res, 404, 'Not found');

    const owner = !!(auth.findUser(cu) || {}).ai;
    const relative = '/' + path.relative(config.pub, file).split(path.sep).join('/');
    const protectedAsset = config.ownerRe.test(relative) || relative.toLowerCase().startsWith('/assets/extracurricular_imgs/');
    if (protectedAsset && !owner) return send(res, 403, 'Forbidden', { 'Cache-Control': 'private, no-store' });

    if (relative.toLowerCase() === '/data.js') {
      const acceptGz = /\bgzip\b/i.test(req.headers['accept-encoding'] || '');
      const cacheHeader = 'private, no-store';
      cache.getDataJs(file, owner, acceptGz, (err, result) => {
        if (err) return send(res, 500, 'course data unavailable', { 'Content-Type': config.mime['.js'], 'Cache-Control': cacheHeader });
        if (result.gz) return sendGz(res, config.mime['.js'], cacheHeader, result.buf);
        res.writeHead(200, { 'Content-Type': config.mime['.js'], 'Cache-Control': cacheHeader, 'Content-Length': result.buf.length });
        res.end(result.buf);
      });
      return;
    }

    f.stat(file, (err, st) => {
      if (err || !st.isFile()) return missing(res, name, rawName);
      const ext = path.extname(file).toLowerCase();
      const acceptGz = /\bgzip\b/i.test(req.headers['accept-encoding'] || '');

      /* 入口 HTML 注入云端身份与进度，首屏零延迟 */
      if (ext === '.html' && (name === '/index.html' || name === '/english/index.html')) {
        f.readFile(file, 'utf8', (e2, html) => {
          if (e2) return send(res, 500, 'read error');
          const out = html.replace('<head>', '<head>' + bootScript(cu));
          const body = Buffer.from(out, 'utf8');
          const cacheHeader = 'no-cache';
          if (acceptGz && config.compressible.has(ext)) {
            cache.gzipBuf(body)
              .then(gz => sendGz(res, config.mime['.html'], cacheHeader, gz))
              .catch(() => { res.writeHead(200, { 'Content-Type': config.mime['.html'], 'Cache-Control': cacheHeader, 'Content-Length': body.length }); res.end(body); });
          } else {
            res.writeHead(200, { 'Content-Type': config.mime['.html'], 'Cache-Control': cacheHeader, 'Content-Length': body.length });
            res.end(body);
          }
        });
        return;
      }

      const cacheHeader = protectedAsset ? 'private, no-store'
        : (name === '/sw.js' || name === '/data.js' || name.startsWith('/data-chunks/') || ext === '.webmanifest' || ext === '.zip' || ext === '.apk') ? 'no-cache'
        : (ext === '.js' || ext === '.mjs' || ext === '.css') ? 'public, max-age=31536000, immutable'
        : (ext === '.html') ? 'no-cache'
        : 'public, max-age=86400';

      const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
      if (!req.headers.range && req.headers['if-none-match'] === etag) {
        res.writeHead(304, { ETag: etag, 'Cache-Control': cacheHeader, 'X-Content-Type-Options': 'nosniff' });
        return res.end();
      }

      if (acceptGz && config.compressible.has(ext) && !req.headers.range) {
        const key = `${file}:${st.size}:${st.mtimeMs}`;
        const cached = cache.getGz(key);
        if (cached) return sendGz(res, config.mime[ext] || 'application/octet-stream', cacheHeader, cached, etag);
        f.readFile(file, (e3, buf) => {
          if (e3) return send(res, 500, 'read error');
          cache.gzipBuf(buf)
            .then(gz => {
              cache.setGz(key, gz);
              sendGz(res, config.mime[ext] || 'application/octet-stream', cacheHeader, gz, etag);
            })
            .catch(() => sendRaw(res, config.mime[ext] || 'application/octet-stream', cacheHeader, file, st, req, etag));
        });
        return;
      }
      sendRaw(res, config.mime[ext] || 'application/octet-stream', cacheHeader, file, st, req, etag);
    });
  }

  return { serveFile, bootScript };
}

module.exports = { createStaticHandler };
