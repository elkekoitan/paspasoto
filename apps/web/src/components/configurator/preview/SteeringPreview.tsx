/**
 * SteeringPreview — direksiyon kılıfı için canlı SVG önizleme.
 *
 * Render edilen öğeler:
 *  - 3-spoke rim (jant) + spokes (kollar) + center emblem (orta)
 *  - Materyal dokusu (suni deri, hakiki deri, alcantara, silikon)
 *  - Desen overlay (sport/klasik/perforated/karbon/diamond)
 *  - Stitching dasharray rim boyunca
 *  - Marka logosu merkez (opsiyonel)
 *  - Sport ↔ Standart toggle (flat-bottom vs full-circle)
 */
import { useState } from 'preact/hooks'
import type { SteeringSize, SteeringPattern, SteeringMaterial } from '../../../lib/catalog-steering'
import type { Brand } from '../../../lib/catalog'

type Style = 'standard' | 'flat-bottom'

interface Props {
  size: SteeringSize
  pattern: SteeringPattern
  material: SteeringMaterial
  brand?: Brand | null
}

export default function SteeringPreview({ size, pattern, material, brand }: Props) {
  const [style, setStyle] = useState<Style>('standard')
  const baseHex = material.textureHex || '#1a1a20'
  const stitchingHex = pattern.slug === 'diamond-stitch' || pattern.slug === 'sport' ? '#c9a86a' : darken(baseHex, 30)
  const showPerforation = pattern.slug === 'perforated' || material.slug === 'alcantara'
  const showCarbon = pattern.slug === 'carbon'
  const showDiamond = pattern.slug === 'diamond-stitch'

  return (
    <div class="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#15151b] via-[#0e0e14] to-[#1a1a22] aspect-[4/3] ring-1 ring-white/10">
      {/* Stüdyo ışık */}
      <div
        class="absolute inset-0"
        style="background: radial-gradient(ellipse 70% 60% at 50% 35%, rgba(255,255,255,0.10), transparent 70%);"
        aria-hidden="true"
      />

      {/* Yer gölgesi */}
      <div
        class="absolute bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-2 rounded-full opacity-60"
        style="background: radial-gradient(ellipse, rgba(0,0,0,0.7), transparent 70%); filter: blur(6px);"
        aria-hidden="true"
      />

      <svg
        viewBox="0 0 400 400"
        class="relative z-10 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`${size.name} ${pattern.name} ${material.name} direksiyon önizleme`}
        style="transition: transform 0.3s ease;"
      >
        <defs>
          {/* Rim materyal gradient */}
          <linearGradient id="rim-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color={lighten(baseHex, 22)} />
            <stop offset="50%" stop-color={baseHex} />
            <stop offset="100%" stop-color={darken(baseHex, 28)} />
          </linearGradient>

          {/* Karbon dokusu pattern */}
          {showCarbon && (
            <pattern id="carbon-weave" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill={darken(baseHex, 20)} />
              <rect x="4" y="4" width="4" height="4" fill={darken(baseHex, 20)} />
              <rect x="4" y="0" width="4" height="4" fill={lighten(baseHex, 5)} />
              <rect x="0" y="4" width="4" height="4" fill={lighten(baseHex, 5)} />
            </pattern>
          )}

          {/* Perforated dot pattern */}
          {showPerforation && (
            <pattern id="perforated" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="0.7" fill={darken(baseHex, 50)} opacity="0.5" />
            </pattern>
          )}

          {/* Diamond quilt pattern */}
          {showDiamond && (
            <pattern id="diamond" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="16" y2="0" stroke={stitchingHex} stroke-width="0.6" stroke-dasharray="2 2" opacity="0.6" />
              <line x1="0" y1="8" x2="16" y2="8" stroke={stitchingHex} stroke-width="0.6" stroke-dasharray="2 2" opacity="0.6" />
            </pattern>
          )}

          {/* Highlight glaze */}
          <linearGradient id="rim-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
            <stop offset="100%" stop-color="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Mask: rim alanı (sadece jant doku gösterilsin) */}
          <mask id="rim-only">
            {style === 'flat-bottom' ? (
              <>
                <circle cx="200" cy="200" r="150" fill="white" />
                <circle cx="200" cy="200" r="110" fill="black" />
                <rect x="120" y="298" width="160" height="55" fill="black" />
              </>
            ) : (
              <>
                <circle cx="200" cy="200" r="150" fill="white" />
                <circle cx="200" cy="200" r="110" fill="black" />
              </>
            )}
          </mask>
        </defs>

        {/* RIM (jant) — base */}
        {style === 'flat-bottom' ? (
          <g mask="url(#rim-only)">
            <circle cx="200" cy="200" r="150" fill="url(#rim-fill)" />
          </g>
        ) : (
          <g mask="url(#rim-only)">
            <circle cx="200" cy="200" r="150" fill="url(#rim-fill)" />
          </g>
        )}

        {/* Pattern overlays */}
        {showCarbon && (
          <g mask="url(#rim-only)">
            <circle cx="200" cy="200" r="150" fill="url(#carbon-weave)" />
          </g>
        )}
        {showPerforation && (
          <g mask="url(#rim-only)">
            <circle cx="200" cy="200" r="150" fill="url(#perforated)" />
          </g>
        )}
        {showDiamond && (
          <g mask="url(#rim-only)">
            <circle cx="200" cy="200" r="150" fill="url(#diamond)" />
          </g>
        )}

        {/* Highlight glaze (üst yarısına) */}
        <g mask="url(#rim-only)" opacity="0.7">
          <rect x="50" y="50" width="300" height="150" fill="url(#rim-highlight)" />
        </g>

        {/* Stitching — iç + dış kenar */}
        <circle cx="200" cy="200" r="148" fill="none" stroke={stitchingHex} stroke-width="0.8" stroke-dasharray="3 4" opacity="0.85" />
        <circle cx="200" cy="200" r="112" fill="none" stroke={stitchingHex} stroke-width="0.8" stroke-dasharray="3 4" opacity="0.85" />

        {/* Spokes (kollar) — 3-spoke layout */}
        <g fill={darken(baseHex, 50)} stroke={darken(baseHex, 70)} stroke-width="1">
          {/* Üst spoke */}
          <path d="M 188 80 L 212 80 L 218 145 L 182 145 Z" />
          {/* Sol-alt spoke */}
          <path d="M 110 290 L 130 270 L 175 230 L 175 270 Z" />
          {/* Sağ-alt spoke */}
          <path d="M 290 290 L 270 270 L 225 230 L 225 270 Z" />
        </g>

        {/* Center hub (göbek) */}
        <circle cx="200" cy="200" r="38" fill={darken(baseHex, 40)} stroke={darken(baseHex, 70)} stroke-width="1" />
        <circle cx="200" cy="200" r="32" fill={darken(baseHex, 50)} />
        <circle cx="200" cy="180" r="32" fill="url(#rim-highlight)" opacity="0.5" />

        {/* Marka emblemi (orta) */}
        {brand ? (
          <g>
            <circle cx="200" cy="200" r="18" fill={brand.color || '#666'} opacity="0.85" />
            <text
              x="200"
              y="206"
              text-anchor="middle"
              font-size="13"
              font-weight="700"
              fill="#fff"
              font-family="system-ui, sans-serif"
            >
              {brand.name.charAt(0)}
            </text>
          </g>
        ) : (
          <g>
            <circle cx="200" cy="200" r="18" fill="#1a1a20" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
            <circle cx="200" cy="200" r="4" fill="rgba(255,255,255,0.3)" />
          </g>
        )}

        {/* Flat-bottom kesik (sport) gösterimi */}
        {style === 'flat-bottom' && (
          <line x1="120" y1="305" x2="280" y2="305" stroke={stitchingHex} stroke-width="0.8" stroke-dasharray="3 4" opacity="0.85" />
        )}
      </svg>

      {/* Style toggle */}
      <div class="absolute top-3 left-3 flex gap-1.5 z-20">
        <button
          type="button"
          onClick={() => setStyle('standard')}
          class={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${
            style === 'standard' ? 'bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-primary)]' : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
          }`}
        >
          Standart
        </button>
        <button
          type="button"
          onClick={() => setStyle('flat-bottom')}
          class={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${
            style === 'flat-bottom' ? 'bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-primary)]' : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
          }`}
        >
          Sport (D)
        </button>
      </div>

      {/* Boyut etiketi (üst sağ) */}
      <div class="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur text-[10px] font-medium text-white/85 z-20">
        {size.name} · {size.diameterCm}
      </div>

      {/* Alt etiket */}
      <div class="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold whitespace-nowrap z-20">
        {pattern.name} · {material.name}
      </div>
    </div>
  )
}

function lighten(hex: string, percent: number): string {
  const c = parseHex(hex)
  return rgbToHex({
    r: Math.min(255, Math.round(c.r + (255 - c.r) * (percent / 100))),
    g: Math.min(255, Math.round(c.g + (255 - c.g) * (percent / 100))),
    b: Math.min(255, Math.round(c.b + (255 - c.b) * (percent / 100))),
  })
}
function darken(hex: string, percent: number): string {
  const c = parseHex(hex)
  return rgbToHex({
    r: Math.max(0, Math.round(c.r * (1 - percent / 100))),
    g: Math.max(0, Math.round(c.g * (1 - percent / 100))),
    b: Math.max(0, Math.round(c.b * (1 - percent / 100))),
  })
}
function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}
function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
