/* HTTP 响应与请求体工具函数 */
'use strict';

function send(res, code, body, headers) {
  const h = Object.assign(
    {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin'
    },
    headers || {}
  );
  res.writeHead(code, h);
  res.end(body);
}

function json(res, code, obj, headers) {
  send(
    res,
    code,
    JSON.stringify(obj),
    Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers || {})
  );
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    let done = false;
    req.on('data', c => {
      n += c.length;
      if (n > limit) {
        if (!done) {
          done = true;
          reject(new Error('too large'));
        }
      } else {
        chunks.push(c);
      }
    });
    req.on('end', () => {
      if (!done) {
        done = true;
        resolve(Buffer.concat(chunks).toString('utf8'));
      }
    });
    req.on('error', e => {
      if (!done) {
        done = true;
        reject(e);
      }
    });
  });
}

async function apiBody(req, limit) {
  let raw;
  try {
    raw = await readBody(req, limit || 8192);
  } catch (e) {
    return null;
  }
  try {
    return JSON.parse(raw || '{}');
  } catch (e) {
    return null;
  }
}

function guardApi(auth, req, res) {
  if (!auth.sameSite(req) || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
    json(res, 403, { ok: false, error: '请求来源校验未通过' });
    return false;
  }
  return true;
}

module.exports = { send, json, readBody, apiBody, guardApi };
