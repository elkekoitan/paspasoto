/**
 * HeelPadOverlay — Topukluk PNG (drop-shadow ile paspas yüzeyine "çakılmış" hissi).
 */

export type HeelPosition = 'driver-only' | 'passenger-only' | 'both' | 'none'

export type HeelPadOverlayProps = {
  heelSlug: string | null
  position: HeelPosition
  setSlug: string
}

const COORDS: Record<string, { driver: [number, number]; passenger: [number, number] }> = {
  'classic-paw-front': { driver: [22, 28], passenger: [78, 28] },
  'classic-paw-full': { driver: [22, 22], passenger: [78, 22] },
  default: { driver: [25, 30], passenger: [75, 30] },
}

const HEEL_DIR = '/assets/heel-pads'

export default function HeelPadOverlay({ heelSlug, position, setSlug }: HeelPadOverlayProps) {
  if (!heelSlug || position === 'none') return null

  const coords = COORDS[setSlug] ?? COORDS.default
  const positions: Array<'driver' | 'passenger'> =
    position === 'both' ? ['driver', 'passenger']
    : position === 'driver-only' ? ['driver']
    : position === 'passenger-only' ? ['passenger']
    : []

  const key = `heel-${heelSlug}-${position}-${setSlug}`

  return (
    <div key={key} class="preview-fade absolute inset-0 pointer-events-none">
      {positions.map((p) => {
        const [x, y] = coords[p]
        return (
          <img
            key={p}
            src={`${HEEL_DIR}/${heelSlug}.webp`}
            alt=""
            class="absolute w-[14%] aspect-[2/1] object-contain"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.4))',
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
