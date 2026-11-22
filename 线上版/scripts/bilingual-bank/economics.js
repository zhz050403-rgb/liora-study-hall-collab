'use strict';

/**
 * Economics (27 weeks: Term 1 W1–6, Term 2 W1–13, Term 1x W5–12)
 * Line-by-line EN→ZH Core Concepts + Exam-Likely Q&As (incorporating real UNSW Term 2 Sample Exam A & B questions).
 */
module.exports = {
  /* ==================== TERM 1 (Microeconomics Core) ==================== */
  'term1:1': {
    concepts: [
      {
        term: 'Scarcity（稀缺性）',
        en: 'Scarcity is the fundamental economic problem that productive resources are limited while human wants are unlimited, so no society can produce enough goods and services to satisfy every want.',
        zh: '稀缺性是指用于生产的资源有限、而人类的欲望无限这一根本经济矛盾，因此没有任何社会能够生产出满足所有欲望的商品和服务。',
        src: 'UNSW 标准学术英文 · Unit 1 Introduction to Economics'
      },
      {
        term: 'Choice & Opportunity Cost（选择与机会成本）',
        en: 'Because resources are scarce, individuals, firms and governments must make choices; the opportunity cost of any choice is the value of the next best alternative forgone.',
        zh: '由于资源稀缺，个人、企业和政府必须做出取舍；任何选择的机会成本，都是你为了这个决定所放弃的「次优替代方案」的价值。',
        src: 'UNSW 标准学术英文 · Unit 1'
      },
      {
        term: 'Four Factors of Production（四大生产要素及报酬）',
        en: 'Economists classify productive resources into four factors of production: Land (paid rent), Labour (paid wages), Capital (paid interest), and Enterprise (rewarded with profit).',
        zh: '经济学将生产资源分为四大要素：土地（报酬为地租 Rent）、劳动（工资 Wages）、资本（利息 Interest）以及企业家才能（利润 Profit）。',
        src: 'UNSW 标准学术英文 · Unit 1'
      },
      {
        term: 'Goods vs Services（有形商品与无形服务）',
        en: 'Goods are tangible physical items that can be touched and stored (such as food or laptops), whereas services are intangible activities performed for consumers (such as healthcare or delivery).',
        zh: '商品（Goods）是看得见、摸得着、可储存的有形物品（如食物、电脑），而服务（Services）是为消费者提供的无形活动（如医疗、配送）。',
        src: 'UNSW 标准学术英文 · Unit 1'
      },
      {
        term: 'Microeconomics vs Macroeconomics（微观经济学与宏观经济学）',
        en: 'Microeconomics studies individual decision-making units such as consumers, firms and specific markets, whereas macroeconomics examines the performance of the whole economy, including GDP growth, inflation, unemployment and trade.',
        zh: '微观经济学研究个体决策单位（消费者、企业和单一市场价格），而宏观经济学研究国民经济整体运行（GDP 增长、通货膨胀、失业与国际贸易）。',
        src: 'UNSW 标准学术英文 · Unit 1'
      }
    ],
    examQA: [
      {
        qEn: 'Why does scarcity exist? Does scarcity still exist in wealthy countries like Australia?',
        qZh: '为什么会有稀缺性？在像澳大利亚这样的富裕国家，稀缺性是否依然存在？',
        tag: '单元必考大题 · 5 分',
        points: [
          {
            en: 'Scarcity exists because of the permanent gap between two realities: human wants are unlimited and constantly expanding, whereas the factors of production (land, labour, capital and enterprise) available at any time are finite.',
            zh: '稀缺性源于两个永恒矛盾：人类欲望无限且不断升级，而任意时期可用的四大生产要素（土地、劳动、资本、企业家才能）都是有限的。'
          },
          {
            en: 'Yes — scarcity still exists in wealthy countries like Australia because scarcity means "insufficient relative to unlimited wants", NOT "poverty" or "small absolute quantity".',
            zh: '是的，富裕国家同样存在稀缺性；因为「稀缺」指资源相对于无限欲望不够用，绝不等同于「贫穷」或绝对数量少。'
          },
          {
            en: 'Even rich economies must still choose how to allocate limited budgets between healthcare, education, defence and environmental protection.',
            zh: '即便富裕国家也必须在有限财政下权衡：多投入医疗、教育、国防还是环保。'
          }
        ],
        keywords: ['unlimited wants', 'limited productive resources', 'relative not absolute poverty']
      },
      {
        qEn: 'What does scarcity lead to? Explain the chain from scarcity to choice, opportunity cost and the three basic economic questions.',
        qZh: '稀缺性导致了什么？请完整解释「稀缺 → 选择 → 机会成本 → 三大基本经济问题」的逻辑链。',
        tag: '核心论述大题 · 6 分',
        points: [
          {
            en: 'First, scarcity forces every individual, firm and government to make CHOICES about how to allocate limited resources.',
            zh: '第一，稀缺性迫使每个个人、企业和政府都必须对有限资源做出「选择（Choice）」。'
          },
          {
            en: 'Second, every choice creates an OPPORTUNITY COST — the value of the next best alternative given up when resources are used for one purpose instead of another.',
            zh: '第二，有选择就会产生「机会成本（Opportunity Cost）」——把资源用于甲用途时所放弃的次优乙用途的价值。'
          },
          {
            en: 'Third, at the societal level, scarcity forces every economy to answer three basic economic questions: What to produce? How to produce? And for whom to produce?',
            zh: '第三，在社会层面，稀缺性导致每个经济体必须回答三大基本问题：生产什么、如何生产、为谁生产。'
          }
        ],
        keywords: ['forces choice', 'opportunity cost (next best alternative)', 'What / How / For whom to produce']
      },
      {
        qEn: 'Distinguish between Microeconomics and Macroeconomics, giving two concrete examples for each.',
        qZh: '请区分微观经济学与宏观经济学，并各举出两个具体研究例子。',
        tag: '高频对比 · 4 分',
        points: [
          {
            en: 'Microeconomics analyses the behaviour of individual economic agents (households and firms) and price determination in specific markets — e.g. the price of coffee in Sydney or how a café decides how many baristas to hire.',
            zh: '微观经济学聚焦个体与单一市场——例如悉尼咖啡市场价格变动，或某家咖啡馆决定雇几位员工。'
          },
          {
            en: 'Macroeconomics analyses economy-wide aggregates and government policies — e.g. Australia’s annual inflation rate (CPI) or the Reserve Bank raising interest rates to slow aggregate demand.',
            zh: '宏观经济学聚焦国民经济总量与整体政策——例如澳大利亚年度 CPI 通胀率，或澳联储加息抑制总需求。'
          }
        ],
        keywords: ['individual markets/agents', 'economy-wide aggregates', 'concrete examples']
      },
      {
        qEn: 'Explain the difference between a Free Good and an Economic Good, and explain why clean air can become an economic good.',
        qZh: '请区分自由物品（Free Good）与经济物品（Economic Good），并解释为什么清洁空气有时也会变成经济物品。',
        tag: '延伸高频 · 4 分',
        points: [
          {
            en: 'An economic good is scarce and requires limited resources to produce, so it carries a positive opportunity cost; a free good is abundant relative to wants and has zero opportunity cost (e.g. sunlight).',
            zh: '经济物品具有稀缺性、需耗费有限资源生产且有机会成本；自由物品相对欲望极其充裕、机会成本为零（如自然阳光）。'
          },
          {
            en: 'When industrial pollution makes clean air scarce, society must spend resources on filtration and emission controls to obtain it, turning clean air into an economic good with a real opportunity cost.',
            zh: '一旦工业污染导致洁净空气变得稀缺，社会必须花资源治理排放或购买净化设备，清洁空气就具有了机会成本，转化为经济物品。'
          }
        ],
        keywords: ['zero vs positive opportunity cost', 'scarcity changes with context']
      }
    ]
  },

  'term1:2': {
    concepts: [
      {
        term: 'Production Possibility Frontier / Curve (PPF/PPC)（生产可能性曲线）',
        en: 'The Production Possibility Curve shows all maximum combinations of two goods an economy can produce when all available resources and technology are fully and efficiently employed.',
        zh: '生产可能性曲线（PPC/PPF）表示在现有资源与技术得到充分且有效利用时，一个经济体所能生产的两种商品的最大产量组合。',
        src: 'UNSW 标准学术英文 · Unit 2 Production & Technology'
      },
      {
        term: 'Efficiency, Inefficiency & Unattainability on a PPC（线上、线内与线外点）',
        en: 'Points ON the PPC represent productive efficiency; points INSIDE the PPC indicate unemployed or inefficiently used resources; points OUTSIDE the PPC are currently unattainable with existing resources and technology.',
        zh: '曲线上的点代表生产有效率；曲线内部的点代表存在失业或资源浪费（低效）；曲线外部的点在当前资源与技术下无法达到。',
        src: 'UNSW 标准学术英文 · Unit 2'
      },
      {
        term: 'Law of Increasing Opportunity Cost（机会成本递增规律）',
        en: 'A bowed-out (concave) PPC reflects increasing opportunity cost because resources are not equally suited to producing all goods, so shifting more resources into one good sacrifices increasingly larger amounts of the other.',
        zh: '向外凸（凹向原点）的 PPC 反映了机会成本递增规律：由于不同资源并非同样擅长生产两种产品，把资源持续转去生产某商品时，每多产一单位放弃的另一种商品会越来越多。',
        src: 'UNSW 标准学术英文 · Unit 2'
      },
      {
        term: 'Economic Growth & Outward Shift of the PPC（经济增长与 PPC 外移）',
        en: 'An outward shift of the PPC represents long-run economic growth caused by an increase in the quantity or quality of resources (e.g. immigration, capital investment, education) or technological innovation.',
        zh: 'PPC 向外扩张代表长期经济增长，驱动因素包括生产要素数量增加、质量提升（教育/资本积累）或技术进步。',
        src: 'UNSW 标准学术英文 · Unit 2'
      }
    ],
    examQA: [
      {
        qEn: 'Using a Production Possibility Curve (PPC), explain the concepts of scarcity, choice, opportunity cost, unemployment and economic growth.',
        qZh: '请结合生产可能性曲线（PPC），一次性解释稀缺性、选择、机会成本、失业以及经济增长五个概念。',
        tag: '经典大题 · 8 分',
        points: [
          {
            en: 'Scarcity is shown by the boundary itself (points outside the PPC are unattainable); Choice is represented by selecting one specific combination along the curve.',
            zh: '稀缺性体现为曲线边界（外部点不可达）；选择体现为在曲线上选定某一个具体产量组合。'
          },
          {
            en: 'Opportunity Cost is shown by moving along the PPC: producing more of Good X requires giving up some units of Good Y.',
            zh: '机会成本体现为沿曲线移动：多生产 X 商品必须放弃一定数量的 Y 商品。'
          },
          {
            en: 'Unemployment/inefficiency is shown by any point INSIDE the PPC, while Economic Growth is shown by an OUTWARD shift of the entire PPC due to better technology or more resources.',
            zh: '失业/资源闲置表现为曲线内部点；经济增长表现为技术进步或要素扩张推动整条 PPC 向外移动。'
          }
        ],
        keywords: ['boundary = scarcity', 'movement along = opportunity cost', 'inside = unemployment', 'outward shift = growth']
      },
      {
        qEn: 'Why is a realistic Production Possibility Curve usually bowed outward (concave to the origin) rather than a straight line?',
        qZh: '为什么现实中的 PPC 通常是向外凸的曲线而不是一条直线？',
        tag: '必考原理 · 4 分',
        points: [
          {
            en: 'A straight-line PPC assumes constant opportunity cost, which only holds if all resources are perfectly interchangeable between both goods.',
            zh: '直线 PPC 意味着机会成本恒定，前提是所有资源在两种产品间完全无差异可替代（现实中极少成立）。'
          },
          {
            en: 'In reality, resources are specialised (e.g. fertile farmland vs software engineers); transferring less-suited resources forces larger sacrifices per extra unit produced, causing increasing opportunity cost and a bowed-out curve.',
            zh: '现实中资源具有专业化差异（如农田不适合写代码），被迫转移不擅长的资源时每增产 1 单位要牺牲更多另一种商品，导致机会成本递增，曲线向外凸。'
          }
        ],
        keywords: ['specialised resources', 'not equally adaptable', 'increasing opportunity cost']
      },
      {
        qEn: 'How does investing in Capital Goods today affect an economy’s PPC in the future compared to focusing heavily on Consumer Goods?',
        qZh: '相比把资源大量用于生产消费品，今天多生产资本品（如机器设备）会对未来的 PPC 产生什么影响？',
        tag: '高频应用 · 5 分',
        points: [
          {
            en: 'Choosing more capital goods today carries an immediate opportunity cost of lower current consumption (fewer consumer goods today).',
            zh: '今天多造资本品的短期机会成本是牺牲当下消费品产量（生活享受暂时减少）。'
          },
          {
            en: 'However, capital accumulation expands future productive capacity, shifting the PPC further outward in future years and enabling higher output of BOTH goods later.',
            zh: '但资本品积累会扩大未来产能，推动未来 PPC 更大幅度外移，从而在长期同时产出更多消费品和资本品。'
          }
        ],
        keywords: ['trade-off today', 'expands productive capacity', 'larger outward shift']
      },
      {
        qEn: 'Distinguish between a movement from inside the PPC to a point on the PPC versus an outward shift of the PPC.',
        qZh: '请区分「从 PPC 内部点移动到曲线上」与「整条 PPC 向外移动」的经济学含义。',
        tag: '辨析必考 · 4 分',
        points: [
          {
            en: 'Moving from inside the PPC onto the curve represents actual short-run output recovery by employing previously idle resources (reducing unemployment) WITHOUT increasing maximum capacity.',
            zh: '从线内移到线上代表短期实际产出回升——把原本闲置/失业的劳动力和设备重新用起来，但经济体的最大产能上限并未改变。'
          },
          {
            en: 'An outward shift of the PPC represents genuine long-run economic growth where maximum productive capacity itself expands via new technology, labour growth or capital investment.',
            zh: '整条 PPC 外移才代表真正的长期潜在经济增长——由技术革新、资本或劳动力扩张把最大产能天花板推高了。'
          }
        ],
        keywords: ['employing idle resources', 'potential capacity expansion']
      }
    ]
  },

  'term1:3': {
    concepts: [
      {
        term: 'Law of Demand & Demand Curve Shifts（需求定律与需求移动）',
        en: 'The Law of Demand states that, ceteris paribus, as price rises quantity demanded falls (movement along the curve); non-price factors such as income, tastes, prices of substitutes/complements and expectations shift the entire demand curve.',
        zh: '需求定律指出，在其他条件不变（ceteris paribus）时价格上升导致需求量减少（沿曲线移动）；而收入、偏好、替代品/互补品价格与预期等非价格因素会导致整条需求曲线左移或右移。',
        src: 'UNSW 标准学术英文 · Unit 3 Demand & Supply'
      },
      {
        term: 'Law of Supply & Supply Curve Shifts（供给定律与供给移动）',
        en: 'The Law of Supply states that, ceteris paribus, higher prices induce firms to supply a larger quantity; non-price factors such as input costs, technology, taxes/subsidies and weather shift the entire supply curve.',
        zh: '供给定律指出，其他条件不变时价格越高供给量越大；而原材料成本、技术进步、税收/补贴及自然灾害等非价格因素会使整条供给曲线移动。',
        src: 'UNSW 标准学术英文 · Unit 3'
      },
      {
        term: 'Market Equilibrium & Price Mechanism（市场均衡与价格机制）',
        en: 'Market equilibrium occurs where quantity demanded equals quantity supplied (Qd = Qs), clearing the market with no tendency for price to change; shortages push prices up while surpluses push prices down.',
        zh: '市场均衡发生在需求量等于供给量（Qd = Qs）处，市场出清且价格不再变动；供不应求（短缺）会推高价格，供过于求（过剩）会压低价格。',
        src: 'UNSW 标准学术英文 · Unit 3'
      },
      {
        term: 'Consumer Surplus & Producer Surplus（消费者剩余与生产者剩余）',
        en: 'Consumer surplus is the difference between the maximum price buyers are willing to pay and the market price actually paid; producer surplus is the difference between the market price received and the minimum price sellers are willing to accept.',
        zh: '消费者剩余是买家最高愿付价格与实际成交价之间的差额（需求线下、价格线上三角形）；生产者剩余是实际卖价与卖家最低愿卖成本价的差额（价格线下、供给线上三角形）。',
        src: 'UNSW 标准学术英文 · Unit 3'
      }
    ],
    examQA: [
      {
        qEn: 'Distinguish clearly between a "change in quantity demanded" and a "change in demand", giving a real-world example of each.',
        qZh: '请严格区分「需求量的变动（change in quantity demanded）」与「需求的变动（change in demand）」，并各举一例。',
        tag: '必考基础大题 · 5 分',
        points: [
          {
            en: 'A change in quantity demanded is caused ONLY by a change in the good’s own price and is shown as a MOVEMENT ALONG an existing demand curve (e.g. a café cuts coffee price from $5 to $4, increasing cups bought).',
            zh: '需求量变动仅由商品「自身价格变化」引起，图形表现为沿原需求曲线上下移动（如咖啡从 $5 降到 $4 导致销量增加）。'
          },
          {
            en: 'A change in demand is caused by a NON-PRICE factor (income, tastes, substitute/complement price) and SHIFTS the entire demand curve left or right (e.g. rising consumer incomes shift demand for café coffee rightward at every price).',
            zh: '需求变动由「非价格因素」（收入、偏好、替代品价格等）引起，图形表现为整条需求曲线整体平移。'
          }
        ],
        keywords: ['own price -> movement along', 'non-price factor -> shift of curve', 'ceteris paribus']
      },
      {
        qEn: 'Suppose a severe drought destroys 30% of Australia’s wheat crop. Using Demand & Supply analysis, trace step by step how the market reaches a new equilibrium.',
        qZh: '假设严重干旱摧毁了澳大利亚 30% 的小麦收成。请用供需模型逐步推导市场如何达到新均衡。',
        tag: '经典三步作图大题 · 6 分',
        points: [
          {
            en: 'Step 1 (Curve Shift): Severe drought reduces wheat output at every price, shifting the Supply curve to the LEFT from S1 to S2 (Demand remains unchanged).',
            zh: '第 1 步（移线）：干旱导致供给减少，供给曲线向左上方从 S1 移至 S2，需求曲线不变。'
          },
          {
            en: 'Step 2 (Disequilibrium): At the original price P1, quantity demanded now exceeds the smaller quantity supplied, creating a SHORTAGE (excess demand).',
            zh: '第 2 步（失衡）：在原价格 P1 下，需求量大于新供给量，市场出现短缺（Shortage）。'
          },
          {
            en: 'Step 3 (Price Adjustment & New Equilibrium): Buyers bid up the price; as price rises from P1 to P2, quantity demanded contracts along D and quantity supplied expands along S2 until the shortage disappears at higher equilibrium price P2 and lower equilibrium quantity Q2.',
            zh: '第 3 步（价格调节与新均衡）：短缺推高价格，价格从 P1 升至 P2 期间需求量沿 D 收缩、供给量沿 S2 扩张，直至在更高均衡价 P2、更低均衡量 Q2 处重新出清。'
          }
        ],
        keywords: ['Supply shifts left', 'shortage at P1', 'price rises to P2', 'higher P2 / lower Q2']
      },
      {
        qEn: 'What happens to the equilibrium price and quantity of electric cars if battery manufacturing technology improves AND petrol prices rise sharply at the same time?',
        qZh: '如果电池制造技术大幅进步（供给端）且同时汽油价格飙升（需求端），电动汽车的均衡价格和均衡数量会如何变化？',
        tag: '双线移动压轴题 · 6 分',
        points: [
          {
            en: 'Improved battery technology lowers production costs, shifting Supply RIGHT; higher petrol prices make petrol cars costlier to run, shifting Demand for the substitute (electric cars) RIGHT as well.',
            zh: '电池技术进步降成本 → 供给曲线右移；汽油涨价使替代品燃油车变贵 → 电动车需求曲线同步右移。'
          },
          {
            en: 'Both shifts raise equilibrium quantity, so equilibrium Quantity DEFINITELY INCREASES.',
            zh: '两股力量都推高销量，因此均衡数量 Q 必然上升。'
          },
          {
            en: 'However, higher demand pushes price up while higher supply pushes price down, so the net effect on equilibrium Price is INDETERMINATE (depends on which shift is larger).',
            zh: '但需求右移推高价格、供给右移压低价格，方向相反，因此最终均衡价格 P 变动不确定（取决于哪条线移动幅度更大）。'
          }
        ],
        keywords: ['both Demand and Supply shift right', 'Q definitely rises', 'P is indeterminate']
      },
      {
        qEn: 'Explain how a binding Price Ceiling (maximum legal price set below equilibrium) affects market efficiency and surplus.',
        qZh: '请解释具约束力的最高限价（Price Ceiling，设在均衡价下方）如何影响市场出清与社会总剩余。',
        tag: '政府干预必考 · 5 分',
        points: [
          {
            en: 'A binding price ceiling keeps price below equilibrium, so quantity demanded exceeds quantity supplied, causing a persistent SHORTAGE and non-price rationing (queues, black markets).',
            zh: '最高限价低于均衡价，导致需求量持续大于供给量，产生持久短缺、排队和非正规黑市交易。'
          },
          {
            en: 'Because fewer units are traded than at equilibrium, total surplus falls, creating a Deadweight Loss (allocative inefficiency).',
            zh: '实际成交量低于均衡量，消费者剩余与生产者剩余之和缩水，形成无谓损失（Deadweight Loss）。'
          }
        ],
        keywords: ['below equilibrium', 'persistent shortage', 'Deadweight Loss']
      }
    ]
  },

  'term1:4': {
    concepts: [
      {
        term: 'Market Failure（市场失灵）',
        en: 'Market failure occurs when the free price mechanism fails to allocate resources efficiently to maximise social welfare, resulting in overproduction or underproduction relative to the socially optimal output.',
        zh: '市场失灵是指自由价格机制无法实现资源的最优配置与社会福利最大化，导致某些商品相对社会最优产量出现生产过剩或供给不足。',
        src: 'UNSW 标准学术英文 · Unit 4 Market Successes & Failures'
      },
      {
        term: 'Negative vs Positive Externalities（负外部性与正外部性）',
        en: 'A negative externality imposes uncompensated external costs on third parties (MSC > MPC, causing market overproduction such as pollution); a positive externality generates unpaid external benefits to society (MSB > MPB, causing market underproduction such as vaccinations).',
        zh: '负外部性给第三方带来未获补偿的外部成本（社会边际成本 MSC > 私人边际成本 MPC，市场过度生产，如污染）；正外部性带来外部收益（MSB > MPB，市场供给不足，如疫苗与教育）。',
        src: 'UNSW 标准学术英文 · Unit 4'
      },
      {
        term: 'Public Goods: Non-Rivalry & Non-Excludability（公共物品两大特征）',
        en: 'Pure public goods are non-rival (one person’s consumption does not reduce availability for others) and non-excludable (non-payers cannot be prevented from benefiting), leading to the Free-Rider Problem.',
        zh: '纯公共物品具备非竞争性（一人消费不减少他人可用量）和非排他性（无法阻止不付费者享用），由此引发「搭便车问题（Free-Rider Problem）」，私人市场不愿提供。',
        src: 'UNSW 标准学术英文 · Unit 4'
      },
      {
        term: 'Correcting Externalities: Pigouvian Taxes & Subsidies（纠正外部性的政策工具）',
        en: 'Governments internalise negative externalities by imposing a per-unit tax equal to the marginal external cost (shifting supply up toward MSC), and encourage positive externalities through subsidies or direct public provision.',
        zh: '政府通过征收等于边际外部成本的庇古税（Pigouvian Tax）把负外部性内部化、压低产量至社会最优；对正外部性则通过补贴或政府直接提供来扩大产量。',
        src: 'UNSW 标准学术英文 · Unit 4'
      }
    ],
    examQA: [
      {
        qEn: 'Using a diagram (MSC, MPC, MSB), explain why industrial air pollution represents a negative externality and how a Pigouvian carbon tax restores allocative efficiency.',
        qZh: '请结合边际社会成本（MSC）与边际私人成本（MPC）模型，解释工业排放为何属于负外部性，以及碳税如何纠正市场失灵。',
        tag: '微观核心大题 · 8 分',
        points: [
          {
            en: 'Polluting firms consider only their Marginal Private Cost (MPC) and ignore health/environmental damage inflicted on third parties (Marginal External Cost, MEC), so MSC = MPC + MEC lies above MPC.',
            zh: '污染企业只算私人成本 MPC，忽视给周边居民和环境带来的外部成本 MEC，导致社会总边际成本 MSC 高于 MPC。'
          },
          {
            en: 'The unregulated market produces at Q_market (MPC = MSB), which exceeds the socially optimal output Q_opt (MSC = MSB), creating a Deadweight Loss triangle.',
            zh: '自由市场在 MPC = MSB 处生产，产量大于社会最优产量（MSC = MSB），多产部分造成社会无谓损失（DWL）。'
          },
          {
            en: 'Imposing a Pigouvian tax equal to MEC raises the firm’s private cost curve upward to coincide with MSC, internalising the externality and reducing output to Q_opt.',
            zh: '征收等于 MEC 的庇古税使企业成本曲线上移与 MSC 重合，迫使企业把外部污染成本纳入决策，产量回落至社会最优 Q_opt。'
          }
        ],
        keywords: ['MSC = MPC + MEC', 'overproduction (Qm > Qopt)', 'Deadweight Loss', 'internalise externality via tax']
      },
      {
        qEn: 'Explain why private profit-maximising firms fail to supply pure public goods such as national defence or street lighting.',
        qZh: '为什么追求利润最大化的私营企业不愿提供国防或路灯这类纯公共物品？',
        tag: '必考简答 · 5 分',
        points: [
          {
            en: 'Because pure public goods are non-excludable, consumers can enjoy the benefit without paying — known as the Free-Rider Problem.',
            zh: '由于非排他性，消费者不付钱也能照样享用，引发普遍的「搭便车（Free-Rider）」行为。'
          },
          {
            en: 'Unable to charge users profitably, private firms earn zero or insufficient revenue and underproduce (or completely fail to produce) the good, justifying government funding via taxation.',
            zh: '私营企业无法向受益者收费盈利，导致市场完全缺失供给，因此需由政府征税统一提供。'
          }
        ],
        keywords: ['non-excludable', 'non-rival', 'Free-Rider Problem', 'government provision via taxes']
      },
      {
        qEn: 'Why does the free market underproduce university education and vaccinations? Suggest two government policies to address this.',
        qZh: '为什么自由市场会导致高等教育和疫苗接种供给不足？请提出两项政府应对政策。',
        tag: '正外部性必考 · 5 分',
        points: [
          {
            en: 'Education and vaccinations generate Positive Externalities (spillover benefits to society such as higher productivity and herd immunity), meaning Marginal Social Benefit (MSB) exceeds Marginal Private Benefit (MPB).',
            zh: '教育和疫苗产生正外部性（提升社会整体生产力、形成群体免疫），社会边际收益 MSB 大于私人边际收益 MPB。'
          },
          {
            en: 'Individuals weigh only their private benefit against cost, so market quantity falls below the social optimum. Governments correct this via subsidies/HECS loans, free public clinics, or compulsory schooling.',
            zh: '个人只按私人收益做决定导致消费不足；政府可通过补贴/助学贷款、免费公共接种或义务教育法规来扩大至社会最优。'
          }
        ],
        keywords: ['Positive Externality', 'MSB > MPB', 'underproduction', 'subsidies / direct provision']
      }
    ]
  },

  'term1:5': {
    concepts: [
      {
        term: 'Firm Revenue: TR, AR and MR（总收益、平均收益与边际收益）',
        en: 'Total Revenue equals Price times Quantity (TR = P × Q); Average Revenue equals TR ÷ Q (= Price); Marginal Revenue (MR = ΔTR ÷ ΔQ) is the extra revenue earned from selling one additional unit.',
        zh: '总收益 TR = 价格 × 销量；平均收益 AR = TR ÷ Q（即售价 P）；边际收益 MR 是每多卖 1 单位商品所带来的额外总收益增量。',
        src: 'UNSW 标准学术英文 · Unit 5 Firm Pricing & Income'
      },
      {
        term: 'Profit Maximisation Rule (MR = MC)（利润最大化黄金条件）',
        en: 'A firm maximises economic profit at the output where Marginal Revenue equals Marginal Cost (MR = MC): if MR > MC, producing another unit adds to profit; if MR < MC, the extra unit reduces profit.',
        zh: '企业在「边际收益等于边际成本（MR = MC）」处实现利润最大化：只要 MR > MC 增产就能多赚钱；一旦 MR < MC 增产反而亏钱。',
        src: 'UNSW 标准学术英文 · Unit 5'
      },
      {
        term: 'Price Discrimination & Consumer Demand（价格歧视与支付意愿）',
        en: 'Firms with market power can increase revenue by charging different prices to different customer groups with different price elasticities of demand (e.g. student discounts vs peak business fares) when resale is prevented.',
        zh: '拥有定价权的企业在阻止转售的前提下，可根据不同群体的价格弹性差异收取不同价格（如学生票 vs 商务全价票），从而把消费者剩余转化为利润。',
        src: 'UNSW 标准学术英文 · Unit 5'
      },
      {
        term: 'Accounting Profit vs Economic Profit（会计利润与经济利润）',
        en: 'Accounting profit subtracts only explicit monetary costs from total revenue, whereas economic profit subtracts BOTH explicit costs and implicit opportunity costs (such as the owner’s forgone salary and interest).',
        zh: '会计利润只从总收入减去显性货币支出；而经济利润还要减去隐性机会成本（老板放弃的年薪和自有资金利息），经济利润为零即「正常利润」。',
        src: 'UNSW 标准学术英文 · Unit 5'
      }
    ],
    examQA: [
      {
        qEn: 'Explain intuitively why a firm maximises profit where Marginal Revenue equals Marginal Cost (MR = MC), rather than where Total Revenue is maximised.',
        qZh: '请用直觉解释为什么企业在 MR = MC 处实现利润最大化，而不是在总收入（TR）最大处？',
        tag: '必考核心原理 · 5 分',
        points: [
          {
            en: 'Total Revenue ignores production costs; selling extra units at lower prices can raise TR while adding even more to Total Cost, actually shrinking profit.',
            zh: '总收入最大点完全忽略了成本：如果降价多卖带来的新增收入低于新增成本，反而会越卖越亏。'
          },
          {
            en: 'Whenever MR > MC, each extra unit adds more to revenue than to cost, increasing profit; whenever MR < MC, extra output reduces profit. Therefore profit peaks precisely where MR = MC.',
            zh: '只要 MR > MC 就该继续增产赚钱，一旦 MR < MC 就该减产止损，因此利润必然在 MR = MC 处达到最高峰。'
          }
        ],
        keywords: ['ignores costs', 'MR > MC expand', 'MR < MC contract', 'profit peaks at MR = MC']
      },
      {
        qEn: 'Distinguish between explicit costs, implicit costs, normal profit and supernormal (economic) profit.',
        qZh: '请区分显性成本、隐性成本、正常利润与超额（经济）利润。',
        tag: '高频概念 · 5 分',
        points: [
          {
            en: 'Explicit costs are direct monetary payments to outside suppliers (wages, rent, materials); implicit costs are the opportunity costs of self-owned resources (owner’s forgone salary and capital return).',
            zh: '显性成本是直接支付给外部的货币费用（房租、工资、原料）；隐性成本是老板投入自有时间与资金的机会成本。'
          },
          {
            en: 'Normal profit occurs when Economic Profit = 0 (TR covers both explicit and implicit costs, just enough to keep the firm in the industry); Supernormal profit occurs when Economic Profit > 0.',
            zh: '正常利润指经济利润 = 0（刚好覆盖显性+隐性成本，足以留住企业继续经营）；经济利润 > 0 则称为超额利润。'
          }
        ],
        keywords: ['explicit vs implicit opportunity cost', 'Normal Profit (Economic Profit = 0)', 'Supernormal Profit']
      },
      {
        qEn: 'What three conditions are necessary for a firm to practise successful Price Discrimination?',
        qZh: '企业想成功实施价格歧视（不同人收不同价），必须同时满足哪三个前提条件？',
        tag: '高频简答 · 4 分',
        points: [
          {
            en: '1) Market power (downward-sloping demand curve so the firm is a price maker, not a price taker).',
            zh: '1）企业具备一定市场定价权（面临向下倾斜的需求曲线）。'
          },
          {
            en: '2) Ability to segment buyers into groups with different price elasticities of demand (e.g. students vs business travellers).',
            zh: '2）能够识别并区分不同价格弹性的消费群体（如学生/老人 vs 商务人士）。'
          },
          {
            en: '3) Prevention of arbitrage/resale so low-price buyers cannot resell to high-price buyers.',
            zh: '3）能有效防止转售套利（例如实名机票、查验学生证）。'
          }
        ],
        keywords: ['market power', 'different elasticities', 'no resale / arbitrage']
      }
    ]
  },

  'term1:6': {
    concepts: [
      {
        term: 'Production Equilibrium & Optimal Input Mix（生产均衡与最优投入组合）',
        en: 'A cost-minimising firm chooses its combination of inputs (labour and capital) so that the marginal product per dollar spent is equalised across all inputs (MPL/w = MPK/r).',
        zh: '追求成本最小化的企业会调整劳动与资本的投入比例，使花在每种要素上的「最后 1 美元带来的边际产量」完全相等（MPL/w = MPK/r）。',
        src: 'UNSW 标准学术英文 · Unit 6 Equilibria in Production'
      },
      {
        term: 'Short Run vs Long Run in Production（生产中的短期与长期）',
        en: 'The short run is a period in which at least one factor of production (typically capital/plant size) is fixed, whereas in the long run ALL factors of production are variable.',
        zh: '短期指至少有一种生产要素（通常是厂房机器规模）固定不变的时期；长期指所有生产要素均可自由调整的时期。',
        src: 'UNSW 标准学术英文 · Unit 6'
      },
      {
        term: 'Productivity & Technological Efficiency（生产率与技术效率）',
        en: 'Allocative efficiency produces the mix of goods society values most (P = MC), while productive efficiency produces at the lowest possible average cost (minimum ATC) using the best available technology.',
        zh: '配置效率要求按社会最偏好的组合生产（P = MC），而生产效率要求采用最优技术以最低平均总成本（ATC 最低点）进行生产。',
        src: 'UNSW 标准学术英文 · Unit 6'
      }
    ],
    examQA: [
      {
        qEn: 'Explain the difference between Productive Efficiency and Allocative Efficiency.',
        qZh: '请区分生产效率（Productive Efficiency）与配置效率（Allocative Efficiency）。',
        tag: '核心对比 · 4 分',
        points: [
          {
            en: 'Productive efficiency is achieved when goods are produced at the lowest possible average total cost (minimum ATC, operating on the PPC with zero wasted resources).',
            zh: '生产效率关注「有没有把成本压到最低」——以最低平均总成本生产，位于 PPC 曲线上、零资源浪费。'
          },
          {
            en: 'Allocative efficiency is achieved when resources produce the exact combination of goods most valued by consumers, where Price equals Marginal Cost (P = MC).',
            zh: '配置效率关注「有没有生产消费者最想要的东西」——当价格等于边际成本（P = MC）时，社会总剩余最大化。'
          }
        ],
        keywords: ['minimum ATC', 'P = MC', 'maximises total surplus']
      },
      {
        qEn: 'How does the Distinction between Short Run and Long Run depend on resource flexibility rather than calendar time?',
        qZh: '为什么经济学中「短期」与「长期」的划分取决于要素能否变动，而不是具体的月数或年数？',
        tag: '高频概念 · 4 分',
        points: [
          {
            en: 'Short run means at least one input (such as factory capacity or lease) is fixed; long run means every input can be varied. A street food stall’s long run may be two weeks, whereas an airline or power plant’s long run may take five years.',
            zh: '短期指至少存在一项固定投入，长期指所有投入都能调整；因此街边咖啡摊的长期可能只需两周，而建发电厂或航空公司的长期可能需要五年。'
          }
        ],
        keywords: ['at least one fixed factor', 'all factors variable', 'varies by industry']
      }
    ]
  },

  /* ==================== TERM 2 (Macroeconomics Core + Sample Exam A/B) ==================== */
  'term2:1': {
    concepts: [
      {
        term: 'Five-Sector Circular Flow of Income（五部门国民收入循环模型）',
        en: 'In the five-sector circular flow model, Leakages (Savings S + Taxation T + Imports M) withdraw income from the economy, while Injections (Investment I + Government Spending G + Exports X) add to aggregate expenditure; equilibrium occurs when S + T + M = I + G + X.',
        zh: '五部门循环模型中，漏出项（储蓄 S + 税收 T + 进口 M）使资金流出循环，注入项（投资 I + 政府支出 G + 出口 X）把资金注入循环；当总漏出等于总注入（S+T+M = I+G+X）时宏观经济均衡。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 0–1'
      },
      {
        term: 'Gross Domestic Product (GDP) & Expenditure Approach（国内生产总值）',
        en: 'GDP is the total market value of all final goods and services produced within a country’s borders in a given period, measured via the expenditure approach as GDP = C + I + G + (X − M).',
        zh: 'GDP 是一国境内在一定时期内生产的全部最终商品和服务的市场总价值，支出法公式为 GDP = 消费 C + 投资 I + 政府支出 G + 净出口 (X − M)。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 1'
      },
      {
        term: 'Nominal GDP vs Real GDP（名义 GDP 与实际 GDP）',
        en: 'Nominal GDP values output at current-year prices (including price inflation), whereas Real GDP adjusts for inflation using base-year constant prices to measure true changes in physical output.',
        zh: '名义 GDP 按当年现价计算（掺杂了物价上涨水分），而实际 GDP 用基期不变价剔除通胀影响，才能真实衡量产出增长。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 1'
      },
      {
        term: 'Limitations of GDP as a Measure of Living Standards（GDP 衡量福祉的局限）',
        en: 'GDP per capita omits non-market production (household work), the underground economy, income distribution inequality, leisure time, and environmental degradation.',
        zh: '人均 GDP 无法反映家务等非市场劳动、地下经济、贫富差距、闲暇时间价值以及经济增长带来的环境破坏。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 1 必考'
      }
    ],
    examQA: [
      {
        qEn: 'Use the five-sector Circular Flow model to explain the impact of higher interest rates on the level of economic activity. (Adapted from UNSW Sample Exam B Q21b)',
        qZh: '请用五部门循环流量模型解释「利率上升」对宏观经济活动水平的影响。（源自 UNSW Term 2 样卷 B 真题）',
        tag: '真题原题 · 5 分',
        points: [
          {
            en: 'Higher interest rates increase the reward for saving (Leakage S rises) and raise borrowing costs for firms and households (Injection I falls, and Consumption C drops).',
            zh: '利率上升提高储蓄回报（漏出项 S 上升），同时提高企业和家庭借贷成本（注入项投资 I 下降，消费 C 萎缩）。'
          },
          {
            en: 'Higher domestic rates may also attract foreign capital, appreciating the exchange rate and lowering net exports (X falls, M rises).',
            zh: '高利率还会吸引外资推高汇率，抑制出口 X、刺激进口 M，使漏出进一步大于注入。'
          },
          {
            en: 'Because Total Leakages (S+T+M) now exceed Total Injections (I+G+X), the circular flow contracts: output, income and employment fall until a new lower equilibrium is reached.',
            zh: '由于总漏出 > 总注入，国民收入循环收缩，产出、收入和就业下降，直至在更低水平重新平衡。'
          }
        ],
        keywords: ['S rises / I falls', 'Leakages > Injections', 'circular flow contracts', 'lower equilibrium GDP']
      },
      {
        qEn: 'Why do economists use Real GDP per capita rather than Nominal GDP to compare living standards over time, and what are three major limitations of Real GDP per capita?',
        qZh: '为什么经济学家用「人均实际 GDP」而不是「名义 GDP」来比较不同时期的生活水平？它仍有哪三大局限？',
        tag: '必考大题 · 6 分',
        points: [
          {
            en: 'Real GDP removes the distortion of price inflation, and dividing by population accounts for population growth, measuring actual goods and services available per person.',
            zh: '实际 GDP 剔除了物价通胀水分，除以人口则剔除了人口增长影响，反映人均真实可享用的商品服务量。'
          },
          {
            en: 'Three limitations: (1) Ignores income inequality (average rises while poor may not benefit); (2) Excludes unpaid non-market work and leisure; (3) Fails to deduct environmental pollution and resource depletion.',
            zh: '三大局限：①忽视收入分配不均；②遗漏家务/志愿服务与闲暇质量；③未扣除环境污染与资源枯竭代价。'
          }
        ],
        keywords: ['removes inflation & population growth', 'inequality', 'non-market work', 'environmental costs']
      },
      {
        qEn: 'Explain why intermediate goods and second-hand sales are excluded from GDP.',
        qZh: '为什么中间产品（如面粉厂卖给面包房的面粉）和二手商品交易不能计入当年 GDP？',
        tag: '高频概念 · 4 分',
        points: [
          {
            en: 'Intermediate goods are excluded to avoid DOUBLE COUNTING because their value is already embedded in the final retail price of the finished bread.',
            zh: '剔除中间产品是为了避免「重复计算（Double Counting）」，因为面粉的价值已经包含在最终成品面包的售价里。'
          },
          {
            en: 'Second-hand sales merely transfer ownership of an item produced in a previous year and represent no new current production.',
            zh: '二手商品早在生产当年已计入过 GDP，再次转手只是所有权转移，没有创造当年新产出。'
          }
        ],
        keywords: ['avoid double counting', 'no new current production']
      }
    ]
  },

  'term2:2': {
    concepts: [
      {
        term: 'Inflation & Consumer Price Index (CPI)（通货膨胀与 CPI）',
        en: 'Inflation is a sustained increase in the general price level over time, measured by the percentage change in the Consumer Price Index (CPI), which tracks a weighted basket of typical household goods and services.',
        zh: '通货膨胀是指一般物价水平的持续普遍上涨，通常以跟踪典型家庭一篮子商品服务价格变化的消费者物价指数（CPI）涨幅衡量（RBA 目标区间为 2%–3%）。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 2 Inflation'
      },
      {
        term: 'Demand-Pull vs Cost-Push Inflation（需求拉动型与成本推动型通胀）',
        en: 'Demand-pull inflation occurs when Aggregate Demand grows faster than the economy’s productive capacity ("too much money chasing too few goods", AD shifts right); cost-push inflation occurs when rising production costs (wages, oil, raw materials) shift Aggregate Supply left.',
        zh: '需求拉动型通胀源于总需求增速超过产能上限（AD 右移，过多货币追逐过少商品）；成本推动型通胀源于工资、油价或原料涨价推高生产成本（AS 左移，易引发滞胀）。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 2'
      },
      {
        term: 'Economic Costs of High Inflation（高通胀的五大危害）',
        en: 'High inflation erodes purchasing power (hurting fixed-income earners), redistributes wealth from lenders to borrowers, reduces international export competitiveness, creates menu/shoe-leather costs, and distorts investment decisions.',
        zh: '高通胀侵蚀货币购买力（打击固定收入者和退休群体）、把财富从债权人转移给债务人、削弱本国出口竞争力、增加菜单成本并扭曲企业长期投资预期。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 2'
      }
    ],
    examQA: [
      {
        qEn: 'Distinguish between Demand-Pull Inflation and Cost-Push Inflation using AD-AS reasoning, and explain why Cost-Push Inflation is harder for policymakers to solve.',
        qZh: '请结合 AD-AS 模型区分需求拉动型通胀与成本推动型通胀，并解释为什么成本推动型通胀更难治理？',
        tag: '宏观核心大题 · 6 分',
        points: [
          {
            en: 'Demand-pull inflation is caused by AD shifting right near full employment, raising BOTH price level and real GDP; tightening monetary/fiscal policy cools AD and reduces inflation.',
            zh: '需求拉动型通胀由 AD 右移引起，物价与产出同升；政策只需加息或紧缩财政给需求降温即可见效。'
          },
          {
            en: 'Cost-push inflation is caused by AS shifting left (e.g. an oil shock), causing STAGFLATION — rising prices TOGETHER WITH falling GDP and rising unemployment.',
            zh: '成本推动型通胀由 AS 左移引起（如油价暴涨），导致「滞胀（Stagflation）」——物价上涨与经济萎缩、失业攀升同时爆发。'
          },
          {
            en: 'Policymakers face a painful dilemma: tightening AD to fight inflation worsens unemployment, while stimulating AD to cut unemployment fuels even higher inflation.',
            zh: '政府陷入两难：紧缩需求压通胀会加剧失业，刺激需求救就业又会火上浇油推高通胀。'
          }
        ],
        keywords: ['AD right vs AS left', 'Stagflation', 'policy dilemma (inflation vs unemployment)']
      },
      {
        qEn: 'Explain who gains and who loses during a period of unexpectedly high inflation.',
        qZh: '在出乎意料的高通胀时期，社会中哪些群体受损、哪些群体反而受益？',
        tag: '必考简答 · 5 分',
        points: [
          {
            en: 'Losers: Fixed-income earners (pensioners), savers holding cash deposits, lenders receiving fixed-interest repayments (repaid in dollars with lower purchasing power), and exporters losing price competitiveness.',
            zh: '受损者：领固定收入/养老金人群、现金储户、固定利率放贷债权人（收回的钱购买力贬值）以及出口企业。'
          },
          {
            en: 'Gainers: Borrowers with fixed-rate loans (real burden of debt shrinks) and owners of real assets (property, commodities) whose values rise with inflation.',
            zh: '受益者：背负固定利率贷款的债务人（实际还债负担变轻）以及持有房产、大宗商品等实物资产者。'
          }
        ],
        keywords: ['erodes purchasing power', 'fixed-income earners & lenders lose', 'fixed-rate borrowers gain']
      },
      {
        qEn: 'Calculate the annual inflation rate if CPI rises from 120.0 in Year 1 to 127.2 in Year 2, and explain the difference between Headline CPI and Underlying (Core) Inflation.',
        qZh: '若 CPI 从第 1 年的 120.0 升至第 2 年的 127.2，请计算通胀率，并区分总体通胀（Headline）与核心通胀（Underlying）。',
        tag: '计算+概念 · 4 分',
        points: [
          {
            en: 'Inflation Rate = (127.2 − 120.0) ÷ 120.0 × 100% = 6.0%.',
            zh: '通胀率 = (127.2 − 120.0) ÷ 120.0 × 100% = 6.0%。'
          },
          {
            en: 'Headline CPI includes all items in the basket, whereas Underlying (Core) Inflation strips out volatile/temporary price swings (such as fuel and fresh food) to reveal persistent inflation trends for RBA policy.',
            zh: '总体 CPI 包含一篮子全部商品，而核心通胀剔除受天气/国际冲击波动极大的生鲜蔬果与油价，更准确反映央行关心的持久通胀趋势。'
          }
        ],
        keywords: ['(CPI2 - CPI1)/CPI1 × 100%', 'strips out volatile items', 'RBA policy guide']
      }
    ]
  },

  'term2:3': {
    concepts: [
      {
        term: 'Labour Force & Unemployment Rate Formulas（劳动力与失业率计算）',
        en: 'The Labour Force equals Employed plus Unemployed (actively seeking work); Unemployment Rate = (Unemployed ÷ Labour Force) × 100%, and Participation Rate = (Labour Force ÷ Working-Age Population) × 100%.',
        zh: '劳动力 = 就业人口 + 正在积极找工作的失业人口；失业率 = 失业人数 ÷ 劳动力 × 100%；劳动参与率 = 劳动力 ÷ 适龄工作人口 × 100%。',
        src: '课件与真题核验 · Sample Exam B Q1'
      },
      {
        term: 'Frictional, Structural & Cyclical Unemployment（三大核心失业类型）',
        en: 'Frictional unemployment is short-term transition between jobs; structural unemployment stems from a mismatch of skills or location caused by technological/industrial change; cyclical unemployment results from insufficient Aggregate Demand during an economic downturn.',
        zh: '摩擦性失业是换工作间隙的短期过渡；结构性失业源于技术革新或产业转型导致的技能/地区错配；周期性失业源于经济衰退期总需求不足。',
        src: '真题原题考点 · Sample Exam B Q21a'
      },
      {
        term: 'Natural Rate of Unemployment & Full Employment（自然失业率与充分就业）',
        en: 'Full employment does NOT mean 0% unemployment; it occurs when cyclical unemployment is zero and only frictional and structural unemployment remain (the Natural Rate / NAIRU, around 4–4.5% in Australia).',
        zh: '充分就业绝不等于 0% 失业率，而是指「周期性失业为零」，仅剩摩擦性与结构性失业时的自然失业率水平（澳洲约 4%–4.5%）。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 3'
      },
      {
        term: 'Hidden Unemployment & Underemployment（隐性失业与就业不足）',
        en: 'Official unemployment statistics understate true labour underutilisation because they omit discouraged workers who stopped searching (hidden unemployed) and count part-time workers wanting more hours as fully employed (underemployed).',
        zh: '官方失业率往往低估真实闲置劳动力，因为它排除了灰心放弃求职的「隐性失业者」，且把想干全职却只能每周干几小时的「就业不足者」算作了已就业。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 3'
      }
    ],
    examQA: [
      {
        qEn: 'Explain the difference between Cyclical Unemployment and Structural Unemployment, and state what type of government policy is needed to reduce each. (UNSW Sample Exam B Q21a)',
        qZh: '请解释周期性失业与结构性失业的区别，并说明分别需要哪种政府政策来治理。（UNSW Term 2 样卷 B 原题）',
        tag: '真题原题 · 5 分',
        points: [
          {
            en: 'Cyclical unemployment is caused by a fall in Aggregate Demand during an economic recession, leading firms across industries to lay off workers.',
            zh: '周期性失业源于经济下行期的总需求（AD）不足，企业订单萎缩而普遍裁员。'
          },
          {
            en: 'Structural unemployment arises from a long-term mismatch between workers’ skills/locations and available jobs due to automation, globalisation or declining industries.',
            zh: '结构性失业源于自动化、产业升级或外迁导致的劳动力技能/地域与新岗位长期错配。'
          },
          {
            en: 'Cyclical unemployment is reduced via expansionary macroeconomic policy (lower interest rates / fiscal stimulus to boost AD), whereas structural unemployment requires microeconomic supply-side policies (retraining, education and relocation subsidies).',
            zh: '对策完全不同：周期性失业靠扩张性货币/财政政策拉动总需求；结构性失业必须靠职业再培训、教育升级和跨区流动补贴等供给侧政策解决。'
          }
        ],
        keywords: ['insufficient AD vs skills mismatch', 'expansionary demand policy', 'retraining / supply-side policy']
      },
      {
        qEn: 'Why does Full Employment NOT mean an unemployment rate of 0%?',
        qZh: '为什么经济学上的「充分就业（Full Employment）」不意味着失业率为 0%？',
        tag: '必考概念 · 4 分',
        points: [
          {
            en: 'In any dynamic economy, some workers are always voluntarily switching jobs or newly graduating (frictional unemployment), while technological change continuously reshapes required skills (structural unemployment).',
            zh: '任何充满活力的经济体里，总有人正在跳槽或刚毕业求职（摩擦性失业），也总伴随技术替代（结构性失业）。'
          },
          {
            en: 'Full employment means Cyclical Unemployment = 0%; trying to force unemployment below the Natural Rate (NAIRU) triggers accelerating wage and price inflation.',
            zh: '充分就业指周期性失业清零；若强行把失业率压到自然失业率以下，会引发劳动力极度短缺和恶性通胀。'
          }
        ],
        keywords: ['frictional + structural always exist', 'Cyclical = 0', 'accelerating inflation below NAIRU']
      },
      {
        qEn: 'Using Sample Exam B data (Working-age population 15m, Full-time 6m, Part-time 3m, Unemployed 1m), calculate the Labour Force, Unemployment Rate and Participation Rate.',
        qZh: '按样卷 B 数据（适龄人口 1500 万，全职 600 万，兼职 300 万，失业 100 万），计算劳动力总量、失业率与参与率。',
        tag: '真题必考计算 · 4 分',
        points: [
          {
            en: 'Employed = 6m + 3m = 9m; Labour Force = Employed (9m) + Unemployed (1m) = 10 million.',
            zh: '就业人数 = 6 + 3 = 900 万；劳动力 = 900 万 + 100 万 = 1,000 万。'
          },
          {
            en: 'Unemployment Rate = (1m ÷ 10m) × 100% = 10.0%; Participation Rate = (10m ÷ 15m) × 100% = 66.7%.',
            zh: '失业率 = 1 ÷ 10 = 10.0%；劳动参与率 = 10 ÷ 15 = 66.7%。'
          }
        ],
        keywords: ['LF = 10m', 'UR = 10%', 'PR = 66.7%']
      }
    ]
  },

  'term2:4': {
    concepts: [
      {
        term: 'Aggregate Demand (AD = C + I + G + X − M)（总需求曲线）',
        en: 'Aggregate Demand shows the total quantity of domestic goods and services demanded at each general price level; it slopes downward due to the wealth effect, interest-rate effect and international trade effect.',
        zh: '总需求曲线表示不同一般物价水平下国内商品与服务的总需求量；因财富效应、利率效应与国际贸易效应而向右下方倾斜。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 4 AD-AS'
      },
      {
        term: 'Short-Run vs Long-Run Aggregate Supply (SRAS vs LRAS)（短期与长期总供给）',
        en: 'SRAS slopes upward because input wages are sticky in the short run; LRAS is vertical at Full-Employment GDP (potential output), determined solely by resource quantity, quality and technology.',
        zh: '短期总供给曲线（SRAS）因名义工资具有粘性而向右上方倾斜；长期总供给曲线（LRAS）垂直于充分就业潜在 GDP，仅由要素数量、质量与技术水平决定。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 4'
      },
      {
        term: 'Inflationary Gap vs Deflationary (Recessionary) Gap（通胀缺口与紧缩缺口）',
        en: 'When actual equilibrium GDP falls below potential GDP (Y < Yf), a recessionary gap exists with cyclical unemployment; when AD pushes output above potential capacity, an inflationary gap fuels rapid price increases.',
        zh: '当实际均衡产出低于潜在充分就业 GDP 时出现紧缩/衰退缺口（伴随周期性失业）；当总需求过度旺盛超过潜在产能时出现通胀缺口（物价飙升）。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 4'
      }
    ],
    examQA: [
      {
        qEn: 'Use an AD-AS diagram to explain the macroeconomic effects of a sharp rise in global oil prices on Real GDP, Price Level and Unemployment. (UNSW Sample Exam A Q21b style)',
        qZh: '请用 AD-AS 模型解释国际油价飙升对实际 GDP、一般物价水平和失业率的宏观影响。（对标 UNSW 样卷 A 真题）',
        tag: '真题必考作图 · 6 分',
        points: [
          {
            en: 'Oil is a key production and transport input across almost all industries; a sharp oil price surge raises business production costs, shifting SRAS to the LEFT from SRAS1 to SRAS2.',
            zh: '石油是各行业核心能源与物流成本，油价暴涨推高生产成本，使短期总供给曲线 SRAS 向左上方移动。'
          },
          {
            en: 'The new equilibrium occurs at a HIGHER general price level (cost-push inflation) and a LOWER Real GDP (economic contraction), causing cyclical unemployment to rise — a state known as Stagflation.',
            zh: '新均衡落在更高的物价水平（成本推动型通胀）和更低的实际 GDP（产出萎缩），伴随周期性失业上升，即陷入「滞胀」。'
          }
        ],
        keywords: ['SRAS shifts left', 'higher Price Level', 'lower Real GDP / higher unemployment', 'Stagflation']
      },
      {
        qEn: 'Explain three reasons why the Aggregate Demand (AD) curve slopes downward from left to right.',
        qZh: '请解释总需求曲线（AD）向右下方倾斜的三个经济学原因（注意不要和单个商品需求混淆！）。',
        tag: '高频易错 · 5 分',
        points: [
          {
            en: '1) Wealth Effect: A lower price level raises the real purchasing power of households’ cash and financial wealth, encouraging higher Consumption (C).',
            zh: '1）财富效应：物价下降提升居民货币资产的实际购买力，刺激消费 C 增加。'
          },
          {
            en: '2) Interest-Rate Effect: Lower prices reduce money demand for transactions, lowering interest rates and stimulating business Investment (I).',
            zh: '2）利率效应：物价下降减少交易性货币需求，利率走低刺激企业投资 I 与大件消费。'
          },
          {
            en: '3) International Trade Effect: Lower domestic prices make exports cheaper for foreigners and imports relatively dearer, boosting Net Exports (X − M).',
            zh: '3）国际贸易效应：国内物价走低提升出口价格竞争力，推动净出口（X − M）上升。'
          }
        ],
        keywords: ['Wealth effect (C)', 'Interest-rate effect (I)', 'International trade effect (X-M)']
      }
    ]
  },

  'term2:5': {
    concepts: [
      {
        term: 'Comparative Advantage & Gains from Trade（比较优势与贸易红利）',
        en: 'According to the law of comparative advantage, countries gain by specialising in goods they produce at a lower opportunity cost and trading for other goods, allowing consumption beyond their domestic PPC.',
        zh: '比较优势原理指出，各国应专业化生产「机会成本更低」的商品并进行自由贸易，从而突破本国 PPC 边界、提升双方总体消费水平。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 5 Trade & Protection'
      },
      {
        term: 'Protectionism: Tariffs, Quotas & Subsidies（贸易保护三大工具）',
        en: 'A tariff is a tax on imported goods that raises domestic price and collects government revenue; a quota limits the physical quantity imported; a subsidy lowers domestic producers’ costs to help them compete against imports.',
        zh: '关税是对进口品征税（抬高国内价格并增加政府税收）；配额直接限制进口实物数量；补贴则是政府发钱降低本国企业成本以抵御进口竞争。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 5'
      },
      {
        term: 'Terms of Trade (TOT)（贸易条件）',
        en: 'The Terms of Trade index equals (Export Price Index ÷ Import Price Index) × 100; an improvement in TOT means a country can purchase more imports with the same volume of exports.',
        zh: '贸易条件指数 = (出口价格指数 ÷ 进口价格指数) × 100；贸易条件改善意味着出口同样数量的商品能换回更多进口商品。',
        src: '真题核验 · Sample Exam A Q8'
      }
    ],
    examQA: [
      {
        qEn: 'Evaluate the economic effects of imposing a Tariff on imported cars on domestic consumers, domestic producers, the government and overall allocative efficiency.',
        qZh: '请评估对进口汽车征收「关税（Tariff）」对本国消费者、本国车企、政府以及整体资源配置效率的影响。',
        tag: '国际贸易必考大题 · 6 分',
        points: [
          {
            en: 'Domestic price rises from Pw to Pw + Tariff: domestic producers expand output and gain producer surplus, and the government collects tariff revenue (Tariff × remaining imports).',
            zh: '国内车价从世界价 Pw 升至 Pw+关税：本国车企产量与利润增加，政府获得关税财政收入。'
          },
          {
            en: 'However, domestic consumers suffer higher prices and reduced consumption (large loss of consumer surplus), and inefficient local production replaces cheaper imports, creating a net Deadweight Loss.',
            zh: '但本国消费者承担更高车价与更少选择（消费者剩余大幅流失），低效本土产能替代了廉价进口品，全社会产生净无谓损失（DWL）。'
          }
        ],
        keywords: ['higher domestic price', 'producer surplus & tariff revenue rise', 'consumer surplus falls', 'Deadweight Loss']
      },
      {
        qEn: 'Outline three arguments commonly used to justify Trade Protection, and briefly evaluate one weakness of protectionism.',
        qZh: '请列举支持贸易保护的三个常见理由，并简要评析贸易保护的一项缺陷。',
        tag: '高频论述 · 5 分',
        points: [
          {
            en: 'Common arguments: (1) Infant Industry argument (shielding new domestic industries until they gain economies of scale); (2) Protecting domestic employment in the short run; (3) Preventing dumping and safeguarding national defence/strategic industries.',
            zh: '三大常见理由：①保护幼稚产业直至形成规模经济；②短期保护本国就业；③反倾销及保障国防/战略产业安全。'
          },
          {
            en: 'Weakness: Protectionism often breeds complacency (reducing incentive to innovate), raises living costs for consumers, and invites retaliatory tariffs from trading partners.',
            zh: '缺陷：长期保护会滋生企业惰性、抬高消费者生活成本，并容易引发贸易伙伴的报复性关税战。'
          }
        ],
        keywords: ['Infant Industry', 'protecting jobs / anti-dumping', 'retaliation & inefficiency']
      }
    ]
  },

  'term2:6': {
    concepts: [
      {
        term: 'Floating Exchange Rate: Appreciation vs Depreciation（浮动汇率：升值与贬值）',
        en: 'Under a floating exchange rate, the value of the Australian dollar ($A) is determined by demand and supply in the foreign exchange market: an appreciation means $A buys more foreign currency, while a depreciation means $A buys less.',
        zh: '浮动汇率下，澳元汇率由外汇市场的供求决定：升值（Appreciation）指 1 澳元能换更多外币，贬值（Depreciation）指 1 澳元换到的外币变少。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 6 Exchange Rates'
      },
      {
        term: 'Determinants of Demand & Supply for $A（决定澳元供求的因素）',
        en: 'Demand for $A rises when foreign demand for Australian exports (iron ore, tourism, education) increases or when Australian interest rates rise relative to overseas (attracting capital inflow); supply of $A rises when Australians buy more imports or invest abroad.',
        zh: '外国买澳洲出口品（铁矿石、旅游、留学）或澳洲相对利率上升吸引外资流入，会增加澳元需求推动升值；澳洲居民多买进口货或海外投资，会增加澳元供给压低汇率。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 6'
      },
      {
        term: 'Macroeconomic Effects of Currency Depreciation（汇率贬值的双刃剑效应）',
        en: 'A depreciation of $A makes Australian exports cheaper abroad (boosting X) and imports dearer domestically (reducing M), stimulating AD and employment, but also raises imported input prices (imported inflation) and foreign-currency debt repayments.',
        zh: '澳元贬值使澳洲出口变便宜（刺激 X）、进口变贵（抑制 M），拉动总需求与就业；但同时抬高进口原料与消费品价格（输入型通胀）并加重外币债务偿还负担。',
        src: '真题原题考点 · Sample Exam A Q21a'
      }
    ],
    examQA: [
      {
        qEn: 'Explain the effects of a substantial depreciation of the Australian dollar ($A) on different sectors of the Australian economy. (UNSW Sample Exam A Q21a)',
        qZh: '请解释澳元大幅贬值对澳大利亚经济中不同部门产生的多方面影响。（UNSW Term 2 样卷 A 真题原题）',
        tag: '真题原题 · 5 分',
        points: [
          {
            en: 'Exporters & Tourism/Education sector GAIN: Australian goods, mining exports and university tuition become cheaper in foreign currency terms, increasing export volumes and farm/mining incomes.',
            zh: '出口商、旅游与国际教育部门受益：以外币计价的澳洲商品、矿产与学费变便宜，海外需求大增。'
          },
          {
            en: 'Import-competing domestic firms GAIN because foreign rivals become more expensive, shifting local buyers back toward Australian-made substitutes.',
            zh: '本国进口替代企业受益：进口货涨价促使本土消费者转买澳洲本地产品。'
          },
          {
            en: 'Consumers, Importers & Overseas Travellers LOSE: Imported fuel, electronics and foreign holidays cost more, creating upward pressure on CPI (imported cost-push inflation) and increasing the $A burden of foreign-currency debt.',
            zh: '消费者、进口商与出境游客受损：进口油价、电子产品和出国旅游变贵，推高国内输入型通胀，且以外币计价的外债还本付息压力加大。'
          }
        ],
        keywords: ['exporters gain', 'import-competing firms gain', 'imported inflation', 'consumers & foreign-debt borrowers lose']
      },
      {
        qEn: 'Explain how a rise in Australian interest rates relative to US interest rates affects the $A exchange rate.',
        qZh: '请解释澳大利亚利率相对美国利率上升会如何影响澳元汇率？',
        tag: '外汇作图必考 · 4 分',
        points: [
          {
            en: 'Higher relative Australian interest rates offer better returns on Australian financial assets, attracting foreign capital inflows → Demand for $A shifts RIGHT.',
            zh: '澳洲相对利率走高提升澳元资产回报，吸引海外热钱涌入 → 外汇市场上对澳元的需求曲线右移。'
          },
          {
            en: 'Simultaneously, Australian investors keep more funds domestically rather than investing abroad → Supply of $A shifts LEFT. Together, these cause the $A to APPRECIATE.',
            zh: '同时本土资金更愿意留在国内减少外流 → 澳元供给曲线左移；合力推动澳元明显升值。'
          }
        ],
        keywords: ['capital inflow', 'Demand for $A shifts right', 'Supply shifts left', '$A appreciates']
      }
    ]
  },

  'term2:7': {
    concepts: [
      {
        term: 'Macroeconomic Policy Objectives & Trade-offs（宏观四大目标与权衡）',
        en: 'Governments and central banks pursue four core goals: sustainable Real GDP growth (~3%), low and stable inflation (2–3% CPI), full employment (~4–4.5% unemployment), and external stability — though booming growth often clashes with low inflation.',
        zh: '宏观调控追求四大目标：可持续实际 GDP 增长、温和稳定通胀（2%–3%）、充分就业以及外部平衡——但高增长低失业往往与控通胀存在天然权衡。',
        src: 'UNSW 标准学术英文 · Term 2 期中复盘'
      },
      {
        term: 'Linking Circular Flow, AD-AS and External Sector（三大宏观模型联动）',
        en: 'Changes in interest rates, taxes or exchange rates can be traced simultaneously through Circular Flow (Leakages vs Injections) and AD-AS (shifts in AD or SRAS) to predict GDP, CPI and unemployment.',
        zh: '利率、税率或汇率变动可同时通过「循环流量（漏出 vs 注入）」与「AD-AS 曲线移动」双重视角串联推导，精准预判 GDP、物价与失业走势。',
        src: 'UNSW 标准学术英文 · 期中复习'
      }
    ],
    examQA: [
      {
        qEn: 'Explain the short-run trade-off between Inflation and Unemployment (the Phillips Curve relationship).',
        qZh: '请解释短期内通货膨胀与失业率之间的权衡替代关系（菲利普斯曲线逻辑）。',
        tag: '宏观高频 · 5 分',
        points: [
          {
            en: 'When Aggregate Demand expands rapidly, firms hire more workers to meet orders, pushing unemployment DOWN, but tighter labour markets bid up wages and prices, pushing demand-pull inflation UP.',
            zh: '总需求强劲扩张时，企业扩大招工把失业率压低，但劳动力趋紧会推高工资与售价，引发需求拉动型通胀抬头。'
          },
          {
            en: 'Conversely, tightening policy to cool inflation slows spending and raises cyclical unemployment in the short run.',
            zh: '反之，紧缩政策给通胀降温时，短期内往往会以经济放缓和周期性失业上升为代价。'
          }
        ],
        keywords: ['inverse short-run trade-off', 'tighter labour market -> wage pressure', 'demand-pull inflation vs cyclical unemployment']
      }
    ]
  },

  'term2:8': {
    concepts: [
      {
        term: 'Functions of Money & Financial Intermediaries（货币职能与金融中介）',
        en: 'Money serves four functions: medium of exchange, unit of account, store of value, and standard of deferred payment; banks and financial intermediaries channel funds from savers (surplus units) to borrowers (deficit units).',
        zh: '货币具备四大职能：交易媒介、计价单位、价值储藏和延期支付标准；银行等金融中介负责把储蓄者（盈余方）的资金高效融通给借款者（赤字方）。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 7 Financial Sector'
      },
      {
        term: 'Credit Creation & Money Supply（商业银行信用创造机制）',
        en: 'Through fractional-reserve banking, commercial banks keep only a fraction of deposits as liquid reserves and lend out the rest; each new loan is redeposited elsewhere, multiplying the overall money supply.',
        zh: '在部分准备金制度下，商业银行只需留存一小部分存款作备付金，其余放贷出去；贷款花出后又变成其他银行的新存款循环放贷，从而成倍创造广义货币供给。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 7'
      },
      {
        term: 'Role of the Reserve Bank of Australia (RBA)（澳联储核心职责）',
        en: 'The RBA is Australia’s central bank responsible for issuing currency, maintaining financial system stability, managing foreign reserves, and conducting Monetary Policy to target 2–3% inflation.',
        zh: '澳联储（RBA）是澳大利亚中央银行，负责发行货币、维护金融体系稳定、管理外汇储备，并通过货币政策把通胀稳定在 2%–3% 目标区间。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 7'
      }
    ],
    examQA: [
      {
        qEn: 'Explain how commercial banks create credit (expand the money supply) and identify two factors that limit credit creation.',
        qZh: '请解释商业银行如何通过放贷「创造信用（扩大货币供给）」，并指出限制这一过程的两个因素。',
        tag: '金融部门必考 · 5 分',
        points: [
          {
            en: 'When a customer deposits $1,000, the bank keeps a prudent reserve (e.g. 10% = $100) and lends out $900; the borrower spends $900, which is deposited in another bank that keeps $90 and lends $810, continuing in a multiplier chain.',
            zh: '客户存 $1,000，银行留 10% 准备金（$100）后放贷 $900；借款人花掉后回流另一家银行再留 10% 放贷 $810，周而复始通过乘数效应扩大货币总量。'
          },
          {
            en: 'Credit creation is limited by: (1) higher reserve/prudential ratios held by banks; (2) cash leakages (people holding physical cash rather than redepositing); and (3) weak borrower demand during recessions.',
            zh: '限制因素：①银行提高准备金/审慎留存比例；②现金漏出（民众拿现钞不存回银行）；③经济低迷时企业和个人不愿借贷。'
          }
        ],
        keywords: ['fractional reserves', 'redepositing multiplier', 'cash leakage / higher reserves / weak loan demand']
      }
    ]
  },

  'term2:9': {
    concepts: [
      {
        term: 'Monetary Policy & the Cash Rate（货币政策与隔夜现金利率）',
        en: 'Monetary policy is conducted by the RBA by adjusting the target Cash Rate (the overnight interest rate on interbank loans) through Domestic Market Operations (buying/selling government securities) to influence Aggregate Demand.',
        zh: '货币政策由澳联储（RBA）通过公开市场操作（买卖政府债券）调节银行间拆借的「现金利率（Cash Rate）」，进而传导至全社会利率和总需求。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 8 Monetary Policy'
      },
      {
        term: 'Transmission Mechanism of Monetary Policy（货币政策五大传导渠道）',
        en: 'A cut in the Cash Rate lowers market interest rates, boosting AD through: (1) Savings/Investment channel (cheaper loans), (2) Cash-flow channel (lower mortgage repayments), (3) Asset-price/wealth effect, and (4) Exchange-rate channel ($A depreciates, boosting net exports).',
        zh: '降息通过四大渠道拉动总需求：①借贷与投资渠道（贷款变便宜）；②现金流渠道（房贷月供减少、可支配收入增加）；③资产价格财富效应；④汇率渠道（澳元贬值刺激净出口）。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 8 必考'
      },
      {
        term: 'Strengths & Limitations of Monetary Policy（货币政策优缺点）',
        en: 'Monetary policy enjoys a short implementation lag (RBA meets regularly) and political independence, but suffers from a long impact lag (6–18 months), blunt economy-wide effects, and limited effectiveness when business confidence is severely depressed ("pushing on a string").',
        zh: '优点是决策实施快（央行定期议息且政治独立）；局限是见效滞后长（6–18 个月）、属「一刀切」难以定向扶持特定行业，且在严重衰退信心极差时降息效果受限。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 8'
      }
    ],
    examQA: [
      {
        qEn: 'Trace the transmission mechanism explaining how a tightening of Monetary Policy (raising the Cash Rate) helps reduce Demand-Pull Inflation.',
        qZh: '请完整写出「紧缩性货币政策（加息）」压制需求拉动型通胀的传导机制链路。',
        tag: '期末必考核心大题 · 6 分',
        points: [
          {
            en: 'Step 1: RBA sells government securities in Domestic Market Operations, tightening liquidity and raising the target Cash Rate, which commercial banks pass on via higher mortgage and business loan rates.',
            zh: '第 1 步：RBA 卖出政府债券收紧流动性推高现金利率，商业银行随之提高房贷和企业贷款利率。'
          },
          {
            en: 'Step 2: Higher repayments shrink household disposable cash flow (Consumption C falls), costlier credit deters business projects (Investment I falls), and capital inflows appreciate the $A (Net Exports X − M fall).',
            zh: '第 2 步：房贷月供上升挤压消费 C，融资变贵抑制企业投资 I，外资流入推升澳元压低净出口（X − M）。'
          },
          {
            en: 'Step 3: Aggregate Demand shifts LEFT (AD1 → AD2), easing overheating demand pressures and lowering the rate of inflation toward the RBA’s 2–3% target band.',
            zh: '第 3 步：总需求 AD 左移，过热的需求压力降温，通胀回落至 2%–3% 目标区间。'
          }
        ],
        keywords: ['sell securities / raise Cash Rate', 'C, I and (X-M) fall', 'AD shifts left', '2-3% target']
      },
      {
        qEn: 'Why is Monetary Policy often described as "more effective at slowing an inflationary boom than at reviving a deep recession"?',
        qZh: '为什么人们常说货币政策「给过热通胀降温很管用，但救深度衰退却没那么灵」？',
        tag: '深度评析 · 5 分',
        points: [
          {
            en: 'Raising interest rates directly forces heavily indebted households and firms to cut spending immediately.',
            zh: '加息会立刻增加背负贷款家庭与企业的刚性利息支出，强制压缩消费投资，立竿见影。'
          },
          {
            en: 'In a severe recession, however, cutting interest rates makes credit cheap, yet pessimistic consumers and businesses may still refuse to borrow and invest ("you can lead a horse to water, but you cannot make it drink").',
            zh: '但在深度衰退期，即便降息把钱变便宜，极度悲观的居民和企业仍可能拒绝借钱消费或扩张投资，因此需配合财政政策直接兜底。'
          }
        ],
        keywords: ['asymmetric effectiveness', 'pessimistic confidence', 'need for Fiscal Policy']
      }
    ]
  },

  'term2:10': {
    concepts: [
      {
        term: 'Fiscal Policy & Budget Outcomes（财政政策与预算状态）',
        en: 'Fiscal policy uses Federal Government Spending (G) and Taxation (T) to influence Aggregate Demand and resource allocation: a Budget Deficit occurs when G > T (expansionary), a Surplus when T > G (contractionary), and a Balanced Budget when G = T.',
        zh: '财政政策由联邦政府通过调整政府支出（G）与税收（T）调控总需求：G > T 为预算赤字（扩张性），T > G 为预算盈余（紧缩性），G = T 为平衡预算。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 9 Fiscal Policy'
      },
      {
        term: 'Automatic Stabilisers vs Discretionary Fiscal Policy（自动稳定器与相机抉择）',
        en: 'Automatic stabilisers (progressive income tax and unemployment welfare benefits) adjust the budget automatically without new legislation as GDP fluctuates; discretionary fiscal policy involves deliberate new government policy announcements (e.g. infrastructure packages or tax cuts).',
        zh: '自动稳定器（累进个税与失业救济金）无需新立法即可随经济冷暖自动逆周期调节；相机抉择财政政策则是政府主动推出的新基建刺激或减税法案。',
        src: '真题核验 · Sample Exam A Q1'
      },
      {
        term: 'Cyclical vs Structural Budget Deficit（周期性与结构性预算赤字）',
        en: 'The cyclical component of a budget deficit is caused temporarily by an economic downturn (lower tax receipts, higher welfare payouts), whereas the structural component reflects deliberate policy settings even when the economy is at full employment.',
        zh: '周期性赤字由经济衰退自动引发（税少福利多），经济复苏会自动消失；结构性赤字则源于政府主动的长期开支与减税政策，即便充分就业也不会消失。',
        src: '真题原题考点 · Sample Exam A Q1'
      }
    ],
    examQA: [
      {
        qEn: 'Distinguish between Automatic Stabilisers and Discretionary Fiscal Policy, and explain how Automatic Stabilisers cushion an economic downturn.',
        qZh: '请区分「自动稳定器」与「相机抉择财政政策」，并说明自动稳定器如何在经济下行时发挥缓冲作用。',
        tag: '财政必考大题 · 6 分',
        points: [
          {
            en: 'Automatic stabilisers are built-in budget mechanisms (progressive taxes and welfare transfers) that respond immediately to changes in GDP without parliamentary approval.',
            zh: '自动稳定器是内嵌在税制与福利体系里的机制，经济一变动无需议会重新立法就自动生效。'
          },
          {
            en: 'During a recession, incomes fall so households drop into lower tax brackets (T falls) while newly unemployed workers receive welfare benefits (G rises), automatically widening the deficit and supporting Aggregate Demand.',
            zh: '经济衰退时，居民收入下滑自动少交税（T 降），失业增多自动领救济（G 升），无需政府下令就自动向扩张赤字倾斜、托底总需求。'
          },
          {
            en: 'Discretionary fiscal policy requires deliberate new budget decisions (e.g. building new railways or cutting company tax rates), which have a longer legislative lag but can be precisely targeted at vulnerable sectors.',
            zh: '相机抉择财政政策则需主动出台新基建或减税法案，立法实施较慢，但可以精准定向扶持受创行业。'
          }
        ],
        keywords: ['progressive tax & welfare', 'no new legislation', 'cushions AD drop', 'discretionary = deliberate']
      },
      {
        qEn: 'Compare the advantages and disadvantages of Fiscal Policy versus Monetary Policy when fighting a severe recession.',
        qZh: '在应对严重经济衰退时，请比较财政政策与货币政策各自的优缺点。',
        tag: '政策对比压轴题 · 6 分',
        points: [
          {
            en: 'Fiscal Policy advantage: Can directly inject spending (infrastructure, cash transfers) into specific hard-hit regions/households even when confidence is low; Disadvantage: Slow legislative process, political bias against cutting spending later, and rising public debt/crowding out.',
            zh: '财政优势：信心极差时能直接花钱搞基建或发补贴、精准定向；缺点：议会审批慢、受政治选票掣肘且推高公债。'
          },
          {
            en: 'Monetary Policy advantage: Implemented rapidly by an independent central bank without adding to public debt; Disadvantage: Long transmission lag and weak impact if firms refuse to borrow despite low rates.',
            zh: '货币优势：央行独立决策极快且不增加政府债务；缺点：传导见效慢，且严重悲观时降息刺激有限。'
          }
        ],
        keywords: ['direct & targeted', 'implementation lag vs impact lag', 'political independence', 'public debt']
      }
    ]
  },

  'term2:11': {
    concepts: [
      {
        term: 'Interpreting Macroeconomic Dashboard Tables（宏观统计数据表综合诊断）',
        en: 'Exam Section C data-response questions present a table of GDP growth, Inflation, Unemployment, Exports, Imports and Investment across two years — always diagnose the overall phase of the business cycle first (Boom/Overheating vs Recession/Slowdown).',
        zh: '期末 Section C 压轴 20 分大题会给出两年宏观数据表（GDP 增速、通胀、失业、进出口、投资），动笔前第一步永远是先定性经济处于「过热通胀期」还是「衰退高失业期」。',
        src: '真题原题结构 · Sample Exam A & B Section C (20 marks)'
      },
      {
        term: 'Internal Balance vs External Balance（内部平衡与外部平衡）',
        en: 'Internal balance combines full employment with low inflation (2–3%); external balance requires a sustainable Current Account / trade balance and stable exchange rate.',
        zh: '内部平衡指充分就业与低通胀并存，外部平衡指贸易/经常账户与汇率保持可持续稳定；经济过热往往同时恶化内部通胀与外部贸易逆差（进口激增）。',
        src: '真题原题考点 · Sample Exam A Section C'
      }
    ],
    examQA: [
      {
        qEn: 'Sample Exam A Section C Scenario: From Year A to Year B, GDP Growth jumps 5% → 8%, Inflation surges 4% → 9%, Unemployment drops 8% → 4.3%, and Net Exports worsen (X falls, M surges). Diagnose the economy and recommend an appropriate policy mix.',
        qZh: '样卷 A 压轴 20 分场景：GDP 增速从 5% 飙至 8%、通胀从 4% 飙至 9%、失业率从 8% 降至 4.3%、出口降进口暴增。请诊断经济病症并开出政策组合药方。',
        tag: '20 分压轴真题 · Section C',
        points: [
          {
            en: 'Diagnosis: The economy is severely OVERHEATING with an Inflationary Gap — booming Aggregate Demand has pushed unemployment to full employment (4.3%) while triggering rapid Demand-Pull Inflation (9%) and sucking in heavy imports (worsening trade deficit).',
            zh: '诊断：经济严重「过热」并出现通胀缺口——旺盛总需求虽把失业压至 4.3% 充分就业，却引爆 9% 的需求拉动型通胀并大幅拉高进口导致贸易恶化。'
          },
          {
            en: 'Recommended Policy Mix: Tightening (Contractionary) Monetary Policy (RBA raises Cash Rate to cool C and I) paired with Contractionary Fiscal Policy (moving toward a budget surplus by restraining G or allowing automatic stabilisers to collect higher taxes).',
            zh: '政策组合：双紧缩——央行加息抑制消费投资，同时联邦政府收紧财政走向盈余，合力把 AD 拉回可持续潜在产能，同时压制通胀与进口激增。'
          }
        ],
        keywords: ['overheating / inflationary gap', 'demand-pull inflation', 'contractionary Monetary + Fiscal mix']
      },
      {
        qEn: 'Sample Exam B Section C Scenario: Economic Growth collapses 3.5% → −1.0%, Unemployment rises 4.5% → 6.7%, Inflation plunges 4% → 0.5%. Diagnose the economy and recommend policy actions.',
        qZh: '样卷 B 压轴 20 分场景：经济增长从 3.5% 跌至 −1.0%、失业率从 4.5% 升至 6.7%、通胀跌至 0.5%。请诊断并提出宏观对策。',
        tag: '20 分压轴真题 · Section C',
        points: [
          {
            en: 'Diagnosis: The economy has entered a RECESSION (negative real GDP growth) with a Deflationary Gap, rising cyclical unemployment (6.7%) and near-deflation (0.5% CPI) driven by collapsing business investment and weak Aggregate Demand.',
            zh: '诊断：经济陷入衰退（负增长）并出现紧缩缺口，总需求低迷导致周期性失业攀升至 6.7%，物价接近通缩边缘。'
          },
          {
            en: 'Recommended Policy Mix: Expansionary Fiscal Policy (targeted infrastructure spending and income support to inject AD directly) supported by Expansionary Monetary Policy (RBA cuts Cash Rate to lower borrowing costs and depreciate $A to boost exports).',
            zh: '政策组合：双扩张——财政直接加码基建与补贴托底需求，央行同步降息减负并温和引导汇率贬值刺激出口。'
          }
        ],
        keywords: ['recession / deflationary gap', 'cyclical unemployment', 'expansionary Fiscal + Monetary mix']
      }
    ]
  },

  'term2:12': {
    concepts: [
      {
        term: 'Policy Mix & Coordination（宏观政策组合协调）',
        en: 'Effective macroeconomic management coordinates Monetary Policy, Fiscal Policy and Microeconomic (Supply-Side) Reforms so demand policies stabilise the business cycle while supply policies expand long-run productive capacity (LRAS right).',
        zh: '高水平宏观调控要求需求侧政策（货币+财政）熨平短期经济周期波动，同时配合供给侧微改（教育/基建/竞争改革）把长期总供给 LRAS 持续向右推升。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 11'
      },
      {
        term: 'Supply-Side / Microeconomic Reform（供给侧结构性改革）',
        en: 'Supply-side policies (such as education/training, deregulation, infrastructure investment and R&D incentives) shift AS rightward, achieving the rare win-win of higher Real GDP, lower unemployment AND lower inflation simultaneously.',
        zh: '供给侧改革（技能培训、基础设施、鼓励研发与打破垄断）直接推动总供给 AS 右移，能同时实现「增长↑、失业↓、通胀↓」的罕见三赢局面，但见效周期最长。',
        src: 'UNSW 标准学术英文 · Term 2 Unit 11'
      }
    ],
    examQA: [
      {
        qEn: 'Why can Supply-Side (Microeconomic) policies achieve economic growth WITHOUT causing Demand-Pull Inflation, unlike pure demand stimulus?',
        qZh: '为什么供给侧（微观）改革能够在不引发需求拉动型通胀的前提下实现经济增长，而单纯的需求刺激却容易推高物价？',
        tag: '宏观升华大题 · 5 分',
        points: [
          {
            en: 'Demand-side stimulus only shifts AD right; once the economy approaches full capacity, further AD increases mostly bid up prices rather than real output.',
            zh: '需求侧刺激只推 AD 右移；一旦逼近充分就业产能上限，继续刺激几乎全变成物价上涨。'
          },
          {
            en: 'Supply-side policies boost labour productivity, technology and competition, shifting AS and LRAS rightward — raising potential output while lowering unit production costs and easing price pressures.',
            zh: '供给侧改革提高劳动生产率与技术效率，把 AS 与 LRAS 整体右移，既扩大潜在产出又压低单位成本，实现低通胀高质量增长。'
          }
        ],
        keywords: ['shifts LRAS/SRAS right', 'raises productivity', 'non-inflationary growth']
      }
    ]
  },

  'term2:13': {
    concepts: [
      {
        term: 'UNSW Macroeconomics Final Exam Blueprint（期末三板块结构与拿分法则）',
        en: 'The 2-hour exam consists of Section A (20 MCQs, 20 marks), Section B (2 structured 10-mark questions requiring crisp diagrams and policy chains), and Section C (one 20-mark macroeconomic data-diagnosis essay).',
        zh: '2 小时期末卷分三块：Section A 20 道单选（20 分）、Section B 两道 10 分作图论述题、Section C 一道 20 分宏观数据诊断大题；作图题务必标齐坐标轴（P/Y 或 $A/Q）、曲线名与移动箭头。',
        src: '真题原卷结构 · Sample Exam A & B'
      }
    ],
    examQA: [
      {
        qEn: 'What four elements must every AD-AS or Foreign Exchange exam diagram include to avoid losing easy presentation marks?',
        qZh: '期末考场画 AD-AS 或外汇供求图时，哪四个要素必须画齐才不会白白丢掉图形分？',
        tag: '考场满分规范 · 4 分',
        points: [
          {
            en: '1) Correctly labelled axes (General Price Level & Real GDP for AD-AS; Exchange Rate USD/$A & Quantity of $A for FX); 2) Clearly labelled original and shifted curves (AD1 → AD2) with directional arrows; 3) Marked initial and new equilibrium coordinates (P1, Y1 → P2, Y2); 4) A brief written link referring directly to the diagram labels.',
            zh: '①坐标轴名称准确（AD-AS 写 General Price Level 与 Real GDP，别写成单个商品 P/Q！）；②标清初始与移动后曲线名加箭头；③标出新旧均衡点虚线坐标；④正文明确引用图上的 P1/Y1→P2/Y2 展开推导。'
          }
        ],
        keywords: ['correct axis labels', 'directional shift arrows', 'equilibrium coordinates', 'text references diagram']
      }
    ]
  },

  /* ==================== TERM 1X (Supplementary Micro Units 5–11) ==================== */
  'term1x:5': {
    concepts: [
      {
        term: 'Price Elasticity of Demand (PED)（需求价格弹性）',
        en: 'Price Elasticity of Demand measures the responsiveness of quantity demanded to a change in price: PED = %ΔQd ÷ %ΔP. Demand is elastic if |PED| > 1, inelastic if |PED| < 1, and unit elastic if |PED| = 1.',
        zh: '需求价格弹性衡量需求量对价格变动的敏感程度（PED = %ΔQd ÷ %ΔP）：绝对值大于 1 为富有弹性（敏感），小于 1 为缺乏弹性（不敏感），等于 1 为单位弹性。',
        src: 'UNSW 标准学术英文 · Unit 5 Elasticity'
      },
      {
        term: 'Determinants of PED & Total Revenue Test（决定因素与总收益检验）',
        en: 'Demand is more elastic when close substitutes exist, the good is a luxury, it takes a large share of income, or the time horizon is longer. Cutting price raises Total Revenue (P × Q) when demand is elastic, whereas raising price increases TR when demand is inelastic.',
        zh: '替代品越多、越偏奢侈品、占收入比重越大、调整时间越长，弹性越大。富有弹性时「降价增收（薄利多销）」，缺乏弹性时「涨价增收」。',
        src: 'UNSW 标准学术英文 · Unit 5 Elasticity'
      },
      {
        term: 'Income Elasticity (YED) & Cross-Price Elasticity (XED)（收入弹性与交叉弹性）',
        en: 'Positive YED indicates a normal good (negative = inferior good); positive XED indicates substitutes (price of coffee up → tea demand up), whereas negative XED indicates complements.',
        zh: '收入弹性 YED > 0 为正常品（< 0 为低档品）；交叉弹性 XED > 0 代表替代品（咖啡涨价使茶叶需求升），XED < 0 代表互补品。',
        src: 'UNSW 标准学术英文 · Unit 5 Elasticity'
      }
    ],
    examQA: [
      {
        qEn: 'Explain why governments prefer to impose indirect excise taxes on goods with inelastic demand (such as cigarettes and petrol) rather than goods with elastic demand.',
        qZh: '为什么政府倾向于对缺乏弹性的商品（如烟草、汽油）征收消费税，而不是对富有弹性的商品征税？',
        tag: '弹性压轴大题 · 6 分',
        points: [
          {
            en: 'Because demand for addictive or essential goods is highly price inelastic (|PED| < 1), a tax-driven price rise causes only a small percentage drop in quantity bought.',
            zh: '烟草、汽油缺乏弹性（|PED| < 1），征税涨价后销量缩减幅度很小。'
          },
          {
            en: 'This generates large, predictable government tax revenue AND creates a much smaller Deadweight Loss than taxing an elastic good (where output collapses sharply).',
            zh: '因此既能为政府带来稳定丰厚的税收，产生的无谓损失（DWL）也远小于对高弹性商品征税。'
          },
          {
            en: 'Note on tax incidence: when demand is more inelastic than supply, consumers bear the larger share of the tax burden.',
            zh: '补充税负归宿：需求越缺乏弹性，消费者承担的税负比例就越大。'
          }
        ],
        keywords: ['|PED| < 1', 'small drop in Q', 'high stable tax revenue', 'smaller Deadweight Loss', 'consumers bear higher burden']
      },
      {
        qEn: 'A cinema lowers ticket prices from $20 to $16 and weekly attendance rises from 1,000 to 1,400. Calculate PED (midpoint or percentage) and explain what happened to Total Revenue.',
        qZh: '影院票价从 $20 降至 $16，周观影人次从 1,000 增至 1,400。请计算弹性并解释总收益如何变化。',
        tag: '必考计算 · 5 分',
        points: [
          {
            en: 'Percentage method: %ΔQ = +40%, %ΔP = −20% → |PED| = 40% ÷ 20% = 2.0 (Elastic, > 1). (Midpoint method: |PED| = (400/1200) ÷ (4/18) = 1.5, also Elastic).',
            zh: '百分比法：销量 +40%，价格 −20%，|PED| = 2.0（中点法 = 1.5），均大于 1 属富有弹性。'
          },
          {
            en: 'Total Revenue rises from $20,000 ($20 × 1,000) to $22,400 ($16 × 1,400), confirming that cutting price boosts TR when demand is elastic.',
            zh: '总收益从 $20,000 升至 $22,400，印证了富有弹性商品应采取薄利多销策略。'
          }
        ],
        keywords: ['|PED| > 1 (Elastic)', 'TR rises $20,000 -> $22,400']
      }
    ]
  },

  'term1x:6': {
    concepts: [
      {
        term: 'Law of Diminishing Marginal Returns（边际报酬递减规律）',
        en: 'In the short run, as successive units of a variable input (labour) are added to a fixed input (capital/land), Marginal Product eventually declines due to overcrowding and limited equipment.',
        zh: '在短期存在固定投入（如固定店铺/机器）的前提下，持续增加可变投入（雇更多工人）最终会导致每新增一名工人带来的边际产量（MP）递减。',
        src: 'UNSW 标准学术英文 · Unit 6 Short-Run Costs'
      },
      {
        term: 'Short-Run Cost Curves: FC, VC, TC, ATC & MC（短期成本曲线关系）',
        en: 'Total Cost = Fixed Cost + Variable Cost (TC = FC + VC); Marginal Cost (MC) always intersects Average Total Cost (ATC) and Average Variable Cost (AVC) at their minimum points.',
        zh: '总成本 = 固定成本 + 可变成本；边际成本曲线（MC）永远从下方穿过平均总成本（ATC）和平均可变成本（AVC）的最低点。',
        src: 'UNSW 标准学术英文 · Unit 6'
      }
    ],
    examQA: [
      {
        qEn: 'Explain the Law of Diminishing Marginal Returns and show how it explains the U-shape of the Short-Run Marginal Cost (MC) curve.',
        qZh: '请解释边际报酬递减规律，并说明它为何决定短期边际成本曲线（MC）呈 U 型（先降后升）？',
        tag: '厂商理论必考 · 5 分',
        points: [
          {
            en: 'Initially, specialisation and teamwork raise Marginal Product (MP rises), so each additional unit of output requires less extra labour and MC falls.',
            zh: '起初工人分工协作使边际产量 MP 上升，每多产 1 件所需新增人工减少，故 MC 下降。'
          },
          {
            en: 'Once fixed capital becomes overcrowded, diminishing marginal returns set in (MP falls), meaning progressively more labour is needed for each extra unit of output — driving MC sharply upward.',
            zh: '当机器场地拥挤触发边际报酬递减（MP 下降）后，每增产 1 件要花更多人工工资，于是 MC 掉头陡升，形成 U 型曲线。'
          }
        ],
        keywords: ['fixed factor overcrowding', 'MP rises -> MC falls', 'MP falls -> MC rises']
      }
    ]
  },

  'term1x:7': {
    concepts: [
      {
        term: 'Climate Change as a Global Negative Externality（全球变暖的经济学本质）',
        en: 'Greenhouse gas emissions represent the ultimate global negative externality and tragedy of the commons: individual countries capture the economic benefits of fossil-fuel production while imposing climate damages on the entire planet.',
        zh: '温室气体排放是典型的全球负外部性与「公地悲剧」：单个国家独享化石能源带来的短期工业收益，却把气候变暖灾害分摊给全人类。',
        src: 'UNSW 标准学术英文 · Challenge Week Global Warming'
      },
      {
        term: 'Carbon Tax vs Emissions Trading Scheme (ETS)（碳税与碳排放交易对比）',
        en: 'A Carbon Tax fixes the price per tonne of CO2 (price certainty, uncertain total quantity), whereas a Cap-and-Trade ETS fixes the total emissions cap and lets the market determine the permit price (quantity certainty).',
        zh: '碳税直接锁定每吨碳排放价格（价格确定、减排总量不确定）；碳交易（ETS）先锁定全国总排放上限再由市场交易配额价格（减排总量确定）。',
        src: 'UNSW 标准学术英文 · Challenge Week'
      }
    ],
    examQA: [
      {
        qEn: 'Compare a Carbon Tax with a Cap-and-Trade Emissions Trading Scheme (ETS) as economic solutions to global warming.',
        qZh: '作为应对气候变化的经济工具，请比较碳税（Carbon Tax）与碳排放权交易体系（ETS）的优缺点。',
        tag: '小组展示核心答辩题 · 6 分',
        points: [
          {
            en: 'A Carbon Tax provides firms with clear price certainty for long-term green investment and is simpler to administer, though total emission reductions cannot be guaranteed in advance.',
            zh: '碳税优势是价格清晰稳定，方便企业做长期绿色投资规划、征管简单；缺点是无法提前锁死最终减排总量。'
          },
          {
            en: 'An ETS caps total emissions strictly (guaranteeing environmental targets) and lets low-cost reducers sell spare permits to high-cost firms, achieving reduction at lowest total cost — though permit prices can be volatile.',
            zh: 'ETS 优势是严格锁死排放总量确保达标，并通过配额交易以全社会最低成本完成减排；缺点是碳价可能剧烈波动。'
          }
        ],
        keywords: ['price certainty vs quantity certainty', 'least-cost abatement', 'administrative simplicity vs price volatility']
      }
    ]
  },

  'term1x:8': {
    concepts: [
      {
        term: 'Economies vs Diseconomies of Scale（规模经济与规模不经济）',
        en: 'Economies of scale occur when expanding long-run plant size lowers Long-Run Average Cost (LRAC) due to bulk buying, specialisation and efficient machinery; diseconomies of scale occur when an organisation grows too large, raising LRAC due to bureaucracy and communication breakdowns.',
        zh: '规模经济指长期扩大产能使长期平均成本（LRAC）下降（批量采购折扣、专业化分工、大型设备摊薄成本）；规模不经济指企业过度庞大引发官僚低效与沟通失灵，反而推高 LRAC。',
        src: 'UNSW 标准学术英文 · Unit 7 Long-Run Costs'
      }
    ],
    examQA: [
      {
        qEn: 'Explain three sources of Internal Economies of Scale and two causes of Diseconomies of Scale.',
        qZh: '请解释内部规模经济的三个来源以及导致规模不经济的两个原因。',
        tag: '长期成本必考 · 5 分',
        points: [
          {
            en: 'Economies of scale: (1) Technical economies (indivisible high-capacity machinery); (2) Purchasing economies (bulk discounts on raw materials); (3) Managerial & Financial economies (specialist managers and cheaper bank credit).',
            zh: '规模经济来源：①技术规模（高效大型设备摊薄单件成本）；②采购规模（大宗团购折扣）；③管理与融资规模（聘请专才、更低借贷利率）。'
          },
          {
            en: 'Diseconomies of scale: (1) Communication and coordination breakdowns across too many management layers; (2) Worker alienation and declining morale in giant bureaucracies.',
            zh: '规模不经济原因：①层级过多导致决策缓慢、沟通失真；②大机构内员工疏离感上升、积极性下滑。'
          }
        ],
        keywords: ['bulk buying / technical / financial', 'bureaucracy / communication breakdown']
      }
    ]
  },

  'term1x:9': {
    concepts: [
      {
        term: 'Characteristics of Perfect Competition（完全竞争四大特征）',
        en: 'Perfect competition features many small buyers and sellers, identical (homogeneous) products, free entry and exit, and perfect information — making every individual firm a Price Taker facing a horizontal demand curve (P = MR = AR).',
        zh: '完全竞争市场有大量小买卖方、完全同质产品、自由进出行业及完全信息，因此每家企业都是「价格接受者（Price Taker）」，面临水平需求曲线（P = MR = AR）。',
        src: 'UNSW 标准学术英文 · Unit 8 Perfect Competition'
      },
      {
        term: 'Long-Run Equilibrium & Zero Economic Profit（长期均衡与零经济利润）',
        en: 'In the long run, free entry eliminates supernormal profits (and exit eliminates losses), driving perfectly competitive firms to earn only Normal Profit at minimum ATC — achieving BOTH productive and allocative efficiency (P = MC = min ATC).',
        zh: '长期中自由进出机制会抹平超额利润（亏损企业退出、超额利润吸引新进入者），最终企业只赚正常利润且在最低 ATC 生产，同时达成生产效率与配置效率！',
        src: 'UNSW 标准学术英文 · Unit 8'
      }
    ],
    examQA: [
      {
        qEn: 'Explain why a perfectly competitive firm can earn Supernormal Profit in the short run, yet earns ONLY Normal Profit in the long run.',
        qZh: '请解释为什么完全竞争企业在短期可能赚取超额利润，但到了长期只能赚取正常利润？',
        tag: '市场结构必考大题 · 6 分',
        points: [
          {
            en: 'In the short run, the number of firms is fixed; if market demand surges, market price rises above ATC and existing firms earn supernormal profit.',
            zh: '短期内厂商数量固定，市场需求上升推高价格高于 ATC，现有企业赚取超额利润。'
          },
          {
            en: 'Because there are NO barriers to entry, supernormal profits attract new firms into the industry in the long run, shifting market Supply RIGHT and pushing market price DOWN until P = minimum ATC (Normal Profit only).',
            zh: '由于行业无进入壁垒，超额利润吸引新厂商大批涌入，推动行业供给曲线右移、市场价格一路跌回 ATC 最低点，超额利润彻底归零。'
          }
        ],
        keywords: ['no barriers to entry', 'new firms enter -> Supply shifts right', 'price falls to P = min ATC']
      }
    ]
  },

  'term1x:10': {
    concepts: [
      {
        term: 'Monopoly & Barriers to Entry（垄断与进入壁垒）',
        en: 'A monopoly is a single seller of a unique product protected by high barriers to entry (patents, government licences, resource control, or Natural Monopoly economies of scale); it is a Price Maker facing a downward-sloping demand curve where MR < P.',
        zh: '垄断指由高进入壁垒（专利、牌照、独占资源或自然垄断规模经济）保护的唯一卖方，是价格制定者，面临向下倾斜需求曲线且边际收益曲线位于需求线下方（MR < P）。',
        src: 'UNSW 标准学术英文 · Unit 9 Monopoly'
      },
      {
        term: 'Welfare Loss of Monopoly vs Perfect Competition（垄断效率损失）',
        en: 'Compared to perfect competition, an unregulated profit-maximising monopoly restricts output (Qm < Qpc) and charges a higher price (Pm > MC), earning persistent long-run supernormal profit while creating a Deadweight Loss.',
        zh: '相比完全竞争，不受管制的垄断企业通过限产提价（P > MC）长期独享超额利润，同时造成消费者剩余缩水与社会无谓损失（DWL）。',
        src: 'UNSW 标准学术英文 · Unit 9'
      }
    ],
    examQA: [
      {
        qEn: 'Compare Monopoly with Perfect Competition in terms of price, output, long-run profit and efficiency.',
        qZh: '请从价格、产量、长期利润和经济效率四个维度对比垄断与完全竞争市场。',
        tag: '微观压轴对比 · 6 分',
        points: [
          {
            en: 'Perfect Competition produces higher output at a lower price (P = MC = min ATC), earns only normal profit in the long run, and achieves both allocative and productive efficiency.',
            zh: '完全竞争产量更高、价格更低（P = MC = 最低 ATC），长期仅赚正常利润，兼得配置与生产效率。'
          },
          {
            en: 'Monopoly restricts output and charges a higher price (P > MC, not at min ATC), retains long-run supernormal profit due to entry barriers, and creates allocative inefficiency (Deadweight Loss) — though large scale can sometimes fund R&D innovation.',
            zh: '垄断限产高价（P > MC），靠壁垒长期维持超额利润并带来无谓损失；但部分大型垄断企业也可能有财力投入研发创新或实现自然垄断规模经济。'
          }
        ],
        keywords: ['Qm < Qpc / Pm > Ppc', 'entry barriers preserve supernormal profit', 'Deadweight Loss vs R&D/scale']
      }
    ]
  },

  'term1x:11': {
    concepts: [
      {
        term: 'Monopolistic Competition & Product Differentiation（垄断竞争与产品差异化）',
        en: 'Monopolistic competition combines many firms and low barriers to entry with PRODUCT DIFFERENTIATION (branding, location, quality — e.g. cafés and restaurants), giving firms slight price-making power in the short run but zero economic profit and excess capacity in the long run.',
        zh: '垄断竞争兼具「企业多、进出自由」和「产品差异化」（品牌、口味、地段，如咖啡馆/餐厅），短期有微弱定价权，但长期自由进入仍使其回归零经济利润并存在过剩产能。',
        src: 'UNSW 标准学术英文 · Unit 10'
      },
      {
        term: 'Oligopoly, Interdependence & Collusion（寡头、相互依存与合谋）',
        en: 'An oligopoly is dominated by a few large interdependent firms (e.g. Australian supermarkets or big four banks) behind high entry barriers; firms avoid destructive price wars via non-price competition (advertising, loyalty cards) and face strong temptation to form illegal cartels/collusion.',
        zh: '寡头市场由少数几家巨头垄断（如澳洲四大银行或两大超市），企业决策高度相互依存；为避免两败俱伤的价格战，巨头偏好非价格竞争（广告、会员体系），并存在被监管严打的非法合谋诱惑。',
        src: 'UNSW 标准学术英文 · Unit 10'
      }
    ],
    examQA: [
      {
        qEn: 'Explain why firms in an Oligopoly prefer Non-Price Competition (advertising, branding, loyalty programs) over cutting prices.',
        qZh: '为什么寡头市场的巨头企业更偏好「非价格竞争（广告、品牌、会员积分）」，而极力避免直接打价格战？',
        tag: '寡头必考 · 5 分',
        points: [
          {
            en: 'Because oligopolists are mutually interdependent, if one firm cuts prices rivals will immediately match the cut to defend market share — leaving every firm with similar market shares but much lower profits (a destructive price war).',
            zh: '由于寡头高度相互依存，一家降价对手必然立刻跟进降价保份额，结果谁也没多抢到市场，全行业利润却暴跌。'
          },
          {
            en: 'Non-price competition (product quality, branding, rewards programs) builds customer loyalty that is harder for rivals to copy overnight, protecting profit margins.',
            zh: '非价格竞争通过品牌口碑与会员粘性建立护城河，对手难以一夜照搬，能稳住利润率。'
          }
        ],
        keywords: ['mutual interdependence', 'rivals match price cuts', 'price war erodes profit', 'brand loyalty']
      }
    ]
  },

  'term1x:12': {
    concepts: [
      {
        term: 'Four Market Structures Master Comparison（四大市场结构全景对比）',
        en: 'From Perfect Competition → Monopolistic Competition → Oligopoly → Monopoly, the number of firms falls, barriers to entry rise, price-making power increases, and deadweight loss generally widens.',
        zh: '沿着「完全竞争 → 垄断竞争 → 寡头 → 垄断」光谱，企业数量递减、进入壁垒递增、定价权增强，配置效率通常递减。',
        src: 'UNSW 标准学术英文 · Unit 11 Revision'
      }
    ],
    examQA: [
      {
        qEn: 'In a microeconomics final exam essay, how should you integrate diagrams into your written argument to earn top marks?',
        qZh: '微观经济学大题写作中，怎么把图解与英文正文结合才能拿到最高档分？',
        tag: '考场高分技巧 · 4 分',
        points: [
          {
            en: 'Follow the D-E-E-D rule: Define key economic terms → Explain the cause-and-effect chain → Embed and explicitly reference your Diagram (e.g. "as shown by the shift from S1 to S2, price rises from P1 to P2") → Discuss real-world limitations or policy evaluation.',
            zh: '套用 D-E-E-D 四步：定义核心术语 → 写清因果机制 → 画图并在正文中明确引用图上的 P1/Q1/S1→S2 标注 → 补一句现实局限或政策权衡评析。'
          }
        ],
        keywords: ['Define', 'Cause-and-effect chain', 'Reference diagram labels', 'Evaluate']
      }
    ]
  }
};
