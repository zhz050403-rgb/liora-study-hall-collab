/* 紧凑双栏「一条龙」中英双语课程学习室（逐行中英概念、全单元必考大题、797张图解速览、高清灯箱、3档背诵切换） */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* 清洗旧 HTML 里重复打印的主标题与多余大横幅，保证页面只有 1 个干净标题 */
  function cleanNoteHtml(raw) {
    if (!raw) return '<p style="color:var(--muted)">本周笔记整理中。</p>';
    return String(raw)
      .replace(/<div[^>]*class="[^"]*(?:note-head|wp-banner|notes-banner)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  }

  function applyKatex(el) {
    if (!el || typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'svg'],
        throwOnError: false
      });
    } catch (e) {}
  }

  /* 提取本节小标题（兼容新折叠专题卡 .ed-topic-acc 与传统 h2/h3/h4），供「知识点目录」与「思维导图」使用 */
  function extractHeadings(container) {
    var list = [];
    if (!container) return list;
    var accs = container.querySelectorAll('details.ed-topic-acc');
    if (accs.length) {
      accs.forEach(function (det, i) {
        var span = det.querySelector('.ed-topic-acc-title > span:last-child');
        var txt = (span ? span.textContent : det.querySelector('summary')?.textContent || '').trim();
        if (!txt) return;
        var id = det.id || ('kp-' + i);
        det.id = id;
        list.push({ id: id, text: txt.slice(0, 56) });
      });
      return list;
    }
    container.querySelectorAll('h2, h3, h4.kp-h').forEach(function (h, i) {
      var txt = (h.textContent || '').trim();
      if (!txt) return;
      var id = 'kp-' + i;
      h.id = id;
      list.push({ id: id, text: txt.slice(0, 56) });
    });
    return list;
  }

  /* 全屏高清图解放大灯箱（支持 SVG 矢量无损放大与图片高清查看） */
  function openLightbox(targetEl, captionText) {
    var existing = document.getElementById('edLightbox');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'edLightbox';
    overlay.className = 'ed-lightbox';

    var card = document.createElement('div');
    card.className = 'ed-lightbox-card';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'ed-lightbox-close';
    closeBtn.textContent = '✕ 关闭 (Esc)';
    card.appendChild(closeBtn);

    var mediaWrap = document.createElement('div');
    mediaWrap.style.marginTop = '8px';
    if (targetEl.tagName.toLowerCase() === 'svg') {
      var clone = targetEl.cloneNode(true);
      clone.removeAttribute('width');
      clone.removeAttribute('height');
      mediaWrap.appendChild(clone);
    } else if (targetEl.tagName.toLowerCase() === 'img') {
      var img = document.createElement('img');
      img.src = targetEl.currentSrc || targetEl.src;
      img.alt = targetEl.alt || '';
      mediaWrap.appendChild(img);
    }
    card.appendChild(mediaWrap);

    if (captionText) {
      var cap = document.createElement('p');
      cap.style.cssText = 'margin:12px 0 0;font-size:13.5px;color:#475a70;line-height:1.55';
      cap.textContent = captionText;
      card.appendChild(cap);
    }

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    function close() {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
  }

  /* 自动收集本周全部图解（核心笔记 + 课后答案解析），绑定点击放大并生成顶部速览条 */
  function wireVisuals(rootEl, stripHost) {
    var visuals = [];
    var seen = new Set();

    function labelFor(container, media, idx, sourceTag) {
      var cap = container.querySelector('.cap, figcaption');
      var txt = cap ? (cap.textContent || '').trim() : '';
      if (!txt) txt = media.getAttribute('aria-label') || media.getAttribute('alt') || '';
      if (!txt) {
        var prev = container.previousElementSibling;
        while (prev && !/^H[2-5]$/i.test(prev.tagName)) prev = prev.previousElementSibling;
        if (prev) txt = (prev.textContent || '').trim();
      }
      txt = txt.replace(/^图解[：:]\s*/, '').replace(/\s+/g, ' ').trim();
      if (!txt) txt = (sourceTag ? sourceTag + ' ' : '') + '图解 ' + (idx + 1);
      return txt.slice(0, 34);
    }

    var zones = [
      { el: rootEl.querySelector('#edNoteBody'), tag: '' },
      { el: rootEl.querySelector('#edTutBody'), tag: '解析' }
    ];

    zones.forEach(function (z) {
      if (!z.el) return;
      z.el.querySelectorAll('svg, img').forEach(function (media) {
        if (seen.has(media)) return;
        seen.add(media);
        var host = media.closest('.diagram, figure.cfig, figure') || media;
        var idx = visuals.length;
        var id = 'ed-fig-' + idx;
        if (!host.id) host.id = id;
        var label = labelFor(host, media, idx, z.tag);
        var capEl = host.querySelector('.cap, figcaption');
        var fullCap = (capEl && capEl.textContent.trim()) || media.getAttribute('aria-label') || media.getAttribute('alt') || label;

        visuals.push({ id: host.id, label: label, tag: z.tag, host: host, media: media, fullCap: fullCap });

        host.style.cursor = 'zoom-in';
        host.addEventListener('click', function (e) {
          if (e.target && e.target.closest('a')) return;
          e.preventDefault();
          openLightbox(media, fullCap);
        });
      });
    });

    if (!stripHost) return visuals.length;
    if (!visuals.length) {
      stripHost.innerHTML = '';
      return 0;
    }

    var INITIAL_SHOW = 8;
    var expanded = false;

    function renderStrip() {
      var list = expanded ? visuals : visuals.slice(0, INITIAL_SHOW);
      stripHost.innerHTML =
        '<div class="ed-fig-strip">' +
          '<div class="ed-fig-strip-head">' +
            '<span><b>📊 本周图解速览（共 ' + visuals.length + ' 张）</b> · 点击标签直达对应图解，点图可高清放大</span>' +
            (visuals.length > INITIAL_SHOW
              ? '<button type="button" class="ed-btn ed-btn-sm" id="edFigToggle">' + (expanded ? '收起部分标签' : '展开全部 ' + visuals.length + ' 张图解') + '</button>'
              : '') +
          '</div>' +
          '<div class="ed-fig-chips">' +
            list.map(function (v, i) {
              var badge = v.tag ? ('[' + v.tag + '] ') : '';
              return '<button type="button" class="ed-fig-chip" data-fig-jump="' + esc(v.id) + '">' +
                '<span style="color:var(--gold-deep);font-weight:700">图 ' + (i + 1) + '</span>' +
                '<span>' + esc(badge + v.label) + '</span>' +
              '</button>';
            }).join('') +
          '</div>' +
        '</div>';

      var tgl = stripHost.querySelector('#edFigToggle');
      if (tgl) tgl.addEventListener('click', function () { expanded = !expanded; renderStrip(); });

      stripHost.querySelectorAll('[data-fig-jump]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = document.getElementById(btn.getAttribute('data-fig-jump'));
          if (!target) return;
          var det = target.closest('details');
          while (det) {
            det.open = true;
            det = det.parentElement ? det.parentElement.closest('details') : null;
          }
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.remove('ed-fig-pulse');
          void target.offsetWidth;
          target.classList.add('ed-fig-pulse');
        });
      });
    }

    renderStrip();
    return visuals.length;
  }

  /* 精准考点词填空：只遮盖真正的专业术语、定义关键词与公式，绝不随机乱遮 */
  function escRe(s) { return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function makeClozeEn(text, term, glossTerms) {
    var escaped = esc(text);
    var targets = [];
    /* 1. 提取当前概念标题中的英文核心术语（括号前部分） */
    var enHead = String(term || '').replace(/[（(][^）)]*[）)]/g, ' ').trim();
    enHead.split(/\s*(?:vs\.?|&|\/|,|and|\+)\s*/i).forEach(function (part) {
      var p = part.trim();
      if (p.length >= 3 && /^[A-Za-z]/.test(p)) targets.push(p);
    });
    /* 2. 加入本周术语表中的英文专业术语 */
    (glossTerms || []).forEach(function (g) {
      var t = String(g && g.term || '').trim();
      if (t.length >= 3 && /^[A-Za-z]/.test(t)) targets.push(t);
    });
    /* 去重并按长度降序优先匹配完整词组 */
    var seen = {};
    targets = targets.filter(function (x) {
      var k = x.toLowerCase();
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    }).sort(function (a, b) { return b.length - a.length; });

    var count = 0;
    targets.forEach(function (kw) {
      if (count >= 4) return;
      var re = new RegExp('(?<!<[^>]*)\\b(' + escRe(kw) + ')\\b', 'i');
      if (re.test(escaped)) {
        escaped = escaped.replace(re, '<span class="ed-cloze-blank" title="点击翻开英文考点词">$1</span>');
        count++;
      }
    });
    /* 3. 若句中未出现标题原词，兜底只遮盖专业缩写/公式（如 GDP / PED / MR = MC / XLOOKUP） */
    if (count === 0) {
      escaped = escaped.replace(/\b([A-Z]{2,}(?:\s*=\s*[A-Z]{2,})?)\b/g, function (m) {
        if (count >= 3) return m;
        count++;
        return '<span class="ed-cloze-blank" title="点击翻开英文缩写/公式">' + m + '</span>';
      });
    }
    return escaped;
  }

  function makeClozeZh(text, term) {
    var escaped = esc(text);
    var count = 0;
    /* 1. 优先遮盖当前概念的中文专业术语（来自标题括号内中文，绝不遮中文句里的英文词） */
    var zhMatch = String(term || '').match(/[（(]([^）)]+)[）)]/);
    if (zhMatch && zhMatch[1]) {
      zhMatch[1].split(/[、，,\/与及和\s]+/).forEach(function (part) {
        var p = part.trim();
        if (p.length >= 2 && /[\u4e00-\u9fa5]/.test(p) && !/[A-Za-z]/.test(p) && count < 3) {
          var idx = escaped.indexOf(p);
          if (idx >= 0) {
            escaped = escaped.slice(0, idx) + '<span class="ed-cloze-blank" title="点击翻开中文核心概念">' + p + '</span>' + escaped.slice(idx + p.length);
            count++;
          }
        }
      });
    }
    /* 2. 遮盖中文「…」内标注的核心定义词（仅纯中文） */
    escaped = escaped.replace(/「([\u4e00-\u9fa5]{2,14})」/g, function (full, inner) {
      if (count >= 4) return full;
      count++;
      return '「<span class="ed-cloze-blank" title="点击翻开中文要点">' + inner + '</span>」';
    });
    /* 3. 若仍未命中，遮盖「是指/等于/核心是/分为/包括」紧跟的纯中文核心短语 */
    if (count === 0) {
      escaped = escaped.replace(/(是指|指的是|即|本质是|核心是|等于|包括|分为)([\u4e00-\u9fa5]{2,12})/, function (full, lead, body) {
        count++;
        return lead + '<span class="ed-cloze-blank" title="点击翻开中文核心定义">' + body + '</span>';
      });
    }
    return escaped;
  }

  /* 渲染「核心概念中英逐行精讲」可折叠逐卡阅读区（ADHD 友好：默认全部收起，点一条看一条，支持微进度勾选与分点逐条展开） */
  function renderBilingualConcepts(concepts, isCloze, isRecall, glossTerms, opts) {
    if (!concepts || !concepts.length) return '';
    opts = opts || {};
    var adhdOn = opts.adhdMode !== false;
    var singleFocus = opts.singleFocus !== false;
    var courseId = opts.courseId || '';
    var termId = opts.termId || '';
    var weekNum = opts.weekNum || 1;
    var doneCnt = 0;
    concepts.forEach(function (c, i) {
      if (window.LioraStore && window.LioraStore.isTaskDone(courseId + ':' + termId + ':' + weekNum + ':bc' + i)) doneCnt++;
    });
    var pct = Math.round((doneCnt / concepts.length) * 100);

    return '<div class="bi-concept-wrap" id="edBiConcepts">' +
      '<div class="bi-concept-banner" style="flex-direction:column;align-items:stretch;gap:8px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
          '<h3 style="margin:0">📌 核心概念与分点精讲 · Core Concepts（共 ' + concepts.length + ' 项）</h3>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
            '<label style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--navy-800);cursor:pointer;font-weight:600"><input type="checkbox" id="edSingleFocusChk"' + (singleFocus ? ' checked' : '') + '> 🎯 一次只开一张</label>' +
            '<button type="button" class="ed-btn ed-btn-sm" id="edBiExpandAll">📂 全部展开</button>' +
            '<button type="button" class="ed-btn ed-btn-sm" id="edBiCollapseAll">📁 全部收起</button>' +
          '</div>' +
        '</div>' +
        '<div class="bi-mini-prog">' +
          '<span style="font-size:12px;color:var(--muted);white-space:nowrap">本节概念已搞懂 <b style="color:var(--green)">' + doneCnt + ' / ' + concepts.length + '</b></span>' +
          '<div class="bi-mini-bar"><i style="width:' + pct + '%"></i></div>' +
          '<span style="font-size:12px;color:var(--muted);white-space:nowrap">' + (adhdOn ? '点击任意标题逐条展开，不堆满屏幕' : '上行英文规范句 · 下行中文精解') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="bi-concept-list">' +
        concepts.map(function (c, i) {
          var isOfficial = /课件原话|真题|官方核心文本|Lecture Slides/.test(c.src || '');
          var enHtml = (isCloze && !isRecall) ? makeClozeEn(c.en, c.term, glossTerms) : esc(c.en);
          var zhHtml = isCloze ? makeClozeZh(c.zh, c.term) : esc(c.zh);
          var bcKey = courseId + ':' + termId + ':' + weekNum + ':bc' + i;
          var isDone = window.LioraStore && window.LioraStore.isTaskDone(bcKey);
          var hasBullets = Array.isArray(c.bullets) && c.bullets.length > 0;
          var bulletsHtml = '';
          if (hasBullets) {
            bulletsHtml = '<div class="bi-bullets">' +
              '<div style="font-size:12px;color:var(--muted);margin-bottom:2px">👇 共 ' + c.bullets.length + ' 条明细，点哪一条展开哪一条（可一次看一条，不眼花）：</div>' +
              c.bullets.map(function (b) {
                var bEn = (isCloze && !isRecall) ? makeClozeEn(b.en, b.label, glossTerms) : esc(b.en);
                var bZh = isCloze ? makeClozeZh(b.zh, b.label) : esc(b.zh);
                return '<details class="bi-bullet-acc"' + (adhdOn ? '' : ' open') + '>' +
                  '<summary>' + esc(b.label) + '</summary>' +
                  '<div class="bi-bullet-body">' +
                    '<div class="bi-pair">' +
                      '<div class="bi-en">🇬🇧 ' + bEn + '</div>' +
                      '<div class="bi-zh">🇨🇳 ' + bZh + '</div>' +
                    '</div>' +
                  '</div>' +
                '</details>';
              }).join('') +
            '</div>';
          }
          /* ADHD 舒缓模式下默认全部收起，点一个看一个；切回标准模式才全部展开 */
          var openAttr = adhdOn ? '' : ' open';
          return '<details class="bi-concept-card bi-concept-acc' + (isDone ? ' is-done' : '') + '" id="bi-item-' + i + '"' + openAttr + '>' +
            '<summary>' +
              '<span class="bi-acc-left">' +
                '<span class="bi-acc-arrow">▸</span>' +
                '<span class="bi-concept-term">' + (i + 1) + '. ' + esc(c.term) + '</span>' +
              '</span>' +
              '<span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
                (hasBullets ? '<span class="ed-badge ed-badge-gold">' + c.bullets.length + ' 条明细</span>' : '') +
                (c.src ? '<span class="bi-src-badge' + (isOfficial ? ' official' : '') + '">' + (isOfficial ? '✓ ' : '') + esc(c.src) + '</span>' : '') +
                '<button type="button" class="bi-done-btn' + (isDone ? ' done' : '') + '" data-bc-done="' + esc(bcKey) + '">' + (isDone ? '✓ 已搞懂' : '○ 看懂了') + '</button>' +
              '</span>' +
            '</summary>' +
            '<div class="bi-acc-body">' +
              '<div class="bi-pair">' +
                '<div class="bi-en">🇬🇧 ' + enHtml + '</div>' +
                '<div class="bi-zh">🇨🇳 ' + zhHtml + '</div>' +
              '</div>' +
              bulletsHtml +
            '</div>' +
          '</details>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* 将 week.notesHtml 中的双语段落/要点拆分成严格「上行英文 .bi-en + 下行中文 .bi-zh」结构化卡片 */
  function splitEnZhText(plainText) {
    var s = String(plainText || '').replace(/\s+/g, ' ').trim();
    if (!s) return { en: '', zh: '' };
    var firstZh = s.search(/[\u4e00-\u9fa5]/);
    if (firstZh < 0) return { en: s, zh: '' };
    if (firstZh === 0) return { en: '', zh: s };
    /* 往前寻找紧贴中文前的英文句末标点（. ! ?）作为最自然的双语分界点 */
    var prefix = s.slice(0, firstZh);
    var splitAt = -1;
    var lastDot = Math.max(prefix.lastIndexOf('. '), prefix.lastIndexOf('? '), prefix.lastIndexOf('! '));
    if (lastDot >= 12) {
      splitAt = lastDot + 1;
    } else if (prefix.trim().length >= 18) {
      /* 若没有句号但前半段主要是英文，也在中文起点处切开 */
      splitAt = firstZh;
      /* 如果中文紧跟在 "（" 后面且前面有个短英文词（如 "<strong>law of demand</strong>（需求定律）"），退回到前一句末 */
      var parenCut = prefix.lastIndexOf('(');
      if (parenCut > 12 && prefix.length - parenCut < 24) splitAt = firstZh;
    }
    if (splitAt > 0) {
      return { en: s.slice(0, splitAt).trim(), zh: s.slice(splitAt).trim() };
    }
    return { en: '', zh: s };
  }

  function renderStructuredBilingualNotes(notesHtml, isCloze, isRecall, glossTerms, adhdOn) {
    if (!notesHtml || !String(notesHtml).trim()) return '';
    var tmp = document.createElement('div');
    tmp.innerHTML = notesHtml;
    var sections = [];
    var cur = null;

    Array.prototype.slice.call(tmp.childNodes).forEach(function (node) {
      if (node.nodeType !== 1) return;
      var tag = node.tagName;
      if (/^H[234]$/.test(tag)) {
        cur = { title: node.textContent.replace(/\s+/g, ' ').trim(), items: [] };
        sections.push(cur);
      } else {
        if (!cur) {
          cur = { title: '双语笔记要点 · Bilingual Notes', items: [] };
          sections.push(cur);
        }
        if (tag === 'UL' || tag === 'OL') {
          node.querySelectorAll('li').forEach(function (li) {
            var txt = li.textContent.replace(/\s+/g, ' ').trim();
            if (txt.length > 4) cur.items.push(splitEnZhText(txt));
          });
        } else {
          var ptxt = node.textContent.replace(/\s+/g, ' ').trim();
          if (ptxt.length > 4) cur.items.push(splitEnZhText(ptxt));
        }
      }
    });

    sections = sections.filter(function (s) { return s.items.length > 0; });
    if (!sections.length) return '';

    return '<div class="ed-bi-notes-wrap" id="edBiNotes">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<h3 style="margin:0;font-family:var(--serif);font-size:16px;color:var(--navy-900)">🌐 本周双语结构化精讲 · Bilingual Notes（点击小节逐块展开）</h3>' +
        '<div style="display:flex;gap:6px">' +
          '<button type="button" class="ed-btn ed-btn-sm" id="edBnExpandAll">展开全部</button>' +
          '<button type="button" class="ed-btn ed-btn-sm" id="edBnCollapseAll">收起全部</button>' +
        '</div>' +
      '</div>' +
      sections.map(function (sec, si) {
        var rowsHtml = sec.items.map(function (it) {
          var enOut = it.en ? ((isCloze && !isRecall) ? makeClozeEn(it.en, sec.title, glossTerms) : esc(it.en)) : '';
          var zhOut = it.zh ? (isCloze ? makeClozeZh(it.zh, sec.title) : esc(it.zh)) : '';
          return '<div class="bi-pair">' +
            (enOut ? '<div class="bi-en">🇬🇧 ' + enOut + '</div>' : '') +
            (zhOut ? '<div class="bi-zh">🇨🇳 ' + zhOut + '</div>' : '') +
          '</div>';
        }).join('');
        /* ADHD 舒缓模式下默认收起，避免一次扑面而来几十行字 */
        var openAttr = adhdOn ? '' : ' open';
        return '<details class="ed-bi-notes-sec" id="bi-note-sec-' + si + '"' + openAttr + '>' +
          '<summary><span>' + esc(sec.title) + '</span><span class="ed-badge">' + sec.items.length + ' 条 · 点开阅读</span></summary>' +
          '<div class="ed-bi-notes-body">' + rowsHtml + '</div>' +
        '</details>';
      }).join('') +
    '</div>';
  }

  /* 将长篇 graphicHtml 按 <h4 class="kp-h"> 自动拆分为清晰可折叠的专题卡片（ADHD 舒缓模式下默认全部收起，按需逐个打开） */
  function formatGraphicIntoAccordions(rawHtml, weekTitle, adhdOn) {
    if (!rawHtml || !String(rawHtml).trim()) return '';
    var parts = String(rawHtml).split(/(?=<h4\b[^>]*>)/i).filter(function (s) { return s.trim().length > 0; });
    if (parts.length <= 1) return rawHtml;

    var hasLaterLecture = parts.some(function (p) { return /Lecture|讲座|需求|供给|均衡|弹性|核心/i.test(p.slice(0, 180)); });
    var secNum = 0;
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin:14px 0 10px">' +
        '<h3 style="margin:0;font-family:var(--serif);font-size:16px;color:var(--navy-900)">📊 图解推导与课堂例题精讲（按专题折叠，点哪节看哪节）</h3>' +
        '<div style="display:flex;gap:6px">' +
          '<button type="button" class="ed-btn ed-btn-sm" id="edAccExpandAll">展开全部</button>' +
          '<button type="button" class="ed-btn ed-btn-sm" id="edAccCollapseAll">折叠全部</button>' +
        '</div>' +
      '</div>' +
      parts.map(function (chunk) {
        var hm = chunk.match(/^<h4\b[^>]*>([\s\S]*?)<\/h4>/i);
        if (!hm) return '<div class="ed-card" style="margin-bottom:12px">' + chunk + '</div>';
        var title = hm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        var body = chunk.slice(hm[0].length);
        var figs = (body.match(/<svg\b|<img\b/gi) || []).length;
        var exs = (body.match(/<details\b/gi) || []).length;
        var isGuide = /本周导览|自测清单/.test(title);
        var isPrevTut = hasLaterLecture && /Tutorial/i.test(title) && secNum <= 2;
        secNum++;
        var openAttr = adhdOn ? '' : ((isGuide || isPrevTut) ? '' : ' open');
        var badges = '';
        if (isPrevTut) badges += '<span class="ed-badge ed-badge-gold">上单元 Tutorial 解析</span>';
        if (figs) badges += '<span class="ed-badge">📊 ' + figs + ' 图</span>';
        if (exs) badges += '<span class="ed-badge">📝 ' + exs + ' 例题</span>';
        return '<details class="ed-topic-acc" id="ed-acc-' + secNum + '"' + openAttr + '>' +
          '<summary>' +
            '<span class="ed-topic-acc-title"><span class="ed-topic-acc-num">§' + secNum + '</span><span>' + esc(title) + '</span></span>' +
            '<span style="display:flex;gap:5px;flex-wrap:wrap">' + badges + '</span>' +
          '</summary>' +
          '<div class="ed-topic-acc-body">' + body + '</div>' +
        '</details>';
      }).join('');
  }

  /* 渲染「本单元必考大题与中英对照标准答案」专区 */
  function renderExamQA(qaList) {
    if (!qaList || !qaList.length) return '';
    return '<div id="sec-exam-qa" class="ed-stage-head" style="background:linear-gradient(90deg,#1d4374 0%,#7a5818 100%)">' +
      '<h2>🎯 本单元必考大题与标准答案（中英对照 · 共 ' + qaList.length + ' 题）</h2>' +
      '<span class="sub">先看题自己想思路，再展开核对英文高分踩分句与中文解析</span>' +
    '</div>' +
    '<div class="ed-exam-qa">' +
      qaList.map(function (q, idx) {
        var ptsHtml = (q.points || []).map(function (p, pi) {
          return '<div class="bi-pair">' +
            '<div class="bi-en"><b>(' + (pi + 1) + ') 🇬🇧</b> ' + esc(p.en) + '</div>' +
            '<div class="bi-zh">🇨🇳 ' + esc(p.zh) + '</div>' +
          '</div>';
        }).join('');
        var kwHtml = (q.keywords && q.keywords.length)
          ? '<div class="ed-qa-kws"><span>🔑 英文采分关键词：</span>' + q.keywords.map(function (k) {
              return '<span class="ed-qa-kw">' + esc(k) + '</span>';
            }).join('') + '</div>'
          : '';
        return '<div class="ed-qa-card" id="qa-item-' + idx + '">' +
          '<div class="ed-qa-top">' +
            '<span class="ed-qa-num">必考大题 Q' + (idx + 1) + '</span>' +
            (q.tag ? '<span class="ed-qa-tag">' + esc(q.tag) + '</span>' : '') +
          '</div>' +
          '<div class="ed-qa-q-en">🇬🇧 ' + esc(q.qEn) + '</div>' +
          '<div class="ed-qa-q-zh">🇨🇳 ' + esc(q.qZh) + '</div>' +
          '<details class="ed-qa-details">' +
            '<summary>▶ 点击展开中英对照高分标准答案与采分点</summary>' +
            '<div class="ed-qa-points">' + ptsHtml + '</div>' +
            kwHtml +
            '<div class="ed-qa-foot">' +
              '<button type="button" class="ed-btn ed-btn-sm ed-btn-gold" data-qa-save="' + idx + '">➕ 没答全，收入遗忘曲线错题本</button>' +
            '</div>' +
          '</details>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  /* 找相邻周（支持跨 Term 无缝衔接） */
  function findAdjacentWeeks(course, curTermId, curWeekNum) {
    var flat = [];
    (course.terms || []).forEach(function (t) {
      (t.weeks || []).forEach(function (w) {
        flat.push({ termId: t.id, termName: t.name || t.id, num: w.num, title: w.title || ('Week ' + w.num) });
      });
    });
    var idx = flat.findIndex(function (x) { return x.termId === curTermId && Number(x.num) === Number(curWeekNum); });
    return {
      prev: idx > 0 ? flat[idx - 1] : null,
      next: (idx >= 0 && idx < flat.length - 1) ? flat[idx + 1] : null
    };
  }

  async function renderCourse(app, courseId, termId, weekNum) {
    app.innerHTML = '<div class="ed-container"><div class="ed-card">正在按需加载课程数据…</div></div>';
    var course;
    try {
      course = await window.LioraStore.loadCourse(courseId);
    } catch (e) {
      app.innerHTML = '<div class="ed-container"><div class="ed-card">无法加载课程：' + esc(courseId) + ' · <a href="#/courses">返回课程中心</a></div></div>';
      return;
    }

    var terms = course.terms || [];
    var term = terms.find(function (t) { return t.id === termId; }) || terms[0];
    if (!term) return;
    var weeks = term.weeks || [];
    var week = weeks.find(function (w) { return Number(w.num) === Number(weekNum); }) || weeks[0];
    if (!week) return;

    var route = '#/c/' + course.id + '/' + term.id + '/' + week.num;
    window.LioraStore.setLastVisit(route, (course.nameCn || course.id) + ' · ' + (week.title || 'Week ' + week.num));

    var noteMode = 'full';   // full | mindmap | cloze | outline
    var biMode = 'both';     // both | en | recall
    var adhdMode = true;
    var singleFocus = true;
    try {
      if (localStorage.getItem('liora-adhd-mode') === '0') adhdMode = false;
      if (localStorage.getItem('liora-single-focus') === '0') singleFocus = false;
    } catch (e) {}
    var api = window.LioraStudyApi;
    var st = await api.loadStudy();
    var adj = findAdjacentWeeks(course, term.id, week.num);

    function draw() {
      var weekDone = window.LioraStore.isWeekDone(course.id, term.id, week.num);
      var weekAnns = (st.annotations || []).filter(function (a) { return a.route === route; });
      var biConcepts = week.bilingualConcepts || [];
      var qaList = week.examQA || [];

      var termPills = terms.length > 1 ? (
        '<div class="ed-term-pills">' + terms.map(function (t) {
          var firstW = (t.weeks && t.weeks[0]) ? t.weeks[0].num : 1;
          return '<button class="ed-term-pill' + (t.id === term.id ? ' active' : '') + '" data-goto="#/c/' + esc(course.id) + '/' + esc(t.id) + '/' + firstW + '">' + esc(t.name || t.id) + '</button>';
        }).join('') + '</div>'
      ) : '';

      var weekListHtml = weeks.map(function (w) {
        var isCur = Number(w.num) === Number(week.num);
        var isDone = window.LioraStore.isWeekDone(course.id, term.id, w.num);
        var dCnt = Number(w.diagramCount) || 0;
        return '<button class="ed-week-btn' + (isCur ? ' active' : '') + (isDone ? ' done' : '') + '" data-goto="#/c/' + esc(course.id) + '/' + esc(term.id) + '/' + w.num + '">' +
          '<span class="ed-week-num">' + (isDone ? '✓' : 'W' + w.num) + '</span>' +
          '<span style="flex:1">' + esc((w.title || ('Week ' + w.num)).replace(/^Week\s*\d+\s*[·\-—]?\s*/i, '')) + '</span>' +
          (dCnt > 0 ? '<span class="ed-week-fig-tag">图' + dCnt + '</span>' : '') +
        '</button>';
      }).join('');

      var rawHtml = cleanNoteHtml(week.graphicHtml || week.notesHtml);

      var tasks = week.tasks || [];
      var tasksHtml = tasks.length ? tasks.map(function (t, i) {
        var tKey = course.id + ':' + term.id + ':' + week.num + ':t' + i;
        var tDone = window.LioraStore.isTaskDone(tKey);
        var txt = typeof t === 'string' ? t : (t.text || t.title || '');
        return '<label style="display:flex;align-items:flex-start;gap:10px;padding:9px 10px;border-bottom:1px solid var(--line-2);cursor:pointer">' +
          '<input type="checkbox" data-task-key="' + esc(tKey) + '"' + (tDone ? ' checked' : '') + ' style="width:17px;height:17px;margin-top:2px;accent-color:var(--navy-800)">' +
          '<span style="flex:1;' + (tDone ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(txt) + '</span>' +
        '</label>';
      }).join('') : '<p style="color:var(--muted);font-size:13.5px;margin:0">本周暂无额外打卡任务，直接精读双语概念、图解与必考大题即可。</p>';

      var tutHtml = week.tutorialAnswers
        ? (typeof week.tutorialAnswers === 'string' ? week.tutorialAnswers : JSON.stringify(week.tutorialAnswers))
        : '<p style="color:var(--muted);margin:0">本周暂无独立课后答案，可先刷上方「本单元必考大题」或前往「多科闭卷刷题」。</p>';

      var onlinePdfs = week.onlineSources || [];
      var gloss = week.glossary || [];
      var offlineFiles = week.files || [];

      var biCls = (biMode === 'en' ? ' ed-bi-en-only' : (biMode === 'recall' ? ' ed-bi-recall' : '')) + (adhdMode ? ' ed-adhd' : '');

      app.innerHTML = '<div class="ed-container">' +
        '<div class="ed-study-layout">' +
          '<aside class="ed-sidebar">' +
            '<div class="ed-sidebar-title">' + esc(course.nameCn || course.name) + '</div>' +
            termPills +
            '<div class="ed-week-list">' + weekListHtml + '</div>' +
          '</aside>' +
          '<section class="ed-main-col' + biCls + '">' +
            '<div class="ed-crumb"><a href="#/courses">课程中心</a> <span>›</span> <span>' + esc(course.nameCn) + '</span> <span>›</span> <span>' + esc(term.name || term.id) + '</span></div>' +
            '<div class="ed-page-head">' +
              '<h1>' + esc(week.title || ('Week ' + week.num)) + '</h1>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                '<button id="edToggleDoneTop" class="ed-btn ed-btn-sm ' + (weekDone ? 'ed-btn-primary' : '') + '">' + (weekDone ? '✓ 已学完本周' : '○ 标记本周学完') + '</button>' +
                '<button id="edAddNoteBtn" class="ed-btn ed-btn-sm ed-btn-gold">🖍️ 记批注</button>' +
              '</div>' +
            '</div>' +

            /* 吸顶「一条龙」顺滑导航条（打卡置顶，课后解析保留在原位置，中英视频一点直接进入视频页） */
            '<div class="ed-step-bar">' +
              '<button type="button" class="ed-step-pill active" data-sec="sec-checklist">✅ 本周打卡</button>' +
              '<button type="button" class="ed-step-pill" data-sec="sec-figs">📊 本周图解 <span id="edFigCountBadge">' + (Number(week.diagramCount) || 0) + '</span></button>' +
              '<button type="button" class="ed-step-pill" data-sec="sec-notes">📖 概念与笔记</button>' +
              (qaList.length ? '<button type="button" class="ed-step-pill" data-sec="sec-exam-qa">🎯 必考大题 ' + qaList.length + '</button>' : '') +
              '<button type="button" class="ed-step-pill" data-sec="sec-tutorial">📝 课后解析</button>' +
              '<button type="button" class="ed-step-pill" data-sec="sec-resources">📄 课件与术语</button>' +
              '<a class="ed-step-pill" href="bilingual-video.html?course=' + esc(course.id) + ((course.id === 'computing' || course.id === 'english') ? '#lh-extra-videos' : '') + '" style="text-decoration:none">🎬 中英视频 ↗</a>' +
            '</div>' +

            /* 第 1 站（置顶）：仅放本周学习任务打卡清单，清爽直接打勾 */
            '<div id="sec-checklist" class="ed-card" style="margin:6px 0 14px;border-left:4px solid var(--gold)">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
                '<h3 style="margin:0;font-family:var(--serif);font-size:15.5px;color:var(--navy-900)">✅ 本周学习任务打卡清单</h3>' +
                '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                  '<a class="ed-btn ed-btn-sm ed-btn-gold" href="#/mistakes">➕ 错题本</a>' +
                  '<a class="ed-btn ed-btn-sm" href="#/exam-packs">🎯 闭卷刷题</a>' +
                '</div>' +
              '</div>' +
              tasksHtml +
            '</div>' +

            /* 本周图解速览 */
            '<div id="sec-figs"></div>' +

            /* 第 2 站：中英逐行核心概念 + 笔记与图解精讲（含恢复的 🧠 思维导图） */
            '<div id="sec-notes" class="ed-stage-head" style="margin-top:6px">' +
              '<h2>📖 核心概念（中英逐行）与图解笔记</h2>' +
              '<span class="sub">英文规范句 → 中文精解 → 图解 → 思维导图，一条龙自然通读</span>' +
            '</div>' +
            '<div class="ed-guide-bar">' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
                '<b style="font-size:12.5px">语言模式：</b>' +
                '<button class="ed-btn ed-btn-sm' + (biMode === 'both' ? ' ed-btn-primary' : '') + '" data-bm="both">🌐 中英对照</button>' +
                '<button class="ed-btn ed-btn-sm' + (biMode === 'en' ? ' ed-btn-primary' : '') + '" data-bm="en">🇬🇧 纯英文</button>' +
                '<button class="ed-btn ed-btn-sm' + (biMode === 'recall' ? ' ed-btn-primary' : '') + '" data-bm="recall">🧠 看中文背英文</button>' +
              '</div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<button class="ed-btn ed-btn-sm' + (adhdMode ? ' ed-btn-gold' : '') + '" id="edToggleAdhd" title="大行距 + 默认全部折叠，一次只看一张卡片，减轻密集文字压迫感">' + (adhdMode ? '🧘 舒缓逐卡：开' : '🧘 舒缓逐卡：关') + '</button>' +
                '<button class="ed-btn ed-btn-sm' + (noteMode === 'full' ? ' ed-btn-primary' : '') + '" data-nm="full">精读全文</button>' +
                '<button class="ed-btn ed-btn-sm' + (noteMode === 'mindmap' ? ' ed-btn-primary' : '') + '" data-nm="mindmap">🧠 思维导图</button>' +
                '<button class="ed-btn ed-btn-sm' + (noteMode === 'cloze' ? ' ed-btn-primary' : '') + '" data-nm="cloze">填空自测</button>' +
                '<button class="ed-btn ed-btn-sm' + (noteMode === 'outline' ? ' ed-btn-primary' : '') + '" data-nm="outline">知识点目录</button>' +
                '<button class="ed-btn ed-btn-sm" onclick="window.print()">🖨️ 打印</button>' +
              '</div>' +
            '</div>' +

            '<div class="ed-inpage-search">' +
              '<span style="font-size:14px">🔍</span>' +
              '<input id="edInPageSearch" type="search" placeholder="在本周笔记中快搜关键词（如 supply / non-price / determinant / 弹性…）" autocomplete="off">' +
              '<span id="edFindCount" style="font-size:12px;color:var(--muted);white-space:nowrap"></span>' +
              '<button type="button" class="ed-btn ed-btn-sm" id="edFindPrev" style="display:none">↑ 上一处</button>' +
              '<button type="button" class="ed-btn ed-btn-sm" id="edFindNext" style="display:none">↓ 下一处</button>' +
              '<button type="button" class="ed-btn ed-btn-sm" id="edFindClear" style="display:none">清除</button>' +
            '</div>' +

            '<div id="edModeSlot"></div>' +

            renderBilingualConcepts(biConcepts, noteMode === 'cloze', biMode === 'recall', gloss, {
              adhdMode: adhdMode,
              singleFocus: singleFocus,
              courseId: course.id,
              termId: term.id,
              weekNum: week.num
            }) +

            renderStructuredBilingualNotes(week.notesHtml, noteMode === 'cloze', biMode === 'recall', gloss, adhdMode) +

            (weekAnns.length ? (
              '<div style="margin-bottom:14px;padding:10px 14px;border-radius:10px;background:var(--navy-050);border:1px solid var(--line);font-size:13px">' +
                '<b>🖍️ 我在本周记过的批注（' + weekAnns.length + ' 条）：</b>' +
                weekAnns.slice(0, 3).map(function (a) {
                  return '<div style="margin-top:4px">• ' + (a.quote ? '<em>「' + esc(a.quote.slice(0, 60)) + '」</em> ' : '') + esc(a.note || '') + '</div>';
                }).join('') +
              '</div>'
            ) : '') +
            '<div id="edNoteBody" class="ed-prose' + (noteMode === 'cloze' ? ' cloze-on' : '') + '">' + formatGraphicIntoAccordions(rawHtml, week.title, adhdMode) + '</div>' +

            /* 必考大题与中英对照标准答案 */
            renderExamQA(qaList) +

            /* 课后作业参考解析（保留在原位置：必考大题下方） */
            '<div id="sec-tutorial" class="ed-stage-head">' +
              '<h2>📝 课后作业参考解析与图解核对</h2>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<a class="ed-btn ed-btn-sm ed-btn-gold" href="#/mistakes">➕ 记入错题本</a>' +
                '<a class="ed-btn ed-btn-sm" style="background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.3)" href="#/exam-packs">🎯 去做本课闭卷刷题</a>' +
              '</div>' +
            '</div>' +
            '<div class="ed-card" style="margin-bottom:14px"><div class="ed-prose" id="edTutBody">' + tutHtml + '</div></div>' +

            /* 第 3 站：站内原件 PDF 与核心中英术语 */
            '<div id="sec-resources" class="ed-stage-head">' +
              '<h2>📄 课件原件与核心中英术语</h2>' +
              '<span class="sub">随学随查原件、背考场术语</span>' +
            '</div>' +
            '<div class="ed-card" style="margin-bottom:14px">' +
              '<h3 style="margin:0 0 10px;font-family:var(--serif);font-size:15.5px;color:var(--navy-900)">📄 本周可在线直达原件（站内已核验 PDF）</h3>' +
              (onlinePdfs.length
                ? '<div style="display:flex;flex-wrap:wrap;gap:8px">' + onlinePdfs.map(function (f) {
                    return '<a class="ed-btn ed-btn-sm ed-btn-primary" target="_blank" rel="noopener" href="' + esc(f.path) + '">📎 ' + esc(f.name) + ' ↗</a>';
                  }).join('') + '</div>'
                : '<p style="font-size:13.5px;color:var(--muted);margin:0">本周核心双语概念、必考大题与例题已完整整理在上方正文中。</p>') +
            '</div>' +
            '<div class="ed-card" style="margin-bottom:14px">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap">' +
                '<h3 style="margin:0;font-family:var(--serif);font-size:15.5px;color:var(--navy-900)">🃏 本周核心中英术语（' + gloss.length + ' 条）</h3>' +
                '<a class="ed-btn ed-btn-sm ed-btn-gold" href="#/flashcards?course=' + esc(course.id) + '&week=' + esc(week.num) + '">去闪卡模式速背本单元 →</a>' +
              '</div>' +
              (gloss.length
                ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px">' + gloss.map(function (g) {
                    return '<div style="padding:10px 12px;border-radius:9px;background:var(--surface-2);border:1px solid var(--line-2)">' +
                      '<div style="font-weight:700;color:var(--navy-900);font-size:13.5px">' + esc(g.term) + '</div>' +
                      '<div style="color:var(--gold-deep);font-size:13px;font-weight:600;margin:2px 0">' + esc(g.zh) + '</div>' +
                      '<div style="font-size:12.5px;color:var(--ink-2)">' + esc(g.def) + '</div>' +
                    '</div>';
                  }).join('') + '</div>'
                : '<p style="font-size:13.5px;color:var(--muted);margin:0">全科 112 条中英核心术语均可直接在「术语闪卡」按学科集中复习。</p>') +
            '</div>' +
            (offlineFiles.length ? (
              '<details class="ed-card" style="margin-bottom:14px"><summary style="cursor:pointer;font-size:13.5px;font-weight:600;color:var(--muted)">本机课程文件夹原始课件清单（' + offlineFiles.length + ' 份 · 仅原电脑离线保存）</summary>' +
              '<ul style="margin:10px 0 0;padding-left:20px;font-size:13px;color:var(--muted)">' + offlineFiles.map(function (f) {
                return '<li>' + esc(f.name || f.title || f.path || '') + '</li>';
              }).join('') + '</ul></details>'
            ) : '') +

            '<div class="ed-card" style="margin-bottom:14px">' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
                '<a class="ed-btn ed-btn-gold" href="#/handbooks/' + esc(course.id) + '">📚 打开本课通关手册（公式/避坑）</a>' +
                (course.id === 'accounting' ? '<a class="ed-btn" href="exam-prep.html">🎯 会计 U1–U6 官方引文闭卷库</a>' : '') +
                (course.id === 'english' ? '<a class="ed-btn" href="english/index.html">🇬🇧 打开英语精读与生词工作台</a>' : '') +
              '</div>' +
            '</div>' +

            /* 底部「一条龙收尾栏」 */
            '<div class="ed-next-bar">' +
              '<div>' +
                (adj.prev
                  ? '<a class="ed-btn ed-btn-sm" href="#/c/' + esc(course.id) + '/' + esc(adj.prev.termId) + '/' + adj.prev.num + '">← 上一周：' + esc(adj.prev.title.slice(0, 18)) + '</a>'
                  : '<a class="ed-btn ed-btn-sm" href="#/courses">← 返回课程中心</a>') +
              '</div>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
                '<button id="edToggleDoneBot" class="ed-btn ' + (weekDone ? 'ed-btn-primary' : 'ed-btn-gold') + '">' + (weekDone ? '✓ 本周已学完' : '✓ 标记本周已学完') + '</button>' +
                (adj.next
                  ? '<a class="ed-btn ed-btn-primary" href="#/c/' + esc(course.id) + '/' + esc(adj.next.termId) + '/' + adj.next.num + '">继续下一周：' + esc(adj.next.title.slice(0, 18)) + ' →</a>'
                  : '<a class="ed-btn ed-btn-primary" href="#/exam-packs">🎓 本课全部学完 · 去模拟刷题 →</a>') +
              '</div>' +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>';

      /* 事件绑定 */
      app.querySelectorAll('[data-goto]').forEach(function (b) {
        b.addEventListener('click', function () { location.hash = b.getAttribute('data-goto'); });
      });
      app.querySelectorAll('[data-nm]').forEach(function (b) {
        b.addEventListener('click', function () { noteMode = b.getAttribute('data-nm'); draw(); });
      });
      app.querySelectorAll('[data-bm]').forEach(function (b) {
        b.addEventListener('click', function () { biMode = b.getAttribute('data-bm'); draw(); });
      });
      app.querySelectorAll('[data-sec]').forEach(function (b) {
        b.addEventListener('click', function () {
          app.querySelectorAll('[data-sec]').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          var target = document.getElementById(b.getAttribute('data-sec'));
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      /* 背诵模式：点击被遮住的英文原句逐句翻开核对 */
      if (biMode === 'recall') {
        app.querySelectorAll('.bi-en, .bi-add').forEach(function (el) {
          el.title = '点击翻开/隐藏英文原句';
          el.addEventListener('click', function () { el.classList.toggle('revealed'); });
        });
      }

      /* 必考大题一键收入遗忘曲线错题本 */
      app.querySelectorAll('[data-qa-save]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var q = qaList[Number(btn.getAttribute('data-qa-save'))];
          if (!q) return;
          var ansText = (q.points || []).map(function (p, i) { return '(' + (i + 1) + ') ' + p.en + '\n' + p.zh; }).join('\n');
          btn.disabled = true;
          btn.textContent = '保存中…';
          try {
            await api.saveMistake({
              course: course.id,
              topic: week.title || ('Week ' + week.num),
              question: q.qEn + '\n' + q.qZh,
              answer: ansText,
              myError: '本单元必考大题自测未完全答出，待按遗忘曲线重背',
              tags: (q.keywords || []).slice(0, 4)
            });
            btn.textContent = '✓ 已收入错题本';
            api.toast('已加入错题本（1/3/7/14天自动提醒复习）');
          } catch (e) {
            btn.disabled = false;
            btn.textContent = '➕ 没答全，收入遗忘曲线错题本';
            api.toast('保存失败，请重试');
          }
        });
      });

      function onToggleDone() {
        var nowDone = window.LioraStore.toggleWeekDone(course.id, term.id, week.num);
        api.toast(nowDone ? '已标记学完本周！' : '已取消完成标记');
        draw();
      }
      var doneTop = document.getElementById('edToggleDoneTop');
      var doneBot = document.getElementById('edToggleDoneBot');
      if (doneTop) doneTop.addEventListener('click', onToggleDone);
      if (doneBot) doneBot.addEventListener('click', onToggleDone);

      var noteBtn = document.getElementById('edAddNoteBtn');
      if (noteBtn) noteBtn.addEventListener('click', async function () {
        var txt = window.prompt('写一句本周（' + (week.title || 'Week ' + week.num) + '）的学习批注或避坑提醒：');
        if (!txt || !txt.trim()) return;
        await api.saveAnnotation({ route: route, course: course.id, title: week.title || ('Week ' + week.num), kind: 'note', note: txt.trim() });
        st = await api.loadStudy(true);
        api.toast('批注已保存到云端');
        draw();
      });

      app.querySelectorAll('[data-task-key]').forEach(function (chk) {
        chk.addEventListener('change', function () {
          window.LioraStore.toggleTaskDone(chk.getAttribute('data-task-key'));
          draw();
        });
      });

      var noteBody = document.getElementById('edNoteBody');
      var modeSlot = document.getElementById('edModeSlot');
      if (noteBody) applyKatex(noteBody);

      /* 跳转辅助 */
      function jumpToId(targetId) {
        var t = document.getElementById(targetId);
        if (!t) return;
        var det = t.closest('details');
        while (det) { det.open = true; det = det.parentElement ? det.parentElement.closest('details') : null; }
        t.scrollIntoView({ behavior: 'smooth', block: 'center' });
        t.classList.remove('ed-fig-pulse');
        void t.offsetWidth;
        t.classList.add('ed-fig-pulse');
      }

      if (noteMode === 'mindmap' && modeSlot) {
        var mmHeads = noteBody ? extractHeadings(noteBody) : [];
        var branches = [];
        if (biConcepts.length) {
          branches.push({
            title: '📌 核心概念（中英对照 · ' + biConcepts.length + ' 条）',
            jump: 'edBiConcepts',
            kids: biConcepts.map(function (c, i) {
              return { label: '<b>' + esc(c.term) + '</b> — ' + esc((c.zh || '').slice(0, 64)), jump: 'bi-item-' + i };
            })
          });
        }
        mmHeads.forEach(function (h) {
          var hEl = document.getElementById(h.id);
          var pts = [];
          if (hEl) {
            var cur = hEl.nextElementSibling;
            while (cur && !/^H[234]$/.test(cur.tagName) && pts.length < 6) {
              if (cur.tagName === 'UL' || cur.tagName === 'OL') {
                cur.querySelectorAll('li').forEach(function (li) {
                  if (pts.length < 6) {
                    var tx = li.textContent.replace(/\s+/g, ' ').trim();
                    if (tx.length > 4) pts.push({ label: esc(tx.slice(0, 78) + (tx.length > 78 ? '…' : '')), jump: h.id });
                  }
                });
              } else if (cur.tagName === 'P') {
                var ptx = cur.textContent.replace(/\s+/g, ' ').trim();
                if (ptx.length > 8) pts.push({ label: esc(ptx.slice(0, 78) + (ptx.length > 78 ? '…' : '')), jump: h.id });
              }
              cur = cur.nextElementSibling;
            }
          }
          branches.push({ title: '📖 ' + h.text, jump: h.id, kids: pts });
        });
        if (qaList.length) {
          branches.push({
            title: '🎯 本单元必考大题（' + qaList.length + ' 题）',
            jump: 'sec-exam-qa',
            kids: qaList.map(function (q, i) {
              return { label: '<b>Q' + (i + 1) + '.</b> ' + esc((q.qZh || q.qEn || '').slice(0, 66)), jump: 'qa-item-' + i };
            })
          });
        }

        modeSlot.innerHTML =
          '<div class="mm-wrap">' +
            '<div class="mm-bar">' +
              '<b style="font-size:14px;color:var(--navy-900)">🧠 本周知识思维导图（点击任意节点直达原文，点 −/+ 折叠分支）</b>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<button type="button" class="ed-btn ed-btn-sm" id="mmExpandAll">展开全部</button>' +
                '<button type="button" class="ed-btn ed-btn-sm" id="mmCollapseAll">折叠全部</button>' +
                '<button type="button" class="ed-btn ed-btn-sm ed-btn-primary" id="mmClose">返回精读</button>' +
              '</div>' +
            '</div>' +
            '<div class="mm-root">' + esc(course.nameCn + ' · ' + (week.title || ('Week ' + week.num))) + '</div>' +
            '<div class="mm-branches">' +
              branches.map(function (b, bi) {
                return '<div class="mm-branch">' +
                  '<div class="mm-node">' +
                    (b.kids.length ? '<button type="button" class="mm-tog" data-mm-tog="' + bi + '" title="展开/折叠">−</button>' : '') +
                    '<button type="button" class="mm-jump" data-jump="' + esc(b.jump) + '">' + esc(b.title) + '</button>' +
                  '</div>' +
                  (b.kids.length ? (
                    '<div class="mm-kids" id="mm-kids-' + bi + '">' +
                      b.kids.map(function (k) {
                        return '<div class="mm-leaf" data-jump="' + esc(k.jump) + '">' + k.label + '</div>';
                      }).join('') +
                    '</div>'
                  ) : '') +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>';

        modeSlot.querySelectorAll('[data-mm-tog]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var kids = document.getElementById('mm-kids-' + btn.getAttribute('data-mm-tog'));
            if (!kids) return;
            var collapsed = kids.classList.toggle('collapsed');
            btn.textContent = collapsed ? '+' : '−';
          });
        });
        var exAll = document.getElementById('mmExpandAll');
        var coAll = document.getElementById('mmCollapseAll');
        var mmClose = document.getElementById('mmClose');
        if (exAll) exAll.addEventListener('click', function () {
          modeSlot.querySelectorAll('.mm-kids').forEach(function (k) { k.classList.remove('collapsed'); });
          modeSlot.querySelectorAll('[data-mm-tog]').forEach(function (b) { b.textContent = '−'; });
        });
        if (coAll) coAll.addEventListener('click', function () {
          modeSlot.querySelectorAll('.mm-kids').forEach(function (k) { k.classList.add('collapsed'); });
          modeSlot.querySelectorAll('[data-mm-tog]').forEach(function (b) { b.textContent = '+'; });
        });
        if (mmClose) mmClose.addEventListener('click', function () { noteMode = 'full'; draw(); });
        modeSlot.querySelectorAll('[data-jump]').forEach(function (el) {
          el.addEventListener('click', function () { jumpToId(el.getAttribute('data-jump')); });
        });
      } else if (noteMode === 'cloze') {
        var allBlanks = Array.prototype.slice.call(
          app.querySelectorAll('#edBiConcepts .ed-cloze-blank, #edBiNotes .ed-cloze-blank, #edNoteBody strong, #edNoteBody .c-red')
        );
        allBlanks.forEach(function (el) {
          el.title = '点击翻开/隐藏考点词';
          el.addEventListener('click', function () { el.classList.toggle('revealed'); });
        });
        if (modeSlot) {
          modeSlot.innerHTML =
            '<div class="ed-mode-banner">' +
              '<span>🧠 <b>填空自测模式</b>：已精准遮盖本节 <b>' + allBlanks.length + '</b> 处专业术语与核心定义（英文遮英文术语、中文遮中文核心概念），点击任意浅蓝遮罩核对。</span>' +
              '<div style="display:flex;gap:6px">' +
                '<button type="button" class="ed-btn ed-btn-sm ed-btn-gold" id="edClozeRevealAll">👁️ 全部翻开</button>' +
                '<button type="button" class="ed-btn ed-btn-sm" id="edClozeHideAll">🙈 重新遮盖</button>' +
              '</div>' +
            '</div>';
          var rBtn = document.getElementById('edClozeRevealAll');
          var hBtn = document.getElementById('edClozeHideAll');
          if (rBtn) rBtn.addEventListener('click', function () { allBlanks.forEach(function (el) { el.classList.add('revealed'); }); });
          if (hBtn) hBtn.addEventListener('click', function () { allBlanks.forEach(function (el) { el.classList.remove('revealed'); }); });
        }
      } else if (noteMode === 'outline' && modeSlot) {
        var heads = noteBody ? extractHeadings(noteBody) : [];
        var tocGroups = [];
        if (biConcepts.length) {
          tocGroups.push(
            '<div style="margin-top:8px"><div style="font-size:12px;font-weight:700;color:var(--gold-deep);margin-bottom:5px">📌 核心概念（' + biConcepts.length + ' 条）</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px">' +
            biConcepts.map(function (c, idx) {
              return '<button type="button" data-jump="bi-item-' + idx + '" style="text-align:left;cursor:pointer;font-size:13px;padding:6px 10px;border-radius:7px;background:var(--surface-2);border:1px solid var(--line-2);color:var(--navy-900)">' + (idx + 1) + '. ' + esc(c.term) + '</button>';
            }).join('') + '</div></div>'
          );
        }
        if (heads.length) {
          tocGroups.push(
            '<div style="margin-top:10px"><div style="font-size:12px;font-weight:700;color:var(--navy-700);margin-bottom:5px">📖 笔记正文小节（' + heads.length + ' 节）</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px">' +
            heads.map(function (h, idx) {
              return '<button type="button" data-jump="' + h.id + '" style="text-align:left;cursor:pointer;font-size:13px;padding:6px 10px;border-radius:7px;background:var(--surface-2);border:1px solid var(--line-2);color:var(--navy-900)">' + (idx + 1) + '. ' + esc(h.text) + '</button>';
            }).join('') + '</div></div>'
          );
        }
        if (qaList.length) {
          tocGroups.push(
            '<div style="margin-top:10px"><div style="font-size:12px;font-weight:700;color:#8a4f16;margin-bottom:5px">🎯 本单元必考大题（' + qaList.length + ' 题）</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px">' +
            qaList.map(function (q, idx) {
              return '<button type="button" data-jump="qa-item-' + idx + '" style="text-align:left;cursor:pointer;font-size:13px;padding:6px 10px;border-radius:7px;background:#fdf8ec;border:1px solid var(--gold-border);color:var(--navy-900)">Q' + (idx + 1) + '. ' + esc((q.qZh || q.qEn || '').slice(0, 34)) + '</button>';
            }).join('') + '</div></div>'
          );
        }
        var totalItems = biConcepts.length + heads.length + qaList.length;
        modeSlot.innerHTML = '<div class="ed-card" style="margin-bottom:16px;border-left:4px solid var(--navy-800)">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
            '<b style="font-size:14.5px;color:var(--navy-900)">📑 本节知识点速览目录（共 ' + totalItems + ' 项 · 点击任意一条直达）</b>' +
            '<button type="button" class="ed-btn ed-btn-sm" id="edCloseToc">返回精读</button>' +
          '</div>' +
          (tocGroups.join('') || '<p style="font-size:13px;color:var(--muted);margin:8px 0 0">本节暂无二级目录项。</p>') +
        '</div>';
        var closeToc = document.getElementById('edCloseToc');
        if (closeToc) closeToc.addEventListener('click', function () { noteMode = 'full'; draw(); });
        modeSlot.querySelectorAll('[data-jump]').forEach(function (a) {
          a.addEventListener('click', function () { jumpToId(a.getAttribute('data-jump')); });
        });
      } else if (biMode === 'recall' && modeSlot) {
        modeSlot.innerHTML =
          '<div class="ed-mode-banner">' +
            '<span>🧠 <b>看中文背英文模式</b>：下方英文原句已温柔隐藏，先看中文自己口头复述英文，再点浅蓝卡片翻开核对。</span>' +
            '<div style="display:flex;gap:6px">' +
              '<button type="button" class="ed-btn ed-btn-sm ed-btn-gold" id="edRecallRevealAll">👁️ 全部翻开</button>' +
              '<button type="button" class="ed-btn ed-btn-sm" id="edRecallHideAll">🙈 全部遮盖</button>' +
            '</div>' +
          '</div>';
        var rAll = document.getElementById('edRecallRevealAll');
        var hAll = document.getElementById('edRecallHideAll');
        if (rAll) rAll.addEventListener('click', function () { app.querySelectorAll('.bi-en, .bi-add').forEach(function (el) { el.classList.add('revealed'); }); });
        if (hAll) hAll.addEventListener('click', function () { app.querySelectorAll('.bi-en, .bi-add').forEach(function (el) { el.classList.remove('revealed'); }); });
      }
      var tutBody = document.getElementById('edTutBody');
      if (tutBody) applyKatex(tutBody);

      /* ADHD 舒缓逐卡模式开关 + 一次只开一张手风琴 + 概念微进度勾选 + 全部展开/收起 */
      var adhdBtn = document.getElementById('edToggleAdhd');
      if (adhdBtn) adhdBtn.addEventListener('click', function () {
        adhdMode = !adhdMode;
        try { localStorage.setItem('liora-adhd-mode', adhdMode ? '1' : '0'); } catch (e) {}
        api.toast(adhdMode ? '🧘 已开启舒缓逐卡模式（大行距 + 默认折叠，一次看一条）' : '已切换为全部展开模式');
        draw();
      });

      var sfChk = document.getElementById('edSingleFocusChk');
      if (sfChk) sfChk.addEventListener('change', function () {
        singleFocus = sfChk.checked;
        try { localStorage.setItem('liora-single-focus', singleFocus ? '1' : '0'); } catch (e) {}
        api.toast(singleFocus ? '🎯 已开启「一次只开一张」防分心模式' : '已允许同时展开多张卡片');
      });

      /* 手风琴防分心：开启 singleFocus 时，打开一张概念卡/分点卡/笔记小节自动轻轻收起同组其他卡片 */
      function bindSingleFocus(selector) {
        var list = Array.prototype.slice.call(app.querySelectorAll(selector));
        list.forEach(function (det) {
          det.addEventListener('toggle', function () {
            if (!singleFocus || !det.open) return;
            list.forEach(function (other) {
              if (other !== det && other.open) other.open = false;
            });
          });
        });
      }
      bindSingleFocus('#edBiConcepts details.bi-concept-acc');
      bindSingleFocus('#edBiNotes details.ed-bi-notes-sec');
      bindSingleFocus('#edNoteBody details.ed-topic-acc');
      app.querySelectorAll('#edBiConcepts details.bi-concept-acc').forEach(function (card) {
        var bList = Array.prototype.slice.call(card.querySelectorAll('details.bi-bullet-acc'));
        bList.forEach(function (b) {
          b.addEventListener('toggle', function () {
            if (!singleFocus || !b.open) return;
            bList.forEach(function (other) { if (other !== b && other.open) other.open = false; });
          });
        });
      });

      /* 概念「看懂了 / 已搞懂」微进度勾选（阻止冒泡避免触发折叠切换） */
      app.querySelectorAll('[data-bc-done]').forEach(function (btn) {
        btn.addEventListener('click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var now = window.LioraStore.toggleTaskDone(btn.getAttribute('data-bc-done'));
          api.toast(now ? '🎉 又搞懂一个核心概念！' : '已取消完成标记');
          draw();
        });
      });

      var biExp = document.getElementById('edBiExpandAll');
      var biCol = document.getElementById('edBiCollapseAll');
      if (biExp) biExp.addEventListener('click', function () {
        var prevSf = singleFocus; singleFocus = false;
        app.querySelectorAll('#edBiConcepts details').forEach(function (d) { d.open = true; });
        singleFocus = prevSf;
      });
      if (biCol) biCol.addEventListener('click', function () {
        app.querySelectorAll('#edBiConcepts details').forEach(function (d) { d.open = false; });
      });

      var bnExp = document.getElementById('edBnExpandAll');
      var bnCol = document.getElementById('edBnCollapseAll');
      if (bnExp) bnExp.addEventListener('click', function () {
        var prevSf = singleFocus; singleFocus = false;
        app.querySelectorAll('#edBiNotes details.ed-bi-notes-sec').forEach(function (d) { d.open = true; });
        singleFocus = prevSf;
      });
      if (bnCol) bnCol.addEventListener('click', function () {
        app.querySelectorAll('#edBiNotes details.ed-bi-notes-sec').forEach(function (d) { d.open = false; });
      });

      /* 图解与例题折叠卡全部展开/折叠按钮 */
      var accExp = document.getElementById('edAccExpandAll');
      var accCol = document.getElementById('edAccCollapseAll');
      if (accExp) accExp.addEventListener('click', function () {
        var prevSf = singleFocus; singleFocus = false;
        app.querySelectorAll('#edNoteBody details.ed-topic-acc').forEach(function (d) { d.open = true; });
        singleFocus = prevSf;
      });
      if (accCol) accCol.addEventListener('click', function () {
        app.querySelectorAll('#edNoteBody details.ed-topic-acc').forEach(function (d) { d.open = false; });
      });

      /* 本周页内实时检索（支持英文/中文多关键词、自动展开折叠块、上下跳转 + 来自全站搜索的 ?q= 直达） */
      (function wireInPageSearch() {
        var inp = document.getElementById('edInPageSearch');
        var cntEl = document.getElementById('edFindCount');
        var prevBtn = document.getElementById('edFindPrev');
        var nextBtn = document.getElementById('edFindNext');
        var clrBtn = document.getElementById('edFindClear');
        if (!inp) return;
        var hits = [];
        var curHit = -1;

        function clearHits() {
          app.querySelectorAll('mark.ed-find-hit').forEach(function (mk) {
            var p = mk.parentNode;
            if (!p) return;
            p.replaceChild(document.createTextNode(mk.textContent), mk);
            p.normalize();
          });
          hits = [];
          curHit = -1;
          if (cntEl) cntEl.textContent = '';
          if (prevBtn) prevBtn.style.display = 'none';
          if (nextBtn) nextBtn.style.display = 'none';
          if (clrBtn) clrBtn.style.display = 'none';
        }

        function focusHit(index) {
          if (!hits.length) return;
          hits.forEach(function (h) { h.classList.remove('active'); });
          curHit = (index + hits.length) % hits.length;
          var target = hits[curHit];
          var det = target.closest('details');
          while (det) { det.open = true; det = det.parentElement ? det.parentElement.closest('details') : null; }
          target.classList.add('active');
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (cntEl) cntEl.textContent = '第 ' + (curHit + 1) + ' / ' + hits.length + ' 处';
        }

        function runFind(qText) {
          clearHits();
          var q = String(qText || '').trim();
          if (q.length < 2) return;
          var toks = q.split(/[\s,，、/]+/).filter(function (x) { return x.length >= 2; });
          if (!toks.length) toks = [q];
          var pat = new RegExp('(' + toks.map(escRe).join('|') + ')', 'gi');
          var scopes = [
            document.getElementById('edBiConcepts'),
            document.getElementById('edBiNotes'),
            document.getElementById('edNoteBody'),
            document.getElementById('sec-exam-qa') && document.getElementById('sec-exam-qa').nextElementSibling
          ].filter(Boolean);

          scopes.forEach(function (scope) {
            var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
              acceptNode: function (n) {
                if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                var pe = n.parentElement;
                if (!pe || pe.closest('svg, script, style, button, input, .katex, mark.ed-find-hit')) return NodeFilter.FILTER_REJECT;
                return pat.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
              }
            });
            var textNodes = [];
            var tn;
            while ((tn = walker.nextNode())) { pat.lastIndex = 0; textNodes.push(tn); }
            textNodes.forEach(function (node) {
              pat.lastIndex = 0;
              var val = node.nodeValue;
              var frag = document.createDocumentFragment();
              var last = 0, m;
              while ((m = pat.exec(val)) !== null) {
                if (m.index > last) frag.appendChild(document.createTextNode(val.slice(last, m.index)));
                var mk = document.createElement('mark');
                mk.className = 'ed-find-hit';
                mk.textContent = m[0];
                frag.appendChild(mk);
                hits.push(mk);
                last = m.index + m[0].length;
                if (hits.length >= 120) break;
              }
              if (last < val.length) frag.appendChild(document.createTextNode(val.slice(last)));
              if (node.parentNode) node.parentNode.replaceChild(frag, node);
            });
          });

          if (clrBtn) clrBtn.style.display = 'inline-flex';
          if (!hits.length) {
            if (cntEl) cntEl.textContent = '本周未找到匹配，可试试顶部全站搜索';
            return;
          }
          if (prevBtn) prevBtn.style.display = 'inline-flex';
          if (nextBtn) nextBtn.style.display = 'inline-flex';
          focusHit(0);
        }

        var tmr = null;
        inp.addEventListener('input', function () {
          clearTimeout(tmr);
          tmr = setTimeout(function () { runFind(inp.value); }, 180);
        });
        inp.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            if (hits.length) focusHit(curHit + 1);
            else runFind(inp.value);
          }
        });
        if (prevBtn) prevBtn.addEventListener('click', function () { focusHit(curHit - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { focusHit(curHit + 1); });
        if (clrBtn) clrBtn.addEventListener('click', function () { inp.value = ''; clearHits(); });

        /* 若从顶部全站搜索带 ?q=... 跳转过来，自动填入并滚动高亮直达！ */
        var urlQ = new URLSearchParams(location.hash.split('?')[1] || '').get('q');
        if (urlQ && !inp.dataset.autoRan) {
          inp.dataset.autoRan = '1';
          inp.value = urlQ;
          setTimeout(function () { runFind(urlQ); }, 120);
        }
      })();

      /* 扫描全页图解（核心笔记 + 课后答案），生成顶部速览条并绑定点击放大灯箱 */
      var totalVis = wireVisuals(app, document.getElementById('sec-figs'));
      var badgeEl = document.getElementById('edFigCountBadge');
      if (badgeEl) badgeEl.textContent = String(totalVis);

      /* 重新着色本页所有已保存的 4 色高光 */
      if (window.LioraHighlighter && typeof window.LioraHighlighter.refresh === 'function') {
        window.LioraHighlighter.refresh();
      }
    }

    draw();
  }

  window.LioraViewsCourse = { renderCourse: renderCourse };
})();
