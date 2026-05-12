#!/usr/bin/env node
/**
 * process-hero-photos.mjs
 *
 * Kullanıcı Gemini'den indirip `apps/web/public/assets/_raw/` altına yüklediği
 * hero fotoğraflarını otomatik işler:
 *   - Watermark (Gemini sparkle) crop (~180px sağ + 100px alt)
 *   - 2560x1440 resize (cover, center)
 *   - WebP @92% + AVIF @75% çıktı
 *   - Hedef: apps/web/public/assets/mats/hero/{slug}.{webp,avif}
 *
 * Aranacak dosya isimleri (regex):
 *   hero-{slug}.(png|jpg|jpeg)
 *   gemini-mat-{slug}.(png|jpg|jpeg)
 *   {slug}-mat.(png|jpg|jpeg)
 *
 * Tanınan slug'lar:
 *   siyah, gri, fume, mavi, taba, kirmizi, kahve, bordo, bej, turuncu-taba
 *
 * Çalıştırma:  cd apps/web && node ../../scripts/process-hero-photos.mjs
 */

import sharp from 'sharp'
import { readdirSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const RAW_DIR = resolve(process.cwd(), 'public/assets/_raw')
const OUT_DIR = resolve(process.cwd(), 'public/assets/mats/hero')
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

const VALID_SLUGS = [
  'siyah', 'gri', 'fume', 'mavi', 'taba',
  'kirmizi', 'kahve', 'bordo', 'bej', 'turuncu-taba',
]

const PATTERNS = [
  /^hero-([a-z-]+)\.(png|jpe?g)$/i,
  /^gemini-mat-([a-z-]+)\.(png|jpe?g)$/i,
  /^([a-z-]+)-mat\.(png|jpe?g)$/i,
  /^mat-([a-z-]+)\.(png|jpe?g)$/i,
]

function detectSlug(filename) {
  for (const re of PATTERNS) {
    const m = filename.match(re)
    if (!m) continue
    const slug = m[1].toLowerCase()
    if (VALID_SLUGS.includes(slug)) return slug
    // Bazı varyantlar
    if (slug === 'kırmızı' || slug === 'red') return 'kirmizi'
  }
  return null
}

async function processOne(srcPath, slug) {
  const meta = await sharp(srcPath).metadata()
  // Gemini watermark (sparkle ✦) sağ-alt köşede ~180px sağ + 100px alt
  // Eğer sağ-alt'ı kırpılmış (1024x572 küçük olanda zaten dar) farkı kontrol et
  const cropRight = meta.width > 1500 ? 180 : 50
  const cropBottom = meta.height > 800 ? 100 : 30
  const extractWidth = Math.max(100, meta.width - cropRight)
  const extractHeight = Math.max(100, meta.height - cropBottom)

  const base = sharp(srcPath).extract({
    left: 0,
    top: 0,
    width: extractWidth,
    height: extractHeight,
  }).resize(2560, 1440, { fit: 'cover', position: 'center' })

  await Promise.all([
    base.clone().webp({ quality: 92 }).toFile(resolve(OUT_DIR, `${slug}.webp`)),
    base.clone().avif({ quality: 75 }).toFile(resolve(OUT_DIR, `${slug}.avif`)),
  ])
  // Eğer siyah ise default'a da kopyala
  if (slug === 'siyah') {
    await Promise.all([
      base.clone().webp({ quality: 92 }).toFile(resolve(OUT_DIR, 'default.webp')),
      base.clone().avif({ quality: 75 }).toFile(resolve(OUT_DIR, 'default.avif')),
    ])
  }
  return { slug, dim: `${meta.width}x${meta.height}` }
}

async function main() {
  if (!existsSync(RAW_DIR)) {
    console.error('✗ _raw klasörü bulunamadı:', RAW_DIR)
    process.exit(1)
  }
  const files = readdirSync(RAW_DIR)
  const matched = files
    .map((f) => ({ f, slug: detectSlug(f) }))
    .filter((x) => x.slug)

  if (matched.length === 0) {
    console.log('Eşleşen dosya yok. Beklenen format: hero-{slug}.png (veya .jpg/.jpeg)')
    console.log('Geçerli slug\'lar:', VALID_SLUGS.join(', '))
    return
  }

  console.log(`${matched.length} dosya işleniyor...`)
  const done = []
  for (const { f, slug } of matched) {
    try {
      const res = await processOne(resolve(RAW_DIR, f), slug)
      done.push(res)
      console.log(`  ✓ ${f} → ${slug}.{webp,avif} (${res.dim})`)
    } catch (e) {
      console.error(`  ✗ ${f}: ${e.message}`)
    }
  }

  // VARIANT_AVAILABLE güncelleme rehberi
  if (done.length > 0) {
    console.log('\n────────────────────────────────────────')
    console.log('BigMatBackdrop.tsx içinde VARIANT_AVAILABLE güncellenecek:')
    done.forEach((d) => {
      const key = d.slug.includes('-') ? `'${d.slug}'` : d.slug
      console.log(`  ${key}: true,`)
    })
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
