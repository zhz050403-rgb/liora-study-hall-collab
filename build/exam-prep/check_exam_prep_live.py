# -*- coding: utf-8 -*-
"""
线上正式站验收（合法会话 + 真实无头浏览器）。

与 check_exam_prep_browser.py 的区别：那个用本地静态服务器托管 public/，
这个直连 https://liora-study-hall.app.workbuddy.host，用于确认「部署包内容」
与「用户实际打开的线上页面」一致 —— 11:45 的事故正是两者分叉造成的。

运行（浏览器必须在同一条 Bash 里先启动、后关闭）：
  py -3 <cdp-skill>/start_chrome.py --headless --temp && \
  py -3 网站/build/exam-prep/check_exam_prep_live.py ; \
  py -3 <cdp-skill>/stop_chrome.py

会话签法与 线上版/server.js 的 makeToken() 完全一致；只读 auth.json，
从不修改 sessionSecret 或任何账号数据。
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import http.cookiejar
import json
import os
import sys
import time
import urllib.request

os.environ["NO_PROXY"] = "127.0.0.1,localhost"
os.environ["no_proxy"] = "127.0.0.1,localhost"

SKILL = r"C:\Users\Liora\.workbuddy\skills\browser-automation-cdp\scripts"
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SKILL)
from cdp import CDPClient  # noqa: E402

HOST = "https://liora-study-hall.app.workbuddy.host"
DOMAIN = "liora-study-hall.app.workbuddy.host"
SHARE = "L4NKT6REQ6"
AUTH = os.path.normpath(os.path.join(HERE, "..", "..", "线上版", "auth.json"))
results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("  PASS  " if ok else "  FAIL  ") + name +
          (("  -> " + str(detail)[:220]) if detail else ""))


def js(c, expr):
    r = c.evaluate(expr)
    if isinstance(r, dict):
        if "value" in r:
            return r["value"]
        return (r.get("result") or {}).get("value")
    return r


def click(c, selector):
    return js(c, "(function(){var e=document.querySelector(%s);"
                 "if(!e)return false;e.click();return true;})()" % json.dumps(selector))


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def session_token() -> str:
    with open(AUTH, "r", encoding="utf-8") as f:
        a = json.load(f)
    user = a["users"][0]["user"]
    payload = b64url(json.dumps({
        "u": user,
        "exp": int(time.time() * 1000) + 90 * 86400000,
        "n": os.urandom(6).hex(),
    }, separators=(",", ":")).encode())
    sig = b64url(hmac.new(a["sessionSecret"].encode(), payload.encode(),
                          hashlib.sha256).digest())
    return payload + "." + sig


def share_cookie() -> str:
    jar = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    op.open(HOST + "/?sharecode=" + SHARE, timeout=25).read()
    for c in jar:
        if c.name == "__wb_rsc":
            return c.value
    raise RuntimeError("未取得 __wb_rsc cookie")


def main():
    token, rsc = session_token(), share_cookie()
    print("线上合法会话已生成（只读 auth.json）")

    c = CDPClient(port=9222, timeout=35)
    c.ensure_page()
    c.send("Network.enable")
    for name, value in (("__wb_rsc", rsc), ("liora_sess", token)):
        c.send("Network.setCookie", {
            "name": name, "value": value, "domain": DOMAIN,
            "path": "/", "secure": True,
        })

    url = HOST + "/exam-prep.html?sharecode=" + SHARE
    c.navigate(url, timeout=60)
    time.sleep(2.5)

    page = js(c, "({url:location.href,title:document.title})")
    check("线上打开的是备考页而非登录页",
          bool(page) and "exam-prep.html" in page.get("url", ""), page)

    stats = js(c, "window.EXAM_BANK ? window.EXAM_BANK.stats : null")
    check("线上题库数据加载完整（496 题 / 104 知识点）",
          bool(stats) and stats.get("questions") == 496 and
          stats.get("knowledgePoints") == 104, stats)
    check("五个视图标签渲染", js(c, "document.querySelectorAll('.ep-tab').length") == 5)

    # 核心回归：线上选择题批改曾因 [data-opt]:checked 取值失败而永远判错
    check("点击开始闭卷测试", click(c, '[data-act="start-exam"]'))
    time.sleep(0.7)
    n = js(c, "document.querySelectorAll('.ep-q').length")
    check("生成 12 道闭卷题", n == 12, n)
    check("交卷前不渲染答案/解析/官方原文",
          js(c, "(function(){return document.querySelectorAll("
                "'.ep-after,.ep-quote,.ep-source-toggle').length===0;})()"))

    # 12 题里自动挑一道「有选项」的题（单选/判断/定义识别/分类），
    # 避免抽到填空题时按选项点击而误判；点正确答案后整卷交卷，验证判分
    info = js(c, "(function(){var qs=document.querySelectorAll('.ep-q');"
              "var bank=window.EXAM_BANK.questions;"
              "for(var i=0;i<qs.length;i++){var id=qs[i].getAttribute('data-qid');"
              "var b=bank.filter(function(x){return x.id===id;})[0];"
              "if(b&&['single','definition','tf','classification'].indexOf(b.type)>=0)"
              "return {i:i,id:id,type:b.type,ans:b.correctAnswer};}"
              "return null;})()")
    check("找到一道有唯一标准答案的题", bool(info) and info.get("ans") is not None, info)
    if info and info.get("ans") is not None:
        qsel = "document.querySelectorAll('.ep-q')[%d]" % info["i"]
        expr = ("(function(){var q=" + qsel + ";"
                "var inp=q.querySelector('[data-opt=\"" + str(info["ans"]) + "\"] input');"
                "if(!inp)return false;inp.click();"
                "var g=q.querySelector('[data-guess]');if(g&&g.checked)g.click();"
                "return true;})()")
        check("正确答案被成功勾选", bool(js(c, expr)))
        # 闭卷模式用 submit-all；submit-one 只存在于「逐题自由练习」视图
        check("提交试卷并批改", bool(click(c, '[data-act="submit-all"]')))
        time.sleep(0.8)
        ok_text = js(c, "(function(){var q=" + qsel + ";var e=q.querySelector('.ep-ok');"
                     "return e?e.textContent.trim():null;})()")
        check("★ 线上批改判定为正确（旧版此处永远判错）",
              bool(ok_text) and "Correct" in ok_text, ok_text)
        rec = js(c, "(function(){var d=JSON.parse(localStorage.getItem("
                 "'liora-exam-prep-v1')||'{}');return (d.records||{})[" +
                 json.dumps(info["id"]) + "]||null;})()")
        check("答对且未标记不确定 → 不误入错题库",
              bool(rec) and rec.get("correct") == 1 and not rec.get("weak"), rec)

    # 官方原文回溯（验收点：每题可显示来源页码）
    check("交卷后显示官方原文、页码与查看教材入口",
          bool(js(c, "(function(){return !!document.querySelector('.ep-quote')"
                    " && !!document.querySelector('.ep-source-toggle')"
                    " && /p\\.\\s*\\d+/i.test((document.querySelector('.ep-src')||{}).textContent||'');})()")))

    c.close()
    passed = sum(1 for _, ok, _ in results if ok)
    print("\n%d checks, %d passed, %d failed" %
          (len(results), passed, len(results) - passed))
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
