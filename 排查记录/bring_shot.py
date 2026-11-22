# -*- coding: utf-8 -*-
"""修复截图超时：先激活标签页/把窗口置前，再截图。"""
import base64
import sys
import time

SKILL_SCRIPTS = r'C:/Users/Liora/.workbuddy/skills/browser-automation-cdp/scripts'
sys.path.insert(0, SKILL_SCRIPTS)
import cdp  # noqa: E402

MATH = '9EA92360FCC54BBF57DF1A59EB2709FA'
with open(r'C:/Users/Liora/Desktop/新南2026/网站/排查记录/second_tab_id.txt', encoding='utf-8') as f:
    ACCT = f.read().strip()

OUT_DIR = r'C:/Users/Liora/Desktop/新南2026/网站/排查记录'


def bring_and_shot(tid, out_path):
    client = cdp.CDPClient(port=9222, timeout=20)
    client.connect_page(tid)
    client.send('Page.enable')
    client.send('Page.bringToFront')  # 后台标签页会让 captureScreenshot 挂起
    time.sleep(1.2)
    result = client.send(
        'Page.captureScreenshot',
        {'format': 'png', 'captureBeyondViewport': False},
        timeout=20,
    )
    data = base64.b64decode(result['data'])
    with open(out_path, 'wb') as f:
        f.write(data)
    print('SHOT_OK:', out_path, len(data), 'bytes')
    client.close()


if __name__ == '__main__':
    bring_and_shot(MATH, OUT_DIR + '/math-final.png')
    bring_and_shot(ACCT, OUT_DIR + '/accounting-final.png')
