#!/usr/bin/env node
/**
 * extract-palette-swatches.mjs
 *
 * Kullanıcının verdiği "Paspas Rengi + Kenarlık Rengi" palet JPEG'inden (843×809)
 * 25 swatch (10 mat + 15 border) crop'lar ve `public/assets/swatches/` altına yazar.
 *
 * Catalog slug sırası palette ile birebir eşleşiyor — kontrol edildi.
 *
 * Çalıştırma:  cd apps/web && node ../../scripts/extract-palette-swatches.mjs
 */

import sharp from 'sharp'
import { mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const RAW = resolve(process.cwd(), 'public/assets/_raw/mat-color-palette.jpg')
const OUT = resolve(process.cwd(), 'public/assets/swatches')
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

// Visual grid analizi (843×809 görsel için):
//   Mat satır 1 swatch y-aralığı:  60..175
//   Mat satır 2 swatch y-aralığı: 220..335
//   Border satır 1 y-aralığı:    420..530
//   Border satır 2 y-aralığı:    560..670
//   Border satır 3 y-aralığı:    695..800
//   5 sütun x-merkezleri:        140, 290, 440, 590, 740
const COL_X = [70, 220, 370, 520, 670]
const TILE_W = 140
const TILE_H = 85

const MAT_ROWS = [
  { y: 65,  slugs: ['siyah', 'gri', 'fume', 'mavi', 'taba'] },
  { y: 225, slugs: ['kirmizi', 'kahve', 'bordo', 'bej', 'turuncu-taba'] },
]

const BORDER_ROWS = [
  { y: 430, slugs: ['kahve', 'taba', 'krem', 'yesil', 'sari'] },
  { y: 565, slugs: ['turuncu', 'kirmizi', 'mor', 'lacivert', 'koyu-mavi'] },
  { y: 700, slugs: ['turkuaz', 'gri', 'fume', 'siyah', 'bordo'] },
]

async function cropTile(prefix, slug, x, y) {
  const dest = resolve(OUT, `${prefix}-${slug}.webp`)
  const meta = await sharp(RAW).metadata()
  const left = Math.max(0, Math.min(x, meta.width - 1))
  const top = Math.max(0, Math.min(y, meta.height - 1))
  const width = Math.min(TILE_W, meta.width - left)
  const height = Math.min(TILE_H, meta.height - top)
  await sharp(RAW)
    .extract({ left, top, width, height })
    .resize(320, 256, { fit: 'cover' })
    .webp({ quality: 88 })
    .toFile(dest)
  return dest
}

async function main() {
  if (!existsSync(RAW)) {
    console.error(`✗ Kaynak yok: ${RAW}`)
    process.exit(1)
  }
  let count = 0
  for (const row of MAT_ROWS) {
    for (let i = 0; i < row.slugs.length; i++) {
      await cropTile('mat', row.slugs[i], COL_X[i], row.y)
      count++
    }
  }
  for (const row of BORDER_ROWS) {
    for (let i = 0; i < row.slugs.length; i++) {
      await cropTile('border', row.slugs[i], COL_X[i], row.y)
      count++
    }
  }
  console.log(`✓ ${count} swatch oluşturuldu → ${OUT}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
