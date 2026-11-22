"""Read-only Phase 1 audit. Output files are confined to this evidence directory."""
import copy
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path

from lxml import etree, html

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[4]
PUB = SITE / "线上版/public"
FIELDS = ("graphicHtml", "notesHtml", "tutorialAnswers", "examplesHtml", "howToImprove")


def digest(value):
    return hashlib.sha256(value).hexdigest()


def payload(raw):
    return json.loads(raw.decode("utf-8-sig").strip().split(" = ", 1)[1].rstrip(";"))


def week(data):
    course = next(c for c in data["courses"] if c["id"] == "accounting")
    term = next(t for t in course["terms"] if t["id"] == "term1")
    return next(w for w in term["weeks"] if w["num"] == 1)


def apply_patch(data, expected, changes):
    target = week(data)
    if digest(target["graphicHtml"].encode()) != expected:
        raise ValueError("accounting/term1/1/graphicHtml: stale content")
    if set(changes) != {"graphicHtml"} or not isinstance(changes["graphicHtml"], str):
        raise ValueError("accounting/term1/1: only graphicHtml is editable")
    result = copy.deepcopy(data)
    week(result).update(changes)
    return result


def test_patch(data):
    before = copy.deepcopy(data)
    expected = digest(week(data)["graphicHtml"].encode())
    result = apply_patch(data, expected, {"graphicHtml": "<p>isolated fixture</p>"})
    assert result != before
    week(result)["graphicHtml"] = week(before)["graphicHtml"]
    assert data == before == result
    for old, changes in [("stale", {"graphicHtml": ""}), (expected, {"tasks": []})]:
        try:
            apply_patch(data, old, changes)
        except ValueError:
            continue
        raise AssertionError("Unsafe patch was accepted")


def main():
    sys.path.insert(0, str(SITE / "build"))
    from check_brief_live import fetch
    status, raw = fetch("/data.js")
    override_status, override_raw = fetch("/board-overrides.js")
    assert status == override_status == 200
    data = payload(raw)
    test_patch(data)
    base = week(data)
    overrides = payload(override_raw).get("notes-accounting", {}).get("term1/1", {})
    effective = {**base, **{key: overrides[key] for key in FIELDS if key in overrides}}
    graphic = effective["graphicHtml"]
    docx = next(SITE.parent.glob("Course_*Accounting*/week1/UNSW_Accounting_Unit1-2Notes.docx"))
    official = sorted(docx.parent.glob("unit[12]*.pdf"))
    with zipfile.ZipFile(docx) as z:
        root = etree.fromstring(z.read("word/document.xml"))
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs = ["".join(x.xpath(".//w:t/text()", namespaces=ns)) for x in root.xpath("//w:p", namespaces=ns)]
    doc_text = "\n".join(paragraphs)
    tree = html.fragment_fromstring(graphic, create_parent="article")
    rows = []
    for n, heading in enumerate(tree.xpath(".//h2|.//h3|.//h4"), 1):
        title = " ".join(heading.text_content().split())
        siblings = []
        for x in heading.itersiblings():
            if x.tag in ("h2", "h3", "h4"):
                break
            siblings.append(x)
        concepts = [x for x in siblings if "callout" in x.get("class", "") and x.text_content().lstrip().startswith("概念")]
        translations = [t.text_content().strip() for x in concepts for t in x.xpath(".//*[contains(concat(' ',normalize-space(@class),' '),' bi-add ')]")]
        sources = [x.text_content().strip() for x in siblings if "kp-src" in x.get("class", "")]
        lead = re.match(r"[A-Za-z]", title)
        en_first = bool(lead and re.search(r"[\u3400-\u9fff]", title))
        rows.append(dict(id=f"H{n:02}",title=title,title_structure="candidate" if en_first else "flag",
            concepts=[x.text_content().strip() for x in concepts],english_translation_blocks=translations,
            sources=sources,formula_visual_tags=sum(len(x.xpath(".//img|.//svg|.//table"))+(x.tag in ("img","svg","table")) for x in siblings),
            solution_blocks=sum(len(x.xpath(".//details"))+(x.tag=="details") for x in siblings),
            semantic_status="pending source and applicability review"))
    result = dict(live_data_sha256=digest(raw), local_data_sha256=digest((PUB/"data.js").read_bytes()),
        live_overrides_sha256=digest(override_raw), overridden_fields=list(overrides),
        field_sha256={f:digest(effective.get(f,"").encode()) for f in FIELDS},
        docx_sha256=digest(docx.read_bytes()), source_pdf_sha256={p.name:digest(p.read_bytes()) for p in official},
        docx_opening=[x for x in paragraphs if x.strip()][:8], data_text_matches_docx=(tree.text_content().strip()==doc_text.strip()),
        isolated_patch_test="PASS", headings=rows)
    (HERE/"evidence.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    preview = "<!doctype html><meta charset=utf-8><title>Accounting W1 audit preview</title>"
    preview += "<style>body{max-width:80ch;margin:2rem auto;padding:1rem;font:17px/1.65 system-ui}img,svg{max-width:100%}td,th{border:1px solid #ccc;padding:.3rem}</style>"
    preview += "<h1>Accounting Term 1 Week 1</h1><p>正式站双语笔记正文快照。此预览单独渲染内容字段，未运行正式站交互。</p>"
    # Disable active content and localize relative asset URLs for this read-only preview.
    for node in tree.xpath(".//script|.//iframe|.//object|.//embed"):
        node.drop_tree()
    for node in tree.iter():
        for key in list(node.attrib):
            if key.lower().startswith("on"):
                del node.attrib[key]
        if node.tag == "img":
            src = node.get("src","")
            if src and not re.match(r"^[a-z]+:",src,re.I):
                node.set("src",(PUB / src.lstrip("/")).resolve().as_uri())
    (HERE/"preview.html").write_text(preview+html.tostring(tree,encoding="unicode"),encoding="utf-8")
    print("patch PASS; headings",len(rows),"title flags",[x["id"] for x in rows if x["title_structure"]=="flag"])
    for x in rows:
        print(x["id"],x["title"][:100],len(x["concepts"]),len(x["english_translation_blocks"]),x["formula_visual_tags"],x["solution_blocks"])
    print("docx opening:",result["docx_opening"][:4])

if __name__ == "__main__":
    main()
