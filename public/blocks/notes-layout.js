/* ============================================================
   板块：学习笔记 · 排版渲染  [notes-layout]
   独立文件，Codex 与 WorkBuddy 改其它板块时不会碰到这里。
   内容：① 公式横线分数  ② 中英分行（中文另起一行）
   由 index.html 以 <script src> 引入，只通过 window 暴露，不依赖主闭包变量。
   建立于 2026-11-06；改本文件后请升 index.html 里的 ?v= 版本号。
   ============================================================ */
(function(){
"use strict";
/* ============ 横线分数：把公式块里的 (A)/(B) 与 [...]÷[...] 渲染成上下结构 ============
   说明：公式块 .formula 被 KaTeX 忽略（ignoredClasses），所以这里手动把数学分式
   转成 <span class="frac"><span class="n">分子</span><span class="d">分母</span></span>，
   由 .formula .frac 的 CSS 画出中间横杠。规则保守：
   - 主分数线：÷ 两边都是方括号分组 [...]÷[...]（弹性公式标准写法）；
   - 斜杠分式：/ 至少一侧是括号分组 (...) 或 [...]；
   中文分隔斜杠、含中文的 ÷、无括号的 X / Y 一律保持原样，绝不误改。 */
function enhanceFormulaFractions(root){
  if(!root) return;
  var divs = root.querySelectorAll ? root.querySelectorAll('.formula') : [];
  for(var d=0; d<divs.length; d++){
    var el = divs[d];
    if(el.getAttribute('data-frac-done') === '1') continue;
    el.setAttribute('data-frac-done','1');
    el.innerHTML = formulaToFrac(el.innerHTML);
  }
}
window.enhanceFormulaFractions = enhanceFormulaFractions;
function formulaFracFind(str,pos,open,close){var depth=0;for(var i=pos;i<str.length;i++){if(str[i]===open)depth++;else if(str[i]===close){depth--;if(depth===0)return i;}}return -1;}
function formulaFracRFind(str,pos,open,close){var depth=0;for(var i=pos;i>=0;i--){if(str[i]===close)depth++;else if(str[i]===open){depth--;if(depth===0)return i;}}return -1;}
var FORMULA_FRAC_STOP = {"/":1,"(":1,")":1,"[":1,"]":1,"÷":1,"×":1,"=":1,";":1,":":1,"。":1,",":1,"<":1,">":1,"&":1};
function formulaFracLeft(str,at){
  var i=at-1; while(i>=0 && (str[i]===" "||str[i]===" ")) i--;
  if(i<0) return null;
  if(str[i]===")"||str[i]==="]"){var sq=str[i]==="]";var o=sq?formulaFracRFind(str,i,"[","]"):formulaFracRFind(str,i,"(",")");if(o<0)return null;return {start:o,end:i+1,bracket:true,sq:sq};}
  var j=i; while(j>=0 && !FORMULA_FRAC_STOP[str[j]]) j++; j++; if(j>i) return null;
  return {start:j,end:i+1,bracket:false,sq:false};
}
function formulaFracRight(str,at){
  var i=at+1; while(i<str.length && (str[i]===" "||str[i]===" ")) i++;
  if(i>=str.length) return null;
  if(str[i]==="("||str[i]==="["){var sq=str[i]==="[";var c=sq?"]":")";var e=formulaFracFind(str,i,sq?"[":"(",c);if(e<0)return null;return {start:i,end:e+1,bracket:true,sq:sq};}
  var j=i; while(j<str.length && !FORMULA_FRAC_STOP[str[j]]) j++; if(j===i) return null;
  return {start:i,end:j,bracket:false,sq:false};
}
function formulaToFrac(str){
  function frac(n,den){return '<span class="frac"><span class="n">'+n+'</span><span class="d">'+den+'</span></span>';}
  /* A: [...] ÷ [...] -> 主分数线 */
  var changed=true;
  while(changed){ changed=false;
    for(var i=0;i<str.length;i++){ if(str[i]==="÷"){
      var L=formulaFracLeft(str,i), R=formulaFracRight(str,i);
      if(L&&R&&L.bracket&&R.bracket&&L.sq&&R.sq){
        str=str.slice(0,L.start)+frac(str.slice(L.start,L.end),str.slice(R.start,R.end))+str.slice(R.end); changed=true; break;
      }
    } }
  }
  /* B: 斜杠分式（至少一侧带括号） */
  changed=true;
  while(changed){ changed=false;
    for(var k=0;k<str.length;k++){ if(str[k]==="/"){
      var L2=formulaFracLeft(str,k), R2=formulaFracRight(str,k);
      if(L2&&R2&&(L2.bracket||R2.bracket)){
        str=str.slice(0,L2.start)+frac(str.slice(L2.start,L2.end),str.slice(R2.start,R2.end))+str.slice(R2.end); changed=true; break;
      }
    } }
  }
  return str;
}


/* ===== 中英分行：段落级语言边界换行（2026-11-09 v3） =====
   2026-11-09 线上真实浏览器复验发现 v2 只分行了 20.9% 的双语段落：
   英文与中文常被 <strong>/<em> 拆成不同文本节点，逐节点扫描时每个节点都是单语，
   于是「Accounting identifies... <strong>会计</strong>是识别...」这类最典型的段落全被跳过。
   v3 改为以「段落」为单位：把段落内所有文本节点拼接成完整文本 → 找语言切换边界
   → 把切点映射回具体节点插入 <br class="cn-br">。这样口径与数据回归测试一致。
   - 中文阈值放宽到 2 个汉字（v2 是 5），覆盖率 61.6% → 75.8%，纯单语误分行仍为 0
   - 课件来源行（PDF 文件名 / 页码）整段跳过，避免把紧凑的来源标注拆开
   - 段落最多 3 处换行；data-cn-split 幂等；不动 data.js（四视图读原始 HTML 不受影响）
   - 公式、KaTeX、表格、标题、按钮、目录、手工双语折叠区一律跳过 */
var CN_PARA_SEL = '.gx p,.gx li,.gx dd,.gx dt,.gx blockquote,' +
  '.notes p,.notes li,.notes dd,.notes dt,.notes blockquote';
/* 段落级跳过：这些容器里的正文不做分行。注意 .gx-pg-b / .kp-pg 是笔记正文容器，
   v2 误把它们列入跳过清单，是「线上分行没生效」的第二个原因，这里已移除。 */
var CN_SKIP_PARA = 'script,style,textarea,button,h1,h2,h3,h4,h5,h6,' +
  'table,details,summary,.formula,.frac,.katex,.kp-src,.kp-pg-src,.gx-src,.gx-pg-h,.cfig,' +
  '.elasticity-glossary,.elasticity-term,.elasticity-definition,' +
  '.act-nav,.act-chip,.reading-tools,.note-tools,.nb-tools,.nb-grp-h,.nb-tip,.nb-chips,.rt-chip,' +
  '.prep-q,.pq-t,.kp-q,.kp-qbox,.note-tab,.note-exp,.ne-btn,.ws-item,.kp-item,.kp-grp,' +
  '.wp-sec-t,.eng-sec-t,.wp-topics,.chip,.goal-card,.sum-kp,.to-top';
/* 文本节点级跳过：拼接时仍占位（保证下标对齐），但不参与换行插入 */
var CN_SKIP_NODE = 'script,style,textarea,button,a,h1,h2,h3,h4,h5,h6,' +
  'table,th,td,caption,details,summary,math,svg,' +
  '.formula,.frac,.katex,.katex-html,.katex-mathml,.kp-src,.kp-pg-src,.gx-src,.gx-pg-h,.cfig,' +
  '.elasticity-term,.elasticity-definition';
var CN_SOURCE_RE = /(\.(pdf|pptx|docx)|PDF\s*p\d|Lecture\s+\d|课件页码|课件释义|来源[:：]|^\s*Source\s*:)/i;
function cnClass(ch){
  if(/[\u3400-\u9fff]/.test(ch)) return 'cn';
  if(/[A-Za-z0-9]/.test(ch)) return 'en';
  return 'mid';
}
/* 紧跟在开括号 / 引号之后的切点不换行：像「（market equilibrium）」
   「（slope ≠ elasticity）」这类夹注术语，单独拆成一行会把句子切碎。
   只判断紧邻字符，不做整段括号深度累计——否则中英混排里大量括号会让
   后续所有正常边界都被误跳过（实测会把覆盖率从 76.6% 压到 62.5%）。 */
function cnAfterOpen(s, at){
  var i = at - 1;
  while(i >= 0 && /[\s\u00a0]/.test(s.charAt(i))) i--;
  return i >= 0 && '（(「【《'.indexOf(s.charAt(i)) >= 0;
}
/* 返回应断行的下标数组。两侧都成句才断：
   英文段须含 ≥2 个 3 字母以上单词，中文段须含 minCn 个汉字（默认 5，渲染时用 2）；
   相邻切点间隔 <12 字符跳过，避免把段落切碎或误拆术语夹注。 */
function cnBoundaries(s, limit, minCn){
  minCn = minCn || 5;
  var segs = [], cur = null, i, c;
  for(i = 0; i < s.length; i++){
    c = cnClass(s.charAt(i));
    if(c === 'mid'){ if(cur) cur.end = i + 1; continue; }
    if(!cur || cur.type !== c){
      cur = { type: c, start: i, end: i + 1 };
      segs.push(cur);
    } else cur.end = i + 1;
  }
  var out = [];
  for(var j = 0; j < segs.length - 1; j++){
    var a = segs[j], b = segs[j + 1];
    if(a.type === b.type) continue;
    var aTxt = s.slice(a.start, a.end), bTxt = s.slice(b.start, b.end);
    var enTxt = a.type === 'en' ? aTxt : bTxt;
    var cnTxt = a.type === 'cn' ? aTxt : bTxt;
    if((enTxt.match(/[A-Za-z]{3,}/g) || []).length < 2) continue;
    if((cnTxt.match(/[\u3400-\u9fff]/g) || []).length < minCn) continue;
    var at = b.start;
    if(at < 2 || at >= s.length - 1) continue;
    if(cnAfterOpen(s, at)) continue;
    if(out.length && at - out[out.length - 1] < 12) continue;
    out.push(at);
    if(out.length >= limit) break;
  }
  return out;
}
/* 收集段落内全部文本节点，返回拼接文本 + 可插入节点的位置区间 */
function cnCollect(para){
  var walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT, null, false);
  var parts = [], ranges = [], pos = 0, n;
  while((n = walker.nextNode())){
    var v = n.nodeValue || '';
    parts.push(v);
    var p = n.parentNode, skip = false;
    if(p && p.closest) skip = !!p.closest(CN_SKIP_NODE);
    if(!skip) ranges.push({ node: n, start: pos, end: pos + v.length });
    pos += v.length;
  }
  return { text: parts.join(''), ranges: ranges };
}
var CN_INLINE_RE = /^(STRONG|EM|B|I|SPAN|SMALL|CODE|MARK|U|S|SUB|SUP|A)$/;
/* 内联标签在拼接文本中的起始位置，用于判断它是否在段落开头 */
function cnHostStart(ranges, host){
  for(var q = 0; q < ranges.length; q++){
    if(ranges[q].node.parentNode === host) return ranges[q].start;
  }
  return -1;
}
function cnNewBr(){ var b = document.createElement('br'); b.className = 'cn-br'; return b; }
/* 在切点处插入 <br>。切点落在 <strong>/<span class="key"> 等内联标签里时，
   不能把 br 塞进标签内部（会生成 <strong>Classification tip ·<br>易错点</strong>），
   而应把换行上浮到整个标签之前：
     · 标签在段落中间（前面已有正文）→ 插在标签前，中文解释随标签一起另起一行；
     · 标签就在段首（如「Classification tip · 易错点」标题本身）→ 跳过，不制造空行。 */
function cnInsertBr(ranges, at, para){
  for(var i = 0; i < ranges.length; i++){
    var r = ranges[i], node = r.node;
    if(at < r.start || at >= r.end) continue;
    var off = at - r.start, host = node.parentNode;
    var inInline = host && host !== para && CN_INLINE_RE.test(host.tagName || '');
    if(inInline){
      if(cnHostStart(ranges, host) < 12) return false;
      if(!host.parentNode) return false;
      host.parentNode.insertBefore(cnNewBr(), host);
      return true;
    }
    var tail = off > 0 ? node.splitText(off) : node;
    if(off > 0) node.nodeValue = String(node.nodeValue).replace(/[\s\u00a0]+$/, '');
    tail.nodeValue = String(tail.nodeValue).replace(/^[\s\u00a0]+/, '');
    if(!host) return false;
    host.insertBefore(cnNewBr(), tail);
    return true;
  }
  return false;
}
function splitCnLines(root){
  if(!root || !root.querySelectorAll || typeof document.createTreeWalker !== 'function') return;
  alignLedgerColumns(root);
  var paras = root.querySelectorAll(CN_PARA_SEL);
  if(!paras.length) return;
  var done = 0;
  for(var i = 0; i < paras.length; i++){
    var para = paras[i];
    if(para.getAttribute && para.getAttribute('data-cn-split')) continue;
    /* 含嵌套段落的外层 li/blockquote 不单独处理，避免同一段文字被切两次 */
    if(para.querySelector && para.querySelector('p,li,dd,dt,blockquote')) continue;
    if(para.closest && para.closest(CN_SKIP_PARA)) continue;
    var got = cnCollect(para), full = got.text;
    if(full.length < 12 || !/[\u3400-\u9fff]/.test(full) || !/[A-Za-z]{3,}/.test(full)) continue;
    /* 课件来源行是紧凑元数据，不该被拆成两行 */
    if(full.length < 160 && CN_SOURCE_RE.test(full)) continue;
    var cuts = cnBoundaries(full, 3, 2);
    if(!cuts.length) continue;
    /* 从后往前插，先改动的节点不会让前面切点的下标失效 */
    var added = 0;
    for(var k = cuts.length - 1; k >= 0; k--){
      if(cnInsertBr(got.ranges, cuts[k], para)) added++;
    }
    if(added && para.setAttribute) para.setAttribute('data-cn-split', String(added));
    done += added;
  }
  return done;
}
window.splitCnLines = splitCnLines;
window.__cnSplitTest = { cnBoundaries: cnBoundaries, cnClass: cnClass };

/* ===== 笔记大类分组配置（2026-11-06 由 index.html 迁入本板块） =====
   用户要求删掉「本周概览与目标」这一大类，笔记打开就直接是教授内容。
   旧的第一组会把 Weekly Overview / Core Concepts / Definitions 全收进去；
   现在取消该组，这些小节按下面规则分类，没命中的统一归「核心知识点」。
   以后调整大类只改这里，不用碰共享骨架。 */
var NOTES_GROUPS = [
  { name:'方法与步骤', re:/(method|step|procedure|process|how to|rule|principle|convention|方法|步骤|流程|规则|原则|准则|怎样做|操作)/i },
  { name:'公式与计算', re:/(equation|formula|calculat|comput|deriv|公式|等式|计算|推导|求解)/i },
  { name:'例题与练习', re:/(example|exercise|practice|question|answer|worked|quiz|例题|练习|习题|答案|案例|自测|作业)/i },
  { name:'表格与小结', re:/(table|chart|diagram|summary|key details|表格|图表|小结|总结|重点详解|汇总)/i },
  { name:'补充与拓展', re:/(reading|preview|appendix|supplement|bridging|补充|拓展|预告|延伸|承上启下|下周)/i },
  { name:'核心知识点', re:null }
];
window.NotesGroups = NOTES_GROUPS;

/* ===== 删掉「本周概览与目标」铺垫，笔记直接开始教授内容（2026-11-06） =====
   不动 data.js（4.7MB 课程数据禁止重建），只在渲染层移除节点：
   ① 页面级「🎯 本周学习目标」区块与头部的「N 个学习目标」徽章；
   ② 笔记正文里标题是 Overview / 概览 / 学习目标 的分节，连同其下段落
      （直到下一个 h3/h4 或课件页为止）；Core Concepts、例题等教授内容一律保留；
   ③ 左侧「学习笔记目录」里指向已删锚点的条目，避免出现点了没反应的死链。
   四视图读的是原始 HTML 字符串，不受影响；PDF / Word 导出读当前 DOM，会一并去掉。 */
var INTRO_HEAD_RE = /(\boverview\b|weekly\s*overview|本周概览|本单元概览|单元概览|章节总览|复习总览|learning\s+objectives?|本周学习目标|学习目标|章节路线|先读什么|本章导读|本单元导读|课程导论|^\s*导论|^\s*概述)/i;
function isSectionStart(n){
  if(!n || !n.tagName) return false;
  if(/^(H3|H4)$/.test(n.tagName)) return true;
  if(n.classList && n.classList.contains('kp-pg')) return true;
  var fc = n.firstElementChild;
  return !!(fc && /^(H3|H4)$/.test(fc.tagName));
}
function stripNotesIntro(root){
  if(!root || !root.querySelectorAll) return;
  var drop = function(el){ if(el && el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el); };
  /* ① 页面级区块与徽章 */
  Array.prototype.forEach.call(root.querySelectorAll('.wp-sec'), function(sec){
    var t = sec.querySelector ? sec.querySelector('.wp-sec-t') : null;
    var txt = t ? (t.textContent || '') : '';
    if(/学习目标/.test(txt) && !/笔记/.test(txt)) drop(sec);
  });
  Array.prototype.forEach.call(root.querySelectorAll('.badge-outline'), function(b){
    if(/个学习目标/.test(b.textContent || '')) drop(b);
  });
  /* ② 笔记正文的概览分节 */
  var removedIds = [];
  Array.prototype.forEach.call(root.querySelectorAll('.gx, .notes'), function(host){
    var tops = Array.prototype.slice.call(host.children);
    var spans = [], i = 0;
    /* 只处理「笔记开头」连续的概览/目标分节：遇到第一块教授内容就停。
       正文中间的 Question Overview / 期中复习总览等一律保留，绝不误删正文。 */
    while(i < tops.length && !isSectionStart(tops[i])) i++;
    while(i < tops.length && spans.length < 2){
      var n = tops[i], head = null;
      if(/^(H3|H4)$/.test(n.tagName)) head = n;
      else if(n.firstElementChild && /^(H3|H4)$/.test(n.firstElementChild.tagName)) head = n.firstElementChild;
      else if(n.classList && n.classList.contains('kp-pg') && n.querySelector) head = n.querySelector('h4.kp-pg-h,h3,h4');
      if(!head || !INTRO_HEAD_RE.test(String(head.textContent || '').replace(/\s+/g,' ').trim())) break;
      var j = i + 1;
      while(j < tops.length && !isSectionStart(tops[j])) j++;
      /* 最后一节不再删：宁可留一段概览，也不把整篇笔记删空 */
      if(j >= tops.length) break;
      spans.push([i, j]);
      i = j;
    }
    var cut = 0;
    spans.forEach(function(sp){ cut += sp[1] - sp[0]; });
    /* 删完至少还要剩 2 个节点，防止极端结构下误伤正文 */
    if(cut === 0 || tops.length - cut < 2) return;
    spans.forEach(function(sp){
      for(var k = sp[0]; k < sp[1]; k++){
        var el = tops[k];
        var id = el.getAttribute ? el.getAttribute('data-kp') : null;
        if(id) removedIds.push(id);
        drop(el);
      }
    });
  });
  /* ③ 同步清掉左侧目录里的死链 */
  removedIds.forEach(function(id){
    var b = root.querySelector('.kp-item[data-kp-jump="' + id + '"]');
    if(b) drop(b);
  });
}
window.stripNotesIntro = stripNotesIntro;

/* ===== 英语笔记：取消「笔记大类」折叠，顺着学习顺序连续展示（2026-11-06） =====
   用户要求：英语练习里的「方法与步骤」不该再单独列成一个可折叠板块，
   内容直接按原来的学习顺序排下去。
   识别方式：英语周页专属的 .eng-class / .eng-sec 布局（不依赖网址，切周也准）。
   做法：分组条与「笔记大类」工具框整体移除，清掉所有折叠态和标题上的折叠把手，
   主闭包里绑定的折叠事件随之不再命中；其它课程完全不受影响。 */
function flattenEnglishNotes(root){
  if(!root || !root.querySelector || !root.querySelectorAll) return;
  if(!root.querySelector('.eng-class, .eng-sec')) return;  /* 不是英语周页就什么都不做 */
  Array.prototype.forEach.call(root.querySelectorAll('.reading-tools.nb-tools, .nb-grp-h'), function(el){
    if(el.parentNode) el.parentNode.removeChild(el);
  });
  Array.prototype.forEach.call(root.querySelectorAll('.nb-hide, .nb-handle, .nb-collapsed, .kp-pg.collapsed'), function(el){
    el.classList.remove('nb-hide', 'nb-handle', 'nb-collapsed', 'collapsed');
  });
}
window.flattenEnglishNotes = flattenEnglishNotes;

/* ===== 按知识点折叠：取代「按大类折叠」（2026-11-06） =====
   用户定义：点开笔记 → 看到「已经全部折叠好的所有知识点」列表
   （1 PED 概念、2 PED 分类、3 PED 公式、4 Determinants of PED、5 收入弹性…）；
   点某个知识点 → 展开该知识点的详细讲解；PPT 里的例题归入所属知识点，
   显示为「例题 N：xxx」+ 题干 + 解析，不再单独占一条折叠。
   做法（不动 data.js，只在渲染层重排 enhanceNotesReading 生成的分组结果）：
   ① 删掉「笔记大类」分组条与大类 chips，工具框改成「知识点 · N 个」；
   ② 标题是 ✏️ 例题 / Example 的小节，把它的节点移交前一个知识点，
      于是点知识点时例题与解析随讲解一起展开；
   ③ 知识点标题加卡片样式 + CSS counter 自动编号（编号不写进 DOM，导出更干净）。
   英语笔记保持上一版「顺着学习顺序全部展开」，不参与折叠。 */
var KPF_CSS = [
  '.gx.kp-fold-on,.notes.kp-fold-on{counter-reset:kpf}',
  '.gx .kp-fold-h,.notes .kp-fold-h{counter-increment:kpf;display:flex!important;align-items:center;gap:10px;' +
    'margin:16px 0 0!important;padding:12px 14px!important;border:1px solid #d9e6f5!important;border-bottom:0!important;' +
    'border-radius:10px!important;background:#f7fbff;color:#163a5f;line-height:1.55;cursor:pointer;user-select:none}',
  '.gx .kp-fold-h:not(.nb-collapsed),.notes .kp-fold-h:not(.nb-collapsed){background:#eaf4ff;border-color:#a9c9ea!important}',
  '.gx .kp-fold-h:hover,.notes .kp-fold-h:hover{border-color:#8fb8e2!important}',
  '.gx .kp-fold-h::before,.notes .kp-fold-h::before{content:counter(kpf,decimal-leading-zero);flex:0 0 auto;' +
    'display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:26px;padding:0 6px;' +
    'border-radius:8px;background:#16569c;color:#fff;font-size:12px;font-weight:800;letter-spacing:.3px}',
  '.gx .kp-ex-h,.notes .kp-ex-h{margin:16px 0 8px!important;padding:0!important;background:none!important;border:0!important;border-radius:0!important}',
  '@media print{' +
    '.gx .kp-fold-h::before,.notes .kp-fold-h::before{content:none!important}' +
    '.gx .kp-fold-h,.notes .kp-fold-h,.gx .kp-ex-h,.notes .kp-ex-h{display:block!important;border:0!important;' +
    'border-bottom:1px solid #ccd7e4!important;background:none!important;color:inherit!important;' +
    'padding:0 0 6px!important;margin:14px 0 8px!important;border-radius:0!important}' +
  '}'
].join('\n');
function kpInjectCss(){
  if(!document.head || (document.getElementById && document.getElementById('kpfold-css'))) return;
  var st = document.createElement('style');
  st.setAttribute('id', 'kpfold-css');
  st.textContent = KPF_CSS;
  document.head.appendChild(st);
}
function isExampleTitle(t){
  var s = String(t || '');
  return /(^\s*✏️|^\s*例题\s*\d|^\s*例\s*\d|^\s*(Worked\s+)?Example\s*\d)/i.test(s) ||
         /(^|[\s·(（])例题\s*\d/i.test(s);
}
function exampleTitle(t){
  var s = String(t || '').replace(/^[\s✏️]+/, '');
  var m = /^例题\s*(\d*)\s*[·:：\-–—]?\s*(.+)$/.exec(s);
  if(m) return '例题' + (m[1] ? ' ' + m[1] : '') + '：' + m[2];
  m = /^(?:Worked\s+)?Example\s*(\d*)\s*[·:：\-–—]?\s*(.+)$/i.exec(s);
  if(m) return '例题' + (m[1] ? ' ' + m[1] : '') + '：' + m[2];
  return '例题：' + s;
}
function kpRemove(el){ if(el && el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el); }
/* 与骨架 nbSetBlock 等价的展开/收起（用于目录跳转时自动展开，不改动骨架） */
function kpSetOpen(b, open){
  if(!b) return;
  b.__collapsed = !open;
  if(b.page){
    if(b.head && b.head.classList) b.head.classList.toggle('collapsed', !open);
  }else{
    (b.nodes || []).forEach(function(n){ if(n !== b.head && n.classList) n.classList.toggle('nb-hide', !open); });
  }
  if(b.__handle && b.__handle.classList) b.__handle.classList.toggle('nb-collapsed', !open);
}
function kpOpenById(id){
  if(!id) return;
  var el = document.querySelector('[data-kp="' + id + '"]');
  if(!el) return;
  kpSetOpen(el.__kpOwner || el.__nbBlock, true);
}
function kpBindJump(){
  if(window.__kpFoldJumpBound) return;
  window.__kpFoldJumpBound = true;
  document.addEventListener('click', function(ev){
    var t = ev && ev.target && ev.target.closest ? ev.target.closest('[data-kp-jump],[data-sum-jump]') : null;
    var id = t ? (t.getAttribute('data-kp-jump') || t.getAttribute('data-sum-jump')) : null;
    if(!id) return;
    setTimeout(function(){ kpOpenById(id); }, 80);
  }, true);
}
function rebuildNotesFold(root){
  if(!root || !root.querySelector) return;
  var pane = root.querySelector('.note-pane.active');
  if(!pane) return;
  var pageLabel = /^(?:✏️\s*)?(?:例题[：:]\s*)?第\s*(\d+)\s*页\s*[·・]\s*例题$/;
  function removePageLabel(head) {
    var match = pageLabel.exec(head.textContent.trim());
    if(!match || head.querySelector('img, svg, math, table, a')) return;
    var page = head.closest('.gx-example') || head.nextElementSibling;
    if(page) page.setAttribute('data-source-page', match[1]);
    if(head.__nbBlock) {
      head.hidden = true;
      head.classList.remove('kp-ex-h', 'kp-fold-h', 'nb-handle');
    } else {
      kpRemove(head);
    }
  }
  /* 英语笔记保持上一版设定：顺着学习顺序全部展开，不做知识点折叠 */
  if(pane.querySelector('.eng-class, .eng-sec')) {
    pane.querySelectorAll('h3, h4, .gx-example .gx-pg-h').forEach(removePageLabel);
    return;
  }
  var hosts = pane.querySelectorAll('.gx, .notes');
  if(!hosts.length) return;
  kpInjectCss();
  /* ① 去掉「笔记大类」分组条 */
  Array.prototype.forEach.call(pane.querySelectorAll('.nb-grp-h'), kpRemove);
  /* ② 工具框：删掉大类 chips 与旧提示，保留「全部收起 / 全部展开」 */
  var tools = pane.querySelector('.reading-tools.nb-tools');
  if(tools) Array.prototype.forEach.call(tools.querySelectorAll('.nb-chips, .nb-tip'), kpRemove);
  /* ③ 逐块重排：知识点编号成卡片，例题并入所属知识点 */
  var total = 0;
  Array.prototype.forEach.call(hosts, function(host){
    var tops = Array.prototype.slice.call(host.children || []);
    var lastKp = null, changed = false;
    tops.forEach(function(n){
      var h = null;
      if(n.classList && n.classList.contains('nb-handle')) h = n;
      else if(n.querySelector) h = n.querySelector('h3.nb-handle,h4.nb-handle');
      if(!h || !h.__nbBlock) return;
      var b = h.__nbBlock;
      var t = String(h.textContent || '').replace(/\s+/g,' ').trim();
      var ex = isExampleTitle(t);
      if(ex && lastKp){
        /* 例题 + 题干 + 解析整体移交前一个知识点，随它一起展开 / 收起 */
        (b.nodes || []).forEach(function(x){ if(lastKp.nodes.indexOf(x) < 0) lastKp.nodes.push(x); });
        b.__attachedTo = lastKp;
        h.__kpOwner = lastKp;
        h.classList.remove('nb-handle');
        h.classList.add('kp-ex-h');
        if(!h.children || !h.children.length) h.textContent = exampleTitle(t);
        changed = true;
      }else if(!ex){
        lastKp = b;
        h.classList.add('kp-fold-h');
        total++;
        changed = true;
      }
    });
    if(changed) host.classList.add('kp-fold-on');
  });
  pane.querySelectorAll('h3, h4, .gx-example .gx-pg-h').forEach(removePageLabel);
  /* ④ 工具框文案改成知识点计数 */
  if(tools){
    var lab = tools.querySelector('.rt-label');
    if(lab) lab.textContent = '知识点 · ' + total + ' 个（点标题展开讲解与例题）';
  }
  /* ⑤ 从左侧目录 / 知识点归纳跳转过来时，自动展开对应知识点 */
  kpBindJump();
  setTimeout(function(){
    var a = document.querySelector('.kp-item.active[data-kp-jump]');
    if(a) kpOpenById(a.getAttribute('data-kp-jump'));
  }, 260);
}
window.rebuildNotesFold = rebuildNotesFold;
window.__kpFoldTest = { isExampleTitle: isExampleTitle, exampleTitle: exampleTitle };

/* ===== 重点 / 易错易混：标红 + 高亮（2026-11-06） =====
   用户要求「重点和易错易搞混标红然后再高亮」。数据里这些内容是明确标记的：
   ① .kp-key（488 处）= 考点 / 重点 / 写题提醒段；
   ② .c-red（436 处）= 已经标红的易错强调，这里再补一层高亮；
   ③ Common Mistakes & Confusions / Common Pitfalls / 常见错误与易混点 等小节；
   ④ 行内 <strong> 标签「Classification tip · 易错点」「考点：」等。
   两档视觉：强高亮 = 红字 + 荧光黄底 + 左侧红条（重点块 / 易错标题 / 行内标签）；
             淡高亮 = 红字 + 浅黄底（已标红内容、易错小节正文），避免满屏刺眼。
   颜色与底色写进**内联 style**，这样 PDF（html2pdf 读当前 DOM）与 Word
   （pane.innerHTML + 独立 CSS）导出都能带上；border / 圆角 / 内边距由注入 CSS 负责。 */
var HL_RED = '#a5261a', HL_STRONG_BG = '#fff3b0', HL_SOFT_BG = '#fffbe6';
var HL_CSS = [
  '.kp-mark{border-left:4px solid #d93025;padding:7px 12px;border-radius:6px;' +
    'box-decoration-break:clone;-webkit-box-decoration-break:clone;' +
    '-webkit-print-color-adjust:exact;print-color-adjust:exact}',
  '.kp-mark-soft{border-radius:4px;box-decoration-break:clone;-webkit-box-decoration-break:clone;' +
    '-webkit-print-color-adjust:exact;print-color-adjust:exact}',
  'strong.kp-mark{border-left:0;padding:1px 5px;font-weight:800}',
  'td.kp-mark,td.kp-mark-soft{border-left:0}',
  '@media print{.kp-mark,.kp-mark-soft{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
].join('\n');
var HL_ERR_HEAD_RE = /(易错|易混|常见错误|常见失分|失分点|混淆|陷阱|正误对照|高频错误|Common\s+Mistakes?|Common\s+Errors?|Common\s+Pitfalls?|Common\s+Confusions?|Pitfalls?|Confusions?\s*Check|Mistakes?\s*&\s*Confusions?)/i;
var HL_TAG_RE = /(易错|易混|混淆|常见错误|失分|考点|重点|注意|⚠️|Key\s+Point|Common\s+Mistake|Pitfall|Caution)/i;
function hlInjectCss(){
  if(!document.head || (document.getElementById && document.getElementById('kphl-css'))) return;
  var st = document.createElement('style');
  st.setAttribute('id', 'kphl-css');
  st.textContent = HL_CSS;
  document.head.appendChild(st);
}
function hlText(el){ return String(el && el.textContent || '').replace(/\s+/g,' ').trim(); }
function hlEach(list, fn){ Array.prototype.forEach.call(list || [], fn); }
function hlPaint(el, level){
  if(!el || !el.style || !el.classList) return;
  if(el.classList.contains('kp-mark') || el.classList.contains('kp-mark-soft')) return;
  el.style.color = HL_RED;
  el.style.backgroundColor = (level === 'strong') ? HL_STRONG_BG : HL_SOFT_BG;
  el.classList.add(level === 'strong' ? 'kp-mark' : 'kp-mark-soft');
}
function hlHeadOf(n){
  if(!n || !n.tagName) return null;
  if(/^(H3|H4)$/.test(n.tagName)) return n;
  if(n.firstElementChild && /^(H3|H4)$/.test(n.firstElementChild.tagName)) return n.firstElementChild;
  if(n.classList && n.classList.contains('kp-pg') && n.querySelector) return n.querySelector('h4.kp-pg-h,h3,h4');
  return null;
}
function hlBindReapply(root){
  window.__hlRoot = root;
  if(window.__hlReapplyBound) return;
  window.__hlReapplyBound = true;
  /* 四视图切换会重建面板 DOM，切完补一次高亮（幂等，已处理元素自动跳过） */
  document.addEventListener('click', function(ev){
    var t = ev && ev.target && ev.target.closest ? ev.target.closest('[data-view-btn]') : null;
    if(!t) return;
    setTimeout(function(){ if(window.__hlRoot) highlightKeyPoints(window.__hlRoot); }, 180);
  }, true);
}
function highlightKeyPoints(root){
  if(!root || !root.querySelectorAll) return;
  alignLedgerColumns(root);
  hlInjectCss();
  /* ① 考点 / 重点 / 易错提示段，以及备考复习的警告块 → 强高亮 */
  hlEach(root.querySelectorAll('.kp-key, .er-warn'), function(el){ hlPaint(el, 'strong'); });
  /* ② 已标红的强调内容 → 补一层淡高亮 */
  hlEach(root.querySelectorAll('.c-red'), function(el){ hlPaint(el, 'soft'); });
  /* ③ 行内显式标签「Classification tip · 易错点」「考点：」→ 强高亮 */
  hlEach(root.querySelectorAll('strong'), function(el){
    var t = hlText(el);
    if(t && t.length <= 40 && HL_TAG_RE.test(t)) hlPaint(el, 'strong');
  });
  /* ④ 易错 / 易混 / 常见错误小节：标题强高亮，节内正文淡高亮 */
  hlEach(root.querySelectorAll('.gx, .notes'), function(host){
    var tops = Array.prototype.slice.call(host.children || []);
    tops.forEach(function(n, i){
      var h = hlHeadOf(n);
      if(!h || !HL_ERR_HEAD_RE.test(hlText(h))) return;
      hlPaint(h, 'strong');
      for(var j = i + 1; j < tops.length && !isSectionStart(tops[j]); j++){
        var el = tops[j];
        if(/^(P|LI)$/.test(el.tagName)) hlPaint(el, 'soft');
        else if(el.querySelectorAll) hlEach(el.querySelectorAll('p,li'), function(x){ hlPaint(x, 'soft'); });
      }
    });
  });
  hlBindReapply(root);
}
window.highlightKeyPoints = highlightKeyPoints;

/* ===== 账表金额列统一右对齐（2026-11-09 全站宽度修复） =====
   用户要求 Trial Balance / Journal / Financial Statements 等表格的金额列右对齐。
   数据里金额列没有统一 class，这里按「表头文字」识别 Debit/Credit/金额/借/贷/余额/合计
   等列，再把该列所有单元格右对齐；纯文本列（如 Account / 归类 / 说明）不受影响。
   只动内联 style.textAlign，PDF / Word 导出克隆 DOM 一并带走，幂等可重复执行。 */
var LEDGER_RE = /debit|credit|\bdr\b|\bcr\b|amount|金额|借|贷|balance|余额|合计|total|小计|\$|¥|€|£/i;
function alignLedgerColumns(root){
  if(!root || !root.querySelectorAll) return;
  var tables = root.querySelectorAll('table');
  Array.prototype.forEach.call(tables, function(tbl){
    if(!tbl.rows || !tbl.rows.length) return;
    var head = tbl.tHead ? tbl.tHead.rows[0] : tbl.rows[0];
    if(!head || !head.cells) return;
    var idxs = [];
    for(var h = 0; h < head.cells.length; h++){
      if(LEDGER_RE.test(String(head.cells[h].textContent || '').replace(/\s+/g, ' '))) idxs.push(h);
    }
    if(!idxs.length) return;
    Array.prototype.forEach.call(tbl.rows, function(row){
      for(var k = 0; k < idxs.length; k++){
        var c = row.cells[idxs[k]];
        if(c && c.style) c.style.textAlign = 'right';
      }
    });
  });
}
window.alignLedgerColumns = alignLedgerColumns;

})();

window.renderNoteGlossary = function(week, esc) {
  if (!week.terms || !week.terms.length) return '';
  const cards = week.terms.map(function(term) {
    const definition = term.def || term.supplementaryDef || '';
    return '<details class="elasticity-term" data-term="' + esc(term.en || term.cn || '') +
      '"><summary><strong>' + esc(term.cn || term.en || '') + '</strong>' +
      (term.cn && term.en ? '<small>' + esc(term.en) + '</small>' : '') +
      '</summary><div class="elasticity-definition"><p>' +
      esc(definition || '本周笔记暂未提供释义。') + '</p></div></details>';
  }).join('');
  return '<section class="wp-sec week-glossary"><div class="wp-sec-t">术语表</div>' +
    '<div class="elasticity-glossary"><p>先回想术语的意思，再展开核对。</p>' + cards + '</div></section>';
};

window.mergeNoteGlossaries = function(root) {
  let section = root.querySelector('.week-glossary');
  const inline = [...root.querySelectorAll('.elasticity-glossary')].filter(el => !el.closest('.week-glossary'));
  for (const heading of root.querySelectorAll('h3, h4')) {
    if (!/^Terms and Concepts 答案$/i.test(heading.textContent.trim())) continue;
    const paragraph = heading.nextElementSibling;
    if (!paragraph || paragraph.tagName !== 'P' || !paragraph.querySelector('b')) continue;
    const glossary = document.createElement('div');
    glossary.className = 'elasticity-glossary';
    let definition;
    for (const child of [...paragraph.childNodes]) {
      if (child.nodeName === 'B') {
        const card = document.createElement('details');
        card.className = 'elasticity-term';
        card.dataset.term = child.textContent.trim();
        const summary = card.appendChild(document.createElement('summary'));
        summary.appendChild(document.createElement('strong')).textContent = card.dataset.term;
        definition = card.appendChild(document.createElement('div'));
        definition.className = 'elasticity-definition';
        glossary.appendChild(card);
      } else if (definition) {
        if (child.nodeType === Node.TEXT_NODE && !definition.hasChildNodes()) {
          child.textContent = child.textContent.replace(/^\s*[：:]\s*/, '');
        }
        definition.appendChild(child);
      }
    }
    inline.push(glossary);
    heading.remove();
    paragraph.remove();
  }
  if (!section && inline.length) {
    section = document.createElement('section');
    section.className = 'wp-sec week-glossary';
    section.innerHTML = '<div class="wp-sec-t">术语表</div><div class="elasticity-glossary"><p>先回想术语的意思，再展开核对。</p></div>';
    const panel = root.querySelector('.week-panel');
    if (!panel) return;
    panel.appendChild(section);
  }
  if (!section) return;
  const list = section.querySelector('.elasticity-glossary');
  const key = card => (card.dataset.term || card.querySelector('small')?.textContent || '')
    .trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const original = [...list.querySelectorAll('.elasticity-term')];
  const preferred = new Set();
  for (const glossary of inline) {
    for (const card of glossary.querySelectorAll('.elasticity-term')) {
      preferred.add(key(card));
      list.appendChild(card);
    }
    const wrapper = glossary.parentElement;
    const heading = wrapper?.previousElementSibling;
    if (wrapper?.classList.contains('gx-answer') && heading?.matches('h3, h4') &&
        heading.textContent.includes('术语表') && wrapper.children.length === 1) {
      heading.remove();
      wrapper.remove();
    } else {
      glossary.remove();
    }
  }
  for (const card of original) {
    if (preferred.has(key(card))) card.remove();
    else list.appendChild(card);
  }
  list.querySelectorAll('.elasticity-term').forEach(function(card, index) {
    card.setAttribute('name', 'week-glossary');
    const title = card.querySelector('summary strong');
    title.textContent = (index + 1) + '. ' + title.textContent.replace(/^\d+\.\s*/, '');
  });
};
