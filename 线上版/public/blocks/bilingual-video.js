/* =====================================================================
   Liora 学习小屋 · 中英对照讲解（同一内容，中文 / English 各一讲）
   ---------------------------------------------------------------------
   一个文件负责三件事，index.html / daily-brief.html 只加一行 script 引用：
     1) 数据表 window.BILINGUAL_VIDEOS —— 换网址只改这一处
     2) 独立页 bilingual-video.html  —— 按课程分组的全部 Unit 对照卡片
     3) 课程周页注入 —— 「🎬 中英视频」标签 + 本周面板里的直达链接

   视频源说明（2026-11-12 已逐个核验 B 站分集号与英文链接可达性）：
     · B 站链接用 player.bilibili.com 的官方嵌入播放器，点「播放」才加载
     · YouTube 链接用 youtube-nocookie.com/embed，保留原网址；
       国内网络打不开时卡片上有明确提示与「打开原网址」兜底
   · Khan Academy / MIT / 国家智慧教育平台是完整课程页面（不是可内嵌播放器），
     统一做成「打开课程页 ↗」链接卡，不假装能在页面里播
     · 会计按「每行一个知识点」：11 个 Unit / 36 行，数据源 build/accounting_data.py；
       U8–U11 是「财务报表入门全集·中英双语 11 讲」同一讲的中英双版本
       （中文 p=N ↔ 英文 p=N+11），可直接播
     · 会计 U1–U7 的英文多为同一条 YouTube 长课按 &t= 时间点跳转，
       yt() 会把起始秒写进 embed 的 &start=，否则永远从 00:00 播
     · 经济学按「每行一个知识点」：9 个 Unit / 49 行，每行中文 + English 各一条；
       完整数据来源与核验脚本在 build/economics_data.py，页面上保留未实测项说明
   ===================================================================== */
(function () {
  'use strict';
  if (window.__lioraBilingualVideo) return;
  window.__lioraBilingualVideo = 1;

  var SHARE = 'L4NKT6REQ6';
  var PAGE = 'bilingual-video.html?sharecode=' + SHARE;

  function bili(bvid, page, title) {
    return {
      kind: 'bili', bvid: bvid, page: page, title: title,
      url: 'https://www.bilibili.com/video/' + bvid + '/?p=' + page,
      src: 'https://player.bilibili.com/player.html?bvid=' + bvid +
           '&page=' + page + '&autoplay=0&danmaku=0&high_quality=1'
    };
  }
  /* YouTube 支持起始秒：用户给的长课链接带 &t=NNNs，
     内嵌播放器要用 &start=NNN，否则永远从 00:00 播，找不到对应知识点。 */
  function yt(id, title, start) {
    var t = Math.max(0, parseInt(start, 10) || 0);
    return {
      kind: 'yt', id: id, title: title, start: t,
      url: 'https://www.youtube.com/watch?v=' + id + (t ? '&t=' + t + 's' : ''),
      src: 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&hl=en' + (t ? '&start=' + t : '')
    };
  }
  function fmtTime(sec) {
    var n = parseInt(sec, 10) || 0;
    var m = Math.floor(n / 60), s = n % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  /* 课程目录页（Khan Academy / 国家智慧教育平台等）：不是单个视频，
     且站点不允许 iframe 内嵌，所以做成「打开课程页」的链接卡，不假装能播。 */
  function web(title, url, note) {
    return { kind: 'web', title: title, url: url, note: note || '', src: '' };
  }
  /* 原表写「暂缺」的那一行：不编造网址，只给一个真实可用的备用系列并说清楚 */
  function missing(title, url, note) {
    return {
      kind: 'web', title: title, url: url, src: '', note: note || '',
      btn: '打开 B 站备用系列 ↗', badge: '英文暂缺 · 先看备用'
    };
  }
  /* 经济学专用：Khan Academy 的 /v/ 单讲页或专题页。
     它是完整网页而不是可内嵌播放器，所以做成「打开英文课程」链接卡。 */
  function ka(title, url, note) {
    return {
      kind: 'web', title: title, url: url, src: '',
      note: note || 'Khan Academy 英文原声讲解；点开后在新标签页观看',
      btn: '打开英文课程 ↗', badge: 'Khan Academy · 点开观看'
    };
  }
  function toArr(v) { return Object.prototype.toString.call(v) === '[object Array]' ? v : [v]; }

  /* ---------------- 数据表：以后换网址 / 加课程只改这里 ---------------- */
  var DATA = {
    accounting: {
      label: '会计学', en: 'Accounting', key: 'accounting', rowsMode: true,
      inlineSubText: '每个知识点单独一行，中文 / English 各一条；U8–U11 中英双语分集可直接播，U1–U7 英文换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕）也能直接播，YouTube 原链接保留作「原网址」。按 Unit 选，下面列出这个 Unit 的全部知识点。',
      rowsNoteText: '<b>会计按知识点逐行配课：</b>11 个 Unit 下共 36 行，每行一条中文 + 一条 English。中文主要是北大光华《会计学基础》与《经典会计学原理》的 B 站具体分集，点「播放中文」就在这一页播；U8–U11 的英文是同一合集的中英双版本，也能直接播。<b>U1–U7 的英文主源已换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，共 69 讲），可直接在页面里播</b>；你之前给的 YouTube 长课按时间点跳转的链接保留作「原网址」备用（国内网络打不开时点「在 YouTube 打开 ↗」）。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。所有 B 站分集号已逐个用官方接口核验存在，但<b>音轨、逐条跳转与嵌入播放尚未全部实测</b>，不标记为「全部验证通过」。U2「会计假设」原表英文写「暂缺」，已用该系列 P1 作为框架讲解补上，未编造网址。',
      ytNoteText: '这一行英文在 B 站可直接播（Tera Courses 系列）；若你点的是「YouTube 原链接」那条，国内网络可能打不开，请点「在 YouTube 打开 ↗」看原网址。',
      units: [
        { u: "U1", term: "U1–U7 · 基础会计与账簿", en: '', cn: '', rows: [
          { t: "Introduction to Accounting｜会计导论", cnV: [bili("BV1sJ411z7wo", 1, "1.1 会计是什么")], enV: [bili("BV1Yy9zBPEBj", 1, "英文·Tera Courses P1 财务报告概述"), yt("yYX4bvQSqbo", "Accounting Basics（YouTube 原链接）", 0)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Accounting Cycle｜会计循环", cnV: [bili("BV1sJ411z7wo", 15, "3.3 会计循环")], enV: [bili("BV1Yy9zBPEBj", 2, "英文·Tera Courses P2 财务报告"), yt("gPBhGkBN30s", "Accounting Cycle（YouTube 原链接）", 58)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" }
        ] },
        { u: "U2", term: "U1–U7 · 基础会计与账簿", en: '', cn: '', rows: [
          { t: "Accounting Assumptions｜会计假设", cnV: [bili("BV1sJ411z7wo", 3, "1.3 其他会计假设")], enV: [bili("BV1Yy9zBPEBj", 1, "英文·Tera Courses P1 财务报告概述（含会计基本框架）")], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Accrual Accounting｜权责发生制", cnV: [bili("BV1sJ411z7wo", 10, "2.7 权责发生制与收入")], enV: [bili("BV1Yy9zBPEBj", 10, "英文·Tera Courses P10 收入与费用"), yt("gPBhGkBN30s", "Accrual Accounting（YouTube 原链接）", 4669)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Revenue Recognition｜收入确认", cnV: [bili("BV1sJ411z7wo", 10, "2.7 权责发生制与收入")], enV: [bili("BV1Yy9zBPEBj", 10, "英文·Tera Courses P10 收入与费用"), yt("0mY5Vypn624", "Revenue Recognition（YouTube 原链接）", 0)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" }
        ] },
        { u: "U3", term: "U1–U7 · 基础会计与账簿", en: '', cn: '', rows: [
          { t: "Accounting Equation｜会计恒等式", cnV: [bili("BV1sJ411z7wo", 5, "2.2 会计恒等式")], enV: [bili("BV1Yy9zBPEBj", 3, "英文·Tera Courses P3 资产负债表等式"), yt("gPBhGkBN30s", "Accounting Equation（YouTube 原链接）", 894)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Assets｜资产", cnV: [bili("BV1sJ411z7wo", 6, "2.3 资产")], enV: [bili("BV1Yy9zBPEBj", 4, "英文·Tera Courses P4 资产、负债与股东权益"), yt("gPBhGkBN30s", "Assets（YouTube 原链接）", 2738)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Liabilities & Owner's Equity｜负债与所有者权益", cnV: [bili("BV1sJ411z7wo", 8, "2.5 负债与所有者权益")], enV: [bili("BV1Yy9zBPEBj", 4, "英文·Tera Courses P4 资产、负债与股东权益"), yt("gPBhGkBN30s", "Liabilities & Owner's Equity（YouTube 原链接）", 3248)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Debits & Credits｜借贷记账规则", cnV: [bili("BV1sJ411z7wo", 14, "3.2 会计账户与记账规则")], enV: [bili("BV1Yy9zBPEBj", 5, "英文·Tera Courses P5 借方与贷方"), yt("gPBhGkBN30s", "Debits & Credits（YouTube 原链接）", 1109)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Transaction Analysis｜交易分析", cnV: [bili("BV1sJ411z7wo", 9, "2.6 会计恒等式举例（一）")], enV: [bili("BV1Yy9zBPEBj", 7, "英文·Tera Courses P7 Relic Spotter 案例 I"), yt("yYX4bvQSqbo", "Transaction Analysis（YouTube 原链接）", 71)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" }
        ] },
        { u: "U4", term: "U1–U7 · 基础会计与账簿", en: '', cn: '', rows: [
          { t: "General Journal Entries｜普通日记账分录", cnV: [bili("BV1sJ411z7wo", 16, "3.4 会计分录")], enV: [bili("BV1Yy9zBPEBj", 7, "英文·Tera Courses P7 Relic Spotter 案例 I"), yt("gPBhGkBN30s", "General Journal Entries（YouTube 原链接）", 2075)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Purchase & Sales Transactions｜购销业务核算", cnV: [bili("BV1sJ411z7wo", 28, "6.2 采购活动核算")], enV: [bili("BV1Yy9zBPEBj", 7, "英文·Tera Courses P7 Relic Spotter 案例 I（购销交易举例）"), yt("9rfrlKq9tSc", "Purchase & Sales Transactions（YouTube 原链接）", 0)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Periodic Inventory System｜定期盘存制", cnV: [web("国家智慧教育平台 · 会计学专题课程", "https://higher.smartedu.cn/course/68003cb6b836e5522a755e98", "这是完整课程页面，不是单个视频，点开后按目录找「定期盘存制」；已确认页面可访问（200）。")], enV: [yt("KOb3E5H79_w", "Periodic Inventory System｜定期盘存制", 0)], note: "中文是课程目录页，点开后按目录找对应专题，不能嵌进网页播放。" }
        ] },
        { u: "U5", term: "U1–U7 · 基础会计与账簿", en: '', cn: '', rows: [
          { t: "Adjusting Entries Overview｜调整分录概览", cnV: [bili("BV1sJ411z7wo", 35, "7.2 调整账项——类别")], enV: [bili("BV1Yy9zBPEBj", 12, "英文·Tera Courses P12 调整分录 I"), yt("gPBhGkBN30s", "Adjusting Entries Overview（YouTube 原链接）", 7145)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Prepaid Expenses｜预付费用", cnV: [bili("BV1sJ411z7wo", 36, "7.3 调整账项——递延项目")], enV: [bili("BV1Yy9zBPEBj", 12, "英文·Tera Courses P12 调整分录 I"), yt("gPBhGkBN30s", "Prepaid Expenses（YouTube 原链接）", 7683)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Unearned Revenue｜预收收入", cnV: [bili("BV1sJ411z7wo", 36, "7.3 调整账项——递延项目")], enV: [bili("BV1Yy9zBPEBj", 12, "英文·Tera Courses P12 调整分录 I"), yt("gPBhGkBN30s", "Unearned Revenue（YouTube 原链接）", 8186)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Accrued Expenses｜应计费用", cnV: [bili("BV1sJ411z7wo", 37, "7.4 调整账项——应计项目")], enV: [bili("BV1Yy9zBPEBj", 13, "英文·Tera Courses P13 调整分录 II"), yt("gPBhGkBN30s", "Accrued Expenses（YouTube 原链接）", 8729)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Accrued Revenue｜应计收入", cnV: [bili("BV1sJ411z7wo", 37, "7.4 调整账项——应计项目")], enV: [bili("BV1Yy9zBPEBj", 13, "英文·Tera Courses P13 调整分录 II"), yt("gPBhGkBN30s", "Accrued Revenue（YouTube 原链接）", 9423)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Depreciation｜折旧", cnV: [bili("BV1sJ411z7wo", 38, "7.5 调整账项——估计项目")], enV: [bili("BV1Yy9zBPEBj", 37, "英文·Tera Courses P37 有形资产 I"), yt("gPBhGkBN30s", "Depreciation（YouTube 原链接）", 9890)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Straight-Line Depreciation｜直线法折旧", cnV: [bili("BV1sJ411z7wo", 38, "7.5 调整账项——估计项目")], enV: [bili("BV1Yy9zBPEBj", 37, "英文·Tera Courses P37 有形资产 I"), yt("gPBhGkBN30s", "Straight-Line Depreciation（YouTube 原链接）", 10551)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" }
        ] },
        { u: "U6", term: "U1–U7 · 基础会计与账簿", en: '', cn: '', rows: [
          { t: "T-Accounts｜T 型账户", cnV: [bili("BV1TvwVe5Ehc", 5, "「T型账户」是什么")], enV: [bili("BV1Yy9zBPEBj", 5, "英文·Tera Courses P5 借方与贷方（T 型账户）"), yt("gPBhGkBN30s", "T-Accounts（YouTube 原链接）", 1509)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Posting to Ledger｜过账到分类账", cnV: [bili("BV1zM4y1W73X", 15, "3.2 会计账簿（一）")], enV: [bili("BV1Yy9zBPEBj", 4, "英文·Tera Courses P4 资产、负债与股东权益（分类账）"), yt("gPBhGkBN30s", "Posting to Ledger（YouTube 原链接）", 6203)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Balancing Ledger Accounts (c/d & b/d)｜账户结平", cnV: [bili("BV1YQcezzEeK", 1, "10 分钟彻底讲透会计 T 型账户和余额公式")], enV: [bili("BV1Yy9zBPEBj", 5, "英文·Tera Courses P5 借方与贷方（账户结平）"), yt("vmiCtAsINAA", "Balancing Ledger Accounts（YouTube 原链接）", 0)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" }
        ] },
        { u: "U7", term: "U1–U7 · 基础会计与账簿", en: '', cn: '', rows: [
          { t: "Columnar Ledger / Running Balance｜多栏式分类账", cnV: [bili("BV1zM4y1W73X", 16, "3.3 会计账簿（二）")], enV: [bili("BV1Yy9zBPEBj", 4, "英文·Tera Courses P4 资产、负债与股东权益（多栏式分类账）"), yt("R5bmEZ39Fro", "Columnar Ledger（YouTube 原链接）", 0)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" },
          { t: "Trial Balance｜试算平衡", cnV: [bili("BV1sJ411z7wo", 34, "7.1 试算平衡")], enV: [bili("BV1Yy9zBPEBj", 16, "英文·Tera Courses P16 财务报表与结账分录（含试算平衡）"), yt("gPBhGkBN30s", "Trial Balance（YouTube 原链接）", 6745)], note: "英文主源换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，可直接播）；YouTube 原链接保留作「原网址」备用。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题，不是逐讲一一对应。" }
        ] },
        { u: "U8", term: "U8–U11 · 财务报表中英双语", en: '', cn: '', rows: [
          { t: "Income Statement Basics｜利润表基础", cnV: [bili("BV1ueN96EEET", 5, "[中文] 05-利润表详解看赚钱能力")], enV: [bili("BV1ueN96EEET", 16, "[英文] 05-利润表详解看赚钱能力")], note: "同一合集的中 / 英双版本（中文 p=5 ↔ 英文 p=16），是真正同内容对照。" },
          { t: "Preparing an Income Statement｜编制利润表", cnV: [bili("BV1ueN96EEET", 6, "[中文] 06-利润表入门从零做损益表")], enV: [bili("BV1ueN96EEET", 17, "[英文] 06-利润表入门从零做损益表")], note: "同一合集的中 / 英双版本（中文 p=6 ↔ 英文 p=17），是真正同内容对照。" }
        ] },
        { u: "U9", term: "U8–U11 · 财务报表中英双语", en: '', cn: '', rows: [
          { t: "Balance Sheet Basics｜资产负债表基础", cnV: [bili("BV1ueN96EEET", 3, "[中文] 03-资产负债表如何运作")], enV: [bili("BV1ueN96EEET", 14, "[英文] 03-资产负债表如何运作")], note: "同一合集的中 / 英双版本（中文 p=3 ↔ 英文 p=14），是真正同内容对照。" },
          { t: "Preparing a Balance Sheet｜编制资产负债表", cnV: [bili("BV1ueN96EEET", 4, "[中文] 04-资产负债表完整示例")], enV: [bili("BV1ueN96EEET", 15, "[英文] 04-资产负债表完整示例")], note: "同一合集的中 / 英双版本（中文 p=4 ↔ 英文 p=15），是真正同内容对照。" }
        ] },
        { u: "U10", term: "U8–U11 · 财务报表中英双语", en: '', cn: '', rows: [
          { t: "Understanding Financial Statements｜读懂财务报表", cnV: [bili("BV1ueN96EEET", 2, "[中文] 02-读懂财报的关键")], enV: [bili("BV1ueN96EEET", 13, "[英文] 02-读懂财报的关键")], note: "同一合集的中 / 英双版本（中文 p=2 ↔ 英文 p=13），是真正同内容对照。" },
          { t: "Financial Ratios｜财务比率分析", cnV: [bili("BV1ueN96EEET", 11, "[中文] 11-财务比率分析实战")], enV: [bili("BV1ueN96EEET", 22, "[英文] 11-财务比率分析实战")], note: "同一合集的中 / 英双版本（中文 p=11 ↔ 英文 p=22），是真正同内容对照。" },
          { t: "Financial Statement Analysis Methods｜报表分析方法", cnV: [bili("BV1tr4y1D7dN", 2, "02 财务报表分析概论的基本方法、框架与路径")], enV: [yt("5ofJX-gvzP4", "Financial Statement Analysis Methods｜报表分析方法", 0)] }
        ] },
        { u: "U11", term: "U8–U11 · 财务报表中英双语", en: '', cn: '', rows: [
          { t: "Cash Flow Statement Introduction｜现金流量表简介", cnV: [bili("BV1ueN96EEET", 7, "[中文] 07-现金流量表直接法简介")], enV: [bili("BV1ueN96EEET", 18, "[英文] 07-现金流量表直接法简介")], note: "同一合集的中 / 英双版本（中文 p=7 ↔ 英文 p=18），是真正同内容对照。" },
          { t: "Direct Method｜直接法", cnV: [bili("BV1ueN96EEET", 8, "[中文] 08-直接法编制现金流量表")], enV: [bili("BV1ueN96EEET", 19, "[英文] 08-直接法编制现金流量表")], note: "同一合集的中 / 英双版本（中文 p=8 ↔ 英文 p=19），是真正同内容对照。" },
          { t: "Indirect Method｜间接法", cnV: [bili("BV1ueN96EEET", 9, "[中文] 09-间接法编制现金流量表")], enV: [bili("BV1ueN96EEET", 20, "[英文] 09-间接法编制现金流量表")], note: "同一合集的中 / 英双版本（中文 p=9 ↔ 英文 p=20），是真正同内容对照。" },
          { t: "Cash Flow Statement Full Example｜现金流量表完整例题", cnV: [bili("BV1ueN96EEET", 10, "[中文] 10-现金流量表从零到精通")], enV: [bili("BV1ueN96EEET", 21, "[英文] 10-现金流量表从零到精通")], note: "同一合集的中 / 英双版本（中文 p=10 ↔ 英文 p=21），是真正同内容对照。" }
        ] }
      ]
    },
    economics: {
      label: "经济学", en: "Foundation Economics", key: 'economics', rowsMode: true,
      inlineSubText: '每个知识点单独一行，中文 / English 各一条；中文 B 站分集可直接播，Khan Academy 要点开观看。按 Unit 选，下面会列出这个 Unit 的所有知识点。',
      rowsNoteText: '<b>这一门按知识点逐行配课：</b>9 个 Unit 下共 49 行，每行一条中文 + 一条 English 对照。中文是 B 站具体分集，点「播放中文」就在这一页播；英文以 Khan Academy 为主，属于完整课程页面而非可内嵌播放器，点「打开英文课程 ↗」在新标签页观看。分集号已逐个核验存在，但<b>音轨、逐条跳转与嵌入播放尚未全部实测</b>，页面底部有完整核查说明，不标记为「全部验证通过」。',
      ytNoteText: '这一行英文来自 YouTube / MIT 公开课，部分国内网络打不开；若一直在转圈，请点「在 YouTube 打开 ↗」看原网址。',
      units: [
        { u: "U1", term: "Term 1 · U1–U5", en: '', cn: '', rows: [
          { t: "Introduction to Economics｜经济学导论", cnV: bili("BV1mA411b7JY", 1, "001 AP经济学：经济学定义，资源与稀缺性"), enV: ka("Khan Academy · Introduction to Economics", "https://www.khanacademy.org/economics-finance-domain/ap-macroeconomics/basic-economics-concepts-macro/introduction-to-the-economic-way-of-thinking-macro/v/introduction-to-economics") },
          { t: "Four Factors of Production｜四大生产要素", cnV: bili("BV1E54y1o7sk", 1, "生产要素在IB经济学考试中的运用"), enV: ka("Khan Academy · Four Factors of Production", "https://www.khanacademy.org/v/four-factors-of-production") }
        ] },
        { u: "U2", term: "Term 1 · U1–U5", en: '', cn: '', rows: [
          { t: "Opportunity Cost｜机会成本", cnV: bili("BV1mA411b7JY", 2, "002 AP经济学：机会成本"), enV: ka("Khan Academy · Opportunity Cost", "https://www.khanacademy.org/economics-finance-domain/microeconomics/basic-economic-concepts/production-possibilities-curve/v/opportunity-cost") },
          { t: "Marginal Analysis｜边际分析", cnV: bili("BV1mA411b7JY", 3, "003 AP经济学：边际分析"), enV: ka("Khan Academy · Cost-Benefit Analysis", "https://www.khanacademy.org/economics-finance-domain/economics-personal-finance-va/x3ed8f3aede624754%3Afoundations-of-economics/x3ed8f3aede624754%3Adecision-making-and-unintended-consequences/v/cost-benefit-analysis-cba"), note: "英文是「成本收益分析」专题，与边际分析同一决策框架，不是逐字对应的一讲。" },
          { t: "PPC｜生产可能性曲线", cnV: bili("BV1mA411b7JY", 5, "005 AP经济学：PPC 生产可能性曲线"), enV: ka("Khan Academy · Production Possibilities Frontier", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/basic-economic-concepts/production-possibilities-curve-ppc/v/production-possibilities-frontier") },
          { t: "Increasing Opportunity Cost｜递增机会成本", cnV: bili("BV1Gy4y1a7aE", 3, "第3讲 递增机会成本"), enV: ka("Khan Academy · Increasing Opportunity Cost", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/basic-economic-concepts/production-possibilities-curve-ppc/v/increasing-opportunity-cost") },
          { t: "Economic Growth & Investment｜经济增长与投资", cnV: bili("BV1Gy4y1a7aE", 5, "第5讲 通过投资的经济增长"), enV: ka("Khan Academy · Economic Growth Through Investment", "https://www.khanacademy.org/economics-finance-domain/ap-macroeconomics/ap-long-run-consequences-of-stabilization-policies/economic-growth/v/economic-growth-through-investment") }
        ] },
        { u: "U3", term: "Term 1 · U1–U5", en: '', cn: '', rows: [
          { t: "Demand Curve｜需求及需求曲线移动", cnV: bili("BV1mA411b7JY", 7, "007 AP经济学：需求线及其如何移动"), enV: ka("Khan Academy · Price of Related Products and Demand", "https://www.khanacademy.org/v/price-of-related-products-and-demand") },
          { t: "Supply Curve｜供给及供给曲线", cnV: bili("BV1mA411b7JY", 8, "008 AP经济学：供给线和市场均衡"), enV: ka("Khan Academy · Law of Supply", "https://www.khanacademy.org/v/law-of-supply") },
          { t: "Market Equilibrium｜市场均衡", cnV: bili("BV1mA411b7JY", 8, "008 AP经济学：供给线和市场均衡"), enV: ka("Khan Academy · Market Equilibrium", "https://www.khanacademy.org/economics-finance-domain/microeconomics/supply-demand-equilibrium/equilibrium-tutorial/v/market-equilibrium") },
          { t: "Changes in Equilibrium｜均衡变化", cnV: bili("BV1mA411b7JY", 9, "009 AP经济学：均衡的改变"), enV: ka("Khan Academy · Changes in Market Equilibrium", "https://www.khanacademy.org/economics-finance-domain/microeconomics/supply-demand-equilibrium/market-equilibrium-tutorial/v/changes-in-market-equilibrium") }
        ] },
        { u: "U4", term: "Term 1 · U1–U5", en: '', cn: '', rows: [
          { t: "Consumer & Producer Surplus｜消费者与生产者剩余", cnV: bili("BV1mA411b7JY", 10, "010 AP经济学：市场剩余，价格调控"), enV: ka("Khan Academy · Consumer & Producer Surplus", "https://www.khanacademy.org/economics-finance-domain/microeconomics/consumer-producer-surplus") },
          { t: "Price Ceiling｜价格上限", cnV: bili("BV1Gy4y1a7aE", 30, "第30讲 租金控制和无谓损失"), enV: ka("Khan Academy · Rent Control and Deadweight Loss", "https://www.khanacademy.org/economics-finance-domain/microeconomics/consumer-producer-surplus/deadweight-loss-tutorial/v/rent-control-dead-weight-cost") },
          { t: "Price Floor｜价格下限", cnV: bili("BV1Gy4y1a7aE", 31, "第31讲 最低工资和价格下限"), enV: ka("Khan Academy · Minimum Wage and Price Floors", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/unit-2-supply-and-demnd/28/v/minimum-wage-and-price-floors") },
          { t: "Types of Goods｜四种商品类型", cnV: bili("BV1mA411b7JY", 38, "037 AP经济学：私人产品和公共产品"), enV: ka("Khan Academy · Rival and Excludable Goods", "https://www.khanacademy.org/economics-finance-domain/microeconomics/market-failure-and-the-role-of-government/externalities-topic/v/rival-and-excludable-goods"), note: "核验修正：原表给的中文 p=37 实为「土地市场」，已改为 p=38「私人产品和公共产品」。" },
          { t: "Free-rider Problem｜搭便车问题", cnV: bili("BV1RU4y1s7aa", 80, "8.10 免费搭车与公共选择"), enV: ka("Khan Academy / Wi-Phi · What Are Public Goods?", "https://www.khanacademy.org/partner-content/wi-phi/wiphi-value-theory/wiphi-political/v/what-are-public-goods") },
          { t: "Negative Externalities｜负外部性", cnV: bili("BV1mA411b7JY", 39, "038 AP经济学：外部性"), enV: ka("Khan Academy · Negative Externalities", "https://www.khanacademy.org/v/negative-externalities"), note: "核验修正：原表把「负外部性」写在中文 p=38，但 p=38 是「私人产品和公共产品」，外部性在 p=39，已改。" },
          { t: "Positive Externalities｜正外部性", cnV: bili("BV1Gy4y1a7aE", 66, "第66讲 正外部性"), enV: ka("Khan Academy · Positive Externalities", "https://www.khanacademy.org/v/positive-externalities") },
          { t: "Corrective Tax｜庇古税与外部性内部化", cnV: bili("BV1Gy4y1a7aE", 65, "第65讲 考虑外部性而进行的税收"), enV: ka("Khan Academy · Taxes for Factoring in Negative Externalities", "https://www.khanacademy.org/economics-finance-domain/microeconomics/consumer-producer-surplus/externalities-topic/v/taxes-for-factoring-in-negative-externalities") },
          { t: "Lack of Competition｜缺乏竞争与市场失灵", cnV: bili("BV1RU4y1s7aa", 74, "8.4 垄断与管制"), enV: ka("Khan Academy · Monopolies vs Perfect Competition", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/imperfect-competition/ap-monopolies-tutorial/v/monopolies-vs-perfect-competition") }
        ] },
        { u: "U5", term: "Term 1 · U1–U5", en: '', cn: '', rows: [
          { t: "PED｜需求价格弹性、中点公式", cnV: bili("BV1mA411b7JY", 11, "011 AP经济学：Price Elasticity of Demand"), enV: ka("Khan Academy · Price Elasticity of Demand", "https://www.khanacademy.org/economics-finance-domain/microeconomics/market-signals-and-prices/price-elasticity-of-demand") },
          { t: "Determinants of PED｜需求弹性决定因素", cnV: bili("BV1RU4y1s7aa", 20, "2.13 影响需求弹性的因素"), enV: ka("Khan Academy · Determinants of Price Elasticity of Demand", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/unit-2-supply-and-demnd/23/v/determinants-of-price-elasticity-of-demand-ap-microeconomics-khan-academy") },
          { t: "PES｜供给价格弹性", cnV: bili("BV1mA411b7JY", 12, "012 AP经济学：交叉弹性，收入弹性，供给价格弹性"), enV: ka("Khan Academy · Elasticity of Supply", "https://www.khanacademy.org/economics-finance-domain/microeconomics/supply-demand/elasticity-supply/v/elasticity-of-supply") },
          { t: "YED｜需求收入弹性", cnV: bili("BV1mA411b7JY", 12, "012 AP经济学：交叉弹性，收入弹性，供给价格弹性"), enV: ka("Khan Academy · Income Elasticity of Demand", "https://en.khanacademy.org/economics-finance-domain/microeconomics/elasticity-tutorial/income-elasticity-of-demand/v/income-elasticity-of-demand") },
          { t: "XED｜需求交叉弹性", cnV: bili("BV1mA411b7JY", 12, "012 AP经济学：交叉弹性，收入弹性，供给价格弹性"), enV: ka("Khan Academy · Cross Elasticity of Demand", "https://www.khanacademy.org/v/cross-elasticity-of-demand?topic=microeconomics-macroeconomics") },
          { t: "Total Revenue & Elasticity｜总收益与弹性", cnV: bili("BV1Gy4y1a7aE", 21, "第21讲 总收入和弹性"), enV: ka("Khan Academy · Total Revenue and Elasticity", "https://www.khanacademy.org/v/total-revenue-and-elasticity") },
          { t: "TR / AR / MR｜总收益、平均收益、边际收益", cnV: bili("BV1RU4y1s7aa", 50, "5.6 收益的概念与收益曲线"), enV: ka("Khan Academy · FRQ: Perfect Competition", "https://www.khanacademy.org/economics-finance-domain/class-12-microeconomics/x3ff2523b5b42c590%3Amarket-equilibrium/x3ff2523b5b42c590%3Afirm-entry-exit-and-the-shut-down-rule/v/frq-microecononomics-on-perfect-competition"), note: "范围差异（原表已提示）：这条英文是「完全竞争」的 FRQ 练习视频，重点不在 AR/MR 定义，不能视作完整一对一课程。" },
          { t: "Marginal Revenue under Monopoly｜垄断下 MR 曲线", cnV: bili("BV1Gy4y1a7aE", 54, "第54讲 垄断最优定价(第二部分)：边际收入"), enV: ka("Khan Academy · Monopolist Optimizing Price (MR)", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/imperfect-competition/ap-monopolies-tutorial/v/monopolist-optimizing-price-part-2-marginal-revenue") },
          { t: "Profit Maximisation: MR = MC｜利润最大化", cnV: bili("BV1RU4y1s7aa", 51, "5.7 利润最大化原则"), enV: ka("Khan Academy · Marginal Revenue and Marginal Cost", "https://www.khanacademy.org/economics-finance-domain/microeconomics/marginal-revenue-and-marginal-cost/v/marginal-revenue-and-marginal-cost") },
          { t: "Tax Incidence｜税负归属", cnV: bili("BV1mA411b7JY", 13, "013 AP经济学：弹性，税收与补贴"), enV: ka("Khan Academy · Breaking Down Tax Incidence", "https://www.khanacademy.org/v/example-breaking-down-tax-incidence") }
        ] },
        { u: "U6", term: "Term 1 · U6–U9", en: '', cn: '', rows: [
          { t: "Production Function｜生产函数", cnV: bili("BV1RU4y1s7aa", 34, "4.2 生产要素与生产函数"), enV: yt("Q7-mCKOzNUI", "MIT / YouTube · Production Function") },
          { t: "Diminishing Marginal Returns｜边际报酬递减", cnV: bili("BV1RU4y1s7aa", 36, "4.4 边际收益递减规律"), enV: ka("Khan Academy · Total / Marginal / Average Product", "https://www.khanacademy.org/economics-finance-domain/microeconomics/firm-economic-profit/introduction-to-production-and-costs/v/total-product-marginal-product-and-average-product") },
          { t: "TP / AP / MP｜总产量、平均产量、边际产量", cnV: bili("BV1bV4y1K7mW", 1, "总产量、平均产量和边际产量的三方关系"), enV: ka("Khan Academy · Total / Marginal / Average Product", "https://www.khanacademy.org/economics-finance-domain/microeconomics/firm-economic-profit/introduction-to-production-and-costs/v/total-product-marginal-product-and-average-product") },
          { t: "Isoquants｜等产量线", cnV: bili("BV1RU4y1s7aa", 38, "4.6 等产量线的定义"), enV: yt("Q7-mCKOzNUI", "MIT / YouTube · Isoquants"), note: "与「生产函数」共用同一条英文视频，主题覆盖但非逐点对应。" },
          { t: "Isocost & Producer Equilibrium｜等成本线与生产者均衡", cnV: bili("BV1RU4y1s7aa", 41, "4.9 生产者均衡"), enV: yt("y1bnBxfNVkU", "MIT / YouTube · Isocost & Producer Equilibrium") },
          { t: "Fixed / Variable / Marginal Cost｜固定、可变、边际成本", cnV: bili("BV1Gy4y1a7aE", 44, "第44讲 固定、可变和边际成本"), enV: ka("Khan Academy · Fixed, Variable and Marginal Cost", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/production-cost-and-the-perfect-competition-model-temporary/short-run-production-costs/v/fixed-variable-and-marginal-cost") },
          { t: "MC / AVC / ATC｜成本计算与曲线", cnV: bili("BV1Gy4y1a7aE", 46, "第46讲 边际成本和平均总成本"), enV: ka("Khan Academy · MC, AVC and ATC", "https://www.khanacademy.org/economics-finance-domain/microeconomics/firm-economic-profit/firm-economic-profit/average-costs-margin-rev/v/marginal-cost-average-variable-cost-and-average-total-cost") }
        ] },
        { u: "U7", term: "Term 1 · U6–U9", en: '', cn: '', rows: [
          { t: "Perfect Competition｜完全竞争特征", cnV: bili("BV1mA411b7JY", 19, "019 AP经济学：完全竞争市场的特征"), enV: ka("Khan Academy · Perfect Competition", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/production-cost-and-the-perfect-competition-model-temporary/ap-perfect-competition/v/perfect-competition-microeconomics") },
          { t: "Short-run Profit Maximisation｜短期利润最大化", cnV: bili("BV1mA411b7JY", 20, "020 AP经济学：完全竞争市场短期利润最大化"), enV: ka("Khan Academy · Economic Profit in Perfect Competition", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/production-cost-and-the-perfect-competition-model-temporary/ap-perfect-competition/v/economic-profit-for-firms-in-perfectly-competitive-markets") },
          { t: "Shut-down Rule｜短期停产规则", cnV: bili("BV1RU4y1s7aa", 53, "6.2 完全竞争市场的均衡（上）"), enV: ka("Khan Academy · Shutting Down or Exiting an Industry", "https://www.khanacademy.org/economics-finance-domain/microeconomics/firm-economic-profit/firm-entry-exit-and-the-shut-down-rule/v/shutting-down-or-exiting-industry-based-on-price"), note: "范围差异（原表已提示）：中文这条覆盖的是完全竞争市场一般均衡，不是专门的停产规则一讲。" },
          { t: "Long-run Equilibrium｜长期均衡", cnV: bili("BV1mA411b7JY", 21, "021 AP经济学：长期完全竞争市场"), enV: ka("Khan Academy · Long-run Economic Profit", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/production-cost-and-the-perfect-competition-model-temporary/ap-perfect-competition/v/long-run-economic-profit-for-perfectly-competitive-firms") }
        ] },
        { u: "U8", term: "Term 1 · U6–U9", en: '', cn: '', rows: [
          { t: "Monopoly｜垄断市场特征", cnV: bili("BV1mA411b7JY", 23, "023 AP经济学：完全垄断市场的特征"), enV: ka("Khan Academy · Monopolies vs Perfect Competition", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/imperfect-competition/ap-monopolies-tutorial/v/monopolies-vs-perfect-competition") },
          { t: "Monopoly Total Revenue｜垄断总收益与定价", cnV: bili("BV1Gy4y1a7aE", 53, "第53讲 垄断最优定价(第一部分)：总收入"), enV: ka("Khan Academy · Monopolist Optimizing Price (TR)", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/imperfect-competition/ap-monopolies-tutorial/v/monopolist-optimizing-price-part-1-total-revenue") },
          { t: "Monopoly MR & Profit｜垄断边际收益及利润", cnV: bili("BV1mA411b7JY", 24, "024 AP经济学：完全垄断市场里的利润最大化"), enV: ka("Khan Academy · Monopolist Optimizing Price (MR)", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/imperfect-competition/ap-monopolies-tutorial/v/monopolist-optimizing-price-part-2-marginal-revenue") },
          { t: "Price Discrimination｜价格歧视", cnV: bili("BV1mA411b7JY", 26, "026 AP经济学：价格歧视"), enV: ka("Khan Academy · Monopoly Price Discrimination", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/imperfect-competition/ap-price-discrimination-tutorial/v/monopoly-price-discrimination") }
        ] },
        { u: "U9", term: "Term 1 · U6–U9", en: '', cn: '', rows: [
          { t: "Monopolistic Competition｜垄断竞争", cnV: bili("BV1mA411b7JY", 27, "027 AP经济学：垄断竞争市场"), enV: ka("Khan Academy · Monopolistic Competition and Economic Profit", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/imperfect-competition/monopolistic-competition/v/monopolistic-competition-and-economic-profit") },
          { t: "Oligopoly｜寡头垄断", cnV: bili("BV1mA411b7JY", 28, "028 AP经济学：寡头与博弈论"), enV: ka("Khan Academy · Oligopolies and Monopolistic Competition", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/imperfect-competition/monopolistic-competition/v/oligopolies-and-monopolisitc-competition") },
          { t: "Prisoners' Dilemma & Nash Equilibrium｜囚徒困境与纳什均衡", cnV: bili("BV1Gy4y1a7aE", 60, "第60讲 囚徒困境和纳什均衡"), enV: ka("Khan Academy · Prisoners' Dilemma and Nash Equilibrium", "https://www.khanacademy.org/v/prisoners-dilemma-and-nash-equilibrium") },
          { t: "Cartels & Collusion｜卡特尔与合谋", cnV: bili("BV1Gy4y1a7aE", 59, "第59讲 寡头垄断、双头垄断、勾结、卡特尔"), enV: ka("Khan Academy · Why Parties to Cartels Cheat", "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/imperfect-competition/oligopoly-and-game-theory/v/why-parties-to-cartels-cheat") }
        ] }
      ]
    },
    mathematics: {
      label: '商业数学', en: 'Mathematics for Commerce', key: 'mathematics',
      units: [
        { u: 'U0', term: 'Term 1', en: 'Pre-Requisite Knowledge', cn: '基础代数、根式、方程、坐标几何',
          cnV: [ bili('BV1BpMc6REEd', 1,  '1-实数（1）概念精讲'),
                 bili('BV1BpMc6REEd', 10, '10-二次根式（1）概念讲解'),
                 bili('BV1BpMc6REEd', 14, '14-一元二次方程（1）概念精讲'),
                 bili('BV1WoopYpEjf', 8,  '8.平面直角坐标系') ],
          enV: [ web('Khan Academy · College Algebra',
                     'https://www.khanacademy.org/math/college-algebra',
                     '基础代数 / 方程 / 坐标几何；课程目录页，点开后按单元选课') ] },
        { u: 'U1', term: 'Term 1', en: 'Functions & Graphs', cn: '函数与图像',
          cnV: [ bili('BV1nt41197uJ', 78, '函数的概念及其表示：1 函数的概念及区间'),
                 bili('BV1nt41197uJ', 86, '函数的单调性 - 第 1 讲'),
                 bili('BV1WoopYpEjf', 24, '24.二次函数（抛物线）'),
                 bili('BV1WoopYpEjf', 28, '28.反比例函数（双曲线）') ],
          enV: [ web('Khan Academy · Functions & Transformations',
                     'https://www.khanacademy.org/math/college-algebra',
                     '函数与图像变换；与 U0 是同一个课程入口，点开后选 Functions 单元') ] },
        { u: 'U2', term: 'Term 1', en: 'Exponential & Logarithmic Functions', cn: '指数与对数函数',
          cnV: [ bili('BV1QhcRePEKU', 17, '17-第 6 讲 指数与对数运算-1'),
                 bili('BV1QhcRePEKU', 18, '18-第 6 讲 指数与对数运算-2'),
                 bili('BV1QhcRePEKU', 19, '19-第 6 讲 指数与对数运算-3'),
                 bili('BV1QhcRePEKU', 20, '20-第 7 讲 指数函数与对数函数-1'),
                 bili('BV1QhcRePEKU', 21, '21-第 7 讲 指数函数与对数函数-2'),
                 bili('BV1QhcRePEKU', 22, '22-第 7 讲 指数函数与对数函数-3') ],
          enV: [ web('Khan Academy · Exponential & Logarithmic Functions',
                     'https://www.khanacademy.org/math/algebra-home/alg-exp-and-log',
                     '指数与对数函数专题；课程目录页') ],
          note: '表格里写的「第 17–22 集」已全部补齐为 6 个可直接播放的 B 站分集，不用再自己翻合集选集。' },
        { u: 'U3', term: 'Term 1', en: 'Differentiation', cn: '微分与导数',
          cnV: [ bili('BV1CAxaeHEeH', 17, '16 导数的定义'),
                 bili('BV1CAxaeHEeH', 22, '21 复合函数求导'),
                 bili('BV1CAxaeHEeH', 34, '33 极值'),
                 bili('BV1CAxaeHEeH', 35, '34 最值') ],
          enV: [ web('Khan Academy · AP Calculus AB（Units 2–5）',
                     'https://www.khanacademy.org/math/ap-calculus-ab',
                     '对应 Units 2–5：导数定义、求导法则、导数应用') ],
          note: '宋浩《高等数学》2.0 共 149 集，这里按「导数定义 → 复合求导 → 极值 → 最值」挑了四集。' },
        { u: 'U4', term: 'Term 1', en: 'Integration', cn: '积分与面积',
          cnV: [ bili('BV1CAxaeHEeH', 38, '37 不定积分的定义'),
                 bili('BV1CAxaeHEeH', 45, '44 定积分的定义'),
                 bili('BV1CAxaeHEeH', 54, '53 定积分应用（求面积）') ],
          enV: [ web('Khan Academy · AP Calculus AB（Units 6、8）',
                     'https://www.khanacademy.org/math/ap-calculus-ab',
                     '对应 Units 6、8：积分与积分应用') ] },
        { u: 'U5', term: 'Term 1', en: 'Calculus of Exponential & Logarithmic Functions', cn: '指数与对数微积分',
          cnV: [ bili('BV1CAxaeHEeH', 20, '19 求导公式（含指数函数）'),
                 bili('BV1CAxaeHEeH', 25, '24 隐函数求导·对数求导'),
                 bili('BV1CAxaeHEeH', 38, '37 不定积分的定义') ],
          enV: [ web('Khan Academy · AP Calculus AB（指数与对数专题）',
                     'https://www.khanacademy.org/math/ap-calculus-ab',
                     '在课程页里选指数 / 对数函数的导数与积分专题') ],
          note: '合集里没有单独叫「指数与对数微积分」的分集，这里给了最接近的三集；完整内容请点「在 B 站打开」选集。' },
        { u: 'U6', term: 'Term 2', en: 'Sequences & Series', cn: '数列与级数',
          cnV: [ bili('BV1ZTqkBMEnS', 1, '等差等比 + 数列求和！重点知识大梳理') ],
          enV: [ web('Khan Academy · Series & Induction',
                     'https://en.khanacademy.org/math/algebra-home/alg-series-and-induction',
                     '课程目录页，点开后选 Series 单元') ] },
        { u: 'U7', term: 'Term 2', en: 'Financial Mathematics', cn: '金融数学',
          cnV: [ bili('BV1v9iiBUEuS', 1, 'Nolan 亲授 CFA/FRM【连续复利】'),
                 bili('BV1MP4y1a7q8', 1, '考点8：复利终值与复利现值的计算'),
                 bili('BV1qc41147mf', 1, '【公司理财】贴现 + 年金计算大全（普通、永续、先付、递延…）') ],
          enV: [ web('Khan Academy · Interest & Present Value',
                     'https://www.khanacademy.org/economics-finance-domain/core-finance/interest-tutorial/compound-interest-tutorial',
                     '复利与现值；课程目录页'),
                 web('Khan Academy · Present Value（年金 / 现值专题入口）',
                     'https://www.khanacademy.org/economics-finance-domain/core-finance/interest-tutorial/present-value',
                     '补上表格里提到的「年金专题」入口页；点开后按目录找现值 / 年金单元。已确认页面可访问，未逐集核对视频内容。') ],
          note: '表格原给的那条中文链接实际是「连续复利」单集，不是现值 / 终值 / 年金系列；另外补了两条已核验真实存在的 B 站中文课（复利终值现值、年金计算大全）和 Khan Academy 年金 / 现值专题入口，把之前空着的年金主题补上。' },
        { u: 'U8', term: 'Term 2', en: 'Discrete Probability', cn: '离散概率',
          cnV: [ bili('BV1k5qhYsEDA', 1, '排列组合的 25 种题型（下）'),
                 bili('BV19ukbYmEWQ', 1, '条件概率、全概率公式最全考法解析') ],
          enV: [ web('Khan Academy · Permutations & Combinations',
                     'https://en.khanacademy.org/math/statistics-probability/counting-permutations-and-combinations/permutation-lib',
                     '排列组合专题'),
                 web('Khan Academy · Probability',
                     'https://www.khanacademy.org/math/statistics-probability/probability-library',
                     '概率专题') ],
          note: '中文「排列组合」这条是系列的下集；上集等补到网址后可以一起加进来。' },
        { u: 'U9', term: 'Term 2', en: 'Data', cn: '数据与统计',
          cnV: [ bili('BV1ij411f7mH', 9,  '3-1 算术平均数'),
                 bili('BV1ij411f7mH', 12, '3-4 平均差和标准差'),
                 bili('BV1ij411f7mH', 24, '7-1 相关关系的含义与测度'),
                 bili('BV1ij411f7mH', 25, '7-2 回归分析的基本问题') ],
          enV: [ web('Khan Academy · Statistics & Probability',
                     'https://www.khanacademy.org/computing/statistics-probability',
                     '课程目录页，点开后选统计单元') ] },
        { u: 'U10', term: 'Term 2', en: 'Probability Distributions', cn: '概率分布',
          cnV: [ bili('BV1x8411u7p9', 1, '01-随机变量及其分布列'),
                 bili('BV1x8411u7p9', 3, '03-n 次独立重复实验和二项分布'),
                 bili('BV1x8411u7p9', 7, '07-正态分布') ],
          enV: [ web('Khan Academy · Random Variables',
                     'https://www.khanacademy.org/computing/statistics-probability',
                     '课程目录页'),
                 web('Khan Academy · Normal Distribution',
                     'https://www.khanacademy.org/math/statistics-probability/modeling-distributions/normal-distribution',
                     '正态分布专题') ] }
      ]
    }
  };

  /* 逐课程的补充说明与国内可看的备用入口（不是逐课对应） */
  var FALLBACK = {
    accounting: {
      title: 'Tera Courses · 财务会计（英文讲解 / 中英字幕，共 69 讲）',
      url: 'https://www.bilibili.com/video/BV1Yy9zBPEBj/',
      linkText: '打开 B 站英文备用系列 ↗',
      note: '会计已按第二批表格改成「每行一个知识点」：11 个 Unit / 36 行，每行中文 + English 各一条。所有 B 站分集号都用官方接口核验存在，U8–U11 的中英文是同一合集的双版本、可直接播。<b>U1–U7 的英文主源已换成 B 站 Tera Courses 财务会计系列（BV1Yy9zBPEBj，英文原声 + 中英字幕，国内可直接播）</b>；你之前给的 YouTube 长课按时间点跳转的链接保留作「原网址」备用（点「在 YouTube 打开 ↗」看）。该系列是财务会计进阶课，与基础会计 U1–U7 属相近主题、并非逐讲一一对应。U2「会计假设」原表英文写「暂缺」，已用该系列 P1 作为框架讲解补上，没有编造别的网址。诚实边界：嵌入播放、音轨与时间点跳转未逐条实测，U1–U7 属相同主题的中英文辅助课程，讲解内容和案例未必完全一致。',
      extraTitle: '第一批表格里的补充英文网址（新表没有，全部保留）',
      extra: [
        { t: 'Accrual Accounting｜权责发生制', u: 'https://www.youtube.com/watch?v=C8UuX75ZarU' },
        { t: 'Debits & Credits｜借贷规则', u: 'https://www.youtube.com/watch?v=VhwZ9t2b3Zk' },
        { t: 'Journal Entries｜会计分录', u: 'https://www.youtube.com/watch?v=Y-_Q3rANyxU' },
        { t: 'Adjusting Entries｜调整分录', u: 'https://www.youtube.com/watch?v=H0N7tvXuJlU' },
        { t: 'T-Accounts｜T 型账户', u: 'https://www.youtube.com/watch?v=kA9snSvCgW8' },
        { t: 'Trial Balance｜试算平衡', u: 'https://www.youtube.com/watch?v=3_PfoTzSCQE' }
      ]
    },
    mathematics: {
      title: '关于商业数学这批链接的说明',
      url: 'https://www.khanacademy.org/math/ap-calculus-ab',
      linkText: '打开 Khan Academy 课程页 ↗',
      note: '中文是 B 站可直接播放的具体分集，已按 U0–U10 逐个挑好；英文是 Khan Academy 的课程目录页，属于「点开后按单元选课」，站点不允许把它嵌进别的网页，所以做成了链接卡。这些链接按单元主题匹配，尚未逐集全程观看，不代表官方知识点 100% 覆盖。国内若打不开 Khan Academy，可点中文视频下方的「在 B 站打开 ↗」看完整合集。'
    },
    economics: {
      title: '关于经济学这批链接的核查说明（请先看这里）',
      url: 'https://www.bilibili.com/video/BV1mA411b7JY/',
      linkText: '打开果冻 AP 微观 41 讲 ↗',
      note: '本门课按「每行一个知识点」配置：9 个 Unit 下共 49 行，每行一条中文 + 一条英文。中文优先中文教师授课（果冻 AP 微观 41 讲、刘苓玲经济学原理 84 讲、经管老邢单讲），B 站分集号已逐个用官方接口核验存在、并修正了「四种商品类型 / 负外部性」两处错位；可汗学院微观 71 讲的中文配音尚未确认，标为「中文整理版」。英文以 Khan Academy 为主（43 条链接已确认可访问），另有 3 条 MIT / YouTube，国内网络可能打不开。诚实边界：刘苓玲课程的分集位置依据已公布的 84 讲目录定位，尚未逐条实际播放测试；音轨、分集跳转与嵌入播放未逐条验证，因此不标记为「全部验证通过」。少量配对存在范围差异（如 AR/MR 英文是完全竞争 FRQ、停产规则中文覆盖一般均衡），已在对应卡片上标注。'
    }
  };

  /* 给每个 Unit 打上所属课程，卡片渲染时才能取到该课程的说明文案 */
  Object.keys(DATA).forEach(function (k) {
    DATA[k].key = k;
    DATA[k].units.forEach(function (u) { u._k = k; });
  });

  window.BILINGUAL_VIDEOS = DATA;

  /* ---------------- 工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function up(el, sel) {
    var simple = /^\.([\w-]+)$/.exec(sel);
    while (el && el.nodeType === 1) {
      if (el.matches) {
        if (el.matches(sel)) return el;
      } else if (simple) {
        var cn = ' ' + (el.className || '') + ' ';
        if (cn.indexOf(' ' + simple[1] + ' ') >= 0) return el;
      }
      el = el.parentNode;
    }
    return null;
  }
  function courseOfHash() {
    var m = /^#\/c\/([^/]+)(?:\/|$)/.exec(location.hash || '');
    return m && DATA[m[1]] ? m[1] : null;
  }
  function courseOfQuery() {
    var m = /[?&]course=([^&]+)/.exec(location.search || '');
    return m && DATA[decodeURIComponent(m[1])] ? decodeURIComponent(m[1]) : 'accounting';
  }
  /* 记住每门课「上次看到的 Unit」，下次打开自动跳到那个 Unit（不再每次都停在 U1） */
  var CURRENT_COURSE = 'accounting';
  function bvStoreKey(c) { return 'bv_last_unit_' + c; }
  function bvSaveUnit(c, u) { try { if (c && u) localStorage.setItem(bvStoreKey(c), u); } catch (e) {} }
  function bvLoadUnit(c) { try { return localStorage.getItem(bvStoreKey(c)) || ''; } catch (e) { return ''; } }
  function unitOfQuery() {
    var m = /[?&]unit=([^&]+)/.exec(location.search || '');
    return m ? m[1].toUpperCase() : '';
  }
  function weekUnitOfPage() {
    /* 周页里 NS.week 若存在 unit 字段则带入链接，让「查看全部」直接落到对应 Unit */
    try { return (typeof NS !== 'undefined' && NS.week && NS.week.unit) ? NS.week.unit : ''; } catch (e) { return ''; }
  }

  /* ---------------- 样式（bv- 前缀，独立页与课程页共用） ---------------- */
  var CSS = [
    '.bv-card{background:#fff;border:1px solid var(--line-2,#dde4ee);border-radius:12px;',
      'padding:16px;margin:0 0 16px;box-shadow:0 2px 10px rgba(18,46,82,.05)}',
    '.bv-card.bv-focus{outline:2px solid var(--gold,#c9a55c);outline-offset:3px;scroll-margin-top:76px}',
    '.bv-card-h{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:14px}',
    '.bv-u{flex:none;display:inline-block;background:var(--navy-900,#122e52);color:#fff;',
      'font:700 13px/1 var(--sans);letter-spacing:.5px;padding:8px 10px;border-radius:8px}',
    '.bv-names{flex:1;min-width:180px}',
    '.bv-names h3{margin:0;font:700 18px/1.4 var(--serif);color:var(--ink,#1b3557)}',
    '.bv-names p{margin:2px 0 0;font-size:13px;color:var(--muted,#5c6f88);line-height:1.5}',
    '.bv-playboth{flex:none;border:1px solid var(--gold,#c9a55c);background:#fbf5e8;',
      'color:#7d5a1c;border-radius:999px;padding:7px 13px;font:700 12.5px var(--sans);cursor:pointer}',
    '.bv-playboth:hover{background:#f4e7c9}',
    '.bv-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}',
    '.bv-side{min-width:0;border:1px solid var(--line-2,#e8eff7);border-radius:10px;',
      'padding:10px;background:var(--paper,#f7fafd)}',
    '.bv-side-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}',
    '.bv-lang{font:700 13.5px var(--sans);color:var(--navy-900,#122e52)}',
    '.bv-src{font-size:11px;font-weight:700;border-radius:999px;padding:2px 8px;white-space:nowrap}',
    '.bv-src-bili{background:#e4f1fb;color:#1b5f96}',
    '.bv-src-yt{background:#fdeaea;color:#a23c3c}',
    '.bv-stage{position:relative;width:100%;height:0;padding-bottom:56.25%;overflow:hidden;',
      'border-radius:8px;background:#0d2340}',
    '.bv-stage iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0}',
    '.bv-cover{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;',
      'align-items:center;justify-content:center;flex-direction:column;gap:10px;',
      'background:linear-gradient(135deg,#122e52 0%,#224b7d 100%);color:#fff;text-align:center;padding:12px}',
    '.bv-play{border:0;border-radius:999px;background:var(--gold,#c9a55c);color:#122e52;',
      'font:700 14px var(--sans);padding:12px 22px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.2)}',
    '.bv-play:hover{background:#dcbb78}',
    '.bv-cover-t{font-size:12px;color:#cfe0f2;line-height:1.5;max-width:90%;',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.bv-side-f{display:flex;gap:10px;align-items:center;flex-wrap:wrap;',
      'margin-top:8px;font-size:12px;color:var(--muted,#5c6f88)}',
    '.bv-side-f a{font-weight:700;color:var(--navy-800,#1c4375)}',
    '.bv-yt-note{margin:12px 0 0;padding:9px 12px;border-radius:8px;background:#fdf6e7;',
      'border-left:3px solid var(--gold,#c9a55c);color:#7d5a1c;font-size:12.5px;line-height:1.6}',
    '.bv-yt-note a{font-weight:700;color:#7d5a1c;text-decoration:underline}',
    '@media(max-width:860px){.bv-pair{grid-template-columns:1fr}}',
    /* ---- 课程周页内嵌态 ---- */
    '.note-pane[data-pane="bilingual"] .bv-pair{grid-template-columns:1fr}',
    '.bv-inline-h{font:700 16px var(--serif);color:var(--ink,#1b3557);margin:0 0 4px}',
    '.bv-inline-sub{font-size:12.5px;color:var(--muted,#5c6f88);line-height:1.6;margin:0 0 12px}',
    '.bv-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}',
    '.bv-chip{border:1px solid var(--line-2,#dde4ee);background:#fff;color:var(--navy-800,#1c4375);',
      'border-radius:999px;padding:5px 12px;font:700 12px var(--sans);cursor:pointer}',
    '.bv-chip.on{background:var(--navy-900,#122e52);border-color:var(--navy-900,#122e52);color:#fff}',
    '.bv-more{display:inline-block;margin:2px 0 0;font-weight:700;font-size:13px;',
      'color:var(--navy-800,#1c4375)}',
    '.bv-hero-link{display:inline-flex;align-items:center;gap:6px;margin-top:12px;',
      'border:1px solid var(--gold,#c9a55c);background:#fbf5e8;color:#7d5a1c;',
      'border-radius:999px;padding:7px 14px;font:700 12.5px var(--sans);text-decoration:none}',
    '.bv-hero-link:hover{background:#f4e7c9;text-decoration:none}',
    /* ---- 独立页 ---- */
    '.bv-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px}',
    '.bv-tab{border:1px solid var(--line,#d8e4f2);background:#fff;color:var(--ink-2,#465e7b);',
      'border-radius:999px;padding:9px 18px;font:700 14px var(--sans);cursor:pointer}',
    '.bv-tab.on{background:var(--navy-900,#122e52);border-color:var(--navy-900,#122e52);color:#fff}',
    '.bv-tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:0 0 16px}',
    '.bv-search{flex:1;min-width:200px;max-width:360px;border:1px solid var(--line,#d8e4f2);',
      'border-radius:999px;padding:9px 16px;font:14px var(--sans);color:var(--ink,#1b3557);background:#fff}',
    '.bv-count{font-size:13px;color:var(--muted,#5c6f88)}',
    '.bv-empty{padding:28px;border:1px dashed var(--line,#d8e4f2);border-radius:12px;',
      'background:#fff;text-align:center;color:var(--ink-2,#465e7b);line-height:1.8}',
    '.bv-empty b{color:var(--navy-900,#122e52)}',
    '.bv-fallback{margin:26px 0 0;padding:18px;border-radius:12px;background:#eef4fb;',
      'border-left:4px solid var(--navy-700,#2a5689);font-size:14px;line-height:1.8;color:var(--ink-2,#465e7b)}',
    '.bv-fallback h3{margin:0 0 6px;font:700 16px var(--serif);color:var(--navy-900,#122e52)}',
    '.bv-fallback a{font-weight:700;color:var(--navy-800,#1c4375)}',
    /* ---- 一个 Unit 多条视频 / 课程目录页链接 ---- */
    '.bv-item+.bv-item{margin-top:14px;padding-top:14px;border-top:1px dashed var(--line-2,#e8eff7)}',
    '.bv-item-t{font-size:12.5px;font-weight:700;color:var(--ink-2,#465e7b);margin:0 0 7px;line-height:1.5}',
    '.bv-weblink{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:14px;',
      'border-radius:10px;background:#eef4fb;border:1px solid var(--line,#d8e4f2)}',
    '.bv-weblink+.bv-weblink,.bv-weblink+.bv-item,.bv-item+.bv-weblink{margin-top:12px}',
    '.bv-weblink-ic{font-size:22px;flex:none}',
    '.bv-weblink-b{flex:1;min-width:150px;display:flex;flex-direction:column;gap:2px}',
    '.bv-weblink-b b{font-size:13.5px;color:var(--navy-900,#122e52)}',
    '.bv-weblink-b span{font-size:12px;color:var(--muted,#5c6f88);line-height:1.5}',
    '.bv-weblink a{flex:none;display:inline-block;background:var(--navy-900,#122e52);color:#fff;',
      'border-radius:999px;padding:8px 14px;font:700 12.5px var(--sans);text-decoration:none;white-space:nowrap}',
    '.bv-weblink a:hover{background:var(--navy-700,#2a5689);text-decoration:none}',
    '.bv-term-h{margin:26px 0 12px;font:700 15px var(--serif);color:var(--navy-900,#122e52);',
      'border-left:4px solid var(--gold,#c9a55c);padding-left:10px}',
    '.bv-term-h:first-child{margin-top:0}',
    '.bv-unit-note{margin:12px 0 0;padding:8px 11px;border-radius:8px;background:#f4f8fd;',
      'font-size:12.5px;line-height:1.65;color:var(--ink-2,#465e7b)}',
    '.bv-n{font-size:11px;font-weight:700;color:var(--muted,#5c6f88);margin-left:auto}',
    '.bv-ts{display:inline-block;background:#fdf6e7;color:#7d5a1c;border-radius:999px;',
      'padding:2px 8px;font-size:11px;font-weight:700}',
    '.bv-extra{margin:14px 0 0;padding:12px 14px;border-radius:10px;background:#fff;',
      'border:1px solid var(--line-2,#dde4ee);font-size:13px;line-height:1.8}',
    '.bv-extra b{display:block;margin-bottom:6px;color:var(--navy-900,#122e52)}',
    '.bv-extra a{display:inline-block;margin:2px 10px 2px 0;font-weight:700;',
      'color:var(--navy-800,#1c4375)}',
    /* ---- 按知识点逐行配课 ---- */
    '.bv-rows-note{margin:0 0 18px;padding:13px 16px;border-radius:10px;background:#eef4fb;',
      'border-left:4px solid var(--navy-700,#2a5689);font-size:13.5px;line-height:1.8;',
      'color:var(--ink-2,#465e7b)}',
    '.bv-rows-note b{color:var(--navy-900,#122e52)}',
    '.bv-card[data-topic] .bv-names h3{font-size:16.5px;line-height:1.5}',
    '.bv-card[data-topic] .bv-names p{font-size:12px}',
    '.bv-card[data-topic]{padding:14px 15px;margin-bottom:13px}',
    '@media(max-width:640px){.bv-card[data-topic] .bv-names{min-width:100%}}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('bv-style')) return;
    var s = document.createElement('style');
    s.id = 'bv-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------------- 卡片：一个 Unit 可挂多条视频 / 链接 ---------------- */
  function videoItem(v, label, showTitle) {
    var isB = v.kind === 'bili';
    var site = isB ? '在 B 站打开 ↗' : '在 YouTube 打开 ↗';
    var st = (!isB && v.start) ? parseInt(v.start, 10) : 0;
    return '<div class="bv-item">' +
      (showTitle ? '<div class="bv-item-t">' + esc(v.title) + '</div>' : '') +
      '<div class="bv-stage" data-kind="' + v.kind + '"' +
        (isB ? ' data-bvid="' + esc(v.bvid) + '" data-page="' + esc(v.page) + '"'
             : ' data-vid="' + esc(v.id) + '"' + (st ? ' data-start="' + st + '"' : '')) + '>' +
        '<div class="bv-cover">' +
          '<button class="bv-play" type="button">▶ 播放' + label.replace('讲解', '') +
            (st ? '（' + fmtTime(st) + ' 起）' : '') + '</button>' +
          '<div class="bv-cover-t">' + esc(v.title) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="bv-side-f"><a href="' + esc(v.url) + '" target="_blank" rel="noopener noreferrer">' +
        site + '</a><span>' + esc(v.title) + '</span>' +
        (st ? '<span class="bv-ts">▶ 从 ' + fmtTime(st) + ' 开始</span>' : '') + '</div>' +
      '</div>';
  }

  function webItem(v) {
    return '<div class="bv-weblink">' +
      '<div class="bv-weblink-ic">🔗</div>' +
      '<div class="bv-weblink-b"><b>' + esc(v.title) + '</b>' +
        '<span>' + esc(v.note || '课程目录页：点开后按单元选课，不能直接嵌在网页里播放') + '</span></div>' +
      '<a href="' + esc(v.url) + '" target="_blank" rel="noopener noreferrer">' +
        esc(v.btn || '打开课程页 ↗') + '</a>' +
      '</div>';
  }

  function sideHtml(list, lang, label) {
    var arr = toArr(list);
    var kinds = arr.map(function (v) { return v.kind; });
    var hasWeb = kinds.indexOf('web') >= 0;
    var hasBili = kinds.indexOf('bili') >= 0;
    var hasYt = kinds.indexOf('yt') >= 0;
    var badge = hasWeb
      ? '<span class="bv-src bv-src-bili">' + esc(arr[0].badge || '课程页 · 点开选课') + '</span>'
      : (hasBili && hasYt
          ? '<span class="bv-src bv-src-bili">B 站可播 · 含 YouTube 原链接</span>'
          : (hasYt
              ? '<span class="bv-src bv-src-yt">YouTube · 国内或打不开</span>'
              : '<span class="bv-src bv-src-bili">B 站 · 可直接播放</span>'));
    var body = arr.map(function (v) {
      return v.kind === 'web' ? webItem(v) : videoItem(v, label, arr.length > 1);
    }).join('');
    return '<section class="bv-side" data-side="' + lang + '">' +
      '<div class="bv-side-h"><span class="bv-lang">' + label + '</span>' + badge +
        (arr.length > 1 ? '<span class="bv-n">共 ' + arr.length + ' 条</span>' : '') + '</div>' +
      body + '</section>';
  }

  /* 经济学：一个 Unit 下按「每行一个知识点」渲染多张卡，
     每张卡固定 = 一条中文 + 一条 English。 */
  function topicCardHtml(u, r, key) {
    var all = toArr(r.cnV).concat(toArr(r.enV));
    var hasYt = all.some(function (v) { return v.kind === 'yt'; });
    var hasBili = all.some(function (v) { return v.kind === 'bili'; });
    /* 搜索只取 Unit 编号 + 知识点 + 视频标题；不要把 u.term 分组标题放进来，
       否则会计的「U8–U11 · 财务报表中英双语」会让搜 U8 命中整段 11 张卡。 */
    var search = [u.u, r.t].concat(all.map(function (v) { return v.title; }))
      .join(' ').toLowerCase();
    var d = DATA[key] || {};
    var note = '';
    if (hasYt && hasBili) {
      note = '<p class="bv-yt-note">' + (d.mixedNoteText ||
        '这行英文优先用 B 站 Tera Courses 系列（可直接播）；YouTube 原链接保留作备用，国内打不开时点「在 YouTube 打开 ↗」。') + '</p>';
    } else if (hasYt) {
      note = '<p class="bv-yt-note">' + (d.ytNoteText || '这一行英文来自 YouTube，国内网络可能打不开；请点「在 YouTube 打开 ↗」看原网址。') + '</p>';
    }
    return '<article class="bv-card" data-unit="' + esc(u.u) + '"' +
        ' data-topic="' + esc(r.t) + '" data-search="' + esc(search) + '">' +
      '<div class="bv-card-h">' +
        '<span class="bv-u">' + esc(u.u) + '</span>' +
        '<div class="bv-names"><h3>' + esc(r.t) + '</h3>' +
          '<p>' + esc(u.term || '') + ' · 一个知识点，中文 / English 各一条</p></div>' +
        '<button class="bv-playboth" type="button">▶ 两个一起播</button>' +
      '</div>' +
      '<div class="bv-pair">' + sideHtml(r.cnV, 'cn', '中文讲解') +
        sideHtml(r.enV, 'en', 'English') + '</div>' +
      (r.note ? '<p class="bv-unit-note">📌 ' + esc(r.note) + '</p>' : '') +
      note + '</article>';
  }

  function cardHtml(u, key) {
    key = key || u._k || '';
    if (u.rows) return u.rows.map(function (r) { return topicCardHtml(u, r, key); }).join('');
    var all = toArr(u.cnV).concat(toArr(u.enV));
    var hasYt = all.some(function (v) { return v.kind === 'yt'; });
    var hasWeb = all.some(function (v) { return v.kind === 'web'; });
    var search = [u.u, u.cn, u.en].concat(all.map(function (v) { return v.title; })).join(' ').toLowerCase();
    var note = hasYt
      ? '<p class="bv-yt-note">这一讲的英文来自 YouTube，部分国内网络打不开。若一直在转圈，' +
          '请点上方「在 YouTube 打开 ↗」，或看页面底部那套 <a href="#bvFallback">B 站英文备用系列</a>。' +
          '把英文链接换成 B 站地址后，就能像 U8–U11 一样直接在页面里播放。</p>'
      : (hasWeb
          ? '<p class="bv-yt-note">英文是 Khan Academy 的<b>课程目录页</b>，不是单个视频，' +
            '点「打开课程页 ↗」后按单元选课；这类页面不允许嵌在别的网站里，所以这里不提供内嵌播放。</p>'
          : '');
    return '<article class="bv-card" data-unit="' + esc(u.u) + '" data-search="' + esc(search) + '">' +
      '<div class="bv-card-h">' +
        '<span class="bv-u">' + esc(u.u) + '</span>' +
        '<div class="bv-names"><h3>' + esc(u.cn) + '</h3><p>' + esc(u.en) +
          (u.term ? ' · ' + esc(u.term) : '') + '</p></div>' +
        '<button class="bv-playboth" type="button">▶ 播放本单元全部</button>' +
      '</div>' +
      '<div class="bv-pair">' + sideHtml(u.cnV, 'cn', '中文讲解') + sideHtml(u.enV, 'en', 'English') + '</div>' +
      (u.note ? '<p class="bv-unit-note">📌 ' + esc(u.note) + '</p>' : '') +
      note + '</article>';
  }

  /* 数学表按 Term 1 / Term 2 分组；经济学按上下两段表分组并显示知识点行数 */
  function topicCount(d) {
    return d.units.reduce(function (n, u) { return n + (u.rows ? u.rows.length : 1); }, 0);
  }

  function listHtml(d) {
    var groups = {}, order = [];
    d.units.forEach(function (u) {
      var t = u.term || '';
      if (!groups[t]) { groups[t] = []; order.push(t); }
      groups[t].push(u);
    });
    if (order.length === 1 && !order[0]) {
      return d.units.map(function (u) { return cardHtml(u, d.key); }).join('');
    }
    return order.map(function (t) {
      var rows = groups[t].some(function (u) { return !!u.rows; });
      var label = rows
        ? topicCount({ units: groups[t] }) + ' 个知识点'
        : groups[t].length + ' 个 Unit';
      return (t ? '<div class="bv-term-h">' + esc(t) + ' · ' + label + '</div>' : '') +
        groups[t].map(function (u) { return cardHtml(u, d.key); }).join('');
    }).join('');
  }

  function iframeSrc(stage) {
    if (stage.getAttribute('data-kind') === 'bili') {
      return 'https://player.bilibili.com/player.html?bvid=' +
        encodeURIComponent(stage.getAttribute('data-bvid')) + '&page=' +
        encodeURIComponent(stage.getAttribute('data-page')) +
        '&autoplay=0&danmaku=0&high_quality=1';
    }
    var st = parseInt(stage.getAttribute('data-start'), 10) || 0;
    return 'https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(stage.getAttribute('data-vid')) + '?rel=0&hl=en' +
      (st ? '&start=' + st : '');
  }

  function loadStage(stage) {
    if (!stage || stage.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.setAttribute('src', iframeSrc(stage));
    f.setAttribute('title', '课程讲解视频');
    f.setAttribute('allowfullscreen', 'true');
    f.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
    f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    f.setAttribute('scrolling', 'no');
    f.setAttribute('frameborder', '0');
    f.setAttribute('loading', 'lazy');
    stage.innerHTML = '';
    stage.appendChild(f);
  }

  /* ---------------- 全局点击委托 ---------------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var play = up(t, '.bv-play');
    if (play) {
      var pc = up(play, '.bv-card');
      if (pc && pc.getAttribute('data-unit')) bvSaveUnit(CURRENT_COURSE, pc.getAttribute('data-unit'));
      loadStage(up(play, '.bv-stage')); return;
    }
    var both = up(t, '.bv-playboth');
    if (both) {
      var card = up(both, '.bv-card');
      if (card && card.getAttribute('data-unit')) bvSaveUnit(CURRENT_COURSE, card.getAttribute('data-unit'));
      if (card) Array.prototype.forEach.call(card.querySelectorAll('.bv-stage'), loadStage);
      return;
    }
    var tab = up(t, '.bv-tab');
    if (tab && tab.getAttribute('data-course')) {
      renderPage(tab.getAttribute('data-course'));
      return;
    }
    var chip = up(t, '.bv-chip');
    if (chip && chip.getAttribute('data-u')) {
      var wrap = up(chip, '.bv-inline');
      if (wrap) setInlineUnit(wrap, chip.getAttribute('data-u'));
      return;
    }
    /* 课程周页：自己接管新标签的切换（原有标签是渲染时逐个绑定的） */
    var nt = up(t, '.note-tab[data-ntab="bilingual"]');
    if (nt) {
      var app = document.getElementById('app') || document;
      Array.prototype.forEach.call(app.querySelectorAll('.note-tab[data-ntab]'), function (b) {
        b.classList.toggle('active', b === nt);
      });
      Array.prototype.forEach.call(app.querySelectorAll('.note-pane'), function (p) {
        p.classList.toggle('active', p.getAttribute('data-pane') === 'bilingual');
      });
    }
  }, false);

  /* ---------------- 课程周页注入 ---------------- */
  function setInlineUnit(wrap, u) {
    var key = wrap.getAttribute('data-course');
    var d = DATA[key];
    if (!d) return;
    var unit = null;
    for (var i = 0; i < d.units.length; i++) if (d.units[i].u === u) unit = d.units[i];
    if (!unit) return;
    wrap.setAttribute('data-active-unit', u);
    Array.prototype.forEach.call(wrap.querySelectorAll('.bv-chip'), function (c) {
      c.classList.toggle('on', c.getAttribute('data-u') === u);
    });
    var body = wrap.querySelector('.bv-inline-body');
    if (body) body.innerHTML = cardHtml(unit, key);
    bvSaveUnit(key, u);   /* 记住这门课上次停在哪个 Unit */
  }

  function inlineHtml(key) {
    var d = DATA[key];
    var sub = d.rowsMode
      ? (d.inlineSubText || '每个知识点单独一行，中文 / English 各一条。按 Unit 选，下面列出这个 Unit 的全部知识点。')
      : '点「播放」直接在页面里看，不用跳出去；标着「课程页」的要点开后按单元选课。' +
        '按 Unit 选讲次，或打开集中页一次看全部。';
    var head = '<div class="bv-inline-h">🎬 中英对照讲解 · ' +
      (d.rowsMode ? '每个知识点，中文 / English 各一讲' : '同一单元，中文 / English 对照') +
      '</div><p class="bv-inline-sub">' + sub + '</p>';
    if (!d.units.length) {
      return '<div class="bv-inline" data-course="' + key + '">' + head +
        '<div class="bv-empty">这门课的中英对照讲解还在整理中。<br>' +
        '把和会计那张表一样格式的网址表发来，填进去就能直接播放。</div>' +
        '<a class="bv-more" href="' + PAGE + '&course=' + key + '">打开中英对照讲解页 →</a></div>';
    }
    var chips = d.units.map(function (u) {
      return '<button class="bv-chip" type="button" data-u="' + esc(u.u) + '">' + esc(u.u) + '</button>';
    }).join('');
    /* 默认停在上次看的 Unit，而不是永远 U1 */
    var savedU = bvLoadUnit(key);
    var initU = (savedU && d.units.some(function (x) { return x.u === savedU; })) ? savedU : d.units[0].u;
    return '<div class="bv-inline" data-course="' + key + '" data-active-unit="' + esc(initU) + '">' +
      head + '<div class="bv-chips">' + chips + '</div>' +
      '<div class="bv-inline-body">' + cardHtml(d.units.filter(function (x) { return x.u === initU; })[0] || d.units[0], key) + '</div>' +
      '<a class="bv-more" href="' + PAGE + '&course=' + key + (weekUnitOfPage() ? '&unit=' + encodeURIComponent(weekUnitOfPage()) : '') + '">查看全部 ' +
        (d.rowsMode ? topicCount(d) + ' 个知识点' : d.units.length + ' 个 Unit') + ' →</a></div>';
  }

  function enhance() {
    var key = courseOfHash();
    if (!key) return;
    var app = document.getElementById('app');
    if (!app) return;

    /* 1) 笔记标签栏：新增「中英视频」标签 + 对应面板 */
    var tabs = app.querySelector('.note-tabs');
    if (tabs && !app.querySelector('.note-tab[data-ntab="bilingual"]')) {
      var nt = document.createElement('span');
      nt.className = 'note-tab';
      nt.setAttribute('data-ntab', 'bilingual');
      nt.textContent = '🎬 中英视频';
      tabs.appendChild(nt);
    }
    if (tabs && !app.querySelector('.note-pane[data-pane="bilingual"]')) {
      var pane = document.createElement('div');
      pane.className = 'note-pane';
      pane.setAttribute('data-pane', 'bilingual');
      pane.innerHTML = inlineHtml(key);
      tabs.parentNode.appendChild(pane);
      var wrap = pane.querySelector('.bv-inline');
      if (wrap) setInlineUnit(wrap, wrap.getAttribute('data-active-unit'));
    }

    /* 2) 本周面板顶部：直达链接（标签在笔记区，这里更显眼） */
    var wp = app.querySelector('.wp-head');
    if (wp && !wp.querySelector('.bv-hero-link')) {
      var a = document.createElement('a');
      a.className = 'bv-hero-link';
      var wu = weekUnitOfPage();
      a.href = PAGE + '&course=' + key + (wu ? '&unit=' + encodeURIComponent(wu) : '');
      a.textContent = '🎬 中英对照讲解（中文 / English 各一讲）→';
      wp.appendChild(a);
    }
  }

  /* ---------------- 独立页 ---------------- */
  function renderPage(key) {
    var root = document.getElementById('bvApp');
    if (!root) return;
    key = DATA[key] ? key : 'accounting';
    CURRENT_COURSE = key;
    var d = DATA[key];
    var tabs = Object.keys(DATA).map(function (k) {
      var n = DATA[k].rowsMode ? topicCount(DATA[k]) : DATA[k].units.length;
      return '<button class="bv-tab' + (k === key ? ' on' : '') + '" type="button" data-course="' + k + '">' +
        esc(DATA[k].label) + (n ? ' · ' + n + (DATA[k].rowsMode ? ' 讲' : '') : '') + '</button>';
    }).join('');

    var list = d.units.length
      ? listHtml(d)
      : '<div class="bv-empty"><b>' + esc(d.label) + '</b> 的中英对照讲解还在整理中。<br>' +
        '把和会计那张表一样格式的「Unit / 中文网址 / 英文网址」发来，' +
        '填进数据表就能直接播放，<b>不用重装 App</b>。</div>';

    var rowsNote = d.rowsMode
      ? '<div class="bv-rows-note">' + (d.rowsNoteText ||
          ('<b>这一门按知识点逐行配课：</b>' + d.units.length + ' 个 Unit 下共 ' +
           topicCount(d) + ' 行，每行一条中文 + 一条 English 对照。')) + '</div>'
      : '';

    var fb = FALLBACK[key];
    var fbTitle = key === 'accounting' ? '英文备用（B 站 · 国内可看）'
      : (key === 'economics' ? '核查说明与中文备用入口' : '使用说明与备用入口');
    var extraHtml = (fb && fb.extra && fb.extra.length)
      ? '<div class="bv-extra"><b>' + esc(fb.extraTitle || '补充网址') + '</b>' +
          fb.extra.map(function (x) {
            return '<a href="' + esc(x.u) + '" target="_blank" rel="noopener noreferrer">' +
              esc(x.t) + ' ↗</a>';
          }).join('') + '</div>'
      : '';
    var fallback = fb
      ? '<section class="bv-fallback" id="bvFallback">' +
          '<h3>📺 ' + fbTitle + '</h3>' +
          '<p style="margin:0 0 8px">' + esc(fb.note) + '</p>' +
          '<a href="' + esc(fb.url) + '" target="_blank" rel="noopener noreferrer">' +
            esc(fb.linkText || fb.title) + '</a>' + extraHtml + '</section>'
      : '';

    var countText = d.label + ' · 共 ' + d.units.length + ' 个 Unit' +
      (d.rowsMode ? ' / ' + topicCount(d) + ' 个知识点' : '');

    root.innerHTML =
      '<div class="bv-tabs">' + tabs + '</div>' +
      '<div class="bv-tools">' +
        '<input class="bv-search" id="bvSearch" type="search" placeholder="搜 Unit / 知识点 / 中文 / English，例如 U5、机会成本、Monopoly">' +
        '<span class="bv-count" id="bvCount">' + countText + '</span>' +
      '</div>' +
      rowsNote + '<div id="bvList">' + list + '</div>' + fallback;

    /* 自动跳到上次看的 Unit（或链接里指定的 &unit=），并高亮它 */
    var focusU = unitOfQuery() || bvLoadUnit(key);
    if (focusU) {
      var fc = document.querySelector('#bvList .bv-card[data-unit="' + focusU + '"]');
      if (fc) {
        bvSaveUnit(key, focusU);
        fc.classList.add('bv-focus');
        setTimeout(function () {
          try { fc.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
          catch (e) { fc.scrollIntoView(); }
        }, 120);
      }
    }

    var input = document.getElementById('bvSearch');
    if (input) input.addEventListener('input', function () {
      var q = (input.value || '').trim().toLowerCase();
      /* 只输入 Unit 编号时精确匹配，避免 U1 误命中 U10 / U11 */
      var unitQ = /^u\d{1,2}$/.test(q) ? q.toUpperCase() : '';
      var shown = 0;
      Array.prototype.forEach.call(document.querySelectorAll('#bvList .bv-card'), function (c) {
        var ok = unitQ
          ? (c.getAttribute('data-unit') === unitQ)
          : (!q || (c.getAttribute('data-search') || '').indexOf(q) >= 0);
        c.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      Array.prototype.forEach.call(document.querySelectorAll('#bvList .bv-term-h'), function (h) {
        h.style.display = q ? 'none' : '';
      });
      var cnt = document.getElementById('bvCount');
      if (cnt) cnt.textContent = q
        ? ('找到 ' + shown + (d.rowsMode ? ' 条知识点' : ' 个 Unit'))
        : countText;
    });
  }

  /* ---------------- 页脚入口（不改顶部导航） ---------------- */
  function addFooterLink() {
    var footer = document.querySelector('footer.site-footer');
    if (!footer || footer.querySelector('a[href^="bilingual-video.html"]')) return;
    var col = footer.querySelector('.footer-col') || footer.querySelector('.footer-inner');
    if (!col) return;
    var a = document.createElement('a');
    a.href = PAGE;
    a.textContent = '中英对照讲解';
    a.title = '同一内容，中文 / English 各一讲，点开就能在页面里播放';
    col.appendChild(a);
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    injectCss();
    if (document.getElementById('bvApp')) {
      renderPage(courseOfQuery());
      return;                       /* 独立页不需要跟随 SPA */
    }
    addFooterLink();
    enhance();

    var timer = null;
    function schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { timer = null; try { enhance(); } catch (e) {} }, 220);
    }
    window.addEventListener('hashchange', function () { setTimeout(schedule, 60); });
    if (typeof MutationObserver === 'function') {
      var app = document.getElementById('app');
      if (app) new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].type === 'childList' && muts[i].addedNodes.length) { schedule(); return; }
        }
      }).observe(app, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* 验收钩子 */
  window.LioraBilingualVideo = {
    data: DATA,
    count: function (k) { return DATA[k] ? DATA[k].units.length : 0; },
    topicCount: function (k) { return DATA[k] ? topicCount(DATA[k]) : 0; },
    renderPage: renderPage,
    enhance: enhance,
    cardHtml: cardHtml,
    listHtml: listHtml
  };
})();
