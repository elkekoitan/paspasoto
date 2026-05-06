/**
 * PaspasOto logo'sundan favicon + PWA ikonları + OG image üretir.
 * Source: apps/web/public/logo.svg
 *
 * Çalıştır: `node scripts/generate-icons.mjs`
 */
import sharp from 'sharp'
import { readFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PUBLIC = resolve(ROOT, 'apps/web/public')
const ICON_DIR = resolve(PUBLIC, 'icons')

await mkdir(ICON_DIR, { recursive: true })

const LOGO_SVG = await readFile(resolve(PUBLIC, 'logo.svg'))

// Maskable padding wrapper (logo padlenmeli safe-area için)
function maskableSvg(size) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#0B0B0F"/>
    <g transform="translate(${size * 0.15}, ${size * 0.15}) scale(${(size * 0.7) / 400})">
      ${LOGO_SVG.toString().replace(/<\?xml[^?]+\?>/, '').replace(/<svg[^>]+>/, '').replace(/<\/svg>/, '')}
    </g>
  </svg>`)
}

// Standard (no padding) wrapper - rounded square bg
function standardSvg(size, radius = 0.18) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * radius}" fill="#0B0B0F"/>
    <g transform="translate(${size * 0.06}, ${size * 0.06}) scale(${(size * 0.88) / 400})">
      ${LOGO_SVG.toString().replace(/<\?xml[^?]+\?>/, '').replace(/<svg[^>]+>/, '').replace(/<\/svg>/, '')}
    </g>
  </svg>`)
}

const tasks = [
  { name: 'icon-192.png', size: 192, mode: 'standard' },
  { name: 'icon-512.png', size: 512, mode: 'standard' },
  { name: 'icon-maskable-512.png', size: 512, mode: 'maskable' },
  { name: 'short-config.png', size: 96, mode: 'standard' },
  { name: 'short-track.png', size: 96, mode: 'standard' },
  { name: 'apple-touch-icon.png', size: 180, mode: 'standard' },
]

for (const t of tasks) {
  const svg = t.mode === 'maskable' ? maskableSvg(t.size) : standardSvg(t.size)
  await sharp(svg).png().toFile(resolve(ICON_DIR, t.name))
  console.log(`✓ icons/${t.name}`)
}

// Favicon SVG -> kopyala (root favicon olarak)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0B0B0F"/>
  <g transform="translate(2,2) scale(0.07)">
    ${LOGO_SVG.toString().replace(/<\?xml[^?]+\?>/, '').replace(/<svg[^>]+>/, '').replace(/<\/svg>/, '')}
  </g>
</svg>`
await sharp(Buffer.from(faviconSvg)).png().resize(64, 64).toFile(resolve(PUBLIC, 'favicon-64.png'))
console.log('✓ favicon-64.png')

// OG image — 1200x630, dramatic
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g" cx="30%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#D4923A" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#0B0B0F" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E5A75A"/>
      <stop offset="100%" stop-color="#D4923A"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0B0B0F"/>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <g transform="translate(800, 100) scale(0.95)">
    ${LOGO_SVG.toString().replace(/<\?xml[^?]+\?>/, '').replace(/<svg[^>]+>/, '').replace(/<\/svg>/, '')}
  </g>
  <text x="80" y="280" font-family="Inter, sans-serif" font-size="64" font-weight="800" fill="url(#goldText)">PaspasOto</text>
  <text x="80" y="370" font-family="Inter, sans-serif" font-size="48" font-weight="600" fill="#F4EDE0">Aracına özel,</text>
  <text x="80" y="430" font-family="Inter, sans-serif" font-size="48" font-weight="600" fill="#F4EDE0">atölyemizden kapına.</text>
  <text x="80" y="530" font-family="Inter, sans-serif" font-size="22" font-weight="500" fill="#8E8E94">3D Havuzlu Oto Paspas · Konya</text>
</svg>`

await mkdir(resolve(PUBLIC, 'assets'), { recursive: true })
await sharp(Buffer.from(og)).jpeg({ quality: 88 }).toFile(resolve(PUBLIC, 'assets', 'og-default.jpg'))
console.log('✓ assets/og-default.jpg')

console.log('\nDone.')
