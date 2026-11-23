/* Liora 学习小屋 · 全站通用 4 色荧光笔永久高光标注引擎（所有账号通用，按账号云端隔离保存，跨设备精准回显） */
(function () {
  'use strict';

  if (window.__LIORA_HIGHLIGHTER_READY__) return;
  window.__LIORA_HIGHLIGHTER_READY__ = true;

  var COLORS = [
    { id: 'yellow', label: '重点黄', hex: '#fde047', bg: 'rgba(253, 224, 71, 0.45)', bd: '#eab308' },
    { id: 'green',  label: '掌握绿', hex: '#86efac', bg: 'rgba(134, 239, 172, 0.42)', bd: '#22c55e' },
    { id: 'blue',   label: '英文蓝', hex: '#93c5fd', bg: 'rgba(147, 197, 253, 0.42)', bd: '#3b82f6' },
    { id: 'pink',   label: '易错粉', hex: '#f9a8d4', bg: 'rgba(249, 168, 212, 0.44)', bd: '#ec4899' }
  ];

  function normColor(c) {
    if (c === 'gold') return 'yellow';
    if (c === 'rose') return 'pink';
    for (var i = 0; i < COLORS.length; i++) if (COLORS[i].id === c) return c;
    return 'yellow';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* 注入自包含样式，确保在独立子页面（daily-brief / english / exam-prep / guide）同样精美 */
  function injectStyles() {
    if (document.getElementById('lh-hl-styles')) return;
    var st = document.createElement('style');
    st.id = 'lh-hl-styles';
    st.textContent = [
      'mark.lh-hl{color:inherit;padding:1px 2px;border-radius:4px;cursor:pointer;transition:filter .15s,box-shadow .15s;position:relative;-webkit-box-decoration-break:clone;box-decoration-break:clone}',
      'mark.lh-hl:hover{filter:brightness(.94);box-shadow:0 0 0 1.5px rgba(15,39,68,.24)}',
      'mark.lh-hl-yellow{background:rgba(253,224,71,.46);border-bottom:2px solid #eab308}',
      'mark.lh-hl-green{background:rgba(134,239,172,.44);border-bottom:2px solid #22c55e}',
      'mark.lh-hl-blue{background:rgba(147,197,253,.44);border-bottom:2px solid #3b82f6}',
      'mark.lh-hl-pink{background:rgba(249,168,212,.46);border-bottom:2px solid #ec4899}',
      'mark.lh-hl[data-has-note="1"]::after{content:"📝";font-size:10px;margin-left:2px;vertical-align:super;opacity:.85}',
      '@keyframes lhHlPulse{0%{box-shadow:0 0 0 0 rgba(201,155,59,.85)}70%{box-shadow:0 0 0 10px rgba(201,155,59,0)}100%{box-shadow:none}}',
      'mark.lh-hl-pulse{animation:lhHlPulse 1.4s ease-out 2}',
      '#lh-hl-bar{position:fixed;z-index:10050;display:none;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#0f2744;color:#fff;box-shadow:0 10px 28px rgba(15,39,68,.35);border:1px solid rgba(255,255,255,.16);font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;font-size:12.5px;user-select:none}',
      '.lh-hl-dot{width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,.85);cursor:pointer;transition:transform .12s;padding:0}',
      '.lh-hl-dot:hover{transform:scale(1.18)}',
      '.lh-hl-btn{border:none;background:rgba(255,255,255,.14);color:#fff;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}',
      '.lh-hl-btn:hover{background:rgba(255,255,255,.26)}',
      '#lh-hl-pop{position:fixed;z-index:10060;display:none;width:290px;max-width:calc(100vw - 24px);padding:12px 14px;border-radius:13px;background:#fff;color:#1b2c40;border:1.5px solid #cbd9ea;box-shadow:0 14px 36px rgba(15,39,68,.22);font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;font-size:13px}',
      '#lh-hl-pop .pop-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}',
      '#lh-hl-pop .pop-dots{display:flex;gap:7px;align-items:center}',
      '#lh-hl-pop textarea{width:100%;min-height:62px;padding:8px 10px;border:1.5px solid #d5e1ee;border-radius:8px;font-size:13px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box}',
      '#lh-hl-pop textarea:focus{border-color:#0f2744}',
      '#lh-hl-pop .pop-actions{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px}',
      '#lh-hl-pop .pop-save{background:#0f2744;color:#fff;border:none;border-radius:8px;padding:5px 12px;font-size:12.5px;font-weight:700;cursor:pointer}',
      '#lh-hl-pop .pop-del{background:#fdf0ee;color:#b4322a;border:1px solid #ebb8b2;border-radius:8px;padding:5px 10px;font-size:12.5px;font-weight:600;cursor:pointer}',
      '#lh-hl-tip{position:fixed;z-index:10040;display:none;max-width:260px;padding:7px 10px;border-radius:8px;background:#0f2744;color:#fff;font-size:12px;line-height:1.5;box-shadow:0 8px 20px rgba(0,0,0,.22);pointer-events:none}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function currentPageKey() {
    var path = location.pathname || '/';
    if (path === '/' || path === '/index.html') {
      return (location.hash || '#/').split('?')[0] || '#/';
    }
    return path;
  }

  function currentCourseGuess() {
    var k = currentPageKey();
    if (k.indexOf('#/c/') === 0) return k.split('/')[2] || 'general';
    if (k.indexOf('#/book/') === 0) return 'reading';
    if (k.indexOf('#/handbooks') === 0) return k.split('/')[2] || 'handbooks';
    if (k.indexOf('/english') === 0) return 'english';
    if (k.indexOf('/exam-prep') === 0) return 'accounting';
    if (k.indexOf('/daily-brief') === 0) return 'daily-brief';
    return 'general';
  }

  function currentPageTitle() {
    var h1 = document.querySelector('#app h1, main h1, h1');
    return (h1 && h1.textContent.trim().slice(0, 90)) || document.title || currentPageKey();
  }

  function getContentRoot() {
    return document.getElementById('app') || document.querySelector('main') || document.body;
  }

  function isExcludedElement(el) {
    if (!el || el.nodeType !== 1) return false;
    return !!el.closest(
      'header, nav, .ed-header, .ed-sidebar, .ed-step-bar, .ed-guide-bar, .ed-fig-strip, #lh-dock, #lh-hl-bar, #lh-hl-pop, #lh-hl-tip, .lh-drawer, script, style, noscript, textarea, input, select, button, svg, .katex'
    );
  }

  /* 轻 toast（兼容未加载 study-api.js 的独立子页） */
  function notify(msg) {
    if (window.LioraStudyApi && typeof window.LioraStudyApi.toast === 'function') {
      window.LioraStudyApi.toast(msg);
      return;
    }
    var el = document.getElementById('lh-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lh-toast';
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:10090;background:#0f2744;color:#fff;padding:8px 16px;border-radius:999px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.22)';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.display = 'none'; }, 2600);
  }

  async function apiFetchStudy() {
    if (window.LioraStudyApi && typeof window.LioraStudyApi.loadStudy === 'function') {
      return await window.LioraStudyApi.loadStudy(true);
    }
    var r = await fetch('/__api/study', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!r.ok) return { annotations: [] };
    return await r.json();
  }

  async function apiPostAnnotation(payload) {
    if (window.LioraStudyApi && typeof window.LioraStudyApi.saveAnnotation === 'function') {
      return await window.LioraStudyApi.saveAnnotation(payload);
    }
    var r = await fetch('/__api/study/annotations', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok || j.ok === false) throw new Error(j.error || '保存失败');
    return j;
  }

  /* 收集容器内所有可高亮文本节点及线性偏移表 */
  function collectTextIndex(root) {
    var nodes = [];
    var full = '';
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.parentElement) return NodeFilter.FILTER_REJECT;
        if (isExcludedElement(n.parentElement)) return NodeFilter.FILTER_REJECT;
        if (n.parentElement.closest('mark.lh-hl')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var cur;
    while ((cur = walker.nextNode())) {
      var start = full.length;
      full += cur.nodeValue;
      nodes.push({ node: cur, start: start, end: full.length });
    }
    return { nodes: nodes, full: full };
  }

  /* 在全文中找到最匹配 prefix + quote + suffix 的精确位置 */
  function findBestMatchIndex(full, quote, prefix, suffix) {
    if (!quote || !full) return -1;
    var hits = [];
    var pos = 0;
    while ((pos = full.indexOf(quote, pos)) !== -1) {
      hits.push(pos);
      pos += Math.max(1, quote.length);
      if (hits.length > 40) break;
    }
    if (!hits.length) return -1;
    if (hits.length === 1 || (!prefix && !suffix)) return hits[0];

    var bestIdx = hits[0];
    var bestScore = -1;
    for (var i = 0; i < hits.length; i++) {
      var h = hits[i];
      var score = 0;
      if (prefix) {
        var before = full.slice(Math.max(0, h - prefix.length), h);
        for (var a = 1; a <= Math.min(before.length, prefix.length); a++) {
          if (before[before.length - a] === prefix[prefix.length - a]) score++;
          else break;
        }
      }
      if (suffix) {
        var after = full.slice(h + quote.length, h + quote.length + suffix.length);
        for (var b = 0; b < Math.min(after.length, suffix.length); b++) {
          if (after[b] === suffix[b]) score++;
          else break;
        }
      }
      if (score > bestScore) { bestScore = score; bestIdx = h; }
    }
    return bestIdx;
  }

  /* 安全跨节点包裹 <mark class="lh-hl"> */
  function wrapMatch(root, ann) {
    var quote = String(ann.quote || '');
    if (quote.length < 2) return null;
    var idxObj = collectTextIndex(root);
    var matchStart = findBestMatchIndex(idxObj.full, quote, ann.prefix || '', ann.suffix || '');
    if (matchStart < 0) return null;
    var matchEnd = matchStart + quote.length;
    var color = normColor(ann.color);
    var firstMark = null;

    // 反向遍历节点避免切分破坏前面节点索引
    for (var i = idxObj.nodes.length - 1; i >= 0; i--) {
      var rec = idxObj.nodes[i];
      if (rec.end <= matchStart || rec.start >= matchEnd) continue;
      var localStart = Math.max(0, matchStart - rec.start);
      var localEnd = Math.min(rec.node.nodeValue.length, matchEnd - rec.start);
      if (localEnd <= localStart) continue;

      var targetNode = rec.node;
      if (localEnd < targetNode.nodeValue.length) targetNode.splitText(localEnd);
      var midNode = localStart > 0 ? targetNode.splitText(localStart) : targetNode;

      var mark = document.createElement('mark');
      mark.className = 'lh-hl lh-hl-' + color;
      mark.setAttribute('data-hl-id', ann.id);
      mark.setAttribute('data-hl-color', color);
      if (ann.note) {
        mark.setAttribute('data-has-note', '1');
        mark.setAttribute('data-hl-note', ann.note);
      }
      midNode.parentNode.insertBefore(mark, midNode);
      mark.appendChild(midNode);
      firstMark = mark;
    }
    return firstMark;
  }

  function unwrapHighlight(hlId) {
    document.querySelectorAll('mark.lh-hl[data-hl-id="' + CSS.escape(hlId) + '"]').forEach(function (m) {
      var parent = m.parentNode;
      if (!parent) return;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
    });
  }

  function clearAllMarks(root) {
    if (!root) return;
    root.querySelectorAll('mark.lh-hl').forEach(function (m) {
      var parent = m.parentNode;
      if (!parent) return;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
    });
    root.normalize();
  }

  /* 抓取当前选区的前后 30 字上下文指纹 */
  function extractSelectionContext(root, range) {
    var quote = range.toString();
    var idxObj = collectTextIndex(root);
    // 尝试直接定位 range.startContainer 在线性表中的位置
    var offset = -1;
    for (var i = 0; i < idxObj.nodes.length; i++) {
      if (idxObj.nodes[i].node === range.startContainer) {
        offset = idxObj.nodes[i].start + range.startOffset;
        break;
      }
    }
    if (offset < 0) offset = idxObj.full.indexOf(quote);
    var prefix = offset > 0 ? idxObj.full.slice(Math.max(0, offset - 32), offset) : '';
    var suffix = offset >= 0 ? idxObj.full.slice(offset + quote.length, offset + quote.length + 32) : '';
    return { quote: quote, prefix: prefix, suffix: suffix };
  }

  /* 状态与 UI 元素 */
  var annotationsMap = {};
  var pendingSel = null;
  var barEl, popEl, tipEl;
  var activePopId = null;

  function buildUi() {
    injectStyles();
    if (!document.getElementById('lh-hl-bar')) {
      barEl = document.createElement('div');
      barEl.id = 'lh-hl-bar';
      barEl.innerHTML =
        COLORS.map(function (c) {
          return '<button type="button" class="lh-hl-dot" data-hl-pick="' + c.id + '" title="画高光：' + c.label + '" style="background:' + c.hex + '"></button>';
        }).join('') +
        '<button type="button" class="lh-hl-btn" id="lhHlNoteBtn">📝 加批注</button>';
      document.body.appendChild(barEl);
    } else {
      barEl = document.getElementById('lh-hl-bar');
    }

    if (!document.getElementById('lh-hl-pop')) {
      popEl = document.createElement('div');
      popEl.id = 'lh-hl-pop';
      popEl.innerHTML =
        '<div class="pop-row">' +
          '<b style="font-size:12.5px;color:#0f2744">🖍️ 高光标注</b>' +
          '<div class="pop-dots">' +
            COLORS.map(function (c) {
              return '<button type="button" class="lh-hl-dot" data-pop-color="' + c.id + '" title="切换为' + c.label + '" style="width:19px;height:19px;background:' + c.hex + ';border-color:' + c.bd + '"></button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<textarea id="lhPopNote" placeholder="写一句你对这段话的理解或避坑提醒…"></textarea>' +
        '<div class="pop-actions">' +
          '<button type="button" class="pop-del" id="lhPopDel">🗑 擦除高光</button>' +
          '<div style="display:flex;gap:6px">' +
            '<button type="button" class="pop-del" style="background:#f3f6fa;color:#475a70;border-color:#d5e1ee" id="lhPopClose">关闭</button>' +
            '<button type="button" class="pop-save" id="lhPopSave">保存批注</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(popEl);
    } else {
      popEl = document.getElementById('lh-hl-pop');
    }

    if (!document.getElementById('lh-hl-tip')) {
      tipEl = document.createElement('div');
      tipEl.id = 'lh-hl-tip';
      document.body.appendChild(tipEl);
    } else {
      tipEl = document.getElementById('lh-hl-tip');
    }
  }

  function hideBar() { if (barEl) barEl.style.display = 'none'; }
  function hidePop() { if (popEl) popEl.style.display = 'none'; activePopId = null; }

  async function createHighlight(color, askNote) {
    if (!pendingSel) return;
    var snap = pendingSel;
    pendingSel = null;
    hideBar();
    try { window.getSelection().removeAllRanges(); } catch (e) {}

    var note = '';
    if (askNote) {
      note = window.prompt('给这段高光写一句批注：', '') || '';
    }
    var payload = {
      route: currentPageKey(),
      course: currentCourseGuess(),
      title: currentPageTitle(),
      kind: note ? 'note' : 'highlight',
      color: normColor(color),
      quote: snap.quote,
      prefix: snap.prefix,
      suffix: snap.suffix,
      note: note
    };

    try {
      var res = await apiPostAnnotation(payload);
      var saved = res.item || Object.assign({ id: 'hl_' + Date.now() }, payload);
      annotationsMap[saved.id] = saved;
      wrapMatch(getContentRoot(), saved);
      notify(note ? '已画高光并保存批注到云端' : '已保存高光到云端');
    } catch (e) {
      notify(e.message || '保存高光失败');
    }
  }

  function openPopoverForMark(markEl) {
    var id = markEl.getAttribute('data-hl-id');
    var ann = annotationsMap[id];
    if (!ann) return;
    activePopId = id;
    var rect = markEl.getBoundingClientRect();
    var left = Math.max(12, Math.min(window.innerWidth - 304, rect.left));
    var top = rect.bottom + 8;
    if (top + 170 > window.innerHeight) top = Math.max(12, rect.top - 175);
    popEl.style.left = left + 'px';
    popEl.style.top = top + 'px';
    document.getElementById('lhPopNote').value = ann.note || '';
    popEl.style.display = 'block';
  }

  var applySeq = 0;
  async function applyHighlights() {
    var boot = window.__CLOUD_BOOT__ || {};
    if (boot.perms && boot.perms.highlight === false && boot.role !== 'admin') return;
    var root = getContentRoot();
    if (!root) return;
    var seq = ++applySeq;
    var pageKey = currentPageKey();
    if (pageKey === '#/annotations' || pageKey === '#/admin') return;

    var st;
    try { st = await apiFetchStudy(); } catch (e) { return; }
    if (seq !== applySeq) return;

    var all = (st && Array.isArray(st.annotations)) ? st.annotations : [];
    var pageList = all.filter(function (a) { return a && a.route === pageKey && a.quote && a.quote.length >= 2; });
    clearAllMarks(root);
    annotationsMap = {};

    var jumpId = '';
    try { jumpId = sessionStorage.getItem('lh_jump_hl') || ''; } catch (e) {}
    var jumpMark = null;

    pageList.forEach(function (a) {
      annotationsMap[a.id] = a;
      var mk = wrapMatch(root, a);
      if (mk && jumpId && a.id === jumpId) jumpMark = mk;
    });

    if (jumpMark) {
      try { sessionStorage.removeItem('lh_jump_hl'); } catch (e) {}
      var det = jumpMark.closest('details');
      while (det) { det.open = true; det = det.parentElement ? det.parentElement.closest('details') : null; }
      setTimeout(function () {
        jumpMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        jumpMark.classList.add('lh-hl-pulse');
      }, 120);
    }
  }

  function handleSelectionCheck() {
    var boot = window.__CLOUD_BOOT__ || {};
    if (boot.perms && boot.perms.highlight === false && boot.role !== 'admin') return;
    var pageKey = currentPageKey();
    if (pageKey === '#/admin' || pageKey === '#/annotations') { hideBar(); return; }

    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { hideBar(); return; }
    var txt = sel.toString();
    var trimmed = txt.trim();
    if (trimmed.length < 2 || trimmed.length > 600) { hideBar(); return; }

    var range = sel.getRangeAt(0);
    var root = getContentRoot();
    if (!root || !root.contains(range.commonAncestorContainer)) { hideBar(); return; }
    var ancEl = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (isExcludedElement(ancEl)) { hideBar(); return; }

    var rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) { hideBar(); return; }

    pendingSel = extractSelectionContext(root, range);
    if (!pendingSel.quote || pendingSel.quote.trim().length < 2) { hideBar(); return; }

    var left = Math.max(12, Math.min(window.innerWidth - 220, rect.left + rect.width / 2 - 105));
    var top = Math.max(12, rect.top - 48);
    barEl.style.left = left + 'px';
    barEl.style.top = top + 'px';
    barEl.style.display = 'flex';
  }

  function wireEvents() {
    document.addEventListener('mouseup', function (e) {
      if (e.target && (e.target.closest('#lh-hl-bar') || e.target.closest('#lh-hl-pop'))) return;
      setTimeout(handleSelectionCheck, 15);
    });
    document.addEventListener('touchend', function (e) {
      if (e.target && (e.target.closest('#lh-hl-bar') || e.target.closest('#lh-hl-pop'))) return;
      setTimeout(handleSelectionCheck, 180);
    });
    document.addEventListener('mousedown', function (e) {
      if (e.target && !e.target.closest('#lh-hl-bar')) hideBar();
      if (e.target && !e.target.closest('#lh-hl-pop') && !e.target.closest('mark.lh-hl')) hidePop();
    });

    /* 颜色选择与加批注 */
    barEl.querySelectorAll('[data-hl-pick]').forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      btn.addEventListener('click', function () { createHighlight(btn.getAttribute('data-hl-pick'), false); });
    });
    document.getElementById('lhHlNoteBtn').addEventListener('mousedown', function (e) { e.preventDefault(); });
    document.getElementById('lhHlNoteBtn').addEventListener('click', function () { createHighlight('yellow', true); });

    /* 点击已有高光弹出编辑卡 */
    document.addEventListener('click', function (e) {
      var mk = e.target && e.target.closest ? e.target.closest('mark.lh-hl') : null;
      if (!mk) return;
      var sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length >= 2) return;
      e.stopPropagation();
      hideBar();
      openPopoverForMark(mk);
    });

    /* 悬停显示批注气泡 */
    document.addEventListener('mouseover', function (e) {
      var mk = e.target && e.target.closest ? e.target.closest('mark.lh-hl[data-has-note="1"]') : null;
      if (!mk) { if (tipEl) tipEl.style.display = 'none'; return; }
      var note = mk.getAttribute('data-hl-note') || '';
      if (!note) return;
      var r = mk.getBoundingClientRect();
      tipEl.textContent = '📝 ' + note;
      tipEl.style.left = Math.max(12, Math.min(window.innerWidth - 270, r.left)) + 'px';
      tipEl.style.top = Math.max(12, r.top - 42) + 'px';
      tipEl.style.display = 'block';
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target && e.target.closest && e.target.closest('mark.lh-hl')) {
        if (tipEl) tipEl.style.display = 'none';
      }
    });

    /* 弹窗内：换色 / 保存批注 / 擦除 */
    popEl.querySelectorAll('[data-pop-color]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!activePopId) return;
        var col = btn.getAttribute('data-pop-color');
        try {
          await apiPostAnnotation({ action: 'update', id: activePopId, color: col });
          if (annotationsMap[activePopId]) annotationsMap[activePopId].color = col;
          document.querySelectorAll('mark.lh-hl[data-hl-id="' + CSS.escape(activePopId) + '"]').forEach(function (m) {
            m.className = 'lh-hl lh-hl-' + col;
            m.setAttribute('data-hl-color', col);
          });
          notify('已切换高光颜色');
        } catch (ex) { notify(ex.message || '切换失败'); }
      });
    });

    document.getElementById('lhPopSave').addEventListener('click', async function () {
      if (!activePopId) return;
      var note = document.getElementById('lhPopNote').value.trim();
      try {
        await apiPostAnnotation({ action: 'update', id: activePopId, note: note, kind: note ? 'note' : 'highlight' });
        if (annotationsMap[activePopId]) annotationsMap[activePopId].note = note;
        document.querySelectorAll('mark.lh-hl[data-hl-id="' + CSS.escape(activePopId) + '"]').forEach(function (m) {
          if (note) { m.setAttribute('data-has-note', '1'); m.setAttribute('data-hl-note', note); }
          else { m.removeAttribute('data-has-note'); m.removeAttribute('data-hl-note'); }
        });
        hidePop();
        notify('批注已保存到云端');
      } catch (ex) { notify(ex.message || '保存失败'); }
    });

    document.getElementById('lhPopDel').addEventListener('click', async function () {
      if (!activePopId) return;
      var delId = activePopId;
      hidePop();
      try {
        await apiPostAnnotation({ action: 'delete', id: delId });
        delete annotationsMap[delId];
        unwrapHighlight(delId);
        notify('已擦除该高光');
      } catch (ex) { notify(ex.message || '擦除失败'); }
    });

    document.getElementById('lhPopClose').addEventListener('click', hidePop);
  }

  function bootHighlighter() {
    buildUi();
    wireEvents();
    setTimeout(applyHighlights, 350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootHighlighter);
  else bootHighlighter();

  window.LioraHighlighter = {
    refresh: function () { setTimeout(applyHighlights, 120); },
    colors: COLORS
  };
})();
