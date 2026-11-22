/* 原子 JSON 存储与进程内串行写队列（防止并发覆盖与临时文件冲突） */
'use strict';

const fs = require('fs');
const path = require('path');

let tmpSeq = 0;

function createStorage(fsImpl) {
  const f = fsImpl || fs;
  const locks = new Map();
  const cache = new Map();

  function ensureDir(dir) {
    if (typeof f.mkdirSync === 'function') {
      f.mkdirSync(dir, { recursive: true });
    }
  }

  function readJson(filePath, fallback) {
    try {
      let mtime = null;
      if (typeof f.statSync === 'function') {
        try {
          const st = f.statSync(filePath);
          mtime = st && st.mtimeMs;
        } catch (e) {
          if (e && e.code === 'ENOENT') {
            cache.delete(filePath);
            return typeof fallback === 'function' ? fallback() : fallback;
          }
        }
      }
      if (mtime !== null) {
        const hit = cache.get(filePath);
        if (hit && hit.mtime === mtime) {
          return JSON.parse(hit.raw);
        }
      }
      const raw = f.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (mtime !== null) {
        if (cache.size >= 120) cache.clear();
        cache.set(filePath, { mtime, raw });
      }
      return parsed == null ? (typeof fallback === 'function' ? fallback() : fallback) : parsed;
    } catch (e) {
      return typeof fallback === 'function' ? fallback() : fallback;
    }
  }

  function writeJsonAtomic(filePath, obj, options) {
    ensureDir(path.dirname(filePath));
    const raw = options && options.pretty
      ? JSON.stringify(obj, null, 2) + '\n'
      : JSON.stringify(obj);
    const tmp = `${filePath}.${process.pid}.${++tmpSeq}.tmp`;
    const writeOpts = options && options.mode ? { encoding: 'utf8', mode: options.mode } : 'utf8';
    f.writeFileSync(tmp, raw, writeOpts);
    f.renameSync(tmp, filePath);
    if (typeof f.statSync === 'function') {
      try {
        const st = f.statSync(filePath);
        cache.set(filePath, { mtime: st.mtimeMs, raw });
      } catch (e) {
        cache.delete(filePath);
      }
    } else {
      cache.delete(filePath);
    }
  }

  /* 针对同一文件的异步修改串行化，避免并发请求 read-modify-write 互相覆盖 */
  function withFileLock(filePath, fn) {
    const prev = locks.get(filePath) || Promise.resolve();
    const next = prev.then(() => fn(), () => fn());
    const settled = next.finally(() => {
      if (locks.get(filePath) === settled) locks.delete(filePath);
    });
    locks.set(filePath, settled);
    return next;
  }

  return { ensureDir, readJson, writeJsonAtomic, withFileLock, clearCache: () => cache.clear() };
}

module.exports = { createStorage };
