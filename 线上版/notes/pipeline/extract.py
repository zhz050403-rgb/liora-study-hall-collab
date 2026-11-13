"""Read local PDF pages without modifying the source files."""
import base64
import json
import re
import sys

import pymupdf

pages = []
for source in json.load(sys.stdin):
    with pymupdf.open(source["path"]) as document:
        for page in document:
            if len(pages) >= 120:
                raise ValueError("PDF page limit exceeded")
            text = page.get_text(sort=True).strip()
            record = {"file": source["name"], "page": page.number + 1, "text": text}
            if not text or page.get_image_info() or page.get_drawings() or re.search(r"[∑∫√≤≥≈±αβπ²³=]", text):
                scale = min(1.5, 1200 / max(page.rect.width, page.rect.height))
                pixmap = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
                record["image"] = base64.b64encode(pixmap.tobytes("jpeg", jpg_quality=80)).decode("ascii")
            pages.append(record)
json.dump(pages, sys.stdout, ensure_ascii=True)
