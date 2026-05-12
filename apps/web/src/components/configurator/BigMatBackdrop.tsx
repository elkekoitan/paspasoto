/**
 * BigMatBackdrop — Full-screen EVA paspas önizleme arkaplanı.
 *
 * **Mimari karar (kullanıcı isteği üzerine):**
 *   - Eski VirtualShowroom (Three.js 3D cylinder mesh) kaldırıldı
 *   - Onun yerine flat tam ekran yüksek çözünürlüklü EVA paspas fotoğrafı
 *   - Mat rengi: per-color foto varyantı varsa onu kullan, yoksa base + mix-blend overlay
 *   - Kenarlık rengi: SVG outline overlay (mix-blend multiply, anında değişim)
 *   - Heel pad + logo: küçük overlay'ler (LivePreview component'leri tekrar kullanılır)
 *
 * **Asset slotları:**
 *   /assets/mats/hero/{colorSlug}.webp — AI veya stüdyo çekimi per-color
 *     → Varsa: doğrudan kullan (mix-blend kapalı)
 *     → Yoksa: hero-default.webp + mix-blend-mode multiply (matColorHex)
 *   /assets/mats/hero/default.webp — base photo (siyah/nötr)
 *
 * **Instant değişim:** key/fade YOK. src swap + style update → <16ms tepki.
 */

export type BigMatBackdropProps = {
  matColorSlug: string
  matColorHex: string
  borderHex: string
  /** Set tipi — outline SVG seçimi için (front/full) */
  setSlug?: string
  /** Subtle parallax efekti için mouse hareketi etkin mi (opsiyonel) */
  parallax?: boolean
}

const HERO_BASE = '/assets/mats/hero'

/**
 * colorSlug için varyant foto var mı? Build-time'da kullanıcı/AI ürettiğinde
 * bu liste güncellenecek. Şu an boş — base + mix-blend kullanılır.
 */
const VARIANT_AVAILABLE: Record<string, boolean> = {
  siyah: true,
  // Aşağıdaki renkler için per-color Gemini fotoları üretildikçe burası true yapılır
  // gri: true,
  // fume: true,
  // mavi: true,
  // taba: true,
  // kirmizi: true,
  // kahve: true,
  // bordo: true,
  // bej: true,
  // 'turuncu-taba': true,
}

/** Mat color slug → mix-blend overlay rengi (siyah için overlay yok) */
const MAT_OVERLAY: Record<string, string> = {
  siyah: '',
  gri: '#7a7a80',
  fume: '#3a3a40',
  mavi: '#1e3a8a',
  taba: '#8a5a3a',
  kirmizi: '#b91c1c',
  kahve: '#4a2a1a',
  bordo: '#6b1f2e',
  bej: '#d9c8a8',
  'turuncu-taba': '#c8612a',
}

export default function BigMatBackdrop({
  matColorSlug,
  matColorHex,
  borderHex,
}: BigMatBackdropProps) {
  const hasVariant = VARIANT_AVAILABLE[matColorSlug] === true
  const photoUrl = hasVariant
    ? `${HERO_BASE}/${matColorSlug}.webp`
    : `${HERO_BASE}/default.webp`

  // Variant foto yoksa renk overlay (siyah için boş)
  const overlayColor = hasVariant ? '' : (MAT_OVERLAY[matColorSlug] ?? matColorHex ?? '')

  return (
    <div class="absolute inset-0 overflow-hidden bg-[#0b0b0f]" aria-hidden>
      {/* z=0: Base mat fotoğrafı — tam ekran */}
      <picture class="absolute inset-0 block">
        <source srcSet={`${HERO_BASE}/${hasVariant ? matColorSlug : 'default'}.avif`} type="image/avif" />
        <img
          src={photoUrl}
          alt=""
          loading="eager"
          decoding="sync"
          fetchpriority="high"
          class="size-full object-cover"
          onError={(e) => {
            // Hero foto henüz yüklenmemiş → fallback: hero-stack (eski)
            const img = e.currentTarget as HTMLImageElement
            if (!img.src.includes('hero-stack')) img.src = '/assets/mats/hero-stack.webp'
          }}
        />
      </picture>

      {/* z=10: Mat color overlay (per-color varyant foto yoksa) */}
      {overlayColor && (
        <div
          class="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: overlayColor,
            mixBlendMode: 'multiply',
            transition: 'background-color 100ms ease-out',
          }}
        />
      )}

      {/* z=20: Vignette/atmosphere */}
      <div
        class="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* z=30: Border color overlay — SVG outline (paspas dış kenarına biye olarak) */}
      {/* Geçici: tam ekran rounded-rect border. İleride per-set SVG path */}
      <svg
        class="absolute inset-0 size-full pointer-events-none"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ mixBlendMode: 'multiply' }}
      >
        {/* Geniş, paspas yüzeyini çerçeveleyen biye */}
        <rect
          x="160"
          y="120"
          width="1280"
          height="660"
          rx="60"
          ry="60"
          fill="none"
          stroke={borderHex}
          stroke-width="38"
          stroke-linejoin="round"
          style={{ transition: 'stroke 100ms ease-out' }}
        />
      </svg>

      {/* z=40: Karartma — UI okunabilirliği için yan/alt taraf */}
      <div class="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/85 via-transparent to-black/20" />
      <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    </div>
  )
}
