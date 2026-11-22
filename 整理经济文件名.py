from pathlib import Path
import json, hashlib, shutil, re

base = Path(r'C:\Users\Liora\Desktop\新南2026')
root = base / 'Course_ FNDN Economics 2026 STD O2 _ UNSW_term week type unit'
report = base / '文件整理记录' / 'economics-20261027'
report.mkdir(parents=True, exist_ok=False)
manifest = root / 'moodle-sync-101935.json'
data = json.loads(manifest.read_text(encoding='utf-8-sig'))
shutil.copy2(manifest, report / manifest.name)
special = {
'term1/week1/unit0 tutorial slides.pdf':'term1/week1/unit0 tutorial slides writing and presenting in economics.pdf',
'term1/week1/unit1 lecture 1 - introduction to economics.pdf':'term1/week1/unit1 lecture slides introduction to economics.pdf',
'term1/week1/UNSW_Economics_Unit0-1_Revised_Complete_With_Market_Systems.docx':'term1/week1/unit0-1 notes revised complete with market systems.docx',
'term1/week2/2. Tutorial Slides Unit 2 Production and technology.pdf':'term1/week3/unit2 tutorial slides production and technology.pdf',
'term1/week2/Economics_Unit2_Notes.docx':'term1/week2/unit2 notes.docx',
'term1/week2/Unit 2 TG Production and technology.docx':'term1/week3/unit2 tutorial guide production and technology.docx',
'term1/week2/Unit 2 TG Production and technology.pdf':'term1/week3/unit2 tutorial guide production and technology.pdf',
'term1/week2/unit1 tutorial guide tg microeconomics - introduction to economics (1).pdf':'term1/week2/unit1 tutorial guide introduction to economics.pdf',
'term1/week2/unit1 tutorial slides.pdf':'term1/week2/unit1 tutorial slides introduction to economics.pdf',
'term1/week2/unit2 lecture 2 production and technology.pdf':'term1/week2/unit2 lecture slides production and technology.pdf',
'term1/week3/unit2 tutorial guide tg production and technology.pdf':'term1/week3/unit2 tutorial guide production and technology - alternate copy.pdf',
'term1/week3/unit2 tutorial slides.pdf':'term1/week3/unit2 tutorial slides production and technology - alternate copy.pdf',
'term1/week3/unit3 lecture 3 demand & supply.pdf':'term1/week3/unit3 lecture slides demand and supply.pdf',
'term1/week4/Lecture Unit 4 Market successes and failures.pdf':'term1/week4/unit4 lecture slides market successes and failures.pdf',
'term1/week4/Markets in Action - Prices exercise writable PDF.pdf':'term1/week4-5/unit4 exercise markets in action prices writable.pdf',
'term1/week4/Markets in Action student reflection Moodle.pdf':'term1/week4-5/unit4 reflection markets in action.pdf',
'term1/week4/Unit 4 TG Market successes and failures.pdf':'term1/week5/unit4 tutorial guide market successes and failures.pdf',
'term1/week4/unit3 tutorial guide tg demand supply.pdf':'term1/week4/unit3 tutorial guide demand and supply.pdf',
'term1/week4/unit3 tutorial slides 3. demand and supply.pdf.pdf':'term1/week4/unit3 tutorial slides demand and supply.pdf',
'term2/week8/unit7 lectures slides - the financial sector.pdf':'term2/week8/unit7 lecture slides the financial sector.pdf',
}
def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024), b''): h.update(b)
    return h.hexdigest()
files = [p for p in root.rglob('*') if p.is_file() and p != manifest]
records=[]
for p in files:
    old=p.relative_to(root).as_posix()
    new=special.get(old, str(Path(old).with_name(p.name.lower())).replace('\\','/'))
    records.append(dict(old=old,new=new,bytes=p.stat().st_size,sha256=digest(p)))
targets=[r['new'].lower() for r in records]
assert len(targets)==len(set(targets)), 'Target name collision'
for r in records:
    src,dst=root/r['old'],root/r['new']
    if r['old']==r['new']: continue
    assert not dst.exists() or src.resolve()==dst.resolve(), str(dst)
(report/'rename record.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
for r in records:
    src,dst=root/r['old'],root/r['new']
    if r['old']==r['new']: continue
    dst.parent.mkdir(parents=True,exist_ok=True)
    src.rename(dst)
mapping={r['old']:r['new'] for r in records}
for item in data.get('completed',[]):
    old=item.get('filename','')
    if old in mapping:
        item['filename']=mapping[old]
        parent=Path(mapping[old]).parent.as_posix()
        item['folder']='' if parent=='.' else parent
manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
for r in records:
    p=root/r['new']
    assert p.stat().st_size==r['bytes'] and digest(p)==r['sha256'], str(p)
assert len(list(root.rglob('*')))>0
assert sum(p.is_file() for p in root.rglob('*'))==len(files)+1
result={'files_verified':len(records),'renamed_or_moved':sum(r['old']!=r['new'] for r in records),'manifest_entries':len(data.get('completed',[])),'content_verification':'all SHA-256 hashes unchanged'}
(report/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
for r in records:
    if r['old']!=r['new']: print(r['old']+' -> '+r['new'])
