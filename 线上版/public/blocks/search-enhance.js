/* search-enhance.js — 接管主页顶部全局搜索（2026-11-13）
 *
 * 为什么要这个文件：
 *   主页 index.html 的内联搜索把笔记正文用 textarea.innerHTML→.value 提取，
 *   这条路对 HTML 实体（&amp; 等）和畸形标签处理不干净，且只到「周」粒度。
 *   本项目红线禁止改 index.html 内联脚本，所以这里用「克隆输入框剥离旧监听 + 重建索引」的方式接管，
 *   数据全部来自全局 window.PORTAL_DATA（含每周边独立的 topics = 知识点列表）。
 *
 * 改进点：
 *   1) 正文用 div.textContent 提取，标签被剥离、实体被解码，搜索更准；
 *   2) 索引细化到「知识点」：每个 topic 一条，搜术语直接命中具体知识点，并带周次 / 课程上下文；
 *   3) 分组：课程 / 周次 / 知识点，沿用主页已有 CSS（.sr-group / .sr-item / .sr-t / .sr-s），不改样式。
 */
(function () {
  "use strict";

  function clean(html) {
    var d = document.createElement("div");
    d.innerHTML = html || "";
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m];
    });
  }

  function buildIndex() {
    var PD = window.PORTAL_DATA;
    var idx = [];
    if (!PD || !PD.courses) return idx;
    PD.courses.forEach(function (c) {
      var up = c.extra ? "M" : (c.reading ? "C" : "W");
      var uw = c.extra ? "个模块" : (c.reading ? "章" : "周");
      var weekCount = c.terms.reduce(function (a, t) { return a + t.weeks.length; }, 0);
      idx.push({
        type: "course",
        title: c.nameCn,
        sub: c.name + " · " + weekCount + " " + uw,
        href: "#/c/" + c.id
      });
      c.terms.forEach(function (t) {
        t.weeks.forEach(function (w) {
          var href = "#/c/" + c.id + "/" + t.id + "/" + w.num;
          var plain = clean((w.notesHtml || "") + " " + (w.graphicHtml || ""));
          var topics = w.topics || [];
          // 周次条目：命中正文时也给出整周入口
          idx.push({
            type: "week",
            title: up + w.num + " · " + w.title,
            sub: c.nameCn + (c.terms.length > 1 ? " · " + t.name : ""),
            href: href,
            text: plain + " " + topics.join(" ")
          });
          // 知识点条目：每个 topic 一条，精确到知识点
          topics.forEach(function (tp) {
            idx.push({
              type: "topic",
              title: tp,
              sub: up + w.num + " · " + w.title + " · " + c.nameCn,
              href: href,
              text: tp + " " + plain
            });
          });
        });
      });
    });
    return idx;
  }

  var INDEX = null;

  function runSearch(q, sr) {
    q = (q || "").trim().toLowerCase();
    if (!q) { sr.className = "search-results"; sr.innerHTML = ""; return; }
    if (INDEX === null) INDEX = buildIndex();
    var hits = [];
    for (var i = 0; i < INDEX.length; i++) {
      var it = INDEX[i];
      var hay = (it.title + " " + (it.sub || "") + " " + (it.text || "")).toLowerCase();
      if (hay.indexOf(q) !== -1) {
        // 知识点优先排在周次前面（更精确）
        hits.push(it);
        if (hits.length >= 24) break;
      }
    }
    var html = "";
    if (!hits.length) {
      html = '<div class="sr-empty">没有找到「' + esc(q) + '」相关内容</div>';
    } else {
      // 先知识点，再周次，再课程
      var order = { topic: 0, week: 1, course: 2 };
      hits.sort(function (a, b) { return order[a.type] - order[b.type]; });
      var lastType = "";
      hits.forEach(function (h) {
        var label = h.type === "course" ? "课程" : (h.type === "topic" ? "知识点" : "周次");
        if (h.type !== lastType) {
          html += '<div class="sr-group">' + label + "</div>";
          lastType = h.type;
        }
        html += '<a class="sr-item" href="' + esc(h.href) + '"><div class="sr-t">' +
          esc(h.title) + '</div><div class="sr-s">' + esc(h.sub || "") + "</div></a>";
      });
    }
    sr.innerHTML = html;
    sr.className = "search-results open";
  }

  function init() {
    var wrap = document.querySelector(".search-wrap");
    var sr = document.getElementById("searchResults");
    var si = document.getElementById("searchInput");
    if (!wrap || !sr || !si || si.__searchEnhanced) return;
    si.__searchEnhanced = true;
    // 克隆以剥离主页内联绑定的旧监听（搜索只在克隆节点上生效）
    var clone = si.cloneNode(true);
    clone.__searchEnhanced = true;
    si.parentNode.replaceChild(clone, si);
    clone.addEventListener("input", function () { runSearch(clone.value, sr); });
    clone.addEventListener("focus", function () { if (clone.value) runSearch(clone.value, sr); });
    // 点击搜索框以外区域关闭下拉
    document.addEventListener("click", function (e) {
      if (wrap.contains(e.target)) return;
      sr.className = "search-results";
    });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  // 兜底：DOMContentLoaded 可能已错过（脚本晚到），稍后再试一次
  setTimeout(init, 400);
})();
