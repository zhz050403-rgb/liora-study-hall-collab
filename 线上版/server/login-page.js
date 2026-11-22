/* 登录页渲染（月光哥特图书馆蓝金风；个人模式下弱化公开注册引导，保留 ?next= 回跳） */
'use strict';

const LOGIN_CSS = `
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{font-family:"Songti SC","STSong","SimSun",Georgia,serif;background:#08192f;color:#f2e8d2;display:grid;place-items:center;padding:24px;
 background-image:radial-gradient(ellipse at 50% -10%,rgba(116,155,203,.28),transparent 58%),linear-gradient(180deg,#0d2440 0%,#08192f 60%,#050e1d 100%)}
.card{width:min(420px,100%);background:rgba(13,34,60,.88);border:1px solid rgba(201,165,92,.45);border-radius:18px;
 padding:38px 34px 30px;box-shadow:0 24px 70px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06);text-align:center}
.crest{width:76px;height:76px;margin:0 auto 16px;border-radius:50%;border:2px solid #c9a55c;display:grid;place-items:center;
 background:radial-gradient(circle at 50% 35%,#254a76,#0b1f38);font-size:34px;color:#e9d6a7;box-shadow:0 0 0 6px rgba(201,165,92,.09)}
h1{font-size:25px;letter-spacing:.16em;margin:6px 0 6px;color:#f5e9cd;font-weight:600}
.en{font:400 11px/1.6 Georgia,serif;letter-spacing:.28em;color:#a9bdd6;margin:0 0 26px;text-transform:uppercase}
label{display:block;text-align:left;font-size:13px;letter-spacing:.08em;color:#cbd8ea;margin:16px 0 7px}
input{width:100%;height:48px;padding:0 14px;border-radius:9px;border:1px solid rgba(168,192,222,.32);background:rgba(4,14,28,.6);
 color:#fff;font-size:16px;outline:none;font-family:system-ui,"Microsoft YaHei",sans-serif;transition:border-color .2s,box-shadow .2s}
input:focus{border-color:#c9a55c;box-shadow:0 0 0 3px rgba(201,165,92,.16)}
button{width:100%;height:48px;margin-top:24px;border:0;border-radius:9px;background:linear-gradient(180deg,#d9b96f,#b8923f);
 color:#12233c;font-size:15px;font-weight:700;letter-spacing:.18em;cursor:pointer;font-family:inherit}
button:hover{filter:brightness(1.08)}button:active{transform:translateY(1px)}button:disabled{opacity:.6;cursor:wait}
.err{min-height:20px;margin-top:14px;font-size:13px;color:#f0a9a0;font-family:system-ui,"Microsoft YaHei",sans-serif}
.foot{margin-top:22px;font:400 11px/1.8 system-ui,"Microsoft YaHei",sans-serif;color:#7f96b2;letter-spacing:.04em}
.reg{margin-top:18px;padding-top:16px;border-top:1px solid rgba(168,192,222,.2);font:400 13px/1.6 system-ui,"Microsoft YaHei",sans-serif;color:#a9bdd6}
.reg a{color:#e9cf8f;text-decoration:none;font-weight:700;letter-spacing:.04em}
.reg a:hover{text-decoration:underline}
@media (max-width:400px){body{padding:10px}.card{padding:22px 18px 20px}.crest{width:56px;height:56px;font-size:26px}
 h1{font-size:20px}.en{margin-bottom:16px}button{margin-top:18px}}
`;

function renderLoginPage(err, opts) {
  const personalMode = !(opts && opts.personalMode === false);
  const regHtml = personalMode
    ? ''
    : '<div class="reg">还没有账号？<a href="/register.html">用手机号注册 →</a><br><span style="font-size:11px;color:#7f96b2">新注册默认只开放「英语学习」，更多内容由管理员授权</span></div>';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>登录 · Liora 的学习小屋</title><style>${LOGIN_CSS}</style></head><body>
<form class="card" id="f" method="post" action="/__login" autocomplete="on">
<div class="crest" aria-hidden="true">✦</div><h1>Liora 的学习小屋</h1><p class="en">Private Study Hall · UNSW 2026</p>
<label for="u">账号</label><input id="u" name="u" type="text" required autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="请输入账号">
<label for="p">密码</label><input id="p" name="p" type="password" required placeholder="请输入密码">
<button type="submit" id="go">进 入 学 习 小 屋</button><div class="err" id="err">${err || ''}</div>
<div class="foot">登录后 90 天内自动保持登录状态<br>学习进度、错题本与批注自动同步云端，支持一键备份导出</div>${regHtml}</form>
<script>
document.getElementById('f').addEventListener('submit',function(ev){
 ev.preventDefault();var b=document.getElementById('go'),e=document.getElementById('err');
 b.disabled=true;e.textContent='';
 fetch('/__login',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
  body:JSON.stringify({u:document.getElementById('u').value,p:document.getElementById('p').value})})
 .then(function(r){return r.json().then(function(j){return {s:r.status,j:j}})})
 .then(function(x){if(x.j.ok){
  var n=x.j.redirect||'/';try{var q=new URLSearchParams(location.search).get('next');
   if(q&&q.charAt(0)==='/'&&q.indexOf('//')!==0&&n==='/')n=q;}catch(err){}
  location.href=n;
 }else{e.textContent=x.j.error||'登录失败';b.disabled=false;}})
 .catch(function(){e.textContent='网络异常，请重试';b.disabled=false;});
});
</script></body></html>`;
}

module.exports = { renderLoginPage };
