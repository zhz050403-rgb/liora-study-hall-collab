#!/usr/bin/env node
/**
 * 注入「讲义没细讲 · 但做题和考试必考必会」隐性高频破题技能（覆盖五科 27 项）
 * - 自动幂等注入到 5 个课程 JSON 的对应周 week.bilingualConcepts 顶部（带 mustKnow:true 标识与配套矢量图解 svgHtml）
 * - 自动同步汇总到 public/data-chunks/handbooks.json 的每科 mustKnowToolkit 字段
 * - 使用完后请紧接着运行 node scripts/enrich-bilingual-and-search.mjs 刷新全站搜索索引
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '../public');
const COURSES_DIR = path.join(PUBLIC, 'data-chunks', 'courses');
const HANDBOOKS_PATH = path.join(PUBLIC, 'data-chunks', 'handbooks.json');

/* ==================== 4 张高精度考场破题矢量图解 (SVG) ==================== */
const SVG_FX_TO_FPRIME = `<div class="diagram"><svg viewBox="0 0 760 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="由 f(x) 图像画导函数 f'(x) 图像的五步垂直对齐图解">
  <rect width="760" height="440" rx="12" fill="#fdfcf8" stroke="#d9e2ec"/>
  <text x="20" y="26" font-size="14" font-weight="700" fill="#0f2744">五步垂直对齐法：由原函数 f(x)（上）画出导函数 f'(x)（下）</text>
  <text x="530" y="26" font-size="12" fill="#9f7820" font-weight="700">右侧附：尖点不可导（空心圆）</text>

  <!-- Left panel: Smooth cubic f(x) -> parabola f'(x) -->
  <!-- Vertical alignment dashed guides -->
  <line x1="150" y1="52" x2="150" y2="405" stroke="#c99b3b" stroke-width="1.4" stroke-dasharray="5,4"/>
  <line x1="255" y1="52" x2="255" y2="405" stroke="#2b5a92" stroke-width="1.3" stroke-dasharray="4,4"/>
  <line x1="360" y1="52" x2="360" y2="405" stroke="#c99b3b" stroke-width="1.4" stroke-dasharray="5,4"/>

  <!-- Top axes: f(x) -->
  <line x1="40" y1="145" x2="470" y2="145" stroke="#64748b" stroke-width="1.4"/>
  <line x1="255" y1="48" x2="255" y2="215" stroke="#94a3b8" stroke-width="1"/>
  <text x="455" y="138" font-size="12" fill="#475569" font-weight="700">x</text>
  <text x="50" y="64" font-size="13" fill="#0f2744" font-weight="700">原函数 y = f(x)</text>

  <!-- Shaded increasing / decreasing labels -->
  <rect x="65" y="192" width="76" height="19" rx="5" fill="#e6f6ee"/>
  <text x="72" y="206" font-size="11" fill="#16653e" font-weight="700">上升 f' &gt; 0</text>
  <rect x="176" y="192" width="158" height="19" rx="5" fill="#fdecec"/>
  <text x="184" y="206" font-size="11" fill="#b4322a" font-weight="700">下降 f' &lt; 0（中点最陡）</text>
  <rect x="372" y="192" width="76" height="19" rx="5" fill="#e6f6ee"/>
  <text x="379" y="206" font-size="11" fill="#16653e" font-weight="700">上升 f' &gt; 0</text>

  <!-- Cubic curve f(x): max at x=150 (y=78), inflection at x=255 (y=130), min at x=360 (y=182) -->
  <path d="M 70 198 C 102 128, 122 78, 150 78 C 185 78, 222 108, 255 130 C 288 152, 325 182, 360 182 C 390 182, 412 135, 442 62"
        fill="none" stroke="#0f2744" stroke-width="3" stroke-linecap="round"/>

  <!-- Horizontal tangents at max & min -->
  <line x1="120" y1="78" x2="180" y2="78" stroke="#c99b3b" stroke-width="2.2"/>
  <circle cx="150" cy="78" r="5" fill="#c99b3b"/>
  <text x="108" y="68" font-size="11" fill="#8f6814" font-weight="700">极大值(斜率=0)</text>

  <circle cx="255" cy="130" r="5" fill="#2b5a92"/>
  <text x="263" y="122" font-size="11" fill="#2b5a92" font-weight="700">拐点(下坡最陡)</text>

  <line x1="330" y1="182" x2="390" y2="182" stroke="#c99b3b" stroke-width="2.2"/>
  <circle cx="360" cy="182" r="5" fill="#c99b3b"/>
  <text x="322" y="172" font-size="11" fill="#8f6814" font-weight="700">极小值(斜率=0)</text>

  <!-- Bottom axes: f'(x) -->
  <line x1="40" y1="322" x2="470" y2="322" stroke="#64748b" stroke-width="1.6"/>
  <text x="455" y="315" font-size="12" fill="#475569" font-weight="700">x</text>
  <text x="50" y="250" font-size="13" fill="#b4322a" font-weight="700">导函数 y = f'(x)</text>
  <text x="46" y="316" font-size="10.5" fill="#16653e">正(+)</text>
  <text x="46" y="338" font-size="10.5" fill="#b4322a">负(-)</text>

  <!-- Parabola f'(x): zeros at 150 & 360, minimum at (255, 386) -->
  <path d="M 88 242 Q 255 530, 422 242" fill="none" stroke="#b4322a" stroke-width="3" stroke-linecap="round"/>

  <!-- Key mapped points on f'(x) -->
  <circle cx="150" cy="322" r="5.5" fill="#c99b3b" stroke="#fff" stroke-width="1.5"/>
  <text x="106" y="340" font-size="11" fill="#8f6814" font-weight="700">f'(x)=0</text>
  <circle cx="360" cy="322" r="5.5" fill="#c99b3b" stroke="#fff" stroke-width="1.5"/>
  <text x="366" y="340" font-size="11" fill="#8f6814" font-weight="700">f'(x)=0</text>
  <circle cx="255" cy="386" r="5.5" fill="#2b5a92" stroke="#fff" stroke-width="1.5"/>
  <text x="205" y="405" font-size="11" fill="#2b5a92" font-weight="700">f'(x) 最低点(最负斜率)</text>

  <!-- Divider -->
  <line x1="505" y1="45" x2="505" y2="415" stroke="#d9e2ec" stroke-width="1.5"/>

  <!-- Right panel: Sharp corner |x| -> step function with open circles -->
  <line x1="530" y1="165" x2="735" y2="165" stroke="#64748b" stroke-width="1.4"/>
  <line x1="632" y1="55" x2="632" y2="405" stroke="#c99b3b" stroke-width="1.3" stroke-dasharray="4,4"/>
  <text x="532" y="64" font-size="12.5" fill="#0f2744" font-weight="700">尖点例子：f(x) = |x|</text>
  <polyline points="548,82 632,165 716,82" fill="none" stroke="#0f2744" stroke-width="3" stroke-linejoin="miter"/>
  <text x="542" y="138" font-size="11" fill="#b4322a">斜率 = -1</text>
  <text x="674" y="138" font-size="11" fill="#16653e">斜率 = +1</text>
  <text x="590" y="183" font-size="11" fill="#b4322a" font-weight="700">尖点(不可导!)</text>

  <!-- Bottom right: step f'(x) -->
  <line x1="530" y1="322" x2="735" y2="322" stroke="#64748b" stroke-width="1.5"/>
  <text x="532" y="254" font-size="12.5" fill="#b4322a" font-weight="700">f'(x) 左右断开！</text>
  <line x1="548" y1="366" x2="627" y2="366" stroke="#b4322a" stroke-width="3"/>
  <circle cx="632" cy="366" r="5" fill="#fff" stroke="#b4322a" stroke-width="2.4"/>
  <line x1="637" y1="278" x2="716" y2="278" stroke="#16653e" stroke-width="3"/>
  <circle cx="632" cy="278" r="5" fill="#fff" stroke="#16653e" stroke-width="2.4"/>
  <text x="546" y="385" font-size="11" fill="#b4322a">y = -1（空心圆）</text>
  <text x="644" y="272" font-size="11" fill="#16653e">y = +1（空心圆）</text>
</svg><div class="cap">图解：先竖直对齐转折点（f'=0）与拐点（f'极值），再用正负定上下、陡缓定高低；遇到尖点必须断开画空心圆。</div></div>`;

const SVG_FPRIME_TO_FX = `<div class="diagram"><svg viewBox="0 0 740 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="逆向必考：看懂导函数 f'(x) 图像直接反推原函数 f(x) 特征">
  <rect width="740" height="270" rx="12" fill="#fdfcf8" stroke="#d9e2ec"/>
  <text x="20" y="26" font-size="14" font-weight="700" fill="#0f2744">逆向必考避坑：题目给的是 y = f'(x) 时，别把 f'(x) 的波峰当成 f(x) 的极大值！</text>

  <!-- Axes for given f'(x) -->
  <line x1="40" y1="150" x2="360" y2="150" stroke="#475569" stroke-width="1.6"/>
  <line x1="65" y1="52" x2="65" y2="245" stroke="#94a3b8" stroke-width="1.2"/>
  <text x="345" y="143" font-size="12" fill="#475569" font-weight="700">x</text>
  <text x="72" y="64" font-size="12.5" fill="#b4322a" font-weight="700">已知图像：y = f'(x)</text>

  <!-- Curve of f'(x): crosses x-axis at A(115), peaks at B(185, 82), crosses x-axis at C(255), troughs at D(305, 208) -->
  <path d="M 80 218 C 96 190, 105 168, 115 150 C 138 110, 160 82, 185 82 C 215 82, 238 118, 255 150 C 272 182, 286 210, 305 210 C 322 210, 336 188, 348 164"
        fill="none" stroke="#b4322a" stroke-width="3" stroke-linecap="round"/>

  <!-- Annotated points A, B, C -->
  <circle cx="115" cy="150" r="5.5" fill="#16653e"/>
  <text x="96" y="138" font-size="11.5" fill="#16653e" font-weight="700">A (-→+)</text>
  <circle cx="185" cy="82" r="5.5" fill="#2b5a92"/>
  <text x="155" y="70" font-size="11.5" fill="#2b5a92" font-weight="700">B (f' 极大值)</text>
  <circle cx="255" cy="150" r="5.5" fill="#c99b3b"/>
  <text x="261" y="140" font-size="11.5" fill="#8f6814" font-weight="700">C (+→-)</text>

  <!-- Right lookup box -->
  <rect x="385" y="48" width="335" height="200" rx="10" fill="#ffffff" stroke="#d9e2ec"/>
  <text x="402" y="72" font-size="13" font-weight="700" fill="#0f2744">⚡ 1 秒直读口诀（对应原函数 f(x)）</text>
  <text x="402" y="98" font-size="12" fill="#16653e" font-weight="700">• 点 A（f' 从负穿到正）：f(x) 的极小值 (Local Min)</text>
  <text x="402" y="124" font-size="12" fill="#8f6814" font-weight="700">• 点 C（f' 从正穿到负）：f(x) 的极大值 (Local Max)</text>
  <text x="402" y="150" font-size="12" fill="#2b5a92" font-weight="700">• 点 B（f' 的波峰/波谷）：f(x) 的拐点 (Inflection)!</text>
  <text x="402" y="176" font-size="12" fill="#1e293b">• A 到 C 整段（f' 在 x 轴上方）：f(x) 一直在上升</text>
  <text x="402" y="202" font-size="12" fill="#1e293b">• f' 在上升段（f''&gt;0）：f(x) 凹向上 (Concave up)</text>
  <text x="402" y="228" font-size="12" fill="#b4322a" font-weight="700">• 绝对禁区：看 f'(x) 绝不看「图像在上升」就说 f 上升!</text>
</svg><div class="cap">图解：看导函数图像只需记住两句话——「f' 正负看 f 增减，f' 增减看 f 凹凸，f' 波峰是 f 拐点」。</div></div>`;

const SVG_TAX_DWL = `<div class="diagram"><svg viewBox="0 0 720 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="从量税下的消费者剩余、生产者剩余、税收与无谓损失 DWL 三角形计算图解">
  <rect width="720" height="310" rx="12" fill="#fdfcf8" stroke="#d9e2ec"/>
  <text x="20" y="26" font-size="14" font-weight="700" fill="#0f2744">考场必会面积法：从量税 (Per-Unit Tax) 下的 CS、PS、税收与无谓损失 (DWL)</text>

  <!-- Axes -->
  <line x1="65" y1="265" x2="390" y2="265" stroke="#334155" stroke-width="1.8"/>
  <line x1="65" y1="45" x2="65" y2="265" stroke="#334155" stroke-width="1.8"/>
  <text x="380" y="282" font-size="12" fill="#334155" font-weight="700">Q</text>
  <text x="48" y="55" font-size="12" fill="#334155" font-weight="700">P</text>

  <!-- Areas: CS (top triangle), Tax Rev (rectangle), PS (bottom triangle), DWL (right triangle) -->
  <!-- Equilibrium E1=(240,155), Tax Q_t=175, P_b=112, P_s=198, D intercept (65,45), S intercept (65,265) -->
  <polygon points="65,45 65,112 175,112" fill="#dbeafe" opacity="0.85"/>
  <rect x="65" y="112" width="110" height="86" fill="#fef3c7" opacity="0.9"/>
  <polygon points="65,198 65,265 175,198" fill="#dcfce7" opacity="0.85"/>
  <polygon points="175,112 240,155 175,198" fill="#fee2e2" stroke="#b4322a" stroke-width="1.5"/>

  <!-- Demand & Supply lines -->
  <line x1="65" y1="45" x2="355" y2="232" stroke="#0f2744" stroke-width="2.6"/>
  <line x1="65" y1="265" x2="355" y2="78" stroke="#16653e" stroke-width="2.6"/>
  <text x="358" y="236" font-size="12" font-weight="700" fill="#0f2744">D</text>
  <text x="358" y="82" font-size="12" font-weight="700" fill="#16653e">S</text>

  <!-- Dashed guides -->
  <line x1="175" y1="112" x2="175" y2="265" stroke="#64748b" stroke-dasharray="4,3"/>
  <line x1="240" y1="155" x2="240" y2="265" stroke="#64748b" stroke-dasharray="4,3"/>
  <line x1="65" y1="155" x2="240" y2="155" stroke="#94a3b8" stroke-dasharray="4,3"/>

  <!-- Labels inside regions -->
  <text x="86" y="96" font-size="12" font-weight="700" fill="#1d4ed8">CS</text>
  <text x="90" y="159" font-size="12" font-weight="700" fill="#92400e">Tax Rev</text>
  <text x="86" y="236" font-size="12" font-weight="700" fill="#16653e">PS</text>
  <text x="182" y="159" font-size="12" font-weight="700" fill="#b4322a">DWL</text>

  <!-- Axis ticks -->
  <text x="34" y="116" font-size="11" fill="#0f2744" font-weight="700">P_b</text>
  <text x="34" y="159" font-size="11" fill="#64748b">P*</text>
  <text x="34" y="202" font-size="11" fill="#16653e" font-weight="700">P_s</text>
  <text x="167" y="282" font-size="11" fill="#b4322a" font-weight="700">Q_t</text>
  <text x="234" y="282" font-size="11" fill="#64748b">Q*</text>

  <!-- Formula box -->
  <rect x="415" y="48" width="286" height="225" rx="10" fill="#ffffff" stroke="#d9e2ec"/>
  <text x="430" y="72" font-size="13" font-weight="700" fill="#0f2744">📐 考场必背面积公式（秒算美元值）</text>
  <text x="430" y="102" font-size="12" fill="#1d4ed8" font-weight="700">• 税后 CS = ½ × Q_t × (P_max − P_b)</text>
  <text x="430" y="132" font-size="12" fill="#16653e" font-weight="700">• 税后 PS = ½ × Q_t × (P_s − P_min)</text>
  <text x="430" y="162" font-size="12" fill="#92400e" font-weight="700">• 政府税收 = (P_b − P_s) × Q_t = t × Q_t</text>
  <text x="430" y="192" font-size="12" fill="#b4322a" font-weight="700">• 无谓损失 DWL = ½ × t × (Q* − Q_t)</text>
  <text x="430" y="222" font-size="11.5" fill="#475569">💡 口诀：三角形高 = 税额 t = P_b − P_s，</text>
  <text x="430" y="240" font-size="11.5" fill="#475569">底 = 减少的交易量 (Q* − Q_t)，永远指向原均衡 E*！</text>
</svg><div class="cap">图解：DWL 永远是「夹在 D 与 S 之间、尖端指向原均衡点 E*」的红色三角形，面积 = ½ × 税额 × 交易量减少额。</div></div>`;

const SVG_FIRM_PROFIT = `<div class="diagram"><svg viewBox="0 0 720 295" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="厂商利润最大化 Q* 与超额利润矩形阴影 4 步画法">
  <rect width="720" height="295" rx="12" fill="#fdfcf8" stroke="#d9e2ec"/>
  <text x="20" y="26" font-size="14" font-weight="700" fill="#0f2744">厂商成本与利润图 4 步必会画法（绝不画错 MC 与 ATC 交点！）</text>

  <!-- Axes -->
  <line x1="60" y1="255" x2="395" y2="255" stroke="#334155" stroke-width="1.8"/>
  <line x1="60" y1="45" x2="60" y2="255" stroke="#334155" stroke-width="1.8"/>
  <text x="385" y="272" font-size="12" font-weight="700" fill="#334155">Q</text>
  <text x="38" y="54" font-size="12" font-weight="700" fill="#334155">P/C</text>

  <!-- Profit rectangle: Q* at x=215, P* at y=98, ATC(Q*) at y=152 -->
  <rect x="60" y="98" width="155" height="54" fill="#dcfce7" stroke="#16653e" stroke-width="1.3"/>
  <text x="108" y="130" font-size="12" font-weight="700" fill="#16653e">超额利润 (P*−ATC)×Q*</text>

  <!-- Demand & MR -->
  <line x1="60" y1="54" x2="365" y2="210" stroke="#0f2744" stroke-width="2.4"/>
  <line x1="60" y1="54" x2="255" y2="250" stroke="#2b5a92" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="366" y="216" font-size="11.5" font-weight="700" fill="#0f2744">D = AR</text>
  <text x="258" y="248" font-size="11.5" font-weight="700" fill="#2b5a92">MR</text>

  <!-- ATC U-shape minimum around (255, 148), at Q*=215 y=152 -->
  <path d="M 105 90 Q 235 215, 360 108" fill="none" stroke="#c99b3b" stroke-width="2.4"/>
  <text x="362" y="110" font-size="11.5" font-weight="700" fill="#9f7820">ATC</text>

  <!-- MC swoosh passing through MR=MC at (215, 208) and ATC min at (255, 148) -->
  <path d="M 110 232 Q 190 236, 215 208 T 255 148 T 325 60" fill="none" stroke="#b4322a" stroke-width="2.6"/>
  <text x="328" y="64" font-size="11.5" font-weight="700" fill="#b4322a">MC</text>

  <!-- Vertical line at Q*=215 -->
  <line x1="215" y1="98" x2="215" y2="255" stroke="#475569" stroke-dasharray="4,3"/>
  <circle cx="215" cy="208" r="4.8" fill="#b4322a"/>
  <circle cx="215" cy="98" r="4.8" fill="#0f2744"/>
  <circle cx="215" cy="152" r="4.8" fill="#c99b3b"/>
  <text x="206" y="272" font-size="11.5" font-weight="700" fill="#0f2744">Q*</text>
  <text x="36" y="102" font-size="11" font-weight="700" fill="#0f2744">P*</text>
  <text x="27" y="156" font-size="11" font-weight="700" fill="#9f7820">ATC</text>

  <!-- 4-step box -->
  <rect x="420" y="48" width="282" height="222" rx="10" fill="#ffffff" stroke="#d9e2ec"/>
  <text x="434" y="72" font-size="13" font-weight="700" fill="#0f2744">✅ 考场四步画图顺序（一步错全盘错）</text>
  <text x="434" y="100" font-size="12" fill="#b4322a" font-weight="700">1. 先找交点 MR = MC → 垂直向下定 Q*</text>
  <text x="434" y="128" font-size="12" fill="#0f2744" font-weight="700">2. 从 Q* 垂直向上撞到 D 线 → 向左定 P*</text>
  <text x="434" y="156" font-size="12" fill="#9f7820" font-weight="700">3. 在同一条 Q* 竖线上找 ATC → 向左定成本</text>
  <text x="434" y="184" font-size="12" fill="#16653e" font-weight="700">4. 涂阴影：P* &gt; ATC 为盈利；P* &lt; ATC 为亏损</text>
  <text x="434" y="216" font-size="11.5" fill="#475569">⚠️ 必检几何铁律：MC 必须从下方穿过</text>
  <text x="434" y="234" font-size="11.5" fill="#475569">ATC 和 AVC 的「最低点」；短期停产线 P &lt; AVC_min！</text>
</svg><div class="cap">图解：先定 Q*（MR=MC），再同一竖线上读 P*（撞 D 线）与单位成本（撞 ATC 线），即可零失误画出利润/亏损矩形。</div></div>`;

/* ==================== 27 项「讲义未细讲 · 考场必会破题法」完整库 ==================== */
const IMPLICIT_SKILLS = [
  /* ---------- 1. MATHEMATICS FOR COMMERCE (12 items) ---------- */
  {
    course: 'mathematics', term: 'term1', week: 7,
    searchKey: 'Sketching f\'(x)',
    shortTitle: '由 f(x) 图像画导函数 f\'(x)（五步垂直对齐法）',
    concept: {
      mustKnow: true,
      term: "Sketching f'(x) from the Graph of f(x)（依据 f(x) 图像画导函数 f'(x) 图像 · 五步必杀法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "The Learning Guide asks you to sketch y = f'(x) directly from y = f(x) without giving the step-by-step drawing method. Remember one golden rule: the y-VALUE (height) of f'(x) equals the SLOPE (gradient) of f(x) at the exact same x-coordinate.",
      zh: "Learning Guide 要求直接看着 f(x) 图像画出 f'(x) 图像，却没教完整画图步骤。只需死守一条核心铁律：在同一个 x 处，导函数 f'(x) 的「纵坐标高低」= 原函数 f(x) 的「切线斜率大小与正负」。按下方 5 步垂直对齐画，考场必拿满分！",
      svgHtml: SVG_FX_TO_FPRIME,
      bullets: [
        {
          label: "Step 1 · 画垂直虚线找水平切线 → 标出 f'(x) = 0 的 x 轴交点",
          en: "Draw a second set of axes directly BELOW f(x) with the exact same x-scale. Drop vertical dashed lines from every turning point (local max/min) and horizontal inflection point of f(x). At every such x, the tangent is flat (slope = 0), so plot an x-intercept on f'(x).",
          zh: "在 f(x) 正下方画一组 x 轴完全对齐的新坐标系。从 f(x) 的每一个波峰、波谷（极大/极小值）和水平拐点向下画垂直虚线——这些点切线水平（斜率为 0），立刻在下方 f'(x) 的 x 轴上打点标出零点！"
        },
        {
          label: "Step 2 · 看 f(x) 增减定正负 → 划出 f'(x) 在 x 轴上方还是下方",
          en: "Scan f(x) strictly from LEFT to RIGHT: wherever f(x) is rising (increasing), shade/mark f'(x) ABOVE the x-axis (f' > 0); wherever f(x) is falling (decreasing), mark f'(x) BELOW the x-axis (f' < 0). Ignore whether f(x) itself is positive or negative!",
          zh: "严格从左往右扫 f(x)：只要 f(x) 在爬坡（上升），f'(x) 就一定画在 x 轴上方（正区）；只要 f(x) 在下坡（下降），f'(x) 就画在 x 轴下方（负区）。切记：f(x) 本身在 x 轴上方还是下方完全不影响 f'(x) 的正负！"
        },
        {
          label: "Step 3 · 看陡缓定高低 → f(x) 的拐点对应 f'(x) 的波峰/波谷",
          en: "The steeper f(x) is, the farther f'(x) sits from the x-axis. At an inflection point (where f(x) changes from concave up to concave down, or vice versa), the slope reaches its steepest positive or steepest negative value — so that x becomes a turning point (local max or local min) on f'(x).",
          zh: "f(x) 越陡，f'(x) 离 x 轴越远；f(x) 越平缓，f'(x) 越贴近 x 轴。f(x) 的「拐点（凹凸切换处、坡度最陡点）」正下方，一定是导函数 f'(x) 的最高点（波峰）或最低点（波谷）！"
        },
        {
          label: "Step 4 · 查 4 类特殊图形（尖点、直线段、垂直切线、水平渐近线）",
          en: "(1) Straight line segment on f(x) → horizontal constant line on f'(x). (2) Sharp corner/cusp (like |x|) → f'(x) jumps abruptly with OPEN CIRCLES (undefined at the corner). (3) Vertical tangent → f'(x) shoots to ±∞ (vertical asymptote). (4) Horizontal asymptote on f(x) (like e^-x) → f'(x) approaches 0 (x-axis becomes horizontal asymptote of f').",
          zh: "考场最容易丢分的 4 个特殊点：① 直线段 → f'(x) 是水平线；② 尖点/折点（如 |x|）→ 左右斜率突变，f'(x) 必须断开并画「空心圆」（不可导）；③ 垂直切线 → f'(x) 冲向 ±∞（竖直渐近线）；④ f(x) 有水平渐近线 → 越往远处越平，f'(x) 无限贴近 x 轴（y = 0）。"
        },
        {
          label: "Step 5 · 3 秒终极验算（降阶法 + 穿轴方向检验）",
          en: "Quick check: polynomial degree always drops by 1 (cubic f → parabola f'; parabola f → straight line f'; line f → horizontal line f'). Verify signs around turning points: a local MAX of f(x) MUST have f'(x) crossing from + to −; a local MIN of f(x) MUST have f'(x) crossing from − to +.",
          zh: "交卷前 3 秒验算：多项式求导必降 1 次（三次曲线→抛物线→斜直线→水平线）。再核对穿轴方向：f 的极大值处，f' 必须「从正穿到负」；f 的极小值处，f' 必须「从负穿到正」；水平拐点处 f' 碰一下 x 轴再弹回同侧！"
        }
      ]
    }
  },
  {
    course: 'mathematics', term: 'term1', week: 8,
    searchKey: "Reading f(x) from f'(x)",
    shortTitle: "逆向必考：看导函数 f'(x) 图像反推原函数 f(x)",
    concept: {
      mustKnow: true,
      term: "Reading f(x) Features Directly from a Given f'(x) Graph（逆向必考：看导函数 f'(x) 图像反推 f(x) 增减、极值与拐点）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Exams frequently give you a graph labelled y = f'(x) and ask where the original function f(x) is increasing, has local extrema, or has points of inflection. Over 60% of students lose marks by reading f'(x) as if it were f(x).",
      zh: "考试极高频逆向题：直接给一张标着 y = f'(x) 的图，问原函数 f(x) 在哪增减、哪里取极大/极小值、哪里是拐点。超过 60% 的同学会把 f'(x) 的波峰误当成 f(x) 的极大值！用下方速查法则一秒避坑。",
      svgHtml: SVG_FPRIME_TO_FX,
      bullets: [
        {
          label: "1. 看 f'(x) 在 x 轴上方/下方 → 定 f(x) 的增减（绝不看 f' 本身上升下降！）",
          en: "f(x) is INCREASING wherever the curve f'(x) lies ABOVE the x-axis (f' > 0), even if f'(x) itself is sloping downwards! f(x) is DECREASING wherever f'(x) lies BELOW the x-axis (f' < 0).",
          zh: "只要 f'(x) 整段都在 x 轴上方（纵坐标 > 0），原函数 f(x) 就一直在上升——哪怕 f'(x) 自己正在往下掉（那只是上升变慢，仍在上升）！只有 f'(x) 掉到 x 轴下方，f(x) 才开始下降。"
        },
        {
          label: "2. 看 f'(x) 穿过 x 轴的方向 → 定 f(x) 的极大/极小值",
          en: "Local MAXIMUM of f(x): where f'(x) crosses the x-axis from + to −. Local MINIMUM of f(x): where f'(x) crosses from − to +. If f'(x) merely touches the x-axis without crossing, f(x) has a horizontal point of inflection (NO extremum).",
          zh: "f'(x) 从上往下穿过 x 轴（+ → −）→ 原函数 f(x) 是极大值；f'(x) 从下往上穿过 x 轴（− → +）→ 原函数 f(x) 是极小值；若 f'(x) 只轻触 x 轴又弹回原侧 → 只是水平拐点，不是极值！"
        },
        {
          label: "3. 看 f'(x) 的波峰与波谷 → 定 f(x) 的凹凸性与拐点",
          en: "Because f''(x) is the slope of f'(x): wherever f'(x) is rising, f''(x) > 0 so f(x) is CONCAVE UP; wherever f'(x) is falling, f''(x) < 0 so f(x) is CONCAVE DOWN. Every turning point (peak/trough) of f'(x) is an INFLECTION POINT of f(x)!",
          zh: "因为二阶导 f''(x) 就是 f'(x) 的斜率：f'(x) 上升段 → f(x) 凹向上（开口朝上）；f'(x) 下降段 → f(x) 凹向下；因此 f'(x) 的每一个波峰和波谷，对应的都是原函数 f(x) 的「拐点（Inflection Point）」！"
        }
      ]
    }
  },
  {
    course: 'mathematics', term: 'term1', week: 1,
    searchKey: 'Quadratic & Rational Inequalities',
    shortTitle: '二次与分式不等式（数轴符号表法，严禁乱乘含 x 分母）',
    concept: {
      mustKnow: true,
      term: "Quadratic & Rational Inequalities via Sign Diagram（二次与分式不等式 · 移项通分 + 数轴符号表必杀法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Used constantly in Domains (W5) and First Derivative Tests (W8), yet never taught step-by-step: NEVER multiply both sides of an inequality by an expression containing x (because you don't know if it is positive or negative). Always move everything to one side, factor, and draw a Sign Diagram.",
      zh: "第 5 周求自然定义域、第 8 周判导数正负全都要解二次和分式不等式，但讲义默认你会！铁律：严禁在不等式两边同乘含 x 的式子（不知正负会搞反不等号），必须用「移项 → 因式分解 → 数轴符号表」四步法。",
      bullets: [
        {
          label: "Step 1 · 右边必须清零（移项 + 通分 + 因式分解）",
          en: "Rewrite any inequality like (x+1)/(x-2) ≥ 3 as (x+1)/(x-2) − 3 ≥ 0 → (7 − 2x)/(x − 2) ≥ 0. For quadratics like x² − 5x + 6 > 0, factor to (x − 2)(x − 3) > 0.",
          zh: "把所有项移到左边使右边等于 0。分式不等式必须通分成单个分式（如 (x+1)/(x-2) ≥ 3 → 移项通分得 (7−2x)/(x−2) ≥ 0）；二次不等式先十字相乘因式分解。"
        },
        {
          label: "Step 2 · 找全临界点（分子根 + 分母根）并区分实心/空心",
          en: "Mark all zeros of numerator AND denominator on a number line. Critical trap: denominator roots are ALWAYS OPEN CIRCLES (excluded, since dividing by 0 is undefined) even when the inequality is ≥ or ≤!",
          zh: "把分子为 0 和分母为 0 的 x 全标在数轴上。超级扣分坑：就算题目是 ≥ 或 ≤，分母的根也永远画「空心圆」（不能取等号，因为分母不能为 0）！"
        },
        {
          label: "Step 3 · 代入区间测试点定正负（或用抛物线开口法）",
          en: "Pick one easy test number in each interval (e.g. x = 0, 2.5, 4) and check only the SIGN (+ or −) of each factor. For quadratic (x−a)(x−b) with leading coeff > 0: > 0 takes the TWO OUTER wings (x < a or x > b); < 0 takes the MIDDLE interval (a < x < b).",
          zh: "在每个分段里任选一个好算的数（如 0）代入只看正负号。对于首项系数为正的二次不等式，记住口诀：「大于取两边（x < 小根 或 x > 大根），小于夹中间（小根 < x < 大根）」。"
        }
      ]
    }
  },
  {
    course: 'mathematics', term: 'term1', week: 2,
    searchKey: 'Graph Transformations Order',
    shortTitle: '图像变换顺序与「先提 x 系数再平移」防错铁律',
    concept: {
      mustKnow: true,
      term: "Order of Graph Transformations & Factoring Horizontal Shifts（图像变换先后顺序 · 括号内先提系数再平移防错法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "When sketching y = a·f(b(x − h)) + k, students routinely shift y = f(2x − 6) right by 6 instead of 3. You MUST factor out the coefficient of x inside f(...) first: f(2x − 6) = f(2(x − 3)), and apply Dilation/Reflection BEFORE Translation (DRT).",
      zh: "画 y = a·f(bx + c) + k 图像时，90% 的同学会把 f(2x − 6) 错看成「向右平移 6 格」而丢全部分！必须牢记：先在括号内把 x 的系数提出来，再按「缩放/翻折 → 平移（DRT）」顺序做！",
      bullets: [
        {
          label: "铁律 1 · 括号内必先提系数：f(2x − 6) = f(2(x − 3))",
          en: "Horizontal shift is ALWAYS measured on x itself, not 2x. Rewrite 2x − 6 = 2(x − 3): this means horizontally compress by factor 1/2, THEN shift RIGHT by 3 units (not 6!).",
          zh: "平移量永远只看单独的 x！先把 2x − 6 写成 2(x − 3)，所以正确操作是：先横向压缩为原来的 1/2，再向右平移 3 格（绝不是 6 格）。"
        },
        {
          label: "铁律 2 · 口诀「内反外正」：括号内全反向，括号外全正向",
          en: "Inside f(...): f(x − h) shifts RIGHT (opposite of minus), f(bx) compresses horizontally by 1/b (opposite of multiply), f(−x) reflects across y-axis. Outside f(...): +k shifts UP, a·f(x) stretches vertically by a, −f(x) reflects across x-axis.",
          zh: "括号里面管横向、全反向：减 h 向右、加 h 向左，乘 b 变窄（1/b），负号左右翻折（关于 y 轴）。括号外面管纵向、全正常：加 k 向上，乘 a 拉高，负号上下翻折（关于 x 轴）。"
        },
        {
          label: "铁律 3 · 绝不画歪的万能验算：追踪 2–3 个关键锚点",
          en: "Transform 2–3 anchor points (vertex, intercepts, asymptotes) directly: point (x, y) on y = f(x) maps to (x/b + h, a·y + k) on y = a·f(b(x − h)) + k. Plug one final point back into the equation to verify 100%.",
          zh: "拿原图 2–3 个锚点（顶点、截距、渐近线）套公式 (x, y) → (x/b + h, a·y + k)，画完后随便挑一个点代回原式验算，彻底杜绝平移反方向。"
        }
      ]
    }
  },
  {
    course: 'mathematics', term: 'term1', week: 3,
    searchKey: 'Completing the Square',
    shortTitle: '配方法（a≠1 防漏乘）与绝对值不等式几何速解',
    concept: {
      mustKnow: true,
      term: "Completing the Square (a ≠ 1) & Absolute Value Equations/Inequalities（配方法首项非 1 防错 + 绝对值「夹中间/取两边」速解法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Exams ask for vertex form y = a(x − h)² + k when a ≠ 1 (e.g. y = −2x² + 8x − 3) and solve |2x − 5| ≤ 7 or |2x − 5| > 7. Two hidden traps: forgetting to multiply the subtracted square by a, and mishandling negative right-hand sides in |...|.",
      zh: "配方求抛物线顶点时一旦首项系数 a ≠ 1（尤其是负号 −2x²），极易漏乘外面的 a；解绝对值不等式也常搞混「且/或」与右边为负数的秒杀情况。",
      bullets: [
        {
          label: "1. a ≠ 1 配方法 3 步防错（以 y = −2x² + 8x − 3 为例）",
          en: "Step 1: Factor a out of the first TWO terms only: y = −2(x² − 4x) − 3. Step 2: Add & subtract (half of −4)² = 4 INSIDE brackets: y = −2[(x − 2)² − 4] − 3. Step 3: Distribute −2 before combining: y = −2(x − 2)² + 8 − 3 = −2(x − 2)² + 5 → Vertex (2, 5).",
          zh: "① 只从前两项提出 a：y = −2(x² − 4x) − 3；② 在括号内加上再减去「一次项系数一半的平方」：−2[(x − 2)² − 4] − 3；③ 拆括号时必须把 −4 也乘以 −2 得 +8，最终得 −2(x − 2)² + 5，顶点 (2, 5)。"
        },
        {
          label: "2. 绝对值不等式速解口诀（当右侧 c > 0）",
          en: "|A| < c  ⇔  −c < A < c (sandwiched in the middle, AND). |A| > c  ⇔  A < −c OR A > c (two outer wings, OR). Always isolate |A| alone on the left side BEFORE removing bars!",
          zh: "先把绝对值单独留在左边！当 c > 0 时：|A| < c 夹中间（−c < A < c）；|A| > c 取两边（A < −c 或 A > c）。"
        },
        {
          label: "3. 右侧 c < 0 必考秒杀陷阱",
          en: "Since |A| ≥ 0 always: |2x − 1| < −3 has NO SOLUTION (∅); |2x − 1| > −3 is TRUE FOR ALL REAL x (x ∈ ℝ). Never mechanically expand when c < 0!",
          zh: "绝对值永远 ≥ 0！所以看到 |2x−1| < −3 直接写「无解 (No solution)」；看到 |2x−1| > −3 直接写「全体实数 (All real x)」，千万别傻傻去拆绝对值！"
        }
      ]
    }
  },
  {
    course: 'mathematics', term: 'term1', week: 4,
    searchKey: 'Inverse Functions',
    shortTitle: '求反函数四步法 + 抛物线截断定义域怎么选 ± 根号',
    concept: {
      mustKnow: true,
      term: "Finding Inverse Functions & Choosing the Right ± Branch（求反函数四步法 · 定义域值域互换与 ± 根号支路必会选法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "For a restricted quadratic like f(x) = (x − 3)² + 1 with domain x ≤ 3, solving x = (y − 3)² + 1 yields y = 3 ± √(x − 1). Learning Guide rarely explains HOW to pick + vs − without guessing.",
      zh: "考场最常考：给一个限制定义域的抛物线如 f(x) = (x−3)² + 1 (x ≤ 3) 求反函数，开平方会出现 ± 两个分支，选错直接扣一半！记住下面 1 条黄金检验法，100% 不选错。",
      bullets: [
        {
          label: "Step 1 · 先写出原函数 f 的 Domain 和 Range（最关键一步！）",
          en: "Before swapping anything, write down Dom(f) and Ran(f). Example: f(x) = (x − 3)² + 1 for x ≤ 3 has Dom(f) = (−∞, 3] and Ran(f) = [1, ∞). Automatically: Dom(f⁻¹) = [1, ∞) and Ran(f⁻¹) = (−∞, 3].",
          zh: "动手求反函数前，先写下原函数的定义域和值域！然后直接互换：反函数的定义域 = 原函数的值域；反函数的值域 = 原函数的定义域！"
        },
        {
          label: "Step 2 · 互换 x, y 并解出 y，用 Ran(f⁻¹) 锁定 + 或 −",
          en: "Swap x and y: x = (y − 3)² + 1 → y = 3 ± √(x − 1). Since Ran(f⁻¹) = Dom(f) = (−∞, 3], we NEED y ≤ 3. Because √(x − 1) ≥ 0, only y = 3 − √(x − 1) guarantees y ≤ 3!",
          zh: "互换 x, y 解得 y = 3 ± √(x−1)。因为反函数的值域必须满足 y ≤ 3（即原函数定义域 x ≤ 3），而根号恒 ≥ 0，所以必须选「减号」y = 3 − √(x−1)！"
        },
        {
          label: "Step 3 · 一句话选截断区间（若题目让你自己限制定义域）",
          en: "To make a parabola one-to-one (pass the Horizontal Line Test), cut it strictly at its VERTEX x = h: choose either x ≥ h or x ≤ h.",
          zh: "若题目问「如何限制二次函数定义域使其存在反函数」，永远从顶点横坐标 x = h 切开，任选右半支 x ≥ h 或左半支 x ≤ h 即可通过水平直线检验。"
        }
      ]
    }
  },
  {
    course: 'mathematics', term: 'term1', week: 5,
    searchKey: 'Natural Domain',
    shortTitle: '复合函数自然定义域「三大禁区」数轴交集法',
    concept: {
      mustKnow: true,
      term: "Natural Domain of Composite Functions: The 3 Forbidden Zones（自然定义域「三大禁区」数轴求交集必会法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Exam questions combine square roots, denominators, and logarithms in one expression such as f(x) = ln(5 − x) / √(x² − 4). Missing ONE boundary inequality (especially > vs ≥) costs full marks.",
      zh: "考试爱把根号、分母、对数叠在同一个函数里考自然定义域（例如 ln(5−x) / √(x²−4)），漏掉任意一条或把 > 写成 ≥ 都会扣分。套用「三大禁区交集清单」绝不漏项！",
      bullets: [
        {
          label: "禁区 1 · 分母 ≠ 0（Denominator ≠ 0）",
          en: "Any expression in a denominator cannot be zero. If a square root sits in the denominator like 1/√(g(x)), the two rules merge into STRICT inequality g(x) > 0.",
          zh: "分母不能等于 0。特别注意：如果根号本身在分母里（1/√g(x)），条件直接升级为严格大于 g(x) > 0（不能取 0）！"
        },
        {
          label: "禁区 2 · 偶次根号内 ≥ 0（Even Root Inside ≥ 0）",
          en: "For √(g(x)) in the numerator, require g(x) ≥ 0. (Note: odd roots like cube root ∛x allow ALL real numbers!)",
          zh: "分子里的平方根要求内部 ≥ 0（若是二次式，用第 1 周数轴符号表求解）。注意：三次根号 ∛x 允许任意实数，没有禁区！"
        },
        {
          label: "禁区 3 · 对数真数严格 > 0（Inside ln / log MUST be > 0）",
          en: "Inside ln(h(x)) or log(h(x)), require h(x) > 0 strictly — NEVER ≥ 0, because ln(0) is undefined (vertical asymptote). Finally, take the INTERSECTION (overlap) of all conditions on a number line.",
          zh: "ln(h(x)) 内部必须严格 > 0（绝不是 ≥ 0，因为 ln 0 无意义）。最后把三条不等式的解画在同一根数轴上取「公共重叠区间（交集）」，用区间记号写出。"
        }
      ]
    }
  },
  {
    course: 'mathematics', term: 'term1', week: 9,
    searchKey: 'Optimisation Modelling',
    shortTitle: '商业最优化建模 5 步套路 & 闭区间端点必检（防丢 3 分）',
    concept: {
      mustKnow: true,
      term: "Optimisation Modelling & Mandatory Max/Min Verification（最优化应用题建模 + 极值性质验证与闭区间端点必检）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Students often find f'(x) = 0 correctly yet still lose 2–3 marks in UNSW exams because they fail to: (1) eliminate the 2nd variable using the constraint, (2) verify whether the stationary point is actually a max or min, and (3) check closed-interval endpoints.",
      zh: "最优化大题（利润最大、围栏面积最大、成本最小）最痛的丢分点：算出了 f'(x)=0 却因为没写「验证极大/极小值」或没查「区间端点」白丢 2–3 分！按这 4 步写拿满步骤分。",
      bullets: [
        {
          label: "Step 1 · 分清「目标函数 Objective」和「约束条件 Constraint」",
          en: "Identify what you want to maximise/minimise (e.g. Area A = xy or Profit π = TR − TC). Use the given fixed number (constraint, e.g. perimeter 2x + y = 100 → y = 100 − 2x) to eliminate the 2nd variable so your objective depends ONLY on x.",
          zh: "读题找两个式子：求最大/最小的是目标函数（如面积 A = xy），题目给的固定总量是约束条件（如围栏总长 2x + y = 100）。用约束把 y 换成 x，让目标函数只剩一个未知数！"
        },
        {
          label: "Step 2 · 写出实际定义域（Realistic Domain）",
          en: "Lengths, quantities, and prices must be non-negative: e.g. x > 0 AND y = 100 − 2x > 0 ⇒ 0 < x < 50. Discard any stationary point falling outside this domain!",
          zh: "写出物理/商业合法范围（如 x > 0 且 100−2x > 0 ⇒ 0 < x < 50）。求出来的驻点若落在合法区间外必须立刻舍去。"
        },
        {
          label: "Step 3 · 必写「二阶导或符号表验证」+「端点比大小」",
          en: "NEVER stop at f'(x) = 0! Explicitly write either f''(c) < 0 (concave down ⇒ local max) or a First Derivative Sign Table. On a closed interval [a, b], compute f(a), f(b), and f(c) and compare all three to claim the GLOBAL (absolute) max/min.",
          zh: "算出驻点 c 后，必须写一句验证（如 f''(c) < 0 故为极大值，或画一阶导符号表），否则必扣步骤分！若是闭区间 [a, b] 求绝对最值，必须同时算出 f(a)、f(b) 和驻点值三者比大小！"
        }
      ]
    }
  },
  {
    course: 'mathematics', term: 'term1', week: 10,
    searchKey: 'Signed Integral vs Area',
    shortTitle: '定积分正负抵消 vs 真实几何面积（拆 x 轴交点 + 上减下）',
    concept: {
      mustKnow: true,
      term: "Signed Definite Integral vs Geometric Area（定积分正负抵消 vs 真实面积 · 必先解交点再拆区间）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "The #1 exam trap in Week 10: computing ∫_a^b f(x) dx directly when the question asks for the AREA bounded by f(x) and the x-axis. Whenever f(x) crosses the x-axis inside [a, b], positive and negative regions cancel out!",
      zh: "第 10 周头号扣分杀手：题目问「求面积 (Find the area)」，你直接算 ∫_a^b f(x) dx！只要曲线在 [a, b] 里穿过 x 轴，x 轴下方积分是负的，会和上方正面积互相抵消，答案直接全错！",
      bullets: [
        {
          label: "Step 1 · 看到「Area」先做一件事：令 f(x) = 0 找穿轴点！",
          en: "Before integrating, ALWAYS solve f(x) = 0 to check whether any x-intercept c lies strictly between a and b. If none, check the sign of f at one midpoint to see if the entire region is below the x-axis.",
          zh: "只要题干出现 Area / enclosed area，第一反应永远是解方程 f(x) = 0，看区间 (a, b) 内有没有交点 c！如果整段都在 x 轴下方，积分结果要加绝对值（或前面加负号）。"
        },
        {
          label: "Step 2 · 在交点 c 处拆成两段，分别取绝对值再相加",
          en: "Area = |∫_a^c f(x) dx| + |∫_c^b f(x) dx|. Example: for y = x on [−2, 2], ∫_{−2}^2 x dx = 0, but Total Area = |∫_{−2}^0 x dx| + |∫_0^2 x dx| = 2 + 2 = 4.",
          zh: "在穿轴点 c 拆开算：总面积 = |∫_a^c f(x) dx| + |∫_c^b f(x) dx|。切记：绝对值必须加在每一小段外面，绝不能合并成一个积分再加绝对值！"
        },
        {
          label: "Step 3 · 两曲线之间面积：先联立求交点，再用「上函数 − 下函数」",
          en: "For area between f(x) and g(x): (1) solve f(x) = g(x) to get limits a, b; (2) test one midpoint x₀ to see which curve is HIGHER (Top); (3) compute ∫_a^b (Top − Bottom) dx. Even if both curves lie below the x-axis, Top − Bottom is ALWAYS positive!",
          zh: "两曲线围成面积 3 步：① 联立 f(x)=g(x) 找交点上下限；② 取中点代入看谁在上方（Top）；③ 算 ∫(上 − 下) dx。只要是「上减下」，哪怕两条线都在 x 轴下方结果也自动为正！"
        }
      ]
    }
  },
  {
    course: 'mathematics', term: 'term2', week: 3,
    searchKey: 'Annuity Timeline',
    shortTitle: '年金与贷款时间轴画法（彻底告别差一期 n vs n-1 错误）',
    concept: {
      mustKnow: true,
      term: "Annuity & Loan Repayment Timeline Method（金融数学时间轴画法 · 彻底消灭「期初/期末差一期」错误）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Students constantly miscount exponents (n vs n−1 vs n+1) on Superannuation, Sinking Fund, and Home Loan problems because they jump straight to formulas without drawing a timeline.",
      zh: "商业数学 Term 2 金融大题（养老金、定投、房贷还款）90% 的失分都是「到底复利了几次？是 n 期还是 n−1 期？」先画一条 10 秒时间轴，再按等比数列求和，永不差一期！",
      bullets: [
        {
          label: "Step 1 · 先统一利率 r 与总期数 n（按复利频率换算！）",
          en: "If interest is 6% p.a. compounded MONTHLY for 5 years: NEVER use r = 0.06, n = 5! Convert immediately to r = 0.06/12 = 0.005 per month and n = 5 × 12 = 60 months.",
          zh: "第一步先换算计息周期！年利率 6% 按月复利 5 年 → 立刻写成月利率 r = 0.06/12 = 0.005，总期数 n = 5×12 = 60，全题只用这两个数。"
        },
        {
          label: "Step 2 · 画时间轴 t = 0, 1, 2, …, n，写出首尾两笔钱的复利次数",
          en: "End-of-period deposit (ordinary annuity): deposited at t=1, 2, …, n → last deposit earns 0 periods, first earns (n−1) periods → GP first term a = M, ratio R = 1+r. Start-of-period deposit (annuity due): deposited at t=0, 1, …, n−1 → last earns 1 period, first earns n periods → GP first term a = M(1+r).",
          zh: "看清是「期末存」还是「期初存」：期末存（t=1..n）最后一笔在终点存、复利 0 次（首项 a=M）；期初存（t=0..n−1）最后一笔也存了 1 期（首项 a=M(1+r)）。两者只差一个 (1+r) 因子！"
        },
        {
          label: "Step 3 · 房贷还清方程：本金终值 = 全部还款终值（A_n = 0）",
          en: "For loan P borrowed at t=0 with equal end-of-period repayments M: remaining balance A_n = P(1+r)^n − M[(1+r)^n − 1]/r. Set A_n = 0 to solve for M (or n via logarithms).",
          zh: "房贷万能余额式：第 n 期余额 A_n = 借款终值 P(1+r)^n − 历次还款终值和 M·[(1+r)^n − 1]/r。还清即令 A_n = 0，求还款额 M 或用对数求期数 n 一气呵成。"
        }
      ]
    }
  },
  {
    course: 'mathematics', term: 'term2', week: 6,
    searchKey: 'Conditional Probability',
    shortTitle: '条件概率工具选择铁律 & 独立 vs 互斥终极辨析',
    concept: {
      mustKnow: true,
      term: "Probability Tool Selector & Independent vs Mutually Exclusive（树状图/维恩图/四格表选型 + 独立与互斥终极区分）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Two classic UNSW probability traps: choosing the wrong visual tool for a word problem, and confusing 'Independent' with 'Mutually Exclusive' (they are almost opposites!).",
      zh: "概率大题两大痛点：读完题不知道该画树状图、维恩图还是四格表；以及考场必考概念陷阱——把「相互独立 (Independent)」和「互斥 (Mutually Exclusive)」搞混！",
      bullets: [
        {
          label: "1. 三大工具 3 秒选型指南",
          en: "• Sequential steps / without replacement / 'if … then …' → TREE DIAGRAM (multiply along branches, add across outcomes). • Overlapping sets ('both A and B', 'neither') → VENN DIAGRAM (always fill the intersection FIRST!). • Two categorical variables (e.g. Gender × Pass/Fail) → TWO-WAY TABLE.",
          zh: "① 有先后顺序 / 不放回抽样 / 出现「如果…则…」→ 画树状图（沿枝相乘、跨枝相加）；② 有重叠交集（同时喜欢 A 和 B、都不喜欢）→ 画维恩图（永远先填中间交集！）；③ 两个分类属性交叉统计 → 画四格表。"
        },
        {
          label: "2. 看到「given that / if」立刻缩小分母",
          en: "P(A | B) = P(A ∩ B) / P(B). The condition B (whatever follows 'given that' or 'if it is known that') ALWAYS goes into the denominator as the new reduced sample space.",
          zh: "题干出现「given that B / 已知 B 发生」，B 立刻做分母！公式 P(A|B) = P(A∩B) / P(B)。顺带口诀：如果问的是逆向条件概率（已知结果反推原因），把树状图所有通向该结果的分支概率加起来做分母（贝叶斯思想）。"
        },
        {
          label: "3. 必考判断题：Independent（独立）≠ Mutually Exclusive（互斥）！",
          en: "• Mutually Exclusive (disjoint): cannot happen together ⇒ P(A ∩ B) = 0. • Independent: knowing B does not change P(A) ⇒ P(A ∩ B) = P(A)·P(B). For non-zero events, if they are mutually exclusive, they CANNOT be independent!",
          zh: "超级必考坑：互斥是「有你没我」P(A∩B) = 0；独立是「互不影响」P(A∩B) = P(A)·P(B)。只要 A、B 概率都大于 0，互斥事件就绝对不可能独立（因为 B 发生时 A 的概率直接变成 0，影响巨大）！"
        }
      ]
    }
  },
  {
    course: 'mathematics', term: 'term2', week: 13,
    searchKey: 'Inverse Normal',
    shortTitle: '正态分布正向查表与逆向求临界值 z（先画钟形图防左右反）',
    concept: {
      mustKnow: true,
      term: "Normal Distribution Table Lookup & Inverse Normal（正态分布正向查表与逆向求值 · 先画钟形阴影图零失误法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Standard Normal Z-tables only list cumulative LEFT-tail probabilities Φ(z) = P(Z ≤ z) for z ≥ 0. Without sketching the bell curve first, students constantly mix up 'top 5%' (z = +1.645) with 'bottom 5%' (z = −1.645).",
      zh: "标准正态表通常只给左尾累计面积 P(Z ≤ z)（且常只给 z ≥ 0）。考试问「前 5% 分数线 (top 5%)」时极易查成 0.05 搞错正负号！永远先花 5 秒画钟形阴影图再查表。",
      bullets: [
        {
          label: "1. 标准化万能公式与对称翻折 3 条规则",
          en: "Convert X ~ N(μ, σ²) using Z = (X − μ)/σ. Using bell symmetry: ① P(Z > a) = 1 − Φ(a); ② P(Z < −a) = 1 − Φ(a); ③ P(a < Z < b) = Φ(b) − Φ(a).",
          zh: "先标准化 Z = (X−μ)/σ。记住对称三式：① 右尾 P(Z > a) = 1 − Φ(a)；② 负左尾 P(Z < −a) = 1 − Φ(a)；③ 夹区间 P(a < Z < b) = Φ(b) − Φ(a)。"
        },
        {
          label: "2. 逆向求临界值（Inverse Normal）：一定先转成「左尾面积」",
          en: "Example: 'Find score x for the TOP 5%'. Shade the RIGHT 5% tail → LEFT area is 1 − 0.05 = 0.95 → look up 0.9500 inside the table body → z = +1.645 → solve x = μ + z·σ. For BOTTOM 5%, shaded area is on the left (< 0.5), so z is NEGATIVE: z = −1.645!",
          zh: "看到「Top 5% / 最高 5%」→ 阴影在右尾 → 左侧面积 = 0.95 → 查表找 0.9500 得 z = +1.645 → 反算 x = μ + zσ；看到「Bottom 5% / 最低 5%」→ 在均值左边，z 必为负 (−1.645)！"
        }
      ]
    }
  },

  /* ---------- 2. ECONOMICS (6 items) ---------- */
  {
    course: 'economics', term: 'term1', week: 3,
    searchKey: 'Simultaneous Shifts',
    shortTitle: '需求与供给同时移动（双移「一确一不定」箭头表法）',
    concept: {
      mustKnow: true,
      term: "Simultaneous Shifts of Demand & Supply — The Ambiguity Rule（需求与供给同时移动 · 必考「一确定、一不确定 Ambiguous」箭头速判法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Learning Guide mainly demonstrates single-curve shifts, but exams regularly test TWO shocks hitting a market simultaneously (e.g., consumer income rises AND input costs fall). Whenever both D and S shift, ONE of P* or Q* is certain while the OTHER is ALWAYS AMBIGUOUS (uncertain) unless relative magnitudes are given.",
      zh: "讲义主要讲单条曲线移动，但考试大题和选择题极爱考「两个冲击同时发生（如收入上升 + 原材料降价）」！只要 D 和 S 同时移动，均衡价格 P* 和数量 Q* 里必然有一个方向确定、另一个永远是「不确定 (Ambiguous / Indeterminate)」！",
      bullets: [
        {
          label: "Step 1 · 拆成两次单移，画两行小箭头（绝不凭空脑补！）",
          en: "Write the effect of each shift separately on P and Q, then add the columns: • D↑ alone ⇒ P↑, Q↑ • S↑ alone ⇒ P↓, Q↑ • Combined: Q definitely ↑, while P moves ↑ and ↓ ⇒ P is AMBIGUOUS (depends on which shift is larger).",
          zh: "把两个冲击拆开写两行箭头再相加：例如 D↑ → (P↑, Q↑)，S↑ → (P↓, Q↑)。竖着一合并：Q 两个都是 ↑ 所以必然上升；P 一上一下互相抵消，所以 P 不确定（取决于哪条线移得更大）！"
        },
        {
          label: "Step 2 · 四种双移终极速查口诀",
          en: "• Same direction (D↑ & S↑, or D↓ & S↓): Q is CERTAIN (same direction), P is AMBIGUOUS. • Opposite directions (D↑ & S↓, or D↓ & S↑): P is CERTAIN (follows Demand), Q is AMBIGUOUS.",
          zh: "1 秒背诵口诀：「同向移动 Q 确定、P 不定；反向移动 P 确定（跟 D 走）、Q 不定！」"
        },
        {
          label: "Step 3 · 经济学作图 6 要素防扣分清单",
          en: "Every UNSW Econ diagram loses marks if missing labels: ① Axes labelled P ($) and Q; ② Original D₁, S₁ and E₁; ③ Dotted lines to P₁, Q₁; ④ New curve D₂/S₂ with directional arrow →; ⑤ New equilibrium E₂ with P₂, Q₂; ⑥ Brief title stating the market.",
          zh: "画图必检 6 要素（缺一个扣 0.5 分）：横纵轴标 P/Q、原曲线 D₁/S₁ 与均衡点 E₁、虚线引出 P₁/Q₁、箭头标出新曲线 D₂/S₂、标出新均衡 E₂(P₂,Q₂)、写明市场标题。"
        }
      ]
    }
  },
  {
    course: 'economics', term: 'term1x', week: 6,
    searchKey: 'Deadweight Loss',
    shortTitle: '手算 CS、PS、税收与无谓损失 DWL（三角形面积法 + 图解）',
    concept: {
      mustKnow: true,
      term: "Calculating & Shading CS, PS, Tax Revenue & Deadweight Loss (DWL)（消费者剩余、生产者剩余、税收与无谓损失 · 三角形手算与阴影必会法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Exams give numerical Demand/Supply equations or graphs under a per-unit tax, price ceiling, or price floor and ask for exact dollar values of CS, PS, Government Revenue, and Deadweight Loss (DWL). Master the triangle/rectangle geometry below.",
      zh: "考试常给带数字的供需图或方程，让你在征从量税 / 最高限价 / 最低限价后精确算出 CS、PS、政府税收和无谓损失 DWL 的美元金额并涂阴影。记住三角形面积公式 1/2 × 底 × 高即可秒杀！",
      svgHtml: SVG_TAX_DWL,
      bullets: [
        {
          label: "1. 消费者剩余 CS & 生产者剩余 PS 几何定位",
          en: "CS = area BELOW Demand curve and ABOVE the price buyers actually pay (P_b), up to actual quantity traded Q_t: Area = ½ × Q_t × (P_max − P_b). PS = area ABOVE Supply curve and BELOW the price sellers actually keep (P_s): Area = ½ × Q_t × (P_s − P_min).",
          zh: "CS = 需求曲线下方、买家实付价格 P_b 上方的三角形；PS = 供给曲线上方、卖家实收价格 P_s 下方的三角形。切记底边永远是「实际成交量 Q_t」（限价/征税后会缩水，不是原均衡 Q*）！"
        },
        {
          label: "2. 无谓损失 DWL 永远指向原均衡点 E*",
          en: "DWL = ½ × (Vertical gap between D and S at Q_t) × (Q* − Q_t). Under a per-unit tax t, the vertical gap equals t = P_b − P_s, so DWL = ½ × t × (Q* − Q_t). Note: Tax Revenue (t × Q_t) is a TRANSFER to government, NOT part of DWL!",
          zh: "DWL 是夹在 D 和 S 之间、尖端指向原均衡点 E* 的三角形：面积 = ½ × (Q_t 处买卖价差) × (Q* − Q_t)。易错坑：政府税收矩形 t × Q_t 是社会内部转移，不算无谓损失！"
        },
        {
          label: "3. 谁承担更多税负？（弹性铁律：谁越缺乏弹性谁扛得多）",
          en: "Tax incidence does NOT depend on whether the law taxes buyers or sellers! The MORE INELASTIC side (steeper curve) bears the LARGER share of the tax burden because they cannot easily walk away from the market.",
          zh: "考场高频送分/坑题：税负分摊与法律规定向买家收还是卖家收完全无关！哪一方曲线越陡（越缺乏弹性、越离不开该商品），哪一方就承担更大比例的税负。"
        }
      ]
    }
  },
  {
    course: 'economics', term: 'term1x', week: 5,
    searchKey: 'Midpoint Elasticity',
    shortTitle: '中点弹性公式防除错分母 & 总收益 TR 联动 2 秒速判',
    concept: {
      mustKnow: true,
      term: "Midpoint Elasticity Formula & Total Revenue (TR) Test（中点弹性防错公式 + 总收益 TR 联动 2 秒速判法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Standard percentage change gives different PED values when price goes from $10→$12 vs $12→$10. UNSW exams expect the Midpoint (Arc) Formula between two points, and always test how a price rise affects Total Revenue (TR = P × Q).",
      zh: "普通百分比法从 $10 涨到 $12 和从 $12 降到 $10 算出来的弹性竟然不同！两点之间算弹性必须用中点公式（分母取中点平均数），并熟练掌握「价格涨跌如何影响总收益 TR」的 2 秒判断。",
      bullets: [
        {
          label: "1. 中点公式（消掉 1/2 后最不易按错计算器的写法）",
          en: "PED = [(Q₂ − Q₁) / (Q₁ + Q₂)] ÷ [(P₂ − P₁) / (P₁ + P₂)]. (The '/2' in both averages cancels out cleanly!) Always take the absolute value |PED| when classifying: > 1 Elastic, = 1 Unit Elastic, < 1 Inelastic.",
          zh: "把分子分母里的 ÷2 约掉，直接记最简防错式：PED = [(Q₂−Q₁)/(Q₁+Q₂)] ÷ [(P₂−P₁)/(P₁+P₂)]。判断需求弹性大小时看绝对值 |PED|（>1 富有弹性，<1 缺乏弹性，=1 单位弹性）。"
        },
        {
          label: "2. 收入弹性 YED 与交叉弹性 XED 千万别取绝对值！",
          en: "Unlike PED, the SIGN (+ or −) of YED and XED carries the entire meaning! YED > 0 Normal good, YED < 0 Inferior good; XED > 0 Substitutes (coffee & tea), XED < 0 Complements (printers & ink).",
          zh: "超级易错坑：只有 PED 取绝对值！YED（收入弹性）和 XED（交叉弹性）绝对不能去负号：YED>0 正常品、<0 劣等品；XED>0 替代品、<0 互补品！"
        },
        {
          label: "3. 总收益 TR = P × Q 联动口诀（涨价到底赚更多还是更少？）",
          en: "• Inelastic demand (|PED| < 1): P and TR move in the SAME direction (raise P ⇒ TR rises!). • Elastic demand (|PED| > 1): P and TR move in OPPOSITE directions (raise P ⇒ TR falls; cut P ⇒ TR rises!). • Unit elastic (|PED| = 1): TR is at its MAXIMUM.",
          zh: "2 秒秒杀口诀：「缺乏弹性同向变（涨价多赚钱），富有弹性反向变（薄利多销降价才多赚钱），单位弹性 TR 达最高点！」"
        }
      ]
    }
  },
  {
    course: 'economics', term: 'term1', week: 6,
    searchKey: 'Profit Rectangle Shading',
    shortTitle: '成本曲线几何铁律 & 利润/亏损/停产矩形 4 步阴影画法',
    concept: {
      mustKnow: true,
      term: "Cost Curve Geometry & 4-Step Profit / Loss / Shutdown Diagram（成本曲线画图铁律 + 利润/亏损矩形阴影 4 步必会法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Whether in Perfect Competition, Monopoly, or Monopolistic Competition, students lose heavy diagram marks by letting MC cross ATC anywhere except its minimum, or reading price off the MR=MC intersection instead of going up to the Demand curve.",
      zh: "不管考完全竞争、垄断还是垄断竞争，厂商利润最大化作图有严格几何顺序——很多人把价格直接读在 MR=MC 交点上，或者把 MC 画歪没穿过 ATC 最低点，直接扣光图分！",
      svgHtml: SVG_FIRM_PROFIT,
      bullets: [
        {
          label: "1. 四步作图顺序（背熟再动笔）",
          en: "① Find Q* where MR = MC (rising portion of MC). ② From Q*, go STRAIGHT UP to the Demand (AR) curve to read P*. ③ On the SAME vertical line Q*, read unit cost off the ATC curve. ④ Shade the rectangle from 0 to Q* between P* and ATC(Q*): P* > ATC = Supernormal Profit; P* < ATC = Economic Loss.",
          zh: "① 找 MR = MC 交点向下定产量 Q*；② 从 Q* 垂直向上撞到需求线 D (AR) 向左读价格 P*；③ 在同一条 Q* 竖线上找 ATC 向左读单位成本；④ 涂出 (P* − ATC) × Q* 矩形（P* 在上为超额利润，ATC 在上为亏损）。"
        },
        {
          label: "2. 短期停产规则 vs 长期退出规则（最易混！）",
          en: "• Short-run SHUTDOWN: shut down immediately if P < AVC (at Q*), because revenue cannot even cover variable costs — you lose less by producing 0 (losing only Fixed Cost). If AVC ≤ P < ATC, stay open in the short run to offset part of Fixed Cost! • Long-run EXIT: leave the market if P < ATC.",
          zh: "短期看 AVC，长期看 ATC！短期只要 P ≥ AVC（就算 P < ATC 亏钱）也必须继续营业，因为卖货能帮着分摊一部分固定成本；只有 P < AVC 才立刻停产！长期没有固定成本，P < ATC 就退出市场。"
        },
        {
          label: "3. MC 为什么必穿 ATC 和 AVC 的最低点？",
          en: "Think of GPA: if your next exam score (Marginal) is below your current GPA (Average), your GPA falls; if above, GPA rises. Therefore, Average stops falling and hits its MINIMUM at the exact point where Marginal = Average!",
          zh: "用 GPA 秒懂记忆：只要新一科成绩（MC）低于平均分（ATC），平均分就会被拉低；高于平均分就会被拉高。所以 MC 一定从下方精准穿过 ATC 和 AVC 的最低点！"
        }
      ]
    }
  },
  {
    course: 'economics', term: 'term2', week: 1,
    searchKey: 'Real GDP and Deflator',
    shortTitle: '名义/实际 GDP、平减指数与 CPI 算错重灾区（固定基期价格）',
    concept: {
      mustKnow: true,
      term: "Real GDP, GDP Deflator & CPI Calculation Pitfalls（名义/实际 GDP、平减指数与 CPI 精确计算防错指南）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Macro numerical questions give a 2-good / 3-year table and ask for Nominal GDP, Real GDP, GDP Deflator, CPI, and Inflation Rate. The single biggest error is forgetting which variable is held constant in Real GDP vs CPI.",
      zh: "宏观 Term 2 计算大题常给一张 2 种商品 × 3 年的价格产量表，连问名义 GDP、实际 GDP、GDP 平减指数、CPI 和通胀率。记住「实际 GDP 锁价格，CPI 锁篮子数量」绝不算混！",
      bullets: [
        {
          label: "1. 锁什么？一句话彻底分清 Real GDP vs CPI",
          en: "• Nominal GDP = Σ (Current P × Current Q). • Real GDP = Σ (BASE-year P × Current Q) — holds PRICES constant so only output volume changes! • CPI = [Cost of BASE-year Basket at Current P ÷ Cost of BASE-year Basket at Base P] × 100 — holds QUANTITIES constant!",
          zh: "核心对照：① 名义 GDP = 当年价 × 当年量；② 实际 GDP = 「基期价」× 当年量（锁住价格，只看产量涨了多少）；③ CPI = (当年价 × 基期篮子量) ÷ (基期价 × 基期篮子量) × 100（锁住篮子数量，只看物价涨了多少）！"
        },
        {
          label: "2. 平减指数、通胀率与实际利率三连公式",
          en: "• GDP Deflator = (Nominal GDP / Real GDP) × 100 (always equals 100 in the base year!). • Inflation Rate = [(Index₂ − Index₁) / Index₁] × 100% — NEVER just subtract Index₂ − Index₁ unless Index₁ = 100! • Real Interest Rate ≈ Nominal Interest Rate − Inflation Rate.",
          zh: "必防陷阱：算通胀率必须除以基数 [(CPI₂ − CPI₁) / CPI₁] × 100%，千万不能直接用 CPI₂ − CPI₁（只有第一年恰好等于 100 时才碰巧一样）！基期的平减指数和 CPI 永远等于 100。"
        }
      ]
    }
  },
  {
    course: 'economics', term: 'term2', week: 4,
    searchKey: 'AD-AS Policy Chain',
    shortTitle: '宏观政策大题「四环因果链 + 局限性」满分答题模板',
    concept: {
      mustKnow: true,
      term: "Macro AD–AS Cause-and-Effect Chain & Evaluation Template（宏观财政/货币政策大题「四环因果链 + 图解 + 局限性」满分模板）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "UNSW Economics essays rarely give top marks for listing definitions. Markers check for an explicit step-by-step transmission chain linking policy instrument → AD components (C+I+G+X−M) → AD-AS diagram shift → Real GDP, Inflation & Unemployment → Policy limitations.",
      zh: "经济学宏观大题只背定义拿不到高分！考官按「因果传导链条」给步骤分：政策工具 → 传导机制（利率/可支配收入）→ AD=C+I+G+(X−M) 哪几项变 → 画 AD-AS 移线 → 对 GDP/通胀/失业的影响 → 局限性与时滞。",
      bullets: [
        {
          label: "模板 A · 扩张性货币政策（RBA 降息对抗衰退）完整四环链",
          en: "① Instrument: RBA lowers the Cash Rate (buying bonds via OMOs). ② Transmission: Market interest rates fall → lower borrowing cost & lower AUD exchange rate. ③ AD Shift: Consumption (C↑), Investment (I↑), and Net Exports (X↑, M↓) rise → AD shifts RIGHT (AD₁→AD₂). ④ Outcome: Real GDP↑, cyclical unemployment↓, price level (demand-pull inflation)↑.",
          zh: "① 工具：澳联储 RBA 下调现金利率；② 传导：借贷成本降 + 澳元贬值；③ 移动：消费 C↑、投资 I↑、净出口 NX↑ → AD 右移；④ 结果：实际 GDP↑、周期性失业↓，但伴随需求拉动型通胀压力↑。"
        },
        {
          label: "模板 B · 扩张性财政政策（减税 / 增支）+ 必写局限性拿评估分",
          en: "① Instrument: Government cuts income tax (T↓ ⇒ Disposable Income↑ ⇒ C↑) or raises spending (G↑) ⇒ budget moves toward deficit ⇒ AD shifts RIGHT. ② Evaluation (last 2–3 marks!): mention Recognition/Implementation Lags, Crowding-Out effect (higher govt borrowing raises interest rates and reduces private I), and rising public debt.",
          zh: "① 财政扩张：减税（可支配收入↑→C↑）或增加政府支出 G↑ → AD 右移。② 拿满分评估段必写 2–3 个局限性：政策时滞（决策慢）、挤出效应（Crowding-out：政府借债推高利率挤出私人投资）、以及财政赤字扩大。"
        }
      ]
    }
  },

  /* ---------- 3. ACCOUNTING (4 items) ---------- */
  {
    course: 'accounting', term: 'term1', week: 2,
    searchKey: 'DEAD CLIC',
    shortTitle: '借贷方向 1 秒零失误口诀（DEAD CLIC 正常余额表）',
    concept: {
      mustKnow: true,
      term: "DEAD CLIC Rule for Instant Debit / Credit Classification（借贷方向 1 秒零失误口诀 DEAD CLIC + 正常余额速查）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Students often confuse Debit (Dr) with 'good/increase' and Credit (Cr) with 'bad/decrease'. Debit simply means LEFT side and Credit means RIGHT side! Use the universal DEAD CLIC mnemonic to know which accounts increase on Dr vs Cr in 1 second.",
      zh: "会计初学者最大误区是把「借 (Dr)」当成增加、把「贷 (Cr)」当成减少！其实 Dr 只代表左边、Cr 只代表右边。记住国际会计黄金口诀 DEAD CLIC，1 秒判断任意科目的增减方向！",
      bullets: [
        {
          label: "D-E-A-D（借方增加 Dr ↑，贷方减少 Cr ↓，正常余额在借方）",
          en: "D = Drawings / Dividends (提款/股利), E = Expenses (费用), A = Assets (资产), D = Debits increase all of these! Example: buying equipment for cash → Dr Equipment (Asset ↑), Cr Cash (Asset ↓).",
          zh: "记住 DEAD 全是借方增加：D = Drawings/Dividends（业主提款/分红）、E = Expenses（费用）、A = Assets（资产）。它们增加记 Dr，减少记 Cr！"
        },
        {
          label: "C-L-I-C（贷方增加 Cr ↑，借方减少 Dr ↓，正常余额在贷方）",
          en: "C = Capital / Owner's Equity (资本/权益), L = Liabilities (负债), I = Income / Revenue (收入), C = Contra-Assets (备抵资产，如 Accumulated Depreciation 累计折旧 & Allowance for Doubtful Debts). All increase on Credit!",
          zh: "记住 CLIC 全是贷方增加：C = Capital（资本/权益）、L = Liabilities（负债）、I = Income/Revenue（收入）、C = Contra-Assets（备抵资产如累计折旧）。它们增加记 Cr，减少记 Dr！"
        },
        {
          label: "必检铁律：每笔分录借方总额必须 = 贷方总额，且至少 2 个科目",
          en: "Check after every journal entry: Total Dr ($) === Total Cr ($). Watch out for 'Cash received in advance' (Unearned Revenue) — it is a LIABILITY (Cr ↑), NOT Revenue yet!",
          zh: "写完每笔分录立刻检查 Dr 总额 = Cr 总额。超级高频坑：「预收客户款 Unearned Revenue」是负债（CLIC 里的 L），还没提供服务前绝不能记收入！"
        }
      ]
    }
  },
  {
    course: 'accounting', term: 'term1', week: 4,
    searchKey: 'Adjusting Entries Matrix',
    shortTitle: '四大期末调整分录四宫格（永不碰 Cash + 月份折算铁律）',
    concept: {
      mustKnow: true,
      term: "The 4 Adjusting Entries Matrix & Zero-Cash Golden Rule（期末四大调整分录四宫格 · 永不碰现金与跨期折算必会法）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Adjusting entries are the #1 score-divider in UNSW Accounting exams. Memorise TWO unbreakable laws: (1) An adjusting entry NEVER involves Cash; (2) Every adjusting entry touches EXACTLY ONE Income Statement account (Revenue/Expense) and ONE Balance Sheet account (Asset/Liability).",
      zh: "期末调整分录（Adjusting Entries）是会计大考最容易全盘写反的重灾区！死守两条铁律：① 调整分录永远不出现 Cash（现金）；② 每一笔必然同时包含 1 个利润表科目（收入/费用）+ 1 个资产负债表科目（资产/负债）！",
      bullets: [
        {
          label: "1. 预付费用到期（Prepaid Expense → 已消耗部分转费用）",
          en: "Paid cash earlier (recorded as Asset 'Prepaid Insurance/Rent'). At period-end, recognise the portion USED UP: Dr Expense ↑ / Cr Prepaid Asset ↓. Always prorate months carefully: e.g. $1,200 annual policy bought 1 Oct, year-end 31 Dec = 3 months used = $1,200 × 3/12 = $300.",
          zh: "先付钱后享用（如预付 1 年保险费）：期末把「已经用掉的月份」转成费用 → Dr Insurance Expense / Cr Prepaid Insurance。超级陷阱：一定数清用了几个月（如 10 月 1 日买、12 月 31 日结账 = 3 个月 = × 3/12）！"
        },
        {
          label: "2. 预收收入实现（Unearned Revenue → 已完工部分转收入）",
          en: "Received cash earlier (Liability 'Unearned Revenue'). At period-end, recognise the portion EARNED: Dr Unearned Revenue (Liability ↓) / Cr Service Revenue (Income ↑).",
          zh: "先收钱后干活（负债）：期末把「已经干完/交付的那部分」确认成收入 → Dr Unearned Revenue（负债减少）/ Cr Revenue（收入增加）。"
        },
        {
          label: "3. 应计费用（Accrued Expense → 已发生但还没付钱）",
          en: "Service already consumed (e.g. staff worked last 3 days of June, paid in July; interest owed on loan), no cash paid yet: Dr Wages/Interest Expense ↑ / Cr Wages/Interest Payable (Liability ↑).",
          zh: "活干了/钱用了但还没付现金（如月底欠员工 3 天工资、欠银行利息）：Dr Expense / Cr Payable（应付负债）。"
        },
        {
          label: "4. 应计收入（Accrued Revenue）& 折旧（Depreciation）",
          en: "• Accrued Revenue (earned but not yet billed/collected): Dr Accounts/Interest Receivable (Asset ↑) / Cr Revenue ↑. • Depreciation: Dr Depreciation Expense / Cr Accumulated Depreciation (Contra-Asset ↑) — NEVER credit the Equipment asset directly!",
          zh: "• 应计收入（活干完还没收钱）：Dr Receivable（应收资产）/ Cr Revenue。• 折旧必避坑：Dr Depreciation Expense / Cr Accumulated Depreciation（累计折旧备抵账户），绝不能直接 Cr Equipment！"
        }
      ]
    }
  },
  {
    course: 'accounting', term: 'term1', week: 6,
    searchKey: 'Trial Balance Error Hunting',
    shortTitle: 'T 型账户结平 (c/d vs b/d) & 试算平衡表「找差额 3 招」',
    concept: {
      mustKnow: true,
      term: "Balancing T-Accounts (c/d vs b/d) & Trial Balance Error-Hunting Tricks（T 型账户结平方向 + 试算平衡表不平快速查错 3 招）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Students often mix up which side Balance c/d (carried down) vs Balance b/d (brought down) goes on, and panic when Trial Balance Dr ≠ Cr in an exam.",
      zh: "期末结平 T 型账户时，Balance c/d 和 Balance b/d 到底写左边还是右边？试算平衡表借贷不平时怎么在 30 秒内锁定错账？掌握下面 3 招轻松搞定。",
      bullets: [
        {
          label: "1. T 型账户结平 3 步：c/d 补短边，b/d 落真边",
          en: "① Add both sides and write the LARGER total on BOTH sides. ② Put 'Balance c/d' on the SMALLER side to make it equal the total. ③ Carry 'Balance b/d' to the OPPOSITE side below the total line (next month's opening balance — always on the account's normal side!).",
          zh: "① 哪边大就两边都写那个大合计数；② 较小的那一边补上差额叫 Balance c/d（结转下期）；③ 双横线下面反方向落袋为安叫 Balance b/d（下期期初余额，一定落在原本较大的那一侧！）。"
        },
        {
          label: "2. 试算表不平的 30 秒查错绝招（÷2 与 ÷9 法则）",
          en: "Compute Difference = |Total Dr − Total Cr|: • Divide by 2: if exact amount appears in ledger, you posted a Dr as a Cr (or vice versa)! • Divide by 9: if divisible by 9 with no remainder, you made a TRANSPOSITION error (swapped two digits like $540 written as $450, diff = $90) or SLIDE error ($500 as $50)!",
          zh: "算出借贷差额后立刻测两招：① 差额 ÷ 2 如果刚好等于某笔分录金额 → 你把借贷方向记反了！② 差额能被 9 整除 → 你把相邻两位数字写颠倒了（如 540 写成 450 差 90）或少写了一个 0（500 写成 50 差 450）！"
        },
        {
          label: "3. 考场理论必考：试算平衡表平了 ≠ 没做错账！",
          en: "5 errors that STILL keep Dr = Cr: Error of Omission (whole transaction missed), Commission (wrong person's account), Principle (Asset booked as Expense), Original Entry (wrong number on both sides), and Reversal (Dr & Cr completely swapped).",
          zh: "理论问答必考「哪 5 种错误不会破坏试算平衡」：漏记整笔分录 (Omission)、张冠李戴错记人名 (Commission)、原则错误把资产记成费用 (Principle)、原始金额借贷同错 (Original Entry)、借贷完全颠倒 (Reversal)。"
        }
      ]
    }
  },
  {
    course: 'accounting', term: 'term1', week: 8,
    searchKey: 'Closing Entries',
    shortTitle: '结账分录四步法（REID 口诀）& 三大报表净利润勾稽关系',
    concept: {
      mustKnow: true,
      term: "Closing Entries (REID Mnemonic) & Financial Statement Linkage（期末结账分录 REID 四步法 + 利润表流向资产负债表勾稽链）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Only TEMPORARY accounts (Revenues, Expenses, Drawings) are closed to zero at year-end; PERMANENT accounts (Assets, Liabilities, Capital) NEVER close! Use the REID mnemonic and verify the Net Profit bridge to the Balance Sheet.",
      zh: "期末结账只能结清「临时账户」（收入、费用、提款），资产/负债/资本等「永久账户」绝对不能清零！记住 REID 四步结账口诀和报表勾稽公式。",
      bullets: [
        {
          label: "1. 结账四步法（R-E-I-D 顺序零失误）",
          en: "R: Close Revenues to Income Summary (Dr Revenue / Cr Income Summary). E: Close Expenses to Income Summary (Dr Income Summary / Cr Expenses). I: Close Income Summary (Net Profit) to Capital (Dr Income Summary / Cr Capital; reverse if loss). D: Close Drawings directly to Capital (Dr Capital / Cr Drawings).",
          zh: "按 R-E-I-D 顺序把临时账户全归零：R 收入结入损益汇总（Dr 收入 / Cr Income Summary）→ E 费用结入损益汇总（Dr Income Summary / Cr 费用）→ I 净利润转入资本（Dr Income Summary / Cr Capital）→ D 业主提款直接冲减资本（Dr Capital / Cr Drawings）。"
        },
        {
          label: "2. 利润表 → 权益变动表 → 资产负债表 勾稽公式",
          en: "Ending Owner's Equity = Opening Capital + Additional Investments + Net Profit (from Income Statement) − Drawings. This Ending Equity number MUST drop straight into the Equity section of the Balance Sheet so Assets = Liabilities + Ending Equity balances to the cent!",
          zh: "做综合大题必查的勾稽桥梁：期末权益 = 期初资本 + 追加投资 + 利润表算出的净利润 − 业主提款。把这个期末权益填进资产负债表后，资产 = 负债 + 期末权益 必须一分不差地配平！"
        }
      ]
    }
  },

  /* ---------- 4. COMPUTING (3 items) ---------- */
  {
    course: 'computing', term: 'term1', week: 10,
    searchKey: 'Mixed Cell Referencing',
    shortTitle: 'Excel 拖拽不报错铁律：$A$1 / $A1 / A$1 锁行锁列判断法',
    concept: {
      mustKnow: true,
      term: "Absolute ($A$1), Relative (A1) & Mixed ($A1 / A$1) Cell Referencing（Excel 拖拽公式防报错铁律 · 什么时候锁行、什么时候锁列？）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "UNSW Computing Excel exams heavily grade whether you can write ONE single formula in the top-left cell and autofill it both RIGHT and DOWN across an entire table without breaking. Knowing exactly where to place '$' is mandatory.",
      zh: "计算机 Excel 实操考试的核心评分点：只写左上角 1 个公式，往右拖、往下拖整张表全部自动算对！只要分清「$ 锁在字母前还是数字前」，拖拽永远不出错。",
      bullets: [
        {
          label: "1. 1 秒判断口诀：「$ 在谁前面就锁谁」",
          en: "• $A$1 (Absolute): locks BOTH column A and row 1 (use for a single fixed cell like Tax Rate or Discount % outside the table). • $A1 (Column locked): when dragged RIGHT, stays in column A; when dragged DOWN, row changes 1→2→3 (use for row headers on the left!). • A$1 (Row locked): when dragged DOWN, stays on row 1; when dragged RIGHT, column changes A→B→C (use for column headers on top!).",
          zh: "• $A$1 全锁：固定引用表外单个参数（如税率、汇率）；• $A1 只锁列：给表格最左侧的「行标题」用（往右拖不跑偏，往下拖自动换行）；• A$1 只锁行：给表格最顶部的「列标题」用（往下拖不掉行，往右拖自动换列）！"
        },
        {
          label: "2. 实战经典考题：二维折扣/乘法表 1 个公式填满全表",
          en: "If Prices sit in A2:A10 and Quantities sit in B1:F1, cell B2 formula is =$A2 * B$1. Press F4 (Mac: Cmd+T) repeatedly while cursor is on a cell reference to cycle A1 → $A$1 → A$1 → $A1.",
          zh: "考场最爱考二维表：左列单价在 A2:A10、顶行数量在 B1:F1，B2 公式直接写 =$A2*B$1，往右往下全拉完零错误！快捷键：Windows 按 F4，Mac 按 Cmd+T 循环切换四种锁定。"
        }
      ]
    }
  },
  {
    course: 'computing', term: 'term1', week: 12,
    searchKey: 'Nested IF and XLOOKUP',
    shortTitle: '嵌套 IF 区间顺序陷阱 & XLOOKUP 阶梯匹配 (-1) 防 #N/A',
    concept: {
      mustKnow: true,
      term: "Nested IF Ordering Trap & XLOOKUP Approximate Match (−1)（嵌套 IF 从大到小防吞区间 + XLOOKUP 阶梯查表参数必会）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Two classic Excel exam bugs: (1) writing nested IF in ascending order with '>=' so the first condition swallows all higher grades; (2) forgetting XLOOKUP's 4th ('if_not_found') and 5th (match_mode = -1 for tax/grade brackets) arguments.",
      zh: "Excel 考试两大高发翻车：① 嵌套 IF 条件顺序写反导致 95 分被判成 Pass；② 用 XLOOKUP 查成绩等级或税率阶梯表时忘了写第 5 参数 −1 直接报 #N/A！",
      bullets: [
        {
          label: "1. 嵌套 IF 顺序铁律：用 >= 必须「从高到低」，用 < 必须「从低到高」",
          en: "WRONG: =IF(A2>=50,\"PS\",IF(A2>=85,\"HD\",...)) — a score of 90 triggers >=50 FIRST and wrongly returns PS! RIGHT: =IF(A2>=85,\"HD\",IF(A2>=75,\"DN\",IF(A2>=65,\"CR\",IF(A2>=50,\"PS\",\"FL\")))). Because IF stops at the FIRST true branch!",
          zh: "IF 函数只要命中第一个成立的条件就立刻结束！所以写 >= 必须从最高分往下排（85→75→65→50），绝对不能先写 >=50，否则 90 分一进来就满足 >=50 直接输出 PS！"
        },
        {
          label: "2. XLOOKUP 5 个核心参数模板（精确查找 vs 区间阶梯查找）",
          en: "=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode]). • Exact match (Product ID): match_mode = 0 (default), put \"Not Found\" in 4th arg. • Grade/Tax Bracket (e.g. 0=FL, 50=PS, 65=CR, 75=DN, 85=HD): set match_mode = -1 (exact match or NEXT SMALLER item), and ALWAYS lock lookup/return arrays with $!",
          zh: "记住 XLOOKUP 模板：=XLOOKUP(找谁, 去哪列找, 返回哪列, \"找不到提示\", 匹配模式)。精确查编号用 0；查分数段/税率阶梯表时，第 5 参数填 -1（找精确值或下一个更小的下限值），且查表区域一定要加 $ 绝对引用！"
        }
      ]
    }
  },
  {
    course: 'computing', term: 'term2', week: 4,
    searchKey: 'PMT FV and IF AND OR',
    shortTitle: 'IF(AND/OR) 语法防错 & PMT/FV 财务函数月利率与负号必换算',
    concept: {
      mustKnow: true,
      term: "IF(AND/OR) Syntax & Financial Functions (PMT / FV / PV) Period & Sign Rules（IF 嵌套 AND/OR 写法 + 财务函数 PMT/FV 月换算与正负号铁律）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "In Advanced Excel exams, students routinely write illegal syntax like IF(A2>50 AND B2>50,...) or plug annual interest rate directly into monthly PMT without dividing by 12, getting an answer off by 12×.",
      zh: "Term 2 高级 Excel 考试最容易白丢分的两个语法细节：把 AND/OR 写在条件中间报错，以及算月供 PMT 时忘记把年利率 ÷12、年数 ×12，或者算出来是红字负数！",
      bullets: [
        {
          label: "1. AND / OR 必须包在外面：=IF(AND(条件1, 条件2), 真, 假)",
          en: "NEVER write =IF(A2>=50 AND B2>=50, \"Pass\", \"Fail\")! Excel requires prefix function syntax: =IF(AND(A2>=50, B2>=50), \"Pass\", \"Fail\"). Same for OR(cond1, cond2).",
          zh: "Excel 里没有中缀 AND！必须写成函数套壳形式：=IF(AND(A2>=50, B2>=50), \"Pass\", \"Fail\")，多个条件用英文逗号隔开。"
        },
        {
          label: "2. PMT / FV / PV 财务函数 3 条防错铁律",
          en: "=PMT(rate, nper, pv, [fv], [type]). ① Match units: for MONTHLY payments on a 5-year loan at 6% p.a., rate = 6%/12, nper = 5*12. ② Cash-flow sign: Excel returns a NEGATIVE outflow by default; put a minus sign before pv (or before PMT: =-PMT(...)) if the exam wants a positive dollar payment. ③ type = 0 (end of period, default) vs type = 1 (beginning of period).",
          zh: "财务函数必检三项：① 单位对齐：按月还款则 rate = 年利率/12，nper = 年数×12（按季则 ÷4、×4）；② 正负号：Excel 按现金流方向输出负数，想显示正数月供就在 pv 前加负号或写 =-PMT(...)；③ 期末付填 0（默认），期初付填 1！"
        }
      ]
    }
  },

  /* ---------- 5. ACADEMIC ENGLISH (2 items) ---------- */
  {
    course: 'english', term: 'term1', week: 9,
    searchKey: 'Safe Academic Paraphrasing',
    shortTitle: '学术改写 5 步安全法（不止换同义词，彻底避开 Patchwriting 查重）',
    concept: {
      mustKnow: true,
      term: "5-Step Safe Academic Paraphrasing (Avoiding Patchwriting & Plagiarism)（学术改写 5 步安全法 · 既防查重又不歪曲原意）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "Learning Guide tells you 'paraphrase and use reporting verbs', yet many students only swap 2–3 words with synonyms while keeping the exact sentence skeleton — which UNSW flags as Patchwriting (academic misconduct). Follow this 5-step rewrite protocol.",
      zh: "讲义强调要改写并加转述动词，但没教怎么彻底摆脱原句骨架——只换两三个同义词在 UNSW 会被判「拼凑抄袭 (Patchwriting)」扣重分！按下面 5 步改写，安全又拿高分。",
      bullets: [
        {
          label: "Step 1 · 读懂后盖住原句，只留 3 个不可替换专业词",
          en: "Read the original sentence twice, look AWAY from it, and jot down only 2–3 technical terms that should NOT be changed (e.g. 'urbanisation', 'carbon emissions', 'SDG 11'). Changing technical terms into awkward synonyms loses accuracy marks!",
          zh: "读懂后遮住原句！只保留 2–3 个专业术语（如 urbanisation、SDG 11——专业词千万别硬换怪异同义词），其余全用自己的话重构。"
        },
        {
          label: "Step 2 · 必改「句型骨架 + 词性（名词化）」",
          en: "Apply at least TWO structural shifts: ① Flip clause order (Cause→Effect to Effect→Cause); ② Switch Active ↔ Passive voice; ③ Nominalise verbs/adjectives into nouns (e.g. 'cities grow rapidly' → 'rapid urban expansion').",
          zh: "至少做两项结构大换血：① 因果前后调换；② 主动被动互换；③ 动词/形容词名物化（把 cities grow rapidly 改成 rapid urban expansion），瞬间变高级学术腔！"
        },
        {
          label: "Step 3 · 匹配准确的转述动词（Reporting Verb）+ 模糊限制语（Hedging）+ 引用",
          en: "Check author stance before choosing the verb: neutral fact → 'states / reports / demonstrates'; strong argument → 'argues / contends'; cautious claim → 'suggests / indicates'. Never turn 'may contribute to' into 'causes' (overstating distorts original meaning!). Always add in-text citation (Author, Year).",
          zh: "看清作者立场再选转述动词：客观事实用 reports/demonstrates，强观点用 argues，谨慎推断用 suggests。大忌：绝对不能把原文的 may/suggests 改写成 causes/proves（夸大语气直接扣分），句末别忘加引用 (Author, Year)！"
        }
      ]
    }
  },
  {
    course: 'english', term: 'term1', week: 5,
    searchKey: 'Infographic Summary Template',
    shortTitle: '信息图/数据图表口语写作「总-分-总」高分模板与精准趋势词库',
    concept: {
      mustKnow: true,
      term: "High-Band Infographic & Chart Summary Formula（信息图/图表「总-分-总」满分结构 + 精准数据对比句型）",
      src: "🔥 讲义未细讲 · 必考必会破题法",
      en: "In UNSW Speaking/Writing Infographic assessments, students lose marks by listing every single number mechanically without an Overview or comparison language. Use the 4-part academic template below.",
      zh: "信息图口语录音和学术写作中，机械报流水账（一个个念数字）最多只能拿及格分！套用「总览 → 核心趋势分组 → 精准对比数据 → 谨慎推论」四段公式直接冲高分。",
      bullets: [
        {
          label: "1. 开篇总览句（Overview — 绝对不能漏，先说最大趋势不急着报具体数字！）",
          en: "Template: 'This infographic illustrates [topic] across [time/regions]. Overall, the most striking trend is that [main pattern], whereas [contrasting feature].'",
          zh: "开篇先给宏观结论（不急着念具体数字）：This infographic illustrates … Overall, the most striking trend is that …（点出最显著上升/最高项与最低/相反项）。"
        },
        {
          label: "2. 精准趋势动词 + 副词 + 对比倍数组合（告别一直用 go up / big）",
          en: "• Sharp rise: surged / rose sharply / doubled. • Gradual change: increased steadily / declined marginally. • Plateau/Fluctuate: remained relatively stable / fluctuated modestly. • Comparison frames: 'A accounted for nearly twice as much as B (42% compared with 22%)'; 'By contrast, C experienced a noticeable drop from X to Y.'",
          zh: "高分词库替换 go up：大幅上升用 rose sharply / surged，平稳增长用 increased steadily，小幅下降用 declined marginally；对比用 twice as much as / accounted for X%, compared with Y% / By contrast。"
        },
        {
          label: "3. 结尾影响与模糊限制语（Hedging Conclusion）",
          en: "Wrap up with one hedged takeaway (never absolute certainty!): 'Taken together, these figures suggest that [implication], which may highlight the need for [solution/policy].'",
          zh: "收尾用一句带 Hedging 的总结提炼意义：Taken together, these figures suggest that …, which may highlight the need for …（既完整又有学术严谨度）。"
        }
      ]
    }
  }
];

/* ==================== 1. 注入 5 个课程 JSON ==================== */
const byCourse = {};
for (const item of IMPLICIT_SKILLS) {
  (byCourse[item.course] ||= []).push(item);
}

let injectedCount = 0;
for (const [courseId, items] of Object.entries(byCourse)) {
  const filePath = path.join(COURSES_DIR, `${courseId}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const item of items) {
    const termObj = (data.terms || []).find(t => t.id === item.term);
    if (!termObj) {
      throw new Error(`Term not found: ${courseId}/${item.term}`);
    }
    const weekObj = (termObj.weeks || []).find(w => Number(w.num) === Number(item.week));
    if (!weekObj) {
      throw new Error(`Week not found: ${courseId}/${item.term}/W${item.week}`);
    }
    if (!Array.isArray(weekObj.bilingualConcepts)) weekObj.bilingualConcepts = [];

    // 幂等替换：若已有相同 term 或同 searchKey 的 mustKnow 卡片则原地更新，否则插到最前面确保学生第一眼看到
    const existingIdx = weekObj.bilingualConcepts.findIndex(
      c => c && (c.term === item.concept.term || (c.mustKnow && c.searchKey === item.searchKey))
    );
    const payload = { ...item.concept, searchKey: item.searchKey };
    if (existingIdx >= 0) {
      weekObj.bilingualConcepts[existingIdx] = payload;
    } else {
      weekObj.bilingualConcepts.unshift(payload);
    }
    injectedCount++;
  }

  fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
  console.log(`✅ Updated ${courseId}.json (+${items.length} exam-critical implicit skills)`);
}

/* ==================== 2. 同步汇总到 handbooks.json ==================== */
const handbooks = JSON.parse(fs.readFileSync(HANDBOOKS_PATH, 'utf8'));
for (const hb of handbooks) {
  const list = byCourse[hb.id] || [];
  hb.mustKnowToolkit = list.map(it => ({
    title: it.shortTitle,
    term: it.term,
    week: it.week,
    q: it.searchKey,
    summary: it.concept.zh,
    hasDiagram: Boolean(it.concept.svgHtml)
  }));
}
fs.writeFileSync(HANDBOOKS_PATH, JSON.stringify(handbooks, null, 2), 'utf8');
console.log(`✅ Updated handbooks.json with mustKnowToolkit across ${handbooks.length} subjects (total ${injectedCount} skills)`);
