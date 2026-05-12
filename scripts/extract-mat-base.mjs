#!/usr/bin/env node
/**
 * extract-mat-base.mjs
 *
 * Kullanıcının verdiği "mat-stack.jpg" (900×1600 dikey, 7 paspas üst üste)
 * görselinden LivePreview için temel base fotoğraflar üretir:
 *
 *   /assets/mats/base/classic-paw-full.webp  — 4 paspas + bagaj seti (4 mat görünür)
 *   /assets/mats/base/classic-paw-front.webp — 2 paspas seti (2 mat görünür)
 *
 * Geçici çözüm: kullanıcı top-down stüdyo çekimi temin edene kadar.
 *
 * Çalıştırma: cd apps/web && node ../../scripts/extract-mat-base.mjs
 */

import sharp from 'sharp'
import { mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const RAW = resolve(process.cwd(), 'public/assets/_raw/mat-stack.jpg')
const OUT = resolve(process.cwd(), 'public/assets/mats/base')
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

async function exportRegion(name, left, top, width, height, outW = 1600, outH = 900) {
  const dest = resolve(OUT, `${name}.webp`)
  const avifDest = resolve(OUT, `${name}.avif`)
  // PNG with alpha (background trimmed) — sharp tek pass'te yapamadığı için sadece webp/avif
  await sharp(RAW)
    .extract({ left, top, width, height })
    .resize(outW, outH, { fit: 'cover', position: 'center' })
    .webp({ quality: 88 })
    .toFile(dest)
  await sharp(RAW)
    .extract({ left, top, width, height })
    .resize(outW, outH, { fit: 'cover', position: 'center' })
    .avif({ quality: 70 })
    .toFile(avifDest)
  return dest
}

async function main() {
  if (!existsSync(RAW)) {
    console.error(`✗ Kaynak yok: ${RAW}`)
    process.exit(1)
  }
  const meta = await sharp(RAW).metadata()
  console.log(`Kaynak: ${meta.width}×${meta.height}`)

  // 4-li set: orta 4 paspas (y≈400-1300)
  await exportRegion('classic-paw-full', 60, 380, 800, 950)
  // Ön çift (2-li): üstteki 2 paspas (y≈30-460)
  await exportRegion('classic-paw-front', 60, 30, 800, 480)

  console.log(`✓ classic-paw-full.{webp,avif} + classic-paw-front.{webp,avif} → ${OUT}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
