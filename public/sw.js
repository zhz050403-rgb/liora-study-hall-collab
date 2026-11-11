/* 学习小屋 · 待办小组件的离线缓存
   只处理 todo.html 和它自己的几个小文件；主站的 data.js / reading-data.js /
   所有接口一律不拦截，所以安装小组件不会影响学习小屋本体的加载与更新。
   线上分享链接有网关校验，缓存地址的分享码必须与页面、manifest 保持一致，
   这样桌面图标在访问凭证过期后依然能正常打开。 */
var CACHE = 'liora-todo-v10';
var SC = 'sharecode=L4NKT6REQ6';
var WIDGET_START = '/todo.html?from=widget&' + SC;
var PRECACHE = [
  WIDGET_START,
  '/todo.html?pet=1&' + SC,
  '/todo.html?' + SC,
  '/todo.html?from=widget',
  '/todo.html',
  '/todo-widget.css?v=20261107nav2-h5eb4634a&' + SC,
  '/todo-widget.js?v=20261107nav&' + SC,
  '/prep-data.js?v=20261106d&' + SC,
  '/cloud-sync.js?v=20261107c&' + SC,
  '/cloud-config.js?v=1&' + SC,
  '/cabin-art/crest-icon-192.png?v=20261106-crest1&' + SC,
  '/cabin-art/crest-icon-512.png?v=20261106-crest1&' + SC,
  '/cabin-art/crest-icon-maskable-512.png?v=20261106-crest1&' + SC,
  '/cabin-art/crest-apple-touch-180.png?v=20261106-crest1&' + SC,
  '/manifest.webmanifest?' + SC
];
var ASSET_RE = /^\/(todo-widget\.(css|js)|prep-data\.js|cloud-config\.js|cloud-sync\.js|cabin-art\/crest-(icon-(192|512|maskable-512)|apple-touch-180)\.png|todo-icon\.svg|todo-icon-(192|512|maskable)\.png|manifest\.webmanifest)$/;

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* 逐个缓存，某个资源临时失败也不拖垮整个安装 */
      return Promise.all(PRECACHE.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function save(req, res) {
  if (!res || !res.ok || res.redirected || res.type !== 'basic') return res;
  var copy = res.clone();
  caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
  return res;
}
/* HTML 走网络优先：登录过期时不会被缓存成登录页；断网时才用离线副本 */
function networkFirst(req) {
  return fetch(req).then(function (res) { return save(req, res); })
    .catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match(WIDGET_START) || caches.match('/todo.html?from=widget') ||
          caches.match('/todo.html?' + SC) || caches.match('/todo.html') ||
          new Response('<meta charset="utf-8"><body style="font:14px system-ui;padding:30px;color:#0b2545">当前离线，联网后打开即可恢复待办清单。</body>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      });
    });
}
function cacheFirst(req) {
  return caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) { return save(req, res); })
      .catch(function () { return new Response('', { status: 504, statusText: 'Offline' }); });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var u;
  try { u = new URL(req.url); } catch (err) { return; }
  if (u.origin !== self.location.origin) return;
  var p = u.pathname;
  /* 账号接口、登录页、主站页面与资源：全部放行，不进缓存 */
  if (p.indexOf('/__api/') === 0 || p.indexOf('/api/') === 0 ||
      p === '/__login' || p === '/__logout' || p === '/__health') return;
  if (p === '/todo.html') { e.respondWith(networkFirst(req)); return; }
  if (ASSET_RE.test(p)) { e.respondWith(cacheFirst(req)); return; }
});

self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
