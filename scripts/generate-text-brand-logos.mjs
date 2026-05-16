#!/usr/bin/env node
/**
 * Premium branded text-logo generator.
 *
 * Wikipedia/CDN'de bulunamayan markalar için yüksek kaliteli text-bazlı SVG.
 * Gradient background, premium typography, marka renk paleti.
 */
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'apps/web/public/assets/brands')

/**
 * Renk paleti — marka resmi renklerinden (Wikipedia + Brand Guidelines):
 * bg: dolgu rengi
 * fg: yazı rengi (yüksek contrast)
 * gradient: opsiyonel gradient orta tonu
 */
const TEXT_LOGOS = {
  voyah:   { label: 'VOYAH',   bg: '#0E1A2B', fg: '#D4AF37', gradient: '#1A2B3D' },
  tank:    { label: 'TANK',    bg: '#1A1A1A', fg: '#FFD700', gradient: '#2D2D2D' },
  jaecoo:  { label: 'JAECOO',  bg: '#0D3B26', fg: '#F0F0F0', gradient: '#1B5E20' },
  gac:     { label: 'GAC',     bg: '#A8001F', fg: '#FFFFFF', gradient: '#C8102E' },
  dfsk:    { label: 'DFSK',    bg: '#002B62', fg: '#FFFFFF', gradient: '#003F87' },
  baic:    { label: 'BAIC',    bg: '#A8000D', fg: '#FFFFFF', gradient: '#E60012' },
  skywell: { label: 'SKYWELL', bg: '#003E7E', fg: '#FFFFFF', gradient: '#0066B3' },
  karsan:  { label: 'KARSAN',  bg: '#002B62', fg: '#FFFFFF', gradient: '#003F87' },
  otokar:  { label: 'OTOKAR',  bg: '#B30410', fg: '#FFFFFF', gradient: '#E30613' },
  temsa:   { label: 'TEMSA',   bg: '#002B62', fg: '#FFFFFF', gradient: '#003F87' },
  bmc:     { label: 'BMC',     bg: '#1A1A1A', fg: '#FFC107', gradient: '#2D2D2D' },
  anadol:  { label: 'ANADOL',  bg: '#5C2E0D', fg: '#F5DEB3', gradient: '#8B4513' },
  tofas:   { label: 'TOFAŞ',   bg: '#B30410', fg: '#FFFFFF', gradient: '#E30613' },
  voyah:   { label: 'VOYAH',   bg: '#0E1A2B', fg: '#D4AF37', gradient: '#1A2B3D' },
  hongqi:  { label: '红旗',     bg: '#A8000D', fg: '#FFD700', gradient: '#C8102E' }, // Çince orijinal isim
  // Bonus: profesyonel placeholder göre rolls-royce zaten PNG. Yine de fallback.
}

function svg({ label, bg, fg, gradient }) {
  const len = label.length
  // Premium font size — letter count'a göre ayarla
  const fontSize = len <= 3 ? 28 : len <= 5 ? 22 : len <= 7 ? 17 : 14
  const letterSpacing = len <= 4 ? '0.5' : '0.2'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${label} logo">
  <defs>
    <linearGradient id="bgg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradient}"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
    <filter id="sh" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="1.5"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="32" fill="url(#bgg)"/>
  <rect width="200" height="200" rx="32" fill="none" stroke="${fg}" stroke-opacity="0.08" stroke-width="2"/>
  <text x="100" y="108" font-family="'Inter', 'Helvetica Neue', sans-serif" font-size="${fontSize * 2.4}" font-weight="800" letter-spacing="${letterSpacing}" fill="${fg}" text-anchor="middle" dominant-baseline="middle" filter="url(#sh)" opacity="0.3">${label}</text>
  <text x="100" y="105" font-family="'Inter', 'Helvetica Neue', sans-serif" font-size="${fontSize * 2.4}" font-weight="800" letter-spacing="${letterSpacing}" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>
`
}

for (const [slug, cfg] of Object.entries(TEXT_LOGOS)) {
  const content = svg(cfg)
  writeFileSync(resolve(OUT, `${slug}.svg`), content, 'utf-8')
  console.log(`✓ ${slug}.svg (${content.length} bytes)`)
}
console.log(`\n${Object.keys(TEXT_LOGOS).length} marka için premium text-SVG üretildi.`)
