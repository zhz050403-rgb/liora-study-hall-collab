/* ============================================================
 * 学习小屋 · 显示偏好开关（专注模式 / 减少动效）
 * ------------------------------------------------------------
 * 不改动 index.html 结构：控件由本脚本动态挂到 body，
 * 因此主站、每日简报可以共用一份，且不会被 SPA 重渲染清掉。
 * 选择写入 localStorage，刷新后仍生效；
 * 「减少动效」在用户未手动选择时自动跟随系统「减少动态效果」。
 * ============================================================ */
(function () {
  'use strict';

  var KEY_FOCUS = 'xinnan-focus-mode';
  var KEY_MOTION = 'xinnan-reduce-motion';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function apply() {
    var focus = read(KEY_FOCUS) === '1';
    var manual = read(KEY_MOTION);
    var motion = manual === null ? (mq ? mq.matches : false) : manual === '1';

    document.body.classList.toggle('cb-focus', focus);
    document.body.classList.toggle('cb-reduce-motion', motion);

    var bf = document.getElementById('cbFocusBtn');
    var bm = document.getElementById('cbMotionBtn');
    if (bf) {
      bf.setAttribute('aria-pressed', String(focus));
      bf.title = focus
        ? '专注模式已开启 · 点击恢复全部内容'
        : '专注模式 · 收起装饰、侧栏与浮动入口，只留正文';
    }
    if (bm) {
      bm.setAttribute('aria-pressed', String(motion));
      bm.title = motion
        ? '减少动效已开启 · 点击恢复动画'
        : '减少动效 · 关闭页面动画与平滑滚动';
    }
  }

  function setOpen(open) {
    var btn = document.getElementById('cbSettingsBtn');
    var box = document.getElementById('cbModeCtrl');
    if (!btn || !box) return;
    box.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  }

  /* 字号、专注、静效合成一个「Aa」按钮，点开才显示，减少右下角常驻的浮动控件 */
  function build() {
    if (document.getElementById('cbModeCtrl')) return;

    var box = document.createElement('div');
    box.className = 'cb-mode-ctrl';
    box.id = 'cbModeCtrl';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', '阅读设置');
    box.hidden = true;
    box.innerHTML =
      '<div class="cb-row cb-row-mode">' +
      '<span class="cb-label">显示</span>' +
      '<button type="button" id="cbFocusBtn" aria-pressed="false" aria-label="专注模式">专注</button>' +
      '<button type="button" id="cbMotionBtn" aria-pressed="false" aria-label="减少动效">静效</button>' +
      '</div>';
    /* 主站页面自带字号控件：整体移进面板，原有的点击逻辑随节点保留 */
    var font = document.getElementById('font-ctrl');
    if (font) {
      var row = document.createElement('div');
      row.className = 'cb-row cb-row-font';
      row.appendChild(font);
      box.insertBefore(row, box.firstChild);
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'cbSettingsBtn';
    btn.className = 'cb-settings-btn';
    btn.textContent = 'Aa';
    btn.title = '阅读设置：字号 / 专注 / 静效';
    btn.setAttribute('aria-label', '阅读设置');
    btn.setAttribute('aria-controls', 'cbModeCtrl');
    btn.setAttribute('aria-expanded', 'false');

    document.body.appendChild(box);
    document.body.appendChild(btn);

    btn.addEventListener('click', function () { setOpen(box.hidden); });
    document.addEventListener('click', function (e) {
      if (box.hidden || box.contains(e.target) || btn.contains(e.target)) return;
      setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hidden) { setOpen(false); btn.focus(); }
    });

    document.getElementById('cbFocusBtn').addEventListener('click', function () {
      write(KEY_FOCUS, document.body.classList.contains('cb-focus') ? '0' : '1');
      apply();
    });
    document.getElementById('cbMotionBtn').addEventListener('click', function () {
      write(KEY_MOTION, document.body.classList.contains('cb-reduce-motion') ? '0' : '1');
      apply();
    });
  }

  function init() { build(); apply(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  if (mq) {
    var onSystemChange = function () { if (read(KEY_MOTION) === null) apply(); };
    if (mq.addEventListener) { mq.addEventListener('change', onSystemChange); }
    else if (mq.addListener) { mq.addListener(onSystemChange); }
  }
})();
