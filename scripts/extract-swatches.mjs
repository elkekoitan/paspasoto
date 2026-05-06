/**
 * Mevcut WhatsApp görsellerinden gerçek doku swatch'larını üretir.
 *
 * Girdiler:
 *  - apps/web/public/assets/raw-color-palette.jpeg (843x809) → 10 paspas + 15 kenarlık swatch
 *  - apps/web/public/assets/raw-mats-stack.jpeg (900x1600) → 7 paspas/topukluk crop
 *  - apps/web/public/assets/raw-emblems.jpeg (1152x2048) → amblem yığını crop'ları
 *
 * Çıktılar (apps/web/public/assets/swatches/*):
 *  - mat-{slug}.webp & .avif (200x160 ~)
 *  - border-{slug}.webp & .avif (160x160)
 *  - heel-{slug}.webp & .avif (240x180)
 *  - mat-stack-banner.webp (anasayfa için yatay crop)
 *
 * Çalıştır: `node scripts/extract-swatches.mjs`
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SRC = resolve(ROOT, 'apps/web/public/assets')
const OUT = resolve(SRC, 'swatches')

await mkdir(OUT, { recursive: true })
await mkdir(resolve(SRC, 'mats'), { recursive: true })
await mkdir(resolve(SRC, 'heel-pads'), { recursive: true })
await mkdir(resolve(SRC, 'emblems'), { recursive: true })

/* ---------- 1) Paspas + Kenarlık swatchları (raw-color-palette) ---------- */
// Görsel: 843 x 809 — orijinal layout:
//   Üst yarı (y ≈ 60-340): "Paspas Rengi" başlığı + 5x2 grid (10 paspas swatch)
//   Alt yarı (y ≈ 380-790): "Kenarlık Rengi" başlığı + 5x3 grid (15 kenarlık swatch)
const PALETTE = resolve(SRC, 'raw-color-palette.jpeg')
const PW = 843
const PH = 809

// Paspas grid hücre tahminleri (5 sütun x 2 satır)
const matCols = 5
const matRows = 2
const matCellW = Math.floor(PW / matCols) - 4 // ~166
const matCellH = 130
const matStartY = 80
const matRowGap = 130

const matSlugs = [
  ['siyah', 'gri', 'fume', 'mavi', 'taba'],
  ['kirmizi', 'kahve', 'bordo', 'bej', 'turuncu-taba'],
]

for (let r = 0; r < matRows; r++) {
  for (let c = 0; c < matCols; c++) {
    const slug = matSlugs[r][c]
    const left = Math.floor(c * (PW / matCols)) + 4
    const top = matStartY + r * matRowGap
    const width = Math.min(matCellW, PW - left - 4)
    const height = Math.min(matCellH, PH - top - 4)
    await sharp(PALETTE)
      .extract({ left, top, width, height })
      .resize(280, 220, { fit: 'cover' })
      .webp({ quality: 86 })
      .toFile(resolve(OUT, `mat-${slug}.webp`))
    console.log(`✓ mat-${slug}.webp (from ${left},${top} ${width}x${height})`)
  }
}

// Kenarlık grid (5 sütun x 3 satır)
const borderCols = 5
const borderRows = 3
const borderCellW = Math.floor(PW / borderCols) - 4
const borderCellH = 110
const borderStartY = 410
const borderRowGap = 130

const borderSlugs = [
  ['kahve', 'taba', 'krem', 'yesil', 'sari'],
  ['turuncu', 'kirmizi', 'mor', 'lacivert', 'koyu-mavi'],
  ['turkuaz', 'gri', 'fume', 'siyah', 'bordo'],
]

for (let r = 0; r < borderRows; r++) {
  for (let c = 0; c < borderCols; c++) {
    const slug = borderSlugs[r][c]
    const left = Math.floor(c * (PW / borderCols)) + 4
    const top = borderStartY + r * borderRowGap
    const width = Math.min(borderCellW, PW - left - 4)
    const height = Math.min(borderCellH, PH - top - 4)
    if (top >= PH || width <= 0 || height <= 0) continue
    await sharp(PALETTE)
      .extract({ left, top, width, height })
      .resize(220, 180, { fit: 'cover' })
      .webp({ quality: 86 })
      .toFile(resolve(OUT, `border-${slug}.webp`))
    console.log(`✓ border-${slug}.webp (from ${left},${top} ${width}x${height})`)
  }
}

/* ---------- 2) Topukluk dokuları (raw-mats-stack 900x1600) ---------- */
// Üst üste 7 paspasın her birinin sol-üst köşesinde topukluk var.
// Yaklaşık koordinatlar — paspas yığınında her paspas ~190 px yüksek, 30 px aralıklı.
const STACK = resolve(SRC, 'raw-mats-stack.jpeg')
const SW = 900
const SH = 1600

const heelPads = [
  { slug: 'siyah-noktali', left: 280, top: 110, w: 220, h: 90, name: 'Siyah Noktalı' },
  { slug: 'turuncu-noktali', left: 280, top: 320, w: 220, h: 90, name: 'Turuncu Noktalı' },
  { slug: 'beyaz-noktali', left: 380, top: 480, w: 280, h: 90, name: 'Beyaz Noktalı (Karbon)' },
  { slug: 'krem-noktali', left: 280, top: 660, w: 220, h: 90, name: 'Krem Noktalı' },
  { slug: 'mavi-noktali', left: 280, top: 850, w: 220, h: 90, name: 'Mavi Noktalı' },
  { slug: 'kirmizi-noktali', left: 280, top: 1050, w: 220, h: 90, name: 'Kırmızı Noktalı' },
  { slug: 'antrasit-karbon', left: 280, top: 1240, w: 220, h: 90, name: 'Antrasit Karbon' },
  { slug: 'standart', left: 280, top: 1430, w: 220, h: 90, name: 'Standart Antrasit' },
]

for (const hp of heelPads) {
  if (hp.top + hp.h > SH) continue
  await sharp(STACK)
    .extract({ left: hp.left, top: hp.top, width: hp.w, height: hp.h })
    .resize(320, 180, { fit: 'cover' })
    .webp({ quality: 86 })
    .toFile(resolve(SRC, `heel-pads/heel-${hp.slug}.webp`))
  console.log(`✓ heel-${hp.slug}.webp`)
}

/* ---------- 3) Hero için sinematik banner ---------- */
// raw-mats-stack'ten yatay banner (geniş + dramatik)
await sharp(STACK)
  .extract({ left: 50, top: 200, width: 850, height: 1100 })
  .resize(1600, 1200, { fit: 'cover', position: 'center' })
  .modulate({ brightness: 0.92, saturation: 1.08 })
  .webp({ quality: 88 })
  .toFile(resolve(SRC, 'mats/hero-stack.webp'))
console.log('✓ mats/hero-stack.webp')

await sharp(STACK)
  .extract({ left: 50, top: 200, width: 850, height: 1100 })
  .resize(1600, 1200, { fit: 'cover', position: 'center' })
  .modulate({ brightness: 0.92, saturation: 1.08 })
  .avif({ quality: 70 })
  .toFile(resolve(SRC, 'mats/hero-stack.avif'))
console.log('✓ mats/hero-stack.avif')

// Mobil hero crop
await sharp(STACK)
  .resize(900, 1200, { fit: 'cover', position: 'center' })
  .modulate({ brightness: 0.94, saturation: 1.08 })
  .webp({ quality: 86 })
  .toFile(resolve(SRC, 'mats/hero-stack-mobile.webp'))
console.log('✓ mats/hero-stack-mobile.webp')

/* ---------- 4) Konfigürator preview için tek paspas mockup ---------- */
// Tek paspasın tam çekimi — siyah olanın üstünden kırp
await sharp(STACK)
  .extract({ left: 100, top: 60, width: 700, height: 230 })
  .resize(800, 280, { fit: 'cover' })
  .webp({ quality: 90 })
  .toFile(resolve(SRC, 'mats/preview-base.webp'))
console.log('✓ mats/preview-base.webp')

/* ---------- 5) Amblem yığını ---------- */
await sharp(resolve(SRC, 'raw-emblems.jpeg'))
  .resize(900, 1200, { fit: 'cover', position: 'center' })
  .webp({ quality: 88 })
  .toFile(resolve(SRC, 'emblems/emblems-stack.webp'))
console.log('✓ emblems/emblems-stack.webp')

console.log('\nDone.')
