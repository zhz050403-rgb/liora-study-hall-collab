#!/usr/bin/env node
'use strict';
/* 一次构建全部周笔记：notes/weeks/<课程>/<学期>/wNN.json → 校验 → notes/out/ 下的笔记页、作业答案页和发布清单。
   用法：node notes/pipeline/build.js [--only 课程/学期] [--check]
   --check 只校验并比对 notes/out 是否与 JSON 一致（提交前、CI 用），不写文件。
   任何一周校验不通过，这一周不输出，整体以非零状态退出。 */
const fs = require('fs');
const path = require('path');
const { validateWeek } = require('./validate');
const { renderWeek, renderAnswers } = require('./render');

const NOTES = path.join(__dirname, '..');
const WEEKS = path.join(NOTES, 'weeks');
const OUT = path.join(NOTES, 'out');
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const checkOnly = args.includes('--check');

/* 网站的板块覆盖接口：数学是 math-notes，其余课程是 notes-<课程>；条目键是「学期/周号」。 */
const boardOf = course => course === 'mathematics' ? 'math-notes' : 'notes-' + course;

const results = [], manifest = [];
let stale = 0;
const write = (rel, html) => {
  const file = path.join(OUT, rel);
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (old === html) return;
  if (checkOnly) { stale++; console.log('过期  notes/out/' + rel + ' 与 JSON 不一致，请运行 npm run notes:build'); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};

for (const course of fs.readdirSync(WEEKS).sort()) {
  for (const term of fs.readdirSync(path.join(WEEKS, course)).sort()) {
    if (only && only !== `${course}/${term}` && only !== course) continue;
    const dir = path.join(WEEKS, course, term);
    for (const f of fs.readdirSync(dir).filter(n => /^w\d+\.json$/.test(n)).sort()) {
      const rel = `${course}/${term}/${f}`;
      let note;
      try { note = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { results.push({ rel, errors: ['JSON 无法解析：' + e.message] }); continue; }
      const reqFile = path.join(dir, f.replace('.json', '.requirements.json'));
      const requirements = fs.existsSync(reqFile) ? JSON.parse(fs.readFileSync(reqFile, 'utf8')) : null;
      const { errors, warnings, stats } = validateWeek(note, { requirements });
      const wk = Number(f.match(/\d+/)[0]);
      if (note.course !== course || note.term !== term || Number(note.week) !== wk) errors.push(`文件位置是 ${course}/${term}/W${wk}，JSON 里写的是 ${note.course}/${note.term}/W${note.week}`);
      results.push({ rel, errors, warnings, stats, requirements: !!requirements });
      if (errors.length) continue;
      const base = `${course}/${term}/w${String(wk).padStart(2, '0')}`;
      const fields = { graphicHtml: `out/${base}.graphic.html` };
      write(`${base}.graphic.html`, renderWeek(note));
      const answers = renderAnswers(note);
      if (answers) { fields.tutorialAnswers = `out/${base}.answers.html`; write(`${base}.answers.html`, answers); }
      manifest.push({ board: boardOf(course), key: `${term}/${wk}`, course, term, week: wk, title: note.title, fields,
        examples: stats.examples, checks: stats.checks, deliverables: stats.deliverables, requirementsChecked: !!requirements });
    }
  }
}

if (!only) write('manifest.json', JSON.stringify(manifest, null, 1) + '\n');
let failed = 0;
for (const r of results) {
  if (r.errors.length) { failed++; console.log(`✗ ${r.rel}`); for (const e of r.errors) console.log('    错误  ' + e); continue; }
  console.log(`✓ ${r.rel}  ${r.stats.examples} 道例题，${r.stats.checks} 项核对，${r.stats.deliverables} 项交付物${r.requirements ? '，已与原文要求交叉核对' : ''}${r.warnings.length ? `，${r.warnings.length} 个提示` : ''}`);
  for (const w of r.warnings) console.log('    提示  ' + w);
}
console.log(`共 ${results.length} 周：${results.length - failed} 周通过，${failed} 周未通过${checkOnly ? `；${stale} 个输出文件过期` : ''}`);
process.exit(failed || stale ? 1 : 0);
