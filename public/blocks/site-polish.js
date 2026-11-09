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

  function build() {
    if (document.getElementById('cbModeCtrl')) return;

    var box = document.createElement('div');
    box.className = 'cb-mode-ctrl';
    box.id = 'cbModeCtrl';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', '显示偏好');
    box.innerHTML =
      '<span class="cb-label">显示</span>' +
      '<button type="button" id="cbFocusBtn" aria-pressed="false" aria-label="专注模式">专注</button>' +
      '<button type="button" id="cbMotionBtn" aria-pressed="false" aria-label="减少动效">静效</button>';
    document.body.appendChild(box);

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
