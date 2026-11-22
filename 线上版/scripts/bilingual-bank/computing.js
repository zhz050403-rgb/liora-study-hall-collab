'use strict';

/**
 * Computing for Business, Science and Design (26 weeks: Term 1 W1–13, Term 2 W1–13)
 * Line-by-line EN→ZH Core Concepts + Exam-Likely Theory & Practical Excel Q&As
 */
module.exports = {
  'term1:1': {
    concepts: [
      {
        term: 'Slide Master（幻灯片母版）',
        en: 'The Slide Master controls the global layout, fonts, colour palette, logos and footers across an entire PowerPoint presentation so changes made once apply consistently to every slide.',
        zh: '幻灯片母版统一控制整套 PPT 的版式、字体、配色、Logo 与页脚，在母版改一次即可全套同步生效，避免逐页错乱。',
        src: 'UNSW 标准学术英文 · CPUT T1 W1'
      },
      {
        term: 'Visual Hierarchy & Desktop Export（视觉层次与桌面版导出）',
        en: 'Effective slides limit text to concise bullet points, maintain strong foreground-background contrast, align objects to guides, and are finalised in desktop PowerPoint before exporting to PDF.',
        zh: '高质量演示文稿每页只放精炼要点、保持高对比度与对齐，并在本地桌面版 PowerPoint 完成检查后导出 PDF 提交。',
        src: 'UNSW 标准学术英文 · T1 W1'
      }
    ],
    examQA: [
      {
        qEn: 'Explain two advantages of formatting a presentation using the Slide Master rather than editing individual slides manually.',
        qZh: '请说明使用「幻灯片母版（Slide Master）」而不是逐页手动设置 PPT 格式的两大优势。',
        tag: '高频概念 · 4 分',
        points: [
          {
            en: '1) Visual consistency: Fonts, colours, logo placement and slide numbers stay identical across every slide, creating a professional appearance.',
            zh: '1）风格高度一致：字体、配色、Logo 位置与页码全套统一，观感专业。'
          },
          {
            en: '2) Time efficiency & maintainability: Updating the heading font or colour scheme once in Slide Master automatically updates all 30+ slides instantly.',
            zh: '2）省时易维护：改标题字体或配色只需在母版改一次，几十页瞬间同步更新。'
          }
        ],
        keywords: ['visual consistency', 'global single-point update']
      }
    ]
  },

  'term1:2': {
    concepts: [
      {
        term: 'MS Word Styles & Automated Table of Contents（样式与自动目录）',
        en: 'Applying built-in Heading 1, Heading 2 and Normal styles separates document structure from visual formatting and enables Word to generate and update an Automated Table of Contents (TOC) with one click.',
        zh: '套用内置标题样式（Heading 1/2）实现结构与外观分离，才能用 References → Table of Contents 一键生成并自动更新页码目录。',
        src: 'UNSW 标准学术英文 · T1 W2'
      }
    ],
    examQA: [
      {
        qEn: 'Why should long academic reports use built-in Heading Styles instead of manually bolding and enlarging chapter titles?',
        qZh: '为什么写长篇学术报告必须使用 Word 内置标题样式，而不能手动加粗放大字号？',
        tag: '实操原理 · 4 分',
        points: [
          {
            en: 'Manual bolding only changes appearance; Word cannot recognise manually formatted text as headings, so Automated Table of Contents and Navigation Pane outlining will fail.',
            zh: '手动加粗放大只改变外观，Word 无法识别章节层级，导致无法生成自动目录（TOC）和大纲导航。'
          },
          {
            en: 'Built-in Styles also let you reformat every heading consistently across a 50-page document in one edit.',
            zh: '内置样式还能一键全局修改整篇报告所有同级标题格式。'
          }
        ],
        keywords: ['Automated TOC', 'Navigation Pane hierarchy', 'consistent global reformatting']
      }
    ]
  },

  'term1:3': {
    concepts: [
      {
        term: 'CPU, RAM (Volatile) vs Secondary Storage (Non-Volatile)（处理器、内存与外存）',
        en: 'The CPU executes instructions via the Fetch-Decode-Execute cycle; RAM provides fast temporary working memory that loses data when power is off (volatile), whereas SSD/HDD storage retains files permanently (non-volatile).',
        zh: 'CPU 通过取指-译码-执行循环处理指令；RAM 内存速度快但断电数据即失（易失性），SSD/硬盘则断电永久保存数据（非易失性）。',
        src: 'UNSW 标准学术英文 · T1 W3'
      },
      {
        term: 'DNS, IP Address & HTTPS（域名解析与加密传输）',
        en: 'The Domain Name System (DNS) translates human-readable web addresses into numerical IP addresses; HTTPS encrypts browser-server traffic using TLS/SSL to protect passwords and personal data.',
        zh: 'DNS 负责把人类易记的网址翻译成数字 IP 地址；HTTPS 在 HTTP 基础上加入加密层，防止账号密码在传输中被窃听篡改。',
        src: 'UNSW 标准学术英文 · T1 W3'
      }
    ],
    examQA: [
      {
        qEn: 'Distinguish between RAM and Secondary Storage (SSD/HDD), and explain what happens when a computer runs out of RAM.',
        qZh: '请区分内存（RAM）与外存（SSD/硬盘），并说明电脑内存耗尽时会发生什么？',
        tag: '硬件必考 · 4 分',
        points: [
          {
            en: 'RAM is high-speed, volatile primary memory holding the active OS and running apps; SSD/HDD is larger, slower, non-volatile storage holding saved files permanently.',
            zh: 'RAM 是高速易失主存，放当前运行中的系统与程序；SSD/硬盘容量大且非易失，永久存文件。'
          },
          {
            en: 'When RAM fills up, the OS swaps data to slower disk-based virtual memory, causing severe system lag and sluggish multitasking.',
            zh: 'RAM 用尽后系统被迫把数据腾挪到慢得多的硬盘虚拟内存，导致电脑严重卡顿。'
          }
        ],
        keywords: ['volatile vs non-volatile', 'active apps vs permanent files', 'virtual memory slowdown']
      }
    ]
  },

  'term1:4': {
    concepts: [
      {
        term: 'CRAAP Test for Website Evaluation（网站可信度 CRAAP 五维评估法）',
        en: 'The CRAAP framework evaluates online sources across five criteria: Currency (timeliness), Relevance (fit to topic), Authority (author/domain credibility), Accuracy (evidence & peer review), and Purpose (inform vs sell/persuade).',
        zh: 'CRAAP 五维标准评估网页可信度：时效性（Currency）、相关性（Relevance）、权威性（Authority）、准确性（Accuracy）与目的性（Purpose）。',
        src: 'UNSW 标准学术英文 · T1 W4'
      },
      {
        term: 'Word Section Breaks & Link to Previous（分节符与独立页眉页脚）',
        en: 'Inserting a Next Page Section Break and disabling "Link to Previous" allows different sections of a Word document to have independent page orientation (portrait/landscape), headers, or page numbering.',
        zh: '插入「下一页分节符」并关闭「链接到前一节（Link to Previous）」，即可让封面无页码、正文从第 1 页开始，或单独把某页设为横向排版。',
        src: 'UNSW 标准学术英文 · T1 W4'
      }
    ],
    examQA: [
      {
        qEn: 'Explain how to make Page 1 (Cover Page) have no page number while Page 2 begins numbering at "1" in MS Word.',
        qZh: '请写出在 MS Word 中实现「第 1 页封面无页码、第 2 页正文从 1 开始编号」的精确操作步骤。',
        tag: 'Word 必考实操 · 4 分',
        points: [
          {
            en: '1) Place the cursor at the end of Page 1 and insert Layout → Breaks → Next Page Section Break.',
            zh: '1）光标放第 1 页末尾，点击 Layout → Breaks → Next Page 插入分节符。'
          },
          {
            en: '2) Double-click the footer on Page 2, turn OFF "Link to Previous", insert Page Number, and choose Format Page Numbers → Start at 1.',
            zh: '2）双击第 2 页页脚，取消高亮「Link to Previous」，插入页码并设起始页码为 1（第 1 页保持空白）。'
          }
        ],
        keywords: ['Next Page Section Break', 'disable Link to Previous', 'Start at 1']
      }
    ]
  },

  'term1:5': {
    concepts: [
      {
        term: 'Systems Development Life Cycle (SDLC)（系统开发生命周期六阶段）',
        en: 'The SDLC structures information-system projects into six sequential phases: Planning (feasibility), Analysis (user requirements), Design (architecture & UI), Implementation (coding), Testing (bug fixing), and Maintenance (ongoing updates).',
        zh: 'SDLC 将软件/信息系统开发规范为六阶段：立项规划 → 需求分析 → 架构设计 → 编码实现 → 测试排错 → 上线运维。',
        src: 'UNSW 标准学术英文 · T1 W5 SDLC'
      }
    ],
    examQA: [
      {
        qEn: 'Why is the Analysis phase considered the most critical stage of the SDLC, and what happens if user requirements are poorly gathered?',
        qZh: '为什么「需求分析（Analysis）」被视为 SDLC 中最关键的一步？如果前期需求没问清会导致什么后果？',
        tag: '理论核心大题 · 5 分',
        points: [
          {
            en: 'The Analysis phase defines exact functional requirements by interviewing end users and studying current workflows before any design or coding begins.',
            zh: '需求分析通过访谈用户、梳理现有流程，在动工编码前精准锁定系统必须解决的问题。'
          },
          {
            en: 'Fixing a misunderstood requirement after Implementation or Testing costs exponentially more time and money than correcting it during Analysis, and risks building a system users reject.',
            zh: '在开发或测试阶段才发现需求理解错了，返工成本呈指数级暴涨，甚至导致系统上线后无人愿用。'
          }
        ],
        keywords: ['user requirements', 'exponential cost of late fixes', 'user rejection risk']
      }
    ]
  },

  'term1:6': {
    concepts: [
      {
        term: 'Workbook, Worksheet, Cell, Range & BODMAS（工作簿层级与运算优先级）',
        en: 'An Excel Workbook (.xlsx) contains Worksheets organised into Columns (letters) and Rows (numbers); every formula begins with "=" and evaluates in BODMAS order: Brackets → Exponents (^) → Multiplication/Division → Addition/Subtraction.',
        zh: 'Excel 工作簿含多张工作表；所有公式必须以等号 = 开头，并严格按「括号 → 幂次 → 乘除 → 加减」优先级计算。',
        src: 'UNSW 标准学术英文 · T1 W6 Excel Basics'
      }
    ],
    examQA: [
      {
        qEn: 'Why do =A1+B1/2 and =(A1+B1)/2 produce different answers in Excel? Explain using operator precedence.',
        qZh: '为什么在 Excel 中输入 =A1+B1/2 与 =(A1+B1)/2 会算出不同结果？请用运算优先级解释。',
        tag: '基础必考 · 3 分',
        points: [
          {
            en: 'Under BODMAS, division has higher precedence than addition: =A1+B1/2 divides B1 by 2 first and then adds A1, whereas =(A1+B1)/2 forces addition inside brackets first to calculate the true average.',
            zh: '按先乘除后加减规则，不加括号会先算 B1÷2 再加 A1；加上括号 =(A1+B1)/2 才先求和再除以 2 算出正确平均值。'
          }
        ],
        keywords: ['BODMAS precedence', 'division before addition', 'brackets override']
      }
    ]
  },

  'term1:7': {
    concepts: [
      {
        term: 'Term 1 Mid-Point Synthesis（前半学期软硬件与 Office 规范复盘）',
        en: 'Combining Word Styles/Sections, PowerPoint Slide Masters, Hardware/DNS fundamentals, CRAAP evaluation and SDLC prepares you for the second half’s intensive Excel formula labs.',
        zh: '前半学期贯通 PPT 母版、Word 样式与分节、硬件网络、CRAAP 评估与 SDLC，为后半学期高强度 Excel 函数实操打底。',
        src: 'UNSW 标准学术英文 · T1 W7 Review'
      }
    ],
    examQA: [
      {
        qEn: 'Name all five dimensions of the CRAAP test and all six phases of the SDLC in correct order.',
        qZh: '请按正确顺序写出 CRAAP 评估的五个维度与 SDLC 的六个阶段。',
        tag: '期中速检 · 4 分',
        points: [
          {
            en: 'CRAAP: Currency, Relevance, Authority, Accuracy, Purpose.',
            zh: 'CRAAP：时效性、相关性、权威性、准确性、目的性。'
          },
          {
            en: 'SDLC: Planning → Analysis → Design → Implementation → Testing → Maintenance.',
            zh: 'SDLC：规划 → 分析 → 设计 → 实现 → 测试 → 维护。'
          }
        ],
        keywords: ['CRAAP 5 criteria', 'SDLC 6 phases']
      }
    ]
  },

  'term1:8': {
    concepts: [
      {
        term: 'Number Formatting vs Text Entry & Multi-Level Sorting（数字格式与多级排序）',
        en: 'Always type raw numbers and apply Number Formatting (Currency, Percentage, Date) rather than typing "$" manually; when sorting, select the entire table (Custom Sort) to keep each row’s records aligned.',
        zh: '务必只输纯数字再用 Number Format 套用货币/百分比格式，切勿手敲 $ 变成文本导致无法计算；排序时必须选中整表（多级排序），否则整行数据会错位毁坏！',
        src: 'UNSW 标准学术英文 · T1 W8'
      }
    ],
    examQA: [
      {
        qEn: 'What catastrophic error happens if you highlight ONLY the Salary column and click Sort Z→A in an employee table?',
        qZh: '如果在员工表中只选中「工资」那一列就点降序排序，会发生什么严重数据错误？',
        tag: '实操避坑 · 3 分',
        points: [
          {
            en: 'Only the Salary values reorder while employee names and departments stay fixed, scrambling every employee’s salary record permanently! Always choose "Expand the selection" or select the entire table.',
            zh: '只排单列会让工资数字换位而员工姓名不动，彻底张冠李戴！务必选择「扩展选定区域」或先框选完整数据表。'
          }
        ],
        keywords: ['row misalignment', 'Expand the selection']
      }
    ]
  },

  'term1:9': {
    concepts: [
      {
        term: 'Choosing the Right Excel Chart & Five Mandatory Elements（图表选型与五要素）',
        en: 'Use Column/Bar charts to compare categories, Line charts for trends over time, Pie charts for parts of 100% (≤ 5 slices), and Scatter plots for relationships between two numerical variables — always adding descriptive Chart Title, Axis Titles with units, and Legend.',
        zh: '类别对比用柱状图、时间趋势用折线图、占比结构用饼图（≤5类）、两变量关系用散点图；专业图表必须配齐清晰标题、带单位的横纵轴标题与图例。',
        src: 'UNSW 标准学术英文 · T1 W9 Excel Charts'
      }
    ],
    examQA: [
      {
        qEn: 'Which chart type best displays (a) monthly company revenue over 24 months, and (b) market share of 4 competing supermarkets? Justify both.',
        qZh: '以下场景各应选哪种图表并说明理由：(a) 连续 24 个月的公司营收走势；(b) 4 家超市的市场份额占比。',
        tag: '图表选型必考 · 4 分',
        points: [
          {
            en: '(a) Line Chart: clearly communicates continuous change and trend direction over equal time intervals.',
            zh: '(a) 折线图（Line Chart）：最清晰展示连续时间维度上的增减趋势与波动。'
          },
          {
            en: '(b) Pie Chart: effectively shows how 4 parts sum to 100% of total market share (with data percentage labels).',
            zh: '(b) 饼图（Pie Chart）：仅 4 个分类且总和为 100%，直观展示各家占比结构。'
          }
        ],
        keywords: ['Line chart = time trend', 'Pie chart = parts of 100%']
      }
    ]
  },

  'term1:10': {
    concepts: [
      {
        term: 'Relative (A1), Absolute ($A$1) & Mixed ($A1 / A$1) References（三大单元格引用）',
        en: 'Relative references (A1) shift automatically when copied; Absolute references ($A$1) lock BOTH column and row (ideal for a single GST/tax rate cell); Mixed references ($A1 or A$1) lock only one axis for 2D lookup/multiplication tables.',
        zh: '相对引用 A1 随复制自动偏移；绝对引用 $A$1 锁死行列（用于固定税率/汇率格）；混合引用 $A1/A$1 只锁一维（用于二维表）。$ 符号就是锁！',
        src: 'UNSW 标准学术英文 · T1 W10 Cell References'
      }
    ],
    examQA: [
      {
        qEn: 'Cell B2 contains Item Price and cell $F$1 holds the 10% GST rate. Write the formula in C2 to calculate GST and explain what goes wrong if you write =B2*F1 and fill down to C10.',
        qZh: 'B2 是商品价格，F1 是固定 10% GST 税率。写出 C2 计算 GST 的正确公式，并说明若写成 =B2*F1 往下拉到 C10 会出什么错？',
        tag: '机考最高频大题 · 4 分',
        points: [
          {
            en: 'Correct formula in C2: =B2*$F$1 (locking row 1 and column F with $ signs).',
            zh: '正确公式：=B2*$F$1（用 $ 锁死税率所在单元格）。'
          },
          {
            en: 'If written as =B2*F1 and filled down, C3 becomes =B3*F2, C4 becomes =B4*F3, referencing blank cells and returning $0 or #VALUE! errors.',
            zh: '若漏写 $ 直接下拉，C3 会变成 =B3*F2，指向空白格算出 0 或 #VALUE! 报错。'
          }
        ],
        keywords: ['=B2*$F$1', 'relative shift points to blank cells']
      }
    ]
  },

  'term1:11': {
    concepts: [
      {
        term: 'IF Function Syntax & Rules（IF 条件函数语法）',
        en: 'Syntax: =IF(logical_test, value_if_true, value_if_false). Enclose text outputs in double quotation marks (e.g. "Pass"), but NEVER put quotes around numbers or formulas.',
        zh: '语法：=IF(条件判断, 成立返回值, 不成立返回值)。返回文字必须加英文双引号（如 "Pass"），返回数字或算式绝不加引号！',
        src: 'UNSW 标准学术英文 · T1 W11 IF Function'
      }
    ],
    examQA: [
      {
        qEn: 'Write an Excel IF formula in cell D2 that applies a 15% discount to Sales (C2) if C2 is $500 or more, and 0% discount otherwise. Explain why "0" (in quotes) is a common mistake.',
        qZh: '在 D2 写 IF 公式：若销售额 C2 ≥ $500 则打 15% 折扣（算出折扣额），否则为 0。说明为何给 0 加双引号是常见错误。',
        tag: '机考必考公式 · 4 分',
        points: [
          {
            en: 'Correct formula: =IF(C2>=500, C2*0.15, 0) (or reference a locked discount cell like $H$1).',
            zh: '正确公式：=IF(C2>=500, C2*0.15, 0)。'
          },
          {
            en: 'Writing "0" in quotes stores text rather than a number, which can break downstream arithmetic formulas such as =C2-D2 or SUM.',
            zh: '把 0 写成 "0" 会变成文本字符串而非数值，容易导致后续加减汇总公式出错。'
          }
        ],
        keywords: ['=IF(C2>=500, C2*0.15, 0)', 'never quote numbers']
      }
    ]
  },

  'term1:12': {
    concepts: [
      {
        term: 'XLOOKUP Function & Exact Match（XLOOKUP 精准查找函数）',
        en: 'Syntax: =XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found]). Unlike legacy VLOOKUP, XLOOKUP searches left or right, defaults to Exact Match, and lets you supply a custom not-found message.',
        zh: '语法：=XLOOKUP(找谁, 查找列, 返回列, [找不到时提示])。支持向左/向右双向查找、默认精确匹配，下拉复制前务必用 $ 锁死查找列和返回列！',
        src: 'UNSW 标准学术英文 · T1 W12 XLOOKUP'
      }
    ],
    examQA: [
      {
        qEn: 'Write an XLOOKUP formula to find the Product Price for code A2 using codes in Products!$A$2:$A$50 and prices in Products!$C$2:$C$50, displaying "Not Found" if missing. State two advantages over VLOOKUP.',
        qZh: '写 XLOOKUP 公式在 Products 表按 A2 商品码查价格（找不到显示 "Not Found"），并说明相比 VLOOKUP 的两大优势。',
        tag: '机考核心公式 · 5 分',
        points: [
          {
            en: 'Formula: =XLOOKUP(A2, Products!$A$2:$A$50, Products!$C$2:$C$50, "Not Found").',
            zh: '公式：=XLOOKUP(A2, Products!$A$2:$A$50, Products!$C$2:$C$50, "Not Found")（注意两个区域行数完全一致且锁死 $）。'
          },
          {
            en: 'Advantages over VLOOKUP: (1) Can look up to the LEFT as well as right; (2) Defaults to Exact Match and does not break if columns are inserted in between.',
            zh: '两大优势：①支持向左查找；②默认精确匹配，且中间插入新列不会破坏列号索引。'
          }
        ],
        keywords: ['locked ranges', 'left & right lookup', 'defaults to Exact Match']
      }
    ]
  },

  'term1:13': {
    concepts: [
      {
        term: 'Term 1 Practical Exam QA Protocol（Term 1 机考前五分钟终极自检）',
        en: 'Press Ctrl + ~ (Show Formulas) to verify every calculated cell uses dynamic formulas rather than hard-coded numbers, check zero #N/A/#VALUE!/#REF! errors, confirm $ locks, and verify print Fit-to-1-Page settings.',
        zh: '交卷前按 Ctrl + ~ 显示全表公式：查是否全是动态公式（无手算写死）、0 报错、$ 锁格正确、列宽无 ### 溢出且打印适应单页。',
        src: 'UNSW 标准学术英文 · T1 W13 Exam Prep'
      }
    ],
    examQA: [
      {
        qEn: 'Why do markers check spreadsheets in Formula View (Ctrl + ~) during Excel exams?',
        qZh: '为什么 Excel 机考阅卷老师一定会切到「公式视图（Ctrl + ~）」批改？',
        tag: '考场规则 · 3 分',
        points: [
          {
            en: 'Formula View exposes whether you typed a dynamic formula (=SUM, =IF, =XLOOKUP with proper $ references) or merely typed a manually calculated static number (which earns 0 marks).',
            zh: '公式视图一眼看出你是写了规范动态公式还是拿计算器手算填了死数字（手填死数字哪怕结果对也直接 0 分！）。'
          }
        ],
        keywords: ['dynamic formulas vs hard-coded numbers', 'Ctrl + ~']
      }
    ]
  },

  /* ==================== TERM 2 (Advanced Excel & Media Presentation) ==================== */
  'term2:1': {
    concepts: [
      {
        term: 'Nested IF, IF(AND(...)) & IF(OR(...))（嵌套 IF 与多条件组合逻辑）',
        en: 'AND(cond1, cond2) returns TRUE only when EVERY condition holds; OR(cond1, cond2) returns TRUE if AT LEAST ONE condition holds. For multi-band grading with Nested IF, order thresholds monotonically (e.g. >=85 → >=75 → >=65 → >=50).',
        zh: 'AND 要求所有条件同时成立，OR 只需任一条件成立；写多层嵌套 IF 评级时必须按从高到低（或从低到高）单向排列边界，绝不交叉遗漏！',
        src: 'UNSW 标准学术英文 · T2 W1 Advanced Excel'
      }
    ],
    examQA: [
      {
        qEn: 'Write a single Excel formula returning "Distinction" if Score (B2) ≥ 75 AND Attendance (C2) ≥ 80%, "Pass" if Score ≥ 50, and "Fail" otherwise.',
        qZh: '写一条 Excel 公式：成绩 B2≥75 且出勤 C2≥80% 返回 "Distinction"，否则若成绩 ≥50 返回 "Pass"，其余返回 "Fail"。',
        tag: '进阶机考必考 · 5 分',
        points: [
          {
            en: '=IF(AND(B2>=75, C2>=0.8), "Distinction", IF(B2>=50, "Pass", "Fail")) (note 80% is stored as 0.80).',
            zh: '公式：=IF(AND(B2>=75, C2>=0.8), "Distinction", IF(B2>=50, "Pass", "Fail"))（注意百分比 80% 在底层是 0.8）。'
          }
        ],
        keywords: ['IF(AND(...))', 'nested IF', '80% = 0.8']
      }
    ]
  },

  'term2:2': {
    concepts: [
      {
        term: 'Multi-Sheet Grouping & 3D References（工作表分组与三维跨表引用）',
        en: 'A 3D reference like =SUM(Jan:Dec!B5) sums cell B5 across all contiguous sheets from Jan through Dec; grouping sheets lets you format identical templates simultaneously — always UNGROUP immediately afterwards to prevent accidental overwrites.',
        zh: '三维引用 =SUM(Jan:Dec!B5) 可汇总连续多张同构表的同一格；多表分组编辑完必须立刻右键 Ungroup，否则后续操作会同时覆盖所有表！',
        src: 'UNSW 标准学术英文 · T2 W2'
      }
    ],
    examQA: [
      {
        qEn: 'Explain the syntax difference between referencing cell B4 on a sheet named "Sales" versus a sheet named "Q1 Sales", and state the golden safety rule after grouping sheets.',
        qZh: '引用工作表 "Sales" 与 "Q1 Sales" 的 B4 格在语法上有何区别？多表分组编辑后必须立刻做什么？',
        tag: '跨表必考 · 4 分',
        points: [
          {
            en: 'Without spaces: Sales!B4. With spaces: wrap the sheet name in single quotes → \'Q1 Sales\'!B4.',
            zh: '无空格直接写 Sales!B4；表名含空格必须加英文单引号 \'Q1 Sales\'!B4。'
          },
          {
            en: 'Always Ungroup Sheets immediately after shared formatting/formulas so edits on one sheet do not overwrite other sheets.',
            zh: '安全铁律：改完公共内容立刻取消分组（Ungroup Sheets），防误覆盖！'
          }
        ],
        keywords: ['single quotes for spaces', 'Ungroup Sheets immediately']
      }
    ]
  },

  'term2:3': {
    concepts: [
      {
        term: 'Date Serial Numbers & Conditional Aggregation (SUMIFS / COUNTIFS)（日期序列值与多条件汇总）',
        en: 'Excel stores dates as sequential integers starting at 1 = 1 Jan 1900 so subtracting two dates gives exact days between them. In SUMIFS(sum_range, criteria_range1, criteria1, ...), the SUM column always comes FIRST!',
        zh: 'Excel 把日期存为自 1900/1/1 起递增的整数，两日期相减直接得天数；多条件 SUMIFS 的第 1 个参数必须是「要求和的数值列」（千万别和单条件 SUMIF 写反）！',
        src: 'UNSW 标准学术英文 · T2 W3'
      }
    ],
    examQA: [
      {
        qEn: 'Write a SUMIFS formula summing Sales (D2:D100) where Region (B2:B100) is "NSW" AND Date (A2:A100) is on or after 1 Jan 2026.',
        qZh: '写 SUMIFS 公式汇总区域 B2:B100 为 "NSW" 且日期 A2:A100 在 2026-01-01 及之后的销售额 D2:D100。',
        tag: '多条件统计必考 · 5 分',
        points: [
          {
            en: '=SUMIFS($D$2:$D$100, $B$2:$B$100, "NSW", $A$2:$A$100, ">="&DATE(2026,1,1)).',
            zh: '公式：=SUMIFS($D$2:$D$100, $B$2:$B$100, "NSW", $A$2:$A$100, ">="&DATE(2026,1,1))（比较符 ">=" 与 DATE 用 & 拼接最稳妥）。'
          }
        ],
        keywords: ['sum_range first', '">="&DATE(2026,1,1)']
      }
    ]
  },

  'term2:4': {
    concepts: [
      {
        term: 'Financial Functions (PMT / FV / PV) & Cash-Flow Sign Convention（财务函数与现金流正负号）',
        en: 'In =PMT(rate, nper, pv), rate and nper MUST match the payment frequency (for monthly repayments: annual_rate/12 and years*12); money flowing IN is positive (+) and money paid OUT is negative (−).',
        zh: '财务函数 =PMT(利率, 期数, 现值) 必须严格按还款频率折算（按月还则年利率 ÷12、年数 ×12）；收进钱包为正、付出钱包为负！',
        src: 'UNSW 标准学术英文 · T2 W4 Financial & Text Functions'
      },
      {
        term: 'Text Functions: LEFT, MID, RIGHT & TEXTJOIN（文本拆合函数）',
        en: 'LEFT(text, n) and RIGHT(text, n) extract characters from the ends, MID(text, start, n) extracts a middle substring, and CONCAT/TEXTJOIN combines text fields cleanly.',
        zh: 'LEFT/RIGHT 从左右截取字符，MID 从中间第 start 位截取 n 字符，CONCAT/TEXTJOIN 合并姓名或编号。',
        src: 'UNSW 标准学术英文 · T2 W4'
      }
    ],
    examQA: [
      {
        qEn: 'Write the Excel PMT formula for a $400,000 home loan at 6% p.a. repaid monthly over 25 years, returning a positive monthly payment.',
        qZh: '写 Excel PMT 公式计算 $400,000 房贷（年利率 6%、25 年按月还款）的每月还款额，并让结果显示为正数。',
        tag: '财务函数必考 · 4 分',
        points: [
          {
            en: '=PMT(6%/12, 25*12, -400000) or =-PMT(6%/12, 25*12, 400000) — dividing annual rate by 12 and multiplying years by 12 is mandatory.',
            zh: '公式：=PMT(6%/12, 25*12, -400000)（给 pv 加负号或公式前加负号即可显示正数月供；切忌直接填 6% 和 25！）。'
          }
        ],
        keywords: ['6%/12', '25*12', 'cash-flow sign convention']
      }
    ]
  },

  'term2:5': {
    concepts: [
      {
        term: 'Combo Charts & Secondary Axis（组合图表与次坐标轴）',
        en: 'Use a Combo Chart with a Secondary Vertical Axis whenever plotting two series on vastly different numerical scales (such as Revenue in $100,000s as Columns and Growth Rate in % as a Line).',
        zh: '同一张图要展示量级悬殊的两组数据时（如销售额几十万 + 增长率 12%），必须用组合图表并把百分比系列勾选次坐标轴（Secondary Axis），且左右双轴都要标清单位！',
        src: 'UNSW 标准学术英文 · T2 W5 Advanced Charts'
      }
    ],
    examQA: [
      {
        qEn: 'Why does a Profit Margin (%) series appear flat along the bottom axis when plotted alongside Revenue ($) on a standard Column chart, and how do you fix it?',
        qZh: '把利润率（%）和营收（$）画在普通柱状图上时，为什么利润率几乎贴在横轴看不见？怎么修复？',
        tag: '高级图表必考 · 4 分',
        points: [
          {
            en: 'Because percentage values (e.g. 0.15) are tiny compared to dollar revenue (e.g. $500,000) on a shared y-axis. Fix: Change Chart Type → Combo → plot Profit Margin as a Line and tick "Secondary Axis", then add both Primary and Secondary Axis Titles.',
            zh: '因为小数 0.15 在 50 万的纵轴刻度下几乎等于 0；修复：改为组合图（Combo），把利润率设为折线并勾选次坐标轴，再补齐左右双纵轴标题。'
          }
        ],
        keywords: ['different scales', 'Combo Chart', 'Secondary Axis', 'both axis titles']
      }
    ]
  },

  'term2:6': {
    concepts: [
      {
        term: 'Advanced Excel Exam Integration（高级 Excel 机考四大模块）',
        en: 'The Advanced Excel exam integrates Nested IF/AND/OR, cross-sheet XLOOKUP, SUMIFS/COUNTIFS + DATE, PMT/FV + text functions, and Secondary-Axis Combo Charts into one connected workbook.',
        zh: '进阶机考将逻辑嵌套、跨表查找、日期条件统计、财务文本函数与双轴组合图串在一个联动工作簿中考查。',
        src: 'UNSW 标准学术英文 · T2 W6'
      }
    ],
    examQA: [
      {
        qEn: 'In an Advanced Excel exam, how do you verify that your workbook is 100% dynamic before submission?',
        qZh: '进阶 Excel 机考交卷前，如何用 10 秒检验整个工作簿是否做到了 100% 动态联动？',
        tag: '考场验算 · 3 分',
        points: [
          {
            en: 'Temporarily change one input assumption (e.g. GST rate or one sales figure): every summary table, XLOOKUP result, PMT figure and chart should update automatically, then press Ctrl+Z to restore the original number.',
            zh: '临时改一个假设参数（如税率或某行销量），观察所有汇总表、查找结果和图表是否自动跟着刷新，确认无误后按 Ctrl+Z 撤销恢复原值。'
          }
        ],
        keywords: ['sensitivity test', 'Ctrl+Z restore']
      }
    ]
  },

  'term2:7': {
    concepts: [
      {
        term: 'Excel Formula Error Diagnostics & IFERROR（六大报错排查与兜底）',
        en: '#N/A = lookup value not found; #REF! = deleted cell/sheet reference; #VALUE! = wrong data type (text in math); #NAME? = misspelt function or unquoted text; #DIV/0! = division by zero; #### = column too narrow (not an error).',
        zh: '#N/A 查无此项、#REF! 引用被删、#VALUE! 拿文字做算术、#NAME? 拼错函数或漏双引号、#DIV/0! 除以零、#### 只是列宽太窄；可用 =IFERROR(原公式, "提示") 优雅兜底。',
        src: 'UNSW 标准学术英文 · T2 W7 Review'
      }
    ],
    examQA: [
      {
        qEn: 'Diagnose what caused each error: (a) #NAME?; (b) #VALUE!; (c) #N/A; (d) #REF!.',
        qZh: '请分别指出 Excel 出现以下 4 种报错的最常见原因：(a) #NAME?；(b) #VALUE!；(c) #N/A；(d) #REF!。',
        tag: '报错必考 · 4 分',
        points: [
          {
            en: '(a) #NAME?: misspelt function name (e.g. XLOOKP) or forgot quotes around text; (b) #VALUE!: arithmetic attempted on text/spaces.',
            zh: '(a) #NAME? 函数拼错或文字漏加双引号；(b) #VALUE! 参与算术运算的格子里混入了文字或空格。'
          },
          {
            en: '(c) #N/A: XLOOKUP cannot find a matching value (check extra spaces or text-vs-number mismatch); (d) #REF!: a referenced row, column or worksheet was deleted.',
            zh: '(c) #N/A 查找值在查找列中不存在（常因尾部多空格或数字/文本格式不一致）；(d) #REF! 被公式引用的行列或工作表被删掉了。'
          }
        ],
        keywords: ['spelling/quotes', 'wrong data type', 'lookup not found', 'deleted reference']
      }
    ]
  },

  'term2:8': {
    concepts: [
      {
        term: 'Media Presentation Planning Document（媒体演示策划文档五要素）',
        en: 'Before producing media slides, a Planning Document defines Purpose, Target Audience, Storyboard (slide-by-slide visual sketches and timing), Style Guide (fonts/colours), and Asset/Copyright Register.',
        zh: '动手制作前先写策划文档，涵盖五大板块：目标定位、目标受众、逐页分镜草图（Storyboard）、视觉规范（字体配色）以及素材版权登记表。',
        src: 'UNSW 标准学术英文 · T2 W8'
      }
    ],
    examQA: [
      {
        qEn: 'Why is creating a Storyboard and Asset Register required BEFORE building a Media Presentation?',
        qZh: '为什么制作媒体演示前必须先完成分镜草图（Storyboard）与素材版权表（Asset Register）？',
        tag: '策划评分核心 · 4 分',
        points: [
          {
            en: 'A Storyboard locks in narrative flow, visual balance and pacing early so you avoid costly rework, while an Asset Register tracks copyright licences and academic citations to uphold academic integrity.',
            zh: '分镜草图提前定好叙事节奏与版面避免后期推倒重做；素材登记表记录图片来源与版权引用，确保符合 UNSW 学术诚信规范。'
          }
        ],
        keywords: ['narrative pacing / avoids rework', 'copyright & academic integrity']
      }
    ]
  },

  'term2:9': {
    concepts: [
      {
        term: 'Embedded Media vs Linked Media（嵌入媒体与外部链接风险）',
        en: 'Always embed audio/video assets directly inside the presentation (or package in the same folder) and test full-screen playback on another machine to prevent broken black-screen links during grading.',
        zh: '音频与视频务必「嵌入」演示文件（或同目录打包）并在脱网环境下全屏实测，防止交到老师电脑上黑屏无法播放！',
        src: 'UNSW 标准学术英文 · T2 W9'
      }
    ],
    examQA: [
      {
        qEn: 'What happens if a student links a local video file from their Desktop instead of embedding it inside the presentation?',
        qZh: '如果学生只是链接了自己电脑桌面上的本地视频文件而没有嵌入 PPT，交给老师后会发生什么？',
        tag: '实操避坑 · 3 分',
        points: [
          {
            en: 'The absolute file path exists only on the student’s computer, so the video will fail to load on the marker’s computer. Embedding or packaging media ensures reliable playback everywhere.',
            zh: '因为本地绝对路径只存在自己电脑里，老师电脑打开会直接黑屏报错；必须嵌入媒体并在提交前换机或断网自测。'
          }
        ],
        keywords: ['broken local path', 'embed media']
      }
    ]
  },

  'term2:10': {
    concepts: [
      {
        term: 'CRAP Visual Design Principles（演示设计 CRAP 四大黄金原则）',
        en: 'Contrast (highlight key info via size/colour), Repetition (consistent theme across slides), Alignment (clean grid alignment), and Proximity (group related items together, separate unrelated blocks with whitespace).',
        zh: 'CRAP 四原则：对比（突出重点）、重复（全套风格统一）、对齐（沿网格整齐排布）、亲密性（相关图文靠近成组，不相关留白隔开）。',
        src: 'UNSW 标准学术英文 · T2 W10'
      }
    ],
    examQA: [
      {
        qEn: 'Explain all four CRAP visual design principles and give one concrete slide example for each.',
        qZh: '请解释 CRAP 视觉设计四大原则，并各举一个具体的 PPT 排版例子。',
        tag: '设计理论必考 · 4 分',
        points: [
          {
            en: 'Contrast: Dark navy heading vs clean white background; Repetition: Same accent colour and footer style on every slide; Alignment: Left-aligning all bullet lists along one grid line; Proximity: Placing a caption directly beneath its chart with whitespace separating the next topic.',
            zh: '对比：深色大标题配浅底；重复：每页统一强调色与页脚；对齐：要点与标题严格左对齐；亲密性：图注紧贴图表下方，不同板块之间留足空白。'
          }
        ],
        keywords: ['Contrast', 'Repetition', 'Alignment', 'Proximity']
      }
    ]
  },

  'term2:11': {
    concepts: [
      {
        term: 'Pre-Submission Technical QA（终稿提交前四重验收）',
        en: 'Verify file naming conventions, spelling/grammar, complete APA/Harvard citations for all images/audio, exact duration timing, and re-download your uploaded file from Moodle to confirm zero corruption.',
        zh: '终稿前核对命名规范、英文拼写、全部图文音视频引用标注、播放总时长，上传后重新下载打开确认文件未损坏。',
        src: 'UNSW 标准学术英文 · T2 W11'
      }
    ],
    examQA: [
      {
        qEn: 'Why should you always re-download and open your own submission from Moodle right after uploading?',
        qZh: '为什么把作业上传到 Moodle 后，一定要自己立刻重新下载并打开检查一遍？',
        tag: '提交规范 · 3 分',
        points: [
          {
            en: 'To verify you uploaded the final version (not an empty draft), that the file was not corrupted during transfer, and that all embedded media/fonts render properly.',
            zh: '确认没传错旧草稿、文件传输未损坏，且嵌入媒体与排版在下载后完整可打开。'
          }
        ],
        keywords: ['verify final version', 'no file corruption']
      }
    ]
  },

  'term2:12': {
    concepts: [
      {
        term: 'Dual-Track Final Revision（期末理论与机考双轨冲刺）',
        en: 'Balance both exam tracks: Theory (Hardware, DNS/HTTPS, CRAAP, SDLC, CRAP design) and Practical Excel (Absolute refs, Nested IF/AND/OR, XLOOKUP, SUMIFS, PMT, Combo Charts).',
        zh: '考前两手抓：理论轨熟背硬件/网络/CRAAP/SDLC/CRAP，实操轨限时盲敲 $ 锁格、嵌套 IF、XLOOKUP、SUMIFS、PMT 与双轴组合图。',
        src: 'UNSW 标准学术英文 · T2 W12'
      }
    ],
    examQA: [
      {
        qEn: 'Compare when to use XLOOKUP versus SUMIFS in a business workbook.',
        qZh: '在商业 Excel 表格中，什么时候该用 XLOOKUP，什么时候该用 SUMIFS？',
        tag: '综合辨析 · 4 分',
        points: [
          {
            en: 'Use XLOOKUP to retrieve a SINGLE matching attribute for a unique key (e.g. pulling unit price for Product ID P002); use SUMIFS to AGGREGATE (total) multiple rows meeting one or more criteria (e.g. total Q1 sales in Sydney).',
            zh: '查唯一键对应的单个属性（按产品码查单价）用 XLOOKUP；把满足多个条件的多行数据汇总求和（算悉尼一季度总销售额）用 SUMIFS。'
          }
        ],
        keywords: ['single matching attribute -> XLOOKUP', 'aggregate multiple rows -> SUMIFS']
      }
    ]
  },

  'term2:13': {
    concepts: [
      {
        term: 'End-to-End Business Dashboard Architecture（综合项目四层数据流）',
        en: 'A clean business workbook separates Assumptions/Lookup tables, Cleaned Transaction Data (formulas using XLOOKUP + IF), Executive Summary (SUMIFS + PMT/financial KPIs), and Visual Dashboard (Combo Charts).',
        zh: '专业商业工作簿分四层：参数与查找表 → 明细交易表（XLOOKUP + IF）→ 汇总看板（SUMIFS + 财务指标）→ 可视化图表（双轴组合图），改一个参数全表自动联动。',
        src: 'UNSW 标准学术英文 · T2 W13 Final Project'
      }
    ],
    examQA: [
      {
        qEn: 'Why is keeping fixed assumptions (such as GST 10% or Interest Rate 6%) in a dedicated Assumptions table superior to typing 0.10 inside every formula?',
        qZh: '为什么把税率（10%）或利率（6%）单独放在假设参数区引用，远好于把 0.10 直接写进每一条公式里？',
        tag: '建模规范必考 · 4 分',
        points: [
          {
            en: 'If the tax rate changes from 10% to 12%, you update ONE single assumption cell and every formula across the entire workbook recalculates accurately — eliminating manual hunt-and-replace errors.',
            zh: '税率调整时只需改参数区 1 个单元格，整本工作簿几百条公式瞬间全自动更新，杜绝漏改错改。'
          }
        ],
        keywords: ['single source of truth', 'instant scenario updates', 'reduces human error']
      }
    ]
  }
};
