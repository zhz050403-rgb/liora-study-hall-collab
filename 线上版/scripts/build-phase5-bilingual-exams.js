#!/usr/bin/env node
'use strict';

/**
 * Phase 5: Line-by-Line Bilingual Concepts + Unit Exam-Likely Q&As Builder
 * - Injects structured `bilingualConcepts` & `examQA` into all 107 core weeks across 5 UNSW subjects.
 * - Cleans legacy ugly inline-styled `<span class='bi-add' style='...'>` into clean semantic `<span class="bi-add">`.
 * - Preserves 100% of existing notes, tutorial answers, and all 797 diagrams untouched.
 * - Updates data-chunks/courses/*.json, data-chunks/index.json, and data.js in sync.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const CHUNKS_DIR = path.join(PUB, 'data-chunks');
const COURSES_DIR = path.join(CHUNKS_DIR, 'courses');
const DATA_JS = path.join(PUB, 'data.js');

const BANKS = {
  accounting: require('./bilingual-bank/accounting'),
  economics: require('./bilingual-bank/economics'),
  mathematics: require('./bilingual-bank/mathematics'),
  computing: require('./bilingual-bank/computing'),
  english: require('./bilingual-bank/english')
};

function cleanLegacyBiAdd(html) {
  if (!html) return { html: '', cleaned: 0 };
  let cleaned = 0;
  const out = String(html).replace(
    /<span\s+class=(["'])bi-add\1\s+style=(["'])[^"']*\2>/gi,
    () => {
      cleaned++;
      return '<span class="bi-add">';
    }
  );
  return { html: out, cleaned };
}

function main() {
  console.log('Reading data.js ...');
  const raw = fs.readFileSync(DATA_JS, 'utf8');
  const prefixIdx = raw.indexOf('window.PORTAL_DATA');
  if (prefixIdx === -1) throw new Error('window.PORTAL_DATA not found');
  const jsonStart = raw.indexOf('{', prefixIdx);
  const jsonEnd = raw.lastIndexOf('}');
  const DATA = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

  let totalWeeks = 0;
  let coveredWeeks = 0;
  let totalConcepts = 0;
  let totalExamQA = 0;
  let totalCleanedBiAdd = 0;
  const summary = {};

  for (const course of DATA.courses || []) {
    const bank = BANKS[course.id];
    if (!bank) continue;

    let cWeeks = 0;
    let cCovered = 0;
    let cConcepts = 0;
    let cQA = 0;
    let cCleaned = 0;

    for (const term of course.terms || []) {
      for (const week of term.weeks || []) {
        totalWeeks++;
        cWeeks++;

        // Clean legacy ugly red-bordered inline styles on <span class="bi-add">
        if (week.graphicHtml) {
          const r = cleanLegacyBiAdd(week.graphicHtml);
          week.graphicHtml = r.html;
          cCleaned += r.cleaned;
          totalCleanedBiAdd += r.cleaned;
        }
        if (typeof week.tutorialAnswers === 'string') {
          const r = cleanLegacyBiAdd(week.tutorialAnswers);
          week.tutorialAnswers = r.html;
          cCleaned += r.cleaned;
          totalCleanedBiAdd += r.cleaned;
        }

        const key = `${term.id}:${week.num}`;
        const entry = bank[key];
        if (!entry) {
          console.warn(`MISSING bilingual bank entry for ${course.id}:${key} (${week.title})`);
          continue;
        }
        week.bilingualConcepts = entry.concepts || [];
        week.examQA = entry.examQA || [];
        coveredWeeks++;
        cCovered++;
        cConcepts += week.bilingualConcepts.length;
        cQA += week.examQA.length;
        totalConcepts += week.bilingualConcepts.length;
        totalExamQA += week.examQA.length;
      }
    }

    course.bilingualConceptCount = cConcepts;
    course.examQaCount = cQA;
    summary[course.id] = { weeks: `${cCovered}/${cWeeks}`, concepts: cConcepts, examQA: cQA, cleanedLegacyBiAdd: cCleaned };

    // Write course chunk JSON
    fs.writeFileSync(path.join(COURSES_DIR, `${course.id}.json`), JSON.stringify(course), 'utf8');
  }

  // Update data-chunks/index.json metadata
  const indexPath = path.join(CHUNKS_DIR, 'index.json');
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const courseMap = new Map((DATA.courses || []).map(c => [c.id, c]));
  for (const ic of indexData.courses || []) {
    const full = courseMap.get(ic.id);
    if (!full || !BANKS[ic.id]) continue;
    ic.bilingualConceptCount = full.bilingualConceptCount || 0;
    ic.examQaCount = full.examQaCount || 0;
    for (const it of ic.terms || []) {
      const ft = (full.terms || []).find(t => t.id === it.id);
      if (!ft) continue;
      for (const iw of it.weeks || []) {
        const fw = (ft.weeks || []).find(w => Number(w.num) === Number(iw.num));
        if (fw) {
          iw.bilingualCount = (fw.bilingualConcepts || []).length;
          iw.examQaCount = (fw.examQA || []).length;
        }
      }
    }
  }
  fs.writeFileSync(indexPath, JSON.stringify(indexData), 'utf8');

  // Re-write data.js
  const newDataJs = raw.slice(0, jsonStart) + JSON.stringify(DATA) + raw.slice(jsonEnd + 1);
  fs.writeFileSync(DATA_JS, newDataJs, 'utf8');

  console.log('\n=== Phase 5 Bilingual Concepts & Exam Q&As Summary ===');
  console.log(`Covered core weeks: ${coveredWeeks}/${totalWeeks} | Bilingual concepts: ${totalConcepts} | Exam Q&As: ${totalExamQA} | Cleaned legacy bi-add styles: ${totalCleanedBiAdd}`);
  console.table(summary);
  if (coveredWeeks !== totalWeeks) process.exit(1);
}

main();
