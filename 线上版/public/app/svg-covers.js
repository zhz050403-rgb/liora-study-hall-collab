/* 5 门 UNSW 核心课 + 课外拓展 定制纯矢量 SVG 封面（零破图、Retina 绝对锐利、学院书房风格） */
(function () {
  'use strict';

  var COVERS = {
    accounting: function () {
      return '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="会计学封面">' +
        '<defs><linearGradient id="g-acc" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f2744"/><stop offset="100%" stop-color="#1e497a"/></linearGradient></defs>' +
        '<rect width="320" height="180" fill="url(#g-acc)"/>' +
        '<circle cx="272" cy="36" r="68" fill="#c69f50" fill-opacity="0.14"/>' +
        '<rect x="186" y="42" width="104" height="96" rx="8" fill="#ffffff" fill-opacity="0.08" stroke="#e4c67f" stroke-opacity="0.45"/>' +
        '<line x1="238" y1="64" x2="238" y2="124" stroke="#e4c67f" stroke-width="2"/>' +
        '<line x1="202" y1="74" x2="274" y2="74" stroke="#e4c67f" stroke-width="2"/>' +
        '<text x="208" y="69" fill="#f7e7be" font-size="11" font-family="Georgia,serif" font-weight="700">Dr</text>' +
        '<text x="252" y="69" fill="#f7e7be" font-size="11" font-family="Georgia,serif" font-weight="700">Cr</text>' +
        '<line x1="204" y1="90" x2="230" y2="90" stroke="#a9c5e6" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="204" y1="104" x2="226" y2="104" stroke="#a9c5e6" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="246" y1="90" x2="272" y2="90" stroke="#e4c67f" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="246" y1="104" x2="268" y2="104" stroke="#e4c67f" stroke-width="2" stroke-linecap="round"/>' +
        '<text x="22" y="54" fill="#ebd094" font-size="11" font-family="sans-serif" letter-spacing="2" font-weight="700">UNSW FNDN</text>' +
        '<text x="22" y="88" fill="#ffffff" font-size="24" font-family="Georgia,serif" font-weight="700">A = L + OE</text>' +
        '<text x="22" y="114" fill="#bcd0e6" font-size="12" font-family="sans-serif">复式记账 · 账表与财务分析</text>' +
      '</svg>';
    },
    economics: function () {
      return '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="经济学封面">' +
        '<defs><linearGradient id="g-eco" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#11332a"/><stop offset="100%" stop-color="#1f5c4a"/></linearGradient></defs>' +
        '<rect width="320" height="180" fill="url(#g-eco)"/>' +
        '<circle cx="276" cy="34" r="64" fill="#c69f50" fill-opacity="0.16"/>' +
        '<g stroke="#e4c67f" stroke-width="1.8" fill="none">' +
          '<line x1="196" y1="42" x2="196" y2="132"/><line x1="196" y1="132" x2="292" y2="132"/>' +
          '<path d="M206 54 Q244 92 284 122" stroke="#8de0be" stroke-width="2.4"/>' +
          '<path d="M206 122 Q244 92 284 54" stroke="#f2cf7e" stroke-width="2.4"/>' +
          '<circle cx="245" cy="88" r="4.5" fill="#ffffff" stroke="none"/>' +
        '</g>' +
        '<text x="22" y="54" fill="#ebd094" font-size="11" font-family="sans-serif" letter-spacing="2" font-weight="700">MICRO &amp; MACRO</text>' +
        '<text x="22" y="88" fill="#ffffff" font-size="23" font-family="Georgia,serif" font-weight="700">Supply &amp; Demand</text>' +
        '<text x="22" y="114" fill="#b7ddd0" font-size="12" font-family="sans-serif">PPC · 弹性 · AD-AS 宏观模型</text>' +
      '</svg>';
    },
    mathematics: function () {
      return '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="商业数学封面">' +
        '<defs><linearGradient id="g-math" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2b2113"/><stop offset="100%" stop-color="#61471d"/></linearGradient></defs>' +
        '<rect width="320" height="180" fill="url(#g-math)"/>' +
        '<path d="M188 134 C210 52, 246 138, 294 46" fill="none" stroke="#f4d483" stroke-width="2.5"/>' +
        '<path d="M206 134 L206 94 C222 72, 240 100, 256 96 L256 134 Z" fill="#f4d483" fill-opacity="0.22"/>' +
        '<line x1="184" y1="134" x2="296" y2="134" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.2"/>' +
        '<text x="22" y="54" fill="#f2d692" font-size="11" font-family="sans-serif" letter-spacing="2" font-weight="700">MATH1202</text>' +
        '<text x="22" y="88" fill="#ffffff" font-size="25" font-family="Georgia,serif" font-weight="700">∫ f(x) dx</text>' +
        '<text x="22" y="114" fill="#e8d8b7" font-size="12" font-family="sans-serif">函数微积分 · 金融数列 · 概率分布</text>' +
      '</svg>';
    },
    computing: function () {
      return '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="计算机应用封面">' +
        '<defs><linearGradient id="g-comp" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#231942"/><stop offset="100%" stop-color="#4b3486"/></linearGradient></defs>' +
        '<rect width="320" height="180" fill="url(#g-comp)"/>' +
        '<rect x="190" y="42" width="106" height="92" rx="8" fill="#ffffff" fill-opacity="0.09" stroke="#d5c2ff" stroke-opacity="0.45"/>' +
        '<line x1="190" y1="68" x2="296" y2="68" stroke="#d5c2ff" stroke-opacity="0.4"/>' +
        '<line x1="228" y1="42" x2="228" y2="134" stroke="#d5c2ff" stroke-opacity="0.3"/>' +
        '<line x1="264" y1="42" x2="264" y2="134" stroke="#d5c2ff" stroke-opacity="0.3"/>' +
        '<text x="198" y="60" fill="#f3d88f" font-size="11" font-family="monospace" font-weight="700">=XLOOKUP()</text>' +
        '<text x="198" y="92" fill="#e6dcff" font-size="10.5" font-family="monospace">$A$1 · IF</text>' +
        '<text x="198" y="116" fill="#e6dcff" font-size="10.5" font-family="monospace">SUMIFS()</text>' +
        '<text x="22" y="54" fill="#f2d692" font-size="11" font-family="sans-serif" letter-spacing="2" font-weight="700">EXCEL &amp; WORD</text>' +
        '<text x="22" y="88" fill="#ffffff" font-size="22" font-family="Georgia,serif" font-weight="700">Computing</text>' +
        '<text x="22" y="114" fill="#d5caf0" font-size="12" font-family="sans-serif">闭卷实操 · 函数查找 · 学术排版</text>' +
      '</svg>';
    },
    english: function () {
      return '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="学术英语封面">' +
        '<defs><linearGradient id="g-eng" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3c1518"/><stop offset="100%" stop-color="#7c282e"/></linearGradient></defs>' +
        '<rect width="320" height="180" fill="url(#g-eng)"/>' +
        '<circle cx="268" cy="40" r="64" fill="#e9c87c" fill-opacity="0.16"/>' +
        '<rect x="196" y="42" width="94" height="96" rx="8" fill="#ffffff" fill-opacity="0.10" stroke="#f0d596" stroke-opacity="0.45"/>' +
        '<line x1="210" y1="68" x2="276" y2="68" stroke="#f5dfa8" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="210" y1="84" x2="268" y2="84" stroke="#f5dfa8" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="210" y1="100" x2="256" y2="100" stroke="#f5dfa8" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="210" y1="116" x2="272" y2="116" stroke="#f5dfa8" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round"/>' +
        '<text x="22" y="54" fill="#f3d895" font-size="11" font-family="sans-serif" letter-spacing="2" font-weight="700">STD O2 · A1–A4</text>' +
        '<text x="22" y="88" fill="#ffffff" font-size="22" font-family="Georgia,serif" font-weight="700">Academic Eng.</text>' +
        '<text x="22" y="114" fill="#f1cfd1" font-size="12" font-family="sans-serif">阅读定位 · 听力逻辑 · 学术转述</text>' +
      '</svg>';
    },
    extracurricular: function () {
      return '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="课外拓展封面">' +
        '<defs><linearGradient id="g-ext" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#192838"/><stop offset="100%" stop-color="#35526e"/></linearGradient></defs>' +
        '<rect width="320" height="180" fill="url(#g-ext)"/>' +
        '<circle cx="256" cy="90" r="52" fill="#c69f50" fill-opacity="0.18" stroke="#e4c67f" stroke-opacity="0.5"/>' +
        '<text x="22" y="56" fill="#ebd094" font-size="11" font-family="sans-serif" letter-spacing="2" font-weight="700">EXTRACURRICULAR</text>' +
        '<text x="22" y="90" fill="#ffffff" font-size="21" font-family="Georgia,serif" font-weight="700">法律与财富管理</text>' +
        '<text x="22" y="116" fill="#c5d7e8" font-size="12" font-family="sans-serif">企业法律 · 商业能力 · 投资演练</text>' +
      '</svg>';
    }
  };

  window.LioraCovers = {
    svgFor: function (id) {
      return (COVERS[id] || COVERS.accounting)();
    }
  };
})();
