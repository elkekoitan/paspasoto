#!/usr/bin/env node
/**
 * tint-hero-variants.mjs
 *
 * Siyah hero foto'sundan (mats/hero/siyah.webp) 9 renk varyantı üretir.
 * Sharp .tint() — luminance'ı korur, chroma'yı hedef renge çevirir.
 * Diamond doku ve gölgeler korunur, sadece "renklendirilir".
 *
 * Çalıştırma: cd apps/web && node ../../scripts/tint-hero-variants.mjs
 */

import sharp from 'sharp'
import { resolve } from 'node:path'

const HERO = resolve(process.cwd(), 'public/assets/mats/hero')
const SRC = resolve(HERO, 'siyah.webp')

const COLORS = {
  gri:            { r: 138, g: 138, b: 142 },
  fume:           { r:  74, g:  74, b:  82 },
  mavi:           { r:  60, g: 100, b: 180 },
  taba:           { r: 165, g: 115, b:  75 },
  kirmizi:        { r: 200, g:  50, b:  50 },
  kahve:          { r:  95, g:  60, b:  40 },
  bordo:          { r: 140, g:  45, b:  60 },
  bej:            { r: 220, g: 200, b: 165 },
  'turuncu-taba': { r: 220, g: 120, b:  60 },
}

const results = []
for (const [slug, color] of Object.entries(COLORS)) {
  await sharp(SRC).tint(color).webp({ quality: 92 }).toFile(resolve(HERO, `${slug}.webp`))
  await sharp(SRC).tint(color).avif({ quality: 75 }).toFile(resolve(HERO, `${slug}.avif`))
  results.push(slug)
  console.log(`✓ ${slug}.webp + .avif`)
}

console.log(`\n${results.length} renk varyantı üretildi`)
console.log('BigMatBackdrop.tsx VARIANT_AVAILABLE map:')
results.forEach((s) => {
  const key = s.includes('-') ? `'${s}'` : s
  console.log(`  ${key}: true,`)
})
