/* Liora 个人学习中心 · 统一数据与 AI 客户端（零依赖） */
(function () {
  'use strict';

  var cache = {
    study: null,
    handbooks: null,
    glossary: null,
    examPacks: null,
    videosExtra: null,
    wishlist: null
  };

  function toast(msg) {
    var el = document.getElementById('lh-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lh-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.display = 'none'; }, 3200);
  }

  async function apiGet(path) {
    var r = await fetch(path, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(j.error || ('请求失败 HTTP ' + r.status));
    return j;
  }

  async function apiPost(path, body) {
    var r = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body || {})
    });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok || j.ok === false) throw new Error(j.error || ('保存失败 HTTP ' + r.status));
    return j;
  }

  async function loadStudy(force) {
    if (cache.study && !force) return cache.study;
    try {
      cache.study = await apiGet('/__api/study');
    } catch (e) {
      cache.study = { mistakes: [], annotations: [], focusSessions: [], grades: [], flashcards: {}, dailyFocus: { day: '', items: [] } };
    }
    return cache.study;
  }

  async function loadJsonChunk(key, url) {
    if (cache[key]) return cache[key];
    var r = await fetch(url, { credentials: 'same-origin' });
    if (!r.ok) throw new Error('加载数据失败：' + url);
    cache[key] = await r.json();
    return cache[key];
  }

  async function saveMistake(payload) {
    var res = await apiPost('/__api/study/mistakes', payload);
    cache.study = null;
    return res;
  }

  async function saveAnnotation(payload) {
    var res = await apiPost('/__api/study/annotations', payload);
    cache.study = null;
    return res;
  }

  async function saveFocus(payload) {
    var res = await apiPost('/__api/study/focus', payload);
    cache.study = null;
    return res;
  }

  async function saveGrade(payload) {
    var res = await apiPost('/__api/study/grades', payload);
    cache.study = null;
    return res;
  }

  async function saveFlashcard(termId, status) {
    var res = await apiPost('/__api/study/flashcards', { termId: termId, status: status });
    cache.study = null;
    return res;
  }

  async function importBackup(jsonObj) {
    var res = await apiPost('/__api/backup/import', jsonObj);
    cache.study = null;
    return res;
  }

  /* 统一 AI 调用：优先走服务端代理（支持个人密钥），未配置时自动降级走前端 cloudLLM */
  async function askAI(opts) {
    var question = String(opts.question || '').trim();
    var mode = opts.mode || 'socratic';
    var context = opts.context || '';
    var history = opts.history || [];
    var onDelta = opts.onDelta || function () {};

    var useServer = false;
    try {
      var info = await apiGet('/api/ai-info');
      if (info && info.ready) useServer = true;
    } catch (e) {}

    if (useServer) {
      var r = await fetch('/__api/ai/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question, mode: mode, context: context, history: history })
      });
      var ct = r.headers.get('content-type') || '';
      if (ct.indexOf('text/event-stream') >= 0 && r.body) {
        var reader = r.body.getReader();
        var dec = new TextDecoder('utf-8');
        var buf = '';
        var full = '';
        while (true) {
          var step = await reader.read();
          if (step.done) break;
          buf += dec.decode(step.value, { stream: true });
          var idx;
          while ((idx = buf.indexOf('\n')) >= 0) {
            var line = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 1);
            if (!line.startsWith('data:')) continue;
            var raw = line.slice(5).trim();
            if (!raw || raw === '[DONE]') continue;
            try {
              var j = JSON.parse(raw);
              var delta = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
              if (delta) { full += delta; onDelta(delta); }
            } catch (e) {}
          }
        }
        return full;
      }
      var errJ = await r.json().catch(function () { return {}; });
      throw new Error(errJ.error || '服务端 AI 调用失败');
    }

    if (window.cloudLLM && typeof window.cloudLLM.stream === 'function') {
      var modeHint = mode === 'direct'
        ? '请直接给出清晰定义、完整分步解答与避坑提醒。'
        : mode === 'grade'
          ? '请先逐题批改并指出错误类型，然后在末尾输出 ```grade-json\n{"course":"accounting","title":"...","score":8,"maxScore":10,"sourceType":"ai_estimate","weakPoints":[],"errorTags":[],"summary":"..."}\n```。'
          : '请用苏格拉底式引导，先定位学生卡点再拆解。';
      var sys = '你是 UNSW 预科学生的私人学习伴学助手。术语保留英文并附中文解释。' + modeHint +
        (context ? '\n当前学习页面上下文：' + context.slice(0, 1200) : '');
      var msgs = [{ role: 'system', content: sys }]
        .concat(history.slice(-6))
        .concat([{ role: 'user', content: question }]);
      return await window.cloudLLM.stream(msgs, { onDelta: onDelta });
    }

    throw new Error('AI 通道尚未就绪：请在「AI 设置」填入个人密钥，或确认云端 SDK 已加载。');
  }

  function parseGradeBlock(text) {
    var m = String(text || '').match(/```grade-json\s*([\s\S]*?)```/i);
    if (!m) return null;
    try {
      var obj = JSON.parse(m[1].trim());
      if (obj && obj.course && obj.title && Number.isFinite(Number(obj.score)) && Number.isFinite(Number(obj.maxScore))) {
        return obj;
      }
    } catch (e) {}
    return null;
  }

  window.LioraStudyApi = {
    toast: toast,
    loadStudy: loadStudy,
    loadHandbooks: function () { return loadJsonChunk('handbooks', '/data-chunks/handbooks.json?v=20261122-v2'); },
    loadGlossary: function () { return loadJsonChunk('glossary', '/data-chunks/glossary.json?v=20261122-v2'); },
    loadExamPacks: function () { return loadJsonChunk('examPacks', '/data-chunks/exam-packs.json?v=20261122-v2'); },
    loadVideosExtra: function () { return loadJsonChunk('videosExtra', '/data-chunks/videos-extra.json?v=20261122-v2'); },
    loadWishlist: function () { return loadJsonChunk('wishlist', '/data-chunks/wishlist-books.json?v=20261122-v2'); },
    saveMistake: saveMistake,
    saveAnnotation: saveAnnotation,
    saveFocus: saveFocus,
    saveGrade: saveGrade,
    saveFlashcard: saveFlashcard,
    importBackup: importBackup,
    askAI: askAI,
    parseGradeBlock: parseGradeBlock
  };
})();
