# -*- coding: utf-8 -*-
"""
End-to-end browser acceptance for the fine-detail exam prep.

Starts its OWN static server over 线上版/public (no login wall, no publish),
then drives a real headless Chrome through CDP:

  闭卷 -> 交卷 -> 严格批改 -> 错题入库 -> 1/3/7 天队列 -> 知识点检索
  -> 查看官方逐页原文 -> 覆盖率 -> 响应式 -> 主站页脚入口

Run in ONE bash line (browser must stay alive):
  py -3 <skill>/start_chrome.py --headless --temp && \
  py -3 网站/build/exam-prep/check_exam_prep_browser.py ; \
  py -3 <skill>/stop_chrome.py
"""
from __future__ import annotations

import functools
import http.server
import json
import os
import sys
import threading
import time

os.environ["NO_PROXY"] = "127.0.0.1,localhost"
os.environ["no_proxy"] = "127.0.0.1,localhost"

SKILL = r"C:\Users\Liora\.workbuddy\skills\browser-automation-cdp\scripts"
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SKILL)
sys.path.insert(0, HERE)
from cdp import CDPClient  # noqa: E402

PUBLIC = os.path.normpath(os.path.join(HERE, "..", "..", "线上版", "public"))
PORT = 8903
BASE = "http://127.0.0.1:%d" % PORT
SHARE = "L4NKT6REQ6"
results = []


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("  PASS  " if ok else "  FAIL  ") + name + (("  -> " + str(detail)[:220]) if detail else ""))


def js(c, expr):
    r = c.evaluate(expr)
    if isinstance(r, dict):
        if "value" in r:
            return r["value"]
        return (r.get("result") or {}).get("value")
    return r


def click(c, selector):
    return js(c, "(function(){var e=document.querySelector(%s);if(!e)return false;e.click();return true;})()" % json.dumps(selector))


def wait(c, expr, timeout=12.0, step=0.25):
    end = time.time() + timeout
    last = None
    while time.time() < end:
        try:
            last = js(c, expr)
        except Exception:
            last = None
        if last:
            return last
        time.sleep(step)
    return last


def main():
    srv = http.server.ThreadingHTTPServer(
        ("127.0.0.1", PORT),
        functools.partial(Quiet, directory=PUBLIC))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    print("local static server:", BASE, "->", PUBLIC)

    c = CDPClient(port=9222, timeout=30)
    c.ensure_page()
    c.send("Network.enable")
    c.navigate(BASE + "/exam-prep.html?sharecode=" + SHARE, timeout=40)
    time.sleep(1.5)

    stats = js(c, "window.EXAM_BANK ? window.EXAM_BANK.stats : null")
    check("页面加载题库数据", bool(stats) and stats.get("questions") == 496, stats)
    check("五个视图标签渲染", js(c, "document.querySelectorAll('.ep-tab').length") == 5)
    # 「规则说明」里会出现「正确答案」四个字，不能据此判泄露；看真实反馈节点
    check("首屏无答案/原文节点",
          js(c, "(function(){return document.querySelectorAll('.ep-q,.ep-after,.ep-quote,.ep-source-toggle').length===0;})()"))

    # ---- 闭卷测试 ----
    check("点击开始闭卷测试", click(c, '[data-act="start-exam"]'))
    time.sleep(0.6)
    nq = js(c, "document.querySelectorAll('.ep-q').length")
    check("生成闭卷试卷 (%s 题)" % nq, nq == 12, nq)
    lock = js(c, "(function(){var t=document.body.innerText;return {" +
              "lock:t.indexOf('闭卷进行中')>=0," +
              "answer:t.indexOf('正确答案')>=0," +
              "quote:document.querySelectorAll('.ep-quote').length," +
              "srcBtn:document.querySelectorAll('.ep-source-toggle').length," +
              "after:document.querySelectorAll('.ep-after').length};})()")
    check("交卷前：答案/解析/官方原文全部隐藏",
          bool(lock) and lock["lock"] and not lock["answer"] and
          lock["quote"] == 0 and lock["srcBtn"] == 0 and lock["after"] == 0, lock)

    # 全部留空 -> 全部判错，验证严格批改
    check("提交试卷", click(c, '[data-act="submit-all"]'))
    time.sleep(0.8)
    after = js(c, "(function(){var t=document.body.innerText;return {" +
               "after:document.querySelectorAll('.ep-after').length," +
               "wrong:document.querySelectorAll('.ep-wrong').length," +
               "quotes:document.querySelectorAll('.ep-quote').length," +
               "hasAnswer:t.indexOf('正确答案')>=0," +
               "hasReason:t.indexOf('错误原因')>=0," +
               "hasOfficial:t.indexOf('官方原文')>=0," +
               "hasRubric:t.indexOf('评分规则')>=0," +
               "score:(document.querySelector('.ep-score-big')||{}).textContent};})()")
    check("交卷后逐题给出完整批改", bool(after) and after["after"] == 12 and
          after["wrong"] >= 12 and after["hasAnswer"] and after["hasReason"], after)
    check("批改附官方依据与评分规则",
          bool(after) and after["quotes"] >= 12 and after["hasOfficial"] and after["hasRubric"], after)
    check("全错时显示 0 / 12", bool(after) and after["score"].replace(" ", "") == "0/12", after["score"] if after else None)

    # ---- 错题库 ----
    rec = js(c, "(function(){var d=JSON.parse(localStorage.getItem('liora-exam-prep-v1')||'{}');" +
             "var r=d.records||{}, ks=Object.keys(r), weak=ks.filter(function(k){return r[k].weak;});" +
             "return {total:ks.length,weak:weak.length," +
             "stage0:weak.filter(function(k){return r[k].stage===0;}).length," +
             "dueToday:weak.filter(function(k){return r[k].nextDue<=new Date().toISOString().slice(0,10);}).length," +
             "sample:r[ks[0]]};})()")
    check("错题自动进入错题库", bool(rec) and rec["weak"] >= 12, rec)
    check("当天订正排期 (stage 0 / due today)",
          bool(rec) and rec["stage0"] >= 12 and rec["dueToday"] >= 12, rec)

    check("切到错题复习视图", click(c, '[data-tab="review"]'))
    time.sleep(0.4)
    rev = js(c, "(function(){var t=document.body.innerText;return {" +
             "due:t.indexOf('今天到期')>=0, sched:t.indexOf('1 天')>=0 && t.indexOf('3 天')>=0 && t.indexOf('7 天')>=0," +
             "rows:document.querySelectorAll('.ep-table tbody tr').length};})()")
    check("复习视图显示到期队列与 1/3/7 天排期", bool(rev) and rev["due"] and rev["sched"] and rev["rows"] >= 12, rev)

    # ---- 知识点索引 + 三个验收细节 ----
    for tab in ("index",):
        click(c, '[data-tab="%s"]' % tab)
    time.sleep(0.4)
    def search(word):
        js(c, "(function(){var e=document.getElementById('epSearch');" +
           "e.value=%s;e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()" % json.dumps(word))
        time.sleep(0.6)
        return js(c, "(function(){return [].slice.call(document.querySelectorAll('.ep-kp')).map(function(x){return x.innerText;});})()")
    for word, must in [("Goodwill", "Non-current"), ("Clarity", "headings"), ("Ledger", "secondary entry")]:
        hits = search(word)
        check("知识点检索 %s" % word,
              bool(hits) and any(must.lower() in h.lower() for h in hits),
              (len(hits), hits[0][:150] if hits else ""))

    hits = search("Goodwill")
    check("打开 Goodwill 知识点详情", click(c, ".ep-kp"))
    time.sleep(0.35)
    kp = js(c, "(function(){var m=document.querySelector('.ep-modal');if(!m)return null;" +
            "return {text:m.innerText,hasQuote:m.querySelectorAll('.ep-quote').length," +
            "hasNote:m.querySelectorAll('.ep-ai-note,.ep-teacher-note').length," +
            "hasVideo:m.innerText.indexOf('双语视频')>=0};})()")
    check("详情区分官方原文 / AI 提示 / 视频辅助",
          bool(kp) and kp["hasQuote"] >= 1 and kp["hasVideo"] and
          "goodwill and investments" in kp["text"].lower(), kp)

    check("点「查看教材原文」", click(c, ".ep-modal [data-src]"))
    time.sleep(0.35)
    page = js(c, "(function(){var m=document.querySelector('.ep-modal');if(!m)return null;" +
              "return {text:m.innerText,pdf:!!m.querySelector('a[href*=\"sources/accounting-2026\"]')," +
              "hasExact:m.innerText.indexOf('goodwill and investments')>=0," +
              "hasSha:m.innerText.indexOf('SHA256')>=0};})()")
    check("逐页原文显示真实 PDF 内容与页码/SHA256",
          bool(page) and page["hasExact"] and page["pdf"] and page["hasSha"], page)
    click(c, '[data-act="close-modal"]')

    # ---- 覆盖率 ----
    click(c, '[data-tab="coverage"]')
    time.sleep(0.4)
    cov = js(c, "(function(){var t=document.body.innerText;return {" +
             "units:document.querySelectorAll('.ep-table tbody tr').length," +
             "unverified:t.indexOf('尚未读取 / 尚未逐页核对的资料')>=0," +
             "p1:t.indexOf('U7–U11')>=0};})()")
    check("覆盖率展示 6 个 Unit 与未覆盖边界",
          bool(cov) and cov["units"] == 6 and cov["unverified"] and cov["p1"], cov)

    # ---- 响应式 ----
    for w in (390, 1280):
        c.send("Emulation.setDeviceMetricsOverride",
               {"width": w, "height": 900, "deviceScaleFactor": 1, "mobile": w < 500})
        time.sleep(0.3)
        ov = js(c, "document.documentElement.scrollWidth - window.innerWidth")
        check("宽度 %d 无横向溢出" % w, isinstance(ov, (int, float)) and ov <= 1, ov)
    c.send("Emulation.clearDeviceMetricsOverride")

    # ---- 猜对/不确定 也要进复习；重测变式必须区别于首测 ----
    c.navigate(BASE + "/exam-prep.html?sharecode=" + SHARE, timeout=40)
    time.sleep(1.2)
    comp = js(c, "(function(){var d=JSON.parse(localStorage.getItem('liora-exam-prep-v1')||'{}');" +
              "var ks=Object.keys(d.records||{});if(!ks.length)return null;" +
              "var q=window.EXAM_BANK.questions.filter(function(x){return x.id===ks[0];})[0];" +
              "return q?{id:q.id,base:q.question,opts:JSON.stringify(q.options)," +
              "v0:q.variants[0].question,v0opts:JSON.stringify(q.variants[0].options)," +
              "v1:q.variants[1].question}:null;})()")
    check("重测变式改写题干并打乱选项顺序（不靠记位置）",
          bool(comp) and comp["v0"] != comp["base"] and comp["v1"] != comp["v0"] and
          comp["v0opts"] != comp["opts"], comp)

    info = None
    for _ in range(8):
        click(c, '[data-act="start-practice"]')
        time.sleep(0.35)
        info = js(c, "(function(){var q=document.querySelector('.ep-q');if(!q)return null;" +
                  "var id=q.getAttribute('data-qid');" +
                  "var b=window.EXAM_BANK.questions.filter(function(x){return x.id===id;})[0];" +
                  "return b?{id:id,type:b.type,ans:b.correctAnswer}:null;})()")
        if info and info["type"] in ("single", "definition", "tf", "classification"):
            break
        click(c, '[data-act="quit"]')
        time.sleep(0.25)
    check("首测使用原始题（可取得唯一标准答案）", bool(info) and info["type"] in
          ("single", "definition", "tf", "classification"), info)
    if info and info["type"] in ("single", "definition", "tf", "classification"):
        expr = ("(function(){var q=document.querySelector('.ep-q');"
                "var inp=q.querySelector('[data-opt=\"" + str(info["ans"]) + "\"] input');"
                "if(!inp)return false;inp.click();"
                "var g=q.querySelector('[data-guess]');if(g&&!g.checked)g.click();return true;})()")
        js(c, expr)
        click(c, '[data-act="submit-one"]')
        time.sleep(0.5)
        expr2 = ("(function(){var d=JSON.parse(localStorage.getItem('liora-exam-prep-v1')||'{}');"
                 "return (d.records||{})[" + json.dumps(info["id"]) + "]||null;})()")
        gr = js(c, expr2)
        check("答对但勾选「不确定」仍进入错题库",
              bool(gr) and gr["weak"] and gr["reason"] == "guessed", gr)

    # ---- 主站入口注入（不破坏导航） ----
    try:
        c.navigate(BASE + "/index.html?sharecode=" + SHARE, timeout=60)
        time.sleep(2.5)
        site = js(c, "(function(){var f=document.querySelector('footer.site-footer');return {" +
                  "footer:f?!!f.querySelector('a[href^=\"exam-prep.html\"]'):false," +
                  "extra:!!document.querySelector('[data-nav=\"#/extra\"]')," +
                  "brief:!!document.querySelector('a[href=\"daily-brief.html\"]')," +
                  "oldBank:!!document.querySelector('script[src*=\"question-bank.js\"]')," +
                  "chips:document.querySelectorAll('.ep-chip').length};})()")
        check("主站页脚出现细节备考入口且原有导航/题库未动",
              bool(site) and site["footer"] and site["extra"] and site["brief"] and site["oldBank"], site)
    except Exception as e:
        check("主站页脚入口注入（可选）", False, str(e)[:180])

    srv.shutdown()
    failed = [r for r in results if not r[1]]
    print("\n%d browser checks, %d passed, %d failed" % (len(results), len(results) - len(failed), len(failed)))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
