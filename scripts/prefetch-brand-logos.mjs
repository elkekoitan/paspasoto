#!/usr/bin/env node
/**
 * prefetch-brand-logos.mjs
 *
 * Yüksek kaliteli marka SVG'lerini tipstrade/node-vehicle-logos (MIT, jsDelivr)
 * deposundan indirir ve `apps/web/public/assets/brands/` altına kaydeder.
 * CDN bağımsız — build sonrası uygulama kendi statik dosyalarından serve eder.
 *
 * Eksik markalar (Opel, Togg, Skywell) için Wikimedia Commons SVG URL'leri.
 *
 * Çalıştırma:  node scripts/prefetch-brand-logos.mjs
 */

import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'apps/web/public/assets/brands')
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const TIPSTRADE_BASE = 'https://cdn.jsdelivr.net/gh/tipstrade/node-vehicle-logos@master/assets'

/**
 * Catalog slug → tipstrade filename mapping.
 * Tipstrade çoğu marka için tek kelime (lowercase). Boşluklu/iki kelimeli olanlar hyphen.
 * Bazı slug uyuşmazlıkları aşağıda haritalandı.
 */
const TIPSTRADE_MAP = {
  // Birebir eşleşenler (slug = filename)
  audi: 'audi',
  bmw: 'bmw',
  volkswagen: 'volkswagen',
  skoda: 'skoda',
  hyundai: 'hyundai',
  ford: 'ford',
  peugeot: 'peugeot',
  renault: 'renault',
  fiat: 'fiat',
  toyota: 'toyota',
  honda: 'honda',
  volvo: 'volvo',
  citroen: 'citroen',
  seat: 'seat',
  dacia: 'dacia',
  kia: 'kia',
  nissan: 'nissan',
  mazda: 'mazda',
  mini: 'mini',
  porsche: 'porsche',
  lexus: 'lexus',
  tesla: 'tesla',
  subaru: 'subaru',
  mitsubishi: 'mitsubishi',
  suzuki: 'suzuki',
  jeep: 'jeep',
  jaguar: 'jaguar',
  chevrolet: 'chevrolet',
  mg: 'mg',
  cupra: 'cupra',
  byd: 'byd',
  iveco: 'iveco',
  isuzu: 'isuzu',
  chery: 'chery',
  polestar: 'polestar',
  genesis: 'genesis',
  smart: 'smart',
  infiniti: 'infiniti',
  // Slug farklı olanlar
  mercedes: 'mercedes-benz',
  landrover: 'land-rover',
  'alfa-romeo': 'alfa-romeo',
  ssangyong: 'ssangyong',
}

/**
 * filippofilip95/car-logos-dataset PNG fallback (tipstrade'de olmayanlar için).
 */
const FILIPPO_BASE = 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized'
const FILIPPO_MAP = {
  hongqi: 'hongqi',
  mahindra: 'mahindra',
}

/**
 * Wikimedia Commons SVG URL'leri (tipstrade'de olmayan markalar için).
 * NOT: Wikimedia kullanıcının "User:..." dizinine yönlendirebilir; direct file URL
 * `Special:FilePath/Filename.svg` formatı ile en güvenli erişim.
 */
const WIKIMEDIA_MAP = {
  opel: 'https://commons.wikimedia.org/wiki/Special:FilePath/Opel%20Logo%202021.svg',
  togg: 'https://commons.wikimedia.org/wiki/Special:FilePath/Togg%20Official%20Logo.svg',
  // Skywell: SVG bulunamadı, mevcut placeholder kullanılır (manuel eklenecek)
}

async function fetchSvg(url, retries = 3) {
  let lastErr
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'paspasoto-build/1.0 (logo prefetch)' },
      })
      if (res.status === 502 || res.status === 503 || res.status === 429) {
        // CDN cache miss / rate limit — retry with backoff
        await new Promise((r) => setTimeout(r, (i + 1) * 1500))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      const text = await res.text()
      if (!text.includes('<svg')) throw new Error(`Not SVG: ${url}`)
      return text
    } catch (e) {
      lastErr = e
      await new Promise((r) => setTimeout(r, (i + 1) * 1000))
    }
  }
  throw lastErr ?? new Error(`Failed after ${retries} retries: ${url}`)
}

async function fetchBytes(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'paspasoto-build/1.0' },
      })
      if (res.status >= 500 || res.status === 429) {
        await new Promise((r) => setTimeout(r, (i + 1) * 1500))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise((r) => setTimeout(r, (i + 1) * 1000))
    }
  }
}

async function downloadOne(slug) {
  if (TIPSTRADE_MAP[slug]) {
    const url = `${TIPSTRADE_BASE}/${TIPSTRADE_MAP[slug]}.svg`
    try {
      const svg = await fetchSvg(url)
      writeFileSync(resolve(OUT, `${slug}.svg`), svg, 'utf-8')
      return { slug, status: 'ok', provider: 'tipstrade', bytes: svg.length }
    } catch (e) {
      return { slug, status: 'fail', provider: 'tipstrade', reason: e.message }
    }
  }
  if (WIKIMEDIA_MAP[slug]) {
    try {
      const svg = await fetchSvg(WIKIMEDIA_MAP[slug])
      writeFileSync(resolve(OUT, `${slug}.svg`), svg, 'utf-8')
      return { slug, status: 'ok', provider: 'wikimedia', bytes: svg.length }
    } catch (e) {
      return { slug, status: 'fail', provider: 'wikimedia', reason: e.message }
    }
  }
  if (FILIPPO_MAP[slug]) {
    try {
      const buf = await fetchBytes(`${FILIPPO_BASE}/${FILIPPO_MAP[slug]}.png`)
      writeFileSync(resolve(OUT, `${slug}.png`), buf)
      return { slug, status: 'ok', provider: 'filippo-png', bytes: buf.length }
    } catch (e) {
      return { slug, status: 'fail', provider: 'filippo-png', reason: e.message }
    }
  }
  return { slug, status: 'skip', reason: 'no mapping' }
}

const ALL = [
  ...Object.keys(TIPSTRADE_MAP),
  ...Object.keys(WIKIMEDIA_MAP),
  ...Object.keys(FILIPPO_MAP),
]

const results = []
for (const slug of ALL) {
  process.stdout.write(`${slug.padEnd(14)} `)
  const r = await downloadOne(slug)
  results.push(r)
  console.log(`${r.status.toUpperCase()} ${r.provider ?? ''} ${r.bytes ?? r.reason ?? ''}`)
}

const ok = results.filter((r) => r.status === 'ok').length
const fail = results.filter((r) => r.status === 'fail').length
console.log(`\n${ok}/${results.length} OK · ${fail} fail`)

if (fail > 0) {
  console.log('\nBaşarısız markalar:')
  results.filter((r) => r.status === 'fail').forEach((r) => console.log(`  - ${r.slug}: ${r.reason}`))
}
