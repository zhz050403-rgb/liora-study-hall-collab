# -*- coding: utf-8 -*-
"""
Evidence layer for the fine-detail exam bank.

Reads the REAL 2026 UNSW Foundation Accounting official PDFs (week1-week5,
i.e. Unit 1 - Unit 6) page by page and writes a machine-checkable index:
  extracted/source-index.json   full per-page text + sha256 + page counts
  extracted/<id>.txt            human-readable text with === PAGE n === markers
  extracted/digest.txt          candidate fine-detail lines (definitions etc.)

Nothing here invents content. Every line is copied verbatim from a real PDF.
Run:  py -3 网站/build/exam-prep/extract_sources.py
"""
import glob
import hashlib
import json
import os
import re
import sys

import pymupdf

BASE = os.path.dirname(os.path.abspath(__file__))
COURSE_ROOT = os.path.abspath(
    os.path.join(BASE, "..", "..", "..",
                 "Course_ FNDN Accounting 2026 STD O2 _ UNSW_week type unit")
)
OUT = os.path.join(BASE, "extracted")
os.makedirs(OUT, exist_ok=True)

# (unit, kind) classification by filename, from the official folder naming.
KINDS = [
    ("lecture", re.compile(r"lecture slides", re.I)),
    ("reading", re.compile(r"reading materials", re.I)),
    ("tutorial", re.compile(r"tutorial guide", re.I)),
    ("class-exercise", re.compile(r"class exercise", re.I)),
    ("practice", re.compile(r"practice|worksheet", re.I)),
]

DEF_HINT = re.compile(
    r"\b(is|are|means|defined as|refers to|known as|called|consists of|"
    r"represents|classified as|include[sd]?|must|should|only|except|"
    r"non-current|current asset|secondary entry|understandability|clarity)\b",
    re.I,
)


def classify(name):
    unit_m = re.search(r"unit\s*(\d+)", name, re.I)
    unit = int(unit_m.group(1)) if unit_m else None
    kind = "other"
    for label, rx in KINDS:
        if rx.search(name):
            kind = label
            break
    # week2 "unit1 class exercise elements.pdf" belongs to Unit 1/2 exercises
    return unit, kind


def main():
    files = sorted(glob.glob(os.path.join(COURSE_ROOT, "week[1-5]", "*.pdf")))
    if not files:
        print("NO PDFs FOUND at", COURSE_ROOT, file=sys.stderr)
        return 1
    week_m = re.compile(r"week(\d+)", re.I)
    index = {
        "schema": 1,
        "course": "accounting",
        "courseLabel": "UNSW Foundation Studies - Accounting",
        "edition": "2026 STD O2",
        "root": os.path.basename(COURSE_ROOT),
        "note": "Text extracted verbatim from official 2026 PDFs; page numbers are 1-based PDF pages.",
        "files": [],
    }
    digest = []
    for path in files:
        rel = os.path.relpath(path, COURSE_ROOT).replace("\\", "/")
        name = os.path.basename(path)
        wm = week_m.search(rel)
        week = int(wm.group(1)) if wm else None
        unit, kind = classify(name)
        with open(path, "rb") as fh:
            sha = hashlib.sha256(fh.read()).hexdigest()
        doc = pymupdf.open(path)
        page_text = []
        for i, page in enumerate(doc, 1):
            t = page.get_text("text")
            t = re.sub(r"[ \t]+\n", "\n", t)
            page_text.append(t.strip())
        doc.close()
        fid = "u%s-%s" % (unit if unit else "x", kind)
        if any(f["id"] == fid for f in index["files"]):
            fid = fid + "-" + str(week)
        index["files"].append({
            "id": fid,
            "unit": unit,
            "week": week,
            "kind": kind,
            "file": rel,
            "sha256": sha,
            "bytes": os.path.getsize(path),
            "pages": len(page_text),
            "chars": sum(len(t) for t in page_text),
            "status": "extracted",  # extracted -> verified (after human/AI check)
            "pageText": page_text,
        })
        with open(os.path.join(OUT, fid + ".txt"), "w", encoding="utf-8") as fh:
            fh.write("# %s\n# sha256=%s\n" % (rel, sha))
            for i, t in enumerate(page_text, 1):
                fh.write("\n=== PAGE %d ===\n" % i)
                fh.write(t + "\n")
        for pno, t in enumerate(page_text, 1):
            for line in t.splitlines():
                line = line.strip()
                if 12 <= len(line) <= 220 and DEF_HINT.search(line):
                    digest.append("[%s p.%d] %s" % (fid, pno, line))
        print("%-26s %3dp %7dc  %s" % (fid, len(page_text),
                                       sum(len(t) for t in page_text), rel))
    with open(os.path.join(OUT, "source-index.json"), "w", encoding="utf-8") as fh:
        json.dump(index, fh, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, "digest.txt"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(digest))
    print("\nfiles=%d pages=%d digest-lines=%d" % (
        len(index["files"]), sum(f["pages"] for f in index["files"]), len(digest)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
