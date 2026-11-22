# -*- coding: utf-8 -*-
"""线上复测：课程周笔记页渲染、侧栏结构、控制台报错（验证死代码移除无副作用）。"""
import json, sys, time
sys.path.insert(0, r'C:/Users/Liora/.workbuddy/skills/browser-automation-cdp/scripts')
import cdp

BASE = 'https://liora-study-hall.app.workbuddy.host/?sharecode=L4NKT6REQ6'
URL = BASE + '&_v=verify' + str(int(time.time())) + '#/c/mathematics/term1/1'

client = cdp.CDPClient(port=9222, timeout=60)
client.connect_browser()
created = client.send('Target.createTarget', {'url': URL})
tid = created.get('targetId')
client.close()
time.sleep(9)

pc = cdp.CDPClient(port=9222, timeout=60)
pc.connect_page(tid)
pc.send('Page.enable'); pc.send('Runtime.enable'); pc.send('Log.enable')
errs = []
pc.send('Runtime.enable')
# 注入异常捕获
pc.send('Runtime.evaluate', {'expression': 'window.__errs=[];window.addEventListener("error",function(e){window.__errs.push(String(e.message||e.error||e));});window.onunhandledrejection=function(e){window.__errs.push("P:"+String(e.reason));};'})
time.sleep(2)

js = """(function(){
  var out = {};
  out.notesVisible = !!document.querySelector('.notes, .gx, .empty-hint');
  var side = document.querySelector('.week-side');
  out.sidebarExists = !!side;
  out.sidebarLeaves = side ? side.querySelectorAll('.tree-direct, .tleaf, .ws-note-outline, .tnode').length : -1;
  out.sidebarText = side ? side.innerText.replace(/\\s+/g,' ').slice(0,160) : 'NONE';
  out.originalTab = !!document.querySelector('.note-tab[data-ntab="original"]');
  out.answersTab = !!document.querySelector('.note-tab[data-ntab="answers"]');
  out.hasPortal = !!window.PORTAL_DATA;
  return out;
})()"""
r = pc.send('Runtime.evaluate', {'expression': js, 'returnByValue': True}, timeout=30)
val = r.get('result', {}).get('value')
print('PAGE:', json.dumps(val, ensure_ascii=False, indent=1))

# 读取注入的报错数组
rerr = pc.send('Runtime.evaluate', {'expression': 'window.__errs', 'returnByValue': True}, timeout=15)
print('INJECTED_ERRORS:', rerr.get('result', {}).get('value'))

# 收集 CDP 控制台/异常事件（最后 4 秒）
import select
deadline = time.time() + 4
while time.time() < deadline:
    try:
        raw = pc.ws.recv_text(timeout=0.4)
    except Exception:
        continue
    try:
        m = json.loads(raw)
    except Exception:
        continue
    if m.get('method') == 'Runtime.exceptionThrown':
        d = (m.get('params', {}).get('exceptionDetails', {}) or {})
        errs.append('JS:' + str((d.get('exception', {}) or {}).get('description') or d.get('text'))[:160])
    elif m.get('method') == 'Log.entryAdded':
        e = m.get('params', {}).get('entry', {})
        if e.get('level') in ('error', 'warning'):
            errs.append(e.get('level') + ':' + str(e.get('text'))[:160])
print('CONSOLE_ERRORS:', errs if errs else 'NONE')
pc.send('Target.closeTarget', {'targetId': tid})
pc.close()
