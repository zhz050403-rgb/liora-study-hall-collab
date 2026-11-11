const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('public/index.html');
const source = read('public/data.js');
const context = { window: {} };
vm.runInNewContext(source, context);
for (const [, script] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  new vm.Script(script);
}
const hasContent = vm.runInNewContext('(' + html.match(/function weekHasContent\(w\)\{[^\n]+\}/)[0] + ')');
assert(hasContent({ graphicHtml: '<p>Notes</p>' }));
assert(!hasContent({}));
assert.match(read('server.js'), /name === '\/data\.js'[^\n]+\? 'no-cache'/);
assert.match(html, /src="data\.js\?v=/);

const searchContext = {
  DATA: { courses: [{ id: 'sample', terms: [{ id: 'term1', weeks: [
    { num: 1, title: 'Sample', graphicHtml: '<p>Profit &amp; loss</p>' },
  ] }] }] },
  document: { createElement(tag) {
    assert.equal(tag, 'textarea');
    return { set innerHTML(value) { this.value = value.replaceAll('&amp;', '&'); } };
  } },
};
const buildSearchIndex = html.slice(html.indexOf('function buildSearchIndex(){'), html.indexOf('function doSearch(q){'));
vm.runInNewContext(buildSearchIndex + '; buildSearchIndex();', searchContext);
assert.equal(searchContext.searchIndex[1].text.trim(), 'Profit & loss');

const inventory = {};
for (const id of ['accounting', 'economics', 'management', 'mathematics', 'english', 'computing']) {
  const course = context.window.PORTAL_DATA.courses.find(course => course.id === id);
  inventory[id] = course ? {} : null;
  const routes = new Set();
  for (const term of course?.terms ?? []) {
    for (const unit of term.weeks) {
      const route = '#/c/' + id + '/' + term.id + '/' + unit.num;
      assert(!routes.has(route), 'Duplicate route ' + route);
      routes.add(route);
      for (const [, resource] of (unit.tutorialAnswers || '').matchAll(/(?:src|href)="(sources\/math-reference\/[^"#]+)(?:#[^"]*)?"/g)) {
        assert(fs.existsSync(path.join(root, 'public', resource)), 'Missing answer resource on ' + route + ': ' + resource);
      }
      const notes = unit.graphicHtml || unit.notesHtml;
      inventory[id][route] = {
        title: unit.title,
        field: unit.graphicHtml ? 'graphicHtml' : unit.notesHtml ? 'notesHtml' : null,
        sha256: notes ? crypto.createHash('sha256').update(notes).digest('hex') : null,
        tutorialSha256: unit.tutorialAnswers ? crypto.createHash('sha256').update(JSON.stringify(unit.tutorialAnswers)).digest('hex') : null,
      };
    }
  }
}
console.log(JSON.stringify(inventory, null, 2));
