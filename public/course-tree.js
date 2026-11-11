/* ============================================================
   课程目录 · 分级树（2026-11-06）
   左侧栏统一成 6 个大板块：资料下载 / 去复习 / 本周任务 /
   学习目标 / 学习笔记 / 术语表（有才显示）。每个大板块、每个
   二级分组都可单独折叠；原有周次跳转、知识点树、Activity 导航、
   搜索与四种视图全部保留（直接搬原 DOM 节点，事件不丢）。
   2026-11-07 第一轮：侧栏拆成两个平级折叠框——「周次导航」与
   「学习导航」，各一个标题 + 一个箭头、可单独展开收起；箭头回到标题同一行。
   2026-11-07 第二轮（UI / ADHD 体检收尾，按用户指定顺序）：
     ② 合并「展开/收起」：删掉残留的全局开关逻辑，统一列表项符号与尺寸；
     ③ 文案：学习导航→去复习、本周打卡→本周任务、数字徽标补单位；
     ④ 展开态拉开组间距（12–16px）、字号收敛为 12 / 13.5 / 15 三档
        （最小 12px，放大后约 19px）、浅色文字统一加深到 #46688e
        （白底 ≥5:1，达 WCAG AA）、标题行常驻「当前周」锚点
        （收起也看得见）+ 当前周项补 aria-current；
     ⑤ 配色方案、圆角、边框、阴影一律不动（用户明确不做）。
   两个框保持「可单独展开收起」，不做互斥（尊重用户上一轮确认）。
   ============================================================ */
(function(){
  var CSS_ID = 'course-tree-css';
  /* 侧栏局部设计令牌（沿用站点原有蓝色系，本轮只调字号 / 字色 / 间距，
     不动配色方案与圆角）：
     字号 3 档 12 / 13.5 / 15px —— 原 8 档收敛，最小 12px，放大后约 19px；
     字色 3 档 #173860 标题 / #2c4a6b 正文 / #46688e 辅助
            （白底 ≥5:1、浅蓝底 ≥4.5:1，满足 WCAG AA 正文对比度）；
     间距 组间 12–16px、组内 3–6px、列表行最小 34–36px（放大后 >44px 舒适点击区）。 */
  var CSS = [
'.ws-tree{max-height:min(58vh,520px);overflow-y:auto;overflow-x:hidden;padding:10px 12px 16px;scrollbar-width:thin}',
'.week-side{background:transparent;border:0;border-radius:0;box-shadow:none;overflow:visible}',
'.week-side>.ws-week-nav,.week-side>.ws-nav-box{border:1px solid #bed2e8;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 2px 10px rgba(23,56,96,.06)}',
'.week-side>.ws-week-nav{margin-bottom:12px}',
'.week-side>.ws-week-nav>summary,.week-side>.ws-nav-box>summary{display:flex;flex-direction:row;align-items:center;justify-content:flex-start;flex-wrap:nowrap;gap:8px;padding:12px 14px;margin:0;border:0;border-bottom:1px solid #dce8f5;background:#eaf3fd;cursor:pointer;list-style:none;font:700 15px var(--serif);letter-spacing:.02em;color:#173860}',
'.week-side>.ws-week-nav>summary::-webkit-details-marker,.week-side>.ws-nav-box>summary::-webkit-details-marker{display:none}',
'.week-side>.ws-week-nav>summary::after,.week-side>.ws-nav-box>summary::after{content:"▸";margin-left:auto;flex:0 0 auto;font:400 13.5px var(--sans);color:#315f91}',
'.week-side>.ws-week-nav[open]>summary::after,.week-side>.ws-nav-box[open]>summary::after{content:"▾"}',
'.week-side>.ws-week-nav>summary .ws-title,.week-side>.ws-nav-box>summary .ws-title{flex:0 0 auto;min-width:0;font:700 15px var(--serif);letter-spacing:.02em;color:#173860;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.week-side>.ws-week-nav>summary .ws-term,.week-side>.ws-nav-box>summary .ws-term{flex:0 1 auto;min-width:0;max-width:none;font:400 12px var(--sans);letter-spacing:0;color:#46688e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
/* 当前周锚点：即使折叠框收起，也常驻显示「我现在在第几周」 */
'.week-side>.ws-week-nav>summary .ws-now{flex:0 0 auto;max-width:44%;display:inline-block;vertical-align:middle;padding:2px 8px;background:#fff;border:1px solid #bcd3ea;border-radius:9px;font:700 12px var(--sans);color:#173860;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.week-side>.ws-week-nav>summary .ws-now::before{content:"";display:inline-block;width:7px;height:7px;margin-right:5px;border-radius:50%;background:#c9a227;vertical-align:middle}',
'.week-side>.ws-week-nav>summary:hover,.week-side>.ws-nav-box>summary:hover{background:#dcecfb}',
'.week-side>.ws-week-nav>summary:focus-visible,.week-side>.ws-nav-box>summary:focus-visible{outline:2px solid #315f91;outline-offset:-2px}',
'.week-side>.ws-week-nav>.ws-list{max-height:min(46vh,420px);overflow-y:auto;padding:10px 8px}',
'.week-side>.ws-week-nav .ws-item{margin:4px 0}',
'.week-side>.ws-week-nav .ws-info .t{font-size:13.5px}',
'.week-side>.ws-week-nav .ws-info .s{font-size:12px;line-height:1.55;color:#46688e}',
'.week-side>.ws-week-nav .ws-num{font-size:12px}',
'.week-side>.ws-week-nav .ws-item.active .ws-info .t{font-weight:800}',
'.tnode{margin:2px 0}',
'.trow{display:flex;align-items:center;gap:8px;width:100%;min-height:36px;padding:7px 8px;border:0;border-radius:7px;background:transparent;color:#2c4a6b;font:600 13.5px/1.5 var(--sans);text-align:left;cursor:pointer}',
'.trow:hover{background:#eaf3fc}',
'.tnode.lvl1>.trow{background:#eaf2fb;color:#173860;font-weight:800;font-size:13.5px;margin-top:0}',
'.tnode.lvl2>.trow{font-weight:700;color:#2c4a6b;font-size:13.5px}',
'.tarrow{flex:0 0 16px;width:16px;text-align:center;font-size:13.5px;color:#315f91;border:0;background:transparent;cursor:pointer;padding:0;font-family:var(--sans)}',
'.tic{flex:0 0 auto;font-size:13.5px;line-height:1}',
'.tlabel{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.tcnt{flex:0 0 auto;font-size:12px;color:#46688e;background:#fff;border:1px solid #d8e7f7;border-radius:9px;padding:0 7px;line-height:20px;font-weight:700;white-space:nowrap}',
'.tkids{margin-left:14px;padding:6px 0 4px 10px;border-left:1px solid #d6e4f3}',
'.tnode.collapsed>.tkids{display:none}',
'.tleaf{display:flex;align-items:center;gap:8px;width:100%;min-height:34px;margin:3px 0;padding:7px 8px;border:0;background:transparent;color:#2c4a6b;font:13.5px/1.6 var(--sans);text-align:left;cursor:pointer;border-radius:5px}',
'.tleaf:hover{background:#eef6ff;color:#173860}',
/* 列表项符号统一为蓝色系；不再用 8px 淡紫菱形制造「可点」错觉 */
'.tleaf .dot{flex:0 0 auto;color:#46688e;font-size:12px;line-height:1}',
'.tleaf .tx{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'.tleaf .ok{color:#1a7f4b;font-weight:800}',
'.tleaf .num{flex:0 0 auto;color:#46688e;font-size:12px;font-weight:600}',
'.tree-empty{padding:8px;color:#46688e;font:12px/1.6 var(--sans)}',
/* 展开态组间距：直连条目之间 12px、大分组之间 16px，
   避免展开后变成一整片没有分组感的浅蓝条。特异性高于 cabin-theme.css 的 6px。 */
'.week-side .ws-tree>.tree-direct{margin:12px 0;padding:6px 10px}',
'.week-side .ws-tree>.tree-direct:first-child{margin-top:4px}',
'.week-side .ws-tree>.tnode.lvl1{margin:16px 0 4px}',
'.week-side .ws-tree>.tnode.lvl1:first-child{margin-top:2px;border-top:0}',
'.ws-tree .ws-list{max-height:none;overflow:visible;padding:2px 0 4px;border:0}',
'.ws-tree .ws-item{margin:4px 0;padding:8px 10px}',
'.ws-tree .ws-info .s{font-size:12px;line-height:1.55;color:#46688e}',
'.ws-tree .ws-head{flex-direction:row;align-items:center;flex-wrap:nowrap;gap:6px;padding:6px 8px;border:0;font:700 12px var(--sans);letter-spacing:0;color:#46688e;margin:0}',
'.ws-tree .ws-head .ws-title{flex:1;min-width:0;font:700 12px var(--sans);letter-spacing:0;color:#46688e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.ws-tree .ws-head .kp-tools-btn{font-size:12px;flex:0 0 auto}',
'.ws-tree .kp-search-wrap{padding:6px 8px 10px;border:0}',
'.ws-tree .kp-search-wrap input{height:34px;font-size:13.5px}',
'.ws-tree .kp-list{margin:0 0 6px 4px;padding:2px 0 4px 8px;max-height:none;overflow:visible}',
'.ws-tree .ws-outline-empty{margin:6px 8px;font-size:12px;color:#46688e}',
'.ct-flash{animation:ctFlash 1.4s ease}',
'@keyframes ctFlash{0%{box-shadow:none}20%{box-shadow:0 0 0 3px #ffe9a8}100%{box-shadow:none}}',
'@media(prefers-reduced-motion:reduce){.ct-flash{animation:none}}',
'@media(max-width:960px){.ws-tree{max-height:none}}',
'@media print{.ws-tree,.week-side{display:none!important}}'
  ].join('\n');

  function injectCss(){
    if(document.getElementById(CSS_ID)) return;
    var s = document.createElement('style');
    s.id = CSS_ID; s.textContent = CSS;
    document.head.appendChild(s);
  }
  /* index.html 的主脚本包在 IIFE 里，里面的 esc/findCourse/state 都不是全局；
     这里只依赖 window.PORTAL_DATA + 当前 DOM，自己实现等价的小工具。 */
  function E(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function toList(v){ if(v == null) return []; if(Array.isArray(v)) return v;
    return String(v).split(/[；;]/).map(function(s){return s.trim();}).filter(Boolean); }
  var ROLE = {lecture:'课堂讲义',reading:'阅读材料',tutorial:'练习指导',worksheet:'作业纸',
    practice:'练习题',exam:'考试 · 复习',assessment:'考核说明',info:'课程信息',
    reference:'公式 · 参考','lecture-notes':'讲义笔记',excel:'Excel 表格',doc:'Word 文档',
    ppt:'PPT 演示',audio:'音频',video:'视频',image:'图片',zip:'压缩包',other:'其他文件'};
  function cut(v, n){ v = String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); return v.length > n ? v.slice(0, n - 1) + '…' : v; }
  /* 数字徽标补单位：原来是光秃秃的「17」，不知道是 17 条笔记还是 17 个知识点 */
  function num(n, u){ return '<span class="tcnt">' + n + (u ? ' ' + E(u) : '') + '</span>'; }
  function row(o){
    return '<div class="trow" data-tree-toggle="1" role="button" tabindex="0">' +
      '<button type="button" class="tarrow" data-tree-toggle="1" aria-label="展开或收起">' + (o.closed ? '▸' : '▾') + '</button>' +
      (o.icon ? '<span class="tic">' + o.icon + '</span>' : '') +
      '<span class="tlabel">' + o.label + '</span>' + (o.count != null ? num(o.count, o.unit) : '') + '</div>';
  }
  function node(o){
    return '<div class="tnode lvl' + (o.level || 1) + (o.closed ? ' collapsed' : '') + '" data-sec="' + (o.key || '') + '">' +
      row(o) + '<div class="tkids">' + (o.body || '') + '</div></div>';
  }
  function leaf(text, key, extra){
    return '<button type="button" class="tleaf" data-tree-jump="' + key + '">' +
      '<span class="dot">◆</span><span class="tx">' + text + '</span>' + (extra || '') + '</button>';
  }
  function sub(label, count, body, closed, key){
    return node({level:2, label:label, count:count, body:body, closed:!!closed, key:key});
  }

  function current(){
    var m = /^#\/c\/([^/]+)\/([^/]+)\/([^/]+)/.exec(location.hash || '');
    var out = {course:null, term:null, week:null, review:false};
    var D = window.PORTAL_DATA;
    if(!m || !D || !D.courses) return out;
    var c = null;
    for(var i = 0; i < D.courses.length; i++){ if(D.courses[i].id === m[1]){ c = D.courses[i]; break; } }
    if(!c) return out;
    var t = null;
    for(var j = 0; j < (c.terms || []).length; j++){ if(c.terms[j].id === m[2]){ t = c.terms[j]; break; } }
    if(!t) t = (c.terms || [])[0];
    if(!t) return out;
    out.course = c; out.term = t;
    if(m[3] === 'review'){ out.review = true; return out; }
    for(var k = 0; k < t.weeks.length; k++){
      if(String(t.weeks[k].num) === String(m[3])){ out.week = t.weeks[k]; break; }
    }
    return out;
  }
  function fileGroups(files){
    var g = {}, order = [];
    (files || []).forEach(function(f){
      var r = f.role || 'other';
      if(!g[r]){ g[r] = 0; order.push(r); }
      g[r]++;
    });
    return order.slice(0, 10).map(function(r){
      return leaf(E(cut(ROLE[r] || r, 18)), 'downloads', '<span class="num">' + g[r] + '</span>');
    }).join('');
  }
  function sectionByText(txt){
    var secs = document.querySelectorAll('#app .wp-sec');
    for(var i = 0; i < secs.length; i++){
      var h = secs[i].querySelector('.wp-sec-t');
      if(h && h.textContent.indexOf(txt) >= 0) return secs[i];
    }
    return null;
  }
  function jumpTo(key){
    var el = null;
    if(key === 'downloads') el = document.querySelector('#app .wp-downloads');
    else if(key === 'other') el = document.querySelector('#app .wp-downloads .fg-sub');
    else if(key === 'review') el = document.querySelector('#app #wpReview');
    else if(key === 'activities') el = document.querySelector('#app .act-nav');
    else if(key === 'punch') el = document.querySelector('#app #wpTasks') || sectionByText('任务');
    else if(key === 'goals') el = sectionByText('学习目标');
    else if(key === 'notes') el = document.querySelector('#app .note-sec') || sectionByText('学习笔记');
    else if(key === 'answers'){
      var tab = document.querySelector('#app .note-tab[data-ntab="answers"]');
      if(tab) tab.click();
      el = tab ? tab.closest('.note-tabs') : document.querySelector('#app .eng-answers');
    }
    else if(key === 'terms') el = document.querySelector('#app .week-glossary');
    else if(key === 'top') el = document.querySelector('#app .wp-head');
    if(!el) return;
    var d = el.closest ? el.closest('details') : null;
    if(d) d.open = true;
    if(el.tagName === 'DETAILS') el.open = true;
    if(el.classList && el.classList.contains('collapsible')) el.classList.add('open');
    /* 若目标是「资料下载」里的二级分组，先把外层 details 展开 */
    if(key === 'other'){
      var box = document.querySelector('#app .wp-downloads');
      if(box && box.tagName === 'DETAILS') box.open = true;
    }
    if(el.scrollIntoView) el.scrollIntoView({behavior:'smooth', block:'start'});
    el.classList.remove('ct-flash'); void el.offsetWidth; el.classList.add('ct-flash');
  }

  function build(){
    var app = document.getElementById('app');
    if(!app) return;
    var side = app.querySelector('.week-side');
    if(!side || side.getAttribute('data-tree-done') === '1') return;
    side.setAttribute('data-tree-done', '1');
    injectCss();

    /* 先把原有节点摘出来（事件监听器绑在元素本身，搬动后依然有效） */
    var weekNav = side.querySelector('.ws-week-nav');
    var outline = side.querySelector('.ws-note-outline');
    var weekList = weekNav ? weekNav.querySelector('.ws-list') : null;
    var kpList = outline ? outline.querySelector('.kp-list') : null;
    var kpHead = outline ? outline.querySelector('.ws-head') : null;
    var kpSearch = side.querySelector('.kp-search-wrap');
    var kpEmpty = outline ? outline.querySelector('.ws-outline-empty') : null;

    var ctx = current();
    var c = ctx.course, t = ctx.term, w = ctx.week;
    var wnum = w ? w.num : 0;
    var files = w ? (w.files || []) : [];
    var general = c ? (c.generalFiles || []) : [];
    var objs = w ? toList(w.objectives) : [];
    var tasks = w ? (w.tasks || []) : [];
    /* 完成状态直接从「本周任务」已渲染的勾选框读，避免依赖主脚本内部 state */
    var doneMap = {};
    Array.prototype.forEach.call(document.querySelectorAll('#app #wpTasks .task-row input[data-task]'), function(cb){
      if(cb.checked) doneMap[cb.getAttribute('data-task')] = 1;
    });
    var acts = document.querySelectorAll('#app .act-chip').length;

    /* 1. 资料下载 */
    var secDownloads = '<div class="tree-direct">' + leaf('📎 资料下载', 'downloads') + '</div>';
    /* 2. 去复习：原「学习导航」其实只是跳到复习区的一个链接，与折叠框标题
       重名又语义误导，改成动作名；三条直连条目统一为「图标 + 短动作」 */
    var secNav = '<div class="tree-direct">' + leaf('🧭 去复习', 'review') + '</div>';
    /* 3/4. 「本周任务」「学习目标」原生成的折叠节点（secPunch / secGoals）在 11-06 导航精简后
       已改为侧栏直链（见下方 tree.innerHTML 里的 leaf 链接），不再插入 DOM，相关计算一并移除。 */

    /* 5. 学习笔记：把原有知识点树整段搬进来 */
    var kpCount = kpList ? kpList.querySelectorAll('.kp-item').length : 0;
    var grpCount = kpList ? kpList.querySelectorAll('.kp-grp').length : 0;
    var secNotes = '<section class="tnode lvl1 ws-note-outline ws-group open" data-group="' + wnum + '" data-sec="notes">' +
      row({icon:'📖', label:'学习笔记', count:kpCount, unit:'条'}) +
      '<div class="tkids"><span class="ph-kp-head"></span><span class="ph-kp-search"></span>' +
      '<span class="ph-kp-list"></span><span class="ph-kp-empty"></span>' +
      leaf('跳到笔记正文', 'notes') + '</div></section>';

    var secTerms = app.querySelector('.week-glossary')
      ? '<div class="tree-direct">' + leaf('🔤 术语表', 'terms') + '</div>' : '';

    var tree = document.createElement('div');
    tree.className = 'ws-tree';
    var secAnswers = app.querySelector('.note-tab[data-ntab="answers"], .eng-answers')
      ? '<div class="tree-direct">' + leaf('📝 课后作业答案', 'answers') + '</div>' : '';
    /* 2026-11-10：把「学习笔记」提到学习导航第一位。
       原先它排在 4 个直连卡片之后，小窗口下两条 Unit 折叠按钮被挤到侧栏
       滚动区最底部甚至视口外（用户两次反馈「还是没看见」）。目录是侧栏里
       最主要的导航，放最上面既符合「Unit 是上一级」的层级，也不用靠
       自动滚动补救。下面四个快捷链接仍然保留，只是下移。 */
    tree.innerHTML = secNotes + secDownloads + secNav + secAnswers + '<div class="tree-direct">' + leaf('📋 本周任务', 'punch') + '</div>' + secTerms;

    /* 用真实 DOM 节点替换占位符 */
    var phWeek = tree.querySelector('.ph-week');
    if(phWeek && weekList) phWeek.replaceWith(weekList);
    else if(phWeek) phWeek.remove();
    var notesKids = tree.querySelector('[data-sec="notes"] > .tkids');
    if(notesKids){
      var rep = function(cls, el){
        var ph = notesKids.querySelector('.' + cls);
        if(ph && el) ph.replaceWith(el); else if(ph) ph.remove();
      };
      rep('ph-kp-head', kpHead); rep('ph-kp-search', kpSearch);
      rep('ph-kp-list', kpList); rep('ph-kp-empty', kpEmpty);
    }
    /* 当前周锚点：即使折叠框收起，标题行也常驻「我现在在第几周」。
       文案与周次列表里的显示保持一致，避免两处对不上。 */
    if(weekNav){
      var sum = weekNav.querySelector('summary');
      if(sum && !sum.querySelector('.ws-now')){
        var nowLabel = ctx.review ? '考试总复习'
          : (w ? (w.displayLabel ? String(w.displayLabel)
              : (c && c.extra ? '模块 ' + w.num : c && c.reading ? '第 ' + w.num + ' 章' : 'Week ' + w.num)) : '');
        if(nowLabel){
          var nowTag = document.createElement('span');
          nowTag.className = 'ws-now';
          nowTag.textContent = nowLabel;
          nowTag.title = '当前所在：' + nowLabel;
          nowTag.setAttribute('aria-label', '当前所在：' + nowLabel);
          sum.appendChild(nowTag);
        }
      }
      /* 当前周不只靠颜色区分（WCAG 无障碍）：给列表项补语义标记 */
      var actItem = weekNav.querySelector('.ws-item.active');
      if(actItem) actItem.setAttribute('aria-current', 'location');
    }

    /* 两个平级折叠框：周次导航（原有 details）＋ 学习导航（新 details），
       各自带标题与箭头，open 状态互不影响，可单独展开 / 收起。 */
    var navBox = document.createElement('details');
    navBox.className = 'ws-nav-box ws-tree-nav';
    navBox.open = true;
    navBox.innerHTML = '<summary class="ws-head ws-nav-summary"><span class="ws-title">学习导航</span><span class="ws-term">课程目录</span></summary>';
    navBox.appendChild(tree);

    side.innerHTML = '';
    if(weekNav) side.appendChild(weekNav);
    side.appendChild(navBox);
    bind(tree);
  }

  function bind(tree){
    /* 「展开 / 收起」两个常驻按钮已合并进两个折叠框的标题，
       这里不再保留全局开关逻辑；每个分组仍可单独点标题折叠。 */
    tree.addEventListener('click', function(ev){
      var tg = ev.target.closest ? ev.target.closest('[data-tree-toggle]') : null;
      if(tg){
        var n = tg.closest('.tnode');
        if(n){
          n.classList.toggle('collapsed');
          var a = n.querySelector(':scope > .trow .tarrow');
          if(a) a.textContent = n.classList.contains('collapsed') ? '▸' : '▾';
        }
        return;
      }
      var j = ev.target.closest ? ev.target.closest('[data-tree-jump]') : null;
      if(j){ jumpTo(j.getAttribute('data-tree-jump')); }
    });
  }

  /* 每次 app 重绘后自动重建；MutationObserver 保证晚于 index.html 里的绑定 */
  function start(){
    if(typeof MutationObserver === 'undefined') return;
    var app = document.getElementById('app');
    if(!app) return;
    var timer = null;
    var obs = new MutationObserver(function(){
      if(timer) return;
      timer = setTimeout(function(){ timer = null; try{ build(); }catch(e){} }, 0);
    });
    obs.observe(app, {childList:true});
    build();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
