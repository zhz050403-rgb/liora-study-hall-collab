/* =========================================================
 * Liora 学习小屋 · 云服务接入配置
 * 由 cloud-service 激活后生成的 publicConfig 初始化 WorkBuddyCloud 客户端。
 * 暴露：
 *   window.cloud        —— 统一客户端（auth / database / llm 共用）
 *   window.cloudLLM     —— 云端 keyless 大模型封装（chat / stream / models）
 * 本文件必须在 SDK CDN 脚本之后、cloud-sync.js 之前加载。
 * ========================================================= */
(function () {
  'use strict';

  // 来自 workbuddy_cloud_service 激活返回的 publicConfig（仅前端可安全持有的公开配置）
  var publicConfig = {
    endpoint: 'https://liora-study-hall.app.workbuddy.host',
    oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
    publishableKey: 'wbpk_rBWn4x6EKZDM20OKLiy9jd_YMrdn73CgUd2dbFq5zrMariwehezyJTB'
  };
  window.__CLOUD_CONFIG__ = publicConfig;

  if (typeof WorkBuddyCloud === 'undefined') {
    // CDN 未加载（如离线打开），降级：云端能力不可用，但本地功能照常
    window.cloudAvailable = false;
    console.warn('[Liora 云服务] SDK 未加载，云端能力暂不可用（本地功能正常）。');
    return;
  }

  var cloud = WorkBuddyCloud.createWorkBuddyCloud({
    endpoint: publicConfig.endpoint,
    oauthRelayBaseUrl: publicConfig.oauthRelayBaseUrl,
    publishableKey: publicConfig.publishableKey
  });
  window.cloud = cloud;
  window.cloudAvailable = true;

  var DEFAULT_SYSTEM = { role: 'system', content: 'You are a helpful assistant. Be concise and helpful.' };
  var _modelCache = null;

  async function getModel() {
    if (_modelCache) return _modelCache;
    var models = await cloud.llm.models.list();
    if (!models || !models.length) { _modelCache = null; return null; }
    _modelCache = models.find(function (m) { return m.disabled !== true; }) || null;
    return _modelCache;
  }

  // 确保 messages 以 system 开头（云 LLM 要求）
  function ensureSystem(messages) {
    if (messages && messages.length && messages[0] && messages[0].role === 'system') return messages;
    return [DEFAULT_SYSTEM].concat(messages || []);
  }

  /* 统一错误 → 中文可读信息 */
  function llmError(e) {
    var msg = (e && (e.message || (e.error && e.error.message))) || String(e);
    var code = e && e.error && e.error.code;
    if (code) {
      if (String(code).indexOf('quota') === 0) return '云端模型额度已用完或限流，请稍后再试。';
      if (String(code).indexOf('request_') === 0) return '请求参数异常，请重试（如仍失败请反馈）。';
      if (String(code).indexOf('auth_') === 0) return '云端鉴权未通过：请确认已发布到本应用域名，或先登录账号。';
      if (String(code).indexOf('gateway_') === 0 || String(code).indexOf('model_') === 0) return '模型服务暂时不可用，请稍后再试一次。';
      if (String(code).indexOf('internal_') === 0) return '云端内部错误，请稍后再试（如持续失败可反馈请求 ID）。';
    }
    if (/NO_MODEL/.test(msg)) return '当前应用还未启用可用的云端模型。';
    if (/Failed to fetch|NetworkError|Network request|timeout/i.test(msg)) return '连不上云端模型服务，请检查网络后重试。';
    if (/429|quota|rate/i.test(msg)) return '请求太频繁或额度用完了，稍等一会儿再试。';
    if (/5\d\d|gateway|model_/i.test(msg)) return '模型服务暂时不可用，稍后再试一次。';
    return (msg || '调用失败') + '（若反复失败，把这段话发给我，我来排错）';
  }

  /* 流式对话：逐字回调 onDelta，最终返回完整文本。
     messages: [{role, content}]；opts: { model, temperature, maxTokens, signal, onDelta } */
  async function streamChat(messages, opts) {
    opts = opts || {};
    var model = opts.model || (await getModel());
    if (!model) throw new Error('NO_MODEL');
    var msgs = ensureSystem(messages);
    var params = {
      model: model.id,
      messages: msgs,
      stream: true,
      stream_options: { include_usage: true },
      temperature: (opts.temperature != null ? opts.temperature : 0.7)
    };
    if (opts.maxTokens) params.max_tokens = opts.maxTokens;
    if (opts.signal) params.signal = opts.signal;

    var text = '';
    try {
      for await (var chunk of cloud.llm.chat.completions.create(params)) {
        var delta = chunk && chunk.choices && chunk.choices[0] && chunk.choices[0].delta;
        if (delta && delta.content) {
          text += delta.content;
          if (opts.onDelta) opts.onDelta(delta.content);
        }
      }
    } catch (e) {
      // 已渲染的部分文本保留，便于「重新生成」
      if (text) { text += '\n\n（生成被中断，可点重新生成）'; }
      throw e;
    }
    return text;
  }

  window.cloudLLM = {
    client: cloud,
    models: function () { return cloud.llm.models.list(); },
    getModel: getModel,
    chat: function (messages, opts) { return streamChat(messages, opts); },
    stream: streamChat,
    errorText: llmError
  };
})();
