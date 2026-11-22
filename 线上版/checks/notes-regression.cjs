'use strict';
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
  if (script.trim()) new vm.Script(script);
}

assert.match(read('server/static.js'), /name === '\/data\.js'[\s\S]{0,160}\? 'no-cache'/);
assert.match(html, /src="app\/main\.js\?v=/);

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
      for (const field of ['graphicHtml', 'notesHtml', 'tutorialAnswers']) {
        const resources = (unit[field] || '').matchAll(/(?:src|href)="(\/?sources\/math-reference\/[^"#]+)(?:#[^"]*)?"/g);
        for (const [, resource] of resources) {
          const relativePath = resource.replace(/^\//, '');
          assert(
            fs.statSync(path.join(root, 'public', relativePath), { throwIfNoEntry: false })?.isFile(),
            'Missing ' + field + ' resource on ' + route + ': ' + resource
          );
        }
      }
      const notes = unit.graphicHtml || unit.notesHtml;
      inventory[id][route] = {
        title: unit.title,
        field: unit.graphicHtml ? 'graphicHtml' : unit.notesHtml ? 'notesHtml' : null,
        sha256: notes ? crypto.createHash('sha256').update(notes).digest('hex') : null,
        tutorialSha256: unit.tutorialAnswers ? crypto.createHash('sha256').update(JSON.stringify(unit.tutorialAnswers)).digest('hex') : null
      };
    }
  }
}
console.log(JSON.stringify(inventory, null, 2));
