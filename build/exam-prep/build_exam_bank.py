# -*- coding: utf-8 -*-
"""
Compile-time gate for the fine-detail exam bank.

  1. Verify EVERY official quote against the real 2026 PDF page (source-index.json).
  2. Expand authored knowledge points into multi-angle English exam questions.
  3. Emit public/exam-bank-data.js + public/exam-sources.js and a QA report.

If any quote fails verification the build ABORTS and writes no deliverable files.
Run:  py -3 网站/build/exam-prep/build_exam_bank.py
"""
from __future__ import annotations

import hashlib
import json
import os
import random
import re
import shutil
import sys
import urllib.parse
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SITE = os.path.join(ROOT, "网站", "线上版")
PUB = os.path.join(SITE, "public")
COURSE_DIR = os.path.join(ROOT, "Course_ FNDN Accounting 2026 STD O2 _ UNSW_week type unit")
PDF_DEST = os.path.join(PUB, "sources", "accounting-2026")

sys.path.insert(0, HERE)
import bank_source as B  # noqa: E402

VERSION = "20261113-exam-prep-p0"
COURSE = "accounting"
TERM = "term1"


def norm(s: str) -> str:
    """Whitespace/punctuation-tolerant normalisation for verbatim quote checking."""
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = s.replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2013", "-").replace("\u2014", "-").replace("\u2212", "-")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def rng_for(seed: str):
    return random.Random(int(hashlib.md5(seed.encode("utf-8")).hexdigest()[:12], 16))


def shuffled(options, answer, rng):
    """Return (shuffled options, remapped answer). answer = int | list[int] | other."""
    idx = list(range(len(options)))
    rng.shuffle(idx)
    new_opts = [options[i] for i in idx]
    if isinstance(answer, int):
        new_ans = idx.index(answer)
    elif isinstance(answer, list):
        pos = {old: new for new, old in enumerate(idx)}
        new_ans = sorted(pos[a] for a in answer if a in pos)
    else:
        new_ans = answer
    return new_opts, new_ans


# ---------------------------------------------------------------- verification
def verify():
    with open(os.path.join(HERE, "extracted", "source-index.json"), encoding="utf-8") as fh:
        index = json.load(fh)
    files = {f["id"]: f for f in index["files"]}
    errors, warnings, checked = [], [], 0

    def check(quote, src, page, where):
        nonlocal checked
        checked += 1
        if src not in files:
            errors.append("%s: unknown source id %r" % (where, src))
            return
        f = files[src]
        if not (1 <= page <= f["pages"]):
            errors.append("%s: page %s out of range for %s (1..%s)" % (where, page, src, f["pages"]))
            return
        hay = norm(f["pageText"][page - 1])
        needle = norm(quote)
        if needle not in hay:
            errors.append("%s: QUOTE NOT FOUND on %s p.%s\n    looking for: %s" %
                         (where, src, page, needle[:160]))

    for kp in B.KPS:
        check(kp["quote"], kp["src"], kp["page"], kp["id"])
        for src, page, quote in kp["extra"]:
            check(quote, src, page, kp["id"] + ":extra")
        if kp["fill"] and norm(kp["fill"]) not in norm(kp["quote"]):
            warnings.append("%s: fill %r not inside quote -> fill-in-the-blank question skipped"
                            % (kp["id"], kp["fill"]))
    for q in B.SPECIAL:
        check(q["quote"], q["src"], q["page"], q["id"])
    return index, files, errors, warnings, checked


# ---------------------------------------------------------------- generation
STEM = {
    "single": [
        "According to the 2026 official Unit {u} material, which statement about {term} is correct?",
        "Which of the following correctly states the official Unit {u} position on {term}?",
        "The 2026 UNSW course material on {term} (Unit {u}) supports which ONE of these statements?",
    ],
    "definition": [
        'Which term is defined by this official statement? "{quote}"',
        'Identify the term that matches this quotation from the Unit {u} official material: "{quote}"',
        'The official 2026 reading states: "{quote}" Which concept does this describe?',
    ],
    "fill": [
        "Complete this sentence from the official Unit {u} material: {blanked}",
        "Fill in the missing wording in this official sentence (Unit {u}): {blanked}",
        "Using the exact wording of the course material, complete: {blanked}",
    ],
    "tf": [
        "True or False, according to the official Unit {u} material? {statement}",
        "Does the 2026 course material support this statement? {statement}",
        "Mark this statement True or False using the Unit {u} official source: {statement}",
    ],
    "classification": [
        "In the 2026 official material, how is {term} classified?",
        "Which category does {term} belong to in the official Unit {u} source?",
        "Classify {term} as the Unit {u} course material does.",
    ],
    "multiple": [
        "Select ALL statements about {term} that are supported by the official Unit {u} material.",
        "According to the 2026 Unit {u} source, which of these statements about {term} are correct? Select ALL.",
        "Choose every correct statement about {term} from the official course material.",
    ],
}


def base_question(qid, kp, qtype, stem, options, answer, **kw):
    q = dict(
        id=qid, kp=kp["id"], course=COURSE, term=TERM, unit=kp["unit"],
        topic=kp["topic"], cat=kp["cat"], type=qtype,
        question=stem, options=options, correctAnswer=answer,
        explanation=kw.pop("explanation", ""),
        rubric=kw.pop("rubric", "One correct option only. No partial credit."),
        sourceFile=kp["src"], page=kp["page"], originalText=kp["quote"],
        provenance="ai-question", flag=kp.get("flag") or "",
        accepted=kw.pop("accepted", None),
    )
    q.update(kw)
    return q


def variants_for(q, kp, qtype, rng_seed, blanks=None):
    """Two retest variants: different stem wording AND different answer position."""
    out = []
    for vi in (1, 2):
        rng = rng_for("%s|%s|v%d" % (VERSION, rng_seed, vi))
        tmpl = STEM[qtype][vi] if qtype in STEM else None
        stem = q["question"]
        if tmpl:
            stem = tmpl.format(u=kp["unit"], term=kp["term"],
                               quote=kp["quote"], statement=stem, blanked=blanks or "")
            # tf templates embed the statement in `stem` already; avoid nesting
            if qtype == "tf":
                stem = STEM["tf"][vi].format(u=kp["unit"], statement=q.get("_statement", q["question"]))
        opts, ans = q["options"], q["correctAnswer"]
        if qtype in ("single", "definition", "classification", "multiple") and opts:
            opts, ans = shuffled(opts, ans, rng)
        v = dict(question=stem, options=opts, correctAnswer=ans)
        if q.get("accepted"):
            v["accepted"] = q["accepted"]
        out.append(v)
    return out


def expand_kp(kp, all_kps):
    """One knowledge point -> several exam questions from different angles."""
    made = []
    uid = kp["unit"]
    src_note = "Official source: %s, p.%d." % (kp["src"], kp["page"])
    rng = rng_for(VERSION + "|" + kp["id"])
    same_unit_terms = [x["term"] for x in all_kps
                       if x["unit"] == uid and x["id"] != kp["id"]]
    rng.shuffle(same_unit_terms)
    distractor_terms = same_unit_terms[:3]
    while len(distractor_terms) < 3:
        distractor_terms.append("Trial Balance")

    # 1. Single-choice: concept -> correct fact
    opts, ans = shuffled([kp["fact"]] + list(kp["wrong"]), 0, rng)
    q = base_question(kp["id"] + "-q1", kp, "single",
                      STEM["single"][0].format(u=uid, term=kp["term"]), opts, ans,
                      explanation="%s The official wording is: \"%s\" The other options are AI-written distractors, not course material."
                                  % (src_note, kp["quote"]),
                      rubric="Exactly one correct option. No partial credit.")
    q["variants"] = variants_for(q, kp, "single", kp["id"] + "-single")
    made.append(q)

    # 2. Definition recognition: quote -> term
    opts, ans = shuffled([kp["term"]] + distractor_terms, 0, rng)
    q = base_question(kp["id"] + "-q2", kp, "definition",
                      STEM["definition"][0].format(u=uid, quote=kp["quote"]), opts, ans,
                      explanation="%s This quotation is verbatim from the official 2026 PDF page." % src_note,
                      rubric="Exactly one term matches the quotation. No partial credit.")
    q["variants"] = variants_for(q, kp, "definition", kp["id"] + "-def")
    made.append(q)

    # 3. Fill in the blanks (only when the blank really appears in the quote)
    if kp["fill"] and norm(kp["fill"]) in norm(kp["quote"]):
        blanked = norm(kp["quote"]).replace(norm(kp["fill"]), "________", 1)
        stem = STEM["fill"][0].format(u=uid, blanked=blanked)
        accepted = [kp["fill"], kp["fill"].lower(), kp["fill"].upper()]
        q = base_question(kp["id"] + "-q3", kp, "fill", stem, None, kp["fill"],
                          accepted=accepted,
                          explanation="%s Expected wording: \"%s\"." % (src_note, kp["fill"]),
                          rubric="Exact wording from the official material (case-insensitive, punctuation ignored). No partial credit.")
        q["variants"] = variants_for(q, kp, "fill", kp["id"] + "-fill", blanks=blanked)
        made.append(q)

    # 4. True / False - flagged KPs get both a True and a False version
    statements = [(kp["fact"], 0, "True statement")]
    if kp.get("flag"):
        statements.append((kp["wrong"][1], 1, "False statement"))
    for si, (statement, ans, label) in enumerate(statements):
        stem = STEM["tf"][0].format(u=uid, statement=statement)
        q = base_question("%s-q4%d" % (kp["id"], si), kp, "tf", stem,
                          ["True", "False"], ans,
                          explanation="%s %s. Official wording: \"%s\"" %
                                      (src_note, label, kp["quote"]),
                          rubric="One mark. No partial credit.", _statement=statement)
        q["variants"] = variants_for(q, kp, "tf", kp["id"] + "-tf%d" % si)
        made.append(q)

    # 5. Classification
    if kp.get("cls"):
        pool = ["Current asset", "Non-current asset", "Current liability", "Expense",
                "Revenue", "Owner's equity", "first book of entry", "contra asset",
                "income statement", "statement of financial position"]
        wrong = [x for x in pool if x.lower() != kp["cls"].lower()][:3]
        opts, ans = shuffled([kp["cls"]] + wrong, 0, rng)
        q = base_question(kp["id"] + "-q5", kp, "classification",
                          STEM["classification"][0].format(u=uid, term=kp["term"]), opts, ans,
                          explanation="%s Official wording: \"%s\"" % (src_note, kp["quote"]),
                          rubric="Exactly one correct classification. No partial credit.")
        q["variants"] = variants_for(q, kp, "classification", kp["id"] + "-cls")
        made.append(q)

    # 6. Multiple-choice (select all)
    if kp.get("multi"):
        correct = list(kp["multi"])[:6]
        wrong = list(kp["wrong"])[:3]
        while len(wrong) < 3:
            wrong.append("None of the above is mentioned in the official material")
        n_ok = len(correct)
        opts, ans = shuffled(correct + wrong, list(range(n_ok)), rng)
        q = base_question(kp["id"] + "-q6", kp, "multiple",
                          STEM["multiple"][0].format(u=uid, term=kp["term"]), opts, ans,
                          explanation="%s Official wording: \"%s\"" % (src_note, kp["quote"]),
                          rubric="ALL correct options and NO incorrect options. Any error marks the question for review.")
        q["variants"] = variants_for(q, kp, "multiple", kp["id"] + "-multi")
        made.append(q)
    return made


def expand_special(s):
    q = dict(
        id=s["id"], kp=s["kp"], course=COURSE, term=TERM, unit=s["unit"],
        topic=s["topic"], cat=s["cat"], type=s["type"],
        question=s["stem"], options=s.get("options"),
        correctAnswer=s.get("answer", s.get("rows")),
        explanation=s["explanation"], rubric=s["rubric"],
        sourceFile=s["src"], page=s["page"], originalText=s["quote"],
        provenance="ai-question", flag="structured marking",
        fields=s.get("fields"), accountOptions=s.get("accountOptions"),
        rows=s.get("rows"), amountOptional=s.get("amountOptional", False),
        adapted=s.get("adapted", False),
    )
    # Two variants with reworded stems and reshuffled options.
    vs = []
    for vi in (1, 2):
        rng = rng_for(VERSION + "|" + s["id"] + "|v%d" % vi)
        prefix = ["", "Answer using the 2026 official Unit %d material. " % s["unit"],
                  "Closed book. "][vi]
        v = dict(question=prefix + s["stem"], options=s.get("options"),
                 correctAnswer=s.get("answer", s.get("rows")))
        if s.get("options"):
            opts, ans = shuffled(list(s["options"]), s.get("answer"), rng)
            v["options"], v["correctAnswer"] = opts, ans
        if s.get("accountOptions"):
            ao = list(s["accountOptions"])
            rng.shuffle(ao)
            v["accountOptions"] = ao
        if s.get("fields"):
            fs = []
            for f in s["fields"]:
                f2 = dict(f)
                if f2.get("options"):
                    opts2 = list(f2["options"])
                    rng.shuffle(opts2)
                    f2["options"] = opts2
                fs.append(f2)
            v["fields"] = fs
        vs.append(v)
    q["variants"] = vs
    return q


def main():
    index, files, errors, warnings, checked = verify()
    print("verified %d official quotes against real 2026 PDF pages" % checked)
    if errors:
        print("\n!! BUILD ABORTED - %d quote verification failures:" % len(errors))
        for e in errors:
            print("  - " + e)
        with open(os.path.join(HERE, "validation-errors.txt"), "w", encoding="utf-8") as fh:
            fh.write("\n\n".join(errors))
        return 1
    for w in warnings:
        print("  [warn] " + w)

    # ---- knowledge points
    kps = []
    for kp in B.KPS:
        item = {kk: vv for kk, vv in kp.items() if kk != "wrong"}
        item["sourceFile"] = kp["src"]
        item["page"] = kp["page"]
        item["originalText"] = kp["quote"]
        item["course"] = COURSE
        item["academicTerm"] = TERM          # 学期；`term` 保留为知识点概念名
        item["noteProvenance"] = "ai-note" if kp.get("note") else None
        kps.append(item)

    # ---- questions
    questions = []
    for kp in B.KPS:
        questions.extend(expand_kp(kp, B.KPS))
    for s in B.SPECIAL:
        questions.append(expand_special(s))

    q_by_kp = defaultdict(int)
    for q in questions:
        q_by_kp[q["kp"]] += 1
    for kp in kps:
        kp["questionCount"] = q_by_kp[kp["id"]]

    # ---- sources (verbatim page text, for the "view original" panel)
    sources = []
    for f in index["files"]:
        rel = f["file"]
        pdf_name = os.path.basename(rel)
        pdf_url = "sources/accounting-2026/" + urllib.parse.quote(pdf_name)
        sources.append(dict(
            id=f["id"], course=COURSE, term=TERM, unit=f["unit"], week=f["week"],
            kind=f["kind"], sourceFile=rel, sha256=f["sha256"],
            pages=f["pages"], chars=f["chars"],
            status="verified" if f["id"] in B.VERIFIED_FILES else "extracted-unverified",
            pdfUrl=pdf_url,
            pageText=f["pageText"],
        ))

    bank = dict(
        version=VERSION, course=COURSE, edition="2026 STD O2",
        title="Fine-detail Exam Bank",
        disclaimer=("Official quotations are verbatim from the 2026 UNSW College Foundation "
                    "Accounting PDFs listed in sourceFile. Questions, options, explanations and "
                    "notes are AI-authored practice material, NOT official exam questions. "
                    "Video links are unit-level study aids only; official material defines the exam scope."),
        units=B.UNITS, videoLinks=B.VIDEO_LINKS,
        knowledgePoints=kps, questions=questions,
        sourceSummary=[{k: s[k] for k in ("id", "unit", "week", "kind", "sourceFile",
                                          "sha256", "pages", "status")} for s in sources],
        stats=dict(knowledgePoints=len(kps), questions=len(questions),
                   sources=len(sources), sourcePages=sum(s["pages"] for s in sources),
                   verifiedSources=sum(1 for s in sources if s["status"] == "verified")),
    )

    os.makedirs(PUB, exist_ok=True)
    with open(os.path.join(PUB, "exam-bank-data.js"), "w", encoding="utf-8") as fh:
        fh.write("/* GENERATED by build/exam-prep/build_exam_bank.py - do not hand-edit. */\n")
        fh.write("window.EXAM_BANK = " + json.dumps(bank, ensure_ascii=False, separators=(",", ":")) + ";\n")
    with open(os.path.join(PUB, "exam-sources.js"), "w", encoding="utf-8") as fh:
        fh.write("/* GENERATED - verbatim page text extracted from real 2026 official PDFs. */\n")
        fh.write("window.EXAM_SOURCES = " + json.dumps(sources, ensure_ascii=False, separators=(",", ":")) + ";\n")

    # ---- copy official PDFs so "open original PDF" works on the local server
    os.makedirs(PDF_DEST, exist_ok=True)
    copied = 0
    for f in index["files"]:
        src = os.path.join(COURSE_DIR, f["file"].replace("/", os.sep))
        dst = os.path.join(PDF_DEST, os.path.basename(f["file"]))
        if os.path.isfile(src) and (not os.path.isfile(dst) or
                                    os.path.getsize(src) != os.path.getsize(dst)):
            shutil.copy2(src, dst)
            copied += 1
    print("copied %d official PDFs into public/sources/accounting-2026/" % copied)

    # ---- QA report
    per_unit = defaultdict(lambda: dict(kp=0, q=0))
    for kp in kps:
        per_unit[kp["unit"]]["kp"] += 1
    for q in questions:
        per_unit[q["unit"]]["q"] += 1
    types = defaultdict(int)
    for q in questions:
        types[q["type"]] += 1
    report = dict(
        version=VERSION, quoteChecks=checked, quoteFailures=0, warnings=warnings,
        knowledgePoints=len(kps), questions=len(questions),
        kpsWithoutQuestions=[k["id"] for k in kps if k["questionCount"] == 0],
        perUnit={str(k): v for k, v in sorted(per_unit.items())},
        questionTypes=dict(types),
        sources=len(sources), sourcePages=sum(s["pages"] for s in sources),
        verifiedSources=bank["stats"]["verifiedSources"],
        unverifiedSources=[s["id"] for s in sources if s["status"] != "verified"],
        examFeedbackHits=[k["id"] for k in kps if k.get("flag") and "EXAM FEEDBACK" in k["flag"]],
    )
    with open(os.path.join(HERE, "validation-report.json"), "w", encoding="utf-8") as fh:
        json.dump(report, fh, ensure_ascii=False, indent=2)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print("\nWROTE public/exam-bank-data.js (%d bytes)" %
          os.path.getsize(os.path.join(PUB, "exam-bank-data.js")))
    print("WROTE public/exam-sources.js (%d bytes)" %
          os.path.getsize(os.path.join(PUB, "exam-sources.js")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
