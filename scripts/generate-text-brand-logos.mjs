#!/usr/bin/env node
/**
 * filippofilip95'te 403 dönen veya hiç olmayan markalar için
 * marka renginde, kaliteli text-bazlı SVG logo üret.
 *
 * Boş veya placeholder yerine doğru renkli, profesyonel görünür logo verir.
 */
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'apps/web/public/assets/brands')

// slug → { label, bgColor, textColor }
const TEXT_LOGOS = {
  voyah: { label: 'VOYAH', bg: '#1A1A1A', fg: '#D4AF37' },
  tank: { label: 'TANK', bg: '#2B2B2B', fg: '#E0E0E0' },
  jaecoo: { label: 'JAECOO', bg: '#1B5E20', fg: '#F5F5F5' },
  gac: { label: 'GAC', bg: '#C8102E', fg: '#FFFFFF' },
  dfsk: { label: 'DFSK', bg: '#003F87', fg: '#FFFFFF' },
  baic: { label: 'BAIC', bg: '#E60012', fg: '#FFFFFF' },
  skywell: { label: 'SKYWELL', bg: '#0066B3', fg: '#FFFFFF' },
  karsan: { label: 'KARSAN', bg: '#003F87', fg: '#FFFFFF' },
  otokar: { label: 'OTOKAR', bg: '#E30613', fg: '#FFFFFF' },
  temsa: { label: 'TEMSA', bg: '#003F87', fg: '#FFFFFF' },
  bmc: { label: 'BMC', bg: '#1F1F1F', fg: '#FFC107' },
  anadol: { label: 'ANADOL', bg: '#8B4513', fg: '#F5DEB3' },
  // Bunları da güncelleyelim (zayıf placeholder olanlar)
  tofas: { label: 'TOFAŞ', bg: '#E30613', fg: '#FFFFFF' },
}

function svg({ label, bg, fg }) {
  const fontSize = label.length > 6 ? 4.5 : 5.5
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${label}">
  <rect width="100" height="100" rx="14" fill="${bg}"/>
  <text x="50" y="55" font-family="Inter, Arial, sans-serif" font-size="${fontSize * 3}" font-weight="800" letter-spacing="-0.5" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>
`
}

for (const [slug, cfg] of Object.entries(TEXT_LOGOS)) {
  const content = svg(cfg)
  writeFileSync(resolve(OUT, `${slug}.svg`), content, 'utf-8')
  console.log(`✓ ${slug}.svg (${content.length} bytes)`)
}
console.log(`\n${Object.keys(TEXT_LOGOS).length} marka için text-SVG logo üretildi.`)
