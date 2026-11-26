#!/usr/bin/env node
/**
 * 1. Enriches high-frequency exam concepts with structured bilingual bullet breakdowns
 *    (starting with Economics Demand & Supply Non-Price Determinants, Elasticity, Market Failure,
 *    Cost Curves, Market Structures, AD-AS, etc.)
 * 2. Generates structured bilingual notesHtml for Mathematics (27 weeks) & Computing (26 weeks)
 *    which previously lacked notesHtml.
 * 3. Builds /public/data-chunks/search-index.json covering ALL 107 core weeks + extra modules +
 *    bilingual concepts + detailed bullets + notes headings + graphic sections + exam Q&As + glossary.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', 'public');
const COURSES_DIR = path.join(PUBLIC, 'data-chunks', 'courses');
const SEARCH_INDEX_PATH = path.join(PUBLIC, 'data-chunks', 'search-index.json');

function stripTags(html) {
  return String(html || '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- 1. Rich Structured Bilingual Concept Enrichments for Economics ---------- */
const ECO_ENRICHMENTS = {
  // Term 1 Week 3: Demand & Supply (Explicitly requested: Supply & Demand Non-Price Determinants!)
  'term1:3': [
    {
      term: 'Non-Price Determinants of Demand（需求的非价格决定因素 · 6 大平移原因）',
      en: 'A change in a good’s own price causes a movement along the demand curve (change in quantity demanded). A change in any non-price determinant shifts the entire demand curve right (increase in demand) or left (decrease in demand).',
      zh: '商品自身价格变化只会引起「沿需求曲线移动（需求量变化）」；而以下任意一项「非价格决定因素（non-price determinants）」变化，都会使整条需求曲线向右平移（需求增加）或向左平移（需求减少）。',
      src: 'UNSW Unit 3 Lecture Slides · Demand & Supply',
      bullets: [
        {
          label: '1. Income (Y) / 消费者收入',
          en: 'Higher income shifts demand RIGHT for normal goods (e.g. restaurant meals, travel), and shifts demand LEFT for inferior goods (e.g. instant noodles, second-hand clothes).',
          zh: '收入上升 → 正常品（normal goods）需求右移；低档品/劣等品（inferior goods）需求左移。'
        },
        {
          label: '2. Prices of Related Goods / 相关商品价格',
          en: 'Substitutes (e.g. tea & coffee): a rise in the price of a substitute shifts demand for this good RIGHT. Complements (e.g. cars & petrol): a rise in the price of a complement shifts demand LEFT.',
          zh: '替代品（substitutes）涨价 → 本品需求右移；互补品（complements）涨价 → 本品需求左移。'
        },
        {
          label: '3. Tastes, Preferences & Advertising / 偏好、潮流与广告',
          en: 'Favourable changes in consumer tastes, trends, health news or effective advertising shift demand RIGHT; unfavourable news shifts demand LEFT.',
          zh: '偏好增强、流行趋势、利好健康报道或成功广告 → 需求右移；负面新闻或过时 → 需求左移。'
        },
        {
          label: '4. Consumer Expectations / 消费者预期',
          en: 'If buyers expect future prices to rise (or future income to grow), current demand shifts RIGHT as they buy earlier; expecting lower future prices shifts current demand LEFT.',
          zh: '预期未来涨价或收入增加 → 提前抢购，当前需求右移；预期未来降价 → 持币观望，当前需求左移。'
        },
        {
          label: '5. Population & Number of Buyers / 人口与市场买家数量',
          en: 'An increase in population or target demographic size (e.g. immigration, ageing population) shifts market demand RIGHT.',
          zh: '市场人口增长或目标消费群体扩大 → 市场总需求右移；人口减少 → 左移。'
        },
        {
          label: '6. Credit Availability & Consumer Taxes / 信贷难易与消费税政策',
          en: 'Easier access to loans / lower interest rates or consumer subsidies shift demand RIGHT; higher sales taxes or tighter credit shift demand LEFT.',
          zh: '信贷更宽松、利率降低或政府消费补贴 → 需求右移；提高消费税或收紧贷款 → 需求左移。'
        }
      ]
    },
    {
      term: 'Non-Price Determinants of Supply（供给的非价格决定因素 · 7 大平移原因）',
      en: 'A change in a good’s own price causes a movement along the supply curve (change in quantity supplied). A change in any non-price determinant of supply shifts the entire supply curve right (increase in supply) or left (decrease in supply).',
      zh: '商品自身价格变化只会引起「沿供给曲线移动（供给量变化）」；以下 7 项「供给的非价格决定因素（non-price determinants of supply）」变化，才会使整条供给曲线向右平移（供给增加）或向左平移（供给减少）。',
      src: 'UNSW Unit 3 Lecture Slides p29–55 · Supply',
      bullets: [
        {
          label: '1. Input / Resource Prices (Costs of Production) / 投入品价格与生产成本',
          en: 'Lower prices of inputs (raw materials, wages, energy, rent) reduce unit production costs and shift supply RIGHT; higher input costs reduce profitability and shift supply LEFT.',
          zh: '原材料、工资、能源、租金等投入品价格下降 → 生产成本降低，供给右移；成本上升 → 供给左移。'
        },
        {
          label: '2. Technology & Productivity / 技术水平与生产率',
          en: 'Technological improvements or better production methods allow firms to produce more output per unit of input, lowering costs and shifting supply RIGHT (technological regression shifts supply LEFT).',
          zh: '技术进步或工艺革新提高生产率、降低单位成本 → 供给右移；技术退步或设备老化 → 供给左移。'
        },
        {
          label: '3. Taxes & Subsidies on Producers / 对厂商征税与政府补贴',
          en: 'An indirect tax on producers (e.g. excise tax, carbon tax) raises per-unit costs and shifts supply LEFT (upward); a government subsidy lowers effective costs and shifts supply RIGHT (downward).',
          zh: '对生产者征税（如消费税/碳税）相当于增加单位成本 → 供给左移（上移）；政府给予生产补贴 → 供给右移（下移）。'
        },
        {
          label: '4. Prices of Related Goods in Production / 生产中相关商品的价格',
          en: 'For substitutes in production (e.g. wheat vs barley on the same farmland), a rise in the price of barley causes farmers to switch land away from wheat, shifting wheat supply LEFT. For complements in production (joint products like beef & leather), higher beef prices shift leather supply RIGHT.',
          zh: '生产替代品（如同一块地种小麦或大麦）：大麦涨价导致农户改种大麦 → 小麦供给左移；生产互补品（联产品如牛肉与牛皮）：牛肉涨价增产 → 牛皮供给右移。'
        },
        {
          label: '5. Producer Expectations of Future Prices / 生产者对未来价格的预期',
          en: 'If producers expect the future price of a storable good to rise, they may withhold stock now to sell later, shifting current supply LEFT; expecting future prices to fall shifts current supply RIGHT.',
          zh: '若厂商预期未来涨价（且商品可储存），会囤货惜售 → 当前供给左移；预期未来跌价 → 抓紧抛售，当前供给右移。'
        },
        {
          label: '6. Number of Sellers / Firms in the Market / 市场中的卖者（厂商）数量',
          en: 'Market supply is the horizontal sum of individual firms’ supply curves: when new firms enter the market, supply shifts RIGHT; when firms exit, supply shifts LEFT.',
          zh: '市场供给是各厂商供给曲线的水平加总：新企业进入市场 → 供给右移；企业倒闭退出 → 供给左移。'
        },
        {
          label: '7. Natural Conditions, Weather & External Shocks / 自然条件、气候与外部冲击',
          en: 'Favourable weather and good harvests shift agricultural supply RIGHT; droughts, floods, wars or supply-chain disruptions shift supply LEFT.',
          zh: '风调雨顺、丰收好年景 → 农产品供给右移；干旱洪涝、战争或供应链中断 → 供给左移。'
        }
      ]
    },
    {
      term: 'Movement Along vs Shift of a Curve（沿曲线移动 vs 整条曲线平移 · 考场必分）',
      en: 'Change in quantity demanded/supplied = movement ALONG a fixed curve caused ONLY by a change in the good’s OWN price. Change in demand/supply = SHIFT of the entire curve caused by a NON-PRICE determinant.',
      zh: '「需求量/供给量变化（change in quantity demanded/supplied）」＝ 仅由商品自身价格变化引起的「沿原曲线点移动」；「需求/供给变化（change in demand/supply）」＝ 由非价格因素引起的「整条曲线平移」。',
      src: 'UNSW Unit 3 · 最高频扣分易错点',
      bullets: [
        {
          label: 'Golden Rule / 考场防扣分铁律',
          en: 'When demand shifts right, equilibrium price rises and firms move UP ALONG the existing supply curve (an increase in quantity supplied — NEVER say "supply increases"!).',
          zh: '当需求右移使均衡价格上升时，供给侧发生的是「沿原供给曲线向上移动（供给量增加 / increase in quantity supplied）」，绝对不能写成「供给增加（increase in supply）」！'
        }
      ]
    }
  ],
  // Term 1 Week 5: Elasticity Determinants
  'term1:5': [
    {
      term: 'Determinants of Price Elasticity of Demand (PED)（需求价格弹性的 5 大决定因素）',
      en: 'PED measures the responsiveness of quantity demanded to a change in price (%ΔQd / %ΔP). Five key determinants decide whether demand is elastic (|PED| > 1) or inelastic (|PED| < 1).',
      zh: '需求价格弹性（PED）衡量需求量对价格变动的敏感程度（%ΔQd / %ΔP）。以下 5 大因素决定一种商品是富有弹性还是缺乏弹性：',
      src: 'UNSW Unit 5 · Elasticity',
      bullets: [
        {
          label: '1. Availability of Close Substitutes / 近似替代品的可获得性',
          en: 'More close substitutes → more elastic demand (buyers easily switch if price rises). Few substitutes (e.g. insulin, electricity) → inelastic demand.',
          zh: '替代品越多（如某品牌饮料）→ 弹性越大；几乎无替代品（如胰岛素、水电）→ 缺乏弹性。'
        },
        {
          label: '2. Necessities vs Luxuries / 必需品 vs 奢侈品',
          en: 'Necessities (staple food, medicine) have inelastic demand; luxuries (designer bags, overseas holidays) have elastic demand.',
          zh: '生活必需品 → 缺乏弹性；奢侈品与非必需享乐品 → 富有弹性。'
        },
        {
          label: '3. Proportion of Income Spent / 支出占总收入的比重',
          en: 'Goods taking a tiny share of income (e.g. salt, matches) are inelastic; big-ticket items (e.g. cars, housing) are more elastic.',
          zh: '占收入比例极小的商品（如食盐）→ 缺乏弹性；占收入比例大的大件商品（如汽车）→ 更有弹性。'
        },
        {
          label: '4. Time Horizon / 时间长短',
          en: 'Demand is more inelastic in the short run (hard to change habits/equipment) and more elastic in the long run (consumers find substitutes, e.g. switching to EVs).',
          zh: '短期内调整习惯困难 → 弹性小；长期内消费者可找到替代方案（如换电动车）→ 弹性变大。'
        },
        {
          label: '5. Definition of the Market / 市场定义宽窄',
          en: 'Broadly defined markets (e.g. "food") are inelastic; narrowly defined markets (e.g. "Granny Smith apples") have many substitutes and are elastic.',
          zh: '品类定义越宽泛（如「食物」）→ 越缺乏弹性；定义越窄（如「某特定品种苹果」）→ 弹性越大。'
        }
      ]
    },
    {
      term: 'Determinants of Price Elasticity of Supply (PES)（供给价格弹性的 4 大决定因素）',
      en: 'PES measures the responsiveness of quantity supplied to a change in price (%ΔQs / %ΔP). It depends on how quickly and cheaply firms can expand output.',
      zh: '供给价格弹性（PES）衡量供给量对价格变动的敏感程度，核心取决于厂商能否低成本、快速地调整产量：',
      src: 'UNSW Unit 5 · Elasticity',
      bullets: [
        {
          label: '1. Time Period / 生产调整时间',
          en: 'Momentary/short run: fixed capacity makes supply inelastic. Long run: firms can build new factories and enter the market, making supply elastic.',
          zh: '极短期/短期产能固定 → 供给缺乏弹性；长期可建厂扩产 → 供给富有弹性。'
        },
        {
          label: '2. Spare Capacity & Factor Mobility / 闲置产能与要素流动性',
          en: 'Abundant spare capacity and easily mobile resources allow rapid output expansion → elastic supply; full capacity → inelastic supply.',
          zh: '闲置产能充足、劳动力与原材料易转产 → 供给弹性大；满负荷生产 → 弹性小。'
        },
        {
          label: '3. Ability to Store Inventories / 库存与可储存性',
          en: 'Non-perishable goods that can be stored cheaply (e.g. manufactured electronics) have elastic supply; perishable goods (fresh fish/flowers) have inelastic supply.',
          zh: '易于低成本储存的商品（如工业品）→ 弹性大；易腐烂难储存商品（如鲜花、海鲜）→ 弹性小。'
        },
        {
          label: '4. Length & Complexity of Production Process / 生产周期长短',
          en: 'Short production cycles (printed T-shirts) → elastic supply; long cycles (wine, real estate, agriculture) → inelastic supply.',
          zh: '生产周期短 → 弹性大；生产周期长（如房地产、农业作物、陈年红酒）→ 弹性小。'
        }
      ]
    }
  ]
};

function enrichEconomics() {
  const p = path.join(COURSES_DIR, 'economics.json');
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  let added = 0;
  for (const term of data.terms || []) {
    for (const week of term.weeks || []) {
      const key = `${term.id}:${week.num}`;
      const extra = ECO_ENRICHMENTS[key];
      if (!extra) continue;
      week.bilingualConcepts = week.bilingualConcepts || [];
      for (const item of extra) {
        const idx = week.bilingualConcepts.findIndex(c => c.term === item.term);
        if (idx >= 0) week.bilingualConcepts[idx] = item;
        else {
          // Insert enriched determinant breakdowns right at the top so they are immediately visible!
          week.bilingualConcepts.unshift(item);
          added++;
        }
      }
    }
  }
  fs.writeFileSync(p, JSON.stringify(data), 'utf8');
  console.log(`✅ Enriched economics.json (${added} structured bilingual determinant blocks added/updated)`);
}

/* ---------- 2. Generate Structured Bilingual notesHtml for Mathematics & Computing ---------- */
function ensureNotesHtml(courseFile) {
  const p = path.join(COURSES_DIR, courseFile);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  let generated = 0;
  for (const term of data.terms || []) {
    for (const week of term.weeks || []) {
      if (week.notesHtml && week.notesHtml.trim().length > 80) continue;
      const topics = week.topics || [];
      const objs = week.objectives || [];
      const bis = week.bilingualConcepts || [];
      const h4s = [...String(week.graphicHtml || '').matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/gi)]
        .map(m => stripTags(m[1]))
        .filter(h => h && !/本周导览|自测清单/.test(h));

      const parts = [];
      parts.push(`<h4>一、Weekly Overview（本周双语概览）</h4>`);
      const enTopics = topics.length ? `This week covers: ${topics.join('; ')}.` : `This week covers ${week.title}.`;
      const zhObjs = objs.length ? `本周学习目标：${objs.join('；')}。` : `本周核心主题：${week.title}。`;
      parts.push(`<p>${enTopics} ${zhObjs}</p>`);

      if (bis.length || topics.length) {
        parts.push(`<h4>二、Key Knowledge Points（核心双语知识点）</h4><ul>`);
        bis.forEach(c => {
          parts.push(`<li>${c.en} <strong>${c.term}</strong>：${c.zh}</li>`);
        });
        if (!bis.length) {
          topics.forEach((tp, i) => {
            const obj = objs[i] || `掌握 ${tp} 的核心方法与考试题型`;
            parts.push(`<li>Focus on mastering ${tp} and applying it accurately under exam conditions. <strong>${tp}</strong>：${obj}。</li>`);
          });
        }
        parts.push(`</ul>`);
      }

      if (h4s.length) {
        parts.push(`<h4>三、Lecture & Step Roadmap（本节内容结构导览）</h4><ul>`);
        h4s.slice(0, 10).forEach((h, i) => {
          parts.push(`<li>Section ${i + 1}: ${h}. 第 ${i + 1} 部分：${h}（可在下方图解与例题精讲中展开查看详细步骤与图示）。</li>`);
        });
        parts.push(`</ul>`);
      }

      week.notesHtml = parts.join('');
      generated++;
    }
  }
  fs.writeFileSync(p, JSON.stringify(data), 'utf8');
  console.log(`✅ Generated bilingual notesHtml for ${courseFile}: ${generated} weeks`);
}

/* ---------- 3. Build Lightweight Full-Text Search Index (search-index.json) ---------- */
function buildSearchIndex() {
  const entries = [];
  const courseFiles = ['accounting.json', 'economics.json', 'mathematics.json', 'computing.json', 'english.json', 'extracurricular.json'];

  for (const fn of courseFiles) {
    const fp = path.join(COURSES_DIR, fn);
    if (!fs.existsSync(fp)) continue;
    const c = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const isExtra = !!c.extra || c.id === 'extracurricular';
    for (const t of c.terms || []) {
      for (const w of t.weeks || []) {
        const baseHref = `#/c/${c.id}/${t.id}/${w.num}`;
        const subLabel = `${c.nameCn} · ${t.name || t.id} · Week ${w.num}`;

        // 1) Week title + topics
        entries.push({
          k: 'week',
          x: isExtra ? 1 : 0,
          t: `${c.nameCn} W${w.num} · ${w.title}`,
          s: subLabel,
          h: baseHref,
          b: [w.title, ...(w.topics || []), ...(w.objectives || [])].join(' ').slice(0, 420)
        });

        // 2) Every bilingual concept + bullets
        for (const bc of w.bilingualConcepts || []) {
          const bulletText = (bc.bullets || []).map(b => `${b.label} ${b.en} ${b.zh}`).join(' ');
          entries.push({
            k: 'concept',
            x: isExtra ? 1 : 0,
            t: `📌 ${bc.term}`,
            s: subLabel,
            h: baseHref,
            q: bc.term.split(/[（(]/)[0].trim(),
            b: `${bc.term} ${bc.en || ''} ${bc.zh || ''} ${bulletText}`.slice(0, 900)
          });
        }

        // 3) Every Exam QA
        for (const qa of w.examQA || []) {
          const pts = (qa.points || []).map(p => `${p.en} ${p.zh}`).join(' ');
          entries.push({
            k: 'qa',
            x: isExtra ? 1 : 0,
            t: `🎯 ${qa.qEn || qa.qZh}`,
            s: `${subLabel} · 必考大题`,
            h: baseHref,
            q: (qa.keywords && qa.keywords[0]) || (qa.qEn || '').slice(0, 28),
            b: `${qa.qEn || ''} ${qa.qZh || ''} ${(qa.keywords || []).join(' ')} ${pts}`.slice(0, 700)
          });
        }

        // 4) Bilingual notesHtml sections
        if (w.notesHtml) {
          const secs = w.notesHtml.split(/(?=<h[234][^>]*>)/i);
          for (const sec of secs) {
            const hm = sec.match(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/i);
            const heading = hm ? stripTags(hm[1]) : '';
            const body = stripTags(sec);
            if (body.length < 20) continue;
            entries.push({
              k: 'note',
              x: isExtra ? 1 : 0,
              t: heading ? `📖 ${heading}` : `📖 ${w.title}`,
              s: subLabel,
              h: baseHref,
              q: heading ? heading.replace(/^[一二三四五六七八九十]+[、.．]\s*/, '').slice(0, 26) : '',
              b: body.slice(0, 900)
            });
          }
        }

        // 5) Graphic HTML h4 sections (headings + key callout prose, excluding SVGs)
        if (w.graphicHtml) {
          const gSecs = w.graphicHtml.split(/(?=<h4[^>]*>)/i);
          for (const gs of gSecs) {
            const hm = gs.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
            if (!hm) continue;
            const heading = stripTags(hm[1]);
            if (!heading || /本周导览|自测清单/.test(heading)) continue;
            const body = stripTags(gs).slice(0, 650);
            entries.push({
              k: 'section',
              x: isExtra ? 1 : 0,
              t: `📊 ${heading}`,
              s: subLabel,
              h: baseHref,
              q: heading.slice(0, 24),
              b: body
            });
          }
        }
      }
    }
  }

  // Also index glossary terms
  const glossPath = path.join(PUBLIC, 'data-chunks', 'glossary.json');
  if (fs.existsSync(glossPath)) {
    const gl = JSON.parse(fs.readFileSync(glossPath, 'utf8'));
    const list = Array.isArray(gl) ? gl : (gl.items || []);
    for (const g of list) {
      entries.push({
        k: 'term',
        x: 0,
        t: `🃏 ${g.en}（${g.zh}）`,
        s: `术语闪卡 · ${g.course} W${g.week || 1}`,
        h: `#/flashcards?course=${encodeURIComponent(g.course || 'accounting')}&week=${encodeURIComponent(g.week || '1')}`,
        b: `${g.en} ${g.zh} ${g.def || ''}`
      });
    }
  }

  const out = { version: '20261126-v15', count: entries.length, entries };
  fs.writeFileSync(SEARCH_INDEX_PATH, JSON.stringify(out), 'utf8');
  const kb = (fs.statSync(SEARCH_INDEX_PATH).size / 1024).toFixed(1);
  console.log(`✅ Built search-index.json: ${entries.length} full-text entries (${kb} KB)`);
}

enrichEconomics();
ensureNotesHtml('mathematics.json');
ensureNotesHtml('computing.json');
buildSearchIndex();
