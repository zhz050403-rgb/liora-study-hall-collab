/* =====================================================================
   一周双 Unit · 学习笔记目录两级折叠（2026-11-09）
   ---------------------------------------------------------------------
   有些周次同时讲两个 Unit（例：会计学 Term1 Week1「Unit 1 会计导论 与 Unit 2 会计惯例」，
   经济学多周「Unit 1 Tutorial + Unit 2 …」）。原来目录把两组的知识点混在一层平铺，
   点开「学习笔记」就是几十条，看不出哪几条属于哪个 Unit。

   这里只做「导航层」分组：
     Unit 1 / Unit 2 变成上一级可折叠按钮 -> 展开后才是该 Unit 下面的小类目。
   - 不修改 data.js，不动笔记正文，不改任何知识点标题文字
   - 两条路径（2026-11-10 补齐第二种，覆盖全站 15 个双 Unit 周）：
     A. 目录条目自带 Unit 前缀（会计 Term1 W1）-> 按升序起点精确切分
     B. 标题写两个 Unit、目录条目没有前缀（经济学 14 周）-> 前一个 Unit 放
        「课后作业答案」里的真实习题小类目，后一个 Unit 放原有全部知识点。
        依据：正文 .kp-src 标注这些知识点全部出自后一个 Unit 的讲义，
        前一个 Unit 是 Tutorial 习题课。不造空分组、不编造知识点归属。
   - 单 Unit 周次保持原样
   - 幂等：.kp-list 打 data-unit-grp 标记，hash 切换重渲染后自动重建
   - 搜索时自动展开全部分组；当前高亮知识点所在的 Unit 默认展开
   - 目录条目的点击监听器绑在元素本身，包一层容器不会丢失跳转功能
   ===================================================================== */
(function(){
  'use strict';

  var CSS = [
    '.unit-grp{margin:0 0 7px}',
    '.unit-grp-bar{display:flex;align-items:center;gap:6px;width:100%;padding:7px 9px;',
      'border:1px solid var(--line-2,#dde4ee);border-left:3px solid var(--gold,#b08a3e);',
      'border-radius:0 6px 6px 0;background:#eef4fb;color:var(--navy-900,#153b64);',
      'font:700 12px var(--sans);text-align:left;cursor:pointer}',
    '.unit-grp-bar:hover{background:#e0ecfa}',
    '.unit-grp-bar:focus-visible{outline:2px solid var(--gold,#b08a3e);outline-offset:1px}',
    '.unit-grp-n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.unit-grp-c{flex:none;font-weight:600;font-size:11px;color:#5f7591;',
      'background:#d8e7f7;border-radius:9px;padding:1px 7px}',
    '.unit-grp-a{flex:none;font-size:11px;color:#5f7591;width:12px;text-align:center}',
    '.unit-grp-kids{margin:3px 0 0 8px;padding:1px 0 2px 8px;',
      'border-left:1px solid var(--line-2,#dde4ee)}',
    '.unit-grp.collapsed .unit-grp-kids{display:none}',
    '.unit-grp-hint{margin:0 0 7px;padding:0 2px;font-size:11px;color:var(--muted,#6b7a90);line-height:1.5}',
    '.unit-grp-note{margin:2px 0 7px;font-size:11px;color:var(--muted,#6b7a90);line-height:1.5}',
    '.unit-grp-sub{display:block;width:100%;text-align:left;border:0;border-left:2px solid #d9e5f4;',
      'background:#fff;color:var(--ink-2,#33485f);font:12px var(--sans);padding:5px 8px;',
      'margin:0 0 3px;border-radius:0 5px 5px 0;cursor:pointer;line-height:1.4}',
    '.unit-grp-sub:hover{background:#eaf3fd;border-left-color:var(--gold,#b08a3e)}',
    '.unit-ans-flash{outline:2px solid var(--gold,#b08a3e);outline-offset:3px}',
    '@media print{.unit-grp-bar .unit-grp-a,.unit-grp-hint,.unit-grp-note{display:none!important}',
      '.unit-grp.collapsed .unit-grp-kids{display:block!important}}'
  ].join('\n');

  function injectCss(){
    if(document.getElementById('unit-grp-css')) return;
    var s = document.createElement('style');
    s.id = 'unit-grp-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* 从周标题里抓每个 Unit 的短名，例：
     "Week 1 · Unit 1 会计导论 与 Unit 2 会计惯例" -> {1:"Unit 1 · 会计导论", 2:"Unit 2 · 会计惯例"} */
  function unitNamesFromTitle(){
    var out = {}, nodes = document.querySelectorAll('#app h1,#app h2,#app .wp-top-t,#app .week-title');
    for(var i = 0; i < nodes.length; i++){
      var t = (nodes[i].textContent || '').replace(/\s+/g, ' ').trim();
      if((t.match(/Unit\s*\d+/gi) || []).length < 2) continue;
      var re = /Unit\s*(\d+)\s*([^与+、·|]+)/gi, m;
      while((m = re.exec(t)) !== null){
        var n = String(parseInt(m[1], 10));
        if(!out[n]){
          var tail = (m[2] || '').trim().replace(/\s*(Tutorial|Lecture)\s*$/i, '').trim();
          out[n] = 'Unit ' + n + (tail ? ' · ' + tail.slice(0, 26) : '');
        }
      }
      if(Object.keys(out).length >= 2) break;
    }
    return out;
  }

  /* 只有「编号开头 + Unit N」的条目才是新组起点；编号须递增，
     避免把 Unit2 Lecture / Unit1 Reading 这类正文标题误判成新 Unit。 */
  function unitStartOf(el){
    var raw = String(el.getAttribute('title') || el.textContent || '')
      .replace(/\s+/g, ' ').trim().replace(/^\s*\d+\s*[.、)）:：]\s*/, '');
    var m = /^Unit\s*(\d+)\b/i.exec(raw);
    if(!m) return null;
    return { n: parseInt(m[1], 10), text: raw.slice(0, 70) };
  }

  /* 标题里出现 >=2 个不同 Unit 编号时，取最小/最大两个作为上一级分组。
     例：「Week 2 · Unit 1 Tutorial + Unit 2 Inflation」-> nums [1,2]。
     注意：侧栏的周次列表也含 Unit 字样，故只认 #app 里的本周标题。 */
  function titleUnits(){
    var nums = [], names = {};
    var nodes = document.querySelectorAll('#app h1,#app h2,#app .wp-top-t,#app .week-title');
    for(var i = 0; i < nodes.length; i++){
      var t = (nodes[i].textContent || '').replace(/\s+/g, ' ').trim();
      if((t.match(/Unit\s*\d+/gi) || []).length < 2) continue;
      var re = /Unit\s*(\d+)\s*([^与+、·|]*)/gi, m;
      while((m = re.exec(t)) !== null){
        var n = parseInt(m[1], 10);
        if(nums.indexOf(n) >= 0) continue;
        nums.push(n);
        var tail = (m[2] || '').trim().replace(/\s*(Tutorial|Lecture)\s*$/i, '').trim();
        names[n] = 'Unit ' + n + (tail ? ' · ' + tail.slice(0, 26) : '');
      }
      if(nums.length >= 2) break;
    }
    nums.sort(function(a, b){ return a - b; });
    return { nums: nums, names: names };
  }

  /* 前一个 Unit 的真实内容：课后作业答案区里每一道题（.gx-answer） */
  function answerTopics(){
    var pane = document.querySelector('#app .note-pane[data-pane="answers"]');
    if(!pane) return [];
    var boxes = Array.prototype.slice.call(pane.querySelectorAll('.gx-answer'));
    var out = [];
    boxes.forEach(function(box){
      if(out.length >= 14) return;
      var h = box.querySelector('.kp-h, h4, h3');
      var t = (h ? h.textContent : '').replace(/\s+/g, ' ').trim();
      var raw = (box.textContent || '').replace(/\s+/g, ' ').trim()
        .replace(/^\d+\s*[.、)]\s*题干[：:]\s*/, '')
        .replace(/^题干[：:]\s*/, '');
      /* 只有「2.」这种纯编号没有信息量，改用题干首句 */
      if(!/^(Question|Q\s*\d|Tutorial|\d+\s*[.、)]|\d+\s*题干)/i.test(t) ||
         /^\d+\s*[.、)]?\s*$/.test(t)) t = raw;
      t = t.replace(/^题干[：:]\s*/, '').slice(0, 54);
      if(t) out.push({ label: t, el: box });
    });
    return out;
  }

  function newGroup(label, count){
    var grp = document.createElement('div');
    grp.className = 'unit-grp collapsed';
    var bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'unit-grp-bar';
    bar.setAttribute('aria-expanded', 'false');
    bar.innerHTML = '<span class="unit-grp-n"></span><span class="unit-grp-c"></span>' +
                    '<span class="unit-grp-a">▸</span>';
    bar.querySelector('.unit-grp-n').textContent = label;
    bar.querySelector('.unit-grp-c').textContent = count + ' 条';
    var kids = document.createElement('div');
    kids.className = 'unit-grp-kids';
    grp.appendChild(bar);
    grp.appendChild(kids);
    bar.addEventListener('click', function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      setOpen(grp, grp.classList.contains('collapsed'));
    });
    return { grp: grp, kids: kids, bar: bar };
  }

  /* 经济学等 14 个周次：标题写两个 Unit，但目录条目没有 Unit 前缀。
     数据事实（已核）：目录知识点全部出自后一个 Unit 的讲义
     （正文 .kp-src 标注 unitN PPT / unitN NOTE），前一个 Unit 的内容是 Tutorial 习题，
     真实存在于「课后作业答案」标签页。故不编造归属：
       第一组 = 该 Unit 的习题小类目（点击直接跳到答案）
       第二组 = 原有目录知识点（一条不动、不改文字） */
  function buildTitleGroups(list, items){
    var u = titleUnits();
    if(u.nums.length < 2) return;
    var first = u.nums[0], last = u.nums[u.nums.length - 1];
    if(first >= last) return;
    var ans = answerTopics();
    var hasTab = !!document.querySelector('#app .note-tab[data-ntab="answers"]');

    var A = newGroup('Unit ' + first + ' · 习题 / Tutorial', ans.length || 1);
    var B = newGroup(u.names[last] || ('Unit ' + last), items.length);
    A.grp.setAttribute('data-unit', String(first));
    B.grp.setAttribute('data-unit', String(last));

    var note = document.createElement('p');
    note.className = 'unit-grp-note';
    note.textContent = hasTab
      ? '本单元的 Tutorial 习题与参考答案，点条目直接跳到答案。'
      : '本单元为习题 / 复习课，内容见本周课件与笔记。';
    A.kids.appendChild(note);

    if(ans.length){
      ans.forEach(function(a){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'unit-grp-sub';
        b.textContent = a.label;
        b.addEventListener('click', function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          if(hasTab){
            var tab = document.querySelector('#app .note-tab[data-ntab="answers"]');
            if(tab && !tab.classList.contains('active')) tab.click();
          }
          setTimeout(function(){
            if(!a.el || !a.el.scrollIntoView) return;
            a.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            a.el.classList.add('unit-ans-flash');
            setTimeout(function(){ a.el.classList.remove('unit-ans-flash'); }, 1600);
          }, 90);
        });
        A.kids.appendChild(b);
      });
    } else if(hasTab){
      var only = document.createElement('button');
      only.type = 'button';
      only.className = 'unit-grp-sub';
      only.textContent = '打开「课后作业答案」';
      only.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var tab = document.querySelector('#app .note-tab[data-ntab="answers"]');
        if(tab) tab.click();
      });
      A.kids.appendChild(only);
    }

    list.insertBefore(B.grp, items[0]);
    for(var j = 0; j < items.length; j++) B.kids.appendChild(items[j]);
    list.insertBefore(A.grp, B.grp);

    var hint = document.createElement('p');
    hint.className = 'unit-grp-hint';
    hint.textContent = 'Unit ' + first + ' 习题 / Tutorial · Unit ' + last + ' 新授，点开看小类目';
    list.insertBefore(hint, list.firstChild);

    if(B.grp.querySelector('.kp-item.active')) setOpen(B.grp, true);
    revealGroups(list);
  }

  /* 2026-11-10 第二次反馈后的根因修复：
     旧逻辑只是「把最后一条 Unit 按钮滚进视口」，结果按钮永远贴在屏幕最底边，
     矮窗口下更是完全滚不到（user 仍说没看见）。真正的根因是 course-tree.js
     把「学习笔记」目录排在学习导航第 5 位。现在生成顺序已改，这里做兜底：
     ① 目录若仍不在第一位就搬到第一位；② 内部滚动条归零（目录已在最前）；
     ③ 极矮窗口才让主页面把第一条按钮带进视口。 */
  function hoistOutline(list){
    var outline = null, el = list.parentElement;
    while(el && el !== document.body){
      if(el.classList && el.classList.contains('ws-note-outline')){ outline = el; break; }
      el = el.parentElement;
    }
    if(!outline) return;
    var tree = outline.parentElement;
    if(!tree || !tree.classList || !tree.classList.contains('ws-tree')) return;
    if(tree.firstElementChild !== outline) tree.insertBefore(outline, tree.firstElementChild);
  }

  function revealGroups(list){
    hoistOutline(list);
    if(list.getAttribute('data-unit-revealed') === '1') return;
    var bars = list.querySelectorAll('.unit-grp-bar');
    if(!bars.length) return;
    list.setAttribute('data-unit-revealed', '1');
    var el = list.parentElement;
    while(el && el !== document.body){
      var s = window.getComputedStyle(el);
      if(/(auto|scroll)/.test(s.overflowY) && el.scrollTop > 0) el.scrollTop = 0;
      el = el.parentElement;
    }
    /* 侧栏 .week-side 是 sticky（top:92px）：只有滚动主页面能把它带上来。
       实测：滚内部 .ws-tree 会把按钮裁出滚动区、变得点不到，绝对不要那么做。
       这里把「学习导航」框滚到视口上方，两条 Unit 按钮就稳定落在上半屏
       （1080x640 实测 y≈220/260），各视口一致；每个目录只滚一次。 */
    var nav = null, p = list.parentElement;
    while(p && p !== document.body){
      if(p.classList && p.classList.contains('ws-nav-box')){ nav = p; break; }
      p = p.parentElement;
    }
    var top = (nav || list).getBoundingClientRect().top;
    if(top > 84){
      var d = Math.min(top - 64, 620);
      if(d > 8) window.scrollBy(0, d);
    }
  }

  function setOpen(grp, open){
    grp.classList.toggle('collapsed', !open);
    var bar = grp.querySelector('.unit-grp-bar');
    if(bar){
      bar.setAttribute('aria-expanded', String(!!open));
      var a = bar.querySelector('.unit-grp-a');
      if(a) a.textContent = open ? '▾' : '▸';
    }
  }

  function enhance(){
    injectCss();
    var list = document.querySelector('#app .kp-list');
    if(!list || list.getAttribute('data-unit-grp') === '1') return;
    /* 标记先打，避免 observer 反复触发；单 Unit 周次也直接跳过 */
    list.setAttribute('data-unit-grp', '1');

    var items = Array.prototype.slice.call(list.children).filter(function(el){
      return el && el.classList && el.classList.contains('kp-item');
    });
    if(items.length < 2) return;

    var starts = [];
    items.forEach(function(el, idx){
      var u = unitStartOf(el);
      if(!u) return;
      if(!starts.length || u.n > starts[starts.length - 1].n) starts.push({ i: idx, n: u.n, text: u.text });
    });
    /* 目录条目本身带 Unit 前缀 -> 精确按起点切分（会计 W1）。
       否则只要本周标题写了两个 Unit，也补上两级折叠（经济学 14 周）。 */
    if(starts.length < 2){ buildTitleGroups(list, items); return; }

    var names = unitNamesFromTitle();
    var groups = [];
    /* 从后往前建组，避免移动节点时打乱尚未处理的前面条目 */
    for(var k = starts.length - 1; k >= 0; k--){
      var from = starts[k].i;
      var to = (k + 1 < starts.length) ? starts[k + 1].i : items.length;
      var grp = document.createElement('div');
      grp.className = 'unit-grp collapsed';
      grp.setAttribute('data-unit', String(starts[k].n));

      var bar = document.createElement('button');
      bar.type = 'button';
      bar.className = 'unit-grp-bar';
      bar.setAttribute('aria-expanded', 'false');
      var label = names[String(starts[k].n)] || starts[k].text || ('Unit ' + starts[k].n);
      bar.innerHTML = '<span class="unit-grp-n"></span><span class="unit-grp-c"></span>' +
                      '<span class="unit-grp-a">▸</span>';
      bar.querySelector('.unit-grp-n').textContent = label;
      bar.querySelector('.unit-grp-c').textContent = (to - from) + ' 条';

      var kids = document.createElement('div');
      kids.className = 'unit-grp-kids';
      grp.appendChild(bar);
      grp.appendChild(kids);
      list.insertBefore(grp, items[from]);
      for(var j = from; j < to; j++) kids.appendChild(items[j]);

      (function(g){
        bar.addEventListener('click', function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          setOpen(g, g.classList.contains('collapsed'));
        });
      })(grp);
      groups.push({ el: grp, from: from, to: to });
    }

    /* 当前高亮知识点所在的 Unit 默认展开，其它保持收起 */
    groups.forEach(function(g){
      var act = g.el.querySelector('.kp-item.active');
      if(act) setOpen(g.el, true);
    });

    var hint = document.createElement('p');
    hint.className = 'unit-grp-hint';
    hint.textContent = '本周 ' + starts.length + ' 个 Unit · 点开看下面的小类目';
    list.insertBefore(hint, list.firstChild);
    revealGroups(list);
  }

  /* 搜索时展开全部分组，否则命中项会被折叠藏住 */
  document.addEventListener('input', function(ev){
    var el = ev.target;
    if(!el || !/kpSearchInput/.test(el.id || '')) return;
    if(!String(el.value || '').trim()) return;
    Array.prototype.forEach.call(document.querySelectorAll('#app .unit-grp'), function(g){ setOpen(g, true); });
  }, true);

  /* 跟随正文滚动高亮：当前知识点所在 Unit 自动展开（用户刚手动收起的 2 秒内不打扰） */
  var lastManual = 0;
  document.addEventListener('click', function(ev){
    if(ev.target && ev.target.closest && ev.target.closest('.unit-grp-bar')) lastManual = Date.now();
  }, true);

  var timer = null;
  function schedule(){
    if(timer) clearTimeout(timer);
    timer = setTimeout(function(){ timer = null; try{ enhance(); }catch(e){} }, 260);
  }
  function followActive(){
    if(Date.now() - lastManual < 2000) return;
    var act = document.querySelector('#app .kp-item.active');
    if(!act) return;
    var g = act.closest ? act.closest('.unit-grp') : null;
    if(g && g.classList.contains('collapsed')) setOpen(g, true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
  window.addEventListener('hashchange', function(){ setTimeout(schedule, 60); });

  if(typeof MutationObserver === 'function'){
    var app = document.getElementById('app');
    if(app){
      var mo = new MutationObserver(function(muts){
        var need = false;
        for(var i = 0; i < muts.length; i++){
          var m = muts[i];
          if(m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)){ need = true; break; }
          if(m.type === 'attributes' && m.attributeName === 'class' &&
             m.target && m.target.classList && m.target.classList.contains('kp-item') &&
             m.target.classList.contains('active')) followActive();
        }
        if(need) schedule();
      });
      mo.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
  }

  window.__unitGroups = { enhance: enhance, setOpen: setOpen };
})();
