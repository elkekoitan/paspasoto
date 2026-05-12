/**
 * extract-user-assets.mjs — apps/web/public/assets/_raw/ klasöründeki ham görselleri
 * üretim hattına geçirir (sharp ile crop + AVIF/WebP optimize + transparan).
 *
 * Kullanım:
 *   node scripts/extract-user-assets.mjs
 *
 * Beklenen kaynak dosyalar (apps/web/public/assets/_raw/ altında):
 *   - logo-metal.jpg       : 12 marka × 1 (2 sütun × 6 satır grid)
 *   - logo-premium.jpg     : 27 marka × 1 (3 sütun × 9 satır grid)
 *   - classic-paw-front.jpg, classic-paw-full.jpg
 *   - eva-white-set.jpg
 *   - mat-color-{slug}.jpg : opsiyonel renk varyantları
 *   - heel-pad-{slug}.jpg  : topukluk varyantları
 *   - tech-{slug}.jpg      : EvaTech için (eva-closeup, diamond, honeycomb, production-*)
 *
 * Çıktılar (track edilir):
 *   - public/assets/logos/metal/{audi,tesla,...}.webp        (transparan, ~12KB)
 *   - public/assets/logos/premium/{alfa-romeo,bmw,...}.webp  (transparan, ~14KB)
 *   - public/assets/mats/base/classic-paw-{front,full}.{avif,webp}
 *   - public/assets/mats/colors/{slug}.{avif,webp}
 *   - public/assets/heel-pads/{slug}.webp (transparan)
 *   - public/assets/tech/{slug}.{avif,webp}
 *
 * Eksik kaynaklar warning olarak loglanır, devam eder (kısmi üretim destekli).
 */
import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { mkdir, readdir } from 'node:fs/promises'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const RAW = resolve(ROOT, 'apps/web/public/assets/_raw')
const OUT = resolve(ROOT, 'apps/web/public/assets')

const log = (...a) => console.log('  ' + a.join(' '))
const warn = (...a) => console.warn('  ⚠', a.join(' '))
const ok = (...a) => console.log('  ✓', a.join(' '))

async function ensure(dir) {
  await mkdir(dir, { recursive: true })
}

/** Logo şeridini grid'e göre tek tek kırp, transparan PNG/WebP üret. */
async function extractLogos({ source, brands, outDir, cols, rows, gap = 0.04 }) {
  const src = resolve(RAW, source)
  if (!existsSync(src)) {
    warn(`logo kaynağı yok, atlandı: ${source}`)
    return
  }
  await ensure(outDir)
  const meta = await sharp(src).metadata()
  if (!meta.width || !meta.height) {
    warn(`${source} boyutları okunamadı`)
    return
  }
  const cellW = Math.floor((meta.width - gap * meta.width * (cols - 1)) / cols)
  const cellH = Math.floor((meta.height - gap * meta.height * (rows - 1)) / rows)
  const gapW = Math.floor(gap * meta.width)
  const gapH = Math.floor(gap * meta.height)

  let i = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (i >= brands.length) break
      const slug = brands[i++]
      const left = c * (cellW + gapW)
      const top = r * (cellH + gapH)
      const width = Math.min(cellW, meta.width - left)
      const height = Math.min(cellH, meta.height - top)
      const outFile = resolve(outDir, `${slug}.webp`)
      await sharp(src)
        .extract({ left, top, width, height })
        .resize({ width: 400, height: 160, fit: 'inside' })
        .webp({ quality: 90, alphaQuality: 100, lossless: false })
        .toFile(outFile)
      ok(`logo ${slug} → ${basename(outFile)} (${width}×${height})`)
    }
  }
}

/** Top-down mat fotoğrafını AVIF + WebP olarak optimize et. */
async function extractMatPhoto({ source, name }) {
  const src = resolve(RAW, source)
  if (!existsSync(src)) {
    warn(`mat kaynağı yok, atlandı: ${source}`)
    return
  }
  const outDir = resolve(OUT, 'mats/base')
  await ensure(outDir)

  const meta = await sharp(src).metadata()
  log(`mat ${name}: kaynak ${meta.width}×${meta.height}`)

  await sharp(src)
    .resize({ width: 1600, withoutEnlargement: true })
    .avif({ quality: 80 })
    .toFile(resolve(outDir, `${name}.avif`))
  await sharp(src)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(resolve(outDir, `${name}.webp`))
  ok(`mat ${name}.{avif,webp}`)
}

/** Renk varyantı (mat-color-*.jpg) → colors/ */
async function extractMatColors() {
  const outDir = resolve(OUT, 'mats/colors')
  await ensure(outDir)
  let files = []
  try {
    files = await readdir(RAW)
  } catch {
    warn('_raw klasörü okunamadı')
    return
  }
  const colorFiles = files.filter((f) => /^mat-color-.+\.(jpe?g|png|webp)$/i.test(f))
  if (colorFiles.length === 0) {
    log('renk varyantı dosyası yok — atlandı')
    return
  }
  for (const f of colorFiles) {
    const slug = f.replace(/^mat-color-/i, '').replace(/\.(jpe?g|png|webp)$/i, '')
    const src = resolve(RAW, f)
    await sharp(src)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(resolve(outDir, `${slug}.webp`))
    ok(`mat-color ${slug}.webp`)
  }
}

/** Topukluk fotoğrafları (heel-pad-*.jpg/png) → heel-pads/{slug}.webp transparan */
async function extractHeelPads() {
  const outDir = resolve(OUT, 'heel-pads')
  await ensure(outDir)
  let files = []
  try {
    files = await readdir(RAW)
  } catch {
    return
  }
  const heelFiles = files.filter((f) => /^heel-pad-.+\.(jpe?g|png|webp)$/i.test(f))
  if (heelFiles.length === 0) {
    log('topukluk dosyası yok — eski procedural webp\'ler korunuyor (fallback)')
    return
  }
  for (const f of heelFiles) {
    const slug = f.replace(/^heel-pad-/i, '').replace(/\.(jpe?g|png|webp)$/i, '')
    const src = resolve(RAW, f)
    await sharp(src)
      .resize({ width: 600, withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(resolve(outDir, `${slug}.webp`))
    ok(`heel-pad ${slug}.webp`)
  }
}

/** Teknik görseller (tech-*.jpg) → tech/ */
async function extractTechImages() {
  const outDir = resolve(OUT, 'tech')
  await ensure(outDir)
  let files = []
  try {
    files = await readdir(RAW)
  } catch {
    return
  }
  const techFiles = files.filter((f) => /^tech-.+\.(jpe?g|png|webp)$/i.test(f))
  if (techFiles.length === 0) {
    log('teknik görsel yok — EvaTech placeholder kullanır')
    return
  }
  for (const f of techFiles) {
    const slug = f.replace(/^tech-/i, '').replace(/\.(jpe?g|png|webp)$/i, '')
    const src = resolve(RAW, f)
    await sharp(src)
      .resize({ width: 1400, withoutEnlargement: true })
      .avif({ quality: 78 })
      .toFile(resolve(outDir, `${slug}.avif`))
    await sharp(src)
      .resize({ width: 1400, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(resolve(outDir, `${slug}.webp`))
    ok(`tech ${slug}.{avif,webp}`)
  }
}

// ───────────────────────────────────────────────────────────────
// MARKA LİSTELERİ (kullanıcının sağladığı screenshot'lara göre)
// ───────────────────────────────────────────────────────────────

// 12 metal logo: 2 sütun × 6 satır
// Sıralama screenshot'a göre (sol→sağ, üst→alt):
//   [Audi]      [Tesla]
//   [Peugeot]   [Mazda]
//   [BYD]       [Togg]
//   [Volkswagen][Toyota]
//   [Renault]   [Dacia]
//   [Ford]      [Chery]
const METAL_BRANDS = [
  'audi', 'tesla',
  'peugeot', 'mazda',
  'byd', 'togg',
  'volkswagen', 'toyota',
  'renault', 'dacia',
  'ford', 'chery',
]

// 27 premium logo: 3 sütun × 9 satır
//   Row 1: Alfa Romeo · BMW · Mercedes-Benz
//   Row 2: Renault · Togg · Audi
//   Row 3: BYD · Fiat · Honda
//   Row 4: Nissan · Volkswagen · M
//   Row 5: Hyundai · Seat · Jaecoo
//   Row 6: Kia · Ford · Cupra
//   Row 7: MG · Lexus · Jeep
//   Row 8: Skywell · Land/Range Rover · Skoda
//   Row 9: Chery · Tesla · SsangYong
const PREMIUM_BRANDS = [
  'alfa-romeo', 'bmw', 'mercedes',
  'renault', 'togg', 'audi',
  'byd', 'fiat', 'honda',
  'nissan', 'volkswagen', 'bmw-m',
  'hyundai', 'seat', 'jaecoo',
  'kia', 'ford', 'cupra',
  'mg', 'lexus', 'jeep',
  'skywell', 'land-rover', 'skoda',
  'chery', 'tesla', 'ssangyong',
]

// ───────────────────────────────────────────────────────────────
// MAIN
// ───────────────────────────────────────────────────────────────

console.log('PaspasOto — extract-user-assets')
console.log(`Source dir: ${RAW}`)
console.log(`Output dir: ${OUT}\n`)

if (!existsSync(RAW)) {
  console.error('✗ _raw/ klasörü yok. Oluştur: mkdir -p apps/web/public/assets/_raw')
  process.exit(1)
}

console.log('▶ Metal logoları (12) çıkarılıyor...')
await extractLogos({
  source: 'logo-metal.jpg',
  brands: METAL_BRANDS,
  outDir: resolve(OUT, 'logos/metal'),
  cols: 2,
  rows: 6,
})

console.log('\n▶ Premium logoları (27) çıkarılıyor...')
await extractLogos({
  source: 'logo-premium.jpg',
  brands: PREMIUM_BRANDS,
  outDir: resolve(OUT, 'logos/premium'),
  cols: 3,
  rows: 9,
})

console.log('\n▶ Mat fotoğrafları optimize ediliyor...')
await extractMatPhoto({ source: 'classic-paw-front.jpg', name: 'classic-paw-front' })
await extractMatPhoto({ source: 'classic-paw-full.jpg', name: 'classic-paw-full' })
await extractMatPhoto({ source: 'eva-white-set.jpg', name: 'eva-white-set' })

console.log('\n▶ Renk varyantları (opsiyonel)...')
await extractMatColors()

console.log('\n▶ Topukluk fotoğrafları (opsiyonel)...')
await extractHeelPads()

console.log('\n▶ EVA teknik görseller (opsiyonel)...')
await extractTechImages()

console.log('\n✓ Üretim tamamlandı.')
