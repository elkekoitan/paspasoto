"""Visual-verified Pexels/Unsplash URL'leri catalog-extra.ts'ye uygula."""
import re
from pathlib import Path

FILE = Path(r'C:\Users\qw\Desktop\paspasoto\apps\web\src\lib\catalog-extra.ts')

URLS = {
    'tempered-9h-9-inch':       'https://images.pexels.com/photos/8305346/pexels-photo-8305346.jpeg?auto=compress&cs=tinysrgb&w=800',
    'tempered-9h-10-inch':      'https://images.pexels.com/photos/9703059/pexels-photo-9703059.jpeg?auto=compress&cs=tinysrgb&w=800',
    'matte-anti-glare-9-inch':  'https://images.pexels.com/photos/15828798/pexels-photo-15828798.jpeg?auto=compress&cs=tinysrgb&w=800',
    'privacy-9-inch':           'https://images.pexels.com/photos/6817002/pexels-photo-6817002.jpeg?auto=compress&cs=tinysrgb&w=800',
    'gauge-cluster-protector':  'https://images.pexels.com/photos/31775324/pexels-photo-31775324.jpeg?auto=compress&cs=tinysrgb&w=800',
    'tempered-9h-12-inch':      'https://images.pexels.com/photos/18977351/pexels-photo-18977351.jpeg?auto=compress&cs=tinysrgb&w=800',
    'midnight-oud':             'https://images.pexels.com/photos/11711835/pexels-photo-11711835.jpeg?auto=compress&cs=tinysrgb&w=800',
    'fresh-citrus':             'https://images.pexels.com/photos/33161096/pexels-photo-33161096.jpeg?auto=compress&cs=tinysrgb&w=800',
    'leather-tobacco':          'https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg?auto=compress&cs=tinysrgb&w=800',
    'vanilla-cream':            'https://images.pexels.com/photos/3831748/pexels-photo-3831748.jpeg?auto=compress&cs=tinysrgb&w=800',
    'ocean-breeze':             'https://images.pexels.com/photos/3640668/pexels-photo-3640668.jpeg?auto=compress&cs=tinysrgb&w=800',
    'spray-set-trio':           'https://images.pexels.com/photos/4730928/pexels-photo-4730928.jpeg?auto=compress&cs=tinysrgb&w=800',
    'interior-cleaner-500ml':   'https://images.pexels.com/photos/8526797/pexels-photo-8526797.jpeg?auto=compress&cs=tinysrgb&w=800',
    'tar-remover-300ml':        'https://images.pexels.com/photos/7154633/pexels-photo-7154633.jpeg?auto=compress&cs=tinysrgb&w=800',
    'glass-cleaner-750ml':      'https://images.pexels.com/photos/5591457/pexels-photo-5591457.jpeg?auto=compress&cs=tinysrgb&w=800',
    'leather-conditioner-250ml':'https://images.pexels.com/photos/29961629/pexels-photo-29961629.jpeg?auto=compress&cs=tinysrgb&w=800',
    'engine-degreaser-1l':      'https://images.pexels.com/photos/4140943/pexels-photo-4140943.jpeg?auto=compress&cs=tinysrgb&w=800',
    'detailing-kit-starter':    'https://images.pexels.com/photos/20042048/pexels-photo-20042048.jpeg?auto=compress&cs=tinysrgb&w=800',
    'bagaj-organizer-deluxe':   'https://images.pexels.com/photos/17000836/pexels-photo-17000836.jpeg?auto=compress&cs=tinysrgb&w=800',
    'koltuk-arkasi-organizer':  'https://images.unsplash.com/photo-1602161755661-3781cddac355?auto=format&w=800&q=85',
    'yan-cep-konsol-organizer': 'https://images.unsplash.com/photo-1722843646530-0ec625b8e34f?auto=format&w=800&q=85',
    'cop-torbasi-magnetic':     'https://images.pexels.com/photos/12997254/pexels-photo-12997254.jpeg?auto=compress&cs=tinysrgb&w=800',
    'bagaj-net-fileli':         'https://images.unsplash.com/photo-1768671496923-e43c94b5f60f?auto=format&w=800&q=85',
    'piknik-bagaj-cantasi':     'https://images.pexels.com/photos/27528407/pexels-photo-27528407.jpeg?auto=compress&cs=tinysrgb&w=800',
}

src = FILE.read_text(encoding='utf-8')

ok = 0
for slug, url in URLS.items():
    slug_re = re.escape(slug)
    # image: 'OLD_URL' replace
    pat = re.compile(
        rf"(slug: '{slug_re}',[\s\S]*?image: ')[^']*(',)",
        re.MULTILINE
    )
    new_src, n = pat.subn(lambda m: m.group(1) + url + m.group(2), src, count=1)
    if n > 0:
        src = new_src
        ok += 1
    else:
        print(f"WARN: {slug} bulunamadı")

FILE.write_text(src, encoding='utf-8')
print(f"OK: {ok}/24 ürün foto URL güncellendi")
