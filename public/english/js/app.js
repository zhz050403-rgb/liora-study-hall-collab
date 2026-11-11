/* =========================================================
 * Liora English · 应用层
 * 路由 / 首页 / 素材库 / 生词本 / 数据 / 设置 / 全局事件
 * ========================================================= */

/* ---------- 路由 ---------- */
function go(view) {
  if (view === 'read' && !getArticle(App.articleId)) view = 'library';
  if (App.view === 'listen' && view !== 'listen') {
    Speech.stop();
    _playToken++;
    App.listen.playing = false;
    if (App.listen.audioEl) { try { App.listen.audioEl.pause(); } catch (e) {} }
    App.listen.audioPlaying = false;
  }
  if (App.view === 'speak' && view !== 'speak' && _micRec) {
    try { _micRec.stop(); } catch (e) {}
    _micRec = null;
  }
  App.view = view;
  document.body.classList.toggle('reading-mode', view === 'read');
  $$('.view').forEach((v) => v.classList.add('hidden'));
  const el = $('#view-' + view);
  if (el) el.classList.remove('hidden');
  $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.getAttribute('data-view') === view));
  $('#wordPopup').classList.add('hidden');
  $('#selToolbar').classList.add('hidden');
  window.scrollTo(0, 0);
  renderView();
}

function renderView() {
  updateApiBanner();
  switch (App.view) {
    case 'home': renderHome(); break;
    case 'library': renderLibrary(); break;
    case 'read': renderRead(); break;
    case 'listen': renderListen(); break;
    case 'write': renderWrite(); break;
    case 'speak': renderSpeak(); break;
    case 'vocab': renderVocab(); break;
    case 'stats': renderStats(); break;
    case 'settings': renderSettings(); break;
    default: renderHome();
  }
}

function updateApiBanner() {
  const b = $('#apiBanner');
  if (b) b.classList.toggle('hidden', hasApiKey());
}

function openArticle(id) {
  const a = getArticle(id);
  if (!a) { toast('文章不存在', true); return; }
  App.articleId = id;
  Store.data.lastArticleId = id;
  Store.save();
  App.listen.idx = 0;
  App.listen.played = {};
  go('read');
}

/* ---------- 首页 ---------- */
function renderHome() {
  const view = $('#view-home');
  const last = Store.data.lastArticleId ? getArticle(Store.data.lastArticleId) : null;
  const due = dueVocab().length;
  const t = todayStr();
  const todayActs = (Store.data.activity || []).filter((a) => todayStr(new Date(a.t)) === t).length;
  const mastered = (Store.data.vocab || []).filter((v) => v.mastered).length;

  let hero;
  if (last) {
    const prog = Store.data.progress[last.id] || {};
    const done = ['read', 'listen', 'write', 'speak'].filter((s) => prog[s]).length;
    const next = !prog.listen ? ['listen', '去精听 →'] : !prog.write ? ['write', '去写作 →'] : !prog.speak ? ['speak', '去口语 →'] : ['library', '换一篇 →'];
    hero = '<div class="hero section-banner"><h2>继续学习</h2>' +
      '<p>上次在读《' + esc(last.title) + '》 · ' + esc(last.level || 'B2') + ' · 已完成 ' + done + '/4 环节</p>' +
      '<button class="btn" data-action="open-article" data-id="' + esc(last.id) + '">打开文章</button> ' +
      '<button class="btn" style="background:rgba(255,255,255,.18);color:#fff;border-color:rgba(255,255,255,.4)" data-action="goto" data-view="' + next[0] + '">' + esc(next[1]) + '</button></div>';
  } else {
    hero = '<div class="hero section-banner"><h2>欢迎来到 Liora English</h2>' +
      '<p>AI 原生的英语学习闭环：读进去 → 写出来 → 说出来 → 记得住。先从素材库选一篇文章开始吧。</p>' +
      '<button class="btn" data-action="goto" data-view="library">去素材库选文章 →</button></div>';
  }

  const modules = [
    ['library', '▤', '素材库', '选择或导入文章'],
    ['read', '◇', '精读', '查词与长难句解析'],
    ['listen', '♪', '精听', '单句循环与盲听'],
    ['write', '✎', '写作', '练习与逐句反馈'],
    ['speak', '◉', '口语', '围绕文章练习表达'],
    ['vocab', '▧', '生词本', '复习已收藏的单词'],
    ['stats', '▥', '数据', '查看学习活动'],
    ['settings', '⚙', '设置', '配置工作台']
  ];
  const shortcuts = '<h3 class="workbench-heading">英语学习工作台</h3><div class="grid grid-4 mb workbench-shortcuts">' +
    modules.map((m) => '<button type="button" class="card module-card" data-action="goto" data-view="' + m[0] +
      '"><span class="mc-icon" aria-hidden="true">' + m[1] + '</span><strong>' + m[2] +
      '</strong><small>' + m[3] + '</small></button>').join('') + '</div>';

  $("#english-banner").innerHTML = hero;
  view.innerHTML = shortcuts +
    '<h3 class="workbench-heading">学习概览</h3><div class="grid grid-3 mb">' +
      '<div class="card module-card" data-action="goto" data-view="vocab"><div class="mc-icon">📚</div><h4>待复习生词</h4><p>' + due + ' 个单词到了复习时间</p></div>' +
      '<div class="card"><div class="sc-center"><div class="sc-num">' + todayActs + '</div><div class="sc-label">今日学习活动</div></div></div>' +
      '<div class="card"><div class="sc-center"><div class="sc-num ok">' + mastered + '</div><div class="sc-label">已掌握生词</div></div></div>' +
    '</div>' +
    '<div class="card steps"><h3>🚀 新手三步</h3>' +
      '<div class="step-item"><div class="sn-no"></div><div class="sn-body"><b>模型已就绪：</b>已预置 DeepSeek，打开就能用；想换其他服务才需要到「设置」修改。</div></div>' +
      '<div class="step-item"><div class="sn-no"></div><div class="sn-body"><b>选篇文章：</b>到「素材库」选一篇 B2 文章（或粘贴 / AI 生成自己的材料）。</div></div>' +
      '<div class="step-item"><div class="sn-no"></div><div class="sn-body"><b>完成闭环：</b>按 精读 → 精听 → 写作 → 口语 的顺序练习，生词自动进入间隔复习。</div></div>' +
    '</div>';
}

/* ---------- 素材库 ---------- */
let dailyBriefSources;

async function renderDailyBriefSources(section) {
  try {
    dailyBriefSources ||= fetch('../daily-brief.html', { cache: 'no-cache' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Daily brief unavailable');
        const page = new DOMParser().parseFromString(await response.text(), 'text/html');
        const archive = page.querySelector('#dailyBriefContent');
        if (!archive) throw new Error('Daily brief archive missing');
        const sources = new Map();
        for (const card of archive.querySelectorAll('.reading-card')) {
          const title = card.querySelector('.rc-title');
          const original = [...card.querySelectorAll('a[href]')]
            .find((link) => link.textContent.trim().startsWith('阅读原文'));
          if (!title || !original) continue;
          const url = new URL(original.getAttribute('href'));
          if (url.protocol !== 'https:' || sources.has(url.href)) continue;
          sources.set(url.href, {
            title: title.textContent.trim(),
            category: card.querySelector('.rc-cat')?.textContent.trim() || '',
            date: card.dataset.edition || card.querySelector('.rc-date')?.dateTime || ''
          });
        }
        return [...sources].sort((a, b) => b[1].date.localeCompare(a[1].date));
      }).catch((error) => {
        dailyBriefSources = undefined;
        throw error;
      });
    const sources = await dailyBriefSources;
    section.innerHTML = sources.map(([url, article]) =>
      '<div class="card"><h3>' + esc(article.title) + '</h3><p class="muted">' +
      esc([article.date, article.category].filter(Boolean).join(' · ')) +
      '</p><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">阅读英文原文</a></div>'
    ).join('') || '<p class="muted">暂无简报原文。</p>';
  } catch {
    section.textContent = '暂时无法读取每日简报。重新打开素材库可重试。';
  }
}

function renderLibrary() {
  const view = $('#view-library');
  /* 置顶文章优先（按 PINNED_ARTICLE_IDS 顺序），其余保持原顺序 */
  const pinRank = (id) => {
    const i = PINNED_ARTICLE_IDS.indexOf(id);
    return i === -1 ? PINNED_ARTICLE_IDS.length : i;
  };
  const articles = allArticles().slice().sort((a, b) => pinRank(a.id) - pinRank(b.id));
  const cards = articles.map((a) => {
    const prog = Store.data.progress[a.id] || {};
    const dots = ['read', 'listen', 'write', 'speak'].map((s) =>
      '<span class="pd ' + (prog[s] ? 'on' : '') + '" title="' + s + '"></span>'
    ).join('');
    const cur = App.articleId === a.id ? ' <span class="tag">当前</span>' : '';
    const pin = PINNED_ARTICLE_IDS.includes(a.id) ? ' <span class="tag tag-pin">置顶</span>' : '';
    const wc = wordCount((a.paragraphs || []).join(' '));
    return '<div class="card"><div class="flex-between"><div>' +
      '<div class="article-meta"><span class="tag tag-level">' + esc(a.level || 'B2') + '</span>' +
      '<span class="tag tag-source">' + esc(a.source || '导入') + '</span>' + pin + cur + '</div>' +
      '<h3 style="margin:6px 0 4px">' + esc(a.title) + '</h3>' +
      '<p class="muted">' + esc(a.topic || '综合') + ' · 约 ' + wc + ' 词</p></div>' +
      '<div style="text-align:right"><div class="progress-dots mb">' + dots + '</div>' +
      '<button class="btn btn-sm btn-primary" data-action="open-article" data-id="' + esc(a.id) + '">打开学习</button></div>' +
      '</div></div>';
  }).join('');

  view.innerHTML = '<h2 class="page-title">素材库</h2>' +
    '<p class="page-desc">内置 ' + ARTICLES.length + ' 篇 B2 文章（原创示例 + 课程材料）；也可以粘贴自己的材料，或让 AI 按你的主题生成。</p>' +
    '<h3>每日简报 · 英文原文</h3><div data-brief-sources aria-live="polite">正在读取简报…</div>' +
    cards +
    '<div class="grid grid-2">' +
      '<div class="card"><h3>📥 粘贴导入</h3>' +
        '<label class="field"><span>文章标题</span><input type="text" id="importTitle" placeholder="例如：The Future of Electric Cars"></label>' +
        '<label class="field"><span>英文原文（段与段之间空一行）</span><textarea id="importText" rows="6" placeholder="Paste your English article here..."></textarea></label>' +
        '<label class="field"><span>难度</span><select id="importLevel"><option>B1</option><option selected>B2</option><option>C1</option></select></label>' +
        '<button class="btn btn-primary" data-action="import-article">导入并开始学习</button>' +
      '</div>' +
      '<div class="card"><h3>✨ AI 生成文章</h3>' +
        '<p class="muted">让 AI 按 B2 难度原创一篇短文（需要 API Key），生成后即可开始完整闭环。</p>' +
        '<label class="field"><span>主题（可留空，由 AI 任选）</span><input type="text" id="genTopic" placeholder="例如：the history of coffee"></label>' +
        '<button class="btn" id="genBtn" data-action="gen-article">生成文章</button>' +
      '</div>' +
    '</div>';
  renderDailyBriefSources(view.querySelector('[data-brief-sources]'));
}

function importArticle() {
  const title = $('#importTitle') ? $('#importTitle').value.trim() : '';
  const text = $('#importText') ? $('#importText').value.trim() : '';
  const level = $('#importLevel') ? $('#importLevel').value : 'B2';
  if (!title) { toast('请填写文章标题', true); return; }
  if (wordCount(text) < 60) { toast('文章太短了，至少 60 个词', true); return; }
  const paragraphs = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const article = { id: uid(), title: title, topic: '我的导入', level: level, source: '我的导入', paragraphs: paragraphs.length ? paragraphs : [text] };
  Store.data.articles.unshift(article);
  Store.save();
  logActivity('read', '导入文章《' + title + '》');
  App.articleId = article.id;
  Store.data.lastArticleId = article.id;
  Store.save();
  App.listen.idx = 0;
  App.listen.played = {};
  toast('导入成功，开始精读吧');
  go('read');
}

async function genArticle() {
  if (!requireApiKey()) return;
  const topic = $('#genTopic') ? $('#genTopic').value.trim() : '';
  const btn = $('#genBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner dark"></span> 生成中…';
  try {
    const raw = await LLM.chat(PROMPTS.genArticle(topic), { maxTokens: 1200, temperature: 0.8 });
    const m = raw.match(/Title:\s*(.+)/);
    const title = m ? m[1].trim() : ('AI 文章 · ' + (topic || '随机话题'));
    const body = raw.replace(/^Title:\s*.+\n?/, '');
    const paragraphs = body.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.length > 20);
    if (paragraphs.length < 2) throw new Error('BAD_RESPONSE');
    const article = { id: uid(), title: title, topic: topic || 'AI 生成', level: 'B2', source: 'AI 生成', paragraphs: paragraphs };
    Store.data.articles.unshift(article);
    Store.save();
    logActivity('read', 'AI 生成文章《' + title + '》');
    App.articleId = article.id;
    Store.data.lastArticleId = article.id;
    Store.save();
    App.listen.idx = 0;
    App.listen.played = {};
    toast('文章生成成功！');
    go('read');
  } catch (e) {
    toast(LLM.friendlyError(e), true);
    btn.disabled = false;
    btn.innerHTML = '生成文章';
  }
}

/* ---------- 生词本 ---------- */
function renderVocab() {
  const view = $('#view-vocab');
  const all = Store.data.vocab || [];
  const due = dueVocab();
  const mastered = all.filter((v) => v.mastered).length;

  if (App.vocab.reviewing) {
    const queue = App.vocab.queue || [];
    const item = queue[App.vocab.idx];
    const rvPh = item ? (item.phonetic || window.getPhonetic(item.word)) : '';
    if (!item) {
      view.innerHTML = '<h2 class="page-title">生词复习</h2>' +
        '<div class="card review-card"><div style="font-size:40px">🎉</div><h3>本轮复习完成！</h3>' +
        '<p class="muted">记住的词会按间隔重复在合适的时间再次出现。</p>' +
        '<button class="btn btn-primary" data-action="vocab-exit">返回生词本</button></div>';
      return;
    }
    view.innerHTML = '<h2 class="page-title">生词复习</h2>' +
      '<p class="page-desc">第 ' + (App.vocab.idx + 1) + ' / ' + queue.length + ' 个 · 根据记忆程度选择，系统自动安排下次出现时间</p>' +
      '<div class="card review-card">' +
        '<div class="muted">这个词你认识吗？</div>' +
        '<div class="rv-word">' + esc(item.word) + '</div>' +
        (rvPh ? '<div class="rv-phonetic">' + esc(rvPh) + '</div>' : '') +
        '<button class="btn btn-sm" data-action="vocab-speak" data-word="' + esc(item.word) + '">🔊 发音</button>' +
        '<div class="rv-meaning">' + (App.vocab.revealed ? esc(item.meaning) : '<span class="muted">（先在心里想一下，再点显示释义）</span>') + '</div>' +
        (App.vocab.revealed
          ? '<div class="review-actions"><button class="btn" data-action="vocab-rate" data-rating="forget">😵 忘记</button>' +
            '<button class="btn" data-action="vocab-rate" data-rating="vague">🤔 模糊</button>' +
            '<button class="btn btn-primary" data-action="vocab-rate" data-rating="know">😎 记住</button></div>'
          : '<div class="review-actions"><button class="btn btn-primary" data-action="vocab-reveal">显示释义</button></div>') +
        '<div class="mt"><button class="btn btn-sm" data-action="vocab-exit">退出复习</button></div>' +
      '</div>';
    return;
  }

  const q = (App.vocab.query || '').toLowerCase();
  const list = all.filter((v) => !q || v.word.toLowerCase().includes(q));
  view.innerHTML = '<h2 class="page-title">生词本</h2>' +
    '<div class="grid grid-3 mb">' +
      '<div class="stat-card"><div class="sc-num">' + all.length + '</div><div class="sc-label">生词总数</div></div>' +
      '<div class="stat-card"><div class="sc-num" style="color:var(--warn)">' + due.length + '</div><div class="sc-label">待复习</div></div>' +
      '<div class="stat-card"><div class="sc-num" style="color:var(--ok)">' + mastered + '</div><div class="sc-label">已掌握</div></div>' +
    '</div>' +
    '<div class="flex mb">' +
      '<button class="btn btn-primary" data-action="vocab-review-start"' + (due.length ? '' : ' disabled') + '>🧠 开始复习（' + due.length + '）</button>' +
      '<button class="btn" data-action="vocab-import-ielts">📥 导入雅思全部词汇</button>' +
      '<input type="text" id="vocabSearch" placeholder="搜索生词…" value="' + esc(App.vocab.query || '') + '" style="max-width:240px">' +
    '</div>' +
    (window.IELTS_WORDS && window.IELTS_WORDS.length
      ? '<p class="muted mt">内置雅思词汇表共 ' + window.IELTS_WORDS.length + ' 词，点「导入雅思全部词汇」一键加入生词本（已存在的会自动跳过）。导入后可在「开始复习」里按记忆曲线学习。</p>'
      : '') +
    (list.length
      ? (() => {
          const PAGE = 100;
          const page = App.vocab.page || 1;
          const shown = list.slice(0, page * PAGE);
          const hasMore = list.length > shown.length;
          return shown.map((v) => {
            const vPh = v.phonetic || window.getPhonetic(v.word);
            return '<div class="vocab-card" data-word="' + esc(v.word.toLowerCase()) + '">' +
              '<span class="v-word">' + esc(v.word) +
                (vPh ? ' <span class="v-phonetic">' + esc(vPh) + '</span>' : '') + '</span>' +
              '<span class="v-meaning">' + esc(v.meaning) + '</span>' +
              '<span class="v-meta">' + (v.mastered ? '✅ 已掌握' : '下次复习 ' + esc(v.due || '')) + '<br>' + esc(v.articleTitle || '') + '</span>' +
              '<button class="btn btn-sm" data-action="vocab-speak" data-word="' + esc(v.word) + '">🔊</button>' +
              '<button class="btn btn-sm btn-danger" data-action="vocab-del" data-id="' + esc(v.id) + '">🗑</button>' +
            '</div>';
          }).join('') +
            (hasMore ? '<div class="center mt"><button class="btn" data-action="vocab-load-more">加载更多（剩 ' + (list.length - shown.length) + ' 个）</button></div>' : '');
        })()
      : '<div class="empty"><div class="empty-icon">📚</div><h3>生词本还是空的</h3><p>精读时单击单词，点「加入生词本」即可收录。</p></div>');
}

function startReview() {
  const queue = dueVocab();
  if (!queue.length) { toast('暂无待复习的生词'); return; }
  App.vocab.reviewing = true;
  App.vocab.idx = 0;
  App.vocab.revealed = false;
  App.vocab.queue = queue;
  renderVocab();
}

function rateVocab(rating) {
  const item = App.vocab.queue[App.vocab.idx];
  if (!item) return;
  srsRate(item, rating);
  Store.save();
  App.vocab.idx += 1;
  App.vocab.revealed = false;
  renderVocab();
}

function deleteVocab(id) {
  Store.data.vocab = (Store.data.vocab || []).filter((v) => v.id !== id);
  Store.save();
  renderVocab();
  toast('已删除');
}

/* 一键导入内置雅思核心词库（去重，重复词跳过） */
function importIeltsVocab() {
  const list = window.IELTS_WORDS || [];
  if (!list.length) { toast('雅思词库暂未加载，无法导入', true); return; }
  const vocab = Store.data.vocab || (Store.data.vocab = []);
  const exist = new Set(vocab.map((v) => (v.word || '').toLowerCase()));
  let added = 0;
  const fresh = [];
  for (const it of list) {
    const w = (it.word || '').toString().trim();
    if (!w) continue;
    if (exist.has(w.toLowerCase())) continue;
    fresh.push({
      id: uid(), word: w,
      meaning: (it.meaning || '（释义见学习）').toString().slice(0, 200),
      phonetic: it.phonetic || '',
      articleId: null, articleTitle: '雅思词库',
      level: 0, due: todayStr(), reps: 0, addedAt: Date.now()
    });
    exist.add(w.toLowerCase());
    added++;
  }
  if (added) {
    Store.data.vocab = fresh.concat(vocab); // 新词置顶，旧词保留
    Store.save();
    logActivity('vocab', '导入雅思全部词汇 ' + added + ' 词');
  }
  App.vocab.page = 1;
  renderVocab();
  toast(added
    ? '已导入 ' + added + ' 个雅思词汇（重复 ' + (list.length - added) + ' 个已跳过）'
    : '雅思词库已全部在生词本里了，无需重复导入');
}

/* ---------- 数据看板 ---------- */
function renderStats() {
  const view = $('#view-stats');
  const d = Store.data;
  const readCount = Object.keys(d.progress).filter((k) => d.progress[k].read).length;
  const writings = d.writings || [];
  const scored = writings.filter((w) => w.result && w.result.overall != null);
  const avg = scored.length ? (scored.reduce((s, w) => s + w.result.overall, 0) / scored.length).toFixed(1) : '-';
  const days = new Set((d.activity || []).map((a) => todayStr(new Date(a.t)))).size;

  const dayMap = {};
  (d.activity || []).forEach((a) => { const k = todayStr(new Date(a.t)); dayMap[k] = (dayMap[k] || 0) + 1; });
  const bars = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const k = todayStr(dt);
    const v = dayMap[k] || 0;
    bars.push('<div class="day-bar"><div class="bar ' + (v ? '' : 'zero') + '" style="height:' + Math.min(78, Math.max(3, v * 22)) + 'px" title="' + v + ' 次活动"></div>' +
      '<div class="db-label">' + (dt.getMonth() + 1) + '/' + dt.getDate() + '</div></div>');
  }

  const recent = (d.activity || []).slice(0, 12);
  view.innerHTML = '<h2 class="page-title">学习数据</h2><p class="page-desc">所有数据只保存在本机浏览器中，可随时在设置里导出备份。</p>' +
    '<div class="grid grid-4 mb">' +
      '<div class="stat-card"><div class="sc-num">' + readCount + '</div><div class="sc-label">精读文章</div></div>' +
      '<div class="stat-card"><div class="sc-num">' + (d.vocab || []).length + '</div><div class="sc-label">生词收录</div></div>' +
      '<div class="stat-card"><div class="sc-num">' + avg + '</div><div class="sc-label">写作平均分</div></div>' +
      '<div class="stat-card"><div class="sc-num">' + (d.speakSessions || []).length + '</div><div class="sc-label">口语会话</div></div>' +
      '<div class="stat-card"><div class="sc-num">' + days + '</div><div class="sc-label">学习天数</div></div>' +
      '<div class="stat-card"><div class="sc-num">' + dueVocab().length + '</div><div class="sc-label">待复习生词</div></div>' +
    '</div>' +
    '<div class="card mb"><h3>📅 最近 7 天学习活动</h3><div class="day-bars">' + bars.join('') + '</div></div>' +
    '<div class="card"><h3>🕘 最近动态</h3>' +
    (recent.length
      ? recent.map((a) => '<div class="history-item"><div class="hi-head"><span>' + esc(a.text) + '</span><span class="hi-time">' + fmtDateTime(a.t) + '</span></div></div>').join('')
      : '<p class="muted">还没有学习记录，从素材库开始第一篇吧。</p>') +
    '</div>';
}

/* ---------- 设置 ---------- */
function renderSettings() {
  const view = $('#view-settings');
  const s = Store.data.settings;
  view.innerHTML = '<h2 class="page-title">设置</h2>' +
    '<div class="notice">✅ <b>AI 已接好，打开就能用</b>：本站的 AI 讲解、批改、翻译走小屋自己的云端通道（<code>/cloud/llm</code>），<b>不需要你填任何 Key</b>。下面这一栏是给「想用自己账号」的同学准备的可选项，不填完全不影响使用。</div>' +
    '<div class="card" id="settingsForm"><h3>🤖 AI 模型配置</h3>' +
      '<label class="field"><span>服务商</span><select id="setProvider">' +
        '<option value="openai"' + (s.provider === 'openai' ? ' selected' : '') + '>OpenAI 兼容（OpenAI / 各类中转）</option>' +
        '<option value="anthropic"' + (s.provider === 'anthropic' ? ' selected' : '') + '>Anthropic Claude</option>' +
      '</select></label>' +
      '<label class="field"><span>Base URL（接口地址）</span><input type="text" id="setBaseUrl" value="' + esc(s.baseUrl) + '" placeholder="https://api.openai.com/v1"></label>' +
      '<label class="field"><span>API Key（可选，想用自己的 Key 才填）</span><div class="flex">' +
        '<input type="password" id="setApiKey" value="' + esc(s.apiKeySource === 'user' ? s.apiKey : '') + '" placeholder="留空即用小屋云端 AI" style="flex:1">' +
        '<button class="btn btn-sm" id="toggleKeyBtn" data-action="settings-toggle-key" type="button">显示</button>' +
      '</div></label>' +
      '<label class="field"><span>模型名称（以服务商官网模型列表为准）</span>' +
        '<input type="text" id="setModel" list="modelSuggestions" value="' + esc(s.model) + '" placeholder="TM ·DeepSeek-V4">' +
        '<datalist id="modelSuggestions">' +
          '<option value="TM ·DeepSeek-V4"></option><option value="TM ·Fast"></option><option value="TM ·Auto"></option>' +
          '<option value="TM ·DeepSeek-V4.1"></option><option value="TM ·GLM5.3"></option><option value="TM ·Kimi-K3"></option>' +
          '<option value="gpt-4o-mini"></option><option value="gpt-4o"></option><option value="gpt-4.1-mini"></option>' +
          '<option value="claude-sonnet-4-5"></option><option value="claude-haiku-4-5"></option>' +
          '<option value="deepseek-chat"></option><option value="qwen-plus"></option><option value="glm-4.5"></option>' +
        '</datalist></label>' +
      '<div class="flex">' +
        '<button class="btn btn-primary" data-action="settings-save">保存配置</button>' +
        '<button class="btn" id="testConnBtn" data-action="settings-test">🔌 测试连接</button>' +
      '</div>' +
      '<p class="muted mt">🔐 这里填的 Key 只保存在你自己浏览器的 localStorage 中。留空时全部 AI 能力走小屋云端，Key 不下发到浏览器。</p>' +
    '</div>' +
    '<div class="card"><h3>📖 阅读显示</h3>' +
      '<div class="field"><span>正文中的生词标记</span>' +
        '<label style="display:flex;align-items:center;gap:8px;font-weight:400;color:var(--muted)">' +
          '<input type="checkbox" id="setMarkSaved"' + (s.markSavedWords ? ' checked' : '') + '>' +
          '<span>把已收入生词本的单词标上绿色底纹（导入大量词汇后正文会很花，默认关闭）</span>' +
        '</label>' +
      '</div>' +
      '<p class="muted">关闭后正文不再显示绿色标记，生词本数据不受影响。</p>' +
      '<div class="field" style="margin-top:14px"><span>指词翻译</span>' +
        '<label style="display:flex;align-items:center;gap:8px;font-weight:400;color:var(--muted)">' +
          '<input type="checkbox" id="setHoverLookup"' + (s.hoverLookup === false ? '' : ' checked') + '>' +
          '<span>鼠标指到单词上（约 0.3 秒）就弹出释义，像翻译软件一样；点击单词同样可以。不想被弹窗打扰就取消勾选。</span>' +
        '</label>' +
      '</div>' +
    '</div>' +
    '<div class="card"><h3>🔊 语音设置</h3>' +
      '<label class="field"><span>朗读语速：<b id="rateLabel">' + (s.ttsRate || 1) + '</b>x</span>' +
        '<input type="range" id="setTtsRate" min="0.5" max="1.5" step="0.1" value="' + (s.ttsRate || 1) + '"></label>' +
      '<p class="muted">朗读使用浏览器内置语音合成（免费、离线可用，Windows 一般自带英语语音包）。语音识别依赖 Google 服务，国内网络可能不可用——不可用时改用打字输入，其他功能不受影响。</p>' +
    '</div>' +
    '<div class="card"><h3>💾 数据管理</h3>' +
      '<div class="flex">' +
        '<button class="btn" data-action="settings-export">⬇️ 导出备份（JSON）</button>' +
        '<button class="btn" data-action="settings-import">⬆️ 导入备份</button>' +
        '<input type="file" id="importFile" accept=".json,application/json" class="hidden">' +
        '<button class="btn btn-danger" data-action="settings-reset">🗑 清空所有数据</button>' +
      '</div>' +
      '<p class="muted mt">学习数据保存在浏览器本地。清除浏览器数据前请先导出备份；换电脑使用时可以导入恢复。</p>' +
    '</div>';
}

function saveSettingsFromForm(silent) {
  const provider = $('#setProvider') ? $('#setProvider').value : 'openai';
  let baseUrl = $('#setBaseUrl') ? $('#setBaseUrl').value.trim() : '';
  if (!baseUrl) baseUrl = provider === 'anthropic' ? 'https://api.anthropic.com' : 'https://api.openai.com/v1';
  Store.data.settings.provider = provider;
  Store.data.settings.baseUrl = baseUrl;
  Store.data.settings.apiKey = $('#setApiKey') ? $('#setApiKey').value.trim() : '';
  Store.data.settings.apiKeySource = 'user';   // 标记为用户手动填写
  const modelVal = $('#setModel') ? $('#setModel').value.trim() : '';
  Store.data.settings.model = modelVal
    ? modelVal
    : (provider === 'anthropic' ? 'claude-sonnet-4-5' : 'deepseek-chat');
  Store.data.settings.markSavedWords = !!($('#setMarkSaved') && $('#setMarkSaved').checked);
  Store.data.settings.hoverLookup = !!($('#setHoverLookup') && $('#setHoverLookup').checked);
  Store.save();
  updateApiBanner();
  if (!silent) toast('配置已保存');
}

async function testConnection() {
  saveSettingsFromForm(true);
  if (!hasApiKey()) { toast('请先在上方填写 / 确认 API Key，再进行连接测试', true); return; }
  const btn = $('#testConnBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner dark"></span> 测试中…';
  try {
    const r = await LLM.test();
    toast('✅ 连接成功，模型回复：' + String(r).slice(0, 30));
  } catch (e) {
    toast(LLM.friendlyError(e), true);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔌 测试连接';
  }
}

function exportData() {
  try {
    const blob = new Blob([JSON.stringify(Store.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'liora-english-backup-' + todayStr() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('备份文件已开始下载');
  } catch (e) { toast('导出失败：' + e.message, true); }
}

function importDataFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || !data.settings) throw new Error('bad format');
      Store.data = Object.assign(Store.defaults(), data);
      Store.save();
      toast('导入成功');
      renderView();
    } catch (e) { toast('文件格式不正确，导入失败', true); }
  };
  reader.onerror = () => toast('文件读取失败', true);
  reader.readAsText(file);
}

function confirmReset() {
  openModal('<h3>⚠️ 确认清空所有数据？</h3>' +
    '<p>将删除：导入/AI 生成的文章、生词本、写作记录、口语记录和学习统计。<b>内置示例文章不受影响。</b></p>' +
    '<p class="muted">建议先「导出备份」再操作。</p>' +
    '<div class="flex mt"><button class="btn btn-danger" data-action="settings-reset-do">确认清空</button>' +
    '<button class="btn" data-action="modal-close">取消</button></div>');
}

/* ---------- 全局事件分发 ---------- */
function handleAction(action, el) {
  switch (action) {
    case 'goto': {
      const view = el.getAttribute('data-view');
      if (view === 'read' && !getArticle(App.articleId)) {
        const last = getArticle(Store.data.lastArticleId);
        if (last) openArticle(last.id);
        else go('library');
      } else {
        go(view);
      }
      break;
    }
    case 'modal-close': closeModal(); break;
    case 'open-article': openArticle(el.getAttribute('data-id')); break;
    case 'import-article': importArticle(); break;
    case 'gen-article': genArticle(); break;
    case 'wp-speak': Speech.speak(el.getAttribute('data-word')); break;
    case 'wp-add': addVocabFromPopup(el.getAttribute('data-word'), el.getAttribute('data-sentence') || ''); break;
    case 'wp-close': $('#wordPopup').classList.add('hidden'); break;
    case 'sel-translate': selTranslate(); break;
    case 'sel-analyze': selAnalyze(); break;
    case 'sel-highlight': selHighlight(); break;
    case 'read-tools': {
      const drawer = $('#readToolDrawer');
      setReadToolsOpen(!(drawer && drawer.classList.contains('open')));
      break;
    }
    case 'read-tools-close': setReadToolsOpen(false); break;
    case 'hl-remove': removeHighlight(el.getAttribute('data-id')); break;
    case 'hl-clear': clearHighlights(); break;
    case 'hl-locate': locateHighlight(el.getAttribute('data-id')); break;
    case 'listen-toggle': listenToggle(); break;
    case 'listen-prev': listenPrev(); break;
    case 'listen-next': listenNext(); break;
    case 'listen-jump': listenJump(parseInt(el.getAttribute('data-idx'), 10) || 0); break;
    case 'listen-repeat': listenRepeat(); break;
    case 'listen-hide': listenHide(); break;
    case 'listen-home': backToLib(); break;
    case 'listen-select': selectAudio(el.getAttribute('data-id')); break;
    case 'listen-play': audioToggle(); break;
    case 'listen-back10': audioBack10(); break;
    case 'listen-fwd10': audioFwd10(); break;
    case 'listen-set-a': audioSetA(); break;
    case 'listen-set-b': audioSetB(); break;
    case 'listen-clear-ab': audioClearAB(); break;
    case 'listen-tr-toggle': trToggle(); break;
    case 'listen-tr-save': trSave(); break;
    case 'listen-import': { const f = $('#audioImport'); if (f) f.click(); break; }
    case 'write-submit': submitEssay(); break;
    case 'write-mode-free': App.write.mode = 'free'; renderWrite(); break;
    case 'write-mode-article': App.write.mode = 'article'; renderWrite(); break;
    case 'write-history-view': viewWriting(el.getAttribute('data-id')); break;
    case 'write-history-del':
      Store.data.writings = (Store.data.writings || []).filter((w) => w.id !== el.getAttribute('data-id'));
      Store.save(); renderWrite(); toast('已删除'); break;
    case 'speak-start': speakStart(); break;
    case 'speak-send': speakSend(); break;
    case 'speak-mic': speakMic(); break;
    case 'speak-tts': App.speak.tts = !App.speak.tts; renderSpeak(); break;
    case 'speak-finish': speakFinish(); break;
    case 'vocab-review-start': startReview(); break;
    case 'vocab-reveal': App.vocab.revealed = true; renderVocab(); break;
    case 'vocab-rate': rateVocab(el.getAttribute('data-rating')); break;
    case 'vocab-exit': App.vocab.reviewing = false; renderVocab(); break;
    case 'vocab-speak': Speech.speak(el.getAttribute('data-word')); break;
    case 'vocab-del': deleteVocab(el.getAttribute('data-id')); break;
    case 'vocab-import-ielts': importIeltsVocab(); break;
    case 'vocab-load-more': App.vocab.page = (App.vocab.page || 1) + 1; renderVocab(); break;
    case 'settings-save': saveSettingsFromForm(false); break;
    case 'settings-test': testConnection(); break;
    case 'settings-export': exportData(); break;
    case 'settings-import': { const f = $('#importFile'); if (f) f.click(); break; }
    case 'settings-toggle-key': {
      const inp = $('#setApiKey');
      if (inp) { inp.type = inp.type === 'password' ? 'text' : 'password'; el.textContent = inp.type === 'password' ? '显示' : '隐藏'; }
      break;
    }
    case 'settings-reset': confirmReset(); break;
    /* 强制重载：带上时间戳绕开浏览器缓存，解决“文件已更新但页面还是旧版”的情况 */
    case 'reload-app': {
      const base = location.href.split('?')[0].split('#')[0];
      location.replace(base + '?r=' + Date.now());
      break;
    }
    case 'settings-reset-do': Store.reset(); closeModal(); renderView(); toast('已清空所有数据'); break;
    default: break;
  }
}

function bindGlobalEvents() {
  /* 点击：动作按钮 > 文章单词 > 空白处收起浮层 */
  document.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) { handleAction(actionEl.getAttribute('data-action'), actionEl); return; }
    const wordEl = e.target.closest('#articleBody .w');
    if (wordEl) {
      clearTimeout(hoverTimer); clearTimeout(hideTimer);
      showWordPopup(wordEl); setActiveWord(wordEl);
      return;
    }
    if (!e.target.closest('#wordPopup')) $('#wordPopup').classList.add('hidden');
    if (!e.target.closest('#selToolbar')) $('#selToolbar').classList.add('hidden');
  });

  /* ---------- 鼠标指词翻译：悬停 300ms 即弹出释义（默认开启） ---------- */
  let hoverTimer = null, hideTimer = null, activeWordEl = null, popHovered = false;
  const setActiveWord = (el) => {
    $$('.w.w-active').forEach((n) => n.classList.remove('w-active'));
    activeWordEl = el || null;
    if (el) el.classList.add('w-active');
  };
  const scheduleHidePopup = (ms) => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      const pop = $('#wordPopup');
      if (pop && !popHovered) { pop.classList.add('hidden'); setActiveWord(null); }
    }, ms || 220);
  };
  document.addEventListener('mouseover', (e) => {
    if (Store.data.settings.hoverLookup === false) return;   // 设置里可关闭
    const pop = $('#wordPopup');
    if (!pop || !$('#articleBody')) return;
    const wEl = e.target.closest ? e.target.closest('#articleBody .w') : null;
    if (!wEl) {
      /* 指针不在单词上：移出弹窗则安排隐藏（debounce） */
      if (!pop.classList.contains('hidden') && !(e.target.closest && e.target.closest('#wordPopup'))) scheduleHidePopup(200);
      return;
    }
    clearTimeout(hideTimer);
    if (wEl === activeWordEl && !pop.classList.contains('hidden')) return;  // 已是当前展示的词
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => { showWordPopup(wEl); setActiveWord(wEl); }, 300);
  });
  document.addEventListener('mouseout', (e) => {
    const wEl = e.target.closest ? e.target.closest('#articleBody .w') : null;
    if (!wEl) return;
    const to = e.relatedTarget;
    /* 移进弹窗（或还在本单词内）时不隐藏，方便点「发音 / 加入生词本」 */
    if (to && (wEl.contains(to) || (to.closest && to.closest('#wordPopup')))) return;
    clearTimeout(hoverTimer);
    scheduleHidePopup(240);
  });
  const popEl = $('#wordPopup');
  if (popEl) {
    popEl.addEventListener('mouseenter', () => { popHovered = true; clearTimeout(hideTimer); });
    popEl.addEventListener('mouseleave', () => { popHovered = false; scheduleHidePopup(200); });
  }
  document.documentElement.addEventListener('mouseleave', () => scheduleHidePopup(120));

  /* 弹窗遮罩点击关闭 */
  const mask = $('#modalMask');
  if (mask) mask.addEventListener('click', (e) => { if (e.target.id === 'modalMask') closeModal(); });

  /* Esc 关闭浮层 */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      $('#wordPopup').classList.add('hidden');
      $('#selToolbar').classList.add('hidden');
      setReadToolsOpen(false);
    }
    if (e.key === 'Enter' && e.target && e.target.id === 'speakInput') {
      e.preventDefault();
      speakSend();
    }
  });

  /* 滚动时收起浮层 */
  window.addEventListener('scroll', () => {
    $('#wordPopup').classList.add('hidden');
    $('#selToolbar').classList.add('hidden');
  }, { passive: true });

  /* 输入：作文字数 / 生词搜索 / 语速标签 */
  document.addEventListener('input', (e) => {
    if (!e.target || !e.target.id) return;
    if (e.target.id === 'essayInput') {
      const wc = $('#wordCount');
      if (wc) wc.textContent = String(wordCount(e.target.value));
    } else if (e.target.id === 'vocabSearch') {
      App.vocab.query = e.target.value;
      App.vocab.page = 1;
      renderVocab();
    } else if (e.target.id === 'setTtsRate') {
      const label = $('#rateLabel');
      if (label) label.textContent = e.target.value;
    }
  });

  /* 变更：精听语速 / 设置表单自动保存 / 导入文件 */
  document.addEventListener('change', (e) => {
    if (!e.target) return;
    if (e.target.id === 'importFile') { importDataFile(e.target.files[0]); e.target.value = ''; return; }
    const actionEl = e.target.closest('[data-action]');
    if (actionEl && actionEl.getAttribute('data-action') === 'listen-rate') {
      App.listen.rate = parseFloat(e.target.value) || 1;
      Store.data.settings.ttsRate = App.listen.rate;
      Store.save();
      return;
    }
    if (actionEl && actionEl.getAttribute('data-action') === 'listen-speed') {
      audioSpeed(parseFloat(e.target.value) || 1);
      return;
    }
    if (e.target.id === 'setProvider') {
      const p = e.target.value;
      const urlInput = $('#setBaseUrl');
      const cur = urlInput ? urlInput.value.trim() : '';
      if (urlInput && (!cur || cur === 'https://api.openai.com/v1' || cur === 'https://api.anthropic.com')) {
        urlInput.value = p === 'anthropic' ? 'https://api.anthropic.com' : 'https://api.openai.com/v1';
      }
    }
    if (e.target.closest('#settingsForm')) saveSettingsFromForm(true);
  });
}

/* ---------- 启动（幂等保护，防止重复初始化） ---------- */
let _booted = false;
function boot() {
  if (_booted) return;
  _booted = true;
  Store.load();
  Speech.init();
  setupSelectionToolbar();
  bindGlobalEvents();
  App.listen.rate = Store.data.settings.ttsRate || 1;
  go('home');
}
document.addEventListener('DOMContentLoaded', boot);
