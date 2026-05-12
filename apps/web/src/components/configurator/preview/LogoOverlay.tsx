/**
 * LogoOverlay — Paspas başına marka logo PNG'leri (3×3 grid pozisyon).
 */
import type { LogoPlacement, MatPosition } from '../Configurator'

export type EmblemType = 'metal' | 'premium' | 'metal-plate' | 'premium-leather'

export type LogoOverlayProps = {
  logos: Array<{
    position: MatPosition
    brandSlug: string | null
    placement: LogoPlacement
    orientation?: 'horizontal' | 'vertical'
  }>
  emblemType: EmblemType
  setSlug: string
}

const MAT_BOUNDS: Record<string, Partial<Record<MatPosition, { x: number; y: number; w: number; h: number }>>> = {
  'classic-paw-front': {
    driver: { x: 15, y: 18, w: 32, h: 64 },
    passenger: { x: 69, y: 18, w: 32, h: 64 },
  },
  'classic-paw-full': {
    driver: { x: 14, y: 12, w: 28, h: 38 },
    passenger: { x: 68, y: 12, w: 28, h: 38 },
    leftRear: { x: 14, y: 56, w: 22, h: 32 },
    rightRear: { x: 68, y: 56, w: 22, h: 32 },
    trunk: { x: 32, y: 70, w: 36, h: 20 },
  },
  default: {
    driver: { x: 14, y: 18, w: 30, h: 60 },
    passenger: { x: 68, y: 18, w: 30, h: 60 },
  },
}

function placementOffset(placement: LogoPlacement): { x: number; y: number } {
  const norm = placement.includes('-') ? placement : `${placement}-center`
  const [vert, horiz] = norm.split('-') as ['top' | 'middle' | 'bottom', 'left' | 'center' | 'right']
  const x = horiz === 'left' ? 25 : horiz === 'right' ? 75 : 50
  const y = vert === 'top' ? 25 : vert === 'bottom' ? 75 : 50
  return { x, y }
}

export default function LogoOverlay({ logos, emblemType, setSlug }: LogoOverlayProps) {
  if (!logos || logos.length === 0) return null

  const dir = emblemType === 'metal' || emblemType === 'metal-plate' ? 'metal' : 'premium'
  const bounds = MAT_BOUNDS[setSlug] ?? MAT_BOUNDS.default

  const key = `logos-${emblemType}-${setSlug}-${logos.map((l) => `${l.position}:${l.brandSlug}:${l.placement}`).join('|')}`

  return (
    <div key={key} class="preview-fade absolute inset-0 pointer-events-none">
      {logos.map((l) => {
        if (!l.brandSlug) return null
        const b = bounds[l.position]
        if (!b) return null
        const off = placementOffset(l.placement)
        const left = b.x + (off.x / 100) * b.w
        const top = b.y + (off.y / 100) * b.h
        const rotate = l.orientation === 'vertical' ? '90deg' : '0deg'

        return (
          <img
            key={`${l.position}-${l.brandSlug}-${l.placement}`}
            src={`/assets/logos/${dir}/${l.brandSlug}.webp`}
            alt=""
            class="absolute object-contain"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: '8%',
              height: 'auto',
              transform: `translate(-50%, -50%) rotate(${rotate})`,
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))',
            }}
            loading="eager"
            decoding="async"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        )
      })}
    </div>
  )
}
