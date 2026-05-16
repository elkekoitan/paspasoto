#!/usr/bin/env node
/**
 * Image optimization — PNG/JPG → WebP + AVIF
 *
 * /public/assets/ altındaki tüm PNG ve JPG'leri:
 *   - WebP (q=85) yan kopya
 *   - AVIF (q=70) yan kopya (daha küçük, modern tarayıcı)
 * Orijinaller kalır (eski tarayıcı + Picture component fallback için).
 *
 * Çalıştır: node scripts/optimize-images.mjs
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, extname, basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '..', 'apps/web/public')

function walk(dir) {
  const results = []
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name)
    const st = statSync(fullPath)
    if (st.isDirectory()) results.push(...walk(fullPath))
    else results.push(fullPath)
  }
  return results
}

const TARGETS = ['.png', '.jpg', '.jpeg']
const SKIP_PATTERNS = ['/icons/', '/favicon', '_placeholder']

const files = walk(PUBLIC_DIR).filter((f) => {
  if (!TARGETS.includes(extname(f).toLowerCase())) return false
  if (SKIP_PATTERNS.some((p) => f.includes(p))) return false
  return true
})

console.log(`${files.length} resim dönüştürülecek...\n`)

let totalOrig = 0
let totalWebp = 0
let totalAvif = 0
let processed = 0
let failed = 0

for (const src of files) {
  const ext = extname(src).toLowerCase()
  const dir = dirname(src)
  const base = basename(src, ext)
  const webpPath = join(dir, base + '.webp')
  const avifPath = join(dir, base + '.avif')

  try {
    const origSize = statSync(src).size
    totalOrig += origSize

    // WebP — atla varsa ve daha yeniyse
    if (!existsSync(webpPath) || statSync(webpPath).mtimeMs < statSync(src).mtimeMs) {
      await sharp(src)
        .webp({ quality: 85, effort: 6 })
        .toFile(webpPath)
    }
    totalWebp += statSync(webpPath).size

    // AVIF (opsiyonel — daha agresif compression)
    if (!existsSync(avifPath) || statSync(avifPath).mtimeMs < statSync(src).mtimeMs) {
      try {
        await sharp(src)
          .avif({ quality: 70, effort: 4 })
          .toFile(avifPath)
      } catch {
        // AVIF bazı imageler için fail edebilir — skip
      }
    }
    if (existsSync(avifPath)) totalAvif += statSync(avifPath).size

    processed++
    const rel = src.replace(PUBLIC_DIR, '').replace(/\\/g, '/')
    const orig = (origSize / 1024).toFixed(1)
    const webp = (statSync(webpPath).size / 1024).toFixed(1)
    const reduction = Math.round((1 - statSync(webpPath).size / origSize) * 100)
    console.log(`✓ ${rel.padEnd(50)} ${orig}KB → ${webp}KB (-%${reduction})`)
  } catch (e) {
    failed++
    console.log(`✗ ${src}: ${e.message}`)
  }
}

console.log(`\n${processed}/${files.length} işlendi, ${failed} hata`)
console.log(`Orig: ${(totalOrig / 1024 / 1024).toFixed(2)} MB`)
console.log(`WebP: ${(totalWebp / 1024 / 1024).toFixed(2)} MB (%${Math.round((1 - totalWebp / totalOrig) * 100)} azalma)`)
if (totalAvif > 0) {
  console.log(`AVIF: ${(totalAvif / 1024 / 1024).toFixed(2)} MB (%${Math.round((1 - totalAvif / totalOrig) * 100)} azalma)`)
}
