/* 身份认证、签名 Cookie、同站代理校验、登录限流、页面权限闸门 */
'use strict';

const fs = require('fs');
const crypto = require('crypto');
const url = require('url');

function safeEq(a, b) {
  try {
    const sa = String(a);
    const sb = String(b);
    return sa.length === sb.length && crypto.timingSafeEqual(Buffer.from(sa), Buffer.from(sb));
  } catch (e) {
    return false;
  }
}

function hashScrypt(password, salt) {
  return crypto.scryptSync(String(password), String(salt), 32).toString('hex');
}

function createAuth(opts) {
  const f = opts.fs || fs;
  const config = opts.config;
  const accountsFactory = opts.accountsFactory;

  let authData;
  try {
    authData = JSON.parse(f.readFileSync(config.authFile, 'utf8'));
  } catch (e) {
    console.error('[auth] 读取 auth 配置失败，已回退到空配置（所有账号将无法登录，但服务可正常启动）：', (e && e.message) || e);
    authData = {};
  }

  const builtinUsers = Array.isArray(authData.users) && authData.users.length
    ? authData.users
    : (authData.user ? [{ user: authData.user, salt: authData.salt, passHash: authData.passHash, ai: true }] : []);

  const sessionSecret = authData.sessionSecret || crypto.randomBytes(32).toString('hex');

  const accounts = accountsFactory.createService({
    dataDir: config.dataDir,
    builtinUsers
  });
  const ROLES = accounts.ROLES;

  const sign = s => crypto.createHmac('sha256', sessionSecret).update(s).digest('base64url');

  function findUser(u) {
    const k = String(u == null ? '' : u).trim().toLowerCase();
    if (!k) return null;
    const b = builtinUsers.find(x => String(x.user).trim().toLowerCase() === k);
    if (b) return b;
    return accounts.findUser(k);
  }

  /* 兼容现有 sha256(salt|user|pass)，同时支持新账号/开发账号使用 scrypt$ 格式 */
  function checkPass(usr, p) {
    if (!usr) return false;
    if (typeof usr.passHash === 'string' && usr.passHash.startsWith('scrypt$')) {
      const expected = usr.passHash.slice('scrypt$'.length);
      return safeEq(hashScrypt(p, usr.salt + '|' + usr.user), expected);
    }
    const h = crypto.createHash('sha256').update(usr.salt + '|' + usr.user + '|' + p).digest('hex');
    return safeEq(h, usr.passHash);
  }

  function roleOf(cu) {
    return accounts.roleOf(cu);
  }

  function makeToken(u) {
    const payload = Buffer.from(JSON.stringify({
      u,
      exp: Date.now() + config.sessionDays * 864e5,
      n: crypto.randomBytes(6).toString('hex')
    })).toString('base64url');
    return payload + '.' + sign(payload);
  }

  function userOf(tok) {
    if (!tok || !tok.includes('.')) return null;
    const [p, s] = tok.split('.');
    if (!safeEq(sign(p), s)) return null;
    try {
      const o = JSON.parse(Buffer.from(p, 'base64url').toString());
      return (o.exp > Date.now() && findUser(o.u)) ? o.u : null;
    } catch (e) {
      return null;
    }
  }

  function cookieOf(req) {
    for (const part of (req.headers.cookie || '').split(';')) {
      const i = part.indexOf('=');
      if (i < 0) continue;
      if (part.slice(0, i).trim() === config.cookieName) {
        try { return decodeURIComponent(part.slice(i + 1).trim()); } catch (e) { return ''; }
      }
    }
    return '';
  }

  function sessionCookieHeader(user) {
    return `${config.cookieName}=${encodeURIComponent(makeToken(user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${config.sessionDays * 86400}`;
  }

  function clearCookieHeader() {
    return `${config.cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }

  /* 网关感知的同站校验（统一给注册、管理、积分、AI 配置复用） */
  function sameSite(req) {
    const h = req.headers || {};
    if (h['sec-fetch-site'] === 'cross-site') return false;
    const o = h.origin || h.referer || '';
    if (!o) return true;
    let host;
    try { host = new url.URL(o).host.toLowerCase(); } catch (e) { return false; }
    if (String(h.host || '').toLowerCase() === host) return true;
    if (config.publicHosts.has(host)) return true;
    const fwd = String(h['x-forwarded-host'] || '').split(',')[0].trim().toLowerCase();
    return !!(fwd && (fwd === host || config.publicHosts.has(fwd)));
  }

  /* 登录/注册限流（按 IP，60 秒内 8 次失败冷却 60 秒；自动清理旧记录防内存泄漏） */
  const failed = new Map();
  function rateLimited(ip) {
    const rec = failed.get(ip);
    return !!(rec && rec.until > Date.now());
  }
  function noteFail(ip) {
    const now = Date.now();
    if (failed.size > 500) {
      for (const [k, v] of failed.entries()) {
        if (now - v.last > 120000 && v.until < now) failed.delete(k);
      }
    }
    const rec = failed.get(ip) || { n: 0, until: 0, last: now };
    if (now - rec.last > 6e4) rec.n = 0;
    rec.n++;
    rec.last = now;
    if (rec.n >= 8) {
      rec.until = now + 6e4;
      rec.n = 0;
    }
    failed.set(ip, rec);
  }
  function clearFail(ip) {
    failed.delete(ip);
  }

  /* 页面访问硬闸门（仅服务端判定） */
  function pageAllowed(role, name) {
    if (!role) return false;
    if (role === ROLES.ADMIN) return true;
    const extraAsset = config.ownerRe.test(name) || name.toLowerCase().startsWith('/assets/extracurricular_imgs/');
    if (role === ROLES.USER) {
      if (name === '/english' || name === '/english/' || name === '/english/index.html') return true;
      if (name.startsWith('/english/')) return true;
      if (
        name === '/__api/state' || name === '/__api/me' || name === '/__api/points/status' ||
        name === '/__api/points/words' || name === '/__api/points/claim' || name === '/__api/points/redeem' ||
        name === '/__logout' || name === '/__health' || name === '/__api/ai/ticket' ||
        name.startsWith('/__api/study') || name.startsWith('/__api/backup')
      ) return true;
      if (name === '/cloud-config.js' || name === '/cloud-sync.js' || name === '/board-overrides.js') return true;
      if (/^\/(?:data|reading-data|question-bank|prep-data|learning-profile-data)\.js$/i.test(name)) return false;
      if (name.startsWith('/data-chunks/')) return false;
      if (/\.(css|js|mjs|json|png|jpe?g|svg|webp|gif|ico|woff2?|webmanifest|mp3|wav|m4a)$/i.test(name)) return true;
      if (name === '/' || name === '/index.html') return true;
      return false;
    }
    if (extraAsset) return false;
    if (name === '/admin.html') return false;
    return true;
  }

  return {
    builtinUsers,
    accounts,
    ROLES,
    findUser,
    checkPass,
    roleOf,
    makeToken,
    userOf,
    cookieOf,
    sessionCookieHeader,
    clearCookieHeader,
    sameSite,
    rateLimited,
    noteFail,
    clearFail,
    pageAllowed,
    safeEq
  };
}

module.exports = { createAuth, safeEq, hashScrypt };
