'use strict';
/* 安全的数学表达式求值：只认数字、变量、四则运算、乘方和白名单函数，不用 eval。
   用途：画函数图（变量 x）、核算例题答案（无变量）。 */

const FUNCS = {
  ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2, exp: Math.exp, sqrt: Math.sqrt,
  abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan, floor: Math.floor, ceil: Math.ceil,
  round: (v, d = 0) => Math.round(v * 10 ** d) / 10 ** d,
  logb: (b, v) => Math.log(v) / Math.log(b),
  fact: n => { if (!Number.isInteger(n) || n < 0) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
  comb: (n, r) => (r < 0 || r > n) ? 0 : FUNCS.fact(n) / (FUNCS.fact(r) * FUNCS.fact(n - r)),
  perm: (n, r) => (r < 0 || r > n) ? 0 : FUNCS.fact(n) / FUNCS.fact(n - r),
  min: Math.min, max: Math.max,
};
const CONSTS = { e: Math.E, pi: Math.PI };

function tokenize(src) {
  const s = String(src).replace(/[−–]/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/√/g, 'sqrt');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = /^(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?/.exec(s.slice(i));
    if (num) { out.push({ t: 'num', v: parseFloat(num[0]) }); i += num[0].length; continue; }
    const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
    if (id) { out.push({ t: 'id', v: id[0] }); i += id[0].length; continue; }
    const cmp = /^(>=|<=|==|!=|>|<)/.exec(s.slice(i));
    if (cmp) { out.push({ t: 'cmp', v: cmp[0] }); i += cmp[0].length; continue; }
    if ('+-*/^(),'.includes(c)) { out.push({ t: c }); i++; continue; }
    throw new Error('表达式里有不支持的字符「' + c + '」：' + src);
  }
  return out;
}

/* 递归下降：expr = term (+|- term)*；term = unary ((*|/|隐式乘) unary)*；unary = -unary | power；power = atom (^ unary)? */
function parse(src) {
  const tk = tokenize(src);
  let p = 0;
  const peek = () => tk[p], eat = t => { if (!tk[p] || tk[p].t !== t) throw new Error('表达式格式错误：' + src); p++; };
  function atom() {
    const k = tk[p++];
    if (!k) throw new Error('表达式不完整：' + src);
    if (k.t === 'num') return () => k.v;
    if (k.t === '(') { const e = expr(); eat(')'); return e; }
    if (k.t === 'id') {
      if (peek() && peek().t === '(' && Object.hasOwn(FUNCS, k.v)) {
        const fn = FUNCS[k.v];
        p++;
        const args = [];
        if (peek().t !== ')') { args.push(expr()); while (peek() && peek().t === ',') { p++; args.push(expr()); } }
        eat(')');
        return env => fn(...args.map(a => a(env)));
      }
      if (Object.hasOwn(CONSTS, k.v)) return () => CONSTS[k.v];
      const name = k.v;
      return env => { if (!env || !Object.hasOwn(env, name)) throw new Error('未知变量 ' + name + '：' + src); return env[name]; };
    }
    throw new Error('表达式格式错误：' + src);
  }
  function power() { const b = atom(); if (peek() && peek().t === '^') { p++; const ex = unary(); return env => b(env) ** ex(env); } return b; }
  function unary() { if (peek() && peek().t === '-') { p++; const u = unary(); return env => -u(env); } if (peek() && peek().t === '+') { p++; return unary(); } return power(); }
  function term() {
    let l = unary();
    for (;;) {
      const k = peek();
      if (k && (k.t === '*' || k.t === '/')) { p++; const r = unary(), a = l; l = k.t === '*' ? env => a(env) * r(env) : env => a(env) / r(env); }
      else if (k && (k.t === 'num' || k.t === 'id' || k.t === '(')) { const r = unary(), a = l; l = env => a(env) * r(env); }
      else return l;
    }
  }
  function expr() {
    let l = term();
    while (peek() && (peek().t === '+' || peek().t === '-')) { const op = tk[p++].t, r = term(), a = l; l = op === '+' ? env => a(env) + r(env) : env => a(env) - r(env); }
    return l;
  }
  /* 比较运算（用于网格高亮等条件）：成立返回 1，不成立返回 0 */
  function compare() {
    const l = expr();
    if (peek() && peek().t === 'cmp') {
      const op = tk[p++].v, r = expr();
      const ops = { '>=': (a, b) => a >= b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '<': (a, b) => a < b, '==': (a, b) => a === b, '!=': (a, b) => a !== b };
      return env => (ops[op](l(env), r(env)) ? 1 : 0);
    }
    return l;
  }
  const f = compare();
  if (p !== tk.length) throw new Error('表达式有多余内容：' + src);
  return f;
}

function evaluate(src, env) { return parse(src)(env || {}); }

module.exports = { parse, evaluate };
