/* Liora 学习小屋 · 服务端基础配置（零第三方依赖） */
'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.apk': 'application/vnd.android.package-archive'
};

const COMPRESSIBLE = new Set([
  '.js', '.mjs', '.css', '.html', '.json', '.svg', '.txt', '.md', '.xml', '.csv'
]);

const OWNER_FOLDERS = ['课外'];
const OWNER_RE = new RegExp(
  '^/(' + OWNER_FOLDERS.map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(/|$)'
);

const EXCLUDED_DIRS = [
  'sources',
  'reading-sources',
  'Course_ FNDN Academic English 2026 STD O2 _ UNSW_week type unit',
  'Course_ FNDN Accounting 2026 STD O2 _ UNSW_week type unit',
  'Course_ FNDN Computing for Business, Science and Design 2026 STD O2 _ UNSW_补下载_2026-10-22T05-35-58-957Z',
  'Course_ FNDN Mathematics for Commerce 2026 STD O2 _ UNSW_term week type unit',
  'FNDN Economics 2025 STD O1',
  '富爸爸穷爸爸',
  '小岛经济学',
  '活得更好'
];

const URL_REMAP = [
  [/^\/课外\/\.note-images\//, '/assets/note-images/'],
  [/^\/build\/extracurricular_imgs\//, '/assets/extracurricular_imgs/']
];

const GONE_PATHS = /^\/(?:english\/config\.local\.js|cabin-art\/banner-(?:chapter|courses|daily-brief-painted|english|extra|guide|prep|reading)\.png)$/;

const PUBLIC_ASSET_RE = /^\/(?:android-install\.html|register\.html|page-art\.css|styles\/[A-Za-z0-9_.-]+\.css|blocks\/site-tokens\.css|manifest\.webmanifest|sw\.js|favicon\.ico|todo-icon\.svg|todo-icon-(?:192|512|maskable)\.png|cabin-art\/[A-Za-z0-9_.-]+\.(?:webp|png|jpe?g|svg)|downloads\/(?:[A-Za-z0-9_.-]+\.zip|LioraTodoSetup\.exe|[A-Za-z0-9_.-]+\.apk))$/;

const KEY_RE = /^(xinnan|liora|cabin|loopenglish)[A-Za-z0-9_-]*$/;

function loadConfig(env) {
  const e = env || process.env;
  const dataDir = e.LIORA_DATA_DIR || path.join(ROOT, 'data');
  const authFile = e.LIORA_AUTH_FILE || path.join(ROOT, 'auth.json');
  const publicHosts = new Set(['liora-study-hall.app.workbuddy.host']);
  String(e.LIORA_PUBLIC_HOST || '').split(',').forEach(x => {
    const v = x.trim().toLowerCase();
    if (v) publicHosts.add(v);
  });

  return {
    root: ROOT,
    pub: PUB,
    dataDir,
    authFile,
    port: Number(e.PORT || 3000),
    cookieName: 'liora_sess',
    sessionDays: 90,
    cnyPerAiCall: 0.01,
    personalMode: e.LIORA_SHOW_MEMBERSHIP !== '1',
    publicHosts,
    mime: MIME,
    compressible: COMPRESSIBLE,
    ownerRe: OWNER_RE,
    excludedDirs: EXCLUDED_DIRS,
    urlRemap: URL_REMAP,
    gonePaths: GONE_PATHS,
    publicAssetRe: PUBLIC_ASSET_RE,
    keyRe: KEY_RE
  };
}

function isExcludedPath(p) {
  return EXCLUDED_DIRS.some(d => p === d || p.startsWith(d + '/'));
}

module.exports = { loadConfig, isExcludedPath, MIME, COMPRESSIBLE, OWNER_RE, URL_REMAP, GONE_PATHS, PUBLIC_ASSET_RE, KEY_RE };
