/* 静态压缩缓存 + data.js 按权限过滤缓存 + boardBaseline 缓存
   核心收益：避免非主人账号每次请求都同步 JSON.parse / stringify / gzip 8MB+ data.js */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('node:vm');
const zlib = require('zlib');

function gzipBuf(buf) {
  return new Promise((resolve, reject) => {
    zlib.gzip(buf, { level: 6 }, (e, out) => (e ? reject(e) : resolve(out)));
  });
}

function createCache(opts) {
  const f = (opts && opts.fs) || fs;
  const pub = opts.pub;
  const gzCache = new Map();
  const dataJsCache = { key: '', ownerRaw: null, ownerGz: null, guestRaw: null, guestGz: null };
  const baselineCache = new Map();

  function getGz(key) {
    return gzCache.get(key) || null;
  }

  function setGz(key, buf) {
    if (gzCache.size >= 60) gzCache.clear();
    gzCache.set(key, buf);
  }

  function getDataJs(file, isOwner, acceptGz, callback) {
    let statKey = '';
    if (typeof f.statSync === 'function') {
      try {
        const st = f.statSync(file);
        statKey = `${file}:${st.size}:${st.mtimeMs}`;
      } catch (e) {}
    }

    const useCache = !!statKey && dataJsCache.key === statKey;
    if (useCache) {
      const cachedRaw = isOwner ? dataJsCache.ownerRaw : dataJsCache.guestRaw;
      const cachedGz = isOwner ? dataJsCache.ownerGz : dataJsCache.guestGz;
      if (acceptGz && cachedGz) return callback(null, { buf: cachedGz, gz: true });
      if (!acceptGz && cachedRaw) return callback(null, { buf: cachedRaw, gz: false });
      if (acceptGz && cachedRaw) {
        return gzipBuf(cachedRaw)
          .then(gz => {
            if (isOwner) dataJsCache.ownerGz = gz; else dataJsCache.guestGz = gz;
            callback(null, { buf: gz, gz: true });
          })
          .catch(() => callback(null, { buf: cachedRaw, gz: false }));
      }
    }

    f.readFile(file, 'utf8', (err, source) => {
      if (err) return callback(err);
      let body = source;
      if (!isOwner) {
        try {
          const match = /^window\.PORTAL_DATA = ([\s\S]+);\s*$/.exec(source);
          if (!match) return callback(new Error('invalid_data_js'));
          const data = JSON.parse(match[1]);
          data.courses = data.courses.filter(course => !course.extra);
          body = 'window.PORTAL_DATA = ' + JSON.stringify(data) + ';';
        } catch (parseErr) {
          return callback(parseErr);
        }
      }
      const rawBuf = Buffer.from(body, 'utf8');
      if (statKey) {
        if (dataJsCache.key !== statKey) {
          dataJsCache.key = statKey;
          dataJsCache.ownerRaw = null;
          dataJsCache.ownerGz = null;
          dataJsCache.guestRaw = null;
          dataJsCache.guestGz = null;
        }
        if (isOwner) dataJsCache.ownerRaw = rawBuf;
        else dataJsCache.guestRaw = rawBuf;
      }

      if (acceptGz) {
        return gzipBuf(rawBuf)
          .then(gz => {
            if (statKey) {
              if (isOwner) dataJsCache.ownerGz = gz;
              else dataJsCache.guestGz = gz;
            }
            callback(null, { buf: gz, gz: true });
          })
          .catch(() => callback(null, { buf: rawBuf, gz: false }));
      }
      return callback(null, { buf: rawBuf, gz: false });
    });
  }

  function getBoardBaseline(board, spec) {
    const file = path.join(pub, spec.file);
    let statKey = '';
    if (typeof f.statSync === 'function') {
      try {
        const st = f.statSync(file);
        statKey = `${board}:${st.size}:${st.mtimeMs}`;
        const hit = baselineCache.get(board);
        if (hit && hit.key === statKey) return hit.value;
      } catch (e) {}
    }
    const source = f.readFileSync(file, 'utf8');
    const data = vm.runInNewContext(source + '\n;' + spec.expression, { window: {} }, { timeout: 1500 });
    const value = Object.fromEntries(
      spec.entries(data).map(([key, entry]) => [
        key,
        Object.fromEntries(spec.fields.filter(field => Object.hasOwn(entry, field)).map(field => [field, entry[field]]))
      ])
    );
    if (statKey) baselineCache.set(board, { key: statKey, value });
    return value;
  }

  return { gzipBuf, getGz, setGz, getDataJs, getBoardBaseline };
}

module.exports = { createCache, gzipBuf };
