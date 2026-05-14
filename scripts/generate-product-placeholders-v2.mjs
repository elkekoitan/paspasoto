#!/usr/bin/env node
/**
 * generate-product-placeholders-v2.mjs
 *
 * v2 — Kategori başına gerçek ürün silüeti içeren daha profesyonel SVG placeholder.
 * Her kategori için detaylı silüet (parfüm şişesi, sprey kutu, çanta, ekran/cam)
 * + ürüne özgü renk akcanı + light gradient + soft shadow.
 *
 * Asset boyutu: 800×800 (kare format e-ticaret standart).
 *
 * Çalıştırma: node scripts/generate-product-placeholders-v2.mjs
 */

import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', 'apps/web/public/assets/products')

/* -------------------- Ürün silüetleri (kategori başına) -------------------- */

function perfumeBottleSilhouette(accentColor) {
  // Klips parfüm şişesi — düz cam + altın metal kapak + sıvı
  return `
    <!-- Cap (metal) -->
    <rect x="340" y="180" width="120" height="60" rx="6" fill="#3a3a40" stroke="#4a4a52" stroke-width="2"/>
    <rect x="350" y="190" width="100" height="20" rx="3" fill="#5a5a62"/>
    <!-- Neck -->
    <rect x="370" y="240" width="60" height="30" fill="#1a1a22"/>
    <!-- Bottle body (glass) -->
    <path d="M 300 270 L 500 270 L 510 580 Q 510 620 470 620 L 330 620 Q 290 620 290 580 Z"
          fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
    <!-- Liquid -->
    <path d="M 305 380 L 495 380 L 505 575 Q 505 610 470 610 L 330 610 Q 295 610 295 575 Z"
          fill="${accentColor}" opacity="0.85"/>
    <!-- Light reflection on bottle -->
    <ellipse cx="340" cy="430" rx="15" ry="80" fill="rgba(255,255,255,0.3)"/>
    <!-- Label -->
    <rect x="340" y="450" width="120" height="80" rx="4" fill="rgba(255,255,255,0.92)" stroke="rgba(0,0,0,0.1)"/>
    <line x1="360" y1="475" x2="440" y2="475" stroke="#0a0a12" stroke-width="2"/>
    <line x1="365" y1="495" x2="435" y2="495" stroke="rgba(10,10,18,0.5)" stroke-width="1"/>
    <line x1="370" y1="510" x2="430" y2="510" stroke="rgba(10,10,18,0.3)" stroke-width="1"/>
  `
}

function spraySilhouette(accentColor) {
  // Sprey şişesi — silindirik + üst nozul
  return `
    <!-- Nozzle/spray head -->
    <rect x="350" y="160" width="100" height="40" rx="4" fill="#1a1a22"/>
    <rect x="370" y="200" width="60" height="50" fill="#2a2a32" stroke="#3a3a40"/>
    <!-- Body (can) -->
    <rect x="310" y="250" width="180" height="380" rx="8" fill="${accentColor}" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
    <!-- Highlight -->
    <rect x="320" y="260" width="20" height="360" fill="rgba(255,255,255,0.3)" rx="2"/>
    <!-- Top label band -->
    <rect x="310" y="290" width="180" height="40" fill="rgba(0,0,0,0.4)"/>
    <!-- Main label area -->
    <rect x="330" y="380" width="140" height="180" rx="4" fill="rgba(255,255,255,0.92)" stroke="rgba(0,0,0,0.1)"/>
    <!-- Label content lines -->
    <rect x="350" y="400" width="100" height="14" fill="#0a0a12" rx="2"/>
    <rect x="350" y="425" width="80" height="8" fill="rgba(10,10,18,0.6)" rx="1"/>
    <rect x="350" y="445" width="100" height="6" fill="rgba(10,10,18,0.3)"/>
    <rect x="350" y="460" width="90" height="6" fill="rgba(10,10,18,0.3)"/>
    <!-- Volume tag -->
    <rect x="350" y="510" width="100" height="40" rx="3" fill="${accentColor}"/>
    <text x="400" y="538" font-family="Inter, sans-serif" font-size="20" font-weight="700" fill="white" text-anchor="middle">500ml</text>
  `
}

function bagSilhouette(accentColor) {
  // Bagaj organizer çanta — kutu görünüm + tutamak + bölmeler
  return `
    <!-- Handle -->
    <path d="M 350 240 Q 350 200 400 200 Q 450 200 450 240"
          fill="none" stroke="#1a1a22" stroke-width="8" stroke-linecap="round"/>
    <!-- Bag body -->
    <path d="M 240 260 L 560 260 L 580 620 L 220 620 Z"
          fill="${accentColor}" stroke="rgba(0,0,0,0.3)" stroke-width="3"/>
    <!-- Top edge highlight -->
    <line x1="240" y1="260" x2="560" y2="260" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    <!-- Divider lines (compartments) -->
    <line x1="333" y1="280" x2="343" y2="600" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
    <line x1="466" y1="280" x2="456" y2="600" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
    <!-- Pocket fronts -->
    <rect x="260" y="380" width="80" height="100" fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.1)"/>
    <rect x="360" y="380" width="80" height="100" fill="rgba(0,0,0,0.1)" stroke="rgba(255,255,255,0.1)"/>
    <rect x="460" y="380" width="80" height="100" fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.1)"/>
    <!-- Zippers (compartment) -->
    <line x1="270" y1="410" x2="330" y2="410" stroke="rgba(255,255,255,0.5)" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="370" y1="410" x2="430" y2="410" stroke="rgba(255,255,255,0.5)" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="470" y1="410" x2="530" y2="410" stroke="rgba(255,255,255,0.5)" stroke-width="1" stroke-dasharray="3,2"/>
  `
}

function screenSilhouette(accentColor) {
  // Multimedya ekran — yatay/dikey tablet, ekran üzeri parlaklık
  return `
    <!-- Tablet body -->
    <rect x="200" y="200" width="400" height="400" rx="20" fill="#0a0a12" stroke="#1f1f28" stroke-width="3"/>
    <!-- Screen bezel -->
    <rect x="220" y="220" width="360" height="360" rx="6" fill="#0c0c14"/>
    <!-- Screen content/display -->
    <rect x="230" y="230" width="340" height="340" rx="2" fill="${accentColor}" opacity="0.65"/>
    <!-- Tempered glass overlay (slight gloss) -->
    <rect x="230" y="230" width="340" height="340" rx="2" fill="url(#glassGradient)"/>
    <!-- Reflection -->
    <path d="M 230 230 L 380 230 L 280 460 L 230 460 Z" fill="rgba(255,255,255,0.15)"/>
    <!-- 9H badge -->
    <circle cx="540" cy="260" r="30" fill="rgba(0,0,0,0.7)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <text x="540" y="268" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="${accentColor}" text-anchor="middle">9H</text>
    <!-- Bottom bezel speaker mark -->
    <rect x="380" y="585" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
  `
}

function cleanerSilhouette(accentColor) {
  // Kimya temizleyici — sprey bidonu silindiri ile spray cleaner (slightly different from perfume spray)
  return `
    <!-- Trigger -->
    <path d="M 360 200 L 360 250 L 320 280 L 320 260 L 350 240 L 350 200 Z" fill="#1a1a22"/>
    <!-- Top neck -->
    <rect x="360" y="180" width="80" height="50" rx="4" fill="#2a2a32"/>
    <!-- Bottle body -->
    <path d="M 280 230 L 500 230 L 510 620 Q 510 640 490 640 L 290 640 Q 270 640 270 620 Z"
          fill="${accentColor}" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
    <!-- Body highlight -->
    <ellipse cx="300" cy="430" rx="15" ry="180" fill="rgba(255,255,255,0.25)"/>
    <!-- Top color band -->
    <rect x="280" y="260" width="220" height="30" fill="rgba(0,0,0,0.35)"/>
    <!-- Label -->
    <rect x="310" y="340" width="160" height="200" rx="6" fill="rgba(255,255,255,0.94)" stroke="rgba(0,0,0,0.1)"/>
    <!-- Label content -->
    <rect x="335" y="365" width="110" height="18" fill="#0a0a12" rx="2"/>
    <rect x="335" y="395" width="80" height="10" fill="rgba(10,10,18,0.6)"/>
    <rect x="335" y="412" width="100" height="6" fill="rgba(10,10,18,0.4)"/>
    <rect x="335" y="425" width="90" height="6" fill="rgba(10,10,18,0.4)"/>
    <rect x="335" y="438" width="95" height="6" fill="rgba(10,10,18,0.4)"/>
    <!-- Warning/Volume circle -->
    <circle cx="395" cy="510" r="22" fill="${accentColor}" stroke="rgba(0,0,0,0.2)"/>
    <text x="395" y="517" font-family="Inter, sans-serif" font-size="13" font-weight="800" fill="white" text-anchor="middle">PRO</text>
  `
}

/* -------------------- Renk teması (her ürün için) -------------------- */

const PRODUCTS = [
  // screen-protector (cool blue/teal tones)
  { category: 'screen-protector', slug: 'tempered-9h-9-inch', name: '9 inç Multimedya Ekran Koruyucu', accent: '#3b82f6', bg: ['#1e293b', '#0f172a'], silhouette: 'screen' },
  { category: 'screen-protector', slug: 'tempered-9h-10-inch', name: '10 inç Multimedya Ekran', accent: '#06b6d4', bg: ['#164e63', '#082f49'], silhouette: 'screen' },
  { category: 'screen-protector', slug: 'matte-anti-glare-9-inch', name: 'Mat Anti-Glare Ekran Koruyucu', accent: '#64748b', bg: ['#1e293b', '#0f172a'], silhouette: 'screen' },
  { category: 'screen-protector', slug: 'privacy-9-inch', name: 'Privacy Ekran Koruyucu', accent: '#8b5cf6', bg: ['#1e1b4b', '#0c0a2e'], silhouette: 'screen' },
  { category: 'screen-protector', slug: 'gauge-cluster-protector', name: 'Gösterge Paneli Koruyucu', accent: '#22d3ee', bg: ['#164e63', '#082f49'], silhouette: 'screen' },
  { category: 'screen-protector', slug: 'tempered-9h-12-inch', name: '12.3" Premium Ekran', accent: '#a855f7', bg: ['#1e1b4b', '#0c0a2e'], silhouette: 'screen' },

  // perfume (warm/luxurious tones)
  { category: 'perfume', slug: 'midnight-oud', name: 'Midnight Oud Klips Parfüm', accent: '#7c2d92', bg: ['#3b0764', '#1e0438'], silhouette: 'perfume' },
  { category: 'perfume', slug: 'fresh-citrus', name: 'Fresh Citrus Sprey Parfüm', accent: '#f59e0b', bg: ['#854d0e', '#422006'], silhouette: 'spray' },
  { category: 'perfume', slug: 'leather-tobacco', name: 'Leather & Tobacco Klips', accent: '#92400e', bg: ['#451a03', '#1c0a01'], silhouette: 'perfume' },
  { category: 'perfume', slug: 'vanilla-cream', name: 'Vanilla Cream Klips Parfüm', accent: '#e0d2b2', bg: ['#78350f', '#3d1a04'], silhouette: 'perfume' },
  { category: 'perfume', slug: 'ocean-breeze', name: 'Ocean Breeze Klips Parfüm', accent: '#0ea5e9', bg: ['#075985', '#0c4a6e'], silhouette: 'perfume' },
  { category: 'perfume', slug: 'spray-set-trio', name: 'Parfüm Üçlü Set', accent: '#d97706', bg: ['#92400e', '#451a03'], silhouette: 'perfume' },

  // chemical (clean/professional tones)
  { category: 'chemical', slug: 'interior-cleaner-500ml', name: 'İç Temizleyici Sprey 500ml', accent: '#10b981', bg: ['#065f46', '#022c1e'], silhouette: 'cleaner' },
  { category: 'chemical', slug: 'tar-remover-300ml', name: 'Katran Sökücü Sprey', accent: '#dc2626', bg: ['#7f1d1d', '#450a0a'], silhouette: 'cleaner' },
  { category: 'chemical', slug: 'glass-cleaner-750ml', name: 'Cam Temizleyici 750ml', accent: '#06b6d4', bg: ['#155e75', '#083344'], silhouette: 'cleaner' },
  { category: 'chemical', slug: 'leather-conditioner-250ml', name: 'Deri Bakım Kremi', accent: '#a16207', bg: ['#713f12', '#3b1604'], silhouette: 'cleaner' },
  { category: 'chemical', slug: 'engine-degreaser-1l', name: 'Motor Yıkama Köpük 1L', accent: '#ea580c', bg: ['#7c2d12', '#431407'], silhouette: 'cleaner' },
  { category: 'chemical', slug: 'detailing-kit-starter', name: 'Bakım Başlangıç Seti', accent: '#10b981', bg: ['#064e3b', '#022c1e'], silhouette: 'cleaner' },

  // bag (earthy/practical tones)
  { category: 'bag', slug: 'bagaj-organizer-deluxe', name: 'Bagaj Organizer Deluxe', accent: '#1f2937', bg: ['#1f2937', '#0a0a0f'], silhouette: 'bag' },
  { category: 'bag', slug: 'koltuk-arkasi-organizer', name: 'Koltuk Arkası Organizer', accent: '#1e293b', bg: ['#1e293b', '#0a0a0f'], silhouette: 'bag' },
  { category: 'bag', slug: 'yan-cep-konsol-organizer', name: 'Yan Cep Organizer', accent: '#374151', bg: ['#1f2937', '#0a0a0f'], silhouette: 'bag' },
  { category: 'bag', slug: 'cop-torbasi-magnetic', name: 'Manyetik Mini Çöp Torbası', accent: '#525b6f', bg: ['#1f2937', '#0a0a0f'], silhouette: 'bag' },
  { category: 'bag', slug: 'bagaj-net-fileli', name: 'Bagaj Eşya Tutucu File', accent: '#475569', bg: ['#1e293b', '#0a0a0f'], silhouette: 'bag' },
  { category: 'bag', slug: 'piknik-bagaj-cantasi', name: 'Piknik Termal Çantası 25L', accent: '#0891b2', bg: ['#155e75', '#083344'], silhouette: 'bag' },
]

function silhouetteFor(name, accent) {
  switch (name) {
    case 'perfume': return perfumeBottleSilhouette(accent)
    case 'spray': return spraySilhouette(accent)
    case 'bag': return bagSilhouette(accent)
    case 'screen': return screenSilhouette(accent)
    case 'cleaner': return cleanerSilhouette(accent)
    default: return ''
  }
}

function buildSvg(p) {
  const [bg1, bg2] = p.bg
  const silhouette = silhouetteFor(p.silhouette, p.accent)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </radialGradient>
    <radialGradient id="spot" cx="50%" cy="35%" r="30%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <linearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
      <feOffset dx="0" dy="8"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="800" fill="url(#bg)"/>
  <rect width="800" height="800" fill="url(#spot)"/>

  <!-- Floor shadow under product -->
  <ellipse cx="400" cy="680" rx="160" ry="20" fill="rgba(0,0,0,0.5)" opacity="0.6"/>

  <!-- Product silhouette -->
  <g filter="url(#softShadow)">
    ${silhouette}
  </g>

  <!-- Bottom brand mark -->
  <text x="400" y="755" font-family="-apple-system, Inter, sans-serif" font-size="11" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-weight="700" letter-spacing="4">CARMAT</text>
</svg>`
}

let count = 0
for (const p of PRODUCTS) {
  const dir = resolve(ROOT, p.category)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const file = resolve(dir, `${p.slug}.svg`)
  writeFileSync(file, buildSvg(p), 'utf-8')
  count++
}
console.log(`✓ ${count} placeholder v2 SVG üretildi → ${ROOT}`)
