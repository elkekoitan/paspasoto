/**
 * SeatPreview — koltuk kılıfı için canlı SVG önizleme.
 *
 * Render edilen öğeler:
 *  - Koltuk gövdesi (body) + başlık (headrest) + yan kanat (bolster)
 *  - Materyal rengi `color.hex` ile dolgu
 *  - Materyal dokusu — `material.textureHex` küçük noktalı pattern (alcantara/perforated)
 *  - Kenar dikiş (piping) — stitching dasharray
 *  - Marka logosu (opsiyonel) başlıkta nakış
 *  - Yan ↔ ön profil toggle (basit)
 *
 * Tasarım Tesla/BMW/Audi configurator preview pattern'ine yakın:
 * stüdyo zemin gradient + soft shadow + dramatic light overlay.
 */
import { useState } from 'preact/hooks'
import type { SeatMaterial, SeatColor, SeatSet } from '../../../lib/catalog-seat'
import type { Brand } from '../../../lib/catalog'

type View = 'side' | 'front'

interface Props {
  set: SeatSet
  material: SeatMaterial
  color: SeatColor
  brand: Brand | null
  /** Optional kontrast dikiş rengi (varsayılan: krem) */
  pipingHex?: string
}

export default function SeatPreview({ set, material, color, brand, pipingHex }: Props) {
  const [view, setView] = useState<View>('side')

  // Materyal dokusu — perforated/alcantara için noktalı pattern göster
  const showPerforation = material.slug === 'mesh' || material.slug?.includes('alcantara')
  const isLeather = material.slug?.includes('leather') || material.slug?.includes('deri')
  const piping = pipingHex ?? (color.hex.toLowerCase() === '#000000' ? '#c9a86a' : '#1a1a20')

  return (
    <div class="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#15151b] via-[#0e0e14] to-[#1a1a22] aspect-[4/3] ring-1 ring-white/10">
      {/* Stüdyo ışık ovali */}
      <div
        class="absolute inset-0"
        style="background: radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.08), transparent 70%);"
        aria-hidden="true"
      />

      {/* Yer gölgesi (alta) */}
      <div
        class="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/5 h-2 rounded-full opacity-50"
        style="background: radial-gradient(ellipse, rgba(0,0,0,0.6), transparent 70%); filter: blur(8px);"
        aria-hidden="true"
      />

      {/* SVG koltuk illustration */}
      <svg
        viewBox="0 0 400 300"
        class="relative z-10 w-full h-full transition-opacity duration-300"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`${color.name} ${material.name} koltuk önizleme`}
      >
        <defs>
          {/* Materyal renk gradient — soft cinematic light */}
          <linearGradient id="seat-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color={lighten(color.hex, 18)} />
            <stop offset="50%" stop-color={color.hex} />
            <stop offset="100%" stop-color={darken(color.hex, 22)} />
          </linearGradient>

          {/* Perforated noktalı pattern (alcantara/mesh için) */}
          {showPerforation && (
            <pattern id="perforation" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="0.6" fill={darken(color.hex, 35)} opacity="0.45" />
            </pattern>
          )}

          {/* Deri damar pattern */}
          {isLeather && (
            <pattern id="leather-grain" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="0.25" fill={lighten(color.hex, 6)} opacity="0.3" />
            </pattern>
          )}

          {/* Highlight glaze */}
          <linearGradient id="seat-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.35)" />
            <stop offset="40%" stop-color="rgba(255,255,255,0.05)" />
            <stop offset="100%" stop-color="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {view === 'side' ? <SeatSide piping={piping} showPerforation={showPerforation} isLeather={isLeather} /> : <SeatFront piping={piping} showPerforation={showPerforation} isLeather={isLeather} />}

        {/* Marka rozetinin koltuk başlığında nakışı (sadece brand seçilmişse) */}
        {brand && view === 'side' && (
          <g opacity="0.85">
            <rect x="115" y="42" width="22" height="22" rx="11" fill={piping} />
            <text x="126" y="58" font-size="9" font-weight="700" fill={color.hex} text-anchor="middle" font-family="system-ui, sans-serif">
              {brand.name.charAt(0)}
            </text>
          </g>
        )}
        {brand && view === 'front' && (
          <g opacity="0.85">
            <rect x="180" y="38" width="40" height="14" rx="2" fill={piping} />
            <text x="200" y="48" font-size="9" font-weight="700" fill={color.hex} text-anchor="middle" font-family="system-ui, sans-serif">
              {brand.name.toUpperCase().slice(0, 6)}
            </text>
          </g>
        )}
      </svg>

      {/* View toggle + meta info */}
      <div class="absolute top-3 left-3 flex gap-1.5 z-20">
        <button
          type="button"
          onClick={() => setView('side')}
          class={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${
            view === 'side' ? 'bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-primary)]' : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
          }`}
        >
          Yan
        </button>
        <button
          type="button"
          onClick={() => setView('front')}
          class={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${
            view === 'front' ? 'bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-primary)]' : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
          }`}
        >
          Ön
        </button>
      </div>

      {/* Set + parça etiketi */}
      <div class="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur text-[10px] font-medium text-white/85 z-20">
        {set.parts} parça
      </div>

      {/* Alt etiket */}
      <div class="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold whitespace-nowrap z-20">
        {material.name} · {color.name}
      </div>
    </div>
  )
}

/** Yan profil koltuk SVG — 3 bölge (gövde, başlık, bolster) */
function SeatSide({ piping, showPerforation, isLeather }: { piping: string; showPerforation: boolean; isLeather: boolean }) {
  const fill = 'url(#seat-fill)'
  return (
    <g transform="translate(0, 0)">
      {/* Koltuk ayağı (sadelik için kısa stick) */}
      <rect x="155" y="245" width="8" height="22" fill="#1a1a20" rx="1" />
      <ellipse cx="159" cy="270" rx="22" ry="3" fill="#000" opacity="0.4" />

      {/* Gövde (oturma minderi) */}
      <path
        d="M 80 200 Q 80 180 100 175 L 230 175 Q 245 180 245 195 L 245 240 Q 245 250 235 250 L 90 250 Q 80 250 80 240 Z"
        fill={fill}
        stroke={piping}
        stroke-width="1.5"
      />
      {/* Doku overlay */}
      {showPerforation && (
        <path
          d="M 85 195 L 240 195 L 240 248 L 85 248 Z"
          fill="url(#perforation)"
        />
      )}
      {isLeather && (
        <path
          d="M 85 195 L 240 195 L 240 248 L 85 248 Z"
          fill="url(#leather-grain)"
        />
      )}
      {/* Highlight glaze */}
      <path
        d="M 80 200 Q 80 180 100 175 L 230 175 Q 245 180 245 195 L 245 215 L 80 215 Z"
        fill="url(#seat-highlight)"
      />
      {/* Stitching */}
      <path d="M 85 200 L 240 200" stroke={piping} stroke-width="1" stroke-dasharray="2 3" fill="none" opacity="0.7" />
      <path d="M 85 245 L 240 245" stroke={piping} stroke-width="1" stroke-dasharray="2 3" fill="none" opacity="0.7" />

      {/* Sırt (back rest) */}
      <path
        d="M 95 50 Q 95 35 110 30 L 145 22 Q 165 20 165 40 L 165 175 L 95 175 Z"
        fill={fill}
        stroke={piping}
        stroke-width="1.5"
      />
      {showPerforation && (
        <path d="M 100 50 L 160 35 L 160 170 L 100 170 Z" fill="url(#perforation)" />
      )}
      {isLeather && (
        <path d="M 100 50 L 160 35 L 160 170 L 100 170 Z" fill="url(#leather-grain)" />
      )}
      <path d="M 95 50 Q 95 35 110 30 L 145 22 Q 165 20 165 40" fill="url(#seat-highlight)" />
      {/* Yan stitching */}
      <path d="M 100 50 L 100 170" stroke={piping} stroke-width="1" stroke-dasharray="2 3" fill="none" opacity="0.7" />
      <path d="M 162 40 L 162 170" stroke={piping} stroke-width="1" stroke-dasharray="2 3" fill="none" opacity="0.7" />

      {/* Başlık (headrest) */}
      <path
        d="M 110 25 Q 110 5 130 5 L 142 5 Q 152 5 152 22 L 152 40 L 110 40 Z"
        fill={fill}
        stroke={piping}
        stroke-width="1.5"
      />
      {/* Headrest kollar (rod) */}
      <line x1="118" y1="22" x2="118" y2="38" stroke="#0a0a0a" stroke-width="1.5" />
      <line x1="144" y1="22" x2="144" y2="38" stroke="#0a0a0a" stroke-width="1.5" />

      {/* Bolster (yan kanat) — sırt sağında */}
      <path
        d="M 165 50 Q 175 50 178 70 L 178 165 Q 175 175 165 175 Z"
        fill={fill}
        stroke={piping}
        stroke-width="1"
        opacity="0.95"
      />
      <path d="M 168 60 L 175 60 L 175 170 L 168 170 Z" fill="url(#seat-highlight)" opacity="0.4" />
    </g>
  )
}

/** Ön profil koltuk SVG */
function SeatFront({ piping, showPerforation, isLeather }: { piping: string; showPerforation: boolean; isLeather: boolean }) {
  const fill = 'url(#seat-fill)'
  return (
    <g>
      {/* Yer gölgesi */}
      <ellipse cx="200" cy="270" rx="80" ry="4" fill="#000" opacity="0.4" />

      {/* Oturma minderi */}
      <path
        d="M 130 230 Q 130 210 145 205 L 255 205 Q 270 210 270 225 L 270 260 Q 270 268 260 268 L 140 268 Q 130 268 130 258 Z"
        fill={fill}
        stroke={piping}
        stroke-width="1.5"
      />
      {showPerforation && <path d="M 135 215 L 265 215 L 265 265 L 135 265 Z" fill="url(#perforation)" />}
      {isLeather && <path d="M 135 215 L 265 215 L 265 265 L 135 265 Z" fill="url(#leather-grain)" />}

      {/* Sırt (önden bakış) */}
      <path
        d="M 145 70 Q 145 45 165 45 L 235 45 Q 255 45 255 70 L 255 205 L 145 205 Z"
        fill={fill}
        stroke={piping}
        stroke-width="1.5"
      />
      {showPerforation && <path d="M 152 70 L 248 70 L 248 200 L 152 200 Z" fill="url(#perforation)" />}
      {isLeather && <path d="M 152 70 L 248 70 L 248 200 L 152 200 Z" fill="url(#leather-grain)" />}
      <path d="M 145 70 Q 145 45 165 45 L 235 45 Q 255 45 255 70 L 255 100 L 145 100 Z" fill="url(#seat-highlight)" />

      {/* Yan kanatlar (bolster) — sol/sağ */}
      <path d="M 145 70 L 165 75 L 165 200 L 145 200 Z" fill={fill} stroke={piping} stroke-width="1" opacity="0.92" />
      <path d="M 255 70 L 235 75 L 235 200 L 255 200 Z" fill={fill} stroke={piping} stroke-width="1" opacity="0.92" />

      {/* Stitching merkez kanal */}
      <path d="M 200 75 L 200 200" stroke={piping} stroke-width="1" stroke-dasharray="2 3" fill="none" opacity="0.6" />

      {/* Başlık */}
      <path
        d="M 175 45 Q 175 18 195 18 L 215 18 Q 225 18 225 45 Z"
        fill={fill}
        stroke={piping}
        stroke-width="1.5"
      />
      <line x1="183" y1="38" x2="183" y2="48" stroke="#0a0a0a" stroke-width="1.5" />
      <line x1="217" y1="38" x2="217" y2="48" stroke="#0a0a0a" stroke-width="1.5" />
    </g>
  )
}

/** Hex rengi açma (% miktar kadar lighten) */
function lighten(hex: string, percent: number): string {
  const c = parseHex(hex)
  return rgbToHex({
    r: Math.min(255, Math.round(c.r + (255 - c.r) * (percent / 100))),
    g: Math.min(255, Math.round(c.g + (255 - c.g) * (percent / 100))),
    b: Math.min(255, Math.round(c.b + (255 - c.b) * (percent / 100))),
  })
}

/** Hex rengi koyulaştırma */
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
