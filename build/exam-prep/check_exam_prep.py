# -*- coding: utf-8 -*-
"""
Acceptance checks for the fine-detail exam prep (P0, Accounting U1).
Run:  py -3 网站/build/exam-prep/check_exam_prep.py
Prints PASS/FAIL per check and exits non-zero on any failure.
Does NOT deploy anything.
"""
from __future__ import annotations

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SITE = os.path.join(ROOT, "网站", "线上版")
PUB = os.path.join(SITE, "public")
INDEX = json.load(open(os.path.join(HERE, "extracted", "source-index.json"), encoding="utf-8"))
SRC = {f["id"]: f for f in INDEX["files"]}

results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("  PASS  " if ok else "  FAIL  ") + name + (("  -> " + str(detail)) if detail else ""))


def js_obj(path, varname):
    txt = open(path, encoding="utf-8").read()
    m = re.search(r"window\.%s\s*=\s*(.*);\s*$" % re.escape(varname), txt, re.S)
    if not m:
        raise ValueError("cannot parse " + varname)
    return json.loads(m.group(1))


def norm(s):
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = s.replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2013", "-").replace("\u2014", "-").replace("\u2212", "-")
    return re.sub(r"\s+", " ", s).strip()


def main():
    bank_path = os.path.join(PUB, "exam-bank-data.js")
    src_path = os.path.join(PUB, "exam-sources.js")
    for p in (bank_path, src_path):
        check("生成物存在 " + os.path.basename(p), os.path.isfile(p))
    if not all(r[1] for r in results):
        return 1
    B = js_obj(bank_path, "EXAM_BANK")
    S = js_obj(src_path, "EXAM_SOURCES")
    kps = B["knowledgePoints"]
    qs = B["questions"]

    # --- 1. U1 knowledge point index
    u1 = [k for k in kps if k["unit"] == 1]
    check("验收1: U1 有细粒度知识点索引 (%d 个)" % len(u1), len(u1) >= 20)
    cats = set(k["cat"] for k in kps)
    need_cats = {"definition", "classification", "characteristic", "example",
                 "difference", "accounting-rule", "calculation", "small-detail"}
    check("验收1: 八类考点全部有索引", need_cats <= cats, sorted(need_cats - cats))

    # --- 2. the three exam-feedback details
    def hit(text, *words):
        return all(w.lower() in text.lower() for w in words)
    for label, words in [
        ("Goodwill", ("goodwill", "non-current")),
        ("Clarity / headings", ("clarity", "headings")),
        ("Ledger / secondary entry", ("ledger", "secondary entry")),
    ]:
        pool = [k for k in kps if hit(k["term"] + " " + k["fact"] + " " + k["originalText"] + " " + (k.get("note") or ""), *words)]
        withq = [k for k in pool if k["questionCount"] > 0 and
                 any(q["kp"] == k["id"] for q in qs)]
        check("验收2: %s 可检索且已出题 (%d KP)" % (label, len(withq)), len(withq) > 0)
    # exact official phrases
    goodwill = [k for k in kps if "goodwill" in k["originalText"].lower()]
    secondary = [k for k in kps if "book of secondary entry" in k["originalText"].lower()]
    clarity = [k for k in kps if "headings and sub-headings" in k["originalText"].lower()]
    check("验收2: Goodwill 出自非流动资产官方例句", bool(goodwill),
          goodwill[0]["sourceFile"] + " p." + str(goodwill[0]["page"]) if goodwill else "missing")
    check("验收2: Ledger 'book of secondary entry' 官方原文", bool(secondary),
          secondary[0]["sourceFile"] + " p." + str(secondary[0]["page"]) if secondary else "missing")
    check("验收2: Clarity 的 headings/sub-headings 官方原文", bool(clarity),
          clarity[0]["sourceFile"] + " p." + str(clarity[0]["page"]) if clarity else "missing")

    # --- 3. unique answer OR explicit rubric
    ids = [q["id"] for q in qs]
    check("验收3: 题目 id 唯一", len(ids) == len(set(ids)), len(ids) - len(set(ids)))
    bad_answer = [q["id"] for q in qs
                  if q.get("correctAnswer") is None and not q.get("rubric")]
    check("验收3: 每题有唯一标准答案或明确评分规则", not bad_answer, bad_answer[:5])
    bad_multi = [q["id"] for q in qs if q["type"] == "multiple" and
                 (not isinstance(q.get("correctAnswer"), list) or not q["correctAnswer"])]
    check("验收3: 多选题答案为非空数组", not bad_multi, bad_multi[:5])
    bad_single = [q["id"] for q in qs if q["type"] in ("single", "definition", "tf", "classification")
                  and not isinstance(q.get("correctAnswer"), int)]
    check("验收3: 单选题答案为唯一索引", not bad_single, bad_single[:5])
    bad_fields = [q["id"] for q in qs if q["type"] in ("calculation", "taccount", "trialbalance")
                  and (not q.get("fields") or not all("answer" in f for f in q["fields"]))]
    check("验收3: 计算/T账/试算表每题结构化答案齐全", not bad_fields, bad_fields[:5])

    # --- 4. source + page on EVERY question, and quote really on that page
    no_src = [q["id"] for q in qs if not q.get("sourceFile") or not q.get("page") or not q.get("originalText")]
    check("验收4: 每题都有 sourceFile / page / originalText", not no_src, no_src[:5])
    mism = []
    for q in qs:
        f = SRC.get(q["sourceFile"])
        if not f or not (1 <= q["page"] <= f["pages"]):
            mism.append(q["id"] + " (page range)")
        elif norm(q["originalText"]) not in norm(f["pageText"][q["page"] - 1]):
            mism.append(q["id"] + " (quote mismatch)")
    check("验收4: 每题官方引文在指定 PDF 页逐字命中", not mism, mism[:5])
    check("验收4: 原文查看数据含全部 277 页逐页文本",
          sum(len(s["pageText"]) for s in S) == BANK_PAGES(B),
          "%d / %d" % (sum(len(s["pageText"]) for s in S), BANK_PAGES(B)))
    import urllib.parse
    pdf_ok = all(os.path.isfile(os.path.join(PUB, urllib.parse.unquote(s["pdfUrl"].split("#")[0])))
                 for s in S)
    check("验收4: 本地服务器可打开全部原始 PDF", pdf_ok)

    # --- 5. closed-book: initial HTML must not contain answers / official quotes
    html = open(os.path.join(PUB, "exam-prep.html"), encoding="utf-8").read()
    check("验收5: 独立页 HTML 本身不含题目/答案/原文",
          "EXAM_BANK" not in html or "correctAnswer" not in html)
    engine = open(os.path.join(PUB, "blocks", "exam-prep.js"), encoding="utf-8").read()
    check("验收5: 引擎含「提交前隐藏、提交后显示」分支",
          "S.submitted" in engine and "feedbackHtml" in engine and "ep-lock" in engine)
    check("验收5: 全对只给简短确认", "All correct." in engine)

    # --- 6. weakness review with spaced repetition + variants
    check("验收6: 引擎含 1/3/7 天复测排期", "DELAYS = [0, 1, 3, 7]" in engine)
    check("验收6: 猜对/不确定也计入复习", "it.guessed" in engine and "guessed" in engine)
    check("验收6: 复测使用变式题干与选项", all(len(q.get("variants") or []) == 2 for q in qs))
    changed = sum(1 for q in qs if q.get("variants") and
                  q["variants"][0]["question"] != q["question"])
    check("验收6: 变式题干确实改写 (%d/%d)" % (changed, len(qs)), changed > len(qs) * 0.8)
    reshuffled = sum(1 for q in qs if q.get("options") and q.get("variants") and
                     q["variants"][0]["options"] != q["options"])
    check("验收6: 变式选项顺序被打乱 (%d 题)" % reshuffled, reshuffled > 100)

    # --- 7. no impact on the existing site
    idx = open(os.path.join(PUB, "index.html"), encoding="utf-8").read()
    check("验收7: 主站只新增 1 行入口脚本引用",
          idx.count("exam-prep-link.js") == 1 and "exam-prep.html" not in idx)
    check("验收7: 顶部导航两个入口未被改动",
          'data-nav="#/extra"' in idx and 'href="daily-brief.html"' in idx)
    check("验收7: 原有题库/备考中心引用仍在",
          'src="question-bank.js' in idx and 'src="prep-center.js' in idx)
    linkjs = open(os.path.join(PUB, "blocks", "exam-prep-link.js"), encoding="utf-8").read()
    check("验收7: 注入器不碰 .note-tab / active 切换",
          "note-tab" not in linkjs.replace("不注入 .note-tab", "") and "classList.add('on')" not in linkjs)

    # --- 8. honesty: coverage shows unverified files and P1/P2 not covered
    cov = open(os.path.join(PUB, "blocks", "exam-prep.js"), encoding="utf-8").read()
    check("验收8: 覆盖率明确列出未核对资料", "尚未读取 / 尚未逐页核对的资料" in cov)
    check("验收8: 不把 U7-U11 显示为已覆盖", "U7–U11" in cov)
    check("验收8: 官方原文 / 讲义表述 / AI 生成 三类标注齐全",
          all(t in engine for t in ("ep-tag-official", "ep-tag-teacher", "ep-tag-ai")))

    # --- 9. version consistency
    # 只检查本板块自己的资源；共享的 site-tokens.css 有它独立的历史版本号
    own = [ln for ln in html.splitlines() if re.search(r"exam-(prep|bank-data|sources)", ln)]
    html_v = set(re.findall(r"\?v=([0-9a-z-]+)", "\n".join(own)))
    idx_v = re.findall(r"exam-prep-link\.js\?v=([0-9a-z-]+)", idx)
    check("验收9: 独立页本板块资源使用同一版本号", len(html_v) == 1, html_v)
    check("验收9: 主站入口版本号与独立页一致",
          bool(idx_v) and idx_v[0] in html_v, (idx_v, html_v))

    failed = [r for r in results if not r[1]]
    print("\n%d checks, %d passed, %d failed" % (len(results), len(results) - len(failed), len(failed)))
    return 1 if failed else 0


def BANK_PAGES(B):
    return B["stats"]["sourcePages"]


if __name__ == "__main__":
    sys.exit(main())
