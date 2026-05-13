/**
 * MatPreview — Tertemiz, tek odaklı paspas önizleme.
 *
 * Top-down araç içinde 2/4/5 paspas. Her paspas tam iki katmanlı:
 *   1. DIŞ KATMAN: kenarlık (border color) — net, kalın çevre konturu
 *   2. İÇ KATMAN: paspas dolgusu (mat color) — gradient ile dokulu
 *
 * Sadece bu iki şey değişir: mat hex + border hex.
 * Hiçbir başka overlay yok (logo/heel/texture kaldırıldı — bu component sade kalır).
 */
import type { Product, MatColor, BorderColor } from '../../../lib/catalog'

type Props = {
  product: Product
  matColor: MatColor
  borderColor: BorderColor
  /** İsteğe bağlı boyut sınıfı; varsayılan: full-width aspect 5/4 */
  className?: string
}

export default function MatPreview({ product, matColor, borderColor, className }: Props) {
  return (
    <div class={className ?? 'w-full'}>
      <div class="aspect-[5/4] rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 p-6 ring-1 ring-stone-800">
        <CarWithMats product={product} matHex={matColor.hex} borderHex={borderColor.hex} />
      </div>

      {/* Açıklama bandı */}
      <div class="mt-3 flex items-center justify-between gap-3 px-1">
        <ColorChip label="Paspas" hex={matColor.hex} name={matColor.name} />
        <div class="text-stone-600 text-xs">+</div>
        <ColorChip label="Kenarlık" hex={borderColor.hex} name={borderColor.name} />
        <div class="ml-auto text-xs text-stone-400">
          {product.parts} parça {product.includesTrunk ? '· bagaj' : ''}
        </div>
      </div>
    </div>
  )
}

function ColorChip({ label, hex, name }: { label: string; hex: string; name: string }) {
  return (
    <div class="flex items-center gap-2">
      <div class="size-4 rounded-full ring-1 ring-stone-700" style={{ background: hex }} />
      <div class="text-xs">
        <span class="text-stone-500">{label}:</span>{' '}
        <span class="text-stone-200 font-medium">{name}</span>
      </div>
    </div>
  )
}

/**
 * Araç top-down silüeti + her paspas (mat dolgu + border konturu).
 *
 * Border görünürlüğü için iki katmanlı render:
 *  - Dış path/rect: borderHex, biraz büyük
 *  - İç path/rect: matHex, ortalanmış, 4-5px kenarda border görünür kalsın
 */
function CarWithMats({
  product,
  matHex,
  borderHex,
}: {
  product: Product
  matHex: string
  borderHex: string
}) {
  const showFront = product.parts >= 2
  const showRear = product.parts >= 4
  const showTrunk = product.includesTrunk

  return (
    <svg viewBox="0 0 320 260" class="w-full h-full" aria-label="Paspas önizleme">
      <defs>
        {/* Mat gradient — gerçekçi diamond/dokulu hissi */}
        <radialGradient id="matFill" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stop-color={lighten(matHex, 20)} />
          <stop offset="55%" stop-color={matHex} />
          <stop offset="100%" stop-color={darken(matHex, 18)} />
        </radialGradient>

        {/* Diamond pattern overlay */}
        <pattern id="diamondPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={lighten(matHex, 8)} stroke-width="0.6" opacity="0.35" />
        </pattern>
      </defs>

      {/* === ARAÇ GÖVDESİ === */}
      <g>
        {/* Ana gövde */}
        <rect x="40" y="20" width="240" height="220" rx="42" fill="#15151b" stroke="#2e2e36" stroke-width="2" />

        {/* Ön cam */}
        <path d="M58 64 Q160 56 262 64 L254 96 Q160 90 66 96 Z" fill="#0a0a0e" opacity="0.85" />
        <path d="M58 64 Q160 56 262 64 L254 96 Q160 90 66 96 Z" fill="none" stroke="#2a2a32" stroke-width="0.8" />

        {/* Arka cam */}
        <path d="M58 198 Q160 206 262 198 L254 168 Q160 174 66 168 Z" fill="#0a0a0e" opacity="0.85" />
        <path d="M58 198 Q160 206 262 198 L254 168 Q160 174 66 168 Z" fill="none" stroke="#2a2a32" stroke-width="0.8" />

        {/* Orta direk çizgisi (ön/arka arasında) */}
        <line x1="48" y1="132" x2="80" y2="132" stroke="#26262e" stroke-width="1" />
        <line x1="240" y1="132" x2="272" y2="132" stroke="#26262e" stroke-width="1" />

        {/* Yan dikiş (gövde detayı) */}
        <line x1="44" y1="64" x2="44" y2="196" stroke="#22222a" stroke-width="0.6" />
        <line x1="276" y1="64" x2="276" y2="196" stroke="#22222a" stroke-width="0.6" />
      </g>

      {/* === PASPASLAR === */}
      {showFront && (
        <>
          {/* Sürücü (sol ön) */}
          <Mat x={80} y={102} w={62} h={58} matHex={matHex} borderHex={borderHex} variant="front-left" />
          {/* Yolcu (sağ ön) */}
          <Mat x={178} y={102} w={62} h={58} matHex={matHex} borderHex={borderHex} variant="front-right" />
        </>
      )}

      {showRear && (
        <>
          {/* Arka sol */}
          <Mat x={80} y={172} w={62} h={50} matHex={matHex} borderHex={borderHex} variant="rear-left" />
          {/* Arka sağ */}
          <Mat x={178} y={172} w={62} h={50} matHex={matHex} borderHex={borderHex} variant="rear-right" />
        </>
      )}

      {showTrunk && (
        /* Bagaj — geniş ve alçak */
        <Mat x={108} y={224} w={104} h={14} matHex={matHex} borderHex={borderHex} variant="trunk" />
      )}

      {/* Tekerlek nokta işaretleri (gerçekçi detay) */}
      <circle cx="50" cy="48" r="3" fill="#08080c" />
      <circle cx="270" cy="48" r="3" fill="#08080c" />
      <circle cx="50" cy="212" r="3" fill="#08080c" />
      <circle cx="270" cy="212" r="3" fill="#08080c" />
    </svg>
  )
}

/**
 * Tek bir paspas — net iki katmanlı.
 *
 *   ┌─ borderHex (DIŞ, kalın çerçeve) ─┐
 *   │  ┌── matHex (İÇ dolgu) ───┐     │
 *   │  │                        │     │
 *   │  └────────────────────────┘     │
 *   └──────────────────────────────────┘
 *
 * Border kalınlığı: 5px (paspas boyutunun ~%8'i — net görünür).
 */
function Mat({
  x,
  y,
  w,
  h,
  matHex,
  borderHex,
  variant,
}: {
  x: number
  y: number
  w: number
  h: number
  matHex: string
  borderHex: string
  variant: 'front-left' | 'front-right' | 'rear-left' | 'rear-right' | 'trunk'
}) {
  const BORDER_W = 5 // px — kenarlık genişliği
  const RX = 6

  return (
    <g>
      {/* DIŞ KATMAN — kenarlık */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={RX}
        fill={borderHex}
        stroke={darken(borderHex, 12)}
        stroke-width="1"
      />

      {/* İÇ KATMAN — mat dolgu (border genişliği kadar inset) */}
      <rect
        x={x + BORDER_W}
        y={y + BORDER_W}
        width={w - BORDER_W * 2}
        height={h - BORDER_W * 2}
        rx={Math.max(2, RX - 2)}
        fill="url(#matFill)"
      />

      {/* Diamond doku */}
      <rect
        x={x + BORDER_W}
        y={y + BORDER_W}
        width={w - BORDER_W * 2}
        height={h - BORDER_W * 2}
        rx={Math.max(2, RX - 2)}
        fill="url(#diamondPattern)"
      />

      {/* Stitching — paspas-kenarlık birleşim noktasında ince beyaz dikiş çizgisi */}
      <rect
        x={x + BORDER_W - 0.5}
        y={y + BORDER_W - 0.5}
        width={w - (BORDER_W - 0.5) * 2}
        height={h - (BORDER_W - 0.5) * 2}
        rx={Math.max(2, RX - 1.5)}
        fill="none"
        stroke={lighten(borderHex, 35)}
        stroke-width="0.4"
        stroke-dasharray="1.5 1.5"
        opacity="0.5"
      />

      {/* Sürücü tarafı için pedal alanı işareti (sadece görsel detay) */}
      {variant === 'front-left' && (
        <ellipse
          cx={x + w * 0.62}
          cy={y + h * 0.78}
          rx={w * 0.18}
          ry={h * 0.1}
          fill={darken(matHex, 18)}
          opacity="0.45"
        />
      )}
    </g>
  )
}

function lighten(hex: string, amt: number): string {
  return shiftHex(hex, amt)
}
function darken(hex: string, amt: number): string {
  return shiftHex(hex, -amt)
}
function shiftHex(hex: string, amt: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = Math.max(0, Math.min(255, parseInt(full.slice(0, 2), 16) + amt))
  const g = Math.max(0, Math.min(255, parseInt(full.slice(2, 4), 16) + amt))
  const b = Math.max(0, Math.min(255, parseInt(full.slice(4, 6), 16) + amt))
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}
