'use strict';

const form = document.querySelector('#review-form');
const status = document.querySelector('#review-status');
const preview = document.querySelector('#review-preview');
const publish = document.querySelector('#publish-draft');
const endpoint = '/__api/notes-pipeline';
let draft;
let busy = false;

function selection() {
  const data = Object.fromEntries(new FormData(form));
  return {...data, week: Number(data.week)};
}
async function request(action, data) {
  const response = action === 'get'
    ? await fetch(endpoint + '?id=' + encodeURIComponent(data.id), {cache: 'no-store'})
    : await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Liora-Board': '1'},
      body: JSON.stringify({action, ...data})
    });
  const result = await response.json();
  if (!response.ok && !result.validation) {
    throw new Error((result.error || response.status) + (result.calls == null ? '' : '（模型调用 ' + result.calls + ' 次）'));
  }
  return result;
}
async function run(action) {
  if (busy || !form.reportValidity()) return;
  if (action === 'publish' && (!draft || !window.confirm('确认发布当前预览中的笔记？'))) return;
  const target = selection();
  busy = true;
  for (const control of form.elements) control.disabled = true;
  publish.disabled = true;
  status.textContent = action === 'generate' ? '正在提取资料并生成笔记，请保持页面打开。' : '处理中…';
  if (action !== 'publish') {
    draft = null;
    publish.hidden = true;
    preview.hidden = true;
  }
  try {
    if (action === 'publish') {
      await request(action, {id: draft.id, revision: draft.revision});
      publish.hidden = true;
      status.textContent = '已发布，旧笔记已留档。';
      return;
    }
    const id = [target.course, target.term, target.week].join('-');
    const result = await request(action, {...target, id});
    status.textContent = '模型调用 ' + result.calls + ' 次。\n' +
      JSON.stringify(result.validation, null, 2);
    if (result.html) {
      draft = result;
      preview.srcdoc = '<meta charset="utf-8"><link rel="stylesheet" href="notes-quality.css?v=20261111-notes-pipeline"><article class="gx">' + result.html + '</article>';
      preview.hidden = false;
      publish.hidden = Boolean(result.published);
    }
  } catch (error) {
    status.textContent = error.message;
  } finally {
    busy = false;
    for (const control of form.elements) control.disabled = false;
    publish.disabled = false;
  }
}
form.addEventListener('submit', event => { event.preventDefault(); run('generate'); });
document.querySelector('#load-draft').addEventListener('click', () => run('get'));
publish.addEventListener('click', () => run('publish'));
