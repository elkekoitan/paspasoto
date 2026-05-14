#!/usr/bin/env node
/**
 * generate-product-placeholders.mjs
 *
 * Yeni ürün kategorileri (parfüm, çanta, kimya, ekran koruyucu) için
 * gradient placeholder SVG üretir. Her ürün için tek bir kategoriye özgü
 * gradient + emoji + ürün adı.
 *
 * Gerçek ürün fotoğrafı drop edilince placeholder otomatik gizlenir
 * (<img onError fallback). Bu sayede sayfa hiç boş görünmez.
 *
 * Çalıştırma: node scripts/generate-product-placeholders.mjs
 */

import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', 'apps/web/public/assets/products')

const CATEGORIES = {
  'screen-protector': {
    emoji: '📱',
    gradient: ['#1e3a8a', '#0c1d4d'], // koyu mavi
    accent: '#60a5fa',
  },
  perfume: {
    emoji: '🌸',
    gradient: ['#7c2d92', '#4c1d5c'], // mor
    accent: '#e879f9',
  },
  chemical: {
    emoji: '🧪',
    gradient: ['#065f46', '#022c1e'], // koyu yeşil
    accent: '#34d399',
  },
  bag: {
    emoji: '🎒',
    gradient: ['#92400e', '#451a03'], // kahverengi/turuncu
    accent: '#fbbf24',
  },
}

function placeholderSvg(category, productName, slug) {
  const meta = CATEGORIES[category]
  if (!meta) throw new Error(`Bilinmeyen kategori: ${category}`)
  const [c1, c2] = meta.gradient
  const lines = wrapText(productName, 28)
  const lineHeight = 28
  const textY = 480 - (lines.length - 1) * lineHeight / 2

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="r" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${meta.accent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${meta.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <rect width="600" height="600" fill="url(#r)"/>
  <text x="300" y="280" font-family="-apple-system, Segoe UI, Inter, sans-serif" font-size="180" text-anchor="middle" fill="#ffffff" opacity="0.9">${meta.emoji}</text>
  <g font-family="-apple-system, Segoe UI, Inter, sans-serif" font-size="22" font-weight="600" fill="#ffffff" text-anchor="middle" opacity="0.95">
    ${lines.map((line, i) => `<text x="300" y="${textY + i * lineHeight}">${escapeXml(line)}</text>`).join('\n    ')}
  </g>
  <text x="300" y="570" font-family="-apple-system, Segoe UI, Inter, sans-serif" font-size="12" text-anchor="middle" fill="${meta.accent}" font-weight="700" letter-spacing="4" opacity="0.85">CARMAT</text>
</svg>`
}

function wrapText(text, maxChars) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      lines.push(line.trim())
      line = w
    } else {
      line = (line + ' ' + w).trim()
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

function escapeXml(s) {
  return s.replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
  })[c])
}

// catalog-extra.ts'den ürünleri runtime'da okumak yerine elle inline:
const PRODUCTS = [
  // screen-protector
  { category: 'screen-protector', slug: 'tempered-9h-9-inch', name: '9 inç Multimedya Ekran Koruyucu — 9H Temperli Cam' },
  { category: 'screen-protector', slug: 'tempered-9h-10-inch', name: '10 inç Multimedya Ekran Koruyucu — 9H Temperli Cam' },
  { category: 'screen-protector', slug: 'matte-anti-glare-9-inch', name: '9 inç Mat Yüzeyli Anti-Glare Ekran Koruyucu' },
  { category: 'screen-protector', slug: 'privacy-9-inch', name: '9 inç Gizlilik Ekran Koruyucu' },
  { category: 'screen-protector', slug: 'gauge-cluster-protector', name: 'Gösterge Paneli Ekran Koruyucu' },
  { category: 'screen-protector', slug: 'tempered-9h-12-inch', name: '12.3 inç Büyük Ekran Koruyucu' },
  // perfume
  { category: 'perfume', slug: 'midnight-oud', name: 'Midnight Oud Klips Parfüm' },
  { category: 'perfume', slug: 'fresh-citrus', name: 'Fresh Citrus Spray Parfüm' },
  { category: 'perfume', slug: 'leather-tobacco', name: 'Leather & Tobacco Klips Parfüm' },
  { category: 'perfume', slug: 'vanilla-cream', name: 'Vanilla Cream Klips Parfüm' },
  { category: 'perfume', slug: 'ocean-breeze', name: 'Ocean Breeze Klips Parfüm' },
  { category: 'perfume', slug: 'spray-set-trio', name: 'Parfüm Üçlü Set' },
  // chemical
  { category: 'chemical', slug: 'interior-cleaner-500ml', name: 'İç Temizleyici Spray 500ml' },
  { category: 'chemical', slug: 'tar-remover-300ml', name: 'Katran ve Asfalt Sökücü Sprey 300ml' },
  { category: 'chemical', slug: 'glass-cleaner-750ml', name: 'Cam Temizleyici Çizgisiz 750ml' },
  { category: 'chemical', slug: 'leather-conditioner-250ml', name: 'Deri Bakım Kremi 250ml' },
  { category: 'chemical', slug: 'engine-degreaser-1l', name: 'Motor Yıkama Köpüğü 1L' },
  { category: 'chemical', slug: 'detailing-kit-starter', name: 'Oto Bakım Başlangıç Seti' },
  // bag
  { category: 'bag', slug: 'bagaj-organizer-deluxe', name: 'Bagaj Organizer Deluxe 3 Bölmeli' },
  { category: 'bag', slug: 'koltuk-arkasi-organizer', name: 'Koltuk Arkası Organizer Tablet' },
  { category: 'bag', slug: 'yan-cep-konsol-organizer', name: 'Yan Cep Konsol Organizer 2 li' },
  { category: 'bag', slug: 'cop-torbasi-magnetic', name: 'Manyetik Mini Çöp Torbası' },
  { category: 'bag', slug: 'bagaj-net-fileli', name: 'Bagaj Eşya Tutucu File' },
  { category: 'bag', slug: 'piknik-bagaj-cantasi', name: 'Piknik Termal Bagaj Çantası 25L' },
]

let count = 0
for (const p of PRODUCTS) {
  const dir = resolve(ROOT, p.category)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const file = resolve(dir, `${p.slug}.svg`)
  writeFileSync(file, placeholderSvg(p.category, p.name, p.slug), 'utf-8')
  count++
}
console.log(`✓ ${count} placeholder SVG üretildi → ${ROOT}`)
