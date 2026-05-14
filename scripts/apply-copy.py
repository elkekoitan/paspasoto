import json, re
from pathlib import Path

DATA = json.loads(Path('/tmp/copy-data.json').read_text(encoding='utf-8'))
FILE = Path(r'C:\Users\qw\Desktop\paspasoto\apps\web\src\lib\catalog-extra.ts')
src = FILE.read_text(encoding='utf-8')

ok = 0
fail = []
for slug, content in DATA.items():
    short = content['shortDescription']
    desc = content['description']

    short_esc = short.replace('\\', '\\\\').replace("'", "\\'")
    desc_esc = desc.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

    slug_re = re.escape(slug)

    short_pat = re.compile(
        rf"(slug: '{slug_re}',[\s\S]*?shortDescription: ')[^']*(',)",
        re.MULTILINE
    )
    new_src, n1 = short_pat.subn(rf"\g<1>{short_esc}\g<2>", src, count=1)
    if n1 == 0:
        fail.append(f"{slug} (short)")
        continue
    src = new_src

    desc_pat = re.compile(
        rf"(slug: '{slug_re}',[\s\S]*?description: `)[\s\S]*?(`,\s*\n\s+stock:)",
        re.MULTILINE
    )
    new_src, n2 = desc_pat.subn(lambda m: m.group(1) + desc_esc + m.group(2), src, count=1)
    if n2 == 0:
        fail.append(f"{slug} (desc)")
        continue
    src = new_src
    ok += 1

FILE.write_text(src, encoding='utf-8')
print(f"OK: {ok}/24, FAIL: {len(fail)}")
for f in fail:
    print(f"  - {f}")
