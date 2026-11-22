/* Liora 的学习小屋 · 线上版服务入口
   纯 Node 核心模块，无第三方依赖；具体职责已拆分至 ./server/* 模块 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { createApp } = require('./server/app');

function startServer(opts) {
  const app = createApp(opts);
  const { config, handler } = app;

  if (!fs.existsSync(config.dataDir)) fs.mkdirSync(config.dataDir, { recursive: true });
  /* 迁移：旧版单账号共享的 state.json -> 主人账号 u_Liora.json（仅执行一次，避免丢进度） */
  const legacyState = path.join(config.dataDir, 'state.json');
  const ownerState = path.join(config.dataDir, 'u_Liora.json');
  if (fs.existsSync(legacyState) && !fs.existsSync(ownerState)) {
    try {
      fs.renameSync(legacyState, ownerState);
      console.log('Migrated legacy state.json -> u_Liora.json');
    } catch (e) {
      console.error('legacy migration failed', e);
    }
  }

  const server = http.createServer(handler);
  server.listen(config.port, '0.0.0.0', () => {
    console.log('Liora Study Hall online: 0.0.0.0:' + config.port + (config.personalMode ? ' [personal-mode]' : ''));
  });
  server.on('error', e => { console.error(e); process.exit(1); });
  return { server, app };
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
