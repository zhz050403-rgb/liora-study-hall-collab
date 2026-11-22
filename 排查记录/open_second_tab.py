# -*- coding: utf-8 -*-
"""在同一 Edge 窗口新建第二个标签页（会计学周笔记），并验证两个标签页属于同一窗口。"""
import json
import sys
import time

SKILL_SCRIPTS = r'C:/Users/Liora/.workbuddy/skills/browser-automation-cdp/scripts'
sys.path.insert(0, SKILL_SCRIPTS)
import cdp  # noqa: E402

BASE = 'https://liora-study-hall.app.workbuddy.host/?sharecode=L4NKT6REQ6'
ACCOUNTING_URL = BASE + '#/c/accounting/term1/1'
OUT = r'C:/Users/Liora/Desktop/新南2026/网站/排查记录/second_tab_id.txt'


def main():
    # 1) 在现有窗口新建标签页（不指定 newWindow，默认沿用当前窗口）
    client = cdp.CDPClient(port=9222, timeout=12)
    client.connect_browser()
    created = client.send('Target.createTarget', {'url': ACCOUNTING_URL})
    new_id = created.get('targetId')
    print('CREATED_TAB:', new_id)
    client.close()

    time.sleep(2)

    # 2) 逐个查询标签页所属窗口与窗口状态
    probe = cdp.CDPClient(port=9222, timeout=12)
    probe.connect_browser()
    pages = [t for t in probe.targets() if t.get('type') == 'page']
    print('PAGE_COUNT:', len(pages))
    window_ids = set()
    for t in pages:
        win = probe.send('Browser.getWindowForTarget', {'targetId': t['id']})
        wid = win.get('windowId')
        window_ids.add(wid)
        print('TAB:', t['id'], '| windowId =', wid, '|', t.get('url'))
    for wid in window_ids:
        b = probe.send('Browser.getWindowBounds', {'windowId': wid})
        print('WINDOW_BOUNDS:', wid, json.dumps(b.get('bounds', {}), ensure_ascii=False))
    probe.close()
    return new_id


if __name__ == '__main__':
    tid = main()
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(tid or '')
