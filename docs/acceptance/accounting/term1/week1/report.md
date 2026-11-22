# Accounting Term 1 Week 1 · Phase 1

## 来源与版本

线上 GET /data.js 和 /board-overrides.js 均返回 200。正文取 notes-accounting 的 term1/1.graphicHtml。本地与线上 data.js 摘要相同。覆盖层在该条目没有任何字段，当前不存在旧覆盖遮蔽本次取样正文的证据，历史是否发生过需要对应时间的快照。

- data.js SHA-256：bf43b051181be32701df60fc65d2933afdb43b1cd96f6c8431c2c3528f64b656
- board-overrides.js SHA-256：09b4f6f07c5db041796de7140d2f5f3db256772177419bb58bd73adcd23e51c5
- 生效 graphicHtml SHA-256：01ad2a0e38979c96e0bb51ea81c36ac7a1537f81b324c10a638ae687dcbaafb0
- 候选 DOCX SHA-256：7079ad345f2f3f78d6ca23b565949a81b244f084c5d7feee45f58a0c5ebd3f19

入口 index.html 1095、1100、1106 行依次加载基础数据、覆盖脚本及客户端合并。board-catalog.js 第 2 行定义允许字段，board-overrides-client.js 第 12 行按字段覆盖。server.js 的 boardBaseline/handleBoard 读取和更新板块，writeBoard 将生成稿发布到同一覆盖层。note-views.js 第 133、274 行优先使用 graphicHtml。当前没有触发发布。

候选 DOCX 开头使用英文在前的 Introduction to Accounting｜会计导论，现有网页导览及四个核心标题均中文在前，正文亦非候选稿的逐字副本。候选仅作排版参考。

## 五项逐点检查

| 位置 | 标题 | 英文讲解 | 中文讲解 | 公式步骤图表 | 例题解答 |
|---|---|---|---|---|---|
| H01 本周导览 · 怎么自学这一周This week's guide · how to self-study this week | 结构标记 | 导览/自查，不作独立教学点验收 | 同左 | 同左 | 同左 |
| H02 会计是什么、谁用会计信息（What is Accounting） | FAIL：中文先行 | FAIL：核心概念块无独立英文讲解 | 有中文；完整性及英中对应未通过 | 待复核，图表元素 0 | 待复核，折叠块 9 |
| H03 会计循环（The Accounting Cycle） | FAIL：中文先行 | FAIL：核心概念块无独立英文讲解 | 有中文；完整性及英中对应未通过 | 待复核，图表元素 2 | 待复核，折叠块 1 |
| H04 会计惯例（Accounting Conventions） | FAIL：中文先行 | FAIL：核心概念块无独立英文讲解 | 有中文；完整性及英中对应未通过 | 待复核，图表元素 1 | 待复核，折叠块 11 |
| H05 会计等式与现金制、权责发生制（Accounting Equation; Cash vs Accrual） | FAIL：中文先行 | FAIL：核心概念块无独立英文讲解 | 有中文；完整性及英中对应未通过 | 待复核，图表元素 2 | 待复核，折叠块 5 |
| H06 本周解题流程（自测清单）This week's problem-solving flow (self-check list) | 结构标记 | 导览/自查，不作独立教学点验收 | 同左 | 同左 | 同左 |

### 生效解释摘要

- H02 会计是什么、谁用会计信息（What is Accounting）：概念会计（accounting）是识别、计量、记录并传达经济信息的过程，让信息使用者据此做判断和经济决策，被称为「商业的语言」（the language of business）。服务业（service business）提供无形服务，收入是服务费，没有存货；商品流通业（merchandising business）买进卖出有形商品，收入是销售额，有存货和销货成本。记账（boo。英文短术语/题干不能代替英文 Explanation。逐字段全文见 evidence.json。
- H03 会计循环（The Accounting Cycle）：概念会计循环是每个会计期间重复的一组标准阶段：①交易（transactions）→ ②原始凭证（source documents）→ ③日记账（journals）→ ④分类账（ledgers）→ ⑤试算平衡表（trial balance）→ ⑥报表（reports），然后下一个会计期间重新开始。交易只有两种结算方式：现金（cash）和赊账（credit）。原始凭证举例：发票（i。英文短术语/题干不能代替英文 Explanation。逐字段全文见 evidence.json。
- H04 会计惯例（Accounting Conventions）：概念会计惯例是会计行业长期形成、所有会计人员默认遵守的做法：货币计量（monetary）：一切用经营所在国的货币表示（澳大利亚用澳元）。局限：通胀使不同年份难比较；管理水平等无法用货币计量。历史成本（historical cost）：资产按原始购买价、实际支付金额入账。会计主体（accounting entity）：企业与所有者个人的财务分开，一切从企业的角度记录。持续经营（g。英文短术语/题干不能代替英文 Explanation。逐字段全文见 evidence.json。
- H05 会计等式与现金制、权责发生制（Accounting Equation; Cash vs Accrual）：概念会计等式：资产 = 负债 + 所有者权益，A = L + OE，也可写成 A − L = OE（净资产）。每笔交易至少影响两项，等式始终成立。提款（drawings）减少所有者权益。现金制（cash accounting）：收到现金才记收入，付出现金才记费用，小企业多用。权责发生制（accrual accounting）：交易发生时就记录——赊销在卖出时就是收入（同时产生应。英文短术语/题干不能代替英文 Explanation。逐字段全文见 evidence.json。

### 来源抽查与剩余核验

- Unit 1 Lecture PDF 第 3 页可定位 language of business，第 13–17 页可定位 accounting cycle。Unit 1 Tutorial PDF 第 5–7 页涉及会计循环。
- Unit 2 Lecture PDF 第 4、9 页可定位 going concern，第 11–12 页涉及 accounting equation。Unit 2 Reading PDF 第 3 页涉及 accrual basis。
- 上述是原始资料定位，尚未逐题复算或逐页认证覆盖，未给公式、图表及例题记 PASS。
- [本地预览](preview.html) 展示线上有效正文快照，使用独立页面，正式页面的折叠、字体、图表和响应式仍待浏览器验收。
- 隔离补丁验证通过：拒绝旧摘要，拒绝 tasks 字段；只改变目标 graphicHtml，原数据在内存比对中完全保留。未触及正式目录或数据。
- 阶段状态：未通过、未锁定，不提交 Golden Sample 人工确认，不进入其他单元。
