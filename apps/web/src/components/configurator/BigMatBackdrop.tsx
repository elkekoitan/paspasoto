/**
 * BigMatBackdrop — Full-screen EVA paspas önizleme arkaplanı.
 *
 * **Yeni yapı (kullanıcı isteği):**
 * - SVG silüet bazlı net sınırlar — foto değil
 * - Paspas dolgusu: matColorHex (anında değişir)
 * - Kenarlık: borderHex stroke (anında değişir)
 * - Diamond doku: SVG pattern overlay
 * - Set tipine göre silüet:
 *     '4lu-set'    → 2 ön (sürücü/yolcu) + 2 arka
 *     '5li-set'    → 4 paspas + 1 bagaj
 *     'bagaj-only' → tek bagaj dikdörtgeni
 *
 * **Instant değişim:** SVG attribute swap → <16ms tepki, hiç fetch yok.
 */

export type BigMatBackdropProps = {
  matColorSlug: string
  matColorHex: string
  borderHex: string
  /** Set tipi: '4lu-set' | '5li-set' | 'bagaj-only' veya legacy değerler */
  setSlug?: string
}

/**
 * Set tipi → paspas silüet konfigürasyonu.
 * Her item: { x, y, w, h, rx?, label? } — viewBox 1600×900 koordinatları.
 */
type MatShape = { x: number; y: number; w: number; h: number; rx?: number; label?: string }

function shapesForSet(setSlug: string): MatShape[] {
  // Sadece bagaj
  if (setSlug === 'bagaj-only' || setSlug?.includes('trunk')) {
    return [
      { x: 400, y: 250, w: 800, h: 400, rx: 30, label: 'Bagaj' },
    ]
  }
  // 4'lü set: 2 ön + 2 arka
  if (setSlug === '4lu-set' || setSlug === 'classic-paw-front') {
    return [
      // Ön sıra
      { x: 200, y: 180, w: 520, h: 280, rx: 24, label: 'Sürücü' },
      { x: 880, y: 180, w: 520, h: 280, rx: 24, label: 'Yolcu' },
      // Arka sıra
      { x: 280, y: 500, w: 440, h: 220, rx: 20, label: 'Sol Arka' },
      { x: 880, y: 500, w: 440, h: 220, rx: 20, label: 'Sağ Arka' },
    ]
  }
  // Default = 5'li (4 paspas + bagaj)
  return [
    // Ön sıra
    { x: 130, y: 140, w: 480, h: 240, rx: 24, label: 'Sürücü' },
    { x: 990, y: 140, w: 480, h: 240, rx: 24, label: 'Yolcu' },
    // Arka sıra
    { x: 200, y: 410, w: 410, h: 200, rx: 20, label: 'Sol Arka' },
    { x: 990, y: 410, w: 410, h: 200, rx: 20, label: 'Sağ Arka' },
    // Bagaj (altta)
    { x: 480, y: 640, w: 640, h: 200, rx: 20, label: 'Bagaj' },
  ]
}

export default function BigMatBackdrop({
  matColorSlug,
  matColorHex,
  borderHex,
  setSlug = '5li-set',
}: BigMatBackdropProps) {
  const shapes = shapesForSet(setSlug)
  const matFill = matColorHex || '#15151a'
  const stroke = borderHex || '#0a0a12'

  return (
    <div id="configurator-preview" class="absolute inset-0 overflow-hidden bg-[#0b0b0f]" aria-hidden>
      {/* z=0: Atmosfer arkaplan — derinlik + ışık vurgusu */}
      <div
        class="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 35%, #1f1f28 0%, #0b0b0f 75%)',
        }}
      />

      {/* z=20: SVG paspas silüetleri — net sınırlar, anlık renk */}
      <svg
        class="absolute inset-0 size-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Diamond doku pattern — paspas yüzeyinde ince çapraz çizgi */}
          <pattern id="diamondTexture" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="16" height="16" fill="transparent" />
            <line x1="0" y1="8" x2="16" y2="8" stroke="rgba(0,0,0,0.18)" stroke-width="1" />
            <line x1="8" y1="0" x2="8" y2="16" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
          </pattern>

          {/* Soft shadow filter (paspasın altına) */}
          <filter id="matShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            <feOffset dx="0" dy="10" />
            <feComponentTransfer><feFuncA type="linear" slope="0.45" /></feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tüm paspas silüetleri */}
        {shapes.map((s) => (
          <g key={`${s.x}-${s.y}`} filter="url(#matShadow)">
            {/* 1. Dolgu (mat rengi) */}
            <rect
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={s.rx ?? 20}
              ry={s.rx ?? 20}
              fill={matFill}
              style={{ transition: 'fill 120ms ease-out' }}
            />
            {/* 2. Diamond doku — paspas yüzeyinde */}
            <rect
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={s.rx ?? 20}
              ry={s.rx ?? 20}
              fill="url(#diamondTexture)"
            />
            {/* 3. Kenarlık (biye) — anlık renk değişimi */}
            <rect
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={s.rx ?? 20}
              ry={s.rx ?? 20}
              fill="none"
              stroke={stroke}
              stroke-width="14"
              style={{ transition: 'stroke 120ms ease-out' }}
            />
            {/* 4. Vignette gloss — paspas iç parlaklığı */}
            <rect
              x={s.x + 8}
              y={s.y + 8}
              width={s.w - 16}
              height={s.h - 16}
              rx={(s.rx ?? 20) - 6}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              stroke-width="3"
            />
          </g>
        ))}
      </svg>

      {/* z=40: Karartma — UI okunabilirliği için (panel arkası) */}
      <div class="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/90 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/85 md:via-transparent md:to-black/20" />
      <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-transparent to-transparent" />
    </div>
  )
}
