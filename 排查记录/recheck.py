# -*- coding: utf-8 -*-
"""无副作用复核：对两个课程标签页做禁用缓存刷新，并收集 Console / Network 异常。"""
import json
import sys
import time

SKILL_SCRIPTS = r'C:/Users/Liora/.workbuddy/skills/browser-automation-cdp/scripts'
sys.path.insert(0, SKILL_SCRIPTS)
import cdp  # noqa: E402

TARGETS = [
    ('MATH', '9EA92360FCC54BBF57DF1A59EB2709FA'),
    ('ACCOUNTING', ''),  # 运行时从 second_tab_id.txt 读取
]
ID_FILE = r'C:/Users/Liora/Desktop/新南2026/网站/排查记录/second_tab_id.txt'

with open(ID_FILE, encoding='utf-8') as f:
    TARGETS[1] = ('ACCOUNTING', f.read().strip())


def drain(client, seconds, errors, reqmap):
    """收集 CDP 事件，只保留异常 / 控制台错误 / 加载失败，并映射到具体 URL。"""
    deadline = time.time() + seconds
    while time.time() < deadline:
        try:
            raw = client.ws.recv_text(timeout=0.4)
        except Exception:
            continue
        try:
            msg = json.loads(raw)
        except (ValueError, TypeError):
            continue
        method = msg.get('method', '')
        p = msg.get('params', {}) or {}
        if method == 'Network.requestWillBeSent':
            reqmap[p.get('requestId')] = (p.get('request', {}) or {}).get('url', '')
        elif method == 'Runtime.exceptionThrown':
            d = p.get('exceptionDetails', {}) or {}
            desc = (d.get('exception', {}) or {}).get('description') or d.get('text', '')
            errors.append('JS_EXCEPTION: ' + str(desc)[:220])
        elif method == 'Log.entryAdded':
            e = p.get('entry', {}) or {}
            if e.get('level') in ('error', 'warning'):
                errors.append('CONSOLE_' + e.get('level', '') + ': ' + str(e.get('text', ''))[:220])
        elif method == 'Network.loadingFailed':
            url = reqmap.get(p.get('requestId'), '?')
            errors.append('NETWORK_FAILED: ' + str(p.get('errorText', ''))[:120] + ' | URL=' + str(url)[-170:])
        elif method == 'Network.responseReceived':
            r = p.get('response', {}) or {}
            if r.get('status', 0) >= 400:
                errors.append('HTTP_%s: %s' % (r.get('status'), str(r.get('url', ''))[-120:]))


def recheck(label, tid):
    errors = []
    reqmap = {}
    client = cdp.CDPClient(port=9222, timeout=12)
    client.connect_page(tid)
    client.send('Page.enable')
    client.send('Runtime.enable')
    client.send('Log.enable')
    client.send('Network.enable')
    # 禁用缓存刷新，等同于开发者工具里的 Disable cache + Reload
    client.send('Page.reload', {'ignoreCache': True})
    drain(client, 9, errors, reqmap)
    client.close()
    print('[%s] reload(ignoreCache) done, events collected: %d' % (label, len(errors)))
    for e in errors[:15]:
        print('   ', e)
    if not errors:
        print('    NO_EXCEPTION_NO_FAILED_REQUEST')
    return errors


if __name__ == '__main__':
    for label, tid in TARGETS:
        recheck(label, tid)
