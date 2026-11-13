/* =========================================================
 * Liora English · 核心层
 * 工具函数 / 本地存储 / 间隔重复 / 语音(TTS+ASR) / 提示组件
 * ========================================================= */

/* ---------- 基础工具 ---------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

function todayStr(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function datePlusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

function fmtDateTime(ts) {
  const d = new Date(ts);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

/* 英文单词计数（撇视连字符算词内字符） */
function wordCount(text) {
  const m = String(text || '').trim().match(/[A-Za-z0-9'’\-]+/g);
  return m ? m.length : 0;
}

/* 从模型输出中提取 JSON（容忍 ```json 代码块和前后废话） */
function extractJson(text) {
  if (!text) return null;
  let t = String(text).trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/,'').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(t.slice(start, end + 1)); } catch (e) { return null; }
}

/* 把文章切成句子数组 */
function articleSentences(article) {
  const out = [];
  (article.paragraphs || []).forEach((p) => {
    const parts = p.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [];
    parts.forEach((s) => { const t = s.trim(); if (t) out.push(t); });
  });
  return out;
}

/* ---------- 提示组件 ---------- */
let _toastTimer = null;
function toast(msg, isError) {
  const el = $('#toast');
  if (!el) { return; }
  el.textContent = msg;
  el.className = 'toast' + (isError ? ' toast-error' : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), 3400);
}

function openModal(html) { $('#modalBox').innerHTML = html; $('#modalMask').classList.remove('hidden'); }
function closeModal() { $('#modalMask').classList.add('hidden'); }

/* ---------- 本地存储 ---------- */
const Store = {
  KEY: 'loopenglish_v1',
  data: null,
  defaults() {
    return {
      v: 1,
      settings: {
        provider: 'openai',                 // openai | anthropic
        baseUrl: 'https://workbuddy.tokenmao.cn/v1',
        apiKey: '',                         // 由用户在「设置」填写，或由本地 config.local.js 注入；仅存于本机浏览器
        model: 'TM ·DeepSeek-V4',           // WorkBuddy API（tokenmao）默认模型；可在「设置」切换 TM ·Fast / TM ·Auto 等
        ttsRate: 1,
        markSavedWords: false,             // 正文中是否给「已收入生词本」的单词标绿色底纹（默认关）
        hoverLookup: true                  // 鼠标指到单词即弹出释义（指词翻译，默认开；显式设为 false 关闭）
      },
      articles: [],      // 用户导入 / AI 生成的文章
      progress: {},      // articleId -> { read, listen, write, speak }
      vocab: [],         // { id, word, meaning, articleId, articleTitle, level, due, reps, mastered }
      wordCache: {},     // "word|||sentence" -> 释义文本
      writings: [],      // { id, articleId, articleTitle, task, essay, result, createdAt }
      speakSessions: [], // { id, articleId, articleTitle, messages, report, createdAt }
      activity: [],      // { t, type, text }
      highlights: {},    // articleId -> [{ id, text }]  精读高亮标注
      listenTranscripts: {}, // 听力音频 audioId -> 原文/听写文本
      listenDone: {},    // 听力音频 audioId -> true（已完整听一遍）
      lastArticleId: null
    };
  },
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this.data = raw ? Object.assign(this.defaults(), JSON.parse(raw)) : this.defaults();
    } catch (e) { this.data = this.defaults(); }
    const def = this.defaults();
    if (!this.data.settings) {
      this.data.settings = Object.assign({}, def.settings);
    } else {
      const s = this.data.settings;
      if (typeof s.ttsRate !== 'number') s.ttsRate = def.settings.ttsRate;
      if (!s.apiKey) {
        /* 未配置密钥时，将服务商/地址/模型统一迁移到默认方案（可公开的服务信息，非密钥），
           让旧设备无缝用上默认方案；apiKey 保持为空，绝不从源码写入。 */
        s.provider = def.settings.provider;
        s.baseUrl = def.settings.baseUrl;
        s.model = def.settings.model;
      } else if (!s.provider) {
        s.provider = def.settings.provider;
      }
    }
    if (this.data.settings.apiKeySource === 'config') {
      this.data.settings.apiKey = '';
      this.data.settings.apiKeySource = 'cloud';
      this.save();
    }
    ['articles','progress','vocab','wordCache','writings','speakSessions','activity','highlights','listenTranscripts','listenDone'].forEach((k) => {
      if (!this.data[k]) this.data[k] = def[k];
    });
    return this.data;
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); }
    catch (e) { toast('保存失败：浏览器本地存储已满，请先导出备份再清理数据', true); }
  },
  reset() { this.data = this.defaults(); this.save(); }
};

function logActivity(type, text) {
  const d = Store.data;
  d.activity.unshift({ t: Date.now(), type: type, text: text });
  if (d.activity.length > 200) d.activity.length = 200;
  Store.save();
}

/* 全部文章 = 内置 + 用户新增 */
function allArticles() {
  return ARTICLES.concat(Store.data.articles || []);
}
function getArticle(id) {
  return allArticles().find((a) => a.id === id) || null;
}

/* ---------- 间隔重复（SM-2 简化版） ---------- */
const SRS_STEPS = [0, 1, 2, 4, 7, 15, 30]; // 天

function srsRate(word, rating) { // 'forget' | 'vague' | 'know'
  let lv = word.level || 0;
  if (rating === 'forget') lv = 0;
  else if (rating === 'vague') lv = Math.max(1, Math.min(lv, 2));
  else lv = Math.min(lv + 1, SRS_STEPS.length - 1);
  word.level = lv;
  word.due = datePlusDays(SRS_STEPS[lv]);
  word.reps = (word.reps || 0) + 1;
  if (lv >= SRS_STEPS.length - 1) word.mastered = true;
  else delete word.mastered;
}

function dueVocab() {
  const t = todayStr();
  return (Store.data.vocab || []).filter((w) => !w.due || w.due <= t);
}

/* ---------- 语音：TTS 朗读 ---------- */
const Speech = {
  ttsOK: (typeof window !== 'undefined') && ('speechSynthesis' in window),
  asrOK: (typeof window !== 'undefined') && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  voices: [],
  init() {
    if (!this.ttsOK) return;
    const load = () => { try { this.voices = window.speechSynthesis.getVoices() || []; } catch (e) {} };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  },
  enVoice() {
    const vs = (this.voices || []).filter((v) => /^en([-_]|$)/i.test(v.lang || ''));
    return vs.find((v) => /US/i.test(v.lang)) || vs[0] || null;
  },
  speak(text, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      if (!this.ttsOK || !text) { resolve(false); return; }
      try {
        this.stop();
        const u = new SpeechSynthesisUtterance(text);
        const v = this.enVoice();
        if (v) u.voice = v;
        u.lang = v ? v.lang : 'en-US';
        u.rate = (opts.rate != null ? opts.rate : (Store.data && Store.data.settings ? Store.data.settings.ttsRate : 1)) || 1;
        u.onend = () => resolve(true);
        u.onerror = () => resolve(false);
        window.speechSynthesis.speak(u);
      } catch (e) { resolve(false); }
    });
  },
  stop() { if (this.ttsOK) { try { window.speechSynthesis.cancel(); } catch (e) {} } }
};

/* ---------- 语音：ASR 识别（Chrome，依赖 Google 服务） ---------- */
function startListening(handlers) {
  const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) {
    if (handlers.onError) handlers.onError('unsupported');
    return null;
  }
  let rec;
  try { rec = new SR(); } catch (e) { if (handlers.onError) handlers.onError('init-failed'); return null; }
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) final += r[0].transcript; else interim += r[0].transcript;
    }
    if (interim && handlers.onInterim) handlers.onInterim(interim);
    if (final && handlers.onFinal) handlers.onFinal(final.trim());
  };
  rec.onerror = (e) => { if (handlers.onError) handlers.onError(e.error || 'error'); };
  rec.onend = () => { if (handlers.onEnd) handlers.onEnd(); };
  try { rec.start(); } catch (e) { if (handlers.onError) handlers.onError('start-failed'); return null; }
  return rec;
}

/* ---------- 通用运行状态 ---------- */
const App = {
  view: 'home',
  articleId: null,
  listen: {
    idx: 0, playing: false, repeat: false, hideText: false, sentences: [], played: {},
    audioId: null, audioEl: null, audioPlaying: false, audioRate: 1,
    abA: null, abB: null, trHide: false
  },
  write: { mode: 'article' },
  speak: { messages: [], started: false, tts: true, report: null, sending: false },
  vocab: { reviewing: false, idx: 0, revealed: false, query: '' }
};
window.App = App; // 调试钩子：便于控制台与自动化测试访问运行状态
window.Store = Store; // 调试钩子：便于自动化测试访问本地存储封装

/* 音标查询（window.getPhonetic）
   数据来源（均为本地文件，无网络请求）：
   1) js/ielts-words.js 每个条目的 phonetic 字段（9389 词）
   2) 各文章的本地缓存 phonetics 映射（js/*-cache.js，通过
      window.LIORA_LOCAL_CACHES 注册；旧版单篇缓存走 SDG11_CACHE 兼容分支）
   查找表懒加载：第一次调用时构建，之后 O(1) 命中。 */
window.getPhonetic = (function () {
  let map = null;
  return function (word) {
    if (!word) return '';
    if (!map) {
      map = {};
      (window.IELTS_WORDS || []).forEach((it) => {
        if (it && it.phonetic) map[String(it.word).toLowerCase()] = it.phonetic;
      });
      const reg = window.LIORA_LOCAL_CACHES || {};
      Object.keys(reg).forEach((id) => {
        const ph = reg[id] && reg[id].phonetics;
        if (ph) Object.keys(ph).forEach((k) => { map[k.toLowerCase()] = ph[k]; });
      });
      const sdg = window.SDG11_CACHE;
      if (sdg && sdg.phonetics) {
        Object.keys(sdg.phonetics).forEach((k) => { map[k.toLowerCase()] = sdg.phonetics[k]; });
      }
    }
    return map[String(word).toLowerCase()] || '';
  };
})();

function hasApiKey() {
  const s = Store.data.settings;
  return !!(s && s.apiKey && String(s.apiKey).trim());
}

function requireApiKey() {
  if (!hasApiKey()) {
    toast('请先在「设置」中填写 API Key', true);
    go('settings');
    return false;
  }
  return true;
}

function markProgress(articleId, stage) {
  const d = Store.data;
  if (!d.progress[articleId]) d.progress[articleId] = {};
  if (!d.progress[articleId][stage]) {
    d.progress[articleId][stage] = true;
    logActivity(stage, getArticle(articleId) ? getArticle(articleId).title : articleId);
  }
  Store.save();
}
