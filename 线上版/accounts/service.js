/* ============================================================
   注册账号 / 角色 / 积分 / AI 额度 · 服务端模块（2026-11-14）
   ------------------------------------------------------------
   设计红线：
   - auth.json 完全只读，sessionSecret 绝不触碰；现有 7 个账号的密码、
     ai 标记、权限一律不变。
   - 注册账号、角色覆盖、积分与额度台账落在运行时 data/accounts.json，
     与 u_*.json 学习进度同一套机制：不进发布基线、发版不会覆盖。
   - 本文件只在服务端 require，不会暴露给浏览器；密码用
     sha256(salt|账号|密码) 与现有 checkPass 完全同构。
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROLES = {
  ADMIN: 'admin',        // 管理员：主账号（auth.json 里 ai:true），全部页面 + 全部 AI
  PREMIUM: 'premium',    // 高级会员：除课外拓展外全部页面，每天 0.1 元 AI 额度
  MEMBER: 'member',      // 会员：除课外拓展外全部页面，靠背词积分兑换 AI 额度
  USER: 'user',          // 用户（新注册默认）：只有英语学习
  LEGACY: 'legacy'       // 现有非主人账号：保持原样（除课外拓展外全部可见、无 AI）
};
const ASSIGNABLE = [ROLES.USER, ROLES.MEMBER, ROLES.PREMIUM];
const DAILY_PREMIUM_CNY = 0.1;     // 高级会员每天 0.1 元 AI 额度
const WORDS_REQUIRED = 50;        // 每天背满 50 个单词
const POINTS_PER_CLAIM = 10;       // 可领取 10 积分
const CNY_PER_REDEEM = 0.01;       // 10 积分 = 0.01 元 AI 额度
const PHONE_RE = /^1[3-9]\d{9}$/;

/* 北京时间（UTC+8）的自然日，避免服务器 UTC 时区导致「还没到零点就重置」 */
function beijingDay(ts) {
  return new Date((ts || Date.now()) + 8 * 3600 * 1000).toISOString().slice(0, 10);
}
function hashPass(salt, user, p) {
  return crypto.createHash('sha256').update(salt + '|' + user + '|' + p).digest('hex');
}
function emptyDb() { return { version: 1, users: [], overrides: {}, wallets: {} }; }
function maskPhone(p) { return String(p || '').replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'); }

function createService(opts) {
  const dataDir = opts.dataDir;
  const file = path.join(dataDir, 'accounts.json');
  const builtinUsers = opts.builtinUsers || [];

  let _cacheMtime = -1;
  let _cacheRaw = '';
  let _tmpSeq = 0;

  function read() {
    try {
      let mtime = -1;
      try { mtime = fs.statSync(file).mtimeMs; } catch (e) {
        _cacheMtime = -1; _cacheRaw = '';
        return emptyDb();
      }
      if (mtime === _cacheMtime && _cacheRaw) {
        const cached = JSON.parse(_cacheRaw);
        return cached;
      }
      const raw = fs.readFileSync(file, 'utf8');
      const o = JSON.parse(raw);
      if (!o || typeof o !== 'object') return emptyDb();
      const d = emptyDb();
      if (Array.isArray(o.users)) d.users = o.users;
      if (o.overrides && typeof o.overrides === 'object' && !Array.isArray(o.overrides)) d.overrides = o.overrides;
      if (o.wallets && typeof o.wallets === 'object' && !Array.isArray(o.wallets)) d.wallets = o.wallets;
      _cacheMtime = mtime;
      _cacheRaw = JSON.stringify(d);
      return d;
    } catch (e) { return emptyDb(); }
  }
  function write(d) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      const raw = JSON.stringify(d);
      const tmp = file + '.' + process.pid + '.' + (++_tmpSeq) + '.tmp';
      fs.writeFileSync(tmp, raw, 'utf8');
      fs.renameSync(tmp, file);
      try { _cacheMtime = fs.statSync(file).mtimeMs; _cacheRaw = raw; }
      catch (e) { _cacheMtime = -1; _cacheRaw = ''; }
    } catch (e) {
      console.error('[accounts] 写入失败:', e && e.code);
      throw e;
    }
  }
  function builtin(key) {
    const k = String(key == null ? '' : key).trim().toLowerCase();
    return builtinUsers.find(function (x) { return String(x.user).trim().toLowerCase() === k; }) || null;
  }
  function registered(d, key) {
    const k = String(key == null ? '' : key).trim().toLowerCase();
    return d.users.find(function (x) { return String(x.phone).trim().toLowerCase() === k; }) || null;
  }
  function freshWallet(day) {
    /* costByRole：按角色分账的当日 AI 消耗。高级会员的「每天 0.1 元」与会员
       「积分兑换来的额度」是两套池子，管理员当天调整身份时不能互相串账。 */
    return { day: day, wordsToday: 0, claimedDay: '', points: 0, aiExtraCny: 0, dayCostCny: 0, costByRole: {} };
  }
  function walletOf(d, key, day) {
    let w = d.wallets[key];
    if (!w || typeof w !== 'object' || w.day !== day) {
      w = freshWallet(day); d.wallets[key] = w;   // 跨天重置：积分不累积
    }
    ['wordsToday', 'points', 'aiExtraCny', 'dayCostCny'].forEach(function (k) {
      if (typeof w[k] !== 'number' || !isFinite(w[k])) w[k] = 0;
    });
    if (!w.costByRole || typeof w.costByRole !== 'object' || Array.isArray(w.costByRole)) w.costByRole = {};
    return w;
  }

  /* ---------- 登录：让 server.js 的 findUser / checkPass 直接可用 ---------- */
  function findUser(key) {
    const k = String(key == null ? '' : key).trim().toLowerCase();
    if (!k) return null;
    const d = read();
    const a = registered(d, k);
    if (!a || a.status === 'disabled') return null;
    return {
      user: a.phone, salt: a.salt, passHash: a.passHash,
      ai: false, role: a.role || ROLES.USER,
      __registered: true, phone: a.phone, name: a.name || '', createdAt: a.createdAt
    };
  }

  /* ---------- 角色 ---------- */
  function roleOf(key) {
    const k = String(key == null ? '' : key).trim().toLowerCase();
    if (!k) return null;
    const b = builtin(k);
    if (b && b.ai === true) return ROLES.ADMIN;
    const d = read();
    const a = registered(d, k);
    if (a) return a.status === 'disabled' ? null : (a.role || ROLES.USER);
    if (b) {
      const ov = d.overrides[String(b.user)];
      return ASSIGNABLE.indexOf(ov) >= 0 ? ov : ROLES.LEGACY;
    }
    return null;
  }

  /* ---------- 注册 ---------- */
  function register(input) {
    const phone = String((input && input.phone) || '').trim();
    const name = String((input && input.name) || '').trim().slice(0, 24);
    const pass = String((input && input.password) || '');
    if (!PHONE_RE.test(phone)) return { ok: false, error: '请输入正确的 11 位手机号' };
    if (pass.length < 6 || pass.length > 64) return { ok: false, error: '密码请设置 6–64 位' };
    const d = read();
    if (d.users.some(function (x) { return x.phone === phone; })) {
      return { ok: false, error: '这个手机号已经注册过了，直接登录就好' };
    }
    if (builtin(phone)) return { ok: false, error: '该账号名已被占用，请换一个' };
    if (d.users.length >= 500) return { ok: false, error: '注册名额已满，请联系管理员' };
    const salt = crypto.randomBytes(16).toString('hex');
    d.users.push({
      id: 'r_' + crypto.randomBytes(6).toString('hex'),
      phone: phone, name: name, salt: salt,
      passHash: hashPass(salt, phone, pass),
      role: ROLES.USER, status: 'active', createdAt: Date.now(), lastLoginAt: 0
    });
    write(d);
    return { ok: true, phone: phone };
  }
  function noteLogin(key) {
    const d = read(), a = registered(d, key);
    if (a) { a.lastLoginAt = Date.now(); write(d); }
  }

  /* ---------- 管理后台 ---------- */
  function list() {
    const d = read(), out = [];
    builtinUsers.forEach(function (x) {
      const isAdmin = x.ai === true;
      const ov = d.overrides[String(x.user)];
      out.push({
        key: String(x.user), label: String(x.user), kind: 'builtin',
        role: isAdmin ? ROLES.ADMIN : (ASSIGNABLE.indexOf(ov) >= 0 ? ov : ROLES.LEGACY),
        locked: isAdmin, phone: '', createdAt: 0, lastLoginAt: 0, status: 'active'
      });
    });
    d.users.forEach(function (a) {
      out.push({
        key: a.phone, label: a.name || maskPhone(a.phone), kind: 'registered',
        role: a.role || ROLES.USER, locked: false, phone: a.phone,
        phoneMasked: maskPhone(a.phone), createdAt: a.createdAt || 0,
        lastLoginAt: a.lastLoginAt || 0, status: a.status || 'active'
      });
    });
    return out;
  }
  function setRole(key, role) {
    if (ASSIGNABLE.indexOf(role) < 0) return { ok: false, error: '不支持的身份' };
    const b = builtin(key);
    if (b && b.ai === true) return { ok: false, error: '主账号（管理员）不可更改' };
    const d = read(), a = registered(d, key);
    if (a) a.role = role;
    else if (b) d.overrides[String(b.user)] = role;
    else return { ok: false, error: '账号不存在' };
    write(d);
    return { ok: true };
  }
  function setStatus(key, status) {
    if (status !== 'active' && status !== 'disabled') return { ok: false, error: '状态不合法' };
    if (builtin(key)) return { ok: false, error: '内置账号不可停用' };
    const d = read(), a = registered(d, key);
    if (!a) return { ok: false, error: '账号不存在' };
    a.status = status; write(d);
    return { ok: true };
  }
  /* 删除注册账号：误注册 / 验收留下的账号可彻底清掉。只删账号台账，
     不碰 auth.json，也不删 data/u_*.json 学习进度（进度文件保留但不再关联）。
     内置账号与主账号一律不可删。删除后旧 Cookie 因 findUser 找不到而自动失效。 */
  function remove(key) {
    if (builtin(key)) return { ok: false, error: '内置账号不可删除' };
    const d = read(), a = registered(d, key);
    if (!a) return { ok: false, error: '账号不存在' };
    if (a.role === ROLES.ADMIN) return { ok: false, error: '管理员账号不可删除' };
    d.users = d.users.filter(function (x) { return x.phone !== a.phone; });
    delete d.wallets[String(a.phone).toLowerCase()];
    delete d.wallets[a.phone];
    delete d.overrides[a.phone];
    write(d);
    return { ok: true, phone: a.phone };
  }
  function overview() {
    const d = read(), day = beijingDay();
    return list().map(function (a) {
      const w = walletOf(d, a.key, day);
      return {
        key: a.key, label: a.label, role: a.role, status: a.status,
        wordsToday: w.wordsToday, points: w.points,
        aiExtraCny: w.aiExtraCny, dayCostCny: w.dayCostCny
      };
    });
  }

  /* ---------- 积分 / 额度 ---------- */
  function aiDailyLimit(role, w) {
    if (role === ROLES.ADMIN) return Infinity;
    if (role === ROLES.PREMIUM) return DAILY_PREMIUM_CNY;
    if (role === ROLES.MEMBER) return Number(w.aiExtraCny) || 0;
    return 0;
  }
  function status(key, role) {
    const d = read(), day = beijingDay(), w = walletOf(d, key, day);
    const limit = aiDailyLimit(role, w);
    /* 只看本角色池的消耗：改身份不会把高级会员已用掉的钱算到会员的积分额度上，
       切回高级会员也不会把消耗清零「刷额度」。 */
    const used = Math.max(0, Number(w.costByRole[role]) || 0);
    return {
      day: day, role: role,
      wordsToday: w.wordsToday, wordsRequired: WORDS_REQUIRED,
      claimedToday: w.claimedDay === day,
      points: w.points, aiExtraCny: w.aiExtraCny, dayCostCny: w.dayCostCny,
      aiDailyLimitCny: limit === Infinity ? null : limit,
      aiLeftCny: limit === Infinity ? null : Math.max(0, Math.round((limit - used) * 1e6) / 1e6),
      canClaim: role === ROLES.MEMBER && w.wordsToday >= WORDS_REQUIRED && w.claimedDay !== day,
      canRedeem: role === ROLES.MEMBER && w.points >= POINTS_PER_CLAIM
    };
  }
  /* 背单词计数由英语台页面上报（每次复习评分 +1）。这是学习打卡，不是支付，
     服务端做每日封顶与单次数封顶，但不做加密防作弊——如实告知用户。 */
  function addWords(key, role, n) {
    if (role !== ROLES.MEMBER) return { ok: false, error: '仅「会员」累计背词进度' };
    n = Math.max(0, Math.min(50, parseInt(n, 10) || 0));
    if (!n) return { ok: true, wordsToday: status(key, role).wordsToday };
    const d = read(), day = beijingDay(), w = walletOf(d, key, day);
    w.wordsToday = Math.min(2000, w.wordsToday + n);
    write(d);
    return { ok: true, wordsToday: w.wordsToday };
  }
  function claim(key, role) {
    if (role !== ROLES.MEMBER) return { ok: false, error: '仅「会员」可领取背词积分' };
    const d = read(), day = beijingDay(), w = walletOf(d, key, day);
    if (w.claimedDay === day) return { ok: false, error: '今天已经领过啦，明天背满 50 词还能再领' };
    if (w.wordsToday < WORDS_REQUIRED) {
      return { ok: false, error: '今天还差 ' + (WORDS_REQUIRED - w.wordsToday) + ' 个单词' };
    }
    w.claimedDay = day;
    w.points = w.points + POINTS_PER_CLAIM;
    write(d);
    return { ok: true, points: w.points, status: status(key, role) };
  }
  function redeem(key, role) {
    if (role !== ROLES.MEMBER) return { ok: false, error: '仅「会员」可兑换 AI 额度' };
    const d = read(), day = beijingDay(), w = walletOf(d, key, day);
    if (w.points < POINTS_PER_CLAIM) return { ok: false, error: '积分不足 10 分' };
    w.points -= POINTS_PER_CLAIM;
    w.aiExtraCny = Math.round((w.aiExtraCny + CNY_PER_REDEEM) * 1e6) / 1e6;
    write(d);
    return { ok: true, points: w.points, aiExtraCny: w.aiExtraCny, status: status(key, role) };
  }
  /* AI 调用结束后按估算成本扣减当日额度（与 aiSettle 的 cost 同一口径） */
  function consume(key, role, costCny) {
    if (role === ROLES.ADMIN) return;
    const c = Math.max(0, Number(costCny) || 0);
    if (!c) return;
    const d = read(), day = beijingDay(), w = walletOf(d, key, day);
    w.dayCostCny = Math.round((w.dayCostCny + c) * 1e6) / 1e6;                 // 总消耗，仅用于管理页展示
    w.costByRole[role] = Math.round(((Number(w.costByRole[role]) || 0) + c) * 1e6) / 1e6;
    write(d);
  }

  return {
    ROLES: ROLES, ASSIGNABLE: ASSIGNABLE,
    findUser: findUser, roleOf: roleOf, register: register, noteLogin: noteLogin,
    list: list, setRole: setRole, setStatus: setStatus, remove: remove, overview: overview,
    status: status, addWords: addWords, claim: claim, redeem: redeem,
    aiDailyLimit: aiDailyLimit, consume: consume
  };
}
module.exports = { createService: createService, ROLES: ROLES, ASSIGNABLE: ASSIGNABLE };
