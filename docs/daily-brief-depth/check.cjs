const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { previewExamples, insertEdition, renderSections, standaloneReview } = require('./generate.cjs');
const examples = require('./examples.json');
const parent = path.resolve(__dirname, '../..');
const file = path.join(parent, '线上版/public/daily-brief.html');
const original = fs.readFileSync(file, 'utf8');
const review = previewExamples(original, examples);
const cards = html => [...html.matchAll(/<details class="reading-card"[^>]*>[\s\S]*?<\/details>/g)].map(x => x[0]);
assert.equal(cards(review).length, cards(original).length);
assert.equal(cards(review).filter((c, i) => c !== cards(original)[i]).length, 3);
assert.equal((review.match(/class="rc-section"/g) || []).length, 21);
assert.equal(review.match(/<script[\s\S]*$/)[0], original.match(/<script[\s\S]*$/)[0]);
const synthetic = { ...examples[0], url: 'https://example.org/new?q=a&word=b', edition: '2026-11-17', published: '2026-11-16', title: 'TEST <script>', category: '教育', source: 'TEST' };
const next = insertEdition(review, synthetic);
assert.equal(cards(next).length, cards(review).length + 1);
assert.match(cards(next)[0], /data-edition="2026-11-17"/);
assert.match(cards(next)[0], /TEST &lt;script&gt;/);
assert.match(cards(next)[0], /q=a&amp;word=b/);
assert.match(next, /id="briefDate" datetime="2026-11-17"/);
assert(next.includes('共 ' + cards(next).length + ' 篇'));
assert.throws(() => insertEdition(next, synthetic), /本日期已有/);
assert.throws(() => insertEdition(next, { ...synthetic, edition: '2026-11-18', url: synthetic.url + '&utm_source=x#top' }), /原文已经/);
assert.throws(() => insertEdition(review, { ...synthetic, published: '2026-11-03' }), /最近 14/);
assert.throws(() => insertEdition(review, { ...synthetic, published: '2026-02-30' }), /无效日期/);
assert.throws(() => insertEdition(review, { ...synthetic, category: '教育 · AI' }), /分类/);
assert.throws(() => renderSections({ ...synthetic, url: 'javascript:alert(1)' }), /HTTPS/);
assert.throws(() => renderSections({ ...synthetic, sections: { ...synthetic.sections, limits: [] } }), /缺少栏目/);
assert.throws(() => renderSections({ ...synthetic, sections: Object.fromEntries(Object.keys(synthetic.sections).map(key => [key, ['太短']])) }), /600/);
assert.equal(fs.readFileSync(file, 'utf8'), original);
console.log('PASS: existing archive, three samples, new edition, date/count, dedupe, escaping, validation, unchanged source');

// Load production page markup and real daily-brief assets, without starting
// the production server or loading unrelated scripts that may contact cloud APIs.
const dir = path.join(parent, 'build/daily-brief-drafts');
fs.mkdirSync(dir, { recursive: true });
const probe = standaloneReview(next).replace('</body>', () => `<script>
    try {
      const check = (ok, label) => { if (!ok) throw Error(label); };
      const all = () => [...document.querySelectorAll('.reading-card')];
      const visible = () => all().filter(c => !c.hidden);
      const el = id => document.getElementById(id);
      const search = text => { el('briefSearch').value = text; el('briefSearch').dispatchEvent(new Event('input')); };
      check(all()[0].dataset.edition === '2026-11-17', 'new first');
      check(all().filter(c => c.querySelector('.rc-section')).length === 4, 'old and new coexist');
      all()[0].querySelector('summary').click();
      check(all()[0].open, 'expand single');
      all()[0].querySelector('summary').click();
      check(!all()[0].open, 'collapse single');
      el('briefFoldAll').click();
      check(all().every(c => c.open), 'expand all');
      check(innerWidth >= 500 || document.documentElement.scrollWidth <= innerWidth, 'mobile overflow');
      el('briefFoldAll').click();
      check(all().every(c => !c.open), 'collapse all');
      el('briefCategory').value = '金融';
      el('briefCategory').dispatchEvent(new Event('change'));
      check(visible().length > 0 && visible().every(c => c.querySelector('.rc-cat').textContent.startsWith('金融')), 'category');
      search('324');
      check(visible().length === 1, 'deep text search + category');
      search('NO MATCH 123');
      check(!visible().length && !el('briefEmpty').hidden, 'empty state');
      el('briefCategory').value = '';
      search('');
      el('briefSort').click();
      check(all().at(-1).dataset.edition === '2026-11-17', 'reverse order');
      check(all().every(c => c.querySelector('.rc-body a[href^="https://"]')), 'original links');
      document.body.dataset.testResult = 'PASS ' + innerWidth;
    } catch (e) { document.body.dataset.testResult = 'FAIL ' + e.message; }
  </script></body>`);
fs.writeFileSync(path.join(dir, 'browser-check.html'), probe);
const escaped = probe.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
fs.writeFileSync(path.join(dir, 'mobile-check.html'),
  '<!doctype html><meta charset="utf-8"><body><iframe width="390" height="840" srcdoc="' + escaped +
  '" onload="document.body.dataset.testResult=this.contentDocument.body.dataset.testResult"></iframe>');
