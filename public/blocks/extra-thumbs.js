/* 课外拓展模块卡片缩略图映射（2026-11-07）
   按周次标题精准挂图，替换原先缺失的通用图（chapter/catalog/library）。
   仅数据映射，不含业务逻辑；index.html 的 renderExtra 负责调用。
   文件名对应 public/cabin-art/extra-*.webp（月光哥特图书馆风格，已裁去水印）。
   顺序回退数组 EXTRA_THUMBS_FB 与 data.js 中 extracurricular 课程的周次顺序一致。 */
(function () {
  "use strict";
  window.EXTRA_THUMBS = {
    "股票仓位、组合回撤与期货每手盈亏": "extra-stock",
    "财富传承的四类工具与继承债务规则": "extra-inherit",
    "信托架构：三角色与教育金信托设计": "extra-trust",
    "债权人撤销权与资产隔离": "extra-creditor",
    "有限合伙治理：GP 与 LP 的责任设计": "extra-lp",
    "财富管理四阶段：创造、保护、使用、传承": "extra-stages",
    "风险承受能力：为什么要重视「不可承受的风险」": "extra-risk"
  };
  window.EXTRA_THUMBS_FB = [
    "extra-stock", "extra-inherit", "extra-trust", "extra-creditor",
    "extra-lp", "extra-stages", "extra-risk"
  ];
})();
