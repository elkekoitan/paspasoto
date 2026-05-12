/**
 * MatPhoto — Top-down EVA paspas base fotoğrafı + instant color overlay.
 *
 * **Mimari** (Lloyd-style layered composite):
 *   1. Base: gerçek EVA paspas fotoğrafı (mats/base/{setSlug}.webp + AVIF)
 *   2. Renk katmanı: mix-blend-mode: multiply ile renk overlay'i
 *      → "siyah" için overlay yok (transparent), diğer renkler için colorHex
 *
 * **Instant değişim**: `key` veya fade YOK — `src` sabit, sadece overlay rengi
 * değişiyor. Tıklamadan değişime <16ms (bir frame).
 *
 * Latency araştırması: preload all variants + DOM swap (no remount, no fade).
 */

export type MatPhotoProps = {
  setSlug: string
  textureSlug: 'diamond'
  colorSlug: string
  colorHex?: string
  fallback?: string
}

const BASE = '/assets/mats/base'

/** colorSlug → overlay rengi. "siyah" için overlay yok (boş string). */
const OVERLAY: Record<string, string> = {
  siyah: '',
  gri: '#8a8a8e',
  fume: '#3a3a40',
  mavi: '#1e3a8a',
  taba: '#8a5a3a',
  kirmizi: '#b91c1c',
  kahve: '#4a2a1a',
  bordo: '#6b1f2e',
  bej: '#d9c8a8',
  'turuncu-taba': '#c8612a',
}

export default function MatPhoto({
  setSlug,
  colorSlug,
  colorHex,
  fallback = '/assets/mats/hero-stack.webp',
}: MatPhotoProps) {
  const baseUrl = `${BASE}/${setSlug || 'classic-paw-full'}.webp`
  const avifUrl = `${BASE}/${setSlug || 'classic-paw-full'}.avif`
  const overlayColor = OVERLAY[colorSlug] ?? colorHex ?? ''

  return (
    <div class="absolute inset-0 grid place-items-center">
      {/* Base EVA paspas fotoğrafı — sabit, değişmez */}
      <picture class="block size-full">
        <source srcSet={avifUrl} type="image/avif" />
        <img
          src={baseUrl}
          alt=""
          loading="eager"
          decoding="sync"
          fetchpriority="high"
          class="size-full object-contain"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement
            if (!img.src.endsWith(fallback)) img.src = fallback
          }}
        />
      </picture>

      {/* Renk overlay — sadece colorHex/OVERLAY değişir, DOM remount YOK */}
      {overlayColor && (
        <div
          class="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: overlayColor,
            mixBlendMode: 'multiply',
            transition: 'background-color 120ms ease-out',
          }}
          aria-hidden
        />
      )}

      {/* Floor shadow */}
      <div
        class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-8 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.45), transparent 70%)',
          filter: 'blur(12px)',
        }}
        aria-hidden
      />
    </div>
  )
}
