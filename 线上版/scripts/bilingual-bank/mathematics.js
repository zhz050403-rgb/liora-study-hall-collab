'use strict';

/**
 * Mathematics for Commerce (27 weeks: Term 1 W1–13, Term 2 W1–14)
 * Line-by-line EN→ZH Core Concepts + Exam-Likely Q&As
 */
module.exports = {
  'term1:1': {
    concepts: [
      {
        term: 'Surds & Rationalising the Denominator（根式与分母有理化）',
        en: 'A surd is an irrational root that cannot be simplified into a whole number; to rationalise a binomial denominator such as a + √b, multiply numerator and denominator by its conjugate a − √b.',
        zh: '根式（Surd）是无法开成整数的无理根；分母含 a + √b 时，分子分母同乘共轭式 a − √b，利用平方差公式消去分母根号。',
        src: 'UNSW 标准学术英文 · MATH1202 T1 W1'
      },
      {
        term: 'Quadratic Equations & the Discriminant（二次方程与判别式）',
        en: 'For ax² + bx + c = 0, the discriminant Δ = b² − 4ac determines the number of real roots: Δ > 0 gives two distinct real roots, Δ = 0 gives one repeated root, and Δ < 0 gives no real roots.',
        zh: '一元二次方程的判别式 Δ = b² − 4ac 决定实根个数：Δ > 0 有两不等实根，Δ = 0 有重根，Δ < 0 无实数解。',
        src: 'UNSW 标准学术英文 · T1 W1'
      },
      {
        term: 'Absolute Value Equations & Inequalities（绝对值方程与不等式）',
        en: 'Absolute value |x| measures the distance of x from zero: |x| < a means −a < x < a (between), whereas |x| > a means x < −a or x > a (outside).',
        zh: '绝对值 |x| 表示数轴上到原点的距离：|x| < a 解在中间（−a < x < a），|x| > a 解在两边（x < −a 或 x > a）。',
        src: 'UNSW 标准学术英文 · T1 W1'
      }
    ],
    examQA: [
      {
        qEn: 'Solve the inequality |2x − 3| ≥ 5 and explain why multiplying an inequality by a negative number reverses the sign.',
        qZh: '解不等式 |2x − 3| ≥ 5，并解释为什么不等式两边同乘负数必须改变不等号方向。',
        tag: '高频计算 · 4 分',
        points: [
          {
            en: 'Split into two cases: 2x − 3 ≥ 5 (giving x ≥ 4) OR 2x − 3 ≤ −5 (giving x ≤ −1).',
            zh: '大于号拆两边：2x − 3 ≥ 5 得 x ≥ 4，或 2x − 3 ≤ −5 得 x ≤ −1。'
          },
          {
            en: 'Multiplying by a negative number reflects values across zero on the number line, reversing their left-to-right order (e.g. 2 < 5 becomes −2 > −5).',
            zh: '乘负数相当于沿原点翻转数轴，原本靠右的大数翻到更左侧，大小顺序必然颠倒。'
          }
        ],
        keywords: ['x ≤ -1 or x ≥ 4', 'reverses inequality sign']
      },
      {
        qEn: 'Find the values of k for which the quadratic equation x² + kx + 9 = 0 has exactly one real solution.',
        qZh: '求参数 k 为何值时，二次方程 x² + kx + 9 = 0 恰好只有一个实数解？',
        tag: '判别式必考 · 4 分',
        points: [
          {
            en: 'Set the discriminant Δ = b² − 4ac = 0: k² − 4(1)(9) = 0 → k² = 36 → k = 6 or k = −6.',
            zh: '令判别式 Δ = k² − 36 = 0，解得 k = ±6（千万别漏掉负根 k = −6！）。'
          }
        ],
        keywords: ['Δ = b² - 4ac = 0', 'k = ±6']
      }
    ]
  },

  'term1:2': {
    concepts: [
      {
        term: 'Function, Domain & Range（函数、定义域与值域）',
        en: 'A function assigns to every input x in its Domain exactly one output y in its Range, verified graphically by the Vertical Line Test.',
        zh: '函数要求定义域内每个输入 x 严格对应唯一输出 y；图像上用「竖直线检验（Vertical Line Test）」——任意竖线最多只交 1 点。',
        src: 'UNSW 标准学术英文 · T1 W2'
      },
      {
        term: 'Linear Equations, Gradient & Market Equilibrium（直线斜率与市场均衡）',
        en: 'In y = mx + c, m is the gradient (rate of change Δy/Δx) and c is the y-intercept; parallel lines have equal gradients (m₁ = m₂), while perpendicular lines satisfy m₁ · m₂ = −1.',
        zh: 'y = mx + c 中 m 是斜率（变化率），c 是纵截距；平行线斜率相等，垂直线斜率之积为 −1。',
        src: 'UNSW 标准学术英文 · T1 W2'
      }
    ],
    examQA: [
      {
        qEn: 'Given Demand P = 100 − 2Q and Supply P = 10 + Q, find the equilibrium price and quantity and interpret the y-intercepts economically.',
        qZh: '已知需求 P = 100 − 2Q、供给 P = 10 + Q，求市场均衡点并解释两条直线的纵截距的经济含义。',
        tag: '商数经典大题 · 5 分',
        points: [
          {
            en: 'Set Demand = Supply: 100 − 2Q = 10 + Q → 3Q = 90 → Q* = 30 units, and P* = 10 + 30 = $40.',
            zh: '联立 100 − 2Q = 10 + Q 得均衡销量 Q* = 30，均衡价格 P* = $40。'
          },
          {
            en: 'Demand y-intercept ($100) is the choke price where quantity demanded drops to zero; Supply y-intercept ($10) is the minimum price required before firms supply any units.',
            zh: '需求纵截距 $100 是需求量为 0 的最高门槛价；供给纵截距 $10 是企业愿意开始供货的最低起步价。'
          }
        ],
        keywords: ['Q* = 30, P* = $40', 'choke price', 'minimum supply price']
      }
    ]
  },

  'term1:3': {
    concepts: [
      {
        term: 'Parabolas & Vertex Optimisation（抛物线与顶点最值）',
        en: 'The graph of y = ax² + bx + c is a parabola opening upward if a > 0 (minimum) and downward if a < 0 (maximum), with axis of symmetry and vertex at x = −b / (2a).',
        zh: '二次函数图像为抛物线：a > 0 开口向上有最小值，a < 0 开口向下有最大值，顶点横坐标永远是 x = −b / (2a)。',
        src: 'UNSW 标准学术英文 · T1 W3'
      },
      {
        term: 'Rectangular Hyperbola & Asymptotes（双曲线与渐近线）',
        en: 'For y = k / (x − h) + c, the vertical asymptote occurs where the denominator is zero (x = h) and the horizontal asymptote is y = c, which the curve approaches but never touches.',
        zh: '反比例/双曲线函数中，分母为零给出垂直渐近线 x = h，常数项给出水平渐近线 y = c，曲线无限逼近但永不相交。',
        src: 'UNSW 标准学术英文 · T1 W3'
      }
    ],
    examQA: [
      {
        qEn: 'A firm’s weekly profit is π(Q) = −2Q² + 120Q − 1000. Find the break-even quantities and the output Q that maximises profit.',
        qZh: '某企业周利润函数为 π(Q) = −2Q² + 120Q − 1000，求盈亏平衡产量以及使利润最大的产量与最大利润。',
        tag: '商业二次函数必考 · 6 分',
        points: [
          {
            en: 'Maximum profit occurs at the vertex (since a = −2 < 0): Q* = −120 / (2 × −2) = 30 units; Maximum Profit π(30) = −2(900) + 3600 − 1000 = $800.',
            zh: 'a = −2 < 0 开口向下，顶点 Q* = −120/(−4) = 30 件；代入得最大周利润 = $800。'
          },
          {
            en: 'Break-even points occur where π(Q) = 0: divide by −2 → Q² − 60Q + 500 = 0 → (Q − 10)(Q − 50) = 0 → Q = 10 or Q = 50 units.',
            zh: '令利润为 0 化简为 (Q − 10)(Q − 50) = 0，盈亏平衡点为 10 件和 50 件，在 10 到 50 件之间盈利。'
          }
        ],
        keywords: ['vertex x = -b/2a', 'Q* = 30, Max π = $800', 'Break-even Q = 10, 50']
      }
    ]
  },

  'term1:4': {
    concepts: [
      {
        term: 'Inverse Functions & One-to-One Condition（反函数与一对一条件）',
        en: 'A function f(x) has an inverse f⁻¹(x) only if it is one-to-one (passes the Horizontal Line Test); the graph of f⁻¹(x) is the reflection of f(x) across the line y = x.',
        zh: '函数必须满足「一对一（通过水平线检验）」才存在反函数；反函数图像与原函数关于直线 y = x 对称，定义域与值域互换。',
        src: 'UNSW 标准学术英文 · T1 W4'
      },
      {
        term: 'Exponential & Logarithmic Laws（指数与对数互逆法则）',
        en: 'Logarithms are the inverses of exponentials: y = aˣ ⇔ x = logₐ(y), with domain y > 0; key laws are ln(AB) = ln A + ln B, ln(A/B) = ln A − ln B, and ln(Aᵏ) = k ln A.',
        zh: '对数与指数互为反函数（要求真数严格大于 0）；三大运算律把乘除变加减、把幂次拉到前面当系数，专门用来解指数上的未知数。',
        src: 'UNSW 标准学术英文 · T1 W4'
      }
    ],
    examQA: [
      {
        qEn: 'Solve 5 · e^(0.08t) = 20 for t, and explain why log equations must always be checked against the domain.',
        qZh: '解指数方程 5 · e^(0.08t) = 20，并解释为什么解完对数方程后必须检验定义域。',
        tag: '指数对数必考 · 5 分',
        points: [
          {
            en: 'Divide by 5: e^(0.08t) = 4 → take natural log of both sides: 0.08t = ln(4) → t = ln(4) / 0.08 ≈ 17.33.',
            zh: '两边同除以 5 得 e^(0.08t) = 4，取自然对数得 0.08t = ln 4，t = ln(4)/0.08 ≈ 17.33。'
          },
          {
            en: 'Because ln(u) is undefined for u ≤ 0, algebraic squaring or combining logs can introduce extraneous solutions that make an original log argument negative or zero — so every root must be verified.',
            zh: '因为对数真数必须严格 > 0，合并对数解出的代数根可能导致原式真数 ≤ 0（增根），必须逐根代回检验并舍去无效根。'
          }
        ],
        keywords: ['t = ln(4)/0.08', 'argument must be > 0', 'reject extraneous roots']
      }
    ]
  },

  'term1:5': {
    concepts: [
      {
        term: 'Domain Restrictions & Piecewise Functions（三大定义域限制与分段函数）',
        en: 'Find natural domains by enforcing three rules: denominators ≠ 0, expressions inside even roots ≥ 0, and arguments of logarithms > 0. For piecewise functions, mark closed dots (●) for included endpoints and open circles (○) for excluded endpoints.',
        zh: '求定义域牢记三条铁律：分母 ≠ 0、偶次根号内 ≥ 0、对数真数 > 0；画分段函数时，包含端点用实心点 ●，不包含用空心圈 ○。',
        src: 'UNSW 标准学术英文 · T1 W5'
      },
      {
        term: 'Logarithmic Graph Features（对数曲线图像特征）',
        en: 'The curve y = ln(x − h) has a vertical asymptote at x = h, domain x > h, passes through (h + 1, 0), and increases slowly without bound as x → ∞.',
        zh: 'y = ln(x − h) 有垂直渐近线 x = h，定义域 x > h，恒过定点 (h + 1, 0)，向右缓慢递增无上界。',
        src: 'UNSW 标准学术英文 · T1 W5'
      }
    ],
    examQA: [
      {
        qEn: 'Determine the natural domain of f(x) = ln(6 − 2x) / √(x + 1).',
        qZh: '求函数 f(x) = ln(6 − 2x) / √(x + 1) 的自然定义域。',
        tag: '定义域高频 · 4 分',
        points: [
          {
            en: 'Condition 1 (logarithm argument > 0): 6 − 2x > 0 → x < 3.',
            zh: '条件 1（对数真数 > 0）：6 − 2x > 0 → x < 3。'
          },
          {
            en: 'Condition 2 (square root in denominator must be strictly > 0): x + 1 > 0 → x > −1. Combining both gives −1 < x < 3, or (−1, 3).',
            zh: '条件 2（分母里的根号既要 ≥ 0 又不能为 0，故严格 > 0）：x > −1。取交集得 (−1, 3)。'
          }
        ],
        keywords: ['6 - 2x > 0', 'x + 1 > 0 (not ≥ 0)', '(-1, 3)']
      }
    ]
  },

  'term1:6': {
    concepts: [
      {
        term: 'Compound Growth & Continuous Compounding Models（复利增长与连续复利模型）',
        en: 'Discrete compounding follows A = P(1 + r/n)^(nt), whereas continuous exponential growth/decay follows A(t) = P · e^(rt), where r > 0 is growth and r < 0 is decay.',
        zh: '离散复利公式 A = P(1 + r/n)^(nt)，连续复利/自然增长衰减模型为 A(t) = P · e^(rt)（r > 0 增长，r < 0 衰减）。',
        src: 'UNSW 标准学术英文 · T1 W6'
      },
      {
        term: 'Economic Applications: Cost, Revenue, Profit & Break-Even（成本收益与盈亏平衡）',
        en: 'Total Revenue TR = P · Q, Total Cost TC = FC + VC · Q, Profit π = TR − TC; Break-even occurs where TR = TC (π = 0).',
        zh: '总收入 TR = P·Q，总成本 TC = 固定成本 + 单位变动成本·Q，利润 π = TR − TC，盈亏平衡点满足 TR = TC。',
        src: 'UNSW 标准学术英文 · T1 W6'
      }
    ],
    examQA: [
      {
        qEn: 'An investment of $10,000 grows continuously at 6% per annum (A = 10000e^(0.06t)). How many years does it take to double?',
        qZh: '$10,000 按年利率 6% 连续复利增长（A = 10000e^(0.06t)），大约需要多少年翻倍？',
        tag: '期中测验必考 · 4 分',
        points: [
          {
            en: 'Set A = 20,000: 10000e^(0.06t) = 20000 → e^(0.06t) = 2 → 0.06t = ln(2) → t = ln(2) / 0.06 ≈ 11.55 years.',
            zh: '令 A = 20,000 约去本金得 e^(0.06t) = 2，两边取 ln 得 t = ln(2)/0.06 ≈ 11.55 年（翻倍时间与本金多少无关！）。'
          }
        ],
        keywords: ['e^(0.06t) = 2', 't = ln(2)/0.06 ≈ 11.55 years']
      }
    ]
  },

  'term1:7': {
    concepts: [
      {
        term: 'Derivative as Instantaneous Rate of Change（导数即瞬时变化率）',
        en: 'The derivative f\'(x) = lim(h→0) [f(x+h) − f(x)] / h measures both the gradient of the tangent line at x and the instantaneous rate of change (in economics: Marginal Cost MC = dTC/dQ, Marginal Revenue MR = dTR/dQ).',
        zh: '导数 f\'(x) 既是切线斜率，也是瞬时变化率——在商业经济学中，总成本求导即边际成本 MC，总收入求导即边际收入 MR。',
        src: 'UNSW 标准学术英文 · T1 W7 Differentiation'
      },
      {
        term: 'Core Differentiation Rules: Power, Product, Quotient & Chain（四大求导法则）',
        en: 'Master Power Rule d/dx(xⁿ) = n xⁿ⁻¹, Product Rule (uv)\' = u\'v + uv\', Quotient Rule (u/v)\' = (u\'v − uv\')/v², and Chain Rule dy/dx = (dy/du)(du/dx).',
        zh: '牢记幂函数、乘法、除法与链式求导四大法则，复杂复合函数务必用链式法则「由外向内逐层求导再相乘」。',
        src: 'UNSW 标准学术英文 · T1 W7'
      }
    ],
    examQA: [
      {
        qEn: 'Given Total Cost TC(Q) = 0.5Q² + 20Q + 500, find Marginal Cost MC(Q), evaluate MC(10), and interpret what MC(10) means in business terms.',
        qZh: '已知总成本 TC(Q) = 0.5Q² + 20Q + 500，求边际成本函数 MC(Q)、计算 MC(10) 并解释其商业含义。',
        tag: '微积分经济应用 · 4 分',
        points: [
          {
            en: 'Differentiate TC with respect to Q: MC(Q) = TC\'(Q) = Q + 20; at Q = 10, MC(10) = $30.',
            zh: '求导得 MC(Q) = Q + 20，代入 Q = 10 得 MC(10) = $30。'
          },
          {
            en: 'Economic interpretation: When current output is 10 units, producing the next (11th) unit increases total cost by approximately $30.',
            zh: '商业解释：在当前产量 10 件的水平上，每多生产 1 件（第 11 件），总成本大约额外增加 $30。'
          }
        ],
        keywords: ['MC = dTC/dQ', 'MC(10) = $30', 'approximate cost of 1 extra unit']
      }
    ]
  },

  'term1:8': {
    concepts: [
      {
        term: 'Equations of Tangents & Normals（切线与法线方程）',
        en: 'At point (x₀, y₀), the tangent has gradient m_t = f\'(x₀) with equation y − y₀ = m_t(x − x₀); the normal is perpendicular to the tangent with gradient m_n = −1 / m_t.',
        zh: '在点 (x₀, y₀) 处，切线斜率为 m_t = f\'(x₀)；法线垂直于切线，斜率为其负倒数 m_n = −1/m_t，均用点斜式写出直线方程。',
        src: 'UNSW 标准学术英文 · T1 W8'
      },
      {
        term: 'Increasing/Decreasing & Stationary Points（单调性与驻点）',
        en: 'A function is increasing where f\'(x) > 0, decreasing where f\'(x) < 0, and has stationary points (potential local max, min or horizontal inflection) where f\'(x) = 0.',
        zh: '一阶导 f\'(x) > 0 曲线递增，f\'(x) < 0 递减，f\'(x) = 0 处为驻点（极值候选点）。',
        src: 'UNSW 标准学术英文 · T1 W8'
      }
    ],
    examQA: [
      {
        qEn: 'Find the equation of the tangent and normal to y = x³ − 3x + 2 at x = 2.',
        qZh: '求曲线 y = x³ − 3x + 2 在 x = 2 处的切线方程与法线方程。',
        tag: '高频计算 · 5 分',
        points: [
          {
            en: 'Point: y(2) = 8 − 6 + 2 = 4 → (2, 4). Derivative: y\' = 3x² − 3 → m_t = 3(4) − 3 = 9.',
            zh: '先求切点 (2, 4)，再求导得切线斜率 m_t = 9。'
          },
          {
            en: 'Tangent: y − 4 = 9(x − 2) → y = 9x − 14. Normal (m_n = −1/9): y − 4 = (−1/9)(x − 2) → x + 9y = 38.',
            zh: '切线方程 y = 9x − 14；法线斜率 −1/9，方程为 y = −(1/9)x + 38/9（或 x + 9y = 38）。'
          }
        ],
        keywords: ['point (2, 4)', 'm_t = 9', 'm_n = -1/9']
      }
    ]
  },

  'term1:9': {
    concepts: [
      {
        term: 'Second Derivative Test for Optimisation（二阶导检验极值）',
        en: 'At a stationary point where f\'(c) = 0, if f\'\'(c) < 0 (concave down) it is a local MAXIMUM; if f\'\'(c) > 0 (concave up) it is a local MINIMUM.',
        zh: '在驻点 f\'(c) = 0 处用二阶导判定性质：f\'\'(c) < 0 开口向下为极大值，f\'\'(c) > 0 开口向上为极小值；考场极值大题必须写出验证步骤！',
        src: 'UNSW 标准学术英文 · T1 W9 Optimisation'
      },
      {
        term: 'Indefinite Integrals (Antiderivatives)（不定积分与原函数）',
        en: 'Integration reverses differentiation: ∫ xⁿ dx = xⁿ⁺¹/(n+1) + C (for n ≠ −1). Never omit the constant of integration + C, which represents Fixed Cost when recovering TC from MC.',
        zh: '不定积分是求导的逆运算，永远不能漏写积分常数 + C——在商业数学中，由边际成本积分还原总成本时，常数 C 就是固定成本 FC！',
        src: 'UNSW 标准学术英文 · T1 W9'
      }
    ],
    examQA: [
      {
        qEn: 'Given Marginal Cost MC(Q) = 6Q + 40 and Fixed Cost = $1,200, recover the Total Cost function TC(Q), and explain why the constant C equals Fixed Cost.',
        qZh: '已知边际成本 MC(Q) = 6Q + 40 且固定成本为 $1,200，求总成本函数 TC(Q)，并解释为何积分常数 C 就是固定成本。',
        tag: '积分经济应用 · 5 分',
        points: [
          {
            en: 'Integrate MC: TC(Q) = ∫ (6Q + 40) dQ = 3Q² + 40Q + C.',
            zh: '对 MC 积分得 TC(Q) = 3Q² + 40Q + C。'
          },
          {
            en: 'When output Q = 0, variable cost is zero so TC(0) = Fixed Cost = $1,200 → C = 1200, giving TC(Q) = 3Q² + 40Q + 1200.',
            zh: '产量 Q = 0 时总成本即固定成本 $1,200，代入得 C = 1200，故 TC(Q) = 3Q² + 40Q + 1200。'
          }
        ],
        keywords: ['TC = ∫ MC dQ', 'Q = 0 -> C = Fixed Cost', 'TC(Q) = 3Q² + 40Q + 1200']
      }
    ]
  },

  'term1:10': {
    concepts: [
      {
        term: 'Definite Integrals & Net vs Total Area（定积分与总面积）',
        en: 'By the Fundamental Theorem of Calculus, ∫ₐᵇ f(x) dx = F(b) − F(a). Because regions below the x-axis produce negative definite integrals, split at x-intercepts and take absolute values when computing geometric area.',
        zh: '微积分基本定理：定积分等于原函数在上限减下限的值；求图形面积时，若曲线掉到 x 轴下方会产生负值，必须在零点拆段取绝对值相加。',
        src: 'UNSW 标准学术英文 · T1 W10 Definite Integrals'
      },
      {
        term: 'Consumer Surplus & Producer Surplus via Integrals（定积分求消费者/生产者剩余）',
        en: 'Consumer Surplus CS = ∫₀^(Q*) D(Q) dQ − P*Q*; Producer Surplus PS = P*Q* − ∫₀^(Q*) S(Q) dQ.',
        zh: '消费者剩余 CS = 需求曲线下方积分面积 − 实际总支出 P*Q*；生产者剩余 PS = 实际总收入 P*Q* − 供给曲线下方积分面积。',
        src: 'UNSW 标准学术英文 · T1 W10 必考公式'
      }
    ],
    examQA: [
      {
        qEn: 'Given Demand P = 100 − Q² and equilibrium Q* = 6 (P* = 64), calculate the Consumer Surplus using definite integration.',
        qZh: '已知非线性需求函数 P = 100 − Q²，均衡点 Q* = 6（P* = 64），请用定积分求消费者剩余 CS。',
        tag: '期末核心大题 · 5 分',
        points: [
          {
            en: 'CS = ∫₀⁶ (100 − Q²) dQ − (64 × 6) = [100Q − Q³/3]₀⁶ − 384 = (600 − 72) − 384 = 528 − 384 = $144.',
            zh: '先算需求曲线下方积分 [100Q − Q³/3] 从 0 到 6 得 528，再减去实际支出 64×6 = 384，得消费者剩余 CS = $144。'
          }
        ],
        keywords: ['∫ D(Q) dQ - P*Q*', '528 - 384 = $144']
      }
    ]
  },

  'term1:11': {
    concepts: [
      {
        term: 'Derivatives of Exponential & Logarithmic Functions（指数与对数求导）',
        en: 'Key formulas: d/dx(e^(f(x))) = f\'(x) · e^(f(x)) and d/dx[ln(f(x))] = f\'(x) / f(x) — always remember the chain-rule factor f\'(x)!',
        zh: '核心公式：e^(f(x)) 求导等于自身乘指数导数 f\'(x)；ln(f(x)) 求导等于「里面导数除以里面本身」f\'(x)/f(x)，千万别漏链式因子！',
        src: 'UNSW 标准学术英文 · T1 W11'
      }
    ],
    examQA: [
      {
        qEn: 'Differentiate y = x² · e^(3x) and y = ln(4x² + 1) cleanly, showing every rule applied.',
        qZh: '对 y = x² · e^(3x) 与 y = ln(4x² + 1) 求导并写出所用法则。',
        tag: '求导必考 · 5 分',
        points: [
          {
            en: 'Using Product Rule + Chain Rule: d/dx(x²e^(3x)) = 2x·e^(3x) + x²·(3e^(3x)) = x·e^(3x)(2 + 3x).',
            zh: '乘法+链式法则：先导前乘后 + 前乘后导 = 2xe^(3x) + 3x²e^(3x) = xe^(3x)(2 + 3x)。'
          },
          {
            en: 'Using Log Chain Rule f\'(x)/f(x): d/dx[ln(4x² + 1)] = 8x / (4x² + 1).',
            zh: '对数链式法则：分子放 4x²+1 的导数 8x，分母放原真数 4x²+1。'
          }
        ],
        keywords: ['Product + Chain Rule', 'f\'(x)/f(x)']
      }
    ]
  },

  'term1:12': {
    concepts: [
      {
        term: 'Exponential & Logarithmic Integration（指数与对数型积分）',
        en: 'Standard integrals: ∫ e^(ax+b) dx = (1/a)e^(ax+b) + C and ∫ [f\'(x) / f(x)] dx = ln|f(x)| + C (remember the absolute value bars inside ln!).',
        zh: '核心积分：∫ e^(ax+b) dx 要在前面除以系数 a；分子恰好是分母导数时积分得 ln|f(x)| + C（记得加绝对值符号！）。',
        src: 'UNSW 标准学术英文 · T1 W12'
      }
    ],
    examQA: [
      {
        qEn: 'Evaluate ∫₁³ [2x / (x² + 1)] dx cleanly using the logarithmic integration pattern.',
        qZh: '用对数型积分法则计算定积分 ∫₁³ [2x / (x² + 1)] dx。',
        tag: '积分必考 · 4 分',
        points: [
          {
            en: 'Notice the numerator 2x is the exact derivative of the denominator x² + 1, so the antiderivative is ln|x² + 1|.',
            zh: '观察发现分子 2x 正好是分母 x² + 1 的导数，直接积得 ln|x² + 1|。'
          },
          {
            en: 'Evaluate from 1 to 3: ln(10) − ln(2) = ln(10/2) = ln(5) ≈ 1.609.',
            zh: '代入上下限得 ln(10) − ln(2) = ln(5) ≈ 1.609。'
          }
        ],
        keywords: ['f\'(x)/f(x) -> ln|f(x)|', 'ln(10) - ln(2) = ln(5)']
      }
    ]
  },

  'term1:13': {
    concepts: [
      {
        term: 'Term 1 Calculus & Functions Integration Map（Term 1 综合解题地图）',
        en: 'Term 1 exam problems connect algebra, functions, differentiation and integration to business models: maximise profit via π\'(Q) = 0 with π\'\'(Q) < 0, and compute surplus or total change via definite integrals.',
        zh: 'Term 1 期末考把代数、函数、求导与积分串联在商业场景里：极值用一阶导等于 0 + 二阶导检验，总变化与剩余面积用定积分。',
        src: 'UNSW 标准学术英文 · T1 W13 Revision'
      }
    ],
    examQA: [
      {
        qEn: 'What are the four mandatory steps to score full marks on any Calculus Optimisation word problem in the final exam?',
        qZh: '期末遇到微积分「商业最优化应用大题」（求最大利润/最小平均成本），哪四步写齐才能稳拿满分？',
        tag: '考场满分步骤 · 4 分',
        points: [
          {
            en: '1) Write the objective function in one variable (e.g. π(Q) = TR − TC); 2) Differentiate and solve f\'(Q) = 0 for stationary points; 3) PROVE max/min using Second Derivative f\'\'(Q) < 0 or > 0; 4) Answer the exact question asked with units ($ / units).',
            zh: '①写出单变量目标函数；②求导解驻点 f\'(Q)=0；③用二阶导严格证明是极大还是极小（缺这步必扣 1–2 分！）；④把结果代回原函数并带单位回答问题。'
          }
        ],
        keywords: ['objective function', 'f\'(Q) = 0', 'second derivative verification', 'final units']
      }
    ]
  },

  /* ==================== TERM 2 (Finance, Probability & Statistics) ==================== */
  'term2:1': {
    concepts: [
      {
        term: 'Arithmetic Progression (AP) vs Geometric Progression (GP)（等差数列与等比数列）',
        en: 'An AP adds a constant common difference d each term (Tₙ = a + (n−1)d; Sₙ = n/2 [2a + (n−1)d]); a GP multiplies by a constant common ratio r each term (Tₙ = arⁿ⁻¹; Sₙ = a(rⁿ − 1)/(r − 1)).',
        zh: '等差数列每项加公差 d；等比数列每项乘公比 r（金融复利和年金的底层数学工具就是等比数列求和！）。',
        src: 'UNSW 标准学术英文 · T2 W1 Sequences & Series'
      }
    ],
    examQA: [
      {
        qEn: 'A company’s Year 1 sales are $50,000 and grow by 10% every year. Find sales in Year 8 and total cumulative sales over the first 8 years.',
        qZh: '公司第 1 年销售额 $50,000，此后每年增长 10%。求第 8 年销售额以及前 8 年累计总销售额。',
        tag: '等比应用必考 · 5 分',
        points: [
          {
            en: 'This is a GP with a = 50,000 and r = 1.10. Year 8 sales: T₈ = 50000 × (1.10)⁷ ≈ $97,435.86.',
            zh: '首项 a = 50,000，公比 r = 1.10；第 8 年 T₈ = 50000 × 1.1⁷ ≈ $97,435.86（注意指数是 n−1 = 7！）。'
          },
          {
            en: 'Cumulative 8-year sales: S₈ = 50000(1.10⁸ − 1) / (1.10 − 1) ≈ $571,794.41.',
            zh: '前 8 年总计用等比求和公式 S₈ ≈ $571,794.41。'
          }
        ],
        keywords: ['GP with r = 1.10', 'T₈ = ar⁷', 'S₈ formula']
      }
    ]
  },

  'term2:2': {
    concepts: [
      {
        term: 'Limiting Sum of an Infinite GP（无穷等比级数收敛和）',
        en: 'An infinite geometric series converges if and only if |r| < 1, with limiting sum S_∞ = a / (1 − r) — the mathematical basis for valuing perpetuities and economic multipliers.',
        zh: '无穷等比级数仅当 |r| < 1 时收敛，无穷和 S_∞ = a / (1 − r)——这正是永续年金定价与凯恩斯乘数的数学公式！',
        src: 'UNSW 标准学术英文 · T2 W2'
      },
      {
        term: 'Simple Interest vs Compound Interest & Effective Rate（单利、复利与有效年利率）',
        en: 'Compound interest earns interest on prior interest: A = P(1 + i)ⁿ, where i = r/k is the rate per compounding period and n = kt is total periods; Effective Annual Rate EAR = (1 + r/k)ᵏ − 1.',
        zh: '复利是利滚利：必须先把年利率除以每年计息次数 k 得到每期利率 i，把年数乘 k 得到总期数 n；比较不同计息频率要统一换算成有效年利率 EAR。',
        src: 'UNSW 标准学术英文 · T2 W2'
      }
    ],
    examQA: [
      {
        qEn: 'Compare 6% p.a. compounded monthly with 6.1% p.a. compounded annually using the Effective Annual Rate (EAR). Which gives higher returns?',
        qZh: '用有效年利率（EAR）比较「年利率 6% 按月复利」与「年利率 6.1% 按年复利」，哪个回报更高？',
        tag: '金融数学必考 · 4 分',
        points: [
          {
            en: 'For 6% compounded monthly: EAR = (1 + 0.06/12)¹² − 1 = (1.005)¹² − 1 ≈ 6.168%.',
            zh: '6% 按月复利的有效年利率 = (1 + 0.005)¹² − 1 ≈ 6.168%。'
          },
          {
            en: 'Since 6.168% > 6.10%, 6% compounded monthly yields the higher effective return.',
            zh: '6.168% > 6.10%，所以 6% 按月复利实际收益更高。'
          }
        ],
        keywords: ['EAR = (1 + r/k)^k - 1', '6.168% > 6.10%']
      }
    ]
  },

  'term2:3': {
    concepts: [
      {
        term: 'Present Value & Future Value of Annuities（年金现值与终值）',
        en: 'An ordinary annuity pays equal instalments R at the end of each period: Future Value FV = R[(1+i)ⁿ − 1]/i (saving up), while Present Value PV = R[1 − (1+i)⁻ⁿ]/i (borrowing/mortgages).',
        zh: '普通年金每期末等额收付 R：存钱算未来攒多少用终值 FV；房贷/贷款算今天借多少或每月还多少用现值 PV！',
        src: 'UNSW 标准学术英文 · T2 W3 Present Value & Finance'
      }
    ],
    examQA: [
      {
        qEn: 'You borrow $20,000 at 6% p.a. compounded monthly to be repaid in equal monthly instalments over 4 years. Write the PV formula setup and find the monthly repayment R.',
        qZh: '贷款 $20,000，年利率 6% 按月复利，4 年内每月等额还款。写出年金现值公式并求月供 R。',
        tag: '房贷还款必考大题 · 5 分',
        points: [
          {
            en: 'Convert to monthly parameters: i = 0.06/12 = 0.005, n = 4 × 12 = 48. Apply PV = R[1 − (1+i)⁻ⁿ]/i:',
            zh: '先统一按月折算：月利率 i = 0.005，总期数 n = 48，代入贷款现值公式：'
          },
          {
            en: '20000 = R[1 − (1.005)⁻⁴⁸]/0.005 = R × 42.5803 → R ≈ $469.70 per month.',
            zh: '20000 = R × 42.5803 → 月供 R ≈ $469.70。'
          }
        ],
        keywords: ['i = 0.005, n = 48', 'Annuity PV formula', 'R ≈ $469.70']
      }
    ]
  },

  'term2:4': {
    concepts: [
      {
        term: 'Permutations (nPr) vs Combinations (nCr)（排列与组合的本质区别）',
        en: 'Use Permutations nPr = n!/(n−r)! when ORDER MATTERS (e.g. president/treasurer roles, PIN codes); use Combinations nCr = n!/[r!(n−r)!] when ORDER DOES NOT MATTER (e.g. selecting a committee or lottery numbers).',
        zh: '顺序有影响（选正副主席、排座位、密码）用排列 nPr；顺序无所谓（选 3 人小组、抽扑克牌）用组合 nCr！',
        src: 'UNSW 标准学术英文 · T2 W4 Counting'
      }
    ],
    examQA: [
      {
        qEn: 'From 6 women and 4 men, how many 4-person committees can be formed containing AT LEAST 2 women?',
        qZh: '从 6 名女性和 4 名男性中选出 4 人委员会，要求「至少有 2 名女性」，共有多少种选法？',
        tag: '排列组合高频 · 5 分',
        points: [
          {
            en: 'Order does not matter → use Combinations across valid cases (2W2M, 3W1M, 4W0M): C(6,2)C(4,2) + C(6,3)C(4,1) + C(6,4)C(4,0).',
            zh: '委员会不讲顺序用组合，按女性人数分三种互斥情况相加：2女2男 + 3女1男 + 4女0男。'
          },
          {
            en: '= (15 × 6) + (20 × 4) + (15 × 1) = 90 + 80 + 15 = 185 committees.',
            zh: '计算得 90 + 80 + 15 = 185 种（也可用总数 C(10,4)=210 减去 0女和1女的补集验证！）。'
          }
        ],
        keywords: ['order does not matter -> nCr', '185 committees']
      }
    ]
  },

  'term2:5': {
    concepts: [
      {
        term: 'Addition Rule, Mutually Exclusive & Complementary Events（概率加法、互斥与对立事件）',
        en: 'For any two events A and B, P(A ∪ B) = P(A) + P(B) − P(A ∩ B); events are mutually exclusive if P(A ∩ B) = 0. The complement rule P(at least one) = 1 − P(none) simplifies complex problems dramatically.',
        zh: '一般加法公式必须减去交集防重复算；互斥事件交集概率为 0；遇到「至少一个（at least one）」优先用补集公式 1 − P(一个都没有)！',
        src: 'UNSW 标准学术英文 · T2 W5 Probability Basics'
      }
    ],
    examQA: [
      {
        qEn: 'In a class, P(Accounting) = 0.6, P(Economics) = 0.5, and P(Both) = 0.3. Find P(Accounting OR Economics) and P(Neither).',
        qZh: '班里选会计概率 0.6、选经济概率 0.5、两门都选概率 0.3，求至少选一门及两门都不选的概率。',
        tag: '韦恩图必考 · 4 分',
        points: [
          {
            en: 'P(A ∪ E) = P(A) + P(E) − P(A ∩ E) = 0.6 + 0.5 − 0.3 = 0.8.',
            zh: '并集概率 = 0.6 + 0.5 − 0.3 = 0.8。'
          },
          {
            en: 'P(Neither) = 1 − P(A ∪ E) = 1 − 0.8 = 0.2.',
            zh: '两门都不选 = 1 − 0.8 = 0.2。'
          }
        ],
        keywords: ['P(A∪B) = 0.8', 'P(Neither) = 0.2']
      }
    ]
  },

  'term2:6': {
    concepts: [
      {
        term: 'Conditional Probability & Independence（条件概率与独立事件）',
        en: 'Conditional probability P(A | B) = P(A ∩ B) / P(B) updates the probability of A given B has occurred. Two events are INDEPENDENT if and only if P(A ∩ B) = P(A) · P(B) (equivalently P(A | B) = P(A)).',
        zh: '条件概率把样本空间缩小到已知发生的 B 内；检验独立性的唯一数学标准是 P(A ∩ B) = P(A)·P(B)（切勿把「独立」与「互斥」混为一谈！）。',
        src: 'UNSW 标准学术英文 · T2 W6 Conditional Probability'
      }
    ],
    examQA: [
      {
        qEn: 'Explain clearly why two non-empty Mutually Exclusive events CANNOT be Independent.',
        qZh: '请解释为什么两个发生概率均大于 0 的「互斥事件（Mutually Exclusive）」绝不可能是「独立事件（Independent）」？',
        tag: '经典概念陷阱 · 4 分',
        points: [
          {
            en: 'If A and B are mutually exclusive, they cannot occur together so P(A ∩ B) = 0.',
            zh: '若互斥，两者不能同时发生，交集概率 P(A ∩ B) = 0。'
          },
          {
            en: 'However, since P(A) > 0 and P(B) > 0, their product P(A)·P(B) > 0 ≠ 0 = P(A ∩ B), violating independence — knowing A occurred guarantees B did NOT occur!',
            zh: '但 P(A)·P(B) > 0 ≠ 0，违背独立条件——直觉上只要 A 发生了就 100% 断定 B 没发生，二者强烈相关！'
          }
        ],
        keywords: ['P(A∩B) = 0', 'P(A)P(B) > 0', 'knowing A guarantees not-B']
      }
    ]
  },

  'term2:7': {
    concepts: [
      {
        term: 'Mean, Median & Mode vs Skewness（均值、中位数、众数与偏态）',
        en: 'The Mean uses every value and is sensitive to extreme outliers, whereas the Median (middle value) is resistant to outliers — making the Median preferred for skewed data such as house prices or incomes.',
        zh: '均值受极端异常值（Outliers）拉扯极大，而中位数抗干扰强，因此分析房价、收入等右偏（正偏）数据时应优先看中位数。',
        src: 'UNSW 标准学术英文 · T2 W7 Descriptive Statistics I'
      }
    ],
    examQA: [
      {
        qEn: 'In a positively (right) skewed distribution such as Sydney house prices, how are the Mean and Median ordered, and which measure of centre should be reported?',
        qZh: '在悉尼房价这类右偏（正偏）分布中，均值和中位数谁大谁小？报告哪一个中心指标更客观？',
        tag: '统计高频 · 4 分',
        points: [
          {
            en: 'High-value outliers in the long right tail pull the Mean upward, so Mean > Median.',
            zh: '右侧长尾的超高价豪宅把均值拉高，故 均值 > 中位数。'
          },
          {
            en: 'The Median should be reported because it is unaffected by extreme outliers and better reflects a typical household’s experience.',
            zh: '应报告中位数，因为它不受少数天价豪宅干扰，更能代表普通买家面对的典型房价。'
          }
        ],
        keywords: ['right-skewed -> Mean > Median', 'Median resistant to outliers']
      }
    ]
  },

  'term2:8': {
    concepts: [
      {
        term: 'Standard Deviation, IQR & Outlier Rule（标准差、四分位距与异常值判定）',
        en: 'Standard deviation measures average spread around the mean, while Interquartile Range (IQR = Q₃ − Q₁) measures spread of the middle 50%; values below Q₁ − 1.5·IQR or above Q₃ + 1.5·IQR are classified as outliers.',
        zh: '标准差衡量数据绕均值的离散程度，四分位距 IQR 衡量中间 50% 数据的跨度；超出 Q₁ − 1.5·IQR 或 Q₃ + 1.5·IQR 的点判定为异常值（Outliers）。',
        src: 'UNSW 标准学术英文 · T2 W8 Descriptive Statistics II'
      }
    ],
    examQA: [
      {
        qEn: 'When comparing two investment funds with identical average annual returns (8%), Fund A has SD = 4% and Fund B has SD = 15%. Interpret this difference for a conservative investor.',
        qZh: '两只基金年均回报都是 8%，基金 A 标准差 4%，基金 B 标准差 15%。请向保守型投资者解释二者差异。',
        tag: '统计解读 · 4 分',
        points: [
          {
            en: 'Standard deviation measures volatility (risk); Fund A’s returns stay tightly clustered near 8%, whereas Fund B swings wildly between big gains and sharp losses — so a conservative investor should choose Fund A.',
            zh: '标准差衡量波动与风险；A 回报紧贴 8% 极其稳健，B 大起大落风险远高于 A，保守型投资者应选基金 A。'
          }
        ],
        keywords: ['SD = volatility / risk', 'Fund A more consistent']
      }
    ]
  },

  'term2:9': {
    concepts: [
      {
        term: 'Correlation (r), R² & Least-Squares Regression（相关系数、决定系数与回归直线）',
        en: 'Correlation r ∈ [−1, 1] measures the strength and direction of a LINEAR relationship; R² gives the percentage of variation in y explained by x; correlation does NOT imply causation, and extrapolation beyond observed x-values is unreliable.',
        zh: '相关系数 r 衡量线性相关强度与方向；R² 表示 y 的变动中有百分之多少可由 x 解释；切记「相关不等于因果」，且超出样本范围的外推预测（Extrapolation）不可靠！',
        src: 'UNSW 标准学术英文 · T2 W9 Bivariate Data'
      }
    ],
    examQA: [
      {
        qEn: 'A regression of Ice Cream Sales (y) on Temperature (x, 15°C–35°C) yields ŷ = −120 + 25x with r = 0.92. Interpret the gradient (25), R², and explain why predicting sales at x = 5°C is risky.',
        qZh: '回归方程 ŷ = −120 + 25x（样本温度 15°C–35°C，r = 0.92），解释斜率 25、R²，并说明为何预测 5°C 时不可靠。',
        tag: '回归必考大题 · 5 分',
        points: [
          {
            en: 'Gradient = 25: For every 1°C increase in temperature, ice cream sales increase on average by 25 units.',
            zh: '斜率 25：气温每升高 1°C，冰淇淋销量平均增加 25 份。'
          },
          {
            en: 'R² = 0.92² = 0.8464 (84.6%): 84.6% of the variation in ice cream sales is explained by the linear relationship with temperature.',
            zh: 'R² = 84.6%：销量变动的 84.6% 可由气温线性变化解释。'
          },
          {
            en: 'Predicting at 5°C is EXTRAPOLATION outside the 15°C–35°C data range (and even yields an impossible negative sales value of +5 or negative at colder temperatures) — the linear relationship may not hold outside observed data.',
            zh: '5°C 超出 15°C–35°C 样本观测区间，属于不可靠的外推预测（Extrapolation），线性关系在区间外可能不再成立。'
          }
        ],
        keywords: ['average increase per 1 unit of x', 'R² = 84.6% explained', 'Extrapolation unreliable']
      }
    ]
  },

  'term2:10': {
    concepts: [
      {
        term: 'Discrete Random Variable, Expected Value E(X) & Variance（离散随机变量与期望方差）',
        en: 'A valid discrete probability distribution satisfies 0 ≤ P(X=x) ≤ 1 and Σ P(X=x) = 1. Expected value E(X) = Σ x·P(x) is the long-run average outcome, and Var(X) = E(X²) − [E(X)]².',
        zh: '有效离散分布要求所有概率非负且之和恒为 1；期望值 E(X) = Σ x·P(x) 代表长期平均收益，方差用计算公式 E(X²) − [E(X)]² 最快捷。',
        src: 'UNSW 标准学术英文 · T2 W10 Discrete RVs'
      }
    ],
    examQA: [
      {
        qEn: 'A game costs $5 to play: you win $20 with probability 0.2 and $0 otherwise. Calculate the player’s Expected Net Profit and state whether the game is fair.',
        qZh: '玩一次游戏收费 $5，有 0.2 概率赢 $20，其余情况得 $0。求玩家期望净收益，并判断游戏是否公平。',
        tag: '期望值必考 · 4 分',
        points: [
          {
            en: 'Expected payout = 20(0.2) + 0(0.8) = $4; Expected Net Profit = $4 − $5 = −$1 per game.',
            zh: '期望奖金 = $4，减去票价 $5 得期望净收益 = −$1/局。'
          },
          {
            en: 'Because Expected Net Profit ≠ 0 (negative), the game is NOT fair and favours the organiser in the long run.',
            zh: '期望净收益不为 0（为负），游戏不公平，长期玩玩家必亏。'
          }
        ],
        keywords: ['E(Net) = -$1', 'Fair game requires E(Net) = 0']
      }
    ]
  },

  'term2:11': {
    concepts: [
      {
        term: 'Binomial Distribution X ~ B(n, p)（二项分布四大条件与公式）',
        en: 'Use X ~ B(n, p) when there are n fixed independent trials, each with only two outcomes (success/failure) and constant probability p: P(X = k) = C(n, k) pᵏ (1 − p)ⁿ⁻ᵏ, with Mean μ = np and Variance σ² = np(1 − p).',
        zh: '满足「固定次数 n、彼此独立、非成即败、成功率 p 恒定」即用二项分布，均值 μ = np，方差 σ² = np(1 − p)。',
        src: 'UNSW 标准学术英文 · T2 W11 Binomial Distribution'
      }
    ],
    examQA: [
      {
        qEn: 'State the four conditions required for a Binomial model, and find P(at least 1 defective) when inspecting n = 5 items each with defect probability p = 0.1.',
        qZh: '写出二项分布的四个前提条件，并计算抽检 5 件产品（次品率 0.1）至少发现 1 件次品的概率。',
        tag: '二项分布必考 · 5 分',
        points: [
          {
            en: 'Four conditions (BINS): Binary outcomes, Independent trials, fixed Number of trials n, Same probability p per trial.',
            zh: '四条件（口诀 BINS）：二元结果、试验独立、次数 n 固定、每次成功率 p 不变。'
          },
          {
            en: 'P(X ≥ 1) = 1 − P(X = 0) = 1 − (0.9)⁵ = 1 − 0.59049 = 0.4095 (40.95%).',
            zh: '用补集 1 − P(全合格) = 1 − 0.9⁵ ≈ 0.4095。'
          }
        ],
        keywords: ['BINS conditions', '1 - P(X=0) = 0.4095']
      }
    ]
  },

  'term2:12': {
    concepts: [
      {
        term: 'Continuous Random Variables & Probability Density Function (PDF)（连续随机变量与概率密度函数）',
        en: 'For a continuous RV, probability equals the AREA under the PDF f(x): ∫ f(x) dx = 1 over its support, f(x) ≥ 0, and the probability at any single exact point is zero (P(X = c) = 0).',
        zh: '连续变量的概率等于密度曲线 f(x) 下方的定积分面积（总面积恒为 1），且单点概率永远为 0（因此 P(X < c) = P(X ≤ c)）。',
        src: 'UNSW 标准学术英文 · T2 W12 Continuous RVs'
      }
    ],
    examQA: [
      {
        qEn: 'A continuous RV has PDF f(x) = kx on [0, 4] and 0 elsewhere. Find the constant k and calculate P(X > 2).',
        qZh: '连续变量密度函数在 [0, 4] 上为 f(x) = kx（其余为 0），求常数 k 以及 P(X > 2)。',
        tag: '密度函数必考 · 5 分',
        points: [
          {
            en: 'Total area must equal 1: ∫₀⁴ kx dx = [kx²/2]₀⁴ = 8k = 1 → k = 1/8.',
            zh: '令总面积积分 = 1：8k = 1 → 解得 k = 1/8。'
          },
          {
            en: 'P(X > 2) = ∫₂⁴ (x/8) dx = [x²/16]₂⁴ = 16/16 − 4/16 = 12/16 = 0.75.',
            zh: '从 2 积到 4 得 1 − 0.25 = 0.75。'
          }
        ],
        keywords: ['∫ f(x) dx = 1 -> k = 1/8', 'P(X > 2) = 0.75']
      }
    ]
  },

  'term2:13': {
    concepts: [
      {
        term: 'Normal Distribution & Z-Score Standardisation（正态分布与 Z 标准化）',
        en: 'Any normal variable X ~ N(μ, σ²) is converted to the Standard Normal Z ~ N(0, 1) via Z = (X − μ) / σ; by the Empirical Rule, roughly 68%, 95% and 99.7% of values lie within 1, 2 and 3 standard deviations of the mean.',
        zh: '任何正态分布都通过 Z = (X − μ)/σ 标准化查表；68–95–99.7 经验法则可用来快速验算结果是否合理，做题前先画钟形图涂阴影！',
        src: 'UNSW 标准学术英文 · T2 W13 Normal Distribution'
      }
    ],
    examQA: [
      {
        qEn: 'Exam scores follow N(70, 10²). Find the probability a random student scores above 85, and find the score needed to be in the top 5% (z = 1.645).',
        qZh: '考试成绩服从正态分布 N(70, 10²)，求高于 85 分的概率以及进入前 5%（z = 1.645）所需的最低分数。',
        tag: '正态双题必考 · 5 分',
        points: [
          {
            en: 'Standardise: Z = (85 − 70) / 10 = 1.5 → P(X > 85) = P(Z > 1.5) = 1 − 0.9332 = 0.0668 (6.68%).',
            zh: '标准化得 Z = 1.5，右尾概率 = 1 − Φ(1.5) = 0.0668。'
          },
          {
            en: 'Inverse Normal for top 5%: (x − 70) / 10 = 1.645 → x = 70 + 16.45 = 86.45 marks.',
            zh: '逆正态反求：x = μ + zσ = 70 + 1.645 × 10 = 86.45 分。'
          }
        ],
        keywords: ['Z = (X - μ)/σ', 'P(Z > 1.5) = 0.0668', 'Inverse Normal x = 86.45']
      }
    ]
  },

  'term2:14': {
    concepts: [
      {
        term: 'Term 2 Master Identification Flowchart（Term 2 期末 10 秒定题型）',
        en: 'Match keywords immediately: equal periodic payments → Annuity PV/FV; order matters → nPr else nCr; "given that" → Conditional P(A|B); fixed n independent trials → Binomial; bell-shaped continuous → Normal Z-score.',
        zh: '审题抓关键词秒选题型：定期等额收付→年金；看顺序→排列/不看→组合；"given that"→条件概率；固定次独立成败→二项；钟形连续→正态 Z 标准化。',
        src: 'UNSW 标准学术英文 · T2 W14 Exam Revision'
      }
    ],
    examQA: [
      {
        qEn: 'How can you distinguish immediately between a Binomial problem and a Normal problem in the final exam?',
        qZh: '期末考场里如何 5 秒区分一道概率题该用「二项分布」还是「正态分布」？',
        tag: '考场识别 · 3 分',
        points: [
          {
            en: 'Binomial counts a DISCRETE integer number of successes out of n trials (given n and p); Normal models a CONTINUOUS measurement like weight, time or score (given mean μ and standard deviation σ).',
            zh: '二项分布数的是「n 次中成功了几次」离散整数（题给 n 和 p）；正态分布测的是身高/时间/分数等连续变量（题给均值 μ 和标准差 σ）。'
          }
        ],
        keywords: ['discrete count (n, p)', 'continuous measurement (μ, σ)']
      }
    ]
  }
};
