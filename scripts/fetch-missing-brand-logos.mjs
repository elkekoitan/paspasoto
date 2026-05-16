#!/usr/bin/env node
/**
 * 13 text-only placeholder marka logosunu Wikipedia Commons'tan vektör SVG çek.
 *
 * Çalıştırma: node scripts/fetch-missing-brand-logos.mjs
 */
import { mkdirSync, existsSync, writeFileSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'apps/web/public/assets/brands')
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

// Slug → Wikipedia Commons Special:FilePath URL
const MISSING = {
  voyah: 'Voyah_logo.svg',
  tank: 'TANK_brand_logo.svg',
  jaecoo: 'Jaecoo_logo.svg',
  anadol: 'Anadol_otomobil_logosu.svg',
  karsan: 'Karsan_logo.svg',
  otokar: 'Otokar-logo.svg',
  tofas: 'Tofa%C5%9F_logo.svg',
  bmc: 'BMC_logo.svg',
  gac: 'GAC_Group_logo.svg',
  baic: 'BAIC_Group_logo.svg',
  dfsk: 'DFSK_logo.svg',
  temsa: 'Temsa_logo.svg',
  hongqi: 'Hongqi_logo.svg',
}

async function fetchSvg(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'paspasoto-build/1.0 (logo fetch)' },
        redirect: 'follow',
      })
      if (!res.ok) {
        if (i < retries) {
          await new Promise((r) => setTimeout(r, (i + 1) * 1000))
          continue
        }
        throw new Error(`HTTP ${res.status}`)
      }
      const text = await res.text()
      // HTML response (Wikipedia file page) yerine SVG content kontrolü
      if (!text.includes('<svg')) {
        throw new Error('Not SVG content (got HTML?)')
      }
      // SVG'yi normalize et — viewBox + preserveAspectRatio + aria-label
      return normalizeSvg(text)
    } catch (e) {
      if (i === retries) throw e
    }
  }
}

function normalizeSvg(svg) {
  // Eğer viewBox yoksa, width/height'tan üret
  let out = svg
  if (!out.includes('viewBox')) {
    const w = out.match(/width="([^"]+)"/)?.[1]
    const h = out.match(/height="([^"]+)"/)?.[1]
    if (w && h) {
      const wn = parseFloat(w)
      const hn = parseFloat(h)
      if (!isNaN(wn) && !isNaN(hn)) {
        out = out.replace('<svg', `<svg viewBox="0 0 ${wn} ${hn}"`)
      }
    }
  }
  // preserveAspectRatio ekle
  if (!out.includes('preserveAspectRatio')) {
    out = out.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"')
  }
  // width/height attribute'larını kaldır (responsive)
  out = out.replace(/<svg([^>]*)\s+width="[^"]+"/g, '<svg$1')
  out = out.replace(/<svg([^>]*)\s+height="[^"]+"/g, '<svg$1')
  return out
}

const results = []
for (const [slug, filename] of Object.entries(MISSING)) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`
  process.stdout.write(`${slug.padEnd(10)} `)
  try {
    const svg = await fetchSvg(url)
    if (svg.length > 50 * 1024) {
      console.log(`⚠ ${svg.length} bytes (>50KB, skipping)`)
      results.push({ slug, status: 'too_large', bytes: svg.length })
      continue
    }
    const target = resolve(OUT, `${slug}.svg`)
    writeFileSync(target, svg, 'utf-8')
    console.log(`✓ ${svg.length} bytes`)
    results.push({ slug, status: 'ok', bytes: svg.length })
  } catch (e) {
    console.log(`✗ ${e.message}`)
    results.push({ slug, status: 'fail', error: e.message })
  }
  await new Promise((r) => setTimeout(r, 300)) // rate limit
}

const ok = results.filter((r) => r.status === 'ok').length
const fail = results.filter((r) => r.status !== 'ok').length
console.log(`\n${ok}/${results.length} OK · ${fail} fail`)

if (fail > 0) {
  console.log('\nBaşarısız (manuel eklenecek):')
  results.filter((r) => r.status !== 'ok').forEach((r) => console.log(`  - ${r.slug}: ${r.error ?? r.status}`))
}
