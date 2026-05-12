/**
 * MatPhoto — Top-down EVA paspas base fotoğrafı.
 *
 * Strateji:
 *   - Renk varyant fotoğrafı varsa (public/assets/mats/colors/{slug}.webp) onu kullan
 *   - Yoksa siyah base + CSS filter (hue-rotate + saturate + brightness) ile yaklaşık renk
 *   - 300ms fade-in (key-based remount, saf CSS keyframe)
 */

export type MatPhotoProps = {
  setSlug: string
  textureSlug: 'diamond'
  colorSlug: string
  colorHex?: string
  fallback?: string
}

const COLOR_FILTERS: Record<string, string> = {
  siyah: 'none',
  gri: 'brightness(1.6) contrast(0.9)',
  kahverengi: 'sepia(0.6) hue-rotate(-15deg) saturate(1.4) brightness(1.1)',
  kirmizi: 'sepia(1) hue-rotate(-50deg) saturate(4) brightness(0.85)',
  mavi: 'hue-rotate(200deg) saturate(2) brightness(1.1)',
  lacivert: 'hue-rotate(220deg) saturate(1.8) brightness(0.6)',
  sari: 'sepia(0.8) hue-rotate(0deg) saturate(3) brightness(1.4)',
  beyaz: 'brightness(2.4) contrast(0.7) saturate(0.3)',
  krem: 'sepia(0.3) brightness(2.1) contrast(0.8) saturate(0.6)',
}

const BASE = '/assets/mats/base'

export default function MatPhoto({
  setSlug,
  textureSlug,
  colorSlug,
  fallback = '/assets/mats/hero-stack.webp',
}: MatPhotoProps) {
  const baseUrl = `${BASE}/${setSlug || 'classic-paw-full'}.webp`
  const avifUrl = `${BASE}/${setSlug || 'classic-paw-full'}.avif`
  const textureOverlay = `/assets/textures/${textureSlug}.svg`
  const filter = COLOR_FILTERS[colorSlug] ?? 'none'
  const key = `${setSlug}-${textureSlug}-${colorSlug}`

  return (
    <div class="absolute inset-0 grid place-items-center">
      <picture key={key} class="preview-fade block size-full">
        <source srcSet={avifUrl} type="image/avif" />
        <img
          src={baseUrl}
          alt=""
          loading="eager"
          decoding="async"
          class="size-full object-contain"
          style={{
            filter,
            backgroundImage: `url(${textureOverlay})`,
            backgroundBlendMode: 'multiply',
            backgroundSize: '120px',
          }}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement
            if (!img.src.endsWith(fallback)) img.src = fallback
          }}
        />
      </picture>
      <div
        class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-8 rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.45), transparent 70%)',
          filter: 'blur(12px)',
        }}
        aria-hidden
      />
    </div>
  )
}
