/* 本地安全开发启动脚本（npm run dev）
   绝不碰真实的 线上版/auth.json 与 线上版/data/；
   使用系统临时目录下的独立开发数据与开发账号，开箱即用。 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEV_ROOT = path.join(os.tmpdir(), 'liora-study-hall-dev');
const DEV_DATA = path.join(DEV_ROOT, 'data');
const DEV_AUTH = path.join(DEV_ROOT, 'auth.dev.json');
const PORT = process.env.PORT || '3000';

fs.mkdirSync(DEV_DATA, { recursive: true });

if (!fs.existsSync(DEV_AUTH)) {
  const salt = crypto.randomBytes(16).toString('hex');
  const user = 'Liora';
  const pass = 'liora2026';
  const passHash = 'scrypt$' + crypto.scryptSync(pass, salt + '|' + user, 32).toString('hex');
  const devAuth = {
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    users: [
      { user, uid: 'dev-owner-1', salt, passHash, ai: true }
    ]
  };
  fs.writeFileSync(DEV_AUTH, JSON.stringify(devAuth, null, 2), { mode: 0o600 });
}

console.log('=====================================================');
console.log('  Liora 学习小屋 · 本地开发预览（隔离模式）');
console.log('  访问地址：http://127.0.0.1:' + PORT + '/');
console.log('  本地测试账号：Liora   密码：liora2026');
console.log('  数据目录（临时）：' + DEV_DATA);
console.log('  安全保证：不读取也不写入真实 auth.json / 线上版/data/');
console.log('=====================================================');

const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
  cwd: ROOT,
  env: Object.assign({}, process.env, {
    PORT,
    LIORA_DATA_DIR: DEV_DATA,
    LIORA_AUTH_FILE: DEV_AUTH
  }),
  stdio: 'inherit'
});

child.on('exit', code => process.exit(code || 0));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
