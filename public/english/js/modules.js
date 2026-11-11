/* =========================================================
 * Liora English · 学习模块层
 * 精读（点词/划词/长难句解析）· 精听（TTS 播放器）
 * 写作（四维批改）· 口语（AI 对话 + 语音 + 反馈报告）
 * ========================================================= */

/* ---------- 通用小组件 ---------- */
function emptyState(icon, title, desc, action, view, btnText) {
  return '<div class="empty"><div class="empty-icon">' + icon + '</div><h3>' + esc(title) + '</h3><p>' + esc(desc) + '</p>' +
    (action ? '<button class="btn btn-primary" data-action="' + action + '" data-view="' + view + '">' + esc(btnText) + '</button>' : '') + '</div>';
}

function articleHeaderHtml(article, withSwitch) {
  return '<div class="flex-between mb"><div>' +
    '<div class="article-meta">' +
    '<span class="tag tag-level">' + esc(article.level || 'B2') + '</span>' +
    '<span class="tag tag-source">' + esc(article.source || '导入') + '</span>' +
    '<span class="tag tag-source">' + esc(article.topic || '综合') + '</span>' +
    '</div><h2 class="article-title">' + esc(article.title) + '</h2></div>' +
    (withSwitch ? '<button class="btn btn-sm" data-action="goto" data-view="library">切换文章</button>' : '') + '</div>';
}

function nextStepHtml(article, prog) {
  if (!prog.listen) return '下一步：<button class="btn btn-sm btn-primary mt" data-action="goto" data-view="listen">去精听这篇 →</button>';
  if (!prog.write) return '下一步：<button class="btn btn-sm btn-primary mt" data-action="goto" data-view="write">去写作练笔 →</button>';
  if (!prog.speak) return '下一步：<button class="btn btn-sm btn-primary mt" data-action="goto" data-view="speak">去口语讨论 →</button>';
  return '🎉 本篇四个环节都完成了！<button class="btn btn-sm mt" data-action="goto" data-view="library">换一篇继续 →</button>';
}

function progressCheckline(article) {
  const prog = (Store.data.progress[article.id]) || {};
  const items = [['read', '精读'], ['listen', '精听'], ['write', '写作'], ['speak', '口语']];
  return '<div class="checkline">' + items.map((it) =>
    '<span class="check-item ' + (prog[it[0]] ? 'on' : '') + '">' + (prog[it[0]] ? '✓ ' : '') + it[1] + '</span>'
  ).join('') + '</div>';
}

/* =========================================================
 * 精读模块
 * ========================================================= */
function wrapWords(text) {
  const re = /([A-Za-z]+(?:['’\-][A-Za-z]+)*)/g;
  let out = '', last = 0, m;
  while ((m = re.exec(text)) !== null) {
    out += esc(text.slice(last, m.index));
    out += '<span class="w" data-word="' + esc(m[1]) + '">' + esc(m[1]) + '</span>';
    last = m.index + m[1].length;
  }
  out += esc(text.slice(last));
  return out;
}

function escapeReg(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/* ---------- 本地预生成内容（免 API） ----------
 * 每篇文章可配一份本地预生成缓存（由 tools/build_*.js 生成）：
 *   window.LIORA_LOCAL_CACHES[articleId] —— 统一注册表（推荐）
 *   window.SDG11_CACHE / window.AI_ETHICS_CACHE —— 兼容旧版单篇全局变量
 *   words   —— 文章全部单词的点译（按单词查，跨句子通用）
 *   analyze —— 文章全部句子的长难句解析（按句子查）
 * 仅当正在读对应文章时生效；未命中时回落到 API 链路。 */
function localCacheFor(articleId) {
  const reg = window.LIORA_LOCAL_CACHES || {};
  let c = articleId ? reg[articleId] : null;
  if (!c) {
    /* 兼容旧版：只有单篇全局变量的缓存文件 */
    const legacy = window.SDG11_CACHE;
    if (legacy && legacy.words && legacy.analyze &&
        (!legacy.articleId || !articleId || legacy.articleId === articleId)) c = legacy;
  }
  if (!c || !c.words || !c.analyze) return null;
  return c;
}

function getLocalWordMeaning(word, articleId) {
  const c = localCacheFor(articleId);
  if (!c) return null;
  const k = String(word || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(c.words, k) ? c.words[k] : null;
}

/* 句子归一化：合并空白 + 去掉段首的 [1] [2] 编号（页面显示与缓存键都要忽略它） */
const _normSentence = (s) => String(s || '').replace(/\s+/g, ' ').replace(/^\s*\[\d+\]\s*/, '').trim();

/* 每篇文章一份索引表，避免多篇之间互相覆盖 */
const _localAnalyzeIdxMap = {};
function getLocalAnalyze(sentence, articleId) {
  const c = localCacheFor(articleId);
  if (!c) return null;
  const key = articleId || '_';
  if (!_localAnalyzeIdxMap[key]) {
    const map = {};
    Object.keys(c.analyze).forEach((k) => { map[_normSentence(k)] = c.analyze[k]; });
    _localAnalyzeIdxMap[key] = { map: map, keys: Object.keys(map) };
  }
  const bucket = _localAnalyzeIdxMap[key];
  const q = _normSentence(sentence);
  if (bucket.map[q]) return bucket.map[q];
  /* 兜底：选中的文本可能包含多句（如整段、跨句划词），
     取其中「被完整包含且最长」的已缓存句子来解析，避免因此回落到 API。 */
  let best = null;
  bucket.keys.forEach((k) => {
    if (k.length >= 20 && q.indexOf(k) !== -1 && (!best || k.length > best.length)) best = k;
  });
  return best ? bucket.map[best] : null;
}

function sentenceContaining(paragraphText, word) {
  const sents = paragraphText.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [paragraphText];
  const re = new RegExp('\\b' + escapeReg(word) + '\\b', 'i');
  const found = sents.find((s) => re.test(s));
  return (found || paragraphText).trim().slice(0, 300);
}

function placeNear(el, pop) {
  const r = el.getBoundingClientRect();
  pop.classList.remove('hidden');
  const pw = pop.offsetWidth || 260;
  const ph = pop.offsetHeight || 120;
  let left = r.left + window.scrollX + r.width / 2 - pw / 2;
  left = Math.max(8, Math.min(left, window.scrollX + window.innerWidth - pw - 8));
  let top = r.bottom + window.scrollY + 8;
  if (top + ph > window.scrollY + window.innerHeight - 8) top = Math.max(window.scrollY + 8, r.top + window.scrollY - ph - 8);
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}

function setReadToolsOpen(open) {
  const drawer = $('#readToolDrawer');
  if (!drawer) return;
  drawer.classList.toggle('open', open);
  const toggle = $('#readToolsToggle');
  if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function setReadPanel(title, text) {
  const el = $('#readPanel');
  if (!el) return;
  el.innerHTML = '<h4>' + esc(title) + '</h4>' + esc(text);
  setReadToolsOpen(true);
}

function renderRead() {
  const view = $('#view-read');
  const article = App.articleId ? getArticle(App.articleId) : null;
  if (!article) {
    view.innerHTML = '<h2 class="page-title">精读</h2>' + emptyState('📖', '还没有选择文章', '先去素材库选一篇 B2 难度的文章，开始「输入」环节', 'goto', 'library', '去素材库选文章');
    return;
  }
  const prog = (Store.data.progress[article.id]) || {};
  const wc = wordCount((article.paragraphs || []).join(' '));
  const estMin = Math.max(8, Math.round(wc / 150));
  const paras = (article.paragraphs || []).map((p, i) =>
    '<p><span class="pn">' + (i + 1) + '</span>' + wrapWords(p) + '</p>'
  ).join('');
  const pinnedTag = (PINNED_ARTICLE_IDS.indexOf(article.id) !== -1) ? '<span class="tag tag-pin">置顶</span>' : '';
  view.innerHTML =
    '<div class="read-layout immersive-read">' +
      '<article class="exam-card">' +
        '<header class="exam-head">' +
          '<div class="exam-topline">' +
            '<div class="exam-label">READING PASSAGE <span class="exam-num">1</span></div>' +
            '<button class="btn btn-sm" data-action="goto" data-view="library">切换文章</button>' +
          '</div>' +
          '<h1 class="exam-title">' + esc(article.title) + '</h1>' +
          '<div class="exam-meta">' +
            '<span class="tag tag-level">' + esc(article.level || 'B2') + '</span>' +
            '<span class="tag tag-source">' + esc(article.source || '导入') + '</span>' +
            '<span class="tag tag-source">' + esc(article.topic || '综合') + '</span>' + pinnedTag +
          '</div>' +
          '<div class="exam-instruction">You should spend about ' + estMin + ' minutes on this passage (' + wc + ' words).</div>' +
        '</header>' +
        '<div class="exam-body" id="articleBody">' + paras + '</div>' +
        '<footer class="exam-footer"><span>P1</span><span>' + (article.paragraphs || []).length + ' paragraphs · ' + wc + ' words</span><button class="linklike" data-action="read-tools">解析 / 我的标注</button></footer>' +
      '</article>' +
      '<button class="read-tools-fab" id="readToolsToggle" data-action="read-tools" aria-controls="readToolDrawer" aria-expanded="false">🖍 <span>学习工具</span></button>' +
      '<aside class="side-panel read-tool-drawer" id="readToolDrawer" aria-label="阅读学习工具">' +
        '<div class="drawer-head"><strong>阅读工具</strong><button class="drawer-close" data-action="read-tools-close" aria-label="关闭阅读工具">×</button></div>' +
        '<div class="panel-box"><h4>🔍 解析面板</h4><div class="panel-body" id="readPanel"><span class="placeholder">选中文章中的单词或句子，结果会显示在这里。</span></div></div>' +
        renderHighlightPanel(article) +
        '<div class="panel-box"><h4>🧭 学习下一步</h4><div class="panel-body">' + nextStepHtml(article, prog) + '</div></div>' +
        '<p class="drawer-help">鼠标指到单词上即弹出释义（也可点击）；选中词句可翻译、解析或高亮；点击黄色高亮可取消。</p>' +
      '</aside>' +
    '</div>';
  /* 标记已收入生词本的单词（绿色底纹，可在「设置 → 阅读显示」关闭；默认关） */
  if (Store.data.settings && Store.data.settings.markSavedWords) {
    const savedSet = {};
    (Store.data.vocab || []).forEach((v) => { savedSet[v.word.toLowerCase()] = true; });
    $$('#articleBody .w').forEach((el) => {
      if (savedSet[(el.getAttribute('data-word') || '').toLowerCase()]) el.classList.add('saved');
    });
  }
  applyHighlights();
  markProgress(article.id, 'read');
}

/* ---------- 精读高亮标注 ---------- */
function normalizeWs(s) { return String(s || '').replace(/\s+/g, ' '); }

function renderHighlightPanel(article) {
  const list = (Store.data.highlights && Store.data.highlights[article.id]) || [];
  const items = list.length
    ? list.map((h) => '<div class="hl-item" data-action="hl-locate" data-id="' + esc(h.id) + '">' +
        '<span class="hl-text">' + esc(h.text.length > 60 ? h.text.slice(0, 60) + '…' : h.text) + '</span>' +
        '<button class="hl-x" data-action="hl-remove" data-id="' + esc(h.id) + '" title="删除标注">×</button>' +
      '</div>').join('')
    : '<div class="hl-empty">还没有标注。选中文章中的词句，点「🖍 高亮」即可标记重点。</div>';
  return '<div class="panel-box" id="hlPanel"><h4>🖍 我的标注 <span class="hl-count">' + list.length + '</span></h4>' +
    '<div class="hl-list">' + items + '</div>' +
    (list.length ? '<button class="btn btn-sm btn-danger mt" data-action="hl-clear">清除全部标注</button>' : '') +
    '</div>';
}

function refreshHighlightPanel() {
  const article = App.articleId ? getArticle(App.articleId) : null;
  const box = $('#hlPanel');
  if (article && box) box.outerHTML = renderHighlightPanel(article);
}

function unwrapMarks(root) {
  $$('mark.hl', root).forEach((m) => {
    const parent = m.parentNode;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
  });
}

/* 在单个段落内把 target 文本包裹为高亮；成功返回 true */
function wrapTargetInParagraph(p, hid, target) {
  target = normalizeWs(target);
  if (!target) return false;
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && n.parentElement.closest('mark.hl')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  const nodes = [];
  let tn;
  while ((tn = walker.nextNode())) if (tn.nodeValue) nodes.push(tn);
  let raw = '';
  const offsets = [];
  nodes.forEach((nd) => { offsets.push(raw.length); raw += nd.nodeValue; });
  /* 用宽松空白规则做匹配，并记录 规范化字符 -> 原始下标 */
  const normToRaw = [];
  let normLen = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch !== ' ') { normToRaw[normLen++] = i; }
    else if (i + 1 < raw.length && raw[i + 1] !== ' ') { normToRaw[normLen++] = i; }
  }
  const pos = normalizeWs(raw).indexOf(target);
  if (pos === -1) return false;
  const rawStart = normToRaw[pos];
  const rawEnd = normToRaw[pos + target.length - 1] + 1;
  let si = 0, ei = nodes.length - 1;
  while (si < nodes.length && offsets[si] + nodes[si].nodeValue.length <= rawStart) si++;
  while (ei >= 0 && offsets[ei] >= rawEnd) ei--;
  if (si > ei) return false;
  const range = document.createRange();
  range.setStart(nodes[si], rawStart - offsets[si]);
  range.setEnd(nodes[ei], rawEnd - offsets[ei]);
  const mark = document.createElement('mark');
  mark.className = 'hl';
  mark.setAttribute('data-hid', hid);
  mark.setAttribute('data-action', 'hl-remove');
  mark.setAttribute('data-id', hid);
  mark.setAttribute('title', '点击取消高亮');
  mark.appendChild(range.extractContents());
  range.insertNode(mark);
  return true;
}

function applyHighlights() {
  const body = $('#articleBody');
  if (!body) return;
  unwrapMarks(body);
  const article = App.articleId ? getArticle(App.articleId) : null;
  if (!article) return;
  const list = (Store.data.highlights && Store.data.highlights[article.id]) || [];
  list.forEach((h) => {
    const ps = body.querySelectorAll('p');
    for (const p of ps) { if (wrapTargetInParagraph(p, h.id, h.text)) break; }
  });
}

function selHighlight() {
  const text = (App._selText || '').trim();
  $('#selToolbar').classList.add('hidden');
  if (!text) return;
  const article = App.articleId ? getArticle(App.articleId) : null;
  if (!article) return;
  Store.data.highlights = Store.data.highlights || {};
  const list = Store.data.highlights[article.id] || (Store.data.highlights[article.id] = []);
  const key = normalizeWs(text).toLowerCase();
  if (list.some((h) => normalizeWs(h.text).toLowerCase() === key)) { toast('这段已经标注过了'); return; }
  list.push({ id: uid(), text: text });
  Store.save();
  applyHighlights();
  refreshHighlightPanel();
  toast('已高亮标注');
}

function removeHighlight(id) {
  const article = App.articleId ? getArticle(App.articleId) : null;
  if (!article || !Store.data.highlights) return;
  Store.data.highlights[article.id] = (Store.data.highlights[article.id] || []).filter((h) => h.id !== id);
  Store.save();
  applyHighlights();
  refreshHighlightPanel();
  toast('已取消高亮');
}

function clearHighlights() {
  const article = App.articleId ? getArticle(App.articleId) : null;
  if (!article) return;
  Store.data.highlights = Store.data.highlights || {};
  Store.data.highlights[article.id] = [];
  Store.save();
  applyHighlights();
  refreshHighlightPanel();
  toast('已清除全部标注');
}

function locateHighlight(id) {
  const mark = document.querySelector('#articleBody mark.hl[data-hid="' + esc(id) + '"]');
  if (mark) {
    setReadToolsOpen(false);
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    mark.classList.add('hl-flash');
    setTimeout(() => mark.classList.remove('hl-flash'), 900);
  }
}

/* 单词弹窗 */
async function showWordPopup(spanEl) {
  const word = spanEl.getAttribute('data-word') || '';
  const p = spanEl.closest('p');
  const sentence = sentenceContaining(p ? p.textContent : word, word);
  const pop = $('#wordPopup');
  pop.setAttribute('data-w', word.toLowerCase());   // 异步护栏：只允许当前单词的结果写回弹窗
  const ph = window.getPhonetic ? window.getPhonetic(word) : '';
  pop.innerHTML =
    '<div class="wp-word">' + esc(word) +
      (ph ? ' <span class="wp-phonetic">' + esc(ph) + '</span>' : '') + '</div>' +
    '<div class="wp-meaning" id="wpMeaning"><span class="muted">查询中…</span></div>' +
    '<div class="wp-actions">' +
      '<button class="btn btn-sm" data-action="wp-speak" data-word="' + esc(word) + '">🔊 发音</button>' +
      '<button class="btn btn-sm" data-action="wp-add" data-word="' + esc(word) + '" data-sentence="' + esc(sentence.slice(0, 120)) + '">⭐ 加入生词本</button>' +
      '<button class="btn btn-sm" data-action="wp-close">关闭</button>' +
    '</div>';
  placeNear(spanEl, pop);

  const stillCurrent = () => pop.getAttribute('data-w') === word.toLowerCase() && $('#wpMeaning');
  const key = word.toLowerCase() + '|||' + sentence;
  const cached = Store.data.wordCache[key];
  if (cached) { if (stillCurrent()) $('#wpMeaning').innerHTML = esc(cached); return; }
  /* 本地预生成词义：命中则完全不调用 API（同时写入缓存，供「加入生词本」取用） */
  const localW = getLocalWordMeaning(word, App.articleId);
  if (localW) {
    Store.data.wordCache[key] = localW;
    Store.save();
    if (stillCurrent()) $('#wpMeaning').innerHTML = esc(localW);
    return;
  }
  if (!hasApiKey()) { if (stillCurrent()) $('#wpMeaning').innerHTML = '<span class="muted">未配置 API Key，无法查词。请先到「设置」填写。</span>'; return; }
  try {
    const r = await LLM.chat(PROMPTS.word(word, sentence), { maxTokens: 200, temperature: 0.3 });
    Store.data.wordCache[key] = r;
    Store.save();
    if (stillCurrent()) $('#wpMeaning').innerHTML = esc(r);
  } catch (e) {
    if (stillCurrent()) $('#wpMeaning').innerHTML = '<span style="color:var(--danger)">' + esc(LLM.friendlyError(e)) + '</span>';
  }
}

function addVocabFromPopup(word, sentence) {
  const article = App.articleId ? getArticle(App.articleId) : null;
  const exists = (Store.data.vocab || []).some((v) => v.word.toLowerCase() === word.toLowerCase());
  if (exists) { toast('生词本里已经有 ' + word + ' 了'); return; }
  const key = word.toLowerCase() + '|||' + sentence;
  let meaning = (Store.data.wordCache[key] || '').split('\n')[0].slice(0, 120);
  /* 回退：弹窗传入的句子可能被截断（只保留 120 字），导致键对不上——
     先按「同一个单词」在缓存里找任意一条，再找本地预生成词库。 */
  if (!meaning) {
    const lw = word.toLowerCase() + '|||';
    const hit = Object.keys(Store.data.wordCache).find((k) => k.indexOf(lw) === 0);
    if (hit) meaning = Store.data.wordCache[hit].split('\n')[0].slice(0, 120);
  }
  if (!meaning) {
    const localW = getLocalWordMeaning(word, App.articleId);
    if (localW) meaning = localW.split('\n')[0].slice(0, 120);
  }
  if (!meaning) meaning = '（释义见查询记录）';
  Store.data.vocab.unshift({
    id: uid(), word: word, meaning: meaning,
    phonetic: window.getPhonetic ? window.getPhonetic(word) : '',
    articleId: App.articleId, articleTitle: article ? article.title : '',
    level: 0, due: todayStr(), reps: 0, addedAt: Date.now()
  });
  Store.save();
  logActivity('vocab', '收录生词 ' + word);
  toast('已加入生词本：' + word);
  if (Store.data.settings && Store.data.settings.markSavedWords) {
    $$('.w.saved').forEach((el) => el.classList.remove('saved'));
    $$('#articleBody .w').forEach((el) => {
      if ((el.getAttribute('data-word') || '').toLowerCase() === word.toLowerCase()) el.classList.add('saved');
    });
  }
}

/* 划词工具栏 */
function setupSelectionToolbar() {
  document.addEventListener('mouseup', (e) => {
    setTimeout(() => {
      const bar = $('#selToolbar');
      if (!bar) return;
      if (e.target.closest('#selToolbar') || e.target.closest('#wordPopup')) return;
      const body = $('#articleBody');
      if (!body) { bar.classList.add('hidden'); return; }
      const sel = window.getSelection();
      const text = sel ? String(sel.toString()).trim() : '';
      if (!text || text.length < 2 || !body.contains(sel.anchorNode)) { bar.classList.add('hidden'); return; }
      App._selText = text;
      bar.innerHTML =
        '<button data-action="sel-translate">🌐 翻译</button>' +
        '<button data-action="sel-analyze">🧩 长难句解析</button>' +
        '<button data-action="sel-highlight">🖍 高亮</button>';
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      placeNear({ getBoundingClientRect: () => rect }, bar);
    }, 10);
  });
}

async function selTranslate() {
  const text = App._selText || '';
  if (!text) return;
  $('#selToolbar').classList.add('hidden');
  /* 本地预生成：直接取该句解析里的「中文翻译」部分 */
  const local = getLocalAnalyze(text, App.articleId);
  if (local) {
    const m = local.match(/1\.\s*中文翻译[:：]\s*([\s\S]*?)(?=\n\s*2\.|$)/);
    if (m && m[1] && m[1].trim()) {
      setReadPanel('🌐 翻译', m[1].trim() + '\n\n—— 📦 取自本地预生成解析，未调用 API ——');
      return;
    }
  }
  if (!requireApiKey()) return;
  setReadPanel('🌐 翻译', '翻译中…');
  try {
    const r = await LLM.chat(PROMPTS.translate(text), { maxTokens: 400, temperature: 0.3 });
    setReadPanel('🌐 翻译', r);
  } catch (e) { setReadPanel('🌐 翻译', LLM.friendlyError(e)); }
}

async function selAnalyze() {
  const text = App._selText || '';
  if (!text) return;
  $('#selToolbar').classList.add('hidden');
  /* 本地预生成的长难句解析：命中则完全不调用 API */
  const local = getLocalAnalyze(text, App.articleId);
  if (local) {
    setReadPanel('🧩 长难句解析', local + '\n\n—— 📦 本地预生成内容，未调用 API ——');
    return;
  }
  if (!requireApiKey()) return;
  setReadPanel('🧩 长难句解析', '分析中…');
  try {
    const r = await LLM.chat(PROMPTS.analyze(text), { maxTokens: 700, temperature: 0.4 });
    setReadPanel('🧩 长难句解析', r);
  } catch (e) { setReadPanel('🧩 长难句解析', LLM.friendlyError(e)); }
}

/* =========================================================
 * 精听模块
 * ========================================================= */
let _playToken = 0;

function renderListen() {
  const view = $('#view-listen');
  let html = '<h2 class="page-title">🎧 精听</h2>' +
    '<p class="page-desc">真实听力素材 · 按周次组织的 UNSW workshop 音频。建议先盲听，再配合「原文 / 听写」对照精听。</p>' +
    renderAudioLibrary();
  if (App.listen.audioId) {
    html += renderAudioPlayer(App.listen.audioId);
  } else if (App.articleId) {
    html += renderArticleListen();
  } else {
    html += '<div class="card muted">还没有选择文章。如果想用文章做 TTS 精听，先去 <a data-action="goto" data-view="library" class="linklike">素材库</a> 选一篇。</div>';
  }
  view.innerHTML = html;
  if (App.listen.audioId) wireAudioPlayer();
}

/* ---------- 听力素材库（真实音频，按周次） ---------- */
function audioSrcOf(item) {
  if (item._objUrl) return item._objUrl;        // 会话内手动导入
  return encodeURI(LISTEN_BASE + item.file);     // 本机 file:// 路径
}

function renderAudioLibrary() {
  const groups = {};
  LISTEN_AUDIO.forEach((it) => { (groups[it.workshop] = groups[it.workshop] || []).push(it); });
  let cards = '<div class="listen-lib"><h3>📚 听力素材库（按周次）</h3>';
  Object.keys(groups).sort((a, b) => a - b).forEach((w) => {
    cards += '<div class="lib-group"><div class="lib-group-title">Workshop ' + w + '</div><div class="lib-items">';
    groups[w].forEach((it) => {
      const done = Store.data.listenDone[it.id] ? ' <span class="tag tag-ok">✓ 已听</span>' : '';
      const active = App.listen.audioId === it.id ? ' active' : '';
      cards += '<div class="lib-item' + active + '" data-action="listen-select" data-id="' + it.id + '">' +
        '<span class="lib-play">▶</span><span class="lib-title">' + esc(it.title) + done + '</span></div>';
    });
    cards += '</div></div>';
  });
  cards += '<p class="muted mt">提示：音频文件在你的本机课程文件夹。若浏览器拦截了自动加载，点开任意一条后在播放器里用「导入此文件」手动选择即可。</p>';
  cards += '</div>';
  return cards;
}

function renderArticleListen() {
  const article = getArticle(App.articleId);
  if (!article) return '';
  App.listen.sentences = articleSentences(article);
  if (App.listen.idx >= App.listen.sentences.length) App.listen.idx = 0;
  const n = App.listen.sentences.length;
  const cur = App.listen.sentences[App.listen.idx] || '';
  const rate = App.listen.rate || (Store.data.settings.ttsRate || 1);
  const rows = App.listen.sentences.map((s, i) =>
    '<div class="sentence-row ' + (i === App.listen.idx ? 'active' : '') + ' ' + (App.listen.played[i] ? 'played' : '') + '" data-action="listen-jump" data-idx="' + i + '">' +
    '<span class="sn">' + (i + 1) + '</span><span>' + esc(s) + '</span></div>'
  ).join('');
  return '<div class="card"><h3>📖 文章精听 · 句子列表</h3>' +
    '<div class="listen-now">' +
      '<div class="ln-label">正在精听 · 第 ' + (App.listen.idx + 1) + ' / ' + n + ' 句' + (App.listen.played[App.listen.idx] ? ' · 已播放' : '') + '</div>' +
      '<div class="ln-sentence' + (App.listen.hideText ? ' blurred' : '') + '" id="lnSentence">' + esc(cur) + '</div>' +
      '<div class="listen-controls">' +
        '<button class="btn" data-action="listen-toggle">' + (App.listen.playing ? '⏸ 暂停' : '▶ 播放') + '</button>' +
        '<button class="btn" data-action="listen-prev">⏮ 上一句</button>' +
        '<button class="btn" data-action="listen-next">下一句 ⏭</button>' +
        '<button class="btn" data-action="listen-repeat">🔁 单句循环：' + (App.listen.repeat ? '开' : '关') + '</button>' +
        '<button class="btn" data-action="listen-hide">' + (App.listen.hideText ? '👁 显示原文' : '🙈 隐藏原文') + '</button>' +
        '<select data-action="listen-rate" aria-label="语速">' +
          [0.6, 0.8, 1, 1.2].map((r) => '<option value="' + r + '"' + (Math.abs(r - rate) < 0.01 ? ' selected' : '') + '>' + r + 'x</option>').join('') +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="sentence-list" id="sentenceList">' + rows + '</div>' +
    '<p class="muted mt">💡 使用浏览器语音合成朗读，无需联网音频。建议先「隐藏原文」盲听 1-2 遍，再对照原文精听。</p></div>';
}

/* ---------- 真实音频播放器 ---------- */
function fmtTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function renderAudioPlayer(id) {
  const item = LISTEN_AUDIO.find((x) => x.id === id);
  if (!item) return '';
  const tr = Store.data.listenTranscripts[id] || '';
  const src = audioSrcOf(item);
  return '<div class="card audio-card" id="audioCard">' +
    '<div class="audio-head">' +
      '<button class="linklike" data-action="listen-home">← 返回素材库</button>' +
      '<span class="tag tag-level">Workshop ' + item.workshop + '</span>' +
      '<span class="audio-title">' + esc(item.title) + '</span>' +
    '</div>' +
    '<audio id="audioEl" preload="metadata" src="' + esc(src) + '"></audio>' +
    '<div class="audio-bar">' +
      '<button class="btn" data-action="listen-play" id="playBtn">▶ 播放</button>' +
      '<button class="btn" data-action="listen-back10">⏪ -10s</button>' +
      '<button class="btn" data-action="listen-fwd10">+10s ⏩</button>' +
      '<span class="audio-time" id="curTime">0:00</span>' +
      '<input type="range" id="seek" class="seek" min="0" max="100" value="0" step="0.1" />' +
      '<span class="audio-time" id="durTime">0:00</span>' +
      '<select data-action="listen-speed" aria-label="倍速" id="speedSel">' +
        [0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => '<option value="' + r + '"' + (Math.abs(r - (App.listen.audioRate || 1)) < 0.01 ? ' selected' : '') + '>' + r + 'x</option>').join('') +
      '</select>' +
    '</div>' +
    '<div class="audio-ab">' +
      '<button class="btn small" data-action="listen-set-a" id="setA">ⓐ 设 A 点</button>' +
      '<button class="btn small" data-action="listen-set-b" id="setB">ⓑ 设 B 点</button>' +
      '<button class="btn small" data-action="listen-clear-ab">清除 A-B</button>' +
      '<span class="ab-state" id="abState"></span>' +
    '</div>' +
    '<div class="audio-transcript">' +
      '<div class="at-head"><h4>📝 原文 / 听写对照</h4>' +
        '<button class="linklike" data-action="listen-tr-toggle">' + (App.listen.trHide ? '显示' : '隐藏') + '</button></div>' +
      '<textarea id="trArea" class="tr-area' + (App.listen.trHide ? ' blurred' : '') + '" placeholder="把这段音频的原文或你的听写贴在这里，可保存，下次自动显示…">' + esc(tr) + '</textarea>' +
      '<div class="at-actions">' +
        '<button class="btn small" data-action="listen-tr-save">保存文本</button>' +
        '<button class="btn small" data-action="listen-import">导入此文件（若自动加载失败）</button>' +
        '<input type="file" id="audioImport" accept="audio/*" style="display:none" />' +
      '</div>' +
    '</div>' +
    '</div>';
}

function wireAudioPlayer() {
  const audio = $('#audioEl');
  if (!audio) return;
  App.listen.audioEl = audio;
  const seek = $('#seek');
  const curTime = $('#curTime');
  const durTime = $('#durTime');
  const playBtn = $('#playBtn');
  const abState = $('#abState');
  audio.addEventListener('loadedmetadata', () => {
    durTime.textContent = fmtTime(audio.duration);
    if (seek) seek.max = audio.duration || 100;
    audio.playbackRate = App.listen.audioRate || 1;
  });
  audio.addEventListener('timeupdate', () => {
    curTime.textContent = fmtTime(audio.currentTime);
    if (seek && audio.duration) seek.value = audio.currentTime;
    if (App.listen.abA != null && App.listen.abB != null && App.listen.abB > App.listen.abA && audio.currentTime >= App.listen.abB) {
      audio.currentTime = App.listen.abA;
    }
  });
  audio.addEventListener('play', () => { App.listen.audioPlaying = true; playBtn.textContent = '⏸ 暂停'; });
  audio.addEventListener('pause', () => { App.listen.audioPlaying = false; playBtn.textContent = '▶ 播放'; });
  audio.addEventListener('ended', () => {
    App.listen.audioPlaying = false; playBtn.textContent = '▶ 播放';
    Store.data.listenDone[App.listen.audioId] = true; Store.save();
    toast('🎉 听完一遍啦！可以再听或对照原文精听');
  });
  audio.addEventListener('error', () => { toast('该音频无法自动加载，请点「导入此文件」手动选择', true); });
  if (seek) seek.addEventListener('input', () => { if (audio.duration) audio.currentTime = parseFloat(seek.value); });
  const imp = $('#audioImport');
  if (imp) imp.addEventListener('change', (e) => { audioImportPick(e.target.files && e.target.files[0]); e.target.value = ''; });
}

function selectAudio(id) {
  App.listen.audioId = id;
  App.listen.abA = null; App.listen.abB = null; App.listen.audioPlaying = false;
  App.listen.trHide = false;
  renderListen();
  const card = $('#audioCard');
  if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function backToLib() { App.listen.audioId = null; renderListen(); }
function audioToggle() {
  const a = App.listen.audioEl; if (!a) return;
  if (a.paused) a.play().catch(() => toast('播放失败：浏览器可能拦截了本地音频，请改用「导入此文件」', true));
  else a.pause();
}
function audioBack10() { const a = App.listen.audioEl; if (a) a.currentTime = Math.max(0, a.currentTime - 10); }
function audioFwd10() { const a = App.listen.audioEl; if (a) a.currentTime = Math.min(a.duration || 1e9, a.currentTime + 10); }
function audioSpeed(r) { App.listen.audioRate = r; if (App.listen.audioEl) App.listen.audioEl.playbackRate = r; }
function audioSetA() { const a = App.listen.audioEl; if (!a) return; App.listen.abA = a.currentTime; const s = $('#abState'); if (s) s.textContent = 'A ' + fmtTime(App.listen.abA); }
function audioSetB() { const a = App.listen.audioEl; if (!a) return; App.listen.abB = a.currentTime; const s = $('#abState'); if (s) s.textContent = (App.listen.abA != null ? ('A ' + fmtTime(App.listen.abA) + '  ') : '') + 'B ' + fmtTime(App.listen.abB); }
function audioClearAB() { App.listen.abA = null; App.listen.abB = null; const s = $('#abState'); if (s) s.textContent = ''; }
function trToggle() {
  App.listen.trHide = !App.listen.trHide;
  const ta = $('#trArea'); if (ta) ta.classList.toggle('blurred', App.listen.trHide);
  const btn = document.querySelector('[data-action="listen-tr-toggle"]'); if (btn) btn.textContent = App.listen.trHide ? '显示' : '隐藏';
}
function trSave() {
  const ta = $('#trArea');
  if (ta && App.listen.audioId) { Store.data.listenTranscripts[App.listen.audioId] = ta.value; Store.save(); toast('已保存文本'); }
}
function audioImportPick(file) {
  if (!file) return;
  const item = LISTEN_AUDIO.find((x) => x.id === App.listen.audioId);
  if (!item) return;
  if (item._objUrl) { try { URL.revokeObjectURL(item._objUrl); } catch (e) {} }
  item._objUrl = URL.createObjectURL(file);
  renderListen();
  const a = App.listen.audioEl;
  if (a) a.play().catch(() => {});
}

async function playCurrent() {
  const s = App.listen.sentences[App.listen.idx];
  if (!s) return;
  const my = ++_playToken;
  const ok = await Speech.speak(s, { rate: App.listen.rate || 1 });
  if (my !== _playToken) return; // 已被新的操作接管
  App.listen.played[App.listen.idx] = true;
  if (App.listen.repeat) { renderListen(); playCurrent(); return; }
  const wasLast = App.listen.idx >= App.listen.sentences.length - 1;
  if (App.listen.playing && !wasLast) {
    App.listen.idx += 1;
    renderListen();
    playCurrent();
  } else if (App.listen.playing && wasLast) {
    App.listen.playing = false;
    const article = getArticle(App.articleId);
    if (article) markProgress(article.id, 'listen');
    renderListen();
    toast('🎉 本篇精听完成！接下来可以去写作或口语练输出');
  }
  renderListen();
}

function listenToggle() {
  if (!Speech.ttsOK) { toast('当前浏览器不支持语音合成，请使用 Chrome', true); return; }
  App.listen.playing = !App.listen.playing;
  if (App.listen.playing) { renderListen(); playCurrent(); }
  else { _playToken++; Speech.stop(); renderListen(); }
}
function listenNext() {
  Speech.stop(); _playToken++;
  if (App.listen.idx < App.listen.sentences.length - 1) App.listen.idx += 1;
  renderListen();
  if (App.listen.playing) playCurrent();
}
function listenPrev() {
  Speech.stop(); _playToken++;
  if (App.listen.idx > 0) App.listen.idx -= 1;
  renderListen();
  if (App.listen.playing) playCurrent();
}
function listenJump(i) {
  Speech.stop(); _playToken++;
  App.listen.idx = i;
  renderListen();
  if (App.listen.playing) playCurrent();
}
function listenRepeat() { App.listen.repeat = !App.listen.repeat; renderListen(); }
function listenHide() { App.listen.hideText = !App.listen.hideText; renderListen(); }

/* =========================================================
 * 写作模块
 * ========================================================= */
function renderWrite() {
  const view = $('#view-write');
  const article = App.articleId ? getArticle(App.articleId) : null;
  const mode = App.write.mode || 'article';

  if (mode === 'article' && !article) {
    view.innerHTML = '<h2 class="page-title">写作</h2>' + emptyState('✍️', '还没有选择文章', '写作任务基于文章生成（summary 练习），先去素材库选一篇；或在下方切换自由写作', 'goto', 'library', '去素材库选文章') +
      '<div class="card"><button class="btn" data-action="write-mode-free">✏️ 切换为自由写作（任意话题）</button></div>';
    return;
  }

  const taskText = (mode === 'article' && article)
    ? '请阅读文章《' + article.title + '》，然后用大约 300 词（words）写一篇 summary：概括主要观点，并补充你自己的一个看法。请使用自己的语言，避免大段抄袭原文。'
    : '自由写作：任选一个你感兴趣的话题（如科技、环境、教育、生活），写一篇 200-300 词的英文短文。';
  const history = (Store.data.writings || []).slice(0, 5);

  view.innerHTML =
    '<h2 class="page-title">写作</h2>' +
    (mode === 'article' && article ? articleHeaderHtml(article, true) + progressCheckline(article) : '<p class="page-desc">自由写作模式：不与文章关联。</p>') +
    '<div class="write-task">📋 <b>写作任务</b><br>' + esc(taskText) + '</div>' +
    '<div class="card">' +
      '<textarea id="essayInput" rows="12" placeholder="在这里输入你的英文作文…（建议 200-300 词）"></textarea>' +
      '<div class="word-count"><span id="wordCount">0</span> 词</div>' +
      '<div class="flex">' +
        '<button class="btn btn-primary" id="essaySubmitBtn" data-action="write-submit">🤖 提交 AI 批改</button>' +
        (mode === 'article' ? '<button class="btn" data-action="write-mode-free">切换自由写作</button>' : '<button class="btn" data-action="write-mode-article">切换为文章总结</button>') +
      '</div>' +
    '</div>' +
    '<div id="essayResult"></div>' +
    (history.length ? '<div class="card"><h3>🕘 最近的写作</h3>' + history.map((w) =>
      '<div class="history-item"><div class="hi-head"><span class="hi-title">' + esc(w.articleTitle || '自由写作') + '</span>' +
      '<span><span class="hi-score">' + (w.result && w.result.overall != null ? esc(String(w.result.overall)) : '-') + '</span> 分 · <span class="hi-time">' + fmtDateTime(w.createdAt) + '</span> ' +
      '<button class="btn btn-sm" data-action="write-history-view" data-id="' + w.id + '">查看</button> ' +
      '<button class="btn btn-sm btn-danger" data-action="write-history-del" data-id="' + w.id + '">删除</button></span></div></div>'
    ).join('') + '</div>' : '');
}

async function submitEssay() {
  if (!requireApiKey()) return;
  const input = $('#essayInput');
  const text = input ? input.value.trim() : '';
  const wc = wordCount(text);
  if (wc < 30) { toast('作文太短了，至少写 30 个词再提交批改', true); return; }
  const article = App.articleId ? getArticle(App.articleId) : null;
  const mode = App.write.mode || 'article';
  const taskText = (mode === 'article' && article)
    ? '阅读文章《' + article.title + '》后写一篇约 300 词的 summary，概括主要观点并补充自己的看法'
    : '自由写作（200-300 词英文短文）';
  const btn = $('#essaySubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 批改中…';
  try {
    const raw = await LLM.chat(PROMPTS.essay(article ? article.title : '自由写作', taskText, text), { maxTokens: 2000, temperature: 0.4 });
    const result = extractJson(raw);
    if (!result || !result.scores) throw new Error('BAD_RESPONSE');
    const record = {
      id: uid(), articleId: article ? article.id : null, articleTitle: article ? article.title : '自由写作',
      task: taskText, essay: text, result: result, createdAt: Date.now()
    };
    Store.data.writings.unshift(record);
    Store.save();
    if (article) markProgress(article.id, 'write');
    logActivity('write', (article ? article.title : '自由写作') + ' 作文得分 ' + (result.overall != null ? result.overall : '-'));
    renderEssayResult(result);
    renderWrite();
  } catch (e) {
    toast(LLM.friendlyError(e), true);
  } finally {
    const b = $('#essaySubmitBtn');
    if (b) { b.disabled = false; b.innerHTML = '🤖 提交 AI 批改'; }
  }
}

function scoreColor(v) { return v >= 7 ? 'var(--ok)' : (v >= 5.5 ? 'var(--warn)' : 'var(--danger)'); }

function renderEssayResult(result) {
  const box = $('#essayResult');
  if (!box) return;
  const s = result.scores || {};
  const names = { TR: '任务回应 TR', CC: '连贯衔接 CC', LR: '词汇多样性 LR', GRA: '语法准确性 GRA' };
  let html = '<div class="card"><h3>📝 批改结果</h3>' +
    '<div class="score-overall"><span class="big">' + (result.overall != null ? esc(String(result.overall)) : '-') + '</span><span class="muted">/ 9 总分（雅思四维口径）</span></div>';
  ['TR', 'CC', 'LR', 'GRA'].forEach((k) => {
    const v = s[k] != null ? s[k] : 0;
    html += '<div class="score-row"><span class="sr-name">' + names[k] + '</span>' +
      '<div class="score-bar"><div style="width:' + (Math.max(0, Math.min(9, v)) / 9 * 100) + '%;background:' + scoreColor(v) + '"></div></div>' +
      '<span class="sr-val" style="color:' + scoreColor(v) + '">' + esc(String(v)) + '</span></div>';
  });
  if (result.summary) html += '<p class="mt"><b>总评：</b>' + esc(result.summary) + '</p>';
  if (result.corrections && result.corrections.length) {
    html += '<h4 class="mt">🔧 修改建议（' + result.corrections.length + '）</h4>' + result.corrections.map((c) =>
      '<div class="correction"><span class="c-orig">' + esc(c.original || '') + '</span><br>→ <span class="c-rev">' + esc(c.revised || '') + '</span>' +
      (c.reason ? '<div class="c-why">' + esc(c.reason) + '</div>' : '') + '</div>'
    ).join('');
  }
  if (result.highlights && result.highlights.length) {
    html += '<h4 class="mt">✨ 亮点</h4><ul>' + result.highlights.map((h) => '<li>' + esc(h) + '</li>').join('') + '</ul>';
  }
  html += '</div>';
  box.innerHTML = html;
}

function viewWriting(id) {
  const w = (Store.data.writings || []).find((x) => x.id === id);
  if (!w) return;
  openModal('<h3>' + esc(w.articleTitle || '写作') + ' · ' + (w.result && w.result.overall != null ? w.result.overall : '-') + ' 分</h3>' +
    '<p class="muted">' + fmtDateTime(w.createdAt) + '</p>' +
    '<div class="panel-box"><h4>原文</h4><div class="panel-body">' + esc(w.essay) + '</div></div>' +
    '<div id="modalEssayResult"></div>' +
    '<button class="btn btn-block mt" data-action="modal-close">关闭</button>');
  const tmp = $('#essayResult');
  const old = tmp ? tmp.innerHTML : '';
  renderEssayResult(w.result);
  const modalResult = $('#essayResult') ? $('#essayResult').innerHTML : '';
  $('#modalEssayResult').innerHTML = modalResult;
  if (tmp) tmp.innerHTML = old;
}

/* =========================================================
 * 口语模块
 * ========================================================= */
let _micRec = null;

function renderSpeak() {
  const view = $('#view-speak');
  const article = App.articleId ? getArticle(App.articleId) : null;
  if (!article) {
    view.innerHTML = '<h2 class="page-title">口语</h2>' + emptyState('🗣️', '还没有选择文章', '口语练习围绕文章展开（复述 + 讨论），先去素材库选一篇', 'goto', 'library', '去素材库选文章');
    return;
  }
  if (!App.speak.started || App.speak.articleId !== article.id) {
    App.speak.articleId = article.id;
    App.speak.messages = [];
    App.speak.started = false;
    App.speak.report = null;
  }

  const log = App.speak.messages.map((m) =>
    '<div class="msg ' + (m.role === 'user' ? 'user' : 'tutor') + '"><span class="msg-role">' + (m.role === 'user' ? '我' : 'AI 教练') + '</span>' + esc(m.content) + '</div>'
  ).join('');

  let reportHtml = '';
  if (App.speak.report) {
    const r = App.speak.report;
    reportHtml = '<div class="card"><h3>📋 口语反馈报告</h3>' +
      (r.overallComment ? '<p><b>总体评价：</b>' + esc(r.overallComment) + '</p>' : '') +
      (r.grammarErrors && r.grammarErrors.length ?
        '<div class="report-block"><h4>❌ 语法纠正</h4><ul>' + r.grammarErrors.map((g) =>
          '<li><span class="c-orig">' + esc(g.wrong || '') + '</span> → <span class="c-rev">' + esc(g.right || '') + '</span>' + (g.why ? ' <span class="muted">(' + esc(g.why) + ')</span>' : '') + '</li>'
        ).join('') + '</ul></div>' : '<div class="report-block"><h4>❌ 语法纠正</h4><p class="muted">没有明显语法错误，很棒！</p></div>') +
      (r.betterExpressions && r.betterExpressions.length ?
        '<div class="report-block"><h4>💎 更地道的表达</h4><ul>' + r.betterExpressions.map((b) =>
          '<li><span class="c-orig">' + esc(b.original || '') + '</span> → <span class="c-rev">' + esc(b.upgraded || '') + '</span></li>'
        ).join('') + '</ul></div>' : '') +
      (r.fluencyTips && r.fluencyTips.length ?
        '<div class="report-block"><h4>🚀 提升建议</h4><ul>' + r.fluencyTips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div>' : '') +
      '</div>';
  }

  view.innerHTML =
    '<h2 class="page-title">口语</h2>' +
    articleHeaderHtml(article, true) + progressCheckline(article) +
    '<div class="notice">💬 练习方式：先听 AI 教练提问（可朗读），用英语回答——可以打字，也可以点 🎤 语音输入（需 Chrome 且能访问 Google 语音服务）。说满 3 轮以上再点「结束并获取反馈」。</div>' +
    '<div class="card">' +
      (App.speak.started
        ? '<div class="chat-box" id="chatBox">' + (log || '<p class="muted">对话开始中…</p>') + '</div>' +
          '<div class="chat-input-row">' +
            '<input type="text" id="speakInput" placeholder="用英语输入你的回答…" ' + (App.speak.sending ? 'disabled' : '') + '>' +
            '<button class="btn" id="micBtn" data-action="speak-mic">🎤</button>' +
            '<button class="btn btn-primary" data-action="speak-send" ' + (App.speak.sending ? 'disabled' : '') + '>发送</button>' +
          '</div>' +
          '<div class="flex mt">' +
            '<button class="btn" data-action="speak-tts">' + (App.speak.tts ? '🔊 朗读 AI 回复：开' : '🔇 朗读 AI 回复：关') + '</button>' +
            '<button class="btn" data-action="speak-finish">🏁 结束并获取反馈</button>' +
          '</div>'
        : '<div class="empty"><div class="empty-icon">🗣️</div><h3>开始今天的口语练习</h3><p>AI 教练将基于《' + esc(article.title) + '》和你讨论，并纠正你的表达。</p>' +
          '<button class="btn btn-primary" data-action="speak-start">▶ 开始对话</button></div>') +
    '</div>' + reportHtml;

  const cb = $('#chatBox');
  if (cb) cb.scrollTop = cb.scrollHeight;
}

async function speakStart() {
  if (!requireApiKey()) return;
  App.speak.started = true;
  App.speak.messages = [];
  App.speak.sending = true;
  renderSpeak();
  try {
    const r = await LLM.chat(PROMPTS.speakOpen(getArticle(App.articleId).title), { maxTokens: 300, temperature: 0.8 });
    App.speak.messages.push({ role: 'assistant', content: r });
    logActivity('speak', '开始口语练习：' + getArticle(App.articleId).title);
  } catch (e) {
    toast(LLM.friendlyError(e), true);
  }
  App.speak.sending = false;
  renderSpeak();
  const last = App.speak.messages[App.speak.messages.length - 1];
  if (last && App.speak.tts) Speech.speak(last.content);
}

async function speakSend() {
  const input = $('#speakInput');
  const text = input ? input.value.trim() : '';
  if (!text) return;
  if (!requireApiKey()) return;
  App.speak.messages.push({ role: 'user', content: text });
  App.speak.sending = true;
  renderSpeak();
  await tutorReply();
}

async function tutorReply() {
  const article = getArticle(App.articleId);
  const msgs = [{ role: 'system', content: PROMPTS.speakSystem(article.title) }].concat(App.speak.messages);
  try {
    const r = await LLM.chat(msgs, { maxTokens: 300, temperature: 0.8 });
    App.speak.messages.push({ role: 'assistant', content: r });
  } catch (e) {
    toast(LLM.friendlyError(e), true);
  }
  App.speak.sending = false;
  renderSpeak();
  const last = App.speak.messages[App.speak.messages.length - 1];
  if (last && last.role === 'assistant' && App.speak.tts) Speech.speak(last.content);
}

function speakMic() {
  if (_micRec) { try { _micRec.stop(); } catch (e) {} return; }
  if (!Speech.asrOK) { toast('当前浏览器不支持语音识别，请使用 Chrome，或直接用打字输入', true); return; }
  const btn = $('#micBtn');
  const input = $('#speakInput');
  if (btn) btn.classList.add('recording');
  _micRec = startListening({
    onInterim: (v) => { if (input) input.value = v; },
    onFinal: (v) => { if (input) input.value = v; },
    onError: (err) => {
      const map = {
        'not-allowed': '麦克风权限被拒绝，请在浏览器地址栏允许麦克风',
        'service-not-allowed': '语音识别服务不可用',
        'network': '语音识别需要连接 Google 服务，当前网络可能不可用，请改用打字输入',
        'unsupported': '当前浏览器不支持语音识别，请使用 Chrome'
      };
      toast(map[err] || ('语音识别出错：' + err), true);
    },
    onEnd: () => {
      _micRec = null;
      const b = $('#micBtn');
      if (b) b.classList.remove('recording');
    }
  });
}

async function speakFinish() {
  const userTexts = App.speak.messages.filter((m) => m.role === 'user');
  if (userTexts.length < 1) { toast('先说几句再获取反馈哦', true); return; }
  if (!requireApiKey()) return;
  const article = getArticle(App.articleId);
  toast('正在生成反馈报告…');
  try {
    const joined = userTexts.map((m, i) => (i + 1) + '. ' + m.content).join('\n');
    const raw = await LLM.chat(PROMPTS.speakReport(article.title, joined), { maxTokens: 1500, temperature: 0.4 });
    const report = extractJson(raw);
    if (!report) throw new Error('BAD_RESPONSE');
    App.speak.report = report;
    Store.data.speakSessions.unshift({
      id: uid(), articleId: article.id, articleTitle: article.title,
      messages: App.speak.messages.slice(), report: report, createdAt: Date.now()
    });
    Store.save();
    markProgress(article.id, 'speak');
    logActivity('speak', '完成口语练习：' + article.title);
    renderSpeak();
  } catch (e) {
    toast(LLM.friendlyError(e), true);
  }
}
