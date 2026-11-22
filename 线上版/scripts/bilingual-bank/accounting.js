'use strict';

/**
 * Accounting (13 weeks): Line-by-line EN→ZH Core Concepts + Exam-Likely Q&As
 * W1–W5 quotes verified directly from in-repo UNSW official Lecture Slides PDFs (Unit 1–Unit 6).
 * W6–W13 uses standard UNSW Foundation Accounting phrasing (marked accordingly).
 */
module.exports = {
  'term1:1': {
    concepts: [
      {
        term: 'Definition of Accounting（会计的定义）',
        en: 'Accounting is the process of identifying, measuring, recording and communicating economic information to permit informed judgements and economic decisions by users of the information.',
        zh: '会计是识别、计量、记录并传递经济信息的过程，目的是帮助信息使用者做出有依据的判断和经济决策。',
        src: '课件原话 · Unit 1 Lecture Slides p.3–4'
      },
      {
        term: 'Service vs Merchandising Business（服务型与商贸型企业）',
        en: 'A service business provides intangible services rather than physical goods, whereas a merchandising business buys and resells tangible goods to earn a profit.',
        zh: '服务型企业提供无形服务（如咨询、理发），而商贸型企业通过买入并转售有形商品（存货）来赚取利润。',
        src: '课件原话 · Unit 1 Lecture Slides p.5'
      },
      {
        term: 'Book-keeping vs Accounting（簿记与会计的区别）',
        en: 'Book-keeping is the systematic recording of routine daily transactions, while accounting goes further to prepare financial statements, analyse performance and assist decision-making.',
        zh: '簿记主要负责日常交易的常规记录与录入，而会计在此基础上进一步编制财务报表、分析经营绩效并支持管理与投资决策。',
        src: '课件原话 · Unit 1 Lecture Slides p.8–9'
      },
      {
        term: 'Accounting Entity & Monetary Unit Conventions（会计主体与货币计量惯例）',
        en: 'Under the Accounting Entity Convention, the owner’s personal financial dealings are kept separate from the business; under the Monetary Unit Convention, all financial information is recorded in the currency of the operating country.',
        zh: '会计主体惯例要求将老板个人财务与企业财务严格分开，所有交易都站在企业立场记录；货币计量惯例假设所有财务信息都用所在国货币（如澳元）统一计量。',
        src: '课件原话 · Unit 2 Lecture Slides p.5, p.7'
      },
      {
        term: 'Historical Cost, Going Concern & Accounting Period（历史成本、持续经营与会计分期）',
        en: 'Historical Cost records assets at their original purchase price; Going Concern assumes the business will continue indefinitely; Accounting Period divides that indefinite life into regular reporting intervals, usually 12 months.',
        zh: '历史成本按资产取得时的实际买价入账；持续经营假设企业会无限期经营下去；会计分期则把无限生命切分为固定周期（通常 12 个月）以定期编报。',
        src: '课件原话 · Unit 2 Lecture Slides p.6, p.9–10'
      },
      {
        term: 'The Accounting Cycle（会计循环六阶段）',
        en: 'The accounting cycle follows six regular stages: business transactions, source documents, journals, ledgers, trial balance, and financial statements (reports).',
        zh: '会计循环按固定顺序包含六个阶段：商业交易 → 原始凭证 → 日记账 → 分类账 → 试算平衡表 → 财务报表，并在下一个会计期间重新开始。',
        src: '课件原话 · Unit 1 Lecture Slides p.13–17'
      }
    ],
    examQA: [
      {
        qEn: 'Define accounting and explain who the main users of accounting information are and what decisions they make.',
        qZh: '请定义会计，并说明会计信息的主要使用者有哪些、他们各自用这些信息做什么决策？',
        tag: '高频简答 · 6 分',
        points: [
          {
            en: 'Accounting is the process of identifying, measuring, recording and communicating economic information to allow users to make informed judgements and business decisions.',
            zh: '先答核心定义：识别、计量、记录和传递经济信息，支持使用者做有依据的商业判断。'
          },
          {
            en: 'Internal users (owners and managers) assess financial performance and position to plan operations and control costs.',
            zh: '内部使用者（所有者与管理者）：评估经营绩效和财务状况，用于制定经营计划和控制成本。'
          },
          {
            en: 'External users include investors (evaluating investment potential), lenders/banks (assessing repayment capacity), suppliers (deciding credit terms) and government/tax authorities.',
            zh: '外部使用者包括投资者（评估投资回报潜力）、银行/债权人（评估偿债能力）、供应商（决定是否赊销）以及税务等政府部门。'
          }
        ],
        keywords: ['identifying, measuring, recording, communicating', 'internal vs external users', 'informed decisions']
      },
      {
        qEn: 'Why is the Accounting Entity Convention important? Give an example of how violating it would distort financial reports.',
        qZh: '为什么「会计主体惯例」很重要？举一个违反该惯例会扭曲财务报表的例子。',
        tag: '必考案例 · 4–5 分',
        points: [
          {
            en: 'The Accounting Entity Convention requires the business’s financial affairs to be recorded completely separately from the owner’s personal financial dealings.',
            zh: '会计主体惯例要求企业的经济业务与老板个人私账完全隔离，只从企业视角记账。'
          },
          {
            en: 'If the owner records personal holiday expenses as business expenses, business profit will be understated and financial statements will fail to reflect true business performance.',
            zh: '例如老板把个人度假开支记作公司费用，会导致公司费用虚增、净利润虚减，使报表无法真实反映企业自身盈利能力。'
          },
          {
            en: 'Instead, cash withdrawn by the owner for personal use must be recorded as Drawings, which reduces Owner’s Equity rather than appearing as a business expense.',
            zh: '老板从公司取钱私用必须记作「提款（Drawings）」，直接冲减所有者权益，绝不能计入企业费用。'
          }
        ],
        keywords: ['separate from owner', 'Drawings not Expense', 'true performance']
      },
      {
        qEn: 'Distinguish between the Historical Cost Convention and the Going Concern Convention.',
        qZh: '请区分「历史成本惯例」与「持续经营惯例」，并说明两者的联系。',
        tag: '概念辨析 · 4 分',
        points: [
          {
            en: 'The Historical Cost Convention states that assets must be recorded at their original purchase price (the actual amount paid), which is objective and verifiable via source documents.',
            zh: '历史成本惯例规定资产按取得时的原始实际买价入账，优势是有发票等凭证佐证、客观可核查。'
          },
          {
            en: 'The Going Concern Convention assumes the business will continue operating indefinitely rather than being liquidated in the foreseeable future.',
            zh: '持续经营惯例假设企业会持续经营下去，而不是短期内清算变卖。'
          },
          {
            en: 'Because the business is assumed to keep using its non-current assets (Going Concern), there is no need to revalue them to liquidation prices, which justifies using Historical Cost.',
            zh: '两者联系：正因为假设企业不会立刻清盘卖资产（持续经营），才不需要按变卖清算价重估资产，从而支撑了历史成本记账法。'
          }
        ],
        keywords: ['original purchase price', 'verifiable', 'continue indefinitely', 'not liquidated']
      },
      {
        qEn: 'Explain the role of Source Documents in the accounting cycle and give three examples.',
        qZh: '请解释「原始凭证（Source Documents）」在会计循环中的作用，并举出三个例子。',
        tag: '基础必背 · 4 分',
        points: [
          {
            en: 'Source documents provide objective written proof that a business transaction has occurred and supply key details (date, amount, parties and description) for recording into journals.',
            zh: '原始凭证是交易实际发生的客观书面证据，为日记账提供日期、金额、交易双方和事由等原始依据。'
          },
          {
            en: 'They ensure accuracy and reliability of accounting reports and create an audit trail for verification.',
            zh: '它们保证了会计报告的准确性与可靠性，并为后续审计核查留下证据链。'
          },
          {
            en: 'Common examples include tax invoices, cash receipts, bank statements, cheque butts and credit notes.',
            zh: '常见例子包括发票（invoices）、收据（receipts）、银行对账单（bank statements）、支票存根和贷项通知单。'
          }
        ],
        keywords: ['objective proof', 'reliability', 'invoices / receipts / bank statements']
      }
    ]
  },

  'term1:2': {
    concepts: [
      {
        term: 'Assets — Current vs Non-Current（资产：流动与非流动）',
        en: 'Assets are items of value owned by or owed to a business that provide future economic benefits; current assets are expected to be consumed within 12 months, whereas non-current assets are used for more than one accounting period.',
        zh: '资产是企业拥有或他人欠企业、能带来未来经济利益的价值项目；流动资产通常在 12 个月内消耗或变现，非流动资产则供企业使用超过一个会计期间。',
        src: '课件原话 · Unit 3 Lecture Slides p.4–5'
      },
      {
        term: 'Liabilities — Current vs Non-Current（负债：流动与非流动）',
        en: 'Liabilities are financial obligations the business owes to outside parties other than its owners; current liabilities are short-term obligations due within 12 months (e.g. Accounts Payable), while non-current liabilities extend beyond 12 months (e.g. Bank Loans).',
        zh: '负债是企业欠外部债权人（非老板）的财务义务；流动负债是 12 个月内到期的短期债务（如应付账款），非流动负债是超过 12 个月的长期债务（如长期银行贷款）。',
        src: '课件原话 · Unit 3 Lecture Slides p.6–7'
      },
      {
        term: 'Revenue, Expenses & Owner’s Equity（收入、费用与所有者权益）',
        en: 'Revenue represents income earned by the business; expenses are costs or resources consumed in generating revenue; Owner’s Equity (Net Assets) is what belongs to the owner, increased by Capital and Net Profit and decreased by Drawings.',
        zh: '收入是企业赚取的收益；费用是为经营和创收而消耗的成本资源；所有者权益（净资产）归老板所有，投入资本和净利润使其增加，提款使其减少。',
        src: '课件原话 · Unit 3 Lecture Slides p.10–14'
      },
      {
        term: 'Expanded Accounting Equation（扩展会计等式）',
        en: 'The basic equation Assets = Liabilities + Owner’s Equity expands to Assets = Liabilities + Capital + Revenue − Expenses − Drawings, where Revenue − Expenses calculates Net Profit or Loss.',
        zh: '基本等式「资产 = 负债 + 所有者权益」可扩展为「资产 = 负债 + 资本 + 收入 − 费用 − 提款」，其中「收入 − 费用」决定本期净利润或净亏损。',
        src: '课件原话 · Unit 3 Lecture Slides p.22–23'
      },
      {
        term: 'Rules of Double Entry（复式记账借贷规则）',
        en: 'Every transaction affects at least two accounts with equal total debits and credits: Debit (Dr) increases Assets, Expenses and Drawings, while Credit (Cr) increases Liabilities, Owner’s Equity (Capital) and Revenue.',
        zh: '复式记账要求每笔交易至少影响两个账户且借贷金额相等：借方（Dr）增加资产、费用与提款（DEAD），贷方（Cr）增加负债、资本与收入（CLIC）。',
        src: '课件原话 · Unit 3 Lecture Slides p.32–33'
      }
    ],
    examQA: [
      {
        qEn: 'Why must a business classify its assets and liabilities into Current and Non-Current categories?',
        qZh: '为什么企业必须把资产和负债划分为「流动（Current）」与「非流动（Non-Current）」两类？',
        tag: '原课件必考 · 4 分',
        points: [
          {
            en: 'First, classification is required by accounting regulations and reporting standards to ensure comparable financial statements.',
            zh: '第一，会计准则与法规明确要求这样分类，以保证不同企业报表具备可比性。'
          },
          {
            en: 'Second, it assists business planning by showing how much liquid (cash-convertible) assets are available to pay short-term debts as they fall due.',
            zh: '第二，便于评估短期偿债能力（流动性）——看清未来 12 个月内有多少可快速变现的流动资产来还到期短债。'
          },
          {
            en: 'Third, it distinguishes long-term productive investments (non-current assets) and long-term financing from day-to-day working capital.',
            zh: '第三，有助于区分长期经营投资/长期融资与日常营运资金管理。'
          }
        ],
        keywords: ['accounting standards', 'liquidity / meet debts as they fall due', 'working capital planning']
      },
      {
        qEn: 'Explain the difference between Accounts Receivable and Accounts Payable, and state which accounting element each belongs to.',
        qZh: '请区分应收账款（Accounts Receivable）与应付账款（Accounts Payable），并说明各自属于哪类会计要素。',
        tag: '高频概念 · 4 分',
        points: [
          {
            en: 'Accounts Receivable (Debtors) represent amounts owed TO the business by customers who bought goods or services on credit; they are classified as a Current Asset.',
            zh: '应收账款（债务人）是客户赊购商品/服务后「欠企业的钱」，将在短期内收回，属于流动资产（Current Asset）。'
          },
          {
            en: 'Accounts Payable (Creditors) represent amounts owed BY the business to suppliers for credit purchases; they are classified as a Current Liability.',
            zh: '应付账款（债权人）是企业赊购存货或服务后「欠供应商的钱」，属于流动负债（Current Liability）。'
          }
        ],
        keywords: ['Debtors / Current Asset', 'Creditors / Current Liability', 'credit sales vs credit purchases']
      },
      {
        qEn: 'Why is the owner’s withdrawal of cash (Drawings) not recorded as a business Expense?',
        qZh: '为什么老板从企业取走现金（Drawings 提款）不能记为企业的费用（Expense）？',
        tag: '高频易错 · 4 分',
        points: [
          {
            en: 'Expenses are costs incurred in operating the business to generate revenue, whereas Drawings are personal withdrawals of capital or profit by the owner.',
            zh: '费用是为了企业正常经营和创收而消耗的成本，而提款是老板拿回个人资金或分配利润，与创收无关。'
          },
          {
            en: 'Recording Drawings as an expense would violate the Accounting Entity Convention and artificially understate Net Profit on the Income Statement.',
            zh: '若把提款记为费用，既违反会计主体惯例，又会人为压低利润表上的净利润。'
          },
          {
            en: 'Therefore, Drawings directly reduce Owner’s Equity on the Balance Sheet (Dr Drawings, Cr Cash).',
            zh: '因此提款只直接扣减资产负债表上的所有者权益（借 Drawings，贷 Cash），绝不进利润表。'
          }
        ],
        keywords: ['not incurred to generate revenue', 'Accounting Entity', 'reduces Owner’s Equity directly']
      },
      {
        qEn: 'Compare Periodic and Perpetual inventory recording systems.',
        qZh: '请比较定期盘存制（Periodic）与永续盘存制（Perpetual）两种存货记录方式。',
        tag: '课件重点 · 4 分',
        points: [
          {
            en: 'Under a Periodic system, inventory records are updated only at specific intervals (e.g. monthly or annually) through a physical stocktake, and purchases are recorded in a Purchases account.',
            zh: '定期盘存制只在月末或年末通过实地盘点统一更新存货余额，平时进货记入 Purchases 账户。'
          },
          {
            en: 'Under a Perpetual system, inventory and Cost of Goods Sold (COGS) are updated continuously after every single purchase and sale, providing real-time stock control.',
            zh: '永续盘存制在每一笔购进和销售发生时实时更新存货账和销货成本（COGS），库存管控更及时精准。'
          }
        ],
        keywords: ['specific intervals / physical stocktake', 'updated continuously', 'real-time COGS']
      }
    ]
  },

  'term1:3': {
    concepts: [
      {
        term: 'General Journal（普通日记账）',
        en: 'The General Journal is the book of original (first) entry where business transactions are recorded in chronological order directly from source documents before posting to the ledger.',
        zh: '普通日记账是「原始分录簿（第一本账）」，按时间先后顺序依据原始凭证记录每笔交易，随后再过入分类账。',
        src: '课件原话 · Unit 4 Lecture Slides p.3–5'
      },
      {
        term: 'Structure of a Journal Entry（标准分录格式）',
        en: 'Every journal entry must include the transaction date, the debited account(s) listed first on the left, the credited account(s) indented below, equal debit and credit dollar amounts, and a brief narration.',
        zh: '每条标准日记账分录必须包含：交易日期、靠左列示在上的借方科目、向右缩进列示在下的贷方科目、借贷相等的金额，以及简明的摘要（Narration）。',
        src: '课件原话 · Unit 4 Lecture Slides p.6–9'
      },
      {
        term: 'Narration（分录摘要）',
        en: 'A narration is a short explanation written below each journal entry that describes the nature of the transaction and cites the relevant source document for future audit and reference.',
        zh: '摘要是写在分录下方括号里的简短说明，记录交易事由及对应的发票/凭证号，方便日后查账与审计。',
        src: '课件原话 · Unit 4 Lecture Slides p.8'
      },
      {
        term: 'Compound Journal Entry（复合分录）',
        en: 'A compound journal entry involves three or more accounts in a single transaction (for example, buying equipment partly with cash and partly on credit), while total debits still strictly equal total credits.',
        zh: '复合分录指一笔交易同时涉及三个或以上账户（如买设备一半付现金、一半赊账），但所有借方合计数仍严格等于贷方合计数。',
        src: '课件原话 · Unit 4 Lecture Slides p.14–18'
      }
    ],
    examQA: [
      {
        qEn: 'Why do accountants record transactions in a General Journal first instead of entering them directly into ledger accounts?',
        qZh: '为什么会计要先记「普通日记账（General Journal）」，而不是直接把交易记进分类账（Ledger）？',
        tag: '必考简答 · 4 分',
        points: [
          {
            en: 'The General Journal shows the complete effect of each transaction (both debit and credit sides) in one place in chronological order.',
            zh: '日记账按时间顺序把每笔交易的完整借贷双方集中展示在同一处，一眼看清来龙去脉。'
          },
          {
            en: 'It reduces posting errors by allowing accountants to verify that Debits equal Credits before transferring entries to separate ledger accounts.',
            zh: '先在日记账核对借贷相等再过入不同分类账，可大幅减少漏记一侧或借贷不等的过账错误。'
          },
          {
            en: 'Its narration links each entry back to the source document, forming an essential audit trail.',
            zh: '附带的摘要（Narration）将分录与原始凭证一一对应，构成清晰的审计线索。'
          }
        ],
        keywords: ['chronological order', 'complete effect in one place', 'prevents errors', 'audit trail']
      },
      {
        qEn: 'A business purchases office equipment for $12,000, paying $4,000 cash and signing a loan for the remainder. Write the journal entry and explain each line.',
        qZh: '企业购买 $12,000 办公设备，付现 $4,000，余款签贷款协议。请写出分录并解释每一行原因。',
        tag: '高频实操 · 4 分',
        points: [
          {
            en: 'Dr Office Equipment $12,000 (Non-Current Asset increases on the debit side).',
            zh: '借：Office Equipment $12,000（非流动资产增加，记借方）。'
          },
          {
            en: 'Cr Cash at Bank $4,000 (Current Asset decreases on the credit side) and Cr Loan Payable $8,000 (Liability increases on the credit side).',
            zh: '贷：Cash at Bank $4,000（资产减少记贷方）；贷：Loan Payable $8,000（负债增加记贷方）。'
          },
          {
            en: 'Narration: (Purchased office equipment partly for cash and balance on loan). Total Dr $12,000 = Total Cr $12,000.',
            zh: '补写规范摘要，并核对总借方 $12,000 = 总贷方 $12,000。'
          }
        ],
        keywords: ['compound entry', 'Dr Office Equipment', 'Cr Cash / Cr Loan', 'narration']
      },
      {
        qEn: 'Explain how a credit sale of services ($3,500) and the subsequent cash collection from the customer are journalised.',
        qZh: '请说明赊销提供服务（$3,500）以及日后收到客户回款这两笔交易分别如何做分录？',
        tag: '必考分录 · 4 分',
        points: [
          {
            en: 'On the date services are performed: Dr Accounts Receivable $3,500, Cr Service Revenue $3,500 (recognises revenue when earned under accrual basis).',
            zh: '提供服务当天：借 Accounts Receivable $3,500，贷 Service Revenue $3,500（权责发生制下服务完成即确认收入）。'
          },
          {
            en: 'When cash is received later: Dr Cash at Bank $3,500, Cr Accounts Receivable $3,500 (converts one current asset into another without double-counting revenue).',
            zh: '日后收款当天：借 Cash at Bank $3,500，贷 Accounts Receivable $3,500（只是应收变现金，绝不能重复确认一次收入！）。'
          }
        ],
        keywords: ['Dr Accounts Receivable / Cr Revenue', 'Dr Cash / Cr Accounts Receivable', 'no double counting']
      },
      {
        qEn: 'What are the four most common formatting mistakes students lose marks for in General Journal exam questions?',
        qZh: '在考试写 General Journal 分录时，哪四个格式细节最容易被扣分？',
        tag: '考场避坑 · 3 分',
        points: [
          {
            en: 'Omitting dates, failing to indent credit account names, omitting the brief narration, or using informal names instead of standard account titles.',
            zh: '常见四大扣分点：漏写日期、贷方科目未向右缩进、忘写摘要（Narration），以及未用标准科目名（如写 "Car" 而不是 "Motor Vehicle"）。'
          },
          {
            en: 'Always double-check that total debits equal total credits for every single journal entry before moving on.',
            zh: '每写完一笔分录务必立刻口算借贷总额相等。'
          }
        ],
        keywords: ['date', 'indent credit', 'narration', 'standard account titles']
      }
    ]
  },

  'term1:4': {
    concepts: [
      {
        term: 'Accrual Basis vs Cash Basis（权责发生制 vs 收付实现制）',
        en: 'Under Accrual Accounting, revenues are recognised when earned and expenses when incurred regardless of when cash changes hands, ensuring accurate profit measurement for each accounting period.',
        zh: '权责发生制要求收入在「赚取时」确认、费用在「发生时」确认，不管现金何时收付，从而准确计量每个会计期间的真实利润。',
        src: '课件原话 · Unit 5 Lecture Slides p.3–5'
      },
      {
        term: 'Prepaid Expenses & Unearned Revenue（预付费用与预收收入）',
        en: 'Prepaid expenses are cash paid in advance for future benefits (recorded as a Current Asset and expensed as used); unearned revenue is cash received before performing services (recorded as a Current Liability until earned).',
        zh: '预付费用是先付钱后受益（先记流动资产，期末按已消耗部分转费用）；预收收入是先收钱后干活（先记流动负债，提供服务后再转收入）。',
        src: '课件原话 · Unit 5 Lecture Slides p.7–12'
      },
      {
        term: 'Depreciation & Accumulated Depreciation（折旧与累计折旧）',
        en: 'Depreciation allocates the cost of a non-current asset over its useful life due to wear and tear or obsolescence; Accumulated Depreciation is a contra-asset account with a normal credit balance offset against the asset on the Balance Sheet.',
        zh: '折旧将非流动资产的成本在其使用寿命内分摊为费用；「累计折旧」是资产备抵账户（Contra Asset），正常余额在贷方，在资产负债表上直接扣减原值得到账面净值。',
        src: '课件原话 · Unit 5 Lecture Slides p.13–16'
      },
      {
        term: 'Accrued Revenue（应计收入）',
        en: 'Accrued revenues are revenues that have been earned during the period, but cash payment has not yet been received, requiring an adjusting entry: Dr Receivable, Cr Revenue.',
        zh: '应计收入是本期已经赚取（服务已完成或利息已产生）但期末尚未收到现金的收入，期末调整分录为：借 应收类资产，贷 收入。',
        src: '课件原话 · Unit 5 Lecture Slides p.17–19'
      },
      {
        term: 'Accrued Expenses（应计费用）',
        en: 'Accrued expenses are expenses that have been incurred in the period, but payment has not yet been made, requiring an adjusting entry to record both the Expense (Dr) and a Payable liability (Cr).',
        zh: '应计费用是本期已经发生（如已用电力、员工已上班）但期末尚未付款的费用，期末必须补记：借 费用，贷 应付类负债。',
        src: '课件原话 · Unit 5 Lecture Slides p.20–22'
      }
    ],
    examQA: [
      {
        qEn: 'Why are adjusting entries required at the end of an accounting period, and why do they never involve the Cash account?',
        qZh: '为什么会计期末必须做调整分录（Adjusting Entries）？为什么调整分录永远不会涉及现金（Cash）账户？',
        tag: '核心大题 · 5 分',
        points: [
          {
            en: 'Adjusting entries are required under the Accrual Basis and Accounting Period conventions to ensure all revenues earned and expenses incurred in the current period are properly matched before financial statements are prepared.',
            zh: '依据权责发生制与会计分期惯例，期末必须通过调整分录把属于本期的收入与费用精准配比，报表利润才真实。'
          },
          {
            en: 'They never involve Cash because cash was either already exchanged in an earlier transaction (prepayments/unearned revenue) or will be exchanged in a future period (accruals).',
            zh: '调整分录绝不涉及 Cash，因为现金要么早已在期初收付完毕（预付/预收），要么要等到下期才实际收付（应计费用/应计收入）。'
          },
          {
            en: 'Every adjusting entry always affects one Income Statement account (Revenue or Expense) and one Balance Sheet account (Asset or Liability).',
            zh: '铁律：每笔调整分录必然同时影响 1 个利润表账户（收入/费用）和 1 个资产负债表账户（资产/负债）。'
          }
        ],
        keywords: ['Accrual Basis', 'matching principle', 'never involves Cash', '1 Income Statement + 1 Balance Sheet']
      },
      {
        qEn: 'Explain what happens to Net Profit, Assets and Liabilities if an accountant forgets to record an Accrued Expense of $1,500 at year-end.',
        qZh: '如果会计在年末漏记了一笔 $1,500 的应计费用（例如应付电费），会对净利润、资产和负债分别产生什么影响？',
        tag: '必考影响分析 · 5 分',
        points: [
          {
            en: 'The missing entry is Dr Electricity Expense $1,500, Cr Accrued Electricity Payable $1,500.',
            zh: '先写出漏记的调整分录：借 Electricity Expense $1,500，贷 Accrued Expenses Payable $1,500。'
          },
          {
            en: 'Expenses are understated by $1,500, so Net Profit (and therefore Owner’s Equity) is OVERSTATED by $1,500.',
            zh: '费用少记 $1,500 → 导致净利润（以及所有者权益）虚增（Overstated）$1,500。'
          },
          {
            en: 'Liabilities are UNDERSTATED by $1,500, while Total Assets remain unaffected.',
            zh: '流动负债少记（Understated）$1,500，而总资产不受影响。'
          }
        ],
        keywords: ['Expenses understated', 'Net Profit overstated', 'Liabilities understated', 'Assets unaffected']
      },
      {
        qEn: 'A vehicle costs $50,000, has a 5-year useful life and $5,000 residual value. Calculate annual straight-line depreciation, write the adjusting entry, and explain how Accumulated Depreciation is shown on the Balance Sheet.',
        qZh: '一台车辆买价 $50,000，使用年限 5 年，残值 $5,000。请计算年直线折旧额、写出调整分录，并说明累计折旧如何在资产负债表中列示。',
        tag: '必考计算+概念 · 5 分',
        points: [
          {
            en: 'Annual Depreciation = (Cost − Residual Value) ÷ Useful Life = ($50,000 − $5,000) ÷ 5 = $9,000 per year.',
            zh: '年折旧额 = (原值 $50,000 − 残值 $5,000) ÷ 5 年 = $9,000/年。'
          },
          {
            en: 'Adjusting entry at year-end: Dr Depreciation Expense — Vehicle $9,000, Cr Accumulated Depreciation — Vehicle $9,000.',
            zh: '年末分录：借 Depreciation Expense — Vehicle $9,000，贷 Accumulated Depreciation — Vehicle $9,000。'
          },
          {
            en: 'On the Balance Sheet under Non-Current Assets, Accumulated Depreciation is deducted from the original cost ($50,000 − $9,000 = $41,000 Carrying Amount) so Historical Cost remains visible.',
            zh: '在资产负债表非流动资产下，用原值减去备抵账户「累计折旧」得到账面净值（$41,000），同时保留原始历史成本信息。'
          }
        ],
        keywords: ['(Cost - Salvage) / Useful Life', 'contra asset', 'carrying amount / net book value']
      },
      {
        qEn: 'Distinguish between Unearned Revenue and Accrued Revenue with a brief journal entry for each.',
        qZh: '请区分「预收收入（Unearned Revenue）」与「应计收入（Accrued Revenue）」，并各写出一条调整分录。',
        tag: '对比必考 · 5 分',
        points: [
          {
            en: 'Unearned Revenue arises when cash is received BEFORE the service is delivered (a liability); at period-end, the earned portion is adjusted via Dr Unearned Revenue, Cr Service Revenue.',
            zh: '预收收入是「先收钱、后干活」（属于负债）；期末将已完成服务的部分转入收入：借 Unearned Revenue，贷 Service Revenue。'
          },
          {
            en: 'Accrued Revenue arises when the service has been performed BEFORE cash is received (an asset); at period-end, it is recognised via Dr Accounts/Interest Receivable, Cr Revenue.',
            zh: '应计收入是「先干活、后收钱」（属于资产）；期末补确认应收资产与收入：借 Receivable，贷 Revenue。'
          }
        ],
        keywords: ['cash before service (Liability)', 'service before cash (Asset)', 'Dr Unearned / Cr Revenue']
      }
    ]
  },

  'term1:5': {
    concepts: [
      {
        term: 'General Ledger（总分类账）',
        en: 'A General Ledger is a comprehensive record of all accounts within a business, from which the Trial Balance and Financial Statements are prepared.',
        zh: '总分类账是企业全部账户的汇总记录簿，是编制试算平衡表和三大财务报表的直接数据来源。',
        src: '课件原话 · Unit 6 Lecture Slides p.5'
      },
      {
        term: 'Posting from Journal to Ledger（过账规则）',
        en: 'Posting transfers each debit and credit from the General Journal to the matching side of the respective T-account, writing the dollar amount and the name of the opposite (cross-reference) account.',
        zh: '过账是将日记账中的借方与贷方逐笔搬到对应 T 型账户的相同方向（借过左、贷过右），摘要栏填写「对方科目名称」。',
        src: '课件原话 · Unit 6 Lecture Slides p.6–8'
      },
      {
        term: 'Balancing T-Accounts: Balance c/d & b/d（T 型账户结平）',
        en: 'To balance a T-account at period-end, sum the larger side, insert the difference on the smaller side as Balance c/d (carried down / closing balance), double-underline equal totals, and open next period on the larger side with Balance b/d (brought down).',
        zh: '结平 T 型账户时，先加总金额较大的一侧，在较小一侧补写差额作为「期末结转余额 Balance c/d」，画双下划线后，在「较大一侧」下方写下期期初「Balance b/d」。',
        src: '课件原话 · Unit 6 Lecture Slides p.25–27'
      },
      {
        term: 'Debit Balance vs Credit Balance（借方余额与贷方余额）',
        en: 'If the debit side total exceeds the credit side total, the account has a Debit Balance (normal for Assets and Expenses); if credit exceeds debit, it has a Credit Balance (normal for Liabilities, Equity and Revenue).',
        zh: '借方合计大于贷方合计时称为「借方余额」（资产与费用的正常余额）；贷方合计大于借方合计时称为「贷方余额」（负债、权益与收入的正常余额）。',
        src: '课件原话 · Unit 6 Lecture Slides p.27'
      }
    ],
    examQA: [
      {
        qEn: 'Explain the difference between Balance c/d and Balance b/d in a T-account, and explain why Balance c/d appears on the smaller side.',
        qZh: '请解释 T 型账户中 Balance c/d 与 Balance b/d 的区别，并说明为什么 Balance c/d 写在较小的一侧？',
        tag: '高频概念 · 4 分',
        points: [
          {
            en: 'Balance c/d (carried down) is the closing balance at the end of the current period; it is placed on the smaller side purely to make both sides add up to the same total.',
            zh: 'Balance c/d 是本期末结转余额，写在较小一侧只是为了把左右两边补成相同总额。'
          },
          {
            en: 'Balance b/d (brought down) is the opening balance on the first day of the next period; it always sits on the LARGER side and indicates the account’s true debit or credit balance.',
            zh: 'Balance b/d 是下期第一天的期初余额，一定落在原本较大的那一侧，代表账户真正属于借方余额还是贷方余额。'
          }
        ],
        keywords: ['carried down = closing', 'brought down = opening', 'true balance sits on b/d side']
      },
      {
        qEn: 'When posting Dr Cash $10,000 / Cr Capital $10,000 to the Cash T-account, why do we write "Capital" instead of "Cash" inside the Cash account?',
        qZh: '将「借 Cash $10,000 / 贷 Capital $10,000」过入 Cash 的 T 型账户时，为什么 particulars 栏写的是 "Capital" 而不是 "Cash"？',
        tag: '实操原理 · 3 分',
        points: [
          {
            en: 'The account title at the top already identifies the Cash account, so writing the opposite account ("Capital") serves as a cross-reference showing WHERE the cash came from.',
            zh: '账户顶部的标题已经表明这是现金账，栏内写对方科目 "Capital" 作为交叉索引，一眼看出这笔现金来源于老板注资。'
          },
          {
            en: 'This cross-referencing lets accountants trace both halves of any double-entry transaction rapidly.',
            zh: '这种交叉索引让查账时能迅速在两个分类账之间定位同一笔复式分录的另一半。'
          }
        ],
        keywords: ['cross-reference', 'opposite account name', 'traceability']
      },
      {
        qEn: 'Under what circumstances can a Cash at Bank account end up with a Credit Balance, and how is it classified on the Balance Sheet?',
        qZh: '什么情况下银行存款（Cash at Bank）会出现「贷方余额」？它在资产负债表上应如何分类？',
        tag: '进阶高频 · 4 分',
        points: [
          {
            en: 'A Cash at Bank account shows a credit balance when the business has withdrawn more money than deposited, resulting in a Bank Overdraft.',
            zh: '当企业支出的金额超过银行账户存款余额时，即形成银行透支（Bank Overdraft），此时账户呈贷方余额。'
          },
          {
            en: 'Because the business now owes money to the bank on short notice, a Bank Overdraft is classified as a Current Liability rather than a Current Asset.',
            zh: '因为此时企业倒欠银行短期资金，银行透支必须在资产负债表上列为「流动负债（Current Liability）」而非资产。'
          }
        ],
        keywords: ['Bank Overdraft', 'credit balance', 'Current Liability']
      },
      {
        qEn: 'Outline the four steps to balance a T-format ledger account accurately.',
        qZh: '请简述将 T 型分类账准确结平的四个步骤。',
        tag: '标准流程 · 4 分',
        points: [
          {
            en: 'Step 1: Total the larger side and write that total at the bottom of both sides.',
            zh: '第 1 步：加总较大一侧，并将该合计数同时写在左右两栏底部。'
          },
          {
            en: 'Step 2: Subtract the smaller side’s entries from that total to calculate Balance c/d on the smaller side (dated last day of the period).',
            zh: '第 2 步：用合计数减去较小侧已有金额，在较小侧填入期末日期的 Balance c/d。'
          },
          {
            en: 'Step 3–4: Draw single top / double bottom lines under both totals, then bring the balance down as Balance b/d on the larger side dated the first day of the next period.',
            zh: '第 3–4 步：在总计下方画双下划线封账，并在较大侧下方写下月初日期的 Balance b/d。'
          }
        ],
        keywords: ['sum larger side', 'Balance c/d on smaller side', 'double underline', 'Balance b/d next period']
      }
    ]
  },

  'term1:6': {
    concepts: [
      {
        term: 'Running-Balance (Columnar) Ledger（多栏式/三栏式分类账）',
        en: 'A columnar (running-balance) ledger displays Debit, Credit and Balance columns side by side so that the updated account balance is visible immediately after every single transaction.',
        zh: '多栏式（三栏式）分类账把借方、贷方与余额并列排布，每过入一笔交易就立刻算出最新余额，比 T 型账户更便于日常实时查询。',
        src: 'UNSW 标准学术英文 · Unit 7'
      },
      {
        term: 'Trial Balance（试算平衡表）',
        en: 'A Trial Balance is a list of all General Ledger accounts and their debit or credit balances at a specific date, prepared to test the mathematical equality of total debits and total credits.',
        zh: '试算平衡表是在特定日期汇总所有分类账账户及借贷余额的清单，用于检验总账借方合计与贷方合计在算术上是否相等。',
        src: 'UNSW 标准学术英文 · Unit 7'
      },
      {
        term: 'Limitations of a Trial Balance（试算平衡表的局限性）',
        en: 'A balanced Trial Balance proves only arithmetical accuracy (ΣDr = ΣCr); it cannot detect six classes of hidden errors: Omission, Principle, Commission, Original Entry, Complete Reversal, and Compensating errors.',
        zh: '试算平衡表配平只能证明「借贷算术相等」，无法查出六类隐蔽错误：遗漏、原理错误、串户、原始金额错误、借贷颠倒与抵消错误。',
        src: 'UNSW 标准学术英文 · Unit 7'
      },
      {
        term: 'Locating Trial Balance Discrepancies（试算不平的排查法）',
        en: 'When debits and credits do not equal, accountants check column additions, look for a missing balance equal to the difference, divide the difference by 2 (a balance placed on the wrong side), or check divisibility by 9 (transposition error).',
        zh: '试算不平时按序排查：重加总计 → 查是否漏抄恰好等于差额的账户 → 差额除以 2 查是否借贷写反 → 差额能被 9 整除则重点查相邻数字写颠倒（如 54 写成 45）。',
        src: 'UNSW 标准学术英文 · Unit 7'
      }
    ],
    examQA: [
      {
        qEn: 'Why does an agreed (balanced) Trial Balance not guarantee that the accounting records are completely free of errors? Explain any four errors not revealed by a Trial Balance.',
        qZh: '为什么试算平衡表借贷配平也不能保证账簿完全没有错误？请解释其中任意四类查不出的错误。',
        tag: '期末必考大题 · 6 分',
        points: [
          {
            en: 'A Trial Balance only checks arithmetical equality of debits and credits; any error that affects both sides equally still leaves totals balanced.',
            zh: '总论：试算平衡表只验算术借贷相等，只要错误同时等额影响借贷双方，总计照样会平。'
          },
          {
            en: 'Error of Omission (entire transaction left out) and Error of Principle (recording an asset purchase as an expense, violating accounting rules).',
            zh: '遗漏错误（整笔漏记）与原理错误（把买设备资产错记成维修费用，性质归错但借贷仍平）。'
          },
          {
            en: 'Error of Commission (posting to the wrong customer’s account within the same class) and Error of Original Entry (wrong dollar amount entered on both sides from the start).',
            zh: '串户错误（同大类下记错具体往来户名）与原始金额错误（源头金额看错，借贷都写了错数）。'
          },
          {
            en: 'Also acceptable: Complete Reversal of Entries (Dr and Cr swapped) or Compensating Errors (two unrelated errors cancelling out).',
            zh: '也可答借贷完全颠倒或两处错误恰好金额抵消。'
          }
        ],
        keywords: ['arithmetical equality only', 'Omission', 'Principle', 'Commission', 'Original Entry / Reversal']
      },
      {
        qEn: 'Compare T-format ledger accounts with Columnar (running-balance) ledger accounts. Which is preferred in computerised accounting and why?',
        qZh: '请比较 T 型账户与多栏式（三栏式）分类账，说明现代电算化会计为何普遍采用多栏式。',
        tag: '高频对比 · 4 分',
        points: [
          {
            en: 'T-accounts group debits on the left and credits on the right and require periodic balancing to find the ending balance, making them ideal for teaching and quick sketches.',
            zh: 'T 型账户左右分栏，需到期末结平才能算出余额，直观简洁，适合教学与草稿分析。'
          },
          {
            en: 'Columnar ledgers update the running balance after every single transaction, which is preferred in computerised software because managers can inspect real-time balances immediately.',
            zh: '多栏式账页每记一笔就自动刷新最新余额，电算化软件普遍采用，方便管理层随时查看实时现金与应收余额。'
          }
        ],
        keywords: ['periodic balancing', 'running balance after every transaction', 'real-time visibility']
      },
      {
        qEn: 'A Trial Balance shows Debit total $48,200 and Credit total $47,840 (difference $360). Describe two systematic checks to locate the mistake.',
        qZh: '试算平衡表借方合计 $48,200、贷方合计 $47,840（差额 $360）。请写出两种系统排查该差错的方法。',
        tag: '排错实战 · 4 分',
        points: [
          {
            en: 'Divide the difference by 2 ($360 ÷ 2 = $180): check whether a $180 credit balance was mistakenly listed in the Debit column.',
            zh: '将差额除以 2（$180）：重点查找是否把一笔 $180 的贷方余额错抄进了借方栏（导致借方多 180、贷方少 180，相差 360）。'
          },
          {
            en: 'Since $360 is divisible by 9, check for a transposition error (two adjacent digits swapped, such as $730 written as $370) or a slide error (missing a zero).',
            zh: '因 $360 能被 9 整除，同时排查数字颠倒错（如 $730 抄成 $370）或漏写零的错位错误。'
          }
        ],
        keywords: ['divide by 2 = wrong column', 'divisible by 9 = transposition error']
      },
      {
        qEn: 'Explain the purpose of an Adjusted Trial Balance compared to an Unadjusted Trial Balance.',
        qZh: '请说明「调整后试算平衡表」与「调整前试算平衡表」的区别与作用。',
        tag: '循环衔接 · 4 分',
        points: [
          {
            en: 'An Unadjusted Trial Balance checks ledger equality after routine daily postings but BEFORE period-end adjusting entries (prepayments, accruals, depreciation) are recorded.',
            zh: '调整前试算表检验日常过账的借贷平衡，但尚未计入预付、应计和折旧等期末调整。'
          },
          {
            en: 'An Adjusted Trial Balance is prepared AFTER posting adjusting entries and serves as the direct, accurate basis for preparing the Income Statement and Balance Sheet.',
            zh: '调整后试算表在过入全部调整分录后编制，验证依然配平后，直接用于编制利润表和资产负债表。'
          }
        ],
        keywords: ['before vs after adjusting entries', 'direct basis for financial statements']
      }
    ]
  },

  'term1:7': {
    concepts: [
      {
        term: 'End-to-End Accounting Cycle Mastery（完整会计循环贯通）',
        en: 'From identifying a transaction via a source document to journalising, posting to ledgers, balancing, preparing a Trial Balance and recording period-end adjustments, every step preserves the core identity Assets = Liabilities + Owner’s Equity.',
        zh: '从凭原始单据识别交易，到编分录、过账、结平、编试算表与期末调整，每一步都严格维护「资产 = 负债 + 所有者权益」的恒等关系。',
        src: 'UNSW 标准学术英文 · 期中综合复习'
      },
      {
        term: 'Accrual Profit vs Cash Movement（权责利润与现金流区分）',
        en: 'Mid-term exams frequently test whether students confuse cash inflows/outflows (such as loan borrowings, capital injections or drawings) with Revenue and Expenses.',
        zh: '期中考试最高频陷阱是把现金收付（如向银行借钱、老板注资、老板提款、买固定资产）错当成收入或费用。',
        src: 'UNSW 标准学术英文 · 期中高频考点'
      },
      {
        term: 'Normal Balance Verification（正常余额速检法）',
        en: 'Checking normal balances (Dr for Assets, Expenses, Drawings; Cr for Liabilities, Capital, Revenue, Accumulated Depreciation) quickly spots reversed postings during exams.',
        zh: '熟记各类账户的正常余额方向（资产/费用/提款在借方；负债/资本/收入/累计折旧在贷方）能在考场 10 秒揪出写反的分录。',
        src: 'UNSW 标准学术英文 · 期中高频考点'
      }
    ],
    examQA: [
      {
        qEn: 'Trace how a single transaction — paying $2,400 cash for a 12-month insurance policy on 1 April (year-end 30 June) — flows through the entire accounting cycle.',
        qZh: '请追踪一笔业务（4 月 1 日付现 $2,400 买 12 个月保险，6 月 30 日结账）如何走完整个会计循环。',
        tag: '期中综合大题 · 6 分',
        points: [
          {
            en: 'On 1 April (Initial Entry): Dr Prepaid Insurance $2,400, Cr Cash $2,400 (recorded as a Current Asset, not an immediate expense).',
            zh: '4 月 1 日初始分录：借 Prepaid Insurance $2,400，贷 Cash $2,400（先记流动资产）。'
          },
          {
            en: 'On 30 June (Adjusting Entry for 3 months expired: 3/12 × $2,400 = $600): Dr Insurance Expense $600, Cr Prepaid Insurance $600.',
            zh: '6 月 30 日期末调整（已过 3 个月 = $600）：借 Insurance Expense $600，贷 Prepaid Insurance $600。'
          },
          {
            en: 'Financial Statements: Insurance Expense $600 appears on the Income Statement; remaining Prepaid Insurance $1,800 appears as a Current Asset on the Balance Sheet.',
            zh: '报表列示：利润表确认费用 $600，资产负债表流动资产列示剩余预付保险 $1,800。'
          }
        ],
        keywords: ['initial asset recognition', '3/12 expired = $600', 'Income Statement $600 vs Balance Sheet $1,800']
      },
      {
        qEn: 'Identify three transactions that increase Cash at Bank WITHOUT increasing Revenue.',
        qZh: '请举出三种「增加了银行存款（Cash），但没有增加收入（Revenue）」的商业交易。',
        tag: '高频陷阱题 · 4 分',
        points: [
          {
            en: '1) Owner contributes capital in cash (Dr Cash, Cr Capital — increases Equity, not Revenue).',
            zh: '1）老板现金注资（借 Cash，贷 Capital —— 增加所有者权益而非收入）。'
          },
          {
            en: '2) Business borrows a bank loan (Dr Cash, Cr Loan Payable — increases Liability).',
            zh: '2）向银行借款（借 Cash，贷 Loan Payable —— 增加负债）。'
          },
          {
            en: '3) Customer pays an existing Accounts Receivable balance, or pays a deposit in advance (Unearned Revenue).',
            zh: '3）收回客户之前的应收账款，或收到客户预付定金（预收收入负债）。'
          }
        ],
        keywords: ['Capital contribution', 'Bank Loan', 'Collection of Accounts Receivable / Unearned Revenue']
      },
      {
        qEn: 'Explain how the Accounting Period, Accrual and Matching concepts work together when calculating half-yearly profit.',
        qZh: '请说明会计分期、权责发生制与配比原则在核算期间利润时如何协同起作用。',
        tag: '概念综合 · 4 分',
        points: [
          {
            en: 'Accounting Period defines the cut-off dates (e.g. 1 Jan to 30 June); Accrual Basis determines which revenues were earned and expenses incurred inside that window; Matching pairs expenses with the revenues they helped generate.',
            zh: '会计分期划定起止时间窗口，权责发生制界定哪些收支真正归属该窗口，配比原则把为创收而发生的费用与同期收入对应相减，得出公允净利润。'
          }
        ],
        keywords: ['cut-off window', 'earned & incurred', 'matching expenses to revenue']
      }
    ]
  },

  'term1:8': {
    concepts: [
      {
        term: 'Purpose of the Income Statement（利润表的核心目的）',
        en: 'The Income Statement (Statement of Financial Performance) reports a business’s revenues, expenses and resulting Net Profit or Net Loss over a specific accounting period ("For the year ended...").',
        zh: '利润表（财务绩效表）反映企业在一段特定会计期间（标题必须写 For the year/month ended...）的收入、费用及最终净利润或净亏损。',
        src: 'UNSW 标准学术英文 · Unit 8'
      },
      {
        term: 'Gross Profit & Cost of Goods Sold（毛利润与销货成本）',
        en: 'For a merchandising business, Gross Profit equals Net Sales minus Cost of Goods Sold (COGS), where COGS = Opening Inventory + Net Purchases − Closing Inventory.',
        zh: '对商贸企业而言，毛利润 = 净销售收入 − 销货成本（COGS）；定期盘存制下 COGS = 期初存货 + 净采购 − 期末存货。',
        src: 'UNSW 标准学术英文 · Unit 8'
      },
      {
        term: 'Operating Expenses & Net Profit（营业费用与净利润）',
        en: 'Operating expenses (such as Selling, Administrative and Financial expenses) are subtracted from Gross Profit plus Other Income to determine Net Profit, which is then transferred to Owner’s Equity.',
        zh: '营业费用（销售、管理与财务费用）从「毛利润 + 其他收入」中扣除后得到净利润，最终结转入所有者权益。',
        src: 'UNSW 标准学术英文 · Unit 8'
      },
      {
        term: 'Sales Returns & Freight-In vs Freight-Out（退货与进出运费）',
        en: 'Sales Returns reduce Sales Revenue to give Net Sales; Freight-In (delivery cost of buying inventory) is part of COGS, whereas Freight-Out (delivering goods to customers) is a Selling Expense.',
        zh: '销售退回直接冲减销售收入得到净销售额；购货运费（Freight-In）计入销货成本 COGS，而送货给客户的运费（Freight-Out）属于销售费用！',
        src: 'UNSW 标准学术英文 · Unit 8 必考区分'
      }
    ],
    examQA: [
      {
        qEn: 'Distinguish between Gross Profit and Net Profit, and explain why a merchandising business might have a high Gross Profit but a low Net Profit.',
        qZh: '请区分毛利润（Gross Profit）与净利润（Net Profit），并解释为什么一家商贸企业可能「毛利很高但净利很低」？',
        tag: '高频论述 · 5 分',
        points: [
          {
            en: 'Gross Profit (Net Sales − COGS) measures the core trading profit earned directly from buying and selling merchandise before overhead costs.',
            zh: '毛利润（净销售 − 销货成本）衡量商品买卖本身的直接加价盈利能力，尚未扣除日常运营开支。'
          },
          {
            en: 'Net Profit deducts all operating expenses (rent, wages, marketing, depreciation, interest) from Gross Profit plus other income.',
            zh: '净利润则是在毛利润加上其他收入后，进一步扣除全部房租、人工、营销、折旧与利息等营业费用后的最终盈余。'
          },
          {
            en: 'A firm can enjoy high Gross Profit yet low Net Profit if its operating overheads (such as excessive rent, heavy advertising or rising wage bills) are poorly controlled.',
            zh: '若企业商品加价高（毛利高），但房租、人工或营销费用失控，就会把毛利吞噬掉，导致净利润偏低。'
          }
        ],
        keywords: ['Net Sales - COGS', 'operating overheads', 'poor expense control']
      },
      {
        qEn: 'Given Sales $200,000, Sales Returns $5,000, Opening Inventory $20,000, Purchases $110,000, Freight-In $4,000, Closing Inventory $24,000 and Operating Expenses $55,000, calculate Net Sales, COGS, Gross Profit and Net Profit.',
        qZh: '已知销售 $200,000、退回 $5,000、期初存货 $20,000、采购 $110,000、进货运费 $4,000、期末存货 $24,000、营业费用 $55,000，求净销售、COGS、毛利和净利。',
        tag: '必考计算 · 6 分',
        points: [
          {
            en: 'Net Sales = $200,000 − $5,000 = $195,000.',
            zh: '净销售收入 = 200,000 − 5,000 = $195,000。'
          },
          {
            en: 'COGS = Opening Inventory ($20,000) + Purchases ($110,000) + Freight-In ($4,000) − Closing Inventory ($24,000) = $110,000.',
            zh: '销货成本 COGS = 20,000 + 110,000 + 4,000 − 24,000 = $110,000（注意进货运费计入 COGS）。'
          },
          {
            en: 'Gross Profit = $195,000 − $110,000 = $85,000; Net Profit = $85,000 − $55,000 = $30,000.',
            zh: '毛利润 = 195,000 − 110,000 = $85,000；净利润 = 85,000 − 55,000 = $30,000。'
          }
        ],
        keywords: ['Net Sales $195,000', 'Freight-In inside COGS', 'COGS $110,000', 'Net Profit $30,000']
      },
      {
        qEn: 'Explain how Freight-In and Freight-Out are treated differently on the Income Statement.',
        qZh: '请解释进货运费（Freight-In）与销货运费（Freight-Out）在利润表中的处理有何不同。',
        tag: '必考易错 · 4 分',
        points: [
          {
            en: 'Freight-In is the cost of bringing purchased inventory to the business premises, so it is added to Purchases inside Cost of Goods Sold (reducing Gross Profit).',
            zh: 'Freight-In 是把采购的商品运回仓库的必要成本，计入 COGS（直接影响毛利润）。'
          },
          {
            en: 'Freight-Out is the delivery cost of sending sold goods to customers, so it is classified as a Selling/Distribution Expense below Gross Profit.',
            zh: 'Freight-Out 是将已售商品配送给客户的费用，列在毛利润下方的销售/营业费用中。'
          }
        ],
        keywords: ['Freight-In -> COGS', 'Freight-Out -> Selling Expense']
      },
      {
        qEn: 'Why must the Income Statement heading say "For the year ended 30 June 2026" instead of "As at 30 June 2026"?',
        qZh: '为什么利润表标题必须写 "For the year ended 30 June 2026"，而不能写 "As at 30 June 2026"？',
        tag: '格式必背 · 3 分',
        points: [
          {
            en: 'Because the Income Statement measures cumulative revenues and expenses earned and incurred OVER a period of time (a flow report), whereas "As at" refers to a single snapshot point in time (used for the Balance Sheet).',
            zh: '因为利润表汇总的是一整个时期内的流量（收入与费用累计发生额），必须用 "For the period ended..."；而 "As at..." 表示某一时点快照，只用于资产负债表。'
          }
        ],
        keywords: ['period of time / flow', 'As at = point in time (Balance Sheet)']
      }
    ]
  },

  'term1:9': {
    concepts: [
      {
        term: 'Balance Sheet / Statement of Financial Position（资产负债表）',
        en: 'The Balance Sheet reports a business’s Assets, Liabilities and Owner’s Equity at a single specific point in time ("As at 30 June..."), demonstrating that Net Assets (Total Assets − Total Liabilities) equal Owner’s Equity.',
        zh: '资产负债表反映企业在某一特定日期（标题写 As at...）的资产、负债与所有者权益快照，展示「净资产（总资产 − 总负债）= 所有者权益」。',
        src: 'UNSW 标准学术英文 · Unit 9'
      },
      {
        term: 'Working Capital（营运资金）',
        en: 'Working Capital equals Current Assets minus Current Liabilities, measuring the short-term financial cushion available to fund day-to-day operations and pay upcoming bills.',
        zh: '营运资金 = 流动资产 − 流动负债，衡量企业维持日常周转并按期偿还短期债务的安全缓冲空间。',
        src: 'UNSW 标准学术英文 · Unit 9'
      },
      {
        term: 'Closing Owner’s Equity Linkage（期末权益勾稽公式）',
        en: 'Closing Owner’s Equity equals Opening Capital plus Additional Capital plus Net Profit (or minus Net Loss) minus Drawings, directly linking the Income Statement to the Balance Sheet.',
        zh: '期末所有者权益 = 期初资本 + 新增资本 + 净利润（或减净亏损）− 提款，这是把利润表与资产负债表严密勾稽起来的桥梁。',
        src: 'UNSW 标准学术英文 · Unit 9'
      },
      {
        term: 'Limitations of the Balance Sheet（资产负债表的局限性）',
        en: 'Because assets are recorded at Historical Cost and non-monetary factors (such as brand reputation, staff skill or loyal customers) are excluded, a Balance Sheet does not show the true current market value of a business.',
        zh: '由于资产按历史成本入账，且无法以货币可靠计量的品牌声誉、员工技能、客户忠诚度不入表，资产负债表并不能直接等于企业的真实市场售价。',
        src: 'UNSW 标准学术英文 · Unit 9 高频论述'
      }
    ],
    examQA: [
      {
        qEn: 'Explain how the Income Statement and the Balance Sheet are interconnected.',
        qZh: '请说明利润表（Income Statement）与资产负债表（Balance Sheet）之间是如何相互勾稽联系的？',
        tag: '核心大题 · 5 分',
        points: [
          {
            en: 'Net Profit (or Net Loss) calculated at the bottom of the Income Statement is transferred into the Owner’s Equity section of the Balance Sheet.',
            zh: '利润表最终算出的净利润（或净亏损）会结转进资产负债表的所有者权益部分。'
          },
          {
            en: 'Specifically, Closing Capital = Opening Capital + Net Profit − Drawings, which must exactly equal Net Assets (Total Assets − Total Liabilities) for the Balance Sheet to balance.',
            zh: '具体公式为：期末权益 = 期初资本 + 净利润 − 提款，且该结果必须严格等于净资产（总资产 − 总负债），报表才能配平。'
          }
        ],
        keywords: ['Net Profit transferred to Owner’s Equity', 'Closing Capital = Net Assets']
      },
      {
        qEn: 'Why might a business with high Net Assets on its Balance Sheet still face a cash crisis? Explain using Current Assets and Working Capital.',
        qZh: '为什么一家在资产负债表上「净资产很高」的企业，仍可能发生现金流危机？请结合流动资产与营运资金解释。',
        tag: '分析大题 · 5 分',
        points: [
          {
            en: 'Most of the business’s wealth may be tied up in Non-Current Assets (buildings, machinery) or slow-moving Inventory that cannot be rapidly converted into cash.',
            zh: '企业财富可能大量沉淀在厂房设备等非流动资产或滞销存货里，短期内无法快速变现。'
          },
          {
            en: 'If Current Liabilities (supplier bills, bank overdraft) exceed liquid Current Assets (negative Working Capital), the firm cannot pay debts as they fall due even though it is asset-rich.',
            zh: '如果到期流动负债超过可快速变现的流动资产（营运资金为负或流动性枯竭），企业依然可能因为还不上短期欠款而陷入危机。'
          }
        ],
        keywords: ['illiquid Non-Current Assets / Inventory', 'Working Capital = CA - CL', 'inability to pay short-term debts']
      },
      {
        qEn: 'Outline two major limitations of the Balance Sheet for an investor wanting to buy a business.',
        qZh: '对于想收购一家企业的投资者而言，资产负债表有哪两大主要局限性？',
        tag: '必考简答 · 4 分',
        points: [
          {
            en: '1) Historical Cost Valuation: Land and buildings are shown at original purchase price rather than current market value, which may greatly understate true worth.',
            zh: '1）历史成本计价：房产土地按多年前买价列示而非现行市价，可能严重低估真实价值。'
          },
          {
            en: '2) Omission of Non-Monetary Assets: Internally generated goodwill, staff expertise and customer loyalty cannot be measured reliably in dollars and are omitted.',
            zh: '2）遗漏非货币软资产：员工能力、口碑、自创商誉等关键竞争力因难以货币计量而未体现在报表上。'
          }
        ],
        keywords: ['Historical Cost vs market value', 'omission of non-monetary assets / goodwill']
      },
      {
        qEn: 'Given Total Current Assets $45,000, Non-Current Assets $120,000, Current Liabilities $30,000, Non-Current Liabilities $50,000, Opening Capital $70,000 and Drawings $10,000, calculate Net Assets and Net Profit.',
        qZh: '已知流动资产 $45,000、非流动资产 $120,000、流动负债 $30,000、非流动负债 $50,000、期初资本 $70,000、提款 $10,000，求净资产与本期净利润。',
        tag: '必考反推 · 5 分',
        points: [
          {
            en: 'Total Assets = $45,000 + $120,000 = $165,000; Total Liabilities = $30,000 + $50,000 = $80,000.',
            zh: '总资产 = $165,000；总负债 = $80,000。'
          },
          {
            en: 'Net Assets (= Closing Equity) = $165,000 − $80,000 = $85,000.',
            zh: '净资产（即期末所有者权益）= 165,000 − 80,000 = $85,000。'
          },
          {
            en: 'Since Closing Equity = Opening Capital + Net Profit − Drawings → $85,000 = $70,000 + Net Profit − $10,000 → Net Profit = $25,000.',
            zh: '代入勾稽公式：85,000 = 70,000 + 净利润 − 10,000 → 解得净利润 = $25,000。'
          }
        ],
        keywords: ['Net Assets $85,000', 'Closing Equity formula', 'Net Profit $25,000']
      }
    ]
  },

  'term1:10': {
    concepts: [
      {
        term: 'Profitability Ratios（盈利能力比率）',
        en: 'Gross Profit Margin (GP ÷ Net Sales × 100%) measures pricing and purchasing efficiency, while Net Profit Margin (NP ÷ Net Sales × 100%) and Return on Equity (ROE = NP ÷ Average Equity) measure overall profit generated per dollar of sales or owner investment.',
        zh: '毛利率衡量商品定价与采购成本控制能力；净利率和净资产收益率（ROE）分别衡量每 $1 销售额和每 $1 老板投入最终赚回多少纯利润。',
        src: 'UNSW 标准学术英文 · Unit 10'
      },
      {
        term: 'Liquidity Ratios: Current vs Quick Ratio（短期偿债比率）',
        en: 'The Current Ratio (Current Assets ÷ Current Liabilities) measures overall short-term debt coverage, whereas the Quick (Acid-Test) Ratio [(CA − Inventory − Prepayments) ÷ CL] tests immediate liquidity without relying on selling inventory.',
        zh: '流动比率衡量短期资产覆盖短期债务的总倍数；速动比率剔除变现慢的存货与预付款，检验企业最紧急的即期偿债能力。',
        src: 'UNSW 标准学术英文 · Unit 10'
      },
      {
        term: 'Efficiency Ratios（营运效率比率）',
        en: 'Inventory Turnover (COGS ÷ Average Inventory) shows how quickly stock is sold, while Debtors Collection Period (Average AR ÷ Credit Sales × 365) shows how many days it takes on average to collect cash from credit customers.',
        zh: '存货周转率反映存货卖得有多快；应收账款回收天数反映赊销后平均需要几天把现金收回来。',
        src: 'UNSW 标准学术英文 · Unit 10'
      },
      {
        term: 'Solvency / Leverage Ratio（财务杠杆与长期偿债比率）',
        en: 'The Debt Ratio (Total Liabilities ÷ Total Assets × 100%) shows the proportion of assets financed by external creditors; higher leverage increases financial risk and interest commitments.',
        zh: '资产负债率（总负债 ÷ 总资产）反映企业有多少资产是靠借债买来的；杠杆越高，固定利息压力和财务违约风险越大。',
        src: 'UNSW 标准学术英文 · Unit 10'
      }
    ],
    examQA: [
      {
        qEn: 'Why is the Quick Ratio considered a stricter measure of short-term liquidity than the Current Ratio?',
        qZh: '为什么速动比率（Quick Ratio）被视为比流动比率（Current Ratio）更严格的短期偿债指标？',
        tag: '高频必考 · 4 分',
        points: [
          {
            en: 'The Quick Ratio excludes Inventory and Prepaid Expenses from Current Assets before dividing by Current Liabilities.',
            zh: '速动比率在分子中剔除了存货（Inventory）和预付费用（Prepayments）。'
          },
          {
            en: 'Inventory may be slow-moving or only sellable at a discount in an emergency, and prepayments cannot be turned back into cash to pay urgent creditors.',
            zh: '因为紧急情况下存货可能滞销或只能打折抛售，预付款也无法变回现金去还债，所以剔除后更能测出真实抗压能力。'
          }
        ],
        keywords: ['excludes Inventory & Prepayments', 'slow to convert into cash', 'immediate liquidity']
      },
      {
        qEn: 'A retailer’s Current Ratio rose from 1.8:1 to 2.9:1, while its Quick Ratio fell from 1.1:1 to 0.6:1. Diagnose what has happened and recommend two management actions.',
        qZh: '某零售商流动比率从 1.8:1 升至 2.9:1，但速动比率却从 1.1:1 跌至 0.6:1。请诊断原因并提出两条管理改进建议。',
        tag: '压轴案例大题 · 6 分',
        points: [
          {
            en: 'Diagnosis: Because Current Ratio rose while Quick Ratio fell sharply, the business has accumulated excessive Inventory (stockpile) while its cash and receivables shrank.',
            zh: '诊断：流动比率升而速动比率大跌，唯一解释就是存货大量积压，占用了现金与速动资产。'
          },
          {
            en: 'Recommendation 1: Run targeted promotional discounts to clear slow-moving stock and convert inventory back into cash.',
            zh: '建议 1：对滞销商品开展促销清仓，加快存货周转回笼现金。'
          },
          {
            en: 'Recommendation 2: Tighten inventory ordering controls (e.g. smaller, more frequent orders) and review credit collection terms.',
            zh: '建议 2：收紧采购批量管理（改为小批量高频补货），防止再次积压，并加快应收催收。'
          }
        ],
        keywords: ['excessive inventory build-up', 'clearance discounts', 'tighter purchasing control']
      },
      {
        qEn: 'Explain why a single financial ratio calculated for one year is not meaningful on its own.',
        qZh: '为什么只算某一年、孤立的一个财务比率本身没有太大分析意义？',
        tag: '简答高频 · 4 分',
        points: [
          {
            en: 'A ratio needs benchmarks to interpret whether performance is strong or weak: horizontal trend comparison (against prior years), industry averages (competitors), and budgeted targets.',
            zh: '比率必须有参照基准才能判断好坏：纵向比（对比过去 2–3 年趋势）、横向比（对比同行业均值/竞争对手）以及对比预算目标。'
          }
        ],
        keywords: ['benchmarks', 'trend over time', 'industry averages', 'budget targets']
      },
      {
        qEn: 'How can a company improve its Gross Profit Margin without raising selling prices?',
        qZh: '在不提高商品售价的前提下，企业可以通过哪些方式提高毛利率（Gross Profit Margin）？',
        tag: '商业建议 · 4 分',
        points: [
          {
            en: 'Since Gross Profit Margin = (Sales − COGS) ÷ Sales, the firm must lower Cost of Goods Sold by negotiating bulk purchase discounts, switching to more cost-effective suppliers, or reducing inventory wastage and theft.',
            zh: '毛利率 = (销售 − COGS) ÷ 销售；不涨价就必须降 COGS：与供应商谈批量折扣、更换更具性价比的货源、减少存货损耗与失窃，或提高高毛利产品销售占比。'
          }
        ],
        keywords: ['lower COGS', 'bulk discounts / cheaper suppliers', 'reduce wastage / better product mix']
      }
    ]
  },

  'term1:11': {
    concepts: [
      {
        term: 'Statement of Cash Flows（现金流量表）',
        en: 'The Statement of Cash Flows summarises actual cash inflows and cash outflows during an accounting period, classified into Operating, Investing and Financing activities, reconciling Opening Cash to Closing Cash.',
        zh: '现金流量表汇总企业在一个会计期间内实际的现金流入与流出，分为经营、投资、筹资三大活动，并将期初现金核对至期末现金余额。',
        src: 'UNSW 标准学术英文 · Unit 10'
      },
      {
        term: 'Operating Activities（经营活动现金流）',
        en: 'Operating cash flows arise from core day-to-day revenue-producing activities, such as cash receipts from customers and cash payments to suppliers, employees, rent and taxes.',
        zh: '经营活动现金流来自企业日常主营业务，如收客户货款、付供应商货款、发工资、交房租和缴税，是企业自我「造血」能力的核心指标。',
        src: 'UNSW 标准学术英文 · Unit 10'
      },
      {
        term: 'Investing & Financing Activities（投资与筹资活动现金流）',
        en: 'Investing activities cover cash paid for or received from buying and selling non-current assets (e.g. equipment, property); Financing activities cover cash flows with owners and lenders (capital contributions, drawings, bank loans and repayments).',
        zh: '投资活动反映买卖设备、房产等长期资产的现金收支；筹资活动反映与老板和银行之间的资金往来（注资、提款、借入与偿还贷款）。',
        src: 'UNSW 标准学术英文 · Unit 10'
      },
      {
        term: 'Why Net Profit ≠ Net Cash Flow（净利润为何不等于净现金流）',
        en: 'Net Profit is calculated on an accrual basis (including credit sales, credit purchases and non-cash expenses like depreciation), whereas cash flow records only actual cash received and paid.',
        zh: '净利润按权责发生制核算（包含未收现的赊销、未付现的赊购以及折旧等非现金费用），而现金流量表只记真正进出银行账户的真金白银。',
        src: 'UNSW 标准学术英文 · Unit 10 必考核心'
      }
    ],
    examQA: [
      {
        qEn: 'Explain three reasons why a profitable business can report a negative Operating Cash Flow during the same year.',
        qZh: '请解释一家「账面盈利」的企业在同一年却出现「经营性现金流为负」的三个原因。',
        tag: '期末压轴大题 · 6 分',
        points: [
          {
            en: '1) High Credit Sales with Slow Collection: Revenue is recognised on the Income Statement upon sale, but customers have not yet paid cash (Accounts Receivable surged).',
            zh: '1）大量赊销但回款极慢：利润表已确认销售收入，但货款还挂在应收账款里没变成现金。'
          },
          {
            en: '2) Heavy Cash Purchases of Inventory: The firm paid cash to build up extra stock that has not yet been sold and expensed as COGS.',
            zh: '2）提前付现大量囤货：现金已经付给供应商买存货，但货还没卖出去，尚未计入利润表成本。'
          },
          {
            en: '3) Large Prepayments or Fast Supplier Payments: Cash was paid in advance for next year’s rent/insurance, or suppliers were paid much faster than customers paid the firm.',
            zh: '3）大额预付费用或付供应商太快：提前付了下年房租/保险现金，导致现金流出快于流入。'
          }
        ],
        keywords: ['credit sales / rising Receivables', 'inventory stockpiling', 'prepayments / timing difference']
      },
      {
        qEn: 'Classify each cash transaction into Operating, Investing or Financing: (a) Cash paid to buy delivery van; (b) Cash received from customers; (c) Owner’s cash drawings; (d) Interest paid on bank loan.',
        qZh: '请将下列现金收支归类到经营/投资/筹资活动：(a) 付现买货车；(b) 收客户货款；(c) 老板现金提款；(d) 支付银行贷款利息。',
        tag: '高频分类 · 4 分',
        points: [
          {
            en: '(a) Buying a delivery van → Investing outflow (acquisition of a Non-Current Asset).',
            zh: '(a) 买货车 → 投资活动现金流出（购置非流动资产）。'
          },
          {
            en: '(b) Cash from customers → Operating inflow; (d) Interest paid → Operating outflow (day-to-day cost of operations).',
            zh: '(b) 收客户货款 → 经营活动现金流入；(d) 付利息 → 经营活动现金流出（日常经营费用）。'
          },
          {
            en: '(c) Owner’s drawings → Financing outflow (distribution of equity back to the owner).',
            zh: '(c) 老板提款 → 筹资活动现金流出（向所有者返还权益资金）。'
          }
        ],
        keywords: ['Investing', 'Operating', 'Financing']
      },
      {
        qEn: 'Why is Depreciation NOT listed as a cash outflow in the direct-method Statement of Cash Flows?',
        qZh: '为什么折旧费用（Depreciation）不会作为现金流出列在直接法现金流量表中？',
        tag: '必考陷阱 · 3 分',
        points: [
          {
            en: 'Depreciation is a non-cash bookkeeping allocation of an asset’s historical cost over its useful life; the actual cash outflow already occurred when the asset was purchased (Investing activity).',
            zh: '折旧只是将资产原值分摊为费用的非现金会计记账动作，真正花出去的现金早在买资产那天就记在投资活动里了，绝不能重复扣现金。'
          }
        ],
        keywords: ['non-cash expense', 'cash outflow occurred at purchase']
      }
    ]
  },

  'term1:12': {
    concepts: [
      {
        term: 'Exam Structure & Weighting Strategy（期末考试结构与拿分策略）',
        en: 'UNSW Foundation Accounting final exams integrate conceptual short answers (conventions, users, limitations), practical bookkeeping (journal entries, adjusting entries, ledger balancing), financial statement preparation, and ratio interpretation.',
        zh: 'UNSW 会计期末考试综合考查四大模块：概念简答（惯例/使用者/局限性）、实务做账（普通与调整分录/分类账）、编制利润表与资产负债表，以及财务比率计算与商业建议。',
        src: 'UNSW 标准学术英文 · 总复习'
      },
      {
        term: 'Method Marks & Own-Figure Rule（过程分与延续计算原则）',
        en: 'Showing clear workings, formulas and properly formatted headings earns method marks even if an earlier arithmetic error carries forward into a final statement.',
        zh: '清晰写出公式、计算过程和标准报表标题即使前面某处算错，后续步骤只要方法正确依然能拿到大部分过程分（Own-Figure Rule）。',
        src: 'UNSW 标准学术英文 · 阅卷规则'
      },
      {
        term: 'High-Frequency Cross-Unit Traps（跨单元四大高频扣分坑）',
        en: 'Always verify four traps: (1) Drawings never enter the Income Statement; (2) Adjusting entries never touch Cash; (3) Freight-In goes into COGS while Freight-Out is a Selling Expense; (4) Accumulated Depreciation is deducted from Non-Current Assets.',
        zh: '考前最后核对四大雷区：①提款绝不进利润表；②调整分录绝不碰现金；③进货运费进 COGS、送货运费进销售费用；④累计折旧在资产负债表原值下方扣减。',
        src: 'UNSW 标准学术英文 · 考前避坑'
      }
    ],
    examQA: [
      {
        qEn: 'How should you structure a 5-mark "Explain and apply an accounting convention" answer in the final exam?',
        qZh: '期末遇到 5 分的「解释并结合案例应用某项会计惯例」大题，高分答题结构应该怎么写？',
        tag: '考场满分模板 · 5 分',
        points: [
          {
            en: '1) Name and define the convention accurately in one crisp sentence (1–2 marks).',
            zh: '第 1 步：准确点名并用一句完整规范英文写出该惯例定义（拿 1–2 分）。'
          },
          {
            en: '2) Apply it explicitly to the scenario’s numbers/characters — explain what was done right or wrong (2 marks).',
            zh: '第 2 步：紧扣题干具体人名与数字指出错在哪或该怎么处理（拿 2 分）。'
          },
          {
            en: '3) State the exact impact on Profit, Assets, Liabilities or Equity if the error is not corrected (1–2 marks).',
            zh: '第 3 步：点出若不纠正会对利润、资产、负债或权益造成虚增还是虚减（拿满压轴分）。'
          }
        ],
        keywords: ['Define', 'Apply to case facts', 'Quantify statement impact']
      },
      {
        qEn: 'Before handing in a Balance Sheet in the exam, what five quick checks guarantee maximum presentation marks?',
        qZh: '考试画完资产负债表准备交卷前，哪五项快速检查能稳拿全部格式与配平分？',
        tag: '交卷核对 · 4 分',
        points: [
          {
            en: 'Check: (1) Full 3-line title with "As at [Date]"; (2) Current vs Non-Current subtotals clearly separated; (3) Accumulated Depreciation shown as a deduction; (4) Opening Capital + Net Profit − Drawings reconciled; (5) Net Assets = Total Owner’s Equity.',
            zh: '逐项勾选：①三行完整标题含 "As at..."；②流动/非流动分组小计清晰；③累计折旧正确扣减；④权益表勾稽正确；⑤净资产严格等于期末所有者权益。'
          }
        ],
        keywords: ['As at date', 'CA/NCA & CL/NCL', 'Net Assets = Equity']
      }
    ]
  },

  'term1:13': {
    concepts: [
      {
        term: 'Timed Simulation Execution（限时模拟实战法则）',
        en: 'Treating the Sample Exam under strict exam timing (~1 minute per mark plus reading time) trains you to allocate effort rationally and never leave easy theory or ratio marks blank.',
        zh: '严格按真实考场节奏（约 1 分对应 1 分钟 + 审题时间）完成模拟卷，训练自己合理分配精力，绝不在一道配不平的账表上耗光时间而丢掉后面好拿的概念和比率分。',
        src: 'UNSW 标准学术英文 · 模考策略'
      },
      {
        term: 'Error Log Post-Mortem（模考错因三分类复盘）',
        en: 'Classify every mark lost in the Sample Exam into Concept Gap (didn’t know the rule), Application Error (knew the rule but misclassified), or Careless Slip (arithmetic/formatting), and revise Concept Gaps first.',
        zh: '把模拟卷丢分归为三类：概念盲区（不会规则）、应用偏差（归错科目/正负号）、粗心失误（算错/漏标题），考前优先攻克概念盲区。',
        src: 'UNSW 标准学术英文 · 模考复盘'
      }
    ],
    examQA: [
      {
        qEn: 'In a full final exam question combining Adjusting Entries, Income Statement and Balance Sheet, what order of working prevents cascading errors?',
        qZh: '遇到把「调整分录 + 利润表 + 资产负债表」捆在一起的综合大题，按什么顺序做最不容易连环出错？',
        tag: '综合实战策略 · 5 分',
        points: [
          {
            en: 'Step 1: Write all adjusting entries on the side and annotate each affected Trial Balance figure directly on the question paper (+/- adjustments).',
            zh: '第 1 步：先写出全部调整分录，并在试卷原试算表数字旁边直接标出增减后的新余额。'
          },
          {
            en: 'Step 2: Tick off every single Trial Balance line as you place it into either the Income Statement or Balance Sheet (each item is used ONCE, except Closing Inventory which appears in COGS and Current Assets).',
            zh: '第 2 步：把试算表每一项逐条填入报表并打勾（普通项目只用 1 次，唯有「期末存货」既减 COGS 又进流动资产，用 2 次！）。'
          },
          {
            en: 'Step 3: Transfer Net Profit into Equity and check Net Assets = Closing Equity.',
            zh: '第 3 步：将净利润转入所有者权益并检验资产负债表配平。'
          }
        ],
        keywords: ['annotate Trial Balance', 'tick off each item', 'Closing Inventory used twice']
      },
      {
        qEn: 'Why does Closing Inventory from the additional information appear TWICE in the financial statements (both Income Statement and Balance Sheet)?',
        qZh: '为什么题目附加信息里给出的「期末存货（Closing Inventory）」在财务报表里要出现两次？',
        tag: '考场高频疑问 · 4 分',
        points: [
          {
            en: 'First, it is deducted inside Cost of Goods Sold on the Income Statement because unsold stock is NOT an expense of the current period (Matching principle).',
            zh: '第一次：在利润表 COGS 中减去期末存货，因为还没卖出去的货不是本期的销货成本（遵循配比原则）。'
          },
          {
            en: 'Second, it is listed as a Current Asset on the Balance Sheet because the unsold goods remain owned by the business and will generate future economic benefits when sold next period.',
            zh: '第二次：在资产负债表列为流动资产，因为这批未售商品仍归企业所有，下期卖出即可带来经济利益流入。'
          }
        ],
        keywords: ['deducted from COGS', 'Current Asset on Balance Sheet', 'Matching principle']
      }
    ]
  }
};
