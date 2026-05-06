/**
 * PaspasOto PWA + favicon ikonlarını "P" logo ile sharp kullanarak üretir.
 * Lansman öncesi gerçek logo ile değiştirilecek.
 *
 * Çalıştır: `node scripts/generate-icons.mjs`
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const ICON_DIR = resolve(ROOT, 'apps/web/public/icons')

await mkdir(ICON_DIR, { recursive: true })

const BG = '#0B0B0F'
const FG = '#D4923A'

function svg(size, padding = 0.18, maskable = false) {
  const radius = maskable ? 0 : Math.round(size * 0.22)
  const fontSize = Math.round(size * (maskable ? 0.5 : 0.62))
  const cx = size / 2
  const cy = Math.round(size * 0.5 + fontSize * 0.34)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
  <text x="${cx}" y="${cy}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="800" fill="${FG}">P</text>
</svg>`
}

const tasks = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'short-config.png', size: 96 },
  { name: 'short-track.png', size: 96 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'og-default.jpg', size: 1200, height: 630, isOg: true },
]

for (const t of tasks) {
  if (t.isOg) {
    const og = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${t.size}" height="${t.height}" viewBox="0 0 ${t.size} ${t.height}">
  <defs>
    <radialGradient id="g" cx="30%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#D4923A" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#0B0B0F" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="${BG}"/>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="80" y="280" font-family="Inter, sans-serif" font-size="56" font-weight="800" fill="${FG}">PaspasOto</text>
  <text x="80" y="380" font-family="Inter, sans-serif" font-size="48" font-weight="600" fill="#F4EDE0">Aracına özel,</text>
  <text x="80" y="450" font-family="Inter, sans-serif" font-size="48" font-weight="600" fill="#F4EDE0">atölyemizden kapına.</text>
  <text x="80" y="540" font-family="Inter, sans-serif" font-size="22" font-weight="500" fill="#8E8E94">3D Havuzlu Oto Paspas · Konya</text>
</svg>`
    await sharp(Buffer.from(og)).jpeg({ quality: 88 }).toFile(resolve(ROOT, 'apps/web/public/assets', t.name))
    console.log(`✓ ${t.name}`)
    continue
  }
  const buf = Buffer.from(svg(t.size, 0.18, !!t.maskable))
  await sharp(buf).png().toFile(resolve(ICON_DIR, t.name))
  console.log(`✓ icons/${t.name}`)
}

// Favicon ICO is replaced by favicon.svg, no .ico needed for modern browsers.
console.log('Done.')
