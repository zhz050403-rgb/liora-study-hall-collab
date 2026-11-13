#!/usr/bin/env node
'use strict';
/* 用法：node notes/pipeline/cli.js <周笔记.json> [输出.html] [--files 文件1,文件2] [--requirements 原文要求.json]
   先校验，全部通过才渲染输出；有错误时列出原因并以非零状态退出。 */
const fs = require('fs');
const { validateWeek } = require('./validate');
const { renderWeek } = require('./render');

const args = process.argv.slice(2);
const filesAt = args.indexOf('--files');
const files = filesAt >= 0 ? args.splice(filesAt, 2)[1].split(',') : null;
const reqAt = args.indexOf('--requirements');
const requirements = reqAt >= 0 ? JSON.parse(fs.readFileSync(args.splice(reqAt, 2)[1], 'utf8')) : null;
const [input, output] = args;
if (!input) { console.error('用法：node notes/pipeline/cli.js <周笔记.json> [输出.html] [--files 文件1,文件2] [--requirements 原文要求.json]'); process.exit(2); }

const note = JSON.parse(fs.readFileSync(input, 'utf8'));
const { errors, warnings, stats } = validateWeek(note, { files, requirements });
for (const w of warnings) console.log('提示  ' + w);
for (const e of errors) console.log('错误  ' + e);
console.log(`${note.course} ${note.term} W${note.week}：${stats.sections} 节，${stats.examples} 道例题（课件清单 ${stats.inventory} 道），${stats.checks} 项核对；${errors.length} 个错误，${warnings.length} 个提示`);
if (errors.length) process.exit(1);
if (output) { fs.writeFileSync(output, renderWeek(note)); console.log('已输出 ' + output); }
