'use strict';
/* 笔记生成流程回归：标准样例必须通过；错答案、漏题、借贷不平、余额与原文不符必须被拦下；正文 HTML 必须被转义。 */
const assert = require('node:assert/strict');
const path = require('node:path');
const { validateWeek } = require('../notes/pipeline/validate');
const { renderWeek, inline } = require('../notes/pipeline/render');

const sample = require(path.join(__dirname, '../notes/pipeline/examples/mathematics-term2-w5.json'));
const clone = () => JSON.parse(JSON.stringify(sample));

let r = validateWeek(sample);
assert.deepEqual(r.errors, [], '标准样例应当通过：' + r.errors.join('；'));
assert.equal(r.stats.examples, 22);
const html = renderWeek(sample);
assert.match(html, /<details><summary>看解答<\/summary>/);
assert.match(html, /<span class="frac"><span class="n">5<\/span><span class="d">18<\/span><\/span>/);
assert.equal((html.match(/<rect x="\d+" y="\d+" width="40" height="40" fill="#f6e3b4"/g) || []).length, 10, '两颗骰子和 ≥ 9 应高亮 10 格');

const wrong = clone();
wrong.sections[0].examples[4].checks[0].equals = '1/3';
assert(validateWeek(wrong).errors.some(e => e.includes('核对不通过')), '错答案必须被拦下');

const missing = clone();
missing.sections[2].examples.pop();
assert(validateWeek(missing).errors.some(e => e.includes('L14 Ex 7')), '漏讲的课件例题必须被列出');

const noSource = clone();
noSource.sections[1].sources = [];
assert(validateWeek(noSource).errors.some(e => e.includes('来源')), '缺来源必须被拦下');

const ledger = clone();
ledger.sections[0].examples[0].figures = [{ type: 'ledger', endDate: '31', nextDate: '1', balance: true,
  journal: [{ date: '1', dr: [['Cash at Bank', 'asset', 100]], cr: [['Capital', 'equity', 90]] }] }];
assert(validateWeek(ledger).errors.some(e => e.includes('借贷不等')), '借贷不平的分录必须被拦下');

const expect = clone();
expect.sections[0].examples[0].figures = [{ type: 'ledger', endDate: '31', nextDate: '1', balance: true, expect: { 'Cash at Bank': 900 },
  journal: [{ date: '1', dr: [['Cash at Bank', 'asset', 1000]], cr: [['Capital', 'equity', 1000]] },
            { date: '2', dr: [['Rent Expense', 'expense', 50]], cr: [['Cash at Bank', 'asset', 50]] }] }];
assert(validateWeek(expect).errors.some(e => e.includes('与原文给出的 900 不符')), '余额与原文不符必须被拦下');
expect.sections[0].examples[0].figures[0].expect['Cash at Bank'] = 950;
assert.deepEqual(validateWeek(expect).errors, []);
assert.match(renderWeek(expect), /Balance c\/d<\/td><td>950/);

assert.equal(inline('<script>x</script><strong>ok</strong>'), '&lt;script&gt;x&lt;/script&gt;<strong>ok</strong>');
console.log('PASS: notes pipeline sample validates and renders; wrong answers, missing examples, missing sources, unbalanced and mismatched ledgers are rejected; raw HTML is escaped.');
