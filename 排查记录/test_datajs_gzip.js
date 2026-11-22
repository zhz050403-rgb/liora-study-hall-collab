/* 复现 server.js 新的 /data.js 分支逻辑，验证 gzip 行为（不依赖真实服务器/登录）
   注意：必须和真实 server.js 的调用方式一致 —— sendGz(res, ...) 传的是真正的 res 对象。 */
const zlib = require('zlib');

function gzipBuf(buf) {
  return new Promise((resolve, reject) => { zlib.gzip(buf, { level: 9 }, (e, out) => e ? reject(e) : resolve(out)); });
}
function sendGz(res, ctype, cache, gz) {
  res.writeHead(200, { 'Content-Type': ctype, 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding', 'Cache-Control': cache, 'Content-Length': gz.length });
  res.end(gz);
}

// 关键：acceptGz 分支与 server.js 完全一致，sendGz 收的是 res（带 writeHead/end），不是普通对象。
function handleDataJs({ source, owner, acceptGz }) {
  const cache = 'private, no-store';
  let body = source;
  if (!owner) {
    const match = /^window\.PORTAL_DATA = ([\s\S]+);\s*$/.exec(source);
    const data = JSON.parse(match[1]);
    data.courses = data.courses.filter(course => !course.extra);
    body = 'window.PORTAL_DATA = ' + JSON.stringify(data) + ';';
  }
  const buf = Buffer.from(body, 'utf8');
  const res = { code: 200, headers: {}, _body: null, writeHead(c, h) { this.code = c; this.headers = h; }, end(b) { this._body = b; } };

  if (acceptGz) {
    return gzipBuf(buf)
      .then(gz => { sendGz(res, 'text/javascript; charset=utf-8', cache, gz); return res; })
      .catch(() => { res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': cache, 'Content-Length': buf.length }); res.end(buf); return res; });
  }
  res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': cache, 'Content-Length': buf.length });
  res.end(buf);
  return Promise.resolve(res);
}

(async () => {
  const sample = 'window.PORTAL_DATA = ' + JSON.stringify({ courses: [ {id:'a',extra:false}, {id:'b',extra:true} ] }) + ';';
  const PORTAL_LEN = Buffer.byteLength(sample, 'utf8');

  const noGz = await handleDataJs({ source: sample, owner: false, acceptGz: false });
  const decodedNoGz = noGz._body.toString('utf8');
  console.log('[NO-GZIP]  code=', noGz.code,
    ' content-encoding=', noGz.headers['Content-Encoding'] || '(none)',
    ' content-length=', noGz.headers['Content-Length'],
    ' 预期明文长度=', PORTAL_LEN);
  const parsed = JSON.parse(decodedNoGz.replace(/^window\.PORTAL_DATA = /, '').replace(/;$/, ''));
  console.log('[NO-GZIP]  过滤后 courses 数=', parsed.courses.length, '(应为 1)');

  const gz = await handleDataJs({ source: sample, owner: false, acceptGz: true });
  const isGzip = gz._body[0] === 0x1f && gz._body[1] === 0x8b;
  const inflated = zlib.gunzipSync(gz._body).toString('utf8');
  const p2 = JSON.parse(inflated.replace(/^window\.PORTAL_DATA = /, '').replace(/;$/, ''));
  console.log('[GZIP]     code=', gz.code,
    ' content-encoding=', gz.headers['Content-Encoding'],
    ' gzip字节=', gz._body.length, ' 明文字节=', PORTAL_LEN,
    ' 压缩率=', (gz._body.length / PORTAL_LEN * 100).toFixed(1) + '%');
  console.log('[GZIP]     是合法 gzip 流=', isGzip, ' 解压后 courses 数=', p2.courses.length);

  const own = await handleDataJs({ source: sample, owner: true, acceptGz: true });
  const ownTxt = zlib.gunzipSync(own._body).toString('utf8');
  const p3 = JSON.parse(ownTxt.replace(/^window\.PORTAL_DATA = /, '').replace(/;$/, ''));
  console.log('[OWNER]    gzip后解压 courses 数=', p3.courses.length, '(应为 2，全部保留)');

  const ok = noGz.headers['Content-Encoding'] === undefined
    && gz.headers['Content-Encoding'] === 'gzip'
    && isGzip
    && parsed.courses.length === 1
    && p2.courses.length === 1
    && p3.courses.length === 2;
  console.log('\nRESULT:', ok ? 'PASS ✅' : 'FAIL ❌');
  process.exit(ok ? 0 : 1);
})();
