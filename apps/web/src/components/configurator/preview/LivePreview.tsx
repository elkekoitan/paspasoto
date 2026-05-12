/**
 * LivePreview — Konfigüratör katmanlı canlı önizleme container'ı.
 *
 * Z-index katmanları (primeeva-inspired):
 *   z=0  → Sahne arkaplan (radial)
 *   z=10 → Floor shadow
 *   z=20 → MatPhoto (set tipi + doku + renk)
 *   z=30 → BorderOverlay (SVG biye, mix-blend-mode: multiply)
 *   z=40 → HeelPadOverlay (sürücü/yolcu konum)
 *   z=50 → LogoOverlay (paspas başına 3×3 grid)
 *   z=60 → Üst rozetler (Canlı Önizleme + araç adı)
 *
 * Container `#configurator-preview` id'siyle html2canvas ile yakalanabilir.
 */
import MatPhoto from './MatPhoto'
import BorderOverlay from './BorderOverlay'
import HeelPadOverlay, { type HeelPosition } from './HeelPadOverlay'
import LogoOverlay, { type EmblemType } from './LogoOverlay'
import type { LogoPlacement, MatPosition } from '../Configurator'

export type LivePreviewProps = {
  /** Set tipi: 'classic-paw-front' | 'classic-paw-full' */
  setSlug: string
  /** Doku: sadece diamond */
  textureSlug: 'diamond'
  /** Mat renk slug */
  matColorSlug: string
  /** Mat renk hex */
  matColorHex?: string
  /** Kenarlık hex */
  borderHex: string
  /** Topukluk slug (asset adı) — null = topukluk yok */
  heelSlug: string | null
  heelPosition: HeelPosition
  /** Logo'lar */
  logos: Array<{
    position: MatPosition
    brandSlug: string | null
    placement: LogoPlacement
    orientation?: 'horizontal' | 'vertical'
  }>
  emblemType: EmblemType
  /** Araç adı (üst rozet) */
  vehicleLabel?: string
  /** Kompakt mod (mobile scroll'da küçülmüş) */
  compact?: boolean
}

export default function LivePreview({
  setSlug,
  textureSlug,
  matColorSlug,
  matColorHex,
  borderHex,
  heelSlug,
  heelPosition,
  logos,
  emblemType,
  vehicleLabel,
  compact = false,
}: LivePreviewProps) {
  return (
    <div
      id="configurator-preview"
      class={[
        'relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)]',
        compact ? 'aspect-[16/9]' : 'aspect-[4/3]',
        'transition-[aspect-ratio] duration-300',
      ].join(' ')}
    >
      {/* z=0: Sahne arkaplan */}
      <div
        class="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 30%, #1a1a22, #0b0b0f 85%)',
        }}
        aria-hidden
      />

      {/* z=10: Soft floor */}
      <div
        class="absolute inset-0 opacity-25"
        style={{
          background:
            'radial-gradient(ellipse 60% 30% at 50% 95%, rgba(0,0,0,0.6), transparent 60%)',
        }}
        aria-hidden
      />

      {/* z=20: Mat photo */}
      <div class="absolute inset-[6%] z-20">
        <MatPhoto
          setSlug={setSlug}
          textureSlug={textureSlug}
          colorSlug={matColorSlug}
          colorHex={matColorHex}
        />
      </div>

      {/* z=30: Border overlay */}
      <div class="absolute inset-[6%] z-30">
        <BorderOverlay setSlug={setSlug} borderHex={borderHex} />
      </div>

      {/* z=40: Heel pad */}
      <div class="absolute inset-[6%] z-40">
        <HeelPadOverlay heelSlug={heelSlug} position={heelPosition} setSlug={setSlug} />
      </div>

      {/* z=50: Logo'lar */}
      <div class="absolute inset-[6%] z-50">
        <LogoOverlay logos={logos} emblemType={emblemType} setSlug={setSlug} />
      </div>

      {/* z=60: Üst rozetler */}
      <div class="absolute top-3 left-3 right-3 z-60 flex items-center justify-between gap-2 pointer-events-none">
        <span class="px-2.5 py-1 rounded-full bg-[var(--color-bg)]/70 backdrop-blur-md ring-1 ring-white/10 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] font-semibold inline-flex items-center gap-1.5">
          <span class="size-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
          Canlı Önizleme
        </span>
        {vehicleLabel && (
          <span class="px-2.5 py-1 rounded-full bg-[var(--color-bg)]/70 backdrop-blur-md ring-1 ring-white/10 text-[10px] tracking-wider text-[var(--color-text-soft)] font-medium truncate max-w-[60%]">
            {vehicleLabel}
          </span>
        )}
      </div>
    </div>
  )
}
