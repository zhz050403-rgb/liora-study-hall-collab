const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const sections = {
  conclusion: '核心结论', background: '研究背景 / 事件背景',
  method: '研究方法与关键数据', findings: '详细发现与分析',
  limits: '证据局限与不同解释', application: '实际应用', practice: '思考与实践'
};
const live = path.resolve(__dirname, '../../线上版/public/daily-brief.html');
const cards = /<details\b[^>]*\bclass="reading-card"[^>]*>[\s\S]*?<\/details>/g;
const escape = s => s.replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);
function url(value) {
  assert(typeof value === 'string' && /^https:\/\//.test(value) && !/[\s\\]/.test(value), '需要 HTTPS 原文入口');
  const u = new URL(value);
  assert(!u.username && !u.password, '链接不能含凭据');
  u.hash = '';
  for (const key of [...u.searchParams.keys()]) if (/^utm_/i.test(key)) u.searchParams.delete(key);
  return u.href.replace(/\/$/, '');
}
function date(value) {
  assert(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), '日期使用 YYYY-MM-DD');
  const d = new Date(value + 'T00:00:00Z');
  assert(Number.isFinite(+d) && d.toISOString().slice(0, 10) === value, '无效日期');
  return +d;
}
function renderSections(article) {
  assert(typeof article.sourceNote === 'string' && article.sourceNote.trim(), '需要记录原文核对位置');
  assert(typeof article.access === 'string' && /^(开放获取|免费阅读|付费墙)$/.test(article.access), '需要标注访问状态');
  const content = Object.entries(sections).map(([key, title]) => {
    const paragraphs = article.sections?.[key];
    assert(Array.isArray(paragraphs) && paragraphs.length && paragraphs.every(p => typeof p === 'string' && p.trim()), '缺少栏目：' + title);
    return [title, paragraphs];
  });
  const length = content.flatMap(([, paragraphs]) => paragraphs).join('').match(/\p{Script=Han}/gu)?.length || 0;
  assert(length >= 600 && (length <= 1000 || (typeof article.longReason === 'string' && article.longReason.trim())), '中文正文须有 600–1000 个汉字，超长须说明理由：' + length);
  const sources = (article.alternates || []).map(s =>
    ` · <a href="${escape(url(s.url))}">${escape(s.label)}</a>`).join('');
  return `<p>${escape(article.access)} · 原文核对：${escape(article.sourceNote)}</p>
          ${content.map(([title, paragraphs]) => `<div class="rc-section"><h3>${title}</h3>${paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}</div>`).join('\n          ')}
          <a href="${escape(url(article.url))}">阅读原文 →</a>${sources}`;
}
function matchingCard(card, original) {
  return [...card.matchAll(/href="([^"]+)"/g)].some(([, href]) =>
    /^https:\/\//.test(href) && url(href.replaceAll('&amp;', '&')) === original);
}
function insertEdition(html, article) {
  const elapsed = (date(article.edition) - date(article.published)) / 86400000;
  assert(elapsed >= 0 && elapsed < 14, '不在最近 14 个自然日内');
  for (const key of ['category', 'source', 'title']) assert(typeof article[key] === 'string' && article[key].trim(), '缺少 ' + key);
  assert(!/[·,，、\/]/.test(article.category), '只允许一个分类');
  const existing = [...html.matchAll(cards)].map(m => m[0]);
  assert(!existing.some(c => c.includes(`data-edition="${article.edition}"`)), '本日期已有简报');
  assert(!existing.some(c => matchingCard(c, url(article.url))), '原文已经收录');
  const first = /<div\b[^>]*\bid="dailyBriefContent"[^>]*>/;
  assert(first.test(html), '缺少简报挂载点');
  const card = `<details class="reading-card" data-edition="${article.edition}">
        <summary><span class="rc-no">01</span><span class="rc-meta"><span class="rc-cat">${escape(article.category)} · ${escape(article.source)}</span><time class="rc-date" datetime="${article.published}">${article.published}</time></span><span class="rc-title">${escape(article.title)}</span><span class="rc-hint">展开</span></summary>
        <div class="rc-body">${renderSections(article)}</div>
      </details>`;
  const latest = [article.edition, ...existing.map(c => c.match(/data-edition="(\d{4}-\d{2}-\d{2})"/)?.[1] || '')].sort().at(-1);
  const [y, m, d] = latest.split('-');
  let index = 0;
  return html.replace(first, match => match + '\n      ' + card)
    .replace(cards, match => match.replace(/(<span class="rc-no">)\d+/, (_, start) => start + String(++index).padStart(2, '0')))
    .replace(/(<span\b[^>]*id="briefCount"[^>]*>)共 \d+ 篇/, (_, start) => start + '共 ' + index + ' 篇')
    .replace(/(<time id="briefDate" datetime=")[^"]+">[^<]+/, (_, start) => `${start}${latest}">收录至 ${y} 年 ${+m} 月 ${+d} 日`);
}
function previewExamples(html, examples) {
  for (const article of examples) {
    const matches = [...html.matchAll(cards)].filter(([c]) => matchingCard(c, url(article.url)));
    assert.equal(matches.length, 1, '样例原文必须唯一');
    const [before] = matches[0];
    const after = before.replace(/(<div class="rc-body">)[\s\S]*?(<\/div>\s*<\/details>)/, (_, start, end) => start + renderSections(article) + end);
    assert.notEqual(after, before, '未找到样例正文');
    html = html.replace(before, () => after);
  }
  return html;
}
function standaloneReview(html) {
  const assets = path.join(path.dirname(live), 'blocks');
  const css = fs.readFileSync(path.join(assets, 'daily-brief.css'), 'utf8');
  const js = fs.readFileSync(path.join(assets, 'daily-brief.js'), 'utf8');
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace('</head>', () => '<style>' + css + '</style></head>')
    .replace('</body>', () => '<script>' + js + '</script></body>');
}
if (require.main === module) {
  const [mode, input] = process.argv.slice(2);
  assert(['preview', 'edition'].includes(mode) && input, '用法：node generate.cjs preview|edition 输入.json');
  const source = fs.readFileSync(live, 'utf8');
  const model = JSON.parse(fs.readFileSync(input, 'utf8').replace(/^\uFEFF/, ''));
  const output = mode === 'preview' ? previewExamples(source, model) : insertEdition(source, model);
  const drafts = path.resolve(__dirname, '../../build/daily-brief-drafts');
  fs.mkdirSync(drafts, { recursive: true });
  const target = path.join(drafts, mode === 'edition' ? model.edition + '.html' : 'review.html');
  fs.writeFileSync(target, mode === 'preview' ? standaloneReview(output) : output);
  console.log('已生成 ' + target + '；正式源码未写入。');
}
module.exports = { renderSections, insertEdition, previewExamples, standaloneReview };
