/**
 * Yüksek-çözünürlüklü prosedürel doku üretici.
 *
 * 3D havuzlu paspasın ikonik honeycomb (oval hücreli) pattern'ini SVG ile çiz,
 * sharp ile 1200x900 webp'e dönüştür. Mevcut küçük crop'ların yerini alır.
 *
 *  - mat-{slug}.webp        — paspas zemini (honeycomb)
 *  - border-{slug}.webp     — kenarlık (kabartma karbon dokulu)
 *  - heel-{slug}.webp       — topukluk (varyasyona göre karbon/dot/leather)
 *
 * Çalıştır: `node scripts/generate-textures.mjs`
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SWATCH = resolve(ROOT, 'apps/web/public/assets/swatches')
const HEEL = resolve(ROOT, 'apps/web/public/assets/heel-pads')

await mkdir(SWATCH, { recursive: true })
await mkdir(HEEL, { recursive: true })

const W = 1200
const H = 900

/** Hex color shade — pozitif: lighten (white'a yaklaştır), negatif: darken. */
function shade(hex, percent) {
  const f = parseInt(hex.slice(1), 16)
  const t = percent < 0 ? 0 : 255
  const p = Math.abs(percent) / 100
  const R = f >> 16
  const G = (f >> 8) & 0x00ff
  const B = f & 0x0000ff
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  )
}

/** Honeycomb 3D paspas zemin SVG'si (oval hücreler, hafif rotasyonla). */
function honeycombSvg(base) {
  const dark = shade(base, -28)
  const darker = shade(base, -45)
  const light = shade(base, 18)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <pattern id="honey" patternUnits="userSpaceOnUse" width="26" height="44" patternTransform="rotate(14)">
        <rect width="26" height="44" fill="${base}"/>
        <ellipse cx="7" cy="11" rx="5.6" ry="8" fill="${darker}"/>
        <ellipse cx="7" cy="11" rx="4" ry="6.5" fill="${dark}"/>
        <ellipse cx="6.5" cy="9.5" rx="2.2" ry="3" fill="${shade(base, 8)}" opacity="0.5"/>
        <ellipse cx="20" cy="33" rx="5.6" ry="8" fill="${darker}"/>
        <ellipse cx="20" cy="33" rx="4" ry="6.5" fill="${dark}"/>
        <ellipse cx="19.5" cy="31.5" rx="2.2" ry="3" fill="${shade(base, 8)}" opacity="0.5"/>
      </pattern>
      <radialGradient id="vg" cx="50%" cy="40%" r="80%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.10)"/>
        <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.45)"/>
      </radialGradient>
      <linearGradient id="hg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.06)"/>
        <stop offset="50%" stop-color="rgba(255,255,255,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.18)"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${base}"/>
    <rect width="${W}" height="${H}" fill="url(#honey)"/>
    <rect width="${W}" height="${H}" fill="url(#hg)"/>
    <rect width="${W}" height="${H}" fill="url(#vg)"/>
  </svg>`
}

/** Kenarlık — fine grain + subtle leather texture. */
function borderSvg(base) {
  const dark = shade(base, -22)
  const light = shade(base, 12)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="2.5" numOctaves="2" seed="3"/>
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.16 0"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>
      <filter id="leather">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="6"/>
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>
      <radialGradient id="bvg" cx="50%" cy="50%" r="75%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.10)"/>
        <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${base}"/>
    <rect width="${W}" height="${H}" fill="${light}" filter="url(#leather)"/>
    <rect width="${W}" height="${H}" fill="${dark}" filter="url(#grain)"/>
    <rect width="${W}" height="${H}" fill="url(#bvg)"/>
  </svg>`
}

/** Topukluk dokuları — farklı stiller. */
function heelSvg(style, base) {
  const dark = shade(base, -30)
  const light = shade(base, 30)

  if (style === 'carbon') {
    // Karbon fiber dokuma
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <pattern id="weave" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
          <rect width="14" height="14" fill="${base}"/>
          <rect x="0" y="0" width="7" height="7" fill="${dark}"/>
          <rect x="7" y="7" width="7" height="7" fill="${dark}"/>
          <rect x="0" y="0" width="7" height="7" fill="url(#hi1)" opacity="0.5"/>
          <rect x="7" y="7" width="7" height="7" fill="url(#hi1)" opacity="0.5"/>
        </pattern>
        <linearGradient id="hi1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </linearGradient>
        <radialGradient id="cvg" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.08)"/>
          <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="${base}"/>
      <rect width="${W}" height="${H}" fill="url(#weave)"/>
      <rect width="${W}" height="${H}" fill="url(#cvg)"/>
    </svg>`
  }

  if (style === 'metallic') {
    // Metalik gümüş, brushed
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="brush" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${shade(base, -10)}"/>
          <stop offset="50%" stop-color="${shade(base, 20)}"/>
          <stop offset="100%" stop-color="${shade(base, -10)}"/>
        </linearGradient>
        <filter id="brushed">
          <feTurbulence type="turbulence" baseFrequency="0.05 8" numOctaves="2" seed="1"/>
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.18 0"/>
          <feComposite in2="SourceGraphic" operator="in"/>
        </filter>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#brush)"/>
      <rect width="${W}" height="${H}" fill="${base}" filter="url(#brushed)"/>
    </svg>`
  }

  // Default: dot pattern (siyah/beyaz/krem/mavi/kırmızı/turuncu noktalı)
  const dotColor = light
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill="${base}"/>
        <circle cx="10" cy="10" r="3.5" fill="${dotColor}"/>
        <circle cx="10" cy="10" r="2" fill="${shade(base, -20)}"/>
        <circle cx="9.5" cy="9.5" r="0.8" fill="${shade(base, 50)}" opacity="0.7"/>
      </pattern>
      <radialGradient id="dvg" cx="50%" cy="40%" r="80%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.08)"/>
        <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.45)"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${base}"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
    <rect width="${W}" height="${H}" fill="url(#dvg)"/>
  </svg>`
}

/* ----------- Paspas zemin renkleri (10 swatch) ----------- */
const MAT_COLORS = [
  ['siyah', '#15151a'],
  ['gri', '#5a5a60'],
  ['fume', '#3a3a40'],
  ['mavi', '#1a3768'],
  ['taba', '#8a5a3a'],
  ['kirmizi', '#8b1c1c'],
  ['kahve', '#3e241a'],
  ['bordo', '#5b1a25'],
  ['bej', '#caa67e'],
  ['turuncu-taba', '#b86628'],
]

for (const [slug, hex] of MAT_COLORS) {
  const svg = Buffer.from(honeycombSvg(hex))
  await sharp(svg).webp({ quality: 88 }).toFile(resolve(SWATCH, `mat-${slug}.webp`))
  console.log(`✓ swatches/mat-${slug}.webp`)
}

/* ----------- Kenarlık renkleri (15 swatch) ----------- */
const BORDER_COLORS = [
  ['kahve', '#3e241a'],
  ['taba', '#8a5a3a'],
  ['krem', '#d8c598'],
  ['yesil', '#1f5530'],
  ['sari', '#c79a30'],
  ['turuncu', '#c47025'],
  ['kirmizi', '#a01818'],
  ['mor', '#4d2099'],
  ['lacivert', '#1a1a3e'],
  ['koyu-mavi', '#1c3370'],
  ['turkuaz', '#0e6e84'],
  ['gri', '#65656a'],
  ['fume', '#373740'],
  ['siyah', '#15151a'],
  ['bordo', '#5b1a25'],
]

for (const [slug, hex] of BORDER_COLORS) {
  const svg = Buffer.from(borderSvg(hex))
  await sharp(svg).webp({ quality: 88 }).toFile(resolve(SWATCH, `border-${slug}.webp`))
  console.log(`✓ swatches/border-${slug}.webp`)
}

/* ----------- Topukluk dokuları (8) ----------- */
const HEEL_PADS = [
  ['standart', 'dot', '#1a1a20'],
  ['antrasit-karbon', 'carbon', '#1c1c22'],
  ['beyaz-noktali', 'dot', '#dcdce0'],
  ['mavi-noktali', 'dot', '#1c3370'],
  ['kirmizi-noktali', 'dot', '#8b1c1c'],
  ['krem-noktali', 'dot', '#caa67e'],
  ['siyah-noktali', 'dot', '#15151a'],
  ['turuncu-noktali', 'dot', '#b86628'],
]

for (const [slug, style, hex] of HEEL_PADS) {
  const svg = Buffer.from(heelSvg(style, hex))
  await sharp(svg).webp({ quality: 88 }).toFile(resolve(HEEL, `heel-${slug}.webp`))
  console.log(`✓ heel-pads/heel-${slug}.webp`)
}

console.log(`\n${MAT_COLORS.length + BORDER_COLORS.length + HEEL_PADS.length} adet ${W}x${H} doku üretildi.`)
