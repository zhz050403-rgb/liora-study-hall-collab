# -*- coding: utf-8 -*-
"""线上复测：路由修复 / 幽灵文件 / WebP / 统一版 cloud-sync。"""
import json, sys, time
sys.path.insert(0, r'C:/Users/Liora/.workbuddy/skills/browser-automation-cdp/scripts')
import cdp

BASE = 'https://liora-study-hall.app.workbuddy.host/?sharecode=L4NKT6REQ6'

def probe(url, label):
    """带 Range 的轻量探测，返回 [status, content-type, content-length]。"""
    js = """(async function(u){
      try {
        var r = await fetch(u, {cache:'no-store', headers:{'Range':'bytes=0-0'}});
        var out = [r.status, r.headers.get('content-type'), r.headers.get('content-length')];
        if(r.body) try{ await r.body.cancel(); }catch(e){}
        return out;
      } catch(e){ return ['ERR', String(e)]; }
    })""" + "('%s')" % url.replace("'", "\\'")
    return js

client = cdp.CDPClient(port=9222, timeout=60)
client.connect_browser()
# 用缓存破坏参数强制拿新 index.html
fresh = BASE + '&_v=verify' + str(int(time.time())) + '#/profile?type=exam'
created = client.send('Target.createTarget', {'url': fresh})
tid = created.get('targetId')
print('CREATED_TAB:', tid)
client.close()

time.sleep(8)  # 等待页面与脚本加载

pc = cdp.CDPClient(port=9222, timeout=60)
pc.connect_page(tid)
pc.send('Page.enable')
pc.send('Runtime.enable')

# 直接验证路由函数对该 hash 的判定（不依赖整页加载）
js = """(async function(){
  var out = {};
  // 1) 当前渲染是否为学习档案页
  out.profileRendered = !!document.querySelector('.prof-hero');
  out.hash = location.hash;
  out.title = document.title;
  out.bodyHasProfile = document.body.innerText.indexOf('学习档案') >= 0;
  // 2) prefill：renderProfile 把 type=exam 预填到哪里？查找 select/input 是否有 exam
  var sel = document.querySelector('#profType, select[data-prof-type], select');
  out.profTypeVal = sel ? sel.value : 'NO_SELECT';
  // 3) 资源探测（Range 轻量）
  function P(u){ return fetch(u, {cache:'no-store', headers:{'Range':'bytes=0-0'}}).then(function(r){
      var o=[r.status, r.headers.get('content-type'), r.headers.get('content-length')];
      if(r.body) return r.body.cancel().then(function(){return o;}); return o;
    }).catch(function(e){ return ['ERR', String(e)]; }); }
  out.readingData = await P('/reading-data.js');
  out.bannerWebp  = await P('/cabin-art/banner-todo-library.webp');
  out.cloudSync   = await P('/cloud-sync.js?v=20261107c');
  out.cloudSyncOld= await P('/cloud-sync.js?v=2');
  return out;
})()"""
r = pc.send('Runtime.evaluate', {'expression': js, 'awaitPromise': True, 'returnByValue': True}, timeout=90)
val = r.get('result', {}).get('value')
if r.get('exceptionDetails'):
    print('EXC:', json.dumps(r['exceptionDetails'], ensure_ascii=False)[:500])
print(json.dumps(val, ensure_ascii=False, indent=1))
pc.send('Target.closeTarget', {'targetId': tid})
pc.close()
