/* ============================================================
   学习笔记「四种视图」：文字版 / 思维导图 / 填空复习 / 知识点归纳总结
   纯前端、零依赖；内容全部从现有笔记自动提取，全学科通用。
   由 index.html 主闭包在每次渲染后调用 NoteViews.bind(ctx) 注入依赖。
   ============================================================ */
(function(){
"use strict";

var NS = {};              /* 主页面注入的依赖与当前课程上下文 */
var built = {};           /* 懒构建缓存：切换视图时才生成内容 */
var VIEWS = [
  { key:"note",    label:"📖 文字版",     hint:"原始完整笔记（默认）" },
  { key:"mindmap", label:"🧠 思维导图",   hint:"按知识点自动展开的结构图" },
  { key:"cloze",   label:"✏️ 填空复习",   hint:"关键术语挖空，边填边记" },
  { key:"summary", label:"📋 知识点归纳", hint:"按概念整理的复习提纲：释义、要点、关联知识点、易错点" }
];

/* ---------- 通用小工具 ---------- */
function root(){ return NS.app || document.getElementById("app"); }
function esc(s){ return NS.esc ? NS.esc(String(s == null ? "" : s)) : String(s == null ? "" : s); }
/* 分数写成一行时只在必要处加括号：1/x、−b/(2a)，不写 ((5 − 2))/((−1 − 3)) */
function fracEnclosed(s){
  if(s.charAt(0) !== "(" || s.charAt(s.length - 1) !== ")") return false;
  for(var i = 0, d = 0; i < s.length; i++){
    var c = s.charAt(i);
    if(c === "(") d++;
    else if(c === ")" && --d === 0 && i < s.length - 1) return false;
  }
  return d === 0;
}
function fracHasOperator(s){
  var body = s.replace(/^[−-]\s*/, "");
  for(var i = 0, d = 0; i < body.length; i++){
    var c = body.charAt(i);
    if(c === "(") d++;
    else if(c === ")") d--;
    else if(d === 0 && /[\s+−\-*·×÷\/]/.test(c)) return true;
  }
  return false;
}
function fracLine(n, d){
  n = String(n).trim(); d = String(d).trim();
  var pn = n.replace(/<[^>]+>/g, ""), pd = d.replace(/<[^>]+>/g, "");
  var top = fracEnclosed(pn) || !fracHasOperator(pn) ? n : "(" + n + ")";
  var bottom = fracEnclosed(pd) || /^(?:[A-Za-z]|\d+(?:\.\d+)?)$/.test(pd) ? d : "(" + d + ")";
  return top + "/" + bottom;
}
function mathText(s){
  return String(s || "")
    .replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, "^($1)")
    .replace(/<sub\b[^>]*>([\s\S]*?)<\/sub>/gi, "_($1)")
    .replace(/<span class=["']frac["']>\s*<span class=["']n["']>([\s\S]*?)<\/span>\s*<span class=["']d["']>([\s\S]*?)<\/span>\s*<\/span>/gi, function(m, n, d){ return fracLine(n, d); })
    .replace(/\\(?:dfrac|frac)\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, function(m, n, d){ return fracLine(n, d); })
    .replace(/([_^])\{([^{}]*)\}/g, "$1($2)");
}
/* 识别一行文字里的分数，公式句不截断、不挖空；A/R、Dr/Cr、and/or 这类不算 */
function hasFraction(s){
  return /\)\/|\/\(|(?:^|[\s=+−\-])\d+(?:\.\d+)?\/[A-Za-z\d]|(?:^|[\s=+−\-])[a-z]\/[a-z\d](?![a-z])/.test(s);
}
function txt(s){
  s = mathText(s);
  var t = NS.kpText ? NS.kpText(s || "") : String(s || "").replace(/<[^>]+>/g," ");
  /* 去掉 LaTeX 命令名，只留下可读文字（用于摘要 / 填空题干） */
  t = t.replace(/\\[a-zA-Z]+/g," ").replace(/[{}]/g," ").replace(/\s+/g," ").trim();
  return t;
}
function cut(s, n){ s = String(s || ""); return s.length > n && !/[=≤≥≠≈^]/.test(s) && !hasFraction(s) ? s.slice(0, n) + "…" : s; }
function norm(s){
  return String(s || "").toLowerCase()
    .replace(/[\s，,。.、；;：:！!？?（）()「」『』""''《》<>\[\]]/g,"")
    .trim();
}
function hint(msg){ return '<div class="nv-empty">'+esc(msg)+'</div>'; }

/* ---------- 把笔记按小标题切段，抽取要点与关键词 ----------
   过滤规则与 index.html 的 kpScan / kpInject 严格一致，
   保证生成的锚点 kp-<周>-<序号> 与正文、左侧目录一一对应。 */
var SEC_RE = /<(h[234])([^>]*)>([\s\S]*?)<\/\1>/gi;
function secMarks(html){
  var src = String(html || "").replace(/<!--[\s\S]*?-->/g,""), m, out = [];
  SEC_RE.lastIndex = 0;
  while((m = SEC_RE.exec(src))){
    var t = NS.kpText ? NS.kpText(m[3]) : "";
    if(t.length < 2 || (NS.kpSkip && NS.kpSkip(t))) continue;
    if(out.length >= 120) break;
    out.push({ start:m.index, end:SEC_RE.lastIndex, title:t,
               cls:(/\bclass=["']([^"']*)["']/.exec(m[2]) || [,""])[1] });
  }
  return { src:src, marks:out };
}
function extractPoints(body, lite){
  if(!body) return [];
  var b = body.replace(/<!--[\s\S]*?-->/g,"")
              .replace(/<details[\s\S]*?<\/details>/gi," ")   /* 老师讲义对照图库等噪音 */
              .replace(/<figure[\s\S]*?<\/figure>/gi," ");
  if(lite) b = b.slice(0, 1800);
  var out = [], re = /<(p|li|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi, m;
  while((m = re.exec(b))){
    if(/\bkp-src\b|\bcfig\b/.test(m[2])) continue;
    var t = txt(m[3]);
    if(t.length < 14 || t.length > 320) continue;
    if(/^(PDF|课件|来源|图片|Figure|第\s*\d+\s*页|老师讲义)/i.test(t)) continue;
    if(/^打开[「"“]/.test(t)) continue;              /* 读书页的「打开第 X 页 ↗」导航句 */
    if(out.indexOf(t) >= 0) continue;
    out.push(t);
    if(out.length >= (lite ? 1 : 5)) break;
  }
  return out;
}
function extractKeys(body){
  var out = [], re = /<(span|strong|b|em)\b([^>]*)>([\s\S]*?)<\/\1>/gi, m;
  while((m = re.exec(body || ""))){
    var t = txt(m[3]);
    if(t.length < 3 || t.length > 46) continue;
    if(/[\\{}^_$]/.test(t)) continue;              /* 公式不当答案 */
    if(/^[\d\s.、,，]+$/.test(t)) continue;
    if(/^(PDF|PPT|Week|Unit|Step|Example|Note|Page)\b/i.test(t)) continue;
    if(out.indexOf(t) < 0) out.push(t);
    if(out.length >= 8) break;
  }
  return out;
}
/* 返回与 kpItems(week) 等长、顺序一致的段落信息 */
function sectionsFor(week, lite){
  var items = NS.kpItems ? NS.kpItems(week) : [];
  var info = secMarks(week.graphicHtml || week.notesHtml || "");
  var out = [], i;
  for(i = 0; i < items.length; i++){
    var mk = info.marks[i];
    var body = mk ? info.src.slice(mk.end, i + 1 < info.marks.length ? info.marks[i+1].start : info.src.length) : "";
    out.push({
      id: "kp-" + week.num + "-" + i,
      label: items[i].label,
      text: items[i].text,
      level: items[i].level,
      points: extractPoints(body, lite),
      keys: lite ? [] : extractKeys(body)
    });
  }
  return out;
}

/* ============================================================
   1) 思维导图
   ============================================================ */
function buildMindmap(){
  var secs = sectionsFor(NS.week, false);
  if(!secs.length) return hint("本周笔记暂时没有可生成思维导图的标题，可先使用文字版。");
  var branches = [];
  secs.forEach(function(s){
    if(s.level === 2 && branches.length) branches[branches.length-1].subs.push(s);
    else branches.push({ main:s, subs:[] });
  });
  var html = '<div class="nv-bar"><span class="nv-t">🧠 本周知识结构</span>' +
    '<span>'+branches.length+' 个主干 · '+secs.length+' 个分支 · 点标题可跳回原文</span>' +
    '<button type="button" class="nv-mini" data-mm-all="1">收起要点</button></div>';
  html += '<div class="mm-wrap"><div class="mm-root">'+esc(cut(NS.week.title || ("Week " + NS.week.num), 46))+'</div>';
  html += '<div class="mm-branches">';
  branches.forEach(function(b, bi){
    html += '<div class="mm-branch"><div class="mm-node">' +
      '<button type="button" class="mm-jump" data-mm-jump="'+esc(b.main.id)+'" title="跳到原文">'+esc(cut(b.main.label, 46))+'</button>' +
      '<button type="button" class="mm-tog" data-mm-toggle="'+bi+'" title="展开 / 收起要点">▾</button></div>';
    var kids = [];
    b.subs.forEach(function(s){ kids.push({ t:s.label, id:s.id, sub:true }); });
    (b.main.points || []).slice(0, 3).forEach(function(p){ kids.push({ t:cut(p, 78), id:"", sub:false }); });
    html += '<div class="mm-kids" data-mm-kids="'+bi+'">';
    if(!kids.length) html += '<div class="mm-leaf"><span>（本周该知识点以图表 / 公式为主，详见文字版）</span></div>';
    kids.slice(0, 6).forEach(function(k){
      html += '<div class="mm-leaf'+(k.sub ? " is-sub" : "")+'">' +
        (k.id
          ? '<button type="button" class="mm-link" data-mm-jump="'+esc(k.id)+'">'+esc(k.t)+'</button>'
          : '<span>'+esc(k.t)+'</span>') + '</div>';
    });
    html += '</div></div>';
  });
  html += '</div></div>';
  return html;
}

/* ============================================================
   2) 填空复习
   ============================================================ */
/* 无加粗术语时的兜底答案：书名 / 引文 / 英文词 / 数字 / 中文实词 / 句尾关键词。
   读书类（小岛经济学、国富论等）笔记以中文散文为主，靠这一层也能出复习填空题。 */
function pickFallbackKey(p){
  var pats = [
    /《([^》]{2,16})》/, /「([^」]{2,16})」/, /[“"]([^”"]{2,16})[”"]/,
    /\b([A-Za-z][A-Za-z-]{3,20})\b/, /(\d+\s*[–\-]\s*\d+\s*页)/,
    /(\d+(?:\.\d+)?\s*(?:%|％|元|万|亿|年|月|日|岁|人|倍|次))/
  ];
  for(var i = 0; i < pats.length; i++){
    var m = pats[i].exec(p);
    if(m && m[1] && m[1].length >= 2) return m[1];
  }
  var parts = p.split(/[、，,；;：:。.！!？?（）()\s·]/);
  var stop = /^(?:先|再|还|也|而|从|把|被|对|在|是|的|了|和|与|及|或|这|那|其|中|里|上|下|时|后|前|可以|如何|什么|这样|那些|这些|一个|一种|通过|以及|进行|发生|变成|影响|决定|提高|建立|获得|使用|需要|应该|能够|打开|先看|再看|先读|沿|按|以|为)$/;
  for(var j = 0; j < parts.length; j++){
    var q = parts[j].trim();
    if(/^[\u4e00-\u9fa5]{2,7}$/.test(q) && !stop.test(q)) return q;
  }
  var segs = p.replace(/[^\u4e00-\u9fa5]/g, " ").trim().split(/\s+/).filter(Boolean);
  var tail = segs.length ? segs[segs.length - 1] : "";
  return tail.length >= 3 ? tail.slice(-Math.min(5, tail.length)) : "";
}
/* 填空答案只留术语本身，括号注释和译文留在题干里当提示：
   「Marginal Private Cost (MPC) 边际私人成本」只挖 Marginal Private Cost */
function clozeKey(k){
  k = String(k || "").trim().replace(/[：:，,。；;、\s]+$/, "");
  var m = /^([A-Za-z][A-Za-z'’\- ]*?[A-Za-z])\s*(?:[（(]|[一-鿿]).*$/.exec(k) ||
          /^([一-鿿]{2,12})\s*[（(].*$/.exec(k);
  return m ? m[1] : k;
}
/* 题号、小问编号、分值不是知识点，不能当答案 */
function isClozeLabel(k){
  return /^(?:[（(]?[a-z][)）]|[（(]\d|Q\d|\d+\s*[.)、])|\bmarks?\b|\d\s*分[)）]?$/i.test(k);
}
function maskRepeats(after, k){
  var quoted = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if(/[A-Za-z0-9]/.test(k)){
    return after.replace(new RegExp("(^|[^A-Za-z0-9])" + quoted + "(?![A-Za-z0-9])", "gi"), "$1____");
  }
  return after.replace(new RegExp(quoted, "g"), "____");
}
function makeQuestions(secs){
  var qs = [], seen = {};
  function push(s, p, rawKey, tag){
    // Keep equations/formulas intact: never blank a point that contains a real formula.
    // Blanking a formula point would produce a WRONG formula (e.g. "y = a(x − h)² + k"
    // → "y = a² + k"), which teaches the wrong thing. Skip points with =, inequalities,
    // powers, arrows, math symbols, or a fraction such as a/(b).
    if (/[=≤≥≠≈^→∑π°√÷×]/.test(p) || hasFraction(p)) return false;
    var k = clozeKey(rawKey);
    if(k.length < 2 || isClozeLabel(k)) return false;
    var idx = p.toLowerCase().indexOf(k.toLowerCase());
    if (idx >= 0 && (/[a-z0-9]/i.test(p.charAt(idx - 1)) ||
        /[a-z0-9]/i.test(p.charAt(idx + k.length)))) return false;
    if(idx < 0) return false;
    /* 只挖括号里的一半会留下「L35 ( I)」这种残句 */
    var rest = p.slice(idx + k.length);
    if(/[（(]/.test(p.charAt(idx - 1)) && /^\s*[^）)\s][^）)]{0,8}[）)]/.test(rest)) return false;
    var sig = tag + "|" + k.toLowerCase() + "|" + p.slice(0, 26);
    if(seen[sig]) return false;
    seen[sig] = 1;
    qs.push({ kp:s.label, id:s.id, before:p.slice(0, idx), after:maskRepeats(rest, k), ans:k });
    return true;
  }
  /* 主策略：挖笔记里被加粗 / 标为 key 的术语 */
  secs.forEach(function(s){
    var used = 0;
    (s.keys || []).forEach(function(k){
      if(used >= 2 || qs.length >= 24) return;
      for(var pi = 0; pi < (s.points || []).length; pi++){
        if(push(s, s.points[pi], k, "key")){ used++; break; }
      }
    });
  });
  /* 补强：题目偏少（读书类 / 图片型笔记）时，用宽松策略补足到可复习的量 */
  if(qs.length < 8){
    secs.forEach(function(s){
      if(qs.length >= 20) return;
      var used = 0;
      (s.points || []).forEach(function(p){
        if(used >= 2 || qs.length >= 20) return;
        var k = pickFallbackKey(p);
        if(k && push(s, p, k, "fb")) used++;
      });
    });
  }
  return qs;
}
function buildCloze(){
  var secs = sectionsFor(NS.week, false);
  var qs = makeQuestions(secs);
  if(!qs.length) return hint("本周笔记以图表 / 公式为主，暂时没有可自动挖空的术语。建议用文字版配合目录复习。");
  var html = '<div class="nv-bar"><span class="nv-t">✏️ 填空复习</span>' +
    '<span>共 '+qs.length+' 题 · 填关键词，答对会自动变绿</span>' +
    '<span class="clz-score" id="clzScore">已答对 0 / '+qs.length+'</span>' +
    '<button type="button" class="nv-mini" data-clz-all="1">全部显示答案</button>' +
    '<button type="button" class="nv-mini" data-clz-reset="1">重做</button></div>';
  html += '<div class="clz-progress"><i id="clzBar" style="width:0%"></i></div><div class="clz-list">';
  qs.forEach(function(q, i){
    var cjk = (q.ans.match(/[\u4e00-\u9fa5]/g) || []).length;
    var iw = Math.min(320, Math.max(110, cjk * 15 + (q.ans.length - cjk) * 8 + 24));
    html += '<div class="clz-q" data-clz-q="'+i+'">' +
      '<div class="clz-meta"><button type="button" class="clz-kp" data-mm-jump="'+esc(q.id)+'">'+esc(cut(q.kp, 40))+'</button>' +
      '<span>第 '+(i+1)+' 题</span></div>' +
      '<div class="clz-stem">'+esc(q.before) +
      '<input class="clz-input" style="width:'+iw+'px" data-clz-input="'+i+'" data-ans="'+esc(q.ans)+'" type="text" autocomplete="off" placeholder="填这里" aria-label="第 '+(i+1)+' 题答案">' +
      esc(q.after)+'</div>' +
      '<div class="clz-foot"><button type="button" class="nv-mini" data-clz-check="'+i+'">✓ 检查</button>' +
      '<button type="button" class="nv-mini" data-clz-show="'+i+'">👁 看答案</button>' +
      '<span class="clz-fb" data-clz-fb="'+i+'"></span></div></div>';
  });
  html += '</div>';
  return html;
}
function updateScore(){
  var r = root(); if(!r) return;
  var ins = r.querySelectorAll(".view-pane[data-view-pane='cloze'] .clz-input");
  var ok = 0;
  Array.prototype.forEach.call(ins, function(el){ if(el.classList.contains("ok")) ok++; });
  var score = r.querySelector("#clzScore"), bar = r.querySelector("#clzBar");
  if(score) score.textContent = "已答对 " + ok + " / " + ins.length;
  if(bar) bar.style.width = (ins.length ? Math.round(ok / ins.length * 100) : 0) + "%";
}
function checkOne(i, reveal){
  var r = root(); if(!r) return;
  var pane = r.querySelector(".view-pane[data-view-pane='cloze']");
  if(!pane) return;
  var inp = pane.querySelector('[data-clz-input="'+i+'"]');
  var fb = pane.querySelector('[data-clz-fb="'+i+'"]');
  if(!inp || !fb) return;
  var ans = inp.getAttribute("data-ans") || "";
  var val = inp.value.trim();
  if(reveal){
    inp.value = ans; inp.classList.remove("bad"); inp.classList.add("ok");
    fb.className = "clz-fb"; fb.textContent = "答案：" + ans;
  } else if(!val){
    fb.className = "clz-fb bad"; fb.textContent = "先填一个答案再检查～";
  } else {
    var a = norm(ans), v = norm(val);
    var hit = a === v || (v.length >= 2 && (a.indexOf(v) >= 0 || v.indexOf(a) >= 0));
    inp.classList.toggle("ok", hit); inp.classList.toggle("bad", !hit);
    fb.className = "clz-fb " + (hit ? "ok" : "bad");
    fb.textContent = hit ? "✓ 答对了" : "✗ 再想想，或点「看答案」";
  }
  updateScore();
}

/* ============================================================
   3) 知识点归纳 = 复习提纲 / Study Outline（覆盖本课程 / 本 term 全部周次）
   版式参照用户提供的复习提纲 PDF：
     一、大板块 → 1. 概念 → 中文 / English 释义 → • 要点 → 关联知识点
     → 综合知识点串联 → 易错点提醒
   内容全部从现有笔记自动提炼；同一概念的多个 PPT 页 / 例题答案合并成一个知识点，
   不再把课件页标题一条条平铺。
   ============================================================ */
var CN_NUM = ["零","一","二","三","四","五","六","七","八","九","十","十一","十二","十三","十四",
              "十五","十六","十七","十八","十九","二十","二十一","二十二","二十三","二十四","二十五"];
function cnNum(n){ return CN_NUM[n] || String(n); }
var OUT_ENT = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&nbsp;':' ','&#39;':"'",'&#x27;':"'",
               '&mdash;':'—','&ndash;':'–','&hellip;':'…'};
/* 把正文片段转成提纲里能读的一句话：保留公式符号，去掉 LaTeX 命令噪声 */
function readLine(s){
  var t = mathText(s).replace(/<[^>]+>/g," ");
  t = t.replace(/&(?:amp|lt|gt|quot|nbsp|mdash|ndash|hellip|#39|#x27);/gi, function(m){ return OUT_ENT[m.toLowerCase()] || m; });
  t = t.replace(/\$\$/g," ").replace(/\\[()\[\]]/g," ");
  t = t.replace(/\\(?:dfrac|frac)\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,"$1 / $2");
  var mp = {times:"×",div:"÷",pm:"±",Delta:"Δ",delta:"δ",approx:"≈",neq:"≠",le:"≤",ge:"≥",
            cdot:"·",percent:"%",sqrt:"√",sum:"Σ",infty:"∞",left:"",right:"",text:""};
  t = t.replace(/\\([a-zA-Z]+)/g, function(all, k){ return Object.prototype.hasOwnProperty.call(mp,k) ? mp[k] : ""; });
  t = t.replace(/[{}$]/g," ").replace(/\s+/g," ").trim();
  return t;
}
/* 课件页标题：把「✏️ PPT 第 19 页 · Example 1: The midpoint formula · Lecture…」提炼成概念名 */
function slideConcept(label){
  var t = String(label || "").replace(/^✏️\s*/,"").trim();
  var parts = t.split(/\s*[·・]\s*/);
  var c = parts.length >= 2 ? parts[1] : parts[0];
  c = c.replace(/^(Learning Objectives|Revise your understanding|Overview|Agenda|Contents|Slide|Summary|Recap)\b[:：]?\s*/i,"")
       .replace(/^(Example|Exercise|Question|Quiz|Activity)\s*\d*\s*[:：.)\-]?\s*/i,"")
       .replace(/\(cont\b[^)]*\)?|\bcontinued\b/gi,"")
       .replace(/^the\s+/i,"")
       .replace(/^\d+\s*[\.、)]\s*/,"")
       .replace(/[\s.、,，:：·\-]+$/,"").trim();
  return c ? c.charAt(0).toUpperCase() + c.slice(1) : c;
}
/* 概念主干：去掉中文注解括号 / 编号 / 定冠词，用来把同一概念的不同写法合并 */
function coreText(c){
  return norm(String(c || "")
    .replace(/\(cont\b[^)]*\)?|\bcontinued\b/gi,"")
    .replace(/^the\s+/i,"")
    .replace(/^(example|exercise|question|activity)\s*\d*\s*[:：.)\-]?\s*/i,"")
    .replace(/[（(][^）)]*[）)]/g," "));
}
function sameTopic(a, b){
  var x = coreText(a), y = coreText(b);
  if(!x || !y || x === y) return x === y && !!x;
  var short = Math.min(x.length, y.length);
  return short >= 9 && (x.indexOf(y) >= 0 || y.indexOf(x) >= 0);
}
/* 把概念标题拆成「英文名 / 中文名」。
   笔记标题常见写法为「English（中文注译）」或「中文（English）」：
   - 中文名：整串里的中文字（含括号里的注译）都算中文；
   - 英文名：先去掉中文风格注译括号 （...）【...】〔...〕 与空括号，再剥掉中文。
   这样可避免把「微观经济学与宏观经济学（Microeconomics vs Macroeconomics）」
   拆出「Microeconomics vs Macroeconomics（ ）」这种空括号 / 乱码英文名。 */
function splitName(label){
  var l = String(label || "").replace(/^[✏️\s·•]+/,"").replace(/\s*\(cont\.?\)\s*/gi,"").trim();
  var cn = l.replace(/[^一-鿿]/g,"").replace(/\s+/g,"").trim();
  var stripped = l
    .replace(/（[^）]*）/g," ")
    .replace(/【[^】]*】/g," ")
    .replace(/〔[^〕]*〕/g," ")
    .replace(/（\s*）/g," ")
    .replace(/\(\s*\)/g," ")
    .replace(/\s+/g," ").trim();
  var en = stripped.replace(/[一-鿿]/g," ").replace(/\s+/g," ").trim().replace(/[\s·・\-—:：]+$/,"");
  return { en:en, cn:cn };
}
function isSlide(label){
  var t = String(label || "");
  return /PPT\s*第?\s*\d+\s*页/i.test(t) || /^✏️/.test(t) || /^第\s*\d+\s*页/.test(t);
}
function isGenericSlide(c){
  return !c || c.length < 3 ||
    /^(Learning Objectives|Revise your understanding|Overview|Agenda|Contents|Summary|Recap|练习|复习|小结)$/i.test(c);
}
function isIntro(label){ return /Overview|导览|概览|本周概览|单元概览|Introduction|本章导读/i.test(String(label||"")); }
function isAnnex(label){ return /答案|Answers?|例题|练习|Exercise|Quiz|Worked Example|Example\s*\d/i.test(String(label||"")); }
var OUT_PIT = /不是|并非|而非|易错|误区|注意|区别|混淆|不要|不能|切勿|切忌|常见错误|Common mistake|pitfall|rather than|\bnot\b.*\bbut\b|≠|mistake/i;

/* 从一个标题下的正文里抽出可读句子（跳过来源行、图注、导航句） */
function bodyLines(body){
  var b = String(body || "").slice(0, 5200)
    .replace(/<!--[\s\S]*?-->/g," ")
    .replace(/<figure[\s\S]*?<\/figure>/gi," ")
    .replace(/<details[\s\S]*?<\/details>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ");
  var out = [], seen = {}, slide = [];
  function push(t){
    if(t.length < 12) return;
    /* 讲义里最长的定义段也常超过 360 字：截断保留开头，不要整条丢掉 */
    if(t.length > 340) t = cut(t, 340);
    if(/^(PDF|课件|来源|图片|Figure|第\s*\d+\s*页|老师讲义|Source|打开|点击|查看|下载)/i.test(t) && t.length < 70) return;
    if(/^打开[「"“]/.test(t)) return;
    if(/^✏️|\bPPT\s*第?\s*\d+\s*页|^第\s*\d+\s*页\s*[·・]/.test(t)) return;
    if(/^[\d\s.、，,：:·・/|]+$/.test(t)) return;
    var k = norm(t).slice(0, 50);
    if(seen[k]) return;
    seen[k] = 1; out.push(t);
  }
  function flushSlide(){
    if(slide.length){ push(cut(readLine(slide.join(" ")), 240)); slide = []; }
  }
  var re = /<(p|li|td|div|h5|h6)\b([^>]*)>([\s\S]*?)<\/\1>/gi, m;
  while((m = re.exec(b))){
    var cls = m[2] || "";
    if(/\bkp-src\b|\bkp-pg-src\b|\bgx-src\b|\bgx-pg-h\b|\bcfig\b|\bnote-tools\b|\breading-tools\b|\bformula\b/.test(cls)) continue;
    if(/\bgx-pg-b\b|\bgx-line\b/.test(cls)){
      slide.push(m[3]);
      if(slide.join(" ").length > 190) flushSlide();
      continue;
    }
    flushSlide();
    push(readLine(m[3]));
    if(out.length >= 10) break;
  }
  flushSlide();
  return out;
}
function bodyKeys(body){
  var out = [], seen = {}, re = /<(span|strong|b|em)\b([^>]*)>([\s\S]*?)<\/\1>/gi, m;
  var src = String(body || "").slice(0, 4200);
  while((m = re.exec(src))){
    var t = readLine(m[3]);
    if(t.length < 3 || t.length > 44) continue;
    if(/^[\d\s.、,，]+$/.test(t)) continue;
    if(/^(PDF|PPT|Week|Unit|Step|Example|Note|Page|Source|Lecture|Tutorial)\b/i.test(t)) continue;
    var k = norm(t); if(seen[k]) continue;
    seen[k] = 1; out.push(t);
    if(out.length >= 7) break;
  }
  return out;
}
/* 要点按「信息量」打分，再按原文顺序展示，优先中英对照 / 推论 / 公式句 */
function pickPoints(lines, skip){
  var scored = [];
  lines.forEach(function(t, i){
    if(i === skip) return;
    var s = 0;
    if(/\//.test(t)) s += 2;
    if(/→|⇒|=>/.test(t)) s += 2;
    if(/\d/.test(t)) s += 1;
    if(/=|×|÷|%|Δ|√|≈|≠/.test(t)) s += 1;
    if(/不是|而是|意味着|因此|取决于|关键|核心|区别|注意|牢记|记住|定义|等于|关系/.test(t)) s += 2;
    if(t.length > 60) s += 1;
    scored.push({ t:t, s:s, i:i });
  });
  scored.sort(function(a,b){ return b.s - a.s || a.i - b.i; });
  return scored.slice(0, 5).sort(function(a,b){ return a.i - b.i; }).map(function(x){ return x.t; });
}
/* 把双语文本拆成英文 / 中文两部分，以句子为单位：
   中文为主的句子整句进中文（保留其中的英文术语、数字），
   英文为主的句子去掉夹注的中文后进英文。 */
var HAN_GLOSS_RE = /[（(][^（）()A-Za-z0-9]*[一-鿿][^（）()A-Za-z0-9]*[）)]/g;
function isCnSentence(s){
  var bare = s.replace(HAN_GLOSS_RE, " ");   /* 英文句里的（中文夹注）不算中文句 */
  var han = (bare.match(/[一-鿿]/g) || []).length;
  var latin = (bare.match(/[A-Za-z]/g) || []).length;
  return han >= 2 && han * 4 >= latin;
}
function dropHan(s){
  var t = s.replace(HAN_GLOSS_RE, " ")
           .replace(/[一-鿿　-〿＀-￯]/g, " ")
           .replace(/\s+([,.;:!?])/g, "$1").replace(/\s+/g, " ").trim();
  return /[A-Za-z0-9]/.test(t) ? t : "";
}
function splitLang(text){
  var en = [], cn = [];
  String(text == null ? "" : text)
    .replace(/([。！？；]+)/g, "$1\n")
    .replace(/([.!?;])\s+(?=\S)/g, "$1\n")
    .replace(/([.!?])(?=[一-鿿])/g, "$1\n")
    .split("\n").forEach(function(raw){
      var s = raw.trim();
      if(!s) return;
      /* 一句里英文在前、译文在后且没有句号隔开：从第一个汉字处拆开 */
      var at = s.search(/[一-鿿]/), head = at > 0 ? s.slice(0, at) : "";
      if((head.match(/[A-Za-z]/g) || []).length >= 20 && isCnSentence(s.slice(at))){
        var h = dropHan(head); if(h) en.push(h);
        cn.push(s.slice(at));
      } else if(isCnSentence(s)){
        cn.push(s);
      } else {
        var e = dropHan(s); if(e) en.push(e);
      }
    });
  return { en:en.join(" "), cn:cn.join(" ") };
}
/* 把一周整理成复习提纲：导语 + 概念列表 + 易错点 */
function outlineWeek(w){
  var info = secMarks(w.graphicHtml || w.notesHtml || "");
  var items = NS.kpItems ? NS.kpItems(w) : [];
  var topics = [], intro = "", pitfalls = {}, pitList = [], totalPoints = 0, totalKeys = 0;
  info.marks.forEach(function(mk, i){
    /* 用完整标题（kpItems 的 label 被截到 46 字，会把概念名切碎） */
    var label = (items[i] && items[i].text) ? items[i].text : mk.title;
    var body = info.src.slice(mk.end, i + 1 < info.marks.length ? info.marks[i+1].start : info.src.length);
    var lines = bodyLines(body), keys = bodyKeys(body);
    lines.forEach(function(t){
      var k = norm(cut(t, 60));
      if(OUT_PIT.test(t) && !pitfalls[k] && pitList.length < 6){ pitfalls[k] = 1; pitList.push(cut(t, 190)); }
    });
    if(isIntro(label) && !intro){ if(lines.length) intro = cut(lines[0], 230); return; }
    var slide = isSlide(label), concept = slide ? slideConcept(label) : label;
    /* 通用课件页（Learning Objectives / Revise your understanding）并入上一知识点做演练 */
    if(slide && isGenericSlide(concept)){
      if(topics.length && lines.length) topics[topics.length - 1].examples.push(cut(lines[0], 150));
      return;
    }
    /* 例题 / 答案标题不再单独占一条，合并到上一个概念 */
    if(!slide && isAnnex(label)){
      if(topics.length && lines.length) topics[topics.length - 1].examples.push(cut(lines[0], 150));
      return;
    }
    /* 同一概念的不同写法（正式标题 / 课件页标题 / (cont.) / 截断标题）合并成一个知识点 */
    var tp = null, ti2;
    for(ti2 = 0; ti2 < topics.length; ti2++){
      if(sameTopic(topics[ti2].label, concept)){ tp = topics[ti2]; break; }
    }
    if(!tp){
      tp = { id:"kp-" + w.num + "-" + i, label:concept,
             def:"", en:"", points:[], keys:[], examples:[], lines:[],
             formula:"", enName:"", cnName:"", enDef:"", cnDef:"" };
      topics.push(tp);
    } else if(!slide && concept.length > tp.label.length){
      tp.label = concept;               /* 升级成更完整的正式标题 */
    }
    tp.lines = tp.lines.concat(lines);
    keys.forEach(function(k){ if(tp.keys.indexOf(k) < 0 && tp.keys.length < 8) tp.keys.push(k); });
    /* 课件页自身的例题内容也收进演练 */
    if(slide && lines.length > 1 && tp.examples.length < 2) tp.examples.push(cut(lines[1], 150));
    var fm = /<div class=["']\s*formula\s*["']>([\s\S]*?)<\/div>/i.exec(body);
    if(fm && !tp.formula){
      tp.formula = fm[1];
      tp._ft = String(fm[1]).replace(/<[^>]+>/g," ").replace(/[%_$^}{]/g," ").replace(/\s+/g," ").trim();
    }
  });
  topics.forEach(function(tp){
    var seen = {}, L = [], ft = tp._ft ? norm(tp._ft) : "";
    (tp.lines || []).forEach(function(t){
      if(ft && norm(t).indexOf(ft) >= 0) return;   /* 公式文本单列到公式区，不重复进定义 */
      var k = norm(t).slice(0, 50); if(!seen[k]){ seen[k] = 1; L.push(t); }
    });
    /* 名称：英文名 / 中文名 */
    var nm = splitName(tp.label);
    tp.enName = nm.en; tp.cnName = nm.cn;
    /* 定义：英文定义 / 中文定义。按句子判断文种（见 splitLang）：
       中文句子里的英文术语、数字、金额必须原样保留，否则会出现「赊销（）时卖方开出」。 */
    function enPart(s){ return splitLang(s).en; }
    function cnPart(s){ return splitLang(s).cn; }
    var enLines = [], cnLines = [];
    L.forEach(function(t){
      var e = enPart(t), c = cnPart(t);
      if(e) enLines.push(e);
      if(c) cnLines.push(c);
    });
    /* 个别概念自带独立 en/def 字段时一并并入（按文种再拆一次） */
    if(tp.en){ var e1 = enPart(tp.en); if(e1) enLines.unshift(e1); }
    if(tp.def){
      var de = enPart(tp.def), dc = cnPart(tp.def);
      if(de && !enLines.length) enLines.push(de);
      if(dc && !cnLines.length) cnLines.push(dc);
    }
    tp.enDef = cut(enLines.join(" ").replace(/\s+/g, " ").trim(), 320);
    tp.cnDef = cut(cnLines.join(" ").replace(/\s+/g, " ").trim(), 320);
    tp.formula = tp.formula || "";
    tp.keys = tp.keys.slice(0, 6);
    totalPoints += (tp.enDef ? 1 : 0) + (tp.cnDef ? 1 : 0);
    delete tp.lines; delete tp._ft;
  });
  return { intro:intro, topics:topics, pitfalls:pitList, totalPoints:totalPoints, totalKeys:totalKeys };
}
/* 本单元内部分板块：参考提纲的「一、基本经济概念 / 二、PPC / 三、案例分析」 */
var OUT_SECTIONS = [
  { cn:"核心概念与定义", en:"Core Concepts / Definitions" },
  { cn:"公式、方法与计算", en:"Formulas / Rules / Calculations" },
  { cn:"应用与案例分析", en:"Applications / Worked Examples" }
];
var OUT_FORMULA = /formula|公式|calculate|计算|method|方法|step|步骤|rule|法则|law|定律|equation|方程|deriv|推导|coefficient|系数|slope|斜率|ratio|比率|index laws/i;
var OUT_APPLY   = /example|例题|case|案例|application|应用|practice|练习|exercise|quiz|curve|曲线|graph|图|revenue|收益|incidence|归宿|tax|税|answer|答案|题/i;
function blockOf(tp){
  if(OUT_FORMULA.test(tp.label)) return 1;
  if(OUT_APPLY.test(tp.label)) return 2;
  if(/例|例如|案例|应用|exercise|example/i.test(tp.def)) return 2;
  if(/公式|计算|=|÷|×|%|formula|calculate/i.test(tp.def)) return 1;
  return 0;
}
function splitSections(topics){
  var buckets = [[], [], []], i;
  topics.forEach(function(tp){ buckets[blockOf(tp)].push(tp); });
  var out = [];
  buckets.forEach(function(list, idx){ if(list.length) out.push({ idx:idx, list:list }); });
  /* 全落在同一类时，按讲义顺序拆成上下两篇，保证至少有 2 个板块 */
  if(out.length < 2 && topics.length >= 4){
    var half = Math.ceil(topics.length / 2);
    return [
      { idx:0, list:topics.slice(0, half), name:{cn:"核心概念与定义（上）", en:"Core Concepts (I)"} },
      { idx:1, list:topics.slice(half),     name:{cn:"核心概念与定义（下）", en:"Core Concepts (II)"} }
    ];
  }
  return out;
}
/* 定义按句断行，避免多句英文/中文被挤成一长条（归纳视图“英文定义拼接”问题） */
function defHtml(s){
  return esc(s)
    .replace(/\.\s+/g, ".<br>")
    .replace(/。/g, "。<br>")
    .replace(/；/g, "；<br>")
    .replace(/;\s+/g, ";<br>");
}
function topicHtml(tp, idx, w){
  var h = '<section class="sum-kp" data-sum-text="'+esc([tp.enName,tp.cnName,tp.enDef,tp.cnDef,tp.label].join(" "))+'">';
  h += '<button type="button" class="sum-kp-h" data-sum-jump="'+esc(tp.id)+'" data-sum-week="'+w.num+'" title="跳到原文">';
  h += '<span class="sum-num">'+(idx + 1)+'.</span>';
  if(tp.enName) h += '<span class="sum-en-name">'+esc(tp.enName)+'</span>';
  if(tp.cnName) h += '<span class="sum-cn-name">'+esc(tp.cnName)+'</span>';
  h += '</button>';
  if(tp.enDef) h += '<div class="sum-en-def"><span class="sum-lab">English</span><p>'+defHtml(tp.enDef)+'</p></div>';
  if(tp.cnDef) h += '<div class="sum-cn-def"><span class="sum-lab">中文</span><p>'+defHtml(tp.cnDef)+'</p></div>';
  if(tp.formula) h += '<div class="sum-formula formula">'+tp.formula+'</div>';
  return h + '</section>';
}
function buildSummary(){
  var course = NS.course, term = NS.term, w = NS.week;
  if(!w) return hint("请先打开某一周的笔记，再查看本单元复习提纲。");
  var o = outlineWeek(w);
  var label = w.displayLabel ? w.displayLabel : (course.extra ? "模块 " + w.num : course.reading ? "第 " + w.num + " 章" : "Week " + w.num);
  var titleText = String(w.title || "");
  /* 周标题本身常已含「Week 5 ·」，避免拼成「Week 5 · Week 5 · …」 */
  var unitName = (new RegExp("Week\\s*" + w.num + "\\b", "i").test(titleText) || /^第\s*\d+\s*章/.test(titleText))
    ? titleText : (label + " · " + titleText);
  /* 扁平化：不再分「一、二、三」大板块，所有概念按原文顺序连续列出 */
  var html = '<div class="nv-bar sum-bar"><span class="nv-t">📋 复习提纲 · 本单元知识点归纳</span>' +
    '<span>'+esc(course.nameCn || course.id)+' · '+esc(term.name)+' · '+esc(label)+'</span>' +
    '<span class="sum-bar-sp"></span>' +
    '<button type="button" class="nv-mini" data-sum-print="1">🖨 打印 / 存 PDF</button></div>';
  html += '<h2 class="sum-unit">'+esc(unitName)+'<span>本单元复习提纲 / Unit Study Outline</span></h2>';
  html += '<div class="sum-top">' +
    '<div class="sum-stat"><b>'+o.topics.length+'</b> 个知识点</div>' +
    '<div class="sum-stat"><b>'+o.pitfalls.length+'</b> 条易错点</div>' +
    '<div class="sum-stat sum-hint">每个知识点：英文名 → 中文名 → 英文定义 → 中文定义 → 公式</div></div>';
  html += '<div class="sum-search"><input type="text" data-sum-search="1" placeholder="🔍 搜索本单元的概念、定义与要点…" autocomplete="off"></div>';
  html += '<div class="sum-list-wrap" data-sum-unit="'+w.num+'"><div class="sum-paper"><div class="sum-list">';
  if(o.intro) html += '<div class="sum-intro">'+esc(o.intro)+'</div>';
  if(!o.topics.length) html += '<div class="sum-none">本单元暂无可归纳的知识点，可切回文字版阅读。</div>';
  else o.topics.forEach(function(tp, ti){ html += topicHtml(tp, ti, w); });
  html += '</div></div></div>';
  if(o.pitfalls.length){
    html += '<div class="sum-pit-tail"><h4>⚠️ 易错点提醒 / Common Pitfalls</h4><ul>';
    o.pitfalls.slice(0, 6).forEach(function(t){ html += '<li>'+esc(t)+'</li>'; });
    html += '</ul></div>';
  }
  return html;
}
function filterSummary(q){
  var r = root(); if(!r) return;
  q = norm(q);
  var pane = r.querySelector(".view-pane[data-view-pane='summary']"); if(!pane) return;
  Array.prototype.forEach.call(pane.querySelectorAll(".sum-kp"), function(el){
    var hit = !q || norm(el.getAttribute("data-sum-text") || "").indexOf(q) >= 0;
    el.classList.toggle("hidden", !hit);
  });
  Array.prototype.forEach.call(pane.querySelectorAll(".sum-pit-tail,.sum-intro"), function(el){
    el.classList.toggle("hidden", !!q);
  });
}
/* 打印：新开一份干净的 A4 黑白讲义，可直接「另存为 PDF」 */
var OUT_PRINT_CSS = [
  '@page{size:A4;margin:17mm 15mm}',
  'body{font:11pt/1.85 "Segoe UI","Microsoft YaHei",sans-serif;color:#16233a;margin:0}',
  'h1{font-size:17pt;margin:0 0 4px;padding-bottom:8px;border-bottom:2px solid #16233a}',
  '.sub{color:#5b6a80;font-size:9.5pt;margin:0 0 14px}',
  '.sum-unit{font-size:14pt;margin:0 0 14px;padding-bottom:6px;border-bottom:1.5px solid #16233a}',
  '.sum-unit span{font-size:9pt;color:#7a879b;margin-left:10px;font-weight:400}',
  '.sum-drill{margin:12px 0 0;padding:8px 12px;border:1px solid #d8dfeb;border-radius:5px}',
  '.sum-drill h4{margin:0 0 6px;font-size:10.5pt}',
  '.sum-drill ol{margin:0;padding-left:18px}',
  '.sum-drill li{margin:3px 0;font-size:9.8pt}',
  '.sum-bar,.sum-search,.nv-mini,.sum-more{display:none!important}',
  '.sum-top{margin:0 0 14px;color:#5b6a80;font-size:9.5pt}',
  '.sum-week{margin:0 0 20px;page-break-inside:auto}',
  '.sum-week>summary{display:block;font-size:14pt;font-weight:800;color:#16233a;',
  '  padding:6px 0 7px;border-bottom:1.5px solid #16233a;margin-bottom:14px;list-style:none}',
  '.sum-week>summary::before,.sum-week>summary::-webkit-details-marker{display:none;content:""}',
  '.sum-cnt{float:right;font-size:9pt;font-weight:400;color:#7a879b}',
  '.sum-secno{color:#a8831a}',
  '.sum-intro{margin:0 0 14px;padding-left:12px;border-left:3px solid #d9be72;color:#42536c;font-size:10pt}',
  '.sum-kp{margin:0 0 15px;padding:0 0 12px;border-bottom:1px dashed #d8dfeb;page-break-inside:avoid}',
  '.sum-kp-h{margin:0 0 6px;font-size:12pt;font-weight:800;color:#16233a}',
  '.sum-num{color:#a8831a;margin-right:7px}',
  '.sum-kp-h button{border:0;background:none;padding:0;font:inherit;color:inherit;cursor:pointer;text-align:left}',
  '.sum-def{margin:5px 0 7px;padding-left:26px;font-size:10.3pt}',
  '.sum-lab{display:inline-block;font-size:8pt;font-weight:800;color:#8a6810;margin-right:8px;',
  '  border:1px solid #e3d3a4;border-radius:4px;padding:0 6px;vertical-align:1px}',
  '.sum-def.is-en .sum-lab{color:#31578c;border-color:#c8d8ef}',
  '.sum-def p{display:inline;margin:0}',
  '.sum-bullets{margin:6px 0 8px;padding:0 0 0 26px;list-style:none}',
  '.sum-bullets li{position:relative;padding-left:15px;margin:3px 0;font-size:10pt}',
  '.sum-bullets li::before{content:"•";position:absolute;left:0;color:#a8831a;font-weight:800}',
  '.sum-terms,.sum-ex{margin:7px 0 0;padding-left:26px;font-size:9.6pt;color:#42536c}',
  '.sum-chip{display:inline-block;border:1px solid #d8dfeb;border-radius:12px;padding:1px 8px;margin:2px 4px 0 0;font-size:9pt}',
  '.sum-ex p{display:inline;margin:0;color:#5b6a80}',
  '.sum-map,.sum-pit{margin:16px 0 0;padding:10px 14px;border:1px solid #d8dfeb;border-radius:6px}',
  '.sum-pit{border-color:#e7d6ab;background:#fffdf6}',
  '.sum-map h4,.sum-pit h4{margin:0 0 7px;padding-bottom:5px;border-bottom:1px solid #d8dfeb;font-size:11pt}',
  '.sum-map p{margin:0;font-size:10pt}',
  '.sum-arrow{color:#a8831a;font-weight:800}',
  '.sum-pit ol{margin:0;padding-left:20px}',
  '.sum-pit li{margin:3px 0;font-size:10pt}',
  '.sum-pit-none{margin:0;color:#7a879b;font-size:9.5pt}',
  '.sum-kp{margin:0 0 14px;padding:0 0 11px;border-bottom:1px dashed #d8dfeb;page-break-inside:avoid}',
  '.sum-kp-h{display:block;margin:0 0 6px;font-size:12pt;font-weight:800;color:#16233a;border:0;background:none;padding:0;cursor:default;width:100%;text-align:left}',
  '.sum-num{color:#a8831a;margin-right:7px}',
  '.sum-en-name{font-size:12pt;font-weight:800;color:#16233a}',
  '.sum-cn-name{font-size:10.5pt;color:#42536c;margin-left:8px}',
  '.sum-en-def,.sum-cn-def{margin:5px 0 7px;padding-left:26px;font-size:10.3pt}',
  '.sum-en-def .sum-lab{color:#31578c}',
  '.sum-cn-def .sum-lab{color:#8a6810}',
  '.sum-lab{display:inline-block;font-size:8pt;font-weight:800;margin-right:8px;border:1px solid #e3d3a4;border-radius:4px;padding:0 6px;vertical-align:1px}',
  '.sum-en-def p,.sum-cn-def p{display:inline;margin:0}',
  '.sum-formula{margin:6px 0 4px 26px;font-size:11pt;text-align:left}',
  '.sum-pit-tail{margin:16px 0 0;padding:10px 14px;border:1px solid #e7d6ab;background:#fffdf6;border-radius:6px;page-break-inside:avoid}',
  '.sum-pit-tail h4{margin:0 0 7px;padding-bottom:5px;border-bottom:1px solid #e7d6ab;font-size:11pt}',
  '.sum-pit-tail ul{margin:0;padding-left:20px}',
  '.sum-pit-tail li{margin:3px 0;font-size:10pt}'
].join("");
function printOutline(){
  var pane = root().querySelector(".view-pane[data-view-pane='summary']"); if(!pane) return;
  var uw = NS.week;
  var ul = uw ? (String(uw.title || "") || (uw.displayLabel ? uw.displayLabel : "Week " + uw.num)) : "";
  var title = (NS.course ? (NS.course.nameCn || NS.course.id) : "课程") + " · " + cut(ul, 56) + " 复习提纲";
  var sub = (NS.course ? (NS.course.nameCn || NS.course.id) : "") + " · " + (NS.term ? NS.term.name : "") + " · " + ul + " · 本单元复习提纲";
  /* 打印稿里所有章节都要展开：临时全开 → 取快照 → 立刻恢复页面原状态 */
  var ds = pane.querySelectorAll(".sum-week,.sum-more"), saved = [];
  Array.prototype.forEach.call(ds, function(d){ saved.push(d.hasAttribute("open")); d.setAttribute("open", ""); });
  var body = pane.innerHTML;
  Array.prototype.forEach.call(ds, function(d, i){ if(!saved[i]) d.removeAttribute("open"); });
  var html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>'+esc(title)+'</title>' +
    '<style>'+OUT_PRINT_CSS+'</style></head><body><h1>'+esc(title)+'</h1><p class="sub">'+esc(sub)+'</p>' +
    body + '</body></html>';
  var win = window.open("", "_blank");
  if(!win){ try { window.print(); } catch(e){} return; }
  win.document.open(); win.document.write(html); win.document.close();
  setTimeout(function(){ try { win.focus(); win.print(); } catch(e){} }, 420);
}

/* ============================================================
   视图切换（懒构建：第一次点开才生成，避免首屏变慢）
   ============================================================ */
function switchTo(name, force){
  var r = root(); if(!r) return;
  var btns = r.querySelectorAll("[data-view-btn]");
  if(!btns.length) return;                       /* 页面没有版本栏（如考试总复习页） */
  Array.prototype.forEach.call(btns, function(b){ b.classList.toggle("active", b.getAttribute("data-view-btn") === name); });
  Array.prototype.forEach.call(r.querySelectorAll(".view-pane"), function(p){
    p.classList.toggle("active", p.getAttribute("data-view-pane") === name);
  });
  if(name === "note") return;
  var pane = r.querySelector(".view-pane[data-view-pane='"+name+"']");
  if(!pane) return;
  if(force || !built[name]){
    var html = "";
    try {
      if(name === "mindmap") html = buildMindmap();
      else if(name === "cloze") html = buildCloze();
      else if(name === "summary") html = buildSummary();
    } catch(e){ html = hint("这个视图生成时出了点小问题，可先切回文字版。"); }
    pane.innerHTML = html;
    built[name] = true;
    if(name === "summary" && window.enhanceFormulaFractions){
      try { window.enhanceFormulaFractions(pane); } catch(e){}
    }
  }
  /* 切到新视图时把内容顶部滚到可见 */
  if(pane.scrollIntoView){ try{ pane.scrollIntoView({block:"nearest"}); }catch(e){} }
}

/* ============================================================
   事件（挂在 app 上做委托，内容懒生成也不受影响）
   ============================================================ */
function onClick(ev){
  var t = ev.target, el;
  if(!t || !t.closest) return;
  if((el = t.closest("[data-view-btn]"))){ switchTo(el.getAttribute("data-view-btn")); return; }
  if((el = t.closest("[data-mm-toggle]"))){
    var kids = root().querySelector('[data-mm-kids="'+el.getAttribute("data-mm-toggle")+'"]');
    if(kids){ kids.classList.toggle("collapsed"); el.textContent = kids.classList.contains("collapsed") ? "▸" : "▾"; }
    return;
  }
  if((el = t.closest("[data-mm-all]"))){
    var all = root().querySelectorAll(".mm-kids"), anyOpen = false;
    Array.prototype.forEach.call(all, function(k){ if(!k.classList.contains("collapsed")) anyOpen = true; });
    Array.prototype.forEach.call(all, function(k){ k.classList.toggle("collapsed", anyOpen); });
    Array.prototype.forEach.call(root().querySelectorAll(".mm-tog"), function(b){ b.textContent = anyOpen ? "▸" : "▾"; });
    el.textContent = anyOpen ? "展开要点" : "收起要点";
    return;
  }
  if((el = t.closest("[data-mm-jump]"))){
    var id = el.getAttribute("data-mm-jump");
    if(id && NS.jumpTo) NS.jumpTo(id);
    return;
  }
  if((el = t.closest("[data-clz-check]"))){ checkOne(parseInt(el.getAttribute("data-clz-check"),10), false); return; }
  if((el = t.closest("[data-clz-show]"))){ checkOne(parseInt(el.getAttribute("data-clz-show"),10), true); return; }
  if((el = t.closest("[data-clz-all]"))){
    var ins = root().querySelectorAll(".view-pane[data-view-pane='cloze'] .clz-input");
    Array.prototype.forEach.call(ins, function(inp, i){ checkOne(i, true); });
    return;
  }
  if((el = t.closest("[data-clz-reset]"))){
    Array.prototype.forEach.call(root().querySelectorAll(".view-pane[data-view-pane='cloze'] .clz-input"), function(inp){
      inp.value = ""; inp.classList.remove("ok","bad");
    });
    Array.prototype.forEach.call(root().querySelectorAll(".view-pane[data-view-pane='cloze'] .clz-fb"), function(fb){
      fb.className = "clz-fb"; fb.textContent = "";
    });
    updateScore();
    return;
  }
  if((el = t.closest("[data-sum-all]"))){
    var ds = root().querySelectorAll(".view-pane[data-view-pane='summary'] .sum-week"), anyClosed = false;
    Array.prototype.forEach.call(ds, function(d){ if(!d.hasAttribute("open")) anyClosed = true; });
    Array.prototype.forEach.call(ds, function(d){ if(anyClosed) d.setAttribute("open", ""); else d.removeAttribute("open"); });
    el.textContent = anyClosed ? "全部收起" : "全部展开";
    return;
  }
  if((el = t.closest("[data-sum-print]"))){ printOutline(); return; }
  if((el = t.closest("[data-sum-jump]"))){
    var sid = el.getAttribute("data-sum-jump");
    var wn = parseInt(el.getAttribute("data-sum-week"), 10);
    var targetHash = "#/c/" + NS.course.id + "/" + NS.term.id + "/" + wn;
    if(NS.week && wn === NS.week.num && !NS.reviewMode){ if(NS.jumpTo) NS.jumpTo(sid); }
    else { window.__pendingKp = sid; location.hash = targetHash; }
    return;
  }
}
function onInput(ev){
  var t = ev.target;
  if(!t || !t.closest) return;
  if(t.closest("[data-sum-search]")){ filterSummary(t.value); return; }
  if(t.closest("[data-clz-input]")){
    /* 边输入边清掉上一次的对错状态 */
    t.classList.remove("ok","bad");
    var fb = root().querySelector('[data-clz-fb="'+t.getAttribute("data-clz-input")+'"]');
    if(fb){ fb.className = "clz-fb"; fb.textContent = ""; }
    updateScore();
  }
}
function onKeydown(ev){
  var t = ev.target;
  if(t && t.closest && t.closest("[data-clz-input]") && ev.key === "Enter"){
    checkOne(parseInt(t.getAttribute("data-clz-input"),10), false);
  }
}

/* ============================================================
   对外接口
   ============================================================ */
window.NoteViews = {
  version: "20261106-outline6",
  switchHtml: function(){
    var h = '<div class="nv-switch"><span class="nv-lead">笔记视图</span>';
    VIEWS.forEach(function(v, i){
      h += '<button type="button" class="nv-btn'+(i === 0 ? " active" : "")+'" data-view-btn="'+v.key+'" title="'+esc(v.hint)+'">'+v.label+'</button>';
    });
    h += '</div>';
    return h;
  },
  paneOpenHtml: function(){ return '<div class="view-pane active" data-view-pane="note">'; },
  extraPanesHtml: function(){
    return '<div class="view-pane" data-view-pane="mindmap"></div>' +
           '<div class="view-pane" data-view-pane="cloze"></div>' +
           '<div class="view-pane" data-view-pane="summary"></div>';
  },
  switchTo: switchTo,
  bind: function(ctx){
    NS = ctx || {};
    built = {};
    var r = root(); if(!r) return;
    if(!r.__nvBound){
      r.addEventListener("click", onClick);
      r.addEventListener("input", onInput);
      r.addEventListener("keydown", onKeydown);
      r.__nvBound = true;
    }
  },
  /* 供校验脚本使用（不影响页面逻辑） */
  _debug: { sectionsFor: sectionsFor, makeQuestions: makeQuestions, buildSummary: buildSummary,
            outlineWeek: outlineWeek, bodyLines: bodyLines, printOutline: printOutline,
            buildMindmap: buildMindmap, buildCloze: buildCloze, secMarks: secMarks,
            setCtx: function(c){ NS = c; }, getCtx: function(){ return NS; } }
};

})();
