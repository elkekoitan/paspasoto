/**
 * Marka logosu indirici.
 *
 * Kaynak öncelik sırası:
 * 1. simple-icons (npm dep) — MIT lisans, monochrome SVG → CSS ile renklendirilebilir
 * 2. Wikimedia Commons (manuel curated URL list, public domain veya CC-BY-SA)
 *
 * Çıktı: apps/web/public/assets/brands/<slug>.svg
 *
 * vipotopaspas.com gibi sitelerden indirme YAPMAZ — hem etik hem hukuki sorun.
 * simple-icons + Wikimedia Commons her ikisi de açık lisanslı ve markanın "nominative
 * fair use" hakkı kapsamında otomotiv aksesuarı satışı için kullanılabilir.
 *
 * Çalıştır:
 *   pnpm exec node scripts/download-brand-logos.mjs
 *
 * Tek bir markayı yenile:
 *   pnpm exec node scripts/download-brand-logos.mjs --only=bmw,audi
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'apps/web/public/assets/brands')

// simple-icons apps/web workspace altında — oradaki kurulu paketi yükle
const simpleIconsEntry = path.join(ROOT, 'apps/web/node_modules/simple-icons/index.mjs')
const simpleIcons = await import(pathToFileURL(simpleIconsEntry).href)

/**
 * Marka slug → kaynak haritası.
 * - simpleIconsKey: simple-icons paketindeki anahtar (örn. 'bmw' → siBmw)
 * - wikimediaUrl: SVG public domain veya CC URL (Wikimedia Commons üzerinden)
 *
 * NOT: Wikimedia Commons SVG'leri direct linkle değil "thumbnail" endpoint ile
 * çekilir, doğrudan upload.wikimedia.org/wikipedia/commons/.../File.svg pattern'i.
 */
/** Tipografik fallback için marka adı + brand color (Carmat'ın kendi tasarımı). */
const BRAND_META = {
  audi: { name: 'Audi', color: '#BB0A30' },
  bmw: { name: 'BMW', color: '#0066B1' },
  mercedes: { name: 'Mercedes-Benz', color: '#23292d' },
  volkswagen: { name: 'Volkswagen', color: '#151F5D' },
  skoda: { name: 'Škoda', color: '#4BA82E' },
  hyundai: { name: 'Hyundai', color: '#002C5F' },
  ford: { name: 'Ford', color: '#003478' },
  peugeot: { name: 'Peugeot', color: '#1f3a5f' },
  renault: { name: 'Renault', color: '#FFCC00' },
  fiat: { name: 'Fiat', color: '#A6192E' },
  toyota: { name: 'Toyota', color: '#EB0A1E' },
  honda: { name: 'Honda', color: '#E40521' },
  opel: { name: 'Opel', color: '#1a1a1a' },
  volvo: { name: 'Volvo', color: '#003057' },
  citroen: { name: 'Citroën', color: '#7A1F1F' },
  seat: { name: 'Seat', color: '#C49A57' },
  dacia: { name: 'Dacia', color: '#646B52' },
  kia: { name: 'Kia', color: '#05141F' },
  nissan: { name: 'Nissan', color: '#C3002F' },
  mazda: { name: 'Mazda', color: '#101010' },
  mini: { name: 'MINI', color: '#000000' },
  porsche: { name: 'Porsche', color: '#D5001C' },
  lexus: { name: 'Lexus', color: '#1A1A1A' },
  tesla: { name: 'Tesla', color: '#CC0000' },
  subaru: { name: 'Subaru', color: '#0041AA' },
  mitsubishi: { name: 'Mitsubishi', color: '#E60012' },
  suzuki: { name: 'Suzuki', color: '#CD1424' },
  jeep: { name: 'Jeep', color: '#374B49' },
  landrover: { name: 'Land Rover', color: '#005A2B' },
  jaguar: { name: 'Jaguar', color: '#222B33' },
  chevrolet: { name: 'Chevrolet', color: '#1c1c28' },
  mg: { name: 'MG', color: '#E10A2D' },
  cupra: { name: 'Cupra', color: '#C8612A' },
  byd: { name: 'BYD', color: '#003366' },
  togg: { name: 'TOGG', color: '#0061A8' },
  iveco: { name: 'Iveco', color: '#003D80' },
  isuzu: { name: 'Isuzu', color: '#C8102E' },
  mahindra: { name: 'Mahindra', color: '#C8102E' },
  chery: { name: 'Chery', color: '#C8102E' },
  hongqi: { name: 'Hongqi', color: '#9B1B1F' },
}

const BRAND_SOURCES = {
  audi:        { simpleIconsKey: 'audi' },
  bmw:         { simpleIconsKey: 'bmw' },
  mercedes:    { simpleIconsKey: 'mercedes' },
  volkswagen:  { simpleIconsKey: 'volkswagen' },
  skoda:       { simpleIconsKey: 'skoda' },
  hyundai:     { simpleIconsKey: 'hyundai' },
  ford:        { simpleIconsKey: 'ford' },
  peugeot:     { simpleIconsKey: 'peugeot' },
  renault:     { simpleIconsKey: 'renault' },
  fiat:        { simpleIconsKey: 'fiat' },
  toyota:      { simpleIconsKey: 'toyota' },
  honda:       { simpleIconsKey: 'honda' },
  opel:        { simpleIconsKey: 'opel' },
  volvo:       { simpleIconsKey: 'volvo' },
  citroen:     { simpleIconsKey: 'citroen' },
  seat:        { simpleIconsKey: 'seat' },
  dacia:       { simpleIconsKey: 'dacia' },
  kia:         { simpleIconsKey: 'kia' },
  nissan:      { simpleIconsKey: 'nissan' },
  mazda:       { simpleIconsKey: 'mazda' },
  mini:        { simpleIconsKey: 'mini' },
  porsche:     { simpleIconsKey: 'porsche' },
  lexus:       { simpleIconsKey: 'lexus' },
  tesla:       { simpleIconsKey: 'tesla' },
  subaru:      { simpleIconsKey: 'subaru' },
  mitsubishi:  { simpleIconsKey: 'mitsubishi' },
  suzuki:      { simpleIconsKey: 'suzuki' },
  jeep:        { simpleIconsKey: 'jeep' },
  landrover:   { simpleIconsKey: 'landrover' },
  jaguar:      { simpleIconsKey: 'jaguar' },
  chevrolet:   { simpleIconsKey: 'chevrolet' },
  mg:          { simpleIconsKey: 'mg' },
  cupra:       { simpleIconsKey: 'cupra' },
  byd:         { simpleIconsKey: 'byd' },
  iveco:       { simpleIconsKey: 'iveco' },
  isuzu:       { simpleIconsKey: 'isuzu' },
  mahindra:    { simpleIconsKey: 'mahindra' },
  chery:       { simpleIconsKey: 'chery' },

  // simple-icons'da olmayan markalar — Wikimedia Commons fallback (manuel curated)
  togg:        { wikimediaPath: 'commons/thumb/3/3a/Togg_Logo.svg/512px-Togg_Logo.svg.png' },
  hongqi:      { wikimediaPath: 'commons/thumb/d/d2/Hongqi_logo.svg/512px-Hongqi_logo.svg.png' },
}

/**
 * simple-icons'dan SVG'yi al — pakette kebab-case anahtarla siXxx ismi olur.
 */
function getSimpleIconSvg(key) {
  // simple-icons v16 default export şekli: kebab → camel siXxx
  const camelKey = 'si' + key.charAt(0).toUpperCase() + key.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const icon = simpleIcons[camelKey]
  if (!icon || !icon.svg) return null
  // simple-icons monokrom SVG döner — fill="currentColor" yap, viewBox + 24 standart
  // Boyutu artır: width/height yok → CSS ile ölçeklenir, 24x24 viewBox kalır
  const themedSvg = icon.svg.replace(
    '<svg ',
    '<svg fill="currentColor" preserveAspectRatio="xMidYMid meet" ',
  )
  return { svg: themedSvg, source: `simple-icons (${icon.title})` }
}

async function downloadFromUrl(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Carmat-Logo-Fetcher/1.0 (carmat.com.tr)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.arrayBuffer()
}

/**
 * Tipografik fallback — Carmat'ın kendi tasarımı, telif riski yok.
 * Marka brand color'ında dolgulu daire içinde marka inisyali (1-3 char).
 */
function generateTypographicFallback(slug, displayName, brandColor) {
  // İlk 1-2 harf büyük: BMW → "BMW", Mercedes → "MB", Land Rover → "LR"
  const words = displayName.replace(/[^A-Za-zĞÜŞİÖÇğüşıöç ]/g, '').split(/\s+/).filter(Boolean)
  let initials
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase()
  } else if (displayName.length <= 4) {
    initials = displayName.toUpperCase()
  } else {
    initials = displayName.slice(0, 2).toUpperCase()
  }

  const fontSize = initials.length >= 3 ? 7 : initials.length === 2 ? 9 : 11
  const bg = brandColor || '#2a2a33'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${displayName}">
  <circle cx="12" cy="12" r="11.5" fill="${bg}" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
  <text x="12" y="12" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="${fontSize}" letter-spacing="0">${initials}</text>
</svg>`
}

async function processBrand(slug) {
  const src = BRAND_SOURCES[slug]

  // 1) simple-icons önce dene
  if (src?.simpleIconsKey) {
    const result = getSimpleIconSvg(src.simpleIconsKey)
    if (result) {
      const outPath = path.join(OUT_DIR, `${slug}.svg`)
      await fs.writeFile(outPath, result.svg, 'utf8')
      console.log(`  ✓ ${slug}.svg ← ${result.source}`)
      return { slug, status: 'ok', source: result.source }
    }
  }

  // 2) Wikimedia Commons fallback
  if (src?.wikimediaPath) {
    try {
      const url = `https://upload.wikimedia.org/wikipedia/${src.wikimediaPath}`
      const buf = await downloadFromUrl(url)
      const ext = src.wikimediaPath.endsWith('.svg') ? 'svg' : 'png'
      const outPath = path.join(OUT_DIR, `${slug}.${ext}`)
      await fs.writeFile(outPath, Buffer.from(buf))
      console.log(`  ✓ ${slug}.${ext} ← Wikimedia Commons`)
      return { slug, status: 'ok', source: 'Wikimedia Commons' }
    } catch (e) {
      console.log(`  ! ${slug}: wikimedia ${e.message} — typographic fallback'a geç`)
    }
  }

  // 3) Tipografik fallback (telif riski yok — Carmat'ın kendi tasarımı)
  const meta = BRAND_META[slug]
  if (meta) {
    const svg = generateTypographicFallback(slug, meta.name, meta.color)
    const outPath = path.join(OUT_DIR, `${slug}.svg`)
    await fs.writeFile(outPath, svg, 'utf8')
    console.log(`  ✓ ${slug}.svg ← typographic fallback (${meta.name})`)
    return { slug, status: 'ok', source: 'typographic-fallback' }
  }

  console.log(`  ? ${slug}: BRAND_META'da tanımlı değil`)
  return { slug, status: 'missing' }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  const args = process.argv.slice(2)
  const onlyArg = args.find((a) => a.startsWith('--only='))
  const targetSlugs = onlyArg
    ? onlyArg.replace('--only=', '').split(',').map((s) => s.trim()).filter(Boolean)
    : Object.keys(BRAND_SOURCES)

  console.log(`Logo indirme başladı (${targetSlugs.length} marka):`)
  console.log(`Çıktı: ${OUT_DIR}`)
  console.log()

  const results = []
  for (const slug of targetSlugs) {
    results.push(await processBrand(slug))
  }

  console.log()
  const ok = results.filter((r) => r.status === 'ok').length
  const failed = results.filter((r) => r.status !== 'ok').length
  console.log(`Tamamlandı: ${ok} başarılı, ${failed} eksik/hata`)

  // Lisans bilgisi metni
  await fs.writeFile(
    path.join(OUT_DIR, 'LICENSES.md'),
    `# Marka Logo Lisansları

Bu klasördeki marka logoları aşağıdaki kaynaklardan alınmıştır:

## simple-icons (MIT License)
SVG ikonlar https://simpleicons.org adresinden, MIT lisansıyla.
Tek tek marka logoları ilgili markanın **tescilli ticari markasıdır** —
Carmat bunları "nominative fair use" doktrini altında, müşterinin aracını
seçebilmesi için tanımlayıcı amaçla kullanır. Her bir marka logosu kendi
sahibinin tescilli markasıdır ve Carmat ile o markalar arasında
herhangi bir bağlılık veya onay ilişkisi yoktur.

## Wikimedia Commons
simple-icons'da bulunmayan markalar için Wikimedia Commons üzerinden
public domain veya Creative Commons lisanslı dosyalar kullanılmıştır.
Her dosyanın kendi lisansı için Wikimedia Commons sayfasına bakınız.

## Yenileme
\`pnpm exec node scripts/download-brand-logos.mjs\` çalıştırarak yenileyin.
Tek marka için: \`pnpm exec node scripts/download-brand-logos.mjs --only=bmw\`

Son güncelleme: ${new Date().toISOString().slice(0, 10)}
`,
    'utf8',
  )
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
