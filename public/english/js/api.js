/* =========================================================
 * Liora English · 云端大模型客户端（keyless）
 * 直接走 WorkBuddy 云服务的大模型 API，无需用户自备 API Key。
 * 由 cloud-config.js 注入 window.cloudLLM（须先加载 SDK CDN）。
 * ========================================================= */
const LLM = {
  /**
   * 调用云端大模型。
   * @param {Array<{role:string,content:string}>} messages 对话消息（每条 PROMPTS 已自带 system 消息）
   * @param {object} opts { maxTokens, temperature }
   * @returns {Promise<string>} 模型返回的完整文本
   */
  async chat(messages, opts) {
    opts = opts || {};
    if (!window.cloudLLM) throw new Error('NO_CLOUD');
    return await window.cloudLLM.chat(messages, {
      temperature: opts.temperature != null ? opts.temperature : 0.7,
      maxTokens: opts.maxTokens
    });
  },

  /* 测试连接 */
  async test() {
    return await this.chat([{ role: 'user', content: '请只回复两个字：可用' }], { maxTokens: 20, temperature: 0 });
  },

  /* 把错误转换成用户看得懂的中文 */
  friendlyError(e) {
    if (window.cloudLLM && window.cloudLLM.errorText) return window.cloudLLM.errorText(e);
    const msg = String((e && e.message) || e);
    if (msg === 'NO_KEY' || msg === 'NO_CLOUD') return '云端模型暂不可用，请稍后重试。';
    if (msg.indexOf('HTTP_401') === 0) return '云端鉴权失败，请重新登录或刷新页面。';
    if (msg.indexOf('HTTP_429') === 0) return '请求太频繁或额度不足，请稍后再试。';
    if (msg.indexOf('HTTP_5') === 0) return '模型服务端错误，请稍后重试。';
    return '调用失败：' + msg.slice(0, 160);
  }
};
